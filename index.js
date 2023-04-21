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
    formData.append('extras', JSON.stringify({ processingId }))
    const filename = path.parse(new URL(processingConfig.url).pathname).name + '.csv'
    formData.append('file', fs.createReadStream(path.join(tmpDir, filename)), { filename })
    formData.getLength = util.promisify(formData.getLength)
    try {
        let dataset
        if (processingConfig.datasetMode === 'create') {
            dataset = (await axios({
                headers: { ...formData.getHeaders(), 'content-length': await formData.getLength() },
                method: 'post',
                url: 'api/v1/datasets/',
                data: formData,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                
            })).data
            await log.info(`jeu de donnée créé, id="${dataset.id}", title="${dataset.title}"`)
            if (processingConfig.datasetMode === 'create') {
                await patchConfig({ datasetMode: 'update', dataset: { id: dataset.id, title: dataset.title } })
            }     
        } else if (processingConfig.datasetMode === 'update') {
            await log.step('Vérification du jeu de données')
            dataset = (await axios.get('api/v1/datasets/' + processingConfig.dataset.id)).data
            if (!dataset) throw new Error(`Le jeu de données n'existe pas, id="${processingConfig.dataset.id}"`)
            await log.info(`le jeu de donnée existe, id="${dataset.id}", title="${dataset.title}"`)
            dataset = (await axios({
                headers: { ...formData.getHeaders(), 'content-length': await formData.getLength() },
                method: 'post',
                url: 'api/v1/datasets/' + processingConfig.dataset.id,
                data: formData,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                
            })).data
            await log.info(`jeu de donnée mis à jour, id="${dataset.id}", title="${dataset.title}"`)
        }
    } catch (err) {
        console.log(err)
        console.log(JSON.stringify(err, null, 2))
    }
      
    
}