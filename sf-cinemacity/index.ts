import { Page } from "https://deno.land/x/puppeteer@14.1.1/mod.ts"
import dayjs from "https://cdn.skypack.dev/dayjs@1.11.4";

export async function SearchMovieNowShowing(page: Page) {
  await page.goto('https://www.sfcinemacity.com/movies/now-showing')
  await page.waitForSelector('.movies-now-showing > .movie-card')
  await page.click('.lang-switcher li:last-child > a')

  const eMovieCard = await page.waitForFunction(`document.querySelectorAll('.movies-now-showing > .movie-card[type="now-showing"]')`)

  const cinema: CinemaItem[] = await page.evaluate((eMovieCard: any): CinemaItem[] => {
    const cinema: CinemaItem[] = []
    for (const e of eMovieCard) {
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
  }, eMovieCard)

  for await (const e of cinema) {
    await page.goto(e.url)
    await page.waitForSelector('.lang-switcher li.active:last-child > a')

    const eDetail = await page.waitForFunction(`document.querySelector('.movie-main-detail .detail-wrap')`)

    const detail = await page.evaluate((eDetail: any): { genre: string, time: string, release: string } => {
      return {
        release: eDetail.querySelector('.release > span:last-child').textContent,
        genre: eDetail.querySelector('.genre > span:last-child').textContent,
        time: eDetail.querySelector('.system > span:last-child').textContent
      }
    }, eDetail)

    const release = dayjs(detail.release, "DD MMM YYYY");
    if (release.isValid()) {
      e.release = release.toDate();
    }

    e.genre = detail.genre
    e.time = detail.time
  }
  return cinema
}
