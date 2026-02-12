"""
 ga_server_forestbasedclassificationandregression.py

 Front end of 'Forest-based Classification and Regression' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from gautils.validation import validate_output, validate_server_input
from gautils.utilities import PortalVersion


if __name__ == '__main__':


    analysis_type = "Forest Based Classification And Regression"
    import json
    params = dict(predictionType=get_value(0, dict=d.prediction_type),
                  inFeatures=get_value(1, as_value=True),
                  outputTrainedName=get_value(2),
                  variablePredict=json.dumps({"fieldName": get_value(3), "categorical": get_value(4, as_value=True)}),
                  explanatoryVariables=get_value(5, as_value=True, val_table='fbcr_explanatory_variables'),
                  createVariableImportanceTable=get_value(6),
                  featuresToPredict=get_value(7, as_value=True),
                  explanatoryVariableMatching=get_value(8, as_value=True, val_table='fbcr_explanatory_variable_matching'),
                  numberOfTrees=get_value(9),
                  minimumLeafSize=get_value(10),
                  maximumTreeDepth=get_value(11),
                  sampleSize=get_value(12),
                  randomVariables=get_value(13),
                  percentageForValidation=get_value(14))
                  
    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(15, dict=d.datastore),
                                    geoanalytics=True)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)

    if isinstance(output, list):
        id = 16
        for output_returned in output:
            if isinstance(output_returned, str):
                PI = output_returned
            else:
                arcpy.SetParameterAsText(id, output_returned)
            id += 1
    else:
        arcpy.SetParameterAsText(16, output)
    
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
            self.params[3].filter.list = ["Short", "Long", "BigInteger", "Float", "Double", "Text"]
            self.params[5].filters[0].list = ["Short", "Long", "BigInteger", "Float", "Double", "Text"]
            self.params[8].filters[0].list = ["Short", "Long", "BigInteger", "Float", "Double", "Text"]

        input_features = None
        if self.params[1].value:

            try:
                input_features = arcpy.Describe(self.params[1])
            except:
                input_features = ""
            if hasattr(input_features, "fields"):
                self.fieldAlias = {field.aliasName: (field.name, field.type) for
                                   field in input_features.fields}
                self.fieldNames = {field.name: (field.aliasName, field.type) for
                                   field in input_features.fields}
                self.fieldAlias.update(self.fieldNames)

        output_name = self.params[2].valueAsText
        if output_name:
            self.params[2].value = validate_output(output_name)

        if self.params[3].value:
            if hasattr(input_features, "fields"):
                for field in input_features.fields:
                    if field.name == self.params[3].valueAsText:
                        if field.type == "String":
                            self.params[4].value = True

        prediction_type = self.params[0].valueAsText
        if prediction_type == "TRAIN":
            self.params[7].enabled = False
            self.params[8].enabled = False
            self.params[7].value = None
            self.params[8].value = None
        elif prediction_type == "TRAIN_AND_PREDICT":
            self.params[7].enabled = True
            self.params[8].enabled = True

        #### Update Explanatory Variables - Using Trick To Avoid Click By Default ####
        if prediction_type in ["TRAIN", "TRAIN_AND_PREDICT"]:
            explanatory_variables = self.params[5].valueAsText

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

                self.params[5].value = v

                if self.params[7].altered:
                    if self.params[7].value:
                        self.getDescribeF2P(self.params[7].value)

            ### Automatically populate matching variables
            features_to_predict = self.params[7]
            if features_to_predict.value:

                try:
                    expl_variables = self.params[5]
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

                        explanatory_variable_matching = self.params[8]
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
                    self.params[8].value = None

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        if PortalVersion() < 7.1:
            if self.params[0].valueAsText:
                self.params[0].setIDMessage('ERROR', 120184)
            else:
                self.params[0].setIDMessage('WARNING', 120184)

        if self.params[1].value:
            validate = validate_server_input(self.params[1].valueAsText)
            if not validate[0]:
                self.params[1].setIDMessage('ERROR', validate[1])
        if self.params[7].value:
            validate = validate_server_input(self.params[7].valueAsText)
            if not validate[0]:
                self.params[7].setIDMessage('ERROR', validate[1])

        variable_predict = self.params[3]
        exp_var = self.params[5]
        if exp_var.value is None:
            exp_var.setIDMessage("ERROR", 530)

        prediction_type = self.params[0]
        input_features_predict = self.params[7]
        explanatory_matching_variables = self.params[8]
        if prediction_type.valueAsText == "TRAIN_AND_PREDICT":
            if input_features_predict.value is None:
                input_features_predict.setIDMessage("ERROR", 530)
            if explanatory_matching_variables.value is None:
                explanatory_matching_variables.setIDMessage("ERROR", 530)
            else:
                for i in explanatory_matching_variables.value:
                    if i[0].value in [None, ""]:
                        explanatory_matching_variables.setIDMessage("ERROR",
                                                                    530)

        if self.params[9].value is not None:
            if self.params[9].value < 1:
                self.params[9].setIDMessage("ERROR", 30111,
                                            self.params[9].displayName)

        if self.params[10].value is not None:
            if self.params[10].value < 1:
                self.params[10].setIDMessage("ERROR", 30111,
                                             self.params[10].displayName)

        if self.params[11].value is not None:
            if self.params[11].value < 1:
                self.params[11].setIDMessage("ERROR", 30111,
                                             self.params[11].displayName)

        if self.params[13].value is not None:
            if self.params[13].value < 1:
                self.params[13].setIDMessage("ERROR", 30111,
                                             self.params[13].displayName)

        if prediction_type.valueAsText in ["TRAIN", "TRAIN_AND_PREDICT"]:
            explanatory_variables_text = self.params[5].valueAsText
            if explanatory_variables_text is not None:
                seen = []
                for i in self.params[5].value:

                    if i[0].value not in [None, "#", ""]:
                        if variable_predict.value:
                            if str(i[0].value) == variable_predict.valueAsText:
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
        #### If Field is Set as Categorical ####
        if dat[1]:
            return dat[0]

        #### If Field is String Then It is Considered Categorical (True) Overwrite User ####
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