# coding: utf-8
"""
Source Name:   SSCompositeIndex.py
Version:       ArcGIS  PRO 3.1
Author:        Environmental Systems Research Institute Inc.
Description:   Composite Index tool script.
"""

import os as OS
import arcpy as ARCPY
import SSUtilities as UTILS
import numpy as NUM
import SSDataObject as SSDO
import SSUtilities as UTILS
import SSReclassifyField as SSRECLASS
import arcpy.management as DM
from enum import Enum
import json as JSON
import tempfile as TEMP
import SSSymbology as SSS
import locale as LOCALE
import logging
from loggerutils import init_ss_logger


LOGGER = init_ss_logger(__name__, logging.DEBUG)

 
class RankType(Enum):
    AVERAGE = 1
    EQUAL = 2
    UPPER = 3

combineMethod2Str = {"SUM" : 220436, "MEAN" : 220437, "PRODUCT" : 220601, "GEOMETRIC_MEAN" : 220602}
dictinputVarStandard = {
                    "MINMAX": ARCPY.GetIDMessage(220787),
                    "RAW": ARCPY.GetIDMessage(220788),
                    "CUST_MINMAX": ARCPY.GetIDMessage(220789),
                    "ZSCORE": ARCPY.GetIDMessage(220605),
                    "CUST_ZSCORE":ARCPY.GetIDMessage(220790),
                    "PERCENTILE": ARCPY.GetIDMessage(220609),
                    "BINARY": ARCPY.GetIDMessage(220791),
                    "RANK": ARCPY.GetIDMessage(220610)
                    }
     

