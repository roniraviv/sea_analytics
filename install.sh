#!/bin/bash
# Created by Shahar Gino at November 2020
# All rights reserved

# Usage:  curl -fsSL "https://raw.githubusercontent.com/sgino209/Sea_Analytics.v2/master/install.sh?token=<TOKEN>" | bash -s [app_name] [reset_db]

app_name=${1:-'Sea_Analytics.v2'}
reset_db=${2:-false}

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

CHECK_ARCH() {
    arch_name="$(uname -m)"
    if [ "${arch_name}" = "x86_64" ]; then
        if [ "$(sysctl -in sysctl.proc_translated)" = "1" ]; then
            echo "rosetta2"
        else
            echo "intel"
        fi 
    elif [ "${arch_name}" = "arm64" ]; then
        echo "arm"
    else
        echo "unknown"
    fi
}

arch=$(CHECK_ARCH)
echo "$(uname -mrs)"
if [[ ${arch} == 'rosetta2' ]]; then
    echo "Rosetta2 architecture detected"
elif [[ ${arch} == 'intel' ]]; then
    echo "Native Intel architecture detected"
elif [[ ${arch} == 'arm' ]]; then
    arch='intel'
    echo "ARM achitecture detected, trying to go in 'intel' path, if it fails then please install Rosetta2 and retry"
    exit 1
else
    echo "Unsupported architecture detected: $(uname -m)"
    exit 1
fi

BREW() {
    if [[ ${arch} == 'rosetta2' ]]; then
        arch -arm64 brew $*
    else
        brew $*
    fi
}

if [[ ${arch} == 'rosetta2' ]]; then
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

