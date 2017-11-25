const dynamoose = require('dynamoose')

const { DYNAMODB_TABLE_NAME } = process.env

exports.Site = dynamoose.model(DYNAMODB_TABLE_NAME, {
  id: { type: String, lowercase: true },
  name: { type: String, required: true },
  url: { type: String, required: true }
})
