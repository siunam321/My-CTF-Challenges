const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticationMiddleware } = require('./middleware/auth');
const { turnstileMiddleware } = require('./middleware/turnstile');
const csrf = require('./middleware/csrf');
const database = require('./utils/database');
const utils = require('./utils/helper');
const bot = require('./bot');
const router = express.Router();

const limit = rateLimit({
    ...bot.rateLimit,
    handler: ((req, res, _next) => {
        const timeRemaining = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        res.status(429).json({
            error: `Too many requests, please try again later after ${timeRemaining} seconds.`,
        });
    })
});

router.post('/api/report', limit, turnstileMiddleware, async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).send({ error: 'Url is missing.' });
    }
    if (!RegExp(bot.urlRegex).test(url)) {
        return res.status(422).send({ error: `URL didn't match this regex format: ${bot.urlRegex}` });
    }

    const isBotVisitedUrl = await bot.bot(url);
    if (!isBotVisitedUrl) {
        return res.status(500).send({ error: 'Author failed to visit the URL. Or, there\'s no memo to approve.' });
    }

    return res.send({ success: 'Author successfully visited the URL.' });
});

router.get('/api/memo', authenticationMiddleware, (req, res) => {
    database.getApprovedPublicMemos().then((rows) => {
        return res.json(rows);
    }).catch((err) => {
        return res.json({ status: 'failed', message: 'Internal Server Error' });
    });
});

router.get('/api/memo/:id', authenticationMiddleware, (req, res) => {
    if (req.session.role !== 'admin') {
        return res.json({ status: 'failed', message: 'Unauthorized' });
    }

    database.getMemoById(req.params.id).then((rows) => {
        if (rows === undefined) {
            return res.json({ status: 'failed', message: 'Memo not found' });
        }

        return res.json(rows);
    }).catch((err) => {
        return res.json({ status: 'failed', message: 'Internal Server Error' });
    });
});

router.put('/api/memo/:id', authenticationMiddleware, csrf.CSRFMiddleware, async (req, res) => {
    try {
        if (req.session.role === 'guest') {
            throw new Error('Unauthorized');
        }

        const memo = await database.getMemoById(req.params.id).catch((err) => {
            throw new Error('Internal Server Error');
        });
        if (memo === undefined) {
            throw new Error('Memo not found');
        }

        const title = req.body.memoTitle || memo.title;
        const content = req.body.memoContent || memo.body;
        const visibility = req.body.visibility || memo.visibility;
        if (!utils.validateMemo(title, content, visibility)) {
            throw new Error('Invalid title or content');
        }

        database.updateMemo(req.params.id, title, content, visibility).then(() => {
            return res.json({ status: 'success', message: 'Memo updated successfully' });
        }).catch((err) => {
            return res.json({ status: 'failed', message: 'Internal Server Error' });
        });
    } catch (err) {
        return res.json({ status: 'failed', message: err.message });
    }
});

router.post('/api/memo', authenticationMiddleware, (req, res) => {
    const title = req.body.memoTitle;
    const content = req.body.memoContent;
    const visibility = req.body.visibility;
    if (!utils.validateMemo(title, content, visibility)) {
        return res.json({ status: 'failed', message: 'Invalid title or content' });
    }

    database.createMemo(req.session.username, title, content, visibility).then(() => {
        return res.json({ status: 'success', message: 'Memo created successfully. Please wait for the author/admin\'s approval if the visibility setting is set to public at path `/report`. You can also convince him/her why your memo should be approved by sending a link like `http://<challenge_domain>:<port>/approve?notice=<text_here>`.' });
    }).catch((err) => {
        return res.json({ status: 'failed', message: 'Internal Server Error' });
    });
});

