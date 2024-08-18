const puppeteer = require('puppeteer');

const defaultOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  }

// Function to get the full HTML content of a page, including frames
async function getFullPageContent(page) {
    // Retrieve the main document's content
    let content = await page.content();

    // Retrieve all frame contents
    const frames = page.frames();
    for (const frame of frames) {
        // Skip the main frame, only process subframes
        if (frame !== page.mainFrame()) {
            const frameContent = await frame.content();
            content += `<iframe src="${frame.url()}">${frameContent}</iframe>`;
        }
    }

    return content;
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

        // Handle page events and render the page asynchronously
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

        // Use a function to get full page content asynchronously
        const fullContent = await getFullPageContent(page);

        // Send the rendered HTML content as the response
        res.send(fullContent);

        // Close the browser after sending the response
        await browser.close();
    } catch (err) {
        console.error('Error in Puppeteer:', err);
        if (browser) await browser.close();
        res.status(500).send('Something went wrong while rendering the page.');
    }
}

module.exports = { open }