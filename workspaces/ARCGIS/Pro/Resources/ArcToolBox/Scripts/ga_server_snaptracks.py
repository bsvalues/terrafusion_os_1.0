"""
 ga_server_snaptracks.py

 Front end of 'Snap Tracks' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context
from gautils.utilities import PortalVersion, convert_get_value_list_to_rest_format
from gautils.validation import validate_output, validate_greater_than_zero, validate_server_input,\
    validate_time_boundary, validate_whole_number


if __name__ == '__main__':

    # Tool name
    analysis_type = "Snap Tracks"

    # Get the search distance value and unit
    search_dist, search_dist_unit = split_unit(get_value(4))

    # Set the tool parameters
    params = dict(pointLayer=get_value(0, as_value=True),
                  polylineLayer=get_value(1, as_value=True),
                  outputName=get_value(2),
                  trackFields=convert_get_value_list_to_rest_format(get_value(3, as_list=True)),
                  searchDistance=search_dist,
                  searchDistanceUnit=search_dist_unit,
                  connectivityFieldMatching=get_value(5, as_value=True, val_table='snap_connectivity_matching'),
                  polylineFieldsToInclude=convert_get_value_list_to_rest_format(get_value(6, as_list=True)),
                  distanceMethod=get_value(7, dict=d.geodesic).title(),
                  outputMode=get_value(9, dict=d.snap_output_mode),
                  )
    # Get the 'directionFieldMatching' parameter values if specified
    if str(get_value(8, as_value=True)) != "":
        params['directionFieldMatching'] = get_value(8, as_value=True, val_table='snap_direction_value_matching')
  
    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(10, dict=d.datastore),
                                    geoanalytics=True)
    if PortalVersion() >= 10.3:  # 11.1
        # Get the split parameter values
        time_split, time_split_unit = split_unit(get_value(12))
        dist_split, dist_split_unit = split_unit(get_value(13))
        time_bound_split, time_bound_split_unit = split_unit(get_value(14))
        params['timeSplit'] = time_split
        params['timeSplitUnit'] = time_split_unit
        params['distanceSplit'] = dist_split
        params['distanceSplitUnit'] = dist_split_unit
        params['timeBoundarySplit'] = time_bound_split
        params['timeBoundarySplitUnit'] = time_bound_split_unit
        params['timeBoundaryReference'] = get_value(15)

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

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        
        # Support for bigint
        if PortalVersion() >= 2023.2:  # 11.2
            self.params[3].filter.list = ["Short", "Long", "BigInteger", "Float", "Double", "Text"]
            self.params[5].filters[0].list = ["Short", "Long", "BigInteger", "Float", "Double", "Text"]
            self.params[5].filters[1].list = ["Short", "Long", "BigInteger", "Float", "Double", "Text"]
            self.params[5].filters[2].list = ["Short", "Long", "BigInteger", "Float", "Double", "Text"]
            self.params[6].filter.list = ["Short", "Long", "BigInteger", "Float", "Double", "Text", "Date"]
            self.params[8].filters[0].list = ["Short", "Long", "BigInteger", "Float", "Double", "Text"]

        output_name = self.params[2].valueAsText
        if output_name:
            self.params[2].value = validate_output(output_name)

        if PortalVersion() < 10.3:  # 11.1
            self.params[4].filter.list = list(d.linear_units_old.values())
            self.params[12].enabled = False
            self.params[13].enabled = False
            self.params[14].enabled = False
            self.params[15].enabled = False

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        input_layer = self.params[0].value
        line_layer = self.params[1].value
        search_distance = self.params[4].valueAsText

        # input point validation
        if input_layer:
            try:
                d_points = arcpy.Describe(self.params[0])
            except:
                d_points = ""
            if getattr(d_points, 'shapetype', None) not in ['Point']:
                self.params[0].setIDMessage('ERROR', 366)

            # input point source validation
            validate = validate_server_input(self.params[0].valueAsText)
            if not validate[0]:
                self.params[0].setIDMessage('ERROR', validate[1])

        # input line validation
        if line_layer:
            try:
                d_lines = arcpy.Describe(self.params[1])
            except:
                d_lines = ""
            if getattr(d_lines, 'shapetype', None) not in ['Polyline']:
                self.params[1].setIDMessage('ERROR', 366)
            
            # input network source validation
            validate = validate_server_input(self.params[1].valueAsText)
            if not validate[0]:
                self.params[1].setIDMessage('ERROR', validate[1])

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

        if PortalVersion() < 10.1:  # 11.0
            if self.params[0].valueAsText:
                self.params[0].setIDMessage('ERROR', 120184)
            else:
                self.params[0].setIDMessage('WARNING', 120184)
        
        # split parameter validation for portals >= 11.1
        if PortalVersion() >= 10.3:  # 11.1
            time_split = self.params[12].valueAsText
            distance_split = self.params[13].valueAsText
            time_boundary_params = {"split": 14, "reference": 15}
            time_boundary_split = self.params[time_boundary_params["split"]].valueAsText
            time_boundary_reference = self.params[time_boundary_params["reference"]].valueAsText
            if time_split:
                if not validate_greater_than_zero(time_split):
                    self.params[12].setIDMessage('ERROR', 323)
                if not validate_whole_number(time_split):
                    self.params[12].setIDMessage('ERROR', 1032,
                                                 self.params[7].displayName)

            if distance_split:
                if not validate_greater_than_zero(distance_split):
                    self.params[13].setIDMessage('ERROR', 323)

            validate_time_boundary(self, time_boundary_split, time_boundary_reference, time_boundary_params)
