pipeline {
    agent agent {
        docker { image 'node:20.18.0-alpine' }
    }
    stages {
        stage("Get dependencies") {
            steps {
                echo "installing npm dependencies"
                sh "npm install"
            }
        }

        stage("Unit and Integration tests") {
            steps {
                echo "Running tests"
                sh "npm run test"
            }
        }

        stage("E2E tests") {
            steps {
                echo "Running E2E tests"
                sh "npm run test:e2e:medulla-whatsapp"
                sh "npm run test:e2e:medulla-ai"
                sh "npm run test:e2e:subscription"
            }
        }
    }
}