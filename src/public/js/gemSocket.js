// gemCollectorSocket.js - Cliente socket específico para el minijuego
import BaseSocketClient from './baseSocket.js';

class GemCollectorSocket extends BaseSocketClient {
    constructor() {
        super();
        this.gameState = {
            isPlaying: false,
            score: 0,
            timeLeft: 0
        };
        this.gemSpawnInterval = null;
        this.maxGemsOnScreen = 5;
        this.activeGems = new Map(); // gemId -> gemEntity
        
        // A-Frame references
        this.playerCamera = null;
        this.gemsContainer = null;
    }

    initialize(userId) {
        super.initialize(userId);
        this.setupGameEventListeners();
        this.initializeAFrame();
    }

    initializeAFrame() {
        this.playerCamera = document.getElementById('player-camera');
        this.gemsContainer = document.getElementById('gems');
        
        if (!this.playerCamera || !this.gemsContainer) {
            console.error('Required A-Frame elements not found');
            return;
        }

        const scene = document.querySelector('a-scene');
        scene.setAttribute('physics', '');
    }

    setupGameEventListeners() {
        // Eventos específicos del juego
        this.socket.on('gameInit', (data) => this.handleGameInit(data));
        this.socket.on('updateScore', (data) => this.handleScoreUpdate(data));
        this.socket.on('timerUpdate', (data) => this.handleTimerUpdate(data));
        this.socket.on('gemCollected', (data) => this.handleGemCollected(data));
        this.socket.on('gemSpawned', (data) => this.handleGemSpawned(data));
        this.socket.on('gameOver', (data) => this.handleGameOver(data));
    }

    // Gestión de gemas
    createGem(position) {
        const gemEntity = document.createElement('a-entity');
        const gemId = `gem-${Date.now()}-${Math.random()}`;
        
        gemEntity.setAttribute('position', position);
        gemEntity.setAttribute('geometry', {
            primitive: 'sphere',
            radius: 0.3
        });
        gemEntity.setAttribute('material', {
            color: 'gold',
            metalness: 0.8,
            roughness: 0.2
        });
        gemEntity.setAttribute('gem-id', gemId);
        gemEntity.setAttribute('physics-body', 'static');
        
        gemEntity.setAttribute('animation', {
            property: 'rotation',
            dur: 3000,
            loop: true,
            to: '0 360 0'
        });

        this.gemsContainer.appendChild(gemEntity);
        this.activeGems.set(gemId, gemEntity);
        
        return gemId;
    }

    spawnRandomGem() {
        if (this.activeGems.size >= this.maxGemsOnScreen) return;

        const position = {
            x: (Math.random() * 40 - 20).toFixed(2),
            y: 1,
            z: (Math.random() * 40 - 20).toFixed(2)
        };

        const gemId = this.createGem(`${position.x} ${position.y} ${position.z}`);
        
        this.socket.emit('gemSpawned', {
            gemId,
            position,
            roomId: this.currentRoom
        });
    }

    // Controladores de eventos del juego
    handleGameInit(data) {
        const { gameId, timeLeft } = data;
        this.gameState.isPlaying = true;
        this.currentRoom = gameId;
        this.gameState.timeLeft = timeLeft;
        
        this.startGemSpawning();
        this.updateGameUI();
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
        
        if (collectedBy === this.currentUserId) {
            this.gameState.score = newScore;
        }
        
        this.removeGem(gemId);
    }

    handleGemSpawned(data) {
        const { gemId, position } = data;
        if (!this.activeGems.has(gemId)) {
            this.createGem(`${position.x} ${position.y} ${position.z}`);
        }
    }

    handleGameOver(data) {
        const { score, players } = data;
        this.gameState.isPlaying = false;
        this.currentRoom = null;
        
        this.stopGemSpawning();
        this.clearAllGems();
        this.showGameResults(score, players);
    }

    // Gestión del juego
    startGemSpawning() {
        if (this.gemSpawnInterval) {
            clearInterval(this.gemSpawnInterval);
        }

        this.gemSpawnInterval = setInterval(() => {
            this.spawnRandomGem();
        }, 2000);
    }

    stopGemSpawning() {
        if (this.gemSpawnInterval) {
            clearInterval(this.gemSpawnInterval);
            this.gemSpawnInterval = null;
        }
    }

    clearAllGems() {
        this.activeGems.forEach((gem, gemId) => {
            this.removeGem(gemId);
        });
    }

    removeGem(gemId) {
        const gemEntity = this.activeGems.get(gemId);
        if (gemEntity) {
            gemEntity.parentNode.removeChild(gemEntity);
            this.activeGems.delete(gemId);

            if (this.gameState.isPlaying && this.activeGems.size < this.maxGemsOnScreen) {
                this.spawnRandomGem();
            }
        }
    }

    // UI
    updateGameUI() {
        const scoreElement = document.getElementById('game-score');
        if (scoreElement) {
            scoreElement.textContent = `Score: ${this.gameState.score}`;
        }

        const timerElement = document.getElementById('game-timer');
        if (timerElement) {
            timerElement.textContent = `Time: ${this.gameState.timeLeft}s`;
        }
    }

    showGameResults(score, players) {
        const modal = document.createElement('div');
        modal.className = 'game-over-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>¡Juego Terminado!</h2>
                <p>Puntuación final: ${score}</p>
                <button onclick="this.parentElement.remove()">Cerrar</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Métodos públicos
    startGame() {
        fetch('/game/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: this.currentUserId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
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

export default GemCollectorSocket;