from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
import pandas as pd

from model import load_or_train, predict_score_risk, audit


TRAIN_CSV_PATH = "data/synthetic_train.csv"
DEFAULT_RISK_THRESHOLD = 0.50

app = FastAPI(title="Tenant Risk API")


class TenantInput(BaseModel):
    # Required
    rent_monthly: float = Field(..., ge=300, le=10000)
    monthly_income_gross: float = Field(..., ge=0, le=50000)

    income_verified: bool
    income_stability: float = Field(..., ge=0.0, le=1.0)

    savings_buffer_months: float = Field(..., ge=0.0, le=12.0)
    guarantor_available: bool
    verified_rental_debt_flag: bool

    # Optional
    credit_score: Optional[int] = Field(None, ge=300, le=850)
    rent_on_time_rate_12m: Optional[float] = Field(None, ge=0.0, le=1.0)
    rent_late_or_nsf_count_12m: Optional[int] = Field(None, ge=0, le=24)
    utility_on_time_rate_12m: Optional[float] = Field(None, ge=0.0, le=1.0)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/info")
def info():
    """Returns feature lists + validation metrics for each model."""
    try:
        packs = load_or_train(TRAIN_CSV_PATH)
        out = {}
        for name, pack in packs.items():
            out[name] = {"features": pack.features, "metrics": pack.metrics}
        return {"training_csv": TRAIN_CSV_PATH, "models": out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict")
def predict(payload: TenantInput):
    try:
        packs = load_or_train(TRAIN_CSV_PATH)
        user = payload.model_dump()

        biased = predict_score_risk(user, packs["biased_model"])
        fair = predict_score_risk(user, packs["fair_model"])

        return {"biased_model": biased, "fair_model": fair}

    except FileNotFoundError:
        raise HTTPException(status_code=500, detail=f"Training CSV not found at: {TRAIN_CSV_PATH}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@app.post("/audit")
async def audit_endpoint(file: UploadFile = File(...), risk_threshold: float = DEFAULT_RISK_THRESHOLD):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a .csv file")

    try:
        df = pd.read_csv(file.file)
        packs = load_or_train(TRAIN_CSV_PATH)
        return audit(df, packs, risk_threshold=float(risk_threshold))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
