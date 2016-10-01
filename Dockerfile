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

# Export DATADOG API key
RUN export DATADOG_API_KEY=983d600012039fbbde12c74b8383e7ff

EXPOSE 3000
CMD [ "npm", "start" ]
