import { logger, parseArgs } from './untils'
import { JSONRead, standardizeCinemaEntries } from './untils/collector'
import dayjs from 'dayjs'
import weekday from 'dayjs/plugin/weekday'
import weekOfYear from 'dayjs/plugin/weekOfYear'

import { JSONWrite } from './untils/collector'
import cinemaScraper from './plugins/cinema-scraper'
import { name, version } from './package.json'

dayjs.extend(weekday)
dayjs.extend(weekOfYear)

let rawItems = []
if (parseArgs.dryrun) {
  const major = await JSONRead('major-cineplex.json')
  const sf = await JSONRead('sf-cinemacity.json')
  rawItems = [...major, ...sf]
} else {
  rawItems = await cinemaScraper()
}

logger.info('Stardardize cinema WebScraping...')
const cinemaItems = await standardizeCinemaEntries(rawItems)
const chunkSize = 50
const cinemaChunks = []
for (let i = 0; i < cinemaItems.length; i += chunkSize) {
  cinemaChunks.push(cinemaItems.slice(i, i + chunkSize))
}

logger.info(` Split ${cinemaChunks.length} chunks, up ${chunkSize} records.`)

logger.info('Saving cinema...')
if (parseArgs.output === 'file') {
  await JSONWrite('results.json', cinemaItems)
} else {
  console.log(cinemaItems[0])
}

if (!Bun.env.RECEIVER_API) {
  logger.info(`Total: ${cinemaItems.length} movies`)
  process.exit(0)
}

logger.info(`Uploading total: ${cinemaItems.length} movies`)

for (const chunks of cinemaChunks) {
  const res = await fetch(`${Bun.env.RECEIVER_API}/stash/cinema`, {
    method: 'POST',
    headers: {
      Authorization: Bun.env.RECEIVER_AUTH,
      'Content-Type': 'application/json',
      'User-Agent': `${name}/${version}`,
    },
    body: JSON.stringify(chunks),
  })
  if (!res.ok) {
    logger.error(`Upload fail: ${JSON.stringify(await res.json())}`)
  }
}
logger.info(`Uploaded`)
