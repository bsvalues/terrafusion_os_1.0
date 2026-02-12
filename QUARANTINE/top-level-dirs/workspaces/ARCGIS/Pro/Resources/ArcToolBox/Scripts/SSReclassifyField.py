# coding: utf-8
"""
Source Name:   SSReclassifyField.py
Version:       ArcGIS PRO 2.6
Author:        Environmental Systems Research Institute Inc.
Description:   Reclassify Field
"""
import arcpy
import arcpy as ARCPY
import SSUtilities as UTILS
import numpy as NUM
import os as OS
import arcgisscripting as ARC
import locale as LOCALE
LOCALE.setlocale(LOCALE.LC_ALL, '')
extraParameterMethods  = ["DEFINED_INTERVAL", "STANDARD_DEVIATION"]

class ReclassifyField(object):
    def __init__(self, numberCategories, classificationID, values,
                 definedInterval = None,  stdDev = None, applyRoundG = False, isGdb = False ):
        self.numberCategories = numberCategories
        self.values = values
        self.classificationID = classificationID
        self.classificationType = UTILS.classificationMethod[classificationID]
        self.definedInterval = definedInterval
        self.stdDev = stdDev
        self.applyRoundG = applyRoundG
        self.intervStd = 0
        self.isGdb = isGdb
        self.labels = []

        #### Fake number of categories ####
        if self.classificationID in extraParameterMethods:
            self.numberCategories = 1

        #### Apply only for Standard deviation ###
        if self.stdDev is not None and self.classificationType == 6:
             indexValue = ["ONE", "HALF", "THIRD","QUARTER"].index(stdDev) + 1

             if indexValue != 0:
                self.intervStd = 1.0 / indexValue

        if self.classificationID != "DEFINED_INTERVAL":
            self.definedInterval = 0

        applyRound = True
        self.dtype = values.dtype
        if values.dtype != float:
            applyRound = False
        self.applyRound = applyRound
        self.uniqueData, self.countData = NUM.unique(values, return_counts = True)

        self.meanValue = values.mean()
        self.stdDevValue = NUM.std(values)
        if self.stdDevValue == NUM.inf:
            raise SystemExit()
        
        self.minValue = self.__rValue(values.min(),applyRound) 
        self.maxValue = self.__rValue(values.max(),applyRound) 


    def processClasses(self, classes):
        done = self.__obtainClasses(classes)

        if not done or len(self.classes) == 0:
            ARCPY.AddIDMessage("ERROR", 110364)
            raise SystemExit

        if self.labels is None:
            self.labels = [ i+1 for i in NUM.arange(len(self.classes))]

    def __processInputClasses(self, classes):
        self.labels = []
        self.categories = []
        classValues = []
        preValue = self.minValue
        for cl in classes:
            if cl[0] >= preValue:
                classValues.append([preValue, cl[0]])
                self.labels.append(cl[1])
                preValue = cl[0]

        self.classes = classValues

    def __obtainClasses(self, classes = None):
        """ Obtain classes using core method
        """
        self.classes = None
        #### Check the user input classes #### 
        if classes is not None:
            self.__processInputClasses(classes)
            return True

        self.labels = None

        if self.definedInterval is None and self.classificationID == "DEFINED_INTERVAL":
            return False

        if NUM.isclose(self.minValue, self.maxValue):
            self.classes = [[float(self.minValue),float(self.maxValue)]]
            return True

        # if self.numberCategories is not None and \
           # len(self.values) <= self.numberCategories and \
           # self.classificationID not in extraParameterMethods:
            # return False

        if self.numberCategories == 1 and self.classificationID not in extraParameterMethods:
            self.classes = [[float(self.minValue),float(self.maxValue)]]
            return True

        self.categories = ARC._ss.get_breaks(classify_method = self.classificationType,
                                        unique = NUM.array(self.uniqueData, float),
                                        count = NUM.array(self.countData, NUM.int32),
                                        num_class = self.numberCategories,
                                        defined_interval_size = self.definedInterval,
                                        mean = self.meanValue,
                                        std_dev = self.stdDevValue,
                                        std_interval = self.intervStd)
        #ARCPY.AddWarning(f" {self.categories} {self.classificationType} {self.uniqueData} {self.countData} {self.numberCategories}  {self.definedInterval} {self.meanValue}")
        if self.categories is None:
            self.classes = None
            return False
        else:
            ####  Quantile ####
            if self.classificationType == 5:
                self.categories[-1] = self.maxValue
            classValues = []

            #### Compare User Input Against Original Value ####
            for id in NUM.arange(len(self.categories)-1):
                value = self.__rValue(self.categories[id+1],self.applyRound)
                preValue = self.__rValue(self.categories[id],self.applyRound)
                classValues.append([self.categories[id],self.categories[id+1]])

            self.classes = classValues
            return True

    def __str2Float(self, floatAsStr):
        """Robust Methodology to Convert to and From Alternative Locale Decimals.

        INPUT:
        floatAsStr (str): numeric rep of a float

        RETURN:
        value (float): resulting float
        """
        try:
            if UTILS.isNumeric(floatAsStr):
                return float(floatAsStr)
            else:
                sep = LOCALE.localeconv()['decimal_point']
                sepTypes = [",", "."]
                sepTypes.remove(sep)
                if sep in floatAsStr:
                    return LOCALE.atof(floatAsStr)
                else:
                    if sepTypes[0] in floatAsStr:
                        newStr = floatAsStr.replace(sepTypes[0], sep)
                        return LOCALE.atof(newStr)
                    else:
                        return float(floatAsStr)
        except:
            return None

    def __rValue(self, value, condition, size = 6):
        """ Round Value """
        if self.applyRoundG:
            return NUM.round(value,size) if condition else value
        else:
            return value

    def applyClasses(self, direction, printTable = True, getOnlyValues = True):

        if self.classes is None:
            return False
        #### Check values ####
        keyWordForUndefinedRange = -9999
        dtypeArray = NUM.int32
        self.disableClassField = False
        if self.classificationID == "MANUAL":
            lenText =[ len(e) for e in self.labels]
            numbers = [ self.__str2Float(e) for e in self.labels]
            if None in numbers:
                keyWordForUndefinedRange = ''
                dtypeArray = "U{0}".format(max(lenText))
                self.disableClassField = NUM.sum(NUM.array(self.labels) == "") == len(self.labels)
            else:
                integers = [ (f-int(f)) == 0 for f in numbers]
                if False in integers:
                    keyWordForUndefinedRange = NUM.nan
                    dtypeArray = float
                    for id in NUM.arange(len(self.labels)):
                        self.labels[id] = self.__str2Float(self.labels[id])
                else:
                    for id in NUM.arange(len(self.labels)):
                        self.labels[id] = int(self.__str2Float(self.labels[id]))

        if self.isGdb and dtypeArray == NUM.int32:
            keyWordForUndefinedRange = NUM.iinfo(NUM.int32).min

        output = NUM.full(len(self.values), keyWordForUndefinedRange, dtype = dtypeArray)

        strFormat = "%.8f"
        strFormatStd = "%.2f"
        strFormatInt = "%d"
        self.rangesLabels = None
        applyFormat = strFormat

        decimals = 6
        eps = 1e-6
        minDec = 6

        if self.dtype in [NUM.int32, NUM.int64]:
            applyFormat = strFormatInt
            decimals = 0
            eps = 1
            minDec = 0

        self.rangesLabels = []

        for id, e in enumerate(self.classes):
            newValue = ""
            if id == 0:
                if NUM.allclose(e[0], e[1]):
                    newValue = UTILS.formatValue(e[0], UTILS.getPerfectFormatDecimal(e[0], decimals, minDeciamlLimit=minDec, returnFormatStr=True))
                else:
                    strLI = UTILS.formatValue(e[0], UTILS.getPerfectFormatDecimal(e[0], decimals, minDeciamlLimit=minDec, returnFormatStr=True))
                    strUI = UTILS.formatValue(e[1], UTILS.getPerfectFormatDecimal(e[1], decimals, minDeciamlLimit=minDec, returnFormatStr=True))
                    newValue = fr"{strLI} - {strUI}"
            else:
                if NUM.allclose(e[0], e[1]):
                    newValue = UTILS.formatValue(e[0], UTILS.getPerfectFormatDecimal(e[0], decimals, minDeciamlLimit=minDec, returnFormatStr=True))
                else:
                    strLI = UTILS.formatValue(e[0]+eps, UTILS.getPerfectFormatDecimal(e[0]+eps, decimals, minDeciamlLimit=minDec, returnFormatStr=True))
                    strUI = UTILS.formatValue(e[1], UTILS.getPerfectFormatDecimal(e[1], decimals, minDeciamlLimit=minDec, returnFormatStr=True))
                    newValue = fr"{strLI} - {strUI}"
            self.rangesLabels.append(newValue)

        if self.classificationID == "STANDARD_DEVIATION":
            for id in NUM.arange(len(self.classes)):
                if id == 0:
                    value  = (self.classes[id][1] - self.meanValue )/ self.stdDevValue
                    tmp2 = LOCALE.format_string(strFormatStd,value )
                    if not NUM.isnan(value):
                        self.rangesLabels[id] += " (< {0} Std. Dev.)".format(tmp2)
                elif id == len(self.classes)-1:
                    value  = (self.classes[id][0] - self.meanValue )/ self.stdDevValue
                    tmp1 =  LOCALE.format_string(strFormatStd, value)
                    if not NUM.isnan(value):
                        self.rangesLabels[id] += " (>{0} Std. Dev.)".format(tmp1)
                else:
                    value1 = (self.classes[id][0] - self.meanValue )/ self.stdDevValue
                    value2 = (self.classes[id][1] - self.meanValue )/ self.stdDevValue
                    tmp1 = LOCALE.format_string(strFormatStd, value1 )
                    tmp2 = LOCALE.format_string(strFormatStd, value2 )
                    if not (NUM.isnan(value1) or NUM.isnan(value2)):
                        self.rangesLabels[id] += " ({0} - {1} Std. Dev.)".format(tmp1, tmp2)

        outputSTR = None
        if getOnlyValues:
            size = "U"+ str(NUM.max([len(id) for id in self.rangesLabels]))
            outputSTR = NUM.full(len(self.values), "", dtype =size)

        if not direction:
            self.labels.reverse()

        self.rangesLabels.reverse()
        table = []
        for id, eleCat in enumerate(reversed(self.classes)):
            mask = None
            if self.dtype in [NUM.int32, NUM.int64]:
                msk = self.values <= int(eleCat[1])
            else:
                msk = self.values <= eleCat[1]

            output[msk]= self.labels[id]
            if getOnlyValues:
                outputSTR[msk] = self.rangesLabels[id]
                table.append([eleCat[1], self.labels[id]])

        self.output = output
        self.outputSTR = outputSTR

        if printTable:
            header = ARCPY.GetIDMessage(220094)
            justify = [ "Left", "Left"]
            dataLabel = []
            dataLabel.append([ARCPY.GetIDMessage(220095), ARCPY.GetIDMessage(220096)])
            strFormat = "%.8f"
            table.reverse()
            if self.dtype == NUM.int32:
                strFormat = "%d"

            for id, eleCat in enumerate(table):
                value, label = eleCat
                value =  "<= " + LOCALE.format_string(strFormat,value)
                dataLabel.append([value, str(label)])

            outputReport = UTILS.outputTextTable(dataLabel, header = header,
                                                justify = justify, pad = 1, colPad = 3,
                                                titleFillToken = "-")

            ARCPY.AddMessage(outputReport)


