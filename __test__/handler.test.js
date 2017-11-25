/* eslint-env jest */

const dynamoose = require('dynamoose')
const nock = require('nock')

dynamoose.AWS.config.update({
  accessKeyId: 'AKID',
  secretAccessKey: 'SECRET',
  region: 'us-east-1'
})

dynamoose.local()

process.env.SLACK_WEBHOOK_URL = 'https://example.com'

const { Site } = require('../lib/models')

const {
  execute: executeFn,
  ping: pingFn,
  site: siteFn,
  sites: sitesFn
} = require('../handler')

describe('execute', () => {
  let destination

  beforeAll(() => {
    destination = nock('https://example.com')
      .get('/')
      .reply(200, 'OK')

    return Site.create({ id: '1', name: 'example', url: 'https://example.com' })
  })

  afterAll(() => {
    nock.cleanAll()
    return Site.delete({})
  })

  test('send requests', () =>
    executeFn({}, null, (err, response) => {
      expect(err).toBeNull()

      expect(destination.isDone()).toEqual(true)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].result.response.body).toEqual('OK')
      expect(response.body[0].result.response.statusCode).toEqual(200)
    }))
})

describe('ping', () => {
  test('returns pong', () =>
    pingFn({}, null, (err, response) => {
      expect(err).toBeNull()
      expect(response).toEqual({
        body: { message: 'pong' },
        statusCode: 200
      })
    }))
})

describe('site', () => {
  let siteBody = { id: '1', name: 'foobar', url: 'http://example.com' }

  describe('with same body', () => {
    beforeAll(() => Site.create(siteBody))

    afterAll(() => Site.delete({ id: siteBody.id }))

    test('not create site', () =>
      siteFn({ id: siteBody.id }, null, (err, response) => {
        expect(err).toBeNull()
        return Site.scan({ id: siteBody.id }).exec()
      }).then(sites => {
        expect(sites).toHaveLength(1)
      }))
  })

  describe('with different body', () => {
    let anotherSiteBody = Object.assign({}, siteBody, { id: '2' })

    beforeAll(() => Site.delete({}))

    afterAll(() => Site.delete({ id: anotherSiteBody.id }))

    test('create site', () =>
      siteFn(anotherSiteBody, null, (err, response) => {
        expect(err).toBeNull()
        return Site.scan({ id: anotherSiteBody.id }).exec()
      }).then(sites => {
        expect(sites).toHaveLength(1)
        expect(sites[0]).toEqual(anotherSiteBody)
      }))
  })
})

describe('sites', () => {
  let siteBody = { id: '1', name: 'foobar', url: 'http://example.com' }

  beforeAll(() => Site.create(siteBody))

  afterAll(() => Site.delete({ id: siteBody.id }))

  test('returns sites', () =>
    sitesFn({}, null, (err, response) => {
      expect(err).toBeNull()
      expect(response.body.sites).toHaveLength(1)
      expect(response.body.sites[0]).toEqual(siteBody)
    }))
})
