# talon

[![Build Status](https://travis-ci.com/dechristopher/talon.svg?token=Y3xVpkK5ssNWUcAWrYpW&branch=master)](https://travis-ci.com/dechristopher/talon)

Talon consists of the backend node microservices that make up the talon system for the KIWI PUG network.

server.js - The RPC communication app that talks to the clients, processes heartbeats, manages the queues, and
facilitates messaging and friends. 

mon.js    - A lightweight node app that can be used from anywhere to monitor basic backend throughput in messages per second and minute.

demo.js   - Checks the CS:GO server directories for demo files and uploads them to the CDN if they stop growing in file size.

user.js   - A generator function to create user objects.

test.js   - Unit tests for various things that need unit tests.
