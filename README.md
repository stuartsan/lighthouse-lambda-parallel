This project shows how to run up to thousands of concurrent
instances of Lighthouse on AWS Lambda. For more detail check out the
[blog post](https://stuartsandine.com/lighthouse-lambda-parallel) about it.

Here is a picture of how it works:

```
       ┌─────────────────┐                                                                          
       │Lambda client or │                                                                          
       │   AWS console   │                                                                          
       │                 │                                                                          
       └─────────────────┘                                                                          
                ▲                                                                                   
                │                                                                                   
                ▼                                                                                   
  ┌───────────────────────────┐             Creates Job,         ┌──────────────────────────────┐   
  │    Lambda function #1     │          publishes messages      │           DynamoDB           │   
  │                           │                                  │                              │   
  │Input: set of urls, n runs │─────────────────────┬───────────▶│ Metadata and state for Jobs  │──┐
  │      Returns: Job id      │                     │            │                              │  │
  │                           │                     │            └──────────────────────────────┘  │
  └───────────────────────────┘                     ▼                            ▲                 │
                                      ┌──────────────────────────┐               │                 │
                                      │                          │               │                 │
                                      │ SNS topic for test runs. │               │                 │
                ┌─────────────────────│ Each message is {JobId,  │               │                 │
                │                     │           Url}           │               │                 │
                │                     │                          │               │                 │
                │                     └──────────────────────────┘               │                 │
┌───────────────▼───────────┐                                                    │                 │
│ ┌─────────────────────────┴─┐        ┌──────────────────────────┐              │                 │
│ │ ┌─────────────────────────┴─┐      │SNS topic for dead letters│              │                 │
│ │ │                           │◀────▶│                          │              │                 │
│ │ │  AWS Lambda function #2:  │      └──────────────────────────┘              │                 │
│ │ │     lighthouse worker     │◀───────────────────────────────────────────────┘                 │
└─┤ │                           │                                 ┌──────────────────────────────┐ │
  └─┤                           │────────────────────────────────▶│                              │ │
    └───────────────────────────┘                                 │              S3              │ │
                                                                  │                              │ │
                                                                  │   Full lighthouse reports    │ │
    ┌──────────────────────────────┐                              │                              │ │
    │      Lambda function #3      │                              └──────────────────────────────┘ │
    │                              │                                                               │
    │Subscribed to dynamo stream to│◀──────────────────────────────────────────────────────────────┘
    │   hook into moment of Job    │                                                                
    │          completion          │                                                                
    └──────────────────────────────┘                                                                
```

## Requirements

- aws account
- aws access credentials (you'll need authorization to create pretty

- touch lambdas/dist/init.zip lambdas/dist/worker.zip lambdas/dist/post-processor.zip
- Terraform (I'm using v0.11.11)
- terraform init
- terraform plan
- terraform apply / yes

- python3 (to invoke script)
- boto3 (to invoke script)
