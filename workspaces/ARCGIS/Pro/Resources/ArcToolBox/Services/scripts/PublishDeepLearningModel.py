"""-----------------------------------------------------------------------------
Name:              PublishDeepLearningModel.py
Purpose:
Author:            Esri Inc.
Created:           04/13/2019
Copyright:   (c)   Esri, Inc. 2014
ArcGIS Version:    10.81
-----------------------------------------------------------------------------"""
# core libraries
import json
import requests
import time
from pathlib import Path
import shutil

# internal libraries
import arcpy
import hostedgp as hgp
import rasterutils
import os
import sys

TASK_NAME = 'PublishDeepLearningModel'

def _parsedlpkoutput(outdlpk):
    """
    This private function is used to parse the dlpk output. It can be expanded to
    include more item meta data if needed. "name" value is required.
    :param outdlkp: output dlpk JSON
    e.g. {"name": "findtrees", "folderId": "nodsfiajoirejiojenoiwnioew", "itemProperties": {}}
    :return: JSON definition of DLPK output.
    """
    try:
        dlpklist = list(rasterutils.getJSON(outdlpk))
        if not dlpklist:
            arcpy.AddError("Invalid output: the returned Deep Learning Package JSON is empty.")

        # Make sure dlpk has name and name value is not empty
        dlpkjson = dlpklist[0]
        if "name" in dlpkjson and dlpkjson["name"]:
            dlpk = dlpkjson
            return dlpk
        else:
            arcpy.AddError("Invalid output: the returned Deep Learning Package JSON is missing name.")

        return {}
    except Exception as err:
        arcpy.AddError("Invalid output: error occurred when parsing the Deep Learning Package JSON.")
        arcpy.AddError(err)
        return {}


def _create_dlpk_file(zipname, path): 
    scratch_folder = arcpy.env.scratchFolder 
    zip_file = shutil.make_archive(os.path.join(scratch_folder, zipname), 'zip', path)
    dlpk_base = os.path.splitext(zip_file)[0]
    os.rename(zip_file, dlpk_base + '.dlpk')
    dlpk_file = dlpk_base+'.dlpk'
    return dlpk_file


def _listFilesWithExt(path, ext):
    filesList = []
    if isinstance(ext, list):
        ext = tuple(ext)
    for fname in os.listdir(path):
        if fname.endswith(ext):
            filesList.append(os.path.join(path, fname))
    return filesList


