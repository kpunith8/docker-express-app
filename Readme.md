## Express CRUD app using Docker

[Referred Youtube video](https://www.youtube.com/watch?v=9zUHg7xjIqQ)

### Docker images used

- `nodejs` for express app
- `mongo` for Database
- `redis` for session storage
- `nginx` for `load balancing` to multiple node containers

### Features

- Signup and signin routes with encrypted passwords using `bcryptjs`
- Session storage using `redis`
- Protected routes only if user logged in using `express-session`
- `nginx` for `load balancing` to multiple node containers

### Prerequisites

- NodeJS
- Docker

## Getting started

## Local development

Clone the repo and install all the dependenices using `npm install`

### Start the docker containers using docker-compose

- Use the option `-V` only if you install new dependencies apart from the one that is already part of the `package.json`. 
- `docker-compose.dev.yml` config is used only in `development` mode.

```
$ docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build -V
```

### Kill all the containers once you are done

```
$ docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

> NOTE: if you want to deploy the containers to prod environment, change the second file option to docker-compose to `docker-compose.prod.yml`

### Requesting API end points from VS Code editor

The source contains `requests.rest` file which can be used to request API only if you are working on `VS-Code`, make sure to install `REST Client` plugin before sending the request.

### Scale the node-apps using docker compose

> Note: Before scaling kill all the existing running containers

Scale `node-express-app` service to have 2 instances using,
```
$ docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --scale node-express-app=2
```

## Production deployment

- Make sure to push your code including `Dockerfile` and `docker-compose.yml` files to `git/gitlab` or any version control system that you use. Don't push envirionment variables stored in `docker-compose.prod.yml` file, they can be directly stored in the ubuntu container where the prod app runs.
- Select any cloud provider of your choice and run an ubuntu instance
- Install `docker` and `docker-compose` on the running instance by logging in using `ssh` from your local machine
### Setting/stroing environment variables in the running container

- Exporting the environment variables
```
$ EXPORT MONGO_USER=root
```

> We may loose the environemnt variables set using this approach each time ubuntu instance restarts.

- Store all the environmanet variables in a `.env` file in the ununtu instance and load them each time
it restarts

Create a file `.env` in the root and store all the environemnt variables
```
MONGO_USER=root
MONGO_PASSWORD=root
```

- Open the `.profile` file and edit it to load the `.env` file each time instance restarts
```
set -o allexport; source /root/.env; set +o allexport
```

> There are better ways to store the creds. Consider the best option, so that we don't compromise prod creds.

- Create a folder called to `/app` to store the code in the `prod server`

- Clone the source code into `/app` folder, install `git` on ubuntu server if it wasn't installed before.

- Run the `docker-compose up` on in the server and verify that it works.

- Request an API endpoint using the `public IP address` of the ubuntu server.

### Make the changes and push the changes to prod

- Once the changes are made, login to server and pull the latest changes to the `/app` folder
and rebuild only `node-app` container using `docker-compose`.

- Pass `--no-deps` option to make sure any dependent services for `node-express-app` are not rebuilt,
in this case our `node-express-app` depends on `mongo` service, it is avoid docker-compose to rebuild the `mongo` image.

- Start only the `node-express-app` container because only the source code of th app has been changed.
```
$ docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --no-deps node-express-app
```

## Build and publish image to dockerhub and deploy to prod server instead of git pull

- Instead of building docker images and starting services on prod server everytime the code changes, we can build the docker images and publish it to our private repo and pull those images and start the service quickly in the prod server.

- Specify the image name pushed to the dockerhub in  `docker-compose.yml` adding an `image` key under `node-express-app`

- Make the changes to the source and rebuild the image using docker-compose as,
```
$ docker-compose -f docker-compose.yml -f docker-compose.prod.yml build node-express-app
```

- Push the newly built image to the docker hub using docker-compose, push only the `node-express-app`
```
$ docker-compose -f docker-compose.yml -f docker-compose.prod.yml push node-express-app
```
> You can also push the image using `docker push` command too

- Go to the prod server and pull the latest image build using docker-compose
```
$ docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull 
```

- Start the services
```
$ docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps node-express-app
```

## Automating with watchtower

- Use `containrrr/watchtower` image to poll the dockerhub and pull the image if any changes are detected and re-run the services

- Run the `containrrr/watchtower` container in the prod server,
```
$ docker run -d --name watchtower -e WATCHTOWER_TRACE=true -e WATCHTOWER_DEBUG=true -e WATCHTOWER_POLL_INTERVAL=60 -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower app_express-node-app_1
```
> app_express-node-app_1 is the name of the image that we want to watch

> If you are using your private dockerhub to host your images and want to pull the updated image, make sure to login to the docker in the prod server using `docker login`; otherwise `watchtower` will fail to pull to the updated image.

> You can delete the watchtower if you/your team doesn't like to push the changes immediately to prod.

## Container Orchestration using docker swarm

- To push changes without impacting prod being down.

- Setup docker swarm in the prod server and is shipped with docker and is disabled by default verify that by checking
```
$ docker info
```

- Enable the docker swarm
```
$ docker swarm init
```

- If it throws an error with multiple IP addressing being used in the prod server, update the swarm with `--advertise-addr` option
```
$ docker swarm init --advertise-addr 124.1.2.3
```

- Use `docker service --help` command to access docker swarm related commands

- Add `deploy` and other options to `docker-compose.prod.yml` file to have swarm related commands, [doc](https://docs.docker.com/compose/compose-file/compose-file-v3/#deploy)

- Add this under `node-express-app` for `docker-compose.prod.yml`
```yml
version: "3"
  services:
    node-express-app:
      deploy:
        replicas: 8
        restart_policy:
          condition: any
        update_config:
          parallelism: 2 # Updates 2 containers at a time
          delay: 15s
```

- Pull the changes to prod server and kill all the running containers and start the services using `docker stack`
```
$ docker stack deploy -c docker-compose.yml docker-compose.prod.yml my-node-app
```

### Docker swarm related commands

- List all the running nodes
```
$ docker node ls
```

- List all the running stacks
```
$ docker stack ls
```

- List all the services running in a container
```
$ docker stack services
$ docker service ls
```

- Verify that 8 replicas created running
```
$ docker ps
```

### Push the changes and roll the updates without impacting the service

- Make the changes in the source code

- Build the brand new `node-express-app` image and push it to the dockerhub or pull the code changes in prod server.

- Build the stack again
```
$ docker stack deploy -c docker-compose.yml docker-compose.prod.yml my-node-app
```

- Verify that how docker-swarm in rolling the updates only to 2 containers at a time, this is because of the `parallelism` key we set on `depoly`s `update_config`
```
$ docker stack ps my-node-app
```