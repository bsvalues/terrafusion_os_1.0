# coding: utf-8
################### Imports ########################
import sys as SYS
import os as OS
import locale as LOCALE
import numpy as NUM
import numpy.random as RAND
import arcgisscripting as ARC
import arcpy as ARCPY
import arcpy.analysis as ANA
import arcpy.management as DM
import arcpy.da as DA
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import Stats as STATS
import WeightsUtilities as WU
import gapy as GAPY
import logging
from loggerutils import init_ss_logger
import json
from typing import Union, List

LOGGER = init_ss_logger(__name__, logging.DEBUG)

################## Helper Functions ##################

outputIDFieldNames = ['MATCH_ID', 'CAND_ID']
nullVal64 = NUM.iinfo('int64').min

outputFieldInfo = {
        'ATTRIBUTE_VALUES': 
            {'SIMRANK': ('Similarity Rank', 'LONG', 0),
             'DSIMRANK': ('Dissimilarity Rank', 'LONG', 0),
             'SIMINDEX': ('Sum Squared Value Differences', 'DOUBLE', 0.0),
             'LABELRANK': ('Render Rank', 'LONG', 0)},
        'RANKED_ATTRIBUTE_VALUES':
            {'SIMRANK': ('Similarity Rank', 'LONG', 0),
             'DSIMRANK': ('Dissimilarity Rank', 'LONG', 0),
             'SIMINDEX': ('Sum Squared Rank Differences', 'DOUBLE', 0.0),
             'LABELRANK': ('Render Rank', 'LONG', 0)},
        'ATTRIBUTE_PROFILES':
            {'SIMRANK': ('Similarity Rank', 'LONG', 0),
             'DSIMRANK': ('Dissimilarity Rank', 'LONG', 0),
             'SIMINDEX': ('Cosine Similarity', 'DOUBLE', 1.0),
             'LABELRANK': ('Render Rank', 'LONG', 0)}
            }

matchFieldInfo = {
        'BOTH':
            ['SIMRANK', 'DSIMRANK', 'SIMINDEX', 'LABELRANK'],
        'MOST_SIMILAR':
            ['SIMRANK', 'SIMINDEX', 'LABELRANK'],
        'LEAST_SIMILAR':
            ['DSIMRANK', 'SIMINDEX', 'LABELRANK']
            }

outputTabInfo = {
         'ATTRIBUTE_VALUES': 84974,
         'RANKED_ATTRIBUTE_VALUES': 220172,
         'ATTRIBUTE_PROFILES': 220173
         }

outputRenderInfo = {
        ('BOTH', 0): 'SimSearchBothPoints.lyrx',
        ('MOST_SIMILAR', 0): 'SimSearchMostPoints.lyrx',
        ('LEAST_SIMILAR', 0): 'SimSearchLeastPoints.lyrx',
        ('BOTH', 1): 'SimSearchBothPolylines.lyr',
        ('MOST_SIMILAR', 1): 'SimSearchMostPolylines.lyr',
        ('LEAST_SIMILAR', 1): 'SimSearchLeastPolylines.lyr',
        ('BOTH', 2): 'SimSearchBothPolygons.lyr',
        ('MOST_SIMILAR', 2): 'SimSearchMostPolygons.lyr',
        ('LEAST_SIMILAR', 2): 'SimSearchLeastPolygons.lyr',
        }

ssAllTypes = ['SMALLINTEGER', 'INTEGER', 'SINGLE', 'DOUBLE',
            'STRING', 'DATE']
ssNumTypes = ssAllTypes[0:4]
ssMaxTextTableResults = 10

def returnRenderLayerFile(numResults, renderFile):
    if numResults < 6:
        fileName, fileExt = OS.path.splitext(renderFile)
        fileName = fileName + "{0}"
        fileName = fileName.format(numResults)
        return fileName + fileExt
    else:
        return renderFile

def ANOVA(candVals, baseVals):
    return ((candVals - baseVals)**2.0).sum(1)

def cosineSim(candVals, baseVals):
    cosTop = (baseVals * candVals).sum(1)
    cosLeft = NUM.sqrt((baseVals**2.0).sum())
    cosRight = NUM.sqrt((candVals**2.0).sum(1))
    cosBottom = cosLeft * cosRight
    return cosTop / cosBottom

def getTopIDs(sortedIDs, numResults, similarType='MOST_SIMILAR', 
              reverse=False, hasOID64=False):
    if hasOID64:
        ids = NUM.empty((numResults,), NUM.int64)
    else:
        ids = NUM.empty((numResults,), NUM.int32)
    if reverse:
        n = len(sortedIDs)
        looper = reversed(UTILS.ssRange(n - numResults, n))
    else:
        looper = UTILS.ssRange(numResults)

    rank = 0
    for ind in looper:
        ids[rank] = sortedIDs[ind]
        rank += 1
    return ids

def fieldValidation(ssdoBase, ssdoCand, fieldNames, appendFields, useCriteria=False):
    outFieldNames = []
    outAppendBase = []
    badInputNames = []
    propertyWarning = False
    if not useCriteria:
        for fieldName in fieldNames:
            try:
                candField = ssdoCand.allFields[fieldName]
                candType = candField.type.upper()
                baseField = ssdoBase.allFields[fieldName]
                baseType = baseField.type.upper()
                if candType == baseType:
                    outFieldNames.append(fieldName)
                    if baseField.alias != candField.alias:
                        propertyWarning = True
                else:
                    badInputNames.append(fieldName)
            except:
                badInputNames.append(fieldName)
    else:
        ### this part is just for AGOL ###
        for i in range(0, len(fieldNames), 2):
            baseFieldName = fieldNames[i]
            candFieldName = fieldNames[i + 1]
            try:
                baseField = ssdoBase.allFields[baseFieldName]
                baseType = baseField.type.upper()
                candField = ssdoCand.allFields[candFieldName]
                candType = candField.type.upper()
                if candType == baseType:
                    outFieldNames.append(baseFieldName)
                    outFieldNames.append(candFieldName)
                else:
                    badInputNames.append(baseFieldName)
                    badInputNames.append(candFieldName)
            except:
                badInputNames.append(baseFieldName)
                badInputNames.append(candFieldName)

    for fieldName in appendFields:
        try:
            baseField = ssdoBase.allFields[fieldName]
            baseType = baseField.type.upper()
            candField = ssdoCand.allFields[fieldName]
            candType = candField.type.upper()
            if candType == baseType:
                outAppendBase.append(fieldName)
                if baseField.alias != candField.alias:
                    propertyWarning = True
        except:
            pass

    #### Warn is Lesser Field Properties are not Identical ####
    if propertyWarning:
        LOGGER.warning(110036, extra={"message_ID": 110036})

    return outFieldNames, outAppendBase, badInputNames

