const express = require('express')
const browser = require('./browser')
const reverseProxy = require('./proxy')
const { open } = require('./async-browser')
const Pyroscope = require('@pyroscope/nodejs');
const SourceMapper = Pyroscope.default.SourceMapper;
const { sdk } = require('./opentelemetry');

const otelResourceAttributes = process.env.OTEL_RESOURCE_ATTRIBUTES || ''
const otelAttributes = {}
otelResourceAttributes.split(',').forEach(kvpair => {
  const splitAttr = kvpair.split('=')
  otelAttributes[splitAttr[0]] = splitAttr[1]
});


SourceMapper.create(['.'])
  .then((sourceMapper) => {
    Pyroscope.init({
      serverAddress: process.env.GRAFANA_PYROSCOPE_ADDR,
      appName: process.env.OTEL_SERVICE_NAME,
      sourceMapper: sourceMapper,
      tags: {
        region: process.env.REGION,
        service_namespace:  otelAttributes['service.namespace'],
        namespace:          otelAttributes['service.namespace'],
        service_version:    otelAttributes['service.version'],
        service_git_ref:    process.env.GIT_REF,
        service_repository: process.env.GIT_REPO,
      },
      basicAuthUser: process.env.GRAFANA_PYROSCOPE_AUTH_USER,
      basicAuthPassword: process.env.GRAFANA_PYROSCOPE_AUTH_PASS,
      wallCollectCpuTime: true
    });
    Pyroscope.start();
  })
  .catch((e) => {
    Logger.error(e);
  });

const app = express();
const port = 3000;

app.get('/open-async', (req, res) => {
  open(req, res);
});

app.get('/open', async (req, res) => {
  res.send(await browser.open(req.query.url));
});

app.post('/proxy', async (req, res) => {
  res.send(await reverseProxy.proxy(req));
});

app.get('/proxy', async (req, res) => {
  res.send(await reverseProxy.proxy(req));
});

// Start the server
sdk.start();
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
})
