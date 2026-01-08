pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'nexus.yourcompany.com:8082'
        DOCKER_CREDENTIALS_ID = 'nexus-docker-credentials'
        GRADLE_OPTS = '-Dorg.gradle.daemon=false'
        IMAGE_TAG = "${env.GIT_COMMIT?.take(8) ?: 'latest'}"
    }

    tools {
        jdk 'JDK17'
        nodejs 'NodeJS18'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.GIT_BRANCH_NAME = sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    echo "Building commit: ${env.GIT_COMMIT_SHORT} on branch: ${env.GIT_BRANCH_NAME}"
                }
            }
        }

        stage('Build & Test') {
            steps {
                sh 'chmod +x gradlew'
                sh './gradlew clean build --no-daemon --parallel'
            }
            post {
                always {
                    junit '**/build/test-results/test/*.xml'
                }
            }
        }

        stage('Code Quality') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                echo 'Running code quality checks...'
                // Uncomment when SonarQube is configured
                // withSonarQubeEnv('SonarQube') {
                //     sh './gradlew sonarqube --no-daemon'
                // }
            }
        }

        stage('Build Angular Frontend') {
            steps {
                dir('frontend/ihms-portal') {
                    sh 'npm ci'
                    sh 'npm run build:prod'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    def services = [
                        'discovery-service',
                        'gateway-service',
                        'auth-service',
                        'patient-service',
                        'appointment-service',
                        'billing-service',
                        'pharmacy-service',
                        'frontend/ihms-portal'
                    ]

                    services.each { service ->
                        def imageName = service.contains('/') ? service.split('/')[1] : service
                        echo "Building Docker image for ${imageName}..."
                        sh """
                            docker build -t ${DOCKER_REGISTRY}/ihms/${imageName}:${env.GIT_COMMIT_SHORT} \
                                         -t ${DOCKER_REGISTRY}/ihms/${imageName}:latest \
                                         -f ${service}/Dockerfile .
                        """
                    }
                }
            }
        }

        stage('Push to Nexus Registry') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKER_CREDENTIALS_ID}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    script {
                        sh "echo ${DOCKER_PASS} | docker login ${DOCKER_REGISTRY} -u ${DOCKER_USER} --password-stdin"

                        def services = [
                            'discovery-service',
                            'gateway-service',
                            'auth-service',
                            'patient-service',
                            'appointment-service',
                            'billing-service',
                            'pharmacy-service',
                            'ihms-portal'
                        ]

                        services.each { service ->
                            echo "Pushing ${service} to Nexus..."
                            sh """
                                docker push ${DOCKER_REGISTRY}/ihms/${service}:${env.GIT_COMMIT_SHORT}
                                docker push ${DOCKER_REGISTRY}/ihms/${service}:latest
                            """
                        }
                    }
                }
            }
        }

        stage('Deploy to Dev') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    echo 'Deploying to Development environment...'
                    sshagent(['dev-server-ssh-key']) {
                        sh '''
                            ssh -o StrictHostKeyChecking=no deployer@dev-server.yourcompany.com << 'ENDSSH'
                                cd /opt/ihms
                                docker-compose pull
                                docker-compose up -d
                                docker image prune -f
                            ENDSSH
                        '''
                    }
                }
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo 'Deploying to Staging environment...'
                    sshagent(['staging-server-ssh-key']) {
                        sh '''
                            ssh -o StrictHostKeyChecking=no deployer@staging-server.yourcompany.com << 'ENDSSH'
                                cd /opt/ihms
                                docker-compose pull
                                docker-compose up -d
                                docker image prune -f
                            ENDSSH
                        '''
                    }
                }
            }
        }

        stage('Deploy to Production') {
            when {
                allOf {
                    branch 'main'
                    tag pattern: 'v\\d+\\.\\d+\\.\\d+', comparator: 'REGEXP'
                }
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
                script {
                    echo 'Deploying to Production environment...'
                    sshagent(['prod-server-ssh-key']) {
                        sh '''
                            ssh -o StrictHostKeyChecking=no deployer@prod-server.yourcompany.com << 'ENDSSH'
                                cd /opt/ihms
                                docker-compose pull
                                docker-compose up -d --no-recreate
                                docker image prune -f
                            ENDSSH
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
            sh 'docker logout ${DOCKER_REGISTRY} || true'
        }
        success {
            echo 'Pipeline completed successfully!'
            // Uncomment for Slack notifications
            // slackSend(color: 'good', message: "Build Successful: ${env.JOB_NAME} #${env.BUILD_NUMBER}")
        }
        failure {
            echo 'Pipeline failed!'
            // Uncomment for Slack notifications
            // slackSend(color: 'danger', message: "Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}")
        }
    }
}

