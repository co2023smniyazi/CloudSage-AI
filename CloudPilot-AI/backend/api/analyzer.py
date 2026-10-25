import os
import json
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.models.entities import AnalysisRecord, Incident, AppSetting
from backend.models.schemas import (
    LogAnalysisResponse,
    SampleLogInfo,
    ErrorPattern,
    RiskFactor,
    ActionableStep,
    LogEntrySchema
)
from backend.services.log_parser import LogParser
from backend.services.risk_engine import RiskEngine
from backend.services.ai_engine import AIEngine

router = APIRouter(prefix="/logs", tags=["Log Analyzer"])

SAMPLE_LOGS_DIR = Path(__file__).resolve().parent.parent.parent / "sample_logs"

SAMPLE_CATALOG = [
    SampleLogInfo(
        id="k8s-crashloop",
        name="Kubernetes OOMKilled & CrashLoopBackOff",
        description="Container memory exhaustion triggering Linux cgroup OOM killer, exit code 137, and cascading 502 Bad Gateways.",
        category="Kubernetes / Containers",
        expected_severity="CRITICAL"
    ),
    SampleLogInfo(
        id="db-pool-exhaustion",
        name="PostgreSQL Connection Pool Exhaustion",
        description="Database client connection starvation, transaction deadlocks, and upstream 504 Gateway Timeouts.",
        category="Database / Storage",
        expected_severity="HIGH"
    ),
    SampleLogInfo(
        id="auth-service-failure",
        name="API Gateway & Auth Service Timeout",
        description="JWT token validation failure, JWKS public key handshake refusal, and circuit breaker trip.",
        category="Microservices / Security",
        expected_severity="HIGH"
    ),
    SampleLogInfo(
        id="normal-traffic",
        name="Healthy Steady-State Traffic",
        description="Normal HTTP 200 requests, background cron scheduler runs, healthy database checkpoints, and routine heartbeats.",
        category="Baseline Health",
        expected_severity="LOW"
    )
]

def get_next_incident_code(db: Session) -> str:
    count = db.query(Incident).count()
    return f"INC-{1001 + count}"

