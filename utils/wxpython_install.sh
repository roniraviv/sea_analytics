#!/bin/bash
# Created by Shahar Gino at November 2020
# All rights reserved

if [[ "$OSTYPE" == "darwin"* ]]; then

    brew install wxpython
    pip install wxpython
    
else
    
    pip install -U -f https://extras.wxpython.org/wxPython4/extras/linux/gtk3/ubuntu-18.04 wxPython
    sudo apt-get install -y xclip
fi

echo "wxPython Installation Completed"

