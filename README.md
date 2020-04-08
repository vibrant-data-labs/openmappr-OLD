# Readme v2 (WIP)

![Docker build and push](https://github.com/selfhostedofficial/openmappr/workflows/Docker%20build%20and%20push/badge.svg?branch=master)


# Readme V1 
> Will be removed soon.

The documentation is being cleaned up, but for now you can find [readme version 1.0 here](https://github.com/selfhostedofficial/openmappr/tree/master/readme_v1)

### Local Environment

To set up a local environment, run the following script:

### macOS
Run this

### Linux (Debian)
Run this

### Linux (Fedora)
Run this


### Production Setup
> Not working 

**STEPS**

1. SSH into the Digital Ocean Droplet.
2. Run attended updates with `sudo apt get update; sudo apt-get dist-upgrade`
3. Install dependencies with `
4. Run `git clone https://github.com/selfhostedofficial/openmappr`
5. Enter `cd openmappr`
6. Run `sudo chmod +x rebuilt-prod-web.sh`
7. Run `nohup ./rebuild-prod-web.sh > output.log 2>&1 &`
8. Run `tail -f output.log`


# Integration Rules WIP

There are 3* (1 now) Github actions.

1. 


1. Docker Build
2. Push to Github Registry
3. Deploy to Server 
