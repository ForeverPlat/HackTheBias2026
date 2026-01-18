from fastapi import APIRouter 
from app.schemas.tenant import TenantInput 
from app.schemas.score import ScoreResponse
# from app.services import Input
from app.services.features import compute_features
from app.services.score import score_features
from app.services.explain import explain_features

router = APIRouter(prefix="/api/score", tags=["Score"])

@router.post("", response_model=ScoreResponse)
def get_score(request: TenantInput): # eventyally send in user id as well so u get a specific user preferences
    # return await recommendation.get_recommendations(request.restaurants, request.user_id)

    # calc fincial ftrs
    features = compute_features(request)

    # eval risk based on features
    score_result = score_features(features)

    # gen explaintion
    explaintions = explain_features(features)


    return {
        "score": score_result["score"],
        "risk_level": score_result["risk_level"],
        "breakdown": explaintions
    }
