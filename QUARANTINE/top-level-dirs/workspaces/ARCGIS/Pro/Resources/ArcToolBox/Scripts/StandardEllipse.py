# coding: utf-8
"""
Tool Name:  Directional Trends (Standard Deviational Ellipse)
Source Name: StandardEllipse.py
Version: ArcGIS 10.1
Author: ESRI

This tool measures whether a distribution of features exhibits a
directional trend (that is, whether features are farther from
a specified center point in one direction than in another).  The
user may specify an optional weight field and/or an optional
case field.
"""

################### Imports ########################
import os as OS
import sys as SYS
import collections as COLL
import numpy as NUM
import math as MATH
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.da as DA
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import locale as LOCALE
import scipy.spatial as SCPS
import arcpy.geoprocessing as GP
import arcgisscripting as ARC
import datetime as DT
import logging
from loggerutils import init_ss_logger

LOGGER = init_ss_logger(__name__, logging.DEBUG)
LOCALE.setlocale(LOCALE.LC_ALL, '')

circleDict = {"1_STANDARD_DEVIATION": 1, 
              "2_STANDARD_DEVIATIONS": 2,
              "3_STANDARD_DEVIATIONS": 3}

################ Output Field Names #################
seFieldNames = ["CenterX", "CenterY", "XStdDist", "YStdDist", "Rotation"]
seFieldNames3D = ["CenterX", "CenterY", "CenterZ", "XStdDist", "YStdDist", "ZStdDist", "AngleZ", "TiltX", "RollY"]

############### Threshold for 2D cases with Z enabled  ################
zThresholdSemi3DCases = 0.001

############### Layers ##############
layers = ["StandardDeviationalEllipse", "StandardDeviationalEllipsoid"]

#### Factor 3-sigma rule for 2D and 3D, 68% 95% 99% ##############
factor1D = {1: 1.0, 
            2: 1.96,
            3: 2.576}

factor2D = {1: 1.51, 
            2: 2.448,
            3: 3.035}

factor3D = {1: 1.872, 
            2: 2.795,
            3: 3.368}

######################## Auxiliary Functions ###############################
def base(nVertices = 360):
    """
    Calculate n angles,
    INPUT:
        nVertices (int): Number of vertices
    OUTPUT:
        cst (1D Array): cosines
        st  (1D Array): sines
    """

    t = NUM.arange(0, nVertices, 1);
    #t = t[::-1]
    t = NUM.pi / 180.0 * t
    cst = NUM.cos(t)
    st = NUM.sin(t)
    return cst, st

def createEllipse(info, cx, cy, vx, vy, a):
    """
    Create list X and Y arrays of the ellipse
    INPUT:
        info (tuple): Sine and Cosine Arrays List 
        cx (float): Central X
        cy (float): Central Y
        vx (float): Axis X
        vy (float): Axis Y
        a (float): Rotation angle
    OUTPUT:
        x (1D array): X coordinate ellipse
        y (1D array): Y coordinate ellipse
    """
    cst, st = info
    csa = NUM.cos(-a)
    sa = NUM.sin(-a)
    x = cx + vx * cst * csa - vy * st * sa;
    y =  cy + vy * st * csa + vx * cst * sa;
    return x, y

def createOutputUsingCursor(ssdo, caseField, outputFC, shapes, dataFields):

    ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84003))
    outPath, outName = OS.path.split(outputFC)    
    try:
        DM.CreateFeatureclass(outPath, outName, "POLYGON", 
                              "", ssdo.mFlag, ssdo.zFlag, 
                              ssdo.spatialRefString)
    except:
        LOGGER.error(210, extra={"message_ID": 210, "add_argument1": outputFC})
        raise SystemExit()

    dataFieldNames = seFieldNames

    #### Add Fields to Output FC ####
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

    shapeFieldNames = ["SHAPE@"]
    #### Write Output ####
    badCaseRadians = []
    allFieldNames = shapeFieldNames + dataFieldNames
    rows = DA.InsertCursor(outputFC, allFieldNames)
    for ind, shape in enumerate(shapes):
        row = [shape]
        for el in NUM.arange(len(dataFields)):
            row.append(dataFields[el][ind])
        try:
            rows.insertRow(row)
        except:
            break
    del rows

