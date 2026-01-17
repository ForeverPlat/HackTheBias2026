import { useLocation } from "react-router-dom"
import EligibilityBar from "./EligibilityBar";


export const TenantScore = () => {
    const location = useLocation();
    // const { score, risk } = location.state || {};
    
    // temp
    const score = 78
    const risk = "Low"
    
    return (
        <div>
            <h2>Tenant Score</h2>
            <p>Score: {score}</p>
            <p>Risk: {risk}</p>
            <EligibilityBar score={score}/>
        </div>


    )
}
