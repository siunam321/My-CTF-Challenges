const bcrypt = require('bcrypt');
const crypto = require('crypto');
const SALT_ROUND = 10;

function generateSecureRandomString(length) {
    return crypto.randomBytes(length).toString('hex');
}

function hashPassword(password) {
    return bcrypt.hashSync(password, SALT_ROUND);
}

function checkPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

function validateUsername(username) {
    if (!username) {
        return false;
    }
    if (typeof username !== 'string') {
        return false;
    }

    return /^[a-zA-Z0-9]{4,100}$/g.test(username);
}

function validateLoginRegister(username, password) {
    if (!username || !password) {
        return false;
    }
    if (typeof username !== 'string' || typeof password !== 'string') {
        return false;
    }
    if (!validateUsername(username)) {
        return false;
    }
    // the pipe character (|) is used in hashing the password
    if (password.includes('|')) {
        return false;
    }
    return true;
}

function validateMemo(title, content, visibility) {
    if (!title || !content || !visibility) {
        return false;
    }
    if (typeof title !== 'string' || typeof content !== 'string' || typeof visibility !== 'string') {
        return false;
    }
    if (title.length > 255 || content.length > 255) {
        return false;
    }
    return true;
}

function isAuthenticated(req) {
    if (!req.session.userId || !req.session.username || !req.session.role) {
        return false;
    }

    return true;
}

// Cloudflare Turnstile Captcha, 
// NOT related to the challenge.
async function verifyCaptcha(answer, ip, turnstileSecret) {
    const formData = new FormData();
    formData.append('secret', turnstileSecret);
    formData.append('response', answer);
    formData.append('remoteip', ip);

    try {
        const response = await fetch(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                body: formData
            }
        );
        const json = await response.json();
        if (!json.success) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

module.exports = {
    generateSecureRandomString,
    hashPassword,
    checkPassword,
    validateUsername,
    validateLoginRegister,
    validateMemo,
    isAuthenticated,
    verifyCaptcha
};