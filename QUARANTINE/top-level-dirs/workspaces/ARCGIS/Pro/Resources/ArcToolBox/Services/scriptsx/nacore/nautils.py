"""---------------------------------------------------------------------------
Name:              networkanalysis.py
Purpose:           Performs different types of network analyses using ArcGIS Online
                   network analysis services available on logistics.arcgis.com
Author:            Esri Inc.
Created:           4/23/2014
Copyright:   (c)   Esri, Inc. 2014
ArcGIS Version:    10.3 or later
---------------------------------------------------------------------------"""

import os
import sys
import locale
import time
import json
import sys
from typing import Union, List, Optional, Any, Dict, Tuple
import traceback

import arcpy
import arcpy.management
import arcpy.conversion
from arcpy.da import UpdateCursor  # type: ignore
from arcpy.na import TravelMode  # type: ignore
from arcpy._mp import Layer as mp_layer  # noqa. pylint: disable=import-error

from common import (  # noqa. pylint: disable=import-error,no-name-in-module
    PAFeatureLayer, LogUtils, FieldUtils, LogExecutionTime, AOLUtils,
    ToolCancellation, PortalUtils, PAOutputName, RemoteToolboxUtils)


SPATIALDATATYPE = Union[str, arcpy.FeatureSet, arcpy.RecordSet, mp_layer]

LOGGER = LogUtils.setup_logger(__name__)


