#!/usr/bin/env bash
# Script for scaling building protobuffer by two set of corners
set -u
set -e

# include file building.pb (!!! rename floorplans names to floor level)
# in case you dont have indoo.rs building bundle archive you can download it from WebMMT or create using
# script in deps/indoorsdatapy/indoorsdatapy/utils/conversion/idm_pb2bundle.py
BUILDING_BUNDLE="/home/matej/Documents/mall/bundle_mall.zip"
# intermediate results
BOUNDLE_DIR="/tmp/boundle"
# output of transformed building bundle
OUTPUT_BOUNDLE="/home/matej/Documents/mall/new/bundle_mall.zip"
# output of idm file
IDM_FILE_OUT="/home/matej/Documents/mall/new/1065135822_90.idm"
#
DEST_CORNER_DEG="/home/matej/Documents/mall/corner_new.geojson"
# new/old scale to get scaling factor
SCALE=1.01814880298953


rm -rf ${OUTPUT_BOUNDLE}
rm -rf ${BOUNDLE_DIR}
mkdir -p ${BOUNDLE_DIR}

unzip -o ${BUILDING_BUNDLE} -d "${BOUNDLE_DIR}/unzip"
# rescale building
python rescale_building.py --scale  ${SCALE} \
                           --destination_deg ${DEST_CORNER_DEG} \
                           -B "${BOUNDLE_DIR}/unzip/building.pb" \
                           -r "${BOUNDLE_DIR}/unzip"

cd ${BOUNDLE_DIR}/unzip/
zip -q -x report.txt  -r ${OUTPUT_BOUNDLE} .
# generate from building idm file
bundle2idm -o ${IDM_FILE_OUT} -i ${OUTPUT_BOUNDLE}

# this is because python make zipefile which is not readable by MMT
unzip -o ${IDM_FILE_OUT} -d "${BOUNDLE_DIR}/unzip_idm"
rm -f ${IDM_FILE_OUT}
cd "${BOUNDLE_DIR}/unzip_idm"
zip -q -r ${IDM_FILE_OUT} .

exit 0