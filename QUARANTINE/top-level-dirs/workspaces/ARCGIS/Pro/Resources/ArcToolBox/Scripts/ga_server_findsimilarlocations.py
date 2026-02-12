"""
 ga_server_findsimilarlocations.py

 Front end of 'Find Similar Locations' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from gautils.validation import validate_output, validate_server_input
from gautils.utilities import PortalVersion


if __name__ == '__main__':

    analysis_type = "Find Similar Locations"

    params = dict(inputLayer=get_value(0, as_value=True),
                  searchLayer=get_value(1, as_value=True),
                  outputName=get_value(2),
                  analysisFields=get_value(3),
                  mostOrLeastSimilar=get_value(4, dict=d.similar),
                  matchMethod=get_value(5, dict=d.match),
                  numberOfResults=get_value(6),
                  appendFields=get_value(7))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(9, dict=d.datastore),
                                    geoanalytics=True)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)
    if isinstance(output, list):
        arcpy.SetParameterAsText(8, output[1])
    else:
        arcpy.SetParameterAsText(8, output)

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        # self.params[0].filter.list = ['BigDataFileShare']
        # self.params[1].filter.list = ['BigDataFileShare']

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""

        # Support for bigint
        if PortalVersion() >= 2023.2: # 11.2
            self.params[7].filter.list = ["Short", "Long", "BigInteger", "Float", "Double", "Text", "Date",
                                 "Blob", "Raster", "GUID", "GlobalID", "XML"]

        if self.params[0].valueAsText and self.params[1].valueAsText:
            if PortalVersion() < 2023.2: # 11.2
                field_types = ['Integer', 'Single', 'Double', 'SmallInteger']
            else:
                field_types = ['Integer', 'BigInteger', 'Single', 'Double', 'SmallInteger']

            try:
                in_desc = arcpy.Describe(self.params[0])
            except:
                in_desc = ""
            try:
                search_desc = arcpy.Describe(self.params[1])
            except:
                search_desc = ""
            if hasattr(in_desc, "fields") and hasattr(search_desc, "fields"):
                input_fields = [f.name for f
                                in in_desc.fields
                                if f.type in field_types]
                search_fields = [f.name for f
                                 in search_desc.fields
                                 if f.type in field_types]

                # Set filter to fields common between input and search
                self.params[3].filter.list = [i for i in input_fields if
                                              i.lower() in
                                              [j.lower() for j in
                                               search_fields]]
            else:
                self.params[3].filter.list = []
        else:
            self.params[3].filter.list = []

        output_name = self.params[2].valueAsText
        if output_name:
            self.params[2].value = validate_output(output_name)

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        input_layer = self.params[0].valueAsText
        search_layer = self.params[1].valueAsText
        match_method = self.params[5].valueAsText
        analysis_fields = self.params[3].valueAsText

        if input_layer and search_layer:
            if not self.params[3].filter.list:
                self.params[1].setIDMessage('ERROR', 2077)
        if input_layer:
            validate = validate_server_input(self.params[0].valueAsText)
            if not validate[0]:
                self.params[0].setIDMessage('ERROR', validate[1])
        if search_layer:
            validate = validate_server_input(self.params[1].valueAsText)
            if not validate[0]:
                self.params[1].setIDMessage('ERROR', validate[1])

        if match_method == "ATTRIBUTE_PROFILES":
            if analysis_fields:
                analysis_fields_split = analysis_fields.split(";")
                if len(analysis_fields_split) < 2:
                    self.params[3].setIDMessage('ERROR', 120072)