#!/usr/bin/env bash
set -e
set -u

BUILDING_ID="esribluetooth"
BUNDLE="/home/matej/Documents/esri/esri_bluetooth/building.zip"
OUT_DIR="/tmp/esrigpkg"
BUNDLE_UNZIP="${OUT_DIR}/unzip"

EPSG=3857

GPKG="${OUT_DIR}/${BUILDING_ID}.gpkg"

rm -rf ${OUT_DIR}
mkdir -p ${OUT_DIR}
unzip -o ${BUNDLE} -d ${BUNDLE_UNZIP}
# creation of geopackage consisting of building vector data
pb2gpkg -B ${BUNDLE_UNZIP}/building.pb -o ${GPKG}

# the rest of the code is for converting floorplans to geopackage(raster). How ever it was never used.
exit
FIRST=true
for FLOOR in ${BUNDLE_UNZIP}/floorplans/*.tif
do
    LEVEL=$(basename $FLOOR)
    TMP_RASTER=$(tempfile)
    gdalwarp -co TILED=YES -co COMPRESS=DEFLATE -t_srs "EPSG:${EPSG}" ${FLOOR} ${TMP_RASTER}
    TILES="${OUT_DIR}/tiles_${LEVEL}"
    mkdir -p ${TILES}

    python /usr/bin/gdal2tiles.py ${TMP_RASTER} ${TILES} -s ${EPSG}
    python tiles2gpkg_parallel.py -srs ${EPSG} -a ${TILES} ${GPKG}
done