class SSCompositeIndex(object):
    def __init__(self, inputFeatures, appendToField, outFeatures, inputVars, indexWorkFlow, inputVarStandard, customStandard, customMinMaxVals,
                 indexCalcMethod, flags, indicatorWeights, outIndexName, outInvert, outIndexClassification, indexNumClasses, minMaxVals, outReclassTable, thresholdScaling):
        self.outputFCParameter = outFeatures
        self.inputFeatures = inputFeatures
        self.appendToFields = appendToField
        try:
            self.outFeatures = outFeatures.valueAsText
        except Exception as e:
            self.outFeatures = outFeatures

        # if appendToField:
        #     self.outFeatures = inputFeatures
        # else:
        #     self.outFeatures = outFeatures
        self.inputVars = inputVars
        self.indexWorkFlow = indexWorkFlow
        self.inputVarStandard = inputVarStandard
        self.customStandard = customStandard
        self.customMinMaxVals = customMinMaxVals
        self.indexCalcMethod = indexCalcMethod
        self.customFlags = flags
        self.indicatorWeights = indicatorWeights
        self.outIndexName = outIndexName
        self.outInvert = outInvert
        self.outIndexClassification = outIndexClassification
        self.outIndexNumClasses = indexNumClasses
        self.outMinMaxVals = minMaxVals
        self.outReclassTable = outReclassTable
        self.thresholdScaling = thresholdScaling
        self.outIdxAlias = ''
        self.outIdxRankAlias = ''

        self.isGDB = UTILS.isGDB(self.inputFeatures)

        self.isShp = False
        if self.appendToFields:
            self.isShp = not self.isGDB
        else:
            self.isShp = UTILS.isShapeFile(self.outFeatures) or UTILS.isShapeFile(self.outFeatures, "DBF")

        self.shapeType = None

        
    @staticmethod
    def isAllowedIndexName(appendToFields, inputFeaturesPar, outFeaturesSTR, ssdo = None):
        info = None
        if appendToFields:
            if ssdo is None:
                info = ARCPY.Describe(inputFeaturesPar.value)
            else:
                info = ssdo.info

            if  ".SDE\\" in info.catalogPath.upper():
                outPath, outName = OS.path.split(info.catalogPath)
                info = ARCPY.Describe(outPath)
            elif info.catalogPath.upper().startswith('HTTPS://'):
                return False
        else:
            outPath, outName = OS.path.split(outFeaturesSTR)
            try:
                info = ARCPY.Describe(outPath)
            except:
                return True
        if info is not None:
            try:
                prop = info.connectionProperties.instance.upper()
                return  not ("SDE:ORACLE" in prop or "SDE:SQL" in prop)
            except:
                pass
        return True

        
    def calculateIndices(self, from_AGOL=False):
        if len(self.inputVars) == 1:
            # ARCPY.AddIDMessage("ERROR", 230016, 2)
            minReqVars = 2
            LOGGER.error(230016, extra={"message_ID": 230016, "add_argument1": minReqVars})
            if from_AGOL:
                raise RuntimeError()
            else:
                raise SystemExit()

        self.labelOrder = None
        analysisFields = []
        analysisFieldsUpper = []
        for value in self.inputVars:
            fieldName = value[0]

            if hasattr(value[0], "value"):
                fieldName = value[0].value
            analysisFields.append(str(fieldName))

        self.analysisFields = analysisFields
        analysisFieldsUpper = [i.upper() for i in analysisFields]

        #### Apply Exec new field type checker ####
        if self.outFeatures and not from_AGOL:
            check = UTILS.ExecuteNewFieldTypeChecker(self.inputFeatures, self.outFeatures, fields=analysisFields)

        ### Apply Extent ###
        inputData, createTempLayer = UTILS.createLayerFromExtent(self.inputFeatures) #.valueAsText

        ### Read Data ###
        useChordal = True
        if from_AGOL:
            useChordal = False
        reader = UTILS.GenericReader(inputData, [analysisFieldsUpper], generateBlockOfData=False,
                                     blockType=["float"], outputOption=self.appendToFields, displayProjectionWarning=False,
                                     readNullValues=False, useChordal=useChordal)
        self.ssdo = reader.ssdo

        self.allowedIndexName = self.isAllowedIndexName(self.appendToFields, self.inputFeatures, self.outFeatures, self.ssdo)

        self.tempLyr = None
        if not self.ssdo.isTable :
            self.shapeType = self.ssdo.shapeType.upper()

        fieldAliases = []
        for value in self.inputVars:
            fieldName = value[0]
            if hasattr(value[0], "value"):
                fieldName = value[0].value

            alias = self.ssdo.allFields[str(fieldName).upper()].alias
            fieldAliases.append(alias)

        ### standardize data ###
        source = reader.getData(analysisFieldsUpper[0])
        dataSize = len(source)

        ### candidates for output ###
        candidateFieldList = {}

        ### init output values ###
        rawIndexValues = NUM.zeros(dataSize)

        ### Keep track of the candiate field order ###
        fieldOrder = []

        ### Get all the custom standardization if available ###
        customStandards = {}
        if self.inputVarStandard == "CUST_ZSCORE" and self.customStandard:
            for row in self.customStandard:
                customStandards[str(row[0].value).upper()] = [row[1], row[2]]
        elif self.inputVarStandard == "CUST_MINMAX" and self.customMinMaxVals:
            for row in self.customMinMaxVals:
                customStandards[str(row[0].value).upper()] = [row[1], row[2]]
        elif self.inputVarStandard == "BINARY":
            if self.thresholdScaling == "THRESHOLD_CUST_ZSCORE":
                for row in self.customStandard:
                    customStandards[str(row[0].value).upper()] = [row[1], row[2]]

            if self.thresholdScaling == "THRESHOLD_CUST_MINMAX":
                    for row in self.customMinMaxVals:
                        customStandards[str(row[0].value).upper()] = [row[1], row[2]]
        ### Get flags if give ###
        flags= {}
        if self.customFlags:
            for row in self.customFlags:
                try:
                    flags[row[0].value.upper()] = [row[1], row[2]]
                except:
                    flags[row[0].upper()] = [row[1], row[2]]

        stdVarObj = UTILS.StandardizeVariable(reader, analysisFieldsUpper)

        ### Pre Process and scale input variables ###
        standardVariables = self.scaleInputVars(reader, analysisFields, analysisFieldsUpper, fieldAliases, stdVarObj, customStandards, flags, candidateFieldList, fieldOrder, from_AGOL=from_AGOL)

        ### combine scaled variables ###
        rawIndexValues = self.combineScaledVariables(standardVariables, from_AGOL=from_AGOL)
        
        ### Post Process the combined variables ###
        self.postProcessIndices(rawIndexValues, candidateFieldList, fieldOrder, stdVarObj, from_AGOL=from_AGOL)
        
        if self.appendToFields == False:
            self.candidateFields = candidateFieldList
            self.fieldOrder = fieldOrder
            self.origFieldNameList = fieldOrder

            #### Set Symbology Layer ####
            if not from_AGOL:
                self.__templateIndexLayer()

            self.ssdo.output2NewFC(self.outFeatures, candidateFieldList, 
                                    appendFields = analysisFieldsUpper,
                                    fieldOrder = fieldOrder,
                                    clearExtent = False)

        else:
            candidateFieldList = list(candidateFieldList.values())
            self.origFieldNameList = [i.name for i in candidateFieldList]
            candidateFieldList = self.__checkDuplicated(candidateFieldList)
            newCFields = self.__checkCandidateFieldName(candidateFieldList, self.inputFeatures) #.valueAsText

            candidateFields = {f.name : f for f in newCFields}
            fieldOrder = [f.name for f in newCFields]

            self.ssdo.addFields2FC(candidateFields, fieldOrder=fieldOrder)

            self.candidateFields = candidateFields

        self.fieldOrder = fieldOrder
        self.analysisFieldsUpper = analysisFieldsUpper


    def scaleInputVars(self, reader, analysisFields, analysisFieldsUpper, fieldAliases, stdVarObj, customStandards, flags, candidateFieldList, fieldOrder, from_AGOL=False):
        standardVariables = []

        varIdx = 1
        outofRangeFields = []

        Reversed = ARCPY.GetIDMessage(220603)

        numVars = len(analysisFieldsUpper)
        for i in range(numVars):
            analysisField = analysisFieldsUpper[i]
            data = reader.getData(analysisField)

            ## check reverse ##
            isReversed = self.inputVars[i][1]
            if isReversed and not self.inputVarStandard in ["CUST_MINMAX", "CUST_ZSCORE"] and \
                not (self.inputVarStandard == "BINARY" and self.thresholdScaling in ["THRESHOLD_CUST_ZSCORE", "THRESHOLD_CUST_MINMAX"]):
                data, errorID = self.reverseData(data, stdVarObj)
                if errorID is not None:
                    # ARCPY.AddIDMessage("ERROR", errorID)
                    LOGGER.error(errorID, extra={"message_ID": errorID})
                    if from_AGOL:
                        raise RuntimeError()
                    else:
                        raise SystemExit()

            if self.inputVarStandard == "RAW" or (self.inputVarStandard  == "BINARY" and self.thresholdScaling == "THRESHOLD_RAW"):
                dataStandard = data
                errorID = None
                Raw = ARCPY.GetIDMessage(220604)
                if isReversed:
                    stdFieldAlias = fieldAliases[i] + " (" + Reversed + ", " + Raw + ")"
                else:
                    stdFieldAlias = fieldAliases[i] + " (" + Raw + ")"
                dataType = "Double"
            elif self.inputVarStandard == "ZSCORE" or (self.inputVarStandard  == "BINARY" and self.thresholdScaling == "THRESHOLD_ZSCORE"):
                stdVarObj.method = "Z-SCORE"
                dataStandard, errorID, _ = stdVarObj.zscore(data)
                zScore = ARCPY.GetIDMessage(220605)
                if isReversed:
                    stdFieldAlias = fieldAliases[i] + " (" + Reversed + ", " + zScore + ")"
                else:
                    stdFieldAlias = fieldAliases[i] + " (" + zScore + ")"
                dataType = "Double"
            elif self.inputVarStandard  == "CUST_ZSCORE" or \
                (self.inputVarStandard  == "BINARY" and self.thresholdScaling == "THRESHOLD_CUST_ZSCORE"):

                dataStandard, errorID = self.zscoreCustom(data, customStandards[analysisField][0], customStandards[analysisField][1])

                customZScore = ARCPY.GetIDMessage(220606)
                if isReversed:
                    # Reverse after scaling
                    dataStandard = dataStandard * -1

                    stdFieldAlias = fieldAliases[i] + " (" + Reversed + ", " + customZScore + ")"
                else:
                    stdFieldAlias = fieldAliases[i] + " (" + customZScore + ")"
                dataType = "Double"
            elif self.inputVarStandard == "MINMAX" or \
                    (self.inputVarStandard  == "BINARY" and self.thresholdScaling == "THRESHOLD_MINMAX"):
                stdVarObj.method = "MIN-MAX"
                dataStandard, errorID, _ = stdVarObj.minmax(data)
                minMax = ARCPY.GetIDMessage(220607)
                if isReversed:
                    stdFieldAlias = fieldAliases[i] + " (" + Reversed + ", " + minMax + ")"
                else:
                    stdFieldAlias = fieldAliases[i] + " (" + minMax + ")"
                dataType = "Double"
            elif self.inputVarStandard == "CUST_MINMAX" or \
                    (self.inputVarStandard  == "BINARY" and self.thresholdScaling == "THRESHOLD_CUST_MINMAX"):

                totalMin = customStandards[analysisField][0]
                totalMax = customStandards[analysisField][1]

                if NUM.min(data) < totalMin or NUM.max(data) > totalMax:
                    outofRangeFields.append(analysisField)
                
                dataStandard, errorID, _ = self.minmaxCustom(data, totalMin, totalMax)
                customMinmax = ARCPY.GetIDMessage(220608)
                if isReversed:
                    # Reverse after scaling
                    dataStandard, errorID = self.reverseData(dataStandard, stdVarObj)

                    stdFieldAlias = fieldAliases[i] + " (" + Reversed + ", " + customMinmax + ")"
                else:
                    stdFieldAlias = fieldAliases[i]  + " (" + customMinmax + ")"
                dataType = "Double"
            elif self.inputVarStandard == "PERCENTILE" or \
                    (self.inputVarStandard  == "BINARY" and self.thresholdScaling == "THRESHOLD_PERCENTILE"):
                dataStandard = self.percentileScale(data)
                percentile = ARCPY.GetIDMessage(220609)
                if isReversed:
                    stdFieldAlias = fieldAliases[i] + " (" + Reversed + ", " + percentile + ")"
                else:
                    stdFieldAlias = fieldAliases[i] + " (" + percentile + ")"
                dataType = "Double"
                errorID = None

            else: #RANK
                dataStandard = self.rank(data, RankType.AVERAGE)
                errorID = None
                rankStr = ARCPY.GetIDMessage(220610)
                if isReversed:
                    stdFieldAlias = fieldAliases[i] + " (" + Reversed + ", " + rankStr + ")"
                else:
                    stdFieldAlias = fieldAliases[i] + " (" + rankStr + ")"
                dataType = "Double"
            if errorID is not None:
                if errorID == 110343:
                    # ARCPY.AddIDMessage("ERROR", errorID, analysisField)
                    LOGGER.error(errorID, extra={"message_ID": errorID, "add_argument1": analysisField})
                else:
                    # ARCPY.AddIDMessage("ERROR", errorID)
                    LOGGER.error(errorID, extra={"message_ID": errorID})
                if from_AGOL:
                    raise RuntimeError()
                else:
                    raise SystemExit()
            
            if self.isShp:
                stdFieldName = "VAR" + str(varIdx) + "_PRE"
                varIdx += 1
            else:
                stdFieldName = analysisFields[i] + "_PREPROCESSED"

            # if flag convert to 0/1
            if self.inputVarStandard == "BINARY":
                if flags[analysisField][0] == "GREATERTHAN":
                    dataStandard = NUM.where(dataStandard > flags[analysisField][1], 1, 0)
                else:
                    dataStandard = NUM.where(dataStandard < flags[analysisField][1], 1, 0)

                # over-write fieldName and fieldAlias
                binaryFlags = ARCPY.GetIDMessage(220611)
                if isReversed:
                    stdFieldAlias = fieldAliases[i] + " (" + Reversed + ", " + binaryFlags + ")"
                else:
                    stdFieldAlias = fieldAliases[i] + " (" + binaryFlags + ")"

            standardVariables.append(dataStandard)
            stdFieldName = stdFieldName.replace(".", "_")
            stdFieldName = self.shortenFieldName(stdFieldName, from_AGOL=from_AGOL)
            candidateField = SSDO.CandidateField(stdFieldName, dataType,
                                                data=dataStandard,
                                                alias=stdFieldAlias)
            candidateFieldList[stdFieldName] = candidateField
            fieldOrder.append(stdFieldName)

        if len(outofRangeFields) > 0:
            # ARCPY.AddIDMessage("WARNING", 110508, outofRangeFields)
            LOGGER.warning(110508, extra={"message_ID": 110508, "add_argument1": outofRangeFields})


        return standardVariables

    def combineScaledVariables(self, standardVariables, from_AGOL=False):
        NUM.seterr(all='raise')
        try:
            if self.indexCalcMethod == "GEOMETRIC_MEAN":
                sumWeights = 0
                stdVars = NUM.vstack(standardVariables).copy()
                mask = (stdVars == 0).sum(axis=0)
                mask = mask == 0
            
                for i in range(len(self.indicatorWeights)):
                    if stdVars[i][stdVars[i] < 0].any():
                        # ARCPY.AddIDMessage("ERROR", 110501)
                        LOGGER.error(110501, extra={"message_ID": 110501})
                        if from_AGOL:
                            raise RuntimeError()
                        else:
                            raise SystemExit()
                
                    stdVars[i][mask] = NUM.log(stdVars[i][mask])
                    weight = self.indicatorWeights[i][1]
                    sumWeights += weight

                    if weight != 1.:
                        stdVars[i][mask] = stdVars[i][mask] * weight

                stdVars = stdVars / sumWeights
                sv = stdVars.sum(axis=0)
                rawIndexValues = NUM.zeros(len(sv))
                rawIndexValues[mask] = NUM.exp(sv[mask])
                # rawIndexValues[mask == 0] = 0
            elif self.indexCalcMethod == "PRODUCT":
                stdVars = NUM.vstack(standardVariables).astype(float).copy()
                for i in range(len(self.indicatorWeights)):
                    if stdVars[i][stdVars[i] < 0].any():
                        # ARCPY.AddIDMessage("ERROR", 110501)
                        LOGGER.error(110501, extra={"message_ID": 110501})
                        raise SystemExit()

                    weight = self.indicatorWeights[i][1]
                    if weight != 1.:
                        stdVars[i] = NUM.power(stdVars[i], weight)

                rawIndexValues = NUM.prod(NUM.vstack(stdVars), axis=0)
            elif self.indexCalcMethod == "MEAN":
                weights = []
                for i in range(len(self.indicatorWeights)):
                    weights.append(self.indicatorWeights[i][1])

                rawIndexValues = NUM.average(standardVariables, weights=weights, axis=0)
            else: #SUM
                for i in range(len(self.indicatorWeights)):
                    weight = self.indicatorWeights[i][1]
                    if weight != 1.:
                        standardVariables[i] = standardVariables[i] * weight
                rawIndexValues = NUM.sum(standardVariables, axis=0)
            
        except FloatingPointError:
            # ARCPY.AddIDMessage("ERROR", 110500)
            LOGGER.error(110500, extra={"message_ID": 110500})
            raise SystemExit()
        
        NUM.seterr(all='ignore')
        
        return rawIndexValues


    def postProcessIndices(self, rawIndexValues, candidateFieldList, fieldOrder, stdVarObj, from_AGOL=False):
        combineMethod = ARCPY.GetIDMessage(combineMethod2Str[self.indexCalcMethod])
        if self.outIndexName is None:
            outIndexName = ARCPY.GetIDMessage(220612)  # "Index"
        else:
            outIndexName = self.outIndexName
        Raw = ARCPY.GetIDMessage(220604)
        
        self.outIdxAlias = rawIdxFiledName = 'INDEX'
        if not self.allowedIndexName or from_AGOL:
            rawIdxFiledName = 'INDEX_'

        self.outIdxRankAlias = rawIdxAlias = outIndexName + " - " + combineMethod
        if self.outMinMaxVals or self.outInvert:
            rawIdxFiledName = 'INDEX_RAW'
            rawIdxAlias += " (" + Raw + ")"
        candidateField = SSDO.CandidateField(rawIdxFiledName, "Double",
                                        data=rawIndexValues,
                                        alias=rawIdxAlias)
        candidateFieldList[rawIdxFiledName] = candidateField
        fieldOrder.append(rawIdxFiledName)

        ## It is needed to overwrite
        rawIdxFiledName = 'INDEX'
        if not self.allowedIndexName or from_AGOL:
            rawIdxFiledName = 'INDEX_'

        ## check reverse for output index name ##
        if self.outInvert:
            rawIndexValues, errorID = self.reverseData(rawIndexValues, stdVarObj)
            if errorID is not None:
                # ARCPY.AddIDMessage("Error", errorID)
                LOGGER.error(errorID, extra={"message_ID": errorID})
                if from_AGOL:
                    raise RuntimeError()
                else:
                    raise SystemExit()

        if self.outMinMaxVals:
            stdVarObj.args = {"Minimum" : 0, "Maximum" : 1}
            stdVarObj.args["Minimum"] = self.outMinMaxVals[0][0]
            stdVarObj.args["Maximum"] = self.outMinMaxVals[0][1]

            rawIndexValues, errorID, _ = stdVarObj.minmax(rawIndexValues)

            if errorID is not None:
                # ARCPY.AddIDMessage("ERROR", errorID)
                LOGGER.error(errorID, extra={"message_ID": errorID})
                if from_AGOL:
                    raise RuntimeError()
                else:
                    raise SystemExit()

        if self.outMinMaxVals or self.outInvert:
            candidateField = SSDO.CandidateField(rawIdxFiledName, "Double",
                                        data=rawIndexValues,
                                        alias= outIndexName + " - " + combineMethod)
            candidateFieldList[rawIdxFiledName] = candidateField
            fieldOrder.append(rawIdxFiledName)

        ## Show rank after index raw
        # Add post processing Rank to the candidate fileds
        scaledValuesRanks = self.rank(rawIndexValues, RankType.EQUAL)
        Rank = ARCPY.GetIDMessage(220610)
        candidateField = SSDO.CandidateField("INDEX_RANK", "Long",
                                    data=scaledValuesRanks,
                                    alias=outIndexName + " - " + combineMethod + " (" + Rank + ")")
        candidateFieldList['INDEX_RANK'] = candidateField
        fieldOrder.append('INDEX_RANK')

        ## Add percentile after rank to the candiate fields
        outputPercentile = self.percentileScale(rawIndexValues)
        outputPercentile = outputPercentile * 100
        percentile = ARCPY.GetIDMessage(220609)
        candidateField = SSDO.CandidateField('INDEX_PCTL', "Double",
                                             data=outputPercentile,
                                             alias=outIndexName + " - " + combineMethod + " (" + percentile + ")")
        candidateFieldList['INDEX_PCTL'] = candidateField
        fieldOrder.append('INDEX_PCTL')

        classifyOuputIdxOrder = ['EQINTERVAL', 'QUANTILE', 'STDDEV', 'CUST']
        if self.outIndexClassification is not None:
            for cls in classifyOuputIdxOrder:
                if cls in self.outIndexClassification:
                    scaledValues = rawIndexValues
                    if cls == "STDDEV":
                        
                        zscores, errorID, _ = stdVarObj.zscore(scaledValues)
                        if errorID is not None:
                            # ARCPY.AddIDMessage("ERROR", errorID)
                            # raise SystemExit()
                            # ARCPY.AddIDMessage("WARNING", 110512)
                            LOGGER.warning(110512, extra={"message_ID": 110512})
                            continue

                        vfunc = NUM.vectorize(self.outSTDEVScaler)
                        scaledValues = vfunc(zscores)

                        candidateField = SSDO.CandidateField("INDEX_STDV", "Long",
                                                    data=scaledValues,
                                                    alias=outIndexName + " - " + combineMethod + " (" + ARCPY.GetIDMessage(220618) + ")")
                        candidateFieldList['INDEX_STDV'] = candidateField
                        fieldOrder.append('INDEX_STDV')
                    elif cls == "QUANTILE":
                        reclassify = SSRECLASS.ReclassifyField(numberCategories=self.outIndexNumClasses,
                                                        classificationID="QUANTILE",
                                                        values=rawIndexValues,
                                                        isGdb=self.isGDB)
                        reclassify.processClasses(None)
                        classes = reclassify.classes
                        maxCatOthers = 256
                        if len(classes) < self.outIndexNumClasses and self.outIndexNumClasses < maxCatOthers:
                            # ARCPY.AddIDMessage("Warning", 110366)
                            # ARCPY.AddIDMessage("WARNING", 110511, ARCPY.GetIDMessage(220635))
                            outClsType = ARCPY.GetIDMessage(220635)
                            LOGGER.warning(110511, extra={"message_ID": 110511, "add_argument1": outClsType})
                        
                        ### Reclassify Data ###
                        reclassify.applyClasses(direction=False, printTable=False, getOnlyValues=False)
                        scaledValues = reclassify.output

                        candidateField = SSDO.CandidateField("INDEX_QUAN", "Long",
                                                    data=scaledValues,
                                                    alias=outIndexName + " - " + combineMethod + " (" + ARCPY.GetIDMessage(220614) + ")")
                        candidateFieldList['INDEX_QUAN'] = candidateField
                        fieldOrder.append('INDEX_QUAN')
                    elif cls == "EQINTERVAL":
                        reclassify = SSRECLASS.ReclassifyField(numberCategories=self.outIndexNumClasses,
                                                        classificationID="EQUAL_INTERVAL",
                                                        values=rawIndexValues,
                                                        isGdb=self.isGDB)
                        reclassify.processClasses(None)
                        classes = reclassify.classes
                        maxCatOthers = 256
                        if len(classes) < self.outIndexNumClasses and self.outIndexNumClasses < maxCatOthers:
                            # ARCPY.AddIDMessage("Warning", 110366)
                            # ARCPY.AddIDMessage("WARNING", 110511, ARCPY.GetIDMessage(220636))
                            outClsType = ARCPY.GetIDMessage(220636)
                            LOGGER.warning(110511, extra={"message_ID": 110511, "add_argument1": outClsType})

                        ### Reclassify Data ###
                        reclassify.applyClasses(direction=False, printTable=False, getOnlyValues=False)
                        scaledValues = reclassify.output

                        candidateField = SSDO.CandidateField("INDEX_EQUL", "Long",
                                                    data=scaledValues,
                                                    alias=outIndexName + " - " + combineMethod + " (" + ARCPY.GetIDMessage(220626) + ")")
                        candidateFieldList['INDEX_EQUL'] = candidateField
                        fieldOrder.append('INDEX_EQUL')
                    elif cls == "CUST":
                        # Get custom classes
                        outCustomClasses = {}
                        for row in self.outReclassTable:
                            outCustomClasses[row[0]] = row[1]
                        
                        # sort the input upper bounds
                        outCustomClasses = dict(sorted(outCustomClasses.items()))

                        reclassify = SSRECLASS.ReclassifyField(numberCategories=None,
                                                            classificationID="MANUAL",
                                                            values=rawIndexValues,
                                                            isGdb=self.isGDB)

                        reclassify.categories = []
                        classValues = []
                        preValue = reclassify.minValue

                        for custCls in outCustomClasses:
                            if custCls >= preValue:
                                classValues.append([preValue, custCls])
                                reclassify.labels.append(outCustomClasses[custCls])
                                preValue = custCls

                        if reclassify.maxValue > list(outCustomClasses)[-1]:
                            # ARCPY.AddIDMessage("WARNING", 110498)
                            LOGGER.warning(110498, extra={"message_ID": 110498})
                        self.labelOrder =  reclassify.labels
                        reclassify.classes = classValues
                        reclassify.applyClasses(direction=False, printTable=False, getOnlyValues=False)
                        scaledValues = reclassify.output

                        if scaledValues.dtype == NUM.int32:
                            dataType = "Long"
                        elif scaledValues.dtype == NUM.float64:
                            dataType = "Double"
                        else:
                            dataType = "TEXT"
                        candidateField = SSDO.CandidateField("INDEX_CUST", dataType,
                                                    data=scaledValues,
                                                    checkNullValues=True,
                                                    alias=outIndexName + " - " + combineMethod + " (" + ARCPY.GetIDMessage(220616) + ")")
                        candidateFieldList['INDEX_CUST'] = candidateField
                        fieldOrder.append('INDEX_CUST')


    def outSTDEVScaler(self, e):
        if e < -2:
            return -3
        if e >= -2 and e < -1:
            return -2
        if e >= -1 and e < 0:
            return -1
        if e >= 0 and e < 1:
            return 1
        if e >= 1 and e < 2:
            return 2
        return 3
    
    
    def zscore(self, data):
        if len(data) <= 1:
            return None, 110343

        mean = NUM.mean(data)
        std = NUM.std(data, ddof=0)

        if std > 0:
            return (data - mean) / std, None
        return None, 110343


    def zscoreCustom(self, data, mean, std):
        if len(data) <= 1:
            return None, 110343

        if std > 0:
            return (data - mean) / std, None
        return None, 110343


    def rank(self, data, typeV=RankType.AVERAGE):
        n = len(data)
        ranks = NUM.zeros(n)

        valIdx = [(data[i], i) for i in range(n)]

        valIdx.sort(key=lambda x: x[0])

        i = 0
        rank = 1
        while i < n:
            k = i

            while k < n - 1 and NUM.isclose(valIdx[k][0], valIdx[k + 1][0], rtol=1e-9, atol=0.0):
                k += 1
            
            cnt = k - i + 1
            for j in range(cnt):
                if typeV == RankType.AVERAGE:
                    ranks[valIdx[i + j][1]] = rank + (cnt - 1) * 0.5
                elif typeV == RankType.EQUAL:
                    ranks[valIdx[i + j][1]] = rank
                elif typeV == RankType.UPPER:
                    ranks[valIdx[i + j][1]] = k + 1
            
            rank += cnt
            i += cnt
        return ranks

    def minmaxCustom(self, data, minValueV, maxValueV):
        if len(data) <= 1 or minValueV >= maxValueV:
            return None, 110468, None

        values = data.astype('float')
        msk = (values >= minValueV) & (values <= maxValueV)

        # Set values less than minValueV to zero
        values[values < minValueV] = 0

        # Set values greater than maxValueV to one
        values[values > maxValueV] = 1

        intervalD = maxValueV - minValueV
        values[msk] =  (values[msk] - minValueV) / intervalD

        return values, None, None
    
    def _isGDBORFeatureService(self, output):
        try:
            desc = ARCPY.Describe(output)
            if desc.workspace.workspaceType == 'RemoteDatabase':
                return True
        except:
            pass

        if UTILS.isInMemory(output):
            return True

        return UTILS.isGDB(output)        

    def __checkCandidateFieldName(self, candidateFields, output):
        """ This function adjusts the field names for shp and dbf file outputs
        """
        cNames = {i.name:0 for i in candidateFields}
        for i in range(len(candidateFields)):
            cNames[candidateFields[i].name]+=1
            ext = ""

            if cNames[candidateFields[i].name] > 1:
                ext = str(cNames[candidateFields[i].name] -1)

            candidateFields[i].name = candidateFields[i].name.replace(".", "_")+ext

        if self._isGDBORFeatureService(output):
            return candidateFields
        else:
            return UTILS.checkCandidateFieldsSimple(candidateFields)


    def __checkDuplicated(self, newCandidateFields):
        isSHPOrDBF = UTILS.isShapeFileOrDBF(self.inputFeatures)
        fieldNames = self.ssdo.allFields.keys()
        return UTILS.checkDuplicatedBasic(newCandidateFields, isSHPOrDBF, fieldNames, updateAliases=False)

    def reverseData(self, data, stdVarObj):
        minVal = NUM.min(data)
        maxVal = NUM.max(data)

        data = data * -1

        stdVarObj.args = {"Minimum" : minVal, "Maximum" : maxVal}

        data, errorID, _ = stdVarObj.minmax(data)

        stdVarObj.args = None

        return data, errorID

    def percentileScale(self, data):
        n = len(data)
        ordinalRank = self.rank(data, RankType.EQUAL)
        ordinalRank = ordinalRank - 1
        dataStandard = ordinalRank / (n - 1)
        return dataStandard

    def getVariables(self):
        variablesPre= []
        inputVar = []
        indicesFieldNames = {}
        indicesLabel = {}
        outField = "INDEX"
        if not self.allowedIndexName:
            outField = "INDEX_"
            
        indicesList = [outField, "INDEX_CUST",
                       "INDEX_EQUL","INDEX_QUAN", "INDEX_STDV", "INDEX_PCTL"]
                       
        index = ARCPY.GetIDMessage(220612) # "Index"
        if self.outIndexName not in ["",None, "#"]:
            index = self.outIndexName

        indicesLayerName = [fr"{index}", 
                            fr"{index} - " + ARCPY.GetIDMessage(220616),  # Custom Classes 
                            fr"{index} - " + ARCPY.GetIDMessage(220626),  # Equal Interval Classes"
                            fr"{index} - " + ARCPY.GetIDMessage(220614),  # Quantile Classes"
                            fr"{index} - " + ARCPY.GetIDMessage(220618),  # Standard Deviation Classes"
                            fr"{index} - " + ARCPY.GetIDMessage(220609)]  # Percentile" 
        if self.isShp:
            for fieldOriginal, realFieldName in zip(self.origFieldNameList, self.fieldOrder):
                if fieldOriginal.startswith("VAR") and fieldOriginal.endswith("_PRE"):
                    variablesPre.append(realFieldName)
                if fieldOriginal in indicesList:
                    indicesFieldNames[fieldOriginal] = realFieldName
                    indicesLabel[fieldOriginal] = indicesLayerName[indicesList.index(fieldOriginal)]
        else:
            for fieldOriginal, realFieldName in zip(self.origFieldNameList, self.fieldOrder):
                if fieldOriginal.endswith("_PREPROCESSED"):
                    variablesPre.append(fieldOriginal)
                if fieldOriginal in indicesList:
                    indicesFieldNames[fieldOriginal] = realFieldName
                    indicesLabel[fieldOriginal] = indicesLayerName[indicesList.index(fieldOriginal)]

        inputVar = self.analysisFields
        #ARCPY.AddMessage(str([indicesFieldNames, variablesPre, inputVar, indicesLabel]))
        return indicesFieldNames, variablesPre, inputVar, indicesLabel

    def getListOfCharts(self):

        indicesFieldNames, variablesPre, inputVar, indicesLabel = self.getVariables()
        outField = "INDEX"
        if not self.allowedIndexName:
            outField = "INDEX_"

        index = "Index"
        if self.outIndexName not in ["",None, "#"]:
            index = self.outIndexName

        charts = []
        nameChart = ARCPY.GetIDMessage(220778).format(index)  
        #### Create a new string to fix a bug in the charting module ####
        title = ARCPY.GetIDMessage(220778).format(index) 
        chart = ARCPY.Chart(nameChart)
        chart.type = "histogram"
        chart.title = title
        chart.histogram.showMean = True
        chart.xAxis.field = indicesFieldNames[outField]
        chart.xAxis.title = ARCPY.GetIDMessage(220612)
        charts.append(chart)

        nameChartDistribution = ARCPY.GetIDMessage(220620)

        chartDistribution = ARCPY.charts.Box(y=inputVar, 
                                                 standardizeValues = False, 
                                                 yTitle = ARCPY.GetIDMessage(220621),
                                                 title =nameChartDistribution, 
                                                 showOutliers = True )

        charts.append(chartDistribution)

        if len(variablesPre):
            nameChartDistributionScaled = ARCPY.GetIDMessage(220622)
            chartDistributionScaled = ARCPY.charts.Box(y=variablesPre, 
                                                 standardizeValues = False, 
                                                 yTitle = ARCPY.GetIDMessage(220621),
                                                 title = nameChartDistributionScaled, 
                                                 showOutliers = True )

            charts.append(chartDistributionScaled)

            chartMatrix = ARCPY.charts.ScatterMatrix(fields= variablesPre+[indicesFieldNames[outField]] ,
                                title=ARCPY.GetIDMessage(220777).format(index),
                                lowerLeft="PEARSONS_R", upperRight="SCATTERPLOTS", diagonal="HISTOGRAMS")
            charts.append(chartMatrix)

        return charts


    def __templateIndexLayer(self):
        if self.ssdo.isTable or self.appendToFields :
            return None

        outputName = OS.path.basename(self.outFeatures)
        if outputName.lower().endswith(".shp"):
            outputName = outputName[: -4]

        if self.shapeType not in ["POLYGON","POLYLINE","POINT"]:
            self.shapeType = "POLYGON"

        indexLyrDic = {"POINT": "Index_point.lyrx",
                "POLYLINE": "Index_line.lyrx",
                "POLYGON": "Index_polygon.lyrx"}

        if self.outputFCParameter:
            #### UnClass classifier object ####
            path =  OS.path.join(OS.path.normpath(UTILS.pathLayers),indexLyrDic[self.shapeType])
            sim = SSS.SymbologyBase("UNCLASS", self.shapeType, refFile= path)
            outputFld = "INDEX"
            if not self.allowedIndexName:
                outputFld = "INDEX_"

            indexCF = self.candidateFields[outputFld]

            popupInfo = ARCPY.cim.CreateCIMObjectFromClassName("CIMPopupInfo", "V3")
            popupInfo.mediaInfos = [ARCPY.cim.CreateCIMObjectFromClassName("CIMExpressionMediaInfo", "V3")]
            validPopup = True

            # Add Arcade popups to the first layer
            #if self.inputVarStandard in ["MINMAX", "RAW", "CUST_MINMAX"]:
            #    validPopup = True

            if validPopup:
                popupInfo.mediaInfos[0].expression.expression = self._getPopups()
                sim.layerDef.popupInfo = popupInfo

            sim.SetField(outputFld,indexCF.alias)

            minValue = indexCF.data.min()
            maxValue = indexCF.data.max()
            if NUM.isnan(minValue):
                minValue = NUM.finfo('d').max
            if NUM.isnan(maxValue):
                maxValue = NUM.finfo('d').max
                
            sim.SetLimitsUnClass(minValue, maxValue)
            jsonInfo = sim.getJSON()

            ARCPY.gp.SetParameterSymbology(3, "JSONCIMDEF="+jsonInfo.strip())


    def buildOutputGroupLayer(self, outputFC):

        outputName = OS.path.basename(str(outputFC))
        if outputName.lower().endswith(".shp"):
            outputName = outputName[: -4]

        if self.ssdo.isTable:
            return None

        indicesFieldNames, variablesPre, inputVar, indicesLabel = self.getVariables()

        #### message creating group layer ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220563))

        index = "Index"
        if self.outIndexName not in ["",None, "#"]:
            index = self.outIndexName

        indicesLayerName = {fr"{index}":"INDEX",
                        fr"{index} - Custom Classes":"INDEX_CUST",
                        fr"{index} - Equal Interval Classes":"INDEX_EQUL",
                        fr"{index} - Quantile Classes":"INDEX_QUAN",
                        fr"{index} - Standard Deviation Classes":"INDEX_STDV",
                        fr"{index} - Percentile":"INDEX_PCTL"
                        }

        labels = {3:["> {} {}".format(LOCALE.format_string("%d", 2), ARCPY.GetIDMessage(84262)),"#8400A8"],
                  2:["{} to {} {}".format(LOCALE.format_string("%d", 2), 
                                         LOCALE.format_string("%d", 1), 
                                         ARCPY.GetIDMessage(84262)),"#B566CB"],
                  1:["{} to {} {}".format(LOCALE.format_string("%d", 1),
                                         LOCALE.format_string("%d", 0), 
                                         ARCPY.GetIDMessage(84262)), "#E6CCEE"],
                 -1:["{} to {} {}".format(LOCALE.format_string("%d", 0),
                                         LOCALE.format_string("%d", -1), 
                                         ARCPY.GetIDMessage(84262)), "#D4E0D1"],
                 -2:["{} to {} {}".format(LOCALE.format_string("%d", -1),
                                         LOCALE.format_string("%d", -2), 
                                         ARCPY.GetIDMessage(84262)), "#7DA275"],
                 -3:["< {} {}".format(LOCALE.format_string("%d", -2), ARCPY.GetIDMessage(84262)), "#276419"]
                } 

        configColor =  {
            "INDEX_CUST":[False,"#004529","#FFFFE5"],
            "INDEX_EQUL":[True,"#F7FCFD","#4D004B"],
            "INDEX_QUAN":[True,"#EDF8B2","#41B6C4","#081D58"],
            "INDEX_STDV":labels,
            "INDEX":  1,
            "INDEX_PCTL":  2
        }
        
        shapeType =self.shapeType

        layers = []
        percLyr = "Index_percentile_polygon.lyrx"
        percLyrDic = {"POINT": "Index_percentile_point.lyrx",
                      "POLYLINE":  "Index_percentile_line.lyrx",
                      "POLYGON": "Index_percentile_polygon.lyrx"}

        percLyr = percLyrDic[shapeType]
 
        pathLyrPerc = OS.path.join(OS.path.normpath(UTILS.pathLayers),percLyr)
        tempFolder = OS.path.normpath(TEMP.gettempdir())


        popupInfo = ARCPY.cim.CreateCIMObjectFromClassName("CIMPopupInfo", "V3")
        popupInfo.mediaInfos = [ARCPY.cim.CreateCIMObjectFromClassName("CIMExpressionMediaInfo", "V3")]

        if hasattr(self, "popupInformation"):
            popupInfo.mediaInfos[0].expression.expression = self.popupInformation

        #### Unique classifier object ####
        simbBaseUniq = SSS.SymbologyBase("UNIQUE", shapeType)

        for ind, fieldIndexName in enumerate(indicesFieldNames):
            if fieldIndexName != "INDEX" and  fieldIndexName != "INDEX_"  :
                simbBase = simbBaseUniq
                simbBase.layerDef.popupInfo = popupInfo

                nameLayer = indicesLabel[fieldIndexName]
                outLayer = DM.MakeFeatureLayer(str(outputFC), nameLayer)

                tempFile = OS.path.join(tempFolder,fr"{fieldIndexName}{outputName}.lyrx")
                labelOrder = None
                if fieldIndexName == "INDEX_CUST":
                    labelOrder = self.labelOrder
                if fieldIndexName != "INDEX_PCTL":

                    tempLayer = SSS.getLayer(simbBase,
                                             tempFile,
                                             self.candidateFields[indicesFieldNames[fieldIndexName]], 
                                             configColor[fieldIndexName], labelOrder, self.isShp)

                    option = "DEFAULT"
                    if fieldIndexName in [ "INDEX_STDV", "INDEX_CUST"]:
                        option ="MAINTAIN"
                    outLayer = DM.ApplySymbologyFromLayer(outLayer,tempLayer, update_symbology = option)
                else:
                    simbBaseUnClass =SSS.SymbologyBase("UNCLASS", shapeType, pathLyrPerc)
                    simbBaseUnClass.layerDef.popupInfo = popupInfo
                    tempLayer = SSS.editUnClass(simbBaseUnClass, 
                                              tempFile,
                                              self.candidateFields[indicesFieldNames[fieldIndexName]])
                    option = "DEFAULT"
                    if fieldIndexName == "INDEX_CUST":
                        option = "UPDATE"
                    outLayer = DM.ApplySymbologyFromLayer(outLayer, tempLayer, update_symbology= option)

                try:
                    OS.remove(tempFile)
                except:
                    pass

                layers.append(outLayer)

        groupLayerResult = ARCPY.gp.MakeGroupLayer(outputName + "_" + ARCPY.GetIDMessage(220624), layers)
        groupLayer = groupLayerResult.getOutput(0)
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220625))
        return groupLayer

    def shortenFieldName(self, fName, from_AGOL=False):
        maxlen = 31 if from_AGOL else 64
        pathToTest  = self.outFeatures

        if pathToTest is None:
            pathToTest = self.inputFeatures

        if UTILS.isSDEOrGeodatabase(pathToTest):
            maxlen = 31

        if len(fName) <= maxlen:
            return fName
        lastUnderscorePos = fName.rfind("_")
        suffix = fName[lastUnderscorePos:]
        prefix = fName[0: maxlen - len(suffix)]
        return prefix + suffix

    def getRealFieldName(self, stdFieldName):
        stdFieldName = stdFieldName.replace(".", "_")
        stdFieldName = self.shortenFieldName(stdFieldName)
        return stdFieldName

    def _getPopups(self):

        outputFld = "INDEX"
        if not self.allowedIndexName:
            outputFld = "INDEX_"

        finalMessage = ""
        message0 = ARCPY.GetIDMessage(220792)
        message1 = ARCPY.GetIDMessage(220792) + " " + ARCPY.GetIDMessage(220793).format(" (0)")
        message2 = ARCPY.GetIDMessage(220792) + " " + ARCPY.GetIDMessage(220793).format("")
        message3 = ARCPY.GetIDMessage(220610) + ":"
        message4 = ARCPY.GetIDMessage(220794)

        typeCalculation = ARCPY.GetIDMessage(combineMethod2Str[self.indexCalcMethod])
        typeCalculation = fr"<strong>{typeCalculation}</strong>"

        finalMessage = message2.format("<strong>"+dictinputVarStandard[self.inputVarStandard]+"</strong>", typeCalculation)
        removeLine = False
        if self.inputVarStandard in ["ZSCORE"]:
            removeLine = False
            finalMessage = message1.format("<strong>"+dictinputVarStandard[self.inputVarStandard]+"</strong>",typeCalculation)
        
        if self.inputVarStandard in ["PERCENTILE", "RANK", "BINARY"]:
            finalMessage = message0.format("<strong>"+dictinputVarStandard[self.inputVarStandard]+"</strong>",typeCalculation)
            removeLine = True

        removeLine = "TRUE" if removeLine else "FALSE"
            
        outputIndexdata = self.candidateFields[outputFld].data
        indexMin = outputIndexdata.min()
        indexMax = outputIndexdata.max()
        indexMean = outputIndexdata.mean()
        indexRankMax = len(self.candidateFields["INDEX_RANK"].data)
        outputIndexFields = 'var outIndexFields = [\n'\
                                '\t{{ value: $feature["{}"],\n' \
                                '\talias: "{}",\n' \
                                'min: {}, max: {},\n' \
                                'comparison: {}}},\n'\
                                '{{ value: $feature["INDEX_RANK"],\n' \
                                'alias: "Index - Mean (Rank)", \n' \
                                'max: {}}},\n' \
                            '];\n'.format(outputFld, self.outIdxAlias, indexMin, indexMax, indexMean, indexRankMax)


        fieldInfos = ''
        for i in range(len(self.analysisFields)):
            # analysisField = self.analysisFields[i]
            if self.isShp:
                analysisField = f"VAR{i + 1}_PRE"
            else:
                analysisField = self.getRealFieldName(self.analysisFields[i] + "_PREPROCESSED")

            analysisFieldAlias = self.candidateFields[analysisField].alias.replace('"', r'\"')
            analysisFieldMin = self.candidateFields[analysisField].data.min()
            analysisFieldMax = self.candidateFields[analysisField].data.max()
            analysisFeildMean = self.candidateFields[analysisField].data.mean()

            fieldInfo = '{{ value: $feature["{}"], \n' \
                        'alias: "{}", \n' \
                        'min: {}, max: {}, \n' \
                        'comparison: {} }}\n'.format(analysisField, analysisFieldAlias, analysisFieldMin,
                                                                analysisFieldMax, analysisFeildMean)
            if i != len(self.analysisFields) - 1:
                fieldInfo += ', '

            fieldInfos += fieldInfo
        inVariableFields = 'var inVariableFields = [\n' + fieldInfos + '];\n'

        outIndexName = ARCPY.GetIDMessage(220612)
        if self.outIndexName not in ["",None, "#"]:
            outIndexName = self.outIndexName

        indexInfo = 'var indexInfo = {{ name: \"{}\" , preprocessing_method: \"{}\", combination_method: \"{}\", removeMeanLine:\"{}" }};\n'.format(outIndexName, self.inputVarStandard, self.indexCalcMethod, removeLine)
        finalMessage = 'var finalMessage = "{}";\n'.format(finalMessage)
        rankLabel = 'var rankLabel = "{}";\n'.format(message3)         
        inputVariablesLabel = 'var inputVariablesLabel = "{}";\n'.format(message4)     

        ### Read reference file with arcade popups ###
        resourcePath = OS.path.dirname(OS.path.dirname(OS.path.dirname(__file__)))
        localeJSPath = OS.path.join(resourcePath,"ArcToolBox\\Scripts\\Images\\cci_popup.html")
        lines = []
        start = 23
        end = 176

        if OS.path.isfile(localeJSPath): 
            f = open(localeJSPath, 'r')
            lines = f.readlines()
            for id, l in enumerate(lines):
                if l.startswith("var comparisonTextforPopup"):
                    start = id
                    continue
                if l.startswith("var txt"):
                    end = id + 1
                    break
            f.close()
        else:
            return
        
        values =  [outputIndexFields, inVariableFields, indexInfo, finalMessage , rankLabel, inputVariablesLabel] + lines[start:end] + ["return { type:'text', text:txt}"]
        information = ''.join(values)
        self.popupInformation = information    
        return information


