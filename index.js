const debuger = require('@touno-io/debuger')
const request = require('request-promise')
const moment = require('moment')

const flexPoster = require('./notify/flex')

const major = `https://www.majorcineplex.com/movie`
const sf = `https://www.sfcinemacity.com/movies/coming-soon`
const bot = 'https://intense-citadel-55702.herokuapp.com/popcorn/movie'

const checkDuplicate = (movies, item) => {
  for (const movie of movies) {
    if (movie.name === item.name) {
      return true
    }
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
    let release = moment(item.release.trim(), 'DD/MM/YY')
    if (!release.isValid()) continue

    for (let i = 0; i < 7; i++) {
      if (release.toISOString() !== date.add(1, 'd').toISOString()) continue
      
      res = await request.get(item.link.trim())
      item.display = /txt-namemovie.*?>([\w\W]+?)</.exec(res)[1].trim()
      item.release = /descmovielength[\w\W]+?descmovielength[\w\W]+?<span>([\w\W]+?)</.exec(res)[1].trim()
      item.time = /descmovielength[\w\W]+?<span>([\w\W]+?)</.exec(res)[1].trim()
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
    item.link = `https://www.sfcinemacity.com/movie/${item.link.trim()}`
    if (checkDuplicate(movies, item)) continue
    
    let date = moment().startOf('week').add(-1, 'd')
    let release = moment(item.release.trim(), 'YYYY-MM-DD')
    if (!release.isValid()) continue

    for (let i = 0; i < 7; i++) {
      if (release.toISOString() !== date.add(1, 'd').toISOString()) continue
      
      res = await request.get(item.link)
      item.display = item.name
      item.time = /class="movie-detail"[\w\W]+?class="system"[\w\W]+?<\/span><span>(.*?)นาที<\/span>/ig.exec(res)[1].trim() + ' นาที'
      item.cinema = { sf: true }
      movies.push(JSON.parse(JSON.stringify(item)))
      break
    }
  }
  logger.log(`Total ${movies.length} movies.`)
  return movies
}

const server = debuger('Cinema')
server.start('Movie Collection Search...')
Promise.all([ InitMajor(), InitSF() ]).then(async ([ major, sf ]) => {
  let movies = []
  for (const item1 of major.concat(sf)) {
    let duplicateMovie = false
    for (const item2 of movies) {
      if (item1.display == item2.display) {
        duplicateMovie = true
        item2.cinema = Object.assign(item1.cinema, item2.cinema)
        break
      }
    }
    if (!duplicateMovie) movies.push(item1)
  }

  let showen = []
  server.info(`LINE Flex ${Math.ceil(movies.length / 10)}`)
  for (const item of movies) {
    showen.push(item)
    if (showen.length === 10) {
      await request({ url: bot, method: 'PUT', json: true, body: flexPoster(`ป๊อปคอนขอเสนอ โปรแกรมหนังประจำสัปดาห์ที่ ${moment().week()} ครับผม`, showen)  })
      server.info(` - Carousel ${showen.length} poster.`)
      showen = []
    }
  }
  if (showen.length > 0) {
    await request({ url: bot, method: 'PUT', json: true, body: flexPoster(`ป๊อปคอนขอเสนอ โปรแกรมหนังประจำสัปดาห์ที่ ${moment().week()} ครับผม`, showen)  })
    server.info(` - Carousel ${showen.length} poster.`)
  }
  server.success('Major and SFcinema Downloaded.')
}).catch(ex => {
  server.error(ex)
})
