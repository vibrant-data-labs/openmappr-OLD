#!/bin/bash
# 

####################

# Installing Homebrew Package Manager
echo "Installing Homebrew"
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"

# Installing Node Version Manager 
echo "Installing Node Version Manager (NVM)"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash

# Reload system environment 
echo "Reloading system environment"
source ~/.zshrc

# Install NodeJS 8.12
echo "Installing NodeJS v8.12.0 (openmappr dependency)"
nvm install 8.12.0

# Switch to NodeJS 8.12 (for openmappr)
echo "Switching to NodeJS v8.12.0"
nvm use 8.12.0

# Install Docker 
echo "Installing Docker"
brew cask install docker

# Open Docker, it needs to be up during install
echo "Opening Docker"
open /Applications/Docker.app

# Install Git
echo "Installing Git"
brew install git

# Clone openmappr Github Repository
echo "Cloning openmappr Repository from Github"
git clone https://github.com/selfhostedofficial/openmappr
cd openmappr

# Install Ruby
echo "Installing Ruby"
brew install ruby

# Install Ruby Gem Sass
echo "Installing Ruby Gem: Sass"
why i
gem install sass

# Installing Bower & Grunt 
echo "Installing bower and grunt"
sudo npm install -g yo bower grunt-cli
npm install
bower install

# Build the application
echo "Building application"
grunt

# Start the server
echo "running server at PORT: http://localhost:8080"
./run_local_mode.sh

# When you need to re-open the application
# Navigate to the ROOT of your local github repo
# Run the following command:
# 
# docker-compose -f docker-compose-local.yml up -d



