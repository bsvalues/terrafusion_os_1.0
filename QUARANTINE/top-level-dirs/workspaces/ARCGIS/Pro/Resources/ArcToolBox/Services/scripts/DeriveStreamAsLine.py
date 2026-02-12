"""-----------------------------------------------------------------------------
Name:              DeriveStreamAsLine.py
Purpose:           This is the service tool that performs hydrology Derive stream as line analysis
Author:            Esri Inc.
Created:           4/20/2023
Copyright:   (c)   Esri, Inc. 2023
ArcGIS Version:    11.2
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import hostedgp as agolgp
import aolutils
import rasterutils
import rendererUtils
import popup

TASK_NAME = 'DeriveStreamAsLine'
ERROR_CODES = []
errorMsgs = {}

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

if __name__ == '__main__':

    insurf = arcpy.GetParameterAsText(0)
    outstream = arcpy.GetParameterAsText(1)
    inputdepressions = arcpy.GetParameterAsText(2)
    inputweight = arcpy.GetParameterAsText(3)
    accumulationthreshold = arcpy.GetParameterAsText(4)
    streamdesignationmethod = arcpy.GetParameterAsText(5)
    forceflow = arcpy.GetParameterAsText(6)
    context = arcpy.GetParameterAsText(7)

    try:
        # Added logic for json input in Accumulation threshold parameter
        try: 
            acc_thres_json = json.loads(accumulationthreshold)
            if isinstance(acc_thres_json, dict):
                acc_thres_json = {k.lower(): v for k, v in acc_thres_json.items()}
                accumulationthreshold = str(acc_thres_json["distance"]) + " " + acc_thres_json["units"]
        except: pass
        
        # 0. Check Image Server extension license
        if arcpy.CheckExtension("Image") != "Available":
            raise rasterutils.LicenseError

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # Terminate the job if the output service created by this service tool exists
        if not rasterutils.checkIfJobShouldContinueWithOutputService(outstream, "featureService"):
            rasterutils.AddErrorCode(120201, errorMsgs[120201])
            raise Exception

        # 1. Parse input raster parameters
        hostedgp = agolgp.HostedGP(7, 1)
        insurf = rasterutils.getInDataPath(insurf)
        if isinstance(insurf, dict):
            insurf = json.dumps(insurf)

        if rasterutils.checkIfFeatureCollection(inputdepressions):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputdepressions", 2)
            inputdepressions = Input.name
        else:
            # inputdepressions = rasterutils.getInDataPath(inputdepressions)
            # if isinstance(inputdepressions, dict):
            #     inputdepressions = json.dumps(inputdepressions)
            inputdepressions = rasterutils.getInDataPath(inputdepressions)
            if inputdepressions.find("/FeatureServer/") > -1 \
                    or inputdepressions.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputdepressions", 2)
                inputdepressions = Input.name
                layerPath = arcpy.Describe(inputdepressions).catalogPath
            else:
                if isinstance(inputdepressions, dict):
                    inputdepressions = json.dumps(inputdepressions)

        inputweight = rasterutils.getInDataPath(inputweight)
        if isinstance(inputweight, dict):
            inputweight = json.dumps(inputweight)

        # 2. Parse output feature parameters
        outputName = hostedgp.GetOutputName(1)
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        # Output parameter (will be set later when the tool is successful)
        arcpy.SetParameterAsText(8, "")

        # Now need to get the output feature class location
        dsFcPath = aolutils.createOutputLocations(hostedgp, outputName)
        arcpy.AddMessage("Output Stream Lines location {}".format(dsFcPath))

        # Output parameter (will be set later when the tool is successful)
        arcpy.SetParameterAsText(8, "")

        # Now need to get the output feature class location
        dsFcPath = aolutils.createOutputLocations(hostedgp, outputName)
        arcpy.AddMessage("Output Stream Lines location {}".format(dsFcPath))


        # 3. Parse environment settings:
        moreags = rasterutils._parsecontext(context)
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        arcpy.env.mask = rasterutils.getMask(context)
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.overwriteOutput = 1


        # 4. Execute tool
        arcpy.sa.DeriveStreamAsLine(insurf, dsFcPath, inputdepressions, inputweight, accumulationthreshold,
                                    streamdesignationmethod, forceflow)

        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))

        # 4. Create renderer, configure layer description
        # Add field and calculate Shape Area for renderer normalization
        # aolutils.createShapeAreaField(dsFcPath)

        # Creating drawing info
        desc = arcpy.Describe(dsFcPath)
        arcpy.AddMessage("Creating drawing info for output stream lines layer.")
        drawingInfo = rendererUtils.getSimpleRendererInfo(desc.shapeType)
        #arcpy.AddMessage(drawingInfo)

        if drawingInfo is not None:
            outputLayerDesc["layers"][0]["properties"]["drawingInfo"] = drawingInfo

        # Update Layer description with catalog path
        outputLayerDesc["layers"][0]["catalogPath"] = dsFcPath

        arcpy.AddMessage("Create popup info for output stream lines layer.")
        r2f_popupInfo = popup.PopupInfo("Derive Stream As Line {}".format(outstream), "")
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
