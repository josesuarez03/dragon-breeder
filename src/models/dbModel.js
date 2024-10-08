const mongoose = require('mongoose')

const dragonCollection = new mongoose.Schema({
    name: String,
    hungry: Number,
    energy: Number,
    health: Number,
    speed: Number,
    strength: Number,
    agility: Number,
    intelligence: Number,
    defense: Number,
    attack: Number,
    specialAbilities: Boolean,
    availableForBattle: Boolean,
    imageUrl:  String,
    userId: mongoose.Schema.Types.ObjectId  // ID del usuario que posee el dragón
});

const gameStateCollection = new mongoose.Schema({
    characterId: Number,
    UUID: Number,
});

const users = new  mongoose.Schema({
    userId: Number,
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    dragons: [dragonCollection], // Array de dragones del usuario
    gameState: [gameStateCollection], // Estado del juego del usuario
});

const Dragon = mongoose.model('Dragon', dragonCollection);
const GameState = mongoose.model('GameState', gameStateCollection);
const User = mongoose.model('User', users);

module.exports ={Dragon, GameState, User}
