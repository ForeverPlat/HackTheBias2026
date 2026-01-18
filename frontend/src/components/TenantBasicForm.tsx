import React, { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

type BoolSelect = "" | "true" | "false";

type FormData = {
  creditScore: string;
  incomeStability: string;
  evictionHistory: BoolSelect;
  criminalHistory: BoolSelect;
  voucher: BoolSelect;
  employmentYears: string;
  savingsRatio: string; 
  rentalHistoryYears: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export const TenantBasicForm = () => {
  const [formData, setFormData] = useState<FormData>({
    creditScore: "",
    incomeStability: "",
    evictionHistory: "",
    criminalHistory: "",
    voucher: "",
    employmentYears: "",
    savingsRatio: "",
    rentalHistoryYears: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for that field once user edits it
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (data: FormData): FormErrors => {
    const next: FormErrors = {};

    const num = (s: string) => Number(s);

    const credit = num(data.creditScore);
    if (!data.creditScore.trim() || !Number.isFinite(credit) || credit < 300 || credit > 850) {
      next.creditScore = "Credit score must be between 300 and 850.";
    }

    const stability = num(data.incomeStability);
        if (!data.incomeStability.trim() || !Number.isFinite(stability) || stability < 0 || stability > 1) {
        next.incomeStability = "Income stability must be between 0 and 1.";
    }

    if (data.evictionHistory === "") next.evictionHistory = "Please select Yes or No.";
    if (data.criminalHistory === "") next.criminalHistory = "Please select Yes or No.";
    if (data.voucher === "") next.voucher = "Please select Yes or No.";

    const empYears = num(data.employmentYears);
    if (!data.employmentYears.trim() || !Number.isFinite(empYears) || empYears < 0) {
      next.employmentYears = "Enter years employed (0 or more).";
    }

    const ratio = num(data.savingsRatio);
    if (!data.savingsRatio.trim() || !Number.isFinite(ratio) || ratio < 0 || ratio > 1) {
      next.savingsRatio = "Savings ratio must be between 0 and 1.";
    }

    const rhYears = num(data.rentalHistoryYears);
    if (!data.rentalHistoryYears.trim() || !Number.isFinite(rhYears) || rhYears < 0) {
      next.rentalHistoryYears = "Enter rental history years (0 or more).";
    }

    return next;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nextErrors = validate(formData);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    const payload = {
      credit_score: Number(formData.creditScore),
      income_stability: Number(formData.incomeStability),
      eviction_history: formData.evictionHistory === "true",
      criminal_history: formData.criminalHistory === "true",
      voucher: formData.voucher === "true",
      employment_years: Number(formData.employmentYears),
      savings_ratio: Number(formData.savingsRatio),
      rental_history_years: Number(formData.rentalHistoryYears),
    };

    console.log("Payload:", payload);

    // TODO: replace with real API call later

    const res = await fetch('http//localhost:8000/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload })
    });

    const result = await res.json();


    navigate("/score", { state: { score: result.score, risk: "" } });
  };

  return (
    <div className="card">
      <form className="form" onSubmit={handleSubmit} noValidate>
        <h2 className="page-title">Tenant Financial Info</h2>
        <p className="muted">Enter details to generate an eligibility score.</p>

        <div className="field">
          <label htmlFor="creditScore">Credit Score</label>
          <input
            id="creditScore"
            data-first-field
            className="input"
            type="number"
            name="creditScore"
            value={formData.creditScore}
            onChange={handleChange}
            min="300"
            max="850"
            step="1"
            aria-invalid={!!errors.creditScore}
            />
          {errors.creditScore && <div className="field-error">{errors.creditScore}</div>}
        </div>

        <div className="field">
            <label htmlFor="incomeStability">Income Stability (0–1)</label>
            <input
                id="incomeStability"
                className="input"
                type="number"
                name="incomeStability"
                value={formData.incomeStability}
                onChange={handleChange}
                min="0"
                max="1"
                step="0.01"
                aria-invalid={!!errors.incomeStability}
            />
            {errors.incomeStability && <div className="field-error">{errors.incomeStability}</div>}
        </div>


        <div className="field">
          <label htmlFor="evictionHistory">Eviction History</label>
          <select
            id="evictionHistory"
            className="input"
            name="evictionHistory"
            value={formData.evictionHistory}
            onChange={handleChange}
            aria-invalid={!!errors.evictionHistory}
          >
            <option value="">Select…</option>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
          {errors.evictionHistory && <div className="field-error">{errors.evictionHistory}</div>}
        </div>

        <div className="field">
          <label htmlFor="criminalHistory">Criminal History</label>
          <select
            id="criminalHistory"
            className="input"
            name="criminalHistory"
            value={formData.criminalHistory}
            onChange={handleChange}
            aria-invalid={!!errors.criminalHistory}
          >
            <option value="">Select…</option>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
          {errors.criminalHistory && <div className="field-error">{errors.criminalHistory}</div>}
        </div>

        <div className="field">
          <label htmlFor="voucher">Voucher</label>
          <select
            id="voucher"
            className="input"
            name="voucher"
            value={formData.voucher}
            onChange={handleChange}
            aria-invalid={!!errors.voucher}
          >
            <option value="">Select…</option>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
          {errors.voucher && <div className="field-error">{errors.voucher}</div>}
        </div>

        <div className="field">
          <label htmlFor="employmentYears">Employment Years</label>
          <input
            id="employmentYears"
            className="input"
            type="number"
            name="employmentYears"
            value={formData.employmentYears}
            onChange={handleChange}
            min="0"
            step="0.1"
            aria-invalid={!!errors.employmentYears}
          />
          {errors.employmentYears && <div className="field-error">{errors.employmentYears}</div>}
        </div>

        <div className="field">
          <label htmlFor="savingsRatio">Savings Ratio (0–1)</label>
          <input
            id="savingsRatio"
            className="input"
            type="number"
            name="savingsRatio"
            value={formData.savingsRatio}
            onChange={handleChange}
            min="0"
            max="1"
            step="0.01"
            aria-invalid={!!errors.savingsRatio}
          />
          {errors.savingsRatio && <div className="field-error">{errors.savingsRatio}</div>}
        </div>

        <div className="field">
          <label htmlFor="rentalHistoryYears">Rental History Years</label>
          <input
            id="rentalHistoryYears"
            className="input"
            type="number"
            name="rentalHistoryYears"
            value={formData.rentalHistoryYears}
            onChange={handleChange}
            min="0"
            step="0.1"
            aria-invalid={!!errors.rentalHistoryYears}
          />
          {errors.rentalHistoryYears && (
            <div className="field-error">{errors.rentalHistoryYears}</div>
          )}
        </div>

        <button className="btn btn-primary" type="submit">
          Calculate Score
        </button>
      </form>
    </div>
  );
};
