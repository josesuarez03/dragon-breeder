const characterModel = require('../models/characterModel');
const gameModel = require('../models/gameModel');


exports.select = async (req, res) => {
    try {
        const characters = await characterModel.getAllCharacters(); // Asegúrate de usar await
        res.render('characters/select', { characters });
    } catch (error) {
        res.status(500).send('Error al seleccionar personajes');
    }
};


exports.chooseCharacter = async (req, res) => {
    try {
        const gameState = await gameModel.getGameState();  // Asegúrate de usar await
        gameState.characterId = parseInt(req.body.characterId);
        await gameModel.saveGameState(gameState);  // Guardar estado del juego
        res.redirect('/game');
    } catch (error) {
        res.status(500).send('Error al seleccionar el personaje');
    }
};


exports.view = async (req, res) => {
    try {
        const gameState = await gameModel.getGameState();  // Usar await
        const character = await characterModel.findCharacterById(gameState.characterId);
        res.render('game', { character });
    } catch (error) {
        res.status(500).send('Error al cargar el juego');
    }
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

exports.breed = async (req, res) => {
    try {
        const dragon1Id = parseInt(req.body.dragon1Id);
        const dragon2Id = parseInt(req.body.dragon2Id);

        const newEgg = await characterModel.breedDragons(dragon1Id, dragon2Id); // Llamar a la función asíncrona
        if (newEgg) {
            res.json({ message: 'New egg created', egg: newEgg });
        } else {
            res.status(400).json({ message: 'Unable to breed dragons' });
        }
    } catch (error) {
        res.status(500).send('Error al reproducir dragones');
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

        case 'evolve':
            const evolvedDragon = characterModel.evolveDragon(dragonId);
            if (evolvedDragon) {
                return res.json({ message: 'Dragón evolucionado', dragon: evolvedDragon });
            } else {
                return res.status(400).json({ message: 'No se pudo evolucionar el dragón.' });
            }
            
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


exports.openMysteryBox = async (req, res) => {
    try {
        const newDragon = await characterModel.openMysteryBox();  // Usar await
        res.json({ message: 'You received a new dragon!', dragon: newDragon });
    } catch (error) {
        res.status(500).send('Error al abrir la caja misteriosa');
    }
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


