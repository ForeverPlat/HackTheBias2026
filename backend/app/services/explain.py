from app.config.constants import GOOD_INCOME_TO_RENT, GOOD_SAVINGS_RUNWAY, LOW_STRESS_PSI

def explain_features(features):
    explanations = []

    itr = features["income_to_rent"]
    explanations.append({
        "name": "Income-to-Rent Ratio",
        "value": f"{int(100 / itr)}%" if itr > 0 else "N/A",
        "status": "good" if itr >= GOOD_INCOME_TO_RENT else "risk",
        "explanation": (
            "Rent consumes a low share of income"
            if itr >= GOOD_INCOME_TO_RENT
            else "Rent consumes a high share of income"
        ),
    })

    savings = features["savings_runway_months"]
    explanations.append({
        "name": "Savings Runway",
        "value": f"{int(savings)} months",
        "status": "good" if savings >= GOOD_SAVINGS_RUNWAY else "moderate",
        "explanation": (
            "Strong financial buffer against income shocks"
            if savings >= GOOD_SAVINGS_RUNWAY
            else "Limited savings buffer"
        ),
    })

    psi = features["payment_stress_index"]
    explanations.append({
        "name": "Payment Stress",
        "value": f"{round(psi, 2)}",
        "status": "good" if psi <= LOW_STRESS_PSI else "risk",
        "explanation": (
            "Low financial stress after obligations"
            if psi <= LOW_STRESS_PSI
            else "High financial stress after obligations"
        ),
    })

    return explanations
