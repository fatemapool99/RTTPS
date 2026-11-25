/**
 * RTTPS - Socket.IO Real-Time Communication Hub
 * Manages client connections, train subscription rooms, and push broadcasts.
 */

const setupSocketIO = (io, simulatorService) => {
  simulatorService.setSocketIO(io);

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Client subscribes to live GPS updates for a specific train
    socket.on('subscribe:train', (trainNumber) => {
      socket.join(`train:${trainNumber}`);
      console.log(`[Socket.IO] Client ${socket.id} subscribed to train: ${trainNumber}`);
    });

    // Client unsubscribes
    socket.on('unsubscribe:train', (trainNumber) => {
      socket.leave(`train:${trainNumber}`);
      console.log(`[Socket.IO] Client ${socket.id} unsubscribed from train: ${trainNumber}`);
    });

    // Client joins fleet overview room
    socket.on('subscribe:fleet', () => {
      socket.join('fleet_overview');
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = { setupSocketIO };
