# RTTPS REST API & WebSocket Protocol Reference

The Railway Time Tracking and Prediction System exposes a comprehensive RESTful API and bi-directional WebSocket interface.

- **Base URL (Backend):** `http://localhost:5000/api`
- **Base URL (Vite Dev Proxy):** `http://localhost:3000/api`
- **Base URL (ML FastAPI):** `http://localhost:8000`
- **WebSocket Protocol:** Socket.IO v4 at `http://localhost:5000`

---

## 1. Authentication & Security Scheme

All protected endpoints require a valid JSON Web Token (JWT) transmitted via the standard HTTP Authorization header:

```http
Authorization: Bearer <jwt_token>
```

Tokens are valid for 7 days and embed the user's `id`, `email`, and `role` (`'passenger'` or `'admin'`).

### Standard Response Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure or missing payload parameters.
- `401 Unauthorized`: Missing or invalid JWT token.
- `403 Forbidden`: Authenticated user lacks `'admin'` role privileges.
- `404 Not Found`: Target entity does not exist.
- `500 Internal Server Error`: Unhandled server exception.

---

## 2. API Endpoints

### 2.1 Authentication (`/api/auth`)

#### `POST /api/auth/register`
Creates a new passenger account.
- **Access:** Public
- **Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123",
  "phoneNumber": "9876543210",
  "preferredStation": "NDLS"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1Ni...",
  "user": {
    "id": "673f8a...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "passenger"
  }
}
```

#### `POST /api/auth/login`
Authenticates a user and issues a JWT token.
- **Access:** Public
- **Request Body:**
```json
{
  "email": "admin@rttps.com",
  "password": "Admin@123"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1Ni...",
  "user": {
    "id": "673f8b...",
    "name": "Chief Operations Controller",
    "email": "admin@rttps.com",
    "role": "admin"
  }
}
```

#### `GET /api/auth/me`
Retrieves current user identity from the Bearer token.
- **Access:** Protected (Passenger or Admin)

#### `PUT /api/auth/profile`
Updates current user preferences and contact information.
- **Access:** Protected (Passenger or Admin)

---

### 2.2 Trains & Fleet Management (`/api/trains`)

#### `GET /api/trains`
Retrieves a paginated list of all registered trains.
- **Access:** Public
- **Query Params:** `status`, `page`, `limit`

#### `GET /api/trains/search`
Multi-criteria search filtering by train number, train name, or station codes.
- **Access:** Public
- **Query Params:**
  - `q`: Generic search keyword (matches number or name)
  - `source`: Station code (e.g., `NDLS`)
  - `dest`: Station code (e.g., `MMCT`)
- **Sample Query:** `GET /api/trains/search?source=NDLS&dest=MMCT`
- **Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "673f8c...",
      "trainNumber": "12951",
      "trainName": "Mumbai Tejas Rajdhani Express",
      "trainType": "Rajdhani Express",
      "sourceStation": "NDLS",
      "destStation": "MMCT",
      "sourceName": "New Delhi",
      "destName": "Mumbai Central",
      "trainStatus": "Running",
      "currentSpeed": 92,
      "delayMinutes": 10
    }
  ]
}
```

#### `GET /api/trains/:trainNumber`
Returns full details for a train, including its complete timetable stops and assigned platforms.
- **Access:** Public

#### `POST /api/trains`
Registers a new train in the fleet.
- **Access:** Protected (`admin` role required)
- **Request Body:**
```json
{
  "trainNumber": "12002",
  "trainName": "Bhopal Shatabdi Express",
  "trainType": "Shatabdi Express",
  "sourceStation": "NDLS",
  "destStation": "RKMP",
  "sourceName": "New Delhi",
  "destName": "Rani Kamlapati",
  "totalDistanceKm": 707,
  "averageSpeedKmh": 85,
  "runningDays": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "priority": 2
}
```

#### `PUT /api/trains/:trainNumber`
Updates operational parameters of an existing train.
- **Access:** Protected (`admin` role required)

#### `DELETE /api/trains/:trainNumber`
Removes a train record and cascades deletion to its associated schedules.
- **Access:** Protected (`admin` role required)

---

### 2.3 Schedules & Platform Management (`/api/schedules`)

#### `GET /api/schedules/train/:trainNumber`
Retrieves chronological stops and platform assignments for a specific train.
- **Access:** Public

#### `PUT /api/schedules/platform/update`
Allows dispatchers to reassign a station platform. Emits real-time notification alerts.
- **Access:** Protected (`admin` role required)
- **Request Body:**
```json
{
  "trainNumber": "12951",
  "stationCode": "KOTA",
  "platformNumber": 3
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Platform updated to #3 at KOTA",
  "data": { ... }
}
```

