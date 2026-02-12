# coding: utf-8
"""
Tool Name:  Linear Directional Trend 
Source Name: DirectionalMean.py
Version: ArcGIS 10.1
Author: ESRI

This tool identifies the general (mean) direction for a set of vectors.
"""

################### Imports ########################
import os as OS
import sys as SYS
import numpy as NUM
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.da as DA
import scipy.stats as SCPYSTAT
import ErrorUtils as ERROR
import SSDataObject as SSDO
import SSUtilities as UTILS
import locale as LOCALE
LOCALE.setlocale(LOCALE.LC_ALL, '')

################ Output Field Names #################
lmFieldNames = ["CompassA", "DirMean", "CirVar", "AveX", "AveY", "AveLen","TestStat","RefValue","PValue"]
lmFieldNames3D =  ["CompassA", "DirMean", "DirMeanZ", "SphVar", "AveX", "AveY", "AveZ", "AveLen3D", "TestStat", "RefValue", "PValue"]
uniformField  = "UnifTest"
testResponse = ["No uniform", "Uniform"]
numberOfCasesForRayleighTest2D = 4
numberOfCasesForRayleighTest3D = 8

def execute(parameters, messages):
    inputFC = UTILS.getTextParameter(0, parameters)
    outputFC = UTILS.getTextParameter(1, parameters)
    orientationOnly = parameters[2].value
    caseField = UTILS.getTextParameter(3, parameters, fieldName = True)
    dm = DirectionalMean(inputFC, outputFC = outputFC, caseField = caseField, 
                         orientationOnly = orientationOnly)
    dm.createOutput(outputFC, parameters)

