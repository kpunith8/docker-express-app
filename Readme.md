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

Clone the repo and install all the dependenices using `npm install`

### Start the docker containers using docker-compose

- Use the option `-V` only if you install new dependencies apart from the one that is already part of the `package.json`. `docker-compose.dev.yml` is used only in `development` mode.

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