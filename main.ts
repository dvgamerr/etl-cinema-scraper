import puppeteer from 'https://deno.land/x/puppeteer@14.1.1/mod.ts'
import * as log from 'https://deno.land/std@0.149.0/log/mod.ts';
import * as sf from './sf-cinemacity/main.ts'
import * as major from './major-cineplex/main.ts'
import { JSONWrite } from './collector.ts'

const isDev = Deno.env.get('ENV') !== 'production'

log.info('Puppeteer launcher...');
const browser = await puppeteer.launch({
  headless: isDev,
  args: isDev ? ['--fast-start', '--disable-extensions', '--no-sandbox'] : ['--no-sandbox']
})

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 990 })

// Major Cineplex
log.info('- Search `https://www.majorcineplex.com` Now Showing...');
const majorShowing = await major.SearchMovieNowShowing(page)
log.info('- Search `https://www.majorcineplex.com` Comming Soon...');
const majorCooming = await major.SearchMovieCommingSoon(page)

// SF Cinema 
log.info('- Search `https://www.sfcinemacity.com/` Now Showing...');
const sfShowing = await sf.SearchMovieNowShowing(page)

log.info('- Search `https://www.sfcinemacity.com/` Comming Soon...');
const sfComming = await sf.SearchMovieComming(page)

await browser.close()

const cinemaItems = majorShowing.concat(majorCooming, sfShowing, sfComming)

log.info('- Normalize data collection');
for (let i = cinemaItems.length - 1; i >= 0; i--) {
  const [name] = cinemaItems[i].name.toLowerCase()
    .replace(/^\W+|\W+$/ig, '')
    .replace(/\W+/ig, '-')
    .match(/[\w-]+/i) || []

  if (!name) {
    log.warning(`can't parse cinema name '${cinemaItems[i].url}'`);
    cinemaItems.splice(i, 1);
    continue
  }

  cinemaItems[i].name = name

  for (let l = 0; l < cinemaItems.length; l++) {
    if (l == i) continue

    if (cinemaItems[l].name === cinemaItems[i].name) {
      cinemaItems[l].theater = Object.assign(cinemaItems[i].theater, cinemaItems[l].theater)
      cinemaItems.splice(i, 1);
      break;
    }
  }
}

log.info('- Saving WebScripting');
await JSONWrite('data', cinemaItems)
