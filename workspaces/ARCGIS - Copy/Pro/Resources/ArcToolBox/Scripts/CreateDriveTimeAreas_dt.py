"""---------------------------------------------------------------------------
Name:              createdrivetimeareas.py
Purpose:           Drive time or drive distance areas
Author:            Esri Inc.
Created:           4/29/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.2
---------------------------------------------------------------------------"""

#core libraries
import json
import time
import re
import os
import analysisutils

#Internal libraries
import arcpy


#constants
TIME_UNITS = ("minutes", "seconds", "hours")
TASK_NAME = "CreateDriveTimeAreas"
MEASURE_TYPES = {
    "Driving" : ("drive time", "drive distance"),
    "Trucking" : ("truck time", "truck distance"),
    "Walking" : ("walk time", "walk distance"),
}
DEBUG = False

#Change these values based on what GenerateServiceAreas tool on logistics.arcgis.com supports
MAX_FACILITIES_COUNT = 1000
MAX_SEARCH_TOLERANCE_KM = 20
MAX_BREAK_VALUE = 300


ERROR_CODES = {
    100024: "The number of features in {inputLayer} is zero.",
    100039 : "The {inputLayer} must have a point geometry type.",
    100040 : "The number of features in {inputLayer} cannot be greater than {max}.",
    100099: "All break values must be greater than zero.",
    100100: "The features in {inputLayer} are not within the data coverage area. See availability at {url}.",
    100101: "No features in {inputLayer} are within a distance of {max} kilometers from streets.",
    100102: "All features in {inputLayer} must be in the same time zone when using traffic and creating areas with dissolve or split options.",
    100103: "The {measureType} value cannot be greater than {max} {breakUnits}.",
    100117: "Driving a truck is currently not supported outside of North America and Central America.",
}

INVALID_LOCATIONS_SOLVER_ERROR_MESSAGE = 'Insufficient number of valid locations in "Facilities".'
DIFFERENT_TIME_ZONE_ERROR_MESSAGE = 'The service area solver does not support facilities in different time zones when generating non-overlapping polygons, merged polygons or non-overlapping lines.'
#parameter index for the restrictions parameter in the ServiceAreas services on logistics.arcgis.com
RESTRICTIONS_PARAMETER_INDEX = 16
system_error_codes = [30096, 30097, 30109, 30120, 30122, 30123]

def check_service_area_limits(input_layer_count, input_layer_name, break_values, break_units, travel_mode,
                              check_max_facilities=True):
    '''Checks if the inputs can be successfully used to create service areas using the World service areas service.
    Returns a tuple of the format (error_code, error_msg, error_msg_params) that can be passed to
    aolutils.AddErrorCode to raise an error.'''

    break_units_lower = break_units.lower()
    failed_limits = None

    #Determine if we are generating time or distance based service areas
    if break_units_lower in TIME_UNITS:
        drive_measure_type = MEASURE_TYPES.get(travel_mode)[0]
    else:
        drive_measure_type = MEASURE_TYPES.get(travel_mode)[1]

    #Fail if any break value is greater than the max supported by logistics service
    #need to report the max supported value in user specified breakUnits
    max_break_values = {
        "minutes" : MAX_BREAK_VALUE,
        "seconds" : MAX_BREAK_VALUE * 60,
        "hours" : MAX_BREAK_VALUE / 60,
        "miles" : MAX_BREAK_VALUE,
        "kilometers" : round(MAX_BREAK_VALUE * 1.60934, 2),
        "meters": round(MAX_BREAK_VALUE * 1609.34, 2),
        "feet" : MAX_BREAK_VALUE * 5280,
        "yards" : MAX_BREAK_VALUE * 1760
        }
    max_break_value = max_break_values.get(break_units_lower, MAX_BREAK_VALUE)

    #Fail if any break values are less than or equal to zero
    for break_val in break_values:
        if break_val <= 0:
            failed_limits = (100099, ERROR_CODES[100099])
            return failed_limits
            #aolutils.AddErrorCode(100099, ERROR_CODES[100099])
            #raise arcpy.ExecuteError
        if break_val > max_break_value:
            msg_code = 100103
            msg_params = {
                "max": max_break_value,
                "breakUnits": break_units_lower,
                "measureType": drive_measure_type.lower(),
                }
            msg = ERROR_CODES[msg_code].format(**msg_params)
            failed_limits = (msg_code, msg, msg_params)
            return failed_limits
            #aolutils.AddErrorCode(msg_code, msg, msg_params)
            #raise arcpy.ExecuteError

    #Fail if we have more than MAX_FACILITIES_COUNT number of features in input layer
    if check_max_facilities and input_layer_count > MAX_FACILITIES_COUNT:
        msg_params = {
            "inputLayer" : input_layer_name,
            "max" : MAX_FACILITIES_COUNT,
        }
        failed_limits = (100040, ERROR_CODES[100040].format(**msg_params), msg_params)
        return failed_limits
        #aolutils.AddErrorCode(100040, ERROR_CODES[100040].format(**msg_params), msg_params)
        #raise arcpy.ExecuteError

    return failed_limits

