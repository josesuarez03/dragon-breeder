const express = require('express');
const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');
const characterController = require('./controllers/characterController');
const gameController = require('./controllers/gameController'); 
const { saveCharacters } = require('./models/characterModel');
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Permitir JSON en el cuerpo de las solicitudes
app.use(express.static('public'));


if (!saveCharacters){
    app.get('/', (req, res) => {
        const selectedEgg = getRandomEgg();
        res.render('box-eggs', {selectedEgg});
    });
}

// Root route
app.get('/', (req, res) => {
    res.redirect('/game');
});

// CRUD routes for characters
app.get('/characters', characterController.index);
app.get('/characters/new', characterController.create);
app.post('/characters', characterController.store);
app.get('/characters/:id/edit', characterController.edit);
app.post('/characters/:id/update', characterController.update);
app.post('/characters/:id/delete', characterController.delete);

// Game routes
app.get('/game', gameController.view);
app.get('/game/select', gameController.select);
app.post('/game/select', gameController.chooseCharacter);
app.put('/game/update', gameController.updateEnergy); 


function getRandomEgg(){
    const random = Math.random() * 100;

    if (random <= 10) {
        return 1; // Huevo raro (10%)
    } else if (random <= 40) {
        return 2; // Huevo común (30%)
    } else if (random <= 75) {
        return 3; // Huevo común (30%)
    } else {
        return 4; // Huevo común (30%)
    }
}

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
