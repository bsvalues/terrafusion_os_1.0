# coding: utf-8
"""
Tool Name:  Hot Spot Analysis (Getis-Ord Gi*)
Source Name: Gi.py
Version: ArcGIS 10.1
Author: ESRI

This function performs the 1995 Getis and Ord Gi* statistic. For more
details, see: _The ESRI Guide to GIS Analysis_, Volume 2, Chapter 4 or
Ord, J.K. and Arthur Getis.  1995.  "Local Spatial Autocorrelation
Statistics." _Geographical Analysis_ 27(4): 287-306.
"""

################### Imports ########################
import sys as SYS
import os as OS
import locale as LOCALE
import numpy as NUM
import arcgisscripting as ARC
import arcpy as ARCPY
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import Stats as STATS
import WeightsUtilities as WU
import gapy as GAPY
import numpy.random as RAND
import random as PYRAND
import warnings as WARNINGS
import collections as COLL
import logging

from loggerutils import init_ss_logger
LOGGER = init_ss_logger(__name__, logging.DEBUG)
APPENDSIMULATIONS = False

################ Output Field Names #################
giFieldNames = ["GiZScore", "GiPValue", "NNeighbors"]
giPseudoFieldName = "GiPseudoP"
giBinFieldName = "Gi_Bin"
giTextFieldName = "Gi_Text"
giTextFieldAlias = "Statistical Significance"
giRateFieldName = "SS_RATE"

giRenderDict = { 0: "LocalGPoints",
                 1: "LocalGPolylines",
                 2: "LocalGPolygons" }

hotMessage = ARCPY.GetIDMessage(84510)
coldMessage = ARCPY.GetIDMessage(84512)

cvDomain = { -3: coldMessage.format(99), 
                -2: coldMessage.format(95), 
                -1: coldMessage.format(90), 
                0: ARCPY.GetIDMessage(84511), 
                1: hotMessage.format(90), 
                2: hotMessage.format(95), 
                3: hotMessage.format(99)}

hotMessageShort = ARCPY.GetIDMessage(220902)
colMessageShort = ARCPY.GetIDMessage(220903)

cvDomainShort = { -3: colMessageShort.format(99), 
                -2: colMessageShort.format(95), 
                -1: colMessageShort.format(90), 
                0: ARCPY.GetIDMessage(84511), 
                1: hotMessageShort.format(90), 
                2: hotMessageShort.format(95), 
                3: hotMessageShort.format(99)}


def execute(parameters, messages):

    inputFC = UTILS.getTextParameter(0, parameters)
    varName = UTILS.getTextParameter(1, parameters).upper()
    varNameList = [varName]
    outputFC = UTILS.getTextParameter(2, parameters)

    #### Parse Space Concept ####
    spaceConcept = UTILS.getTextParameter(3, parameters).upper().replace(" ", "_")
    if spaceConcept == "INVERSE_DISTANCE_SQUARED":
        exponent = 2.0
    else:
        exponent = 1.0
    try:
        spaceConcept = WU.convertConcept[spaceConcept]
        wType = WU.weightDispatch[spaceConcept]
    except:
        ARCPY.AddIDMessage("ERROR", 723)
        raise SystemExit()

    #### EUCLIDEAN or MANHATTAN ####
    distanceConcept = UTILS.getTextParameter(4, parameters).upper().replace(" ", "_")
    concept = WU.conceptDispatch[distanceConcept]

    #### Row Standardized Not Used in Hot Spot Analysis ####
    #### Results Are Identical With or Without ####
    #### Remains in UI for Backwards Compatibility ####
    rowStandard = UTILS.getTextParameter(5, parameters).upper()

    #### Distance Threshold ####
    threshold = UTILS.getNumericParameter(6, parameters)

    #### Self Potential Field ####
    potentialField = UTILS.getTextParameter(7, parameters, fieldName = True)
    if potentialField:
        varNameList.append(potentialField)

    #### Spatial Weights File ####
    weightsFile = UTILS.getTextParameter(8, parameters)
    if weightsFile is None and wType == 8:
        ARCPY.AddIDMessage("ERROR", 930)
        raise SystemExit()
    if weightsFile and wType != 8:
        ARCPY.AddIDMessage("WARNING", 925)
        weightsFile = None

    #### Number of Neighbors ####
    numNeighs = UTILS.getNumericParameter(13, parameters)
    if numNeighs is None:
        numNeighs = 0

    #### FDR ####
    applyFDR = parameters[9].value

    #### Create a Spatial Stats Data Object (SSDO) ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC, useChordal = True)

    #### Set Unique ID Field ####
    masterField = UTILS.setUniqueIDField(ssdo, weightsFile = weightsFile)

    #### Populate SSDO with Data ####
    if WU.gaTypes[spaceConcept]:
        ssdo.obtainData(masterField, varNameList, minNumObs = 3,
                        requireSearch = True, warnNumObs = 30)
    else:
        ssdo.obtainData(masterField, varNameList, minNumObs = 3,
                        warnNumObs = 30)

    #### Report and Set Parameters ####
    with WARNINGS.catch_warnings():
        WARNINGS.simplefilter("ignore")
        #### Run Hot-Spot Analysis ####
        gi = LocalG(ssdo, varName, outputFC, wType, weightsFile = weightsFile,
                    concept = concept, threshold = threshold,
                    exponent = exponent, numNeighs = numNeighs,
                    potentialField = potentialField, applyFDR = applyFDR)

        giField, pvField = gi.outputResults()
        try:
            UTILS.setParameterAsText(10, giField, parameters)
            UTILS.setParameterAsText(11, pvField, parameters)
            UTILS.setParameterAsText(12, gi.ssdo.masterField, parameters)
        except:
            ARCPY.AddIDMessage("WARNING", 902)
        gi.renderResults(parameters)

