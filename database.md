
# Setup
A environment file needs to be created in the main directory with the name of `postgres.env`. This is used to store the properties about the root user for the database. In the file there needs to be the following properties.

```
POSTGRES_PASSWORD=
POSTGRES_USER=
```

# Commands
Before running any of the following commands, the environment variable needs to be sourced.

```
source postgres.env
```

Running `psql` on the database

```
docker-compose exec postgres psql -U $POSTGRES_USER eventmanager
```

Running a migration against the database

```
docker exec -i "$(docker-compose ps -q postgres)" psql -U $POSTGRES_USER -f - eventmanager < ./sql/v006___admin_user.sql
```
