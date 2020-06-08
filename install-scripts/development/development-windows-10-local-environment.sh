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
git clone https://github.com/selfhostedworks/openmappr
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




#############################

curl -sSL URL_HERE | bash 


curl.exe -sSL https://raw.githubusercontent.com/selfhostedworks/openmappr/master/_install-scripts-local/development-windows-10-local-environment.sh | bash



Download the [Ubuntu Subsystem for Windows](https://www.microsoft.com/en-us/p/ubuntu/9nblggh4msv6?activetab=pivot:overviewtab)



# Step 1 is to enable
> You'll have to install and enable **linux subsystem** and **bash** for windows. 
> Go here [HackerNoon | How To Install Bash On Windows 10](https://hackernoon.com/how-to-install-bash-on-windows-10-lqb73yj3)

1. Click on **Start** ➜ **Settings** ➜ **Update & Security** ➜ **For Developers**
	- Turn on **Developer Mode**
2. Go to **Control Panel** ➜ **Programs** ➜ **Turn Windows Features On & Off** 
	- Enable **Linux Subsystem for Windows** and then restart

3. Go here: [Microsoft | Install WSL Ubuntu 18.04](https://aka.ms/wsl-ubuntu-1804) to Install.

## Install
Run `apt update -y && apt upgrade -y &&  `


# Download
Click [here](https://aka.ms/wsl-ubuntu-1804)

# Install subsystem with
curl.exe -L -o ubuntu-1604.appx https://aka.ms/wsl-ubuntu-1804 

# Then run
curl sSl https://raw.githubusercontent.com/selfhostedworks/openmappr/master/_install-scripts-local/development-ubuntu-local-environment.sh | bash

# or 
curl -sSl https://rebrand.ly/ubuntu18 | bash

curl -sSl https://rebrand.ly/ubuntu20 | bash



## Part 2:

1. Run `cmd` as **administrator**


@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "[System.Net.ServicePointManager]::SecurityProtocol = 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"


