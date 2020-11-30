#!/bin/bash

# Created by Danit Gino at June 2020
# All rights reserved

git stash &> /dev/null
git reset --hard origin/master &> /dev/null
git pull --rebase &> /dev/null
git submodule update --recursive --remote &> /dev/null
git -C utils/gpxpy checkout dev &> /dev/null
git stash pop &> /dev/null

echo -n "Git Version: "
git rev-parse --short HEAD
         
git_name=$(git remote show origin -n | grep "Fetch URL:" | sed 's/.*\///')
if [ "${git_name}" == "sea_analytics.git" ]; then
    key="Sea_Analytics.v2"
    ./utils/code_hide.sh --recrypt --key=${key} &> /dev/null
fi

echo "Done!"
