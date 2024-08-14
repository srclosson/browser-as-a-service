/*
 * Copyright (c) 2018, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

/* eslint-disable no-undef */

const puppeteer = require('puppeteer')

const defaultOptions = {
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
}

class Browser {
  async open(url) {
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

    const response = await page.goto(url, { waitUntil: 'networkidle0' })
    result.elements = await page.content()
    result.pageMetrics = await page.metrics()
    result.statusCode = response.status()
    result.fromCache = response.fromCache()
    try {
      await browser.close()
    } catch (ex) {
      return result
    }

    return result
  }
}

module.exports = new Browser()
