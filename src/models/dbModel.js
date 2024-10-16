const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const dragonCollection = new mongoose.Schema({
    name: String,
    type: {
        type: String,
        enum: ['blackDragon', 'greenDragon', 'orangeDragon', 'chicken', 'dragon'],
        required: true
    },
    stage: {type: String, enum: ['egg', 'adult', 'mini'], required: true},
    hungry: {type: Number, default: 0},
    energy: {type: Number, default: 0},
    health: {type: Number, default: 0 },
    speed: {type: Number, default: 0},
    strength: {type: Number, default: 0},
    agility: {type: Number, default: 0},
    intelligence: {type: Number, default: 0},
    defense: { type: Number, default: 0},
    attack: {type: Number, default: 0},
    specialAbilities: { type: Boolean, default: false},
    availableForBattle: {type: Boolean ,default: false},
    imageUrl:  String,
    userId: mongoose.Schema.Types.ObjectId  // ID del usuario que posee el dragón
});

const gameStateCollection = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    characterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dragon'
    },
    uuid: String
});

const usersCollection = new  mongoose.Schema({
    userId: Number,
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    dragons: [dragonCollection], // Array de dragones del usuario
    gameState: [gameStateCollection], // Estado del juego del usuario
    isOnline: {type: Boolean, default: false}
});

// Middleware para hashear la contraseña antes de guardar el usuario
usersCollection.pre('save', async function (next) {
    const user = this;

    // Si la contraseña no ha sido modificada, continuar
    if (!user.isModified('password')) return next();

    try {
        // Hashear la contraseña con bcrypt
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);  // Hashear y asignar el hash
        next();  // Continuar con la operación de guardado
    } catch (err) {
        return next(err);  // Manejar cualquier error en el proceso de hasheo
    }
});

// Método para comparar la contraseña ingresada con la almacenada (hash)
usersCollection.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const Dragon = mongoose.model('Dragon', dragonCollection);
const GameState = mongoose.model('GameState', gameStateCollection);
const User = mongoose.model('User', usersCollection);

module.exports ={Dragon, GameState, User}
