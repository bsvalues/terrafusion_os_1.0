"""-----------------------------------------------------------------------------
Name:              CalculateDistanceRaster.py
Purpose:           This service tool allows euclidean distance analysis
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

TASK_NAME = 'CalculateDistance'
ERROR_CODES = [100159]
errorMsgs = {
    100159:"{} is an invalid unit for {}.",
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

outputDirectionItemPropertyTemplate = {
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
                            "colorRamps": [
                                {
                                    "type": "algorithmic",
                                    "algorithm": "esriHSVAlgorithm",
                                    "fromColor": [190, 190, 190, 255],
                                    "toColor": [255, 45, 8, 255]
                                }, {
                                    "type": "algorithmic",
                                    "algorithm": "esriHSVAlgorithm",
                                    "fromColor": [255, 45, 8, 255],
                                    "toColor": [255, 181, 61, 255]
                                }, {
                                    "type": "algorithmic",
                                    "algorithm": "esriHSVAlgorithm",
                                    "fromColor": [255, 181, 61, 255],
                                    "toColor": [255, 254, 52, 255]
                                }, {
                                    "type": "algorithmic",
                                    "algorithm": "esriHSVAlgorithm",
                                    "fromColor": [255, 254, 52, 255],
                                    "toColor": [0, 251, 50, 255]
                                }, {
                                    "type": "algorithmic",
                                    "algorithm": "esriHSVAlgorithm",
                                    "fromColor": [0, 251, 50, 255],
                                    "toColor": [255, 254, 52, 255]
                                }, {
                                    "type": "algorithmic",
                                    "algorithm": "esriHSVAlgorithm",
                                    "fromColor": [0, 253, 255, 255],
                                    "toColor": [0, 181, 255, 255]
                                }, {
                                    "type": "algorithmic",
                                    "algorithm": "esriHSVAlgorithm",
                                    "fromColor": [0, 181, 255, 255],
                                    "toColor": [26, 35, 253, 255]
                                }, {
                                    "type": "algorithmic",
                                    "algorithm": "esriHSVAlgorithm",
                                    "fromColor": [26, 35, 253, 255],
                                    "toColor": [255, 57, 251, 255]
                                }, {
                                    "type": "algorithmic",
                                    "algorithm": "esriHSVAlgorithm",
                                    "fromColor": [255, 57, 251, 255],
                                    "toColor": [255, 45, 8, 255]
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
            "interpolation": "RSP_Bilinear",
            "popupInfo": popupTemplate
        }
    }
}

outputBackDirectionItemPropertyTemplate = outputDirectionItemPropertyTemplate

def verifyParameters():
    if maximumDistance and maximumDistanceUnits:
        if maximumDistanceUnits.lower() not in ["meters", "kilometers", "feet", "miles", "yards", "feetint", "milesint", "yardsint"]:
            errorMsg = errorMsgs[100159].format(maximumDistanceUnits,
                                                "output cell size [meters, kilometers, feet, miles, yards, feetint, milesint, yardsint]")
            space = " "
            params = {"maximumDistance":space.join([maximumDistance, maximumDistanceUnits])}
            aolutils.AddErrorCode(100159, errorMsg, params)
            return False

    if outputCellSize and outputCellSizeUnits:
        if outputCellSizeUnits.lower() not in ["meters", "kilometers", "feet", "miles", "yards", "feetint", "milesint", "yardsint"]:
            errorMsg = errorMsgs[100159].format(outputCellSizeUnits,
                                                "output cell size [meters, kilometers, feet, miles, yards, feetint, milesint, yardsint]")
            space = " "
            params = {"outputCellSize":space.join([outputCellSize, outputCellSizeUnits])}
            aolutils.AddErrorCode(100159, errorMsg, params)
            return False

    return True

def calDist(inputSourceRasterOrFeatures, outputAllocationName, maximumDistance, outputCellSize,
            allocationField, outputDistanceName, outputDirectionName, distanceMethod, inputBarrierRasterOrFeatures,
            outputBackDirectionName):

    outras = None
    if outputAllocationName == "":
        arcpy.AddMessage("Running Euclidean Distance analysis...")
        result = arcpy.gp.EucDistance_sa(inputSourceRasterOrFeatures, outputDistanceName, maximumDistance,
                                         outputCellSize, outputDirectionName, distanceMethod,
                                         inputBarrierRasterOrFeatures, outputBackDirectionName)
        outras = outputDistanceName
    else:
        arcpy.AddMessage("Running Euclidean Allocation analysis...")
        result = arcpy.gp.EucAllocation_sa(inputSourceRasterOrFeatures, outputAllocationName, maximumDistance, '#',
                                           outputCellSize, allocationField, outputDistanceName, outputDirectionName,
                                           distanceMethod, inputBarrierRasterOrFeatures, outputBackDirectionName)
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
    if len(uris) == 4:
        return uris[1], uris[2], uris[3], uris[0]
    elif len(uris) == 3:
        if outputAllocationName == "":
            return uris[0], uris[1], uris[2], None
        else:
            if outputDirectionName == "":
                return uris[1], None, uris[2], uris[0]
            else:
                return uris[1], uris[2], None, uris[0]
    elif len(uris) == 2:
        if outputAllocationName == "":
            if outputDirectionName == "":
                return uris[0], None, uris[1], None
            else:
                return uris[0], uris[1], None, None
        else:
            return uris[1], None, None, uris[0]
    elif len(uris) == 1:
        return uris[0], None, None, None
    else:
        return None, None, None, None

if __name__ == '__main__':

    inputSourceRasterOrFeatures = arcpy.GetParameterAsText(0)
    outputDistanceName = arcpy.GetParameterAsText(1)
    maximumDistance = arcpy.GetParameterAsText(2) or None
    outputCellSize = arcpy.GetParameterAsText(3) or None
    outputDirectionName = arcpy.GetParameterAsText(4)
    outputAllocationName = arcpy.GetParameterAsText(5)
    allocationField = arcpy.GetParameterAsText(6)
    distanceMethod = arcpy.GetParameterAsText(7)
    inputBarrierRasterOrFeatures = arcpy.GetParameterAsText(8)
    outputBackDirectionName = arcpy.GetParameterAsText(9)
    context = arcpy.GetParameterAsText(10)

    if maximumDistance:
        try:
            maximumDistance, maximumDistanceUnits = maximumDistance.split(" ")
            maximumDistance = float(maximumDistance)
        except ValueError:
            rasterutils.AddExceptionError(TASK_NAME, "Invalid maximum distance.")
    else:
        maximumDistance = None
        maximumDistanceUnits = None

    if outputCellSize:
        try:
            outputCellSize, outputCellSizeUnits = outputCellSize.split(" ")
            outputCellSize = float(outputCellSize)
        except ValueError:
            rasterutils.AddExceptionError(TASK_NAME, "Invalid output cell size.")
    else:
        outputCellSize = None
        outputCellSizeUnits = None

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Verify parameters
        if not verifyParameters():
            raise ValueError
        else:
            # Parse the input source raster or features
            # For feature collection, use hostedgp
            hostedgp = agolgp.HostedGP(10, 1)
            if rasterutils.checkIfFeatureCollection(inputSourceRasterOrFeatures):
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputSourceRasterOrFeatures", 0)
                inputSourceRasterOrFeatures = Input.name
                inext, insr = rasterutils.getFeatureCollectionExtSR(inputSourceRasterOrFeatures)
            # Now parsing the input raster or features
            else:
                # inputSourceRasterOrFeatures = rasterutils.getInDataPath(inputSourceRasterOrFeatures)
                # if isinstance(inputSourceRasterOrFeatures, dict):
                #     inputSourceRasterOrFeatures = json.dumps(inputSourceRasterOrFeatures)
                # token0, referer0 = rasterutils.getToken(inputSourceRasterOrFeatures)
                # inext, insr = rasterutils.getFeatureOrImageServiceExtSR(inputSourceRasterOrFeatures, token0, referer0)
                inputSourceRasterOrFeatures = rasterutils.getInDataPath(inputSourceRasterOrFeatures)
                if inputSourceRasterOrFeatures.find("/FeatureServer/") > -1 \
                        or inputSourceRasterOrFeatures.find("/MapServer/") > -1:
                    Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputSourceRasterOrFeatures", 0)
                    inputSourceRasterOrFeatures = Input.name
                    inext, insr = rasterutils.getFeatureCollectionExtSR(inputSourceRasterOrFeatures)
                else:
                    if isinstance(inputSourceRasterOrFeatures, dict):
                        inputSourceRasterOrFeatures = json.dumps(inputSourceRasterOrFeatures)
                    token0, referer0 = rasterutils.getToken(inputSourceRasterOrFeatures)
                    inext, insr = rasterutils.getFeatureOrImageServiceExtSR(inputSourceRasterOrFeatures, token0, referer0)
            outsr = arcpy.env.outputCoordinateSystem
            # update maximum distance
            if maximumDistance and maximumDistanceUnits:
                maximumDistance = conversionUtils.convertLengthtoSRUnits_RA(outsr, insr, inext, maximumDistance, maximumDistanceUnits)
                arcpy.AddMessage("updated maximum distance: {}".format(maximumDistance))
            else:
                maximumDistance = "#"

            # update output cell size
            if outputCellSize and outputCellSizeUnits:
                outputCellSize = conversionUtils.convertLengthtoSRUnits_RA(outsr, insr, inext, outputCellSize, outputCellSizeUnits)
                arcpy.AddMessage("updated output cell size: {}".format(outputCellSize))
            else:
                outputCellSize = "#"

            # Parse the input barrier raster or features
            # For feature collection, use hostedgp
            if rasterutils.checkIfFeatureCollection(inputBarrierRasterOrFeatures):
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputBarrierRasterOrFeatures", 8)
                inputBarrierRasterOrFeatures = Input.name
            # Now parsing the input raster or features
            else:
                # inputBarrierRasterOrFeatures = rasterutils.getInDataPath(inputBarrierRasterOrFeatures)
                # if isinstance(inputBarrierRasterOrFeatures, dict):
                #     inputBarrierRasterOrFeatures = json.dumps(inputBarrierRasterOrFeatures)
                inputBarrierRasterOrFeatures = rasterutils.getInDataPath(inputBarrierRasterOrFeatures)
                if inputBarrierRasterOrFeatures.find("/FeatureServer/") > -1 \
                        or inputBarrierRasterOrFeatures.find("/MapServer/") > -1:
                    Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputBarrierRasterOrFeatures", 8)
                    inputBarrierRasterOrFeatures = Input.name
                    startTime = aolutils.AddTimerMessage(startTime, "Get Input Layer")
                    layerPath = arcpy.Describe(inputBarrierRasterOrFeatures).catalogPath
                else:
                    if isinstance(inputBarrierRasterOrFeatures, dict):
                        inputBarrierRasterOrFeatures = json.dumps(inputBarrierRasterOrFeatures)



        # Get the output raster from JSON object that may contains ItemID, image service url or crf unc path or simply a name.
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

        # 2.2 outputDirectionName
        if outputDirectionName != "" and outputDirectionName != None and outputDirectionName != "#":
            iid2 = ""  # Output Portal item ID
            isurl2 = ""  # Output Image Service URL
            aisurl2 = ""  # Output Image Service admin URL

            token2 = ""
            referer2 = ""

            iid2, isurl2, aisurl2, outputDirectionName = rasterutils.getOutRasterPath(outputDirectionName)
            if rasterutils.RUN_ON_AGOL:
                filename1 = outputDirectionName.split('/')[-1]
            else:
                filename1 = outputDirectionName
            outputDirectionName = rasterutils.appendcrf(outputDirectionName)

            arcpy.AddMessage("Output item id is: {0}".format(iid2))
            arcpy.AddMessage("Output image service url is: {0}".format(isurl2))
            arcpy.AddMessage("Output cloud raster name is: {0}".format(outputDirectionName))
        else:
            outputDirectionName = ""

        # 2.3 outputBackDirectionName
        if outputBackDirectionName != "" and outputBackDirectionName != None and outputBackDirectionName != "#":
            iid3 = ""  # Output Portal item ID
            isurl3 = ""  # Output Image Service URL
            aisurl3 = ""  # Output Image Service admin URL
            token3 = ""
            referer3 = ""

            iid3, isurl3, aisurl3, outputBackDirectionName = rasterutils.getOutRasterPath(outputBackDirectionName)
            if rasterutils.RUN_ON_AGOL:
                filename2 = outputBackDirectionName.split('/')[-1]
            else:
                filename2 = outputBackDirectionName
            outputBackDirectionName = rasterutils.appendcrf(outputBackDirectionName)

            arcpy.AddMessage("Output item id is: {0}".format(iid3))
            arcpy.AddMessage("Output image service url is: {0}".format(isurl3))
            arcpy.AddMessage("Output cloud raster name is: {0}".format(outputBackDirectionName))
        else:
            outputBackDirectionName = ""
            
        # 2.4 outputAllocationName
        if outputAllocationName != "" and outputAllocationName != None and outputAllocationName != "#":
            iid4 = ""  # Output Portal item ID
            isurl4 = ""  # Output Image Service URL
            aisurl4 = ""  # Output Image Service admin URL
            token4 = ""
            referer4 = ""

            iid4, isurl4, aisurl4, outputAllocationName = rasterutils.getOutRasterPath(outputAllocationName)
            if rasterutils.RUN_ON_AGOL:
                filename3 = outputAllocationName.split('/')[-1]
            else:
                filename3 = outputAllocationName
            outputAllocationName = rasterutils.appendcrf(outputAllocationName)

            arcpy.AddMessage("Output item id is: {0}".format(iid4))
            arcpy.AddMessage("Output image service url is: {0}".format(isurl4))
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
        uri1, uri2, uri3, uri4, = calDist(inputSourceRasterOrFeatures,
                                          outputAllocationName,
                                          maximumDistance,
                                          outputCellSize,
                                          allocationField,
                                          outputDistanceName,
                                          outputDirectionName,
                                          distanceMethod,
                                          inputBarrierRasterOrFeatures,
                                          outputBackDirectionName)
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
            arcpy.SetParameterAsText(11, json.dumps(outval))

        # Update output image service with URI for output direction raster
        if outputDirectionName != "" and outputDirectionName != None and outputDirectionName != "#":
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
                    outputDirectionItemPropertyTemplate["itemProperties"]["itemText"]["popupInfo"]["title"] = filename1
                    imsg = rasterutils.updateItemProperties(iid2, json.dumps(outputDirectionItemPropertyTemplate))
                    rasterutils.refreshPortalItem(iid2)
                    arcpy.AddMessage(msg)
                else:
                    arcpy.AddWarning("No service updated although data store URI generated.")

                outval2 = {"itemId": iid2, "url": isurl2}
                arcpy.SetParameterAsText(12, json.dumps(outval2))

        # Update output image service with URI for output back direction raster
        if outputBackDirectionName != "" and outputBackDirectionName != None and outputBackDirectionName != "#":
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
                arcpy.AddMessage("Data store URI for Output Back Direction: {0}".format(uri3))
                # Get federated token to update image service
                if token3 == "" or token3 == "#":
                    token3, referer3 = rasterutils.getToken(isurl3)
                # Read and update image service info
                sinfo3 = rasterutils.getServiceInfo(aisurl3, token3, referer3)
                if sinfo3 != {}:
                    msg = rasterutils.updateSource(aisurl3, sinfo3, uri3, token3, referer3)
                    outputBackDirectionItemPropertyTemplate["itemProperties"]["itemText"]["popupInfo"]["title"] = filename2
                    imsg = rasterutils.updateItemProperties(iid3, json.dumps(outputBackDirectionItemPropertyTemplate))
                    rasterutils.refreshPortalItem(iid3)
                    arcpy.AddMessage(msg)
                else:
                    arcpy.AddWarning("No service updated although data store URI generated.")

                outval3 = {"itemId": iid3, "url": isurl3}
                arcpy.SetParameterAsText(13, json.dumps(outval3))
                
        # Update output image service with URI for output allocation raster
        if outputAllocationName != "" and outputAllocationName != None and outputAllocationName != "#":
            if not uri4:
                arcpy.AddMessage("No Data store URI.")
            else:
                if not pyramids:
                    if rasterutils.checkPyramids(uri4):
                        arcpy.AddMessage("Pyramids are existing.")
                    else:
                        arcpy.BuildPyramids_management(uri4, "-1", "NONE", "NEAREST", "DEFAULT", "", "OVERWRITE")
                        arcpy.AddMessage("Pyramids settings were not specified. Building pyramids by default.")
                else:
                    if pyramids['pyramid_option']:
                        if pyramids['pyramid_option'] == "PYRAMIDS":
                            arcpy.BuildPyramids_management(uri4, pyramids['levels'], pyramids['skip_first'],
                                                           pyramids['interpolation_type'],
                                                           pyramids['pyramid_compression'],
                                                           pyramids['compression_quality'],
                                                           pyramids['skip_existing'])
                            arcpy.AddMessage("Building pyramids based on specified environment settings from context.")
                        else:
                            arcpy.AddMessage("No pyramids built because pyramid_option is None or an incorrect word")
                    else:
                        arcpy.AddMessage("No pyramids built because pyramid_option is undefined")
                arcpy.AddMessage("Data store URI for Output Allocation: {0}".format(uri4))
                # Get federated token to update image service
                if token4 == "" or token4 == "#":
                    token4, referer4 = rasterutils.getToken(isurl4)
                # Read and update image service info
                sinfo4 = rasterutils.getServiceInfo(aisurl4, token4, referer4)
                if sinfo4 != {}:
                    msg = rasterutils.updateSource(aisurl4, sinfo4, uri4, token4, referer4)
                    outputAllocationItemPropertyTemplate["itemProperties"]["itemText"]["popupInfo"]["title"] = filename3
                    imsg = rasterutils.updateItemProperties(iid4, json.dumps(outputAllocationItemPropertyTemplate))
                    rasterutils.refreshPortalItem(iid4)
                    arcpy.AddMessage(msg)
                else:
                    arcpy.AddWarning("No service updated although data store URI generated.")

                outval4 = {"itemId": iid4, "url": isurl4}
                arcpy.SetParameterAsText(14, json.dumps(outval4))

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
