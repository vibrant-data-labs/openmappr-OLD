# OpenMappr
> Data Visualization

## Running Locallly
First, you need to install the following prerequisites.  The installation instructions may vary based on your operating system.
* Docker & Docker Compose
* Node.js 8.12.0 ([nvm](https://github.com/nvm-sh/nvm) is recommended)
* Ruby along with the `sass` and `compass` gems

Then you will want to download or clone the project, and open up a terminal inside the project folder.

After doing so, run the following commands to install all the dependencies:
```bash
# install global NPM modules necessary to build the app
npm install -g yo bower grunt-cli
# install local NPM modules
npm install
# install local Bower modules
bower install
```
To build the client and perform JS ops, run:
```bash
grunt
``` 
Next you will want to run the following command to bring up the local docker compose stack:
```bash
docker-compose -f docker-compose-local.yml up -d
```
After it finishes, you can start the server with:
```bash
./run_local_mode
```
And navigate to [localhost:8080](http://localhost:8080) with your web browser.