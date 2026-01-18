import type { CompareResponse, RiskLevel } from "../types/tenant";

function clamp(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function riskLabel(r?: RiskLevel) {
  if (!r) return "—";
  if (r === "low") return "Low risk";
  if (r === "medium") return "Medium risk";
  return "High risk";
}

const fmtPct0 = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 0,
});

const fmtPct1 = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 1,
});

function fmtSigned(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n}`;
}

function labelChange(delta: number, goodDirection: "up" | "down") {
  if (delta === 0) return "no change";

  const isGood =
    goodDirection === "up" ? delta > 0 : delta < 0;

  const word =
    delta > 0 ? "increase" : "reduction";

  return isGood ? `${word} (good)` : `${word} (bad)`;
}

function percentDelta(oldValue: number, newValue: number) {
  if (oldValue === 0) return null;
  return (newValue - oldValue) / Math.abs(oldValue);
}

export default function ModelComparison({ data }: { data: CompareResponse }) {
  const legacyScore = clamp(data.legacy_model.score);
  const newScore = clamp(data.new_model.score);
  const scoreDelta = newScore - legacyScore;

  const legacyImpact = typeof data.legacy_model.impact === "number" ? data.legacy_model.impact : null;
  const newImpact = typeof data.new_model.impact === "number" ? data.new_model.impact : null;

  const impactDelta = legacyImpact != null && newImpact != null ? newImpact - legacyImpact : null; 
  const impactPct = legacyImpact != null && newImpact != null ? percentDelta(legacyImpact, newImpact) : null;

  const improvements: Array<{
    title: string;
    detail: string;
    strength: number; 
    good: boolean;
  }> = [];

  if (legacyImpact != null && newImpact != null) {
    const good = newImpact < legacyImpact;
    const absChange = Math.abs(newImpact - legacyImpact);
    const pct = impactPct;

    improvements.push({
      title: "Expected loss",
      detail:
        pct == null
          ? `Δ ${newImpact - legacyImpact}`
          : `${good ? "reduced" : "increased"} by ${fmtPct1.format(Math.abs(pct))}`,
      strength: pct == null ? absChange : Math.abs(pct),
      good,
    });
  }

  improvements.push({
    title: "Reliability score",
    detail: scoreDelta === 0 ? "no change" : `${scoreDelta > 0 ? "increased" : "decreased"} by ${Math.abs(scoreDelta)}`,
    strength: Math.abs(scoreDelta) / 100,
    good: scoreDelta > 0,
  });

  // Sort improvements: best improvements first, then by magnitude
  const top2 = improvements
    .sort((a, b) => Number(b.good) - Number(a.good) || b.strength - a.strength)
    .slice(0, 2);

  // Headline — keep it honest (this is NOT bias unless you define it as such)
  let headline = "Comparison ready";
  let subline = "Legacy vs FairTenant on the same applicant.";

  if (legacyImpact != null && newImpact != null && impactPct != null) {
    const better = newImpact < legacyImpact;
    const pctAbs = Math.abs(impactPct);
    headline = `Expected loss ${better ? "reduced" : "increased"} by ${fmtPct0.format(pctAbs)}`;
    subline = `Lower expected loss = less predicted rent-miss cost under this assessment.`;
  } else {
    headline = `Score change: ${fmtSigned(scoreDelta)}`;
  }

  return (
    <div className="stack" style={{ gap: 12, marginTop: 10 }}>
      {/* Headline callout */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>{headline}</div>
        <div className="muted" style={{ marginTop: 6 }}>{subline}</div>
      </div>

      {/* Top 2 improvements */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <strong>Top improvements</strong>
          <span className="muted">highlighting strongest changes</span>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          {top2.map((x) => (
            <div
              key={x.title}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                borderTop: "1px solid rgba(0,0,0,0.06)",
                paddingTop: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 900 }}>{x.title}</div>
                <div className="muted" style={{ marginTop: 2 }}>{x.detail}</div>
              </div>
              <span
                className="badge"
                style={{
                  alignSelf: "center",
                  fontWeight: 900,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,0.12)",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  fontSize: 12,
                }}
              >
                {x.good ? "Improved" : "Worse"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-side */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <strong>Legacy model</strong>
            <span className="muted">{riskLabel(data.legacy_model.risk_level)}</span>
          </div>

          <div style={{ marginTop: 10, fontSize: 34, fontWeight: 900 }}>
            {legacyScore}
            <span className="muted" style={{ fontSize: 14, marginLeft: 6 }}>/100</span>
          </div>

          <div style={{ marginTop: 10 }}>
            <div className="muted" style={{ fontWeight: 800, marginBottom: 6 }}>
              Expected loss
            </div>
            <div style={{ fontWeight: 900 }}>
              {legacyImpact == null ? "—" : legacyImpact.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <strong>FairTenant model</strong>
            <span style={{ fontWeight: 800 }}>{riskLabel(data.new_model.risk_level)}</span>
          </div>

          <div style={{ marginTop: 10, fontSize: 34, fontWeight: 900 }}>
            {newScore}
            <span className="muted" style={{ fontSize: 14, marginLeft: 6 }}>/100</span>
          </div>

          <div style={{ marginTop: 10 }}>
            <div className="muted" style={{ fontWeight: 800, marginBottom: 6 }}>
              Expected loss
            </div>
            <div style={{ fontWeight: 900 }}>
              {newImpact == null ? "—" : newImpact.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Delta row */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span className="muted">Score delta (new − legacy)</span>
            <strong>{fmtSigned(scoreDelta)}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span className="muted">Expected loss delta (new − legacy)</span>
            <strong>
              {impactDelta == null ? "—" : `${fmtSigned(impactDelta)} (${labelChange(impactDelta, "down")})`}
            </strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span className="muted">Expected loss change</span>
            <strong>
              {impactPct == null ? "—" : fmtPct0.format(impactPct)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
