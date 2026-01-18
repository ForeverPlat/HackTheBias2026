import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CompareResponse, TenantInputPayload } from "../types/tenant";
import { compareTenant } from "../services/api";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function clamp(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

function pctReduction(oldVal: number, newVal: number) {
  // positive number means "reduction"
  if (oldVal === 0) return null;
  return (oldVal - newVal) / Math.abs(oldVal);
}

function pctText(p: number) {
  const abs = Math.abs(p);
  // demo-friendly: 0 decimals for big %, 1 decimal for small
  if (abs >= 0.1) return `${Math.round(abs * 100)}%`;
  return `${round1(abs * 100)}%`;
}

function pickImpact(impact?: Record<string, number>) {

  const missedMonths =
    impact?.expect_missed_months ??
    impact?.expected_missed_months ??
    null;

  const annualLoss =
    impact?.expected_anual_loss ?? 
    impact?.expected_annual_loss ??
    null;

  return { missedMonths, annualLoss };
}

function StatTile(props: { icon: string; label: string; value: string; delta?: string }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span
          aria-hidden="true"
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(0,0,0,0.08)",
            background: "rgba(0,0,0,0.02)",
            fontSize: 16,
          }}
        >
          {props.icon}
        </span>

        <div>
          <div className="muted" style={{ fontWeight: 800 }}>
            {props.label}
          </div>
          <div style={{ fontWeight: 950, fontSize: 18 }}>{props.value}</div>
          {props.delta ? (
            <div className="muted" style={{ marginTop: 2, fontWeight: 800 }}>
              {props.delta}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BarRow(props: {
  label: string;
  legacyLabel?: string;
  newLabel?: string;
  legacyValue: number | null;
  newValue: number | null;
  formatValue: (n: number) => string;
  fixedMax?: number; // e.g. 100 for score
}) {
  if (props.legacyValue == null || props.newValue == null) {
    return (
      <div style={{ paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 900 }}>{props.label}</div>
          <div className="muted" style={{ fontWeight: 800 }}>
            Not available
          </div>
        </div>
      </div>
    );
  }

  const legacy = props.legacyValue;
  const newer = props.newValue;

  const max = props.fixedMax ?? Math.max(legacy, newer, 1);
  const legacyW = Math.max(2, (legacy / max) * 100);
  const newW = Math.max(2, (newer / max) * 100);

  return (
      <div
        style={{
          paddingTop: 18,
          paddingBottom: 18,
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
      >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div style={{ fontWeight: 900 }}>{props.label}</div>
        <div className="muted" style={{ fontWeight: 800 }}>
          Legacy {props.formatValue(legacy)} → FairTenant {props.formatValue(newer)}
        </div>
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div
            className="muted"
            style={{
              width: 110,
              paddingRight: 12,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {props.legacyLabel ?? "Legacy"}
          </div>
          <div style={{ flex: 1, height: 10, background: "rgba(0,0,0,0.06)", borderRadius: 999 }}>
            <div
              style={{
                width: `${legacyW}%`,
                height: "100%",
                borderRadius: 999,
                background: "rgba(0,0,0,0.30)",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div
            className="muted"
            style={{
              width: 110,
              paddingRight: 12,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {props.newLabel ?? "FairTenant"}
          </div>
          <div style={{ flex: 1, height: 10, background: "rgba(0,0,0,0.06)", borderRadius: 999 }}>
            <div
              style={{
                width: `${newW}%`,
                height: "100%",
                borderRadius: 999,
                background: "var(--accent, #2563eb)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Comparison() {
  const [payload, setPayload] = useState<TenantInputPayload | null>(null);
  const [data, setData] = useState<CompareResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPayload(safeParse<TenantInputPayload>(sessionStorage.getItem("fairtenant:lastPayload")));
  }, []);

  useEffect(() => {
    if (!payload) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const res = await compareTenant(payload);
        if (!cancelled) setData(res);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) setErr(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (!payload) {
    return (
      <div className="card">
        <h2 className="page-title">No comparison available</h2>
        <p className="muted">Run an evaluation first.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" to="/">Go to form</Link>
          <Link className="btn" to="/score">Back to score</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <h2 className="page-title">Comparison</h2>
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="card">
        <h2 className="page-title">Comparison</h2>
        <p className="muted">Couldn’t load comparison: {err}</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn" to="/score">Back to score</Link>
          <Link className="btn btn-primary" to="/">New assessment</Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <h2 className="page-title">Comparison</h2>
        <p className="muted">No data returned.</p>
        <Link className="btn" to="/score">Back to score</Link>
      </div>
    );
  }

  const legacyScore = clamp(data.legacy_model.score);
  const newScore = clamp(data.new_model.score);

  const legacyImpact = pickImpact(data.legacy_model.impact);
  const newImpact = pickImpact(data.new_model.impact);

  const lossRed =
    legacyImpact.annualLoss != null && newImpact.annualLoss != null
      ? pctReduction(legacyImpact.annualLoss, newImpact.annualLoss)
      : null;

  const missedRed =
    legacyImpact.missedMonths != null && newImpact.missedMonths != null
      ? pctReduction(legacyImpact.missedMonths, newImpact.missedMonths)
      : null;

  // Pick the “headline win”: prefer annual loss reduction if available
  const headline =
    lossRed != null
      ? `Expected annual loss reduced by ${pctText(lossRed)}`
      : missedRed != null
      ? `Expected missed months reduced by ${pctText(missedRed)}`
      : `Score difference: ${round1(newScore - legacyScore)} points`;

  const lossDelta =
    legacyImpact.annualLoss != null && newImpact.annualLoss != null
      ? legacyImpact.annualLoss - newImpact.annualLoss
      : null;

  const missedDelta =
    legacyImpact.missedMonths != null && newImpact.missedMonths != null
      ? legacyImpact.missedMonths - newImpact.missedMonths
      : null;

  return (
    <div className="stack" style={{ gap: 16 }}>
      {/* Minimal header + headline */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span
              aria-hidden="true"
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(0,0,0,0.08)",
                background: "rgba(0,0,0,0.02)",
                fontSize: 18,
              }}
            >
              ⚖️
            </span>
            <div>
              <div style={{ fontWeight: 950, fontSize: 22 }}>Comparison</div>
              <div className="muted" style={{ fontWeight: 700 }}>
                Legacy vs FairTenant on the same applicant
              </div>
            </div>
          </div>

          <Link className="btn" to="/score">
            Back
          </Link>
        </div>

        <div className="card" style={{ padding: 14, marginTop: 14 }}>
          <div style={{ fontWeight: 950, fontSize: 20 }}>{headline}</div>
        </div>

        {/* Only the most significant KPI tiles */}
        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          <StatTile
            icon="💸"
            label="Expected annual loss"
            value={
              newImpact.annualLoss == null ? "—" : money(newImpact.annualLoss)
            }
            delta={
              lossDelta == null
                ? undefined
                : `↓ ${money(lossDelta)}${lossRed != null ? ` (${pctText(lossRed)})` : ""}`
            }
          />

          <StatTile
            icon="📆"
            label="Expected missed months"
            value={
              newImpact.missedMonths == null ? "—" : `${round1(newImpact.missedMonths)} months`
            }
            delta={
              missedDelta == null
                ? undefined
                : `↓ ${round1(missedDelta)} months${missedRed != null ? ` (${pctText(missedRed)})` : ""}`
            }
          />

          <StatTile
            icon="📈"
            label="Score"
            value={`${round1(newScore)}/100`}
            delta={`Legacy ${round1(legacyScore)}/100`}
          />
        </div>
      </div>

      {/* Visual difference (this is what people actually look at) */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <strong>Visual difference</strong>
          <span className="muted">bigger bar = higher value</span>
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 22 }}>
          <BarRow
            label="Score"
            legacyValue={legacyScore}
            newValue={newScore}
            formatValue={(n) => `${round1(n)}`}
            fixedMax={100}
          />

          <BarRow
            label="Expected missed months"
            legacyValue={legacyImpact.missedMonths}
            newValue={newImpact.missedMonths}
            formatValue={(n) => `${round1(n)} mo`}
          />

          <BarRow
            label="Expected annual loss"
            legacyValue={legacyImpact.annualLoss}
            newValue={newImpact.annualLoss}
            formatValue={(n) => money(n)}
          />
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link className="btn" to="/score">Back to score</Link>
        <Link className="btn btn-primary" to="/">New assessment</Link>
      </div>
    </div>
  );
}
