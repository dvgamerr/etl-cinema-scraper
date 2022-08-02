import puppeteer from 'https://deno.land/x/puppeteer@14.1.1/mod.ts'
import * as log from "https://deno.land/std@0.149.0/log/mod.ts";
import { SearchMovieComming, SearchMovieNowShowing } from './sf-cinemacity/main.ts'
import { JSONWrite } from './collector.ts'

log.info("Puppeteer launcher...");
const browser = await puppeteer.launch({
  'headless': false,
  'args': ['--fast-start', '--disable-extensions', '--no-sandbox'],
  // 'ignoreHTTPSErrors': true
})

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 990 })

log.info(" 🔍 Search `https://www.sfcinemacity.com/` Now Showing...");
const sfShowing = await SearchMovieNowShowing(page)

log.info(" 🔍 Search `https://www.sfcinemacity.com/` Comming Soon...");
const sfComming = await SearchMovieComming(page)

log.info(" 💾 Saving WebScripting");
await JSONWrite('sf-cinemacity', sfShowing.concat(sfComming))

await browser.close()
