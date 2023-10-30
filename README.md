An API server for personal [KODI plugin](https://github.com/sakaljurgis/plugin.video.sklk).

## Description

A rewrite attempt from "vanilla" node.js into framework based (Nest.js).

## Running the app

```bash
$ cp .env.example .env

# edit .env file to match your environment
# make sure all folders exists

# start docker containers
$ docker-compose up -d
```
visit http://localhost:3000/if (or whatever port you have provided in .env file)
[KODI plugin](https://github.com/sakaljurgis/plugin.video.sklk) should be able to connect to this server with the following settings:
- api url: http://localhost:3000/api
- video url: http://localhost:3000

## Migrations (run inside docker container)

```bash
# enter docker container
docker exec -it kodi-api-server_server_1 bash

# create migration
$ npm run typeorm:create-migration -name=CreateFilesTable

# run migration
$ npm run typeorm:run-migrations
```

## Test

this app is not tested 😞

## License

No licence
