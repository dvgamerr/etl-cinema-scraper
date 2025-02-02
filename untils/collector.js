import { mkdir } from 'node:fs/promises'
import { logger } from '.'
const collectorPath = `./output`

export const DirName = collectorPath

export async function JSONRead(fileName) {
  const cinema = {}
  const collFile = Bun.file(`${collectorPath}/${fileName}`)
  if (!(await collFile.exists())) return cinema
  const contents = await collFile.json()
  return contents
}

export async function JSONWrite(fileName, data) {
  await mkdir(collectorPath, { recursive: true })

  await Bun.write(`${collectorPath}/${fileName}`, JSON.stringify(data, null, 2))
}

export const standardizeCinemaEntries = async (items = []) => {
  for (let i = items.length - 1; i >= 0; i--) {
    const [name] =
      items[i].name
        .toLowerCase()
        .replace(/^\W+|\W+$/gi, '')
        .replace(/\W+/gi, '-')
        .match(/[\w-]+/i) || []

    if (!name) {
      logger.warning(`can't parse cinema '${JSON.stringify(items[i].theater)}'`)
      items.splice(i, 1)
      continue
    }
    delete items[i].display
    items[i].bind = name
    items[i].name_en = name
    items[i].name_th = name

    const [time] = (items[i].timeMin || '').match(/^\d+/i) || ['0']
    if (!isNaN(parseInt(time))) items[i].time = parseInt(time)
    delete items[i].timeMin

    for (let l = 0; l < items.length; l++) {
      if (l == i) continue

      if (items[l].name === items[i].name) {
        items[i].theater = { ...items[l].theater, ...items[i].theater }
        items[i].name_en = items[i].name_en || items[l].name_en
        items[i].name_th = items[i].name_th || items[l].name_th
        items[i].genre = items[i].genre || items[l].genre
        items[i].release = items[i].release || items[l].release
        items[i].time = !items[i].time ? items[i].time : items[l].time
        items[i].timeMin = items[i].timeMin || items[l].timeMin
        items.splice(l, 1)
        break
      }
    }
  }
  return items
}
