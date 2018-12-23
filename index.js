const { DevMode, debuger, Raven } = require('@touno-io/debuger')
const { touno } = require('@touno-io/db/mongo')
const moment = require('moment')

const channelLINE = require('./channelNotify')

// replyId: String,
// roomId: String,
// roomType: String,
// endpoint: { index: true, type: String },
// schedule: { index: true, type: Date },
// sender: Object,
// sended: { index: true, type: Boolean },
// created: Date

// endpoint: { index: true, type: String },
// channel: String,
// secret: String,
// token: String,
// active: { index: true, type: Boolean },
// created: Date

let IsStop = false
Raven.install({
  autoBreadcrumbs: true
}).Tracking(async () => {
  const logger = debuger.scope(`bnk48`)
  const { LineNotify, LineBot } = await touno.open()

  for (const msg of (await LineNotify.find({ schedule: { $gte: new Date() }, sended: false }) || [])) {
    let api = await LineBot.findOne({ endpoint: msg.endpoint, active: true })
    if (!api) continue

    await channelLINE(!!msg.replyId, msg.replyId || msg.roomId, api.token, msg.sender)
    await logger.info(`${!msg.replyId ? 'Push' : 'Reply'} LINE Message to ${msg.roomId}.`)
  } 
  // let ScheduleNotify = async () => {
  //   let noti = await LogNotify.findOne({ notify: false, schedule: { $lte: new Date() } }, null, { sort: { created: 1 } })
  //   if (noti) await channelLINE(noti)
  //   if (!IsStop) setTimeout(() => Raven.Tracking(ScheduleNotify), data['task-notification-frequency'])
  // }
})
