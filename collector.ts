import { existsSync } from "https://deno.land/std@0.91.0/fs/mod.ts";

const collectorPath = `./output`

export const dirName = collectorPath

export function getId(webElement: { [key: string]: string }): string {
  const [eId] = Object.keys(webElement)
  return webElement[eId]
}
// Deno.lstat("hello.txt");
// Deno.readTextFile("./people.json");
// Deno.writeTextFile("./people.json");

export async function JSONRead(): Promise<CinemaItem> {
  const cinema: CinemaItem = {}
  if (!existsSync(collectorPath)) return cinema
  for await (const file of Deno.readDir(collectorPath)) {
    if ((await Deno.lstat(`${collectorPath}/${file.name}`)).isDirectory) continue
    const data = await Deno.readTextFile(`${collectorPath}/${file}`)
    cinema[file.name] = JSON.parse(data.toString())
  }
  return cinema
}

// deno-lint-ignore no-explicit-any
export async function JSONWrite(filename: string, data: any) {
  if (!existsSync(collectorPath)) await Deno.mkdir(collectorPath, { recursive: true })
  await Deno.writeTextFile(`${collectorPath}/${filename}.json`, JSON.stringify(data, null, 2))
}
