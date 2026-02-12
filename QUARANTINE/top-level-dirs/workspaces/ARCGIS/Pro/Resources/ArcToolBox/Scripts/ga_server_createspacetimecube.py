"""
 ga_server_createspacetimecube.py

 Front end of 'Create Space Time Cube' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context
import os
from gautils.validation import validate_output, validate_greater_than_zero, \
    validate_whole_number, validate_server_input
from gautils.utilities import PortalVersion


if __name__ == '__main__':

    analysis_type = "Create Space Time Cube"

    dist_int, dist_int_unit = split_unit(get_value(2))
    time_step_int, time_step_int_unit = split_unit(get_value(3))

    params = dict(pointLayer=get_value(0, as_value=True),
                  outputName=get_value(1),
                  binSize=dist_int,
                  binSizeUnit=dist_int_unit,
                  timeStepInterval=time_step_int,
                  timeStepIntervalUnit=time_step_int_unit,
                  timeStepAlignment=get_value(4, dict=d.time_alignment),
                  timeStepReference=get_value(5),
                  summaryFields=get_value(6, as_value=True,
                                          val_table='summary_fields_plus')
                  )

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    geoanalytics=True)

    # Different behavior from other summaryFields parameters if default is used
    # (will fail otherwise)
    if params['summaryFields'] == 'null':
        _ = params.pop('summaryFields', 0)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)

    arcpy.AddIDMessage('INFORMATIVE', 86174)

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
        # self.params[5].enabled = False
        # self.params[6].enabled = False  # TODO: Reintroduce later past 10.5 beta

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        
        # Support for bigint
        if PortalVersion() >= 2023.2: # 11.2
            self.params[6].filters[0].list = ["Short", "Long", "BigInteger", "Float", "Double"]

        output_name = self.params[1].valueAsText
        if output_name:
            name, ext = os.path.splitext(output_name)
            if ext.lower() == '.nc':
                new_output_name = validate_output(name)
            else:
                new_output_name = validate_output(output_name)

            self.params[1].value = u'{}.nc'.format(new_output_name)

        if self.params[4].valueAsText == 'REFERENCE_TIME':
            self.params[5].enabled = True
        else:
            self.params[5].enabled = False

        if PortalVersion() < 10.3:  # 11.1
            self.params[2].filter.list = list(d.linear_units_old.values())

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        point_layer = self.params[0].valueAsText
        distance_interval = self.params[2].valueAsText
        time_step_interval = self.params[3].valueAsText
        time_step_alignment = self.params[4].value
        time_reference = self.params[5].value

        if time_step_alignment == "REFERENCE_TIME":
            if time_reference is None:
                self.params[5].setIDMessage("ERROR", 735)

        if point_layer:
            try:
                d = arcpy.Describe(self.params[0])
            except:
                d = 0
            if getattr(d, 'shapetype', None) != 'Point':
                self.params[0].setIDMessage('ERROR', 366)
            validate = validate_server_input(self.params[0].valueAsText)
            if not validate[0]:
                self.params[0].setIDMessage('ERROR', validate[1])

        if distance_interval:
            if not validate_greater_than_zero(distance_interval):
                self.params[2].setIDMessage('ERROR', 323)

        if time_step_interval:
            if not validate_greater_than_zero(time_step_interval):
                self.params[3].setIDMessage('ERROR', 323)
            if not validate_whole_number(time_step_interval):
                self.params[3].setIDMessage('ERROR', 1032,
                                            self.params[3].displayName)


