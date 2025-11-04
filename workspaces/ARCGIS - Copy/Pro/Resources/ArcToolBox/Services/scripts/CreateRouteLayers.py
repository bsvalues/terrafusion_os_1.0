"""---------------------------------------------------------------------------
Name:              CreateRouteLayers.py
Purpose:           Create one or more route layer items based on network analysis
                   results.
Author:            Esri Inc.
Created:           10/26/2016
Copyright:   (c)   Esri, Inc. 2016
ArcGIS Version:    December 2016 update
---------------------------------------------------------------------------"""

#core libraries
import json
import os
import ast

#internal libraries
import arcpy
import hostedgp as agolgp
import aolutils
import networkanalysis

###Constants used in Debugging
DEBUG = False
###

###Constants about tool info
TASK_NAME = "CreateRouteLayers"
PARAM_NAMES = {
    "routeData" : 0,
    "deleteRouteData" : 1,
    "outputName" : 2,
    "context" : 3,
    "routeLayers" : 4,
    }
###

###Constants used in the tool
# Maximum number of route layers that can be created
MAX_ROUTE_LAYER_COUNT = 1000
###

def create_route_layers(hostedgp, route_data_file, warn_if_limit_execeeded=True):
    '''create route layer items in the portal'''

    portal_url = hostedgp.GetOwningSystem()
    portal_self = json.loads(hostedgp.GetSelf())
    #output item ids
    output_items = {
        "portalUrl": portal_url,
        "folderId": "",
        "items": {}
    }
    routes_without_route_layers = []
    #Get the org specific URL for the item if the portal is ArcGIS Online
    item_url = "{}/home/item.html?id=".format(portal_url)
    if not portal_self.get("isPortal", False):
        custom_base_url = portal_self.get("customBaseUrl", "")
        url_key = portal_self.get("urlKey", "")
        if custom_base_url and url_key:
            item_url = "https://{}.{}/home/item.html?id=".format(url_key, custom_base_url)
    output_item_properties = {}
    folder_id = ""
    output_name_json = {}
    title = ""
    output_feature_service_item_id = ""
    
    #Check create content privilege
    if not hostedgp.CheckPrivilege(aolutils.PRIVILEGE_CREATE_ITEM):
        aolutils.AddErrorCode(100118, aolutils.errorMsgs.get(100118, "Your user role doesn't include the create content privilege"))
        raise arcpy.ExecuteError

    #Get the output item properties such as folderId, title and tags
    output_name = hostedgp.outputName.json
    if output_name:
        #output_name_json = json.loads(output_name)
        output_name_json = ast.literal_eval(output_name)
        output_item_properties = output_name_json.get("itemProperties", {})

        #Check if title is present within itemProperties of output name json. 
        title = output_item_properties.get("title", "")
        if not title:
            #Try using name from serviceProperties of output name json
            service_properties_json = output_name_json.get("serviceProperties", {})
            if "name" in service_properties_json:
                title = service_properties_json["name"]

        #Check to see if items are to be created in a folder    
        folder_id = output_item_properties.get("folderId", "")
        output_items["folderId"] = folder_id

        #Check if the route layers items are to be related with a feature service item
        output_feature_service_item_id = output_item_properties.get("itemId", "")

    #Get the item info from route layer data file
    create_route_layer_data = networkanalysis.CreateRouteLayerData(route_data_file, aolutils.AddErrorCode,
                                                                   aolutils.AddErrorCode)

    #return a empty dict if the total number of routes in the route data is greater than MAX_ROUTE_LAYER_COUNT
    route_count = create_route_layer_data.routeCount
    if route_count  > MAX_ROUTE_LAYER_COUNT:
        msg_params = {"routeCount" : route_count, "max": MAX_ROUTE_LAYER_COUNT}
        msg = networkanalysis.CreateRouteLayerData.ERROR_CODES[100247].format(**msg_params)
        aolutils.AddErrorCode(100247, msg, msg_params, warn_if_limit_execeeded)
        return {}
    #Add route layer items
    for route_id, item in create_route_layer_data:
        #Save route layer data to a JSON file for debugging
        if DEBUG:
            out_file = os.path.join(arcpy.env.scratchFolder, "RouteLayerData_{}.json".format(route_id))
            with open(out_file, "w") as fp:
                json.dump({route_id : item}, fp, ensure_ascii=True, indent=2, sort_keys=True)

        item_properties = {}
        route_name = item["title"]
        arcpy.AddMessage("Creating route layer for Route: {}".format(route_name))

        add_item_properties = {}
        # update tags
        tags = output_item_properties.get("tags", "")
        if tags:
            # Remove any duplicate tags
            default_tags = {default_tag.strip() for default_tag in item["tags"].split(",")}
            # Input tags come in as str. So convert them to unicode
            input_tags = {tag.strip() for tag in tags.split(",")}
            item["tags"] = ", ".join(sorted(default_tags.union(input_tags)))
        #arcpy.AddMessage(item["tags"])
        #update snippet
        snippet = output_item_properties.get("snippet", "")
        if snippet:
            item["snippet"] = snippet
        #update title. Only use the title value as a prefix        
        if title:
            #Check for the presence of {} in the title. If found treat {} as a format string replacing it with
            #route name
            start_curly_brace = title.find("{")
            end_curly_brace = title.find("}")
            if start_curly_brace != -1 and end_curly_brace != -1:
                item["title"] = "{}{}{}".format(title[0: start_curly_brace], route_name, title[end_curly_brace + 1:])
            else:
                # Ensure title is unicode since route_name is always unicode.
                # Converting title to unicode can sometimes fail in the python standard library
                try:
                    item["title"] = "{} - {}".format(title, route_name)
                except Exception as ex:
                    arcpy.AddMessage("Failed to append prefix to route name. Setting title to {}".format(route_name))
                    networkanalysis.log_error_call_stack()
                    item["title"] = route_name
        #Add a Service2Route relationship between output feature service
        if output_feature_service_item_id:
            arcpy.AddMessage("Adding Service2Route relationship with item {}".format(output_feature_service_item_id))
            item["originItemId"] = output_feature_service_item_id
            item["relationshipType"] = "Service2Route"

        #Add route layer item. Skip adding the item in case AddItem fails
        try:
            # arcpy.AddMessage(f"Item extent just before making AddItem call: {item['extent']}")
            if folder_id:
                add_item_properties["folderId"] = folder_id
                output_item_id = hostedgp.AddItem(item, add_item_properties)
            else:
                output_item_id = hostedgp.AddItem(item, add_item_properties)
        except agolgp.GPCloudExec as ex:
            routes_without_route_layers.append(route_name)
            continue
        # Update tags and typeKeywords as for some reason hostedgp.AddItem does not seem to update tags and it will only
        # keep Feature Collection as the type keyword when creating Service2Route relationships.
        # Since moving to Pro Server hostedgp.AddItem also does not apply extent.
        update_item_properties = {
            "tags": item["tags"],
            "typeKeywords": item["typeKeywords"],
            "extent": item["extent"]
        }    
        hostedgp.UpdateItem(output_item_id, update_item_properties)

        item_properties = {
            "url": item_url + output_item_id,
            "title": item["title"],
            "routeName" : route_name,
        }
        output_items["items"][output_item_id] = item_properties
        # Add a warning message in case some route layers were not created.
        if routes_without_route_layers:
            aolutils.AddErrorCode(100246, networkanalysis.CreateRouteLayerData.ERROR_CODES[100246],
                                  {"routeNames" : ", ".join(routes_without_route_layers)}, True)


    return output_items

