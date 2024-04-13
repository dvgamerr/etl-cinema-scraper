import puppeteer from "puppeteer";
import pino from "pino";
// import * as sf from './sf-cinemacity/main.ts'
// import * as major from './major-cineplex/main.ts'
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import weekOfYear from "dayjs/plugin/weekOfYear";

const logger = pino();
// import { JSONRead, JSONWrite } from "./collector.ts"
// import flexCarousel from "./line-flex.ts"

dayjs.extend(weekday);
dayjs.extend(weekOfYear);

async function LINEFlexRequest(message, items) {
  const res = await fetch(`http://notice.touno.io/line/popcorn/movie`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(flexCarousel(message, items)),
  });

  const body = await res.json();
  logger.debug(`notice.touno.io (${res.status}): ${JSON.stringify(body)}`);
}

const isDev = Bun.env.ENV !== "production";
await logger.setup({
  handlers: {
    console: new logger.handlers.ConsoleHandler("DEBUG", {
      formatter: (logger) =>
        `[${dayjs().format(
          "YYYY-MM-DD HH:mm:ss"
        )}] ${`[${logger.levelName}]`.padEnd(10, " ")} ${logger.msg}`,
    }),
    file: new logger.handlers.RotatingFileHandler("INFO", {
      filename: `./output/main.logger`,
      maxBytes: 15,
      maxBackupCount: 5,
      formatter: (rec) =>
        JSON.stringify({
          region: rec.loggergerName,
          ts: rec.datetime,
          level: rec.levelName,
          data: rec.msg,
        }),
    }),
  },
  loggergers: {
    default: { level: "DEBUG", handlers: ["console"] },
    file: { level: "INFO", handlers: ["file"] },
  },
});

logger.debug("Puppeteer create launcher...");
const browser = await puppeteer.launch({
  headless: !isDev,
  args: isDev
    ? ["--fast-start", "--no-sandbox"]
    : [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--headless",
        "--disable-gpu",
      ],
});
let majorShowing = [];
let majorCooming = [];

// Major Cineplex
logger.debug("New page `https://www.majorcineplex.com`");
const majorPage = await browser.newPage();
await majorPage.setViewport({ width: 1440, height: 990 });
logger.debug(" * Now Showing & Comming Soon");
majorShowing = await major.SearchMovieNowShowing(majorPage);
majorCooming = await major.SearchMovieCommingSoon(majorPage);
await majorPage.close();

logger.debug(" * Caching Json");
await JSONWrite("major-cineplex", majorShowing.concat(majorCooming));

// SF Cinema
logger.debug("New page `https://www.sfcinemacity.com/`");
let sfPage = await browser.newPage();
await sfPage.setViewport({ width: 1440, height: 990 });
logger.debug(" * Now Showing...");
const sfShowing = await sf.SearchMovieNowShowing(sfPage);
await sfPage.close();

logger.debug(" * Comming Soon...");
sfPage = await browser.newPage();
const sfComming = await sf.SearchMovieComming(sfPage);
await sfPage.close();

logger.debug(" * Caching Json");
await JSONWrite("sf-cinemacity", sfShowing.concat(sfComming));

await browser.close();

const cinemaItems = majorShowing.concat(majorCooming, sfShowing, sfComming);

logger.debug("Normalize data collection");
for (let i = cinemaItems.length - 1; i >= 0; i--) {
  const [name] =
    cinemaItems[i].name
      .toLowerCase()
      .replace(/^\W+|\W+$/gi, "")
      .replace(/\W+/gi, "-")
      .match(/[\w-]+/i) || [];

  if (!name) {
    logger.warning(`can't parse cinema name '${cinemaItems[i].url}'`);
    cinemaItems.splice(i, 1);
    continue;
  }

  const [time] = (cinemaItems[i].timeMin || "").match(/^\d+/i) || ["0"];
  if (isNaN(parseInt(time))) {
    console.warn(`can't parseInt time '${time}'`);
    continue;
  }

  cinemaItems[i].time = parseInt(time);
  cinemaItems[i].name = name;
  delete cinemaItems[i].timeMin;

  for (let l = 0; l < cinemaItems.length; l++) {
    if (l == i) continue;

    if (cinemaItems[l].name === cinemaItems[i].name) {
      cinemaItems[l].theater = Array.from(
        new Set(cinemaItems[i].theater.concat(cinemaItems[l].theater))
      );
      cinemaItems.splice(i, 1);
      break;
    }
  }
}

logger.debug("Saving WebScraping");
await JSONWrite("web-scraping", cinemaItems);

// const data = await JSONRead()
// const cinemaItems = data['web-scraping.json']
// console.logger(Bun.env.APIS, Bun.env.TOKEN)

if (!Bun.env.APIS || !Bun.env.TOKEN) {
  logger.warning("Skip: Uploaded");
  Deno.exit();
}

logger.debug(`Uploading (${cinemaItems.length} movie) WebScraping`);
const collector = await fetch(`${Bun.env.APIS}/api/collector/cinema`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${Bun.env.TOKEN}`,
  },
  body: JSON.stringify(cinemaItems),
});

if (collector.status !== 200) {
  const body = await collector.json();
  logger.error(`Uploaded: ${JSON.stringify(body)}`);
  Deno.exit();
} else {
  logger.debug(" * Uploaded");
}

if (dayjs().day() !== 1) {
  Deno.exit();
}

const res = await fetch(`${Bun.env.APIS}/api/cinema`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${Bun.env.TOKEN}`,
  },
});

const body = await res.json();
if (res.status !== 200) {
  logger.error(`Cinema: ${JSON.stringify(body)}`);
  Deno.exit();
}

const limitFlex = 10;
const groupFlex = Math.ceil(body.length / limitFlex);
logger.debug(`LINE Flex ${groupFlex} sacle`);

for (let i = 0; i < groupFlex; i++) {
  await LINEFlexRequest(
    `ป๊อปคอนขอเสนอ โปรแกรมหนังประจำสัปดาห์ที่ ${dayjs().week()} ปี ${dayjs().year()}${
      groupFlex > 1 ? ` [${i}/${groupFlex}]` : ""
    } ครับผม`,
    body.slice(limitFlex * i, limitFlex * (i + 1))
  );
}
