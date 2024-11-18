# Assume $args[0] is passed as input
$switch = $args[0]

# Check if $switch is null or doesn't match any of the allowed strings
if (-not $switch -or $switch -notin "nest-build", "build-image", "tag", "re-tag", "push", "all") {
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
    docker build -f .\cicd\medulla-ai\Dockerfile -t "medulla-ai:$tag" .
    docker build -f .\cicd\medulla-whatsapp\Dockerfile -t "medulla-whatsapp:$tag" .
    docker build -f .\cicd\subscription\Dockerfile -t "subscription:$tag" .
}

if ($switch -eq "tag" -or $switch -eq "all") {
    Write-Host "Applying ECR tag to images..."
    $tag = $args[1]
    if (-not $tag) {
        Write-Host "Please provide tag for images"
        exit 1
    }
    Write-Host "tag: $tag"
    docker tag "medulla-ai:$tag" "533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/medulla-ai:$tag"
    docker tag "medulla-whatsapp:$tag" "533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/medulla-whatsapp:$tag"
    docker tag "subscription:$tag" "533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/subscription:$tag"
}

if ($switch -eq "re-tag") {
    Write-Host "Applying ECR tag to images..."
    $tag1 = $args[1]
    if (-not $tag1) {
        Write-Host "Please provide old tag for images"
        exit 1
    }

    $tag2 = $args[2]
    if (-not $tag2) {
        Write-Host "Please provide new tag for images"
        exit 1
    }

    Write-Host "tagging tag:$tag1 to tag:$tag2"
    docker tag "medulla-ai:$tag1" "533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/medulla-ai:$tag2"
    docker tag "medulla-whatsapp:$tag1" "533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/medulla-whatsapp:$tag2"
    docker tag "subscription:$tag1" "533267159380.dkr.ecr.eu-west-2.amazonaws.com/medulla/subscription:$tag2"
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

