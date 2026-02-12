# coding: utf-8
"""
Source Name:   SSConvertFieldType.py
Version:       ArcGIS PRO 2.6
Author:        Environmental Systems Research Institute Inc.
Description:   Reclassify Field
"""
import arcpy
import arcpy as ARCPY
import SSUtilities as UTILS
import numpy as NUM
import os as OS
# run the script
if __name__ == '__main__':

    parameters = arcpy.GetParameterInfo()
    inputData = parameters[0].valueAsText
    inputField = parameters[1].valueAsText
    outputType = parameters[2].valueAsText.upper()
    replace = parameters[3].value
    fieldName = parameters[4].valueAsText

    if replace == False:
        expression = ''.join(["!", inputField, "!"])

        arcpy.management.CalculateField(inputData, fieldName, expression, "PYTHON3", '', outputType)
    else:

        expression = ''.join(["!", inputField, "!"])
        tempField = ''.join([inputField, "_temp"])

        type = arcpy.ListFields(inputData, inputField)[0].type
        fieldDict = {"Integer": "LONG", "String": "TEXT", "SmallInteger": "SHORT"}
        if type in ("Integer","String","SmallInteger"):
            type = fieldDict[type]

        arcpy.AddMessage(type)
        arcpy.management.CalculateField(inputData, tempField, expression, "PYTHON3", '', type)

        arcpy.management.DeleteField(inputData, inputField)

        expression = ''.join(["!", tempField, "!"])

        arcpy.management.CalculateField(inputData, inputField, expression, "PYTHON3", '', outputType.upper())

        arcpy.management.DeleteField(inputData, tempField)
