"""
 ga_desktop_forestbasedclassificationandregression.py

 Front end of 'Forest-based Classification and Regression' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context, run_ga_desktop_tool
from gautils.validation import validate_desktop_output, validate_input_source

if __name__ == '__main__':

    import json
    params = dict(predictionType=get_value(0, dict=d.prediction_type),
                  inFeatures=get_value(1, as_value = True, local_feature_layer=True),
                  outputTrained=get_value(2, local_feature_output=True),
                  variablePredict=json.dumps({"fieldName": get_value(3), "categorical": get_value(4, as_value=True)}),
                  explanatoryVariables=get_value(5, as_value=True, val_table='fbcr_explanatory_variables'),
                  createVariableImportanceTable=True if get_value(7) else False,
                  featuresToPredict=get_value(6, as_value = True, local_feature_layer=True) if get_value(6) else "",
                  variableOfImportance=get_value(7, local_feature_output=True),
                  outputPredicted=get_value(8, local_feature_output=True),
                  explanatoryVariableMatching=get_value(9, as_value=True, val_table='fbcr_explanatory_variable_matching'),
                  numberOfTrees=get_value(10, as_value=True),
                  minimumLeafSize=get_value(11, as_value=True),
                  maximumTreeDepth=get_value(12, as_value=True),
                  sampleSize=get_value(13, as_value=True),
                  randomVariables=get_value(14, as_value=True),
                  percentageForValidation=get_value(15, as_value=True))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    run_ga_desktop_tool('ForestBasedClassificationAndRegression', params, {"outputTrained":2, "outputPredicted":8})
    
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

        input_features = None

        if self.params[1].value:  # fine
            try:
                input_features = arcpy.Describe(self.params[1])  # fine
            except:
                input_features = ""
            if hasattr(input_features, "fields"):
                self.fieldAlias = {field.aliasName: (field.name, field.type) for field in input_features.fields}  # fine
                self.fieldNames = {field.name: (field.aliasName, field.type) for field in input_features.fields}  # fine
                self.fieldAlias.update(self.fieldNames)
            else:
                pass

        self.params[2].value = validate_desktop_output(
            self.params[2].valueAsText, False)  # output validation
        self.params[8].value = validate_desktop_output(
            self.params[8].valueAsText, False)  # output validation
        self.params[7].value = validate_desktop_output(
            self.params[7].valueAsText, True)  # output validation

        if self.params[3].value and hasattr(input_features, "fields"):  # fine
            for field in input_features.fields:
                if field.name == self.params[3].valueAsText:  # fine
                    if field.type == "String":
                        self.params[4].value = True  # fine

        prediction_type = self.params[0].valueAsText  # fine
        if prediction_type == "TRAIN":
            self.params[6].enabled = False  # updated
            self.params[8].enabled = False  # added
            self.params[9].enabled = False  # updated
            self.params[6].value = None  # updated
            self.params[8].value = None  # added
            self.params[9].value = None  # updated

        elif prediction_type == "TRAIN_AND_PREDICT":
            self.params[6].enabled = True  # updated
            self.params[8].enabled = True  # updated
            self.params[9].enabled = True  # updated

        #  Update Explanatory Variables - Using Trick To Avoid Click By Default
        if prediction_type in ["TRAIN", "TRAIN_AND_PREDICT"]:
            explanatory_variables = self.params[5].valueAsText  # Fine

            if explanatory_variables is not None:
                v = []
                #### Fill Exp Variables - Checking Aliases ####
                try:
                    for i in self.params[5].value:
                        if i[0].value not in [None, "#", ""]:
                            valueToInsert = self.getFieldType(i)
                            v.append([valueToInsert[0][0], valueToInsert[1]])
                except:
                    pass

                self.params[5].value = v  # fine

                if self.params[6].altered:  # updated
                    if self.params[6].value:  # updated
                        self.getDescribeF2P(self.params[6].value)  # updated

            #  Automatically populate matching variables
            features_to_predict = self.params[6]  # updated
            if features_to_predict.value:

                try:
                    expl_variables = self.params[5]  # fine
                    if expl_variables.value:
                        isFilled = False

                        explaVNames = []
                        for i in expl_variables.value:
                            fieldName = None
                            fieldAlias = None
                            val = str(i[0].value)

                            if val in self.fieldNames:
                                fieldName = val
                                fieldAlias = self.fieldNames[val][0]
                                explaVNames.append((fieldName, fieldAlias))
                            elif val in self.fieldAlias:
                                fieldAlias = val
                                fieldName = self.fieldAlias[val][0]
                                explaVNames.append((fieldName, fieldAlias))

                        explanatory_variable_matching = self.params[
                            9]  # updated
                        if explanatory_variable_matching.value:
                            matchV = explanatory_variable_matching.value
                            tEmptyToPredictFields = [i for i in matchV if
                                                     i[0] is not None]
                            isFilled = len(tEmptyToPredictFields) == len(
                                explaVNames)

                        if not isFilled:
                            explanatory_variable_matching.value = [
                                [self.existInF2P(i[0]), i[1]] for id, i in
                                enumerate(explaVNames)]
                        else:
                            values = []
                            if len(explaVNames):
                                for id, i in enumerate(explaVNames):
                                    v = matchV[id]
                                    ex = self.existInF2P(v[0].value)
                                    values.append([ex, i[1]])
                                explanatory_variable_matching.value = values

                except:
                    pass

                #### Clean Matching Variables ####
                if explanatory_variables is None:
                    self.params[9].value = None  # updated

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        variable_predict = self.params[3]
        exp_var = self.params[5]  # fine
        input_features = self.params[1].value
        prediction_type = self.params[0]  # fine
        input_features_predict = self.params[6].value  # updated 7->6
        explanatory_matching_variables = self.params[9]  # updated 9->8
        output_predictions = self.params[8]  # updated 9->8

        if input_features:
            try:
                d_input_features = arcpy.Describe(self.params[1])
            except:
                d_input_features = ""

            # input validation
            valid_input = validate_input_source(d_input_features)
            if not valid_input[0]:
                self.params[1].setIDMessage('ERROR', valid_input[1])

        if input_features_predict:
            try:
                d_input_features_predict = arcpy.Describe(self.params[6])
            except:
                d_input_features_predict = ""
            # input validation
            valid_input = validate_input_source(d_input_features_predict)
            if not valid_input[0]:
                self.params[6].setIDMessage('ERROR', valid_input[1])

        if exp_var.value is None:
            exp_var.setIDMessage("ERROR", 530)

        if prediction_type.valueAsText == "TRAIN_AND_PREDICT":
            if input_features_predict is None:
                self.params[6].setIDMessage("ERROR", 530)
            if explanatory_matching_variables.value is None:
                explanatory_matching_variables.setIDMessage("ERROR", 530)
            else:
                for i in explanatory_matching_variables.value:
                    if i[0].value in [None, ""]:
                        explanatory_matching_variables.setIDMessage("ERROR",
                                                                    530)
            if output_predictions.value is None:
                output_predictions.setIDMessage("ERROR", 530)

        if self.params[10].value is not None:  # updated 9-10
            if self.params[10].value < 1:  # updated 9-10
                self.params[10].setIDMessage("ERROR", 30111, self.params[
                    10].displayName)  # updated

        if self.params[11].value is not None:  # updated 10->11
            if self.params[11].value < 1:  # updated 10->11
                self.params[11].setIDMessage("ERROR", 30111, self.params[
                    11].displayName)  # updated

        if self.params[12].value is not None:  # updated 11-12
            if self.params[12].value < 1 or self.params[12].value > 30:
                self.params[12].setIDMessage("ERROR", 120192)

        if self.params[14].value is not None:  # updated 13-14
            if self.params[14].value < 1:  # updated 13-14
                self.params[14].setIDMessage("ERROR", 30111, self.params[
                    14].displayName)  # updated 13-14

        if prediction_type.valueAsText in ["TRAIN", "TRAIN_AND_PREDICT"]:
            explanatory_variables_text = self.params[5].valueAsText
            if explanatory_variables_text is not None:
                seen = []
                variable_predict_alias = ""
                for i in self.params[5].value:

                    if i[0].value not in [None, "#", ""]:
                        if variable_predict and hasattr(d_input_features,
                                                        "fields"):
                            for field in d_input_features.fields:
                                if field.name == str(variable_predict.value):
                                    variable_predict_alias = field.aliasName
                            if str(i[0].value) == variable_predict_alias:
                                self.params[5].setIDMessage("ERROR", 110182,
                                                            str(i[0].value))
                        if i[0].value not in seen:
                            seen.append(i[0].value)
                        else:
                            self.params[5].setIDMessage("ERROR", 110182,
                                                        str(i[0].value))

    def getFieldType(self, row):
        dat = ([self.fieldAlias[str(row[0].value)], False], False) \
            if row[1] in [None, False, "#"] \
            else ([self.fieldAlias[str(row[0].value)], row[1]], True)

        #  If Field is Set as Categorical
        if dat[1]:
            return dat[0]

        #  If Field is String Then Considered Categorical (True) Overwrite User
        row = dat[0]
        if self.fieldAlias:
            if row[0][0] in self.fieldAlias:
                fieldType = self.fieldAlias[row[0][0]][1]
                if fieldType == "String":
                    return [row[0], True]
        return row

    def getDescribeF2P(self, inputFC):
        try:
            self.descF2P = arcpy.Describe(inputFC)
            self.fieldAliasF2P = [field.aliasName.lower() for field in
                                  self.descF2P.fields]
            self.fieldNamesF2P = [field.name.lower() for field in self.descF2P.fields]
        except:
            pass

    def existInF2P(self, name):
        try:
            if name.lower() in self.fieldAliasF2P:
                return name
            if name.lower() in self.fieldNamesF2P:
                return name
        except:
            pass

        return None

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True