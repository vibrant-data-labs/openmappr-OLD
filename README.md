# Repo is being cleaned

See readmev1 folder


# Ubuntu Linux (Dev) 

## Installing on a local machine
1. Install cURL with `sudo apt install curl -y`
2. This script needs to be run as a root with root privileges `curl -sSL https://raw.githubusercontent.com/yalefox/test-repo/master/ubuntu.sh | sudo bash`
3. After it installs, go to https://localhost:8080 to view

# Ubuntu Linux Run
1. Navigate to the `/openmappr/` directory
2. Switch to a root shell with `sudo su`
3. Run `docker-compose -f docker-compose-local.yml up -d`

# running `docker-compose up` does work

apt install nodejs -y
apt install npm
npm install -g n
n 8.12.0

```
docker system prune 									# Clean up before running
docker-compose -f docker-compose-local.yml up -d 		# Run docker services
./run_local_mode.sh 									# Run ExpressJS app
#
# In a NEW window build and run client app
#
grunt
grunt watch
#
#
Go to http://localhost:8080/
```

### 
- Prune
- shut everyhting down
- 