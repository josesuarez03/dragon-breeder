const characterModel = require('../models/characterModel');
const gameModel = require('../models/gameModel');

// Mostrar la página de selección de personajes
exports.select = (req, res) => {
    const characters = characterModel.getAllCharacters();
    res.render('characters/select', { characters });
};

// Manejar la selección de un personaje para el juego
exports.chooseCharacter = (req, res) => {
    const gameState = gameModel.getGameState();
    gameState.characterId = parseInt(req.body.characterId);
    gameModel.saveGameState(gameState);
    res.redirect('/game');
};

// Mostrar la vista del juego
exports.view = (req, res) => {
    const gameState = gameModel.getGameState();
    const character = characterModel.findCharacterById(gameState.characterId);
    res.render('game', { character });
};

// Actualizar el nivel de energía dinámicamente (REST API)
exports.updateEnergy = (req, res) => {
    const gameState = gameModel.getGameState();
    const character = characterModel.findCharacterById(gameState.characterId);

    const action = req.body.action;

    switch (action) {
        case 'feed': // Dar de comer
            character.energyLevel = Math.min(100, character.energyLevel + 10); // Aumentar el nivel de energía
            break;
        case 'play': // Jugar
            character.energyLevel = Math.max(0, character.energyLevel - 10); // Reducir el nivel de energía
            break;
        default:
            return res.status(400).json({ message: 'Acción no válida' });
    }

    characterModel.saveCharacter(character); // Guardar el estado actualizado del personaje
    res.json({ energyLevel: character.energyLevel }); // Responder con el nuevo nivel de energía
};

exports.index = (req, res) => {
    // Aquí verificamos si hay un personaje seleccionado
    const selectedCharacter = req.session.selectedCharacter; // Suponemos que el personaje se almacena en la sesión

    if (!selectedCharacter) {
        // Si no hay personaje, redirigimos al randomizador de huevos
        return res.redirect('/box-eggs');
    }

    // Si hay un personaje, mostramos la vista principal del juego
    res.render('game', {
        title: 'Dragon Breeder Game',
        character: selectedCharacter
    });
};

exports.eggRandomizer = (req, res) => {
    const egg = getRandomEgg(); // Función que selecciona un huevo aleatorio
    res.render('characters/box-eggs', { egg });
};

// Función para seleccionar un huevo al azar
function getRandomEgg() {
    const random = Math.random() * 100;

    if (random <= 25) {
        return 'blackDragon';  // Dragón negro
    } else if (random <= 50) {
        return 'greenDragon';  // Dragón verde
    } else if (random <= 75) {
        return 'orangeDragon'; // Dragón naranja
    } else {
        return 'chicken';      // Gallina
    }
}

exports.swapDragon = (req, res) => {
    // Supongamos que los dragones del usuario están almacenados en la sesión (podría estar en la base de datos)
    const userDragons = req.session.userDragons || [];

    // Si el usuario no tiene dragones, redirigimos al randomizador
    if (userDragons.length === 0) {
        return res.redirect('/box-eggs');
    }

    // Mostrar la página con los dragones disponibles
    res.render('characters/swap-dragon', { userDragons });
};

exports.selectDragon = (req, res) => {
    const selectedDragon = req.body.dragon; // Obtenemos el dragón seleccionado del formulario

    // Guardamos el dragón seleccionado en la sesión como el dragón activo
    req.session.selectedCharacter = selectedDragon;

    // Redirigimos a la página principal o donde sea necesario
    res.redirect('/');
};

