"""
 aggregatepoints_ga_desktop.py

 Front end of 'Aggregate Points' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import get_value, param_cleanup, param_cleanup_num_zero, split_unit, set_context, run_ga_desktop_tool
from gautils.validation import validate_greater_than_zero, validate_input_source, validate_desktop_output,\
    time_stepping_missing_values, validate_time_on_input_desktop

if __name__ == '__main__':
    bin_size, bin_size_unit = split_unit(get_value(5))
    time_step_int, time_step_int_unit = split_unit(get_value(6))
    time_step_rep, time_step_rep_unit = split_unit(get_value(7))

    params = dict(pointLayer=get_value(0, as_value = True, local_feature_layer=True),
                output=get_value(1, local_feature_output=True),
                polygonLayer=get_value(3, as_value = True, local_feature_layer=True) if get_value(2) == 'POLYGON' else None,
                binType=get_value(4).title(),
                binSize=bin_size,
                binSizeUnit=bin_size_unit,
                binResolution=get_value(10, as_value=True),
                timeStepInterval=time_step_int,
                timeStepIntervalUnit=time_step_int_unit,
                timeStepRepeatInterval=time_step_rep,
                timeStepRepeatIntervalUnit=time_step_rep_unit,
                timeStepReference=get_value(8, datetime_epoch=True),
                summaryFields=get_value(9, as_value=True, val_table='summary_fields'))
                
    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    if params['binType'] == 'H3':
        params = param_cleanup_num_zero(params)
    else:
        params = param_cleanup(params)
    run_ga_desktop_tool('AggregatePoints', params,{"output":1})


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

        if self.params[2].valueAsText == 'POLYGON':
            self.params[3].enabled = True
            self.params[4].enabled = False
            self.params[4].value = None
            self.params[5].enabled = False
            self.params[5].value = None
            self.params[10].enabled = False
            self.params[10].value = None
        elif self.params[2].valueAsText == 'BIN':
            self.params[3].enabled = False
            self.params[3].value = None
            self.params[4].enabled = True
            if self.params[4].valueAsText == 'SQUARE' or self.params[4].valueAsText == 'HEXAGON':
                self.params[10].enabled = False
                self.params[10].value = None
                self.params[5].enabled = True
            elif self.params[4].valueAsText == 'H3':
                self.params[5].enabled = False
                self.params[5].value = None
                self.params[10].enabled = True
                

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        point_layer = self.params[0].value
        polygon_or_bin = self.params[2].valueAsText
        polygon_layer = self.params[3].valueAsText
        bin_size = self.params[5].valueAsText
        time_params = {"interval":6, "repeat":7, "reference":8}
        time_step_interval = self.params[time_params["interval"]].valueAsText
        time_step_repeat = self.params[time_params["repeat"]].valueAsText
        time_step_reference = self.params[time_params["reference"]].valueAsText

        if point_layer:
            try:
                d_layer = arcpy.Describe(self.params[0])
            except:
                d_layer = ""
            # input validation (event layers, https)
            valid_input = validate_input_source(d_layer)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])
            
            # time validation
            validate_time_on_input_desktop(self, d_layer, 0, time_step_interval, time_step_repeat, time_step_reference, time_params)
             
        if polygon_layer:
            try:
                polygon_d_layer = arcpy.Describe(self.params[3])
            except:
                polygon_d_layer = ""
            # input validation (event layers, https)
            valid_input = validate_input_source(polygon_d_layer)
            if not valid_input[0]:
                self.params[3].setIDMessage('ERROR', valid_input[1])

        # set polygon_layer or bin_size as required
        if polygon_or_bin == 'POLYGON':
            if self.params[3].value is None:
                self.params[3].setIDMessage("ERROR", 735)
        elif polygon_or_bin == 'BIN':
            if self.params[4].value is None:
                self.params[4].setIDMessage("ERROR", 735)
            if self.params[4].valueAsText == 'SQUARE' or self.params[4].valueAsText == 'HEXAGON':
                if self.params[5].value is None:
                    self.params[5].setIDMessage("ERROR", 735)
            elif self.params[4].valueAsText == 'H3': 
                if self.params[10].value is None:
                    self.params[10].setIDMessage("ERROR", 735)

        if bin_size:
            if not validate_greater_than_zero(bin_size):
                self.params[5].setIDMessage('ERROR', 323)

        if time_step_interval or time_step_repeat or time_step_reference:
            time_stepping_missing_values(self, time_step_interval, time_step_repeat, time_step_reference, time_params)
