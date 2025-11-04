"""-----------------------------------------------------------------------------
Name:              GeodesicViewshed.py
Purpose:           Creates the viewshed pattern from a feature and a raster.
Author:            Esri Inc.
Created:           2/12/2024
Copyright:   (c)   Esri, Inc. 2024
ArcGIS Version:    11.3.0
-----------------------------------------------------------------------------"""

import os
import sys
import arcpy
import json
import rasterutils
import aolutils
import hostedgp as agolgp

TASK_NAME = 'GeodesicViewshed'
ERROR_CODES = [100087, 100109]
errorMsgs = {
    100087:"Field {} does not exist in {}",
    100109:"The geometry type for the input layer must be points or lines"
}
outputItemPropertyTemplate = {
    "itemProperties": {
        "itemText": {
            "visibility": True,
            "opacity": 0.85,
            "layerDefinition": {
                "drawingInfo": {
                    "renderer": {
                        "type": "rasterStretch",
                        "stretchType": "minMax",
                        "colorRamp": {
                            "type": "algorithmic",
                            "algorithm": "esriHSVAlgorithm",
                            "fromColor": [255, 247, 236, 255],
                            "toColor": [127, 0, 0, 255]
                        },
                        "min": 0,
                        "max": 255,
                        "numberOfStandardDeviations": 2,
                        "statistics": [],
                        "dra": False,
                        "minPercent": 2,
                        "maxPercent": 2,
                        "useGamma": False,
                        "gamma": [1],
                        "computeGamma": False,
                        "sigmoidStrengthLevel": 2
                    }
                }
            },
            "interpolation": "RSP_NearestNeighbor",
            "popupInfo": {"title": "ImageLayer", "fieldInfos": [
                {"fieldName": "Raster.ServicePixelValue",
                 "label": "Service Pixel Value",
                 "isEditable": False, "isEditableOnLayer": False,
                 "visible": True,
                 "format": {"places": 2, "digitSeparator": True}}],
                          "description": None,
                          "showAttachments": False,
                          "layerOptions": {
                              "showNoDataRecords": True},
                          "mediaInfos": []}
        }
    }
}
outputLayerDesc = {"layers": [
    {"position":22,
     "catalogPath":"",
     "name": "GeodesicViewshed",
     "id": 0,
     "properties":{
         "drawingInfo":"",
         "popupInfo":""
     }}
]}


def decodeLinearUnits(instr):
    outstr = instr
    try:
        d = json.loads(instr)
        d_lower = {k.lower(): v for k, v in d.items()} # covert all keys to lower cases
        outstr = str(d_lower['distance']) + ' ' + str(d_lower['units'])
    except:
        pass
    return outstr

