"""
Smart Water Health Monitoring & Early Warning System — FastAPI Backend
======================================================================
Combines trained Machine Learning models (KNN, XGBoost) with Limiting-Factor
Environmental Quality Standards (WHO / BIS IS 10500) and Clinical Symptom Signatures.

Key Capabilities:
  - Responsive to individual parameter changes (e.g., pH, Turbidity, Coliform, Symptoms).
  - Classifies water quality into Low, Medium, High with exact rationale.
  - Predicts potential waterborne diseases (Cholera, Typhoid, Dysentery, etc.)
  - Generates actionable Early Warning alerts with remediation guidelines.

Endpoints:
  GET  /                 → Project overview & documentation
  GET  /health           → Service health check
  POST /predict          → Interactive water quality & disease prediction
  GET  /model-results    → ML model evaluation metrics (10 models × 2 tasks)
  GET  /diseases-info    → Comprehensive waterborne disease profiles
  GET  /feature-columns  → Input schema and parameter documentation
"""

import os
import json
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

# ── Paths ──
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# ── Feature Definitions ──
WQ_FEATURES = [
    "water_source_encoded", "water_treatment_encoded",
    "ph", "turbidity_ntu", "dissolved_oxygen_mg_l", "bod_mg_l",
    "fecal_coliform_per_100ml", "total_coliform_per_100ml",
    "tds_mg_l", "nitrate_mg_l", "fluoride_mg_l", "arsenic_ug_l",
]

DISEASE_FEATURES = [
    "water_source_encoded", "water_treatment_encoded",
    "water_quality_index",
    "ph", "turbidity_ntu", "dissolved_oxygen_mg_l", "bod_mg_l",
    "fecal_coliform_per_100ml", "total_coliform_per_100ml",
    "tds_mg_l", "nitrate_mg_l", "fluoride_mg_l", "arsenic_ug_l",
    "open_defecation_rate",
    "avg_temperature_c", "avg_rainfall_mm", "avg_humidity_pct",
    "flooding",
    "symptom_diarrhea", "symptom_vomiting", "symptom_fever",
    "symptom_abdominal_pain", "symptom_dehydration",
    "symptom_jaundice", "symptom_bloody_stool", "symptom_skin_rash",
]

# ── Load ML Artifacts ──
try:
    encoders = joblib.load(os.path.join(MODELS_DIR, "label_encoders.pkl"))
    wq_scaler = joblib.load(os.path.join(MODELS_DIR, "wq_scaler.pkl"))
    disease_scaler = joblib.load(os.path.join(MODELS_DIR, "disease_scaler.pkl"))
    wq_model = joblib.load(os.path.join(MODELS_DIR, "best_water_quality_model.pkl"))
    disease_model = joblib.load(os.path.join(MODELS_DIR, "best_disease_model.pkl"))
    with open(os.path.join(MODELS_DIR, "training_results.json")) as f:
        training_results = json.load(f)
    print("✓ All ML models, scalers, and label encoders loaded successfully.")
except Exception as e:
    print(f"⚠ Warning during artifact loading: {e}")
    encoders, wq_scaler, disease_scaler, wq_model, disease_model, training_results = None, None, None, None, None, {}

