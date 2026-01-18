import pandas as pd
import numpy as np # for handling and vector on data
import matplotlib.pyplot as plt # graphing
import seaborn as sns # Plotting

from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression

# Load data
train_df = pd.read_csv("tenant_data_biased_train.csv")
test_df  = pd.read_csv("tenant_data_biased_test.csv")

# change the race to num to correlate with data
race_map = {'White': 0, 'Black': 1, 'Hispanic': 2}
test_df['race_encoded'] = test_df['race'].map(race_map)

y_train = train_df['approved'] # the out column of the data
y_test  = test_df['approved']

# the good and bad model

# Model A
features_A = ['credit_score','eviction_history','criminal_history','income_stability','voucher']

# copies the feature into a new data frame
X_train_A = train_df[features_A].copy()
X_test_A  = test_df[features_A].copy()

scaler_A = StandardScaler()
X_train_A[['credit_score','income_stability']] = scaler_A.fit_transform(X_train_A[['credit_score','income_stability']])
X_test_A[['credit_score','income_stability']] = scaler_A.transform(X_test_A[['credit_score','income_stability']])

model_A = LinearRegression()
model_A.fit(X_train_A, y_train)

test_df['pred_A'] = model_A.predict(X_test_A)

# Metrics for Model A
corr_A = np.corrcoef(test_df['pred_A'], test_df['race_encoded'])[0,1] 

# ----- MODEL B: without credit score -----
features_B = ['eviction_history','criminal_history','income_stability','voucher','employment_years','savings_ratio','rental_history_years']

X_train_B = train_df[features_B].copy()
X_test_B  = test_df[features_B].copy()

scaler_B = StandardScaler()
columns_to_scale = ['income_stability', 'employment_years', 'savings_ratio', 'rental_history_years']

X_train_B[columns_to_scale] = scaler_B.fit_transform(X_train_B[columns_to_scale])
X_test_B[columns_to_scale] = scaler_B.transform(X_test_B[columns_to_scale])

model_B = LinearRegression()
model_B.fit(X_train_B, y_train)

test_df['pred_B'] = model_B.predict(X_test_B)

# Metrics for Model B
corr_B = np.corrcoef(test_df['pred_B'], test_df['race_encoded'])[0,1]

# --------------------------
# 3. PRINT RESULTS
# --------------------------
print("\n=== MODEL RESULTS (Score-based) ===")
print("Model A (with credit score)")
print(" Correlation with race:", round(corr_A, 3))

print("\nModel B (without credit score)")
print(" Correlation with race:", round(corr_B, 3))

# --------------------------
# 4. GRAPH RACIAL DISPARITIES (with correlation)
# --------------------------
approval_A = test_df.groupby('race')['pred_A'].mean()
approval_B = test_df.groupby('race')['pred_B'].mean()

fig, axes = plt.subplots(1, 2, figsize=(12,5))

# --- Model A ---
sns.barplot(x=approval_A.index, y=approval_A.values, ax=axes[0])
axes[0].set_title("Model A: With Credit Score")
axes[0].set_ylabel("Predicted Score")

axes[0].text(
    0.5, 0.9,
    f"Corr with race = {corr_A:.3f}",
    transform=axes[0].transAxes,
    ha='center',
    fontsize=11,
    bbox=dict(facecolor='white', alpha=0.7)
)

# --- Model B ---
sns.barplot(x=approval_B.index, y=approval_B.values, ax=axes[1])
axes[1].set_title("Model B: Without Credit Score")
axes[1].set_ylabel("Predicted Score")

axes[1].text(
    0.5, 0.9,
    f"Corr with race = {corr_B:.3f}",
    transform=axes[1].transAxes,
    ha='center',
    fontsize=11,
    bbox=dict(facecolor='white', alpha=0.7)
)

plt.tight_layout()
plt.show()
