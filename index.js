import { logger, parseArgs } from './untils'
import { JSONRead, standardizeCinemaEntries } from './untils/collector'
import dayjs from 'dayjs'
import weekday from 'dayjs/plugin/weekday'
import weekOfYear from 'dayjs/plugin/weekOfYear'

import { JSONWrite } from './untils/collector'
import cinemaScraper from './plugins/cinema-scraper'
// import flexCarousel from "./untils/line-flex"

dayjs.extend(weekday)
dayjs.extend(weekOfYear)

// async function LINEFlexRequest(message, items) {
//   const res = await fetch(`http://notice.touno.io/line/popcorn/movie`, {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(flexCarousel(message, items)),
//   })

//   const body = await res.json()
//   logger.info(`notice.touno.io (${res.status}): ${JSON.stringify(body)}`)
// }

let rawItems = []
if (parseArgs.dryrun === true) {
  const major = await JSONRead('major-cineplex.json')
  const sf = await JSONRead('sf-cinemacity.json')
  rawItems = [...major, ...sf]
} else {
  rawItems = await cinemaScraper()
}

logger.info('Stardardize cinema WebScraping...')
const cinemaItems = await standardizeCinemaEntries(rawItems)
logger.info('Saving cinema...')
if (parseArgs.output === 'file') {
  await JSONWrite('results.json', cinemaItems)
} else {
  console.log(cinemaItems[0])
}

logger.info(`Uploading total: ${cinemaItems.length} movies`)
// logger.info(`${normalizeItems.length} movies normalizer`)

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
