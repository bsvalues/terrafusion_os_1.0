# coding: utf-8
"""
Tool Name:  Median Center
Source Name: MedianCenter.py
Version: ArcGIS 10.1
Author: ESRI

This tool identifies the median center (minimizes the Euclidean Distance) 
for a set of features.  This median center is a point
constructed from X and Y values for all feature centroids in a dataset.
Features may optionally be grouped, if a CASE field is provided.  When
a weight field is specified, the result is weigted mean centers.

Algorithm Citation:  Adapted from Burt and Barber (1996) 
                     ``Elementary Statistics for Geographers''
                     The Guilford Press, New York, NY

Algorithm Notes:  A re-weighting iterative procedure. While it is a bit
slower than the methods based on the gradient (more iterations, however
each iteration is quicker), it is robust to candidate locations that
coincide with the features being analyzed.  
"""

################### Imports ########################
import os as OS
import sys as SYS
import datetime as DT
import collections as COLL
import numpy as NUM
import arcgisscripting as ARC
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.da as DA
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import WeightsUtilities as WU
import Stats as STATS
import locale as LOCALE
import logging
from loggerutils import init_ss_logger

LOGGER = init_ss_logger(__name__, logging.DEBUG)
LOCALE.setlocale(LOCALE.LC_ALL, '')

################ Output Field Names #################
mdcFieldNames = ["XCoord", "YCoord"]
mdcFieldNames3D = ["XCoord", "YCoord", "ZCoord"]

def execute(parameters, messages):
    inputFC = UTILS.getTextParameter(0, parameters)
    outputFC = UTILS.getTextParameter(1, parameters)
    weightField = UTILS.getTextParameter(2, parameters, fieldName = True)
    caseField = UTILS.getTextParameter(3, parameters, fieldName = True)        
    attFields = UTILS.getTextParameter(4, parameters, fieldName = True)   

    fieldList = []
    if weightField:
        fieldList.append(weightField)
    if caseField:
        fieldList.append(caseField)
    if attFields:
        attFields = attFields.split(";")
        fieldList = fieldList + attFields

    #### Populate SSDO with Data ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC,
                                useChordal = False)

    #### Populate SSDO with Data ####
    ssdo.obtainData(ssdo.oidName, fieldList, minNumObs = 1,
                    requireGeometry = ssdo.complexFeature) 
    
    #### Run Analysis ####
    mc = MedianCenter(ssdo, weightField = weightField,
                      caseField = caseField, attFields = attFields)

    #### Create Output ####
    mc.createOutput(outputFC, parameters)

