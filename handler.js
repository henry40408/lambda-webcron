const { IncomingWebhook } = require('@slack/client')
const dynamoose = require('dynamoose')
const numeral = require('numeral')
const { pick } = require('lodash')
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

function sendSlackNotification (results) {
  let attachments = results.map(result => {
    let isFulfilled = result.isFulfilled()
    let value = result.value()

    let { response, name } = value
    let { body = '_(empty)_', elapsedTime, statusCode } = response

    let color = 'danger'
    let status = 'failed'

    if (isFulfilled) {
      color = 'good'
      status = 'success'
    }

    return {
      fallback: `${status}: webcron of ${name}`,
      color,
      fields: [
        {
          title: 'Name',
          value: name
        },
        {
          title: 'Status Code',
          value: statusCode,
          short: true
        },
        {
          title: 'Elapsed Time',
          value: `${numeral(elapsedTime).format('0,0')} ms`,
          short: true
        },
        {
          title: 'Body',
          value: body
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
