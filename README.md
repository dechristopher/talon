[![Build Status](https://travis-ci.com/dechristopher/talon.svg?token=Y3xVpkK5ssNWUcAWrYpW&branch=master)](https://travis-ci.com/dechristopher/talon)

# talon
This repository contains the talon backend (server.js) and a few supporting services (modules/ & demo/) outlined below to facilitate the smooth operation of the KIWI PUG Platform. Unit testing coming soon to a theater near you!

####Production####
Run: `git clone (thisrepo) talon && cd talon && npm install && npm start`

####Development####
Run: `git clone (thisrepo) talon && cd talon && npm install && npm run dev`

####Demo CDN manager (server)####
Run: `git clone (thisrepo) talon && cd talon && npm install && npm run demo-server`

####Demo Client (client)####
Run: `git clone (thisrepo) talon && cd talon && npm install && npm run demo-client-(region)`

---

####server.js####
TALON, the backend of the KIWI PUG Platform, manages client-server communication, processes heartbeats, manages the queues, and
facilitates messaging, friends, and lobbies.

---

####demo/demo-client.js####
Checks the CS:GO game server directories for demo files and uploads them to the demo CDN if they stop growing in file size.  

####demo/demo-server.js####
Runs on the demo CDN and accepts all file transfers from the demo-client.js instances on the game servers.

---

####modules/mon.js####
A lightweight node app that can be used from anywhere to monitor basic backend throughput in messages per second and minute.

####modules/user.js####
A generator function to create user objects and such.

---

####test/test.js####
Unit tests for various things that need unit tests.
