"""ChooseBestFacilities core logic executor."""
# pylint: disable=import-error,no-name-in-module
import os
from typing import Any, Optional

import arcpy
import arcpy.management
import arcpy.conversion
from arcpy.da import InsertCursor, SearchCursor, UpdateCursor  # type: ignore

from common import (PAExecutor, PAFeatureLayer,
                    LogExecutionTime, LogUtils, RemoteToolboxUtils,
                    ImmutableDict, AnalysisUtils,
                    CALFIELD_PY_METHOD, AOLUtils, FieldUtils, PortalUtils)
from .nautils import NAUtils


LOGGER = LogUtils.setup_logger(__name__)


class CBFExecutor(PAExecutor):
    """Core logic of ChooseBestFacilities tool."""

    def __init__(
        self,
        goal: str,
        demand_locations_layer: PAFeatureLayer,
        demand: int = 1,
        demand_field: Optional[str] = None,
        max_travel_range: float = NAUtils.INFINITY,
        max_travel_range_field: Optional[str] = None,
        max_travel_range_units: str = "Minutes",
        travel_mode: str = "",
        time_of_day: Any = None,
        time_zone_for_time_of_day: str = "GeoLocal",
        travel_direction: str = "FacilityToDemand",
        required_facilities_layer: Optional[PAFeatureLayer] = None,
        required_facilities_capacity: float = NAUtils.INFINITY,
        required_facilities_capacity_field: Optional[str] = None,
        candidate_facilities_layer: Optional[PAFeatureLayer] = None,
        candidate_count: int = 1,
        candidate_facilities_capacity: float = NAUtils.INFINITY,
        candidate_facilities_capacity_field: Optional[str] = None,
        percent_demand_coverage: float = 100,
        allocated_demand_locations_name: str = "AllocatedDemandLocations",
        allocation_lines_name: str = "AllocationLines",
        assigned_facilities_name: str = "AssignedFacilities",
        preferred_distance_units: str = "Kilometers",
        point_barrier_layer: Optional[PAFeatureLayer] = None,
        line_barrier_layer: Optional[PAFeatureLayer] = None,
        polygon_barrier_layer: Optional[PAFeatureLayer] = None,
        output_workspace: Any = "in_memory",
        portal_description: Optional[ImmutableDict] = None
    ):
        """Initialize the attributes.

        Args:
            goal: Location-allocation problem type
            demand_locations_layer: Input demand points
            demand: Default value for demand at each demand point
            demand_field: Field in demand_locations_layer designating the demand at each point.
            max_travel_range: Default impedance cutoff to use in the analysis.
            max_travel_range_field: Field in demand_locations_layer designating a per-demand point impedance cutoff.
            max_travel_range_units: Units of the impedance cutoff.
            travel_mode: Travel mode designated as a stringified json
            time_of_day: Analysis time of day.
            time_zone_for_time_of_day: Whether the time_of_day value is geolocal or UTC.
            travel_direction: Toward or away from facilities.
            required_facilities_layer: Input layer of facilities required to be in the output solution.
            required_facilities_capacity: Default capacity value for all required facilities.
            required_facilities_capacity_field: Field in required_facilities_layer designating the capacity of each
                facility.
            candidate_facilities_layer: Input layer of candidate facilities that may be chosen in the solution.
            candidate_count: Number of facilities to allocate and include in the final solution.
            candidate_facilities_capacity: Default capacity for all candidate facilities.
            candidate_facilities_capacity_field: Field in candidate_facilities_layer designating the capacity of each
                facility.
            percent_demand_coverage: Desired percent coverage for certain location-allocation problem types.
            allocated_demand_locations_name: Name for the output allocated demand locations layer.
            allocation_lines_name: Name for the output allocation lines layer.
            assigned_facilities_name: Name for the output assigned facilities layer.
            preferred_distance_units: Distance units to use in the output fields.
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
        self.goal = goal
        self.demand_locations_layer = demand_locations_layer
        self.demand = demand
        self.demand_field = demand_field
        self.max_travel_range = max_travel_range
        self.max_travel_range_field = max_travel_range_field
        self.max_travel_range_units = max_travel_range_units
        self.travel_mode = travel_mode
        self.time_of_day = time_of_day
        self.time_zone_for_time_of_day = time_zone_for_time_of_day
        self.travel_direction = travel_direction
        self.required_facilities_layer = required_facilities_layer
        self.required_facilities_capacity = required_facilities_capacity
        self.required_facilities_capacity_field = required_facilities_capacity_field
        self.candidate_facilities_layer = candidate_facilities_layer
        self.candidate_count = candidate_count
        self.candidate_facilities_capacity = candidate_facilities_capacity
        self.candidate_facilities_capacity_field = candidate_facilities_capacity_field
        self.percent_demand_coverage = percent_demand_coverage
        self.allocated_demand_locations_name = allocated_demand_locations_name
        self.allocation_lines_name = allocation_lines_name
        self.assigned_facilities_name = assigned_facilities_name
        self.preferred_distance_units = preferred_distance_units.upper()
        self.point_barrier_layer = point_barrier_layer
        self.line_barrier_layer = line_barrier_layer
        self.polygon_barrier_layer = polygon_barrier_layer
        self.output_workspace = output_workspace

        if portal_description is None:
            self.portal_description = ImmutableDict(arcpy.GetPortalDescription())
        else:
            self.portal_description = portal_description

        # Set up outputs
        self.allocated_demand_locations_output = AnalysisUtils.initialize_output_layer(None,
                                                                                       self.allocated_demand_locations_name,
                                                                                       self.output_workspace,
                                                                                       mk_uniq_name=True)
        self.allocation_lines_output = AnalysisUtils.initialize_output_layer(None,
                                                                             self.allocation_lines_name,
                                                                             self.output_workspace,
                                                                             mk_uniq_name=True)
        self.assigned_facilities_output = AnalysisUtils.initialize_output_layer(None,
                                                                                self.assigned_facilities_name,
                                                                                self.output_workspace,
                                                                                mk_uniq_name=True)
        LOGGER.debug("Output allocated demand locations: {}".format(self.allocated_demand_locations_output.data))
        LOGGER.debug("Output allocation lines: {}".format(self.allocation_lines_output.data))
        LOGGER.debug("Output assigned facilities: {}".format(self.assigned_facilities_output.data))

        # Get the tool limits from routing utilities service if available in the portal.
        # Default is the limits imposed by online services
        self.max_facilities_count = 1000
        self.max_demand_locations_count = 10000
        self.max_facilities_to_find = 100
        self.tool_limits = {}
        self._get_service_limits()

        self.demand_layer_has_oid64 = arcpy.Describe(self.demand_locations_layer.layer).hasOID64
        self.facilities_layer_has_oid64 = False
        self.candidate_facilities_layer_has_oid64 = False
        self.required_facility_layer_has_oid64 = False
        if self.candidate_facilities_layer and arcpy.Describe(self.candidate_facilities_layer.layer).hasOID64:
            self.candidate_facilities_layer_has_oid64 = True
            self.facilities_layer_has_oid64 = True
        if self.required_facilities_layer and arcpy.Describe(self.required_facilities_layer.layer).hasOID64:
            self.required_facility_layer_has_oid64 = True
            self.facilities_layer_has_oid64 = True

        # This will be updated in validate_parameters()
        self.is_travel_mode_time_based = False

        # All outputs are created in the spatial reference of the demand locations layer.
        # Note: If this logic ever changes, also update cbftool.py in get_parameters() where it calls
        # self.check_overwrite_sr().
        if arcpy.env.outputCoordinateSystem:
            self.output_coordinate_system: arcpy.SpatialReference = arcpy.env.outputCoordinateSystem  # type: ignore
            LOGGER.debug("arcpy.env.outputCoordinateSystem is specified and will be used for outputs.")
        else:
            self.output_coordinate_system: arcpy.SpatialReference = self.demand_locations_layer.spatialReference  # type: ignore
            LOGGER.debug("The spatial reference of the Input Demand Layer will be used for outputs.")

        # Other shared parameters
        self.remote_job_id = ""
        self.temp_input_start_name = "temp"
        # Actual inputs passed to the service. They will be populated during input preprocessing.
        self.problem_type = None
        self.facilities_to_find = None
        self.input_demand_points = None
        self.input_facilities = None
        # placeholder of the cost of calling logistics service
        self.task_cost = -1

    def _get_service_limits(self):
        """Get the tool limits imposed by the service."""
        routing_utils_tbx = RemoteToolboxUtils.get_helper_service_url("routingUtilities", self.portal_description)
        LOGGER.debug(f"Getting tool limits from {routing_utils_tbx}")
        self.tool_limits = NAUtils.get_tool_limits(
            routing_utils_tbx, "asyncLocationAllocation", "SolveLocationAllocation")
        if "maximumFacilities" in self.tool_limits:
            max_facilities = self.tool_limits["maximumFacilities"]
            if max_facilities is None:
                self.max_facilities_count = NAUtils.INFINITY
            else:
                self.max_facilities_count = max_facilities
        if "maximumFacilitiesToFind" in self.tool_limits:
            max_facilities_to_find = self.tool_limits["maximumFacilitiesToFind"]
            if max_facilities_to_find is None:
                self.max_facilities_to_find = NAUtils.INFINITY
            else:
                self.max_facilities_to_find = max_facilities_to_find
        if "maximumDemandPoints" in self.tool_limits:
            max_demand_locations = self.tool_limits["maximumDemandPoints"]
            if max_demand_locations is None:
                self.max_demand_locations_count = NAUtils.INFINITY
            else:
                self.max_demand_locations_count = max_demand_locations
        LOGGER.debug("Max facilities count: {0}".format(self.max_facilities_count))
        LOGGER.debug("Max facilities to find: {0}".format(self.max_facilities_to_find))
        LOGGER.debug("Max demand locations count: {0}".format(self.max_demand_locations_count))

    def validate_parameters(self) -> bool:
        """Validate the parameters of the executor."""
        # Fail if we don't have at least one feature in the demand point layer
        if self.demand_locations_layer.count < 1:
            LOGGER.error(100024, extra={"message_ID": 100024, "inputLayer": self.demand_locations_layer.layer_name})
            return False

        # Check that we don't have more than the number of demand locations supported by the remote service
        if self.demand_locations_layer.count > self.max_demand_locations_count:
            LOGGER.error(100069, extra={
                "message_ID": 100069,
                "startLayer": self.demand_locations_layer.layer_name,
                "max": self.max_demand_locations_count})
            return False

        # Check that demand is greater than zero
        if self.demand <= 0:
            LOGGER.error(100153, extra={"message_ID": 100153, "paramName": "demand"})
            return False

        # Check that if the demand_field field is specified, it exists on the demand_locations_layer
        if self.demand_field:
            if not NAUtils.check_field_exists(self.demand_field, self.demand_locations_layer):
                return False

        # Check if max_travel_range is greater than zero
        if self.max_travel_range <= 0:
            LOGGER.error(100153, extra={"message_ID": 100153, "paramName": "maxTravelRange"})
            return False

        # Check if the max_travel_range field is specified, it exists on the demand_locations_layer
        if self.max_travel_range_field:
            if not NAUtils.check_field_exists(self.max_travel_range_field, self.demand_locations_layer):
                return False

        # Perform checks that are applicable when required_facilities_layer is specified.
        if self.required_facilities_layer and self.required_facilities_layer.count:
            # Check that we don't have more features in the required_facilities_layer than the number of facilities to
            # find supported by the remote service
            if self.required_facilities_layer.count > self.max_facilities_to_find:
                LOGGER.error(100069, extra={
                    "message_ID": 100069,
                    "startLayer": self.required_facilities_layer.layer_name,
                    "max": self.max_facilities_to_find})
                return False

            # Check that required_facilities_capacity is greater than zero
            if self.required_facilities_capacity <= 0:
                LOGGER.error(100153, extra={"message_ID": 100153, "paramName": "requiredFacilitiesCapacity"})
                return False

            # Check if the required_facilities_capacity field is specified, it exists on the required_facilities_layer
            if self.required_facilities_capacity_field:
                if not NAUtils.check_field_exists(
                        self.required_facilities_capacity_field, self.required_facilities_layer):
                    return False

        # Perform checks that are applicable when goal type is allocate.
        if self.goal == "Allocate":
            # Check that required_facilities_layer is specified
            if not self.required_facilities_layer or not self.required_facilities_layer.count:
                LOGGER.error(100137, extra={"message_ID": 100137, "parameterName": "requiredFacilitiesLayer"})
                return False

            # Check that candidate_facilities_layer is not specified.
            if self.candidate_facilities_layer and self.candidate_facilities_layer.count:
                LOGGER.error(100155, extra={
                    "message_ID": 100155,
                    "candidateFacilitiesLayer": self.candidate_facilities_layer.layer_name})
                return False

        else:
            # Checks related to candidate_count are not applicable to Allocate and Percent Coverage goals
            if self.goal != "PercentCoverage":
                # Check if candidate_count is greater than zero
                if self.candidate_count <= 0:
                    LOGGER.error(100153, extra={"message_ID": 100153, "paramName": "candidateCount"})
                    return False

                # Check if sum of number of features in required_facilities_layer and candidates to choose is less than
                # max facilities to find supported by the service.
                if (
                    self.required_facilities_layer
                    and (self.candidate_count + self.required_facilities_layer.count) > self.max_facilities_to_find
                ):
                    msg_code = 100158
                    msg_params = {
                        "message_ID": msg_code,
                        "max": self.max_facilities_to_find - self.required_facilities_layer.count
                    }
                    LOGGER.error(msg_code, extra=msg_params)
                    return False

                # Check if candidates to choose is less than the number of facilities to find supported by the remote
                # service
                if self.candidate_count > self.max_facilities_to_find:
                    msg_code = 100158
                    msg_params = {
                        "message_ID": msg_code,
                        "max": self.max_facilities_to_find
                    }
                    LOGGER.error(msg_code, extra=msg_params)
                    return False

        # Perform checks that are applicable when candidate_facilities_layer is specified
        if self.candidate_facilities_layer and self.candidate_facilities_layer.count:
            # Check that we don't have more features in the candidate_facilities_layer than the number of facilities
            # supported by the remote service
            if self.candidate_facilities_layer.count > self.max_facilities_count:
                msg_code = 100069
                msg_params = {
                    "message_ID": msg_code,
                    "startLayer": self.candidate_facilities_layer.layer_name,
                    "max": self.max_facilities_count
                }
                LOGGER.error(msg_code, extra=msg_params)
                return False

            # Check that we don't have more features in the combined facilities layers than the number of facilities
            # supported by the remote service
            if self.required_facilities_layer and self.required_facilities_layer.count:
                if self.candidate_facilities_layer.count + self.required_facilities_layer.count > \
                        self.max_facilities_count:
                    msg_code = 100352
                    msg_params = {
                        "message_ID": msg_code,
                        "max": self.max_facilities_count
                    }
                    LOGGER.error(msg_code, extra=msg_params)
                    return False

            # Check if candidate_facilities_capacity is greater than zero
            if self.candidate_facilities_capacity <= 0:
                LOGGER.error(100153, extra={"message_ID": 100153, "paramName": "candidateFacilitiesCapacity"})
                return False

            # Check if the candidate_facilities_capacity field is specified, it exists on the candidate_facilities_layer
            if self.candidate_facilities_capacity_field:
                if not NAUtils.check_field_exists(
                        self.candidate_facilities_capacity_field, self.candidate_facilities_layer):
                    return False

        # Check if the percent_demand_coverage is greater than zero and less than or equal to 100
        if self.percent_demand_coverage <= 0 or self.percent_demand_coverage > 100:
            LOGGER.error(100156, extra={"message_ID": 100156})
            return False

        # Check if the travel mode is valid. Valid values are JSON that represent a time or distance based travel mode.
        # Determine if the travel mode is time based or distance based and check if travelRangeUnits are same type
        # as the travel mode.
        travel_mode_obj = NAUtils.get_travel_mode_from_json(self.travel_mode)
        if not travel_mode_obj:
            # Travel mode json conversion must have failed. Error was already thrown. Just quit.
            return False
        self.is_travel_mode_time_based = NAUtils.is_travel_mode_time_based(travel_mode_obj)
        msg_params = {
            "message_ID": 100151,
            "travelRangeUnits": self.max_travel_range_units,
            "travelMode": travel_mode_obj.name
        }
        if self.is_travel_mode_time_based:
            if self.max_travel_range != NAUtils.INFINITY or self.max_travel_range_field:
                if self.max_travel_range_units.upper() not in NAUtils.TIME_UNITS:
                    LOGGER.error(100151, extra=msg_params)
                    return False
        else:
            if self.max_travel_range != NAUtils.INFINITY or self.max_travel_range_field:
                if self.max_travel_range_units.upper() in NAUtils.TIME_UNITS:
                    LOGGER.error(100151, extra=msg_params)
                    return False

        return True

    def _preprocess_inputs(self):
        """Use the validated inputs to prepare the inputs in the format required by the remote service.

        Preparing inputs does things like combine the required and candidate facilities as a single
        facilities layer."""
        # Create demand points feature class with appropriate fields as required by the remote service
        self.input_demand_points = AOLUtils.create_unique_name(self.temp_input_start_name, self.output_workspace)
        arcpy.management.CreateFeatureclass(
            self.output_workspace,
            os.path.basename(self.input_demand_points),
            "POINT",
            spatial_reference=self.output_coordinate_system
        )
        # Define some fields to retrieve from the original input demand points
        demand_location_layer_cursor_fields = ["SHAPE@", "OID@"]
        running_in_portal = PortalUtils.is_portal_env()
        if self.demand_field:
            demand_location_layer_cursor_fields.append(FieldUtils.get_fq_field_name(self.demand_field,
                                                                                    self.demand_locations_layer,
                                                                                    running_in_portal))

        # Define the fields for the demand points we will pass to the service
        demand_point_field_defs = [
            ["Name", "TEXT"],
            ["Weight", "DOUBLE"]
        ]
        if self.max_travel_range_field:
            demand_location_layer_cursor_fields.append(FieldUtils.get_fq_field_name(self.max_travel_range_field,
                                                                                    self.demand_locations_layer,
                                                                                    running_in_portal))
            if self.is_travel_mode_time_based:
                demand_point_field_defs.append(["TimeCutoff", "DOUBLE"])
            else:
                demand_point_field_defs.append(["DistanceCutoff", "DOUBLE"])
        # Add fields with the correct schema to the input we'll use with the service
        arcpy.management.AddFields(self.input_demand_points, demand_point_field_defs)
        # Use cursors to transfer data from the original input to the input we'll use with the service
        demand_point_fields = ["SHAPE@"] + [f[0] for f in demand_point_field_defs]
        with InsertCursor(
                self.input_demand_points, demand_point_fields) as demand_points_cursor:
            for row in SearchCursor(
                self.demand_locations_layer.layer,
                demand_location_layer_cursor_fields
            ):
                demand_points_row = [row[0], str(row[1])]
                if self.demand_field:
                    demand_points_row.append(row[2])
                else:
                    demand_points_row.append(self.demand)
                if self.max_travel_range_field:
                    demand_points_row.append(row[-1])
                demand_points_cursor.insertRow(demand_points_row)

        # Create facilities feature class with appropriate fields as required by the remote service
        # Use the spatial reference of the input demand points in case they are different
        self.input_facilities = AOLUtils.create_unique_name(self.temp_input_start_name, self.output_workspace)
        arcpy.management.CreateFeatureclass(
            self.output_workspace,
            os.path.basename(self.input_facilities),
            "POINT",
            spatial_reference=self.output_coordinate_system
        )
        # Need to always populate FacilityType field and optionally populate Capacity field if required or candidate
        # facilities have capacity field. Also include the OID from input facilities as Name field so that they can be
        # used to transfer attributes from input facilities to output facilities
        # Add fields
        facilities_field_defs = [
            ["Name", "TEXT"],
            ["FacilityType", "SHORT"],
            ["Capacity", "DOUBLE"]
        ]
        arcpy.management.AddFields(self.input_facilities, facilities_field_defs)
        facilities_field_names = ["SHAPE@"] + [f[0] for f in facilities_field_defs]

        # Transfer data from required facilities input layer, if applicable
        if self.required_facilities_layer and self.required_facilities_layer.count:
            required_facilities_layer_cursor_fields = ["SHAPE@", "OID@"]
            if self.required_facilities_capacity_field:
                required_facilities_layer_cursor_fields.append(FieldUtils.get_fq_field_name(self.required_facilities_capacity_field,
                                                                                            self.required_facilities_layer,
                                                                                            running_in_portal))

            LOGGER.debug(f"{required_facilities_layer_cursor_fields=}")
            # Determine the correct geographic transformation
            transformation = NAUtils.get_datum_transformation(
                self.required_facilities_layer.spatialReference,  # type: ignore
                self.output_coordinate_system,
                self.required_facilities_layer.extent  # type: ignore
            )
            # Insert data
            with arcpy.EnvManager(
                extent=None,
                outputCoordinateSystem=self.output_coordinate_system,
                geographicTransformations=transformation
            ):
                with InsertCursor(
                        self.input_facilities, facilities_field_names) as cur:
                    for row in SearchCursor(
                        self.required_facilities_layer.layer,
                        required_facilities_layer_cursor_fields
                    ):
                        facilities_row = [row[0], str(row[1]), 1]
                        if self.required_facilities_capacity_field:
                            facilities_row.append(row[-1])
                        else:
                            facilities_row.append(self.required_facilities_capacity)
                        cur.insertRow(facilities_row)

        # Transfer data from candidate facilities input layer, if applicable
        if self.candidate_facilities_layer and self.candidate_facilities_layer.count:
            candidate_facilities_layer_cursor_fields = ["SHAPE@", "OID@"]
            if self.candidate_facilities_capacity_field:
                candidate_facilities_layer_cursor_fields.append(FieldUtils.get_fq_field_name(self.candidate_facilities_capacity_field,
                                                                                             self.candidate_facilities_layer,
                                                                                             running_in_portal))
            # Determine the correct geographic transformation
            transformation = NAUtils.get_datum_transformation(
                self.candidate_facilities_layer.spatialReference,  # type: ignore
                self.output_coordinate_system,
                self.candidate_facilities_layer.extent  # type: ignore
            )
            # Insert data
            with arcpy.EnvManager(
                extent=None,
                outputCoordinateSystem=self.output_coordinate_system,
                geographicTransformations=transformation
            ):
                with InsertCursor(
                        self.input_facilities, facilities_field_names) as cur:
                    for row in SearchCursor(  # pylint: disable=no-member
                        self.candidate_facilities_layer.layer,
                        candidate_facilities_layer_cursor_fields
                    ):
                        facilities_row = [row[0], row[1], 0]
                        if self.candidate_facilities_capacity_field:
                            facilities_row.append(row[-1])
                        else:
                            facilities_row.append(self.candidate_facilities_capacity)
                        cur.insertRow(facilities_row)

        # Derive problem type and facilities to find based on goal
        goal_to_problem_type = {
            "MinimizeImpedance": "Minimize Impedance",
            "MaximizeCoverage": "Maximize Coverage",
            "MaximizeCapacitatedCoverage": "Maximize Capacitated Coverage",
            "PercentCoverage": "Target Market Share",
        }
        if self.goal in goal_to_problem_type:
            self.problem_type = goal_to_problem_type[self.goal]
            # For all goals other than allocate, facilities to find should be equal to number required facilities
            # count and candidate count
            self.facilities_to_find = self.candidate_count + self.required_facilities_layer.count  # type: ignore
        else:
            # For allocate goal, if capacity is not specified, solve Minimize Impedance. Otherwise solve Maximize
            # Capacitated Coverage. Also facilities to find is equal to required facility count
            if self.required_facilities_capacity_field:
                # Ignore facilities with zero capacity as they are not considered valid by the solver.
                self.facilities_to_find = len([
                    row[0] for row in SearchCursor(
                        self.input_facilities, "OID@", "Capacity > 0")
                ])
            else:
                self.facilities_to_find = self.required_facilities_layer.count  # type: ignore
            if self.required_facilities_capacity == NAUtils.INFINITY and not self.required_facilities_capacity_field:
                self.problem_type = "Minimize Impedance"
            else:
                self.problem_type = "Maximize Capacitated Coverage"

    def _post_process_allocation_lines_output(self, service_output: arcpy.FeatureSet):
        """Post-process the allocation lines output to ensure correct schema."""
        with LogExecutionTime("Post-processed output allocation lines"):

            # Assemble lists of fields to delete and rename to produce the correct schema based on the
            # analysis settings.
            # Allocation lines always have Minutes based field when using a time based travel mode. But if max
            # travel range units is other than Minutes, we need to keep travel time values in max travel range units
            # Delete minutes based values. If travel mode is distance based, we always get travel distance in
            # Kilometers and Miles. We need to delete travel distance in Miles and Kilometers if travel range units
            # is not Miles or Kilometers. We also always delete Name field as it is used to store OIDs.
            allocation_lines_rename_fields = {
                "Weight": ("AllocatedDemand", "Allocated Demand"),
                "FacilityID": ("FacilityID", "Facility ID"),
                "FacilityOID": ("FacilityOID", "Assigned Facility ID"),
                "DemandID": ("DemandID", "Demand ID"),
                "DemandOID": ("DemandOID", "Allocated Demand ID"),
            }
            allocation_lines_delete_fields = ["Name"]
            if self.is_travel_mode_time_based:
                if self.preferred_distance_units == "MILES":
                    allocation_lines_delete_fields += ["Total_Kilometers"]
                    allocation_lines_rename_fields["Total_Miles"] = (
                        "TotalTravelDistance",
                        "Total Travel Distance (Miles)")
                elif self.preferred_distance_units == "KILOMETERS":
                    allocation_lines_delete_fields += ["Total_Miles"]
                    allocation_lines_rename_fields["Total_Kilometers"] = (
                        "TotalTravelDistance",
                        "Total Travel Distance (Kilometers)")
                else:
                    allocation_lines_rename_fields["Total_Miles"] = (
                        "Total_Miles",
                        "Total Travel Distance (Miles)")
                    allocation_lines_rename_fields["Total_Kilometers"] = (
                        "Total_Kilometers",
                        "Total Travel Distance (Kilometers)")
                if self.max_travel_range_units == "Minutes":
                    allocation_lines_rename_fields["Total_Minutes"] = (
                        "TotalTravelTime",
                        "Total Travel Time (Minutes)")
                    allocation_lines_rename_fields["TotalWeighted_Minutes"] = (
                        "TotalWeightedTravelTime",
                        "Total Weighted Travel Time (Minutes)")
                else:
                    allocation_lines_delete_fields += ["TotalWeighted_Minutes", "Total_Minutes"]
                    allocation_lines_rename_fields["Total_{}".format(self.max_travel_range_units)] = (
                        "TotalTravelTime",
                        "Total Travel Time ({})".format(self.max_travel_range_units))
                    allocation_lines_rename_fields["TotalWeighted_{}".format(self.max_travel_range_units)] = (
                        "TotalWeightedTravelTime",
                        "Total Weighted Travel Time ({})".format(self.max_travel_range_units))
            else:
                allocation_lines_rename_fields["Total_Minutes"] = (
                    "TotalTravelTime",
                    "Total Travel Time (Minutes)")
                if self.max_travel_range_units == "Miles":
                    allocation_lines_delete_fields += ["Total_Kilometers", "TotalWeighted_Kilometers"]
                    allocation_lines_rename_fields["Total_Miles"] = (
                        "TotalTravelDistance",
                        "Total Travel Distance (Miles)")
                    allocation_lines_rename_fields["TotalWeighted_Miles"] = (
                        "TotalWeightedTravelDistance",
                        "Total Weighted Travel Distance (Miles)")
                elif self.max_travel_range_units == "Kilometers":
                    allocation_lines_delete_fields += ["Total_Miles", "TotalWeighted_Miles"]
                    allocation_lines_rename_fields["Total_Kilometers"] = (
                        "TotalTravelDistance",
                        "Total Travel Distance (Kilometers)")
                    allocation_lines_rename_fields["TotalWeighted_Kilometers"] = (
                        "TotalWeightedTravelDistance",
                        "Total Weighted Travel Distance (Kilometers)")
                elif self.max_travel_range == NAUtils.INFINITY and \
                        self.max_travel_range_units.upper() in NAUtils.TIME_UNITS:
                    # Should be in this code block when using a distance based travel mode and infinite travel
                    # range as in that case the travel range units will be minutes.
                    if self.preferred_distance_units == "MILES":
                        # Keep miles based fields and delete kilometer based fields
                        allocation_lines_rename_fields["Total_Miles"] = (
                            "TotalTravelDistance",
                            "Total Travel Distance (Miles)")
                        allocation_lines_rename_fields["TotalWeighted_Miles"] = (
                            "TotalWeightedTravelDistance",
                            "Total Weighted Travel Distance (Miles)")
                        allocation_lines_delete_fields += ["Total_Kilometers", "TotalWeighted_Kilometers"]
                    elif self.preferred_distance_units == "KILOMETERS":
                        # Keep kilometer based fields and delete miles based fields
                        allocation_lines_rename_fields["Total_Kilometers"] = (
                            "TotalTravelDistance",
                            "Total Travel Distance (Kilometers)")
                        allocation_lines_rename_fields["TotalWeighted_Kilometers"] = (
                            "TotalWeightedTravelDistance",
                            "Total Weighted Travel Distance (Kilometers)")
                        allocation_lines_delete_fields += ["Total_Miles", "TotalWeighted_Miles"]
                    else:
                        # Keep both miles and kilometer based fields
                        allocation_lines_rename_fields["Total_Miles"] = (
                            "Total_Miles",
                            "Total Travel Distance (Miles)")
                        allocation_lines_rename_fields["TotalWeighted_Miles"] = (
                            "TotalWeighted_Miles",
                            "Total Weighted Travel Distance (Miles)")
                        allocation_lines_rename_fields["Total_Kilometers"] = (
                            "Total_Kilometers",
                            "Total Travel Distance (Kilometers)")
                        allocation_lines_rename_fields["TotalWeighted_Kilometers"] = (
                            "TotalWeighted_Kilometers",
                            "Total Weighted Travel Distance (Kilometers)")
                else:
                    allocation_lines_delete_fields += [
                        "TotalWeighted_Miles", "Total_Miles", "TotalWeighted_Kilometers", "Total_Kilometers"]
                    allocation_lines_rename_fields["Total_{}".format(self.max_travel_range_units)] = (
                        "TotalTravelDistance",
                        "Total Travel Distance ({})".format(self.max_travel_range_units))
                    allocation_lines_rename_fields["TotalWeighted_{}".format(self.max_travel_range_units)] = (
                        "TotalWeightedTravelDistance",
                        "Total Weighted Travel Distance ({})".format(self.max_travel_range_units))

            # Create a FieldMappings object to handle deleting and renaming fields when we call the
            # ExportFeatures tool
            field_mappings = NAUtils.make_field_maps(
                service_output,
                [],
                allocation_lines_rename_fields
            )

            # Update the OID fields to 64bit if needed
            if self.demand_layer_has_oid64:
                demandoid_idx = field_mappings.findFieldMapIndex("DemandOID")
                if demandoid_idx != -1:  # Only try if it was there in the first place
                    field_mappings.removeFieldMap(demandoid_idx)
                    field_map = NAUtils.make_new_field_map_with_output_field(
                        "DemandOID", "Allocated Demand ID", "BigInteger")
                    field_map.addInputField(service_output, "DemandOID")
                    field_mappings.addFieldMap(field_map)
            if self.facilities_layer_has_oid64:
                facilityoid_idx = field_mappings.findFieldMapIndex("FacilityOID")
                if facilityoid_idx != -1:  # Only try if it was there in the first place
                    field_mappings.removeFieldMap(facilityoid_idx)
                    field_map = NAUtils.make_new_field_map_with_output_field(
                        "FacilityOID", "Assigned Facility ID", "BigInteger")
                    field_map.addInputField(service_output, "FacilityOID")
                    field_mappings.addFieldMap(field_map)

            # Copy the service output to the final output location using the correct schema
            # (designated in the field mappings) and the correct output spatial reference
            NAUtils.copy_service_output_to_fc(
                service_output, self.allocation_lines_output.data, field_mappings, self.output_coordinate_system)

            # Update DemandOID and FacilityOID fields on allocation lines based on Name field
            # Name field includes facility oid and demand oid values based on travel direction
            if self.travel_direction == "FacilityToDemand":
                demand_oid_index = 1
                facility_oid_index = 0
            else:
                demand_oid_index = 0
                facility_oid_index = 1
            arcpy.management.CalculateFields(
                self.allocation_lines_output.data,
                CALFIELD_PY_METHOD,
                [
                    ["DemandOID", "!Name!.split('-')[{}].strip()".format(demand_oid_index)],
                    ["FacilityOID", "!Name!.split('-')[{}].strip()".format(facility_oid_index)]
                ]
            )
            arcpy.management.DeleteField(self.allocation_lines_output.data, allocation_lines_delete_fields)

    def _post_process_allocated_demand_locations_output(self, service_output: arcpy.FeatureSet):
        """Post-process the allocated demand locations output to ensure correct schema."""
        with LogExecutionTime("Post-processed output allocated demand locations"):

            # Assemble lists of fields to delete and rename to produce the correct schema
            allocated_demand_locations_delete_fields = ["Name", "GroupName", "CurbApproach"]
            allocated_demand_locations_rename_fields = {
                "FacilityID": ("FacilityID", "Facility ID"),
                "FacilityOID": ("FacilityOID", "Assigned Facility ID"),
                "DemandOID": ("DemandOID", "Demand ID"),
                "Weight": ("Demand", "Demand"),
                "AllocatedWeight": ("AllocatedDemand", "Allocated Demand"),
                "Status": ("StatusLong", "Status"),
            }
            # Create a FieldMappings object to handle deleting and renaming fields when we call the
            # ExportFeatures tool
            field_mappings = NAUtils.make_field_maps(
                service_output,
                allocated_demand_locations_delete_fields,
                allocated_demand_locations_rename_fields
            )
            # Update field mappings to map the Name field to the DemandOID field in the output
            demandoid_idx = field_mappings.findFieldMapIndex("DemandOID")
            if demandoid_idx != -1:  # Only try if it was there in the first place
                if self.demand_layer_has_oid64:  # Special handling of 64bit OIDs
                    field_mappings.removeFieldMap(demandoid_idx)
                    field_map = NAUtils.make_new_field_map_with_output_field("DemandOID", "Demand ID", "BigInteger")
                    # Add the Name field as a new field map
                    field_map.addInputField(service_output, "Name")
                    field_mappings.addFieldMap(field_map)
                else:
                    # Grab the field map object for this input field name
                    field_map: arcpy.FieldMap = field_mappings.getFieldMap(demandoid_idx)  # type: ignore
                    # Remove the default field mapping
                    field_map.removeInputField(0)
                    # Add the Name field as a new field map
                    field_map.addInputField(service_output, "Name")
                    # Update the field mappings object with the updated field map
                    field_mappings.replaceFieldMap(demandoid_idx, field_map)
            # Handle 64bit OIDs in FacilityOID if needed
            if self.facilities_layer_has_oid64:
                facilityoid_idx = field_mappings.findFieldMapIndex("FacilityOID")
                if facilityoid_idx != -1:  # Only try if it was there in the first place
                    field_mappings.removeFieldMap(facilityoid_idx)
                    field_map = NAUtils.make_new_field_map_with_output_field(
                        "FacilityOID", "Assigned Facility ID", "BigInteger")
                    field_map.addInputField(service_output, "FacilityOID")
                    field_mappings.addFieldMap(field_map)
            # Add a string field called Status
            field_mappings.addFieldMap(NAUtils.make_status_field_map())

            # Copy the service output to the final output location using the correct schema
            # (designated in the field mappings) and the correct output spatial reference
            NAUtils.copy_service_output_to_fc(
                service_output,
                self.allocated_demand_locations_output.data, field_mappings,
                self.output_coordinate_system)

            # Update Status field with string values translated from StatusLong enums
            NAUtils.calc_status_field(self.allocated_demand_locations_output.data)

            # Update FacilityOID field with correct values from inputs based on a mapping from the output
            arcpy.management.AddJoin(
                self.allocated_demand_locations_output.layer, "FacilityID",
                self.assigned_facilities_output.layer, "FacilityID")
            arcpy.management.CalculateField(
                self.allocated_demand_locations_output.layer, "FacilityOID",
                f"!{os.path.basename(self.assigned_facilities_output.data)}.FacilityOID!"  # type: ignore
            )
            arcpy.management.RemoveJoin(self.allocated_demand_locations_output.layer)

            # Transfer fields from input demand points
            self._transfer_fields(
                self.demand_locations_layer, self.allocated_demand_locations_output.layer,
                "DemandOID", input_layer_has_oid64=self.demand_layer_has_oid64
            )

    def _post_process_assigned_facilities_output(self, service_output: arcpy.FeatureSet):
        """Post-process the assigned facilities output to ensure correct schema."""
        with LogExecutionTime("Post-processed output assigned facilities"):

            # Assemble lists of fields to delete and rename to produce the correct schema
            assigned_facilities_delete_fields = ["Name", "Weight", "CurbApproach"]
            assigned_facilities_rename_fields = {
                "FacilityOID": ("FacilityOID", "Assigned Facility ID"),
                "DemandWeight": ("AllocatedDemand", "Allocated Demand"),
                "DemandCount": ("DemandCount", "Demand Count"),
                "Status": ("StatusLong", "Status")
            }
            if self.is_travel_mode_time_based:
                if self.max_travel_range_units == "Minutes":
                    assigned_facilities_rename_fields["Total_Minutes"] = (
                        "TotalTravelTime",
                        "Total Travel Time (Minutes)")
                    assigned_facilities_rename_fields["TotalWeighted_Minutes"] = (
                        "TotalWeightedTravelTime",
                        "Total Weighted Travel Time (Minutes)")
                else:
                    assigned_facilities_delete_fields += ["Total_Minutes", "TotalWeighted_Minutes"]
                    assigned_facilities_rename_fields["Total_{}".format(self.max_travel_range_units)] = (
                        "TotalTravelTime",
                        "Total Travel Time ({})".format(self.max_travel_range_units))
                    assigned_facilities_rename_fields["TotalWeighted_{}".format(self.max_travel_range_units)] = (
                        "TotalWeightedTravelTime",
                        "Total Weighted Travel Time ({})".format(self.max_travel_range_units))
            else:
                if self.max_travel_range_units == "Miles":
                    assigned_facilities_delete_fields += ["Total_Kilometers", "TotalWeighted_Kilometers"]
                    assigned_facilities_rename_fields["Total_Miles"] = (
                        "TotalTravelDistance",
                        "Total Travel Distance (Miles)")
                    assigned_facilities_rename_fields["TotalWeighted_Miles"] = (
                        "TotalWeightedTravelDistance",
                        "Total Weighted Travel Distance (Miles)")
                elif self.max_travel_range_units == "Kilometers":
                    assigned_facilities_delete_fields += ["Total_Miles", "TotalWeighted_Miles"]
                    assigned_facilities_rename_fields["Total_Kilometers"] = (
                        "TotalTravelDistance",
                        "Total Travel Distance (Kilometers)")
                    assigned_facilities_rename_fields["TotalWeighted_Kilometers"] = (
                        "TotalWeightedTravelDistance",
                        "Total Weighted Travel Distance (Kilometers)")
                elif self.max_travel_range == NAUtils.INFINITY and \
                        self.max_travel_range_units.upper() in NAUtils.TIME_UNITS:
                    #Should be in this code block when using a distance based travel mode and infinite travel
                    #range as in that case the travel range units will be minutes.
                    if self.preferred_distance_units == "MILES":
                        #Keep miles based fields and delete kilometer based fields
                        assigned_facilities_delete_fields += ["Total_Kilometers", "TotalWeighted_Kilometers"]
                        assigned_facilities_rename_fields["Total_Miles"] = (
                            "TotalTravelDistance",
                            "Total Travel Distance (Miles)")
                        assigned_facilities_rename_fields["TotalWeighted_Miles"] = (
                            "TotalWeightedTravelDistance",
                            "Total Weighted Travel Distance (Miles)")
                    elif self.preferred_distance_units == "KILOMETERS":
                        #Keep kilometer based fields and delete miles based fields
                        assigned_facilities_delete_fields += ["Total_Miles", "TotalWeighted_Miles"]
                        assigned_facilities_rename_fields["Total_Kilometers"] = (
                            "TotalTravelDistance",
                            "Total Travel Distance (Kilometers)")
                        assigned_facilities_rename_fields["TotalWeighted_Kilometers"] = (
                            "TotalWeightedTravelDistance",
                            "Total Weighted Travel Distance (Kilometers)")
                    else:
                        #Keep both miles and kilometers based fields
                        assigned_facilities_rename_fields["Total_Miles"] = (
                            "Total_Miles",
                            "Total Travel Distance (Miles)")
                        assigned_facilities_rename_fields["TotalWeighted_Miles"] = (
                            "TotalWeighted_Miles",
                            "Total Weighted Travel Distance (Miles)")
                        assigned_facilities_rename_fields["Total_Kilometers"] = (
                            "Total_Kilometers",
                            "Total Travel Distance (Kilometers)")
                        assigned_facilities_rename_fields["TotalWeighted_Kilometers"] = (
                            "TotalWeighted_Kilometers",
                            "Total Weighted Travel Distance (Kilometers)")
                else:
                    assigned_facilities_delete_fields += [
                        "Total_Kilometers",
                        "TotalWeighted_Kilometers",
                        "Total_Miles",
                        "TotalWeighted_Miles"
                    ]
                    assigned_facilities_rename_fields["Total_{}".format(self.max_travel_range_units)] = (
                        "TotalTravelDistance",
                        "Total Travel Distance ({})".format(self.max_travel_range_units))
                    assigned_facilities_rename_fields["TotalWeighted_{}".format(self.max_travel_range_units)] = (
                        "TotalWeightedTravelDistance",
                        "Total Weighted Travel Distance ({})".format(self.max_travel_range_units))

            # Create a FieldMappings object to handle deleting and renaming fields when we call the
            # ExportFeatures tool
            field_mappings = NAUtils.make_field_maps(
                service_output,
                assigned_facilities_delete_fields,
                assigned_facilities_rename_fields
            )
            # Add a string field called Status
            field_mappings.addFieldMap(NAUtils.make_status_field_map())
            # Update field mappings to map the Name field to the FacilityOID field in the output
            facilityoid_idx = field_mappings.findFieldMapIndex("FacilityOID")
            if facilityoid_idx != -1:  # Only try if it was there in the first place
                if self.facilities_layer_has_oid64:  # Special handling of 64bit OIDs
                    field_mappings.removeFieldMap(facilityoid_idx)
                    field_map = NAUtils.make_new_field_map_with_output_field(
                        "FacilityOID", "Assigned Facility ID", "BigInteger")
                    # Add the Name field as a new field map
                    field_map.addInputField(service_output, "Name")
                    field_mappings.addFieldMap(field_map)
                else:
                    # Grab the field map object for this input field name
                    field_map: arcpy.FieldMap = field_mappings.getFieldMap(facilityoid_idx)  # type: ignore
                    # Remove the default field mapping
                    field_map.removeInputField(0)
                    # Add the Name field as a new field map
                    field_map.addInputField(service_output, "Name")
                    # Update the field mappings object with the updated field map
                    field_mappings.replaceFieldMap(facilityoid_idx, field_map)
            # Add a field map for a new field called FacilityID and set it equal to the FacilityOID field
            fac_id_fm = NAUtils.make_new_field_map_with_output_field("FacilityID", "Facility ID", "Integer")
            fac_id_fm.addInputField(service_output, "FacilityOID")
            field_mappings.addFieldMap(fac_id_fm)
            # Update FacilityType field to be a string
            facilitytype_idx = field_mappings.findFieldMapIndex("FacilityType")
            if facilitytype_idx != -1:  # Only try if it was there in the first place
                # Grab the field map object for this input field name
                field_map: arcpy.FieldMap = field_mappings.getFieldMap(facilitytype_idx)  # type: ignore
                # Get the output field object and update its type to String
                out_field_obj = field_map.outputField
                out_field_obj.aliasName = "Facility Type"
                out_field_obj.type = "String"
                out_field_obj.length = 10
                # Update the field map object with the updated field
                field_map.outputField = out_field_obj
                # Update the field mappings object with the updated field map
                field_mappings.replaceFieldMap(facilitytype_idx, field_map)

            # Copy the service output to the final output location using the correct schema
            # (designated in the field mappings) and the correct output spatial reference
            NAUtils.copy_service_output_to_fc(
                service_output, self.assigned_facilities_output.data, field_mappings, self.output_coordinate_system)

            # Update Status field with string values translated from StatusLong enums
            NAUtils.calc_status_field(self.assigned_facilities_output.data)

            # Update FacilityType field to use string names instead of codes
            with UpdateCursor(  # pylint: disable=no-member
                    self.assigned_facilities_output.data, ["FacilityType"]) as cur:
                for row in cur:
                    cur.updateRow([NAUtils.FACILITY_TYPES[row[0]]])

            # Transfer fields from the input required facilities
            if self.required_facilities_layer and self.required_facilities_layer.count:
                assigned_required_facilities_layer = "AssignedRequiredFacilitiesLayer"
                arcpy.management.MakeFeatureLayer(
                    self.assigned_facilities_output.layer,
                    assigned_required_facilities_layer,
                    "FacilityType = 'Required'", self.output_workspace
                )
                self._transfer_fields(
                    self.required_facilities_layer, assigned_required_facilities_layer,
                    "FacilityOID", "REQFAC", input_layer_has_oid64=self.required_facility_layer_has_oid64
                )

            # Transfer fields from the input candidate facilities
            if self.candidate_facilities_layer and self.candidate_facilities_layer.count:
                assigned_candidate_facilities_layer = "AssignedCandidateFacilitiesLayer"
                arcpy.management.MakeFeatureLayer(
                    self.assigned_facilities_output.layer, assigned_candidate_facilities_layer,
                    "FacilityType <> 'Required'", self.output_workspace
                )
                self._transfer_fields(
                    self.candidate_facilities_layer, assigned_candidate_facilities_layer,
                    "FacilityOID", "CANFAC", input_layer_has_oid64=self.candidate_facilities_layer_has_oid64
                )

    def _transfer_fields(self, source_layer_info: PAFeatureLayer, destination_layer: str, destination_join_field: str,
                         source_field_name_prefix="ORIG", rename_all=False, input_layer_has_oid64: bool = False):
        """Transfer fields from using appropriate names and aliases.

        When rename_all is False, only rename fields that are common between source and destination."""
        non_transferable_field_types = ("globalid", "guid")
        source_field_maps = []
        transfer_field_names = []
        common_fields = []
        source_layer_field_names = [fld.name for fld in source_layer_info.fields]
        source_layer_field_names_lower = [name.lower() for name in source_layer_field_names]

        # Find the fields that have same names in source and destination layers
        if not rename_all:
            destination_layer_desc = AOLUtils.describe(destination_layer)
            for fld in destination_layer_desc.fields:
                fld_name = fld.name
                if fld_name not in (destination_layer_desc.oidFieldName,
                                    destination_layer_desc.shapeFieldName):
                    if fld.type not in non_transferable_field_types:
                        if fld_name.lower() in source_layer_field_names_lower:
                            common_fields.append(fld_name)

        # Construct field mappings to transfer fields with the correct names and aliases.
        field_mappings = arcpy.FieldMappings()
        field_mappings.addTable(source_layer_info.layer)
        # Set the output field names and aliases correctly
        for field_map in field_mappings.fieldMappings:
            output_field = field_map.outputField
            # Skip GUID fields as they are invalid with JoinField tool.
            if output_field.type.lower() in non_transferable_field_types:
                continue
            source_fld_name = output_field.name
            if rename_all or source_fld_name in common_fields:
                new_field_name = "{0}_{1}".format(source_field_name_prefix, source_fld_name)
            else:
                new_field_name = source_fld_name
            output_field.name = new_field_name
            output_field.aliasName = "{0}: {1}".format(source_layer_info.layer_name, output_field.aliasName)
            field_map.outputField = output_field
            transfer_field_names.append(new_field_name)
            source_field_maps.append(field_map)

        # Transfer the OID field from source as ORIG_FID
        oid_field_name = NAUtils.get_unique_field_name("ORIG_FID", source_layer_field_names)
        fm_oid = arcpy.FieldMap()
        fm_oid.addInputField(source_layer_info.layer, source_layer_info.oidFieldName)
        oid_field = fm_oid.outputField
        oid_field.name = oid_field_name
        id_field_type = "BIGINTEGER" if input_layer_has_oid64 else "LONG"
        oid_field.type = id_field_type
        oid_field.aliasName = "ORIG FID"
        fm_oid.outputField = oid_field
        source_field_maps.append(fm_oid)

        # Construct the final list of field maps to transfer
        source_field_mappings = arcpy.FieldMappings()
        for fm in source_field_maps:
            source_field_mappings.addFieldMap(fm)

        # Make a temp copy of the source layer, updating the schema according to our field mapping
        source_features_copy = AOLUtils.create_unique_name(self.temp_input_start_name, self.output_workspace)
        arcpy.conversion.TableToTable(
            source_layer_info.layer,
            os.path.dirname(source_features_copy),
            os.path.basename(source_features_copy),
            field_mapping=source_field_mappings
        )

        # Join fields from the temp copy with correct schema to the destination layer
        arcpy.management.JoinField(
            destination_layer, destination_join_field, source_features_copy,
            oid_field_name, transfer_field_names
        )

    def execute(self):
        """Execute the core logic of ChooseBestFacilities."""
        # Preprocess the inputs to transform them into the correct format for the services tool
        with LogExecutionTime("Preprocessed inputs"):
            self._preprocess_inputs()

        # Get the tool and prepare the task
        tbx = RemoteToolboxUtils.get_remote_toolbox("asyncLocationAllocation", self.portal_description)
        LOGGER.debug("Adding remote toolbox {0}".format(tbx))
        point_barr_lyr = self.point_barrier_layer.layer if self.point_barrier_layer else None
        line_barr_lyr = self.line_barrier_layer.layer if self.line_barrier_layer else None
        poly_barr_lyr = self.polygon_barrier_layer.layer if self.polygon_barrier_layer else None
        travel_direction_keywords = {
            "FacilityToDemand": "Facility to Demand",
            "DemandToFacility": "Demand to Facility"
        }
        # Measurement units are the same as max_travel_range if max_travel_range is specified. Else derive measurement
        # units from travel mode using Minutes for time based travel modes and miles for distance based travel modes
        if self.max_travel_range == NAUtils.INFINITY and not self.max_travel_range_field:
            measurement_units = "Minutes" if self.is_travel_mode_time_based else "Miles"
        else:
            measurement_units = self.max_travel_range_units
        task_params = [
            self.input_facilities,
            self.input_demand_points,
            measurement_units,
            "",
            self.problem_type,
            self.facilities_to_find,
            self.max_travel_range,
            1,
            self.percent_demand_coverage,
            "", "",
            travel_direction_keywords[self.travel_direction],
            self.time_of_day,
            NAUtils.TIME_ZONE_KEYWORDS[self.time_zone_for_time_of_day],
            "",
            point_barr_lyr,
            line_barr_lyr,
            poly_barr_lyr,
            "", "", "", "",
            self.travel_mode,
            ""
        ]
        ignore_error_codes = (30109,)

        # Call the tool
        service_result = NAUtils.call_async_gp_service(
            tbx, "SolveLocationAllocation", task_params, ignore_error_codes)
        self.remote_job_id = service_result.resultID

        # If solve succeeded, save the results from the remote tool and post-process them to have the correct schema.
        if service_result.getOutput(0).lower() == 'true':
            with LogExecutionTime("Saved the results from remote tool"):
                self._post_process_allocation_lines_output(service_result.getOutput(1))
                self._post_process_assigned_facilities_output(service_result.getOutput(2))
                self._post_process_allocated_demand_locations_output(service_result.getOutput(3))
                self.task_cost = NAUtils.get_remote_task_cost(service_result, 7)
