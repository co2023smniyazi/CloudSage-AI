from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class LogEntrySchema(BaseModel):
    line_number: int
    timestamp: Optional[str] = None
    level: str # INFO, WARNING, ERROR, CRITICAL
    service: str
    message: str

class ErrorPattern(BaseModel):
    signature: str
    count: int
    level: str
    service: str
    sample: str
    first_seen: Optional[str] = None
    last_seen: Optional[str] = None

class RiskFactor(BaseModel):
    factor: str
    weight: int # 0-100
    score_impact: int
    explanation: str

class ActionableStep(BaseModel):
    step_number: int
    title: str
    command_or_action: str
    rationale: str

class LogAnalysisResponse(BaseModel):
    id: Optional[int] = None
    filename: str
    created_at: datetime
    total_lines: int
    level_counts: Dict[str, int]
    risk_score: int # 0-100
    risk_level: str # LOW, MEDIUM, HIGH, CRITICAL
    explanation_mode: str # "Rule-Based Heuristic" or "AI-Powered"
    summary: str
    root_cause: str
    impact_assessment: str
    confidence_score: int # 0-100
    confirmed_observations: List[str]
    heuristic_hypotheses: List[str]
    patterns: List[ErrorPattern]
    risk_factors: List[RiskFactor]
    recommendations: List[ActionableStep]
    entries_sample: List[LogEntrySchema] = []

class IncidentResponse(BaseModel):
    id: int
    incident_code: str
    analysis_id: Optional[int] = None
    title: str
    severity: str
    status: str
    detected_at: datetime
    service: str
    root_cause: str
    recommendation: str
    log_snippet: str
    notes: Optional[str] = ""

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class IncidentCreate(BaseModel):
    title: str
    severity: str
    service: str
    root_cause: str
    recommendation: str
    log_snippet: str

class HealthResponse(BaseModel):
    status: str
    project: str
    version: str
    database: str
    ai_mode_available: bool
    active_incidents_count: int
    total_analyses_count: int

class SettingsResponse(BaseModel):
    gemini_configured: bool
    openai_configured: bool
    ai_provider: str
    risk_sensitivity: str
    total_incidents: int
    total_analyses: int

class SettingsUpdate(BaseModel):
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    ai_provider: Optional[str] = None
    risk_sensitivity: Optional[str] = None

class SampleLogInfo(BaseModel):
    id: str
    name: str
    description: str
    category: str
    expected_severity: str

