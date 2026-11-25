# RTTPS - Machine Learning Model Evaluation & EDA Report

## 1. Dataset Overview
- **Total Records:** 15,000
- **Train/Test Split:** 80% / 20% (Test set: 3,000 samples)
- **Target Variable:** `arrival_delay_minutes` (Delay in minutes)
- **Target Mean:** 38.88 mins
- **Target Median:** 31.20 mins
- **Target Standard Deviation:** 33.74 mins

## 2. Model Performance Metrics
| Model Architecture | MAE (Mean Absolute Error) | RMSE (Root Mean Sq Error) | R² Score |
| :--- | :--- | :--- | :--- |
| **Random Forest Regressor (Selected)** | **4.279 mins** | **6.270 mins** | **0.9668** |
| Gradient Boosting Regressor | 3.283 mins | 4.380 mins | 0.9838 |

## 3. Top Predictive Feature Importances
| Rank | Feature | Importance Weight | Description |
| :--- | :--- | :--- | :--- |
| 1 | `signal_stops_count` | 38.96% | Derived influence on train delay |
| 2 | `previous_delay_minutes` | 25.86% | Derived influence on train delay |
| 3 | `current_speed_kmh` | 13.79% | Derived influence on train delay |
| 4 | `speed_ratio` | 9.52% | Derived influence on train delay |
| 5 | `distance_remaining_km` | 4.72% | Derived influence on train delay |
| 6 | `track_congestion_Peak Congestion` | 1.87% | Derived influence on train delay |
| 7 | `track_congestion_Low` | 1.30% | Derived influence on train delay |
| 8 | `weather_condition_Clear` | 0.95% | Derived influence on train delay |
| 9 | `track_congestion_High` | 0.62% | Derived influence on train delay |
| 10 | `track_congestion_Medium` | 0.58% | Derived influence on train delay |

## 4. Key Engineering Insights
1. **Accumulated Delay Propagation (`previous_delay_minutes`)**: The strongest predictor of arrival delay. Trains with initial headway loss face bottlenecking at upcoming junctions.
2. **Current Speed Deficit vs Timetable Standard (`current_speed_kmh` & `speed_ratio`)**: Trains running significantly below corridor design speed suffer compounding delays.
3. **Environmental and Congestion Factors**: Adverse weather (e.g. Fog/Storm) and peak junction congestion significantly elevate the expected delay variance.
