"""---------------------------------------------------------------------------
Name:              PlanRoutes.py
Purpose:           Assigns stops to best routes and finds the best sequence to visit
                   the stops that will minimize the travel time.
Author:            Esri Inc.
Created:           1/28/2014
Copyright:   (c)   Esri, Inc. 2014
ArcGIS Version:    March 2014 update
---------------------------------------------------------------------------"""

#core libraries
import time
import json

#internal libraries
import arcpy
import hostedgp as agolgp
import aolutils
import rendererUtils
import networkanalysis
import popup
from CreateRouteLayers import create_route_layers

###Constants used in Debugging
DEBUG = False
OUT_WORKSPACE = "in_memory"
#OUT_WORKSPACE = arcpy.env.scratchGDB
if DEBUG:
    OUT_WORKSPACE = arcpy.env.scratchGDB
    arcpy.env.overwriteOutput = True
###

###Constants about tool info
TASK_NAME = "PlanRoutes"
PARAM_NAMES = {
    "stopsLayer" : 0,
    "routeCount" : 1,
    "maxStopsPerRoute" : 2,
    "routeStartTime" : 3,
    "startLayer" : 4,
    "startLayerRouteIDField" : 5,
    "returnToStart" : 6,
    "endLayer" : 7,
    "endLayerRouteIDField" : 8,
    "travelMode" : 9,
    "stopServiceTime" : 10,
    "maxRouteTime" : 11,
    "outputName" : 12,
    "context" : 13,
    "includeRouteLayers" : 14,
    "pointBarrierLayer": 15,
    "lineBarrierLayer": 16,
    "polygonBarrierLayer": 17,
    "routesLayer" : 18,
    "assignedStopsLayer" : 19,
    "unassignedStopsLayer" : 20,
    "routeLayerItems": 21,
    }
###

###Constants for defining renderers
SYMBOL_COLOR = [233, 191, 255, 255]
SYMBOL_OUTLINE_COLOR = [255, 255, 115, 255]
LINE_BASE_SYMBOL = {
    "type": "esriSLS",
    "style": "esriSLSSolid",
    "color": SYMBOL_COLOR,
    "width" : 2.0, #arcgis.com map viewer will show symbol size as this value +1
    "outline": {
        "type": "esriSLS",
        "style": "esriSLSSolid",
        "color": SYMBOL_OUTLINE_COLOR,
        "width": 2.0
        }
    }
POINT_BASE_SYMBOL = {
    "type":"esriSMS",
    "style":"esriSMSCircle",
    "color":SYMBOL_COLOR,
    "size": 10.0,
    "outline": {
        "color":SYMBOL_OUTLINE_COLOR,
        "width":1.0
        }
    }

UNIQUE_VALUE_RENDERER_DEF = {
    "type": "uniqueValueDef",
    "uniqueValueFields": ["RouteName"],
    "fieldDelimiter": ",",
    "baseSymbol": POINT_BASE_SYMBOL,
    "colorRamp": {
        "type": "multipart",
        "colorRamps": [
            {
             "type": "algorithmic",
             "fromColor": [132, 0, 168, 255],
             "toColor": [231, 150, 255, 255],
             "algorithm": "esriHSVAlgorithm"
             },
            {
             "type": "algorithmic",
             "fromColor": [133, 188, 255, 255],
             "toColor": [0, 78, 186, 255],
             "algorithm": "esriHSVAlgorithm"
            },
            {
             "type": "algorithmic",
             "fromColor": [112, 224, 0, 255],
             "toColor": [0, 163, 54, 255],
             "algorithm": "esriHSVAlgorithm"
            }
            ]
        }
    }
LINE_TRANSPARENCY = 25
###

def update_field_display_order(field_names, move_fields):
    '''returns a list of field names in the order as specified by move_fields tuple.
    move_fields is a two value tuple with first value as the name of the field to move and the second value as
    the field name after which the field to be moved will be inserted'''
    for move_field_name, move_after_field_name in move_fields:
        existing_field_index = field_names.index(move_field_name)
        new_field_index = field_names.index(move_after_field_name) + 1
        field_names.pop(existing_field_index)
        field_names.insert(new_field_index, move_field_name)
    return field_names

