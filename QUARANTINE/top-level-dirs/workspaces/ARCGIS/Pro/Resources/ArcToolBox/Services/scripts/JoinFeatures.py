"""---------------------------------------------------------------------------
Name:              JoinFeatures.py
Purpose:           join features
Author:            Esri Inc.
Created:           2/19/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.5
---------------------------------------------------------------------------"""
from __future__ import unicode_literals

# core libraries
import time
import os

# internal libraries
import arcpy
import hostedgp as agolgp
import aolutils
import rendererUtils
import json
# import debugUtils
import JoinFeaturesCore
import summarytoolutils
import analysisutils


# constants
TASK_NAME = u'JoinFeatures'
ERROR_CODES = [728, 100219, 100220, 100221, 100222, 100243, 100052, 100053, 100245,
               100004, 100005, 100006, 100244, 100044]

errorMsgs = {
    100219: "Invalid input for parameter {paramName}.",
    100220: "The geometry type {geomType} for {paramName} is not supported for spatial relationship: {spatialRel}.",
    100221: "Attribute or Spatial Relationship must be specified.",
    100222: "Spatial relationship is not supported for table inputs.",
    100052: "The field name {fieldName} does not exist in the {paramName}",
    100053: "Required keys {} are missing in attribute expression {}",
    100004: "The field {} provided for Summary Fields does not exist.",
    100005: "The field {} provided for Summary Fields is not numeric or date.",
    100006: "The Summary type {} provided for field {} is invalid.",
    100244: "Distance and units are required for SpatialRelationship WithinDistance.",
    100245: "Invalid expression for {paramName}, malformed JSON",
    100044: "Distance value should be greater than 0."
}


def verifyInputs(params, targetLayerName, joinLayerName):

    if not (params.get("attributeRel") or params.get("spatialRel")):
        aolutils.AddErrorCode(100221, errorMsgs[100221])
        return False
    if params.get("spatialRel", "") == "withindistance":
        if not (params["spatialRelDistance"] and params["spatialRelUnits"]):
            aolutils.AddErrorCode(100244, errorMsgs[100244])
            return False
        if params["spatialRelDistance"] < 0:
            aolutils.AddErrorCode(100044, errorMsgs[100044])
            return False
    descJoinLayer = None
    if params.get("summaryFields"):
        descJoinLayer = arcpy.Describe(params["joinLayer"])
        fieldList = descJoinLayer.fields
        returnMsgs = summarytoolutils.verifySummaryFields(fieldList, params["summaryFields"], errorMsgs)
        # arcpy.AddMessage(returnMsgs)
        if returnMsgs:
            for errMsg in returnMsgs:
                aolutils.AddErrorCode(*errMsg)
            return False
    if params.get("attributeRel", None):
        if not descJoinLayer:
            descJoinLayer = arcpy.Describe(params["joinLayer"])
        descTargetLayer = arcpy.Describe(params["targetLayer"])
        joinLayerFields = descJoinLayer.fields
        targetLayerFields = descTargetLayer.fields
        currAttrRel = ""
        try:
            for attrRel in params["attributeRel"]:
                currAttrRel = attrRel
                targetField = attrRel["targetField"]
                joinField = attrRel["joinField"]
                if not (aolutils.verifyFieldExists("", targetField, targetLayerFields)):
                    paramsDict = {"fieldName": targetField,
                                  "paramName": targetLayerName}
                    errMsg = errorMsgs[100052].format(**paramsDict)
                    aolutils.AddErrorCode(100052, errMsg, paramsDict)
                    return False
                if not (aolutils.verifyFieldExists("", joinField, joinLayerFields)):
                    paramsDict = {"fieldName": joinField,
                                  "paramName": joinLayerName}
                    errMsg = errorMsgs[100052].format(**paramsDict)
                    aolutils.AddErrorCode(100052, errMsg, paramsDict)
                    return False

        except KeyError as e:
            errMsg = errorMsgs[100053].format(e, currAttrRel)
            paramsDict = {"missingKeys": str(e), "expression": currAttrRel}
            aolutils.AddErrorCode(100053, errMsg, paramsDict)
            return False
        except Exception as e:
            # arcpy.AddMessage(str(e))
            paramsDict = {"paramName": "attributeRelationship"}
            errMsg = errorMsgs[100245].format(**paramsDict)
            aolutils.AddErrorCode(100245, errorMsgs[100245], paramsDict)
            return False
    return True


def _replace_globalid_field(layer):
    """Replace the globalid field (create a new field with the same name but with type of Guid).

    Args:
        layer: name of the feature layer.
    Returns:
        No returns.

    """
    fields = arcpy.Describe(layer).fields
    for field in fields:
        if field.type.lower() == "globalid":
            # replace the current globalID field with another field with the same name but field type as String.
            tmp_field_name = "tmp_{}".format(field.name)
            field_type = "Guid"
            (tmp_field_name, tmp_field_alias) = analysisutils.createUniqueFieldName("", tmp_field_name, tmp_field_name,
                                                                                    fields)
            arcpy.AddField_management(layer, tmp_field_name, field_type, "", "", "")
            expression = '!{}!'.format(field.name)
            arcpy.CalculateField_management(layer, tmp_field_name, expression, 'PYTHON')

            arcpy.DeleteField_management(layer, [field.name])
            arcpy.AlterField_management(layer, tmp_field_name, field.name, field.name)


