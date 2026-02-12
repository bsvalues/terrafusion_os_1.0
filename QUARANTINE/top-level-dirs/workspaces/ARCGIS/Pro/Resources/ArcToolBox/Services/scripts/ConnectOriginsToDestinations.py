"""---------------------------------------------------------------------------
Name:              ConnectOriginsToDestinations.py
Purpose:           Finds distance between origin destination pairs using
                   different measurement methods.
Author:            Esri Inc.
Created:           11/05/2014
Copyright:   (c)   Esri, Inc. 2014
ArcGIS Version:    December 2014 update
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
if DEBUG:
    OUT_WORKSPACE = arcpy.env.scratchGDB
    arcpy.env.overwriteOutput = True
###

###Constants about tool info
TASK_NAME = "ConnectOriginsToDestinations"
PARAM_NAMES = {
    "originsLayer" : 0,
    "destinationsLayer" : 1,
    "measurementType": 2,
    "originsLayerRouteIDField" : 3,
    "destinationsLayerRouteIDField" : 4,
    "timeOfDay" : 5,
    "timeZoneForTimeOfDay" : 6,
    "outputName" : 7,
    "context" : 8,
    "includeRouteLayers" : 9,
    "pointBarrierLayer": 10,
    "lineBarrierLayer": 11,
    "polygonBarrierLayer": 12,
    "routeShape": 13,
    "routesLayer" : 14,
    "unassignedOriginsLayer" : 15,
    "unassignedDestinationsLayer" : 16,
    "routeLayerItems" : 17,
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
UNIQUE_VALUE_RENDERER_DEF = {
    "type": "uniqueValueDef",
    "uniqueValueFields": ["RouteName"],
    "fieldDelimiter": ",",
    "baseSymbol": LINE_BASE_SYMBOL,
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

def save_outputs(connect_od, output_hosted_name, include_route_layers=False):
    '''Symbolize the outputs, create popups and save the outputs to hosted feature service, feature collection, or
    route layers'''

    if include_route_layers and connect_od.routeData:
        #Save the output as one or more route layers
        output_items = create_route_layers(hostedgp, connect_od.routeData)

        #Calculate RouteLayerItemID and RouteLayerItemURL fields on routes layer in the feature output
        #Get the route layer item id for each route name.
        route_layer_items = output_items.get("items", {})
        if route_layer_items:
            route_layer_item_ids = {v["routeName"]: (k, v["url"]) for k,v in route_layer_items.items()}
            with arcpy.da.UpdateCursor(connect_od.outputRoutes, ("RouteName", connect_od.ROUTE_LAYER_ITEM_ID_FIELD_NAME,
                                                                 connect_od.ROUTE_LAYER_ITEM_URL_FIELD_NAME)) as cursor:
                for row in cursor:
                    if row[0] in route_layer_item_ids:
                        row[1] = route_layer_item_ids[row[0]][0] #routeName
                        row[2] = route_layer_item_ids[row[0]][1] #url
                        cursor.updateRow(row)

        arcpy.SetParameterAsText(PARAM_NAMES["routeLayerItems"], json.dumps(output_items))

    def save_unassigned_point_output(layer, layer_name, layer_output_index, output_parameter_index,
                                     relationship_name=""):
        '''Adds unassigned origins or unassingned destinations to output'''
        
        desc_out_unassigned_points = arcpy.Describe(layer)
        drawing_info_unassigned_points = rendererUtils.getSimpleRendererInfo(desc_out_unassigned_points.shapeType,
                                                                             TASK_NAME)
        #change point symbol color to be red
        unassigned_points_symbol = drawing_info_unassigned_points["renderer"]["symbol"]
        unassigned_points_symbol["color"] = [255, 0, 0, 255]
        unassigned_points_symbol["outline"]["color"] = SYMBOL_OUTLINE_COLOR
        drawing_info_unassigned_points["renderer"]["symbol"] = unassigned_points_symbol
        
        #Create popup
        #Status should be the first field.
        layer_field_names = [fld.name for fld in desc_out_unassigned_points.fields]
        layer_field_names = networkanalysis.update_field_display_order(layer_field_names,
                                                                       [("Status", desc_out_unassigned_points.oidFieldName)])
        popup_unassigned_points = popup.feature_layer_popup(desc_out_unassigned_points,
                                                            "Summary of {0}".format(layer_name), 
                                                            field_names_display_order=layer_field_names)
        relationship_def = None
        if relationship_name:
            #Create one to one relationship between unassigned origins and unassigned destinations.
            if layer_output_index == 1:
                is_origin = True
                relationship_role = "esriRelRoleOrigin"
                relationship_id_field = connect_od.originsLayerRouteID
            else:
                is_origin = False
                relationship_role = "esriRelRoleDestination"
                relationship_id_field = connect_od.destinationsLayerRouteID
            
            #create a unique attribute index on the relationship id field
            arcpy.management.AddIndex(layer, [relationship_id_field], relationship_id_field, "UNIQUE") 
            relationship_def = [{
                "name": relationship_name,
                "relatedTableId": layer_output_index,
                "cardinality":"esriRelCardinalityOneToOne",
                "role": relationship_role,
                "keyField": relationship_id_field,
                "composite": False
            }]
            #arcpy.AddMessage(str(relationship_def))
            #relationship_def = [aolutils.getRelationshipDef(relationship_name, layer_output_index,
            #                                               relationship_id_field, isOrigin=is_origin, 
            #                                               isOneToMany=True, isComposite=False)]
        
        out_description_unassigned_points = aolutils.getOutDescription(layer_name, layer_output_index, 
                                                                       drawing_info_unassigned_points,
                                                                       popup_unassigned_points, relationship_def)
        res.addHostedOutput(desc_out_unassigned_points, out_description_unassigned_points, output_parameter_index)

    ##Create results
    #Need to add all point layers first to feature service followed by line layers
    with networkanalysis.LogExecutionTime("Created result symbology"):
        res = aolutils.HostedToolResult(output_hosted_name)
        out_routes_layer_name = "Routes"
        out_unassigned_origins_layer_name = "Unassigned Origins"
        out_unassigned_destinations_layer_name = "Unassigned Destinations"

        #Add the unassigned origins and unassigned destinations outputs only if we have features
        if connect_od.unassignedOriginsCount and connect_od.unassignedDestinationsCount:
            #Create a one to one relationship between unassigned origins and destinations
            save_unassigned_point_output(connect_od.outputUnassignedOrigins, out_unassigned_origins_layer_name, 1,
                                         PARAM_NAMES["unassignedOriginsLayer"],)#"OriginsDestinations")
            save_unassigned_point_output(connect_od.outputUnassignedDestinations,
                                         out_unassigned_destinations_layer_name, 2,
                                         PARAM_NAMES["unassignedDestinationsLayer"],)# "OriginsDestinations")
        
        elif connect_od.unassignedOriginsCount:
            save_unassigned_point_output(connect_od.outputUnassignedOrigins, out_unassigned_origins_layer_name, 1,
                                         PARAM_NAMES["unassignedOriginsLayer"])
        elif connect_od.unassignedDestinationsCount:
            save_unassigned_point_output(connect_od.outputUnassignedDestinations,
                                         out_unassigned_destinations_layer_name, 2,
                                         PARAM_NAMES["unassignedDestinationsLayer"])
        else:
            pass

        if connect_od.outputRoutesCount:
            #Create drawing Info based on the unique value renderer
            desc_out_routes = arcpy.Describe(connect_od.outputRoutes)
            renderer_def_routes = dict(UNIQUE_VALUE_RENDERER_DEF)
            # For straight line route shape, use a unique color per group of OD pairs. For example, all destinations
            # assigned to a single store have one color.
            unique_value_field = "RouteName"
            if connect_od.routeShape == "STRAIGHTLINE":
                if connect_od.problemType in ("OneToMany", "MultipleOneToMany"):
                    unique_value_field = "OriginOID"
                else:
                    unique_value_field = "DestinationOID"
            drawing_info_routes = rendererUtils.getUniqueValueRendererInfo(connect_od.outputRoutes, [unique_value_field],
                                                                           LINE_TRANSPARENCY, renderer_def_routes,
                                                                           False)
            #create popups
            #For routes Total_Kilometers should be immidiately after Total_Miles field in the display order
            hide_fields = []
            routes_field_names = [fld.name for fld in desc_out_routes.fields]
            routes_field_names = networkanalysis.update_field_display_order(routes_field_names, 
                                                                            [("Total_Kilometers", "Total_Miles")])
            
            #Hide the RouteLayerItemID and RouteLayerItemURL fields if present and if they have null values
            #If they have values, only hide RouteLayerItemID field
            if include_route_layers:
                hide_fields.append(connect_od.ROUTE_LAYER_ITEM_ID_FIELD_NAME)
            else:
                if connect_od.ROUTE_LAYER_ITEM_ID_FIELD_NAME in routes_field_names:
                    hide_fields.append(connect_od.ROUTE_LAYER_ITEM_ID_FIELD_NAME)
                if connect_od.ROUTE_LAYER_ITEM_URL_FIELD_NAME in routes_field_names:
                    hide_fields.append(connect_od.ROUTE_LAYER_ITEM_URL_FIELD_NAME)

            #Hide the StartTime and EndTime fields if using time of day since these fields store date time in 
            # geolocal time zone and map viewer than offsets the time again as it assumes all datetime fields are in UTC
            if connect_od.timeOfDay:
                # time_of_day_date = connect_od.timeOfDay.date()
                # if (time_of_day_date.year == 1990) and (time_of_day_date.month == 1) and (time_of_day_date.day in range(1,8)):
                hide_fields += ["StartTime", "EndTime"]
            else:
                hide_fields += ["StartTime", "EndTime", "StartTimeUTC", "EndTimeUTC"]
            popup_routes = popup.feature_layer_popup(desc_out_routes, "Summary of {RouteName}", 
                                                     field_names_display_order=routes_field_names,
                                                     hide_fields=hide_fields)

            out_description_routes = aolutils.getOutDescription(out_routes_layer_name, 0, drawing_info_routes,
                                                                popup_routes)
            
            
            res.addHostedOutput(desc_out_routes, out_description_routes, PARAM_NAMES["routesLayer"])
    
    res.generateHostedResult(hostedgp, time.time())

if __name__ == "__main__":
    
    hostedgp = None
    user_culture = "en"
    try:
        hostedgp = agolgp.HostedGP(PARAM_NAMES["context"], PARAM_NAMES["outputName"])
        output_hosted_name = hostedgp.GetOutputName(PARAM_NAMES["outputName"])
        # check credits balance
        aolutils.checkForCredits(TASK_NAME)
        #check publishing privilege
        handled_error_codes = list(networkanalysis.ConnectOriginsToDestinations.ERROR_CODES.keys())
        aolutils.checkPublishingPrivilege(hostedgp, output_hosted_name)
        #Read the inputs
        with networkanalysis.LogExecutionTime("Read inputs"):
            hosted_origins_layer, origins_layer_count = aolutils.getHostedLayerX(hostedgp, "originsLayer", 
                                                                                 PARAM_NAMES["originsLayer"],
                                                                                 use_as_soap_input=True)
            hosted_destinations_layer, destinations_layer_count = aolutils.getHostedLayerX(hostedgp,
                                                                                           "destinationsLayer", 
                                                                                           PARAM_NAMES["destinationsLayer"],
                                                                                           use_as_soap_input=True)
            measurement_type = arcpy.GetParameterAsText(PARAM_NAMES["measurementType"])
            measurement_type_upper = measurement_type.upper()
            origins_route_id_field = arcpy.GetParameterAsText(PARAM_NAMES["originsLayerRouteIDField"])
            destinations_route_id_field = arcpy.GetParameterAsText(PARAM_NAMES["destinationsLayerRouteIDField"])
            time_of_day = arcpy.GetParameter(PARAM_NAMES["timeOfDay"])
            time_zone = arcpy.GetParameterAsText(PARAM_NAMES["timeZoneForTimeOfDay"])
            include_route_layers = arcpy.GetParameter(PARAM_NAMES["includeRouteLayers"])
            route_shape = arcpy.GetParameterAsText(PARAM_NAMES["routeShape"])
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

        #Check if the user has networkanalysis privilege if not using straight line distance
        if measurement_type_upper != "STRAIGHTLINE":
            if not aolutils.checkPrivilege(networkanalysis.NETWORK_ANALYSIS_PRIVILEGE, hostedgp):
                aolutils.AddErrorCode(100111, networkanalysis.ERROR_CODES.get(100111, ""))
                raise arcpy.ExecuteError

            #Fail if including route layers and requesting feature collection output
            if include_route_layers and not output_hosted_name.createService:
                aolutils.AddErrorCode(100223, networkanalysis.ConnectOriginsToDestinations.ERROR_CODES.get(100223, ""))
                raise arcpy.ExecuteError

            #Determine the directions language based on the culture of the User if generating route layers
            
            if include_route_layers:
                user_culture = networkanalysis.get_user_culture(hostedgp)

        #Execute connect origins to destinations
        # routing_utils_toolbox = aolutils.getRemoteToolbox(hostedgp, "routingUtilities")
        routing_utils_toolbox = aolutils.getHelperServicesUrl(hostedgp, "routingUtilities")
        connect_od = networkanalysis.ConnectOriginsToDestinations(hosted_origins_layer, hosted_destinations_layer,
                                                                  measurement_type, origins_route_id_field,
                                                                  destinations_route_id_field, time_of_day, time_zone,
                                                                  OUT_WORKSPACE,
                                                                  routing_utils_tbx=routing_utils_toolbox,
                                                                  include_route_layers=include_route_layers,
                                                                  directions_language=user_culture,
                                                                  point_barrier_layer=point_barrier_layer,
                                                                  line_barrier_layer=line_barrier_layer,
                                                                  polygon_barrier_layer=polygon_barrier_layer,
                                                                  route_shape=route_shape)
        connect_od.errorFunc = aolutils.AddErrorCode
        connect_od.warningFunc = aolutils.AddErrorCode
        connect_od.DEBUG = DEBUG
        tbx = aolutils.getRemoteToolbox(hostedgp, "asyncRoute")
        connect_od.execute(tbx)
        
        #Save the outputs as hosted feature service or a feature collection
        save_outputs(connect_od, output_hosted_name, include_route_layers)
        
        ##Report metering
        time_of_day_values = time.mktime(time_of_day.timetuple()) * 1000 if time_of_day else None
        output_return_type = 2 if output_hosted_name.createService else 1

        #Custom travel mode has a value of 0
        measurement_type_values = {
            "STRAIGHTLINE" : 1,
            "DRIVINGDISTANCE" : 2,
            "DRIVINGTIME" : 3,
            "TRUCKINGDISTANCE" : 4,
            "TRUCKINGTIME" : 5,
            "WALKINGDISTANCE" : 6,
            "WALKINGTIME" : 7
        }
        values = [
                    1,                            #origins layer is always point
                    origins_layer_count,          
                    1,                            #destinations layer is always point
                    destinations_layer_count,
                    measurement_type_values.get(measurement_type_upper, 0),        
                    time_of_day_values,
                    output_return_type,            #output is feature collection, or feature service
                    int(include_route_layers),  #log if route layers are created.
                ]
        #num objects is total origins and destinations processed.
        num_objects = origins_layer_count + destinations_layer_count
        #If not using straight line distance, cost is 0 as the billing happens at logistics.arcgis.com
        cost = 1 if measurement_type_upper == "STRAIGHTLINE" else 0
        aolutils.LogUsageMetering(TASK_NAME, num_objects, cost, time.time(), values)

        ##Report cost
        with networkanalysis.LogExecutionTime("Completed cost reporting"):
            params_dict = {
                "originsLayer":{
                    "count": origins_layer_count * cost, #prevent double billing when using travel modes
                    "shapeType": hosted_origins_layer.shapeType
                },
                "destinationsLayer": {
                    "count" : destinations_layer_count * cost, #prevent double billing when using travel modes
                    "shapeType": hosted_destinations_layer.shapeType
                },
                "measurementType": measurement_type if measurement_type_upper in measurement_type_values else "CUSTOM",
                "originsLayerRouteIDField": origins_route_id_field,
                "destinationsLayerRouteIDField": destinations_route_id_field,    
                "timeOfDay" : time_of_day_values,
                "timeZoneForTimeOfDay" : time_zone,
                "includeRouteLayers": include_route_layers,
                "routeShape": route_shape,
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