"""-----------------------------------------------------------------------------
Name:              DetectObjectsUsingDeepLearning.py
Purpose:           The Detect Object Using Deep Learning task can be used to generate
                   feature service that contains polygons on detected objects found
                   in the imagery data using the designated deep learning model.
Author:            Esri Inc.
Created:           08/08/2018
Copyright:   (c)   Esri, Inc. 2014
ArcGIS Version:    10.7
-----------------------------------------------------------------------------"""
# core libraries
import json
import os

# internal libraries
import arcpy
import hostedgp as hgp
import rasterutils
import rendererUtils
import popup
import aolutils

TASK_NAME = 'DetectObjectsUsingDeepLearning'
ERROR_CODES = [120100]
errorMsgs = {
    120100: "Output Feature Type {} is not supported.",
}


# Output feature layer description
outputLayerDesc = {"layers": [
    {"position":10,
     "catalogPath":"",
     "name": "ObjectsDetected",
     "id": 0,
     "properties":{
         "drawingInfo":"",
         "popupInfo":""
     }}
]}


def _queryModelInfo(model):
    iid = os.path.basename(model)
    modelInfo = None
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
                        arcpy.AddWarning(msg)
                    if msg.startswith("Unable to initialize python raster function"):
                        arcpy.AddWarning(msg)
                    if msg.startswith("Exception"):
                        arcpy.AddWarning(msg)
                arcpy.AddWarning("Unable to read deep learning model definition.")
            except Exception as err:
                arcpy.AddWarning("Unexpected error when reading deep learning model definition.")

    # # Only look for model report when model info was returned
    # TODO: If given model is a DLPK item, need lower level implementation
    #       to return model report.
    if model.lower().endswith(".emd"):
        if model.startswith("/fileShares") or model.startswith("/rasterStores"):
            model = rasterutils._lookupdatastorepath(model)

        modelchar = os.path.join(os.path.dirname(model), "ModelCharacteristics/training_validation_loss.json")
        if os.path.exists(modelchar) and isinstance(modelInfo, dict):
            try:
                with open(modelchar,) as f:
                    modelcharjson = json.load(f)
                    modelInfo["modelCharacteristics"] = modelcharjson
            except Exception as err:
                arcpy.AddWarning("Invalid training validation loss info.")
        
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
            
        if "properties" in dlpkIteminfo and isinstance(dlpkIteminfo["properties"], dict) :
            dlpkIteminfo["properties"]["modelInfo"] = modelInfo
        else:
            dlpkIteminfo["properties"] = {"modelInfo": modelInfo}

        rasterutils.updateItemProperties(iid, dlpkIteminfo)
    return modelInfo

