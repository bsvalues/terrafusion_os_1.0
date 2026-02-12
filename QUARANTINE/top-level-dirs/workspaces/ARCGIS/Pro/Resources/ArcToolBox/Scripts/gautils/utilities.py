"""Utilities for tool wrappers"""
import enum
import json
import requests

class ExceptionHandler(object):
    """Capture exception type(s), return as AddError"""
    func = None

    def __init__(self, exceptions):
        self.exceptions = exceptions

    def __call__(self, *args, **kwargs):
        if self.func is None:
            self.func = args[0]
            return self
        try:
            return self.func(*args, **kwargs)
        except self.exceptions as err:
            import arcpy
            import sys
            arcpy.AddError(err)
            sys.exit(1)


class PortalVersion(object):
    """
    Get the portal version. Use to evaluate against a supplied version number.
    """

    def __init__(self):
        import arcpy
        self.version = arcpy.GetPortalInfo()['portal_version']

    def __operator__(self, other, op):
        if op(self.version, other):
            return True
        else:
            return False

    def __lt__(self, other):
        from operator import lt
        return self.__operator__(other, lt)

    def __le__(self, other):
        from operator import le
        return self.__operator__(other, le)

    def __eq__(self, other):
        from operator import eq
        return self.__operator__(other, eq)

    def __ne__(self, other):
        from operator import ne
        return self.__operator__(other, ne)

    def __gt__(self, other):
        from operator import gt
        return self.__operator__(other, gt)

    def __ge__(self, other):
        from operator import ge
        return self.__operator__(other, ge)


class JobStatus(enum.Enum):
    Pending = 0
    Running = 1
    Succeeded = 2
    Failed = 3

    def is_completed(self):
        return self.value >= 2


def is_ga_debug():
    import os
    return os.environ.get("GADEBUG") == "1"


def debug_message(message):
    import arcpy
    if is_ga_debug():
        arcpy.AddMessage("[DEBUG:PY] " + message)


def get_available_memory_win():
    # This method has been moved but is still consumed by the proximity
    # tracing sample tool and so we'll keep it here for the time being
    from ga_spark.local import _winutils
    return _winutils._get_available_memory_win()


def get_client():
    from ga_spark.local import jobclient
    from ga_spark import spark
    return jobclient.JobClient(spark)


def run_ga_desktop_tool(tool_name, params, output_param_map=None):
    """Run a GeoAnalytics Desktop Tool job"""
    import arcpy
    import time
    import sys

    # Error if on server/ao11
    if arcpy.GetInstallInfo()["ProductName"] == "Server":
        arcpy.AddIDMessage("ERROR", 1378, tool_name)
        sys.exit(1)

    arcpy.env.autoCancelling = False
    gax = get_client()
    result = {}
    msg_stats = ""
    msg_stats_arr = []

    try:
        job = gax.submit_job(tool_name, params)
        job_id = job["jobId"]

        status = JobStatus.Pending
        message_offset = 0

        while not status.is_completed():
            if arcpy.env.isCancelled:
                gax.cancel_job(job_id)

            queried_status = gax.get_job_status(job_id, message_offset)
            status = JobStatus[queried_status["status"]]
            message_offset += len(queried_status["messages"])
            for message in queried_status["messages"]:
                severity = message["severity"]
                formatted_msg_stats, formatted_msg_arr = format_message(message, severity)
                if formatted_msg_arr:
                    msg_stats_arr.append(formatted_msg_arr)
                msg_stats += formatted_msg_stats

            if "progress" in queried_status:
                progress = queried_status["progress"]
                arcpy.SetProgressorLabel(arcpy.GetIDMessage(120360).replace("%s", str(progress["jobNumber"])))
                arcpy.SetProgressorPosition(progress["percentComplete"])
            else:
                arcpy.SetProgressor("default", "")

            

            time.sleep(1)

        if "result" in queried_status:
                result = queried_status["result"]

        arcpy.AddMessage(msg_stats)
        apply_symbology(result, output_param_map)
        if tool_name == 'GeneralizedLinearRegression':
            format_json_table_glr(msg_stats_arr)
        
        # set of tools that need the job result
        elif tool_name in ['PreviewDataset', 'CreateBigDataConnection', 'RefreshBigDataConnection']:
            return result
        elif tool_name in ["DescribeDataset"]:
            if result:
                try:
                    import ast
                    message = ""
                    for key, value in result.items():
                        if key == 'outputJSON':
                            if value is not None:
                                value = value.replace("null", "None")
                                output_dict = ast.literal_eval(value)
                                return output_dict
                except Exception:
                    return None
            else: 
                return None

    except:
        from ga_spark.local import _launcher
        exit_code = _launcher._jvm_exit_code()
        if exit_code == 52:  # Spark OutOfMemory
            # Spark forces JVM exit if OOM is thrown
            arcpy.AddIDMessage("ERROR",
                               120273)  # 120273: The tool you are running requires more memory to compute the result.
        else:
            arcpy.AddIDMessage("ERROR", 999999)
        sys.exit(1)


def apply_symbology(result, output_param_map):
    import arcpy
    import json

    if not output_param_map:
        return  # tool did not pass a parameter name/index map

    for param_name, param_output in result.items():

        param_index = output_param_map.get(param_name, None)

        if not param_index:
            continue  # tool did not pass index for parameter
        
        # JSONRENDERER doesn't work with time (from what we can tell)
        # JSONCLASSDEF does, but doesn't work with hardcoded values (like hot spots)

        sym_prefix = "JSONCLASSDEF="
        sym_json = {}

        # include rendering definition if applicable
        if "drawingInfo" in param_output:
            sym_prefix = "JSONRENDERER="
            sym_json.update(param_output["drawingInfo"]["renderer"])
        elif "classificationDef" in param_output:
            sym_prefix = "JSONCLASSDEF="
            sym_json.update(param_output["classificationDef"])

        # include time fields if applicable
        # - time fields are included with symbology as a temporary solution
        # - symbology does not have to be defined in order for the time fields to be included

        if "startTimeField" in param_output:
            sym_json["cim_starttime"] = param_output["startTimeField"]
            sym_json["cim_timeformat"] = "YYYY-MM-DD hh:mm:ss.s"

        if "endTimeField" in param_output:
            sym_json["cim_endtime"] = param_output["endTimeField"]

        if sym_json:
            arcpy.gp.SetParameterSymbology(param_index, sym_prefix + json.dumps(sym_json))