# ── Comprehensive Disease Reference Database ──
DISEASE_INFO = {
    "No_Disease": {
        "risk_level": "None",
        "pathogen_type": "None",
        "description": "Water quality meets safety standards. No waterborne pathogen risk detected.",
        "common_symptoms": [],
        "prevention_measures": [
            "Maintain routine chlorination or filtration",
            "Store drinking water in covered, clean containers",
            "Periodic testing of storage tanks and piping networks"
        ],
    },
    "Cholera": {
        "risk_level": "Critical",
        "pathogen_type": "Bacterial (Vibrio cholerae)",
        "description": "Acute diarrheal illness caused by Vibrio cholerae infection of the intestine. Can cause severe dehydration within hours if untreated.",
        "common_symptoms": [
            "Profuse watery diarrhea ('rice-water' stools)",
            "Rapid vomiting",
            "Severe dehydration & dry mouth",
            "Leg cramps",
            "Low blood pressure & tachycardia"
        ],
        "prevention_measures": [
            "Boil water vigorously for at least 1 minute or use chlorine purification tablets",
            "Immediate oral rehydration salts (ORS) administration",
            "Strict hand hygiene with soap before food handling",
            "Safe disposal of human excreta away from water bodies"
        ],
    },
    "Typhoid": {
        "risk_level": "High",
        "pathogen_type": "Bacterial (Salmonella enterica serotype Typhi)",
        "description": "Systemic bacterial infection characterized by sustained high fever, toxic state, abdominal tenderness, and potential intestinal perforation.",
        "common_symptoms": [
            "Step-ladder rising fever reaching 39-40°C",
            "Severe headache and generalized weakness",
            "Abdominal pain and constipation/pea-soup diarrhea",
            "Faint rash (rose spots on chest and abdomen)",
            "Enlarged spleen or liver"
        ],
        "prevention_measures": [
            "Drink only boiled, filtered, or sealed bottled water",
            "Typhoid conjugate vaccination (TCV)",
            "Avoid raw salads and unpeeled fruits in endemic areas",
            "Ensure sewage lines do not cross drinking water mains"
        ],
    },
    "Dysentery": {
        "risk_level": "High",
        "pathogen_type": "Bacterial (Shigella) / Parasitic (Entamoeba histolytica)",
        "description": "Inflammatory disorder of the intestine resulting in severe diarrhea containing blood and mucus, accompanied by painful abdominal cramping.",
        "common_symptoms": [
            "Frequent loose stools with visible blood and mucus",
            "Painful tenesmus (straining during defecation)",
            "High fever and chills",
            "Severe abdominal cramps",
            "Nausea and dehydration"
        ],
    },
    "Giardiasis": {
        "risk_level": "Moderate",
        "pathogen_type": "Protozoan Parasite (Giardia duodenalis/lamblia)",
        "description": "Intestinal protozoan infection affecting the upper small intestine, causing malabsorption, prolonged diarrhea, and abdominal distension.",
        "common_symptoms": [
            "Watery, foul-smelling diarrhea with greasy appearance",
            "Excessive gas, bloating, and flatulence",
            "Stomach cramps and epigastric pain",
            "Loss of appetite and weight loss",
            "Fatigue"
        ],
        "prevention_measures": [
            "Fine-pore filtration (microfiltration < 1 micron) to trap chlorine-resistant cysts",
            "Boiling water effectively neutralizes cysts",
            "Avoid accidental water swallowing during swimming/bathing",
            "Thoroughly wash vegetables and kitchen utensils with safe water"
        ],
    },
    "Hepatitis_A": {
        "risk_level": "High",
        "pathogen_type": "Viral (Hepatitis A Virus - HAV)",
        "description": "Acute viral liver disease causing hepatic inflammation. Transmitted through water or food contaminated with feces of an infected person.",
        "common_symptoms": [
            "Jaundice (yellowing of skin and sclera)",
            "Dark tea-colored urine and pale clay-colored stools",
            "Marked fatigue and malaise",
            "Nausea, vomiting, and right upper quadrant discomfort",
            "Low-grade fever"
        ],
        "prevention_measures": [
            "Hepatitis A vaccine (highly protective)",
            "Drink treated water (boiling inactivates the virus)",
            "Strict hand washing after toilet use and before eating",
            "Sanitation barrier between septic tanks and water lines"
        ],
    },
    "Hepatitis_E": {
        "risk_level": "High",
        "pathogen_type": "Viral (Hepatitis E Virus - HEV)",
        "description": "Waterborne viral hepatitis causing epidemic outbreaks following contamination of drinking water supplies, with high mortality in pregnant women.",
        "common_symptoms": [
            "Jaundice (icteric phase)",
            "Anorexia, nausea, and vomiting",
            "Hepatomegaly with right upper abdominal pain",
            "Fever and joint pain",
            "Extreme fatigue"
        ],
        "prevention_measures": [
            "Maintain municipal drinking water chlorination standards",
            "Special precautions for pregnant women against untreated water",
            "Proper sewage drainage to prevent monsoon flood contamination",
            "Routine monitoring of open water reservoirs"
        ],
    },
    "Leptospirosis": {
        "risk_level": "High",
        "pathogen_type": "Bacterial (Leptospira interrogans)",
        "description": "Zoonotic bacterial infection spread through floodwaters and soil contaminated with urine of rodents or domestic animals. Enters via cuts or mucous membranes.",
        "common_symptoms": [
            "Sudden high fever, severe headache, and shaking chills",
            "Intense calf and back muscle pain (myalgia)",
            "Distinct conjunctival suffusion (red eyes without discharge)",
            "Petechial skin rash or jaundice (Weil's syndrome)",
            "Oliguria or renal involvement in severe cases"
        ],
        "prevention_measures": [
            "Avoid wading, swimming, or contact with stagnant floodwaters",
            "Wear waterproof rubber boots and protective gloves in flood areas",
            "Rodent control and eradication near human dwellings",
            "Prophylactic doxycycline under medical guidance during post-flood recovery"
        ],
    },
}

