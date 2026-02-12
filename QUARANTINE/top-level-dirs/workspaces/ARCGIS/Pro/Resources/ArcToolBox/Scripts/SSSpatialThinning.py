# coding: utf-8
"""
Tool Name:     Spatial Thinning
Source Name:   SSSpatialThinning.py
Version:       ArcGIS Pro 2.9
Author:        Environmental Systems Research Institute Inc.
Description:   Elastic-Net Regression for Presence Only Data
"""

################ Imports ####################
import sys as SYS
import os as OS
import numpy as NUM
import numpy.linalg as LA
import arcpy.da as DA
import arcpy.management as DM
import arcpy as ARCPY
import arcgisscripting as ARC
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import Stats as STATS
import locale as LOCALE
import scipy.spatial as SCPS
ThresholdForCompensateKDTree = 10000

class PoPThinning(object):
    """
    Spatial Thinning Operator for Thinning Point Dataset
    with respect to a thinning distance
    """

    def __init__(self, ssdo, thinDist, numIter, maskResampleCoords, leafSize=40):
        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Assure some Iters ####
        if self.numIter is None:
            self.numIter = 9

        self.thinDist = self.ssdo.getDistance(thinDist)

        if not self.ssdo.distanceInfo.xyzUnitsEqual:
            ARCPY.AddIDMessage("ERROR", 110083)
            raise SystemExit()

    def thinTrainingFeatures(self, coords, presenceBool):

        n = len(coords)
        rangeInds = NUM.arange(n, dtype = NUM.int32)

        presenceInds = rangeInds[presenceBool]
        absenceInds = rangeInds[~presenceBool]
        
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220433))
        thinnedPresenceInds = self.spatial_thinning(coords[presenceBool])
        
        if self.maskResampleCoords is not None:

            idsAbsences = NUM.where(self.maskResampleCoords[~presenceBool])[0]
            thinnedAbsenceInds = idsAbsences

        else:
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220434))
            thinnedAbsenceInds = self.spatial_thinning(coords[~presenceBool])

        numThinPres = len(thinnedPresenceInds)
        numThinAbs = len(thinnedAbsenceInds)

        includedInAnalysis = NUM.zeros(n, dtype = bool)

        if numThinPres == 0 or numThinAbs == 0:
            ARCPY.AddIDMessage("ERROR", 110440, numThinPres, numThinAbs) 
            raise SystemExit()

        #### Warning When No Thinning Done ####
        if numThinPres == len(presenceInds):
            ARCPY.AddIDMessage("WARNING", 110465) 

        if numThinAbs == len(absenceInds):
            ARCPY.AddIDMessage("WARNING", 110466) 

        for thinInd in thinnedPresenceInds:
            includedInAnalysis[presenceInds[thinInd]] = True

        for thinInd in thinnedAbsenceInds:
            includedInAnalysis[absenceInds[thinInd]] = True

        return includedInAnalysis

    def spatial_thinning(self, coords):

        n = len(coords)

        #### Threshold  to use compensated trees ####
        useMedian = 1
        if n > ThresholdForCompensateKDTree:
            useMedian = 0

        kdTree = ARC._ss.KDTree(coords, leafsize = self.leafSize, use_median = useMedian)

        numNeighs = NUM.zeros(n, dtype=NUM.int32)
        neighDict = {}

        for i in range(n):
            neighs = kdTree.query_ball_point(coords[i], r=self.thinDist, p=2)
            neighs = [nh for nh in neighs if nh != i]
            neighDict[i] = neighs
            numNeighs[i] = len(neighs)

        numPoints = 0
        returnInds = None
        for iter in range(self.numIter):
            indList = []
            nn = NUM.copy(numNeighs)
            flag = True
            while flag:
                maxValue = nn.max()
                if not maxValue:
                    flag = False
                    break

                removeList = NUM.where(nn == maxValue)
                maxInd = NUM.random.choice(removeList[0])
                neighs = neighDict[maxInd]
                indList.append(maxInd)
                nn[maxInd] = 0
                nn[neighs] -= 1

            np = n - len(indList)
            #print("Number of thinned points for run {0}: {1}".format(iter, np))
            if np > numPoints:
                presence = NUM.ones(n, dtype=bool)
                presence[indList] = 0
                returnInds = NUM.where(presence)[0]
                numPoints = np

        return returnInds

    

