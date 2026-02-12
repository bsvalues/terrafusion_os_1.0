# coding: utf-8
"""
Source Name:   SSModelPredict.py
Version:       ArcGIS Pro 3.1
Author:        Environmental Systems Research Institute Inc.
Description:   Python file with utilities classes for predicting models.
"""
################### Imports ########################

import os as OS
import sys as SYS
import numpy as NUM
import arcgisscripting as ARC
import arcpy as ARCPY
import arcpy.management as DM
import SSDataObject as SSDO
import SSUtilities as UTILS
import scipy.spatial as SCPS
import time as TIME
import json as JSON
import locale as LOCALE
import datetime as DT
import SSForest as SF
import h5py as H5
import SSPresenceOnlyPrediction as POP
import GLR

##### Global Variables #####

class ModelVariables(SF.InfoForestField):
    def __init__(self, isTraining = True):
        super().__init__(isTraining = isTraining)

    def isClassification(self):
        if not hasattr(self, "yField") and self.yField is not None:
            ARCPY.AddError("The Model does not have a Y variable")
            raise SystemExit()
        return self.yField.rfType.upper() !="NUMERIC"


def findStr(s, ch):
    """ Find location chart"""
    return [i for i, ltr in enumerate(s) if ltr == ch]

def getValue(value):
    """ Get List from Parameter text """
    v1 = ""
    v2 = ""
    v3 = ""
    if "'" in value:
        locs = findStr(value,"'")
        if len(locs) == 2 and locs[0] == 0:
            v1 = value[locs[0]+1:locs[1]]
            v2 = value[locs[1]+1:len(value)].strip()
            if " " in v2:
                parts = v2.split(" ")
                if len(parts) == 1:
                    v2 = parts[0]
                else:
                    v2 = parts[0]
                    v3 = parts[1]
        if len(locs) ==2 and locs[0] > 0:
            v1 = value[0:locs[0]].strip()
            v2 = value[locs[0]+1:locs[1]]
            v3 = value[locs[1]+1:len(value)].strip()
        if len(locs) == 4:
            v1 = value[locs[0]+1:locs[1]]
            v2 = value[locs[2]+1:locs[3]].strip()
            v3 = value[locs[3]+1:len(value)].strip()
    else:
        return value.split(" ")
    return [v1, v2, v3]


def redefineParameters(trainedModelVariables,parameters):
    """ Create value tables of two columns from Predict By model
        parameters of three columns. In this way, we can reuse the 
        original Tool function to check the matching variables.
    """
    param5= ARCPY.Parameter(displayName="Match Explanatory Variables",
                        name = "explanatory_variable_matching",
                        datatype = "GPValueTable",
                        parameterType = "Optional",
                        direction = "Input")
    param5.columns = [['GPString', 'Prediction'], ['GPString','Training']]
    param5.filters[0].list = ["Double", "Float", "Short", "Long", "Text", "BigInteger"]
    param5.filters[1].list = []
   
    param7 = ARCPY.Parameter(displayName="Match Explanatory Rasters",
                        name = "explanatory_rasters_matching",
                        datatype = "GPValueTable",
                        parameterType = "Optional",
                        direction = "Input")
    param7.columns = [['GPString', 'Prediction'], ['GPString','Training']]


    fcs = trainedModelVariables.getVariablesByType(attr = "source", valueToFind = "FC", getObj = True)
    rasters = trainedModelVariables.getVariablesByType(attr = "source", valueToFind = "RASTER", getObj = True)

    if len(fcs):
        numeric = []
        categoric = []
        values = []
        vals = parameters[5].valueAsText.split(";")
        for fldM,v in zip(vals,fcs):
            info = getValue(fldM)
            values.append([info[0],v['name']])
            if not ((info[2].upper() in ["CATEGORICAL", 'TRUE'] and v["variableType"].upper() == "CATEGORICAL") or \
               (info[2].upper() in ["NUMERIC", 'FALSE'] and v["variableType"].upper() == "NUMERIC")):
                if v["variableType"].upper() == "CATEGORICAL":
                    categoric.append(info[0])
                else:
                    numeric.append(info[0])
        if len(categoric):
            ARCPY.AddIDMessage("Warning",110504, ",".join(categoric))
        if len(numeric):
            ARCPY.AddIDMessage("Warning",110505, ",".join(numeric))
        param5.values = values
        parameters[5] = param5

    if len(rasters):
        numeric = []
        categoric = []
        valuesR = []
        vals = parameters[7].valueAsText.split(";")

        for rr,v in zip(vals, rasters):
            p = getValue(rr)
            val = ARCPY.sa.Raster(p[0])
            valuesR.append([p[0], v["name"]])
            info = [str(r) for r in p]
            if not ((info[2].upper() in ["CATEGORICAL", 'TRUE'] and v["variableType"].upper() == "CATEGORICAL") or \
               (info[2].upper() in ["NUMERIC", 'FALSE'] and v["variableType"].upper() == "NUMERIC")):
                val = ARCPY.sa.Raster(p[0])
                if v["variableType"].upper() == "CATEGORICAL":
                    categoric.append(val.name)
                else:
                    numeric.append(v["name"])
            del val
        if len(categoric):
            ARCPY.AddIDMessage("Warning",110506, ",".join(categoric))
        if len(numeric):
            ARCPY.AddIDMessage("Warning",110507, ",".join(numeric))
  
        param7.values = valuesR
        parameters[7] = param7

