import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression

# # -----------------------------
# # 1. LOAD DATA AND TRAIN MODEL
# # -----------------------------
# train_df = pd.read_csv("../data/tenant_data_biased_train.csv")

# # Features for score-based model
# features_all = ['credit_score','income_stability','eviction_history','criminal_history','voucher',
#                 'employment_years','savings_ratio','rental_history_years']

# X_train = train_df[features_all].copy()
# y_train = train_df['approved']  # continuous score

# # Standardize numeric columns
# numeric_cols = ['credit_score','income_stability','employment_years','savings_ratio','rental_history_years']
# scaler = StandardScaler()
# X_train[numeric_cols] = scaler.fit_transform(X_train[numeric_cols])

# # Train linear regression model
# model = LinearRegression()
# model.fit(X_train, y_train)

FEATURES = [
    'credit_score',
    'income_stability',
    'eviction_history',
    'criminal_history',
    'voucher',
    'employment_years',
    'savings_ratio',
    'rental_history_years'
]

NUMERIC_COLS = [
    'credit_score',
    'income_stability',
    'employment_years',
    'savings_ratio',
    'rental_history_years'
]

def train_model(path="../data/tenant_data_biased_train.csv"):
    train_df = pd.read_csv(path)

    X_train = train_df[FEATURES].copy()
    y_train = train_df['approved'] # continous score

    scaler = StandardScaler()

    X_train[NUMERIC_COLS] = scaler.fit_transform(X_train[NUMERIC_COLS])

    # Train linear regression model
    model = LinearRegression()
    model.fit(X_train, y_train)

    return model, scaler, y_train.min(), y_train.max()

MODEL, SCALER, MIN_SCORE, MAX_SCORE = train_model()

# -----------------------------
# 2. USER INPUT FUNCTION
# -----------------------------
# def get_user_input():
#     print("Please enter the following tenant information:")
#     credit_score = float(input("Credit score (300-850): "))
#     income_stability = float(input("Income stability (0-100): "))
#     eviction_history = int(input("Eviction history? (0=No, 1=Yes): "))
#     criminal_history = int(input("Criminal history? (0=No, 1=Yes): "))
#     voucher = int(input("Voucher recipient? (0=No, 1=Yes): "))
#     employment_years = float(input("Years employed: "))
#     savings_ratio = float(input("Savings ratio (0-1): "))
#     rental_history_years = float(input("Rental history years: "))

#     data = pd.DataFrame([{
#         'credit_score': credit_score,
#         'income_stability': income_stability,
#         'eviction_history': eviction_history,
#         'criminal_history': criminal_history,
#         'voucher': voucher,
#         'employment_years': employment_years,
#         'savings_ratio': savings_ratio,
#         'rental_history_years': rental_history_years
#     }])

#     return data

def preprocess_data(data):
    df = pd.DataFrame([{
        'credit_score': data.credit_score,
        'income_stability': data.income_stability,
        'eviction_history': int(data.eviction_history),
        'criminal_history': int(data.criminal_history),
        'voucher': int(data.voucher),
        'employment_years': data.employment_years,
        'savings_ratio': data.savings_ratio,
        'rental_history_years': data.rental_history_years
    }])

    return df

# -----------------------------
# 3. PREDICTION FUNCTION
# -----------------------------
def predict_tenant(model, scaler, df, min_score, max_score):
    # Scale numeric columns
    data_scaled = df.copy()
    data_scaled[NUMERIC_COLS] = scaler.transform(data_scaled[NUMERIC_COLS])
    
    # Predict continuous approval score
    raw_score = model.predict(data_scaled)[0]
    
    # Rescale to 0-100
    # min_score = df['approved'].min()
    # max_score = df['approved'].max()
    score_100 = np.clip((raw_score - min_score) / (max_score - min_score) * 100, 0, 100)
    
    print(f"\nPredicted tenant approval score (0-100): {score_100:.2f}")

    return float(score_100)

# -----------------------------
# 4. RUN INTERACTIVE PROMPT
# -----------------------------
# if __name__ == "__main__":
#     user_data = get_user_input()
#     predict_tenant(user_data)

def score_tenant(tenant_request):

    df = preprocess_data(tenant_request)
    df = df[FEATURES] # order will become same

    score = predict_tenant(
        MODEL,
        SCALER,
        df,
        MIN_SCORE,
        MAX_SCORE
    )

    return {"score": round(score, 2)}
