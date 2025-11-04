"""Provides validation and execution logic for SnapToRoads tool."""

import logging
import os
import json

import arcpy
from arcpy.na import _na as nax
import nat
import nast
from nast import time_exec


class SnapToRoads(nast.NASolverTool):
    """Provides execution logic for SnapToRoads tool."""

    # Define instance attributes in slots primarily for faster attribute lookups
    __slots__ = ("points", "road_properties", "road_properties_on_lines", "return_lines",
                 "road_properties_on_snapped_points", "return_location_fields", "output_snapped_points", "output_lines")
    tool_name = "SnapToRoads"

    def __init__(self, **kwargs):
        """Store names used in all methods."""
        super().__init__()
        # print parameter values when debugging
        if self.logger.level == logging.DEBUG:
            for param_name, param_value in kwargs.items():
                self.logger.debug("%s: %s, %s", param_name, type(param_value), param_value)

        # field name used to store remote service conn info
        self.extent_fields[-1] = "GPSnapToRoadsSyncService"

        # Store tool parameter values as instance names.
        self.kwargs = kwargs
        self.points = kwargs["points"]
        self.network_datasets = self.strip_quotes(kwargs["network_datasets"]).split(";")
        self.nd_extents = kwargs["network_dataset_extents"]
        self.road_properties = kwargs["road_properties"]
        self.travel_mode = kwargs["travel_mode"]
        self.road_properties_on_snapped_points = kwargs["road_properties_on_snapped_points"]
        self.return_lines = kwargs["return_lines"]
        self.road_properties_on_lines = kwargs["road_properties_on_lines"]
        self.return_location_fields = kwargs["return_location_fields"]
        self.overrides = self._solver_perf_overrides(kwargs["overrides"])
        self.limits = self._get_analysis_limits(kwargs["analysis_limits"])
        self.analysis_region = kwargs["analysis_region"]
        self.output_gdb = kwargs["output_geodatabase"]
        self.output_names = self.read_value_table(kwargs["output_names"])

        # Broker to a single network dataset in case we have more than one.
        try:
            self.select_network_dataset([self.points])
        except ValueError:
            self.logger.error("", extra={"message_ID": 30374})
            raise nat.ToolExit from None

        # Other instance attributes
        if not self.conn_file:  # Remote network datasets cannot be described
            self.nds_info = nast.NDSInfo(self.network_dataset)  # Proxy for network dataset describe

        # Outputs created by the tool
        self.output_snapped_points = ""
        self.output_lines = ""
        self.usage_cost = json.dumps({
            "numObjects": 0,
            "credits": 0
        })

    @time_exec
    def _snap_to_roads(self):
        """Snap GPS points to streets using the SnapToRoads solver object."""
        if self.conn_file:
            self._snap_to_roads_svc()
            return
        # Create stor analysis object
        try:
            stor = time_exec(nax.SnapToRoads)(self.network_dataset)
        except ValueError as ex:
            self.logger.error(ex)
            raise nat.ToolExit from None
        self.solver_object = stor  # for cleanup at exit

        # Set analysis settings
        travel_mode = time_exec(self.get_travel_mode)(support_travel_mode_name=False)
        try:
            stor.travelMode = travel_mode
        except ValueError as err:
            self.logger.error("", extra={
                "message_ID": 30232,
                "add_argument1": str(travel_mode),
                })
            self.logger.error(err)
            raise nat.ToolExit from None
        stor.returnLines = self.return_lines
        try:
            stor.roadProperties = self.road_properties
        except ValueError as err:
            self.logger.error(err)
            raise nat.ToolExit from None
        try:
            stor.roadPropertiesOnLines = self.road_properties_on_lines
        except ValueError as err:
            self.logger.error(err)
            raise nat.ToolExit from None
        try:
            stor.roadPropertiesOnSnappedPoints = self.road_properties_on_snapped_points
        except ValueError as err:
            self.logger.error(err)
            raise nat.ToolExit from None
        stor.returnLocationFields = self.return_location_fields
        stor.overrides = self.overrides
        self.logger.debug("Solver object properties")
        self.log_prop_values(stor)

        # Load input data
        # Points
        self.logger.debug("Loading points")
        max_points_limit = self.limits.get("maximumPoints", None)
        try:
            time_exec(stor.load)(nax.SnapToRoadsInputDataType.Points, self.points,
                                max_features=max_points_limit)
        except nax.LimitError:
            self.logger.error("", extra={
                "message_ID": 30096,
                "add_argument1": "Points",
                "add_argument2": max_points_limit})
            raise nat.ToolExit from None
        except (nax.InputDataError, RuntimeError) as err:
            self.logger.error("", extra={
                "message_ID": 30251,
                "add_argument1": "Points",
            })
            self.logger.error(err)
            raise nat.ToolExit from None

        # Perform checks that are dependent on straight line distance between inputs. The distance between the inputs
        # can be calculated only after loading all the inputs into solver objects.
        self.max_meters_amid_inputs = stor._maxMetersBetweenInputs()  # As designed. pylint:disable=protected-access
        self._check_walking_limit()
        self._check_problem_extent_limit()
        # Force hierarchy if required to
        if travel_mode.useHierarchy == "NO_HIERARCHY":
            if self._force_hierarchy():
                travel_mode = stor.travelMode
                travel_mode.useHierarchy = "USE_HIERARCHY"
                stor.travelMode = travel_mode

        # Solve
        # TODO: Evaluate if this check is required for STOR
        # constrain the search space for exact solves
        # if travel_mode.useHierarchy == "NO_HIERARCHY":
        #     self._add_route_cutoff()
        with nast.PerfTimer("SolveTimeInSeconds"):
            result = time_exec(stor.solve)()
        self.solver_result = result
        self.solve_succeeded = result.solveSucceeded
        self.log_solver_messages(result)

        # Quit if solve failed
        if not self.solve_succeeded:
            raise nat.ToolExit

        with nast.PerfTimer("OutputTimeInSeconds"):
            # Export outputs
            # Output Snapped Points
            self.output_snapped_points = os.path.join(self.output_gdb, self.output_names[0][1])
            self.logger.debug("Exporting output points to '%s'", self.output_snapped_points)
            time_exec(result.export)(nax.SnapToRoadsOutputDataType.SnappedPoints, self.output_snapped_points)
            # Output Lines
            if self.return_lines:
                self.output_lines = os.path.join(self.output_gdb, self.output_names[1][1])
                self.logger.debug("Exporting output lines to '%s'", self.output_lines)
                time_exec(result.export)(nax.SnapToRoadsOutputDataType.Lines, self.output_lines)

    @time_exec
    def _snap_to_roads_svc(self):
        """Find routes using a geoprocessing service."""
        # Copy input feature sets as they can be referencing a URL which might not be accessible to the remote service
        # Not copying attribute parameter values as it is rare that someone will pass attribute parameter values from
        # a URL
        points = self._copy_features(self.points, check_validity=False)

        task_params = [points, self.kwargs["travel_mode"], self.return_lines, self.road_properties_on_snapped_points,
                       self.road_properties_on_lines, self.return_location_fields, self.overrides,
                       ]
        try:
            result = self._call_remote_tool(task_params)
        except Exception:  # Raise known error for unexpected remote tool failure. pylint:disable=broad-except
            self.logger.info("Failed to execute remote tool '%s'", self.remote_svc_name)
            self.logger.info("Exception details:", exc_info=True)
            self.logger.error("", extra={"message_ID": 30295})
            raise nat.ToolExit from None
        if result.maxSeverity == 2:
            self.solve_succeeded = False
            raise nat.ToolExit

        # Save the results
        self.solve_succeeded = True
        # Output Points
        self.output_snapped_points = os.path.join(self.output_gdb, self.output_names[0][1])
        arcpy.management.CopyFeatures(result.getOutput(0), self.output_snapped_points)
        # Output Lines
        if self.return_lines:
            self.output_lines = os.path.join(self.output_gdb, self.output_names[1][1])
            arcpy.management.CopyFeatures(result.getOutput(1), self.output_lines)
        # Usage cost
        self.usage_cost = result.getOutput(2)

    @time_exec
    def _report_usage(self):
        """Add usage metering and royalty messages used to deduct credits in AGOL."""
        num_objects = 0
        num_objects = self.solver_perf_metrics.get("MatchPoints", {}).get("MatchedPointsCount", 0)
        nast.SERVER_PERF_METRICS["LoadLocations"] = {"PointsCount": num_objects}
        if "BoundingBox" in self.solver_perf_metrics:
            nast.SERVER_PERF_METRICS["BoundingBox"] = self.solver_perf_metrics["BoundingBox"]
        if "GeodesicDistance" in self.solver_perf_metrics:
            nast.SERVER_PERF_METRICS["GeodesicDistance"] = self.solver_perf_metrics["GeodesicDistance"]
        self.logger.debug("Usage report")
        self.logger.debug("Num Objects: %s", num_objects)
        nast.SERVER_PERF_METRICS["NumObjects"] = num_objects
        metering_task_name = self.__class__.__name__
        if num_objects:
            # As designed. pylint:disable=protected-access
            arcpy.gp._arc_object.LogUsageMetering(5555, metering_task_name, num_objects)
            arcpy.gp._arc_object.LogUsageMetering(9999,
                                                  (f"{os.path.basename(self.network_dataset)}::{self.provider}::"
                                                   f"{metering_task_name}"), 
                                                  num_objects)
            # pylint:enable=protected-access
            usage_cost = {
                "numObjects": num_objects,
                "credits": self._usage_credits(num_objects) if num_objects else 0
            }
            self.usage_cost = json.dumps(usage_cost)

    def execute(self):
        """Tool execution logic."""
        self._snap_to_roads()
        self._report_usage()


class ToolValidator(nast.ToolValidator):
    """Class for validating parameter values and controlling the behavior of the tool's dialog."""

    def __init__(self):
        """Initialize required things."""
        super().__init__()
        self.tool_name = "SnapToRoads"
        self.nds_param = self.params[1]
        self.nds_extents_param = self.params[2]
        self.road_properties_param = self.params[3]
        self.travel_mode_param = self.params[4]
        self.road_props_points_params = self.params[6]
        self.road_props_lines_params = self.params[7]
        self.overrides_param = self.params[9]
        self.analysis_region_param = self.params[10]
