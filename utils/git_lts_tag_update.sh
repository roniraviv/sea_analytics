#!/bin/bash
# Created by Danit Gino at January 2021
# All rights reserved

git tag --delete lts
git push --delete origin lts
git tag -a lts -m"latest stable release"
git push origin lts
git describe --tags

echo "Git LTS tagging-update Completed"