#################### Classes ########################

class LocalG(object):
    """Calculates 1995 Getis and Ord Gi* statistic:

    INPUTS:
    ssdo (obj): instance of SSDataObject
    varName (str): name of analysis field
    outputFC (str): path to output feature class
    wType (int): spatial conceptualization (1)
    weightsFile {str, None}: path to a spatial weights matrix file
    concept: {str, EUCLIDEAN}: EUCLIDEAN or MANHATTAN
    rowStandard {bool, True}: row standardize weights?
    threshold {float, None}: distance threshold
    exponent {float, 1.0}: distance decay
    numNeighs {int, 0}: number of neighbors (2)
    potentialField {str, None}: name of self potential field
    thresholdOrigin {str, None}: original value and unit of the threshold before transformation

    ATTRIBUTES:
    numObs (int): number of features in analysis
    y (array, numObs x 1): vector of field values
    potVals (array, numObs x 1): vector of self potential values
    gi (array, numObs x 1): Local Gi* values
    pVals (array, numObs x 1): probability values (two-tailed)

    NOTES:
    (1) See the wTypeDispatch dictionary in WeightsUtilities.py for a
        complete list of spatial conceptualizations and their corresponding
        integer values.
    (2) For explicit use in KNN or can be used to modify distance-based
        methods to assure at least this number of neighbors if not enough
        based on given distance band.
    """

    def __init__(self, ssdo, varName, outputFC, wType,
                 weightsFile = None, concept = "EUCLIDEAN",
                 threshold = None, exponent = 1.0, numNeighs = 0,
                 potentialField = None, permutations = None,
                 applyFDR = False, pType = "BOOT", thresholdOrigin = None,
                 normField = None, sensitivity = None, enableProgress = True):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Assess Whether SWM File Being Used ####
        self.swmFileBool = False
        if weightsFile:
            weightSuffix = weightsFile.split(".")[-1].lower()
            self.swmFileBool = (weightSuffix == "swm")

        #### Create Shape File Boolean for NULL Values ####
        self.outShapeFileBool = UTILS.isShapeFile(outputFC)

        if sensitivity is None:
            #### Initialize Data ####
            self.initialize()
            #### Construct Based on SWM File or On The Fly ####
            self.construct()

    def initialize(self, yData = None):
        """Populates the instance of the Spatial Statistics Data
        Object (SSDataObject) and resolves a default distance threshold
        if none given.
        """

        #### Shorthand Attributes ####
        ssdo = self.ssdo
        varName = self.varName
        concept = self.concept
        threshold = self.threshold
        exponent = self.exponent
        wType = self.wType
        weightsFile = self.weightsFile
        swmFileBool = self.swmFileBool
        masterField = ssdo.masterField
        potentialField = self.potentialField
        thresholdOrigin = self.thresholdOrigin
        normField = self.normField

        #### Get Data Array ####
        field = ssdo.fields[varName]
        self.fieldNames = [varName]

        if yData is not None:
            if self.normField:
                #### Create Rate Data ####
                num = NUM.asarray(yData, dtype=float)
                denom = ssdo.fields[normField].returnDouble()
                self.y = num / denom
                self.fieldNames.append(normField)
            else:
                self.y = NUM.asarray(yData, dtype=float)
        else:
            if self.normField:
                #### Create Rate Data ####
                num = field.returnDouble()
                denom = ssdo.fields[normField].returnDouble()
                self.y = num / denom
                self.fieldNames.append(normField)
            else:
                self.y = field.returnDouble()

        self.numObs = ssdo.numObs
        maxSet = False

        #### Check Number of Neighbors Parameter ####
        self.numNeighs = WU.getValidNumNeighs(self.numNeighs, ssdo.numObs, wType)

        #### Distance Threshold ####
        if wType in [0, 1, 7]:
            if threshold is None:
                threshold, avgDist = WU.createThresholdDist(ssdo, 
                                                concept = concept,
                                                enableProgress = self.enableProgress)


            #### Assures that the Threshold is Appropriate ####
            gaExtent = UTILS.get92Extent(ssdo.extent)
            fixed = (wType == 1)
            threshold, maxSet = WU.checkDistanceThreshold(ssdo, threshold,
                                                          weightType = wType,
                                                          thresholdOrigin = thresholdOrigin)

            #### If the Threshold is Set to the Max ####
            #### Set to Zero for Script Logic ####
            if maxSet:
                #### All Locations are Related ####
                if self.numObs > 500:
                    ARCPY.AddIDMessage("WARNING", 717)

        #### Resolve Self Potential Field (Default to 1.0) ####
        if potentialField:
            potField = ssdo.fields[potentialField]
            self.potVals = potField.returnDouble()
            self.fieldNames.append(potentialField)

            #### Warn if Negative Self Weights ####
            sumNeg = NUM.sum(self.potVals < 0.0)
            if sumNeg:
                ARCPY.AddIDMessage("WARNING", 940)
                #### Set Negative Weights to Zero ####
                self.potVals = NUM.where(self.potVals < 0.0, 0.0,
                                         self.potVals)

        else:
            if weightsFile and not swmFileBool:
                self.potVals = None
            else:
                self.potVals = NUM.ones(self.numObs)

        #### Set Attributes ####
        self.maxSet = maxSet
        self.threshold = threshold
        self.master2Order = ssdo.master2Order
        self.swmFileBool = swmFileBool

    def construct(self, getJustYMean = False):
        """Constructs the neighborhood structure for each feature and
        dispatches the appropriate values for the calculation of the
        statistic."""

        swm = None      # added to address Coverity CID 278243
        gaTable = None  # added to address Coverity CID 278251

        #### Shorthand Attributes ####
        ssdo = self.ssdo
        varName = self.varName
        concept = self.concept
        gaConcept = concept.lower()
        threshold = self.threshold
        exponent = self.exponent
        wType = self.wType
        numObs = self.numObs
        master2Order = self.master2Order
        masterField = ssdo.masterField
        weightsFile = self.weightsFile
        potentialField = self.potentialField
        self.warnUser = True

        #### Assure that Variance is Larger than Zero ####
        yVar = NUM.var(self.y)
        if NUM.isnan(yVar) or yVar <= 1e-12:
            LOGGER.error(906, extra={"message_ID": 906})
            raise SystemExit()

        #### Create Summed Variables ####
        self.intRange = NUM.arange(numObs)
        self.floatN = self.numObs * 1.0
        ySum = self.y.sum()
        ySum2 = (self.y**2.0).sum()
        self.yBar = ySum / self.floatN
        self.S = NUM.sqrt( (ySum2 / self.floatN) - self.yBar**2.0 )
        self.nm1 = self.floatN - 1.0

        #### Assure Global Portion of Local Denom is Larger than Zero ####
        if UTILS.compareFloat(self.S, 0.0):
            LOGGER.error(110539, extra={"message_ID": 110539, "add_argument1": self.varName})
            raise SystemExit()

        #### Create Base Data Structures/Variables ####
        self.gi = NUM.zeros(numObs)
        self.pVals = NUM.ones(numObs)
        self.neighbors = NUM.zeros(numObs, dtype = NUM.int32)
        if self.permutations:
            self.pseudoPVals = NUM.ones(numObs)

        #### Set Neighborhood Structure Type ####
        if self.weightsFile:
            if self.swmFileBool:
                #### Open Spatial Weights and Obtain Chars ####
                swm = WU.SWMReader(weightsFile)
                N = swm.numObs
                rowStandard = swm.rowStandard
                self.swm = swm

                #### Check to Assure Complete Set of Weights ####
                if numObs > N:
                    ARCPY.AddIDMessage("ERROR", 842, numObs, N)
                    raise SystemExit()

                #### Check if Selection Set ####
                isSubSet = False
                if numObs < N:
                    isSubSet = True
                iterVals = UTILS.ssRange(N)
            else:
                #### Warning for GWT with Bad Records/Selection ####
                if ssdo.selectionSet or ssdo.badRecords:
                    ARCPY.AddIDMessage("WARNING", 1029)

                #### Build Weights Dictionary ####
                weightDict = WU.buildTextWeightDict(weightsFile, master2Order)
                iterVals = UTILS.iterkeys(master2Order)
                N = numObs

        elif wType in [4, 5]:
            #### Polygon Contiguity ####
            if wType == 4:
                contiguityType = "ROOK"
            else:
                contiguityType = "QUEEN"

            polyNeighDict = ssdo.getPolygonNeighbors(contiguityType = contiguityType)
            iterVals = UTILS.iterkeys(master2Order)
            N = numObs

        else:
            gaTable = ssdo.gaTable
            gaSearch = GAPY.ga_nsearch(gaTable)
            if wType == 7:
                #### Zone of Indiff, All Related to All ####
                gaSearch.init_nearest(threshold, numObs, gaConcept)
            elif wType == 2:
                #### k-Nearest Neighbors ####
                gaSearch.init_nearest(0.0, self.numNeighs, gaConcept)
            else:
                #### Inverse and Fixed Distances ####
                gaSearch.init_nearest(threshold, self.numNeighs, gaConcept)

            iterVals = UTILS.ssRange(numObs)
            N = numObs
            neighWeights = ARC._ss.NeighborWeights(gaTable, gaSearch,
                                                 weight_type = wType,
                                                 exponent = exponent,
                                                row_standard = False,
                                                 include_self = True)

        #### Create Progressor ####
        msg = ARCPY.GetIDMessage(84007)
        if self.permutations:
            msg += ": Using Permutations = %i" % self.permutations

        if self.enableProgress:
            ARCPY.SetProgressor("step", msg , 0, N, 1)


        #### Obtain the Y Mean without calculate GI ####  
        yMean = None
        if getJustYMean:
            yMean = NUM.zeros(N, float) 

        #### Create Neighbor Info Class ####
        ni = WU.NeighborInfo(masterField, not self.enableProgress)

        #### Calculation For Each Feature ####
        for i in iterVals:
            # Added 'and swm' to address Coverity CID 278243
            if self.swmFileBool and swm:
                #### Using SWM File ####
                info = swm.swm.readEntry()
                masterID = info[0]
                if masterID in master2Order:
                    rowInfo = WU.getWeightsValuesSWM(info, master2Order,
                                                     self.y,
                                                     rowStandard = rowStandard,
                                                     potVals = self.potVals)
                    includeIt = True
                else:
                    includeIt = False

            elif self.weightsFile and not self.swmFileBool:
                #### Text Weights ####
                masterID = i
                includeIt = True
                rowInfo = WU.getWeightsValuesText(masterID, master2Order,
                                                  weightDict, self.y,
                                                  potVals = self.potVals,
                                                  allowSelf = True)

            elif wType in [4, 5]:
                #### Polygon Contiguity ####
                masterID = i
                includeIt = True
                rowInfo = WU.getWeightsValuesCont(masterID, master2Order,
                                                  polyNeighDict, self.y,
                                                  rowStandard = False,
                                                  potVals = self.potVals)

            else:
                #### Distance Based ####
                masterID = gaTable[i][0]
                includeIt = True
                rowInfo = WU.getWeightsValuesOTF_Potent(neighWeights, i, 
                                                        self.y,
                                                        self.potVals)

            #### Subset Boolean for SWM File ####
            if includeIt:
                #### Parse Row Info ####
                orderID, yiVal, nhIDs, nhVals, weights = rowInfo

                #### Assure Neighbors Exist After Selection ####
                nn, nhIDs, nhVals, weights = ni.processInfo(masterID, nhIDs,
                                                            nhVals, weights)

                if getJustYMean:
                    yMean[orderID] = NUM.mean(nhVals)
                    continue

                if nn:
                    #### Calculate Local G ####
                    self.calculateGI(orderID, yiVal, nhVals, weights)

            if self.enableProgress:
                ARCPY.SetProgressorPosition()

        #### Clean Up ####
        if self.swmFileBool:
            swm.close()

        #### Return Y Mean ####
        if getJustYMean:
            return yMean

        #### Report on Features with No Neighbors ####
        ni.reportNoNeighbors(failAllNoNeighs = False, throwWarning = self.enableProgress)
        self.setNullValues(ni.idsNoNeighs)

        #### Report on Features with Large Number of Neighbors ####
        ni.reportWarnings()
        ni.reportMaximums()
        self.neighInfo = ni

        #### Set p-values for Gi Bins ####
        if self.permutations:
            #### Use Pseudo p-values ####
            pv = self.pseudoPVals
        else:
            #### Use Traditional p-values ####
            pv = self.pVals

        self.pv = pv

        toolMSG = ARCPY.GetIDMessage(84466)
        if self.applyFDR:
            #### Set Bins Using FDR ####
            msg = ARCPY.GetIDMessage(84472).format(toolMSG)
            if self.enableProgress:
                ARCPY.SetProgressor("default", msg)
            self.giBins = STATS.fdrTransform(pv, self.gi)
        else:
            msg = ARCPY.GetIDMessage(84473).format(toolMSG)
            if self.enableProgress:
                ARCPY.SetProgressor("default", msg)
            self.giBins = STATS.pValueBins(pv, self.gi)

    def calculateGI(self, orderID, yiVal, nhVals, weights):
        """Calculates Local Gi* for a given feature.

        INPUTS:
        orderID (int): order in corresponding numpy value arrays
        yiVal (float): value for given feature
        nhVals (array, nn): values for neighboring features (1)
        weights (array, nn): weight values for neighboring features (1)

        NOTES:
        (1)  nn is equal to the number of neighboring features
        """

        sumW = weights.sum()
        sumW2 = (weights**2.0).sum()
        lagVal = (nhVals * weights).sum()
        ei = (sumW * self.yBar)
        dev = lagVal - ei
        denomNum = (self.floatN * sumW2) - sumW**2.0
        denomG = self.S * NUM.sqrt(denomNum/self.nm1)

        #### Avoid RuntimeWarning ####
        giVal = 0
        pVal = 0
        if (denomG == 0.0):
            giVal = NUM.nan
            pVal = NUM.nan
            if self.warnUser:
                #### Throw Warning One Time If Location Has NULL Result ####
                LOGGER.warning(906, extra={"message_ID": 906})
                self.warnUser = False
        else:
            giVal = dev / denomG
            pVal = STATS.zProb(giVal, type = 2)

        #### Assign To Result Vectors ####
        self.gi[orderID] = giVal
        self.pVals[orderID] = pVal
        self.neighbors[orderID] = len(nhVals)

        #### Do Permutations ####
        if self.permutations:
            numNHS = len(nhVals)
            if self.pType == "BOOT":
                randomInts = RAND.random_integers(0, self.numObs-1,
                                                  (self.permutations, numNHS))
            else:
                randomInts = NUM.zeros((self.permutations, numNHS), int)
                for perm in UTILS.ssRange(self.permutations):
                    randomInts[perm] = PYRAND.sample(self.intRange, numNHS)
            nhValsPerm = self.y[randomInts]
            lagValsPerm = (nhValsPerm * weights).sum(1)
            devs = lagValsPerm - ei
            giValsPerm = devs / denomG
            pseudoP = STATS.pseudoPValue(giVal, giValsPerm)
            self.pseudoPVals[orderID] = pseudoP

    def setNullValues(self, idsNoNeighs):
        """Set no neighbor data for a given features (1).

        INPUTS:
        idsNoNeighs (list): unique ID values that have no neighbors

        NOTES:
        (1)   The no neighbor result differs for shapefiles as it has no NULL
              value capabilities.
        """

        for id in idsNoNeighs:
            orderID = self.ssdo.master2Order[id]
            if self.outShapeFileBool:
                self.gi[orderID] = 0.0
                self.pVals[orderID] = 1.0
                if self.permutations:
                    self.pseudoPVals[orderID] = 1.0
            else:
                self.gi[orderID] = NUM.nan
                self.pVals[orderID] = NUM.nan
                if self.permutations:
                    self.pseudoPVals[orderID] = NUM.nan

    def outputResults(self, addTextField = False, newFields = None, listFieldsToAddFromSouuce = None,
                       ouputPathInWorkspace = None, includeOriginalAnalysisVariable = True):
        """Creates output feature class Local Gi*."""
        outputFC = self.outputFC

        #### Prepare Derived Variables for Output Feature Class ####
        if ouputPathInWorkspace is not None:
            outPath, outName = OS.path.split(ouputPathInWorkspace)
            outputFC = ouputPathInWorkspace
        else:
            outPath, outName = OS.path.split(self.outputFC)

        fieldOrder = UTILS.getFieldNames(giFieldNames, outPath)
        fieldData = [self.gi, self.pVals, self.neighbors]
        fieldTypes = ["DOUBLE","DOUBLE","LONG"]

        #### Add Norm Field ####
        if self.normField:
            fieldOrder = [giRateFieldName] + fieldOrder
            fieldData = [self.y] + fieldData
            fieldTypes = ["DOUBLE"] + fieldTypes

        #### Add Pseudo-P Field ####
        if self.permutations:
            fieldOrder.append(giPseudoFieldName)
            fieldData.append(self.pseudoPVals)
            fieldTypes.append("DOUBLE")

        #### Add Gi Bin Field ####
        fieldOrder.append(giBinFieldName)
        fieldData.append(self.giBins)
        fieldTypes.append("LONG")

        #### Create Alias Field Names ####
        rowStandard = False
        if self.wType == 8:
            addString = OS.path.basename(self.weightsFile)
        elif self.wType == 2:
            addString = str(self.numNeighs)
        elif self.wType in [0, 1, 7]:
            if self.maxSet:
                addString = "0"
            else:
                addString = str(int(self.threshold))
        else:
            addString = None

        aliasList = WU.createSpatialFieldAliases(fieldOrder,
                                                 addString = addString,
                                                 wType = self.wType,
                                                 exponent = self.exponent,
                                                 rowStandard = rowStandard)
        if self.applyFDR:
            aliasList[-1] += "_FDR"

        #### Adjust Rate Field Alias ####
        if self.normField:
            aliasList[0] = u"{0} per {1}".format(self.varName, self.normField)

        #### Create/Populate Dictionary of Candidate Fields ####
        candidateFields = {}
        for fieldInd, fieldName in enumerate(fieldOrder):
            fieldType = fieldTypes[fieldInd]
            candidateField = SSDO.CandidateField(fieldName, fieldType,
                                                 fieldData[fieldInd],
                                                 alias = aliasList[fieldInd])
            candidateFields[fieldName] = candidateField

        #### Input Fields to Copy to Output FC ####
        appendFields = [i for i in self.fieldNames]
        if not includeOriginalAnalysisVariable:
            appendFields.remove(self.varName)

        #### Add Fields from Source FC ####
        if listFieldsToAddFromSouuce is not None:
            appendFields.extend([i for i in listFieldsToAddFromSouuce])

        #### Optionally Add Text Field Output ####
        if addTextField:
            candidateFields[giTextFieldName] = self.returnTextField()

        if newFields is not None:
            for field in newFields:
                fieldOrder.append(field.name)
                candidateFields[field.name] = field 

        #### Add Date-Time Field If Applicable ####
        if self.swmFileBool:
            if self.swm.wType == 9:
                if self.swm.timeField.upper() in self.ssdo.allFields:
                    appendFields.insert(0, self.swm.timeField.upper())

        #### Write Data to Output Feature Class ####
        self.ssdo.output2NewFC(outputFC, candidateFields,
                               appendFields = appendFields,
                               fieldOrder = fieldOrder)

        return fieldOrder[0], fieldOrder[1]

    def returnTextField(self):
        labelArray = NUM.chararray(self.numObs, itemsize=30)
        hotMessage = ARCPY.GetIDMessage(84510)
        coldMessage = ARCPY.GetIDMessage(84512)
        labelArray[self.giBins == 3] = hotMessage.format(99)
        labelArray[self.giBins == 2] = hotMessage.format(95)
        labelArray[self.giBins == 1] = hotMessage.format(90)
        labelArray[self.giBins == 0] = ARCPY.GetIDMessage(84511)
        labelArray[self.giBins == -1] = coldMessage.format(90)
        labelArray[self.giBins == -2] = coldMessage.format(95)
        labelArray[self.giBins == -3] = coldMessage.format(99)
        labelField = SSDO.CandidateField(giTextFieldName, "TEXT", labelArray, 
                                         alias = giTextFieldAlias)
        return labelField

    def renderResults(self, parameters = None, simulationInformation = None):
        #### Set the Default Symbology ####
        isPro = UTILS.isPRO()
        if parameters is None:
            params = ARCPY.gp.GetParameterInfo()
        else:
            params = parameters

        #### Install Path to Layer Files ####
        fullRLF =  UTILS.pathLayers
        outputParameterIndex = 2
        dataLyr = None

        ### Add information in the CIM Layer ###
        if simulationInformation is not None:
            outputParameterIndex = 1
            # dataLyr = {"field":"PredGiBin", "heading":"Predominant Category"}
            dataLyr = simulationInformation
        try:
            renderType = UTILS.renderType[self.ssdo.shapeType.upper()]
            renderLayerFile = giRenderDict[renderType]
            if isPro:
                renderLayerFile += ".lyrx"
                UTILS.buildLocaleCIMLayer(renderLayerFile, outputParameterIndex, data = dataLyr)
            else:
                renderLayerFile += ".lyr"
                fullRLF = OS.path.join(fullRLF, renderLayerFile)
                params[2].symbology = fullRLF
        except:
            ARCPY.AddIDMessage("WARNING", 973)

        #### Set Chart Output ####
        if isPro:
            y = self.ssdo.fields[self.varName].returnDouble()
            numBreaks = int(STATS.riskFunBins(y, 8, 64, 1))
            riceBreaks = STATS.riceBins(self.ssdo.numObs)

            #### Get Mapped Output Field Name ####
            outFieldName = self.ssdo.in2OutFieldMap[self.varName]
            outFieldNameAlias = self.ssdo.fields[self.varName].alias
            title = ARCPY.GetIDMessage(84795).format(outFieldNameAlias)
            if riceBreaks < numBreaks:
                numBreaks = riceBreaks

            chart = ARCPY.Chart(ARCPY.GetIDMessage(221000))
            chart.type = "histogram"
            chart.xAxis.field = outFieldName
            chart.xAxis.title = outFieldNameAlias
            chart.title = title
            chart.histogram.binCount = numBreaks
            chart.histogram.showMean = True
            chart.histogram.showMedian = True
            chart.histogram.showStandardDeviation = True

            if simulationInformation is not None:
                chart2 = ARCPY.charts.MatrixHeat(x="GIBIN_CAT", y="PredCat",
                                aggregation="count", title=ARCPY.GetIDMessage(220891))
                #### Original Hot Spot Category ####
                chart2.xAxis.title = ARCPY.GetIDMessage(220997)
                #### Predominant Hot Spot Category ####
                chart2.yAxis.title = ARCPY.GetIDMessage(220998)

                chart3 = ARCPY.charts.Bar(x="PredCat", 
                                          y=["NumSimC99","NumSimC95","NumSimC90","NumSimNS","NumSimH90","NumSimH95","NumSimH99"],
                                          aggregation = "sum",
                                          multiSeriesDisplay = "stacked100")
                #### Predominant Hot Spot Category ####
                chart3.xAxis.title  = ARCPY.GetIDMessage(220998)
                chart3.yAxis.title  = ARCPY.GetIDMessage(220999)
                chart3.title = ARCPY.GetIDMessage(220892)

                params[outputParameterIndex].charts = [chart2]
            else:
                params[outputParameterIndex].charts = [chart]

