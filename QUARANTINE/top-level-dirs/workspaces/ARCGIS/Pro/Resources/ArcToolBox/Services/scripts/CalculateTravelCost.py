"""-----------------------------------------------------------------------------
Name:              CalculateTravelCost.py
Purpose:           This service tool allows path distance/allocation analysis
Author:            Esri Inc.
Created:           8/4/2017
Copyright:   (c)   Esri, Inc. 2017
ArcGIS Version:    10.6
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
import conversionUtils

TASK_NAME = 'CalculateTravelCost'
ERROR_CODES = []
errorMsgs = {
    120217: "Resistance rate is not support and therefore must be left empty when running Calculate Travel Cost."
}
startTime = time.time()

popupTemplate = {
    "title": "ImageLayer", "fieldInfos": [
        {"fieldName": "Raster.ServicePixelValue",
         "label": "Service Pixel Value",
         "isEditable": False, "isEditableOnLayer": False,
         "visible": True,
         "format": {"places": 2, "digitSeparator": True}}],
    "description": None,
    "showAttachments": False,
    "layerOptions": {
        "showNoDataRecords": True},
    "mediaInfos": []
}


outputDistanceItemPropertyTemplate = {
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
                            "fromColor": [255, 200, 0, 255],
                            "toColor": [0, 0, 255, 255]
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
            "interpolation": "RSP_Bilinear",
            "popupInfo": popupTemplate
        }
    }
}

outputAllocationItemPropertyTemplate = {
    "itemProperties": {
        "itemText": {
            "visibility": True,
            "opacity": 1,
            "interpolation": "RSP_NearestNeighbor",
            "popupInfo": popupTemplate
        }
    }
}

outputBacklinkItemPropertyTemplate = outputAllocationItemPropertyTemplate


def ifNotEmpty(par):
    if par != "" and par != None and par != "#":
        return True
    else:
        return False


def calTravelCost(inputSourceRasterOrFeatures, outputDistanceName, inputCostRaster, inputSurfaceRaster, maximumDistance,
                  inputHorizontalRaster, inputHorizontalFactor, inputVerticalRaster, inputVerticalFactor,
                  inputSourceCostMultiplier, inputSourceStartCost, inputSourceResistanceRate, inputSourceCapacity,
                  inputSourceDirection, outputBacklinkName, outputAllocationName, allocationField):

    outras = None
    if not outputAllocationName:
        arcpy.AddMessage("Running Distance Accumulation analysis...")
        result = arcpy.gp.DistanceAccumulation_sa(inputSourceRasterOrFeatures, outputDistanceName, None, inputSurfaceRaster, 
                                                  inputCostRaster, inputVerticalRaster, inputVerticalFactor,
                                                  inputHorizontalRaster, inputHorizontalFactor, outputBacklinkName,
                                                  None, None,
                                                  inputSourceStartCost, inputSourceCapacity or maximumDistance,
                                                  inputSourceCostMultiplier, inputSourceDirection)
        outras = outputDistanceName
    else:
        arcpy.AddMessage("Running Distance Allocation analysis...")
        result = arcpy.gp.DistanceAllocation_sa(inputSourceRasterOrFeatures, outputAllocationName, None, inputSurfaceRaster, 
                                                inputCostRaster, inputVerticalRaster, inputVerticalFactor, 
                                                inputHorizontalRaster, inputHorizontalFactor, outputDistanceName, 
                                                outputBacklinkName, None, None, 
                                                allocationField, inputSourceStartCost, inputSourceCapacity or maximumDistance, 
                                                inputSourceCostMultiplier, inputSourceDirection)
        outras = outputAllocationName

    uris = []
    msgcount = arcpy.GetMessageCount()
    for n in range(msgcount):
        uri = rasterutils.getURI(arcpy.GetMessage(n))
        arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))
        if uri == "":
            continue
        else:
            uris.append(uri)
    if len(uris) == 3:
        return uris[1], uris[2], uris[0]
    elif len(uris) == 2:
        if not outputAllocationName:
            return uris[0], uris[1], None
        else:
            return uris[1], None, uris[0]
    elif len(uris) == 1:
        return uris[0], None, None
    else:
        return None, None, None


if __name__ == '__main__':

    inputSourceRasterOrFeatures = arcpy.GetParameterAsText(0)
    outputDistanceName = arcpy.GetParameterAsText(1)
    inputCostRaster = arcpy.GetParameterAsText(2)
    inputSurfaceRaster = arcpy.GetParameterAsText(3)
    maximumDistance = arcpy.GetParameterAsText(4)
    inputHorizontalRaster = arcpy.GetParameterAsText(5)
    inputHorizontalFactor = arcpy.GetParameterAsText(6)
    inputVerticalRaster = arcpy.GetParameterAsText(7)
    inputVerticalFactor = arcpy.GetParameterAsText(8)
    inputSourceCostMultiplier = arcpy.GetParameterAsText(9)
    inputSourceStartCost = arcpy.GetParameterAsText(10)
    inputSourceResistanceRate = arcpy.GetParameterAsText(11)
    inputSourceCapacity = arcpy.GetParameterAsText(12)
    inputSourceDirection = arcpy.GetParameterAsText(13)
    outputBacklinkName = arcpy.GetParameterAsText(14)
    outputAllocationName = arcpy.GetParameterAsText(15)
    allocationField = arcpy.GetParameterAsText(16)
    context = arcpy.GetParameterAsText(17)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Verify parameters
        # Check if inputSourceResistanceRate is specified
        if inputSourceResistanceRate not in [None, "", "#"]:
            rasterutils.AddErrorCode(120217, errorMsgs[120217])
            raise Exception

        # Parse the input source raster or features
        # For feature collection, use hostedgp
        hostedgp = agolgp.HostedGP(17, 1)
        tagFeatureCollection = False
        if rasterutils.checkIfFeatureCollection(inputSourceRasterOrFeatures):
            tagFeatureCollection = True
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputSourceRasterOrFeatures", 0)
            inputSourceRasterOrFeatures = Input.name
        # Now parsing the input raster or features
        else:
            # inputSourceRasterOrFeatures = rasterutils.getInDataPath(inputSourceRasterOrFeatures)
            # if isinstance(inputSourceRasterOrFeatures, dict):
            #     inputSourceRasterOrFeatures = json.dumps(inputSourceRasterOrFeatures)
            inputSourceRasterOrFeatures = rasterutils.getInDataPath(inputSourceRasterOrFeatures)
            if inputSourceRasterOrFeatures.find("/FeatureServer/") > -1 \
                    or inputSourceRasterOrFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputSourceRasterOrFeatures", 0)
                inputSourceRasterOrFeatures = Input.name
                InputLayerName = Input.layername
            else:
                if isinstance(inputSourceRasterOrFeatures, dict):
                    inputSourceRasterOrFeatures = json.dumps(inputSourceRasterOrFeatures)

        if ifNotEmpty(inputCostRaster):
            inputCostRaster = rasterutils.getInDataPath(inputCostRaster)
            if isinstance(inputCostRaster, dict):
                inputCostRaster = json.dumps(inputCostRaster)
        else:
            inputCostRaster = ""

        if ifNotEmpty(inputSurfaceRaster):
            inputSurfaceRaster = rasterutils.getInDataPath(inputSurfaceRaster)
            if isinstance(inputSurfaceRaster, dict):
                inputSurfaceRaster = json.dumps(inputSurfaceRaster)
        else:
            inputSurfaceRaster = ""

        if ifNotEmpty(inputHorizontalRaster):
            inputHorizontalRaster = rasterutils.getInDataPath(inputHorizontalRaster)
            if isinstance(inputHorizontalRaster, dict):
                inputHorizontalRaster = json.dumps(inputHorizontalRaster)
        else:
            inputHorizontalRaster = ""

        if ifNotEmpty(inputVerticalRaster):
            inputVerticalRaster = rasterutils.getInDataPath(inputVerticalRaster)
            if isinstance(inputVerticalRaster, dict):
                inputVerticalRaster = json.dumps(inputVerticalRaster)
        else:
            inputVerticalRaster = ""

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

        # 2. Parse input and output service url
        # 2.1 outputDistanceName
        iid, isurl, aisurl, outputDistanceName = rasterutils.getOutRasterPath(outputDistanceName)
        if rasterutils.RUN_ON_AGOL:
            filename = outputDistanceName.split('/')[-1]
        else:
            filename = outputDistanceName
        outputDistanceName = rasterutils.appendcrf(outputDistanceName)

        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outputDistanceName))

        # 2.2 outputBacklinName
        if ifNotEmpty(outputBacklinkName):
            iid2 = ""  # Output Portal item ID
            isurl2 = ""  # Output Image Service URL
            aisurl2 = ""  # Output Image Service admin URL

            token2 = ""
            referer2 = ""

            iid2, isurl2, aisurl2, outputBacklinkName = rasterutils.getOutRasterPath(outputBacklinkName)
            if rasterutils.RUN_ON_AGOL:
                filename1 = outputBacklinkName.split('/')[-1]
            else:
                filename1 = outputBacklinkName
            outputBacklinkName = rasterutils.appendcrf(outputBacklinkName)

            arcpy.AddMessage("Output item id is: {0}".format(iid2))
            arcpy.AddMessage("Output image service url is: {0}".format(isurl2))
            arcpy.AddMessage("Output cloud raster name is: {0}".format(outputBacklinkName))
        else:
            outputBacklinkName = ""

        # 2.3 outputAllocationName
        if ifNotEmpty(outputAllocationName):
            iid3 = ""  # Output Portal item ID
            isurl3 = ""  # Output Image Service URL
            aisurl3 = ""  # Output Image Service admin URL
            token3 = ""
            referer3 = ""

            iid3, isurl3, aisurl3, outputAllocationName = rasterutils.getOutRasterPath(outputAllocationName)
            if rasterutils.RUN_ON_AGOL:
                filename2 = outputAllocationName.split('/')[-1]
            else:
                filename2 = outputAllocationName
            outputAllocationName = rasterutils.appendcrf(outputAllocationName)

            arcpy.AddMessage("Output item id is: {0}".format(iid3))
            arcpy.AddMessage("Output image service url is: {0}".format(isurl3))
            arcpy.AddMessage("Output cloud raster name is: {0}".format(outputAllocationName))
        else:
            outputAllocationName = ""

        # 3. Set GP environment settings
        # Note: the spatial reference defined in the extent will be output spatial reference used
        moreags = rasterutils._parsecontext(context)
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        arcpy.env.overwriteOutput = 1
        arcpy.AddMessage("Output coordinate system: {}".format(outsr))
        arcpy.AddMessage("Output extent: {}".format(outext))
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        arcpy.env.mask = rasterutils.getMask(context)
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.overwriteOutput = 1
        pyramids = rasterutils.getPyramids(context)

        # 4. Run Calculate Distance
        uri1, uri2, uri3, = calTravelCost(inputSourceRasterOrFeatures, outputDistanceName, inputCostRaster,
                                          inputSurfaceRaster, maximumDistance, inputHorizontalRaster, inputHorizontalFactor,
                                          inputVerticalRaster, inputVerticalFactor, inputSourceCostMultiplier,
                                          inputSourceStartCost, inputSourceResistanceRate, inputSourceCapacity,
                                          inputSourceDirection, outputBacklinkName, outputAllocationName, allocationField)
        arcpy.AddMessage("Successfully run")

        # Update output ========================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service

        # Update output image service with URI for output distance raster
        if not uri1:
                arcpy.AddMessage("No Data store URI.")
        else:
            if not pyramids:
                if rasterutils.checkPyramids(uri1):
                    arcpy.AddMessage("Pyramids are existing.")
                else:
                    arcpy.BuildPyramids_management(uri1, "-1", "NONE", "NEAREST", "DEFAULT", "", "OVERWRITE")
                    arcpy.AddMessage("Pyramids settings were not specified. Building pyramids by default.")
            else:
                if pyramids['pyramid_option']:
                    if pyramids['pyramid_option'] == "PYRAMIDS":
                        arcpy.BuildPyramids_management(uri1, pyramids['levels'], pyramids['skip_first'],
                                                       pyramids['interpolation_type'],
                                                       pyramids['pyramid_compression'],
                                                       pyramids['compression_quality'],
                                                       pyramids['skip_existing'])
                        arcpy.AddMessage("Building pyramids based on specified environment settings from context.")
                    else:
                        arcpy.AddMessage("No pyramids built because pyramid_option is None or an incorrect word")
                else:
                    arcpy.AddMessage("No pyramids built because pyramid_option is undefined")

            arcpy.AddMessage("Data store URI: {0}".format(uri1))
            # Get federated token to update image service
            if token == "" or token == "#":
                token, referer = rasterutils.getToken(isurl)
            # Read and update image service info
            sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
            if sinfo != {}:
                msg = rasterutils.updateSource(aisurl, sinfo, uri1, token, referer)
                outputDistanceItemPropertyTemplate["itemProperties"]["itemText"]["popupInfo"]["title"] = filename
                imsg = rasterutils.updateItemProperties(iid, json.dumps(outputDistanceItemPropertyTemplate))
                arcpy.AddMessage(imsg)
                rasterutils.refreshPortalItem(iid)
                arcpy.AddMessage(msg)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

            outval = {"itemId": iid, "url": isurl}
            arcpy.SetParameterAsText(18, json.dumps(outval))

        # Update output image service with URI for output backlink raster
        if ifNotEmpty(outputBacklinkName):
            if not uri2:
                arcpy.AddMessage("No Data store URI.")
            else:
                if not pyramids:
                    if rasterutils.checkPyramids(uri2):
                        arcpy.AddMessage("Pyramids are existing.")
                    else:
                        arcpy.BuildPyramids_management(uri2, "-1", "NONE", "NEAREST", "DEFAULT", "", "OVERWRITE")
                        arcpy.AddMessage("Pyramids settings were not specified. Building pyramids by default.")
                else:
                    if pyramids['pyramid_option']:
                        if pyramids['pyramid_option'] == "PYRAMIDS":
                            arcpy.BuildPyramids_management(uri2, pyramids['levels'], pyramids['skip_first'],
                                                           pyramids['interpolation_type'],
                                                           pyramids['pyramid_compression'],
                                                           pyramids['compression_quality'],
                                                           pyramids['skip_existing'])
                            arcpy.AddMessage("Building pyramids based on specified environment settings from context.")
                        else:
                            arcpy.AddMessage("No pyramids built because pyramid_option is None or an incorrect word")
                    else:
                        arcpy.AddMessage("No pyramids built because pyramid_option is undefined")

                arcpy.AddMessage("Data store URI for Output Direction: {0}".format(uri2))
                # Get federated token to update image service
                if token2 == "" or token2 == "#":
                    token2, referer2 = rasterutils.getToken(isurl2)
                # Read and update image service info
                sinfo2 = rasterutils.getServiceInfo(aisurl2, token2, referer2)
                if sinfo2 != {}:
                    msg = rasterutils.updateSource(aisurl2, sinfo2, uri2, token2, referer2)
                    outputBacklinkItemPropertyTemplate["itemProperties"]["itemText"]["popupInfo"]["title"] = filename1
                    imsg = rasterutils.updateItemProperties(iid2, json.dumps(outputBacklinkItemPropertyTemplate))
                    rasterutils.refreshPortalItem(iid2)
                    arcpy.AddMessage(msg)
                else:
                    arcpy.AddWarning("No service updated although data store URI generated.")

                outval2 = {"itemId": iid2, "url": isurl2}
                arcpy.SetParameterAsText(19, json.dumps(outval2))

        # Update output image service with URI for output allocation raster
        if ifNotEmpty(outputAllocationName):
            if not uri3:
                arcpy.AddMessage("No Data store URI.")
            else:
                if not pyramids:
                    if rasterutils.checkPyramids(uri3):
                        arcpy.AddMessage("Pyramids are existing.")
                    else:
                        arcpy.BuildPyramids_management(uri3, "-1", "NONE", "NEAREST", "DEFAULT", "", "OVERWRITE")
                        arcpy.AddMessage("Pyramids settings were not specified. Building pyramids by default.")
                else:
                    if pyramids['pyramid_option']:
                        if pyramids['pyramid_option'] == "PYRAMIDS":
                            arcpy.BuildPyramids_management(uri3, pyramids['levels'], pyramids['skip_first'],
                                                           pyramids['interpolation_type'],
                                                           pyramids['pyramid_compression'],
                                                           pyramids['compression_quality'],
                                                           pyramids['skip_existing'])
                            arcpy.AddMessage("Building pyramids based on specified environment settings from context.")
                        else:
                            arcpy.AddMessage("No pyramids built because pyramid_option is None or an incorrect word")
                    else:
                        arcpy.AddMessage("No pyramids built because pyramid_option is undefined")

                arcpy.AddMessage("Data store URI for Output Allocation: {0}".format(uri3))
                # Get federated token to update image service
                if token3 == "" or token3 == "#":
                    token3, referer3 = rasterutils.getToken(isurl3)
                # Read and update image service info
                sinfo3 = rasterutils.getServiceInfo(aisurl3, token3, referer3)
                if sinfo3 != {}:
                    msg = rasterutils.updateSource(aisurl3, sinfo3, uri3, token3, referer3)
                    outputAllocationItemPropertyTemplate["itemProperties"]["itemText"]["popupInfo"]["title"] = filename2
                    imsg = rasterutils.updateItemProperties(iid3, json.dumps(outputAllocationItemPropertyTemplate))
                    rasterutils.refreshPortalItem(iid3)
                    arcpy.AddMessage(msg)
                else:
                    arcpy.AddWarning("No service updated although data store URI generated.")

                outval3 = {"itemId": iid3, "url": isurl3}
                arcpy.SetParameterAsText(20, json.dumps(outval3))
        
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
