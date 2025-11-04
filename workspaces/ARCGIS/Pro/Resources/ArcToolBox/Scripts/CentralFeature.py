# coding: utf-8
"""
Tool Name:  Central Feature
Source Name: CentralFeature.py
Version: ArcGIS 10.1

This script will identify the most centrally located feature in a point,
line, or polygon feature class (with weighting and grouping optional).
"""

################### Imports ########################
import os as OS
import sys as SYS
import collections as COLL
import numpy as NUM
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.da as DA
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import WeightsUtilities as WU
import locale as LOCALE
import logging
from loggerutils import init_ss_logger
from datetime import datetime

LOGGER = init_ss_logger(__name__, logging.DEBUG)
LOCALE.setlocale(LOCALE.LC_ALL, '')

cfRenderDict = { 0: "CentralFeaturePoints.lyrx",
                 1: "CentralFeaturePolylines.lyr",
                 2: "CentralFeaturePolygons.lyr",
                 3: "CentralFeaturePoints_3D.lyrx",
                 4: "CentralFeaturePoints_3D.lyr"}

def execute(parameters, messages):

    inputFC = UTILS.getTextParameter(0, parameters)
    outputFC = UTILS.getTextParameter(1, parameters)
    distanceMethod = UTILS.getTextParameter(2, parameters).upper().replace(" ", "_")
    weightField = UTILS.getTextParameter(3, parameters, fieldName = True) 
    potentialField = UTILS.getTextParameter(4, parameters, fieldName = True)
    caseField = UTILS.getTextParameter(5, parameters, fieldName = True)

    distanceMethod = distanceMethod.split("_")[0]
    fieldList = []
    if weightField:
        fieldList.append(weightField)

    if potentialField:
        fieldList.append(potentialField)

    if caseField:
        fieldList.append(caseField)

    #### Create a Spatial Stats Data Object (SSDO) ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC,
                                useChordal = False)

    #### Populate SSDO with Data ####
    ssdo.obtainData(ssdo.oidName, fieldList, minNumObs = 1,
                    requireGeometry = ssdo.complexFeature) 

    #### Run Analysis ####
    cf = CentralFeature(ssdo, distanceMethod = distanceMethod,
                        weightField = weightField, 
                        potentialField = potentialField,
                        caseField = caseField)

    #### Create Output ####
    cf.createOutput(outputFC, parameters)


