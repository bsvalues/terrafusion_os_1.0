"""-----------------------------------------------------------------------------
Name:              DetermineTravelCostPathAsPolyline.py
Purpose:           This service tool allows cost distance and cost path as polyline analysis
Author:            Esri Inc.
Created:           3/22/2018
Copyright:   (c)   Esri, Inc. 2018
ArcGIS Version:    10.6.1
-----------------------------------------------------------------------------"""
# core libraries
import json
import os
import uuid
import time

# internal libraries
import arcpy
import hostedgp as agolgp
import aolutils
import rasterutils
import rendererUtils
import popup

TASK_NAME = 'DetermineTravelCostPathAsPolyline'
ERROR_CODES = [120201]
errorMsgs = {
    120201: "A service already exists with this name. Please use a different name."
}

# Output feature layer description
outputLayerDesc = {"layers": [
    {"position":7,
     "catalogPath":"",
     "name": "TravelCostPathPolyline",
     "id": 0,
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

def calTravelCostPath(inputSourceRasterOrFeatures, inputCostRaster, inputDestinationRasterOrFeatures, pathType,
                      destinationField, outputLoc):
    try:
        # get uris for the output rasters
        uris_temporary = []
        # Cost Distance
        arcpy.AddMessage("Running Distance Accumulation analysis...")
        # create temporary raster names
        distanceRas_temporary = "distRas_"+str(uuid.uuid1())
        backlinkRas_temporary = "backlinkRas_"+str(uuid.uuid1())
        # arcpy.gp.CostDistance_sa(inputSourceRasterOrFeatures, inputCostRaster,
        #                          distanceRas_temporary, '#', backlinkRas_temporary)
        arcpy.gp.DistanceAccumulation_sa(inputSourceRasterOrFeatures, distanceRas_temporary, None, None,
                                         inputCostRaster, None, None, None, None,
                                         backlinkRas_temporary, None, None,
                                         '#', '#', '#',
                                         '#', '#')
        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            uri = rasterutils.getURI(arcpy.GetMessage(n))
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))
            if uri == "":
                continue
            else:
                uris_temporary.append(uri)
        # Optimal Path as Line
        arcpy.AddMessage("Running Optimal Path as Line analysis...")
        arcpy.gp.OptimalPathAsLine_sa(inputDestinationRasterOrFeatures, uris_temporary[0], uris_temporary[1],
                                      outputLoc, destinationField, pathType)
        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))
        # Delete the temporary output, throw out the message if failed
        try:
            arcpy.Delete_management(uris_temporary[0], data_type="RasterDataset")
        except:
            arcpy.AddWarning("Temp file {} failed to be deleted.".format(uris_temporary[0]))
        try:
            arcpy.Delete_management(uris_temporary[1], data_type="RasterDataset")
        except:
            arcpy.AddWarning("Temp file {} failed to be deleted.".format(uris_temporary[1]))
    except arcpy.ExecuteError as err:
        if len(uris_temporary) == 2:
            arcpy.Delete_management(uris_temporary[0], data_type="RasterDataset")
            arcpy.Delete_management(uris_temporary[1], data_type="RasterDataset")
        rasterutils.AddExceptionError(TASK_NAME, arcpy.GetMessages(2))
    except Exception as err:
        if len(uris_temporary) == 2:
            arcpy.Delete_management(uris_temporary[0], data_type="RasterDataset")
            arcpy.Delete_management(uris_temporary[1], data_type="RasterDataset")
        rasterutils.AddExceptionError(TASK_NAME, err)

