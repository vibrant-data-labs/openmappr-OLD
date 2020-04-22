#!/bin/bash
#
#                 The only thing you need to install here is cURL.
#                          `sudo apt install curl -y`
#
#
#
# Get updates
apt update -y
# apt dist-upgrade -y
# remove old versions of docker dependencies
apt remove docker docker-engine docker.io containerd runc -y
# Install dependencies
apt update -y
# Install docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
# Install docker-compose
curl -L "https://github.com/docker/compose/releases/download/1.25.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
# Clone openMappr repo
echo "Cloning openmappr repo"
git clone https://github.com/selfhostedofficial/openmappr
cd openmappr
​
# bring up all the docker services
echo
echo "Bring up all the docker services."
echo
docker-compose up -d