const xml2js = require('xml2js')
const parser = new xml2js.Parser({ explicitRoot: false, explicitArray: false, attrkey: 'Val', mergeAttrs: false })
const path = require('path')
const dot = require('dot-object')
const converter = require('json-2-csv')
const fs = require('fs-extra')

const flatten = function (obj, separateur) {
  const flatObj = {}

  // Recursive function to process each property of the object
  function flattenRecursive (obj, prefix = '') {
    // Loop through all properties of the object
    for (const prop in obj) {
      let test = false
      // Check if the object contains an object, if not, we keep the property
      for (const prop2 in obj[prop]) {
        if (typeof (obj[prop][prop2]) === 'object') {
          test = true
        }
      }
      if (typeof obj[prop] === 'object' && obj[prop] !== null && test) {
        // Recursive call to process the object
        flattenRecursive(obj[prop], prefix + prop + separateur)
      } else {
        // Process simple properties
        flatObj[prefix + prop] = obj[prop]
      }
    }
  }

  flattenRecursive(obj)

  return flatObj
}
const flattenObject = function (obj, prefix = '', separateur) {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + separateur : ''
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k, separateur))
    } else {
      acc[pre + k] = obj[k]
    }
    return acc
  }, {})
}

module.exports = async (processingConfig, tmpDir, axios, log) => {
  await log.step('Traitement du fichier')
  const tab = []
  const fileName = path.parse(new URL(processingConfig.url).pathname).name
  const data = await fs.readFile(path.join(tmpDir, fileName + '.xml'))
  await log.info('Fichier lu')
  const result = await parser.parseStringPromise(data)
  await log.info('Fichier parsé')
  const obj = await dot.dot(result)
  await dot.object(obj)
  let nb = 0
  Object.keys(obj).forEach(_ => {
    nb++
  })
  for (const key in obj) {
    if (key !== 'Val' || nb === 1) {
      for (const key2 in obj[key]) {
        obj[key][key2] = flatten(obj[key][key2], processingConfig.separateur)
        tab.push(obj[key][key2])
      }
    }
  }
  if (processingConfig.datasetMode === 'create' || processingConfig.datasetMode === 'update') {
    const csv = await converter.json2csv(tab)
    await log.info('Données converties en format csv')
    const lines = csv.split('\n')
    const newHeader = lines[0].replace(/\./g, processingConfig.separateur)
    lines[0] = newHeader
    const newCsv = lines.join('\n')
    const fileNameCSV = fileName + '.csv'
    await fs.writeFile(path.join(tmpDir, fileNameCSV), newCsv)
    await log.info('Fichier csv créé')
    await fs.remove(path.join(tmpDir, fileName + '.xml'))
  } else if (processingConfig.datasetMode === 'lines') {
    log.step('Mettre à jour des lignes d\'un jeu de données (incrémental)')
    for (let i = 0; i < tab.length; i++) {
      tab[i] = flattenObject(tab[i], '', processingConfig.separateur)
    }
    const datasetSchema = await axios.get(`api/v1/datasets/${processingConfig.dataset.id}/schema`, {
      params: {
        mimeType: 'application/json',
        enum: false,
        calculated: false
      }
    })

    for (let i = 0; i < tab.length; i++) {
      const lines = tab[i]
      const newLines = {}

      for (const [key, value] of Object.entries(lines)) {
        let expectedType = 'string'
        for (let j = 0; j < datasetSchema.data.length; j++) {
          if (key === datasetSchema.data[j].key) {
            expectedType = datasetSchema.data[j].type
          }
        }

        let validatedValue
        if (expectedType !== String(typeof (value))) {
          switch (expectedType) {
            case 'string':
              validatedValue = String(value)
              break
            case 'number':
              validatedValue = Number(value)
              break
            case 'boolean':
              validatedValue = Boolean(value)
              break
            case 'array':
              validatedValue = Array.isArray(value) ? value : [value]
              break
            case 'integer':
              validatedValue = parseInt(value)
              break
            default:
              log.warning(`Type ${expectedType} non pris en charge`)
              // Type non reconnu, on ne fait rien
              continue
          }
        } else {
          validatedValue = value
        }
        newLines[key] = validatedValue
      }
      tab[i] = newLines
    }
    return tab
  }
}
