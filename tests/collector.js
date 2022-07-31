const { existsSync } = require('fs')
const fs = require('fs/promises')

const collectorPath = `./tests_output`

module.exports = {
  dirName: collectorPath,
  getId: (e) => {
    return e[Object.keys(e)[0]]
  },
  JSONWrite: async (baseName, jsonArray) => {
    if (!existsSync(collectorPath)) await fs.mkdir(collectorPath, { recursive: true })
    await fs.writeFile(`${collectorPath}/${baseName}.json`, JSON.stringify(jsonArray, null, 2))
  }
}
