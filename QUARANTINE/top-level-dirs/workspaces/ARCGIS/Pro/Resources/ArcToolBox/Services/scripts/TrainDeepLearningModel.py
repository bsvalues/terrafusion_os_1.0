"""-----------------------------------------------------------------------------
Name:              TrainDeepLearningModel.py
Purpose:
Author:            Esri Inc.
Created:           09/24/2019
Copyright:   (c)   Esri, Inc. 2014
ArcGIS Version:    10.8
-----------------------------------------------------------------------------"""
# core libraries
import json
import time

# internal libraries
import arcpy
import hostedgp as hgp
import rasterutils
import os
import sys

TASK_NAME = 'TrainDeepLearningModel'


def _cleanup(modelfolder):
    try:
        if arcpy.Exists(modelfolder):
            arcpy.Delete_management(modelfolder)
    except Exception as err:
        arcpy.AddMessage(arcpy.GetMessages())


def _parsedlpkoutput(outdlpk):
    """
    This private function is used to parse the dlpk output. It can be expanded to
    include more item meta data if needed. "name" value is required.
    :param outdlpk: output dlpk JSON
    e.g. {"name": "findtrees", "folderId": "nodsfiajoirejiojenoiwnioew", "itemProperties": {}}
    :return: JSON definition of DLPK output.
    """
    try:
        dlpklist = list(rasterutils.getJSON(outdlpk))
        if not dlpklist:
            arcpy.AddError("Invalid output Deep Learning Package JSON.")

        # Make sure dlpk has name and name value is not empty
        dlpkjson = dlpklist[0]
        if "name" in dlpkjson and dlpkjson["name"]:
            dlpk = dlpkjson
            return dlpk
        else:
            arcpy.AddError("Invalid output Deep Learning Package JSON, Missing name. ")

        return {}
    except Exception as err:
        arcpy.AddError("Invalid output Deep Learning Package JSON.")
        arcpy.AddError(err)
        return {}


def _installdeeplearningmodel(dlpkitem):
    """
    This private function is used to intall deep learning package
    to the server.
    :dlpkitem: The deep learning package to be installed
    """
    try:
        install = arcpy.gp.command(
            "InstallDeepLearningModel " + dlpkitem)

        # Return the model's actual emd path.
        if "is not a valid model package item" in install:
            arcpy.AddError("Invalid Pre-trained model.")
            return dlpkitem

        # TODO: look up the actual path of "[resources]"
        return install
    except Exception as err:
        arcpy.AddError("Pre-trained Deep Learning Package installation failed.")
        arcpy.AddError(err)
        return dlpkitem

def _parsepretrainedmodel(modelitem):
    """
    This private function is used to the pre-trained model item
    :param modelitem: pre-trained model item with Id, url, or uri.
    e.g.:
    1) {"itemId": "dnofnaioerioew"}
    2) {"url":"https://www.arcgis.com/sharing/rest/content/items/01234abcd789"}
    3) {"uri":"/rasterStores/rasterstore/PreTrainedModel.dlpk}
    :return: the actual path of the pre-trained model file
    """
    modelpath = ""
    try:
        dlpklist = list(rasterutils.getJSON(modelitem))
        if not dlpklist:
            arcpy.AddError("Invalid Pre-trained model item.")

        # Make sure dlpk has name and name value is not empty
        dlpkjson = dlpklist[0]
        if "itemId" in dlpkjson and dlpkjson["itemId"]:
            dlpkitem = dlpkjson["itemId"]
            modelpath = _installdeeplearningmodel(dlpkitem)
        elif "url" in dlpkjson and dlpkjson["url"]:
            dlpkitem = dlpkjson["url"]
            modelpath = _installdeeplearningmodel(dlpkitem)
        elif "uri" in dlpkjson and dlpkjson["uri"]:
            modelpath = dlpkjson["uri"]
            datastore_prefixes = ("/rasterStores", "/fileShares", "/cloudStores")

            # Non-datastore path case. E.g., actual path or UNC path.
            # No path modification is needed.
            if not modelpath.startswith(datastore_prefixes):
                return modelpath

            from_cloud = False
            if modelpath.startswith("/cloudStores"):
                from_cloud = True
                model = modelpath
            elif modelpath.startswith("/rasterStores"):
                modelpath = rasterutils._lookupdatastorepath(modelpath)
                if modelpath.startswith("/cloudStore"):
                    from_cloud = True
                    model = modelpath
            elif modelpath.startswith("/fileShares"):
                modelpath = rasterutils._lookupdatastorepath(modelpath)

            if from_cloud:
                try:
                    arcpy.gp.command("TransferFiles '" + model + "' '" + arcpy.env.scratchFolder + "'")
                except Exception as err:
                    arcpy.AddError("Failed to transfer pre-trained deep learning package from cloud storage.")
                    return modelitem
                modelpath = arcpy.env.scratchFolder + "/" + os.path.basename(modelpath)

        else:
            arcpy.AddError("Invalid Pre-trained Deep Learning Package JSON.")
            arcpy.AddError("Pre-trained Deep Learning Package JSON requires either itemId, url, or uri.")
            return modelitem

        return modelpath
    except Exception as err:
        arcpy.AddError("Invalid Pre-trained model.")
        arcpy.AddError(err)
        return modelitem


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


