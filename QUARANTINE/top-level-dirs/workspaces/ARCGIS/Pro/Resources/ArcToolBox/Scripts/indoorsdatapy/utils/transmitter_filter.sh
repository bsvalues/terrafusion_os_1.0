#!/usr/bin/env bash

source utility.sh
set -e
set -u

process(){
    source utility.sh
    set -e
    set -u
    export HTTP_USER="cloud_writer"
    export HTTP_PASS="kQK4qp976aFEujeE"
    REC_ID=${REC_ID}
    INPOUT_DIR="/tmp/download"
    OUT_DIR="/tmp/converted"
    mkdir -p ${INPOUT_DIR}
    mkdir -p ${OUT_DIR}

    RECORDING_PATH="${INPOUT_DIR}/${REC_ID}"

    CLOUD_URL='https://slam.indoo.rs/cloud-api'

    download ${CLOUD_URL}/cache/recordings/${REC_ID} ${RECORDING_PATH}

    BASENAME=$(basename ${REC_ID})
    python change_id.py -R ${RECORDING_PATH}  -o "${OUT_DIR}/${BASENAME}"

    upload "${OUT_DIR}/${BASENAME}" ${CLOUD_URL}/cache/recordings/${REC_ID}
    exit 0
}

export -f process
RECORDING_IDS="23576 23575 23574 23573"
parallel --halt 2  "REC_ID={} process" ::: ${RECORDING_IDS[*]}