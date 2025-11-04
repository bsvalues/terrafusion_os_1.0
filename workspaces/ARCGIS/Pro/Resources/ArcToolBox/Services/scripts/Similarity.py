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
import json as JSON

################## Helper Functions ##################

outputIDFieldNames = ['MATCH_ID', 'CAND_ID']

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

def returnJSON_Table(msgID, msg, listOfStringArgs = [], listOfStringVals = [], rowStyle = 'table'):
    """Message takes array as for columns in table"""
    allDict = {}
    paramDict = {}
    if len(listOfStringArgs):
        for ind, stringVal in enumerate(listOfStringArgs):
            if listOfStringVals:
                paramDict["%s" % stringVal] = listOfStringVals[ind]
            else:
                paramDict["%s" % stringVal] = "%s" % stringVal
            msg = [m.replace("{%i}" % ind, "${%s}" % stringVal) for m in msg]
    allDict['message'] = msg
    allDict['messageCode'] = "SS_" + str(msgID).rjust(5, '0')
    allDict['params'] = paramDict
    allDict['style'] = rowStyle
    jsonMess = JSON.dumps(allDict)
    ARCPY.gp.AddMessage(jsonMess, 55)

def returnJSON_Message(msgID, msg ='', listOfStringKeys = [], listOfStringVals = [], rowStyle = '<span></span>'):
    if not msg:
        msg = ARCPY.GetIDMessage(msgID)

    allDict = {}
    paramDict = {}
    if len(listOfStringKeys):
        for ind, keyVal in enumerate(listOfStringKeys):
            paramDict[keyVal] = listOfStringVals[ind]
            msg = msg.replace("{%i}" % ind, "${%s}" % keyVal)

    allDict['message'] = msg
    allDict['messageCode'] = "SS_" + str(msgID).rjust(5, '0')
    allDict['params'] = paramDict
    allDict['style'] = rowStyle
    jsonMess = JSON.dumps(allDict)
    ARCPY.gp.AddMessage(jsonMess, 55)

def ANOVA(candVals, baseVals):
    return ((candVals - baseVals)**2.0).sum(1)

def cosineSim(candVals, baseVals):
    cosTop = (baseVals * candVals).sum(1)
    cosLeft = NUM.sqrt((baseVals**2.0).sum())
    cosRight = NUM.sqrt((candVals**2.0).sum(1))
    cosBottom = cosLeft * cosRight
    return cosTop / cosBottom

def getTopIDs(sortedIDs, numResults, similarType = 'MOST_SIMILAR', 
              reverse = False):
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

def fieldValidation(ssdoBase, ssdoCand, fieldNames, appendFields):
    outFieldNames = []
    outAppendBase = []
    badInputNames = []
    propertyWarning = False
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
        ARCPY.AddIDMessage("WARNING", 110036)

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
            ARCPY.AddIDMessage("ERROR", 110057, baseSpatialRef.name,
                                                outSpatialRef.name)
            raise SystemExit()

        if not transCand:
            ARCPY.AddIDMessage("ERROR", 110058, candSpatialRef.name,
                                                outSpatialRef.name)
            raise SystemExit()

        return outSpatialRef

    if not transBase or not transCand:
        explicitSpatialRef = ARCPY.SpatialReference(3857)
        ARCPY.AddIDMessage("WARNING", 110059)
        return explicitSpatialRef

    return outSpatialRef

