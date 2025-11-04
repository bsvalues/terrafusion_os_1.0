"""-----------------------------------------------------------------------------
Name:              realityutils.py
Purpose:           Helper methods for reality mapping services
Author:            Esri Inc.
Created:           1/1/2023
Copyright:   (c)   Esri, Inc. 2023
ArcGIS Version:    11.1
-----------------------------------------------------------------------------"""

import os
import re
import json
import time
from copy import deepcopy
from datetime import datetime
import multiprocessing as mp

import arcpy
import rasterutils
import hostedgp as hgp
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

# Initialize hostedgp
hostedgp = hgp.HostedGP(None, None, False)

# Error code range:
# 120001-130000
TASK_ERROR_CODES = {
    # Reality mapping service
    "ReconstructSurface":0,
}

errorMsgs = {
    
}


def get_reality_workspace(context):
    """
    Parse the Reality workspace name from the context input given under the key "source".
    Note that it is the client's responsibility to ensure the reality workspace name is unique.
    :param context: context parameter input
    :return: workspace name if found
    """
    reality_ws = ""
    try:
        # Parse context parameter first
        if context == "" or context == "#":
            return None
        contextdict = rasterutils._parsecontext(context)

        if "workspace" in contextdict:
            if isinstance(contextdict["workspace"], str):
                reality_ws = contextdict["workspace"]

        return reality_ws
    except Exception as err:
        return reality_ws


def get_store_property(input_raster):
    """
    Read the data folder stored in the image collection keymetadata
    :param image_collection: image collection absolute path
    :return: value of key property "_store" if found
    """
    try:
        spath = arcpy.GetRasterKeyMetadata(input_raster, "_store")
        if spath:
            return spath
        return None
    except Exception as err:
        return None


# Get DEM for ortho rectification

def getDEM(context):
    """
    This method is used to get the DEM input from context for orthorectification processing
    There are 3 scenarios:
    1) {"DEM": <service input supports standard keys itemId, uri, url>}
    2) {"DEM": "DEFAULT"} - use the dem from the reality project
    3) {"DEM": "NONE"} - not use dem
    :return DEM value that can be used in Geometric Raster function
    """
    dem = ""
    try:
        if context == "" or context == "#":
            return dem
        context = json.loads(context)
        contextdict = dict((k, v) for k, v in context.items())
        if "DEM" in contextdict:
            dem = rasterutils.getInDataPath(contextdict["DEM"])
        return dem
    except:
        return dem


def parse_DEM_params(context):
    """
    :param context: additional parameter values for generate DEM
    :return: dictionaries of additional parameters
    """
    demparams = {
        # "pixelSizeUnit": "GSD",
        "method": "TRIANGULATION",
        "smoothingMethod": "GAUSS5x5",
        "applyToOrtho": True,
        "fillDEM": ""
    }
    try:
        # Interpolate point clouds parameters
        # InterpolateFromPointCloud_management(
        #       in_container, out_raster, cell_size, TRIANGULATION |
        #       NATURAL_NEIGHBOR | IDW, GAUSS5x5 | GAUSS3x3 | GAUSS7x7 |
        #       GAUSS9x9 | NONE, {DTM | DSM}, {fill_dem})
        if context == "" or context == "#":
            return demparams
        context = json.loads(context)
        contextdict = dict((k, v) for k, v in list(context.items()))

        # if "pixelSizeUnit" in contextdict:
        #     demparams["pixelSizeUnit"] = contextdict["pixelSizeUnit"]

        if "method" in contextdict:
            demparams["method"] = contextdict["method"].upper()

        if "smoothingMethod" in contextdict:
            demparams["smoothingMethod"] = contextdict["smoothingMethod"].upper()

        if "applyToOrtho" in contextdict:
            demparams["applyToOrtho"] = contextdict["applyToOrtho"]

        if "fillDEM" in contextdict:
            if contextdict["fillDEM"]:
                demparams["fillDEM"] = rasterutils.getInDataPath(contextdict["fillDEM"])

        return demparams
    except Exception as err:
        return demparams


def parse_Classify_Ground_Opts(gnd_opts):
    """
    :param gnd_opts_context: additional parameter values for interpolate point clouds
    :return: strings of classify ground options
    """
    gnd_opts_str = ""
    try:
        if gnd_opts == "" or gnd_opts == "#":
            return gnd_opts_str
        opt_json = json.loads(gnd_opts)

        if "classifyGroundOptions" in opt_json:
            opt_dict = dict((k, v) for k, v in list(opt_json["classifyGroundOptions"].items()))

            if opt_dict and isinstance(opt_dict, dict):
                opt_list = []
                for key in opt_dict:
                    if not isinstance(opt_dict[key], str):
                        opt_list.append(key + " " + str(opt_dict[key]))
                    else:
                        opt_list.append(key + " " + opt_dict[key])
                if opt_list:
                    gnd_opts_str = ";".join(opt_list)

        return gnd_opts_str
    except Exception as err:
        return gnd_opts_str


