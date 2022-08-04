import "https://deno.land/x/dotenv@v3.2.0/load.ts"
import puppeteer from 'https://deno.land/x/puppeteer@14.1.1/mod.ts'
import * as log from 'https://deno.land/std@0.149.0/log/mod.ts'
import * as sf from './sf-cinemacity/main.ts'
import * as major from './major-cineplex/main.ts'
import { JSONRead, JSONWrite } from './collector.ts'

const isDev = Deno.env.get('ENV') !== 'production'
await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: (log) => `[${new Date().toISOString()}] ${`[${log.levelName}]`.padEnd(10, ' ')} ${log.msg}`
    }),
    file: new log.handlers.RotatingFileHandler('INFO', {
      filename: `./output/main.log`,
      maxBytes: 15,
      maxBackupCount: 5,
      formatter: rec => JSON.stringify({ region: rec.loggerName, ts: rec.datetime, level: rec.levelName, data: rec.msg })
    })
  },
  loggers: { default: { level: "DEBUG", handlers: ["console"] }, file: { level: "INFO", handlers: ["file"] } },
})

log.debug('Puppeteer create launcher...')
const browser = await puppeteer.launch({
  headless: isDev,
  args: isDev ? ['--fast-start', '--disable-extensions', '--no-sandbox'] : ['--no-sandbox']
})
let majorShowing: CinemaItem[] = []
let majorCooming: CinemaItem[] = []

// Major Cineplex
log.debug('New page `https://www.majorcineplex.com`')
const majorPage = await browser.newPage()
await majorPage.setViewport({ width: 1440, height: 990 })
log.debug(' * Now Showing & Comming Soon')
majorShowing = await major.SearchMovieNowShowing(majorPage)
majorCooming = await major.SearchMovieCommingSoon(majorPage)
await majorPage.close()

log.debug(' * Caching Json')
await JSONWrite('major-cineplex', majorShowing.concat(majorCooming))

// SF Cinema
log.debug('New page `https://www.sfcinemacity.com/`')
let sfPage = await browser.newPage()
await sfPage.setViewport({ width: 1440, height: 990 })
log.debug(' * Now Showing...')
const sfShowing = await sf.SearchMovieNowShowing(sfPage)
await sfPage.close()

log.debug(' * Comming Soon...')
sfPage = await browser.newPage()
const sfComming = await sf.SearchMovieComming(sfPage)
await sfPage.close()

log.debug(' * Caching Json')
await JSONWrite('sf-cinemacity', sfShowing.concat(sfComming))

await browser.close()

const cinemaItems = majorShowing.concat(majorCooming, sfShowing, sfComming)

log.debug('Normalize data collection')
for (let i = cinemaItems.length - 1; i >= 0; i--) {
  const [name] = cinemaItems[i].name.toLowerCase()
    .replace(/^\W+|\W+$/ig, '')
    .replace(/\W+/ig, '-')
    .match(/[\w-]+/i) || []

  if (!name) {
    log.warning(`can't parse cinema name '${cinemaItems[i].url}'`)
    cinemaItems.splice(i, 1)
    continue
  }

  const [time] = (cinemaItems[i].timeMin || '').match(/^\d+/i) || ['0']
  if (isNaN(parseInt(time))) {
    console.warn(`can't parseInt time '${time}'`)
    continue
  }

  cinemaItems[i].time = parseInt(time)
  cinemaItems[i].name = name
  delete cinemaItems[i].timeMin

  for (let l = 0; l < cinemaItems.length; l++) {
    if (l == i) continue

    if (cinemaItems[l].name === cinemaItems[i].name) {
      cinemaItems[l].theater = Array.from(new Set(cinemaItems[i].theater.concat(cinemaItems[l].theater)))
      cinemaItems.splice(i, 1)
      break
    }
  }
}

log.debug('Saving WebScraping')
await JSONWrite('web-scraping', cinemaItems)

if (!Deno.env.get('APIS') || !Deno.env.get('TOKEN')) {
  log.warning('Skip: Uploaded')
  Deno.exit()
}

log.debug('Uploading WebScraping')
const res = await fetch(`${Deno.env.get('APIS')}/api/collector/cinema`, {
  method: 'PUT',
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${Deno.env.get('TOKEN')}`,
  },
  body: JSON.stringify(cinemaItems),
})

if (res.status !== 200) {
  const body = await res.json()
  log.error(`Uploaded: ${JSON.stringify(body)}`)
} else {
  log.debug(' * Uploaded')
}