def executeModel(pytRF, parameters1):
    """
    Prepare information for model predicting 
    """
    parameters = [p for p in parameters1]
    modelInput = parameters[0].valueAsText
    modelType = ""
    if parameters[0].value is not None:
        try:

            if ARCPY.Exists(modelInput):
                dataset = H5.File(modelInput,"r")
                modelType = dataset.attrs["MODEL_TYPE"]
                dataset.close()
        except Exception as e:
            ARCPY.AddIDMessage("ERROR", 210, modelInput)
            pass

    trainedModelVariables = None

    #### Load Model Variables from Model fiile ####
    trainedModelVariables = ModelVariables(isTraining = True)
    trainedModelVariables.loadInfo(modelInput)

    ### Print Variables ####
    printModelVariables(trainedModelVariables)

    ### Redifine matching parameters from three columns to two columns ####
    redefineParameters(trainedModelVariables, parameters)

    prefix = None
    if modelType in  ["Forest", "Gradient_Boosted"]:
        prefix = "FB"

    if trainedModelVariables is not None:
        trainedModelVariables.loadAllVariables(modelInput, prefix)

        if modelType == "POP":
            POP.predictFromModel(trainedModelVariables, parameters)

        if modelType == "GLR":
            GLR.predictFromModel(trainedModelVariables, parameters)

        if modelType in  ["Forest", "Gradient_Boosted"]:
            ### Read new model variables defined in the tool ###
            addProb = UTILS.ModelMetadata.getData(modelInput, "FB_addProbabilities","attribute")

            if addProb is not None:
                trainedModelVariables.otherAttr["addProbabilities"] = True

            SF.predictFromModel(trainedModelVariables, parameters, modelType)


def reportTable(modelInput):
    """Creates a formatted summary table of the OLS
    coefficients."""
    #### Load Model Variables from Model fiile ####
    model = ModelVariables(isTraining = True)
    model.loadInfo(modelInput)
    printModelVariables(model)

def printModelVariables(model):
    """ Print model variables """

    metadata = model.metadata
    modelDescription = model.modelDescription
    version = model.version
    history = model.history
    modelType = model.modelType

    info = {"Yhat":   ARCPY.GetIDMessage(220574),
            "FC"    : ARCPY.GetIDMessage(220575),
            "DIST"  : ARCPY.GetIDMessage(220576),
            "RASTER": ARCPY.GetIDMessage(220577) }
    headerLabel = ARCPY.GetIDMessage(220646) 
    varName = ARCPY.GetIDMessage(220273) 
    varAlias = ARCPY.GetIDMessage(220309) 
    descrip = ARCPY.GetIDMessage(84919)
    unit = ARCPY.GetIDMessage(220578)
    categorical = ARCPY.GetIDMessage(220579)
    no = ARCPY.GetIDMessage(260213)
    yes = ARCPY.GetIDMessage(260212)
    fieldType = ARCPY.GetIDMessage(220310)
    #### Create Table ####

    total = []
    ids = ["name","alias", "fieldType", "description", "unit", "variableType"]
    header = ["", varName, varAlias, fieldType, descrip, unit,  categorical]
    justify = ["left","left", "left","left","left","left", "left"]

    if modelType == "GLR":
        header = ["", varName, varAlias, fieldType, descrip, unit]
        justify = ["left", "left", "left","left","left", "left"]
        ids = ["name","alias", "fieldType","description","unit"]

    total.append(header)
    sep=[]

    for type  in info:
        if "Yhat" == type:
            empty =[UTILS.buildTableCell(info[type], rowSpan=2, colSpan=1)]
            total.append(empty)
            value = []
            variable = metadata[type]
            for id in ids:
                if id == "fieldType":
                    if variable[id] is not None:
                        value.append(UTILS.dataTypeLoc[variable[id].upper()])
                    else:
                        value.append("")
                elif id == "variableType":
                    if modelType == "POP":
                        value.append("")
                    elif modelType == "GLR":
                        if modelDescription == ARCPY.GetIDMessage(220587):
                             value.append(yes)
                        else:
                            value.append(no)
                    else:
                        value.append(no if variable[id].upper() == "NUMERIC" else yes)
                else:
                    value.append( variable[id])
            total.append(value)
        else:
            variables = model.getVariablesByType(source= type, getObj = True)
            for variable in variables:
                if type not in sep:
                    sep.append(type)
                    empty =[UTILS.buildTableCell(info[type], rowSpan=len(variables)+1, colSpan=1)]
                    total.append(empty)
                value = []
                for id in ids:
                    if id == "fieldType":
                        value.append(UTILS.dataTypeLoc[variable[id].upper()])
                    elif id == "variableType":
                        if variable['source'] == "DIST":
                            value.append(no)
                        else:
                            value.append(no if variable[id].upper() == "NUMERIC" else yes)
                    else:
                        if variable[id] is None:
                            value.append("")
                        else:
                            value.append(variable[id])
                total.append(value)
    #### Finalize Coefficient Table ####
    out = UTILS.outputTextTable(total, header = headerLabel,
                                           pad = 1, justify = justify,
                                           titleFillToken = "-",
                                           emptyFillToken = "-", returnHTMLMsg=True,
                                           force2Txt=False)

    dt = DT.datetime.strptime(model.history.replace('Created by ',""), "%m/%d/%Y, %H:%M:%S")
    msg = ARCPY.GetIDMessage(220580)
    ARCPY.AddMessage(msg.format(str(model.appVersion),str(dt.ctime())))
    ARCPY.AddMessage(modelDescription)
    ARCPY.AddMessage(out)

