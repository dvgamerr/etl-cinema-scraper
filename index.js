const { debuger, Raven } = require('@touno-io/debuger')
const { touno } = require('@touno-io/db/mongo')
// const moment = require('moment')

const channelLINE = require('./channelNotify')

let IsStop = false
Raven.install({
  autoBreadcrumbs: true
}).Tracking(async () => {
  const logger = debuger.scope(`linebot`)
  const { Touno, LineNotify, LineBot } = await touno.open()
  const { data } = await Touno.findOne({ group: 'config', item: 'server' })

  let ScheduleNotify = async () => {
    for (const msg of (await LineNotify.find({ $or: [ { schedule: { $lte: new Date() } }, { schedule: { $eq: null } } ], sended: false }, null, { sort: { created: 1 } }) || [])) {
      let api = await LineBot.findOne({ endpoint: msg.endpoint, active: true })
      if (!api || IsStop) continue

      channelLINE(!!msg.replyId, msg.replyId || msg.roomId, api.token, msg.sender).catch(ex => {
        console.log(ex)
        IsStop = true
      })
      await LineNotify.findOneAndUpdate(msg._id, { sended: true })
      await logger.info(`${!msg.replyId ? 'Push' : 'Reply'} LINE Message to ${msg.roomId}.`)
    }
    if (IsStop) process.kill(1); else setTimeout(() => Raven.Tracking(ScheduleNotify), data['task-linebot-frequency'])
  }
  logger.start('notify LINE API watched')
  await ScheduleNotify()

})
