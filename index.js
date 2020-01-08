const debuger = require('@touno-io/debuger')
const { task } = require('@touno-io/db/schema')
const request = require('request-promise')
const moment = require('moment')
const cron = require('node-cron')

const flexPoster = require('./notify/flex')

const production = !(process.env.NODE_ENV === 'development')
const major = `https://www.majorcineplex.com/movie`
const sf = `https://www.sfcinemacity.com/movies/coming-soon`
const bot = `https://intense-citadel-55702.herokuapp.com/popcorn/${production ? 'movie' : 'kem'}`

const reqRetry = async (get_url, retry = 3) => {
  let i = 0
  let success = false
  let res = {}
  do {
    try {
      res = await request.get(get_url)
      success = true
    } catch (ex) {
      i++
      if (i >= retry) throw ex
    }
  } while (i < retry && !success)
  return res
}


const cleanText = (n = '') => n.toLowerCase().replace(/[-.!: /\\_]+/ig, '')

const checkMovieName = (a, b) => {
  return a.name === b.name || (a.display && b.display && (cleanText(a.display) == cleanText(b.display) || cleanText(a.name) == cleanText(b.display) || cleanText(b.name) == cleanText(a.display)))
}

const isDuplicateInArray = (movies, item) => {
  for (const movie of movies) {
    if (checkMovieName(movie, item)) return true
  }
  return false
}

const InitMajor = async () => {
  const logger = debuger('Major')
  let res = await reqRetry(major)
  let movies = []
  
  for (const movie of res.match(/class="eachMovie"[\w\W]+?class="secondexplain/ig)) {
    let item = /href="(?<link>.*?)"[\w\W]*"?img.*?src="(?<img>.*?)"[\w\W]*?วันที่เข้าฉาย:(?<release>[\w\W]+?)</ig.exec(movie)
    if (!item) continue
    item = item.groups
    item.name = cleanText(item.link.trim().replace('https://www.majorcineplex.com/movie/', ''))
    if (isDuplicateInArray(movies, item)) continue

    let date = moment().startOf('week').add(-1, 'd')
    item.release = moment(item.release.trim(), 'DD/MM/YY')
    if (!item.release.isValid()) continue

    for (let i = 0; i < 14; i++) {
      if (item.release.toISOString() !== date.add(1, 'd').toISOString()) continue
      
      res = await reqRetry(item.link.trim())
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
    item.name = cleanText(item.link.trim())
    item.img = item.img.replace(/=w\d+$/,'')
    item.link = `https://www.sfcinemacity.com/movie/${item.name}`
    if (isDuplicateInArray(movies, item)) continue
    
    let date = moment().startOf('week').add(-1, 'd')
    item.release = moment(item.release.trim(), 'YYYY-MM-DD')
    if (!item.release.isValid()) continue

    for (let i = 0; i < 14; i++) {
      if (item.release.toISOString() !== date.add(1, 'd').toISOString()) continue
      
      res = await reqRetry(item.link)
      item.time = parseInt(((/class="movie-detail"[\w\W]+?class="system"[\w\W]+?<\/span><span>(.*?)นาที<\/span>/ig.exec(res) || [])[1] || '0').trim())
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
  try {
    server.start('Collection Search...')
    const [ major, sf ] = await Promise.all([ InitMajor(), InitSF() ])
    server.info(`Major: ${major.length} and SF: ${sf.length}`)

    let movies = []
    for (const item1 of major.concat(sf)) {
      let duplicateMovie = false
      for (const item2 of movies) {
        if (checkMovieName(item1, item2)) {
          duplicateMovie = true
          item2.cinema = Object.assign(item1.cinema, item2.cinema)
          break
        }
      }
      if (!duplicateMovie) movies.push(item1)
    }
    
    movies = movies.sort((a, b) => a.release > b.release ? 1 : -1)
    const { Cinema } = await task.get()
    let newMovies = []
    let currentWeekly = moment().week()
    
    for (const item of movies) {
      let weekly = moment(item.release).week()
      let year = moment(item.release).year()
      if (weekly === 1) {
        for (const item of movies) {
          if (year < moment(item.release).year()) year = moment(item.release).year()
        }
      }
      let findItem = await Cinema.findOne({ $or: [ { name: item.name }, { display: item.display } ] })
      if (!findItem) {
        let isMatch = false
        for (const movie of (await Cinema.find({ release: item.release }))) {
          if (checkMovieName(movie, item)) {
            isMatch = true
            break
          }
        }
        if (!isMatch) {
          let newItem = Object.assign(item, { weekly, year })
          if (!production) console.log(newItem)
          await new Cinema(Object.assign(item, { weekly, year })).save()
          if (currentWeekly === weekly) newMovies.push(item)
        }
      } else {
        await Cinema.updateOne({ _id: findItem._id }, { $set: item })
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
  if (production) await request({ url: bot, method: 'PUT', json: true, body: flexPoster(msg, items)  })
}

const notifyDailyMovies = async () => {
  const { Cinema } = await task.get()
  let movies = await Cinema.find({ release: moment().startOf('day').toDate() })
  server.info(`Today has ${movies.length} movie`)
  if (movies.length === 0) return

  movies = movies.map((e, i) => `${i + 1}. ${e.display} (${e.time} นาที)`)
  await request({ url: bot, method: 'PUT', json: true, body: { type: 'text', text: `*ภาพยนตร์ที่เข้าฉายวันนี้*\n${movies.join('\n')}` }  })
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
  if (!production) {
    await downloadMovieItem()
    await notifyWeeklyMovies()
    // await notifyDailyMovies()
  }

  server.log('Major and SFCinema dumper at 7:50 am. every day.')
  cron.schedule('50 7 * * *', downloadMovieItem)

  server.log('Notify movies in week at 8:00 am. every monday.')
  cron.schedule('0 8 * * 1', notifyWeeklyMovies)

  server.log('Notify daily at 8:00 am. not monday.')
  cron.schedule('0 8 * * 2,3,4,5', notifyDailyMovies)
})
