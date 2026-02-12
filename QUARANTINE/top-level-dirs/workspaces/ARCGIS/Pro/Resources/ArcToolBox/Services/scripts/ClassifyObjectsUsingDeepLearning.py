"""-----------------------------------------------------------------------------
Name:              ClassifyObjectsUsingDeepLearning.py
Purpose:           The Classify Objects Using Deep Learning task can be used to output
                   feature service with assigned class label for each feature based on
                   information from overlapped imagery data using the designated
                   deep learning model.
Author:            Esri Inc.
Created:           08/22/2019
Copyright:   (c)   Esri, Inc. 2014
ArcGIS Version:    10.8
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import hostedgp as hgp
import rasterutils
import rendererUtils
import popup
import aolutils

TASK_NAME = 'ClassifyObjectsUsingDeepLearning'
ERROR_CODES = [120100]
errorMsgs = {
    120100: "Output Feature Type {} is not supported.",
}

# Output feature layer description
outputLayerDesc = {"layers": [
    {"position":8,
     "catalogPath":"",
     "name": "ObjectsClassified",
     "id": 0,
     "properties":{
         "drawingInfo":"",
         "popupInfo":""
     }}
]}


if __name__ == '__main__':
    """
    Parse parameters and execute service
    :return: result feature service layer
    """
    inputRaster = arcpy.GetParameterAsText(0)
    inputFeatures = arcpy.GetParameterAsText(1)
    outputFeatureClass = arcpy.GetParameterAsText(2)
    model = arcpy.GetParameterAsText(3)
    modelArguments = arcpy.GetParameterAsText(4)
    classLabelField = arcpy.GetParameterAsText(5)
    processAllRasterItems = arcpy.GetParameter(6)
    context = arcpy.GetParameterAsText(7)
    captionfield = arcpy.GetParameterAsText(9)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # 1. Parse the input parameters
        # If the output raster was an absolute path of feature class,
        # no need to use Portal.
        onlyuri = False
        outdict = rasterutils._parsecontext(outputFeatureClass)
        if "uri" in outdict:
            onlyuri = True

        inras = rasterutils.getInDataPath(inputRaster)
        if isinstance(inras, dict):
            inras = json.dumps(inras)

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
                    argslist.append(arg + " " + str(argsdict[arg]))
                    modelArgs = ";".join(argslist)
            except:
                arcpy.AddWarning("Invalid model arguments: {}".format(modelArguments))
                modelArgs = "#"

        # Need to Validate if this is correct.
        if inputFeatures is not None:
            hostedgp = hgp.HostedGP(7, 1)
            inFeatures = rasterutils.getInDataPath(inputFeatures)
            if inFeatures.find("/FeatureServer/") > -1 \
                    or inFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputFeatures", 1)
                inFeatures = Input.name
            else:
                if isinstance(inFeatures, dict):
                    inFeatures = json.dumps(inFeatures)
        else:
            inFeatures = None

        if processAllRasterItems is True:
            processAllRasterItems = "PROCESS_ITEMS_SEPARATELY"
        else:
            processAllRasterItems = "PROCESS_AS_MOSAICKED_IMAGE"

        # 2. Read environment variables
        # Set output extent and spatial reference
        outsr = rasterutils.getOutSR(context)

        # Note: the extent must always be in input raster's projection
        outext, extsr = rasterutils.getExtent(context)

        # Set parallel processing environment
        moreags = rasterutils._parsecontext(context)
        outsr = rasterutils.getOutSR(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
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


        if not onlyuri:
            hostedgp = hgp.HostedGP(outputName=2)  # a description of the input / output data
            outputName = hostedgp.GetOutputName(2)

            # check publishing privilege
            aolutils.checkPublishingPrivilege(hostedgp, outputName)

            # Output parameter (will be set later when the tool is successful)
            arcpy.SetParameterAsText(8, "")
            # Now need to get the output feature class location
            dsFcPath = aolutils.createOutputLocations(hostedgp, outputName)

            # 4. Execute tool
            arcpy.gp.ClassifyObjectsUsingDeepLearning_ia(inras, dsFcPath, model, inFeatures,
                                                         classLabelField, processAllRasterItems, modelArgs,
                                                         captionfield)

            # 5. Create renderer, configure layer description
            # Add field and calculate Shape Area for renderer nomalization
            # aolutils.createShapeAreaField(dsFcPath)

            # Creating drawing info
            desc = arcpy.Describe(dsFcPath)
            drawingInfo = rendererUtils.getSimpleRendererInfo(desc.shapeType, TASK_NAME)

            if drawingInfo is not None:
                outputLayerDesc["layers"][0]["properties"]["drawingInfo"] = drawingInfo

            # Update Layer description with catalog path
            outputLayerDesc["layers"][0]["catalogPath"] = dsFcPath

            r2f_popupInfo = popup.PopupInfo("Objects Classified using deep learning {}".format(outputFeatureClass), "")
            # r2f_popupInfo.addFieldInfo("Feature_Count", "Count of Feature")
            toOmitFieldNames = [desc.OIDFieldName.lower(), desc.ShapeFieldName.lower()]

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
        else:
            # Set parallel processing environment
            dsFcPath = outdict["uri"]
            outvalue = {"uri": dsFcPath}
            # 4. Execute tool
            arcpy.gp.ClassifyObjectsUsingDeepLearning_ia(inras, dsFcPath, model, inFeatures,
                                                         classLabelField, processAllRasterItems, modelArgs,
                                                         captionfield)
            arcpy.SetParameterAsText(8, json.dumps(outvalue))

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