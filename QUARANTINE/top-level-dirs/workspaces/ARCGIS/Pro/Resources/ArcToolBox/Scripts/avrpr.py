"""Provides Validation and Execution logic for Add Vehicle Routing Problem Routes tool."""
import datetime
import arcpy
import nat
import logging

# Initialize the logger used by this module
LOGGER = logging.getLogger(__name__)

DEFAULT_MAX_ORDER_COUNT = 30


class AddVehicleRoutingProblemRoutes():
    """Provides execution logic for Add Vehicle Routing Problem Routes tool."""

    def __init__(self, in_vrp_layer, number_of_routes, route_name_prefix, start_depot_name, end_depot_name,
                 earliest_start_time, latest_start_time, max_order_count, capacities, route_constraints, costs,
                 additional_route_time, append_to_existing_routes, date_and_time):
        """Store tool parameter values as instance names."""
        self.param_info = arcpy.GetParameterInfo("AddVehicleRoutingProblemRoutes")
        self.in_vrp_layer = in_vrp_layer
        self.number_of_routes = number_of_routes
        self.route_name_prefix = route_name_prefix
        self.start_depot_name = start_depot_name
        self.end_depot_name = end_depot_name
        self.max_order_count = max_order_count

        if self.start_depot_name == '':
            self.start_depot_name = None
        if self.end_depot_name == '':
            self.end_depot_name = None

        if capacities.rowCount == 0:
            self.capacity_1 = None
            self.capacity_2 = None
            self.capacity_3 = None
            self.capacity_4 = None
            self.capacity_5 = None
            self.capacity_6 = None
            self.capacity_7 = None
            self.capacity_8 = None
            self.capacity_9 = None
        else:
            self.capacity_1 = capacities.getTrueValue(0, 0)
            self.capacity_2 = capacities.getTrueValue(0, 1)
            self.capacity_3 = capacities.getTrueValue(0, 2)
            self.capacity_4 = capacities.getTrueValue(0, 3)
            self.capacity_5 = capacities.getTrueValue(0, 4)
            self.capacity_6 = capacities.getTrueValue(0, 5)
            self.capacity_7 = capacities.getTrueValue(0, 6)
            self.capacity_8 = capacities.getTrueValue(0, 7)
            self.capacity_9 = capacities.getTrueValue(0, 8)

        if isinstance(in_vrp_layer, str) and in_vrp_layer.endswith(".lyrx"):
            self.in_vrp_layer = arcpy.mp.LayerFile(in_vrp_layer).listLayers()[0]
            in_vrp_layer_name = self.in_vrp_layer.name
        else:
            in_vrp_layer_name = self.in_vrp_layer

        # Get the solver name
        self.solver_type = arcpy.Describe(in_vrp_layer_name).solverName

        if self.solver_type == "Vehicle Routing Problem Solver":
            self.earliest_start_time = earliest_start_time
            self.latest_start_time = latest_start_time
        else:
            self.earliest_start_time = None
            self.latest_start_time = None
            non_null = []
            if earliest_start_time is not None:
                non_null.append(self.param_info[5].name)
            if latest_start_time is not None:
                non_null.append(self.param_info[6].name)
            if non_null:
                # The following parameters are not relevant to the Last Mile Delivery solver and will be ignored: %s
                LOGGER.warning("", extra={
                    "message_ID": 30357,
                    "add_argument1": str(non_null)
                })

        if self.solver_type == "Vehicle Routing Problem Solver" and self.max_order_count is None:
            # Max Order Count can't contain a null value for a Vehicle Routing Problem layer and has a default value of
            # 30.
            LOGGER.warning("", extra={"message_ID": 30355})
            self.max_order_count = DEFAULT_MAX_ORDER_COUNT

        # Get the sublayer names and objects for use later
        self.routes_layer = arcpy.na.GetNASublayer(in_vrp_layer_name, "Routes")

        # route constraints
        if route_constraints.rowCount == 0:
            self.max_total_time = None
            self.max_total_travel_time = None
            self.max_total_distance = None
        else:
            self.max_total_time = route_constraints.getTrueValue(0, 0)
            self.max_total_travel_time = route_constraints.getTrueValue(0, 1)
            self.max_total_distance = route_constraints.getTrueValue(0, 2)

        # costs
        if costs.rowCount == 0:
            self.fixed_cost = None
            self.cost_per_unit_time = None
            LOGGER.warning("", extra={"message_ID": 30240})
            self.cost_per_unit_distance = None
            self.overtime_start_time = None
            self.cost_per_unit_overtime = None
        else:
            self.fixed_cost = costs.getTrueValue(0, 0)
            if costs.getTrueValue(0, 1) is None:
                self.cost_per_unit_time = 1.0
                LOGGER.warning("", extra={"message_ID": 30240})
            else:
                self.cost_per_unit_time = costs.getTrueValue(0, 1)
            self.cost_per_unit_distance = costs.getTrueValue(0, 2)
            self.overtime_start_time = costs.getTrueValue(0, 3)
            self.cost_per_unit_overtime = costs.getTrueValue(0, 4)

        # Additional Route Time
        if additional_route_time.rowCount == 0:
            self.start_depot_service_time = None
            self.end_depot_service_time = None
            self.arrive_depart_delay = None
        else:
            self.start_depot_service_time = additional_route_time.getTrueValue(0, 0)
            self.end_depot_service_time = additional_route_time.getTrueValue(0, 1)
            self.arrive_depart_delay = additional_route_time.getTrueValue(0, 2)

        # Date and Time
        self.earliest_start_date_only = None
        self.earliest_start_time_only = None
        self.route_start_flexibility = None
        if date_and_time.rowCount > 0:
            if self.solver_type == "Vehicle Routing Problem Solver":
                # The following parameters are not relevant to the Vehicle Routing Problem solver and will be
                # ignored: %s
                LOGGER.warning("", extra={
                    "message_ID": 30356,
                    "add_argument1": self.param_info[14].name
                })
            elif self.solver_type == "Last Mile Delivery Solver":
                self.earliest_start_date_only = date_and_time.getTrueValue(0, 0)
                if self.earliest_start_date_only:
                    self.earliest_start_date_only = self.earliest_start_date_only.date()
                self.earliest_start_time_only = date_and_time.getTrueValue(0, 1)
                if self.earliest_start_time_only:
                    self.earliest_start_time_only = self.earliest_start_time_only.time()
                self.route_start_flexibility = date_and_time.getTrueValue(0, 2)

        self.append_to_existing_routes = append_to_existing_routes
        if self.solver_type == "Vehicle Routing Problem Solver":
            self.assignment_rule = 1  # "Include"
        else:
            self.assignment_rule = None

    def validate_inputs(self):
        """Validate inputs."""
        # validate for depot names
        if (
            self.solver_type == "Vehicle Routing Problem Solver" and  # Last Mile supports virtual start & end depots
            self.start_depot_name is None and
            self.end_depot_name is None
        ):
            LOGGER.error("", extra={"message_ID": 30241})
            LOGGER.debug("Exception details:", exc_info=True)
            raise nat.ToolExit

    def execute(self):
        """Tool Execution logic.

        Args:
            No arguments.
        Returns:
            No return value.
        Raises:
            nat.ToolExit is raised whenever the method needs to quit. The caller must immediately terminate the overall
            execution when handling the ToolExit exception.

        """
        self.validate_inputs()

        # Use a search cursor to identify what the latest object id so that can be used for making the route names
        last_used_object_id = 0
        for row in arcpy.da.SearchCursor(self.routes_layer, ["OBJECTID"]):
            last_used_object_id = row[0]

        # Delete all the routes if append_to_existing_routes is set to false
        if not self.append_to_existing_routes:
            arcpy.DeleteRows_management(self.routes_layer)

        # Use an insert cursor to add the new routes
        # These field values are the same for all rows
        static_fields = {
            'StartDepotName': self.start_depot_name,
            'EndDepotName': self.end_depot_name,
            'StartDepotServiceTime': self.start_depot_service_time,
            'EndDepotServiceTime': self.end_depot_service_time,
            'ArriveDepartDelay': self.arrive_depart_delay,
            'Capacity_1': self.capacity_1,
            'Capacity_2': self.capacity_2,
            'Capacity_3': self.capacity_3,
            'Capacity_4': self.capacity_4,
            'Capacity_5': self.capacity_5,
            'Capacity_6': self.capacity_6,
            'Capacity_7': self.capacity_7,
            'Capacity_8': self.capacity_8,
            'Capacity_9': self.capacity_9,
            'FixedCost': self.fixed_cost,
            'CostPerUnitTime': self.cost_per_unit_time,
            'CostPerUnitDistance': self.cost_per_unit_distance,
            'OvertimeStartTime': self.overtime_start_time,
            'CostPerUnitOvertime': self.cost_per_unit_overtime,
            'MaxOrderCount': self.max_order_count,
            'MaxTotalTime': self.max_total_time,
            'MaxTotalTravelTime': self.max_total_travel_time,
            'MaxTotalDistance': self.max_total_distance,
            'AssignmentRule': self.assignment_rule
        }
        if self.solver_type == "Vehicle Routing Problem Solver":
            static_fields['EarliestStartTime'] = self.earliest_start_time
            static_fields['LatestStartTime'] = self.latest_start_time
        elif self.solver_type == "Last Mile Delivery Solver":
            static_fields['EarliestStartDate'] = self.earliest_start_date_only
            static_fields['EarliestStartTime'] = self.earliest_start_time_only
            static_fields['StartFlexibility'] = self.route_start_flexibility
        static_row_fields = list(static_fields.keys())
        static_row_vals = list(static_fields.values())
        # The Name field is specific to each row, so handle it separately
        with arcpy.da.InsertCursor(self.routes_layer, static_row_fields + ["Name"]) as insert_cursor:
            for _ in range(0, int(self.number_of_routes)):
                last_used_object_id += 1
                route_name = self.route_name_prefix + str(last_used_object_id)
                insert_cursor.insertRow(static_row_vals + [route_name])


