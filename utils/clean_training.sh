#!/bin/bash

# Created by Shahar Gino at Oct 2020
# All rights reserved

training_id=${1}
only_publish=${2:-false}

if [ -f "./utils/build_training.pyc" ]; then
    executable="./utils/build_training.pyc"
elif [ -f "./utils/build_training.py" ]; then
    executable="./utils/build_training.py"
else
    echo "[ERROR] Couldn't find utils/build_training.py(c) file"
fi

if [ -z ${training_id} ]; then
    echo "Usage: ${0} <training_id>"
elif [ -n ${executable} ]; then
    if [ "${only_publish}" = true ] ; then
        ${executable} --training_id=${training_id} --overwrite --pre_check_only --skip_pre_check --only_publish
    else
        ${executable} --training_id=${training_id} --overwrite --pre_check_only --skip_pre_check
    fi
fi

rm -rf media/training_${training_id}

