"""
RTTPS - Cross-Service Integration Verification Script
Validates Node.js Backend <-> Python FastAPI ML Service <-> Scikit-learn Model communication.
"""

import sys
import os
import time
import json
import threading
import subprocess
import urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ML_DIR = os.path.join(BASE_DIR, 'ml-service')
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')

if ML_DIR not in sys.path:
    sys.path.insert(0, ML_DIR)

import uvicorn
from src.main import app as fastapi_app

def start_fastapi():
    uvicorn.run(fastapi_app, host="127.0.0.1", port=8000, log_level="warning")

def run_cross_service_test():
    print("[E2E VERIFICATION] Starting Python FastAPI ML service on port 8000...")
    ml_thread = threading.Thread(target=start_fastapi, daemon=True)
    ml_thread.start()
    time.sleep(2.5)

    # 1. Verify FastAPI health
    req = urllib.request.Request("http://127.0.0.1:8000/health")
    with urllib.request.urlopen(req, timeout=3) as resp:
        health_data = json.loads(resp.read().decode('utf-8'))
        print(f"  ✓ 1. Python FastAPI Health Check: {health_data['status']} (Model Loaded: {health_data['model_loaded']})")

    # 2. Start Node.js backend on port 5056
    print("[E2E VERIFICATION] Starting Node.js Express backend on port 5056...")
    backend_script = f"""
    const {{ app, server }} = require('./src/server.js');
    const {{ connectDB }} = require('./src/config/db.js');
    (async () => {{
        await connectDB();
        server.listen(5056, () => console.log('NODE_BACKEND_READY'));
    }})();
    """
    
    node_proc = subprocess.Popen(
        ["node", "-e", backend_script],
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    # Wait for Node backend to be ready
    time.sleep(3.0)

    try:
        # 3. Call Node backend prediction endpoint which queries Python FastAPI
        print("[E2E VERIFICATION] Calling Node.js -> Python FastAPI prediction pipeline...")
        test_payload = {
            "trainNumber": "12951",
            "currentSpeed": 88.0,
            "distanceRemaining": 220.0,
            "previousDelay": 12.0,
            "weather": "Clear",
            "congestion": "Low"
        }
        
        req = urllib.request.Request(
            "http://127.0.0.1:5056/api/predictions/calculate",
            data=json.dumps(test_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req, timeout=5) as resp:
            pred_response = json.loads(resp.read().decode('utf-8'))
            assert pred_response.get("success") is True, "Prediction request failed"
            pred_data = pred_response.get("data", {})
            print(f"  ✓ 2. Cross-Service Prediction Success:")
            print(f"       • Prediction Source:     {pred_data.get('source')}")
            print(f"       • Machine Learning Model: {pred_data.get('model_used')}")
            print(f"       • Estimated Delay:       {pred_data.get('estimated_delay_minutes')} mins")
            print(f"       • Severity Status:       {pred_data.get('status')}")
            print(f"       • Confidence Score:      {pred_data.get('confidence_score') * 100}%")
            print(f"       • Key Factors:           {pred_data.get('delay_factors')}")
            assert pred_data.get('source') == 'FASTAPI_PYTHON_MODEL', f"Expected FASTAPI_PYTHON_MODEL, got {pred_data.get('source')}"

        # 4. Verify Model Metrics returned via Node Backend from FastAPI
        req_metrics = urllib.request.Request("http://127.0.0.1:5056/api/predictions/metrics/evaluation")
        with urllib.request.urlopen(req_metrics, timeout=5) as resp:
            metrics_response = json.loads(resp.read().decode('utf-8'))
            assert metrics_response.get("success") is True
            metrics = metrics_response.get("metrics", {})
            print(f"  ✓ 3. Cross-Service Model Metrics Evaluation:")
            print(f"       • Model Architecture:    {metrics.get('model_name')}")
            print(f"       • MAE (Mean Abs Error):  {metrics.get('mae_minutes')} mins")
            print(f"       • RMSE (Root Mean Sq):   {metrics.get('rmse_minutes')} mins")
            print(f"       • R² Score:              {metrics.get('r2_score')}")

        print("\n[SUCCESS] CROSS-SERVICE INTEGRATION 100% VERIFIED!")

    finally:
        node_proc.terminate()
        try:
            node_proc.wait(timeout=2)
        except Exception:
            node_proc.kill()

if __name__ == '__main__':
    run_cross_service_test()
