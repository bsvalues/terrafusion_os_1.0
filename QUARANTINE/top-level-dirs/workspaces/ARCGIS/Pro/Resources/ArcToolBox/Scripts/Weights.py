# coding: utf-8
"""
Tool Name:     Generate Spatial Weights Matrix 
Source Name:   Weights.py
Version:       ArcGIS 10.0
Author:        Environmental Systems Research Institute Inc.
Description:   Creates spatial weights in SWM format:
               
               Header Information:
                    MasterField (str)
                    Row Standard (boolean)
                    N (int) # of observations in W

               Weight Information comes in the form of four seperate
               arrays of information for each record:
                    Unique_ID (int), Number of Neighbors (int)
                    Neighbors IDs (array of ints)
                    Weights (array of floats)
                    SumWeights (float) [unstandardized sum]
"""

################### Imports ########################
import os as OS
import sys as SYS
import numpy as NUM
import locale as LOCALE
import arcgisscripting as ARC
import arcpy as ARCPY
import arcpy.da as DA
import ErrorUtils as ERROR
import SSUtilities as UTILS
import WeightsUtilities as WU
import SSDataObject as SSDO 
import gapy as GAPY
import scipy.spatial as SCPS
import SSTimeUtilities as TUTILS

################### Helper Methods #####################
def checkDistanceThresholdSWM(ssdo, threshold, maxExtent):
    if threshold < 0:
        #### Negative Values Not Valid ####
        ARCPY.AddIDMessage("ERROR", 933)
        raise SystemExit()

    softWarn = False
    if ssdo.useChordal:
        softMaxExtent = maxExtent
        hardMaxExtent = ARC._ss.get_max_gcs_distance(ssdo.spatialRef)
        if softMaxExtent < hardMaxExtent:
            maxExtent = softMaxExtent
            softWarn = True
        else:
            maxExtent = hardMaxExtent

    if threshold == 0:
        #### Infinite Radius Not Valid For Fixed and ZOI ####
        ARCPY.AddIDMessage("ERROR", 928)
        raise SystemExit()

    #### Assure that the Radius is Smaller than the Max Extent ####
    if threshold > maxExtent:
        #### Can Not be Greater or Equal to Extent ####
        #### Applies to Fixed (1) and ZOI (7) ####
        if ssdo.useChordal and not softWarn:
            ARCPY.AddIDMessage("ERROR", 1607)
            raise SystemExit()
        else:
            ARCPY.AddIDMessage("ERROR", 929)
            raise SystemExit()
    
    return threshold

################### Methods ########################

def execute(parameters, messages):
        
    inputFC = UTILS.getTextParameter(0, parameters)
    masterField = UTILS.getTextParameter(1, parameters)
    swmFile = UTILS.getTextParameter(2, parameters)
    spaceConcept = UTILS.getTextParameter(3, parameters)
    distanceConcept = UTILS.getTextParameter(4, parameters)
    exponent = UTILS.getNumericParameter(5, parameters)
    threshold = UTILS.getNumericParameter(6, parameters)
    kNeighs = UTILS.getNumericParameter(7, parameters)
    rowStandard = parameters[8].value
    tableFile = UTILS.getTextParameter(9, parameters)

    #### Assess Temporal Options ####'
    timeField = UTILS.getTextParameter(10, parameters, fieldName = True)
    timeType = UTILS.getTextParameter(11, parameters)
    timeValue = UTILS.getNumericParameter(12, parameters)

    zEnabled = False

    #### Use 3D in PRO ####
    isPRO = UTILS.isPRO()
    if isPRO:
        zEnabled = parameters[13].value

    #### Assign to appropriate spatial weights method ####
    try:
        wType = WU.weightDispatch[spaceConcept]
    except:
        ARCPY.AddIDMessage("Error", 723)
        raise SystemExit()

    #### EUCLIDEAN or MANHATTAN ####
    try:
        concept = WU.conceptDispatch[distanceConcept]
    except:
        concept = "EUCLIDEAN"
        ARCPY.AddIDMessage("Warning", 110112) 

    if not kNeighs:
        kNeighs = 0

    #### Check Z Enable ####
    desc = ARCPY.Describe(inputFC)
    hasZ = desc.HasZ

    if not hasZ and zEnabled:
        zEnabled = False
        ARCPY.AddIDMessage("Warning", 826) 

    if wType <= 1:
        #### Distance Based Weights ####
        ARCPY.AddMessage(UTILS.outputParagraph(ARCPY.GetIDMessage(84118)))

        #### Set Options for Fixed vs. Inverse ####
        if wType == 0:        
            exponent = exponent
            fixed = 0
        else:
            exponent = 1
            fixed = 1

        #### Execute Distance-Based Weights ####
        w = distance2SWM(inputFC, swmFile, masterField, fixed = fixed, 
                         concept = concept, exponent = exponent, 
                         threshold = threshold, kNeighs = kNeighs, 
                         rowStandard = rowStandard,
                         zEnabled = zEnabled)

    elif wType == 2:
        #### k-Nearest Neighbors Weights ####
        ARCPY.AddMessage(UTILS.outputParagraph(ARCPY.GetIDMessage(84119)))
        w = kNearest2SWM(inputFC, swmFile, masterField, concept = concept,
                         kNeighs = kNeighs, rowStandard = rowStandard,
                         zEnabled = zEnabled)

    elif wType == 3:
        #### Delaunay Triangulation Weights ####
        ARCPY.AddMessage(UTILS.outputParagraph(ARCPY.GetIDMessage(84120)))
        w = delaunay2SWM(inputFC, swmFile, masterField, rowStandard = rowStandard)

    elif wType == 4:
        #### Contiguity Based Weights, Edges Only ####
        ARCPY.AddMessage(UTILS.outputParagraph(ARCPY.GetIDMessage(84121)))
        w = polygon2SWM(inputFC, swmFile, masterField, concept = concept, 
                        kNeighs = kNeighs, rowStandard = rowStandard,
                        contiguityType = "ROOK")

    elif wType == 5:
        #### Contiguity Based Weights, Edges and Corners ####
        ARCPY.AddMessage(UTILS.outputParagraph(ARCPY.GetIDMessage(84122)))
        w = polygon2SWM(inputFC, swmFile, masterField, concept = concept, 
                        kNeighs = kNeighs, rowStandard = rowStandard,
                        contiguityType = "QUEEN")

    elif wType == 9:
        ARCPY.AddMessage(UTILS.outputParagraph(ARCPY.GetIDMessage(84255)))
        w = spaceTime2SWM(inputFC, swmFile, masterField, concept = concept,
                          threshold = threshold, rowStandard = rowStandard,
                          timeField = timeField, timeType = timeType,
                          timeValue = timeValue, zEnabled = zEnabled)

    else:
        #### Tabular Input for Weights ####
        ARCPY.AddMessage(UTILS.outputParagraph(ARCPY.GetIDMessage(84123)))
        if tableFile == "" or tableFile == "#":
            ARCPY.AddIDMessage("Error", 721)
            raise SystemExit()
        else: 
            table2SWM(inputFC, masterField, swmFile, tableFile, rowStandard = rowStandard) 

