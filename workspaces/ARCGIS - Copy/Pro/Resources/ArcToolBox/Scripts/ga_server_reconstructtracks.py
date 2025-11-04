"""
 ga_server_reconstructtracks.py

 Front end of 'Reconstruct Tracks' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context
from gautils.utilities import PortalVersion
from gautils.validation import validate_output, validate_greater_than_zero,\
   validate_whole_number, validate_server_input, validate_time_boundary


if __name__ == '__main__':

    analysis_type = "Reconstruct Tracks"

    buffer_type = get_value(4)
    buffer_calc = ''
    
    if buffer_type == 'FIELD':
        if PortalVersion() >= 5.3:  # 10.6
            buffer_calc = '=$feature["{}"]'.format(get_value(5))
        else:
            buffer_calc = get_value(5)
    elif buffer_type == 'EXPRESSION':
        buffer_calc = '= {}'.format(get_value(6))

    time_split, time_split_unit = split_unit(get_value(7))
    dist_split, dist_split_unit = split_unit(get_value(11))
    time_bound_split, time_bound_split_unit = split_unit(get_value(12))

    params = dict(inputLayer=get_value(0, as_value=True),
                  outputName=get_value(1),
                  trackFields=get_value(2),
                  method=get_value(3, dict=d.geodesic),
                  bufferField=buffer_calc,
                  timeSplit=time_split,
                  timeSplitUnit=time_split_unit,
                  summaryFields=get_value(8, as_value=True, val_table='summary_fields'),
                  distanceSplit=dist_split,
                  distanceSplitUnit=dist_split_unit,
                  timeBoundarySplit=time_bound_split,
                  timeBoundarySplitUnit=time_bound_split_unit,
                  timeBoundaryReference=get_value(13),
                  arcadeSplit=get_value(14)
                  )

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(10, dict=d.datastore),
                                    geoanalytics=True)

    if PortalVersion() >= 8.3:
        params['splitBoundaryOption']=get_value(15, dict=d.split_type)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)
    arcpy.SetParameterAsText(9, output)

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        # self.params[0].filter.list = ['BigDataFileShare']
        self.once = True

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""
        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""

        # Support for bigint
        if PortalVersion() >= 2023.2: # 11.2
            self.params[2].filter.list = ["Short", "Long", "BigInteger", "Float", "Double", "Text", "Date"]
            self.params[5].filter.list = ["Short", "Long", "BigInteger", "Float", "Double", "Text"]
            self.params[8].filters[0].list = ["Short", "Long", "BigInteger", "Float", "Double", "Text",
                                     "Date"]

        if self.once:
            self.once = False
            try:
                if PortalVersion() >= 5.3:  # 10.6
                    self.params[11].enabled = True
                    if PortalVersion() < 10.3:  # 11.1
                        self.params[11].filter.list = list(d.linear_units_old.values())
                else:
                    self.params[11].enabled = False

                if PortalVersion() >= 7.1:  # 10.7
                    self.params[12].enabled = True
                    self.params[13].enabled = True
                else:
                    self.params[12].enabled = False
                    self.params[13].enabled = False

            except Exception:
                # In case of exception, keep parameter enabled
                self.params[11].enabled = True
                self.params[12].enabled = True
                self.params[13].enabled = True

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

        if PortalVersion() >= 8.1:
            # First and Last statistics are introduced at 10.8.1
            self.params[8].filters[1].list = ["COUNT", "SUM", "MEAN", "MIN",
                                              "MAX", "STDDEV", "VAR", "RANGE",
                                              "ANY", "FIRST", "LAST"]
        else:
            self.params[8].filters[1].list = ["COUNT", "SUM", "MEAN", "MIN",
                                              "MAX", "STDDEV", "VAR", "RANGE",
                                              "ANY"]
        if PortalVersion() >= 8.3:
            # Split expression and options are introduced at 10.9
            self.params[14].enabled = True
            if self.params[7].value or self.params[11].value or self.params[14].value:
                self.params[15].enabled = True
            else:
                self.params[15].enabled = False
        else:
            self.params[14].enabled = False
            self.params[15].enabled = False
            self.params[15].value = ""

        output_name = self.params[1].valueAsText
        if output_name:
            self.params[1].value = validate_output(output_name)


    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        input_layer = self.params[0].valueAsText
        buffer_type = self.params[4].valueAsText
        time_split = self.params[7].valueAsText
        distance_split = self.params[11].valueAsText
        time_boundary_params = {"split":12, "reference":13}
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
            validate = validate_server_input(self.params[0].valueAsText)
            if not validate[0]:
                self.params[0].setIDMessage('ERROR', validate[1])

        if time_split:
            if not validate_greater_than_zero(time_split):
                self.params[7].setIDMessage('ERROR', 323)
            if not validate_whole_number(time_split):
                self.params[7].setIDMessage('ERROR', 1032,
                                            self.params[7].displayName)

        if distance_split:
            if not validate_greater_than_zero(distance_split):
                self.params[11].setIDMessage('ERROR', 323)

        validate_time_boundary(self, time_boundary_split, time_boundary_reference, time_boundary_params)

        if buffer_type == 'FIELD':
            if self.params[5].value is None:
                self.params[5].setIDMessage("ERROR", 735)
        elif buffer_type == 'EXPRESSION':
            if self.params[6].value is None:
                self.params[6].setIDMessage("ERROR", 735)