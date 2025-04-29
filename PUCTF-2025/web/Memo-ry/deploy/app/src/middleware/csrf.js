const utils = require('../utils/helper');
const csrfTokens = new Map();

const CHALLENGE_ORIGINS = ['http://localhost:3000'];
const REMOTE_CHALLENGE_ORIGIN = process.env.REMOTE_CHALLENGE_ORIGIN || '';
if (REMOTE_CHALLENGE_ORIGIN !== '') {
    CHALLENGE_ORIGINS.push(REMOTE_CHALLENGE_ORIGIN);
}

function generateCSRFToken(action) {
    const token = utils.generateSecureRandomString(32);
    
    // bind the CSRF token to a specific action
    csrfTokens.set(token, action);
    return token;
}

const CSRFMiddleware = (req, res, next) => {
    const origin = req.headers['origin'];
    if (!origin || typeof origin !== 'string') {
        return res.status(403).send('Invalid Origin header');
    }

    const isSameOrigin = CHALLENGE_ORIGINS.includes(origin);
    if (!isSameOrigin) {
        return res.status(403).send('The request must be same origin');
    }

    const token = req.headers['x-csrf-token'];
    const action = req.headers['x-csrf-action'];

    (token || action) ? isTokenActionSet = true : isTokenActionSet = false;
    (csrfTokens.has(token) && csrfTokens.get(token) === action) ? isTokenValid = true : isTokenValid = false;
    if (!isTokenActionSet || !isTokenValid) {
        return res.status(403).send('Invalid CSRF token');
    }

    csrfTokens.delete(token)
    next();
};

module.exports = {
    generateCSRFToken,
    CSRFMiddleware
};