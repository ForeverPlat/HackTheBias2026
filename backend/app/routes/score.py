from app.services.impact import calculate_impact
from app.services.legacy_score import score_legacy
from fastapi import APIRouter 
from app.schemas.tenant import TenantInput 
from app.schemas.score import ScoreResponse
# from app.services import Input
from app.services.features import compute_features
from app.services.score import score_features
from app.services.explain import explain_features

router = APIRouter(prefix="/api/score", tags=["Score"])

@router.post("", response_model=ScoreResponse)
def get_score(request: TenantInput):

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

@router.post("/compare")
def compare_score(request: TenantInput):

    # new
    features = compute_features(request)
    score_result = score_features(features)
    explaintions = explain_features(features)
    rent = request.monthly_rent

    new_impact = calculate_impact(score_result["score"], rent)


    legacy = score_legacy(request)
    legacy_impact = calculate_impact(legacy["score"], rent)

    return {
        "new_model": {
            "score": score_result["score"],
            "risk_level": score_result["risk_level"],
            "breakdown": explaintions,
            "impact": new_impact
        },
        "legacy_model": {
            "score": legacy["score"],
            "impact": legacy_impact
        }
    }
