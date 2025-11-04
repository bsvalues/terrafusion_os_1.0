"""
 ga_desktop_findsimilarlocations.py

 Front end of 'Find Similar Locations' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import dicts as d
from gautils import get_value, param_cleanup, param_cleanup_num_zero, set_context, run_ga_desktop_tool
from gautils.validation import validate_desktop_output, validate_input_source


if __name__ == '__main__':

    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  searchLayer=get_value(1, as_value = True, local_feature_layer=True),
                  output=get_value(2, local_feature_output=True),
                  analysisFields=get_value(3, as_list=True),
                  mostOrLeastSimilar=get_value(4, dict=d.similar),
                  matchMethod=get_value(5, dict=d.match),
                  numberOfResults=get_value(6, as_value=True),
                  appendFields=get_value(7, as_list=True))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    if params['numberOfResults'] == 0:
        params = param_cleanup_num_zero(params)
    else:
        params = param_cleanup(params)
    run_ga_desktop_tool('FindSimilarLocations', params, {"output":2})


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

        search_features = self.params[1].valueAsText

        if search_features:
            try:
                d_search = arcpy.Describe(self.params[1])
            except:
                d_search = ""

            # output validation based on the search layer
            if d_search.datatype.lower().find(
                    "record") > -1 or d_search.datatype.lower().find(
                    "table") > -1:
                self.params[2].value = validate_desktop_output(
                    self.params[2].valueAsText, True)
            else:
                self.params[2].value = validate_desktop_output(
                    self.params[2].valueAsText, False)

        if validate_input_source(self.params[0].valueAsText) and validate_input_source(self.params[1].valueAsText):

            field_types = ['Integer', 'BigInteger', 'Single', 'Double', 'SmallInteger']
            input_fields = []
            search_fields = []

            try:
                input_fields = [f.name for f
                                in arcpy.Describe(self.params[0]).fields
                                if f.type in field_types]
            except AttributeError:
                self.params[0].setIDMessage('ERROR', 152)

            try:
                search_fields = [f.name for f
                                 in arcpy.Describe(self.params[1]).fields
                                 if f.type in field_types]
            except AttributeError:
                self.params[1].setIDMessage('ERROR', 152)

            # Set filter to fields common between input and search
            self.params[3].filter.list = [i for i in input_fields if
                                          i.lower() in
                                          [j.lower() for j in search_fields]]

        else:
            self.params[3].filter.list = []

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        input_layer = self.params[0].valueAsText
        search_layer = self.params[1].valueAsText
        match_method = self.params[5].valueAsText
        analysis_fields = self.params[3].valueAsText

        if input_layer:
            try:
                d_layer = arcpy.Describe(self.params[0])
            except:
                d_layer = ""
            # input validation
            valid_input = validate_input_source(d_layer)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])

        if search_layer:
            try:
                d_search_layer = arcpy.Describe(self.params[0])
            except:
                d_search_layer = ""
            # input validation
            valid_input = validate_input_source(d_search_layer)
            if not valid_input[0]:
                self.params[1].setIDMessage('ERROR', valid_input[1])

        if input_layer and search_layer:
            if not self.params[3].filter.list:
                self.params[1].setIDMessage('ERROR', 2077)

        if match_method == "ATTRIBUTE_PROFILES":
            if analysis_fields:
                analysis_fields_split = analysis_fields.split(";")
                if len(analysis_fields_split) < 2:
                    self.params[3].setIDMessage('ERROR', 120072)
