#!/usr/bin/env node

/*
 * Copyright (c) 2018, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

const Logger = require('modern-logger')
const Pyroscope = require('@pyroscope/nodejs');
const SourceMapper = Pyroscope.default.SourceMapper;
const tracer = require('./opentelemetry');


const { VERSION, VERSION_COMMIT, VERSION_BUILD_DATE } = process.env

Logger.configure({
  transports: {
    console: [
      {
        colorize: false,
        timestamp: false
      }
    ]
  }
})

if (VERSION && VERSION_COMMIT && VERSION_BUILD_DATE) {
  Logger.info(
    `Running version ${VERSION} from commit ${VERSION_COMMIT} built on ${VERSION_BUILD_DATE}`
  )
}

const Server = require('./server')


const otelResourceAttributes = process.env.OTEL_RESOURCE_ATTRIBUTES || ''
const otelAttributes = {}
otelResourceAttributes.split(',').forEach(kvpair => {
  const splitAttr = kvpair.split('=')
  otelAttributes[splitAttr[0]] = splitAttr[1]
});


Logger.info(`otelResourceAttributes = [${otelResourceAttributes}], otelAttributes=[${JSON.stringify(otelAttributes)}]`)

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




// shutdown gracefully
const shutdown = (exitStatus = 0) => {
  return Server.stop().finally(() => process.exit(exitStatus))
}

const logErrorAndShutdown = error => {
  return Logger.error(error).finally(() => shutdown(1))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
process.on('SIGHUP', shutdown) // reload
process.on('SIGABRT', () => process.exit(1)) // force immediate shutdown, i.e. systemd watchdog?
process.on('uncaughtException', logErrorAndShutdown)
process.on('unhandledRejection', logErrorAndShutdown)

tracer.start()
Server.start()
