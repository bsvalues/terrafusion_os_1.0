"""
 ga_server_groupbyproximity.py

 Front end of 'GroupByProximity' GeoAnalytics Server tool.

"""

import arcpy
from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context, run_ga_desktop_tool, split_unit
from gautils.utilities import PortalVersion
from gautils.validation import validate_output, validate_greater_than_zero, \
    validate_server_input, validate_whole_number


if __name__ == '__main__':
    analysis_type = "Group By Proximity"

    near_dist, near_dist_unit = split_unit(get_value(3))
    temp_dist, temp_dist_unit = split_unit(get_value(5))

    params = dict(inputFeatures=get_value(0, as_value = True),
                  outputName=get_value(1),
                  spatialRelationship=get_value(2, dict=d.spatial),
                  spatialNearDistance=near_dist,
                  spatialNearDistanceUnit=near_dist_unit,
                  temporalRelationship=get_value(4, dict=d.temporal),
                  temporalNearDistance=temp_dist,
                  temporalNearDistanceUnit=temp_dist_unit)

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                arcpy.env.extent,
                                data_store=get_value(6, dict=d.datastore),
                                geoanalytics=True)

    if PortalVersion() >= 10.1: # only available at or after Portal 11.0
        params['attributeRelationship']=get_value(8)

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

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        output_name = self.params[1].valueAsText
        if output_name:
            self.params[1].value = validate_output(output_name)

        if PortalVersion() < 10.3:  # 11.1
            self.params[3].filter.list = list(d.linear_units_old.values())

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
        input_layer = self.params[0].valueAsText


        if input_layer:
            try:
                d_layer = arcpy.Describe(self.params[0])
            except:
                d_layer = ""
            # input validation
            valid_input = validate_server_input(self.params[0].valueAsText)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])

            # populate relationship options based on geometry type of input
            input_shape = getattr(d_layer, 'shapetype', None)
            if input_shape == 'Point':
                self.params[2].filter.list = ['INTERSECTS','NEAR_PLANAR','NEAR_GEODESIC']
            else:
                self.params[2].filter.list = ['INTERSECTS','TOUCHES','NEAR_PLANAR','NEAR_GEODESIC']
            
            if self.params[2].valueAsText in ['NEAR_PLANAR','NEAR_GEODESIC']:
                self.params[3].enabled = True
                if self.params[3].value is None:
                    self.params[3].setIDMessage("ERROR", 735)
                else:
                    if not validate_greater_than_zero(self.params[3].valueAsText):
                        self.params[3].setIDMessage('ERROR', 323)
            else:
                self.params[3].enabled = False
                self.params[3].value = None

            # time relationship valiation
            temporal_relationship = self.params[4].valueAsText
            temporal_near_distance = self.params[5].valueAsText
            
            if temporal_relationship:
                if temporal_relationship == 'NEAR':
                    self.params[5].enabled = True
                    if temporal_near_distance:
                        if not validate_greater_than_zero(temporal_near_distance):
                            self.params[5].setIDMessage('ERROR', 323)
                        if not validate_whole_number(temporal_near_distance):
                            self.params[5].setIDMessage('ERROR', 1032, self.params[5].displayName)
                    else:
                        # make it required
                        self.params[5].setIDMessage("ERROR", 735)
                else:
                    self.params[5].enabled = False
                    self.params[5].value = None
            else:
                self.params[5].enabled = False
                self.params[5].value = None

        if PortalVersion() > 9.2: # 11.0 or greater exposes attribute expression
            self.params[8].enabled = True
        else:
            self.params[8].enabled = False
            if PortalVersion() < 9.1: # 10.9.1
                if self.params[0].valueAsText:
                    self.params[0].setIDMessage('ERROR', 120184)
                else:
                    self.params[0].setIDMessage('WARNING', 120184)

