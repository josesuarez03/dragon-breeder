function isAuthenticated(req, res, next){
    if (req.session && req.session.userId){
        console.log('Esta autenticado')
        return next()
    }
    else{
        console.log('No esta autenticado')
        res.redirect('/login')
    }
};

function isAdmin(req, res, next) {
    if (req.user && req.user.role === true) {
        console.log('Autorizado')
        return next();
    } else {
        res.redirect('/')
        return res.status(401).send('Unauthorized');
    }
};

module.exports = { isAuthenticated, isAdmin };