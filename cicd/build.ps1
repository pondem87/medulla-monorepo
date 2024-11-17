# Assume $args[0] is passed as input
$switch = $args[0]

# Check if $switch is null or doesn't match any of the allowed strings
if (-not $switch -or $switch -notin "nest-build", "build-image", "tag", "push") {
    Write-Host "Invalid input. Exiting..."
    exit 1
}

# If valid, continue
Write-Host "Valid command: $switch"

if ($switch -eq "nest-build" -or $switch -eq "all") {
    Write-Host "Building apps..."
    nest build medulla-ai
    nest build medulla-whatsapp
    nest build subscription
}

if ($switch -eq "build-image" -or $switch -eq "all") {
    Write-Host "Building docker images for each app..."
    $tag = $args[1]
    if (-not $tag) {
        Write-Host "Please provide tag for images"
        exit 1
    }
    Write-Host "tag: $tag"
    docker build -f .\cicd\medulla-ai\Dockerfile -t medulla-ai:0.1.0-dev .
    docker build -f .\cicd\medulla-whatsapp\Dockerfile -t medulla-whatsapp:0.1.0-dev .
    docker build -f .\cicd\subscription\Dockerfile -t subscription:0.1.0-dev .
}

if ($switch -eq "tag" -or $switch -eq "all") {
    Write-Host "Applying ECR tag to images..."
    $tag = $args[1]
    if (-not $tag) {
        Write-Host "Please provide tag for images"
        exit 1
    }
    Write-Host "tag: $tag"
    docker tag medulla-ai:0.1.0-dev 533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/medulla-ai:0.1.0-dev
    docker tag medulla-whatsapp:0.1.0-dev 533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/medulla-whatsapp:0.1.0-dev
    docker tag subscription:0.1.0-dev 533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/subscription:0.1.0-dev
}

if ($switch -eq "push" -or $switch -eq "all") {
    Write-Host "Pushing images to ECR..."
    $tag = $args[1]
    if (-not $tag) {
        Write-Host "Please provide tag for images"
        exit 1
    }
    Write-Host "tag: $tag"
    docker push "533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/medulla-ai:$tag"
    docker push "533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/medulla-whatsapp:$tag"
    docker push "533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/subscription:$tag"
}

