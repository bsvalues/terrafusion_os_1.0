"""
 ga_server_findhotspots.py

 Front end of 'Find Hot Spots' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context
from gautils.validation import validate_output, validate_units_greater_than, validate_greater_than_zero, validate_whole_number, validate_server_input
from gautils.utilities import PortalVersion


if __name__ == '__main__':

    analysis_type = "Find Hot Spots"

    bin_dist, bin_dist_unit = split_unit(get_value(2))
    neigh_dist, neigh_dist_unit = split_unit(get_value(3))
    time_int, time_int_unit = split_unit(get_value(4))

    params = dict(pointLayer=get_value(0, as_value=True),
                  outputName=get_value(1),
                  binSize=bin_dist,
                  binSizeUnit=bin_dist_unit,
                  neighborhoodDistance=neigh_dist,
                  neighborhoodDistanceUnit=neigh_dist_unit,
                  timeStepInterval=time_int,
                  timeStepIntervalUnit=time_int_unit,
                  timeStepAlignment=get_value(5, dict=d.time_alignment),
                  timeStepReference=get_value(6))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(8, dict=d.datastore),
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
        # self.params[7].enabled = False

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""

        output_name = self.params[1].valueAsText
        time_step_alignment = self.params[5].valueAsText

        if output_name:
            self.params[1].value = validate_output(output_name)

        if time_step_alignment == 'REFERENCE_TIME':
            self.params[6].enabled = True
        else:
            self.params[6].enabled = False

        if PortalVersion() < 10.3:  # 11.1
            self.params[2].filter.list = list(d.linear_units_old.values())
        if PortalVersion() < 10.3:  # 11.1
            self.params[3].filter.list = list(d.linear_units_old.values())

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        point_layer = self.params[0].valueAsText
        bin_size = self.params[2].valueAsText
        neighborhood_size = self.params[3].valueAsText
        time_step_interval = self.params[4].valueAsText
        time_step_alignment = self.params[5].value
        time_step_reference = self.params[6].value

        if time_step_alignment == "REFERENCE_TIME":
            if time_step_reference is None:
                self.params[6].setIDMessage("ERROR", 735)
            if time_step_interval is None:
                self.params[4].setIDMessage("ERROR", 735)

        # set bin_size and neighborhood_size as required
        if self.params[2].value is None:
            self.params[2].setIDMessage("ERROR", 735)
        if self.params[3].value is None:
            self.params[3].setIDMessage("ERROR", 735)

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
            bin_value = float(bin_size.split(' ')[0].replace(',', '.'))
            if bin_value <= 0:
                self.params[2].setIDMessage('ERROR', 531)

        if neighborhood_size:
            neighborhood_value = float(
                neighborhood_size.split(' ')[0].replace(',', '.'))
            if neighborhood_value <= 0:
                self.params[3].setIDMessage('ERROR', 531)

        if bin_size and neighborhood_size:
            if not validate_units_greater_than(neighborhood_size, bin_size):
                self.params[3].setIDMessage('ERROR', 120055)

        if time_step_alignment == "REFERENCE_TIME":
            if self.params[6].value is None:
                self.params[6].setIDMessage("ERROR", 735)

        if time_step_interval:
            if not validate_greater_than_zero(time_step_interval):
                self.params[4].setIDMessage('ERROR', 323)
            if not validate_whole_number(time_step_interval):
                self.params[4].setIDMessage('ERROR', 1032,
                                            self.params[4].displayName)
