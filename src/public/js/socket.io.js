// socket.io.js (cliente)
let socket;
let currentUserId;
let myDragons = [];

function initializeSocket(userId) {
    socket = io();
    currentUserId = userId;

    // Conexión inicial
    socket.on('connect', () => {
        socket.emit('user-connected', {
          userId: currentUserId // Asegúrate de tener acceso al ID del usuario actual
        });
    });

    // Manejar la inicialización
    socket.on('initialization', (data) => {
        if (data.userId === currentUserId) {
            myDragons = data.dragons;
            updateDragonDisplay(myDragons);
            if (data.position) {
                updateMyPosition(data.position);
            }
        }
    });

    // Actualización de dragones
    socket.on('dragon-update', ({ dragon }) => {
        const index = myDragons.findIndex(d => d._id === dragon._id);
        if (index !== -1) {
            myDragons[index] = { ...myDragons[index], ...dragon };
            updateDragonStats(myDragons[index]);
        }
        updateDragonUI(data.dragon);
    });

    // Actualización de posición de otros usuarios
    socket.on('character-position-update', ({ userId, position }) => {
        if (userId !== currentUserId) {
            updateOtherUserPosition(userId, position);
        }
    });

    // En tu código cliente
    socket.on('session-expired', (data) => {
        alert(data.message);
        // Redirigir al login o recargar la página
        window.location.href = '/login';
    });

    // Manejo de desconexión de otros usuarios
    socket.on('user-disconnected', (userId) => {
        removeUserFromMap(userId);
    });

    // Manejo de errores
    socket.on('error', ({ message }) => {
        console.error('Socket error:', message);
        showErrorMessage(message);
    });
}

function updateDragonDisplay(dragons) {
    const dragonContainer = document.querySelector('.dragon-container');
    if (!dragonContainer) return;

    dragonContainer.innerHTML = dragons.map(dragon => `
        <div class="dragon-card" data-id="${dragon._id}">
            <h3>${dragon.name}</h3>
            <div class="stats">
                <div class="energy">Energy: ${dragon.energy}⚡</div>
                <div class="health">Health: ${dragon.health}❤️</div>
                <div class="hungry">Hungry: ${dragon.hungry}🍖</div>
            </div>
            <div class="status">
                ${dragon.availableForBattle ? '✅ Ready for battle' : '❌ Not ready'}
            </div>
        </div>
    `).join('');
}

function updateMyPosition(position) {
    if (window.updatePlayerPosition) {
        window.updatePlayerPosition(position.x, position.y);
    }
}

function updateOtherUserPosition(userId, position) {
    if (window.updateOtherPlayerPosition) {
        window.updateOtherPlayerPosition(userId, position);
    }
}

function removeUserFromMap(userId) {
    if (window.removePlayer) {
        window.removePlayer(userId);
    }
}

function emitPositionUpdate(x, y) {
    if (socket && currentUserId) {
        socket.emit('position-update', {
            position: { x, y }
        });
    }
}

function showErrorMessage(message) {
    const errorDiv = document.getElementById('error-messages') || 
                    document.createElement('div');
    errorDiv.id = 'error-messages';
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Exportar funciones necesarias
window.initializeSocket = initializeSocket;
window.emitPositionUpdate = emitPositionUpdate;