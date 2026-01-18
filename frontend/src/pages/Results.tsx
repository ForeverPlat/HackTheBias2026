import { Link, useLocation } from "react-router-dom";
import { useMemo } from "react";
import type { EvaluationResponse, FeatureExplanation } from "../types/tenant";
import ScoreSummary from "../components/ScoreSummary";
import FeatureCard from "../components/FeatureCard";

type ResultsLocationState =
  | { result?: EvaluationResponse; payload?: unknown }
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

function extractResult(state: ResultsLocationState): EvaluationResponse | null {
  if (!state) return null;
  if (typeof state === "object" && "result" in state) {
    return (state as { result?: EvaluationResponse }).result ?? null;
  }
  return state as EvaluationResponse;
}

const rank: Record<FeatureExplanation["status"], number> = {
  risk: 0,
  moderate: 1,
  good: 2,
};

export default function Results() {
  const location = useLocation();

  const resultFromState = extractResult(location.state as ResultsLocationState);
  const data =
    resultFromState ??
    safeParse<EvaluationResponse>(sessionStorage.getItem("fairtenant:lastScore")) ??
    safeParse<EvaluationResponse>(sessionStorage.getItem("last_evaluation"));

  const sortedBreakdown = useMemo(() => {
    const arr = Array.isArray((data as any)?.breakdown)
      ? ((data as any).breakdown as FeatureExplanation[])
      : [];
    return [...arr].sort((a, b) => rank[a.status] - rank[b.status]);
  }, [data]);

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

      {sortedBreakdown.length === 0 ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>No breakdown returned</h3>
          <p className="muted" style={{ marginBottom: 0 }}>
            The API returned a score but no <code>breakdown</code> array.
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

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link className="btn btn-primary" to="/">
          New assessment
        </Link>
        <Link className="btn" to="/comparison">
          Comparison
        </Link>
      </div>
    </div>
  );
}
