import time
import arcpy
import aolutils
import hostedgp as agolgp
import json
import rendererUtils
import GeoenrichmentCore

# import importlib
# importlib.reload(GeoenrichmentCore)


TASK_NAME = "EnrichLayer"
PORTAL_HELPER_SERVICES_KEY = "geoenrichment"
GEOENRICH_URL = "GeoEnrichment/enrich"
NA_PRIVILEGE = u"premium:user:networkanalysis"
GE_PRIVILEGE = u"premium:user:geoenrichment"
MAX_COUNT_FIELDS = 450

ERROR_CODES = [100020, 100022, 100023, 100024, 100041, 100044, 100045,
               100046, 100047, 100110, 100111, 100124, 100120, 100126,
               100143, 100148, 100159, 100160, 100231, 100242, 100048,
               100207, 100283, 100287, 100288]

# run the script

errorMsgs = {100110: "Your user role does not include the geoEnrichment privilege.",
             100111: "Your user role does not include the network analysis privilege.",
             100207: "The total number of input fields and enrichment variables exceeds the maximum limitation of {}.",
             100048: "The input layer {} contains multipoint geometry and has been converted to single point geometry",
             100270: "The size and number of the variables that you selected exceeds the maximum row size for feature service layer. Please reduce the number of selected variables.",
             100291: "Failed to publish analysis results as a feature collection because one of the output layers has more than 9,999 features. To keep all features, save your result as a feature layer."
             }


def reportLogAndMeteringInfo(beginTime):
    numObjects = inputLayerCount
    cost = numObjects * 0.002
    if bufferType:
        valueList = ["straightline", "DrivingTime",
                     "drivingdistance", "TruckingTime",
                     "truckingdistance", "WalkingTime",
                     "walkingdistance"]
        if bufferType.lower() in valueList:
            bufferTypeCount = valueList.index(bufferType.lower())
        else:
            bufferTypeCount = 7
    else:
        bufferTypeCount = -1
    if outputName.createService:
        returnType = 2
    else:
        returnType = 1

    values = [inputLayerCount, bufferTypeCount + 1, len(dataCollections), returnType]
    aolutils.LogUsageMetering(TASK_NAME, numObjects, cost, beginTime, values)
    return


def checkPrivileges(hostedgp, bufferType):
    # check privilege
    if aolutils.checkPrivilege(GE_PRIVILEGE, hostedgp):
        arcpy.AddMessage("geoenrich privilege check : OK")
    else:
        aolutils.AddErrorCode(100110, errorMsgs[100110])
        raise Exception

    # check NA privilege
    if (bufferType and bufferType.lower() != "straightline"):
        if aolutils.checkPrivilege(NA_PRIVILEGE, hostedgp):
            arcpy.AddMessage("Network analysis privilege check: OK")
        else:
            aolutils.AddErrorCode(100111, errorMsgs[100111])
            raise Exception


