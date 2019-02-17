import { debuger, Raven } from '@touno-io/debuger'
import { opensource } from '@touno-io/db/mongo'
import moment from 'moment'
import request from 'request-promise'

const apiEndpoint = region => `http://air4thai.pcd.go.th/services/getNewAQI_JSON.php?region=${region}`
const regionId = [ 1, 2, 3, 4, 5, 6, 7 ]
const logger = debuger.scope('pollution')

Raven.install({
}).Tracking(async pkg => {
  const { Pollution, PollutionStation } = await opensource.open()
  logger.start(`air4thai get services data.`)
  for (const i of regionId) {
    let data = null
    try {
      data = await request({ uri: apiEndpoint(i), json: true })
    } catch (ex) {
      logger.warning(ex)
    }
    if (!data) continue

    logger.log(`air4thai regoin [${data.regionID}] ${data.nameEN} have ${data.stations.length} stations.`)
    for (const station of data.stations) {
      if (!await PollutionStation.findOne({ id: station.stationID })) {
        new PollutionStation({
          region: data.regionID,
          region_name: { en: data.nameEN, th: data.nameTH },
          id: station.stationID,
          station_name: { en: station.nameEN, th: station.nameTH },
          area_name: { en: station.areaEN, th: station.areaTH },
          type: station.stationType,
          lat: station.lat,
          long: station.long
        }).save()
      }
      const { date, time, PM25, PM10, O3, CO, NO2, SO2, AQI } = station.LastUpdate
      let current = moment(`${date} ${time}`).toDate()

      if (!await Pollution.findOne({ station_id: station.stationID, created: current })) {
        new Pollution({
          station_id: station.stationID,
          created: current,
          data: { PM25, PM10, O3, CO, NO2, SO2, AQI }
        }).save()
      }
    }
  }
  logger.success(`air4thai downloaded.`)
})