class SpatialThinning(object):
    """
    Spatial Thinning Operator for Thinning Point Dataset
    with respect to a thinning distance
    """

    def __init__(self, ssdo, modelType, thinDist, numIter):
        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        self.thinDist = self.ssdo.getDistance(thinDist)
        self.thinPoints = []

        if not self.ssdo.distanceInfo.xyzUnitsEqual:
            ARCPY.AddIDMessage("ERROR", 110083)
            raise SystemExit()

        self.n = self.ssdo.numObs

        if self.ssdo.useChordal:
            self.coords = self.ssdo.spheroidCoords
        else:
            if self.ssdo.hasZ:
                self.coords = NUM.empty((len(self.ssdo.xyCoords), 3), dtype=float)
                self.coords[:, 0:2] = self.ssdo.xyCoords
                self.coords[:, -1] = self.ssdo.zCoords
            else:
                self.coords = self.ssdo.xyCoords

    def getJoinID(self, XY, extent, cellSize, numCols, numRows):
        """
        Helper function to assign join ids for target points
        """

        XMin = extent[0]
        YMax = extent[3]
        X = XY.T[0]
        Y = XY.T[1]

        cols = (X - XMin) // cellSize
        rows = (YMax - Y) // cellSize

        locations = rows * numCols + cols

        return locations

    def spatial_thinning(self):
        '''
        Python Implementation of CRAN's spThin Algorithm
        '''
        import scipy.spatial as SPAT
        n = self.ssdo.numObs
        iterList = []

        for i in range(self.numIter):
            ## Construct Distance Matrix
            dPair = SPAT.distance.pdist(self.coords, metric='euclidean')
            dMat = SPAT.distance.squareform(dPair)
            ## Query Locations Not Satisfying Thinning Criteria
            dMat_thin = (dMat < self.thinDist).astype(int)

            ## Initialize Thinning List
            thinList = []

            while NUM.max(NUM.tril(dMat_thin, k=-1).sum(axis=1)) and len(thinList) < n:
                summMat = NUM.sum(dMat_thin, axis=0)
                # Find the most connected point
                maxVal = NUM.max(summMat)
                # Thin the point
                removeList = NUM.where(summMat == maxVal)
                removeInd = NUM.random.choice(removeList[0])

                dMat_thin[removeInd, :] = 0
                dMat_thin[:, removeInd] = 0

                ## Add to the List for Thinning
                thinList.append(removeInd)

            iterList.append(thinList)

        l = [len(arr) for arr in iterList]
        removeList = iterList[l.index(min(l))]

        keepInd = [ind for ind in range(n) if ind not in removeList]
        self.thinPoints = self.coords[keepInd, :]

    def fast_spatial_thinning(self):
        """Grid-based Thinning."""

        mercatorProjection = ARCPY.SpatialReference(54004)
        if self.ssdo.useChordal:
            coordsProjected = ARC._ss.lonlat_to_xy_projected(self.ssdo.xyCoords,
                                                             self.ssdo.spatialRef,
                                                             mercatorProjection)
        else:
            coordsProjected = self.ssdo.xyCoords

        #### Bug in Cell Size Below...?  I think if going to Mercator is needs to be always be in METERS ####
        agg = ARC._ss.AggregateCube(coordsProjected, cell_size=self.thinDist, use_hexagons=False)
        extentList = [list(agg.origin_extent)]

        if agg.cell_values.max() > 1:

            shiftList = []
            shiftList.append([-agg.cell_size / 2, 0, agg.cell_size / 2, 0])
            shiftList.append([0, -agg.cell_size / 2, 0, agg.cell_size / 2])
            shiftList.append([-agg.cell_size / 2, -agg.cell_size / 2, agg.cell_size / 2, agg.cell_size / 2])

            extentList.append([x + y for x, y in zip(extentList[0], shiftList[0])])
            extentList.append([x + y for x, y in zip(extentList[0], shiftList[1])])
            extentList.append([x + y for x, y in zip(extentList[0], shiftList[2])])

            numCols = [agg.num_cols]
            numCols.append(numCols[0])
            numCols.append(numCols[0])
            numCols.append(numCols[0])

            numRows = [agg.num_rows]
            numRows.append(numRows[0])
            numRows.append(numRows[0] + 1)
            numRows.append(numRows[0] + 1)

            keepProjected = coordsProjected
            self.thinPoints = self.coords

            for curr_extent, cols, rows in zip(extentList, numCols, numRows):

                ids = self.getJoinID(keepProjected, curr_extent, agg.cell_size, cols, rows)

                keepInd = []

                for id in NUM.unique(ids):
                    keepInd.append(NUM.random.choice(NUM.where(ids == id)[0]))

                self.thinPoints = self.thinPoints[keepInd,]
                keepProjected = keepProjected[keepInd,]
        else:
            self.thinPoints = self.coords

    def tree_thinning(self):

        # mercatorProjection = ARCPY.SpatialReference(54004)
        # coordsProjected = ARC._ss.lonlat_to_xy_projected(self.coords, self.ssdo.spatialRef, mercatorProjection)

        # if self.ssdo.useChordal:
        #    coordsProjected = ARC._ss.lonlat_to_xy_projected(self.ssdo.xyCoords,
        #                                                       self.ssdo.spatialRef,
        #                                                       mercatorProjection)
        # else:
        #    coordsProjected = self.ssdo.xyCoords

        ## Build the Search Tree and Query Pairs within Thinning Distance
        # tree = SCPSP.cKDTree(coordsProjected)
        tree = SCPSP.cKDTree(self.coords)
        ballTree = tree.query_pairs(r=self.thinDist, p=2, eps=0)

        ## Query neighbor pairs and find outliers
        pairList = [[v1, v2] for v1, v2 in ballTree]
        nodeListInit = list(set(x for l in pairList for x in l))
        outlierIds = [v1 for v1 in range(self.n) if v1 not in nodeListInit]

        simList = []

        for i in range(self.numIter):
            ## Carry over outliers to initialization
            keepList = outlierIds.copy()
            nodeList = nodeListInit.copy()

            ## Perform recursive neighbor elimination
            while len(nodeList) > 0:
                ## Randomly pick a Node in the Tree
                keepInd = NUM.random.choice(nodeList)
                ## Update kept indices
                keepList.append(keepInd)
                ## Update the search index
                nodeList.remove(keepInd)
                ## Get index of neighbors
                delNodes = [link for node in ballTree if keepInd in node for link in node if link != keepInd]
                ## Remove all Neighbor Nodes
                nodeList = list(set(nodeList) - set(delNodes))
            ## Append to simulation list
            simList.append(keepList)
        ## Pick optimal simulation
        thinSize = [len(thinSim) for thinSim in simList]
        pickInd = thinSize.index(max(thinSize))
        if not isinstance(pickInd, int):
            pickInd = pickInd[0]

        keepList = simList[pickInd]

        self.thinPoints = self.coords[keepList,]

    def spatial_thinning_anti(self):

        kdTree = SCPS.cKDTree(self.coords)
        numNeighs = NUM.zeros(self.n, dtype=NUM.int32)
        neighDict = {}

        for i in range(self.n):
            neighs = kdTree.query_ball_point(self.coords[i], r=self.thinDist, p=2)
            neighs = [nh for nh in neighs if nh != i]
            neighDict[i] = neighs
            numNeighs[i] = len(neighs)

        numPoints = 0
        returnInds = None
        for iter in range(self.numIter):
            indList = []
            nn = NUM.copy(numNeighs)
            flag = True
            while flag:
                maxValue = nn.max()
                if not maxValue:
                    flag = False
                    break

                removeList = NUM.where(nn == maxValue)
                maxInd = NUM.random.choice(removeList[0])
                neighs = neighDict[maxInd]
                indList.append(maxInd)
                nn[maxInd] = 0
                nn[neighs] -= 1

            np = self.n - len(indList)
            print("Number of thinned points for run {0}: {1}".format(iter, np))
            if np > numPoints:
                presence = NUM.ones(self.n, dtype=bool)
                presence[indList] = 0
                returnInds = NUM.where(presence)[0]
                numPoints = np

        self.thinPoints = self.coords[returnInds]

    def run(self):
        if self.modelType.upper() == "AGGREGATION-BASED":
            self.fast_spatial_thinning()

        if self.modelType.upper() == "MATRIX-BASED":
            self.spatial_thinning()

        if self.modelType.upper() == "TREE-BASED":
            self.spatial_thinning_anti()


    def createOutput(self, outputFC):
        """Creates an Output Feature Class with the Median Centers.
        INPUTS:
        outputFC (str): path to the output feature class
        """
        #### Validate Output Workspace ####
        ERROR.checkOutputPath(outputFC)

        #### Create Output Feature Class ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84003))
        outPath, outName = OS.path.split(outputFC)

        zFlag = self.ssdo.zFlag
        writeDim = 3
        if zFlag.upper() == 'DISABLED':
            writeDim = 2

        try:
            DM.CreateFeatureclass(outPath, outName, "POINT", "", self.ssdo.mFlag,
                                  zFlag, self.ssdo.spatialRefString)
        except:
            ARCPY.AddIDMessage("ERROR", 210, outputFC)
            raise SystemExit()

        shapeFieldName = ["SHAPE@"]

        outShapeFileBool = UTILS.isShapeFile(outputFC)

        rows = DA.InsertCursor(outputFC, shapeFieldName)
        for coord in self.thinPoints:
            if writeDim == 2:
                pnt = (coord[0], coord[1])
                rowResult = [pnt]
            else:
                pnt = (coord[0], coord[1], coord[2])
                rowResult = [pnt]
            rows.insertRow(rowResult)

        #### Clean Up ####
        del rows


