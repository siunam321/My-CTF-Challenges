const express = require('express');
const bot = require('./bot');
const utils = require('./utils/helper');
const csrf = require('./middleware/csrf');
const { authenticationMiddleware } = require('./middleware/auth');
const router = express.Router();
const TEMP_MEMO_CSRF_ACTION = 'memo_all'; // TODO: generate different CSRF token based on the action

const isTurnstileEnabled = (process.env['ENABLE_TURNSTILE'] === 'true') || false;

router.get('/report', (req, res) => {
    const { name } = bot
    res.render('report', {
        nonce: res.locals.cspNonce,
        name,
        isTurnstileEnabled
    });
});

router.get('/', authenticationMiddleware, (req, res) => {
    return res.render('index', { nonce: res.locals.cspNonce });
});

router.get('/memos', authenticationMiddleware, (req, res) => {
    return res.render('memos', { nonce: res.locals.cspNonce });
});

router.get('/create', authenticationMiddleware, (req, res) => {
    return res.render('create', { nonce: res.locals.cspNonce });
});

router.get('/profile', authenticationMiddleware, (req, res) => {
    const csrfToken = csrf.generateCSRFToken(TEMP_MEMO_CSRF_ACTION);
    return res.render('profile', {
        nonce: res.locals.cspNonce,
        username: req.session.username,
        role: req.session.role,
        csrfToken,
        csrfAction: TEMP_MEMO_CSRF_ACTION
    });
});

router.get('/approve', authenticationMiddleware, (req, res) => {
    if (req.session.role === 'guest') {
        const redirectUrl = req.query.redirect || '/';
        return res.redirect(redirectUrl);
    }

    const csrfToken = csrf.generateCSRFToken(TEMP_MEMO_CSRF_ACTION);
    return res.render('approve', {
        nonce: res.locals.cspNonce,
        csrfToken,
        csrfAction: TEMP_MEMO_CSRF_ACTION
    });
});

router.get('/edit', authenticationMiddleware, (req, res) => {
    if (req.session.role !== 'admin') {
        const redirectUrl = req.query.redirect || '/';
        return res.redirect(redirectUrl);
    }

    const csrfToken = csrf.generateCSRFToken(TEMP_MEMO_CSRF_ACTION);
    return res.render('edit', {
        nonce: res.locals.cspNonce,
        csrfToken,
        csrfAction: TEMP_MEMO_CSRF_ACTION
    });
});

router.get('/register', (req, res) => {
    if (utils.isAuthenticated(req)) {
        return res.redirect('/');
    }

    return res.render('register', { nonce: res.locals.cspNonce });
});

router.get('/login', (req, res) => {
    if (utils.isAuthenticated(req)) {
        return res.redirect('/');
    }
    
    return res.render('login', { nonce: res.locals.cspNonce });
});

module.exports = router;