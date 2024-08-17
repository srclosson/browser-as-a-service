const puppeteer = require('puppeteer');

const defaultOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  }

const open = async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send('URL parameter is required');
    }

    let browser;

    try {
        // Launch a headless browser instance using Puppeteer
        browser = await puppeteer.launch({ ...defaultOptions });
        const page = await browser.newPage();
        page.setCacheEnabled(false);

        // Listen to the 'load' event (fired when the page fully loads)
        page.once('load', async () => {
            try {
                const content = await page.content();
                res.send(content); // Send the rendered HTML as soon as the page is fully loaded
                await browser.close(); // Close the browser after sending the response
            } catch (err) {
                console.error('Error while sending content:', err);
                res.status(500).send('Error while rendering the page.');
            }
        });

        // Optionally, listen to other events like 'domcontentloaded'
        page.on('domcontentloaded', () => {
            console.log('DOM content loaded');
        });

        // Navigate to the target URL
        return await page.goto(targetUrl)
    } catch (err) {
        console.error('Error in Puppeteer:', err);
        if (browser) await browser.close();
        res.status(500).send('Something went wrong while rendering the page.');
    }
}

module.exports = { open }