def polygon2SWM(inputFC, swmFile, masterField, 
                concept = "EUCLIDEAN", kNeighs = 0,
                rowStandard = True, contiguityType = "ROOK"):
    """Creates a sparse spatial weights matrix (SWM) based on polygon
    contiguity. 

    INPUTS: 
    inputFC (str): path to the input feature class
    swmFile (str): path to the SWM file.
    masterField (str): field in table that serves as the mapping.
    concept: {str, EUCLIDEAN}: EUCLIDEAN or MANHATTAN
    kNeighs {int, 0}: number of neighbors to return (1)
    rowStandard {bool, True}: row standardize weights?
    contiguityType {str, Rook}: {Rook = Edges Only, Queen = Edges/Vertices}

    NOTES:
    (1) kNeighs is used if polygon is not contiguous. E.g. Islands
    """

    #### Set Default Progressor for Neigborhood Structure ####
    ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84143))

    #### Create SSDataObject ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC = inputFC,
                             useChordal = True)
    cnt = UTILS.getCount(inputFC)
    ERROR.errorNumberOfObs(cnt, minNumObs = 2)

    #### Validation of Master Field ####
    verifyMaster = ERROR.checkField(ssdo.allFields, masterField, types = [0,1,8])

    #### Create GA Data Structure ####
    gaTable, gaInfo = WU.gaTable(ssdo.catPath, [masterField],
                                 spatRef = ssdo.spatialRefString)

    #### Assure Enough Observations ####
    N = gaInfo[0]
    ERROR.errorNumberOfObs(N, minNumObs = 2)

    #### Assure k-Nearest is Less Than Number of Features ####
    if kNeighs >= N:
        ARCPY.AddIDMessage("ERROR", 975)
        raise SystemExit()

    #### Create Nearest Neighbor Search Type For Islands ####
    if kNeighs > 0:
        gaSearch = GAPY.ga_nsearch(gaTable)
        concept, gaConcept = WU.validateDistanceMethod(concept, ssdo.spatialRef)
        gaSearch.init_nearest(0.0, kNeighs, gaConcept)
        forceNeighbor = True
        neighSearch = ARC._ss.NeighborSearch(gaTable, gaSearch) 
    else:
        forceNeighbor = False
        neighSearch = None

    #### Create Polygon Neighbors ####
    polyNeighborDict = WU.polygonNeighborDict(inputFC, masterField, 
                                   contiguityType = contiguityType)

    #### Write Poly Neighbor List (Dict) ####
    #### Set Progressor for SWM Writing ####
    ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84127), 0, N, 1)

    #### Initialize Spatial Weights Matrix File ####
    if contiguityType == "ROOK":
        wType = 4
    else:
        wType = 5

    hasID64 = UTILS.fieldIsBigInteger(inputFC, masterField)
    swmWriter = WU.SWMWriter(swmFile, masterField, ssdo.spatialRefName, 
                             N, rowStandard, inputFC = inputFC,
                             wType = wType, distanceMethod = concept,
                             numNeighs = kNeighs, hasID64 = hasID64)

    #### Keep Track of Polygons w/o Neighbors ####
    islandPolys = []
    
    #### Write Polygon Contiguity to SWM File ####
    for row in UTILS.ssRange(N):
        rowInfo = gaTable[row]
        oid = rowInfo[0]
        masterID = rowInfo[2]
        neighs = polyNeighborDict[masterID]
        nn = len(neighs)
        if forceNeighbor:
            if nn < kNeighs:
                #### Only Force KNN If Specified & Contiguity is Less ####
                islandPolys.append(oid)
                flag = True
                knnNeighs = neighSearch[row]
                c = 0
                while flag:
                    try:
                        neighID = gaTable[knnNeighs[c]][2]
                        if neighID not in neighs:
                            neighs.append(neighID)
                            nn += 1
                            if nn == kNeighs:
                                flag = False
                        c += 1
                    except:
                        flag = False

        weights = NUM.ones(nn)

        #### Add Weights Entry ####
        swmWriter.swm.writeEntry(masterID, neighs, weights)

        #### Set Progress ####
        ARCPY.SetProgressorPosition()

    #### Report on Features with No Neighbors ####
    countIslands = len(islandPolys)
    if countIslands:
        islandPolys.sort()
        if countIslands > 30:
            islandPolys = islandPolys[0:30]
        
        ERROR.warningNoNeighbors(N, countIslands, islandPolys, ssdo.oidName, 
                                 forceNeighbor = forceNeighbor, 
                                 contiguity = True)

    #### Clean Up ####
    swmWriter.close()
    del gaTable

    #### Report Spatial Weights Summary ####
    swmWriter.report()

    #### Report SWM File is Large ####
    swmWriter.reportLargeSWM()

    del polyNeighborDict

