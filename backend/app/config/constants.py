MAX_SAVINGS_RUNWAY = 12 # max num of month the tenant pay rent using savings

# scoring weights
WEIGHTS = {
    "income_to_rent": 0.30,
    "savings_runway_months": 0.25,
    "payment_stress_index": -0.25,
    "debt_to_income": -0.20,
}

# risk cutoffs
LOW_RISK_SCORE = 75
MEDIUM_RISK_SCORE = 50

# benchmarks for explanations
GOOD_INCOME_TO_RENT = 3.0
GOOD_SAVINGS_RUNWAY = 3.0
LOW_STRESS_PSI = 0.35
