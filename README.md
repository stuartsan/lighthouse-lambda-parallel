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

## Local installation and deploy
There are three lambdas and they all need to be built. The resulting zip files also include all the dependencies they will need inside the lambda container. Each lambda build process facilitates this by using `webpack` to compile the lambda typescript code, then installing all the needed dependencies inside the `dist` folder, then terraform will zip them off and send them on their way.
#### Install all lambda dependencies
`npm run install-all`
#### Build all the lamdbas
`npm run build`

Next you can run `terraform apply` to push everything out, however if you have made any code changes you will first need to bump the version `locals.app_version` in `infra.tf` prior to the apply. 

## Run lighthouse against multiple urls
Once you have deployed using terraform, you can run locally:
- Put JSON list of urls in `urls.json`
- `./lighthouse-parallel urls.json --runs 2`

