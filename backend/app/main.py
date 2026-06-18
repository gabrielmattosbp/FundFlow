"""
FundFlow — FastAPI Backend

Run:  uvicorn app.main:app --reload
Docs: http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import auth, accounts, transactions

app = FastAPI(
    title="FundFlow API",
    version="1.0.0",
    docs_url="/docs",
)

cors_origins = [o.strip() for o in settings.cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(transactions.router)


@app.get("/")
def root():
    return RedirectResponse(url="/docs")

@app.get("/health")
def health():
    return {"status": "ok"}