if __name__ == '__main__':
    
    """
    Parse parameters and execute service
    :return: result feature service layer
    """
    inputRaster = arcpy.GetParameterAsText(0)
    outputObjects = arcpy.GetParameterAsText(1)
    model = arcpy.GetParameterAsText(2)
    modelArguments = arcpy.GetParameterAsText(3)
    runNMS = arcpy.GetParameter(4)
    confidenceScoreField = arcpy.GetParameter(5)
    classValueField = arcpy.GetParameter(6)
    maxOverlapRatio = arcpy.GetParameter(7)
    processAllRasterItems = arcpy.GetParameter(8)
    context = arcpy.GetParameterAsText(9)
    outputRaster = arcpy.GetParameterAsText(11)


    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # 1. Parse the input parameters
        # If the output raster was a absolute path of feature class,
        # no need to use Portal.
        onlyuri = False
        outdict = rasterutils._parsecontext(outputObjects)
        if "uri" in outdict:
            onlyuri = True

        # Create HostedGP object
        hostedgp = hgp.HostedGP(outputName=1) # a description of the input / output data
        # Possible valid inputs:
        # 1) a imagery layer URL
        # 2) a JSON representing imagery layer with renderingRule and/or mosaicRule
        # 3) a feature layer with image attachements
        # parse_feature_input checks if the input is a feature first, if not, it will
        # return service URL or JSON representing imagery layer with renderingRule/mosaicRule. 
        # Note: if input Raster is a JSON describing imagery layer with renderingRule or mosaicRule. 
        # The JSON should be pass down to the core tool as is. 
        inras = rasterutils.parse_feature_input(inputRaster, "inputRaster", 0)

        # Parse model input to support the following cases:
        # {"itemId": "<portal item id>"}
        # {"url": "<item url>"}
        # {"uri": "<model definition file path>"}
        # {"<entire JSON of the model definition>"}
        model = rasterutils.getInDataPath(model)
        modelArgs = "#"

        if modelArguments!="":
            try:
                argsdict = json.loads(modelArguments)
                argslist = []
                for arg in argsdict:
                    if arg=="output_classified_raster":
                        continue
                    argslist.append(arg + " " + str(argsdict[arg]))
                    modelArgs = ";".join(argslist)
            except:
                arcpy.AddWarning("Invalid model arguments: {}".format(modelArguments))
                modelArgs = "#"

        if processAllRasterItems is True:
            processAllRasterItems = "PROCESS_ITEMS_SEPARATELY"
        else:
            processAllRasterItems = "PROCESS_AS_MOSAICKED_IMAGE"

        # 2. Read environment variables
        # Set output extent and spatial reference
        outsr = rasterutils.getOutSR(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        # Note: the extent must always be in input raster's projection
        outext, extsr = rasterutils.getExtent(context)
        #set mask
        arcpy.env.mask = rasterutils.getMask(context)

        # Set parallel processing environment
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        # Set processor type
        if rasterutils.RUN_ON_AGOL:
            arcpy.env.processorType = "GPU"
        else:
            arcpy.env.processorType = rasterutils.getProcessorType(moreags)
        if arcpy.env.processorType == 'GPU':
            arcpy.env.gpuId = -2

        # Set other GP environment settings
        # Note: the spatial reference defined in the extent will be output spatial reference used
        arcpy.env.extent = outext
        arcpy.env.cellSize = rasterutils.getCellsize(context)

        generateRas = False
        if outputRaster:
            modelInfo = _queryModelInfo(model)
            if modelInfo:
                if "ModelType" in modelInfo.keys():
                    if modelInfo["ModelType"] == "PanopticSegmenter":
                        iid, isurl, aisurl, outputRaster = rasterutils.getOutRasterPath(outputRaster)
                        outputRaster = rasterutils.appendcrf(outputRaster)
                        modelArgs = modelArgs+";output_classified_raster" + " " + outputRaster
                        generateRas=True


        if not onlyuri:
            outputName = hostedgp.GetOutputName(1)

            # check publishing privilege
            aolutils.checkPublishingPrivilege(hostedgp, outputName)

            # Output parameter (will be set later when the tool is successful)
            arcpy.SetParameterAsText(10, "")
            # Now need to get the output feature class location
            # arcpy.AddMessage("Getting managed database connection.")
            dsFcPath = aolutils.createOutputLocations(hostedgp, outputName)
            # arcpy.AddMessage(dsFcPath)

            # 4. Execute tool
            arcpy.gp.DetectObjectsUsingDeepLearning_ia(
                inras, dsFcPath, model, modelArgs, runNMS,
                confidenceScoreField, classValueField, maxOverlapRatio, processAllRasterItems)


            # 5. Create renderer, configure layer description
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

            r2f_popupInfo = popup.PopupInfo("Objects detected using deep learning {}".format(outputObjects), "")
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
        else:
            # Set parallel processing environment
            dsFcPath = outdict["uri"]
            outvalue = {"uri": dsFcPath}
            # 4. Execute tool
            arcpy.gp.DetectObjectsUsingDeepLearning_ia(
                inras, dsFcPath, model, modelArgs, runNMS,
                confidenceScoreField, classValueField, maxOverlapRatio, processAllRasterItems)
            arcpy.SetParameterAsText(10, json.dumps(outvalue))

        if generateRas:
            # Handle multiple output
            uri = rasterutils.getURI(arcpy.GetMessages(), outputRaster)
            # Update output ========================================================
            # Check if output contains URI
            # 1. If no URI found, return output as is
            # 2. If URI found, update service
            token = ""  # Portal token
            referer = ""  # Portal referer
            if uri == "":
                arcpy.AddMessage("No data store URI returned.")
            else:
                arcpy.AddMessage("Updating service with data store URI.")
                # Get federated token to update image service
                if token == "" or token == "#":
                    token, referer = rasterutils.getToken(isurl)
                # Read and update image service info
                sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
                if sinfo != {}:
                    msg = rasterutils.updateSource(aisurl, sinfo, uri, token, referer)
                    rasterutils.refreshPortalItem(iid)
                else:
                    arcpy.AddWarning("No service updated although data store URI generated.")

                outval = {"itemId": iid, "url": isurl}
                arcpy.SetParameterAsText(12, json.dumps(outval))

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
