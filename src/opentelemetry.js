// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

const opentelemetry = require("@opentelemetry/sdk-node")
const {getNodeAutoInstrumentations} = require("@opentelemetry/auto-instrumentations-node")
const {OTLPTraceExporter} = require('@opentelemetry/exporter-trace-otlp-grpc')
const {OTLPMetricExporter} = require('@opentelemetry/exporter-metrics-otlp-grpc')
const {PeriodicExportingMetricReader} = require('@opentelemetry/sdk-metrics')
const {containerDetector} = require('@opentelemetry/resource-detector-container')
const {envDetector, hostDetector, osDetector, processDetector} = require('@opentelemetry/resources')
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { MeterProvider } = require('@opentelemetry/sdk-metrics');
const {
  LoggerProvider,
  SimpleLogRecordProcessor,
  ConsoleLogRecordExporter,
} = require('@opentelemetry/sdk-logs');

const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'baas',
});

const sdk = new opentelemetry.NodeSDK({
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [
    getNodeAutoInstrumentations({
      // only instrument fs if it is part of another trace
      '@opentelemetry/instrumentation-fs': {
        requireParentSpan: true,
      },
      '@opentelemetry/instrumentation-express': {
        requireParentSpan: true,
      },
      '@opentelemetry/instrumentation-http': {
        requireParentSpan: true,
      },
      '@opentelemetry/instrumentation-hapi': {
        requireParentSpan: true,
      },
    })
  ],
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter()
  }),
  resourceDetectors: [
    containerDetector,
    envDetector,
    hostDetector,
    osDetector,
    processDetector,
  ],
});


// Set up metrics
const meterProvider = new MeterProvider({
  resource,
});

const loggerProvider = new LoggerProvider();
loggerProvider.addLogRecordProcessor(
  new SimpleLogRecordProcessor(new ConsoleLogRecordExporter())
);


// Export the meter and SDK so they can be used in your application
module.exports = { meterProvider, sdk, loggerProvider };

