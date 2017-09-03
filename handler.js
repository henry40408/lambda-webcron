const dynamoose = require('dynamoose')
const request = require('request-promise-native')
const settle = require('promise-settle')
const pick = require('lodash/pick')

const Site = dynamoose.model('sites', {
  id: { type: String, lowercase: true },
  name: { type: String, required: true },
  url: { type: String, required: true }
})

function invokeCron (site) {
  const { name } = site

  const opts = {
    resolveWithFullResponse: true,
    simple: true
  }

  return request(site.url, opts)
    .then(response => pick(response, 'body', 'statusCode'))
    .then(response => ({ name, response }))
}

exports.execute = (event, context, callback) =>
  Site.scan()
    .exec()
    .then(sites => settle(sites.map(invokeCron)))
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
  const { id, name, url } = event

  let site

  return Site.get(id)
    .then(foundSite => {
      site = foundSite || new Site({ id, name, url })
      return site.save()
    })
    .then(() => callback(null, { statusCode: 200, body: { event } }))
    .catch(err => callback(err))
}

exports.sites = (event, context, callback) => {
  return Site.scan()
    .exec()
    .then(sites => callback(null, { statusCode: 200, body: { sites } }))
    .catch(err => callback(err))
}

exports.ping = (event, context, callback) => {
  return callback(null, { statusCode: 200, body: { message: 'pong' } })
}
