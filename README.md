# Railway Time Tracking and Prediction System (RTTPS)

A comprehensive, full-stack, real-time web application designed for dynamic train tracking, timetable inspection, and machine learning-powered arrival/departure delay prediction for the Indian Railways network.

Developed as an academic software engineering capstone project demonstrating modern distributed system architecture, real-time telemetry processing, database resilience, and predictive analytics.

---

## 1. Project Overview & Key Features

Traditional railway information systems rely heavily on static scheduled timetables, which fail to capture unexpected delays, weather disruptions, track maintenance, and traffic congestion. RTTPS addresses this by combining:

- **Real-Time GPS & IoT Telemetry:** Internal movement simulation engine using real coordinates along major Indian Railways corridors (e.g., New Delhi – Mumbai Central, New Delhi – Howrah).
- **Machine Learning Delay Predictions:** Scikit-learn Gradient Boosting model trained on 15,000 trip instances, considering cruising speed, weather, track congestion, priority, and remaining distance.
- **Dual-Engine Persistence:** Primary MongoDB (Mongoose ODM) with automatic fallback to persistent JSON storage (`backend/src/data/store.json`) for zero-configuration deployments.
- **Bi-Directional WebSocket Streaming:** Real-time location updates and instant push alerts powered by Socket.IO.
- **Role-Based Access Control (RBAC):** Tailored interfaces and permission boundaries for Passengers and Railway Administrators.

### Primary User Roles

#### 🧑‍✈️ Passenger Features
- **User Authentication:** Registration, secure JWT login, and profile preference management.
- **Multi-Criteria Train Search:** Search by 5-digit train number, train name, or source and destination stations.
- **Timetable & Route Inspection:** Chronological list of stops, halt durations, scheduled arrival/departure times, and assigned platform numbers.
- **Live Interactive Map:** Leaflet + OpenStreetMap displaying animated train position, route polyline, and station platform markers.
- **AI-Powered Delay Predictions:** Real-time estimated delays with confidence scores, severity ratings, and key causal factors.
- **Operational Alerts Feed:** Live updates on delays, platform changes, and system announcements.

#### 🛠️ Railway Administrator Features
- **Protected Operations Dashboard:** Fleet overview with operational KPIs (Active Trains, Punctuality Rate %, Average Delay, Platform Reassignments).
- **Fleet Management (CRUD):** Add, update, and remove trains and operational parameters.
- **Platform Management:** Reassign station platforms in real time with instant push notifications to passengers.
- **Administrative Timing Override:** Manually override AI predictions with official dispatcher delays and log reason codes.
- **Simulation Control Hub:** Inject synthetic weather conditions (Fog, Rain) or congestion spikes to test system resilience.
- **Operational Reports & Analytics:** Historical punctuality charts (Recharts) and one-click CSV report export.

---

## 2. Technology Stack

| Tier | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Leaflet, React-Leaflet, Lucide Icons, Recharts, Socket.IO Client, Axios |
| **Backend** | Node.js, Express.js, Socket.IO, JWT (jsonwebtoken), bcryptjs, Mongoose ODM, Axios, CORS, dotenv |
| **Machine Learning** | Python 3.10+, FastAPI, Uvicorn, Scikit-learn (`GradientBoostingRegressor`), Pandas, NumPy, Joblib, Pydantic V2 |
| **Database** | MongoDB 6.0+ (Primary) / Persistent JSON Document Store (Failover) |
| **Protocols** | HTTP/1.1 REST, WebSockets (Socket.IO v4) |

---

## 3. System Architecture & Component Interaction

```
[ React + Vite Frontend (Port 3000) ]
        │                       ▲
        │ REST Requests         │ WebSocket Events (Socket.IO)
        ▼                       │
[ Express.js Backend & Telemetry Simulator (Port 5000) ]
        │                       │
        ├───────────────────────┼────────────────────────┐
        ▼                       ▼                        ▼
[ Python FastAPI ML ]    [ Primary MongoDB ]    [ Failover JSON Store ]
  (Port 8000)              (Port 27017)           (src/data/store.json)
```

