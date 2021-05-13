#!/bin/bash
# Created by Shahar Gino at November 2020
# All rights reserved

if [[ "$OSTYPE" == "darwin"* ]]; then

    if [[ $(uname -p) == 'arm' ]]; then
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

