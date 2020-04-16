# Openmappr

### Install Openmappr on a Remote Server.

# Get updates and upgrades
sudo apt update -y
sudo apt upgrade -y

# Install digital ocean metrics
curl -sSL https://repos.insights.digitalocean.com/install.sh | sudo bash

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm -rf get-docker.sh

# Install Docker-Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.23.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Start service
sudo systemctl start docker

# Enable on boot
sudo systemctl enable docker

# login to docker
docker login --username openmapprimages

## password
insert a dockerhub security token

# Install and run watchtower
docker run -d --restart=always --name watchtower -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower

# Reboot
sudo reboot

# Clone openmappr repo
git clone https://github.com/selfhostedofficial/openmappr && cd openmappr

# Start Docker on Staging
docker-compose -f docker-compose.do_staging.yml up

# Start Docker on Production
docker-compose -f docker-compose.do_production.yml up
