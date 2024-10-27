const characterModel = require('../models/characterModel');
const gameModel = require('../models/gameModel');
const { findUserById } = require('../models/usersModel');
const mongoose = require('mongoose')


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
        const dragonId = req.body.characterId;
        const userId = req.session.userId;

        // Actualizar el gameState con el nuevo characterId
        await gameModel.updateGameState(userId, { characterId: dragonId });

        // Obtener el dragón seleccionado
        const selectedDragon = await characterModel.findCharacterById(dragonId);

        // Redirigir a la página del juego con el dragón seleccionado
        res.redirect('/game');
    } catch (error) {
        console.error('Error al seleccionar el dragón:', error);
        res.status(500).send('Error al seleccionar el dragón');
    }
};

exports.startGame = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.render('startGame', { 
                isAuthenticated: false, 
                hasCharacter: false,
                layout: false 
            });
        }

        // Verificar si el usuario tiene un estado de juego
        const gameState = await gameModel.getGameState(req.session.userId);
        const hasCharacter = gameState && gameState.characterId;

        res.render('startGame', {
            isAuthenticated: true,
            hasCharacter: !!hasCharacter,
            layout: false
        });
    } catch (error) {
        console.error('Error al cargar la página de inicio:', error);
        res.status(500).send('Error al cargar la página de inicio');
    }
};

// Actualizar el método view para manejar mejor las redirecciones
exports.view = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/');
        }

        const userId = req.session.userId;
        const gameState = await gameModel.getGameState(userId);

        if (!gameState || !gameState.characterId) {
            return res.redirect('/box-eggs');
        }

        const character = await characterModel.findCharacterById(gameState.characterId);
        if (!character) {
            return res.redirect('/box-eggs');
        }

        res.render('game', { 
            gameState, 
            character,
            isAuthenticated: true
        });
    } catch (error) {
        console.error('Error al cargar el juego:', error);
        res.status(500).send('Error al cargar el juego');
    }
};

exports.index = async (req, res) => {
    if (!req.session.userId){
        return res.redirect('/login');
    }
    try {
        const user = await findUserById(req.session.userId);
        const gameState = await gameModel.getGameState(req.session.userId);
        const dragons = await characterModel.getAllCharacters(req.session.userId);

        if (dragons.length === 0) {
            return res.redirect('/box-eggs');
        }
        // Obtener el personaje activo del gameState
        let character = null;
        if (gameState && gameState.characterId) {
            character = await characterModel.findCharacterById(gameState.characterId);
        } else if (dragons.length > 0) {
            // Si no hay personaje activo pero hay dragones, usar el primero
            character = dragons[0];
            // Actualizar el gameState con este dragón
            await gameModel.updateGameState(req.session.userId, { characterId: character._id });
        }

        res.render('game', {
            title: 'Dragon Breeder Game',
            user,
            gameState,
            dragons,
            character // Añadimos el character a la vista
        });
    } catch (error) {
        console.error('Error loading game:', error);
        res.status(500).send('Error al cargar el juego');
    }
};

exports.register = (req, res) => {
    res.render('register');
};

exports.createUser = async (req, res) => {
    try {
        const userData = req.body;
        const newUser = await usersModel.createUser(userData);
        req.session.userId = newUser._id;
        await gameModel.createGameState(newUser._id);
        res.redirect('/create-dragon');
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('Error al crear el usuario');
    }
};

exports.saveDragon = async (req, res) => {
    try {
        const dragonData = {
            ...req.body,
            userId: req.session.userId
        };
        await characterModel.createDragon(dragonData);
        res.redirect('/');
    } catch (error) {
        console.error('Error saving dragon:', error);
        res.status(500).send('Error al guardar el dragón');
    }
};

// Randomizador de huevos
exports.eggRandomizer = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).send('Usuario no autenticado');
        }

        // Obtener el tipo de huevo aleatorio
        const eggType = characterModel.getRandomEgg();

        // Crear el nuevo huevo y asociarlo al usuario
        const newEgg = await characterModel.createEgg(eggType, userId);

        if (!newEgg) {
            throw new Error('No se pudo crear el huevo');
        }

        // Actualizar el gameState con el nuevo characterId
        await gameModel.updateGameState(userId, {
            characterId: newEgg._id
        });

        // Actualizar el usuario con el nuevo dragón
        await usersModel.updateUser(userId, {
            $push: { dragons: newEgg._id }
        });

        res.render('box-eggs', { egg: newEgg });
    } catch (error) {
        console.error('Error al crear el huevo:', error);
        res.status(500).send('Error al crear el huevo:'  + error.message);

    }
};

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

exports.regenerateAttributes = async (req, res) => {
    try {
        
        const dragonId = new mongoose.Types.ObjectId(req.params.id);
        const action = req.body.action;

        let updatedDragon;

        switch (action) {
            case 'feed':
                updatedDragon = await characterModel.regenerateDragonAttributes(dragonId, 'feed');
                if (updatedDragon) {
                    return res.json({ message: 'Dragón alimentado', dragon: updatedDragon });
                }
                break;
            case 'heal':
                updatedDragon = await characterModel.regenerateDragonAttributes(dragonId, 'heal');
                if (updatedDragon) {
                    return res.json({ message: 'Dragón curado', dragon: updatedDragon });
                }
                break;
            case 'train':
                const dragonToTrain = await characterModel.findCharacterById(dragonId); 
                if (dragonToTrain) {
                    await characterModel.trainDragon(dragonToTrain); 
                    return res.json({ message: 'Dragón entrenado', dragon: dragonToTrain });
                }
                break;
            case 'evolve':
                const evolvedDragon = await characterModel.evolveDragon(dragonId);
                if (evolvedDragon) {
                    return res.json({ message: 'Dragón evolucionado', dragon: evolvedDragon });
                } else {
                    return res.status(400).json({ message: 'No se pudo evolucionar el dragón.' });
                }
            case 'battle':
                const dragon = await characterModel.findCharacterById(dragonId);
                if (dragon && dragon.availableForBattle) {
                    return res.json({ message: 'Batalla iniciada', dragon });
                } else {
                    return res.status(400).json({ message: 'El dragón no está listo para la batalla' });
                }
            default:
                return res.status(400).json({ message: 'Acción no reconocida' });
        }
    } catch (error) {
        console.error('Error al actualizar los atributos del dragón:', error);
        return res.status(500).json({ message: 'Error al actualizar los atributos del dragón', error });
    }
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


