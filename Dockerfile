### STAGE 1: Build ###

# We label our stage as 'builder'
FROM node:8-alpine 

WORKDIR /app

ADD . /app

#RUN npm install

# Define environment variable se definien al correr el comando docker run

 



CMD ["node", "dist/server"]
