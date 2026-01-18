from app.config.constants import MAX_MISSED_MONTHS_PER_YEAR

def calculate_impact(score: float, monthly_rent: float):

    expected_missed_months = (
        (100 - score) / 100
    ) * MAX_MISSED_MONTHS_PER_YEAR

    expected_loss = expected_missed_months * monthly_rent

    return {
        "expected_missed_months": round(expected_missed_months, 2),
        "expected_annual_loss": round(expected_loss, 2),
    }