class CentralFeature(object):
    """This tool identifies most centrally located feature (may be weighted).
    
    INPUTS: 
    ssdo (obj): instance of SSDataObject
    distanceMethod {str, EUCLIDEAN}: EUCLIDEAN or MANHATTAN 
    weightField {str, None}: field name used to weight to mean centers
    potentialField {str, None}: field name used to weight features self 
    caseField {str, None}: field name used to subset mean centers

    METHODS:
    createOutput: creates a feature class with central features
    report: reports results as a printed message or to a file

    ATTRIBUTES:
    cf (dict): [case field value] = ([central feature OIDs], sumDist) (1)
    ssdo (class): instance of SSDataObject
    caseKeys (list): sorted list of all cases for print/output
    
    NOTES:
    (1)  The key for the central feature dict (cf) is "ALL" if no case field is
         provided
    """
    def __init__(self, ssdo, distanceMethod="EUCLIDEAN",
                 weightField=None, potentialField=None, caseField=None, fromAGOL=False):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Set AGOL flag ####
        self.FLAG_AGOL = fromAGOL

        #### Set Data ####
        self.xyCoords = self.ssdo.xyCoords
        self.zCoords= self.ssdo.zCoords
        self.isGCS = self.ssdo.spatialRefType.upper() == "GEOGRAPHIC"

        ## Dimension
        if (self.ssdo.hasZ):
            evalDim = 3
        else:
            evalDim = 2
        
        self.evalDim = evalDim

        #### Use 3D in PRO ####
        self.isPRO = UTILS.isPRO()
        if not self.isPRO:
            self.evalDim = 2
        
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

        #### Verify Potential ####
        if potentialField:
            self.potential = self.ssdo.fields[potentialField].returnDouble()

            #### Report Negative Weights ####
            lessThanZero = NUM.where(self.potential < 0.0)
            if len(lessThanZero[0]):
                self.potential[lessThanZero] = 0.0
                LOGGER.warning(940, extra={"message_ID": 940})
        else:
            self.potential = NUM.zeros((self.ssdo.numObs,))

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
        cf = COLL.defaultdict(tuple)

        #### Calculate Central Feature ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84007), 
                            0, self.ssdo.numObs, 1)
                            
        if self.zCoords is not None and NUM.isnan(self.zCoords).sum() > 0:
            self.evalDim = 2
                            
        if (self.evalDim == 2):
            for case in self.uniqueCases:
                cfOIDs = []
                indices = NUM.where(self.caseVals == case)
                potent = self.potential[indices]
                xy = self.xyCoords[indices]
                meanAz = 0

                if self.isGCS:
                    meanAz = UTILS.meanCenterAngular(xy.T[0])
                    xTemp = xy.T[0] - meanAz
                    xy.T[0] = UTILS.normalize(xTemp)

                w = self.weights[indices]
                cfOrder, minSumDist = nsquaredDist(xy, weights = w,
                                                   potent = potent,
                                                   dType = distanceMethod)
                for cfOrd in cfOrder:
                    oid = ssdo.order2Master[indices[0][cfOrd]]
                    cfOIDs.append(oid)
                cf[case] = (cfOIDs, minSumDist)
        else:
           for case in self.uniqueCases:
                cfOIDs = []
                indices = NUM.where(self.caseVals == case)
                potent = self.potential[indices]
                xy = self.xyCoords[indices]

                if self.isGCS:
                    meanAz = UTILS.meanCenterAngular(xy.T[0])
                    xTemp = xy.T[0] - meanAz
                    xy.T[0] = UTILS.normalize(xTemp)

                w = self.weights[indices]
                xyz = NUM.zeros((xy.shape[0], xy.shape[1] + 1))
                xyz[:,:-1] = xy
                z = self.zCoords[indices]
                xyz[:,2] = z
                cfOrder, minSumDist = nsquaredDist(xyz, weights = w,
                                                   potent = potent,
                                                   dType = distanceMethod)
                for cfOrd in cfOrder:
                    oid = ssdo.order2Master[indices[0][cfOrd]]
                    cfOIDs.append(oid)
                cf[case] = (cfOIDs, minSumDist)


        #### Set Attributes ####
        self.ssdo = ssdo
        self.cf = cf
        self.caseField = caseField
        self.weightField = weightField
        self.potentialField = potentialField

    def report(self, fileName = None):
        """Reports the Central Feature results as a message or to a file.

        INPUTS:
        fileName {str, None}: path to a text file to populate with results.
        """

        header = ARCPY.GetIDMessage(84200)
        columns = [ARCPY.GetIDMessage(84191), ARCPY.GetIDMessage(84201), 
                   ARCPY.GetIDMessage(84202)]
        results = [ columns ]
        for case in self.uniqueCases:
            if not self.caseField:
                strCase = "ALL"
            else:
                strCase = UTILS.caseValue2Print(case, self.caseIsString)
            cfOIDs, minSumDist = self.cf[case]
            cfOIDs = [ "%i" % i for i in cfOIDs ]
            cfOIDs = ", ".join(cfOIDs)
            rowResult = [ strCase, 
                          cfOIDs,
                          LOCALE.format_string("%0.6f", minSumDist) ]
            results.append(rowResult)

        outputTable = UTILS.outputTextTable(results, header = header)
        if fileName:
            f = UTILS.openFile(fileName, "w")
            UTILS.writeText(f, outputTable)
            f.close()
        else:
            LOGGER.debug(outputTable)

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

        oidList = []
        caseList = []

        #### Create Output Feature Class ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84003))
        tempCFLayer = "tmpCFLayer"
        mfcNoExtent = UTILS.clearExtent(DM.MakeFeatureLayer)
        selectNoExtent = UTILS.clearExtent(DM.SelectLayerByAttribute)
        copyNoExtent = UTILS.clearExtent(DM.CopyFeatures)

        try:
            mfcNoExtent(ssdo.inputFC, tempCFLayer)
            first = True
            for key, value in UTILS.iteritems(self.cf):
                oids = value[0]
                for oid in oids:
                    if self.FLAG_AGOL:
                        oidList.append(oid)
                        if caseField:
                            caseList.append(key)
                    else:
                        sqlString = ssdo.oidName + '=' + "%i" % (oid)
                        if first:
                            selectNoExtent(tempCFLayer, 
                                        "NEW_SELECTION",
                                        sqlString)
                            first = False
                        else:
                            selectNoExtent(tempCFLayer,
                                        "ADD_TO_SELECTION", 
                                        sqlString)

            copyNoExtent(tempCFLayer, outputFC)

            if self.FLAG_AGOL:
                oidsInt = NUM.array([ssdo.master2Order[i] for i in oidList], dtype = int)
                caseVal = NUM.array(caseList).astype(datetime)

                xy = None
                z = None
                shapes = None

                #### Check Type Shape ####
                if ssdo.shapeType == "Point":
                    xy = ssdo.xyCoords[oidsInt]
                    if ssdo.hasZ:
                        z = ssdo.zCoords[oidsInt]
                else:
                    shapes = ssdo.shapes[oidsInt]

                #### Create Output Feature Class ####
                ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84003))
                outPath, outName = OS.path.split(outputFC)

                ssdo.newFieldTypeChecker.createFeatureClass(outputFC, ssdo.shapeType, ssdo.mFlag, 
                                                            ssdo.zFlag, ssdo.spatialRefString)
        except:
            LOGGER.error(210, extra={"message_ID": 210, "add_argument1": outputFC})
            raise SystemExit()

        if self.FLAG_AGOL:
            ### Initialize Shape Field ####
            shapeFieldNames = ["SHAPE@"]

            if caseField: # is not None:
                dataFieldNames = ["SOURCE_ID", caseField]
                typeFields = ["LONG", ssdo.fields[self.caseField.upper()].type.upper()]
            else:
                dataFieldNames = ["SOURCE_ID"]
                typeFields = ["LONG"]

            #### Add Fields in Output Feature Class ####
            for id, fieldName in enumerate(dataFieldNames):
                UTILS.addEmptyField(outputFC, fieldName, type = typeFields[id])

            #### List of All Fields ####
            allFieldNames = shapeFieldNames + dataFieldNames

            #### Create Cursor ####
            rows = DA.InsertCursor(outputFC, allFieldNames)

            #### Iterate Over Each Oid ####
            for ind, order in enumerate(oidsInt):
                shpObj = None

                #### Create Point ####
                if ssdo.shapeType == "Point":
                    if not ssdo.hasZ:
                        shpObj = ARCPY.Point(xy[ind][0],xy[ind][1])
                    else:
                        shpObj = ARCPY.Point(xy[ind][0],xy[ind][1], z[ind])
                else:
                    shpObj = shapes[ind]

                #### Create Record Depending on CaseField ####
                if caseField:  # is not None:
                    outputRow = [shpObj, oidList[ind], caseVal[ind]]
                else:
                    outputRow = [shpObj, oidList[ind]]

                rows.insertRow(outputRow)

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
            renderType = UTILS.renderType[self.ssdo.shapeType.upper()]
            if (self.ssdo.shapeType.upper() == 'POINT'):
                if self.evalDim == 3:
                    if self.isPRO:
                        renderLayerFile = cfRenderDict[3]
                    else:
                        renderLayerFile = cfRenderDict[4]
                else:
                    renderLayerFile = cfRenderDict[renderType]
            else:
                renderLayerFile = cfRenderDict[renderType]
            fullRLF = OS.path.join(fullRLF,renderLayerFile) 
            params[1].symbology = fullRLF
        except:
            LOGGER.warning(973, extra={"message_ID": 973})

