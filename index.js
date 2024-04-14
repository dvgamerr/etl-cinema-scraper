import puppeteer from 'puppeteer'
import duckdb from 'duckdb'
import { parseArgs } from "util"

import { logger } from './untils'
import * as sf from './plugins/sf-cinemacity'
import * as major from './plugins/major-cineplex'
import dayjs from 'dayjs'
import weekday from 'dayjs/plugin/weekday'
import weekOfYear from 'dayjs/plugin/weekOfYear'

import { JSONWrite } from "./untils/collector"
// import flexCarousel from "./untils/line-flex"

dayjs.extend(weekday)
dayjs.extend(weekOfYear)

const { values: argv } = parseArgs({
  args: Bun.argv,
  options: {
    output: { short: 'o', type: 'string' }
  },
  strict: true,
  allowPositionals: true,
})
if (argv.output !== 'file') {
  logger.level = 'error'
}

// async function LINEFlexRequest(message, items) {
//   const res = await fetch(`http://notice.touno.io/line/popcorn/movie`, {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(flexCarousel(message, items)),
//   })

//   const body = await res.json()
//   logger.info(`notice.touno.io (${res.status}): ${JSON.stringify(body)}`)
// }

const isDev = Bun.env.ENV !== "production"

logger.info("Puppeteer create launcher...")
const db = new duckdb.Database(':memory:')
const browser = await puppeteer.launch({
  headless: isDev,
  args: isDev
    ? ["--fast-start", "--no-sandbox"]
    : [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--headless",
        "--disable-gpu",
      ],
})

// Major Cineplex
logger.info("New page `https://www.majorcineplex.com`")
const majorPage = await browser.newPage()
await majorPage.setViewport({ width: 1440, height: 990 })
logger.info(" * Now Showing & Comming Soon")

const majorShowing = await major.SearchMovieNowShowing(majorPage)
const majorCooming = await major.SearchMovieCommingSoon(majorPage)

await majorPage.close()

logger.info(" * Caching Json")
await JSONWrite("major-cineplex", majorShowing.concat(majorCooming))

// SF Cinema
logger.info("New page `https://www.sfcinemacity.com/`")
let sfPage = await browser.newPage()
await sfPage.setViewport({ width: 1440, height: 990 })
logger.info(" * Now Showing...")
const sfShowing = await sf.SearchMovieNowShowing(sfPage)
await sfPage.close()

logger.info(" * Comming Soon...")
sfPage = await browser.newPage()
const sfComming = await sf.SearchMovieComming(sfPage)
await sfPage.close()

logger.info(" * Caching Json")
await JSONWrite("sf-cinemacity", sfShowing.concat(sfComming))

await browser.close()

const cinemaItems = [].concat(majorShowing, majorCooming, sfShowing, sfComming)

logger.info("Normalize data collection")
for (let i = cinemaItems.length - 1; i >= 0; i--) {
  const [name] =
    cinemaItems[i].name
      .toLowerCase()
      .replace(/^\W+|\W+$/gi, "")
      .replace(/\W+/gi, "-")
      .match(/[\w-]+/i) || []

  if (!name) {
    logger.warning(`can't parse cinema name '${cinemaItems[i].url}'`)
    cinemaItems.splice(i, 1)
    continue
  }
  cinemaItems[i].name = name

  const [time] = (cinemaItems[i].timeMin || "").match(/^\d+/i) || ["0"]
  if (!isNaN(parseInt(time))) {
    cinemaItems[i].time = parseInt(time)
  }
  delete cinemaItems[i].timeMin

  for (let l = 0; l < cinemaItems.length; l++) {
    if (l == i) continue

    if (cinemaItems[l].name === cinemaItems[i].name) {
      cinemaItems[l].theater = Array.from(
        new Set(cinemaItems[i].theater.concat(cinemaItems[l].theater))
      )
      cinemaItems.splice(i, 1)
      break
    }
  }
}

logger.info("Saving WebScraping")
if (argv.output === 'file') {
  await JSONWrite("web-scraping", cinemaItems)
  process.exit()
}
console.log(JSON.stringify(cinemaItems))

// const data = await JSONRead()
// const cinemaItems = data['web-scraping.json']
// console.logger(Bun.env.APIS, Bun.env.TOKEN)

// if (!Bun.env.APIS || !Bun.env.TOKEN) {
//   logger.warning("Skip: Uploaded")
//   Deno.exit()
// }

logger.info(`Uploading (${cinemaItems.length} movie) WebScraping`)

// const collector = await fetch(`${Bun.env.APIS}/api/collector/cinema`, {
//   method: "PUT",
//   headers: {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${Bun.env.TOKEN}`,
//   },
//   body: JSON.stringify(cinemaItems),
// })

// if (collector.status !== 200) {
//   const body = await collector.json()
//   logger.error(`Uploaded: ${JSON.stringify(body)}`)
//   Deno.exit()
// } else {
//   logger.info(" * Uploaded")
// }

// if (dayjs().day() !== 1) {
//   Deno.exit()
// }

// const res = await fetch(`${Bun.env.APIS}/api/cinema`, {
//   method: "GET",
//   headers: {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${Bun.env.TOKEN}`,
//   },
// })

// const body = await res.json()
// if (res.status !== 200) {
//   logger.error(`Cinema: ${JSON.stringify(body)}`)
//   Deno.exit()
// }

// const limitFlex = 10
// const groupFlex = Math.ceil(body.length / limitFlex)
// logger.info(`LINE Flex ${groupFlex} sacle`)

// for (let i = 0; i < groupFlex; i++) {
//   await LINEFlexRequest(
//     `ป๊อปคอนขอเสนอ โปรแกรมหนังประจำสัปดาห์ที่ ${dayjs().week()} ปี ${dayjs().year()}${
//       groupFlex > 1 ? ` [${i}/${groupFlex}]` : ""
//     } ครับผม`,
//     body.slice(limitFlex * i, limitFlex * (i + 1))
//   )
// }
