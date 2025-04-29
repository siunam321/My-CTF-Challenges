// Cloudflare Turnstile Captcha validation
// NOT related to the challenge.
const utils = require('../utils/helper');
const isTurnstileEnabled = (process.env['ENABLE_TURNSTILE'] === 'true') || false;
const TURNSTILE_SECRET = process.env['TURNSTILE_SECRET'] || '';

const turnstileMiddleware = async (req, res, next) => {
    if (!isTurnstileEnabled) {
        next();
        return;
    }

    if (TURNSTILE_SECRET === '') {
        return res.status(500).send({ error: 'This server did not have the Cloudflare Turnstile secret key.' });
    }

    const ip = req.headers['cf-connecting-ip'] || req.socket.remoteAddress;
    const { answer } = req.body;
    if (!answer) {
        return res.status(400).send({ error: 'Please complete the Cloudflare Turnstile Captcha.' });
    }

    isVerified = await utils.verifyCaptcha(answer, ip, TURNSTILE_SECRET);
    if (!isVerified) {
        return res.status(422).json({ error: 'Invalid Cloudflare Turnstile token.' });
    }

    next();
};

module.exports = {
    turnstileMiddleware
};