def check_product_exists(prod_path):
    """
    This method is used to check if the product path exists or not.
    We use file system path check first.
    Then try look up the data store path.
    :return true if product exists
    """
    try:
        if os.path.exists(prod_path):
            return prod_path
        else:
            prod_folder = os.path.dirname(prod_path)
            content = arcpy.gp.command("ListDatastore '" + prod_folder + "' ")
            if content.find(os.path.basename(prod_path)) > -1:
                return prod_path
        return None
    except Exception as err:
        return None


# Reality mapping SLPK utilities
def generate_slpk(input, outslpk, context):
    """
    Generate a slpk (Scene Layer Package) from existing point cloud folder or LAS dataset.
    :param input: input las dataset path or las file folder
    :param outpath: output slpk file path
    :param context: all support environment settings
    :return: output slpk file path
    """
    try:
        if input and outslpk:
            outsr = rasterutils.getOutSR(context)
            outext, extsr = rasterutils.getExtent(context)
            geotrans = rasterutils.getGeoTrans(context)
            arcpy.env.outputCoordinateSystem = outsr
            arcpy.management.CreatePointCloudSceneLayerPackage(
                in_dataset=input,
                out_slpk=outslpk,
                out_coor_system=outsr,
                transform_method=geotrans,
                attributes="INTENSITY;RGB;FLAGS;CLASS_CODE;RETURNS;USER_DATA;POINT_SRC_ID;GPS_TIME;SCAN_ANGLE;NEAR_INFRARED"
            )
            return outslpk
        return None
    except arcpy.ExecuteError:
        arcpy.AddWarning(arcpy.GetMessages())
    except Exception as err:
        arcpy.AddWarning(err)


