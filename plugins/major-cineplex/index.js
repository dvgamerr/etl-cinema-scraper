import { logger } from '../../untils'
import dayjs from 'dayjs'

export async function SearchMovieAll(page) {
  logger.debug('Open majorcineplex')
  await page.goto('https://www.majorcineplex.com/movie#movie-page-showing')
  await page.waitForNetworkIdle()
  await Bun.sleep(5_000)
  await page.reload()
  await page.waitForNetworkIdle()

  const divShowingPage = 'div#movie-page-showing div.ml-box'
  const divComingPage = 'div#movie-page-coming div.ml-box'

  await Bun.sleep(1_000)

  const cinemaShowingTh = await scrapingCinema(await page.$$(divShowingPage))
  if (!cinemaShowingTh.length) {
    logger.warn('SearchMovieNowShowing is empty')
  }
  const cinemaComingTh = await scrapingCinema(await page.$$(divComingPage))
  if (!cinemaComingTh.length) {
    logger.warn('SearchMovieCommingSoon is empty')
  }

  await Bun.sleep(2_000)
  const selectLang = await page.$('#SelectLang')
  if (!selectLang) throw new Error('#SelectLang not exists')
  await selectLang.evaluate((e) => e.click())

  logger.debug(' a.change_lang')
  await page.waitForSelector('a.change_lang[data-id="en"]')
  await page.click('a.change_lang[data-id="en"]')
  logger.debug(' div#movie-page-showing')
  await page.waitForSelector('div#movie-page-showing div.ml-box')
  await Bun.sleep(2_000)

  const cinemaShowingEn = await scrapingCinema(await page.$$(divShowingPage))
  if (!cinemaShowingEn.length) {
    logger.warn('SearchMovieNowShowing is empty')
  }
  const cinemaComingEn = await scrapingCinema(await page.$$(divComingPage))
  if (!cinemaComingEn.length) {
    logger.warn('SearchMovieCommingSoon is empty')
  }

  for (const e of cinemaShowingEn) {
    const release = dayjs(e.release, 'DD MMM YYYY')
    if (release.isValid()) e.release = release.toDate()

    e.name_en = e.display
    e.name_th = cinemaShowingTh.find((x) => x.name === e.name)?.display || e.display
  }

  for (const e of cinemaComingEn) {
    const release = dayjs(e.release, 'DD MMM YYYY')
    if (release.isValid()) e.release = release.toDate()

    e.name_en = e.display
    e.name_th = cinemaComingTh.find((x) => x.name === e.name)?.display || e.display
  }

  return cinemaShowingEn.concat(cinemaComingEn)
}

// export async function SearchMovieCommingSoon(page) {
//   const cinemaItems = await scrapingCinema(await page.$$(divComingPage))

//   if (cinemaItems.length === 0) {
//     logger.warn('SearchMovieCommingSoon is empty')
//     return []
//   }

//   for await (const e of cinemaItems) {
//     const release = dayjs(e.release, 'DD MMM YYYY')
//     if (release.isValid()) e.release = release.toDate()
//   }

//   return cinemaItems
// }

const scrapingCinema = async (elements) => {
  const cinema = []

  for await (const elem of elements) {
    const eDisplay = await elem.$('.mlb-name > a')
    const eRelease = await elem.$('div.mlb-date')
    const eImg = await elem.$('.mlb-cover')
    const eGenres = (await elem.$$('.mlb-genres > span.genres_span')) || []
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
        ;[timeMin] = await eTime.evaluate((e) => e.textContent.match(/^\d+/i))
      }
    }

    let cover = ''
    if (eImg) {
      const imgStyle = await eImg.evaluate((e) => e.getAttribute('style'))
      const [, img] = /\((.*?)\)/.exec(imgStyle)
      cover = img
    }

    let release = ''
    if (eRelease) {
      release = await eRelease.evaluate((e) => e.textContent.trim())
    }

    const link = await eDisplay.evaluate((e) => e.getAttribute('href'))
    const [name] =
      link
        .replace('/movie/', '')
        .replace(/\W+/gi, '-')
        .match(/[\w-]+$/) || []

    cinema.push({
      name,
      name_en: '',
      name_th: '',
      display,
      release,
      genre,
      timeMin,
      time: 0,
      theater: {
        major: {
          cover,
          url: `https://www.majorcineplex.com${link}`,
        },
      },
    })
  }
  return cinema
}
