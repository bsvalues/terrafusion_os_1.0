"""---------------------------------------------------------------------------
Name:              networkanalysis.py
Purpose:           Performs different types of network analyses using ArcGIS Online
                   network analysis services available on logistics.arcgis.com
Author:            Esri Inc.
Created:           4/23/2014
Copyright:   (c)   Esri, Inc. 2014
ArcGIS Version:    10.3 or later
---------------------------------------------------------------------------"""

#Standard library modules
import os
import locale
import collections
import time
import json
from operator import itemgetter
import sys
import traceback
import zipfile
import copy
import urllib.request, urllib.parse, urllib.error
from collections import Counter

#Third party modules
import requests
import arcpy
import popup

#Constants
POINT_SHAPE_TYPES = ("point", "esrigeometrypoint")
LINE_SHAPE_TYPES = ("polyline", "esrigeometrypolyline")
POLYGON_SHAPE_TYPES = ("polygon", "esrigeometrypolygon")
NETWORK_ANALYSIS_PRIVILEGE = "premium:user:networkanalysis"
# INFINITY = sys.maxsize
INFINITY = 2147483647  # python 2 sys.maxint value since it is used as default value for certain GPDouble parameters
ERROR_CODES = {
    100111: "Your user role does not include the network analysis privilege.",
    100291: "Failed to publish analysis results as a feature collection because one of the output layers has more than 9,999 features. To keep all features, save your result as a feature layer."
    }

def call_async_gp_service(tbx, task_name, task_params, ignore_error_codes, update_task_params=None):
    '''calls a async GP service and returns the gp result object.
    tbx - full url including the service name and credentials for the remote service.
    task_params - list of parameter values in the order expected by the task.
    ignore_error_codes - list of error codes to ignore from the result when writing the messages
    from the task output.
    update_task_params -- list of parameter indices from the remote tool. For each index, get the
    default value as specified in the remote service and update the task_params. This is useful for 
    passing default restrictions as if the restriction parameter is not passed explicity, the remote
    tool uses default restrictions defined to the network dataset level of the remote service.'''

    tbx_added = False
    service_result = None
    job_id = ""
    try:
        #Add the service
        #arcpy.gp.addToolbox = log_execution_time(arcpy.gp.addToolbox)
        with LogExecutionTime("Added remote toolbox"):
            arcpy.gp.addToolbox(tbx)
        
        tbx_added = True

        #Call the service
        with LogExecutionTime("Completed call to remote service"):
            tbx_name_parts = tbx.split(";")
            service_name = tbx_name_parts[1].split("/")[-1]
            qualified_task_name = "{0}_{1}".format(task_name, service_name)
            gp_task = getattr(arcpy.gp, qualified_task_name)

            #Update task_params if required
            if update_task_params:
                for index in update_task_params:
                    param_value = arcpy.GetParameterValue(qualified_task_name, index)
                    try:
                        task_params[index] = param_value
                    except IndexError as ex:
                        arcpy.AddMessage("Failed to update default value for parameter at index {0}".format(index))
            service_result = gp_task(*task_params)
            job_id = service_result.resultID
            arcpy.AddMessage("Waiting for jobID: {0} to complete on {1}".format(job_id, tbx_name_parts[0]))

            #Wait for job to complete
            while service_result.status < 4:
                time.sleep(1)
        
        #Add messages and return the result
        severity = service_result.maxSeverity
        if severity != 0:
            #Log error and warning messages from execution of remote tools. Messages that have
            #codes matching with ignore_error_codes are not logged.
            #Note that for local tools this can be achieved by calling arcpy.gp.GetAllMessages().
            #However when executing remote tools, arcpy.gp.GetAllMessages()
            #does not return the actual messages from the result object. Also result.getAllMessages()
            #does not populate the error codes for the error messages.
            # error_msgs = service_result.getMessages(2)
            # warning_msgs = service_result.getMessages(1)
            # messages = []
            # if error_msgs:
            #     messages += error_msgs.split("\n")
            # if warning_msgs:
            #     messages += warning_msgs.split("\n")
            messages = service_result.getMessages(severity).split("\n")
            msg_function = arcpy.AddWarning if severity == 1 else arcpy.AddError
            #These error codes will be sent as args when raising arcpy.ExecuteError so that the calling code can handle
            #the error codes
            error_codes_to_raise = {}
            #Do not report any blank messages or messages that start with Failed
            for msg in messages:
                if msg:
                    if not msg.startswith("Failed"):
                        #Do not include error and warning codes
                        if msg.find(": ") != -1:
                            code, message = msg.split(": ", 1)
                            try:
                                code = int(code.split(" ")[-1])
                                if ignore_error_codes and code in ignore_error_codes:
                                    continue
                                else:
                                    error_codes_to_raise[code] = messages
                            except ValueError as ex:
                                message = msg
                        else:
                            message = msg
                        msg_function(message)
            if severity == 2:
                if error_codes_to_raise:
                    raise arcpy.ExecuteError(error_codes_to_raise)
                else:
                    raise arcpy.ExecuteError

    except SystemExit as ex:
        #raised if cancel was trigged on the caller
        #try canceling the remote job if it is still executing
        if service_result:
            arcpy.AddWarning("Canceling .....")
            service_result.cancel()
            raise
    except Exception as ex:
        raise
    finally:
        if tbx_added:
            #Remove the GP service as we no longer need to make any calls to it
            try:
                arcpy.gp.removeToolbox(tbx)
            except Exception:
                log_error_call_stack()

    return service_result

def call_sync_gp_service(tbx, task_name, task_params):
    '''Call a synchornous GP service and returns gp result
    tbx - full url including the service name and credentials for the remote service that can be obtained
    from aolutils.getRemoteToolbox.
    task_name - name of the tool in the service that will be executed
    task_params - list of parameter values in the order expected by the task.'''

    tbx_added = False
    service_result = None
    job_id = ""
    try:
        #Add the service
        with LogExecutionTime("Added remote toolbox"):
            arcpy.gp.addToolbox(tbx)
        
        tbx_added = True

        #Call the service
        with LogExecutionTime("Completed call to remote service"):
            tbx_name_parts = tbx.split(";")
            service_name = tbx_name_parts[1].split("/")[-1]
            qualified_task_name = "{0}_{1}".format(task_name, service_name)
            if hasattr(arcpy.gp, qualified_task_name):
                gp_task = getattr(arcpy.gp, qualified_task_name)
                service_result = gp_task(*task_params)
            else:
                service_result = None
    except Exception as ex:
        raise
    finally:
        if tbx_added:
            #Remove the GP service as we no longer need to make any calls to it
            try:
                arcpy.gp.removeToolbox(tbx)
            except Exception as ex:
                log_error_call_stack()
    return service_result

def get_unique_field_name(base_name, field_names):
    '''Returns a unique field name based on the base_name that does not exists in field_names.
    field_names is a list of field names. if base_name already exists a unique name is generated
    by appending a number after base_name such base_name_1 and so on until it is unique.'''
    
    if not base_name in field_names:
        return base_name
    for i in range(0, len(field_names)):
        fld_name = "{0}_{1}".format(base_name, i+1)
        if fld_name in field_names:
            continue
        else:
            break
    return fld_name

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

def check_well_known_fields(layer):
    '''Perform a case insensitive search to check if the layer contains any well known fields. The well known fields
    are searched from left to right and first match is returned. The return value is the field object.'''

    well_known_fields = ("NAME", "TITLE", "ADDRESS")
    matched_field = None

    # Store the fields from the layer
    if hasattr(layer, "describe"):
        layer_describe = layer.describe
    elif hasattr(layer, "fields"):
        #Can be a layer describe object 
        layer_describe = layer
    else:
        layer_describe = arcpy.Describe(layer)
    layer_fields = {fld.name.upper(): fld for fld in layer_describe.fields}
    
    for fld in well_known_fields:
        if fld in layer_fields:
            matched_field = layer_fields[fld]
            break
    return matched_field

def get_field_from_layer(field_name, layer, return_field_object=False):
    '''Performs a case insensitive lookup of field name in the layer fields and return the field name in the same case
    as it exists on the layer. If the field name does not exists, returns an empty string. Layer '''

    #If the layer object has an attribute called "describe" that reference the describe object as is the case for a
    #networkanalysis.LayerInfo object, use that to get the field list. Otherwise describe the layer

    matched_field_name = ""
    matched_field = None

    if hasattr(layer, "describe"):
        layer_describe = layer.describe
    elif hasattr(layer, "fields"):
        #Can be a layer describe object 
        layer_describe = layer
    else:
        layer_describe = arcpy.Describe(layer)

    layer_field_names = {fld.name: fld for fld in layer_describe.fields}
    field_name_lower = field_name.lower()
    for fld_name in layer_field_names:
        if fld_name.lower() == field_name_lower:
            matched_field_name = fld_name
            matched_field = layer_field_names[fld_name]
            break
    if return_field_object:
        return matched_field
    else:
        return matched_field_name

def log_error_call_stack():
    '''Adds the callstack from the exception as GP messages'''
    msgs = traceback.format_exception(*sys.exc_info())[1:]
    for msg in msgs:
        arcpy.AddMessage(msg.strip())

def get_tool_limits(utilities_toolbox, helper_service, tool_name):
    '''return tool limits for the tool_name in the helper_service.'''

    tool_limits = {}
    #Call the GetToolInfo tool within routing Utilities service
    if isinstance(utilities_toolbox, tuple):
        url, token, referrer = utilities_toolbox
        # Call using REST
        tool_params = {
            "serviceName": helper_service,
            "toolName": tool_name,
            "f": "json",
            "token": token,
        }
        tool_result = requests.post(f"{url}/GetToolInfo/execute", tool_params, headers={"referer": referrer}, verify=False).json()
        tool_limits = tool_result.get("results", [{}])[0].get("value", {}).get("serviceLimits", {})
    else:
        tool_params = (helper_service, tool_name)
        tool_result = call_sync_gp_service(utilities_toolbox, "GetToolInfo", tool_params)
        if tool_result:
            tool_limits = json.loads(tool_result.getOutput(0)).get("serviceLimits", {})
    return tool_limits
    
def convert_units(value, from_unit, to_unit, rounding_precision=3):
    '''Convert values from one time or distance unit to another.'''

    TIME_UNITS = ('minutes','hours','days', 'seconds')
    BASE_DISTANCE_UNIT = 'meters'
    BASE_TIME_UNIT = 'minutes'
    
    from_unit = from_unit.lower()
    to_unit = to_unit.lower()
    if from_unit == "nautical miles":
        from_unit = "nauticalmiles"
    if to_unit == "nautical miles":
        to_unit == "nauticalmiles"
    #if the from and to units are same, just return the original value
    if from_unit == to_unit:
        return value
 
    #Determine if we are doing a conversion between time units or distance units    
    base_unit = BASE_TIME_UNIT if from_unit in TIME_UNITS else BASE_DISTANCE_UNIT
    #Store the constants that convert from one unit to another in a dictionary. Key is the tuple (from unit, to unit)
    #Value is the conversion constant.    
    conversion_from_meters = {('meters', 'kilometers') : 0.001,
                              ('meters', 'feet') : 3.2808399,
                              ('meters', 'miles') : 0.000621371192,
                              ('meters', 'yards') : 1.0936133,
                              ('meters', 'nauticalmiles') : 0.000539956803,
                              }
    conversion_to_meters = {('kilometers', 'meters') : 1000.0,
                            ('feet', 'meters') : 0.3048,
                            ('miles', 'meters') : 1609.344,
                            ('yards', 'meters') : 0.9144,
                            ('nauticalmiles', 'meters') : 1852.0,
                            ('meters', 'meters') : 1.0
                            }
    conversion_from_minutes = {('minutes', 'hours') : 0.0166666667,
                               ('minutes', 'days') : 0.000694444444,
                               ('minutes', 'seconds') : 60.0,
                               }
    conversion_to_minutes = {('hours', 'minutes') : 60.0,
                             ('days', 'minutes') : 1440.0,
                             ('seconds', 'minutes') : 0.0166666667,
                             ('minutes', 'minutes') : 1.0,
                             }
    #We first convert value in the 'from unit' to a value in the base unit and then from base unit to the to unit.        
    dict_key1 = (from_unit, base_unit)
    dict_key2 = (base_unit, to_unit)
    #Get the first and second conversion constants from the appropriate dicts. If key is not found use conversion
    #constant equal to 1.    
    if base_unit == BASE_DISTANCE_UNIT:        
        first_constant_to_use = conversion_to_meters.get(dict_key1,1.0)
        second_constant_to_use = conversion_from_meters.get(dict_key2,1.0)
    else:
        first_constant_to_use = conversion_to_minutes.get(dict_key1,1.0)
        second_constant_to_use = conversion_from_minutes.get(dict_key2,1.0)
    return round(value * first_constant_to_use * second_constant_to_use, rounding_precision)

def str_to_float(input_str):
    '''converts a string to a float'''

    #set the locale for all categories to the user’s default setting. This is required on some OS like German
    #and Russian to read the appropriate decimal separator 

    locale.setlocale(locale.LC_ALL, '')
    try:
        return locale.atof(input_str)
    except UnicodeDecodeError:
        return locale.atof(input_str.encode("utf-8", "ignore"))
    except:
        if isinstance(input_str, str):
            if "," in input_str:
                input_str = input_str.replace(",", ".")
                return float(input_str)
        else:
            raise

def get_user_culture(hostedgp):
    """Returns the culture for the logged in user
    
    Args:
        hostedgp - is the instance of hostedgp module initialized when running a tool.

    Return:
        A string representing the user culture.
    """

    portal_self = hostedgp._selfJson
    if not portal_self:
        portal_self = json.loads(hostedgp.GetSelf())
    if "user" in portal_self:
        user_culture = portal_self["user"].get("culture", "en")
    else:
        # Use the culture for the entire org
        user_culture = portal_self.get("culture", "en")
    return user_culture

def get_travel_mode_from_json(travel_mode_json):
    """Return a arcpy.na.TravelMode object from a stringified JSON representation of a travel mode.
    
    This function raises a ValueError or TypeError if the travel_mode_json is not valid
    
    """
    if hasattr(arcpy.na.TravelMode, "_JSON"):
        travel_mode = arcpy.na.TravelMode()
        travel_mode._JSON = travel_mode_json
    else:
        travel_mode = arcpy.na.TravelMode(travel_mode_json)
    return travel_mode

class LogExecutionTime(object):
    '''Context manager to log the time elapsed to execute the code block.'''

    def __init__(self, name):
        self.startTime = time.time()
        self.name = name

    def __enter__(self):
        pass

    def __exit__(self, exc_type, exc_value, traceback):
        end_time = time.time()
        arcpy.AddMessage("TIMER: {0}: {1:.3f} seconds".format(self.name, end_time - self.startTime))

class NetworkAnalysisTool(object):
    '''Base class for all network analysis tools'''

    NETWORK_LOCATION_STATUS = {
        0 : "Ok",
        1: "Not located",
        5: "Not reached"
        }
    ERROR_CODES = {
        100069 : "The number of features in {startLayer} cannot be greater than {max}.",
        100072 : "The {startLayer} layer must have a point geometry type.",
        100087 : "Field {fieldName} does not exist in {inputLayer}.",
        100137 : "A value for the {parameterName} is required.",
        100145: "The following travel mode is invalid: {travelMode}",
        100153: "The value for the {paramName} parameter must be greater than zero.",
        100219: "Invalid input for parameter {paramName}.",
        100258: "The distance between any inputs must be less than {mileValue} miles ({kmValue} kilometers) when walking.",
        100264: "The {inputLayer} layer used to specify {shapeType} barrier layer must have a {shapeType} geometry.",
        100265: "The number of street features intersected by point barrier layer exceeds the limit of {limit}.",
        100266: "The number of street features intersected by line barrier layer exceeds the limit of {limit}.",
        100267: "The number of street features intersected by polygon barrier layer exceeds the limit of {limit}.",
    }

    def _addError(self, msg_code, msg, msg_params=None, is_warning=False):
        '''Adds the error message and raises arcpy.ExecuteError exception. self.errorFunc function is used to add the
        error message. if error function is arcpy.AddError only add the msg.'''

        error_func_name = self.errorFunc.__name__
        error_func = self.errorFunc
        if is_warning:
            error_func_name = self.warningFunc.__name__
            error_func = self.warningFunc

        if hasattr(arcpy, error_func_name):
            error_func(msg.replace("$", ""))
        else:
            error_func(msg_code, msg, msg_params, is_warning)
        if not is_warning:
            raise arcpy.ExecuteError

    def _checkFieldExists(self, input_field_name, input_layer):
        '''Check if field name exists on the input layer by performing a case insensitive lookup.
        If the field exists, set the field name to be with appropriate case as found on the layer '''
        
        field_name = get_field_from_layer(input_field_name, input_layer)
        if field_name:
            input_field_name = field_name
        else:
            msg_params = dict(inputLayer=input_layer.name, fieldName=input_field_name)
            msg_code = 100087
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)

    def _raiseBarrierLimitError(self, remote_tool_msgs):
        """Raise the error message to indicate the barrier feature limit has been exceeded.

        Args:
            remote_tool_msgs: A list of messages returned from running the remote tool.
        Raises:
            Raises arcpy.ExecuteError

        """
        # The limits for barriers are harcoded as there is no easy way to deduce the limits. The remote service
        # includes the limit as part of error message string which is subject to localization on origin server
        msg_code = 0
        for msg_txt in remote_tool_msgs:
            if "PolygonBarriers" in msg_txt:
                msg_code = 100267
                limit = 2000
                break
            elif "PolylineBarriers" in msg_txt:
                msg_code = 100266
                limit = 500
                break
            elif "Barriers" in msg_txt:
                msg_code = 100265
                limit = 250
                break
        if msg_code:
            msg = NetworkAnalysisTool.ERROR_CODES[msg_code]
            self._addError(msg_code, msg, {"limit": limit})

    def _checkBarrierShapeType(self):
        """Return a terminating error if the shape type of input features do not match up with the barrier layer."""
        # Check validity of pointBarrierLayer
        if self.pointBarrierLayer.count:
            if not self.pointBarrierLayer.describe.shapeType.lower() in POINT_SHAPE_TYPES:
                msg_params = dict(inputLayer=self.pointBarrierLayer.name, shapeType="point")
                msg_code = 100264
                msg = NetworkAnalysisTool.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)

        # Check validity of lineBarrierLayer
        if self.lineBarrierLayer.count:
            if not self.lineBarrierLayer.describe.shapeType.lower() in LINE_SHAPE_TYPES:
                msg_params = dict(inputLayer=self.lineBarrierLayer.name, shapeType="line")
                msg_code = 100264
                msg = NetworkAnalysisTool.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)

        # Check validity of polygonBarrierLayer
        if self.polygonBarrierLayer.count:
            if not self.polygonBarrierLayer.describe.shapeType.lower() in POLYGON_SHAPE_TYPES:
                msg_params = dict(inputLayer=self.polygonBarrierLayer.name, shapeType="polygon")
                msg_code = 100264
                msg = NetworkAnalysisTool.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)

