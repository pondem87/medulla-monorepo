pipeline {
    agent any
    stages {
        stage("get_dependancies") {
            steps {
                echo "install npm dependencies"
                sh "npm install"
            }
        }
    }
}