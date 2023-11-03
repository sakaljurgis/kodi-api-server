#!/bin/bash

if [ "$NODE_ENV" == "production" ]; then
    echo "Starting app in production mode"
    echo "Running prebuild"
    npm run prebuild
    echo "Running build"
    npm run build
    echo "Running migrations"
    npm run typeorm:run-migrations
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
