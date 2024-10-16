const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { findUserByUsername, findUserById } = require('../models/usersModel')

passport.use(new LocalStrategy({
    usernameField: 'username',  // Campo de nombre de usuario en el formulario
    passwordField: 'password'   // Campo de contraseña en el formulario
  },
  async (username, password, done) => {
    try {
      // Buscar el usuario por nombre de usuario
      const user = await findUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Usuario no encontrado' });
      }

      // Usar el método comparePassword para verificar la contraseña
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return done(null, false, { message: 'Contraseña incorrecta' });
      }

      // Si las credenciales son correctas, devolver el usuario
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Serialización y deserialización del usuario
passport.serializeUser((user, done) => {
  done(null, user._id);  // Guardar el ID del usuario en la sesión
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserById(id);  // Implementa esto en tu modelo
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
