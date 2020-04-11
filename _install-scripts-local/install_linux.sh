#!/bin/bash
#
#        The only thing you need to install here is cURL.
#             `sudo apt install curl -y` 
#             To do so
# Get updates
sudo apt update -y
sudo apt dist-upgrade -y

# remove old versions of docker dependencies
sudo apt remove docker docker-engine docker.io containerd runc -y 

# Install dependencies
sudo apt update -y 

# Install docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install docker-compose
sudo apt install docker-compose -y

# Download Node Version Manager
echo "Downloading Node Version Manager"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash

# Reload the system environment
echo "Reloading system environment"
source ~/.profile

# Install Node Version 8.12
echo "Installing Node version 8.12"
nvm install 8.12.0

# Switch to Node Node Version 8.12
echo "Switching to Node v 8.12.0"
nvm use 8.12.0

# Clone openMappr repo
echo "Cloning openmappr repo"
git clone https://github.com/selfhostedofficial/openmappr
cd openmappr

>>>> stopped here



# gem install sass
# gem install compass

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

sudo sh run_local_mode.sh


# bring up all the docker services
echo
echo "Bring up all the docker services."
echo
sleep 2
docker-compose -f docker-compose-local.yml up -d

