"""Provides Validation and Execution logic for Add Vehicle Routing Problem Breaks tool."""

import logging
import arcpy
import nat
import datetime

# Initialize the logger used by this module
LOGGER = logging.getLogger(__name__)


class AddVehicleRoutingProblemBreaks(nat.NATool):
    """Provides execution logic for Add Vehicle Routing Problem Breaks tool."""

    def __init__(self, in_vrp_layer, target_route, break_type, time_window_properties,
                 travel_time_properties, work_time_properties, append_to_existing_breaks):
        """Store tool parameter values as instance names."""
        self.in_vrp_layer = in_vrp_layer
        self.target_route = target_route
        self.break_type = break_type
        self.append_to_existing_breaks = bool(append_to_existing_breaks)
        self.time_window_properties = time_window_properties
        self.travel_time_properties = travel_time_properties
        self.work_time_properties = work_time_properties
        # validate if only one type of break is entered, for python script signature
        no_of_break_types = 0
        if time_window_properties.rowCount > 0:
            no_of_break_types += 1
        if travel_time_properties.rowCount > 0:
            no_of_break_types += 1
        if work_time_properties.rowCount > 0:
            no_of_break_types += 1
        if no_of_break_types > 1:
            LOGGER.error("", extra={"message_ID": 30233})
            LOGGER.debug("Exception details:", exc_info=True)
            raise nat.ToolExit
        self.routes_list = []
        self.break_values_to_insert = []
        self.route_break_precedence_dict = {}
        self.same_for_all_routes = None
        if self.target_route == '':
            self.same_for_all_routes = True

        if isinstance(in_vrp_layer, str) and in_vrp_layer.endswith(".lyrx"):
            self.in_vrp_layer = arcpy.mp.LayerFile(in_vrp_layer).listLayers()[0]
            in_vrp_layer_name = self.in_vrp_layer.name
        else:
            in_vrp_layer_name = in_vrp_layer
        # Get the sublayer names and objects for use later
        self.depots_layer = arcpy.na.GetNASublayer(in_vrp_layer_name, "Depots")
        self.routes_layer = arcpy.na.GetNASublayer(in_vrp_layer_name, "Routes")
        self.breaks_layer = arcpy.na.GetNASublayer(in_vrp_layer_name, "Breaks")

    def get_break_values_for_timewindow_breaks(self):
        """Return the break values for time window breaks."""
        break_properties = self.time_window_properties
        break_values = []
        # Loop through the breaks
        for route in self.routes_list:
            previous_time_windows = []
            for i in range(0, break_properties.rowCount):
                self.route_break_precedence_dict[route] += 1

                is_paid = break_properties.getTrueValue(i, 0)

                break_duration = break_properties.getTrueValue(i, 1)
                if break_duration is None:
                    LOGGER.warning("", extra={"message_ID": 30239})
                elif break_duration <= 0:
                    break_duration_label = arcpy.GetParameterInfo("AddVehicleRoutingProblemBreaks")[3].columns[1][1]
                    LOGGER.error("", extra={
                        "message_ID": 30112,
                        "add_argument1": break_duration_label
                        })
                    raise nat.ToolExit

                time_window_start = break_properties.getTrueValue(i, 2)

                time_window_end = break_properties.getTrueValue(i, 3)

                # error when when time_window_start and time_window_end are not entered
                if not time_window_start and not time_window_end:
                    LOGGER.error("", extra={"message_ID": 30234, "add_argument1": route})
                    LOGGER.debug("Exception details:", exc_info=True)
                    raise nat.ToolExit
                elif not time_window_start:
                    LOGGER.error("", extra={"message_ID": 30235, "add_argument1": route})
                    LOGGER.debug("Exception details:", exc_info=True)
                    raise nat.ToolExit
                elif not time_window_end:
                    LOGGER.error("", extra={"message_ID": 30236, "add_argument1": route})
                    LOGGER.debug("Exception details:", exc_info=True)
                    raise nat.ToolExit
                elif time_window_start and time_window_end and time_window_start > time_window_end:
                    LOGGER.error("", extra={"message_ID": 30245})
                    LOGGER.debug("Exception details:", exc_info=True)
                    raise nat.ToolExit
                else:
                    if len(previous_time_windows) > 0:
                        if time_window_start == previous_time_windows[0]:
                            LOGGER.error("", extra={"message_ID": 30248})
                            LOGGER.debug("Exception details:", exc_info=True)
                            raise nat.ToolExit
                        elif time_window_start < previous_time_windows[0]:
                            LOGGER.error("", extra={"message_ID": 30249})
                            LOGGER.debug("Exception details:", exc_info=True)
                            raise nat.ToolExit
                        elif time_window_start < previous_time_windows[1]:
                            LOGGER.error("", extra={"message_ID": 30248})
                            LOGGER.debug("Exception details:", exc_info=True)
                            raise nat.ToolExit

                max_violation_time = break_properties.getTrueValue(i, 4)
                if max_violation_time is not None and max_violation_time < 0:
                        max_violation_time_label = arcpy.GetParameterInfo("AddVehicleRoutingProblemBreaks")[3].columns[4][1]
                        LOGGER.error("", extra={
                            "message_ID": 10116,
                            "add_argument1": max_violation_time_label
                            })
                        raise nat.ToolExit

                break_values.append([route, self.route_break_precedence_dict[route], break_duration, time_window_start,
                                     time_window_end, max_violation_time, None, None, is_paid])
                previous_time_windows = [time_window_start, time_window_end]
        return break_values

    def get_break_values_for_traveltime_breaks(self):
        """Return the break values for travel time breaks."""
        break_properties = self.travel_time_properties
        break_values = []
        for route in self.routes_list:
            for i in range(0, break_properties.rowCount):
                self.route_break_precedence_dict[route] += 1

                is_paid = break_properties.getTrueValue(i, 0)

                break_duration = break_properties.getTrueValue(i, 1)
                if break_duration is None:
                    LOGGER.warning("", extra={"message_ID": 30239})
                elif break_duration <= 0:
                    break_duration_label = arcpy.GetParameterInfo("AddVehicleRoutingProblemBreaks")[3].columns[1][1]
                    LOGGER.error("", extra={
                        "message_ID": 30112,
                        "add_argument1": break_duration_label
                        })
                    raise nat.ToolExit

                maximum_travel_time = break_properties.getTrueValue(i, 2)
                if maximum_travel_time is not None and maximum_travel_time <= 0:
                    max_travel_time_label = arcpy.GetParameterInfo("AddVehicleRoutingProblemBreaks")[4].columns[2][1]
                    LOGGER.error("", extra={
                        "message_ID": 30112,
                        "add_argument1": max_travel_time_label
                        })
                    raise nat.ToolExit

                break_values.append([route, self.route_break_precedence_dict[route], break_duration, None, None, None,
                                    maximum_travel_time, None, is_paid])
        return break_values

    def get_break_values_for_worktime_breaks(self):
        """Return the break values for work time breaks."""
        break_properties = self.work_time_properties
        break_values = []
        for route in self.routes_list:
            previous_cumul_work_time = None
            for i in range(0, break_properties.rowCount):
                self.route_break_precedence_dict[route] += 1

                is_paid = break_properties.getTrueValue(i, 0)

                break_duration = break_properties.getTrueValue(i, 1)
                if break_duration is None:
                    LOGGER.warning("", extra={"message_ID": 30239})
                elif break_duration <= 0:
                    break_duration_label = arcpy.GetParameterInfo("AddVehicleRoutingProblemBreaks")[3].columns[1][1]
                    LOGGER.error("", extra={
                        "message_ID": 30112,
                        "add_argument1": break_duration_label
                        })
                    raise nat.ToolExit

                maximum_work_time = break_properties.getTrueValue(i, 2)
                if maximum_work_time is not None:
                    if maximum_work_time <= 0:
                        max_work_time_label = arcpy.GetParameterInfo("AddVehicleRoutingProblemBreaks")[5].columns[2][1]
                        LOGGER.error("", extra={
                            "message_ID": 30112,
                            "add_argument1": max_work_time_label
                            })
                        raise nat.ToolExit
                    if previous_cumul_work_time is not None and maximum_work_time <= previous_cumul_work_time:
                        LOGGER.error("", extra={"message_ID": 30248})
                        LOGGER.debug("Exception details:", exc_info=True)
                        raise nat.ToolExit

                break_values.append([route, self.route_break_precedence_dict[route], break_duration, None, None, None,
                                    None, maximum_work_time, is_paid])
                previous_cumul_work_time = maximum_work_time
        return break_values

    def delete_all_breaks(self):
        """Delete rows in the break table."""
        arcpy.DeleteRows_management(self.breaks_layer)

    def create_routes_list(self):
        """Return all routes in route table if same_for_all_routes, else only target_route."""
        if self.same_for_all_routes:
            for row in arcpy.da.SearchCursor(self.routes_layer, ["Name"]):
                self.routes_list.append(row[0])
        else:
            self.routes_list.append(self.target_route)

        if len(self.routes_list) == 0:
            LOGGER.error("", extra={"message_ID": 30250})
            LOGGER.debug("Exception details:", exc_info=True)
            raise nat.ToolExit

    def create_precedence_dict(self):
        """Return route and maximum precedence dictionary."""
        self.route_break_precedence_dict = {route: 0 for route in self.routes_list}
        # a dictionary to know highest precedence value for each break, this will help for validation of 5 breaks
        # for each route
        if self.append_to_existing_breaks:
            for row in arcpy.da.SearchCursor(self.breaks_layer, ["RouteName", "Precedence"]):
                route = row[0]
                precedence = row[1]
                if route in self.route_break_precedence_dict:
                    if self.route_break_precedence_dict[route] < precedence:
                        self.route_break_precedence_dict[route] = precedence
                else:
                    self.route_break_precedence_dict[route] = precedence

    def check_for_one_break_type(self):
        """Check for only one type of break in the table."""
        break_types = []
        for row in arcpy.da.SearchCursor(self.breaks_layer, ["TimeWindowStart", "TimeWindowEnd", "MaxViolationTime",
                                         "MaxTravelTimeBetweenBreaks", "MaxCumulWorkTime"]):
            tw_start = row[0]
            tw_end = row[1]
            max_violation_time = row[2]
            max_tt_bet_breaks = row[3]
            max_wt_bet_breaks = row[4]
            if tw_start or tw_end or max_violation_time:
                break_types.append("TIME_WINDOW_BREAK")
            if max_tt_bet_breaks:
                break_types.append("MAXIMUM_TRAVEL_TIME_BREAK")
            if max_wt_bet_breaks:
                break_types.append("MAXIMUM_WORK_TIME_BREAK")
            # add the new break type to the list
            break_types.append(self.break_type)
        if len(set(break_types)) > 1:
            LOGGER.error("", extra={"message_ID": 30233})
            LOGGER.debug("Exception details:", exc_info=True)
            raise nat.ToolExit

    def get_break_values(self):
        """Return the break values depending on the type of breaks."""
        if self.break_type == "TIME_WINDOW_BREAK":
            self.break_values_to_insert = self.get_break_values_for_timewindow_breaks()
        elif self.break_type == "MAXIMUM_TRAVEL_TIME_BREAK":
            self.break_values_to_insert = self.get_break_values_for_traveltime_breaks()
        else:
            self.break_values_to_insert = self.get_break_values_for_worktime_breaks()
        if len(self.break_values_to_insert) == 0:
            LOGGER.error("", extra={"message_ID": 30238})
            LOGGER.debug("Exception details:", exc_info=True)
            raise nat.ToolExit

    def insert_breaks_to_table(self):
        """Insert breaks into the breaks vrp layer."""
        fields = ["RouteName", "Precedence", "ServiceTime", "TimeWindowStart", "TimeWindowEnd", "MaxViolationTime",
                  "MaxTravelTimeBetweenBreaks", "MaxCumulWorkTime", "IsPaid"]
        with arcpy.da.InsertCursor(self.breaks_layer, fields) as insert_cursor:
            for break_value in self.break_values_to_insert:
                insert_cursor.insertRow(break_value)

    def execute(self):
        """Tool Execution logic.

        Args:
            No arguments.
        Returns:
            No return value.
        Raises:
            nat.ToolExit is raised whenever the method needs to quit. The caller must immidiately terminate the overall
            execution when handling the ToolExit exeception.

        """
        if self.append_to_existing_breaks:
            self.check_for_one_break_type()

        self.create_routes_list()
        self.create_precedence_dict()
        self.get_break_values()
        # validate for 5 breaks per route before deleting and inserting into breaks table
        for route in self.route_break_precedence_dict:
            if self.route_break_precedence_dict[route] > 5:
                LOGGER.error("", extra={"message_ID": 30237, "add_argument1": route})
                LOGGER.debug("Exception details:", exc_info=True)
                raise nat.ToolExit

        if not self.append_to_existing_breaks:
            self.delete_all_breaks()

        self.insert_breaks_to_table()