def delete_item(hostedgp, item_id):
    """Deletes an Item."""

    # TODO: Once hostedgp has a call to delete item, use it to delete the route data file item
    # Get the item details to determine the item owner and if the item is contained in a folder
    route_data_item_details = hostedgp.GenericSharingRequest("content/items/{}".format(item_id),
                                                                {"f": "json"})
    route_data_item_folder = route_data_item_details.get("ownerFolder", None)
    if route_data_item_folder:
        rd_item_delete_url = "content/users/{owner}/{ownerFolder}/items/{id}/delete"
    else:
        rd_item_delete_url = "content/users/{owner}/items/{id}/delete"
    
    try:
        delete_response = hostedgp.GenericSharingRequest(rd_item_delete_url.format(**route_data_item_details),
                                                        {"f": "json"})
        delete_success = delete_response.get("success", False)
        if delete_success:
            arcpy.AddMessage("Successfully deleted route data item {}".format(item_id))
        else:
            aolutils.AddErrorCode(100225, networkanalysis.CreateRouteLayerData.ERROR_CODES[100225],
                                {"itemId" : item_id}, True)
    except agolgp.GPCloudExec as ex:
        aolutils.AddErrorCode(100225, networkanalysis.CreateRouteLayerData.ERROR_CODES[100225],
                                {"itemId" : item_id}, True)