def format_message(msg_dict, severity):
    import arcpy
    from .messages import lookup
    """ Format messages and add to tool message stack"""

    msg_stats = ""
    msg_stats_arr = []
    severity_dict = {0: 'INFORMATIVE',
                     1: 'WARNING',
                     2: 'ERROR'}

    if severity not in severity_dict.keys():
        severity = 0

    if msg_dict:
        if severity == 1 or severity == 2:
            try:
                if len(msg_dict['params']) == 0:
                    param_values = ()
                elif len(msg_dict['params']) == 1:
                    param_values = list(msg_dict['params'].values())[0]
                else:
                    value_positions = []
                    for k, v in msg_dict['params'].items():
                        p = msg_dict['message'].find("'{}'".format(v))
                        value_positions.append((v, p))

                    value_positions.sort(key=lambda f: f[1])
                    param_values = tuple([i[0] for i in value_positions])
            except Exception:
                param_values = ()

            try:
                msg_code = lookup[msg_dict['messageCode']]
            except KeyError as err:
                # KeyError, if message ID from service isn't available in lookup
                # Message will include service message ID
                out_msg = '{} {}: {}'.format(severity_dict[severity],
                                             msg_dict['messageCode'],
                                             msg_dict['message'])

            else:
                try:
                    msg_str = arcpy.GetIDMessage(msg_code) % param_values
                except TypeError:
                    # Expected number of arguments is invalid. Use message as is
                    msg_str = arcpy.GetIDMessage(msg_code)

                # Handle special cases where the arcpy message string contains `%s`, which means that we can't use the
                # msg_str directly from arcpy.GetIDMessage() otherwise the user will see the `%s` placeholders in the
                # Pro message.
                snap_tracks_msgs = ['BD_101277']
                if msg_dict['messageCode'] in snap_tracks_msgs:
                    out_msg = '{} {}: {}'.format(severity_dict[severity],
                                                 str(msg_code).zfill(6),
                                                 msg_dict['message'])
                else:
                    # Message will include geoprocessing message ID
                    out_msg = '{} {}: {}'.format(severity_dict[severity],
                                                 str(msg_code).zfill(6),
                                                 msg_str)

            if severity == 1:
                arcpy.AddWarning(out_msg)
            else:  # severity == 2
                arcpy.AddError(out_msg)
        else:
            try:
                out_msg = msg_dict['message']
                out_msg_code = msg_dict['messageCode']
                out_msg_params = msg_dict['params']
                
                spark_status_msgs = ["BD_101234", "BD_101235"]
                glr_msgs = ['BD_101178','BD_101179','BD_101180','BD_101181','BD_101182','BD_101183','BD_101184','BD_101185']
                forest_msgs = ['BD_84810','BD_84811', 'BD_84812','BD_84813','BD_84814','BD_84815','BD_84816',
                                      'BD_84829','BD_84830','BD_84834','BD_84839', 'BD_84840','BD_101146','BD_101147','BD_101150','BD_101151' ]
                cms_msgs = ['BD_101265']

                # Generic Spark Messages about status + tasks
                if out_msg_code in spark_status_msgs:
                    if out_msg_code == "BD_101234": 
                        arcpy.AddIDMessage("INFORMATIVE", lookup['BD_101234'], str(out_msg_params['jobNum']), 
                                           str(out_msg_params['numTasks']))
                    elif out_msg_code == "BD_101235": 
                        arcpy.AddIDMessage("INFORMATIVE", lookup['BD_101235'], str(out_msg_params['jobNum']), 
                                           str(round(out_msg_params['seconds'],2)))
                                        
                # GLR messages (formatting)
                elif out_msg_code in glr_msgs:
                    if out_msg_code == 'BD_101178' or out_msg_code == 'BD_101181':
                        msg_stats_arr = [out_msg_code, out_msg]
                    elif out_msg_code == 'BD_101179':
                        msg_stats_arr = [out_msg_code, json.loads(out_msg)]
                    elif out_msg_code == 'BD_101180':
                        msg_stats_arr = [out_msg_code, out_msg.replace('\'', '').strip().split(',')]
                    elif out_msg_code == 'BD_101182' or out_msg_code == 'BD_101183' or out_msg_code == 'BD_101184' or out_msg_code == 'BD_101185':
                        msg_stats_arr = [out_msg_code, out_msg.strip().split(':')]

                # FBCR messages (formatting)
                elif out_msg_code in forest_msgs:
                    if out_msg_code == 'BD_84810':
                        msg_stats = '-' * 60 + '\n'
                        msg_stats += ('{:-^60}'.format(out_msg)) + '\n'
                    elif out_msg_code == 'BD_84829' or out_msg_code == 'BD_84834' or out_msg_code == 'BD_84839':
                        msg_stats = ' ' * 96 + '\n'
                        msg_stats += ('{:-^60}'.format(out_msg)) + '\n'
                    elif out_msg_code == 'BD_84811' or out_msg_code == 'BD_84812' or out_msg_code == 'BD_84813' or out_msg_code == 'BD_84814' or out_msg_code == 'BD_84815' or out_msg_code == 'BD_84816':
                        out_msg_split = out_msg.split(':')
                        msg_stats = '{:<50s}{:>10s}'.format(out_msg_split[0], out_msg_split[1]) + '\n'
                    elif out_msg_code == 'BD_101146' or out_msg_code == 'BD_101147':
                        out_msg = out_msg.replace('[', '').replace(']', '').replace('"', '').replace('\'', '')
                        out_msg_split = out_msg.split(',')
                        msg_stats = '{:<25s}{:>15s}'.format(out_msg_split[0], out_msg_split[1]) + '\n'
                    elif out_msg_code == 'BD_101150':
                        out_msg = out_msg.replace('[', '').replace(']', '').replace('"', '').replace('\'', '')
                        out_msg_split = out_msg.split(',', 1)
                        msg_stats = '{:<50s}{:>15s}'.format(out_msg_split[0], out_msg_split[1].replace(',', '')) + '\n'
                    elif out_msg_code == 'BD_101151':
                        out_msg = out_msg.replace('[', '').replace(']', '').replace('"', '').replace('\'', '')
                        out_msg_split = out_msg.rsplit(',', 1)
                        msg_stats = '{:<50s}{:>15s}'.format(out_msg_split[0], out_msg_split[1]) + '\n'
                    elif out_msg_code == 'BD_84830' or out_msg_code == 'BD_84840':
                        msg_stats = out_msg + '\n'

                # CMS messages (formatting)
                elif out_msg_code in cms_msgs:
                    if out_msg_code == "BD_101265":
                        arcpy.AddIDMessage("INFORMATIVE", lookup['BD_101265'], out_msg_params['stat'],
                                           out_msg_params['unit'])
            except Exception as e:
                msg_stats = ''
            if out_msg_code not in glr_msgs and out_msg_code not in cms_msgs and out_msg_code not in spark_status_msgs :
                arcpy.AddMessage(out_msg)
    else:
        if severity == 0:
            arcpy.AddMessage(msg)
        elif severity == 1:
            arcpy.AddWarning(msg)
        else:  # severity == 2
            arcpy.AddError(msg)

    return msg_stats, msg_stats_arr;


