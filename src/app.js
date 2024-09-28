const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const logger = require('morgan');

// Importar las rutas
const gameRoutes = require('../src/routes/gameRoutes');

const app = express();

// Configuración del logger (opcional, útil para desarrollo)
app.use(logger('dev'));

// Configuración del parser para los cuerpos de las solicitudes
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configuración del motor de plantillas EJS
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'ejs');

// Configuración de la carpeta estática para servir imágenes, estilos, etc.
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de las rutas
app.use('/', gameRoutes);

// Manejar errores 404 (página no encontrada)
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'public/html', '404.html'));
});

// Iniciar el servidor en el puerto deseado
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
