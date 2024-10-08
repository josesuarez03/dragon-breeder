const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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

const usersCollection = new  mongoose.Schema({
    userId: Number,
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    dragons: [dragonCollection], // Array de dragones del usuario
    gameState: [gameStateCollection], // Estado del juego del usuario
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
const User = mongoose.model('User', userscollection);

module.exports ={Dragon, GameState, User}
