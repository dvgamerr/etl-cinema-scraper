const debuger = require('@touno-io/debuger')
const { project } = require('@touno-io/db/schema')
const request = require('request-promise')
const moment = require('moment')
const cron = require('node-cron')

const flexPoster = require('./notify/flex')

const production = !(process.env.NODE_ENV === 'development')
const major = `https://www.majorcineplex.com/movie`
const sf = `https://www.sfcinemacity.com/movies/coming-soon`
const bot = `https://intense-citadel-55702.herokuapp.com/popcorn/${production ? 'movie' : 'kem'}`

const checkDuplicate = (movies, item) => {
  for (const movie of movies) {
    if (movie.name === item.name) return true
    if (movie.display && item.display && movie.display.replace(/[-.! ]+/ig,'') == item.display.replace(/[-.! ]+/ig,'')) return true
  }
  return false
}

const InitMajor = async () => {
  const logger = debuger('Major')
  let res = await request.get(major)
  let movies = []
  
  for (const movie of res.match(/class="eachMovie"[\w\W]+?class="secondexplain/ig)) {
    let item = /href="(?<link>.*?)"[\w\W]*"?img.*?src="(?<img>.*?)"[\w\W]*?วันที่เข้าฉาย:(?<release>[\w\W]+?)</ig.exec(movie)
    if (!item) continue
    item = item.groups
    item.name = item.link.trim().replace('https://www.majorcineplex.com/movie/', '')
    if (checkDuplicate(movies, item)) continue

    let date = moment().startOf('week').add(-1, 'd')
    item.release = moment(item.release.trim(), 'DD/MM/YY')
    if (!item.release.isValid()) continue

    for (let i = 0; i < 14; i++) {
      if (item.release.toISOString() !== date.add(1, 'd').toISOString()) continue
      
      res = await request.get(item.link.trim())
      item.display = /txt-namemovie.*?>([\w\W]+?)</.exec(res)[1].trim()
      item.time = parseInt(/descmovielength[\w\W]+?<span>([\w\W]+?)</.exec(res)[1].trim())
      item.cinema = { major: true }
      movies.push(JSON.parse(JSON.stringify(item)))
      break
    }
  }
  logger.log(`Total ${movies.length} movies.`)
  return movies
}

const InitSF = async () => {
  const logger = debuger('SFCinema')
  let res = await request(sf)
  let movies = []
  for (const movie of res.match(/class="movie-card[\w\W]+?class="name/ig)) {
    let item = /movie\/(?<link>.*?)"[\w\W]+?title="(?<name>.*?)"[\w\W]+?\((?<img>.*?)\)[\w\W]+?"date">(?<release>.*?)</ig.exec(movie)
    if (!item) continue

    item = item.groups
    item.display = item.name.trim()
    item.name = item.link.trim()
    item.img = item.img.replace(/=w\d+$/,'')
    item.link = `https://www.sfcinemacity.com/movie/${item.name}`
    if (checkDuplicate(movies, item)) continue
    
    let date = moment().startOf('week').add(-1, 'd')
    item.release = moment(item.release.trim(), 'YYYY-MM-DD')
    if (!item.release.isValid()) continue

    for (let i = 0; i < 14; i++) {
      if (item.release.toISOString() !== date.add(1, 'd').toISOString()) continue
      
      res = await request.get(item.link)
      item.time = parseInt(/class="movie-detail"[\w\W]+?class="system"[\w\W]+?<\/span><span>(.*?)นาที<\/span>/ig.exec(res)[1].trim())
      item.cinema = { sf: true }
      movies.push(JSON.parse(JSON.stringify(item)))
      break
    }
  }
  logger.log(`Total ${movies.length} movies.`)
  return movies
}

const server = debuger('Cinema')
const downloadMovieItem = async () => {
  server.start('Collection Search...')
  const [ major, sf ] = await Promise.all([ InitMajor(), InitSF() ])
  server.info(`Major: ${major.length} and SF: ${sf.length}`)

  let movies = []
  for (const item1 of major.concat(sf)) {
    let duplicateMovie = false
    for (const item2 of movies) {
      if (item1.display.replace(/[-.! ]+/ig,'') == item2.display.replace(/[-.! ]+/ig,'')) {
        duplicateMovie = true
        item2.cinema = Object.assign(item1.cinema, item2.cinema)
        break
      }
    }
    if (!duplicateMovie) movies.push(item1)
  }

  movies = movies.sort((a, b) => a.release > b.release ? 1 : -1)
  const { Cinema } = await project.get()
  let newMovies = 0
  for (const item of movies) {
    if (!(await Cinema.findOne({ name: item.name, release: item.release }))) {
      newMovies++
      const weekly = moment(item.release).week()
      await new Cinema(Object.assign(item, { weekly })).save()
    }
  }
  if (newMovies > 0) server.info(`New cinema add ${newMovies} movies.`)
  server.success('Save Downloaded.')
}

const notifyDailyMovies = async () => {
  const { Cinema } = await project.get()
  let movies = await Cinema.find({ release: moment().startOf('day').toDate() })
  server.info(`Today has ${movies.length} movie`)
  if (movies.length === 0) return

  movies = movies.map((e, i) => `${i + 1}. ${e.display} (${e.time} นาที)`)
  await request({ url: bot, method: 'PUT', json: true, body: { type: 'text', text: `*ภาพยนตร์ที่เข้าฉายวันนี้*\n${movies.join('\n')}` }  })
}

const notifyWeeklyMovies = async () => {
  const { Cinema } = await project.get()
  let weekly = moment().week()
  let movies = await Cinema.find({ weekly, year: moment().year() }, null, { $sort: { release: 1 } })
  server.info(`Weekly new ${movies.length} movie`)
  if (movies.length === 0) return

  let showen = []
  let groups = Math.ceil(movies.length / 10)
  let i = 1
  server.info(`LINE Flex ${groups} sacle`)

  const sendPoster = async (msg, items) => {
    await request({ url: bot, method: 'PUT', json: true, body: flexPoster(msg, items)  })
  }

  for (const item of movies) {
    showen.push(item)
    if (showen.length === 10) {
      await sendPoster(`ป๊อปคอนขอเสนอ โปรแกรมหนังประจำสัปดาห์ที่ ${weekly}${groups > 1 ? ` [${i}/${groups}]` : ''} ครับผม`, showen)
      showen = []
      i++
    }
  }
  if (showen.length > 0) await sendPoster(`ป๊อปคอนขอเสนอ โปรแกรมหนังประจำสัปดาห์ที่ ${weekly}${groups > 1 ? ` [${i}/${groups}]` : ''} ครับผม`, showen)
}

project.open().then(async () => {
  if (!production) {
    await downloadMovieItem()
    // await notifyWeeklyMovies()
    // await notifyDailyMovies()
  }

  server.log('Major and SFCinema dumper at 7:50 am. every day.')
  cron.schedule('50 7 * * *', downloadMovieItem)

  server.log('Notify movies in week at 8:00 am. every monday.')
  cron.schedule('0 8 * * 1', notifyWeeklyMovies)

  server.log('Notify daily at 8:00 am. not monday.')
  cron.schedule('0 8 * * 2,3,4,5', notifyDailyMovies)
})