class PlanRoutes(NetworkAnalysisTool):
    '''Assigns stops to best routes and finds the best sequence to visit the stops that will minimize
    the travel time.'''

    ERROR_CODES = {
        100064 : "The number of features in {stopsLayer} is zero.",
        100065 : "The number of features in {startLayer} is zero.",
        100066 : "The maximum number of vehicles to route cannot be less than zero and greater than {max}.",
        100067 : "The maximum number of stops per vehicle cannot be less than zero and greater than {max}.",
        100068 : "The number of features in {stopsLayer} cannot be greater than {max}.",
        100069 : "The number of features in {startLayer} cannot be greater than {max}.",
        100070 : "The number of features in {endLayer} cannot be greater than {max}.",
        100071 : "The {stopsLayer} layer must have a point geometry type.",
        100072 : "The {startLayer} layer must have a point geometry type.",
        100073 : "The {endLayer} layer must have a point geometry type.",
        100074 : "The time spent at each stop cannot be less than zero.",
        100075 : "The total route time per vehicle should be greater than zero and less than one year (525600 minutes).",
        100076 : "The {endLayer} should not be specified if return to start is true.",
        100087 : "Field {fieldName} does not exist in {inputLayer}.",
        100274 : "The maximum number of vehicles to route must be equal to the number of features in {startLayer} layer used as starting locations for the routes.",
        100275 : "The maximum number of vehicles to route must be equal to the number of features in {endLayer} layer used as ending locations for the routes.",
        100095 : "The number of features in {endLayer} must be equal to the number of features in {startLayer}.",
        100096 : "The {startLayerRouteIDField} in {startLayer} does not have unique values.",
        100097 : "The {endLayerRouteIDField} in {endLayer} does not have unique values.",
        100098 : "The values in {startLayerRouteIDField} in {startLayer} do not have a one-to-one match with the values in {endLayerRouteIDField} in {endLayer}.",
        100113: "None of the stops were assigned to any routes. Check the Status and Violated Constraints fields in the output unassigned stops layer for more information.",
        100114: "The time spent at each stop, {stopServiceTime} minutes, must be less than the total route time per vehicle, {maxRouteTime} minutes.",
        100115: "Some stops were not assigned to any routes. Check the Violated Constraints field in the output unassigned stops layer for more information.",
        100116: "Only {routesUsed} out of {routeCount} routes are needed to reach all stops. If you want to use more routes, run Plan Routes again but reduce the limits on the maximum number of stops or the total route time per vehicle.",
        100145: "The following travel mode is invalid: {travelMode}",
        100147: "The travel mode does not specify a time-based impedance attribute.",
        100217: "Failed to save the result as route layers since the analysis did not produce any routes.",
        100223: "Including route layers is not supported when requesting feature collection output.",
        100252: "The values in {startLayerRouteIDField} field in {startLayer} and {endLayerRouteIDField} field in {endLayer} are not unique.",
        100258: "The distance between any inputs must be less than {mileValue} miles ({kmValue} kilometers) when walking.",
        100276: "The number of features in the {startLayer} layer used as starting locations for the routes cannot be greater than {max}.",
        100277: "The number of features in the {endLayer} layer used as ending locations for the routes cannot be greater than {max}.",
        }
    #parameter index for the restrictions parameter in the VRP services on logistics.arcgis.com
    RESTRICTIONS_PARAMETER_INDEX = 19

    LEGACY_TRAVEL_MODE_KEYWORDS = ("DRIVING", "WALKING", "TRUCKING")

    ROUTE_LAYER_ITEM_ID_FIELD_NAME = "RouteLayerItemID"
    ROUTE_LAYER_ITEM_URL_FIELD_NAME = "RouteLayerItemURL"

    def __init__(self, stops_layer, route_count, max_stops_per_route, route_start_time,
                 start_layer, start_layer_route_id=None, return_to_start=True, end_layer=None,
                 end_layer_route_id=None, stop_service_time=0, max_route_time=480,
                 output_workspace="in_memory", output_routes_name="Routes",
                 output_assigned_stops_name="AssignedStops", output_unassgined_stops_name="UnassignedStops",
                 travel_mode="Driving", routing_utils_tbx=None, include_route_layers=False, directions_language="en",
                 point_barrier_layer=None, line_barrier_layer=None, polygon_barrier_layer=None):

        self.stopsLayer = LayerInfo(stops_layer)
        if not self.stopsLayer.name:
            self.stopsLayer.name = "Stops Layer"
        self.routeCount = route_count
        self.maxStopsPerRoute = max_stops_per_route
        self.routeStartTime = route_start_time
        self.startLayer = LayerInfo(start_layer)
        if not self.startLayer.name:
            self.startLayer.name = "Start Layer"
        self.outputWorkspace = output_workspace
        self.outputRoutes = os.path.join(output_workspace, output_routes_name)
        self.outputAssignedStopsName = output_assigned_stops_name
        #Since a lot of other intermidiate outputs will be created before creating the output assigned stops feature
        #class, ensure that the base name is not "temp" but something that starts with temp
        self.outputAssignedStops = arcpy.CreateUniqueName("temp" + self.outputAssignedStopsName, output_workspace)
        self.outputUnassignedStops = os.path.join(output_workspace, output_unassgined_stops_name)
        #start and end layer route id fields can sometime be gp value objects instead of strings
        self.startLayerRouteID = str(start_layer_route_id) if start_layer_route_id else None
        self.returnToStart = return_to_start
        self.endLayer = LayerInfo(end_layer)
        if not self.endLayer.name:
            self.endLayer.name = "End Layer"
        self.endLayerRouteID = str(end_layer_route_id) if end_layer_route_id else None
        self.stopServiceTime = str_to_float(stop_service_time) if stop_service_time else None
        self.maxRouteTime = str_to_float(max_route_time) if max_route_time else None
        self.travelMode = travel_mode
        self.unassignedStopsCount = 0
        self.routingUtilsTbx = routing_utils_tbx
        self.includeRouteLayers = include_route_layers
        self.directionsLanguage = directions_language
        self.pointBarrierLayer = LayerInfo(point_barrier_layer)
        self.lineBarrierLayer = LayerInfo(line_barrier_layer)
        self.polygonBarrierLayer = LayerInfo(polygon_barrier_layer)
        self.routeData = None
        self.errorFunc = arcpy.AddError
        self.warningFunc = arcpy.AddWarning
        self.uniqueStopNames = {}
        self.tool_limits = {}
        #By default all outputs are created in the spatial reference of the stops layer.
        #The callers can provide a different spatial reference for outputs.
        self.outputCoordinateSystem = self.stopsLayer.describe.spatialReference

    def _addError(self, msg_code, msg, msg_params=None, is_warning=False):
        '''Adds the error message and raises arcpy.ExecuteError exception. self.errorFunc function is used to add the
        error message. if error function is arcpy.AddError only add the msg.'''

        error_func_name = self.errorFunc.__name__
        error_func = self.errorFunc
        if is_warning:
            error_func_name = self.warningFunc.__name__
            error_func = self.warningFunc

        if hasattr(arcpy, error_func_name):
            error_func(msg.replace("$", ""))
        else:
            error_func(msg_code, msg, msg_params, is_warning)
        if not is_warning:
            raise arcpy.ExecuteError

    def _validateInputs(self):
        '''validate the inputs to make sure we satisfy all the conditions to successfully call the
        remote service.'''

        #Get the tool limits from routing utlities service if available in the portal. Default is the limits imposed
        #by online services
        MAX_ROUTE_COUNT = 100
        MAX_STOPS_COUNT = 2000
        MAX_STOPS_PER_ROUTE = 200

        if self.routingUtilsTbx:
            arcpy.AddMessage("Getting tool limits from {0}".format(self.routingUtilsTbx))
            tool_limits = get_tool_limits(self.routingUtilsTbx, "asyncVRP", "SolveVehicleRoutingProblem")
            self.tool_limits = tool_limits
            if "maximumOrders" in tool_limits:
                max_orders = tool_limits["maximumOrders"]
                if max_orders is None:
                    MAX_STOPS_COUNT = INFINITY
                else:
                    MAX_STOPS_COUNT = max_orders
            if "maximumOrdersPerRoute" in tool_limits:
                max_orders_per_route = tool_limits["maximumOrdersPerRoute"]
                if max_orders_per_route is None:
                    MAX_STOPS_PER_ROUTE = INFINITY
                else:
                    MAX_STOPS_PER_ROUTE = max_orders_per_route
            if "maximumRoutes" in tool_limits:
                max_routes = tool_limits["maximumRoutes"]
                if max_routes is None:
                    MAX_ROUTE_COUNT = INFINITY
                else:
                    MAX_ROUTE_COUNT = max_routes
        arcpy.AddMessage("Max stop count: {0}".format(MAX_STOPS_COUNT))
        arcpy.AddMessage("Max stops per route: {0}".format(MAX_STOPS_PER_ROUTE))
        arcpy.AddMessage("Max route count: {0}".format(MAX_ROUTE_COUNT))
        #Check if the stops layer has point geometry
        if not self.stopsLayer.describe.shapeType.lower() in POINT_SHAPE_TYPES:
            msg_params = dict(stopsLayer=self.stopsLayer.name)
            msg_code = 100071
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)
    
        #Check if we have at least one stop
        if self.stopsLayer.count < 1:
            msg_params = dict(stopsLayer=self.stopsLayer.name)
            msg_code = 100064
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)
    
        #Check if we don't have more than the number of stops supported by the remote service
        if self.stopsLayer.count > MAX_STOPS_COUNT:
            msg_params = dict(max=MAX_STOPS_COUNT, stopsLayer=self.stopsLayer.name)
            msg_code = 100068
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)

        #Check if we don't have more than the number of vehicles supported by the remote service
        if self.routeCount <= 0 or self.routeCount > MAX_ROUTE_COUNT:
            msg_params = dict(max=MAX_ROUTE_COUNT)
            msg_code = 100066
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)
    
        #Check if we don't have more than the number of stops per vehicle supported by the remote service
        if self.maxStopsPerRoute <= 0 or self.maxStopsPerRoute > MAX_STOPS_PER_ROUTE:
            msg_params = dict(max=MAX_STOPS_PER_ROUTE)
            msg_code = 100067
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)
    
        #Check if the start layer has point geometry type
        if not self.startLayer.describe.shapeType.lower() in POINT_SHAPE_TYPES:
            msg_params = dict(startLayer=self.startLayer.name)
            msg_code = 100072
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)
    
        #Check if we have at least one point in start layer
        if self.startLayer.count < 1:
            msg_params = dict(startLayer=self.startLayer.name)
            msg_code = 100065
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)

        #Perform a case insensitive check if the startLayerRouteID field exists.
        #If the field exists, set the field name to be with appropriate case as found on the layer 
        if self.startLayerRouteID and self.startLayer.count > 1:
            start_layer_route_id = get_field_from_layer(self.startLayerRouteID, self.startLayer)
            if start_layer_route_id:
                self.startLayerRouteID = start_layer_route_id
            else:
                msg_params = dict(inputLayer=self.startLayer.name, fieldName=self.startLayerRouteID)
                msg_code = 100087
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)
    
        #If we have more than one point in start layer, check if we don't have more start points
        #than the number of vehicles supported by the remote service. For example if we have 101 start
        #points and the service only supports 100 vehicles, we can have a case where the user is trying
        #to specify 101 vehicles each starting at a unique start point.
        if self.startLayer.count > MAX_ROUTE_COUNT:
            msg_params = dict(startLayer=self.startLayer.name, max=MAX_ROUTE_COUNT)
            msg_code = 100276
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)

        #if we have more than one point in the start layer, then start layer count should be equal to route count
        if self.startLayer.count > 1:
            if self.startLayer.count != self.routeCount:
                msg_params = dict(startLayer=self.startLayer.name)
                msg_code = 100274
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)
    
        #Check that end layer is not specified if return to start is true
        if self.returnToStart and self.endLayer.count > 0:
            msg_params = dict(endLayer=self.endLayer.name)
            msg_code = 100076
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)
    
        #Check that If end layer is specified it has point geometry.
        #If we have more than one point in end layer, check if we don't have more end points
        #than the number of vehicles supported by the remote service. For example if we have 101 end
        #points and the service only supports 100 vehicles, we can have a case where the user is trying
        #to specify 101 vehicles each starting at a unique end point.
        if self.endLayer.count:
            ##Perform a case insensitive check if the endLayerRouteID field exists.
            #If the field exists, set the field name to be with appropriate case as found on the layer
            if self.endLayerRouteID and self.endLayer.count > 1:
                end_layer_route_id = get_field_from_layer(self.endLayerRouteID, self.endLayer)
                if end_layer_route_id:
                    self.endLayerRouteID = end_layer_route_id
                else:
                    msg_params = dict(inputLayer=self.endLayer.name, fieldName=self.endLayerRouteID)
                    msg_code = 100087
                    msg = self.ERROR_CODES[msg_code].format(**msg_params)
                    self._addError(msg_code, msg, msg_params)

            if not self.endLayer.describe.shapeType.lower() in POINT_SHAPE_TYPES:
                msg_params = dict(endLayer=self.endLayer.name)
                msg_code = 100073
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)
        
            if self.endLayer.count > MAX_ROUTE_COUNT:
                msg_params = dict(endLayer=self.endLayer.name, max=MAX_ROUTE_COUNT)
                msg_code = 100277
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)

            #if we have more than one point in the end layer but only one point in start layer, then end layer count
            #should be equal to route count
            if self.endLayer.count > 1 and self.startLayer.count == 1:
                if self.endLayer.count != self.routeCount:
                    msg_params = dict(endLayer=self.endLayer.name)
                    msg_code = 100275
                    msg = self.ERROR_CODES[msg_code].format(**msg_params)
                    self._addError(msg_code, msg, msg_params)
        
            #If both start layer and end layer has more than one point, both layers must have same number of features
            if self.endLayer.count > 1 and self.startLayer.count > 1:
                if self.endLayer.count != self.startLayer.count:
                    msg_params = dict(endLayer=self.endLayer.name, startLayer=self.startLayer.name)
                    msg_code = 100095
                    msg = self.ERROR_CODES[msg_code].format(**msg_params)
                    self._addError(msg_code, msg, msg_params)

        #Check that stop service time is greater than or equal to zero
        if self.stopServiceTime < 0:
            msg_code = 100074
            msg = self.ERROR_CODES[msg_code]
            self._addError(msg_code, msg, None)
            
        #Check that max route time is greater than zero and less than one year
        if self.maxRouteTime <= 0 or self.maxRouteTime > 525600:
            msg_code = 100075
            msg = self.ERROR_CODES[msg_code]
            self._addError(msg_code, msg, None)

        #Check that stop service time is less than max route time
        if self.stopServiceTime >= self.maxRouteTime:
            msg_params = dict(stopServiceTime=self.stopServiceTime, maxRouteTime=self.maxRouteTime)
            msg_code = 100114
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)

        #Check if the travel mode is valid. Valid values are JSON that represent a time based travel mode or existing
        #travel mode keywords 'Driving', 'Trucking', 'Walking'
        try:
            travel_mode_object = get_travel_mode_from_json(self.travelMode)
            #Check if the travel mode is time based
            if travel_mode_object.impedance != travel_mode_object.timeAttributeName:
                msg_code = 100147
                msg = self.ERROR_CODES[msg_code]
                self._addError(msg_code, msg, None)
        except (ValueError, TypeError) as ex:
            if not self.travelMode.upper() in self.LEGACY_TRAVEL_MODE_KEYWORDS:
                msg_params = {"travelMode" : self.travelMode}
                msg_code = 100145
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)
        
        self._checkBarrierShapeType()

    def _preprocessInputs(self):
        '''Use the validated inputs to prepare the inputs in the format required by the remote service.
        Preparing inputs does things like create the routes table and depots'''
        
        self._validateInputs()

        #Set the output coordinate system for all GP functions that create feature classes
        arcpy.env.outputCoordinateSystem = self.outputCoordinateSystem

        ##Variables used in this function
        depot_name_field = "Name"
        depot_name_field_max_length = 500
        route_name_field_max_length = 1024
        start_depot_names = {}
        end_depot_names = {}
        sl_use_oid_as_name = False
        el_use_oid_as_name = False

        # when routes start and end at different locations, such as when we have multiple start locations and multiple
        # end locations we need unique depot names as required by the VRP solver.
        use_unique_depot_name = True if self.startLayer.count > 1 and self.endLayer.count > 1 else False

        ##Create Depots feature class
        #Create an empty depots feature class in the same spatial reference as the start layer
        #and add a Name field
        self.depots = arcpy.CreateUniqueName("temp", self.outputWorkspace)
        arcpy.management.CreateFeatureclass(self.outputWorkspace, os.path.basename(self.depots), "POINT",
                                            spatial_reference=self.startLayer.describe.spatialReference)
        arcpy.management.AddField(self.depots, depot_name_field, "TEXT", field_length=depot_name_field_max_length)

        #Append features from start layer into the depots. Since we have a cursor on start layer also
        #store the values for start route id field. If start route id field is not specified, use OID
        #If start layer has only one feature, ignore start layer id field and use OID
        #the startLayerRouteID field is ignored.
        #start_layer_cursor_fields = ("SHAPE@",
        #                             self.startLayerRouteID) if self.startLayerRouteID else ("SHAPE@","OID@")
        if self.startLayerRouteID and self.startLayer.count > 1:
            start_layer_cursor_fields = ("SHAPE@", self.startLayerRouteID)
        else:
            #Check if we have a name field on the start layer
            #start_layer_name_field = get_field_from_layer("Name", self.startLayer, True)
            start_layer_name_field = check_well_known_fields(self.startLayer)
            if start_layer_name_field: # and start_layer_name_field.length <= depot_name_field_max_length:
                start_layer_cursor_fields = ("SHAPE@", start_layer_name_field.name)
            else:
                start_layer_cursor_fields = ("SHAPE@","OID@")
                sl_use_oid_as_name = True

        with arcpy.da.InsertCursor(self.depots, ("SHAPE@", depot_name_field)) as depots_cursor:
            with arcpy.da.SearchCursor(self.startLayer.layer, start_layer_cursor_fields,
                                       "", self.startLayer.describe.spatialReference) as start_layer_cursor:
                for i,row in enumerate(start_layer_cursor):
                    #start_route_id = str(row[1])
                    start_route_id = str(row[1])
                    #start_depot_name = "StartDepot{0}".format(i + 1)
                    if sl_use_oid_as_name or use_unique_depot_name:
                        start_depot_name = "Start Depot - {}".format(start_route_id)
                    else:
                        start_depot_name = start_route_id
                    start_depot_names[start_route_id] = start_depot_name
                    depots_cursor.insertRow((row[0], start_depot_name))
    
        #fail if start route id field values are not unique
        start_route_ids = set(start_depot_names.keys())
        if len(start_route_ids) != self.startLayer.count:
            msg_params = dict(startLayerRouteIDField=self.startLayerRouteID, startLayer=self.startLayer.name)
            msg_code = 100096
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)
                
        if not self.returnToStart:
            #Append the features from end layer into depots if not returning to start. Since we already have
            #a cursor on end layer, also store values for end route id field. If end route id field is not
            #specified, use OID. If end layer has only one feature, ignore end layer id field and use OID
            #end_layer_cursor_fields = ("SHAPE@",
            #                           self.endLayerRouteID) if self.endLayerRouteID else ("SHAPE@","OID@")
            if self.endLayerRouteID and self.endLayer.count > 1:
                end_layer_cursor_fields = ("SHAPE@", self.endLayerRouteID)
            else:
                #Check if we have a name field on the end layer
                #end_layer_name_field = get_field_from_layer("Name", self.endLayer, True)
                end_layer_name_field = check_well_known_fields(self.endLayer)
                if end_layer_name_field: # and end_layer_name_field.length <= depot_name_field_max_length:
                    end_layer_cursor_fields = ("SHAPE@", end_layer_name_field.name)
                else:
                    end_layer_cursor_fields = ("SHAPE@", "OID@")
                    el_use_oid_as_name = True


            with arcpy.da.InsertCursor(self.depots, ("SHAPE@", depot_name_field)) as depots_cursor:
                with arcpy.da.SearchCursor(self.endLayer.layer, end_layer_cursor_fields, "",
                                           self.startLayer.describe.spatialReference) as end_layer_cursor:
                    for i,row in enumerate(end_layer_cursor):
                        #end_route_id = str(row[1])
                        end_route_id = str(row[1])
                        #end_depot_name = "EndDepot{0}".format(i + 1)
                        if el_use_oid_as_name or use_unique_depot_name:
                            end_depot_name = "End Depot - {}".format(end_route_id)
                        else:
                            end_depot_name = end_route_id
                        end_depot_names[end_route_id] = end_depot_name 
                        depots_cursor.insertRow((row[0], end_depot_name))
                    
            #fail if end route id field values are not unique
            end_route_ids = set(end_depot_names.keys())
            if len(end_route_ids) != self.endLayer.count:
                msg_params = dict(endLayerRouteIDField=self.endLayerRouteID, endLayer=self.endLayer.name)
                msg_code = 100097
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)

            #When both start and end depots are specified and both have more than one feature, we need to match each
            #start depot name to exactly one end depot name So fail if the start_route_ids are not identical to 
            #end_route_ids
            if self.startLayer.count > 1 and self.endLayer.count > 1: 
                if start_route_ids != end_route_ids:
                    msg_params = dict(startLayerRouteIDField=self.startLayerRouteID, startLayer=self.startLayer.name,
                                      endLayerRouteIDField=self.endLayerRouteID, endLayer=self.endLayer.name)
                    msg_code = 100098
                    msg = self.ERROR_CODES[msg_code].format(**msg_params)
                    self._addError(msg_code, msg, msg_params)
            #When both start and end depots are specified and both have only one feature, make sure their route ids
            #are unique. The route ids may not be unique when using well known fields.
            # Route IDs are also not unique when start layer and end layer do not have well known fields such
            # as when passing map notes. So in such cases make sure the route ids are unique and not raise an error
            if self.startLayer.count == 1 and self.endLayer.count == 1:
                if not (sl_use_oid_as_name and el_use_oid_as_name):
                    if start_route_ids.intersection(end_route_ids):
                        msg_params = dict(startLayerRouteIDField=start_layer_name_field.name,
                                          startLayer=self.startLayer.name,
                                          endLayerRouteIDField=end_layer_name_field.name,
                                          endLayer=self.endLayer.name)
                        msg_code = 100252
                        msg = self.ERROR_CODES[msg_code].format(**msg_params)
                        self._addError(msg_code, msg, msg_params)

       
        ##Create the routes table
        self.routesTable = arcpy.CreateUniqueName("temp", self.outputWorkspace)
        arcpy.management.CreateTable(self.outputWorkspace, os.path.basename(self.routesTable))
        routes_table_fields = collections.OrderedDict(
                                                      (
                                                       ("Name", ("TEXT", "", "", route_name_field_max_length)),
                                                       ("StartDepotName", ("TEXT", "", "", depot_name_field_max_length)),
                                                       ("EndDepotName", ("TEXT", "", "", depot_name_field_max_length)),
                                                       ("EarliestStartTime", ("DATE",)),
                                                       ("LatestStartTime", ("DATE",)),
                                                       ("MaxOrderCount", ("SHORT",)),
                                                       ("MaxTotalTime", ("DOUBLE",)),
                                                       )
                                                      )
        #Create the field on the route table                       
        for fld in routes_table_fields:
            arcpy.management.AddField(self.routesTable, fld, *routes_table_fields[fld])

        #insert route records
        with arcpy.da.InsertCursor(self.routesTable, list(routes_table_fields.keys())) as cursor:
            if self.returnToStart:
                #handle cases where we have only one start point but need to create multiple routes
                #as well as multiple start points and routes that start and end at each start point.
                if len(start_depot_names) == 1:
                    #need to create route_count number of routes with same start and end depot names
                    route_id,depot_name = list(start_depot_names.items())[0]
                    #Create a unique Name field value like route<n> 
                    for i in range(0, self.routeCount):
                        route_id = "{} - Route{}".format(depot_name, i+1)
                        cursor.insertRow((route_id, depot_name, depot_name, self.routeStartTime,
                                          self.routeStartTime, self.maxStopsPerRoute, self.maxRouteTime))

                else:
                    #need to create start_layer feature count number of routes with same start and end depot names
                    for route_id in start_depot_names:
                        start_depot_name = start_depot_names[route_id]
                        cursor.insertRow((route_id, start_depot_name, start_depot_name, self.routeStartTime,
                                          self.routeStartTime, self.maxStopsPerRoute, self.maxRouteTime))

            else:
                #handle cases where we have only one start and one end point but need to create multiple routes
                #as well as one route between each start and end point pair
                if len(start_depot_names) == 1 and len(end_depot_names) == 1:
                    #need to create route_count number of routes between the one start end pair
                    start_route_id, start_depot_name = list(start_depot_names.items())[0]
                    end_route_id, end_depot_name = list(end_depot_names.items())[0]
                    #Create a unique Name field value like route<n>
                    for i in range(0, self.routeCount):
                        route_id = "{} - {} - Route{}".format(start_depot_name, end_depot_name,  i+1)
                        cursor.insertRow((route_id, start_depot_name, end_depot_name, self.routeStartTime,
                                          self.routeStartTime, self.maxStopsPerRoute, self.maxRouteTime))
                elif len(start_depot_names) > 1 and len(end_depot_names) == 1:
                    #need to create start_layer feature count number of routes between many start locations and one
                    #end location
                    end_route_id, end_depot_name = list(end_depot_names.items())[0]
                    for depot_name in start_depot_names:
                        cursor.insertRow((depot_name, start_depot_names[depot_name], end_depot_name,
                                          self.routeStartTime, self.routeStartTime, self.maxStopsPerRoute,
                                          self.maxRouteTime))
                elif len(start_depot_names) == 1 and len(end_depot_names) > 1:
                    #need to create end_layer feature count number of routes between many end locations and one
                    #start location
                    start_route_id, start_depot_name = list(start_depot_names.items())[0]
                    for depot_name in end_depot_names:
                        cursor.insertRow((depot_name, start_depot_name, end_depot_names[depot_name],
                                          self.routeStartTime, self.routeStartTime, self.maxStopsPerRoute,
                                          self.maxRouteTime))
                else:
                    #need to create start_layer feature count number of routes between each start end pair
                    for depot_name in start_depot_names:
                        cursor.insertRow((depot_name, start_depot_names[depot_name], end_depot_names[depot_name],
                                          self.routeStartTime, self.routeStartTime, self.maxStopsPerRoute,
                                          self.maxRouteTime))

        ##Create orders feature class as specified by outputAssignedStops
        # Copy the objectIDs from stops_layer as the Name field.
        # Later on we need to rename this Name field if the input already contains name field.
        order_name_field_max_length = 500
        orders_fms = arcpy.FieldMappings()
        name_fm = arcpy.FieldMap()
        name_fm.addInputField(self.stopsLayer.layer, self.stopsLayer.describe.OIDFieldName)
        name_field = name_fm.outputField
        name_field.type = "TEXT"
        name_field.name = "Name"
        name_field.aliasName = "Name"
        name_field.length = order_name_field_max_length
        name_fm.outputField = name_field
        orders_fms.addFieldMap(name_fm)
        arcpy.conversion.FeatureClassToFeatureClass(self.stopsLayer.layer, self.outputWorkspace,
                                                    os.path.basename(self.outputAssignedStops),
                                                    field_mapping=orders_fms)
        # Add ServiceTime field on input orders
        arcpy.management.AddField(self.outputAssignedStops, "ServiceTime", "DOUBLE",
                                  field_alias="Service Time (Minutes)")
        # If including route layers check if the stops have a name field. If name field is present, make its value
        # unique as the remote service needs unique values in Name field on Orders and replace the OIDs with unique
        # stop names
        if self.includeRouteLayers:
            #stop_name_field = get_field_from_layer("name", self.stopsLayer, True)
            stop_name_field = check_well_known_fields(self.stopsLayer)
            if stop_name_field: # and stop_name_field.length <= order_name_field_max_length:
                # Ensure Stop name have unique values
                stop_names = {}
                with arcpy.da.SearchCursor(self.stopsLayer.layer, ("OID@", stop_name_field.name)) as cursor:
                    for row in cursor:
                        # Handle null values in the name field
                        oid, name = row
                        # convert name to string in case the well known field is numeric
                        if isinstance(name, (int, float)):
                            name = str(int(name))
                        if not name:
                            name = str(oid)
                        stop_names.setdefault(name, []).append(oid)
                for stop_name, oids in stop_names.items():
                    if len(oids) == 1:
                        self.uniqueStopNames[str(oids[0])] = stop_name
                    else:
                        for oid in oids:
                            new_stop_name = "{}_{}".format(stop_name, oid)
                            while True:
                                if new_stop_name in stop_names:
                                    new_stop_name += "_{}".format(oid)
                                else:
                                    break
                            self.uniqueStopNames[str(oid)] = new_stop_name
                # Update Name and ServiceTime field on stops
                with arcpy.da.UpdateCursor(self.outputAssignedStops, ("ServiceTime", "Name")) as cursor:
                    for row in cursor:
                        cursor.updateRow((self.stopServiceTime, self.uniqueStopNames.get(row[1], row[1])))
            else:
                arcpy.management.CalculateField(self.outputAssignedStops, "ServiceTime", self.stopServiceTime, "PYTHON")
        else:    
        # Calculate the ServiceTime field value to be same as input service time for stops
            arcpy.management.CalculateField(self.outputAssignedStops, "ServiceTime", self.stopServiceTime, "PYTHON")

    def execute(self, remote_toolbox):
        '''Use the validated and preprocessed inputs to run the analysis using the remote service. Post process 
        the outputs obtained from calling the remote service into outputs that needs to be returned from
        the tool. Return the output routes, assigned stops and unassigned stops feature classes'''

        #Set the output coordinate system for all GP functions that create feature classes
        arcpy.env.outputCoordinateSystem = self.outputCoordinateSystem

        with LogExecutionTime("Preprocessed inputs"):
            self._preprocessInputs()

        solve_succeeded = False
        
        try:
            arcpy.AddMessage("Adding remote toolbox {0}".format(remote_toolbox))
            #default date is the same date as the date in route_start_time
            #Cluster routes only if more than 50% of stops can be asssigned to the routes
            cluster_routes = False
            if self.maxStopsPerRoute * self.routeCount > self.stopsLayer.count / 2.0:
                cluster_routes = True
            arcpy.AddMessage("Spatially cluster routes: {0}".format(cluster_routes))
            if self.includeRouteLayers:
                save_route_data = True
                populate_directions = True
                arcpy.AddMessage("Directions language: {0}".format(self.directionsLanguage))
            else:
                save_route_data = False
                populate_directions = False
            task_params = [self.outputAssignedStops, self.depots, self.routesTable, "", "", "Miles", "",
                           self.routeStartTime, "", "", cluster_routes, "", "", "", "",
                           self.pointBarrierLayer.layer, self.lineBarrierLayer.layer, self.polygonBarrierLayer.layer,
                            "", "", "", "", "", populate_directions, self.directionsLanguage,  "", self.travelMode, "",
                            "", "", "", save_route_data]
            ignore_error_codes = (30109,)
            try:
                service_result = call_async_gp_service(remote_toolbox, "SolveVehicleRoutingProblem", task_params,
                                                       ignore_error_codes, (self.RESTRICTIONS_PARAMETER_INDEX,))
            except arcpy.ExecuteError as ex:
                try:
                    remote_msgs = ex.args[0] if ex.args else ""
                    if remote_msgs:
                        if 30145 in remote_msgs:
                            # Walking limit exceeded
                            msg_code = 100258
                            walking_limit = self.tool_limits.get("maximumGeodesicDistanceWhenWalking", 27)
                            walking_limit_unit = self.tool_limits.get("maximumGeodesicDistanceUnitsWhenWalking", "Miles")
                            msg_params = {
                                "mileValue": convert_units(walking_limit, walking_limit_unit, "Miles"),
                                "kmValue": convert_units(walking_limit, walking_limit_unit, "Kilometers"),
                            }
                            msg = self.ERROR_CODES[msg_code]
                            self._addError(msg_code, msg, msg_params)
                        if 30095 in remote_msgs:
                            # Barrier limit exceeded
                            self._raiseBarrierLimitError(remote_msgs[30095])
                    else:
                        raise
                except Exception:
                    raise

            if service_result.getOutput(4).lower() == 'true':
                solve_succeeded = True
            
            with LogExecutionTime("Saved the results from remote tool"):
                #Save the route data from service results
                if save_route_data:
                    if solve_succeeded:
                        self.routeData = service_result.getOutput(6)
                    else:
                        #Raise a warning since no route data is generated when there is no solution for VRP.
                        msg_code = 100217
                        msg = self.ERROR_CODES[msg_code]
                        self._addError(msg_code, msg, is_warning=True)
                #Save the outputs as feature classes and table instead of record sets and feature sets
                out_unassigned_stops_table = arcpy.CreateUniqueName("temp", self.outputWorkspace)
                arcpy.management.CopyRows(service_result.getOutput(0), out_unassigned_stops_table)
                out_stops_table = arcpy.CreateUniqueName("temp", self.outputWorkspace)
                arcpy.management.CopyRows(service_result.getOutput(1), out_stops_table)
                arcpy.management.CopyFeatures(service_result.getOutput(2), self.outputRoutes)
                
            ##Post process results
            with LogExecutionTime("Post-processed results"):
                #Make a layer that references the input stops
                orders_layer = "vrp_input_orders"
                arcpy.management.MakeFeatureLayer(self.outputAssignedStops, orders_layer,"", self.outputWorkspace)
                #For transfering fields from input stops to assigned stops and unassigned stops, add a new LONG field
                #called StopID. If "StopID" field name is not unique, get a unique name that starts with StopID such
                #as StopID_1
                stops_layer_field_names = [fld.name for fld in self.stopsLayer.describe.fields]
                stop_id_field_name = get_unique_field_name("StopID",stops_layer_field_names)

                #Determine if we have unassigned stops
                self.unassignedStopsCount = int(arcpy.management.GetCount(out_unassigned_stops_table).getOutput(0))

                if solve_succeeded:
                    #Change the StopType field type on output assigned stops table from Long to Text and
                    #calculate text values for stoptype
                    
                    arcpy.management.AddField(out_stops_table, "StopTypeText", "TEXT", field_length=20,
                                              field_alias="Stop Type")
                    with arcpy.da.UpdateCursor(out_stops_table, ("StopType", "StopTypeText",
                                                                 "Sequence")) as out_stops_table_cursor:
                        for row in out_stops_table_cursor:
                            stop_type = ""
                            if row[0] == 0:
                                stop_type = "Stop"
                            else:
                                if row[2] == 1:
                                    stop_type = "Route start"
                                else:
                                    stop_type = "Route end"
                            row[1] = stop_type
                            out_stops_table_cursor.updateRow(row)
                    arcpy.management.DeleteField(out_stops_table, "StopType")
                    arcpy.management.AlterField(out_stops_table, "StopTypeText", "StopType")
                    #Delete unnecessary fields from output routes
                    deleted_route_fields = ("RegularTimeCost", "OvertimeCost", "DistanceCost", "TotalBreakServiceTime",
                                            "TotalWaitTime", "TotalViolationTime", "RenewalCount",
                                            "TotalRenewalServiceTime", "ViolatedConstraints", "TotalCost")
                    arcpy.management.DeleteField(self.outputRoutes, deleted_route_fields)
                    ##Rename fields on routes layer
                    #Rename TotalDistance field as Total_Miles
                    arcpy.management.AlterField(self.outputRoutes, "TotalDistance", "Total_Miles", "Total Miles")
                    #Rename OrderCount field as StopCount
                    arcpy.management.AlterField(self.outputRoutes, "OrderCount", "StopCount", "Stop Count")
                    #Rename TotalOrderServiceTime field as TotalStopServiceTime
                    arcpy.management.AlterField(self.outputRoutes, "TotalOrderServiceTime", "TotalStopServiceTime",
                                                "Total Service Time (Minutes)")
                    #Rename Name field as RouteName
                    arcpy.management.AlterField(self.outputRoutes, "Name", "RouteName", "Route Name")
                    
                    #Add new fields on routes

                    # Add new RouteLayerItemID and RouteLayerItemURL fields that are populated after route layers are
                    #created.
                    arcpy.management.AddField(self.outputRoutes, self.ROUTE_LAYER_ITEM_ID_FIELD_NAME, "TEXT",
                                              field_length=50, field_alias="Route Layer Item ID")
                    arcpy.management.AddField(self.outputRoutes, self.ROUTE_LAYER_ITEM_URL_FIELD_NAME, "TEXT",
                                              field_length=256, field_alias="Route Layer Item")

                    assigned_depots_where_clause = "StopType IN ('Route start', 'Route end')"
                    #Add a new field called Total_Kilometers and calculate its value based on Total_Miles field
                    arcpy.management.AddField(self.outputRoutes, "Total_Kilometers", "DOUBLE",
                                              field_alias="Total Kilometers")
                    #At 10.5 and with June 2016 release of Online, the VRP service already outputs 
                    #StartTimeUTC and EndTimeUTC fields. So skip calculating them if already present
                    output_routes_date_fields = [fld.name for fld in arcpy.ListFields(self.outputRoutes, field_type="Date")]
                    if "StartTimeUTC" in output_routes_date_fields and "EndTimeUTC" in output_routes_date_fields:
                        #Calculate Total_Kilometers field from Total_Miles fields
                        arcpy.management.CalculateField(self.outputRoutes, "Total_Kilometers",
                                                        "!Total_Miles! * 1.60934", "PYTHON_9.3")
                        #Update field alias for StartTimeUTC and EndTimeUTC fields
                        arcpy.management.AlterField(self.outputRoutes, "StartTimeUTC", "StartTimeUTC", "Start Time")
                        arcpy.management.AlterField(self.outputRoutes, "EndTimeUTC", "EndTimeUTC", "End Time")

                    else:
                        #Add StartTimeUTC and EndTimeUTC fields on routes.
                        arcpy.management.AddField(self.outputRoutes, "StartTimeUTC", "DATE", field_alias="Start Time")
                        arcpy.management.AddField(self.outputRoutes, "EndTimeUTC", "DATE", field_alias="End Time")
                        #Calculate StartTimeUTC and EndTimeUTC fields on routes based on assignedStops table
                        #and Total_Kilometers field from Total_Miles field on routes
                        route_utc_start_end_times = {}
                        assigned_stops_table_cursor_fields = ("RouteName", "ArriveTimeUTC", "DepartTimeUTC", "StopType",
                                                              "Sequence")
                        sequence_field_index = len(assigned_stops_table_cursor_fields) - 1
                        with arcpy.da.SearchCursor(out_stops_table, assigned_stops_table_cursor_fields,
                                                   assigned_depots_where_clause) as assigned_stops_table_cursor:
                            for row in sorted(assigned_stops_table_cursor, key=itemgetter(sequence_field_index)):
                                route_name = row[0]
                                if route_name in route_utc_start_end_times:
                                    route_utc_start_end_times[route_name].append(row[2])
                                else:
                                    route_utc_start_end_times[route_name] = [row[1]]
                        used_routes_where_clause = "StopCount IS NOT NULL"
                        with arcpy.da.UpdateCursor(self.outputRoutes, ("RouteName", "StartTimeUTC", "EndTimeUTC",
                                                                       "Total_Miles", "Total_Kilometers"),
                                                   used_routes_where_clause) as routes_cursor:
                            for row in routes_cursor:
                                route_name = row[0]
                                start_time_utc, end_time_utc = route_utc_start_end_times.get(route_name, [None, None])
                                row[1] = start_time_utc
                                row[2] = end_time_utc
                                row[4] = row[3] * 1.60934
                                routes_cursor.updateRow(row)

                    #Add a warning if all routes are not used
                    unused_routes_where_clause = "StopCount IS NULL"
                    unused_routes_layer = "UnusedRoutesLayer"
                    arcpy.management.MakeFeatureLayer(self.outputRoutes, unused_routes_layer,
                                                      unused_routes_where_clause)
                    unused_route_count = int(arcpy.management.GetCount(unused_routes_layer).getOutput(0))
                    if unused_route_count:
                        #Calculate the StopCount value as 0 instead of NULL
                        arcpy.management.CalculateField(unused_routes_layer, "StopCount", 0, "PYTHON")
                        #Add a warning
                        used_route_count = self.routeCount - unused_route_count
                        msg_params = dict(routeCount=self.routeCount, routesUsed=used_route_count)
                        msg_code = 100116
                        msg = self.ERROR_CODES[msg_code].format(**msg_params)
                        self._addError(msg_code, msg, msg_params, True)

                    ##Add new fields on output assigned stops table
                    #Add a new field called "FromPrevDistanceKilometers" to output stops table and calculate the field
                    #based on FromPrevDistance
                    prev_distance_km_field = "FromPrevDistanceKilometers"
                    arcpy.management.AddField(out_stops_table, prev_distance_km_field, "DOUBLE",
                                              field_alias="Travel Distance from Previous Stop (Kilometers)")
                    arcpy.management.CalculateField(out_stops_table, prev_distance_km_field, 
                                                    "!FromPrevDistance! * 1.60934", "PYTHON")
                    
                    #Keep track of the output stops layers we want to post process
                    out_stops_layers = [self.outputAssignedStops]
            
                    #If we have unassigned stops, then we need to create a new feature class by selecting 
                    #unassigned orders from input vrp orders. otherwise we can just join attributes from assigned
                    #stops table to the input vrp orders
                    if self.unassignedStopsCount:
                        #Add a warning that some of the stops were unassigned
                        self._addError(100115, self.ERROR_CODES[100115], is_warning=True)
                        self._createUnassignedStopFeatures(orders_layer, out_unassigned_stops_table)
                        out_stops_layers.append(self.outputUnassignedStops)
                        
                    #Create the assigned stops feature class by joining the attributes from out_stops table to input
                    #orders
                    transfer_fields = ("StopType", "RouteName", "Sequence", "FromPrevTravelTime", "FromPrevDistance",
                                       "ArriveTime", "DepartTime", "ArriveTimeUTC", "DepartTimeUTC",
                                       prev_distance_km_field)
                    arcpy.management.JoinField(orders_layer, "Name", out_stops_table, "Name", transfer_fields)

                    #Delete the unassigned stops if any
                    if self.unassignedStopsCount:
                        arcpy.management.SelectLayerByAttribute(orders_layer, "NEW_SELECTION", "RouteName is NULL")
                        arcpy.management.DeleteFeatures(orders_layer)

                    #Transfer the fields from input stops layer to both assigned stops and unassigned stops
                    for fc in out_stops_layers:
                        self._transferInputStopFields(fc, stop_id_field_name)

                    #Add the depots to assigned stops layer
                    #Find all the depots that are actually used in the solution
                    with arcpy.da.SearchCursor(out_stops_table, "Name",
                                               assigned_depots_where_clause) as out_stops_table_cursor:
                        assigned_depot_names = {row[0] for row in out_stops_table_cursor}
                    #Store the shapes for the assigned depot names in the same spatial reference as
                    #output assigned stops feature class
                    assigned_depots_shapes = {}
                    with arcpy.da.SearchCursor(self.depots, ("Name", "SHAPE@") , "", orders_layer) as depots_fc_cursor:
                        for row in depots_fc_cursor: 
                            depot_name = row[0]
                            if depot_name in assigned_depot_names:
                                assigned_depots_shapes[depot_name] = row[1]
                    #Add depots from the output assigned stops table to output assigned stops feature class
                    #Only use the fields from output assigned stops table when transfering
                    with arcpy.da.InsertCursor(orders_layer,
                                               ("SHAPE@", "ServiceTime") + transfer_fields) as orders_layer_cursor:
                        with arcpy.da.SearchCursor(out_stops_table, ("Name",) + transfer_fields,
                                                   assigned_depots_where_clause) as out_stops_table_cursor:
                            for row in out_stops_table_cursor:
                                depot_name = row[0]
                                depot_shape = assigned_depots_shapes[depot_name]
                                #Service time at depots is always zero.
                                row_value = (depot_shape, 0) + row[1:]
                                orders_layer_cursor.insertRow(row_value)

                    #Update field aliases for output routes and output assigned stops
                    out_routes_field_aliases = {
                        "TotalTime" : "Total Time (Minutes)",
                        "TotalTravelTime" : "Total Travel Time (Minutes)",
                        "StartTime": "Start Time (Time Zone of Start Location)",
                        "EndTime": "End Time (Time Zone of End Location)"
                        }
                    out_assigned_stops_fld_aliases = {
                        "StopType" : "Stop Type",
                        "RouteName" : "Route Name",
                        "FromPrevTravelTime" : "Travel Time from Previous Stop (Minutes)",
                        "FromPrevDistance" : "Travel Distance from Previous Stop (Miles)",
                        "ArriveTime" : "Arrive Time (Time Zone of Stop)",
                        "DepartTime" : "Depart Time (Time Zone of Stop)",
                        "ArriveTimeUTC" : "Arrive Time",
                        "DepartTimeUTC" : "Depart Time"
                        }
                    for fld in out_routes_field_aliases:
                        arcpy.management.AlterField(self.outputRoutes, fld, fld, out_routes_field_aliases[fld])

                    for fld in out_assigned_stops_fld_aliases:
                        arcpy.management.AlterField(orders_layer, fld, fld, out_assigned_stops_fld_aliases[fld])

                    #Sort the assigned stops in ascending order by RouteName and Sequence
                    sorted_assigned_stops = os.path.join(self.outputWorkspace, self.outputAssignedStopsName)
                    arcpy.management.Sort(self.outputAssignedStops, sorted_assigned_stops, 
                                          [["RouteName", "ASCENDING"],
                                           ["Sequence", "ASCENDING"]])
                    self.outputAssignedStops = sorted_assigned_stops

                else:
                    #Add a warning that none of the stops were assigned
                    self._addError(100113, self.ERROR_CODES[100113], is_warning=True)
                    #if solve failed, create unassignedStopsLayer with all the input stops
                    self._createUnassignedStopFeatures(orders_layer, out_unassigned_stops_table)
                    #Transfer the fields from input stops layer to both assigned stops and unassigned stops
                    self._transferInputStopFields(self.outputUnassignedStops, stop_id_field_name)
                    #return empty routes and assigned stops layer as the solve failed.
                    self.outputRoutes, self.outputAssignedStops = "", ""
        except Exception as ex:
            self.outputRoutes, self.outputAssignedStops, self.outputUnassignedStops = "", "", ""
            raise
        finally:
            #Delete any temporary outputs
            orig_workspace = arcpy.env.workspace
            arcpy.env.workspace = self.outputWorkspace
            for dataset in arcpy.ListFeatureClasses("temp*") + arcpy.ListTables("temp*"):
                try:
                    arcpy.management.Delete(dataset)
                    #pass
                except Exception as ex:
                    arcpy.AddMessage("Failed to delete {0}".format(os.path.join(self.outputWorkspace, dataset)))
            arcpy.env.workspace = orig_workspace

    def _createUnassignedStopFeatures(self, orders_layer, out_unassigned_stops_table):
        '''Creates the unassigned stop features based on the input stops and the unassigned stops table'''
        
        stops_violated_constraints = {
            1 : "Maximum number of points per route exceeded",
            4 : "Maximum total time exceeded"
            }
        stops_status = {
            0 : "Ok",
            1: "Not located",
            3: "Not travelable",
            4: "Invalid field values or empty geometry",
            5: "Not reached",
            7: "Not located on closest",
            }

        out_unassigned_stops_table_name = os.path.basename(out_unassigned_stops_table)
        #Create a new feature class to store the output unassigned stops and add the necessary fields
        arcpy.management.CreateFeatureclass(self.outputWorkspace,
                                            os.path.basename(self.outputUnassignedStops), "POINT",
                                            spatial_reference=self.outputCoordinateSystem)
        out_unassigned_stops_fc_field_names = []  
        for fld in (("Name","Name"), ("ViolatedConstraints", "Violated Constraints"), ("Status", "Status")):
            fld_name = fld[0]
            arcpy.management.AddField(self.outputUnassignedStops, fld_name, "TEXT", field_length=255,
                                      field_alias=fld[1])
            out_unassigned_stops_fc_field_names.append(fld_name)
        #Create a inner join between the input vrp orders and output unassigned stops table
        #This will keep only the unassigned stops in the input vrp orders layer which we will write
        #out to a new feature class 
        arcpy.management.AddJoin(orders_layer, "Name",  out_unassigned_stops_table, "Name", "KEEP_COMMON")
        #get shapes for all the unassigned stops and calculate other fields based on the inner join
        out_unassigned_stops_fc_cursor_fields = ["SHAPE@"] + out_unassigned_stops_fc_field_names
        orders_layer_fields = ["SHAPE@"] + ["{0}.{1}".format(out_unassigned_stops_table_name,
                                                                fld) for fld in out_unassigned_stops_fc_field_names]
        with arcpy.da.InsertCursor(self.outputUnassignedStops,
                                    out_unassigned_stops_fc_cursor_fields) as out_unassigned_stops_fc_cursor:
            with arcpy.da.SearchCursor(orders_layer, orders_layer_fields) as orders_layer_cursor:
                for row in orders_layer_cursor:
                    new_row = list(row)
                    #convert numeric status to their correponding string values
                    new_row[3] = stops_status.get(new_row[3], str(new_row[3]))
                    #Convert the numeric violated constraints to their corresponding string values
                    int_violated_constraint = new_row[2]
                    if int_violated_constraint:
                        if int_violated_constraint in stops_violated_constraints:
                            new_row[2] = stops_violated_constraints[int_violated_constraint]
                        else:
                            #multiple constraints are being violated.
                            #get the individual constraints and append their string representations
                            bin_violated_constraint = bin(int_violated_constraint).lstrip("0b")
                            str_vc = []
                            len_bin_violated_constraint = len(bin_violated_constraint) - 1
                            for i, digit in enumerate(bin_violated_constraint):
                                if digit != '0':
                                    int_digit = pow(2, len_bin_violated_constraint - i)
                                    str_vc.append(stops_violated_constraints.get(int_digit, str(int_digit)))
                            new_row[2] = ", ".join(str_vc)
                    else:
                        #This is the case when some orders are invalid and so violated constraints are Null
                        new_row[2] = ""
                    out_unassigned_stops_fc_cursor.insertRow(new_row)
        #remove the join
        arcpy.management.RemoveJoin(orders_layer, out_unassigned_stops_table_name)

    def _transferInputStopFields(self, fc, stop_id_field_name):
        '''Transfer the fields from input stops layer to both assigned stops and unassigned stops.'''

        #Treat Name field from input as a special case. Name field from input should be named as Name in output. 
        #So rename the Name field that was use for previous join and as input to VRP service to be called OrderID or some combination of OrderID
        #that does not already exist in input layer.'''

        arcpy.management.AddField(fc, stop_id_field_name, "LONG")
        #Calculate StopID from text name field 
        if self.uniqueStopNames:
            # Replace the unique stop names with OIDs. This is required since when creating route layers, it is possible
            # the Name field may not contain OIDs
            unq_stop_names = {v:k for k,v in self.uniqueStopNames.items()}
            with arcpy.da.UpdateCursor(fc, ("Name", stop_id_field_name)) as cursor:
                for row in cursor:
                    row[1] = int(unq_stop_names[row[0]])
                    cursor.updateRow(row)
        else:
            # Calculate StopID from text name field which actually includes OIDs from input stops   
            with arcpy.da.UpdateCursor(fc, ("Name", stop_id_field_name)) as cursor:
                for row in cursor:
                    row[1] = int(row[0])
                    cursor.updateRow(row)
        #arcpy.management.CalculateField(fc, stop_id_field_name,"long(!Name!)", "PYTHON_9.3")
        #Delete the Name field as we don't want to rename the Name field from input stops.
        arcpy.management.DeleteField(fc, "Name")
        #Transfer all fields from inputs stops to asssigned and unassigned stops
        arcpy.management.JoinField(fc, stop_id_field_name, self.stopsLayer.layer,
                                    self.stopsLayer.describe.oidFieldName)
        #Delete the StopID field as we no longer need it.
        arcpy.management.DeleteField(fc, stop_id_field_name)
        #In case of field name collision, rename the fields from input stops  as ORIG_fieldname and field
        #alias to be Field Alias (Original).
        fields_to_rename = {fld.name: fld.aliasName for fld in arcpy.ListFields(fc,"*_1") if not fld.required}
        for fld in fields_to_rename:
            new_fld_name = "ORIG_{0}".format(fld.rstrip("_1"))
            new_alias_name = "{0} (Original)".format(fields_to_rename[fld])
            arcpy.management.AlterField(fc, fld, new_fld_name, new_alias_name)

