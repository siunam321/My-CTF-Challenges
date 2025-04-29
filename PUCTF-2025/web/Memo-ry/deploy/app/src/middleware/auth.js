const authenticationMiddleware = (req, res, next) => {
    (req.session.userId || req.session.username || req.session.role) ? isSessionValid = true : isSessionValid = false;
    if (!isSessionValid) {
        return res.redirect('/login');
    }

    next();
};

module.exports = {
    authenticationMiddleware
};