class SpatialJacknifing(object):
    """
    Spatial Thinning Operator for Thinning Point Dataset
    with respect to a thinning distance
    """

    # from .management import SubdividePolygon as jacknife

    def __init__(self, inputFC, outputFC, modelType, thinDist, numIter):
        self.inputFC = inputFC
        self.outputFC = outputFC
        self.modelType = modelType
        self.numIter = numIter
        self.ssdo = SSDO.SSDataObject(inputFC)
        self.thinDist = self.ssdo.getDistance(thinDist)

        self.thinPoints = []

        if not self.ssdo.distanceInfo.xyzUnitsEqual:
            ARCPY.AddIDMessage("ERROR", 110083)
            raise SystemExit()

        self.ssdo.obtainData()

        if self.ssdo.hasZ:
            self.coords = NUM.empty((len(self.ssdo.xyCoords), 3), dtype=float)
            self.coords[:, 0:2] = self.ssdo.xyCoords
            self.coords[:, -1] = self.ssdo.zCoords
        else:
            self.coords = self.ssdo.xyCoords

    def spatialSplit(self):
        mercatorProjection = ARCPY.SpatialReference(54004)
        coordsProjected = ARC._ss.lonlat_to_xy_projected(self.coords, self.ssdo.spatialRef, mercatorProjection)

        if self.ssdo.useChordal:
            coordsProjected = ARC._ss.lonlat_to_xy_projected(ssdo.xyCoords,
                                                             self.ssdo.spatialRef,
                                                             mercatorProjection)
        else:
            coordsProjected = self.ssdo.xyCoords
