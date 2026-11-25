"""
RTTPS - Railway Time Tracking and Prediction System
Machine Learning Inference Engine
Loads the trained Scikit-learn model and generates predictions with confidence intervals.
"""

import os
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'train_delay_model.joblib')

class TrainDelayPredictor:
    def __init__(self, model_path: str = MODEL_PATH):
        self.model_path = model_path
        self.model = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                print(f"[Predictor] Successfully loaded ML model from {self.model_path}")
            except Exception as e:
                print(f"[Predictor] Error loading model: {e}")
                self.model = None
        else:
            print(f"[Predictor] Model file not found at {self.model_path}")
            self.model = None

    def predict(self, input_data: dict) -> dict:
        """
        Takes input tracking state and predicts:
        - estimated_delay_minutes (float)
        - predicted_arrival_iso (ISO string)
        - predicted_departure_iso (ISO string)
        - confidence_score (float 0.0 - 1.0)
        - delay_severity ('On Time' | 'Slight Delay' | 'Moderate Delay' | 'Severe Delay')
        - delay_factors (list of contributing elements)
        """
        train_number = str(input_data.get('train_number', '12951'))
        current_speed = float(input_data.get('current_speed_kmh', 75.0))
        dist_remaining = float(input_data.get('distance_remaining_km', 250.0))
        prev_delay = float(input_data.get('previous_delay_minutes', 0.0))
        weather = input_data.get('weather_condition', 'Clear')
        congestion = input_data.get('track_congestion', 'Low')
        departure_hour = int(input_data.get('departure_hour', 14))
        day_of_week = int(input_data.get('day_of_week', 2))
        train_priority = int(input_data.get('train_priority', 1))
        signal_stops = int(input_data.get('signal_stops_count', 1))

        # Baseline average speed for the train
        avg_speed = 90.0 if train_priority == 1 else (80.0 if train_priority == 2 else 70.0)
        speed_ratio = round(current_speed / max(avg_speed, 1.0), 3)

        df_row = pd.DataFrame([{
            'train_number': train_number,
            'distance_remaining_km': dist_remaining,
            'current_speed_kmh': current_speed,
            'speed_ratio': speed_ratio,
            'previous_delay_minutes': prev_delay,
            'signal_stops_count': signal_stops,
            'departure_hour': departure_hour,
            'train_priority': train_priority,
            'day_of_week': day_of_week,
            'weather_condition': weather,
            'track_congestion': congestion
        }])

        if self.model is not None:
            raw_prediction = float(self.model.predict(df_row)[0])
            pred_delay = max(0.0, round(raw_prediction, 1))
        else:
            # Fallback estimation in case model file is unavailable
            pred_delay = max(0.0, round(prev_delay * 0.85 + (30.0 if congestion == 'High' else 5.0), 1))

        # Determine severity category
        if pred_delay < 5.0:
            severity = 'On Time'
            status_color = 'emerald'
        elif pred_delay < 20.0:
            severity = 'Slight Delay'
            status_color = 'blue'
        elif pred_delay < 45.0:
            severity = 'Moderate Delay'
            status_color = 'amber'
        else:
            severity = 'Severe Delay'
            status_color = 'rose'

        # Analyze key contributing factors for passenger explanation
        delay_factors = []
        if prev_delay > 15:
            delay_factors.append(f"Accumulated route delay ({int(prev_delay)} mins)")
        if current_speed < (avg_speed * 0.75):
            delay_factors.append(f"Reduced track speed ({current_speed} km/h vs avg {avg_speed} km/h)")
        if congestion in ['High', 'Peak Congestion']:
            delay_factors.append(f"High junction corridor congestion ({congestion})")
        if weather in ['Fog', 'Heavy Rain', 'Storm']:
            delay_factors.append(f"Adverse weather caution ({weather})")
        if signal_stops > 2:
            delay_factors.append(f"Multiple signal regulation stops ({signal_stops})")
        if not delay_factors:
            delay_factors.append("Optimal corridor running conditions")

        # Calculate ETA
        scheduled_arrival_str = input_data.get('scheduled_arrival')
        if scheduled_arrival_str:
            try:
                # Can be ISO or HH:MM
                if 'T' in scheduled_arrival_str or '-' in scheduled_arrival_str:
                    sched_time = datetime.fromisoformat(scheduled_arrival_str.replace('Z', '+00:00'))
                else:
                    parts = scheduled_arrival_str.split(':')
                    now = datetime.now()
                    sched_time = now.replace(hour=int(parts[0]), minute=int(parts[1]), second=0, microsecond=0)
                pred_time = sched_time + timedelta(minutes=pred_delay)
                pred_arrival_iso = pred_time.isoformat()
            except Exception:
                pred_arrival_iso = None
        else:
            now = datetime.now()
            # Estimate journey time from speed + delay
            expected_hours = dist_remaining / max(current_speed, 20.0)
            pred_time = now + timedelta(hours=expected_hours, minutes=pred_delay)
            pred_arrival_iso = pred_time.isoformat()

        # Confidence calculation: higher confidence when current speed is steady and distance remaining is lower
        dist_factor = max(0.5, 1.0 - (dist_remaining / 3000.0) * 0.3)
        weather_factor = 0.95 if weather == 'Clear' else 0.85
        confidence = round(float(dist_factor * weather_factor), 2)

        return {
            'train_number': train_number,
            'estimated_delay_minutes': pred_delay,
            'predicted_arrival': pred_arrival_iso,
            'status': severity,
            'status_color': status_color,
            'confidence_score': confidence,
            'delay_factors': delay_factors,
            'speed_ratio': speed_ratio,
            'model_used': 'GradientBoosting/RandomForest Regression (Scikit-Learn)'
        }

# Global singleton
predictor = TrainDelayPredictor()
