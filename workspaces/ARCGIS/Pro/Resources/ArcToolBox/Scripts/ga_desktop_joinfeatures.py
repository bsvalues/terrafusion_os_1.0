"""
 ga_desktop_joinfeatures.py

 Front end of 'Join Features' GeoAnalytics Desktop tool.

"""

import arcpy
import re
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context, run_ga_desktop_tool
from gautils.validation import validate_greater_than_zero, validate_input_source, \
    validate_desktop_output, time_validation_desktop_interval_or_instant


if __name__ == '__main__':

    near_dist, near_dist_unit = split_unit(get_value(5))
    temp_dist, temp_dist_unit = split_unit(get_value(7))

    params = dict(targetLayer=get_value(0, as_value = True, local_feature_layer=True),
                  joinLayer=get_value(1, as_value = True, local_feature_layer=True),
                  output=get_value(2, local_feature_output=True),
                  joinOperation=get_value(3, dict=d.join),
                  spatialRelationship=get_value(4, dict=d.spatial),
                  spatialNearDistance=near_dist,
                  spatialNearDistanceUnit=near_dist_unit,
                  temporalRelationship=get_value(6, dict=d.temporal),
                  temporalNearDistance=temp_dist,
                  temporalNearDistanceUnit=temp_dist_unit,
                  attributeRelationship=get_value(8, as_value=True, val_table='att_relationship'),
                  summaryFields=get_value(9, as_value=True, val_table='summary_fields'),
                  joinCondition=get_value(10),
                  keepAllTargetFeatures=get_value(11, dict=d.join_keep_target),
                  includeDistance=get_value(12, dict=d.join_include_distance),
                  distanceUnit=get_value(13, dict=d.linear_units))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    run_ga_desktop_tool('JoinFeatures', params, {"output":2})


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

        target_features = self.params[0].valueAsText
        join_features = self.params[1].valueAsText
        temporal_near_distance = self.params[7].valueAsText

        if temporal_near_distance:
            self.params[7].value = re.sub('[.,][0-9]*(?![0-9.]*E+[0-9]*)', '',
                                          temporal_near_distance)

        if target_features and join_features:
            try:
                d_target = arcpy.Describe(self.params[0])
            except:
                d_target = ""
            try:
                d_join = arcpy.Describe(self.params[1])
            except:
                d_join = ""

            if hasattr(d_target, 'shapetype') and hasattr(d_join, 'shapetype'):
                self.params[2].value = validate_desktop_output(
                    self.params[2].valueAsText, False)  # output validation
                self.params[4].enabled = True

                target_shape = getattr(d_target, 'shapetype', None)
                join_shape = getattr(d_join, 'shapetype', None)

                if target_shape == 'Point':
                    if join_shape == 'Point':
                        self.params[4].filter.list = ['EQUALS', 'INTERSECTS',
                                                      'CONTAINS', 'WITHIN',
                                                      'NEAR', 'NEAR_GEODESIC']
                    elif join_shape == 'Polyline':
                        self.params[4].filter.list = ['INTERSECTS', 'WITHIN',
                                                      'TOUCHES', 'NEAR',
                                                      'NEAR_GEODESIC']
                    elif join_shape == 'Polygon':
                        self.params[4].filter.list = ['INTERSECTS', 'WITHIN',
                                                      'TOUCHES', 'NEAR',
                                                      'NEAR_GEODESIC']
                elif target_shape == 'Polyline':
                    if join_shape == 'Point':
                        self.params[4].filter.list = ['INTERSECTS', 'CONTAINS',
                                                      'TOUCHES', 'NEAR',
                                                      'NEAR_GEODESIC']
                    elif join_shape == 'Polyline':
                        self.params[4].filter.list = ['EQUALS', 'INTERSECTS',
                                                      'CONTAINS', 'WITHIN',
                                                      'CROSSES', 'TOUCHES',
                                                      'OVERLAPS', 'NEAR',
                                                      'NEAR_GEODESIC']
                    elif join_shape == 'Polygon':
                        self.params[4].filter.list = ['INTERSECTS', 'WITHIN',
                                                      'CROSSES', 'TOUCHES',
                                                      'NEAR', 'NEAR_GEODESIC']
                elif target_shape == 'Polygon':
                    if join_shape == 'Point':
                        self.params[4].filter.list = ['INTERSECTS', 'CONTAINS',
                                                      'TOUCHES', 'NEAR',
                                                      'NEAR_GEODESIC']
                    elif join_shape == 'Polyline':
                        self.params[4].filter.list = ['INTERSECTS', 'CONTAINS',
                                                      'CROSSES', 'TOUCHES',
                                                      'NEAR', 'NEAR_GEODESIC']
                    elif join_shape == 'Polygon':
                        self.params[4].filter.list = ['EQUALS', 'INTERSECTS',
                                                      'CONTAINS', 'WITHIN',
                                                      'TOUCHES', 'OVERLAPS',
                                                      'NEAR', 'NEAR_GEODESIC']

            elif d_target.datatype.lower().find(
                    "record") > -1 or d_target.datatype.lower().find(
                    "table") > -1 or d_join.datatype.lower().find(
                    "record") > -1 or d_join.datatype.lower().find(
                    "table") > -1:

                self.params[4].enabled = False
                self.params[4].value = None
            else:
                self.params[4].enabled = True
                self.params[4].filter.list = ['EQUALS', 'INTERSECTS',
                                              'CONTAINS', 'WITHIN', 'CROSSES',
                                              'TOUCHES', 'OVERLAPS', 'NEAR',
                                              'NEAR_GEODESIC']

            # output validation based on the target layer
            if d_target.datatype.lower().find(
                    "record") > -1 or d_target.datatype.lower().find(
                    "table") > -1:
                self.params[2].value = validate_desktop_output(
                    self.params[2].valueAsText, True)
            else:
                self.params[2].value = validate_desktop_output(
                    self.params[2].valueAsText, False)

        if self.params[4].valueAsText == 'NEAR' or self.params[4].valueAsText == 'NEAR_GEODESIC':
            self.params[5].enabled = True
            self.params[12].enabled = True
        else:
            self.params[5].enabled = False
            self.params[5].value = None
            self.params[12].enabled = False

        if self.params[6].valueAsText == 'NEAR' or self.params[6].valueAsText == 'NEAR_BEFORE' or \
           self.params[6].valueAsText == 'NEAR_AFTER':
            self.params[7].enabled = True
            self.params[12].enabled = True
        else:
            self.params[7].enabled = False
            self.params[7].value = None

        if self.params[3].valueAsText == 'JOIN_ONE_TO_ONE':
            self.params[9].enabled = True
            self.params[11].enabled = True
            self.params[12].enabled = False
        else:
            self.params[9].enabled = False
            self.params[9].value = None
            self.params[11].enabled = False
            self.params[11].value = None

        if self.params[12].enabled and self.params[12].value and \
           (self.params[4].valueAsText == 'NEAR' or self.params[4].valueAsText == 'NEAR_GEODESIC'):
            self.params[13].enabled = True
            if not self.params[13].value:
                self.params[13].value = 'METERS'
        else:
            self.params[13].enabled = False


        if join_features:
            field_types = ['Double', 'SmallInteger', 'Integer', 'BigInteger', 'Single',
                           'String', 'Date']

            try:
                fields = [f.name for f in arcpy.Describe(self.params[1]).fields
                          if f.type in field_types]
            except:
                fields = None


            if fields:
                self.params[8].filters[1].list = fields

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        target_features = self.params[0].valueAsText
        join_features = self.params[1].valueAsText
        output_data = self.params[2].valueAsText
        spatial_relationship = self.params[4].valueAsText
        spatial_near_distance = self.params[5].valueAsText
        temporal_relationship = self.params[6].valueAsText
        temporal_near_distance = self.params[7].valueAsText
        attribute_relationship = self.params[8].valueAsText

        if target_features:
            try:
                d_target = arcpy.Describe(self.params[0])
            except:
                d_target = ""
            # input validation - target featuress
            valid_input = validate_input_source(d_target)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])
            # time validation - target features
            if hasattr(d_target, 'shapetype'):
                if getattr(d_target, 'shapetype', None) not in ['Polygon',
                                                                'Polyline',
                                                                'Point']:
                    self.params[0].setIDMessage('ERROR', 366)
            
            # time validation - target features
            if temporal_relationship is not None:
                time_validation_desktop_interval_or_instant(self.params[0], self.params[6], d_target)
                if temporal_near_distance:
                    time_validation_desktop_interval_or_instant(self.params[0], self.params[7], d_target)

        if join_features:
            try:
                d_join = arcpy.Describe(self.params[1])
            except:
                d_join = ""
            # input validation - join features
            valid_input = validate_input_source(d_join)
            if not valid_input[0]:
                self.params[1].setIDMessage('ERROR', valid_input[1])


            if hasattr(d_join, 'shapetype'):
                if getattr(d_join, 'shapetype', None) not in ['Polygon',
                                                                'Polyline',
                                                                'Point']:
                    self.params[1].setIDMessage('ERROR', 366)
            # time validation - join features
            if temporal_relationship is not None:
                time_validation_desktop_interval_or_instant(self.params[1], self.params[6], d_join)
                if temporal_near_distance:
                    time_validation_desktop_interval_or_instant(self.params[1], self.params[7], d_join)

        if spatial_near_distance:
            if not validate_greater_than_zero(spatial_near_distance):
                self.params[5].setIDMessage('ERROR', 323)

        if temporal_near_distance:
            if not validate_greater_than_zero(temporal_near_distance):
                self.params[7].setIDMessage('ERROR', 323)

        if self.params[4].valueAsText == 'NEAR' or self.params[
            4].valueAsText == 'NEAR_GEODESIC':
            if self.params[5].value is None:
                self.params[5].setIDMessage("ERROR", 735)

        if self.params[6].valueAsText == 'NEAR' or self.params[
            6].valueAsText == 'NEAR_BEFORE' or self.params[
            6].valueAsText == 'NEAR_AFTER':
            if self.params[7].value is None:
                self.params[7].setIDMessage("ERROR", 735)

        if spatial_relationship is None and temporal_relationship is None and attribute_relationship is None:
            self.params[4].setIDMessage("ERROR", 120034)
            self.params[6].setIDMessage("ERROR", 120034)
            self.params[8].setIDMessage("ERROR", 120034)

        if (spatial_relationship is not None and not self.params[
            4].hasWarning()) or (
                temporal_relationship is not None and not self.params[
            6].hasWarning()) or (
                attribute_relationship is not None and not self.params[
            8].hasWarning()):
            self.params[4].clearMessage()
            self.params[6].clearMessage()
            self.params[8].clearMessage()
