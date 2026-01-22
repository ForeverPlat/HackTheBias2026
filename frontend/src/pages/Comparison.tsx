import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CompareResponse, TenantInputPayload } from "../types/tenant";
import { compareTenant } from "../services/api";

const COLORS = {
  legacy: "rgba(100,116,139,0.42)", // slate bar
  legacyBg: "rgba(100,116,139,0.10)", // track
  primary: "#2563eb",
  primaryDark: "#1e40af",
  primarySoft: "rgba(37,99,235,0.10)",
  primaryBorder: "rgba(37,99,235,0.18)",
  primaryGlow: "rgba(37,99,235,0.18)",
};

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
  if (oldVal === 0) return null;
  return (oldVal - newVal) / Math.abs(oldVal);
}

function pctText(p: number) {
  const abs = Math.abs(p);
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
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span
          aria-hidden="true"
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.14), rgba(37,99,235,0.06))",
            border: "1px solid rgba(37,99,235,0.18)",
            color: "#1e40af",
            boxShadow: "0 6px 14px rgba(15,23,42,0.06)",
            fontSize: 18,
            flex: "0 0 auto",
          }}
        >
          {props.icon}
        </span>

        <div style={{ minWidth: 0 }}>
          <div className="muted" style={{ fontWeight: 800 }}>
            {props.label}
          </div>
          <div style={{ fontWeight: 950, fontSize: 18, letterSpacing: -0.2 }}>
            {props.value}
          </div>
          {props.delta ? (
            <div className="muted" style={{ marginTop: 3, fontWeight: 800 }}>
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
  fixedMax?: number;
}) {
  if (props.legacyValue == null || props.newValue == null) {
    return (
      <div style={{ paddingTop: 12, borderTop: "1px solid rgba(15,23,42,0.08)" }}>
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

  const LABEL_COL_W = 170; 

  const trackStyle: React.CSSProperties = {
    flex: 1,
    height: 10,
    background: COLORS.legacyBg,
    borderRadius: 999,
    position: "relative",
    overflow: "hidden",
  };

  return (
    <div
      style={{
        paddingTop: 18,
        paddingBottom: 18,
        borderTop: "1px solid rgba(15,23,42,0.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div style={{ fontWeight: 950, letterSpacing: -0.2 }}>{props.label}</div>
        <div className="muted" style={{ fontWeight: 800 }}>
          Legacy {props.formatValue(legacy)} → FairTenant {props.formatValue(newer)}
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {/* Legacy */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            className="muted"
            style={{
              width: LABEL_COL_W,
              fontWeight: 800,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {props.legacyLabel ?? "Legacy"}
          </div>

          <div style={trackStyle}>
            <div
              style={{
                width: `${legacyW}%`,
                height: "100%",
                borderRadius: 999,
                background: COLORS.legacy,
                transition: "width 600ms ease-out",
              }}
            />
          </div>
        </div>

        {/* FairTenant */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: LABEL_COL_W,
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontWeight: 900,
              color: COLORS.primaryDark,
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {props.newLabel ?? "FairTenant"}
            </span>

            <span
              style={{
                flex: "0 0 auto",
                fontSize: 11,
                fontWeight: 900,
                color: COLORS.primary,
                background: COLORS.primarySoft,
                padding: "2px 7px",
                borderRadius: 999,
                border: `1px solid ${COLORS.primaryBorder}`,
                lineHeight: "14px",
              }}
            >
              BEST
            </span>
          </div>

          <div style={trackStyle}>
            <div
              style={{
                width: `${newW}%`,
                height: "100%",
                borderRadius: 999,
                background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                boxShadow: `0 0 0 1px rgba(37,99,235,0.22), 0 6px 14px ${COLORS.primaryGlow}`,
                transition: "width 600ms ease-out",
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
          <Link className="btn btn-primary" to="/">
            Go to form
          </Link>
          <Link className="btn" to="/score">
            Back to score
          </Link>
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
          <Link className="btn" to="/score">
            Back to score
          </Link>
          <Link className="btn btn-primary" to="/">
            New assessment
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <h2 className="page-title">Comparison</h2>
        <p className="muted">No data returned.</p>
        <Link className="btn" to="/score">
          Back to score
        </Link>
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
      {/* Header + headline */}
      <div
        className="card"
        style={{
          padding: 18,
          background: "var(--card)",
          backgroundImage: "linear-gradient(180deg, rgba(37,99,235,0.025), rgba(255,255,255,0))",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 120px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span
              aria-hidden="true"
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, rgba(37,99,235,0.14), rgba(37,99,235,0.06))",
                border: "1px solid rgba(37,99,235,0.18)",
                color: "#1e40af",
                boxShadow: "0 6px 14px rgba(15,23,42,0.06)",
                fontSize: 18,
              }}
            >
              ⚖️
            </span>
            <div>
              <div style={{ fontWeight: 950, fontSize: 22, letterSpacing: -0.3 }}>Comparison</div>
              <div className="muted" style={{ fontWeight: 700 }}>
                Legacy vs FairTenant on the same applicant
              </div>
            </div>
          </div>

          <Link className="btn" to="/score">
            Back
          </Link>
        </div>

        <div
          className="card"
          style={{
            padding: 18,
            marginTop: 16,
            background: "linear-gradient(135deg, rgba(37,99,235,0.065), rgba(37,99,235,0.018))",
            border: "1px solid rgba(37,99,235,0.12)",
          }}
        >

          <div style={{ fontWeight: 950, fontSize: 20, color: COLORS.primaryDark }}>{headline}</div>
        </div>

        {/* KPI tiles */}
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          <StatTile
            icon="💸"
            label="Expected annual loss"
            value={newImpact.annualLoss == null ? "—" : money(newImpact.annualLoss)}
            delta={
              lossDelta == null
                ? undefined
                : `↓ ${money(lossDelta)}${lossRed != null ? ` (${pctText(lossRed)})` : ""}`
            }
          />

          <StatTile
            icon="📆"
            label="Expected missed months"
            value={newImpact.missedMonths == null ? "—" : `${round1(newImpact.missedMonths)} months`}
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

      {/* Visual difference */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <strong style={{ color: COLORS.primaryDark }}>Visual difference</strong>
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
        <Link className="btn" to="/score">
          Back to score
        </Link>
        <Link className="btn btn-primary" to="/">
          New assessment
        </Link>
      </div>
    </div>
  );
}
