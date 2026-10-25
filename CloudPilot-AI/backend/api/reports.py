import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.models.entities import AnalysisRecord, Incident
from backend.models.schemas import (
    LogAnalysisResponse,
    ErrorPattern,
    RiskFactor,
    ActionableStep
)
from backend.services.report_generator import ReportGenerator

router = APIRouter(tags=["Reports & Exports"])

def record_to_response(rec: AnalysisRecord) -> LogAnalysisResponse:
    patterns_raw = json.loads(rec.patterns_json or "[]")
    factors_raw = json.loads(rec.risk_factors_json or "[]")
    recs_raw = json.loads(rec.recommendations_json or "[]")

    level_counts = {
        "INFO": rec.info_count,
        "WARNING": rec.warning_count,
        "ERROR": rec.error_count,
        "CRITICAL": rec.critical_count
    }

    return LogAnalysisResponse(
        id=rec.id,
        filename=rec.filename,
        created_at=rec.created_at,
        total_lines=rec.total_lines,
        level_counts=level_counts,
        risk_score=rec.risk_score,
        risk_level=rec.risk_level,
        explanation_mode=rec.explanation_mode,
        summary=rec.summary,
        root_cause=rec.root_cause,
        impact_assessment=f"Assessed {rec.risk_level} operational risk severity across system components.",
        confidence_score=rec.confidence_score,
        confirmed_observations=[
            f"Evaluated {rec.total_lines} log entries from {rec.filename}.",
            f"Recorded {rec.critical_count} critical and {rec.error_count} error events."
        ],
        heuristic_hypotheses=[
            "Service failures are correlated with pattern clustering and resource pressure."
        ],
        patterns=[ErrorPattern(**p) for p in patterns_raw],
        risk_factors=[RiskFactor(**f) for f in factors_raw],
        recommendations=[ActionableStep(**r) for r in recs_raw],
        entries_sample=[]
    )

@router.get("/reports/latest", response_model=LogAnalysisResponse)
def get_latest_report(db: Session = Depends(get_db)):
    rec = db.query(AnalysisRecord).order_by(AnalysisRecord.created_at.desc()).first()
    if not rec:
        raise HTTPException(status_code=404, detail="No analysis records found.")
    return record_to_response(rec)

@router.get("/reports/{analysis_id}", response_model=LogAnalysisResponse)
def get_report_by_id(analysis_id: int, db: Session = Depends(get_db)):
    rec = db.query(AnalysisRecord).filter(AnalysisRecord.id == analysis_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    return record_to_response(rec)

@router.get("/reports/{analysis_id}/export/csv")
def export_analysis_csv(analysis_id: int, db: Session = Depends(get_db)):
    rec = db.query(AnalysisRecord).filter(AnalysisRecord.id == analysis_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    patterns_raw = json.loads(rec.patterns_json or "[]")
    patterns = [ErrorPattern(**p) for p in patterns_raw]
    csv_data = ReportGenerator.generate_patterns_csv(patterns)

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=cloudpilot-patterns-{rec.id}.csv"}
    )

@router.get("/reports/{analysis_id}/export/markdown")
def export_analysis_markdown(analysis_id: int, db: Session = Depends(get_db)):
    rec = db.query(AnalysisRecord).filter(AnalysisRecord.id == analysis_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    resp = record_to_response(rec)
    md = ReportGenerator.generate_executive_markdown(
        filename=resp.filename,
        total_lines=resp.total_lines,
        level_counts=resp.level_counts,
        risk_score=resp.risk_score,
        risk_level=resp.risk_level,
        summary=resp.summary,
        root_cause=resp.root_cause,
        impact=resp.impact_assessment,
        factors=resp.risk_factors,
        recommendations=resp.recommendations
    )

    return Response(
        content=md,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=cloudpilot-report-{rec.id}.md"}
    )

@router.get("/reports/export/incidents-csv")
def export_incidents_csv(db: Session = Depends(get_db)):
    incidents = db.query(Incident).order_by(Incident.detected_at.desc()).all()
    inc_dicts = [
        {
            "incident_code": i.incident_code,
            "title": i.title,
            "severity": i.severity,
            "status": i.status,
            "service": i.service,
            "detected_at": i.detected_at.isoformat() if i.detected_at else "",
            "root_cause": i.root_cause,
            "recommendation": i.recommendation
        }
        for i in incidents
    ]
    csv_data = ReportGenerator.generate_incidents_csv(inc_dicts)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cloudpilot-incidents.csv"}
    )

@router.get("/analysis/history")
def get_analysis_history(db: Session = Depends(get_db)):
    records = db.query(AnalysisRecord).order_by(AnalysisRecord.created_at.desc()).limit(20).all()
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "created_at": r.created_at,
            "risk_score": r.risk_score,
            "risk_level": r.risk_level,
            "total_lines": r.total_lines,
            "critical_count": r.critical_count,
            "error_count": r.error_count,
            "explanation_mode": r.explanation_mode
        }
        for r in records
    ]

