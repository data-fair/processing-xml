const assert = require('assert');
const config = require('config');
const testUtils = require('@data-fair/processings-test-utils');
const test = require('../lib/download.js');
const axios = require('axios');


describe('Download', function () {
    it('should download a zip', async function () {
      const context = testUtils.context({
        pluginConfig: {
          url: 'https://donnees.roulez-eco.fr/opendata/instantane',
          limit: 2500 
        },
        processingConfig: {},
        tmpDir: 'data/'
      }, config, false);
      await test.downloadZip(context.pluginConfig, context.tmpDir, context.axios, context.log);
    });
    it('should download an XML file', async function () {
      this.timeout(10000);

      const context = testUtils.context({
        pluginConfig: {
          url: 'https://data-api.megalis.bretagne.bzh/api/v1/decp/222200016/2020',
          limit: 2500 
        },
        processingConfig: {},
        tmpDir: 'data/'
      }, config, false);
      await test.downloadXML(context.pluginConfig,context.tmpDir,context.axios,context.log);
    });

});
