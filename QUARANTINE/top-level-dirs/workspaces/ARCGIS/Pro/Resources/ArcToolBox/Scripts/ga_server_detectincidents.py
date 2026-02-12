"""
 ga_server_detectincidents.py

 Front end of 'Detect Incidents' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context
from gautils.utilities import PortalVersion
from gautils.validation import validate_greater_than_zero, \
    validate_whole_number, validate_output, validate_server_input, validate_time_boundary


if __name__ == '__main__':

    analysis_type = "Detect Incidents"

    time_bound_split, time_bound_split_unit = split_unit(get_value(8))

    params = dict(inputLayer=get_value(0, as_value=True),
                  outputName=get_value(1),
                  trackFields=get_value(2),
                  startConditionExpression=get_value(3), #?
                  endConditionExpression=get_value(4), #?
                  outputMode=get_value(5, dict=d.output_mode),
                  timeBoundarySplit=time_bound_split,
                  timeBoundarySplitUnit=time_bound_split_unit,
                  timeBoundaryReference=get_value(9)
                  )

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(6, dict=d.datastore),
                                    geoanalytics=True)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)
    arcpy.SetParameterAsText(7, output)

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
            self.params[2].filter.list = ["Short", "Long", "BigInteger", "Float", "Double", "Text", "Date"]

        output_name = self.params[1].valueAsText
        if output_name:
            self.params[1].value = validate_output(output_name)

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        time_boundary_params = {"split":8, "reference":9}
        time_boundary_split = self.params[time_boundary_params["split"]].valueAsText
        time_boundary_reference = self.params[time_boundary_params["reference"]].valueAsText

        if time_boundary_reference is not None:
            if time_boundary_split is None:
                self.params[8].setIDMessage("ERROR", 735)


        validate_time_boundary(self, time_boundary_split, time_boundary_reference, time_boundary_params)
        try:
            if PortalVersion() < 5.3:
                if self.params[0].valueAsText:
                    self.params[0].setIDMessage('ERROR', 120184)
                else:
                    self.params[0].setIDMessage('WARNING', 120184)
        except:
            pass

        try:
            if PortalVersion() >= 7.1:  # 10.7
                self.params[8].enabled = True
                self.params[9].enabled = True
            else:
                self.params[8].enabled = False
                self.params[9].enabled = False

        except Exception:
            # In case of exception, keep parameter enabled
            self.params[8].enabled = True
            self.params[9].enabled = True

        input_layer = self.params[0].valueAsText
        if input_layer:
            try:
                d = arcpy.Describe(self.params[0])
            except:
                d = ""

            # Tables now supported, skip shape check if not feature data
            if hasattr(d, 'shapetype'):
                if getattr(d, 'shapetype', None) not in ['Point', 'Polyline',
                                                         'Polygon']:
                    self.params[0].setIDMessage('ERROR', 366)

            validate = validate_server_input(self.params[0].valueAsText)
            if not validate[0]:
                self.params[0].setIDMessage('ERROR', validate[1])