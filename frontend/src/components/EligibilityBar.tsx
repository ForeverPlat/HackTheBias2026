import React from "react";

type EligibilityBarProps = {
  score: number;           // 0–100
  label?: string;
  subtitle?: string;
  showPercent?: boolean;
};

function clamp(n: number) {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function bucket(score: number) {
  if (score >= 80) return { text: "Strong eligibility", hint: "Likely approved by capability-based screening." };
  if (score >= 60) return { text: "Moderate eligibility", hint: "Borderline—could be approved with mitigations." };
  if (score >= 40) return { text: "Low eligibility", hint: "Higher risk—review what’s driving the score." };
  return { text: "Very low eligibility", hint: "Unlikely—consider mitigations (guarantor, savings buffer, proof of income)." };
}

export default function EligibilityBar({
  score,
  label,
  subtitle,
  showPercent = true,
}: EligibilityBarProps) {
  const safeScore = clamp(score);
  const pct = `${safeScore.toFixed(0)}%`;
  const b = bucket(safeScore);

  return (
    <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Eligibility Score</h3>
          <p className="mt-1 text-sm text-slate-600">
            {subtitle ?? "Higher means more likely to be approved (based on capability signals)."}
          </p>
        </div>

        <div className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-800">
          {showPercent ? pct : `${safeScore.toFixed(0)}`}
        </div>
      </div>

      <div className="mt-4">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-[width] duration-500 ease-out"
            style={{ width: `${safeScore}%` }}
          />
          <div
            className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white bg-blue-700 shadow"
            style={{ left: `calc(${safeScore}% - 10px)` }}
          />
        </div>

        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{label ?? b.text}</p>
            <p className="mt-1 text-xs text-slate-600">{b.hint}</p>
          </div>

          <div className="flex gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-0.5">0</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5">50</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5">100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
