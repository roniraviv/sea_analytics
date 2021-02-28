#!/bin/bash
# Created by Danit Gino at November 2020
# All rights reserved

# Usage:  curl -fsSL "https://raw.githubusercontent.com/roniraviv/sea_analytics/master/install_setup.sh" | bash -s [repo_name] [reset_db] [app_name]

install_url=${1:-''}
repo_name=${2:-'Sea_Analytics.v2'}
reset_db=${3:-false}
app_name=${4-'auto'}

log="${HOME}/sea_analytics_install_$(date +"%y%m%d_%I%M%S").log"
date > ${log}

export STORAGE_TYPE=LOCAL
alias pip='pip3'

steps_num=12

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

    fname="${HOME}/Desktop/sea_analytics"
    touch ${fname}
    echo "#!/bin/bash" >> ${fname}
    echo "cd ${repo_path}" >> ${fname}
    echo "source env/bin/activate" >> ${fname}
    echo "PATH=\"${PATH}:/usr/local/bin/:${HOME}/${repo_path}/env/bin\"" >> ${fname}
    echo "heroku git:remote -a ${heroku_app_name}" >> ${fname}
    echo "python utils/build_training_gui_wx.pyc 2> build_training_errors.log &" >> ${fname}
    chmod +x ${fname} >> ${log} 2>&1
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        ./utils/appify "${fname}" "SeaAnalytics" "catalog/static/images/logo.png" "catalog/static/images/icon.icns" >> ${log} 2>&1    
        #rm ${fname}
    fi
}

# ==========================================================================

Fetch_License() {

    # Try to fetch license file (.env) from installations server:
    if [ -n "${install_url}" ]; then

      # Update server with your MAC:
      cmd='python utils/installation_db_cli.py'
      cmd+=' --cmd update_db'
      cmd+=" --unique_id ${install_url}"
      ${cmd}
      retVal=$?
      if [ ${retVal} -ne 0 ]; then
          echo "ERROR: couldn't update installation database"
          return 1
      fi

      # Fetch license:
      cmd='python utils/installation_db_cli.py'
      cmd+=' --cmd generate_license'
      cmd+=" --unique_id ${install_url}"
      ${cmd}
      retVal=$?
      if [ ${retVal} -ne 0 ]; then
          echo "ERROR: couldn't generate a license file"
          return 1
      fi
      if [ ! -f .env ]; then
          echo "ERROR: missing .env file"
          return 1
      fi

      # Fetch and log admin credentials (username):
      printf "\n" >> .env
      cmd='python utils/installation_db_cli.py'
      cmd+=' --cmd get_attribute'
      cmd+=" --unique_id ${install_url}"
      cmd+=' --attribute admin_username'
      cmd+=' --debug'
      ${cmd} | tail -1 | sed 's/^/ADMIN_USERNAME=/' >> .env
      retVal=$?
      if [ ${retVal} -ne 0 ]; then
          echo "ERROR: couldn't generate a admin_username attribute"
          return 1
      fi

      # Fetch and log admin credentials (password):
      cmd='python utils/installation_db_cli.py'
      cmd+=' --cmd get_attribute'
      cmd+=" --unique_id ${install_url}"
      cmd+=' --attribute admin_password'
      cmd+=' --debug'
      ${cmd} | tail -1 | sed 's/^/ADMIN_PASSWORD=/' >> .env
      retVal=$?
      if [ ${retVal} -ne 0 ]; then
          echo "ERROR: couldn't generate a admin_password attribute"
          return 1
      fi
    fi
}

# ==========================================================================

Generete_Netrc() {

    # Update server with your MAC:
    cmd='python utils/installation_db_cli.py'
    cmd+=' --cmd generate_heroku_netrc'
    ${cmd}
    retVal=$?
    if [ ${retVal} -ne 0 ]; then
        echo "ERROR: could not generate .netrc file with Heroku credentials"
        return 1
    fi
}

# ==========================================================================

