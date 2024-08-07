process.env.NODE_ENV = 'test'
const config = require('config')
const testUtils = require('@data-fair/processings-test-utils')
const { download } = require('../lib/download.js')
const processXML = require('../lib/process.js')
const xmlProcessing = require('../')

describe('Download', function () {
  it('should download a zip', async function () {
    const context = testUtils.context({
      pluginConfig: {

      },
      processingConfig: {
        url: 'https://donnees.roulez-eco.fr/opendata/instantane'
      },
      tmpDir: 'data/'
    }, config, false)
    await download(context.processingConfig, context.tmpDir, context.axios, context.log)
  })
  it('should download an XML file', async function () {
    this.timeout(100000)

    const context = testUtils.context({
      pluginConfig: {
      },
      processingConfig: {
        url: 'https://data-api.megalis.bretagne.bzh/api/v1/decp/222200016/2020'
      },
      tmpDir: 'data/'
    }, config, false)
    await download(context.processingConfig, context.tmpDir, context.axios, context.log)
  })
  it('should download an XML file', async function () {
    this.timeout(100000)

    const context = testUtils.context({
      pluginConfig: {
      },
      processingConfig: {
        url: 'https://nantesleconcorde.cineoffice.fr/TMSexport/nantesleconcorde/'
      },
      tmpDir: 'data/'
    }, config, false)
    await download(context.processingConfig, context.tmpDir, context.axios, context.log)
  })
})

describe('Process', function () {
  it('should create a csv from an xml file', async function () {
    const context = testUtils.context({
      processingConfig: {
        datasetMode: 'create',
        url: 'https://data-api.megalis.bretagne.bzh/api/v1/decp/222200016/2020',
        separateur: '-'
      },
      tmpDir: 'data/'
    }, config, false)
    await processXML(context.processingConfig, context.tmpDir, context.axios, context.log)
  })

  it('should create a csv from an xml file', async function () {
    const context = testUtils.context({
      processingConfig: {
        datasetMode: 'create',
        url: 'https://nantesleconcorde.cineoffice.fr/TMSexport/nantesleconcorde/'
      },
      tmpDir: 'data/'
    }, config, false)
    await processXML(context.processingConfig, context.tmpDir, context.axios, context.log)
  })
})

describe('Load csv test', function () {
  it('should load a csv on the staging', async function () {
    this.timeout(100000)
    const context = testUtils.context({
      pluginConfig: {
      },
      processingConfig: {
        datasetMode: 'create',
        dataset: { title: 'xmlProcessing' },
        url: 'https://data-api.megalis.bretagne.bzh/api/v1/decp/222200016/2020',
        separateur: '-'
      },
      tmpDir: 'data/'
    }, config, false)
    await xmlProcessing.run(context)
  })
})

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('Another load csv test', function () {
  it('should load a csv on the staging', async function () {
    this.timeout(20000)
    const context = testUtils.context({
      pluginConfig: {
      },
      processingConfig: {
        datasetMode: 'create',
        dataset: { id: 'xmlprocessing-test-update', title: 'xmlProcessing test update' },
        url: 'https://data-api.megalis.bretagne.bzh/api/v1/decp/222200016/2020',
        separateur: '-'
      },
      tmpDir: 'data/'
    }, config, false)
    await xmlProcessing.run(context)
  })
})

describe('Update dataset', function () {
  it('should update a dataset on the staging', async function () {
    this.timeout(20000)
    const context = testUtils.context({
      pluginConfig: {
      },
      processingConfig: {
        datasetMode: 'update',
        dataset: { id: 'xmlprocessing-test-update', title: 'xmlProcessing test update' },
        url: 'https://data-api.megalis.bretagne.bzh/api/v1/decp/222200016/2023',
        separateur: '-'
      },
      tmpDir: 'data/'
    }, config, false)
    await wait(15000)
    await xmlProcessing.run(context)
  })
})

describe('incremental modification test', function () {
  it('should add or modify dataset information', async function () {
    this.timeout(20000)
    const context = testUtils.context({
      pluginConfig: {
      },
      processingConfig: {
        datasetMode: 'lines',
        dataset: { id: 'xml-editable', title: 'XML editable' },
        url: 'https://data-api.megalis.bretagne.bzh/api/v1/decp/222200016/2019',
        separateur: '-'
      },
      tmpDir: 'data/'
    }, config, false)
    await xmlProcessing.run(context)
  })
})
