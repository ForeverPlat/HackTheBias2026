import numpy as np
import pandas as pd

np.random.seed(42)
n = 5000
a=0

# Race array    
races = np.random.choice(['White','Black','Hispanic'], p=[0.5,0.3,0.2], size=n)

# Voucher based of race
voucher = np.array([np.random.choice([0,1], p=[0.8,0.2]) if r=='White' 
                    else np.random.choice([0,1], p=[0.5,0.5]) if r=='Black' 
                    else np.random.choice([0,1], p=[0.6,0.4]) for r in races])

# Credit score with disparities 
credit_scores = []
for r in races:
    if r == 'White': credit_scores.append(np.random.normal(725, 50))
    elif r == 'Black': credit_scores.append(np.random.normal(612, 60))
    else: credit_scores.append(np.random.normal(661, 55))
credit_scores = np.clip(credit_scores, 300, 850)

# Eviction history
eviction_history = (np.random.rand(n) < (0.1 + 0.2*voucher)).astype(int)

# Income stability
income_stability = np.clip(np.random.normal(80 - 15*voucher - 10*(races=='Black') - 5*(races=='Hispanic'), 10), 0, 100)

# Criminal history
criminal_history = (np.random.rand(n) < 0.1).astype(int)

employment_years = np.clip(np.random.normal(5 + 2*(voucher==0), 2, n), 0, 40)

savings_ratio = np.clip(np.random.normal(0.1 + 0.05*(income_stability/100), 0.05, n), 0, 1)

rental_history_years = np.clip(np.random.normal(3 + 0.5*income_stability/100, 2, n), 0, 20)

# Monthly income based on race benchmarks (USD)
race_base_income = np.where(
    races == 'White', 6400,
    np.where(races == 'Black', 4200, 4800)
)

monthly_income = (
    race_base_income *
    (income_stability / 100) *      # stability adjustment
    (1 - 0.25 * voucher) +           # voucher penalty
    np.random.normal(0, 600, n)      # noise
)

monthly_income = np.clip(monthly_income, 800, 20000)
income_component = np.log(monthly_income + 1)
income_component = (income_component - income_component.mean()) / income_component.std()

# Define a score
# Higher credit, higher income stability = better
# Eviction or criminal history = worse
score = (
    0.003*(credit_scores-600) +      # normalized credit contribution
    0.05*income_stability -           # income contribution
    0.2*eviction_history -            # eviction penalty
    0.2*criminal_history +              # criminal penalty
    0.05*employment_years +       
    0.1*savings_ratio +            
    0.03*rental_history_years+
    0.25 * income_component  
)

# # Introduce systemic bias
# score[races=='Black'] -= 0.1
# score[races=='Hispanic'] -= 0.05
# score[voucher==1] -= 0.05

# # Approve if score above threshold
# threshold = 4.12
# approved = (score >= threshold).astype(int)

# Create DataFrame
df = pd.DataFrame({
    'race': races,
    'voucher': voucher,
    'credit_score': credit_scores,
    'eviction_history': eviction_history,
    'criminal_history': criminal_history,
    'income_stability': income_stability,
    'monthly_income': monthly_income,
    'approved': score,
    'employment_years' : employment_years,
    'savings_ratio' : savings_ratio,
    'rental_history_years':rental_history_years
})

# Split into train/test
from sklearn.model_selection import train_test_split
train_df, test_df = train_test_split(df, test_size=0.2, random_state=42)

train_df.to_csv("tenant_data_biased_train.csv", index=False)
test_df.to_csv("tenant_data_biased_test.csv", index=False)

print("DATA created!")

