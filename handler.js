'use strict'

exports.ping = (event, context, callback) => {
  return callback(null, {
    statusCode: 200,
    body: JSON.stringify({ message: 'pong' })
  })
}