def getDrawingInfoFromOutputParam(outputParamJSON, originalFieldsFromService):
    '''gets drawing from outputJSON'''
    try:
        outputJSON = json.loads(outputParamJSON)
        layerProperties = outputJSON["layerProperties"][0]
        drawingInfo = layerProperties.get("drawingInfo")
        # generateChangedFields
        changedFields = {}
        for fieldName in originalFieldsFromService:
            newFieldName = arcpy.ValidateFieldName(fieldName, arcpy.env.scratchGDB)
            if (fieldName != newFieldName):
                changedFields[fieldName] = newFieldName
        #arcpy.AddMessage(changedFields)
        # remove labelingInfo to add default popups
        if "labelingInfo" in drawingInfo:
            labelingInfo = drawingInfo["labelingInfo"]
            showLabels = drawingInfo.get("showLabels")
            if showLabels is not None:
                drawingInfo.pop("showLabels")
            if not labelingInfo or showLabels is False:
                arcpy.AddMessage("removing labels")
                drawingInfo.pop("labelingInfo")
            elif changedFields:
                for labels in labelingInfo:
                    for fieldName, newFieldName in changedFields.items():
                        #update labelExpression
                        labelExpression = labels.get("labelExpression", "")
                        if labelExpression:
                            labels["labelExpression"] = labelExpression.replace(fieldName, newFieldName)
                        #update labelExpressionInfo
                        labelExpressionInfo = labels.get("labelExpressionInfo")
                        if labelExpressionInfo:
                            labelExprValue = labelExpressionInfo.get("value", "")
                            if labelExprValue:
                                labels["labelExpressionInfo"]["value"] = labelExprValue.replace(fieldName, newFieldName)
                            labelExpr = labelExpressionInfo.get("expression","")
                            if labelExpr:
                                labels["labelExpressionInfo"]["expression"] = labelExpr.replace(fieldName, newFieldName)
                        #update fieldInfos
                        fieldInfos = labels.get("fieldInfos", "")
                        for fieldInfo in fieldInfos:
                            fld_name = fieldInfo.get("fieldName", "")
                            fieldInfo["fieldName"] = fld_name.replace(fieldName, newFieldName)
        # update renderer fields in drawingInfo
        if changedFields:
            renderer = drawingInfo.get("renderer")
            r_type = renderer.get("type")
            fieldsToVerify = []
            if r_type.lower() == "uniquevalue":
                fieldsToVerify = ["field1", "field2", "field3"]
            elif r_type.lower() == "classbreaks":
                fieldsToVerify = ["field"]
            for rendererField in fieldsToVerify:
                # would have been easier to handle with changedFields
                # but, changedfields property is not honored with FSDB
                # just fixing most prevalent . and () characters for now
                # newFieldName = aolutils.updateChangedFieldNames(fieldName, changedFields)
                fieldName = renderer.get(rendererField)
                if fieldName and fieldName in changedFields:
                    renderer[rendererField] = changedFields[fieldName]
        #arcpy.AddMessage(drawingInfo)
        return drawingInfo
    except Exception as e:
        arcpy.AddMessage(str(e))
        return None


