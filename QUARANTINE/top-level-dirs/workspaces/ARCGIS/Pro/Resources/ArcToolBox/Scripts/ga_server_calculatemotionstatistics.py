"""
 ga_server_calculatemotionstatistics.py

 Front end of 'Calculate Motion Statistics' GeoAnalytics Server tool.

"""

import arcpy
from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import get_value, param_cleanup, set_context, split_unit, dicts
from gautils.validation import validate_desktop_output, validate_input_source, validate_greater_than_zero, \
    validate_whole_number, validate_time_units_greater_than, validate_time_boundary
from gautils.utilities import format_motion_statistics_server
from gautils.utilities import PortalVersion

message = ""
if __name__ == '__main__':

    analysis_type = "Calculate Motion Statistics"
    distance_tol, distance_tol_unit = split_unit(get_value(6))
    time_tol, time_tol_unit = split_unit(get_value(7))
    time_bound, time_bound_unit = split_unit(get_value(8))
    method = dicts.distance_method.get(get_value(5))

    if PortalVersion() < 10.3:  # 11.1
        distance_unit = dicts.linear_units_old.get(get_value(10))
    else:
        distance_unit = dicts.linear_units.get(get_value(10))

    duration_unit = dicts.motion_stats_units.get(get_value(11))
    speed_unit = dicts.motion_stats_units.get(get_value(12))
    acceleration_unit = dicts.motion_stats_units.get(get_value(13))

    if PortalVersion() < 10.3:  # 11.1
        elevation_unit = dicts.linear_units_elevation_old.get(get_value(14))
    else:
        elevation_unit = dicts.linear_units_elevation.get(get_value(14))

    params = dict(inputLayer=get_value(0, as_value=True),
                  outputName=get_value(1),
                  trackFields=get_value(2),
                  trackHistoryWindow=get_value(3),
                  motionStatistics=format_motion_statistics_server(get_value(4)),
                  idleDistanceToleranceUnit=distance_tol_unit,
                  idleTimeToleranceUnit=time_tol_unit,
                  idleDistanceTolerance=distance_tol,
                  idleTimeTolerance=time_tol,
                  distanceMethod=method,
                  timeBoundarySplit=time_bound,
                  timeBoundarySplitUnit=time_bound_unit,
                  timeBoundaryReference=get_value(9),
                  distanceUnit=distance_unit,
                  durationUnit=duration_unit,
                  speedUnit=speed_unit,
                  accelerationUnit=acceleration_unit,
                  elevationUnit=elevation_unit)

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)
    arcpy.SetParameterAsText(16, output)



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
        
        # Support for bigint
        if PortalVersion() >= 2023.2: # 11.2
            self.params[2].filter.list = ["Short", "Long", "BigInteger", "Float", "Double", "Text"]

        # Set default history depth
        if not self.params[3].altered:
            self.params[3].value = 3

        if not self.params[4].altered:
            self.params[4].value = "DISTANCE;DURATION;SPEED;ACCELERATION;ELEVATION;SLOPE;BEARING;IDLE"

        if not self.params[5].altered:
            self.params[5].value = "PLANAR"

        if not self.params[15].altered:
            self.params[15].value = "SPATIOTEMPORAL_DATA_STORE"

        # Show or hide units parameters based on motion statisticsand set default
        if self.params[4].value:
            if "IDLE" in str(self.params[4].value):
                self.params[6].enabled = True
                self.params[7].enabled = True
                if PortalVersion() < 10.3:  # 11.1
                    self.params[6].filter.list = list(dicts.linear_units_old.values())
            else:
                self.params[6].enabled = False
                self.params[7].enabled = False
                self.params[6].value = ""
                self.params[7].value = ""
            if "DISTANCE" in str(self.params[4].value):
                self.params[10].enabled = True
                if PortalVersion() < 10.3:  # 11.1
                    self.params[10].filter.list = list(dicts.linear_units_old.keys())
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
                if PortalVersion() < 10.3:  # 11.1
                    self.params[14].filter.list = list(dicts.linear_units_elevation_old.keys())
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

        if PortalVersion() < 8.3: # 10.9
            if self.params[0].valueAsText:
                self.params[0].setIDMessage('ERROR', 120184)
            else:
                self.params[0].setIDMessage('WARNING', 120184)
