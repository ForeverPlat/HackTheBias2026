# FairTenant — Capability-Based Tenant Screening (Hackathon)

FairTenant is a prototype tenant screening tool that focuses on **capability-based signals** (cash-flow capacity) rather than proxy variables. It generates a **Payment Reliability score (0–100)** with an **explainable breakdown**, and includes a **comparison view** that contrasts our approach against a simplified “legacy” baseline.

> Goal: show how a transparent, cash-flow-driven approach can support clearer decisions and reduce reliance on proxy inputs.

---

## Table of Contents
- [What FairTenant Does](#what-fairtenant-does)
- [Why This Matters (Bias Context)](#why-this-matters-bias-context)
- [Key Features](#key-features)
- [How Scoring Works](#how-scoring-works)
- [Impact Metric (What “Expected Loss” Means)](#impact-metric-what-expected-loss-means)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Run Locally](#run-locally)
- [Demo Flow](#demo-flow)
- [Bias Mitigation Evidence (Model Folder)](#bias-mitigation-evidence-model-folder)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)
- [Team](#team)

---

## What FairTenant Does

FairTenant takes a small set of financial inputs and returns:

1. **Score (0–100)** — “Payment Reliability”
2. **Risk level** — `low` / `medium` / `high`
3. **Explainable breakdown** — per-feature status + explanation
4. **Model comparison** — side-by-side impact metrics vs. a legacy baseline

The UI is designed to be **fast to scan**: one score card, a concise breakdown, and a visual comparison page with bars.

---

## Why This Matters (Bias Context)

Many tenant screening approaches use signals that can act as **proxies** for protected attributes (directly or indirectly), and can reproduce structural inequities. FairTenant’s approach is intentionally narrow:

- prioritize **cash-flow capability** signals  
- avoid demographic inputs (race/ethnicity/etc.)
- provide **reasons** and **impact** so users can understand what drives outcomes

This is a hackathon prototype, but it’s built around **transparency + explainability** rather than black-box scoring.

---

## Key Features

### 1) Payment Reliability Score
- Score normalized to **0–100**
- Risk label: `low`, `medium`, `high`

### 2) Explainability Built In
Each feature in the breakdown contains:
- `name`
- `value` (formatted for humans)
- `status`: `good` / `moderate` / `risk`
- `explanation` (short, decision-relevant reason)

### 3) Comparison Page (Legacy vs FairTenant)
FairTenant provides a `/comparison` page that visually compares:
- **Score**
- **Expected missed months**
- **Expected annual loss**

It uses bar-style “visual difference” rows so users can understand changes instantly without reading a report.

---

## How Scoring Works

The backend computes cash-flow features from the user’s input, then scores them using weighted contributions.

Example weights (backend-controlled):


WEIGHTS = {
  "income_to_rent": 0.30,
  "savings_runway_months": 0.25,
  "payment_stress_index": -0.25,
  "debt_to_income": -0.20,
}
Risk thresholds (example):

low if score ≥ LOW_RISK_SCORE

medium if score ≥ MEDIUM_RISK_SCORE

else high

The explainability layer returns a short breakdown (e.g., Income-to-Rent Ratio, Savings Runway, Payment Stress) with human-friendly values and explanations.

## Impact Metric (What “Expected Loss” Means)
To make outcomes concrete, the backend computes an “impact” estimate:

expected_missed_months: estimated missed months within a year

expected_annual_loss: expected_missed_months * monthly_rent

This enables the comparison page to show how much expected loss is reduced under the FairTenant model vs the legacy baseline.

Note: some backend builds may use the key expected_anual_losses (typo). The frontend supports both spellings.

## API Endpoints
POST /api/score
Returns the explainable FairTenant score.

Request body

json
Copy code
{
  "monthly_income": 5200,
  "monthly_rent": 1800,
  "liquid_savings": 6000,
  "monthly_debt": 400,
  "income_history": [5200, 5100, 5300]
}
## Response shape (TypeScript)

Copy code
export type RiskLevel = "low" | "medium" | "high";
export type FeatureStatus = "good" | "moderate" | "risk";

export type FeatureExplanation = {
  name: string;
  value: string;
  status: FeatureStatus;
  explanation: string;
};

export type ScoreResponse = {
  score: number;
  risk_level: RiskLevel;
  breakdown: FeatureExplanation[];
};
POST /api/score/compare
Returns legacy vs FairTenant results for the same applicant.

## Response shape (TypeScript)

export type CompareModelResult = {
  score: number;
  risk_level?: RiskLevel;
  impact?: {
    expect_missed_months?: number;
    expected_missed_months?: number;
    expected_anual_losses?: number;   // backend typo (supported)
    expected_annual_losses?: number;  // corrected spelling (supported)
    expected_annual_loss?: number;    // optional variant (supported if used)
  };
  breakdown?: FeatureExplanation[];
};

export type CompareResponse = {
  new_model: CompareModelResult;
  legacy_model: CompareModelResult;
};

## Project Structure
Typical layout:

text
Copy code
HackTheBias2026-main/
  backend/
    main.py
    requirements.txt
    app/
      routes/
      services/
      schemas/
    data/
  frontend/
    vite.config.ts
    src/
      pages/
        EvaluateTenant.tsx
        Results.tsx       # /score
        Comparison.tsx    # /comparison
      components/
      services/
        api.ts
      types/
        tenant.ts
  Model/
    Data_genrators.py
    Graph.py

## Run Locally
1) Backend (FastAPI)
From the repo root:

bash
Copy code
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
Backend should be reachable at:

http://localhost:8000

2) Frontend (React + Vite)
In a second terminal:

bash
Copy code
cd frontend
npm install
npm run dev
The frontend calls:

/api/score

/api/score/compare

If you use a dev proxy, confirm it routes /api/* to localhost:8000.

## Demo Flow
Open / (Evaluate Tenant)

Enter applicant inputs and submit

You land on /score (Payment Reliability + explanation cards)

Click Comparison to open /comparison

View bar visuals for:

score

expected missed months

expected annual loss

## Bias Mitigation Evidence (Model Folder)
The Model/ folder contains scripts used during the hackathon to explore bias mechanisms using synthetic data:

Data_genrators.py generates data with controllable disparities

Graph.py trains simple models and reports correlation/disparity patterns, then graphs group differences

Run (example):

bash
Copy code
python Model/Graph.py
If needed:

bash
Copy code
pip install matplotlib seaborn
Troubleshooting
404 on /api/score
backend not running on port 8000

wrong route prefix (should be /api/score)

frontend proxy not active (run npm run dev)

422 validation error
That is backend validation rejecting your request body.

ensure numeric inputs are numbers (not empty strings)

income_history should be optional; if omitted, backend schema must default it

“No routes matched location”
Frontend router is missing the route. Ensure routes include:

/score

/comparison

## Next Steps
expand explanation coverage to include additional features (e.g., debt-to-income)

calibrate impact estimates with more realistic distributions

add fairness metrics (group parity / error rates) to quantify bias reduction more directly

add transparency report export (PDF/JSON) for decision auditability

--- 

Team
[Taimoor Kiani] — Frontend

[Sreerag vadde] —  Modeling / Data

[Luqman Ajani] — Backend