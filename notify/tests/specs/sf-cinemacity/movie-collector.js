const { basename } = require('path')
const { getId, JSONWrite } = require('../../collector')

let cinemaItems = []

describe('Collection Major Cineplex', () => {
  it('Search Movie now-showing', async (browser) => {
    await browser.windowSize('current', 1440, 990);

    const movies = await browser
      .navigateTo('https://www.sfcinemacity.com/movies/now-showing')
      .assert.elementPresent('.lang-switcher')
      .click('.lang-switcher li:last-child > a').pause(1000)
      .assert.elementPresent('.movies-now-showing > .movie-card')
      .elements('css selector', '.movies-now-showing > .movie-card[type="now-showing"]')

    if (movies.length === 0) {
      throw new Error('sfcinemacity movies is empty')
    }

    for await (const e of movies) {
      const eId = getId(e)
      const eLink = await browser.pause(20).elementIdElement(eId, 'css selector', 'a')
      const eImage = await browser.pause(20).elementIdElement(eId, 'css selector', '.poster > .image')
      const link = await browser.getAttribute(eLink, 'href')
      const display = await browser.getAttribute(eLink, 'title')
      
      const image = await browser.getCssProperty(eImage, 'background-image')
      const [ , cover ] = /url\("(.+?)"\)/ig.exec(image)

      let name = display.toLowerCase()
      if (/,.the$/ig.test(name)) { name = `the ${name.replace(/,.the$/i, '')}` }

      cinemaItems.push({
        name,
        display,
        release: '',
        genre: '',
        time: '',
        cover,
        url: `https://www.sfcinemacity.com${link.replace('/showtime', '')}`,
        theater: [ 'sf' ]
      })
    }

    for await (const e of cinemaItems) {
      let success = false
      let retries = 0
      let eId = ''
      do {
        success = false
        try {
          const detail = await browser
            .navigateTo(e.url).pause(1000)
            .waitForElementVisible('.button.button-get-tickets').pause(500)
            .waitForElementPresent('.lang-switcher li.active:last-child > a')
            .element('css selector', '.movie-main-detail .detail-wrap')

          eId = getId(detail)
          success = true
          retries = 0
        } catch (ex) {
          console.log(ex)
          await browser.pause(5000)
          retries++
        }
      } while (!success && retries < 10)
      const eRelease = await browser.pause(20).elementIdElement(eId, 'css selector', '.release > span:last-child')
      const eTime = await browser.pause(20).elementIdElement(eId, 'css selector', '.system > span:last-child')
      const eGenre = await browser.pause(20).elementIdElement(eId, 'css selector', '.genre > span:last-child')
      
      e.release = await browser.getText(eRelease)
      e.time = await browser.getText(eTime)
      e.genre = await browser.getText(eGenre)
    }

    await JSONWrite(basename(__dirname), cinemaItems)
  })
})
