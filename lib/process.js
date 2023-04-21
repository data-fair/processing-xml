const xml2js = require('xml2js')
const parser = new xml2js.Parser({ explicitRoot: false, explicitArray: false, attrkey: 'Val', mergeAttrs: false })
const path = require('path')
const dot = require('dot-object')
const converter = require('json-2-csv')
const fs = require('fs-extra')

const flatten = function (obj, separateur) {
  const flatObj = {}

  // Fonction récursive pour traiter chaque propriété de l'objet
  function flattenRecursive (obj, prefix = '') {
    // Parcours de toutes les propriétés de l'objet
    for (const prop in obj) {
      // Vérifie si la propriété est un objet ou un tableau
      let test = false
      // On vérifie si l'objet contient un objet si non on le gardera tel quel
      for (const prop2 in obj[prop]) {
        if (typeof (obj[prop][prop2]) === 'object') {
          test = true
        }
      }
      if (typeof obj[prop] === 'object' && obj[prop] !== null && test) {
        // Appel récursif pour traiter l'objet
        flattenRecursive(obj[prop], prefix + prop + separateur)
      } else {
        // Traitement des propriétés simples
        flatObj[prefix + prop] = obj[prop]
      }
    }
  }

  flattenRecursive(obj)

  return flatObj
}

module.exports = async (processingConfig, tmpDir, axios, log) => {
  await log.step('Traitement du fichier')
  if (processingConfig.datasetMode === 'create' || processingConfig.datasetMode === 'update') {
    const tab = []

    const fileName = path.parse(new URL(processingConfig.url).pathname).name
    fs.readFile(path.join(tmpDir, fileName + '.xml'), function (err, data) {
      parser.parseString(data, function (err, result) {
        const obj = dot.dot(result)
        dot.object(obj)

        for (const key in obj) {
          for (const key2 in obj[key]) {
            obj[key][key2] = flatten(obj[key][key2], processingConfig.separateur)
            tab.push(obj[key][key2])
          }
        }

        converter.json2csv(tab)
          .then(async (csv) => {
            const lines = csv.split('\n')
            const newHeader = lines[0].replace(/\./g, processingConfig.separateur)
            lines[0] = newHeader
            const newCsv = lines.join('\n')
            const fileNameCSV = fileName + '.csv'
            fs.createWriteStream(path.join(tmpDir, fileNameCSV)).write(newCsv)
          })
          .catch((err) => log.error('ERROR: ', +err.message))
      })
    }
    )
  }
}
