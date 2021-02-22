#!/bin/bash
# Created by Danit Gino at November 2020
# All rights reserved

# Usage:  curl -fsSL "https://raw.githubusercontent.com/sgino209/Sea_Analytics.v2/master/install.sh?token=<TOKEN>" | bash -s [app_name] [reset_db]

app_name=${1:-'Sea_Analytics.v2'}
reset_db=${2:-false}

if [[ "$OSTYPE" == "darwin"* ]]; then
    
    echo "Installing XCode Command-Line Tools"
    xcode-select --install
    
    echo "Installing Brew"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
    
    echo "Installing Git"
    brew install git

    echo "Install GPG"
    brew install gpg

else
    echo "Update and Refresh Repository Lists + essential packages"
    sudo apt update -y
    sudo apt upgrade -y
    sudo apt install -y software-properties-common
    sudo apt install -y build-essential libssl-dev libffi-dev python3-dev

    echo "Installing Git"
    sudo apt-get install -y git

    echo "Install GPG"
    sudo apt install gnupg
fi

