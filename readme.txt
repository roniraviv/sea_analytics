# (c) Shahar Gino, March-2020, sgino209@gmail.com

(*) References:  https://docs.djangoproject.com

(*) Note: Python 2.7 cannot be used with Django 2.0 (The Django 1.11.x series is the last to support Python 2.7).

(*) Note: The file requirements.txt can be invoked by:  % pip3 freeze > requirements.txt 

(*) Main flow diagram:
                    -------------  FWD the request to       --------------
    HTTP request -->|   URLs    |-------------------------->|    View    |---> HTTP response
    (HTML)          | (urls.py) |  appropriate view  ------>| (views.py) |     (HTML)
                    -------------                    |   -->|            |
                    ---------------                  |   |  --------------
                    |   Models    |<------------------   |                               
                    | (models.py) | read/write data    Template                          
                    ---------------                    (*.html)

------------------------------------------------------------------------------------------------------------------------------------------
 ____            _
| __ )  __ _ ___(_) ___ ___
|  _ \ / _` / __| |/ __/ __|
| |_) | (_| \__ \ | (__\__ \
|____/ \__,_|___/_|\___|___/

(*) Django installation:
    https://docs.djangoproject.com/en/2.1/intro/install/

(*) Check Django version:
    % python -m django --version

(*) Start a new project:
    % cd MyProject                       ----> It's recommended to make this folder a git repository
    % django-admin startproject mysite   ----> This will create a 'mysite' directory in your current directory
    % cd mysite
    % python manage.py startapp catalog  ----> Creates an app called 'catalog'

(*) FileStructure:

        mysite/mysite
            __init__.py
            __pycache__/
            settings.py
            urls.py
            wsgi.py
        
        mysite/catalog
            __init__.py
            admin.py
            apps.py
            migrations/
            models.py
            tests.py
            views.py

(*) Switch for VirtualEnv:
    % bash
    % virtualenv -p $(which python3) env
    % source env/bin/activate
    end with:  deactivate

(*) First time setup:
    % pip install -r requirements.txt
    % python3 manage.py makemigrations
    % python3 manage.py migrate --run-syncdb
    % python3 manage.py createsuperuser
    % python3 manage.py runserver
    browse to http://127.0.0.1:8000/
    browse to http://127.0.0.1:8000/admin

(*) Reloading the server after code-changes:
    % python3 manage.py makemigrations
    % python3 manage.py migrate --run-syncdb
    % python3 manage.py runserver

(*) Starting fresh (no history):
    % rm db.sqlite3
    % rm -rf catalog/__pycache__
    % python3 manage.py makemigrations
    % python3 manage.py migrate --run-syncdb
    % python3 manage.py runscript utils.db_init
    % python3 manage.py runserver

    Note:
    A superuser can also be generated explicitly with:
    % python3 manage.py createsuperuser

(*) Database inspection (useful, show all model attributes):
    % python manage.py inspectdb

(*) Connect to django shell:
    % python manage.py shell       --> Standard shell
    % python manage.py shell_plus  --> Extended shell (recommended)

(*) Static handling (e.g. images, JavaScript, CSS):
    (-) Important variables in settings.py:
        --> STATIC_URL:  specifies what url should static files map to under
        --> STATICFILES_DIRS:  specifies all the folders on your system where Django should look for static files
        --> STATIC_ROOT:  specifies where Django will copy all the static files to and not where the static files are already at
    (-) STATICFILES_STORAGE can replace STATICFILES_DIRS, e.g. see http://whitenoise.evans.io/en/stable
    (-) Update static files (copy all the static files from from all files within STATICFILES_DIRS to STATIC_ROOT):
    % python3 manage.py collectstatic

(*) Self-testing:
    % python3 manage.py test

    (-) In case of getting errors similar to: ValueError: Missing staticfiles manifest entry 
        Try to:  % python3 manage.py collectstatic

(*) Pushing new code which affects the database (requires "migrations"):
    - Make changes locally
    - Create the migrations locally --> % python manage.py makemigrations
    - Run the migrations locally and test that everything works --> % python manage.py migrate 
    - Check the migrations into git (or hg or whatever) alongside the code changes that made the migrations necessary.
    - Push the committed code, which includes the migrations
    - Pull the code down in the remote area
    - Run the migrations again to update the production DB.

(*) Show migrations:
    % python manage.py showmigrations

------------------------------------------------------------------------------------------------------------------------------------------
 _   _                _
| | | | ___ _ __ ___ | | ___   _
| |_| |/ _ \ '__/ _ \| |/ / | | |
|  _  |  __/ | | (_) |   <| |_| |
|_| |_|\___|_|  \___/|_|\_\\__,_|

Reference:  https://developer.mozilla.org/en-US/docs/Learn/Server-side/Django/Deployment

(*) Login:
    % heroku login

(*) Open page on browser:
    % heroku open

(*) Start a new app:
    % heroku create
    % heroku run python manage.py migrate
    % heroku run python manage.py createsuperuser
    (-) Note: it might be needed to migrate with the "--run-syncdb" flag

(*) Bind with an existing app:
    % heroku git:remote -a new_app

(*) Check the add-ons to the app:
    % heroku addons

(*) Check the configutarion variables:
    % heroku config

(*) Set configutarion variables (e.g. DJANGO_DEBUG and DJANGO_SECRET_KEY, use your own secret key...):
    % heroku config:set DJANGO_SECRET_KEY='pd0k^xcm$93x0wzr1!v(92+ha3(*ortf(^6#)2ca7dt)mdn4+@'
    % heroku config:set DJANGO_DEBUG=

(*) Heroku app info:
    % heroku pg:info

(*) Heroku database reset (be careful..):
    % heroku pg:reset DATABASE [--confirm <APP_NAME>]
    % heroku run python manage.py migrate
    % heroku run python manage.py migrate --run-syncdb

    Start Fresh:
    % heroku run python manage.py createsuperuser
    
    Load initial data (including groups and users):
    % heroku run python manage.py shell < utils/db_init.py
    
    Or in case input file is too big:
    % heroku run python manage.py runscript utils.db_init

    Or alternatively:
    % heroku run python manage.py shell
    % exec(open('utils/db_init.py').read())

(*) Update local git and deploy to Git and to Heroku server:
    % git add <files>
    % git commit -m '<comment>'
    % git push origin master
    % git push heroku master

(*) Debug with Heroku CLI:
    % heroku logs                              ---> Show current logs
    % heroku logs --tail                       ---> Show current logs and keep updating with any new results
    % heroku config:set DEBUG_COLLECTSTATIC=1  ---> Add additional logging for collectstatic (this tool is run automatically during a build)
    % heroku ps                                ---> Display dyno status

(*) Connect to Heroku shell:
    % heroku run bash
    % ...
    % exit

(*) Heroku CLI update:
    % heroku update

(*) Heroku Automated Certification Management (requires Hobby+ plan):
    % heroku certs:auto:enable   ---> Enable
    % heroku certs:auto          ---> Check status

(*) Migration flow:
    1. Run:
    % python manage.py makemigrations
    % python manage.py migrate

    2. commit your code

    3. push it to heroku master

    4. Run:
       % heroku run python manage.py makemigrations
       % heroku run python manage.py migrate

(*) Migrate local SQLite database (db.sqlite3) to Heroku Postgres database:
    1. Copy the local database data into a file called data.json:
       % python3 manage.py dumpdata --exclude contenttypes > data.json
    2. git push to heroku and run: 
       % heroku run python3 manage.py migrate
    3. Translates the data loaded from the local sqlite3 database and loads it to the heroku postgre database:
       % heroku run python3 manage.py loaddata data.json

(*) Migrate Heroku Postgres database to the local SQLite database:
    1. heroku run python3 manage.py dumpdata --exclude contenttypes > data.json
    2. git fetch
    3. python3 manage.py loaddata data.json

(*) Heroku Backup and Restore:
    (-) Backup:
        % heroku pg:backups:capture --app <app-name>
    (-) View existing backups:
        % heroku pg:backups --app <app-name>
    (-) Restore (e.g. from 'b002'):
        % heroku pg:backups:restore b002 DATABASE_URL --app <app-name>

