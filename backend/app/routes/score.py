from fastapi import FastAPI
from fastapi import APIRouter 
from pydantic import BaseModel
from app.services import Input

app = FastAPI()

router = APIRouter(prefix="/api/score", tags=["Score"])

class ScoreRequest(BaseModel):
    credit_score: float
    income_stability: float
    eviction_history: bool # convert to int
    criminal_history: bool # convert to int
    voucher: bool # convert to int
    employment_years: float
    savings_ratio: float # 0 to 1
    rental_history_years: float
    

@router.post("")
async def get_score(request: ScoreRequest): # eventyally send in user id as well so u get a specific user preferences
    # return await recommendation.get_recommendations(request.restaurants, request.user_id)
    return Input.score_tenant(request)