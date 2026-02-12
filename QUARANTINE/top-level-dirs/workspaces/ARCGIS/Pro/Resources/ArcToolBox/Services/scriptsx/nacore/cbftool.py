"""ChooseBestFacilities tool implementation."""
# functions called implicitly in __init__. noqa. pylint: disable=attribute-defined-outside-init
# import internal modules. noqa. pylint: disable=import-error,no-name-in-module
import time
from copy import deepcopy

import arcpy
from arcpy.da import SearchCursor

from common import (PATool, PAFeatureLayer,
                    ToolExit, LogUtils, PAPrivileges,
                    FSECPublisher,
                    UniqueValueRenderer, AnalysisUtils,
                    RefundErrorProcessor,
                    ModelBuilderMixin,
                    COST_KEY,
                    ParameterUnpackMixin)
from .cbfexecutor import CBFExecutor
from .nautils import NAUtils


LOGGER = LogUtils.setup_logger(__name__)


class CBFErrorProcessor(RefundErrorProcessor):
    """Append errors from remote service for ChooseBestFacilities."""

    def process_remote_service_error(self):
        """Process any error code reported by the remote service."""
        if isinstance(self.error, arcpy.ExecuteError):
            # Check if we need to handle any error codes reported from the remote service
            if self.error.args:
                exception_args = self.error.args[0]
                if (
                        (isinstance(exception_args, (list, dict)) and 30145 in exception_args)
                        or (isinstance(exception_args, str) and '30145' in exception_args)
                ):
                    # Walking limit exceeded
                    NAUtils.handle_walking_limit_error(self.tool.executor.tool_limits)  # type: ignore

                if (
                        (isinstance(exception_args, (list, dict)) and 30095 in exception_args)
                        or (isinstance(exception_args, str) and '30095' in exception_args)
                ):
                    # Barrier limit exceeded
                    remote_err = exception_args[30095] if isinstance(exception_args, dict) else exception_args
                    if NAUtils.raise_barrier_limit_error(remote_err):
                        return False

                # Handle generic "ERROR 030024: Solve returned a failure."
                if (
                    (isinstance(exception_args, (list, dict)) and 30024 in exception_args)
                    or (isinstance(exception_args, str) and '30024' in exception_args)
                ):
                    remote_err = exception_args[30024] if isinstance(exception_args, dict) else exception_args
                    NAUtils.handle_solver_com_errors(remote_err)  # type: ignore


    def process_gp_error(self):
        """Overwrite the process_gp_error function to add the additional process of remote service error."""
        if self.tool:
            self.process_remote_service_error()
        super().process_gp_error()