def execute(parameters, messages):

    """The source code of the tool."""
    inputFeatures = parameters[0]
    inputVars = parameters[1]
    appendToField = parameters[2]
    outFeatures = parameters[3]
    indexWorkFlow = parameters[4]
    inputVarStandard = parameters[5]
    thresholdScaling = parameters[6]   
    customStandard = parameters[7]
    customMinMaxVals = parameters[8]
    flags = parameters[9]
    indexCalcMethod = parameters[10]
    indicatorWeights = parameters[11]
    outIndexName = parameters[12]
    outInvert = parameters[13]
    minMaxVals = parameters[14]
    outIndexClassification = parameters[15]
    indexNumClasses = parameters[16]
    customReclassTable = parameters[17]
    updated_table = parameters[18]

    # inFeatures = parameters[0]                   # Input features
    # appendField = parameters[1]                  # Append Fields to Input Features
    # outFc = parameters[2]                        # Output Features
    # inputFields = parameters[3]                  # Input Variables
    # inWorkflow = parameters[4]                   # Index Workflow
    # prepro = parameters[5]                       # Input Variable Standardization
    # prepro_sdmean_vals = parameters[6]           # Custom Standardization
    # prepro_minmax_vals = parameters[7]           # Custom Minimum and Maximum Values
    # prepro_num_classes = parameters[8]           # Number of Classes
    # prepro_class_vals = parameters[9]            # Custom Classes
    # calculateMethod = parameters[10]             # Index Calculation Method
    # flags = parameters[11]                       # Flags
    # variableWeight_boolean = parameters[12]      # Weight Variables
    # variableWeights = parameters[13]             # Weights
    # outIndexName = parameters[14]                # Output Index Name
    # outInvert = parameters[15]                   # Invert Output Index Values
    # postpro = parameters[16].values              # Output Index Classification
    # postpro_classes = parameters[17]             # Index Number of Classes
    # postpro_minmax = parameters[18]              # Minimum and Maximum Values
    # postpro_reclass_table = parameters[19]       # Reclassification Table for Custom

    inputFC = UTILS.getInputAppendParameter(0, parameters)
    multiIdx = SSCompositeIndex(inputFC, appendToField.value, outFeatures, inputVars.value, indexWorkFlow.valueAsText, inputVarStandard.valueAsText,
                                customStandard.value, customMinMaxVals.value, indexCalcMethod.value, flags.value, indicatorWeights.value, outIndexName.valueAsText,
                                outInvert.value, outIndexClassification.values, indexNumClasses.value, minMaxVals.value, customReclassTable.value, thresholdScaling.value)

    multiIdx.calculateIndices()

    datasetBase = outFeatures.value
    if not multiIdx.ssdo.isTable:
        if appendToField.value:
            datasetBase = inputFeatures.valueAsText
            updated_table.value = inputFeatures.value
            updated_table.charts = multiIdx.getListOfCharts()
        else:
            outFeatures.charts = multiIdx.getListOfCharts()
            groupLayer = multiIdx.buildOutputGroupLayer(datasetBase)
            if groupLayer:
                ARCPY.SetParameter(19, groupLayer)

