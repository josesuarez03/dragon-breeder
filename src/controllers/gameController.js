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
    const character = characterModel.findCharacterById(gameState.characterId); 
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
    res.render('box-eggs', { egg });
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
    const dragonId = parseInt(req.params.id);  
    const action = req.body.action;  

    let updatedDragon;
    switch (action) {
        case 'feed':
            updatedDragon = characterModel.regenerateDragonAttributes(dragonId, 'feed');
            if (updatedDragon) {
                return res.json({ message: 'Dragon alimentado', dragon: updatedDragon });
            }
            break;
        case 'heal':
            updatedDragon = characterModel.regenerateDragonAttributes(dragonId, 'heal');
            if (updatedDragon) {
                return res.json({ message: 'Dragon curado', dragon: updatedDragon });
            }
            break;

        case 'train':
            const dragonToTrain = characterModel.findCharacterById(dragonId); 
            if (dragonToTrain) {
                characterModel.trainDragon(dragonToTrain); 
                return res.json({ message: 'Dragon entrenado', dragon: dragonToTrain });
            }
            break; 
        case 'battle':
            const dragon = characterModel.findCharacterById(dragonId);
            if (dragon && dragon.availableForBattle) {
                // Aquí puedes añadir lógica adicional para la batalla
                return res.json({ message: 'Batalla iniciada', dragon: dragon });
            } else {
                return res.status(400).json({ message: 'El dragón no está listo para la batalla' });
            }
        default:
            return res.status(400).json({ message: 'Acción no reconocida' });
    }

    // Si el dragón no pudo ser actualizado por alguna razón
    return res.status(400).json({ message: 'No se pudo realizar la acción' });
};


exports.openMysteryBox = (req, res) => {
    const newDragon = characterModel.openMysteryBox();
    res.json({ message: 'You received a new dragon!', dragon: newDragon });
};


exports.swapDragon = (req, res) => {
    if (!req.session) {
      req.session = {};
    }
  
    if (!req.session.userDragons) {
      req.session.userDragons = [];
    }
  
    const userDragons = req.session.userDragons;
  
    if (userDragons.length === 0) {
      return res.redirect('/box-eggs');
    }
  
    res.render('swap-dragon', { userDragons });
};

exports.createDragon = (req, res) => {
    const newDragon = {
      // ...
    };
  
    if (!req.session.userDragons) {
      req.session.userDragons = [];
    }
  
    req.session.userDragons.push(newDragon);
  
    res.redirect('/swap-dragon');
  };

exports.selectDragon = (req, res) => {
    const selectedDragon = req.body.dragon;

    req.session.selectedCharacter = selectedDragon;

    res.redirect('/game');
};


