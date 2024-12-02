const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Colección de Dragones
const dragonCollection = new mongoose.Schema({
    name: String,
    type: {
        type: String,
        enum: ['blackDragon', 'greenDragon', 'orangeDragon', 'chicken', 'dragon'],
        required: true
    },
    stage: { type: String, enum: ['egg', 'adult', 'mini'], required: true },
    hungry: { type: Number, default: 0 },
    energy: { type: Number, default: 0 },
    health: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    strength: { type: Number, default: 0 },
    agility: { type: Number, default: 0 },
    intelligence: { type: Number, default: 0 },
    defense: { type: Number, default: 0 },
    attack: { type: Number, default: 0 },
    specialAbilities: { type: Boolean, default: false },
    availableForBattle: { type: Boolean, default: false },
    imageUrl: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Colección del estado del juego (gameStateCollection)
const gameStateCollection = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    characterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dragon',
        required: true
    },
    roomId: { type: String, required: true }, // Identificador de la sala
    gameId: { type: String, required: true }, // Identificador único del juego
    uuid: { type: String, required: true }, // Identificador único del estado de juego
    gemsCollected: { type: Number, default: 0 }, // Gemas recolectadas
    score: { type: Number, default: 0 }, // Puntaje acumulado
    startTime: { type: Date, default: Date.now }, // Fecha y hora de inicio
    endTime: { type: Date }, // Fecha y hora de fin
    isCompleted: { type: Boolean, default: false } // Indica si el minijuego ha terminado
});

// Colección de usuarios (usersCollection)
const usersCollection = new mongoose.Schema({
    userId: Number,
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    dragons: { type: [dragonCollection], default: [] }, // Dragones del usuario
    gameState: { type: [gameStateCollection], default: [] }, // Estados de juegos asociados al usuario
    isOnline: { type: Boolean, default: false },
    position: {
        x: { type: Number, default: 400 }, // Posición inicial x
        y: { type: Number, default: 400 }, // Posición inicial y
        lastUpdate: { type: Date, default: Date.now }
    },
    activeCharacterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dragon' }, // Dragón activo del usuario
    puntuajes: [
        {
            puntuaje: { type: Number, required: true }, // Puntaje obtenido
            date: { type: Date, default: Date.now },  // Fecha de registro
            juego: { type: String, required: true }   // Nombre del juego
        }
    ]
});

// Colección para las gemas (GemModel)
const gemCollection = new mongoose.Schema({
    position: { 
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        z: { type: Number, required: true }
    }, // Posición en el mundo 3D
    collected: { type: Boolean, default: false }, // Estado de recolección
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GameState',
        required: true
    } // Relación con el estado del juego
});

// Middleware para hashear la contraseña antes de guardar el usuario
usersCollection.pre('save', async function (next) {
    const user = this;

    // Si la contraseña no ha sido modificada, continuar
    if (!user.isModified('password')) return next();

    try {
        // Hashear la contraseña con bcrypt
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt); // Hashear y asignar el hash
        next(); // Continuar con la operación de guardado
    } catch (err) {
        return next(err); // Manejar cualquier error en el proceso de hasheo
    }
});

// Método para comparar la contraseña ingresada con la almacenada (hash)
usersCollection.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Método para actualizar la posición del usuario
usersCollection.methods.updatePosition = async function (x, y) {
    this.position.x = Math.min(Math.max(x, 0), 800);
    this.position.y = Math.min(Math.max(y, 0), 800);
    this.position.lastUpdate = new Date();
    return await this.save();
};

// Middleware para asegurar que activeCharacterId no sea nulo
usersCollection.methods.updateMissingField = async function () {
    if (this.activeCharacterId === undefined) {
        this.activeCharacterId = null;
        await this.save();
    }
};

// Índice para búsquedas por posición
usersCollection.index({ 'position.x': 1, 'position.y': 1 });

// Crear los modelos
const Dragon = mongoose.model('Dragon', dragonCollection);
const GameState = mongoose.model('GameState', gameStateCollection);
const User = mongoose.model('User', usersCollection);
const Gem = mongoose.model('Gem', gemCollection);

module.exports = { Dragon, GameState, User, Gem };
