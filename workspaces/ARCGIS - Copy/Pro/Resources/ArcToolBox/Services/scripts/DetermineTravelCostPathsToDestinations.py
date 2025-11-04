"""-----------------------------------------------------------------------------
Name:              DetermineTravelCostPathsToDestinations.py
Purpose:           This service tool allows cost/path distance and cost path analysis
Author:            Esri Inc.
Created:           8/9/2017
Copyright:   (c)   Esri, Inc. 2017
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import json
import os
import time

# internal libraries
import arcpy
import aolutils
import rasterutils
import rendererUtils
import popup
import hostedgp as agolgp

TASK_NAME = 'DetermineTravelCostPathsToDestinations'
ERROR_CODES = []
errorMsgs = {}

outputItemPropertyTemplate = {
    "itemProperties": {
        "itemText": {
            "visibility": True,
            "opacity": 1,
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


def ifNotEmpty(par):
    if par != "" and par != None and par != "#":
        return True
    else:
        return False

def execute():
    """
    Parse parameters and execute service
    :return: result feature service layer
    """
    inputDestinationRasterOrFeatures = arcpy.GetParameterAsText(0)
    inputCostDistanceRaster = arcpy.GetParameterAsText(1)
    inputCostBacklinkRaster = arcpy.GetParameterAsText(2)
    outputName = arcpy.GetParameterAsText(3)
    destinationField = arcpy.GetParameterAsText(4)
    pathType = arcpy.GetParameterAsText(5)
    # Environment setting
    context = arcpy.GetParameterAsText(6)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # 1. Parse the input parameters
        # Parse the input source raster or features
        # For feature collection, use hostedgp
        hostedgp = agolgp.HostedGP(6, 3)
        if rasterutils.checkIfFeatureCollection(inputDestinationRasterOrFeatures):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputDestinationRasterOrFeatures", 0)
            inputDestinationRasterOrFeatures = Input.name
        # Now parsing the input raster or features
        else:
            inputDestinationRasterOrFeatures = rasterutils.getInDataPath(inputDestinationRasterOrFeatures)
            if inputDestinationRasterOrFeatures.find("/FeatureServer/") > -1 \
                    or inputDestinationRasterOrFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputDestinationRasterOrFeatures", 0)
                inputDestinationRasterOrFeatures = Input.name
            else:
                if isinstance(inputDestinationRasterOrFeatures, dict):
                    inputDestinationRasterOrFeatures = json.dumps(inputDestinationRasterOrFeatures)


        inputCostDistanceRaster = rasterutils.getInDataPath(inputCostDistanceRaster)
        if isinstance(inputCostDistanceRaster, dict):
            inputCostDistanceRaster = json.dumps(inputCostDistanceRaster)

        inputCostBacklinkRaster = rasterutils.getInDataPath(inputCostBacklinkRaster)
        if isinstance(inputCostBacklinkRaster, dict):
            inputCostBacklinkRaster = json.dumps(inputCostBacklinkRaster)

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

        # 2. Parse output service url
        iid, isurl, aisurl, outputName = rasterutils.getOutRasterPath(outputName)
        if rasterutils.RUN_ON_AGOL:
            filename = outputName.split('/')[-1]
        else:
            filename = outputName
        outputName = rasterutils.appendcrf(outputName)

        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outputName))

        # 3. Set GP environment settings
        moreags = rasterutils._parsecontext(context)
        # Note: the spatial reference defined in the extent will be output spatial reference used
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.extent = outext
        arcpy.AddMessage("Output extent: {}".format(outext))
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        arcpy.env.mask = rasterutils.getMask(context)
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        pyramids = rasterutils.getPyramids(context)
        arcpy.env.overwriteOutput = 1

        # 4. Run Calculate Distance
        arcpy.AddMessage("Running Optimal Path As Raster analysis...")
        arcpy.gp.OptimalPathAsRaster_sa(inputDestinationRasterOrFeatures, inputCostDistanceRaster,
                                        inputCostBacklinkRaster,
                                        outputName, destinationField, pathType)

        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))
        arcpy.AddMessage("Successfully run")

        # Update output ========================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        uri = rasterutils.getURI(arcpy.GetMessages(), outputName)

        # Update output image service with URI for output cost path raster
        if not uri:
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


if __name__ == '__main__':
    execute()