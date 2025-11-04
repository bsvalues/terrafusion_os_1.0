"""-----------------------------------------------------------------------------
Name:              EstimateRasterAnalysisCost.py
Purpose:           This is the system Geoprocessing service to estimate ArcGIS
                   Online credit cost to execute Raster Analysis tasks
Author:            Esri Inc.
Created:           4/6/2020
Copyright:   (c)   Esri, Inc. 2020
ArcGIS Version:    10.8.1
-----------------------------------------------------------------------------"""
# core libraries
import json
import sys

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'EstimateRasterAnalysisCost'


def set_minimum_credits(creditsstr):
    """
    Set minimum credit for a analysis task
    :param creditsstr: estimated credit string returned by Estimate Raster Analysis
    Task Cost tool
    :return: minimum credit cost string, current minimum is 1 credit
    """
    outcredits = creditsstr
    try:
        creditJSON = list(rasterutils.getJSON(outcredits))
        if len(creditJSON) > 0:
            creditJSON = creditJSON[0]
            if "credits" in creditJSON:
                if creditJSON["credits"] > 0 and creditJSON["credits"] < 1:
                    creditJSON["credits"] = 1
                    outcredits = json.dumps(creditJSON)

        return outcredits
    except Exception as err:
        return outcredits


def update_exporttpk_task(taskjson):
    """
    Specific logical for ExportToTilePackage service tool. The input portal item needs to be swapped 
    to layer file path.
    :param taskjson: task JSON for credit estimation
    :return: modified task JSON for credit estimation
    """
    try:
        if isinstance(taskjson, dict):
            if "name" in taskjson and taskjson["name"] == "ExportToTilePackage":
                if "parameters" in taskjson:
                    taskparam = taskjson["parameters"]
                    if "inputImageryLayer" in taskparam and taskparam["inputImageryLayer"]:

                        from urllib.parse import urlparse
                        from urllib.parse import parse_qs
                        from urllib.parse import urljoin

                        input_is = taskparam["inputImageryLayer"]
                        layer_item_url = ""

                        if isinstance(input_is, str):
                            taskjsondict = list(rasterutils.getJSON(input_is))
                            if len(taskjsondict) > 0:
                                input_is = taskjsondict[0]

                        if "url" in input_is:
                            layer_item_url = input_is["url"]    
                        elif "itemId" in input_is:
                            layer_item_id = input_is["itemId"]

                            # Retrieve item info if input is just item Id
                            import hostedgp as hgp
                            rehgp = hgp.HostedGP(None, None, False)
                            iteminfo = None
                            portal_url = ""
                            # If item info returns, input is a valid item ID.
                            # otherwise treat it as complete item URL. 
                            try: 
                                iteminfo = rehgp.GetItem(layer_item_id)
                                portal_url = rehgp.GetOwningSystem()
                            except:
                                pass

                            if iteminfo and "url" in iteminfo:
                                layer_item_url = portal_url + "/sharing/rest/content/items/" + layer_item_id

                        if layer_item_url:
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
                                arcpy.AddMessage("Generating map layer file for tile package creation.")
                                rendered_lyr = arcpy.gp.command(
                                    "ConvertWebLayerItem -layerItemURL " + layer_item_url + " -format lyrx") 
                                # arcpy.AddMessage("Map layer file as tile package source: {}".format(rendered_lyr))

                            if rendered_lyr:
                                taskjson["parameters"]["inputRaster"] = {"uri": rendered_lyr}
                                # arcpy.AddMessage(str(taskjson))
                                return taskjson

        return None
    except Exception as err:
        return None
    

if __name__ == '__main__':
    # Parsing Input Parameters
    taskjson = arcpy.GetParameterAsText(0)
    context = arcpy.GetParameterAsText(1)

    try:
        # 1. Read and validate input task JSON
        taskjsondict = list(rasterutils.getJSON(taskjson))

        if not taskjsondict:
            arcpy.AddError("Input is not a valid JSON.")
            arcpy.SetParameterAsText(2, "")
            sys.exit(0)
        elif "name" not in taskjsondict[0].keys() and "parameters" not in taskjsondict[0].keys():
            arcpy.AddError(
                "Input is not a valid Raster Analysis task JSON. JSON must contain analysis tool name and parameters.")
            arcpy.SetParameterAsText(2, "")
            sys.exit(0)

        # Read context parameter from task JSON if wasn't given in context parameter
        if "parameters" in taskjsondict[0] and "context" in taskjsondict[0]["parameters"] and not context:
            context = taskjsondict[0]["parameters"]["context"]

        # 2. Set environment settings
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.extent = outext
        arcpy.env.resamplingMethod = rasterutils.getResamplingMethod(context)
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        arcpy.env.mask = rasterutils.getMask(context)

        # 3. Run estimate cost tool
        # Special handling for ExportToTilePackage tool
        newtaskjson = update_exporttpk_task(taskjsondict[0])
        if newtaskjson:
            result = arcpy.gp.EstimateRasterAnalysisCost_server(json.dumps(newtaskjson))
        else:
            result = arcpy.gp.EstimateRasterAnalysisCost_server(taskjson)

        # 4. Add minimum charge to 1 credit
        outcredits = result.getOutput(0)
        outcredits = set_minimum_credits(outcredits)

        # Set output raster parameter
        arcpy.SetParameterAsText(2, outcredits)

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages())

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