def createPointCloud(outputFC, points, ssdo, case):
    """Create point cloud feature class
    INPUT:
    outputFC {string}: output feature class
    points  {nx3 array}: array points
    ssdo (obj): instance of SSDataObject
    case {int/date/str}: case value
    """
    outPath, outName = OS.path.split(outputFC)
    DM.CreateFeatureclass(outPath, "PointCloud_"+ str(case) + outName, 
                          "POINT", None, 'ENABLED', 'ENABLED',
                          ssdo.spatialRefString)
    path = outPath + "/PointCloud_"+ str(case) + outName
    seFieldNamesSelection = ["ID"]
    shapeFieldNames = ["SHAPE@"]
    for fieldName in seFieldNamesSelection:
        UTILS.addEmptyField(path, fieldName, "LONG")
    allFieldNames = shapeFieldNames + seFieldNamesSelection
    rows = DA.InsertCursor(path, allFieldNames)
    numPoints = points.shape[0]
    for index in range(0,numPoints):
        pnt1 = ARCPY.Point(points[index][0], points[index][1], points[index][2])
        rowResult = [pnt1, index]
        rows.insertRow(rowResult)
    del rows

def calculateGeometryInfo(evalDim, eigen_vector, std):
    """Calculate direction information for ellipses and ellipsoids
    INPUT:
    evalDim {int}: 2 -> ellipse, 3 -> ellipsoid
    eigen_vector  {float matrix 3x3}: eigen vectors
    std  {float array}: standard deviation
    OUTPUT:
    mainVector {float array} : radios and rotations 
    """
    vector_1 = eigen_vector[:,0] * std[0]
    vector_2 = eigen_vector[:,1] * std[1]
    vector_3 = eigen_vector[:,2] * std[2]

    #### Calculate spherical coordinates ####
    angleZ1, theta1 , length1 = UTILS.getSphericalCoord(vector_1[0],
                                                        vector_1[1],
                                                        vector_1[2])
    angleZ2, theta2 , length2 = UTILS.getSphericalCoord(vector_2[0],
                                                        vector_2[1],
                                                        vector_2[2])
    angleZ3, theta3 , length3 = UTILS.getSphericalCoord(vector_3[0],
                                                        vector_3[1],
                                                        vector_3[2])

    #### Check Main Axe to Assign Azimuth ####
    if length1 > length2:
        angle = angleZ1
    else:
        if angleZ2 < 180:
            angle = angleZ2
        else:
            angle = angleZ2 - 180

    if evalDim == 2:
        mainVector = [length1, length2, angleZ1, 
                      UTILS.convert2Radians(90-angleZ1), angle ]
    else:
        mainVector = [length1, length2, length3,
                      angle, 90-theta2, theta1-90] 

    return mainVector

