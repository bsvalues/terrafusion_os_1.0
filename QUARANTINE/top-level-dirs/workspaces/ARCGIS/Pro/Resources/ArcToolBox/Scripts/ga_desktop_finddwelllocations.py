"""
 ga_desktop_finddwelllocations.py

 Front end of 'Find Dwell Locations' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context, run_ga_desktop_tool
from gautils.validation import validate_greater_than_zero, validate_whole_number, validate_desktop_output, validate_input_source, \
    validate_time_units_greater_than, validate_time_boundary, time_validation_desktop_instant_only

if __name__ == '__main__':

    dist_tolerance, dist_tolerance_unit = split_unit(get_value(4))
    time_tolerance, time_tolerance_unit = split_unit(get_value(5))
    time_bound_split, time_bound_split_unit = split_unit(get_value(8))

    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  trackFields=get_value(2, as_list=True),
                  distanceMethod=get_value(3, dict=d.geodesic).title(),
                  outputType=get_value(6, dict=d.dwell_type),
                  distanceTolerance=dist_tolerance,
                  distanceToleranceUnit=dist_tolerance_unit,
                  timeTolerance=time_tolerance,
                  timeToleranceUnit=time_tolerance_unit,
                  summaryFields=get_value(7, as_value=True, val_table='summary_fields'),
                  output=get_value(1, local_feature_output=True),
                  timeBoundarySplit=time_bound_split,
                  timeBoundarySplitUnit=time_bound_split_unit,
                  timeBoundaryReference=get_value(9, datetime_epoch=True))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    run_ga_desktop_tool('FindDwellLocations', params, {"output":1})


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        # self.params[0].filter.list = ['BigDataFileShare']

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        self.params[1].value = validate_desktop_output(
            self.params[1].valueAsText, False)  # output validation

        # allow summary stats for certain outut types
        output_type = self.params[6].valueAsText
        if output_type == 'DWELL_FEATURES':
            self.params[7].enabled = False
            self.params[7].value = None
        elif output_type == 'ALL_FEATURES':
            self.params[7].enabled = False
            self.params[7].value = None
        else:
            self.params[7].enabled = True

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
        input_layer = self.params[0].value
        distance_tolerance = self.params[4].valueAsText
        time_tolerance = self.params[5].valueAsText
        time_split = self.params[8].valueAsText

        time_boundary_params = {"split":8, "reference":9}
        time_boundary_split = self.params[time_boundary_params["split"]].valueAsText
        time_boundary_reference = self.params[time_boundary_params["reference"]].valueAsText

        input_fields = []
        if input_layer:
            try:
                d = arcpy.Describe(self.params[0])
            except:
                d = ""

            input_fields = getattr(d, 'fields', [])
            # validate input time
            time_validation_desktop_instant_only(self.params[0], self.params[0], d)

            if getattr(d, 'shapetype', None) not in ['Point']:
                self.params[0].setIDMessage('ERROR', 366)

            # input validation
            valid_input = validate_input_source(d)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])

        if distance_tolerance:
            if not validate_greater_than_zero(distance_tolerance):
                self.params[4].setIDMessage('ERROR', 323)

        if time_tolerance:
            if not validate_greater_than_zero(time_tolerance):
                self.params[5].setIDMessage('ERROR', 323)
            if not validate_whole_number(time_tolerance):
                self.params[5].setIDMessage('ERROR', 1032,
                                            self.params[5].displayName)

        if time_tolerance and time_boundary_split:
            if not validate_time_units_greater_than(time_boundary_split, time_tolerance):
                self.params[8].setIDMessage('ERROR', 120302)

        validate_time_boundary(self, time_boundary_split, time_boundary_reference, time_boundary_params)

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True
