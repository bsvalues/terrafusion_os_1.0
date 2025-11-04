"""-----------------------------------------------------------------------------
Name:              DetermineOptimumTravelCostNetwork.py
Purpose:           This service tool allows cost connectivity analysis
Author:            Esri Inc.
Created:           8/8/2017
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
import rendererUtils
import popup

TASK_NAME = 'DetermineOptimumTravelCostNetwork'
ERROR_CODES = [120201]
errorMsgs = {
    120201: "A service already exists with this name. Please use a different name."
}

# Output feature layer description
outputLayerDesc = {"layers": [
    {"position":5,
     "catalogPath":"",
     "name": "OptimumNetwork",
     "id": 0,
     "properties":{
         "drawingInfo":"",
         "popupInfo":""
     }}
]}

outputLayerDesc2 = {"layers": [
    {"position":6,
     "catalogPath":"",
     "name": "NeighborNetwork",
     "id": 1,
     "properties":{
         "drawingInfo":"",
         "popupInfo":""
     }}
]}

class LicenseError(Exception):
    pass

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
    inputRegionsRasterOrFeatures = arcpy.GetParameterAsText(0)
    inputCostRaster = arcpy.GetParameterAsText(1)
    outputOptimumNetworkName = arcpy.GetParameterAsText(2)
    outputNeighborNetworkName = arcpy.GetParameterAsText(3)
    # Environment setting
    context = arcpy.GetParameterAsText(4)

    try:
        # 0. Check Image Server extension license
        # if arcpy.CheckExtension("Image") != "Available":
        #     raise LicenseError

        # Terminate the job if the output service created by this service tool exists
        if not rasterutils.checkIfJobShouldContinueWithOutputService(outputOptimumNetworkName, "featureService"):
            rasterutils.AddErrorCode(120201, errorMsgs[120201])
            raise Exception
        if ifNotEmpty(outputNeighborNetworkName):
            if not rasterutils.checkIfJobShouldContinueWithOutputService(outputNeighborNetworkName, "featureService"):
                rasterutils.AddErrorCode(120201, errorMsgs[120201])
                raise Exception

        # 1. Parse the input parameters
        hostedgp = agolgp.HostedGP(4, 2)  # a description of the input / output data
        outputName = hostedgp.GetOutputName(2)
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        if ifNotEmpty(outputNeighborNetworkName):
            hostedgp2 = agolgp.HostedGP(4, 3)  # a description of the input / output data
            outputName2 = hostedgp2.GetOutputName(3)
            aolutils.checkPublishingPrivilege(hostedgp2, outputName2)

        # Parse the input source raster or features
        # For feature collection, use hostedgp
        if rasterutils.checkIfFeatureCollection(inputRegionsRasterOrFeatures):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputRegionsRasterOrFeatures", 0)
            inputRegionsRasterOrFeatures = Input.name
        # Now parsing the input raster
        else:
            inputRegionsRasterOrFeatures = rasterutils.getInDataPath(inputRegionsRasterOrFeatures)
            if inputRegionsRasterOrFeatures.find("/FeatureServer/") > -1 \
                    or inputRegionsRasterOrFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputRegionsRasterOrFeatures", 0)
                inputRegionsRasterOrFeatures = Input.name
            else:
                if isinstance(inputRegionsRasterOrFeatures, dict):
                    inputRegionsRasterOrFeatures = json.dumps(inputRegionsRasterOrFeatures)


        inputCostRaster = rasterutils.getInDataPath(inputCostRaster)
        if isinstance(inputCostRaster, dict):
            inputCostRaster = json.dumps(inputCostRaster)

        # 2. Set GP environment settings
        # Set output extent
        moreags = rasterutils._parsecontext(context)
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        # Test purpose: overwrite enable
        arcpy.env.overwriteOutput = 1

        # Output parameter (will be set later when the tool is successful)
        arcpy.SetParameterAsText(5, "")
        if ifNotEmpty(outputNeighborNetworkName):
            arcpy.SetParameterAsText(6, "")

        # Now need to get the output feature class location
        dsFcPath = aolutils.createOutputLocations(hostedgp, outputName)
        arcpy.AddMessage("output location {}".format(dsFcPath))
        dsFcPath2 = ""
        if ifNotEmpty(outputNeighborNetworkName):
            dsFcPath2 = aolutils.createOutputLocations(hostedgp, outputName2)
            arcpy.AddMessage("output location2 {}".format(dsFcPath2))

        # 3. Execute tool based on output type
        arcpy.AddMessage("Running Optimal Region Connection analysis...")
        result = arcpy.gp.OptimalRegionConnections_sa(inputRegionsRasterOrFeatures,
                                                      dsFcPath,
                                                      None,
                                                      inputCostRaster,
                                                      dsFcPath2)
        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))
        # 4. Create renderer, configure layer description
        # Add field and calculate Shape Area for renderer normalization
        # aolutils.createShapeAreaField(dsFcPath)

        # Creating drawing info
        desc = arcpy.Describe(dsFcPath)
        arcpy.AddMessage("Creating drawing info for output optimum network layer.")
        drawingInfo = rendererUtils.getSimpleRendererInfo(desc.shapeType)
        #arcpy.AddMessage(drawingInfo)

        if drawingInfo is not None:
            outputLayerDesc["layers"][0]["properties"]["drawingInfo"] = drawingInfo

        # Update Layer description with catalog path
        outputLayerDesc["layers"][0]["catalogPath"] = dsFcPath

        arcpy.AddMessage("Create popup info for output optimum network layer.")
        if rasterutils.RUN_ON_AGOL:
            filename = json.loads(outputOptimumNetworkName)["serviceProperties"]
        else:
            filename = json.loads(outputOptimumNetworkName)["serviceProperties"]["name"]
        r2f_popupInfo = popup.PopupInfo("Determine Optimum Travel Cost Network {}".format(filename), "")
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

        if ifNotEmpty(outputNeighborNetworkName):
            # Creating drawing info
            desc2 = arcpy.Describe(dsFcPath2)
            arcpy.AddMessage("Creating drawing info for output neighbor network feature layer.")
            drawingInfo2 = rendererUtils.getSimpleRendererInfo(desc2.shapeType, TASK_NAME)
            #arcpy.AddMessage(drawingInfo)

            if drawingInfo2 is not None:
                outputLayerDesc2["layers"][0]["properties"]["drawingInfo"] = drawingInfo2

            # Update Layer description with catalog path
            outputLayerDesc2["layers"][0]["catalogPath"] = dsFcPath2

            arcpy.AddMessage("Create popup info for output neighbor network feature layer.")
            if rasterutils.RUN_ON_AGOL:
                filename2 = json.loads(outputNeighborNetworkName)["serviceProperties"]
            else:
                filename2 = json.loads(outputNeighborNetworkName)["serviceProperties"]["name"]
            r2f_popupInfo = popup.PopupInfo("Determine Optimum Travel Cost Network {}".format(filename2), "")
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

    except LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)

if __name__ == '__main__':
    execute()