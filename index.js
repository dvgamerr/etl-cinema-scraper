const Sentry = require('@sentry/node')
const debuger = require('@touno-io/debuger')
const { task } = require('@touno-io/db/schema')
const moment = require('moment')
const axios = require('axios')

require('axios-retry')(axios, { retryDelay: c => c * 3000 })

const flexPoster = require('./notify/flex')
const production = !(process.env.NODE_ENV === 'development')

const { name, version } = require('./package.json')
Sentry.init({
  dsn: process.env.SENTRY_DSN || null,
  release: `${name}@${version}`
})

const majorWeb = `https://www.majorcineplex.com/movie`
const sfWeb = `https://www.sfcinemacity.com/movies/coming-soon`
const bot = `https://notice.touno.io/popcorn/${!production ? 'movie' : 'kem'}`

const cleanText = (n = '') => n.toLowerCase().replace(/[-.!: /\\()_]+/ig, '')
const checkMovieName = (a, b) => {
  return cleanText(a.name) === cleanText(b.name) || (a.display && b.display && (cleanText(a.display) === cleanText(b.display) || cleanText(a.name) === cleanText(b.display) || cleanText(b.name) === cleanText(a.display)))
}

const isDuplicateInArray = (movies, item) => {
  for (const movie of movies) {
    if (checkMovieName(movie, item)) return true
  }
  return false
}

const InitMajor = async () => {
  let { data: res } = await axios(majorWeb)
  let movies = []
  res = res.match(/class="box-movies-list"[\w\W]+?id="movie-page-coming"/ig)[0]
  for (const movie of res.match(/class="ml-box"[\w\W]+?<\/a><\/div>/ig)) {
    let item = /src="(?<img>.*?)"[\W\w]+"mlbc-name">(?<name>[\W\w]+?)<\/div>[\W\w]+"mlbc-time">.*>(?<time>[\W\w]+?)<\/div>[\W\w]+?href="(?<link>.*?)"[\W\w]+"mlb-date">(?<release>[\W\w]+?)</i.exec(movie)
    if (!item) continue
    item = item.groups
    item.display = item.name.trim()
    item.name = cleanText(item.link.trim().replace('/movie/', ''))
    item.link = `https://www.majorcineplex.com${item.link.trim()}`
    const time = /(?<h>\d\d).ชม..(?<m>\d\d).นาที/ig.exec(item.time.trim())
    item.time = (parseInt(time.groups.h) * 60) + parseInt(time.groups.m)
    if (isDuplicateInArray(movies, item)) continue

    let date = moment().startOf('week').add(-1, 'd')
    item.release = moment(item.release.trim(), 'DD MMM YYYY')
    if (!item.release.isValid()) continue

    for (let i = 0; i < 14; i++) {
      if (item.release.toISOString() !== date.add(1, 'd').toISOString()) continue

      item.cinema = { major: true }
      movies.push(JSON.parse(JSON.stringify(item)))
      break
    }
  }
  return movies
}

const InitSF = async () => {
  let { data: res } = await axios(sfWeb)
  let movies = []
  for (const movie of res.match(/class="movie-card[\w\W]+?class="name/ig)) {
    let item = /movie\/(?<link>.*?)"[\w\W]+?title="(?<name>.*?)"[\w\W]+?\((?<img>.*?)\)[\w\W]+?"date">(?<release>.*?)</ig.exec(movie)
    if (!item) continue

    item = item.groups
    item.display = item.name.trim()
    item.img = item.img.replace(/=w\d+$/,'')
    item.link = `https://www.sfcinemacity.com/movie/${item.link}`
    if (isDuplicateInArray(movies, item)) continue
    
    let date = moment().startOf('week').add(-1, 'd')
    item.release = moment(item.release.trim(), 'YYYY-MM-DD')
    if (!item.release.isValid()) continue

    for (let i = 0; i < 14; i++) {
      if (item.release.toISOString() !== date.add(1, 'd').toISOString()) continue
      
      try {
        let { data: res } = await axios(item.link)
        item.time = parseInt(((/class="movie-detail"[\w\W]+?class="system"[\w\W]+?<\/span><span>(.*?)นาที<\/span>/ig.exec(res) || [])[1] || '0').trim())
        item.name = (/class="movie-main-detail"[\w\W]+?class="title">([\w\W]+?)<\/h1>/ig.exec(res) || [])[1] || ''
      } catch (ex) {
        item.time = 0
      }
      item.cinema = { sf: true }
      movies.push(JSON.parse(JSON.stringify(item)))
      break
    }
  }
  return movies
}

