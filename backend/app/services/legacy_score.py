from app.legacy.input import score_tenant as legacy_score
from app.schemas.tenant import TenantInput

#FEATURES = [
#    'income_stability',
#    'eviction_history',
#    'criminal_history',
#    'voucher',
#    'employment_years',
#    'savings_ratio',
#    'rental_history_years'
#]

def adapt_to_legacy_features(tenant: TenantInput) -> dict:
    income = tenant.monthly_income
    rent = tenant.monthly_rent
    savings = tenant.liquid_savings

    income_to_rent = 0
    if rent > 0:
        income_to_rent = income / rent

    savings_runway = 0
    if rent > 0:
         savings_runway = savings / rent

    eviction_history = 0
    if savings_runway < 1:
        eviction_history = 1

    voucher = 0
    if income_to_rent < 2:
        voucher = 1

    saving_ratio = 0
    if income > 0:
        saving_ratio = min(1.0, savings / (income * 6))

    return {
        # assumptions
        "credit_score": 650, # assumtion
        "income_stability": min(100, income_to_rent * 30), 
        "eviction_history": eviction_history,
        "criminal_history": 0,  # default no
        "voucher": voucher,
        "employment_years": min(5, savings_runway),
        "savings_ratio": saving_ratio,
        "rental_history_years": min(5, savings_runway)
    }

def score_legacy(tenant_request):
    legacy_tenant = adapt_to_legacy_features(tenant_request)
    result = legacy_score(legacy_tenant)

    score = result["score"]

    return {
        "score": result["score"],
        "model": "legacy_model"
    }


