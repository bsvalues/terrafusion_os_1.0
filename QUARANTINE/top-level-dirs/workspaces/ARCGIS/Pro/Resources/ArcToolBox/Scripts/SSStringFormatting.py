# coding: utf-8
"""
Source Name:   SSStringFormationg.py
Version:       ArcGIS PRO 2.6
Author:        Environmental Systems Research Institute Inc.
Description:   Reclassify Field
"""
import arcpy
import arcpy as ARCPY
import SSUtilities as UTILS
import numpy as NUM
import os as OS
import re
# run the script
if __name__ == '__main__':

    parameters = arcpy.GetParameterInfo()
    inputData = parameters[0].valueAsText
    formattingOp = parameters[1].valueAsText
    fieldToFormat = parameters[2].valueAsText
    outputField = parameters[3].valueAsText

    if formattingOp == "FIND_AND_REPLACE":
        findExp = parameters[4].valueAsText.replace(';', '|')
        findExp = re.sub(''';(?=(?:[^']|'[^']*')*$)''', '|', findExp)

        if " " in findExp:
            findExp = findExp.replace("'","")

        replaceExp = parameters[5].valueAsText
        replaceExp = replaceExp.replace("'", "\\'")
        
    elif formattingOp == "REPLACE_WITH_REGEX":
        findExp = parameters[6].valueAsText
        replaceExp = parameters[7].valueAsText
        replaceExp = replaceExp.replace("'", "\\'")

    stringLength = parameters[8].valueAsText
    padValue = parameters[9].valueAsText
    padLocation = parameters[10].valueAsText

    if formattingOp in ["FIND_AND_REPLACE", "REPLACE_WITH_REGEX"]:

        command = "".join(["regex(!", fieldToFormat, "!)"])
        expression = "import re\ndef regex(field):\n\tnew = re.sub('{0}','{1}', field)\n\treturn new".format(findExp,replaceExp) 
        arcpy.management.CalculateField(inputData, outputField, command, "PYTHON3",
                                        expression, "TEXT")

    else:
        if padLocation == "START":
            command = "".join(["!", fieldToFormat, "!.rjust(", stringLength, ", '", padValue, "')"])
        else:
            command = "".join(["!", fieldToFormat, "!.ljust(", stringLength, ", '", padValue, "')"])

        arcpy.management.CalculateField(inputData, outputField, command, "PYTHON3", '', "TEXT")
