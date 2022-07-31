const { basename } = require('path')
const { getId, JSONWrite } = require('../../collector')

const cinemaItems = []

const cinemaParse = async (browser, e) => {
  const eId = getId(e)
  const eDisplay = await browser.pause(20).elementIdElement(eId, 'css selector', 'div.mlb-name > a')
  const eRelease = await browser.pause(20).elementIdElement(eId, 'css selector', 'div.mlb-date')
  const eImg = await browser.pause(20).elementIdElement(eId, 'css selector', '.mlb-img')
  const eGenres = await browser.pause(20).elementIdElements(eId, 'css selector', '.mlb-genres > span.genres_span')

  if (!eDisplay || !eRelease || !eImg) {
    console.log({ eId, eDisplay, eRelease, eImg, eGenres })
    throw new Error('Element not found.')
  }
  if ((eGenres || []).length < 1) return false

  const [ eGenre, eTime ] = eGenres
  const cover = await browser.getAttribute(eImg, 'src')
  const release = await browser.getText(eRelease)
  const display = await browser.getText(eDisplay)
  const link = await browser.getAttribute(eDisplay, 'href')
  const genre = await browser.getText(eGenre)
  const time = eTime ? await browser.getText(eTime) : '0 min'
  
  cinemaItems.push({
    name: basename(link).toLowerCase(),
    display,
    release,
    genre,
    time,
    cover,
    link: `https://www.majorcineplex.com${link}`,
    major: true
  })

  return true
}

describe('Collection Major Cineplex', () => {
  it('Search Movie now-showing', async (browser) => {
    await browser.windowSize('current', 1440, 990);

    const movies = await browser
      .navigateTo('https://www.majorcineplex.com/movie#movie-page-showing')
      .waitForElementPresent('.navrl-lang a.btn-lang')
      .click('.navrl-lang a.btn-lang').pause(1000)
      .waitForElementPresent('.navrl-lang a.change_lang[data-id="en"]')
      .click('a.change_lang[data-id="en"]').pause(1000)
      .assert.elementPresent('#SelectLang')
      .assert.elementPresent('#movie-page-showing')
      .elements('css selector', 'div#movie-page-showing div.ml-box')

    for await (const e of movies) {
      await cinemaParse(browser, e)
    }
  })

  it('Search Movie coming-soon', async (browser) => {
    const movies = await browser
      .navigateTo('https://www.majorcineplex.com/movie#movie-page-coming')
      .waitForElementPresent('.navrl-lang a.btn-lang')
      .click('.navrl-lang a.btn-lang').pause(1000)
      .waitForElementPresent('.navrl-lang a.change_lang[data-id="en"]')
      .click('a.change_lang[data-id="en"]').pause(1000)
      .assert.elementPresent('#SelectLang')
      .assert.elementPresent('#movie-page-coming')
      .elements('css selector', 'div#movie-page-coming div.ml-box')

    for await (const e of movies) {
      await cinemaParse(browser, e)
    }
  })

  it('Normailize data and save collection', async (browser) => {
    await browser.assert.elementPresent('#movie-page-coming')
    if (cinemaItems.length == 0) throw new Error('Cinema is Empty.')

    for (let i = cinemaItems.length - 1; i >= 0; i--) {
      let duplicateName = false
      const cinema = cinemaItems[i];
      for (let l = 0; l < cinemaItems.length; l++) {
        if (l >= i) { break }

        const check = cinemaItems[l];
        if (check.name === cinema.name) {
          cinemaItems.splice(i, 1)
          duplicateName = true
          break
        }
      }
    }


    await JSONWrite(basename(__dirname), cinemaItems)
  })

  
  // it('Validatetion data collector', async (browser) => {
  //   for (const cinema of cinemaItems) {
  //     console.log(cinema.name)
  //   }
  // })
})