if __name__ == '__main__':

    hostedgp = None
    startTime = time.time()
    beginTime = startTime

    try:
        # Initialize context
        hostedgp = agolgp.HostedGP(9, 8)
        outputName = hostedgp.GetOutputName(8)

        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        # Get parameters
        # Input Layer
        bufferType = arcpy.GetParameterAsText(4)
        naservice_input = True if (bufferType and bufferType.lower() != "straightline") else False

        inputHostedLayer, inputLayerCount = aolutils.getHostedLayerX(hostedgp, "input layer", 0,
                                                                     use_as_soap_input=naservice_input)
        if not outputName.createService and inputLayerCount > 9999:
            aolutils.AddErrorCode(100291, errorMsgs[100291])
            raise arcpy.ExecuteError

        startTime = aolutils.AddTimerMessage(startTime, "Get input Layer")
        shapeType = inputHostedLayer.shapeType.replace("esriGeometry", "")
        desc = arcpy.Describe(inputHostedLayer.name)
        originalFieldsFromService = [field.name for field in desc.fields]

        dataCollections = arcpy.GetParameter(1) or []
        # arcpy.AddMessage("dc: {}".format(dataCollections))

        analysisVariables = arcpy.GetParameter(2) or []
        inputLayerFields = arcpy.Describe(inputHostedLayer.name).fields
        countOfFields = len(analysisVariables) + len(inputLayerFields) + 3
        if (countOfFields > MAX_COUNT_FIELDS):
            errorMsg = errorMsgs[100207].format(MAX_COUNT_FIELDS)
            params = {"maxCountOfFields": MAX_COUNT_FIELDS}
            aolutils.AddErrorCode(100207, errorMsg, params)
            raise Exception
        # arcpy.AddMessage("dc: {}".format(analysisVariables))

        srcCountry = arcpy.GetParameterAsText(3)
        distance = [arcpy.GetParameter(5)]
        units = arcpy.GetParameterAsText(6)
        if "Polygon" in shapeType:
            returnBoundaries = False
        else:
            returnBoundaries = arcpy.GetParameter(7)
        outputParamProp = arcpy.GetParameterAsText(8)
        paramsDict = {"inputLayer": {"count": inputLayerCount, "shapeType": shapeType},
                      "dataCollections": dataCollections,
                      "analysisVariables": analysisVariables,
                      "bufferType": bufferType,
                      "distance": distance[0],
                      "units": units}
        aolutils.checkForCredits(TASK_NAME, paramsDict)
        # output parameters

        # We'll set the output parameters later when the tool is successful.
        arcpy.SetParameterAsText(10, "")

        # check privileges
        # check geoenrichment and NA privileges
        checkPrivileges(hostedgp, bufferType)
        startTime = aolutils.AddTimerMessage(startTime, "Check privileges")

        lyr = inputHostedLayer.name
        lyrName = inputHostedLayer.layername or "inputLayer"
        shpType = inputHostedLayer.shapeType
        if "multipoint" in shpType.lower():
            wkspcPoints = aolutils.getOutputWkspc(inputLayerCount)
            lyr, msg = aolutils.convertMutiPointToSingleFeatures(lyr, lyrName,
                                                                 errorMsgs[100048],
                                                                 wkspcPoints)
            # append True for warning
            # msg.append(True)
            aolutils.AddErrorCode(*msg)
            shpType = "esriGeometryPoint"
        # get token, referer, service url
        service_url, token, referer = aolutils.gentoken(hostedgp, PORTAL_HELPER_SERVICES_KEY,
                                                        GEOENRICH_URL)
        lang_code = aolutils.get_user_culture()
        geoenrichParams = {"inputLayer": lyr,
                           "inputLayerShapeType": shpType,
                           "inputLayerCount": inputLayerCount,
                           "dataCollection": dataCollections,
                           "analysisVariables": analysisVariables,
                           "srcCountry": srcCountry,
                           "bufferType": bufferType,
                           "distance": distance,
                           "units": units,
                           "returnBoundaries": returnBoundaries,
                           "hostedgp": hostedgp,
                           "langcode": lang_code
                           }
        arcpy.AddMessage("langcode: {}".format(lang_code))
        geoenrichFeatures = GeoenrichmentCore.GeoEnrichFeatures(service_url, token, referer, **geoenrichParams)
        enrichedLayer = geoenrichFeatures.geoEnrich(startTime)
        descEnrichedLayer = arcpy.Describe(enrichedLayer)

        # Create renderer with temporary layer
        if returnBoundaries:
            drawingInfo = rendererUtils.getSimpleRendererInfo(descEnrichedLayer.shapeType)
        else:
            # https://devtopia.esri.com/WebGIS/arcgis-portal-app/issues/22367
            drawingInfo = None
            drawingInfo = getDrawingInfoFromOutputParam(outputParamProp, originalFieldsFromService)
            # arcpy.AddMessage(drawingInfo)
            if not drawingInfo:
                drawingInfo = rendererUtils.getSimpleRendererInfo(descEnrichedLayer.shapeType)

        # create output description
        outDesc = aolutils.getOutDescription("EnrichedLayer", 0, drawingInfo)
        startTime = aolutils.AddTimerMessage(startTime, "Create Layer Description")
        # create result
        aggResult = aolutils.HostedToolResult(outputName)
        aggResult.addHostedOutput(descEnrichedLayer, outDesc, 10)
        try:
            startTime = aggResult.generateHostedResult(hostedgp, startTime)
        except Exception as e:
            aolutils.AddErrorCode(100270, errorMsgs[100270])
            raise Exception

        # report tool and metering information
        reportLogAndMeteringInfo(beginTime)
        # report cost
        aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        # import traceback
        # import sys
        # msgs = traceback.format_exception(*sys.exc_info())[1:]
        # for msg in msgs:
        #     arcpy.AddMessage(msg.strip())
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()
            startTime = aolutils.AddTimerMessage(startTime, "Cleanup")
