import { debuger, Raven } from '@touno-io/debuger'
import request from 'request-promise'

const apiEndpoint = region => `http://air4thai.pcd.go.th/services/getNewAQI_JSON.php?region=${region}`
const regionId = [ 1, 2, 3, 4, 5, 6, 7 ]
const logger = debuger.scope('pollution')

Raven.install({
}).Tracking(async pkg => {
  logger.start(`data air4thai.pcd.go.th`)
  for (const i of regionId) {
    let data = await request({ uri: apiEndpoint(i), json: true })
    if (!data) continue
  }
})