def delaunay2SWM(inputFC, swmFile, masterField, rowStandard = True):
    """Creates a sparse spatial weights matrix (SWM) based on Delaunay
    Triangulation.  

    INPUTS: 
    inputFC (str): path to the input feature class
    swmFile (str): path to the SWM file.
    masterField (str): field in table that serves as the mapping.
    rowStandard {bool, True}: row standardize weights?
    """

    #### Set Default Progressor for Neigborhood Structure ####
    ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84143))

    #### Create SSDataObject ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC = inputFC,
                             useChordal = True)
    cnt = UTILS.getCount(inputFC)
    ERROR.errorNumberOfObs(cnt, minNumObs = 2)

    #### Validation of Master Field ####
    verifyMaster = ERROR.checkField(ssdo.allFields, masterField, types = [0,1,8])

    #### Create GA Data Structure ####
    gaTable, gaInfo = WU.gaTable(ssdo.catPath, [masterField],
                                 spatRef = ssdo.spatialRefString)

    #### Assure Enough Observations ####
    N = gaInfo[0]
    ERROR.errorNumberOfObs(N, minNumObs = 2)

    #### Process any bad records encountered ####
    numBadRecs = cnt - N
    if numBadRecs:
        badRecs = WU.parseGAWarnings(gaTable.warnings)
        err = ERROR.reportBadRecords(cnt, numBadRecs, badRecs,
                                     label = ssdo.oidName)

    #### Create Delaunay Neighbor Search Type ####
    gaSearch = GAPY.ga_nsearch(gaTable)
    gaSearch.init_delaunay()
    neighWeights = ARC._ss.NeighborWeights(gaTable, gaSearch, 
                                           weight_type = 1,
                                           row_standard = False)

    #### Set Progressor for Weights Writing ####
    ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84127), 0, N, 1)

    #### Initialize Spatial Weights Matrix File ####
    hasID64 = UTILS.fieldIsBigInteger(inputFC, masterField)
    swmWriter = WU.SWMWriter(swmFile, masterField, ssdo.spatialRefName, 
                             N, rowStandard, inputFC = inputFC,
                             wType = 3, hasID64 = hasID64)

    #### Unique Master ID Dictionary ####
    masterSet = set([])

    for row in UTILS.ssRange(N):
        masterID = int(gaTable[row][2])
        if masterID in masterSet:
            ARCPY.AddIDMessage("Error", 644, masterField)
            ARCPY.AddIDMessage("Error", 643)
            raise SystemExit()
        else:
            masterSet.add(masterID)

        neighs, weights = neighWeights[row]
        neighs = [ gaTable[nh][2] for nh in neighs ]

        #### Add Spatial Weights Matrix Entry ####
        swmWriter.swm.writeEntry(masterID, neighs, weights) 

        #### Set Progress ####
        ARCPY.SetProgressorPosition()

    del gaTable

    #### Report if Any Features Have No Neighbors ####
    swmWriter.reportNoNeighbors()

    #### Clean Up ####
    swmWriter.close()

    #### Report Spatial Weights Summary ####
    swmWriter.report()

    #### Report SWM File is Large ####
    swmWriter.reportLargeSWM()

