import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { TenantInputPayload } from "../types/tenant";

type Props = {
  onSubmit: (data: TenantInputPayload) => Promise<void> | void;
  submitting?: boolean;
};

type FormState = {
  monthly_income: string;
  monthly_rent: string;
  liquid_savings: string;
  monthly_debt: string;
  income_history_text: string; 
};

type Errors = Partial<Record<keyof FormState, string>>;

function parseIncomeHistory(text: string): { values?: number[]; error?: string } {
  const cleaned = text.trim();
  if (!cleaned) return {}; 

  if (!cleaned.includes(",")) {
    return { error: "Enter 3–6 values separated by commas (e.g., 4800, 5000, 5200)." };
  }

  const parts = cleaned
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (parts.length < 3 || parts.length > 6) {
    return { error: "Enter between 3 and 6 monthly values." };
  }

  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isFinite(n))) {
    return { error: "Income history must contain only numbers." };
  }
  if (nums.some((n) => n < 0)) {
    return { error: "Income history cannot include negative values." };
  }

  return { values: nums };
}

function formatMoney(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

export default function TenantForm({ onSubmit, submitting = false }: Props) {
  const [state, setState] = useState<FormState>({
    monthly_income: "",
    monthly_rent: "",
    liquid_savings: "",
    monthly_debt: "",
    income_history_text: "",
  });

  const [errors, setErrors] = useState<Errors>({});

  const parsedIncomeHistory = useMemo(
    () => parseIncomeHistory(state.income_history_text),
    [state.income_history_text]
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setState((p) => ({ ...p, [name]: value }));

    if (errors[name as keyof FormState]) {
      setErrors((p) => ({ ...p, [name]: undefined }));
    }
  };

  const validate = useMemo(() => {
    return (): { payload?: TenantInputPayload; errs: Errors } => {
      const errs: Errors = {};
      const num = (s: string) => Number(s);

      const mi = num(state.monthly_income);
      if (!state.monthly_income.trim() || !Number.isFinite(mi) || mi <= 0) {
        errs.monthly_income = "Enter a monthly income greater than 0.";
      }

      const mr = num(state.monthly_rent);
      if (!state.monthly_rent.trim() || !Number.isFinite(mr) || mr <= 0) {
        errs.monthly_rent = "Enter a monthly rent greater than 0.";
      }

      const ls = num(state.liquid_savings);
      if (!state.liquid_savings.trim() || !Number.isFinite(ls) || ls < 0) {
        errs.liquid_savings = "Enter liquid savings (0 or more).";
      }

      const md = num(state.monthly_debt);
      if (!state.monthly_debt.trim() || !Number.isFinite(md) || md < 0) {
        errs.monthly_debt = "Enter monthly debt payments (0 or more).";
      }

      const parsed = parseIncomeHistory(state.income_history_text);
      if (parsed.error) {
        errs.income_history_text = parsed.error;
      }

      if (Object.values(errs).some(Boolean)) return { errs };

      const payload: TenantInputPayload = {
        monthly_income: mi,
        monthly_rent: mr,
        liquid_savings: ls,
        monthly_debt: md,
        ...(parsed.values ? { income_history: parsed.values } : {}),
      };

      return { payload, errs: {} };
    };
  }, [state]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const { payload, errs } = validate();
    setErrors(errs);

    if (!payload) return;

    await onSubmit(payload);
  };

  return (
    <div className="card">
      <form className="form" onSubmit={handleSubmit} noValidate>
        <h2 className="page-title">Evaluate Payment Reliability</h2>
        <p className="muted">Cash-flow signals only. No proxy data.</p>

        <div className="field">
          <label htmlFor="monthly_income">Monthly Income ($)</label>
          <input
            id="monthly_income"
            data-first-field
            className="input"
            type="number"
            name="monthly_income"
            value={state.monthly_income}
            onChange={handleChange}
            aria-invalid={!!errors.monthly_income}
          />
          {errors.monthly_income && <div className="field-error">{errors.monthly_income}</div>}
        </div>

        <div className="field">
          <label htmlFor="monthly_rent">Monthly Rent ($)</label>
          <input
            id="monthly_rent"
            className="input"
            type="number"
            name="monthly_rent"
            value={state.monthly_rent}
            onChange={handleChange}
            aria-invalid={!!errors.monthly_rent}
          />
          {errors.monthly_rent && <div className="field-error">{errors.monthly_rent}</div>}
        </div>

        <div className="field">
          <label htmlFor="liquid_savings">Liquid Savings ($)</label>
          <input
            id="liquid_savings"
            className="input"
            type="number"
            name="liquid_savings"
            value={state.liquid_savings}
            onChange={handleChange}
            aria-invalid={!!errors.liquid_savings}
          />
          {errors.liquid_savings && <div className="field-error">{errors.liquid_savings}</div>}
        </div>

        <div className="field">
          <label htmlFor="monthly_debt">Monthly Debt Payments ($)</label>
          <input
            id="monthly_debt"
            className="input"
            type="number"
            name="monthly_debt"
            value={state.monthly_debt}
            onChange={handleChange}
            aria-invalid={!!errors.monthly_debt}
          />
          {errors.monthly_debt && <div className="field-error">{errors.monthly_debt}</div>}
        </div>

        <div className="field">
          <label htmlFor="income_history_text">Income History (optional)</label>
          <textarea
            id="income_history_text"
            className="input"
            name="income_history_text"
            value={state.income_history_text}
            onChange={handleChange}
            placeholder="Last 3–6 months (comma-separated). Example: 4800, 5000, 5200"
            rows={3}
            aria-invalid={!!errors.income_history_text}
          />

          <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
            Enter 3–6 monthly gross income values separated by commas.
          </div>

          {parsedIncomeHistory.values && parsedIncomeHistory.values.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {parsedIncomeHistory.values.map((v, idx) => (
                <span
                  key={`${v}-${idx}`}
                  style={{
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.8)",
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                  title={`Month ${idx + 1}`}
                >
                  {formatMoney(v)}
                </span>
              ))}
            </div>
          )}

          {errors.income_history_text && <div className="field-error">{errors.income_history_text}</div>}
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Evaluating..." : "Calculate Score"}
        </button>
      </form>
    </div>
  );
}
