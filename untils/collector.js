import { mkdir } from "node:fs/promises"
import { logger } from './'

const collectorPath = `./output`

export const DirName = collectorPath

export async function JSONRead() {
  const cinema = {}
  const collFile = Bun.file(collectorPath)

  if (!await collFile.exists()) return cinema
  // for await (const file of Deno.readDir(collectorPath)) {

  // const text = await collFile.text();
  //   const data = await Bun.readTextFile(`${collectorPath}/${file.name}`)
  //   cinema[file.name] = JSON.parse(text)
  // }
  return cinema
}

export async function JSONWrite(fileName, data) {
  await mkdir(collectorPath, { recursive: true })
  // const collFile = Bun.file(collectorPath)
  // if (!await collFile.exists()) {
  //   await Deno.mkdir(collectorPath, { recursive: true })
  // }
  await Bun.write(`${collectorPath}/${fileName}.json`, JSON.stringify(data, null, 2))
}
