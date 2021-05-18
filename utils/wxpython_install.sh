#!/bin/bash
# Created by Shahar Gino at November 2020
# All rights reserved

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
if [[ ${arch} == 'rosetta2' ]]; then
    echo "Rosetta2 architecture detected"
elif [[ ${arch} == 'intel' ]]; then
    echo "Native Intel architecture detected"
elif [[ ${arch} == 'arm' ]]; then
    echo "ARM achitecture detected --> please install Rosetta2 and then retry"
    exit 1
else
    echo "Unsupported architecture detected: $(uname -m)"
    exit 1
fi

if [[ "$OSTYPE" == "darwin"* ]]; then

    if [[ ${arch} == 'rosetta2' ]]; then
       arch -arm64 brew install wxpython
       conda install wxPython
    else
       brew install wxpython
       pip install wxpython
    fi
    
else
    
    pip install -U -f https://extras.wxpython.org/wxPython4/extras/linux/gtk3/ubuntu-18.04 wxPython
    sudo apt-get install -y xclip
fi

echo "wxPython Installation Completed"

