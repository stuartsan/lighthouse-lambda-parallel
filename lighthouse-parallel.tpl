#!/usr/bin/env python3

import argparse
import json
import sys
import time
import boto3


parser = argparse.ArgumentParser(
    description='Invoke lighthouse in parallel in AWS Lambda')

parser.add_argument('--runs', default=1, type=int,
                    help='Number of runs per url')

parser.add_argument(
    '--region',
    type=str,
    default="${lambda_init_region}",
    help='AWS region')

parser.add_argument('urls', type=argparse.FileType('r'),
                    help='JSON file: an array of urls to test')

args = parser.parse_args()

lambda_client = boto3.client('lambda', region_name=args.region)
ddb_client = boto3.client('dynamodb', region_name=args.region)

lambda_payload = {
    'urls': json.load(args.urls),
    'runsPerUrl': args.runs,
    # punch in your own options, from
    # github.com/GoogleChrome/lighthouse/blob/888bd6dc9d927a734a8e20ea8a0248baa5b425ed/typings/externs.d.ts#L82-L119
    'lighthouseOpts': {
      'chromeFlags': [
        '--headless',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--no-sandbox',
        '--single-process',
        '--hide-scrollbars',
      ]
    }
}

lambda_response = lambda_client.invoke(
    FunctionName='${lambda_init_arn}',
    Payload=json.dumps(lambda_payload),
)

lambda_response_payload = json.loads(
    lambda_response['Payload'].read().decode("utf-8"))
job_id = lambda_response_payload['jobId']


def progress(count, total, status=''):
    bar_len = 60
    filled_len = int(round(bar_len * count / float(total)))

    percents = round(100.0 * count / float(total), 1)
    bar = '=' * filled_len + '-' * (bar_len - filled_len)

    sys.stdout.write('[%s] %s%s | %s\r' % (bar, percents, '%', status))
    sys.stdout.flush()


print(f'Job id: {job_id}')

while True:
    response = ddb_client.get_item(
        TableName='${jobs_table_name}',
        Key={'JobId': {'S': job_id}}
    )

    total = int(response['Item']['PageCountTotal']['N'])
    success = int(response['Item']['PageCountSuccess']['N'])
    error = int(response['Item']['PageCountError']['N'])

    progress(
        success + error,
        total,
        f'Total runs: {total} | Succeeded: {success} | Failed: {error}')

    if success + error >= total:
        print('\n')
        break

    time.sleep(.5)
