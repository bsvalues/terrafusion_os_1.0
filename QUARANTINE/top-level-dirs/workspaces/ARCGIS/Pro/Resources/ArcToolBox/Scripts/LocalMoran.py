# coding: utf-8
"""
Tool Name:  Cluster/Outlier Analysis (Anselin Local Morans I)
Source Name: LocalMoran.py
Version: ArcGIS 10.1
Author: ESRI

This tool performs the Anselin Local Moran's I spatial autocorrelation
statistic. For more details, see: _The ESRI Guide to GIS Analysis_,
Volume 2, Chapter 4 and/or Anselin, "Local Indicators of Spatial
Association -- LISA", _Geographical Analysis_, v. 27, no. 2 (April 1995).
"""

################### Imports ########################
import sys as SYS
import os as OS
import locale as LOCALE
import numpy as NUM
import numpy.random as RAND
import arcgisscripting as ARC
import arcpy as ARCPY
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import Stats as STATS
import WeightsUtilities as WU
import gapy as GAPY
import collections as COLL
import logging
from loggerutils import init_ss_logger
LOGGER = init_ss_logger(__name__, logging.DEBUG)

ZTRAN = True

################ Output Field Names #################
liFieldNames = ["LMiIndex", "LMiZScore", "LMiPValue"]
liFieldNamesPerm = ["LMiIndex", "LMiPValue"]
liCOFieldName =  "COType"
liNumNeighbors = "NNeighbors"
liLagName = "SpatialLag"
liZTranName = "ZTransform"
liRenderDict = { 0: "LocalIPoints",
                 1: "LocalIPolylines",
                 2: "LocalIPolygons" }
liRateFieldName = "SS_RATE"
liTextFieldName = "Li_Text"
liTextFieldAlias = "Cluster/Outlier Type"

coTypeConvert = {0: "", 1: "HH", 2: "LH", 3: "LL", 4: "HL", NUM.nan: "", 5:"NN"}

def execute(parameters, messages):
    inputFC = UTILS.getTextParameter(0, parameters)
    varName = UTILS.getTextParameter(1, parameters).upper()
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
        ARCPY.AddIDMessage("Error", 723)
        raise SystemExit()

    #### EUCLIDEAN or MANHATTAN ####
    distanceConcept = UTILS.getTextParameter(4, parameters).upper().replace(" ", "_")
    concept = WU.conceptDispatch[distanceConcept]

    #### Row Standardized ####
    rowStandard = UTILS.getTextParameter(5, parameters).upper()
    if rowStandard == 'ROW':
        rowStandard = True
    else:
        rowStandard = False

    #### Distance Threshold ####
    threshold = UTILS.getNumericParameter(6, parameters)

    #### Spatial Weights File ####
    weightsFile = UTILS.getTextParameter(7, parameters)
    if weightsFile is None and wType == 8:
        ARCPY.AddIDMessage("ERROR", 930)
        raise SystemExit()
    if weightsFile and wType != 8:
        ARCPY.AddIDMessage("WARNING", 925)
        weightsFile = None

    #### Number of Neighbors ####
    numNeighs = UTILS.getNumericParameter(15, parameters)
    if numNeighs is None:
        numNeighs = 0

    #### FDR ####
    applyFDR = parameters[8].value

    #### Permutations ####
    permutations = UTILS.getNumericParameter(14, parameters)

    #### Create a Spatial Stats Data Object (SSDO) ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC, 
                                useChordal = True)

    #### Set Unique ID Field ####
    masterField = UTILS.setUniqueIDField(ssdo, weightsFile = weightsFile)

    #### Populate SSDO with Data ####
    if WU.gaTypes[spaceConcept]:
        ssdo.obtainData(masterField, [varName], minNumObs = 3, 
                        requireSearch = True, warnNumObs = 30)
    else:
        ssdo.obtainData(masterField, [varName], minNumObs = 3, 
                        warnNumObs = 30)

    #### Run Cluster-Outlier Analysis ####
    li = LocalI(ssdo, varName, outputFC, wType,
                weightsFile = weightsFile, concept = concept,
                rowStandard = rowStandard, threshold = threshold, 
                exponent = exponent, numNeighs = numNeighs,
                applyFDR = applyFDR, permutations = permutations)

    #### Report and Set Parameters ####
    liField, ziField, pvField, coField = li.outputResults()
    try:
        UTILS.setParameterAsText(9, liField, parameters)
        UTILS.setParameterAsText(10, ziField, parameters)
        UTILS.setParameterAsText(11, pvField, parameters)
        UTILS.setParameterAsText(12, coField, parameters)
        UTILS.setParameterAsText(13, li.ssdo.masterField, parameters)
    except:
        ARCPY.AddIDMessage("WARNING", 902)

    li.renderResults(parameters)

#################### Classes ########################