def execute():
    """
    Parse parameters and execute service
    :return: result feature service layer
    """
    inputSourceRasterOrFeatures = arcpy.GetParameterAsText(0)
    inputCostRaster = arcpy.GetParameterAsText(1)
    inputDestinationRasterOrFeatures = arcpy.GetParameterAsText(2)
    outputPolylineName = arcpy.GetParameterAsText(3)
    pathType = arcpy.GetParameterAsText(4)
    destinationField = arcpy.GetParameterAsText(5)
    # Environment setting
    context = arcpy.GetParameterAsText(6)

    try:
        # 0. Check Image Server extension license
        # if arcpy.CheckExtension("Image") != "Available":
        #     raise LicenseError

        # Terminate the job if the output service created by this service tool exists
        if not rasterutils.checkIfJobShouldContinueWithOutputService(outputPolylineName, "featureService"):
            rasterutils.AddErrorCode(120201, errorMsgs[120201])
            raise Exception

        # 1. Parse the input parameters
        hostedgp = agolgp.HostedGP(6, 3)  # a description of the input / output data
        outputName = hostedgp.GetOutputName(3)
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        # Parse the input source raster or features
        # For feature collection, use hostedgp
        if rasterutils.checkIfFeatureCollection(inputSourceRasterOrFeatures):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputSourceRasterOrFeatures", 0)
            inputSourceRasterOrFeatures = Input.name
        # Now parsing the input raster
        else:
            inputSourceRasterOrFeatures = rasterutils.getInDataPath(inputSourceRasterOrFeatures)
            if inputSourceRasterOrFeatures.find("/FeatureServer/") > -1 \
                    or inputSourceRasterOrFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputSourceRasterOrFeatures", 0)
                inputSourceRasterOrFeatures = Input.name
            else:
                if isinstance(inputSourceRasterOrFeatures, dict):
                    inputSourceRasterOrFeatures = json.dumps(inputSourceRasterOrFeatures)


        inputCostRaster = rasterutils.getInDataPath(inputCostRaster)
        if isinstance(inputCostRaster, dict):
            inputCostRaster = json.dumps(inputCostRaster)

        # Parse the input Destination raster or features
        # For feature collection, use hostedgp
        if rasterutils.checkIfFeatureCollection(inputDestinationRasterOrFeatures):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputDestinationRasterOrFeatures", 2)
            inputDestinationRasterOrFeatures = Input.name
        # Now parsing the input raster
        else:
            inputDestinationRasterOrFeatures = rasterutils.getInDataPath(inputDestinationRasterOrFeatures)
            if inputDestinationRasterOrFeatures.find("/FeatureServer/") > -1 \
                    or inputDestinationRasterOrFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputDestinationRasterOrFeatures", 2)
                inputDestinationRasterOrFeatures = Input.name
            else:
                if isinstance(inputDestinationRasterOrFeatures, dict):
                    inputDestinationRasterOrFeatures = json.dumps(inputDestinationRasterOrFeatures)

        # 2. Set GP environment settings
        # Note: the spatial reference defined in the extent will be output spatial reference used
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        arcpy.AddMessage("Output coordinate system: {}".format(outsr))
        arcpy.AddMessage("Output extent: {}".format(outext))
        moreags = rasterutils._parsecontext(context)
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        arcpy.env.mask = rasterutils.getMask(context)
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.overwriteOutput = 1

        # Output parameter will be set later when the tool is successfully run
        arcpy.SetParameterAsText(7, "")

        # Get the output feature class location
        dsFcPath = aolutils.createOutputLocations(hostedgp, outputName)
        arcpy.AddMessage("output location {}".format(dsFcPath))

        # 3. Execute tool
        calTravelCostPath(inputSourceRasterOrFeatures, inputCostRaster,
                          inputDestinationRasterOrFeatures, pathType, destinationField, dsFcPath)

        # 4. Create renderer, configure layer description
        # Add field and calculate Shape Area for renderer normalization
        # aolutils.createShapeAreaField(dsFcPath)

        # Creating drawing info
        desc = arcpy.Describe(dsFcPath)
        arcpy.AddMessage("Creating drawing info for output travel cost path feature layer.")
        drawingInfo = rendererUtils.getSimpleRendererInfo(desc.shapeType)
        #arcpy.AddMessage(drawingInfo)

        if drawingInfo is not None:
            outputLayerDesc["layers"][0]["properties"]["drawingInfo"] = drawingInfo

        # Update Layer description with catalog path
        outputLayerDesc["layers"][0]["catalogPath"] = dsFcPath

        arcpy.AddMessage("Create popup info for output travel cost path as polyline.")
        if rasterutils.RUN_ON_AGOL:
            filename = json.loads(outputPolylineName)["serviceProperties"]
        else:
            filename = json.loads(outputPolylineName)["serviceProperties"]["name"]
        r2f_popupInfo = popup.PopupInfo("Determine Travel Cost Path as Polyline {}".format(filename), "")
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

    except LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)

if __name__ == '__main__':
    execute()
