const express = require('express')
const browser = require('./browser')
const reverseProxy = require('./proxy')
const { open } = require('./async-browser')

const app = express()
const port = 3000

app.get('/open-async', (req, res) => {
  open(req, res)
})

app.get('/open', async (req, res) => {
  res.send(await browser.open(req.query.url))
})

app.post('/proxy', async (req, res) => {
  res.send(await reverseProxy.proxy(req))
})

app.get('/proxy', async (req, res) => {
  res.send(await reverseProxy.proxy(req))
})

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
