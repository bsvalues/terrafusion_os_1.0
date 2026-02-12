# coding: utf-8
"""
Source Name:   SSTransformField.py
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
    #### User Defined Inputs ####
    #inputData = parameters[0].value
    inputData = UTILS.getInputAppendParameter(0, parameters)
    outputFC = parameters[5].valueAsText
    #### Analysis Fields ####
    method = parameters[2].valueAsText
    appendFields = "APPEND_FIELDS_INPUT"
    fields = parameters[1].values

    analysisFields = []
    analysisFieldsUpper = []
    for value in fields:
        fieldName = value[0]
        if hasattr(value[0],"value"):
            fieldName = value[0].value
        analysisFields.append(str(fieldName))
    analysisFieldsUpper = [ i.upper() for i in analysisFields ]
    fieldList = [ i for i in analysisFields ]

    method = parameters[2].valueAsText

    #### Apply Extent ####
    inputData, createTempLayer  =  UTILS.createLayerFromExtent(inputData)

    #### Read Data ####
    reader = UTILS.GenericReader(inputData, [analysisFieldsUpper], generateBlockOfData = False,
             blockType = ["float"], outputOption = appendFields, displayProjectionWarning = False,
             readNullValues = True)

    #### Handle alias field Name  ####
    fieldsToChange = None
    if fields is not None:
        fieldsToChange = {str(f[0].value).upper(): f[1] for f in fields}

    fieldsToChange = UTILS.CheckFieldNames(fieldsToChange, inputData)

    #### Sigma should be Zero in the inverse box-cox ####
    sigma = parameters[4].value
    if method in [ "INV_BOX-COX", "INV_LOG"]:
        if sigma is None:
            sigma = 0

    if method == "INVX":
        sigma = None

    args = {"lambda": parameters[3].value, "sigma": sigma}

    #### Transform Data ####
    getTransf = UTILS.TransformVariable(reader = reader,
                                        fieldList = fieldList,
                                        method = method,
                                        args = args,
                                        aliasFieldNames =  fieldsToChange,
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
    reader.output(outputFC, outputData, fieldNames, aliasFieldNames, parameters = parameters,
                  indexOutput = 5, indexInput = 0, allowOverwriteFields = True)
    ARCPY.gp.setParameter(5, inputData)

    charts = []
    for  fieldN in reader.outputField:
        mgTitle = ARCPY.GetIDMessage(220116)
        nameChart = ARCPY.GetIDMessage(220117)
        title = mgTitle.format(fieldN)
        histChart = ARCPY.Chart(nameChart.format(fieldN))
        histChart.type = 'histogram'
        histChart.title = title
        histChart.xAxis.field = fieldN
        histChart.xAxis.title =  ARCPY.GetIDMessage(84974)
        histChart.yAxis.title =  ARCPY.GetIDMessage(84785)
        histChart.histogram.showComparisonDistribution = True
        histChart.histogram.showMean = True
        charts.append(histChart)
    parameters[5].charts = charts

    #### Remove Temporal layer ####
    if createTempLayer:
        try:
            ARCPY.management.Delete('refLayer')
        except:
            pass