FROM node:argon

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY server.js /usr/src/app
COPY ./demo /usr/src/app
COPY ./modules /usr/src/app
COPY ./logs /usr/src/app
COPY ./conf /usr/src/app

EXPOSE 3000
CMD [ "npm", "start" ]
