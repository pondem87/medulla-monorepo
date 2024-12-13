# Main Application Helm Chart

## Setting up the environment

To set environment see assets/README.md


## Deploying the apps

Get values files from AWS S3

command:
aws s3 cp s3://pfitz-configs/medulla/staging/values-staging.yaml ./medulla
aws s3 cp s3://pfitz-configs/medulla/prod/values-prod.yaml ./medulla

helm install medulla-stag medulla -f medulla/values-staging.yaml
helm install medulla-prod medulla -f medulla/values-prod.yaml