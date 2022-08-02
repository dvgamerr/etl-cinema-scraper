import puppeteer from 'https://deno.land/x/puppeteer@14.1.1/mod.ts'
import { SearchMovieNowShowing } from './sf-cinemacity/index.ts'
// import {
//   querySelectorMovieShowingCard
// } from './sf-cinemacity/dom.js'

const browser = await puppeteer.launch({
  'headless': true,
  'args': ['--fast-start', '--disable-extensions', '--no-sandbox'],
  // 'ignoreHTTPSErrors': true
})

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 990 })

const cinemaItems = await SearchMovieNowShowing(page)

console.log(cinemaItems)

await browser.close()

// await browser.close()
//   .assert.elementPresent('.lang-switcher')
//   .click('.lang-switcher li:last-child > a').pause(1000)
//   .assert.elementPresent('.movies-now-showing > .movie-card')
//   .elements('css selector', '.movies-now-showing > .movie-card[type='now-showing']')