def get_layer_description(value):
    import arcpy
    arcpy_desc = arcpy.da.Describe(value)
    arcpy_gp_desc = arcpy.gp.Describe(value)

    layer_desc = {
        "path": arcpy_desc["catalogPath"]
    }

    if "FIDSet" in arcpy_desc:
        layer_desc["fidSet"] = arcpy_desc["FIDSet"]

    if "OIDFieldName" in arcpy_desc:
        layer_desc["fidField"] = arcpy_desc["OIDFieldName"]

    if "whereClause" in arcpy_desc and arcpy_desc["whereClause"]:
        layer_desc["whereClause"] = arcpy_desc["whereClause"]

    # include time extent as determined by the time slider
    try:
        # TIMEEXTENT is in the format [<utc_epoch_millis>|"null"],[<utc_epoch_millis>,"null"]
        extent_parts = arcpy_gp_desc.TIMEEXTENT.split(',')
        time_extent = {}

        if extent_parts[0] != "null":
            time_extent["startTime"] = int(extent_parts[0])

        if extent_parts[1] != "null":
            time_extent["endTime"] = int(extent_parts[1])

        if time_extent:
            layer_desc["timeExtent"] = time_extent

    except:
        debug_message("Failed to get time extent string")

    try:
        field_name = arcpy_gp_desc.StartTimeField
        if field_name:
            layer_desc["startTimeField"] = field_name
    except AttributeError:
        pass  # no start time field

    try:
        field_name = arcpy_gp_desc.EndTimeField
        if field_name:
            layer_desc["endTimeField"] = field_name
    except AttributeError:
        pass  # no end time field

    return layer_desc


def get_message(msg_id, *args):
    """
    Get arcpy messages. Extra handling for any potential disconnects on message
    ids and the message xmls.
    :param msg_id: message number
    """
    import arcpy

    try:
        msg = arcpy.GetIDMessage(msg_id) % args
    except Exception:
        # Fallback if a message does not yet exist in the error codes
        msg = msg_id

    return msg


def format_field_mapping(vtf):
    """
    Format field mapping for Append Data
    :param vtf: value table of fields to map
    """
    import json

    to_list = valuetable_to_list(vtf)
    field_mapping = [{"inputLayerField": i[0], "mappingType": "AppendField", "mappingValue": i[1]} for i in to_list]

    return field_mapping or None


def format_expression_mapping(vte):
    """
    Format expression mapping for Append Data
    :param vte: value table of expressions to map
    """
    import json

    to_list = valuetable_to_list(vte)
    expression_mapping = [{"inputLayerField": i[0], "mappingType": "Expression", "mappingValue": i[1]} for i in to_list]

    return expression_mapping or None


def format_merge_att(vte):
    """
    Format merging attributes for Merge Layers
    :param vte: value table of merge rules
    """
    import json
    from gautils import dicts as d

    to_list = valuetable_to_list(vte)
    merge_rules = [{"mergeLayerField": i[0], "mergeType": d.merge_type[i[1]], "mergeValue": i[2]} for i in to_list]

    return merge_rules or []


def format_mapping_append(vtf, vte):
    """
    Format field mapping parameter for Append Data
    :param vtf: value table of fields to map
    :param vte: value table of expressions to map
    :return:
    """
    import json

    field_mapping = format_field_mapping(vtf)
    exp_mapping = format_expression_mapping(vte)
    if field_mapping and exp_mapping:
        mapping_param = json.dumps(format_field_mapping(vtf)).rstrip("]") + "," + \
                        json.dumps(format_expression_mapping(vte)).lstrip("[")
    elif field_mapping and not exp_mapping:
        mapping_param = json.dumps(format_field_mapping(vtf))
    elif not field_mapping and exp_mapping:
        mapping_param = json.dumps(format_expression_mapping(vte))
    else:
        mapping_param = None

    return mapping_param or None


def format_att_matching(vt):
    """
    Format attribute relationship
    :param vt: value table
    """

    import json

    to_list = valuetable_to_list(vt)
    att_matching = [{"targetField": i[0], "joinField": i[1], "operator": "equal"} for i in to_list]

    return json.dumps(att_matching) or None


