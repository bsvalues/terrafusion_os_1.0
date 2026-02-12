"""-----------------------------------------------------------------------------
Name:              ZonalStatisticsAsTable.py
Purpose:           To calculate zone wise statistics from the values of another raster.
Author:            Esri Inc.
Created:           2/18/2020
Copyright:   (c)   Esri, Inc. 2020
ArcGIS Version:    10.8.1
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

TASK_NAME = 'ZonalStatisticsAsTable'
ERROR_CODES = [120201]
errorMsgs = {
    120201: "A service already exists with this name. Please use a different name."
}

# Output feature layer description
outputLayerDesc = {"layers": [
    {"position":12,
     "catalogPath":"",
     "name": "ZonalStatisticsTable",
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
    inputZoneRasterOrFeatures = arcpy.GetParameterAsText(0)
    zoneField = arcpy.GetParameterAsText(3)
    inputValueRaster = arcpy.GetParameterAsText(1)
    outputTableName = arcpy.GetParameterAsText(2)
    ignoreNodata = arcpy.GetParameterAsText(4)
    statisticType = arcpy.GetParameterAsText(5)
    percentileValues = arcpy.GetParameterAsText(6)
    processAsMultidimensional = arcpy.GetParameterAsText(7)
    percentileInterpolationType = arcpy.GetParameterAsText(8)
    circularCalculation = arcpy.GetParameterAsText(9)
    circularWrapValue = arcpy.GetParameterAsText(10)
    # Environment setting
    context = arcpy.GetParameterAsText(11)

    try:
        startTime = time.time()
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # Terminate the job if the output service created by this service tool exists
        if not rasterutils.checkIfJobShouldContinueWithOutputService(outputTableName, "featureService"):
            rasterutils.AddErrorCode(120201, errorMsgs[120201])
            raise Exception

        # 1. Parse the input parameters
        hostedgp = agolgp.HostedGP(11, 2)  # a description of the input / output data
        outputName = hostedgp.GetOutputName(2)
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        # For feature collection, use hostedgp
        if rasterutils.checkIfFeatureCollection(inputZoneRasterOrFeatures):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputZoneRasterOrFeatures", 0)
            inputZoneRasterOrFeatures = Input.name
        # Now parsing the input raster
        else:
            inputZoneRasterOrFeatures = rasterutils.getInDataPath(inputZoneRasterOrFeatures)
            if inputZoneRasterOrFeatures.find("/FeatureServer/") > -1 \
                    or inputZoneRasterOrFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputZoneRasterOrFeatures", 0)
                inputZoneRasterOrFeatures = Input.name
            else:
                if isinstance(inputZoneRasterOrFeatures, dict):
                    inputZoneRasterOrFeatures = json.dumps(inputZoneRasterOrFeatures)

        inputValueRaster = rasterutils.getInDataPath(inputValueRaster)
        if isinstance(inputValueRaster, dict):
            inputValueRaster = json.dumps(inputValueRaster)

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
        arcpy.SetParameterAsText(12,  "")

        # Get the output feature class location
        temp_fc = os.path.join(arcpy.env.scratchGDB, "temp_zs_res")
        dsFcPath = aolutils.createOutputLocations(hostedgp, outputName)
        arcpy.AddMessage("output location {}".format(dsFcPath))

        # 3. Execute tool
        arcpy.AddMessage("Running Zonal Statistics As Table analysis...")
        arcpy.sa.ZonalStatisticsAsTable(inputZoneRasterOrFeatures, zoneField, inputValueRaster,
                                        temp_fc, ignoreNodata, statisticType,
                                        processAsMultidimensional, percentileValues,
                                        percentileInterpolationType, circularCalculation, circularWrapValue)
        # change field name AREA to ZONE_AREA because AREA is reserved in SDE
        arcpy.AlterField_management(temp_fc, 'AREA', 'ZONE_AREA', 'AREA')
        arcpy.CopyRows_management(temp_fc, dsFcPath)
        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))

        desc = arcpy.Describe(dsFcPath)
        # Update Layer description with catalog path
        outputLayerDesc["layers"][0]["catalogPath"] = dsFcPath
   
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