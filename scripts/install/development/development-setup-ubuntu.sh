#!/bin/bash
#
#                 The only thing you need to install here is cURL.
#                          `sudo apt install curl -y`
#
#
#
# Not yet tested on Ubuntu

# Assign Color Variables
BLACK=0
RED=1
GREEN=2
YELLOW=3
BLUE=4
MAGENTA=5
CYAN=6
WHITE=7

# Prompt user to start setup
tput setaf $CYAN; read -n1 -p "Press Y/y to set up Openmappr for development on Ubuntu >> "  key

# Exit if not Y/y
if [[ "$key" != "y" && "$key" != "Y" ]] ; then
  tput setaf $RED; echo ">> Exiting! "
  tput setaf $WHITE;
  exit
fi

tput setaf $MAGENTA; echo "
>> Asking for a sudo password..."
sudo whoami >>/dev/null

tput setaf $MAGENTA; echo ">> Updating sources..."
tput setaf $YELLOW;
sudo apt update >>/dev/null

sleep 2

# Remove any old versions of docker
tput setaf $MAGENTA; echo ">> Removing old docker versions..."
tput setaf $YELLOW;
sudo apt remove docker docker-engine docker.io containerd runc -y >>/dev/null

# Install OpenMappr dependencies via apt
tput setaf $MAGENTA; echo ">> Installing OpenMappr dependencies..."
tput setaf $YELLOW;
sudo apt install build-essential ruby-full git python -y >>/dev/null

sleep 2

# Install Ruby gems
tput setaf $MAGENTA; echo ">> Installing Ruby gems..."
tput setaf $YELLOW;
sudo gem install sass compass >>/dev/null

sleep 2

# Install docker via apt
tput setaf $MAGENTA; echo ">> Installing docker..."
tput setaf $YELLOW;
curl -sSL https://get.docker.com | sudo bash

# Start and enable the docker service
tput setaf $MAGENTA; echo ">> Setting up the docker service..."
tput setaf $YELLOW;
sudo systemctl start docker
sudo systemctl enable docker

# Install docker compose
tput setaf $MAGENTA; echo ">> Installing docker-compose..."
tput setaf $YELLOW;
sudo curl -L "https://github.com/docker/compose/releases/download/1.25.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose >>/dev/null
sudo chmod +x /usr/local/bin/docker-compose

sleep 2

# Install Node Version Manager
tput setaf $MAGENTA; echo ">> Installing Node Version Manager..."
tput setaf $YELLOW;
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Switch to Node 8.12.0
tput setaf $CYAN; echo "Installing and switching to Node v8.12.0..."
tput setaf $YELLOW;
nvm install 8.12.0
nvm use 8.12.0

sleep 2

# Installing yo, bower, and grunt
tput setaf $MAGENTA; echo ">> Installing global NPM packages: yo, bower, and grunt..."
tput setaf $YELLOW;
npm install -g yo bower grunt-cli >>/dev/null

sleep 2

# Clone Github Repository
tput setaf $CYAN; echo "Cloning Openmappr repository from Github..."
if [ -d "./openmappr" ] ; then
  tput setaf $GREEN; echo "Repository is already cloned!"
  cd openmappr
else
  tput setaf $YELLOW;
  git clone https://github.com/selfhostedworks/openmappr.git
  cd openmappr
fi

sleep 2

tput setaf $CYAN; echo "Running npm and bower install steps..."
tput setaf $YELLOW; 
npm install >>/dev/null
bower install >>/dev/null

# Build the application
tput setaf $CYAN; echo "Building the application with grunt..."
tput setaf $YELLOW; 
grunt >>/dev/null

sleep 2

# Start the docker-compose stack
tput setaf $MAGENTA; echo ">> Checking for an existing docker compose stack..."
if sudo docker ps -a | grep -q "openmappr_" &2>/dev/null ; then
  tput setaf $GREEN; echo "The docker compose stack is already running. Let's remove it and start over..."
  sudo docker-compose down &1>/dev/null
  sudo docker-compose -f docker-compose.local.yml up -d
else
  tput setaf $CYAN; echo "Starting local development stack via Docker Compose..."
  sudo docker-compose -f docker-compose.local.yml up -d
fi

sleep 2

# Start the server
tput setaf $CYAN; echo "Running server at http://localhost:8080 ..."
./run_local_mode.sh

# Set default color back to white
tput setaf $WHITE;