class LocalI(object):
    """Calculates 1995 Anselin Local Moran's I statistic:
    
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
    numNeighs {int, 0}: number of neighbors (3)
    permutations {int, 499}: number of permutations for pseudo p-value (4)
    applyFDR {bool, False}: whether to adjust for multiple hypothesis tests
    thresholdOrigin {str, None}: original value and unit of the threshold before transformation

    ATTRIBUTES:
    numObs (int): number of features in analysis
    y (array, numObs x 1): vector of field values
    yDev (array, numObs x 1): vector of field deviation from mean
    li (array, numObs x 1): Local I values
    ei (array, numObs x 1): Expected I values
    vi (array, numObs x 1): Variance I values
    zi (array, numObs x 1): z-values
    pVals (array, numObs x 1): probability values (two-tailed)
    moranBins ((array, numObs): significant cluster-outliers (2)

    NOTES:
    (1) See the wTypeDispatch dictionary in WeightsUtilities.py for a 
        complete list of spatial conceptualizations and their corresponding
        integer values.
    (2) The possible values for moranBins is in [HH, LH, LL, HL, ""]
        HH = High-High Value, LH = Low-High Value, 
        LL = Low-Low Value, HL = High-Low Value
        "" = Insignificant Cluster-Outlier value
    (3) For explicit use in KNN or can be used to modify distance-based
        methods to assure at least this number of neighbors if not enough
        based on given distance band.
    (4) A value of 0 will return inference based on the randomization hypothesis.
    """

    def __init__(self, ssdo, varName, outputFC, wType,
                 weightsFile = None, concept = "EUCLIDEAN",
                 rowStandard = True, threshold = None,
                 exponent = 1.0, numNeighs = None, permutations = 499, 
                 applyFDR = False, thresholdOrigin = None, normField=None, fromAGOL=False,
                 sensitivity = None, enableProgress = True):

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
        rowStandard = self.rowStandard
        weightsFile = self.weightsFile
        swmFileBool = self.swmFileBool
        masterField = ssdo.masterField
        thresholdOrigin = self.thresholdOrigin
        normField = self.normField

        #### Get Data Array ####
        self.fieldNames = [varName]
        field = ssdo.fields[varName]

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
                                                concept = concept, enableProgress = self.enableProgress)

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
                    if self.enableProgress:
                        ARCPY.AddIDMessage("Warning", 717)

        #### Set Attributes ####
        self.maxSet = maxSet
        self.threshold = threshold
        self.master2Order = ssdo.master2Order
        self.swmFileBool = swmFileBool

    def construct(self, getJustYMean = False):
        """Constructs the neighborhood structure for each feature and
        dispatches the appropriate values for the calculation of the
        statistic."""

        #### Shorthand Attributes ####
        ssdo = self.ssdo
        varName = self.varName
        concept = self.concept
        gaConcept = concept.lower()
        threshold = self.threshold
        exponent = self.exponent
        wType = self.wType
        rowStandard = self.rowStandard
        numObs = self.numObs
        master2Order = self.master2Order
        masterField = ssdo.masterField
        weightsFile = self.weightsFile
        permutations = self.permutations

        #### Assure that Variance is Larger than Zero ####
        yVar = NUM.var(self.y)
        if NUM.isnan(yVar) or yVar <= 0.0:
            LOGGER.error(906, extra={"message_ID": 906})
            raise SystemExit()

        #### Disable Progressor if Sensitivity is provided ####
        disableProgressor = self.sensitivity is not None

       #### Get Just Y Mean ####
        if getJustYMean:
            yMean =  self.getYMean()
            return yMean

        #### Initialize Cluster-Outlier Solve Class ####
        randSeed = UTILS.getRandomSeed()
        if permutations is None:
            permutations = 0
        if permutations < 0:
            permutations = 0
        permutations = int(permutations)

        co = ARC._ss.ClusterOutlier(ssdo, self.y, permutations = permutations,
                                    random_seed = randSeed,
                                    z_transform = ZTRAN,
                                    disable_progressor = disableProgressor )

        #### Set Neighborhood Structure Type ####
        swm = None  # Added to Address Coverity CID 278241
        if self.weightsFile:
            if self.swmFileBool:
                #### Open Spatial Weights and Obtain Chars ####
                swm = WU.SWMReader(weightsFile)
                N = swm.numObs
                rowStandard = swm.rowStandard
                self.swm = swm

                #### Check to Assure Complete Set of Weights ####
                if numObs > N:
                    ARCPY.AddIDMessage("Error", 842, numObs, N)
                    raise SystemExit()

                #### Find Features w/ Neighbors ####
                hasNeighbors = swm.getHasNeighborArray(ssdo.master2Order)

                #### Solve ####
                solve = co.solve_using_swm(swm, hasNeighbors)
            else:
                #### Warning for GWT with Bad Records/Selection ####
                if ssdo.selectionSet or ssdo.badRecords:
                    ARCPY.AddIDMessage("WARNING", 1029)

                #### Build Weights Dictionary ####
                weightDict = WU.buildTextWeightDictNoSelf(weightsFile, master2Order)

                #### Solve ####
                solve = co.solve_using_text(weightDict)

        elif wType in [4, 5]:
            #### Polygon Contiguity ####
            if wType == 4:
                contiguityType = "ROOK"
            else:
                contiguityType = "QUEEN"

            polyNeighDict = ssdo.getPolygonNeighbors(contiguityType = contiguityType)

            #### Solve ####
            solve = co.solve_using_poly(polyNeighDict, row_standard = self.rowStandard)

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

            #### Create Neighbor Weights Class ####
            neighWeights = ARC._ss.NeighborWeights(gaTable, gaSearch,
                                                 weight_type = wType,
                                                 exponent = exponent,
                                          row_standard = rowStandard)

            #### Solve ####
            solve = co.solve_using_nw(neighWeights)

        #### Assure Solve ####
        if not solve:
            if self.fromAGOL:
                if NUM.isnan(yVar) or yVar <= 1e-6:
                    LOGGER.error(906, extra={"message_ID": 906})
            raise SystemExit()

        #### Get Neighbor Info Class ####
        ni = co.neighbor_info
        self.neighbors = co.neighbors

        #### Clean Up ####
        # Added 'if swm' to Address Coverity CID 278241
        if swm and self.swmFileBool:
            swm.close()

        #### Report on Features with No Neighbors ####
        ni.report_no_neighbors()
        numNoNeighs = len(ni.ids_no_neighs)

        #### Report on Features with Large Number of Neighbors ####
        ni.report_warnings()
        ni.report_maximums()
        self.neighInfo = ni

        #### Calculate FDR and Moran Bins ####
        toolMSG = ARCPY.GetIDMessage(84474)
        if self.applyFDR:
            msg = ARCPY.GetIDMessage(84472).format(toolMSG)
            ARCPY.SetProgressor("default", msg)

            #### Get Cluster-Outlier Bins ####
            coType = co.cotype

            #### Mask Out Features w/ No Neighbors ####
            mask = NUM.ones(ssdo.numObs, dtype = bool)
            if numNoNeighs:
                for masterID in ni.ids_no_neighs:
                    orderID = ssdo.master2Order[masterID]
                    mask[orderID] = False

            li = co.li[mask]
            pv = co.pvals[mask]

            #### Do FDR ####
            fdrBins = STATS.fdrTransform(pv, li)
            removeSignificance = abs(fdrBins) < 2
            maskBins = coType[mask]
            maskBins[removeSignificance] = 0
            coType[mask] = maskBins
            self.coType = coType

        else:
            msg = ARCPY.GetIDMessage(84473).format(toolMSG)
            ARCPY.SetProgressor("default", msg)
            self.coType = co.cotype

        #### Set Other Output Array Info ####
        self.li = co.li
        self.pVals = co.pvals
        self.zi = co.zi
        self.ei = co.ei
        self.vi = co.vi
        self.spatialLag = co.spatial_lag
        self.zTransform = co.z_transform

        #### Set NULL Values ####
        self.setNullValues(ni.ids_no_neighs)

    def getYMean(self):
        """Returns the mean of the input field."""
        #### Shorthand Attributes ####
        ssdo = self.ssdo
        varName = self.varName
        concept = self.concept
        gaConcept = concept.lower()
        threshold = self.threshold
        exponent = self.exponent
        wType = self.wType
        rowStandard = self.rowStandard
        numObs = self.numObs
        master2Order = self.master2Order
        masterField = ssdo.masterField
        weightsFile = self.weightsFile
        permutations = self.permutations

        yMean = None

        #### Set Neighborhood Structure Type ####
        swm = None  # Added to Address Coverity CID 278241
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

        #### Create Neighbor Info Class ####
        ni = WU.NeighborInfo(masterField)

        #### Obtain the Y Mean without calculate GI ####  
        yMean = NUM.zeros(N, float) 

        #### Calculation For Each Feature ####
        for i in iterVals:
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
                                                  potVals = None)

            else:
                #### Distance Based ####
                masterID = gaTable[i][0]
                includeIt = True
                rowInfo = WU.getWeightsValuesOTF_Potent(neighWeights, i, 
                                                        self.y,
                                                        None)

            #### Subset Boolean for SWM File ####
            if includeIt:
                #### Parse Row Info ####
                orderID, yiVal, nhIDs, nhVals, weights = rowInfo

                #### Assure Neighbors Exist After Selection ####
                nn, nhIDs, nhVals, weights = ni.processInfo(masterID, nhIDs,
                                                            nhVals, weights)

                yMean[orderID] = NUM.mean(nhVals)
                    
        if swm and self.swmFileBool:
            swm.close()
        return yMean

    def setNullValues(self, idsNoNeighs):
        """Set no neighbor data for a given feature (1).
        
        INPUTS:
        idsNoNeighs (list): unique ID values that have no neighbors
        
        NOTES:
        (1)   The no neighbor result differs for shapefiles as it has no NULL
              value capabilities.  
        """

        for id in idsNoNeighs:
            orderID = self.ssdo.master2Order[id]
            if self.outShapeFileBool:
                self.li[orderID] = 0.0
                self.pVals[orderID] = 1.0
                self.coType[orderID] = 5
                self.zi[orderID] = 0.0
                self.spatialLag[orderID] = 0.0
                self.zTransform[orderID] = 0.0
                if not self.permutations:
                    self.ei[orderID] = 0.0
                    self.vi[orderID] = 0.0
            else:
                self.li[orderID] = NUM.nan
                self.pVals[orderID] = NUM.nan
                self.coType[orderID] = 5
                self.zi[orderID] = NUM.nan
                self.spatialLag[orderID] = NUM.nan
                self.zTransform[orderID] = NUM.nan
                if not self.permutations:
                    self.ei[orderID] = NUM.nan
                    self.vi[orderID] = NUM.nan

    def outputResults(self, includeSSRateField=False, newFields = None, 
                      listFieldsToAddFromSouuce = None, 
                      ouputPathInWorkspace = None, 
                      includeOriginalAnalysisVariable = True,
                      applyCoTypeConvert = True):
        """Creates output feature class for Local I."""
        outputFC = self.outputFC

        #### Prepare Derived Variables for Output Feature Class ####
        if ouputPathInWorkspace is not None:
            outPath, outName = OS.path.split(ouputPathInWorkspace)
            outputFC = ouputPathInWorkspace
        else:
            outPath, outName = OS.path.split(self.outputFC)

        #### Get Base Field Names ####
        #if self.permutations:
        #    fieldOrder = UTILS.getFieldNames(liFieldNamesPerm, outPath)
        #    fieldData = [self.li, self.pVals]
        #else:
        fieldOrder = UTILS.getFieldNames(liFieldNames, outPath)
        fieldData = [self.li, self.zi, self.pVals]

        #### Add Norm Field ####
        if self.normField:
            fieldOrder = [liRateFieldName] + fieldOrder
            fieldData = [self.y] + fieldData

        #### Add CO Type Field ####
        fieldOrder.append(liCOFieldName)

        coOutput = self.coType
        if applyCoTypeConvert:
            coOutput = [coTypeConvert[i] for i in self.coType]

        if self.fromAGOL:
            """
            null/empty values are not handled well by AGOL, so we need to replace them with a string
            """
            coOutput = [item if item != "" else "NS" for item in coOutput]
        self.coType = NUM.array(coOutput)
        fieldData.append(self.coType)

        #### Add Number of Neighbors Field ####
        fieldOrder.append(liNumNeighbors)
        fieldData.append(self.neighbors)

        #### Add Z Transform Field ####
        fieldOrder.append(liZTranName)
        fieldData.append(self.zTransform)

        #### Add Spatial Lag ####
        fieldOrder.append(liLagName)
        fieldData.append(self.spatialLag)

        #### Create Alias Field Names ####
        if self.wType == 8:
            addString = OS.path.basename(self.weightsFile)
            rowStandard = False
        elif self.wType == 2:
            addString = str(self.numNeighs)
            rowStandard = self.rowStandard
        elif self.wType in [0, 1, 7]:
            if self.maxSet:
                addString = "0"
            else:
                addString = str(int(self.threshold))
            rowStandard = self.rowStandard
        else:
            addString = None
            rowStandard = self.rowStandard

        aliasList = WU.createSpatialFieldAliases(fieldOrder, 
                                                 addString = addString, 
                                                 wType = self.wType, 
                                                 exponent = self.exponent,
                                                 rowStandard = rowStandard)
        if self.applyFDR:
            aliasList[-2] += "_FDR"

        #### Adjust Rate Field Alias ####
        if self.normField:
            aliasList[0] = u"{0} per {1}".format(self.varName, self.normField)

        #### Create/Populate Dictionary of Candidate Fields ####
        candidateFields = {}
        coIndex = 0
        for fieldInd, fieldName in enumerate(fieldOrder):
            if fieldName == liCOFieldName:
                fType = "TEXT"
                length = 2
                coIndex = fieldInd
                checkNullValues = False
            elif fieldName == liNumNeighbors:
                fType = "LONG"
                length = None
                checkNullValues = False
            else:
                fType = "DOUBLE"
                length = None
                checkNullValues = True
            candidateField = SSDO.CandidateField(fieldName, fType, 
                                                 fieldData[fieldInd],
                                                 alias = aliasList[fieldInd],
                                                 length = length,
                                                 checkNullValues = checkNullValues)
            candidateFields[fieldName] = candidateField

        #### Input Fields to Copy to Output FC ####
        appendFields = [i for i in self.fieldNames]
        if not includeOriginalAnalysisVariable:
            appendFields.remove(self.varName)

        #### Add Fields from Source FC ####
        if listFieldsToAddFromSouuce is not None:
            appendFields.extend([i for i in listFieldsToAddFromSouuce])

        #### Optionally Add Text Field Output ####
        if includeSSRateField:
            candidateFields[liTextFieldName] = self.returnTextField()

        #### Add external Fields ####
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

        outFieldSet = fieldOrder[0:3] + [fieldOrder[coIndex]]
        return outFieldSet

    def returnTextField(self):
        labelArray = NUM.chararray(self.numObs, itemsize=30)

        labelArray[:] = ARCPY.GetIDMessage(84663)
        labelArray[self.coType == "HL"] = ARCPY.GetIDMessage(84659)
        labelArray[self.coType == "LH"] = ARCPY.GetIDMessage(84660)
        labelArray[self.coType == "HH"] = ARCPY.GetIDMessage(84661)
        labelArray[self.coType == "LL"] = ARCPY.GetIDMessage(84662)
        labelArray[self.coType == "NN"] = ARCPY.GetIDMessage(220682)

        labelField = SSDO.CandidateField(liTextFieldName, "TEXT", labelArray,
                                         alias = liTextFieldAlias)
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
            dataLyr = simulationInformation

        try:
            renderType = UTILS.renderType[self.ssdo.shapeType.upper()]
            renderLayerFile = liRenderDict[renderType]
            if isPro:
                renderLayerFile += "NN.lyrx"
                UTILS.buildLocaleCIMLayer(renderLayerFile, outputParameterIndex, data = dataLyr)
            else:
                renderLayerFile += ".lyr"
                fullRLF = OS.path.join(fullRLF, renderLayerFile)
                params[2].symbology = fullRLF
        except:
            ARCPY.AddIDMessage("WARNING", 973)

        #### Set Chart Output ####
        if isPro:

            #### Data Histogram ####
            y = self.ssdo.fields[self.varName].returnDouble()
            numBreaks = int(STATS.riskFunBins(y, 8, 64, 1))
            riceBreaks = STATS.riceBins(self.ssdo.numObs)

            if riceBreaks < numBreaks:
                numBreaks = riceBreaks

            if simulationInformation is not None:
                chart2 = ARCPY.charts.MatrixHeat(x="COTypeCat", y="PredCat",
                                aggregation="count", title=ARCPY.GetIDMessage(220891)
                                )
                ### Breaks are removed in post execution ###
                chart2.xAxis.title = fr"Original Local Outlier Category"
                chart2.yAxis.title = "Predominant Local Outlier Category"

                params[outputParameterIndex].charts = [chart2]
                return


            #### Get Mapped Output Field Name ####
            outFieldName = self.ssdo.in2OutFieldMap[self.varName]
            histString = ARCPY.GetIDMessage(84795)
            title = histString.format(outFieldName)
            chartName = histString.format(ARCPY.GetIDMessage(84796))

            chart = ARCPY.Chart(chartName)
            chart.type = "histogram"
            chart.xAxis.field = outFieldName
            chart.title = title
            chart.histogram.binCount = numBreaks
            chart.histogram.showMean = True
            chart.histogram.showMedian = True
            chart.histogram.showStandardDeviation = True

            allCharts = [chart]

            #### Moran Scatterplot ####
            if self.rowStandard:
                scatter = ARCPY.Chart(ARCPY.GetIDMessage(84792))
                scatter.type = "scatter"
                scatter.title = ARCPY.GetIDMessage(84792)
                scatter.scatter.showTrendLine = True

                #### Assign Y Axis Field ####
                scatter.xAxis.field = liZTranName
                scatter.xAxis.title = ARCPY.GetIDMessage(84793).format(outFieldName)

                #### Assign X Axis Field ####
                scatter.yAxis.field = liLagName
                scatter.yAxis.title = ARCPY.GetIDMessage(84794)

                #### Assing Square Min/Max Axis Extents ####
                minX, maxX = UTILS.getSquareStdScatterAxes(NUM.nanmin(self.zTransform),
                                                           NUM.nanmax(self.zTransform))
                scatter.xAxis.minimum = minX
                scatter.yAxis.minimum = minX
                scatter.xAxis.maximum = maxX
                scatter.yAxis.maximum = maxX
                scatter.xAxis.guides.new("x", 0, None,"")
                scatter.yAxis.guides.new("y", 0, None,"")

                allCharts.append(scatter)

            params[2].charts = allCharts

