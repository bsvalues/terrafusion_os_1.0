# coding: utf-8
"""
Tool Name:     Global Moran's I
Source Name:   GlobalI.py
Version:       ArcGIS 10.1
Author:        Environmental Systems Research Institute Inc.
Description:   Computes Global Moran's I statistic
"""

################### Imports ########################
import os as OS
import numpy as NUM
import arcgisscripting as ARC
import arcpy as ARCPY
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import Stats as STATS
import WeightsUtilities as WU
import gapy as GAPY
import SSReportXML as XMLREPORT
import locale as LOCALE
LOCALE.setlocale(LOCALE.LC_ALL, '')

def execute(parameters, messages):
    """Retrieves the parameters from the User Interface and executes the
    appropriate commands."""

    inputFC = UTILS.getTextParameter(0, parameters)
    varName = UTILS.getTextParameter(1, parameters).upper()
    displayIt = parameters[2].value 

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
    numNeighs = UTILS.getNumericParameter(12, parameters)
    if numNeighs is None:
        numNeighs = 0

    #### Create a Spatial Stats Data Object (SSDO) ####
    ssdo = SSDO.SSDataObject(inputFC, useChordal = True)


    #### Set Unique ID Field ####
    masterField = UTILS.setUniqueIDField(ssdo, weightsFile = weightsFile)

    #### Populate SSDO with Data ####
    if WU.gaTypes[spaceConcept]:
        ssdo.obtainData(masterField, [varName], minNumObs = 3,
                        requireSearch = True, warnNumObs = 30)
    else:
        ssdo.obtainData(masterField, [varName], minNumObs = 3,
                        warnNumObs = 30)

    #### Run Spatial Autocorrelation ####
    gi = GlobalI(ssdo, varName, wType, weightsFile = weightsFile,
                 concept = concept, rowStandard = rowStandard,
                 threshold = threshold, exponent = exponent,
                 numNeighs = numNeighs)

    #### Report and Set Parameters ####
    giString, ziString, pvString = gi.report()
    try:
        UTILS.setParameterAsText(8, giString, parameters)
        UTILS.setParameterAsText(9, ziString, parameters)
        UTILS.setParameterAsText(10, pvString, parameters)
    except:
        ARCPY.AddIDMessage("WARNING", 902)

    #### Create HTML Output ####
    if displayIt:
        htmlOutFile = gi.reportHTML(htmlFile = None)
        UTILS.setParameterAsText(11, htmlOutFile, parameters)
        return


#################### Classes ########################

