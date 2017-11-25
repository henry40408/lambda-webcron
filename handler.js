const settle = require('promise-settle')

const { Site } = require('./lib/models')
const { invokeCronAsync } = require('./lib/cron')
const { sendSlackNotificationAsync } = require('./lib/slack')

exports.execute = (event, context, callback) =>
  Site.scan()
    .exec()
    .then(sites => settle(sites.map(invokeCronAsync)))
    .then(results => {
      sendSlackNotificationAsync(results)
      return results
    })
    .then(results =>
      callback(null, {
        statusCode: 200,
        body: results.map(result => ({
          success: result.isFulfilled(),
          result: result.value()
        }))
      })
    )
    .catch(err => callback(err))

exports.site = (event, context, callback) => {
  let { id, name, url } = event

  let site

  return Site.get(id)
    .then(foundSite => {
      site = foundSite || new Site({ id, name, url })
      return site.save()
    })
    .then(() => callback(null, { statusCode: 200, body: { event } }))
    .catch(err => callback(err))
}

exports.sites = (event, context, callback) =>
  Site.scan()
    .exec()
    .then(sites => callback(null, { statusCode: 200, body: { sites } }))
    .catch(err => callback(err))

exports.ping = (event, context, callback) =>
  callback(null, {
    statusCode: 200,
    body: { message: 'pong' }
  })