def create_drive_time_areas(input_layer, break_values, break_units, time_of_day,
                            overlap_policy="Overlap", input_layer_name=None,
                            time_zone_for_time_of_day="GeoLocal", travel_mode="Driving"):
    '''Call the remote GP tool GenerateServiceAreas and return the output polygons in in_memory workspce and
    the time elapsed to execute the function.
    @@hostedgp is the hosted gp environment from the caller. It is used to get the token and determine the URL
    to remote service.
    @@hosted_input is the input layer. It can be obtained from your hostedgp instance using
    hosted_input = hostedgp.GetHostedLayer(input_index).name
    input_layer_name should be the name of the hosted input layer which is obtained using
    hostedgp.GetHostedLayer(input_index).layername. If this is not specified, the input_layer_name is
    derived from input_layer using os.path.basename which may not be correct.
    '''

    try:
        global input_layer_count

        # Initiate start time
        startTime = time.time()
        func_start = startTime

        break_units_lower = break_units.lower()

        #Determine if we are generating drive time or drive distance based service areas
        if break_units_lower in TIME_UNITS:
            drive_measure_type = MEASURE_TYPES.get(travel_mode)[0]
        else:
            drive_measure_type = MEASURE_TYPES.get(travel_mode)[1]

        #Derive some values based on inputs
        input_layer_desc = arcpy.Describe(input_layer)
        break_values_str = " ".join([str(val) for val in break_values])

        if not input_layer_name:
            input_layer_name = os.path.basename(input_layer_desc.catalogPath)

        #paramsDict used with AddErrorCode
        input_layer_param_dict = {"inputLayer" : input_layer_name}

        input_layer_count = int(arcpy.management.GetCount(input_layer).getOutput(0))
        #If input is an empty feature service, shapeType may return "Any". So perform input count check

        #Fail if we donlt have at least one feature in input layer
        if input_layer_count < 1:
            #aolutils.AddErrorCode(100024, ERROR_CODES[100024].format(**input_layer_param_dict), input_layer_param_dict)
            arcpy.gp.addError(ERROR_CODES[100024].format(**input_layer_param_dict), 100024)
            raise SystemExit


        #Fail if any break value is greater than the max supported by logistics service
        #need to report the max supported value in user specified breakUnits
        max_break_values = {
            "minutes" : MAX_BREAK_VALUE,
            "seconds" : MAX_BREAK_VALUE * 60,
            "hours" : MAX_BREAK_VALUE / 60,
            "miles" : MAX_BREAK_VALUE,
            "kilometers" : round(MAX_BREAK_VALUE * 1.60934, 2),
            "meters": round(MAX_BREAK_VALUE * 1609.34, 2),
            "feet" : MAX_BREAK_VALUE * 5280,
            "yards" : MAX_BREAK_VALUE * 1760
            }
        max_break_value = max_break_values.get(break_units_lower, MAX_BREAK_VALUE)
        #Fail if any break values are less than or equal to zero
        for break_val in break_values:
            if break_val <= 0:
                arcpy.gp.addError(ERROR_CODES[100099], 100099)
                raise SystemExit
            if break_val > max_break_value:
                msg_code = 100103
                msg_params = {
                    "max": max_break_value,
                    "breakUnits": break_units_lower,
                    "measureType": drive_measure_type.lower(),
                    }
                msg = ERROR_CODES[msg_code].format(**msg_params)
                arcpy.gp.addError(msg, msg_code)
                raise SystemExit


        #If extent is specified select the features that are within the extent
        #Need to select features only if the input is a feature collection as GetHostedLayer
        #for feature service inputs already filters based on extent
        #arcpy.AddMessage("arcpy.env.extent: " + str(arcpy.env.extent))

        #arcpy.AddMessage("Input features before extent filter applied: {0}".format(input_layer_count))
        #if arcpy.env.extent:
            ##is_input_layer_a_service = True if input_layer_desc.catalogPath.find(".sde") != -1 else False
            #is_input_layer_a_service = False
            #if is_input_layer_a_service == False:
                ##input_layer = aolutils.selectFeaturesbyExtent(input_layer)
                #input_layer_count = aolutils.selectFeaturesbyExtent(input_layer)
                ##input_layer_count = int(arcpy.management.GetCount(input_layer).getOutput(0))
                #arcpy.AddMessage("Input features after extent filter applied: {0}".format(input_layer_count))
        #startTime = aolutils.AddTimerMessage(startTime, "Read Input Layer")

        #Fail if we donlt have at least one feature in input layer
        if input_layer_count < 1:
            arcpy.gp.addError(ERROR_CODES[100024].format(**input_layer_param_dict), 100024)
            raise SystemExit

        output_workspace = analysisutils.getOutputWkspc(input_layer)

        ##Check if any limits imposed by logistics service is exceeded
        failed_limits = check_service_area_limits(input_layer_count, input_layer_name, break_values, break_units,
                                                  travel_mode)

        if failed_limits:
            arcpy.gp.addError(failed_limits[1], failed_limits[0])
            raise SystemExit

        drive_time_areas_output = "{0}/{1}AreasOutput".format(output_workspace,
                                                              drive_measure_type.replace(" ",""))
        #arcpy.AddMessage("Output features: {}".format(drive_time_areas_output))


        #Get the URL to the async service area service
        #tbx = aolutils.getRemoteToolbox(hostedgp, "asyncServiceArea")
        #Add the GP service as a toolbox
        tbx = "https://logisticsdev.arcgis.com/arcgis/services;World/ServiceAreas;network;network"
        # uncomment for pro
        tokenJSON = arcpy.GetSigninToken()
        token = tokenJSON["token"]
        referer = tokenJSON["referer"]
        serviceUrl = "https://logistics.arcgis.com/arcgis/services;World/ServiceAreas"
        tbx = "{};token={};{}".format(serviceUrl,token, referer)
        #arcpy.AddMessage("Adding remote toolbox {0}".format(tbx))
        #Call the service
        overlap_policy_keywords = {"Overlap" : "Overlapping",
                                   "Dissolve" : "Merge by Break Value",
                                   "Split" : "Not Overlapping"}
        time_zone_keywords = {"GeoLocal" : "Geographically Local",
                              "UTC": "UTC"}

        task_params = [input_layer, break_values_str, break_units, "", "", time_of_day, "", "",
                       overlap_policy_keywords[overlap_policy], "", "", "", "", "", "", "", "", "",
                       time_zone_keywords[time_zone_for_time_of_day], travel_mode]
        ignore_error_codes = (30097,30113,30114)
        service_result = call_async_gp_service(tbx, "GenerateServiceAreas", task_params,
                                                ignore_error_codes, (RESTRICTIONS_PARAMETER_INDEX,))
        #Reset the timer as the callAsyncGPService handles its own timing
        startTime = time.time()

        #Save the results from the remote tool. project the output features to be in the same spatial reference
        #as the inputLayer using copy features. Make sure to clear out the extent before copy
        if DEBUG:
            out_sr = arcpy.env.outputCoordinateSystem
            out_sr_name = out_sr.name if out_sr else "None"
            #arcpy.AddMessage("arcpy.env.outputCoordinateSystem: {0} ".format(out_sr_name))
        orig_extent = arcpy.env.extent
        orig_out_sr = arcpy.env.outputCoordinateSystem
        arcpy.env.extent = None
        arcpy.env.outputCoordinateSystem = input_layer_desc.spatialReference
        #arcpy.AddMessage(drive_time_areas_output)
        fs = service_result.getOutput(0)
        fs.save(drive_time_areas_output)
        #arcpy.management.CopyFeatures(service_result.getOutput(0), drive_time_areas_output)
        arcpy.env.extent = orig_extent
        arcpy.env.outputCoordinateSystem = orig_out_sr
        #startTime = aolutils.AddTimerMessage(startTime, "Saved the results from remote tool")

        #See how many output features we got and in which spatial reference.
        if DEBUG:
            count_output_areas = int(arcpy.management.GetCount(drive_time_areas_output).getOutput(0))
            arcpy.AddMessage("Created {0} drive time areas".format(count_output_areas))
            arcpy.AddMessage("SR of {0} is {1}".format(drive_time_areas_output,
                                                       arcpy.Describe(drive_time_areas_output).spatialReference.name))

        #Delete FacilityID fields from the output
        arcpy.management.DeleteField(drive_time_areas_output, "FacilityID")

        #Add the AnalysisArea field in breakUnits if breakUnits are distance based else add the analysis area based
        #on units in the user profile.
        desc_drive_time_areas_output = arcpy.Describe(drive_time_areas_output)
        #analysisutils.createShapeAreaField(drive_time_areas_output, area_units, desc_drive_time_areas_output,
                                      #area_field_alias="Area (Square {0})".format(area_units.lstrip("Square")))


        #Add aliases for the fields specific to polygons. Leave the alias for fields joined from input points as is.
        field_aliases = {
            "FromBreak" : "{0} Start ({1})".format(drive_measure_type.title(), break_units),
            "ToBreak" : "{0} End ({1})".format(drive_measure_type.title(), break_units),
            "Name" : "Name & Size",
            "FacilityOID" : "Facility ID",
        }
        for fld in field_aliases:
            arcpy.management.AlterField(drive_time_areas_output, fld, new_field_alias=field_aliases[fld], field_is_nullable=True)

        func_end = time.time()
        #arcpy.AddMessage("Total time to create_drive_time_areas function: {0} seconds".format(round(func_end - func_start),2))
        return drive_time_areas_output, startTime

    except arcpy.ExecuteError as err:
        #Check if we need to handle any error codes reported from the remote service
        if err.args:
            exception_args = err.args[0]
            #arcpy.AddMessage("exception args: {0}".format(exception_args))
            if 30137 in exception_args:
                msg_code = 100100
                msg_params = {
                    "inputLayer" : input_layer_name,
                    "url" : "http://www.arcgis.com/home/item.html?id=b7a893e8e1e04311bd925ea25cb8d7c7"
                    }
                msg = ERROR_CODES[msg_code].format(**msg_params)
                arcpy.gp.addError(msg, msg_code)
            if 30146 in exception_args:
                msg_code = 100117
                arcpy.gp.addError(ERROR_CODES[msg_code], msg_code)
            if 30024 in exception_args:
                #30024 code is returned when solve returns a failure. Check for special solve failure cases for which
                #we have created ERROR_CODES.
                #Check if we got 30024 due to invalid locations
                solve_failed_messages = exception_args[30024]
                if INVALID_LOCATIONS_SOLVER_ERROR_MESSAGE in solve_failed_messages:
                    msg_code = 100101
                    msg_params ={
                        "inputLayer" : input_layer_name,
                        "max" : 20,
                        }
                    msg = ERROR_CODES[msg_code].format(**msg_params)
                    arcpy.gp.addError(msg, msg_code)
                elif "\n".join(solve_failed_messages).find(DIFFERENT_TIME_ZONE_ERROR_MESSAGE) != -1:
                    msg_code = 100102
                    msg_params = {"inputLayer" : input_layer_name}
                    msg = ERROR_CODES[msg_code].format(**msg_params)
                    arcpy.gp.addError(msg, msg_code)
                else:
                    #log any other  solver failed messages
                    arcpy.gp.addError(solve_failed_messages)

        #Add the generic tak failed message
        #aolutils.AddExecuteErrors(TASK_NAME, system_error_codes)
        arcpy.gp.addError("Tool Failed")

