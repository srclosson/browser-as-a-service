const http = require('http')
const https = require('https')
const { parse } = require('url')

class ReverseProxy {
  async proxy(req) {
    return new Promise((resolve, reject) => {
      const parsedUrl = parse(req.query.url)
      const options = {
        ...req.options,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.path,
        headers: {
          'User-Agent': 'Node.js Reverse Proxy',
        },
      }

      const protocol = parsedUrl.protocol === 'https:' ? https : http
      const proxyReq = protocol.request(options, (proxyRes) => {
        let data = ''

        // Collect data chunks
        proxyRes.on('data', (chunk) => {
          data += chunk
        })

        // Resolve the promise with the full response
        proxyRes.on('end', () => {
          resolve({
            statusCode: proxyRes.statusCode,
            headers: proxyRes.headers,
            body: data,
          })
        })
      })

      proxyReq.on('error', (err) => {
        console.error(err)
        reject(err)
      })

      if (req.method === 'POST' || req.method === 'PUT') {
        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })

        req.on('end', () => {
          proxyReq.write(body)
          proxyReq.end()
        })
      } else {
        proxyReq.end()
      }
    })
  }
}

module.exports = new ReverseProxy()
