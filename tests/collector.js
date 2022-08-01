const { existsSync } = require('fs')
const fs = require('fs/promises')

const collectorPath = `./tests_output`

module.exports = {
  dirName: collectorPath,
  getId: (e) => {
    return e[Object.keys(e)[0]]
  },
  JSONRead: async () => {
    if (!existsSync(collectorPath)) return []
    for await (const file of await fs.readdir(collectorPath)) {
      if ((await fs.lstat(`${collectorPath}/${file}`)).isDirectory()) continue
      const data = await fs.readFile(`${collectorPath}/${file}`, { encoding: 'UTF-8' })
      return JSON.parse(data.toString())
    }
  },
  JSONWrite: async (baseName, jsonArray) => {
    if (!existsSync(collectorPath)) await fs.mkdir(collectorPath, { recursive: true })
    await fs.writeFile(`${collectorPath}/${baseName}.json`, JSON.stringify(jsonArray, null, 2))
  }
}
