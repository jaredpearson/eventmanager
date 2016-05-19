
FROM postgres:9.4

RUN mkdir -p /docker-entrypoint-initdb.d
COPY ./sql/*.sql /docker-entrypoint-initdb.d/