######### Stand Alone Distance Method.  Currently ~ O(n**2) #########
######### Effort to Improve Algorithn Underway #########

def nsquaredDist(points, weights = None, potent = None, dType = "EUCLIDEAN"):
    """Method used to calculate the distance between each feature in the
    dataset.  The algorithm is near 0(n**2).  Effort to improve algorithn 
    is currently underway.

    INPUTS:
    points (array, numObs x 2): xy-coordinates for each feature
    weights {array, numObs x 1}: weights for each feature
    potent {array. numObs x 1}: self weights for each feature
    dType {str, EUCLIDEAN}: EUCLIDEAN or MANHATTAN (distance)

    OUTPUT:
    final (list): ids with minimum sum distance
    minSumDist (float): minimum sum distance
    """

    n,k = NUM.shape(points)
    maxMinSumDist = 3.402823466E+38

    if weights is None: 
        weights = NUM.ones((n,), float) 

    if potent is None:
        potent = NUM.zeros((n,), float)

    weightedPotential = weights * potent

    res = {}

    #### Calculate Sum of Weighted Distances For Each Feature ####
    weights.shape = n,1
    if dType == "EUCLIDEAN":
        for idx, point in enumerate(points):
            weightedDist = eucDistArray(point, points, weights) 
            res[idx] = weightedDist + (weights[idx] * potent[idx])
            ARCPY.SetProgressorPosition()
    else:
        for idx, point in enumerate(points):
            weightedDist = manDistArray(point, points, weights) 
            res[idx] = weightedDist + weightedPotential[idx]
            ARCPY.SetProgressorPosition()

    #### Minimum Sum of Weighted Distances (Central Feature) ####
    minSumDist = min(UTILS.itervalues(res))
    final = [ key for key,val in UTILS.iteritems(res) if(UTILS.compareFloat(0.0, (val - minSumDist), rTol = .0001))]

    return final, minSumDist

def eucDistArray(point, points, w):
    diff = (point - points)**2.0
    return NUM.dot(NUM.sqrt(diff.sum(1)), w)

def manDistArray(point, points, w):
    diff = abs(point - points)
    return NUM.dot(diff.sum(1), w)