# run the script
if __name__ == '__main__':

    parameters = arcpy.GetParameterInfo()
    #### User Defined Inputs ####
    inputData = UTILS.getInputAppendParameter(0, parameters)

    #### Analysis Fields ####
    analysisFields = parameters[1].valueAsText
    method = parameters[2].valueAsText
    numberCategories = parameters[3].value
    intervalSize = UTILS.getNumericParameter(4, parameters)
    standardDev = parameters[5].valueAsText
    classes = parameters[6].value
    outputFieldName = parameters[8].value
    direction = parameters[7].value
    strDirection = ""

    desc = ARCPY.Describe(inputData)
    found = [f for f in desc.fields if f.type == "String" and f.name == analysisFields]
    isTextField = len(found)>0

    if method !=  "MANUAL":
        classes = None
    else:
        direction = False

    if direction is None:
        diretion = False
    outputFieldNameSTR = None
    isGdb = UTILS.isGDB(inputData)
    changed = False

    if outputFieldName in ["", None]:
        if not isTextField:
            if isGdb :
                outputFieldName = analysisFields +"_"+method
            else:
                outputFieldName = "RECLASS"
                
            if isGdb :
                outputFieldNameSTR = analysisFields+"_RANGE"
            else:
                outputFieldNameSTR = analysisFields+ "_R"

            outDict = UTILS.CheckFieldNames({outputFieldName:outputFieldName, outputFieldNameSTR:outputFieldNameSTR}, inputData)
            outputFieldName = outDict[outputFieldName]   
            outputFieldNameSTR = outDict[outputFieldNameSTR]
        else:
            if isGdb :
                outputFieldName = analysisFields +"_"+method
            else:
                outputFieldName = "RECLASS"
        
            outDict = UTILS.CheckFieldNames({outputFieldName:outputFieldName}, inputData)
            outputFieldName = outDict[outputFieldName]               

    else:
        if not isTextField:
            if isGdb :
                outputFieldNameSTR = outputFieldName+"_RANGE"
            else:
                outputFieldNameSTR = outputFieldName+ "_R"
            outDict = UTILS.CheckFieldNames({outputFieldName:outputFieldName, outputFieldNameSTR:outputFieldNameSTR}, inputData)
            outputFieldName = outDict[outputFieldName]   
            outputFieldNameSTR = outDict[outputFieldNameSTR]   
        else:
            outDict = UTILS.CheckFieldNames({outputFieldName:outputFieldName}, inputData)
            outputFieldName = outDict[outputFieldName]   



    dirName = {"DEFINED_INTERVAL" :"Defined Interval"+ strDirection,
               "EQUAL_INTERVAL": "Equal Interval"+ strDirection,
               "GEOMETRIC_INTERVAL": "Geometric Interval"+ strDirection,
               "MANUAL": "Manual Interval",
               "NATURAL_BREAKS": "Natural Break"+ strDirection ,
               "QUANTILE": "Quantile"+ strDirection,
               "STANDARD_DEVIATION":"Standard Deviation"+ strDirection,
               "UNIQUE_VALUES": "Unique Values" + strDirection}

    #### Apply Extent ####
    inputData, createTempLayer  =  UTILS.createLayerFromExtent(inputData)

    appendFields = "APPEND_FIELDS_INPUT"

    #### Read Data ####
    reader = UTILS.GenericReader(inputData, 
              [[analysisFields.upper()]],
              generateBlockOfData = False, blockType = ["auto"],
              outputOption = appendFields, displayProjectionWarning = False)

    #### Get Field  Data ####
    dataInput = reader.getData(analysisFields.upper())
    values = valuesSTR = None
    disableClassField  = False

    if not isTextField:

        obj =    ReclassifyField(numberCategories = numberCategories,
                                 classificationID = method,
                                 values = dataInput,
                                 definedInterval = intervalSize,
                                 stdDev = standardDev,
                                 applyRoundG = False,
                                 isGdb = isGdb)
        obj.processClasses(classes)

        #### Replace Classes ####
        classes = obj.classes

        maxCatOthers = 256
        if method in ["EQUAL_INTERVAL", "GEOMETRIC_INTERVAL", "NATURAL_BREAKS", "QUANTILE"]:
            if len(classes) < numberCategories and numberCategories < maxCatOthers:
                ARCPY.AddIDMessage("WARNING", 110366)
        #### Reclassify Data ####
        obj.applyClasses(direction) 
        values = obj.output
        valuesSTR = obj.outputSTR
        disableClassField = obj.disableClassField 

    else:
        data = NUM.unique(dataInput, return_index= True, return_inverse =True)
        unq, indices, orderIndex = data
        orderIndex = NUM.arange(len(unq))+1
        indices = NUM.zeros(len(dataInput), dtype = NUM.int32)

        if  direction:
            orderIndex = orderIndex[::-1]
        for ind,nord in zip(unq, orderIndex):
            indices[dataInput == ind] = nord
        values = indices
       
    outputData = []
    fieldNames = []
    aliasFieldNames = []

    #### Only when new dataset is created ####
    if reader.outputOption == "NEW_DATASET_JUST_NEW_FIELDS":

        #### Organize Output ####
        outputData = [reader.oidFieldData, dataInput, values]
        fieldNames = ["SOURCE_ID", analysisFields, "RECLASS"]
        aliasFieldNames = ["Source ID",
                           reader.dictFields[analysisFields], 
                           "{} {}".format(reader.dictFields[analysisFields], dirName[method]) ] 
    else:
        #### Organize Output ####
        outputData = []
        fieldNames = []
        aliasFieldNames = []

        #### Check if Class Field should be created ####
        if not disableClassField:
            outputData = [values]
            fieldNames = [outputFieldName]
            aliasFieldNames = [outputFieldName]
            if isGdb:
                aliasFieldNames = [outputFieldName + "_CLASS"]

        if valuesSTR is not None:
            outputData.append(valuesSTR)
            fieldNames.append(outputFieldNameSTR)
            aliasFieldNames.append(outputFieldNameSTR)

    #### Write Output ####
    reader.output(inputData, outputData, fieldNames, aliasFieldNames,
                  parameters = parameters, indexOutput = 9, indexInput = 0)

    #### Remove Temporal layer ####
    if createTempLayer:
        try:
            ARCPY.management.Delete('refLayer')
        except:
            pass
