"""
 ga_server_aggregatepoints.py

 Front end of 'Aggregate Points' GeoAnalytics Server tool.

"""
import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context
from gautils.validation import validate_output, validate_greater_than_zero, validate_server_input,\
    time_stepping_missing_values
from gautils.utilities import PortalVersion


if __name__ == '__main__':

    analysis_type = "Aggregate Points"

    bin_size, bin_size_unit = split_unit(get_value(5))
    time_step_int, time_step_int_unit = split_unit(get_value(6))
    time_step_rep, time_step_rep_unit = split_unit(get_value(7))

    params = dict(pointLayer=get_value(0, as_value=True),
                  outputName=get_value(1),
                  polygonLayer=get_value(3, as_value=True) if get_value(2) == 'POLYGON' else None,
                  binType=get_value(4),
                  binSize=bin_size,
                  binSizeUnit=bin_size_unit,
                  binResolution=get_value(12),
                  timeStepInterval=time_step_int,
                  timeStepIntervalUnit=time_step_int_unit,
                  timeStepRepeatInterval=time_step_rep,
                  timeStepRepeatIntervalUnit=time_step_rep_unit,
                  timeStepReference=get_value(8),
                  summaryFields=get_value(9, as_value=True, val_table='summary_fields'))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(11, dict=d.datastore),
                                    geoanalytics=True)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)
    arcpy.SetParameterAsText(10, output)

    

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
            self.params[9].filters[0].list = ["Short", "Long", "BigInteger", "Float", "Double", "Text",
                                     "Date"]

        output_name = self.params[1].valueAsText
        if output_name:
            self.params[1].value = validate_output(output_name)

        if PortalVersion() < 10.3:  # 11.1
            self.params[5].filter.list = list(d.linear_units_old.values())
            
        if PortalVersion() < 2023.2:  # 11.2
            self.params[4].filter.list = ["SQUARE", "HEXAGON"]

        if self.params[2].valueAsText == 'POLYGON':
            self.params[3].enabled = True
            self.params[4].enabled = False
            self.params[4].value = None
            self.params[5].enabled = False
            self.params[5].value = None
            self.params[12].enabled = False
            self.params[12].value = None
        elif self.params[2].valueAsText == 'BIN':
            self.params[3].enabled = False
            self.params[3].value = None
            self.params[4].enabled = True
            if self.params[4].valueAsText == 'SQUARE' or self.params[4].valueAsText == 'HEXAGON':
                self.params[12].enabled = False
                self.params[12].value = None
                self.params[5].enabled = True
            elif self.params[4].valueAsText == 'H3':
                self.params[5].enabled = False
                self.params[5].value = None
                self.params[12].enabled = True

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        point_layer = self.params[0].valueAsText
        polygon_or_bin = self.params[2].valueAsText
        polygon_layer = self.params[3].valueAsText
        bin_size = self.params[5].valueAsText
        time_params = {"interval":6, "repeat":7, "reference":8}
        time_step_interval = self.params[time_params["interval"]].valueAsText
        time_step_repeat = self.params[time_params["repeat"]].valueAsText
        time_step_reference = self.params[time_params["reference"]].valueAsText


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
                if self.params[12].value is None:
                    self.params[12].setIDMessage("ERROR", 735)

        if polygon_layer:
            try:
                d = arcpy.Describe(self.params[3])
            except:
                d = ""
            if getattr(d, 'shapetype', None) != 'Polygon':
                self.params[3].setIDMessage('ERROR', 366)
            validate = validate_server_input(self.params[3].valueAsText)
            if not validate[0]:
                self.params[3].setIDMessage('ERROR', validate[1])

        if point_layer:
            try:
                d = arcpy.Describe(self.params[0])
            except:
                d = ""
            if getattr(d, 'shapetype', None) != 'Point':
                self.params[0].setIDMessage('ERROR', 366)
            validate = validate_server_input(self.params[0].valueAsText)
            if not validate[0]:
                self.params[0].setIDMessage('ERROR', validate[1])

        if bin_size:
            if not validate_greater_than_zero(bin_size):
                self.params[5].setIDMessage('ERROR', 323)

        if time_step_interval or time_step_repeat or time_step_reference:
            time_stepping_missing_values(self, time_step_interval, time_step_repeat, time_step_reference, time_params)
