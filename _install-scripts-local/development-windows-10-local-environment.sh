####################
#
#		       This script sets up a local environment on
#	                 		  Windows 10
#
#
# echo "IChocolatey Install"
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# Install Choco Packages

# Install Docker 
echo "Installing docker"
choco install docker -y
open /Applications/Docker.app

# choco install git-lfx
echo "Installing dependencies"
choco install git curl -y 

# Install ruby
choco install ruby -y

# Install Ruby Dev-Kit
choco install ruby.devkit


^^^ Above works

# Install the compass Gem
echo "installing compass gem"
gem install compass
gem install sass


# Install NodeJS 8.12 and switch to it
echo "Installing NodeJS v8.12.0 (openmappr dependency)"
nvm install 8.12.0

echo "Switching to NodeJS v8.12.0"
nvm use 8.12.0






# Clone openMappr repo
echo "Cloning openmappr repo"
git clone https://github.com/selfhostedofficial/openmappr
cd openmappr




# npm install -g sass

echo "Installing bower and grunt"
npm install -g yo bower grunt-cli
npm install
bower install

# Build the application
echo "Building application"
grunt

echo "running server at PORT: http://localhost:8080"
./run_local_mode.sh
