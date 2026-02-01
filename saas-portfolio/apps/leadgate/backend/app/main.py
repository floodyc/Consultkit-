from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api import auth, forms, leads, submit
from app.models.database import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="LeadGate API",
    description="Stop wasting calls on bad-fit leads",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Public forms need open CORS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(forms.router, prefix="/api/forms", tags=["Forms"])
app.include_router(leads.router, prefix="/api/leads", tags=["Leads"])
app.include_router(submit.router, prefix="/api/submit", tags=["Form Submission"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": "leadgate"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
