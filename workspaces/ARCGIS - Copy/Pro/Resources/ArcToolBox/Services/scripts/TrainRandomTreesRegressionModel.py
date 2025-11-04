"""-----------------------------------------------------------------------------
Name:           TrainRandomTreesRegressionModel.py
Purpose:        Creates a random trees regression model 
Author:         Esri Inc.
Created:        05/25/2021
Copyright:      (c)   Esri, Inc. 2021
ArcGIS Version: 10.9.1
-----------------------------------------------------------------------------"""
# core libraries
import json
import os
import sys
from datetime import datetime
import time

# internal libraries
import arcpy
import rasterutils
import aolutils
import hostedgp as hgp
import popup
import rendererUtils

scriptsx = os.path.join(os.path.split(os.path.dirname(__file__))[0], "scriptsx")
sys.path.append(scriptsx)
from common import PAOutputFeatureLayer, FeatureServiceLayerPublisher

TASK_NAME = "TrainRandomTreesRegressionModel"
errorMsgs = {
    120201: "A service already exists with this name. Please use a different name."
}


# Output feature layer description
outputLayerDesc = {"layers": [
    {"position":16,
     "catalogPath":"",
     "name": "TrainRandomTreesRegressionModel",
     "id": 0,
     "properties":{
         "drawingInfo":"",
         "popupInfo":""
     }}
]}


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
    :param outReport: output report JSON
    e.g. {"name": "findtrees", "folderId": "nodsfiajoirejiojenoiwnioew", "itemProperties": {}}
    :return: JSON definition of report output.
    """
    try:
        reportList = list(rasterutils.getJSON(outReport))
        if not reportList:
            arcpy.AddMessage("Invalid output item JSON.")

        # Make sure dlpk has name and name value is not empty
        reportjson = reportList[0]
        if "name" in reportjson and reportjson["name"]:
            return reportjson
        elif "uri" in reportjson and reportjson["uri"]:
            return reportjson
        else:
            arcpy.AddMessage("Invalid output item JSON, Missing name. ")

        return {}
    except Exception as err:
        arcpy.AddMessage("Invalid output item JSON")
        arcpy.AddMessage(err)
        return {}


def trainModel(inputRasters, inTargetData, targetValueField, targetDimensionField,
                rasterDimension, outputImportanceTableName, maxNumberOfTrees,
                maxTreeDepth, maxNumberOfSamples, averagePointsPerCell,
                percentSamplesForTesting, outputScatterPlotsName, outputSampleFeaturesName):
    
    try:
        # Create tempfolder and file to write regression model definition
        tempfolder = arcpy.env.scratchFolder
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        tempecd = os.path.join(tempfolder, "train_random_regression_tree_model_" + timestamp + ".ecd")

        arcpy.ia.TrainRandomTreesRegressionModel(inputRasters,
                                                inTargetData,
                                                tempecd,
                                                targetValueField,
                                                targetDimensionField,
                                                rasterDimension,
                                                outputImportanceTableName,
                                                maxNumberOfTrees,
                                                maxTreeDepth,
                                                maxNumberOfSamples,
                                                averagePointsPerCell,
                                                percentSamplesForTesting,
                                                outputScatterPlotsName,
                                                outputSampleFeaturesName)

        if os.path.exists(tempecd):
            return tempecd
        else:
            arcpy.AddError("Could not generate regression definition file, no error returned.")
            arcpy.AddMessage(arcpy.GetMessages())
            return None

    except arcpy.ExecuteError:
        rasterutils.AddExceptionError(
            TASK_NAME, "ExecuteError during service Execution. \n" + arcpy.GetMessages())
        return None

    except Exception as err:
        rasterutils.AddExceptionError(
            TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
        return None


if __name__ == '__main__':
    
    inputRasters = arcpy.GetParameterAsText(0)  # Input image service(s) to be trained on.
                                                # e.g. {"url": "http://a/a/b/imageserver"}; 
                                                #      {"urls": ["http://a/a/b/imageserver", "http://a/a/c/imageserver"]} 
                                                # or   {"uri": "http://a/a/b/imageserver"};
                                                #      {"uris": ["http://a/a/b/imageserver", "http://a/a/c/imageserver"]}
                                                # or   {"itemId": "abcdefghijklmnopqrstuvwxyz"}
                                                #      {"itemIds": ["abcdefghijklmnopqrstuvwxyz", "zyxwvutsrqponmlkjihgfedcba"]}
    
    inTargetData = arcpy.GetParameterAsText(1)  # Image or feature layer service containing target.
                                                # e.g. {"url": "http://a/a/b/imageserver"}; 
                                                # or   {"uri": "http://a/a/b/imageserver"};
                                                # or   {"itemId": "abcdefghijklmnopqrstuvwxyz"}
                                                # or   {"serviceProperties": {"name":"testlayer",
                                                #        "serviceUrl": https://myportal.domain.com/server/rest/services/Hosted/<name>/FeatureServer "},
                                                #        "itemProperties": {"itemId":"<item id>", "folderId":"<folder id>"}}
    
    targetValueField = arcpy.GetParameterAsText(2)
    targetDimensionField = arcpy.GetParameterAsText(3) 
    rasterDimension = arcpy.GetParameterAsText(4)
    outputImportanceTableName = arcpy.GetParameterAsText(5)
    maxNumberOfTrees = arcpy.GetParameterAsText(6)
    maxTreeDepth = arcpy.GetParameterAsText(7)
    maxNumberOfSamples = arcpy.GetParameterAsText(8)
    averagePointsPerCell = arcpy.GetParameterAsText(9)
    outputScatterPlotsName = arcpy.GetParameterAsText(10)
    outputSampleFeaturesName = arcpy.GetParameterAsText(11)
    percentSamplesForTesting = arcpy.GetParameterAsText(12)
    context = arcpy.GetParameterAsText(13)
    outputEcdItemName = arcpy.GetParameterAsText(19)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # Terminate the job if the output service created by this service tool exists
        if outputSampleFeaturesName != "":
            if not rasterutils.checkIfJobShouldContinueWithOutputService(outputSampleFeaturesName, "featureService"):
                rasterutils.AddErrorCode(120201, errorMsgs[120201])
                raise Exception

        hostedgp_feature_inp = hgp.HostedGP(13, 1)

        # 1. Parse the input parameters
        byref, ismosaic, inputRasters, allbyref = rasterutils.getHostedDataPath(inputRasters)
        if inputRasters:
            arcpy.AddMessage(f"Input rasters are: {inputRasters}")
        else:
            arcpy.AddError("Could not get input rasters.")

        if rasterutils.checkIfFeatureCollection(inTargetData):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp_feature_inp, "inTargetData", 1)
            inTargetData = Input.name
        else:
            inTargetData = rasterutils.getInDataPath(inTargetData)
            if inTargetData.find("/FeatureServer/") > -1 \
                    or inTargetData.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp_feature_inp, "inTargetData", 1)
                inTargetData = Input.name
            else:
                if isinstance(inTargetData, dict):
                    inTargetData = json.dumps(inTargetData)

        # 2.a. Check if outputImportanceTableName is specified
        dsFcpath = ""
        hostedgp_table = hgp.HostedGP(13, 5)
        if outputImportanceTableName != "":
            outputName = hostedgp_table.GetOutputName(5)
            # Check publishing privilege
            aolutils.checkPublishingPrivilege(hostedgp_table, outputName)

            # This parameter will be set when the tool is successful
            arcpy.SetParameterAsText(15, "")
            dsFcpath = aolutils.createOutputLocations(hostedgp_table, outputName)

        # 2.b. Check if outputSampleFeaturesName is specified
        dsFcpathFeatureClass = ""
        hostedgp_feature = hgp.HostedGP(13, 11)
        if outputSampleFeaturesName != "":
            outputNameFeatureClass = hostedgp_feature.GetOutputName(11)
            # Check publishing privilege
            aolutils.checkPublishingPrivilege(hostedgp_feature, outputNameFeatureClass)

            # This parameter will be set when the tool is successful
            arcpy.SetParameterAsText(16, "")
            dsFcpathFeatureClass = aolutils.createOutputLocations(hostedgp_feature, outputNameFeatureClass)

        # 3. Parse GP environment settings honored by this tool
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)

        write_to_datastore = False
        reportpath = ""
        if outputScatterPlotsName != "":
            outdict = {}
            datastoreName = ""
            outScatterPlotName = ""
            outdict = rasterutils._parsecontext(outputScatterPlotsName)
            if "uri" in outdict:
                datastoreName = outdict["uri"]
            
            if datastoreName.startswith("/fileShares"):
                arcpy.AddMessage("Output data store path: {}".format(datastoreName))
                reportpath = rasterutils._lookupdatastorepath(datastoreName)

                # Now check if the folder is writable
                if not _check_writable(os.path.dirname(reportpath)):
                    arcpy.AddError("Output data store path is not writable.")
                    sys.exit(2)
                write_to_datastore = True
            elif datastoreName.startswith("/rasterStores"):
                arcpy.AddMessage("Output raster store path: {}".format(datastoreName))
                reportpath = rasterutils._lookupdatastorepath(datastoreName)
                # Now check if the folder is writable
                write_to_datastore = True
            else:
                outdict = {}
                outdict = _parseReportoutput(outputScatterPlotsName)
                if "name" in outdict and outdict["name"]:
                    outScatterPlotName = outdict["name"]
                    if outScatterPlotName.lower().endswith(".html"):
                        outScatterPlotName = outScatterPlotName.replace(".html", ".pdf")
                    scratchFolder = arcpy.env.scratchFolder
                    reportpath = os.path.join(scratchFolder, outScatterPlotName)
                
        if reportpath != "":
            if write_to_datastore:
                if not reportpath.lower().endswith((".pdf", ".html")):
                    reportpath = reportpath + ".pdf"
                    datastoreName = datastoreName + ".pdf"
            else:
                if not reportpath.lower().endswith(".pdf"):
                    reportpath = reportpath + ".pdf"

        # 4. Execute tool =============================================================================
        ecd = trainModel(inputRasters,
                        inTargetData,
                        targetValueField,
                        targetDimensionField,
                        rasterDimension,
                        dsFcpath,
                        maxNumberOfTrees,
                        maxTreeDepth,
                        maxNumberOfSamples,
                        averagePointsPerCell,
                        percentSamplesForTesting,
                        reportpath,
                        dsFcpathFeatureClass)

        # Create drawing info
        if outputImportanceTableName != "":
            output_lyr = PAOutputFeatureLayer(dsFcpath)
            publisher = FeatureServiceLayerPublisher(json.loads(outputImportanceTableName))
            publisher.add_layer_to_publish(output_lyr, 15, "TrainRandomTreesRegressionModel", layer_index=0)
            publisher.publish()
            update_item_properties = {
                "typeKeywords": 'Table'
            }
            #hostedgp = hgp.HostedGP(None, None, False)
            opjson = arcpy.GetParameterAsText(15)
            opdict = json.loads(opjson)
            output_item_id = None
            if "itemId" in opdict:
                output_item_id = opdict["itemId"]
                hostedgp_table.UpdateItem(output_item_id, update_item_properties)

        # Create drawing info for feature layer
        if outputSampleFeaturesName != "":
            desc = arcpy.Describe(dsFcpathFeatureClass)
            arcpy.AddMessage("Creating drawing info for output feature layer.")
            drawingInfo = rendererUtils.getSimpleRendererInfo(desc.shapeType, TASK_NAME)

            if drawingInfo is not None:
                outputLayerDesc["layers"][0]["properties"]["drawingInfo"] = drawingInfo

            # Update Layer description with catalog path
            outputLayerDesc["layers"][0]["catalogPath"] = dsFcpathFeatureClass

            arcpy.AddMessage("Create popup info for output feature layer.")
            sampleFeatures_popupInfo = popup.PopupInfo("Train Random Trees Regression Model {}".format(outputSampleFeaturesName), "")
            sampleFeatures_popupInfo.addFieldInfo("Feature_Count", "Count of Feature")
            toOmitFieldNames = ["feature_count", desc.OIDFieldName.lower(), desc.ShapeFieldName.lower()]
            # Add all other fields
            for field in desc.fields:
                if field.name.lower() not in toOmitFieldNames:
                    label = field.aliasName.replace("_", " ").title()
                    if field.type.lower() == "double":
                        sampleFeatures_popupInfo.addFieldInfo(field.name, label, True)
                    else:
                        sampleFeatures_popupInfo.addFieldInfo(field.name, label)
            outputLayerDesc["layers"][0]["properties"]["popupInfo"] = sampleFeatures_popupInfo.getPopupInfo()
            #arcpy.AddMessage("Output feature layer description: {}".format(json.dumps(outputLayerDesc)))
            hostedgp_feature.ProcessFeatureOutput(json.dumps(outputLayerDesc, skipkeys=False, ensure_ascii=False))

        outval = {}
        if reportpath != "":
            if not write_to_datastore and outScatterPlotName != "":
                if os.path.exists(reportpath):
                    hostedgp = hgp.HostedGP(None, None, False)
                    params = {
                        "title": outScatterPlotName,
                        "type": "PDF",
                        "multipart": True,
                        "file": reportpath,
                        "filename": outScatterPlotName,
                        "tags": outScatterPlotName,
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
                    itemid = None
                    if "itemId" in outdict and outdict["itemId"]:
                        itemid = outdict["itemId"]

                    if itemid:
                        hostedgp.UpdateItem(itemid, params, props)
                        reportItem = itemid
                        arcpy.AddMessage("Updating existing Accuracy Report(PDF) item to the portal succeeded.")
                    else:
                        reportItem = hostedgp.AddItem(params, props)
                        arcpy.AddMessage("Adding Accuracy Report(PDF) item to the portal succeeded.")

                    outval.update({"itemId" : reportItem})
                    arcpy.SetParameter(17, json.dumps(outval))
                else:
                    arcpy.AddMessage("Cannot generate accuracy report.")
            else:
                if os.path.exists(reportpath):
                    outval["uri"] = datastoreName
                    arcpy.SetParameter(17, json.dumps(outval))
                else:
                    arcpy.AddMessage("Failed to generate accuracy report.")

        if ecd:
            arcpy.SetParameter(14, ecd)
            
            if outputEcdItemName != "":
                ecd_out_dict = _parseReportoutput(outputEcdItemName)
                ecd_item_outval = {}
                hostedgp_ecd = hgp.HostedGP(None, None, False)
                if "name" in ecd_out_dict and ecd_out_dict["name"]:
                    ecd_item_name = ecd_out_dict["name"]
                    ecd_params = {
                        "title": ecd_item_name,
                        "type": "Esri Classifier Definition",
                        "multipart": True,
                        "file": ecd,
                        "filename": ecd_item_name,
                        "tags": ecd_item_name,
                        "typeKeywords": "Data, Document, ECD"
                    }
                    props = {
                        "folderId": ""
                    }
                    if "folderId" in ecd_out_dict and ecd_out_dict["folderId"]:
                        props["folderId"] = ecd_out_dict["folderId"]
                    if "itemProperties" in ecd_out_dict and ecd_out_dict["itemProperties"]:
                        props.update(ecd_out_dict["itemProperties"])

                    # Check if item exist, if item exists, use Update Item call
                    # Otherwise, add Item. 
                    itemid = None
                    if "itemId" in ecd_out_dict and ecd_out_dict["itemId"]:
                        itemid = ecd_out_dict["itemId"]

                    if itemid:
                        hostedgp_ecd.UpdateItem(itemid, ecd_params, props)
                        ecd_item = itemid
                        arcpy.AddMessage("Updating existing Esri Classifier Definition (ECD) item to the portal succeeded.")
                    else:
                        ecd_item = hostedgp_ecd.AddItem(ecd_params, props)
                        arcpy.AddMessage("Adding ECD item to the portal succeeded.")

                    ecd_item_outval.update({"itemId": ecd_item})
                    arcpy.SetParameter(18, json.dumps(ecd_item_outval))
        else:
            arcpy.SetParameterAsText(14, "")


    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, "Image Analyst license is unavailable.")

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