def getOutputSpatialRef(baseFC, candFC, outputFC):
    #### Get Input Spatial Ref ####
    baseDesc = ARCPY.Describe(baseFC)
    baseSpatialRef = baseDesc.SpatialReference

    #### Get Input Spatial Ref ####
    candDesc = ARCPY.Describe(candFC)
    candSpatialRef = candDesc.SpatialReference

    #### Get Output Spatial Ref ####
    outSpatialRef = UTILS.returnOutputSpatialRef(baseSpatialRef,
                                                 outputFC = outputFC)

    #### Assess Codes ####
    baseSame = baseSpatialRef.name == outSpatialRef.name
    candSame = candSpatialRef.name == outSpatialRef.name

    #### If All Same ####
    if baseSame and candSame:
        return baseSpatialRef

    #### Assess if Output is Feature Dataset ####
    dirName = OS.path.dirname(outputFC)
    descDir = ARCPY.Describe(dirName)
    dirType = descDir.DataType
    isFeatureDataset = dirType == "FeatureDataset"

    #### Test for Transformations ####
    transBase = UTILS.canProjectExtent(baseDesc.Extent, outSpatialRef) 
    transCand = UTILS.canProjectExtent(candDesc.Extent, outSpatialRef) 

    #### Assure Transformations if Feature Dataset ####
    if isFeatureDataset:
        if not transBase:
            LOGGER.warning(110057, extra={"message_ID": 110057,
                                          "add_argument1": baseSpatialRef.name,
                                          "add_argument2": outSpatialRef.name})
            raise SystemExit()

        if not transCand:
            LOGGER.error(110058, extra={"message_ID": 110058,
                                        "add_argument1": candSpatialRef.name,
                                        "add_argument2": outSpatialRef.name})
            raise SystemExit()

        return outSpatialRef

    if not transBase or not transCand:
        explicitSpatialRef = ARCPY.SpatialReference(3857)
        LOGGER.warning(110059, extra={"message_ID": 110059})
        return explicitSpatialRef

    return outSpatialRef


