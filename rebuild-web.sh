#!/bin/bash
docker-compose pause
docker-compose stop web
docker-compose rm -f web
docker-compose build --no-cache web
docker-compose up -d web
docker-compose unpause
