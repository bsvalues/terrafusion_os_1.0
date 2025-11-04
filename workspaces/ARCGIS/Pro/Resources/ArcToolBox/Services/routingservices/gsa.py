"""Provides validation and execution logic for Generate Service Areas tool."""

import logging
import locale
import os
import json

import arcpy
from arcpy.na import _na as nax
import nat
import nast
from nast import time_exec


class GenerateServiceAreas(nast.NASolverTool):
    """Provides execution logic for Generate Service Areas tool."""

    # Define instance attributes in slots primarily for faster attribute lookups
    __slots__ = ("facilities", "break_values", "travel_direction", "time_of_day", "time_zone", "geometry_at_overlap",
                 "geometry_at_cutoff", "polygon_detail", "detailed_polygons", "polygon_buff_dist",
                 "polygon_buff_dist_units", "exclude_sources", "output_polygons", "output_lines", "output_facilities",
                 "output_type", "max_break_value", "max_break_count")

    OVERLAP_GEOM = {
        "Not Overlapping": 0,
        "Overlapping": 1,
        "Merge by Break Value": 2
    }
    CUTOFF_GEOM = {
        "Disks": 0,
        "Rings": 1,
    }

    TRAVEL_DIR = {
        "Away From Facility": 0,
        "Towards Facility": 1,
    }
    OUTPUT_TYPE = {
        "Polygons": 0,
        "Lines": 1,
        "Polygons and lines": 2,
    }
    # Max number of vertices in the output polygons when the service is called from REST
    MAX_VERTEX_COUNT = 8000000

    def __init__(self, **kwargs):
        """Store names used in all methods."""
        super().__init__()
        # print parameter values when debugging
        if self.logger.level == logging.DEBUG:
            for param_name, param_value in kwargs.items():
                self.logger.debug("%s: %s, %s", param_name, type(param_value), param_value)

        self.extent_fields[-1] = "GPServiceAreaService"  # field name used to store remote service conn info
        # Store tool parameter values as instance names.
        self.kwargs = kwargs
        self.facilities = kwargs["Facilities"]
        self.break_values = self._parse_break_values(kwargs["Break_Values"])
        self.measurement_unit = kwargs["Break_Units"].replace(" ", "")
        self.network_datasets = self.strip_quotes(kwargs["Network_Datasets"]).split(";")
        self.nd_extents = kwargs["Network_Dataset_Extents"]
        self.analysis_region = kwargs["Analysis_Region"]
        try:
            self.select_network_dataset([self.facilities])
        except ValueError:
            self.logger.error("", extra={"message_ID": 30117})
            raise nat.ToolExit from None
        self.travel_direction = self.TRAVEL_DIR[kwargs["Travel_Direction"]]
        self.time_of_day = kwargs["Time_of_Day"]
        self.time_zone = self.TIME_ZONE[kwargs["Time_Zone_for_Time_of_Day"]]
        self.travel_mode = kwargs["Travel_Mode"]
        self.use_hierarchy = kwargs["Use_Hierarchy"]
        self.uturn_at_junctions = kwargs["Uturn_at_Junctions"]
        self.geometry_at_overlap = self.OVERLAP_GEOM[kwargs["Polygons_for_Multiple_Facilities"]]
        self.geometry_at_cutoff = self.CUTOFF_GEOM[kwargs["Polygon_Overlap_Type"]]
        self.detailed_polygons = kwargs["Detailed_Polygons"]
        self.polygon_detail = kwargs["Polygon_Detail"]
        poly_trim_dist_value = kwargs["Polygon_Trim_Distance"]
        if not poly_trim_dist_value:
            poly_trim_dist_value = "0 Meters"
        self.polygon_buff_dist, self.polygon_buff_dist_units = poly_trim_dist_value.split(" ")
        self.polygon_buff_dist = locale.atof(self.polygon_buff_dist)
        simp_tol_value = kwargs["Polygon_Simplification_Tolerance"]
        if not simp_tol_value:
            simp_tol_value = "0 Meters"
        self.simp_tol, self.simp_tol_unit = simp_tol_value.split(" ")
        self.simp_tol = locale.atof(self.simp_tol)
        self.restrictions = kwargs["Restrictions"]
        self.save_layer_file = kwargs["Save_Output_Network_Analysis_Layer"]
        self.attribute_parameter_values = kwargs["Attribute_Parameter_Values"]
        self.overrides = self._solver_perf_overrides(kwargs["Overrides"])
        self.exclude_sources = kwargs["Exclude_Sources_from_Polygon_Generation"]
        self.accumulate_attributes = kwargs["Accumulate_Attributes"]
        self.impedance = kwargs["Impedance"]
        self.time_impedance = kwargs["Time_Impedance"]
        self.distance_impedance = kwargs["Distance_Impedance"]
        self.output_type = self.OUTPUT_TYPE[kwargs["Output_Type"]]
        self.output_format = kwargs["Output_Format"]
        self.output_gdb = kwargs["Output_Geodatabase"]
        self.output_names = self.read_value_table(kwargs["Output_Names"])
        self.point_barriers = kwargs["Point_Barriers"]
        self.line_barriers = kwargs["Line_Barriers"]
        self.polygon_barriers = kwargs["Polygon_Barriers"]
        self.ignore_loc_fields = kwargs["Ignore_Network_Location_Fields"]
        self.limits = self._get_analysis_limits(kwargs["Analysis_Limits"])
        self.ignore_invalid_locations = kwargs["Ignore_Invalid_Locations"]
        self.locate_settings = kwargs["Locate_Settings"]

        # Other instance attributes
        if not self.conn_file:  # Remote network datasets cannot be described
            self.nds_info = nast.NDSInfo(self.network_dataset)  # Proxy for network dataset describe
        self.max_break_value = None  # Maximum break value between default cutoffs and per facility cutoffs
        self.max_break_count = None  # Maximum number of breaks between default cutoffs and per facility cutoffs

        # Determine measurement type to evaluate if break units are time based, distance based or other.
        if self.measurement_unit in nax.TimeUnits.__members__:
            self.measurement_type = "TIME"
        elif self.measurement_unit in nax.DistanceUnits.__members__:
            self.measurement_type = "DISTANCE"
        else:
            self.measurement_type = "OTHER"

        # Outputs created by the tool
        self.output_polygons = ""
        self.output_lines = ""
        self.output_facilities = ""
        self.output_layer_file = ""
        self.output_result_file = ""
        self.solve_succeeded = False
        self.usage_cost = json.dumps({
            "numObjects": 0,
            "credits": 0
        })

    @time_exec
    def _generate_service_areas(self):
        """Create service areas using solver objects."""
        if self.conn_file:
            self._generate_service_areas_svc()
            return
        # Create service area analysis object
        try:
            service_area = time_exec(nax.ServiceArea)(self.network_dataset)
        except ValueError as ex:
            self.logger.error(ex)
            raise nat.ToolExit
        self.solver_object = service_area  # for cleanup at exit

        force_hierarchy = False  # Used to create generalized polygons if hierarchy is forced
        # Set analysis settings
        travel_mode = time_exec(self.get_travel_mode)()
        self._check_max_break_value()  # Some limits depend on whether the travel mode is for walking
        # Check if we need to enforce hierarchy irrespective of the travel mode settings for useHierarchy since in
        # Pro, we do not rely on travel mode's useHierarchy to generate generalized (hierarchical) polygons
        if self._force_hierarchy():
            force_hierarchy = True
            travel_mode_dict = json.loads(str(travel_mode))
            travel_mode_dict["useHierarchy"] = True
            travel_mode = self._travel_mode_from_json(json.dumps(travel_mode_dict))
        try:
            service_area.travelMode = travel_mode
        except ValueError as err:
            self.logger.error("", extra={
                "message_ID": 30232,
                "add_argument1": str(travel_mode),
                })
            self.logger.error(err)
            raise nat.ToolExit from None
        service_area.defaultImpedanceCutoffs = self.break_values
        all_costs = self.nds_info.costs["allCosts"]
        if self.measurement_type == "TIME":
            service_area.timeUnits = nax.TimeUnits[self.measurement_unit]
            distance_unit = all_costs[travel_mode.distanceAttributeName].units
            service_area.distanceUnits = nax.DistanceUnits[distance_unit]
        elif self.measurement_type == "DISTANCE":
            service_area.distanceUnits = nax.DistanceUnits[self.measurement_unit]
            time_unit = all_costs[travel_mode.timeAttributeName].units
            service_area.timeUnits = nax.TimeUnits[time_unit]
        else:
            time_unit = all_costs[travel_mode.timeAttributeName].units
            service_area.timeUnits = nax.TimeUnits[time_unit]
            distance_unit = all_costs[travel_mode.distanceAttributeName].units
            service_area.distanceUnits = nax.DistanceUnits[distance_unit]

        if self.accumulate_attributes:
            service_area.accumulateAttributeNames = self.get_valid_accumulate_attributes()

        service_area.travelDirection = self.travel_direction
        service_area.timeOfDay = self.time_of_day
        service_area.timeZone = self.time_zone
        service_area.geometryAtOverlap = self.geometry_at_overlap
        service_area.geometryAtCutoff = self.geometry_at_cutoff
        service_area.outputType = self.output_type
        # Set polygon detail based on travel_mode, use_hierarchy, detailed_polygons and polygon_detail parameters
        if self.is_custom_travel_mode and self.use_hierarchy:
            if self.detailed_polygons:
                self.logger.error("", extra={"message_ID": 30097, "add_argument1": "Detailed_Polygons"})
                raise nat.ToolExit
            # Create generalized polygons if use hierarchy is true and using a custom travel mode
            service_area.polygonDetail = nax.ServiceAreaPolygonDetail.Generalized
        elif self.detailed_polygons:  # Create high precision polygons if detailed polygons is true
            service_area.polygonDetail = nax.ServiceAreaPolygonDetail.High
        else:
            service_area.polygonDetail = nax.ServiceAreaPolygonDetail[self.polygon_detail]

        # Create generalized polygons if hierarchy is forced
        if force_hierarchy:
            service_area.polygonDetail = nax.ServiceAreaPolygonDetail.Generalized

        service_area.polygonBufferDistance = self.polygon_buff_dist
        service_area.polygonBufferDistanceUnits = nax.DistanceUnits[self.polygon_buff_dist_units]
        service_area.overrides = self.overrides
        service_area.excludeSourcesFromPolygonGeneration = self.exclude_sources
        service_area.ignoreInvalidLocations = self.ignore_invalid_locations
        self._apply_locate_settings()
        self.logger.debug("Solver object properties")
        self.log_prop_values(service_area)

        # Load input data
        self.logger.debug("Loading facilities")
        max_facilities_limit = self.limits.get("maximumFacilities", None)
        fac_fm = time_exec(service_area.fieldMappings)(nax.ServiceAreaInputDataType.Facilities,
                                                       not self.ignore_loc_fields,
                                                       arcpy.ListFields(self.facilities))
        self.logger.debug("Facilities field map: %s", "; ".join([str(fac_fm[fm]) for fm in fac_fm]))
        try:
            time_exec(service_area.load)(nax.ServiceAreaInputDataType.Facilities, self.facilities, fac_fm, True,
                                         max_facilities_limit)
        except nax.LimitError:
            self.logger.error("", extra={
                "message_ID": 30096,
                "add_argument1": "Facilities",
                "add_argument2": max_facilities_limit})
            raise nat.ToolExit from None
        except (nax.InputDataError, RuntimeError) as err:
            self.logger.error("", extra={
                "message_ID": 30251,
                "add_argument1": "Facilities",
            })
            self.logger.error(err)
            raise nat.ToolExit from None

        if self._is_valid(self.point_barriers):
            self.logger.debug("Loading point barriers")
            try:
                time_exec(service_area.load)(nax.ServiceAreaInputDataType.PointBarriers, self.point_barriers)
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
                time_exec(service_area.load)(nax.ServiceAreaInputDataType.LineBarriers, self.line_barriers)
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
                time_exec(service_area.load)(nax.ServiceAreaInputDataType.PolygonBarriers, self.polygon_barriers)
            except (nax.InputDataError, RuntimeError) as err:
                self.logger.error("", extra={
                    "message_ID": 30251,
                    "add_argument1": "Polygon Barriers",
                })
                self.logger.error(err)
                raise nat.ToolExit from None

        input_counts = {}
        for input_type in nax.ServiceAreaInputDataType:
            input_counts[f"{input_type.name.replace('Point', '')}Count"] = service_area.count(input_type.value)
        nast.SERVER_PERF_METRICS["LoadLocations"] = input_counts
        distance_btw_inputs = service_area._maxMetersBetweenInputs()  # As D pylint:disable=protected-access
        nast.SERVER_PERF_METRICS["GeodesicDistance"] = round(distance_btw_inputs, nast.PERF_METRICS_PRECISION)

        # Solve
        with nast.PerfTimer("SolveTimeInSeconds"):
            result = time_exec(service_area.solve)()
        self.solver_result = result
        self.solve_succeeded = result.solveSucceeded
        self.log_solver_messages(result)
        if not self.solve_succeeded:
            raise nat.ToolExit

        facilities_extent = result.extent(nax.ServiceAreaInputDataType.Facilities)
        nast.SERVER_PERF_METRICS["BoundingBox"] = [
            round(facilities_extent.XMin, nast.PERF_METRICS_PRECISION),
            round(facilities_extent.YMin, nast.PERF_METRICS_PRECISION),
            round(facilities_extent.XMax, nast.PERF_METRICS_PRECISION),
            round(facilities_extent.YMax, nast.PERF_METRICS_PRECISION),
        ]

        with nast.PerfTimer("OutputTimeInSeconds"):
            # Export outputs
            # Facilities
            self.output_facilities = os.path.join(self.output_gdb, self.output_names[2][1])
            self.logger.debug("Exporting service area facilities to '%s'", self.output_facilities)
            time_exec(result.export)(nax.ServiceAreaOutputDataType.Facilities, self.output_facilities)
            # Polygons
            if self.output_type == nax.ServiceAreaOutputType.Polygons:
                self._check_max_output_features(nax.ServiceAreaOutputDataType.Polygons, 30144)
                self.output_polygons = os.path.join(self.output_gdb, self.output_names[0][1])
                self.logger.debug("Exporting service area polygons to '%s'", self.output_polygons)
                time_exec(result.export)(nax.ServiceAreaOutputDataType.Polygons, self.output_polygons)
            # Lines
            elif self.output_type == nax.ServiceAreaOutputType.Lines:
                self._check_max_output_features(nax.ServiceAreaOutputDataType.Lines, 30223)
                self.output_lines = os.path.join(self.output_gdb, self.output_names[1][1])
                self.logger.debug("Exporting service area lines to '%s'", self.output_lines)
                time_exec(result.export)(nax.ServiceAreaOutputDataType.Lines, self.output_lines)
            # Polygon and lines
            else:
                self._check_max_output_features(nax.ServiceAreaOutputDataType.Polygons, 30144)
                self._check_max_output_features(nax.ServiceAreaOutputDataType.Lines, 30223)
                self.output_polygons = os.path.join(self.output_gdb, self.output_names[0][1])
                self.logger.debug("Exporting service area polygons to '%s'", self.output_polygons)
                time_exec(result.export)(nax.ServiceAreaOutputDataType.Polygons, self.output_polygons)
                self.output_lines = os.path.join(self.output_gdb, self.output_names[1][1])
                self.logger.debug("Exporting service area lines to '%s'", self.output_lines)
                time_exec(result.export)(nax.ServiceAreaOutputDataType.Lines, self.output_lines)
            # Layer file
            if self.save_layer_file:
                self.save_as_layer_file(result)
            # File based result
            if self.output_format != "Feature Set":
                export_datasets = dict.fromkeys((self.output_polygons, self.output_lines, self.output_facilities),
                                                "FEATURECLASS")
                self.output_result_file = self.create_result_file(export_datasets, self.output_format)

    @time_exec
    def _generate_service_areas_svc(self):
        """Generate service areas using a geoprocessing service."""
        # Copy input feature sets as they can be referencing a URL which might not be accessible to the remote service
        # Not copying attribute parameter values as it is rare that someone will pass attribute parameter values from
        # a URL
        facilities = self._copy_features(self.facilities, check_validity=False)
        point_barriers = self._copy_features(self.point_barriers)
        line_barriers = self._copy_features(self.line_barriers)
        polygon_barriers = self._copy_features(self.polygon_barriers)
        task_params = [facilities, self.kwargs["Break_Values"], self.measurement_unit, "#",
                       self.kwargs["Travel_Direction"], self.time_of_day, self.use_hierarchy, self.uturn_at_junctions,
                       self.kwargs["Polygons_for_Multiple_Facilities"], self.kwargs["Polygon_Overlap_Type"],
                       self.detailed_polygons, self.kwargs["Polygon_Trim_Distance"],
                       self.kwargs["Polygon_Simplification_Tolerance"], point_barriers, line_barriers, polygon_barriers,
                       self.restrictions, self.attribute_parameter_values, self.kwargs["Time_Zone_for_Time_of_Day"],
                       self.kwargs["Travel_Mode"], self.impedance, self.save_layer_file, self.overrides,
                       self.time_impedance, self.distance_impedance, self.polygon_detail, self.kwargs["Output_Type"],
                       self.output_format, self.ignore_invalid_locations, self.locate_settings]
        try:
            result = self._call_remote_tool(task_params, 16)
        except Exception:  # Raise known error for unexpected remote tool failure. pylint:disable=broad-except
            self.logger.info("Failed to execute remote tool '%s'", self.remote_svc_name)
            self.logger.info("Exception details:", exc_info=True)
            self.logger.error("", extra={"message_ID": 30295})
            raise nat.ToolExit from None
        if result.maxSeverity == 2:
            self.solve_succeeded = False
            raise nat.ToolExit
        # Save the results
        solve_status = result.getOutput(1)
        if solve_status.lower() == 'true':
            self.solve_succeeded = True
        # Facilities
        self.output_facilities = os.path.join(self.output_gdb, self.output_names[2][1])
        arcpy.management.CopyFeatures(result.getOutput(3), self.output_facilities)
        # Polygons
        if self.output_type in (nax.ServiceAreaOutputType.Polygons, nax.ServiceAreaOutputType.PolygonsAndLines):
            self.output_polygons = os.path.join(self.output_gdb, self.output_names[0][1])
            arcpy.management.CopyFeatures(result.getOutput(0), self.output_polygons)
        # Lines
        if self.output_type in (nax.ServiceAreaOutputType.Lines, nax.ServiceAreaOutputType.PolygonsAndLines):
            self.output_lines = os.path.join(self.output_gdb, self.output_names[1][1])
            arcpy.management.CopyFeatures(result.getOutput(4), self.output_lines)
        # Network analysis layer
        self.output_layer_file = result.getOutput(2)
        # File based result
        self.output_result_file = result.getOutput(5)
        # Remote service may not support newly added output parameters at 10.9
        if result.outputCount >= 7:
            self.output_layer_package = result.getOutput(6)

    @time_exec
    def _check_max_break_value(self):
        """Raise a terminating error if maximum break value is not within the limits."""
        # No max break limit check for other units.
        if self.measurement_type not in ("TIME", "DISTANCE"):
            return
        # pylint:disable=line-too-long
        limits = {
            "TIME": (
                ("maximumBreakTimeValue", "maximumBreakTimeValueUnits", 30122),
                ("maximumBreakTimeValueDetailedPolygons", "maximumBreakTimeValueUnitsDetailedPolygons", 30136),
                ("maximumBreakTimeValueServiceAreaLines", "maximumBreakTimeValueUnitsServiceAreaLines", 30227),
                ("maximumBreakWalkingTimeValue", "maximumBreakWalkingTimeValueUnits", 30225),
                ("maximumBreakWalkingTimeValueServiceAreaLines", "maximumWBreakWalkingTimeValueUnitsServiceAreaLines", 30228),  # noqa
                ("maximumBreakWalkingTimeValueDetailedPolygons", "maximumBreakWalkingTimeValueUnitsDetailedPolygons", 30229),  # noqa
            ),
            "DISTANCE": (
                ("maximumBreakDistanceValue", "maximumBreakDistanceValueUnits", 30123),
                ("maximumBreakDistanceValueDetailedPolygons", "maximumBreakDistanceValueUnitsDetailedPolygons", 30136),
                ("maximumBreakDistanceValueServiceAreaLines", "maximumBreakDistanceValueUnitsServiceAreaLines", 30227),
                ("maximumBreakWalkingDistanceValue", "maximumBreakWalkingDistanceValueUnits", 30226),
                ("maximumBreakWalkingDistanceValueServiceAreaLines", "maximumBreakWalkingDistanceValueUnitsServiceAreaLines", 30228),  # noqa
                ("maximumBreakWalkingDistanceValueDetailedPolygons", "maximumBreakWalkingDistanceValueUnitsDetailedPolygons", 30229),  # noqa
            )
        }
        # pylint:enable=line-too-long
        for limit_name, unit_name, error_code in limits[self.measurement_type]:
            # Skip limit check when not applicable
            if "DetailedPolygons" in limit_name:
                if not self.detailed_polygons:
                    if self.polygon_detail != "High":
                        continue
            if "ServiceAreaLines" in limit_name:
                if self.output_type == nax.ServiceAreaOutputType.Polygons:
                    continue
            if "Walking" in limit_name:
                if not self.is_walking_mode:
                    continue
            if self.is_walking_mode:
                if "Walking" not in limit_name:
                    continue
            max_break_limit = self.limits.get(limit_name, None)
            max_break_limit_unit = self.limits.get(unit_name, "Minutes" if "Time" in unit_name else "Miles")
            if max_break_limit is None:
                continue
            if self.measurement_unit != max_break_limit_unit:
                # Convert max_break_limit to measurment_unit
                max_break_limit = nast.NASolverTool.convert_value(max_break_limit, max_break_limit_unit,
                                                                  self.measurement_unit)
            if self.max_break_value > max_break_limit:
                self.logger.error("", extra={
                    "message_ID": error_code,
                    "add_argument1": self.max_break_value,
                    "add_argument2": f"{max_break_limit:.3f} {self.measurement_unit}"})
                raise nat.ToolExit

    @time_exec
    def _force_hierarchy(self):  # service area forces hierarchy based on break values. pylint:disable=arguments-differ
        """Check if hierarchy needs to be forced based on break values.

        Returns:
            True if hierarchy is to be enforced.

        """
        limit_name = ""
        if self.measurement_type == "TIME":
            limit_name = "forceHierarchyBeyondBreakTimeValue"
            force_hier_limit = self.limits.get(limit_name, None)
            force_hier_limit_unit = self.limits.get("forceHierarchyBeyondBreakTimeValueUnits", "Minutes")
        elif self.measurement_type == "DISTANCE":
            limit_name = "forceHierarchyBeyondBreakDistanceValue"
            force_hier_limit = self.limits.get(limit_name, None)
            force_hier_limit_unit = self.limits.get("forceHierarchyBeyondBreakDistanceValueUnits", "Miles")
        else:
            # No force hierarchy limit check for other units.
            return False
        if force_hier_limit is None:
            return False
        if self.polygon_detail == "Generalized":
            return False
        if self.measurement_unit != force_hier_limit_unit:
            # Convert force_hier_limit to measurment_unit
            force_hier_limit = nast.NASolverTool.convert_value(force_hier_limit, force_hier_limit_unit,
                                                               self.measurement_unit)
        if self.max_break_value > force_hier_limit:
            # Do not force hierarchy if the network dataset does not support hierarchy
            if self.nds_info.hierarchy_attribute is None:
                self.logger.warning("", extra={
                    "message_ID": 30119,
                    "add_argument1": f"{limit_name} limit"
                })
                return False
            # Do not force hierarchy when walking
            if self.is_walking_mode:
                return False
            self.logger.warning("", extra={"message_ID": 30109})
            self.logger.warning("", extra={
                "message_ID": 30120,
                "add_argument1": self.max_break_value,
                "add_argument2": f"{force_hier_limit:.3f} {self.measurement_unit}"})
            return True
        return False

    @time_exec
    def _validate(self):
        """Raise a termination exception if a validation check fails.

        Raises:
            ToolExit for a failed validation check.

        """
        super()._validate()
        if self.polygon_buff_dist <= 0:
            self.logger.error("", extra={"message_ID": 30112, "add_argument1": "Polygon_Trim_Distance"})
            raise nat.ToolExit

        if self.simp_tol < 0:
            self.logger.error("", extra={"message_ID": 30111, "add_argument1": "Polygon_Simplification_Tolerance"})
            raise nat.ToolExit

    def _parse_break_values(self, break_values):
        """Convert break values from a space separated string to a list of float values.

        Args:
            break_values: A space separated string of break values.
        Returns:
            A list of float break values.
        Raises:
            ToolExit exception is break values are empty, are not all numeric or if any value is not greater than zero.

        """
        breaks = []
        # sep = ";" if break_values.find(";") != -1 else " "
        sep = " "

        for val in break_values.split(sep):
            if val:
                try:
                    val = locale.atof(val)
                except ValueError:
                    self.logger.error("", extra={"message_ID": 30118})
                    raise nat.ToolExit from None
                if val <= 0:
                    self.logger.error("", extra={"message_ID": 30049})
                    raise nat.ToolExit
                breaks.append(val)
        if not breaks:
            self.logger.error("", extra={"message_ID": 30117})
            raise nat.ToolExit
        return breaks

    @time_exec
    def _parse_per_facility_breaks(self):
        """Parse per facility breaks.

        Populate self.max_break_value and self.max_break_count based on default breaks or per facility breaks.
        """
        max_break_values = []
        break_counts = []
        use_default_breaks = False
        facility_count = 0
        facility_with_break_count = 0  # count of facilities that have per facility breaks defined on them
        try:
            with arcpy.da.SearchCursor(self.facilities, "Breaks") as cursor:  # False positive. pylint:disable=no-member
                for row in cursor:
                    facility_count += 1
                    break_values = row[-1]
                    if break_values:
                        facility_with_break_count += 1
                        break_values = self._parse_break_values(break_values)
                    else:
                        break_values = self.break_values
                    max_break_values.append(max(break_values))
                    break_counts.append(len(break_values))
        except RuntimeError:
            # need to use default breaks if cursor cannot be created
            self.max_break_value = max(self.break_values)
            self.max_break_count = len(self.break_values)
            return
        # Use default breaks in case we do not have any facilities or no facilities define per facility breaks
        if facility_count == 0 or facility_with_break_count == 0:
            use_default_breaks = True
        if use_default_breaks:
            self.max_break_value = max(self.break_values)
            self.max_break_count = len(self.break_values)
        else:
            self.max_break_value = max(max_break_values)
            self.max_break_count = max(break_counts)

    def _check_limits(self):
        """Check if any of the limits that apply to both and time and distance based analysis are exceeded."""
        self._parse_per_facility_breaks()
        max_break_count_limit = self.limits.get("maximumNumberOfBreaks", None)
        if max_break_count_limit:
            if self.max_break_count > max_break_count_limit:
                self.logger.error("", extra={
                    "message_ID": 30121,
                    "add_argument1": self.max_break_count,
                    "add_argument2": max_break_count_limit,
                })
                raise nat.ToolExit
        # Polygon trim distance
        max_polygon_trim_distance = self.limits.get("maximumPolygonTrimDistance", None)
        if max_polygon_trim_distance:
            max_polygon_trim_distance_unit = self.limits.get("maximumPolygonTrimDistanceUnits", "Meters")
            max_polygon_trim_distance = self.convert_value(max_polygon_trim_distance, max_polygon_trim_distance_unit,
                                                           self.polygon_buff_dist_units)
            if self.polygon_buff_dist > max_polygon_trim_distance:
                self.logger.error("", extra={
                    "message_ID": 30230,
                    "add_argument1": f"{max_polygon_trim_distance} {self.polygon_buff_dist_units}",
                })
                raise nat.ToolExit

        self._check_barrier_limits()

    def _check_result_limits(self):
        """Perform checks on the outputs such as max vertex limit check.

        These checks are performed before calling _report_usage()

        """
        # If we are returning a results file, we don't have to worry about maximum vertices returned from the service.
        if self.output_format != "Feature Set":
            return
        # Check result size when called from REST since a REST request can fail when serializing large outputs
        if self.output_polygons:
            self._check_vertex_count(self.output_polygons)
        if self.output_lines:
            self._check_vertex_count(self.output_lines)

    @time_exec
    def _report_usage(self):
        """Add usage metering and royalty messages used to deduct credits in AGOL."""
        valid_facility_count = 0
        num_objects = 0
        default_break_count = len(self.break_values)
        with arcpy.da.SearchCursor(self.output_facilities,  # False positive. pylint:disable=no-member
                                   ("OID@", "Breaks"),
                                   "Status IN (0, 7)") as cursor:
            for row in cursor:
                valid_facility_count += 1
                if row[1] is None:
                    num_objects += default_break_count
                else:
                    num_objects += len(self._parse_break_values(row[1]))
        self.logger.debug("Usage report")
        self.logger.debug("Valid facility count: %s", valid_facility_count)
        self.logger.debug("Num Objects: %s", num_objects)
        metering_task_name = self.__class__.__name__
        nast.SERVER_PERF_METRICS["NumObjects"] = num_objects
        if num_objects:
            # As designed. pylint:disable=protected-access
            # Check for meterSingleBreakPerFacility solver override
            if self.overrides:
                override_name = "MeterSingleBreakPerFacility"
                overrides_dict = json.loads(self.overrides)
                override_value = bool(int(overrides_dict.get(override_name, 0)))
                if override_value:
                    arcpy.gp._arc_object.LogUsageMetering(7777, override_name, num_objects)
                    num_objects = valid_facility_count
                    self.logger.debug("Effective Num Objects: %s", num_objects)
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
        self._generate_service_areas()
        self._check_result_limits()
        self._report_usage()
        # When returning a results file, set all other feature outputs to empty so that GPServer will not serailize
        # them to .dat files.
        if self.output_format != "Feature Set":
            self.output_polygons = ""
            self.output_lines = ""
            self.output_facilities = ""


class ToolValidator(nast.ToolValidator):
    """Class for validating parameter values and controlling the behavior of the tool's dialog."""

    def __init__(self):
        """Initialize required things."""
        # Determine if running in a server context so that we can skip certain methods
        super().__init__()
        self.tool_name = "GenerateServiceAreas"
        self.measurement_unit_param = self.params[2]
        self.nds_param = self.params[3]
        self.nds_extents_param = self.params[4]
        self.analysis_region_param = self.params[5]
        self.hiearchy_param = self.params[8]
        self.uturn_param = self.params[9]
        self.simp_tol_param = self.params[14]
        self.restrictions_param = self.params[18]
        self.attr_params_param = self.params[19]
        self.impedance_param = self.params[22]
        self.overrides_param = self.params[24]
        self.time_impedance_param = self.params[25]
        self.distance_impedance_param = self.params[26]
        self.exclude_sources_param = self.params[30]
        self.accumulate_attrs_param = self.params[31]
        self.locate_settings_param = self.params[37]
