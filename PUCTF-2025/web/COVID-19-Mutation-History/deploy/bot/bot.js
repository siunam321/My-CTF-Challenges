const { chromium } = require('playwright');

const CONFIG = {
    APPNAME: process.env['APPNAME'] || "Admin",
    APPURL: process.env['APPURL'] || "http://app.puctf25:8080",
    APPURLREGEX: process.env['APPURLREGEX'] || "^.*$",
    APPLIMITTIME: Number(process.env['APPLIMITTIME'] || "60000"),
    APPLIMIT: Number(process.env['APPLIMIT'] || "5"),
};

console.table(CONFIG);

function sleep(s) {
    return new Promise((resolve) => setTimeout(resolve, s));
}

const browserArgs = {
    headless: true,
    args: [
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-gpu',
        '--disable-default-apps',
        '--disable-translate',
        '--disable-device-discovery-notifications',
        '--disable-software-rasterizer',
        '--disable-xss-auditor'
    ],
    ignoreHTTPSErrors: true
};

console.log("Bot started...");

module.exports = {
    name: CONFIG.APPNAME,
    urlRegex: CONFIG.APPURLREGEX,
    rateLimit: {
        windowMs: CONFIG.APPLIMITTIME,
        limit: CONFIG.APPLIMIT
    },
    bot: async (urlToVisit) => {
        const browser = await chromium.launch(browserArgs);
        const context = await browser.newContext();

        try {
            const page = await context.newPage();

            await page.goto(`${CONFIG.APPURL}/login.php`, {
                waitUntil: 'load',
                timeout: 10 * 1000
            });
            await page.fill('input[name="username"]', process.env['ADMIN_USERNAME']);
            await page.fill('input[name="password"]', process.env['ADMIN_PASSWORD']);
            await page.click('button[type="submit"]');
            await sleep(1000);
        
            console.log(`bot visiting ${urlToVisit}`);
            await page.goto(urlToVisit, {
                waitUntil: 'load',
                timeout: 10 * 1000
            });
            await sleep(10000);

            console.log("browser close...");
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            await context.close();
        }
    }
};