class ConnectOriginsToDestinations(NetworkAnalysisTool):
    '''Finds distance between origin destination pairs using different measurement methods'''
    ERROR_CODES = {
        100069 : "The number of features in {startLayer} cannot be greater than {max}.",
        100072 : "The {startLayer} layer must have a point geometry type.",
        100087 : "Field {fieldName} does not exist in {inputLayer}.",
        100095 : "The number of features in {endLayer} must be equal to the number of features in {startLayer}.",
        100096 : "The {startLayerRouteIDField} in {startLayer} does not have unique values.",
        100098 : "The values in {startLayerRouteIDField} in {startLayer} do not have a one-to-one match with the values in {endLayerRouteIDField} in {endLayer}.",
        100137 : "A value for the {parameterName} is required.",
        100138 : "Some origins were not connected to their paired destinations. Check the Status field in output unassigned origins and unassigned destinations layers for more information.",
        100139 : "None of the origins could be connected to destinations.",
        100145: "The following travel mode is invalid: {travelMode}",
        100218: "Including route layers is not valid when measurementType is StraightLine.",
        100223: "Including route layers is not supported when requesting feature collection output.",
        100258: "The distance between any inputs must be less than {mileValue} miles ({kmValue} kilometers) when walking.",
        100263: "{barrierType} cannot be specified when measurementType is StraightLine.",
        100271: "The {fieldName} field in {analysisLayer} layer cannot have empty values.",
        100272: "Either {startLayerRouteIDField} field in {startLayer} layer or {endLayerRouteIDField} field in {endLayer} layer should have unique values.",
        100273: "{routeId} value from {routeIDField} field in {startLayer} layer does not have any matching feature in {endLayer} layer.",
    }
    LEGACY_TRAVEL_MODE_KEYWORDS = ("DRIVINGTIME", "DRIVINGDISTANCE", "WALKINGTIME", "WALKINGDISTANCE",
                                   "TRUCKINGTIME", "TRUCKINGDISTANCE")
    ## for next release add or update these error codes
    ##100142 : u"{zeroLengthRouteCount} out of {totalRouteCount} routes were excluded from the output routes layer. The route origins were in the same locations as their paired destinations, so a route line could not connect them.",
    ##100143 : u"One route was excluded from the output routes layer. Its origin was in the same location as its paired destination, so a route line could not connect them.",

    ROUTE_LAYER_ITEM_ID_FIELD_NAME = "RouteLayerItemID"
    ROUTE_LAYER_ITEM_URL_FIELD_NAME = "RouteLayerItemURL"

    def __init__(self, origins_layer, destinations_layer, measurement_type, origins_layer_route_id,
                 destinations_layer_route_id, time_of_day, time_zone, output_workspace="in_memory",
                 output_routes_name="Routes", output_unassigned_origins_name="UnassignedOrigins",
                 output_unassigned_destinations_name="UnassignedDestinations", routing_utils_tbx=None,
                 include_route_layers=False, directions_language="en", point_barrier_layer=None,
                 line_barrier_layer=None, polygon_barrier_layer=None, route_shape="FollowStreets"):
        
        self.originsLayer = LayerInfo(origins_layer)
        if not self.originsLayer.name:
            self.originsLayer.name = "Origins Layer" 
        self.destinationsLayer = LayerInfo(destinations_layer)
        if not self.destinationsLayer.name:
            self.destinationsLayer.name = "Destinations Layer"
        self.measurementType = "STRAIGHTLINE" if measurement_type.upper() == "STRAIGHTLINE" else measurement_type
        self.originsLayerRouteID = str(origins_layer_route_id) if origins_layer_route_id else None
        self.destinationsLayerRouteID = str(destinations_layer_route_id) if destinations_layer_route_id else None
        self.timeOfDay = time_of_day
        self.timeZone = time_zone
        self.includeRouteLayers = include_route_layers
        self.pointBarrierLayer = LayerInfo(point_barrier_layer)
        self.lineBarrierLayer = LayerInfo(line_barrier_layer)
        self.polygonBarrierLayer = LayerInfo(polygon_barrier_layer)
        self.outputWorkspace = output_workspace
        self.outputRoutes = os.path.join(self.outputWorkspace, output_routes_name)
        self.outputStops = arcpy.CreateUniqueName("temp", self.outputWorkspace)
        self.outputUnassignedOrigins = os.path.join(self.outputWorkspace, output_unassigned_origins_name)
        self.outputUnassignedDestinations = os.path.join(self.outputWorkspace, output_unassigned_destinations_name)
        self.routeData = None
        self.directionsLanguage = directions_language
        self.routeShape = route_shape.upper()  # Can be FollowStreets or StraightLine
        self.unassignedOriginsCount = 0
        self.unassignedDestinationsCount = 0
        self.outputRoutesCount = 0
        self.coincidentODPairOIDs = []
        self.coincidentODPairCount = 0
        self.coincidentOriginCount = 0
        self.coincidentDestinationCount = 0
        self.routingUtilsTbx = routing_utils_tbx
        self.errorFunc = arcpy.AddError
        self.warningFunc = arcpy.AddWarning
        self.spOIDFieldName = "ORIG_FID"
        self.problemType = ""  # Can be OneToMany, ManyToOne, OneToOne, MultipleOneToMany, MultipleManyToOne
        #By default all outputs are created in the spatial reference of the origins layer.
        self.tool_limits = {}
        #The callers can provide a different spatial reference for outputs.
        self.outputCoordinateSystem = self.originsLayer.describe.spatialReference
        self.DEBUG = False

    def _addError(self, msg_code, msg, msg_params=None, is_warning=False):
        '''Adds the error message and raises arcpy.ExecuteError exception. self.errorFunc function is used to add the
        error message. if error function is arcpy.AddError only add the msg.'''

        error_func_name = self.errorFunc.__name__
        error_func = self.errorFunc
        if is_warning:
            error_func_name = self.warningFunc.__name__
            error_func = self.warningFunc

        if hasattr(arcpy, error_func_name):
            error_func(msg.replace("$", ""))
        else:
            error_func(msg_code, msg, msg_params, is_warning)
        if not is_warning:
            raise arcpy.ExecuteError

    def _validateInputs(self):
        '''validate the inputs to make sure we satisfy all the conditions to successfully call the
        remote service.'''

        #Get the tool limits from routing utlities service if available in the portal. Default is the limits imposed
        #by online services
        MAX_STOPS_COUNT = 10000
        if self.routingUtilsTbx:
            arcpy.AddMessage("Getting tool limits from {0}".format(self.routingUtilsTbx))
            tool_limits = get_tool_limits(self.routingUtilsTbx, "asyncRoute", "FindRoutes")
            self.tool_limits = tool_limits
            if "maximumStops" in tool_limits:
                max_stops = tool_limits["maximumStops"]
                if max_stops is None:
                    MAX_STOPS_COUNT = INFINITY
                else:
                    MAX_STOPS_COUNT = max_stops
        arcpy.AddMessage("Max stop count: {0}".format(MAX_STOPS_COUNT))
        MAX_STOP_PAIRS = MAX_STOPS_COUNT / 2

        #Check if the origins layer has point geometry
        if not self.originsLayer.describe.shapeType.lower() in POINT_SHAPE_TYPES:
            msg_params = dict(startLayer=self.originsLayer.name)
            msg_code = 100072
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)

        #Check if the destinations layer has point geometry
        if not self.destinationsLayer.describe.shapeType.lower() in POINT_SHAPE_TYPES:
            msg_params = dict(startLayer=self.destinationsLayer.name)
            msg_code = 100072
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)

        # Check shape type of barrier layer
        self._checkBarrierShapeType()
        # Fail if barriers are specified when using line distance
        if self.measurementType == "STRAIGHTLINE":
            for barrier_type in ("pointBarrierLayer", "lineBarrierLayer", "polygonBarrierLayer"):
                if getattr(getattr(self, barrier_type), "count"):
                    msg_params = dict(barrierType=barrier_type)
                    msg_code = 100263
                    msg = self.ERROR_CODES[msg_code].format(**msg_params)
                    self._addError(msg_code, msg, msg_params)
    
        #Check if we don't have more than the number of stops supported by the remote service
        #Origins and destinations layer cannot have more than MAX_STOP_PAIRS features
        if self.originsLayer.count > MAX_STOP_PAIRS:
            msg_params = dict(max=MAX_STOP_PAIRS, startLayer=self.originsLayer.name)
            msg_code = 100069
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)
        if self.destinationsLayer.count > MAX_STOP_PAIRS:
            msg_params = dict(max=MAX_STOP_PAIRS, startLayer=self.destinationsLayer.name)
            msg_code = 100069
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)

        #originsLayerRouteID field must exist if specified
        #Perform a case insensitive check if the originsLayerRouteID field exists.
        #If the field exists, set the field name to be with appropriate case as found on the layer 
        if self.originsLayerRouteID:
            origins_layer_route_id = get_field_from_layer(self.originsLayerRouteID, self.originsLayer)
            if origins_layer_route_id:
                self.originsLayerRouteID = origins_layer_route_id
            else:
                msg_params = dict(inputLayer=self.originsLayer.name, fieldName=self.originsLayerRouteID)
                msg_code = 100087
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)

        #destinationsLayerRouteID field must exist if specified
        #Perform a case insensitive check if the destinationsLayerRouteID field exists.
        #If the field exists, set the field name to be with appropriate case as found on the layer 
        if self.destinationsLayerRouteID:
            destination_layer_route_id = get_field_from_layer(self.destinationsLayerRouteID, self.destinationsLayer)
            if destination_layer_route_id:
                self.destinationsLayerRouteID = destination_layer_route_id
            else:
                msg_params = dict(inputLayer=self.destinationsLayer.name, fieldName=self.destinationsLayerRouteID)
                msg_code = 100087
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)

        ##Perform checks that are applicable when both origins and destinations have more than one feature
        if self.originsLayer.count > 1 and self.destinationsLayer.count > 1:
            #originsLayerRouteIDField parameter is required
            if not self.originsLayerRouteID:
                msg_params = dict(parameterName="originsLayerRouteIDField")
                msg_code = 100137
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)

            #destinationsLayerRouteIDField parameter is required
            if not self.destinationsLayerRouteID:
                msg_params = dict(parameterName="destinationsLayerRouteIDField")
                msg_code = 100137
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)
            
            #Origins layer and destinations layer must have same number of features
            # if self.originsLayer.count != self.destinationsLayer.count:
            #     msg_params = dict(endLayer=self.destinationsLayer.name, startLayer=self.originsLayer.name)
            #     msg_code = 100095
            #     msg = self.ERROR_CODES[msg_code].format(**msg_params)
            #     self._addError(msg_code, msg, msg_params)

        ##Check if the measurement type is a valid travel mode when finding routes
        if self.measurementType != "STRAIGHTLINE":
            try:
                travel_mode_object = get_travel_mode_from_json(self.measurementType)
            except (ValueError, TypeError) as ex:
                if not self.measurementType.upper() in self.LEGACY_TRAVEL_MODE_KEYWORDS:
                    msg_params = {"travelMode" : self.measurementType}
                    msg_code = 100145
                    msg = self.ERROR_CODES[msg_code].format(**msg_params)
                    self._addError(msg_code, msg, msg_params)

        ##Check that the IncludeRouteLayers is not true when measurement type is STRAIGHTLINE
        if self.measurementType == "STRAIGHTLINE" and self.includeRouteLayers:
             msg_code = 100218
             msg = self.ERROR_CODES[msg_code]
             self._addError(msg_code, msg)
                      
    def _preprocessInputs(self):
        '''Use the validated inputs to prepare the inputs in the format required by the remote service.
        Preparing inputs does things like create the stop pairs layer'''
        
        self._validateInputs()

        #Set the output coordinate system for all GP functions that create feature classes
        arcpy.env.outputCoordinateSystem = self.outputCoordinateSystem

        ##Variables used in this function
        route_name_field = "RouteName"
        route_name_field_max_length = 1024
        stop_pair_name_field = "Name"
        stop_pair_name_field_max_length = 500
        sp_insert_cursor_fields = ("SHAPE@", route_name_field, stop_pair_name_field, self.spOIDFieldName)
        ##Create the stop pairs feature class
        #Create an empty depots feature class in the same spatial reference as the origins layer and add 
        #Name and RouteName fields
        self.stopPairs = arcpy.CreateUniqueName("InputPairs", self.outputWorkspace)
        arcpy.management.CreateFeatureclass(self.outputWorkspace, os.path.basename(self.stopPairs), "POINT",
                                            spatial_reference=self.originsLayer.describe.spatialReference)
        #Field length for Name or RouteName field cannot be greater than 128.
        #Using 62 as field length for name field so that we can construct route name field from name field
        #using "name - name"
        arcpy.management.AddField(self.stopPairs, stop_pair_name_field, "TEXT",
                                  field_length=stop_pair_name_field_max_length)
        arcpy.management.AddField(self.stopPairs, route_name_field, "TEXT", field_length=route_name_field_max_length)
        arcpy.management.AddField(self.stopPairs, self.spOIDFieldName, "LONG")

        #Origins and Destinations layer can have the following stop pairs based on feature counts
        # one to many --> results in destination count * 2 stop pairs
        # many to one --> results in origin count * 2 stop pairs
        # many to many with origin count equal to destination count --> results in origin count stop pairs

        #originsLayerRouteID and destinationsLayerRouteID fields are not required when there is one origin or one
        #destination. If provided even when not required, use them to construct RouteName field otherwise use 
        #OIDs to construct RouteName field. The origin and destination OIDs are used as stop names and later populated
        #as OriginOID and DestinationOID in output routes
        if self.originsLayerRouteID:
            origins_layer_cursor_fields = ("SHAPE@", self.originsLayerRouteID, "OID@")
        else:
            if self.measurementType == "STRAIGHTLINE":
                 origins_layer_cursor_fields = ("SHAPE@", "OID@")
            else:
                # Check if origins layer has a field called Name
                # origins_layer_name_field = get_field_from_layer("Name", self.originsLayer, True)
                origins_layer_name_field = check_well_known_fields(self.originsLayer)
                # Use the name field only if its length is not greater than the max supported.
                if origins_layer_name_field: # and origins_layer_name_field.length <= stop_pair_name_field_max_length:
                    origins_layer_cursor_fields = ("SHAPE@", origins_layer_name_field.name, "OID@")
                else:    
                    origins_layer_cursor_fields = ("SHAPE@", "OID@")
        if self.destinationsLayerRouteID:
            destinations_layer_cursor_fields = ("SHAPE@", self.destinationsLayerRouteID, "OID@")
        else:
            if self.measurementType == "STRAIGHTLINE":
                destinations_layer_cursor_fields = ("SHAPE@", "OID@")
            else:
                # Check if the destinations layer has a field called Name
                # dest_layer_name_field = get_field_from_layer("Name", self.destinationsLayer, True)
                dest_layer_name_field = check_well_known_fields(self.destinationsLayer)
                if dest_layer_name_field: # and dest_layer_name_field.length <= stop_pair_name_field_max_length:
                    destinations_layer_cursor_fields = ("SHAPE@", dest_layer_name_field.name, "OID@")
                else:
                    destinations_layer_cursor_fields = ("SHAPE@", "OID@")
        # Origin or destination count can be 1 in multiple one to many or many to one cases due to the current map extent.
        # But RouteID fields are not passed for one to many and many to one cases
        if (self.originsLayer.count == 1 or self.destinationsLayer.count == 1) and not (self.originsLayerRouteID and self.destinationsLayerRouteID):
            with arcpy.da.InsertCursor(self.stopPairs, sp_insert_cursor_fields) as stop_pairs_cursor:
                if self.originsLayer.count == 1:
                    self.problemType = "OneToMany"
                    with arcpy.da.SearchCursor(self.originsLayer.layer, origins_layer_cursor_fields, "",
                                               self.originsLayer.describe.spatialReference) as origins_cursor:
                        origin_row = next(origins_cursor)
                    with arcpy.da.SearchCursor(self.destinationsLayer.layer,  destinations_layer_cursor_fields, "",
                                               self.originsLayer.describe.spatialReference) as destinations_cursor:
                        for row_id, destination_row in enumerate(destinations_cursor):
                            origin_name = origin_row[1]
                            destination_name = destination_row[1]
                            # Make route names unique to avoid generating routes with more than two stops
                            route_name = "Route {0} - {1} - {2}".format(row_id + 1, origin_name, destination_name)
                            #Do not add coincident origin destination pair
                            #But keep track of coincident origin and destination OIDS
                            #Equals check on shape can raise ValueError in case of bad geometry. Sojust skip 
                            #such points
                            try:
                                if origin_row[0].equals(destination_row[0]):
                                    self.coincidentODPairOIDs.append((origin_row[-1], destination_row[-1]))
                                    self.coincidentDestinationCount += 1
                                else:
                                    stop_pairs_cursor.insertRow((origin_row[0], route_name, origin_row[1], origin_row[-1]))
                                    stop_pairs_cursor.insertRow((destination_row[0], route_name, destination_row[1], destination_row[-1]))
                            except Exception as ex:
                                #deduct from input destinations count as we don't want to create unassigned features 
                                #for bad input geometries
                                self.destinationsLayer.count -= 1
                                continue

                else:
                    self.problemType = "ManyToOne"
                    with arcpy.da.SearchCursor(self.destinationsLayer.layer, destinations_layer_cursor_fields, "",
                                               self.originsLayer.describe.spatialReference) as destinations_cursor:
                        destination_row = next(destinations_cursor)
                    with arcpy.da.SearchCursor(self.originsLayer.layer, origins_layer_cursor_fields, "",
                                               self.originsLayer.describe.spatialReference) as origins_cursor:
                        for row_id, origin_row in enumerate(origins_cursor):
                            origin_name = origin_row[1]
                            destination_name = destination_row[1]
                            # Make route names unique to avoid generating routes with more than two stops
                            route_name = "Route {0} - {1} - {2}".format(row_id + 1, origin_name, destination_name)
                            #Do not add coincident origin destination pair
                            #But keep track of coincident origin and destination OIDS 
                            #Equals check on shape can raise ValueError in case of bad geometry. Sojust skip 
                            #such points
                            try:
                                if destination_row[0].equals(origin_row[0]):
                                    self.coincidentODPairOIDs.append((origin_row[-1], destination_row[-1]))
                                    self.coincidentOriginCount += 1
                                else:
                                    stop_pairs_cursor.insertRow((origin_row[0], route_name, origin_row[1], origin_row[-1]))
                                    stop_pairs_cursor.insertRow((destination_row[0], route_name, destination_row[1], destination_row[-1]))
                            except Exception as ex:
                                #deduct from input origins count as we don't want to create unassigned features 
                                #for bad input geometries
                                self.originsLayer.count -= 1
                                continue 
        else:
            if self.originsLayer.count == self.destinationsLayer.count:
                self.problemType = "OneToOne"
                #Store origin and destination route IDs and shapes in a dict
                #Fail with route ids are not unique
                origin_shapes = self._shapesAsDict(self.originsLayer, origins_layer_cursor_fields)
                destination_shapes = self._shapesAsDict(self.destinationsLayer, destinations_layer_cursor_fields)

                #we need to match each origin route id to exactly one destination route id. Fail if the origin route ids 
                #are not identical to destination route ids
                origin_route_ids = set(origin_shapes.keys())
                destination_route_ids = set(destination_shapes.keys()) 
                if origin_route_ids != destination_route_ids:
                    msg_params = dict(startLayerRouteIDField=self.originsLayerRouteID, startLayer=self.originsLayer.name,
                                    endLayerRouteIDField=self.destinationsLayerRouteID, 
                                    endLayer=self.destinationsLayer.name)
                    msg_code = 100098
                    msg = self.ERROR_CODES[msg_code].format(**msg_params)
                    self._addError(msg_code, msg, msg_params)
                #Create route pairs
                with arcpy.da.InsertCursor(self.stopPairs, sp_insert_cursor_fields) as stop_pairs_cursor:
                    for origin_id in origin_shapes:
                        origin_row = origin_shapes[origin_id]
                        destination_row = destination_shapes[origin_id]
                        #Do not add coincident origin destination pair
                        #But keep track of coincident origin and destination OIDS
                        #Equals check on shape can raise ValueError in case of bad geometry. So just skip such points
                        try:
                            if origin_row[0].equals(destination_row[0]):
                                self.coincidentODPairOIDs.append((origin_row[-1], destination_row[-1]))
                                self.coincidentOriginCount += 1
                                self.coincidentDestinationCount += 1
                            else: 
                                stop_pairs_cursor.insertRow((origin_row[0], origin_id, origin_row[1], origin_row[-1]))
                                stop_pairs_cursor.insertRow((destination_row[0], origin_id, destination_row[1], destination_row[-1]))
                        except Exception as ex:
                            #deduct from input origins count and input destinations count as we don't want to create 
                            #unassigned features for bad input geometries
                            self.destinationsLayer.count -= 1
                            self.originsLayer.count -= 1
                            continue
            else:
                # Each origin can connect to multiple destinations and vice versa based on originsLayerRouteID and 
                # destinationsLayerRouteID fields.
                # Determine if the origins have unique route ids or destinations have unique route ids
                with arcpy.da.SearchCursor(self.originsLayer.layer, self.originsLayerRouteID) as cursor:
                    origin_routeid_counter = Counter(row[0] for row in cursor)
                with arcpy.da.SearchCursor(self.destinationsLayer.layer, self.destinationsLayerRouteID) as cursor:
                    dest_routeid_counter = Counter(row[0] for row in cursor)
                # Fail if either origins or destinations have null route IDs
                if origin_routeid_counter[None] or origin_routeid_counter[""]:
                    msg_params = dict(fieldName=self.originsLayerRouteID, analysisLayer=self.originsLayer.name)
                    msg_code = 100271
                    msg = self.ERROR_CODES[msg_code].format(**msg_params)
                    self._addError(msg_code, msg, msg_params)
                if dest_routeid_counter[None] or dest_routeid_counter[""]:
                    msg_params = dict(fieldName=self.destinationsLayerRouteID, analysisLayer=self.destinationsLayer.name)
                    msg_code = 100271
                    msg = self.ERROR_CODES[msg_code].format(**msg_params)
                    self._addError(msg_code, msg, msg_params)
                # Either origin route ids or destination route ids must be unique
                origin_routeid_freq = origin_routeid_counter.most_common(1)[0][1]
                dest_routeid_freq = dest_routeid_counter.most_common(1)[0][1]
                if origin_routeid_freq > 1 and dest_routeid_freq > 1:
                    msg_params = dict(startLayerRouteIDField=self.originsLayerRouteID, startLayer=self.originsLayer.name,
                                      endLayerRouteIDField=self.destinationsLayerRouteID, endLayer=self.destinationsLayer.name)
                    msg_code = 100272
                    msg = self.ERROR_CODES[msg_code].format(**msg_params)
                    self._addError(msg_code, msg, msg_params)
                # We need to match all the destinations with the corresponding origin route ids since we have unique
                # origin route ids
                if origin_routeid_freq == 1:
                    self.problemType = "MultipleOneToMany"
                    origin_shapes = self._shapesAsDict(self.originsLayer, origins_layer_cursor_fields)
                    with arcpy.da.InsertCursor(self.stopPairs, sp_insert_cursor_fields) as stop_pairs_cursor:
                        with arcpy.da.SearchCursor(self.destinationsLayer.layer, destinations_layer_cursor_fields) as cursor:
                            for dest_row in cursor:
                                route_id = dest_row[1]
                                try:
                                    origin_row = origin_shapes[route_id]
                                except KeyError:
                                    msg_params = dict(routeId=route_id,
                                                      routeIDField=self.destinationsLayerRouteID,
                                                      startLayer=self.destinationsLayer.name,
                                                      endLayer=self.originsLayer.name)
                                    msg_code = 100273
                                    msg = self.ERROR_CODES[msg_code].format(**msg_params)
                                    self._addError(msg_code, msg, msg_params)

                                route_name = f"{origin_row[1]} - {dest_row[2]}" # OriginOID - DestinationOID                                 
                                # Do not add coincident origin destination pair and mark the destination as unassigned 
                                # Equals check on shape can raise ValueError in case of bad geometry. So just skip such 
                                # destination points
                                try:
                                    is_dest_same_as_origin = dest_row[0].equals(origin_row[0])
                                except Exception:
                                    # deduct from input destinations count as we don't want to create unassigned 
                                    # features for bad input geometries
                                    self.destinationsLayer.count -= 1
                                    continue
                                if is_dest_same_as_origin:
                                    self.coincidentODPairOIDs.append((origin_row[-1], dest_row[-1]))
                                    self.coincidentDestinationCount += 1
                                else:
                                    stop_pairs_cursor.insertRow((origin_row[0], route_name, origin_row[1], origin_row[1]))
                                    stop_pairs_cursor.insertRow((dest_row[0], route_name, dest_row[2], dest_row[2]))
                # we need to match all the origin route ids with the corresponding destination route ids since we have
                # unique destination ids
                if dest_routeid_freq == 1:
                    self.problemType = "MultipleManyToOne"
                    dest_shapes = self._shapesAsDict(self.destinationsLayer, destinations_layer_cursor_fields)
                    with arcpy.da.InsertCursor(self.stopPairs, sp_insert_cursor_fields) as stop_pairs_cursor:
                        with arcpy.da.SearchCursor(self.originsLayer.layer, origins_layer_cursor_fields) as cursor:
                            for origin_row in cursor:
                                route_id = origin_row[1]
                                try:
                                    dest_row = dest_shapes[route_id]
                                except KeyError:
                                    msg_params = dict(routeId=route_id,
                                                      routeIDField=self.originsLayerRouteID,
                                                      startLayer=self.originsLayer.name,
                                                      endLayer=self.destinationsLayer.name)
                                    msg_code = 100273
                                    msg = self.ERROR_CODES[msg_code].format(**msg_params)
                                    self._addError(msg_code, msg, msg_params)

                                route_name = f"{origin_row[2]} - {dest_row[1]}"  # OriginOID - DestinationOID
                                # Do not add coincident origin destination pair and mark the origin as unassigned 
                                # Equals check on shape can raise ValueError in case of bad geometry. So just skip such 
                                # origin points
                                try:
                                    is_origin_same_as_dest = origin_row[0].equals(dest_row[0])
                                except Exception:
                                    # deduct from input origins count as we don't want to create unassigned 
                                    # features for bad input geometries
                                    self.originsLayer.count -= 1
                                    continue
                                if is_origin_same_as_dest:
                                    self.coincidentODPairOIDs.append((origin_row[-1], dest_row[-1]))
                                    self.coincidentOriginCount += 1
                                else:
                                    stop_pairs_cursor.insertRow((origin_row[0], route_name, origin_row[2], origin_row[2]))
                                    stop_pairs_cursor.insertRow((dest_row[0], route_name, dest_row[1], dest_row[1])) 

        self.coincidentODPairCount = len(self.coincidentODPairOIDs)
        #Fail if we have zero stop pairs. This can happen if all origins are coincident with destinations or if
        #all origins or all destinations have bad geometry.
        stop_pairs_count = int(arcpy.management.GetCount(self.stopPairs).getOutput(0))
        #if max(self.originsLayer.count, self.destinationsLayer.count) == self.coincidentODPairCount:
        if not stop_pairs_count:
            self._addError(100139, self.ERROR_CODES[100139])

    def _shapesAsDict(self, layer, cursor_fields):
        '''returns a dict with keys as IDs and values as shapes in the spatial reference of origins layer'''
        
        #Store the OID of the feature along with shape
        #cursor_fields = cursor_fields + ("OID@", )
        with arcpy.da.SearchCursor(layer.layer, cursor_fields,"", self.originsLayer.describe.spatialReference) as cursor:        
            shapes = {row[1]: (row[0], row[2]) for row in cursor}

        #Fail if RouteIDField values are not unique
        if len(shapes) != layer.count:
            msg_params = dict(startLayerRouteIDField=cursor_fields[1], startLayer=layer.name)
            msg_code = 100096
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)
        return shapes

    def _connectUsingStraightLineDistance(self):
        '''use the preprocessed stop pairs and connect them using straight line distance. Do all the post-processing
        of outputs so that the output can match when using travel time or travel distance.'''
        #Each pair stors RouteName as key and a list [[origin shape, destination shape], [origin OID, destination OID]]
        self.routeShape = "STRAIGHTLINE"
        pairs = {}
        with arcpy.da.SearchCursor(self.stopPairs, ("SHAPE@", "RouteName", "Name"), "", 
                                   self.originsLayer.describe.spatialReference) as pairs_cursor:
            for row in pairs_cursor:
                if row[1] in pairs:
                    row_value = pairs[row[1]]
                    row_value[0].append(row[0].firstPoint)
                    row_value[1].append(row[2])
                else:
                    row_value = [[row[0].firstPoint], [row[2]]]
                pairs[row[1]] = row_value 

        #Create output lines feature class
        arcpy.management.CreateFeatureclass(self.outputWorkspace, os.path.basename(self.outputRoutes), "POLYLINE",
                                            spatial_reference=self.originsLayer.describe.spatialReference)
        #Add fields
        arcpy.management.AddField(self.outputRoutes, "RouteName", "TEXT", field_length=128, field_alias="Route Name")
        arcpy.management.AddField(self.outputRoutes, "Total_Miles", "Double", 
                                  field_alias="Straight Line Distance (Miles)")
        arcpy.management.AddField(self.outputRoutes, "Total_Kilometers", "Double",
                                  field_alias="Straight Line Distance (Kilometers)")
        arcpy.management.AddField(self.outputRoutes, "OriginOID", "LONG", field_alias="Origin ID")
        arcpy.management.AddField(self.outputRoutes, "DestinationOID", "LONG", field_alias="Destination ID")

        #Populate output lines feature class
        route_count = 0
        with arcpy.da.InsertCursor(self.outputRoutes, ("SHAPE@", "RouteName", "Total_Miles", "Total_Kilometers",
                                                       "OriginOID", "DestinationOID")) as output_lines_cursor:
            for route_id in pairs:
                pair = pairs[route_id]
                line_shape = arcpy.Polyline(arcpy.Array(pair[0]), self.originsLayer.describe.spatialReference)
                distance_miles = line_shape.getLength("GEODESIC", "MILES")
                distance_kilometers = distance_miles * 1.6093
                # Densify lines longer than 1,000 miles so that they look like curved lines
                if distance_miles > 1000:
                    densified_shape = line_shape.densify("GEODESIC", distance_kilometers * 0.1, 1)
                else:
                    densified_shape = line_shape
                origin_oid, destination_oid = pair[1]
                route_count += 1
                output_lines_cursor.insertRow((densified_shape, route_id, distance_miles, distance_kilometers,
                                              origin_oid, destination_oid))
        self.outputRoutesCount = route_count

        #Transfer fields from origins and destinations to output routes
        self._transferFields(self.originsLayer, "From", "OriginOID")
        self._transferFields(self.destinationsLayer, "To", "DestinationOID")

        #Add any coincident origins and destinations as unassigned origins and unassigned destinations
        if self.coincidentODPairOIDs:
            #Add a warning that there are some unassigned origins and destination
            self._addError(100138, self.ERROR_CODES[100138], is_warning=True)
            if self.originsLayer.count == 1:
                #create unassigned destinations only
                self._createCoincidentUnassignedFeatures("DESTINATION")
                self.outputUnassignedOrigins = ""
            elif self.destinationsLayer.count == 1:
                #create unassigned origins only
                self._createCoincidentUnassignedFeatures("ORIGIN")
                self.outputUnassignedDestinations = ""
            else:
                #create unassigned origins and unassigned destinations
                self._createCoincidentUnassignedFeatures("ORIGIN")
                self._createCoincidentUnassignedFeatures("DESTINATION")
        else:
            self.outputUnassignedOrigins = ""
            self.outputUnassignedDestinations = ""

    def _transferFields(self, source_layer_info, source_field_name_prefix, destination_join_field):
        '''Transfers fields from source to destination ensuring the field names and field alias on destination 
        have a specified format'''

        #Make a copy of the source feature and rename fields and set field aliases
        field_mappings = arcpy.FieldMappings()
        field_mappings.addTable(source_layer_info.layer)
        source_field_maps = []
        transfer_field_names = []
        for field_map in field_mappings.fieldMappings:
            output_field = field_map.outputField
            #Skip GUID fields as they are invalid with JoinField tool.
            if output_field.type.lower() in ("globalid", "guid"):
                #arcpy.AddMessage("Skipping {0} field of type {1}".format(output_field.name, output_field.type))
                continue
            new_field_name = "{0}_{1}".format(source_field_name_prefix, output_field.name)
            output_field.name = new_field_name
            output_field.aliasName = "{0}: {1}".format(source_layer_info.name, output_field.aliasName)
            # some times we can have text fields of length zero which cause error when writing rows
            # so change the length to 256 for such fields.
            if output_field.length == 0 and output_field.type.lower() in ("string", "text"):
                output_field.length = 256
            field_map.outputField = output_field
            transfer_field_names.append(new_field_name)
            source_field_maps.append(field_map)

        #transfer the OID field from source as ORIG_FID
        source_layer_field_names = [fld.name for fld in source_layer_info.describe.fields]
        oid_field_name = get_unique_field_name("ORIG_FID", source_layer_field_names)
        fm_oid = arcpy.FieldMap()
        fm_oid.addInputField(source_layer_info.layer, source_layer_info.describe.oidFieldName)
        oid_field = fm_oid.outputField
        oid_field.name = oid_field_name
        oid_field.type = "LONG"
        oid_field.aliasName = "ORIG FID"
        fm_oid.outputField = oid_field

        #field_mappings.fieldMappings = source_field_maps
        source_field_mappings = arcpy.FieldMappings()
        for fm in source_field_maps:
            source_field_mappings.addFieldMap(fm)
        source_field_mappings.addFieldMap(fm_oid)
        source_features_copy = arcpy.CreateUniqueName("temp", self.outputWorkspace)
        try:
            arcpy.conversion.FeatureClassToFeatureClass(source_layer_info.layer, self.outputWorkspace,
                                                        os.path.basename(source_features_copy),
                                                        field_mapping=source_field_mappings)
        except arcpy.ExecuteError as ex:
            # In case feature class to feature class fails when writing to in_memory workspace, write the result to
            # file geodatabase
            arcpy.AddMessage("Failed to write '{}' to {} workspace".format(source_layer_info.name, self.outputWorkspace))
            arcpy.AddMessage("Exception details: {}".format(ex))
            arcpy.AddMessage("Trying to save to {} workspace".format(arcpy.env.scratchGDB))
            source_features_copy = arcpy.CreateUniqueName("temp", arcpy.env.scratchGDB)
            arcpy.conversion.FeatureClassToFeatureClass(source_layer_info.layer, arcpy.env.scratchGDB,
                                                        os.path.basename(source_features_copy),
                                                        field_mapping=source_field_mappings)
        #Join fields based on destination join field and ObjectID field from source
        arcpy.management.JoinField(self.outputRoutes, destination_join_field, source_features_copy, oid_field_name,
                                   transfer_field_names)

    def _createUnassignedFeatures(self, source_layer_info, unassigned_feature_class, id_field_name):
        '''Creates unassigned features in a new feature class. Transfer from source features and a populate the status
        field.
        :param: source_layer_info: Layer info object for input origins or input destinations.
        :param: unassigned_feature_class: Catalog path for the output unassigned feature class.
        :param: id_field_name: Field name (such as OriginOID or DestinationOID) in output routes that contain the
        source OIDs 
        '''

        stops_status = {
            0 : "Ok",
            1: "Not located",
            4: "Invalid field values or empty geometry",
            5: "Not reached",
            7: "Not located on closest",
        }
        status_field_name = "Status"
        coincident_oids = tuple()

        #For feature collections as input, we get source_layer_info as in memory feature class whose name is a GUID
        #and that is causing the feature class to feature class tool to fail if run with features that have a join and
        #if there is an extent specified. As a quick fix, lets convert such inputs to in_memory inputs where the 
        #name is not a GUID
        #This fails even when not using the extent. So applying this for all feature collection inputs
        source_layer_catalog_path = source_layer_info.describe.catalogPath
        if os.path.dirname(source_layer_catalog_path) == "in_memory":# and arcpy.env.extent:
            source_layer_base_name = os.path.basename(source_layer_catalog_path)
            if source_layer_base_name.startswith("{") and source_layer_base_name.endswith("}"):
                source_layer_copy = arcpy.CreateUniqueName("temp", self.outputWorkspace)
                arcpy.AddMessage("Making a copy of source layer as {0}".format(source_layer_copy))
                arcpy.management.CopyFeatures(source_layer_info.layer, source_layer_copy)
                source_layer_info = LayerInfo(source_layer_copy) 
       
        #Determine if we are creating unassigned destinations or unassigned origins
        unassigned_feature_type = "Origin" if id_field_name == "OriginOID" else "Destination"
        if unassigned_feature_type == "Origin":
            sequence = 1
            unassigned_status = "Unassigned destination"
            coincident_status = "Same location as destination"
            if self.coincidentODPairCount:
                coincident_oids = tuple([id[0] for id in self.coincidentODPairOIDs])
        else:
            sequence = 2
            unassigned_status = "Unassigned origin"
            coincident_status = "Same location as origin"
            if self.coincidentODPairCount:
                coincident_oids = tuple([id[1] for id in self.coincidentODPairOIDs])
        
        source_oid_field_name = source_layer_info.describe.oidFieldName
        source_shape_field_name = source_layer_info.describe.shapeFieldName
        #join output routes to input 
        arcpy.management.AddJoin(source_layer_info.layer, source_oid_field_name, self.outputRoutes, id_field_name)
        
        #Keep only the source fields and the source OID fields when creating unassigned feature class
        source_field_mappings = arcpy.FieldMappings()
        source_field_mappings.addTable(source_layer_info.layer)
        source_field_names = [field.baseName for field in source_layer_info.describe.fields
                              if not field.name in (source_oid_field_name, source_shape_field_name)]
        remove_field_names = [field.name for field in source_field_mappings.fields
                              if not field.name in source_field_names]
        for field in remove_field_names:
            field_index = source_field_mappings.findFieldMapIndex(field)
            if field_index != -1:
                source_field_mappings.removeFieldMap(field_index)
        #Add the OID field as ORIG_FID
        orig_fid_field_name = get_unique_field_name("ORIG_FID", source_field_names)
        fm_oid = arcpy.FieldMap()
        source_layer_catalog_path = source_layer_info.describe.catalogPath
        source_layer_table_name = os.path.basename(source_layer_catalog_path)
        fm_oid.addInputField(source_layer_info.layer, "{0}.{1}".format(source_layer_table_name, 
                                                                        source_oid_field_name))
        oid_field = fm_oid.outputField
        oid_field.name = orig_fid_field_name
        oid_field.aliasName = "ORIG FID"
        oid_field.type = "LONG"
        fm_oid.outputField = oid_field
        source_field_mappings.addFieldMap(fm_oid)

        #If the source has a field called "Status" rename it to ORIG_Status
        existing_status_field_index = source_field_mappings.findFieldMapIndex(status_field_name)
        if existing_status_field_index != -1:
            fm_status = source_field_mappings.getFieldMap(existing_status_field_index)
            existing_status_field = fm_status.outputField
            existing_status_field.name = get_unique_field_name("ORIG_{0}".format(status_field_name),
                                                               source_field_names)
            existing_status_field.aliasName = "{0} (Original)".format(existing_status_field.aliasName)
            fm_status.outputField = existing_status_field
            source_field_mappings.replaceFieldMap(existing_status_field_index, fm_status)

        #Check if we also have coincident features
        where_clause = "{0}.{1} IS NULL".format(os.path.basename(self.outputRoutes), id_field_name)
        coincident_where_clause = ""
        if coincident_oids:
            if len(coincident_oids) == 1:
                coincident_where_clause = "{0}.{1} IN ({2})".format(source_layer_table_name, source_oid_field_name,
                                                                     coincident_oids[0])
            else:
                coincident_where_clause = "{0}.{1} IN {2}".format(source_layer_table_name, source_oid_field_name,
                                                                     coincident_oids)
        if coincident_where_clause:
            where_clause = "{0} OR {1}".format(where_clause, coincident_where_clause)

        #arcpy.AddMessage(where_clause)
        arcpy.conversion.FeatureClassToFeatureClass(source_layer_info.layer, self.outputWorkspace,
                                                    os.path.basename(unassigned_feature_class), where_clause,
                                                    source_field_mappings)
        
        arcpy.management.RemoveJoin(source_layer_info.layer)

        #Add and populate the status field
        arcpy.management.AddField(unassigned_feature_class,status_field_name, "TEXT", field_length=30,
                                  field_alias=status_field_name)
        sequence = 1 if  unassigned_feature_type == "Origin" else 2
        where_clause = "Sequence = {0} AND Status <> 0".format(sequence)
        with arcpy.da.SearchCursor(self.outputStops, ("Name", "Status"), where_clause) as output_stops_cursor:
            status_values = {int(row[0]):row[1] for row in output_stops_cursor}
        #Store the number of unassigned features
        unassigned_feature_class_count = int(arcpy.management.GetCount(unassigned_feature_class).getOutput(0))
        if sequence == 1:
            self.unassignedOriginsCount += unassigned_feature_class_count
        else:
            self.unassignedDestinationsCount += unassigned_feature_class_count
        with arcpy.da.UpdateCursor(unassigned_feature_class, (orig_fid_field_name, status_field_name)) as cursor:
            for row in cursor:
                status_value = status_values.get(row[0], -1)
                if status_value in stops_status:
                    str_status_value = stops_status[status_value]
                    cursor.updateRow((row[0], str_status_value))
                elif row[0] in coincident_oids:
                    cursor.updateRow((row[0], coincident_status))
                else:
                    cursor.updateRow((row[0], unassigned_status))

        #Delete the OIRG_FID field
        arcpy.management.DeleteField(unassigned_feature_class, orig_fid_field_name)

    def _createCoincidentUnassignedFeatures(self, unassigned_feature_type="ORIGIN"):
        '''Create new unassigned origins and unassigned destinations feature classes and add coincident origins and
        destinations to them. Currently this is called only in StraightLine case. For other measurement methods
        coincident features are handled in _createUnassginedFeatures as there can be unlocated features in addition to
        coincident features.
        :param: unassigned_feature_type: determines if we are creating unassigned origins or unassigned destinations.
        Any value other than ORIGIN will create destinations'''
        
        if not self.coincidentODPairCount:
            return

        #create variables required to create unassigned origins or unassigned destinations
        if unassigned_feature_type == "ORIGIN":
            self.unassignedOriginsCount += self.coincidentODPairCount
            coincident_oids = tuple([id[0] for id in self.coincidentODPairOIDs])
            source_layer_info = self.originsLayer
            output_feature_class = self.outputUnassignedOrigins
            status_value = "Same location as destination"
        else:
            self.unassignedDestinationsCount += self.coincidentODPairCount
            coincident_oids = tuple([id[1] for id in self.coincidentODPairOIDs])
            source_layer_info = self.destinationsLayer
            output_feature_class = self.outputUnassignedDestinations
            status_value = "Same location as origin"

        status_field_name = "Status"
        if len(coincident_oids) == 1:
            expression = "({0})".format(coincident_oids[0])
        else:
            expression = "{0}".format(coincident_oids)
        where_clause = "{0} IN {1}".format(source_layer_info.describe.oidFieldName, expression)
        arcpy.analysis.Select(source_layer_info.layer, output_feature_class, where_clause)
        #Add and populate the Status field
        #If the field already exists, rename the field as ORIG_STATUS
        source_field_names = [field.name for field in source_layer_info.describe.fields]
        existing_status_field = get_field_from_layer(status_field_name, source_layer_info, True)
        if existing_status_field:
            orig_status_field_name = get_unique_field_name("ORIG_{0}".format(status_field_name), 
                                                            source_field_names)
            orig_status_field_alias = "{} (Original)".format(existing_status_field.aliasName)
            arcpy.management.AlterField(output_feature_class, status_field_name, orig_status_field_name,
                                        orig_status_field_alias)
        arcpy.management.AddField(output_feature_class, status_field_name, "TEXT", field_length=30,
                                    field_alias=status_field_name)
        arcpy.management.CalculateField(output_feature_class, status_field_name, "'{0}'".format(status_value),
                                        "PYTHON")

    def execute(self, remote_toolbox):
        '''Use the validated and preprocessed inputs to run the analysis using the remote service. Post process 
        the outputs obtained from calling the remote service into outputs that needs to be returned from
        the tool. Return the output routes, unassigned origins and unassigned destination feature classes'''

        #Set the output coordinate system for all GP functions that create feature classes
        arcpy.env.outputCoordinateSystem = self.outputCoordinateSystem

        with LogExecutionTime("Preprocessed inputs"):
            self._preprocessInputs()

        ##Prepare inputs required to call the route service
        #Derive measurement units and travel mode type based on measurement type
        measurement_type_upper = self.measurementType.upper()
        travel_mode_types = {
            "STRAIGHTLINE" : "Straight Line",
            "DRIVINGTIME" : "Driving",
            "DRIVINGDISTANCE" : "Driving",
            "WALKINGTIME" : "Walking",
            "WALKINGDISTANCE" : "Walking",
            "TRUCKINGTIME" : "Trucking",
            "TRUCKINGDISTANCE" : "Trucking",
            "AUTOMOBILE" : "Driving",
            "TRUCK" : "Trucking",
            "WALK" : "Walking",
            "OTHER" : "Travel",
        }
        travel_mode_type = ""
        travel_mode_dict = {}

        #Determine the mode type based on travel mode type keyword and whether the mode is time or distance based.
        if measurement_type_upper in travel_mode_types:
            travel_mode_type = travel_mode_types[measurement_type_upper]
            travel_mode = travel_mode_type
            measurement_units = "Minutes" if measurement_type_upper.endswith("TIME") else "Miles"
        else:
            travel_mode_dict = json.loads(self.measurementType)
            travel_mode_type = travel_mode_dict.get("type", "Travel")
            travel_mode_type = travel_mode_types.get(travel_mode_type, travel_mode_type)
            travel_mode = self.measurementType
            measurement_units = "Minutes" if travel_mode_dict["impedanceAttributeName"] == travel_mode_dict["timeAttributeName"] else "Miles"
        
        time_zone = "UTC" if self.timeZone == "UTC" else "Geographically Local"
        solve_succeeded = False
        
        try:
            if self.measurementType == "STRAIGHTLINE":
                with LogExecutionTime("Processed inputs using straight line distance"):
                    self._connectUsingStraightLineDistance()
            else:
                #Restrictions are specified as part of travel modes
                arcpy.AddMessage("Adding remote toolbox {0}".format(remote_toolbox))
                route_shape = "True Shape" if self.routeShape == "FOLLOWSTREETS" else "Straight Line"
                populate_directions = False
                populate_route_edges = False
                save_route_data = False
                if self.includeRouteLayers:
                    save_route_data = True
                    populate_directions = True
                    arcpy.AddMessage("Directions language: {0}".format(self.directionsLanguage))
                task_params = [self.stopPairs, measurement_units, "", "", "", "", "", self.timeOfDay, time_zone, "",
                               self.pointBarrierLayer.layer, self.lineBarrierLayer.layer, self.polygonBarrierLayer.layer,
                               "", "#", "", route_shape, "", populate_route_edges, populate_directions,
                               self.directionsLanguage, "", "", travel_mode, "", "", "", "", save_route_data]
                ignore_error_codes = (30109,)
                try:
                    service_result = call_async_gp_service(remote_toolbox, "FindRoutes", task_params, ignore_error_codes)
                except arcpy.ExecuteError as ex:
                    try:
                        remote_msgs = ex.args[0] if ex.args else ""
                        if remote_msgs:
                            if 30145 in remote_msgs:
                                # Walking limit exceeded
                                msg_code = 100258
                                walking_limit = self.tool_limits.get("maximumGeodesicDistanceWhenWalking", 27)
                                walking_limit_unit = self.tool_limits.get("maximumGeodesicDistanceUnitsWhenWalking", "Miles")
                                msg_params = {
                                    "mileValue": convert_units(walking_limit, walking_limit_unit, "Miles"),
                                    "kmValue": convert_units(walking_limit, walking_limit_unit, "Kilometers"),
                                }
                                msg = self.ERROR_CODES[msg_code]
                                self._addError(msg_code, msg, msg_params)
                            if 30095 in remote_msgs:
                                # Barrier limit exceeded
                                self._raiseBarrierLimitError(remote_msgs[30095])
                        else:
                            raise
                    except Exception:
                        raise
                if service_result.getOutput(0).lower() == 'true':
                    solve_succeeded = True

                if solve_succeeded:
                    with LogExecutionTime("Saved the results from remote tool"):
                        #Save the route data and return as when saving route data other feature outputs are not needed
                        if save_route_data:
                            self.routeData = service_result.getOutput(6)
                        #Save the outputs as feature classes and table instead of record sets and feature sets
                        arcpy.management.CopyFeatures(service_result.getOutput(4), self.outputStops)
                        arcpy.management.CopyFeatures(service_result.getOutput(1), self.outputRoutes)
                
                    ##Post process results
                    with LogExecutionTime("Post-processed results"):

                        output_routes_layer = "Output Routes"
                        arcpy.management.MakeFeatureLayer(self.outputRoutes, output_routes_layer)  

                        # Update ORIG_FID field on output stops based on the ORIG_FID field on input stop pairs
                        output_stops_layer = "Output Stops"
                        arcpy.management.MakeFeatureLayer(self.outputStops, output_stops_layer)
                        arcpy.management.AddJoin(output_stops_layer, "Name", self.stopPairs, "Name")
                        arcpy.management.CalculateField(output_stops_layer, "ORIG_FID",
                                                        "!{}.ORIG_FID!".format(os.path.basename(self.stopPairs)),
                                                        "PYTHON")
                        arcpy.management.RemoveJoin(output_stops_layer)

                        #Rename Name field to RouteName
                        arcpy.management.AlterField(self.outputRoutes, "Name", "RouteName", "Route Name")

                        #Add new RouteLayerItemID and RouteLayerItemURL fields that are populated after route layers are
                        #created.
                        arcpy.management.AddField(self.outputRoutes, self.ROUTE_LAYER_ITEM_ID_FIELD_NAME, "TEXT",
                                                  field_length=50, field_alias="Route Layer Item ID")
                        arcpy.management.AddField(self.outputRoutes, self.ROUTE_LAYER_ITEM_URL_FIELD_NAME, "TEXT",
                                                  field_length=256, field_alias="Route Layer Item")

                        #Update alias for fields
                        update_field_alias = {
                            "StartTime" : "Start Time",
                            "EndTime" : "End Time",
                            "StartTimeUTC": "Start Time",
                            "EndTimeUTC": "End Time",
                            "Total_Minutes" : "{0} Time (Minutes)".format(travel_mode_type),
                            "Total_Miles" : "{0} Distance (Miles)".format(travel_mode_type),
                            "Total_Kilometers" : "{0} Distance (Kilometers)".format(travel_mode_type),
                        }
                        output_routes_field_names = [fld.name for fld in arcpy.ListFields(output_routes_layer)]
                        for fld in update_field_alias:
                            if fld in output_routes_field_names:
                                arcpy.management.AlterField(self.outputRoutes, fld, fld, update_field_alias[fld])

                        self.outputRoutesCount = int(arcpy.management.GetCount(self.outputRoutes).getOutput(0))

                        #Add and populate OriginOID and DestinationOID fields on output routes
                        out_routes_origin_id_field = "OriginOID"
                        out_routes_destination_id_field = "DestinationOID"
                        arcpy.management.AddField(self.outputRoutes, out_routes_origin_id_field, "LONG",
                                                  field_alias="Origin ID")
                        arcpy.management.AddField(self.outputRoutes, out_routes_destination_id_field, "LONG",
                                                  field_alias="Destination ID")
                                              
                        
                        desc_output_stops = arcpy.Describe(output_stops_layer)
                        output_stops_oid_field = desc_output_stops.oidFieldName
                        join_fields = {
                            "FirstStopOID" : out_routes_origin_id_field,
                            "LastStopOID" : out_routes_destination_id_field
                        }
                        expression = "!{0}.ORIG_FID!".format(os.path.basename(self.outputStops))
                        for fld in join_fields:
                            arcpy.management.AddJoin(output_routes_layer, fld, self.outputStops,
                                                     output_stops_oid_field)
                            field_name = "{0}.{1}".format(os.path.basename(self.outputRoutes), join_fields[fld])
                            arcpy.management.CalculateField(output_routes_layer, field_name, expression, "PYTHON_9.3")
                            arcpy.management.RemoveJoin(output_routes_layer)

                        #Delete unwanted fields from output routes
                        output_routes_delete_fields = list(join_fields.keys()) + ["StopCount"]
                        arcpy.management.DeleteField(self.outputRoutes, output_routes_delete_fields)

                        #Transfer fields from origins and destinations to output routes
                        self._transferFields(self.originsLayer, "From", out_routes_origin_id_field)
                        self._transferFields(self.destinationsLayer, "To", out_routes_destination_id_field)

                        ##Populate unassigned origins and unassigned destinations if we got a partial solution
                        #Determine if we got partial solution
                        
                        if max((self.originsLayer.count, self.destinationsLayer.count)) == self.outputRoutesCount:
                            partial_solution = False
                        else:
                            partial_solution = True
                        if partial_solution:
                            #Add a warning that some of the origins and destinations were not assigned
                            self._addError(100138, self.ERROR_CODES[100138], is_warning=True)
                            #create unassigned origins and or unassigned destinations
                            if self.originsLayer.count == 1:
                                #If there are coincident origins and destinations or unlocated destinations, 
                                #only create unassigned destinations
                                self._createUnassignedFeatures(self.destinationsLayer,
                                                               self.outputUnassignedDestinations,
                                                               out_routes_destination_id_field)
                                self.outputUnassignedOrigins = ""

                            elif self.destinationsLayer.count == 1:
                                #If there are conincident origins and destinations or unlocated origins, only create 
                                #unassigned origins
                                self._createUnassignedFeatures(self.originsLayer, self.outputUnassignedOrigins,
                                                               out_routes_origin_id_field)
                                self.outputUnassignedDestinations = ""
                            else:
                                if self.coincidentOriginCount and not self.coincidentDestinationCount:
                                    # create only unassigned origins
                                    self._createUnassignedFeatures(self.originsLayer, self.outputUnassignedOrigins,
                                                                   out_routes_origin_id_field)
                                    self.outputUnassignedDestinations = ""
                                elif self.coincidentDestinationCount and not self.coincidentOriginCount:
                                    # create only unassigned destinations
                                    self._createUnassignedFeatures(self.destinationsLayer,
                                                                   self.outputUnassignedDestinations,
                                                                   out_routes_destination_id_field)
                                    self.outputUnassignedOrigins = ""
                                else:
                                    #Create both unassigned origins and unassigned destinations
                                    self._createUnassignedFeatures(self.originsLayer, self.outputUnassignedOrigins,
                                                                out_routes_origin_id_field)
                                    self._createUnassignedFeatures(self.destinationsLayer,
                                                                self.outputUnassignedDestinations,
                                                                out_routes_destination_id_field)
                        else:
                            self.outputUnassignedOrigins, self.outputUnassignedDestinations = "", ""
                else:
                    #Solve failed.
                    #Add an error that none of the origins were assigned
                    self._addError(100139, self.ERROR_CODES[100139])
                    self.outputRoutes, self.outputUnassignedOrigins, self.outputUnassignedDestinations = "", "", ""

        except Exception as ex:
            self.outputRoutes, self.outputUnassignedOrigins, self.outputUnassignedDestinations = "", "", ""
            raise
        finally:
            if not self.DEBUG:
                #Delete any temporary outputs
                orig_workspace = arcpy.env.workspace
                arcpy.env.workspace = self.outputWorkspace
                for dataset in arcpy.ListFeatureClasses("temp*") + arcpy.ListTables("temp*"):
                    try:
                        arcpy.management.Delete(dataset)
                        #pass
                    except Exception as ex:
                        arcpy.AddMessage("Failed to delete {0}".format(os.path.join(self.outputWorkspace, dataset)))
                arcpy.env.workspace = orig_workspace