class MedianCenter(object):
    """This tool identifies the weighted median center (minimizes the 
    Euclidean distance) for a set of features. 

    INPUTS: 
    ssdo (obj): instance of SSDataObject
    weightField {str, None}: name of weight field
    caseField {str, None} name of case field
    attFields {list, []}: numeric field(s) for optional weigthed median

    ATTRIBUTES:
    medianCenter (dict): [case field value] = median center (1)
    attCenter  (dict): [case field value] = att field center(s) (1)
    badCases (list): list of cases that were unsuccessful.
    ssdo (class): instance of SSDataObject
    uniqueCases (array): sorted list of all cases for print/output

    METHODS:
    createOutput: creates a feature class with standard distances.
    report: creates and prints the output in tabular text format.

    NOTES:
    (1)  The key for the mean center dicts is "ALL" if no case field is
         provided
    """

    def __init__ (self, ssdo, weightField=None, caseField=None, 
                  attFields=None, fromAGOL=False):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Set from AGOL flag ####
        self.FLAG_AGOL = fromAGOL

        #### Set Data ####
        self.xyCoords = self.ssdo.xyCoords
        self.zCoords= self.ssdo.zCoords
        changeElevation = self.ssdo.defaultZ != 0.0
        self.isGCS = self.ssdo.spatialRefType.upper() == "GEOGRAPHIC"

        zSupported = False
        if self.ssdo.info.shapeType.upper() in ['MULTIPOINT','POINT']:
            zSupported = True

        if self.ssdo.hasZ and zSupported :
                evalDim = 3
                zData = self.zCoords
        else:
            if changeElevation:
                evalDim = 3
                zData = NUM.ones((self.ssdo.numObs,)) *  self.ssdo.defaultZ
            else:
                evalDim = 2
                zData = NUM.zeros((self.ssdo.numObs,))
        
        #### Use 3D in PRO ####
        self.isPRO = UTILS.isPRO()
        if not self.isPRO:
            evalDim = 2
            zData = NUM.zeros((self.ssdo.numObs,))            

        #### Verify Weights ####
        if weightField:
            self.weights = self.ssdo.fields[weightField].returnDouble()

            #### Report Negative Weights ####
            lessThanZero = NUM.where(self.weights < 0.0)
            if len(lessThanZero[0]):
                self.weights[lessThanZero] = 0.0
                LOGGER.warning(941, extra={"message_ID": 941})

            #### Verify Weight Sum ####
            self.weightSum = self.weights.sum()
            if not self.weightSum > 0.0:
                LOGGER.error(898, extra={"message_ID": 898})
                raise SystemExit()
        else:
            self.weights = NUM.ones((self.ssdo.numObs,))

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
        medianCenter = COLL.defaultdict(NUM.array)

        if attFields:
            attCenter = COLL.defaultdict(NUM.array)

        #### Keep Track of Bad Cases ####
        badCases = []
        badCaseInd = []

        #### Angular mean ####
        self.gcsAngmean={}

        #### Calculate Results  ####
        for ind, case in enumerate(self.uniqueCases):
            indices = NUM.where(self.caseVals == case)
            numFeatures = len(indices[0])
            xy = self.xyCoords[indices]
            w = self.weights[indices]
            weightSum = w.sum()
            meanAz = 0
            if self.isGCS:
                meanAz = UTILS.meanCenterAngular(xy.T[0])
                xTemp = xy.T[0] - meanAz
                xy.T[0] = UTILS.normalize(xTemp)

            if (weightSum != 0.0) and (numFeatures > 0):
                xyz = NUM.zeros((xy.shape[0], xy.shape[1]+1), dtype= NUM.float64)
                xyz[:,:-1] = xy
                xyz[:,2] = zData[indices]
                coor, counts = NUM.unique(xyz, axis = 0, return_counts = True)

                if len(counts) > 1:
                    #### Calculate Median Center ####
                    medX, medY, medZ, iters = calcMedianCenter(xyz, w)
                else:
                    coor = coor[0]
                    medX = coor[0]
                    medY = coor[1]
                    medZ = coor[2]

                #### Use Angular Mean  in GCS ###
                if self.isGCS:
                    medX += meanAz
                    medX = UTILS.getAzmth(medX)

                #### Get Median Center ####
                medianCenter[case] = (medX, medY, medZ)

                if attFields:
                    attMeds = []
                    for attField in attFields:
                        attCaseVals = ssdo.fields[attField].returnDouble()
                        attCaseVals = attCaseVals[indices] 
                        attMed = STATS.median(attCaseVals, weights = w)
                        attMeds.append(attMed)
                    attMeds = NUM.array(attMeds)
                    attCenter[case] = attMeds
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
        self.medianCenter = medianCenter
        self.badCases = badCases
        self.caseField = caseField
        self.attFields = attFields
        self.weightField = weightField
        self.changeElevation  = changeElevation
        self.evalDim = evalDim
        if attFields:
            self.attCenter = attCenter

    def report(self, fileName = None):
        """Reports the Median Center results as a message or to a file.

        INPUTS:
        fileName {str, None}: path to a text file to populate with results
        """

        header = ARCPY.GetIDMessage(84190)
        columns = [ARCPY.GetIDMessage(84191), ARCPY.GetIDMessage(84192), 
                   ARCPY.GetIDMessage(84193)]
        if self.attFields:
            for attField in self.attFields:
                columns.append(ARCPY.GetIDMessage(84194).format(attField))
        results = [ columns ]
        for case in self.uniqueCases:
            if not self.caseField:
                strCase = "ALL"
            else:
                strCase = UTILS.caseValue2Print(case, self.caseIsString)
            
            medX, medY, medZ = self.medianCenter[case]

            if self.evalDim == 2:
                rowResult = [ strCase, LOCALE.format_string("%0.6f", medX),
                              LOCALE.format_string("%0.6f", medY) ]
            else:
                rowResult = [ strCase, LOCALE.format_string("%0.6f", medX),
                              LOCALE.format_string("%0.6f", medY),
                              LOCALE.format_string("%0.6f", medZ)]
            if self.attFields:
                for attInd, attField in enumerate(self.attFields):
                    medAtt = self.attCenter[case][attInd]
                    rowResult.append(LOCALE.format_string("%0.6f", medAtt))
            results.append(rowResult)

        outputTable = UTILS.outputTextTable(results, header = header)
        if fileName:
            f = open(fileName, "w")
            UTILS.writeText(f, outputTable)
            f.close()
        else:
            LOGGER.debug(outputTable)

    def createOutput(self, outputFC, parameters = None):
        """Creates an Output Feature Class with the Median Centers.

        INPUTS:
        outputFC (str): path to the output feature class
        """

        #### Validate Output Workspace ####
        ERROR.checkOutputPath(outputFC)

        #### Shorthand Attributes ####
        ssdo = self.ssdo
        caseField = self.caseField
        attFields = self.attFields


        #### Create Output Feature Class ####
        outPath, outName = OS.path.split(outputFC)

        zFlag = ssdo.zFlag
        if self.changeElevation:
            zFlag = 'ENABLED'

        ssdo.newFieldTypeChecker.createFeatureClass(outputFC, "POINT", ssdo.mFlag, 
                                                    zFlag, ssdo.spatialRefString)

        #### Add Field Names ####
        if self.evalDim == 2 or self.FLAG_AGOL:
            dataFieldNames = UTILS.getFieldNames(mdcFieldNames, outPath)
        else:
            dataFieldNames = UTILS.getFieldNames(mdcFieldNames3D, outPath)

        shapeFieldNames = ["SHAPE@"]
        for fieldName in dataFieldNames:
            UTILS.addEmptyField(outputFC, fieldName, "DOUBLE")

        if caseField:
            fcCaseField = ssdo.allFields[caseField]
            validCaseName = UTILS.validQFieldName(fcCaseField, outPath)
            caseType = UTILS.convertType[fcCaseField.type]

            if caseType == "TEXT" and fcCaseField.length > 255:
                UTILS.addEmptyField(outputFC, validCaseName, caseType, length = fcCaseField.length)
            else:
                UTILS.addEmptyField(outputFC, validCaseName, caseType)

            dataFieldNames.append(validCaseName)
            if UTILS.migrateDatePrecisionField(fcCaseField, ssdo.newFieldTypeChecker.outFlags):
                DM.MigrateDateFieldToHighPrecision(outputFC, date_fields = validCaseName)

        if attFields:
            for attField in attFields:
                fcAttField = ssdo.allFields[attField]
                validAttName = UTILS.validQFieldName(fcAttField, outPath)
                if caseField:
                    if validCaseName == validAttName:
                        validAttName = ARCPY.GetIDMessage(84195)
                UTILS.addEmptyField(outputFC, validAttName, "DOUBLE") 
                dataFieldNames.append(validAttName)

        outShapeFileBool = UTILS.isShapeFile(outputFC)
            
        #### Add Median X, Y, Z, Dim ####
        allFieldNames = shapeFieldNames + dataFieldNames
        rows = DA.InsertCursor(outputFC, allFieldNames)
        for ind, case in enumerate(self.uniqueCases):

            #### Median Centers ####
            medX, medY, medZ = self.medianCenter[case]
            medX = UTILS.normXGCS(medX, self.isGCS)
            if self.evalDim == 2 or self.FLAG_AGOL:
                pnt = (medX, medY, ssdo.defaultZ)
                rowResult = [pnt, medX, medY]
            else:
                pnt = (medX, medY, medZ)
                rowResult = [pnt, medX, medY, medZ]
          
            #### Set Attribute Fields ####
            if caseField:
                caseValue = self.uniqueCases.item(ind)
                rowResult.append(caseValue)

            #### Set Attribute Fields ####
            if attFields:
                for attInd, attField in enumerate(self.attFields):
                    medAtt = self.attCenter[case][attInd]
                    rowResult.append(medAtt)
            try:
                rows.insertRow(rowResult)
            except:
                break
        
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
            if self.isPRO:
                if self.evalDim == 3:
                    renderLayerFile = 'MedianCenter_3D.lyrx'
                else:
                    renderLayerFile = 'MedianCenter.lyrx'
            else:
                if self.evalDim == 3:
                    renderLayerFile = 'MedianCenter_3D.lyr'
                else:
                    renderLayerFile = 'MedianCenter.lyr'

            fullRLF = OS.path.join(fullRLF, renderLayerFile)
            params[1].symbology = fullRLF
        except:
            LOGGER.warning(973, extra={"message_ID": 973})

def calcMedianCenter(coords, weights):
    """Calculates the weighted median center (minimizes the Euclidean
    distance) for a set of xyz-coordinates. (1, A)

    INPUTS:
    coords (array, nx3): x,y,z coordinates in numpy array
    weights (array, n): weights for coordinates

    OUTPUT:
    estimateX, estimateY, estimateZ, c (list): [median X, median Y,  median Z, iterations]

    NOTES:
    (1) A re-weighting iterative procedure. While it is a bit
        slower than the methods based on the gradient (more iterations, 
        however each iteration is quicker), it is robust to candidate 
        locations that coincide with the features being analyzed.  

    REFERENCES:  
    (A) Adapted from Burt and Barber (1996) 
        ``Elementary Statistics for Geographers''
        The Guilford Press, New York, NY
    """
    
    #### Assess Shape and Return if Single Feature or Coincident Points ####
    n, k = NUM.shape(coords)
    coordVariance = coords.var(0)
    if n == 1 or not coordVariance.any():
        estimateX, estimateY, estimateZ = coords[0]
        return estimateX, estimateY, estimateZ, 1
    else:
        return ARC._ss.median_center(coords, weights)

