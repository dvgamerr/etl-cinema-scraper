import { existsSync } from 'https://deno.land/std@0.91.0/fs/mod.ts';

const collectorPath = `./output`;

export const DirName = collectorPath;

export async function JSONRead(): Promise<CinemaJSON> {
  const cinema: CinemaJSON = {};
  if (!existsSync(collectorPath)) return cinema;
  for await (const file of Deno.readDir(collectorPath)) {
    const stats = await Deno.lstat(`${collectorPath}/${file.name}`);
    if (stats.isDirectory || !/\.json$/i.test(file.name)) continue;
    const data = await Deno.readTextFile(`${collectorPath}/${file.name}`);
    cinema[file.name] = JSON.parse(data.toString());
  }
  return cinema;
}

// deno-lint-ignore no-explicit-any
export async function JSONWrite(fileName: string, data: any) {
  if (!existsSync(collectorPath)) {
    await Deno.mkdir(collectorPath, { recursive: true });
  }
  await Deno.writeTextFile(
    `${collectorPath}/${fileName}.json`,
    JSON.stringify(data, null, 2),
  );
}
