"""-----------------------------------------------------------------------------
Name:              ZonalGeometryAsTable.py
Purpose:           To calculate zone wise statistics from the values of another raster.
Author:            Esri Inc.
Created:           2/8/2024
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
import conversionUtils
import analysisutils

TASK_NAME = 'ZonalGeometryAsTable'
ERROR_CODES = [120201]
errorMsgs = {
    120201: "A service already exists with this name. Please use a different name."
}

# Output feature layer description
outputLayerDesc = {"layers": [
    {"position":5,
     "catalogPath":"",
     "name": "ZonalGeometryTable",
     "id": 0,
     "properties":{
         "drawingInfo":"",
         "popupInfo":""
     }}
]}

def verifyParameters():
    # verify output cell size units
    if analysisCellSize and analysisCellSizeUnits:
        if analysisCellSizeUnits.lower() not in ["meters", "kilometers", "feet", "miles", "yards", "feetint", "milesint", "yardsint"]:
            errorMsg = errorMsgs[100159].format(analysisCellSizeUnits,
                                                "output cell size [meters, kilometers, feet, miles, yards, feetint, milesint, yardsint]")
            space = " "
            params = {"processingCellSize": space.join([analysisCellSize, analysisCellSizeUnits])}
            aolutils.AddErrorCode(100159, errorMsg, params)
            return False

    return True

if __name__ == '__main__':
    inputZoneRasterOrFeatures = arcpy.GetParameterAsText(0)
    zoneField = arcpy.GetParameterAsText(1)
    outputTableName = arcpy.GetParameterAsText(2)
    analysisCellSize = arcpy.GetParameterAsText(3) or None
    arcpy.AddMessage("analysisCellSize that the tool gets: {}".format(analysisCellSize))
    # Environment setting
    context = arcpy.GetParameterAsText(4)
    arcpy.AddMessage("rasterutil analysisCellSize: {}".format(rasterutils.getCellsize(analysisCellSize)))

    if analysisCellSize:
        if 'url' in analysisCellSize:
            analysisCellSizeUnits = None
            arcpy.AddMessage("url analysisCellSize: {}".format(analysisCellSize))
        elif 'Unknown' in analysisCellSize:
            analysisCellSize, _ = analysisCellSize.split(" ")
            analysisCellSizeUnits = None
            arcpy.AddMessage("numeric analysisCellSize: {}".format(analysisCellSize))
        else:
            try:
                analysisCellSize, analysisCellSizeUnits = analysisCellSize.split(" ")
                analysisCellSize = float(analysisCellSize)
            except ValueError:
                aolutils.AddExceptionError(TASK_NAME, "Invalid search distance")
    else:
        analysisCellSize = None
        analysisCellSizeUnits = None

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
        hostedgp = agolgp.HostedGP(4, 2)  # a description of the input / output data
        outputName = hostedgp.GetOutputName(2)
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        startTime = aolutils.AddTimerMessage(startTime, "Get Input Layer")
        # For feature collection, use hostedgp
        if rasterutils.checkIfFeatureCollection(inputZoneRasterOrFeatures):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputZoneRasterOrFeatures", 0)
            inputZoneRasterOrFeatures = Input.name
            inext, insr = rasterutils.getFeatureCollectionExtSR(inputZoneRasterOrFeatures)
        # Now parsing the input raster
        else:
            inputZoneRasterOrFeatures = rasterutils.getInDataPath(inputZoneRasterOrFeatures)
            if inputZoneRasterOrFeatures.find("/FeatureServer/") > -1 \
                    or inputZoneRasterOrFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputZoneRasterOrFeatures", 0)
                inputZoneRasterOrFeatures = Input.name
                inext, insr = rasterutils.getFeatureCollectionExtSR(inputZoneRasterOrFeatures)
            else:
                if isinstance(inputZoneRasterOrFeatures, dict):
                    inputZoneRasterOrFeatures = json.dumps(inputZoneRasterOrFeatures)
                token0, referer0 = rasterutils.getToken(inputZoneRasterOrFeatures)
                inext, insr = rasterutils.getFeatureOrImageServiceExtSR(inputZoneRasterOrFeatures, token0, referer0)

        if verifyParameters():
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
            arcpy.AddMessage("context: {}".format(context))
            arcpy.env.cellSize = rasterutils.getCellsize(context)
            arcpy.env.mask = rasterutils.getMask(context)
            arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
            # Set parallel processing environment
            arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
            arcpy.env.overwriteOutput = 1

            # Output parameter will be set later when the tool is successfully run
            arcpy.SetParameterAsText(5,  "")

            outsr = arcpy.env.outputCoordinateSystem
            # update processingCellsize
            arcpy.AddMessage("analysisCellSize before conversion: {},{}".format(analysisCellSize, analysisCellSizeUnits))
            if analysisCellSize and analysisCellSizeUnits:
                analysisCellSize = conversionUtils.convertLengthtoSRUnits_RA(outsr, insr, inext, analysisCellSize, analysisCellSizeUnits)
                startTime = analysisutils.AddTimerMessage(startTime, "Convert cellsize to SRUnits")
                arcpy.AddMessage("updated output cell size: {}".format(analysisCellSize))
            # else:
            #     analysisCellSize = "#"
                
            # Get the output feature class location
            temp_fc = os.path.join(arcpy.env.scratchGDB, "temp_zg_res")
            dsFcPath = aolutils.createOutputLocations(hostedgp, outputName)
            arcpy.AddMessage("output location {}".format(dsFcPath))

            # 3. Execute tool
            arcpy.AddMessage("analysisCellSize right before arcpy gp tool: {}".format(analysisCellSize))
            arcpy.AddMessage("Running Zonal Geometry As Table analysis...")
            # arcpy.sa.ZonalGeometryAsTable(inputZoneRasterOrFeatures, zoneField, temp_fc, analysisCellSize)
            arcpy.gp.ZonalGeometryAsTable_sa(inputZoneRasterOrFeatures, zoneField, temp_fc, analysisCellSize)

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
            startTime = aolutils.AddTimerMessage(startTime, "Write output")
            
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