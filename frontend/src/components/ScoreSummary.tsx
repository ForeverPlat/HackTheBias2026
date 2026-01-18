import type { RiskLevel } from "../types/tenant";

function riskLabel(risk: RiskLevel) {
  if (risk === "low") return "Low risk";
  if (risk === "medium") return "Medium risk";
  return "High risk";
}

function interpretation(score: number) {
  if (score >= 80) return "Strong payment reliability.";
  if (score >= 60) return "Generally reliable, with some pressure points.";
  if (score >= 40) return "Higher risk — review the drivers below.";
  return "High concern — likely unstable without mitigations.";
}

export default function ScoreSummary({ score, risk_level }: { score: number; risk_level: RiskLevel }) {
  const s = Math.max(0, Math.min(100, score));

  return (
    <div className="card stack">
      <h2 className="page-title">Payment Reliability</h2>
      <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-0.03em" }}>
        {s.toFixed(0)}
        <span className="muted" style={{ fontSize: 18, marginLeft: 6 }}>/100</span>
      </div>
      <div className="muted" style={{ fontWeight: 800 }}>
        {riskLabel(risk_level)} · {interpretation(s)}
      </div>
    </div>
  );
}
