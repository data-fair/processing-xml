const fs = require('fs-extra')
const path = require('path')
const util = require('util')
const FormData = require('form-data')
const { download } = require('./lib/download.js')
const process = require('./lib/process.js')

exports.run = async ({ pluginConfig, processingConfig, processingId, dir, tmpDir, axios, log, patchConfig, ws }) => {
  await download(processingConfig, tmpDir, axios, log)
  const tab = await process(processingConfig, tmpDir, axios, log)
  if (processingConfig.datasetMode === 'create' || processingConfig.datasetMode === 'update') {
    await log.step('Chargement du jeu de données')
    const fileName = path.parse(new URL(processingConfig.url).pathname).name + '.csv'
    const check = fs.existsSync(path.join(tmpDir, fileName))
    if (!check) throw new Error(`Le fichier n'existe pas, path="${path.join(tmpDir, fileName)}"`)
    const formData = new FormData()
    formData.append('title', processingConfig.dataset.title || path.parse(new URL(processingConfig.url).pathname).name)
    formData.append('extras', JSON.stringify({ processingId }))
    formData.append('file', await fs.createReadStream(path.join(tmpDir, fileName)), { fileName })
    formData.getLength = util.promisify(formData.getLength)
    let dataset
    await log.info('Envoi du fichier')
    if (processingConfig.datasetMode === 'create') {
      try {
        dataset = (await axios({
          headers: { ...formData.getHeaders(), 'content-length': await formData.getLength() },
          method: 'post',
          url: 'api/v1/datasets/',
          data: formData,
          maxContentLength: Infinity,
          maxBodyLength: Infinity

        })).data
        await log.info(`Jeu de données créé, id="${dataset.id}", title="${dataset.title}"`)
      } catch (err) {
        await log.error('Post ERROR')
        await log.error(JSON.stringify(err, null, 2))
      }
      if (processingConfig.datasetMode === 'create') {
        await patchConfig({ datasetMode: 'update', dataset: { id: dataset.id, title: dataset.title } })
      }
    } else if (processingConfig.datasetMode === 'update') {
      await log.step('Vérification du jeu de données')
      dataset = (await axios.get('api/v1/datasets/' + processingConfig.dataset.id)).data
      if (!dataset) throw new Error(`Le jeu de données n'existe pas, id="${processingConfig.dataset.id}"`)
      await log.info(`Le jeu de données existe, id="${dataset.id}", title="${dataset.title}"`)
      dataset = (await axios({
        headers: { ...formData.getHeaders(), 'content-length': await formData.getLength() },
        method: 'post',
        url: 'api/v1/datasets/' + processingConfig.dataset.id,
        data: formData,
        maxContentLength: Infinity,
        maxBodyLength: Infinity

      })).data
      await log.info(`Jeu de données mis à jour, id="${dataset.id}", title="${dataset.title}"`)
    }
  } else if (processingConfig.datasetMode === 'lines') {
    const resultBulk = (await axios({
      method: 'post',
      url: `api/v1/datasets/${processingConfig.dataset.id}/_bulk_lines`,
      data: tab,
      maxContentLength: Infinity,
      maxBodyLength: Infinity

    })).data

    await log.info(`lignes chargées: ${resultBulk.nbOk.toLocaleString()} ok, ${resultBulk.nbNotModified.toLocaleString()} sans modification, ${resultBulk.nbErrors.toLocaleString()} en erreur`)
    if (resultBulk.nbErrors) {
      await log.error(`${resultBulk.nbErrors} erreurs rencontrées`)
      for (const error of resultBulk.errors) {
        await log.error(JSON.stringify(error))
      }
    }
  }
}
