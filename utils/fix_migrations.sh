#!/bin/bash

# Created by Danit Gino at February 2021
# All rights reserved

fake_en=${1:-false}

# Show Migrations (before):
python manage.py showmigrations

if [ "${fake_en}" = true ]; then
    python manage.py migrate --fake
fi

# Migrate (if required):
python manage.py migrate --noinput

# Create additional migrations (if required):
python manage.py makemigrations --noinput
python manage.py makemigrations --merge --noinput

# Migrate (if required):
python manage.py migrate

# Show Migrations (after):
python manage.py showmigrations

echo "Done!"
