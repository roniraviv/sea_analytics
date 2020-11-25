# Sea-Analytics.v2
An innovative and powerful tool for Sea Analytics (MVP)  
URL:  https://sea-analytics-v2.herokuapp.com

# Prerequisites   
## OSX   
Install XCode Command-Line Tools:   
% xcode-select --install   
<br>
Install Brew:   
% /bin/bash -c "\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"   
<br>
Install Git:   
% brew install git   
<br>
## Linux
Update and Refresh Repository Lists + essential packages:   
% sudo apt update -y   
% sudo apt upgrade -y   
% sudo apt install -y software-properties-common build-essential libssl-dev libffi-dev python3-dev snapd   
<br>
Install Git:   
% sudo apt-get install -y git   
<br>
## Project Clone   
% git clone --recurse-submodules https://github.com/roniraviv/Sea_Analytics.v2   
% cd Sea_Analytics.v2   
<br>
## Import .env file   
% cp <path/to/.env> ./   
<br>
# Installation    
## Quick Start without Docker   
% source setup.sh    
<br>
**Note**: Some machines might encounter a *Psycopg2* error reported at the end, but it's typically OK to discard this error
<br>
## Quick Start with Docker   
### Install Docker    
#### OSX/Windows
Download [Docker Desktop](https://www.docker.com/products/docker-desktop)    
#### Linux 
% sudo snap install docker    
% sudo curl -L "https://github.com/docker/compose/releases/download/1.27.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose    
% sudo chmod +x /usr/local/bin/docker-compose    
<br>
### Docker login   
% sudo docker login --username \<username\>   
<br>
### Import without DockerHub   
% gunzip sea_analytics_pkg.tar.gz   
% sudo docker load -i sea_analytics_pkg.tar     
<br>
### Import with DockerHub   
% sudo docker pull --all-tags roniraviv/sea_analytics   
<br>
### Run the images   
% sudo docker-compose run web_init   
% sudo docker-compose run -d --service-ports web_run   