def format_bmvg_variable_parameters(vt):
    """
    Format Build Multi-Variable Grid parameters
    :param vt: value table
    """

    import json

    to_list = valuetable_to_list(vt)

    # Get input layers
    input_layers = [i[0] for i in to_list]

    # Create a list of unique input layers
    unique_input_layers = []
    for i in input_layers:
        if i not in unique_input_layers:
            unique_input_layers.append(i)

    variable_calculations = []

    # For each unique layer, group variable calculations
    for layer in unique_input_layers:
        list_of_layer_variables = []
        for i in to_list:
            if i[0] == layer:
                if i[2] == "DISTANCE_TO_NEAREST":
                    list_of_layer_variables.append({"type": "DistanceToNearest",
                                                    "outFieldName": i[1],
                                                    "searchDistance": int(i[5].split()[0]),
                                                    "searchDistanceUnit": i[5].split()[1]
                                                    })
                elif i[2] == "ATTRIBUTE_OF_NEAREST":
                    list_of_layer_variables.append({"type": "AttributeOfNearest",
                                                    "outFieldName": i[1],
                                                    "attributeField": i[3],
                                                    "searchDistance": int(i[5].split()[0]),
                                                    "searchDistanceUnit": i[5].split()[1]
                                                    })
                elif i[2] == "SUMMARY_OF_NEARBY":
                    list_of_layer_variables.append({"type": "AttributeSummaryOfRelated",
                                                    "outFieldName": i[1],
                                                    "statisticType": i[4],
                                                    "statisticField": i[3],
                                                    "searchDistance": int(i[5].split()[0]),
                                                    "searchDistanceUnit": i[5].split()[1]
                                                    })
                elif i[2] == "SUMMARY_OF_INTERSECTING":
                    list_of_layer_variables.append({"type": "AttributeSummaryOfRelated",
                                                    "outFieldName": i[1],
                                                    "statisticType": i[4],
                                                    "statisticField": i[3]
                                                    })
        variable_calculations.append({"layer": unique_input_layers.index(layer),
                                      "variables": list_of_layer_variables})

    return unique_input_layers, json.dumps(variable_calculations)


def format_scad_summary_types_desktop(centralFeature, meanCenter, medianCenter, ellipse):
    summ_types = []
    if centralFeature != "":
        summ_types.append("CentralFeature")
    if meanCenter != "":
        summ_types.append("MeanCenter")
    if medianCenter != "":
        summ_types.append("MedianCenter")
    if ellipse != "":
        summ_types.append("Ellipse")

    return summ_types or []


def format_scad_summary_types_server(summaryTypes):

    summ_types = ""
    if "CENTRAL_FEATURE" in summaryTypes:
        summ_types += ",CentralFeature"
    if "MEAN_CENTER" in summaryTypes:
        summ_types += ",MeanCenter"
    if "MEDIAN_CENTER" in summaryTypes:
        summ_types += ",MedianCenter"
    if "ELLIPSE" in summaryTypes:
        summ_types += ",Ellipse"

    return summ_types.strip(',') or ""

def format_motion_statistics_server(summaryTypes):

    stats = ""
    if "DISTANCE" in summaryTypes:
        stats += ",Distance"
    if "DURATION" in summaryTypes:
        stats += ",Duration"
    if "SPEED" in summaryTypes:
        stats += ",Speed"
    if "ACCELERATION" in summaryTypes:
        stats += ",Acceleration"
    if "BEARING" in summaryTypes:
        stats += ",Bearing"
    if "IDLE" in summaryTypes:
        stats += ",Idle"
    if "ELEVATION" in summaryTypes:
        stats += ",Elevation"
    if "SLOPE" in summaryTypes:
        stats += ",Slope"

    return stats.strip(',') or ""


def format_summary_fields(vt, third_column=False):
    from . import dicts as d
    to_list = valuetable_to_list(vt)
    sum_list = []

    # Currently only case with 3 column value table is also coincidentally the one that
    # needs differing dict mapping. Long term, this coincident may not hold true if
    # more tools/stat based parameters arise
    if third_column:
        stat_dict = d.stat_st
    else:
        stat_dict = d.stat

    for i in to_list:
        sum_d = {'statisticType': stat_dict[i[1]],
                 'onStatisticField': i[0]}
        if third_column:
            sum_d['fillType'] = d.fill_type[i[2]]

        sum_list.append(sum_d)

    return sum_list or []


def format_summary_fields_sw(vt, weighted):
    from . import dicts as d
    to_list = valuetable_to_list(vt)
    sum_list = []
    rate_fields = []

    if weighted:
        stat_dict = d.swstat_weighted
    else:
        stat_dict = d.swstat
    for i in to_list:
        sum_d = {'statisticType': stat_dict[i[1]],
                 'onStatisticField': i[0]}
        sum_list.append(sum_d)
        if i[2] == "Rate":
            rate_fields.append(i[0])
    return sum_list, rate_fields


def fbcr_format_exp_var(vte):
    """
    Format explanatory variables for Forest Based Classification And Regression
    :param vte: value table of variables
    """
    to_list = valuetable_to_list(vte)

    exp_variables = [{"fieldName": i[0], "categorical": True if ("true" in i[1]) else False} for i in to_list]

    return exp_variables or []


def fbcr_glr_format_exp_var_match(vte):
    """
    Format explanatory variables matching for Forest Based Classification And Regression and GLR
    :param vte: value table of variables
    """
    to_list = valuetable_to_list(vte)

    exp_variables = [{"predictionLayerField": i[0], "trainingLayerField": i[1]} for i in to_list]

    return exp_variables or []


def glr_format_dependent_mapping_variables(vte):
    """
    Format depentent explanatory variables for GLR
    :param vte: value table of variables
    """
    to_list = valuetable_to_list(vte)

    dependent_mapping_variables = [[{"value0": i[0]}, {"value1": i[1]}] for i in to_list]

    return dependent_mapping_variables or []

def snap_connectivity_matching(vte):
    """
    Format network attribute matching for the point snapping tool
    :param vte: value table of variables
    """
    to_list = valuetable_to_list(vte)

    connectivity_matching = {"polylineId" :to_list[0][0],
                             "fromNode" :to_list[0][1],
                             "toNode" :to_list[0][2]}

    return connectivity_matching or None

def snap_direction_value_matching(vte):
    """
    Format network direction value matching for the point snapping tool
    :param vte: value table of variables
    """
    to_list = valuetable_to_list(vte)
    
    if to_list != []:
        direction_value_matching = {"directionField": to_list[0][0],
                                "forwardValue": to_list[0][1],
                                "backwardValue": to_list[0][2],
                                "bothValue": to_list[0][3],
                                "noneValue": to_list[0][4]}

        return direction_value_matching
    else:
        return None

