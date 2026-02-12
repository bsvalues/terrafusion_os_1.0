"""Provides validation and execution logic for GenerateOriginDestinationCostMatrix tool."""

import logging
import locale
import os
import json

import arcpy
import arcpy._na as nax
import nat
import nast
from nast import time_exec


class GenerateOriginDestinationCostMatrix(nast.NASolverTool):
    """Provides execution logic for GenerateOriginDestinationCostMatrix tool."""

    # Define instance attributes in slots primarily for faster attribute lookups
    __slots__ = ("origins", "destinations", "time_units", "distance_units", "destination_count", "default_cutoff",
                 "time_of_day", "time_zone", "line_shape_type", "output_lines", "output_origins", "output_destinations")

    def __init__(self, **kwargs):
        """Store names used in all methods."""
        super().__init__()
        # print parameter values when debugging
        if self.logger.level == logging.DEBUG:
            for param_name, param_value in kwargs.items():
                self.logger.debug("%s: %s, %s", param_name, type(param_value), param_value)

        self.extent_fields[-1] = "GPOriginDestinationCostMatrixService"  # field used to store remote service conn info
        # Store tool parameter values as instance names.
        self.kwargs = kwargs
        self.origins = kwargs["Origins"]
        self.destinations = kwargs["Destinations"]
        self.network_datasets = self.strip_quotes(kwargs["Network_Datasets"]).split(";")
        self.nd_extents = kwargs["Network_Dataset_Extents"]
        self.analysis_region = kwargs["Analysis_Region"]
        try:
            self.select_network_dataset([self.origins, self.destinations])
        except ValueError:
            self.logger.error("", extra={"message_ID": 30195})
            raise nat.ToolExit from None
        self.travel_mode = kwargs["Travel_Mode"]
        self.time_units = kwargs["Time_Units"]
        self.distance_units = kwargs["Distance_Units"]
        destination_count_val = kwargs["Number_of_Destinations_to_Find"]
        self.destination_count = locale.atoi(destination_count_val) if destination_count_val else None
        default_cutoff_val = kwargs["Cutoff"]
        self.default_cutoff = locale.atof(default_cutoff_val) if default_cutoff_val else None
        self.time_of_day = kwargs["Time_of_Day"]
        self.time_zone = self.TIME_ZONE[kwargs["Time_Zone_for_Time_of_Day"]]
        self.point_barriers = kwargs["Point_Barriers"]
        self.line_barriers = kwargs["Line_Barriers"]
        self.polygon_barriers = kwargs["Polygon_Barriers"]
        self.uturn_at_junctions = kwargs["Uturn_at_Junctions"]
        self.use_hierarchy = kwargs["Use_Hierarchy"]
        self.restrictions = kwargs["Restrictions"]
        self.attribute_parameter_values = kwargs["Attribute_Parameter_Values"]
        self.impedance = kwargs["Impedance"]
        self.line_shape_type = self.ROUTE_SHAPE_TYPE[kwargs["Origin_Destination_Line_Shape"]]
        self.save_layer_file = kwargs["Save_Output_Network_Analysis_Layer"]
        self.overrides = self._solver_perf_overrides(kwargs["Overrides"])
        self.time_impedance = kwargs["Time_Impedance"]
        self.distance_impedance = kwargs["Distance_Impedance"]
        self.output_format = kwargs["Output_Format"]
        self.accumulate_attributes = kwargs["Accumulate_Attributes"]
        self.output_gdb = kwargs["Output_Geodatabase"]
        self.output_names = self.read_value_table(kwargs["Output_Names"])
        self.ignore_loc_fields = kwargs["Ignore_Network_Location_Fields"]
        self.limits = self._get_analysis_limits(kwargs["Analysis_Limits"])
        self.ignore_invalid_locations = kwargs["Ignore_Invalid_Locations"]
        self.locate_settings = kwargs["Locate_Settings"]

        # Other instance attributes
        if not self.conn_file:  # Remote network datasets cannot be described
            self.nds_info = nast.NDSInfo(self.network_dataset)  # Proxy for network dataset describe

        # Outputs created by the tool
        self.output_lines = ""
        self.output_origins = ""
        self.output_destinations = ""
        self.output_layer_file = ""
        self.output_result_file = ""
        self.solve_succeeded = False
        self.usage_cost = json.dumps({
            "numObjects": 0,
            "credits": 0
        })

    @time_exec
    def _generate_odcm(self):
        """Generate OD cost matrix using od cost matrix solver object."""
        if self.conn_file:
            self._generate_odcm_svc()
            return
        # Create od cost matrix analysis object
        try:
            odcm = time_exec(nax.OriginDestinationCostMatrix)(self.network_dataset)
        except ValueError as ex:
            self.logger.error(ex)
            raise nat.ToolExit
        self.solver_object = odcm  # for cleanup at exit

        # Set analysis settings
        travel_mode = time_exec(self.get_travel_mode)()
        try:
            odcm.travelMode = travel_mode
        except ValueError as err:
            self.logger.error("", extra={
                "message_ID": 30232,
                "add_argument1": str(travel_mode),
                })
            self.logger.error(err)
            raise nat.ToolExit from None
        odcm.timeUnits = nax.TimeUnits[self.time_units]
        odcm.distanceUnits = nax.DistanceUnits[self.distance_units]
        odcm.defaultImpedanceCutoff = self.default_cutoff
        odcm.defaultDestinationCount = self.destination_count
        if self.accumulate_attributes:
            odcm.accumulateAttributeNames = self.get_valid_accumulate_attributes()
        odcm.timeOfDay = self.time_of_day
        odcm.timeZone = self.time_zone
        odcm.lineShapeType = self.line_shape_type
        odcm.overrides = self.overrides
        odcm.ignoreInvalidLocations = self.ignore_invalid_locations
        self._apply_locate_settings()
        self.logger.debug("Solver object properties")
        self.log_prop_values(odcm)

        # Load input data
        self.logger.debug("Loading origins")
        max_origins_limit = self.limits.get("maximumOrigins", None)
        origins_fm = time_exec(odcm.fieldMappings)(nax.OriginDestinationCostMatrixInputDataType.Origins,
                                                   not self.ignore_loc_fields, arcpy.ListFields(self.origins))
        self.logger.debug("Origins field map: %s", "; ".join([str(origins_fm[fm]) for fm in origins_fm]))
        try:
            time_exec(odcm.load)(nax.OriginDestinationCostMatrixInputDataType.Origins, self.origins, origins_fm,
                                 True, max_origins_limit)
        except nax.LimitError:
            self.logger.error("", extra={
                "message_ID": 30096,
                "add_argument1": "Origins",
                "add_argument2": max_origins_limit})
            raise nat.ToolExit from None
        except (nax.InputDataError, RuntimeError) as err:
            self.logger.error("", extra={
                "message_ID": 30251,
                "add_argument1": "Origins",
            })
            self.logger.error(err)
            raise nat.ToolExit from None

        self.logger.debug("Loading destinations")
        max_destinations_limit = self.limits.get("maximumDestinations", None)
        destinations_fm = time_exec(odcm.fieldMappings)(nax.OriginDestinationCostMatrixInputDataType.Destinations,
                                                        not self.ignore_loc_fields,
                                                        arcpy.ListFields(self.destinations))
        self.logger.debug("Destinations field map: %s", "; ".join([str(destinations_fm[fm]) for fm in destinations_fm]))
        try:
            time_exec(odcm.load)(nax.OriginDestinationCostMatrixInputDataType.Destinations, self.destinations,
                                 destinations_fm, True, max_destinations_limit)
        except nax.LimitError:
            self.logger.error("", extra={
                "message_ID": 30096,
                "add_argument1": "Destinations",
                "add_argument2": max_destinations_limit})
            raise nat.ToolExit from None
        except (nax.InputDataError, RuntimeError) as err:
            self.logger.error("", extra={
                "message_ID": 30251,
                "add_argument1": "Destinations",
            })
            self.logger.error(err)
            raise nat.ToolExit from None

        if self._is_valid(self.point_barriers):
            self.logger.debug("Loading point barriers")
            try:
                time_exec(odcm.load)(nax.OriginDestinationCostMatrixInputDataType.PointBarriers, self.point_barriers)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Point Barriers",
                })
                self.logger.error(err)
                raise nat.ToolExit from None
        if self._is_valid(self.line_barriers):
            self.logger.debug("Loading line barriers")
            try:
                time_exec(odcm.load)(nax.OriginDestinationCostMatrixInputDataType.LineBarriers, self.line_barriers)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Line Barriers",
                })
                self.logger.error(err)
                raise nat.ToolExit from None
        if self._is_valid(self.polygon_barriers):
            self.logger.debug("Loading polygon barriers")
            try:
                time_exec(odcm.load)(nax.OriginDestinationCostMatrixInputDataType.PolygonBarriers,
                                     self.polygon_barriers)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Polygon Barriers",
                })
                self.logger.error(err)
                raise nat.ToolExit from None

        input_counts = {}
        for input_type in nax.OriginDestinationCostMatrixInputDataType:
            input_counts[f"{input_type.name.replace('Point', '')}Count"] = odcm.count(input_type.value)
        nast.SERVER_PERF_METRICS["LoadLocations"] = input_counts

        # Perform checks that are dependent on straight line distance between inputs. The distance between the inputs
        # can be calculated only after loading all the inputs into solver objects.
        self.max_meters_amid_inputs = odcm._maxMetersBetweenInputs()  # As designed. pylint:disable=protected-access
        nast.SERVER_PERF_METRICS["GeodesicDistance"] = round(self.max_meters_amid_inputs, nast.PERF_METRICS_PRECISION)
        self._check_walking_limit()
        # Force hierarchy if required to
        if travel_mode.useHierarchy == "NO_HIERARCHY":
            if self._force_hierarchy():
                travel_mode_dict = json.loads(str(travel_mode))
                travel_mode_dict["useHierarchy"] = True
                travel_mode = self._travel_mode_from_json(json.dumps(travel_mode_dict))
                odcm.travelMode = travel_mode
        # Solve
        # constrain the search space for exact solves
        if travel_mode.useHierarchy == "NO_HIERARCHY":
            self._add_route_cutoff()
        with nast.PerfTimer("SolveTimeInSeconds"):
            result = time_exec(odcm.solve)()
        self.solver_result = result
        self.solve_succeeded = result.solveSucceeded
        self.log_solver_messages(result)
        if not self.solve_succeeded:
            raise nat.ToolExit

        odlines_extent = result.extent(nax.OriginDestinationCostMatrixOutputDataType.Lines)
        nast.SERVER_PERF_METRICS["BoundingBox"] = [
            round(odlines_extent.XMin, nast.PERF_METRICS_PRECISION),
            round(odlines_extent.YMin, nast.PERF_METRICS_PRECISION),
            round(odlines_extent.XMax, nast.PERF_METRICS_PRECISION),
            round(odlines_extent.YMax, nast.PERF_METRICS_PRECISION),
        ]
        try:
            odcm_tm = odcm.travelMode
            if odcm_tm.impedance == odcm_tm.timeAttributeName:
                cost_field = "Total_Time"
            elif odcm_tm.impedance == odcm_tm.distanceAttributeName:
                cost_field = "Total_Distance"
            else:
                cost_field = "Total_Other"
            with result.searchCursor(nax.OriginDestinationCostMatrixOutputDataType.Lines, cost_field) as cursor:
                nast.SERVER_PERF_METRICS["Impedances"] = [round(max({row[0] for row in cursor}),
                                                               nast.PERF_METRICS_PRECISION)]
        except Exception:  # Ok to skip in case we got incorrect Total_field. pylint:disable=broad-exception-caught
            self.logger.info("Error when reporting impedances", exc_info=True)

        with nast.PerfTimer("OutputTimeInSeconds"):
            # Export outputs
            # OD Lines
            self._check_max_output_features(nax.OriginDestinationCostMatrixOutputDataType.Lines, 30198)
            self.output_lines = os.path.join(self.output_gdb, self.output_names[0][1])
            self.logger.debug("Exporting output lines to '%s'", self.output_lines)
            time_exec(result.export)(nax.OriginDestinationCostMatrixOutputDataType.Lines, self.output_lines)
            # Origins
            self.output_origins = os.path.join(self.output_gdb, self.output_names[1][1])
            self.logger.debug("Exporting output origins to '%s'", self.output_origins)
            time_exec(result.export)(nax.OriginDestinationCostMatrixOutputDataType.Origins, self.output_origins)
            # Destinations
            self.output_destinations = os.path.join(self.output_gdb, self.output_names[2][1])
            self.logger.debug("Exporting output destinations to '%s'", self.output_destinations)
            time_exec(result.export)(nax.OriginDestinationCostMatrixOutputDataType.Destinations,
                                    self.output_destinations)
            # Layer file
            if self.save_layer_file:
                self.save_as_layer_file(result)
            # File based result
            if self.output_format != "Feature Set":
                export_datasets = dict.fromkeys((self.output_lines, self.output_origins, self.output_destinations),
                                                "FEATURECLASS")
                self.output_result_file = self.create_result_file(export_datasets, self.output_format)

    @time_exec
    def _generate_odcm_svc(self):
        """Generate OD cost matrix using a geoprocessing service."""
        # Copy input feature sets as they can be referencing a URL which might not be accessible to the remote service
        # Not copying attribute parameter values as it is rare that someone will pass attribute parameter values from
        # a URL
        origins = self._copy_features(self.origins, check_validity=False)
        destinations = self._copy_features(self.destinations, check_validity=False)
        point_barriers = self._copy_features(self.point_barriers)
        line_barriers = self._copy_features(self.line_barriers)
        polygon_barriers = self._copy_features(self.polygon_barriers)
        task_params = [origins, destinations, self.kwargs["Travel_Mode"], self.time_units,
                       self.distance_units, "#", self.kwargs["Number_of_Destinations_to_Find"], self.kwargs["Cutoff"],
                       self.time_of_day, self.kwargs["Time_Zone_for_Time_of_Day"], point_barriers, line_barriers,
                       polygon_barriers, self.uturn_at_junctions, self.use_hierarchy, self.restrictions,
                       self.attribute_parameter_values, self.impedance, self.kwargs["Origin_Destination_Line_Shape"],
                       self.save_layer_file, self.overrides, self.time_impedance, self.distance_impedance,
                       self.output_format, self.ignore_invalid_locations, self.locate_settings]
        try:
            result = self._call_remote_tool(task_params, 15)
        except Exception:  # Raise known error for unexpected remote tool failure. pylint:disable=broad-except
            self.logger.info("Failed to execute remote tool '%s'", self.remote_svc_name)
            self.logger.info("Exception details:", exc_info=True)
            self.logger.error("", extra={"message_ID": 30295})
            raise nat.ToolExit from None
        if result.maxSeverity == 2:
            self.solve_succeeded = False
            raise nat.ToolExit
        # Save the results
        solve_status = result.getOutput(0)
        if solve_status.lower() == 'true':
            self.solve_succeeded = True
        self.output_lines = os.path.join(self.output_gdb, self.output_names[0][1])
        self.output_origins = os.path.join(self.output_gdb, self.output_names[1][1])
        self.output_destinations = os.path.join(self.output_gdb, self.output_names[2][1])
        arcpy.management.CopyFeatures(result.getOutput(1), self.output_lines)
        arcpy.management.CopyFeatures(result.getOutput(2), self.output_origins)
        arcpy.management.CopyFeatures(result.getOutput(3), self.output_destinations)
        self.output_layer_file = result.getOutput(4)
        self.output_result_file = result.getOutput(5)
        # Remote service may not support newly added output parameters at 10.9
        if result.outputCount >= 7:
            self.output_layer_package = result.getOutput(6)

    @time_exec
    def _validate(self):
        """Raise a termination exception if a validation check fails.

        Raises:
            ToolExit for a failed validation check.

        """
        super()._validate()

        if self.default_cutoff is not None and self.default_cutoff <= 0:
            self.logger.error("", extra={"message_ID": 30112, "add_argument1": "Cutoff"})
            raise nat.ToolExit

        if self.destination_count is not None and self.destination_count <= 0:
            self.logger.error("", extra={"message_ID": 30112, "add_argument1": "Number_of_Destinations_to_Find"})
            raise nat.ToolExit

    def _check_limits(self):
        """Check if any of the limits are exceeded."""
        self._check_barrier_limits()

    @time_exec
    def _report_usage(self):
        """Add usage metering and royalty messages used to deduct credits in AGOL."""
        # For ODCostMatrix, numObjects is the number of origins located on network times the number of destinations
        # located on network
        located_where_clause = "Status IN (0, 7)"
        valid_origins = self.get_count(self.output_origins, located_where_clause)
        valid_destinations = self.get_count(self.output_destinations, located_where_clause)
        num_objects = valid_origins * valid_destinations
        self.logger.debug("Usage report")
        self.logger.debug("Valid Origins: %s", valid_origins)
        self.logger.debug("Valid Destinations: %s", valid_destinations)
        self.logger.debug("Num Objects: %s", num_objects)
        metering_task_name = self.__class__.__name__
        nast.SERVER_PERF_METRICS["NumObjects"] = num_objects
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
                "credits": self._usage_credits(num_objects)
            }
            self.usage_cost = json.dumps(usage_cost)

    def execute(self):
        """Tool execution logic."""
        self._validate()
        self._check_limits()
        self._generate_odcm()
        self._report_usage()
        # When returning a results file, set all other feature outputs to empty so that GPServer will not serailize
        # them to .dat files.
        if self.output_format != "Feature Set":
            self.output_origins = ""
            self.output_destinations = ""
            self.output_lines = ""


class ToolValidator(nast.ToolValidator):
    """Class for validating parameter values and controlling the behavior of the tool's dialog."""

    def __init__(self):
        """Initialize required things."""
        super().__init__()
        self.tool_name = "GenerateOriginDestinationCostMatrix"
        self.nds_param = self.params[2]
        self.nds_extents_param = self.params[3]
        self.analysis_region_param = self.params[7]
        self.uturn_param = self.params[15]
        self.hiearchy_param = self.params[16]
        self.restrictions_param = self.params[17]
        self.attr_params_param = self.params[18]
        self.impedance_param = self.params[19]
        self.overrides_param = self.params[22]
        self.time_impedance_param = self.params[23]
        self.distance_impedance_param = self.params[24]
        self.accumulate_attrs_param = self.params[26]
        self.locate_settings_param = self.params[32]
