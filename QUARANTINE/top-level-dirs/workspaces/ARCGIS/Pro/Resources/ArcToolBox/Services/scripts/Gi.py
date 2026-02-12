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
                 applyFDR = False, pType = "BOOT",  thresholdOrigin = None,
                 normField = None):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Assess Whether SWM File Being Used ####
        self.swmFileBool = False
        if weightsFile:
            weightSuffix = weightsFile.split(".")[-1].lower()
            self.swmFileBool = (weightSuffix == "swm")

        #### Create Shape File Boolean for NULL Values ####
        self.outShapeFileBool = UTILS.isShapeFile(outputFC)

        #### Initialize Data ####
        self.initialize()

        #### Construct Based on SWM File or On The Fly ####
        self.construct()

    def initialize(self):
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
        self.fieldNames = [varName]
        field = ssdo.fields[varName]
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
                                                concept = concept)


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

    def construct(self):
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

        #### Assure that Variance is Larger than Zero ####
        yVar = NUM.var(self.y)
        if NUM.isnan(yVar) or yVar <= 0.0:
            ARCPY.AddIDMessage("ERROR", 906)
            raise SystemExit()

        #### Create Summed Variables ####
        self.intRange = NUM.arange(numObs)
        self.floatN = self.numObs * 1.0
        ySum = self.y.sum()
        ySum2 = (self.y**2.0).sum()
        self.yBar = ySum / self.floatN
        self.S = NUM.sqrt( (ySum2 / self.floatN) - self.yBar**2.0 )
        self.nm1 = self.floatN - 1.0

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
            contDict = WU.polygonNeighborDict(ssdo.inputFC, ssdo.oidName,
                                         contiguityType = contiguityType)
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
        ARCPY.SetProgressor("step", msg , 0, N, 1)

        #### Create Neighbor Info Class ####
        ni = WU.NeighborInfo(masterField)

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
                                                  contDict, self.y,
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

                if nn:
                    #### Calculate Local G ####
                    self.calculateGI(orderID, yiVal, nhVals, weights)

            ARCPY.SetProgressorPosition()

        #### Clean Up ####
        if self.swmFileBool:
            swm.close()

        #### Report on Features with No Neighbors ####
        ni.reportNoNeighbors(failAllNoNeighs = False)
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

        toolMSG = ARCPY.GetIDMessage(84466)
        if self.applyFDR:
            #### Set Bins Using FDR ####
            msg = ARCPY.GetIDMessage(84472).format(toolMSG)
            ARCPY.SetProgressor("default", msg)
            self.giBins = STATS.fdrTransform(pv, self.gi)
        else:
            msg = ARCPY.GetIDMessage(84473).format(toolMSG)
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
        else:
            giVal = dev / denomG
            pVal = STATS.zProb(giVal, type = 2)

        #### Assign To Result Vectors ####
        self.gi[orderID] = giVal
        self.pVals[orderID] = pVal
        self.neighbors[orderID] = len(weights)

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

    def outputResults(self, addTextField = False):
        """Creates output feature class Local Gi*."""

        #### Prepare Derived Variables for Output Feature Class ####
        outPath, outName = OS.path.split(self.outputFC)
        fieldOrder = UTILS.getFieldNames(giFieldNames, outPath)
        fieldData = [self.gi, self.pVals, self.neighbors]
        fieldTypes = ["DOUBLE", "DOUBLE", "LONG"]

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

        #### Optionally Add Text Field Output ####
        if addTextField:
            candidateFields[giTextFieldName] = self.returnTextField()

        #### Add Date-Time Field If Applicable ####
        if self.swmFileBool:
            if self.swm.wType == 9:
                if self.swm.timeField.upper() in self.ssdo.allFields:
                    appendFields.insert(0, self.swm.timeField.upper())

        #### Write Data to Output Feature Class ####
        self.ssdo.output2NewFC(self.outputFC, candidateFields,
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

    def renderResults(self, parameters = None):
        #### Set the Default Symbology ####
        isPro = UTILS.isPRO()
        if parameters is None:
            params = ARCPY.gp.GetParameterInfo()
        else:
            params = parameters

        #### Install Path to Layer Files ####
        fullRLF =  UTILS.pathLayers

        try:
            renderType = UTILS.renderType[self.ssdo.shapeType.upper()]
            renderLayerFile = giRenderDict[renderType]
            if isPro:
                renderLayerFile += ".lyrx"
                UTILS.buildLocaleCIMLayer(renderLayerFile, 2)
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

            chart = ARCPY.Chart("Histogram of Hot Spot Analysis Variable")
            chart.type = "histogram"
            chart.xAxis.field = outFieldName
            chart.xAxis.title = outFieldNameAlias
            chart.title = title
            chart.histogram.binCount = numBreaks
            chart.histogram.showMean = True
            chart.histogram.showMedian = True
            chart.histogram.showStandardDeviation = True

            params[2].charts = [chart]
