# talon
The backend node microservices that make up the talon system for the KIWI PUG network.

mon.js    - Monitors the messages per second sent into the backend with a cool bar graph.
server.js - The RPC communication app that talks to the clients, processes heartbeats, manages the queues, and
facilitates messaging and friends.

Player.js - An abstract class for managing player objects throughout the applications.

test.js   - A simple testing app that can send messages to the backend.
