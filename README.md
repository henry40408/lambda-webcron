# Lambda Webcron

> Webcron powered by AWS Lambda

## Requirements

- Node 6.x (LTS Boron)
- AWS CLI, [with credentials configured](https://serverless.com/framework/docs/providers/aws/guide/credentials/)

## Installatin Dependencies

`yarn` is recommended, `npm` should work as well.

```bash
$ yarn
```

## Default Values

- AWS region: `ap-northeast-1`
- Time to run cron everyday: 19:00 UTC / 03:00 CST

Edit `serverless.yml` to change the above settings.

```yaml
service: lambda-webcron

provider:
  # ...
  region: ap-northeast-1 # <-- AWS region
  # ...

functions:
  execute:
    handler: handler.execute
    events:
      - schedule: cron(0 19 * * ? *) # <-- Time to run cron everyday
```

Unfortunately, name of DynamoDB table `sites` is currently unable to configure.

## Configure Slack

```bash
$ cp secrets.example.yml secrets.yml
$ edit secrets.yml
```

Replace `slack_webhook_url` with your own Slack Webhook URL.

## Deploy

```bash
$ yarn run sls deploy
```

## Creates or Updates Websites

Log in [AWS console](https://console.aws.amazon.com), [navigate](https://ap-northeast-1.console.aws.amazon.com/dynamodb/home?region=ap-northeast-1#tables:selected=sites) to DynamoDB, open `sites` table and create or update your websites.

## License

MIT
