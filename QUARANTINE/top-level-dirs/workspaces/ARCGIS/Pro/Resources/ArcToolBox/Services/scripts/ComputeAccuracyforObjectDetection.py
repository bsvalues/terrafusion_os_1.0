"""-----------------------------------------------------------------------------
Name:              ComputeAccuracyforObjectDetection.py
Purpose:           The tool calculates accuracy of a deep learning model
Author:            Esri Inc.
Created:           08/06/2020
Copyright:   (c)   Esri, Inc. 2020
ArcGIS Version:    10.9
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

TASK_NAME = 'ComputeAccuracyforObjectDetection'
ERROR_CODES = [120100]
errorMsgs = {
    120100: "Output Feature Type {} is not supported.",
}

def _check_writable(path):
    """
    Utility function to check whether a directory is writable or not
    :param path: directory path
    :return: True if writable, False if not
    """
    writable = False
    try:
        tempfile = os.path.join(path, "t"+str(time.time()))
        with open(tempfile, "w") as f:
            writable = True
        os.remove(tempfile)
        return writable
    except Exception as err:
        return writable

def _parseReportoutput(outReport):
    """
    This private function is used to parse the report output. It can be expanded to
    include more item meta data if needed. "name" value is required.
    :param outdlkp: output dlpk JSON
    e.g. {"name": "findtrees", "folderId": "nodsfiajoirejiojenoiwnioew", "itemProperties": {}}
    :return: JSON definition of report output.
    """
    try:
        reportList = list(rasterutils.getJSON(outReport))
        if not reportList:
            arcpy.AddMessage("Invalid output Accuracy Report JSON.")

        # Make sure dlpk has name and name value is not empty
        reportjson = reportList[0]
        if "name" in reportjson and reportjson["name"]:
            return reportjson
        elif "uri" in reportjson and reportjson["uri"]:
            return reportjson
        else:
            arcpy.AddMessage("Invalid output Accuracy Report JSON, Missing name. ")

        return {}
    except Exception as err:
        arcpy.AddMessage("Invalid output Accuracy Report JSON")
        arcpy.AddMessage(err)
        return {}

# Output feature layer description
outputLayerDesc = {"layers": [
    {"position":9,
     "catalogPath":"",
     "name": "ComputeAccuracyforObjectDetection",
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

    detectedFeatures = arcpy.GetParameterAsText(0)
    groundTruthFeatures  = arcpy.GetParameterAsText(1)
    outAccuracyTableName = arcpy.GetParameterAsText(2)
    outAccuracyReport = arcpy.GetParameterAsText(3)
    detectedClassValueField = arcpy.GetParameterAsText(4)
    groundTruthClassValueField = arcpy.GetParameterAsText(5)
    minIoU = arcpy.GetParameterAsText(6)
    maskFeatures = arcpy.GetParameterAsText(7)
    context = arcpy.GetParameterAsText(8)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Create HostedGP object
        hostedgp = hgp.HostedGP(8, 2)  # a description of the input / output data

        # 1. Parse the input parameters
        # For feature collection, use hostedgp
        if rasterutils.checkIfFeatureCollection(detectedFeatures):
            detectedFeaturesInput, detectedFeaturesInputLayerCount = aolutils.getHostedLayerX(hostedgp, "detectedFeatures", 0)
            if detectedFeaturesInput is None:
                arcpy.AddError("Couldn't get the detectedFeatures Layer")
            detectedFeatures = arcpy.Describe(detectedFeaturesInput.name).catalogPath
        else:
            detectedFeatures = rasterutils.getInDataPath(detectedFeatures)
            if detectedFeatures.find("/FeatureServer/") > -1 \
                    or detectedFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "detectedFeatures", 0)
                detectedFeatures = Input.name
            else:
                if isinstance(detectedFeatures, dict):
                    detectedFeatures = json.dumps(detectedFeatures)

        if rasterutils.checkIfFeatureCollection(groundTruthFeatures):
            groundTruthFeaturesInput, groundTruthFeaturesInputLayerCount = aolutils.getHostedLayerX(hostedgp, "groundTruthFeatures", 1)
            if groundTruthFeaturesInput is None:
                arcpy.AddError("Couldn't get the groundTruthFeatures Layer")
            groundTruthFeatures = arcpy.Describe(groundTruthFeaturesInput.name).catalogPath
        else:
            groundTruthFeatures = rasterutils.getInDataPath(groundTruthFeatures)
            if groundTruthFeatures.find("/FeatureServer/") > -1 \
                    or groundTruthFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "groundTruthFeatures", 1)
                groundTruthFeatures = Input.name
            else:
                if isinstance(groundTruthFeatures, dict):
                    groundTruthFeatures = json.dumps(groundTruthFeatures)

        if maskFeatures != "":
            if rasterutils.checkIfFeatureCollection(maskFeatures):
                maskFeaturesInput, maskFeaturesInputLayerCount = aolutils.getHostedLayerX(hostedgp, "maskFeatures", 7)
                if groundTruthFeaturesInput is None:
                    arcpy.AddError("Couldn't get the maskFeatures Layer")
                maskFeatures = arcpy.Describe(maskFeaturesInput.name).catalogPath
            else:
                maskFeatures = rasterutils.getInDataPath(maskFeatures)
                if maskFeatures.find("/FeatureServer/") > -1 \
                        or maskFeatures.find("/MapServer/") > -1:
                    Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "maskFeatures", 7)
                    maskFeatures = Input.name
                else:
                    if isinstance(maskFeatures, dict):
                        maskFeatures = json.dumps(maskFeatures)

        # Set environment variable
        moreags = rasterutils._parsecontext(context)
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)

        # Set other GP environment settings
        # Note: the spatial reference defined in the extent will be output spatial reference used
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.extent = outext

        # 2. Parse the output

        outputName = hostedgp.GetOutputName(2)

        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        # Output parameter (will be set later when the tool is successful)
        arcpy.SetParameterAsText(9, "")
        # Now need to get the output feature class location
        dsFcPath = aolutils.createOutputLocations(hostedgp, outputName)

        write_to_datastore = False
        reportpath = ""
        if outAccuracyReport != "":
            outdict = {}
            datastoreName = ""
            outAccuracyReportName = ""
            outdict = rasterutils._parsecontext(outAccuracyReport)
            if "uri" in outdict:
                datastoreName = outdict["uri"]

            if datastoreName.startswith("/fileShares"):
                arcpy.AddMessage("Output data store path: {}".format(datastoreName))
                reportpath = rasterutils._lookupdatastorepath(datastoreName)

                #arcpy.AddMessage("Output file share path: {}".format(out_folder))
                # Now check if the folder is writable
                if not _check_writable(os.path.dirname(reportpath)):
                    arcpy.AddMessage("Output data store path is not writable.")
                write_to_datastore = True
            elif datastoreName.startswith("/rasterStores"):
                arcpy.AddMessage("Output raster store path: {}".format(datastoreName))
                reportpath = rasterutils._lookupdatastorepath(datastoreName)
                #arcpy.AddMessage("Output file share path: {}".format(out_folder))
                # Now check if the folder is writable
                write_to_datastore = True
            else:
                outdict = {}
                outdict = _parseReportoutput(outAccuracyReport)
                if "name" in outdict and outdict["name"]:
                    outAccuracyReportName = outdict["name"]
                    scratchFolder = arcpy.env.scratchFolder
                    reportpath = os.path.join(scratchFolder, outAccuracyReportName) 
                
        if reportpath != "":
            if not (reportpath.lower().endswith('.pdf')):
                reportpath = reportpath + '.pdf'
            if write_to_datastore:
                if not (datastoreName.lower().endswith('.pdf')):
                    datastoreName = datastoreName + '.pdf'

        arcpy.gp.ComputeAccuracyForObjectDetection_ia(
            detectedFeatures,
            groundTruthFeatures,
            dsFcPath,
            reportpath,
            detectedClassValueField,
            groundTruthClassValueField,
            minIoU,
            maskFeatures)
        # Creating drawing info
        output_lyr = PAOutputFeatureLayer(dsFcPath)  # Create an instance of PAOutputFeatureLayer
        publisher = FeatureServiceLayerPublisher(json.loads(outAccuracyTableName))
        publisher.add_layer_to_publish(output_lyr, 9, "ComputeAccuracyforObjectDetection", layer_index=0)
        publisher.publish()
        update_item_properties = {
            "typeKeywords": 'Table'
        }
        hostedgp = hgp.HostedGP(None, None, False)
        opjson = arcpy.GetParameterAsText(9)
        opdict = json.loads(opjson)
        output_item_id=None
        if "itemId" in opdict:
            output_item_id = json.loads(opjson)["itemId"]
            hostedgp.UpdateItem(output_item_id, update_item_properties)

        outval = {}
        if reportpath != "":
            if not write_to_datastore and outAccuracyReportName!="":
                if os.path.exists(reportpath):                    
                    hostedgp = hgp.HostedGP(None, None, False)
                    params = {
                        "title": outAccuracyReportName,
                        "type": "PDF",
                        "multipart": True,
                        "file": reportpath,
                        "filename": outAccuracyReportName,
                        "tags": outAccuracyReportName,
                        "typeKeywords": "Data, Document, PDF"
                    }
                    props = {
                        "folderId": ""
                    }
                    if "folderId" in outdict and outdict["folderId"]:
                        props["folderId"] = outdict["folderId"]
                    if "itemProperties" in outdict and outdict["itemProperties"]:
                        props.update(outdict["itemProperties"])

                    # Check if item exist, if item exists, use Update Item call
                    # Otherwise, add Item. 
                    itemid=None
                    if "itemId" in outdict and outdict["itemId"]:
                        itemid = outdict["itemId"]

                    if itemid:
                        hostedgp.UpdateItem(itemid, params, props)
                        reportItem = itemid
                        arcpy.AddMessage("Updating existing Accuracy Report(PDF) item to the portal succeeded.")
                    else:
                        reportItem = hostedgp.AddItem(params, props)
                        arcpy.AddMessage("Adding Accuracy Report(PDF) item to the portal succeeded.")
                        arcpy.AddMessage(reportItem)


                    outval.update({"itemId" : reportItem})
                    arcpy.SetParameter(10, json.dumps(outval))
                else:
                    arcpy.AddMessage("Cannot generate accuracy report.")
            else:
                if os.path.exists(reportpath):
                    outval["uri"] = datastoreName
                    arcpy.SetParameter(10, json.dumps(outval))
                else:
                    arcpy.AddMessage("Failed to generate accuracy report.")


    except rasterutils.LicenseError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))



if __name__ == '__main__':
    execute()
