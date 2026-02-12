"""-----------------------------------------------------------------------------
Name:              ConvertRasterToFeature.py
Purpose:           This service tool converts raster data to point/polygon/
                   polyline feature class
Author:            Esri Inc.
Created:           8/1/2016
Copyright:   (c)   Esri, Inc. 2016
ArcGIS Version:    10.5
-----------------------------------------------------------------------------"""
# core libraries
import json
import os
import time

# internal libraries
import arcpy
import hostedgp as hgp
import aolutils
import rasterutils
import rendererUtils
import popup

TASK_NAME = 'ConvertRasterToFeature'
ERROR_CODES = [120100, 120201]
errorMsgs = {
    120100: "Output Feature Type {} is not supported.",
    120201: "A service already exists with this name. Please use a different name."
}

# Output feature layer description
outputLayerDesc = {"layers": [
    {"position":8,
     "catalogPath":"",
     "name": "Raster2FeatureLayer",
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
    inras = arcpy.GetParameterAsText(0)
    outname = arcpy.GetParameterAsText(1)
    valfield = arcpy.GetParameterAsText(2)
    outtype = arcpy.GetParameterAsText(3)
    simplify = arcpy.GetParameterAsText(4)
    create_multipart_features = arcpy.GetParameterAsText(5)
    max_vertices_per_feature = arcpy.GetParameterAsText(6)
    # Environment setting
    context = arcpy.GetParameterAsText(7)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # Terminate the job if the output service created by this service tool exists
        if not rasterutils.checkIfJobShouldContinueWithOutputService(outname, "featureService"):
            rasterutils.AddErrorCode(120201, errorMsgs[120201])
            raise Exception

        # 1. Parse the input parameters
        hostedgp = hgp.HostedGP(7, 1)  # a description of the input / output data
        outputName = hostedgp.GetOutputName(1)
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        # Now parsing the input raster
        inras = rasterutils.getInDataPath(inras)
        if isinstance(inras, dict):
            inras = json.dumps(inras)

        # 2. Set GP environment settings
        # Set output extent
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
         # Set additional environment settings
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)

        # Output parameter (will be set later when the tool is successful)
        arcpy.SetParameterAsText(8, "")

        # Now need to get the output feature class location
        dsFcPath = aolutils.createOutputLocations(hostedgp, outputName)
        #arcpy.AddMessage("output location {}".format(dsFcPath))

        # 3. Execute tool based on output type
        if outtype == "Point":
            raster2point(inras, valfield, dsFcPath)
        elif outtype == "Line":
            raster2polyline(inras, dsFcPath, simplify=simplify, valfield=valfield)
        elif outtype == "Polygon":
            raster2polygon(inras, dsFcPath, simplify=simplify, valfield=valfield,
                           create_multipart_features=create_multipart_features,
                           max_vertices_per_feature=max_vertices_per_feature)
        else:
            errorMsg = errorMsgs[120100].format(outtype)
            aolutils.AddErrorCode(120100, errorMsg)
        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))
        # 4. Create renderer, configure layer description
        # Add field and calculate Shape Area for renderer normalization
        # aolutils.createShapeAreaField(dsFcPath)

        # Creating drawing info
        desc = arcpy.Describe(dsFcPath)
        arcpy.AddMessage("Creating drawing info for output feature layer.")
        #if outtype == "Polygon": 10.6 uv renderer too slow
        #    drawingInfo = rendererUtils.getUniqueValueRendererInfo(dsFcPath, ["gridcode"])
        #else:
        drawingInfo = rendererUtils.getSimpleRendererInfo(desc.shapeType, TASK_NAME)
        #arcpy.AddMessage(drawingInfo)

        if drawingInfo is not None:
            outputLayerDesc["layers"][0]["properties"]["drawingInfo"] = drawingInfo

        # Update Layer description with catalog path
        outputLayerDesc["layers"][0]["catalogPath"] = dsFcPath

        arcpy.AddMessage("Create popup info for output feature layer.")
        if rasterutils.RUN_ON_AGOL:
            filename = json.loads(outname)["serviceProperties"]
        else:
            filename = json.loads(outname)["serviceProperties"]["name"]
        r2f_popupInfo = popup.PopupInfo("Convert Raster to Feature {}".format(filename), "")
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
        # arcpy.AddMessage("Output feature layer description: {}".format(json.dumps(outputLayerDesc)))

        # arcpy.AddMessage("Start processing feature output")
        # lyrname = "Raster2FeatureOutput"
        # res = aolutils.HostedToolResult(outputName)
        # outDesc = aolutils.getOutDescription(lyrname, 0, drawingInfo)
        # res.addHostedOutput(desc, outDesc, 6)
        time.sleep(10)
        hostedgp.ProcessFeatureOutput(json.dumps(outputLayerDesc, skipkeys=False, ensure_ascii=False))

    except KeyError:
        rasterutils.AddExceptionError(TASK_NAME, "JSON object does not have the correct parameter key value.")

    except ValueError:
        rasterutils.AddExceptionError(TASK_NAME, "Invalid JSON object for the parameter.")

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

def raster2point(inras, valfield, outname):
    try:
        arcpy.AddMessage("Converting raster to points...")
        arcpy.RasterToPoint_conversion(inras, outname, valfield)
    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)
    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)

def raster2polyline(inras, outname, background="ZERO", simplify="SIMPLIFY",
                    valfield="VALUE"):
    try:
        arcpy.AddMessage("Converting raster to polyline...")
        arcpy.RasterToPolyline_conversion(
            inras, outname, background_value=background, simplify=simplify,
            raster_field=valfield)
    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)
    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)

def raster2polygon(inras, outname, simplify="SIMPLIFY", valfield="VALUE",
                   create_multipart_features="SINGLE_OUTER_PART",
                   max_vertices_per_feature=None):
    try:
        arcpy.AddMessage("Converting raster to polygon...")
        arcpy.RasterToPolygon_conversion(
            inras, outname, simplify=simplify, raster_field=valfield,
            create_multipart_features=create_multipart_features,
            max_vertices_per_feature=max_vertices_per_feature)
    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)
    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)

if __name__ == '__main__':
    execute()