################### GUI Interface ###################
def setupSimilarity():
    """Retrieves the parameters from the User Interface and executes the
    appropriate commands."""

    inputFC = ARCPY.GetParameterAsText(0)                    
    candidateFC = ARCPY.GetParameterAsText(1)
    outputFC = ARCPY.GetParameterAsText(2)
    collapseToPoints = ARCPY.GetParameter(3)
    similarType = ARCPY.GetParameterAsText(4)
    matchMethod = ARCPY.GetParameterAsText(5)
    numResults = UTILS.getNumericParameter(6)
    tempFieldNames = ARCPY.GetParameterAsText(7).upper()   
    tempFieldNames = tempFieldNames.split(";")
    appendFields = ARCPY.GetParameterAsText(8).upper()   
    if appendFields != "":
        appendFields = appendFields.split(";")
        appendFields = [ i for i in appendFields if i not in tempFieldNames ]
    else:
        appendFields = []

    #### Get/Check Output Spatial Ref ####
    explicitSpatialRef = getOutputSpatialRef(inputFC, candidateFC, 
                                             outputFC)

    #### Initialize DataObjects ####
    ssdoBase = SSDO.SSDataObject(inputFC, useChordal = False, 
                                 explicitSpatialRef = explicitSpatialRef)
    ssdoCand = SSDO.SSDataObject(candidateFC, useChordal = False,
                                 explicitSpatialRef = explicitSpatialRef)

    #### Field Validation ####
    fieldNames, appendBase, badInputNames = fieldValidation(ssdoBase, 
                                                            ssdoCand, 
                                                            tempFieldNames, 
                                                            appendFields)

    #### Warn About Excluded Fields #### 
    badNames = len(badInputNames)
    if badNames:
        badInputNames = ", ".join(badInputNames)
        ARCPY.AddIDMessage("WARNING", 1584, badInputNames)

    #### No Valid Fields Found ####
    if not len(fieldNames):
        ARCPY.AddIDMessage("ERROR", 1585)
        raise SystemExit()

    #### Runtime Check for Cosign Sim (In Class as Well for Variance) ####
    if len(fieldNames) == 1 and matchMethod == 'ATTRIBUTE_PROFILES':
        ARCPY.AddIDMessage("ERROR", 1598)
        raise SystemExit()

    allFieldNamesBase = fieldNames + appendBase
    allFieldNamesCand = fieldNames + appendFields

    ssdoBase.obtainData(ssdoBase.oidName, allFieldNamesBase,
                        explicitBadRecordID = 1615)
    if ssdoBase.numObs == 0:
        ARCPY.AddIDMessage("ERROR", 1599)
        raise SystemExit()

    ssdoCand.obtainData(ssdoCand.oidName, allFieldNamesCand, 
                        explicitBadRecordID = 1616)
    if ssdoCand.numObs <= 2:
        ARCPY.AddIDMessage("ERROR", 1589)
        raise SystemExit()

    ss = SimilaritySearch(ssdoBase, ssdoCand, fieldNames,
                          similarType = similarType,
                          matchMethod = matchMethod,
                          numResults = numResults,
                          appendFields = allFieldNamesCand)
    ss.report()

    baseIsPoint = UTILS.renderType[ssdoBase.shapeType.upper()] == 0
    baseCandDiff = ssdoBase.shapeType.upper() != ssdoCand.shapeType.upper()
    if collapseToPoints or baseIsPoint or baseCandDiff:
        ss.createOutput(outputFC)
    else:
        ss.createOutputShapes(outputFC)

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

    ATTRIBUTES:
    numVars (int): number of analysis fields
    baseVals (array): base data values
    candVals (array): candidate data values
    totalDist (array): sum distance between target and each candidate
    """
    def __init__(self, ssdoBase, ssdoCand, fieldNames,
                 similarType = 'MOST_SIMILAR',
                 matchMethod = 'ATTRIBUTE_VALUES',
                 numResults = 10, appendFields = []):

        UTILS.assignClassAttr(self, locals())
        self.k = len(self.fieldNames)
        self.validateNumResults()
        self.initialize()
        self.solve()

    def validateNumResults(self):
        candN = self.ssdoCand.numObs
        bothType = self.similarType == 'BOTH'
        if bothType:
            maxN = int(candN / 2)
        else:
            maxN = candN 

        if self.numResults > maxN:
            if bothType:
                ARCPY.AddIDMessage("WARNING", 1587, str(maxN))
            else:
                ARCPY.AddIDMessage("WARNING", 1586, str(maxN))

            self.numResults = maxN

        if self.numResults == 0:
            self.numResults = maxN

    def initialize(self):
        #### Get Quick Output Info ####
        self.numFeatures = self.ssdoBase.numObs + self.ssdoCand.numObs

        #### Start With Target Features ####
        baseVals = NUM.empty((self.ssdoBase.numObs, self.k), float)
        for ind, fieldName in enumerate(self.fieldNames):
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
            ARCPY.AddIDMessage("WARNING", 1588, zeroNames)
            for fieldName in zeroVarFields:
                self.fieldNames.remove(fieldName)
        self.zeroVarFields = zeroVarFields

        #### Cosign Sim Must Have At Least Two Analysis Fields ####
        if self.k == 1 and self.matchMethod == 'ATTRIBUTE_PROFILES':
            ARCPY.AddIDMessage("ERROR", 1598)
            raise SystemExit()

        #### No Fields Left ####
        if not self.k:
            ARCPY.AddIDMessage("ERROR", 1585)
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
            self.topIDs = getTopIDs(self.sortedIDs, self.numResults)
            self.botIDs = getTopIDs(self.sortedIDs, self.numResults, 
                               reverse = True)
        else:
            if (self.baseMean == self.attMean).sum() == self.k:
                #### Base Attribute / Mean of Attributes == Mean Candidates ####
                ARCPY.AddIDMessage("ERROR", 110339)
                raise SystemExit()

            self.totalDist = cosineSim(self.candVals, self.baseVals)
            self.sortedIDs = self.totalDist.argsort()
            self.topIDs = getTopIDs(self.sortedIDs, self.numResults, reverse = True)
            self.botIDs = getTopIDs(self.sortedIDs, self.numResults)

    def report(self):
        #### Report Strings Across Tables ####
        minStr = ARCPY.GetIDMessage(84271)
        maxStr = ARCPY.GetIDMessage(84272)
        meanStr = ARCPY.GetIDMessage(84261)
        stdStr = ARCPY.GetIDMessage(84509)
        attStr = ARCPY.GetIDMessage(84507)
        inStr = ARCPY.GetIDMessage(84508)

        #### Warn that Targets are Average of Inputs ####
        if self.ssdoBase.numObs > 1:
            ARCPY.AddIDMessage("WARNING", 1583)
            tableHead = [attStr, minStr, maxStr, stdStr, meanStr]
            #### Additional Averaged Summary ####
            returnJSON_Message(84503) #Title
            returnJSON_Table(89997, tableHead, rowStyle = "<table><tr><th style='text-align:center;'></th><th style='text-align:center;'></th><th style='text-align:center;'></th><th style='text-align:center;'></th><th style='text-align:center;'></th></tr>")
            for ind, fieldName in enumerate(self.fieldNames):
                avgList =  [fieldName, 
                            UTILS.formatValue(self.baseMin[ind], "%0.4f"), 
                            UTILS.formatValue(self.baseMax[ind], "%0.4f"), 
                            UTILS.formatValue(self.baseStd[ind], "%0.4f"), 
                            UTILS.formatValue(self.baseMean[ind], "%0.4f") ]
                returnJSON_Table(ind+85000, avgList, rowStyle = "<tr><td style='text-align:left;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td></tr>")
                
            returnJSON_Table(89999, " ", rowStyle = "</table><br></br>")
            
        #### Attribute Summary ####
        returnJSON_Message(84504) #Title
        tableHead = [attStr, minStr, maxStr, stdStr, meanStr, inStr]
        returnJSON_Table(84512, tableHead, rowStyle = "<table><tr><th style='text-align:center;'></th><th style='text-align:center;'></th><th style='text-align:center;'></th><th style='text-align:center;'></th><th style='text-align:center;'></th><th style='text-align:center;'></th></tr>")
        for ind, fieldName in enumerate(self.fieldNames):
            avgList = [fieldName, 
                        UTILS.formatValue(self.attMin[ind], "%0.4f"), 
                        UTILS.formatValue(self.attMax[ind], "%0.4f"), 
                        UTILS.formatValue(self.attStd[ind], "%0.4f"), 
                        UTILS.formatValue(self.attMean[ind], "%0.4f"),
                        UTILS.formatValue(self.baseMean[ind], "%0.4f") ]
            returnJSON_Table(ind+86000, avgList, rowStyle = "<tr><td style='text-align:left;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td><td style='text-align:right;padding:0 15px'></td></tr>")
        returnJSON_Table(89999, " ", rowStyle = "</table><br></br>")
        
        if self.numResults > ssMaxTextTableResults:
            firstLabel = "Top 10 of {}".format(self.numResults)
            iters = ssMaxTextTableResults
            agolID = 84506
        else:
            firstLabel = "Top {}".format(self.numResults)
            iters = self.numResults
            agolID = 84505
        matchString = outputTabInfo[self.matchMethod]
        
        if self.similarType in ['MOST_SIMILAR', 'BOTH']:
            title = ARCPY.GetIDMessage(84505).format(firstLabel, matchString)
            returnJSON_Message(agolID, title, ['numResults'], [str(self.numResults)], rowStyle = "<span></span>")
            withinSS = self.totalDist[self.topIDs[:iters]].sum()
            outNames = ["OID"] + matchFieldInfo['MOST_SIMILAR'][0:-1]
            tableRows = [ outNames ]
            returnJSON_Table(84510, outNames, rowStyle = "<table><tr><th></th><th></th><th></th></tr>")
            for ind in UTILS.ssRange(iters):
                orderID = self.topIDs[ind]
                rank = str(ind+1)
                masterID = str(self.ssdoCand.order2Master[orderID])
                ss = UTILS.formatValue(self.totalDist[orderID], "%0.4f")
                rowInfo = [masterID, rank, ss]
                tableRows.append(rowInfo)
                returnJSON_Table(ind+87000, rowInfo, rowStyle = "<tr><td style='text-align:center;'></td><td style='text-align:center;'></td><td style='text-align:right;'></td></tr>")
            sumIndex = UTILS.formatValue(withinSS, "%0.4f")
            fin =  ["", "Total", "{0}"]
            tableRows.append(fin)
            returnJSON_Table(89998, fin, ['sumIndex'], [sumIndex], rowStyle = "<tr><td style='text-align:center;'></td><td style='text-align:center;'></td><td style='text-align:right;'></td></tr>")
            #topTable = UTILS.outputTextTable(tableRows, header = title,
#                                             justify = "right", pad = 1)
            returnJSON_Table(89999, " ", rowStyle = "</table>")
            #ARCPY.AddMessage(topTable)

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
            ARCPY.AddMessage(topTable)

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
            ARCPY.AddIDMessage("ERROR", 210, outputFC)
            raise SystemExit()

        #### Add Null Value Flag ####
        outIsShapeFile = UTILS.isShapeFile(outputFC)
        setNullable = outIsShapeFile == False

        #### Add Shape/ID Field Names ####
        matchID, candID = outputIDFieldNames
        outFieldNames = ["SHAPE@"] + outputIDFieldNames
        UTILS.addEmptyField(outputFC, matchID, "LONG", nullable = True)
        UTILS.addEmptyField(outputFC, candID, "LONG", nullable = True)

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
                    UTILS.addEmptyField(outputFC, fieldOutName, fieldType,
                                        alias = fcField.alias)
                    outFieldNames.append(fieldOutName)
                    appendOut.append(fieldName)

        self.appendFields = appendOut

        #### Add Analysis Fields ####
        for fieldName in self.fieldNames:
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
                if fieldName in appendNull:
                    rowRes.append(appendNull[fieldName])
                else:
                    value = ssdoBase.fields[fieldName].data.item(orderID)
                    rowRes.append(value)

            #### Add Analysis Fields ####
            for fieldName in self.fieldNames:
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
            ARCPY.AddIDMessage("WARNING", 973)
        
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
            ARCPY.AddIDMessage("ERROR", 210, outputFC)
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
        UTILS.addEmptyField(tempFC, matchID, "LONG", nullable = True)
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
        for fieldName in self.fieldNames:
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
            for fieldName in self.fieldNames:
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
            ARCPY.AddIDMessage("WARNING", 973)

if __name__ == "__main__":
    setupSimilarity()

