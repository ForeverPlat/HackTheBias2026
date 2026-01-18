import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TenantForm from "../components/TenantForm";
import { evaluateTenant } from "../services/api";
import type { TenantInputPayload, EvaluationResponse } from "../types/tenant";

function WhySection() {
  return (
    <section className="value">
      <div className="value-inner">
        <div className="value-row">
          <div className="value-left">
            <div className="value-grid">
              <div className="value-tile">
                <div className="value-icon" aria-hidden="true">⚡</div>
                <div>
                  <div className="value-title">Instant reliability score</div>
                  <div className="value-sub">See risk at a glance — no guessing.</div>
                </div>
              </div>

              <div className="value-tile">
                <div className="value-icon" aria-hidden="true">🧾</div>
                <div>
                  <div className="value-title">Reasons you can act on</div>
                  <div className="value-sub">Breakdown shows what drives the score.</div>
                </div>
              </div>

              <div className="value-tile">
                <div className="value-icon" aria-hidden="true">🛡️</div>
                <div>
                  <div className="value-title">No proxy inputs</div>
                  <div className="value-sub">Uses cash-flow signals only.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="value-right" aria-hidden="true">
            <div className="preview-card">
              <div className="preview-top">
                <div className="preview-label">Payment Reliability</div>
                <div className="preview-score">78</div>
              </div>

              <div className="preview-bar">
                <div className="preview-fill" style={{ width: "78%" }} />
                <div className="preview-dot" style={{ left: "calc(78% - 9px)" }} />
              </div>

              <div className="preview-chips">
                <span className="preview-chip">Rent burden: Good</span>
                <span className="preview-chip">Savings runway: Strong</span>
                <span className="preview-chip">Debt pressure: Moderate</span>
              </div>

              <div className="preview-foot">Clear reasons → better decisions.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function EvaluateTenant() {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (payload: TenantInputPayload) => {
  setSubmitting(true);
  try {
    const result: EvaluationResponse = await evaluateTenant(payload);

    sessionStorage.setItem("fairtenant:lastScore", JSON.stringify(result));
    sessionStorage.setItem("fairtenant:lastPayload", JSON.stringify(payload));

    navigate("/score", { state: { result, payload } });
  } finally {
    setSubmitting(false);
  }
};

  return (
    <>
      <WhySection />
      <TenantForm onSubmit={handleSubmit} submitting={submitting} />
    </>
  );
}