class GlobalI(object):
    """Calculates Global Morans I:

    INPUTS:
    ssdo (obj): instance of SSDataObject
    varName (str): name of analysis field
    wType (int): spatial conceptualization (1)
    weightsFile {str, None}: path to a spatial weights matrix file
    concept: {str, EUCLIDEAN}: EUCLIDEAN or MANHATTAN 
    rowStandard {bool, True}: row standardize weights?
    threshold {float, None}: distance threshold
    exponent {float, 1.0}: distance decay
    numNeighs {int, 0}: number of neighbors (2)
    displayIt {bool, False}: create graphical html output?

    ATTRIBUTES:
    numObs (int): number of features in analysis
    y (array, numObs x 1): vector of field values
    gi (float): Global Morans I value 
    ei (float): Expected value of Global I
    vi (float): Var of Global I (randomization)
    zi (float): z-score for Global I 
    pVal (float): p-value (two-tailed test)
    standDev (float): sqrt(vi)
    s0,s1,s2 (float): Spatial Weights Characteristics

    NOTES:
    (1) See the wTypeDispatch dictionary in WeightsUtilities.py for a 
        complete list of spatial conceptualizations and their corresponding
        integer values.
    (2) For explicit use in KNN or can be used to modify distance-based
        methods to assure at least this number of neighbors if not enough
        based on given distance band.
    """

    def __init__(self, ssdo, varName, wType, weightsFile = None, 
                 concept = "EUCLIDEAN", rowStandard = True, threshold = None,
                 exponent = 1.0, numNeighs = 0, sensitivity = None, enableProgress = True,
                 silentStop = False, reUseNeighborhood = False):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Assess Whether SWM File Being Used ####
        self.swmFileBool = False 
        if weightsFile:
            weightSuffix = weightsFile.split(".")[-1].lower()
            self.swmFileBool = (weightSuffix == "swm")

        if sensitivity is None:
            #### Initialize Data ####
            self.initialize()

            #### Construct Based on SWM File or On The Fly ####
            self.construct()

            #### Calculate Moran's I ####
            self.calculate()

    def initialize(self, yData = None ):
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

        if yData is None:
            field = ssdo.fields[varName]
            self.y = field.returnDouble()
        else:
            self.y = NUM.asarray(yData, dtype = float)

        self.numObs = ssdo.numObs
        maxSet = False

        #### Check Number of Neighbors Parameter ####
        self.numNeighs = WU.getValidNumNeighs(self.numNeighs, ssdo.numObs, wType)

        #### Distance Threshold ####
        if wType in [0, 1, 7]:
            if threshold is None:
                threshold, avgDist = WU.createThresholdDist(ssdo, 
                                                concept = concept, enableProgress=self.enableProgress)

            #### Assures that the Threshold is Appropriate ####
            gaExtent = UTILS.get92Extent(ssdo.extent)
            fixed = (wType == 1)
            threshold, maxSet = WU.checkDistanceThreshold(ssdo, threshold,
                                                          weightType = wType)

            #### If the Threshold is Set to the Max ####
            #### Set to Zero for Script Logic ####
            if maxSet:
                #### All Locations are Related ####
                if self.numObs > 500:
                    ARCPY.AddIDMessage("Warning", 717)
            self.thresholdStr = ssdo.distanceInfo.printDistance(threshold)
        else:
            self.thresholdStr = "None"

        #### Set Attributes ####
        self.maxSet = maxSet
        self.threshold = threshold
        self.master2Order = ssdo.master2Order
        self.swmFileBool = swmFileBool

    def construct(self):
        """Constructs the neighborhood structure for each feature and
        dispatches the appropriate values for the calculation of the
        statistic."""

        swm = None      # added to address Coverity CID 278252
        gaTable = None  # added to address Coverity CID 278246

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

        #### Assure that Variance is Larger than Zero ####
        yVar = NUM.var(self.y)
        if NUM.isnan(yVar) or yVar <= 0.0:
            if self.silentStop:
                return
            ARCPY.AddIDMessage("Error", 906)
            raise SystemExit()

        #### Create Deviation Variables ####
        self.yBar = NUM.mean(self.y)
        self.yDev = self.y - self.yBar

        #### Create Base Data Structures/Variables #### 
        self.numer = 0.0
        self.denom = NUM.sum(self.yDev**2.0)
        self.rowSum = NUM.zeros(numObs)
        self.colSum = NUM.zeros(numObs)
        self.s0 = 0
        self.s1 = 0
        self.wij = {}

        #### Set Neighborhood Structure Type ####
        if self.weightsFile:
            if self.swmFileBool:
                #### Open Spatial Weights and Obtain Chars ####
                swm = WU.SWMReader(weightsFile)
                N = swm.numObs
                rowStandard = swm.rowStandard

                #### Check to Assure Complete Set of Weights ####
                if numObs > N:
                    ARCPY.AddIDMessage("Error", 842, numObs, N)
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
                                          row_standard = rowStandard)

        if self.enableProgress:
            #### Create Progressor ####
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84007), 0, N, 1)


        #### Create Neighbor Info Class ####
        ni = WU.NeighborInfo(masterField)

        self.neighborhoodCache = {}

        #### Calculation For Each Feature ####
        for i in iterVals:
            #  Added 'swm and' to address Coverity CID 278252
            if swm and  self.swmFileBool:
                #### Using SWM File ####
                info = swm.swm.readEntry()
                masterID = info[0]
                if masterID in master2Order:
                    rowInfo = WU.getWeightsValuesSWM(info, master2Order,
                                                     self.yDev, 
                                                     rowStandard = rowStandard,
                                                     isSubSet = isSubSet)
                    includeIt = True
                else:
                    includeIt = False

            elif self.weightsFile and not self.swmFileBool:
                #### Text Weights ####
                masterID = i
                includeIt = True
                rowInfo = WU.getWeightsValuesText(masterID, master2Order,
                                                  weightDict, self.yDev)
            elif wType in [4, 5]:
                #### Polygon Contiguity ####
                masterID = i
                includeIt = True
                rowInfo = WU.getWeightsValuesCont(masterID, master2Order,
                                                  polyNeighDict, self.yDev, 
                                                  rowStandard = rowStandard)

            else:
                #### Distance Based ####
                masterID = gaTable[i][0]
                includeIt = True
                rowInfo = WU.getWeightsValuesOTF(neighWeights, i, self.yDev)

            #### Subset Boolean for SWM File ####
            if includeIt:
                #### Parse Row Info ####
                orderID, yiDev, nhIDs, nhVals, weights = rowInfo

                #### Assure Neighbors Exist After Selection ####
                nn, nhIDs, nhVals, weights = ni.processInfo(masterID, nhIDs, 
                                                            nhVals, weights)

                if nn:

                    #### Process Feature Contribution to Moran's I ####
                    self.processRow(orderID, yiDev, nhIDs, 
                                          nhVals, weights) 

                    if self.reUseNeighborhood:
                        self.neighborhoodCache[orderID] = (nhIDs, weights)

            if self.enableProgress:
                #### Reset Progessor ####
                ARCPY.SetProgressorPosition()

        #### Clean Up ####
        if self.swmFileBool:
            swm.close()

        if self.sensitivity is None:

            #### Report on Features with No Neighbors ####
            ni.reportNoNeighbors(throwWarning = self.enableProgress)

            #### Report on Features with Large Number of Neighbors ####
            ni.reportWarnings()
            ni.reportMaximums()

            self.neighInfo = ni

    def processRow(self, orderID, yiDev, nhIDs, nhVals, weights):
        """Processes a features contribution to the Moran's I statistic.
        
        INPUTS:
        orderID (int): order in corresponding numpy value arrays
        yiVal (float): value for given feature
        nhIDs (array, nn): neighbor order in corresponding numpy value arrays
        nhVals (array, nn): values for neighboring features (1)
        weights (array, nn): weight values for neighboring features (1)

        NOTES:
        (1)  nn is equal to the number of neighboring features
        """

        #### Numerator Calculation ####
        sumW = weights.sum()
        self.s0 += sumW
        self.numer += NUM.sum(nhVals * weights) * yiDev

        #### Weights Charactersitics Update ####
        c = 0
        for neighID in nhIDs:
            ij = (orderID, neighID)
            ji = (neighID, orderID)
            w = weights[c] 
            self.s1 += w**2.0
            try:
                self.s1 += 2.0 * w * self.wij.pop(ji)
            except:
                self.wij[ij] = w
            self.rowSum[orderID] += w
            self.colSum[neighID] += w
            c += 1

    def calculate(self):
        """Calculate Moran's I Statistic."""

        if self.silentStop and not hasattr(self, "yBar"):
            return

        s0 = self.s0
        s1 = self.s1
        n = len(self.rowSum) * 1.0
        s2 = NUM.sum( (self.rowSum + self.colSum)**2.0 )
        self.s2 = s2
        self.ei = -1. / (n - 1)
        self.squareExpectedI = self.ei**2
        self.n = n
        scale = n / s0
        s02 = s0 * s0
        n2 = n * n
        n2s1 = n2 * s1
        ns2 = n * s2
        self.gi = (scale * (self.numer/self.denom))
        yDev4Sum = NUM.sum(self.yDev**4) / n
        yDevsqsq = (self.denom / n)**2
        b2 = yDev4Sum / yDevsqsq
        self.b2 = b2
        left = n * ((n2 - (3*n) + 3) * s1 - (n*s2) + 3 * (s02))
        right = b2 * ((n2 - n) * s1 - (2*n*s2) + 6 * (s02))
        denom = (n-1) * (n-2) * (n-3) * s02
        num = (left - right) / denom
        self.expectedSquaredI = num 
        self.vi = self.expectedSquaredI - self.squareExpectedI

        #### Assure that Variance is Larger than Zero ####
        if NUM.isnan(self.vi) or self.vi <= 0.0:
            if self.silentStop:
                return
            ARCPY.AddIDMessage("Error", 906)
            raise SystemExit()

        self.standDev = NUM.sqrt(self.vi)
        self.zi = (self.gi - self.ei)/self.standDev
        self.pVal = STATS.zProb(self.zi, type = 2)

    def report(self, fileName = None):
        """Reports the Moran's I results as a message or to a file.  If
        self.displayIt is set to True, then an html graphical report is
        generated to your default temp directory.

        INPUTS:
        fileName {str, None}: path to a text file to populate with results.
        """

        #### Create Output Text Table ####
        header = ARCPY.GetIDMessage(84160)
        giString = LOCALE.format_string("%0.6f", self.gi)
        eiString = LOCALE.format_string("%0.6f", self.ei)
        viString = LOCALE.format_string("%0.6f", self.vi) 
        ziString = LOCALE.format_string("%0.6f", self.zi) 
        pvString = LOCALE.format_string("%0.6f", self.pVal) 
        row1 = [ARCPY.GetIDMessage(84148), giString]
        row2 = [ARCPY.GetIDMessage(84149), eiString]
        row3 = [ARCPY.GetIDMessage(84150), viString]
        row4 = [ARCPY.GetIDMessage(84151), ziString]
        row5 = [ARCPY.GetIDMessage(84152), pvString]
        results =  [row1, row2, row3, row4, row5]

        footnote = []
        #### Add Linear/Angular Unit ####
        if self.wType in [0, 1, 7]:
            distanceOut = UTILS.getLocalizedUnitType(self.ssdo.distanceInfo.outputString)
            dmsg = ARCPY.GetIDMessage(84344)
            distanceMeasuredStr = dmsg.format(distanceOut)
            footnote = [distanceMeasuredStr]

        outputTable = UTILS.outputTextTable(results, header = header,
                                            pad = 1, footnote=footnote, colPad=4, emphasizeHeadRow=False,
                                            returnHTMLMsg=True, force2Txt=False)

        outputTablePlain = UTILS.outputTextTable(results, header = header,
                                            pad = 1, footnote=footnote, colPad=4,
                                            returnHTMLMsg=True, force2Txt=True)

        #### Write/Report Text Output ####
        if fileName:
            f = UTILS.openFile(fileName, "w")
            UTILS.writeText(f, outputTablePlain)
            f.close()
        else:
            ARCPY.AddMessage(outputTable)

        #### Set Formatted Floats ####
        self.giString = giString
        self.eiString = eiString
        self.viString = viString
        self.ziString = ziString
        self.pvString = pvString
        
        return giString, ziString, pvString

    def reportHTML(self, htmlFile = None):
        """Generates a graphical html report for Moran's I."""

        #### Shorthand Attributes ####
        zi = self.zi

        #### Progress and Create HTML File Name ####
        writeMSG = ARCPY.GetIDMessage(84228)
        ARCPY.SetProgressor("default", writeMSG)
        ARCPY.AddMessage(writeMSG)
        if not htmlFile:
            prefix = ARCPY.GetIDMessage(84227)
            outputDir = UTILS.returnScratchWorkSpace()
            baseDir = UTILS.getBaseFolder(outputDir)
            htmlFile = UTILS.returnScratchName(prefix, fileType = "TEXT", 
                                           scratchWS = baseDir,
                                           extension = "html")

        #### Obtain Correct Images ####
        imageDir = UTILS.getImageDir()
        clustStr = ARCPY.GetIDMessage(84243)
        dispStr = ARCPY.GetIDMessage(84244)
        if zi <= -2.58:
            imageFile = OS.path.join(imageDir, "dispersedValues01.png")
            info = ("1%", dispStr)
            imageBox = OS.path.join(imageDir, "dispersedBox01.png")
        elif (-2.58 < zi <= -1.96):
            imageFile = OS.path.join(imageDir, "dispersedValues05.png")
            info = ("5%", dispStr)
            imageBox = OS.path.join(imageDir, "dispersedBox05.png")
        elif (-1.96 < zi <= -1.65):
            imageFile = OS.path.join(imageDir, "dispersedValues10.png")
            info = ("10%", dispStr)
            imageBox = OS.path.join(imageDir, "dispersedBox10.png")
        elif (-1.65 < zi < 1.65):
            imageFile = OS.path.join(imageDir, "randomValues.png")
            imageBox = OS.path.join(imageDir, "randomBox.png")
        elif (1.65 <= zi < 1.96):
            imageFile = OS.path.join(imageDir, "clusteredValues10.png")
            info = ("10%", clustStr)
            imageBox = OS.path.join(imageDir, "clusteredBox10.png")
        elif (1.96 <= zi < 2.58):
            imageFile = OS.path.join(imageDir, "clusteredValues05.png")
            info = ("5%", clustStr)
            imageBox = OS.path.join(imageDir, "clusteredBox05.png")
        else:
            imageFile = OS.path.join(imageDir, "clusteredValues01.png")
            info = ("1%", clustStr)
            imageBox = OS.path.join(imageDir, "clusteredBox01.png")

        #### Footnote ####
        footStart = ARCPY.GetIDMessage(84230).format(str(round(zi,6)))
        if abs(zi) >= 1.65:
            footEnd = ARCPY.GetIDMessage(84231)
            footEnd = footEnd.format(*info)
            footerText = footStart + footEnd 
        else:
            footEnd = ARCPY.GetIDMessage(84232)
            footerText = footStart + footEnd

        #### Root Element ####
        title = ARCPY.GetIDMessage(84229)
        reportElement, reportTree = XMLREPORT.xmlReport(title = title)

        #### Begin Graphic SubElement ####
        graphicElement = XMLREPORT.xmlGraphic(reportElement, imageFile, 
                                           footerText = footerText)

        #### Floating Table ####
        rowVals = [ [ARCPY.GetIDMessage(84148), self.giString, ""],
                    [ARCPY.GetIDMessage(84151), self.ziString, imageBox],
                    [ARCPY.GetIDMessage(84152), self.pvString, ""] ]

        fTable = XMLREPORT.xmlTable(graphicElement, rowVals, 
                                 tType = "ssFloat")

        #### Moran Table ####
        rowVals = [ [ARCPY.GetIDMessage(84148), self.giString],
                    [ARCPY.GetIDMessage(84149), self.eiString],
                    [ARCPY.GetIDMessage(84150), self.viString],
                    [ARCPY.GetIDMessage(84151), self.ziString],
                    [ARCPY.GetIDMessage(84152), self.pvString] ]

        mTable = XMLREPORT.xmlTable(reportElement, rowVals,
                                 title = ARCPY.GetIDMessage(84160))

        #### Check Inverse Distance ####
        typeAna = WU.wTypeDispatch[self.wType]
        if self.wType == 0 and self.exponent > 1.0:
            typeAna = "INVERSE_DISTANCE_SQUARED"

        #### Dataset Table ####
        rowVals = [ [UTILS.addColon(ARCPY.GetIDMessage(84233)), 
                     self.ssdo.inputFC],
                    [UTILS.addColon(ARCPY.GetIDMessage(84016)), 
                     self.varName],
                    [UTILS.addColon(ARCPY.GetIDMessage(84234)), 
                     typeAna],
                    [UTILS.addColon(ARCPY.GetIDMessage(84235)),
                     self.concept],
                    [UTILS.addColon(ARCPY.GetIDMessage(84236)), 
                     str(self.rowStandard)],
                    [UTILS.addColon(ARCPY.GetIDMessage(84237)), 
                     self.thresholdStr],
                    [UTILS.addColon(ARCPY.GetIDMessage(84238)), 
                     str(self.weightsFile)],
                    [UTILS.addColon(ARCPY.GetIDMessage(84418)),
                     str(self.ssdo.selectionSet)] ]

        dTable = XMLREPORT.xmlTable(reportElement, rowVals,
                                 title = ARCPY.GetIDMessage(84239))

        #### Create HTML ####
        html = XMLREPORT.report2html(reportTree, htmlFile)
        ARCPY.AddMessage(UTILS.outputParagraph([UTILS.buildHyperlink(htmlFile)]))

        return htmlFile

    def getNeighborhoodCacheFromKnnUsingKDTree(self, numNeighs):
        """Create a dictionary of neighbors and weights for each feature
        using a KDTree for k-nearest neighbors.
        INPUTS:
            numNeighs (int): number of neighbors
        OUTPUT:
            neighborhoodCache (dict): dictionary of neighbors and weights
        """
        import scipy.spatial as SCPS
        neighborhoodCache = {}
        xyCoords = self.ssdo.xyCoords
        if self.ssdo.useChordal:
            xyCoords = self.ssdo.spheroidCoords

        kdTree = SCPS.cKDTree(xyCoords)
        for orderID in NUM.arange(self.ssdo.numObs):
            coordinates = xyCoords[orderID]
            info = kdTree.query(coordinates, k =numNeighs+1, p = 2)

            neighs = NUM.asarray(info[1], dtype = NUM.int32)
            mask = neighs != orderID
            neighs = neighs[mask]
            dists = info[0][mask]
            weights = NUM.ones(len(neighs), float)/len(neighs)
            neighborhoodCache[orderID] = (neighs, weights)
        return neighborhoodCache

    def getSmoothY(self, yData, neighborhoodCache):
        """Calculate the mean of the y values for the neighbors of each feature
        INPUTS:
            yData (array): array of y values
            neighborhoodCache (dict): dictionary of neighbors and weights
        OUTPUT:
            yMean (array): array of the mean of the y values for the neighbors of each feature
        """
        yMean = NUM.zeros(self.numObs, float)
        for orderID in NUM.arange(self.numObs):
            neighs, _ = neighborhoodCache[orderID]
            yMean[orderID] = NUM.mean(yData[neighs][:-1].tolist() + [yData[orderID]])
        return yMean

    def calculateUsingNeighborhoodCache(self, yData, neighborhoodCache):
        """Calculate the Moran's I statistic using a neighborhood cache
        INPUTS:
            yData (array): array of y values
            neighborhoodCache (dict): dictionary of neighbors and weights
      """
        #### Assure that Variance is Larger than Zero ####
        self.y = NUM.asarray(yData, dtype = float)
        self.numObs = self.ssdo.numObs
        numObs = self.numObs

        yVar = NUM.var(self.y)
        if NUM.isnan(yVar) or yVar <= 0.0:
            if self.silentStop:
                return
            ARCPY.AddIDMessage("Error", 906)
            raise SystemExit()

        #### Create Deviation Variables ####
        self.yBar = NUM.mean(self.y)
        self.yDev = self.y - self.yBar

        #### Create Base Data Structures/Variables #### 
        self.numer = 0.0
        self.denom = NUM.sum(self.yDev**2.0)
        self.rowSum = NUM.zeros(numObs)
        self.colSum = NUM.zeros(numObs)
        self.s0 = 0
        self.s1 = 0
        self.wij = {}

        iterVals = UTILS.ssRange(numObs)
        #### Calculation For Each Feature ####
        for i in iterVals:
            if i in neighborhoodCache:
                nhIDs, weights = neighborhoodCache[i]

                nhVals= self.yDev[nhIDs]
                self.processRow(i, self.yDev[i], nhIDs, 
                                        nhVals, weights)
        self.calculate()