class SimilaritySearch(object):
    """Creates information for the construction of a fishnet grid.

    INPUTS:
    ssdoBase (obj): instance of a SSDataObject for Base/Target
    ssdoCand (obj): instance of a SSDataObject for Candidates
    fieldNames (list): list of field names to use in analysis
    matchMethod {str, ATTRIBUTE_VALUES}: match type
                [RANKED_ATTRIBUTE_VALUES, ATTRIBUTE_PROFILES]
    useSimilar {bool, True}: find similar or dissimilar?
    numResults {int, 10}: how many matches to find?
    baseFieldNames (list): default: None this parameter is used for a case where
      the field names of base ssdo is different from those of cand ssdo

    ATTRIBUTES:
    numVars (int): number of analysis fields
    baseVals (array): base data values
    candVals (array): candidate data values
    totalDist (array): sum distance between target and each candidate
    """
    def __init__(self, ssdoBase, ssdoCand, fieldNames,
                 similarType = 'MOST_SIMILAR',
                 matchMethod = 'ATTRIBUTE_VALUES',
                 numResults = 10, appendFields = [],
                 baseFieldNames=None):
        self.hasOID64 = False
        try:
            if ssdoBase.info.HasOID64 or ssdoCand.info.HasOID64:
                self.hasOID64 = True
        except:
            pass
        UTILS.assignClassAttr(self, locals())
        self.k = len(self.fieldNames)
        self.validateNumResults()
        self.initialize()
        self.solve()
        self.agol_msgs = []

    def validateNumResults(self):
        candN = self.ssdoCand.numObs
        bothType = self.similarType == 'BOTH'
        if bothType:
            maxN = int(candN / 2)
        else:
            maxN = candN

        if self.numResults > maxN:
            if bothType:
                LOGGER.warning(1587, extra={"message_ID": 1587,
                                            "add_argument1": str(maxN)})
            else:
                LOGGER.warning(1586, extra={"message_ID": 1586,
                                            "add_argument1": str(maxN)})

            self.numResults = maxN

        if self.numResults == 0:
            self.numResults = maxN

    def initialize(self):
        #### Get Quick Output Info ####
        self.numFeatures = self.ssdoBase.numObs + self.ssdoCand.numObs

        #### Start With Target Features ####
        baseVals = NUM.empty((self.ssdoBase.numObs, self.k), float)
        if not self.baseFieldNames:
            for ind, fieldName in enumerate(self.fieldNames):
                baseVals[:,ind] = self.ssdoBase.fields[fieldName].returnDouble()
        else:
            for ind, fieldName in enumerate(self.baseFieldNames):
                baseVals[:,ind] = self.ssdoBase.fields[fieldName].returnDouble()

        #### Store Report Info ####
        self.baseMin = baseVals.min(0)
        self.baseMax = baseVals.max(0)
        self.baseStd = baseVals.std(0)
        self.baseMean = baseVals.mean(0)

        #### Use Average Value if More Than One Input ####
        if self.ssdoBase.numObs > 1:
            baseVals = self.baseMean

        #### Get Candidate Variables ####
        dataVals = NUM.empty((self.ssdoCand.numObs + 1, self.k), float)
        dataVals[0] = baseVals
        for ind, fieldName in enumerate(self.fieldNames):
            dataVals[1:,ind] = self.ssdoCand.fields[fieldName].returnDouble()

        #### More Report Info ####
        self.attMin = dataVals.min(0)
        self.attMax = dataVals.max(0)
        self.attStd = dataVals.std(0)
        self.attMean = dataVals.mean(0)

        #### Zero Variance Fields ####
        zeroVarFields = []
        takeList = []
        for ind in UTILS.ssRange(self.k):
            stdValue = self.attStd[ind]
            if UTILS.compareFloat(0.0, stdValue):
                fieldName = self.fieldNames[ind]
                zeroVarFields.append(fieldName)
                self.k = self.k - 1
            else:
                takeList.append(ind)

        #### Toss Out Fields w/ No Variation ####
        nVarFields = len(zeroVarFields)
        if nVarFields:
            zeroNames = ", ".join(zeroVarFields)
            LOGGER.warning(1588, extra={"message_ID": 1588,
                                        "add_argument1": zeroNames})
            for fieldName in zeroVarFields:
                self.fieldNames.remove(fieldName)
        self.zeroVarFields = zeroVarFields

        #### Cosign Sim Must Have At Least Two Analysis Fields ####
        if self.k == 1 and self.matchMethod == 'ATTRIBUTE_PROFILES':
            LOGGER.error(1598, extra={"message_ID": 1598})
            raise SystemExit()

        #### No Fields Left ####
        if not self.k:
            LOGGER.error(1585, extra={"message_ID": 1585})
            raise SystemExit()

        #### Use Only Valid Fields ####
        if nVarFields:
            self.baseMin = NUM.take(self.baseMin, takeList)
            self.baseMax = NUM.take(self.baseMax, takeList)
            self.baseStd = NUM.take(self.baseStd, takeList)
            self.baseMean = NUM.take(self.baseMean, takeList)
            self.attMin = NUM.take(self.attMin, takeList)
            self.attMax = NUM.take(self.attMax, takeList)
            self.attStd = NUM.take(self.attStd, takeList)
            self.attMean = NUM.take(self.attMean, takeList)
            dataVals = NUM.take(dataVals, takeList, axis = 1)

        #### Get Tranformed Variables
        if self.matchMethod == 'RANKED_ATTRIBUTE_VALUES':
            #### Use Ranks ####
            dataVals = ARC._ss.rank_array(dataVals)
        else:
            #### Use Z Transformed ####
            dataVals = STATS.zTransform(dataVals)

        self.baseVals = dataVals[0]
        self.candVals = dataVals[1:]

    def solve(self):
        if self.matchMethod in ['ATTRIBUTE_VALUES', 'RANKED_ATTRIBUTE_VALUES']:
            self.totalDist = ANOVA(self.candVals, self.baseVals)
            self.sortedIDs = self.totalDist.argsort()
            self.topIDs = getTopIDs(self.sortedIDs, self.numResults,
                                    hasOID64=self.hasOID64)
            self.botIDs = getTopIDs(self.sortedIDs, self.numResults,
                                    reverse=True, hasOID64=self.hasOID64)
        else:
            if (self.baseMean == self.attMean).sum() == self.k:
                #### Base Attribute / Mean of Attributes == Mean Candidates ####
                LOGGER.error(110339, extra={"message_ID": 110339})
                raise SystemExit()

            self.totalDist = cosineSim(self.candVals, self.baseVals)
            self.sortedIDs = self.totalDist.argsort()
            self.topIDs = getTopIDs(self.sortedIDs, self.numResults,
                                    reverse=True, hasOID64=self.hasOID64)
            self.botIDs = getTopIDs(self.sortedIDs, self.numResults,
                                    hasOID64=self.hasOID64)

    def log_json_format_message(
        self,
        msg_id: int,
        msg: str = '',
        str_keys: List = [],
        str_vals: List = [],
        row_style: str = "<span></span>"
    ):
        if not msg:
            msg = ARCPY.GetIDMessage(msg_id)

        all_dict = {}
        param_dict = {}
        for ind, kv in enumerate(str_keys):
            param_dict[kv] = str_vals[ind]
            msg = msg.replace("{%i}" % ind, "${%s}" % kv)

        all_dict['message'] = msg
        all_dict['messageCode'] = "SS_" + str(msg_id).rjust(5, '0')
        all_dict['params'] = param_dict
        all_dict['style'] = row_style
        # ARCPY.gp.AddMessage(json.dumps(all_dict), 55)
        self.agol_msgs.append(json.dumps(all_dict))

    def log_json_format_table(
        self,
        msg_id: int,
        msg: Union[str, List],
        str_args: List = [],
        str_vals: List = [],
        row_style: str = 'table'
    ):
        all_dict = {}
        param_dict = {}
        for ind, sarg in enumerate(str_args):
            if str_vals:
                param_dict["%s" % sarg] = str_vals[ind]
            else:
                param_dict["%s" % sarg] = "%s" % sarg
            msg = [m.replace("{%i}" % ind, "${%s}" % sarg) for m in msg]
        all_dict['message'] = msg
        all_dict['messageCode'] = "SS_" + str(msg_id).rjust(5, '0')
        all_dict['params'] = param_dict
        all_dict['style'] = row_style
        # ARCPY.gp.AddMessage(json.dumps(all_dict), 55)
        self.agol_msgs.append(json.dumps(all_dict))

    def report(self, agol_format: bool = False):
        #### Report Strings Across Tables ####
        minStr = ARCPY.GetIDMessage(84271)
        maxStr = ARCPY.GetIDMessage(84272)
        meanStr = ARCPY.GetIDMessage(84261)
        stdStr = ARCPY.GetIDMessage(84509)
        attStr = ARCPY.GetIDMessage(84507)
        inStr = ARCPY.GetIDMessage(84508)

        if self.baseFieldNames:
            fieldNames = self.baseFieldNames
        else:
            fieldNames = self.fieldNames

        #### Warn that Targets are Average of Inputs ####
        if self.ssdoBase.numObs > 1:
            LOGGER.warning(1583, extra={"message_ID": 1583})

            if agol_format:
                table_head = [attStr, minStr, maxStr, stdStr, meanStr]
                self.log_json_format_message(84503)
                self.log_json_format_table(89997, table_head,
                                           row_style="<table><tr><th style='text-align:center;'></th><th style='text-align:center;'></th><th style='text-align:center;'></th><th style='text-align:center;'></th><th style='text-align:center;'></th></tr>")

            #### Additional Averaged Summary ####
            if agol_format:
                avgList = []
            else:
                avgList = [ [attStr, minStr, maxStr, stdStr, meanStr] ]
            for ind, fieldName in enumerate(fieldNames):
                avgList.append( [fieldName,
                                 UTILS.formatValue(self.baseMin[ind], "%0.4f"),
                                 UTILS.formatValue(self.baseMax[ind], "%0.4f"),
                                 UTILS.formatValue(self.baseStd[ind], "%0.4f"),
                                 UTILS.formatValue(self.baseMean[ind], "%0.4f")] )
                if agol_format:
                    self.log_json_format_table(ind + 85000, avgList[-1],
                                               row_style="<tr><td style='text-align:left;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td></tr>")
            if agol_format:
                self.log_json_format_table(89999, " ", row_style="</table><br></br>")
            else:
                title = ARCPY.GetIDMessage(84503)
                outputTable = UTILS.outputTextTable(avgList, header = title,
                                                    pad = 1,
                                                    justify = ['left', 'right',
                                                               'right', 'right',
                                                               'right']
                                                    , force2Txt=False)
                LOGGER.debug(outputTable)

        #### Attribute Summary ####
        if agol_format:
            self.log_json_format_message(84504)
            table_head = [attStr, minStr, maxStr, stdStr, meanStr, inStr]
            avgList = []
            self.log_json_format_table(84512, table_head,
                                       row_style="<table><tr><th style='text-align:center;'></th><th style='text-align:center;'></th><th style='text-align:center;'></th><th style='text-align:center;'></th><th style='text-align:center;'></th><th style='text-align:center;'></th></tr>")
        else:
            avgList = [ [attStr, minStr, maxStr, stdStr, meanStr, inStr] ]
        for ind, fieldName in enumerate(self.fieldNames):
            avgList.append( [fieldName,
                             UTILS.formatValue(self.attMin[ind], "%0.4f"),
                             UTILS.formatValue(self.attMax[ind], "%0.4f"),
                             UTILS.formatValue(self.attStd[ind], "%0.4f"),
                             UTILS.formatValue(self.attMean[ind], "%0.4f"),
                             UTILS.formatValue(self.baseMean[ind], "%0.4f")] )
            if agol_format:
                self.log_json_format_table(ind + 86000, avgList[-1],
                                           row_style="<tr><td style='text-align:left;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td></tr>")
        if agol_format:
            self.log_json_format_table(89999, " ", row_style = "</table><br></br>")
        else:
            title = ARCPY.GetIDMessage(84504)
            outputTable = UTILS.outputTextTable(avgList, header = title,
                                                pad = 1,
                                                justify = ['left', 'right',
                                                           'right', 'right',
                                                           'right', 'right'],
                                                force2Txt=False)
            LOGGER.debug(outputTable)

        if self.numResults > ssMaxTextTableResults:
            firstLabel = "Top {0} of {1}".format(ssMaxTextTableResults,
                                                 self.numResults)
            iters = ssMaxTextTableResults
            agolID = 84506
        else:
            firstLabel = self.numResults
            iters = self.numResults
            agolID = 84505
        if agol_format:
            matchString = outputTabInfo[self.matchMethod]
        else:
            matchString = ARCPY.GetIDMessage(outputTabInfo[self.matchMethod])

        if self.similarType in ['MOST_SIMILAR', 'BOTH']:
            title = ARCPY.GetIDMessage(84505).format(firstLabel,
                                                     matchString)
            if agol_format:
                self.log_json_format_message(agolID, title, ['numResults'],
                                             [str(self.numResults)],
                                             row_style="<span></span>")
            withinSS = self.totalDist[self.topIDs[:iters]].sum()
            outNames = ["OID"] + matchFieldInfo['MOST_SIMILAR'][0:-1]
            tableRows = [ outNames ]
            if agol_format:
                self.log_json_format_table(84510, outNames,
                                           row_style="<table><tr><th></th><th></th><th></th></tr>")

            for ind in UTILS.ssRange(iters):
                orderID = self.topIDs[ind]
                rank = str(ind+1)
                masterID = str(self.ssdoCand.order2Master[orderID])
                ss = UTILS.formatValue(self.totalDist[orderID], "%0.4f")
                rowInfo = [masterID, rank, ss]
                tableRows.append(rowInfo)
                if agol_format:
                    self.log_json_format_table(ind + 87000, rowInfo,
                                               row_style="<tr><td style='text-align:center;'></td><td style='text-align:center;'></td><td style='text-align:right;'></td></tr>")
            if agol_format:
                sum_indx = UTILS.formatValue(withinSS, "%0.4f")
                fin = ["", "Total", "{0}"]
                tableRows.append(fin)
                self.log_json_format_table(89998, fin, ['sumIndex'], [sum_indx],
                                           row_style="<tr><td style='text-align:center;'></td><td style='text-align:center;'></td><td style='text-align:right;'></td></tr>")
                self.log_json_format_table(89999, " ", row_style="</table>")
            else:
                fin =  ["", "", "{} ({})".format(UTILS.formatValue(withinSS, "%0.4f"), ARCPY.GetIDMessage(84545))]
                tableRows.append(fin)

                topTable = UTILS.outputTextTable(tableRows, header = title,
                                                justify = "right", pad = 1,
                                                force2Txt=False)
                LOGGER.debug(topTable)

        if self.similarType in ['LEAST_SIMILAR', 'BOTH']:
            title = ARCPY.GetIDMessage(84506).format(firstLabel,
                                                     matchString)
            withinSS = self.totalDist[self.botIDs[:iters]].sum()
            outNames = ["OID"] + matchFieldInfo['LEAST_SIMILAR'][0:-1]
            tableRows = [ outNames ]

            for ind in UTILS.ssRange(iters):
                orderID = self.botIDs[ind]
                rank = str(ind+1)
                masterID = str(self.ssdoCand.order2Master[orderID])
                ss = UTILS.formatValue(self.totalDist[orderID], "%0.4f")
                rowInfo = [masterID, rank, ss]
                tableRows.append(rowInfo)

            fin =  ["", "", "{} ({})".format(UTILS.formatValue(withinSS, "%0.4f"), ARCPY.GetIDMessage(84545))]
            tableRows.append(fin)

            topTable = UTILS.outputTextTable(tableRows, header = title,
                                             justify = "right", pad = 1,
                                             force2Txt=False)
            LOGGER.debug(topTable)

    def createOutput(self, outputFC, parameters = None):
        #### Shorthand Attributes ####
        ssdoBase = self.ssdoBase
        ssdoCand = self.ssdoCand

        #### Validate Output Workspace ####
        ARCPY.overwriteOutput = True
        ERROR.checkOutputPath(outputFC)

        #### Create Output Feature Class ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84003))
        outPath, outName = OS.path.split(outputFC)

        try:
            DM.CreateFeatureclass(outPath, outName, "POINT", "", ssdoBase.mFlag, 
                                  ssdoBase.zFlag, ssdoBase.spatialRefString)
        except:
            LOGGER.error(210, extra={"message_ID": 210,
                                     "outputFC": outputFC})
            raise SystemExit()

        #### Add Null Value Flag ####
        outIsShapeFile = UTILS.isShapeFile(outputFC)
        setNullable = outIsShapeFile == False

        #### Add Shape/ID Field Names ####
        matchID, candID = outputIDFieldNames
        outFieldNames = ["SHAPE@"] + outputIDFieldNames
        # UTILS.addEmptyField(outputFC, matchID, "LONG", nullable = True)
        # UTILS.addEmptyField(outputFC, candID, "LONG", nullable = True)
        if self.ssdoBase.hasOID64:
            UTILS.addEmptyField(outputFC, matchID, "BIGINTEGER", nullable = True)
        else:
            UTILS.addEmptyField(outputFC, matchID, "LONG", nullable = True)
        if self.ssdoCand.hasOID64:
            UTILS.addEmptyField(outputFC, candID, "BIGINTEGER", nullable = True)
        else:
            UTILS.addEmptyField(outputFC, candID, "LONG", nullable = True)

        #### Add Append Fields ####
        lenAppend = len(self.appendFields) 
        in2OutFieldNames = {}
        appendOut = []
        highPrecisionFields = []
        allInputFields = self.fieldNames + self.zeroVarFields
        if lenAppend:
            for fieldName in self.appendFields:
                if fieldName not in allInputFields:
                    fcField = ssdoCand.allFields[fieldName]
                    fieldType = UTILS.convertType[fcField.type]
                    fieldOutName = UTILS.validQFieldName(fcField, outPath)
                    in2OutFieldNames[fieldName] = fieldOutName
                    UTILS.addEmptyField(outputFC, fieldOutName, fieldType,
                                        alias = fcField.alias, precision=fcField.precision)
                    outFieldNames.append(fieldOutName)
                    appendOut.append(fieldName)
                    if fcField.precision:
                        highPrecisionFields.append(fieldOutName)

        self.appendFields = appendOut

        #### Add Analysis Fields ####
        baseFields = self.fieldNames
        if self.baseFieldNames:
            baseFields = self.baseFieldNames
        
        # for fieldName in self.fieldNames:
        for fieldName in baseFields:
            fcField = ssdoBase.allFields[fieldName]
            fieldType = UTILS.convertType[fcField.type]
            fieldOutName = UTILS.validQFieldName(fcField, outPath)
            in2OutFieldNames[fieldName] = fieldOutName
            UTILS.addEmptyField(outputFC, fieldOutName, fieldType,
                                alias = fcField.alias)
            outFieldNames.append(fieldOutName)

        dataFieldNames = matchFieldInfo[self.similarType]
        dataFieldInfo = outputFieldInfo[self.matchMethod]
        baseValues = []
        for fieldName in dataFieldNames:
            outAlias, outType, baseValue = dataFieldInfo[fieldName]
            UTILS.addEmptyField(outputFC, fieldName, outType, 
                                alias = outAlias, 
                                nullable = setNullable) 
            outFieldNames.append(fieldName)
            baseValues.append(baseValue)

        #### Step Progress ####
        featureCount = ssdoBase.numObs + self.numResults
        if self.similarType == "BOTH":
            featureCount += self.numResults
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84003), 0,
                                                 featureCount, 1)

        try:
            DM.MigrateDateFieldToHighPrecision(in_table=outputFC, date_fields=highPrecisionFields)
        except:
            pass

        #### Get Insert Cursor ####
        rows = DA.InsertCursor(outputFC, outFieldNames)
        
        #### Set Base Data ####
        useShapeNull = outIsShapeFile
        if useShapeNull:
            nullIntValue = UTILS.shpFileNull['LONG']
        else:
            nullIntValue = None

        #### Set Base Null For Append ####
        appendNull = {}
        if not self.baseFieldNames:
            for fieldName in self.appendFields:
                if fieldName not in ssdoBase.fields:
                    if useShapeNull:
                        outType = ssdoCand.fields[fieldName].type
                        outNullValue = UTILS.shpFileNull[outType]
                    else:
                        outNullValue = None
                    appendNull[fieldName] = outNullValue

        #### Add Base Data ####
        for orderID in UTILS.ssRange(ssdoBase.numObs):
            x,y = ssdoBase.xyCoords[orderID]
            pnt = (x, y, ssdoBase.defaultZ)

            #### Insert Shape, Match_ID and NULL (Cand_ID) ####
            rowRes = [pnt, ssdoBase.order2Master[orderID], nullIntValue]

            #### Add Append Fields ####
            for fieldName in self.appendFields:
            # for fieldName in appendFields:
                if fieldName in appendNull:
                    rowRes.append(appendNull[fieldName])
                else:
                    value = ssdoBase.fields[fieldName].data.item(orderID)
                    if ssdoBase.fields[fieldName].data.dtype == NUM.int64 and value == nullVal64:
                        value = None
                    rowRes.append(value)

            #### Add Analysis Fields ####
            for fieldName in baseFields:
                rowRes.append(ssdoBase.fields[fieldName].data.item(orderID))

            #### Add Null Base Values ####
            rowRes += baseValues
            rows.insertRow(rowRes)
            ARCPY.SetProgressorPosition()
        if self.similarType in ['MOST_SIMILAR', 'BOTH']:
            #### First Add Similar Results ####
            for ind, orderID in enumerate(self.topIDs):
                x,y = ssdoCand.xyCoords[orderID]
                pnt = (x, y, ssdoBase.defaultZ)

                #### Insert Shape, NULL (Match_ID) and Cand_ID ####
                rowRes = [pnt, nullIntValue, ssdoCand.order2Master[orderID]]

                #### Add Append Fields ####
                for fieldName in self.appendFields:
                    rowRes.append(ssdoCand.fields[fieldName].data.item(orderID))

                #### Add Analysis Fields ####
                for fieldName in self.fieldNames:
                    rowRes.append(ssdoCand.fields[fieldName].data.item(orderID))

                #### Add Results ####
                rank = ind + 1
                ss = self.totalDist[orderID]

                if self.similarType == 'BOTH':
                    rowRes += [rank, nullIntValue, ss, rank]
                else:
                    rowRes += [rank, ss, rank]
                rows.insertRow(rowRes)
                ARCPY.SetProgressorPosition()

        if self.similarType in ['LEAST_SIMILAR', 'BOTH']:
            #### Add Least Similar #### 
            for ind, orderID in enumerate(self.botIDs):
                x,y = ssdoCand.xyCoords[orderID]
                pnt = (x, y, ssdoBase.defaultZ)

                #### Insert Shape, NULL (Match_ID) and Cand_ID ####
                rowRes = [pnt, nullIntValue, ssdoCand.order2Master[orderID]]

                #### Add Append Fields ####
                for fieldName in self.appendFields:
                    rowRes.append(ssdoCand.fields[fieldName].data.item(orderID))

                #### Add Analysis Fields ####
                for fieldName in self.fieldNames:
                    rowRes.append(ssdoCand.fields[fieldName].data.item(orderID))

                #### Add Results ####
                rank = ind + 1
                labRank = rank * -1
                ss = self.totalDist[orderID]

                if self.similarType == 'BOTH':
                    rowRes += [nullIntValue, rank, ss, labRank]
                else:
                    rowRes += [rank, ss, labRank]

                rows.insertRow(rowRes)
                ARCPY.SetProgressorPosition()

        #### Clean Up ####
        del rows

        #### Symbology ####
        if parameters is None:
            params = ARCPY.gp.GetParameterInfo()
        else:
            params = parameters

        #### Install Path to Layer Files ####
        fullRLF =  UTILS.pathLayers

        try:
            renderKey = (self.similarType, 0)
            renderLayerFile = outputRenderInfo[renderKey]
            renderLayerFile = returnRenderLayerFile(self.numResults,
                                                    renderLayerFile)
            fullRLF = OS.path.join(fullRLF, renderLayerFile)
            params[2].symbology = fullRLF
        except:
            LOGGER.warning(973, extra={"message_ID": 973})

        if self.hasOID64:
            try:
                DM.MigrateObjectIDTo64Bit(in_datasets=outputFC)
            except:
                #### Temp Try Except Until They Fix HasOID64 on Describe ####
                pass
        
    def createOutputShapes(self, outputFC, parameters = None):
        #### Shorthand Attributes ####
        ssdoBase = self.ssdoBase
        ssdoCand = self.ssdoCand

        #### Validate Output Workspace ####
        ARCPY.overwriteOutput = True
        ERROR.checkOutputPath(outputFC)

        #### Create Output Feature Class ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84003))
        outPath, outName = OS.path.split(outputFC)
        tempFC = UTILS.returnScratchName("TempSS_FC", fileType = "FEATURECLASS",
                                         scratchWS = outPath)
        outTempPath, outTempName = OS.path.split(tempFC)

        try:
            DM.CreateFeatureclass(outTempPath, outTempName, ssdoBase.shapeType, 
                                  "", ssdoBase.mFlag, 
                                  ssdoBase.zFlag, ssdoBase.spatialRefString)
        except:
            LOGGER.error(210, extra={"message_ID": 210,
                                     "outputFC": outputFC})
            raise SystemExit()

        #### Add Null Value Flag ####
        outIsShapeFile = UTILS.isShapeFile(outputFC)
        setNullable = outIsShapeFile == False

        #### Make Feature Layer and Select Result OIDs/Shapes ####
        featureCount = ssdoBase.numObs + ssdoCand.numObs
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84003), 0,
                                                 featureCount, 1)

        #### Add Shape/ID Field Names ####
        matchID, candID = outputIDFieldNames
        outFieldNames = ["SHAPE@"] + outputIDFieldNames
        inFieldNames = ["OID@", "SHAPE@"]
        if self.ssdoBase.hasOID64:
            UTILS.addEmptyField(tempFC, matchID, "BIGINTEGER", nullable = True)
        else:
            UTILS.addEmptyField(tempFC, matchID, "LONG", nullable = True)
        if self.ssdoCand.hasOID64:
            UTILS.addEmptyField(tempFC, candID, "BIGINTEGER", nullable = True)
        else:
            UTILS.addEmptyField(tempFC, candID, "LONG", nullable = True)

        #### Add Append Fields ####
        lenAppend = len(self.appendFields) 
        in2OutFieldNames = {}
        appendOut = []
        allInputFields = self.fieldNames + self.zeroVarFields
        if lenAppend:
            for fieldName in self.appendFields:
                if fieldName not in allInputFields:
                    fcField = ssdoCand.allFields[fieldName]
                    fieldType = UTILS.convertType[fcField.type]
                    fieldOutName = UTILS.validQFieldName(fcField, outPath)
                    in2OutFieldNames[fieldName] = fieldOutName
                    UTILS.addEmptyField(tempFC, fieldOutName, fieldType,
                                        alias = fcField.alias)
                    outFieldNames.append(fieldOutName)
                    appendOut.append(fieldName)

        self.appendFields = appendOut

        #### Add Analysis Fields ####
        baseFields = self.fieldNames
        if self.baseFieldNames:
            baseFields = self.baseFieldNames
        # for fieldName in self.fieldNames:
        for fieldName in baseFields:
            fcField = ssdoBase.allFields[fieldName]
            fieldType = UTILS.convertType[fcField.type]
            fieldOutName = UTILS.validQFieldName(fcField, outPath)
            in2OutFieldNames[fieldName] = fieldOutName
            UTILS.addEmptyField(tempFC, fieldOutName, fieldType,
                                alias = fcField.alias)
            outFieldNames.append(fieldOutName)

        dataFieldNames = matchFieldInfo[self.similarType]
        dataFieldInfo = outputFieldInfo[self.matchMethod]
        baseValues = []
        for fieldName in dataFieldNames:
            outAlias, outType, baseValue = dataFieldInfo[fieldName]
            UTILS.addEmptyField(tempFC, fieldName, outType, 
                                alias = outAlias, 
                                nullable = setNullable) 
            outFieldNames.append(fieldName)
            baseValues.append(baseValue)

        #### Get Insert Cursor ####
        baseRows = DA.SearchCursor(ssdoBase.inputFC, inFieldNames)
        candRows = DA.SearchCursor(ssdoCand.inputFC, inFieldNames)
        rows = DA.InsertCursor(tempFC, outFieldNames)

        #### Set Base Data ####
        useShapeNull = outIsShapeFile
        if useShapeNull:
            nullIntValue = UTILS.shpFileNull['LONG']
        else:
            nullIntValue = None

        #### Set Base Null For Append ####
        appendNull = {}
        if not self.baseFieldNames:
            for fieldName in self.appendFields:
                if fieldName not in ssdoBase.fields:
                    if useShapeNull:
                        outType = ssdoCand.fields[fieldName].type
                        outNullValue = UTILS.shpFileNull[outType]
                    else:
                        outNullValue = None
                    appendNull[fieldName] = outNullValue

        #### Add Base Data ####
        for masterID, shp in baseRows:
            if masterID in ssdoBase.master2Order:
                orderID = ssdoBase.master2Order[masterID]

                #### Insert Shape, Match_ID and NULL (Cand_ID) ####
                rowRes = [shp, masterID, nullIntValue]

                #### Add Append Fields ####
                for fieldName in self.appendFields:
                    if fieldName in appendNull:
                        rowRes.append(appendNull[fieldName])
                    else:
                        value = ssdoBase.fields[fieldName].data.item(orderID)
                        rowRes.append(value)

                #### Add Analysis Fields ####
                # for fieldName in self.fieldNames:
                for fieldName in baseFields:
                    rowRes.append(ssdoBase.fields[fieldName].data.item(orderID))

                #### Add Null Base Values ####
                rowRes += baseValues

                rows.insertRow(rowRes)
                ARCPY.SetProgressorPosition()
        del baseRows
        
        #### First Add Similar Results ####
        for masterID, shp in candRows:
            if masterID in ssdoCand.master2Order:
                orderID = ssdoCand.master2Order[masterID]
                indTop = NUM.where(self.topIDs == orderID)[0]
                indBot = NUM.where(self.botIDs == orderID)[0]
                if self.similarType in ['MOST_SIMILAR', 'BOTH'] and len(indTop):
                    ind = indTop[0]
                    #### Insert Shape, NULL (Match_ID) and Cand_ID ####
                    rowRes = [shp, nullIntValue, masterID]
                    
                    #### Add Append Fields ####
                    for fieldName in self.appendFields:
                        rowRes.append(ssdoCand.fields[fieldName].data.item(orderID))

                    #### Add Analysis Fields ####
                    for fieldName in self.fieldNames:
                        rowRes.append(ssdoCand.fields[fieldName].data.item(orderID))

                    #### Add Results ####
                    rank = ind + 1
                    ss = self.totalDist[orderID]

                    if self.similarType == 'BOTH':
                        rowRes += [rank, nullIntValue, ss, rank]
                    else:
                        rowRes += [rank, ss, rank]

                    rows.insertRow(rowRes)
                if self.similarType in ['LEAST_SIMILAR', 'BOTH'] and len(indBot):
                    ind = indBot[0]
                    #### Insert Shape, NULL (Match_ID) and Cand_ID ####
                    rowRes = [shp, nullIntValue, masterID]

                    #### Add Append Fields ####
                    for fieldName in self.appendFields:
                        rowRes.append(ssdoCand.fields[fieldName].data.item(orderID))

                    #### Add Analysis Fields ####
                    for fieldName in self.fieldNames:
                        rowRes.append(ssdoCand.fields[fieldName].data.item(orderID))

                    #### Add Results ####
                    rank = ind + 1
                    labRank = rank * -1
                    ss = self.totalDist[orderID]

                    if self.similarType == 'BOTH':
                        rowRes += [nullIntValue, rank, ss, labRank]
                    else:
                        rowRes += [rank, ss, labRank]

                    rows.insertRow(rowRes)

            ARCPY.SetProgressorPosition()
        del candRows
        del rows

        #### Do Final Sort ####
        if self.matchMethod == 'ATTRIBUTE_PROFILES':
            if self.similarType == 'MOST_SIMILAR':
                sortString = "SIMINDEX DESCENDING;SIMRANK DESCENDING"
            else:
                sortString = "SIMINDEX DESCENDING"
        else:
            if self.similarType == 'MOST_SIMILAR':
                sortString = "SIMINDEX ASCENDING;SIMRANK ASCENDING"
            else:
                sortString = "SIMINDEX ASCENDING"
        sortNoExtent = UTILS.clearExtent(DM.Sort)
        sortNoExtent(tempFC, outputFC, sortString, "UR")

        #### Clean Up ####
        DM.Delete(tempFC)

        #### Delete ORIG_ID ####
        lf = ARCPY.ListFields(outputFC, "ORIG_FID")
        if len(lf):
            DM.DeleteField(outputFC, "ORIG_FID")

        #### Symbology ####
        if parameters is None:
            params = ARCPY.gp.GetParameterInfo()
        else:
            params = parameters

        #### Install Path to Layer Files ####
        fullRLF =  UTILS.pathLayers

        try:
            renderType = UTILS.renderType[self.ssdoBase.shapeType.upper()]
            renderKey = (self.similarType, renderType)
            renderLayerFile = outputRenderInfo[renderKey]
            renderLayerFile = returnRenderLayerFile(self.numResults,
                                                    renderLayerFile)
            fullRLF = OS.path.join(fullRLF, renderLayerFile)
            params[2].symbology = fullRLF
        except:
            LOGGER.warning(973, extra={"message_ID": 973})

        if self.hasOID64:
            try:
                DM.MigrateObjectIDTo64Bit(in_datasets=outputFC)
            except:
                #### Temp Try Except Until They Fix HasOID64 on Describe ####
                pass

    def createOutputAGOL(self, outputFC, parameters=None):
        #### Shorthand Attributes ####
        ssdoBase = self.ssdoBase
        ssdoCand = self.ssdoCand

        #### Validate Output Workspace ####
        ARCPY.overwriteOutput = True
        ERROR.checkOutputPath(outputFC)

        #### Create Output Feature Class ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84003))
        outPath, outName = OS.path.split(outputFC)

        try:
            DM.CreateFeatureclass(outPath, outName, "POINT", "", ssdoBase.mFlag, 
                                  ssdoBase.zFlag, ssdoBase.spatialRefString)
        except:
            LOGGER.error(210, extra={"message_ID": 210,
                                     "outputFC": outputFC})
            raise SystemExit()

        #### Add Null Value Flag ####
        outIsShapeFile = UTILS.isShapeFile(outputFC)
        setNullable = outIsShapeFile == False

        #### Add Shape/ID Field Names ####
        matchID, candID = outputIDFieldNames
        outFieldNames = ["SHAPE@"] + outputIDFieldNames
        UTILS.addEmptyField(outputFC, matchID, "LONG", alias="Input Reference ID", nullable=True)
        UTILS.addEmptyField(outputFC, candID, "LONG", alias="Candidate Search ID", nullable = True)

        dataFieldNames = matchFieldInfo[self.similarType]
        dataFieldInfo = outputFieldInfo[self.matchMethod]
        baseValues = []
        in2OutFieldNames = {}
        # candFieldset = set()
        uniqueCandFieldNames = list(dict.fromkeys(self.fieldNames))
        for fieldName in uniqueCandFieldNames:
            fcField = ssdoCand.allFields[fieldName]
            fieldType = UTILS.convertType[fcField.type]
            fieldOutName = UTILS.validQFieldName(fcField, outPath)
            in2OutFieldNames[fieldName] = fieldOutName
            UTILS.addEmptyField(outputFC, fieldOutName, fieldType,
                                alias=fcField.alias)
            outFieldNames.append(fieldOutName)

        for fieldName in dataFieldNames:
            outAlias, outType, baseValue = dataFieldInfo[fieldName]
            UTILS.addEmptyField(outputFC, fieldName, outType, 
                                alias = outAlias, 
                                nullable = setNullable) 
            outFieldNames.append(fieldName)
            baseValues.append(baseValue)

        #### Add Analysis Fields ####
        baseFields = self.fieldNames
        if self.baseFieldNames:
            baseFields = self.baseFieldNames

        #for fieldName in self.fieldNames:
        # baseFieldset = set()
        uniqueBaseFieldNames = list(dict.fromkeys(baseFields))
        for fieldName in uniqueBaseFieldNames:
            fcField = ssdoBase.allFields[fieldName]
            fieldType = UTILS.convertType[fcField.type]
            fieldOutName = UTILS.validQFieldName(fcField, outPath)
            in2OutFieldNames[fieldName] = fieldOutName
            if fieldOutName.upper() in uniqueCandFieldNames:
                fieldOutName += "_REF"
            UTILS.addEmptyField(outputFC, fieldOutName, fieldType,
                                alias = fcField.alias)
            outFieldNames.append(fieldOutName)

        featureCount = ssdoBase.numObs + self.numResults
        if self.similarType == "BOTH":
            featureCount += self.numResults
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84003), 0,
                                                 featureCount, 1)
        #### Get Insert Cursor ####
        rows = DA.InsertCursor(outputFC, outFieldNames)
        #### Set Base Data ####
        useShapeNull = outIsShapeFile
        if useShapeNull:
            nullIntValue = UTILS.shpFileNull['LONG']
        else:
            nullIntValue = None

        if useShapeNull:
            outType = ssdoCand.fields[fieldName].type
            outNullValue = UTILS.shpFileNull[outType]
        else:
            outNullValue = None

        #### First Add Similar Results ####
        for ind, orderID in enumerate(self.topIDs):
            x,y = ssdoCand.xyCoords[orderID]
            pnt = (x, y, ssdoBase.defaultZ)

            #### Insert Shape, NULL (Match_ID) and Cand_ID ####
            rowRes = [pnt, nullIntValue, ssdoCand.order2Master[orderID]]

            #### Add Analysis Fields ####
            # for fieldName in self.fieldNames:
            for fieldName in uniqueCandFieldNames:
                rowRes.append(ssdoCand.fields[fieldName.upper()].data.item(orderID))

            #### Add Results ####
            rank = ind + 1
            ss = self.totalDist[orderID]

            rowRes += [rank, ss, rank]

            # for fld in self.baseFieldNames:
            for _ in uniqueBaseFieldNames:
                rowRes += [outNullValue]

            rows.insertRow(rowRes)

            ARCPY.SetProgressorPosition()

        #### Set Base Null For Append ####
        appendNull = {}
        if not self.baseFieldNames:
            for fieldName in self.appendFields:
                if fieldName not in ssdoBase.fields:
                    if useShapeNull:
                        outType = ssdoCand.fields[fieldName].type
                        outNullValue = UTILS.shpFileNull[outType]
                    else:
                        outNullValue = None
                    appendNull[fieldName] = outNullValue

        appendFields = self.appendFields
        if self.baseFieldNames:
            appendFields = self.baseFieldNames

        for orderID in UTILS.ssRange(ssdoBase.numObs):
            x,y = ssdoBase.xyCoords[orderID]
            pnt = (x, y, ssdoBase.defaultZ)

            #### Insert Shape, Match_ID and NULL (Cand_ID) ####
            rowRes = [pnt, ssdoBase.order2Master[orderID], nullIntValue]

            for fieldName in uniqueCandFieldNames:
                if useShapeNull:
                    outType = ssdoCand.fields[fieldName.upper()].type
                    outNullValue = UTILS.shpFileNull[outType]
                else:
                    outNullValue = None
                rowRes.append(outNullValue)

            #### Add Null Base Values ####
            rowRes += baseValues
            #### Add Analysis Fields ####
            # for fieldName in self.fieldNames:
            for fieldName in uniqueBaseFieldNames:
                rowRes.append(ssdoBase.fields[fieldName.upper()].data.item(orderID))

            rows.insertRow(rowRes)
            ARCPY.SetProgressorPosition()

        #### Clean Up ####
        del rows

        #### Symbology ####
        if parameters is None:
            params = ARCPY.gp.GetParameterInfo()
        else:
            params = parameters

        #### Install Path to Layer Files ####
        fullRLF =  UTILS.pathLayers

        try:
            renderKey = (self.similarType, 0)
            renderLayerFile = outputRenderInfo[renderKey]
            renderLayerFile = returnRenderLayerFile(self.numResults,
                                                    renderLayerFile)
            fullRLF = OS.path.join(fullRLF, renderLayerFile)
            params[2].symbology = fullRLF
        except:
            LOGGER.warning(973, extra={"message_ID": 973})

    def createOutputShapesAGOL(self, outputFC, parameters=None):
        #### Shorthand Attributes ####
        ssdoBase = self.ssdoBase
        ssdoCand = self.ssdoCand

        #### Validate Output Workspace ####
        ARCPY.overwriteOutput = True
        ERROR.checkOutputPath(outputFC)

        #### Create Output Feature Class ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84003))
        outPath, outName = OS.path.split(outputFC)
        tempFC = UTILS.returnScratchName("TempSS_FC", fileType = "FEATURECLASS",
                                         scratchWS = outPath)
        outTempPath, outTempName = OS.path.split(tempFC)

        try:
            DM.CreateFeatureclass(outTempPath, outTempName, ssdoBase.shapeType, 
                                  "", ssdoBase.mFlag, 
                                  ssdoBase.zFlag, ssdoBase.spatialRefString)
        except:
            LOGGER.error(210, extra={"message_ID": 210,
                                     "outputFC": outputFC})
            raise SystemExit()
        #### Add Null Value Flag ####
        outIsShapeFile = UTILS.isShapeFile(outputFC)
        setNullable = outIsShapeFile == False
        #### Make Feature Layer and Select Result OIDs/Shapes ####
        featureCount = ssdoBase.numObs + ssdoCand.numObs
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84003), 0,
                                                 featureCount, 1)

        #### Add Shape/ID Field Names ####
        matchID, candID = outputIDFieldNames
        outFieldNames = ["SHAPE@"] + outputIDFieldNames
        inFieldNames = ["OID@", "SHAPE@"]
        # UTILS.addEmptyField(tempFC, matchID, "LONG", nullable = True)
        # UTILS.addEmptyField(tempFC, candID, "LONG", nullable = True)
        UTILS.addEmptyField(tempFC, matchID, "LONG", alias="Input Reference ID", nullable=True)
        UTILS.addEmptyField(tempFC, candID, "LONG", alias="Candidate Search ID", nullable = True)

        in2OutFieldNames = {}
        appendOut = []
        allInputFields = self.fieldNames + self.zeroVarFields
        # candFieldset = set()
        uniqueCandFieldNames = list(dict.fromkeys(self.fieldNames))
        for fieldName in uniqueCandFieldNames:
            fcField = ssdoCand.allFields[fieldName]
            fieldType = UTILS.convertType[fcField.type]
            fieldOutName = UTILS.validQFieldName(fcField, outPath)
            in2OutFieldNames[fieldName] = fieldOutName
            UTILS.addEmptyField(tempFC, fieldOutName, fieldType,
                                alias=fcField.alias)
            outFieldNames.append(fieldOutName)

        dataFieldNames = matchFieldInfo[self.similarType]
        dataFieldInfo = outputFieldInfo[self.matchMethod]
        baseValues = []
        for fieldName in dataFieldNames:
            outAlias, outType, baseValue = dataFieldInfo[fieldName]
            UTILS.addEmptyField(tempFC, fieldName, outType, 
                                alias = outAlias, 
                                nullable = setNullable) 
            outFieldNames.append(fieldName)
            baseValues.append(baseValue)

        #### Add Analysis Fields ####
        baseFields = self.fieldNames
        if self.baseFieldNames:
            baseFields = self.baseFieldNames
        
        # baseFieldset = set()
        uniqueBaseFieldNames = list(dict.fromkeys(baseFields))
        for fieldName in uniqueBaseFieldNames:
            fcField = ssdoBase.allFields[fieldName]
            fieldType = UTILS.convertType[fcField.type]
            fieldOutName = UTILS.validQFieldName(fcField, outPath)
            in2OutFieldNames[fieldName] = fieldOutName
            if fieldOutName.upper() in uniqueCandFieldNames:
                fieldOutName += "_REF"
            UTILS.addEmptyField(tempFC, fieldOutName, fieldType,
                                alias = fcField.alias)
            outFieldNames.append(fieldOutName)

        #### Get Insert Cursor ####
        baseRows = DA.SearchCursor(ssdoBase.inputFC, inFieldNames)
        candRows = DA.SearchCursor(ssdoCand.inputFC, inFieldNames)
        rows = DA.InsertCursor(tempFC, outFieldNames)

        #### Set Base Data ####
        useShapeNull = outIsShapeFile
        if useShapeNull:
            nullIntValue = UTILS.shpFileNull['LONG']
        else:
            nullIntValue = None

        if useShapeNull:
            outType = ssdoCand.fields[fieldName].type
            outNullValue = UTILS.shpFileNull[outType]
        else:
            outNullValue = None

        #### First Add Similar Results ####
        for masterID, shp in candRows:
            if masterID in ssdoCand.master2Order:
                orderID = ssdoCand.master2Order[masterID]
                indTop = NUM.where(self.topIDs == orderID)[0]
                if len(indTop):
                    ind = indTop[0]
                    #### Insert Shape, NULL (Match_ID) and Cand_ID ####
                    rowRes = [shp, nullIntValue, masterID]
                    
                    #### Add Analysis Fields ####
                    # for fieldName in self.fieldNames:
                    for fieldName in uniqueCandFieldNames:
                        rowRes.append(ssdoCand.fields[fieldName.upper()].data.item(orderID))

                    #### Add Results ####
                    rank = ind + 1
                    ss = self.totalDist[orderID]

                    rowRes += [rank, ss, rank]
                    # for fld in self.baseFieldNames:
                    #     rowRes += [outNullValue]
                    for _ in uniqueBaseFieldNames:
                        rowRes += [outNullValue]

                    rows.insertRow(rowRes)
            ARCPY.SetProgressorPosition()
        del candRows

        #### Add Base Data ####
        for masterID, shp in baseRows:
            if masterID in ssdoBase.master2Order:
                orderID = ssdoBase.master2Order[masterID]

                #### Insert Shape, Match_ID and NULL (Cand_ID) ####
                rowRes = [shp, masterID, nullIntValue]

                # for fieldName in self.fieldNames:
                for fieldName in uniqueCandFieldNames:
                    if useShapeNull:
                        outType = ssdoCand.fields[fieldName.upper()].type
                        outNullValue = UTILS.shpFileNull[outType]
                    else:
                        outNullValue = None
                    rowRes.append(outNullValue)

                #### Add Null Base Values ####
                rowRes += baseValues

                #### Add Analysis Fields ####
                # for fieldName in self.fieldNames:
                # for fieldName in baseFields:
                for fieldName in uniqueBaseFieldNames:
                    rowRes.append(ssdoBase.fields[fieldName.upper()].data.item(orderID))

                rows.insertRow(rowRes)
                ARCPY.SetProgressorPosition()
        del baseRows
        del rows

        ## the match method is always ATTRIBUTE_VALUES
        sortString = "SIMINDEX ASCENDING"
        sortNoExtent = UTILS.clearExtent(DM.Sort)
        sortNoExtent(tempFC, outputFC, sortString, "UR")

        #### Clean Up ####
        DM.Delete(tempFC)

        #### Delete ORIG_ID ####
        lf = ARCPY.ListFields(outputFC, "ORIG_FID")
        if len(lf):
            DM.DeleteField(outputFC, "ORIG_FID")

        #### Symbology ####
        if parameters is None:
            params = ARCPY.gp.GetParameterInfo()
        else:
            params = parameters

        #### Install Path to Layer Files ####
        fullRLF =  UTILS.pathLayers

        try:
            renderType = UTILS.renderType[self.ssdoBase.shapeType.upper()]
            renderKey = (self.similarType, renderType)
            renderLayerFile = outputRenderInfo[renderKey]
            renderLayerFile = returnRenderLayerFile(self.numResults,
                                                    renderLayerFile)
            fullRLF = OS.path.join(fullRLF, renderLayerFile)
            params[2].symbology = fullRLF
        except:
            LOGGER.warning(973, extra={"message_ID": 973})


def postExecute(parameters):
    try:
        datasetBase = None
        if parameters[2].value is not None:
            datasetBase = UTILS.getTextParameter(2, parameters)
        else:
            return
        
        project = ARCPY.mp.ArcGISProject('CURRENT')
        mapFrame = project.activeMap
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
        if outputLayer is not None:
            definition = outputLayer.getDefinition('V3')
            if 'Feature(s) To Match' == definition.renderer.exclusionLabel:
                definition.renderer.exclusionLabel = ARCPY.GetIDMessage(220850)
            if 'Most Similar = 1, Most Dissimilar = -1' == definition.renderer.heading:
                definition.renderer.heading = '{0}, {1}'.format(ARCPY.GetIDMessage(220849), ARCPY.GetIDMessage(220850))
            if 'Most Similar = 1' == definition.renderer.heading:
                definition.renderer.heading = ARCPY.GetIDMessage(220849)
            if 'Most Dissimilar = -1' == definition.renderer.heading:
                definition.renderer.heading = ARCPY.GetIDMessage(220850)
            outputLayer.setDefinition(definition)

    except:

        pass