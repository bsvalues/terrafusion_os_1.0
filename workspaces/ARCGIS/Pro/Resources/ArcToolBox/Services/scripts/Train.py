"""-----------------------------------------------------------------------------
Name:           Train.py
Purpose:        Run training 
Author:         Esri Inc.
Created:        07/25/2016
Copyright:      (c)   Esri, Inc. 2016
ArcGIS Version: 10.5
-----------------------------------------------------------------------------"""
# core libraries
import json
import os
from datetime import datetime
import shutil

# internal libraries
import arcpy
import hostedgp as hgp
import rasterutils

TASK_NAME = 'TrainClassifier'


def JSON2Feature(esrijson):
    """
    Convert Esri JSON to temporary feature class
    :param esrijson: Esri JSON string describing a feature class
    :return: temporary feature class path or string as is.
    """
    try:
        tempfolder = arcpy.env.scratchFolder
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        tempjsonfile = os.path.join(tempfolder, "fs" + timestamp + ".json")
        tempshp = os.path.join(tempfolder, "fc" + timestamp + ".shp")
        # arcpy.AddMessage(tempshp)

        arcpy.AddMessage("Prepare training feature.")
        jsonlist = list(rasterutils.getJSON(esrijson))
        if jsonlist:
            with open(tempjsonfile, "w") as f:
                f.write(json.dumps(jsonlist[0]))
            arcpy.JSONToFeatures_conversion(tempjsonfile, tempshp)
            if arcpy.Exists(tempshp):
                return tempshp
            else:
                arcpy.AddMessage("Training feature JSON is not supported.")
                return None
        # Not a JSON, return None
        else:
            return None

    # If cannot convert JSON string to feature class, return None
    except arcpy.ExecuteError as err:
        return None
    except Exception as err:
        return None


def parseClassifierParams(params):
    """
    parse the input training parameters to the format acceptable by the core tool
    :param clsParams: classifier parameters in JSON
    e.g. {"method":"rt","params":{"maxNumTrees":50,"maxTreeDepth":30,"maxSampleClass":1000}}
    :return: parameter dictionary for different classifier
    """
    # Define default parameter for different classifier
    classifier = {
        "svm": {
            "maxSampleClass": 1000
        },
        "rt": {
            "maxNumTrees": 50,
            "maxTreeDepth": 30,
            "maxSampleClass": 1000
        },
        "iso": {
            "maxNumClasses": 20,
            "maxIteration": 20,
            "minNumSamples": 20,
            "skipFactor": 10,
            "maxNumMerge": 5,
            "maxMergeDist": 0.5
        },
        "mlc": None,
        "knn": {
            "numOfNeighbors" : 1,
            "maxSampleClass": 1000
        }
    }
    try:
        paramslist = list(rasterutils.getJSON(params))
        if paramslist:
            params = paramslist[0]
            # arcpy.AddMessage("DEBUG: " + str(params))
            if "method" in params:
                if params["method"] in classifier:
                    if "params" in params and isinstance(params["params"], dict):
                        dparams = classifier[params["method"]]
                        newparams = params["params"]
                        for param in newparams.keys():
                            if param in dparams:
                                dparams[param] = newparams[param]
                        params["params"] = dparams
                    else:
                        params["params"] = classifier[params["method"]]
                    return params
        return None
    except Exception as err:
        return None


