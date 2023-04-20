const config = require('config');
const testUtils = require('@data-fair/processings-test-utils');
const {downloadZip,downloadXML} = require('../lib/download.js');
const process = require('../lib/process.js');
const XMLtoCSV = require('../');


describe('Download', function () {
    it('should download a zip', async function () {
      const context = testUtils.context({
        pluginConfig: {
          
        },
        processingConfig: {
          url: 'https://donnees.roulez-eco.fr/opendata/instantane'
        },
        tmpDir: 'data/'
      }, config, false);
      await downloadZip(context.processingConfig, context.tmpDir, context.axios, context.log);
    });
    it('should download an XML file', async function () {
      this.timeout(10000);

      const context = testUtils.context({
        pluginConfig: {
        },
        processingConfig: {
          url: 'https://data-api.megalis.bretagne.bzh/api/v1/decp/222200016/2020',
        },
        tmpDir: 'data/'
      }, config, false);
      await downloadXML(context.processingConfig,context.tmpDir,context.axios,context.log);
    });

});

describe('Process', function () {
  it('should create a csv from an xml file', async function () {
    const context = testUtils.context({
      pluginConfig: {
        
      },
      processingConfig: {
        datasetMode: 'create',
        url: 'https://data-api.megalis.bretagne.bzh/api/v1/decp/222200016/2020'
      },
      tmpDir: 'data/'
    }, config, false);
    await process(context.pluginConfig,context.processingConfig, context.tmpDir, context.axios, context.log);
  });
  
  
});