def publish_slpk(in_slpk, out_item, type="Point_Cloud", timeout=300000):
    """
    Upload and publish a slpk (Scene Layer Package) as portal item. 
    Note, the scene layer package can either be published as a Scene Layer or Point Cloud Layer item
    :param in_slpk: scene layer package file path
    :param out_item: unique Portal item name 
    :param type: item type (Scene Layer or Point Cloud Layer)
    :return: published item id
    """
    slpkitem = None
    slayer_item_id = None
    slayer_url = None
    slpk_file_name = None
    try:
        if in_slpk.startswith("/cloudStores") or in_slpk.startswith("/rasterStores"):
            # need to transfer the slpk file from data store to local folder then upload
            temp_folder = arcpy.env.scratchFolder
            temp_slpk = os.path.join(temp_folder, os.path.basename(in_slpk))
            arcpy.gp.command(
                "TransferFiles '" + in_slpk + "' '" + temp_folder + "' -threads 0 -overwrite 1")

            if os.path.exists(temp_slpk):
                in_slpk = temp_slpk
            else:
                arcpy.AddError("Failed to publish Scene Layer Package from data store.")

        if os.path.exists(in_slpk):
            if isinstance(out_item, dict):
                if "itemProperties" in out_item and out_item["itemProperties"]:
                    out_item_props = out_item["itemProperties"]
                    if "title" in out_item_props and isinstance(out_item_props["title"], str):
                        out_item_title = out_item_props["title"]
                    else:
                        out_item_title = os.path.splitext(slpk_file_name)[0]

                    if not out_item_title:
                        raise Exception("No title specified for Scene Layer Package item.")
                    slpk_file_name = os.path.basename(in_slpk)
                    # Mesh template
                    if type == "Mesh":
                        params = {
                            "title": out_item_title,
                            "type": "Scene Package",
                            "file": in_slpk,
                            "filename": slpk_file_name,
                            "typeKeywords": [
                                "3D",
                                "ArcGIS Pro",
                                "ArcGIS Server",
                                "Scene",
                                "Scene Package",
                                "slpk"
                            ],
                            "tags": "mesh,imagery",
                        }
                    # Point cloud template
                    elif type == "Point_Cloud":
                        params = {
                            "title": out_item_title,
                            "type": "Scene Package",
                            "file": in_slpk,
                            "filename": slpk_file_name,
                            "typeKeywords": [
                                "3D",
                                "ArcGIS Pro",
                                "ArcGIS Server",
                                "Scene",
                                "Scene Package",
                                "slpk"
                            ],
                            "tags": "pointcloud,imagery",
                        }
                    # Other possible types in the future
                    else:
                        params = {
                            "title": out_item_title,
                            "type": "Scene Package",
                            "file": in_slpk,
                            "filename": slpk_file_name,
                            "typeKeywords": [
                                "3D",
                                "ArcGIS Pro",
                                "ArcGIS Server",
                                "Scene",
                                "Scene Package",
                                "slpk"
                            ],
                            "tags": "imagery",
                        }

                    props = {
                        "folderId": ""
                    }

                    if "folderId" in out_item and out_item["folderId"]:
                        props["folderId"] = out_item["folderId"]

                    # Push remaining item properties to additional request parameters
                    props.update(out_item["itemProperties"])

                    # Check if item exist, if item exists, use Update Item call
                    # Otherwise, add Item.
                    itemid = None
                    if "itemId" in out_item and out_item["itemId"]:
                        itemid = out_item["itemId"]

                    if itemid:
                        hostedgp.UpdateItem(itemid, params, props)
                        slpkitem = itemid
                        arcpy.AddMessage("Updating existing Scene Package item to the portal succeeded.")
                    else:
                        itemid = rasterutils.checkitemExist(out_item_title,"Scene Package", hostedgp)
                        if itemid:
                            hostedgp.UpdateItem(itemid, params, props)
                            slpkitem = itemid
                            arcpy.AddMessage("Updating existing Scene Package item to the portal succeeded.")
                        else:
                            slpkitem = hostedgp.AddItem(params, props)
                            arcpy.AddMessage("Adding new Scene Package item to the portal succeeded.")
                            # arcpy.AddMessage(slpkitem)
        else: 
            arcpy.AddError("Failed to publish Scene Layer Package item.")      
        
        # Now publish scene layer package to hosted scene layer
        if slpkitem:
            # Need to wait a few secs after add item to publish the Scene Layer 
            if rasterutils.USER_NAME and slpk_file_name:
                # Check status of the item, make sure the upload is completed. 
                status_itemurl = "content/users/" + rasterutils.USER_NAME + "/items/" + slpkitem + "/status"
                status_data = {"f":"json"}
                
                # Try checking the status of item for 300000 secs by default
                time_out = time.time() + timeout
                while True:
                    if time.time() > time_out:
                        break
                    
                    # Make sure we capture sharing API exception and keep retry
                    try: 
                        r = hostedgp.GenericSharingRequest(status_itemurl, status_data)
                        if "status" in r:
                            if r["status"] == "completed":
                                arcpy.AddMessage("Successfully create Scene Layer Package item.")
                                break
                            elif r["status"] == "failed":
                                arcpy.AddError("Failed to create Scene Layer Package item.")
                                break
                            elif r["status"] == None or r["status"] == "null" or r["status"] == "None" or r["status"] == "":
                                break
                        else:
                            break
                        time.sleep(10)
                    except Exception as err:
                        arcpy.AddWarning("Cannot check Scene Layer Package item upload status.")
                        break
                
                # Publish scene layer package item
                # 1) Check if scene layer already existed, if yes, delete and republish
                slayer_item_id = rasterutils.checkitemExist(out_item_title,"Scene Service", hostedgp)
                if slayer_item_id:
                    hostedgp.DeleteItem(slayer_item_id)
                
                # 2) Then publish package
                slayer_item_name = os.path.splitext(slpk_file_name)[0] 
                pub_itemurl = "content/users/" + rasterutils.USER_NAME + "/publish" 
                pub_params = {
                    "name": slayer_item_name,
                    "maxRecordCount": 2000
                }
                data = {
                        "itemId": slpkitem, 
                        "filetype": "scenepackage",
                        "publishParameters": json.dumps(pub_params),
                        "outputType": "sceneService",
                        "buildInitialCache": "true"
                    }
                # arcpy.AddMessage(str(pub_itemurl))
                # arcpy.AddMessage(str(pub_params))
                # arcpy.AddMessage(str(data))
                try:
                    r = hostedgp.GenericSharingRequest(pub_itemurl, data)
                except Exception as err:
                    arcpy.AddError("Failed to publish Scene Layer Package item as Scene Layer.")
                arcpy.AddMessage("Publish Scene Layer Package {0} as Scene Layer.".format(slpkitem))

                # Response can contain multiple services
                if "services" in r:
                    scene_services = r["services"]
                    if isinstance(scene_services, list) and len(scene_services) > 0:
                        sservice = scene_services[0]
                        if isinstance(sservice, dict):
                            if "type" in sservice and "serviceurl" in sservice and sservice["type"] == "Scene Service":
                                slayer_url = sservice["serviceurl"]
                                if "serviceItemId" in sservice:
                                    slayer_item_id = sservice["serviceItemId"]
                
                if not slayer_url:
                    arcpy.AddError("Publish Scene Layer failed, missing service URL.")
        else:
            arcpy.AddError("Scene Layer Package item does not exist.")

        return slayer_url, slayer_item_id
    except Exception as err:
        arcpy.AddError(err)
    finally:
        return slayer_url, slayer_item_id