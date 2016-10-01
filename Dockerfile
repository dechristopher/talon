FROM ubuntu:16.10

# Run updates
RUN apt-get update
RUN apt-get -y upgrade

# Install curl
RUN apt-get install -y curl

# Install build-essentialls and libssl-dev
RUN apt-get install build-essential libssl-dev

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Download nvm script and install Node
RUN curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh -o install_nvm.sh
RUN chmod +x install_nvm.sh
RUN ./install_nvm.sh
RUN source ~/.profile
RUN nvm install 6.0.0
RUN nvm use 6.0.0

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY server.js /usr/src/app
COPY ./demo /usr/src/app
COPY ./modules /usr/src/app
COPY ./logs /usr/src/app
COPY ./conf /usr/src/app

# Export DATADOG API key
RUN export DATADOG_API_KEY=983d600012039fbbde12c74b8383e7ff

EXPOSE 3000
CMD [ "npm", "start" ]
