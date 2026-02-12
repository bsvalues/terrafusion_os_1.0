"""-----------------------------------------------------------------------------
Name:              TabulateArea.py
Purpose:           To calculate zone wise statistics from the values of another raster.
Author:            Esri Inc.
Created:           2/08/2024
Copyright:   (c)   Esri, Inc. 2024
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

TASK_NAME = 'TabulateArea'
ERROR_CODES = [120201]
errorMsgs = {
    120201: "A service already exists with this name. Please use a different name."
}

# Output feature layer description
outputLayerDesc = {"layers": [
    {"position":8,
     "catalogPath":"",
     "name": "TabulateArea",
     "id": 0,
     "properties":{
         "drawingInfo":"",
         "popupInfo":""
     }}
]}

def verifyParameters():
    # verify output cell size units
    if processingCellSize and processingCellSizeUnits:
        if processingCellSizeUnits.lower() not in ["meters", "kilometers", "feet", "miles", "yards", "feetint", "milesint", "yardsint"]:
            errorMsg = errorMsgs[100159].format(processingCellSizeUnits,
                                                "output cell size [meters, kilometers, feet, miles, yards, feetint, milesint, yardsint]")
            space = " "
            params = {"processingCellSize": space.join([processingCellSize, processingCellSizeUnits])}
            aolutils.AddErrorCode(100159, errorMsg, params)
            return False

    return True

    
if __name__ == '__main__':

    inputZoneRasterOrFeatures = arcpy.GetParameterAsText(0)
    zoneField = arcpy.GetParameterAsText(1)
    inputClassRasterOrFeatures = arcpy.GetParameterAsText(2)
    classField = arcpy.GetParameterAsText(3)
    outputTableName = arcpy.GetParameterAsText(4)
    processingCellSize = arcpy.GetParameterAsText(5) or None
    arcpy.AddMessage("processingCellSize that the tool gets: {}".format(processingCellSize))
    classesAsRows = arcpy.GetParameterAsText(6)

    # Environment setting
    context = arcpy.GetParameterAsText(7)
    arcpy.AddMessage(context)

    if processingCellSize:
        if 'url' in processingCellSize:
            processingCellSizeUnits = None
            arcpy.AddMessage("url processingCellSize: {}".format(processingCellSize))
        elif 'Unknown' in processingCellSize:
            processingCellSize, _ = processingCellSize.split(" ")
            processingCellSizeUnits = None
            arcpy.AddMessage("numeric processingCellSize: {}".format(processingCellSize))
        else:
            try:
                processingCellSize, processingCellSizeUnits = processingCellSize.split(" ")
                processingCellSize = float(processingCellSize)
            except ValueError:
                aolutils.AddExceptionError(TASK_NAME, "Invalid search distance")
    else:
        processingCellSize = None
        processingCellSizeUnits = None

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
        hostedgp = agolgp.HostedGP(7, 4)  # a description of the input / output data
        outputName = hostedgp.GetOutputName(4)
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        startTime = aolutils.AddTimerMessage(startTime, "Get Input Layer")
        isRaster = True # raster flag for checking insr, inext

        # For feature collection, use hostedgp
        if rasterutils.checkIfFeatureCollection(inputZoneRasterOrFeatures):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputZoneRasterOrFeatures", 0)
            inputZoneRasterOrFeatures = Input.name
            inext, insr = rasterutils.getFeatureCollectionExtSR(inputZoneRasterOrFeatures)
            arcpy.AddMessage("feature collection insr: {}".format(insr))
        # Now parsing the input raster
        else:
            inputZoneRasterOrFeatures = rasterutils.getInDataPath(inputZoneRasterOrFeatures)
            if inputZoneRasterOrFeatures.find("/FeatureServer/") > -1 \
                    or inputZoneRasterOrFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputZoneRasterOrFeatures", 0)
                inputZoneRasterOrFeatures = Input.name   
                inext, insr = rasterutils.getFeatureCollectionExtSR(inputZoneRasterOrFeatures) 
                arcpy.AddMessage("feature service insr: {}".format(insr))
            else:
                if isinstance(inputZoneRasterOrFeatures, dict):
                    inputZoneRasterOrFeatures = json.dumps(inputZoneRasterOrFeatures)
                token0, referer0 = rasterutils.getToken(inputZoneRasterOrFeatures)
                inext, insr = rasterutils.getFeatureOrImageServiceExtSR(inputZoneRasterOrFeatures, token0, referer0)
                isRaster = False
                arcpy.AddMessage("raster service insr: {}".format(insr))

        # For feature collection, use hostedgp
        if rasterutils.checkIfFeatureCollection(inputClassRasterOrFeatures):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputClassRasterOrFeatures", 2)
            inputClassRasterOrFeatures = Input.name
        # Now parsing the input raster
        else:
            inputClassRasterOrFeatures = rasterutils.getInDataPath(inputClassRasterOrFeatures)
            if inputClassRasterOrFeatures.find("/FeatureServer/") > -1 \
                    or inputClassRasterOrFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputClassRasterOrFeatures", 2)
                inputClassRasterOrFeatures = Input.name
            else:
                if isinstance(inputClassRasterOrFeatures, dict):
                    inputClassRasterOrFeatures = json.dumps(inputClassRasterOrFeatures)
                if isRaster:
                    token0, referer0 = rasterutils.getToken(inputClassRasterOrFeatures)
                    inext, insr = rasterutils.getFeatureOrImageServiceExtSR(inputClassRasterOrFeatures, token0, referer0)
                    arcpy.AddMessage("raster service insr2: {}".format(insr))

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
            arcpy.env.cellSize = rasterutils.getCellsize(context)
            arcpy.env.mask = rasterutils.getMask(context)
            arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
            # Set parallel processing environment
            arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
            arcpy.env.overwriteOutput = 1

            # Output parameter will be set later when the tool is successfully run
            arcpy.SetParameterAsText(8,  "")
            
            outsr = arcpy.env.outputCoordinateSystem
            # update processingCellsize
            if processingCellSize and processingCellSizeUnits:
                processingCellSize = conversionUtils.convertLengthtoSRUnits_RA(outsr, insr, inext, processingCellSize, processingCellSizeUnits)
                startTime = analysisutils.AddTimerMessage(startTime, "Convert cellsize to SRUnits")
                arcpy.AddMessage("updated output cell size: {}".format(processingCellSize))
            # else:
            #     processingCellSize = "#"
                
            # Get the output feature class location
            temp_fc = os.path.join(arcpy.env.scratchGDB, "temp_ta_res")
            dsFcPath = aolutils.createOutputLocations(hostedgp, outputName)
            arcpy.AddMessage("output location {}".format(dsFcPath))

            # 3. Execute tool
            arcpy.AddMessage("analysisCellSize right before arcpy gp tool: {}".format(processingCellSize))
            arcpy.AddMessage("Running Tabulate Area analysis...")
            # arcpy.sa.TabulateArea(inputZoneRasterOrFeatures, zoneField, inputClassRasterOrFeatures,
            #                                 classField, temp_fc, processingCellSize, classesAsRows)
            arcpy.gp.TabulateArea_sa(inputZoneRasterOrFeatures, zoneField, inputClassRasterOrFeatures,
                                            classField, temp_fc, processingCellSize, classesAsRows)
            
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