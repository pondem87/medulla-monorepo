helm repo add eks https://aws.github.io/eks-charts

helm upgrade -i aws-load-balancer-controller eks/aws-load-balancer-controller --namespace kube-system --set clusterName=pfitz-kube-1 --set serviceAccount.create=false --set serviceAccount.name=aws-load-balancer-controller

kubectl -n kube-system rollout status deployment aws-load-balancer-controller

kubectl get deployment -n kube-system aws-load-balancer-controller