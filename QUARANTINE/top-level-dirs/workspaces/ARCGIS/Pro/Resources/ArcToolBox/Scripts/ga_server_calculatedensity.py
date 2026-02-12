"""
 ga_server_calculatedensity.py

 Front end of 'Calculate Density' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context
from gautils.validation import validate_output, validate_greater_than_zero, \
    validate_server_input
from gautils.validation import validate_units_greater_than, time_stepping_missing_values
from gautils.utilities import PortalVersion


if __name__ == '__main__':

    analysis_type = "Calculate Density"

    bin_size, bin_size_unit = split_unit(get_value(3))
    neigh_size, neigh_size_unit = split_unit(get_value(5))
    time_step_int, time_step_int_unit = split_unit(get_value(8))
    time_step_rep, time_step_rep_unit = split_unit(get_value(9))
    if PortalVersion() < 10.3:  # 11.1
        aunits = get_value(7, dict=d.area_units_old)
    else:
        aunits = get_value(7, dict=d.area_units)

    params = dict(inputLayer=get_value(0, as_value=True),
                  outputName=get_value(1),
                  binType=get_value(2),
                  binSize=bin_size,
                  binSizeUnit=bin_size_unit,
                  weight=get_value(4),
                  radius=neigh_size,
                  radiusUnit=neigh_size_unit,
                  fields=get_value(6),
                  areaUnits=aunits,
                  timeStepInterval=time_step_int,
                  timeStepIntervalUnit=time_step_int_unit,
                  timeStepRepeatInterval=time_step_rep,
                  timeStepRepeatIntervalUnit=time_step_rep_unit,
                  timeStepReference=get_value(10))

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
        if PortalVersion() < 10.3:  # 11.1
            self.params[7].filter.list = list(d.area_units_old.keys())  # area units

        if PortalVersion() < 10.3:  # 11.1
            self.params[3].filter.list = list(d.linear_units_old.values())  # bin size
  
        # Support for bigint
        if PortalVersion() >= 2023.2: # 11.2
            self.params[6].filter.list = ["Short", "Long", "BigInteger", "Float", "Double"]

        output_name = self.params[1].valueAsText
        if output_name:
            self.params[1].value = validate_output(output_name)

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        point_layer = self.params[0].valueAsText
        bin_size = self.params[3].valueAsText
        neighborhood_size = self.params[5].valueAsText
        time_params = {"interval":8, "repeat":9, "reference":10}
        time_step_interval = self.params[time_params["interval"]].valueAsText
        time_step_repeat = self.params[time_params["repeat"]].valueAsText
        time_step_reference = self.params[time_params["reference"]].valueAsText

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
                self.params[3].setIDMessage('ERROR', 323)

        if neighborhood_size:
            if not validate_greater_than_zero(neighborhood_size):
                self.params[5].setIDMessage('ERROR', 323)

        if bin_size and neighborhood_size:
            if not validate_units_greater_than(neighborhood_size, bin_size):
                self.params[5].setIDMessage('ERROR', 120055)

        if time_step_interval or time_step_repeat or time_step_reference:
            time_stepping_missing_values(self, time_step_interval, time_step_repeat, time_step_reference, time_params)



