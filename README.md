This project shows how to run up to thousands of concurrent
instances of Lighthouse on AWS Lambda. For more detail check out the
[blog post](https://stuartsandine.com/lighthouse-lambda-parallel) about it.

Here is a picture of how it works:

```
                                                             ┌──────────────────────────┐                       
                                                             │SNS topic for dead letters│                       
                                                             └──────────────────────────┘                       
                                                                           ▲                                    
                                                                           │                                    
                                                                ┌──────────┼─────┐                              
                  ┌────────────────┐                            │┌─────────▼─────┴┐                             
                  │                │    ┌───────────────┐       ││┌───────────────┴┐  ┌────────────────────────┐
┌───────────┐     │Lambda function │    │               │       │││Lambda function │  │   Lambda function #3   │
│  Lambda   │     │       #1       │    │ SNS topic for │       │││       #2       │  │                        │
│ client or │◀───▶│                │───▶│   test runs   │───────┼▶│                │  │  Subscribed to dynamo  │
│AWS console│     │  Initializer   │    │               │       └┤│   Lighthouse   │  │  stream to hook into   │
└───────────┘     │                │    │               │        └┤     worker     │  │moment of Job completion│
                  └────────────────┘    └───────────────┘         └─────────────┬──┘  └────────────────────────┘
                           │                                               ▲    │                  ▲            
                           │                     ┌─────────────────────────┼────┼──────────────────┘            
                           │                     │                         │    │                               
                           │                     │                         │    │                               
                           │           ┌──────────────────┐                │    │                               
                           │           │     DynamoDB     │                │    │                               
                           │           │                  │                │    │                               
                           └──────────▶│Metadata and state│◀───────────────┘    ▼                               
                                       │for Jobs and Runs │          ┌─────────────────────┐                    
                                       └──────────────────┘          │         S3          │                    
                                                                     │                     │                    
                                                                     │   Full lighthouse   │                    
                                                                     │       reports       │                    
                                                                     └─────────────────────┘                    
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
