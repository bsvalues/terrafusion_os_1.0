"""-----------------------------------------------------------------------------
Name:              GenerateTable.py
Purpose:           Generate Table output from Raster Function
Author:            Esri Inc.
Created:           03/22/2018
Copyright:   (c)   Esri, Inc. 2014
ArcGIS Version:    10.6.1
-----------------------------------------------------------------------------"""
# core libraries
import json
import urllib.request, urllib.parse, urllib.error

# internal libraries
import arcpy
import hostedgp as hgp
import rasterutils
import rendererUtils
import popup
import aolutils

TASK_NAME = 'GenerateTable'
ERROR_CODES = [120100]
errorMsgs = {
    120100: "Output Feature Type {} is not supported.",
}


# Output feature layer description
outputLayerDesc = {"layers": [
    {"position":3,
     "catalogPath":"",
     "name": "GenerateAttributeTable",
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

    raster_function = arcpy.GetParameterAsText(0)
    out_table = arcpy.GetParameterAsText(1)
    raster_function_arguments = arcpy.GetParameterAsText(2)
    context = arcpy.GetParameterAsText(3)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        try:
            #arcpy.AddError(raster_function_arguments)
            argsdict = json.loads(raster_function_arguments)
            argslist = []
            #arcpy.AddError(str(argsdict))
            for arg in argsdict:
                # Check if an argument value contains addtional dictionary
                if isinstance(argsdict[arg], dict):
                    raskeys = {"itemId", "url", "uri", "itemIds", "urls", "uris"}
                    if argsdict[arg].keys() & raskeys:
                        argsdict[arg] = rasterutils.getInDataPath(argsdict[arg])

                # Add single quote around list type argument values
                if isinstance(argsdict[arg], list) or isinstance(argsdict[arg], dict):
                    argsdict[arg] = "\'" + json.dumps(argsdict[arg]) + "\'"
                    #argsdict[arg] = urllib.quote(unicode(argsdict[arg]).encode('utf-8'), safe='~()*!.')
                else:
                    argsdict[arg] = json.dumps(argsdict[arg])
                argslist.append(arg + " " + argsdict[arg])
            raster_function_arguments = ";".join(argslist)
            #arcpy.AddError(raster_function_arguments)
        except ValueError:
            if raster_function_arguments != "" and raster_function_arguments != "#":
                arcpy.AddMessage("Raster Arguments value is not a valid JSON document")
                raster_function_arguments = "#"
        except:
            raster_function_arguments = "#"
        arcpy.AddMessage("Start")
        # 1. Parse the input parameters

        hostedgp = hgp.HostedGP(outputName=1) # a description of the input / output data
        outputName = hostedgp.GetOutputName(1)

        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        # Output parameter (will be set later when the tool is successful)
        arcpy.SetParameterAsText(4, "")
        # Now need to get the output feature class location
        dsFcPath = aolutils.createOutputLocations(hostedgp, outputName)

        # Set environment variable
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)

        raster_function = raster_function.replace("\\n", "")
        # 3. Execute tool
        arcpy.GenerateTableFromRasterFunction_management(raster_function, dsFcPath, raster_function_arguments)

        # 4. Create renderer, configure layer description
        # Add field and calculate Shape Area for renderer nomalization
        # aolutils.createShapeAreaField(dsFcPath)

        # Creating drawing info
        desc = arcpy.Describe(dsFcPath)
        drawingInfo = rendererUtils.getSimpleRendererInfo(desc.shapeType, TASK_NAME)
        #arcpy.AddError(drawingInfo)

        if drawingInfo is not None:
            outputLayerDesc["layers"][0]["properties"]["drawingInfo"] = drawingInfo
        
        # Update Layer description with catalog path
        outputLayerDesc["layers"][0]["catalogPath"] = dsFcPath

        r2f_popupInfo = popup.PopupInfo("Generate table from raster function {}".format(out_table), "")
        r2f_popupInfo.addFieldInfo("Feature_Count", "Count of Feature")
        toOmitFieldNames = ["feature_count", desc.OIDFieldName.lower(), desc.ShapeFieldName.lower()]
        #arcpy.AddError("Adding other fields.... ")

        # Add all other fields not in toOmitFieldNames
        for field in desc.fields:
            if field.name.lower() not in toOmitFieldNames:
                label = field.aliasName.replace("_", " ").title()
                if field.type.lower() == "double":
                    r2f_popupInfo.addFieldInfo(field.name, label, True)
                else:
                    r2f_popupInfo.addFieldInfo(field.name, label)
        outputLayerDesc["layers"][0]["properties"]["popupInfo"] = r2f_popupInfo.getPopupInfo()

        hostedgp.ProcessFeatureOutput(json.dumps(outputLayerDesc, skipkeys=False, ensure_ascii=False))
        #arcpy.AddError("Tool Successful.... ")

    except KeyError:
        rasterutils.AddExceptionError(TASK_NAME, "JSON object does not have the correct parameter key value.")

    except ValueError:
        rasterutils.AddExceptionError(TASK_NAME, "Invalid JSON object for the parameter.")

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)


if __name__ == '__main__':
    execute()
