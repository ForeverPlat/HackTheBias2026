from fastapi import APIRouter
from pydantic import BaseModel
from app.services import score_service

router = APIRouter(prefix="/api/score", tags=["Scoring"])

class ScoringRequest(BaseModel):
    monthly_income: int
    monthly_rent: int
    credit_score: int

@router.post("")
async def get_score(request: ScoringRequest):
    return score_service.score_tenant(request)
