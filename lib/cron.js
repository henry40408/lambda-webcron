const { pick } = require('lodash')
const request = require('request-promise-native')

function invokeCronAsync (site) {
  let { name, url } = site

  let options = {
    resolveWithFullResponse: true,
    simple: true,
    time: true
  }

  return request(url, options)
    .then(response => pick(response, 'body', 'elapsedTime', 'statusCode'))
    .then(response => ({ name, response }))
}

exports.invokeCronAsync = invokeCronAsync
