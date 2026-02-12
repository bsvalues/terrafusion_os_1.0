"""
 ga_server_createbuffers.py

 Front end of 'Create Buffers' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context
from gautils.validation import validate_output, validate_greater_than_zero,\
   validate_server_input
from gautils.utilities import PortalVersion

if __name__ == '__main__':

    analysis_type = "Create Buffers"

    buffer_type = get_value(3)
    dist, dist_unit, buffer_calc = None, None, None
    if buffer_type in 'FIELD':
        buffer_calc = get_value(4)
    elif buffer_type == 'DISTANCE':
        dist, dist_unit = split_unit(get_value(5))
    elif buffer_type == 'EXPRESSION':
        buffer_calc = u'= {}'.format(get_value(6))

    params = dict(inputLayer=get_value(0, as_value=True),
                  outputName=get_value(1),
                  method=get_value(2, d.geodesic),
                  distance=dist,
                  distanceUnit=dist_unit,
                  field=buffer_calc,
                  dissolveOption=get_value(7, dict=d.dissolve),
                  dissolveFields=get_value(8),
                  summaryFields=get_value(9, as_value=True, val_table='summary_fields'),
                  multipart=get_value(10, dict=d.multipart))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(12, dict=d.datastore),
                                    geoanalytics=True)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)
    arcpy.SetParameterAsText(11, output)

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
        
        # Support for bigint
        if PortalVersion() >= 2023.2: # 11.2
            self.params[4].filter.list = ["Short", "Long", "BigInteger", "Float", "Double", "Text"]
            self.params[8].filter.list = ["Short", "Long", "BigInteger", "Float", "Double", "Text", "Date"]
            self.params[9].filters[0].list = ["Short", "Long", "BigInteger", "Float", "Double", "Text",
                                     "Date"]

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

        if PortalVersion() < 10.3:  # 11.1
            self.params[5].filter.list = list(d.linear_units_old.values())

        output_name = self.params[1].valueAsText
        if output_name:
            self.params[1].value = validate_output(output_name)

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        input_layer = self.params[0].valueAsText
        buffer_distance = self.params[5].valueAsText

        if input_layer:
            if buffer_distance:
                if not validate_greater_than_zero(buffer_distance):
                    try:
                        d_input = arcpy.Describe(self.params[0])
                    except:
                        d_input = ""
                    if hasattr(d_input, 'shapetype'):
                        if getattr(d_input, 'shapetype', None) in ['Polyline',
                                                                   'Point']:
                            self.params[5].setIDMessage('ERROR', 323)
            validate = validate_server_input(self.params[0].valueAsText)
            if not validate[0]:
                self.params[0].setIDMessage('ERROR', validate[1])

        if self.params[3].value == 'FIELD':
            if self.params[4].value is None:
                self.params[4].setIDMessage("ERROR", 735)
        elif self.params[3].value == 'DISTANCE':
            if self.params[5].value is None:
                self.params[5].setIDMessage("ERROR", 735)
        elif self.params[3].value == 'EXPRESSION':
            if self.params[6].value is None:
                self.params[6].setIDMessage("ERROR", 735)

        if input_layer:
            try:
                d = arcpy.Describe(self.params[0])
            except:
                d = ""

            if getattr(d, 'shapetype', None) not in ['Polygon', 'Polyline',
                                                     'Point']:
                self.params[0].setIDMessage('ERROR', 366)

