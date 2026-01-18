from pydantic import BaseModel

class FeatureExplanation(BaseModel):
    name: str
    value: str
    status: str
    explanation: str


class ScoreResponse(BaseModel):
    score: int
    risk_level: str
    breakdown: list[FeatureExplanation]