def trace_proximity_events_format_entities_of_interest(vte):
    import datetime
    from dateutil import parser

    # Create a list from the Entities of Interest IDs value table
    value_table_list = valuetable_to_list(vte)

    # Convert the Entities of Interest IDs into the entitiesOfInterest REST format
    entities_of_interest_rest_format = []
    for i in value_table_list:
        # Date time is specified
        if i[1]:
            # Get the input date time
            input_datetime = parser.parse(i[1])

            # Calculate the time elapsed since the Unix epoch
            epoch_time_stamp = int((input_datetime - datetime.datetime(1970, 1, 1)).total_seconds() * 1000)

        # Date time is not specified
        else:
            epoch_time_stamp = None

        # Convert each entity of interest into the REST format
        entities_of_interest_rest_format.append({"entityId": i[0], "epochTimeStamp": epoch_time_stamp})

    return entities_of_interest_rest_format


def trace_proximity_events_format_attribute_match_criteria(get_value_as_list):
    # Convert the attribute match criteria input into the attributeMatchCriteria REST format
    return ", ".join(get_value_as_list)


def convert_get_value_list_to_rest_format(get_value_as_list):
    # Converts a list returned by 'get_value(as_list=True)' to the standard GeoAnalytics REST format
    #   - Example: ['meters','ramp'] will get converted to "meters, ramp"
    return ", ".join(get_value_as_list)


def get_json_format():
    """"
    Template to use for printing any JSON table
    """
    required_formatting = {
        "element": "table",
        "data": [
            ["test", "test2"],
            ["test", "test2"],
            ["test", "test2"]
        ],
        "elementProps": {
            "striped": "true",
            "1": {
                "align": "right",
                "pad": "20px"
            },
            "2": {
                "align": "left"
            }
        }
    }

    return required_formatting


def format_json_table_glr(in_msg_stats_arr):
    import json
    import arcpy
    """"Formatting for the Describe BDC Tool
            :param in_str: An input JSON to be formatted
            :param row_values: The row titles for the table
    """
    required_formatting = get_json_format()

    fields_title = ""
    stats_title = ""
    # Lists that will be used to store results
    fields_data_array = []
    stats_data_list = [[arcpy.GetIDMessage(120358), arcpy.GetIDMessage(120359)]]

    for element in in_msg_stats_arr:
        if element[0] == "BD_101178":
            # Summary of GLR Results [Model Type: Continuous (Gaussian/OLS)]
            if element[1] == arcpy.GetIDMessage(120338):
                fields_title = arcpy.GetIDMessage(120338)
            # Summary of GLR Results [Model Type: Binary (Logistic)]
            if element[1] == arcpy.GetIDMessage(120340):
                fields_title = arcpy.GetIDMessage(120340)
            # Summary of GLR Results [Model Type: Count (Poisson)]
            if element[1] == arcpy.GetIDMessage(120341):
                fields_title = arcpy.GetIDMessage(120341)
        elif element[0] == "BD_101181":
            stats_title = arcpy.GetIDMessage(120339)
        elif element[0] == "BD_101179":
            for index, item in enumerate(element[1]):
                # Variable
                if item == arcpy.GetIDMessage(120329):
                    element[1][index] = arcpy.GetIDMessage(120329)
                # Coef
                if item == arcpy.GetIDMessage(120342):
                    element[1][index] = arcpy.GetIDMessage(120330)
                # StdError
                if item == arcpy.GetIDMessage(120343):
                    element[1][index] = arcpy.GetIDMessage(120331)
                # t_Stat
                if item == arcpy.GetIDMessage(120344):
                    element[1][index] = arcpy.GetIDMessage(120332)
                # Prob
                if item == arcpy.GetIDMessage(120345):
                    element[1][index] = arcpy.GetIDMessage(120333)
            fields_data_array.append(element[1])
        elif element[0] == "BD_101180":
            for index, item in enumerate(element[1]):
                if index != 0:
                    element[1][index] = round(float(item), 4)
            fields_data_array.append(element[1])
        elif element[0] == "BD_101182" or element[0] == "BD_101183" or element[0] == "BD_101184" or element[
            0] == "BD_101185":
            if element[0] == "BD_101182" or element[0] == "BD_101183":
                if fields_title != arcpy.GetIDMessage(120338):
                    continue
            for index, item in enumerate(element[1]):
                if index != 0:
                    element[1][index] = round(float(item), 4)
                else:
                    # Multiple R-Squared
                    if item == arcpy.GetIDMessage(120334):
                        element[1][index] = arcpy.GetIDMessage(120334)
                    # Adjusted R-Squared
                    if item == arcpy.GetIDMessage(120335):
                        element[1][index] = arcpy.GetIDMessage(120335)
                    # Akaike's Information Criterion (AIC)
                    if item == arcpy.GetIDMessage(120336):
                        element[1][index] = arcpy.GetIDMessage(120336)
                    # Akaike's Information Criterion corrected (AICc)
                    if item == arcpy.GetIDMessage(120337):
                        element[1][index] = arcpy.GetIDMessage(120337)
            stats_data_list.append(element[1])

    fields_element_props = {
        "striped": "true",
        "0": {
            "align": "left"
        },
        "1": {
            "align": "right",
            "pad": "20px"
        },
        "2": {
            "align": "right",
            "pad": "20px"
        },
        "3": {
            "align": "right",
            "pad": "20px"
        },
        "4": {
            "align": "right",
            "pad": "20px"
        }
    }

    stats_element_props = {
        "striped": "true",
        "0": {
            "align": "left"
        },
        "1": {
            "align": "right",
            "pad": "20px"
        }
    }

    arcpy.AddMessage(fields_title)

    required_formatting["data"] = fields_data_array
    required_formatting["elementProps"] = fields_element_props
    fields_table = [required_formatting]
    fields_json_string = json.dumps(fields_table)
    fields_table_str = """json:\n{}""".format(fields_json_string)
    arcpy.AddMessage(fields_table_str)

    arcpy.AddMessage(stats_title)

    required_formatting["data"] = stats_data_list
    required_formatting["elementProps"] = stats_element_props
    stats_table = [required_formatting]
    fields_json_string = json.dumps(stats_table)
    print(fields_json_string)
    stats_table_str = """json:\n{}""".format(fields_json_string)
    arcpy.AddMessage(stats_table_str)


