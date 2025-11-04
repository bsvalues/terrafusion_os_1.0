"""
 ga_desktop_createbuffers.py

 Front end of 'Create Buffers' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context, run_ga_desktop_tool
from gautils.validation import validate_greater_than_zero, validate_input_source, \
    validate_desktop_output


if __name__ == '__main__':

    buffer_type = get_value(3)
    dist, dist_unit, buffer_calc = None, None, None
    if buffer_type in 'FIELD':
        buffer_calc = get_value(4)
    elif buffer_type == 'DISTANCE':
        dist, dist_unit = split_unit(get_value(5))
    elif buffer_type == 'EXPRESSION':
        buffer_calc = u'= {}'.format(get_value(6))

    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  output=get_value(1, local_feature_output=True),
                  method=get_value(2, d.geodesic).title(),
                  distance=dist,
                  distanceUnit=dist_unit,
                  field=buffer_calc,
                  dissolveOption=get_value(7, dict=d.dissolve).title(),
                  dissolveFields=get_value(8, as_list=True),
                  summaryFields=get_value(9, as_value=True, val_table='summary_fields'),
                  multipart=get_value(10, dict=d.multipart))
                  
    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    run_ga_desktop_tool('CreateBuffers', params, {"output":1})


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

        buffer_type = self.params[3].valueAsText
        if buffer_type == 'FIELD':
            self.params[4].enabled = True
            self.params[5].enabled = False
            self.params[5].value = None
            self.params[6].enabled = False
            self.params[6].value = None
        elif buffer_type == 'DISTANCE':
            self.params[4].enabled = False
            self.params[4].value = None
            self.params[5].enabled = True
            self.params[6].enabled = False
            self.params[6].value = None
        elif buffer_type == 'EXPRESSION':
            self.params[4].enabled = False
            self.params[4].value = None
            self.params[5].enabled = False
            self.params[5].value = None
            self.params[6].enabled = True
        else:
            self.params[4].enabled = False
            self.params[4].value = None
            self.params[5].enabled = False
            self.params[5].value = None
            self.params[6].enabled = False
            self.params[6].value = None

        dissolve_type = self.params[7].valueAsText
        if dissolve_type in ('LIST', 'ALL'):
            self.params[9].enabled = True
            self.params[10].enabled = True
        else:
            self.params[9].enabled = False
            self.params[9].value = None
            self.params[10].enabled = False
            self.params[10].value = None

        if dissolve_type == 'LIST':
            self.params[8].enabled = True
        else:
            self.params[8].enabled = False
            self.params[8].value = None

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
        buff_type = self.params[3].valueAsText
        dissolve_option = self.params[7].valueAsText

        input_features = self.params[0].valueAsText
        buffer_distance = self.params[5].valueAsText

        if input_features:
            try:
                d_input = arcpy.Describe(self.params[0])
            except:
                d_input = ""
            # input validation (event layers)
            valid_input = validate_input_source(d_input)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])

            if buffer_distance:
                if not validate_greater_than_zero(buffer_distance):
                    if hasattr(d_input, 'shapetype'):
                        if getattr(d_input, 'shapetype', None) in ['Polyline',
                                                                   'Point']:
                            self.params[5].setIDMessage('ERROR', 323)

        if buff_type == 'FIELD':
            if self.params[4].value is None:
                self.params[4].setIDMessage("ERROR", 735)
        if buff_type == 'DISTANCE':
            if self.params[5].value is None:
                self.params[5].setIDMessage("ERROR", 735)
        if buff_type == 'EXPRESSION':
            if self.params[6].value is None:
                self.params[6].setIDMessage("ERROR", 735)

        if dissolve_option == 'LIST':
            if self.params[8].value is None:
                self.params[8].setIDMessage("ERROR", 735)
