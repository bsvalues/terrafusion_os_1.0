"""---------------------------------------------------------------------------
Name:              InterpolatePoints.py
Purpose:           InterpolatePoints for Raster Analytics
Author:            Esri Inc.
Created:           8/31/2016
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
import numpy

TASK_NAME = 'InterpolatePoints'
ERROR_CODES = [100106, 100109, 100087, 100159]
errorMsgs = {
    100106: "Field {} is not numeric.",
    100109: "The geometry type for the input layer must be points",
    100087: "Field {} does not exist in {}",
    100159: "{} is an invalid unit for {}.",
}

MESSAGE_CODES = [120101, 120102, 120103, 120104, 120105, 120106]
processInfoMsgs = {
    120101: "The following table contains cross validation statistics",
    120102: "Mean Error",
    120103: "Root Mean Square",
    120104: "Average Standard",
    120105: "Mean Standardized",
    120106: "Root Mean Square Standardized"
}

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

outputPredictionItemPropertyTemplate = {
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
                                "fromColor": [40, 146, 199, 255],
                                "toColor": [250, 250, 100, 255]
                            }, {
                                "type": "algorithmic",
                                "algorithm": "esriHSVAlgorithm",
                                "fromColor": [250, 250, 100, 255],
                                "toColor": [232, 16, 20, 255]
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

outputErrorItemPropertyTemplate = {
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
                            "fromColor": [255, 235, 214, 255],
                            "toColor": [196, 10, 10, 255]
                        },
                        "min": 0,
                        "max": 255,
                        "numberOfStandardDeviations": 2,
                        "statistics": [],
                        "dra": False,
                        "minPercent": 2,
                        "maxPercent": 2,
                        "useGamma": True,
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

# parameter settings of "Optimize For" options
interpolateParams = \
    {"SPEED":
        {
            # "semivariogram_model_type" : "POWER",
            "number_semivariograms": 30,
            "overlap_factor": 1,
            "max_local_points": 50,
            "search_neighborhood": arcpy.SearchNeighborhoodStandardCircular(**{"nbrMax": 8, "nbrMin": 8})
        },

        "BALANCE": {
            # "semivariogram_model_type" : "POWER",
            "number_semivariograms": 100,
            "overlap_factor": 1.5,
            "max_local_points": 75,
            "search_neighborhood": arcpy.SearchNeighborhoodStandardCircular(**{"nbrMax": 10, "nbrMin": 10})
        },

        "ACCURACY": {
            # "semivariogram_model_type" : "EXPONENTIAL",
            "number_semivariograms": 100,
            "overlap_factor": 1.5,
            "max_local_points": 100,
            "search_neighborhood": arcpy.SearchNeighborhoodStandardCircular(**{"nbrMax": 15, "nbrMin": 15}),
            "transformation_type": "EMPIRICAL"
        }
    }


def verifyParameters():
    # verify Input geometry
    shapeType = Input.shapeType.lower()
    if not ("point" in shapeType):
        errorMsg = errorMsgs[100109]
        aolutils.AddErrorCode(100109, errorMsg)
        return False
    # verify input field
    if interpolateField:
        fields = arcpy.ListFields(InputLayer, interpolateField)
        if not fields or fields[0].name.lower() != interpolateField.lower():
            errorMsg = errorMsgs[100087].format(interpolateField, InputLayerName)
            params = {"fieldName": interpolateField, "inputLayer": InputLayerName}
            aolutils.AddErrorCode(100087, errorMsg, params)
            return False
        elif fields[0].type.lower() not in ["double", "single", "integer", "smallinteger"]:
            errorMsg = errorMsgs[100106].format(interpolateField)
            params = {"fieldName": interpolateField}
            aolutils.AddErrorCode(100106, errorMsg, params)
            return False
    # verify output cell size units
    if outputCellSize and outputCellSizeUnits:
        if outputCellSizeUnits.lower() not in ["meters", "kilometers", "feet", "miles", "yards", "feetint", "milesint", "yardsint"]:
            errorMsg = errorMsgs[100159].format(outputCellSizeUnits,
                                                "output cell size [meters, kilometers, feet, miles, yards, feetint, milesint, yardsint]")
            space = " "
            params = {"outputCellSize": space.join([outputCellSize, outputCellSizeUnits])}
            aolutils.AddErrorCode(100159, errorMsg, params)
            return False

    return True


# End def verifyParameters

# define interpolatePoints
def interpolatePoints(startTime, infeatures, field, optname, optname_orig, optname2, interpolateoption,
                      transformdataoption, sizeoflm, numberofnbrs,
                      cellsize, cellsizeunit, erroroption, diagnosticsoption):

    '''interpolate points based on EBK and returns'''
    _uri1 = None
    _uri2 = None
    _diagnostics = None

    # convert interpolateOption to EBK params
    interpolateoption = interpolateParams[interpolateoption]

    if transformdataoption:
        interpolateoption["transformation_type"] = "EMPIRICAL"

    if sizeoflm:
        interpolateoption["max_local_points"] = sizeoflm
    if numberofnbrs:
        interpolateoption["search_neighborhood"] = \
            arcpy.SearchNeighborhoodStandardCircular(**{"nbrMax": numberofnbrs, "nbrMin": numberofnbrs})

    galayer = "#"
    if diagnosticsoption:
        galayer = "galayer"

    # update outputCellSize
    inext, insr = rasterutils.getFeatureCollectionExtSR(infeatures)
    outsr = arcpy.env.outputCoordinateSystem
    if cellsize and cellsizeunit:
        cellsize = conversionUtils.convertLengthtoSRUnits_RA(outsr, insr, inext, cellsize, cellsizeunit)
        startTime = analysisutils.AddTimerMessage(startTime, "Convert cellsize to SRUnits")
        arcpy.AddMessage("updated output cell size: {}".format(cellsize))
    else:
        cellsize = "#"

    scratch=arcpy.env.scratchFolder
    arcpy.AddMessage(scratch)

    try:
        outputRas = os.path.join(scratch, optname_orig + ".tif")
        arcpy.EmpiricalBayesianKriging_ga(infeatures, field, galayer, outputRas, cellsize, **interpolateoption)
        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))
        # work around for EBK is not able to create output with just an output name
        csenvcurrent = arcpy.env.cellSize
        arcpy.env.cellSize = outputRas
        ppf = arcpy.env.parallelProcessingFactor
        arcpy.env.parallelProcessingFactor = 0
        arcpy.CopyRaster_management(outputRas, optname)
        arcpy.env.parallelProcessingFactor = ppf
        arcpy.env.cellSize = csenvcurrent
        _uri1 = rasterutils.getURI(arcpy.GetMessages(),optname)
        arcpy.AddMessage(_uri1)
        arcpy.Delete_management(outputRas, 'RasterDataset')
        startTime = analysisutils.AddTimerMessage(startTime, "Empirical Bayesian Kriging")
    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)
        return None
    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)
        return None

    if erroroption:
        interpolateoption["output_type"] = "PREDICTION_STANDARD_ERROR"
        outputRas2 = optname_orig + "_Errors"
        outputRas2 = os.path.join(scratch, outputRas2 + ".tif")
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))
        arcpy.EmpiricalBayesianKriging_ga(infeatures, field, "#", outputRas2, cellsize, **interpolateoption)
        # work around for EBK is not able to create output with just an output name
        csenvcurrent = arcpy.env.cellSize
        arcpy.env.cellSize = outputRas2
        ppf = arcpy.env.parallelProcessingFactor
        arcpy.env.parallelProcessingFactor = 0
        arcpy.CopyRaster_management(outputRas2, optname2)
        arcpy.env.parallelProcessingFactor = ppf
        arcpy.env.cellSize = csenvcurrent
        _uri2 = rasterutils.getURI(arcpy.GetMessages(),optname2)
        arcpy.AddMessage(_uri2)
        arcpy.Delete_management(outputRas2, 'RasterDataset')
        startTime = analysisutils.AddTimerMessage(startTime, "Empirical Bayesian Kriging for Prediction Standard Error")

    if diagnosticsoption is not None:
        try:
            _diagnostics = arcpy.CrossValidation_ga(galayer)
            # # create a dbf table to contain the diagnostics
            # inarray = numpy.array([(float(diagnostics.rootMeanSquare),
            #                        float(diagnostics.meanError),
            #                        float(diagnostics.meanStandardized),
            #                        float(diagnostics.rootMeanSquareStandardized),
            #                        float(diagnostics.averageStandard))],
            #                       numpy.dtype([("RMSE","<f8"),
            #                                    ("MeanError","<f8"),
            #                                    ("MeanStdErr","<f8"),
            #                                    ("RMSSE","<f8"),
            #                                    ("AveStdErr","<f8")]))
            # arcpy.da.NumPyArrayToTable(inarray, diagnosticstablepath)
            # ## BEGINNING OF TEST
            # inarray = numpy.array([(1,(-2081902.341176, 127542.171783))],
            #                       numpy.dtype([('idfield', numpy.int32),('XY', '<f8', 2)]))
            # spatial_ref = arcpy.Describe(infeatures).spatialReference
            # arcpy.da.NumPyArrayToFeatureClass(inarray, diagnosticstablepath,['XY'], spatial_ref)
            #
            # ## END OF TEST
        except arcpy.ExecuteError as err:
            rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)
            return None
        except Exception as err:
            rasterutils.AddExceptionError(TASK_NAME, err)
            return None

    return _uri1, _uri2, _diagnostics


# End def interpolatePoints


if __name__ == '__main__':

    # comment out the following line since EBK does not take feature service url as input yet
    # inputPointFeatures = arcpy.GetParameterAsText(0)
    interpolateField = arcpy.GetParameterAsText(1)
    outputName = arcpy.GetParameterAsText(2)
    optimizeFor = arcpy.GetParameterAsText(3)
    transformData = arcpy.GetParameter(4)
    sizeOfLocalModels = arcpy.GetParameter(5)
    numberOfNeighbors = arcpy.GetParameter(6)
    outputCellSize = arcpy.GetParameterAsText(7) or None
    outputPredictionError = arcpy.GetParameter(8)
    # outputDiagnostics = arcpy.GetParameter(9)
    outputDiagnostics = True
    context = arcpy.GetParameterAsText(9)
    outputRaster = arcpy.GetParameterAsText(10)
    outputErrorRaster = arcpy.GetParameterAsText(11)
    # outputDiagnosticTable = arcpy.GetParameterAsText(13)

    outputNameJson = outputName
    outputName2=None

    # get distance and unit
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

        # 1. Process input
        hostedgp = agolgp.HostedGP(9, 2)

        Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "input layer", 0)
        InputLayer = Input.name
        InputLayerName = Input.layername
        if len(InputLayerName) == 0:
            InputLayerName = "Input Features"
        startTime = aolutils.AddTimerMessage(startTime, "Get Input Layer")

        # TODO: add a workaround for selected feature and avoid the change on original data

        if InputLayerCount <= 10:
            errorMsg = "Not enough data to compute method. At least 10 points are required."
            aolutils.AddErrorCode(40039, errorMsg)
            raise arcpy.ExecuteError

        changedFields = Input.changedFieldNames
        interpolateField = aolutils.updateChangedFieldNames(interpolateField, changedFields)

        # 2. Verify parameter
        if verifyParameters():
            # Get input/output raster url
            # Get the output raster from JSON object that may contains ItemID, image service url or crf unc path or
            # simply a name.
            # Example:
            # {"itemId": "no213u0uiif8924989h98h0123",
            #  "url": "http://rdvmags02.esri.com/arcgis/rest/services/Hosted/testis",
            #  "name": "anyname"}
            arcpy.AddMessage(outputName)
            iid = ""  # Output Portal item ID
            isurl = ""  # Output Image Service URL
            aisurl = ""  # Output Image Service admin URL

            token = ""
            referer = ""

            # 2.1 Parse input and output service url for prediction raster
            iid, isurl, aisurl, outputName = rasterutils.getOutRasterPath(outputName)
            if rasterutils.RUN_ON_AGOL:
                filename = outputName.split('/')[-1]
            else:
                filename = outputName
            outputName = rasterutils.appendcrf(outputName)

            arcpy.AddMessage("Output item id is: {0}".format(iid))
            arcpy.AddMessage("Output image service url is: {0}".format(isurl))
            arcpy.AddMessage("Output cloud raster name is: {0}".format(outputName))


            outputName_orig = isurl[isurl.find("/services/") + 10:isurl.find("/ImageServer")].split("/")[-1]

            # 2.2 Parse input and output service url for Output Prediction Errors raster
            if outputPredictionError and isurl != "":
                # Need to inherit folder id from the first input if available
                outjson = list(rasterutils.getJSON(outputNameJson))[0]
                folderId = ""
                if "itemProperties" in outjson:
                    iprops = outjson["itemProperties"]
                    if "folderId" in iprops:
                        folderId = iprops["folderId"]
                        if "capabilities" in outjson["serviceProperties"]:
                            outputName2 = json.dumps({"serviceProperties": {"name": outputName_orig + "_Errors",
                                                      "capabilities": outjson["serviceProperties"]["capabilities"]},
                                                      "itemProperties": {"folderId": folderId}})
                        else:
                            outputName2 = json.dumps({"serviceProperties": {"name": outputName_orig + "_Errors",
                                                                            "capabilities":"Image"},
                                                      "itemProperties": {"folderId": folderId}})
                    else:
                        if "capabilities" in outjson["serviceProperties"]:
                            outputName2 = json.dumps({"serviceProperties": {"name": outputName_orig + "_Errors",
                                                                            "capabilities": outjson["serviceProperties"]["capabilities"]}})
                        else:
                            outputName2 = json.dumps({"serviceProperties": {"name": outputName_orig + "_Errors",
                                                                            "capabilities":"Image"}})
                else:
                    if "capabilities" in outjson["serviceProperties"]:
                        outputName2 = json.dumps({"serviceProperties": {"name": outputName_orig + "_Errors",
                                                                        "capabilities": outjson["serviceProperties"][
                                                                            "capabilities"]}})
                    else:
                        outputName2 = json.dumps({"serviceProperties": {"name": outputName_orig + "_Errors",
                                                                        "capabilities": "Image"}})

                arcpy.AddMessage(outputName2)
                iid2 = ""  # Output Portal item ID
                isurl2 = ""  # Output Image Service URL
                aisurl2 = ""  # Output Image Service admin URL

                token2 = ""
                referer2 = ""

                iid2, isurl2, aisurl2, outputName2 = rasterutils.getOutRasterPath(outputName2)
                outputName2 = rasterutils.appendcrf(outputName2)

                arcpy.AddMessage("Output item id for Prediction Errors is: {0}".format(iid2))
                arcpy.AddMessage("Output image service url for Prediction Errors is: {0}".format(isurl2))
                arcpy.AddMessage("Output cloud raster name for Prediction Errors is: {0}".format(outputName2))

            # 3. Set GP environment settings
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
            arcpy.env.overwriteOutput = 1
            arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)

            pyramids = rasterutils.getPyramids(context)

            # 4. run
            uri1, uri2, diagnostics = interpolatePoints(startTime,
                                                        InputLayer,
                                                        interpolateField,
                                                        outputName,
                                                        outputName_orig,
                                                        outputName2,
                                                        optimizeFor,
                                                        transformData,
                                                        sizeOfLocalModels,
                                                        numberOfNeighbors,
                                                        outputCellSize,
                                                        outputCellSizeUnits,
                                                        outputPredictionError,
                                                        outputDiagnostics)

            # 5. Update output image service with URI for output prediction raster
            if uri1 == "":
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
                    outputPredictionItemPropertyTemplate["itemProperties"]["itemText"]["popupInfo"][
                        "title"] = filename
                    imsg = rasterutils.updateItemProperties(iid, json.dumps(outputPredictionItemPropertyTemplate))
                    rasterutils.refreshPortalItem(iid)
                    arcpy.AddMessage(msg)
                    arcpy.AddMessage(imsg)
                else:
                    arcpy.AddWarning(
                        "No service updated although data store URI generated.")

            outval = {"itemId": iid, "url": isurl}
            arcpy.SetParameterAsText(10, json.dumps(outval))

            # 6. Update output image service with URI
            if outputPredictionError:
                if uri2 == "":
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
                                arcpy.AddMessage(
                                    "Building pyramids based on specified environment settings from context.")
                            else:
                                arcpy.AddMessage(
                                    "No pyramids built because pyramid_option is None or an incorrect word")
                        else:
                            arcpy.AddMessage("No pyramids built because pyramid_option is undefined")

                    arcpy.AddMessage("Data store URI: {0}".format(uri2))
                    # Get federated token to update image service
                    if token2 == "" or token2 == "#":
                        token2, referer2 = rasterutils.getToken(isurl2)
                    # Read and update image service info
                    sinfo2 = rasterutils.getServiceInfo(aisurl2, token2, referer2)
                    if sinfo2 != {}:
                        msg2 = rasterutils.updateSource(aisurl2, sinfo2, uri2, token2, referer2)
                        outputErrorItemPropertyTemplate["itemProperties"]["itemText"]["popupInfo"][
                            "title"] = filename+'_error'
                        imsg2 = rasterutils.updateItemProperties(iid2, json.dumps(outputErrorItemPropertyTemplate))
                        rasterutils.refreshPortalItem(iid2)
                        arcpy.AddMessage(msg2)
                        arcpy.AddMessage(imsg2)
                    else:
                        arcpy.AddWarning(
                            "No service updated although data store URI generated.")

                    outval2 = {"itemId": iid2, "url": isurl2}
                    arcpy.SetParameterAsText(11, json.dumps(outval2))

            # For Output Diagnostic Table
            if outputDiagnostics:
                if diagnostics == "":
                    arcpy.AddMessage("No Diagnostics.")
                else:
                    processInfo = ["{\"messageCode\": \"RA_120101\", \"message\": \"The following table contains "
                                   "cross validation statistics:\", \"params\": {}, \"style\": \"<b></b><br></br>\"}",
                                   "{\"messageCode\": \"RA_120102\", \"message\": [\"Mean Error\", \"${meanError}\"], "
                                   "\"params\": {\"meanError\": \"1.0000\"}, \"style\": \"<table style='width: "
                                   "250px;margin-left: 2.5em;'><tbody><tr><td></td><td "
                                   "style='float:right'></td></tr>\"}",
                                   "{\"messageCode\": \"RA_120103\", \"message\": [\"Root Mean Square\", "
                                   "\"${rootMeanSquare}\"], \"params\": {\"rootMeanSquare\": \"6.0000\"}, \"style\": "
                                   "\"<tr><td></td><td style='float: right;'></td></tr>\"}",
                                   "{\"messageCode\": \"RA_120104\", \"message\": [\"Average Standard\", "
                                   "\"${averageStandard}\"], \"params\": {\"averageStandard\": \"1.8947\"}, "
                                   "\"style\": \"<tr><td></td><td style='float: right;'></td></tr>\"}",
                                   "{\"messageCode\": \"RA_120105\", \"message\": [\"Mean Standardized\", "
                                   "\"${meanStandardized}\"], \"params\": {\"meanStandardized\": \"1.2309\"}, "
                                   "\"style\": \"<tr><td></td><td style='float: right;'></td></tr>\"}",
                                   "{\"messageCode\": \"RA_120106\", \"message\": [\"Root Mean Square Standardized\", "
                                   "\"${rootMeanSquareStandardized}\"], \"params\": {\"rootMeanSquareStandardized\": "
                                   "\"1.2309\"}, \"style\": \"<tr><td></td><td style='float: "
                                   "right;'></td></tr></tbody></table><br></br>\"} "
                                   ]
                    for i in range(1, 6):
                        dictMsg = json.loads(processInfo[i])
                        keysParams = list(dictMsg["params"].keys())
                        dictMsg["params"][keysParams[0]] = getattr(diagnostics, keysParams[0])
                        processInfo[i] = json.dumps(dictMsg)
                    arcpy.SetParameterAsText(12, json.dumps(processInfo))
                    startTime = aolutils.AddTimerMessage(startTime, "Write diagnostics")


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
