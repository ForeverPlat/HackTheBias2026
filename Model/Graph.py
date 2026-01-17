import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

# --------------------------
# 1. LOAD DATA
# --------------------------
train_df = pd.read_csv("tenant_data_biased_train.csv")
test_df  = pd.read_csv("tenant_data_biased_test.csv")

# Encode race for correlation
race_map = {'White': 0, 'Black': 1, 'Hispanic': 2}
test_df['race_encoded'] = test_df['race'].map(race_map)

y_train = train_df['approved']
y_test  = test_df['approved']

# --------------------------
# 2. BOTH MODELS IN ONE SECTION
# --------------------------

# ----- MODEL A: with credit score -----
features_A = ['credit_score','eviction_history','criminal_history','income_stability','voucher']

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
mse_A = mean_squared_error(y_test, test_df['pred_A'])
r2_A  = r2_score(y_test, test_df['pred_A'])

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
mse_B = mean_squared_error(y_test, test_df['pred_B'])
r2_B  = r2_score(y_test, test_df['pred_B'])

# --------------------------
# 3. PRINT RESULTS
# --------------------------
print("\n=== MODEL RESULTS (Score-based) ===")
print("Model A (with credit score)")
print(" Correlation with race:", round(corr_A, 3))

print("\nModel B (without credit score)")
print(" Correlation with race:", round(corr_B, 3))

# --------------------------
# 4. GRAPH RACIAL DISPARITIES
# --------------------------
approval_A = test_df.groupby('race')['pred_A'].mean()
approval_B = test_df.groupby('race')['pred_B'].mean()

fig, axes = plt.subplots(1, 2, figsize=(12,5))

sns.barplot(x=approval_A.index, y=approval_A.values, ax=axes[0])
axes[0].set_title("Model A: With Credit Score")
axes[0].set_ylabel("Predicted Score")

sns.barplot(x=approval_B.index, y=approval_B.values, ax=axes[1])
axes[1].set_title("Model B: Without Credit Score")
axes[1].set_ylabel("Predicted Score")

plt.tight_layout()
plt.show()
