const IncomingWebhook = require('@slack/client').IncomingWebhook

const dynamoose = require('dynamoose')
const numeral = require('numeral')
const pick = require('lodash/pick')
const request = require('request-promise-native')
const settle = require('promise-settle')

const { DYNAMODB_TABLE_NAME, SLACK_WEBHOOK_URL } = process.env

const Site = dynamoose.model(DYNAMODB_TABLE_NAME, {
  id: { type: String, lowercase: true },
  name: { type: String, required: true },
  url: { type: String, required: true }
})

const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL)

function invokeCron (site) {
  const { name } = site

  const opts = {
    resolveWithFullResponse: true,
    simple: true,
    time: true
  }

  return request(site.url, opts)
    .then(response => pick(response, 'body', 'elapsedTime', 'statusCode'))
    .then(response => ({ name, response }))
}

function sendSlackNotification (results) {
  const attachments = results.map(result => {
    const isFulfilled = result.isFulfilled()
    const value = result.value()
    const response = value.response

    return {
      fallback: `${isFulfilled
        ? 'success'
        : 'failed'}: webcron of ${value.name}`,
      color: isFulfilled ? 'good' : 'danger',
      fields: [
        {
          title: 'Name',
          value: value.name
        },
        {
          title: 'Status Code',
          value: response.statusCode,
          short: true
        },
        {
          title: 'Elapsed Time',
          value: `${numeral(response.elapsedTime).format('0,0')} ms`,
          short: true
        },
        {
          title: 'Body',
          value: response.body ? response.body : '_(empty)_'
        }
      ],
      mrkdwn_in: ['fields', 'pretext']
    }
  })

  return webhook.send({ attachments })
}

exports.execute = (event, context, callback) =>
  Site.scan()
    .exec()
    .then(sites => settle(sites.map(invokeCron)))
    .then(results => {
      sendSlackNotification(results)
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
