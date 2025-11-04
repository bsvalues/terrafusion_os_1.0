"""CreateDriveTimeAreas core logic executor."""
# pylint: disable=import-error,no-name-in-module
import os
import sys
from typing import List, Any, Optional
import logging

import arcpy
import arcpy.management

from common import (PAExecutor, PAFeatureLayer, AOLUtils,
                    LogExecutionTime, LogUtils, RemoteToolboxUtils,
                    AnalysisUtils, FieldUtils, ImmutableDict, CALFIELD_PY_METHOD)
from .nautils import NAUtils


LOGGER = LogUtils.setup_logger(__name__)


class CDTAExecutor(PAExecutor):
    """Core logic of CreateDriveTimeAreas tool."""

    TIME_UNITS = ("minutes", "seconds", "hours")
    MEASURE_TYPES = {"Driving": ("drive time", "drive distance"),
                     "Trucking": ("truck time", "truck distance"),
                     "Walking": ("walk time", "walk distance")}
    RESTRICTIONS_PARAMETER_INDEX = 16

    def __init__(
        self,
        input_layer: PAFeatureLayer,
        break_values: List,
        break_units: str,
        time_of_day: Any = None,
        overlap_policy: str = "Overlap",
        time_zone_for_time_of_day: str = "GeoLocal",
        travel_mode: str = "Driving",
        filter_input_layer_by_extent: bool = True,
        point_barrier_layer: Optional[PAFeatureLayer] = None,
        line_barrier_layer: Optional[PAFeatureLayer] = None,
        polygon_barrier_layer: Optional[PAFeatureLayer] = None,
        output_workspace: Any = "in_memory",
        travel_direction: str = "AwayFromFacility",
        include_holes: bool = False,
        include_streets: bool = False,
        portal_description: Optional[ImmutableDict] = None,
        out_travel_areas_path: str = None,
        out_travel_lines_path: str = None
    ):
        """Initialize the attributes.

        Args:
            input_layer: an instance of PAFeatureLayer.
            break_values: a list of numeric value represents measures (time or distance) of travel.
            break_units: units of the break value.
            time_of_day: a number represents a certain time of day.
            overlap_policy: a string with the option of overlap result.
            time_zone_for_time_of_day:
            travel_mode:
            filter_input_layer_by_extent:
            travel_mode_name:
            point_barrier_layer:
            line_barrier_layer:
            polygon_barrier_layer:
            output_workspace: path to a datastore to save the result. Add this parameter on purpose so it can be
            easily deployed for testing.
            travel_direction:
            include_holes:
            include_streets:
            portal_description:
            out_travel_areas_path: Path to user-specified output location for travel areas. Used in Model Builder.
            out_travel_lines_path: Path to user-specified output location for travel lines. Used in Model Builder.
        Returns:
            No returns.
        Raises:
            No exceptions.

        """
        self.input_layer = input_layer
        self.break_values = break_values
        self.break_units = break_units
        self.break_units_lower = break_units.lower()
        self.time_of_day = time_of_day
        self.overlap_policy = overlap_policy
        self.time_zone_for_time_of_day = time_zone_for_time_of_day
        self.travel_mode = travel_mode
        self.travel_mode_name = ""
        self.travel_mode_keywords = ("DRIVING", "WALKING", "TRUCKING")
        self.filter_input_layer_by_extent = filter_input_layer_by_extent
        self.point_barrier_layer = point_barrier_layer
        self.line_barrier_layer = line_barrier_layer
        self.polygon_barrier_layer = polygon_barrier_layer
        self.travel_direction = travel_direction
        self.include_holes = include_holes
        self.include_streets = include_streets
        if portal_description is None:
            self.portal_description = ImmutableDict(arcpy.GetPortalDescription())
        else:
            self.portal_description = portal_description

        # All outputs are created in the spatial reference of the input layer.
        # Note: If this logic ever changes, also update cdtatool.py in get_parameters() where it calls
        # self.check_overwrite_sr().
        if arcpy.env.outputCoordinateSystem:
            self.output_coordinate_system: arcpy.SpatialReference = arcpy.env.outputCoordinateSystem  # type: ignore
            LOGGER.debug("arcpy.env.outputCoordinateSystem is specified and will be used for outputs.")
        else:
            self.output_coordinate_system: arcpy.SpatialReference = self.input_layer.spatialReference  # type: ignore
            LOGGER.debug("The spatial reference of the Input Layer will be used for outputs.")

        self.input_layer_has_oid64 = arcpy.Describe(self.input_layer.layer).hasOID64
        self.orig_facility_oids = []

        self.break_values_str = " ".join([str(val) for val in break_values])
        self.output_workspace = output_workspace
        if out_travel_areas_path:
            self.drive_time_areas_output = AnalysisUtils.initialize_output_layer(
                specified_out_path=out_travel_areas_path)
        else:
            self.drive_time_areas_output = AnalysisUtils.initialize_output_layer(
                None, "TravelAreasOutput", output_workspace, True)
        if out_travel_lines_path:
            self.service_area_lines_output = AnalysisUtils.initialize_output_layer(
                specified_out_path=out_travel_lines_path)
        else:
            self.service_area_lines_output = AnalysisUtils.initialize_output_layer(
                None, "TravelAreasOutputLines", output_workspace, True)
        LOGGER.debug("Output drive time areas: {}".format(self.drive_time_areas_output.data))
        LOGGER.debug("Output lines: {}".format(self.service_area_lines_output.data))
        self.remote_job_id = ""
        self.task_cost = -1

    def check_service_area_limits(self, check_max_facilities: bool = True) -> bool:
        """Check if the inputs can be successfully used to create service areas using the world service area service.
        Returns False if a limit is violated, True otherwise.

        Args:
            check_max_facilities: a bool represents whether to check max facilities.
        Returns:
            True if the limitation checks passed and False otherwise.

        """
        # Get the tool limits from routing utilities service if available in the portal. Default is the limits imposed
        # by online services
        max_facilities_count = 1000
        infinity = sys.maxsize
        max_break_value = 300
        max_limit_error_code = 100103
        break_units_lower = self.break_units.lower()

        # Determine if we are generating time or distance based service areas
        if break_units_lower in self.TIME_UNITS:
            drive_measure_type = "time"
            default_max_break_value_units = "minutes"
        else:
            drive_measure_type = "distance"
            default_max_break_value_units = "miles"

        # Determine if the travel mode is Walking
        walking_mode = ""
        if self.travel_mode.upper() == "WALKING":
            walking_mode = "Walking"
        else:
            if self.travel_mode.upper() not in self.travel_mode_keywords:
                travel_mode_obj = NAUtils.get_travel_mode_from_json(self.travel_mode)
                if travel_mode_obj and (travel_mode_obj.type == "WALK" or "Walking" in travel_mode_obj.restrictions):
                    walking_mode = "Walking"
        LOGGER.debug(f"Is Walking Mode: {bool(walking_mode)}")

        # Get limits
        try:
            routing_utils_tbx = RemoteToolboxUtils.get_helper_service_url("routingUtilities",
                                                                          self.portal_description,
                                                                          log_error=False)
            LOGGER.debug(f"Getting tool limits from {routing_utils_tbx}")
            tool_limits = NAUtils.get_tool_limits(routing_utils_tbx, "asyncServiceArea", "GenerateServiceAreas")
            max_facilities = tool_limits.get("maximumFacilities", None)
        except Exception as err:
            LOGGER.debug(f"Unable to get max_facilities due to {str(err)}")
            max_facilities = None

        # Get the limit name based on the type of polygons being generated
        if self.include_holes:
            mb_term = f"maximumBreak{walking_mode}{drive_measure_type.title()}ValueDetailedPolygons"
            max_break_value = tool_limits.get(mb_term, None)
            mbu_term = f"maximumBreak{walking_mode}{drive_measure_type.title()}ValueUnitsDetailedPolygons"
            max_break_value_units = tool_limits.get(mbu_term, default_max_break_value_units)
            max_limit_error_code = 100278
        elif self.include_streets:
            mb_term = f"maximumBreak{walking_mode}{drive_measure_type.title()}ValueServiceAreaLines"
            max_break_value = tool_limits.get(mb_term, None)
            mbu_term = f"maximumBreak{walking_mode}{drive_measure_type.title()}ValueUnitsServiceAreaLines"
            max_break_value_units = tool_limits.get(mbu_term, default_max_break_value_units)
            max_limit_error_code = 100279
        else:
            mb_term = f"maximumBreak{walking_mode}{drive_measure_type.title()}Value"
            max_break_value = tool_limits.get(mb_term, None)
            mbu_term = f"maximumBreak{walking_mode}{drive_measure_type.title()}ValueUnits"
            max_break_value_units = tool_limits.get(mbu_term, default_max_break_value_units)
            max_limit_error_code = 100280 if walking_mode else 100103

        max_facilities_count = infinity if max_facilities is None else max_facilities
        max_break_value = infinity if max_break_value is None else max_break_value
        LOGGER.debug(f"Max facilities count: {max_facilities_count}")
        LOGGER.debug(f"Max break value {max_break_value} {max_break_value_units}")
        max_break_value = NAUtils.convert_units(max_break_value, max_break_value_units, break_units_lower)

        # Fail if any break value is greater than the max supported by logistics service. We report the max supported
        # value in user specified breakUnits. Fail if any break values are less than or equal to zero
        for break_val in self.break_values:
            if break_val <= 0:
                LOGGER.error(100099, extra={"message_ID": 100099})
                return False
            if break_val > max_break_value:
                msg_params = {
                    "message_ID": max_limit_error_code,
                    "max": max_break_value,
                    "breakUnits": break_units_lower,
                    "measureType": drive_measure_type.lower(),
                }
                LOGGER.error(max_limit_error_code, extra=msg_params)
                return False

        # Fail if we have more than MAX_FACILITIES_COUNT number of features in input layer
        if check_max_facilities and self.input_layer.count > max_facilities_count:
            msg_params = {
                "message_ID": 100040,
                "inputLayer": self.input_layer.layer_name,
                "max": max_facilities_count,
            }
            LOGGER.error(100040, extra=msg_params)
            return False
        return True

    def validate_parameters(self) -> bool:
        """Validate the parameters of the executor."""
        # Fail if we don't have at least one feature in input layer
        if self.input_layer.count < 1:
            LOGGER.error(100024, extra={"message_ID": 100024, "inputLayer": self.input_layer.layer_name})
            return False

        # Fail if we have an invalid travel mode. Valid values are Driving, Trucking,
        # Walking (in any case) and a JSON that represents a travel mode.
        if self.travel_mode.upper() not in self.travel_mode_keywords:
            travel_mode_object = NAUtils.get_travel_mode_from_json(self.travel_mode)
            if not travel_mode_object:
                # Travel mode json conversion must have failed. Error was already thrown. Just quit.
                return False
            self.travel_mode_name = travel_mode_object.name

        # Check if any limits imposed by logistics service is exceeded
        if not self.check_service_area_limits(True):
            LOGGER.debug("Failed to pass service area limits check.")
            raise arcpy.ExecuteError
        LOGGER.debug("Service area limits check ok.")
        return True

    def _preprocess_inputs(self):
        """Prepare the inputs for use."""
        # If the input doesn't have a 64bit OID field, we can pass it through exactly as is. Otherwise, we have to copy
        # it to remove 64bit OIDs and track the OID field mapping to restore in the tool output.
        if not self.input_layer_has_oid64:
            return self.input_layer.layer
        LOGGER.debug("Input facilities layer has 64bit OIDs. Copying to 32bit.")
        # Store an ordered list of original OIDs that we can reference by index later
        for row in arcpy.da.SearchCursor(self.input_layer.layer, ["OID@"]):
            self.orig_facility_oids.append(row[0])
        # Copy the features to output with 32bit OID values
        input_features_copy = AOLUtils.create_unique_name("TempInputFacilities", self.output_workspace)
        arcpy.conversion.FeatureClassToFeatureClass(self.input_layer.layer,
                                                    os.path.dirname(input_features_copy),
                                                    os.path.basename(input_features_copy))
        return input_features_copy

    def _update_facilityoid_field(self, output_fc):
        """Update the FacilityOID field in the output to transfer the original input values."""
        if not self.input_layer_has_oid64:
            # Nothing to do here
            return
        LOGGER.debug("Updating FacilityOID field values for 64bit OIDs")
        with arcpy.da.UpdateCursor(output_fc, ["FacilityOID"]) as cur:
            for row in cur:
                # Rely on indexing from the input.  Since the features have been copied, the OIDs of the input
                # facilities used in the analysis should be sequential starting at 1 and should correspond to the
                # indices of the list of original facility OIDs preserved in preprocessing.
                cur.updateRow((self.orig_facility_oids[row[0]-1],))

    def _post_process_output_analysis_areas(self, out_drive_time_areas: arcpy.FeatureSet):
        """Save the output analysis areas with the correct schema."""
        # Add the AnalysisArea field in breakUnits if breakUnits are distance based else add the analysis area based
        # on units in the user profile.
        if self.break_units_lower in self.TIME_UNITS:
            area_units = AnalysisUtils.get_units(self.portal_description, True)
            measure_unit_type = "Time"
        else:
            area_units = "Square{0}".format(self.break_units)
            measure_unit_type = "Distance"
        travel_mode_measure_type = "Travel {0}".format(measure_unit_type)
        # Set the travel mode name if we have legacy travel mode keywords
        if not self.travel_mode_name:
            self.travel_mode_name = "{0} {1}".format(self.travel_mode.title(), measure_unit_type)

        # Note to self: It would be more efficient to use field mapping and Export Features to copy the service output
        # and update the fields during the copy than to use Copy Features as below and do the updates afterwards using
        # Alter Field.  However, the more efficient method caused some inexplicable failures in the nas-api-tests.
        # The system managed shape and OID fields changed names or were missing, and we didn't understand why, so we
        # changed the code back to using Copy Features.
        # See discussion in https://devtopia.esri.com/ArcGISPro/Network-Analyst/issues/7679

        # Determine the correct geographic transformation
        out_drive_time_areas_desc = AOLUtils.describe(out_drive_time_areas)
        out_drive_time_areas_sr = out_drive_time_areas_desc.spatialReference
        out_drive_time_areas_extent = out_drive_time_areas_desc.extent
        transformation = NAUtils.get_datum_transformation(
            out_drive_time_areas_sr,
            self.output_coordinate_system,
            out_drive_time_areas_extent
        )
        # Write output with same spatial reference as input facilities
        with arcpy.EnvManager(
            extent=None, outputCoordinateSystem=self.output_coordinate_system,
            geographicTransformations=transformation
        ):
            arcpy.management.CopyFeatures(out_drive_time_areas, self.drive_time_areas_output.data)

        # Delete FacilityID fields from the output
        arcpy.management.DeleteField(self.drive_time_areas_output.data, "FacilityID")

        travel_mode_measure_type = "Travel {0}".format(measure_unit_type)
        FieldUtils.create_shape_area_field(self.drive_time_areas_output, area_units,
                                           area_field_alias="Area (Square {0})".format(area_units.lstrip("Square")))
        # Add aliases for the fields specific to polygons. Leave the alias joined from input points as is.
        field_aliases = {"FromBreak": "{0} Start ({1})".format(travel_mode_measure_type, self.break_units),
                         "ToBreak": "{0} End ({1})".format(travel_mode_measure_type, self.break_units),
                         "Name": "Name and Size",
                         "FacilityOID": "Facility ID"}
        for fld in field_aliases:
            arcpy.management.AlterField(self.drive_time_areas_output.data, fld, new_field_alias=field_aliases[fld])

        # Update FacilityOID field if necessary
        if self.input_layer_has_oid64:
            # Create a new BigInteger FacilityOID field with the same values as the original one
            fac_oid = "FacilityOID"
            fac_oid_64 = "FacilityOID64bit"
            arcpy.management.AddField(self.drive_time_areas_output.data, fac_oid_64, "BIGINTEGER")
            arcpy.management.CalculateField(
                self.drive_time_areas_output.data, fac_oid_64, f"!{fac_oid}!", CALFIELD_PY_METHOD)
            arcpy.management.DeleteField(self.drive_time_areas_output.data, fac_oid)
            arcpy.management.AlterField(self.drive_time_areas_output.data, fac_oid_64, new_field_name=fac_oid)
            # Update the FacilityOID field values with the OID values from the original input facilities
            self._update_facilityoid_field(self.drive_time_areas_output.data)

        # Log some info
        if LOGGER.level == logging.DEBUG:
            count_output_areas = self.drive_time_areas_output.count
            LOGGER.debug(f"Created {count_output_areas} drive time areas")
            LOGGER.debug(
                f"SR of {self.drive_time_areas_output.data} is {self.drive_time_areas_output.spatialReference.name}")

    def _post_process_output_lines(self, output_lines: arcpy.FeatureSet):
        """Save the output analysis areas with the correct schema."""
        if not self.include_streets:
            return
        LOGGER.debug("Saving output lines...")

        # Configure field mapping
        field_mappings = None
        if self.input_layer_has_oid64:
            field_mappings = NAUtils.make_field_maps(output_lines, [], {})
            facilityoid_idx = field_mappings.findFieldMapIndex("FacilityOID")
            if facilityoid_idx != -1:  # Only try if it was there in the first place
                field_mappings.removeFieldMap(facilityoid_idx)
                field_map = NAUtils.make_new_field_map_with_output_field(
                    "FacilityOID", "FacilityOID", "BigInteger")
                field_map.addInputField(output_lines, "FacilityOID")
                field_mappings.addFieldMap(field_map)

        # Copy the output lines
        out_lines_desc = AOLUtils.describe(output_lines)
        out_lines_sr = out_lines_desc.spatialReference
        out_lines_extent = out_lines_desc.extent
        transformation = NAUtils.get_datum_transformation(
            out_lines_sr,
            self.output_coordinate_system,
            out_lines_extent
        )
        # Write output with same spatial reference as input facilities
        with arcpy.EnvManager(
            extent=None, outputCoordinateSystem=self.output_coordinate_system,
            geographicTransformations=transformation
        ):
            arcpy.conversion.FeatureClassToFeatureClass(
                output_lines,
                os.path.dirname(self.service_area_lines_output.data),
                os.path.basename(self.service_area_lines_output.data),
                field_mapping=field_mappings
            )

        # Update FacilityOID field if necessary
        self._update_facilityoid_field(self.service_area_lines_output.data)

    def execute(self):
        """Execute the core logic of CreateDriveTimeAreas."""
        tbx = RemoteToolboxUtils.get_remote_toolbox("asyncServiceArea", self.portal_description)
        LOGGER.debug("Adding remote toolbox {0}".format(tbx))
        # Call the service
        overlap_policy_keywords = {"Overlap": "Overlapping",
                                   "Dissolve": "Merge by Break Value",
                                   "Split": "Not Overlapping"}
        travel_direction_keywords = {"AwayFromFacility": "Away From Facility",
                                     "TowardsFacility": "Towards Facility"}
        analysis_region = ""
        polygon_detail = "High" if self.include_holes else "Standard"
        service_area_output_type = "Polygons and lines" if self.include_streets else "Polygons"

        LOGGER.debug("input_layer feature count: {}".format(self.input_layer.count))
        facilities = self._preprocess_inputs()
        point_barr_lyr = self.point_barrier_layer.layer if self.point_barrier_layer else None
        line_barr_lyr = self.line_barrier_layer.layer if self.line_barrier_layer else None
        poly_barr_lyr = self.polygon_barrier_layer.layer if self.polygon_barrier_layer else None
        task_params = [facilities,
                       self.break_values_str,
                       self.break_units,
                       analysis_region,
                       travel_direction_keywords[self.travel_direction],
                       self.time_of_day, "", "",
                       overlap_policy_keywords[self.overlap_policy],
                       "", "", "", "",
                       point_barr_lyr,
                       line_barr_lyr,
                       poly_barr_lyr,
                       "", "",
                       NAUtils.TIME_ZONE_KEYWORDS[self.time_zone_for_time_of_day],
                       self.travel_mode,
                       "", "", "", "", "",
                       polygon_detail,
                       service_area_output_type]

        ignore_error_codes = (30097, 30113, 30114)
        service_result = NAUtils.call_async_gp_service(tbx, "GenerateServiceAreas", task_params,
                                                       ignore_error_codes,
                                                       (self.RESTRICTIONS_PARAMETER_INDEX,))
        self.remote_job_id = service_result.resultID

        # Save the results from the remote tool. Project the output features to be in the same spatial reference
        # as the inputLayer using copy features. Make sure to clear out the extent before copy.
        with LogExecutionTime("Saved the results from remote tool"):
            self._post_process_output_analysis_areas(service_result.getOutput(0))
            if self.include_streets:
                self._post_process_output_lines(service_result.getOutput(4))
            self.task_cost = NAUtils.get_remote_task_cost(service_result, 7)
