const lineBot = require('@line/bot-sdk')

module.exports = (reply = false, lineID, lineToken, msg) => {
  const cb = new lineBot.Client({ channelAccessToken: lineToken })
  return reply ? cb.replyMessage(lineID, msg) : cb.pushMessage(lineID, msg)
}
