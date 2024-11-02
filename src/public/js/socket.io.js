const socket = io();

// Escuchar cambios en el estado del juego
socket.on('game-state-updated', (newState) => {
  // Actualizar el estado del juego en la interfaz
  updateGameView(newState);
});

// Escuchar cambios en la lista de usuarios
socket.on('user-connected', (userId) => {
  addUserToList(userId); // Añadir el usuario conectado
});

socket.on('user-disconnected', (userId) => {
  removeUserFromList(userId); // Eliminar el usuario desconectado
});

// Emitir cambios al servidor
function updateGameState(newState) {
  socket.emit('update-game-state', newState);
}