# Repo is being cleaned

See readmev1 folder

# macOS
> issues testing with hypervisor

1. Run `curl -sSL https://raw.githubusercontent.com/selfhostedofficial/openmappr/master/_install-scripts-local/development-mac-local-environment.sh | bash`


# Ubuntu Linux (Dev) 

### Ubuntu 18 LTS first install
1. Install cURL with `sudo apt install curl -y`
2. This script needs to be run as a root with root privileges `curl -sSL https://raw.githubusercontent.com/selfhostedofficial/openmappr/master/_install-scripts-local/development-ubuntu-local-environment.sh | sudo bash`
3. After it installs, go to https://localhost:8080 to view


### Ubuntu Linux run
1. Navigate to the `/openmappr/` directory
2. Switch to a root shell with `sudo su`
3. Run `docker-compose -f docker-compose-local.yml up -d`
4. Run `./run_local_mode.sh`
5. In a new window run `grunt; grunt watch`
6. Go to http://localhost:80
