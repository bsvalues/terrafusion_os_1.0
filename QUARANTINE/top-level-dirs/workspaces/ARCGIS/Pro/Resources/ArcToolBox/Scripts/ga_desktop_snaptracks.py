"""
 ga_desktop_snaptracks.py

 Front end of 'Snap Tracks' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context, run_ga_desktop_tool
from gautils.validation import validate_greater_than_zero, validate_input_source, validate_desktop_output, \
                                time_validation_desktop_instant_only, validate_time_boundary, validate_whole_number 


if __name__ == '__main__':

    search_dist, search_dist_unit = split_unit(get_value(4))
    time_split, time_split_unit = split_unit(get_value(10))
    dist_split, dist_split_unit = split_unit(get_value(11))
    time_bound_split, time_bound_split_unit = split_unit(get_value(12))
    params = dict(pointLayer=get_value(0, as_value=True, local_feature_layer=True),
                  polylineLayer=get_value(1, as_value=True, local_feature_layer=True),
                  output=get_value(2, local_feature_output=True),
                  trackFields=get_value(3, as_list=True),
                  polylineFieldsToInclude=get_value(6, as_list=True),
                  connectivityFieldMatching=get_value(5, as_value=True, val_table='snap_connectivity_matching'),
                  outputMode=get_value(9, dict=d.snap_output_mode),
                  distanceMethod=get_value(7, dict=d.geodesic).title(),
                  searchDistance=search_dist,
                  searchDistanceUnit=search_dist_unit,
                  timeSplit=time_split,
                  timeSplitUnit=time_split_unit,
                  distanceSplit=dist_split,
                  distanceSplitUnit=dist_split_unit,
                  timeBoundarySplit=time_bound_split,
                  timeBoundarySplitUnit=time_bound_split_unit,
                  timeBoundaryReference=get_value(13, datetime_epoch=True),
                  )
    
    if str(get_value(8, as_value=True)) != "":
        params['directionFieldMatching'] = get_value(8, as_value=True, val_table='snap_direction_value_matching')
        
    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    run_ga_desktop_tool('SnapTracks', params, {"output": 2})


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

        self.params[2].value = validate_desktop_output(
            self.params[2].valueAsText, False)  # output validation

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        input_layer = self.params[0].value
        line_layer = self.params[1].value
        search_distance = self.params[4].valueAsText
        # TODO: remove this comment, add the validation to follow setting these, then repeat for server
        time_split = self.params[10].valueAsText
        distance_split = self.params[11].valueAsText
        time_boundary_params = {"split":12, "reference":13}
        time_boundary_split = self.params[time_boundary_params["split"]].valueAsText
        time_boundary_reference = self.params[time_boundary_params["reference"]].valueAsText

        # input validation
        if input_layer:
            try:
                d_points = arcpy.Describe(self.params[0])
            except:
                d_points = ""

            # time validation
            time_validation_desktop_instant_only(self.params[0], self.params[0], d_points)

            # input point source validation
            valid_input = validate_input_source(d_points)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])
        
        # line validation
        if line_layer:
            try:
                d_lines = arcpy.Describe(self.params[1])
            except:
                d_lines = ""

            # input line source validation
            valid_input = validate_input_source(d_lines)
            if not valid_input[0]:
                self.params[1].setIDMessage('ERROR', valid_input[1])

        # srefs should match
        if line_layer and input_layer:
            if hasattr(d_points, 'spatialReference') and hasattr(d_lines, 'spatialReference'):
                if not arcpy.env.outputCoordinateSystem:
                    if d_points.spatialReference.factoryCode > 0 and d_lines.spatialReference.factoryCode > 0:
                        if d_points.spatialReference.factoryCode != d_lines.spatialReference.factoryCode:
                            self.params[0].setIDMessage('WARNING', 120381)
                            self.params[1].setIDMessage('WARNING', 120381)
                    elif d_points.spatialReference.factoryCode == 0 or d_lines.spatialReference.factoryCode == 0:
                        if d_points.spatialReference.exportToString() != d_lines.spatialReference.exportToString():
                            self.params[0].setIDMessage('WARNING', 120381)
                            self.params[1].setIDMessage('WARNING', 120381)
                
        # search distance validation
        if search_distance:
            if not validate_greater_than_zero(search_distance):
                self.params[4].setIDMessage('ERROR', 323)
        
        # track split validation
        if time_split:
            if not validate_greater_than_zero(time_split):
                self.params[10].setIDMessage('ERROR', 323)
            if not validate_whole_number(time_split):
                self.params[10].setIDMessage('ERROR', 1032,
                                            self.params[7].displayName)

        if distance_split:
            if not validate_greater_than_zero(distance_split):
                self.params[11].setIDMessage('ERROR', 323)

        validate_time_boundary(self, time_boundary_split, time_boundary_reference, time_boundary_params)
