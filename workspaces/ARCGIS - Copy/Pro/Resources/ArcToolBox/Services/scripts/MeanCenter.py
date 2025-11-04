# coding: utf-8
"""
Tool Name:  Mean Center
Source Name: MeanCenter.py
Version: ArcGIS 10.1
Author: ESRI

This tool identifies the geographic center (or the center of
concentration) for a set of features.  This mean center is a point
constructed from X and Y values for all feature centroids in a dataset.
Features may optionally be grouped, if a CASE field is provided.  When
a weight field is specified, the result is weigted mean centers.
"""

################### Imports ########################
import os as OS
import sys as SYS
import collections as COLL
import numpy as NUM
import datetime as DT
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.da as DA
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import locale as LOCALE
import json as JSON
LOCALE.setlocale(LOCALE.LC_ALL, '')

################ Output Field Names #################
mcFieldNames = ["XCoord", "YCoord", "ZCoord"]

class MeanCenter(object):
    """This tool identifies the geographic center (or the center of
    concentration) for a set of features. 

    INPUTS: 
    inputFC (str): path to the input feature class
    outputFC {str, None}: path to the output feature class
    weightField {str, None}: name of weight field
    caseField {str, None} name of case field
    dimField {str, None}: name of numeric field to average

    ATTRIBUTES:
    meanCenter (dict): [case field value] = mean center (1)
    dimCenter  (dict): [case field value] = dim field center (1)
    badCases (list): list of cases that were unsuccessful.
    ssdo (class): instance of SSDataObject
    uniqueCases (array): sorted list of all cases for print/output

    METHODS:
    createOutput: creates a feature class with mean centers
    report: reports results as a printed message or to a file

    NOTES:
    (1)  The key for the mean center dicts is "ALL" if no case field is
         provided
    """

    def __init__ (self, ssdo, weightField = None, caseField = None, 
                  dimField = None):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Set Data ####
        self.xyCoords = self.ssdo.xyCoords
        self.zCoords = self.ssdo.zCoords
        changeElevation = self.ssdo.defaultZ != 0.0
        self.isGCS = self.ssdo.spatialRefType.upper() == "GEOGRAPHIC"

        zSupported = False
        if self.ssdo.info.shapeType.upper() in ['MULTIPOINT','POINT']:
            zSupported = True

        if self.ssdo.hasZ and zSupported :
                evalDim = 3
        else:
            if changeElevation:
                evalDim = 3
            else:
                evalDim = 2

        self.evalDim = evalDim

        #### Verify Weights ####
        if weightField:
            self.weights = self.ssdo.fields[weightField].returnDouble()

            #### Report Negative Weights ####
            lessThanZero = NUM.where(self.weights < 0.0)
            if len(lessThanZero[0]):
                self.weights[lessThanZero] = 0.0
                ARCPY.AddIDMessage("Warning", 941)

            #### Verify Weight Sum ####
            self.weightSum = self.weights.sum()
            if not self.weightSum > 0.0:
                msg = {}
                msg["messageCode"] = u"AO_{}".format(898)
                msg["message"] = ARCPY.GetIDMessage(898)
                ARCPY.AddError(JSON.dumps(msg))
                raise SystemExit()
        else:
            self.weights = NUM.ones((self.ssdo.numObs, 1))

        #### Set Case Field ####
        if caseField:
            caseType = ssdo.allFields[caseField].type.upper()
            self.caseIsString = caseType == "STRING"
            self.caseVals = self.ssdo.fields[caseField].data
            cases = NUM.unique(self.caseVals)
            if self.caseIsString:
                if cases.dtype.char == 'S':
                    self.uniqueCases = cases[NUM.where(cases != b'')]
                else:
                    self.uniqueCases = cases[NUM.where(cases != '')]
            else:
                self.uniqueCases = cases
        else:
            self.caseIsString = False
            self.caseVals = NUM.ones((self.ssdo.numObs, ), int)
            self.uniqueCases = [1]

        #### Set Result Dict ####
        meanCenter = COLL.defaultdict(NUM.array)
        if dimField:
            dimCenter = COLL.defaultdict(float)
            self.dimVals = self.ssdo.fields[dimField].returnDouble()
        else:
            dimCenter = None

        #### Keep Track of Bad Cases ####
        badCases = []
        badCaseInd = []

        #### Calculate Results ####
        for ind, case in enumerate(self.uniqueCases):
            indices = NUM.where(self.caseVals == case)
            numFeatures = len(indices[0])
            xy = self.xyCoords[indices]
            w = self.weights[indices]
            w.shape = numFeatures, 1
            weightSum = w.sum()
            meanAz = 0
            if self.isGCS:
                meanAz = UTILS.meanCenterAngular(xy.T[0])
                xTemp = xy.T[0] - meanAz
                xy.T[0] = UTILS.normalize(xTemp)

            if (weightSum != 0.0) and (numFeatures > 0):
                xyWeighted = w * xy

                #### Mean Center ####
                centers = xyWeighted.sum(0) / weightSum
                meanX, meanY = centers
                meanZ = None
                if ssdo.hasZ:
                    z = self.ssdo.zCoords[indices]
                    try:
                        zWeighted = w.ravel() * z
                        meanZ = zWeighted.sum() / weightSum
                    except:
                        meanZ = 0.0
                else:
                    meanZ = self.ssdo.defaultZ

                #### Use Angular Mean  in GCS ###
                if self.isGCS:
                    meanX += meanAz
                    meanX = UTILS.getAzmth(meanX)
                    meanX = UTILS.normalize(meanX)

                meanCenter[case] = NUM.array([meanX, meanY, meanZ])

                #### Attribute Field ####
                if dimField:
                    dimWeighted = w.flatten() * self.dimVals[indices]
                    meanDim = dimWeighted.sum() / weightSum
                    dimCenter[case] = meanDim

            else:
                badCases.append(case)
                badCaseInd.append(ind)

        #### Report Bad Cases ####
        nCases = len(self.uniqueCases)
        nBadCases = len(badCases) 
        badCases.sort()
        if nBadCases:
            self.uniqueCases = NUM.delete(self.uniqueCases, badCaseInd)
            cBool = self.caseIsString
            if not self.caseIsString:
                badCases = [UTILS.caseValue2Print(i, cBool) for i in badCases]
            ERROR.reportBadCases(nCases, nBadCases, badCases, 
                                 label = caseField)   

        #### Set Attributes ####
        self.meanCenter = meanCenter
        self.dimCenter = dimCenter
        self.badCases = badCases
        self.caseField = caseField
        self.dimField = dimField
        self.weightField = weightField

    def report(self, fileName = None):
        """Reports the Mean Center results as a message or to a file.

        INPUTS:
        fileName {str, None}: path to a text file to populate with results
        """

        header = ARCPY.GetIDMessage(84196)
        columns = [ARCPY.GetIDMessage(84191), ARCPY.GetIDMessage(84192), 
                   ARCPY.GetIDMessage(84193)]
        if self.ssdo.hasZ:
            columns.append(ARCPY.GetIDMessage(84197))
        if self.dimField:
            columns.append(ARCPY.GetIDMessage(84198).format(self.dimField))
        results = [ columns ]
        for case in self.uniqueCases:
            if not self.caseField:
                strCase = "ALL"
            else:
                strCase = UTILS.caseValue2Print(case, self.caseIsString)
            meanX, meanY, meanZ = self.meanCenter[case]
            rowResult = [ strCase, LOCALE.format_string("%0.6f", meanX),
                          LOCALE.format_string("%0.6f", meanY) ]
            if self.ssdo.hasZ:
                rowResult.append(LOCALE.format_string("%0.6f", meanZ))
            if self.dimField:
                meanDim = self.dimCenter[case]
                rowResult.append(LOCALE.format_string("%0.6f", meanDim))
            results.append(rowResult)

        outputTable = UTILS.outputTextTable(results, header = header)
        if fileName:
            f = UTILS.openFile(fileName, "w")
            UTILS.writeText(f, outputTable)
            f.close()
        else:
            ARCPY.AddMessage(outputTable)

    def createOutput(self, outputFC, parameters = None):
        """Creates an Output Feature Class with the Mean Centers.

        INPUTS:
        outputFC (str): path to the output feature class
        """

        #### Validate Output Workspace ####
        ERROR.checkOutputPath(outputFC)

        #### Shorthand Attributes ####
        ssdo = self.ssdo
        caseField = self.caseField
        dimField = self.dimField

        #### Create Output Feature Class ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84003))
        outPath, outName = OS.path.split(outputFC)

        try:
            DM.CreateFeatureclass(outPath, outName, "POINT", "", ssdo.mFlag, 
                                  ssdo.zFlag, ssdo.spatialRefString)
        except:
            ARCPY.AddIDMessage("ERROR", 210, outputFC)
            raise SystemExit()

        #### Add Field Names ####
        fn = UTILS.getFieldNames(mcFieldNames, outPath)
        xFieldName, yFieldName, zFieldName = fn
        shapeFieldNames = ["SHAPE@"]
        dataFieldNames = [xFieldName, yFieldName]
        if ssdo.zBool:
            dataFieldNames.append(zFieldName)

        for fieldName in dataFieldNames:
            UTILS.addEmptyField(outputFC, fieldName, "DOUBLE")

        if caseField:
            fcCaseField = ssdo.allFields[caseField]
            validCaseName = UTILS.validQFieldName(fcCaseField, outPath)
            caseType = UTILS.convertType[fcCaseField.type]
            UTILS.addEmptyField(outputFC, validCaseName, caseType)
            dataFieldNames.append(validCaseName)

        if dimField:
            fcDimField = ssdo.allFields[dimField]
            validDimName = UTILS.validQFieldName(fcDimField, outPath)
            if caseField:
                if validCaseName == validDimName:
                    validDimName = ARCPY.GetIDMessage(84199)
            UTILS.addEmptyField(outputFC, validDimName, "DOUBLE") 
            dataFieldNames.append(validDimName)

        #### Write Output ####
        allFieldNames = shapeFieldNames + dataFieldNames
        rows = DA.InsertCursor(outputFC, allFieldNames)
        for ind, case in enumerate(self.uniqueCases):

            #### Mean Centers ####
            meanX, meanY, meanZ = self.meanCenter[case]
            pnt = (meanX, meanY, meanZ)
            if ssdo.zBool:
                rowResult = [pnt, UTILS.normXGCS(meanX, self.isGCS), meanY, meanZ]
            else:
                rowResult = [pnt, UTILS.normXGCS(meanX, self.isGCS), meanY]
            
            #### Set Attribute Fields ####
            if caseField:
                caseValue = self.uniqueCases.item(ind)
                rowResult.append(caseValue)

            if dimField:
                meanDim = self.dimCenter[case]
                rowResult.append(meanDim)

            rows.insertRow(rowResult)
        
        #### Clean Up ####
        del rows

        #### Set Attribute ####
        self.outputFC = outputFC

        #### Set the Default Symbology ####
        if parameters is None:
            params = ARCPY.gp.GetParameterInfo()
        else:
            params = parameters

        #### Install Path to Layer Files ####
        fullRLF =  UTILS.pathLayers

        try:
            isPRO = UTILS.isPRO()
            if isPRO:
                if self.evalDim == 3:
                    renderLayerFile = 'MeanCenter_3D.lyrx'
                else:
                    renderLayerFile = 'MeanCenter.lyrx'
            else:
                if self.evalDim == 3:
                    renderLayerFile = 'MeanCenter_3D.lyr'
                else:
                    renderLayerFile = 'MeanCenter.lyr'
            fullRLF = OS.path.join(fullRLF, renderLayerFile)
            params[1].symbology = fullRLF
        except:
            ARCPY.AddIDMessage("WARNING", 973)

