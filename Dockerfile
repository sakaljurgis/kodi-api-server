FROM node:18

RUN apt-get update
RUN apt-get install ffmpeg -y

WORKDIR /srv/app
COPY ./ /srv/app
RUN npm install
RUN npm run typeorm:run-migrations

EXPOSE $PORT

# serve dev
CMD ["npm", "run", "start:dev"]

#serve prod
#CMD ["npm", "run", "start"]
