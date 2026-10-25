from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.models.entities import Incident
from backend.models.schemas import IncidentResponse, IncidentUpdate, IncidentCreate

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

def get_next_incident_code(db: Session) -> str:
    count = db.query(Incident).count()
    return f"INC-{1001 + count}"

@router.get("", response_model=List[IncidentResponse])
def get_incidents(
    status: Optional[str] = Query(None, description="Filter by status: Open, Investigating, Resolved"),
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MEDIUM, HIGH, CRITICAL"),
    search: Optional[str] = Query(None, description="Search query across code, title, and service"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Incident)

    if status and status != "All":
        query = query.filter(Incident.status == status)

    if severity and severity != "All":
        query = query.filter(Incident.severity == severity)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Incident.incident_code.ilike(search_pattern)) |
            (Incident.title.ilike(search_pattern)) |
            (Incident.service.ilike(search_pattern)) |
            (Incident.root_cause.ilike(search_pattern))
        )

    # Order newest first
    return query.order_by(Incident.detected_at.desc()).offset(offset).limit(limit).all()

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return incident

@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident_status(
    incident_id: int,
    payload: IncidentUpdate,
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    if payload.status:
        if payload.status not in ("Open", "Investigating", "Resolved"):
            raise HTTPException(status_code=400, detail="Invalid status. Must be Open, Investigating, or Resolved.")
        incident.status = payload.status

    if payload.notes is not None:
        incident.notes = payload.notes

    db.commit()
    db.refresh(incident)
    return incident

@router.delete("/{incident_id}")
def delete_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    db.delete(incident)
    db.commit()
    return {"message": f"Incident {incident.incident_code} deleted successfully."}

@router.post("", response_model=IncidentResponse)
def create_manual_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    inc = Incident(
        incident_code=get_next_incident_code(db),
        title=payload.title,
        severity=payload.severity,
        status="Open",
        service=payload.service,
        root_cause=payload.root_cause,
        recommendation=payload.recommendation,
        log_snippet=payload.log_snippet
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)
    return inc

