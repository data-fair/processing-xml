const fs = require('fs-extra')
const path = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const pump = util.promisify(require('pump'))




exports.downloadZip= async (pluginConfig, dir = 'data', axios, log) => {
  
  await log.step('Téléchargement du fichier instantané')
  
  const fileName = path.parse(new URL(pluginConfig.url).pathname).name + '.zip'
  const file = `${dir}/${fileName}`

  // this is used only in dev
  if (await fs.pathExists(file)) {
    await log.info(`Le fichier ${file} existe déjà`)
  } else {
    // creating empty file before streaming seems to fix some weird bugs with NFS
    await fs.ensureFile(file)
    await log.info('Télécharge le fichier ' + pluginConfig.url)
    try {
      const res = await axios.get(pluginConfig.url, { responseType: 'stream' })
      await pump(res.data, fs.createWriteStream(file))
    } catch (err) {
      if (err.status === 404) {
        await fs.remove(file)
        return
      }
      throw err
    }

    // Try to prevent weird bug with NFS by forcing syncing file before reading it
    const fd = await fs.open(file, 'r')
    await fs.fsync(fd)
    await fs.close(fd)
  }

  await log.info(`Extraction de l'archive ${file}`)
  try {
    await exec(`unzip -o ${file} -d ${dir}`)
  } catch (err) {
    log.warning(err)
  }
  // remove the zip file
  await fs.remove(file);
}
exports.downloadXML= async (pluginConfig, dir = 'data', axios, log) => {
    await log.step('Téléchargement du fichier instantané')
  
  const fileName = path.parse(new URL(pluginConfig.url).pathname).name + '.xml'
  const file = `${dir}/${fileName}`

  // this is used only in dev
  if (await fs.pathExists(file)) {
    await log.info(`Le fichier ${file} existe déjà`)
  } else {
    // creating empty file before streaming seems to fix some weird bugs with NFS
    await fs.ensureFile(file)
    await log.info('Télécharge le fichier ' + pluginConfig.url)
    try {
      const res = await axios.get(pluginConfig.url, { responseType: 'stream' })
      await pump(res.data, fs.createWriteStream(file))
    } catch (err) {
      if (err.status === 404) {
        await fs.remove(file)
        return
      }
      throw err
    }
}
}


