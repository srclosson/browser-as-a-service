const puppeteer = require('puppeteer');
const { meterProvider, loggerProvider } = require('./opentelemetry');

const defaultOptions = {
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
}

const meter = meterProvider.getMeter('baas');
const requestDuration = meter.createHistogram('browser_request_duration', {
  description: 'Measure the duration of incoming requests to the browser render',
});
const logger = loggerProvider.getLogger('baas');

class Browser {
  async open(url) {
    const startTime = Date.now();

    if (!url) {
      throw new Error('invalid arguments')
    }

    const result = {}
    const browser = await puppeteer.launch({ ...defaultOptions })
    const page = await browser.newPage()

    page.on('console', (consoleMessage) => {
      if (!result.console) {
        result.console = []
      }

      result.console.push({
        type: consoleMessage.type(),
        text: consoleMessage.text(),
      })
    })

    const response = await page.goto(url, { waitUntil: 'networkidle2' })
    requestDuration.record(Date.now - startTime, { event: 'networkidle2'});
    result.elements = await page.content();
    result.pageMetrics = await page.metrics();
    result.statusCode = response.status();
    result.fromCache = response.fromCache();
    logger.info(result.pageMetrics);
    try {
      await browser.close()
    } catch (ex) {
      console.error(ex)
      return result
    }

    return result
  }
}

module.exports = new Browser()
