import pytest
from backend.services.ai_engine import AIEngine
from backend.models.schemas import ErrorPattern

@pytest.mark.asyncio
async def test_ai_engine_nominal_fallback():
    result = await AIEngine.analyze(
        total_lines=20,
        level_counts={"INFO": 20, "WARNING": 0, "ERROR": 0, "CRITICAL": 0},
        patterns=[],
        raw_snippet="All systems operational",
        risk_score=5,
        risk_level="LOW"
    )
    assert result["explanation_mode"] == "Rule-Based Heuristic"
    assert "healthy" in result["summary"].lower()
    assert len(result["confirmed_observations"]) > 0

@pytest.mark.asyncio
async def test_ai_engine_k8s_fallback():
    patterns = [
        ErrorPattern(
            signature="pod entered CrashLoopBackOff",
            count=5,
            level="CRITICAL",
            service="kubelet",
            sample="CrashLoopBackOff exit code 137 OOMKilled"
        )
    ]
    result = await AIEngine.analyze(
        total_lines=10,
        level_counts={"INFO": 2, "WARNING": 1, "ERROR": 2, "CRITICAL": 5},
        patterns=patterns,
        raw_snippet="Exit code 137 OOMKilled CrashLoopBackOff",
        risk_score=85,
        risk_level="CRITICAL"
    )
    assert "cgroup" in result["root_cause"].lower() or "memory" in result["root_cause"].lower()
    assert result["confidence_score"] >= 80
    assert len(result["recommendations"]) >= 2
    assert "kubectl" in result["recommendations"][0].command_or_action

