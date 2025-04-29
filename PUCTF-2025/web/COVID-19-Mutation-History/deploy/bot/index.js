const express = require("express")
const app = express();
const path = require("path")
const route = express.Router()
const bot = require("./bot")
const rateLimit = require("express-rate-limit")

app.use(express.urlencoded({ extended: false }))
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
if (process.env.USE_PROXY){
    app.set('trust proxy', () => true)
}

const isTurnstileEnabled = (process.env['ENABLE_TURNSTILE'] === 'true') || false;
const TURNSTILE_SECRET = process.env['TURNSTILE_SECRET'] || '';

const limit = rateLimit({
    ...bot.rateLimit,
    handler: ((req, res, _next) => {
        const timeRemaining = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        res.status(429).json({
            error: `Too many requests, please try again later after ${timeRemaining} seconds.`,
        });
    })
})

// Cloudflare Turnstile Captcha
async function verifyCaptcha(answer, ip) {
    const formData = new FormData();
    formData.append("secret", TURNSTILE_SECRET);
    formData.append("response", answer);
    formData.append("remoteip", ip);

    try {
        const response = await fetch(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify", {
                method: "POST",
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

route.post("/", limit, async (req, res) => {
    // Cloudflare Turnstile Captcha validation
    // NOT related to the challenge.
    if (isTurnstileEnabled) {
        if (TURNSTILE_SECRET === '') {
            return res.status(500).send({ error: "This server did not have the Cloudflare Turnstile secret key." });
        }

        const ip = req.headers["cf-connecting-ip"] || req.socket.remoteAddress;
        const { answer } = req.body;
        if (!answer) {
            return res.status(400).send({ error: "Please complete the Cloudflare Turnstile Captcha." });
        }

        isVerified = await verifyCaptcha(answer, ip);
        if (!isVerified) {
            return res.status(422).json({ error: "Invalid Cloudflare Turnstile token." });
        }
    }

    const { url } = req.body;
    if (!url) {
        return res.status(400).send({ error: "Url is missing." });
    }
    if (!RegExp(bot.urlRegex).test(url)) {
        return res.status(422).send({ error: "URL didn't match this regex format " + bot.urlRegex })
    }
    if (await bot.bot(url)) {
        return res.send({ success: "Admin successfully visited the URL." });
    } else {
        return res.status(500).send({ error: "Admin failed to visit the URL." });
    }
});

route.get("/", (_, res) => {
    const { name } = bot
    res.render("index", { name, isTurnstileEnabled });
});

app.use("/", route)

app.listen(80, () => {
    console.log("Server running at http://localhost:80");
});