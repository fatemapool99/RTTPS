/**
 * RTTPS - Train Movement & GPS Telemetry Simulator
 * Simulates realistic GPS movements along Indian Railway corridors and drives Socket.IO real-time feeds.
 */

const { Train, Schedule, Station, LiveTracking, Prediction, Notification } = require('../models');
const mlService = require('./mlService');

class SimulatorService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.io = null;
    this.tickCount = 0;
    this.trainStates = {}; // In-memory telemetry cache
  }

  setSocketIO(io) {
    this.io = io;
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Simulator] Initializing Real-Time Train Movement Simulator...');
    await this.initializeTrainStates();

    // Run simulation loop every 3.5 seconds
    this.intervalId = setInterval(() => {
      this.simulationTick();
    }, 3500);

    console.log('[Simulator] Simulation service started (3.5s update cycle).');
  }

  stop() {
    if (!this.isRunning) return;
    clearInterval(this.intervalId);
    this.isRunning = false;
    console.log('[Simulator] Simulation service paused.');
  }

  async initializeTrainStates() {
    try {
      const trains = await Train.find({ trainStatus: { $in: ['Running', 'Delayed', 'On Time'] } });
      const stations = await Station.find({});
      const stationMap = {};
      stations.forEach(st => {
        stationMap[st.stationCode] = st;
      });

      for (const train of trains) {
        const schedules = await Schedule.find({ trainNumber: train.trainNumber }).sort({ stopSequence: 1 });
        if (!schedules || schedules.length < 2) continue;

        // Current tracking record
        const tracking = await LiveTracking.findOne({ trainNumber: train.trainNumber });

        this.trainStates[train.trainNumber] = {
          trainId: train._id,
          trainNumber: train.trainNumber,
          trainName: train.trainName,
          priority: train.priority || 1,
          schedules: schedules,
          currentSegmentIndex: 0,
          segmentProgress: 0.25, // 0.0 to 1.0 along the current station pair
          latitude: tracking ? tracking.latitude : (stationMap[schedules[0].stationCode]?.latitude || 28.6139),
          longitude: tracking ? tracking.longitude : (stationMap[schedules[0].stationCode]?.longitude || 77.2090),
          speed: tracking ? tracking.speed : 85.0,
          currentStatus: tracking ? tracking.currentStatus : 'In Transit',
          delayMinutes: train.delayMinutes || 0,
          weatherCondition: tracking ? tracking.weatherCondition : 'Clear',
          trackCongestion: tracking ? tracking.trackCongestion : 'Low',
          dataSource: 'SIMULATED_GPS',
          lastStation: schedules[0],
          nextStation: schedules[1],
          distanceRemainingKm: tracking ? tracking.distanceRemainingKm : train.totalDistanceKm * 0.7,
        };
      }
      console.log(`[Simulator] Loaded ${Object.keys(this.trainStates).length} trains for real-time simulation.`);
    } catch (err) {
      console.error('[Simulator] Error initializing train states:', err.message);
    }
  }

  async simulationTick() {
    this.tickCount++;
    const trainNumbers = Object.keys(this.trainStates);

    for (const trainNo of trainNumbers) {
      const state = this.trainStates[trainNo];
      const schedules = state.schedules;
      if (!schedules || schedules.length < 2) continue;

      const currentStation = schedules[state.currentSegmentIndex];
      const nextStation = schedules[state.currentSegmentIndex + 1];

      if (!nextStation) {
        // Train reached terminal station
        state.currentStatus = 'Arrived at Destination';
        state.speed = 0;
        continue;
      }

      // Advance progress along the segment
      const progressIncrement = 0.015 + (Math.random() * 0.01);
      state.segmentProgress += progressIncrement;

      // Realistic speed variation
      const baseSpeed = state.priority === 1 ? 92 : (state.priority === 2 ? 84 : 72);
      let targetSpeed = baseSpeed;

      if (state.weatherCondition === 'Fog') targetSpeed *= 0.65;
      if (state.trackCongestion === 'High') targetSpeed *= 0.75;
      if (state.segmentProgress < 0.1 || state.segmentProgress > 0.9) targetSpeed *= 0.60; // slow near stations

      state.speed = Math.max(25, Math.min(130, Math.round(targetSpeed + (Math.random() * 6 - 3))));

      // GPS interpolation between current station and next station
      const stMap = await this.getStationCoordinates(currentStation.stationCode, nextStation.stationCode);
      if (stMap.from && stMap.to) {
        state.latitude = Number((stMap.from.latitude + (stMap.to.latitude - stMap.from.latitude) * state.segmentProgress).toFixed(5));
        state.longitude = Number((stMap.from.longitude + (stMap.to.longitude - stMap.from.longitude) * state.segmentProgress).toFixed(5));
      }

      // Check if station reached
      if (state.segmentProgress >= 1.0) {
        state.currentSegmentIndex++;
        state.segmentProgress = 0.0;
        state.lastStation = nextStation;
        state.nextStation = schedules[state.currentSegmentIndex + 1] || null;

        if (!state.nextStation) {
          state.currentStatus = 'Journey Completed';
          state.speed = 0;
        } else {
          state.currentStatus = `Halted at ${nextStation.stationName}`;
          // Generate station arrival notification
          this.emitNotification({
            trainNumber: state.trainNumber,
            notificationType: 'INFO',
            title: `Arrived at ${nextStation.stationName}`,
            message: `${state.trainName} has arrived at ${nextStation.stationName} (Platform #${nextStation.platformNumber || 1}).`
          });
        }
      } else if (state.segmentProgress > 0.85) {
        state.currentStatus = `Approaching ${nextStation.stationName}`;
      } else {
        state.currentStatus = 'In Transit';
      }

      // Update remaining distance estimate
      const totalKm = schedules[schedules.length - 1].distanceFromSourceKm;
      const currentDist = currentStation.distanceFromSourceKm + 
        ((nextStation.distanceFromSourceKm - currentStation.distanceFromSourceKm) * state.segmentProgress);
      state.distanceRemainingKm = Math.max(0, Math.round(totalKm - currentDist));

      // Periodic ML prediction recalculation every ~14s (every 4 ticks)
      if (this.tickCount % 4 === 0) {
        this.updatePredictionForTrain(state);
      }

      // Persist latest telemetry to database
      LiveTracking.findOneAndUpdate(
        { trainNumber: state.trainNumber },
        {
          $set: {
            latitude: state.latitude,
            longitude: state.longitude,
            speed: state.speed,
            currentStatus: state.currentStatus,
            lastStationCode: state.lastStation?.stationCode || '',
            nextStationCode: state.nextStation?.stationCode || '',
            nextStationName: state.nextStation?.stationName || '',
            distanceRemainingKm: state.distanceRemainingKm,
            weatherCondition: state.weatherCondition,
            trackCongestion: state.trackCongestion,
            timestamp: new Date()
          }
        },
        { upsert: true }
      ).catch(() => {});

      // Broadcast live update over Socket.IO
      if (this.io) {
        this.io.emit('train:location_update', {
          trainNumber: state.trainNumber,
          trainName: state.trainName,
          latitude: state.latitude,
          longitude: state.longitude,
          speed: state.speed,
          currentStatus: state.currentStatus,
          nextStationName: state.nextStation?.stationName || 'Terminus',
          nextStationCode: state.nextStation?.stationCode || '',
          distanceRemainingKm: state.distanceRemainingKm,
          delayMinutes: state.delayMinutes,
          weatherCondition: state.weatherCondition,
          trackCongestion: state.trackCongestion,
          dataSource: 'SIMULATED_GPS',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  async updatePredictionForTrain(state) {
    try {
      const mlPayload = {
        train_number: state.trainNumber,
        distance_remaining_km: state.distanceRemainingKm,
        current_speed_kmh: state.speed,
        previous_delay_minutes: state.delayMinutes,
        weather_condition: state.weatherCondition,
        track_congestion: state.trackCongestion,
        train_priority: state.priority,
        scheduled_arrival: state.nextStation?.scheduledArrival
      };

      const predictionResult = await mlService.getPrediction(mlPayload);
      const newEstimatedDelay = predictionResult.estimated_delay_minutes;

      // Update train delay state
      const oldDelay = state.delayMinutes;
      state.delayMinutes = newEstimatedDelay;

      // Update train status
      const trainStatus = newEstimatedDelay > 15 ? 'Delayed' : (newEstimatedDelay > 0 ? 'Running' : 'On Time');
      Train.findOneAndUpdate(
        { trainNumber: state.trainNumber },
        { $set: { delayMinutes: newEstimatedDelay, trainStatus } }
      ).catch(() => {});

      // Persist prediction
      Prediction.findOneAndUpdate(
        { trainNumber: state.trainNumber },
        {
          $set: {
            stationCode: state.nextStation?.stationCode || '',
            stationName: state.nextStation?.stationName || '',
            scheduledArrival: state.nextStation?.scheduledArrival || '',
            predictedArrival: predictionResult.predicted_arrival || '',
            estimatedDelayMinutes: newEstimatedDelay,
            confidenceScore: predictionResult.confidence_score,
            delaySeverity: predictionResult.status,
            delayFactors: predictionResult.delay_factors,
            predictionTimestamp: new Date()
          }
        },
        { upsert: true }
      ).catch(() => {});

      // Emit prediction update via socket
      if (this.io) {
        this.io.emit('train:prediction_update', {
          trainNumber: state.trainNumber,
          prediction: predictionResult,
          timestamp: new Date().toISOString()
        });
      }

      // Check for significant delay alert notification (> 15 mins and increased by >= 8 mins)
      if (newEstimatedDelay >= 15 && (newEstimatedDelay - oldDelay >= 8)) {
        await this.emitNotification({
          trainNumber: state.trainNumber,
          notificationType: 'DELAY',
          title: `Delay Advisory: ${state.trainName}`,
          message: `${state.trainName} (${state.trainNumber}) is now delayed by approximately ${newEstimatedDelay} mins. Primary cause: ${predictionResult.delay_factors[0] || 'Track clearance delay'}.`
        });
      }
    } catch (err) {
      console.warn(`[Simulator] Prediction update error for ${state.trainNumber}:`, err.message);
    }
  }

  async emitNotification(notifData) {
    try {
      const doc = await Notification.create({
        userId: 'all',
        trainNumber: notifData.trainNumber,
        notificationType: notifData.notificationType,
        title: notifData.title,
        message: notifData.message,
        readStatus: false,
        timestamp: new Date()
      });

      if (this.io) {
        this.io.emit('notification:new', doc);
      }
    } catch (err) {
      console.error('[Simulator] Failed to emit notification:', err.message);
    }
  }

  // Admin control: Inject weather, congestion, or delay spike for demonstration
  injectCondition(trainNumber, condition) {
    if (this.trainStates[trainNumber]) {
      const state = this.trainStates[trainNumber];
      if (condition.weather) state.weatherCondition = condition.weather;
      if (condition.congestion) state.trackCongestion = condition.congestion;
      if (condition.delayAdded) state.delayMinutes += Number(condition.delayAdded);
      if (condition.speed) state.speed = Number(condition.speed);

      // Force immediate prediction update
      this.updatePredictionForTrain(state);
      return { success: true, updatedState: state };
    }
    return { success: false, message: 'Train not found in active simulator' };
  }

  async getStationCoordinates(code1, code2) {
    const st1 = await Station.findOne({ stationCode: code1 });
    const st2 = await Station.findOne({ stationCode: code2 });
    return {
      from: st1 ? { latitude: st1.latitude, longitude: st1.longitude } : null,
      to: st2 ? { latitude: st2.latitude, longitude: st2.longitude } : null
    };
  }
}

module.exports = new SimulatorService();
