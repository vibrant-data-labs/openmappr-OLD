#!/bin/bash
#
#
#		       This script sets up a local environment on
#	                   Ubuntu Desktop 20 LTS
#
#               Script must be run with root privileges
#
#
# Get updates
apt update -y
# Remove old versions of docker dependencies
apt remove docker docker.io containerd runc -y
apt upgrade -y
apt autoremove -y
# Install dependencies
apt install nodejs npm build-essential ruby-full git python -y
# Install gems
gem install sass compass
# Install docker
apt install docker.io -y
sudo systemctl enable --now docker
# Install docker-compose
apt install docker-compose -y
# Download Node Version Manager
echo "Downloading Node Version Manager"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
sleep 2
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
# install yo bower grunt-cli (from  directory root)
echo
echo "Install yo bower grunt-cli in node."
echo
sleep 2
npm install -g yo bower grunt-cli
# Installing NPM packages, Bower and Grunt
echo
echo "Installing NPM packages, Bower and Grunt."
echo
sleep 2
npm install --unsafe-perm=true --allow-root
bower install --allow-root
grunt
# bring up all the docker services
echo
echo "Bring up all the docker services."
echo
docker-compose -f docker-compose-local.yml up -d
sleep 10

# Start Application
echo
echo "Starting Application"
echo
sh run_local_mode.sh
