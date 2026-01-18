import type { TenantInputPayload, EvaluationResponse, CompareResponse } from "../types/tenant";

export async function evaluateTenant(data: TenantInputPayload): Promise<EvaluationResponse> {
  const res = await fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error (${res.status}): ${text}`);
  }

  return res.json() as Promise<EvaluationResponse>;
}

export async function compareTenant(data: TenantInputPayload): Promise<CompareResponse> {
  const res = await fetch("/api/score/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error (${res.status}): ${text}`);
  }

  return res.json() as Promise<CompareResponse>;
}
