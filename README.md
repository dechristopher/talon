# talon

[![Build Status](https://travis-ci.com/dechristopher/talon.svg?token=Y3xVpkK5ssNWUcAWrYpW&branch=master)](https://travis-ci.com/dechristopher/talon)

The backend node microservices that make up the talon system for the KIWI PUG network.

mon.js    - Monitors the messages per second sent into the backend with a cool bar graph.

server.js - The RPC communication app that talks to the clients, processes heartbeats, manages the queues, and
facilitates messaging and friends. 

demo.js   - Checks the CS:GO server directories for demo files and uploads them to the CDN if they stop growing in file size.

stats.js  - A module that interfaces with the backend to check for and parse match stats after matches finish. (DEPRECATED)

Player.js - An abstract class for managing player objects throughout the applications. (DEPRECATED)

test.js   - Unit tests for various things that need unit tests.
