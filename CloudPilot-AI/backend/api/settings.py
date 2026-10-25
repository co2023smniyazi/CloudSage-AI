from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.config import settings
from backend.models.entities import AppSetting, AnalysisRecord, Incident
from backend.models.schemas import SettingsResponse, SettingsUpdate

router = APIRouter(prefix="/settings", tags=["Application Settings"])

def get_setting_value(db: Session, key: str, default: str = "") -> str:
    s = db.query(AppSetting).filter(AppSetting.key == key).first()
    return s.value if s else default

def set_setting_value(db: Session, key: str, value: str):
    s = db.query(AppSetting).filter(AppSetting.key == key).first()
    if s:
        s.value = value
    else:
        s = AppSetting(key=key, value=value)
        db.add(s)
    db.commit()

@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    gemini_key = get_setting_value(db, "gemini_api_key", settings.GEMINI_API_KEY)
    openai_key = get_setting_value(db, "openai_api_key", settings.OPENAI_API_KEY)
    provider = get_setting_value(db, "ai_provider", "auto")
    sensitivity = get_setting_value(db, "risk_sensitivity", "normal")

    total_inc = db.query(Incident).count()
    total_ana = db.query(AnalysisRecord).count()

    return SettingsResponse(
        gemini_configured=bool(gemini_key and len(gemini_key.strip()) > 5),
        openai_configured=bool(openai_key and len(openai_key.strip()) > 5),
        ai_provider=provider,
        risk_sensitivity=sensitivity,
        total_incidents=total_inc,
        total_analyses=total_ana
    )

@router.post("", response_model=SettingsResponse)
def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db)):
    if payload.gemini_api_key is not None:
        set_setting_value(db, "gemini_api_key", payload.gemini_api_key.strip())
        settings.GEMINI_API_KEY = payload.gemini_api_key.strip()

    if payload.openai_api_key is not None:
        set_setting_value(db, "openai_api_key", payload.openai_api_key.strip())
        settings.OPENAI_API_KEY = payload.openai_api_key.strip()

    if payload.ai_provider is not None:
        set_setting_value(db, "ai_provider", payload.ai_provider)

    if payload.risk_sensitivity is not None:
        set_setting_value(db, "risk_sensitivity", payload.risk_sensitivity)

    return get_settings(db)

@router.post("/reset-db")
def reset_database(db: Session = Depends(get_db)):
    db.query(Incident).delete()
    db.query(AnalysisRecord).delete()
    db.commit()
    return {"message": "Incident history and past analysis records cleared successfully."}

