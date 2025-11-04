from __future__ import unicode_literals
import json
import os
import time
import arcpy
import aolutils
import hostedgp as agolgp
import debugUtils
import rendererUtils
from findlocationscore import LocationUtils

# Constant variables
TASK_NAME = u"FindExistingLocations"
REQD_TOOLBOXES = "Workflows.tbx"
ERROR_CODES = [100053, 100054, 100055, 100056, 100057, 100058,
               100059, 100060, 100049, 100024, 100262]

# End of constants


def reportLogAndMeteringInfo(beginTime):

    layerCount = len(inputHostedLayers)
    totalCnt = 0
    for cnt in inputLayersCount:
        totalCnt = totalCnt + cnt

    numObjects = totalCnt
    cost = numObjects * 0.001
    values = [layerCount, totalCnt]
    aolutils.LogUsageMetering(TASK_NAME, numObjects, cost, beginTime, values)
    return


def verifyZeroFeatures(inputLayersName, inputLayersCount):
    ''' verifies the number of features in inputLayers'''
    totalCnt = 0
    for cnt in inputLayersCount:
        totalCnt = totalCnt + cnt
    if totalCnt == 0:
        aolutils.AddErrorCode(100049, 'No features in the processing extent for any input Layer.')
    else:
        for index, cnt in enumerate(inputLayersCount):
            if cnt == 0:
                lyrName = inputLayersName[index]
                if len(lyrName) == 0:
                    lyrName = "feature collection at position {}".format(index + 1)
                errMsg = "There are no features provided for analysis in {}.".format(lyrName)
                aolutils.AddErrorCode(100024, errMsg, {'inputLayer': lyrName}, warning=True)


def updateChangedFields(expressionList, changedFieldsList):
    """Update change Fields in expression."""
    # arcpy.AddMessage("In updateChangedFields")
    for currExpression in expressionList:
        if isinstance(currExpression, list):
            updateChangedFields(currExpression, changedFieldsList)
        else:
            whereExpr = currExpression.get("where")
            if whereExpr:
                layerIndex = currExpression.get("layer")  
                changedFields = changedFieldsList[layerIndex]
                if len(changedFields) > 0:
                    whereExprSplit = whereExpr.split(" ")
                    fieldName = whereExprSplit[0]
                    fieldName = aolutils.updateChangedFieldNames(fieldName, changedFields)
                    whereExprSplit[0] = fieldName
                    currExpression["where"] = " ".join(whereExprSplit)
                    arcpy.AddMessage(currExpression["where"])
    return


def findExistingLocations(startTime, shapeType):
    """Find existing locations."""
    raw_expression = json.dumps(expressions, ensure_ascii=False)
    arcpy.AddMessage('arcpy.env.extent: {}'.format(arcpy.env.extent))
    LocationUtils(inputLayers, raw_expression, resultLayer).find_existing_locations()
    startTime = aolutils.AddTimerMessage(startTime, "FindExistingLocations tool")

    descResultLayer = arcpy.Describe(resultLayer)
    # Create renderer with temporary layer
    drawingInfo = rendererUtils.getSimpleRendererInfo(shapeType)
    startTime = aolutils.AddTimerMessage(startTime, "Create drawingInfo")

    layerOutDesc = aolutils.getOutDescription("ResultLocations", 0, drawingInfo)

    toolResult = aolutils.HostedToolResult(outputName)
    toolResult.addHostedOutput(descResultLayer, layerOutDesc, 4)
    toolResult.generateHostedResult(hostedgp, startTime)

    return startTime


# run the script
if __name__ == '__main__':

    hostedgp = None
    startTime = time.time()
    beginTime = startTime

    try:
        # Initialize
        hostedgp = agolgp.HostedGP(3, 2)
        outputName = hostedgp.GetOutputName(2)
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        # Get parameters
        startTime = aolutils.AddTimerMessage(startTime, "Get Input Layers")
        (inputHostedLayers, inputLayersCount) = aolutils.getHostedLayers(hostedgp, "inputLayers", 0, False,
                                                                         verify_count=False)
        inputLayers = []
        layersForCost = []
        inputLayersName = []
        changedFields = []
        for hgp_layer, count in zip(inputHostedLayers, inputLayersCount):
            inputLayers.append(hgp_layer.name)
            layersForCost.append({"count": count, "shapeType": hgp_layer.shapeType})
            inputLayersName.append(hgp_layer.layername)
            changedFields.append(hgp_layer.changedFieldNames)

        arcpy.AddMessage("input changedFieldName : {}".format(changedFields))

        expressions = arcpy.GetParameterAsText(1)
        paramsDict = {"inputLayers": layersForCost, "expressions": expressions}
        aolutils.checkForCredits(TASK_NAME, paramsDict)

        startTime = aolutils.AddTimerMessage(startTime, "Get Input Layers")

        # verify zero features
        verifyZeroFeatures(inputLayersName, inputLayersCount)

        # get shapeType for symbology
        shapeType = inputHostedLayers[0].shapeType

        try:
            expressions = json.loads(expressions)
        except:
            # aolutils.AddErrorCode()
            errMsg = "Invalid expression, malformed JSON"
            aolutils.AddErrorCode(100055, errMsg)
            raise arcpy.ExecuteError

        # update changedFields
        updateChangedFields(expressions, changedFields)

        # We'll set the output parameters later when the tool is successful.
        arcpy.SetParameterAsText(4, "")

        # Set Environment for temporary Output
        wkspc = aolutils.getOutputWkspc(inputLayersCount[0])
        resultLayer = os.path.join(wkspc, "resultLayer")

        # process parameters
        startTime = findExistingLocations(startTime, shapeType)

        # report tool and metering information
        reportLogAndMeteringInfo(beginTime)
        # report cost
        aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)

        del inputHostedLayers
    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()
            startTime = aolutils.AddTimerMessage(startTime, "Cleanup")