def kNearest2SWM(inputFC, swmFile, masterField, concept = "EUCLIDEAN", 
                 kNeighs = 1, rowStandard = True, zEnabled = False):
    """Creates a sparse spatial weights matrix (SWM) based on k-nearest
    neighbors.

    INPUTS: 
    inputFC (str): path to the input feature class
    swmFile (str): path to the SWM file.
    masterField (str): field in table that serves as the mapping.
    concept: {str, EUCLIDEAN}: EUCLIDEAN or MANHATTAN 
    kNeighs {int, 1}: number of neighbors to return
    rowStandard {bool, True}: row standardize weights?
    """

    #### Assure that kNeighs is Non-Zero ####
    if kNeighs <= 0:
        ARCPY.AddIDMessage("ERROR", 976)
        raise SystemExit()

    #### Set Default Progressor for Neigborhood Structure ####
    ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84143))

    #### Create SSDataObject ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC = inputFC,
                             useChordal = True)
    if not ssdo.hasZ:
        zEnabled = False

    cnt = UTILS.getCount(inputFC)
    ERROR.errorNumberOfObs(cnt, minNumObs = 2)

    #### Validation of Master Field ####
    verifyMaster = ERROR.checkField(ssdo.allFields, masterField, types = [0,1,8])

    if not zEnabled:
        #### Create GA Data Structure ####
        gaTable, gaInfo = WU.gaTable(ssdo.catPath, [masterField],
                                     spatRef = ssdo.spatialRefString)

        #### Assure Enough Observations ####
        N = gaInfo[0]
        ERROR.errorNumberOfObs(N, minNumObs = 2)

        #### Process any bad records encountered ####
        numBadRecs = cnt - N
        if numBadRecs:
            badRecs = WU.parseGAWarnings(gaTable.warnings)
            err = ERROR.reportBadRecords(cnt, numBadRecs, badRecs,
                                         label = ssdo.oidName)

        #### Assure k-Nearest is Less Than Number of Features ####
        if kNeighs >= N:
            ARCPY.AddIDMessage("ERROR", 975)
            raise SystemExit()

        #### Create k-Nearest Neighbor Search Type ####
        gaSearch = GAPY.ga_nsearch(gaTable)
        concept, gaConcept = WU.validateDistanceMethod(concept, ssdo.spatialRef)
        gaSearch.init_nearest(0.0, kNeighs, gaConcept)
        neighWeights = ARC._ss.NeighborWeights(gaTable, gaSearch, 
                                               weight_type = 1,
                                               row_standard = False)

        #### Set Progressor for Weights Writing ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84127), 0, N, 1)

        #### Initialize Spatial Weights Matrix File ####
        hasID64 = UTILS.fieldIsBigInteger(inputFC, masterField)
        swmWriter = WU.SWMWriter(swmFile, masterField, ssdo.spatialRefName, 
                                 N, rowStandard, inputFC = inputFC,
                                 wType = 2, distanceMethod = concept,
                                 numNeighs = kNeighs, hasID64 = hasID64)

        #### Unique Master ID Dictionary ####
        masterSet = set([])

        for row in UTILS.ssRange(N):
            masterID = int(gaTable[row][2])
            if masterID in masterSet:
                ARCPY.AddIDMessage("Error", 644, masterField)
                ARCPY.AddIDMessage("Error", 643)
                raise SystemExit()
            else:
                masterSet.add(masterID)

            neighs, weights = neighWeights[row]
            neighs = [ gaTable[nh][2] for nh in neighs ]

            #### Add Spatial Weights Matrix Entry ####
            swmWriter.swm.writeEntry(masterID, neighs, weights) 

            #### Set Progress ####
            ARCPY.SetProgressorPosition()

        del gaTable

        #### Report Warning/Max Neighbors ####
        swmWriter.reportNeighInfo()

        #### Clean Up ####
        swmWriter.close()

        #### Report Spatial Weights Summary ####
        swmWriter.report()

        #### Report SWM File is Large ####
        swmWriter.reportLargeSWM()
    else:
        if not ssdo.distanceInfo.xyzUnitsEqual:
            ARCPY.AddIDMessage("ERROR", 110083)
            raise SystemExit()

        #### Read 3D Data  ####
        ssdo.obtainData(masterField, minNumObs = 2)
        N = ssdo.numObs
        kdtreeIndex, xyz = getKdTree(ssdo)

        #### Checking KdTree Index ####
        if not kdtreeIndex:
            ARCPY.AddIDMessage("ERROR", 184)
            raise SystemExit()

        #### Assure Enough Observations ####
        ERROR.errorNumberOfObs(N, minNumObs = 2)

        #### Assure k-Nearest is Less Than Number of Features ####
        if kNeighs >= N:
            ARCPY.AddIDMessage("ERROR", 975)
            raise SystemExit()

        #### Set Progressor for Weights Writing ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84127), 0, N, 1)

        #### Initialize Spatial Weights Matrix File ####
        hasID64 = UTILS.fieldIsBigInteger(inputFC, masterField)
        swmWriter = WU.SWMWriter(swmFile, masterField, ssdo.spatialRefName, 
                                 N, rowStandard, inputFC = inputFC,
                                 wType = 2, distanceMethod = concept,
                                 numNeighs = kNeighs, hasZ = True,
                                 hasID64 = hasID64)

        #### Unique Master ID Dictionary ####
        masterSet = set([])

        if concept == "EUCLIDEAN":
            typeDist = 2
        else:
            typeDist = 1

        for idNode in UTILS.ssRange(N):
            masterID = ssdo.order2Master[idNode]
            if masterID in masterSet:
                ARCPY.AddIDMessage("ERROR", 644, masterField)
                ARCPY.AddIDMessage("ERROR", 643)
                raise SystemExit()
            else:
                masterSet.add(masterID)


            baseCoor = xyz[idNode]
            distNeig = kdtreeIndex.query(NUM.array([baseCoor]), k = kNeighs+1,
                                         p = typeDist)
            row = distNeig[1][0]
            numberNeig = len(row) - 1

            neighs  = NUM.array([])
            weights = NUM.array([])
            if numberNeig > 0:
                #### Get neighbors skipping itself ####
                neighs = []
                weights = []
                for neig in row:
                    if neig != idNode:
                        neighs.append(ssdo.order2Master[neig])
                        weights.append(1.0)

                #### Add Spatial Weights Matrix Entry ####
                swmWriter.swm.writeEntry(masterID, neighs, weights) 

            #### Set Progress ####
            ARCPY.SetProgressorPosition()


        #### Report Warning/Max Neighbors ####
        swmWriter.reportNeighInfo()

        #### Clean Up ####
        swmWriter.close()

        #### Report Spatial Weights Summary ####
        swmWriter.report()

        #### Report SWM File is Large ####
        swmWriter.reportLargeSWM()

def getKdTree(ssdo):
    """ Create a cKDTree index using SCIPY

    INPUT:
    ssdo (SSDataObject): instance SSDataObject

    OUTPUTS:
    kdtreeIndex (KDTree index)
    xyz (array 3xN)
    """
    if ssdo and ssdo.hasZ:
        try:
            xyz = NUM.zeros((ssdo.numObs, 3))
            xyz[:,:-1] = ssdo.xyCoords
            xyz[:,2] = ssdo.zCoords
            if ssdo.useChordal:
                spheroidCoords = ARC._ss.lonlatelev_to_xyz(xyz, 
                                                        ssdo.spatialRef) 
                xyz = spheroidCoords

            kdtreeIndex = SCPS.cKDTree(xyz)
            return kdtreeIndex, xyz
        except:
            return None, None
    else:
        return None, None
    
