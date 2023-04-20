const config = require('../config/local-dev');
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
describe('Load csv test', function () {
  it('should load a csv on the staging', async function () {
    this.timeout(100000)
    const context = testUtils.context({
      pluginConfig: {
      },
      processingConfig: {
        datasetMode: 'create',
        dataset :{title : 'XMLtoCSV test'},
        url: 'https://data-api.megalis.bretagne.bzh/api/v1/decp/222200016/2020',
        processType : '2020'        
      },
      tmpDir: 'data/'
    }, config, false);
    await XMLtoCSV.run(context);
  });
});
