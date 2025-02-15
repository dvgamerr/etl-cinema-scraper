import puppeteer from 'puppeteer'

import { logger } from '../untils'
import * as sf from './sf-cinemacity'
import * as major from './major-cineplex'
import agent from './major-cineplex/agents.json'

import { JSONWrite } from '../untils/collector'
// import flexCarousel from "./untils/line-flex"

const isDev = Bun.env.ENV !== 'production'

const randomUserAgent = agent[Math.floor(Math.random() * agent.length)]
export default async () => {
  logger.info('Puppeteer create launcher...')
  // const db = new duckdb.Database(':memory:')
  const browser = await puppeteer.launch({
    headless: !isDev,
    headers: {
      'User-Agent': randomUserAgent,
    },
    timeout: 60000,
    args: isDev ? ['--fast-start', '--no-sandbox'] : ['--no-sandbox', '--disable-gpu', '--headless', '--no-experiments'],
  })

  let majorMovies = []
  try {
    // Major Cineplex
    logger.info('New page `https://www.majorcineplex.com`')
    const majorPage = await browser.newPage()
    await majorPage.setViewport({ width: 1440, height: 990 })
    logger.info(' * Now Showing & Comming Soon')

    majorMovies = await major.SearchMovieAll(majorPage)

    await majorPage.close()

    logger.info(' * Caching Json')
    await JSONWrite('major-cineplex.json', majorMovies)
  } catch (ex) {
    logger.warn(ex)
  }

  let sfShowing = []
  let sfComming = []
  try {
    // SF Cinema
    logger.info('New page `https://www.sfcinemacity.com/`')
    let sfPage = await browser.newPage()
    await sfPage.setViewport({ width: 1440, height: 990 })
    logger.info(' * Now Showing...')
    sfShowing = await sf.SearchMovieNowShowing(sfPage)
    await sfPage.close()

    logger.info(' * Comming Soon...')
    sfPage = await browser.newPage()
    sfComming = await sf.SearchMovieComming(sfPage)
    await sfPage.close()

    logger.info(' * Caching Json')
    await JSONWrite('sf-cinemacity.json', sfShowing.concat(sfComming))
  } catch (ex) {
    logger.warn(ex)
  }

  await browser.close()

  return [].concat(majorMovies, sfShowing, sfComming)
}
