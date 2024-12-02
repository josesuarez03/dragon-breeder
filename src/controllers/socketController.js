const { findUserById, getOnlineUsersWithPositions, updateUser } = require('../models/usersModel');
const characterModel = require('../models/characterModel');
const { Gem, GameState } = require('../models/dbModel');

class SocketController {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> { sockets: Set, userData: Object }
    this.gameRooms = new Map(); // roomId -> { players: Set, gems: Map, scores: Map, timeLeft: number, isActive: boolean }
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Nueva conexión:', socket.id);

      socket.on('user-connected', (userData) => this.handleUserConnected(socket, userData));
      socket.on('position-update', (data) => this.handlePositionUpdate(socket, data));
      socket.on('dragon-update', (data) => this.handleDragonUpdate(socket, data));
      socket.on('startGame', (data) => this.handleStartGame(socket, data));
      socket.on('collectGem', (data) => this.handleCollectGem(socket, data));
      socket.on('gemSpawned', (data) => this.handleGemSpawned(socket, data));
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  async handleUserConnected(socket, userData) {
    try {
      const { userId } = userData;
      
      if (!userId) {
        socket.emit('error', { message: 'No user ID provided' });
        return;
      }

      const user = await findUserById(userId);
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      // Initialize or update connected user data
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, {
          sockets: new Set(),
          userData: {
            lastActive: Date.now(),
            position: { x: 400, y: 400 },
            dragons: await characterModel.getUserDragons(userId)
          }
        });
      }

      const userConnection = this.connectedUsers.get(userId);
      userConnection.sockets.add(socket);
      socket.userId = userId;

      // Join user's personal room
      const userRoom = `user_${userId}`;
      socket.join(userRoom);

      // Send initialization data
      socket.emit('initialization', {
        userId,
        dragons: userConnection.userData.dragons,
        position: userConnection.userData.position,
        onlineUsers: Array.from(this.connectedUsers.entries()).map(([id, data]) => ({
          userId: id,
          position: data.userData.position
        }))
      });

      socket.broadcast.emit('user-joined', {
        userId,
        position: userConnection.userData.position
      });

      await updateUser(userId, {
        isOnline: true,
        lastActive: new Date(),
        position: userConnection.userData.position
      });

