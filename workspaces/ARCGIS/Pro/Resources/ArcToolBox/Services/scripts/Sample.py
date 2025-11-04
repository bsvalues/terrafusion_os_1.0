"""-----------------------------------------------------------------------------
Name:              Sample.py
Purpose:           Generate samples from input rasters
Author:            Esri Inc.
Created:           09/29/2019
Copyright:   (c)   Esri, Inc. 2019
ArcGIS Version:    10.8
-----------------------------------------------------------------------------"""
# core libraries
import json
import urllib.request, urllib.parse, urllib.error
import os
import sys

# internal libraries
import arcpy
import hostedgp as hgp
import rasterutils
import rendererUtils
import popup
import aolutils
scriptsx = os.path.join(os.path.split(os.path.dirname(__file__))[0], "scriptsx")
sys.path.append(scriptsx)
from common import PAOutputFeatureLayer, FeatureServiceLayerPublisher

TASK_NAME = 'Sample'
ERROR_CODES = [120100]
errorMsgs = {
    120100: "Output Feature Type {} is not supported.",
}


# Output feature layer description
outputLayerDesc = {"layers": [
    {"position":12,
     "catalogPath":"",
     "name": "Sample",
     "id": 0,
     "properties":{
         "drawingInfo":"",
         "popupInfo":""
     }}
]}


def _parseStatisticsType(statisticsType):
    statisticsTypeAllowedValues = ['MINIMUM', 'MAXIMUM', 'MEDIAN', 'MEAN', 'SUM', 'MAJORITY', 'MINORITY', 'STD', 'PERCENTILE']
    for element in statisticsTypeAllowedValues:
        if statisticsType.upper() == element:
            return element
    element = 'MEAN'
    return element


def _parseLayout(layout):
    layoutAllowedValues = ['ROW_WISE', 'COLUMN_WISE']
    for element in layoutAllowedValues:
        if layout.upper() == element:
            return element
    element = 'ROW_WISE'
    return element

def _parseAcquisitionDef(acquisitionDefinition):

    acquisitionDefinitionStr = ""
    dim='#'
    startFieldOrVal='#'
    endFieldOrVal='#'
    relValOrDaysBefore='#'
    relValOrDaysAfter='#'
    for key, val in acquisitionDefinition.items():
        if key.lower()=="dimension":
            dim=val
        if key.lower()=="startfieldorval":
            startFieldOrVal=val
        if key.lower()=="endfieldorval":
            endFieldOrVal=val
        if key.lower()=="relvalordaysbefore":
            relValOrDaysBefore=val
        if key.lower()=="relvalordaysafter":
            relValOrDaysAfter=val
    acquisitionDefinitionStr=acquisitionDefinitionStr+str(dim)+" "+str(startFieldOrVal)+\
                             " "+str(endFieldOrVal)+" "+str(relValOrDaysBefore)+" "+str(relValOrDaysAfter)
    return acquisitionDefinitionStr