def describeModel(pytRF, parameters, paramP, update = True):
    """
    Update metadata and Describe model
    """

    modelInput = parameters[0].valueAsText
    modelType = ""
    metadata = None
    if parameters[0].value is not None:
        try:

            if ARCPY.Exists(modelInput):
                dataset = H5.File(modelInput,"r")
                modelType = dataset.attrs["MODEL_TYPE"]
                metadataSTR = dataset.attrs["METADATA"]
                metadata = JSON.loads(metadataSTR)
                dataset.close()
        except Exception as e:
            ARCPY.AddIDMessage("ERROR", 210, modelInput)
            pass

    if update:
        tableYhat =  parameters[1]
        tableVars =  parameters[2]
        tableDist =  parameters[3]
        tableRast =  parameters[4]

        if metadata is not None:

            vars = list(metadata.keys())
            parts = {}

            for id, v in enumerate(vars):
                val = metadata[v]
                parts[val["name"]] = [val["name"], val["description"], val["unit"]]

            changed = False
            cnt = 0
            for table in [tableYhat, tableVars, tableDist, tableRast]:
                values = table.values
                if values is not None:
                    for id, val in enumerate(values):
                        varN = val[0]
                        info = parts[val[0]]
                        if cnt == 0:
                            varN = "Yhat"

                        if info[2] != val[2]  and  not (info[2] is None and val[2] == ''):
                            metadata[varN]["unit"] = val[2]
                            changed = True

                        if info[1] != val[1] and  not (info[1] is None and val[1] == '') :
                            metadata[varN]["description"] = val[1]
                            changed = True
                cnt+=1
            if changed:
                try:
                    model =  H5.File(modelInput, "a")
                    info = JSON.dumps(metadata)
                    model.attrs["METADATA"] = info
                    model.close()
                except:
                    ARCPY.AddIDMessage("WARNING",110502)
            else:
                ARCPY.AddIDMessage("WARNING",110502)


    reportTable(modelInput)

    trainedModelVariables = None

    #### Load Model Variables from Model fiile ####
    trainedModelVariables = ModelVariables(isTraining = True)
    trainedModelVariables.loadInfo(modelInput)

    prefix = None
    if modelType in  ["Forest", "Gradient_Boosted"]:
        prefix = "FB"

    if trainedModelVariables is not None:
        trainedModelVariables.loadAllVariables(modelInput, prefix)
        if modelType == "POP":
            POP.predictFromModel(trainedModelVariables, paramP, justDescribe = True)
        elif modelType == "GLR":
            GLR.predictFromModel(trainedModelVariables, paramP, justDescribe = True)
        elif modelType in  ["Forest", "Gradient_Boosted"]:
            SF.predictFromModel(trainedModelVariables, paramP, modelType, justDescribe = True)
        else:
            ARCPY.AddIDMessage("ERROR", 110522)
        
