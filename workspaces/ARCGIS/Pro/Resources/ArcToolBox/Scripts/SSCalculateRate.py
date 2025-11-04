# coding: utf-8
"""
Source Name:   SSCalculateRate.py
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
    num = parameters[1].valueAsText
    denom = parameters[2].valueAsText
    fieldName = parameters[3].valueAsText

    if fieldName == None:
        fieldName = "Rate"

    expression = ''.join(["!", num, "!/!", denom, "!"])

    arcpy.management.CalculateField(inputData, fieldName, expression, "PYTHON3", '', "DOUBLE")
