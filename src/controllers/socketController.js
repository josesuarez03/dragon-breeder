const { findUserById, getOnlineUsersWithPositions, updateUser} = require('../models/usersModel');
const characterModel = require('../models/characterModel');

const userSockets = new Map();

const onConnection = (io) => {
  io.on('connection', (socket) => {
      console.log('Nueva conexión:', socket.id);
  
      // Manejar conexión de usuario
      socket.on('user-connected', async (userData) => {
          try {
              // Actualizar estado online y establecer posición inicial
              const updateData = {
                  isOnline: true,
                  position: { 
                      x: 400, 
                      y: 400, 
                      lastUpdate: new Date() 
                  }
              };

              await updateUser(userData.userId, updateData);
              userSockets.set(userData.userId, socket);
  
              // Obtener usuarios online con sus posiciones
              const onlineUsers = await getOnlineUsersWithPositions();
  
              // Emitir lista actualizada de usuarios online
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
              const userId = Array.from(userSockets.keys()).find(key => userSockets.get(key) === socket);
              if (userId) {
                  await updateUser(userId, { isOnline: false });
                  userSockets.delete(userId);
                  io.emit('user-disconnected', userId);
              }
              console.log(`Usuario ${userId} desconectado: ${socket.id}`);
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