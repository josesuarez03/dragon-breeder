// authMiddleware.js
function isAuthenticated(req, res, next) {
    // Verificar si existe la sesión y el userId
    if (req.session && req.session.userId) {
        // Verificar si la sesión no ha expirado
        if (req.session.cookie.expires && req.session.cookie.expires < Date.now()) {
            return res.redirect('/login?expired=true');
        }
        console.log('Usuario autenticado:', req.session.userId);
        return next();
    }
    
    // Guardar la URL original para redireccionar después del login
    req.session.returnTo = req.originalUrl;
    console.log('Usuario no autenticado, redirigiendo a login');
    res.redirect('/login');
}

function isAdmin(req, res, next) {
    if (req.session && req.session.userId && req.session.userRole === true) {
        console.log('Usuario admin autorizado');
        return next();
    }
    console.log('Acceso no autorizado a área admin');
    res.status(401).redirect('/');
}

function addAuthToLocals(req, res, next) {
    // Añadir información de autenticación a las variables locales
    res.locals.isAuthenticated = !!(req.session && req.session.userId);
    res.locals.isAdmin = !!(req.session && req.session.userRole === true);
    res.locals.userId = req.session ? req.session.userId : null;
    next();
}

// Nuevo middleware para verificar la sesión
function checkSession(req, res, next) {
    if (req.session && req.session.userId) {
        // Renovar la sesión
        req.session.touch();
        // Actualizar la última actividad
        req.session.lastActivity = Date.now();
    }
    next();
}

module.exports = { 
    isAuthenticated, 
    isAdmin, 
    addAuthToLocals,
    checkSession 
};