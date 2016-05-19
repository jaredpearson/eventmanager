# Event Manager

## Setup

1. Install [Docker](https://www.docker.com) version at least 1.11.1. Make sure the installation includes Docker Compose.
2. A environment file needs to be created in the main directory with the name of `postgres.env`. This is used to store the properties about the root user for the database. In the file there needs to be the following properties.

    POSTGRES_PASSWORD=
    POSTGRES_USER=

3. Build the Docker images and start containers

    docker-compose build
    docker-compose up -d
    
4. Visit the web application at the following address

    http://localhost:8289