class ChooseBestFacilities(NetworkAnalysisTool):
    '''Choose best locations for facilities by allocating locations that have demand for these facilities in a way
    that satisfies a given goal.'''
    
    TIME_UNITS = ("SECONDS", "MINUTES", "HOURS", "DAYS")
    GOAL_TO_PROBLEM_TYPE = {
        "MinimizeImpedance" : "Minimize Impedance",
        "MaximizeCoverage" : "Maximize Coverage",
        "MaximizeCapacitatedCoverage" : "Maximize Capacitated Coverage",
        "PercentCoverage" : "Target Market Share",
    }
    TRAVEL_DIRECTION = {
        "FacilityToDemand" : "Facility to Demand",
        "DemandToFacility" : "Demand to Facility"
    }
    TIME_ZONE = {
        "UTC": "UTC",
        "GeoLocal": "Geographically Local"
    }
    FACILITY_TYPES = {
        0 : "Candidate",
        1 : "Required",
        3 : "Chosen",
    }
    ERROR_CODES = dict(NetworkAnalysisTool.ERROR_CODES)
    ERROR_CODES[100151] = "The chosen travel range units, {travelRangeUnits}, and travel mode, {travelMode}, are incompatible. They are not mutually time or distance values."
    ERROR_CODES[100152] = "The combined count of features in {requiredFacilitiesLayer} and {candidateFacilitiesLayer} cannot be greater than {max}."
    ERROR_CODES[100154] = "Either specify a value for {paramName1} or {paramName2} parameter."
    ERROR_CODES[100155] = "The candidate facilities layer, {candidateFacilitiesLayer}, should not be specified for Allocate goal."
    ERROR_CODES[100156] = "The percentage of demand to cover must be greater than zero and less than or equal to one hundred."
    ERROR_CODES[100157] = "The number of candidates to choose cannot be less than the number of features in the required facilities layer."
    ERROR_CODES[100158] = "The number of candidates to choose cannot be greater than {max}."

    def __init__(self, goal, demand_locations_layer, demand=1, demand_field=None, max_travel_range=INFINITY,
                 max_travel_range_field=None, max_travel_range_units="Minutes", travel_mode=None, time_of_day=None,
                 time_zone_for_time_of_day="GeoLocal", travel_direction="FacilityToDemand",
                 required_facilities_layer=None, required_facilities_capacity=INFINITY,
                 required_facilities_capacity_field=None, candidate_facilities_layer=None, candidate_count=1,
                 candidate_facilities_capacity=INFINITY, candidate_facilities_capacity_field=None,
                 percent_demand_coverage=100, routing_utils_tbx=None, output_workspace="in_memory",
                 allocated_demand_locations_name="AllocatedDemandLocations", allocation_lines_name="AllocationLines",
                 assigned_facilities_name="AssignedFacilities", preferred_distance_units="Kilometers",
                 point_barrier_layer=None, line_barrier_layer=None, polygon_barrier_layer=None):
        '''Store tool parameters as instance attributes'''

        self.goal = goal
        self.demandLocationsLayer = LayerInfo(demand_locations_layer)
        if not self.demandLocationsLayer.name:
            self.demandLocationsLayer.name = "Demand Locations Layer" 
        self.demand = demand
        self.demandField = str(demand_field) if demand_field else None
        self.maxTravelRange = max_travel_range
        self.maxTravelRangeField = str(max_travel_range_field) if max_travel_range_field else None
        self.maxTravelRangeUnits = max_travel_range_units
        self.travelMode = travel_mode
        self.timeOfDay = time_of_day
        self.timeZone = time_zone_for_time_of_day
        self.travelDirection = travel_direction
        self.requiredFacilitiesLayer = LayerInfo(required_facilities_layer)
        if not self.requiredFacilitiesLayer.name:
            self.requiredFacilitiesLayer.name = "Required Facilities Layer"
        self.requiredFacilitiesCapacity = required_facilities_capacity
        self.requiredFacilitiesCapacityField = str(required_facilities_capacity_field) if required_facilities_capacity_field else None
        self.candidateFacilitiesLayer = LayerInfo(candidate_facilities_layer)
        if not self.candidateFacilitiesLayer.name:
            self.candidateFacilitiesLayer.name = "Candidate Facilities Layer"
        self.candidateCount = candidate_count
        self.candidateFacilitiesCapacity = candidate_facilities_capacity
        self.candidateFacilitiesCapacityField = str(candidate_facilities_capacity_field) if candidate_facilities_capacity_field else None
        self.percentDemandCoverage = percent_demand_coverage
        self.routingUtilsTbx = routing_utils_tbx
        self.outputWorkspace = output_workspace
        self.allocatedDemandLocations = os.path.join(output_workspace, allocated_demand_locations_name)
        self.allocationLines = os.path.join(output_workspace, allocation_lines_name)
        self.assignedFacilities = os.path.join(output_workspace, assigned_facilities_name)
        self.preferredDistanceUnits = preferred_distance_units.upper()
        self.pointBarrierLayer = LayerInfo(point_barrier_layer)
        self.lineBarrierLayer = LayerInfo(line_barrier_layer)
        self.polygonBarrierLayer = LayerInfo(polygon_barrier_layer)

        self.tempInputsStartName = "temp"
        self.errorFunc = arcpy.AddError
        self.warningFunc = arcpy.AddWarning
        #By default all outputs are created in the spatial reference of the demand locations layer.
        #The callers can provide a different spatial reference for outputs.
        self.outputCoordinateSystem = self.demandLocationsLayer.describe.spatialReference
        self.DEBUG = False

        #Other instance attributes that are initialized else where
        self.travelModeObject = None
        self.isTravelModeTimeBased = True
        self.facilities = None
        self.demandPoints = None
        self.tool_limits = {}

    def _validateInputs(self):
        '''validate the inputs to make sure we satisfy all the conditions to successfully call the
        remote service.'''

        #Get the tool limits from routing utlities service if available in the portal. Default is the limits imposed
        #by online services
        MAX_FACILITIES_COUNT = 1000
        MAX_DEMAND_LOCATIONS_COUNT = 10000
        MAX_FACILITIES_TO_FIND = 100

        if self.routingUtilsTbx:
            arcpy.AddMessage("Getting tool limits from {0}".format(self.routingUtilsTbx))
            tool_limits = get_tool_limits(self.routingUtilsTbx, "asyncLocationAllocation",
                                          "SolveLocationAllocation")
            self.tool_limits = tool_limits
            if "maximumFacilities" in tool_limits:
                max_facilities = tool_limits["maximumFacilities"]
                if max_facilities is None:
                    MAX_FACILITIES_COUNT = INFINITY
                else:
                    MAX_FACILITIES_COUNT = max_facilities
            if "maximumFacilitiesToFind" in tool_limits:
                max_facilities_to_find = tool_limits["maximumFacilitiesToFind"]
                if max_facilities_to_find is None:
                    MAX_FACILITIES_TO_FIND = INFINITY
                else:
                    MAX_FACILITIES_TO_FIND = max_facilities_to_find
            if "maximumDemandPoints" in tool_limits:
                max_demand_locations = tool_limits["maximumDemandPoints"]
                if max_demand_locations is None:
                    MAX_DEMAND_LOCATIONS_COUNT = INFINITY
                else:
                    MAX_DEMAND_LOCATIONS_COUNT = max_demand_locations
        arcpy.AddMessage("Max facilities count: {0}".format(MAX_FACILITIES_COUNT))
        arcpy.AddMessage("Max  facilities to find: {0}".format(MAX_FACILITIES_TO_FIND))
        arcpy.AddMessage("Max demand locations count: {0}".format(MAX_DEMAND_LOCATIONS_COUNT))
        
        ##Error checks

        #Check if the demandLocationsLayer has point geometry
        if not self.demandLocationsLayer.describe.shapeType.lower() in POINT_SHAPE_TYPES:
            msg_params = dict(startLayer=self.demandLocationsLayer.name)
            msg_code = 100072
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)
    
        #Check if we don't have more than the number of demand locations supported by the remote service
        if self.demandLocationsLayer.count > MAX_DEMAND_LOCATIONS_COUNT:
            msg_params = dict(max=MAX_DEMAND_LOCATIONS_COUNT, startLayer=self.demandLocationsLayer.name)
            msg_code = 100069
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)

        ##Check if both demand and demandField are not specified.
        #if self.demand and self.demandField:
        #    msg_params = dict(paramName1="demand", paramName2="demandField")
        #    msg_code = 100154
        #    msg = self.ERROR_CODES[msg_code].format(**msg_params)
        #    self._addError(msg_code, msg, msg_params)

        #Check if demand is greater than zero
        if self.demand <= 0:
            msg_params = dict(paramName="demand")
            msg_code = 100153
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)

        #Check if the demandField field is specified, it exists on the demandLocationsLayer 
        if self.demandField:
            self._checkFieldExists(self.demandField, self.demandLocationsLayer)

        ##Check if both maxTravelRange and maxTravelRangeField are not specified.
        #if self.maxTravelRange and self.maxTravelRangeField:
        #    msg_params = dict(paramName1="maxTravelRange", paramName2="maxTravelRangeField")
        #    msg_code = 100154
        #    msg = self.ERROR_CODES[msg_code].format(**msg_params)
        #    self._addError(msg_code, msg, msg_params)

        #Check if maxTravelRange is greater than zero
        if self.maxTravelRange <= 0:
            msg_params = dict(paramName="maxTravelRange")
            msg_code = 100153
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)

        #Check if the maxTravelRange field is specified, it exists on the demandLocationsLayer 
        if self.maxTravelRangeField:
            self._checkFieldExists(self.maxTravelRangeField, self.demandLocationsLayer)

        #Perform checks that are applicable when requiredFacilitiesLayer is specified.
        if self.requiredFacilitiesLayer.count:
            #Check if the requiredFacilitiesLayer has point geometry
            if not self.requiredFacilitiesLayer.describe.shapeType.lower() in POINT_SHAPE_TYPES:
                msg_params = dict(startLayer=self.requiredFacilitiesLayer.name)
                msg_code = 100072
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)

            #Check if we don't have more features in the requiredFacilitiesLayer than the number of facilities to find
            #supported by the remote service
            if self.requiredFacilitiesLayer.count > MAX_FACILITIES_TO_FIND:
                msg_params = dict(max=MAX_FACILITIES_TO_FIND, startLayer=self.requiredFacilitiesLayer.name)
                msg_code = 100069
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)

            ##Check if both requiredFacilitiesCapacity and requiredFacilitiesCapacityField are not specified.
            #if self.requiredFacilitiesCapacity and self.requiredFacilitiesCapacityField:
            #    msg_params = dict(paramName1="requiredFacilitiesCapacity", paramName2="requiredFacilitiesCapacityField")
            #    msg_code = 100154
            #    msg = self.ERROR_CODES[msg_code].format(**msg_params)
            #    self._addError(msg_code, msg, msg_params)

            #Check if requiredFacilitiesCapacity is greater than zero
            if self.requiredFacilitiesCapacity <= 0:
                msg_params = dict(paramName="requiredFacilitiesCapacity")
                msg_code = 100153
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)

            #Check if the requiredFacilitiesCapacity field is specified, it exists on the requiredFacilitiesLayer 
            if self.requiredFacilitiesCapacityField:
                self._checkFieldExists(self.requiredFacilitiesCapacityField, self.requiredFacilitiesLayer)

        #Perform checks that are applicable when goal type is allocate.
        if self.goal == "Allocate":
            #Check that requiredFacilitiesLayer is specified
            if not self.requiredFacilitiesLayer.count:
                msg_params = dict(parameterName="requiredFacilitiesLayer")
                msg_code = 100137
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)
                
            #Check that candidateFacilitiesLayer is not specified.
            if self.candidateFacilitiesLayer.count:
                msg_params = dict(candidateFacilitiesLayer=self.candidateFacilitiesLayer.name)
                msg_code = 100155
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)
        else:
            #checks related to candidateCount are not applicable to Allocate and Percent Coverage goals
            if self.goal != "PercentCoverage":
                #Check if candidateCount is greater than zero
                if self.candidateCount <= 0:
                    msg_params = dict(paramName="candidateCount")
                    msg_code = 100153
                    msg = self.ERROR_CODES[msg_code].format(**msg_params)
                    self._addError(msg_code, msg, msg_params)

                #Check if sum of number of features in requiredFacilitiesLayer and candidates to choose is less than
                #max facilities to find supported by the service.
                if (self.candidateCount + self.requiredFacilitiesLayer.count) > MAX_FACILITIES_TO_FIND :
                    msg_params = dict(max=MAX_FACILITIES_TO_FIND - self.requiredFacilitiesLayer.count)
                    msg_code = 100158
                    msg = self.ERROR_CODES[msg_code].format(**msg_params)
                    self._addError(msg_code, msg, msg_params)

                #Check if candidates to choose is less than the number of facilities to find supported by the remote
                #service
                if self.candidateCount > MAX_FACILITIES_TO_FIND:
                    msg_params = dict(max=MAX_FACILITIES_TO_FIND)
                    msg_code = 100158
                    msg = self.ERROR_CODES[msg_code].format(**msg_params)
                    self._addError(msg_code, msg, msg_params)

        #Perform checks that are applicable when candidateFacilitiesLayer is specified.
        if self.candidateFacilitiesLayer.count:
            #Check if the candidateFacilitiesLayer has point geometry
            if not self.candidateFacilitiesLayer.describe.shapeType.lower() in POINT_SHAPE_TYPES:
                msg_params = dict(startLayer=self.candidateFacilitiesLayer.name)
                msg_code = 100072
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)

            #Check if we don't have more features in the candidateFacilitiesLayer than the number of facilities 
            #supported by the remote service
            if self.candidateFacilitiesLayer.count > MAX_FACILITIES_COUNT:
                msg_params = dict(max=MAX_FACILITIES_COUNT, startLayer=self.candidateFacilitiesLayer.name)
                msg_code = 100069
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)

            ##Check if both candidateFacilitiesCapacity and candidateFacilitiesCapacityField are not specified.
            #if self.candidateFacilitiesCapacity and self.candidateFacilitiesCapacityField:
            #    msg_params = dict(paramName1="candidateFacilitiesCapacity", paramName2="candidateFacilitiesCapacityField")
            #    msg_code = 100154
            #    msg = self.ERROR_CODES[msg_code].format(**msg_params)
            #    self._addError(msg_code, msg, msg_params)

            #Check if candidateFacilitiesCapacity is greater than zero
            if self.candidateFacilitiesCapacity <= 0:
                msg_params = dict(paramName="candidateFacilitiesCapacity")
                msg_code = 100153
                msg = self.ERROR_CODES[msg_code].format(**msg_params)
                self._addError(msg_code, msg, msg_params)

            #Check if the candidateFacilitiesCapacity field is specified, it exists on the candidateFacilitiesLayer 
            if self.candidateFacilitiesCapacityField:
                self._checkFieldExists(self.candidateFacilitiesCapacityField, self.candidateFacilitiesLayer)

        #Check if the percentDemandCoverage is greater than zero and less than or equal to 100
        if self.percentDemandCoverage <= 0 or self.percentDemandCoverage > 100:
            msg_code = 100156
            msg = self.ERROR_CODES[msg_code]
            self._addError(msg_code, msg, None)

        # Check shape type of barrier layers
        self._checkBarrierShapeType()

        #Check if the travel mode is valid. Valid values are JSON that represent a time or distance based travel mode.
        #Determine if the travel mode is time based or distance based and check if travelRangeUnits are same type
        #as the travel mode.
        try:
            if not self.travelMode:
                raise ValueError
            self.travelModeObject = get_travel_mode_from_json(self.travelMode)
            if self.travelModeObject.impedance == self.travelModeObject.timeAttributeName:
                self.isTravelModeTimeBased = True
                if self.maxTravelRange != INFINITY or self.maxTravelRangeField:
                    if not self.maxTravelRangeUnits.upper() in self.TIME_UNITS:
                        msg_params = {"travelRangeUnits": self.maxTravelRangeUnits,
                                      "travelMode": self.travelModeObject.name}
                        msg_code = 100151
                        msg = self.ERROR_CODES[msg_code].format(**msg_params)
                        self._addError(msg_code, msg, msg_params)
            else:
                self.isTravelModeTimeBased = False
                if self.maxTravelRange != INFINITY or self.maxTravelRangeField:
                    if self.maxTravelRangeUnits.upper() in self.TIME_UNITS:
                        msg_params = {"travelRangeUnits": self.maxTravelRangeUnits,
                                      "travelMode": self.travelModeObject.name}
                        msg_code = 100151
                        msg = self.ERROR_CODES[msg_code].format(**msg_params)
                        self._addError(msg_code, msg, msg_params)
        except (ValueError, TypeError) as ex:
            msg_params = {"travelMode" : self.travelMode}
            msg_code = 100145
            msg = self.ERROR_CODES[msg_code].format(**msg_params)
            self._addError(msg_code, msg, msg_params)

    def _preprocessInputs(self):
        '''Use the validated inputs to prepare the inputs in the format required by the remote service.
        Preparing inputs does things like create combine the required and candidate facilities as a single 
        facilities layer'''
        
        self._validateInputs()

        '''
        TODO: Error checks
        #Check that if demandField or maxTravelRangeField are specified on demandLocationsLayer at least one value is
        greater than zero.
        #Check if requiredFacilitiesCapacityField is specified on requiredFacilitiesLayer, at least one value is
        greater than zero
        #Check if candidateFacilitiesCapacityField is specified on candidateFacilitiesLayer, at least one value is
        greater than zero  
        '''

        #Set the output coordinate system for all GP functions that create feature classes
        arcpy.env.outputCoordinateSystem = self.outputCoordinateSystem
        
        ##Create demand points feature class with appropriate fields as required by the remote service
        self.demandPoints = arcpy.CreateUniqueName(self.tempInputsStartName, self.outputWorkspace)
        arcpy.management.CreateFeatureclass(self.outputWorkspace, os.path.basename(self.demandPoints), "POINT",
                                            spatial_reference=self.outputCoordinateSystem)
        #Need to populate Weight and TimeCutoff or DistanceCutoff fields. Also include the OID from input demand points
        #as Name field so that they can be used to transfer attributes from input demand points to output demand points
        demand_points_field_names = ["SHAPE@", "Name", "Weight"]
        demand_location_layer_cursor_fields = ["SHAPE@", "OID@"]
        arcpy.management.AddField(self.demandPoints, "Name", "TEXT", field_length=255)
        arcpy.management.AddField(self.demandPoints, "Weight", "DOUBLE")
        if self.demandField:
            demand_location_layer_cursor_fields.append(self.demandField)
        if self.maxTravelRangeField:
            if self.isTravelModeTimeBased:
                arcpy.management.AddField(self.demandPoints, "TimeCutoff", "DOUBLE")
                demand_points_field_names.append("TimeCutoff")
            else:
                arcpy.management.AddField(self.demandPoints, "DistanceCutoff", "DOUBLE")
                demand_points_field_names.append("DistanceCutoff")
            demand_location_layer_cursor_fields.append(self.maxTravelRangeField)
        with arcpy.da.InsertCursor(self.demandPoints, demand_points_field_names) as demand_points_cursor:
            with arcpy.da.SearchCursor(self.demandLocationsLayer.layer, demand_location_layer_cursor_fields, None,
                                       self.outputCoordinateSystem) as demand_locations_layer_cursor:
                for row in demand_locations_layer_cursor:
                    demand_points_row = [row[0], str(row[1])]
                    if self.demandField:
                        demand_points_row.append(row[2])
                    else:
                        demand_points_row.append(self.demand)
                    if self.maxTravelRangeField:
                        demand_points_row.append(row[-1])
                    demand_points_cursor.insertRow(demand_points_row)

        ##Create facilities with approriate fields as required by the remote service
        self.facilities = arcpy.CreateUniqueName(self.tempInputsStartName, self.outputWorkspace)
        arcpy.management.CreateFeatureclass(self.outputWorkspace, os.path.basename(self.facilities), "POINT",
                                            spatial_reference=self.outputCoordinateSystem)
        #Need to always populate FacilityType field and optionally populate Capacity field if required or candidate
        #facilities have capacity field. Also include the OID from input facilities as Name field so that they can be
        #used to transfer attributes from input facilities to output facilities
        facilities_field_name = ["SHAPE@", "Name", "FacilityType", "Capacity"]
        required_facilities_layer_cursor_fields = ["SHAPE@", "OID@"]
        candidate_facilities_layer_cursor_fields = ["SHAPE@", "OID@"]
        arcpy.management.AddField(self.facilities,"Name", "TEXT", field_length=255)
        arcpy.management.AddField(self.facilities,"FacilityType", "SHORT")
        arcpy.management.AddField(self.facilities,"Capacity", "DOUBLE")
        if self.requiredFacilitiesLayer.count:
            if self.requiredFacilitiesCapacityField:
                required_facilities_layer_cursor_fields.append(self.requiredFacilitiesCapacityField)
            with arcpy.da.InsertCursor(self.facilities, facilities_field_name) as facilities_cursor:
                with arcpy.da.SearchCursor(self.requiredFacilitiesLayer.layer, required_facilities_layer_cursor_fields,
                                           None, self.outputCoordinateSystem) as required_facilities_layer_cursor:
                    for row in required_facilities_layer_cursor:
                        facilities_row = [row[0], str(row[1]), 1]
                        if self.requiredFacilitiesCapacityField:
                            facilities_row.append(row[-1])
                        else:
                            facilities_row.append(self.requiredFacilitiesCapacity)
                        facilities_cursor.insertRow(facilities_row)
        if self.candidateFacilitiesLayer.count:
            if self.candidateFacilitiesCapacityField:
                candidate_facilities_layer_cursor_fields.append(self.candidateFacilitiesCapacityField)
            with arcpy.da.InsertCursor(self.facilities, facilities_field_name) as facilities_cursor:
                with arcpy.da.SearchCursor(self.candidateFacilitiesLayer.layer,
                                           candidate_facilities_layer_cursor_fields, None,
                                           self.outputCoordinateSystem) as candidate_facilities_layer_cursor:
                    for row in candidate_facilities_layer_cursor:
                        facilities_row = [row[0], row[1], 0]
                        if self.candidateFacilitiesCapacityField:
                            facilities_row.append(row[-1])
                        else:
                            facilities_row.append(self.candidateFacilitiesCapacity)
                        facilities_cursor.insertRow(facilities_row)
    
    def _transferFields(self, source_layer_info, destination_layer, destination_join_field, 
                        source_field_name_prefix="ORIG", rename_all=False):
        '''Transfer fields from source feature layer to destination layer using appropriate names and aliases on
        destination. When rename_all is False, only rename fields that are common between source and destination.'''

        #Make a copy of the source feature and rename fields and set field aliases
        field_mappings = arcpy.FieldMappings()
        field_mappings.addTable(source_layer_info.layer)
        non_transferable_field_types = ("globalid", "guid")
        source_field_maps = []
        transfer_field_names = []
        common_fields = []

        source_layer_field_names = [fld.name for fld in source_layer_info.describe.fields]
        source_layer_field_names_lower = [name.lower() for name in source_layer_field_names]
        if not rename_all:
            #Find the fields that have same names in source and destination layers
            destination_layer_desc = arcpy.Describe(destination_layer)
            for fld in destination_layer_desc.fields:
                fld_name = fld.name
                if not fld_name in (destination_layer_desc.oidFieldName,
                                    destination_layer_desc.shapeFieldName):
                    if not fld.type in non_transferable_field_types:
                        if fld_name.lower() in source_layer_field_names_lower:
                            common_fields.append(fld_name)

        for field_map in field_mappings.fieldMappings:
            output_field = field_map.outputField
            #Skip GUID fields as they are invalid with JoinField tool.
            if output_field.type.lower() in non_transferable_field_types:
                continue
            source_fld_name = output_field.name
            if rename_all or source_fld_name in common_fields: 
                new_field_name = "{0}_{1}".format(source_field_name_prefix, source_fld_name)
            else:
                new_field_name = source_fld_name
            output_field.name = new_field_name
            output_field.aliasName = "{0}: {1}".format(source_layer_info.name, output_field.aliasName)
            field_map.outputField = output_field
            transfer_field_names.append(new_field_name)
            source_field_maps.append(field_map)

        #transfer the OID field from source as ORIG_FID
        oid_field_name = get_unique_field_name("ORIG_FID", source_layer_field_names)
        fm_oid = arcpy.FieldMap()
        fm_oid.addInputField(source_layer_info.layer, source_layer_info.describe.oidFieldName)
        oid_field = fm_oid.outputField
        oid_field.name = oid_field_name
        oid_field.type = "LONG"
        oid_field.aliasName = "ORIG FID"
        fm_oid.outputField = oid_field

        source_field_mappings = arcpy.FieldMappings()
        for fm in source_field_maps:
            source_field_mappings.addFieldMap(fm)
        source_field_mappings.addFieldMap(fm_oid)
        source_features_copy = arcpy.CreateUniqueName(self.tempInputsStartName, self.outputWorkspace)
        arcpy.conversion.TableToTable(source_layer_info.layer, self.outputWorkspace, 
                                      os.path.basename(source_features_copy), field_mapping=source_field_mappings)
        #Join fields
        arcpy.management.JoinField(destination_layer, destination_join_field, source_features_copy, oid_field_name,
                                   transfer_field_names)


    def execute(self, remote_toolbox):
        '''Use the validated and preprocessed inputs to run the analysis using the remote service. Post process 
        the outputs obtained from calling the remote service into outputs that needs to be returned from
        the tool. Return the output routes, assigned stops and unassigned stops feature classes'''

        #Set the output coordinate system for all GP functions that create feature classes
        arcpy.env.outputCoordinateSystem = self.outputCoordinateSystem

        with LogExecutionTime("Preprocessed inputs"):
            self._preprocessInputs()

        solve_succeeded = False

        try:
            
            ##Build parameters used to call the remote service
            #measurement units are same as maxTravelRangeUnits if maxTravelRange is specified. Else derive mesaurement
            #units from travel mode using Minutes for time based travel modes and miles for distance based travel modes
            if self.maxTravelRange == INFINITY and not self.maxTravelRangeField:
                measurement_units = "Minutes" if self.isTravelModeTimeBased else "Miles"
            else:
                measurement_units = self.maxTravelRangeUnits
            #Derive problem type based on goal
            if self.goal in self.GOAL_TO_PROBLEM_TYPE:
                problem_type = self.GOAL_TO_PROBLEM_TYPE[self.goal]
                #For all goals other than allocate, faciliteis to find should be equal to number required facilities 
                #count and candidate count
                facilities_to_find = self.candidateCount + self.requiredFacilitiesLayer.count
            else:
                #For allocate goal, if capacity is not specified solve Minimize Impedance otherwise solve Maximize
                #Capacitated Coverage. Also facility to find is equal to required facility count
                if self.requiredFacilitiesCapacityField:
                    # Ignore facilities with zero capacity as they are not considered valid by the solver.
                    facilities_to_find = 0
                    with arcpy.da.SearchCursor(self.facilities, "OID@", "Capacity > 0") as count_cursor:
                        for row in count_cursor:
                            facilities_to_find += 1
                else:
                    facilities_to_find = self.requiredFacilitiesLayer.count
                if self.requiredFacilitiesCapacity == INFINITY and not self.requiredFacilitiesCapacityField:
                    problem_type = "Minimize Impedance"
                else:
                    problem_type = "Maximize Capacitated Coverage"

            task_params = [self.facilities, self.demandPoints, measurement_units, "", problem_type,
                           facilities_to_find, self.maxTravelRange, 1, self.percentDemandCoverage, "", "",
                           self.TRAVEL_DIRECTION[self.travelDirection], self.timeOfDay, self.TIME_ZONE[self.timeZone], "",
                           self.pointBarrierLayer.layer, self.lineBarrierLayer.layer, self.polygonBarrierLayer.layer,
                           "", "", "", "", self.travelMode, ""]
            ignore_error_codes = (30109,)
            arcpy.AddMessage("Adding remote toolbox {0}".format(remote_toolbox))
            try:
                service_result = call_async_gp_service(remote_toolbox, "SolveLocationAllocation", task_params,
                                                       ignore_error_codes,)
            except arcpy.ExecuteError as ex:
                try:
                    remote_msgs = ex.args[0] if ex.args else ""
                    if remote_msgs:
                        if 30145 in remote_msgs:
                            # Walking limit exceeded
                            msg_code = 100258
                            walking_limit = self.tool_limits.get("maximumGeodesicDistanceWhenWalking", 27)
                            walking_limit_unit = self.tool_limits.get("maximumGeodesicDistanceUnitsWhenWalking", "Miles")
                            msg_params = {
                                "mileValue": convert_units(walking_limit, walking_limit_unit, "Miles"),
                                "kmValue": convert_units(walking_limit, walking_limit_unit, "Kilometers"),
                            }
                            msg = self.ERROR_CODES[msg_code]
                            self._addError(msg_code, msg, msg_params)
                        if 30095 in remote_msgs:
                            # Barrier limit exceeded
                            self._raiseBarrierLimitError(remote_msgs[30095])
                        
                    else:
                        raise
                except Exception:
                    raise

            if service_result.getOutput(0).lower() == 'true':
                solve_succeeded = True
            if solve_succeeded:
                #Save the outputs as feature classes instead of feature sets
                with LogExecutionTime("Saved the results from remote tool"):
                    arcpy.management.CopyFeatures(service_result.getOutput(1), self.allocationLines)
                    arcpy.management.CopyFeatures(service_result.getOutput(2), self.assignedFacilities)
                    arcpy.management.CopyFeatures(service_result.getOutput(3), self.allocatedDemandLocations)

                ##Post process results
                with LogExecutionTime("Post-processed results"):
                    #Update DemandOID field in allocated demand locations based on Name field.
                    arcpy.management.CalculateField(self.allocatedDemandLocations, "DemandOID", "!Name!", "PYTHON_9.3")
                    #Update FacilityID field in assigned facilities based on Name field. This includes the oids for
                    #required and candidate facilities
                    arcpy.management.AddField(self.assignedFacilities, "FacilityID", "LONG", field_alias="Facility ID")
                    arcpy.management.CalculateField(self.assignedFacilities, "FacilityID", "!Name!", "PYTHON_9.3")
                    #Update FacilityOID and DemandOID fields on allocation lines based on Name field
                    #Name field includes facility oid and demand oid values based on travel direction
                    if self.travelDirection == "FacilityToDemand":
                        facility_oid_index = 0
                        demand_oid_index = 1
                    else:
                        facility_oid_index = 1
                        demand_oid_index = 0
                    arcpy.management.CalculateField(self.allocationLines, "DemandOID",
                                                    "!Name!.split('-')[{}].strip()".format(demand_oid_index), "PYTHON_9.3")

                    #Delete unapproraite fields and rename fields from allocation lines
                    #Allocation lines always have Minutes based field when using a time based travel mode. But if max
                    #travel range units is other than Minutes, we need to keep travel time values in max travel range units
                    #Delete minutes based values. If travel mode is distance based, we always get travel distance in
                    #Kilometers and Miles. We need to delete travel distance in Miles and Kilometers if travel range units
                    #is not Miles or Kilometers. We also always delete Name field as it is used to store oids.
                    allocation_lines_delete_fields = ["Name"]
                    allocation_lines_rename_fields = {
                        "Weight" : ("AllocatedDemand", "Allocated Demand"),
                        "FacilityOID" : ("FacilityOID", "Assigned Facility ID"),
                        "DemandOID" : ("DemandOID", "Allocated Demand ID"),
                        }
                    if self.isTravelModeTimeBased:
                        if self.preferredDistanceUnits == "MILES":
                            allocation_lines_delete_fields += ["Total_Kilometers"]
                            allocation_lines_rename_fields["Total_Miles"] = ("TotalTravelDistance",
                                                                             "Total Travel Distance (Miles)")
                        elif self.preferredDistanceUnits == "KILOMETERS":
                            allocation_lines_delete_fields += ["Total_Miles"]
                            allocation_lines_rename_fields["Total_Kilometers"] = ("TotalTravelDistance",
                                                                                  "Total Travel Distance (Kilometers)")
                        else:
                            allocation_lines_rename_fields["Total_Miles"] = ("Total_Miles",
                                                                             "Total Travel Distance (Miles)")
                            allocation_lines_rename_fields["Total_Kilometers"] = ("Total_Kilometers",
                                                                                  "Total Travel Distance (Kilometers)")
                        if self.maxTravelRangeUnits == "Minutes":
                            allocation_lines_rename_fields["Total_Minutes"] = ("TotalTravelTime",
                                                                               "Total Travel Time (Minutes)")
                            allocation_lines_rename_fields["TotalWeighted_Minutes"] = ("TotalWeightedTravelTime",
                                                                                       "Total Weighted Travel Time (Minutes)")
                        else:
                            allocation_lines_delete_fields += ["TotalWeighted_Minutes", "Total_Minutes"]
                            allocation_lines_rename_fields["Total_{}".format(self.maxTravelRangeUnits)] = ("TotalTravelTime",
                                                                                                           "Total Travel Time ({})".format(self.maxTravelRangeUnits))
                            allocation_lines_rename_fields["TotalWeighted_{}".format(self.maxTravelRangeUnits)] = ("TotalWeightedTravelTime",
                                                                                                                   "Total Weighted Travel Time ({})".format(self.maxTravelRangeUnits))
                    else:
                        allocation_lines_rename_fields["Total_Minutes"] = ("TotalTravelTime",
                                                                           "Total Travel Time (Minutes)")
                        if self.maxTravelRangeUnits == "Miles":
                            allocation_lines_delete_fields += ["Total_Kilometers", "TotalWeighted_Kilometers"]
                            allocation_lines_rename_fields["Total_Miles"] = ("TotalTravelDistance",
                                                                             "Total Travel Distance (Miles)")
                            allocation_lines_rename_fields["TotalWeighted_Miles"] = ("TotalWeightedTravelDistance",
                                                                                     "Total Weighted Travel Distance (Miles)")
                        elif self.maxTravelRangeUnits == "Kilometers":
                            allocation_lines_delete_fields += ["Total_Miles", "TotalWeighted_Miles"]
                            allocation_lines_rename_fields["Total_Kilometers"] = ("TotalTravelDistance",
                                                                                  "Total Travel Distance (Kilometers)")
                            allocation_lines_rename_fields["TotalWeighted_Kilometers"] = ("TotalWeightedTravelDistance",
                                                                                          "Total Weighted Travel Distance (Kilometers)")
                        elif self.maxTravelRange == INFINITY and self.maxTravelRangeUnits.upper() in self.TIME_UNITS:
                            #Should be in this code block when using a distance based travel mode and infinite travel 
                            #range as in that case the travel range units will be minutes.
                            if self.preferredDistanceUnits == "MILES":
                                #Keep miles based fields and delete kilometer based fields
                                allocation_lines_rename_fields["Total_Miles"] = ("TotalTravelDistance",
                                                                                 "Total Travel Distance (Miles)")
                                allocation_lines_rename_fields["TotalWeighted_Miles"] = ("TotalWeightedTravelDistance",
                                                                                         "Total Weighted Travel Distance (Miles)")
                                allocation_lines_delete_fields += ["Total_Kilometers", "TotalWeighted_Kilometers"]
                            elif self.preferredDistanceUnits == "KILOMETERS":
                                #Keep kilometer based fields and delete miles based fields
                                allocation_lines_rename_fields["Total_Kilometers"] = ("TotalTravelDistance",
                                                                                      "Total Travel Distance (Kilometers)")
                                allocation_lines_rename_fields["TotalWeighted_Kilometers"] = ("TotalWeightedTravelDistance",
                                                                                              "Total Weighted Travel Distance (Kilometers)")
                                allocation_lines_delete_fields += ["Total_Miles", "TotalWeighted_Miles"]
                            else:
                                #Keep both miles and kilometer based fields
                                allocation_lines_rename_fields["Total_Miles"] = ("Total_Miles",
                                                                                 "Total Travel Distance (Miles)")
                                allocation_lines_rename_fields["TotalWeighted_Miles"] = ("TotalWeighted_Miles",
                                                                                         "Total Weighted Travel Distance (Miles)")
                                allocation_lines_rename_fields["Total_Kilometers"] = ("Total_Kilometers",
                                                                                      "Total Travel Distance (Kilometers)")
                                allocation_lines_rename_fields["TotalWeighted_Kilometers"] = ("TotalWeighted_Kilometers",
                                                                                              "Total Weighted Travel Distance (Kilometers)")
                        else:
                            allocation_lines_delete_fields += ["TotalWeighted_Miles", "Total_Miles",
                                                               "TotalWeighted_Kilometers", "Total_Kilometers"]
                            allocation_lines_rename_fields["Total_{}".format(self.maxTravelRangeUnits)] = ("TotalTravelDistance",
                                                                                                           "Total Travel Distance ({})".format(self.maxTravelRangeUnits))
                            allocation_lines_rename_fields["TotalWeighted_{}".format(self.maxTravelRangeUnits)] = ("TotalWeightedTravelDistance",
                                                                                                                   "Total Weighted Travel Distance ({})".format(self.maxTravelRangeUnits))
                    arcpy.management.DeleteField(self.allocationLines, allocation_lines_delete_fields)
                    for fld in allocation_lines_rename_fields:
                        #arcpy.AddMessage("Renaming {} to {} with alias {}".format(fld, *allocation_lines_rename_fields[fld]))
                        arcpy.management.AlterField(self.allocationLines, fld, *allocation_lines_rename_fields[fld])

                    #Delete unappropraite fields and rename fields from assigned facilities
                    assigned_facilities_delete_fields = ["Name", "Weight", "CurbApproach", "StatusLong", "FacilityTypeLong"]
                    assigned_facilities_rename_fields = {
                        "FacilityOID" : ("FacilityOID", "Assigned Facility ID"),
                        "DemandWeight" : ("AllocatedDemand", "Allocated Demand"),
                        "DemandCount" : ("DemandCount", "Demand Count"),
                        "Status": ("StatusLong", "Status"),
                        "FacilityType": ("FacilityTypeLong", "FacilityType"),
                        }
                    if self.isTravelModeTimeBased:
                        if self.maxTravelRangeUnits == "Minutes":
                            assigned_facilities_rename_fields["Total_Minutes"] = ("TotalTravelTime",
                                                                                  "Total Travel Time (Minutes)")
                            assigned_facilities_rename_fields["TotalWeighted_Minutes"] = ("TotalWeightedTravelTime",
                                                                                          "Total Weighted Travel Time (Minutes)")
                        else:
                            assigned_facilities_delete_fields += ["Total_Minutes", "TotalWeighted_Minutes"]
                            assigned_facilities_rename_fields["Total_{}".format(self.maxTravelRangeUnits)] = ("TotalTravelTime",
                                                                                                              "Total Travel Time ({})".format(self.maxTravelRangeUnits))
                            assigned_facilities_rename_fields["TotalWeighted_{}".format(self.maxTravelRangeUnits)] = ("TotalWeightedTravelTime",
                                                                                                                      "Total Weighted Travel Time ({})".format(self.maxTravelRangeUnits))
                    else:
                        if self.maxTravelRangeUnits == "Miles":
                            assigned_facilities_delete_fields += ["Total_Kilometers", "TotalWeighted_Kilometers"]
                            assigned_facilities_rename_fields["Total_Miles"] = ("TotalTravelDistance",
                                                                                "Total Travel Distance (Miles)")
                            assigned_facilities_rename_fields["TotalWeighted_Miles"] = ("TotalWeightedTravelDistance",
                                                                                        "Total Weighted Travel Distance (Miles)")
                        elif self.maxTravelRangeUnits == "Kilometers":
                            assigned_facilities_delete_fields += ["Total_Miles", "TotalWeighted_Miles"]
                            assigned_facilities_rename_fields["Total_Kilometers"] = ("TotalTravelDistance",
                                                                                     "Total Travel Distance (Kilometers)")
                            assigned_facilities_rename_fields["TotalWeighted_Kilometers"] = ("TotalWeightedTravelDistance",
                                                                                             "Total Weighted Travel Distance (Kilometers)")
                        elif self.maxTravelRange == INFINITY and self.maxTravelRangeUnits.upper() in self.TIME_UNITS:
                            #Should be in this code block when using a distance based travel mode and infinite travel 
                            #range as in that case the travel range units will be minutes.
                            if self.preferredDistanceUnits == "MILES":
                                #Keep miles based fields and delete kilometer based fields
                                assigned_facilities_delete_fields += ["Total_Kilometers", "TotalWeighted_Kilometers"]
                                assigned_facilities_rename_fields["Total_Miles"] = ("TotalTravelDistance",
                                                                                    "Total Travel Distance (Miles)")
                                assigned_facilities_rename_fields["TotalWeighted_Miles"] = ("TotalWeightedTravelDistance",
                                                                                            "Total Weighted Travel Distance (Miles)")
                            elif self.preferredDistanceUnits == "KILOMETERS":
                                #Keep kilometer based fields and delete miles based fields
                                assigned_facilities_delete_fields += ["Total_Miles", "TotalWeighted_Miles"]
                                assigned_facilities_rename_fields["Total_Kilometers"] = ("TotalTravelDistance",
                                                                                         "Total Travel Distance (Kilometers)")
                                assigned_facilities_rename_fields["TotalWeighted_Kilometers"] = ("TotalWeightedTravelDistance",
                                                                                                 "Total Weighted Travel Distance (Kilometers)")
                            else:
                                #Keep both miles and kilometers based fields
                                assigned_facilities_rename_fields["Total_Miles"] = ("Total_Miles",
                                                                                    "Total Travel Distance (Miles)")
                                assigned_facilities_rename_fields["TotalWeighted_Miles"] = ("TotalWeighted_Miles",
                                                                                            "Total Weighted Travel Distance (Miles)")
                                assigned_facilities_rename_fields["Total_Kilometers"] = ("Total_Kilometers",
                                                                                         "Total Travel Distance (Kilometers)")
                                assigned_facilities_rename_fields["TotalWeighted_Kilometers"] = ("TotalWeighted_Kilometers",
                                                                                                 "Total Weighted Travel Distance (Kilometers)")

                        else:
                            assigned_facilities_delete_fields += ["Total_Kilometers", "TotalWeighted_Kilometers",
                                                                  "Total_Miles", "TotalWeighted_Miles"]
                            assigned_facilities_rename_fields["Total_{}".format(self.maxTravelRangeUnits)] = ("TotalTravelDistance",
                                                                                                              "Total Travel Distance ({})".format(self.maxTravelRangeUnits))
                            assigned_facilities_rename_fields["TotalWeighted_{}".format(self.maxTravelRangeUnits)] = ("TotalWeightedTravelDistance",
                                                                                                                      "Total Weighted Travel Distance ({})".format(self.maxTravelRangeUnits))

                    for fld in assigned_facilities_rename_fields:
                        arcpy.management.AlterField(self.assignedFacilities, fld, *assigned_facilities_rename_fields[fld])
                    #Provide string values for facility type and status fields
                    arcpy.management.AddField(self.assignedFacilities, "Status", "TEXT", field_length=15,
                                              field_alias="Status")
                    arcpy.management.AddField(self.assignedFacilities, "FacilityType", "TEXT", field_length=10,
                                              field_alias="Facility Type")

                    with arcpy.da.UpdateCursor(self.assignedFacilities, ("StatusLong", "FacilityTypeLong", "Status",
                                                                         "FacilityType")) as cursor:
                        for row in cursor:
                            cursor.updateRow((row[0], row[1],
                                              self.NETWORK_LOCATION_STATUS.get(row[0], str(row[0])),
                                              self.FACILITY_TYPES.get(row[1], str(row[1]))))
                
                    arcpy.management.DeleteField(self.assignedFacilities, assigned_facilities_delete_fields)
                    #transfer fields from the input required facilities
                    if self.requiredFacilitiesLayer.count:
                        assigned_required_facilities_layer = "AssignedRequiredFacilitiesLayer"
                        arcpy.management.MakeFeatureLayer(self.assignedFacilities, assigned_required_facilities_layer,
                                                          "FacilityType = 'Required'", self.outputWorkspace) 
                        self._transferFields(self.requiredFacilitiesLayer, assigned_required_facilities_layer, 
                                             "FacilityID", "REQFAC")
                    #transfer fields from the input candidate facilities
                    if self.candidateFacilitiesLayer.count:
                        assigned_candidate_facilities_layer = "AssignedCandidateFacilitiesLayer"
                        arcpy.management.MakeFeatureLayer(self.assignedFacilities, assigned_candidate_facilities_layer,
                                                          "FacilityType <> 'Required'", self.outputWorkspace)
                        self._transferFields(self.candidateFacilitiesLayer, assigned_candidate_facilities_layer,
                                             "FacilityID", "CANFAC")

                    #Delete unapproraite fields and rename fields from allocated demand locations
                    allocated_demand_locations_delete_fields = ["Name", "GroupName", "CurbApproach", "StatusLong"]
                    allocated_demand_locations_rename_fields = {
                        "FacilityOID" : ("FacilityOID", "Assigned Facility ID"),
                        "DemandOID" : ("DemandOID", "Demand ID"),
                        "Weight" : ("Demand", "Demand"),
                        "AllocatedWeight" : ("AllocatedDemand", "Allocated Demand"),
                        "Status": ("StatusLong", "Status"),
                        }
                    for fld in allocated_demand_locations_rename_fields:
                        arcpy.management.AlterField(self.allocatedDemandLocations, fld, 
                                                    *allocated_demand_locations_rename_fields[fld])
                    #provide string values for Status field
                    arcpy.management.AddField(self.allocatedDemandLocations, "Status", "TEXT", field_length=15,
                                              field_alias="Status")
                    with arcpy.da.UpdateCursor(self.allocatedDemandLocations, ("StatusLong", "Status")) as cursor:
                        for row in cursor:
                            cursor.updateRow((row[0], self.NETWORK_LOCATION_STATUS.get(row[0], str(row[0]))))
                    arcpy.management.DeleteField(self.allocatedDemandLocations, allocated_demand_locations_delete_fields)
                    #transfer fields from input demand points
                    self._transferFields(self.demandLocationsLayer, self.allocatedDemandLocations, "DemandOID")
            else:
                #TODO: Handle solve failures
                #Handle solve failure when none of the demand locations are within the maxTravelRange of
                #facilities.
                self.allocationLines, self.assignedFacilities, self.allocatedDemandLocations = "", "", ""      
        except Exception as ex:
            self.allocationLines, self.assignedFacilities, self.allocatedDemandLocations = "", "", ""
            raise
        finally:
            #Delete any temporary outputs
            orig_workspace = arcpy.env.workspace
            arcpy.env.workspace = self.outputWorkspace
            for dataset in arcpy.ListFeatureClasses("{}*".format(self.tempInputsStartName)) + arcpy.ListTables("{}*".format(self.tempInputsStartName)):
                try:
                   arcpy.management.Delete(dataset)
                   #pass
                except Exception as ex:
                    arcpy.AddMessage("Failed to delete {0}".format(os.path.join(self.outputWorkspace, dataset)))
            arcpy.env.workspace = orig_workspace

