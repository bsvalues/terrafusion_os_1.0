"""
 ga_desktop_reconstructracks.py

 Front end of 'Reconstruct Tracks' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context, run_ga_desktop_tool
from gautils.validation import validate_greater_than_zero, validate_whole_number, \
    validate_input_source, validate_desktop_output, validate_time_boundary, \
    time_validation_desktop_instant_only


if __name__ == '__main__':

    buffer_type = get_value(4)
    buffer_calc = ''
    
    if buffer_type == 'FIELD':
        buffer_calc = '=$feature["{}"]'.format(get_value(5))
    elif buffer_type == 'EXPRESSION':
        buffer_calc = '= {}'.format(get_value(6))

    time_split, time_split_unit = split_unit(get_value(7))
    dist_split, dist_split_unit = split_unit(get_value(8))
    time_bound_split, time_bound_split_unit = split_unit(get_value(9))
    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  output=get_value(1, local_feature_output=True),
                  trackFields=get_value(2, as_list=True),
                  method=get_value(3, dict=d.geodesic).title(),
                  bufferField=buffer_calc,
                  timeSplit=time_split,
                  timeSplitUnit=time_split_unit,
                  summaryFields=get_value(11, as_value=True, val_table='summary_fields'),
                  distanceSplit=dist_split,
                  distanceSplitUnit=dist_split_unit,
                  timeBoundarySplit=time_bound_split,
                  timeBoundarySplitUnit=time_bound_split_unit,
                  timeBoundaryReference=get_value(10, datetime_epoch=True),
                  arcadeSplit=get_value(12),
                  splitBoundaryOption=get_value(13, dict=d.split_type))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    run_ga_desktop_tool('ReconstructTracks', params, {"output":1})



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

        buffer_type = self.params[4].valueAsText
        if buffer_type == 'FIELD':
            self.params[5].enabled = True
            self.params[6].enabled = False
            self.params[6].value = None
        elif buffer_type == 'EXPRESSION':
            self.params[5].enabled = False
            self.params[5].value = None
            self.params[6].enabled = True
        else:
            self.params[5].enabled = False
            self.params[5].value = None
            self.params[6].enabled = False
            self.params[6].value = None

        if self.params[7].value or self.params[8].value or self.params[12].value:
            self.params[13].enabled = True
        else:
            self.params[13].enabled = False

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        input_layer = self.params[0].value
        buffer_type = self.params[4].valueAsText
        time_split = self.params[7].valueAsText
        distance_split = self.params[8].valueAsText
        time_boundary_params = {"split":9, "reference":10}
        time_boundary_split = self.params[time_boundary_params["split"]].valueAsText
        time_boundary_reference = self.params[time_boundary_params["reference"]].valueAsText

        input_fields = []
        if input_layer:
            try:
                d = arcpy.Describe(self.params[0])
            except:
                d = ""

            input_fields = getattr(d, 'fields', [])
            if getattr(d, 'shapetype', None) not in ['Polygon', 'Point']:
                self.params[0].setIDMessage('ERROR', 366)
            
            # validate input time
            time_validation_desktop_instant_only(self.params[0], self.params[0], d)

            # input validation
            valid_input = validate_input_source(d)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])

        if time_split:
            if not validate_greater_than_zero(time_split):
                self.params[7].setIDMessage('ERROR', 323)
            if not validate_whole_number(time_split):
                self.params[7].setIDMessage('ERROR', 1032,
                                            self.params[7].displayName)

        if distance_split:
            if not validate_greater_than_zero(distance_split):
                self.params[8].setIDMessage('ERROR', 323)

        validate_time_boundary(self, time_boundary_split, time_boundary_reference, time_boundary_params)

        if buffer_type == 'FIELD':
            if self.params[5].value is None:
                self.params[5].setIDMessage("ERROR", 735)
        elif buffer_type == 'EXPRESSION':
            if self.params[6].value is None:
                self.params[6].setIDMessage("ERROR", 735)
