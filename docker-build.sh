# Builds Talon.JS container

# Remove old docker image
docker rmi -f kiwi/talon-js:min

# Build docker container
docker build -t kiwi/talon-js:min -f Dockerfile .

# List images
docker images

# Echo docker run instructions
echo "##########################################################################"
echo " docker run -d --name talon-js -h talon-js -p 3000:3000 kiwi/talon-js:min"
echo "##########################################################################"




