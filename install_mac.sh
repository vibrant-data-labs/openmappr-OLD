#!/bin/bash

#This Script will assume you have Docker & Docker Compose installed
#Please follow the latest instructions on intalling this libraries:
# https://docs.docker.com/install/
# https://docs.docker.com/compose/install/

# Node version 8.12 is also required
# nvm is recommended but n is another option
# Visit NVM for instructions on install
# https://github.com/nvm-sh/nvm#installing-and-updating

echo Running docker Compose scripts

docker-compose -f docker-compose-local.yml up -d
docker-compose -f docker-compose-local.yml ps

echo installling Node.js version 8.12.0
nvm install 8.12.0
node --version

clear

echo installing gems
echo compass:
sudo gem install compass

clear

echo installing dependencies

sudo npm install -g yo bower grunt-cli
npm install
bower install

clear

echo building app

grunt

echo running server at PORT: http://localhost:8080
./run_local_mode.sh

