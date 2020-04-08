#!/bin/bash
#
# 		NOTE: not working
#
#
# Install Updates
sudo apt install update
sudo apt install dist-upgrade # fix unattended

# Install Digital Ocean Metrics
sudo snap install doctl && sudo mkdir /root/.config

# Install dependencies
sudo apt install docker.io docker-compose -y

# Download OpenMappr latest
#
#
		# ? should we grab from package now instead?
#
#
#

# Download openMappr
git clone https://github.com/selfhostedofficial/openmappr
cd openmappr
sudo chmod +x rebuild-prod-web.sh

# Install and view output
nohup ./rebuild-prod-web.sh > output.log 2>&1 &
tail -f output.log