class GlobalISensitivity(object):
    def __init__(self):
        pass

    def execute(self,
                Input_Feature_Class,
                Input_Field,
                Generate_Report,
                Conceptualization_of_Spatial_Relationships,
                Distance_Method,
                Standardization,
                Distance_Band_or_Threshold_Distance,
                Weights_Matrix_File,
                number_of_neighbors,
                sensitivity_info, 
                parameters):
       
        #### Import Modules ####
        import scipy.stats as SPSTAT
        import SSAttributeUncertainty as SSU

        #### Set Parameters ####
        inputFC = Input_Feature_Class
        varName = Input_Field.upper()
        fields = set()
        fields.add(varName)
        displayIt= False

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

        #### Create a Spatial Stats Data Object (SSDO) ####
        ssdo = SSDO.SSDataObject(inputFC, useChordal = True)


        #### Set Unique ID Field ####
        masterField = UTILS.setUniqueIDField(ssdo, weightsFile = weightsFile)

        #### Populate SSDO with Data ####
        if WU.gaTypes[spaceConcept]:
            ssdo.obtainData(masterField,varNameList, minNumObs = 3,
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

        #### Run Spatial Autocorrelation ####
        gi = GlobalI(ssdo, varName, wType, weightsFile = weightsFile,
                    concept = concept, rowStandard = rowStandard,
                    threshold = threshold, exponent = exponent,
                    numNeighs = numNeighs, sensitivity = sensitivity, enableProgress = False)
        
        seed = UTILS.getRandomSeed()
        #### Generate Seed if It is not Provided ####
        if seed == 0:
            seed = int(NUM.random.randint(20000))

        msg = ARCPY.GetIDMessage(84821)
        ARCPY.AddMessage(msg.format(seed))
        NUM.random.seed(seed)

        numSimulations = int(sensitivity_info["num_simulations"])
        seeds = NUM.arange(numSimulations*5000)
        NUM.random.shuffle(seeds) 

        varAlias = ssdo.fields[varName].alias
        giPVal = NUM.zeros(numSimulations, dtype = NUM.float64)
        giEi = NUM.zeros(numSimulations, dtype = NUM.float64)
        giVi = NUM.zeros(numSimulations, dtype = NUM.float64)
        giZi = NUM.zeros(numSimulations, dtype = NUM.float64)
        giGi = NUM.zeros(numSimulations, dtype = NUM.float64)
        maxSim = SSDO.CandidateField("SimMax", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).min, dtype = float), alias = fr"{varAlias} ({ARCPY.GetIDMessage(220934)}")
        minSim = SSDO.CandidateField("SimMin", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).max, dtype = float), alias = fr"{varAlias} ({ARCPY.GetIDMessage(220936)}")
                 
        simul = NUM.arange(numSimulations)+1
        meanValue = 0

        #### Obtain the path to save the simulations ####
        pathWS = UTILS.getOutputSimulation(parameters[10], parameters[0])

        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220942))
        for sim in NUM.arange(numSimulations):

            #### Check for Cancel ####
            if ARCPY.env.isCancelled:
                raise SystemExit()

            yData = self.getDataRealization(ssdo, varName, sensitivity, seeds[sim], yMeanNeighbors, zFactor)
            meanValue += yData.sum() / (ssdo.numObs * numSimulations)
            maxSim.data = NUM.maximum(maxSim.data, yData)
            minSim.data = NUM.minimum(minSim.data, yData)
            gi.initialize(yData)
            gi.construct()
            #### Calculate Moran's I ####
            gi.calculate()

            giPVal[sim] = gi.pVal
            giEi[sim] = gi.ei
            giVi[sim] = gi.vi
            giZi[sim] = gi.zi
            giGi[sim] = gi.gi

            if pathWS is not None:
                varNameOutput = gi.varName
                if ".shp" in pathWS.lower():
                    varNameOutput = gi.varName[0:10]

                candidateFieldSim = SSDO.CandidateField(varNameOutput, "DOUBLE", yData, alias = ssdo.fields[varName].alias)
                ssdo.output2NewFC(pathWS.format(f'{sim:03}'), candidateFields={candidateFieldSim.name:candidateFieldSim}, appendFields = [])

            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220948).format(sim))

        #### Original GI ####
        gi.initialize()
        gi.construct()
        #### Calculate Moran's I ####
        gi.calculate()

        ssdo.output2NewFC(parameters[1].valueAsText, candidateFields={f.name:f for f in [maxSim, minSim]}, appendFields = varNameList)

        #### Create Output Table ####
        container = UTILS.DataContainer()
        container.generateOutput(parameters[2].valueAsText, 
                                 [giPVal, giEi, giVi, giZi, giGi, simul],
                                 names = ["P_VALUE", "EXPECT_I", "VAR_I", "Z_SCORE", "MORANS_I", "SIM_ID "],
                                 alias= [ARCPY.GetIDMessage(220866), ARCPY.GetIDMessage(220987), ARCPY.GetIDMessage(220988), ARCPY.GetIDMessage(220605), ARCPY.GetIDMessage(84148), ARCPY.GetIDMessage(220932)]
                                 )
        
        #### Create histogram of Global Moran's I ####
        chart = self.createHistogram( name = ARCPY.GetIDMessage(220989), 
                                      field = "MORANS_I",
                                      title = ARCPY.GetIDMessage(220989), 
                                      xAxisTitle =   ARCPY.GetIDMessage(84148),
                                      guideLabel =  ARCPY.GetIDMessage(220990), 
                                      values = giGi, 
                                      referenceLineValue = gi.gi, 
                                      yTitle = ARCPY.GetIDMessage(220329))
        chart.description = ARCPY.GetIDMessage(220990) +" "+ LOCALE.format_string("%0.4f", gi.gi)


        #### Create histogram of Z-Score ####
        chart1 = self.createHistogram( name = ARCPY.GetIDMessage(221002), 
                                      field = "Z_SCORE",
                                      title = ARCPY.GetIDMessage(221002), 
                                      xAxisTitle =   ARCPY.GetIDMessage(221001),
                                      guideLabel =  ARCPY.GetIDMessage(221003), 
                                      values = giZi, 
                                      referenceLineValue = gi.zi, 
                                      yTitle = ARCPY.GetIDMessage(84785))

        chart1.description = ARCPY.GetIDMessage(221004) +" "+ LOCALE.format_string("%0.4f", gi.zi)

        parameters[2].charts = [chart, chart1]

        if UTILS.isPRO():
            outputName = OS.path.basename(parameters[1].valueAsText)
            if outputName.lower().endswith(".shp"):
                outputName = outputName[: -4]
            outLayer = ARCPY.management.MakeFeatureLayer(str(parameters[1].valueAsText), outputName)
            groupLayer = ARCPY.gp.MakeGroupLayer(outputName + "_" + ARCPY.GetIDMessage(220913), [outLayer]).getOutput(0)
            ARCPY.SetParameter(13, groupLayer)

        #### print messages ####
        minValue = NUM.min(minSim.data)
        maxValue = NUM.max(maxSim.data)
        self.printMessages(ssdo, parameters, varName, minValue, meanValue, maxValue)

    def createHistogram(self, name, field,  title, xAxisTitle, guideLabel= None, 
                        values = None, referenceLineValue= None, yTitle = None):
        """ Create histogram chart
        INPUT:
            name (str): chart name
            field (str): field name
            title (str): chart title
            xAxisTitle (str): x axis title
            guideLabel (str): guide label
            values (numpy.ndarray): values to be plotted
            referenceLineValue (float): reference line value
        """
        histChart = ARCPY.Chart(name)
        histChart.type = "histogram"
        histChart.title =  title
        histChart.xAxis.field = field
        histChart.xAxis.title = xAxisTitle
        if yTitle is not None:
            histChart.yAxis.title = yTitle
        if values is not None:
            histChart.xAxis.guides.new("x", referenceLineValue, None,guideLabel)
            self.reCalculateChartExtent(histChart, values, referenceLineValue)
        return histChart

    def reCalculateChartExtent(self, histChart, values, referenceLineValue):
        """ Recalculate the chart extent 
        INPUT:
            histChart (arcpy.charts.Histogram): histogram chart
            values (numpy.ndarray): values to be plotted
            referenceLineValue (float): reference line value
        """
        histChart.xAxis.minimum = min(values.min(), referenceLineValue)
        histChart.xAxis.maximum = max(values.max(), referenceLineValue)
        diff = (histChart.xAxis.maximum - histChart.xAxis.minimum)*0.1
        if histChart.xAxis.minimum == referenceLineValue:
            histChart.xAxis.minimum = histChart.xAxis.minimum - diff
        if histChart.xAxis.maximum == referenceLineValue:
            histChart.xAxis.maximum = histChart.xAxis.maximum + diff

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
        SSU.printMessages(ARCPY.GetIDMessage(220986), ssdo, parameters, varName, minValue, meanValue, maxValue)      