      console.log(`Usuario ${userId} conectado. Conexiones activas: ${userConnection.sockets.size}`);

    } catch (error) {
      console.error('Error en conexión de usuario:', error);
      socket.emit('error', { message: 'Error connecting user' });
    }
  }

  async handlePositionUpdate(socket, data) {
    try {
      const { position } = data;
      const userId = socket.userId;

      if (!userId || !this.connectedUsers.has(userId)) return;

      const userConnection = this.connectedUsers.get(userId);
      userConnection.userData.position = position;

      socket.broadcast.emit('character-position-update', {
        userId,
        position,
        timestamp: Date.now()
      });

      await updateUser(userId, {
        position,
        lastActive: new Date()
      });

    } catch (error) {
      console.error('Error actualizando posición:', error);
    }
  }

  async handleDragonUpdate(socket, data) {
    try {
      const userId = socket.userId;
      if (!userId || !this.connectedUsers.has(userId)) return;

      const userConnection = this.connectedUsers.get(userId);
      userConnection.userData.dragons = await characterModel.getUserDragons(userId);

      userConnection.sockets.forEach(userSocket => {
        if (userSocket.id !== socket.id) {
          userSocket.emit('dragon-update', data);
        }
      });

    } catch (error) {
      console.error('Error en actualización de dragón:', error);
    }
  }

  async handleStartGame(socket, data) {
    try {
      const { userId, roomId, gameId } = data;
      
      // Verify active game state
      const gameState = await GameState.findOne({ user: userId, timeLeft: { $gt: 0 } });
      if (!gameState) return;

      // Create or join game room
      if (!this.gameRooms.has(roomId)) {
        this.gameRooms.set(roomId, {
          players: new Set([userId]),
          gems: new Map(),
          scores: new Map(),
          timeLeft: 30,
          isActive: true
        });
      } else {
        this.gameRooms.get(roomId).players.add(userId);
      }

      socket.join(`game_${roomId}`);

      // Initialize game state
      const roomState = this.gameRooms.get(roomId);
      const gems = await Gem.find({ roomId, collected: false });
      
      gems.forEach(gem => {
        roomState.gems.set(gem._id.toString(), {
          position: gem.position,
          collectedBy: null
        });
      });

      this.io.to(`game_${roomId}`).emit('gameInit', {
        gameId,
        gems: Array.from(roomState.gems.entries()),
        players: Array.from(roomState.players),
        timeLeft: roomState.timeLeft
      });

      if (roomState.players.size === 1) {
        this.startGameTimer(roomId);
      }

    } catch (error) {
      console.error('Error iniciando juego:', error);
      socket.emit('error', { message: 'Error starting game' });
    }
  }

  async handleCollectGem(socket, data) {
    try {
      const { gemId, roomId } = data;
      const roomState = this.gameRooms.get(roomId);
      
      if (!roomState || !roomState.isActive || !roomState.gems.has(gemId)) return;
      
      const gem = roomState.gems.get(gemId);
      if (gem.collectedBy) return;

      // Update gem state
      gem.collectedBy = socket.userId;
      const currentScore = roomState.scores.get(socket.userId) || 0;
      roomState.scores.set(socket.userId, currentScore + 100);

      // Update database
      await Gem.findByIdAndUpdate(gemId, {
        collected: true,
        collectedBy: socket.userId
      });

      // Notify all players
      this.io.to(`game_${roomId}`).emit('gemCollected', {
        gemId,
        collectedBy: socket.userId,
        newScore: roomState.scores.get(socket.userId)
      });

    } catch (error) {
      console.error('Error recolectando gema:', error);
    }
  }

  handleGemSpawned(socket, data) {
    const { gemId, position, roomId } = data;
    const roomState = this.gameRooms.get(roomId);
    
    if (!roomState || !roomState.isActive) return;

    roomState.gems.set(gemId, {
      position,
      collectedBy: null
    });

    socket.to(`game_${roomId}`).emit('gemSpawned', {
      gemId,
      position
    });
  }

  async handleDisconnect(socket) {
    try {
      const userId = socket.userId;
      if (!userId || !this.connectedUsers.has(userId)) return;

      const userConnection = this.connectedUsers.get(userId);
      userConnection.sockets.delete(socket);

      if (userConnection.sockets.size === 0) {
        this.connectedUsers.delete(userId);
        socket.broadcast.emit('user-left', userId);

        await updateUser(userId, {
          isOnline: false,
          lastActive: new Date()
        });

        // Remove from game rooms
        for (const [roomId, roomState] of this.gameRooms.entries()) {
          if (roomState.players.has(userId)) {
            roomState.players.delete(userId);
            if (roomState.players.size === 0) {
              this.gameRooms.delete(roomId);
            } else {
              this.io.to(`game_${roomId}`).emit('playerLeft', { 
                userId,
                remainingPlayers: Array.from(roomState.players)
              });
            }
          }
        }
      }

      socket.leave(`user_${userId}`);
      console.log(`Usuario ${userId} desconectado. Conexiones restantes: ${userConnection.sockets.size}`);

    } catch (error) {
      console.error('Error en desconexión:', error);
    }
  }

  startGameTimer(roomId) {
    const roomState = this.gameRooms.get(roomId);
    if (!roomState) return;

    const timer = setInterval(() => {
      roomState.timeLeft--;
      
      this.io.to(`game_${roomId}`).emit('timerUpdate', {
        timeLeft: roomState.timeLeft
      });

      if (roomState.timeLeft <= 0) {
        clearInterval(timer);
        this.endGame(roomId);
      }
    }, 1000);
  }

  async endGame(roomId) {
    const roomState = this.gameRooms.get(roomId);
    if (!roomState) return;

    roomState.isActive = false;

    // Prepare final results
    const results = {
      scores: Array.from(roomState.scores.entries()).map(([userId, score]) => ({
        userId,
        score
      })),
      totalGems: roomState.gems.size,
      collectedGems: Array.from(roomState.gems.values()).filter(gem => gem.collectedBy).length
    };

    // Notify all players
    this.io.to(`game_${roomId}`).emit('gameOver', results);

    // Update game state in database
    try {
      await GameState.updateMany(
        { roomId },
        { 
          isActive: false,
          finalScores: results.scores
        }
      );
    } catch (error) {
      console.error('Error updating game state:', error);
    }
  }

  async decrementDragonAttributes() {
    try {
      const updatedDragons = await characterModel.decrementDragonAttributes();
      
      for (const dragon of updatedDragons) {
        if (dragon.userId && this.connectedUsers.has(dragon.userId)) {
          const userConnection = this.connectedUsers.get(dragon.userId);
          userConnection.userData.dragons = await characterModel.getUserDragons(dragon.userId);
          
          userConnection.sockets.forEach(socket => {
            socket.emit('dragon-update', {
              dragon: {
                _id: dragon._id,
                name: dragon.name,
                hungry: dragon.hungry,
                energy: dragon.energy,
                health: dragon.health,
                availableForBattle: dragon.availableForBattle,
                stage: dragon.stage
              }
            });
          });
        }
      }
    } catch (error) {
      console.error('Error decrementando atributos:', error);
    }
  }
}

module.exports = SocketController;