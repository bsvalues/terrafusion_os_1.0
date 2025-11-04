"""-----------------------------------------------------------------------------
Name:              ExportToTilePackage.py
Purpose:           Export existing imagery layer item to tile package (*.tpkx)
                   and upload the file to create Tile Package item.
Author:            Esri Inc.
Created:           11/01/2021
Copyright:   (c)   Esri, Inc. 2021
ArcGIS Version:    10.9.1
-----------------------------------------------------------------------------"""
# core libraries
import json
import os
import datetime
import sys
from urllib.parse import urlparse
from urllib.parse import parse_qs
from urllib.parse import urljoin

# internal libraries
import arcpy
import rasterutils
import hostedgp as hgp


TASK_NAME = 'ExportToTilePackage'


def generate_tile_package(input_source):
    """
    Generate Tile package tpkx (or tpk) file from the input source
    :param input_source: input imagery source for tile cache generation
    :return:
    """
    try:
        temp_folder = arcpy.env.scratchFolder
        temp_cache_ds = "cacheds_" + str(datetime.datetime.now().strftime("%Y%m%d%H%M%S"))
        cacheds_path = os.path.join(temp_folder, temp_cache_ds)
        # Generate tile cache dataset in the temp location first
        arcpy.management.ManageTileCache(
            temp_folder, "RECREATE_ALL_TILES", temp_cache_ds, input_source,
            "ARCGISONLINE_SCHEME")

        if arcpy.Exists(cacheds_path):
            # Export tile cache dataset to tile package file
            temp_tpkx = "tpkx_" + str(datetime.datetime.now().strftime("%Y%m%d%H%M%S")) + ".tpkx"
            tpkx_path = os.path.join(temp_folder, temp_tpkx)
            arcpy.management.ExportTileCache(
                cacheds_path, temp_folder, temp_tpkx, "TILE_PACKAGE_TPKX", "COMPACT_V2")
            if arcpy.Exists(tpkx_path):
                return tpkx_path
            else:
                arcpy.AddError("Failed to generate tile package.")
                sys.exit(0)
        else:
            arcpy.AddError(arcpy.GetMessages())
            sys.exit(0)

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages())
        sys.exit(0)


if __name__ == '__main__':

    # Define python scripting tool input parameters
    in_imagery_layer = arcpy.GetParameterAsText(0)
    out_tiled_package = arcpy.GetParameterAsText(1)
    context = arcpy.GetParameterAsText(2)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkHostedImageryPrivilge()

        # 1. Validating input parameters
        # Parse the input JSON to a simple layer item URL
        # Note: input could either be a portal item ID or the complete item URL
        if isinstance(in_imagery_layer, str):
            in_imagery_layer = in_imagery_layer.replace("\\n","")
            indict = list(rasterutils.getJSON(in_imagery_layer))
            if not indict:
                arcpy.AddWarning("Input data is not a valid JSON.")
            else:
                in_imagery_layer = indict[0]

        # Get the proper item url and service url
        layer_item_url = ""
        service_url = ""
        rehgp = hgp.HostedGP(None, None, False)
        
        # Note: item URL takes higher priority than item ID
        if "url" in in_imagery_layer:
            layer_item_url = in_imagery_layer["url"]
        elif "itemId" in in_imagery_layer:
            layer_item_id = in_imagery_layer["itemId"]

            # Retrieve item info if input is just item ID
            iteminfo = None
            portal_url = ""
            # If item info returns, input is a valid item ID.
            # otherwise treat it as complete item URL. 
            try: 
                iteminfo = rehgp.GetItem(layer_item_id)
                portal_url = rehgp.GetOwningSystem()
                # arcpy.AddMessage(iteminfo)
                # arcpy.AddMessage(portal_url)
            except:
                pass

            if iteminfo and "url" in iteminfo:
                layer_item_url = portal_url + "/sharing/rest/content/items/" + layer_item_id
                service_url = iteminfo["url"]
            else:
                arcpy.AddError("Invalid Imagery Layer item - cannot find item info.")
                sys.exit(0)
        else:
            arcpy.AddError("Invalid Input Imagery Layer. Please provide item Id or item URL.")
            sys.exit(0)

        # arcpy.AddMessage("Layer item URL: " + layer_item_url)
        # arcpy.AddMessage("Service URL: " + service_url)

        # Generate rendered layer file for tiled package generation
        # Check if token is in item URL
        try:
            parsed_url = urlparse(layer_item_url)
            token = parse_qs(parsed_url.query)["token"][0]
        except:
            pass

        if token:
            # arcpy.AddMessage("Token in the URL: " + token)
            layer_item_url = urljoin(layer_item_url, parsed_url.path)

            arcpy.AddMessage("Generating map layer file for tile package creation.")
            rendered_lyr = arcpy.gp.command(
                "ConvertWebLayerItem -layerItemURL " + layer_item_url + " -token " + token + " -format lyrx")
            # arcpy.AddMessage("Map layer file as tile package source: {}".format(rendered_lyr))
        else:
            # TODO: enhance the core method to utilize ServerEnvironment and PortalHelper to get the token
            # arcpy.AddMessage("Generating token for imagery layer item.")
            # if service_url:
            #     token, referer = rasterutils.getToken(service_url, 5)
            # else:
            #     arcpy.AddError("Cannot generate token for imagery layer item.")
            #     sys.exit(0)  
            arcpy.AddMessage("Generating map layer file for tile package creation.")
            rendered_lyr = arcpy.gp.command(
                "ConvertWebLayerItem -layerItemURL " + layer_item_url + " -format lyrx") 
            # arcpy.AddMessage("Map layer file as tile package source: {}".format(rendered_lyr))    

        # 2: Start generating tile package if layer file successfully created.
        # 3: Upload and create a tile package item when tpkx was successfully created.
        outval = ""
        if arcpy.Exists(rendered_lyr):
            img_tpkx = generate_tile_package(rendered_lyr)
            # arcpy.AddMessage("Tile package generated: {}".format(img_tpkx))
            if img_tpkx:
                img_tpkx_name = os.path.basename(img_tpkx)
                params = {
                    "title": out_tiled_package,
                    "type": "Tile Package",
                    "multipart": True,
                    "file": img_tpkx,
                    "filename": img_tpkx_name,
                    "tags": "tile package",
                    "typeKeywords": "ArcGlobe, ArcMap, Data, Tile Package, tpk, tpkx"
                }
                props = {
                    "folderId": ""
                }
                tile_package_json = list(rasterutils.getJSON(out_tiled_package))
                if len(tile_package_json) > 0:
                    tile_package_json = tile_package_json[0]
                    if isinstance(tile_package_json, dict) and "title" in tile_package_json:
                        tile_package_json["file"] = img_tpkx
                        tile_package_json["filename"] = img_tpkx_name
                        params = tile_package_json
                        if "folderId" in tile_package_json:
                            props = {
                                "folderId": tile_package_json["folderId"]
                            }

                tpitem = rehgp.AddItem(params, props)
                outval = json.dumps({"itemId": tpitem})
        else:
            arcpy.AddError("Failed to generate tile package")

        arcpy.SetParameterAsText(3, outval)

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages())

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except hgp.GPCloudExec as err:
        rasterutils.AddExceptionError(TASK_NAME, "Exception raised during publishing Tile Package item : "
                                      + str(err))
    except Exception as err:
        arcpy.AddError(err)