if __name__=='__main__':

    inElevSurface = arcpy.GetParameterAsText(0)
    inFeat = arcpy.GetParameterAsText(1)
    outName = arcpy.GetParameterAsText(2)
    inOptimize = arcpy.GetParameterAsText(3)
    
    if inOptimize == "ACCURACY" or inOptimize == "" or inOptimize == "#" or inOptimize == None:
        inAnalysisMethod = "ALL_SIGHTLINES"
    elif inOptimize == "SPEED":
        inAnalysisMethod = "PERIMETER_SIGHTLINES"

    AnalysisType = arcpy.GetParameterAsText(4)
    if AnalysisType == "FREQUENCY" or AnalysisType == "" or AnalysisType == "#" or AnalysisType == None:
        AnalysisType = "FREQUENCY"
    elif AnalysisType == "OBSERVERS":
        AnalysisType = "OBSERVERS"

    verticalError = arcpy.GetParameterAsText(5)
    refractivityCoefficient = arcpy.GetParameterAsText(6)
    maxView = arcpy.GetParameterAsText(7)
    minView = arcpy.GetParameterAsText(8)
    distanceIs3D = arcpy.GetParameter(9)
    if distanceIs3D == True or distanceIs3D == "3D":
        dist3D = "3D"
    else:
        dist3D = "GROUND"
    
    elevationObs = arcpy.GetParameterAsText(10)
    heightObs = arcpy.GetParameterAsText(11)
    heightTarget = arcpy.GetParameterAsText(12)
    horizontalStartAngle = arcpy.GetParameterAsText(13)
    horizontalEndAngle = arcpy.GetParameterAsText(14)
    verticalUpperAngle = arcpy.GetParameterAsText(15)
    verticalLowerAngle = arcpy.GetParameterAsText(16)
    outAboveGroundLevelRasName = arcpy.GetParameter(17)
    if outAboveGroundLevelRasName == "" or outAboveGroundLevelRasName == None:
        outAGL = ""
    else:
        outAGL = os.path.join(arcpy.env.scratchWorkspace, outAboveGroundLevelRasName)  # output path for local debug run

    outObsRegionRelationTableName = arcpy.GetParameterAsText(18)
    context = arcpy.GetParameterAsText(19)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()
        
        # 1. Parse the input parameters
        hostedgp = agolgp.HostedGP(19, 2)
        # Input,InputLayerCount=aolutils.getHostedLayerX(hostedgp, "input layer", 0)
        Input = hostedgp.GetHostedLayer(1)
        InputLayerCount = Input.count
        InputLayer = Input.name
        InputLayerName = Input.layername
        if len(InputLayerName) == 0:
            InputLayerName = "Input Features"
        layerPath = arcpy.Describe(InputLayer).catalogPath

        if ".sde" in layerPath:
            if InputLayerCount > 2000:
                wkspc = arcpy.env.scratchGDB
            else:
                wkspc = "in_memory"
            InputLayerPath = os.path.join(wkspc, "inputCopy")
            arcpy.AddMessage(InputLayer)
            arcpy.CopyFeatures_management(Input.name, InputLayerPath)
            InputLayer = "inputLayer"
            arcpy.MakeFeatureLayer_management(InputLayerPath, InputLayer)

        # validate input features
        shapeType = Input.shapeType.lower()
        if not ("point" in shapeType or "line" in shapeType):
            errorMsg = errorMsgs[100109]
            aolutils.AddErrorCode(100109, errorMsg)

        # Now parsing the input raster
        inras2 = rasterutils.getInDataPath(inElevSurface)
        if isinstance(inras2, dict):
            inras2 = json.dumps(inras2)

        # Get the output raster from JSON object that may contains ItemID, image service url or crf unc path or
        # simply a name.
        # Example:
        # {"itemId": "no213u0uiif8924989h98h0123",
        #  "url": "http://rdvmags02.esri.com/arcgis/rest/services/Hosted/testis",
        #  "name": "anyname"}
        # For Output Viewshed
        iid = ""  # Output Portal item ID
        isurl = ""  # Output Image Service URL
        aisurl = ""  # Output Image Service admin URL

        token = ""
        referer = ""

        # 2. Parse input and output service url
        iid, isurl, aisurl, outras = rasterutils.getOutRasterPath(outName)
        if rasterutils.RUN_ON_AGOL:
            filename = outras.split('/')[-1]
        else:
            filename = outras
        outras = rasterutils.appendcrf(outras)

        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outras))

        # For Output AGL raster
        if outAboveGroundLevelRasName != "" and outAboveGroundLevelRasName != None and outAboveGroundLevelRasName != "#":
            iid2 = ""  # Output Portal item ID
            isurl2 = ""  # Output Image Service URL
            aisurl2 = ""  # Output Image Service admin URL

            # Parse input and output service url
            iid2, isurl2, aisurl2, outras2 = rasterutils.getOutRasterPath(outAboveGroundLevelRasName)
            outras2 = rasterutils.appendcrf(outras2)

            arcpy.AddMessage("Output item id is: {0}".format(iid2))
            arcpy.AddMessage("Output image service url is: {0}".format(isurl2))
            arcpy.AddMessage("Output cloud raster name is: {0}".format(outras2))
        else:
            outras2 = ""

        # 3. Set GP environment settings
        # Note: the spatial reference defined in the extent will be output spatial reference used
        moreags = rasterutils._parsecontext(context)
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        arcpy.AddMessage("Output coordinate system: {}".format(outsr))
        arcpy.AddMessage("Output extent: {}".format(outext))
        arcpy.env.resamplingMethod = rasterutils.getResamplingMethod(context)
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        arcpy.env.mask = rasterutils.getMask(context)
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.overwriteOutput = 1

        pyramids = rasterutils.getPyramids(context)
        arcpy.AddMessage("pyramid message: {0}".format(pyramids))

        # Get the output feature class location
        if AnalysisType == "OBSERVERS" and outObsRegionRelationTableName:
            hostedgp = agolgp.HostedGP(19, 18)
            outTableName = hostedgp.GetOutputName(18)
            # check publishing privilege
            aolutils.checkPublishingPrivilege(hostedgp, outTableName)
            temp_fc = os.path.join(arcpy.env.scratchGDB, "temp_gv_res")
            dsFcPath = aolutils.createOutputLocations(hostedgp, outTableName)
            arcpy.AddMessage("output location {}".format(dsFcPath))
        else: temp_fc = ""

        # 4. Run tool
        # Viewshed2(in_raster, in_observer_features, {out_agl_raster}, {analysis_type},
        # {vertical_error}, {out_observer_region_relationship_table}, {refractivity_coefficient},
        # {surface_offset}, {observer_elevation}, {observer_offset}, {inner_radius}, {inner_radius_is_3d},
        # {outer_radius}, {outer_radius_is_3d}, {horizontal_start_angle}, {horizontal_end_angle},
        # {vertical_upper_angle}, {vertical_lower_angle}, {analysis_method}, {analysis_target_device})
        # "" is for out_observer_region_relationship_table
        # inner_radius_is_3d == outer_radius_is_3d in this code outObsRegionRelationTableName
        # arcpy.gp.Viewshed2_sa(inras2, InputLayer, outras, outras2, AnalysisType,  verticalError, "", refractivityCoefficient,
        #                       heightTarget, elevationObs, heightObs, minView, dist3D, maxView,
        #                       dist3D, horizontalStartAngle, horizontalEndAngle, verticalUpperAngle, verticalLowerAngle,
        #                       inAnalysisMethod)
        
        arcpy.gp.Viewshed2_sa(inras2, InputLayer, outras, outras2, AnalysisType,  verticalError, temp_fc, refractivityCoefficient,
                              heightTarget, elevationObs, heightObs, minView, dist3D, maxView,
                              dist3D, horizontalStartAngle, horizontalEndAngle, verticalUpperAngle, verticalLowerAngle,
                              inAnalysisMethod)

        # Use output path as is for AGOL
        if rasterutils.RUN_ON_AGOL:
            uris = [outras, outras2]
        else:
            # First check if the pyramid setting is in the context, if yes, then buildPyramids with option SKIP_EXISTING.
            # This specifies pyramids will be built only when they are missing on the raster.
            uris = []
            msgcount = arcpy.GetMessageCount()
            for n in range(msgcount):
                uri = rasterutils.getURI(arcpy.GetMessage(n))
                arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))
                if uri == "":
                    continue
                else:
                    uris.append(uri)

        if uris == []:
            arcpy.AddMessage("No Data store URI found.")
        else:
            uri = uris[0]
            if not pyramids:
                if rasterutils.checkPyramids(uri):
                    arcpy.AddMessage("Pyramids are existing.")
                else:
                    arcpy.BuildPyramids_management(uri, "-1", "NONE", "NEAREST", "DEFAULT", "", "OVERWRITE")
                    arcpy.AddMessage("Pyramids settings were not specified. Building pyramids by default.")
            else:
                if pyramids['pyramid_option']:
                    if pyramids['pyramid_option'] == "PYRAMIDS":
                        arcpy.BuildPyramids_management(uri, pyramids['levels'], pyramids['skip_first'],
                                                   pyramids['interpolation_type'],
                                                   pyramids['pyramid_compression'],
                                                   pyramids['compression_quality'],
                                                   pyramids['skip_existing'])
                        arcpy.AddMessage("Building pyramids based on specified environment settings from context.")
                    else:
                        arcpy.AddMessage("No pyramids built because pyramid_option is None or an incorrect word")
                else:
                    arcpy.AddMessage("No pyramids built because pyramid_option is undefined")

            arcpy.AddMessage("Data store URI: {0}".format(uri))
            # Get federated token to update image service
            if token == "" or token == "#":
                token, referer = rasterutils.getToken(isurl)
            # Read and update image service info
            sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
            if sinfo != {}:
                msg = rasterutils.updateSource(aisurl, sinfo, uri, token, referer)
                outputItemPropertyTemplate["itemProperties"]["itemText"]["popupInfo"]["title"] = filename
                imsg = rasterutils.updateItemProperties(iid, json.dumps(outputItemPropertyTemplate))
                arcpy.AddMessage(imsg)
                rasterutils.refreshPortalItem(iid)
                arcpy.AddMessage(msg)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

        if outras2 != "":
            if len(uris) < 2:
                arcpy.AddMessage("No Data store URI found for AGL output.")
            else:
                uri2 = uris[1]
                if not pyramids:
                    if rasterutils.checkPyramids(uri2):
                        arcpy.AddMessage("Pyramids are existing.")
                    else:
                        arcpy.BuildPyramids_management(uri2, "-1", "NONE", "NEAREST", "DEFAULT", "", "OVERWRITE")
                        arcpy.AddMessage("Pyramids settings were not specified. Building pyramids by default.")
                else:
                    if pyramids['pyramid_option']:
                        if pyramids['pyramid_option'] == "PYRAMIDS":
                            arcpy.BuildPyramids_management(uri2, pyramids['levels'], pyramids['skip_first'],
                                                           pyramids['interpolation_type'],
                                                           pyramids['pyramid_compression'],
                                                           pyramids['compression_quality'],
                                                           pyramids['skip_existing'])
                            arcpy.AddMessage("Building pyramids based on specified environment settings from context.")
                        else:
                            arcpy.AddMessage("No pyramids built because pyramid_option is None or an incorrect word")
                    else:
                        arcpy.AddMessage("No pyramids built because pyramid_option is undefined")

                arcpy.AddMessage("Data store URI for AGL output: {0}".format(uri2))
                # Get federated token to update image service
                if token == "" or token == "#":
                    token, referer = rasterutils.getToken(isurl2)
                # Read and update image service info
                sinfo2 = rasterutils.getServiceInfo(aisurl2, token, referer)
                if sinfo != {}:
                    msg = rasterutils.updateSource(aisurl2, sinfo2, uri2, token, referer)
                    rasterutils.refreshPortalItem(iid2)
                    arcpy.AddMessage(msg)
                else:
                    arcpy.AddWarning("No service updated although data store URI generated.")

        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(20, json.dumps(outval))

        if outras2 != "":
            outval2 = {"itemId": iid2, "url": isurl2}
            arcpy.SetParameterAsText(21, json.dumps(outval2))
        
        if AnalysisType == "OBSERVERS" and outObsRegionRelationTableName:
            arcpy.CopyRows_management(temp_fc, dsFcPath)
            desc = arcpy.Describe(dsFcPath)
            # Update Layer description with catalog path
            outputLayerDesc["layers"][0]["catalogPath"] = dsFcPath
    
            hostedgp.ProcessFeatureOutput(json.dumps(outputLayerDesc, skipkeys=False, ensure_ascii=False))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)
