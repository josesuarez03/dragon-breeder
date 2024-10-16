const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const logger = require('morgan');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session'); // Asegúrate de instalar este paquete
const gameRoutes = require('../src/routes/gameRoutes');
const characterModel = require('./models/characterModel');
const {connectDB, mongoURL} = require('./config/database');
const gameModel = require('./models/gameModel');
const usersModel = require('./models/usersModel');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

const app = express();

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

console.log(mongoURL)

// Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_secreto_aqui',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60000
  },
  store: MongoStore.create({
    mongoUrl: mongoURL,
    collectionName: 'sessions'
  })
}));

// Configuración del motor de plantillas EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'index');

// Configuración de la carpeta estática
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de las rutas
app.use('/', gameRoutes);

app.post('/game/select', (req, res) => {
    const characterId = req.body.characterId;
    req.session.selectedCharacter = characterId;
    res.redirect('/');
});

// Manejar errores 404 (página no encontrada) - Colocado después de las rutas
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'public/html', '404.html'));
});

// Función para decrementar atributos de dragones
const decrementDragonAttributes = () => {
    characterModel.decrementDragonAttributes()
        .catch(err => console.error('Error decrementing dragon attributes:', err));
};

const initializeCollections = async () => {
  await gameModel.initGameStateCollection();
  await characterModel.initDragonCollection();
  await usersModel.initUserCollection();
};

const startServer = async () => {
  try {
    await connectDB();
    console.log('Connected to database successfully');

    await initializeCollections();
    console.log('Collections initialized');

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      setInterval(decrementDragonAttributes, 10000);
    });
  } catch (err) {
    console.error('Failed to start the server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;