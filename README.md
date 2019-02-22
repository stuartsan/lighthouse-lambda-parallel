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
- aws access credentials (pretty much admin access required) (not really but you'll be creating a number of things -- see `infra.tf` to come up with the exact requirements)
- Terraform (I'm using v0.11.11)
- python3 (to invoke CLI)
- boto3 (to invoke CLI)
- nodejs 8.10
- yarn

## Deploy it

- `touch lambdas/dist/init.zip lambdas/dist/worker.zip lambdas/dist/post-processor.zip`
- `yarn` to install dependencies inside each of the `lambdas/src` directories
- Change the `locals` block in `infra.tf` as needed for your org name, region, creds file path, etc.
- `terraform init`
- `terraform plan`
- `terraform apply`

## Run lighthouse against multiple urls

- Put JSON list of urls in `urls.json`
- `./lighthouse-parallel urls.json --runs 1000`

## Making changes
- Infrastructure changes: just `terraform apply`
- JS code changes: increment `locals.app_version` and then `terraform apply` (probably not a great idea to use TF to manage the lambda functions' deployment, but this is a prototype, didn't want to add Another Tool)
