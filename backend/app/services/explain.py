from app.config.constants import GOOD_INCOME_TO_RENT, GOOD_SAVINGS_RUNWAY, LOW_STRESS_PSI
from app.schemas.score import FeatureExplanation

def explain_features(features) -> list[FeatureExplanation]:
    explanations = []

    itr = features["income_to_rent"]
    explanations.append({
        "name": "Income-to-Rent Ratio",
        "value": f"{int(100 / itr)}%" if itr > 0 else "N/A",
        "status": "good" if itr >= GOOD_INCOME_TO_RENT else "risk",
        "explanation": (
            "Rent represents a sustainable portion of the applicant’s income"
            if itr >= GOOD_INCOME_TO_RENT
            else "Rent represents an elevated risk relative to the applicant’s income"
        ),
    })

    savings = features["savings_runway_months"]
    explanations.append({
        "name": "Savings Runway",
        "value": f"{int(savings)} months",
        "status": "good" if savings >= GOOD_SAVINGS_RUNWAY else "moderate",
        "explanation": (
            "Applicant has sufficient reserves to cover rent during income disruption"
            if savings >= GOOD_SAVINGS_RUNWAY
            else "Applicant has limited reserves to cover rent if income is disrupted"
        ),
    })

    psi = features["payment_stress_index"]
    explanations.append({
        "name": "Payment Stress",
        "value": f"{round(psi, 2)}",
        "status": "good" if psi <= LOW_STRESS_PSI else "risk",
        "explanation": (
            "Applicant retains adequate income after obligations to reliably pay rent"
            if psi <= LOW_STRESS_PSI
            else "Applicant has limited remaining income after obligations, increasing payment risk"
        ),
    })

    return explanations
