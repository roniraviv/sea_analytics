#!/bin/bash
# Created by Shahar Gino at November 2020
# All rights reserved

repo1=${1:-'../Sea_Analytics.v2'}
repo2=${2:-'.'}

diff --recursive --brief ${repo1} ${repo2} | grep -v __pycache__ | \
                                             grep -v .DS_Store | \
                                             grep -v .git | \
                                             grep -v .idea | \
                                             grep -v .env | \
                                             grep -v README.md | \
                                             grep -v '/media' | \
                                             grep -v '/my_media' | \
                                             grep -v doc | \
                                             grep -v db.sqlite3 | \
                                             grep -v "\.csv" | \
                                             grep -v add_training

