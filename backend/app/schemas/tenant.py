from pydantic import BaseModel

class TenantInput(BaseModel):
    monthly_income: float
    monthly_rent: float
    liquid_savings: float
    monthly_debt: float
    income_history: list[float] | None
