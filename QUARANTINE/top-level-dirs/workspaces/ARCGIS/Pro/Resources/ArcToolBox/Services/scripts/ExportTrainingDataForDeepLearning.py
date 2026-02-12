
"""-----------------------------------------------------------------------------
Name:           ExportTrainingDataForDeepLearning.py
Purpose:        This service tool is used to export deep learning training image
                chips, labels and metadata in raster store
Author:         Esri Inc.
Created:        08/08/2018
Copyright:      (c)   Esri, Inc. 2018
ArcGIS Version: 10.7
-----------------------------------------------------------------------------"""
# core libraries
import json
import os
import sys

# internal libraries
import hostedgp as hgp
import arcpy
import rasterutils
import aolutils

TASK_NAME = 'ExportTrainingDataForDeepLearning'


def _parsetileSize(tilesize):
    """
    :param tilesize: tile size JSON in {"x": 128, "y": 128}
    :return: tilex and tiley
    """
    try:
        if tilesize:
            tileSizeDict = json.loads(tilesize)
            if "x" in tileSizeDict:
                ts_x = tileSizeDict["x"]
            else:
                ts_x = ""

            if "y" in tileSizeDict:
                ts_y = tileSizeDict["y"]
            else:
                ts_y = ""

            return ts_x, ts_y
        else:
            return "", ""
    except:
        return "", ""


def _parsestrideSize(stridesize):
    """
    :param stridesize: stride size JSON in {"x": 128, "y": 128}
    :return: stridex and stridey
    """
    try:
        if stridesize:
            strideSizeDict = json.loads(stridesize)
            if "x" in strideSizeDict:
                ss_x = strideSizeDict["x"]
            else:
                ss_x = ""

            if "y" in strideSizeDict:
                ss_y = strideSizeDict["y"]
            else:
                ss_y = ""

            return ss_x, ss_y
        else:
            return "", ""
    except:
        return "", ""


def _parsestcontext(context):
    """
    :param context: addtional settings for Export Training Data
    :return: addtional parameters JSON
    """
    addops = {
        "exportAllTiles": "ONLY_TILES_WITH_FEATURES",
        "startIndex": 0
    }
    try:
        if context:
            contextdict = json.loads(context)
            if "exportAllTiles" in contextdict:
                if contextdict["exportAllTiles"]:
                    addops["exportAllTiles"] = "ALL_TILES"
                else:
                    addops["exportAllTiles"] = "ONLY_TILES_WITH_FEATURES"
            if "startIndex" in contextdict:
                addops["startIndex"] = contextdict["startIndex"]

            return addops
        else:
            return addops
    except:
        return addops

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


def _create_feat_layer(uri, filter):
    """
    Create a feature layer to honor query definition.
    :param uri: url or path of the input feature layer
    :param filter: query filter to select features in the feature layer
    :return: arcpy feature layer object
    """
    try:
        if uri and filter:
            featlayer = "inclassdata_wfilter"
            arcpy.management.MakeFeatureLayer(
                uri, featlayer, filter
            )
            return featlayer
        return None
    except Exception as err:
        return None


