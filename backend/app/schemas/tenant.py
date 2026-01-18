from pydantic import BaseModel
from typing import List, Optional

class TenantInput(BaseModel):
    monthly_income: float
    monthly_rent: float
    liquid_savings: float
    monthly_debt: float
    income_history: Optional[List[float]] = None
