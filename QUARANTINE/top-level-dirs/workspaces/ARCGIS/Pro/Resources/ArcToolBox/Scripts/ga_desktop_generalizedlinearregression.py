"""
 ga_desktop_generalizedlinearregression.py

 Front end of 'Generalized Linear Regression' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import get_value, param_cleanup, set_context, run_ga_desktop_tool
from gautils.validation import validate_desktop_output, validate_input_source


if __name__ == '__main__':

    dependent_variable_mapping = get_value(7, as_value=True, val_table='glr_dependent_mapping_variables')
    if dependent_variable_mapping == '[]':
        model_type = get_value(2)
        if model_type == 'BINARY':
            dependent_variable_mapping = '[{"value0":"0"},{"value1":"1"}]'

    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  dependentVariable=get_value(1),
                  regressionFamily=get_value(2).title(),
                  explanatoryVariables=get_value(3, as_list=True),
                  output=get_value(4, local_feature_output=True), # now an output FC
                  generateCoefficientTable=True if get_value(9) else False, #true if 9 exists
                  featuresToPredict=get_value(5, as_value = True, local_feature_layer=True) if get_value(5) else "",
                  explanatoryVariableMatching=get_value(6, as_value=True, val_table='glr_explanatory_variable_matching'),
                  dependentMapping=dependent_variable_mapping,
                  coefficientTable=get_value(9, local_feature_output=True),
                  outputPredicted=get_value(8, local_feature_output=True))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    run_ga_desktop_tool('GeneralizedLinearRegression', params, {"output":4, "outputPredicted":8})

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

        input_features = self.params[0].valueAsText
        input_pred_features = self.params[5].valueAsText
        # Validate output features
        if input_features and self.params[4] is not None:
            try:
                d_input = arcpy.Describe(self.params[0])
            except:
                d_input = ""
            # output validation for the output features based on input
            if d_input.datatype.lower().find(
                    "record") > -1 or d_input.datatype.lower().find(
                    "table") > -1:
                self.params[4].value = validate_desktop_output(
                    self.params[4].valueAsText, True)
            else:
                self.params[4].value = validate_desktop_output(
                    self.params[4].valueAsText, False)

        # Validate output prediction features
        if input_pred_features:
            if self.params[8].value is None:
                self.params[8].setIDMessage("ERROR", 735)
            else:
                try:
                    d_input = arcpy.Describe(self.params[5])
                except:
                    d_input = ""
                # output validation for the output features based on input
                if d_input.datatype.lower().find(
                        "record") > -1 or d_input.datatype.lower().find(
                        "table") > -1:
                    self.params[8].value = validate_desktop_output(
                        self.params[8].valueAsText, True)
                else:
                    self.params[8].value = validate_desktop_output(
                        self.params[8].valueAsText, False)

        # Validate coefficient table output
        if self.params[9] is not None:
            self.params[9].value = validate_desktop_output(
                self.params[9].valueAsText, True)

        # populate matching based on exp vars
        explanatory_variables = self.params[3].valueAsText
        input_prediction_layer = self.params[5].value

        if self.paramChanged(self.params[3]) or self.paramChanged(
                self.params[5]):
            if explanatory_variables and input_prediction_layer:
                if validate_input_source(arcpy.Describe(input_prediction_layer))[0]:
                    explanatory_variables_split = explanatory_variables.split(";")

                try:
                    desc = arcpy.Describe(self.params[5].value)  # updated
                    nameAliasMapPredFC = dict()

                    for fieldObj in desc.fields:
                        nameAliasMapPredFC[fieldObj.name] = fieldObj.aliasName
                    vtList = self.matchVariables(explanatory_variables_split,
                                                 desc)
                    nameAliasMapInputFC = dict()
                    desc = arcpy.Describe(self.params[0].value)
                    for fieldObj in desc.fields:
                        nameAliasMapInputFC[fieldObj.name] = fieldObj.aliasName
                    for pair in vtList:
                        pair[1] = nameAliasMapInputFC[pair[1]]

                    if self.params[6].valueAsText:  # updated
                        #### Keep the Already Existing Fields Selected by User ####

                        existingMatchPairs = dict()
                        for vtRow in self.params[6].value:  # updated
                            predField = vtRow[0].value
                            indFieldAlias = vtRow[1]
                            if predField in nameAliasMapPredFC and indFieldAlias not in existingMatchPairs:
                                existingMatchPairs[indFieldAlias] = predField

                        for pair in vtList:
                            if pair[1] in existingMatchPairs:
                                pair[0] = existingMatchPairs[pair[1]]

                    self.params[6].value = vtList  # updated
                except:
                    pass

        # Clean Matching Variables
        if explanatory_variables is None:
            self.params[6].value = None

        model_type = self.params[2].valueAsText
        if model_type == "BINARY":
            self.params[7].enabled = True
        else:
            self.params[7].enabled = False
            self.params[7].value = None

        dependent_mapping_variables = self.params[7].valueAsText
        if dependent_mapping_variables:
            dependent_mapping_variables_split = dependent_mapping_variables.split(
                ";")
            self.params[7].value = dependent_mapping_variables_split[0]

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        # Set binary mapping to required when explanatory is String
        model_type = self.params[2].valueAsText
        field_value = self.params[1].valueAsText

        # Warn when a string is selected that you will need to pick Binary
        if model_type == 'BINARY':
            if self.params[7].value is None and self.params[1] is not None and \
                    self.params[0].value is not None:
                try:
                    desc = arcpy.Describe(self.params[0].value)
                except:
                    desc = ""
                field_type = ""
                for fieldObj in desc.fields:
                    if fieldObj.aliasName == field_value or fieldObj.name == field_value:
                        field_type = fieldObj.type
                        break
                if field_type and field_type == "String":
                    self.params[7].setIDMessage("ERROR", 735)
        elif model_type != "BINARY" and self.params[1] is not None and \
                self.params[0] is not None:
            try:
                desc = arcpy.Describe(self.params[0].value)
            except:
                desc = ""
            if hasattr(desc, "fields"):
                for fieldObj in desc.fields:
                    field_type = ""
                    if fieldObj.aliasName == field_value or fieldObj.name == field_value:
                        field_type = fieldObj.type
                        break
                    if field_type and field_type == "String":
                        self.params[1].setIDMessage("ERROR", 735)

        input_features = self.params[0].value
        input_features_predict = self.params[5].value  # updated

        explanatory_variables_text = self.params[3].valueAsText
        explanatory_variables = self.params[3].value
        explanatory_matching_variables = self.params[6]  # updated
        output_predictions = self.params[8]  # updated
        dependent_variable = self.params[1]

        d_input_features = None
        valid_input = [False, ]
        valid_input_predict = [False, ]

        # Error on services for input layer
        if input_features:
            try:
                d_input_features = arcpy.Describe(self.params[0])
            except:
                d_input_features = ""
            # input validation
            valid_input = validate_input_source(d_input_features)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])

        # Error on services for prediction layer
        if input_features_predict:
            try:
                d_input_features_predict = arcpy.Describe(self.params[5])
            except:
                d_input_features_predict = ""
            # input validation
            valid_input_predict = validate_input_source(
                d_input_features_predict)
            if not valid_input_predict[0]:
                self.params[5].setIDMessage('ERROR', valid_input_predict[1])

        if explanatory_variables and valid_input[0] and valid_input_predict[0]:
            # Require explanatory variable matching
            if explanatory_matching_variables.value is None:
                explanatory_matching_variables.setIDMessage("ERROR", 530)
            else:
                for i in explanatory_matching_variables.value:
                    if i[0].value in [None, ""]:
                        explanatory_matching_variables.setIDMessage("ERROR",
                                                                    530)
                    if i[1] in [None, ""]:
                        explanatory_matching_variables.setIDMessage("ERROR",
                                                                    530)

                aliasNameMapInputFC = dict()
                nameAliasMapInputFC = dict()
                if d_input_features:
                    if hasattr(d_input_features, "fields"):
                        for fieldObj in d_input_features.fields:
                            aliasNameMapInputFC[
                                fieldObj.aliasName] = fieldObj.name
                            nameAliasMapInputFC[
                                fieldObj.name] = fieldObj.aliasName
                predFields = []
                inFieldAliases = []
                missingMatch = []
                if explanatory_matching_variables.value:
                    for vtRow in explanatory_matching_variables.value:
                        predField = vtRow[0].value
                        indFieldAlias = vtRow[1]
                        predFields.append(predField)
                        inFieldAliases.append(indFieldAlias)
                        # explanatory_matching_variables.setIDMessage("ERROR", 110247, str(inFieldAliases))
                        # self.params[3].setIDMessage("ERROR", 110247, str(indFieldAlias))
                        if predField in ["#", ""]:
                            missingMatch.append(indFieldAlias)

                #  Missing Match
                if len(missingMatch):
                    missingMatch = ", ".join([i for i in missingMatch])
                    explanatory_matching_variables.setIDMessage("ERROR", 110158,
                                                                missingMatch)

                #  Check for Unique Input Fields
                inFieldsAliasSet = set(inFieldAliases)
                if len(inFieldsAliasSet) != len(inFieldAliases):
                    duplicate = []
                    for inFieldAlias in inFieldsAliasSet:
                        if inFieldAliases.count(
                                inFieldAlias) != 1 and inFieldAlias not in ['',
                                                                            '#']:
                            duplicate.append(inFieldAlias)
                    if len(duplicate) > 0:
                        duplicate = ", ".join(duplicate)
                        explanatory_matching_variables.setIDMessage("ERROR",
                                                                    110159,
                                                                    duplicate)

                #  Report Any Input Fields Left Unmatched From Ind Vars
                indVarAliases = set([nameAliasMapInputFC[indVar] for indVar in
                                     explanatory_variables_text.split(";") if
                                     indVar in nameAliasMapInputFC])
                missingVars = indVarAliases.difference(inFieldsAliasSet)

                if len(missingVars):
                    missingVars = ", ".join([i for i in missingVars])
                    explanatory_matching_variables.setIDMessage("ERROR", 110157,
                                                                missingVars)
                unexpectedVars = inFieldsAliasSet.difference(indVarAliases)
                hasEmptyField = False
                if '' in unexpectedVars or "#" in unexpectedVars:
                    hasEmptyField = True
                unexpectedVars = [v for v in unexpectedVars if
                                  v not in ['', '#']]
                if hasEmptyField:
                    unexpectedVars.append("''")
                if len(unexpectedVars):
                    unexpectedVars = ", ".join(unexpectedVars)
                    explanatory_matching_variables.setIDMessage("ERROR", 110247,
                                                                unexpectedVars)

                # if output value not specified, required
                if output_predictions.value is None:
                    output_predictions.setIDMessage("ERROR", 735)

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

    def paramChanged(self, param, checkValue=False):
        changed = param.altered and not param.hasBeenValidated
        if checkValue:
            if param.value:
                return changed
            else:
                return False
        else:
            return changed

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True