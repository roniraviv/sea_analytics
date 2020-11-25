#!/bin/bash
# Reset Flow, be-careful

runserver_en=${1:-true}

# Clear:
rm db.sqlite3
rm -rf sea_analytics/__pycache__

# Init:
python manage.py makemigrations
python manage.py migrate --run-syncdb

# Prepare:
python manage.py runscript utils.db_init

# Run:
if [[ "${runserver_en}" == true ]]; then
    python manage.py runserver 0.0.0.0:8000
fi