For complete architectural diagrams and sequence flows, refer to [architecture.md](file:///c:/Users/User/OneDrive/Documents/RTTPS/docs/architecture.md).

---

## 4. Complete Project Directory Structure

```
RTTPS/
├── .env.example                       # Root environment variables reference
├── .gitignore                         # Git exclusion rules
├── README.md                          # Comprehensive project documentation
├── HANDOFF.md                         # Architecture handoff & continuation prompt
├── test_e2e_integration.py            # End-to-end cross-service verification script
├── docs/                              # Detailed project technical documentation
│   ├── architecture.md                # System design & sequence diagrams
│   ├── database-schema.md             # ER diagrams & Mongoose schema specs
│   └── api-documentation.md           # REST API & Socket.IO protocol reference
├── backend/                           # Node.js + Express + Socket.IO API
│   ├── package.json                   # Backend dependencies & scripts
│   ├── .env                           # Backend environment configuration
│   ├── .env.example                   # Backend env template
│   ├── test_backend.js                # 14-point automated backend test suite
│   ├── test_cross_service.js          # Node <-> FastAPI integration test
│   └── src/
│       ├── server.js                  # Express & Socket.IO server entrypoint
│       ├── config/
│       │   └── db.js                  # Dual-engine database connection (Mongo + JSON)
│       ├── controllers/               # Route request handlers
│       │   ├── authController.js
│       │   ├── trainController.js
│       │   ├── scheduleController.js
│       │   ├── trackingController.js
│       │   ├── predictionController.js
│       │   ├── notificationController.js
│       │   └── analyticsController.js
│       ├── middleware/
│       │   └── auth.js                # JWT verification & RBAC authorization
│       ├── models/                    # Data models & persistent proxy adapters
│       │   ├── index.js               # Unified model exports with fallback
│       │   └── schemas.js             # Mongoose schema definitions
│       ├── routes/                    # REST API route declarations
│       ├── services/
│       │   ├── mlService.js           # FastAPI client with heuristic fallback
│       │   └── simulatorService.js    # GPS route simulator & Socket.IO emitter
│       ├── sockets/
│       │   └── socketHandler.js       # WebSocket rooms & client lifecycle
│       └── data/
│           ├── seed.js                # Database seeder script
│           ├── seedData.js            # Initial dataset (Users, Trains, Stations)
│           └── store.json             # Persistent failover JSON document store
├── frontend/                          # React + Vite Single Page Application
│   ├── package.json                   # Frontend dependencies
│   ├── vite.config.js                 # Vite config with backend proxy
│   ├── tailwind.config.js             # Tailwind CSS theme configuration
│   ├── index.html                     # HTML root template
│   └── src/
│       ├── App.jsx                    # Route mapping & layout wrapper
│       ├── main.jsx                   # React DOM root
│       ├── components/                # Reusable UI widgets
│       │   ├── Navbar.jsx             # Top navigation with live socket status
│       │   ├── Footer.jsx             # Footer with system status
│       │   ├── DelayBadge.jsx         # Severity-coded delay pill
│       │   ├── LiveMap.jsx            # Interactive Leaflet OpenStreetMap
│       │   ├── Speedometer.jsx        # Gauge widget for train speed
│       │   ├── StationTimeline.jsx    # Chronological station stops view
│       │   └── ProtectedRoute.jsx     # RBAC navigation route guard
│       ├── context/                   # Global React state providers
│       │   ├── AuthContext.jsx        # Authentication & user profile state
│       │   └── SocketContext.jsx      # Socket.IO connection & live telemetry
│       └── pages/                     # Full-page application views
│           ├── LandingPage.jsx        # Homepage with search & quick actions
│           ├── LoginPage.jsx          # Login form with 1-click demo buttons
│           ├── RegisterPage.jsx       # Registration form
│           ├── PassengerDashboard.jsx # Passenger hub with live tracking overview
│           ├── TrainSearchPage.jsx    # Search & route exploration
│           ├── LiveTrackingPage.jsx   # Real-time GIS map & telemetry
│           ├── NotificationsPage.jsx  # Broadcast advisories & delay alerts
│           ├── UserProfilePage.jsx    # Profile & station preference editor
│           ├── AdminDashboard.jsx     # High-level railway operational KPIs
│           ├── AdminTrainManagement.jsx # Fleet CRUD management table
│           ├── AdminScheduleManagement.jsx # Platform reassignments & overrides
│           └── AdminReportsPage.jsx   # Analytics charts & CSV export
└── ml-service/                        # Python Machine Learning Microservice
    ├── requirements.txt               # Python package dependencies
    ├── test_api.py                    # FastAPI endpoint unit test suite
    ├── data/
    │   └── historical_train_data.csv  # 15,000 synthetic trip training dataset
    ├── models/
    │   ├── train_delay_model.joblib   # Trained GradientBoosting model
    │   ├── model_metrics.json         # Evaluation metrics (MAE, RMSE, R²)
    │   └── eda_and_evaluation_report.md # Exploratory data analysis & metrics
    └── src/
        ├── main.py                    # FastAPI application server
        ├── prediction/
        │   └── predictor.py           # Feature preprocessing & inference logic
        ├── preprocessing/
        │   └── generate_dataset.py    # Synthetic dataset generator
        └── training/
            └── train.py               # Model training & hyperparameter search
```

---

## 5. Prerequisites & Environment Setup

### System Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Python:** v3.10 to v3.14
- **MongoDB (Optional):** Local MongoDB Community Server running on `mongodb://127.0.0.1:27017` (If absent, system automatically falls back to JSON file storage).

### Environment Configuration
The repository includes `.env.example` templates in root, `backend/`, and `frontend/`.

Create `backend/.env` with:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/rttps
JWT_SECRET=rttps_production_super_secret_jwt_key_2026
ML_SERVICE_URL=http://127.0.0.1:8000
NODE_ENV=development
```

---

## 6. Installation & Startup Instructions

To run the complete RTTPS application, open **three terminal sessions**:

### Terminal 1: Machine Learning Service (Python FastAPI)
```bash
cd ml-service
# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI prediction service on port 8000
uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload
```
*Verification: Open `http://127.0.0.1:8000/docs` to inspect the Swagger UI.*

### Terminal 2: Backend Core Service (Node.js & Express)
```bash
cd backend
# Install dependencies
npm install

# Start the server (runs on port 5000)
node src/server.js
```
*Verification: Open `http://localhost:5000/` to view backend API health metadata.*

> [!TIP]
> **Database Seeding Note:** The database is pre-seeded in both MongoDB and `backend/src/data/store.json`. To re-seed from scratch in a development environment, run `npm run seed` inside `backend/`.

### Terminal 3: Frontend Client (React + Vite)
```bash
cd frontend
# Install dependencies
npm install

# Start Vite development server (runs on port 3000)
npm run dev
```
*Verification: Open `http://localhost:3000` in your web browser.*

---

## 7. Default Credentials & Demo Access

The login page includes convenient **1-Click Demo Login** buttons:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@rttps.com` | `Admin@123` | Full access to Admin Dashboard, Fleet CRUD, Platform Management, Simulator Control, and Reports |
| **Passenger** | `passenger@rttps.com` | `Passenger@123` | Train Search, Live Map Tracking, Timetable Inspection, and Profile Settings |

---

## 8. Testing & Verification

The project includes multi-tiered automated verification scripts:

### 1. Backend Automated Test Suite (14 Tests)
Validates Authentication, RBAC gates, Search, Timetables, GPS coordinates, Platform Reassignment, and Analytics:
```bash
cd backend
node test_backend.js
```

### 2. Python ML Microservice Test Suite
Validates health endpoints, metrics retrieval, and prediction schema output:
```bash
cd ml-service
python test_api.py
```

### 3. Cross-Service Integration Verification
Tests end-to-end communication from Node.js backend through Python FastAPI to Scikit-learn inference:
```bash
cd backend
node test_cross_service.js
```

### 4. Frontend Production Build Check
```bash
cd frontend
npm run build
```

---

## 9. Academic Scope & Limitations

> [!IMPORTANT]
> **Data Authenticity Notice:**
> - Train coordinates and running conditions are generated by the internal mathematical telemetry simulator along authentic Indian Railways route geography.
> - The application does not connect to internal Indian Railways CRIS/NTES hardware GPS feeds.
> - The machine learning model is trained on a 15,000-instance domain-calibrated dataset reflecting real-world railway operating parameters.