def format_duplicate_datasets_bdc(vt):
    """
    Format duplicate datasets for BDC - Duplicate
    :param vt: value table of dataset names
    """
    to_list = valuetable_to_list(vt)

    duplicate_datasets = [{"dataset_to_copy": i[0], "name": i[1]} for i in to_list]

    return duplicate_datasets or []


def format_del_property_updates_bdc(quoteChar, extension, encoding, recordTerminator, fieldDelimiter,
                                    hasHeaderRow, escapeChar):
    properties = {
        "fileformat": "delimited",
        "delimited.quoteChar": quoteChar,
        "delimited.extension": extension,
        "delimited.escapeChar": escapeChar,
        "delimited.encoding": encoding,
        "delimited.recordTerminator": recordTerminator,
        "delimited.fieldDelimiter": fieldDelimiter,
        "delimited.hasHeaderRow": str(hasHeaderRow).lower()
    }
    return properties


def format_field_updates_bdc(fieldEdits):
    visible_map = {
        "true": True,
        "True": True,
        True: True,
        "false": False,
        "False": False,
        False: False
    }
    update_fields = [{"name": i[0], "type": i[1], "visible": visible_map[i[2]]} for i in fieldEdits]
    return update_fields


def format_geometry_updates_bdc(geometryType, sref, geometryFormat, xField, yField, field, zField, hasZ, hasM):
    geometry_updates = {}
    if geometryType:
        geometry_updates["geometryType"] = geometryType
    if geometryFormat:
        geometry_format_map = {
            "WKT": "WKT",
            "WKB": "WKB",
            "GEOJSON": "GeoJSON",
            "ESRIJSON": "EsriJSON",
            "ESRISHAPE": "EsriShape"}
        if geometryFormat in geometry_format_map.keys():
            geometry_updates["fields"] = [{"name": field, "formats": [geometry_format_map[geometryFormat]]}]
        elif geometryFormat == "XYZ":
            geometry_updates["fields"] = [{"name": xField, "formats": ["x"]}, {"name": yField, "formats": ["y"]}]
            if zField and ("fields" in geometry_updates.keys()):
                if isinstance(geometry_updates["fields"], list):
                    geometry_updates["fields"].append({"name": zField, "formats": ["z"]})
    if sref:
        if sref.isdigit():
            geometry_updates["spatialReference"] = {"wkid": int(sref)}
        else:
            geometry_updates["spatialReference"] = {"wkt": str(sref)}
    geometry_updates["hasZ"] = hasZ
    geometry_updates["hasM"] = hasM

    return geometry_updates


def format_json_table_describe(in_str, row_values):
    import json
    import arcpy
    """"Formatting for the Describe BDC Tool
            :param in_str: An input JSON to be formatted
            :param row_values: The row titles for the table
    """
    required_formatting = get_json_format()

    # Lists that will be used to store results
    data_list = [[arcpy.GetIDMessage(120358), arcpy.GetIDMessage(120359)]]
    row_names = row_values

    i = 0
    for element in in_str:
        if element == "sref":
            print(in_str[element])
            if "wkid" in in_str[element]:
                data_list.append([row_names[i], "WKID: {}".format(in_str[element]["wkid"])])
            elif "wkid" in in_str[element]:
                data_list.append([row_names[i], "WKT: {}".format(in_str[element]["wkt"])])
        elif element == "spatialExtent":
            data_list.append([row_names[i], "{0}: {1}, {2}: {3}, {4}: {5}, {6}: {7}".format(
                arcpy.GetIDMessage(120313), round(in_str[element]["xmin"], 4) if in_str[element]["xmin"] is not None else None,
                arcpy.GetIDMessage(120314), round(in_str[element]["xmax"], 4) if in_str[element]["xmax"] is not None else None,
                arcpy.GetIDMessage(120315), round(in_str[element]["ymin"], 4) if in_str[element]["ymin"] is not None else None,
                arcpy.GetIDMessage(120316), round(in_str[element]["ymax"], 4) if in_str[element]["ymax"] is not None else None)])
        elif element == "temporalExtent":
            data_list.append([row_names[i], "{0}: {1}, {2}: {3}".format(arcpy.GetIDMessage(120320),
                                                                        in_str[element]["start"],
                                                                        arcpy.GetIDMessage(120321),
                                                                        in_str[element]["end"])])
        else:
            data_list.append([row_names[i], in_str[element]])
        i += 1

    # Update the format template with the values and formatting
    required_formatting["data"] = data_list
    required_formatting = [required_formatting]
    json_string = json.dumps(required_formatting)
    return json_string


def format_preview_json_messaging(in_fc):
    import json
    """"Formatting for the Preview BDC Tool
            :param in_fc: An input feature collection to be fromatted
            """
    required_formatting = get_json_format()

    # Empty element list to be modified (also part of the template - stripped down for ease)
    elements = {
        "striped": "true"
    }

    # Lists that will be used to store results
    data_list = []
    headers = []
    str_fields = []

    fields = in_fc["fields"]
    for field in fields:
        headers.append(field["name"])
        str_fields.append(True) if field["type"] == "esriFieldTypeString" else str_fields.append(False)

    data_list.append(headers)

    for feature in in_fc["features"]:
        col = 0
        feature_values = []
        for attribute in feature["attributes"]:
            feature_values.append(feature["attributes"][headers[col]])
            col += 1
        data_list.append(feature_values)

    # Formats the field to be left/right
    # If needed add the wrap: true or false based on the need to wrap. Else it will extend the column 80 chars.
    for i in range(0, len(fields)):
        elements["{}".format(i)] = {"align": "left"} if str_fields[i] else {"align": "right", "pad": "30px"}

    # Update the format template with the values and formatting
    required_formatting["data"] = data_list
    required_formatting["elementProps"] = elements
    required_formatting = [required_formatting]

    json_string = json.dumps(required_formatting)

    return json_string


