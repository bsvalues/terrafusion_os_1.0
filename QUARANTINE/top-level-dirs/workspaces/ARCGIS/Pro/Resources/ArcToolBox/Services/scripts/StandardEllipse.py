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
import importlib
import json as JSON

importlib.reload(UTILS)
importlib.reload(ERROR)
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
def base(nVertices=360):
    """
    Calculate n angles,
    INPUT:
        nVertices (int): Number of vertices
    OUTPUT:
        cst (1D Array): cosines
        st  (1D Array): sines
    """

    t = NUM.arange(0, nVertices, 1);
    # t = t[::-1]
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
    y = cy + vy * st * csa + vx * cst * sa;
    return x, y


def createOutputUsingCursor(ssdo, caseField, outputFC, shapes, dataFields):
    ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84003))
    outPath, outName = OS.path.split(outputFC)
    try:
        DM.CreateFeatureclass(outPath, outName, "POLYGON",
                              "", ssdo.mFlag, ssdo.zFlag,
                              ssdo.spatialRefString)
    except:
        ARCPY.AddIDMessage("ERROR", 210, outputFC)
        raise SystemExit()

    dataFieldNames = seFieldNames

    #### Add Fields to Output FC ####
    for fieldName in dataFieldNames:
        UTILS.addEmptyField(outputFC, fieldName, "DOUBLE")

    if caseField:
        fcCaseField = ssdo.allFields[caseField]
        validCaseName = UTILS.validQFieldName(fcCaseField, outPath)
        caseType = UTILS.convertType[fcCaseField.type]
        UTILS.addEmptyField(outputFC, validCaseName, caseType)
        dataFieldNames.append(validCaseName)

    shapeFieldNames = ["SHAPE@"]
    #### Write Output ####
    badCaseRadians = []
    allFieldNames = shapeFieldNames + dataFieldNames
    rows = DA.InsertCursor(outputFC, allFieldNames)
    for ind, shape in enumerate(shapes):
        row = [shape]
        for el in NUM.arange(len(dataFields)):
            row.append(dataFields[el][ind])
        rows.insertRow(row)
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
    vector_1 = eigen_vector[:, 0] * std[0]
    vector_2 = eigen_vector[:, 1] * std[1]
    vector_3 = eigen_vector[:, 2] * std[2]

    #### Calculate spherical coordinates ####
    angleZ1, theta1, length1 = UTILS.getSphericalCoord(vector_1[0],
                                                       vector_1[1],
                                                       vector_1[2])
    angleZ2, theta2, length2 = UTILS.getSphericalCoord(vector_2[0],
                                                       vector_2[1],
                                                       vector_2[2])
    angleZ3, theta3, length3 = UTILS.getSphericalCoord(vector_3[0],
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
                      UTILS.convert2Radians(90 - angleZ1), angle]
    else:
        mainVector = [length1, length2, length3,
                      angle, 90 - theta2, theta1 - 90]

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

    def __init__(self, ssdo, weightField=None, caseField=None,
                 stdDeviations=1, threeSigma=False):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())
        self.stdDeviations = int(stdDeviations)

        #### Set Data ####
        self.xyCoords = self.ssdo.xyCoords
        self.zCoords = self.ssdo.zCoords
        self.caseField = caseField

        factor = 1.0

        evalDim = 2
        minimumPoints = 2
        factor = factor2D[self.stdDeviations]

        #### Use 3D in PRO ####
        self.isPRO = UTILS.isPRO()

        #### Use Rayleigh Distribution Factor According Dimension ####
        if not threeSigma:
            factor = stdDeviations * 1.0 * NUM.sqrt(evalDim)

        #### Honoring Z Environment ####
        self.addZthreshold = False;
        if self.ssdo.defaultZ != 0.0 and evalDim == 2 and self.isPRO:
            # evalDim = 3
            evalDim = 2
            minimumPoints = 2
            factor = factor2D[self.stdDeviations]
            zData = NUM.ones((self.ssdo.numObs,)) * self.ssdo.defaultZ
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
                ARCPY.AddIDMessage("Warning", 941)

            #### Verify Weight Sum ####
            self.weightSum = self.weights.sum()
            if not self.weightSum > 0.0:
                # ARCPY.AddIDMessage("ERROR", 898)
                msg = {}
                msg["messageCode"] = u"AO_{}".format(898)
                msg["message"] = ARCPY.GetIDMessage(898)
                ARCPY.AddError(JSON.dumps(msg))
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
            self.caseVals = NUM.ones((self.ssdo.numObs,), int)
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
        #### Calculate Mean Center and Standard Distance ####
        for ind, case in enumerate(self.uniqueCases):
            indices = NUM.where(self.caseVals == case)
            xy = self.xyCoords[indices]
            numFeatures = len(indices[0])
            w = self.weights[indices]
            w.shape = numFeatures, 1
            weightSum = w.sum()
            if (weightSum != 0.0) and (numFeatures > minimumPoints):
                xyz = NUM.zeros((xy.shape[0], xy.shape[1] + 1))
                xyz[:, :-1] = xy
                mcenter = (xyz - NUM.mean(xyz.T, axis=1)).T
                xyWeighted = (w / weightSum) * xyz

                #### Apply Weights ####
                if (weightSum > 0):
                    #### Calculating Weight Covariance Numpy V1.10  ddof=0 ####
                    aweight = NUM.asarray(w.flatten(), dtype=NUM.float)
                    avg, w_sum = NUM.average(mcenter, axis=1, weights=aweight,
                                             returned=True)
                    w_sum = w_sum[0]
                    #### Using Deg. of Freedom = 0 ####
                    fact = w_sum
                    mcenter -= avg[:, None]
                    mcenter_T = (mcenter * aweight).T
                    covmatrix = (UTILS.dot(mcenter, mcenter_T.conj()) / fact).squeeze()
                else:
                    covmatrix = NUM.cov(mcenter)

                try:
                    eigval, eigvec = NUM.linalg.eig(NUM.around(covmatrix, decimals=16))
                except NUM.linalg.linalg.LinAlgError as err:
                    badCases.append(case)
                    badCaseInd.append(ind)
                    continue

                #### Check Bad Values ####
                check = [(NUM.isnan(value) or
                          NUM.isinf(value) or
                          value < 0) for value in eigval]
                if any(check):
                    badCases.append(case)
                    badCaseInd.append(ind)
                    continue

                #### Std Dev by Dimensional Factor ####
                std = NUM.sqrt(eigval)
                std = std * factor;

                #### Add Threshold to Honor Z Environment ####
                if self.addZthreshold:
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
                                 label=caseField)

            #### Set Attributes ####
        self.meanCenter = meanCenter
        self.se = se
        self.badCases = badCases
        self.caseField = caseField
        self.weightField = weightField
        self.standardDevInfo = standardDevInfo
        self.vectorInfo = vectorInfo
        self.evalDim = evalDim

    def report(self, fileName=None):
        """Reports the Standard Ellipse results as a message or to a file.
        INPUTS:
        fileName {str, None}: path to a text file to populate with results
        """

        header = ARCPY.GetIDMessage(84210)
        # if (self.evalDim == 2):
        columns = [ARCPY.GetIDMessage(84191), ARCPY.GetIDMessage(84211),
                   ARCPY.GetIDMessage(84212), ARCPY.GetIDMessage(84213),
                   ARCPY.GetIDMessage(84214), ARCPY.GetIDMessage(84215)]

        results = [columns]

        for case in self.uniqueCases:
            if not self.caseField:
                strCase = "ALL"
            else:
                strCase = UTILS.caseValue2Print(case, self.caseIsString)

            # if self.evalDim == 2:
            meanX, meanY = self.meanCenter[case]
            seX, seY, degreeRotation, radianR1, radianR2 = self.se[case]
            rowResult = [strCase, LOCALE.format_string("%0.6f", meanX),
                         LOCALE.format_string("%0.6f", meanY),
                         LOCALE.format_string("%0.6f", seX),
                         LOCALE.format_string("%0.6f", seY),
                         LOCALE.format_string("%0.6f", radianR2)]

            results.append(rowResult)

        outputTable = UTILS.outputTextTable(results, header=header)
        if fileName:
            f = UTILS.openFile(fileName, "w")
            UTILS.writeText(f, outputTable)
            f.close()
        else:
            ARCPY.AddMessage(outputTable)

    def createOutput(self, outputFC, parameters=None):
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
                maxSE = NUM.array([i[0:2] for i in seValues]).max()
                largerExtent = UTILS.increaseExtentByConstant(ssdo.extent,
                                                              constant=maxSE)
                largerExtent = [LOCALE.str(i) for i in largerExtent]
                ARCPY.env.XYDomain = " ".join(largerExtent)

        #### Create Output Feature Class ####

        outPath, outName = OS.path.split(outputFC)

        seFieldNamesSelection = []

        badCaseRadians = []
        shapesValues = []
        xValues = []
        yValues = []
        seXValues = []
        seYValues = []
        radianR2Values = []
        caseValues = []
        baseInfo = base()

        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84126))
        ssdo.hasM = False
        ssdo.hasZ = False

        for ind, case in enumerate(self.uniqueCases):

            #### Get Results ####
            xVal, yVal, zVal = self.meanCenter[case]
            seX, seY, degreeRotation, radianR1, radianR2 = self.se[case]

            seX2 = seX ** 2.0
            seY2 = seY ** 2.0

            #### Create Empty Polygon Geomretry ####
            poly = ARCPY.Array()

            #### Check for Valid Radius ####
            seXZero = UTILS.compareFloat(0.0, seX, rTol=.0000001)
            seXNan = NUM.isnan(seX)
            seXBool = seXZero + seXNan
            seYZero = UTILS.compareFloat(0.0, seY, rTol=.0000001)
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
                    points = ARCPY.Array([ARCPY.Point(x[ind], y[ind], ssdo.defaultZ) for ind in NUM.arange(360)])
                except:
                    badRadian = 6
                    badCase = UTILS.caseValue2Print(case, self.caseIsString)
                    badCaseRadians.append(badCase)

            if badRadian < 6:
                #### Create and Populate New Feature ####
                polygon = ARCPY.Polygon(points, ssdo.spatialRef, ssdo.hasZ, ssdo.hasM)
                shapesValues.append(polygon)
                xValues.append(xVal)
                yValues.append(yVal)
                seXValues.append(seX)
                seYValues.append(seY)
                radianR2Values.append(radianR2)

                if caseField:
                    caseValue = self.uniqueCases.item(ind)
                    caseValues.append(caseValue)

        #### Report Bad Cases Due to Geometry (coincident pts) ####
        nBadRadians = len(badCaseRadians)
        if nBadRadians:
            if caseField:
                badCaseRadians = " ".join(badCaseRadians)
                ARCPY.AddIDMessage("WARNING", 1011, caseField, badCaseRadians)
            else:
                msg = {}
                msg["messageCode"] = u"AO_{}".format(978)
                msg["message"] = ARCPY.GetIDMessage(978)
                ARCPY.AddError(JSON.dumps(msg))
                # ARCPY.AddIDMessage("ERROR", 978)
                raise SystemExit()

        fields = None
        dataFields = None
        if caseField:
            localSeFieldNames = seFieldNames + [self.caseField]
            fields = localSeFieldNames
            dataFields = [NUM.array(xValues, dtype=float),
                          NUM.array(yValues, dtype=float),
                          NUM.array(seXValues, dtype=float),
                          NUM.array(seYValues, dtype=float),
                          NUM.array(radianR2Values, dtype=float),
                          NUM.array(caseValues)]
        else:
            fields = seFieldNames
            dataFields = [NUM.array(xValues, dtype=float),
                          NUM.array(yValues, dtype=float),
                          NUM.array(seXValues, dtype=float),
                          NUM.array(seYValues, dtype=float),
                          NUM.array(radianR2Values, dtype=float)]

        ##### Write Output ####
        if ssdo.spatialRef.name == "Unknown":
            createOutputUsingCursor(ssdo, caseField, outputFC,
                                    shapesValues, dataFields)
        else:

            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84003))
            conta = UTILS.DataContainer(ssdo.spatialRef,
                                        shapes=shapesValues)
            conta.generateOutput(outputFC, dataFields, fields)

        #### Return Extent to Normal if not Projected ####
        if ssdo.spatialRefType != "Projected":
            ARCPY.env.XYDomain = ""

        #### Set Attribute ####
        self.outputFC = outputFC

        #### Set the Default Symbology ####
        if parameters is None:
            params = ARCPY.gp.GetParameterInfo()
        else:
            params = parameters

        #### Install Path to Layer Files ####
        fullRLF = UTILS.pathLayers

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
            ARCPY.AddIDMessage("WARNING", 973)


if __name__ == "__main__":
    setupStandardEllipse()