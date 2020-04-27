# OpenMappr
> This repo is being cleaned, and currently under construction


# Quickstart (local)
> Here are a series of scripts for most operating systems to get up and running as fast as possible.


## Default Login & Password
All of the usernames are `user@mappr.io` and the passwords are `woot`

- If you experience login problems, try opening in an incognito window. There is a known issue around cookies.

## Ubuntu 18.04 LTS
1. You'll need to install curl first by running sudo apt install curl
2. Enter `sudo su` to switch to a root account.
3. Run this script to get started right away. 

```
curl sSl https://raw.githubusercontent.com/selfhostedofficial/openmappr/master/_install-scripts-local/development-ubuntu-local-environment.sh | bash
```
4. After it loads, go to: http://localhost:8080/ and you will see the following:

### Restart Server

Make sure Docker is running with sudo service docker start then run the following command from the root directory, whenever you need to restart it: 

```
docker-compose -f docker-compose-local.yml up -d
```

## Ubuntu 19.10 !NOT SUPPORTED!

1. You'll need to install curl first by running sudo apt install curl
2. Enter sudo su to switch to a root account.
3. Run this script to get started right away. 

```
curl sSl https://raw.githubusercontent.com/selfhostedofficial/openmappr/master/_install-scripts-local/development-ubuntu-local-environment.sh | bash
```
4. After it loads, go to: http://localhost:8080/

## Windows !NOT COMPLETE!
1. Run
2. Enter
3. Run 

```
curl sSl https://raw.githubusercontent.com/selfhostedofficial/openmappr/master/_install-scripts-local/development-win-local-environment.sh | bash
```