def format_time_updates_bdc(timeType, timeZone, startTime, endTime):
    def combine_time_formats(fields):
        visited_field_names = []
        new_fields = []
        for field in fields:
            if field["name"] not in visited_field_names:
                new_fields.append(field)
                visited_field_names.append(field["name"])
            else:
                i, x = 0, 0
                for f in new_fields:
                    if f["name"] == field["name"]:
                        i = x
                    else:
                        x += 1
                new_fields[i]["formats"] += field["formats"]
        return new_fields

    time_updates = {}
    if timeType:
        time_updates["timeType"] = timeType.lower()
    if timeZone:
        time_updates["timeReference"] = {"timeZone": timeZone}
    starttime_tolist = valuetable_to_list(startTime)
    endtime_tolist = valuetable_to_list(endTime)
    if timeType.lower() == "interval":
        time_updates["fields"] = [{"name": t[0], "formats": [t[1]], "role": "start"} for t in starttime_tolist] + \
                                 [{"name": t[0], "formats": [t[1]], "role": "end"} for t in endtime_tolist]
        time_updates["fields"] = combine_time_formats(time_updates["fields"])
    elif timeType.lower() == "instant":
        time_updates["fields"] = [{"name": t[0], "formats": [t[1]]} for t in starttime_tolist]
        time_updates["fields"] = combine_time_formats(time_updates["fields"])
    for i, tu in enumerate(time_updates["fields"]):
        if tu["formats"] == [""]:
            time_updates["fields"][i].pop("formats")
    return time_updates


def get_url(result):
    """Extract only 'url' from json
    :param result: The json results
    """
    import json
    return json.loads(result)['url']


def get_value(index, as_value=False, dict=None, parameters=None, prop_name=None, val_table=False, linear_units=False,
              input_data=False, as_list=False, output=False, local_feature_layer=False, datetime_epoch=False,
              local_feature_output=False, weighted_stats=False, **kwargs):
    """
    Argument handling routine

    :param index: GP parameter index
    :param as_value: If True, use GetParameter, if False use GetParameterAsText
    :param dict: Dictionary, if a dict mapping required
    :param local_feature_output: format the output location for Desktop tools
    :return: value for service
    """

    import json
    import re
    if as_value or datetime_epoch:
        if parameters:
            val = parameters[index].value
        else:
            from arcpy import GetParameter
            val = GetParameter(index)

        if prop_name:
            try:
                return eval('val.{}'.format(prop_name))
            except (NameError, AttributeError):
                return None

        elif val_table:
            # Any new value table cases needs to be handled below
            if val_table in ['summary_fields', 'summary_fields_plus'] and val:
                if val_table == 'summary_fields_plus':
                    to_list = format_summary_fields(val, third_column=True)
                else:
                    to_list = format_summary_fields(val)
                return json.dumps(to_list)

            elif val_table == 'sum_within_summary_fields':
                to_list, rate_fields = format_summary_fields_sw(val, weighted_stats)
                return json.dumps(to_list), rate_fields

            elif val_table == 'att_relationship' and val:
                return format_att_matching(val)

            elif val_table in ['bmvg_parameters'] and val:
                return format_bmvg_variable_parameters(val)

            elif val_table == 'merge_layers' and val:
                return json.dumps(format_merge_att(val))

            elif val_table == 'fbcr_explanatory_variables' and val:
                return json.dumps(fbcr_format_exp_var(val))

            elif val_table in ['fbcr_explanatory_variable_matching'] and val:
                return json.dumps(fbcr_glr_format_exp_var_match(val))

            elif val_table in ['glr_explanatory_variable_matching'] and val:
                return json.dumps(fbcr_glr_format_exp_var_match(val))

            elif val_table in ['glr_dependent_mapping_variables'] and val:
                return json.dumps(glr_format_dependent_mapping_variables(val))
            
            elif val_table in ['summary_types'] and val:
                return format_scad_summary_types_server(val)

            elif val_table in ['trace_proximity_events_format_entities_of_interest'] and val:
                return json.dumps(trace_proximity_events_format_entities_of_interest(val))

            elif val_table in ['snap_connectivity_matching'] and val:
                return json.dumps(snap_connectivity_matching(val))

            elif val_table in ['snap_direction_value_matching'] and val:
                return json.dumps(snap_direction_value_matching(val))

            else:
                msg = get_message(120003, val_table)  # %s is an invalid value table type.
                raise AttributeError(msg)
        elif input_data:
            try:
                # Python toolbox case will get here without a .value property
                v = getattr(val, 'value', val)

                if v[0:4].lower() == 'http':
                    return v
                else:
                    return val
            except (TypeError, NameError, AttributeError):
                return val
        elif datetime_epoch:
            if val:
                import datetime
                val = int((val - datetime.datetime(1970, 1, 1)).total_seconds()) * 1000
        elif local_feature_layer:
            try:
                val = get_layer_description(val)
                import os
                if not os.path.isabs(val["path"]):
                    if env.workspace:
                        val["path"] = os.path.join(env.workspace, val["path"])
            except:
                import sys, arcpy
                arcpy.AddIDMessage("ERROR", 152)
                sys.exit()
    else:
        if parameters:
            val = parameters[index].valueAsText
        else:
            from arcpy import GetParameterAsText, env
            val = GetParameterAsText(index)
        if local_feature_output:
            try:
                import arcpy, os
                if not os.path.isabs(val):
                    if arcpy.env.workspace:
                        val = os.path.join(arcpy.env.workspace, val)
            except:
                import sys, arcpy
                arcpy.AddIDMessage("ERROR", 273)
                sys.exit()
        if dict:
            if val:
                return dict[val]
            else:
                return val
        elif as_list:
            if val:
                return val.split(';')
            else:
                return []
        elif linear_units:
            val = val.strip()
            val = re.sub(' +', ' ', val)  # scrub consecutive spaces

            # Need to remove spaces ('Decimal Degrees' becomes 'DecimalDegrees')
            if len([m.start() for m in re.finditer(' ', val)]):
                ss = val.split(' ')
                return u'{} {}'.format(ss[0], u''.join(ss[1:]))
            else:
                return val
        elif output:
            return json.dumps({"serviceProperties": {"name": val}})

    return val