if __name__ == '__main__':

    """
    Parse parameters and execute service
    :return: result feature service layer
    """
    inFolder = arcpy.GetParameterAsText(0)
    outputName = arcpy.GetParameterAsText(1)
    modelType = arcpy.GetParameterAsText(2)
    modelArguments = arcpy.GetParameterAsText(3)
    batchSize = arcpy.GetParameter(4)
    maxEpochs = arcpy.GetParameter(5)
    learningRate = arcpy.GetParameter(6)
    backboneModel = arcpy.GetParameterAsText(7)
    validationPercent = arcpy.GetParameterAsText(8)
    pretrainedModel = arcpy.GetParameterAsText(9)
    stopTraining = arcpy.GetParameter(10)
    overwritedlpk = arcpy.GetParameter(11)
    context = arcpy.GetParameterAsText(12)
    freezeModel = arcpy.GetParameter(14)

    # Prepare output folder variable for final clean up
    out_folder = ""
    outdlpk = ""
    # Boolean variable to check whether output is data store path
    write_to_datastore = False
    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # 1. Constructing input folder location
        # input folder can be in three formats:
        # 1) /rasterStores/rasterstore/TrainingSamples
        # 2) /fileShares/SharedFolder/TrainingSamples
        # 3) \\rasterqadl\rasterstore\TrainingSamples
        # 4) {"uri":"\\\\rasterqadl\\rasterstore\\TrainingSamples"}
        # 5) {"uris":["\\\\rasterqadl\\rasterstore\\TrainingSamples1", "\\\\rasterqadl\\rasterstore\\TrainingSamples2"]}
        # 6) \\rasterqadl\rasterstore\TrainingSamples,\\rasterqadl\rasterstore\TrainingSamples2
        
        in_fld = inFolder.replace("\\n","")
        fld_dict = list(rasterutils.getJSON(in_fld))

        # Parse all 6 possible input cases
        stage_fld = arcpy.env.scratchFolder
        if fld_dict:            
            fld_dict = fld_dict[0]
            if "uri" in fld_dict:
                in_fld = fld_dict["uri"]
                in_fld = rasterutils._lookupdatastorepath(in_fld)
                # copy training samples to stage folder if from cloud store
                if in_fld.startswith("/cloudStore") or in_fld.startswith("/vsi"):
                    stage_model_fld = stage_fld + "/" + os.path.basename(in_fld)
                    try:
                        arcpy.gp.command("TransferFiles '" + in_fld + "' '" + stage_model_fld + "'")
                    except Exception as err:
                        arcpy.AddError("Failed to prepare Deep Learning training samples.")
                    in_fld = stage_model_fld
            elif "uris" in fld_dict:
                in_fld_list = fld_dict["uris"]
                if isinstance(in_fld_list, list):
                    for i in range(len(in_fld_list)):
                        fld = in_fld_list[i]
                        fld = fld.strip()
                        fld = rasterutils._lookupdatastorepath(fld)
                        if fld.startswith("/cloudStore") or fld.startswith("/vsi"):
                            stage_model_fld = stage_fld + "/" + os.path.basename(fld)
                            try:
                                arcpy.gp.command("TransferFiles '" + fld + "' '" + stage_model_fld + "'")
                            except Exception as err:
                                arcpy.AddError("Failed to prepare Deep Learning training samples.")
                            in_fld_list[i] = stage_model_fld
                        else:
                            in_fld_list[i] = fld
                    in_fld = ";".join(in_fld_list)
        else:
            in_fld_list = in_fld.split(",")
            if len(in_fld_list) > 1:
                for i in range(len(in_fld_list)):
                    fld = in_fld_list[i]
                    fld = fld.strip()
                    fld = rasterutils._lookupdatastorepath(fld)
                    if fld.startswith("/cloudStore") or fld.startswith("/vsi"):
                        stage_model_fld = stage_fld + "/" + os.path.basename(fld)
                        try:
                            arcpy.gp.command("TransferFiles '" + fld + "' '" + stage_model_fld + "'")
                        except Exception as err:
                            arcpy.AddError("Failed to prepare Deep Learning training samples.")
                        in_fld_list[i] = stage_model_fld
                    else:
                        in_fld_list[i] = fld
                in_fld = ";".join(in_fld_list)
            else:
                in_fld = rasterutils._lookupdatastorepath(in_fld)
                if in_fld.startswith("/cloudStore") or in_fld.startswith("/vsi"):
                    stage_model_fld = stage_fld + "/" + os.path.basename(in_fld)
                    try:
                        arcpy.gp.command("TransferFiles '" + in_fld + "' '" + stage_model_fld + "'")
                    except Exception as err:
                        arcpy.AddError("Failed to prepare Deep Learning training samples.")
                    in_fld = stage_model_fld

        # 2. Check if the output path is data store folder path or a simple name
        # a) the tool supports data store relative path as output e.g. /fileShares/abc, {"uri": "/fileShares/abc"}
        # b) output is JSON object describe DLPK item {"name": "abc", "folderId": "cjoareairwe"}
        # c) data store should also support cloud store
        outdict = rasterutils._parsecontext(outputName)
        if "uri" in outdict:
            outputName = outdict["uri"]

        # need a final output path because temporary folder could be used 
        # if output to cloud store.  
        final_out_folder = ""
        if outputName.startswith("/fileShares"):
            arcpy.AddMessage("Output data store path: {}".format(outputName))
            out_folder = rasterutils._lookupdatastorepath(outputName)
            final_out_folder = out_folder
            #arcpy.AddMessage("Output file share path: {}".format(out_folder))
            # Now check if the folder is writable
            if not _check_writable(os.path.dirname(out_folder)):
                arcpy.AddError("Output data store path is not writable.")
                sys.exit(2)
            write_to_datastore = True
        elif outputName.startswith("/rasterStores"):
            arcpy.AddMessage("Output raster store path: {}".format(outputName))
            out_folder = rasterutils._lookupdatastorepath(outputName)
            final_out_folder = out_folder
            # Check if raster store points to cloud store
            if out_folder.startswith("/cloudStores") or out_folder.startswith("/vsi"):
                out_folder = arcpy.env.scratchFolder + "/" + os.path.basename(out_folder)
            write_to_datastore = True
        elif outputName.startswith("/cloudStores") or outputName.startswith("/vsi"):
            final_out_folder = outputName
            out_folder = arcpy.env.scratchFolder + "/" + os.path.basename(outputName)
            write_to_datastore = True
        else:
            raadminurl = rasterutils.RASTER_ANALYTIC_HELPER + "/admin/services"
            token, referer = rasterutils.getToken(raadminurl, 5)
            # search for fileshare raster store if available, if not available, use scratch folder
            rasstore = rasterutils._getRasterStore(raadminurl, token)[0]
            # arcpy.AddMessage("rasstore: {}".format(rasstore))
            # Note: if file share raster store cannot be found, we use scratch folder
            if not rasstore:
                rasstore = arcpy.env.scratchFolder

            # Note: the output should only be a name string, which will become the name
            # of the dlpk item published on portal, and the folder name that contains the
            # training model file
            # Optionally the user can also give a portal folder Id
            outdlpk = _parsedlpkoutput(outputName)
            if not outdlpk:
                sys.exit(2)
            out_folder = os.path.join(rasstore, outdlpk["name"])

        # 3. Constructing model arguments
        modelArgs = "#"
        if modelArguments!="":
            try:
                argsdict = json.loads(modelArguments)
                argslist = []
                for arg in argsdict:
                    argslist.append(arg + " " + "'"+ str(argsdict[arg])+"'")
                    modelArgs = ";".join(argslist)
            except:
                arcpy.AddWarning("Invalid model arguments: {}".format(modelArguments))
                modelArgs = "#"

        # 4. Read environment variables
        # Set parallel processing environment
        moreags = rasterutils._parsecontext(context)
        # arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        # Set processor type
        if rasterutils.RUN_ON_AGOL:
            arcpy.env.processorType = "GPU"
        else:
            arcpy.env.processorType = rasterutils.getProcessorType(moreags)
        if arcpy.env.processorType == 'GPU':
            arcpy.env.gpuId = 0
        arcpy.env.overwriteOutput = True

        # Parse pretrained_model and install the model
        # Supported pretrained model syntax, pre-trained model must be a already published item:
        # {"itemId": "ndonfoaewirioewjoierjioe"}
        if pretrainedModel:
            pretrainedModel = _parsepretrainedmodel(pretrainedModel)

        # 5. Call the gp tool to train deep learning model
        arcpy.AddMessage("Training the deep learning model...")
        # arcpy.AddMessage("max_epochs: {}".format(max_epochs))
        # arcpy.AddMessage("model_type: {}".format(model_type))
        # arcpy.AddMessage("batch_size: {}".format(batch_size))
        # arcpy.AddMessage("modelArgs: {}".format(str(modelArgs)))
        # arcpy.AddMessage("learning_rate: {}".format(learning_rate))
        # arcpy.AddMessage("backbone_model: {}".format(backbone_model))
        # arcpy.AddMessage("validation_percent: {}".format(validation_percent))
        if learningRate <= 0:
            learningRate = ""

        if stopTraining:
            stop_training = 'STOP_TRAINING'
            arcpy.AddMessage("Training will finish when model stops improving.")
        else:
            stop_training = 'CONTINUE_TRAINING'

        if freezeModel:
            freeze_model = 'FREEZE_MODEL'
        else:
            freeze_model = 'UNFREEZE_MODEL'

        # Train deep learning models
        arcpy.ia.TrainDeepLearningModel(in_fld, out_folder, maxEpochs, modelType, batchSize,
                                        modelArgs, learningRate, backboneModel,
                                        pretrainedModel, validationPercent, stop_training, freeze_model)
        arcpy.AddMessage(arcpy.GetMessages())
        arcpy.AddMessage("Training Finished")

        # 6. Publish the *.zip or *.dlpk file in the outModel folder, delete the rest files in the folder
        outval = {}
        dlpkfile = os.path.join(out_folder, os.path.basename(os.path.normpath(out_folder)) + ".dlpk")

        if not write_to_datastore:
            if os.path.exists(dlpkfile):
                # arcpy.AddMessage("dlpk file path:{}".format(dlpkfile))

                hostedgp = hgp.HostedGP(None, None, False)
                params = {
                    "title": outdlpk["name"],
                    "type": "Deep Learning Package",
                    "multipart": True,
                    "file": dlpkfile,
                    "filename": outdlpk["name"],
                    "tags": "imagery",
                    "typeKeywords": "Deep Learning,Raster"
                }
                props = {
                    "folderId": ""
                }
                if "folderId" in outdlpk and outdlpk["folderId"]:
                    props["folderId"] = outdlpk["folderId"]
                if "itemProperties" in outdlpk and outdlpk["itemProperties"]:
                    props.update(outdlpk["itemProperties"])

                # Check if item exist, if item exists, use Update Item call
                # Otherwise, add Item.
                itemid = rasterutils.checkitemExist(os.path.basename(dlpkfile), "Deep Learning Package", hostedgp)

                if itemid and overwritedlpk:
                    hostedgp.UpdateItem(itemid, params, props)
                    dlpkitem = itemid
                    arcpy.AddMessage("Updating existing Deep Learning Package item to the portal succeeded.")
                else:
                    dlpkitem = hostedgp.AddItem(params, props)
                    arcpy.AddMessage("Adding new Deep Learning Package item to the portal succeeded.")

                outval["id"] = dlpkitem
            else:
                arcpy.AddError("Failed to generate Deep Learning Package *.dlpk file.")
        else:
            if os.path.exists(dlpkfile):
                if final_out_folder != out_folder:
                    # If final output folder is different than the output folder generated by the tool, needs to transfer the dlpk file
                    try:
                        arcpy.gp.command("TransferFiles '" + out_folder + "' '" + final_out_folder + "'")
                    except Exception as err:
                        arcpy.AddError("Failed to generate Deep Learning Package *.dlpk file.")
                    outval["uri"] = final_out_folder + "/" + os.path.basename(dlpkfile)
                else:
                    outval["uri"] = dlpkfile
            else:                
                arcpy.AddError("Failed to generate Deep Learning Package *.dlpk file.")

        arcpy.SetParameterAsText(13, json.dumps(outval))
    except KeyError:
        rasterutils.AddExceptionError(TASK_NAME, "JSON object does not have the correct parameter key value.")

    except ValueError:
        rasterutils.AddExceptionError(TASK_NAME, "Invalid JSON object for the parameter.")

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        rasterutils.AddExceptionError(TASK_NAME, arcpy.GetMessages())

    except hgp.GPCloudExec as err:
        rasterutils.AddExceptionError(TASK_NAME, "Exception raised during publishing Deep Learning Package item : "
                                      + str(err))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)

    finally:
        if not write_to_datastore:
            time.sleep(5)
            _cleanup(out_folder)
