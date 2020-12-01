#!/bin/bash
# Created by Danit Gino at November 2020
# All rights reserved

# Usage:  curl -fsSL "https://raw.githubusercontent.com/roniraviv/sea_analytics/master/install.sh" | bash -s [repo_name] [reset_db] [app_name] 

repo_name=${1:-'Sea_Analytics.v2'}
reset_db=${2:-false}
app_name=${3-'auto'}

log="/Users/$(whoami)/sea_analytics_install.log"
date > ${log}

export STORAGE_TYPE=LOCAL
alias pip='pip3'

steps_num=9

PATH="$PATH:/usr/local/bin"

# ==========================================================================

Logo() {

    echo ' ____                  _                _       _   _          '
    echo '/ ___|  ___  __ _     / \   _ __   __ _| |_   _| |_(_) ___ ___ '
    echo '\___ \ / _ \/ _` |   / _ \ | `_ \ / _` | | | | | __| |/ __/ __|'
    echo ' ___) |  __/ (_| |  / ___ \| | | | (_| | | |_| | |_| | (__\__ \'
    echo '|____/ \___|\__,_| /_/   \_\_| |_|\__,_|_|\__, |\__|_|\___|___/'
    echo '                                          |___/                '
}

hr() {
    echo ''
    echo '==============================================================='
    echo ''
}

# ==========================================================================

Create_shortcut() {

    repo_path=${1}
    heroku_app_name=${2}

    fname="/Users/$(whoami)/Desktop/sea_analytics.sh"
    touch ${fname}
    echo "#!/bin/bash" >> ${fname}
    echo "cd ${repo_path}" >> ${fname}
    echo "source env/bin/activate" >> ${fname}
    echo "heroku git:remote -a ${heroku_app_name}" >> ${fname}
    echo "python utils/build_training_gui_wx.pyc &" >> ${fname}
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        ./utils/appify ~/Desktop/sea_analytics.sh "SeaAnalytics" >> ${log} 2>&1
        mkdir -p SeaAnalytics.app/Contents/Resources >> ${log} 2>&1
        cp catalog/static/images/icon.icns SeaAnalytics.app/Contents/Resources/ >> ${log} 2>&1
        cp catalog/static/images/logo.png ./ >> ${log} 2>&1
        sips -i logo.png >> ${log} 2>&1
        DeRez -only icns logo.png > tmpicns.rsrc
        Rez -append tmpicns.rsrc -o file.ext >> ${log} 2>&1
        SetFile -a C file.ext >> ${log} 2>&1
        cp -f file.ext SeaAnalytics.app/Icon$'\r' >> ${log} 2>&1
        rm tmpicns.rsrc logo.png file.ext >> ${log} 2>&1
        SetFile -a C SeaAnalytics.app >> ${log} 2>&1
        mv SeaAnalytics.app "/Users/$(whoami)/Desktop/" >> ${log} 2>&1
        rm ${fname} >> ${log} 2>&1
    fi
}

# ==========================================================================