class LocalGSensitivity(object):
    def __init__(self):
        self.parameters = None
        pass

    def execute(self, Input_Feature_Class,
                        Input_Field,
                        Output_Feature_Class,
                        Conceptualization_of_Spatial_Relationships,
                        Distance_Method,
                        Standardization,
                        Distance_Band_or_Threshold_Distance,
                        Self_Potential_Field,
                        Weights_Matrix_File,
                        Apply_False_Discovery_Rate__FDR__Correction,
                        number_of_neighbors,
                        sensitivity_info, parameters ):

        #### Import Modules ####
        import scipy.stats as SPSTAT
        import SSAttributeUncertainty as SSU

        #### Set Initial Variables ####
        inputFC = Input_Feature_Class
        varName = Input_Field.upper()
        fields = set()
        fields.add(varName)
        self.parameters = parameters
        if sensitivity_info['uncertainty_measure'] == "MOE":
            senFields = sensitivity_info['moe_field'].split(" ")
            sensitivity = {"MOE": senFields[1]}
            for field in senFields:
                fields.add(field.upper())
        if sensitivity_info['uncertainty_measure'] == "CONFIDENCE_BOUNDS":
            senFields = sensitivity_info['confidence_bound_field'].split(" ")
            sensitivity = {"lowField": senFields[1], "highField": senFields[2]}
            if senFields[1] in [None, "", "#"] or senFields[2] in [None, "", "#"]:
                ARCPY.AddError(fr"The Lower and Higher Bound Field should be provided for {senFields[0]}")
                raise SystemExit()
            for field in senFields:
                fields.add(field.upper())
        if sensitivity_info['uncertainty_measure'] == "PERCENTAGE":
            senFields = sensitivity_info['randomize_pct'].split(" ")
            sensitivity = {"percentageLow": UTILS.strToFloat(senFields[1]), "percentageHigh": UTILS.strToFloat(senFields[2])}

        sensitivity.update(sensitivity_info)

        varNameList = [fld for fld in fields]
        outputFC = Output_Feature_Class

        #### Parse Space Concept ####
        spaceConcept = Conceptualization_of_Spatial_Relationships.upper().replace(" ", "_")
        self.neighborhoodType = spaceConcept
        if spaceConcept == "INVERSE_DISTANCE_SQUARED":
            exponent = 2.0
        else:
            exponent = 1.0
        try:
            spaceConcept = WU.convertConcept[spaceConcept]
            wType = WU.weightDispatch[spaceConcept]
        except:
            ARCPY.AddIDMessage("ERROR", 723)
            raise SystemExit()

        #### EUCLIDEAN or MANHATTAN ####
        distanceConcept = Distance_Method.upper().replace(" ", "_")
        concept = WU.conceptDispatch[distanceConcept]

        #### Row Standardized Not Used in Hot Spot Analysis ####
        #### Results Are Identical With or Without ####
        #### Remains in UI for Backwards Compatibility ####
        rowStandard = Standardization.upper()

        if Distance_Band_or_Threshold_Distance is not None:
            Distance_Band_or_Threshold_Distance = UTILS.strToFloat(Distance_Band_or_Threshold_Distance)

        #### Distance Threshold ####
        threshold = Distance_Band_or_Threshold_Distance

        #### Self Potential Field ####
        potentialField = Self_Potential_Field
        if potentialField is not None and potentialField != "#":
            varNameList.append(potentialField)

        #### Spatial Weights File ####
        weightsFile = Weights_Matrix_File
        if  weightsFile is None and wType == 8:
            ARCPY.AddIDMessage("ERROR", 930)
            raise SystemExit()
        if weightsFile and wType != 8:
            ARCPY.AddIDMessage("WARNING", 925)
            weightsFile = None

        #### Number of Neighbors ####
        if number_of_neighbors is not None:
            number_of_neighbors = int(number_of_neighbors)

        numNeighs = number_of_neighbors
        if numNeighs is None:
            numNeighs = 0

        #### FDR ####
        applyFDR = Apply_False_Discovery_Rate__FDR__Correction == "APPLY_FDR"

        #### Create a Spatial Stats Data Object (SSDO) ####
        ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC, useChordal = True)

        #### Set Unique ID Field ####
        masterField = UTILS.setUniqueIDField(ssdo, weightsFile = weightsFile)

        #### Populate SSDO with Data ####
        if WU.gaTypes[spaceConcept]:
            ssdo.obtainData(masterField, varNameList, minNumObs = 3,
                            requireSearch = True, warnNumObs = 30)
        else:
            ssdo.obtainData(masterField, varNameList, minNumObs = 3,
                            warnNumObs = 30)


        #### Get Morans I  ann YMean####
        yMeanNeighbors = None

        #### Check if the confidence level is provided when MOE option is used ####
        if "MOE" in sensitivity and sensitivity["moe_conf_level"] in [None, "", "#"]:
            ARCPY.AddError("Confidence Level should be provided for MOE and Confidence Bounds")
            raise SystemExit() 
        
        zFactor = None 
        try:
            #### Obtain Z Factor ####
            confidenceLevelValue = int(sensitivity["moe_conf_level"])/100
            zFactor = SPSTAT.norm.ppf(1.0- (1-confidenceLevelValue)/2)
        except:
            pass

        #### Report and Set Parameters ####
        with WARNINGS.catch_warnings():
            WARNINGS.simplefilter("ignore")
            #### Run Hot-Spot Analysis ####
            gi = LocalG(ssdo, varName, outputFC, wType, weightsFile = weightsFile,
                        concept = concept, threshold = threshold,
                        exponent = exponent, numNeighs = numNeighs,
                        potentialField = potentialField, applyFDR = applyFDR, 
                        sensitivity = sensitivity, enableProgress = False)

            #### Obtain Random Seed from Environment ####
            seed = UTILS.getRandomSeed()

            #### Generate Seed if It is not Provided ####
            if seed == 0:
                seed = int(NUM.random.randint(30000))

            msg = ARCPY.GetIDMessage(84821)
            ARCPY.AddMessage(msg.format(seed))
            NUM.random.seed(seed)

            numSimulations = int(sensitivity_info["num_simulations"])
            seeds = NUM.arange(numSimulations*5000)
            NUM.random.shuffle(seeds)
            seeds = seeds[0:numSimulations]
            giBins = NUM.zeros((ssdo.numObs,numSimulations))
            giPVal = NUM.zeros((ssdo.numObs,numSimulations), dtype = NUM.float64)
            giVals = NUM.zeros((ssdo.numObs,numSimulations), dtype = NUM.float64)
            varAlias = ssdo.fields[varName].alias

            #### Define basic fields ####
            maxSim = SSDO.CandidateField("SimMax", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).min, dtype = float), alias = fr"{varAlias} ({ARCPY.GetIDMessage(220934)})")
            minSim = SSDO.CandidateField("SimMin", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).max, dtype = float), alias = fr"{varAlias} ({ARCPY.GetIDMessage(220936)})")
            C99 = SSDO.CandidateField("NumSimC99", "LONG", NUM.zeros(ssdo.numObs), alias = ARCPY.GetIDMessage(220974).format(99))
            C95 = SSDO.CandidateField("NumSimC95", "LONG", NUM.zeros(ssdo.numObs), alias = ARCPY.GetIDMessage(220974).format(95))
            C90 = SSDO.CandidateField("NumSimC90", "LONG", NUM.zeros(ssdo.numObs), alias = ARCPY.GetIDMessage(220974).format(90))
            NS =  SSDO.CandidateField("NumSimNS", "LONG", NUM.zeros(ssdo.numObs), alias =  ARCPY.GetIDMessage(220976))
            H90 = SSDO.CandidateField("NumSimH90", "LONG", NUM.zeros(ssdo.numObs), alias = ARCPY.GetIDMessage(220975).format(90))
            H95 = SSDO.CandidateField("NumSimH95", "LONG", NUM.zeros(ssdo.numObs), alias = ARCPY.GetIDMessage(220975).format(95))
            H99 = SSDO.CandidateField("NumSimH99", "LONG", NUM.zeros(ssdo.numObs), alias = ARCPY.GetIDMessage(220975).format(99))
            countV = {-3: C99, -2: C95, -1: C90, 0: NS, 1: H90, 2: H95, 3: H99}


            yDataListFields = []

            #### Obtain the path to save the simulations ####
            pathWS = UTILS.getOutputSimulation(parameters[10], parameters[0])
            meanValue = 0
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220942))
            for sim in NUM.arange(numSimulations):

                #### Check for Cancel ####
                if ARCPY.env.isCancelled:
                    raise SystemExit()

                yData = self.getDataRealization(ssdo, varName, sensitivity, seeds[sim], yMeanNeighbors, zFactor)
                meanValue += yData.sum() / (ssdo.numObs * numSimulations)
                maxSim.data = NUM.maximum(maxSim.data, yData)
                minSim.data = NUM.minimum(minSim.data, yData)

                if APPENDSIMULATIONS:
                    candidateField = SSDO.CandidateField(f"Sim_{sim}", "DOUBLE", yData, alias = f"Simulation {sim}")
                    yDataListFields.append(candidateField)

                gi.initialize(yData)
                gi.construct()
                giBins.T[sim] = gi.giBins

                ### Count the number of simulations in each category
                for i in [-3,-2,-1,0,1,2,3]:
                    countV[i].data += (gi.giBins == i)

                giPVal.T[sim] = gi.pv
                giVals.T[sim] = gi.gi

                if pathWS is not None:

                    varNameOutput = gi.varName
                    if ".shp" in pathWS.lower():
                        varNameOutput = gi.varName[0:10]

                    candidateFieldSim = SSDO.CandidateField(varNameOutput, "DOUBLE", yData, alias = ssdo.fields[varName].alias)
                    gi.outputResults(newFields=[candidateFieldSim], ouputPathInWorkspace=pathWS.format(f'{sim:03}'), includeOriginalAnalysisVariable = False)

                ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220948).format(sim))

            ### Original Gi ####
            gi.initialize()
            gi.construct()

            values = SPSTAT.mode(giBins, axis=1)
            counts = values[1].ravel()

            countEqual =  NUM.zeros(ssdo.numObs)
            for index in NUM.arange(ssdo.numObs):
                if gi.giBins[index] in countV:
                    countEqual[index] = countV[gi.giBins[index]].data[index]

            predGiBin = SSDO.CandidateField("PredGiBin", "LONG", values[0].ravel(), alias = ARCPY.GetIDMessage(220977))
            predCount = SSDO.CandidateField("PredCount", "LONG", counts, alias = ARCPY.GetIDMessage(220978))
            percCount = SSDO.CandidateField("PredPcnt", "DOUBLE", NUM.asarray(100*counts/numSimulations, float), alias = ARCPY.GetIDMessage(220979))
            gibinCatPred = SSDO.CandidateField("PredCat", "LONG", values[0].ravel(), alias = ARCPY.GetIDMessage(220980), cvDomain = cvDomainShort)
            gibinCat = SSDO.CandidateField("GIBIN_CAT", "LONG" ,gi.giBins, alias = ARCPY.GetIDMessage(220981), cvDomain = cvDomainShort)
            similarCount = SSDO.CandidateField("GIBIN_Count", "LONG", countEqual, alias = ARCPY.GetIDMessage(220982))
            similarPerc = SSDO.CandidateField("GIBIN_Pcnt", "DOUBLE", NUM.asarray(100*countEqual/numSimulations, float), alias = ARCPY.GetIDMessage(220983))

            candidateFields = []

            candidateFields.extend([gibinCat, maxSim, minSim,C99, C95, C90, NS, H90, H95, H99, predGiBin, gibinCatPred, predCount, percCount, similarCount, similarPerc])

            #### Get Natural Breaks ####
            breaksString = SSU.getNaturalBreaks(gibinCat,gibinCatPred)

            #### Append Simulation To ouput ####
            if APPENDSIMULATIONS:
                candidateFields.extend(yDataListFields)

            listFieldsToAddFromSouuce = []
            if "MOE" in  sensitivity:
                listFieldsToAddFromSouuce.append(sensitivity["MOE"].upper())
            if "lowField"  in sensitivity:
                listFieldsToAddFromSouuce.append(sensitivity["lowField"].upper())
                listFieldsToAddFromSouuce.append(sensitivity["highField"].upper())

            giField, pvField = gi.outputResults(newFields = candidateFields, listFieldsToAddFromSouuce = listFieldsToAddFromSouuce )

        ### Render Results ###
        gi.renderResults(parameters, simulationInformation={"field":"Gi_Bin", "heading":ARCPY.GetIDMessage(220984), "popup": SSU.createPopup(fr"//{breaksString}")})

        ### Add Group Layer ###
        self.addGroupLayer(gi, Output_Feature_Class)

        ### Add GP Messages ###
        minValue = NUM.min(minSim.data)
        maxValue = NUM.max(maxSim.data)
        self.printMessages(ssdo, parameters, varName, minValue, meanValue, maxValue)

    def addGroupLayer(self, gi, outputFC):
        import SSAttributeUncertainty as SSU
        #### Add Group Layer ####
        glParameterIndex = 13
        ### retrieve the index of the output group layer parameter ###
        for i in NUM.arange(len(self.parameters)):
            if self.parameters[i].name == "out_group_layer":
                glParameterIndex = int(i)
                break
        SSU.addGroupLayer(gi, outputFC, glParameterIndex, "GIBIN_Pcnt")

    def getDataRealization(self, ssdo, varName, sensitivity, seed, neighborsMean, zFactor):
        """Get a realization of the data based on the sensitivity parameters.
        INPUT:
            ssdo (object): SSDO object
            varName (string): variable name
            sensitivity (dictionary): sensitivity parameters
            seed (int): random seed
            neighborsMean (array): mean value of neighbors
            zFactor (float): z factor
        OUTPUT:
            yData (array): data realization
        """
        return STATS.getRealization(ssdo, varName, sensitivity, seed, neighborsMean, zFactor)
    
    def printMessages(self, ssdo, parameters, varName, minValue, meanValue, maxValue):
        """ Print Message about variability of the data
        INPUT:
            ssdo (object): SSDO object
            parameters (list): parameters
            varName (string): variable name
            minValue (float): minimum value
            meanValue (float): mean value
            maxValue (float): maximum value
        """
        import SSAttributeUncertainty as SSU
        SSU.printMessages(ARCPY.GetIDMessage(220985), ssdo, parameters, varName, minValue, meanValue, maxValue)