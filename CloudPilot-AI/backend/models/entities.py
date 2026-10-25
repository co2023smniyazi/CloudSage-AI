from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class AnalysisRecord(Base):
    __tablename__ = "analysis_records"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), default="uploaded_log.txt")
    created_at = Column(DateTime, default=utc_now)
    total_lines = Column(Integer, default=0)
    info_count = Column(Integer, default=0)
    warning_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    risk_score = Column(Integer, default=0)
    risk_level = Column(String(50), default="LOW")
    summary = Column(Text, default="")
    root_cause = Column(Text, default="")
    explanation_mode = Column(String(50), default="Rule-Based Heuristic")
    patterns_json = Column(Text, default="[]")
    risk_factors_json = Column(Text, default="[]")
    recommendations_json = Column(Text, default="[]")
    confidence_score = Column(Integer, default=90) # percentage 0-100

    incidents = relationship("Incident", back_populates="analysis", cascade="all, delete-orphan")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_code = Column(String(50), unique=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analysis_records.id"), nullable=True)
    title = Column(String(255), nullable=False)
    severity = Column(String(50), default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="Open") # Open, Investigating, Resolved
    detected_at = Column(DateTime, default=utc_now)
    service = Column(String(100), default="infrastructure")
    root_cause = Column(Text, default="")
    recommendation = Column(Text, default="")
    log_snippet = Column(Text, default="")
    notes = Column(Text, default="")

    analysis = relationship("AnalysisRecord", back_populates="incidents")


class AppSetting(Base):
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True)
    value = Column(Text, default="")

