"""-----------------------------------------------------------------------------
Name:              rastertypes.py
Purpose:           rastertypes function defines the unique properties of each
                   supported raster type.
Author:            Esri Inc.
Created:           7/21/2017
Copyright:   (c)   Esri, Inc. 2017
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import arcpy
import os
from datetime import datetime
import csv

# internal libraries
import rasterutils


def _getGPSfile(gpslist):
    """
    :param gpslist: GPS list for UAV/UAS raster type.
                    for example: [["Image_1.tif", 87, -123, 200], ...]]
    :return: a temporary gps file path
    """
    try:
        if isinstance(gpslist, list):
            scratch_folder = arcpy.env.scratchFolder
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            gpsname = "gcpjson_" + timestamp + ".csv"
            gpsfile = os.path.join(scratch_folder, gpsname)

            count = 0
            with open(gpsfile, 'w') as csvfile:
                fieldnames = ['image', 'lat', 'lon', 'alt', 'omega', 'phi', 'kappa']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                for gps in gpslist:
                    if len(gps) >= 4 and len(gps) < 7:
                        writer.writerow({'image': gps[0], 'lat': gps[1], 'lon': gps[2], 'alt': gps[3]})
                        count += 1
                    elif len(gps) >= 7:
                        writer.writerow({'image': gps[0], 'lat': gps[1], 'lon': gps[2], 'alt': gps[3], 'omega': gps[4], 'phi': gps[5], 'kappa': gps[6]})
                        count += 1
                    else:
                        continue

            if count > 0:
                return gpsfile

        return None
    except Exception as err:
        arcpy.AddMessage(err)
        return None


def getRasterType(rtJSON):
    """
    :param rtJSON: raster type JSON object
    e.g. {"rasterTypeName": "UAV/UAS", "rasterTypeParameters": {"GPS": "c:/temp/gpsfile.txt"}}
    :return: rtName - Raster Type name keyword for Add Rasters tool
             rtPara - Raster Type setting string dictionary
             rtProp - Properties set for particular raster type
    """
    rtPara = {}
    rtProp = {
        "imageCollectionType": "Raster Dataset"
    }

    try:
        # No raster type defined, default to "Raster Dataset"
        if not "rasterTypeName" in rtJSON:
            rtname = "Raster Dataset"
        else:
            rtname = rtJSON["rasterTypeName"]
            if not rtname:
                rtname = "Raster Dataset"

        if "imageCollectionProps" in rtJSON:
            rtProp = rtJSON["imageCollectionProps"]
            if not rtProp:
                rtProp = {
                    "imageCollectionType": "Raster Dataset"
                }

        if "rasterTypeParameters" in rtJSON:
            rtPara = rtJSON["rasterTypeParameters"]
            if not rtPara:
                rtPara = {}

        # Set common raster type settings
        # TODO: If DEM is not given, we use the default defined in the service def
        if "dem" in rtPara:
            rtPara["DEM"] = rasterutils.getInDataPath(rtPara["dem"])
            del rtPara["dem"]
        if "averagezdem" in rtPara:
            rtPara["averagezdem"] = rasterutils.getInDataPath(rtPara["averagezdem"])

        # Set raster type specific settings
        if rtname == "UAV/UAS":
            if "gps" in rtPara:
                # Add Raster tool only support GPS file for now
                # input should be: {"GPS": [["Image_1.tif", -123, 87, 200], ...]}
                gpsfile = _getGPSfile(rtPara["gps"])
                if gpsfile:
                    rtPara["GPSFile"] = gpsfile
                del rtPara["gps"]
            # Customize camera setting
            if "cameraProperties" in rtPara:
                # "cameraProperties": {"Make": "Canon", "Model": "5D Mark II", "FocalLength": 20, "PixelSize": ....}
                cameraprop = []
                for i in rtPara["cameraProperties"]:
                    setting = str(rtPara["cameraProperties"][i])
                    cameraprop.append(":".join([i, setting]))
                rtPara["cameraProperties"] = "\'" + ",".join(cameraprop) + "\'"
            rtProp["imageCollectionType"] = "UAV/UAS"
        elif rtname == "RedEdge" or rtname == "Altum":
            if "gps" in rtPara:
                # Add Raster tool only support GPS file for now
                # input should be: {"GPS": [["Image_1.tif", -123, 87, 200], ...]}
                gpsfile = _getGPSfile(rtPara["gps"])
                if gpsfile:
                    rtPara["GPSFile"] = gpsfile
                del rtPara["gps"]
            if "cameraProperties" in rtPara:
                del rtPara["cameraProperties"]
            rtProp["imageCollectionType"] = "UAV/UAS"
        elif rtname == "Aerial":
            rtname = "Frame Camera"
            if "cameraTable" in rtPara:
                rtPara["cameraTable"] = rasterutils.getInDataPath(rtPara["cameraTable"])
            rtProp["imageCollectionType"] = "Aerial"
        elif rtname == "ScannedAerial":
            rtname = "Frame Camera"
            if "cameraTable" in rtPara:
                rtPara["cameraTable"] = rasterutils.getInDataPath(rtPara["cameraTable"])
            rtProp["imageCollectionType"] = "ScannedAerial"
        # satellite raster types
        elif rtname.find("Landsat") > -1:
            # processing template, product type, filter are customizable
            # their settings keyword is the consistent with system tool
            rtProp["imageCollectionType"] = "Satellite"
        elif rtname == "Sentinel-2":
            # processing template, product type, filter are customizable
            # their settings keyword is the consistent with system tool
            rtProp["imageCollectionType"] = "Satellite"
        elif rtname == "QuickBird":
            # processing template, product type, filter are customizable
            # their settings keyword is the consistent with system tool
            rtProp["imageCollectionType"] = "Satellite"
        elif rtname == "IKONOS":
            # processing template, product type, filter are customizable
            # their settings keyword is the consistent with system tool
            rtProp["imageCollectionType"] = "Satellite"
        elif rtname == "GeoEye-1":
            # processing template, product type, filter are customizable
            # their settings keyword is the consistent with system tool
            rtProp["imageCollectionType"] = "Satellite"
        elif rtname == "WorldView-1" or rtname == "WorldView-2" \
                or rtname == "WorldView-3" or rtname == "WorldView-4":
            # processing template, product type, filter are customizable
            # their settings keyword is the consistent with system tool
            rtProp["imageCollectionType"] = "Satellite"
        elif rtname == "SPOT 5" or rtname == "SPOT 6" \
                or rtname == "SPOT 7":
            # processing template, product type, filter are customizable
            # their settings keyword is the consistent with system tool
            rtProp["imageCollectionType"] = "Satellite"
        elif rtname == "Pleiades-1":
            # processing template, product type, filter are customizable
            # their settings keyword is the consistent with system tool
            rtProp["imageCollectionType"] = "Satellite"
        elif rtname == "ZY3-SASMAC" or rtname == "ZY3-CRESDA":
            # processing template, product type, filter are customizable
            # their settings keyword is the consistent with system tool
            rtProp["imageCollectionType"] = "Satellite"
        elif rtname == "ADS":
            pass
        elif rtname == "Custom":
            pass
        # else:
        #     rtProp["imageCollectionType"] = "Raster Dataset"

        # arcpy.AddMessage("raster Type setting returns: {0}, {1}, {2}".format(rtname, str(rtPara), str(rtPara)))
        return rtname, rtPara, rtProp

    except Exception as err:
        arcpy.AddWarning("No valid Raster type setting found, using \"Raster Dataset\" Raster Type: " + str(err))
        return "Raster Dataset", {}, {}
