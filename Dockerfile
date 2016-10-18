# This container runs Talon and all its subsystems
# It exposes port 3000 for talonPanel currently and
# relies on the presence of a .env file, currently
# grabbed over http from the KIWI website in a very
# insecure manner :<

# Pull from Ubuntu Precise LTS
FROM ubuntu:14.04.5

# Run updates
RUN apt-get update
RUN apt-get -y upgrade

# Install curl
RUN apt-get install -y curl

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Download nodesource install script and install Node
RUN curl -sL https://deb.nodesource.com/setup_6.x -o nodesource_setup.sh
RUN chmod +x nodesource_setup.sh
RUN ./nodesource_setup.sh
RUN apt-get install -y nodejs

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY server.js /usr/src/app/
COPY ./demo /usr/src/app/
COPY ./modules /usr/src/app/
COPY ./logs /usr/src/app/
COPY ./conf /usr/src/app/

# Open talonPanel port
EXPOSE 3000

# Run Talon
CMD [ "npm", "start" ]
