"""---------------------------------------------------------------------------
Name:              CalculateDensityRaster.py
Purpose:           Calculate Density for Raster Analytics
Author:            Esri Inc.
Created:           8/23/2016
Copyright:   (c)   Esri, Inc. 2016
ArcGIS Version:    10.5
---------------------------------------------------------------------------"""

# core libraries
import os
import json

# internal libraries
import arcpy
import rasterutils
import conversionUtils
import time
import analysisutils
import aolutils
import hostedgp as agolgp


TASK_NAME = 'CalculateDensity'
ERROR_CODES = [100106, 100107, 100108, 100109, 100087, 100159]
errorMsgs = {
    100106:"Field {} is not numeric.",
    100107:"Field {} does not have any positive values.",
    100108:"Field {} has negative values, only positive values will be considered for calculating density",
    100109:"The geometry type for the input layer must be points or lines",
    100087:"Field {} does not exist in {}",
    100159:"{} is an invalid unit for {}.",
}

outputItemPropertyTemplate = {
    "itemProperties": {
        "itemText":
            {"visibility": True,
             "opacity": 0.75,
             "layerDefinition": {
                 "drawingInfo": {
                     "renderer": {
                         "type": "rasterStretch",
                         "stretchType": "minMax",
                         "colorRamp": {
                             "type": "algorithmic",
                             "algorithm": "esriHSVAlgorithm",
                             "fromColor": [204, 204, 255, 255],
                             "toColor": [0, 0, 224, 255]
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
                             "digitSeparator": True}}],
                 "description": None,
                 "showAttachments": False,
                 "layerOptions": {
                     "showNoDataRecords": True},
                 "mediaInfos": []}}
    }
}


def verifyParameters():
    # verify Input geometry
    shapeType = Input.shapeType.lower()
    if not ("point" in shapeType or "line" in shapeType):
        errorMsg = errorMsgs[100109]
        aolutils.AddErrorCode(100109, errorMsg)
        return False
    # verify input field
    if countField:
        fields = arcpy.ListFields(InputLayer, countField)
        if not fields or fields[0].name.lower() != countField.lower():
            errorMsg = errorMsgs[100087].format(countField, InputLayerName)
            params = {"fieldName":countField, "inputLayer": InputLayerName}
            aolutils.AddErrorCode(100087, errorMsg, params)
            return False
        elif fields[0].type.lower() not in ["double", "single", "integer", "smallinteger"]:
            errorMsg = errorMsgs[100106].format(countField)
            params = {"fieldName":countField}
            aolutils.AddErrorCode(100106, errorMsg, params)
            return False
    # verify search distance units and output cell size units
    if searchDistance and searchDistanceUnits:
        if searchDistanceUnits.lower() not in ["meters", "kilometers", "feet", "miles", "yards", "feetint", "milesint", "yardsint"]:
            errorMsg = errorMsgs[100159].format(searchDistanceUnits,
                                                "search distance [meters, kilometers, feet, miles, yards, feetint, milesint, yardsint]")
            space = " "
            params = {"searchDistance":space.join([searchDistance, searchDistanceUnits])}
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


def selectPositiveFieldValues(_inFeatures, _field):
    '''kernel density supports only +ve values.
       Make sure only the +ve values are selected
    '''
    params = {"fieldName":_field}
    try:
        layer = arcpy.MakeFeatureLayer_management(_inFeatures, "positiveFieldLyr").getOutput(0)
        selectionSet = layer.getSelectionSet()
        if selectionSet:
            selection_mode = "SUBSET_SELECTION"
        else:
            selection_mode = "NEW_SELECTION"
        #if arcpy.env.extent:
            #selection_mode = "SUBSET_SELECTION"
        #else:
            #selection_mode = "NEW_SELECTION"

        whereExpr = "{} >= 0".format(_field)
        arcpy.AddMessage(whereExpr)
        result = arcpy.GetCount_management(_inFeatures)
        countBeforeSelection = int(result.getOutput(0))
        arcpy.AddMessage(countBeforeSelection)
        arcpy.SelectLayerByAttribute_management(_inFeatures,selection_mode,whereExpr)
        result = arcpy.GetCount_management(_inFeatures)
        countAfterSelection = int(result.getOutput(0))
        arcpy.AddMessage(countAfterSelection)
        if countAfterSelection == 0:
            errorMsg = errorMsgs[100107].format(_field)
            analysisutils.AddErrorCode(errorMsg, 100107, params)
            return False
        elif countAfterSelection < countBeforeSelection:
            errorMsg = errorMsgs[100108].format(_field)
            analysisutils.AddErrorCode(errorMsg, 100108, params, True)
        return True
    except:
        arcpy.AddMessage("Exception when selecting positive field values")
        raise Exception
        #return False

