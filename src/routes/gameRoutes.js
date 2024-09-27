const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Ruta principal del juego
router.get('/', gameController.index);

// Ruta para el randomizador de huevos
router.get('/box-eggs', gameController.eggRandomizer);

module.exports = router;
