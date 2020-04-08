#!/bin/bash

#This Script will assume you have Docker & Docker Compose installed
#Please follow the latest instructions on intalling this libraries:
# https://docs.docker.com/install/
# https://docs.docker.com/compose/install/

# Node version 8.12 is also required
# nvm is recommended but n is another option
# Visit NVM for instructions on install
# https://github.com/nvm-sh/nvm#installing-and-updating


# bring up all the docker services
echo
echo "Bring up all the docker services."
echo
sleep 2
docker-compose -f docker-compose-local.yml up -d

# install yo bower grunt-cli
echo
echo "Install nvm and node 8.12."
echo
sleep 2
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
nvm install 8.12

gem install sass
gem install compass

# install yo bower grunt-cli
echo
echo "Install yo bower grunt-cli in node."
echo
sleep 2
npm install -g yo bower grunt-cli

# install dependencies
echo
echo "Install dependencies."
echo
sleep 2
npm install
bower install

grunt

./run_local_mode.sh

