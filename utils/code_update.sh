#!/bin/bash

# Created by Danit Gino at June 2020
# All rights reserved

git stash &> /dev/null
git submodule foreach 'git stash'
git submodule foreach --recursive git clean -xffd
git reset --hard origin/master &> /dev/null
git pull --rebase &> /dev/null
git submodule update --recursive --remote &> /dev/null
git -C utils/gpxpy checkout dev &> /dev/null
git stash pop &> /dev/null
git fetch origin --tags --force

pip install -r requirements.txt > /dev/null

echo -n "Git Version: "
git rev-parse --short HEAD
         
git_name=$(git remote show origin -n | grep "Fetch URL:" | sed 's/.*\///')
if [ "${git_name}" == "sea_analytics.git" ]; then
    if [ -f ".env" ]; then
        key=$(grep DB_AWS_SECRET_ACCESS_KEY .env | cut -d"'" -f2)
        ./utils/code_hide.sh --recrypt --key=${key} &> /dev/null
    else
        echo "ERROR: missing .env file"
    fi
fi

echo "Done!"
