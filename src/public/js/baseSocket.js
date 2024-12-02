class BaseSocketClient {
    constructor() {
        this.socket = null;
        this.currentUserId = null;
        this.currentRoom = null;
        this.onlinePlayers = new Map(); // userId -> playerData
    }

    initialize(userId) {
        this.socket = io();
        this.currentUserId = userId;
        this.setupBaseEventListeners();
        this.connect();
    }

    connect() {
        if (this.socket && this.currentUserId) {
            this.socket.emit('user-connected', {
                userId: this.currentUserId
            });
        }
    }

    setupBaseEventListeners() {
        // Conexión y reconexión
        this.socket.on('connect', () => {
            console.log('Conectado al servidor');
            this.connect();
        });

        this.socket.on('disconnect', () => {
            console.log('Desconectado del servidor');
            this.handleDisconnect();
        });

        // Eventos de usuarios
        this.socket.on('user-joined', (data) => {
            this.handleUserJoined(data);
        });

        this.socket.on('user-left', (userId) => {
            this.handleUserLeft(userId);
        });

        // Manejo de errores y sesión
        this.socket.on('session-expired', (data) => {
            this.handleSessionExpired(data);
        });

        this.socket.on('error', (data) => {
            this.handleError(data);
        });
    }

    // Manejadores base
    handleUserJoined(data) {
        const { userId, position } = data;
        if (userId !== this.currentUserId) {
            this.onlinePlayers.set(userId, { userId, position });
            this.showNotification(`Nuevo jugador conectado: ${userId}`);
        }
    }

    handleUserLeft(userId) {
        this.onlinePlayers.delete(userId);
        this.showNotification(`Jugador desconectado: ${userId}`);
    }

    handleDisconnect() {
        this.showNotification('Desconectado del servidor. Intentando reconectar...');
    }

    handleSessionExpired(data) {
        alert(data.message);
        window.location.href = '/login';
    }

    handleError(data) {
        console.error('Socket error:', data.message);
        this.showErrorMessage(data.message);
    }

    // Utilidades UI
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }
}

export default BaseSocketClient;