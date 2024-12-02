class GameSocketClient {
    constructor() {
        this.socket = null;
        this.currentUserId = null;
        this.currentRoom = null;
        this.myDragons = [];
        this.onlinePlayers = new Map(); // userId -> playerData
        this.gameState = {
          isPlaying: false,
          score: 0,
          timeLeft: 0
        };
        // A-Frame specific properties
        this.dragonEntity = null;
        this.gemsContainer = null;
        this.activeGems = new Map(); // gemId -> gemEntity
      }
    
      initialize(userId) {
        this.socket = io();
        this.currentUserId = userId;
        this.setupEventListeners();
        this.initializeAFrame();
        this.connect();
    }
  
  
    initialize(userId) {
      this.socket = io();
      this.currentUserId = userId;
      this.setupEventListeners();
      this.connect();
    }

    initializeAFrame() {
        // Initialize A-Frame elements
        this.dragonEntity = document.getElementById('dragon');
        this.gemsContainer = document.getElementById('gems');
        
        if (!this.dragonEntity || !this.gemsContainer) {
          console.error('Required A-Frame elements not found');
          return;
        }
  
        // Set up gem collection click listener
        document.addEventListener('click', (e) => {
          const intersected = e.target.getAttribute('gem-id');
          if (intersected) {
            this.collectGem(intersected);
          }
        });
    }
  
    connect() {
      if (this.socket && this.currentUserId) {
        this.socket.emit('user-connected', {
          userId: this.currentUserId
        });
      }
    }
  
    setupEventListeners() {
      // Conexión y reconexión
      this.socket.on('connect', () => {
        console.log('Conectado al servidor');
        this.connect();
      });
  
      this.socket.on('disconnect', () => {
        console.log('Desconectado del servidor');
        this.handleDisconnect();
      });
  
      // Inicialización
      this.socket.on('initialization', (data) => {
        this.handleInitialization(data);
      });
  
      // Eventos de usuarios
      this.socket.on('user-joined', (data) => {
        this.handleUserJoined(data);
      });
  
      this.socket.on('user-left', (userId) => {
        this.handleUserLeft(userId);
      });
  
      // Actualizaciones de dragones
      this.socket.on('dragon-update', (data) => {
        this.handleDragonUpdate(data);
      });
  
      // Actualizaciones de posición
      this.socket.on('character-position-update', (data) => {
        this.handlePositionUpdate(data);
      });
  
      // Eventos de juego
      this.socket.on('initGame', (data) => {
        this.handleGameInit(data);
        this.initializeGems(data.gems);
      });

      this.socket.on('updateScore', (data) => {
        this.handleScoreUpdate(data);
      });
  
      this.socket.on('timerUpdate', (data) => {
        this.handleTimerUpdate(data);
      });
  
      this.socket.on('gemCollected', (data) => {
        this.handleGemCollected(data);
      });
  
      this.socket.on('gameOver', (data) => {
        this.handleGameOver(data);
      });
  
      this.socket.on('playerLeft', (data) => {
        this.handlePlayerLeft(data);
      });
  
      // Manejo de errores y sesión
      this.socket.on('session-expired', (data) => {
        this.handleSessionExpired(data);
      });
  
      this.socket.on('error', (data) => {
        this.handleError(data);
      });
    }

    initializeGems(gems) {
        if (!this.gemsContainer) return;
  
        // Clear existing gems
        this.activeGems.forEach(gem => gem.remove());
        this.activeGems.clear();
  
        // Create new gems
        gems.forEach(gem => {
          const gemEntity = document.createElement('a-entity');
          gemEntity.setAttribute('position', `${gem.position.x} 1 ${gem.position.z}`);
          gemEntity.setAttribute('geometry', 'primitive: sphere');
          gemEntity.setAttribute('material', 'color: gold');
          gemEntity.setAttribute('gem-id', gem._id);
          
          this.gemsContainer.appendChild(gemEntity);
          this.activeGems.set(gem._id, gemEntity);
        });
      }
  
      removeGem(gemId) {
        const gemEntity = this.activeGems.get(gemId);
        if (gemEntity) {
          gemEntity.remove();
          this.activeGems.delete(gemId);
        }
    }
  
  
    // Manejadores de eventos
    handleInitialization(data) {
      if (data.userId === this.currentUserId) {
        this.myDragons = data.dragons;
        this.updateDragonDisplay(this.myDragons);
        
        if (data.position) {
          this.updateMyPosition(data.position);
        }
  
        // Inicializar otros usuarios en línea
        data.onlineUsers.forEach(user => {
          if (user.userId !== this.currentUserId) {
            this.onlinePlayers.set(user.userId, user);
            this.updateOtherUserPosition(user.userId, user.position);
          }
        });
      }
    }
  
    handleUserJoined(data) {
      const { userId, position } = data;
      if (userId !== this.currentUserId) {
        this.onlinePlayers.set(userId, { userId, position });
        this.updateOtherUserPosition(userId, position);
        this.showNotification(`Nuevo jugador conectado: ${userId}`);
      }
    }
  
    handleUserLeft(userId) {
      this.onlinePlayers.delete(userId);
      this.removeUserFromMap(userId);
      this.showNotification(`Jugador desconectado: ${userId}`);
    }
  
    handleDragonUpdate(data) {
      const { dragon } = data;
      const index = this.myDragons.findIndex(d => d._id === dragon._id);
      if (index !== -1) {
        this.myDragons[index] = { ...this.myDragons[index], ...dragon };
        this.updateDragonStats(this.myDragons[index]);
      }
    }
  
    handlePositionUpdate(data) {
      const { userId, position, timestamp } = data;
      if (userId !== this.currentUserId) {
        this.onlinePlayers.set(userId, { ...this.onlinePlayers.get(userId), position });
        this.updateOtherUserPosition(userId, position);
      }
    }
  
    handleGameInit(data) {
        const { gameId, gems, players } = data;
        this.gameState.isPlaying = true;
        this.currentRoom = gameId;
        
        // Initialize both 2D UI and A-Frame elements
        this.initializeGameUI(gems, players);
        this.initializeGems(gems);
    }
  
    handleScoreUpdate(data) {
        this.gameState.score = data.score;
        this.updateGameUI();
    }

    handleTimerUpdate(data) {
        this.gameState.timeLeft = data.timeLeft;
        this.updateGameUI();
    }
  
    
    handleGemCollected(data) {
        const { gemId, collectedBy, newScore } = data;
        
        // Update both 2D UI and A-Frame representation
        this.updateGemDisplay(gemId, collectedBy);
        this.removeGem(gemId);
  
        if (collectedBy === this.currentUserId) {
          this.gameState.score = newScore;
          this.updateScoreDisplay(newScore);
        }
    }

  
    handleGameOver(data) {
      const { score, players } = data;
      this.gameState.isPlaying = false;
      this.currentRoom = null;
      this.showGameResults(score, players);
    }
  
    handlePlayerLeft(data) {
      const { userId } = data;
      if (this.gameState.isPlaying) {
        this.showNotification(`Jugador ${userId} abandonó la partida`);
      }
    }
  
    handleSessionExpired(data) {
      alert(data.message);
      window.location.href = '/login';
    }
  
    handleError(data) {
      console.error('Socket error:', data.message);
      this.showErrorMessage(data.message);
    }
  
    handleDisconnect() {
      this.gameState.isPlaying = false;
      this.showNotification('Desconectado del servidor. Intentando reconectar...');
    }
  
    // Métodos de UI
    updateDragonDisplay(dragons) {
      const dragonContainer = document.querySelector('.dragon-container');
      if (!dragonContainer) return;
  
      dragonContainer.innerHTML = dragons.map(dragon => `
        <div class="dragon-card" data-id="${dragon._id}">
          <h3>${dragon.name}</h3>
          <div class="stats">
            <div class="energy">Energía: ${dragon.energy}⚡</div>
            <div class="health">Salud: ${dragon.health}❤️</div>
            <div class="hungry">Hambre: ${dragon.hungry}🍖</div>
          </div>
          <div class="status">
            ${dragon.availableForBattle ? '✅ Listo para batalla' : '❌ No disponible'}
          </div>
          <div class="stage">Etapa: ${dragon.stage}</div>
        </div>
      `).join('');
    }
  
    updateDragonStats(dragon) {
      const dragonCard = document.querySelector(`[data-id="${dragon._id}"]`);
      if (dragonCard) {
        dragonCard.querySelector('.energy').textContent = `Energía: ${dragon.energy}⚡`;
        dragonCard.querySelector('.health').textContent = `Salud: ${dragon.health}❤️`;
        dragonCard.querySelector('.hungry').textContent = `Hambre: ${dragon.hungry}🍖`;
        dragonCard.querySelector('.status').textContent = 
          dragon.availableForBattle ? '✅ Listo para batalla' : '❌ No disponible';
      }
    }
  
    updateMyPosition(position) {
      if (window.updatePlayerPosition) {
        window.updatePlayerPosition(position.x, position.y);
      }
    }
  
    updateOtherUserPosition(userId, position) {
      if (window.updateOtherPlayerPosition) {
        window.updateOtherPlayerPosition(userId, position);
      }
    }
  
    removeUserFromMap(userId) {
      if (window.removePlayer) {
        window.removePlayer(userId);
      }
    }
  
    initializeGameUI(gems, players) {
      // Implementar inicialización de UI del juego
      if (window.initializeGame) {
        window.initializeGame(gems, players);
      }
    }
  
    updateGameUI() {
        // Actualizar el score
        const scoreElement = document.getElementById('game-score');
        if (scoreElement) {
            scoreElement.textContent = `Score: ${this.gameState.score}`;
        }

        // Actualizar el timer
        const timerElement = document.getElementById('game-timer');
        if (timerElement) {
            timerElement.textContent = `Time: ${this.gameState.timeLeft}s`;
        }
    }
  
    updateGemDisplay(gemId, collectedBy) {
      const gemElement = document.querySelector(`[data-gem-id="${gemId}"]`);
      if (gemElement) {
        gemElement.classList.add('collected');
        gemElement.dataset.collectedBy = collectedBy;
      }
    }

    collectGem(gemId) {
        if (this.socket && this.currentUserId && this.currentRoom) {
          this.socket.emit('collectGem', {
            gemId,
            gameId: this.currentRoom,
            roomId: this.currentRoom
          });
        }
    }
  
    showGameResults(score, players) {
      const modal = document.createElement('div');
      modal.className = 'game-over-modal';
      modal.innerHTML = `
        <h2>¡Juego Terminado!</h2>
        <p>Puntuación final: ${score}</p>
        <button onclick="this.closeGameResults()">Cerrar</button>
      `;
      document.body.appendChild(modal);
    }
  
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
  
    // Métodos de emisión
    emitPositionUpdate(x, y) {
      if (this.socket && this.currentUserId) {
        this.socket.emit('position-update', {
          position: { x, y }
        });
      }
    }
  
    startGame() {
        // Hacer la petición al servidor para crear un nuevo juego
        fetch('/game/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: this.currentUserId,
                characterId: this.currentDragonId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Emitir evento al socket con los IDs generados
                this.socket.emit('startGame', {
                    userId: this.currentUserId,
                    roomId: data.gameState.roomId,
                    gameId: data.gameState.gameId
                });
            }
        })
        .catch(error => console.error('Error starting game:', error));
    }
  
    collectGem(gemId) {
      if (this.socket && this.currentUserId && this.currentRoom) {
        this.socket.emit('collectGem', {
          gemId,
          gameId: this.currentRoom,
          roomId: this.currentRoom
        });
      }
    }
  }
  
  // Crear instancia global
  const gameSocket = new GameSocketClient();
  
  // Exportar funciones necesarias
  window.initializeSocket = (userId) => gameSocket.initialize(userId);
  window.emitPositionUpdate = (x, y) => gameSocket.emitPositionUpdate(x, y);
  window.startGame = (roomId) => gameSocket.startGame(roomId);
  window.collectGem = (gemId) => gameSocket.collectGem(gemId);