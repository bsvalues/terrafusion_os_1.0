"""
 ga_desktop_traceproximityevents.py

 Front end of 'Trace Proximity Events' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context, run_ga_desktop_tool
from gautils.validation import validate_greater_than_zero, validate_whole_number, validate_input_source, \
    validate_desktop_output, time_validation_desktop_instant_only


if __name__ == '__main__':
    
    """ Split parameter values """
    # Get the spatial search distance value and units
    dist, dist_unit = split_unit(get_value(4))

    # Get the temporal search distance value and units
    time, time_unit = split_unit(get_value(5))

    """ Set parameter values """
    params = dict(inputPoints=get_value(0, as_value=True, local_feature_layer=True),
                  entityIdField=get_value(1, as_list=True),
                  output=get_value(2, local_feature_output=True),
                  distanceMethod=get_value(3, dict=d.geodesic).title(),
                  spatialSearchDistance=dist,
                  spatialSearchDistanceUnit=dist_unit,
                  temporalSearchDistance=time,
                  temporalSearchDistanceUnit=time_unit,
                  entitiesOfInterestIds=get_value(7, as_value=True,
                                                  val_table='trace_proximity_events_format_entities_of_interest') if get_value(6) == 'ID_START_TIME' else None,
                  entitiesOfInterestLayer=get_value(8, as_value=True, local_feature_layer=True) if get_value(6) == 'SELECTED_FEATURE' else None,
                  includeTracksLayer=True if get_value(9) else False,
                  tracksLayer=get_value(9, local_feature_output=True),
                  maxTraceDepth=get_value(10, as_value=True),
                  attributeMatchCriteria=get_value(11, as_list=True)
                  )
    
    params['context'] = set_context(arcpy.env.outputCoordinateSystem, arcpy.env.extent, desktop_context=True)
    params = param_cleanup(params)

    """ Run the tool """
    run_ga_desktop_tool('TraceProximityEvents', params, {"output": 2, "tracksLayer": 9})


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

        """ Update Parameters """
        # Entities of Interest Input Type
        entities_of_interest_input_type = self.params[6].valueAsText
        if entities_of_interest_input_type == "ID_START_TIME":
            # Activate IDs parameter
            self.params[7].enabled = True
            self.params[8].enabled = False
            self.params[8].value = None
        else:
            # Activate layer parameter
            self.params[7].enabled = False
            self.params[7].value = None
            self.params[8].enabled = True

        """ Output Validation """
        # 1 - Output validation
        self.params[2].value = validate_desktop_output(self.params[2].valueAsText, False)

        # 9 - Output Tracks Layer validation
        self.params[9].value = validate_desktop_output(self.params[9].valueAsText, False)

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        # 0 - Input Points validation
        if self.params[0].value:
            try:
                d = arcpy.Describe(self.params[0])
            except:
                d = ""

            # validate input time
            time_validation_desktop_instant_only(self.params[0], self.params[0], d)

            # Layer validation
            valid_input = validate_input_source(d)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])

        # 6 - Entities of Interest Input Type validation
        entities_of_interest_input_type = self.params[6].valueAsText
        if entities_of_interest_input_type == "ID_START_TIME":
            # Make the IDs parameter required
            if self.params[7].value is None:
                self.params[7].setIDMessage("ERROR", 735)
        else:
            # Make the layer parameter required
            if self.params[8].value is None:
                self.params[8].setIDMessage("ERROR", 735)
                    
        # 4 - Spatial Search Distance validation
        spatial_search_distance = self.params[4].valueAsText
        if spatial_search_distance:
            if not validate_greater_than_zero(spatial_search_distance):
                self.params[4].setIDMessage('ERROR', 323)

        # 5 - Temporal Search Distance validation
        temporal_search_distance = self.params[5].valueAsText
        if temporal_search_distance:
            if not validate_greater_than_zero(temporal_search_distance):
                self.params[5].setIDMessage('ERROR', 323)
            if not validate_whole_number(temporal_search_distance):
                self.params[5].setIDMessage('ERROR', 1032, self.params[5].displayName)

        # 8 - Entities of Interest Layer
        entities_of_interest_layer = self.params[8].value
        if entities_of_interest_layer:
            try:
                d = arcpy.Describe(self.params[8])
            except:
                d = ""
        if getattr(d, 'shapetype', None) in ['Polygon', 'Polyline', 'Line']:
            self.params[8].setIDMessage('ERROR', 366)

        # 10 - Max Trace Depth validation
        max_trace_depth = self.params[10].valueAsText
        if max_trace_depth:
            if not validate_greater_than_zero(max_trace_depth):
                self.params[10].setIDMessage('ERROR', 323)
            if not validate_whole_number(max_trace_depth):
                self.params[10].setIDMessage('ERROR', 1032, self.params[10].displayName)