def distance2SWM(inputFC, swmFile, masterField, fixed = 0, 
                 concept = "EUCLIDEAN", exponent = 1.0, threshold = None, 
                 kNeighs = 1, rowStandard = True, zEnabled = False):
    """Creates a sparse spatial weights matrix (SWM) based on k-nearest
    neighbors.

    INPUTS: 
    inputFC (str): path to the input feature class
    swmFile (str): path to the SWM file.
    masterField (str): field in table that serves as the mapping.
    fixed (boolean): fixed (1) or inverse (0) distance? 
    concept: {str, EUCLIDEAN}: EUCLIDEAN or MANHATTAN 
    exponent {float, 1.0}: distance decay
    threshold {float, None}: distance threshold
    kNeighs (int): number of neighbors to return
    rowStandard {bool, True}: row standardize weights?
    """

    #### Create SSDataObject ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC = inputFC,
                             useChordal = True)

    #### Validation of Master Field ####
    verifyMaster = ERROR.checkField(ssdo.allFields, masterField, types = [0,1,8])

    if fixed:
        wType = 1
    else:   
        wType = 0
    
    if not ssdo.hasZ:
        zEnabled = False

    if not zEnabled:
        #### Read Data ####
        ssdo.obtainData(masterField, minNumObs = 2,
                    requireSearch = True)
        N = ssdo.numObs
        gaTable = ssdo.gaTable


        #### Set Default Progressor for Neigborhood Structure ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84143))

        #### Set the Distance Threshold ####
        concept, gaConcept = WU.validateDistanceMethod(concept, ssdo.spatialRef)
        if threshold is None:
            threshold, avgDist = WU.createThresholdDist(ssdo, 
                                            concept = concept)

        #### Assures that the Threshold is Appropriate ####
        gaExtent = UTILS.get92Extent(ssdo.extent)
        threshold, maxSet = WU.checkDistanceThreshold(ssdo, threshold,
                                                      weightType = wType)

        #### If the Threshold is Set to the Max ####
        #### Set to Zero for Script Logic ####
        if maxSet:
            #### All Locations are Related ####
            threshold = 2147483647
            if N > 500:
                ARCPY.AddIDMessage("Warning", 717)

        #### Assure k-Nearest is Less Than Number of Features ####
        if kNeighs >= N and fixed:
            ARCPY.AddIDMessage("ERROR", 975)
            raise SystemExit()

        #### Create Distance/k-Nearest Neighbor Search Type ####
        gaSearch = GAPY.ga_nsearch(gaTable)
        gaSearch.init_nearest(threshold, kNeighs, gaConcept)
        neighWeights = ARC._ss.NeighborWeights(gaTable, gaSearch, 
                                               weight_type = wType,
                                               exponent = exponent,
                                               row_standard = False)

        #### Set Progressor for Weights Writing ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84127), 0, N, 1)

        #### Initialize Spatial Weights Matrix File ####
        hasID64 = UTILS.fieldIsBigInteger(inputFC, masterField)
        swmWriter = WU.SWMWriter(swmFile, masterField, ssdo.spatialRefName, 
                                 N, rowStandard, inputFC = inputFC,
                                 wType = wType, distanceMethod = concept,
                                 exponent = exponent, threshold = threshold,
                                 hasID64 = hasID64)

        #### Unique Master ID Dictionary ####
        masterDict = {}

        #### Unique Master ID Dictionary ####
        masterSet = set([])

        for row in UTILS.ssRange(N):
            masterID = int(gaTable[row][2])
            if masterID in masterSet:
                ARCPY.AddIDMessage("Error", 644, masterField)
                ARCPY.AddIDMessage("Error", 643)
                raise SystemExit()
            else:
                masterSet.add(masterID)

            neighs, weights = neighWeights[row]
            neighs = [ gaTable[nh][2] for nh in neighs ]

            #### Add Spatial Weights Matrix Entry ####
            swmWriter.swm.writeEntry(masterID, neighs, weights) 


            #### Set Progress ####
            ARCPY.SetProgressorPosition()

        del gaTable

        #### Report Warning/Max Neighbors ####
        swmWriter.reportNeighInfo()

        #### Clean Up ####
        swmWriter.close()

        #### Add Linear/Angular Unit (Distance Based Only) ####
        distanceOut = UTILS.getLocalizedUnitType(ssdo.distanceInfo.outputString)
        distanceOut = [ARCPY.GetIDMessage(84344).format(distanceOut)]

        #### Report Spatial Weights Summary ####
        swmWriter.report(additionalInfo = distanceOut)

        #### Report SWM File is Large ####
        swmWriter.reportLargeSWM()
    else:

        if not ssdo.distanceInfo.xyzUnitsEqual:
            ARCPY.AddIDMessage("Error", 110083)
            raise SystemExit()

        #### Read 3D Data  ####
        ssdo.obtainData(masterField, minNumObs = 2)
        N = ssdo.numObs
        kdtreeIndex, xyz = getKdTree(ssdo)

        #### Checking KdTree Index, Spatial Index ####
        if not kdtreeIndex:
            ARCPY.AddIDMessage("Error", 184) 
            raise SystemExit()

        #### Set Default Progressor for Neigborhood Structure ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84143))
        
        if threshold is None:
            threshold, avgDist = WU.createThresholdDistKDTree(ssdo, kdtreeIndex, xyz, 
                                                              concept = concept)
        
        #### Assures that the Threshold is Appropriate ####
        gaExtent = UTILS.get92Extent(ssdo.extent)
        threshold, maxSet = WU.checkDistanceThreshold(ssdo, threshold,
                                                      weightType = wType,
                                                      zEnabled = zEnabled)
        #### If the Threshold is Set to the Max ####
        #### Set to Zero for Script Logic ####
        if maxSet:
            #### All Locations are Related ####
            threshold = 2147483647
            if N > 500:
                ARCPY.AddIDMessage("Warning", 717)

        #### Assure k-Nearest is Less Than Number of Features ####
        if kNeighs >= N and fixed:
            ARCPY.AddIDMessage("ERROR", 975)
            raise SystemExit()


        #### Set Progressor for Weights Writing ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84127), 0, N, 1)

        #### Initialize Spatial Weights Matrix File ####
        hasID64 = UTILS.fieldIsBigInteger(inputFC, masterField)
        swmWriter = WU.SWMWriter(swmFile, masterField, ssdo.spatialRefName, 
                                 N, rowStandard, inputFC = inputFC,
                                 wType = wType, distanceMethod = concept,
                                 exponent = exponent, threshold = threshold,
                                 hasZ = True, hasID64 = hasID64)

        #### Unique Master ID Dictionary ####
        masterDict = {}

        #### Unique Master ID Dictionary ####
        masterSet = set([])

        if concept == "EUCLIDEAN":
            typeDist = 2
        else:
            typeDist = 1
        
        for idNode in UTILS.ssRange(N):
            masterID = ssdo.order2Master[idNode]
            if masterID in masterSet:
                ARCPY.AddIDMessage("Error", 644, masterField)
                ARCPY.AddIDMessage("Error", 643)
                raise SystemExit()
            else:
                masterSet.add(masterID)
            
            baseCoor = xyz[idNode]
            distNeig = kdtreeIndex.query_ball_point(NUM.array([baseCoor]), r =  threshold, p = typeDist) 
            row = distNeig[0]
            numberNeig = len(row) - 1
            neighs  = NUM.array([])
            weights = NUM.array([])

            #### Check number of neigboors ####
            if numberNeig < kNeighs:
                distNeig = kdtreeIndex.query(NUM.array([baseCoor]), k = kNeighs + 1, p = typeDist)
                row = distNeig[1][0]
                numberNeig = len(row) - 1
    
            if numberNeig > 0:
                neighs = []
                weights = []
                for neig in row:
                    #### Get neighbors skipping itself ####
                    if  neig != idNode:
                        neighs.append(ssdo.order2Master[neig])
                        #### Calculate weights  ####
                        if wType == 1:
                            weights.append(1.0)
                        else:
                            invDist = UTILS.inv_weight(baseCoor, xyz[neig], exponent)
                            weights.append(invDist)

            #### Add Spatial Weights Matrix Entry ####
            swmWriter.swm.writeEntry(masterID, neighs, weights) 
            #### Set Progress ####
            ARCPY.SetProgressorPosition()

        #### Report Warning/Max Neighbors ####
        swmWriter.reportNeighInfo()

        #### Clean Up ####
        swmWriter.close()

        #### Add Linear/Angular Unit (Distance Based Only) ####
        distanceOut = UTILS.getLocalizedUnitType(ssdo.distanceInfo.outputString)
        distanceOut = [ARCPY.GetIDMessage(84344).format(distanceOut)]

        #### Report Spatial Weights Summary ####
        swmWriter.report(additionalInfo = distanceOut)

        #### Report SWM File is Large ####
        swmWriter.reportLargeSWM()

