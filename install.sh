#!/bin/bash
# Created by Shahar Gino at November 2020
# All rights reserved

# Usage:  curl -fsSL "https://raw.githubusercontent.com/sgino209/Sea_Analytics.v2/master/install.sh?token=<TOKEN>" | bash -s [app_name] [reset_db]

app_name=${1:-'Sea_Analytics.v2'}
reset_db=${2:-false}

if [[ $(uname -p) == 'arm' ]]; then
    alias BREW='arch -arm64 brew'
else
    alias BREW='brew'
fi

if [[ $(uname -p) == 'arm' ]]; then
    BREW install miniforge
    conda init bash
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
    
    echo "Installing XCode Command-Line Tools"
    xcode-select --install
    
    echo "Installing Brew"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
    
    echo "Installing Git"
    BREW install git

    echo "Install GPG"
    BREW install gpg

else
    echo "Update and Refresh Repository Lists + essential packages"
    sudo apt-get update -y
    sudo apt-get upgrade --with-new-pkgs -y
    sudo apt-get install -y software-properties-common
    sudo apt-get install -y build-essential libssl-dev libffi-dev python3-dev
    sudo apt-get install -y snapd

    echo "Installing Git"
    sudo apt-get install -y git

    echo "Install GPG"
    sudo apt-get install gnupg
fi

