// src/types/tenant.ts

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

export type EvaluationResponse = ScoreResponse;

export type TenantInputPayload = {
  monthly_income: number;
  monthly_rent: number;
  liquid_savings: number;
  monthly_debt: number;
  income_history?: number[];
};

export type CompareModelResult = {
  score: number;
  risk_level?: RiskLevel;
  impact?: Record<string, number>;
  breakdown?: FeatureExplanation[];
};

export type CompareResponse = {
  new_model: CompareModelResult;
  legacy_model: CompareModelResult;
};
