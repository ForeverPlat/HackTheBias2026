from app.schemas import tenant
from app.schemas.tenant import TenantInput
from app.config.constants import MAX_SAVINGS_RUNWAY
import statistics


# convert the landlord input into financial facts
def compute_features(tenant: TenantInput):

    income = tenant.monthly_income
    rent = tenant.monthly_rent
    savings = tenant.liquid_savings
    debt = tenant.monthly_debt

    # affordability
    income_to_rent = 0
    if rent > 0:
        income_to_rent = income/rent

    post_rent_income = income - rent

    savings_runway = 0
    if rent > 0:
        savings_runway = savings / rent
        savings_runway = min(savings_runway, MAX_SAVINGS_RUNWAY)

    debt_to_income = 0
    if income > 0:
        debt_to_income = debt / income

    disposal_after_debt = income - debt
    payment_stress_index = 1.0

    if disposal_after_debt > 0:
        # how much pressure willl they feel paying rent after paying debt
        payment_stress_index = rent / disposal_after_debt

    
    # income stability
    income_volatility = None
    income_trend = None

    if tenant.income_history and len(tenant.income_history) >= 3:
        mean_income = statistics.mean(tenant.income_history)
        std_income = statistics.stdev(tenant.income_history) # standart deviation from avg

        income_volatility = 0
        if mean_income > 0:
            income_volatility = std_income / mean_income

        midpoint = len(tenant.income_history) // 2
        first_half = statistics.mean(tenant.income_history[:midpoint])
        second_half = statistics.mean(tenant.income_history[midpoint:])

        income_trend = 0
        if first_half > 0:
            income_trend = (second_half - first_half) / first_half


    return {
        "income_to_rent": income_to_rent,
        "post_rent_income": post_rent_income,
        "savings_runway_months": savings_runway,
        "debt_to_income": debt_to_income,
        "payment_stress_index": payment_stress_index,
        "income_volatility": income_volatility,
        "income_trend": income_trend,
    }
