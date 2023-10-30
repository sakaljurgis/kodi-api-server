#!/bin/bash

if [ "$NODE_ENV" == "production" ]; then
    echo "Starting app in production mode"
    echo "Running prebuild"
    npm run prebuild
    echo "Running build"
    npm run build
    echo "Starting app"
    npm run start:prod
else
  echo "Starting app in development mode"
  npm run start:dev
fi
