FROM node:18

RUN apt-get update
RUN apt-get install ffmpeg -y

WORKDIR /srv/app
COPY ./ /srv/app
RUN npm install

EXPOSE $PORT

# start
CMD ["npm", "run", "start"]

