#!/bin/bash
# Created by Shahar Gino at November 2020
# All rights reserved

# Usage:  curl -fsSL "https://raw.githubusercontent.com/roniraviv/sea_analytics/master/install.sh" | bash -s [app_name] [reset_db]

app_name=${1:-'Sea_Analytics.v2'}
reset_db=${2:-false}

if [[ "$OSTYPE" == "darwin"* ]]; then
    
    echo "Installing XCode Command-Line Tools"
    xcode-select --install
    
    echo "Installing Brew"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
    
    echo "Installing Git"
    brew install git

else
    echo "Update and Refresh Repository Lists + essential packages"
    sudo apt update -y
    sudo apt upgrade -y
    sudo apt install -y software-properties-common
    sudo apt install -y build-essential libssl-dev libffi-dev python3-dev

    echo "Installing Git"
    sudo apt-get install -y git
fi

echo "Cloning Project"
git clone --recurse-submodules https://github.com/roniraviv/sea_analytics.git ${app_name}
cd ${app_name}

echo "Importing .env file"
if [ ! -f ".env" ]; then
    if [ -f "/Users/$(whoami)/Downloads/.env" ]; then
        cp ~/Downloads/.env ./
        echo "cp ~/Downloads/.env ./"
    elif [ -f "/Users/$(whoami)/Desktop/.env" ]; then
        cp ~/Desktop/.env ./
        echo "cp ~/Desktop/.env ./"
    fi
fi

utils/code_hide.sh --decrypt --key=${app_name}
utils/code_hide.sh --encrypt --key=${app_name}

