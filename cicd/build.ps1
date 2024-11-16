nest build medulla-ai
nest build medulla-whatsapp
nest build subscription

docker build -f .\cicd\medulla-ai\Dockerfile -t medulla-ai:0.1.0-dev .
docker build -f .\cicd\medulla-whatsapp\Dockerfile -t medulla-whatsapp:0.1.0-dev .
docker build -f .\cicd\subscription\Dockerfile -t subscription:0.1.0-dev .

docker tag medulla-ai:0.1.0-dev 533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/medulla-ai:0.1.0-dev
docker tag medulla-whatsapp:0.1.0-dev 533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/medulla-whatsapp:0.1.0-dev
docker tag subscription:0.1.0-dev 533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/subscription:0.1.0-dev

docker push 533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/medulla-ai:0.1.0-dev
docker push 533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/medulla-whatsapp:0.1.0-dev
docker push 533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/subscription:0.1.0-dev