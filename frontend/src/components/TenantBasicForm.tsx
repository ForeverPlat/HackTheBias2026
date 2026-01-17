import React, { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom';

type FormData = {
    monthlyIncome: string;
    monthlyRent: string;
    creditScore: string;
};

export const TenatBasicForm = () => {

    const [formData, setFormData] = useState<FormData>({
        monthlyIncome: "",
        monthlyRent: "",
        creditScore: ""
    });

    const navigate = useNavigate();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const payload = {
            monthly_income: Number(formData.monthlyIncome),
            monthly_rent: Number(formData.monthlyRent),
            credit_score: formData.creditScore ? Number(formData.creditScore) : null
        }

        console.log("Payload:", payload);
        
        // for future
        // const res = await fetch("http//localhost:8000/score", {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify(payload)
        // });
        //
        // const result = await res.json()
        
        // => CHECK WHAT BACKEND WILL RETURN
        navigate('/TenantScore', {
            state: {
                score: 78,
                risk: "Low"
            }
        });
    }


    return (
        <form onSubmit={handleSubmit}>
            <h2>Tenant Financial Info</h2>

            <div>
                <label>Monthly Income ($)</label><br />
                <input
                    type='number'
                    name='monthlyIncome'
                    value={formData.monthlyIncome}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label>Monthly Rent ($)</label><br />
                <input
                    type='number'
                    name='monthlyRent'
                    value={formData.monthlyRent}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label>Credit Score</label><br />
                <input
                    type='number'
                    name='creditScore'
                    value={formData.creditScore}
                    onChange={handleChange}
                    min="300"
                    max="850"
                />
            </div>

            <button type='submit'>Submit</button>
        </form>
    )
}
