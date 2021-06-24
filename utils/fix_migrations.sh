#!/bin/bash

# Created by Danit Gino at February 2021
# All rights reserved

fake_en=${1:-false}

# Show Migrations (before):
python manage.py showmigrations

if [ "${fake_en}" = true ]; then
    python manage.py migrate --fake catalog
fi

# Migrate (if required):
python manage.py migrate catalog --noinput

# Create additional migrations (if required):
python manage.py makemigrations catalog --noinput
python manage.py makemigrations catalog --merge --noinput

# Migrate (if required):
python manage.py migrate catalog

# Show Migrations (after):
python manage.py showmigrations

echo "Done!"
