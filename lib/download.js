const fs = require('fs-extra')
const path = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const pump = util.promisify(require('pump'))

exports.download = async (pluginConfig, dir = 'data', axios, log) => {
  await log.step('Téléchargement du fichier')

  let res
  try {
    res = await axios.get(pluginConfig.url, { responseType: 'stream' })
  } catch (err) {
    if (err.status === 404) {
      await log.warning('Le fichier n\'existe pas')
      return
    }
    throw err
  }

  let extension = res.headers['content-type'].split('/')[1].split(';')[0]
  if (!['xml', 'zip'].includes(extension)) extension = 'xml'
  const fileName = path.parse(new URL(pluginConfig.url).pathname).name + '.' + extension
  const file = `${dir}/${fileName}`

  // this is used only in dev
  if (await fs.pathExists(file)) {
    await log.warning(`Le fichier ${file} existe déjà`)
  } else {
    // creating empty file before streaming seems to fix some weird bugs with NFS
    await fs.ensureFile(file)
    await log.info(`Récupération du fichier ${file}`)

    await pump(res.data, fs.createWriteStream(file))
    await log.info(`Fichier récupéré dans ${file}`)
  }

  if (extension === 'zip') {
    // Try to prevent weird bug with NFS by forcing syncing file before reading it
    const fd = await fs.open(file, 'r')
    await fs.fsync(fd)
    await fs.close(fd)

    await log.info(`Extraction de l'archive ${file}`)
    try {
      await exec(`unzip -o ${file} -d ${dir} && for file in ${dir}/*.xml; do mv "$file" "${dir}/${fileName.split('.')[0]}.xml"; done`)
    } catch (err) {
      log.warning('Impossible d\'extraire l\'archive, le fichier est peut-être déjà extrait')
    }
    // remove the zip file
    await fs.remove(file)
  }
}
