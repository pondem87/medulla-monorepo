# SETTING UP TLS WITH DOKS

We are going to deploy the system on DigitalOcean's Kubernetes service.
DOKS is cheaper and simpler to setup compared to AWS EKS

## Nginx Ingress Controller

We start by installing the nginx ingress controller which in turn automagically installs a loadbalancer. DO provisions a load balancer for the purpose (which will incurr charges).

command:
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
kubectl create ns ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx -f nginx-values.yaml

When TLS is enabled in the Ingress object, a secret will need to be available in the namespace to contain the keys for the certificate. This will be automated with Cert Manager and Lets Encrypt will provide the certificate.

## Cert Manager

To use Cert Manager we need CRDs and then install the chart.

#### Add the CRDs
command:
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.16.2/cert-manager.crds.yaml

#### Add the Jetstack Helm repository
command:
helm repo add jetstack https://charts.jetstack.io --force-update

#### Install the cert-manager helm chart
command:
kubectl create ns cert-manager
helm install cert-manager -n cert-manager --version v1.16.2 jetstack/cert-manager

#### Install issuer
** The issuer is namespace bound, so I will install together with my application's helm chart.

## App namespaces
I will two namespaces for production and for staging
command:
kubectl create ns medulla-prod
kubectl create ns medulla-staging