Upload_Log_To_S3() {

    s3_file="$(date +"%y%m%d_%I%M%S")_setup.log"

    # Upload log to S3:
    aws_access_key_id=$(grep DB_AWS_ACCESS_KEY_ID .env | cut -d'=' -f2 | cut -d"'" -f2)
    aws_secret_access_key=$(grep DB_AWS_SECRET_ACCESS_KEY .env | cut -d'=' -f2 | cut -d"'" -f2)
    aws_bucket=$(grep DB_AWS_STORAGE_BUCKET_NAME .env | cut -d'=' -f2 | cut -d"'" -f2)

    cmd="python utils/upload_file_to_s3.py"
    cmd+=" --local_file=${log}"
    cmd+=" --s3_folder=setup_logs"
    cmd+=" --s3_file=${s3_file}"
    cmd+=" --aws_access_key_id=${aws_access_key_id}"
    cmd+=" --aws_secret_access_key=${aws_secret_access_key}"
    cmd+=" --aws_bucket=${aws_bucket}"
    ${cmd}
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
                /usr/bin/python3 -m venv env >> ${log} 2>&1
             fi
             if [[ $? -ne 0 ]]; then
                echo "Fatal ERROR: could not install python3.8"
                return 0
             fi
             source env/bin/activate >> ${log} 2>&1
             python -m pip install --upgrade pip >> ${log} 2>&1
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

        "7") step_name="libmemcached (pylibmc)"
             echo -n "Step ${step} of ${steps_num} - Installing ${step_name}..." | tee -a ${log}
             if [[ "$OSTYPE" == "darwin"* ]]; then
                brew install libmemcached >> ${log} 2>&1
             else
                sudo apt-get install libmemcached-dev >> ${log} 2>&1
             fi
             echo "Completed ($?)" | tee -a ${log}
             ;;
        
        # -------------------------------------------------------
        
        "8") step_name="Requirements"
             echo -n "Step ${step} of ${steps_num} - Installing ${step_name}..." | tee -a ${log}
             pip install -r requirements.txt > /dev/null 2>&1
             pip install -r requirements.txt >> ${log} 2>&1
             echo "Completed ($?)" | tee -a ${log}
             ;;

        # -------------------------------------------------------

        "9") step_name="License Fetch"
             echo -n "Step ${step} of ${steps_num} - ${step_name}..." | tee -a ${log}
             if [ ! -f .env ]; then
               Fetch_License
               if [ ! -f .env ]; then
                 echo "FATAL ERROR: Could not fetch an installation license"
                 exit 1
               fi
             fi
             Generete_Netrc
             if [[ "${app_name}" == "auto" ]]; then
               app_name=$(grep GUI_CLOUD_URL .env | sed 's/.*\/\///' | cut -d'.' -f1)
               if [ -z "${app_name}" ]; then
                 echo "FATAL ERROR: missing GUI_CLOUD_URL in .env file"
                 exit 1
               fi
             fi
             echo "Completed (0)" | tee -a ${log}
             ;;

        # -------------------------------------------------------
        
        "10") step_name="wxPython"
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
        
        "11") step_name="Database"
              echo -n "Step ${step} of ${steps_num} - Installing ${step_name}..." | tee -a ${log}
              key=$(grep DB_AWS_SECRET_ACCESS_KEY .env | cut -d"'" -f2)
              ./utils/code_hide.sh --recrypt --key=${key} >> ${log} 2>&1
              ./utils/db_init.sh false >> ${log} 2>&1
              echo "Completed ($?)" | tee -a ${log}
              ;;
       
        # -------------------------------------------------------
        
        "12") step_name="Heroku"
              echo -n "Step ${step}a of ${steps_num} - ${step_name} Login..." | tee -a ${log}
              if [ ! -f ~/.netrc ]; then
                heroku login
              fi
              echo "Completed ($?)" | tee -a ${log}
              
              if [[ $? -eq 0 ]]; then
	                echo -n "Step ${step}b - ${step_name} Binding ${app_name}..." | tee -a ${log}
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
        #/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)" >> ${log} 2>&1
        
        echo "Installing Git" | tee -a ${log}
        brew install git >> ${log} 2>&1
    
        echo "Install GPG"
        brew install gpg >> ${log} 2>&1
    
    else
        echo "Update and Refresh Repository Lists + essential packages" | tee -a ${log}
        sudo apt update -y >> ${log} 2>&1
        sudo apt upgrade -y >> ${log} 2>&1
        sudo apt install -y software-properties-common >> ${log} 2>&1
        sudo apt install -y build-essential libssl-dev libffi-dev python3-dev >> ${log} 2>&1
    
        echo "Installing Git" | tee -a ${log}
        sudo apt-get install -y git >> ${log} 2>&1
    
        echo "Install GPG"
        sudo apt install -y gnupg >> ${log} 2>&1
    fi

    echo "Cloning Project" | tee -a ${log}
    cd ${HOME} >> ${log} 2>&1
    git clone --recurse-submodules https://github.com/roniraviv/sea_analytics.git ${repo_name} >> ${log} 2>&1
    cd ${repo_name} >> ${log} 2>&1
    git config --global credential.helper store >> ${log} 2>&1
    
    echo "Importing .env file" | tee -a ${log}
    if [ ! -f .env ]; then
        echo "WARNING: missing .env file - will try to fetch a License later on"
    fi
    
    if [ -f utils/installation_db_cli.py.cpt ]; then
        ccrypt -d -K 'seaAnalytics123!' -f utils/installation_db_cli.py.cpt >> ${log} 2>&1
    fi
}

# ==========================================================================

Logo
hr
PreInstall

for k in $(seq 1 ${steps_num}); do
    Install "${k}"
done

echo "Creating Shortcut on Desktop" | tee -a ${log}
Create_shortcut "$(pwd)" "${app_name}"

# Initialise cloud database
if [[ "${reset_db}" == true ]]; then
    echo "Resetting database (${app_name})" | tee -a ${log}
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
                               grep -v 'Preparing wheel metadata: finished with status' |
                               sort | uniq);
if [ -z "${errs}" ]; then
    echo "Successfully"
else
    echo "with errors, see ${log}"
    echo ""
    echo "Main Errors:"
    echo "${errs}"
fi

Upload_Log_To_S3
