# coding: utf-8
"""
Source Name:   SSClearSelection.py
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

    arcpy.management.SelectLayerByAttribute(inputData, "CLEAR_SELECTION", '', None)
