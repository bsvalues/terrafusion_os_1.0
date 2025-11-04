"""-----------------------------------------------------------------------------
Name:              OptimalPathAsLine.py
Purpose:           Calculates the least-cost path from a source to a destination as a feature.
Author:            Esri Inc.
Created:           9/6/2019
Copyright:   (c)   Esri, Inc. 2019
ArcGIS Version:    10.7.1
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

TASK_NAME = 'OptimalPathAsLine'
ERROR_CODES = [120201]
errorMsgs = {
    120201: "A service already exists with this name. Please use a different name."
}

# Output feature layer description
outputLayerDesc = {"layers": [
    {"position":8,
     "catalogPath":"",
     "name": "PathPolyline",
     "id": 0,
     "properties":{
         "drawingInfo":"",
         "popupInfo":""
     }}
]}


def execute():
    """
    Parse parameters and execute service
    :return: result feature service layer
    """
    inputDestinationRasterOrFeatures = arcpy.GetParameterAsText(0)
    inputDistanceAccumulationRaster = arcpy.GetParameterAsText(1)
    inputBackDirectionRaster = arcpy.GetParameterAsText(2)
    outputPolylineName = arcpy.GetParameterAsText(3)
    destinationField = arcpy.GetParameterAsText(4)
    pathType = arcpy.GetParameterAsText(5)
    create_network_paths = arcpy.GetParameterAsText(6)
    # Environment setting
    context = arcpy.GetParameterAsText(7)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # Terminate the job if the output service created by this service tool exists
        if not rasterutils.checkIfJobShouldContinueWithOutputService(outputPolylineName, "featureService"):
            rasterutils.AddErrorCode(120201, errorMsgs[120201])
            raise Exception

        # 1. Parse the input parameters
        hostedgp = agolgp.HostedGP(7, 3)  # a description of the input / output data
        outputName = hostedgp.GetOutputName(3)
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        # For feature collection, use hostedgp
        if rasterutils.checkIfFeatureCollection(inputDestinationRasterOrFeatures):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputDestinationRasterOrFeatures", 0)
            inputDestinationRasterOrFeatures = Input.name
        # Now parsing the input raster
        else:
            inputDestinationRasterOrFeatures = rasterutils.getInDataPath(inputDestinationRasterOrFeatures)
            if inputDestinationRasterOrFeatures.find("/FeatureServer/") > -1 \
                    or inputDestinationRasterOrFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputDestinationRasterOrFeatures", 0)
                inputDestinationRasterOrFeatures = Input.name
            else:
                if isinstance(inputDestinationRasterOrFeatures, dict):
                    inputDestinationRasterOrFeatures = json.dumps(inputDestinationRasterOrFeatures)


        inputDistanceAccumulationRaster = rasterutils.getInDataPath(inputDistanceAccumulationRaster)
        if isinstance(inputDistanceAccumulationRaster, dict):
            inputDistanceAccumulationRaster = json.dumps(inputDistanceAccumulationRaster)

        inputBackDirectionRaster = rasterutils.getInDataPath(inputBackDirectionRaster)
        if isinstance(inputBackDirectionRaster, dict):
            inputBackDirectionRaster = json.dumps(inputBackDirectionRaster)

        # 2. Output parameter will be set later when the tool is successfully run
        arcpy.SetParameterAsText(8, "")
        # Get the output feature class location
        dsFcPath = aolutils.createOutputLocations(hostedgp, outputName)
        arcpy.AddMessage("output location {}".format(dsFcPath))
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        arcpy.env.overwriteOutput = 1

        # 3. Execute tool
        arcpy.AddMessage("Running Optimal Path As Line analysis...")
        arcpy.sa.OptimalPathAsLine(inputDestinationRasterOrFeatures, inputDistanceAccumulationRaster,
                                   inputBackDirectionRaster, dsFcPath, destinationField, pathType,
                                   create_network_paths)
        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))

        # 4. Create renderer, configure layer description
        # Add field and calculate Shape Area for renderer normalization
        # aolutils.createShapeAreaField(dsFcPath)

        # Creating drawing info
        desc = arcpy.Describe(dsFcPath)
        arcpy.AddMessage("Creating drawing info for output path feature layer.")
        drawingInfo = rendererUtils.getSimpleRendererInfo(desc.shapeType)
        #arcpy.AddMessage(drawingInfo)

        if drawingInfo is not None:
            outputLayerDesc["layers"][0]["properties"]["drawingInfo"] = drawingInfo

        # Update Layer description with catalog path
        outputLayerDesc["layers"][0]["catalogPath"] = dsFcPath

        arcpy.AddMessage("Create popup info for output path as line.")
        if rasterutils.RUN_ON_AGOL:
            filename = json.loads(outputPolylineName)["serviceProperties"]
        else:
            filename = json.loads(outputPolylineName)["serviceProperties"]["name"]
        r2f_popupInfo = popup.PopupInfo("Optimal Path As Line {}".format(filename), "")
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