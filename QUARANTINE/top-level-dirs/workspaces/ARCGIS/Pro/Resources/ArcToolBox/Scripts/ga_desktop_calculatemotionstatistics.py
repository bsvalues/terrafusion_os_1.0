"""
 ga_desktop_calculatemotionstatistics.py

 Front end of 'Calculate Motion Statistics' GeoAnalytics Desktop tool.

"""

import arcpy
from gautils import get_value, param_cleanup, set_context, run_ga_desktop_tool, split_unit, dicts
from gautils.validation import validate_desktop_output, validate_input_source, validate_greater_than_zero, \
    validate_whole_number, validate_time_units_greater_than, validate_time_boundary, time_validation_desktop_instant_only

message = ""
if __name__ == '__main__':
    distance_tol, distance_tol_unit = split_unit(get_value(6))
    time_tol, time_tol_unit = split_unit(get_value(7))
    time_bound, time_bound_unit = split_unit(get_value(8))
    method = dicts.distance_method.get(get_value(5))
    distance_unit = dicts.linear_units.get(get_value(10))
    duration_unit = dicts.motion_stats_units.get(get_value(11))
    speed_unit = dicts.motion_stats_units.get(get_value(12))
    acceleration_unit = dicts.motion_stats_units.get(get_value(13))
    elevation_unit = dicts.linear_units_elevation.get(get_value(14))

    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  output=get_value(1, local_feature_output=True),
                  trackFields=get_value(2, as_list=True),
                  trackHistoryWindow=get_value(3, as_value=True),
                  motionStatistics=get_value(4, as_list=True),
                  idleDistanceToleranceUnit=distance_tol_unit,
                  idleTimeToleranceUnit=time_tol_unit,
                  idleDistanceTolerance=distance_tol,
                  idleTimeTolerance=time_tol,
                  distanceMethod=method,
                  timeBoundarySplit=time_bound,
                  timeBoundarySplitUnit=time_bound_unit,
                  timeBoundaryReference=get_value(9, datetime_epoch=True),
                  distanceUnit=distance_unit,
                  durationUnit=duration_unit,
                  speedUnit=speed_unit,
                  accelerationUnit=acceleration_unit,
                  elevationUnit=elevation_unit)


    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    run_ga_desktop_tool('CalculateMotionStatistics', params, {"output": 1})



class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        # Set default history depth
        if not self.params[3].altered:
            self.params[3].value = 3

        if not self.params[4].altered:
            self.params[4].value = "DISTANCE;DURATION;SPEED;ACCELERATION;ELEVATION;SLOPE;BEARING;IDLE"

        if not self.params[5].altered:
            self.params[5].value = "PLANAR"

        # Show or hide units parameters based on motion statisticsand set default
        if self.params[4].value:
            if "IDLE" in str(self.params[4].value):
                self.params[6].enabled = True
                self.params[7].enabled = True
            else:
                self.params[6].enabled = False
                self.params[7].enabled = False
                self.params[6].value = ""
                self.params[7].value = ""
            if "DISTANCE" in str(self.params[4].value):
                self.params[10].enabled = True
                if not self.params[10].altered:
                    self.params[10].value = "METERS"
            else:
                self.params[10].enabled = False
            if "DURATION" in str(self.params[4].value) or "IDLE" in str(self.params[4].value):
                self.params[11].enabled = True
                if not self.params[11].altered:
                    self.params[11].value = "SECONDS"
            else:
                self.params[11].enabled = False
            if "SPEED" in str(self.params[4].value):
                self.params[12].enabled = True
                if not self.params[12].altered:
                    self.params[12].value = "METERS_PER_SECOND"
            else:
                self.params[12].enabled = False
            if "ACCELERATION" in str(self.params[4].value):
                self.params[13].enabled = True
                if not self.params[13].altered:
                    self.params[13].value = "METERS_PER_SECOND_SQUARED"
            else:
                self.params[13].enabled = False
            if "ELEVATION" in str(self.params[4].value):
                self.params[14].enabled = True
                if not self.params[14].altered:
                    self.params[14].value = "METERS"
            else:
                self.params[14].enabled = False
        else:
            self.params[6].enabled = False
            self.params[7].enabled = False
            self.params[10].enabled = False
            self.params[11].enabled = False
            self.params[12].enabled = False
            self.params[13].enabled = False
            self.params[14].enabled = False

        # output validation
        self.params[1].value = validate_desktop_output(
            self.params[1].valueAsText, False)  # output validation

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        input_layer = self.params[0].value
        history_depth = self.params[3].value
        motion_stats = self.params[4].value
        distance_tolerance = self.params[6].valueAsText
        time_tolerance = self.params[7].valueAsText

        time_boundary_params = {"split":8, "reference":9}
        time_boundary_split = self.params[time_boundary_params["split"]].valueAsText
        time_boundary_reference = self.params[time_boundary_params["reference"]].valueAsText

        if input_layer:
            try:
                d = arcpy.Describe(self.params[0])
            except:
                d = ""
            
            if getattr(d, 'shapetype', None) not in ['Point']:
                self.params[0].setIDMessage('ERROR', 366)
            else:
                # validate input time
                time_validation_desktop_instant_only(self.params[0], self.params[0], d)

                # input validation
                valid_input = validate_input_source(d)
                if not valid_input[0]:
                    self.params[0].setIDMessage('ERROR', valid_input[1])

            # history depth validation
            if isinstance(history_depth, int):
                if history_depth < 1:
                    self.params[3].setIDMessage('ERROR', 323)
            else:
                self.params[3].setIDMessage('ERROR', 323)

            # motion stats validation
            if not motion_stats:
                self.params[4].setIDMessage('ERROR', 249)
            else:
                if "IDLE" in str(motion_stats):
                    if not distance_tolerance:
                        self.params[6].setIDMessage('ERROR', 530)
                    if not time_tolerance:
                        self.params[7].setIDMessage('ERROR', 530)
                if "DISTANCE" in str(motion_stats):
                    if not self.params[10].value:
                        self.params[10].setIDMessage('ERROR', 530)
                if "DURATION" in str(motion_stats):
                    if not self.params[11].value:
                        self.params[11].setIDMessage('ERROR', 530)
                if "SPEED" in str(motion_stats):
                    if not self.params[12].value:
                        self.params[12].setIDMessage('ERROR', 530)
                if "ACCELERATION" in str(motion_stats):
                    if not self.params[13].value:
                        self.params[13].setIDMessage('ERROR', 530)
                if "ELEVATION" in str(motion_stats):
                    if not self.params[14].value:
                        self.params[14].setIDMessage('ERROR', 530)

        if distance_tolerance:
            if not validate_greater_than_zero(distance_tolerance):
                self.params[6].setIDMessage('ERROR', 323)

        if time_tolerance:
            if not validate_greater_than_zero(time_tolerance):
                self.params[7].setIDMessage('ERROR', 323)
            if not validate_whole_number(time_tolerance):
                self.params[7].setIDMessage('ERROR', 1032,
                                            self.params[5].displayName)

        if time_tolerance and time_boundary_split:
            if not validate_time_units_greater_than(time_boundary_split, time_tolerance):
                self.params[8].setIDMessage('ERROR', 120373)
        if time_boundary_split:
            validate_time_boundary(self, time_boundary_split, time_boundary_reference, time_boundary_params)
        if self.params[1].valueAsText:
            validate_desktop_output(self.params[1].valueAsText, False)

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