#### `POST /api/schedules/override-eta`
Overrides automated AI delay predictions with official dispatcher dispatch times.
- **Access:** Protected (`admin` role required)
- **Request Body:**
```json
{
  "trainNumber": "12951",
  "stationCode": "KOTA",
  "manualDelayMinutes": 25,
  "reason": "Signal interlocking maintenance near Bharatpur Jn"
}
```

---

### 2.4 Live Tracking & Telemetry (`/api/tracking`)

#### `GET /api/tracking/:trainNumber`
Fetches current spatial coordinates, speed, heading, and distance remaining.
- **Access:** Public
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "trainNumber": "12951",
    "latitude": 27.2831,
    "longitude": 76.5124,
    "speed": 88.5,
    "currentStatus": "In Transit",
    "nextStationName": "Kota Junction",
    "nextStationCode": "KOTA",
    "distanceRemainingKm": 910,
    "weatherCondition": "Clear",
    "trackCongestion": "Low",
    "dataSource": "SIMULATED_GPS",
    "timestamp": "2026-11-21T10:15:30.000Z"
  }
}
```

#### `GET /api/tracking/fleet/all`
Returns the active location and telemetry snapshots for all operating trains.
- **Access:** Public

#### `POST /api/tracking/simulation/inject`
Simulator control hook to test system behavior during adverse track events.
- **Access:** Protected (`admin` role required)
- **Request Body:**
```json
{
  "trainNumber": "12951",
  "condition": {
    "weather": "Fog",
    "congestion": "High",
    "delayAdded": 20,
    "speed": 45
  }
}
```

---

### 2.5 Machine Learning Delay Predictions (`/api/predictions`)

#### `GET /api/predictions/:trainNumber`
Returns the latest AI forecast for a train's upcoming stations.
- **Access:** Public

#### `POST /api/predictions/calculate`
Directly passes runtime metrics through the inference pipeline (FastAPI `GradientBoostingRegressor`).
- **Access:** Public / Service-to-Service
- **Request Body:**
```json
{
  "trainNumber": "12951",
  "currentSpeed": 88.0,
  "distanceRemaining": 220.0,
  "previousDelay": 12.0,
  "weather": "Clear",
  "congestion": "Low"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "source": "FASTAPI_PYTHON_MODEL",
    "model_used": "GradientBoostingRegressor",
    "estimated_delay_minutes": 8.5,
    "status": "Minor Delay",
    "confidence_score": 0.94,
    "delay_factors": ["Distance Remaining: 220km", "Cruising Speed: 88km/h"]
  }
}
```

#### `GET /api/predictions/metrics/evaluation`
Returns real-time model evaluation metrics and regression scores ($R^2$, MAE, RMSE).
- **Access:** Public

---

### 2.6 Operational Notifications (`/api/notifications`)

#### `GET /api/notifications`
Returns the active feed of delay advisories, platform announcements, and cancellations.
- **Access:** Public
- **Query Params:** `limit` (default: 20)

#### `POST /api/notifications/broadcast`
Broadcasts an official passenger advisory across all active web clients.
- **Access:** Protected (`admin` role required)

---

### 2.7 Analytics & Reports (`/api/analytics`)

#### `GET /api/analytics/dashboard-stats`
Aggregated railway operational KPIs (Total Trains, Active Trains, Punctuality Rate %, Avg Delay, Platform Changes).
- **Access:** Protected (`admin` role required)

#### `GET /api/analytics/charts/performance`
Provides formatted chart data for Recharts (Hourly Delay Trends, Delay Cause Breakdown, Punctuality by Route).
- **Access:** Protected (`admin` role required)

#### `GET /api/analytics/export/csv`
Downloads an audit CSV report of historical train running performance.
- **Access:** Protected (`admin` role required)

---

## 3. Python FastAPI Machine Learning API (Port 8000)

Exposed independently for microservice decoupling and offline training:

- `GET /`: Service metadata, active model name, and version.
- `GET /health`: Health status and model load verification (`{"status": "healthy", "model_loaded": true}`).
- `GET /metrics`: Scikit-learn test evaluation metrics (`mae_minutes`, `rmse_minutes`, `r2_score`).
- `POST /predict`: Pydantic V2 validated inference endpoint.
- `POST /retrain`: Triggers automated retraining pipeline against updated trip records.

---

## 4. Socket.IO Real-Time Event Protocol

### Client to Server Events
- `subscribe:train` `(trainNumber: string)`: Joins the broadcast room for a train.
- `unsubscribe:train` `(trainNumber: string)`: Leaves the train broadcast room.
- `subscribe:fleet`: Subscribes to fleet-wide coordinate events.

### Server to Client Events
- `train:location_update` `(telemetryObject)`: Emitted every 3.5s with updated latitude, longitude, speed, status, and distance remaining.
- `train:prediction_update` `(predictionObject)`: Emitted periodically whenever ML predicts new ETA values.
- `notification:new` `(alertObject)`: Emitted immediately when delays exceed thresholds or platforms change.
