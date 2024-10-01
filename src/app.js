const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const logger = require('morgan');
const expressLayouts = require('express-ejs-layouts');
const gameRoutes = require('../src/routes/gameRoutes');

const app = express();

app.use(logger('dev'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configuración del motor de plantillas EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'index');

// Configuración de la carpeta estática para servir imágenes, estilos, etc.
app.use(express.static(path.join(__dirname, 'public')));


// Configuración de las rutas
app.use('/', gameRoutes);

// Manejar errores 404 (página no encontrada)
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'public/html', '404.html'));
});

app.post('/game/select', (req, res) => {
    const characterId = req.body.characterId;
    // Aquí puedes guardar el personaje seleccionado en una sesión o en una variable global
    req.session.selectedCharacter = characterId;
    res.redirect('/'); // Redirige al index
});

// Iniciar el servidor en el puerto deseado
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
