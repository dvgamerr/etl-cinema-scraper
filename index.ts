import puppeteer from "https://deno.land/x/puppeteer@14.1.1/mod.ts"

const browser = await puppeteer.launch()
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 990 })
await page.goto("https://www.sfcinemacity.com/movies/now-showing")
await page.waitForSelector('.movies-now-showing > .movie-card')
await page.click('.lang-switcher li:last-child > a')

const element = await page.waitForSelector('.movies-now-showing > .movie-card[type="now-showing"]')
const text = await page.evaluate(element => element.textContent, element)
console.log(text)

await page.screenshot({ path: "example.png" })
await browser.close()

// await browser.close()
//   .assert.elementPresent('.lang-switcher')
//   .click('.lang-switcher li:last-child > a').pause(1000)
//   .assert.elementPresent('.movies-now-showing > .movie-card')
//   .elements('css selector', '.movies-now-showing > .movie-card[type="now-showing"]')