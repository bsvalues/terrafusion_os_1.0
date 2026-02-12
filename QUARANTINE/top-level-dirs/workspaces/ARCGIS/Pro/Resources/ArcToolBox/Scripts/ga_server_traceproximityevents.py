"""
 ga_server_traceproximityevents.py

 Front end of 'Trace Proximity Events' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context
from gautils.validation import validate_output, validate_greater_than_zero,\
   validate_server_input, validate_whole_number
from gautils.utilities import PortalVersion, trace_proximity_events_format_attribute_match_criteria

if __name__ == '__main__':

    # Tool name
    analysis_type = "Trace Proximity Events"

    """ Split parameter values """
    # Get the spatial search distance value and units
    dist, dist_unit = split_unit(get_value(4))

    # Get the temporal search distance value and units
    time, time_unit = split_unit(get_value(5))

    """ Set parameter values """
    params = dict(inputPoints=get_value(0, as_value=True),
                  entityIdField=get_value(1),
                  outputName=get_value(2),
                  distanceMethod=get_value(3, dict=d.geodesic).title(),
                  spatialSearchDistance=dist,
                  spatialSearchDistanceUnit=dist_unit,
                  temporalSearchDistance=time,
                  temporalSearchDistanceUnit=time_unit,
                  entitiesOfInterestIds=get_value(7, as_value=True,
                                                  val_table='trace_proximity_events_format_entities_of_interest') if get_value(6) == 'ID_START_TIME' else None,
                  entitiesOfInterestLayer=get_value(8) if get_value(6) == 'SELECTED_FEATURE' else None,
                  includeTracksLayer=get_value(9),
                  maxTraceDepth=get_value(10, as_value=True),
                  attributeMatchCriteria=trace_proximity_events_format_attribute_match_criteria(get_value(11, as_list=True))
                  )

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(12, dict=d.datastore),
                                    geoanalytics=True)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)

    # Set the output results
    if isinstance(output, list):
        arcpy.SetParameterAsText(13, output[0])
        if output[1]:
            arcpy.SetParameterAsText(14, output[1])
    else:
        arcpy.SetParameterAsText(13, output)

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
        if PortalVersion() >= 2023.2: # 11.2
            self.params[1].filter.list = ["Short", "Long", "BigInteger", "Float", "Double", "Text"]
            self.params[11].filter.list = ["Short", "Long", "BigInteger", "Float", "Double", "Text"]

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
        # Output Name validation
        output_name = self.params[2].valueAsText
        if output_name:
            self.params[2].value = validate_output(output_name)

        if PortalVersion() < 10.3:  # 11.1
            self.params[4].filter.list = list(d.linear_units_old.values())

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        # Check the Portal version. The Trace Proximity Events tool was released in Enterprise 10.9
        if PortalVersion() < 8.3:
            if self.params[0].valueAsText:
                self.params[0].setIDMessage('ERROR', 120184)
            else:
                self.params[0].setIDMessage('WARNING', 120184)

        # 0 - Input Points validation
        if self.params[0].value:
            try:
                d = arcpy.Describe(self.params[0])
            except:
                d = ""

            if getattr(d, 'shapetype', None) not in ['Point']:
                self.params[0].setIDMessage('ERROR', 366)
            validate = validate_server_input(self.params[0].valueAsText)
            if not validate[0]:
                self.params[0].setIDMessage('ERROR', validate[1])

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

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True