const { IncomingWebhook } = require('@slack/client')
const numeral = require('numeral')

const { SLACK_WEBHOOK_URL } = process.env

const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL)

function sendSlackNotificationAsync (results) {
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

exports.sendSlackNotificationAsync = sendSlackNotificationAsync