if __name__ == "__main__":
    
    hostedgp = None
    
    try:
        hostedgp = agolgp.HostedGP(PARAM_NAMES["context"], PARAM_NAMES["outputName"])
        handled_error_codes = list(networkanalysis.CreateRouteLayerData.ERROR_CODES.keys())
        
        #Read the route data file from the route data item
        with networkanalysis.LogExecutionTime("Read inputs"):
            route_data_item = arcpy.GetParameterAsText(PARAM_NAMES["routeData"])
            delete_route_data_item = arcpy.GetParameter(PARAM_NAMES["deleteRouteData"])
            try:
                # route_data_json = json.loads(route_data_item.replace("'", '"'))
                route_data_json = ast.literal_eval(route_data_item)
            except ValueError as ex:
                aolutils.AddErrorCode(100219, networkanalysis.CreateRouteLayerData.ERROR_CODES[100219],
                                      {"paramName" : "routeData"})
                raise arcpy.ExecuteError

            if "itemId" not in route_data_json:
                aolutils.AddErrorCode(100219, networkanalysis.CreateRouteLayerData.ERROR_CODES[100219],
                                      {"paramName" : "routeData"})
                raise arcpy.ExecuteError
            
            route_data_item_id = route_data_json["itemId"]
            route_data_file = os.path.join(arcpy.env.scratchFolder, "route_data.zip")
            try:
                hostedgp.GetItemDataAsFile(route_data_item_id, route_data_file)
            except agolgp.GPCloudExec as ex:
                aolutils.AddErrorCode(100224, networkanalysis.CreateRouteLayerData.ERROR_CODES[100224],
                                      {"itemId" : route_data_item_id})
                raise arcpy.ExecuteError

        #Add the items
        try:
            output_items = create_route_layers(hostedgp, route_data_file, False)
            if not output_items:
                raise arcpy.ExecuteError
            arcpy.SetParameterAsText(PARAM_NAMES["routeLayers"], json.dumps(output_items))
        except Exception as ex:
            # Try to delete the route data item if asked to even if creating route layers has failed.
            if delete_route_data_item:
                delete_item(hostedgp, route_data_item_id)
            raise
        
        #Delete the route data item
        if delete_route_data_item:
            delete_item(hostedgp, route_data_item_id)

    except arcpy.ExecuteError as ex:
        networkanalysis.log_error_call_stack()
        aolutils.AddExecuteErrors(TASK_NAME, handled_error_codes)
        #Add any error messages that do not have predefined error codes
        arcpy.AddMessage(str(ex))

    except SystemExit as ex:
        #Will be raised when the script is being cancelled.
        arcpy.AddMessage("No outputs as script was canceled")

    except Exception as err:
        networkanalysis.log_error_call_stack()
        aolutils.AddExceptionError(TASK_NAME, err)
    finally:
        if hostedgp:
            hostedgp.Cleanup()
