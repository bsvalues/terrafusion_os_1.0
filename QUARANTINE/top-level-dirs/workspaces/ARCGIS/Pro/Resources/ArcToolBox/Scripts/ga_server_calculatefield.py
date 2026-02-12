"""
 ga_server_calculatefield.py

 Front end of 'Calculate Field' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context
from gautils.validation import validate_output, validate_server_input, validate_server_input, validate_time_boundary
from gautils.utilities import PortalVersion


if __name__ == '__main__':

    analysis_type = "Calculate Field"

    time_bound_split, time_bound_split_unit = split_unit(get_value(9))

    params = dict(inputLayer=get_value(0, as_value=True),
                  outputName=get_value(1),
                  fieldName=get_value(2),
                  dataType=get_value(3, dict=d.datatype),
                  expression=get_value(4),
                  trackAware=get_value(5, as_value=True),
                  trackFields=get_value(6),
                  timeBoundarySplit=time_bound_split,
                  timeBoundarySplitUnit=time_bound_split_unit,
                  timeBoundaryReference=get_value(10)
                  )

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(7, dict=d.datastore),
                                    geoanalytics=True)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)
    arcpy.SetParameterAsText(8, output)

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
        # self.params[6].enabled = False

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        
        # Support for bigint
        if PortalVersion() >= 2023.2: # 11.2
            self.params[6].filter.list = ["Short", "Long", "BigInteger", "Float", "Double", "Text", "Date"]

        if self.params[5].value and PortalVersion() >= 7.1: #10.7
            self.params[6].enabled = True
            self.params[9].enabled = True
            self.params[10].enabled = True
        else:
            self.params[6].enabled = False
            self.params[9].enabled = False
            self.params[10].enabled = False

        output_name = self.params[1].valueAsText
        if output_name:
            self.params[1].value = validate_output(output_name)

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        if PortalVersion() < 6.1:
            if self.params[0].valueAsText:
                self.params[0].setIDMessage('ERROR', 120184)
            else:
                self.params[0].setIDMessage('WARNING', 120184)

        


        validate = validate_server_input(self.params[0].valueAsText)
        if not validate[0]:
            self.params[0].setIDMessage('ERROR', validate[1])

        if self.params[5].value == True:
            if self.params[6].value is None:
                self.params[6].setIDMessage("ERROR", 735)

        if self.params[10].value is not None:
            if self.params[9].value is None:
                self.params[9].setIDMessage("ERROR", 735)

        try:
            if PortalVersion() < 5.3:
                if self.params[0].valueAsText:
                    self.params[0].setIDMessage('ERROR', 120184)
                else:
                    self.params[0].setIDMessage('WARNING', 120184)
        except:
            pass

        try:
            if PortalVersion() < 7.1:  # 10.7
                self.params[9].enabled = False
                self.params[10].enabled = False
            else:
                time_boundary_params = {"split":9, "reference":10}
                time_boundary_split = self.params[time_boundary_params["split"]].valueAsText
                time_boundary_reference = self.params[time_boundary_params["reference"]].valueAsText
                validate_time_boundary(self, time_boundary_split, time_boundary_reference, time_boundary_params)

        except Exception:
            # In case of exception, keep parameter enabled
            self.params[9].enabled = True
            self.params[10].enabled = True
