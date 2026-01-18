from app.legacy.input import score_tenant as legacy_score

def score_legacy(tenant_request):
    result = legacy_score(tenant_request)

    return {
        "score": result["score"],
        "model": "legacy_model"
    }
