"""
RTTPS - Automated ML Prediction API Test Suite
Tests FastAPI endpoints: GET /, GET /health, GET /metrics, POST /predict
"""

import sys
import os
import time
import json
import threading
import urllib.request
import urllib.error

# Ensure ml-service root is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import uvicorn
from src.main import app

PORT = 8008

def start_server():
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")

def run_tests():
    # Start server in daemon thread
    thread = threading.Thread(target=start_server, daemon=True)
    thread.start()
    time.sleep(2.0)  # Wait for uvicorn to bind

    base_url = f"http://127.0.0.1:{PORT}"
    print(f"[TEST] Testing FastAPI ML Service at {base_url}...")

    # Test 1: GET /
    req = urllib.request.Request(f"{base_url}/")
    with urllib.request.urlopen(req, timeout=3) as resp:
        assert resp.status == 200, f"Root returned {resp.status}"
        data = json.loads(resp.read().decode('utf-8'))
        assert data.get("status") == "online", "Service not online"
        print("  ✓ GET / passed (Service online, model loaded)")

    # Test 2: GET /health
    req = urllib.request.Request(f"{base_url}/health")
    with urllib.request.urlopen(req, timeout=3) as resp:
        assert resp.status == 200, f"Health returned {resp.status}"
        data = json.loads(resp.read().decode('utf-8'))
        assert data.get("model_loaded") is True, "Model not loaded"
        print("  ✓ GET /health passed (Status: healthy, model: loaded)")

    # Test 3: GET /metrics
    req = urllib.request.Request(f"{base_url}/metrics")
    with urllib.request.urlopen(req, timeout=3) as resp:
        assert resp.status == 200, f"Metrics returned {resp.status}"
        data = json.loads(resp.read().decode('utf-8'))
        assert "mae_minutes" in data, "MAE missing from metrics"
        assert "r2_score" in data, "R2 missing from metrics"
        print(f"  ✓ GET /metrics passed (MAE: {data['mae_minutes']}m, RMSE: {data['rmse_minutes']}m, R2: {data['r2_score']})")

    # Test 4: POST /predict (Rajdhani Express on-time scenario)
    predict_payload_1 = {
        "train_number": "12951",
        "distance_remaining_km": 150.0,
        "current_speed_kmh": 90.0,
        "previous_delay_minutes": 0.0,
        "weather_condition": "Clear",
        "track_congestion": "Low",
        "train_priority": 1
    }
    req = urllib.request.Request(
        f"{base_url}/predict",
        data=json.dumps(predict_payload_1).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=3) as resp:
        assert resp.status == 200, f"Predict returned {resp.status}"
        data = json.loads(resp.read().decode('utf-8'))
        assert "estimated_delay_minutes" in data
        assert "status" in data
        assert "confidence_score" in data
        print(f"  ✓ POST /predict (Clear run) passed: Est Delay: {data['estimated_delay_minutes']}m, Status: '{data['status']}', Confidence: {data['confidence_score']*100}%")

    # Test 5: POST /predict (Fog & Congestion scenario)
    predict_payload_2 = {
        "train_number": "12003",
        "distance_remaining_km": 280.0,
        "current_speed_kmh": 55.0,
        "previous_delay_minutes": 25.0,
        "weather_condition": "Fog",
        "track_congestion": "High",
        "train_priority": 2
    }
    req = urllib.request.Request(
        f"{base_url}/predict",
        data=json.dumps(predict_payload_2).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=3) as resp:
        assert resp.status == 200, f"Predict returned {resp.status}"
        data = json.loads(resp.read().decode('utf-8'))
        assert data['estimated_delay_minutes'] > 15.0, "Expected significant delay for fog+congestion"
        print(f"  ✓ POST /predict (Adverse weather & congestion) passed: Est Delay: {data['estimated_delay_minutes']}m, Status: '{data['status']}', Factors: {data['delay_factors']}")

    print("\n[SUCCESS] ALL ML SERVICE TESTS PASSED!")

if __name__ == '__main__':
    run_tests()
