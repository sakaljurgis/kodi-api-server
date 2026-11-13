#!/bin/bash

if [ "$NODE_ENV" == "production" ]; then
    echo "Starting app in production mode"
    # the Dockerfile builds the app; docker-compose mounts the source over it and sets this
    if [ "$BUILD_ON_START" == "1" ]; then
      echo "Running build"
      npm run build
    fi
    echo "Running migrations"
    # compiled dist, no ts-node (it type-checked the config and every entity again)
    npm run typeorm:run-migrations:prod
    echo "Starting app"
    npm run start:prod
else
  echo "Starting app in development mode"
  echo "Running prebuild"
  npm run prebuild
  echo "Running migrations"
  npm run typeorm:run-migrations
  echo "Starting app"
  npm run start:dev
fi