def trainClassifer(inRas, trainShp, params, segRas, segAttr, dimensionValueField):
    """
    Main method to train classifer
    :param inRas: input raster
    :param trainShp: input training samples
    :param clrparams: classifier parameter as a non-empty dictionary
    :param segRas: segmented additional raster
    :param segAttr: attributes for segmented raster
    :return: training signature JSON (i.e. ecd file content)
    """
    try:
        tempfolder = arcpy.env.scratchFolder
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        tempecd = os.path.join(tempfolder, "train" + timestamp + ".ecd")
        # arcpy.AddMessage(tempecd)
        if params["method"] == "rt":
            mnt = params["params"]["maxNumTrees"]
            mtd = params["params"]["maxTreeDepth"]
            msc = params["params"]["maxSampleClass"]
            arcpy.ia.TrainRandomTreesClassifier(
                in_raster=inRas, in_training_features=trainShp, out_classifier_definition=tempecd,
                in_additional_raster=segRas, max_num_trees=mnt, max_tree_depth=mtd,
                max_samples_per_class=msc, used_attributes=segAttr, dimension_value_field=dimensionValueField)
        elif params["method"] == "svm":
            msc = params["params"]["maxSampleClass"]
            # arcpy.AddMessage("DEBUG: " + inRas)
            # arcpy.AddMessage("DEBUG: " + trainShp)
            # arcpy.AddMessage("DEBUG: " + str(msc))
            arcpy.ia.TrainSupportVectorMachineClassifier(
                in_raster=inRas, in_training_features=trainShp, out_classifier_definition=tempecd,
                in_additional_raster=segRas, max_samples_per_class=msc,
                used_attributes=segAttr, dimension_value_field=dimensionValueField)
        elif params["method"] == "mlc":
            arcpy.ia.TrainMaximumLikelihoodClassifier(
                in_raster=inRas, in_training_features=trainShp, out_classifier_definition=tempecd,
                in_additional_raster=segRas, used_attributes=segAttr, dimension_value_field=dimensionValueField)
        elif params["method"] == "iso":
            mnc = params["params"]["maxNumClasses"]
            mit = params["params"]["maxIteration"]
            mns = params["params"]["minNumSamples"]
            sf = params["params"]["skipFactor"]
            mnm = params["params"]["maxNumMerge"]
            mmd = params["params"]["maxMergeDist"]
            arcpy.ia.TrainIsoClusterClassifier(
                in_raster=inRas, max_classes=mnc, out_classifier_definition=tempecd,
                in_additional_raster=segRas, max_iterations=mit, min_samples_per_cluster=mns,
                skip_factor=sf, used_attributes=segAttr, max_merge_per_iter=mnm,
                max_merge_distance=mmd)
        elif params["method"] == "knn":
            knn = params["params"]["numOfNeighbors"]
            msc = params["params"]["maxSampleClass"]
            arcpy.ia.TrainKNearestNeighborClassifier(
                in_raster=inRas, in_training_features=trainShp, out_classifier_definition=tempecd,
                in_additional_raster=segRas, kNN=knn,
                max_samples_per_class=msc, used_attributes=segAttr, dimension_value_field=dimensionValueField)

        if os.path.exists(tempecd):
            return tempecd
        else:
            arcpy.AddError("Cannot generate training signature, no error returned.")
            arcpy.AddMessage(arcpy.GetMessages())
            return None

    except arcpy.ExecuteError:
        rasterutils.AddExceptionError(
            TASK_NAME, "ExecuteError during service Execution. \n" + arcpy.GetMessages())
        return None

    except KeyError:
        rasterutils.AddExceptionError(
            TASK_NAME, "Unsupported classifier parameter. \n" + str(clrparams))
        return None

    except Exception as err:
        rasterutils.AddExceptionError(
            TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
        return None


def _parseEcdOutput(outputEcd):
    """
    This private function is used to parse the ecd output. It can be expanded to
    include more item meta data if needed. "name" value is required.
    :param outEcd: output ECD item JSON
    e.g. {"name": "findtrees", "folderId": "nodsfiajoirejiojenoiwnioew", "itemProperties": {}}
    :return: JSON definition of report output.
    """
    try:
        reportList = list(rasterutils.getJSON(outputEcd))
        if not reportList:
            arcpy.AddMessage("Invalid output ECD item JSON.")

        # Make sure dlpk has name and name value is not empty
        reportjson = reportList[0]
        if "name" in reportjson and reportjson["name"]:
            return reportjson
        elif "uri" in reportjson and reportjson["uri"]:
            return reportjson
        else:
            arcpy.AddMessage("Invalid output ECD item JSON, Missing name. ")

        return {}
    except Exception as err:
        arcpy.AddMessage("Invalid output ECD item JSON")
        arcpy.AddMessage(err)
        return {}

if __name__ == '__main__':

    inRas = arcpy.GetParameterAsText(0)  # Input image service to be trained on
                                         # e.g. {"url":"http://a/a/b/imageserver"},
                                         # or {"uri":"http://a/a/b/c"},
                                         # or {"itemId":"abcdefghijklmnopqrstuvwxyz"}
    clsParams = arcpy.GetParameterAsText(1)  # classifier parames in JOSN,
                                             # e.g. '{"method":"rt","params":{"maxNumTrees":50,"maxTreeDepth":30,"maxSampleClass":1000}}'
    trainSmp = arcpy.GetParameterAsText(2)  # Training sample feature class can either be esri JSON or feature service URL
    segRas = arcpy.GetParameterAsText(3)  # segmented raster image service
    segAttr = arcpy.GetParameterAsText(4)  # e.g. "COLOR;MEAN;STD;COUNT;COMPACTNESS;RECTANGULARITY"
    dimensionValueField = arcpy.GetParameterAsText(5)
    outputEcdItemName = arcpy.GetParameterAsText(7)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Convert input training to feature class if it is Esri JSON
        # The input training feature could be either a esri JSON describing a feature class
        # or a feature service url.
        # e.g. {....} or {"url", "https://.../MapServer/0"} or {"itemId": "...."}
        trainSmp = rasterutils.getInDataPath(trainSmp)
        # Try convert the input shape file, if not working, then use original input
        trainShp = JSON2Feature(trainSmp)
        if trainShp:
            trainSmp = trainShp
        # arcpy.AddMessage(trainSmp)

        # 2. parse input raster, additional raster input can also be "url", "uri" or "itemId".
        inRas = rasterutils.getInDataPath(inRas)
        if isinstance(inRas, dict):
            inRas = json.dumps(inRas)
        segRas = rasterutils.getInDataPath(segRas)
        if isinstance(segRas, dict):
            inRas = json.dumps(segRas)
        # arcpy.AddMessage(inRas)
        # arcpy.AddMessage(segRas)

        # 3. parse classifier parameters
        clrparams = parseClassifierParams(clsParams)
        # arcpy.AddMessage("DEBUG: Renewed " + str(clrparams))

        # 4. start training
        if clrparams:
            arcpy.AddMessage("Training...")
            ecd = trainClassifer(
                inRas, trainSmp, clrparams, segRas, segAttr, dimensionValueField)

            arcpy.AddMessage("Training completed.")
            if ecd:
                # Convert ecd file to JSON
                with open(ecd, 'r') as ecdf:
                    ecdJSON = ecdf.read().replace('\n', '')
                # return the string to client
                arcpy.SetParameterAsText(6, ecdJSON)

                if outputEcdItemName != "":
                    ecd_out_dict = _parseEcdOutput(outputEcdItemName)
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

                        # Check if item exists, if yes, use Update Item call
                        # Else, add item
                        itemid = None
                        if "itemId" in ecd_out_dict and ecd_out_dict["itemId"]:
                            itemid = ecd_out_dict["itemId"]
                        
                        if itemid:
                            hostedgp_ecd.UpdateItem(itemid, ecd_params, props)
                            ecd_item = itemid
                            arcpy.AddMessage("Updating existing Esri Classifier Definition (ECD) item to the portal succeded.")
                        else:
                            ecd_item = hostedgp_ecd.AddItem(ecd_params, props)
                            arcpy.AddMessage("Adding Esri Classifier Definition (ECD) item to the portal.")

                        ecd_item_outval.update({"itemId": ecd_item})
                        arcpy.SetParameter(8, json.dumps(ecd_item_outval))
            else:
                arcpy.SetParameterAsText(6, "")
        else:
            arcpy.AddError("Unsupported classifier parameter.")
            arcpy.SetParameterAsText(6, "")

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))