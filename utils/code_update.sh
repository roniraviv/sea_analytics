#!/bin/bash

# Created by Danit Gino at June 2020
# All rights reserved

log="sea_analytics_code_update_$(date +"%y%m%d_%I%M%S").log"
date > ${log}

echo "Cleaning (before update)..."
git stash >> ${log} 2>&1
git submodule foreach 'git stash' >> ${log} 2>&1
git submodule update --init --recursive >> ${log} 2>&1
git reset --hard >> ${log} 2>&1
git submodule foreach --recursive git reset --hard >> ${log} 2>&1
git submodule foreach --recursive git clean -xdff >> ${log} 2>&1

echo "Updating..."
git checkout tags/lts >> ${log} 2>&1
#git pull --rebase >> ${log} 2>&1
git submodule update --recursive --remote >> ${log} 2>&1
git -C utils/gpxpy checkout dev >> ${log} 2>&1
git fetch origin --tags --force >> ${log} 2>&1

echo -n "Git Version: "
git rev-parse --short HEAD

echo "Installing..."
python -m pip install --upgrade pip >> ${log} 2>&1
pip install -r requirements.txt >> ${log} 2>&1

echo "Finalizing..."        
git_name=$(git remote show origin -n | grep "Fetch URL:" | sed 's/.*\///')
if [ "${git_name}" == "sea_analytics.git" ]; then
    if [ -f ".env" ]; then
        key=$(grep DB_AWS_SECRET_ACCESS_KEY .env | cut -d"'" -f2)
        ./utils/code_hide.sh --recrypt --key=${key} >> ${log} 2>&1
    else
        echo "ERROR: missing .env file"
    fi
fi

echo "Done!"