def calculateDensityRaster(startTime,
                           inputPointOrLineFeatures,
                           outputName,
                           outputCellSize,
                           outputCellSizeUnits,
                           countField,
                           searchDistance,
                           searchDistanceUnits,
                           outputAreaUnits,
                           inBarriers):

    # describe
    descInFeatures = arcpy.Describe(inputPointOrLineFeatures)
    srInFeatures = descInFeatures.spatialReference
    inext, insr = rasterutils.getFeatureCollectionExtSR(inputPointOrLineFeatures)
    outsr = arcpy.env.outputCoordinateSystem
    outext = arcpy.env.extent  
    arcpy.AddMessage("extent: {}".format(outext))
    arcpy.AddMessage("Debug- insr: {0}, outsr: {1}".format(insr.name, outsr))

    # using planar for lines because of a desktop bug
    method = "GEODESIC"
    if "line" in descInFeatures.shapeType:
        method = "PLANAR"

    # update outputCellSize
    if outputCellSize and outputCellSizeUnits:
        outputCellSize = conversionUtils.convertLengthtoSRUnits_RA(outsr, insr, inext, outputCellSize,
                                                                outputCellSizeUnits)
        startTime = analysisutils.AddTimerMessage(startTime, "Convert cellsize to SRUnits")
        arcpy.AddMessage("updated output cell size: {}".format(outputCellSize))
    else:
        outputCellSize = "#"

    # update searchDistance
    if searchDistance and searchDistanceUnits:
        searchDistance = conversionUtils.convertLengthtoSRUnits(descInFeatures, searchDistance,
                                                                searchDistanceUnits, method)
        arcpy.AddMessage("updated search distance: {}".format(searchDistance))
        startTime = analysisutils.AddTimerMessage(startTime, "Convert search distance to SR Units")
    else:
        searchDistance = "#"

    # update populationField
    if not countField:
        countField = "None"
    elif not selectPositiveFieldValues(inputPointOrLineFeatures, countField):
        return None

    # defaults to # for desktop tool
    # online tool is coded to always have areaunits from org profile
    if outputAreaUnits:
        updatedOutputAreaUnits = "SQUARE_{}".format(outputAreaUnits.upper().lstrip("SQUARE"))
        updatedOutputAreaUnits = updatedOutputAreaUnits.replace(" ", "")
    else:
        updatedOutputAreaUnits = "#"
    arcpy.AddMessage("updated output area units:{}".format(updatedOutputAreaUnits))

    arcpy.AddMessage("Kernel Density parameters")
    arcpy.AddMessage("{},{},{},{}.{}, {}".format(countField, outputCellSize, searchDistance,
                                                 updatedOutputAreaUnits, "#", method))
    try:
        arcpy.gp.KernelDensity_sa(inputPointOrLineFeatures, countField, outputName,
                                  outputCellSize, searchDistance, updatedOutputAreaUnits, "#", method,
                                  inBarriers)
        uri = rasterutils.getURI(arcpy.GetMessages(), outputName)
        startTime = analysisutils.AddTimerMessage(startTime, "Kernel Density")
        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))

        return uri
    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)
        return None
    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)
        return None


