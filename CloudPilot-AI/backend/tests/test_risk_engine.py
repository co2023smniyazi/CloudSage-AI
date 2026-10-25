import pytest
from backend.services.risk_engine import RiskEngine
from backend.models.schemas import ErrorPattern

def test_risk_engine_empty_input():
    score, level, factors, recs = RiskEngine.evaluate(0, {}, [])
    assert score == 0
    assert level == "LOW"
    assert len(factors) > 0
    assert len(recs) > 0

def test_risk_engine_critical_crash():
    level_counts = {"INFO": 5, "WARNING": 2, "ERROR": 4, "CRITICAL": 3}
    patterns = [
        ErrorPattern(
            signature="Container terminated with exit code 137 (OOMKilled)",
            count=3,
            level="CRITICAL",
            service="kubelet",
            sample="CRITICAL Container terminated with exit code 137 (OOMKilled)"
        ),
        ErrorPattern(
            signature="Pod entered CrashLoopBackOff",
            count=4,
            level="ERROR",
            service="kubelet",
            sample="ERROR Pod entered CrashLoopBackOff"
        )
    ]
    score, level, factors, recs = RiskEngine.evaluate(
        total_lines=14,
        level_counts=level_counts,
        patterns=patterns
    )
    assert score >= 70
    assert level in ("HIGH", "CRITICAL")
    assert len(factors) == 4
    assert any("OOM" in r.command_or_action or "memory" in r.command_or_action.lower() for r in recs)

def test_risk_engine_nominal_logs():
    level_counts = {"INFO": 50, "WARNING": 0, "ERROR": 0, "CRITICAL": 0}
    score, level, factors, recs = RiskEngine.evaluate(
        total_lines=50,
        level_counts=level_counts,
        patterns=[]
    )
    assert score <= 10
    assert level == "LOW"

