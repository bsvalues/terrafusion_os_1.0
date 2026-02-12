"""-----------------------------------------------------------------------------
Name:           MultidimensionalPrincipalComponents.py
Purpose:        Transforms multidimensional rasters into their principal components, loadings, and eigenvalues. 
Author:         Esri Inc.
Created:        12/19/2021
Copyright:      (c)   Esri, Inc. 2021
ArcGIS Version: 11.1
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

TASK_NAME = "MultidimensionalPrincipalComponents"
errorMsgs = {
    120201: "A service already exists with this name. Please use a different name."
}


def getItemIDFromUrl(url):
    """
    This method is used to get the itemid from either item url or service url
    :param url: portal item url, or service url
    :return itemid: item id
    """
    itemid = ""
    try:
        token, referer = rasterutils.getToken(url, 5)
        isconfig = rasterutils.getServiceInfo(url, token, referer)
        if isconfig:
            if "portalProperties" in isconfig and "itemID" in isconfig["portalProperties"]:
                itemid = isconfig["portalProperties"]["itemID"]
            elif "portalProperties" in isconfig and "portalItems" in isconfig["portalProperties"]:
                itemidslist = isconfig["portalProperties"]["portalItems"]
                if isinstance(itemidslist, list):
                    for iid in itemidslist:
                        if isinstance(iid, dict):
                            if "type" in iid and "itemID" in iid:
                                if iid["type"] == "FeatureServer":
                                    return iid["itemID"]
        else:
            # Parse the input url to make sure it is itemURL
            if url.find("/content/items/") > -1:
                urldict = url.split("/")
                if urldict[-2] == "items":
                    itemid = urldict[-1]

        return itemid
    except Exception as err:
        arcpy.AddMessage(str(err))
        return itemid


def get_item_id(input_feature_service):
    json_dict = rasterutils._parsecontext(input_feature_service)
    iid = ""

    if "itemProperties" in json_dict:
        iprops = json_dict["itemProperties"]
    else:
        iprops = {}

    if "itemId" in json_dict:
        iid = json_dict["itemId"]
    elif "url" in json_dict:
        is_url = json_dict["url"]
        aisurl = rasterutils.getISAdminUrl(is_url)
        aisurl = aisurl.replace("/FeatureServer", ".FeatureServer")
        iid = getItemIDFromUrl(aisurl)
    elif "uri" in json_dict:
        out_table = json_dict["uri"]

    elif "serviceProperties" in json_dict:
        sprops = json_dict["serviceProperties"]
        # item properties at the same level as "serviceProperties"
        if "itemProperties" in json_dict:
            iprops = json_dict["itemProperties"]
        else:
            iprops = {}

        if "itemId" in iprops:
            iid = iprops["itemId"]
        elif "serviceUrl" in sprops:
            isurl = sprops["serviceUrl"]
            aisurl = rasterutils.getISAdminUrl(isurl)
            iid = getItemIDFromUrl(aisurl)

    return iid

if __name__ == '__main__':
    
    inputMultidimensionalRaster = arcpy.GetParameterAsText(0)   # Input image service(s) to be trained on.
                                                                # e.g. {"url": "http://a/a/b/imageserver"}; 
                                                                #      {"urls": ["http://a/a/b/imageserver", "http://a/a/c/imageserver"]} 
                                                                # or   {"uri": "http://a/a/b/imageserver"};
                                                                #      {"uris": ["http://a/a/b/imageserver", "http://a/a/c/imageserver"]}
                                                                # or   {"itemId": "abcdefghijklmnopqrstuvwxyz"}
                                                                #      {"itemIds": ["abcdefghijklmnopqrstuvwxyz", "zyxwvutsrqponmlkjihgfedcba"]}
    
    mode = arcpy.GetParameterAsText(1)
    dimension = arcpy.GetParameterAsText(2)
    variable = arcpy.GetParameterAsText(3) 
    numberOfPrincipalComponents = arcpy.GetParameterAsText(4)
    outputPrincipalComponentsName = arcpy.GetParameterAsText(5)
    outputLoadingsName = arcpy.GetParameterAsText(6)
    outputEigenValuesTableName = arcpy.GetParameterAsText(7)
    context = arcpy.GetParameterAsText(8)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Parse the input parameters
        inputMultidimensionalRaster = rasterutils.getInDataPath(inputMultidimensionalRaster)
        if isinstance(inputMultidimensionalRaster, dict):
            inputMultidimensionalRaster = json.dumps(inputMultidimensionalRaster)

        """
        Steps:
        1. If mode == dimension
           - check if itemID is provided for principal components (and if so) as RASTER
           - check if itemID is provided for loadings (and if so) as FEATURE [table]
        2. If mode == spatial
           - check if itemID is provided for principal components (and if so) as FEATURE [table]
           - check if itemID is provided for loadings (and if so) as RASTER
        """

        hosted_gp = hgp.HostedGP(8, None)
        output_principal_components = ""
        output_loadings = ""
        crf_output_parameter = None
        table_output_parameter = None
        is_iid = ""

        # Get the output raster from JSON object that may contain ItemId, image service url or CRF
        if mode.lower() == "dimension_reduction":
            is_iid, isurl, aisurl, outputPrincipalComponentsName = rasterutils.getOutRasterPath(outputPrincipalComponentsName)
            if is_iid != "":
                item_details = hosted_gp.GetItem(is_iid)
                if item_details["type"] != "Image Service":
                    arcpy.AddError("Invalid item type. Please provide an Image Service.")
                    sys.exit(1)
            output_principal_components = rasterutils.appendcrf(outputPrincipalComponentsName)
            crf_output_parameter = 9

            fs_iid = get_item_id(input_feature_service=outputLoadingsName)
            if fs_iid != "":
                item_details = hosted_gp.GetItem(fs_iid)
                if item_details["type"] != "Feature Service":
                    arcpy.AddError("Invalid item type. Please provide a Feature Service.")
                    sys.exit(1)

            hostedgp_loadings = hgp.HostedGP(8, 6)
            outputLoadingsServiceName = hostedgp_loadings.GetOutputName(6)
            # Check publishing privilege
            aolutils.checkPublishingPrivilege(hostedgp_loadings, outputLoadingsServiceName)
            # This parameter will be set when the tool is successful
            arcpy.SetParameterAsText(10, "")
            output_loadings = aolutils.createOutputLocations(hostedgp_loadings, outputLoadingsServiceName)
            table_output_parameter = 10

        elif mode.lower() == "spatial_reduction":
            is_iid, isurl, aisurl, outputLoadingsName = rasterutils.getOutRasterPath(outputLoadingsName)
            if is_iid != "":
                item_details = hosted_gp.GetItem(is_iid)
                if item_details["type"] != "Image Service":
                    arcpy.AddError("Invalid item type. Please provide an Image Service.")
                    sys.exit(1)
            output_loadings = rasterutils.appendcrf(outputLoadingsName)
            crf_output_parameter = 10

            fs_iid = get_item_id(input_feature_service=outputPrincipalComponentsName)
            if fs_iid != "":
                item_details = hosted_gp.GetItem(fs_iid)
                if item_details["type"] != "Feature Service":
                    arcpy.AddError("Invalid item type. Please provide a Feature Service.")
                    sys.exit(1)

            hostedgp_principal_components = hgp.HostedGP(8, 5)
            outputPrincipalComponentsServiceName = hostedgp_principal_components.GetOutputName(5)
            # Check publishing privilege
            aolutils.checkPublishingPrivilege(hostedgp_principal_components, outputPrincipalComponentsServiceName)
            # This parameter will be set when the tool is successful
            arcpy.SetParameterAsText(9, "")
            output_principal_components = aolutils.createOutputLocations(hostedgp_principal_components, outputPrincipalComponentsServiceName)
            table_output_parameter = 9

        # 2.b. Check if outputEigenValuesTableName is specified
        dsFcpathEigenValues = ""
        hostedgp_ev = hgp.HostedGP(8, 7)
        if outputEigenValuesTableName != "":
            outputEigenValuesName = hostedgp_ev.GetOutputName(7)
            # Check publishing privilege
            aolutils.checkPublishingPrivilege(hostedgp_ev, outputEigenValuesName)
            # This parameter will be set when the tool is successful
            arcpy.SetParameterAsText(11, "")
            dsFcpathEigenValues = aolutils.createOutputLocations(hostedgp_ev, outputEigenValuesName)

        # 3. Parse GP environment settings honored by this tool
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        arcpy.env.resamplingMethod = rasterutils.getResamplingMethod(context)
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)

        # 4. Execute the tool =================================================================================
        arcpy.AddMessage("Computing principal components...")
        arcpy.gp.MultidimensionalPrincipalComponents_ia(inputMultidimensionalRaster,
                                                        mode,
                                                        dimension,
                                                        output_principal_components,
                                                        output_loadings,
                                                        dsFcpathEigenValues,
                                                        variable,
                                                        numberOfPrincipalComponents)

        arcpy.AddMessage("Tool execution complete.")
        # uri = rasterutils.getURI(arcpy.GetMessages(), outputPrincipalComponentsName)
        if mode.lower() == "dimension_reduction":
            uri = rasterutils.getURI(arcpy.GetMessages(), output_principal_components)
        elif mode.lower() == "spatial_reduction":
            uri = rasterutils.getURI(arcpy.GetMessages(), output_loadings)
        # Update output ========================================================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        if not uri:
            arcpy.AddMessage("No data store URI returned.")
        else:
            arcpy.AddMessage("Updating service with data store URI.")
            # Get federated token to update image service
            token, referrer = rasterutils.getToken(isurl)
            #  Read and update image service info
            sinfo = rasterutils.getServiceInfo(aisurl, token, referrer)
            if sinfo != {}:
                msg = rasterutils.updateSource(aisurl, sinfo, uri, token, referrer)
                arcpy.AddMessage(msg)
                rasterutils.refreshPortalItem(is_iid)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

        outval = {"itemId": is_iid, "url": isurl}
        arcpy.SetParameterAsText(crf_output_parameter, json.dumps(outval))
        
        # Create drawing info for output loadings table
        if mode.lower() == "dimension_reduction":
            output_lyr = output_loadings
            service_for_publisher = outputLoadingsName
            hosted_gp_table = hostedgp_loadings
        elif mode.lower() == "spatial_reduction":
            output_lyr = output_principal_components
            service_for_publisher = outputPrincipalComponentsName
            hosted_gp_table = hostedgp_principal_components

        output_table_lyr = PAOutputFeatureLayer(output_lyr)
        publisher_table = FeatureServiceLayerPublisher(json.loads(service_for_publisher))
        publisher_table.add_layer_to_publish(output_table_lyr, table_output_parameter, "MultidimensionalPrincipalComponents", layer_index=0)
        publisher_table.publish()
        update_item_properties = {
            "typeKeywords": 'Table'
        }
        opjson = arcpy.GetParameterAsText(table_output_parameter)
        opdict = json.loads(opjson)
        output_item_id = None
        if "itemId" in opdict:
            output_table_item_id = opdict["itemId"]
            hosted_gp_table.UpdateItem(output_table_item_id, update_item_properties)

        if outputEigenValuesTableName != "":
            output_ev_lyr = PAOutputFeatureLayer(dsFcpathEigenValues)
            publisher_ev = FeatureServiceLayerPublisher(json.loads(outputEigenValuesTableName))
            publisher_ev.add_layer_to_publish(output_ev_lyr, 11, "MultidimensionalPrincipalComponents", layer_index=0)
            publisher_ev.publish()
            update_item_properties = {
                "typeKeywords": 'Table'
            }
            opjson = arcpy.GetParameterAsText(11)
            opdict = json.loads(opjson)
            output_item_id = None
            if "itemId" in opdict:
                output_ev_table_item_id = opdict["itemId"]
                hostedgp_ev.UpdateItem(output_ev_table_item_id, update_item_properties)

    except rasterutils.LicenseError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
