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

ZTRAN = True

################ Output Field Names #################
liFieldNames = ["LMiIndex", "LMiZScore", "LMiPValue"]
liFieldNamesPerm = ["LMiIndex", "LMiPValue"]
liCOFieldName =  "COType"
liNumNeighbors = "NNeighbors"
liRateFieldName = "SS_RATE"
liTextFieldName = "Li_Text"
liTextFieldAlias = "Cluster/Outlier Type"
liLagName = "SpatialLag"
liZTranName = "ZTransform"
liRenderDict = { 0: "LocalIPoints",
                 1: "LocalIPolylines",
                 2: "LocalIPolygons" }

coTypeConvert = {0: "", 1: "HH", 2: "LH", 3: "LL", 4: "HL", NUM.nan: ""}

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
                 applyFDR = False, thresholdOrigin = None, normField=None):

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
        rowStandard = self.rowStandard
        weightsFile = self.weightsFile
        swmFileBool = self.swmFileBool
        masterField = ssdo.masterField
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
                    ARCPY.AddIDMessage("Warning", 717)

        #### Set Attributes ####
        self.maxSet = maxSet
        self.threshold = threshold
        self.master2Order = ssdo.master2Order
        self.swmFileBool = swmFileBool

    def construct(self):
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
            ARCPY.AddIDMessage("Error", 906)
            raise SystemExit()

        #### Initialize Cluster-Outlier Solve Class ####
        randSeed = UTILS.getRandomSeed()
        if permutations is None:
            permutations = 0
        if permutations < 0:
            permutations = 0
        permutations = int(permutations)
        co = ARC._ss.ClusterOutlier(ssdo, self.y, permutations = permutations,
                                    random_seed = randSeed,
                                    z_transform = ZTRAN)

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
            contDict = WU.polygonNeighborDict(ssdo.inputFC, ssdo.oidName,
                                         contiguityType = contiguityType)

            polyNeighDict = COLL.defaultdict(list)

            if len(ssdo.badRecords):
                #### Remove Null Values Used in WU.polygonNeighborDict ####
                for orderID in NUM.arange(len(ssdo.xyCoords)):
                    masterID = ssdo.order2Master[orderID]
                    neighs = [i for i in contDict[masterID] if i in ssdo.master2Order]
                    if len(neighs):
                        polyNeighDict[masterID] = neighs
            else:
                polyNeighDict = contDict

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
                self.coType[orderID] = 0
                self.zi[orderID] = 0.0
                self.spatialLag[orderID] = 0.0
                self.zTransform[orderID] = 0.0
                if not self.permutations:
                    self.ei[orderID] = 0.0
                    self.vi[orderID] = 0.0
            else:
                self.li[orderID] = NUM.nan
                self.pVals[orderID] = NUM.nan
                self.coType[orderID] = 0
                self.zi[orderID] = NUM.nan
                self.spatialLag[orderID] = NUM.nan
                self.zTransform[orderID] = NUM.nan
                if not self.permutations:
                    self.ei[orderID] = NUM.nan
                    self.vi[orderID] = NUM.nan

    def outputResults(self):
        """Creates output feature class for Local I."""

        #### Prepare Derived Variables for Output Feature Class ####
        outPath, outName = OS.path.split(self.outputFC)

        #### Get Base Field Names ####
        #if self.permutations:
        #    fieldOrder = UTILS.getFieldNames(liFieldNamesPerm, outPath)
        #    fieldData = [self.li, self.pVals]
        #else:
        fieldOrder = UTILS.getFieldNames(liFieldNames, outPath)
        fieldData = [self.li, self.zi, self.pVals]
        fieldTypes = ["DOUBLE", "DOUBLE", "LONG"]

        #### Add Norm Field ####
        if self.normField:
            fieldOrder = [liRateFieldName] + fieldOrder
            fieldData = [self.y] + fieldData
            fieldTypes = ["DOUBLE"] + fieldTypes

        #### Add CO Type Field ####
        fieldOrder.append(liCOFieldName)
        coOutput = [coTypeConvert[i] for i in self.coType]
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

        #### Optionally Add Text Field Output ####
        candidateFields[liTextFieldName] = self.returnTextField()

        #### Add Date-Time Field If Applicable ####
        if self.swmFileBool:
            if self.swm.wType == 9:
                if self.swm.timeField.upper() in self.ssdo.allFields:
                    appendFields.insert(0, self.swm.timeField.upper())

        #### Write Data to Output Feature Class ####
        self.ssdo.output2NewFC(self.outputFC, candidateFields, 
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

        labelField = SSDO.CandidateField(liTextFieldName, "TEXT", labelArray,
                                         alias = liTextFieldAlias)
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
            renderLayerFile = liRenderDict[renderType]
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

            #### Data Histogram ####
            y = self.ssdo.fields[self.varName].returnDouble()
            numBreaks = int(STATS.riskFunBins(y, 8, 64, 1))
            riceBreaks = STATS.riceBins(self.ssdo.numObs)
            if riceBreaks < numBreaks:
                numBreaks = riceBreaks

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

