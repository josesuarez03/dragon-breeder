const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const logger = require('morgan');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session'); 
const gameRoutes = require('../src/routes/gameRoutes');
const characterModel = require('./models/characterModel');
const {connectDB, mongoURL} = require('./config/database');
const gameModel = require('./models/gameModel');
const { initializeUserPositions, initUserCollection, initMissingField } = require('./models/usersModel');
const MongoStore = require('connect-mongo');
const passport = require('./config/passportConfig');
const User = require('./models/usersModel');
const { addAuthToLocals } = require('./middleware/authMiddleware');
const http = require('http');
const { Server } = require('socket.io');
const socketController = require('./controllers/socketController');

const app = express();
const server = http.createServer(app); // Crear servidor HTTP para socket.io
const io = new Server(server); // Crear instancia de Socket.io

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_secreto_aqui',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 // 24 horas
  },
  store: MongoStore.create({
    mongoUrl: mongoURL,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24, // 24 horas
    autoRemove: 'native',
    crypto: {
      secret: process.env.SESSION_SECRET || 'tu_secreto_aqui'
    }
  })
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findUserById(id, function(err, user) {
    done(err, user);
  });
});

app.use(addAuthToLocals);

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
    res.redirect('/game');
});

// Manejar errores 404 (página no encontrada) - Colocado después de las rutas
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'public/html', '404.html'));
});

socketController.onConnection(io);

const initializeCollections = async () => {
  await gameModel.initGameStateCollection();
  await characterModel.initDragonCollection();
  await initUserCollection();
};

// Iniciar conexión de base de datos y el servidor
const startServer = async () => {
  try {
    await connectDB();
    console.log('Connected to database successfully');

    await initializeCollections();
    console.log('Collections initialized');

    const updatedUsersCount = await initializeUserPositions();
    console.log(`${updatedUsersCount} usuarios actualizados con posiciones iniciales`);

    await initMissingField();

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
      setInterval(socketController.decrementDragonAttributes, 10000); 
    });
  } catch (err) {
    console.error('Failed to start the server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = { app, io };