# Validation flags to prevent redoing slow validation checks if the parameter hasn't changed. Because of limitations of
# the ToolValidator class framework, these must be global variables stored outside the class, even though this isn't the
# best coding practice.
VFLAG_SOLVER_TYPE_ERROR = False


class ToolValidator(nat.NAToolValidator):
    """Class for validating a tool's parameter values and controlling the behavior of the tool's dialog."""

    def updateMessages(self):  # pylint: disable=invalid-name
        """Modify the messages created by internal validation for each tool parameter.

        This method is called after internal validation.
        Args:
            No arguments.
        Returns:
            No return value.
        Raises:
            No execeptions.

        """
        input_layer = self.params[0]

        # Check if the analysis param value is of the correct data type
        if input_layer.altered and input_layer.valueAsText:
            global VFLAG_SOLVER_TYPE_ERROR
            if input_layer.hasBeenValidated:
                # The parameter has already been validated and has not been changed by the user since the last
                # validation check. Skip slow checks by just reapplying the existing validation error if relevant.
                if VFLAG_SOLVER_TYPE_ERROR:
                    input_layer.setIDMessage("ERROR", 30018)
            else:
                # The parameter has changed since the last validation check. Recheck the solver type.
                VFLAG_SOLVER_TYPE_ERROR = False
                analysis_input = input_layer.value
                try:
                    desc_input = arcpy.Describe(analysis_input)
                    solver_name = desc_input.solverName
                    if solver_name != "Vehicle Routing Problem Solver":
                        input_layer.setIDMessage("ERROR", 30018)
                        VFLAG_SOLVER_TYPE_ERROR = True
                except Exception:  # pylint:disable=broad-except
                    pass

    def updateParameters(self):
        """Modify the values and properties of parameters before internal validation is performed.

        This method is called whenever a parameter has been changed.
        Args:
            No arguments.
        Returns:
            No return value.
        Raises:
            No execeptions.

        """
        if not self.params[2].hasBeenValidated:
            if not self.params[2].valueAsText:
                self.params[2].value = "TIME_WINDOW_BREAK"
            if self.params[2].value == "TIME_WINDOW_BREAK":
                self.params[3].enabled = True
                self.params[4].enabled = False
                self.params[4].value = None
                self.params[5].enabled = False
                self.params[5].value = None

            elif self.params[2].valueAsText == "MAXIMUM_TRAVEL_TIME_BREAK":
                self.params[3].enabled = False
                self.params[3].value = None
                self.params[4].enabled = True
                self.params[5].enabled = False
                self.params[5].value = None

            elif self.params[2].valueAsText == "MAXIMUM_WORK_TIME_BREAK":
                self.params[3].enabled = False
                self.params[3].value = None
                self.params[4].enabled = False
                self.params[4].value = None
                self.params[5].enabled = True

        # Set the derived output parameter's value equal to the input VRP layer parameter's value. This fixes Model
        # Builder workflows where otherwise the output bubble would not be seen as a valid VRP layer when connected to
        # other tools. This seems to work even when the input VRP layer does not yet have a value.  Ultimately it just
        # serves to inform the derived output of what data type it is.
        if self.params[0].isInputValueDerived():
            self.params[7].value = self.params[0].value

        # When the input layer is present, do some validation and populate filter lists
        if not self.params[0].hasBeenValidated and self.params[0].valueAsText:
            try:
                # Check if the analysis param value is of the correct data type
                in_vrp_layer = self.params[0].value
                if isinstance(in_vrp_layer, str) and in_vrp_layer.endswith(".lyrx"):
                    in_vrp_layer = arcpy.mp.LayerFile(in_vrp_layer).listLayers()[0]
                    in_vrp_layer_name = in_vrp_layer.name
                else:
                    in_vrp_layer_name = in_vrp_layer
                # Get the sublayer names and objects for use later
                routes_layer = arcpy.na.GetNASublayer(in_vrp_layer_name, "Routes")

                route_names = []
                with arcpy.da.SearchCursor(routes_layer, ["Name"]) as search_cursor:
                    for row in search_cursor:
                        name = row[0]
                        if name != '':
                            route_names.append(name)
                self.params[1].filter.list = route_names

            except Exception:  # pylint:disable=broad-except
                self.params[1].filter.list = []
        return
