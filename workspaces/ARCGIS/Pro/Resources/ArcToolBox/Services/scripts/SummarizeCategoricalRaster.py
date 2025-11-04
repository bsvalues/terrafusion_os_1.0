"""-----------------------------------------------------------------------------
Name:           SummarizeCategoricalRasters.py
Purpose:        Summarizes categorical multidimensional raster 
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
import shutil

# internal libraries
import arcpy
import rasterutils
import aolutils
import hostedgp as hgp

scriptsx = os.path.join(os.path.split(os.path.dirname(__file__))[0], "scriptsx")
sys.path.append(scriptsx)
from common import PAOutputFeatureLayer, FeatureServiceLayerPublisher

TASK_NAME = 'SummarizeCategoricalRaster'

if __name__ == '__main__':
    inputCategoricalRaster = arcpy.GetParameterAsText(0)  # Input image service to be trained on
                                                          # e.g. {"url":"http://a/a/b/imageserver"},
                                                          # or {"uri":"http://a/a/b/c"},
                                                          # or {"itemId":"abcdefghijklmnopqrstuvwxyz"}
    outputSummaryTableName = arcpy.GetParameterAsText(1)
    dimension = arcpy.GetParameterAsText(2)
    areaOfInterest = arcpy.GetParameterAsText(3)
    areaOfInterestIdField = arcpy.GetParameterAsText(4)
    context = arcpy.GetParameterAsText(5)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # Create HostedGP object
        hostedgp = hgp.HostedGP(5, 1)

        # 1. Parse the input parameters
        inputCategoricalRaster = rasterutils.getInDataPath(inputCategoricalRaster)
        if isinstance(inputCategoricalRaster, dict):
            inputCategoricalRaster = json.dumps(inputCategoricalRaster)

        if areaOfInterest != "":
            if rasterutils.checkIfFeatureCollection(areaOfInterest):
                areaOfInterestInput, areaOfInterestInputLayerCount = aolutils.getHostedLayerX(hostedgp, "areaOfInterest", 3)
                if areaOfInterestInput is None:
                    arcpy.AddError("Could not get the areaOfInterest Layer.")
                areaOfInterest = areaOfInterestInput.name
                # arcpy.AddMessage(f"areaOfInterest: {areaOfInterest}")
            else:
                areaOfInterest = rasterutils.getInDataPath(areaOfInterest)
                if areaOfInterest.find("/FeatureServer/") > -1 \
                        or areaOfInterest.find("/MapServer/") > -1:
                    Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "areaOfInterest", 3)
                    areaOfInterest = Input.name
                else:
                    if isinstance(areaOfInterest, dict):
                        areaOfInterest = json.dumps(areaOfInterest)

        # 2. Parse output table parameter
        outputName = hostedgp.GetOutputName(1)
        # Check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        # This parameter will be set when the tool is successful
        arcpy.SetParameterAsText(6, "")

        dsFcpath = aolutils.createOutputLocations(hostedgp, outputName)

        # arcpy.AddMessage(f"OutputImportanceTable path: {dsFcpath}")

        # 3. Parse the environment parameters this tool honors
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.extent = outext
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)

        # 4. Execute the tool =====================================================
        arcpy.gp.SummarizeCategoricalRaster_ia(inputCategoricalRaster,
                                                dsFcpath,
                                                dimension,
                                                areaOfInterest,
                                                areaOfInterestIdField)

        output_lyr = PAOutputFeatureLayer(dsFcpath)
        publisher = FeatureServiceLayerPublisher(json.loads(outputSummaryTableName))
        publisher.add_layer_to_publish(output_lyr, 6, "SummarizeCategoricalRaster", layer_index=0)
        publisher.publish()
        update_item_properties = {
            "typeKeywords": 'Table'
        }
        hostedgp = hgp.HostedGP(None, None, False)
        opjson = arcpy.GetParameterAsText(6)
        opdict = json.loads(opjson)
        output_item_id = None
        if "itemId" in opdict:
            output_item_id = opdict["itemId"]
            hostedgp.UpdateItem(output_item_id, update_item_properties)


    except rasterutils.LicenseError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
