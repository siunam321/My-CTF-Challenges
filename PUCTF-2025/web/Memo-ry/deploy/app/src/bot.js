const { chromium } = require('playwright');

const CONFIG = {
    APPNAME: process.env['APPNAME'] || 'Admin',
    APPURL: process.env['APPURL'] || 'http://localhost:3000',
    APPURLREGEX: process.env['APPURLREGEX'] || '^.*$',
    APPLIMITTIME: Number(process.env['APPLIMITTIME'] || '60000'),
    APPLIMIT: Number(process.env['APPLIMIT'] || '5'),
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

console.log('Bot started...');

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
            await page.goto(`${CONFIG.APPURL}/login`, {
                waitUntil: 'load',
                timeout: 10 * 1000
            });
            await page.fill('input[name="username"]', process.env['AUTHOR_USERNAME']);
            await page.fill('input[name="password"]', process.env['AUTHOR_PASSWORD']);
            await page.click('input[type="submit"][value="Login"]');
            await sleep(1000);
        
            console.log(`bot visiting ${urlToVisit}`);
            await page.goto(urlToVisit, {
                waitUntil: 'load',
                timeout: 10 * 1000
            });
            await sleep(5000);
            await page.click('input[type="submit"][value="Approve"]', { timeout: 5 * 1000 });
            await sleep(5000);
            
            console.log('browser close...');
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            await context.close();
        }
    }
};