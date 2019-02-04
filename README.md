## Requirements

- Make a new GCP project (mine is called "lighthouse-metrics"
- Do the thing about "adding credentials" -- create a JSON credential and download it to this project's root directory
- enable GKE api in console

- Terraform (I'm using v0.11.11)
- https://www.terraform.io/docs/providers/google/getting_started.html#before-you-begin
- terraform init
- terraform plan
- terraform apply / yes

- install `gcloud`
- gcloud components install kubectl
- gcloud auth activate-service-account --key-file=./account.json
- get a kubeconfig: gcloud container clusters get-credentials lighthouse-metrics --zone=us-west1-a --project=lighthouse-metrics
- requiring manual downscale tho `gcloud container clusters resize lighthouse-metrics --node-pool lighthouse-metrics-workers --size 0 --zone=us-west1-a --project=lighthouse-metrics` cause cluster autoscaler is either taking 10m to turn it down or never
