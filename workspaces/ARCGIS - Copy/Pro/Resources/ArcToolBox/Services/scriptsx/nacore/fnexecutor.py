"""FindNearest core logic executor."""
# pylint: disable=import-error,no-name-in-module
import os
from typing import Any, Optional, Tuple, Union

import arcpy
import arcpy.management
import arcpy.conversion
import arcpy.analysis
from arcpy.da import UpdateCursor, InsertCursor, SearchCursor  # type: ignore

from common import (PAExecutor, PAFeatureLayer, AOLUtils,
                    LogExecutionTime, LogUtils, RemoteToolboxUtils, AnalysisUtils,
                    ImmutableDict)
from .nautils import NAUtils


LOGGER = LogUtils.setup_logger(__name__)


class FNExecutor(PAExecutor):
    """Core logic of FindNearest tool."""

    def __init__(
        self,
        analysis_layer: PAFeatureLayer,
        near_layer: PAFeatureLayer,
        measurement_method: str,
        max_count: Union[int, float],
        search_cutoff: float,
        search_cutoff_units: str,
        time_of_day: Any = None,
        time_zone_for_time_of_day: str = "GeoLocal",
        include_route_layers: bool = False,
        point_barrier_layer: Optional[PAFeatureLayer] = None,
        line_barrier_layer: Optional[PAFeatureLayer] = None,
        polygon_barrier_layer: Optional[PAFeatureLayer] = None,
        output_workspace: Any = "in_memory",
        portal_description: Optional[ImmutableDict] = None
    ):
        """Initialize the attributes.

        Args:
            analysis_layer: Input points for which to find nearest
            near_layer: Input points representing potential nearest locations
            measurement_method: Whether to calculate distance based on straight lines or network
            max_count: Number of nearest locations to find
            search_cutoff: Cutoff distance after which to stop searching for nearest locations
            search_cutoff_units: Units of the search_cutoff
            time_of_day: Analysis time of day.
            time_zone_for_time_of_day: Whether the time_of_day value is geolocal or UTC.
            include_route_layers: Whether to include route data (for use in Navigator, etc.) in the output
            point_barrier_layer: Point barriers to use in the analysis.
            line_barrier_layer: Line barriers to use in the analysis.
            polygon_barrier_layer: Polygon barriers to use in the analysis.
            output_workspace: Location to save the output feature classes.
            portal_description: Description of portal.
        Returns:
            No returns.
        Raises:
            No exceptions.

        """
        self.analysis_layer = analysis_layer
        if not self.analysis_layer.layer_name:
            self.analysis_layer.layer_name = "Analysis Layer"
        self.near_layer = near_layer
        if not self.near_layer.layer_name:
            self.near_layer.layer_name = "Near Layer"
        self.measurement_method = measurement_method
        self.max_count = max_count
        self.search_cutoff = search_cutoff
        self.search_cutoff_units = search_cutoff_units
        self.time_of_day = time_of_day
        self.time_zone_for_time_of_day = time_zone_for_time_of_day
        self.include_route_layers = include_route_layers
        self.point_barrier_layer = point_barrier_layer
        self.line_barrier_layer = line_barrier_layer
        self.polygon_barrier_layer = polygon_barrier_layer
        self.output_workspace = output_workspace

        if portal_description is None:
            self.portal_description = ImmutableDict(arcpy.GetPortalDescription())
        else:
            self.portal_description = portal_description

        # Determine the directions language based on the culture of the user if generating route layers
        self.directions_language = "en"
        if self.include_route_layers:
            self.directions_language = NAUtils.get_user_culture(self.portal_description)

        # Set up outputs
        self.output_near_locations = AnalysisUtils.initialize_output_layer(None,
                                                                           "NearestLocations",
                                                                           self.output_workspace,
                                                                           True)
        self.output_near_locations_name = os.path.basename(self.output_near_locations.data)
        self.output_connecting_lines = AnalysisUtils.initialize_output_layer(None,
                                                                             "ConnectingLines",
                                                                             self.output_workspace,
                                                                             True)
        self.output_connecting_lines_name = os.path.basename(self.output_connecting_lines.data)
        LOGGER.debug("Output near locations: {}".format(self.output_near_locations.data))
        LOGGER.debug("Output connecting lines: {}".format(self.output_connecting_lines.data))

        # Get the tool limits
        # Default is infinity for Enterprise and hard-coded to the AGOL service limits if the NA services
        # being called are running in AGOL (directly or proxied).
        # We'll override the defaults by checking with the utility service
        # See https://devtopia.esri.com/ArcGISPro/Network-Analyst/issues/7669
        if NAUtils.do_routing_services_use_agol(self.portal_description):
            self.max_count_per_location = 100
            self.max_analysis_features = 5000
            self.max_near_features = 5000
        else:
            self.max_count_per_location = NAUtils.INFINITY
            self.max_analysis_features = NAUtils.INFINITY
            self.max_near_features = NAUtils.INFINITY
        self.tool_limits = {}
        # Check utility service to override default limits if possible/necessary
        self._get_service_limits()
        LOGGER.debug(f"Max analysis features: {self.max_analysis_features}")
        LOGGER.debug(f"Max near features: {self.max_near_features}")
        LOGGER.debug(f"Max count per location: {self.max_count_per_location}")

        self.analysis_layer_has_oid64 = arcpy.Describe(self.analysis_layer.layer).hasOID64
        self.near_layer_has_oid64 = arcpy.Describe(self.near_layer.layer).hasOID64

        # Actual inputs passed to the service. They will be populated during input preprocessing.
        self.input_analysis_locs = None
        self.input_near_locs = None

        # Set the output coordinate system to near locations layer if not set in environments
        # Note: If this logic ever changes, also update fntool.py in get_parameters() where it calls
        # self.check_overwrite_sr().
        if arcpy.env.outputCoordinateSystem:  # type: ignore
            self.output_coordinate_system: arcpy.SpatialReference = arcpy.env.outputCoordinateSystem  # type: ignore
            LOGGER.debug("arcpy.env.outputCoordinateSystem is specified and will be used for outputs.")
        else:
            self.output_coordinate_system: arcpy.SpatialReference = self.near_layer.spatialReference  # type: ignore
            LOGGER.debug("The spatial reference of the Near Layer will be used for outputs.")
        LOGGER.debug(f"Output spatial reference: {self.output_coordinate_system.name}")  # type: ignore

        # Other shared parameters
        self.analysis_layer_id_field = None
        self.near_layer_id_field = None
        self.is_travel_mode_time_based = False
        self.travel_mode_name = "Line Distance"
        self.remote_job_id = ""
        self.route_layer_item_id_field_name = "RouteLayerItemID"
        self.route_layer_item_url_field_name = "RouteLayerItemURL"
        self.route_data = None
        self.task_cost = -1

    def _get_service_limits(self):
        """Get the tool limits imposed by the service."""
        # Determine if routingUtilities is available to check service limits and override default limits for this tool
        # if limits are returned.
        if "routingUtilities" in self.portal_description.get("helperServices", {}):
            try:
                routing_utils_tbx = RemoteToolboxUtils.get_helper_service_url(
                    "routingUtilities", self.portal_description,
                    log_error=False
                )
                LOGGER.debug(f"Getting tool limits from {routing_utils_tbx}")
                self.tool_limits = NAUtils.get_tool_limits(
                    routing_utils_tbx, "asyncClosestFacility", "FindClosestFacilities"
                )
                self.max_analysis_features = self.tool_limits.get("maximumIncidents", NAUtils.INFINITY)
                if self.max_analysis_features is None:
                    self.max_analysis_features = NAUtils.INFINITY
                self.max_near_features = self.tool_limits.get("maximumFacilities", NAUtils.INFINITY)
                if self.max_near_features is None:
                    self.max_near_features = NAUtils.INFINITY
                self.max_count_per_location = self.tool_limits.get("maximumFacilitiesToFind", NAUtils.INFINITY)
                if self.max_count_per_location is None:
                    self.max_count_per_location = NAUtils.INFINITY
            except Exception:
                LOGGER.debug("Failed to get tool limits from routingUtilities helper service. Using tool defaults.")
                pass

    def validate_parameters(self) -> bool:
        """Validate the parameters of the executor."""
        # Fail if max_count_per_locations exceeds the max supported
        if self.max_count > self.max_count_per_location:
            LOGGER.error(100031, extra={"message_ID": 100031, "max": self.max_count_per_location})
            return False
        # Fail if search_cutoff is less than zero
        if self.search_cutoff < 0:
            LOGGER.error(100038, extra={"message_ID": 100038})
            return False
        # Fail if measurement method is straight and requesting Route Layers
        if self.measurement_method == "StraightLine" and self.include_route_layers:
            LOGGER.error(100218, extra={"message_ID": 100218})
            return False

        # Fail if we have too many input features
        if self.analysis_layer.count > self.max_analysis_features:
            LOGGER.error(100040, extra={
                "message_ID": 100040,
                "inputLayer": self.analysis_layer.layer_name,
                "max": self.max_analysis_features})
            return False
        if self.near_layer.count > self.max_near_features:
            LOGGER.error(100040, extra={
                "message_ID": 100040,
                "inputLayer": self.near_layer.layer_name,
                "max": self.max_near_features})
            return False

        # Fail if we don't have at least one feature in the inputs
        if self.analysis_layer.count < 1:
            LOGGER.error(100032, extra={"message_ID": 100032, "analysisLayer": self.analysis_layer.layer_name})
            return False
        if self.near_layer.count < 1:
            LOGGER.error(100033, extra={"message_ID": 100033, "nearLayer": self.near_layer.layer_name})
            return False

        # Validation checks specific to straight-line (non-network) measurement methods
        if self.measurement_method == "StraightLine":
            # Fail if using barriers
            for barrier_layer, barrier_type in ((self.point_barrier_layer, "pointBarrierLayer"),
                                                (self.line_barrier_layer, "lineBarrierLayer"),
                                                (self.polygon_barrier_layer, "polygonBarrierLayer")):
                if barrier_layer and barrier_layer.count:
                    LOGGER.error(100263, extra={"message_ID": 100263, "barrierType": barrier_type})
                    return False

        # Validation checks specific to network analysis measurement methods
        else:
            # Fail if the measurement method is not a valid travel mode JSON or one of the legacy travel mode strings
            if self.measurement_method.upper() not in (
                "DRIVINGTIME", "DRIVINGDISTANCE", "WALKINGTIME", "WALKINGDISTANCE", "TRUCKINGTIME", "TRUCKINGDISTANCE"
            ):
                travel_mode_obj = NAUtils.get_travel_mode_from_json(self.measurement_method)
                if not travel_mode_obj:
                    # Travel mode json conversion must have failed. Error was already thrown. Just quit.
                    return False
                self.travel_mode_name = travel_mode_obj.name
                self.is_travel_mode_time_based = NAUtils.is_travel_mode_time_based(travel_mode_obj)
            else:
                self.travel_mode_name = self.measurement_method
                if self.travel_mode_name.upper() in ("DRIVINGTIME", "WALKINGTIME", "TRUCKINGTIME",):
                    self.is_travel_mode_time_based = True

            # Fail if analysis_layer and near_layer shape type is polyline or polygon when using network
            if self.analysis_layer.shapeType.lower() not in NAUtils.POINT_SHAPE_TYPES:
                LOGGER.error(100036, extra={
                    "message_ID": 100036,
                    "measurementType": self.travel_mode_name,
                    "analysisLayer": self.analysis_layer.layer_name
                })
                return False
            if self.near_layer.shapeType.lower() not in NAUtils.POINT_SHAPE_TYPES:
                LOGGER.error(100037, extra={
                    "message_ID": 100037,
                    "measurementType": self.travel_mode_name,
                    "nearLayer": self.analysis_layer.layer_name
                })
                return False

        return True

    def _preprocess_inputs(self):
        """Prepare the inputs for use."""
        self.input_analysis_locs, self.analysis_layer_id_field = self._copy_input_with_updated_schema(
            self.analysis_layer, self.analysis_layer_has_oid64
        )
        self.input_near_locs, self.near_layer_id_field = self._copy_input_with_updated_schema(
            self.near_layer, self.near_layer_has_oid64
        )

    def _copy_input_with_updated_schema(
            self, input_layer: PAFeatureLayer, input_layer_has_oid64: bool
    ) -> Tuple[str, str]:
        """Creates the copy of input features that contain all the fields from input features field."""
        # Set up the path for a copy of the input features
        input_features_copy_name: str = arcpy.ValidateTableName(input_layer.layer_name,  # type: ignore
                                                                self.output_workspace)
        input_features_copy = AOLUtils.create_unique_name(input_features_copy_name, self.output_workspace)

        # Configure field mapping
        input_features_copy_fms = NAUtils.make_field_maps(input_layer.data, [], {})
        # Set up a mapping to copy over the original OID field to a regular field to preserve it
        oid_fm = arcpy.FieldMap()
        id_field_name = NAUtils.get_unique_field_name("ORIG_FID", [fld.name for fld in input_layer.fields])
        oid_fm.addInputField(input_layer.layer, input_layer.oidFieldName)
        output_fld = oid_fm.outputField
        output_fld.name = id_field_name
        output_fld.type = "BIGINTEGER" if input_layer_has_oid64 else "LONG"
        output_fld.aliasName = id_field_name
        oid_fm.outputField = output_fld
        input_features_copy_fms.addFieldMap(oid_fm)
        # Check for well known fields and if present map the well known field as the Name field
        name_field = NAUtils.check_well_known_fields_object(input_layer)
        if name_field:
            LOGGER.debug(f"Mapping {name_field.name} field from {input_layer.layer_name} as Name field")
            wnf_fm_index = input_features_copy_fms.findFieldMapIndex(name_field.name)
            if wnf_fm_index != -1:
                wnf_fm: arcpy.FieldMap = input_features_copy_fms.getFieldMap(wnf_fm_index)  # type: ignore
                output_fld = wnf_fm.outputField
                output_fld.name = "Name"
                output_fld.type = "TEXT"
                output_fld.aliasName = name_field.aliasName
                wnf_fm.outputField = output_fld
                input_features_copy_fms.replaceFieldMap(wnf_fm_index, wnf_fm)

        # Copy the input data with the updated schema.
        # Project it to WGS84 so our distance calculations later will be consistent and reliable. Generate Near Table
        # will reliably output the distance in meters. From the doc: "The value of this field is in the linear unit of
        # the input feature's coordinate system, or Meters when the Method parameter is set to GEODESIC and the input is
        # in a geographic coordinate system." It is definitely better to just project the data in the first place rather
        # than worry about translating units after the calculation.
        transformation = NAUtils.get_datum_transformation(
            input_layer.spatialReference,  # type: ignore
            NAUtils.SR_WGS84,
            input_layer.extent  # type: ignore
        )
        with arcpy.EnvManager(
            outputCoordinateSystem=NAUtils.SR_WGS84,
            geographicTransformations=transformation
        ):
            arcpy.conversion.FeatureClassToFeatureClass(
                input_layer.layer,
                os.path.dirname(input_features_copy),
                os.path.basename(input_features_copy),
                field_mapping=input_features_copy_fms
            )

        return input_features_copy, id_field_name

    def execute(self):
        """Execute the core logic of FindNearest."""
        # Prepare inputs for use
        self._preprocess_inputs()

        # Calculate the nearest features.
        # This tool has two primary options: find nearest using straight-line distance or find nearest using network
        # time/distance. The choice of this option leads to two completely different code paths.
        if self.measurement_method == "StraightLine":
            with LogExecutionTime("Calculated nearest locations with straight lines."):
                self._find_nearest_with_straight_lines()
        else:
            with LogExecutionTime("Calculated nearest locations with network."):
                self._find_nearest_with_network()

    def _find_nearest_with_straight_lines(self):
        """Find nearest using straight-line distance."""
        # Define a temporary output table to hold the result of Generate Near Table, which we will postprocess
        out_connecting_lines_table = AOLUtils.create_unique_name(
            self.output_connecting_lines_name + "Table", self.output_workspace
        )

        # Run the Generate Near Table tool to calculate closest locations
        # Note: In December of 2020 when refactoring this tool, we considered using the Generate Origin-Destination
        # Links GP tool, which was added in Pro 2.6, instead of running Generate Near Table and post-processing the
        # results to generate polyline connectors between the origins and destinations.  After all, Generate
        # Origin-Destination Links creates those polyline connectors automatically, and as an added bonus, it does not
        # require an Advanced license.  Unfortunately, we found that tool's performance to be significantly worse than
        # Generate Near Table.  It is a python-based tool that uses Geometry methods to generate a line between every
        # origin and destination and then finds the n closest.  Whereas Generate Near Table with our post-processing
        # took about 22 seconds for a large test input, Generate Origin-Destination Links had completed only 1% of
        # processing after 6 minutes.  Consequently, we decided to keep our existing method using Generate Near Table
        # for this web tool.
        # Note: The input analysis and near locations have already been projected to WGS84 so that Generate Near Table
        # will reliably output the distance in meters.
        search_radius = f'{self.search_cutoff} {self.search_cutoff_units.replace(" ", "")}'
        LOGGER.debug(f"Search radius used in GenerateNearTable: {search_radius}")
        LOGGER.debug(f"Max count used in GenerateNearTable: {self.max_count}")
        arcpy.analysis.GenerateNearTable(self.input_analysis_locs, self.input_near_locs, out_connecting_lines_table,
                                         search_radius, True, False, False, self.max_count, "GEODESIC")

        # If the output is empty, no facilities were found within the search radius. Throw an error.
        if AOLUtils.get_feature_count(out_connecting_lines_table) == 0:
            LOGGER.debug("Got an empty table as output from Generate Near Table")
            LOGGER.error(100259, extra={"message_ID": 100259})
            raise arcpy.ExecuteError

        with LogExecutionTime("Post-processed output near locations."):
            self._post_process_output_near_locations(out_connecting_lines_table, "NEAR_FID")

        with LogExecutionTime("Post-processed output connecting lines."):
            self._post_process_output_connecting_lines_straight(out_connecting_lines_table)

        # Clean up
        try:
            arcpy.management.Delete(out_connecting_lines_table)
        except Exception:
            # For some reason Delete failed, but we don't really care.
            LOGGER.debug(f"Failed to delete temporary connecting lines output {out_connecting_lines_table}.")
            pass

    def _find_nearest_with_network(self):
        """Find nearest using network distance."""
        # Get the tool
        tbx = RemoteToolboxUtils.get_remote_toolbox("asyncClosestFacility", self.portal_description)
        LOGGER.debug("Adding remote toolbox {0}".format(tbx))

        # Prepare barriers
        point_barr_lyr = self.point_barrier_layer.layer if self.point_barrier_layer else None
        line_barr_lyr = self.line_barrier_layer.layer if self.line_barrier_layer else None
        poly_barr_lyr = self.polygon_barrier_layer.layer if self.polygon_barrier_layer else None

        # Check if we are saving route data
        if self.include_route_layers:
            populate_directions = True
            LOGGER.debug("Directions language: {0}".format(self.directions_language))
        else:
            populate_directions = False

        # If travel mode is time based, search_cutoff_units is always Minutes
        search_cutoff_units = self.search_cutoff_units
        if self.is_travel_mode_time_based:
            search_cutoff_units = "Minutes"
        task_params = [
            self.input_analysis_locs,
            self.input_near_locs,
            search_cutoff_units,
            "",
            self.max_count,
            self.search_cutoff,
            "", "",
            self.time_of_day,
            "", "",
            point_barr_lyr,
            line_barr_lyr,
            poly_barr_lyr,
            "", "", "", "",
            populate_directions,
            self.directions_language,
            "", "",
            NAUtils.TIME_ZONE_KEYWORDS[self.time_zone_for_time_of_day],
            self.measurement_method,
            "", "", "",
            self.include_route_layers
        ]
        ignore_error_codes = (30119, 30120)
        service_result = NAUtils.call_async_gp_service(
            tbx, "FindClosestFacilities", task_params, ignore_error_codes)
        self.remote_job_id = service_result.resultID

        solve_succeeded = False
        if service_result.getOutput(2).lower() == 'true':
            solve_succeeded = True

        if self.include_route_layers:
            if solve_succeeded:
                self.route_data = service_result.getOutput(5)
            else:
                # Raise a warning since no route data is generated when there is no solution
                LOGGER.warning(100217, extra={"message_ID": 100217})
        self.task_cost = NAUtils.get_remote_task_cost(service_result, 12)

        # Save a temporary copy of the near table so we can use it for joins
        temp_output_lines = AOLUtils.create_unique_name(self.output_connecting_lines_name + "_temp",
                                                        self.output_workspace)
        NAUtils.copy_service_output_to_fc(service_result.getOutput(0), temp_output_lines, None, NAUtils.SR_WGS84)

        with LogExecutionTime("Post-processed output near locations."):
            self._post_process_output_near_locations(temp_output_lines, "FacilityOID")

        with LogExecutionTime("Post-processed output connecting lines."):
            self._post_process_output_connecting_lines_network(temp_output_lines)

        # Clean up
        try:
            arcpy.management.Delete(temp_output_lines)
        except Exception:
            # For some reason Delete failed, but we don't really care.
            LOGGER.debug(f"Failed to delete temporary connecting lines output {temp_output_lines}.")
            pass

    def _post_process_output_near_locations(self, out_connecting_lines_table: str, output_join_field: str):
        """Create the output near locations with the correct schema based on the near table."""
        # Select only input near features that ended up in the final solution. Do this by joining the output near table
        # back to the input near features and selecting the ones that hae a value for the join field.
        input_features_layer = "InputFeaturesLayer"
        arcpy.management.MakeFeatureLayer(self.input_near_locs, input_features_layer, workspace=self.output_workspace)
        join_table_name = os.path.basename(out_connecting_lines_table)
        if not self.input_near_locs:
            LOGGER.debug("Near locations can't be empty for processing output near locations.")
            raise RuntimeError
        input_features_oid = AOLUtils.describe(self.input_near_locs).oidFieldName
        # Join the input fields from the near table to the input near features
        arcpy.management.AddJoin(
            input_features_layer, input_features_oid,
            out_connecting_lines_table, output_join_field
        )
        where_clause = f"{join_table_name}.{output_join_field} IS NOT NULL"
        arcpy.management.SelectLayerByAttribute(input_features_layer, "NEW_SELECTION", where_clause)
        # Clean up the join
        arcpy.management.RemoveJoin(input_features_layer, join_table_name)
        # Copy the selected near features to the final output
        NAUtils.copy_service_output_to_fc(
            input_features_layer, self.output_near_locations.data, None,
            self.output_coordinate_system)
        # Clear the selection
        arcpy.management.SelectLayerByAttribute(input_features_layer, "CLEAR_SELECTION")

    def _post_process_output_connecting_lines_network(self, temp_connecting_lines: str):
        """Post-process the connecting lines output to ensure correct schema."""
        long_facility_id_field_name = "FacilityOID"
        long_incident_id_field_name = "IncidentOID"
        if not self.input_analysis_locs or not self.input_near_locs:
            LOGGER.debug("Analysis and near locations can't be empty for connecting line network.")
            raise RuntimeError
        oid_analysis = AOLUtils.describe(self.input_analysis_locs).oidFieldName
        oid_near = AOLUtils.describe(self.input_near_locs).oidFieldName

        # Join the input analysis layer and near layer to output connecting lines in order to transfer fields
        temp_lines_name = os.path.basename(temp_connecting_lines)
        arcpy.management.MakeFeatureLayer(temp_connecting_lines, temp_lines_name)
        arcpy.management.AddJoin(
            temp_lines_name, long_incident_id_field_name,
            self.input_analysis_locs, oid_analysis
        )
        if self.analysis_layer.data != self.near_layer.data:
            arcpy.management.AddJoin(
                temp_lines_name, f"{temp_lines_name}.{long_facility_id_field_name}",
                self.input_near_locs, oid_near
            )

        # Create field mappings to create output with correct schema
        near_locations_name = os.path.basename(self.input_near_locs)
        analysis_layer_name = os.path.basename(self.input_analysis_locs)
        near_qualifier = near_locations_name + "."
        analysis_qualifier = analysis_layer_name + "."
        fields_to_delete = [
            "FacilityID", "IncidentID", "FacilityCurbApproach", "IncidentCurbApproach", "Shape_Length",
            "OutputFacilityOID", "OutputIncidentOID"]
        fields_to_rename = {
            long_incident_id_field_name: ("From_ID", f"{self.analysis_layer.layer_name}: ID"),
            long_facility_id_field_name: ("To_ID", f"{self.near_layer.layer_name}: ID"),
            "FacilityRank": ("NearRank", "Near Rank"),
            "Name": ("RouteName", "Route Name")
        }
        if self.is_travel_mode_time_based:
            fields_to_rename["Total_Minutes"] = ("Total_Minutes", "Minimum Travel Time (Minutes)")
            org_units = AnalysisUtils.get_units(self.portal_description, False)
            if org_units.lower() == "miles":
                fields_to_delete.append("Total_Kilometers")
                fields_to_rename["Total_Miles"] = ("Total_Miles", "Travel Distance (Miles)")
            else:
                fields_to_delete.append("Total_Miles")
                fields_to_rename["Total_Kilometers"] = ("Total_Kilometers", "Travel Distance (Kilometers)")
        else:
            fields_to_rename["Total_Minutes"] = ("Total_Minutes", "Travel Time (Minutes)")
            if self.search_cutoff_units == "Miles":
                fields_to_rename["Total_Miles"] = ("Total_Miles", "Minimum Travel Distance (Miles)")
                fields_to_delete.append("Total_Kilometers")
            else:
                fields_to_rename["Total_Kilometers"] = ("Total_Kilometers", "Minimum Travel Distance (Kilometers)")
                fields_to_delete.append("Total_Miles")
        field_mappings = NAUtils.make_field_maps(temp_lines_name, fields_to_delete, fields_to_rename)

        # Update the OID fields to 64bit if needed
        if self.analysis_layer_has_oid64:
            incidentoid_idx = field_mappings.findFieldMapIndex("From_ID")
            if incidentoid_idx != -1:  # Only try if it was there in the first place
                field_mappings.removeFieldMap(incidentoid_idx)
                field_map = NAUtils.make_new_field_map_with_output_field(
                    "From_ID", f"{self.analysis_layer.layer_name}: ID", "BigInteger")
                field_map.addInputField(temp_connecting_lines, long_incident_id_field_name)
                field_mappings.addFieldMap(field_map)
        if self.near_layer_has_oid64:
            facilityoid_idx = field_mappings.findFieldMapIndex("To_ID")
            if facilityoid_idx != -1:  # Only try if it was there in the first place
                field_mappings.removeFieldMap(facilityoid_idx)
                field_map = NAUtils.make_new_field_map_with_output_field(
                    "To_ID", f"{self.near_layer.layer_name}: ID", "BigInteger")
                field_map.addInputField(temp_connecting_lines, long_facility_id_field_name)
                field_mappings.addFieldMap(field_map)

        # Rename the fields joined from analysis and near layers
        for out_fld_index, fm in enumerate(field_mappings):
            out_fld = fm.outputField
            qual_fld_name = fm.getInputFieldName(0)
            fld_name = out_fld.name
            fld_alias = out_fld.aliasName
            # All fields from near layer are renamed as To_<orig name>
            if qual_fld_name.startswith(near_qualifier):
                new_fld_name = "To_" + fld_name
                if new_fld_name == "To_ID":
                    new_fld_name = new_fld_name + "_Orig"
                new_fld_alias = f'{self.near_layer.layer_name}: {fld_alias.replace(near_locations_name + "_", "")}'
                out_fld.name = new_fld_name
                out_fld.aliasName = new_fld_alias
                fm.outputField = out_fld
                field_mappings.replaceFieldMap(out_fld_index, fm)
            # All fields from analysis layer are renamed as From_<orig name>
            elif qual_fld_name.startswith(analysis_qualifier):
                new_fld_name = "From_" + fld_name
                if new_fld_name == "From_ID":
                    new_fld_name = new_fld_name + "_Orig"
                fld_alias.replace(analysis_layer_name, "")
                # If table name is in the alias, remove it
                new_fld_alias = f'{self.analysis_layer.layer_name}: {fld_alias.replace(analysis_layer_name + "_", "")}'
                out_fld.name = new_fld_name
                out_fld.aliasName = new_fld_alias
                fm.outputField = out_fld
                field_mappings.replaceFieldMap(out_fld_index, fm)

        # Add RouteLayerItemID and RouteLayerItemURL fields
        field_mappings.addFieldMap(NAUtils.make_new_field_map_with_output_field(
            self.route_layer_item_id_field_name, "Route Layer Item ID", "String", 50))
        field_mappings.addFieldMap(NAUtils.make_new_field_map_with_output_field(
            self.route_layer_item_url_field_name, "Route Layer Item", "String", 256))

        # Copy the output to its final location using the field mappings
        NAUtils.copy_service_output_to_fc(
            temp_lines_name, self.output_connecting_lines.data, field_mappings, self.output_coordinate_system)

        # Update and delete fields on connecting lines output
        from_orig_fid_field_name = "From_{}".format(self.analysis_layer_id_field)
        to_orig_fid_field_name = "To_{}".format(self.near_layer_id_field)
        update_cursor_fields = ["From_ID", from_orig_fid_field_name, "To_ID", to_orig_fid_field_name]
        out_conn_lines_delete_fields = [
            from_orig_fid_field_name,
            to_orig_fid_field_name,
            f"From_{oid_analysis}",
            f"To_{oid_near}"
        ]

        non_standard_cutoff_units = False
        # Check if we need to add an additional field for distance based on the cutoff units
        if not self.is_travel_mode_time_based:
            if self.search_cutoff_units not in ("Kilometers", "Miles"):
                non_standard_cutoff_units = True
                new_fld_name = f'Total_{self.search_cutoff_units.replace(" ", "")}'
                new_fld_alias = f"Minimum Travel Distance ({self.search_cutoff_units})"
                arcpy.management.AddField(
                    self.output_connecting_lines.data,
                    new_fld_name,
                    "DOUBLE",
                    field_alias=new_fld_alias
                )
                distance_km_field_name = "Total_Kilometers"
                update_cursor_fields += [new_fld_name, distance_km_field_name]
                # Delete the distance field in kilometers
                out_conn_lines_delete_fields.append(distance_km_field_name)

        # Recalculate From_ID and To_ID fields based on ORIG_FID fields and convert units
        with UpdateCursor(self.output_connecting_lines.data, update_cursor_fields) as conn_lines_cursor:
            for row in conn_lines_cursor:
                row[0] = row[1]
                row[2] = row[3]
                if non_standard_cutoff_units:
                    row[-2] = NAUtils.convert_units(row[-1], "kilometers", self.search_cutoff_units)
                conn_lines_cursor.updateRow(row)
        # Delete fields we no longer need after conversion
        arcpy.management.DeleteField(self.output_connecting_lines.data, out_conn_lines_delete_fields)

    def _post_process_output_connecting_lines_straight(self, temp_connecting_lines: str):
        """Post-process the output near table to generate the connecting lines output and ensure correct schema."""
        # Create the new output connecting lines feature class using a WGS84 spatial reference.
        # We purposefully projected the input data into WGS84 so that Generate Near Table will reliably output the
        # distance in meters and the lat/lon coordinates in the FROM_X, FROM_Y, NEAR_X, NEAR_Y will be in WGS84. From
        # the doc: "The value of this field is in the linear unit of the input feature's coordinate system, or Meters
        # when the Method parameter is set to GEODESIC and the input is in a geographic coordinate system." The
        # preprocessing we did of the inputs means we do not need to do any conversions here.
        arcpy.management.CreateFeatureclass(
            os.path.dirname(self.output_connecting_lines.data),
            os.path.basename(self.output_connecting_lines.data),
            "POLYLINE",
            spatial_reference=self.output_coordinate_system
        )

        # Define the schema for the final output connecting lines
        # First join the fields from the input analysis and near layers.
        temp_connecting_lines_name = os.path.basename(temp_connecting_lines)
        temp_connecting_lines_view = os.path.basename(temp_connecting_lines) + "TableView"
        arcpy.management.MakeTableView(
            temp_connecting_lines, temp_connecting_lines_view, workspace=self.output_workspace
        )
        if not self.input_analysis_locs or not self.input_near_locs:
            LOGGER.debug("Analysis and near locations can't be empty in connecting straight lines.")
            raise RuntimeError
        # Join analysis layer based on IN_FID and OBJECTID fields
        oid_analysis = AOLUtils.describe(self.input_analysis_locs).oidFieldName
        arcpy.management.AddJoin(
            temp_connecting_lines_view, "IN_FID",
            self.input_analysis_locs, oid_analysis
        )
        # Join near layer based on NEAR_FID and OBJECTID fields
        oid_near = AOLUtils.describe(self.input_near_locs).oidFieldName
        if self.analysis_layer.data != self.near_layer.data:
            arcpy.management.AddJoin(
                temp_connecting_lines_view, f"{temp_connecting_lines_name}.NEAR_FID",
                self.input_near_locs, oid_near
            )
        temp_connecting_lines_desc = AOLUtils.describe(temp_connecting_lines_view)

        # Define a bunch of confusing field manipulations and transformations
        straight_line_descriptor = "Total_"
        straight_line_descriptor_title_case = "Straight Line Distance ({0})"
        straight_line_dist_field_names = {  # field name: field alias
            straight_line_descriptor + "Kilometers": straight_line_descriptor_title_case.format("Kilometers"),
            straight_line_descriptor + "Miles": straight_line_descriptor_title_case.format("Miles")
        }
        search_cutoff_unit_field_name = f'{straight_line_descriptor}{self.search_cutoff_units.replace(" ", "")}'
        if search_cutoff_unit_field_name not in straight_line_dist_field_names:
            straight_line_dist_field_names[search_cutoff_unit_field_name] = \
                straight_line_descriptor_title_case.format(self.search_cutoff_units)
        out_connecting_lines_layer_system_field_names = [
            "From_ID", "To_ID", "NearRank"
        ] + list(straight_line_dist_field_names.keys())
        out_connecting_lines_layer_system_field_names_lower = [
            name.lower() for name in out_connecting_lines_layer_system_field_names
        ]
        rename_field_names = {
            f"{temp_connecting_lines_name}.IN_FID": out_connecting_lines_layer_system_field_names[0],
            f"{temp_connecting_lines_name}.NEAR_FID": out_connecting_lines_layer_system_field_names[1],
            f"{temp_connecting_lines_name}.NEAR_RANK": out_connecting_lines_layer_system_field_names[2],
            f"{temp_connecting_lines_name}.NEAR_DIST": straight_line_descriptor + "Meters"
        }
        near_locations_name = os.path.basename(self.input_near_locs)
        analysis_layer_name = os.path.basename(self.input_analysis_locs)
        remove_field_names = (
            f"{temp_connecting_lines_desc.oidFieldName}",
            f"{analysis_layer_name}.{oid_analysis}",
            f"{near_locations_name}.{oid_near}",
            f"{analysis_layer_name}.Shape_Length",
            f"{near_locations_name}.Shape_Length",
            f"{analysis_layer_name}.Shape_Area",
            f"{near_locations_name}.Shape_Area",
            f"{temp_connecting_lines_name}.FROM_X",
            f"{temp_connecting_lines_name}.FROM_Y",
            f"{temp_connecting_lines_name}.NEAR_X",
            f"{temp_connecting_lines_name}.NEAR_Y",
        )

        # Construct field definitions for AddFields, keeping some fields, renaming others, etc., based on the confusion
        # defined above.
        # [[Field Name, Field Type, {Field Alias}, {Field Length}, {Default Value} {Field Domain}],...]
        field_definitions = []
        original_field_names = []
        fld_types = {  # field object .type property does not always match required type parameter for AddFields
            "Integer": "LONG",
            "Single": "FLOAT",
            "SmallInteger": "SHORT",
            "String": "TEXT",
            "BigInteger": "BIGINTEGER"
        }
        analysis_layer_name_clean: str = arcpy.ValidateTableName(self.analysis_layer.layer_name, self.output_workspace)  # type: ignore
        near_layer_name_clean: str = arcpy.ValidateTableName(self.near_layer.layer_name, self.output_workspace)  # type: ignore
        # Loop over all the fields in the Near Table with the joins from both inputs, and use this to construct the
        # fields we want to keep for the final output
        for fld in temp_connecting_lines_desc.fields:
            # Adjust field names
            fld_name = fld.name
            if fld_name in remove_field_names:
                # We are not interested in this field, so move on.
                continue
            if fld_name in rename_field_names:
                # Rename field according to specific rules defined above
                new_field_name = rename_field_names[fld_name]
            else:
                # Replace qualified field names with From_ and To_
                new_field_name = fld_name.replace(
                    analysis_layer_name, "From"
                ).replace(
                    near_locations_name, "To"
                )
                new_field_name = new_field_name.replace(".", "_")
                # Update fields created from Generate Near Table
                if new_field_name.lower() in out_connecting_lines_layer_system_field_names_lower:
                    new_field_name = new_field_name + "_Orig"
            # Adjust field aliases
            if new_field_name.startswith("From_"):
                fld_alias = new_field_name.replace("From_", analysis_layer_name_clean + ": ")
            elif new_field_name.startswith("To_"):
                fld_alias = new_field_name.replace("To_", near_layer_name_clean + ": ")
            elif new_field_name.startswith(straight_line_descriptor):
                fld_alias = straight_line_descriptor_title_case.format(new_field_name.split("_")[-1])
            elif new_field_name == "NearRank":
                fld_alias = "Near Rank"
            else:
                fld_alias = new_field_name
            # Get the correct type
            fld_type = fld_types.get(fld.type, fld.type.upper())
            if new_field_name == "From_ID" and self.analysis_layer_has_oid64:
                fld_type = "BIGINTEGER"
            if new_field_name == "To_ID" and self.near_layer_has_oid64:
                fld_type = "BIGINTEGER"
            # Make sure the field name is valid
            new_field_name = arcpy.ValidateFieldName(new_field_name, self.output_workspace)
            # Finally, create the field definition
            field_definitions.append([new_field_name, fld_type, fld_alias, fld.length, fld.defaultValue])
            # Preserve the original field name for use in field mapping
            original_field_names.append(fld_name)

        # Add the fields to the output connecting lines table
        arcpy.management.AddFields(self.output_connecting_lines.data, field_definitions)

        # Insert features into the output connecting lines
        insert_cursor_fields = [f[0] for f in field_definitions] + ["SHAPE@"]
        coords_field_names = [
            f"{temp_connecting_lines_name}.{f}" for f in ("FROM_X", "FROM_Y", "NEAR_X", "NEAR_Y")
        ]
        search_cursor_fields = original_field_names + coords_field_names
        # Get the index for orig_fid fields so that they can be used to recalculate from_id and to_id fields
        from_orig_fid_field = "From_{}".format(self.analysis_layer_id_field)
        to_orig_fid_field = "To_{}".format(self.near_layer_id_field)
        index_from_orig_fid_field = -1
        index_to_orig_fid_field = -1
        if from_orig_fid_field in insert_cursor_fields:
            index_from_orig_fid_field = insert_cursor_fields.index(from_orig_fid_field)
        if to_orig_fid_field in insert_cursor_fields:
            index_to_orig_fid_field = insert_cursor_fields.index(to_orig_fid_field)
        recalc_id_fields = False if index_from_orig_fid_field == -1 or index_to_orig_fid_field == -1 else True

        # Generate the geometry
        zero_length_line = [arcpy.Point(0, 0), arcpy.Point(0, 0)]
        transformation = NAUtils.get_datum_transformation(
            NAUtils.SR_WGS84, self.output_coordinate_system,
            self.near_layer.extent  # type: ignore
        )
        with InsertCursor(
            self.output_connecting_lines.data,
            insert_cursor_fields,
            datum_transformation=transformation
        ) as out_lines_cursor:
            with SearchCursor(temp_connecting_lines_view, search_cursor_fields) as conn_lines_table_cursor:
                for row in conn_lines_table_cursor:
                    # Get all fields except the last four, which contain coordinates
                    output_row = list(row[0:-4])
                    # The NEAR_DIST field is reliably in units of meters because we projected the input data to WGS84.
                    near_dist = output_row[2]
                    # Construct the line geometry
                    if near_dist > 0:
                        # Construct an array of points using the coordinates from the near table and use that to
                        # construct a polyline object
                        array = arcpy.Array([arcpy.Point(row[-4], row[-3]), arcpy.Point(row[-2], row[-1])])
                        simple_line_shape = arcpy.Polyline(array, NAUtils.SR_WGS84)
                        # Densify longer lines so that they look like curved geodesic lines
                        # Use 1% of the total line length as the densification tolerance
                        if near_dist > 1609000:  # 1,000 miles.
                            line_shape = simple_line_shape.densify("GEODESIC", near_dist * 0.01, 1)
                        else:
                            line_shape = simple_line_shape
                    else:
                        # Create a zero-length line if distance is zero
                        line_shape = arcpy.Polyline(arcpy.Array(zero_length_line), NAUtils.SR_WGS84)
                    output_row.append(line_shape)
                    #Calculate From_ID and To_ID based on ORIG_FID fields
                    if recalc_id_fields:
                        output_row[0] = output_row[index_from_orig_fid_field]
                        output_row[1] = output_row[index_to_orig_fid_field]

                    out_lines_cursor.insertRow(output_row)

        # Add and calculate additional fields showing the straight line distance in different units
        out_connecting_lines_layer_field_names = [f.name for f in AOLUtils.list_fields(self.output_connecting_lines.data)]
        meters_conversion = {
            "Miles": 0.00062,
            "Kilometers": 0.001,
            "Yards": 1.09361,
            "Feet": 3.28084,
            "NauticalMiles": 0.00054
        }
        for dist_field in straight_line_dist_field_names:
            if dist_field not in out_connecting_lines_layer_field_names:
                dist_field_units = dist_field.split("_")[-1]
                if dist_field_units == self.search_cutoff_units:
                    arcpy.management.AddField(
                        self.output_connecting_lines.data,
                        dist_field,
                        "DOUBLE",
                        field_alias=straight_line_dist_field_names[dist_field])
                    conversion_factor = meters_conversion.get(dist_field_units, 1)
                    arcpy.management.CalculateField(
                        self.output_connecting_lines.data,
                        dist_field,
                        f"!{straight_line_descriptor}Meters! * {conversion_factor}"
                    )

        # Delete no-longer-needed fields
        fields_to_delete = []
        # Delete the meter field, if search cutoff units is not meters
        if self.search_cutoff_units.upper() != "METERS":
            fields_to_delete.append(straight_line_descriptor + "Meters")
        # Drop the ORIG_FID fields transferred from the projected inputs
        if recalc_id_fields:
            fields_to_delete += [from_orig_fid_field, to_orig_fid_field]
        if fields_to_delete:
            arcpy.management.DeleteField(self.output_connecting_lines.data, fields_to_delete)