def spaceTime2SWM(inputFC, swmFile, masterField, concept = "EUCLIDEAN",
                  threshold = None, rowStandard = True,
                  timeField = None, timeType = None,
                  timeValue = None, zEnabled = False):
    """
    inputFC (str): path to the input feature class
    swmFile (str): path to the SWM file.
    masterField (str): field in table that serves as the mapping.
    concept: {str, EUCLIDEAN}: EUCLIDEAN or MANHATTAN 
    threshold {float, None}: distance threshold
    rowStandard {bool, True}: row standardize weights?
    timeField {str, None}: name of the date-time field
    timeType {str, None}: ESRI enumeration of date-time intervals
    timeValue {float, None}: value forward and backward in time
    """

    #### Assure Temporal Parameters are Set ####
    if not timeField:
        ARCPY.AddIDMessage("ERROR", 1320)
        raise SystemExit()
    if not timeType:
        ARCPY.AddIDMessage("ERROR", 1321)
        raise SystemExit()
    if not timeValue or timeValue <= 0:
        ARCPY.AddIDMessage("ERROR", 1322)
        raise SystemExit()

    #### Create SSDataObject ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC = inputFC, useChordal = True, 
                             ignoreDateHighPrecision = True)

    #### Warn About Not Using High Precision (until 3.3) ####
    warn = ssdo.warnNotUsingHighPrecisionDates([timeField])

    if not ssdo.hasZ:
        zEnabled = False

    if not zEnabled: 
        ssdo.obtainData(masterField, [timeField], minNumObs = 2,
                        requireSearch = True)
        N = ssdo.numObs
        gaTable = ssdo.gaTable
        xyCoords = ssdo.xyCoords

        #### Set Default Progressor for Neigborhood Structure ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84143))

        #### Set the Distance Threshold ####
        concept, gaConcept = WU.validateDistanceMethod(concept, ssdo.spatialRef)
        if threshold is None:
            threshold, avgDist = WU.createThresholdDist(ssdo, 
                                            concept = concept)

        #### Assures that the Threshold is Appropriate ####
        gaExtent = UTILS.get92Extent(ssdo.extent)
        threshold, maxSet = WU.checkDistanceThreshold(ssdo, threshold,
                                                      weightType = 1)
    
        #### Set Default Progressor for Neigborhood Structure ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84143))

        #### Create Distance Neighbor Search Type ####
        gaSearch = GAPY.ga_nsearch(gaTable)
        gaSearch.init_nearest(threshold, 0, gaConcept)
        neighSearch = ARC._ss.NeighborSearch(gaTable, gaSearch)

        #### Set Progressor for Weights Writing ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84127), 0, ssdo.numObs, 1)

        #### Initialize Spatial Weights Matrix File ####
        hasID64 = UTILS.fieldIsBigInteger(inputFC, masterField)
        swmWriter = WU.SWMWriter(swmFile, masterField, ssdo.spatialRefName, 
                                 ssdo.numObs, rowStandard, inputFC = inputFC,
                                 wType = 9, distanceMethod = concept,
                                 threshold = threshold, timeField = timeField,
                                 timeType = timeType, timeValue = timeValue,
                                 hasID64 = hasID64)

        #### Create Start/End DT Arrays (I.e. Time Window) ####
        dt = ssdo.fields[timeField].data

        #### Uneven Time Breaks (Months/Years) ####
        if timeType.upper() in ["YEARS", "MONTHS"]:
            startDT, endDT = TUTILS.getUnevenTimeSpans(dt, timeValue, timeType)
        else:
            timeDelta = TUTILS.createTimeDelta(timeValue, timeType)
            startDT = dt - timeDelta
            endDT = dt + timeDelta

        for row in UTILS.ssRange(ssdo.numObs):
            masterID = gaTable[row][2]

            #### Get Date/Time Info ####
            startDT0 = startDT.item(row)
            endDT0 = endDT.item(row)

            #### Search Through Spatial Neighbors ####
            nhs = neighSearch[row]
            neighs = []
            weights = []
            for nh in nhs:

                #### Get Date/Time Info ####
                dt1 = dt.item(nh)

                #### Filter Based on Date/Time ####
                insideTimeWindow = TUTILS.isTimeNeighbor(startDT0, endDT0, dt1)
                if insideTimeWindow:
                    neighID = gaTable[nh][2]
                    neighs.append(neighID)
                    weights.append(1.0)

            #### Add Spatial Weights Matrix Entry ####
            swmWriter.swm.writeEntry(masterID, neighs, weights) 

            #### Set Progress ####
            ARCPY.SetProgressorPosition()


        #### Report Warning/Max Neighbors ####
        swmWriter.reportNeighInfo()

        #### Clean Up ####
        swmWriter.close()

        #### Add Linear/Angular Unit (Distance Based Only) ####
        distanceOut = UTILS.getLocalizedUnitType(ssdo.distanceInfo.outputString)
        distanceOut = [ARCPY.GetIDMessage(84344).format(distanceOut)]

        #### Report Spatial Weights Summary ####
        swmWriter.report(additionalInfo = distanceOut)

        #### Report SWM File is Large ####
        swmWriter.reportLargeSWM()
    else:

        if not ssdo.distanceInfo.xyzUnitsEqual:
            ARCPY.AddIDMessage("Error", 110083)
            raise SystemExit()

        ssdo.obtainData(masterField, [timeField], minNumObs = 2)
        N = ssdo.numObs
        kdtreeIndex, xyz = getKdTree(ssdo)

        #### Checking KdTree Index, Spatial Index ####
        if not kdtreeIndex:
            ARCPY.AddIDMessage("Error", 184) 
            raise SystemExit()
        
        #### Set the Distance Threshold ####
        concept, gaConcept = WU.validateDistanceMethod(concept, ssdo.spatialRef)
        
        if threshold is None:
            threshold, avgDist = WU.createThresholdDistKDTree(ssdo, kdtreeIndex, xyz, 
                                                              concept = concept)

        #### Assures that the Threshold is Appropriate ####
        gaExtent = UTILS.get92Extent(ssdo.extent)
        threshold, maxSet = WU.checkDistanceThreshold(ssdo, threshold,
                                                      weightType = 1,
                                                      zEnabled = zEnabled)
        
        #### Set Default Progressor for Neigborhood Structure ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84143))

        #### Set Progressor for Weights Writing ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84127), 0, N, 1)

        #### Initialize Spatial Weights Matrix File ####
        hasID64 = UTILS.fieldIsBigInteger(inputFC, masterField)
        swmWriter = WU.SWMWriter(swmFile, masterField, ssdo.spatialRefName, 
                                 ssdo.numObs, rowStandard, inputFC = inputFC,
                                 wType = 9, distanceMethod = concept,
                                 threshold = threshold, timeField = timeField,
                                 timeType = timeType, timeValue = timeValue,
                                 hasZ = True, hasID64 = hasID64)

        #### Create Start/End DTn Arrays (I.e. Time Window) ####
        dt = ssdo.fields[timeField].data

        #### Uneven Time Breaks (Months/Years) ####
        if timeType.upper() in ["YEARS", "MONTHS"]:
            startDT, endDT = TUTILS.getUnevenTimeSpans(dt, timeValue, timeType)
        else:
            timeDelta = TUTILS.createTimeDelta(timeValue, timeType)
            startDT = dt - timeDelta
            endDT = dt + timeDelta

         #### Unique Master ID Dictionary ####
        masterSet = set([])

        if concept == "EUCLIDEAN":
            typeDist = 2
        else:
            typeDist = 1


        for idNode in UTILS.ssRange(N):
            masterID = ssdo.order2Master[idNode]
            if masterID in masterSet:
                ARCPY.AddIDMessage("Error", 644, masterField)
                ARCPY.AddIDMessage("Error", 643)
                raise SystemExit()
            else:
                masterSet.add(masterID)

            baseCoor = xyz[idNode]
            distNeig = kdtreeIndex.query_ball_point(NUM.array([baseCoor]), r =  threshold, p = typeDist) 

            #### Get Date/Time Info ####
            startDT0 = startDT.item(idNode)
            endDT0 = endDT.item(idNode)
            row = distNeig[0]
            numberNeig = len(row) - 1

            neighs  = []
            weights = []

            if numberNeig > 0:
                #### Get neighbors skipping itself ###
                nhs = [  ssdo.order2Master[neig]  
                              for neig in row if neig != idNode ]
                for nh in nhs:
                #### Get Date/Time Info ####
                    nho = ssdo.master2Order[nh]
                    dt1 = dt.item(nho)

                    #### Filter Based on Date/Time ####
                    insideTimeWindow = TUTILS.isTimeNeighbor(startDT0, endDT0, dt1)
                    if insideTimeWindow:
                        neighs.append(nh)
                        weights.append(1.0)
            
            #### Add Spatial Weights Matrix Entry ####
            swmWriter.swm.writeEntry(masterID, neighs, weights) 

            #### Set Progress ####
            ARCPY.SetProgressorPosition()

        #### Report Warning/Max Neighbors ####
        swmWriter.reportNeighInfo()

        #### Clean Up ####
        swmWriter.close()

        #### Add Linear/Angular Unit (Distance Based Only) ####
        distanceOut = UTILS.getLocalizedUnitType(ssdo.distanceInfo.outputString)
        distanceOut = [ARCPY.GetIDMessage(84344).format(distanceOut)]

        #### Report Spatial Weights Summary ####
        swmWriter.report(additionalInfo = distanceOut)

        #### Report SWM File is Large ####
        swmWriter.reportLargeSWM()