# Validation flags to prevent redoing slow validation checks if the parameter hasn't changed. Because of limitations of
# the ToolValidator class framework, these must be global variables stored outside the class, even though this isn't the
# best coding practice.
VFLAG_SOLVER_TYPE_ERROR = False
VFLAG_SOLVER_TYPE = None
VFLAG_ANALYSIS_LIMITS = False


class ToolValidator(nat.NAToolValidator):
    """Class for validating a tool's parameter values and controlling the behavior of the tool's dialog."""

    def __init__(self):
        """Set the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        self.param_input_layer = self.params[0]
        self.param_number_of_routes = self.params[1]
        self.param_start_depot_name = self.params[3]
        self.param_end_depot_name = self.params[4]
        self.param_earliest_start = self.params[5]
        self.param_latest_start = self.params[6]
        self.param_max_order_count = self.params[7]
        self.param_capacities = self.params[8]
        self.param_route_constraints = self.params[9]
        self.param_costs = self.params[10]
        self.param_addl_rt_time = self.params[11]
        self.param_date_and_time = self.params[14]

    def updateParameters(self):
        """Modify the values and properties of parameters before internal validation is performed.

        This method is called whenever a parameter has been changed.
        """
        # Set the derived output parameter's value equal to the input VRP layer parameter's value. This fixes Model
        # Builder workflows where otherwise the output bubble would not be seen as a valid VRP layer when connected to
        # other tools. This seems to work even when the input VRP layer does not yet have a value.  Ultimately it just
        # serves to inform the derived output of what data type it is.
        if self.param_input_layer.isInputValueDerived():
            self.params[13].value = self.param_input_layer.value

        # When the input layer is present, do some validation and populate filter lists
        if not self.param_input_layer.hasBeenValidated and self.param_input_layer.valueAsText:
            vrp_layer = self.param_input_layer.value

            try:
                # Check solver type and enable/disable parameters accordingly
                # Store solver type in a global flag so we don't have to recheck it in updateMessages
                global VFLAG_SOLVER_TYPE
                desc_input = arcpy.Describe(vrp_layer)
                VFLAG_SOLVER_TYPE = desc_input.solverName
                if VFLAG_SOLVER_TYPE == "Vehicle Routing Problem Solver":
                    self.param_earliest_start.enabled = True
                    self.param_latest_start.enabled = True
                    self.param_date_and_time.enabled = False
                    self.param_date_and_time.value = []
                elif VFLAG_SOLVER_TYPE == "Last Mile Delivery Solver":
                    self.param_earliest_start.enabled = False
                    self.param_earliest_start.value = None
                    self.param_latest_start.enabled = False
                    self.param_latest_start.value = None
                    self.param_date_and_time.enabled = True
                else:
                    self.param_earliest_start.enabled = True
                    self.param_latest_start.enabled = True
                    self.param_date_and_time.enabled = True

            except Exception:  # pylint:disable=broad-except
                VFLAG_SOLVER_TYPE = None
                self.param_earliest_start.enabled = True
                self.param_latest_start.enabled = True
                self.param_date_and_time.enabled = True

            # Get list of valid depot names and populate filter lists
            try:
                # Deal with lyrx files
                if isinstance(vrp_layer, str) and vrp_layer.endswith(".lyrx"):
                    vrp_layer = arcpy.mp.LayerFile(vrp_layer).listLayers()[0]
                    in_vrp_layer_name = vrp_layer.name
                else:
                    in_vrp_layer_name = vrp_layer

                depots_layer = arcpy.na.GetNASublayer(in_vrp_layer_name, "Depots")
                depot_names = []
                with arcpy.da.SearchCursor(depots_layer, ["Name"]) as search_cursor:
                    for row in search_cursor:
                        name = row[0]
                        if name != '':
                            depot_names.append(name)
                self.param_start_depot_name.filter.list = depot_names
                self.param_end_depot_name.filter.list = depot_names

            except Exception:  # pylint:disable=broad-except
                self.param_start_depot_name.filter.list = []
                self.param_end_depot_name.filter.list = []

            # If the Max Order Count parameter is null and the input layer has been changed, reset it to the default
            if not self.param_max_order_count.altered:
                if VFLAG_SOLVER_TYPE == "Vehicle Routing Problem Solver":
                    self.param_max_order_count.value = DEFAULT_MAX_ORDER_COUNT
                elif VFLAG_SOLVER_TYPE == "Last Mile Delivery Solver":
                    self.param_max_order_count.value = None

        return

    def updateMessages(self):  # pylint: disable=invalid-name
        """Modify the messages created by internal validation for each tool parameter.

        This method is called after internal validation.
        Args:
            No arguments.
        Returns:
            No return value.
        Raises:
            No exceptions.

        """
        # Check if the input layer has the correct solver type.
        # Also, if it's a service layer, determine if the analysis has service limits and show an info tip if so.
        if self.param_input_layer.altered and self.param_input_layer.valueAsText:
            global VFLAG_SOLVER_TYPE_ERROR
            global VFLAG_SOLVER_TYPE
            global VFLAG_ANALYSIS_LIMITS
            if self.param_input_layer.hasBeenValidated:
                # The parameter has already been validated and has not been changed by the user since the last
                # validation check. Skip slow checks by just reapplying the existing validation error if relevant.
                if VFLAG_SOLVER_TYPE_ERROR:
                    self.param_input_layer.setIDMessage("ERROR", 30018)
                elif VFLAG_ANALYSIS_LIMITS:
                    # Info tip (not real warning): This layer's network data source imposes analysis limits, such as on
                    # the number of inputs that can be used.
                    self.param_input_layer.setIDMessage("WARNING", 230019)
            else:
                # The parameter has changed since the last validation check. Recheck the solver type.
                VFLAG_SOLVER_TYPE_ERROR = False
                VFLAG_ANALYSIS_LIMITS = False
                analysis_input = self.param_input_layer.value
                if VFLAG_SOLVER_TYPE is None:
                    try:
                        desc_input = arcpy.Describe(analysis_input)
                        VFLAG_SOLVER_TYPE = desc_input.solverName
                    except Exception:  # pylint:disable=broad-except
                        pass
                if VFLAG_SOLVER_TYPE not in ["Vehicle Routing Problem Solver", "Last Mile Delivery Solver", None]:
                    self.param_input_layer.setIDMessage("ERROR", 30018)
                    VFLAG_SOLVER_TYPE_ERROR = True
                if not VFLAG_SOLVER_TYPE_ERROR and VFLAG_SOLVER_TYPE is not None:
                    # If the layer references a portal that has relevant analysis limits, show an info tip.
                    if self._lyr_has_analysis_limits(analysis_input, VFLAG_SOLVER_TYPE):
                        # Info tip (not real warning): This layer's network data source imposes analysis limits, such as
                        # on the number of inputs that can be used.
                        self.param_input_layer.setIDMessage("WARNING", 230019)
                        VFLAG_ANALYSIS_LIMITS = True

        if self.param_max_order_count.altered and self.param_max_order_count.valueAsText:
            if self.param_max_order_count.value < 1:
                # Value must be greater than zero
                self.param_max_order_count.setIDMessage("ERROR", 531)
        if (
            self.param_input_layer.valueAsText and
            VFLAG_SOLVER_TYPE == "Vehicle Routing Problem Solver" and
            not self.param_max_order_count.valueAsText
        ):
            # Max Order Count can't contain a null value for a Vehicle Routing Problem layer and has a default value of
            # 30.
            self.param_max_order_count.setIDMessage("WARNING", 30355)

        if self.param_number_of_routes.altered and self.param_number_of_routes.valueAsText:
            if self.param_number_of_routes.value < 1:
                # Value must be greater than zero
                self.param_number_of_routes.setIDMessage("ERROR", 531)
        if self.param_earliest_start.valueAsText and self.param_latest_start.valueAsText:
            if self.param_earliest_start.value > self.param_latest_start.value:
                # The Latest Start Time must not precede the Earliest Start Time.
                self.param_earliest_start.setIDMessage("ERROR", 30244)
                self.param_latest_start.setIDMessage("ERROR", 30244)

        # capacities
        if self.param_capacities.altered and self.param_capacities.valueAsText:
            capacities = self.param_capacities.values[0]
            for i in range(9):
                cap_val = capacities[i]
                if cap_val is not None and cap_val < 0:
                    param_label = self.param_capacities.columns[i][1]
                    # %s must be greater than or equal to zero.
                    self.param_capacities.setIDMessage("ERROR", 30111, param_label)
                    break

        # route constraints
        if self.param_route_constraints.altered and self.param_route_constraints.valueAsText:
            route_constraints = self.param_route_constraints.values[0]
            for i in range(3):
                constraint = route_constraints[i]
                if constraint is not None and constraint < 0:
                    param_label = self.param_route_constraints.columns[i][1]
                    # %s must be greater than or equal to zero.
                    self.param_route_constraints.setIDMessage("ERROR", 30111, param_label)
                    break
            if not self.param_route_constraints.hasError():
                max_total_time = route_constraints[0]
                max_total_travel_time = route_constraints[1]
                # validate if MaxTotalTravelTime is not larger than MaxTotalTime
                if max_total_travel_time is not None and max_total_time is not None:
                    if max_total_travel_time > max_total_time:
                        self.param_route_constraints.setIDMessage("ERROR", 30243)

        # costs
        if self.param_costs.altered and self.param_costs.valueAsText:
            costs = self.param_costs.values[0]
            for i in [0, 2, 3, 4]:
                cost_val = costs[i]
                if cost_val is not None and cost_val < 0:
                    param_label = self.param_costs.columns[i][1]
                    # %s must be greater than or equal to zero.
                    self.param_costs.setIDMessage("ERROR", 30111, param_label)
                    break
            if not self.param_costs.hasError():
                cost_per_unit_time = costs[1]
                # Retrieving .values or .value from the parameter always returns 0 for a column of type GPDouble even
                # if the value is None. To avoid adding an error if there is a null value, check the text value for "#"
                # (empty)
                cost_per_unit_time_text_val = self.param_costs.valueAsText.split(";")[0].split(" ")[1]
                if cost_per_unit_time is not None and cost_per_unit_time_text_val != "#" and cost_per_unit_time <= 0:
                    param_label = self.param_costs.columns[1][1]
                    # %s must be greater than zero.
                    self.param_costs.setIDMessage("ERROR", 30112, param_label)
                elif cost_per_unit_time_text_val == "#":
                    # Cost Per Unit Time can't contain a null value and has a default value of 1.0.
                    self.param_costs.setIDMessage("WARNING", 30240)

        # additional route time
        if self.param_addl_rt_time.altered and self.param_addl_rt_time.valueAsText:
            addl_rt_times = self.param_addl_rt_time.values[0]
            for i in range(3):
                rt_time = addl_rt_times[i]
                if rt_time is not None and rt_time < 0:
                    param_label = self.param_addl_rt_time.columns[i][1]
                    # %s must be greater than or equal to zero.
                    self.param_addl_rt_time.setIDMessage("ERROR", 30111, param_label)
                    break

        # Date and Time
        if self.param_date_and_time.altered and self.param_date_and_time.valueAsText:
            date_and_time = self.param_date_and_time.values[0]
            earliest_start_date_only = date_and_time[0]
            route_start_flexibility = date_and_time[2]
            if earliest_start_date_only is not None and earliest_start_date_only < datetime.datetime(1970, 1, 1):
                # Date must be 1/1/1970 or later.
                self.param_date_and_time.setIDMessage("ERROR", 30093)
            if route_start_flexibility and route_start_flexibility < 0:
                param_label = self.param_date_and_time.columns[2][1]
                # %s must be greater than or equal to zero.
                self.param_date_and_time.setIDMessage("ERROR", 30111, param_label)
            if not self.param_date_and_time.hasError():
                # Remove time portion of date only param and time portion of time only param
                if earliest_start_date_only is not None:
                    earliest_start_date_only = earliest_start_date_only.date()
                earliest_start_time_only = date_and_time[1]
                if earliest_start_time_only is not None:
                    earliest_start_time_only = earliest_start_time_only.time()
                # Retrieving .values or .value from the parameter always returns 0 for a column of type GPDouble even
                # if the value is None. To avoid messing up the null values, check the text value for "#" (default) and
                # manually set it to None if appropriate.
                if not route_start_flexibility:
                    text_val = self.param_date_and_time.valueAsText.split(";")[0].split(" ")[-1]
                    if text_val == "#":
                        route_start_flexibility = None
                self.param_date_and_time.values = [
                    [earliest_start_date_only, earliest_start_time_only, route_start_flexibility]]

    @staticmethod
    def _lyr_has_analysis_limits(lyr_obj, solver_type):
        """Determine whether the input layer references a service with relevant analysis limits."""
        try:
            # We have to look at the layer CIM to determine if it's a service layer and to get its portal URL.
            # Describe and solver properties don't give us good info for a service layer.
            lyr_cim = lyr_obj.getDefinition("V3")
            if hasattr(lyr_cim.networkDataset, "serverConnection"):  # Means it references a service
                portal_url = lyr_cim.networkDataset.serverConnection.url  # Correctly formatted portal URL
                # Get web tool info to discover analysis limits
                if solver_type == "Vehicle Routing Problem Solver":
                    info = arcpy.nax.GetWebToolInfo("asyncVRP", "SolveVehicleRoutingProblem", portal_url)
                elif solver_type == "Last Mile Delivery Solver":
                    info = arcpy.nax.GetWebToolInfo("asyncFleetRouting", "SolveLastMileDelivery", portal_url)
                else:
                    # Unsupported solver type (should not happen)
                    return False
                if "serviceLimits" not in info.keys():
                    return False
                limits = info["serviceLimits"]
                if not limits:
                    return False
                # Only check for values of limits relevant to this particular tool
                if "maximumRoutes" in limits.keys() and limits["maximumRoutes"]:
                    return True
                if "maximumOrdersPerRoute" in limits.keys() and limits["maximumOrdersPerRoute"]:
                    return True
                return False
            # Layer does not reference a service
            return False
        except Exception:  # pylint:disable=broad-except
            return False
