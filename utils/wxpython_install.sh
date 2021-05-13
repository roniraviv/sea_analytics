#!/bin/bash
# Created by Shahar Gino at November 2020
# All rights reserved

if [[ "$OSTYPE" == "darwin"* ]]; then

    brew install wxpython
    if [[ $(uname -p) == 'arm' ]]; then
       conda install wxPython
    else
       pip install wxpython
    fi
    
else
    
    pip install -U -f https://extras.wxpython.org/wxPython4/extras/linux/gtk3/ubuntu-18.04 wxPython
    sudo apt-get install -y xclip
fi

echo "wxPython Installation Completed"