############################ Main Class ####################################
class StandardEllipse(object):
    """This tool measures whether a distribution of features exhibits a
    directional trend (that is, whether features are farther from
    a specified center point in one direction than in another).  The
    user may specify an optional weight field and/or an optional
    case field.

    INPUTS: 
    ssdo (obj): instance of SSDataObject
    weightField {str, None}: name of weight field
    caseField {str, None} name of case field
    stdDeviations {float, 1.0}: number of standard devs around center
    threeSigma {bool, false}: use three sigma factors 68,95,99 

    ATTRIBUTES:
    meanCenter (dict): [case field value] = mean center (1)
    se (dict): [case field value] = standard distance (1)
    badCases (list): list of cases that were unsuccessful.
    ssdo (class): instance of SSDataObject
    uniqueCases (array): sorted list of all cases for print/output

    METHODS:
    createOutput: creates a feature class with standard distances.
    report: reports results as a printed message or to a file

    NOTES:
    (1)  The key for the mean center dicts is "ALL" if no case field is
         provided
    """

    def __init__(self,  ssdo, weightField=None, caseField=None, 
                 stdDeviations=1, threeSigma=False, fromAGOL=False):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())
        self.stdDeviations = int(stdDeviations)

        #### Set from AGOL flag ####
        self.FLAG_AGOL = fromAGOL

        #### Set Data ####
        self.xyCoords = self.ssdo.xyCoords
        self.zCoords = self.ssdo.zCoords
        self.caseField = caseField
        self.isGCS = self.ssdo.spatialRefType.upper() == "GEOGRAPHIC"

        factor = 1.0
        self.applyZ = self.ssdo.zFlag != "DISABLED"

        if self.ssdo.hasZ and self.applyZ:
            evalDim = 3
            minimumPoints = 3
            factor = factor3D[self.stdDeviations]
            zData = self.zCoords

            if not ssdo.distanceInfo.xyzUnitsEqual:
                LOGGER.error(110083, extra={"message_ID": 110083})
                raise SystemExit()

        else:
            evalDim = 2
            minimumPoints = 2
            factor = factor2D[self.stdDeviations]

        #### Use 3D in PRO ####
        self.isPRO = UTILS.isPRO()
        if not self.isPRO:
            evalDim = 2

        #### Use Rayleigh Distribution Factor According Dimension ####
        if not threeSigma:
            factor = stdDeviations * 1.0 * NUM.sqrt(evalDim)

        #### Honoring Z Environment ####
        self.addZthreshold = False;
        if self.ssdo.defaultZ != 0.0 and evalDim == 2 and self.isPRO:
            evalDim = 3
            minimumPoints = 2
            factor = factor2D[self.stdDeviations]
            zData = NUM.ones((self.ssdo.numObs,)) *  self.ssdo.defaultZ
            self.addZthreshold = True;
            if not threeSigma:
                factor = self.stdDeviations * 1.0 * NUM.sqrt(2.0)

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
        meanCenter = COLL.defaultdict(NUM.array)
        se = COLL.defaultdict(float)

        #### Set Eigvalues/Eignvector -> std/vector ####
        standardDevInfo = COLL.defaultdict(NUM.array)
        vectorInfo = COLL.defaultdict(NUM.array)

        #### Keep Track of Bad Cases ####
        badCases = []
        badCaseInd = []
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84007))
        #### Angular mean ####
        self.gcsAngmean={}
        #### Calculate Mean Center and Standard Distance ####
        for ind, case in enumerate(self.uniqueCases):
            indices = NUM.where(self.caseVals == case)
            xy = self.xyCoords[indices]
            numFeatures = len(indices[0])
            w = self.weights[indices]
            w.shape = numFeatures, 1
            weightSum = w.sum()

            if self.isGCS:
                meanAz = UTILS.meanCenterAngular(xy.T[0])
                self.gcsAngmean[case] = meanAz
                xTemp = xy.T[0] - meanAz
                xy.T[0] = UTILS.normalize(xTemp)

            if (weightSum != 0.0) and (numFeatures > minimumPoints):
                xyz = NUM.zeros((xy.shape[0], xy.shape[1]+1))
                xyz[:,:-1] = xy
                if (evalDim == 3):
                    z = zData[indices]
                    xyz[:,2] = z

                mcenter = (xyz - NUM.mean(xyz.T, axis=1)).T
                xyWeighted = (w / weightSum)  * xyz 

                #### Apply Weights ####
                if (weightSum > 0):
                    #### Calculating Weight Covariance Numpy V1.10  ddof=0 ####
                    aweight = NUM.asarray(w.flatten(), dtype = float)
                    avg, w_sum = NUM.average(mcenter, axis = 1, weights = aweight, 
                                             returned = True)
                    w_sum = w_sum[0]
                    #### Using Deg. of Freedom = 0 ####
                    fact = w_sum 
                    mcenter -= avg[:, None]
                    mcenter_T = (mcenter * aweight).T
                    covmatrix = (UTILS.dot(mcenter, mcenter_T.conj()) / fact).squeeze()
                else:
                    covmatrix = NUM.cov(mcenter)

                try:
                    eigval,eigvec = NUM.linalg.eig(NUM.around(covmatrix, decimals = 16))
                except NUM.linalg.linalg.LinAlgError as err:
                    badCases.append(case)
                    badCaseInd.append(ind)
                    continue

                #### Check Bad Values ####
                check = [ (NUM.isnan(value) or
                           NUM.isinf(value) or 
                           value < 0 ) for value in eigval  ]
                if any(check):
                    badCases.append(case)
                    badCaseInd.append(ind)
                    continue

                #### Std Dev by Dimensional Factor ####
                std =  NUM.sqrt(eigval)
                std = std * factor;
                
                #### Add Threshold to Honor Z Environment ####
                if  self.addZthreshold:
                    std[2] = zThresholdSemi3DCases

                #### Mean Center ####
                centers = xyWeighted.sum(0) 
                meanX, meanY, meanZ = centers
                meanCenter[case] = centers

                #### Set Data ####
                standardDevInfo[case] = std
                vectorInfo[case] = eigvec
                se[case] = calculateGeometryInfo(evalDim, eigvec, std)
              
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
        self.se = se
        self.badCases = badCases
        self.caseField = caseField
        self.weightField = weightField
        self.standardDevInfo = standardDevInfo
        self.vectorInfo = vectorInfo
        self.evalDim = evalDim

    def createAxes(self,  outputFC):
        """ Create a 3D polygons representing ellipsoid axes
        INPUTS:
        outputFC {str}: path to a 3D shapefile 
        """
        outPath, outName = OS.path.split(outputFC)
        DM.CreateFeatureclass(outPath, outName, "POLYGON", 
                              "", self.ssdo.mFlag, self.ssdo.zFlag, 
                              self.ssdo.spatialRefString)

        seFieldNames = ["INDEX", "CASE"]
        shapeFieldNames = ["SHAPE@"]
        for fieldName in seFieldNames:
            UTILS.addEmptyField(outputFC, fieldName, "DOUBLE")

        rows = DA.InsertCursor(outputFC, shapeFieldNames + seFieldNames)
        for ind, case in enumerate(self.uniqueCases):
            if self.evalDim == 3 :
                x, y, z = se.meanCenter[case][0], se.meanCenter[case][1], se.meanCenter[case][2]
                vect_1 = self.vectorInfo[case][:,0] * self.standardDevInfo[case][0]
                vect_2 = self.vectorInfo[case][:,1] * self.standardDevInfo[case][1]
                vect_3 = self.vectorInfo[case][:,2] * self.standardDevInfo[case][2]
                vx1, vy1, vz1 = vect_1[0] + x,vect_1[1] + y,vect_1[2] + z
                vx2, vy2, vz2 = vect_2[0] + x,vect_2[1] + y,vect_2[2] + z
                vx3, vy3, vz3 = vect_3[0] + x,vect_3[1] + y,vect_3[2] + z
                pnt = ARCPY.Point(x, y, z)
                pnt1 = ARCPY.Point(vx1, vy1, vz1)
                pnt2 = ARCPY.Point(vx2, vy2, vz2)
                pnt3 = ARCPY.Point(vx3, vy3, vz3)
                array1 = ARCPY.Array()
                array1.add(pnt)
                array1.add(pnt1)
                array1.add(pnt2)
                array1.add(pnt)
                poly1 = ARCPY.Polygon(array1, None, True)
                rows.insertRow([poly1, 1, case])
                array2 =ARCPY.Array()
                array2.add(pnt)
                array2.add(pnt2)
                array2.add(pnt3)
                array2.add(pnt)
                poly2 = ARCPY.Polygon(array2, None, True)
                rows.insertRow([poly2, 2, case])
                array3 = ARCPY.Array()
                array3.add(pnt)
                array3.add(pnt3)
                array3.add(pnt1)
                array3.add(pnt)
                poly3 = ARCPY.Polygon(array3, None, True)
                rows.insertRow([poly3, 3, case])
        del rows

    def report(self, fileName = None):
        """Reports the Standard Ellipse results as a message or to a file.

        INPUTS:
        fileName {str, None}: path to a text file to populate with results
        """

        header = ARCPY.GetIDMessage(84210)
        if (self.evalDim == 2):
            columns = [ARCPY.GetIDMessage(84191), ARCPY.GetIDMessage(84211),
                       ARCPY.GetIDMessage(84212), ARCPY.GetIDMessage(84213), 
                       ARCPY.GetIDMessage(84214), ARCPY.GetIDMessage(84215)]
        else:
            columns = [ARCPY.GetIDMessage(84191), ARCPY.GetIDMessage(84211),
                       ARCPY.GetIDMessage(84212), ARCPY.GetIDMessage(84675),
                       ARCPY.GetIDMessage(84213), ARCPY.GetIDMessage(84214),
                       ARCPY.GetIDMessage(84676), ARCPY.GetIDMessage(84677),
                       ARCPY.GetIDMessage(84678), ARCPY.GetIDMessage(84679)]

        results = [ columns ]

        for case in self.uniqueCases:
            if not self.caseField:
                strCase = "ALL"
            else:
                strCase = UTILS.caseValue2Print(case, self.caseIsString)

            if self.evalDim == 2:
                meanX, meanY = self.meanCenter[case]
                seX, seY, degreeRotation, radianR1, radianR2 = self.se[case]
                rowResult = [strCase, LOCALE.format_string("%0.6f", meanX),
                             LOCALE.format_string("%0.6f", meanY),
                             LOCALE.format_string("%0.6f", seX),
                             LOCALE.format_string("%0.6f", seY),
                             LOCALE.format_string("%0.6f", radianR2)]
            else:
                meanX, meanY, meanZ = self.meanCenter[case]
                seX, seY, seZ, rotationZ, rotationY, rotationX = self.se[case]
                rowResult = [strCase, 
                             LOCALE.format_string("%0.6f", meanX),
                             LOCALE.format_string("%0.6f", meanY),
                             LOCALE.format_string("%0.6f", meanZ),
                             LOCALE.format_string("%0.6f", seX),
                             LOCALE.format_string("%0.6f", seY),
                             LOCALE.format_string("%0.6f", seZ),
                             LOCALE.format_string("%0.6f", rotationZ), 
                             LOCALE.format_string("%0.6f", rotationY),
                             LOCALE.format_string("%0.6f", rotationX)]
            results.append(rowResult)

        outputTable = UTILS.outputTextTable(results, header = header)
        if fileName:
            f = UTILS.openFile(fileName, "w")
            UTILS.writeText(f, outputTable)
            f.close()
        else:
            LOGGER.debug(outputTable)

    def createOutput(self, outputFC, parameters = None):
        """Creates an Output Feature Class with the Standard Distances.

        INPUTS:
        outputFC (str): path to the output feature class
        """

        #### Validate Output Workspace ####
        ERROR.checkOutputPath(outputFC)

        #### Shorthand Attributes ####
        ssdo = self.ssdo
        caseField = self.caseField

        #### Increase Extent if not Projected ####
        if ssdo.spatialRefType != "Projected":
            seValues = self.se.values()
            if len(seValues):
                maxSE = NUM.array([ i[0:2] for i in seValues ]).max()
                largerExtent = UTILS.increaseExtentByConstant(ssdo.extent,
                                                        constant = maxSE)
                largerExtent = [ LOCALE.str(i) for i in largerExtent ]
                ARCPY.env.XYDomain = " ".join(largerExtent)

        #### Create Output Feature Class ####

        outPath, outName = OS.path.split(outputFC)

        seFieldNamesSelection = []

        if self.evalDim == 2:
            ssdo.hasM = False
            ssdo.hasZ = False
            badCaseRadians = []
            shapesValues = []
            xValues = []
            yValues = []
            seXValues = [] 
            seYValues = [] 
            radianR2Values = []
            caseValues = []
            baseInfo  = base()
            areaZero = []

            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84126))

            for ind, case in enumerate(self.uniqueCases):

                #### Get Results ####
                xVal, yVal, zVal = self.meanCenter[case]
                seX, seY, degreeRotation, radianR1, radianR2 = self.se[case]

                seX2 = seX**2.0
                seY2 = seY**2.0

                #### Create Empty Polygon Geomretry ####
                poly = ARCPY.Array()

                #### Check for Valid Radius ####
                seXZero = UTILS.compareFloat(0.0, seX, rTol = .0000001)
                seXNan = NUM.isnan(seX)
                seXBool = seXZero + seXNan
                seYZero = UTILS.compareFloat(0.0, seY, rTol = .0000001)
                seYNan = NUM.isnan(seY)
                seYBool = seYZero + seYNan
                points = []

                if seXBool or seYBool:
                    badRadian = 6
                    badCase = UTILS.caseValue2Print(case, self.caseIsString)
                    badCaseRadians.append(badCase)
                else:
                    badRadian = 0
                    cosRadian = NUM.cos(radianR1)
                    sinRadian = NUM.sin(radianR1)

                    #### Create List Points Ellipse ####
                    try:
                        x, y = createEllipse(baseInfo, xVal, yVal, seX, seY, (NUM.pi) - radianR1)
                        if self.isGCS:
                            x += self.gcsAngmean[case]
                            if self.FLAG_AGOL:
                                x = UTILS.normalize(UTILS.getAzmth(x))
                            else:
                                x = UTILS.getAzmth(x)

                        points = ARCPY.Array([ARCPY.Point(x[ind], y[ind], ssdo.defaultZ) for ind in NUM.arange(360)])
                    except:
                        badRadian = 6
                        badCase = UTILS.caseValue2Print(case, self.caseIsString)
                        badCaseRadians.append(badCase)


                if badRadian < 6:
                    #### Create and Populate New Feature ####
                    polygon = ARCPY.Polygon(points, ssdo.spatialRef, ssdo.hasZ, ssdo.hasM)

                    areaEmpty = False
                    if polygon.area == 0:
                        areaZero.append(None)
                        badCase = UTILS.caseValue2Print(case, self.caseIsString)
                        badCaseRadians.append(badCase)
                    else:
                        shapesValues.append(polygon)
                        #### Use Angular Mean  in GCS ###
                        if self.isGCS:
                            xVal = self.gcsAngmean[case]

                        xValues.append(xVal)
                        yValues.append(yVal)
                        seXValues.append(seX)
                        seYValues.append(seY)
                        radianR2Values.append(radianR2)

                        if caseField and  not areaEmpty:
                            caseValue = self.uniqueCases.item(ind)
                            caseValues.append(caseValue)

            #### Report Bad Cases Due to Geometry (coincident pts) ####
            nBadRadians = len(badCaseRadians)
            if nBadRadians:
                if caseField:
                    badCaseRadians = " ".join(badCaseRadians)
                    LOGGER.warning(1011, extra={"message_ID": 1011,
                                                "add_argument1": caseField,
                                                "add_argument2": badCaseRadians})
                else:
                    LOGGER.error(978, extra={"message_ID": 978})
                    raise SystemExit()

            fields = None
            dataFields = None

            fields = seFieldNames
            dataFields =   [NUM.array(xValues, dtype = float),
                            NUM.array(yValues, dtype = float),
                            NUM.array(seXValues, dtype = float),
                            NUM.array(seYValues, dtype = float),
                            NUM.array(radianR2Values,dtype = float)]
            fieldAliases = [None] * len(dataFields)

            highPrecisionDateFields = []
            if caseField:
                fcCaseField = ssdo.allFields[caseField]
                #validCaseName = UTILS.validQFieldName(fcCaseField, outPath)
                caseType = UTILS.convertType[fcCaseField.type]
                if UTILS.migrateDatePrecisionField(fcCaseField, ssdo.newFieldTypeChecker.outFlags):
                    highPrecisionDateFields.append(self.caseField)
                localSeFieldNames = fields + [self.caseField]
                fields = localSeFieldNames
                caseFieldType = None
                if ssdo.allFields[caseField].type == "BigInteger":
                    caseFieldType = NUM.int64

                dataFields += [NUM.array(caseValues, dtype=caseFieldType)]
                fieldAliases += [ssdo.allFields[caseField].alias]
            ##### Write Output ####
            if ssdo.spatialRef.name == "Unknown":
                createOutputUsingCursor(ssdo, caseField, outputFC, 
                                        shapesValues, dataFields)
            else:
                ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84003))
                conta = UTILS.DataContainer(ssdo.spatialRef, 
                                            shapes = shapesValues,
                                            hasOID64=self.ssdo.hasOID64)
                conta.generateOutput(outputFC, dataFields, fields, alias=fieldAliases, 
                                     highPrecisionDateFields = highPrecisionDateFields, adjustTexFields=True)


            #### Return Extent to Normal if not Projected ####
            if ssdo.spatialRefType != "Projected":
                ARCPY.env.XYDomain = ""

        else:
            #### 3D Create Ellipsoids #####
            self.createEllipsoid(outputFC, self)

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
                    renderLayerFile = layers[1] + '.lyrx'
                else:
                    renderLayerFile = layers[0] + '.lyr'
            else:
                if self.evalDim == 3:
                    renderLayerFile = layers[1] + '.lyr'
                else:
                    renderLayerFile = layers[0] + '.lyr'

            fullRLF = OS.path.join(fullRLF, renderLayerFile)
            params[1].symbology = fullRLF
        except:
            LOGGER.warning(973, extra={"message_ID": 973})

    def getData(self, isGDB, resolutionEllipsoid = 10):
        """ Increase Domain Extent """

        badCaseRadians = []
        dataPoints = {}
        numPoints = 0
        pointsExt = []
        points = []
        for ind, case in enumerate(self.uniqueCases):
            seX = self.standardDevInfo[case][0]
            seY = self.standardDevInfo[case][1]
            seZ = self.standardDevInfo[case][2]
            seXZero = UTILS.compareFloat(0.0, seX, rTol = .0000001)
            seXNan = NUM.isnan(seX)
            seXBool = seXZero + seXNan
            seYZero = UTILS.compareFloat(0.0, seY, rTol = .0000001)
            seYNan = NUM.isnan(seY)
            seYBool = seYZero + seYNan    
            seZZero = UTILS.compareFloat(0.0, seZ, rTol = .0000001)
            seZNan = NUM.isnan(seZ)
            seZBool = seZZero + seZNan
            if seXBool or seYBool:
                badCase = UTILS.caseValue2Print(case, self.caseIsString)
                badCaseRadians.append(badCase)
                continue

            #### Get Each Case Data ####
            meanX, meanY, meanZ = self.meanCenter[case]
            std = self.standardDevInfo[case]
            eigvec = self.vectorInfo[case]

            #### Create a Cloud of Points Representing Standard Ellipsoid ####
            points = UTILS.createCloudEllipsoid(std[0], std[1], std[2], 
                                                resolutionEllipsoid)
            numPoints = points.shape[0]
                                       
            #### Multiply Each Vector with the Correspond Axe ####
            a = NUM.kron(eigvec[:,0], points[:,0]) 
            b = NUM.kron(eigvec[:,1], points[:,1]) 
            c = NUM.kron(eigvec[:,2], points[:,2]) 

            #### Sum All Components ####
            data = NUM.round(a + b + c, 12)
            dataPoints[case] = data

            #### Get New Ellipsoid Coordinates ####
            x = data[0 : numPoints] + meanX
            y = data[numPoints : 2 * numPoints] + meanY
            z = data[2 * numPoints:] + meanZ

            pointsExt.append([x.min(), y.min(), z.min()])
            pointsExt.append([x.max(), y.max(), z.max()])

        self.initialDomain = None
        projectionChange = False

        if not len(points):
            return projectionChange, dataPoints, badCaseRadians, numPoints

        if isGDB:
            self.initialDomain = UTILS.getXYZProjectionDomain(self.ssdo.spatialRef)
            nPoints = NUM.array(pointsExt)
            projectionChange = UTILS.extentDomain3D(self.ssdo.spatialRef,
                                                    nPoints, self.initialDomain)
            return projectionChange, dataPoints, badCaseRadians, numPoints

        else:
            return projectionChange, dataPoints, badCaseRadians, numPoints

    def createEllipsoid(self, outputFC, resolutionEllipsoid = 10,
                        get_points = False):
        """Create ellipsoids  using  data from ellipse class
        INPUT:
        outputFC {string}: output feature class
        resolutionEllipsoid {int}: resolution ellipsoid
        get_points  {bool}:  True -> create featureclass with ellipsoid points
        """

        isGDB = not UTILS.isShapeFile(outputFC)
        outPath, outName = OS.path.split(outputFC)

        ### Get Data and Setup New Extent for Geodatabases ###
        dataValue = self.getData(isGDB)
        projectionChange, dataPoints, badCaseRadians, numPoints = dataValue
        self.projectionChange = projectionChange

        ### Increase Domain ###
        if self.projectionChange:
            xyzProjectionDomain = UTILS.getXYZProjectionDomain(self.ssdo.spatialRef)
            self.projDomainChanged = not (self.initialDomain == xyzProjectionDomain)
        else:
            self.projDomainChanged = False

        #### Check M Enabled ####
        mFlag = 0
        if (self.ssdo.mFlag == "ENABLED"):
            mFlag = 1
    
        try:
            #### Create an Ellipsoid Instance ####
            ellipsoid = ARC._ss.Ellipsoid(outputFC, self.ssdo.spatialRef, mFlag)
        except:
            LOGGER.error(210, extra={"message_ID": 210,
                                     "add_argument1": outputFC})
            raise SystemExit()

        for ind, case in enumerate(self.uniqueCases):
            if case in dataPoints.keys():
                data = dataPoints[case]
                ellipsoidInfo = self.se[case]
                std = self.standardDevInfo[case]
                meanX, meanY, meanZ = self.meanCenter[case]

                #### Get New Ellipsoid Coordinates ####
                x = data[0 : numPoints] + meanX

                #### Return to GCS origin ####
                if self.isGCS:
                    x += self.gcsAngmean[case]
                    x = UTILS.getAzmth(x)

                y = data[numPoints : 2 * numPoints] + meanY
                z = data[2 * numPoints:] + meanZ
                listPoints =[]
                for index in range(0,numPoints):
                    listPoints.append([x[index], y[index], z[index]])
                nlistPoints = NUM.array(listPoints, dtype = float, ndmin = 2)

                if (get_points):
                    createPointCloud(outputFC, nlistPoints, self.ssdo, case)

                #### Dateline Correction ####
                if self.isGCS:
                    meanX = self.gcsAngmean[case]

                ellipsoidData = NUM.array([meanX, meanY, meanZ,
                                           std[0], std[1], std[2],
                                           ellipsoidInfo[3], ellipsoidInfo[4], 
                                           ellipsoidInfo[5]])

                ellipsoid.add_ellipsoid_points(nlistPoints, ellipsoidData, ind)

        del ellipsoid  

        #### Report Bad Cases Due to Geometry (coincident pts) ####
        nBadRadians = len(badCaseRadians)
        if nBadRadians:
            if self.caseField:
                badCaseRadians = " ".join(badCaseRadians)
                LOGGER.warning(1011, extra={"message_ID": 1011,
                                            "add_argument1": self.caseField,
                                            "add_argument2": badCaseRadians})
            else:
                LOGGER.error(978, extra={"message_ID": 978})
                raise SystemExit()

        if self.projDomainChanged:
            LOGGER.warning(110082, extra={"message_ID": 110082})

        if self.caseField:
            fcCaseField = self.ssdo.allFields[self.caseField]
            validCaseName = UTILS.validQFieldName(fcCaseField, outPath)
            caseType = UTILS.convertType[fcCaseField.type]

            if caseType == "TEXT" and fcCaseField.length > 255:
                UTILS.addEmptyField(outputFC, validCaseName, caseType, alias=fcCaseField.alias, length = fcCaseField.length)
            else:
                UTILS.addEmptyField(outputFC, validCaseName, caseType, alias=fcCaseField.alias)

            if UTILS.migrateDatePrecisionField(fcCaseField, self.ssdo.newFieldTypeChecker.outFlags):
                DM.MigrateDateFieldToHighPrecision(outputFC, date_fields = validCaseName)
            with ARCPY.da.UpdateCursor(outputFC, ["CaseId", validCaseName]) as cursor:
                for row in cursor:
                     caseValue = self.uniqueCases.item(row[0])
                     row[1] =  caseValue
                     cursor.updateRow(row)

        #### Remove Field CaseId ####
        DM.DeleteField(outputFC,["CaseId"])