def save_outputs(plan_routes, output_hosted_name, inclue_route_layers=False):
    '''Symbolize the outputs, create popups and save the outputs to hosted feature service, feature collection, or
    route layers'''

    if include_route_layers and plan_routes.routeData:
        #Save the output as one or more route layers
        output_items = create_route_layers(hostedgp, plan_routes.routeData)
        #Calculate RouteLayerItemID and RouteLayerItemURL fields on routes layer in the feature output
        #Get the route layer item id for each route name.
        route_layer_items = output_items.get("items", {})
        if route_layer_items:
            route_layer_item_ids = {v["routeName"]: (k, v["url"]) for k,v in route_layer_items.items()}
            with arcpy.da.UpdateCursor(plan_routes.outputRoutes,
                                       ("RouteName", plan_routes.ROUTE_LAYER_ITEM_ID_FIELD_NAME,
                                        plan_routes.ROUTE_LAYER_ITEM_URL_FIELD_NAME)) as cursor:
                for row in cursor:
                    if row[0] in route_layer_item_ids:
                        row[1] = route_layer_item_ids[row[0]][0] #routeName
                        row[2] = route_layer_item_ids[row[0]][1] #url
                        cursor.updateRow(row)

        arcpy.SetParameterAsText(PARAM_NAMES["routeLayerItems"], json.dumps(output_items))

    ASSIGNED_STOPS_LABELING_INFO = [
        {
            "labelExpression" : "[Sequence]",
            #"labelExpressionInfo" : {
            #    "value" : "{Sequence}"
            #    },
            "useCodedValues" : False,
            "maxScale" : 0,
            "minScale" : 0,
            "where" : None,
            "labelPlacement" : "esriServerPointLabelPlacementCenterCenter",
            "symbol" : {
                "color" : [255, 255, 255, 255],
                "type" : "esriTS",
                "backgroundColor" : None,
                "borderLineColor" : None,
                "horizontalAlignment" : "center",
                "rightToLeft" : False,
                "angle" : 0,
                "xoffset" : 0,
                "yoffset" : 0,
                "text" : "",
                "rotated" : False,
                "kerning" : True,
                "font" : {
                    "size" : 6.75,
                    "style" : "normal",
                    "decoration" : "none",
                    "weight" : "bold",
                    "family" : "Arial"
                    }
                }
            }
        ]

    ##Create results
    with networkanalysis.LogExecutionTime("Created result symbology"):
        res = aolutils.HostedToolResult(output_hosted_name)
        out_routes_layer_name = "Routes"
        out_assigned_stops_layer_name = "Assigned Stops"
        out_unassigned_stops_layer_name = "Unassigned Stops"

        #Add the unassigned stops output only if we have features
        if plan_routes.unassignedStopsCount:
            desc_out_unassigned_stops = arcpy.Describe(plan_routes.outputUnassignedStops)
            drawing_info_unassigned_stops = rendererUtils.getSimpleRendererInfo(desc_out_unassigned_stops.shapeType,
                                                                                TASK_NAME)
            #change point symbol color to be red
            unassigned_stops_symbol = drawing_info_unassigned_stops["renderer"]["symbol"]
            unassigned_stops_symbol["color"] = [255, 0, 0, 255]
            unassigned_stops_symbol["outline"]["color"] = SYMBOL_OUTLINE_COLOR
            drawing_info_unassigned_stops["renderer"]["symbol"] = unassigned_stops_symbol
            popup_unassigned_stops = popup.feature_layer_popup(desc_out_unassigned_stops, "Summary of Unassigned Stops")
            out_description_unassigned_stops = aolutils.getOutDescription(out_unassigned_stops_layer_name, 2,
                                                                            drawing_info_unassigned_stops,
                                                                            popup_unassigned_stops)

            res.addHostedOutput(desc_out_unassigned_stops, out_description_unassigned_stops,
                                PARAM_NAMES["unassignedStopsLayer"])

        if plan_routes.outputRoutes and plan_routes.outputAssignedStops:
            #Create drawing Info for based on the unique value renderer
            desc_out_routes = arcpy.Describe(plan_routes.outputRoutes)
            desc_out_assigned_stops = arcpy.Describe(plan_routes.outputAssignedStops)
       
            renderer_def_routes = dict(UNIQUE_VALUE_RENDERER_DEF)
            renderer_def_routes["baseSymbol"] = LINE_BASE_SYMBOL
            drawing_info_routes = rendererUtils.getUniqueValueRendererInfo(plan_routes.outputRoutes, ["RouteName"],
                                                                           LINE_TRANSPARENCY, renderer_def_routes,
                                                                           False, "StopCount > 0")

            drawing_info_assigned_stops = rendererUtils.getUniqueValueRendererInfo(plan_routes.outputAssignedStops,
                                                                                   ["RouteName"], 0,
                                                                                   rendererDef=dict(UNIQUE_VALUE_RENDERER_DEF),
                                                                                   showOtherValues=False)
            #Create labels based on Sequence field
            drawing_info_assigned_stops["labelingInfo"] = ASSIGNED_STOPS_LABELING_INFO
            
            #create popups
            #For routes hide the StartTime and EndTime fields and only display the StartTimeUTC and EndTimeUTC fields
            #in the popup. For assigned stops hide ArriveTime and DepartTime fields and display only ArriveTimeUTC and
            #DepartTimeUTC fields. This is done as the map viewer assumes all date fields have values in UTC and 
            #displays time value in computer time zone.
            #Always hide RouteLayerItemID field and hide RouteLayerItemURL fields if not including route layers
            hide_route_field_names = ["StartTime", "EndTime", plan_routes.ROUTE_LAYER_ITEM_ID_FIELD_NAME]
            if not include_route_layers:
                hide_route_field_names.append(plan_routes.ROUTE_LAYER_ITEM_URL_FIELD_NAME)
            #For routes Total_Kilometers should be immidiately after Total_Miles field in the display order
            routes_field_names = [fld.name for fld in desc_out_routes.fields]
            routes_field_names = networkanalysis.update_field_display_order(routes_field_names, [("Total_Kilometers",
                                                                                                  "Total_Miles")])
            popup_routes = popup.feature_layer_popup(desc_out_routes, "Summary of {RouteName}", 
                                                     hide_fields=hide_route_field_names,
                                                     field_names_display_order=routes_field_names)
            
            hide_assigned_stops_field_names = ("ArriveTime", "DepartTime")
            #For assigned stops, FromPrevDistanceKilometers should be immidiately after FromPrevDistance in the
            #display order
            assigned_stops_field_names = [fld.name for fld in desc_out_assigned_stops.fields]
            assigned_stops_field_names = networkanalysis.update_field_display_order(assigned_stops_field_names,
                                                                                    [("FromPrevDistanceKilometers",
                                                                                      "FromPrevDistance")])
            popup_assigned_stops = popup.feature_layer_popup(desc_out_assigned_stops, "Summary of Assigned Stops",
                                                             hide_fields=hide_assigned_stops_field_names, 
                                                             field_names_display_order=assigned_stops_field_names)
        
            #Create one to many relationship between routes and assigned stops.
            relationship_name = "RouteStops"
            routes_relationship_def = aolutils.getRelationshipDef(relationship_name, 1, "RouteName", isComposite=False)
            assigned_stops_relationship_def = aolutils.getRelationshipDef(relationship_name, 0 , "RouteName", False,
                                                                          isComposite=False)

            out_description_routes = aolutils.getOutDescription(out_routes_layer_name, 0, drawing_info_routes,
                                                                popup_routes, [routes_relationship_def])
            out_description_assigned_stops = aolutils.getOutDescription(out_assigned_stops_layer_name, 1,
                                                                        drawing_info_assigned_stops, popup_assigned_stops,
                                                                        [assigned_stops_relationship_def])

            #Need to add all point layers first to feature service followed by line layers
            res.addHostedOutput(desc_out_assigned_stops, out_description_assigned_stops, PARAM_NAMES["assignedStopsLayer"])
            res.addHostedOutput(desc_out_routes, out_description_routes, PARAM_NAMES["routesLayer"])
    
    res.generateHostedResult(hostedgp, time.time())

