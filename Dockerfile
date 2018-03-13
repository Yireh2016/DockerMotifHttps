### STAGE 1: Build ###

# We label our stage as 'builder'
FROM node:8-alpine 

WORKDIR /app

ADD . /app

#RUN npm install

# Define environment variable
 ENV USER_MAIL=bizarrada@gmail.com 
 ENV SECRET_MAIL=jovocncqkufxtkoq



CMD ["node", "dist/server"]
