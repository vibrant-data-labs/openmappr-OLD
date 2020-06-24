#!/bin/bash
# Tested on macOS Catalina 10.15.5

# Assign Color Variables
BLACK=0
RED=1
GREEN=2
YELLOW=3
BLUE=4
MAGENTA=5
CYAN=6
WHITE=7

tput setaf $CYAN; read -n1 -p "Press Y/y to set up Openmappr for development on macOS >> "  key

if [[ "$key" != "y" && "$key" != "Y" ]] ; then
  tput setaf $RED; echo ">> Exiting! "
  tput setaf $WHITE;
	exit
fi

# Call sudo to have user enter their password
tput setaf $MAGENTA; echo "
>> Asking for a sudo password..."
sudo whoami >>/dev/null

sleep 2 

# Installing Homebrew Package Manager
tput setaf $MAGENTA; echo ">> Checking for Homebrew..."
if brew -v | grep -q "Homebrew"  &2>/dev/null ; then
  tput setaf $GREEN; echo "Homebrew is already installed!" &2>/dev/null
else
  tput setaf $CYAN; echo "Installing Homebrew...";
  ${SHELL} -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)" &2>/dev/null
fi

sleep 2 

# Installing Node Version Manager
tput setaf $MAGENTA; echo ">> Checking for Node v8.12.0..."
if node -v | grep -q "v8.12.0" ; then
  tput setaf $GREEN; echo "Node v8.12.0 is already installed!"
else
  tput setaf $CYAN; echo "Installing Node Version Manager v0.35.3..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | ${SHELL}
  # Install Node 8.12.0
  tput setaf $CYAN; echo "Installing Node v8.12.0..."
  nvm install 8.12.0
fi

sleep 2 

# Reload system environment
tput setaf $CYAN; echo "Reloading system environment..."
case ${SHELL} in
  "/bin/bash" )
    source ~/.bash_profile
  ;;
  "/bin/zsh" )
    source ~/.zshrc
  ;;
  *)
    source ~/.bash_profile
  ;;
esac

sleep 2 

# Install Docker
tput setaf $MAGENTA; echo ">> Checking for Docker..."
DOCKER_PATH=/Applications/Docker.app
if [ -d ${DOCKER_PATH} ] ; then
  tput setaf $GREEN; echo "Docker is already installed!"
else
  tput setaf $CYAN; echo "Installing Docker..."
  tput setaf $YELLOW;
  brew cask install docker
fi

# Open Docker, it needs to be up during install
tput setaf $CYAN; echo "Opening Docker..."
open /Applications/Docker.app

sleep 2 

# Install Git
tput setaf $MAGENTA; echo ">> Checking for Git..."
if git --version | grep -q "git version" ; then
  tput setaf $GREEN; echo "Git is already installed!"
else
  tput setaf $CYAN; echo "Installing Git..."
  brew install git
fi

sleep 2 

# Install Ruby
tput setaf $MAGENTA; echo ">> Checking for Ruby..."
if ruby -v | grep -q "ruby" ; then
  tput setaf $GREEN; echo "Ruby is already installed!"
else
  tput setaf $CYAN; echo "Installing Ruby..."
  brew install ruby
fi

# Install Ruby Gem Sass
tput setaf $MAGENTA; echo ">> Checking for Ruby gem: sass..."
if sass -v | grep -q "Ruby Sass"  &2>/dev/null ; then
  tput setaf $GREEN; echo "Sass is already installed!"
else
  tput setaf $CYAN; echo "Installing Ruby gem: sass..."
  sudo gem install sass
fi

sleep 2 

# Install Ruby Gem Compass
tput setaf $MAGENTA; echo ">> Checking for Ruby gem: compass..."
if compass -v | grep -q "Compass"  &2>/dev/null ; then
  tput setaf $GREEN; echo "Compass is already installed!"
else
  tput setaf $CYAN; echo "Installing Ruby gem: compass..."
  sudo gem install compass
fi

sleep 2 

# Switch to Node 8.12.0
tput setaf $CYAN; echo "Switching to Node v8.12.0..."
nvm use 8.12.0

sleep 2 

# Installing yo, bower, and grunt
tput setaf $CYAN; echo "Installing global NPM packages: yo, bower, and grunt..."
sudo npm install -g yo bower grunt-cli >>/dev/null

sleep 2 

# Clone Github Repository
tput setaf $CYAN; echo "Cloning Openmappr repository from Github..."
if [ -d "./openmappr" ] ; then
  tput setaf $GREEN; echo "Repository is already cloned!"
  cd openmappr
else
  git clone https://github.com/selfhostedworks/openmappr.git
  cd openmappr
fi

sleep 2 

tput setaf $CYAN; echo "Running npm and bower install steps..."
npm install  >>/dev/null
bower install  >>/dev/null

# Build the application
tput setaf $CYAN; echo "Building the application with grunt..."
tput setaf $YELLOW; 
grunt  >>/dev/null

sleep 2 

# Start the docker-compose stack
tput setaf $MAGENTA; echo ">> Checking for an existing docker compose stack..."
if docker ps -a | grep -q "openmappr_" &2>/dev/null ; then
  tput setaf $GREEN; echo "The docker compose stack is already running. Let's remove it and start over..."
  docker-compose down &1>/dev/null
  docker-compose -f docker-compose.local.yml up -d
else
  tput setaf $CYAN; echo "Starting local development stack via Docker Compose..."
  docker-compose -f docker-compose.local.yml up -d
fi

sleep 2 

# Start the server
tput setaf $CYAN; echo "Running server at http://localhost:8080 ..."
${SHELL} ./run_local_mode.sh

# Set default color back to white
tput setaf $WHITE;