# RTTPS Engineering Handoff & Continuity Document

This document serves as the technical handoff and operational guide for developers, examiners, or AI agents continuing work on the **Railway Time Tracking and Prediction System (RTTPS)**.

---

## 1. Executive Summary & Project Status

- **Project Name:** Railway Time Tracking and Prediction System (RTTPS)
- **Target Audience:** B.Tech Computer Science Capstone Project
- **Current Completion Status:** **100% Fully Implemented, Integrated, and Verified**
- **Date of Verification:** November 2026

### Verified Subsystems
1. **Frontend (`frontend/`):** React 18, Vite, Tailwind CSS, Leaflet GIS map with custom locomotive markers, Recharts visual analytics, interactive station timeline, speedometers, delay badges, and full responsive views for Passengers and Admins. Production build verified clean (`frontend/dist/`).
2. **Backend Core (`backend/`):** Node.js Express REST API, JWT authentication, RBAC authorization, internal GPS route telemetry simulator, Socket.IO hub, dual-engine database connectivity (MongoDB + automatic JSON fallback). Verified with 14 automated test cases.
3. **Machine Learning Service (`ml-service/`):** Python FastAPI service with Scikit-learn `GradientBoostingRegressor` (MAE: 3.28 mins, $R^2$: 0.9838) trained on 15,000 synthetic historical trips. Verified via standalone API test suite and cross-service Node.js calls.

---

## 2. Component Architecture & Port Allocation

| Component | Technology | Default Port | Primary Function |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | React 18 + Vite | `3000` | User and administrator user interfaces |
| **Backend REST & Sockets** | Node.js + Express | `5000` | Business logic, authentication, route telemetry simulator |
| **ML Inference Service** | Python + FastAPI | `8000` | Scikit-learn delay prediction and model metrics |
| **Primary Database** | MongoDB Community | `27017` | Persistent document storage |
| **Failover Database** | JSON File Store | Local File | `backend/src/data/store.json` (auto-activates if Mongo offline) |

---

## 3. Key Completed Features

### 3.1 Authentication & Security (Module 1)
- User registration and login with bcrypt password hashing (10 rounds).
- Stateless JWT generation with 7-day expiry and role claims.
- Role-based authorization middleware (`protect`, `authorize('admin')`).
- Secure pre-seeded credentials:
  - Admin: `admin@rttps.com` / `Admin@123`
  - Passenger: `passenger@rttps.com` / `Passenger@123`
- Client-side route protection (`ProtectedRoute.jsx`) preventing unauthorized passenger access to administrative consoles.
- One-click demo login buttons on the login view.

### 3.2 Train Timetables & Search (Module 2)
- Multi-parameter search endpoint (`GET /api/trains/search`) supporting train number, train name, source, and destination station filters.
- Detailed train view with complete scheduled stops, halt durations, sequence order, and assigned platform numbers.

### 3.3 Real-Time Telemetry & Tracking (Module 3)
- Background simulator (`simulatorService.js`) performing spherical linear interpolation between authentic Indian Railways junctions (NDLS, KOTA, RTM, BRC, ST, BVI, MMCT, CNB, LKO, PRYJ, BSB, HWH, BBS).
- Emits real-time location updates every 3.5 seconds over Socket.IO (`train:location_update`).
- Leaflet map rendering with dynamic locomotive position, route polylines, and station pins.
- Speedometer widget displaying real-time speed in km/h.

### 3.4 Machine Learning Prediction Pipeline (Module 4)
- 15,000 realistic historical trip dataset generated via `ml-service/src/preprocessing/generate_dataset.py`.
- Trained `GradientBoostingRegressor` model achieving:
  - **Mean Absolute Error (MAE):** 3.283 minutes
  - **Root Mean Squared Error (RMSE):** 4.380 minutes
  - **$R^2$ Score:** 0.9838
- Real-time prediction factoring distance remaining, current speed, previous delay, weather conditions, track congestion, and train priority.
- Dual-tier prediction handling: Node.js calls FastAPI on port 8000; falls back gracefully to an internal heuristic model if the Python service is offline.

### 3.5 Operational Notifications (Module 5)
- Automated delay advisory broadcasts when train delays exceed 15 minutes.
- Station arrival notifications upon reaching intermediate junctions.
- Administrator manual broadcast capability for network-wide emergency alerts.

### 3.6 Railway Administrator Dashboard (Module 6)
- High-level KPI summary cards (Total Fleet, Active Trains, Punctuality Rate %, Avg Delay, Platform Changes).
- Recharts visualizations: Hourly delay trends, delay causes breakdown, punctuality by corridor.
- Fleet Management: Full CRUD operations for trains and routes.
- Platform Reassignments: Dynamic platform updates with instant push alerts to passengers.
- Administrative Timing Overrides: Dispatcher override interface with reason logging.
- Simulation Control: Injection of adverse weather or traffic congestion for live demonstration.
- Historical Performance Reports with CSV export.

---

