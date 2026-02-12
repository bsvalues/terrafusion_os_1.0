# coding: utf-8
"""
Source Name:   SSStandardizeField.py
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
    #ARCPY.AddMessage([str(i.value) for i in parameters])
    #### User Defined Inputs ####
    inputData = UTILS.getInputAppendParameter(0, parameters)
    outputFC = parameters[5].valueAsText
    #### Analysis Fields ####
    method = parameters[2].valueAsText
    minValue = parameters[3].value
    maxValue = parameters[4].value
    fields = parameters[1].value

    if method in ["#", "", None]:
        ARCPY.AddWarning("The standardized method used is: " +  "Z-Score")
        method = "Z-SCORE"

    analysisFields = []
    analysisFieldsUpper = []

    for value in fields:
        fieldName = value[0]
        
        if hasattr(value[0],"value"):
            fieldName = value[0].value
        analysisFields.append(str(fieldName))
    analysisFieldsUpper = [ i.upper() for i in analysisFields ]
    fieldList = [ i for i in analysisFields ]
    
    #### Handle alias field Name  ####
    fieldsToChange = None
    if fields is not None:
        fieldsToChange = {str(f[0].value).upper(): f[1] for f in fields}

    fieldsToChange = UTILS.CheckFieldNames(fieldsToChange, inputData)

    args = {"Minimum": minValue, "Maximum":maxValue}

    appendFields = "APPEND_FIELDS_INPUT"

    #### Apply Extent ####
    inputData, createTempLayer  =  UTILS.createLayerFromExtent(inputData)

    #### Read Data ####
    reader = UTILS.GenericReader(inputData, [analysisFieldsUpper], generateBlockOfData = False,
             blockType = ["float"], outputOption = appendFields, displayProjectionWarning = False,
             readNullValues = True)

    #### Transform Data ####
    getTransf = UTILS.StandardizeVariable(reader = reader,
                                        fieldList = fieldList,
                                        method = method, args = args,
                                        aliasFieldNames = fieldsToChange,
                                        isNullable = UTILS.isGDB(inputData))
    getTransf.applyFunctionInEachField()

    outputData = []
    fieldNames = []
    aliasFieldNames = []

    #### Only when new dataset is created ####
    if reader.outputOption == "NEW_DATASET_JUST_NEW_FIELDS":
        #### Organize Output ####
        outputData = [reader.oidFieldData ] + \
                     [reader.getData(i) for i in analysisFieldsUpper ] + \
                     getTransf.outputData
        fieldNames = ["SOURCE_ID"] + [i for i in analysisFieldsUpper ] + \
                     getTransf.fieldNames
        aliasFieldNames = ["Source ID"] + [reader.dictFields[i] for i in fieldList] + \
                          getTransf.fieldNameAlias
    else:
        #### Organize Output ####
        outputData = getTransf.outputData
        fieldNames = getTransf.fieldNames
        aliasFieldNames = getTransf.fieldNameAlias

    #### Write Output ####
    reader.output(outputFC, outputData, fieldNames, 
                  aliasFieldNames, parameters = parameters,
                  indexOutput = 5, indexInput = 0, allowOverwriteFields = True)
                  
    #### Remove Temporal layer ####
    if createTempLayer:
        try:
            ARCPY.management.Delete('refLayer')
        except:
            pass