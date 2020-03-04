# openMappr - a network analysis and visualization platform

*openMappr* allows you to visualize and interactively explore relationship data as a network. You save multiple layouts and views as 'snapshots' and publish/share them with others as a 'player' (an interactive, read-only version of map).   

There are 2 modes for using it:

*1. Visualize Existing Network -*
In this case, you need an excel file with 2 sheets. One labeled 'nodes' and the other labeled 'links'.  

The nodes sheet requires at minimum one columns called `id` (or `ID`) where every row is a unique node id. You can also include any number of additional columns as node attributes which can be used for coloring nodes, sizing nodes, selecting/filtering nodes, or laying out nodes in x-y space (e.g., as a scatterplot with links between the points). Node attributes can also include urls to images (which can be rendered as images within the node), video and audio links (which can be played within the visualization), the websites (hyperlinks), and twitter feeds (which can be rendered within the visualization for each node).  

The links sheet requres at minumum two columns called `source` (or `Source`,`from`, `From`) and `target` (or `Target`, `target`, `to`). You can also include additional columns of link attributes for coloring links, or setting link thickness. 

*2. Generating a Similarity Network from Node Tag Attributes -* 
In this case you just need a 'nodes' file (.csv or .xlsx).

The nodes sheet requres at minumum two columns: one called `id` (or `ID`) where every row is a unique node id, and one column with a pipe-separated string of tags (e.g., 'tag1|tag2|tag3', or 'tag1 | tag2 | tag3').  Then openMappr can generate affinity links between nodes that have similar tag profiles.  The basic code for generating a similarity (or affinity) network from items with tags is available here https://github.com/foodwebster/Tag2Network            


*A more complete user guide will be uploaded soon :) *
Mappr was originally created by Vibrant Data Inc., which was acquired by Rakuten Inc. in 2016. 
openMappr was open-sourced in 2017. 

## Setup

There are two ways to setup the application:

- Using Docker - Recommended if you want to quickly get the application up and running and don't need to make frequent changes
- Local Setup - Recommended if you are actively developing and testing the application. Going forward, we will try to make the docker setup more suitable for active development

We will cover both the approaches one by one

## Docker Setup

You can use Docker to install openMappr locally on your machine, or on a remote machine (e.g., AWS EC2). Note that if you install it locally on your laptop, you will have all the main functionality *except* you wil not be able to publish and share the interactive visualization with others. 

- Install `docker` and `docker-compose`. Go to the official website and follow the instructions for your OS
- Build the services by running the following command in the terminal from the project's root directory

```
$ docker-compose build --no-cache
```

- Run all services by executing the following command in the terminal from the project's root directory

```
docker-compose up -d
```

`docker-compose up` brings up all the services defined in the `docker-compose.yml` file in the project's root directory. The `-d` flag at the end will execute everything in the background. You can see the running containers by running the following command:

```
docker-compose ps
```

The output should look like this:

```
          Name                         Command               State                       Ports
-------------------------------------------------------------------------------------------------------------------
openmappr_athena_1          ./run_docker_mode.sh             Up
openmappr_beanstalk_1       /sbin/tini -- beanstalkd - ...   Up      0.0.0.0:11300->11300/tcp
openmappr_elasticsearch_1   /docker-entrypoint.sh elas ...   Up      0.0.0.0:9200->9200/tcp, 0.0.0.0:9300->9300/tcp
openmappr_mongo_1           docker-entrypoint.sh /bin/ ...   Up      0.0.0.0:27017->27017/tcp
openmappr_web_1             ./run_docker_mode.sh             Up      0.0.0.0:8080->8080/tcp
```

If the state is __Up__ for all the services, it means your setup is running fine. 
You should be able to access the web-server. 
Launch openMappr by opening a web browser and navigating to `http://localhost:8080` 
then enter `user@mappr.io`  `woot`

If you are running it locally, if you close the Terminal window, it will shut down openMappr.
To run again in the future, just a) make sure Docker is running, b) open the Terminal, type `docker-compose up`, and c) open a web browswer and type `http://localhost:8080` 

## Useful Docker Compose Commands

These commands are only available from the project's root directory containing the `docker-compose.yml` file. You might find these helpful in your development and setup.

### View docker-compose logs for all the services/containers together

```
docker-compose logs -f
```

### View docker-compose logs for any particular service/container

```
docker-compose logs -f {service_name}
```

`{service_name}` here can be either of `athena`, `beanstalk`, `elasticsearch`, `mongo` or `web`. Basically these are the services as defined in your `docker-compose.yml` file.


### Pausing/Unpausing service(s)

You can pause a service by running the command

```
docker-compose pause {service_name}
```

When you pause a service, the state of that service will change to `PAUSED` in the `docker-compose ps` output. If you do not provide any `{service_name}` in the above command and only execute:

```
docker-compose pause
```

It will pause all the services. When you pause the services with compose, you can safely resume them from the state they were in when you left them. You may use this command before leaving your work at the end of the day, or shutting down your computer. When you run `docker-compose up -d`, everything will be the way you left it.

You can __unpause__ service(s) by using the `docker-compose unpause {service_name}` command. Similar to the __pause__ command, omitting the `{service_name}` will unpause all the paused services


### Rebuilding and Restarting a service

When you make changes to any of the services and want to see those changes getting reflected in your setup, you will need to rebuild that service. First, you will need to stop and remove the service using the `docker-compose stop` and `docker-compose rm` command:


```
docker-compose stop {service_name}
docker-compose rm {service_name}
```

Then, you need to rebuild the service. You can do so by running the following command:

```
docker-compose build --no-cache {service_name}
```

Then run the following command again to bring up the service:

