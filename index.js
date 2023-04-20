const fs = require('fs-extra')
const path = require('path')
const util = require('util')
const FormData = require('form-data')
const {downloadZip,downloadXML} = require('./lib/download.js')
const process = require('./lib/process.js')


exports.run = async ({ pluginConfig, processingConfig, processingId, dir, tmpDir, axios, log, patchConfig, ws }) => {
    await downloadXML(processingConfig,tmpDir,axios,log);
    await process(pluginConfig,processingConfig,tmpDir,axios,log);

    const formData = new FormData()
    formData.append('title', processingConfig.dataset.title)
    if (processingConfig.dataset.id) formData.append('id', processingConfig.dataset.id)
    formData.append('extras', JSON.stringify({ processingId }))
    const filename = processingConfig.processType + '.csv'
    formData.append('file', fs.createReadStream(path.join(tmpDir, filename)), { filename })
    formData.getLength = util.promisify(formData.getLength)
    try {
        
        const dataset = (await axios({
            headers: { ...formData.getHeaders(), 'content-length': await formData.getLength() },
            method: 'post',
            url: 'api/v1/datasets/' + (processingConfig.dataset.id || ''),
            data: formData,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            
        })).data
        await log.info(`jeu de donnée ${processingConfig.datasetMode === 'update' ? 'mis à jour' : 'créé'}, id="${dataset.id}", title="${dataset.title}"`)
        await axios({
            method :'get',
            url :`api/v1/datasets/${dataset.title}`
            }).data
        if (processingConfig.datasetMode === 'create') {
            await patchConfig({ datasetMode: 'update', dataset: { id: dataset.id, title: dataset.title } })
            
            
        }
    } catch (err) {
        console.log(err)
        console.log(JSON.stringify(err, null, 2))
    }
      
    
}