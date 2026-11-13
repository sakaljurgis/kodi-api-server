FROM node:18

RUN apt-get update
RUN apt-get install ffmpeg -y

WORKDIR /srv/app

# dependencies first: this layer is reused while package*.json don't change
COPY package.json package-lock.json /srv/app/
RUN npm ci

COPY ./ /srv/app
# build here, not when the container starts: CapRover builds the image while the old
# container keeps serving (and a failed build leaves it running)
RUN npm run build

EXPOSE $PORT

# start: migrations + app (start.sh)
CMD ["npm", "run", "start"]