if __name__ == "__main__":
    
    hostedgp = None
    user_culture = "en"
    try:
        hostedgp = agolgp.HostedGP(PARAM_NAMES["context"], PARAM_NAMES["outputName"])
        output_hosted_name = hostedgp.GetOutputName(PARAM_NAMES["outputName"])
        handled_error_codes = list(networkanalysis.PlanRoutes.ERROR_CODES.keys())
        # check credits balance
        aolutils.checkForCredits(TASK_NAME)
        #check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, output_hosted_name)
        #Check if the user has networkanalysis privilege
        if not aolutils.checkPrivilege(networkanalysis.NETWORK_ANALYSIS_PRIVILEGE, hostedgp):
            aolutils.AddErrorCode(100111, networkanalysis.ERROR_CODES.get(100111, ""))
            raise arcpy.ExecuteError
       
        #Read the inputs
        with networkanalysis.LogExecutionTime("Read inputs"):
            hosted_stops_layer, stops_layer_count = aolutils.getHostedLayerX(hostedgp, "stopsLayer", 
                                                                             PARAM_NAMES["stopsLayer"],
                                                                             use_as_soap_input=True)
            route_count = arcpy.GetParameter(PARAM_NAMES["routeCount"])
            max_stops_per_route = arcpy.GetParameter(PARAM_NAMES["maxStopsPerRoute"])
            route_start_time = arcpy.GetParameter(PARAM_NAMES["routeStartTime"])
            hosted_start_layer, start_layer_count = aolutils.getHostedLayerX(hostedgp, "startLayer", 
                                                                             PARAM_NAMES["startLayer"],
                                                                             use_as_soap_input=True)
            start_route_id_field = arcpy.GetParameterAsText(PARAM_NAMES["startLayerRouteIDField"])
            return_to_start = arcpy.GetParameter(PARAM_NAMES["returnToStart"])
            hosted_end_layer, end_layer_count = aolutils.getHostedLayerX(hostedgp, "endLayer",
                                                                         PARAM_NAMES["endLayer"],
                                                                         use_as_soap_input=True)
            end_route_id_field = arcpy.GetParameterAsText(PARAM_NAMES["endLayerRouteIDField"])
            travel_mode = arcpy.GetParameterAsText(PARAM_NAMES["travelMode"])
            stop_service_time = arcpy.GetParameterAsText(PARAM_NAMES["stopServiceTime"])
            max_route_time = arcpy.GetParameterAsText(PARAM_NAMES["maxRouteTime"])
            include_route_layers = arcpy.GetParameter(PARAM_NAMES["includeRouteLayers"])
            point_barrier_layer, point_barrier_count = aolutils.getHostedLayerX(hostedgp, "pointBarrierLayer",
                                                                                PARAM_NAMES["pointBarrierLayer"], False,
                                                                                use_as_soap_input=True)
            line_barrier_layer, line_barrier_count = aolutils.getHostedLayerX(hostedgp, "lineBarrierLayer",
                                                                              PARAM_NAMES["lineBarrierLayer"], False,
                                                                              use_as_soap_input=True)
            polygon_barrier_layer, polygon_barrier_count = aolutils.getHostedLayerX(hostedgp, "polygonBarrierLayer",
                                                                                    PARAM_NAMES["polygonBarrierLayer"],
                                                                                    False, use_as_soap_input=True)
            # Do not pass barrier layer if their count is zero. For example, there might not be any barrier features within
            # the map extent and in this case the barrier layer has all the barrier features which is not what we want to
            # use in the analysis.
            point_barrier_layer = point_barrier_layer if point_barrier_count else None
            line_barrier_layer = line_barrier_layer if line_barrier_count else None
            polygon_barrier_layer = polygon_barrier_layer if polygon_barrier_count else None

        #Fail if including route layers and requesting feature collection output
        if include_route_layers and not output_hosted_name.createService:
            aolutils.AddErrorCode(100223, networkanalysis.PlanRoutes.ERROR_CODES.get(100223, ""))
            raise arcpy.ExecuteError

        #Determine the directions language based on the culture of the User if generating route layers
        if include_route_layers:
            user_culture = networkanalysis.get_user_culture(hostedgp)

        #Execute plan routes
        # routing_utils_toolbox = aolutils.getRemoteToolbox(hostedgp, "routingUtilities")
        routing_utils_toolbox = aolutils.getHelperServicesUrl(hostedgp, "routingUtilities")
        plan_routes = networkanalysis.PlanRoutes(hosted_stops_layer, route_count, max_stops_per_route,
                                                    route_start_time, hosted_start_layer, start_route_id_field,
                                                    return_to_start, hosted_end_layer, end_route_id_field,
                                                    stop_service_time, max_route_time, OUT_WORKSPACE,
                                                    travel_mode=travel_mode, routing_utils_tbx=routing_utils_toolbox,
                                                    include_route_layers=include_route_layers,
                                                    directions_language=user_culture,
                                                    point_barrier_layer=point_barrier_layer,
                                                    line_barrier_layer=line_barrier_layer,
                                                    polygon_barrier_layer=polygon_barrier_layer)
        plan_routes.errorFunc = aolutils.AddErrorCode
        plan_routes.warningFunc = aolutils.AddErrorCode
        tbx = aolutils.getRemoteToolbox(hostedgp, "asyncVRP")
        plan_routes.execute(tbx)
        
        #Save the outputs as hosted feature service or a feature collection or route layers
        save_outputs(plan_routes, output_hosted_name, include_route_layers)
        
        ##Report metering
        route_start_time_value = time.mktime(route_start_time.timetuple()) * 1000 if route_start_time else None
        return_to_start_value = int(return_to_start)
        output_return_type = 2 if output_hosted_name.createService else 1
        #Custom travel mode has a value of 0
        travel_mode_values = {
            "DRIVING" : 1,
            "TRUCKING" : 2,
            "WALKING" : 3,
        }
        values = [
                    1,                          #stops layer is always point
                    stops_layer_count,          #num objects is total input stops processed.
                    route_count,             
                    max_stops_per_route,        
                    route_start_time_value,
                    1,                          #start layer is always point
                    start_layer_count,
                    return_to_start_value,
                    1,                          #end layer is always point
                    end_layer_count,
                    travel_mode_values.get(travel_mode.upper(), 0),
                    stop_service_time,
                    max_route_time,
                    output_return_type,          # output is feature collection or feature service
                    int(include_route_layers),  #log if route layers are created.
                ]
        #cost is 0 as the billing happens at logistics.arcgis.com
        aolutils.LogUsageMetering(TASK_NAME, stops_layer_count, 0, time.time(), values)

        ##Report cost
        # No longer required to report routeCount as 0 to prevent double billing with the new cost reporting 
        # implementation
        with networkanalysis.LogExecutionTime("Completed cost reporting"):
            params_dict = {
                    "stopsLayer":{
                        "count": stops_layer_count,
                        "shapeType": hosted_stops_layer.shapeType
                        },
                    "routeCount" : route_count,
                    "maxStopsPerRoute" : max_stops_per_route,
                    "routeStartTime" : route_start_time_value,
                    "startLayer": {
                        "count" : start_layer_count,
                        "shapeType": hosted_start_layer.shapeType
                        },
                    "startLayerRouteIDField": start_route_id_field,
                    "returnToStart" : return_to_start_value,
                    "endLayer": {
                        "count" : end_layer_count,
                        "shapeType": hosted_end_layer.shapeType
                        },
                    "endLayerRouteIDField": end_route_id_field,
                    "travelMode" :  travel_mode if travel_mode.upper() in travel_mode_values else "CUSTOM",
                    "stopServiceTime": stop_service_time,
                    "maxRouteTime": max_route_time,
                    "includeRouteLayers": include_route_layers,
                }
            
            aolutils.reportParamsForCost(hostedgp, TASK_NAME, params_dict)
        
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
    
    
    
    
    
    
    