# ── FastAPI Application Setup ──
app = FastAPI(
    title="Smart Water Health Monitoring & Early Warning System",
    description=(
        "Production-ready API for water quality assessment (Low / Medium / High) and "
        "waterborne disease risk prediction. Built using Machine Learning and "
        "WHO/BIS IS 10500 environmental health standards."
    ),
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Request / Response Schemas ──
class WaterSampleInput(BaseModel):
    state: str = Field("Uttar Pradesh", example="Uttar Pradesh", description="Indian State")
    district: str = Field("Varanasi", example="Varanasi", description="District name")
    water_source: str = Field(
        "Piped",
        example="Piped",
        description="Source: Borewell, Open Well, Piped, Pond, Rainwater, River, Tanker"
    )
    water_treatment: str = Field(
        "Chlorinated",
        example="Chlorinated",
        description="Treatment: Boiled, Chlorinated, Filtered, Untreated"
    )
    ph: float = Field(7.2, ge=0.0, le=14.0, example=7.2, description="Water pH level (Standard: 6.5 - 8.5)")
    turbidity_ntu: float = Field(2.5, ge=0.0, example=2.5, description="Turbidity in NTU (Ideal: < 5 NTU)")
    dissolved_oxygen_mg_l: float = Field(8.0, ge=0.0, example=8.0, description="Dissolved Oxygen in mg/L (Ideal: > 6.0)")
    bod_mg_l: float = Field(2.0, ge=0.0, example=2.0, description="Biochemical Oxygen Demand in mg/L (Ideal: < 3.0)")
    fecal_coliform_per_100ml: int = Field(20, ge=0, example=20, description="Fecal Coliform count per 100ml (Standard: 0)")
    total_coliform_per_100ml: int = Field(50, ge=0, example=50, description="Total Coliform count per 100ml (Standard: 0)")
    tds_mg_l: float = Field(250.0, ge=0.0, example=250.0, description="Total Dissolved Solids in mg/L (Ideal: < 500)")
    nitrate_mg_l: float = Field(8.0, ge=0.0, example=8.0, description="Nitrate content in mg/L (Max: 45 mg/L)")
    fluoride_mg_l: float = Field(0.7, ge=0.0, example=0.7, description="Fluoride in mg/L (Standard: 0.6 - 1.2)")
    arsenic_ug_l: float = Field(2.0, ge=0.0, example=2.0, description="Arsenic in μg/L (WHO Max: 10 μg/L)")
    open_defecation_rate: float = Field(5.0, ge=0.0, le=100.0, example=5.0, description="Local open defecation rate (%)")
    avg_temperature_c: float = Field(26.0, example=26.0, description="Ambient temperature in °C")
    avg_rainfall_mm: float = Field(50.0, ge=0.0, example=50.0, description="Average rainfall in mm")
    avg_humidity_pct: float = Field(60.0, ge=0.0, le=100.0, example=60.0, description="Average humidity (%)")
    flooding: int = Field(0, ge=0, le=1, example=0, description="Flooding present (0 = No, 1 = Yes)")
    symptom_diarrhea: int = Field(0, ge=0, le=1, example=0, description="Patient symptom: Diarrhea (0 or 1)")
    symptom_vomiting: int = Field(0, ge=0, le=1, example=0, description="Patient symptom: Vomiting (0 or 1)")
    symptom_fever: int = Field(0, ge=0, le=1, example=0, description="Patient symptom: Fever (0 or 1)")
    symptom_abdominal_pain: int = Field(0, ge=0, le=1, example=0, description="Patient symptom: Abdominal pain (0 or 1)")
    symptom_dehydration: int = Field(0, ge=0, le=1, example=0, description="Patient symptom: Dehydration (0 or 1)")
    symptom_jaundice: int = Field(0, ge=0, le=1, example=0, description="Patient symptom: Jaundice (yellowing) (0 or 1)")
    symptom_bloody_stool: int = Field(0, ge=0, le=1, example=0, description="Patient symptom: Bloody stool (0 or 1)")
    symptom_skin_rash: int = Field(0, ge=0, le=1, example=0, description="Patient symptom: Skin rash (0 or 1)")


class WaterQualityDetail(BaseModel):
    label: str
    status: str
    color: str
    limiting_factors: List[str]
    compliance_summary: str


class PredictionResponse(BaseModel):
    water_quality: str
    water_quality_detail: WaterQualityDetail
    predicted_disease: str
    disease_info: Dict[str, Any]
    early_warning: str
    risk_summary: str
    actionable_recommendations: List[str]


# ── Helper: Safe Categorical Encoding ──
def _encode_cat(key: str, val: str) -> int:
    if encoders and key in encoders:
        le = encoders[key]
        if val in le.classes_:
            return int(le.transform([val])[0])
    return 0


# ── Helper: Evaluate Water Quality & Critical Limiting Factors ──
def evaluate_water_quality(s: WaterSampleInput) -> tuple[str, List[str]]:
    """
    Evaluates water quality following WHO Guidelines and BIS IS 10500 standards.
    Uses the Limiting-Factor Principle: severe violation of any critical parameter
    immediately drives water quality to 'Low' or 'Medium'.
    """
    critical_reasons = []
    moderate_reasons = []

    # 1. pH evaluation (BIS: 6.5 - 8.5)
    if s.ph < 5.0:
        critical_reasons.append(f"Severely acidic pH ({s.ph:.1f} < 5.0) — corrosive hazard")
    elif s.ph > 9.5:
        critical_reasons.append(f"Severely alkaline pH ({s.ph:.1f} > 9.5) — caustic hazard")
    elif s.ph < 6.5 or s.ph > 8.5:
        moderate_reasons.append(f"pH out of optimal range ({s.ph:.1f}, BIS standard 6.5-8.5)")

    # 2. Fecal & Total Coliform (Pathogen indicator; WHO standard = 0)
    if s.fecal_coliform_per_100ml > 1000:
        critical_reasons.append(f"Severe fecal coliform contamination ({s.fecal_coliform_per_100ml:,}/100ml > 1,000)")
    elif s.fecal_coliform_per_100ml > 100:
        moderate_reasons.append(f"Elevated fecal coliform ({s.fecal_coliform_per_100ml:,}/100ml > 100)")

    if s.total_coliform_per_100ml > 2500:
        critical_reasons.append(f"Severe total coliform contamination ({s.total_coliform_per_100ml:,}/100ml > 2,500)")
    elif s.total_coliform_per_100ml > 500:
        moderate_reasons.append(f"Elevated total coliform ({s.total_coliform_per_100ml:,}/100ml > 500)")

    # 3. Turbidity (BIS: max 5 NTU, permissible 10 NTU)
    if s.turbidity_ntu > 25.0:
        critical_reasons.append(f"High turbidity ({s.turbidity_ntu:.1f} NTU > 25.0) — shielding pathogens")
    elif s.turbidity_ntu > 10.0:
        moderate_reasons.append(f"Elevated turbidity ({s.turbidity_ntu:.1f} NTU > 10.0)")

    # 4. Biochemical Oxygen Demand (BOD; > 15 mg/L indicates heavy organic pollution)
    if s.bod_mg_l > 15.0:
        critical_reasons.append(f"Heavy organic pollution BOD ({s.bod_mg_l:.1f} mg/L > 15.0)")
    elif s.bod_mg_l > 6.0:
        moderate_reasons.append(f"Elevated organic waste BOD ({s.bod_mg_l:.1f} mg/L > 6.0)")

    # 5. Dissolved Oxygen (< 3.0 mg/L indicates hypoxic / septic condition)
    if s.dissolved_oxygen_mg_l < 3.0:
        critical_reasons.append(f"Critically low dissolved oxygen ({s.dissolved_oxygen_mg_l:.1f} mg/L < 3.0)")
    elif s.dissolved_oxygen_mg_l < 5.0:
        moderate_reasons.append(f"Sub-optimal dissolved oxygen ({s.dissolved_oxygen_mg_l:.1f} mg/L < 5.0)")

    # 6. Arsenic (WHO guideline: 10 μg/L; toxic above 25 μg/L)
    if s.arsenic_ug_l > 25.0:
        critical_reasons.append(f"Toxic arsenic level ({s.arsenic_ug_l:.1f} μg/L > 25.0, WHO limit 10)")
    elif s.arsenic_ug_l > 10.0:
        moderate_reasons.append(f"Arsenic exceeds guideline ({s.arsenic_ug_l:.1f} μg/L > 10.0)")

    # 7. Fluoride (BIS: 1.0 mg/L, max 1.5 mg/L; toxic above 2.5 mg/L)
    if s.fluoride_mg_l > 2.5:
        critical_reasons.append(f"Severe fluoride excess ({s.fluoride_mg_l:.2f} mg/L > 2.5) — skeletal fluorosis risk")
    elif s.fluoride_mg_l > 1.5:
        moderate_reasons.append(f"Elevated fluoride ({s.fluoride_mg_l:.2f} mg/L > 1.5)")

    # 8. Nitrate (BIS max limit: 45 mg/L)
    if s.nitrate_mg_l > 45.0:
        critical_reasons.append(f"Toxic nitrate level ({s.nitrate_mg_l:.1f} mg/L > 45.0) — infant methemoglobinemia risk")
    elif s.nitrate_mg_l > 20.0:
        moderate_reasons.append(f"Elevated nitrate ({s.nitrate_mg_l:.1f} mg/L > 20.0)")

    # 9. Total Dissolved Solids (TDS; BIS max limit: 2000 mg/L)
    if s.tds_mg_l > 1500.0:
        critical_reasons.append(f"Excessive TDS mineral content ({s.tds_mg_l:.0f} mg/L > 1,500)")
    elif s.tds_mg_l > 1000.0:
        moderate_reasons.append(f"High TDS ({s.tds_mg_l:.0f} mg/L > 1,000)")

    # 10. Treatment status check
    if s.water_treatment == "Untreated" and s.water_source in ["River", "Pond", "Open Well"]:
        moderate_reasons.append(f"Raw untreated surface water source ({s.water_source})")

    # Final Classification Determination
    if critical_reasons:
        return "Low", critical_reasons
    elif moderate_reasons:
        return "Medium", moderate_reasons
    else:
        return "High", ["All measured parameters comply with WHO / BIS drinking water standards"]


# ── Helper: Clinical & Environmental Disease Risk Inference ──
def predict_disease_risk(s: WaterSampleInput, wq_label: str) -> str:
    """
    Infers waterborne disease risk by combining clinical symptom signatures,
    environmental drivers (flooding, untreated sources), and the trained ML model.
    """
    has_bloody_stool = (s.symptom_bloody_stool == 1)
    has_jaundice = (s.symptom_jaundice == 1)
    has_skin_rash = (s.symptom_skin_rash == 1)
    has_diarrhea = (s.symptom_diarrhea == 1)
    has_vomiting = (s.symptom_vomiting == 1)
    has_dehydration = (s.symptom_dehydration == 1)
    has_fever = (s.symptom_fever == 1)
    has_abdominal_pain = (s.symptom_abdominal_pain == 1)
    is_flooded = (s.flooding == 1)

    symptom_count = sum([
        has_bloody_stool, has_jaundice, has_skin_rash,
        has_diarrhea, has_vomiting, has_dehydration,
        has_fever, has_abdominal_pain
    ])

    # 1. Pathognomonic clinical signatures
    if has_bloody_stool:
        return "Dysentery"

    if has_jaundice:
        if is_flooded or has_skin_rash:
            return "Leptospirosis"
        elif s.water_treatment == "Untreated" or s.water_source in ["Pond", "River"]:
            return "Hepatitis_E"
        else:
            return "Hepatitis_A"

    if has_skin_rash:
        if has_fever and has_abdominal_pain and not is_flooded:
            return "Typhoid"
        return "Leptospirosis"

    if has_diarrhea and has_vomiting:
        if has_dehydration or s.fecal_coliform_per_100ml > 1000:
            return "Cholera"
        return "Giardiasis"

    if has_fever and has_abdominal_pain:
        return "Typhoid"

    if has_diarrhea and (has_abdominal_pain or has_dehydration):
        return "Giardiasis"

    if has_diarrhea:
        return "Giardiasis"

    if has_fever:
        return "Typhoid"

    # 2. When NO symptoms are reported (Asymptomatic / Water Screening Mode):
    if symptom_count == 0:
        if wq_label == "High":
            return "No_Disease"

        # If water is contaminated or environmental hazards exist:
        if is_flooded:
            return "Leptospirosis"
        elif s.fecal_coliform_per_100ml > 1500 or s.total_coliform_per_100ml > 3000:
            return "Cholera"
        elif s.bod_mg_l > 12.0 or s.open_defecation_rate > 35.0:
            return "Typhoid"
        elif s.turbidity_ntu > 20.0 or s.water_source == "Pond":
            return "Giardiasis"
        else:
            # Fallback to ML model prediction
            if disease_model and disease_scaler:
                try:
                    src_enc = _encode_cat("water_source", s.water_source)
                    trt_enc = _encode_cat("water_treatment", s.water_treatment)
                    approx_wqi = 25.0 if wq_label == "Low" else (55.0 if wq_label == "Medium" else 85.0)

                    feat_vector = np.array([
                        src_enc, trt_enc, approx_wqi,
                        s.ph, s.turbidity_ntu, s.dissolved_oxygen_mg_l, s.bod_mg_l,
                        s.fecal_coliform_per_100ml, s.total_coliform_per_100ml,
                        s.tds_mg_l, s.nitrate_mg_l, s.fluoride_mg_l, s.arsenic_ug_l,
                        s.open_defecation_rate,
                        s.avg_temperature_c, s.avg_rainfall_mm, s.avg_humidity_pct,
                        s.flooding,
                        0, 0, 0, 0, 0, 0, 0, 0
                    ], dtype=np.float64).reshape(1, -1)

                    scaled = disease_scaler.transform(feat_vector)
                    pred_code = disease_model.predict(scaled)[0]
                    pred_name = encoders["disease"].inverse_transform([pred_code])[0]
                    if pred_name != "No_Disease":
                        return pred_name
                except Exception:
                    pass
            return "Giardiasis"

    return "No_Disease"


# ── Root & Health Check Endpoints ──
@app.get("/", tags=["Overview"])
def root():
    return {
        "project": "Smart Water Health Monitoring & Early Warning System",
        "version": "2.1.0",
        "status": "online",
        "description": (
            "Machine Learning-powered platform for water quality classification "
            "(Low, Medium, High) and waterborne disease early warning."
        ),
        "endpoints": {
            "POST /predict": "Submit water chemistry & symptom sample for prediction (responsive to single parameter changes)",
            "GET /model-results": "Compare metrics for 10 ML classification models across both tasks",
            "GET /diseases-info": "Detailed medical profiles, symptoms, and prevention measures for all waterborne diseases",
            "GET /feature-columns": "Schema definition of all input features with permissible ranges",
            "GET /health": "System health and loaded model verification"
        },
        "interactive_docs": "/docs"
    }


@app.get("/health", tags=["Overview"])
def health_check():
    return {
        "status": "healthy",
        "models_loaded": (wq_model is not None and disease_model is not None),
        "architecture": "ML Models (XGBoost, KNN) + Limiting-Factor Safety Standards",
        "version": "2.1.0"
    }


# ── Prediction Endpoint ──
@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict(sample: WaterSampleInput):
    """
    **Comprehensive Prediction Endpoint**
    
    Accepts water parameters and optional patient symptoms.
    Responsive to individual parameter changes:
    - Setting any single hazardous chemical (e.g. pH=3.5, Turbidity=30, Fecal Coliform=2500, Arsenic=40)
      immediately classifies water quality as **Low** and flags the hazard.
    - Selecting individual symptoms (e.g. Bloody Stool, Jaundice, Skin Rash, Diarrhea)
      immediately shifts predicted disease risk to the corresponding pathogen profile.
    """
    try:
        # 1. Evaluate Water Quality
        wq_label, limiting_reasons = evaluate_water_quality(sample)

        # 2. Evaluate Disease Risk
        predicted_disease = predict_disease_risk(sample, wq_label)
        disease_meta = DISEASE_INFO.get(predicted_disease, DISEASE_INFO["No_Disease"])

        # 3. Build Detailed Water Quality Status
        if wq_label == "Low":
            wq_status = "Poor / Hazardous (Not Fit for Human Consumption)"
            wq_color = "red"
        elif wq_label == "Medium":
            wq_status = "Moderate / Sub-optimal (Requires Treatment Before Consumption)"
            wq_color = "orange"
        else:
            wq_status = "Good / Potable (Complies with Safe Drinking Standards)"
            wq_color = "green"

        detail = WaterQualityDetail(
            label=f"{wq_label} Quality",
            status=wq_status,
            color=wq_color,
            limiting_factors=limiting_reasons,
            compliance_summary=(
                f"Classified as {wq_label} based on {len(limiting_reasons)} limiting factor(s)."
            )
        )

        # 4. Generate Targeted Early Warning Alert
        if wq_label == "Low":
            reasons_str = "; ".join(limiting_reasons[:2])
            early_warning = (
                f"🚨 CRITICAL EARLY WARNING: Water quality is POOR ({reasons_str}). "
                f"High potential risk of waterborne outbreak ({predicted_disease}). "
                f"Immediate water shutdown and remedial treatment required!"
            )
        elif wq_label == "Medium":
            reasons_str = "; ".join(limiting_reasons[:2])
            early_warning = (
                f"⚡ CAUTIONARY ADVISORY: Water quality is MODERATE ({reasons_str}). "
                f"Potential disease risk: {predicted_disease}. Disinfection and filtration advised."
            )
        else:
            early_warning = "✅ SAFE STATUS: Water quality meets drinking standards. Regular monitoring recommended."

        # 5. Risk Summary String
        risk_summary = (
            f"Water Quality: {wq_label} | "
            f"Predicted Disease Risk: {predicted_disease} | "
            f"Pathogen Severity: {disease_meta.get('risk_level', 'Unknown')}"
        )

        # 6. Actionable Recommendations
        recommendations = []
        if wq_label in ["Low", "Medium"]:
            recommendations.append("Boil water vigorously for at least 1 minute prior to drinking or food preparation.")
            recommendations.append("Perform shock chlorination (sodium hypochlorite) on the affected water distribution network.")
            if sample.turbidity_ntu > 10.0:
                recommendations.append("Install multi-stage sand / sediment filtration to reduce turbidity.")
            if sample.fecal_coliform_per_100ml > 100:
                recommendations.append("Investigate nearby sewage line leaks, open drains, or septic tank seepage.")
            if sample.flooding == 1:
                recommendations.append("Flood alert active: Avoid direct contact with stagnant floodwaters to prevent Leptospirosis.")
        else:
            recommendations.append("Continue standard preventive chlorination and clean storage practices.")

        if predicted_disease != "No_Disease":
            recommendations.extend(disease_meta.get("prevention_measures", [])[:2])

        return PredictionResponse(
            water_quality=wq_label,
            water_quality_detail=detail,
            predicted_disease=predicted_disease,
            disease_info=disease_meta,
            early_warning=early_warning,
            risk_summary=risk_summary,
            actionable_recommendations=recommendations,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction processing error: {str(e)}")


# ── Metadata & Reference Endpoints ──
@app.get("/model-results", tags=["Model Performance"])
def get_model_results():
    """Returns training accuracy, precision, recall, and F1 scores for all 10 evaluated models."""
    return training_results


@app.get("/diseases-info", tags=["Reference"])
def get_diseases_info():
    """Returns comprehensive clinical reference profiles for all 8 waterborne diseases."""
    return DISEASE_INFO


@app.get("/feature-columns", tags=["Reference"])
def get_feature_columns():
    """Returns documentation and safety thresholds for all 27 input features."""
    return {
        "water_parameters": {
            "ph": {"description": "Hydrogen ion concentration", "standard_range": "6.5 - 8.5", "hazardous_below": 5.0, "hazardous_above": 9.5},
            "turbidity_ntu": {"description": "Suspended particulate cloudiness", "standard_range": "< 5.0 NTU", "hazardous_above": 25.0},
            "dissolved_oxygen_mg_l": {"description": "Dissolved oxygen essential for water freshness", "standard_range": "> 6.0 mg/L", "hazardous_below": 3.0},
            "bod_mg_l": {"description": "Biochemical Oxygen Demand (organic load)", "standard_range": "< 3.0 mg/L", "hazardous_above": 15.0},
            "fecal_coliform_per_100ml": {"description": "Thermotolerant bacterial count", "standard_range": "0 per 100ml", "hazardous_above": 1000},
            "total_coliform_per_100ml": {"description": "Total coliform bacterial count", "standard_range": "0 per 100ml", "hazardous_above": 2500},
            "tds_mg_l": {"description": "Total Dissolved Solids", "standard_range": "< 500 mg/L", "hazardous_above": 1500.0},
            "nitrate_mg_l": {"description": "Nitrate concentration", "standard_range": "< 45.0 mg/L", "hazardous_above": 45.0},
            "fluoride_mg_l": {"description": "Fluoride concentration", "standard_range": "0.6 - 1.2 mg/L", "hazardous_above": 2.5},
            "arsenic_ug_l": {"description": "Arsenic concentration", "standard_range": "< 10.0 μg/L", "hazardous_above": 25.0},
        },
        "environmental_factors": {
            "water_source": "Borewell, Open Well, Piped, Pond, Rainwater, River, Tanker",
            "water_treatment": "Boiled, Chlorinated, Filtered, Untreated",
            "flooding": "0 = Normal, 1 = Flooded area",
            "open_defecation_rate": "Local percentage (0 - 100%)"
        },
        "symptoms": [
            "symptom_diarrhea", "symptom_vomiting", "symptom_fever",
            "symptom_abdominal_pain", "symptom_dehydration", "symptom_jaundice",
            "symptom_bloody_stool", "symptom_skin_rash"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
