#!/bin/bash

# Created by Danit Gino at June 2020
# All rights reserved

update_to_latest=${1:-false}

CHECK_ARCH() {
    arch_name="$(uname -m)"
    if [ "${arch_name}" = "x86_64" ]; then
        if [ "$(sysctl -in sysctl.proc_translated)" = "1" ]; then
            echo "rosetta2"
        else
            echo "intel"
        fi
    elif [ "${arch_name}" = "arm64" ]; then
        echo "arm"
    else
        echo "unknown"
    fi
}

arch=$(CHECK_ARCH)
if [[ ${arch} == 'rosetta2' ]]; then
    echo "Rosetta2 architecture detected" | tee -a ${log}
elif [[ ${arch} == 'intel' ]]; then
    echo "Native Intel architecture detected" | tee -a ${log}
elif [[ ${arch} == 'arm' ]]; then
    echo "ARM achitecture detected --> please install Rosetta2 and then retry" | tee -a ${log}
    exit 1
else
    echo "Unsupported architecture detected: $(uname -m)" | tee -a ${log}
    exit 1
fi

PIP() {
    if [[ ${arch} == 'rosetta2' ]]; then
        ${CONDA_PREFIX}/bin/pip $*
    else
        pip $*
    fi
}

log="sea_analytics_code_update_$(date +"%y%m%d_%I%M%S").log"
date > ${log}

echo "Cleaning (before update)..."
git stash >> ${log} 2>&1
git submodule foreach 'git stash' >> ${log} 2>&1
git submodule update --init --recursive >> ${log} 2>&1
git reset --hard >> ${log} 2>&1
git submodule foreach --recursive git reset --hard >> ${log} 2>&1
git submodule foreach --recursive git clean -xdff >> ${log} 2>&1

echo "Updating..."
git checkout master >> ${log} 2>&1
git pull --rebase >> ${log} 2>&1
if [ "${update_to_latest}" = false ]; then
    git fetch origin --tags --force >> ${log} 2>&1
    git checkout tags/lts >> ${log} 2>&1
    git submodule update --recursive --remote >> ${log} 2>&1
    git -C utils/gpxpy checkout dev >> ${log} 2>&1
    git fetch origin --tags --force >> ${log} 2>&1
fi

echo -n "Git Version: "
git rev-parse --short HEAD

echo "Installing..."
python -m pip install --upgrade pip >> ${log} 2>&1
if [[ ${arch} == 'rosetta2' ]]; then
   PIP install -r requirements_mandatory_m1_pip.txt >> ${log} 2>&1
   conda install --file requirements_mandatory_m1_conda.txt -y -q >> ${log} 2>&1
else
   pip install -r requirements_mandatory.txt >> ${log} 2>&1
   pip install -r requirements_mandatory.txt >> ${log} 2>&1
fi
PIP install -r requirements_optional.txt >> ${log} 2>&1

echo "Finalizing..."        
git_name=$(git remote show origin -n | grep "Fetch URL:" | sed 's/.*\///')
if [ "${git_name}" == "sea_analytics.git" ]; then
    if [ -f ".env" ]; then
        key=$(grep DB_AWS_SECRET_ACCESS_KEY .env | cut -d"'" -f2)
        ./utils/code_hide.sh --recrypt --key=${key} >> ${log} 2>&1
    else
        echo "ERROR: missing .env file"
    fi
fi

python manage.py makemigrations --check --dry-run >> ${log} 2>&1
ret=$?
if [ ${ret} -ne 0 ]; then
    echo "Handle Migrations..."
    utils/fix_migrations.sh ${update_to_latest} >> ${log} 2>&1
fi

echo "Done!"