if __name__ == '__main__':

    # Input raster can only be:
    # '{"url":"http://a/a/b/imageserver"}',
    # or '{"uri":"/fileshare/datastore/a.tif"}',
    # or '{"itemId":"abcdefghijklmnopqrstuvwxyz"}'
    # for all other input types, call genRas tool directly
    inRas = arcpy.GetParameterAsText(0)
    outputLocation = arcpy.GetParameterAsText(1)
    inputClassData = arcpy.GetParameterAsText(2)
    chipFormat = arcpy.GetParameterAsText(3)
    tileSize = arcpy.GetParameterAsText(4)
    strideSize = arcpy.GetParameterAsText(5)
    metadataFormat = arcpy.GetParameterAsText(6)
    classValueField = arcpy.GetParameterAsText(7)
    bufferRadius = arcpy.GetParameter(8)
    inputMaskPolygons = arcpy.GetParameter(9)
    rotationAngle = arcpy.GetParameter(10)

    # Add new parameters since 10.8 and Pro 2.5
    referenceSystem = arcpy.GetParameterAsText(11)
    processMode = arcpy.GetParameter(12)
    blackenAroundFeature = arcpy.GetParameter(13)
    cropMode = arcpy.GetParameter(14)
    # End of adding new parameters

    # Add new parameters since 11
    additionalInputRaster = arcpy.GetParameter(15)
    inputInstanceData = arcpy.GetParameter(16)
    instanceClassValueField = arcpy.GetParameter(17)
    minPolygonOverlapRatio = arcpy.GetParameter(18)
    # End of adding new parameters

    context = arcpy.GetParameterAsText(19)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # 1. Get input image data path
        inras = rasterutils.getInDataPath(inRas)
        if isinstance(inras, dict):
            inras = json.dumps(inras)
        elif (isinstance(inras, str)) and (inras.startswith("/rasterStores") or inras.startswith("/fileShares")):
            inras = rasterutils._lookupdatastorepath(inras)

        additionalInputRaster = rasterutils.getInDataPath(additionalInputRaster)
        if isinstance(additionalInputRaster, dict):
            additionalInputRaster = json.dumps(additionalInputRaster)
        elif (isinstance(additionalInputRaster, str)) and (additionalInputRaster.startswith("/rasterStores") or additionalInputRaster.startswith("/fileShares")):
            additionalInputRaster = rasterutils._lookupdatastorepath(additionalInputRaster)

        # 2. Get input classified data path, feature or image
        inputClassData = rasterutils.getInDataPath(inputClassData)
        # Additionally check for query filter
        queryfilter = rasterutils.getQueryFilter(context)

        if inputClassData.find("/FeatureServer/") > -1 \
                or inputClassData.find("/MapServer/") > -1:

            # Create HostedGP object
            hostedgp_class_data = hgp.HostedGP(19, 2)
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp_class_data, "inputClassData", 2)
            inputClassData = Input.name
            if queryfilter:
                in_class_data_wfilter = _create_feat_layer(inputClassData, queryfilter)
                if in_class_data_wfilter:
                    inputClassData = in_class_data_wfilter
        else:
            if isinstance(inputClassData, dict):
                inputClassData = json.dumps(inputClassData)


        tileSize_x, tileSize_y = _parsetileSize(tileSize)
        strideSize_x, strideSize_y = _parsestrideSize(strideSize)

        # 3. Get input mask polygons feature class url
        inputMaskPolygons = rasterutils.getInDataPath(inputMaskPolygons)
        if inputMaskPolygons.find("/FeatureServer/") > -1 \
                or inputMaskPolygons.find("/MapServer/") > -1:

            # Create HostedGP object
            hostedgp_mask_polygon = hgp.HostedGP(19, 9)
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp_mask_polygon, "inputMaskPolygons", 9)
            inputMaskPolygons = Input.name
        else:
            if isinstance(inputMaskPolygons, dict):
                inputMaskPolygons = json.dumps(inputMaskPolygons)

        inputInstanceData = rasterutils.getInDataPath(inputInstanceData)
        if inputInstanceData.find("/FeatureServer/") > -1 \
                or inputInstanceData.find("/MapServer/") > -1:

            # Create HostedGP object
            hostedgp_instance_data = hgp.HostedGP(19, 16)
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp_instance_data, "inputInstanceData", 16)
            inputInstanceData = Input.name
        else:
            if isinstance(inputInstanceData, dict):
                inputInstanceData = json.dumps(inputInstanceData)

        arcpy.env.cellSize = rasterutils.getCellsize(context)
        arcpy.env.extent = rasterutils.getExtent(context)[0]
        moreops = _parsestcontext(context)

        # TODO: find self server url instead of replying on portal
        # Constructing output raster store location
        # Find Raster Analytic server url
        # raurl = ""
        # hostedgp = hgp.HostedGP(None, None, False)
        # helpers = json.loads(hostedgp.GetHelperServices())
        # if "rasterAnalytics" in helpers:
        #     ra = helpers["rasterAnalytics"]
        #     if "url" in ra:
        #         raurl = ra["url"]
        #         if raurl and raurl.find("/rest/services"):
        #             raurl = raurl.replace("/rest/services", "/admin/services")
        datastorePath = ""
        outputPath = ""
        # Note: only if the output location is raster store path and it is
        # not the same as the default raster store we will use it as is.
        if os.path.isabs(outputLocation):
            if outputLocation.startswith("/fileShares/"):
                path_to_folder = rasterutils._lookupdatastorepath(outputLocation)
                if not _check_writable(os.path.dirname(path_to_folder)):
                    arcpy.AddError("The physical path that the data store referenced does not have write permission.")
                    sys.exit(2)
            outsample = outputLocation
            outputPath = outsample

        else:
            raurl = rasterutils.RASTER_ANALYTIC_HELPER + "/admin/services"
            # Try to find raster store full path
            token, referer = rasterutils.getToken(raurl, 5)
            cloudstore = rasterutils._getRasterStore(raurl, token, type="cloud")
            if len(cloudstore) > 1 and cloudstore[1]:
                rasstore = cloudstore[1]
                datastorePath = rasstore
            else:
                rasstore = rasterutils._getRasterStore(raurl, token, type="fileshare")[0]
                datastorePath = rasterutils._getRasterStore(raurl, token, type="fileshare")[1]
            
            outputPath = datastorePath + "/" + os.path.basename(outputLocation)
            outsample = rasstore + "/" + os.path.basename(outputLocation)

        # arcpy.AddMessage(outsample)

        if processMode is True:
            processMode = "PROCESS_ITEMS_SEPARATELY"
        else:
            processMode = "PROCESS_AS_MOSAICKED_IMAGE"

        if blackenAroundFeature is True:
            blackenAroundFeature = "BLACKEN_AROUND_FEATURE"
        else:
            blackenAroundFeature = "NO_BLACKEN"

        if cropMode is True:
            cropMode = "FIXED_SIZE"
        else:
            cropMode = "BOUNDING_BOX"

        # Set parallel processing environment
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.overwriteOutput = 1

        # Execute the Generate Raster tool =====================================
        arcpy.AddMessage("Exporting...")
        arcpy.gp.ExportTrainingDataForDeepLearning_ia(
            inras, outsample, inputClassData, chipFormat, tileSize_x,
            tileSize_y, strideSize_x, strideSize_y, moreops["exportAllTiles"],
            metadataFormat, moreops["startIndex"], classValueField,
            bufferRadius, inputMaskPolygons, rotationAngle,
            referenceSystem, processMode, blackenAroundFeature, cropMode, additionalInputRaster, inputInstanceData, instanceClassValueField, minPolygonOverlapRatio)
        arcpy.AddMessage("Finished")

        # Get the real path of output training data folder
        # uri = rasterutils.getURI(arcpy.GetMessages())
        # if uri:
        #     outval = {"uri": uri}
        # else:
        #     outval = {"uri": outsample}
        outval = {"uri": outputPath}
        arcpy.SetParameterAsText(20, json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))
         
    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occurred during service Execution. " + str(err))