async def run_full_analysis(
    content: str,
    filename: str,
    db: Session
) -> LogAnalysisResponse:
    if not content or not content.strip():
        raise HTTPException(
            status_code=400,
            detail="The submitted log content is empty. Please provide a valid log stream or file."
        )

    # 1. Parse lines
    entries, level_counts, patterns = LogParser.parse_content(content)
    total_lines = len(entries)

    if total_lines == 0:
        raise HTTPException(
            status_code=400,
            detail="Could not extract any valid log lines from the provided content."
        )

    # 2. Get sensitivity setting
    sensitivity_setting = db.query(AppSetting).filter(AppSetting.key == "risk_sensitivity").first()
    sensitivity = sensitivity_setting.value if sensitivity_setting else "normal"

    # 3. Calculate Risk
    risk_score, risk_level, risk_factors, default_recs = RiskEngine.evaluate(
        total_lines=total_lines,
        level_counts=level_counts,
        patterns=patterns,
        sensitivity=sensitivity
    )

    # 4. Generate AI or Rule-Based Heuristic Explanation
    ai_result = await AIEngine.analyze(
        total_lines=total_lines,
        level_counts=level_counts,
        patterns=patterns,
        raw_snippet=content[:2500],
        risk_score=risk_score,
        risk_level=risk_level
    )

    # Merge recommendations
    recommendations: List[ActionableStep] = ai_result.get("recommendations", [])
    if not recommendations:
        recommendations = default_recs

    # 5. Persist Analysis Record
    record = AnalysisRecord(
        filename=filename,
        total_lines=total_lines,
        info_count=level_counts.get("INFO", 0),
        warning_count=level_counts.get("WARNING", 0),
        error_count=level_counts.get("ERROR", 0),
        critical_count=level_counts.get("CRITICAL", 0),
        risk_score=risk_score,
        risk_level=risk_level,
        summary=ai_result.get("summary", ""),
        root_cause=ai_result.get("root_cause", ""),
        explanation_mode=ai_result.get("explanation_mode", "Rule-Based Heuristic"),
        patterns_json=json.dumps([p.model_dump() for p in patterns]),
        risk_factors_json=json.dumps([f.model_dump() for f in risk_factors]),
        recommendations_json=json.dumps([r.model_dump() for r in recommendations]),
        confidence_score=ai_result.get("confidence_score", 90)
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # 6. Auto-create Incident if HIGH or CRITICAL
    if risk_level in ("HIGH", "CRITICAL") and (level_counts.get("ERROR", 0) + level_counts.get("CRITICAL", 0)) > 0:
        primary_service = patterns[0].service if patterns else "infrastructure"
        primary_pattern = patterns[0].sample if patterns else "High severity operational anomaly"

        inc = Incident(
            incident_code=get_next_incident_code(db),
            analysis_id=record.id,
            title=f"{risk_level} Risk: {primary_service} Failure Detected",
            severity=risk_level,
            status="Open",
            service=primary_service,
            root_cause=ai_result.get("root_cause", "Automated heuristic root cause identification"),
            recommendation=recommendations[0].command_or_action if recommendations else "Inspect active service logs.",
            log_snippet=primary_pattern[:500]
        )
        db.add(inc)
        db.commit()

    return LogAnalysisResponse(
        id=record.id,
        filename=filename,
        created_at=record.created_at,
        total_lines=total_lines,
        level_counts=level_counts,
        risk_score=risk_score,
        risk_level=risk_level,
        explanation_mode=ai_result.get("explanation_mode", "Rule-Based Heuristic"),
        summary=ai_result.get("summary", ""),
        root_cause=ai_result.get("root_cause", ""),
        impact_assessment=ai_result.get("impact_assessment", "Operational impact evaluated based on error severity and frequency."),
        confidence_score=ai_result.get("confidence_score", 90),
        confirmed_observations=ai_result.get("confirmed_observations", []),
        heuristic_hypotheses=ai_result.get("heuristic_hypotheses", []),
        patterns=patterns,
        risk_factors=risk_factors,
        recommendations=recommendations,
        entries_sample=entries[:50] # return first 50 entries for live viewer
    )

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25MB threshold
ALLOWED_EXTENSIONS = {".log", ".txt", ".json", ""}

@router.post("/analyze", response_model=LogAnalysisResponse)
async def analyze_log_file(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    content = ""
    filename = "pasted_log.txt"

    if file and file.filename:
        filename = file.filename
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file extension '{ext}'. Only .log, .txt, and .json files are supported."
            )

        raw_bytes = await file.read()
        if len(raw_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail="Uploaded file exceeds the maximum allowed limit of 25MB."
            )

        try:
            content = raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            content = raw_bytes.decode("latin-1", errors="replace")
    elif raw_text is not None and raw_text != "":
        content = raw_text
    else:
        raise HTTPException(
            status_code=400,
            detail="No log file or text was submitted or content was empty. Please upload a .log/.txt/.json file or paste log text."
        )

    return await run_full_analysis(content, filename, db)

@router.get("/samples", response_model=List[SampleLogInfo])
def list_sample_logs():
    return SAMPLE_CATALOG

@router.post("/samples/{sample_id}/load", response_model=LogAnalysisResponse)
async def load_and_analyze_sample(
    sample_id: str,
    db: Session = Depends(get_db)
):
    sample_file = SAMPLE_LOGS_DIR / f"{sample_id}.log"
    if not sample_file.exists():
        raise HTTPException(status_code=404, detail=f"Sample log '{sample_id}' not found.")

    with open(sample_file, "r", encoding="utf-8") as f:
        content = f.read()

    return await run_full_analysis(content, f"{sample_id}.log", db)
