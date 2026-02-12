#!/usr/bin/env bash
# Script for scaling building by two set of corners
set -u
set -e

# include file building.pb (!!! rename floorplans names to floor level)
# in case you dont have indoo.rs building bundle archive you can download it from WebMMT or create using
# script in deps/indoorsdatapy/indoorsdatapy/utils/conversion/idm_pb2bundle.py
# include file building.pb
BUILDING_BUNDLE="/home/matej/Documents/esri/BUILDING/building.zip"
# intermediate results
BUILDING_BUNDLE_NEW="/tmp/input_bundle.zip"
BOUNDLE_DIR="/tmp/boundle"
# output of transformed building bundle
OUTPUT_BOUNDLE="/tmp/boundle/boundle.zip"
# output of idm file
IDM_FILE_OUT="/tmp/boundle/idm_out.idm"
# top left + down right for origin in meters
ORIGIN_GJSON="/home/matej/Documents/esri/hrptrfshp/coorners/corners_indoors.geojson"
# top left + down right for destination in meters
DEST_GJSON="/home/matej/Documents/esri/hrptrfshp/coorners/corners_esri.geojson"
# top left in degrees
DEST_CORNER_DEG="/home/matej/Documents/esri/hrptrfshp/coorners/corner_esri_deg.geojson"


rm -rf ${OUTPUT_BOUNDLE}
rm -rf ${BOUNDLE_DIR}
mkdir -p ${BOUNDLE_DIR}

unzip -o ${BUILDING_BUNDLE} -d "${BOUNDLE_DIR}/unzip"
# rescale building
python rescale_building.py    --origin ${ORIGIN_GJSON} \
                              --destination ${DEST_GJSON} \
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