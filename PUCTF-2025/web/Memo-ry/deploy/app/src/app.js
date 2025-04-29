const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');
const utils = require('./utils/helper');
const database = require('./utils/database');
const viewsRoutes = require('./views');
const apiRoutes = require('./api');
const app = express();
const PORT = process.env.PORT || 3000;
const COOKIE_24_HOURS_AGE = 24 * 60 * 60 * 1000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
if (process.env.USE_PROXY){
    app.set('trust proxy', () => true);
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
    session({
        secret: utils.generateSecureRandomString(128),
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: COOKIE_24_HOURS_AGE,
            httpOnly: true,
            sameSite: true
        }
    })
);
// this is purely for preventing unintended solution(s). feel free to ignore this.
app.use((req, res, next) => {
    res.locals.cspNonce = utils.generateSecureRandomString(32);
    next();
});

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            'default-src': ['http:', 'https:'],
            'script-src': ['\'strict-dynamic\'', (req, res) => `'nonce-${res.locals.cspNonce}'`],
            'frame-ancestors': ['\'none\''],
            'upgrade-insecure-requests': null,
        },
    },
    xFrameOptions: { action: 'deny' },
    strictTransportSecurity: false
}));

database.initDatabase();

app.use('/', viewsRoutes);
app.use('/', apiRoutes);

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});