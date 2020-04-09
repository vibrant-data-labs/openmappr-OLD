#!/bin/bash

echo installing homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"

echo installing docker
brew install docker 

echo cloning openmappr repo
git clone https://github.com/selfhostedofficial/openmappr
cd openmappr

echo Running docker Compose scripts

docker-compose -f docker-compose-local.yml up -d
docker-compose -f docker-compose-local.yml ps

echo Installing NodeJS (8.12)

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
nvm install 8.12.0
node --version

echo installing gems
echo compass:
gem install compass

clear

echo installing dependencies

sudo npm install -g yo bower grunt-cli
npm install
bower install

clear

echo building app

grunt

echo running server at PORT: http://localhost:8080
./run_local_mode.sh