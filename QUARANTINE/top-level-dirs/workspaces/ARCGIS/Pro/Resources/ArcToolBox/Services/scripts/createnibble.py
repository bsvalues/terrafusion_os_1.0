"""-----------------------------------------------------------------------------
Name:              createnibble.py
Purpose:           This service tool nibbles input raster using a mask raster
Author:            Esri Inc.
Created:           8/8/2017
Copyright:   (c)   Esri, Inc. 2017
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""

import os
import sys
import arcpy
import json
import rasterutils
import aolutils

TASK_NAME = 'Nibble'
ERROR_CODES = []
errorMsgs = {}

outputItemPropertyTemplate = {
    "itemProperties": {
        "itemText": {
            "visibility": True,
            "opacity": 0.85,
            "layerDefinition": {
                "drawingInfo": {
                    "renderer": {
                        "type": "rasterStretch",
                        "stretchType": "minMax",
                        "colorRamp": {
                            "type": "multipart",
                            "colorRamps": [{
                                "type": "algorithmic",
                                "algorithm": "esriHSVAlgorithm",
                                "fromColor": [110, 70, 45, 255],
                                "toColor": [204, 204, 102, 255]
                            }, {
                                "type": "algorithmic",
                                "algorithm": "esriHSVAlgorithm",
                                "fromColor": [204, 204, 102, 255],
                                "toColor": [48, 100, 102, 255]
                            }]
                        },
                        "min": 0,
                        "max": 255,
                        "numberOfStandardDeviations": 2,
                        "statistics": [],
                        "dra": False,
                        "minPercent": 2,
                        "maxPercent": 2,
                        "useGamma": False,
                        "gamma": [1],
                        "computeGamma": False,
                        "sigmoidStrengthLevel": 2
                    }
                }
            },
            "interpolation": "RSP_NearestNeighbor",
            "popupInfo": {"title": "ImageLayer", "fieldInfos": [
                {"fieldName": "Raster.ServicePixelValue",
                 "label": "Service Pixel Value",
                 "isEditable": False, "isEditableOnLayer": False,
                 "visible": True,
                 "format": {"places": 2, "digitSeparator": True}}],
                          "description": None,
                          "showAttachments": False,
                          "layerOptions": {
                              "showNoDataRecords": True},
                          "mediaInfos": []}
        }
    }
}


if __name__=='__main__':    

    inRas = arcpy.GetParameterAsText(0)
    inMaskRas = arcpy.GetParameterAsText(1)
    outName = arcpy.GetParameterAsText(2)
    inNibbleValues = arcpy.GetParameterAsText(3)
    inNibbleNoData = arcpy.GetParameterAsText(4)
    inZoneRas = arcpy.GetParameterAsText(5)
    context = arcpy.GetParameterAsText(6)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Parse input and output service url
        # Get the output raster from JSON object that may contains ItemID, image service url or crf unc path or
        # simply a name.
        # Example:
        # {"itemId": "no213u0uiif8924989h98h0123",
        #  "url": "http://rdvmags02.esri.com/arcgis/rest/services/Hosted/testis",
        #  "name": "anyname"}
        # For Output nibble
        iid = ""  # Output Portal item ID
        isurl = ""  # Output Image Service URL
        aisurl = ""  # Output Image Service admin URL

        token = ""
        referer = ""

        iid, isurl, aisurl, outras = rasterutils.getOutRasterPath(outName)
        if rasterutils.RUN_ON_AGOL:
            filename = outras.split('/')[-1]
        else:
            filename = outras
        outras = rasterutils.appendcrf(outras)

        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outras))        

        # 2. Now parsing the input raster
        inras2 = rasterutils.getInDataPath(inRas)
        if isinstance(inras2, dict):
            inras2 = json.dumps(inras2)

        inmaskras2 = rasterutils.getInDataPath(inMaskRas)
        if isinstance(inmaskras2, dict):
            inmaskras2 = json.dumps(inmaskras2)

        # For Output AGL raster
        if inZoneRas != "" and inZoneRas != None and inZoneRas != "#":
            inzoneras2 = rasterutils.getInDataPath(inZoneRas)
            if isinstance(inzoneras2, dict):
                inzoneras2 = json.dumps(inzoneras2)
        else:
            inzoneras2 = ""

        # 3. Set GP environment settings
        # Note: the spatial reference defined in the extent will be output spatial reference used
        moreags = rasterutils._parsecontext(context)
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        arcpy.AddMessage("Output coordinate system: {}".format(outsr))
        arcpy.AddMessage("Output extent: {}".format(outext))
        arcpy.env.resamplingMethod = rasterutils.getResamplingMethod(context)
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        arcpy.env.mask = rasterutils.getMask(context)
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        pyramids = rasterutils.getPyramids(context)
        arcpy.env.overwriteOutput = 1

        # 4. Run tool
        # Usage: arcpy.gp.Nibble_sa("landu", "mask_brush", "Nibble_landu5", "ALL_VALUES", "PRESERVE_NODATA", "")
        arcpy.gp.Nibble_sa(inras2, inmaskras2, outras, inNibbleValues, inNibbleNoData, inzoneras2)

        # Update output ========================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        uri = rasterutils.getURI(arcpy.GetMessages(), outras)
        if not uri:
            arcpy.AddMessage("No Data store URI found.")
        else:
            if not pyramids:
                if rasterutils.checkPyramids(uri):
                    arcpy.AddMessage("Pyramids are existing.")
                else:
                    arcpy.BuildPyramids_management(uri, "-1", "NONE", "NEAREST", "DEFAULT", "", "OVERWRITE")
                    arcpy.AddMessage("Pyramids settings were not specified. Building pyramids by default.")
            else:
                if pyramids['pyramid_option']:
                    if pyramids['pyramid_option'] == "PYRAMIDS":
                        arcpy.BuildPyramids_management(uri, pyramids['levels'], pyramids['skip_first'],
                                                       pyramids['interpolation_type'],
                                                       pyramids['pyramid_compression'],
                                                       pyramids['compression_quality'],
                                                       pyramids['skip_existing'])
                        arcpy.AddMessage("Building pyramids based on specified environment settings from context.")
                    else:
                        arcpy.AddMessage("No pyramids built because pyramid_option is None or an incorrect word")
                else:
                    arcpy.AddMessage("No pyramids built because pyramid_option is undefined")

            arcpy.AddMessage("Data store URI: {0}".format(uri))
            # Get federated token to update image service
            if token == "" or token == "#":
                token, referer = rasterutils.getToken(isurl)
            # Read and update image service info
            sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
            if sinfo != {}:
                msg = rasterutils.updateSource(aisurl, sinfo, uri, token, referer)
                outputItemPropertyTemplate["itemProperties"]["itemText"]["popupInfo"]["title"] = filename
                imsg = rasterutils.updateItemProperties(iid, json.dumps(outputItemPropertyTemplate))
                arcpy.AddMessage(imsg)
                rasterutils.refreshPortalItem(iid)
                arcpy.AddMessage(msg)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(7, json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)
