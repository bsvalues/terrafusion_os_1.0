"""
 ga_server_summarizeattributes.py

 Front end of 'Summarize Attributes' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context
from gautils.utilities import PortalVersion
from gautils.validation import validate_output, validate_server_input, validate_greater_than_zero,\
    time_stepping_missing_values


if __name__ == '__main__':

    analysis_type = "Summarize Attributes"
    
    # Portal version must be greater than or equal to 10.9 for time stepping params
    if PortalVersion() > 8.2:

        time_step_int, time_step_int_unit = split_unit(get_value(6))
        time_step_rep, time_step_rep_unit = split_unit(get_value(7))

        params = dict(inputLayer=get_value(0, as_value=True),
                  outputName=get_value(1),
                  fields=get_value(2),
                  summaryFields=get_value(3, as_value=True, val_table='summary_fields'),
                  timeStepInterval=time_step_int,
                  timeStepIntervalUnit=time_step_int_unit,
                  timeStepRepeatInterval=time_step_rep,
                  timeStepRepeatIntervalUnit=time_step_rep_unit,
                  timeStepReference=get_value(8),
                  )

    else:
        params = dict(inputLayer=get_value(0, as_value=True),
                      outputName=get_value(1),
                      fields=get_value(2),
                      summaryFields=get_value(3, as_value=True, val_table='summary_fields')
                      )

    # outputCoordinateSystem is not necessary
    params['context'] = set_context(spatial_ref=None,
                                    extent=arcpy.env.extent,
                                    data_store=get_value(5, dict=d.datastore),
                                    geoanalytics=True)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)
    arcpy.SetParameterAsText(4, output)

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
            self.params[2].filter.list = ["Short", "Long", "BigInteger", "Float", "Double", "Text", "Date"]
            self.params[3].filters[0].list = ["Short", "Long", "BigInteger", "Float", "Double", "Text",
                                     "Date"]

        output_name = self.params[1].valueAsText
        if output_name:
            self.params[1].value = validate_output(output_name)
        
        # Time stepping parameters are hidden if the version is less than or equal to 10.8.1
        if PortalVersion() <= 8.2:
            self.params[6].enabled = False
            self.params[7].enabled = False
            self.params[8].enabled = False
            self.params[6].value == None
            self.params[7].value == None
            self.params[8].value == None
        else:
            self.params[6].enabled = True
            self.params[7].enabled = True
            self.params[8].enabled = True


    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        time_params = {"interval":6, "repeat":7, "reference":8}
        time_step_interval = self.params[time_params["interval"]].valueAsText
        time_step_repeat = self.params[time_params["repeat"]].valueAsText
        time_step_reference = self.params[time_params["reference"]].valueAsText

        validate = validate_server_input(self.params[0].valueAsText)
        if not validate[0]:
            self.params[0].setIDMessage('ERROR', validate[1])
        
        if time_step_interval or time_step_repeat or time_step_reference:
            time_stepping_missing_values(self, time_step_interval, time_step_repeat, time_step_reference, time_params)

