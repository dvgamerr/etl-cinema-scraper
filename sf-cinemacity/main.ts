import { Page } from "https://deno.land/x/puppeteer@14.1.1/mod.ts"
import dayjs from "https://cdn.skypack.dev/dayjs@1.11.4";

export function scrapingCinema(elements: any): CinemaItem[] {
  const cinema: CinemaItem[] = []
  for (const e of elements) {
    const eLink = e.querySelector('a')
    const display = eLink.getAttribute('title')
    const link = eLink.getAttribute('href')
    const image = e.querySelector('.poster > .image').style['background-image']
    const [, cover] = image.match(/url\("(.+?)"\)/i)

    let name = display.toLowerCase()
    if (/,.the$/ig.test(name)) { name = `the ${name.replace(/,.the$/i, '')}` }

    cinema.push({
      name: `${name.replace(/\W+/ig, '-').replace(/^\W+|\W+$/ig, '')}`,
      display,
      genre: '',
      time: '',
      release: new Date(),
      cover,
      url: `https://www.sfcinemacity.com${link.replace('/showtime', '')}`,
      theater: ['sf']
    })
  }
  return cinema
}

export function scrapingCinemaDetail(element: any): { genre: string, time: string, release: string } {
  return {
    release: element.querySelector('.release > span:last-child').textContent,
    genre: element.querySelector('.genre > span:last-child').textContent,
    time: element.querySelector('.system > span:last-child').textContent
  }
}

export async function SearchMovieNowShowing(page: Page) {
  await page.goto('https://www.sfcinemacity.com/movies/now-showing')
  await page.waitForNetworkIdle()
  await page.click('.lang-switcher li:last-child > a')

  const eMovieCard = await page.waitForFunction(`document.querySelectorAll('.movies-now-showing > .movie-card')`)
  const cinema = await page.evaluate(scrapingCinema, eMovieCard)

  for await (const item of cinema) {
    await page.goto(item.url)
    await page.waitForSelector('.lang-switcher li.active:last-child > a')

    const eDetail = await page.waitForFunction(`document.querySelector('.movie-main-detail .detail-wrap')`)

    const detail = await page.evaluate(scrapingCinemaDetail, eDetail)

    const release = dayjs(detail.release, "YYYY-MM-DD");
    if (release.isValid()) {
      item.release = release.toDate();
    }

    item.genre = detail.genre
    item.time = detail.time
  }
  return cinema
}

export async function SearchMovieComming(page: Page) {
  await page.goto('https://www.sfcinemacity.com/movies/coming-soon')
  await page.waitForNetworkIdle()
  await page.click('.lang-switcher li:last-child > a')
  await page.waitForSelector('.lang-switcher li.active:last-child > a')

  const eMovieCard = await page.waitForFunction(`document.querySelectorAll('.movies-coming-soon > .movie-card')`)
  const cinema = await page.evaluate(scrapingCinema, eMovieCard)

  for await (const item of cinema) {
    await page.goto(item.url)
    await page.waitForSelector('.lang-switcher li.active:last-child > a')

    const eDetail = await page.waitForFunction(`document.querySelector('.movie-main-detail .detail-wrap')`)

    const detail = await page.evaluate(scrapingCinemaDetail, eDetail)

    const release = dayjs(detail.release, "YYYY-MM-DD");
    if (release.isValid()) {
      item.release = release.toDate();
    }

    item.genre = detail.genre
    item.time = detail.time
  }
  return cinema
}
