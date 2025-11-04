"""-----------------------------------------------------------------------------
Name:              ConvertFeatureToRaster.py
Purpose:           This service tool allows the user to convert feature class
                   to Cloud Raster Format (CRF)
Author:            Esri Inc.
Created:           11/22/2014
Copyright:   (c)   Esri, Inc. 2014
ArcGIS Version:    10.3
-----------------------------------------------------------------------------"""
# core libraries
import json
import hostedgp as agolgp
import aolutils
# internal libraries
import arcpy
import rasterutils
from conversionUtils import convertLengthToPCSUnits, convertLengthToGCSUnits_RA

TASK_NAME = 'ConvertFeatureToRaster'
ERROR_CODES = []
errorMsgs = {}

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
                            "type": "multipart",
                            "colorRamps": [{
                                "type": "algorithmic",
                                "algorithm": "esriHSVAlgorithm",
                                "fromColor": [255, 0, 0, 255],
                                "toColor": [255, 255, 0, 255]
                            }, {
                                "type": "algorithmic",
                                "algorithm": "esriHSVAlgorithm",
                                "fromColor": [255, 255, 0, 255],
                                "toColor": [0, 255, 255, 255]
                            }, {
                                "type": "algorithmic",
                                "algorithm": "esriHSVAlgorithm",
                                "fromColor": [0, 255, 255, 255],
                                "toColor": [0, 0, 255, 255]
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
                 "isEditable": False,
                 "isEditableOnLayer": False,
                 "visible": True,
                 "format": {"places": 2,
                            "digitSeparator": True}}],
                          "description": None,
                          "showAttachments": False,
                          "layerOptions": {
                              "showNoDataRecords": True},
                          "mediaInfos": []}}
    }
}


def convertCellsize(fsurl, rasinfo, inputsr=None):
    """
    This function takes in a JSON string of raster info, find the cell size object
    with Unit and convert it to the input image service url's unit.
    Note: linear units convert the JSON object to string automatically
    :param rasinfo: e.g. "10 Meter"
    :return: if cannot find cell size value, return empty string
    """
    try:
        rasinfodict = {}
        if rasinfo == "" or rasinfo == "#":
            return ""
        else:
            outputCellSize, outputCellSizeUnits = rasinfo.split(" ")
            outputCellSize = float(outputCellSize)

        # Only try to convert if units exist
        if outputCellSizeUnits:
            if not inputsr:
                token, referer = rasterutils.getToken(fsurl)
                sr = rasterutils.getFeatureServiceSR(fsurl, token, referer)
            else:
                sr = inputsr

            if sr:
                if sr.PCSName:
                    dataUnits = sr.linearUnitName
                    if dataUnits == "Meter":
                        dataUnits = "Meters"
                    arcpy.AddMessage("SR units: {}".format(dataUnits))
                    metersPerUnit = sr.metersPerUnit
                    outputCellSize = convertLengthToPCSUnits(
                        outputCellSize, outputCellSizeUnits, dataUnits, metersPerUnit)
                    arcpy.AddMessage("Updated output cell size in input service's projection: {}".format(outputCellSize))
                else:  # if sr is GCS
                    extent = rasterutils.getFeatureOrImageServiceExtSR(fsurl, token, referer)[0]
                    outputCellSize = convertLengthToGCSUnits_RA(outputCellSize, outputCellSizeUnits, sr, extent)

        # now set output cell size
        rasinfodict["dx"] = outputCellSize
        rasinfodict["dy"] = outputCellSize

        return json.dumps(rasinfodict)

    except ValueError:
        rasterutils.AddExceptionError(TASK_NAME, "Invalid cell size value.")
        return ""
    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteWarnings(TASK_NAME, err)
        return ""
    except Exception as err:
        rasterutils.AddExecuteWarnings(TASK_NAME, err)
        return rasinfo

if __name__ == '__main__':
    """
    1. Input data must be feature class
    2. The rasterinfo parameter defines the output raster's cell size/nodata/
    """
    indata = arcpy.GetParameterAsText(0)
    outras = arcpy.GetParameterAsText(1)
    rasinfo = arcpy.GetParameterAsText(2)
    valfield = arcpy.GetParameterAsText(3)
    context = arcpy.GetParameterAsText(4)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # 1. Get the output raster from JSON object that may contains ItemID, image service url or CRF
        # Example:
        # {"itemId": "no213u0uiif8924989h98h0123",
        #  "url": "http://rdvmags02.esri.com/arcgis/rest/services/Hosted/testis",
        #  "uri": "http://pds31:29080/suitabilityanalysis_1230414"}
        iid = ""  # Portal item ID
        isurl = ""  # Image Service URL
        aisurl = ""  # Image Service admin URL

        iid, isurl, aisurl, outras = rasterutils.getOutRasterPath(outras)
        if rasterutils.RUN_ON_AGOL:
            filename = outras.split('/')[-1]
        else:
            filename = outras
        outras = rasterutils.appendcrf(outras)

        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outras))

        # 2. Parse input
        if rasterutils.checkIfFeatureCollection(indata):
            # For feature collection, use hostedgp
            hostedgp = agolgp.HostedGP(4, 1)
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputFeature", 0)
            indata = arcpy.Describe(Input.name).catalogPath
            # Support unit conversion for output cell size
            rasinfo = convertCellsize(indata, rasinfo, arcpy.Describe(Input.name).spatialReference)
            arcpy.AddMessage("Output cellsize value is: " + rasinfo)
        else:
            # Get the input feature data path from JSON object
            indata = rasterutils.getInDataPath(indata)
            arcpy.AddMessage("Input feature service url: " + indata)
            # Support unit conversion for output cell size
            rasinfo = convertCellsize(indata, rasinfo)
            arcpy.AddMessage("Output cellsize value is: " + rasinfo)

        # 3. Execute the Generate Raster tool
        moreags = rasterutils._parsecontext(context)

        outsr = rasterutils.getOutSR(context)
        outext, outextsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        # Set additional environment settings
        arcpy.env.mask = rasterutils.getMask(context)
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.recycleProcessingWorkers = rasterutils.getRecycleProcessingWorkers(moreags)
        arcpy.env.retryOnFailures = rasterutils.getRetryOnRandomFailures(moreags)
        pyramids = rasterutils.getPyramids(context)


        inrft = "RasterizeFeatureClass"
        intbl = "Table " + indata
        rasinfo = "RasterInfo \'" + rasinfo + "\'"
        valfield = "ValueField " + valfield
        rasargs = ";".join([intbl, rasinfo, valfield])
        #arcpy.AddMessage(rasargs)
        result = arcpy.GenerateRasterFromRasterFunction_management(inrft, outras, rasargs, format="CRF")
        #arcpy.AddMessage(result.getOutput(0))
        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))

        # Update output ========================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        uri = rasterutils.getURI(arcpy.GetMessages(), outras)

        if uri == "":
            arcpy.AddMessage("No Data store URI.")
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
            token, referer = rasterutils.getToken(isurl)
            # Read and update image service info
            sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
            if sinfo != {}:
                msg = rasterutils.updateSource(aisurl, sinfo, uri, token, referer)
                arcpy.AddMessage(msg)
                # Update Portal Item properties if necessary
                outputItemPropertyTemplate["itemProperties"]["itemText"]["popupInfo"]["title"] = filename
                imsg = rasterutils.updateItemProperties(iid, json.dumps(outputItemPropertyTemplate))
                arcpy.AddMessage(imsg)
                rasterutils.refreshPortalItem(iid)
                arcpy.AddMessage(msg)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(5, json.dumps(outval))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))
