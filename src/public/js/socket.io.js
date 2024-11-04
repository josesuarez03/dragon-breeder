// Inicializar socket
const socket = io();

// Variables para el estado del usuario actual
let currentUserId;

// Función para inicializar la conexión del usuario
function initializeUserConnection(userId) {
    currentUserId = userId;
    socket.emit('user-connected', { userId });
    // Solicitar posiciones iniciales para el mapa
    socket.emit('request-initial-positions');
}

// Actualización de atributos del dragón
socket.on('dragon-update', ({ userId, dragons }) => {
    // Solo actualizar si es nuestro dragón
    if (userId === currentUserId && dragons.length > 0) {
        const dragon = dragons[0]; // Asumiendo que trabajamos con el primer dragón
        updateDragonStats(dragon);
    }
});

socket.on('users-online-updated', (onlineUsers) => {
  updateOnlineUsersList(onlineUsers);
});

// Actualización de posición de personaje
socket.on('character-position-update', ({ userId, position, timestamp }) => {
    if (window.updateUserPosition) {
        window.updateUserPosition(userId, position);
    }
});

// Manejar desconexión de usuario
socket.on('user-disconnected', (userId) => {
    removeUserFromList(userId);
    if (window.removeUserFromMap) {
        window.removeUserFromMap(userId);
    }
});

// Funciones de actualización de la interfaz
function updateDragonStats(dragon) {
    if (!dragon) return;

    // Actualizar estadísticas del dragón
    const energyElement = document.querySelector('.energyLevel');
    const healthElement = document.querySelector('.healthLevel');
    const battleElement = document.querySelector('.availableBattle');
    const battleButton = document.querySelector('.btn-battle');
    const evolveButton = document.querySelector('.btn-evolve');

    if (energyElement) energyElement.textContent = `${dragon.energy} ⚡`;
    if (healthElement) healthElement.textContent = `${dragon.health} ❤️`;
    
    if (battleElement) {
        battleElement.textContent = dragon.availableForBattle 
            ? 'Disponible para luchar' 
            : 'No disponible para luchar';
    }
    
    if (battleButton) battleButton.disabled = !dragon.availableForBattle;
    if (evolveButton) evolveButton.disabled = dragon.stage === 'adult';

    // Si hay una imagen, actualizarla según el stage del dragón
    const dragonImage = document.querySelector('.dragon-image');
    if (dragonImage && dragon.stage) {
        dragonImage.src = `/sprites/dragons/${dragon.stage}-dragon.png`;
    }
}

function updateOnlineUsersList(onlineUsers) {
  const usersList = document.querySelector('.list-group');
  if (!usersList) return;

  usersList.innerHTML = onlineUsers.length === 0
    ? '<li class="list-group-item">No hay usuarios en línea.</li>'
    : onlineUsers.map(user => `
        <li class="list-group-item">
          ${user.username} - ${user.email}
          ${user.dragons && user.dragons.length > 0 ?
            `<span class="badge badge-primary">🐉 ${user.dragons.length}</span>`
            : ''}
        </li>
      `).join('');
}

// Función para emitir actualización de posición
function emitPositionUpdate(x, y) {
    if (!currentUserId) return;
    
    socket.emit('position-update', {
        userId: currentUserId,
        position: { x, y }
    });
}

// Función para manejar los resultados de las acciones del dragón
async function handleDragonAction(dragonId, action) {
    try {
        const response = await fetch(`/dragon/${dragonId}/action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action })
        });

        const data = await response.json();
        
        if (data.success) {
            // La actualización real vendrá a través del socket
            // pero podemos hacer una actualización inmediata para mejor UX
            updateDragonStats(data.dragon);
        } else {
            console.error('Error:', data.message);
            // Mostrar mensaje de error al usuario
            showError(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error al realizar la acción');
    }
}

// Funciones de utilidad
function showError(message) {
    // Implementar según el diseño de tu UI
    alert(message);
}

// Exportar funciones necesarias para otros scripts
window.initializeUserConnection = initializeUserConnection;
window.emitPositionUpdate = emitPositionUpdate;
window.handleDragonAction = handleDragonAction;