class DirectionalMean(object):
    """This tool identifies the general (mean) direction for a set of vectors.

    INPUTS: 
    inputFC (str): path to the input feature class
    outputFC {str, None}: path to the output feature class
    caseField {str, None}: field name used to subset mean centers
    orientationOnly {bool, False}: Should direction be used in calculation?  
                    
    METHODS:
    createOutput: creates a feature class with linear means.
    report: reports results as a printed message or to a file.

    ATTRIBUTES:
    meanCenter (dict): [case field value] = mean center (1)
    dm (dict): [case field value] = directional mean (1)
    badCases (list): list of cases that were unsuccessful.
    ssdo (class): instance of SSDataObject
    caseKeys (list): sorted list of all cases for print/output

    NOTES:
    (1)  The keys for the mean center (meanCenter) and directional mean (dm)
         dicts are equal to "ALL" if no case field is provided
    """

    def __init__(self, inputFC, outputFC = None, caseField = None, 
                 orientationOnly = False):

        #### Create SSDataObject ####
        ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC,
                                 useChordal = False)
        ssdo.newFieldTypeChecker.checkOID64(silent = False)

        self.projDomainChanged = False
        self.initialDomain = None

        cnt = UTILS.getCount(inputFC)
        ERROR.errorNumberOfObs(cnt, minNumObs = 1)
        fieldList = [ssdo.oidName, "SHAPE@"]
        caseIsString = False
        self.caseDict = {}
        if caseField:
            fieldList.append(caseField)
            caseType = ssdo.allFields[caseField].type.upper()
            caseIsString = caseType == "STRING"

            #### Check Case Field for Big Integer ####
            ssdo.newFieldTypeChecker.checkFields(fields = [caseField.upper()], silent = False)

        #Define dimension
        if (ssdo.hasZ):
            evalDim = 3
        else:
            evalDim = 2

        self.evalDim = evalDim

        lowCasesForTest = []
        doublingCases = []

        if (evalDim == 2):
            #### Initialize Accounting Structures ####

            xyLenVals = {}
            sinCosVals = {}
            sinCosVals2 = {}
            
            #### Open Search Cursor ####
            try:
                rows = DA.SearchCursor(inputFC, fieldList, "", 
                                       ssdo.spatialRefString)
            except:
                ARCPY.AddIDMessage("ERROR", 204)
                raise SystemExit()

            #### Keep track of Invalid Fields ####
            badIDs = []
            badLengths = []
            badRecord = False
            negativeWeights = False

            #### Create Progressor ####
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84001), 0, cnt, 1)

            for row in rows:
                OID = row[0]
                shapeInfo = row[1]
                badRow = row.count(None) 
                try:
                    centroidInfo = shapeInfo.trueCentroid
                    xVal = centroidInfo.X
                    yVal = centroidInfo.Y
                    length = float(shapeInfo.length)
                    firstPoint = shapeInfo.firstPoint
                    lastPoint = shapeInfo.lastPoint
                    if firstPoint.contains(lastPoint):
                        badLengths.append(OID)
                        badRow = True
                    else:
                        firstX = float(firstPoint.X)
                        firstY = float(firstPoint.Y)
                        lastX = float(lastPoint.X)
                        lastY = float(lastPoint.Y)
                except:
                    badRow = True

                #### Process Good Records ####
                if not badRow:
                    #### Case Field ####
                    caseVal = "ALL"
                    if caseField:
                        caseVal = UTILS.caseValue2Print(row[2], caseIsString)
                        self.caseDict[caseVal] = row[2]

                    #### Get Angle ####
                    numer = lastX - firstX
                    denom = lastY - firstY
                    angle = UTILS.getAngle(numer, denom) 
                    
                    #### diametrical Bimodal Correction ####
                    angle2Degree2 = UTILS.convert2Degree(angle)
                    if angle2Degree2 < 180:
                        numer2 = firstX - lastX
                        denom2 = firstY - lastY
                        angle2 = UTILS.getAngle(numer2, denom2) 
                        sinVal2 = NUM.sin(angle2)
                        cosVal2 = NUM.cos(angle2)
                    else:
                        sinVal2 = NUM.sin(angle)
                        cosVal2 = NUM.cos(angle)

                    #### Adjust for Orientation Only ####
                    if orientationOnly:
                        angle2Degree = UTILS.convert2Degree(angle)
                        if angle2Degree < 180:
                            numer = firstX - lastX
                            denom = firstY - lastY
                            angle = UTILS.getAngle(numer, denom) 

                    sinVal = NUM.sin(angle)
                    cosVal = NUM.cos(angle)
                
                    xyLenVal = (xVal, yVal, length)
                    sinCosVal = (sinVal, cosVal)
                    sinCosVal2 = (sinVal2, cosVal2)
                    try:
                        xyLenVals[caseVal].append(xyLenVal)
                        sinCosVals[caseVal].append(sinCosVal)
                        sinCosVals2[caseVal].append(sinCosVal2)
                    except:
                        xyLenVals[caseVal] = [ xyLenVal ]
                        sinCosVals[caseVal] = [ sinCosVal ]
                        sinCosVals2[caseVal] = [ sinCosVal2 ]

                else:
                    #### Bad Record ####
                    badRecord = True
                    badIDs.append(OID)

                ARCPY.SetProgressorPosition()

            del rows

            self.messageBadRecords(ssdo, cnt, badRecord, badIDs, badLengths)

            #### Set up for Bad Cases ####
            badCases = []
            cases = UTILS.iterkeys(xyLenVals)
            meanCenter = {}
            dm = {}
            
            #### Calculate Mean Center and Standard Distance ####
            for case in cases:
                xyLens = xyLenVals[case]
                numFeatures = len(xyLens)
                if numFeatures > 0:
                    #### Mean Centers and Lengths ####
                    xyLens = NUM.array(xyLens)
                    meanX, meanY, meanL = NUM.mean(xyLens, 0)

                    #### Sum Sin and Cos ####
                    scVals = NUM.array(sinCosVals[case])
                    sumSin, sumCos = NUM.sum(scVals, 0)
                    sinMean = sumSin / numFeatures
                    cosMean = sumCos / numFeatures


                    #### Calculate Angle ####
                    radianAngle = UTILS.getAngle(sumSin, sumCos)
                    degreeAngle = UTILS.convert2Degree(radianAngle)

                    #### Diametrically bimodal correction ####
                    if (NUM.isclose([sumSin],[0.0])[0] and 
                        NUM.isclose([sumCos],[0.0])[0]):
                        scVals2 = NUM.array(sinCosVals2[case])
                        sumSin, sumCos = NUM.sum(scVals2, 0)
                        radianAngle = UTILS.getAngle(sumSin, sumCos)
                        degreeAngle = UTILS.convert2Degree(radianAngle)

                        #### Re-adjust Angle ####
                        if degreeAngle >= 180.0:
                            degreeAngle = degreeAngle - 180.0
                        else:
                            degreeAngle = degreeAngle + 180.0
                        radianAngle = UTILS.convert2Radians(degreeAngle)
                        doublingCases.append(case)
                    
                   

                    #### Get Start and End Points ####
                    halfMeanLen = meanL / 2.0
                    endX = (halfMeanLen * NUM.sin(radianAngle)) + meanX
                    startX = (2.0 * meanX) - endX
                    endY = (halfMeanLen * NUM.cos(radianAngle)) + meanY
                    startY = (2.0 * meanY) - endY
                    unstandardized = NUM.sqrt(sumSin**2.0 + sumCos**2.0)
                    circVar = 1.0 - (unstandardized / (numFeatures * 1.0))

                    disperR = NUM.sqrt(sinMean**2.0 + cosMean**2.0)

                    #### Re-adjust Angle Back towards North ####
                    if orientationOnly:
                        degreeAngle = degreeAngle - 180.0
                        radianAngle = UTILS.convert2Radians(degreeAngle)

                    #### Reference Critical Value Significance leve 95% ####
                    chi2RefPvalue = SCPYSTAT.chi2.ppf(0.95, 2)

                    #### Raleigh Value ####
                    rayleighZvalue = 2.0 * numFeatures * disperR**2
                    
                    #### Mardia and Jupp, 2000  Correction Rayleigh  ##### 
                    correctionRayleigh = (((1 - (1 / (2 * numFeatures))) * 2.0 * numFeatures * disperR**2)
                                         + ((numFeatures * disperR**4) / 2.0))
                   
                    ### Significance Level of Current Rayleigh value ####
                    pValue = 1.0 - SCPYSTAT.chi2.cdf(rayleighZvalue, 2)

                    #### HO  reject if rayleighZvalue/correctionRayleif > chi2RefPvalue ####
                    if (correctionRayleigh > chi2RefPvalue):
                        uniform =  testResponse[0]

                    else:
                        uniform =  testResponse[1]

                    #### Populate Results Structure ####
                    meanCenter[case] = (meanX, meanY)
                    dm[case] = [ (startX, startY), (endX, endY), meanL, 
                                  radianAngle, degreeAngle, circVar,
                                  correctionRayleigh, chi2RefPvalue, pValue, uniform] 

                    #### Check Minimum Number of Features for Calculating Rayleigh test ####
                    if numFeatures < numberOfCasesForRayleighTest2D :
                        lowCasesForTest.append(case)

        else:

            if not ssdo.distanceInfo.xyzUnitsEqual:
                            ARCPY.AddIDMessage("ERROR", 110083)
                            raise SystemExit()

            ##### 3D Initialize Accounting Structures ####
            xyzLenVals = {}
            sinCosCosVals = {}
            sinCosCosVals2 = {}
            #### Open Search Cursor ####
            try:
                rows = DA.SearchCursor(inputFC, fieldList, "", 
                                       ssdo.spatialRefString)
            except:
                ARCPY.AddIDMessage("ERROR", 204)
                raise SystemExit()

            #### Keep track of Invalid Fields ####
            badIDs = []
            badLengths = []
            badRecord = False
            negativeWeights = False

            #### Create Progressor ####
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84001), 0, cnt, 1)

            for row in rows:
                OID = row[0]
                shapeInfo = row[1]
                badRow = row.count(None) 
                try:
                    firstPoint = shapeInfo.firstPoint
                    lastPoint = shapeInfo.lastPoint
                    if firstPoint.contains(lastPoint):
                        badLengths.append(OID)
                        badRow = True
                    else:
                        firstX = float(firstPoint.X)
                        firstY = float(firstPoint.Y)
                        firstZ = float(firstPoint.Z)
                        lastX = float(lastPoint.X)
                        lastY = float(lastPoint.Y)
                        lastZ = float(lastPoint.Z)

                    if not badRow and not shapeInfo.trueCentroid:
                        if firstX == lastX and firstY== lastY:
                            xVal = firstX
                            yVal = firstY
                            zVal = (lastZ + firstZ) / 2.0
                            length = abs (lastZ -firstZ)
                    else:
                        centroidInfo = shapeInfo.trueCentroid
                        xVal = centroidInfo.X
                        yVal = centroidInfo.Y
                        zVal = shapeInfo.centroid.Z
                        length = float(shapeInfo.length3D)
                        firstPoint = shapeInfo.firstPoint
                        lastPoint = shapeInfo.lastPoint

                except:
                    badRow = True

                #### Process Good Records ####
                if not badRow:
                    #### Case Field ####
                    caseVal = "ALL"
                    if caseField:
                        caseVal = UTILS.caseValue2Print(row[2], caseIsString)
                        self.caseDict[caseVal] = row[2]

                    #### Get Angle ####
                    numer = lastX - firstX
                    denom = lastY - firstY
                    dZ = lastZ - firstZ
                    azimuth, angleZ, h = UTILS.getSphericalCoord(numer, denom, dZ)
                    
                    ### Apply correction for diametrical Bimodal Behaviour ####
                    azimuth2Degree = azimuth
                    if azimuth2Degree < 180:
                        numer2 = firstX - lastX
                        denom2 = firstY - lastY
                        dZ2    = firstZ - lastZ
                        azimuth2, angleZ2, h2 = UTILS.getSphericalCoord(numer2, denom2, dZ2)
                        sinVal2 = NUM.sin(UTILS.convert2Radians(azimuth2)) * NUM.sin(UTILS.convert2Radians(angleZ))
                        cosVal2 = NUM.cos(UTILS.convert2Radians(azimuth2)) * NUM.sin(UTILS.convert2Radians(angleZ))
                        cosZval2 = NUM.cos(UTILS.convert2Radians(angleZ2))
                    else:
                        sinVal2 = NUM.sin(UTILS.convert2Radians(azimuth)) * NUM.sin(UTILS.convert2Radians(angleZ))
                        cosVal2 = NUM.cos(UTILS.convert2Radians(azimuth)) * NUM.sin(UTILS.convert2Radians(angleZ))
                        cosZval2 = NUM.cos(UTILS.convert2Radians(angleZ))

                    #### Adjust for Orientation Only ####
                    if orientationOnly:
                        azimuth2Degree = azimuth
                        if azimuth2Degree < 180:
                            numer = firstX - lastX
                            denom = firstY - lastY
                            dZ    = firstZ - lastZ
                            azimuth, angleZ, h = UTILS.getSphericalCoord(numer, denom, dZ) 

                    sinVal = NUM.sin(UTILS.convert2Radians(azimuth)) * NUM.sin(UTILS.convert2Radians(angleZ))
                    cosVal = NUM.cos(UTILS.convert2Radians(azimuth)) * NUM.sin(UTILS.convert2Radians(angleZ))
                    cosZval = NUM.cos(UTILS.convert2Radians(angleZ))
                
                    xyzLenVal = (xVal, yVal, zVal, length)
                    sinCosCosVal = (sinVal, cosVal, cosZval)
                    sinCosCosVal2 = (sinVal2, cosVal2, cosZval2)

                    try:
                        xyzLenVals[caseVal].append(xyzLenVal)
                        sinCosCosVals[caseVal].append(sinCosCosVal)
                        sinCosCosVals2[caseVal].append(sinCosCosVal2)
                    except:
                        xyzLenVals[caseVal] = [ xyzLenVal ]
                        sinCosCosVals[caseVal] = [ sinCosCosVal ]
                        sinCosCosVals2[caseVal] = [ sinCosCosVal2 ]

                else:
                    #### Bad Record ####
                    badRecord = True
                    badIDs.append(OID)

                ARCPY.SetProgressorPosition()

            del rows

            self.messageBadRecords(ssdo, cnt, badRecord, badIDs, badLengths)

            #### Set up for Bad Cases ####
            badCases = []
            cases = UTILS.iterkeys(xyzLenVals)
            meanCenter = {}
            dm = {}
       
            #### Calculate Mean Center and Standard Distance ####
            for case in cases:
                xyzLens = xyzLenVals[case]
                numFeatures = len(xyzLens)
                if numFeatures > 0:
                    #### Mean Centers and Lengths ####
                    xyzLens = NUM.array(xyzLens)
                    meanX, meanY, meanZ, meanL = NUM.mean(xyzLens, 0)

                    #### Sum Sin and Cos and CosZ ####
                    scVals = NUM.array(sinCosCosVals[case])
                    sumSin, sumCos, sumCosZ = NUM.sum(scVals, 0)
                    sinMean = sumSin / numFeatures
                    cosMean = sumCos / numFeatures
                    cosZMean = sumCosZ / numFeatures

                    #### Calculate Azimuth ####
                    azimuth, angleZ, radio = UTILS.getSphericalCoord(sumSin, sumCos, sumCosZ)
                    radianAzimuth = UTILS.convert2Radians(azimuth)
                    radianAngleZ = UTILS.convert2Radians(angleZ)
                    
                    #### Diametrical Bimodal Correction ####
                    if (NUM.isclose([sumSin],[0.0])[0] and 
                        NUM.isclose([sumCos],[0.0])[0] and 
                        NUM.isclose([sumCosZ],[0.0])[0] ):
                        scVals2 = NUM.array(sinCosCosVals2[case])
                        sumSin2, sumCos2, sumCosZ2 = NUM.sum(scVals2, 0)
                        scVals2 = NUM.array(sinCosCosVals2[case])
                        azimuth, angleZ, radio = UTILS.getSphericalCoord(sumSin2, sumCos2, sumCosZ2)
                        
                        #### Re-adjust Angle ####
                        if azimuth >= 180.0:
                            azimuth = azimuth - 180.0
                        else:
                            azimuth = azimuth + 180.0

                        radianAzimuth = UTILS.convert2Radians(azimuth)
                        radianAngleZ = UTILS.convert2Radians(angleZ)
                        doublingCases.append(case)
                    
                    #### Get Start and End Points ####
                    halfMeanLen = meanL / 2.0
                    
                    #### Get Points to Draw Arrow ####
                    startX, startY, startZ = UTILS.getPoint3DFromAnglesDistance(meanX, meanY, meanZ,
                                                                                azimuth, angleZ, -halfMeanLen)

                    endX, endY, endZ = UTILS.getPoint3DFromAnglesDistance(meanX, meanY, meanZ,
                                                                          azimuth, angleZ, halfMeanLen)

                    unstandardized = NUM.sqrt(sumSin**2.0 + sumCos**2.0 + sumCosZ ** 2.0)
                    
                    #### Spherical Variance ####
                    sphVar = 1.0 - (unstandardized / (numFeatures * 1.0))

                    disperR = NUM.sqrt(sinMean**2.0 + cosMean**2.0 + cosZMean ** 2.0)

                    #### Re-adjust Angle Back towards North ####
                    if orientationOnly:
                        azimuth = azimuth - 180.0
                        radianAzimuth = UTILS.convert2Radians(azimuth)
                        radianAngleZ = UTILS.convert2Radians(angleZ)
                        
                    #### Critical Value - Confidence Level of 95% ####
                    chi2RefPvalue = SCPYSTAT.chi2.ppf(0.95, 3)

                    #### Rayleigh Value  pnR^2  p-> dimension ####
                    rayleighZvalue= (3 * disperR**2) * numFeatures  

                    #### Significance of the rayleigh value ####
                    pValue = 1.0 - SCPYSTAT.chi2.cdf( rayleighZvalue,3)

                    #### HO  reject if rayleighZvalue > chi2RefPvalue ####
                    if (rayleighZvalue > chi2RefPvalue):
                        uniform = testResponse[0]
                    else:
                        uniform = testResponse[1]

                    #### Populate Results Structure ####
                    meanCenter[case] = (meanX, meanY, meanZ)
                    dm[case] = [ (startX, startY, startZ), (endX, endY, endZ), meanL, 
                                  radianAzimuth, azimuth, sphVar,
                                  radianAngleZ, angleZ, rayleighZvalue, chi2RefPvalue, pValue, uniform] 

                    if numFeatures < numberOfCasesForRayleighTest3D :
                        lowCasesForTest.append(case)

        #### Check Number of Features for Uniformity Test ####
        nDoublingCases = len(doublingCases)
        if nDoublingCases:
            cBool = caseIsString
            if not caseIsString:
                doublingCases = [UTILS.caseValue2Print(i, cBool) for i in doublingCases]
            ERROR.reportDoubleAngleCases(len(dm), nDoublingCases, ",".join(doublingCases), 
                                    label = caseField)
                                         
        #### Check Number of Features for Uniformity Test ####
        if len(lowCasesForTest) > 0 :
            if evalDim == 2:
                numCases = len(xyLenVals)
            else:
                numCases = len(xyzLenVals)
            if not caseIsString:
                casesBadTest = [UTILS.caseValue2Print(i, caseIsString) for i in lowCasesForTest]
            else:
                casesBadTest = lowCasesForTest

            casesBadTest.sort()
            ERROR.reportBadCasesForTestUniformity(numCases,len(lowCasesForTest),casesBadTest,
                                                  numCases2D=numberOfCasesForRayleighTest2D,
                                                  numCases3D=numberOfCasesForRayleighTest3D)

        #### Sorted Case List ####
        self.caseKeys = sorted(UTILS.iterkeys(dm))

        #### Set Attributes ####
        self.ssdo = ssdo
        self.meanCenter = meanCenter
        self.dm = dm
        self.badCases = badCases
        self.inputFC = inputFC
        self.outputFC = outputFC
        self.caseField = caseField
        self.orientationOnly = orientationOnly
        self.caseIsString = caseIsString

    def messageBadRecords(self,ssdo, cnt, badRecord, badIDs, badLengths):
        """
        Messages of bad records and start-End points records
        """
        #### Get Set of Bad IDs ####
        badIDs = list(set(badIDs))
        badIDs.sort()
        badLengths = list(set(badLengths))
        badLengths.sort()
        diff =  list(set(badIDs) - set(badLengths))
        badIDs = [ str(i) for i in badIDs ]      

        #### Process any bad records encountered ####
        bn = len(badIDs)
        if badRecord and len(diff):
            err = ERROR.reportBadRecords(cnt, bn, badIDs, label = ssdo.oidName)

        #### Error For Not Enough Observations ####
        goodRecs = cnt - bn
        ERROR.errorNumberOfObs(goodRecs, minNumObs = 1)

        #### Report Features With No Length ####
        badLengths = [ str(i) for i in badLengths ]
        numBadLengths = len(badLengths)
        if numBadLengths > 0:
            ERROR.reportBadLengths(cnt, numBadLengths, badLengths, 
                                   label = ssdo.oidName)

    def report(self, fileName = None):
        """Reports the Directional Mean results as a message or to a file.

        INPUTS:
        fileName {str, None}: path to a text file to populate with results.
        """

        header = ARCPY.GetIDMessage(84203)
        if (self.evalDim == 2):
            columns = [ARCPY.GetIDMessage(84191), ARCPY.GetIDMessage(84204), 
                   ARCPY.GetIDMessage(84205), ARCPY.GetIDMessage(84206),
                   ARCPY.GetIDMessage(84207), ARCPY.GetIDMessage(84208),
                   ARCPY.GetIDMessage(84209), ARCPY.GetIDMessage(84680),
                   ARCPY.GetIDMessage(84281), ARCPY.GetIDMessage(84687),
                   ARCPY.GetIDMessage(84682)]

        else:
            columns = [ARCPY.GetIDMessage(84191), ARCPY.GetIDMessage(84204), 
                   ARCPY.GetIDMessage(84205), ARCPY.GetIDMessage(84683),
                   ARCPY.GetIDMessage(84684), ARCPY.GetIDMessage(84207),
                   ARCPY.GetIDMessage(84208), ARCPY.GetIDMessage(84685),
                   ARCPY.GetIDMessage(84685),  ARCPY.GetIDMessage(84680),
                   ARCPY.GetIDMessage(84281), ARCPY.GetIDMessage(84687),
                   ARCPY.GetIDMessage(84682)]

        results = [ columns ]
        for case in self.caseKeys:
            if not self.caseField:
                strCase = "ALL"
            else:
                strCase = UTILS.caseValue2Print(case, self.caseIsString)
            if (self.evalDim == 2):
                meanX, meanY = self.meanCenter[case]
                start, end, length, rAngle, dAngle, circVar, 
                zValue, refValue, pValue, uniform = self.dm[case]
                dirMean = 360. - dAngle + 90.
                if not dirMean < 360:
                    dirMean = dirMean - 360.
                rowResult = [ strCase, 
                              LOCALE.format_string("%0.6f", dAngle),
                              LOCALE.format_string("%0.6f", dirMean),
                              LOCALE.format_string("%0.6f", circVar), 
                              LOCALE.format_string("%0.6f", meanX),
                              LOCALE.format_string("%0.6f", meanY),
                              LOCALE.format_string("%0.6f", length),
                              LOCALE.format_string("%0.6f", zValue),
                              LOCALE.format_string("%0.6f", refValue),
                              LOCALE.format_string("%0.6f", pValue),
                              uniform
                              ]
                results.append(rowResult)
            else:
                meanX, meanY, meanZ = self.meanCenter[case]
                start, end, length3D, rAngle, dAngle, shrVar, rAngleZ,dAngleZ, 
                zValue, refValue,pValue, uniform = self.dm[case]
                dirMean = 360. - dAngle + 90.
                if not dirMean < 360:
                    dirMean = dirMean - 360.
                rowResult = [ strCase, 
                              LOCALE.format_string("%0.6f", dAngle),
                              LOCALE.format_string("%0.6f", dirMean),
                              LOCALE.format_string("%0.6f", dAngleZ),
                              LOCALE.format_string("%0.6f", shrVar), 
                              LOCALE.format_string("%0.6f", meanX),
                              LOCALE.format_string("%0.6f", meanY),
                              LOCALE.format_string("%0.6f", meanZ),
                              LOCALE.format_string("%0.6f", length),
                              LOCALE.format_string("%0.6f", zValue),
                              LOCALE.format_string("%0.6f", refValue),
                              LOCALE.format_string("%0.6f", pValue),
                              uniform
                              ]
                results.append(rowResult)

                

        outputTable = UTILS.outputTextTable(results, header = header)
        if fileName:
            f = UTILS.openFile(fileName, "w")
            UTILS.writeText(f, outputTable)
            f.close()
        else:
            ARCPY.AddMessage(outputTable)

    def checkDomainProjection(self):
        points = []
        for case in self.caseKeys:
                #### Get Results ####
                start, end, length, rAngle, dAngle, circVar, \
                rAngleZ, dAngleZ, rayleighZvalue,chi2RefPvalue, pValue, uniform= self.dm[case]
                x0, y0, z0 = start
                x1, y1, z1 = end
                points.append([ x0, y0, z0])
                points.append([ x1, y1, z1])

        if not len(points):
                    return False

        self.initialDomain = UTILS.getXYZProjectionDomain(self.ssdo.spatialRef)
        nPoints = NUM.array(points)
        projectionChange = UTILS.extentDomain3D(self.ssdo.spatialRef,
                                                nPoints, self.initialDomain)
        return self.ssdo.spatialRef, projectionChange


    def createOutput(self, outputFC, parameters = None):
        """Creates an Output Feature Class with the Directional Mean
        Results.

        INPUTS:
        outputFC (str): path to the output feature class
        """

        #### Validate Output Workspace ####
        ERROR.checkOutputPath(outputFC)

        #### Shorthand Attributes ####
        ssdo = self.ssdo
        caseField = self.caseField

        #### Create Output Feature Class ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84003))
        outPath, outName = OS.path.split(outputFC)

        spatialRefString = self.ssdo.spatialRefString
        isGDB = not UTILS.isShapeFile(outputFC)
        if isGDB and self.evalDim == 3:
            ### Increase Domain If Ouput Lines Out Of Projection Domain ###
            spatRef, changed =self.checkDomainProjection()
            if changed:
                xyzProjectionDomain = UTILS.getXYZProjectionDomain(spatRef)
                self.projDomainChanged = not (self.initialDomain == xyzProjectionDomain)
                if self.projDomainChanged:
                    spatialRefString = UTILS.returnOutputSpatialString(self.ssdo.spatialRef)

        ssdo.newFieldTypeChecker.createFeatureClass(outputFC, "POLYLINE", ssdo.mFlag, 
                                                    ssdo.zFlag, spatialRefString)

        #### Add Fields to Output FC ####
        if (self.evalDim == 2):
            dataFieldNames = UTILS.getFieldNames(lmFieldNames, outPath)
        else:
            dataFieldNames = UTILS.getFieldNames(lmFieldNames3D, outPath)
        shapeFieldNames = ["SHAPE@"]
        for fieldName in dataFieldNames:
            UTILS.addEmptyField(outputFC, fieldName, "DOUBLE")


        UTILS.addEmptyField(outputFC, uniformField, "TEXT")
        dataFieldNames.append(uniformField)

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

        #### Populate Output Feature Class ####
        allFieldNames = shapeFieldNames + dataFieldNames

        rows = DA.InsertCursor(outputFC, allFieldNames)
        if (self.evalDim == 2):
            for case in self.caseKeys:
                #### Get Results ####

                start, end, length, rAngle, dAngle, circVar, \
                rayleighZvalue,chi2RefPvalue, pValue, uniform = self.dm[case]
                meanX, meanY = self.meanCenter[case]
                dirMean = 360. - dAngle + 90.
                if not dirMean < 360:
                    dirMean = dirMean - 360.

                #### Create Start and End Points ####
                x0, y0 = start
                startPoint = ARCPY.Point(x0, y0, ssdo.defaultZ)
                x1, y1 = end
                endPoint = ARCPY.Point(x1, y1, ssdo.defaultZ)

                #### Create And Populate Line Array ####
                line = ARCPY.Array()
                line.add(startPoint)
                line.add(endPoint)
                line = ARCPY.Polyline(line, None, True)

                #### Create and Populate New Line Feature ####
                rowResult = [line, dAngle, dirMean, circVar, 
                             meanX, meanY, length, rayleighZvalue, 
                             chi2RefPvalue, pValue, uniform]

                if caseField:
                    caseValue = self.caseDict[case]
                    rowResult.append(caseValue)
                rows.insertRow(rowResult)
        else:
            for case in self.caseKeys:
                #### Get Results ####
                start, end, length, rAngle, dAngle, circVar, \
                rAngleZ, dAngleZ, rayleighZvalue,chi2RefPvalue, pValue, uniform= self.dm[case] 

                meanX, meanY, meanZ = self.meanCenter[case]
                dirMean = 360. - dAngle + 90.
                if not dirMean < 360:
                    dirMean = dirMean - 360.

                #### Create Start and End Points ####
                x0, y0, z0 = start
                startPoint = ARCPY.Point(x0, y0, z0)
                x1, y1, z1 = end
                endPoint = ARCPY.Point(x1, y1, z1)

                #### Create And Populate Line Array ####
                line = ARCPY.Array()
                line.add(startPoint)
                line.add(endPoint)
                line = ARCPY.Polyline(line,ssdo.spatialRefString, True, False)

                #### Create and Populate New Line Feature ####
                rowResult = [line, dAngle, dirMean,  dAngleZ ,circVar, 
                             meanX, meanY, meanZ,  length,
                             rayleighZvalue, chi2RefPvalue, pValue, uniform]


                if caseField:
                    caseValue = self.caseDict[case]
                    rowResult.append(caseValue)
                rows.insertRow(rowResult)


        #### Clean Up ####
        del rows

        if self.projDomainChanged:
            ARCPY.AddIDMessage("WARNING", 110082)

        #### Set Attribute ####
        self.outputFC = outputFC

        #### Set the Default Symbology ####
        if parameters is None:
            params = ARCPY.gp.GetParameterInfo()
        else:
            params = parameters
            
        #### Install Path to Layer Files ####
        fullRLF = UTILS.pathLayers

        if self.evalDim == 3:
            if self.orientationOnly:
                renderLayerFile = "LinearMeanTwoWay_3D.lyrx"
            else:
                renderLayerFile = "LinearMeanOneWay_3D.lyrx"
            
            fullRLF = OS.path.join(fullRLF, renderLayerFile)
            params[1].symbology = fullRLF
        
        else:
            if self.orientationOnly:
                renderLayerFile = "LinearMeanTwoWay.lyr"
            else:
                renderLayerFile = "LinearMeanOneWay.lyr"
            fullRLF = OS.path.join(fullRLF, renderLayerFile)
            params[1].symbology = fullRLF

