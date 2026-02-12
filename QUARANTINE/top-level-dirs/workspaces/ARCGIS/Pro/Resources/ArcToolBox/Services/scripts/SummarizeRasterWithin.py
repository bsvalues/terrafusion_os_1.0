"""-----------------------------------------------------------------------------
Name:              SummarizeRasterWithin.py
Purpose:           This service tool allows zonal analysis including zonal
                   stats, histogram, geometry
Author:            Esri Inc.
Created:           7/2/2016
Copyright:   (c)   Esri, Inc. 2016
ArcGIS Version:    10.5
-----------------------------------------------------------------------------"""
# core libraries
import json
import os
import time
# internal libraries
import arcpy
import hostedgp as agolgp
import aolutils
import rasterutils


TASK_NAME = 'SummarizeRasterWithin'
ERROR_CODES = []
errorMsgs = {}
startTime = time.time()

outputItemPropertyTemplate = {
    "itemProperties": {
        "itemText": {
            "visibility": True,
            "opacity": 1,
            "layerDefinition": {
                "drawingInfo": {
                    "renderer": {
                        "type": "rasterStretch",
                        "stretchType": "minMax",
                        "colorRamp": {
                            "type": "algorithmic",
                            "algorithm": "esriHSVAlgorithm",
                            "fromColor": [247, 252, 245, 255],
                            "toColor": [0, 68, 27, 255]
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
            "popupInfo": {
                "title": "ImageLayer",
                "fieldInfos": [
                    {
                        "fieldName": "Raster.ServicePixelValue",
                        "label": "Service Pixel Value",
                        "isEditable": False,
                        "isEditableOnLayer": False,
                        "visible": True,
                        "format": {
                            "places": 2,
                            "digitSeparator": True
                        }
                    }
                ],
                "description": None,
                "showAttachments": False,
                "layerOptions": {
                    "showNoDataRecords": True
                },
                "mediaInfos": []
            }
        }
    }
}

if __name__ == '__main__':

    inrasterorfeature = arcpy.GetParameterAsText(0)
    zonefield = arcpy.GetParameterAsText(1)
    invalras = arcpy.GetParameterAsText(2)
    outras = arcpy.GetParameterAsText(3)
    statstype = arcpy.GetParameterAsText(4)
    ignorend = arcpy.GetParameterAsText(5)
    process_as_multidimensional = arcpy.GetParameterAsText(6)
    percentile = arcpy.GetParameterAsText(7)
    percentileInterpolationType = arcpy.GetParameterAsText(8)
    circularCalculation = arcpy.GetParameterAsText(9)
    circularWrapValue = arcpy.GetParameterAsText(10)
    # Environment setting
    context = arcpy.GetParameterAsText(11)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # Get the output raster from JSON object that may contains ItemID, image service url or crf unc path or
        # simply a name.
        # Example:
        # {"itemId": "no213u0uiif8924989h98h0123",
        #  "url": "http://rdvmags02.esri.com/arcgis/rest/services/Hosted/testis",
        #  "name": "anyname"}
        iid = ""  # Output Portal item ID
        isurl = ""  # Output Image Service URL
        aisurl = ""  # Output Image Service admin URL

        token = ""
        referer = ""

        # 1. Parse input and output service url
        iid, isurl, aisurl, outras = rasterutils.getOutRasterPath(outras)
        if rasterutils.RUN_ON_AGOL:
            filename = outras.split('/')[-1]
        else:
            filename = outras
        outras = rasterutils.appendcrf(outras)

        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outras))

        # For feature collection, use hostedgp
        hostedgp = agolgp.HostedGP(11, 3)
        if rasterutils.checkIfFeatureCollection(inrasterorfeature):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputZoneLayer", 0)
            inrasterorfeature = Input.name
        else:
            # Now parsing the input raster or feature
            inrasterorfeature = rasterutils.getInDataPath(inrasterorfeature)
            if inrasterorfeature.find("/FeatureServer/") > -1 \
                    or inrasterorfeature.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inrasterorfeature", 0)
                inrasterorfeature = Input.name
            else:
                if isinstance(inrasterorfeature, dict):
                    inrasterorfeature = json.dumps(inrasterorfeature)

        if invalras != None and invalras != "" and invalras != "#":
            invalras = rasterutils.getInDataPath(invalras)
            if isinstance(invalras, dict):
                invalras = json.dumps(invalras)

        # 2. Set GP environment settings
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
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.overwriteOutput = 1
        pyramids = rasterutils.getPyramids(context)

        # 3. Parsing other parameters
        # Converting boolean parameter to keyword
        if ignorend.lower() == "true":
            ignorend = "DATA"
        else:
            ignorend = "NODATA"

        # 4. Run tool
        arcpy.AddMessage("Running Zonal Statistics analysis...")
        result = arcpy.gp.ZonalStatistics_sa(inrasterorfeature, zonefield, invalras, outras, statstype,
                                             ignorend, process_as_multidimensional, percentile,
                                             percentileInterpolationType, circularCalculation, circularWrapValue)

        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))

        # Update output ========================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        uri = rasterutils.getURI(arcpy.GetMessages(), outras)

        if uri == "":
            arcpy.AddMessage("No data store URI returned.")
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
                arcpy.AddMessage(msg)
                # Update Portal Item properties if necessary
                outputItemPropertyTemplate["itemProperties"]["itemText"]["popupInfo"]["title"] = filename
                imsg = rasterutils.updateItemProperties(iid, json.dumps(outputItemPropertyTemplate, ensure_ascii=False))
                arcpy.AddMessage(imsg)
                rasterutils.refreshPortalItem(iid)
                arcpy.AddMessage(msg)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(12,  json.dumps(outval))

    except KeyError:
        rasterutils.AddExceptionError(TASK_NAME, "JSON object does not have the correct parameter key value.")

    except ValueError:
        rasterutils.AddExceptionError(TASK_NAME, "Invalid JSON object for the parameter.")

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)