class CBFTool(ParameterUnpackMixin, ModelBuilderMixin, PATool):
    """Implementation of ChooseBestFacilities tool."""

    def get_parameters(self):
        """Implement the abstractmethod of get_parameters."""
        # check the NA privilege
        LOGGER.debug("Checking privileges")
        if not self.check_privileges([PAPrivileges.NETWORK_ANALYSIS]):
            LOGGER.error(100111, extra={"message_ID": 100111})
            raise ToolExit

        # Tool signature matches the descriptions here:
        # https://developers.arcgis.com/rest/analysis/api-reference/choose-best-facilities.htm
        LOGGER.debug("Retrieving parameters from tool dialog")
        (goal, demand_field, max_travel_range_field, max_travel_range_units,
         travel_mode, time_zone_for_time_of_day, travel_direction) = self.unpack([0, 3, 5, 6, 7, 9, 10],
                                                                                 as_text=True)
        (demand, max_travel_range, time_of_day) = self.unpack([2, 4, 8], as_text=False)
        remote_server_ver = self.get_remote_server_version("asyncRoute")
        input_demand_layer = PAFeatureLayer(
            1,
            metadata={"parameterDataType": "Feature Set", "parameterName": "demandLocationsLayer",
                      "defaultLayerName": "Demand Locations Layer"},
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        input_required_facilities_layer = PAFeatureLayer(
            11,
            metadata={"parameterDataType": "Feature Set",
                      "parameterName": "requiredFacilitiesLayer",
                      "parameterType": "Optional",
                      "defaultLayerName": "Required Facilities Layer"},
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        LOGGER.debug(f"input_required_facilities_layer loaded successfully.")
        (required_facilities_capacity, candidate_count, candidate_facilities_capacity,
         percent_demand_coverage) = self.unpack([12, 15, 16, 18], as_text=False)
        (required_facilities_capacity_field, candidate_facilities_capacity_field) = self.unpack([13, 17],
                                                                                                as_text=True)
        input_candidate_facilities_layer = PAFeatureLayer(
            14,
            metadata={"parameterDataType": "Feature Set",
                      "parameterName": "candidateFacilitiesLayer",
                      "parameterType": "Optional",
                      "defaultLayerName": "Candidate Facilities Layer"},
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        LOGGER.debug(f"input_candidate_facilities_layer loaded successfully.")
        point_barrier_layer = PAFeatureLayer(
            21,
            metadata={"parameterDataType": "Feature Set",
                      "parameterName": "pointBarrierLayer",
                      "parameterType": "Optional"},
            verify_feature_count=False,
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        line_barrier_layer = PAFeatureLayer(
            22,
            metadata={"parameterDataType": "Feature Set",
                      "parameterName": "lineBarrierLayer",
                      "parameterType": "Optional"},
            verify_feature_count=False,
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )
        polygon_barrier_layer = PAFeatureLayer(
            23,
            metadata={"parameterDataType": "Feature Set",
                      "parameterName": "polygonBarrierLayer",
                      "parameterType": "Optional"},
            verify_feature_count=False,
            use_as_soap_input=True,
            remote_server_version=remote_server_ver
        )

        # All outputs are created in the spatial reference of the demand locations layer.
        # Note: The output coordinate system is defined separately in the executor. Make sure any changes to this logic
        # are made in both places.
        if arcpy.env.outputCoordinateSystem:
            output_coordinate_system = arcpy.env.outputCoordinateSystem
            LOGGER.debug("arcpy.env.outputCoordinateSystem is specified and will be used for outputs.")
        else:
            output_coordinate_system = input_demand_layer.spatialReference
            LOGGER.debug("The spatial reference of the Input Demand Layer will be used for outputs.")
        self.check_overwrite_sr(output_coordinate_system)  # type: ignore

        # check credits
        LOGGER.debug("Setting cost parameters")
        self.cost_parameters = {
            "goal": goal,
            "demandLocationsLayer": input_demand_layer,
            "demand": demand,
            "demandField": demand_field,
            "maxTravelRange": max_travel_range,
            "maxTravelRangeField": max_travel_range_field,
            "maxTravelRangeUnits": max_travel_range_units,
            "travelMode": NAUtils.get_travel_mode_type_as_int(travel_mode),
            "timeOfDay": time.mktime(time_of_day.timetuple()) * 1000 if time_of_day else None,
            "timeZoneForTimeOfDay": time_zone_for_time_of_day,
            "travelDirection": travel_direction,
            "requiredFacilitiesLayer": input_required_facilities_layer,
            "requiredFacilitiesCapacity": required_facilities_capacity,
            "requiredFacilitiesCapacityField": required_facilities_capacity_field,
            "candidateFacilitiesLayer": input_candidate_facilities_layer,
            "candidateCount": candidate_count,
            "candidateFacilitiesCapacity": candidate_facilities_capacity,
            "candidateFacilitiesCapacityField": candidate_facilities_capacity_field,
            "percentDemandCoverage": percent_demand_coverage,
        }
        self.refund_param = None
        # replace in_memory with scratchGDB since the former does not
        # support TimestampOffset field type
        if (
            input_demand_layer.contains_field_type("TimestampOffset")
            or (input_required_facilities_layer and input_required_facilities_layer.contains_field_type("TimestampOffset"))
            or (input_candidate_facilities_layer and input_candidate_facilities_layer.contains_field_type("TimestampOffset"))
        ):
            wkspc = arcpy.env.scratchGDB
        else:
            wkspc = "in_memory"

        # Get user preferred distance units
        LOGGER.debug("Getting user preferred distance units")
        user_profile_distance_units = AnalysisUtils.get_units(self.portal_description, False)

        LOGGER.debug("Initializing tool executor")
        self.executor: CBFExecutor = CBFExecutor(
            goal,
            input_demand_layer,
            demand,
            demand_field,
            max_travel_range,
            max_travel_range_field,
            max_travel_range_units,
            travel_mode,
            time_of_day,
            time_zone_for_time_of_day,
            travel_direction,
            input_required_facilities_layer,
            required_facilities_capacity,
            required_facilities_capacity_field,
            input_candidate_facilities_layer,
            candidate_count,
            candidate_facilities_capacity,
            candidate_facilities_capacity_field,
            percent_demand_coverage,
            preferred_distance_units=user_profile_distance_units,
            point_barrier_layer=point_barrier_layer,
            line_barrier_layer=line_barrier_layer,
            polygon_barrier_layer=polygon_barrier_layer,
            output_workspace=wkspc,
            portal_description=self.portal_description
        )

    def validate_tool_parameters(self) -> bool:
        """Check if feature count will be > 9,999 for feature collection output."""
        if not self.output_name.create_service and self.executor.demand_locations_layer.count > 9999:
            LOGGER.error(100291, extra={"message_ID": 100291})
            return False
        return self.executor is not None

    def set_visualization(self):
        """Set the drawing/popup information of the output."""
        # Set the parameter for refund. It will be used implicitly by the error processor.
        # I don't really know why this stuff is in the set_visualization method, but here it is.
        self.cost_parameters[COST_KEY] = self.executor.task_cost
        LOGGER.debug("Setting refund parameters")
        self.refund_param = {"remoteJobID": self.executor.remote_job_id}
        if self.executor.task_cost >= 0:
            self.refund_param[COST_KEY] = self.executor.task_cost
        else:
            num_objects = 0
            for row in SearchCursor(
                self.executor.allocated_demand_locations_output.layer, "OID@", "facilityid IS NOT NULL"
            ):
                num_objects += 1
            self.refund_param["outFeatureCount"] = num_objects

        # The symbology for results is based on the concept of three unique colors for chosen, required and candidate
        # facilities. The required facilities are drawn using a different marker (diamond). For cover a percentage of
        # demand goal, since a demand can be assigned to multiple facilities, we only use two unique colors, but
        # still retain the diamond marker for required facilities.
        LOGGER.debug("Starting symbology configuration")

        is_percent_coverage = self.executor.goal == "PercentCoverage"

        # Set some shared style values
        unassigned_symbol_color = [215, 25, 28, 255]
        assigned_symbol_color = [77, 140, 38, 255]
        required_symbol_color = [1, 133, 113, 255]
        required_color = assigned_symbol_color if is_percent_coverage else required_symbol_color
        line_transparency = 25
        point_transparency = 0

        # Set labels specific to cover a percentage of demand goal
        chosen_label = "Chosen"
        required_label = "Required"
        unallocated_label = "Unallocated" if is_percent_coverage else "Unallocated Demand Location"

        # Get IDs for chosen and required facilities so that they can be assigned different markers
        required_facility_ids = []
        chosen_facility_ids = []
        with SearchCursor(
            self.executor.assigned_facilities_output.layer, ("FacilityID", "FacilityType"),
                "DemandCount <> 0") as cursor:
            for row in cursor:
                if row[1] == "Required":
                    required_facility_ids.append(str(row[0]))
                elif row[1] == "Chosen":
                    chosen_facility_ids.append(str(row[0]))

        # region allocation lines drawing
        # Set the symbology for the output allocation lines using a unique value renderer based on FacilityID field
        LOGGER.debug("Setting symbology for output allocation lines")

        # Read the renderer definition from a template json file
        drawing_info_allocation_lines = UniqueValueRenderer(
            self.executor.allocation_lines_output,
            line_transparency,
            ["FacilityID"],
            "cbf_allocation_lines_uniq_value_renderer_def.json",
            False,
            False
        )
        renderer_template = drawing_info_allocation_lines.renderer_info
        drawing_info_allocation_lines = drawing_info_allocation_lines.get_drawing_json()

        # Change the label and symbol color for allocation lines so that we have only two symbols,
        # one symbol color for lines to chosen facilities and another symbol color for lines to
        # required facilities. Update the renderer derived from the json template.
        updated_unique_values = []
        for unique_value in drawing_info_allocation_lines["renderer"]["uniqueValueInfos"]:
            unique_value["symbol"] = deepcopy(renderer_template["baseSymbol"])
            if unique_value["value"] in chosen_facility_ids:
                unique_value["label"] = "{} Facility".format(chosen_label)
                unique_value["symbol"]["color"] = assigned_symbol_color
            elif unique_value["value"] in required_facility_ids:
                unique_value["label"] = "{} Facility".format(required_label)
                unique_value["symbol"]["color"] = required_color
            else:
                unique_value["label"] = "Unassigned Facility"
                unique_value["symbol"]["color"] = unassigned_symbol_color
            updated_unique_values.append(unique_value)
        drawing_info_allocation_lines["renderer"]["uniqueValueInfos"] = updated_unique_values
        # For now, remove the new (as of 11.2) "uniqueValueGroups" key to avoid drawing issues.
        # TODO: We may be able to leverage this functionality to improve symbology.
        if "uniqueValueGroups" in drawing_info_allocation_lines["renderer"]:
            del drawing_info_allocation_lines["renderer"]["uniqueValueGroups"]

        # Set the symbology
        self.executor.allocation_lines_output.set_drawing(None, drawing_info_allocation_lines)

        # endregion allocation lines drawing

        # region assigned facilities drawing
        # Set the symbology for the output assigned facilities
        LOGGER.debug("Setting symbology for output assigned facilities")

        # Read the renderer definition from a template json file
        drawing_info_assigned_facilities = UniqueValueRenderer(
            self.executor.assigned_facilities_output,
            point_transparency,
            ["FacilityID"],
            "cbf_assigned_facilities_uniq_value_renderer_def.json",
            show_other_values=True,
            where_clause="DemandCount <> 0"
        )
        renderer_template = drawing_info_assigned_facilities.renderer_info
        drawing_info_assigned_facilities = drawing_info_assigned_facilities.get_drawing_json()

        # Update the default renderer symbols from the template to use a different
        # style for each facility type.
        updated_unique_values = []
        for unique_value in drawing_info_assigned_facilities["renderer"]["uniqueValueInfos"]:
            unique_value["symbol"] = deepcopy(renderer_template["baseSymbol"])
            if unique_value["value"] in required_facility_ids:
                unique_value["symbol"]["style"] = "esriSMSDiamond"
                unique_value["symbol"]["size"] = 15
                unique_value["symbol"]["color"] = required_color
                unique_value["label"] = required_label
            elif unique_value["value"] in chosen_facility_ids:
                unique_value["symbol"]["color"] = assigned_symbol_color
                unique_value["label"] = chosen_label
            else:
                unique_value["symbol"]["color"] = unassigned_symbol_color
                unique_value["label"] = "Unassigned"
            updated_unique_values.append(unique_value)
        drawing_info_assigned_facilities["renderer"]["uniqueValueInfos"] = updated_unique_values
        drawing_info_assigned_facilities["renderer"]["defaultLabel"] = "Unassigned"
        drawing_info_assigned_facilities["renderer"]["defaultSymbol"] = deepcopy(renderer_template["baseSymbol"])
        drawing_info_assigned_facilities["renderer"]["defaultSymbol"]["color"] = unassigned_symbol_color
        # For now, remove the new (as of 11.2) "uniqueValueGroups" key to avoid drawing issues.
        # TODO: We may be able to leverage this functionality to improve symbology.
        if "uniqueValueGroups" in drawing_info_assigned_facilities["renderer"]:
            del drawing_info_assigned_facilities["renderer"]["uniqueValueGroups"]

        # Set the symbology
        self.executor.assigned_facilities_output.set_drawing(None, drawing_info_assigned_facilities)

        # endregion assigned facilities drawing

        # region allocated demand locations drawing
        # Set the symbology for the output allocated demand locations
        LOGGER.debug("Setting symbology for output allocated demand locations")

        # For Cover a percentage of demand goal, the demand locations layer does not populate FacilityID field
        # since a demand can be allocated to more than one facility. In such cases use AllocatedDemand field to
        # determine if the demand was allocated to any facility.
        if is_percent_coverage:
            allocated_demand_field = "AllocatedDemand"
        else:
            allocated_demand_field = "FacilityID"

        # Read the renderer definition from a template json file
        drawing_info_allocated_demand = UniqueValueRenderer(
            self.executor.allocated_demand_locations_output,
            point_transparency,
            [allocated_demand_field],
            "cbf_allocated_demand_uniq_value_renderer_def.json",
            show_other_values=True,
            where_clause="{} IS NOT NULL".format(allocated_demand_field)
        )
        renderer_template = drawing_info_allocated_demand.renderer_info
        drawing_info_allocated_demand = drawing_info_allocated_demand.get_drawing_json()

        # Update the default renderer symbols from the template to use a different
        # style for allocated and unallocated demand
        updated_unique_values = []
        for unique_value in drawing_info_allocated_demand["renderer"]["uniqueValueInfos"]:
            unique_value["symbol"] = deepcopy(renderer_template["baseSymbol"])
            if unique_value["value"] in chosen_facility_ids:
                unique_value["label"] = "Chosen Facility"
                unique_value["symbol"]["color"] = assigned_symbol_color
            elif unique_value["value"] in required_facility_ids:
                unique_value["label"] = "Required Facility"
                unique_value["symbol"]["color"] = required_symbol_color
            elif is_percent_coverage:
                unique_value["label"] = "Allocated"
                unique_value["symbol"]["color"] = assigned_symbol_color
            else:
                unique_value["label"] = "Facility {}".format(unique_value["label"])
            updated_unique_values.append(unique_value)
        drawing_info_allocated_demand["renderer"]["uniqueValueInfos"] = updated_unique_values
        drawing_info_allocated_demand["renderer"]["defaultLabel"] = unallocated_label
        drawing_info_allocated_demand["renderer"]["defaultSymbol"] = deepcopy(renderer_template["baseSymbol"])
        # For now, remove the new (as of 11.2) "uniqueValueGroups" key to avoid drawing issues.
        # TODO: We may be able to leverage this functionality to improve symbology.
        if "uniqueValueGroups" in drawing_info_allocated_demand["renderer"]:
            del drawing_info_allocated_demand["renderer"]["uniqueValueGroups"]

        # Set the symbology
        self.executor.allocated_demand_locations_output.set_drawing(None, drawing_info_allocated_demand)

        # endregion allocated demand locations drawing

        # Create Popup information
        LOGGER.debug("Setting pop-ups")
        self.executor.assigned_facilities_output.set_popup(
            None, "Summary of Assigned Facilities"
        )
        self.executor.allocated_demand_locations_output.set_popup(
            None, "Summary of Allocated Demand Locations"
        )
        self.executor.allocation_lines_output.set_popup(
            None, "Summary of Allocation Lines"
        )

        # Create one to many relationship between assigned facilities and allocated demand locations and between
        # assigned facilities and allocated lines.
        # When one layer has multiple relationships, but relationships are assigned id 0 which causes query related
        # records to not work correctly on the output feature service. So until this is fixed in hosted
        # feature services, skip creating assigned facilities and allocated lines relationship.
        LOGGER.debug("Adding relationships")
        facility_to_demand_locations_rel_name = "AssignedFacilitiesToAllocatedDemandLocations"
        #facility_to_allocation_lines_rel_name = "AssignedFacilitiesToAllocationLines"

        # Facility to demand locations
        self.executor.assigned_facilities_output.add_relationship(
            facility_to_demand_locations_rel_name, 1,
            "FacilityID", is_origin=True, is_composite=False
        )

        # # Facility to allocation lines
        # self.executor.assigned_facilities_output.add_relationship(
        #     facility_to_allocation_lines_rel_name, 2,
        #     "FacilityOID", is_origin=True, is_composite=False
        # )

        self.executor.allocated_demand_locations_output.add_relationship(
            facility_to_demand_locations_rel_name, 0,
            "FacilityID", is_origin=False, is_composite=False
        )

        # self.executor.allocation_lines_output.add_relationship(
        #     facility_to_allocation_lines_rel_name, 0,
        #     "FacilityOID", is_origin=False, is_composite=False
        # )

    def publish_outputs(self):
        """Publish the output as a feature service."""
        # Need to clear out extent before copying features to SDE so that we can always copy all features
        # Without this ChooseBestFacilities may not copy all travel areas depending on the input map extent
        LOGGER.debug("Publishing results")
        with arcpy.EnvManager(extent=None):
            publisher = FSECPublisher(self.output_name, tool_version=self.version)
            publisher.add_layer_to_publish(
                self.executor.assigned_facilities_output, 26, "Assigned Facilities", layer_index=0)
            publisher.add_layer_to_publish(
                self.executor.allocated_demand_locations_output, 24, "Allocated Demand Locations", layer_index=1)
            publisher.add_layer_to_publish(
                self.executor.allocation_lines_output, 25, "Allocation Lines", layer_index=2)
            publisher.publish()

    def log_usage_metering(self):
        """Log the usage of the tool."""
        # Create an array of numeric values indicating each parameter value.
        goal_values = {
            "Allocate": 0,
            "MinimizeImpedance": 1,
            "MaximizeCoverage": 2,
            "MaximizeCapacitatedCoverage": 3,
            "PercentCoverage": 4,
        }
        max_travel_range_unit_values = {
            "Seconds": 0,
            "Minutes": 1,
            "Hours": 2,
            "Days": 3,
            "Meters": 4,
            "Kilometers": 5,
            "Feet": 6,
            "Yards": 7,
            "Miles": 8,
        }
        travel_direction_values = {
            "DemandToFacility": 0,
            "FacilityToDemand": 1,
        }
        time_of_day_value = time.mktime(self.executor.time_of_day.timetuple()) * 1000 if self.executor.time_of_day else None
        values = [
            goal_values.get("goal", 0),
            self.executor.demand_locations_layer.count,
            self.executor.demand,
            1 if self.executor.demand_field else 0,
            self.executor.max_travel_range,
            1 if self.executor.max_travel_range_field else 0,
            max_travel_range_unit_values.get(self.executor.max_travel_range_units, 1),
            NAUtils.get_travel_mode_type_as_int(self.executor.travel_mode),
            time_of_day_value,
            NAUtils.TIME_ZONE_VALUES.get(self.executor.time_zone_for_time_of_day, 1),
            travel_direction_values.get(self.executor.travel_direction, 1),
            self.executor.required_facilities_layer.count if self.executor.required_facilities_layer else 0,
            self.executor.required_facilities_capacity,
            1 if self.executor.required_facilities_capacity_field else 0,
            self.executor.candidate_facilities_layer.count if self.executor.candidate_facilities_layer else 0,
            self.executor.candidate_count,
            self.executor.candidate_facilities_capacity,
            1 if self.executor.candidate_facilities_capacity_field else 0,
            self.executor.percent_demand_coverage,
            self.output_name.output_cost,  # output is feature collection or feature service
        ]
        # Cost is 0 as the billing happens at logistics.arcgis.com
        LogUtils.log_usage(self.task_name, self.executor.demand_locations_layer.count, 0, values)
