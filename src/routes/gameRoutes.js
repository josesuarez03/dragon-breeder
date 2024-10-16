const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const characterController = require('../controllers/characterController')
const {isAdmin, isAuthenticated} = require('../middleware/authMiddleware');
const userController = require('../controllers/usersController');

// Ruta principal del juego
router.get('/', gameController.view);
// Rutas del juego 
router.get('/game', isAuthenticated, gameController.view);
router.get('/game/select', isAuthenticated, gameController.select);
router.post('/game/select', isAuthenticated, gameController.chooseCharacter);

// Ruta para el randomizador de huevos 
router.get('/box-eggs', isAuthenticated, gameController.eggRandomizer);

// Ruta para cambiar de dragón 
router.get('/swap-dragon', isAuthenticated, gameController.swapDragon);
router.post('/swap-dragon', isAuthenticated, gameController.selectDragon);

// CRUD de personajes 
router.get('/characters', isAuthenticated, characterController.index);
router.get('/characters/new', isAuthenticated, characterController.create);
router.post('/characters', isAuthenticated, characterController.store);
router.get('/characters/:id/edit', isAuthenticated, characterController.edit);
router.post('/characters/:id/update', isAuthenticated, characterController.update);
router.post('/characters/:id/delete', isAuthenticated, characterController.delete);

// Ruta para regenerar atributos del dragón 
router.post('/dragon/:id/action', isAuthenticated, gameController.regenerateAttributes);

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
        
router.route('/logout')
    .get(userController.logout)
    .post(userController.logout);     

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
