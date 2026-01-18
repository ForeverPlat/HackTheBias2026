import { useEffect, useMemo, useState } from "react";
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

function formatSigned(n: number, decimals = 1) {
  const v = decimals === 0 ? Math.round(n) : round1(n);
  const sign = v > 0 ? "+" : "";
  return `${sign}${v}`;
}

function pctChange(oldVal: number, newVal: number) {
  if (oldVal === 0) return null;
  return (newVal - oldVal) / Math.abs(oldVal);
}

function formatPct(p: number) {
  const abs = Math.abs(p);
  if (abs >= 0.1) return `${Math.round(abs * 100)}%`;
  return `${round1(abs * 100)}%`;
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(0,0,0,0.08)",
        background: "rgba(0,0,0,0.02)",
      }}
    >
      {children}
    </span>
  );
}

function pickImpact(impact?: Record<string, number>) {
  if (!impact) return { missedMonths: null as number | null, annualLoss: null as number | null };

  const missedMonths =
    impact.expect_missed_months ??
    impact.expected_missed_months ??
    null;

  const annualLoss =
    impact.expected_annual_losses ?? 
    impact.expected_annual_losses ?? 
    null;

  return { missedMonths, annualLoss };
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

  // Always-available primitives (so hooks are never conditional)
  const legacyScore = clamp(data?.legacy_model?.score ?? 0);
  const newScore = clamp(data?.new_model?.score ?? 0);
  const scoreDelta = data ? newScore - legacyScore : 0;

  const legacyImpact = pickImpact(data?.legacy_model?.impact);
  const newImpact = pickImpact(data?.new_model?.impact);

  const missedDelta =
    legacyImpact.missedMonths != null && newImpact.missedMonths != null
      ? newImpact.missedMonths - legacyImpact.missedMonths // new - old
      : null;

  const annualLossDelta =
    legacyImpact.annualLoss != null && newImpact.annualLoss != null
      ? newImpact.annualLoss - legacyImpact.annualLoss // new - old
      : null;

  const missedPct =
    legacyImpact.missedMonths != null && newImpact.missedMonths != null
      ? pctChange(legacyImpact.missedMonths, newImpact.missedMonths)
      : null;

  const annualLossPct =
    legacyImpact.annualLoss != null && newImpact.annualLoss != null
      ? pctChange(legacyImpact.annualLoss, newImpact.annualLoss)
      : null;

  const top2 = useMemo(() => {
    const items: Array<{ label: string; value: string; good: boolean }> = [];

    if (annualLossPct != null) {
      const good = annualLossPct < 0;
      items.push({
        label: "Expected annual loss",
        value: `${good ? "reduced" : "increased"} ${formatPct(annualLossPct)}`,
        good,
      });
    } else {
      items.push({ label: "Expected annual loss", value: "not provided", good: false });
    }

    if (missedPct != null) {
      const good = missedPct < 0;
      items.push({
        label: "Expected missed months",
        value: `${good ? "reduced" : "increased"} ${formatPct(missedPct)}`,
        good,
      });
    } else {
      items.push({ label: "Expected missed months", value: "not provided", good: false });
    }

    // If you want score as a fallback “improvement” when one metric is missing:
    if (items.filter((x) => x.value !== "not provided").length < 2) {
      items.push({
        label: "Reliability score",
        value:
          scoreDelta === 0
            ? "no change"
            : `${scoreDelta > 0 ? "increased" : "decreased"} ${Math.abs(round1(scoreDelta))} pts`,
        good: scoreDelta > 0,
      });
    }

    // Prefer “good” changes, then magnitude
    return items
      .sort((a, b) => Number(b.good) - Number(a.good))
      .slice(0, 2);
  }, [annualLossPct, missedPct, scoreDelta]);

  const headline = (() => {
    if (annualLossPct != null) {
      return `Expected annual loss ${annualLossPct < 0 ? "reduced" : "increased"} by ${formatPct(annualLossPct)}`;
    }
    if (missedPct != null) {
      return `Expected missed months ${missedPct < 0 ? "reduced" : "increased"} by ${formatPct(missedPct)}`;
    }
    return `Score changed ${formatSigned(scoreDelta, 1)} pts`;
  })();

  if (!payload) {
    return (
      <div className="card">
        <h2 className="page-title">No comparison available</h2>
        <p className="muted">Run an evaluation first so we can compare models.</p>
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

  return (
    <div className="stack" style={{ gap: 16 }}>
      {/* Header */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Icon>⚖️</Icon>
              <h2 className="page-title" style={{ margin: 0 }}>Comparison</h2>
            </div>
            <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
              Same applicant, two scoring approaches.
            </p>
          </div>
          <Link className="btn" to="/score">Back</Link>
        </div>

        {/* Hero headline */}
        <div className="card" style={{ padding: 14, marginTop: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{headline}</div>
          <div className="muted" style={{ marginTop: 6 }}>
            We quantify impact as expected missed months and expected annual loss.
          </div>
        </div>

        {/* Quick tiles */}
        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Icon>💸</Icon>
              <div>
                <div style={{ fontWeight: 900 }}>Expected annual loss</div>
                <div className="muted" style={{ marginTop: 2 }}>
                  {annualLossDelta == null
                    ? "Not available"
                    : `${annualLossDelta < 0 ? "Reduced" : "Increased"} ${money(Math.abs(annualLossDelta))}`}
                  {annualLossPct != null ? ` (${formatPct(annualLossPct)})` : ""}
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Icon>📆</Icon>
              <div>
                <div style={{ fontWeight: 900 }}>Expected missed months</div>
                <div className="muted" style={{ marginTop: 2 }}>
                  {missedDelta == null
                    ? "Not available"
                    : `${missedDelta < 0 ? "Reduced" : "Increased"} ${Math.abs(round1(missedDelta))} months`}
                  {missedPct != null ? ` (${formatPct(missedPct)})` : ""}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 2 changes (short) */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <strong>Top changes</strong>
          <span className="muted">quick read</span>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {top2.map((x) => (
            <div
              key={x.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                borderTop: "1px solid rgba(0,0,0,0.06)",
                paddingTop: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 900 }}>{x.label}</div>
                <div className="muted" style={{ marginTop: 2 }}>{x.value}</div>
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
                {x.good ? "Improved" : "Changed"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-side cards */}
      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <strong>Legacy model</strong>
            <span className="muted">baseline</span>
          </div>

          <div style={{ marginTop: 10, fontSize: 40, fontWeight: 900 }}>
            {round1(legacyScore)}
            <span className="muted" style={{ fontSize: 14, marginLeft: 6 }}>/100</span>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ fontWeight: 800 }}>Expected missed months</div>
            <div style={{ fontWeight: 900, marginTop: 4 }}>
              {legacyImpact.missedMonths == null ? "—" : `${round1(legacyImpact.missedMonths)} months`}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ fontWeight: 800 }}>Expected annual loss</div>
            <div style={{ fontWeight: 900, marginTop: 4 }}>
              {legacyImpact.annualLoss == null ? "—" : money(legacyImpact.annualLoss)}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <strong>FairTenant model</strong>
            <span style={{ fontWeight: 800 }}>{data.new_model.risk_level ?? "—"}</span>
          </div>

          <div style={{ marginTop: 10, fontSize: 40, fontWeight: 900 }}>
            {round1(newScore)}
            <span className="muted" style={{ fontSize: 14, marginLeft: 6 }}>/100</span>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ fontWeight: 800 }}>Expected missed months</div>
            <div style={{ fontWeight: 900, marginTop: 4 }}>
              {newImpact.missedMonths == null ? "—" : `${round1(newImpact.missedMonths)} months`}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ fontWeight: 800 }}>Expected annual loss</div>
            <div style={{ fontWeight: 900, marginTop: 4 }}>
              {newImpact.annualLoss == null ? "—" : money(newImpact.annualLoss)}
            </div>
          </div>
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