class LocalMoranSensitivity(object):
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
                        Weights_Matrix_File,
                        Apply_False_Discovery_Rate__FDR__Correction,
                        Number_of_Permutations,
                        number_of_neighbors,
                        sensitivity_info, parameters, resultSSDO = None):
        """
        ARCPY.AddMessage( fr" Input_Feature_Class:{Input_Feature_Class} Input_Field:{Input_Field}  Output_Feature_Class {Output_Feature_Class} Conceptualization_of_Spatial_Relationships: {Conceptualization_of_Spatial_Relationships}   Distance_Method:{Distance_Method} Standardization:{Standardization} Distance_Band_or_Threshold_Distance:{Distance_Band_or_Threshold_Distance} Number_of_Permutations:{Number_of_Permutations} Weights_Matrix_File:{Weights_Matrix_File} Apply_False_Discovery_Rate__FDR__Correction:{Apply_False_Discovery_Rate__FDR__Correction} number_of_neighbors:{number_of_neighbors} {sensitivity_info}" )
        """

        #### Import Modules ####
        import scipy.stats as SPSTAT
        import SSAttributeUncertainty as SSU

        resultSSDO = resultSSDO
        #### Set Parameters ####
        inputFC = Input_Feature_Class
        varName = Input_Field.upper()
        outputFC = Output_Feature_Class
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
        varNameList = [fld for fld in fields]

        sensitivity.update(sensitivity_info)

        #### Parse Space Concept ####
        spaceConcept = Conceptualization_of_Spatial_Relationships.upper().replace(" ", "_")
        if spaceConcept == "INVERSE_DISTANCE_SQUARED":
            exponent = 2.0
        else:
            exponent = 1.0
        try:
            spaceConcept = WU.convertConcept[spaceConcept] 
            wType = WU.weightDispatch[spaceConcept]
        except:
            ARCPY.AddIDMessage("Error", 723)
            raise SystemExit()

        #### EUCLIDEAN or MANHATTAN ####
        distanceConcept =  Distance_Method.upper().replace(" ", "_")
        concept = WU.conceptDispatch[distanceConcept]

        #### Row Standardized ####
        rowStandard = Standardization.upper()

        if rowStandard == 'ROW':
            rowStandard = True
        else:
            rowStandard = False

        if Distance_Band_or_Threshold_Distance is not None:
            Distance_Band_or_Threshold_Distance = UTILS.strToFloat(Distance_Band_or_Threshold_Distance)

        #### Distance Threshold ####
        threshold = Distance_Band_or_Threshold_Distance

        #### Spatial Weights File ####
        weightsFile = Weights_Matrix_File
        if weightsFile is None and wType == 8:
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
        applyFDR =  Apply_False_Discovery_Rate__FDR__Correction == "APPLY_FDR"

        #### Permutations ####
        permutations = int(Number_of_Permutations)

        #### Create a Spatial Stats Data Object (SSDO) ####
        ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC, 
                                    useChordal = True)

        #### Set Unique ID Field ####
        masterField = UTILS.setUniqueIDField(ssdo, weightsFile = weightsFile)

        #### Populate SSDO with Data ####
        if WU.gaTypes[spaceConcept]:
            ssdo.obtainData(masterField, varNameList, minNumObs = 3, 
                            requireSearch = True, warnNumObs = 30)
        else:
            ssdo.obtainData(masterField, varNameList, minNumObs = 3, 
                            warnNumObs = 30)
        #### Compare SSDO and Result SSDO ####
        if resultSSDO is not None:
            if resultSSDO.numObs == ssdo.numObs:
                sourceIDsSSDO = list(ssdo.master2Order.keys())
                sourceIDsResultSSDO = list(resultSSDO.master2Order.keys())
                sourceIDsSSDO.sort()
                sourceIDsResultSSDO.sort()
                equals = NUM.allclose(NUM.array(sourceIDsSSDO), NUM.array(sourceIDsResultSSDO))
                if not equals:
                    resultSSDO = None
            else:
                resultSSDO = None

        if resultSSDO is None:
            ARCPY.AddIDMessage("WARNING", 110601)

        #### Get Morans I  ann YMean####
        yMeanNeighbors = None

        #### Check if the confidence level is provided when MOE option is used ####
        if "MOE" in sensitivity and sensitivity["moe_conf_level"] in [None, "", "#"]:
            ARCPY.AddError("Confidence Level should be provided for MOE and Confidence Bounds")
            raise SystemExit() 


        #### Obtain Z Factor ####
        confidenceLevelValue = int(sensitivity["moe_conf_level"])/100
        zFactor = SPSTAT.norm.ppf(1.0- (1-confidenceLevelValue)/2)

        #### Run Cluster-Outlier Analysis ####
        li = LocalI(ssdo, varName, outputFC, wType,
                    weightsFile = weightsFile, concept = concept,
                    rowStandard = rowStandard, threshold = threshold, 
                    exponent = exponent, numNeighs = numNeighs,
                    applyFDR = applyFDR, permutations = permutations,
                    sensitivity = sensitivity, enableProgress = False)

        seed = UTILS.getRandomSeed()

        #### Generate Seed if It is not Provided ####
        if seed == 0:
            seed = int(NUM.random.randint(10000))

        msg = ARCPY.GetIDMessage(84821)
        ARCPY.AddMessage(msg.format(seed))
        NUM.random.seed(seed)

        numSimulations = int(sensitivity_info["num_simulations"])
        seeds = NUM.arange(numSimulations*5000)
        NUM.random.shuffle(seeds)
        seeds = seeds[0:numSimulations]
        liCotypes = NUM.zeros((ssdo.numObs,numSimulations), dtype = float)
        varAlias = ssdo.fields[varName].alias

        maxSim = SSDO.CandidateField("SimMax", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).min, dtype = float), alias = fr"{varAlias} ({ARCPY.GetIDMessage(220934)})")
        minSim = SSDO.CandidateField("SimMin", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).max, dtype = float), alias = fr"{varAlias} ({ARCPY.GetIDMessage(220936)})")
        HH = SSDO.CandidateField("NumSimHH", "LONG", NUM.zeros(ssdo.numObs), alias = ARCPY.GetIDMessage(220963).format(ARCPY.GetIDMessage(84661)))
        HL = SSDO.CandidateField("NumSimHL", "LONG", NUM.zeros(ssdo.numObs), alias = ARCPY.GetIDMessage(220963).format(ARCPY.GetIDMessage(84659)))
        LH = SSDO.CandidateField("NumSimLH", "LONG", NUM.zeros(ssdo.numObs), alias = ARCPY.GetIDMessage(220963).format(ARCPY.GetIDMessage(84660)))
        LL = SSDO.CandidateField("NumSimLL", "LONG", NUM.zeros(ssdo.numObs), alias = ARCPY.GetIDMessage(220963).format(ARCPY.GetIDMessage(84662)))
        NS = SSDO.CandidateField("NumSimNS", "LONG", NUM.zeros(ssdo.numObs), alias = ARCPY.GetIDMessage(220963).format(ARCPY.GetIDMessage(84663)))
        NN = SSDO.CandidateField("NumSimNN", "LONG", NUM.zeros(ssdo.numObs), alias =  ARCPY.GetIDMessage(220963).format(ARCPY.GetIDMessage(220682)))

        countV = {0: NS, 1:HH , 2:LH, 3:LL, 4:HL, NUM.nan:NS, 5:NN }

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

            li.initialize(yData)
            li.construct()
            liCotypes.T[sim] = li.coType

            for cls in [0, 1, 2, 3, 4, 5, NUM.nan]:
                if NUM.isnan(cls):
                    countV[cls].data += NUM.isnan(li.coType).astype(int)
                else:
                    countV[cls].data += (li.coType == cls).astype(int)

            if pathWS is not None:

                varNameOutput = li.varName
                if ".shp" in pathWS.lower():
                    varNameOutput = li.varName[0:10]

                candidateFieldSim = SSDO.CandidateField(varNameOutput, "DOUBLE", yData, alias = ssdo.fields[varName].alias)
                li.outputResults(newFields=[candidateFieldSim], ouputPathInWorkspace=pathWS.format(f'{sim:03}'), includeOriginalAnalysisVariable = False)

            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220948).format(sim))

        ### Original Gi ####
        li.initialize()
        li.construct()

        #### Get predominant COType/Counts ####
        values = SPSTAT.mode(liCotypes, axis=1)

        #### Get counts ####
        counts = values[1].ravel()

        #### Get Count with the same value as the original COType ####
        countEqual =  NUM.zeros(ssdo.numObs, NUM.int32)
        for index in NUM.arange(ssdo.numObs):
            if li.coType[index] in [0, 1, 2, 3, 4, 5, NUM.nan]:
                countEqual[index] = countV[li.coType[index]].data[index]

        #### Get predominant COType ####
        valuesCotypes = values[0].ravel()

        n = len(valuesCotypes)

        COTypeCat = self.getCandidateFieldCategory(li.coType, "COTypeCat", ARCPY.GetIDMessage(220966))
        predCOType = self.getCandidateFieldSimpleLabel(valuesCotypes, "PredCOType", ARCPY.GetIDMessage(220967))
        predCount = SSDO.CandidateField("PredCount", "LONG", counts, alias = ARCPY.GetIDMessage(220968))
        percCount = SSDO.CandidateField("PredPcnt", "DOUBLE", NUM.asarray(100*counts/numSimulations, float), alias = ARCPY.GetIDMessage(220969))
        PredCat = self.getCandidateFieldCategory(valuesCotypes,"PredCat", ARCPY.GetIDMessage(220970))
        similarCount = SSDO.CandidateField("COType_Count", "LONG", countEqual, alias = ARCPY.GetIDMessage(220971))
        similarPerc = SSDO.CandidateField("COType_Pcnt", "DOUBLE", NUM.asarray(100*countEqual/numSimulations, float), alias =  ARCPY.GetIDMessage(220972))
        listFieldsToAddFromSouuce = []

        if "MOE" in  sensitivity:
            listFieldsToAddFromSouuce.append(sensitivity["MOE"].upper())

        if "lowField"  in sensitivity:
            listFieldsToAddFromSouuce.append(sensitivity["lowField"].upper())
            listFieldsToAddFromSouuce.append(sensitivity["highField"].upper())

        applyCoTypeConvert = True
        candidateFields = [COTypeCat]
        if resultSSDO is not None:
            applyCoTypeConvert = False

            #### Initialize the fields ####
            li.li = resultSSDO.fields["LMiIndex".upper()].data.copy()
            li.zi = resultSSDO.fields["LMiZScore".upper()].data.copy()
            li.pVals = resultSSDO.fields["LMiPValue".upper()].data.copy()
            li.zTransform = resultSSDO.fields["ZTransform".upper()].data.copy()
            li.spatialLag = resultSSDO.fields["SpatialLag".upper()].data.copy()
            li.neighbors = resultSSDO.fields["NNeighbors".upper()].data.copy()
            li.coType = resultSSDO.fields["COTYPE"].data.copy()

            for masterID in ssdo.master2Order:
                orderID = ssdo.master2Order[masterID]
                orderIDResult = resultSSDO.master2Order[masterID]
                li.li[orderID] = resultSSDO.fields["LMiIndex".upper()].data[orderIDResult]
                li.zi[orderID] = resultSSDO.fields["LMiZScore".upper()].data[orderIDResult]
                li.pVals[orderID] = resultSSDO.fields["LMiPValue".upper()].data[orderIDResult]
                li.zTransform[orderID] = resultSSDO.fields["ZTransform".upper()].data[orderIDResult]
                li.spatialLag[orderID] = resultSSDO.fields["SpatialLag".upper()].data[orderIDResult]
                li.neighbors[orderID] = resultSSDO.fields["NNeighbors".upper()].data[orderIDResult]
                li.coType[orderID] = resultSSDO.fields["COTYPE"].data[orderIDResult]

            #### recalculate the COType Categories ####
            COTypeCat = self.getCandidateFieldCategory(li.coType, "COTypeCat", ARCPY.GetIDMessage(220966))
            candidateFields = [COTypeCat]

        candidateFields.extend([maxSim, minSim, HH, HL, LH, LL, NS, NN, predCOType, PredCat, predCount, percCount, similarCount, similarPerc])

        #### Report and Set Parameters ####
        liField, ziField, pvField, coField = li.outputResults(newFields = candidateFields, 
                                                              listFieldsToAddFromSouuce = listFieldsToAddFromSouuce,
                                                              applyCoTypeConvert = applyCoTypeConvert)

        #### Get Natural Breaks ####
        breaksString = SSU.getNaturalBreaks(COTypeCat,PredCat)

        li.renderResults(parameters, simulationInformation = {"field": "COType", "heading": ARCPY.GetIDMessage(220973), "popup":SSU.createPopup(fr"//{breaksString}")})

        #### Add Group Layer ####
        self.addGroupLayer(li, outputFC)

        ### Add GP Messages ###
        minValue = NUM.min(minSim.data)
        maxValue = NUM.max(maxSim.data)
        self.printMessages(ssdo, parameters, varName, minValue, meanValue, maxValue)

    def addGroupLayer(self, li, outputFC):
        import SSAttributeUncertainty as SSU
        #### Add Group Layer ####
        glParameterIndex = 13
        ### retrieve the index of the output group layer parameter ###
        for i in NUM.arange(len(self.parameters)):
            if self.parameters[i].name == "out_group_layer":
                glParameterIndex = int(i)
                break
        SSU.addGroupLayer(li, outputFC, glParameterIndex, "COType_Pcnt")

    def getCandidateFieldSimpleLabel(self, coType, fieldName, alias):
        """Return a candidate field for a simple label field
        INPUT:
            coType (array - float): array of values
            fieldName (str): field name
            alias (str): field alias
        """
        coOutput = [coTypeConvert[i] for i in coType]

        candidateField = SSDO.CandidateField(fieldName, "TEXT", 
                                                 NUM.array(coOutput),
                                                 alias = alias,
                                                 length = 2,
                                                 checkNullValues = False)
        return candidateField

    def getCandidateFieldCategory(self, coType, fieldName, alias):
        """Return a candidate field for a category field
        INPUT:
            coType (array - float): array of values
            fieldName (str): field name
            alias (str): field alias
        """
        coTypeConvertLabel = {0: ARCPY.GetIDMessage(84511), 
                              1: ARCPY.GetIDMessage(84661),
                              2: ARCPY.GetIDMessage(84660), 
                              3:  ARCPY.GetIDMessage(84662), 
                              4: ARCPY.GetIDMessage(84659),
                              NUM.nan : ARCPY.GetIDMessage(84511), 
                              5: ARCPY.GetIDMessage(220682),
                              "NS": ARCPY.GetIDMessage(84511),
                              "HH": ARCPY.GetIDMessage(84661),
                              "LH": ARCPY.GetIDMessage(84660),
                              "LL": ARCPY.GetIDMessage(84662),
                              "HL": ARCPY.GetIDMessage(84659),  
                              None: ARCPY.GetIDMessage(84511),
                                "": ARCPY.GetIDMessage(84511),
                                " ": ARCPY.GetIDMessage(84511)}
        coOutput = [coTypeConvertLabel[i] for i in coType]
        data = NUM.array(coOutput)

        candidateField = SSDO.CandidateField(fieldName, "TEXT", 
                                                 data,
                                                 alias = alias,
                                                 length = 17,
                                                 checkNullValues = False)
        return candidateField

    def getDataRealization(self, ssdo, varName, sensitivity, seed, neighborsMean, zFactor ):
        """Get a realization of the data based on the sensitivity parameters.
        INPUT:
            ssdo (object): SSDO object
            varName (string): variable name
            sensitivity (dictionary): sensitivity parameters
            seed (int): random seed
            neighborsMean (array): mean value of neighbors
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
        SSU.printMessages(ARCPY.GetIDMessage(220965), ssdo, parameters, varName, minValue, meanValue, maxValue)        
