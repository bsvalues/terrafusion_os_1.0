"""-----------------------------------------------------------------------------
Name:              QueryDeepLearningModelInfo.py
Purpose:           This Raster Analysis tool to return the deep learning information
Author:            Esri Inc.
Created:           03/13/2018
Copyright:   (c)   Esri, Inc. 2018
ArcGIS Version:    10.7
-----------------------------------------------------------------------------"""
# core libraries
import json
import os
from shutil import copy

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'QueryDeepLearningModelInfo'


if __name__ == '__main__':

    modelDefinition = arcpy.GetParameterAsText(0)  

    try:
        # Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Parsing the input, it could be:
        # itemId of dlpk item
        # item URL of dlpk item
        # emd model file path
        #     e.g. \\server\folder\abc.emd
        #       or /fileShares/folder/abc.emd
        #       or /rasterStores/folder/abc.emd
        model = rasterutils.getInDataPath(modelDefinition)
        iid = os.path.basename(model)
        modelInfo = None
        model_fld = ""
        updateItem = False

        # Check availability of DLPK item info first
        dlpkIteminfo = rasterutils._getItemJSONData(iid)
        # Note: since tool support multiple input format, we only need to update item
        # when we can read item properties but when it has no deep learning model info in it. 
        if dlpkIteminfo and isinstance(dlpkIteminfo, dict):
            if "properties" in dlpkIteminfo and isinstance(dlpkIteminfo["properties"], dict):
                if "modelInfo" in dlpkIteminfo["properties"]:
                    if dlpkIteminfo["properties"]["modelInfo"]:
                        modelInfo = dlpkIteminfo["properties"]["modelInfo"]
                    else:
                        updateItem = True
            else:
                updateItem = True

        # If didn't find model info from item properties, start querying the model
        if not modelInfo:
            returnInfo = arcpy.gp.command(
                "QueryDeepLearningModelInfo '" + model + "'")

            if returnInfo:
                # Parse output model info
                try:
                    emodelInfo = eval(returnInfo)
                    if isinstance(emodelInfo, dict):
                        modelInfo = emodelInfo
                except SyntaxError as err:
                    outmsglist = returnInfo.split("\n")
                    for msg in outmsglist:
                        if "is not a valid model definition" in msg:
                            arcpy.AddError(msg)
                        if msg.startswith("Unable to initialize python raster function"):
                            arcpy.AddError(msg)
                        if msg.startswith("Exception"):
                            arcpy.AddError(msg)
                    arcpy.AddError("Unable to read deep learning model definition.")
                except Exception as err:
                    arcpy.AddError("Unexpected error when reading deep learning model definition.")

        # Read the model definition path
        if modelInfo and isinstance(modelInfo, dict):
            if "ModelDefinition" in modelInfo:
                installed_model = modelInfo["ModelDefinition"]
                if installed_model.lower().endswith(".emd") or installed_model.lower().endswith(".dlpk"):
                    model_fld = os.path.dirname(installed_model)
                else:
                    model_fld = installed_model
                modelInfo.pop("ModelDefinition")

        # Identify model folder
        if os.path.exists(model_fld):
            pass
        elif model.lower().endswith(".emd") or model.lower().endswith(".dlpk"):
            # Transform file share and raster store path first
            if model.startswith("/fileShares") or model.startswith("/rasterStores"):
                model = rasterutils._lookupdatastorepath(model)
            model_fld = os.path.dirname(model)
        else:
            model_fld = model

        # Check if the path is from cloud store
        inCloud = False
        if model.startswith("/cloudStores") or model.startswith("/vsi"):
            inCloud = True

        # Return model characteristics and model report
        modelchar = model_fld + "/ModelCharacteristics/training_validation_loss.json"
        modelreport = model_fld + "/model_metrics.html"

        # a. work on model characteristics first
        if not os.path.exists(modelchar):
            # If model characteristics file does not already exist, check the cloud store
            if inCloud:
                cloud_modelchar_exist = False
                # Check existence of model characteristics
                modelchar_fld = model_fld + "/ModelCharacteristics"
                ds_content = arcpy.gp.command("ListDatastore '" + modelchar_fld + "'")
                char_list = rasterutils.eval_data_list(ds_content)
                if char_list and isinstance(char_list, list):
                    for mchar in char_list:
                        if mchar.endswith("training_validation_loss.json"):
                            cloud_modelchar_exist = True
                            break

                # Retrieve model characteristics file from cloud store
                # Transfer only the json file from cloud to scratch folder
                if cloud_modelchar_exist:
                    scratch_fld = arcpy.env.scratchFolder + "/temp_modelcharfld"
                    arcpy.gp.command("TransferFiles '" + modelchar + "' '" + scratch_fld + "'")
                    modelchar = scratch_fld + "/" + os.path.basename(modelchar)

        # Now return the model characteristics info if file can be retrieved
        if os.path.exists(modelchar) and isinstance(modelInfo, dict):
            try:
                with open(modelchar,) as f:
                    modelcharjson = json.load(f)
                    modelInfo["modelCharacteristics"] = modelcharjson
            except Exception as err:
                arcpy.AddWarning("Invalid training validation loss info.")

        # a. work on model report second
        if not os.path.exists(modelreport):
            # If model report file does not already exist, check the cloud store
            if inCloud:
                cloud_modelreport_exist = False
                # Check exitence of model report
                ds_content = arcpy.gp.command("ListDatastore '" + model_fld + "'")
                file_list = rasterutils.eval_data_list(ds_content)
                if file_list and isinstance(file_list, list):
                    for mfile in file_list:
                        if mfile.endswith("model_metrics.html"):
                            cloud_modelreport_exist = True
                            break

                # Retrieve model report file from cloud store
                if cloud_modelreport_exist:
                    # Always transfer report to scratch folder
                    scratch_fld = arcpy.env.scratchFolder + "/temp_modelreportfld"
                    # Transfer file has to transfer to a non-existing folder
                    arcpy.gp.command("TransferFiles '" + modelreport + "' '" + scratch_fld + "'")
                    modelreport = scratch_fld + "/" + os.path.basename(modelreport)

        # the report file has to reside in the scratch folder for GP service to return download link
        if os.path.exists(modelreport):
            copy(modelreport, arcpy.env.scratchFolder)

        modelreport = arcpy.env.scratchFolder + "/" + os.path.basename(modelreport)
        if os.path.exists(modelreport):
            arcpy.SetParameter(2, modelreport)
        
        # Check if the item properties has model info, if not, update it with item properties
        if updateItem and dlpkIteminfo and modelInfo:
            modelType = ""
            if "ModelType" in modelInfo and isinstance(modelInfo["ModelType"], str):
                modelType = "ModelType_" + modelInfo["ModelType"]
            if "typeKeywords" in dlpkIteminfo and isinstance(dlpkIteminfo["typeKeywords"], list) and modelType:
                replaceKW = False
                for i in range(len(dlpkIteminfo["typeKeywords"])):
                    if dlpkIteminfo["typeKeywords"][i].startswith("ModelType_"):
                        dlpkIteminfo["typeKeywords"][i] = modelType
                        replaceKW = True
                if not replaceKW:
                    dlpkIteminfo["typeKeywords"].append(modelType)
            
            if "properties" in dlpkIteminfo and isinstance(dlpkIteminfo["properties"], dict):
                dlpkIteminfo["properties"]["modelInfo"] = modelInfo
            else:
                dlpkIteminfo["properties"] = {"modelInfo": modelInfo}

            rasterutils.updateItemProperties(iid, dlpkIteminfo)
        
        # Set the output model info return string
        arcpy.SetParameterAsText(1, json.dumps({"modelInfo": modelInfo}))

    except arcpy.ExecuteError as err:
        rasterutils.AddExceptionError(TASK_NAME, err)

    except Exception as err:
        rasterutils.AddExceptionError(
            TASK_NAME, "Unexpected Error occurred during service Execution. " + str(err))
