import puppeteer from 'puppeteer'

import { logger } from '../untils'
// import * as sf from './sf-cinemacity'
import * as major from './major-cineplex'

import { JSONWrite } from '../untils/collector'
// import flexCarousel from "./untils/line-flex"

const isDev = Bun.env.ENV !== 'production'

export default async () => {
  logger.info('Puppeteer create launcher...')
  // const db = new duckdb.Database(':memory:')
  const browser = await puppeteer.launch({
    headless: !isDev,
    args: isDev ? ['--fast-start', '--no-sandbox'] : ['--no-sandbox', '--disable-setuid-sandbox', '--headless', '--disable-gpu'],
  })

  // Major Cineplex
  logger.info('New page `https://www.majorcineplex.com`')
  const majorPage = await browser.newPage()
  await majorPage.setViewport({ width: 1440, height: 990 })
  logger.info(' * Now Showing & Comming Soon')

  const majorMovies = await major.SearchMovieAll(majorPage)

  await majorPage.close()

  logger.info(' * Caching Json')
  await JSONWrite('major-cineplex.json', majorMovies)

  // // SF Cinema
  // logger.info('New page `https://www.sfcinemacity.com/`')
  // let sfPage = await browser.newPage()
  // await sfPage.setViewport({ width: 1440, height: 990 })
  // logger.info(' * Now Showing...')
  // const sfShowing = await sf.SearchMovieNowShowing(sfPage)
  // await sfPage.close()

  // logger.info(' * Comming Soon...')
  // sfPage = await browser.newPage()
  // const sfComming = await sf.SearchMovieComming(sfPage)
  // await sfPage.close()

  // logger.info(' * Caching Json')
  // await JSONWrite('sf-cinemacity.json', sfShowing.concat(sfComming))

  await browser.close()

  // return [].concat(majorShowing, majorCooming, sfShowing, sfComming)
  return majorMovies
}
