// src/pages/Results.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type {
  EvaluationResponse,
  TenantInputPayload,
  FeatureExplanation,
  CompareResponse,
} from "../types/tenant";
import ScoreSummary from "../components/ScoreSummary";
import FeatureCard from "../components/FeatureCard";
import ModelComparison from "../components/ModelComparison";
import { compareTenant } from "../services/api";

type ResultsLocationState =
  | { result?: EvaluationResponse; payload?: TenantInputPayload }
  | EvaluationResponse
  | null
  | undefined;

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function extractFromState(state: ResultsLocationState): {
  result: EvaluationResponse | null;
  payload: TenantInputPayload | null;
} {
  if (!state) return { result: null, payload: null };

  // New navigation shape: { result, payload }
  if (typeof state === "object" && "result" in state) {
    const s = state as { result?: EvaluationResponse; payload?: TenantInputPayload };
    return { result: s.result ?? null, payload: s.payload ?? null };
  }

  // Old navigation shape: EvaluationResponse directly
  return { result: state as EvaluationResponse, payload: null };
}

const rank: Record<FeatureExplanation["status"], number> = {
  risk: 0,
  moderate: 1,
  good: 2,
};

export default function Results() {
  const location = useLocation();
  const extracted = extractFromState(location.state as ResultsLocationState);

  const [data, setData] = useState<EvaluationResponse | null>(extracted.result);
  const [payload, setPayload] = useState<TenantInputPayload | null>(extracted.payload);

  // Comparison state
  const [compare, setCompare] = useState<CompareResponse | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Hydrate from sessionStorage if missing
  useEffect(() => {
    if (!data) {
      const cached =
        safeParse<EvaluationResponse>(sessionStorage.getItem("fairtenant:lastScore")) ??
        safeParse<EvaluationResponse>(sessionStorage.getItem("last_evaluation")); // backward compat
      if (cached) setData(cached);
    }

    if (!payload) {
      const cachedPayload = safeParse<TenantInputPayload>(sessionStorage.getItem("fairtenant:lastPayload"));
      if (cachedPayload) setPayload(cachedPayload);
    }
  }, [data, payload]);

  // Sort breakdown safely (never assume it's present)
  const sortedBreakdown = useMemo(() => {
    const arr = Array.isArray((data as any)?.breakdown) ? ((data as any).breakdown as FeatureExplanation[]) : [];
    return [...arr].sort((a, b) => rank[a.status] - rank[b.status]);
  }, [data]);

  // Fetch compare once we have payload
  useEffect(() => {
    if (!payload) return;

    let cancelled = false;
    setCompareLoading(true);
    setCompareError(null);

    (async () => {
      try {
        const res = await compareTenant(payload);
        if (!cancelled) setCompare(res);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) setCompareError(msg);
      } finally {
        if (!cancelled) setCompareLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (!data) {
    return (
      <div className="card">
        <h2 className="page-title">No results yet</h2>
        <p className="muted">Run an evaluation first.</p>
        <Link className="btn btn-primary" to="/">
          Go to form
        </Link>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <ScoreSummary score={data.score} risk_level={data.risk_level} />

      {/* Comparison block */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <h3 style={{ margin: 0 }}>Model comparison</h3>
          <span className="muted" style={{ fontWeight: 700 }}>
            Legacy vs FairTenant
          </span>
        </div>

        {compareLoading && (
          <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
            Loading comparison…
          </p>
        )}

        {compareError && (
          <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
            Comparison unavailable: {compareError}
          </p>
        )}

        {compare && <ModelComparison data={compare} />}
      </div>

      {/* Breakdown */}
      {sortedBreakdown.length === 0 ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>No breakdown returned</h3>
          <p className="muted" style={{ marginBottom: 0 }}>
            The API returned a score but did not include a <code>breakdown</code> array.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {sortedBreakdown.map((b, idx) => (
            <FeatureCard
              key={`${b.name}-${idx}`}
              name={b.name}
              value={b.value}
              status={b.status}
              explanation={b.explanation}
            />
          ))}
        </div>
      )}

      <Link className="btn btn-primary" to="/">
        New assessment
      </Link>
    </div>
  );
}
