from app.config.constants import ( WEIGHTS, LOW_RISK_SCORE, MEDIUM_RISK_SCORE,
)


#WEIGHTS = {
#    "income_to_rent": 0.30,
#    "savings_runway_months": 0.25,
#    "payment_stress_index": -0.25,
#    "debt_to_income": -0.20,
#}

# this figures out the risk of the teneant
def score_features(features: dict):

    score = 0.0

    for feature_name, weight in WEIGHTS.items():
        value = features.get(feature_name)

        if value is None: #=> cnat remeber if weight vals could be null cekc again
            continue
        score += weight * value

        # normalize 0-100
        score = max(0, min(int(score * 100), 100))

        if score >= LOW_RISK_SCORE:
            risk_level = "low"
        elif score >= MEDIUM_RISK_SCORE:
            risk_level = "medium"
        else:
            risk_level = "high"

        return {
            "score": score,
            "risk_level": risk_level,
        }
