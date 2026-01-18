import type { TenantInputPayload, EvaluationResponse } from "../types/tenant";

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
