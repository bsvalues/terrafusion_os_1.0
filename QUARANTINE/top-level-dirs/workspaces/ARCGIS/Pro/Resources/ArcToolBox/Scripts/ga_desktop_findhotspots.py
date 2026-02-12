"""
 ga_desktop_findhotspots.py

 Front end of 'Find Hot Spots' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import get_value, param_cleanup, split_unit, set_context, run_ga_desktop_tool
from gautils import dicts as d
from gautils.validation import validate_output, validate_units_greater_than, \
    validate_is_projected_cs, validate_greater_than_zero, validate_whole_number, \
    validate_desktop_output, validate_input_source, time_validation_desktop_instant_only


if __name__ == '__main__':

    bin_dist, bin_dist_unit = split_unit(get_value(2))
    neigh_dist, neigh_dist_unit = split_unit(get_value(3))
    time_int, time_int_unit = split_unit(get_value(4))

    params = dict(pointLayer=get_value(0, as_value = True, local_feature_layer=True),
                  output=get_value(1, local_feature_output=True),
                  binSize=bin_dist,
                  binSizeUnit=bin_dist_unit,
                  neighborhoodDistance=neigh_dist,
                  neighborhoodDistanceUnit=neigh_dist_unit,
                  timeStepInterval=time_int,
                  timeStepIntervalUnit=time_int_unit,
                  timeStepAlignment=get_value(5, dict=d.time_alignment),
                  timeStepReference=get_value(6, datetime_epoch=True))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)
    
    params = param_cleanup(params)
    run_ga_desktop_tool('FindHotSpots', params, {"output":1})

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

        self.params[1].value = validate_desktop_output(
            self.params[1].valueAsText, False)  # output validation

        time_step_alignment = self.params[5].valueAsText

        if time_step_alignment == 'REFERENCE_TIME':
            self.params[6].enabled = True
        else:
            self.params[6].enabled = False

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        bin_size = self.params[2].valueAsText
        neighborhood_size = self.params[3].valueAsText
        time_step_interval = self.params[4].valueAsText
        time_step_alignment = self.params[5].value
        time_step_reference = self.params[6].value

        point_layer = self.params[0].value
        if point_layer:
            try:
                d_layer = arcpy.Describe(self.params[0])
            except:
                d_layer = ""

            # input validation
            valid_input = validate_input_source(d_layer)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])

            # time validation
            if time_step_interval:
                time_validation_desktop_instant_only(self.params[0], self.params[4], d_layer)
        
        # set bin_size and neighborhood_size as required
        if neighborhood_size is None:
            self.params[3].setIDMessage("ERROR", 735)
        if bin_size is None:
            self.params[2].setIDMessage("ERROR", 735)

        if time_step_alignment == "REFERENCE_TIME":
            if time_step_reference is None:
                self.params[6].setIDMessage("ERROR", 735)
            if time_step_interval is None:
                self.params[4].setIDMessage("ERROR", 735)

        if bin_size:
            bin_value = float(bin_size.split(' ')[0].replace(',', '.'))
            if bin_value <= 0:
                self.params[2].setIDMessage('ERROR', 531)

        if neighborhood_size:
            neighborhood_value = float(
                neighborhood_size.split(' ')[0].replace(',', '.'))
            if neighborhood_value <= 0:
                self.params[3].setIDMessage('ERROR', 531)

        if bin_size and neighborhood_size:
            if not validate_units_greater_than(neighborhood_size, bin_size):
                self.params[3].setIDMessage('ERROR', 120055)

        if time_step_interval:
            if not validate_greater_than_zero(time_step_interval):
                self.params[4].setIDMessage('ERROR', 323)
            if not validate_whole_number(time_step_interval):
                self.params[4].setIDMessage('ERROR', 1032,
                                            self.params[4].displayName)