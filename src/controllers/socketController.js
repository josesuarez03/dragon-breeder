const { findUserById, getOnlineUsersWithPositions, updateUser} = require('../models/usersModel');
const characterModel = require('../models/characterModel');

// Mapa para mantener múltiples sockets por usuario
const userSockets = new Map(); // userId -> Set of sockets
const activeUsers = new Map(); // userId -> user data

const onConnection = (io) => {
  io.on('connection', async (socket) => {
    console.log('Nueva conexión:', socket.id);

    socket.on('user-connected', async (userData) => {
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

        // Crear una sala única para el usuario
        const userRoom = `user_${userId}`;
        socket.join(userRoom);

        // Almacenar información del socket
        socket.userId = userId;

        // Inicializar o actualizar el Set de sockets para este usuario
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket);

        // Actualizar o inicializar datos del usuario activo
        if (!activeUsers.has(userId)) {
          activeUsers.set(userId, {
            lastActive: Date.now(),
            position: {
              x: 400,
              y: 400
            }
          });
        }

        // Obtener dragones específicos del usuario
        const userDragons = await characterModel.getUserDragons(userId);
        
        // Emitir datos de inicialización específicos del usuario
        socket.emit('initialization', {
          userId,
          dragons: userDragons,
          position: activeUsers.get(userId).position
        });

        // Emitir lista actualizada de usuarios activos a todos
        const onlineUsers = Array.from(activeUsers.keys()).map(id => ({
          userId: id,
          position: activeUsers.get(id).position
        }));
        
        io.emit('users-online-update', onlineUsers);

        // Actualizar estado en la base de datos
        await updateUser(userId, {
          isOnline: true,
          lastActive: new Date(),
          position: activeUsers.get(userId).position
        });

        // Log para depuración
        console.log(`Usuario ${userId} conectado. Sockets activos: ${userSockets.get(userId).size}`);

      } catch (error) {
        console.error('Error en conexión de usuario:', error);
        socket.emit('error', { message: 'Error connecting user' });
      }
    });

    socket.on('position-update', async (data) => {
      try {
        const { position } = data;
        const userId = socket.userId;

        if (!userId || !userSockets.has(userId)) {
          return;
        }

        // Actualizar posición en memoria
        if (activeUsers.has(userId)) {
          activeUsers.get(userId).position = position;
        }

        // Emitir actualización a todos los demás sockets excepto al emisor
        socket.broadcast.emit('character-position-update', {
          userId,
          position,
          timestamp: Date.now()
        });

        // Actualizar en base de datos
        await updateUser(userId, {
          position: position,
          lastActive: new Date()
        });

      } catch (error) {
        console.error('Error actualizando posición:', error);
      }
    });

    socket.on('disconnect', async () => {
      try {
        const userId = socket.userId;
        if (!userId) return;

        const userSocketSet = userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(socket);

          // Solo eliminar datos del usuario si no quedan sockets activos
          if (userSocketSet.size === 0) {
            userSockets.delete(userId);
            activeUsers.delete(userId);

            // Actualizar estado en base de datos
            await updateUser(userId, {
              isOnline: false,
              lastActive: new Date()
            });

            // Notificar a otros usuarios
            socket.broadcast.emit('user-disconnected', userId);
          }

          // Log para depuración
          console.log(`Socket desconectado para usuario ${userId}. Sockets restantes: ${userSocketSet.size}`);
        }

        socket.leave(`user_${userId}`);
      } catch (error) {
        console.error('Error en desconexión:', error);
      }
    });

    // Manejar actualizaciones de dragones
    socket.on('dragon-update', async (data) => {
      try {
        const userId = socket.userId;
        if (!userId || !userSockets.has(userId)) return;

        const userSocketSet = userSockets.get(userId);
        // Emitir la actualización a todos los sockets del mismo usuario
        userSocketSet.forEach(userSocket => {
          if (userSocket.id !== socket.id) {
            userSocket.emit('dragon-update', data);
          }
        });
      } catch (error) {
        console.error('Error en actualización de dragón:', error);
      }
    });
  });
};

const decrementDragonAttributes = async (io) => {
  try {
    const updatedDragons = await characterModel.decrementDragonAttributes();
    
    for (const dragon of updatedDragons) {
      if (dragon.userId && userSockets.has(dragon.userId)) {
        const userSocketSet = userSockets.get(dragon.userId);
        
        // Emitir actualización a todos los sockets del usuario
        userSocketSet.forEach(socket => {
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
};

module.exports = { onConnection, decrementDragonAttributes };