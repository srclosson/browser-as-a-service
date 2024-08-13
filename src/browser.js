/*
 * Copyright (c) 2018, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

/* eslint-disable no-undef */

const _ = require('lodash')
const RandomHttpUserAgent = require('random-http-useragent')
const puppeteer = require('puppeteer-core')
const { logger } = require('modern-logger')

const { PUPPETEER_EXECUTABLE_PATH } = process.env

const defaultOptions = {
  puppeteer: {
    executablePath: PUPPETEER_EXECUTABLE_PATH,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  },
  'random-http-useragent': {}
}

class Browser {
  constructor() {
    this._options = _.defaultsDeep({}, defaultOptions)

    RandomHttpUserAgent.configure(_.get(this._options, 'random-http-useragent'))
  }

  async open(url, timeout) {
    if (!url) {
      throw new Error('invalid arguments')
    }

    const result = {}

    const [userAgent, browser] = await Promise.all([
      RandomHttpUserAgent.get(), 
      puppeteer.launch(_.get(this._options, 'puppeteer')),
    ])

    const page = await browser.newPage()
    await page.setUserAgent(userAgent)

    page.on('console', (consoleMessage) => {
      if (!result.console) {
        result.console = []
      }

      result.console.push({
        type: consoleMessage.type(),
        text: consoleMessage.text(),
      })
    })

    page.on('metrics', (title, metrics) => {
      console.info('We got metrics', title, JSON.stringify(metrics))
    })

    const response = await page.goto(url, { waitUntil: 'networkidle0' })
    result.elements = await page.content()
    result.pageMetrics = await page.metrics()
    result.statusCode = response.status()
    result.fromCache = response.fromCache()
    await browser.close()

    return result
  }
}

module.exports = new Browser()