## 4. Key Source Files Directory

| File Path | Description |
| :--- | :--- |
| [backend/src/server.js](file:///c:/Users/User/OneDrive/Documents/RTTPS/backend/src/server.js) | Main Express app and HTTP server setup |
| [backend/src/config/db.js](file:///c:/Users/User/OneDrive/Documents/RTTPS/backend/src/config/db.js) | Dual database engine connector (MongoDB with fallback to JSON store) |
| [backend/src/models/schemas.js](file:///c:/Users/User/OneDrive/Documents/RTTPS/backend/src/models/schemas.js) | Mongoose schema definitions for all 8 collections |
| [backend/src/models/index.js](file:///c:/Users/User/OneDrive/Documents/RTTPS/backend/src/models/index.js) | Unified model proxy exposing identical APIs for MongoDB and JSON store |
| [backend/src/services/simulatorService.js](file:///c:/Users/User/OneDrive/Documents/RTTPS/backend/src/services/simulatorService.js) | Real-time GPS movement simulator and Socket.IO broadcaster |
| [backend/src/services/mlService.js](file:///c:/Users/User/OneDrive/Documents/RTTPS/backend/src/services/mlService.js) | FastAPI ML connector with embedded heuristic fallback |
| [backend/src/sockets/socketHandler.js](file:///c:/Users/User/OneDrive/Documents/RTTPS/backend/src/sockets/socketHandler.js) | WebSocket event listeners and room subscription logic |
| [ml-service/src/main.py](file:///c:/Users/User/OneDrive/Documents/RTTPS/ml-service/src/main.py) | FastAPI microservice application entrypoint |
| [ml-service/src/prediction/predictor.py](file:///c:/Users/User/OneDrive/Documents/RTTPS/ml-service/src/prediction/predictor.py) | Scikit-learn inference engine with feature validation |
| [frontend/src/App.jsx](file:///c:/Users/User/OneDrive/Documents/RTTPS/frontend/src/App.jsx) | React Router v6 setup with RBAC protected route boundaries |
| [frontend/src/components/LiveMap.jsx](file:///c:/Users/User/OneDrive/Documents/RTTPS/frontend/src/components/LiveMap.jsx) | Leaflet map with live GPS locomotive marker and station pins |
| [frontend/src/context/SocketContext.jsx](file:///c:/Users/User/OneDrive/Documents/RTTPS/frontend/src/context/SocketContext.jsx) | React Context for real-time WebSocket telemetry and alerts |

---

## 5. Safe Development & Operational Instructions

> [!CAUTION]
> **Database Seeding Warning:**
> Running `npm run seed` inside `backend/` is **destructive**. It drops and recreates existing collections. Never run this script against a production database without backing up data first.

### Safe Development Rules
1. **Starting the Services:** Always start services in this recommended order:
   - 1st: `ml-service` (`uvicorn src.main:app --port 8000`)
   - 2nd: `backend` (`node src/server.js`)
   - 3rd: `frontend` (`npm run dev`)
2. **MongoDB Independence:** The backend runs seamlessly even if MongoDB is stopped or not installed. The persistent fallback `backend/src/data/store.json` guarantees full functionality.
3. **Simulated vs Real Telemetry:** Train coordinates are generated mathematically from real Indian Railways geographic node points. Always maintain the simulation disclosure in academic submissions.

---

## 6. Known Limitations & Future Roadmap

- **External Hardware Telemetry:** The application currently runs an internal physics-based telemetry simulator. Future work could integrate live GPS hardware over MQTT or AIS transponders.
- **SMS / Push Service:** Alerts are pushed via WebSockets in-browser. Integration with Twilio or Firebase Cloud Messaging (FCM) would enable mobile push notifications.
- **Multi-Track Interlocking:** The simulator handles line congestion via speed throttling; an interlocking graph engine (like OpenTrack) could simulate track block reservations.

---

## 7. Ready-to-Copy Continuation Prompt for Another AI Agent

```markdown
You are continuing work on the Railway Time Tracking and Prediction System (RTTPS), a full-stack academic web application for train tracking and ML delay prediction.

Inspect the repository to confirm its state:
- Frontend: React 18, Vite, Tailwind CSS, Leaflet, Socket.IO, Recharts (all verified and built).
- Backend: Node.js, Express, Socket.IO simulator, JWT auth, MongoDB with persistent JSON fallback (all 14 tests passing).
- ML Microservice: Python FastAPI with Scikit-learn GradientBoostingRegressor on port 8000 (all tests passing).
- Documentation: Complete architecture, schemas, and API references are in `docs/` and `README.md`.

Default credentials:
- Admin: admin@rttps.com / Admin@123
- Passenger: passenger@rttps.com / Passenger@123

Rules:
1. Do NOT overwrite or delete existing working code.
2. Do NOT run the destructive seed script against existing data without explicit instruction.
3. Keep secrets in environment variables.
4. Maintain the simulated telemetry disclosure.
```
