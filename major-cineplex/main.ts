import { Page } from "https://deno.land/x/puppeteer@14.1.1/mod.ts";
import dayjs from "https://cdn.skypack.dev/dayjs@1.11.4";

export async function SearchMovieNowShowing(page: Page): Promise<CinemaItem[]> {
  await page.goto('https://www.majorcineplex.com/movie#movie-page-showing')
  await page.waitForNetworkIdle()

  const selectLang = await page.$('#SelectLang')
  if (!selectLang) throw new Error("#SelectLang not exists")
  await selectLang.evaluate(e => e.click())

  await page.click('a.change_lang[data-id="en"]')
  await page.waitForTimeout(300)
  await page.waitForSelector('a.change_lang[data-id="en"]')

  await page.waitForSelector('div#movie-page-showing div.ml-box')

  const eMovieCard = await page.waitForFunction(`document.querySelectorAll('div#movie-page-showing div.ml-box')`)
  const cinemaItems: CinemaItem[] = await page.evaluate(scrapingCinema, eMovieCard)

  for await (const e of cinemaItems) {
    const release = dayjs(e.release, "DD MMM YYYY")
    if (release.isValid()) { e.release = release.toDate() }
  }

  return cinemaItems
}

export async function SearchMovieCommingSoon(page: Page): Promise<CinemaItem[]> {

  const eMovieCard = await page.waitForFunction(`document.querySelectorAll('div#movie-page-coming div.ml-box')`)
  const cinemaItems: CinemaItem[] = await page.evaluate(scrapingCinema, eMovieCard)

  for await (const e of cinemaItems) {
    const release = dayjs(e.release, "DD MMM YYYY")
    if (release.isValid()) { e.release = release.toDate() }
  }

  return cinemaItems
}


export function scrapingCinema(elements): CinemaItem[] {
  const cinema: CinemaItem[] = []
  for (const e of elements) {

    const eDisplay = e.querySelector('div.mlb-name > a')
    const eRelease = e.querySelector('div.mlb-date')
    const eImg = e.querySelector('.mlb-img')
    const eGenres = e.querySelectorAll('.mlb-genres > span.genres_span') || []

    if (!eDisplay || !eRelease || !eImg) {
      console.log('Skip:', eDisplay.textContent)
      continue
    }

    if ((eGenres).length < 1) continue

    const [eGenre, eTime] = eGenres
    const cover = eImg.getAttribute('src')
    const release = eRelease.textContent.trim()
    const display = eDisplay.textContent.trim()
    const link = eDisplay.getAttribute('href')
    const genre = eGenre.textContent.trim()
    const [time]: string = eTime ? eTime.textContent.match(/^\d+/i) : ['0']

    if (isNaN(parseInt(time))) {
      console.warn(`can't parseInt time '${time}'`);
      continue
    }

    const [name] = link.replace('/movie/', '').replace(/\W+/ig, '-').match(/[\w-]+$/) || []

    cinema.push({
      name,
      display,
      release,
      genre,
      timeMin: time,
      cover,
      url: `https://www.majorcineplex.com${link}`,
      theater: ["major"],
      time: 0
    })
  }
  return cinema
}
