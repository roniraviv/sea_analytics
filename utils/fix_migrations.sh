#!/bin/bash

# Created by Danit Gino at February 2021
# All rights reserved

fake_en=${1:-false}

python manage.py showmigrations
if [ "${fake_en}" = true ]; then
    python manage.py migrate --fake catalog
fi
python manage.py makemigrations catalog
python manage.py makemigrations catalog --merge --noinput
python manage.py migrate catalog
python manage.py showmigrations

echo "Done!"
