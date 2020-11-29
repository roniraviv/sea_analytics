#!/bin/bash

# Created by Danit Gino at June 2020
# All rights reserved

git stash
git reset --hard origin/master
git pull --rebase
git submodule update --recursive --remote
git -C utils/gpxpy checkout dev
git stash pop

echo -n "Git Version: "
git rev-parse --short HEAD

echo "Done!"
