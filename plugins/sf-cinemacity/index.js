import dayjs from 'dayjs'

export function scrapingCinema(elements) {
  const cinema = []
  for (const e of elements) {
    const eLink = e.querySelector('a')
    const display = eLink.getAttribute('title')
    const link = eLink.getAttribute('href')
    const image = e.querySelector('.poster > .image').style['background-image']
    const [, cover] = image.match(/url\("(.+?)"\)/i)

    let name = display.toLowerCase()
    if (/,.the$/gi.test(name)) name = `the ${name.replace(/,.the$/i, '')}`

    cinema.push({
      name,
      name_en: '',
      name_th: '',
      display,
      genre: '',
      time: 0,
      timeMin: '',
      release: new Date(),
      theater: {
        sf: {
          cover,
          url: `https://www.sfcinemacity.com${link.replace('/showtime', '')}`,
        },
      },
    })
  }
  return cinema
}

export function scrapingCinemaDetail(element) {
  return {
    title: element.querySelector('h1.title').textContent,
    release: element.querySelector('.release > span:last-child').textContent,
    genre: element.querySelector('.genre > span:last-child').textContent,
    time: element.querySelector('.system > span:last-child').textContent,
  }
}

const langSwitcher = async (page, lang) => {
  const elem = await page.$(`.lang-switcher li:${lang === 'th' ? 'first-child' : 'last-child'} > a`)
  if (!elem) {
    throw new Error('.lang-switcher not exists')
  }
  await elem.evaluate((b) => b.click())
  await Bun.sleep(200)
}

export async function SearchMovieNowShowing(page) {
  await Bun.sleep(1000)
  await page.goto('https://www.sfcinemacity.com/movies/now-showing')
  await page.waitForNetworkIdle()
  await langSwitcher(page, 'en')
  await Bun.sleep(300)

  const eMovieCard = await page.waitForFunction(`document.querySelectorAll('.movies-now-showing > .movie-card')`)
  const cinema = await page.evaluate(scrapingCinema, eMovieCard)

  for await (const item of cinema) {
    await page.goto(item.theater.sf.url)
    await page.waitForSelector('.lang-switcher li.active > a')
    // switch to thai
    await langSwitcher(page, 'th')

    const eDetailTh = await page.waitForFunction(`document.querySelector('.movie-main-detail > .row')`)
    const detailTh = await page.evaluate(scrapingCinemaDetail, eDetailTh)

    // switch to english
    await langSwitcher(page, 'en')

    const eDetailEn = await page.waitForFunction(`document.querySelector('.movie-main-detail > .row')`)
    const detailEn = await page.evaluate(scrapingCinemaDetail, eDetailEn)

    item.name_en = detailEn.title
    item.name_th = detailTh.title
    const release = dayjs(detailEn.release, 'YYYY-MM-DD')
    if (release.isValid()) {
      item.release = release.toDate()
    }

    item.genre = detailEn.genre

    const [time] = detailEn.time.match(/\d+/i) || ['0']
    item.timeMin = time
    await Bun.sleep(500)
  }
  return cinema
}

export async function SearchMovieComming(page) {
  await Bun.sleep(1000)
  await page.goto('https://www.sfcinemacity.com/movies/coming-soon')
  await page.waitForNetworkIdle()
  await page.waitForSelector('.lang-switcher li.active > a')
  await langSwitcher(page, 'en')

  const eMovieCard = await page.waitForFunction(`document.querySelectorAll('.movies-coming-soon > .movie-card')`)
  const cinema = await page.evaluate(scrapingCinema, eMovieCard)

  for await (const item of cinema) {
    await page.goto(item.theater.sf.url)
    await page.waitForSelector('.lang-switcher li.active > a')

    // switch to thai
    await langSwitcher(page, 'th')

    const eDetailTh = await page.waitForFunction(`document.querySelector('.movie-main-detail > .row')`)
    const detailTh = await page.evaluate(scrapingCinemaDetail, eDetailTh)

    // switch to english
    await langSwitcher(page, 'en')

    const eDetailEn = await page.waitForFunction(`document.querySelector('.movie-main-detail > .row')`)
    const detailEn = await page.evaluate(scrapingCinemaDetail, eDetailEn)

    item.name_en = detailEn.title
    item.name_th = detailTh.title
    const release = dayjs(detailEn.release, 'YYYY-MM-DD')
    if (release.isValid()) {
      item.release = release.toDate()
    }

    item.genre = detailEn.genre

    const [time] = detailEn.time.match(/\d+/i) || ['0']
    item.timeMin = time
  }
  return cinema
}
