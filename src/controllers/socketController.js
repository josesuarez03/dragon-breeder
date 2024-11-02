const User = require('../models/usersModel');
const characterModel = require('./models/characterModel');

const userSockets = new Map();

export const onConnection = () => {
    io.on('connection', (socket) => {
        console.log('Nueva conexión:', socket.id);
    
        // Manejar conexión de usuario
        socket.on('user-connected', async (userData) => {
          try {
            // Actualizar estado online y establecer posición inicial
            const user = await User.findOneAndUpdate(
              { userId: userData.userId },
              { 
                isOnline: true,
                position: { x: 400, y: 400, lastUpdate: new Date() }
              },
              { new: true }
            );
    
            userSockets.set(userData.userId, socket);
    
            // Obtener usuarios online con sus posiciones
            const onlineUsers = await User.find(
              { isOnline: true },
              'userId username email dragons position'
            );
    
            // Emitir lista actualizada de usuarios online
            io.emit('users-online-update', onlineUsers);
          } catch (error) {
            console.error('Error en conexión de usuario:', error);
          }
        });
    
        // Manejar actualización de posición
        socket.on('position-update', async ({ userId, position }) => {
          try {

            const user = await User.findById(userId); // Encuentra el usuario por ID
            
            if (!userId || typeof position.x !== 'number' || typeof position.y !== 'number') {
              return console.error('Datos de posición inválidos:', userId, position);
            }

            if (!user) {
                console.error('Usuario no encontrado:', userId);
                return;
            }

            // Usa el método updatePosition en lugar de directamente acceder a User.findOneAndUpdate
            await user.updatePosition(position.x, position.y);

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
            const onlineUsers = await User.find(
              { isOnline: true },
              'userId username position'
            );
            
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
              await User.findOneAndUpdate({ userId }, { isOnline: false });
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

export const decrementDragonAttributes = async () => {
    try {
      const users = await User.find({ 'dragons.0': { $exists: true } });
      
      for (const user of users) {
        const updatedDragons = await characterModel.decrementDragonAttributes(user.userId);
        
        if (updatedDragons.length > 0) {
          const userSocket = userSockets.get(user.userId);
          if (userSocket) {
            userSocket.emit('dragon-update', { 
              userId: user.userId, 
              dragons: updatedDragons 
            });
          }
        }
      }
    } catch (err) {
      console.error('Error decrementando atributos:', err);
    }
};