#!/bin/bash

# Created by Danit Gino at February 2021
# All rights reserved

key=$(grep DB_AWS_SECRET_ACCESS_KEY .env | cut -d"'" -f2)
./utils/code_hide.sh --decrypt --key=${key} > /dev/null 

python manage.py migrate --fake catalog
python manage.py makemigrations catalog
python manage.py migrate catalog

./utils/code_hide.sh --encrypt --key=${key} > /dev/null

echo "Done!"
