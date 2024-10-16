const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const characterController = require('../controllers/characterController')
const {isAdmin, isAuthenticated} = require('../middleware/authMiddleware');
const userController = require('../controllers/usersController');

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

//Ruta para regenerar atributos
router.post('/dragon/:id/action', gameController.regenerateAttributes);

// Ruta para combatir
/*router.get('/characters/:id/battle', characterController.battle);
router.post('/characters/:id/special-attack', characterController.specialAttack);
router.post('/characters/:id/normal-attack', characterController.normalAttack);*/

// Ruta para los usuarios
router.route('/login')
    .get(userController.login)   // Renderiza el formulario de login
    .post(userController.login); // Procesa el inicio de sesión

router.route('/register')
    .get(userController.register)   // Renderiza el formulario de registro
    .post(userController.register); // Procesa el registro      
router.post('/logout', userController.logout);       

// Rutas para editar y eliminar usuarios
router.post('/users/:id/edit', isAuthenticated, userController.edit);    //agregar authMiddleware
router.post('/users/:id/delete', isAuthenticated, userController.delete); //agregar authMiddleware

// Ruta para listar usuarios online
router.get('/online-users', isAuthenticated, userController.onlineUsers); //agregar authMiddleware

// Ruta para el dashboard de administración (listar, editar, eliminar usuarios)
router.get('/admin/dashboard',isAuthenticated, isAdmin, userController.dashboardAdmin);
router.post('/admin/users/:id/edit',isAuthenticated, isAdmin, userController.edit);   // Editar usuario
router.post('/admin/users/:id/delete',isAuthenticated, isAdmin, userController.delete); // Eliminar usuario


module.exports = router;