def param_cleanup(params):
    """
    Final parameter cleanup. Remove keys for values that are None, '', etc.
    :param params: Dictionary of parameter names and values
    """
    return dict((k, v) for k, v in params.items() if v or type(v) == bool or v == [])


def param_cleanup_num_zero(params):
    """
    Final parameter cleanup. Remove keys for values that are None, '', etc.
    :param params: Dictionary of parameter names and values
    """

    return dict((k, v) for k, v in params.items() if v or type(v) == bool or type(v) == int or v == [])


def print_describe_output_messages(in_json):
    """"
    Print the output messages for Describe tools (GA Server and Desktop)
    :param in_json: An input JSON returned from the tool to be printed
    """
    import arcpy
    arcpy.AddIDMessage("INFORMATIVE", 120270)  # This text reads as "Dataset Description"

    # Print the record count, dataset (if exists - Server only) and dataset source (if exists - Server only)
    arcpy.AddMessage("{0}: {1}".format(arcpy.GetIDMessage(120306), in_json["recordCount"]))
    if "datasetName" in in_json:
        arcpy.AddMessage("{0}: {1}".format(arcpy.GetIDMessage(120322), in_json["datasetName"]))
    if "datasetSource" in in_json:
        arcpy.AddMessage("{0}: {1}".format(arcpy.GetIDMessage(120327), in_json["datasetSource"]))

    # Print geometry information to the console
    if "geometry" in in_json:
        arcpy.AddIDMessage("INFORMATIVE", 120323)
        formatted_geometry = format_json_table_describe(in_json["geometry"],
                                                        [arcpy.GetIDMessage(120308), arcpy.GetIDMessage(120309),
                                                         arcpy.GetIDMessage(120310), arcpy.GetIDMessage(120311),
                                                         arcpy.GetIDMessage(120312)])
        table_str = """json:\n{}""".format(formatted_geometry)
        arcpy.AddMessage(table_str)
    else:
        arcpy.AddIDMessage("INFORMATIVE", 120325)

    # Print time information to the console
    if "time" in in_json:
        arcpy.AddIDMessage("INFORMATIVE", 120324)
        formatted_time = format_json_table_describe(in_json["time"], [arcpy.GetIDMessage(120318),
                                                                      arcpy.GetIDMessage(120310),
                                                                      arcpy.GetIDMessage(120311),
                                                                      arcpy.GetIDMessage(120319)])
        table_str = """json:\n{}""".format(formatted_time)
        arcpy.AddMessage(table_str)
    else:
        arcpy.AddIDMessage("INFORMATIVE", 120326)


def set_context(spatial_ref, extent, data_store=None, geoanalytics=False, desktop_context=False):
    """Set context
    :param spatial_ref: arcpy.SpatialReference object - from arcpy.env.outputCoordinateSystem
    :param extent: arcpy.Extent object - from arcpy.env.extent
    :param data_store: datastore keyword
    :param geoanalytics: True if context is for Geoanalytics Server
    """
    import json
    from math import isnan
    context = {}

    if spatial_ref:
        if geoanalytics:
            # GeoAnalytics Server Tools
            context['processSR'] = {'wkt': spatial_ref.exportToString().split(";")[0].replace("'", '\"')}
        else:
            # Any others (Standard or GeoAnalytics Desktop Tools)
            context['outSR'] = {'wkt': spatial_ref.exportToString().split(";")[0].replace("'", '\"')}

    # Check if the extent parameter is passed
    if extent:
        use_extent = True
        # If the extent parameter is Union or Intersection - we don't support this
        if isinstance(extent, str) and extent in ["MINOF", "MAXOF"]:
            # If Intersection or Union of inputs
            import arcpy
            arcpy.AddIDMessage("WARNING", 120283)
            use_extent = False

        # If it has a factory code - this should always be true
        elif hasattr(extent.spatialReference, 'factoryCode'):
            if spatial_ref and (spatial_ref.factoryCode != extent.spatialReference.factoryCode or
                                ((spatial_ref.factoryCode == 0 or extent.spatialReference.factoryCode == 0) and
                                 (spatial_ref.exportToString() != extent.spatialReference.exportToString()))):

                tmp_ext = extent.projectAs(spatial_ref)
                # If the project gives results we don't want (nan's as coordinates)
                if any((isnan(tmp_ext.XMax), isnan(tmp_ext.XMin),
                        isnan(tmp_ext.YMax), isnan(tmp_ext.YMin))):
                    # Projected extent won't work, don't use extent
                    import arcpy
                    arcpy.AddIDMessage("WARNING", 120124)
                    use_extent = False

            else:
                # No need to check project extent, proceed as is
                pass

            if use_extent:
                context["extent"] = {
                    "xmin": extent.XMin,
                    "ymin": extent.YMin,
                    "xmax": extent.XMax,
                    "ymax": extent.YMax,
                    "spatialReference": {
                        "wkt": extent.spatialReference.exportToString().split(";")[0].replace("'", '\"')}}

        else:
            # Can't use/project an extent w/o a spatial reference
            import arcpy, sys
            arcpy.AddIDMessage("ERROR", 248)
            sys.exit(1)

    if data_store:
        context['dataStore'] = data_store

    if context:
        if desktop_context:
            return json.loads(json.dumps(context))
        else:
            return json.dumps(context)
    else:
        return None


def split_unit(val):
    """Split into value and units
    :param val: value/units string
    """
    if val.find(' ') > -1:
        val, unit = val.split(' ', maxsplit=1)
    else:
        unit = None
    val = val.replace(",", ".")
    return val, unit


def valuetable_to_list(vt):
    """"Convert arcpy.ValueTables into a list
    :param vt: arcpy.ValueTable
    """
    values = []
    for r in range(0, vt.rowCount):
        values.append([vt.getValue(r, c) for c in range(0, vt.columnCount)])
    return values


def get_big_data_connection_dataset_names(big_data_connection_path):
    """"Get all dataset aliases in a Big Data Connection file
            :param big_data_connection_path: Big Data Connection file path
            """
    from gautils import BigDataConnectionFile
    big_data_connection = BigDataConnectionFile.BigDataConnectionFile(big_data_connection_path)
    return big_data_connection.get_dataset_names()