def execute():
    """
    Parse parameters and execute service
    :return: result feature service layer
    """

    inRasters = arcpy.GetParameterAsText(0)
    inLocationData = arcpy.GetParameterAsText(1)
    outName = arcpy.GetParameterAsText(2)
    resamplingType = arcpy.GetParameterAsText(3)
    uniqueIdField = arcpy.GetParameterAsText(4)
    acquisitionDefinition = arcpy.GetParameterAsText(5)
    statisticsType = arcpy.GetParameterAsText(6)
    percentileValue = arcpy.GetParameterAsText(7)
    bufferDistance = arcpy.GetParameterAsText(8)
    layout = arcpy.GetParameterAsText(9)
    generateFeatureClass = arcpy.GetParameterAsText(10)
    context = arcpy.GetParameterAsText(11)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # Create HostedGP object
        hostedgp = hgp.HostedGP(11, 2)  # a description of the input / output data

        # 1. Parse the input parameters
        byref, ismosaic, inputRasters, allbyref = rasterutils.getHostedDataPath(inRasters)
        inLocationData = rasterutils.parse_feature_input(inLocationData, "inLocationData", 1)

        # Set environment variable
        moreags = rasterutils._parsecontext(context)
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)

        # Set other GP environment settings
        # Note: the spatial reference defined in the extent will be output spatial reference used
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        # Test purpose: overwrite enable
        arcpy.env.overwriteOutput = 1
        #set mask env
        arcpy.env.mask = rasterutils.getMask(context)
        statisticsType = _parseStatisticsType(statisticsType)

        asmd = "CURRENT_SLICE"
        if "processAsMultidimensional" in moreags:
            asmd = moreags["processAsMultidimensional"]
            if type(asmd) == bool and asmd:
                asmd = "ALL_SLICES"
            else:
                asmd = "CURRENT_SLICE"

        acquisitionDefinitionValues = acquisitionDefinition
        try:
            acquisitionDefinition=eval(acquisitionDefinition)
        except:
            pass

        acquisitionDefinitionValuesList = []
        acquisitionDefinitionStr=""
        if isinstance(acquisitionDefinition, list):
            for ele in acquisitionDefinition:
                if isinstance(ele,dict):
                    acquisitionDefinitionStr = _parseAcquisitionDef(ele)
                    acquisitionDefinitionValuesList.append(acquisitionDefinitionStr)
            
        elif isinstance(acquisitionDefinition, dict):
            acquisitionDefinitionStr = _parseAcquisitionDef(acquisitionDefinition)
            acquisitionDefinitionValuesList.append(acquisitionDefinitionStr)
        acquisitionDefinitionValues = ";".join(acquisitionDefinitionValuesList)


        layout = _parseLayout(layout)

        # 2. Parse the output
        onlyuri = False
        outdict = rasterutils._parsecontext(outName)
        if "uri" in outdict:
            onlyuri = True

        # 3. Execute tool
        # Converting boolean parameter to keyword
        if generateFeatureClass.lower() == "true":
            generateFeatureClass = "FEATURE_CLASS"
        else:
            generateFeatureClass = "TABLE"

        if not onlyuri:
            outputName = hostedgp.GetOutputName(2)

            # check publishing privilege
            aolutils.checkPublishingPrivilege(hostedgp, outputName)

            # Output parameter (will be set later when the tool is successful)
            arcpy.SetParameterAsText(12, "")
            # Now need to get the output feature class location
            dsFcPath = aolutils.createOutputLocations(hostedgp, outputName)

            arcpy.gp.Sample_ia(inputRasters, inLocationData, dsFcPath, resamplingType, uniqueIdField,
                               asmd, acquisitionDefinitionValues, statisticsType, percentileValue,
                               bufferDistance, layout, generateFeatureClass)

            # Creating drawing info
            if generateFeatureClass == "FEATURE_CLASS":
                desc = arcpy.Describe(dsFcPath)

                # Update Layer description with catalog path
                outputLayerDesc["layers"][0]["catalogPath"] = dsFcPath

                r2f_popupInfo = popup.PopupInfo("Generate Sample {}".format(outName), "")
                r2f_popupInfo.addFieldInfo("Feature_Count", "Count of Feature")
                #toOmitFieldNames = ["feature_count", desc.OIDFieldName.lower(), desc.ShapeFieldName.lower()]
                #arcpy.AddError("Adding other fields.... ")

                # Add all other fields not in toOmitFieldNames
                for field in desc.fields:
                    #if field.name.lower() not in toOmitFieldNames:
                    label = field.aliasName.replace("_", " ").title()
                    if field.type.lower() == "double":
                        r2f_popupInfo.addFieldInfo(field.name, label, True)
                    else:
                        r2f_popupInfo.addFieldInfo(field.name, label)
                outputLayerDesc["layers"][0]["properties"]["popupInfo"] = r2f_popupInfo.getPopupInfo()

                hostedgp.ProcessFeatureOutput(json.dumps(outputLayerDesc, skipkeys=False, ensure_ascii=False))
            else:
                output_lyr = PAOutputFeatureLayer(dsFcPath)  # Create an instance of PAOutputFeatureLayer
                publisher = FeatureServiceLayerPublisher(json.loads(outName))
                publisher.add_layer_to_publish(output_lyr, 12, "Sample", layer_index=0)
                publisher.publish()
                update_item_properties = {
                    "typeKeywords": 'Table'
                }
                hostedgp = hgp.HostedGP(None, None, False)
                opjson = arcpy.GetParameterAsText(12)
                opdict = json.loads(opjson)
                output_item_id=None
                if "itemId" in opdict:
                    output_item_id = json.loads(opjson)["itemId"]
                    hostedgp.UpdateItem(output_item_id, update_item_properties)

        else:
            dsFcPath = outdict["uri"]
            outvalue = {"uri": dsFcPath}
            arcpy.AddMessage("Use uri path:{}".format(dsFcPath))
            arcpy.gp.Sample_ia(inputRasters, inLocationData, dsFcPath, resamplingType, uniqueIdField,
                               asmd, acquisitionDefinitionValues, statisticsType, percentileValue,
                               bufferDistance, layout, generateFeatureClass)
            arcpy.SetParameterAsText(12, json.dumps(outvalue))

    except rasterutils.LicenseError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))



if __name__ == '__main__':
    execute()
