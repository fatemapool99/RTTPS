"""
RTTPS - Railway Time Tracking and Prediction System
FastAPI Machine Learning Service
Exposes the train delay prediction model, metrics, and health endpoints over HTTP.
"""

import os
import sys
import json
from typing import Optional, List

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from src.prediction.predictor import predictor
from src.training.train import run_training_pipeline

app = FastAPI(
    title="RTTPS Train Delay Prediction Service",
    description="Machine Learning service providing real-time arrival and departure time prediction for railway systems.",
    version="1.0.0"
)

# Enable CORS for communication from Node.js backend and React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    train_number: str = Field(..., examples=["12951"])
    distance_remaining_km: float = Field(..., examples=[240.5])
    current_speed_kmh: float = Field(..., examples=[84.0])
    previous_delay_minutes: float = Field(default=0.0, examples=[12.5])
    weather_condition: Optional[str] = Field(default="Clear", examples=["Clear"])
    track_congestion: Optional[str] = Field(default="Low", examples=["Low"])
    departure_hour: Optional[int] = Field(default=14, examples=[16])
    day_of_week: Optional[int] = Field(default=2, examples=[2])
    train_priority: Optional[int] = Field(default=1, examples=[1])
    signal_stops_count: Optional[int] = Field(default=0, examples=[1])
    scheduled_arrival: Optional[str] = Field(default=None, examples=["19:30"])

class PredictionResponse(BaseModel):
    train_number: str
    estimated_delay_minutes: float
    predicted_arrival: Optional[str]
    status: str
    status_color: str
    confidence_score: float
    delay_factors: List[str]
    speed_ratio: float
    model_used: str

@app.get("/")
def root():
    return {
        "service": "RTTPS Machine Learning Prediction API",
        "status": "online",
        "model_loaded": predictor.model is not None,
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ml-prediction-service",
        "model_loaded": predictor.model is not None,
        "model_path": predictor.model_path
    }

@app.get("/metrics")
def get_metrics():
    """
    Returns the latest offline evaluation metrics of the model (MAE, RMSE, R2, feature importances).
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    metrics_path = os.path.join(base_dir, 'models', 'model_metrics.json')
    if os.path.exists(metrics_path):
        with open(metrics_path, 'r') as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="Model metrics file not found. Train the model first.")

@app.post("/predict", response_model=PredictionResponse)
def predict_delay(req: PredictionRequest):
    """
    Receives current train telemetry and returns predicted arrival delay, ETA, and explainability factors.
    """
    try:
        result = predictor.predict(req.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/retrain")
def trigger_retrain():
    """
    Allows admin to trigger model retraining pipeline.
    """
    try:
        metrics = run_training_pipeline()
        predictor._load_model()
        return {
            "message": "Model retrained and reloaded successfully",
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining error: {str(e)}")

if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get("ML_PORT", 8000))
    uvicorn.run(app, host="127.0.0.1", port=port)