def postProcessing(parameters):
    inputFeatures = parameters[0]
    appendToField = parameters[2]
    outFeatures = parameters[3]
    outIndexName = parameters[12].valueAsText
    custClasses = parameters[17].value
    method = parameters[10].valueAsText
    inputVarStandard = parameters[5].valueAsText
    orderList =[]

    if appendToField.value:
        return

    #### OutputName ####
    if outFeatures.value is not None:
        outputName = OS.path.basename(outFeatures.valueAsText)
        if outputName.lower().endswith(".shp"):
            outputName = outputName[: -4]

    if custClasses is not None:
        dictInfo = {}
        for lst in custClasses:
            dictInfo[lst[0]]=str(lst[1])
        orderList = list(dict(sorted(dictInfo.items())).values())

    stdDevOrdered =["> {} {}".format(LOCALE.format_string("%d", 2), ARCPY.GetIDMessage(84262)),
                "{} to {} {}".format(LOCALE.format_string("%d", 2), LOCALE.format_string("%d", 1),ARCPY.GetIDMessage(84262)),
                "{} to {} {}".format(LOCALE.format_string("%d", 1), LOCALE.format_string("%d", 0),ARCPY.GetIDMessage(84262)),
                "{} to {} {}".format(LOCALE.format_string("%d", 0), LOCALE.format_string("%d", -1),ARCPY.GetIDMessage(84262)),
                "{} to {} {}".format(LOCALE.format_string("%d", -1), LOCALE.format_string("%d", -2),ARCPY.GetIDMessage(84262)),
                "< {} {}".format(LOCALE.format_string("%d", -2), ARCPY.GetIDMessage(84262))] 

    #### Move the main result feature class into group layer ####
    try:
        createOutput = False
        datasetBase = inputFeatures.valueAsText
        if not appendToField.value and outFeatures.value is not None:
            datasetBase = outFeatures.valueAsText
            createOutput = True


        project = ARCPY.mp.ArcGISProject('CURRENT')
        mapFrame = project.activeMap
        ssdo = SSDO.SSDataObject(outFeatures.valueAsText, silentWarnings = True)
        oidName = ssdo.oidName
        index = ARCPY.GetIDMessage(220612)

        allowedIndex = SSCompositeIndex.isAllowedIndexName(appendToField.value, inputFeatures, outFeatures.valueAsText, None)

        if outIndexName not in ["",None, "#"]:
            index = outIndexName
        oidName = "OBJECTID"

        if ssdo.isTable:
            return

        #### Remove Base Layer ####
        layers2Delete = []
        layerMainName = OS.path.basename(datasetBase)
        isSHP = layerMainName.lower().endswith(".shp") or layerMainName.lower().endswith(".dbf")

        if isSHP:
            layerMainName = layerMainName[0: -4]

        outputLayer = None
        layerNames = mapFrame.listLayers("*"+layerMainName)
 
        if len(layerNames):
            _datasetBase = datasetBase
            if isSHP:
                _datasetBase= datasetBase[0:-4]
 
            for lyr in layerNames:
                source = lyr.dataSource
                _lyr = source.lower()
                isShpSource =  _lyr.endswith(".shp") or _lyr.endswith(".dbf")

                if isShpSource:
                    source = source[0:-4]

                if OS.path.normpath(_datasetBase).lower() == OS.path.normpath(source).lower():
                    outputLayer = lyr
                    break

                outputLayer = UTILS.IsSQLOutput(lyr, _datasetBase, source)
                if outputLayer is not None:
                    break  

            for layerV in layerNames:
                if not layerV.isGroupLayer:
                    if outputLayer != layerV:
                        layers2Delete.append(layerV)

        #### Remove empty group layers with same name ####
        _layerNames = mapFrame.listLayers(layerMainName + " " +"Layers")
        if len(_layerNames) > 0:
            for layer in _layerNames:
                if len(layer.listLayers()) == 0:
                    layers2Delete.append(layer)

        fldInd = "INDEX"
        if not allowedIndex:
            fldInd = "INDEX_"

        indicesLayerName = {fr"{index}":fldInd,
                        fr"{index} - Custom Classes":"INDEX_CUST",
                        fr"{index} - Equal Interval Classes":"INDEX_EQUL",
                        fr"{index} - Quantile Classes":"INDEX_QUAN",
                        fr"{index} - Standard Deviation Classes":"INDEX_STDV",
                        fr"{index} - Percentile":"INDEX_PCTL"
                        }

        chartNames = {fldInd: ARCPY.GetIDMessage(220778).format(index),    # "Distribution of {0}"
                   "INDEX_CUST": ARCPY.GetIDMessage(220779).format(index, ARCPY.GetIDMessage(combineMethod2Str[method]), ARCPY.GetIDMessage(220616)), # Count by IndexAlias -(method) (Custom Classes)"
                   "INDEX_EQUL": ARCPY.GetIDMessage(220779).format(index, ARCPY.GetIDMessage(combineMethod2Str[method]), ARCPY.GetIDMessage(220615)), # Count by IndexAlias -(method) (Equal Interval Classes"
                   "INDEX_QUAN": ARCPY.GetIDMessage(220779).format(index, ARCPY.GetIDMessage(combineMethod2Str[method]), ARCPY.GetIDMessage(220614)), # Count by IndexAlias -(method) (Quantile Classes)"
                   "INDEX_STDV": ARCPY.GetIDMessage(220779).format(index, ARCPY.GetIDMessage(combineMethod2Str[method]), ARCPY.GetIDMessage(220618)), # Count by IndexAlias -(method) (Standard Deviation Classes)",
                   "INDEX_PCTL": ARCPY.GetIDMessage(220778).format(index + " - " + ARCPY.GetIDMessage(combineMethod2Str[method])+ " (" +  ARCPY.GetIDMessage(220609)) + ")"} # Distribution of IndexAlias -(method) (Percentile)

        xAxis = {fldInd: ARCPY.GetIDMessage(220612),    #"Index"
                "INDEX_CUST": ARCPY.GetIDMessage(220612) + " (" + ARCPY.GetIDMessage(220616) + ")",  # Index (Custom Classes),
                "INDEX_EQUL": ARCPY.GetIDMessage(220612) + " (" + ARCPY.GetIDMessage(220615) + ")",  # Index (Equal Classes),
                "INDEX_QUAN": ARCPY.GetIDMessage(220612) + " (" + ARCPY.GetIDMessage(220614) + ")",  # Index (Quantile Classes),
                "INDEX_STDV": ARCPY.GetIDMessage(220612) + " (" + ARCPY.GetIDMessage(220618) + ")",  # Index (Standard Deviation Classes),
                "INDEX_PCTL": ARCPY.GetIDMessage(220612) + " (" + ARCPY.GetIDMessage(220609) + ")"}  # Index (Percentile)"

        layerGroup = mapFrame.listLayers(UTILS.getTextParameter(19, parameters))[0]

        aliasIndex = index + " - " + ARCPY.GetIDMessage(combineMethod2Str[method])
        aliasPerc = index+ " - " + ARCPY.GetIDMessage(combineMethod2Str[method]) + " (" + ARCPY.GetIDMessage(220609)+ ")"
        #### Remove Empty Group Layer ####
        for layerInfo in mapFrame.listLayers(layerGroup):
            if layerInfo.isGroupLayer:
                layerList = layerInfo.listLayers()
                for lyr in layerList:
                    if lyr.name in indicesLayerName:
                        cim = lyr.getDefinition('V3')
                        upd = False
                        if len(cim.charts):
                            cim.charts = []
                            upd = True

                        if indicesLayerName[lyr.name] == "INDEX_PCTL":
                            cim.renderer.heading = aliasPerc
                            cim.renderer.breaks[0].label = "0"
                            upd= True

                        if indicesLayerName[lyr.name] == "INDEX_CUST":
                            sym = SSS.SymbologyBase("UNIQUE", cimInfo = cim)
                            ### solve issue in apply symbology ###
                            sym.reOrderClasses(orderList)
                            cim = sym.getLayerDefinition()
                            upd = True

                        if indicesLayerName[lyr.name] == "INDEX_STDV":
                            sym = SSS.SymbologyBase("UNIQUE", cimInfo = cim)
                            ### solve issue in apply symbology ###
                            sym.reOrderClasses(stdDevOrdered)
                            cim = sym.getLayerDefinition()
                            upd = True

                        if upd or indicesLayerName[lyr.name] in ["INDEX_EQUL", "INDEX_QUAN"]:
                            cim.featureTable.displayField = oidName
                            lyr.setDefinition(cim)

                        if indicesLayerName[lyr.name] in ["INDEX_CUST", "INDEX_EQUL", "INDEX_QUAN", "INDEX_STDV"]:
                            title = chartNames[indicesLayerName[lyr.name]]
                            chart = ARCPY.Chart(title)
                            chart.type = "bar"
                            chart.title = title
                            chart.bar.aggregation = "COUNT"
                            chart.xAxis.field = indicesLayerName[lyr.name]
                            chart.xAxis.title = ARCPY.GetIDMessage(84785) #Count
                            #### Add Cat Pair Chart ####
                            chart.addToLayer(lyr)
                        else:
                            #### Start with Chart ####
                            title = chartNames[indicesLayerName[lyr.name]]
                            chart = ARCPY.Chart(title)
                            chart.type = "histogram"
                            chart.title = title
                            chart.xAxis.field = indicesLayerName[lyr.name]
                            chart.xAxis.title = xAxis[indicesLayerName[lyr.name]]
                            #### Add Cat Pair Chart ####
                            chart.addToLayer(lyr)

                        if not appendToField.value:
                            lyr.visible= False
                        else:
                            if indicesLayerName[lyr.name] != "INDEX_PCTL":
                                lyr.visible= False


        layerGroup.name = layerMainName + " " + ARCPY.GetIDMessage(220624)

        if not appendToField.value and outputLayer is not None:

            outputLayer.name = index
            cim = outputLayer.getDefinition('V3')
            cim.renderer.heading = aliasIndex
            cim.featureTable.displayField = oidName
            outputLayer.setDefinition(cim)
            mapFrame.moveLayer(layerGroup.listLayers()[0], outputLayer, "BEFORE")

            for layerD in layers2Delete:
                mapFrame.removeLayer(layerD)

    except Exception as e:
        pass
