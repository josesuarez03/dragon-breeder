const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const characterController = require('../controllers/characterController')

// Ruta principal del juego
router.get('/', gameController.view);
router.get('/game', gameController.view);
router.get('/game/select', gameController.select);
router.post('/game/select', gameController.chooseCharacter);

// Ruta para el randomizador de huevos
router.get('/box-eggs', gameController.eggRandomizer);

// Ruta para cambiar de dragón
router.get('/swap-dragon', gameController.swapDragon);
router.post('/swap-dragon', gameController.selectDragon);

// CRUD routes for characters
router.get('/characters', characterController.index);
router.get('/characters/new', characterController.create);
router.post('/characters', characterController.store);
router.get('/characters/:id/edit', characterController.edit);
router.post('/characters/:id/update', characterController.update);
router.post('/characters/:id/delete', characterController.delete);



module.exports = router;
