#!/bin/bash
#
#
#		       This script sets up a local environment on
#	                   Fedora Desktop 31
#
#                    You need to install cURL with
#                      `sudo dnf install curl -y
#
#               Script must be run with root privileges
#							`sudo su`
#
#
# Get updates
dnf upgrade -y
# Remove old versions of docker dependencies
dnf remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-selinux docker-engine-selinux docker-engine -y


# Install dependencies
# removed: build-essential
# https://developer.fedoraproject.org/tech/languages/ruby/ruby-installation.html

dnf install nodejs npm ruby-devel git-all python -y

dnf install ruby ruby-devel rubygems gcc -y 

# ruby
dnf install @development-tools -y

# Install gems
sudo dnf install rubygem-sass -y

sudo dnf install rubygem-compass -y

sudo dnf install ruby-devel

gem install sass compass
# Install docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh


# Install docker-compose
curl -L "https://github.com/docker/compose/releases/download/1.25.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
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
git clone https://github.com/selfhostedworks/openmappr
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
docker-compose -f docker-compose.local.yml up -d
sleep 10

# Start Application
echo
echo "Starting Application"
echo
sh run_local_mode.sh