class NAUtils:
    """Class module with network analysis related utility functions."""

    # Constants
    INFINITY = 2147483647  # python 2 sys.maxint value since it is used as default value for certain GPDouble parameters
    POINT_SHAPE_TYPES = ("point", "esrigeometrypoint")
    LINE_SHAPE_TYPES = ("polyline", "esrigeometrypolyline")
    POLYGON_SHAPE_TYPES = ("polygon", "esrigeometrypolygon")
    TIME_UNITS = ("SECONDS", "MINUTES", "HOURS", "DAYS")
    NETWORK_LOCATION_STATUS = {
        0: "Ok",
        1: "Not located",
        2: "Network element not located",
        3: "Element not traversable",
        4: "Invalid field values",
        5: "Not reached",
        6: "Time window violation",
        7: "Not located on closest"
    }
    TIME_ZONE_KEYWORDS = {
        "GeoLocal": "Geographically Local",
        "UTC": "UTC"
    }
    # Used in log_usage_metering()
    TRAVEL_MODE_TYPE_VALUES = {
        # These are the type values we get from valid JSON travel modes:
        "OTHER": 0,
        "AUTOMOBILE": 1,
        "TRUCK": 2,
        "WALK": 3,
        # These are our old-style special travel mode strings still accepted by some tools
        "DRIVING": 1,
        "TRUCKING": 2,
        "WALKING": 3,
        "Driving": 1,
        "Trucking": 2,
        "Walking": 3,
        "DRIVINGTIME": 1,
        "DRIVINGDISTANCE": 1,
        "TRUCKINGTIME": 2,
        "TRUCKINGDISTANCE": 2,
        "WALKINGTIME": 3,
        "WALKINGDISTANCE": 3
    }
    TIME_ZONE_VALUES = {
        "UTC": 0,
        "GeoLocal": 1,
    }
    FACILITY_TYPES = {
        '0': "Candidate",
        '1': "Required",
        '3': "Chosen",
    }
    # Mapping between domain types as returned by arcpy.da.Domain object and domain types used in JSON representation
    DOMAIN_TYPES = {
        "CodedValue": "codedValue",
        "Range": "range",
    }
    # Route layer data feature class names
    RD_FCN_STOPS = "Stops"
    RD_FCN_ROUTE_INFO = "RouteInfo"
    RD_FCN_DIRECTIONS = "DirectionLines"
    RD_FCN_DIRECTIONS_EVENTS = "DirectionPoints"
    RD_FCN_BARRIERS = "Barriers"
    RD_FCN_POLYLINE_BARRIERS = "PolylineBarriers"
    RD_FCN_POLYGON_BARRIERS = "PolygonBarriers"
    RD_FC_NAMES = [RD_FCN_STOPS, RD_FCN_ROUTE_INFO, RD_FCN_DIRECTIONS, RD_FCN_DIRECTIONS_EVENTS,
                   RD_FCN_BARRIERS, RD_FCN_POLYLINE_BARRIERS, RD_FCN_POLYGON_BARRIERS]
    # Maximum number of route layers that can be created in a portal by tool
    MAX_ROUTE_LAYER_COUNT = 1000
    SR_WGS84 = arcpy.SpatialReference(4326)
    MAX_FC_OUTPUT_ALLOWED = 9999
    # typeKeyword for include route item
    INC_RTE_KW = "Has Related Route Layers"

    @staticmethod
    def _call_async_service(
        tbx: str,
        task_name: str,
        task_params: List,
        update_task_params: Optional[Tuple] = None
    ) -> arcpy.Result:
        """_summary_

        Args:
            tbx (str): path of the toolbox to call.
            task_name (str): name of a specific tool to call.
            task_params (List): input parameters for the call.
            update_task_params (Optional[Tuple], optional): a list of indexes for the paramters
            to update. Defaults to None.

        Raises:
            ToolCancellation: cancel happening during remote task execution.
            SystemExit: cancel happening during remote task execution.
            Exception: any other exceptions not due to cancel.

        Returns:
            arcpy.Result: result of the remote task.
        """
        tbx_added = False
        job_id = ""
        service_result = None
        try:
            arcpy.gp.addToolbox(tbx)
            tbx_added = True
            with LogExecutionTime("Call to remote service"):
                tbx_name_parts = tbx.split(";")
                service_name = tbx_name_parts[1].split("/")[-1]
                qualified_task_name = f"{task_name}_{service_name}"
                gp_task = getattr(arcpy.gp, qualified_task_name)

                # Update task_params if required
                if update_task_params:
                    for index in update_task_params:
                        param_value = arcpy.GetParameterValue(qualified_task_name, index)
                        try:
                            task_params[index] = param_value
                        except IndexError:
                            LOGGER.debug(f"Failed to update default value for parameter at index {index}")
                service_result = gp_task(*task_params)
                job_id = service_result.resultID
                LOGGER.debug(f"Waiting for jobID: {job_id} to complete on {tbx_name_parts[0]}")

                with arcpy.EnvManager(autoCancelling=False):
                    # Wait for job to complete
                    while service_result.status < 4:
                        if arcpy.env.isCancelled:
                            service_result.cancel()
                            LOGGER.debug(f"Remote job {job_id} got cancelled.")
                            raise ToolCancellation
                        time.sleep(1)

                return service_result
        except SystemExit as err:
            if service_result:
                LOGGER.warning("Canceling ......")
                service_result.cancel()
            raise err
        except Exception as err:
            raise err
        finally:
            if tbx_added:
                try:
                    arcpy.gp.removeToolbox(tbx)
                except (arcpy.ExecuteError, RuntimeError):
                    NAUtils.log_error_call_stack()

    @staticmethod
    def call_async_gp_service(
        tbx: str,
        task_name: str,
        task_params: List,
        ignore_error_codes: Tuple,
        update_task_params: Optional[Tuple] = None
    ) -> Any:
        """Call an async GP service and returns the gp result object.

        Args:
            tbx: full url including the service name and credentials for the remote service.
            task_name: name of the specific task.
            task_params: list of parameter values in the order expected by the task.
            ignore_error_codes: list of error codes to ignore from the result when writing the messages
            from the task output.
            update_task_params: list of parameter indices from the remote tool. For each index, get the
            default value as specified in the remote service and update the task_params. This is useful for
            passing default restrictions as if the restriction parameter is not passed explicitly, the remote
            tool uses default restrictions defined to the network dataset level of the remote service.
        Returns:

        """
        try:
            service_result = NAUtils._call_async_service(tbx, task_name, task_params,
                                                         update_task_params)
        except RuntimeError as err:
            if "Token-based authentication failure" in str(err):
                LOGGER.debug("Call remote service failed due to {str(err)}")
                (tbx, updated) = RemoteToolboxUtils.renew_remote_tbx_token(tbx)
                if updated:
                    LOGGER.debug("Retry with renewed token.")
                    service_result = NAUtils._call_async_service(tbx, task_name, task_params,
                                                                 update_task_params)
                else:
                    raise err
            else:
                raise err
        except Exception as err:
            raise err

        # Add messages and return the result
        severity = service_result.maxSeverity
        if severity != 0:
            # Log error and warning messages from execution of remote tools. Messages that have
            # codes matching with ignore_error_codes are not logged.
            # Note that for local tools this can be achieved by calling arcpy.gp.GetAllMessages().
            # However when executing remote tools, arcpy.gp.GetAllMessages()
            # does not return the actual messages from the result object. Also result.getAllMessages()
            # does not populate the error codes for the error messages.
            messages = service_result.getMessages(severity).split("\n")
            msg_function = LOGGER.warning if severity == 1 else LOGGER.error
            # These error codes will be sent as args when raising arcpy.ExecuteError so that the calling code can
            # handle the error codes
            error_codes_to_raise = {}
            # Do not report any blank messages or messages that start with Failed
            for msg in messages:
                if msg:
                    if not msg.startswith("Failed"):
                        # Do not include error and warning codes
                        if msg.find(": ") != -1:
                            code, message = msg.split(": ", 1)
                            try:
                                code = int(code.split(" ")[-1])
                                if ignore_error_codes and code in ignore_error_codes:
                                    continue
                                else:
                                    error_codes_to_raise[code] = messages
                            except ValueError:
                                message = msg
                        else:
                            message = msg
                        msg_function(message)
            if severity == 2:
                if error_codes_to_raise:
                    raise arcpy.ExecuteError(error_codes_to_raise)
                else:
                    raise arcpy.ExecuteError

        return service_result

    @staticmethod
    def call_sync_gp_service(
        tbx: str,
        task_name: str,
        task_params: Union[List, Tuple]
    ) -> Any:
        """Call a synchronous GP service and return gp result.

        Args:
            tbx: full url including the service name and credentials for the remote service that can be obtained
            from aolutils.getRemoteToolbox.
            task_name: name of the tool in the service that will be executed.
            task_params: list of parameter values in the order expected by the task.
        Returns:
            GP result.

        """

        tbx_added = False
        service_result = None
        try:
            # Add the service
            with LogExecutionTime("Added remote toolbox"):
                RemoteToolboxUtils.add_remote_tbx(tbx)

            tbx_added = True

            # Call the service
            with LogExecutionTime("Completed call to remote service"):
                tbx_name_parts = tbx.split(";")
                service_name = tbx_name_parts[1].split("/")[-1]
                qualified_task_name = "{0}_{1}".format(task_name, service_name)
                if hasattr(arcpy.gp, qualified_task_name):
                    gp_task = getattr(arcpy.gp, qualified_task_name)
                    service_result = gp_task(*task_params)
                else:
                    service_result = None
        except Exception:
            raise
        finally:
            if tbx_added:
                # Remove the GP service as we no longer need to make any calls to it
                try:
                    arcpy.gp.removeToolbox(tbx)
                except:  # noqa. pylint: disable=bare-except
                    LOGGER.warning("Unable to remove the tool box at {0}.".format(tbx))
        return service_result

    @staticmethod
    def do_routing_services_use_agol(portal_description) -> bool:
        """Check if the routing services use AGOL.

        Even if the tool is running in Enterprise, Enterprise may proxy the
        routing services to AGOL.  Returns True when the tool is running in AGOL
        or the services proxy to AGOL.

        If for some reason we can't retrieve the necessary info from the portal
        description, return True.  It's safer to assume AGOL because we
        primarily use this function in setting analysis limits, and this will
        cause us to use stricter limits.
        """
        try:
            if not portal_description.get("isPortal"):
                # The tool is running in AGOL
                return True
            routing_source = portal_description.get("routingServicesSource").get("sourceName")
            LOGGER.debug(f"Routing services source: {routing_source}")
        except Exception as err:
            LOGGER.debug(f"Unable to get the routing services source. Msgs: {str(err)}")
            return True
        if routing_source == "ArcGISOnline":
            return True
        elif routing_source == "ArcGISEnterprise":
            return False
        elif routing_source == "Custom":
            # The user specified the url from standalone server one by one on their portal.
            # Typically it means the routing service didn't come from ArcGISOnline.
            return False
        else:
            # This should never happen.
            LOGGER.debug(f"Unrecognized routing services source: {routing_source}")
            return True

    @staticmethod
    def check_field_exists(input_field_name: str, input_layer: PAFeatureLayer) -> bool:
        """Throw an error if the field name does not exist on the input layer (case insensitive).

        Args:
            input_field_name (str): The name of the field to check for.
            input_layer (PAFeatureLayer): PAFeature layer in which to check for the field.

        Returns:
            bool: True if the field exists; False otherwise.

        Raises: Throws error 100087 if False but still returns False.
        """
        if not FieldUtils.verify_field_exists(input_layer, input_field_name):
            LOGGER.error(
                100087,
                extra={
                    "message_ID": 100087,
                    "inputLayer": input_layer.layer_name,
                    "fieldName": input_field_name
                }
            )
            return False
        return True

    @staticmethod
    def update_field_display_order(field_names: List, move_fields: List) -> List:
        """Update the field_names in an order defined by move_fields.

        Args:
            field_names (List): Ordered list of existing field names.
            move_fields (List): List of tuples of (field name, name of field this field should go after)

        Returns:
            List: Reordered list of fields
        """
        for move_field_name, move_after_field_name in move_fields:
            existing_field_index = field_names.index(move_field_name)
            new_field_index = field_names.index(move_after_field_name) + 1
            field_names.pop(existing_field_index)
            field_names.insert(new_field_index, move_field_name)
        return field_names

    @staticmethod
    def check_well_known_fields(layer: PAFeatureLayer) -> Optional[str]:
        """Perform a case insensitive search to check if the layer contains any well known fields.

        The well known fields are searched from left to right and first match is returned.

        Args:
            layer (PAFeatureLayer): Layer to check for well-known field values

        Returns:
            Optional[str]: The name of the first field in the data matching specific well known fields
        """
        matched_field = NAUtils.check_well_known_fields_object(layer)
        if matched_field:
            return matched_field.name
        return None

    @staticmethod
    def check_well_known_fields_object(layer: PAFeatureLayer) -> Optional[arcpy.Field]:
        """Perform a case insensitive search to check if the layer contains any well known fields.

        The well known fields are searched from left to right and first match is returned.

        Args:
            layer (PAFeatureLayer): Layer to check for well-known field values

        Returns:
            Optional[arcpy.Field]: The field object of the first field in the data matching specific well known fields
        """
        well_known_fields = ("NAME", "TITLE", "ADDRESS")
        matched_field = None

        # Store the fields from the layer
        layer_fields = {fld.name.upper(): fld for fld in layer.fields}

        for fld in well_known_fields:
            if fld in layer_fields:
                matched_field = layer_fields[fld]
                break
        return matched_field

    @staticmethod
    def make_field_maps(
            service_output: SPATIALDATATYPE, fields_to_delete: List, field_rename_dict: dict) -> arcpy.FieldMappings:
        """Create a FieldMappings object for deleting and renaming fields in ExportFeatures.

        Args:
            service_output (SPATIALDATATYPE): layer, feature set, etc. to create field mappings for
            fields_to_delete (List): List of field names that should be deleted in the final output.
            field_rename_dict (dict): Dictionary describing how to rename fields in the final output. Specified using a
                dictionary of {field name: tuple(updated field name, updated field alias)}
                Example: {"Weight": ("AllocatedDemand", "Allocated Demand")}

        Returns:
            arcpy.FieldMappings: a field mappings object that can be used in ExportFeatures.
        """
        with LogExecutionTime("Make field mappings"):
            field_mappings = arcpy.FieldMappings()
            # Initialize the field mappings using the default mappings from the original service output
            field_mappings.addTable(service_output)
            # Remove undesired fields from the field mappings object. These fields will not show up in the output.
            for field_name in fields_to_delete:
                field_idx = field_mappings.findFieldMapIndex(field_name)
                if field_idx != -1:  # Only remove it if it was there in the first place
                    field_mappings.removeFieldMap(field_idx)
            # Update the field mappings to rename fields from the input schema to the output schema
            for field_name in field_rename_dict:
                field_idx = field_mappings.findFieldMapIndex(field_name)
                if field_idx != -1:  # Only try if it was there in the first place
                    # Grab the field map object for this input field name
                    field_map: arcpy.FieldMap = field_mappings.getFieldMap(field_idx)  # type: ignore
                    # Get the output field object and update its name and alias
                    out_field_obj = field_map.outputField
                    out_field_obj.name = field_rename_dict[field_name][0]
                    out_field_obj.aliasName = field_rename_dict[field_name][1]
                    # Update the field map object with the updated field
                    field_map.outputField = out_field_obj
                    # Update the field mappings object with the updated field map
                    field_mappings.replaceFieldMap(field_idx, field_map)
        return field_mappings

    @staticmethod
    def make_new_field_map_with_output_field(
        out_field_name: str, out_field_alias: str, out_field_type: str, out_field_length=None,
        out_field_scale=None, out_field_precision=None
    ) -> arcpy.FieldMap:
        """Adds a new output field to a FieldMap object and returns the FieldMap.

        The FieldMap can be added to a FieldMappings object that, when used in ExportFeatures, causes the
        specified new field to be added to the new output.

        Args:
            out_field_name (str): Name for the new output field.
            out_field_alias (str): Alias for the new output field.
            out_field_type (str): Type for the new output field.
            out_field_length ([type], optional): Length for the new output field. Defaults to None.

        Returns:
            arcpy.FieldMap: Updated field map object that can be used in ExportFeatures.
        """
        # Create a new field object
        new_field = arcpy.Field()
        new_field.name = out_field_name
        new_field.aliasName = out_field_alias
        new_field.type = out_field_type
        if out_field_length is not None:
            new_field.length = out_field_length
        if out_field_scale is not None:
            new_field.scale = out_field_scale
        if out_field_precision is not None:
            new_field.precision = out_field_precision
        # Create a new field map object and set the new field as the output field
        new_fm = arcpy.FieldMap()
        new_fm.outputField = new_field
        return new_fm

    @staticmethod
    def make_status_field_map() -> arcpy.FieldMap:
        """Create a new field mapping object with an output field called Status.

        Used by multiple tools for converting the integer-based Status field to text."""
        return NAUtils.make_new_field_map_with_output_field("Status", "Status", "String", 30)

    @staticmethod
    def calc_status_field(data_path: str):
        """Update Status field with string values translated from StatusLong enums, then delete StatusLong field.

        Args:
            data_path (str): Feature class whose fields to modify. It must already have StatusLong and Status fields.
        """
        with UpdateCursor(data_path, ("StatusLong", "Status")) as cur:
            for row in cur:
                cur.updateRow((row[0], NAUtils.NETWORK_LOCATION_STATUS.get(row[0], str(row[0]))))
        # Delete StatusLong field because we're done with it
        arcpy.management.DeleteField(data_path, ["StatusLong"])

    @staticmethod
    def get_unique_field_name(base_name: str, field_names: list) -> str:
        """Returns a unique field name based on the base_name that does not exists in field_names.

        If base_name already exists in field_names, a unique name is generated by appending a number after base_name,
        such as base_name_1, etc., until a unique name is found.

        Args:
            base_name (str): The base name of the field you want to add in the output and which needs to be unique.
            field_names (list): List of existing field names in the output.

        Returns:
            str: Unique field name
        """
        if base_name not in field_names:
            return base_name
        fld_name = base_name
        for i in range(0, len(field_names)):
            fld_name = "{0}_{1}".format(base_name, i + 1)
            if fld_name in field_names:
                continue
            else:
                break
        return fld_name

    @staticmethod
    def get_tool_limits(utilities_toolbox: Union[Tuple, str], helper_service: str, tool_name: str) -> Any:
        """Get tool limits for the tool_name in the helper_service.

        Args:
            utilities_toolbox: path of the utilities toolbox.
            helper_service: name of the helper service.
            tool_name: name of the tool.
        Returns:
            Tool limits of the tool obtained from helper_service.

        """
        tool_limits = {}
        # Call the GetToolInfo tool within routing utilities service
        if isinstance(utilities_toolbox, tuple):
            url, token, referrer = utilities_toolbox
            # Call using REST
            tool_params = {
                "serviceName": helper_service,
                "toolName": tool_name,
                "f": "json"
            }
            if token:
                tool_params["token"] = token
            tool_result = AOLUtils.mk_post_request(f"{url}/GetToolInfo/execute",
                                                      data=tool_params,
                                                      headers={"referer": referrer},
                                                      verify=False)
            tool_limits = tool_result.get("results", [{}])[0].get("value", {}).get("serviceLimits", {})
        else:
            tool_params = (helper_service, tool_name)
            tool_result = NAUtils.call_sync_gp_service(utilities_toolbox, "GetToolInfo", tool_params)
            if tool_result:
                tool_limits = json.loads(tool_result.getOutput(0)).get("serviceLimits", {})
        return tool_limits

    @staticmethod
    def raise_barrier_limit_error(remote_tool_msgs):
        """Raise the error message to indicate the barrier feature limit has been exceeded.

        Args:
            remote_tool_msgs: A list of messages returned from running the remote tool.

        Raises:
            100267 if PolygonBarriers limit exceeded
            100266 if PolylineBarriers limit exceeded
            100265 if Barriers (point barriers) limit exceeded
        """
        # The limits for barriers are hardcoded as there is no easy way to deduce the limits. The remote service
        # includes the limit as part of error message string which is subject to localization on origin server
        msg_code = 0
        limit = None
        if isinstance(remote_tool_msgs, str):
            if "PolygonBarriers" in remote_tool_msgs:
                msg_code = 100267
                limit = 2000
            elif "PolylineBarriers" in remote_tool_msgs:
                msg_code = 100266
                limit = 500
            elif "Barriers" in remote_tool_msgs:
                msg_code = 100265
                limit = 250
        else:
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
            LOGGER.error(msg_code, extra={"message_ID": msg_code, "limit": limit})
            return False
        return True

    @staticmethod
    def convert_units(
        value: Union[int, float],
        from_unit: str,
        to_unit: str,
        rounding_precision: int = 3
    ) -> Union[int, float]:
        """Convert values from one time or distance unit to another."""

        time_units = ('minutes', 'hours', 'days', 'seconds')
        base_distance_unit = 'meters'
        base_time_unit = 'minutes'

        from_unit = from_unit.lower()
        to_unit = to_unit.lower()
        if from_unit == "nautical miles":
            from_unit = "nauticalmiles"
        if to_unit == "nautical miles":
            to_unit = "nauticalmiles"
        # if the from and to units are same, just return the original value
        if from_unit == to_unit:
            return value

        # Determine if we are doing a conversion between time units or distance units
        base_unit = base_time_unit if from_unit in time_units else base_distance_unit
        # Store the constants that convert from one unit to another in a dictionary. Key is the tuple
        # (from unit, to unit) Value is the conversion constant.
        conversion_from_meters = {('meters', 'kilometers'): 0.001,
                                  ('meters', 'feet'): 3.2808399,
                                  ('meters', 'miles'): 0.000621371192,
                                  ('meters', 'yards'): 1.0936133,
                                  ('meters', 'nauticalmiles'): 0.000539956803}
        conversion_to_meters = {('kilometers', 'meters'): 1000.0,
                                ('feet', 'meters'): 0.3048,
                                ('miles', 'meters'): 1609.344,
                                ('yards', 'meters'): 0.9144,
                                ('nauticalmiles', 'meters'): 1852.0,
                                ('meters', 'meters'): 1.0}
        conversion_from_minutes = {('minutes', 'hours'): 0.0166666667,
                                   ('minutes', 'days'): 0.000694444444,
                                   ('minutes', 'seconds'): 60.0}
        conversion_to_minutes = {('hours', 'minutes'): 60.0,
                                 ('days', 'minutes'): 1440.0,
                                 ('seconds', 'minutes'): 0.0166666667,
                                 ('minutes', 'minutes'): 1.0}
        # We first convert value in the 'from unit' to a value in the base unit
        # and then from base unit to the to unit.
        dict_key1 = (from_unit, base_unit)
        dict_key2 = (base_unit, to_unit)
        # Get the first and second conversion constants from the appropriate dicts.
        # If key is not found use conversion constant equal to 1.
        if base_unit == base_distance_unit:
            first_constant_to_use = conversion_to_meters.get(dict_key1, 1.0)  # type: ignore
            second_constant_to_use = conversion_from_meters.get(dict_key2, 1.0)  # type: ignore
        else:
            first_constant_to_use = conversion_to_minutes.get(dict_key1, 1.0)  # type: ignore
            second_constant_to_use = conversion_from_minutes.get(dict_key2, 1.0)  # type: ignore
        return round(value * first_constant_to_use * second_constant_to_use, rounding_precision)

    @staticmethod
    def str_to_float(input_str: str) -> float:
        """convert a string to a float"""

        # set the locale for all categories to the user’s default setting. This is required on some OS like German
        # and Russian to read the appropriate decimal separator

        locale.setlocale(locale.LC_ALL, '')
        try:
            return locale.atof(input_str)
        except UnicodeDecodeError:
            return locale.atof(input_str.encode("utf-8", "ignore"))  # type: ignore
        except Exception as err:
            if isinstance(input_str, str):
                if "," in input_str:
                    input_str = input_str.replace(",", ".")
                    return float(input_str)
                else:
                    raise err
            else:
                raise err

    @staticmethod
    def get_user_culture(self_description: Dict) -> str:
        """Returns the culture for the logged in user

        Args:
            self_description: json returned from self call.

        Returns:
            A string representing the user culture.

        """
        if "user" in self_description:
            user_culture = self_description["user"].get("culture", "en")
        else:
            # Use the culture for the entire org
            user_culture = self_description.get("culture", "en")
        return user_culture

    @staticmethod
    def get_travel_mode_from_json(travel_mode_json: str) -> TravelMode:
        """Get an arcpy.na.TravelMode object from a stringified JSON.

        Args:
            travel_mode_json (str): A valid stringified JSON representation of a travel mode.

        Returns:
            arcpy.na.TravelMode: Travel mode object representation of the travel mode.

        Raises: Throws error 100145 if a travel mode object cannot be created from the given json.
        """
        try:
            if hasattr(TravelMode, "_JSON"):
                travel_mode = TravelMode()
                travel_mode._JSON = travel_mode_json
            else:
                travel_mode = TravelMode(travel_mode_json)
            return travel_mode
        except (ValueError, TypeError):
            LOGGER.error(100145, extra={"message_ID": 100145, "travelMode": travel_mode_json})
            return None

    @staticmethod
    def is_travel_mode_time_based(travel_mode_obj: TravelMode) -> bool:
        """Determine whether the travel mode uses a time-based impedance attribute.

        Args:
            travel_mode_obj (arcpy.na.TravelMode): Travel mode object to check.

        Returns:
            bool: True if the travel mode is time-based; False otherwise.
        """
        if travel_mode_obj.impedance == travel_mode_obj.timeAttributeName:
            # Travel mode is time based
            return True
        else:
            # Travel mode is distance based
            return False

    @staticmethod
    def get_travel_mode_type_as_int(travel_mode_json: str) -> int:
        """Return an integer designation of the travel mode's type.

        Args:
            travel_mode_json (str): JSON representation of a travel mode or special old-style keyword, such as "WALKING"

        Returns:
            int: Integer representing the travel mode's type based on a specific dictionary of values.
        """
        try:
            # Check if the travel mode string is one of the old-style keywords used in our tools
            travel_mode_type = NAUtils.TRAVEL_MODE_TYPE_VALUES[travel_mode_json]
            return travel_mode_type
        except KeyError:
            # It wasn't. Try with json next
            pass

        try:
            # Get the string type value from the travel mode's json
            travel_mode_type = json.loads(travel_mode_json)["type"]
            # Convert the string to an into type
            return NAUtils.TRAVEL_MODE_TYPE_VALUES.get(travel_mode_type, 0)
        except Exception:  # pylint:disable=broad-except
            # The travel mode wasn't json, or the json was invalid. Just return 0, which corresponds to "OTHER" for the
            # type. Tools using travel modes should check their validity in tool validation and throw an error there.
            # This check is mostly for the Choose Best Facilities tool, which calls this method pre-validation when
            # setting cost parameters, and we just need it to not fail so it can get far enough into validation to fail
            # nicely.
            return 0

    @staticmethod
    def log_error_call_stack():
        """Adds the callstack from the exception as GP messages"""
        msgs = traceback.format_exception(*sys.exc_info())[1:]  # type: ignore
        for msg in msgs:
            LOGGER.debug(msg.strip())

    @staticmethod
    def handle_walking_limit_error(tool_limits: Dict):
        """Log an error when the remote solver throws an error indicating that the walking limit has been exceeded."""
        msg_code = 100258
        walking_limit = tool_limits.get("maximumGeodesicDistanceWhenWalking", 27)
        walking_limit_unit = tool_limits.get(
            "maximumGeodesicDistanceUnitsWhenWalking", "Miles")
        msg_params = {
            "message_ID": msg_code,
            "mileValue": NAUtils.convert_units(walking_limit, walking_limit_unit, "Miles"),
            "kmValue": NAUtils.convert_units(walking_limit, walking_limit_unit, "Kilometers"),
        }
        LOGGER.error(msg_code, extra=msg_params)

    @staticmethod
    def handle_solver_com_errors(remote_tool_msgs: Union[List, Tuple]):
        """Log solver COM error messages returned from the service that don't have a GP error code."""
        # Scrub irrelevant errors and return what's left to the user. These errors will be in the language of the
        # service, which may not match the user's language, but at least they can call Support and get help.  It's
        # better than not returning these errors at all.
        # See https://devtopia.esri.com/ArcGISPro/Network-Analyst/issues/7623
        # Example of what we might be getting back at this point:
        # [
        #     'The number of Facilities to locate exceeds the valid Facilities count.',
        #     'ERROR 030024: Solve returned a failure.',
        #     'General function failure.',
        #     'Failed to execute (SolveLocationAllocation).',
        #     'Failed.',
        #     ''
        # ]
        com_errors = []
        for err in remote_tool_msgs:
            # Note: Some of the messages we're culling will only be culled in English, but at least we're removing
            # useless ones some of the time.
            if (
                err and \
                "030024" not in err and \
                err != "Failed." and \
                "General function failure" not in err
            ):
                com_errors.append(err)
        if not com_errors:
            err_msg = ""
        else:
            err_msg = "\n".join(com_errors)
        # Routing service solve failed. Errors returned from server: {errMsg}
        LOGGER.error(100363, extra={"message_ID": 100363, "errMsg": err_msg})

    @staticmethod
    def get_datum_transformation(
            in_sr: arcpy.SpatialReference, out_sr: arcpy.SpatialReference, extent: arcpy.Extent) -> Optional[str]:
        """Determine the correct transformation to use between the input and output spatial references.

        Args:
            in_sr (arcpy.SpatialReference): Spatial reference of the original input.
            out_sr (arcpy.SpatialReference): Desired spatial reference of the output.
            extent (arcpy.Extent): Extent of the features that will be projected from one spatial reference to another.

        Returns:
            Optional[str]: If a transformation is required, the string name of the transformation. None otherwise.
                The returned value is acceptable for use in arcpy.env.
        """
        if in_sr == out_sr:
            return None
        # ListTransformations lists, in order of best accuracy, the datum transformations that should be used when
        # projecting one coordinate system to another.
        transformations: List[str] = arcpy.ListTransformations(in_sr, out_sr, extent)  # type: ignore
        if transformations:
            return transformations[0]
        else:
            return None

    @staticmethod
    def copy_service_output_to_fc(
            service_output: SPATIALDATATYPE, output_data_path: str,
            field_mappings: Optional[arcpy.FieldMappings],
            output_sr: arcpy.SpatialReference):
        """Write the AGOL service output to the final tool output location with correct schema and spatial reference.

        Args:
            service_output (SPATIALDATATYPE): Output feature set retrieved from calling the AGOL NA services.
            output_data_path (str): File path of the output feature class to save the results to.
            field_mappings (arcpy.FieldMappings): Field mappings object, used primarily to update schema.
            output_sr (arcpy.SpatialReference): Spatial reference for the output.
        """
        # Determine the correct geographic transformation
        service_output_desc = AOLUtils.describe(service_output)  # type: ignore
        service_output_sr = service_output_desc.spatialReference
        service_output_extent = service_output_desc.extent
        transformation = NAUtils.get_datum_transformation(
            service_output_sr,
            output_sr,
            service_output_extent
        )
        # Write output
        with arcpy.EnvManager(
            extent=None,
            outputCoordinateSystem=output_sr,
            geographicTransformations=transformation
        ):
            arcpy.conversion.FeatureClassToFeatureClass(
                service_output,
                os.path.dirname(output_data_path),
                os.path.basename(output_data_path),
                field_mapping=field_mappings
            )

    @classmethod
    def update_published_item(cls, output_name: PAOutputName):
        """Update the item published to add additional typeKeywords.

        Args:
            item_id (str): the published item to update.
        """
        if not output_name.create_service:
            return
        if "itemId" in output_name.json.get("itemProperties", {}):
            item_id = output_name.json["itemProperties"]["itemId"]
        else:
            item_id = output_name.created_item_id
        LOGGER.debug(f"About to update {item_id}")
        item_json = PortalUtils.get_item(item_id)
        existing_type_kw = item_json.get("typeKeywords", [])
        existing_type_kw.append(cls.INC_RTE_KW)
        update_item_prop = {"typeKeywords": existing_type_kw}
        PortalUtils.update_portal_item(item_id, update_item_prop)
        LOGGER.debug(f"{item_id} updated.")

    @classmethod
    def get_remote_task_cost(cls, result: arcpy.Result, index: int) -> float:
        """Unpack the cost from the remote result.

        Args:
            result (arcpy.Result): Result object from ArcSOC.
            index (int): index to fetch from.

        Returns:
            The cost in credits from the remote result.
        """
        try:
            usage_cost = json.loads(result.getOutput(index))  # type: ignore
            return usage_cost["credits"]
        except Exception as err:
            LOGGER.debug(f"Unable to get the usage cost due to {str(err)}")
            return -1
