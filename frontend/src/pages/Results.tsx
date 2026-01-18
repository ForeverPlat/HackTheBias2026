import { useLocation, Link } from "react-router-dom";
import { useMemo } from "react";
import type { EvaluationResponse, FeatureExplanation } from "../types/tenant";
import ScoreSummary from "../components/ScoreSummary";
import FeatureCard from "../components/FeatureCard";

type ResultsLocationState =
  | { result: EvaluationResponse; payload?: unknown }
  | EvaluationResponse
  | null
  | undefined;

function extractResult(state: ResultsLocationState): EvaluationResponse | null {
  if (!state) return null;

  if (typeof state === "object" && "result" in state) {
    const s = state as { result?: EvaluationResponse };
    return s.result ?? null;
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

  let data: EvaluationResponse | null = resultFromState;

  if (!data) {
    const cachedNew = sessionStorage.getItem("fairtenant:lastScore");
    if (cachedNew) data = JSON.parse(cachedNew) as EvaluationResponse;

    if (!data) {
      const cachedOld = sessionStorage.getItem("last_evaluation");
      if (cachedOld) data = JSON.parse(cachedOld) as EvaluationResponse;
    }
  }

  const sortedBreakdown = useMemo(() => {
    const breakdown = data?.breakdown ?? [];
    return [...breakdown].sort((a, b) => rank[a.status] - rank[b.status]);
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

      <Link className="btn btn-primary" to="/">
        New assessment
      </Link>
    </div>
  );
}
