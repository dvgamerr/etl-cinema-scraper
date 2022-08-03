import { Page } from "https://deno.land/x/puppeteer@14.1.1/mod.ts";
import dayjs from "https://cdn.skypack.dev/dayjs@1.11.4";

export async function SearchMovieNowShowing(page: Page): Promise<CinemaItem[]> {
  await page.goto('https://www.majorcineplex.com/movie#movie-page-showing')
  await page.waitForNetworkIdle()
  await page.waitForSelector('a.change_lang[data-id="en"]')
  // await page.click('.change_lang[data-id="en"]')
  await page.waitForFunction(`$('a.change_lang[data-id="en"]').click()`)
  await page.waitForTimeout(3000)
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
  // await page.click('#coming-tab')
  // await page.waitForNetworkIdle()
  // await page.waitForSelector('a.change_lang[data-id="en"]')
  // await page.waitForFunction(`$('a.change_lang[data-id="en"]').click()`)
  // await page.waitForTimeout(3000)
  // await page.waitForSelector('div#movie-page-coming div.ml-box')

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
      time: parseInt(time),
      cover,
      url: `https://www.majorcineplex.com${link}`,
      theater: ["major"],
    })
  }
  return cinema
}


// const { basename } = require("path");
// const dayjs = require("dayjs");
// const { getId, JSONWrite } = require("../../../collector");

// let cinemaItems = [];

// const cinemaParse = async (browser, e) => {
//   const eId = getId(e);
//   const eDisplay = await browser
//     .pause(20)
//     .elementIdElement(eId, "css selector", "div.mlb-name > a");
//   const eRelease = await browser
//     .pause(20)
//     .elementIdElement(eId, "css selector", "div.mlb-date");
//   const eImg = await browser
//     .pause(20)
//     .elementIdElement(eId, "css selector", ".mlb-img");
//   const eGenres = await browser
//     .pause(20)
//     .elementIdElements(eId, "css selector", ".mlb-genres > span.genres_span");

//   if (!eDisplay || !eRelease || !eImg) {
//     console.log({ eId, eDisplay, eRelease, eImg, eGenres });
//     throw new Error("Element not found.");
//   }
//   if ((eGenres || []).length < 1) return false;

//   const [eGenre, eTime] = eGenres;
//   const cover = await browser.getAttribute(eImg, "src");
//   const release = await browser.getText(eRelease);
//   const display = await browser.getText(eDisplay);
//   const link = await browser.getAttribute(eDisplay, "href");
//   const genre = await browser.getText(eGenre);
//   const time = eTime ? await browser.getText(eTime) : "0 min";

//   cinemaItems.push({
//     name: basename(link).toLowerCase(),
//     display,
//     release,
//     genre,
//     time,
//     cover,
//     url: `https://www.majorcineplex.com${link}`,
//     theater: ["major"],
//   });

//   return true;
// };

// describe("Collection Major Cineplex", () => {
//   it("Search Movie now-showing", async (browser) => {
//     await browser.windowSize("current", 1440, 990);

//     const movies = await browser
//       .navigateTo("https://www.majorcineplex.com/movie#movie-page-showing")
//       .waitForElementPresent(".navrl-lang a.btn-lang")
//       .waitForElementVisible(".navrl-lang a.btn-lang")
//       .click(".navrl-lang a.btn-lang")
//       .pause(1000)
//       .waitForElementPresent('a.change_lang[data-id="en"]')
//       .click('a.change_lang[data-id="en"]')
//       .pause(1000)
//       .assert.elementPresent("#movie-page-showing")
//       .pause(1000)
//       .elements("css selector", "div#movie-page-showing div.ml-box");

//     for await (const e of movies) {
//       await cinemaParse(browser, e);
//     }
//   });

//   it("Search Movie coming-soon", async (browser) => {
//     const movies = await browser
//       .navigateTo("https://www.majorcineplex.com/movie#movie-page-coming")
//       .waitForElementPresent(".navrl-lang a.btn-lang")
//       .waitForElementVisible(".navrl-lang a.btn-lang")
//       .click(".navrl-lang a.btn-lang")
//       .pause(1000)
//       .waitForElementPresent('a.change_lang[data-id="en"]')
//       .click('a.change_lang[data-id="en"]')
//       .pause(1000)
//       .assert.elementPresent("#movie-page-coming")
//       .pause(1000)
//       .elements("css selector", "div#movie-page-coming div.ml-box");

//     for await (const e of movies) {
//       await cinemaParse(browser, e);
//     }
//   });