class CreateRouteLayerData(NetworkAnalysisTool):
    '''Return the JSON representation of route data feature classes that can be used to add route layer items'''

    #Static constants
    ERROR_CODES = dict(NetworkAnalysisTool.ERROR_CODES)
    ERROR_CODES[100212] = "Input route data file is not a valid zip file."
    ERROR_CODES[100213] = "Input route data does not contain the required Stops feature class."
    ERROR_CODES[100214] = "Input route data does not contain at least two stops."
    ERROR_CODES[100224] = "Failed to download route data from the route data item, {itemId}."
    ERROR_CODES[100225] = "Failed to delete the route data item, {itemId}."
    ERROR_CODES[100226] = "Failed to extract route data from the route data file."
    ERROR_CODES[100246] =  "Failed to create route layers for the following routes: {routeNames}."
    ERROR_CODES[100247] = "Failed to create route layers as the number of routes, {routeCount}, is greater than the maximum number of route layers, {max}, that can be created."


    def _init_constants(self):
        '''Define constants used in the class'''
    
        #Route data feature class names (rdFCN)
        self.RD_FCN_STOPS = "Stops"
        self.RD_FCN_ROUTE_INFO = "RouteInfo"
        self.RD_FCN_DIRECTIONS = "DirectionLines"
        self.RD_FCN_DIRECTION_EVENTS = "DirectionPoints"
        self.RD_FCN_BARRIERS = "Barriers"
        self.RD_FCN_POLYLINE_BARRIERS = "PolylineBarriers"
        self.RD_FCN_POLYGON_BARRIERS = "PolygonBarriers"

        #feature class name prefix for projected route data feature classes
        self.PRJ_FCN_POSTFIX = "prj"
        #Field name that stores route name in all route data feature classes
        self.ROUTE_NAME_FIELD = "RouteName"
        #Field name that stores the route id in all the route data feature classes except RouteInfo
        self.ROUTE_ID_FIELD = "RouteID"
        # WGS84 Stops feature class name
        self.FCN_STOPS_WGS84 = "StopsWGS84"

        #stops unique value renderer labels (SUVRL)
        self.SUVRL_FIRST = "First Stop"
        self.SUVRL_LAST = "Last Stop"
        self.SUVRL_WAYPOINT = "Waypoint"
        self.SUVRL_UNASSIGNED = "Unassigned Stop"
        self.SUVRL_INTERMEDIATE = "Intermediate Stop"

        #template used to represent a layer in a feature collection JSON. This dict should be deep copied before modifying
        self.FEATURE_COLLECTION_LAYER = {
            "layerDefinition": {
                "name": "",
                "title": "",
                "geometryType": "",
                "hasM": False,
                "hasZ": False,
                "objectIdField": "",
                "type" : "Feature Layer",
                "typeIdField" : "",
                "drawingInfo": {},
                "fields": [],
                "types" : [],
                "capabilities" : "Query",
                "extent": {},
            },
            "featureSet": {},
            "popupInfo": {
                "title": "",
                "fieldInfos": [],
                "description": "",
                "showAttachments" : False,
                "mediaInfos" : [],
            }
        }

        #template used to draw a line layer. This dict should be deep copied before modifying
        self.LINE_LAYER_DRAWING_INFO = {
            "transparency": 0,
            "fixedSymbols" : True,
		    "renderer" : {
			    "type" : "simple",
			    "symbol" : {
				    "color" : [0, 0 , 0, 0],
				    "width" : 0,
				    "type" : "esriSLS",
				    "style" : "esriSLSSolid"
			    }
		    }
	    }

        #drawing info used in the layer definition for Stops. The uniqueValueInfos needs to be populated before using
        #in the layer definition
        self.STOPS_DRAWING_INFO = {
		    "transparency": 0,
            "fixedSymbols" : True,
		    "renderer" : {
			    "type" : "uniqueValue",
			    "field1" : "Sequence",
                "defaultLabel": self.SUVRL_INTERMEDIATE,
			    "defaultSymbol" : {
				    "angle" : 0,
				    "xoffset" : 0,
				    "yoffset" : 9,
				    "type" : "esriPMS",
				    "imageData" : "iVBORw0KGgoAAAANSUhEUgAAABYAAAAgCAYAAAAWl4iLAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTZEaa/1AAAC4klEQVRIS5WWMYujQBiG/RnbprS0tE2ZMmVaS6slpBCxEbEIYYsQtljCFQemWLA5yBYHXnPgFgfZ4sAtDrLl/ozv3m/G0RkzXnLFs5t8jk9eP2dGHSIapX6rafO8o/Apo8XDkubrgMLHTNSOvyoMsZ/HXBTOH2cqf5Y0zwOaJiG5UUZeuid/XZEH3GRP7iojH8dmaYCxR5xmOhjjS/PeIFFMfhSQn5c0fTwb+FuJ98A05KYleauAApyje5he+ueMAUvyopim25MQzZ56bHJ33dAkr2myitGqEBqLONhCmmQXwiFK3qUWcoD26MnFn/1LIS7J3zadeP5F8dl91sVS3ovv0hN6H9L+ZS/kaEEjboKXH420UvhJi6/yP6OO6am7xCxPjrg/CykuviMtWsADzbRSqpByu9hV4pRbEovUDvfFTYsLMcsC5qDLL8Uei7t2gKigYBuTw9G9vBqIpYilCpX6qjiBC07HX0GMAbeJb0gM3HuIvSi0iGUrlFx9Hu3xQOxFS4itifvUvXRczFIzcdD2eH0yxLq8p5Ua4j7tpJXyfOb2OjyH3RTzDwPtcomqKanP/TUWSAvm8iwPyckOO+xge6MdulxHHGsDjPX3brWjDNuqU73y9MDKwwBOocv5sjthiy1tLz7hxgVUv9dyw+CtkjcRlVrI9R9g2jozmvY+pviwkUua/zDTRPZal9vg49a0UYnNPxBSQ1z9rkVLXOyv8mSI1I+033WpkVasNtmCCzFTd3JOjok+pBUaaS1SxhAzLJ8mCzzbik4ypJPi8qeYrkMpY3zR4fk9wTPNJrwmZS4KitMHVhAucZJWplD1FDdqTMpYi4rj6xGPm6W2XBmeqyFVb//5XjGEH7K8eSvxBKtUzdV/YS3q8OVyQpWW+zocY8NaHCJTl9gHbkvLWItDCrxyudFGPHR5IQ2P27AWbfAs0JfsNaxFG+ETXqPQkmF9DGvRRvmjpN03+ZZzHXL+Atsof8D3QNX7AAAAAElFTkSuQmCC",
				    "contentType" : "image/png",
				    "width" : 17,
				    "height" : 24
			    },
			    "uniqueValueInfos" : []
		    }
	    }

        #Symbols used for different types of stops
        self.FIRST_STOP_SYMBOL = {
		    "angle" : 0,
		    "xoffset" : 0,
		    "yoffset" : 9,
		    "type" : "esriPMS",
		    "imageData" : "iVBORw0KGgoAAAANSUhEUgAAABYAAAAgCAYAAAAWl4iLAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTZEaa/1AAADLElEQVRIS42WP2vbQBjG/VUyatR4640aNWormoroEEyGYryYksEYDyZ4MMGDIR4MzhBwhkCngDsE3KGQDh3yMTJen+c9nXQ6ndMKHlt+7/TTe++fOw+MMWd1/Hk0s/sbU62GpliUJp8Wck/b4eU7psSfo6LG/fNBIPo6M+lUGbXQRm8yUYr79FphTJvsOjecGz5P9Qz0SE0AWmcmfygaZdQ9lRu9o/CSJV4yVqZaVni0y+n8qFYVvIEnO8AesXRfD2UD1zVcEb7WJpmkEiqf1ULxVjUFlB56wMK7pyy8Bast4BvAER7fc/m4e7qTJfEBWXoNLJ6qVg7e8boGbxGStRLG7eOtwAXMJCjE1HnrQ0soW2Mcq1EIk17ZeY3XACuC6fUSiR5rC6a3EgLf2ycLznelSa8w+Uqb0WYk4n1yiapglTThsOB0oyTe9NrGFtnl8lowl16Z5EuKmp3Rg85FG8f0thtnAc9tIgd6jAGGIQDreWaKuWQ6enGM9dwDr2w4BvxgIkIwQ3B4keKPXhxLLtMeWPRVAcxmQKxCMJd6enutMf2LY8lnB25jTDHJA9ItGPKSR/v+eV9j+hfHJLERMMvOxhhLkXDUYEovEPdJXmP6l55g+dxHGAa/KlDPEmOp4VU/zhS9ZtW8v7/XOCP3tNHbpkEEWoNRyxleOpjtZiadB+FwcHynyMHFp0S8p3jPpWoAY4lLpqnUu3QeE9iEI4RDGet1CYjbPjHHedtpjrqtuVcLeLT9JpsIvfbhPREo0LAxLPgCXTdcjxixdnfLpnWsfbjIAn1o1NuFTdrrHynRFnz8fZRMswvtwzWoA6QctPXWdZt/XDVgqoXTc+8FDvifUKoDpghnCfLYEVAAbJcPKJZPR2IHa+eHrxwxF7gPDKFornOndc/gdHo72VMaCXWwBsrlo0TPQamo0Wn/4yBbYwtta/Xcse8UNfoql6Vs3oSKsD8M8RchnBcqavTFZLKtnbcMz/HXCUPx+U5RYygeNUwWPWeXhuMxRY2hbnY3dovEocsVhOMxRY2h2KaaG5XXsv9S1BhTiT04/Bv1kaLGmFhet/gPEtrjMoO/bgAlOuupzJ0AAAAASUVORK5CYII=",
		    "contentType" : "image/png",
		    "width" : 17,
		    "height" : 24
	    }

        self.WAYPOINT_STOP_SYMBOL = {
		    "color" : [255, 255, 255, 255],
		    "size" : 10,
		    "angle" : 0,
		    "xoffset" : 0,
		    "yoffset" : 0,
		    "type" : "esriSMS",
		    "style" : "esriSMSCircle",
		    "outline" : {
			    "color" : [20, 89, 127, 255],
			    "width" : 2.5,
			    "type" : "esriSLS",
			    "style" : "esriSLSSolid"
		    }
	    }

        self.LAST_STOP_SYMBOL = {
		    "angle" : 0,
		    "xoffset" : 0,
		    "yoffset" : 9,
		    "type" : "esriPMS",
		    "imageData" : "iVBORw0KGgoAAAANSUhEUgAAABYAAAAgCAYAAAAWl4iLAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTZEaa/1AAADBklEQVRIS62WsWvbQBTG9Sdk9OrRWwwZbMhiQwYbPNiQwYYMJmQIxYOHDiFr6djJo+lQULfLUFCHgrIU1KFwHQoetebPeP2+J519ks9uSBL4YutJ99O77969cyQiB2W/G0k/fZBkeS1mPpF42sf3mcY2PxI8Eh5HBYP5YyJmOpR40BZz3pCk15Rs0JLsoikJrs3ZicS9lsTjrtgHgyH7jL2AWVzrIII20y7Uls1lqTFio5bYQVMsXpZ2TmTdaYq5nWFolVO5SBYzMRhgCbsC1Jd7AeCWcGRvew3JAI8xgzp8+8UQeoGMCJn3Jadu+vp9M6/BXdaEwxoLuDmDRR5c/9mva0y/WUy9BOa31LD4dC9w8HG7kjXBmnkHM/i8UriC48u+ZHhwBx1KisFbjaiWpPA9way4mMk5BJADUyksWeO+gpmt4UIhGwfNF0NZnTa0vI6Jz3ARnR2FJcgeWau3zIQ+KhjQfDmRFTx7+mv59uDf0++sAHs+UwkX8mYCG1CrGaarNjDbJfT+5eCstCNao2bVhi14Ivnd7MVgirUdxWWJbf19AzArbJfxG4KLjOGxZdH7VrzGY4gu7NfwK6uCtWzAjNgCU9wM1XH68f6oQuDkFHDci3K8mXZUt/MQfQNdC1PSTyyGCruNbdRgx8WYUQxIsfMKMG1Y45nsIS672t07HcSsffhWuGZc75e9QhsRs/W2tMGLyCJTwfkfK/GoW3jtw0vtoJBrnbXu5vpEXqzLrm3mj6laYpkNIfqC8rMGrWQLMHcbDwf/uNqCqfxXAdfM9fRwAlChEKFetiEoVQFTNJ62aGMizMk/lspsOX1d+MDBWrlw0kphfQPggEEo+vSh03ov4LT5WdpCEIEeNGO5sccc+QkQDDrpIcBGrsASCl9jlKb9Fj72nYJBX2aOY4obgGUF8ThytXpMwaAvTlczLHcW7eEa1J+rKxisy1whaywWj53nZEsFg3XxcNQ+AZ+PLZivYDAkVoE72p+jYDAk/aUES+rxQwoGQ2J5ZV+KXzn/l0T/AJfvVAR5fRz8AAAAAElFTkSuQmCC",
		    "contentType" : "image/png",
		    "width" : 17,
		    "height" : 24
	    }

        self.UNLOCATED_STOP_SYMBOL = {
		    "angle" : 0,
		    "xoffset" : 0,
		    "yoffset" : 9,
		    "type" : "esriPMS",
		    "imageData" : "iVBORw0KGgoAAAANSUhEUgAAABYAAAAgCAYAAAAWl4iLAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTZEaa/1AAACiUlEQVRIS42VMWvcQBCF77+a/IDgKhxuwuEiCBfhSBGOFIFLEZCLwKUI2E3AKQJOEbgUgUuRwj9jM9+TZhmtxoqLZ+tmd799ejuSVqWURe3f78v2zbZ0r7qyuex0Te3w6WDD+RqUFvvrgyDAtq+3Zfd2V/Yf9gLWTV5uJOa269GsAGhzuRHo5suNdPh8GGQu++u+9B97jbPJ+mKtzVvO5AcTuqtOkJtbg0b5Bg2cu8E5dxFZEygCcvf1bqYM7vHs3u1qbBMwu3P7LBToW6IIj65HMFpfEGEvuMBAmeTQ++/3M1X46HoSxwj2zAVmMEYg0I9BWmAZch1dcw6ojQMNB98P2TIQ3R5/HjXp7NmZJPjomvleB96CGe+uthaDejHEYO4AH38Z3IARHn9zWFnOHofAbQxAT79P5fTnNIFV6NiSGRitXwCmGwLY3QJ9+PugDdjcoSyaHWADZv6KFllyTIbRLeJ2Fx17FEyagM01YBY5TJ1guUb4MtheNgzWwxvjiE6BUmec6CrcOqAFsyFz9FqkoDhGsPcteQpqvwW2zZnHwvPn50OrNe3GfA68PnnxcRbcBMSvqQs8HhxAubX/DkXEwPjwAjL78ekTZNzAr93t0rsCg7D0SPNncD1kXeGNKtTcZG83jPl7YgJmATuyQJBWDTTGoAMbu2sGRhWOcwNFOVTgEYrbDIomYCS4TWSRYC6HBrfcfgZFkx9RZC54BD4RimaFKGIB4kCH0qdLUJQWXYA8c2UKlLYy6GOffVdajNJH0g6IWBBPlvfqktJiFLeLw/oQ2HU7J1NabOWf9qe6RWmxFR9H4GjpwKLSYiYiiI/s/5QWMykKc9zWH1NazER70XZtPVdZ/QN2IySZrUmdSgAAAABJRU5ErkJggg==",
		    "contentType" : "image/png",
		    "width" : 17,
		    "height" : 24
	    }

        #drawing info used in the layer definition for direction points
        self.DIRECTION_EVENTS_DRAWING_INFO = {
            "fixedSymbols" : True,
            "transparency": 0,
		    "renderer" : {
			    "type" : "simple",
			    "symbol" : {
				    "color" : [100, 100, 255, 255],
				    "size" : 12,
				    "angle" : 0,
				    "xoffset" : 0,
				    "yoffset" : 0,
				    "type" : "esriSMS",
				    "style" : "esriSMSCircle",
				    "outline" : {
					    "color" : [255, 255, 255, 255],
					    "width" : 2,
					    "type" : "esriSLS",
					    "style" : "esriSLSSolid"
				    }
			    }
		    }
	    }

        #drawing info used in the layer definition for point barriers
        self.POINT_BARRIERS_DRAWING_INFO = 	{
           "fixedSymbols" : True,
	       "renderer":{
              "type":"uniqueValue",
              "field1":"BarrierType",
              "defaultSymbol":{
			     "color":[0, 138, 44, 255],
			     "style":"esriSMSCircle",
			     "type":"esriSMS",
			     "outline":{
				    "color":[0, 0, 0, 255],
				    "width":1.0
			     },
			     "size":4.0
		      },
              "defaultLabel":"<all other values>",
		      "uniqueValueInfos":[
			     {
				    "symbol":{
				       "angle" : 0,
		               "xoffset" : 0,
		               "yoffset" : 0,
		               "type" : "esriPMS",
		               "imageData" : "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTZEaa/1AAAByklEQVRIS7WVPU4DMRCF9yhwjEg05BiRKFBOgSIalCOkilYUSDkCDVJokHKE0CUFRY5h5hvbg71MYDeBJ739GXt+/MbebUIIP3L7vg2zu1lol22Y3EyM7XIR1i/PMsX3y3SNEOfx9TisnlZht9+JqQa2zdsmtI+tFiBw43wzUDHVrl/X8toBiY4kG12NAr6CKl71kquucC/VYWNq5sVltDGWcPg4uKuxB4i2BirtBvZIsmK1JCl7oxdIcNMah26g35hWQ4xUqBh1JEpjmpOk69yXKQZJslRi7UjTR5ZjRK6ELJVYQ8OLgrvnOIS3Uw3FFtYEHBjTnkHPaQjTKthVyNQkrSIYLCYNQi6u8J1J4xsuhk4Vg1CuPjWb3n41uNw95yZIkk/FVkuUd9C5CRJUouoMlJNOJUUmaJP1c5z78MfblB0qlv85aPOHuX5dxRplssMm+9d17sMkNZJXnwrIP8AO3ClS5QIFSXIx6kh8YDmVVCQ74XNNcBQRyKDOiA8wJ7GVcJdfpjaOQGVQkpeHVEBwGiuwmPaQuZMkyGU7qwT9cUBBvX6ZJVmmViTaev9ngmozZU5uqEfXmElFcUWLGEiIhJCgpdY+Q/MJtbNzCJoj+q0AAAAASUVORK5CYII=",
		               "contentType" : "image/png",
		               "width" : 18,
		               "height" : 18
				    },
				    "value":"0",
				    "label":"Restriction"
			     },
			     {
				    "symbol":{
				       "angle" : 0,
		               "xoffset" : 0,
		               "yoffset" : 0,
		               "type" : "esriPMS",
		               "imageData" : "iVBORw0KGgoAAAANSUhEUgAAABkAAAAYCAYAAAAPtVbGAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTZEaa/1AAABuklEQVRIS7WVsUrEQBCGfQwLC30MwUbLA19AsBArCb6EHBZHHuGwOEgj5BFyzUF8Ay2Es7C4B7CwsBjnn80su5vJmogufMnsn81k/91JskdEo9m+PvPJvpbDFIeY38+puCk47F/LYYoW1WpJ7VNLu/cd4WHp9RymaFHcigNpXWyOszDFFHVB64boYSlupiybKaaUi5JP3E7PiA6PJIQ2thBMMcS7YAcyHEx0Y4ohkQt9yMG+SLjWYAmD8RamqKCKMGNaVdxjKWSCG1NUfEVhH+64bL84Bog7N+2m/dGNKQLMMHLhErmGGNrVtYyZnc+gRveHmCKIXGAYNl6bFkFXafVjlXVjit06xxWVLpfqnZvc3vQE1L6vKE0ELi+IPj4diFXH3rxt2U096KYndOsbz1Z54ZcPpLq6GfjcRB3MBOsrLU0EMFPd9BC4kXttN1HHu+CZ9RIB7FG4TyEZNz5wLmoO0WNpKqg0zoFPED5FyKL4wFfUkIuh6go5OZYUqRs54Mnigqukd6Pi1to1xNYYYLiRQ7ngmaGFH8GUMU6A4Sb+IVk3/QbOFb6g0W/1r5u6kbJF5z9A7mbd0Deb57AijFvMOAAAAABJRU5ErkJggg==",
		               "contentType" : "image/png",
		               "width" : 19,
		               "height" : 18
				    },
				    "value":"2",
				    "label":"Added Cost"
			     }
		      ]
            },
	       "transparency":0
	    }
    
        #drawing info used in the layer definition for polygon barriers
        self.POLYGON_BARRIERS_DRAWING_INFO = {
           "fixedSymbols" : True,
	       "renderer":{
		      "type":"uniqueValue",
		      "field1":"BarrierType",
		      "defaultSymbol":{
			     "type":"esriSFS",
			     "style":"esriSFSSolid",
			     "color":[255, 0, 0, 255],
			     "outline":{
				    "type":"esriSLS",
				    "style":"esriSLSSolid",
				    "color":[255, 0, 0, 255],
				    "width":2.4
			     }
		      },
		      "defaultLabel":"<all other values>",
		      "uniqueValueInfos":[
			     {
				    "value":"0",
				    "label":"Restriction",
				    "symbol":{
				       "type":"esriSFS",
				       "style":"esriSFSSolid",
				       "color":[255, 0, 0, 156],
				       "outline":{
					      "type":"esriSLS",
					      "style":"esriSLSSolid",
					      "color":[255, 0, 0, 153],
					      "width":2.4
				       }
				    }
			     },
			     {
				    "value":"1",
				    "label":"Scaled Cost",
				    "symbol":{
				       "type":"esriSFS",
				       "style":"esriSFSSolid",
				       "color":[255, 170, 0, 156],
				       "outline":{
					      "type":"esriSLS",
					      "style":"esriSLSSolid",
					      "color":[255, 0, 0, 153],
					      "width":7.5
				       }
				    }
			     }
		      ]
	       },
	       "transparency": 40
	    }

        #template used to represent one route layer item data that can be used to create a route layer item. This dict 
        #should be deep copied before modifying
        self.ROUTE_LAYER_ITEM_DATA = {
            "visibility" : True,
            "layers": [],
            "visibleLayers" : [],
	        "opacity" : 1
        }
        #license info for each route
        self.ROUTE_LICENSE_INFO = "Directions are provided for planning purposes only and are subject to <a href='http://www.esri.com/legal/software-license' target='_blank'>Esri's terms of use</a>. Dynamic road conditions can exist that cause accuracy to differ from your directions and must be taken into account along with signs and legal restrictions. You assume all risk of use."

        #Fields that should be excluded when converting route data feature classes to layers in the route layer
        self.EXCLUDE_FIELDS = {
            self.RD_FCN_STOPS: ("RouteID", "StopOID", "IncidentOID", "FacilityOID"),
            self.RD_FCN_DIRECTION_EVENTS: ("RouteID", "StopOID", "IncidentOID", "FacilityOID"),
            self.RD_FCN_DIRECTIONS: ("RouteID", ),
        }

        # WKID fo WGS84 Spatial reference
        self.WKID_WGS84 = 4326

    def __init__(self, route_data_file, error_func=arcpy.AddError, warning_func=arcpy.AddWarning):
        '''Store tool parameters as instance attributes and initialize other members'''

        self._init_constants()
        self.DEBUG = False

        self.routeDataFile = route_data_file

        self.errorFunc = error_func
        self.warningFunc = warning_func
        
        self.outputCoordinateSystem = arcpy.env.outputCoordinateSystem
        self.outputWorkspace = arcpy.env.scratchFolder
        self.routeDataGDB = ""
        self.routeDataGDBDomains = {}
        
        #route data feature classes
        self.rdFeatureClasses = {
            self.RD_FCN_STOPS: "",
            self.RD_FCN_ROUTE_INFO: "",
            self.RD_FCN_DIRECTIONS: "",
            self.RD_FCN_DIRECTION_EVENTS: "",
            self.RD_FCN_BARRIERS: "",
            self.RD_FCN_POLYLINE_BARRIERS: "",
            self.RD_FCN_POLYGON_BARRIERS: "",
        }

        #route data feature layers
        self.rdFeatureLayers = {
            self.RD_FCN_STOPS: "",
            self.RD_FCN_ROUTE_INFO: "",
            self.RD_FCN_DIRECTIONS: "",
            self.RD_FCN_DIRECTION_EVENTS: "",
            self.RD_FCN_BARRIERS: "",
            self.RD_FCN_POLYLINE_BARRIERS: "",
            self.RD_FCN_POLYGON_BARRIERS: "",
        }

        # Information about stops in WGS84 SR
        self.wgs84Stops = {}
        
        #describe objects for route data feature classes
        self.rdFCDescribe = dict.fromkeys(list(self.rdFeatureClasses.keys()), None)
        
        #fields from route data featue classes that have domians
        self.rdFCFieldDomains = dict.fromkeys(list(self.rdFeatureClasses.keys()), None)     

        #validate inputs which also unzips the route data
        self._validateInputs()

        #Project route data feature classes to output coordinate system if it is different than the spatial reference
        #used by route data
        self._projectRouteData()

        #get a list of route names from the route data
        self.routeNames =  self._getRouteNames()
        self.routeCount = len(self.routeNames)

    @property
    def routeLayersItemDetails(self):
        """Return a dictionary of route id and the item JSON data that can be used to create route layer item.
        
        This should not be called if there are too many routes since this will cause the full dictionary to be first
        populated in memory. Instead use the iterator on CreateRouteLayerData instance which will only return one
        route at a time.
        """
        return {route_id: route_layer_data for route_id, route_layer_data in self}

    def _getFeatureClassFieldDomains(self, feature_class_name):
        '''return a dict with fields from a feature class that have domains. The domains are represented as JSON'''
        field_domains = {}

        for fld in self.rdFCDescribe[feature_class_name].fields:
            if fld.domain:
                field_domains[fld.name] = self.routeDataGDBDomains[fld.domain]

        return field_domains

    def _unzipFile(self):
        '''Unzip the route data file and set the path to the gdb containing the route data'''

        # Store field names from Stops
        #self.rdStopsFieldNames = []

        # Store the name of the route id field in Stops
        #self.stopsRIDField = "RouteID"

        route_data_file_names = []
        with zipfile.ZipFile(self.routeDataFile, "r") as zf:
            zf.extractall(self.outputWorkspace)
            route_data_file_names = zf.namelist()
        route_data_gdb_name = os.path.splitext(os.path.basename(self.routeDataFile))[0] + ".gdb"
        self.routeDataGDB = os.path.join(self.outputWorkspace, route_data_gdb_name)
        if not os.path.exists(self.routeDataGDB):
            # Determine the route data gdb name from the contents of the zip file
            if route_data_file_names:
                route_data_gdb_name = route_data_file_names[0].split("/")[0]
                self.routeDataGDB = os.path.join(self.outputWorkspace, route_data_gdb_name)
                if not os.path.exists(self.routeDataGDB):
                    raise ValueError("Route data GDB, {}, does not exist.".format(self.routeDataGDB))
            else:
                raise ValueError("Empty zip file contents")

        #Store GDB domains
        self._getGDBDomains()

        #Setup paths to route data feature classes. If a route data feature class does not exist, set its path to 
        #an empty string
        for fc_name in self.rdFeatureClasses:
            fc = os.path.join(self.routeDataGDB, fc_name)
            if arcpy.Exists(fc):
                feature_count = int(arcpy.management.GetCount(fc).getOutput(0))
                if feature_count:
                    self.rdFeatureClasses[fc_name] = fc
                    self.rdFCDescribe[fc_name] = arcpy.Describe(fc)
                    self.rdFeatureLayers[fc_name] = self._makeFeatureLayer(fc, fc_name)
                    self.rdFCFieldDomains[fc_name] = self._getFeatureClassFieldDomains(fc_name)
                    if fc_name == self.RD_FCN_STOPS:
                        # Depending on the version of the RouteData, the Stops can have a RouteID or just RouteName field
                        self.rdStopsFieldNames = [fld.name for fld in self.rdFCDescribe[self.RD_FCN_STOPS].fields]
                        self.stopsRIDField = self.ROUTE_ID_FIELD if self.ROUTE_ID_FIELD in self.rdStopsFieldNames else self.ROUTE_NAME_FIELD
                    # Create an attribute index based on the RouteID field for Stops, DirectionPoints and DirectionLines
                    self._addAttributeIndex(fc, fc_name)
                else:
                    self.rdFeatureClasses[fc_name] = ""
                    self.rdFeatureLayers[fc_name] = ""
                    self.rdFCDescribe[fc_name] = None
                    self.rdFCFieldDomains[fc_name] = None
            else:
                self.rdFeatureClasses[fc_name] = ""
                self.rdFeatureLayers[fc_name] = ""
                self.rdFCDescribe[fc_name] = None
                self.rdFCFieldDomains[fc_name] = None
    
    def _addAttributeIndex(self, feature_class, rd_fc_name):
        '''Add attribute index based on the route ID field for Stops, DirectionLines and DirectionPoints feature classes.
        
        Args:
            feature_class: The full catalog path to the route data feature class.
            rd_fc_name: The name of the route data feature class.
        '''
        if rd_fc_name == self.RD_FCN_STOPS:
            # Depending on the version of the RouteData, the Stops can have a RouteID or just RouteName field
            arcpy.management.AddIndex(feature_class, [self.stopsRIDField], self.stopsRIDField, "NON_UNIQUE",
                                      "NON_ASCENDING")
        elif rd_fc_name in (self.RD_FCN_DIRECTION_EVENTS, self.RD_FCN_DIRECTIONS):
            arcpy.management.AddIndex(feature_class, [self.ROUTE_ID_FIELD], self.ROUTE_ID_FIELD, "NON_UNIQUE",
                                      "NON_ASCENDING")
        else:
            pass
        
    def _makeFeatureLayer(self, feature_class, fc_name, exclude_fields=True):
        '''Make a feature layer from a feature class with certain fields being hidden.
        
        Args:
            feature_class: The full catalog path to the route data feature class.
            fc_name: The name of the route data feature class.
            exclude_fields: Hide fields in the feature layer if true.
        Returns:
            The string representating the output feature layer. 
        '''
        fc_layer = fc_name + "Layer"
        field_info = ""
        if exclude_fields and fc_name in self.EXCLUDE_FIELDS:
            exclude_fields = self.EXCLUDE_FIELDS[fc_name]
            field_info = arcpy.FieldInfo()
            for fld in self.rdFCDescribe[fc_name].fields:
                fld_name = fld.name
                fld_visible = "HIDDEN" if fld_name in exclude_fields else "VISIBLE"
                field_info.addField(fld_name, fld_name, fld_visible, "NONE")
        arcpy.management.MakeFeatureLayer(feature_class, fc_layer, field_info=field_info)
        return fc_layer

    
    def _getGDBDomains(self):
        '''Populate a dict representing domains defined on the route data GDB'''

        if not self.routeDataGDB:
            return

        #mapping between domain types as returned by arcpy.da.Domain object and domain types used in JSON representation
        DOMAIN_TYPES = {
            "CodedValue" : "codedValue",
            "Range": "range",
        }

        #Get a list of domains in the route GDB
        for domain in arcpy.da.ListDomains(self.routeDataGDB):
            domain_json = {}
            domain_name = domain.name
            domain_type = domain.domainType
            domain_json["name"] = domain.name
            domain_json["type"] = DOMAIN_TYPES.get(domain_type, "codedValue")
            if domain_type.lower() == "codedvalue":
                domain_json["codedValues"] = [dict(code=k, name=v)for k,v in domain.codedValues.items()]
            else:
                domain_json["range"] = list(domain.range)

            self.routeDataGDBDomains[domain_name] = domain_json

    def _validateInputs(self):
        '''validate the inputs before proceeding with the actual execution'''

        ##Error checks

        #Check if the route data zip file is a valid zip file
        if not zipfile.is_zipfile(self.routeDataFile):
            msg_code = 100212
            msg = self.ERROR_CODES[msg_code]
            self._addError(msg_code, msg)

        #unzip the route data zip file. If a ValueError exception is raised, quit.
        try:
            self._unzipFile()
        except ValueError as ex:
            arcpy.AddMessage(str(ex))
            msg_code = 100226
            msg = self.ERROR_CODES[msg_code]
            self._addError(msg_code, msg)

        #Check if the route data zip file contains route data. To perform this check make sure the route data gdb
        #has a feature class called stops and it has features
        if self.rdFeatureClasses[self.RD_FCN_STOPS]:
            stop_count = int(arcpy.management.GetCount(self.rdFeatureClasses[self.RD_FCN_STOPS]).getOutput(0))
            if stop_count < 2:
                msg_code = 100214
                msg = self.ERROR_CODES[msg_code]
                self._addError(msg_code, msg)

        else:
            msg_code = 100213
            msg = self.ERROR_CODES[msg_code]
            self._addError(msg_code, msg)

    def _featuresToJSON(self, rd_feature_class_name, where_clause="",):
        '''return the JSON representation of features from a route data feature class as a python dict'''

        feature_set_json = None
        extent_wgs84 = ""
        #extent string of format "XMin,YMin,XMax,YMax" with values in WGS84 is used by the extent property of the route
        #layer item
        features = self.rdFeatureClasses.get(rd_feature_class_name, "")
        if not features:
            return feature_set_json
        
        feature_set = arcpy.FeatureSet()

        if where_clause:
            #Get a new layer based on the where clause and exclude any fields
            # feature_layer = "FeatureLayer"
            # arcpy.management.MakeFeatureLayer(self.rdFeatureLayers[rd_feature_class_name], feature_layer, where_clause)
            feature_layer = self.rdFeatureLayers[rd_feature_class_name]
            arcpy.management.SelectLayerByAttribute(feature_layer, "NEW_SELECTION", where_clause)
            #Use the extent of the entire route data feature class. This will be inaccurate when a route data has
            #multiple routes. But we do not want to spend time calculating the accurate extent.
            extent = self.rdFCDescribe[rd_feature_class_name].extent
            extent_json = json.loads(extent.JSON)
            #Calculate the extent for the route layer based on extent of stops or RouteInfo in WGS84
            if rd_feature_class_name == self.RD_FCN_STOPS:
                extent_wgs84 = extent.projectAs(arcpy.SpatialReference(4326))
                #extent_wgs84 = "{},{},{},{}".format(extent_wgs84.XMin, extent_wgs84.YMin,
                #                                    extent_wgs84.XMax, extent_wgs84.YMax)
                extent_wgs84 = extent_wgs84.JSON
            elif rd_feature_class_name == self.RD_FCN_ROUTE_INFO:
                #Extent is the extent of the route feature
                with arcpy.da.SearchCursor(feature_layer, "SHAPE@") as cursor:
                    route_shape = cursor.next()[0]
                if route_shape:
                    extent_wgs84 = route_shape.extent.projectAs(arcpy.SpatialReference(4326))
                    extent_wgs84 = extent_wgs84.JSON

            feature_set.load(feature_layer)
            feature_set_json = json.loads(feature_set.JSON)
            #arcpy.management.Delete(feature_layer)
        else:
            features_desc = self.rdFCDescribe.get(rd_feature_class_name, None)
            if not features_desc:
                features_desc = arcpy.Describe(features)
            extent_json = json.loads(features_desc.extent.JSON)
            feature_set.load(features)
            feature_set_json = json.loads(feature_set.JSON)
        
        feature_class_field_domains = self.rdFCFieldDomains[rd_feature_class_name]
        
        #Determine the objectIdField and populate domains for the fields
        object_id_field = ""
        feature_set_fields = feature_set_json["fields"]
        for fld in feature_set_fields:
            fld_name = fld["name"]
            if fld["type"].lower() == "esrifieldtypeoid":
                object_id_field = fld["name"]
            if fld_name in feature_class_field_domains:
                fld["domain"] = feature_class_field_domains[fld_name]
                                  
        feature_set_json["extent"] = extent_json
        if extent_wgs84:
            feature_set_json["extentWGS84"] = extent_wgs84
        else:
            feature_set_json["extentWGS84"] = ""
        feature_set_json["objectIdField"] = object_id_field

        return feature_set_json

    def _getStopUniqueValueInfo(self, stop_features):
        '''Return unique value info for stops that can be used in the unique value renderer for drawing stops.'''

        #Store sequences for located stops that are not waypoints so as to determine the sequence for the
        #first and last stop
        sequences = []
        stop_types = {
            self.SUVRL_WAYPOINT : [],
            self.SUVRL_FIRST: "",
            self.SUVRL_LAST: "",
            self.SUVRL_UNASSIGNED: [], 
        }
        stop_unique_value_infos = []

        for stop in stop_features:
            stop_attributes = stop["attributes"]
            stop_sequence = stop_attributes["Sequence"]
            if stop_attributes["LocationType"] == 1:
                stop_types[self.SUVRL_WAYPOINT].append(stop_sequence)
            elif stop_attributes["Status"] not in (0, 6, 7):
                # Status value of 0 is for stops that are successfully located on the network. value 6 is for stops
                # with time window violation and value 7 is for stops not located on closest edge.Any other status 
                # value, like 1, is for stops that are unassigned for some reason such as they are not located on the
                # network
                stop_types[self.SUVRL_UNASSIGNED].append(stop_sequence)
            else:
                sequences.append(stop_sequence)
        # Sort sequences so that we do not rely on the digitized order of the stops. For example, when solving a TSP
        # with preserve none, the sequence values can be completely different than the digitized order. In such cases
        # we want to make sure the renderer is correct.
        if sequences:
            sequences.sort()
            stop_types[self.SUVRL_FIRST] = sequences[0]
            stop_types[self.SUVRL_LAST] = sequences[-1]

        for stop_type in stop_types:
            stop_sequence = stop_types[stop_type]
            if stop_sequence:
                if isinstance(stop_sequence, list):
                    stop_symbol = self.WAYPOINT_STOP_SYMBOL if stop_type == self.SUVRL_WAYPOINT else self.UNLOCATED_STOP_SYMBOL
                    for seq in stop_sequence:
                        stop_unique_value_infos.append(dict(value=seq, label=stop_type, symbol=stop_symbol))
                else:
                    stop_symbol = self.FIRST_STOP_SYMBOL if stop_type == self.SUVRL_FIRST else self.LAST_STOP_SYMBOL
                    stop_unique_value_infos.append(dict(value=stop_sequence, label=stop_type, symbol=stop_symbol))

        return stop_unique_value_infos

    def _getRouteNames(self):
        """Returns a dictionary of route id and route names"""
        
        route_names = {}
        #Get a list of route names
        #Derive route names from route info feature class if it is present 
        if self.rdFeatureClasses[self.RD_FCN_ROUTE_INFO]: 
            with arcpy.da.SearchCursor(self.rdFeatureClasses[self.RD_FCN_ROUTE_INFO],
                                      (self.rdFCDescribe[self.RD_FCN_ROUTE_INFO].oidFieldName,
                                       self.ROUTE_NAME_FIELD)) as cursor:
                # route_names = {row[0]: row[1] for row in cursor}
                # Assign a default name in case route name is null
                for row in cursor:
                    route_name = row[1] if row[1] else "Route {}".format(row[0])
                    route_names[row[0]] = route_name
        else:
            #get route names from stops
            with arcpy.da.SearchCursor(self.rdFeatureClasses[self.RD_FCN_STOPS],
                                      (self.ROUTE_ID_FIELD, self.ROUTE_NAME_FIELD)) as cursor:
                for row in cursor:
                    if row[0] and not row[0] in route_names:
                        route_names[row[0]] = row[1]
    
            if not route_names:
                #assume a fixed route name
                route_names[1] = "Route"
        
        return route_names

    
    def _projectRouteData(self):
        """Project route data feature classes to the output coordinate system if it is different than the spatial 
        reference used by route data."""

        #Derive the spatial reference for the route data based on the spatial reference of the stops feature class
        route_data_sr = self.rdFCDescribe[self.RD_FCN_STOPS].spatialReference
        if self.outputCoordinateSystem and self.outputCoordinateSystem.name != route_data_sr.name:
            #Keep projected feature classes in the route data gdb and prepend their names with "prj"
            for fc_name in self.rdFeatureClasses:
                fc = self.rdFeatureClasses[fc_name]
                if fc:
                    prj_fc = fc + self.PRJ_FCN_POSTFIX
                    # Not using copy features to project since it drops null geometries in output.
                    #arcpy.management.CopyFeatures(fc, prj_fc)
                    arcpy.management.Project(fc, prj_fc, self.outputCoordinateSystem)
                    self.rdFeatureClasses[fc_name] = prj_fc
                    self.rdFeatureLayers[fc_name] = self._makeFeatureLayer(prj_fc, fc_name + self.PRJ_FCN_POSTFIX)
                    self._addAttributeIndex(prj_fc, fc_name)
                    self.rdFCDescribe[fc_name] = arcpy.Describe(prj_fc)

        # Ensure we have Stops in WGS84 as they are required for creating navigator app links
        rd_stops_sr = self.rdFCDescribe[self.RD_FCN_STOPS].spatialReference
        if rd_stops_sr.name == "GCS_WGS_1984":
            arcpy.AddMessage("Route Stops are already in WGS84.")
            # Set StopsWGS84 feature layer to be same as route stops feature layer
            self.wgs84Stops["featureLayer"] = self.rdFeatureLayers[self.RD_FCN_STOPS]
            
        else:
            # Project route data stops in WGS84
            arcpy.AddMessage("Projecting Route Stops from {} to WGS84.".format(rd_stops_sr.name))
            prj_fc =  self.rdFeatureClasses[self.RD_FCN_STOPS] + self.PRJ_FCN_POSTFIX
            arcpy.management.Project(self.rdFeatureClasses[self.RD_FCN_STOPS], prj_fc, 
                                     arcpy.SpatialReference(self.WKID_WGS84))
            self.wgs84Stops["featureLayer"] = self._makeFeatureLayer(prj_fc, self.FCN_STOPS_WGS84 + self.PRJ_FCN_POSTFIX)
            self._addAttributeIndex(prj_fc, self.FCN_STOPS_WGS84)

    def _getWGS84StopsJSON(self, where_clause, stops_json):
        """Return a feature set JSON of route data stops in WGS84."""
        # return the input feature set if it is already in WGS84
        # WKID may not always be present for example if the input SR is a custom PCS
        stops_sr_wkid = stops_json["spatialReference"].get("wkid", 0)
        if stops_sr_wkid and stops_sr_wkid == self.WKID_WGS84:
            return stops_json
        stops_feature_set = arcpy.FeatureSet()
        feature_layer = self.wgs84Stops["featureLayer"]
        arcpy.management.SelectLayerByAttribute(feature_layer, "NEW_SELECTION", where_clause)
        stops_feature_set.load(feature_layer)
        return json.loads(stops_feature_set.JSON)

    def _constructNavigatorAppLink(self, route_where_clause, stops_feature_set):
        """Create an app link that can be used by Navigator."""
        link_title = "Navigator Stop List"
        title_font_size = 4
        app_link_template = "<div><br /></div><div><a href='arcgis-navigator://?{}' target='_blank'><font size='{}'>{}</a><br /></div>"
        stops = []
        # Make sure the stops are in WGS84
        stops_feature_set = self._getWGS84StopsJSON(route_where_clause, stops_feature_set)
        # Sort stops based on Sequence
        for stop in sorted(stops_feature_set["features"], key=lambda feature: feature["attributes"]["Sequence"]):
            stop_geom = stop["geometry"]
            stop_name = stop["attributes"]["Name"]
            # convert stop name to str as urlib.urlencode only supports strs
            if isinstance(stop_name, str):
                stop_name = stop_name.encode("utf-8")
            stops.append(("stop", "{},{}".format(stop_geom["y"], stop_geom["x"])))
            stops.append(("stopname", stop_name))
        
        return app_link_template.format(urllib.parse.urlencode(stops), title_font_size, link_title)


    def __iter__(self):
        '''main execution logic. Return a generator for a single route that consists of a route id and the data which
        can be used to create route layer items.'''
    
        #Get a list of route names
        route_names = self.routeNames
                
        # Depending on the version of the RouteData, the Stops can have a RouteID or just RouteName field
        #rd_stops_field_names = [fld.name for fld in self.rdFCDescribe[self.RD_FCN_STOPS].fields]
        #stops_rid_field = self.ROUTE_ID_FIELD if self.ROUTE_ID_FIELD in rd_stops_field_names else self.ROUTE_NAME_FIELD
        
        #If we have only one route, make sure the route name field for all stops has the route name
        #This is required only for route solver based route data when only one route is solved and if route data is
        # from v0 as v1 route data always populates RouteName on stops.
        if self.stopsRIDField in self.rdStopsFieldNames and len(route_names) == 1:
            arcpy.management.CalculateField(self.rdFeatureClasses[self.RD_FCN_STOPS], self.ROUTE_NAME_FIELD,
                                            "{}".format(repr(list(route_names.values())[0])), "PYTHON_9.3")
        #Get the JSON representation for all rows across route data feature classes that make up a route
        #Some route data feature classes like barriers are same for each route
        
        point_barriers_feature_set = self._featuresToJSON(self.RD_FCN_BARRIERS)
        line_barriers_feature_set = self._featuresToJSON(self.RD_FCN_POLYLINE_BARRIERS)
        polygon_barriers_feature_set = self._featuresToJSON(self.RD_FCN_POLYGON_BARRIERS)

        ##Populate feature collection layers for route data feature classes

        #Get drawing info and popup info for route info
        di_route_info = None
        route_info_hasz = False
        route_info_hasm = False
        route_info_popup_info = None
        if self.rdFeatureClasses[self.RD_FCN_ROUTE_INFO]:
            route_info_hasz = self.rdFCDescribe[self.RD_FCN_ROUTE_INFO].hasZ
            route_info_hasm = self.rdFCDescribe[self.RD_FCN_ROUTE_INFO].hasM
            di_route_info = copy.deepcopy(self.LINE_LAYER_DRAWING_INFO)
            di_route_info["renderer"]["symbol"]["color"] = [20, 89, 127, 255]
            di_route_info["renderer"]["symbol"]["width"] = 8
            route_info_popup_info = popup.feature_layer_popup(self.rdFCDescribe[self.RD_FCN_ROUTE_INFO], "{RouteName}",
                                                              hide_fields=self.EXCLUDE_FIELDS.get(self.RD_FCN_ROUTE_INFO, None))
        
        #Get drawing info and popup info for directions
        di_directions = None
        directions_popup_info = None
        directions_hasz = False
        directions_hasm = False
        if self.rdFeatureClasses[self.RD_FCN_DIRECTIONS]:
            di_directions = copy.deepcopy(self.LINE_LAYER_DRAWING_INFO)
            directions_hasz = self.rdFCDescribe[self.RD_FCN_DIRECTIONS].hasZ
            directions_hasm = self.rdFCDescribe[self.RD_FCN_DIRECTIONS].hasM
            di_directions["renderer"]["symbol"]["color"] = [0, 122, 194, 255]
            di_directions["renderer"]["symbol"]["width"] = 6
            directions_popup_info = popup.feature_layer_popup(self.rdFCDescribe[self.RD_FCN_DIRECTIONS], "{Text}",
                                                               hide_fields=self.EXCLUDE_FIELDS.get(self.RD_FCN_DIRECTIONS, None))

        #Get drawing info for polyline barriers
        di_line_barriers = None
        if line_barriers_feature_set:
            di_line_barriers = copy.deepcopy(self.LINE_LAYER_DRAWING_INFO)
            di_line_barriers["renderer"]["symbol"]["color"] = [255, 0, 0, 255]
            di_line_barriers["renderer"]["symbol"]["width"] = 6

        #Get popupInfo for stops
        stops_hasz = self.rdFCDescribe[self.RD_FCN_STOPS].hasZ
        stops_hasm = self.rdFCDescribe[self.RD_FCN_STOPS].hasM
        stops_popup_info = popup.feature_layer_popup(self.rdFCDescribe[self.RD_FCN_STOPS], "{Name}",
                                                     hide_fields=self.EXCLUDE_FIELDS.get(self.RD_FCN_STOPS, None))
        
        #Get popupinfo for direction points
        direction_events_popup_info = None
        direction_events_hasz = False
        direction_events_hasm = False
        if self.rdFeatureClasses[self.RD_FCN_DIRECTION_EVENTS]:
            direction_events_hasm = self.rdFCDescribe[self.RD_FCN_DIRECTION_EVENTS].hasM
            direction_events_hasz = self.rdFCDescribe[self.RD_FCN_DIRECTION_EVENTS].hasZ
            direction_events_popup_info = popup.feature_layer_popup(self.rdFCDescribe[self.RD_FCN_DIRECTION_EVENTS],
                                                                    "{DisplayText}",
                                                                    hide_fields=self.EXCLUDE_FIELDS.get(self.RD_FCN_DIRECTION_EVENTS, None))

        #Point Barriers
        if point_barriers_feature_set:
            barriers_feat_coll_layer = copy.deepcopy(self.FEATURE_COLLECTION_LAYER)
            barriers_feat_coll_layer_def = barriers_feat_coll_layer["layerDefinition"]
            barriers_feat_coll_layer_def["name"] = self.RD_FCN_BARRIERS
            barriers_feat_coll_layer_def["title"] = "Point Barriers"
            barriers_feat_coll_layer_def["geometryType"] = point_barriers_feature_set["geometryType"]
            barriers_feat_coll_layer_def["hasM"] = self.rdFCDescribe[self.RD_FCN_BARRIERS].hasM
            barriers_feat_coll_layer_def["hasZ"] = self.rdFCDescribe[self.RD_FCN_BARRIERS].hasZ
            barriers_feat_coll_layer_def["fields"] = point_barriers_feature_set["fields"]
            barriers_feat_coll_layer_def["objectIdField"] = point_barriers_feature_set.pop("objectIdField")
            barriers_feat_coll_layer_def["extent"] = point_barriers_feature_set.pop("extent")
            barriers_feat_coll_layer_def["drawingInfo"] = self.POINT_BARRIERS_DRAWING_INFO
            barriers_feat_coll_layer["featureSet"] = point_barriers_feature_set
            barriers_feat_coll_layer["popupInfo"] = popup.feature_layer_popup(self.rdFCDescribe[self.RD_FCN_BARRIERS],
                                                                              barriers_feat_coll_layer_def["title"],
                                                                              hide_fields=self.EXCLUDE_FIELDS.get(self.RD_FCN_BARRIERS, None))
            
        #Polyline Barriers
        if line_barriers_feature_set:
            line_barriers_feat_coll_layer = copy.deepcopy(self.FEATURE_COLLECTION_LAYER)
            line_barriers_feat_coll_layer_def = line_barriers_feat_coll_layer["layerDefinition"]
            line_barriers_feat_coll_layer_def["name"] = self.RD_FCN_POLYLINE_BARRIERS
            line_barriers_feat_coll_layer_def["title"] = "Polyline Barriers"
            line_barriers_feat_coll_layer_def["geometryType"] = line_barriers_feature_set["geometryType"]
            line_barriers_feat_coll_layer_def["hasM"] = self.rdFCDescribe[self.RD_FCN_POLYLINE_BARRIERS].hasM
            line_barriers_feat_coll_layer_def["hasZ"] = self.rdFCDescribe[self.RD_FCN_POLYLINE_BARRIERS].hasZ
            line_barriers_feat_coll_layer_def["fields"] = line_barriers_feature_set["fields"]
            line_barriers_feat_coll_layer_def["objectIdField"] = line_barriers_feature_set.pop("objectIdField")
            line_barriers_feat_coll_layer_def["extent"] = line_barriers_feature_set.pop("extent")
            line_barriers_feat_coll_layer_def["drawingInfo"] = di_line_barriers
            line_barriers_feat_coll_layer["featureSet"] = line_barriers_feature_set
            line_barriers_feat_coll_layer["popupInfo"] = popup.feature_layer_popup(self.rdFCDescribe[self.RD_FCN_POLYLINE_BARRIERS],
                                                                                   line_barriers_feat_coll_layer_def["title"],
                                                                                   hide_fields=self.EXCLUDE_FIELDS.get(self.RD_FCN_POLYLINE_BARRIERS, None))

        #Polygon Barriers
        if polygon_barriers_feature_set:
            polygon_barriers_feat_coll_layer = copy.deepcopy(self.FEATURE_COLLECTION_LAYER)
            polygon_barriers_feat_coll_layer_def = polygon_barriers_feat_coll_layer["layerDefinition"]
            polygon_barriers_feat_coll_layer_def["name"] = self.RD_FCN_POLYGON_BARRIERS
            polygon_barriers_feat_coll_layer_def["title"] = "Polygon Barriers"
            polygon_barriers_feat_coll_layer_def["geometryType"] = polygon_barriers_feature_set["geometryType"]
            polygon_barriers_feat_coll_layer_def["hasM"] = self.rdFCDescribe[self.RD_FCN_POLYGON_BARRIERS].hasM
            polygon_barriers_feat_coll_layer_def["hasZ"] = self.rdFCDescribe[self.RD_FCN_POLYGON_BARRIERS].hasZ
            polygon_barriers_feat_coll_layer_def["fields"] = polygon_barriers_feature_set["fields"]
            polygon_barriers_feat_coll_layer_def["objectIdField"] = polygon_barriers_feature_set.pop("objectIdField")
            polygon_barriers_feat_coll_layer_def["extent"] = polygon_barriers_feature_set.pop("extent")
            polygon_barriers_feat_coll_layer_def["drawingInfo"] = self.POLYGON_BARRIERS_DRAWING_INFO
            polygon_barriers_feat_coll_layer["featureSet"] = polygon_barriers_feature_set
            polygon_barriers_feat_coll_layer["popupInfo"] = popup.feature_layer_popup(self.rdFCDescribe[self.RD_FCN_POLYGON_BARRIERS],
                                                                                      polygon_barriers_feat_coll_layer_def["title"],
                                                                                      hide_fields=self.EXCLUDE_FIELDS.get(self.RD_FCN_POLYGON_BARRIERS, None))

        for route_id in route_names:
            route_name = route_names[route_id]
            layer_index = -1
            route_extent_wgs84 = ""
            route_layer_item_data = copy.deepcopy(self.ROUTE_LAYER_ITEM_DATA)
            # Stops can have a RouteID and RouteName or Just RouteName field
            if self.stopsRIDField == self.ROUTE_ID_FIELD:
                route_where_clause = "{} = {}".format(self.ROUTE_ID_FIELD, route_id)
            else:
                route_where_clause = "{} = '{}'".format(self.ROUTE_NAME_FIELD, route_name)
            stops_feature_set = self._featuresToJSON(self.RD_FCN_STOPS, route_where_clause)
            # RouteInfo does not have RouteID field but ObjectID on RouteInfo is RouteID
            route_where_clause = "{} = {}".format(self.rdFCDescribe[self.RD_FCN_ROUTE_INFO].oidFieldName, route_id)
            route_info_feature_set = self._featuresToJSON(self.RD_FCN_ROUTE_INFO, route_where_clause)
            # DirectionPoints and DirectionLines have a RouteID field
            route_where_clause = "{} = {}".format(self.ROUTE_ID_FIELD, route_id)
            direction_events_feature_set = self._featuresToJSON(self.RD_FCN_DIRECTION_EVENTS, route_where_clause)
            directions_feature_set = self._featuresToJSON(self.RD_FCN_DIRECTIONS, route_where_clause)
            
            ##Populate feature collection layers for route data feature classes
            ##Add polygon layers followed by line layers and then point layers. Layers in map viewer are drawn in the 
            #reverse order as they are added to route_layer_item_data list
            
            #Polygon Barriers
            if polygon_barriers_feature_set:
                route_layer_item_data["layers"].append(polygon_barriers_feat_coll_layer)
                layer_index += 1
                route_layer_item_data["visibleLayers"].append(layer_index)
            #Polyline Barriers
            if line_barriers_feature_set:
                route_layer_item_data["layers"].append(line_barriers_feat_coll_layer)
                layer_index += 1
                route_layer_item_data["visibleLayers"].append(layer_index)
            #RouteInfo
            if route_info_feature_set:
                route_info_feat_coll_layer = copy.deepcopy(self.FEATURE_COLLECTION_LAYER)
                route_info_feat_coll_layer_def = route_info_feat_coll_layer["layerDefinition"]
                route_info_feat_coll_layer_def["name"] = self.RD_FCN_ROUTE_INFO
                route_info_feat_coll_layer_def["title"] = "Route Details"
                route_info_feat_coll_layer_def["geometryType"] = route_info_feature_set["geometryType"]
                route_info_feat_coll_layer_def["hasM"] = route_info_hasm
                route_info_feat_coll_layer_def["hasZ"] = route_info_hasz
                route_info_feat_coll_layer_def["fields"] = route_info_feature_set["fields"]
                route_info_feat_coll_layer_def["objectIdField"] = route_info_feature_set.pop("objectIdField")
                route_info_feat_coll_layer_def["extent"] = route_info_feature_set.pop("extent")
                route_extent_wgs84 = route_info_feature_set.pop("extentWGS84")
                route_info_feat_coll_layer_def["drawingInfo"] = di_route_info
                route_info_feat_coll_layer["featureSet"] = route_info_feature_set
                route_info_feat_coll_layer["popupInfo"] = route_info_popup_info
                route_layer_item_data["layers"].append(route_info_feat_coll_layer)
                layer_index += 1
                route_layer_item_data["visibleLayers"].append(layer_index)

            #Directions
            if directions_feature_set:
                directions_feat_coll_layer = copy.deepcopy(self.FEATURE_COLLECTION_LAYER)
                directions_feat_coll_layer_def = directions_feat_coll_layer["layerDefinition"]
                directions_feat_coll_layer_def["name"] = self.RD_FCN_DIRECTIONS
                directions_feat_coll_layer_def["title"] = "Direction Lines"
                directions_feat_coll_layer_def["geometryType"] = directions_feature_set["geometryType"]
                directions_feat_coll_layer_def["hasM"] = directions_hasm
                directions_feat_coll_layer_def["hasZ"] = directions_hasz
                directions_feat_coll_layer_def["fields"] = directions_feature_set["fields"]
                directions_feat_coll_layer_def["objectIdField"] = directions_feature_set.pop("objectIdField")
                directions_feat_coll_layer_def["extent"] = directions_feature_set.pop("extent")
                directions_feat_coll_layer_def["drawingInfo"] = di_directions
                directions_feat_coll_layer["featureSet"] = directions_feature_set
                directions_feat_coll_layer["popupInfo"] = directions_popup_info
                route_layer_item_data["layers"].append(directions_feat_coll_layer)
                layer_index += 1

            #Point Barriers
            if point_barriers_feature_set:
                route_layer_item_data["layers"].append(barriers_feat_coll_layer)
                layer_index += 1
                route_layer_item_data["visibleLayers"].append(layer_index)
            #Direction Points
            if direction_events_feature_set:
                direction_events_feat_coll_layer = copy.deepcopy(self.FEATURE_COLLECTION_LAYER)
                direction_events_feat_coll_layer_def = direction_events_feat_coll_layer["layerDefinition"]
                direction_events_feat_coll_layer_def["name"] = self.RD_FCN_DIRECTION_EVENTS
                direction_events_feat_coll_layer_def["title"] = "Direction Points"
                direction_events_feat_coll_layer_def["geometryType"] = direction_events_feature_set["geometryType"]
                direction_events_feat_coll_layer_def["hasM"] = direction_events_hasm
                direction_events_feat_coll_layer_def["hasZ"] = direction_events_hasz
                direction_events_feat_coll_layer_def["fields"] = direction_events_feature_set["fields"]
                direction_events_feat_coll_layer_def["objectIdField"] = direction_events_feature_set.pop("objectIdField")
                direction_events_feat_coll_layer_def["extent"] = direction_events_feature_set.pop("extent")
                direction_events_feat_coll_layer_def["drawingInfo"] = self.DIRECTION_EVENTS_DRAWING_INFO
                direction_events_feat_coll_layer["featureSet"] = direction_events_feature_set
                direction_events_feat_coll_layer["popupInfo"] = direction_events_popup_info
                route_layer_item_data["layers"].append(direction_events_feat_coll_layer)
                layer_index += 1
                # Make direction points visible only if RouteInfo has features
                if route_extent_wgs84:
                    route_layer_item_data["visibleLayers"].append(layer_index)

            #Stops
            stops_feat_coll_layer = copy.deepcopy(self.FEATURE_COLLECTION_LAYER)
            stops_feat_coll_layer_def = stops_feat_coll_layer["layerDefinition"]
            stops_feat_coll_layer_def["name"] = self.RD_FCN_STOPS
            stops_feat_coll_layer_def["title"] = self.RD_FCN_STOPS
            stops_feat_coll_layer_def["geometryType"] = stops_feature_set["geometryType"]
            stops_feat_coll_layer_def["hasM"] = stops_hasm
            stops_feat_coll_layer_def["hasZ"] = stops_hasz
            stops_feat_coll_layer_def["fields"] = stops_feature_set["fields"]
            stops_feat_coll_layer_def["objectIdField"] = stops_feature_set.pop("objectIdField")
            stops_feat_coll_layer_def["extent"] = stops_feature_set.pop("extent")
            #If RouteInfo has no features, calculate extent for the route based on the stops for the route
            if route_extent_wgs84:
                stops_feature_set.pop("extentWGS84")
            else:
                route_extent_wgs84 = stops_feature_set.pop("extentWGS84")
            #Construct the unique value renderer for the stops based on the stop sequence and the type of stop
            #such as first stop, last stop, waypoint, unlocated stop
            stops_drawing_info = copy.deepcopy(self.STOPS_DRAWING_INFO)
            stops_drawing_info["renderer"]["uniqueValueInfos"] = self._getStopUniqueValueInfo(stops_feature_set["features"])
            stops_feat_coll_layer_def["drawingInfo"] = stops_drawing_info
            stops_feat_coll_layer["featureSet"] = stops_feature_set
            stops_feat_coll_layer["popupInfo"] = stops_popup_info
            route_layer_item_data["layers"].append(stops_feat_coll_layer)
            layer_index += 1
            route_layer_item_data["visibleLayers"].append(layer_index)

            #Store item info for a route
            route_snippet = "Route and directions for {}".format(route_name)
            route_description = route_snippet  # + self._constructNavigatorAppLink(route_where_clause, stops_feature_set)
            route_layer_item = {
                "text": route_layer_item_data,
                "extent":  route_extent_wgs84,
                "title": route_name,
                "type": "Feature Collection",
                "typeKeywords": "Data, Feature Collection, Multilayer, Route Layer",
                "description": route_description,
                "tags": "route, route layer, {}".format(route_name),
                "snippet": route_snippet,
                "thumbnailUrl": "",
                "licenseInfo": self.ROUTE_LICENSE_INFO,
            }
            yield route_id, route_layer_item
            

class LayerInfo(object):
    '''Store describe object and other useful information about feature layers'''

    def __init__(self, dataset):
        #If the dataset is None return LayerInfo with empty properties
        self.count = 0
        self.describe = None
        self.name = ""
        self.layer = None
        if dataset:
            #if dataset is a hosted layer, then we already have layer, layername and count
            #and we describe the layer derived from the hosted layer
            if hasattr(dataset, "count") and not isinstance(dataset, str):
                self.name = dataset.layername
                self.count = dataset.count
                self.layer = dataset.name
                if self.count:
                    self.describe = arcpy.Describe(self.layer)
            else:
                if arcpy.Exists(dataset):
                    self.count = int(arcpy.management.GetCount(dataset).getOutput(0))
                    self.describe = arcpy.Describe(dataset)
                    if self.describe.dataType == "FeatureLayer":
                        self.layer = dataset
                        self.name = self.describe.namestring
                    else:
                        self.name = self.describe.name
                        arcpy.management.MakeFeatureLayer(dataset, self.name)
                        self.layer = self.name
    