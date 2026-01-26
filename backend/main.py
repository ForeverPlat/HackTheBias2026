from fastapi import FastAPI
from pydantic import BaseModel, Field
from app.routes import score

app = FastAPI(title="Restaurant Finder API")

app.include_router(score.router)


@app.get("/api/")
def read_root():
    return {"status": "ok", "message": "Fair Tenant Screening"}
