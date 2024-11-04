const { findUserById, getOnlineUsersWithPositions, updateUser} = require('../models/usersModel');
const characterModel = require('../models/characterModel');

const userSockets = new Map();
const userSessions = new Map();

const onConnection = (io) => {
  io.on('connection', (socket) => {
      console.log('Nueva conexión:', socket.id);
  
      // Manejar conexión de usuario
      socket.on('user-connected', async (userData) => {
        try {
            const user = await findUserById(userData.userId);
            if (!user) return;

            // Add new socket connection while preserving existing ones
            const userSocketSet = userSockets.get(userData.userId) || new Set();
            userSocketSet.add(socket);
            userSockets.set(userData.userId, userSocketSet);

            // Track session
            userSessions.set(socket.id, {
                userId: userData.userId,
                sessionId: userData.sessionId
            });

            const updateData = {
                isOnline: true,
                position: {
                    x: 400,
                    y: 400,
                    lastUpdate: new Date()
                }
            };

            await updateUser(userData.userId, updateData);

            // Emit online users list to all clients
            const onlineUsers = await getOnlineUsersWithPositions();
            io.emit('users-online-update', onlineUsers);
        } catch (error) {
            console.error('Error en conexión de usuario:', error);
        }
      });
  
      // Manejar actualización de posición
      socket.on('position-update', async ({ userId, position }) => {
          try {
              if (!userId || typeof position.x !== 'number' || typeof position.y !== 'number') {
                  return console.error('Datos de posición inválidos:', userId, position);
              }

              const user = await findUserById(userId);
              
              if (!user) {
                  console.error('Usuario no encontrado:', userId);
                  return;
              }

              const updateData = {
                  position: {
                      x: position.x,
                      y: position.y,
                      lastUpdate: new Date()
                  }
              };

              await updateUser(userId, updateData);

              // Emitir actualización a otros usuarios
              socket.broadcast.emit('character-position-update', { 
                  userId, 
                  position,
                  timestamp: Date.now()
              });
          } catch (error) {
              console.error('Error actualizando posición:', error);
          }
      });
  
      // Manejar solicitud de posiciones iniciales
      socket.on('request-initial-positions', async () => {
          try {
              const onlineUsers = await getOnlineUsersWithPositions();
              
              socket.emit('initial-positions', onlineUsers.map(user => ({
                  userId: user.userId,
                  username: user.username,
                  position: user.position
              })));
          } catch (error) {
              console.error('Error obteniendo posiciones iniciales:', error);
          }
      });
  
      // Manejar desconexión de usuario
      socket.on('disconnect', async () => {
        try {
            const sessionData = userSessions.get(socket.id);
            if (!sessionData) return;

            const { userId } = sessionData;
            const userSocketSet = userSockets.get(userId);

            if (userSocketSet) {
                userSocketSet.delete(socket);
                
                // Only set user offline if no active sockets remain
                if (userSocketSet.size === 0) {
                    userSockets.delete(userId);
                    await updateUser(userId, { isOnline: false });
                    io.emit('user-disconnected', userId);
                }
            }

            userSessions.delete(socket.id);
            console.log(`Socket desconectado: ${socket.id}`);
        } catch (error) {
            console.error('Error al manejar la desconexión:', error);
        }
    });
  });
};

const decrementDragonAttributes = async () => {
  try {
      const updatedDragons = await characterModel.decrementDragonAttributes();
      
      if (updatedDragons && updatedDragons.length > 0) {
          const dragonsByUser = {};
          for (const dragon of updatedDragons) {
              if (dragon.userId) { // Verifica que userId esté presente
                  if (!dragonsByUser[dragon.userId]) {
                      dragonsByUser[dragon.userId] = [];
                  }
                  dragonsByUser[dragon.userId].push(dragon);
              }
          }
          // Emitir actualizaciones a cada usuario
          for (const [userId, dragons] of Object.entries(dragonsByUser)) {
              const userSocket = userSockets.get(userId);
              if (userSocket) {
                  userSocket.emit('dragon-update', {
                      userId,
                      dragons: dragons.map(dragon => ({
                          _id: dragon._id,
                          name: dragon.name,
                          hungry: dragon.hungry,
                          energy: dragon.energy,
                          health: dragon.health,
                          availableForBattle: dragon.availableForBattle,
                          stage: dragon.stage
                      }))
                  });
              }
          }
      }
  } catch (err) {
      console.error('Error decrementando atributos:', err);
  }
};

module.exports = { onConnection, decrementDragonAttributes };