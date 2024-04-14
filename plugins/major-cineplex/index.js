import { logger } from '../../untils'
import dayjs from 'dayjs'

export async function SearchMovieNowShowing(page) {
  logger.debug('Open majorcineplex')
  await page.goto('https://www.majorcineplex.com/movie#movie-page-showing')
  await page.waitForNetworkIdle()

  const selectLang = await page.$('#SelectLang')
  if (!selectLang) throw new Error('#SelectLang not exists')
  await selectLang.evaluate((e) => e.click())

  logger.debug(' a.change_lang')
  await page.waitForSelector('a.change_lang[data-id="en"]')
  await page.click('a.change_lang[data-id="en"]')
  logger.debug(' div#movie-page-showing')
  await page.waitForSelector('div#movie-page-showing div.ml-box')
  await Bun.sleep(1000)

  const cinemaItems = await scrapingCinema(await page.$$('div#movie-page-showing div.ml-box'))
  if (cinemaItems.length === 0) {
    logger.warn('SearchMovieNowShowing is empty')
    return []
  }

  for await (const e of cinemaItems) {
    const release = dayjs(e.release, 'DD MMM YYYY')
    if (release.isValid()) e.release = release.toDate()
  }

  return cinemaItems
}

export async function SearchMovieCommingSoon(page) {
  const cinemaItems = await scrapingCinema(await page.$$('div#movie-page-coming div.ml-box'))

  if (cinemaItems.length === 0) {
    logger.warn('SearchMovieCommingSoon is empty')
    return []
  }

  for await (const e of cinemaItems) {
    const release = dayjs(e.release, 'DD MMM YYYY')
    if (release.isValid()) e.release = release.toDate()
  }

  return cinemaItems
}

const scrapingCinema = async (elements) => {
  const cinema = []

  for await (const elem of elements) {
    const eDisplay = await elem.$('.mlb-name > a')
    const eRelease = await elem.$('div.mlb-date')
    const eImg = await elem.$('.mlb-cover')
    const eGenres = await elem.$$('.mlb-genres > span.genres_span') || []
    if (!eDisplay) continue


    const display = await eDisplay.evaluate((e) => e.textContent.trim())

    // if (!eRelease || !eImg || eGenres.length < 1) {
    //   logger.debug({ eRelease, eImg, eGenres })
    //   logger.warn(`Skip: ${display}`)
    // }

    let genre = ''
    let [timeMin] = ['0']
    if (eGenres.length > 0) {
      const [eGenre, eTime] = eGenres
      genre = await eGenre.evaluate((e) => e.textContent.trim())

      if (eTime) {
        [ timeMin ] = await eTime.evaluate((e) => e.textContent.match(/^\d+/i))
      }
    }

    let cover = ''
    if (eImg) {
      const imgStyle = await eImg.evaluate((e) => e.getAttribute('style'))
      const [ , img ] = /\((.*?)\)/.exec(imgStyle)
      cover = img
    }

    let release = ''
    if (eRelease) {
      release = await eRelease.evaluate((e) => e.textContent.trim())
    }

    const link = await eDisplay.evaluate((e) => e.getAttribute('href'))
    const [ name ] = link.replace('/movie/', '').replace(/\W+/ig, '-').match(/[\w-]+$/) || []

    cinema.push({
      name,
      display,
      release,
      genre,
      timeMin,
      time: 0,
      cover,
      url: `https://www.majorcineplex.com${link}`,
      theater: ['major'],
    })
  }
  return cinema
}
