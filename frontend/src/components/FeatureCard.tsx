import type { FeatureStatus } from "../types/tenant";

const badgeClass: Record<FeatureStatus, string> = {
  good: "badge badge-good",
  moderate: "badge badge-moderate",
  risk: "badge badge-risk",
};

export default function FeatureCard(props: {
  name: string;
  value: string;
  status: FeatureStatus;
  explanation: string;
}) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontWeight: 900 }}>{props.name}</div>
        <span className={badgeClass[props.status]}>{props.status}</span>
      </div>

      <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900 }}>{props.value}</div>
      <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>
        {props.explanation}
      </p>
    </div>
  );
}
