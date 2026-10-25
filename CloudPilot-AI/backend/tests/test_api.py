import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.core.database import Base, engine, SessionLocal
from backend.models.entities import AnalysisRecord, Incident

# Ensure tables exist for tests
Base.metadata.create_all(bind=engine)

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_api_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert data["project"] == "CloudPilot AI"

def test_api_sample_catalog(client):
    response = client.get("/api/logs/samples")
    assert response.status_code == 200
    samples = response.json()
    assert len(samples) >= 4
    sample_ids = [s["id"] for s in samples]
    assert "k8s-crashloop" in sample_ids
    assert "db-pool-exhaustion" in sample_ids

def test_api_analyze_empty_payload(client):
    response = client.post("/api/logs/analyze", data={"raw_text": ""})
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_api_analyze_sample_load(client):
    response = client.post("/api/logs/samples/k8s-crashloop/load")
    assert response.status_code == 200
    data = response.json()
    assert data["risk_score"] > 50
    assert data["risk_level"] in ("HIGH", "CRITICAL")
    assert len(data["patterns"]) > 0
    assert len(data["recommendations"]) > 0

def test_api_incidents_flow(client):
    # Fetch incidents
    response = client.get("/api/incidents")
    assert response.status_code == 200
    incidents = response.json()
    assert isinstance(incidents, list)

    if len(incidents) > 0:
        inc_id = incidents[0]["id"]
        # Update status
        patch_resp = client.patch(f"/api/incidents/{inc_id}", json={"status": "Investigating", "notes": "Checking pod memory limits"})
        assert patch_resp.status_code == 200
        assert patch_resp.json()["status"] == "Investigating"

def test_api_reports_and_csv(client):
    # Fetch latest report
    response = client.get("/api/reports/latest")
    assert response.status_code == 200
    data = response.json()
    analysis_id = data["id"]

    # Export CSV
    csv_resp = client.get(f"/api/reports/{analysis_id}/export/csv")
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    assert "Level,Service,Occurrences" in csv_resp.text

def test_api_invalid_file_extension(client):
    fake_file = ("malicious.exe", b"fake binary content", "application/octet-stream")
    response = client.post("/api/logs/analyze", files={"file": fake_file})
    assert response.status_code == 400
    assert "unsupported file extension" in response.json()["detail"].lower()