if __name__=='__main__':

    # inputPointOrLineFeatures = arcpy.GetParameterAsText(0)
    outputName = arcpy.GetParameterAsText(1)
    countField = arcpy.GetParameterAsText(2)
    searchDistance = arcpy.GetParameterAsText(3)
    outputAreaUnits = arcpy.GetParameterAsText(4) or None
    outputCellSize = arcpy.GetParameterAsText(5) or None
    inBarriers = arcpy.GetParameterAsText(6)
    context = arcpy.GetParameterAsText(7)


    # get distance and unit
    if searchDistance:
        try:
            searchDistance, searchDistanceUnits = searchDistance.split(" ")
            searchDistance = float(searchDistance)
        except ValueError:
            aolutils.AddExceptionError(TASK_NAME, "Invalid search distance")
    else:
        searchDistance = None
        searchDistanceUnits = None
    if outputCellSize:
        try:
            outputCellSize, outputCellSizeUnits = outputCellSize.split(" ")
            outputCellSize = float(outputCellSize)
        except ValueError:
            aolutils.AddExceptionError(TASK_NAME, "Invalid search distance")
    else:
        outputCellSize = None
        outputCellSizeUnits = None

    hostedgp = None
    startTime = time.time()

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        hostedgp = agolgp.HostedGP(7, 1)
        Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "input layer", 0)
        InputLayer = Input.name
        InputLayerName = Input.layername
        if len(InputLayerName) == 0:
            InputLayerName = "Input Features"
        startTime = aolutils.AddTimerMessage(startTime, "Get Input Layer")
        layerPath = arcpy.Describe(InputLayer).catalogPath

        # default to organizations units
        if not outputAreaUnits:
            outputAreaUnits = aolutils.getUnits(hostedgp)
            arcpy.AddMessage("Units from org profile {}".format(outputAreaUnits))
            startTime = aolutils.AddTimerMessage(startTime, "Get areaUnits from UserProfile")

        if inBarriers.find("/FeatureServer/") > -1 or inBarriers.find("/MapServer/") > -1:
            InputBarriers, InputBarriersLayerCount = aolutils.getHostedLayerX(hostedgp, "inBarriers", 6)
            inBarriers = InputBarriers.name
            startTime = aolutils.AddTimerMessage(startTime, "Get Input Layer")
            layerPath = arcpy.Describe(inBarriers).catalogPath

        if verifyParameters():

            # Get input/output raster url
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
            iid, isurl, aisurl, outputName = rasterutils.getOutRasterPath(outputName)
            if rasterutils.RUN_ON_AGOL:
                filename = outputName.split('/')[-1]
            else:
                filename = outputName
            outputName = rasterutils.appendcrf(outputName)

            arcpy.AddMessage("Output item id is: {0}".format(iid))
            arcpy.AddMessage("Output image service url is: {0}".format(isurl))
            arcpy.AddMessage("Output cloud raster name is: {0}".format(outputName))

            # 2. Set GP environment settings
            moreags = rasterutils._parsecontext(context)
            outsr = rasterutils.getOutSR(context)
            outext, extsr = rasterutils.getExtent(context)
            arcpy.AddMessage("extsr spatialReference: {}".format(extsr))
            arcpy.env.outputCoordinateSystem = outsr
            arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
            arcpy.env.extent = outext
            arcpy.AddMessage("Output coordinate system: {}".format(outsr))
            arcpy.AddMessage("Output extent: {}".format(outext))
            arcpy.env.resamplingMethod = rasterutils.getResamplingMethod(context)
            arcpy.env.cellSize = rasterutils.getCellsize(context)
            arcpy.env.mask = rasterutils.getMask(context)
            arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
            arcpy.env.overwriteOutput = 1
            arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)

            pyramids = rasterutils.getPyramids(context)

            # 3. run CalculateDensityRaster
            uri = calculateDensityRaster(startTime,
                                         InputLayer,
                                         outputName,
                                         outputCellSize,
                                         outputCellSizeUnits,
                                         countField,
                                         searchDistance,
                                         searchDistanceUnits,
                                         outputAreaUnits,
                                         inBarriers)

            # 4. Update output image service with URI
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
                if token == "" or token == "#":
                    token, referer = rasterutils.getToken(isurl)
                # Read and update image service info
                sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
                if sinfo != {}:
                    msg = rasterutils.updateSource(aisurl, sinfo, uri, token, referer)
                    outputItemPropertyTemplate["itemProperties"]["itemText"]["popupInfo"]["title"] = filename
                    imsg = rasterutils.updateItemProperties(iid, json.dumps(outputItemPropertyTemplate))
                    rasterutils.refreshPortalItem(iid)
                    arcpy.AddMessage(msg)
                    arcpy.AddMessage(imsg)
                else:
                    arcpy.AddWarning(
                        "No service updated although data store URI generated.")

            outval = {"itemId": iid, "url": isurl}
            arcpy.SetParameterAsText(8, json.dumps(outval))

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
