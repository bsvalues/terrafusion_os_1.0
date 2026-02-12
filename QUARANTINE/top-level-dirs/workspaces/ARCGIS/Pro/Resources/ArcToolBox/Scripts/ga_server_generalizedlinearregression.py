"""
 ga_server_generalizedlinearregression.py

 Front end of 'Generalized Linear Regression' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from gautils.validation import validate_output, validate_server_input
from gautils.utilities import PortalVersion


if __name__ == '__main__':


    dependent_variable_mapping = get_value(8, as_value=True, val_table='glr_dependent_mapping_variables')
    if dependent_variable_mapping == '[]':
        model_type = get_value(2)
        if model_type == 'BINARY':
            dependent_variable_mapping = '[{"value0":"0"},{"value1":"1"}]'


    analysis_type = "Generalized Linear Regression"
    params = dict(inputLayer=get_value(0, as_value=True),
                  dependentVariable=get_value(1),
                  regressionFamily=get_value(2),
                  explanatoryVariables=get_value(3),
                  outputName=get_value(4),
                  generateCoefficientTable=get_value(5),
                  featuresToPredict=get_value(6, as_value=True),
                  explanatoryVariableMatching=get_value(7, as_value=True, val_table='glr_explanatory_variable_matching'),
                  dependentMapping=dependent_variable_mapping)
                  
    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(9, dict=d.datastore),
                                    geoanalytics=True)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)

    if isinstance(output, list):

        #output trained
        arcpy.SetParameterAsText(10, output[0])

        if output[1]:
            #coefficient table
            arcpy.SetParameterAsText(12, output[1])
        if output[2]:
            #output predicted
            arcpy.SetParameterAsText(11, output[2])
        if output[3]:
            #PI
            if isinstance(output[3], str):
                PI = output[3]
    else:
        arcpy.SetParameterAsText(10, output)

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""
        # self.params[0].displayOrder = 0
        # self.params[1].displayOrder = 1
        # self.params[2].displayOrder = 2
        # self.params[3].displayOrder = 3
        # self.params[4].displayOrder = 4
        # self.params[5].displayOrder = 5
        # self.params[6].displayOrder = 7
        # self.params[7].displayOrder = 8
        # self.params[8].displayOrder = 6

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""

        # Support for bigint
        if PortalVersion() >= 2023.2: # 11.2
            self.params[1].filter.list = ["Short", "Long", "BigInteger", "Float", "Double", "Text"]
            self.params[3].filter.list = ["Short", "Long", "BigInteger", "Float", "Double"]
            self.params[7].filters[0].list = ["Short", "Long", "BigInteger", "Float", "Double"]

        output_name = self.params[4].valueAsText
        if output_name:
            self.params[4].value = validate_output(output_name)

        # populate matching based on exp vars
        explanatory_variables = self.params[3].valueAsText
        if explanatory_variables:
            explanatory_variables_split = explanatory_variables.split(";")

            try:
                desc = arcpy.Describe(self.params[6].value)
                nameAliasMapPredFC = dict()

                for fieldObj in desc.fields:
                    nameAliasMapPredFC[fieldObj.name] = fieldObj.aliasName
                vtList = self.matchVariables(explanatory_variables_split, desc)
                nameAliasMapInputFC = dict()
                desc = arcpy.Describe(self.params[0].value)
                for fieldObj in desc.fields:
                    nameAliasMapInputFC[fieldObj.name] = fieldObj.aliasName
                for pair in vtList:
                    pair[1] = nameAliasMapInputFC[pair[1]]
                if self.params[7].value:
                    #### Keep the Already Existing Fields Selected by User ####
                    existingMatchPairs = dict()
                    for vtRow in self.params[7].value:
                        predField = vtRow[0].value
                        indFieldAlias = vtRow[1]
                        if predField in nameAliasMapPredFC and indFieldAlias not in existingMatchPairs:
                            existingMatchPairs[indFieldAlias] = predField
                    for pair in vtList:
                        if pair[1] in existingMatchPairs:
                            pair[0] = existingMatchPairs[pair[1]]
                self.params[7].value = vtList
            except:
                pass

        #### Clean Matching Variables ####
        if explanatory_variables is None:
            self.params[7].value = None

        model_type = self.params[2].valueAsText
        if model_type == "BINARY":
            self.params[8].enabled = True
        else:
            self.params[8].enabled = False
            self.params[8].value = None

        dependent_mapping_variables = self.params[8].valueAsText
        if dependent_mapping_variables:
            dependent_mapping_variables_split = dependent_mapping_variables.split(
                ";")
            self.params[8].value = dependent_mapping_variables_split[0]

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        if PortalVersion() < 7.1:
            if self.params[0].valueAsText:
                self.params[0].setIDMessage('ERROR', 120184)
            else:
                self.params[0].setIDMessage('WARNING', 120184)

        if self.params[0].valueAsText:
            validate = validate_server_input(self.params[0].valueAsText)
            if not validate[0]:
                self.params[0].setIDMessage('ERROR', validate[1])
        if self.params[6].valueAsText:
            validate = validate_server_input(self.params[6].valueAsText)
            if not validate[0]:
                self.params[6].setIDMessage('ERROR', validate[1])

        input_features_predict = self.params[6]
        dependent_variable = self.params[1]
        explanatory_matching_variables = self.params[7]
        if input_features_predict.value is not None:
            if explanatory_matching_variables.value is None:
                explanatory_matching_variables.setIDMessage("ERROR", 530)
            else:
                for i in explanatory_matching_variables.value:
                    if i[0].value in [None, ""]:
                        explanatory_matching_variables.setIDMessage("ERROR",
                                                                    530)

        explanatory_variables_text = self.params[3].valueAsText
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

    def matchVariables(self, inputVariables, describePred):
        predNames = [i.name for i in describePred.fields]
        pairs = []
        for indOut in inputVariables:
            predOut = ""
            if indOut in predNames:
                predOut = indOut
            pairs.append([predOut, indOut])
        return pairs