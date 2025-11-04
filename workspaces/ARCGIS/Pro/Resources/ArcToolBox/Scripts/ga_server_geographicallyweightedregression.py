"""
 ga_server_geographicallyweightedregression.py

 Front end of 'Geographically Weighted Regression' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context
from gautils.validation import validate_output, validate_greater_than_zero, validate_server_input
from gautils.utilities import PortalVersion


if __name__ == '__main__':

    distance_band, distance_band_unit = split_unit(get_value(8))


    analysis_type = "Geographically Weighted Regression"
    params = dict(inputLayer=get_value(0, as_value=True),
                  dependentVariable=get_value(1),
                  modelType=get_value(2),
                  explanatoryVariables=get_value(3),
                  outputTrainedName=get_value(4),
                  neighborhoodType=get_value(5, dict=d.neighborhood_type),
                  neighborhoodSelectionMethod=get_value(6, dict=d.neighborhood_selection_method),
                  numberOfNeighbors=get_value(7),
                  distanceBand=distance_band,
                  distanceBandUnit=distance_band_unit,
                  localWeightingScheme=get_value(9))
                  
    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(10, dict=d.datastore),
                                    geoanalytics=True)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)

    if isinstance(output, list):
        id = 11
        for output_returned in output:
            if isinstance(output_returned, str):
                PI = output_returned
            else:
                arcpy.SetParameterAsText(id, output_returned)
            id += 1
    else:
        arcpy.SetParameterAsText(11, output)

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.
        This method is called when the tool is opened."""

        # self.params[2].enabled = False
        # self.params[6].enabled = False
        # self.params[7].enabled = False
        # self.params[8].enabled = False

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""

        # Support for bigint
        if PortalVersion() >= 2023.2: # 11.2
            self.params[1].filter.list = ["Short", "Long", "BigInteger", "Float", "Double"]
            self.params[3].filter.list = ["Short", "Long", "BigInteger", "Float", "Double"]

        neighborhood_type = self.params[5].valueAsText
        if neighborhood_type == "NUMBER_OF_NEIGHBORS":
            self.params[7].enabled = True
            self.params[8].enabled = False
            self.params[8].value = None
        elif neighborhood_type == "DISTANCE_BAND":
            self.params[7].enabled = False
            self.params[8].enabled = True
            self.params[7].value = None

        output_name = self.params[4].valueAsText
        if output_name:
            self.params[4].value = validate_output(output_name)

        if PortalVersion() < 10.3:  # 11.1
            self.params[8].filter.list = list(d.linear_units_old.values())

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        if PortalVersion() < 8.1:
            if self.params[0].valueAsText:
                self.params[0].setIDMessage('ERROR', 120184)
            else:
                self.params[0].setIDMessage('WARNING', 120184)

        input_layer = self.params[0].valueAsText
        neighborhood_type = self.params[5].valueAsText
        explanatory_variables_text = self.params[3].valueAsText
        dependent_variable = self.params[1]
        distance_band = self.params[8].valueAsText

        if neighborhood_type == "NUMBER_OF_NEIGHBORS":
            if self.params[7].value is None:
                self.params[7].setIDMessage("ERROR", 735)
        if neighborhood_type == "DISTANCE_BAND":
            if self.params[8].value is None:
                self.params[8].setIDMessage("ERROR", 735)

        if input_layer:
            validate = validate_server_input(self.params[0].valueAsText)
            if not validate[0]:
                self.params[0].setIDMessage('ERROR', validate[1])
            try:
                d = arcpy.Describe(self.params[0])
            except:
                d = ""
            if getattr(d, 'shapetype', None) != 'Point':
                self.params[0].setIDMessage('ERROR', 366)

        if explanatory_variables_text is not None:
            seen = []
            explanatory_variables_text_split = explanatory_variables_text.split(
                ";")
            for field_name in explanatory_variables_text_split:
                if field_name not in [None, "#", ""]:
                    if dependent_variable.value:
                        if field_name == dependent_variable.valueAsText:
                            self.params[3].setIDMessage("ERROR", 110182,
                                                        field_name)
                    if field_name not in seen:
                        seen.append(field_name)
                    else:
                        self.params[3].setIDMessage("ERROR", 110182, field_name)

        if distance_band:
            if not validate_greater_than_zero(distance_band):
                self.params[8].setIDMessage('ERROR', 323)

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True