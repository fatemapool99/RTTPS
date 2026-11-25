"""
RTTPS - Railway Time Tracking and Prediction System
Synthetic Historical Railway Dataset Generator
Note: Generates a realistic synthetic railway operational dataset based on Indian Railway corridor dynamics.
Documented as synthetic for academic evaluation and demonstration.
"""

import os
import numpy as np
import pandas as pd

np.random.seed(42)

def generate_railway_dataset(num_samples: int = 15000) -> pd.DataFrame:
    train_profiles = {
        '12951': {'name': 'Mumbai Rajdhani Express', 'avg_speed': 90, 'total_dist': 1386, 'priority': 1},
        '12952': {'name': 'New Delhi Rajdhani Express', 'avg_speed': 90, 'total_dist': 1386, 'priority': 1},
        '12004': {'name': 'Lucknow Shatabdi Express', 'avg_speed': 85, 'total_dist': 511, 'priority': 2},
        '12003': {'name': 'New Delhi Shatabdi Express', 'avg_speed': 85, 'total_dist': 511, 'priority': 2},
        '22436': {'name': 'Vande Bharat Express (BSB)', 'avg_speed': 95, 'total_dist': 759, 'priority': 1},
        '22435': {'name': 'Vande Bharat Express (NDLS)', 'avg_speed': 95, 'total_dist': 759, 'priority': 1},
        '12245': {'name': 'Howrah Duronto Express', 'avg_speed': 82, 'total_dist': 1954, 'priority': 2},
        '12626': {'name': 'Kerala Express', 'avg_speed': 70, 'total_dist': 3036, 'priority': 3},
    }

    train_numbers = list(train_profiles.keys())
    train_weights = [0.2, 0.2, 0.15, 0.15, 0.1, 0.1, 0.05, 0.05]
    selected_trains = np.random.choice(train_numbers, size=num_samples, p=train_weights)

    data = []
    for train_no in selected_trains:
        profile = train_profiles[train_no]
        total_dist = profile['total_dist']
        priority = profile['priority']
        base_speed = profile['avg_speed']

        day_of_week = int(np.random.randint(0, 7))
        is_weekend = 1 if day_of_week in [5, 6] else 0
        departure_hour = int(np.random.choice([6, 7, 8, 12, 14, 16, 17, 18, 20, 22]))

        # Progress along the route
        fraction_completed = np.random.uniform(0.05, 0.95)
        dist_covered = round(total_dist * fraction_completed, 1)
        dist_remaining = round(total_dist - dist_covered, 1)

        # Environmental & Operational conditions
        weather = np.random.choice(
            ['Clear', 'Fog', 'Light Rain', 'Heavy Rain', 'Storm'],
            p=[0.65, 0.12, 0.13, 0.07, 0.03]
        )
        congestion = np.random.choice(
            ['Low', 'Medium', 'High', 'Peak Congestion'],
            p=[0.40, 0.35, 0.18, 0.07]
        )

        weather_penalty = {'Clear': 0, 'Light Rain': 5, 'Fog': 30, 'Heavy Rain': 18, 'Storm': 40}[weather]
        congestion_penalty = {'Low': 0, 'Medium': 10, 'High': 25, 'Peak Congestion': 45}[congestion]

        # Previous delay accumulated up to this station (realistic Indian Railways delay curve)
        prev_delay = max(0.0, np.random.exponential(scale=15.0) + (dist_covered / 120.0) * (priority * 1.5))
        if np.random.rand() < 0.30:
            prev_delay = 0.0  # 30% of checkpoints have zero previous delay
        prev_delay = round(min(prev_delay, 180.0), 1)

        # Current train speed
        speed_factor = 1.0
        if weather in ['Fog', 'Storm']:
            speed_factor *= 0.70
        elif weather == 'Heavy Rain':
            speed_factor *= 0.88
        if congestion in ['High', 'Peak Congestion']:
            speed_factor *= 0.80

        current_speed = max(25.0, min(140.0, np.random.normal(loc=base_speed * speed_factor, scale=8)))
        current_speed = round(current_speed, 1)
        speed_ratio = round(current_speed / base_speed, 3)

        signal_stops = int(np.random.poisson(lam=max(0.2, (dist_remaining / 400.0) * (0.8 if congestion == 'Low' else 2.2))))

        # Physics + operational delay model
        # Segment speed deficit (affects the upcoming 100km block)
        speed_deficit = max(0.0, (base_speed - current_speed) / base_speed) * 35.0

        random_noise = np.random.normal(loc=0, scale=3.5)
        
        # Priority trains recover more delay on open stretches
        recovery_bonus = max(0.0, (base_speed - 70) * 0.15 * (4 - priority))

        calc_delay = (
            prev_delay * 0.82
            + speed_deficit * (min(dist_remaining, 300) / 300)
            + weather_penalty * (min(dist_remaining, 400) / 400)
            + congestion_penalty * (min(dist_remaining, 400) / 400)
            + (signal_stops * 6.0)
            - recovery_bonus
            + random_noise
        )

        arrival_delay = round(max(0.0, min(360.0, calc_delay)), 1)

        data.append({
            'train_number': str(train_no),
            'train_name': profile['name'],
            'day_of_week': day_of_week,
            'is_weekend': is_weekend,
            'departure_hour': departure_hour,
            'total_distance_km': total_dist,
            'distance_covered_km': dist_covered,
            'distance_remaining_km': dist_remaining,
            'current_speed_kmh': current_speed,
            'speed_ratio': speed_ratio,
            'previous_delay_minutes': prev_delay,
            'weather_condition': weather,
            'track_congestion': congestion,
            'signal_stops_count': signal_stops,
            'train_priority': priority,
            'arrival_delay_minutes': arrival_delay
        })

    df = pd.DataFrame(data)
    return df

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    data_dir = os.path.join(base_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)
    out_path = os.path.join(data_dir, 'historical_train_data.csv')
    
    print("Generating realistic synthetic railway dataset (15,000 trips)...")
    df = generate_railway_dataset(15000)
    df.to_csv(out_path, index=False)
    print(f"Dataset successfully created at: {out_path}")
    print(f"Shape: {df.shape}")
    print(f"Mean Arrival Delay: {df['arrival_delay_minutes'].mean():.2f} mins")
    print(f"Min: {df['arrival_delay_minutes'].min():.1f}, Median: {df['arrival_delay_minutes'].median():.1f}, Max: {df['arrival_delay_minutes'].max():.1f}")
