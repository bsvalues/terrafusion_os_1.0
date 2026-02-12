"""
 ga_desktop_groupbyproximity.py

 Front end of 'GroupByProximity' GeoAnalytics Desktop tool.

"""

import arcpy
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context, run_ga_desktop_tool, split_unit
from gautils.validation import validate_desktop_output, validate_input_source, validate_greater_than_zero, time_validation_desktop_interval_or_instant, validate_whole_number


if __name__ == '__main__':

    near_dist, near_dist_unit = split_unit(get_value(3))
    temp_dist, temp_dist_unit = split_unit(get_value(5))

    params = dict(inputFeatures=get_value(0, as_value = True, local_feature_layer=True),
                  output=get_value(1, local_feature_output=True),
                  spatialRelationship=get_value(2, dict=d.spatial),
                  spatialNearDistance=near_dist,
                  spatialNearDistanceUnit=near_dist_unit,
                  temporalRelationship=get_value(4, dict=d.temporal),
                  temporalNearDistance=temp_dist,
                  temporalNearDistanceUnit=temp_dist_unit,
                  attributeRelationship=get_value(6),
                  attributeRelationshipType="Arcade")

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    run_ga_desktop_tool('GroupByProximity', params, {"output":1})


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

        self.params[1].value = validate_desktop_output(
            self.params[1].valueAsText, False)  # output validation

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
            valid_input = validate_input_source(d_layer)
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


            # Populate the near time distance parameter if NEAR is picked + make it required
            temporal_relationship = self.params[4].valueAsText
            temporal_near_distance = self.params[5].valueAsText

            if temporal_relationship and temporal_relationship in ["NEAR","INTERSECTS"]:
                time_validation_desktop_interval_or_instant(self.params[0], self.params[4], d_layer)
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
               


            

