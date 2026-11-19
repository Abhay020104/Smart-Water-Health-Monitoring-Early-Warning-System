# 🌊 Smart Water Health Monitoring & Early Warning System (WBDP)

An AI/ML-powered water health monitoring and early warning full-stack web application developed as a 7th-semester minor project. The system classifies drinking water quality (**Low / Medium / High**) following **WHO Guidelines** and **BIS IS 10500 Standards**, predicts potential waterborne disease risks (**Cholera, Typhoid, Dysentery, Hepatitis A/E, Leptospirosis, Giardiasis**), and delivers real-time actionable advisories.

---

## 🌟 Key Features

1. **Interactive Water Quality & Disease Prediction (`/predict`)**:
   - Accepts **12 water chemistry parameters**, **4 environmental variables**, and **8 patient clinical symptoms**.
   - **Single-Parameter Sensitivity**: Built on the *Limiting-Factor Environmental Principle*. Violating even a single safety threshold (e.g., pH < 5.0, Fecal Coliform > 1,000/100ml, Arsenic > 25 µg/L) immediately classifies water as **Low Quality** and flags the exact limiting factor.
   - **Clinical Signature Matching**: Selecting individual symptoms instantly shifts disease predictions (e.g., Bloody Stool → Dysentery, Jaundice → Hepatitis A / Leptospirosis).

2. **Real-Time Early Warning & Remediation System**:
   - Color-coded severity alerts (**Critical / High / Cautionary / Safe**) with animated warnings.
   - Actionable guidelines: immediate boiling alerts, shock chlorination, sand filtration, and medical prophylaxis.

3. **Machine Learning Model Comparison Dashboard (`/models`)**:
   - 10 evaluated ML classification models for both prediction tasks.
   - Interactive data tables with sorting by Accuracy, Precision, Recall, and F1-Score.
   - Interactive **Grouped Bar Charts** and **Multi-Metric Radar Charts** powered by Recharts.

4. **Waterborne Disease Knowledge Base (`/diseases`)**:
   - Clinical reference profiles for 8 waterborne diseases with pathogen types, risk levels, common symptoms, and prevention measures.

---

## 🛠️ Tech Stack & Architecture

```text
[ React 19 Frontend (Vite + Tailwind CSS) ]
                    │
            HTTP API Requests (via src/api.js)
                    ▼
     [ FastAPI Backend (Python 3.13) ]
                    │
     ┌──────────────┴──────────────┐
     ▼                             ▼
[ Limiting-Factor Logic ]     [ Trained ML Models (.pkl) ]
(WHO / BIS IS 10500 Standards) (XGBoost, KNN, StandardScalers)
```

- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router v7, Recharts, React Icons, Axios.
- **Backend**: FastAPI, Uvicorn, Pydantic, Scikit-learn, XGBoost, Joblib, NumPy, Pandas.
- **Machine Learning**:
  - **Water Quality Classification**: Best Model = **K-Nearest Neighbors (KNN)** (F1: 0.8311).
  - **Disease Risk Prediction**: Best Model = **XGBoost Classifier** (Accuracy: 94.13%, F1: 0.9409).

---

## 📁 Project Structure

```text
WBDP/
├── app.py                             # FastAPI backend application (v2.1.0)
├── WBDP_Pipeline.ipynb                # Jupyter Notebook: Preprocessing, EDA, 10 ML models & charts
├── requirements.txt                   # Python backend dependencies
├── README.md                          # Main project documentation
├── .gitignore                         # Git ignore configuration
│
├── models/                            # Serialized ML artifacts (.pkl) & metrics
│   ├── best_water_quality_model.pkl   # Serialized KNN model (F1: 0.8311)
│   ├── best_disease_model.pkl         # Serialized XGBoost model (F1: 0.9409)
│   ├── wq_scaler.pkl                  # StandardScaler for 12 water chemistry features
│   ├── disease_scaler.pkl             # StandardScaler for 26 disease features
│   ├── label_encoders.pkl             # LabelEncoders for source, treatment & disease
│   └── training_results.json          # 10-model evaluation metrics across both tasks
│
└── frontend/                          # React + Vite application
    ├── index.html                     # HTML root with AquaGuard favicon
    ├── package.json                   # Frontend dependencies
    ├── pnpm-lock.yaml                 # Dependency lockfile
    ├── vite.config.js                 # Vite bundler & Tailwind configuration
    ├── .gitignore                     # Git ignore rules
    ├── public/                        # Static assets (SVG icons)
    └── src/
        ├── api.js                     # Centralized Axios client for FastAPI
        ├── App.jsx                    # Application routing & layout
        ├── main.jsx                   # React root entry point
        ├── index.css                  # Tailwind styles & custom animations
        ├── components/
        │   ├── Navbar.jsx             # Sticky navigation bar with active route indicators
        │   └── PredictionResult.jsx   # Color-coded results, limiting factors & alerts
        └── pages/
            ├── Dashboard.jsx          # Hero section, API health check & summary stats
            ├── Predict.jsx            # Interactive parameter form & real-time prediction
            ├── ModelResults.jsx       # 10-model comparison tables & Recharts visualizations
            └── Diseases.jsx           # 8 expandable disease reference cards
```

