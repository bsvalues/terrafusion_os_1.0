"""---------------------------------------------------------------------------
Name:              FieldCalculator_dt.py
Purpose:           Field calculations
Author:            Esri Inc.
Created:           1/27/2014
Copyright:   (c)   Esri, Inc. 2014
ArcGIS Version:    10.2014
---------------------------------------------------------------------------"""
import os
import json
import arcpy
import analysisutils


arcpy.env.overwriteOutput = True

ERROR_IDS = {100055:u"Invalid expression, malformed JSON.",
             100082:u"A field name is required.",
             100083:u"A field expression is required.",
             100084:u"Field type is required to be one of String, Integer, Double, or Date.",
             100085:u"Field type is required to be String, Integer, Double or Date."}


reclassValueCodeBlock = """
def reclassValue(value, classes, nodata):
  for classmap in classes:
    if value == classmap[0]:
      return classmap[1]
  return nodata
"""

reclassRangeCodeBlock = """
def reclassRange(value, classes, nodata):
  for classmap in classes:
    if value >= classmap[0] and value < classmap[1]:
      return classmap[2]
  return nodata
"""

conCodeBlock = """
def con(conditions, nodata):
  for condition in conditions:
    if condition[0]:
      return condition[1]
  return nodata
"""


def fieldCalculator(in_feature, expressions, out_feature_class):
    """Calculate Field. Calculates existing field based on input
    expression or creates a new field and calculates an input expression
    for the new field.
    """
    if not verifyInputs(expressions, in_feature):
        raise arcpy.ExecuteError
    arcpy.CopyFeatures_management(in_feature, out_feature_class)
    if os.path.dirname(out_feature_class) == "in_memory":
        wkspc = "in_memory"
    else:
        wkspc = arcpy.env.scratchGDB
    for field_dict in expressions:
        field_info = field_dict.get("field")
        f_name = field_info.get("name")
        f_type = field_info.get("type")
        f_alias = field_info.get("alias")
        f_length = field_info.get("length")
        expression = field_dict.get("expression")
        f_name = arcpy.ValidateFieldName(f_name, wkspc)
        if "type" in field_info:
            newField(out_feature_class, f_name, f_type, f_alias, f_length)
        code_block = ""
        if "reclassValue(" in expression:
            code_block = reclassValueCodeBlock
        elif "reclassRange(" in expression:
            code_block = reclassRangeCodeBlock
        elif "con(" in expression:
            code_block = conCodeBlock
        try:
            arcpy.CalculateField_management(out_feature_class,
                                            f_name,
                                            expression,
                                            "PYTHON_9.3",
                                            code_block)
        except:
            analysisutils.AddErrorCode(u"The expression {} is invalid".format(expression), 100088)


def verifyInputs(expressions, in_feature):
    for field_dict in expressions:
        field_info = field_dict.get("field")
        if field_info:
            f_name = field_info.get("name")
            f_type = field_info.get("type")
            f_exp = field_dict.get("expression")
            if not f_name:
                analysisutils.AddErrorCode(ERROR_IDS[100082], 100082)
                return False
            elif not f_exp:
                analysisutils.AddErrorCode(ERROR_IDS[100083], 100083)
                return False
            elif len(field_info) > 1 and not f_type:
                analysisutils.AddErrorCode(ERROR_IDS[100084], 100084)
                return False
            field_exists = verifyField(in_feature, f_name)
            if f_type:
                if field_exists:
                    analysisutils.AddErrorCode(u"Field {} already exists in {}".format(f_name, in_feature), 100086)
                    return False
                elif not f_type.upper() in ["STRING", "INTEGER", "DOUBLE", "DATE"]:
                    analysisutils.AddErrorCode(ERROR_IDS[100085], 100085)
                    return False
            else:
                if not field_exists:
                    analysisutils.AddErrorCode(u"Field {} does not exist in {}".format(f_name, in_feature), 100087)
                    return False
        else:
            analysisutils.AddErrorCode(ERROR_IDS[100055], 100055)
            return False
    return True


def verifyField(input_fc, f_name):
    field_check = arcpy.ListFields(input_fc, f_name)
    if field_check:
        return True
    else:
        return False


def newField(out_feature_class, f_name, f_type, f_alias, f_length):
    if f_type.upper() == "INTEGER":
        f_type = "LONG"
    elif f_type.upper() == "STRING":
        f_type = "TEXT"
    if f_type.upper() == "LONG" or f_type.upper() == "DOUBLE":
        addfield_params = (out_feature_class, f_name, f_type, f_length, "", "", f_alias)
    elif f_type.upper() == "DATE" or f_type.upper() == "TEXT":
        addfield_params = (out_feature_class, f_name, f_type, "", "", f_length, f_alias)
    arcpy.AddField_management(*addfield_params)


if __name__ == "__main__":
    in_feature = arcpy.GetParameterAsText(0)
    try:
        expressions = json.loads(arcpy.GetParameterAsText(1))
    except:
        analysisutils.AddErrorCode(ERROR_IDS[100055], 100055)
    out_feature_class = arcpy.GetParameterAsText(2)

    fieldCalculator(in_feature, expressions, out_feature_class)