Install() {

    step=${1}

    case ${step} in
        
        # -------------------------------------------------------

        "1") step_name="Python3.8"
             echo -n "Step ${step} of ${steps_num} - Installing ${step_name}..." | tee -a ${log}
             if [[ "$OSTYPE" == "darwin"* ]]; then
                brew install python@3.8 >> ${log} 2>&1
             else
                sudo apt install -y python3.8 python3-pip >> ${log} 2>&1
             fi
             ls -l /usr/bin/python* >> ${log} 2>&1
             ls -l /usr/local/bin/python* >> ${log} 2>&1
             ls -l /usr/local/opt/python\@3.8/bin/python3.8 >> ${log} 2>&1
             echo "Completed ($?)" | tee -a ${log}
             ;;

        # -------------------------------------------------------
        
        "2") step_name="Heroku CLI"
             echo -n "Step ${step} of ${steps_num} - Installing ${step_name}..." | tee -a ${log}
             if [[ "$OSTYPE" == "darwin"* ]]; then
                brew tap heroku/brew && brew install heroku >> ${log} 2>&1
             else
                sudo snap install --classic heroku >> ${log} 2>&1
             fi
             echo "Completed ($?)" | tee -a ${log}
             ;;
        
        # -------------------------------------------------------
        
        "3") step_name="Virtual Env"
             echo -n "Step ${step} of ${steps_num} - Installing ${step_name}..." | tee -a ${log}
             if [[ ! "$OSTYPE" == "darwin"* ]]; then
                sudo apt-get install -y python3-venv >> ${log} 2>&1
             fi
             python3.8 -m venv env >> ${log} 2>&1
             if [[ $? -ne 0 ]]; then
                /usr/local/bin/python3.8 -m venv env >> ${log} 2>&1
             fi
             if [[ $? -ne 0 ]]; then
                /usr/local/opt/python\@3.8/bin/python3.8 -m venv env >> ${log} 2>&1
             fi
             if [[ $? -ne 0 ]]; then
                echo "Fatal ERROR: could not install python3.8"
                return 0
             fi
             source env/bin/activate >> ${log} 2>&1
             echo "Completed ($?)" | tee -a ${log}
             ;;
        
        # -------------------------------------------------------
        
        "4") step_name="Psycopg2"
             echo -n "Step ${step}a of ${steps_num} - Installing ${step_name}..." | tee -a ${log}
             if [[ "$OSTYPE" == "darwin"* ]]; then
                brew install postgresql >> ${log} 2>&1
             else
                sudo apt-get install -y postgresql libpq-dev postgresql-client postgresql-client-common >> ${log} 2>&1
             fi
             echo "Completed ($?)" | tee -a ${log}
             
             echo -n "Step ${step}b of ${steps_num} - Installing ${step_name}..." | tee -a ${log}
             pip install --upgrade wheel >> ${log} 2>&1
	     pip install psycopg2==2.8.5 >> ${log} 2>&1
             echo "Completed ($?)" | tee -a ${log}
             ;;
        
        # -------------------------------------------------------
        
        "5") step_name="FFMpeg"
             echo -n "Step ${step} of ${steps_num} - Installing ${step_name}..." | tee -a ${log}
             if [[ "$OSTYPE" == "darwin"* ]]; then
                brew install ffmpeg >> ${log} 2>&1
             else
                sudo apt-get install -y build-essential >> ${log} 2>&1
                sudo apt install -y ffmpeg >> ${log} 2>&1
                pushd /usr/local/bin/ > /dev/null
                sudo ln -sf /usr/bin/ffprobe
                sudo ln -sf /usr/bin/ffmpeg
                popd > /dev/null
             fi
             echo "Completed ($?)" | tee -a ${log}
             ;;
        
        # -------------------------------------------------------
        
        "6") step_name="CCrypt"
             echo -n "Step ${step} of ${steps_num} - Installing ${step_name}..." | tee -a ${log}
             if [[ "$OSTYPE" == "darwin"* ]]; then
                brew install ccrypt >> ${log} 2>&1
             else
                sudo apt-get install ccrypt >> ${log} 2>&1
             fi
             echo "Completed ($?)" | tee -a ${log}
             ;;
        
        # -------------------------------------------------------
        
        "7") step_name="Requirements"
             echo -n "Step ${step} of ${steps_num} - Installing ${step_name}..." | tee -a ${log}
             pip install -r requirements.txt > /dev/null 2>&1
             pip install -r requirements.txt >> ${log} 2>&1
             echo "Completed ($?)" | tee -a ${log}
             ;;
        
        # -------------------------------------------------------
        
        "8") step_name="wxPython"
             echo -n "Step ${step}a of ${steps_num} - Installing ${step_name}..." | tee -a ${log}
             if [[ "$OSTYPE" == "darwin"* ]]; then
                brew install wxpython >> ${log} 2>&1
             else
                pip install -U -f https://extras.wxpython.org/wxPython4/extras/linux/gtk3/ubuntu-18.04 wxPython >> ${log} 2>&1
             fi
             echo "Completed ($?)" | tee -a ${log}
             
             echo -n "Step ${step}b of ${steps_num} - Installing ${step_name} (this might take a while)..." | tee -a ${log}
             if [[ "$OSTYPE" == "darwin"* ]]; then
                pip install wxpython >> ${log} 2>&1
             else
                sudo apt-get install -y xclip >> ${log} 2>&1
             fi
             echo "Completed ($?)" | tee -a ${log}
             ;;
        
        # -------------------------------------------------------
        
        "9") step_name="Database"
             echo -n "Step ${step} of ${steps_num} - Installing ${step_name}..." | tee -a ${log}
             key=$(grep DB_AWS_SECRET_ACCESS_KEY .env | cut -d"'" -f2)
             ./utils/code_hide.sh --recrypt --key=${key} >> ${log} 2>&1
             ./utils/db_init.sh false >> ${log} 2>&1
             echo "Completed ($?)" | tee -a ${log}
             ;;
       
        # -------------------------------------------------------
        
        "10") step_name="Heroku"
              echo -n "Step ${step}a of ${steps_num} - ${step_name} Login..." | tee -a ${log}
              heroku login
              echo "Completed ($?)" | tee -a ${log}
              
              if [[ $? -eq 0 ]]; then
	          echo -n "Step ${step}b - ${step_name} Binding..." | tee -a ${log}
                  heroku git:remote -a ${app_name} >> ${log} 2>&1
                  echo "Completed ($?)" | tee -a ${log}
                 
                  is_heroku_ready=$(heroku config | grep DJANGO_SECRET_KEY)
                  if [ -z "${is_heroku_ready}" ]; then
                      echo -n "Step ${step}c - ${step_name} Configuring..." | tee -a ${log}
                      ./utils/heroku_setenvs.sh --env_file=.env >> ${log} 2>&1 
                      echo "Completed ($?)" | tee -a ${log}
                  fi

                  echo -n "Step ${step}d - ${step_name} Deploy..." | tee -a ${log}
                  git push heroku master >> ${log} 2>&1
                  echo "Completed ($?)" | tee -a ${log}
              fi
              ;;
        
        # -------------------------------------------------------
        
        *)  echo "ERROR: unknown step (${step})"
            ;;
    esac    
}