def process_globalid_field(layer, shape_type, params, layer_param_name):
    """Due to the change of globalid field in AO11 which makes the join with globalid failed, this function is going
    to replace the globalid field to other types (i.e., Guid).

    Args:
        layer: name of the feature layer.
        shape_type: geometry type of the layer.
        params: a dictionary of parameters to feed the core function.
    Returns:
        No returns.
    Raises:
        No exceptions.

    """
    arcpy.env.preserveGlobalIds = True
    tmp_layer = os.path.join(arcpy.env.scratchGDB, layer_param_name)
    # had to copy features for portal to maintain field order, remove in online
    if shape_type:
        arcpy.CopyFeatures_management(layer, tmp_layer)
        _replace_globalid_field(tmp_layer)

        params[layer_param_name] = layer_param_name
        arcpy.MakeFeatureLayer_management(tmp_layer, params[layer_param_name])
    else:
        arcpy.CopyRows_management(layer, tmp_layer)
        _replace_globalid_field(tmp_layer)
        params[layer_param_name] = tmp_layer


if __name__ == '__main__':

    hostedgp = None
    # Initiate start time
    startTime = time.time()
    beginTime = startTime

    try:
        hostedgp = agolgp.HostedGP(10, 9)
        startTime = aolutils.AddTimerMessage(startTime, "Init hosted gp")
        outputName = hostedgp.GetOutputName(9)
        startTime = aolutils.AddTimerMessage(startTime, "Get output name")

        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)
        startTime = aolutils.AddTimerMessage(startTime, "Check privilege")

        costFactor = 0.001
        return_type = 1

        # aolutils.DebugExtent()

        params = {}
        # Input parameters
        target, targetLayerCount = aolutils.getHostedLayerX(hostedgp, "target layer", 0)
        targetLayer = target.name
        # params["targetLayer"] = targetLayer
        # arcpy.AddMessage(arcpy.Describe(InputLayer).OIDFieldName)

        targetShapeType = target.shapeType
        # target.shapetype always returns none for GPRecordSet
        descTargetLayer = arcpy.Describe(targetLayer)
        targetShapeType = getattr(descTargetLayer, "shapeType", None)
        arcpy.AddMessage("shapeType :{}".format(targetShapeType))
        targetLayerName = target.layername or "Target Features"
        targetChangedFields = target.changedFieldNames
        # If LAAL layers, do not copy since they are already GDB
        if target.esriLayerCatalogPath:
            params["targetLayer"] = targetLayer
            arcpy.AddMessage(target.esriLayerCatalogPath)
        else:
            process_globalid_field(target.name, targetShapeType, params, "targetLayer")

        # Fix the issue of LAAL does not honor the extent.
        if targetShapeType:
            aolutils.selectFeaturesbyExtent(params["targetLayer"])
            targetLayerCount = int(arcpy.management.GetCount(params["targetLayer"]).getOutput(0))
            arcpy.AddMessage("targetLayerCount: {}".format(targetLayerCount))

            if targetLayerCount==0:
                layer_name = "target layer" if target.layername == "" else target.layername
                errMsg = "The number of features in {} is zero.".format(layer_name)
                aolutils.AddErrorCode('100032', errMsg, {"analysisLayer": layer_name})
                raise arcpy.ExecuteError

        join, joinLayerCount = aolutils.getHostedLayerX(hostedgp, "join layer", 1)

        joinLayer = join.name
        # arcpy.AddMessage(arcpy.Describe(InputLayer).OIDFieldName)
        joinLayerName = join.layername or "Join Features"
        joinShapeType = join.shapeType
        descJoinLayer = arcpy.Describe(joinLayer)
        joinShapeType = getattr(descJoinLayer, "shapeType", None)
        joinLayer = os.path.join(arcpy.env.scratchGDB, "joinLayer")

        process_globalid_field(join.name, joinShapeType, params, "joinLayer")
        if joinShapeType:
            aolutils.selectFeaturesbyExtent(params["joinLayer"])
            joinLayerCount = int(arcpy.management.GetCount(params["joinLayer"]).getOutput(0))
            arcpy.AddMessage("joinLayerCount: {}".format(joinLayerCount))

            if joinLayerCount==0:
                layer_name = "join layer" if join.layername == "" else join.layername
                errMsg = "The number of features in {} is zero.".format(layer_name)
                aolutils.AddErrorCode('100032', errMsg, {"analysisLayer": layer_name})
                raise arcpy.ExecuteError

        paramsDict = {"targetLayer": {"count": targetLayerCount, "shapeType": targetShapeType},
                      "joinLayer": {"count": joinLayerCount, "shapeType": joinShapeType}}
        # check credits balance
        aolutils.checkForCredits(TASK_NAME, paramsDict)

        joinChangedFields = join.changedFieldNames
        # params["joinLayer"] = joinLayer

        # desc = arcpy.Describe(InputLayer)
        # arcpy.AddMessage("Input Layer Path: {}".format(desc.catalogPath))

        startTime = aolutils.AddTimerMessage(startTime, "Get Input Layers")
        arcpy.env.extent = None

        spatialRelationship = arcpy.GetParameterAsText(2) or None
        if spatialRelationship:
            params["spatialRel"] = spatialRelationship
            if not (joinShapeType and targetShapeType):
                aolutils.AddErrorCode(100222, errorMsgs[100222])
                raise arcpy.ExecuteError
            if spatialRelationship == "withindistance":
                spatialRelDistance = arcpy.GetParameter(3)
                spatialRelUnits = arcpy.GetParameterAsText(4)
            else:
                spatialRelDistance = None
                spatialRelUnits = None
            params["spatialRelDistance"] = spatialRelDistance
            params["spatialRelUnits"] = spatialRelUnits
            # arcpy.AddMessage(params["spatialRelUnits"])

        attributeRelationships = arcpy.GetParameter(5) or None
        # arcpy.AddMessage(attributeRelationships)
        updatedAttrRel = []
        if attributeRelationships:
            for attrRel in attributeRelationships:
                try:
                    updatedAttrRel.append(json.loads(attrRel))
                except:
                    paramsDict = {"paramName": "attributeRelationship"}
                    errMsg = errorMsgs[100245].format(**paramsDict)
                    aolutils.AddErrorCode(100245, errMsg, paramsDict)
                    raise Exception
        if updatedAttrRel:
            params["attributeRel"] = updatedAttrRel
            # arcpy.AddMessage(params["attributeRel"])
        else:
            params["attributeRel"] = None

        joinOperation = arcpy.GetParameterAsText(6)
        arcpy.AddMessage(joinOperation)
        operationVals = {"JoinOneToMany": "JOIN_ONE_TO_MANY",
                         "JoinOneToOne": "JOIN_ONE_TO_ONE"}
        params["joinOperation"] = operationVals[joinOperation]

        summaryFields = arcpy.GetParameter(7) or None
        # arcpy.AddMessage(summaryFields)
        try:
            updatedSummFields = aolutils.convertSummaryFieldstoArray(summaryFields)
        except:
            paramsDict = {"paramName": "summaryFields"}
            errMsg = errorMsgs[100245].format(**paramsDict)
            aolutils.AddErrorCode(100245, errMsg, paramsDict)
            raise Exception

        params["summaryFields"] = updatedSummFields
        arcpy.AddMessage("updatedFields :{}".format(updatedSummFields))

        # Add recordToMatch parameter
        recordToMatch = arcpy.GetParameterAsText(8) or None
        params["recordToMatch"] = recordToMatch

        # Output parameter (will be set later when the tool is successful)
        arcpy.SetParameterAsText(11, "")

        # Get cloud output paths
        wkspc = aolutils.getOutputWkspc(targetLayerCount)
        params["wkspc"] = wkspc
        joinOutput = os.path.join(wkspc, "joinOutput")
        params["joinOutput"] = joinOutput

        arcpy.AddMessage(u"Output features: {}".format(joinOutput))

        # Execute tool
        startTime = aolutils.AddTimerMessage(startTime, "Get Other params")

        if not verifyInputs(params, targetLayerName, joinLayerName):
            raise Exception("Verify Inputs Failed")
        startTime = aolutils.AddTimerMessage(startTime, "VerifyInputs")

        # Run join features
        if params["attributeRel"]:
            arcpy.AddMessage("AttributeJoin")
            JoinFeaturesCore.AttributeJoinFeatures(params).attributeJoin()
        else:
            arcpy.AddMessage("SpatialJoin")
            JoinFeaturesCore.SpatialJoinFeatures(params).spatialJoin()
        startTime = aolutils.AddTimerMessage(startTime, "Join Features Core")

        if outputName.createService:
            return_type = 2

        lyrname = "JoinedOutput"
        res = aolutils.HostedToolResult(outputName)
        if targetShapeType:
            # 2. Create drawing Info
            drawingInfo = rendererUtils.getSimpleRendererInfo(targetShapeType.lstrip("esriGeometry"))
            # arcpy.AddMessage(json.dumps(drawingInfo))
        else:
            drawingInfo = None
        outDesc = aolutils.getOutDescription(lyrname, 0, drawingInfo)
        startTime = aolutils.AddTimerMessage(startTime, "Get Drawing Info")
        # arcpy.AddMessage(target.shapeType.lstrip("esriGeometry"))

        # 3. Create result
        # arcpy.AddMessage(outDesc)
        descJoinOutput = arcpy.Describe(joinOutput)
        res.addHostedOutput(descJoinOutput, outDesc, 11)
        startTime = res.generateHostedResult(hostedgp, startTime)

        aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()
            startTime = aolutils.AddTimerMessage(startTime, "Cleanup")
# End JoinFeatures.py