```
docker-compose up -d
```

### Logging into the container running a service

Sometimes you might want to be able to login to a container running a particular service. For example, you might want to login to the container running the web app. You can do so by running the following command:

```
docker-compose exec web bash
```

This is a specific case of a more generic command. Basically `docker-compose exec` allows you to run a command on a container. So the general syntax is

```
docker-compose exec {service_name} {command}
```

For example, if you want to access the __mongo__ shell on the container running __mongodb__, you can do:

```
docker-compose exec mongo mongo
```

### Shutting down all the services

You can shutdown all the services and their respective container by running the following command:

```
docker-compose down
```



## Local Setup

Alternatively, if you are not using docker, you can setup the entire project locally by following the instructions below.

To run it locally, we need 6 things:

- Mongo running locally on port 27017. It is the default mongo port.
- Beanstalkd - http://kr.github.io/beanstalkd/
- python 2.x for running athena. Refer to the athena [Readme.md](athena/README.md) for details.
- Node 6 or greater for running the server. Refer to Node Env setup guide section.
- Sass. Refer to Sass install section.
- Elasticsearch 2.4. Optional component needed for search.

There are 2 scripts for running dev version of webapp:

- `run_local_mode.sh` - the most common. run the server in local mode
- `run_test_mode.sh` - runs the server in testing mode. mostly for testing apis and other things.

### Steps

These are the steps needed to get the full system running locally.
* Have mongodb running at 27017 using ` mongod --config /usr/local/etc/mongod.conf & ` (if installed via brew)
* Have beanstalkd running. `beanstalkd &` (if installed via brew)
* Run elasticsearch. `elasticsearch &` (if installed via brew)
* Run athena via `./run_dev_mode.sh`. Ensure virtual environment was created as directed by [Readme.md](athena/README.md)
* Build webapp
    * Ensure all packages are installed by doing the steps listed in the _Setting up the node environment_ section.
    * `grunt` to build webapp. Then do `grunt watch` to watch for source code changes
* `./run_local_mode.sh` - for running the webapp
* Point your browser to `localhost:8080` and login as `user@mappr.io` with password `woot`.


## Sever-side Code Organization

Code is divided into top level modules, each with routes, controllers, models and services (if needed)

### Top Level Modules

* auth            - User authentication, includes passport config.
* common          - common elements like auth middlewares, permission middleware.
* commonOps       - commonOps module. has its own Readme.md file.
* config          - all common / dev / prod / testing config is made available as a module.
* data_api        - module for data api. makes networks available through the API
* datasys         - central data wrangling module. upload data, CRUD on dataset and networks.
* etl             - ETL pipeline. houses the ETL engine which runs scripts on spark cluster
* libs            - external libs outside of npm, mostly copy pasted code
* migrators       - migration code. Used when schema is changed, or need to run system wide validations
* misc_controllers- small controllers which interface with a service. like job / elasticsearch / svg / maintenance controllers
* models          - (depreciated -> contains schema for the old db. Used by survey and hence not removed)
* orgs            - module for organization management.
* player          - module for player managment. also contains a top_router for player specific routes
* project         - Project module. cloning, deleting and so on.
* recipe          - Recipe Engine module. each individual stage has its own file.
* schemas         - all schemas are here. This is because I feel they might be shared across multiple projects
* scriptStore     - contains script runner to run generic scripts on data. depreciated
* services        - common services needed by all modules
* snapshot        - Snapshot module.
* survey          - Survey module
* user            - User management module
* utils           - common utility functions. Also contains parsing code.

### Top Level files
- main_server.js - the server initialization code.
- main_router.js - Each modules furnishes its own router. Which is combined together in the this file.
- admin_router.js - similar to main_routers, for adminstrator account.
- misc_routes.js - bunch of routes, connecting misc_controllers
- routes.js - all routes which have not been ported over.
- ../server.js - entry point. Ensures node 5 is running.


## Setting up Node environment

The best way to setup Node is to use a node version manager. One way to do it is to use nvm.

* install nvm from https://github.com/creationix/nvm. follow the guide. Do not use brew to install it.

Also, when editing `~/.bashrc`, `~/.profile`, `~/.zprofile`, or `~/.zshrc`, use below:

```
export NVM_DIR="$HOME/.nvm"
export NVM_SYMLINK_CURRENT="true" # for editors to work properly
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm
```

Also, if using zsh, update `~/.zshenv` or `~/.zprofile` instead of `~/.zshrc`:

* install node
```
nvm install 6.0
nvm use 6.0
nvm alias default node
```

* install basic packages
```
npm install -g yo bower grunt-cli
```

* install packages
```
npm install
bower install
```
* Run `grunt` to build the webapp. If developing, use `grunt watch` after that to watch for changes.

* Run `./run_local_mode.sh` to run the webapp.

## Sass

Sass and Compass need to be installed in order for sass to compile to css.

* Make sure ruby is installed first (by default on macs)
* install __sass__

```
gem install sass
```

[Sass install](http://sass-lang.com/install)

* install __compass__

```
gem install compass
```

[Compass install](http://compass-style.org/install/)

## Building OpenMappr on production server

1. SSH to the server `ssh -A -i privateKey.pem ec2-user@18.210.173.224`
2. To use your local Github account to run `git pull` on the repo on the server, make sure you've `ssh-agent` running on your local. I think Unix handles that by default, but not Windows (it's still not that cool).
3. Go into the `openmappr` directory
4. Run `nohup ./rebuild-prod-web.sh > output.log 2>&1 &`
5. To check status of the build process, run `tail -f output.log`. It usually takes around 10-15 mins, it sped up when I increased the server disk space from 100GB to 200GB.