# ==========================================================================

PreInstall() {

    if [[ "$OSTYPE" == "darwin"* ]]; then
    
        echo "Installing XCode Command-Line Tools" | tee -a ${log}
        xcode-select --install >> ${log} 2>&1
        
        #echo "Installing Brew" | tee -a ${log}
        #sudo /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)" >> ${log} 2>&1
        
        echo "Installing Git" | tee -a ${log}
        brew install git >> ${log} 2>&1
    
    else
        echo "Update and Refresh Repository Lists + essential packages" | tee -a ${log}
        sudo apt update -y >> ${log} 2>&1
        sudo apt upgrade -y >> ${log} 2>&1
        sudo apt install -y software-properties-common >> ${log} 2>&1
        sudo apt install -y build-essential libssl-dev libffi-dev python3-dev >> ${log} 2>&1
    
        echo "Installing Git" | tee -a ${log}
        sudo apt-get install -y git >> ${log} 2>&1
    fi

    echo "Cloning Project" | tee -a ${log}
    cd /Users/$(whoami) >> ${log} 2>&1
    git clone --recurse-submodules https://github.com/roniraviv/sea_analytics.git ${repo_name} >> ${log} 2>&1
    cd ${repo_name} >> ${log} 2>&1
    
    echo "Importing .env file" | tee -a ${log}
    if [ ! -f ".env" ]; then
        if [ -f "/Users/$(whoami)/Downloads/.env" ]; then
            cp ~/Downloads/.env ./ >> ${log} 2>&1
            echo "cp ~/Downloads/.env ./" | tee -a ${log}
        elif [ -f "/Users/$(whoami)/Desktop/.env" ]; then
            cp ~/Desktop/.env ./ >> ${log} 2>&1
            echo "cp ~/Desktop/.env ./" | tee -a ${log}
        fi
    fi
}

# ==========================================================================

Logo
hr
PreInstall

if [ ! -f .env ]; then
    echo "ERROR: missing .env file"
    return 1
fi

if [[ "${app_name}" == "auto" ]]; then
    app_name=$(grep GUI_CLOUD_URL .env | sed 's/.*\/\///' | cut -d'.' -f1)
    echo "app_name: ${app_name}" | tee -a ${log}
    if [ -z "${app_name}" ]; then
        echo "ERROR: missing GUI_CLOUD_URL in .env file"
        return 1
    fi
fi

for k in $(seq 1 ${steps_num}); do
    Install "${k}"
done
Create_shortcut "$(pwd)" "${repo_name}"

# Initialise cloud database
if [[ "${reset_db}" == true ]]; then
    heroku pg:reset DATABASE --confirm ${app_name}
    heroku run python manage.py migrate
    heroku run python manage.py migrate --run-syncdb
    heroku run python manage.py runscript utils.db_init
fi

echo -n "Installation Completed "
errs=$(grep -wi error ${log} | grep -v 'already installed' | \
                               grep -v 'unknown type name' | \
                               grep -v 'architecture not supported' | \
                               grep -v 'Unsupported architecture' | \
                               grep -v 'too many errors emitted' | \
                               grep -v 'exit status 1' |
                               grep -v 'Error: Your CLT does not support macOS' |
                               grep -v 'Error: Your Command Line Tools are too outdated' |
                               sort | uniq);
if [ -z "${errs}" ]; then
    echo "Successfully"
else
    echo "with errors, see ${log}"
    echo ""
    echo "Main Errors:"
    echo "${errs}"
fi