##    except SystemExit as ex:
##        #Will be raised when the script is being cancelled.
##        arcpy.gp.addError("No outputs as script was canceled")

    except Exception as err:
##        import traceback
##        import sys
##        msgs = traceback.format_exception(*sys.exc_info())[1:]
##        for msg in msgs:
##            arcpy.AddMessage(msg.strip())
        #aolutils.AddExceptionError(TASK_NAME, err)
        arcpy.gp.addError("Tool Failed")

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
            #arcpy.AddMessage("Waiting for jobID: {0} to complete on {1}".format(job_id, tbx_name_parts[0]))

            #Wait for job to complete
            while service_result.status < 4:
                time.sleep(0.5)

        #Add messages and return the result
        severity = service_result.maxSeverity
        if severity != 0:
            #Log error and warning messages from execution of remote tools. Messages that have
            #codes matching with ignore_error_codes are not logged.
            #Note that for local tools this can be achieved by calling arcpy.gp.GetAllMessages().
            #However when executing remote tools, arcpy.gp.GetAllMessages()
            #does not return the actual messages from the result object. Also result.getAllMessages()
            #does not populate the error codes for the error messages.

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
            arcpy.gp.removeToolbox(tbx)

    return service_result

class LogExecutionTime(object):
    '''Context manager to log the time elapsed to execute the code block.'''

    def __init__(self, name):
        self.startTime = time.time()
        self.name = name

    def __enter__(self):
        pass

    def __exit__(self, exc_type, exc_value, traceback):
        end_time = time.time()
        #arcpy.AddMessage("TIMER: {0}: {1:.3f} seconds".format(self.name, end_time - self.startTime))