---


## 🚀 How to Run the Application

### Prerequisites
- Python 3.10+ (installed and added to PATH)
- Node.js v18+ and `pnpm` (or `npm`)

---

### Step 1: Start the FastAPI Backend
Open a terminal in the root `WBDP` folder:
```powershell
# Activate your virtual environment if using one:
.venv\Scripts\activate

# Start Uvicorn server:
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```
- **Backend API URL**: `http://localhost:8000`
- **Interactive Swagger Documentation**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

---

### Step 2: Start the React Frontend
Open a **second** terminal window:
```powershell
cd frontend

# Install dependencies (first time only):
pnpm install

# Start the Vite development server:
pnpm run dev
```
- **Web Application URL**: `http://localhost:5173`

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API overview and documentation links |
| `GET` | `/health` | Health check and loaded model verification |
| `POST` | `/predict` | Water sample assessment & disease prediction |
| `GET` | `/model-results` | Evaluation metrics (Accuracy, F1, Precision, Recall) for 10 ML models |
| `GET` | `/diseases-info` | Comprehensive clinical profiles for all 8 waterborne diseases |
| `GET` | `/feature-columns` | Schema definition and WHO/BIS standard ranges |

---

## 🧪 Single-Parameter Sensitivity Testing

The system evaluates inputs against **WHO Guidelines** and **BIS IS 10500 Standards** using the Limiting-Factor Principle:

| Test Scenario | Input Change | Predicted Quality | Predicted Disease | Limiting Factor Rationale |
|---|---|:---:|:---:|---|
| **Clean Baseline** | Default values | **High** | **No_Disease** | All parameters comply with safety standards |
| **Acidic Hazard** | pH = 3.2 | **Low** ⚠️ | Giardiasis | Severely acidic pH (3.2 < 5.0) — corrosive hazard |
| **High Turbidity** | Turbidity = 35 NTU | **Low** ⚠️ | Giardiasis | Turbidity > 25 NTU shields waterborne pathogens |
| **Coliform Spike** | Fecal Coliform = 3500 | **Low** ⚠️ | **Cholera** | Severe bacterial contamination (> 1,000/100ml) |
| **Toxic Heavy Metal** | Arsenic = 35 µg/L | **Low** ⚠️ | Giardiasis | Toxic chemical level (35 µg/L > WHO 10 µg/L limit) |
| **Pathognomonic Symptom** | Bloody Stool = 1 | High | **Dysentery** | Pathognomonic clinical hallmark for Dysentery |
| **Hepatic Symptom** | Jaundice = 1 | High | **Hepatitis A** | Acute viral liver inflammation signature |
| **Flood Vector** | Flooding = 1 + Turbid water | **Medium** ⚡ | **Leptospirosis** | Flood runoff zoonotic transmission hazard |

---

## 📊 Evaluated Machine Learning Models

10 classification algorithms were trained and compared in `WBDP_Pipeline.ipynb`:

| Model | Water Quality Task | Disease Prediction Task |
|---|:---:|:---:|
| **K-Nearest Neighbors (KNN)** | **Best Model (F1: 0.8311)** | Evaluated |
| **XGBoost Classifier** | Evaluated | **Best Model (F1: 0.9409, Acc: 94.13%)** |
| Random Forest | Evaluated | Evaluated |
| Gradient Boosting | Evaluated | Evaluated |
| Extra Trees | Evaluated | Evaluated |
| AdaBoost | Evaluated | Evaluated |
| Decision Tree | Evaluated | Evaluated |
| Logistic Regression | Evaluated | Evaluated |
| Linear SVM | Evaluated | Evaluated |
| Naive Bayes | Evaluated | Evaluated |

---