def table2SWM(inputFC, masterField, swmFile, tableFile, rowStandard = True):
    """Converts a weigths matrix in table format into SWM format.

    INPUTS:
    inputFC (str): path to the input feature class
    masterField (str): field in table that serves as the mapping.
    swmFile (str): path to the SWM file.
    tableFile (str) path to the database table
    rowStandard {bool, True}: row standardize weights?
    """

    #### Set Default Progressor for Neigborhood Structure ####
    ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84123))

    #### Create SSDataObject ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC = inputFC)

    #### Obtain Unique IDs from Input Feature Class ####
    ssdo.obtainData(masterField, minNumObs = 2)
    ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84123))
    master2Order = ssdo.master2Order
    allMaster = list(UTILS.iterkeys(master2Order))
    n = ssdo.numObs

    #### Create Search Cursor for Input Weights Table ####
    neighFieldName = "NID" 
    weightFieldName = "WEIGHT"
    fieldList = [masterField, neighFieldName, weightFieldName]
    try:
        rows = DA.SearchCursor(tableFile, fieldList)
    except:
        ARCPY.AddIDMessage("Error", 722)
        raise SystemExit()

    #### Assure Integer Fields are Compatible ####
    masterType = ARCPY.ListFields(inputFC, masterField)[0].type
    try:
        tableMasterType = ARCPY.ListFields(tableFile, masterField)[0].type
    except:
        ARCPY.AddIDMessage("ERROR", 110, masterField)
        raise SystemExit()

    try:
        tableNIDType = ARCPY.ListFields(tableFile, "NID")[0].type
    except:
        ARCPY.AddIDMessage("ERROR", 110, "NID")
        raise SystemExit()

    hasID64 = UTILS.fieldIsBigInteger(inputFC, masterField)
    tableMaster64 = tableMasterType.upper() == "BIGINTEGER"
    tableNID64 = tableNIDType.upper() == "BIGINTEGER"

    typeCount = 1
    if hasID64:
        if tableMaster64:
            typeCount += 1
        if tableNID64:
            typeCount += 1
    else:
        if not tableMaster64:
            typeCount += 1
        if not tableNID64:
            typeCount += 1
    if typeCount != 3:
        tableMasterTypes = "({0}, {1})".format(tableMasterType, tableNIDType)
        ARCPY.AddIDMessage("ERROR", 110516, masterType, tableMasterTypes)
        raise SystemExit()

    #### Initialize Spatial Weights Matrix File ####
    swmWriter = WU.SWMWriter(swmFile, masterField, ssdo.spatialRefName, 
                             n, rowStandard, inputFC = inputFC,
                             wType = 8, inputTable = tableFile,
                             hasID64 = hasID64)

    #### Set Progressor for SWM Reading/Writing ####
    c = 0
    cnt = UTILS.getCount(tableFile)
    ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84123), 0, cnt, 1)
    lastID = "NULL"
    neighs = []
    weights = []

    #### Process Spatial Weights ####
    for row in rows:
        masterID = row[0]

        if masterID in master2Order:
            neighID = row[1]
            weight = row[2]

            if masterID == lastID:
                #### Append to Current Record ####
                try:
                    testNeigh = master2Order[neighID]
                    neighs.append(neighID)
                    weights.append(weight)
                except:
                    #### NID Does Not Exist / Not In Selection ####
                    pass

                #### Set Progress ####
                ARCPY.SetProgressorPosition()

            else:
                #### Create New Record if not NULL ####
                if lastID != "NULL":
                    allMaster.remove(lastID)
                    swmWriter.swm.writeEntry(lastID, neighs, weights) 

                    #### Reset and Initialize Containers ####
                    neighs = [neighID]
                    weights = [weight]

                else:
                    #### Create First Record ####
                    try:
                        testNeigh = master2Order[neighID]
                        neighs.append(neighID)
                        weights.append(weight)
                    except:
                        #### NID Does Not Exist / Not In Selection ####
                        pass

                lastID = masterID

                #### Set Progress ####
                ARCPY.SetProgressorPosition()
        else:
            #### Unique Id Does Not Exist / Not In Selection ####
            ARCPY.SetProgressorPosition()

    #### Write Last Record ####
    swmWriter.swm.writeEntry(lastID, neighs, weights) 
    try:
        allMaster.remove(lastID)
    except:
        pass

    #### Set Progress ####
    ARCPY.SetProgressorPosition()

    #### Write No Neighbor Features ####
    for masterID in allMaster:
        swmWriter.swm.writeEntry(masterID, [], []) 

    #### Report Warning/Max Neighbors ####
    swmWriter.reportNeighInfo()

    #### Report Spatial Weights Summary ####
    swmWriter.report()

    #### Report SWM File is Large ####
    swmWriter.reportLargeSWM()

    #### Clean Up ####
    swmWriter.close()
    del rows

