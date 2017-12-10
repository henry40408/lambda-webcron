# Serverless Webcron

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![CircleCI](https://circleci.com/gh/henry40408/serverless-webcron.svg?style=shield)](https://circleci.com/gh/henry40408/serverless-webcron)
[![codecov](https://codecov.io/gh/henry40408/serverless-webcron/branch/master/graph/badge.svg)](https://codecov.io/gh/henry40408/serverless-webcron)
[![GitHub release](https://img.shields.io/github/release/henry40408/serverless-webcron.svg)](https://github.com/henry40408/serverless-webcron)
[![license](https://img.shields.io/github/license/henry40408/serverless-webcron.svg)](https://github.com/henry40408/serverless-webcron)
![stability-stable](https://img.shields.io/badge/stability-stable-green.svg)

> Webcron powered by AWS Lambda

## Requirements

* Node 6.10.3, according to
  [Lambda Execution Environment and Available Libraries](http://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html)
* AWS CLI,
  [with credentials configured](https://serverless.com/framework/docs/providers/aws/guide/credentials/)

## Installatin Dependencies

`yarn` is recommended, `npm` should work as well.

```bash
$ yarn
```

## Default Settings

* AWS region: `ap-northeast-1`
* DynamoDB table name: `sites`
* Time to run cron everyday: `19:00 UTC / 03:00 CST`

Edit `serverless.yml` to change the above settings.

```yaml
service: serverless-webcron

provider:
  # ...
  region: "ap-northeast-1" # <-- AWS region
  # ...

functions:
  execute:
    handler: handler.execute
    events:
      - schedule: "cron(0 19 * * ? *)" # <-- Time to run cron everyday
```

## Configure Secrets

```bash
$ cp secrets.example.yml secrets.yml
$ edit secrets.yml
```

* Replace `slack_webhook_url` with your own Slack Webhook URL.
* Replace `dynamodb_table_name` if you like to, **but it's strongly recommended
  to modify it before first deployment**. It would be difficult to modify after
  first deployment.

## Deploy

```bash
$ yarn run sls deploy
```

## Creates or Updates Websites

Log in [AWS console](https://console.aws.amazon.com),
[navigate](https://ap-northeast-1.console.aws.amazon.com/dynamodb/home?region=ap-northeast-1#tables:selected=sites)
to DynamoDB, open `sites` table (might be different if you change it in
`secrets.yml` before first deployment) and create or update your websites.

### Website Scheme

```json
{
  "id": "unique identity",
  "name": "human-readable name of website",
  "url": "URL of web cron"
}
```

## License

MIT
