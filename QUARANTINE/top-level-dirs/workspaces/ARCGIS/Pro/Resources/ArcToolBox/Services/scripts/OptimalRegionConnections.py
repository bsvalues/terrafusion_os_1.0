"""-----------------------------------------------------------------------------
Name:              OptimalRegionConnections.py
Purpose:           Calculates the optimal connectivity network between two or more input regions.
Author:            Esri Inc.
Created:           9/17/2019
Copyright:   (c)   Esri, Inc. 2019
ArcGIS Version:    10.8
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
import rendererUtils
import popup

TASK_NAME = 'OptimalRegionConnections'
ERROR_CODES = [120201]
errorMsgs = {
    120201: "A service already exists with this name. Please use a different name."
}

# Output feature layer description
outputLayerDesc = {"layers": [
    {"position":8,
     "catalogPath":"",
     "name": "OptimalLines",
     "id": 0,
     "properties":{
         "drawingInfo":"",
         "popupInfo":""
     }}
]}

outputLayerDesc2 = {"layers": [
    {"position":9,
     "catalogPath":"",
     "name": "NeighborConnections",
     "id": 1,
     "properties":{
         "drawingInfo":"",
         "popupInfo":""
     }}
]}


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
    inputRegionRasterOrFeatures = arcpy.GetParameterAsText(0)
    outputOptimalLinesName = arcpy.GetParameterAsText(1)
    inputBarrierRasterOrFeatures = arcpy.GetParameterAsText(2)
    inputCostRaster = arcpy.GetParameterAsText(3)
    outputNeighborConnectionsName = arcpy.GetParameterAsText(4)
    distanceMethod = arcpy.GetParameterAsText(5)
    connectionsWithinRegions = arcpy.GetParameterAsText(6)
    # Environment setting
    context = arcpy.GetParameterAsText(7)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # Terminate the job if the output service created by this service tool exists
        if not rasterutils.checkIfJobShouldContinueWithOutputService(outputOptimalLinesName, "featureService"):
            rasterutils.AddErrorCode(120201, errorMsgs[120201])
            raise Exception
        if ifNotEmpty(outputNeighborConnectionsName):
            if not rasterutils.checkIfJobShouldContinueWithOutputService(outputNeighborConnectionsName, "featureService"):
                rasterutils.AddErrorCode(120201, errorMsgs[120201])
                raise Exception

        # 1. Parse the input parameters
        hostedgp = agolgp.HostedGP(7, 1)
        outputName = hostedgp.GetOutputName(1)
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        if ifNotEmpty(outputNeighborConnectionsName):
            hostedgp2 = agolgp.HostedGP(7, 4)
            outputName2 = hostedgp2.GetOutputName(4)
            aolutils.checkPublishingPrivilege(hostedgp2, outputName2)

        # For feature collection, use hostedgp
        if rasterutils.checkIfFeatureCollection(inputRegionRasterOrFeatures):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputRegionRasterOrFeatures", 0)
            inputRegionRasterOrFeatures = Input.name
        # Now parsing the input raster
        else:
            inputRegionRasterOrFeatures = rasterutils.getInDataPath(inputRegionRasterOrFeatures)
            if inputRegionRasterOrFeatures.find("/FeatureServer/") > -1 \
                    or inputRegionRasterOrFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputRegionRasterOrFeatures", 0)
                inputRegionRasterOrFeatures = Input.name
            else:
                if isinstance(inputRegionRasterOrFeatures, dict):
                    inputRegionRasterOrFeatures = json.dumps(inputRegionRasterOrFeatures)

        if rasterutils.checkIfFeatureCollection(inputBarrierRasterOrFeatures):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputBarrierRasterOrFeatures", 2)
            inputBarrierRasterOrFeatures = Input.name
        else:
            # inputBarrierRasterOrFeatures = rasterutils.getInDataPath(inputBarrierRasterOrFeatures)
            # if isinstance(inputBarrierRasterOrFeatures, dict):
            #     inputBarrierRasterOrFeatures = json.dumps(inputBarrierRasterOrFeatures)
            inputBarrierRasterOrFeatures = rasterutils.getInDataPath(inputBarrierRasterOrFeatures)
            if inputBarrierRasterOrFeatures.find("/FeatureServer/") > -1 \
                    or inputBarrierRasterOrFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputBarrierRasterOrFeatures", 2)
                inputBarrierRasterOrFeatures = Input.name
                layerPath = arcpy.Describe(inputBarrierRasterOrFeatures).catalogPath
            else:
                if isinstance(inputBarrierRasterOrFeatures, dict):
                    inputBarrierRasterOrFeatures = json.dumps(inputBarrierRasterOrFeatures)

        inputCostRaster = rasterutils.getInDataPath(inputCostRaster)
        if isinstance(inputCostRaster, dict):
            inputCostRaster = json.dumps(inputCostRaster)

        # 2. Set GP environment settings
        moreags = rasterutils._parsecontext(context)
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        arcpy.env.mask = rasterutils.getMask(context)
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.overwriteOutput = 1

        # Output parameter (will be set later when the tool is successful)
        arcpy.SetParameterAsText(8, "")
        if ifNotEmpty(outputOptimalLinesName):
            arcpy.SetParameterAsText(9, "")

        # Now need to get the output feature class location
        dsFcPath = aolutils.createOutputLocations(hostedgp, outputName)
        arcpy.AddMessage("Output Optimal Lines location {}".format(dsFcPath))
        dsFcPath2 = ""
        if ifNotEmpty(outputNeighborConnectionsName):
            dsFcPath2 = aolutils.createOutputLocations(hostedgp2, outputName2)
            arcpy.AddMessage("Output Neighbor Connections location {}".format(dsFcPath2))

        # 3. Execute tool based on output type
        arcpy.AddMessage("Running Optimal Region Connections analysis...")
        result = arcpy.sa.OptimalRegionConnections(inputRegionRasterOrFeatures, dsFcPath,
                                                   inputBarrierRasterOrFeatures, inputCostRaster,
                                                   dsFcPath2, distanceMethod, connectionsWithinRegions)

        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))
        # 4. Create renderer, configure layer description
        # Add field and calculate Shape Area for renderer normalization
        # aolutils.createShapeAreaField(dsFcPath)

        # Creating drawing info
        desc = arcpy.Describe(dsFcPath)
        arcpy.AddMessage("Creating drawing info for output optimal lines layer.")
        drawingInfo = rendererUtils.getSimpleRendererInfo(desc.shapeType)
        #arcpy.AddMessage(drawingInfo)

        if drawingInfo is not None:
            outputLayerDesc["layers"][0]["properties"]["drawingInfo"] = drawingInfo

        # Update Layer description with catalog path
        outputLayerDesc["layers"][0]["catalogPath"] = dsFcPath

        arcpy.AddMessage("Create popup info for output optimal lines layer.")
        if rasterutils.RUN_ON_AGOL:
            filename = json.loads(outputOptimalLinesName)["serviceProperties"]
        else:
            filename = json.loads(outputOptimalLinesName)["serviceProperties"]["name"]
        r2f_popupInfo = popup.PopupInfo("Optimal Region Connections {}".format(filename), "")
        r2f_popupInfo.addFieldInfo("Feature_Count", "Count of Feature")
        toOmitFieldNames = ["feature_count", desc.OIDFieldName.lower(), desc.ShapeFieldName.lower()]
        # Add all other fields
        for field in desc.fields:
            if field.name.lower() not in toOmitFieldNames:
                label = field.aliasName.replace("_", " ").title()
                if field.type.lower() == "double":
                    r2f_popupInfo.addFieldInfo(field.name, label, True)
                else:
                    r2f_popupInfo.addFieldInfo(field.name, label)
        outputLayerDesc["layers"][0]["properties"]["popupInfo"] = r2f_popupInfo.getPopupInfo()

        hostedgp.ProcessFeatureOutput(json.dumps(outputLayerDesc, skipkeys=False, ensure_ascii=False))

        if ifNotEmpty(outputNeighborConnectionsName):
            # Creating drawing info
            desc2 = arcpy.Describe(dsFcPath2)
            arcpy.AddMessage("Creating drawing info for output neighbor connections feature layer.")
            drawingInfo2 = rendererUtils.getSimpleRendererInfo(desc2.shapeType, TASK_NAME)
            #arcpy.AddMessage(drawingInfo)

            if drawingInfo2 is not None:
                outputLayerDesc2["layers"][0]["properties"]["drawingInfo"] = drawingInfo2

            # Update Layer description with catalog path
            outputLayerDesc2["layers"][0]["catalogPath"] = dsFcPath2

            arcpy.AddMessage("Create popup info for output neighbor connections feature layer.")
            if rasterutils.RUN_ON_AGOL:
                filename2 = json.loads(outputNeighborConnectionsName)["serviceProperties"]
            else:
                filename2 = json.loads(outputNeighborConnectionsName)["serviceProperties"]["name"]
            r2f_popupInfo = popup.PopupInfo("Optimal Region Connections {}".format(filename2), "")
            r2f_popupInfo.addFieldInfo("Feature_Count", "Count of Feature")
            toOmitFieldNames = ["feature_count", desc2.OIDFieldName.lower(), desc2.ShapeFieldName.lower()]
            # Add all other fields
            for field in desc2.fields:
                if field.name.lower() not in toOmitFieldNames:
                    label = field.aliasName.replace("_", " ").title()
                    if field.type.lower() == "double":
                        r2f_popupInfo.addFieldInfo(field.name, label, True)
                    else:
                        r2f_popupInfo.addFieldInfo(field.name, label)
            outputLayerDesc2["layers"][0]["properties"]["popupInfo"] = r2f_popupInfo.getPopupInfo()

            hostedgp2.ProcessFeatureOutput(json.dumps(outputLayerDesc2, skipkeys=False, ensure_ascii=False))

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