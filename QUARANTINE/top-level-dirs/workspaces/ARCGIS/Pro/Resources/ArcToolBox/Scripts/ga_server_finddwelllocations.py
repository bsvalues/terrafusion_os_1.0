"""
 ga_server_finddwelllocations.py

 Front end of 'Find Dwell Locations' GeoAnalytics server tool.

"""

import time
import sys

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context
from gautils.validation import validate_greater_than_zero, \
    validate_whole_number, validate_server_input, validate_time_units_greater_than, validate_server_input, validate_time_boundary
from gautils.utilities import PortalVersion


if __name__ == '__main__':

    analysis_type = "Find Dwell Locations"

    dist_tolerance, dist_tolerance_unit = split_unit(get_value(4))
    time_tolerance, time_tolerance_unit = split_unit(get_value(5))
    time_bound_split, time_bound_split_unit = split_unit(get_value(10))

    params = dict(inputLayer=get_value(0, as_value=True),
                  outputName=get_value(1),
                  trackFields=get_value(2),
                  distanceMethod=get_value(3, dict=d.geodesic),
                  outputType=get_value(6, dict=d.dwell_type),
                  distanceTolerance=dist_tolerance,
                  distanceToleranceUnit=dist_tolerance_unit,
                  timeTolerance=time_tolerance,
                  timeToleranceUnit=time_tolerance_unit,
                  summaryFields=get_value(7, as_value=True, val_table='summary_fields'),
                  timeBoundarySplit=time_bound_split,
                  timeBoundarySplitUnit=time_bound_split_unit,
                  timeBoundaryReference=get_value(11))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(8, dict=d.datastore),
                                    geoanalytics=True)

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

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        
        # Support for bigint
        if PortalVersion() >= 2023.2: # 11.2
            self.params[2].filter.list = ["Short", "Long", "BigInteger", "Float", "Double", "Text"]
            self.params[7].filters[0].list = ["Short", "Long", "BigInteger", "Float", "Double", "Text",
                                     "Date"]

        # allow summary stats for certain outut types
        output_type = self.params[6].valueAsText
        if output_type in ['DWELL_FEATURES', 'ALL_FEATURES']:
            self.params[7].enabled = False
            self.params[7].value = None
        else:
            self.params[7].enabled = True
            if PortalVersion() >= 8.1:
                # First and Last statistics are introduced at 10.8.1
                self.params[7].filters[1].list = ["COUNT", "SUM", "MEAN", "MIN",
                                                  "MAX", "STDDEV", "VAR",
                                                  "RANGE", "ANY",
                                                  "FIRST", "LAST"]
            else:
                self.params[7].filters[1].list = ["COUNT", "SUM", "MEAN", "MIN",
                                                  "MAX", "STDDEV", "VAR",
                                                  "RANGE", "ANY"]
        if PortalVersion() >= 8.1:
            self.params[10].enabled = True
            self.params[11].enabled = True
        else:
            self.params[10].enabled = False
            self.params[11].enabled = False

        if PortalVersion() < 10.3:  # 11.1
            self.params[4].filter.list = list(d.linear_units_old.values())


    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        if PortalVersion() < 7.3:
            if self.params[0].valueAsText:
                self.params[0].setIDMessage('ERROR', 120184)
            else:
                self.params[0].setIDMessage('WARNING', 120184)

        input_layer = self.params[0].value
        distance_tolerance = self.params[4].valueAsText
        time_tolerance = self.params[5].valueAsText
        time_split = self.params[10].valueAsText

        input_fields = []
        if input_layer:
            try:
                d = arcpy.Describe(self.params[0])
            except:
                d = ""
            input_fields = getattr(d, 'fields', [])
            if getattr(d, 'shapetype', None) not in ['Point']:
                self.params[0].setIDMessage('ERROR', 366)
            validate = validate_server_input(self.params[0].valueAsText)
            if not validate[0]:
                self.params[0].setIDMessage('ERROR', validate[1])

        if distance_tolerance:
            if not validate_greater_than_zero(distance_tolerance):
                self.params[4].setIDMessage('ERROR', 323)

        if time_tolerance:
            if not validate_greater_than_zero(time_tolerance):
                self.params[5].setIDMessage('ERROR', 323)
            if not validate_whole_number(time_tolerance):
                self.params[5].setIDMessage('ERROR', 1032,
                                            self.params[5].displayName)

        if time_tolerance and time_split:
            if not validate_time_units_greater_than(time_split, time_tolerance):
                self.params[10].setIDMessage('ERROR', 120302)

        time_boundary_params = {"split":10, "reference":11}
        time_boundary_split = self.params[time_boundary_params["split"]].valueAsText
        time_boundary_reference = self.params[time_boundary_params["reference"]].valueAsText
        validate_time_boundary(self, time_boundary_split, time_boundary_reference, time_boundary_params)


    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True