router.post('/api/memo/:id/approve', authenticationMiddleware, csrf.CSRFMiddleware, async (req, res) => {
    try {
        if (req.session.role === 'guest') {
            throw new Error('Unauthorized');
        }
        const memo = await database.getMemoById(req.params.id).catch((err) => {
            throw new Error('Internal Server Error');
        });
        if (memo === undefined) {
            throw new Error('Memo not found');
        }
        if (memo.approved === 1) {
            throw new Error('Memo already approved');
        }
    
        // TODO: implement logging the memo's approval details. i.e.: approved by whom, when, approval reason, etc.
    
        database.approveMemo(req.params.id).then(() => {
            return res.json({ status: 'success', message: 'Memo approved successfully' });
        }).catch((err) => {
            return res.json({ status: 'failed', message: 'Internal Server Error' });
        });
    } catch (err) {
        return res.json({ status: 'failed', message: err.message });
    }
});

router.get('/api/memos/:username', authenticationMiddleware, (req, res) => {
    database.getMemosByUsername(req.params.username)
        .then((rows) => {
            if (rows === undefined) {
                return res.json({ status: 'failed', message: 'User not found' });
            }
            const unauthorizedMemo = rows.find(row => row.username !== req.session.username);
            if (unauthorizedMemo) {
                return res.json({ status: 'failed', message: 'Unauthorized' });
            }

            return res.json(rows);
        })
        .catch((err) => {
            return res.json({ status: 'failed', message: 'Internal Server Error' });
        });
});

router.get('/api/unapproved-memos', authenticationMiddleware, (req, res) => {
    if (req.session.role === 'guest') {
        return res.json({ status: 'failed', message: 'Unauthorized' });
    }

    database.getUnapprovedPublicMemos().then((rows) => {
        return res.json(rows);
    }).catch((err) => {
        return res.json({ status: 'failed', message: 'Internal Server Error' });
    });
});

router.post('/api/username', authenticationMiddleware, csrf.CSRFMiddleware, async (req, res) => {
    const newUsername = req.body.username;
    if (!utils.validateUsername(newUsername)) {
        return res.json({ status: 'failed', message: 'Invalid username' });
    }
    if (await database.isDuplicateUsername(newUsername)) {
        return res.json({ status: 'failed', message: 'Username already exists' });
    }

    database.updateUsername(req.session.userId, newUsername, req.session.password).then((newPassword) => {
        req.session.username = newUsername;
        req.session.password = newPassword;
        return res.json({ status: 'success', message: 'Username updated successfully', username: newUsername });
    }).catch((err) => {
        return res.json({ status: 'failed', message: 'Internal Server Error' });
    });
});

router.post('/api/register', async (req, res) => {
    if (utils.isAuthenticated(req)) {
        return res.json({ status: 'failed', message: 'You already authenticated' });
    }

    const username = req.body.username;
    const password = req.body.password;
    if (!utils.validateLoginRegister(username, password)) {
        return res.json({ status: 'failed', message: 'Invalid username or password' });
    }
    if (await database.isDuplicateUsername(username)) {
        return res.json({ status: 'failed', message: 'Username already exists' });
    }

    database.register(username, password).then(() => {
        return res.json({ status: 'success', message: 'User registered successfully' });
    }).catch((err) => {
        return res.json({ status: 'failed', message: 'Internal Server Error' });
    });
});

router.post('/api/login', (req, res) => {
    if (utils.isAuthenticated(req)) {
        return res.json({ status: 'failed', message: 'You already authenticated' });
    }
    
    const username = req.body.username;
    const password = req.body.password;
    if (!utils.validateLoginRegister(username, password)) {
        return res.json({ status: 'failed', message: 'Invalid username or password' });
    }

    database.login(username, password).then((rows) => {
        if (rows === false) {
            return res.json({ status: 'failed', message: 'Incorrect username or password' });
        }

        req.session.userId = rows.id;
        req.session.username = rows.username;
        req.session.password = `${rows.username}|${password}`;
        req.session.role = rows.role;
        return res.json({ status: 'success', message: 'User logged in successfully', username: rows.username });
    }).catch((err) => {
        return res.json({ status: 'failed', message: 'Internal Server Error' });
    });
});

router.get('/api/logout', authenticationMiddleware, (req, res) => {
    req.session.destroy();
    return res.redirect('/');
});

module.exports = router;