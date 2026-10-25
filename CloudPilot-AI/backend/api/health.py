from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.core.database import get_db
from backend.core.config import settings
from backend.models.entities import Incident, AnalysisRecord
from backend.models.schemas import HealthResponse

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    active_incidents = db.query(Incident).filter(Incident.status != "Resolved").count()
    total_analyses = db.query(AnalysisRecord).count()

    ai_available = bool(settings.GEMINI_API_KEY or settings.OPENAI_API_KEY)

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        project=settings.PROJECT_NAME,
        version=settings.VERSION,
        database=db_status,
        ai_mode_available=ai_available,
        active_incidents_count=active_incidents,
        total_analyses_count=total_analyses
    )