if __name__ == '__main__':

    """
    Parse parameters and execute service
    :return: result feature service layer
    """
    dlpk_datastore_location = arcpy.GetParameterAsText(0)
    output_name = arcpy.GetParameterAsText(1)
    overwritedlpk = arcpy.GetParameter(2)

    try:
        # 0. Check Image Server extension license

        # Note: the output should only be a name string, which will become the name
        # of the dlpk item published on portal, and the folder name that contains the
        # training model file
        # Optionally the user can also give a portal folder Id
        outdlpk = {}
        outdlpk = _parsedlpkoutput(output_name)
        if not outdlpk:
            sys.exit(2)
        output_name = outdlpk["name"]

        dlpk_file = ""
        emd_file = ""
        modelInfo = {}

        # download model or dlpk to local folder if from cloud store
        # the input dlpk data store location could be a folder path or a single dlpk file path
        if dlpk_datastore_location.startswith("/fileShares/") or dlpk_datastore_location.startswith("/rasterStores"):
            dlpkfile_path = rasterutils._lookupdatastorepath(dlpk_datastore_location)
            if dlpkfile_path.startswith("/cloudStores/") or dlpkfile_path.startswith("/vsi"):
                # Only transfer dlpk file if only dlpk is given from cloud store
                if dlpkfile_path.endswith(".dlpk"):
                    scratch_fld = arcpy.env.scratchFolder + "/" + os.path.splitext(os.path.basename(dlpkfile_path))[0]
                    arcpy.gp.command("TransferFiles '" + dlpkfile_path + "' '" + scratch_fld + "'")
                    dlpkfile_path = scratch_fld + "/" + os.path.basename(dlpkfile_path)
                else:
                    scratch_fld = arcpy.env.scratchFolder + "/" + os.path.basename(dlpkfile_path)
                    arcpy.gp.command("TransferFiles '" + dlpkfile_path + "' '" + scratch_fld + "'")
                    dlpkfile_path = scratch_fld
        elif dlpk_datastore_location.startswith("/cloudStores/") or dlpk_datastore_location.startswith("/vsi"):
            # Only transfer dlpk file if only dlpk is given from cloud store
            if dlpk_datastore_location.endswith(".dlpk"):
                scratch_fld = arcpy.env.scratchFolder + "/" + os.path.splitext(os.path.basename(dlpk_datastore_location))[0]
                arcpy.gp.command("TransferFiles '" + dlpk_datastore_location + "' '" + scratch_fld + "'")
                dlpkfile_path = scratch_fld + "/" + os.path.basename(dlpk_datastore_location)
            else:
                scratch_fld = arcpy.env.scratchFolder + "/" + os.path.basename(dlpk_datastore_location)
                arcpy.gp.command("TransferFiles '" + dlpk_datastore_location + "' '" + scratch_fld + "'")
                dlpkfile_path = scratch_fld            
        else:
            arcpy.AddError("Invalid Datastore Path")

        # Now start to publish deep learning model either from file or folder
        if dlpkfile_path.endswith(".dlpk"):
            dlpk_file = dlpkfile_path
            # Search for emd file under the same folder as .dlpk, if not found, assume it is not available.
            emdlist = _listFilesWithExt(os.path.dirname(dlpkfile_path), ".emd")
            if (len(emdlist)==1):
                emd_file = emdlist[0]
        else:
            filesList = _listFilesWithExt(dlpkfile_path, ".dlpk")
            if (len(filesList)>0):
                dlpk_file = filesList[0]
            else:
                filesList = _listFilesWithExt(dlpkfile_path, ".emd")
                if (len(filesList)==0):
                    arcpy.AddError("Folder does not contain an Esri model definition file. Invalid location. ")
                    sys.exit(2)
                else:
                    emd_file = filesList[0]

                exts  = (".h5", ".model", ".pth", ".pkl" )
                filesList = _listFilesWithExt(dlpkfile_path, exts)
                if (len(filesList)==0):
                    arcpy.AddError("Folder does not contain a model file. Invalid location. ")
                    sys.exit(2)
                dlpk_file = _create_dlpk_file(output_name, dlpkfile_path)
        

        # Query deep learning model info then cache the info in DLPK item. 
        if os.path.exists(emd_file):
            returnInfo = arcpy.gp.command("QueryDeepLearningModelInfo '" + emd_file + "'")
            if returnInfo:
                try:
                    emodelInfo = eval(returnInfo)
                    if isinstance(emodelInfo, dict):
                        modelInfo = emodelInfo
                except Exception as err:
                    pass

        # 6. Publish the *.zip or *.dlpk file in the outModel folder, delete the rest files in the folder
        outval = {}
        if os.path.exists(dlpk_file):
            hostedgp = hgp.HostedGP(None, None, False)
            params = {
                "title": output_name,
                "type": "Deep Learning Package",
                "multipart": True,
                "file": dlpk_file,
                "filename": output_name,
                "tags": "imagery",
                "typeKeywords": ["Deep Learning","Deep Learning Package","dlpk"]
            }
            props = {
                "folderId": ""
            }
            if "folderId" in outdlpk and outdlpk["folderId"]:
                props["folderId"] = outdlpk["folderId"]
            if "itemProperties" in outdlpk and outdlpk["itemProperties"]:
                props.update(outdlpk["itemProperties"])
            if modelInfo:
                params["properties"] = {"modelInfo": modelInfo}
                if "ModelType" in modelInfo and isinstance(modelInfo["ModelType"], str):
                    params["typeKeywords"].append("ModelType_" + modelInfo["ModelType"])

            # Check if item exist, if item exists, use Update Item call
            # Otherwise, add Item. 
            itemid=None
            if "itemId" in outdlpk and outdlpk["itemId"]:
                itemid = outdlpk["itemId"]

            if itemid:
                hostedgp.UpdateItem(itemid, params, props)
                dlpkitem = itemid
                arcpy.AddMessage("Updating existing Deep Learning Package item to the portal succeeded.")
            else:
                itemid=None
                itemid = rasterutils.checkitemExist(os.path.basename(dlpk_file),"Deep Learning Package", hostedgp)
                if itemid and overwritedlpk:
                    hostedgp.UpdateItem(itemid, params, props)
                    dlpkitem = itemid
                    arcpy.AddMessage("Updating existing Deep Learning Package item to the portal succeeded.")
                else:
                    dlpkitem = hostedgp.AddItem(params, props)
                    arcpy.AddMessage("Adding new Deep Learning Package item to the portal succeeded.")
                    arcpy.AddMessage(dlpkitem)

            outval["itemId"] = dlpkitem
        else:
            arcpy.AddError("Failed to find Deep Learning Package *.dlpk file.")

        arcpy.SetParameterAsText(3, json.dumps(outval))

    except arcpy.ExecuteError as err:
        rasterutils.AddExceptionError(TASK_NAME, arcpy.GetMessages())

    except hgp.GPCloudExec as err:
        rasterutils.AddExceptionError(TASK_NAME, "Exception raised during publishing Deep Learning Package item: "
                                      + str(err))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)