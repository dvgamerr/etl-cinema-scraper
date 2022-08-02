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

//   it("Normailize data and save collection", async (browser) => {
//     await browser.assert.elementPresent("#movie-page-coming");
//     if (cinemaItems.length == 0) throw new Error("Cinema is Empty.");
//     // cinemaItems = await JSONRead()
//     for (let i = cinemaItems.length - 1; i >= 0; i--) {
//       const [, name] = /([\w-]+)/gi.exec(cinemaItems[i].name);
//       if (!name) {
//         cinemaItems[i].name = name.replace(/-$|^-/gi, "");
//       }

//       const release = dayjs(cinemaItems[i].release, "DD MMM YYYY");
//       if (release.isValid()) {
//         cinemaItems[i].release = release.toDate();
//       }
//       let [, time] = /(\d+)/gi.exec(cinemaItems[i].time);
//       time = parseInt(time);
//       if (!isNaN(time)) {
//         cinemaItems[i].time = time;
//       }

//       for (let l = 0; l < cinemaItems.length; l++) {
//         if (l >= i) {
//           break;
//         }

//         if (cinemaItems[l].name === cinemaItems[i].name) {
//           cinemaItems.splice(i, 1);
//           break;
//         }
//       }
//     }

//     await JSONWrite(basename(__dirname), cinemaItems);
//   });

//   // it('Validatetion data collector', async (browser) => {
//   //   for (const cinema of cinemaItems) {
//   //     console.log(cinema.name)
//   //   }
//   // })
// });