const server = debuger('Cinema')
const downloadMovieItem = async () => {
  try {
    server.start('Collection Search...')
    const { Cinema } = await task.get()
    const [ major, sf ] = await Promise.all([ InitMajor(), InitSF() ])
    const findItem = await Cinema.find({ weekly: { $gte: moment().week() }, year: moment().year() })
    server.info(`Major: ${major.length} and SF: ${sf.length}`)

    let movies = []
    for (const item1 of major.concat(sf).concat(findItem)) {
      let duplicateMovie = false
      for (const item2 of movies) {
        if (checkMovieName(item1, item2)) {
          duplicateMovie = true
          item2.img = item1.img
          if (item1._id) {
            item2._id = item1._id
            item2.weekly = item1.weekly
            item2.year = item1.year
          }
          item2.cinema = Object.assign(item1.cinema, item2.cinema)
          break
        }
      }
      if (!duplicateMovie) movies.push(item1)
    }
    
    movies = movies.sort((a, b) => a.release > b.release ? 1 : -1)
    let newMovies = []
    let currentWeekly = moment().week()

    let plusYear = movies.map(e => moment(e.release).week())
    plusYear = Array.from(new Set(plusYear)).includes(1) && Array.from(new Set(plusYear)).includes(52)

    for (const item of movies) {
      let weekly = moment(item.release).week()
      let year = moment(item.release).year()
      if (weekly === 1 && plusYear) {
        year++
      }
      if (!item._id) {
        let isMatch = false
        for (const movie of (await Cinema.find({ release: item.release }))) {
          if (checkMovieName(movie, item)) {
            isMatch = true
            break
          }
        }
        if (!isMatch) {
          let newItem = Object.assign(item, { weekly, year })
          await new Cinema(newItem).save()
        // console.log('insert', newItem)
          if (currentWeekly === weekly) newMovies.push(newItem)
        }
      } else {
        const cinemaId = item._id
        delete item._id
        // console.log('update', cinemaId, item)
        await Cinema.updateOne({ _id: cinemaId}, { $set: item })
      }
    }
    if (newMovies.length > 0) {
      server.info(`New cinema add ${newMovies.length} movies.`)
      if (moment().day != 1) await sendPoster(`ป๊อปคอนมีหนังสัปดาห์นี้ มาเพิ่ม ${newMovies.length} เรื่องครับผม`, newMovies)
    }
    server.success('Save Downloaded.')
  } catch (ex) {
    server.error(ex)
  }
}

const sendPoster = async (msg, items) => {
  await axios({ url: bot, method: 'PUT', data: flexPoster(msg, items) })
}

const notifyDailyMovies = async () => {
  const { Cinema } = await task.get()
  let movies = await Cinema.find({ release: moment().startOf('day').toDate() })
  server.info(`Today has ${movies.length} movie`)
  if (movies.length === 0) return

  movies = movies.map((e, i) => `${i + 1}. ${e.display} (${e.time} นาที)`)
  await axios({ url: bot, method: 'PUT', json: true, data: { type: 'text', text: `*ภาพยนตร์ที่เข้าฉายวันนี้*\n${movies.join('\n')}` }  })
}

const notifyWeeklyMovies = async () => {
  try {
    const { Cinema } = await task.get()
    let weekly = moment().week()
    let movies = await Cinema.find({ weekly, year: moment().year() }, null, { $sort: { release: 1 } })
    server.info(`Weekly new ${movies.length} movie`)
    if (movies.length === 0) return

    let showen = []
    let groups = Math.ceil(movies.length / 10)
    let i = 1
    server.info(`LINE Flex ${groups} sacle`)

    for (const item of movies) {
      showen.push(item)
      if (showen.length === 10) {
        await sendPoster(`ป๊อปคอนขอเสนอ โปรแกรมหนังประจำสัปดาห์ที่ ${weekly}${groups > 1 ? ` [${i}/${groups}]` : ''} ครับผม`, showen)
        showen = []
        i++
      }
    }
    if (showen.length > 0) await sendPoster(`ป๊อปคอนขอเสนอ โปรแกรมหนังประจำสัปดาห์ที่ ${weekly}${groups > 1 ? ` [${i}/${groups}]` : ''} ครับผม`, showen)

  } catch (ex) {
    server.error(ex)
  }
}
task.open().then(async () => {
  server.start('Cinema.')
  if (!production) {
    await downloadMovieItem()
    // await notifyWeeklyMovies()
    // await notifyDailyMovies()
  }

  switch (process.env.EVENT_JOB) {
    case 'DOWNLOAD':
      server.log('Major and SFCinema dumper at 7:50 am. every day.')
      await downloadMovieItem()
      break
    case 'WEEKLY_ONCE':
      server.log('Notify movies in week at 8:00 am. every monday.')
      await notifyWeeklyMovies()
      break
    case 'DAILY_ONCE': 
      server.log('Notify daily at 8:00 am. not monday.')
      await notifyDailyMovies()
      break
  }
  // server.log('Major and SFCinema dumper at 7:50 am. every day.')
  // cron.schedule('50 7 * * *', downloadMovieItem)

  // server.log('Notify movies in week at 8:00 am. every monday.')
  // cron.schedule('0 8 * * 1', notifyWeeklyMovies)

  // server.log('Notify daily at 8:00 am. not monday.')
  // cron.schedule('0 8 * * 2,3,4,5', notifyDailyMovies)
  await task.close()
  server.success('Cinema.')
}).catch(ex => Sentry.captureException(ex))
