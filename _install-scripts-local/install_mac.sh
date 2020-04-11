#!/bin/bash
# 
# This script assumes you have nothing installed. It will skip over anything you don't need.
# 
#
#
# Install Xcode as unattended first


####################

echo "Installing Homebrew"
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"

echo "Installing Node Version Manager (NVM)"
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.1/install.sh | bash

# reload the system environment
echo "Reloading system environment"
source ~/.zshrc

# Install NodeJS 8.12 and switch to it
echo "Installing NodeJS v8.12.0 (openmappr dependency)"
nvm install 8.12.0

echo "Switching to NodeJS v8.12.0"
nvm use 8.12.0


# Install dependencies 
echo "Installing docker"
brew install docker 

echo "Installing dependencies"
brew install git curl

echo "Cloning openmappr repo"
git clone https://github.com/selfhostedofficial/openmappr
cd openmappr

# Install the compass Gem
echo "installing compass gem"
gem install compass

echo "Installing bower and grunt"
sudo npm install -g yo bower grunt-cli
npm install
bower install

# Build the application
echo "Building application"
grunt

echo "running server at PORT: http://localhost:8080"
./run_local_mode.sh

# Open a browser window
# echo "opening https://localhost:8080"
# open https://localhost:8080

# echo running server at PORT: http://localhost:8080
# ./run_local_mode.sh

