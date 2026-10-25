from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.core.config import settings
from backend.core.database import Base, engine, SessionLocal
from backend.models.entities import AnalysisRecord, Incident
from backend.api import health, analyzer, incidents, reports, settings as settings_api

# Ensure DB tables exist on import/startup
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed initial sample data if empty so the dashboard has rich data out of the box
    db = SessionLocal()
    try:
        if db.query(AnalysisRecord).count() == 0:
            sample_file = Path(__file__).resolve().parent.parent / "sample_logs" / "k8s-crashloop.log"
            if sample_file.exists():
                with open(sample_file, "r", encoding="utf-8") as f:
                    content = f.read()
                await analyzer.run_full_analysis(content, "k8s-crashloop.log", db)
    except Exception as e:
        print(f"Initial seed warning: {e}")
    finally:
        db.close()

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Cloud Operations Assistant: Log Analyzer, Error Heuristics, & Risk Engine",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # allow all for local dev & college presentation
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(analyzer.router, prefix=settings.API_PREFIX)
app.include_router(incidents.router, prefix=settings.API_PREFIX)
app.include_router(reports.router, prefix=settings.API_PREFIX)
app.include_router(settings_api.router, prefix=settings.API_PREFIX)

# Serve built frontend if dist exists
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "api": "/api/health"
    }
