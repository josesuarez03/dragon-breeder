const characterModel = require('../models/characterModel');
const gameModel = require('../models/gameModel');


exports.select = (req, res) => {
    const characters = characterModel.getAllCharacters();
    res.render('characters/select', { characters });
};


exports.chooseCharacter = (req, res) => {
    const gameState = gameModel.getGameState();
    gameState.characterId = parseInt(req.body.characterId);
    gameModel.saveGameState(gameState);
    res.redirect('/game');
};


exports.view = (req, res) => {
    const gameState = gameModel.getGameState();
    const character = characterModel.findDragonById(gameState.characterId); 
    res.render('game', { character });
};

exports.index = (req, res) => {
    const selectedCharacter = req.session.selectedCharacter;

    if (!selectedCharacter) {
        return res.redirect('/box-eggs');
    }

    res.render('game', {
        title: 'Dragon Breeder Game',
        character: selectedCharacter
    });
};

// Randomizador de huevos
exports.eggRandomizer = (req, res) => {
    const egg = getRandomEgg(); 
    res.render('characters/box-eggs', { egg });
};

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

exports.breed = (req, res) => {
    const dragon1Id = parseInt(req.body.dragon1Id);
    const dragon2Id = parseInt(req.body.dragon2Id);

    const newEgg = characterModel.breedDragons(dragon1Id, dragon2Id);
    if (newEgg) {
        res.json({ message: 'New egg created', egg: newEgg });
    } else {
        res.status(400).json({ message: 'Unable to breed dragons' });
    }
};

exports.hatchEgg = (req, res) => {
    const eggId = parseInt(req.body.eggId);
    const newDragon = characterModel.hatchEgg(eggId);
    
    if (newDragon) {
        res.json({ message: 'Egg hatched!', dragon: newDragon });
    } else {
        res.status(400).json({ message: 'The egg did not hatch' });
    }
};


exports.evolveDragon = (req, res) => {
    const dragonId = parseInt(req.body.dragonId);
    const evolvedDragon = characterModel.evolveMiniDragon(dragonId);

    if (evolvedDragon) {
        res.json({ message: 'Mini dragon evolved!', dragon: evolvedDragon });
    } else {
        res.status(400).json({ message: 'Unable to evolve mini dragon' });
    }
};


exports.regenerateAttributes = (req, res) => {
    const dragonId = parseInt(req.body.dragonId);
    const action = req.body.action; 

    const updatedDragon = characterModel.regenerateDragonAttributes(dragonId, action);
    if (updatedDragon) {
        res.json({ message: 'Dragon attributes updated!', dragon: updatedDragon });
    } else {
        res.status(400).json({ message: 'Unable to update dragon attributes' });
    }
};


exports.openMysteryBox = (req, res) => {
    const newDragon = characterModel.openMysteryBox();
    res.json({ message: 'You received a new dragon!', dragon: newDragon });
};


exports.swapDragon = (req, res) => {
    const userDragons = req.session.userDragons || [];

    if (userDragons.length === 0) {
        return res.redirect('/box-eggs');
    }

    res.render('characters/swap-dragon', { userDragons });
};

exports.selectDragon = (req, res) => {
    const selectedDragon = req.body.dragon;

    req.session.selectedCharacter = selectedDragon;

    res.redirect('/');
};
