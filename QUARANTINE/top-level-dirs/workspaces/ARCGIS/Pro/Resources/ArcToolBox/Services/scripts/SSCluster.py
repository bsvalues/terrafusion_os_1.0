# coding: utf-8
"""
Tool Name:  Density-based Clustering  
Source Name: SSCluster.py
Version: ArcGIS PRO 2.1
Author: ESRI

This tool performs spatial clustering based on DBSCAN, HDBSCAN and OPTICS algorithms:

Source:
Ankerst, Mihael, et al. "OPTICS: ordering points to identify the clustering structure." ACM Sigmod record. Vol. 28. No. 2. ACM, 1999.
R. Campello, D. Moulavi, and J. Sander, Density-Based Clustering Based on Hierarchical Density Estimates In: Advances in Knowledge Discovery and Data Mining, Springer, pp 160-172. 2013
github.com/scikit-learn-contrib/hdbscan

LOF -> added 2020 -> ArcGIS PRO 2.7

"""

################### Imports ########################
import numpy as NUM
import math
import SSDataObject as SSDO
import WeightsUtilities as WU
import arcgisscripting as ARC
import arcpy as ARCPY
import os as OS
import sys as SYS
import scipy.spatial as SCPSP
import scipy.stats as SCPS
import SSUtilities as UTILS
import collections as COLL
import SSForest as SSF
import os as OS
import sys as SYS
import datetime as DT
import SSTimeUtilities as TUTILS
import dateutil as DUT

################## Global Variables ##################
UNCLASSIFIED = -1
NOISE = -2
maxValue = 1.79769313486232E+308
usePLT = False
ThresholdForCompensateKDTree = 10000
NULL = -999999
minNumPointsLOF = 21
################## Helper Functions ##################
def getColors(n, containNoise = False, returnHex = False):
    if not returnHex:
        if not containNoise:
            return ["166,206,227", "31,120,180", "178,223,138", "51,160,44",
                    "251,154,153", "227,26,28", "253,191,111", "255,127,0"]
        else:
            return ["156,156,156", "166,206,227", "31,120,180", "178,223,138",
                    "51,160,44", "251,154,153", "227,26,28", "253,191,111",
                    "255,127,0"]
    else:
        if not containNoise:
            return ["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C",
                    "#FB9A99", "#E31A1C", "#FDBF0B", "#FF7F00"]
        else:
            return ["#9C9C9C", "#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C",
                    "#FB9A99", "#E31A1C", "#FDBF0B", "#FF7F00"]





def getLayer(labels, counts, colorData = None, is3DInput = False, shapeType = "POINT", timeEnabled = None):
    """
    Use a template layer to generate a customized layer.
    The default symbol is described in a line 'decribeSymbolType',
    this position should be known from the template layer.

    OUTPUT :  layer (lyrx) path
    """

    applyTimeSlider = True if timeEnabled is not None else False

    import tempfile as TEMPFILE
    import random  as RANDOM

    if shapeType == "POINT":
        typeSymbolLocation = 299
        groupLocationInsert = 303
        elevationTypeLocation = 52
        isflatten = 68
        noiseLocation = 297
        removeLines = 308
    else:
        typeSymbolLocation = 519
        groupLocationInsert = 523
        elevationTypeLocation = 0
        isflatten = 66
        noiseLocation = 517
        removeLines = 531

    referenceColor = "156,156,156"
    referenceSize = ":4"
    heading = "Color ID"

    pointLegend ='{{"type":"CIMUniqueValueClass","editable":true,"label":"{0}","patch":"Default","symbol":\
               {1} "values":[{{\"type":"CIMUniqueValue","fieldValues":["{2}"]}}],"visible":true}}'
    group = '"groups":[{{"type" : "CIMUniqueValueGroup","classes" : [{0}],"heading" : "'+ heading +'" }}],'


    containNull = False

    if -1 in labels:
        containNull = True

    if colorData is None:
        colors = getColors(len(labels), containNull)
    else:
        colors = colorData

    if shapeType == 'POINT':
        pathLayer = OS.path.join(UTILS.pathLayers, "ClusterPoints.lyrx")
    else:
        pathLayer = OS.path.join(UTILS.pathLayers, "ClusterPolygons.lyrx")

    if OS.path.isfile(pathLayer):
        f = open(pathLayer, 'r')
    else:
        last = "Resources" + OS.sep + "ArcToolBox" + OS.sep + "Templates" + OS.sep +"Layers" + OS.sep+ "ClusterPoints.lyrx"
        pathLayer = OS.path.join(ARCPY.GetInstallInfo()["InstallDir"], last)
        f = open(pathLayer, 'r')

    lines = f.readlines()
    f.close()
    decribeSymbolType = lines[typeSymbolLocation]

    if is3DInput:
        lines[elevationTypeLocation] = lines[elevationTypeLocation].replace("0", "Shape.Z")
    else:

        lines[isflatten] = ""
        lines[elevationTypeLocation] = ""

    iniText = lines[0:groupLocationInsert]
    endText = lines[groupLocationInsert:len(lines)]
    clusterStr = ARCPY.GetIDMessage(84767)
    clusterStrOne = ARCPY.GetIDMessage(84768)
    noiseStr = ARCPY.GetIDMessage(84765)
    iniText[noiseLocation] = lines[noiseLocation].replace("Noise", noiseStr)
    listValues = []
    for value in zip(labels, colors, counts):
        if value[0] != - 1:
            nT = decribeSymbolType.replace(referenceColor , value[1])
            nT = nT.replace(referenceSize, ":7")
            if value[2] == 1:
                listValues.append(pointLegend.format(
                                  clusterStrOne.format(value[2]), nT, value[0]))
            else:
                listValues.append(pointLegend.format(
                                  clusterStr.format(value[2]), nT, value[0]))

    classes = ",".join(listValues)
    groupValues = group.format(classes)
    iniText += [groupValues];
    iniText += endText;

    #### Avoid to Use Previous Layer ####
    startLayerCIM = 8

    #### Remove CIM extra Lines ####
    for i in NUM.arange(startLayerCIM):
        iniText[i]= ""

    for i in NUM.arange(removeLines+1, len(iniText), 1):
        iniText[i]= ""

    info = " ".join(iniText)

    if applyTimeSlider:
        import json
        import arcpy.cim
        from arcpy.cim.cimloader import GetJSONTypeOBJ
        from arcpy.cim.cimloader import  CimJsonEncoder
        layerCIM = GetJSONTypeOBJ(json.loads(info))
        timeTD = arcpy.cim.CreateCIMObjectFromClassName('CIMTimeTableDefinition', 'V2')
        timeTD.startTimeField = timeEnabled[0]
        layerCIM.featureTable.timeFields = timeTD
        tDef = arcpy.cim.CreateCIMObjectFromClassName('CIMTimeDataDefinition', 'V2')
        tDef.useTime = True
        tExt = arcpy.cim.CreateCIMObjectFromClassName('TimeExtent', 'V2')
        tExt.start = int(timeEnabled[1])
        tExt.end = int(timeEnabled[2])
        tExt.empty = False
        tDef.customTimeExtent = tExt
        layerCIM.featureTable.timeDefinition = tDef
        tDDef = arcpy.cim.CreateCIMObjectFromClassName('CIMTimeDisplayDefinition', 'V2')
        tDDef.timeInterval = 10
        tDDef.timeIntervalUnits = "esriTimeUnitsUnknown"
        tDDef.timeOffsetUnits = "esriTimeUnitsDays"
        layerCIM.featureTable.timeDisplayDefinition = tDDef
        layerCIM.featureTable.timeDimensionFields =  arcpy.cim.CreateCIMObjectFromClassName('CIMTimeDimensionDefinition', 'V2')
        info = json.dumps(layerCIM, cls=CimJsonEncoder)

    #### Apply JSON CIM ####
    ARCPY.gp.SetParameterSymbology(1, "JSONCIMDEF="+info.strip())

def checkLabels(labels):
    minValue = labels.min()
    if minValue == -1:
        label = labels>-1
        labels[label] = labels[label] + 1
    if minValue == 0:
        labels = labels + 1
    return labels

class CoordinateHandler():
    """
    This class calculates Spheroid coordinates from a SSDataObject instance 
    convertint GCS xyCoords and zCoords in a XYZ spheriod coordinates.
    If xyCoords is PCS, it will return XYZ generated by SSDataObject.

    INPUT:
    ssdo: {SSDataObject instance}
    """

    def __init__(self, ssdo):
        self.ssdo = ssdo
        self.hasZ = ssdo.hasZ
        geographic = self.ssdo.distanceInfo.type == "GEOGRAPHIC"

        if ssdo.hasZ:
            self.xyz = NUM.zeros((len(ssdo.xyCoords), 3))
            self.xyz[:,:-1] = ssdo.xyCoords
            self.xyz[:,2] = ssdo.zCoords
        else:
            self.xyz = ssdo.xyCoords

        if geographic:
            self.changeDim = True
            self.XYZ = self.getSpheroidXYZ(ssdo)

            if self.XYZ is None:
                self.changeDim = False
            else:
                self.xyCoords = ssdo.xyCoords.copy()
                if ssdo.hasZ:
                    self.zCoords = ssdo.zCoords.copy()
        else:
            self.changeDim = False

    def reset(self):
        if self.changeDim:
            self.ssdo.xyCoords = self.xyCoords
            if self.hasZ:
                self.ssdo.zCoords = self.zCoords
            self.ssdo.hasZ = self.hasZ
            return self.ssdo
        return self.ssdo

    def setCoordinates(self):
        """
        This function replaces xyCoords and zCoords using
        spheroid coordinates. Useful for  WU.SciPyNeighborSearch
        """
        if self.changeDim:
            self.ssdo.xyCoords = self.XYZ[:,:-1].copy()
            self.ssdo.zCoords = self.XYZ[:, 2].copy()
            self.ssdo.hasZ = True
            return  self.ssdo
        else:
            return self.ssdo

    def getSpheroidXYZ(self, ssdo):
        """
        Calculate Spheriod Coordinates taking into account the elevation
        """
        if ssdo and self.hasZ:
            try:
                spheroidCoords = None
                if ssdo.useChordal:
                    spheroidCoords = ARC._ss.lonlatelev_to_xyz(self.xyz, 
                                                            ssdo.spatialRef) 
                return spheroidCoords
            except:
                return None
        else:
            try:
                if ssdo.useChordal:
                    return ssdo.spheroidCoords
            except:
                return None
            return None

    def getXYZ(self, spheric = True):
        """
        Get xyz coorditates
        """
        if self.changeDim:
            if spheric:
                return self.XYZ
            else:
                if self.hasZ :
                    return self.xyz
                else:
                    return ssdo.xyCoords
        else:
            return self.xyz

def numClustersMessage(labels):
    """
    Display the number of Clusters
    """
    uniques, counts = NUM.unique(labels, return_counts = True)
    n = len(uniques)
    nNoise = 0
    if -1 in uniques:
        n = len(uniques) - 1
        nNoise = counts[0]

    if n:
        clusterStr = ARCPY.GetIDMessage(84764)
        ARCPY.AddMessage(clusterStr + " " + str(n))
        ARCPY.AddMessage(ARCPY.GetIDMessage(84766) + str(nNoise))
    else:
        ARCPY.AddIDMessage("WARNING", 110142)

def output(ssdo , outputFC, classification, colorData = None, layer = True, nCounts = None, checkNull = [], timeEnabled = None):
    """
    This function creates an output feature class using array of data arrays
    """
    lFields = []
    classify = None
    
    if type(classification) == NUM.array:
        field  = SSDO.CandidateField(name = "CLUSTER_ID",
                                    type = "LONG",
                                    data = classification
                                    )
        classify = classification
        lFields.append(field)
    elif type(classification) == list:
        #### Add Candidate Fields ####
        for el in classification:
            checkNullValue = el[0] in checkNull
            field  = SSDO.CandidateField(name = el[0],
                            alias = el[1][2],
                            type =  el[1][1].upper(),
                            data = el[1][0],
                            checkNullValues = checkNullValue)
            lFields.append(field)
            if el[0].upper() == "COLOR_ID":
                classify = el[1][0]

    #### Use DataObject to create an Output Feature Class ####
    try:
        if hasattr(ssdo, "shapes"):
            ssdo.shapes = list(ssdo.shapes)
        ARC._ss.output_featureclass_from_dataobject(ssdo, outputFC, lFields )
    except:

        raise SystemExit()

    # if layer :
    #     try:
    uniques, counts = NUM.unique(classify, return_counts = True)
    #         return getLayer(uniques, nCounts, colorData, ssdo.hasZ)
    #     except:
    #         ARCPY.AddIDMessage("WARNING", 973)
            
    return uniques, nCounts

class TimeEnabler(object):
    def __init__(self, ssdo, timeField, timeInterval, outputFC):
        self.timeField = timeField
        self.timeInterval = timeInterval
        self.outputFC = outputFC
        self.timeData = None
        self.timeEnabled = False
        self.ssdo = ssdo
        self.breakTimeSize = 0
        self.LInterval = None
        self.HInterval = None
        self.infoLayer = None
        self.isShapeFile = UTILS.isShapeFile(self.outputFC)

        #### Warn About Losing Time in Shapefiles ####
        if self.isShapeFile and timeField is not None:
            ARCPY.AddIDMessage("WARNING", 110402)

    def getColorSeries(self, cIds , coId):
        lColors = getColors(-1, True, returnHex = True )
        ids = NUM.unique(cIds)
        lstC = []
        for i in ids:
            msk = cIds == i
            n = msk.sum()
            id = int(coId[msk].sum()/n)
            if id== -1:
                id = 0
            lstC.append(lColors[id])
        return lstC

    def loadData(self):

        if self.timeField  is None or self.timeInterval is None:
            self.ssdo.obtainData()
        else:
            self.__updateTimeInformation()
            self.__generateIntervals()
            self.timeEnabled = True

    def __generateIntervals(self):
        import operator

        self.ssdo.obtainData(fields = [self.timeField .upper()])
        refTime = NUM.array([DT.datetime(1970,1,1,0,0,0)], dtype= '<M8[s]')
        dateInfo = self.ssdo.fields[self.timeField .upper()].data
        data = (dateInfo - refTime[0]) / NUM.timedelta64(1, 's')
        unit = self.timeUnit[:-1] if self.timeUnit[-1] == "S" else self.timeUnit
        selectUnit = {"SECOND":"seconds",
                    "MINUTE":"minutes",
                    "HOUR":"hours",
                    "DAY":"days",
                    "WEEK":"weeks",
                    "MONTH":"months",
                    "YEAR":"years"}

        if unit not in ["MONTH", "YEAR"]:
            self.timeData = data

        else:
            #### Create interval for months/years ####
            self.timeData = NUM.zeros((len(data),3), dtype = NUM.float64)
            self.timeData.T[1] = data
            unitValid = {selectUnit[unit]:int(self.timeSize)}
            unq = NUM.unique(dateInfo)

            #### Calculate interval for each datetime value ####
            for dateRecord in unq:
                msk = dateInfo == dateRecord
                changedI = operator.sub(dateRecord.astype('O'), DUT.relativedelta.relativedelta(**unitValid))
                self.timeData.T[0][msk] = (NUM.array([changedI],dtype= '<M8[s]') - refTime[0]) / NUM.timedelta64(1, 's')
                changed = operator.add(dateRecord.astype('O'), DUT.relativedelta.relativedelta(**unitValid))
                self.timeData.T[2][msk] = (NUM.array([changed],dtype= '<M8[s]') - refTime[0]) / NUM.timedelta64(1, 's')

    def __updateTimeInformation(self):

        #### Set/Validate Time Size ####
        self.timeSize, self.timeUnit = self.timeInterval.split(" ")
        try:
            self.timeSize = int(self.timeSize)
        except:
            ARCPY.AddIDMessage("ERROR", 110403)
            raise SystemExit()

        if self.timeSize < 0:
            ARCPY.AddIDMessage("ERROR", 110404)
            raise SystemExit()

        #### Set Even Versus Uneven (Calendar) Breaks ####
        if self.timeUnit in ["MONTH", "MONTHS", "YEAR", "YEARS"]:
            unevenTimeBreak = True
        else:
            unevenTimeBreak = False

        #### Set/Validate Time Unit ####
        self.timeUnit = self.timeUnit.upper()
        if self.timeUnit.upper() not in  TUTILS.supportTime:
            ARCPY.AddIDMessage("ERROR", 110008)
            raise SystemExit()

        self.breakTimeSize = None
        self.breakTimeUnit = None

        #### Get Time Break Values ####
        if not unevenTimeBreak:
            self.breakTimeSize = TUTILS.createTimeDelta(int(self.timeSize), self.timeUnit).astype(NUM.float64)
            self.breakTimeUnit = "SECONDS"
        else:
            self.breakTimeSize = self.timeSize
            self.breakTimeUnit = self.timeUnit

    def __getDiagonalExtent(self):
        isGCS =  self.ssdo.spatialRefType.upper() == "GEOGRAPHIC"
        if isGCS:
            coords = self.ssdo.spheroidCoords
        else:
            coords = self.ssdo.xyCoords

        minX = coords.T[0].min()
        minY = coords.T[1].min()
        maxX = coords.T[0].max()
        maxY = coords.T[1].max()
        maxE = NUM.sqrt((maxX-minX)**2 + (maxY-minY)**2)
        if maxE <= 0:
            maxE = 1
        return maxE


    def updateOutputDictionary(self, fieldDict):
        timeData = self.ssdo.fields[self.timeField.upper()].data
        timeFieldName = self.timeField

        #### Should Solve NULL Date Fields in SHP When Field Longer Than 10 ####
        path,fName = OS.path.split(self.outputFC)
        timeFieldName = ARCPY.ValidateFieldName(timeFieldName, path)

        if timeFieldName in ["START_TIME", "END_TIME", "MEAN_TIME"]:
            if self.isShapeFile:
                timeFieldName = timeFieldName[0:8] + "_1"
            else:
                timeFieldName = timeFieldName + "_1"

        self.timeFieldName = timeFieldName
        self.timeFieldAlias = self.ssdo.fields[self.timeField.upper()].alias

        fieldDict.append([timeFieldName, (self.ssdo.fields[self.timeField.upper()].data, "DATE",
                                          self.timeFieldAlias)])
        classes = NUM.unique(self.out)
        timeStart = timeData.copy()
        timeEnd = timeData.copy()
        timeMean = timeData.copy()
        info = []

        for id in classes:
            msk = self.out == id
            minD = timeData[msk].min()
            maxD = timeData[msk].max()
            meanD = timeData[msk].view('i8').mean().astype('datetime64[s]')
            timeStart[msk] = minD
            timeEnd[msk] = maxD
            timeMean[msk] = meanD
            info.append(meanD)

        n = len(timeData)

        exag = NUM.zeros(n, dtype= NUM.float64)
        minEx = timeData.view('i8').min()
        maxEx = timeData.view('i8').max()

        minExS = timeMean.view('i8').min()
        maxExS = timeMean.view('i8').max()
        self.infoLayer = ["MEAN_TIME", minExS*1000 , maxExS*1000]
        means = NUM.array(info, dtype = 'datetime64[s]' )
        diffT = maxEx - minEx

        if diffT == 0:
            diffT = 1.0

        threshold = 50000
        mapEx = self.__getDiagonalExtent()*0.3
        mapEx = min(mapEx,threshold )
        exag = NUM.array(timeData.view('i8'), dtype = NUM.float64)
        exag = (exag - minEx)*mapEx/diffT


        fieldDict.append(["START_TIME" , (timeStart, "DATE",
                                            ARCPY.GetIDMessage(84531))])
        fieldDict.append(["END_TIME" , (timeEnd, "DATE",
                                            ARCPY.GetIDMessage(84532))])
        fieldDict.append(["MEAN_TIME" , (timeMean, "DATE",
                                            ARCPY.GetIDMessage(220164))])
        fieldDict.append(["TIME_EXAGG" , (exag, "DOUBLE",
                                            ARCPY.GetIDMessage(220165))])

class Colors:
    """
    This class creates the indices of a thematic map 
    using a mutual exlusion color algorithm
    INPUT:
        xyz {array (2,n)/(3/n), 2d/3d}: Coordinates of objects
        label:{array (1,n)}: Class id of each xyz position
    """
    N = 8
    def __init__(self, xyz, label):
        self.xyz = xyz
        self.label = label

    class Center:
        def __init__(self, xy):
            self.dim = len(xy)
            if  self.dim == 2:
                self.X = xy[0]
                self.Y = xy[1]
            else:
                self.X = xy[0]
                self.Y = xy[1]
                self.Z = xy[2]

    class Circle:
        def __init__(self, xy, radius):
            self.Center = Colors.Center(xy)
            self.Radius = radius
            
        def Intersects(self, circle):
            distanceX = self.Center.X - circle.Center.X
            distanceY = self.Center.Y - circle.Center.Y
            radiusSum = circle.Radius + self.Radius
            if self.Center.dim == 3:
                distanceZ = self.Center.Z - circle.Center.Z
                return distanceZ * distanceZ + distanceX * distanceX + distanceY * distanceY <= radiusSum * radiusSum
            return distanceX * distanceX + distanceY * distanceY <= radiusSum * radiusSum

        def Contains(self, circle):
            if (circle.Radius > self.Radius):
                return False
            distanceX = self.Center.X - circle.Center.X
            distanceY = self.Center.Y - circle.Center.Y
           
            radiusD = self.Radius - circle.Radius
            if self.Center.dim == 3:
                distanceZ = self.Center.Z - circle.Center.Z
                return distanceZ * distanceZ + distanceX * distanceX + distanceY * distanceY <= radiusD * radiusD
            return distanceX * distanceX + distanceY * distanceY <= radiusD * radiusD

    def getCircle(self, xy):
        minv = NUM.min(xy, axis = 0)
        maxv = NUM.max(xy, axis = 0)
        r = NUM.sqrt(((minv - maxv)**2).sum())
        center = xy.sum(0) / len(xy)
        return Colors.Circle(center, r)

    def checkNeihbors(self, i,includeItself = True):
        idNeigh = list(self.nn[i])
        center = self.circles[i]

        if includeItself:
            realNeigh = [i]
        else:
            realNeigh = []
        for index, id in enumerate(idNeigh):
            if center.Intersects(self.circles[id]) or \
               center.Contains(self.circles[id]):
                realNeigh.append(id)
        return realNeigh
        
    def getList(self, value):
        l = []
        sub = 0
        for i in NUM.arange(Colors.N):
            v = i + value - sub + 1
            if v <= Colors.N:
                l.append(v)
            else:
                sub = Colors.N
                l.append(i + value - sub + 1)
        return l

    def complementColors(self, listCol, ini = 1):
        com =[]
        lC= self.getList(ini)
        for index, ex in enumerate( NUM.in1d(lC, list(listCol))):
            if not ex:
                com.append(lC[index])
        nComplemColors = []
        lessUsedColors = self.distributionColors[NUM.argsort(self.distributionColors.T[1])][:,0]
        
        for index, nc in enumerate(lessUsedColors):
            if (int(nc+1) in com):
                nComplemColors.append(int(nc+1))
        if len(nComplemColors) == 0:
            return [lessUsedColors[1]]
        return nComplemColors


    def setColorId(self, id, value):
        self.colorId[id] = value
        self.distributionColors[value-1][1] += 1

    def setColors(self, neighborsChecked):
        for index, neig in enumerate(neighborsChecked):
            if self.colorId[neig] == 0:
                opt = self.colorNeighbors(neig)
                self.setColorId(neig, opt[0])
                #self.colorId[neig] = opt[0]
    
    def colorNeighbors(self, i):
        rNeighs = self.checkNeihbors(i, includeItself = False)
        eq = []
        dif = set()
        for neigh in rNeighs:
            dif.add(self.colorId[neigh])
        options = self.complementColors(dif, len(dif))
        return options
    

    def getColors(self):
        #import matplotlib.pyplot as plt

        self.distributionColors = NUM.zeros((Colors.N,2), dtype = NUM.int32)
        self.distributionColors.T[0] = NUM.arange(Colors.N)

        xyz = self.xyz
        labels = self.label
        uniqueCases = list(sorted(NUM.unique(labels)))
        noise = False
        uniqueOriginal = uniqueCases.copy()

        if -1 in uniqueCases :
            noise = True
        
        if noise:
            uniqueCases.pop(0)

        nGroups = len(uniqueCases)
        self.colorId = NUM.zeros( nGroups, dtype = NUM.int32)
        colors = self.getList(0)

        if len(uniqueCases) <= 8:
            for i, id in enumerate(uniqueCases):
                self.colorId[i] = colors[i]
        else:
            nGroups = len(uniqueCases)
            xyC = NUM.zeros((nGroups, xyz.shape[1]), dtype = float)
            radius = NUM.zeros((nGroups, 2), dtype = float)
            radius.T[0] = NUM.arange(len(uniqueCases))
            self.circles = []

            for index, i in enumerate(uniqueCases):
                gXYZ = xyz[labels == i]
                center = gXYZ.sum(0) / len(gXYZ)
                c = self.getCircle(gXYZ)
                xyC[index] = center
                self.circles.append(c)
                radius[index][1] = c.Radius
            
            self.tree = SCPSP.cKDTree(xyC)
            #### Create Hash set ####
            self.nn = COLL.defaultdict(set)

            self.dist = {}
            groupsList = NUM.arange(nGroups)
            self.colorId = NUM.zeros( nGroups, dtype = NUM.int32)

            for index, i in enumerate(groupsList):
                self.dist[i], neighs= self.tree.query(xyC[i], k = Colors.N)
                self.circles[i].Radius= self.dist[i][Colors.N-1]
                for neigh in neighs:
                    if index != neigh:
                        self.nn[index].add(neigh)
                        self.nn[neigh].add(index) 

                if self.circles[i].Radius == 0:
                    self.circles[i].Radius = self.dist[i][3]

            newOrder = radius[NUM.argsort(radius.T[1])].T[0]

            for index in groupsList:
                rNeighs = self.checkNeihbors(int(newOrder[index]))
                self.setColors(rNeighs)

        unique, count = NUM.unique(self.colorId, return_counts = True)
        labelsCopy = labels.copy()

        for id, value in enumerate(uniqueCases):
            labelsCopy[labels == value] = self.colorId[id]

        if noise:
            count = [1] + list(count)
        return  labelsCopy,  unique , count

################## DBSCAN ############################
class DBSCAN(TimeEnabler):
    valueEPS = None
    def __init__(self, inputFC, outputFC, minPoints, eps = None, seed = 0, leaf_size = 40, parallel = -1,
                 timeField = None, timeInterval = None):
        self.leaf_size = leaf_size
        self.inputFC = inputFC
        self.minPoints = minPoints
        self.outputFC = outputFC
        self.parallel = parallel
        self.ssdo = SSDO.SSDataObject(inputFC)

        if not self.ssdo.distanceInfo.xyzUnitsEqual:
            ARCPY.AddIDMessage("ERROR", 110083)
            raise SystemExit()

        self.eps = None
        if eps is not None:
            self.eps = self.ssdo.getDistance(eps)
        self.useGaTable  = False

        self.seed = seed
        self.tree  = None

        if ARCPY.env.isCancelled:
            raise SystemExit()

        super().__init__(self.ssdo, timeField, timeInterval, outputFC)
        self.loadData()
        self.coorHandler = CoordinateHandler(self.ssdo)
        self.ssdo = self.coorHandler.setCoordinates()

    def run(self):

        if len(self.ssdo.xyCoords) <  self.minPoints:
            ARCPY.AddIDMessage("ERROR",110141)
            raise Exception(110141)

        if ARCPY.env.isCancelled:
            raise SystemExit()

        xyz = self.coorHandler.getXYZ()
        ARCPY.SetProgressor("default",  ARCPY.GetIDMessage(84129))

        #### Threshold  to use compensated trees ####
        useMedian = 1
        if len(xyz) > ThresholdForCompensateKDTree:
            useMedian = 0

        self.tree = ARC._ss.KDTree(xyz, leafsize = self.leaf_size, use_median = useMedian)
        ARCPY.ResetProgressor()

        self.ssdo.tree = self.tree

        if self.eps is None:
            msg = ARCPY.GetIDMessage(84753)
            ARCPY.SetProgressor("default", msg)

            #### Calculating Core Distances ####
            distances, ids = self.tree.query(x = xyz,
                                        k = [self.minPoints],
                                        p = 2, n_jobs = self.parallel)

            self.eps = NUM.percentile(distances, 50)
            minEps = 0.001
            if self.eps == 0.0:
                uniqueCoreDist = NUM.unique(distances);

                #### Jump Next Distance Different of Zero ####
                if len(uniqueCoreDist) > 1:
                    self.eps = uniqueCoreDist[1]
                else:
                    self.eps = minEps = 0.0001


            ARCPY.AddIDMessage("WARNING", 110140, self.ssdo.distanceInfo.printDistance(self.eps))

        msg = ARCPY.GetIDMessage(84755) 
        ARCPY.SetProgressor("default", msg)

        data = ARC._ss.dbscan_kdtree(self.ssdo,
                                        self.eps,
                                        self.minPoints,
                                        self.seed,
                                        self.timeData,
                                        self.breakTimeSize)
        if data is None:
            raise SystemExit()

        self.out, self.seeds = data


    def output(self):

        if ARCPY.env.isCancelled:
            raise SystemExit()

        ### Get Color Scheme ###
        color = Colors(self.coorHandler.getXYZ(), self.out)
        data = color.getColors()
        self.labelColor, self.idsLabels, self.countLabels = data

        ### Get Original Coordinates ###
        self.ssdo = self.coorHandler.reset()

        numClustersMessage(self.out)
        sourceId = NUM.array(list(self.ssdo.master2Order.keys()))
        fieldDict = []
        fieldDict.append(["SOURCE_ID" , (NUM.asarray(sourceId, dtype = NUM.int32), "LONG", ARCPY.GetIDMessage(220125))])
        fieldDict.append(["CLUSTER_ID" , (NUM.asarray(self.out, dtype = NUM.int32), "LONG", ARCPY.GetIDMessage(220174))])
        fieldDict.append(["COLOR_ID" , (NUM.asarray(self.labelColor, dtype = NUM.int32), "LONG", ARCPY.GetIDMessage(220179))])

        if self.timeEnabled:
            self.updateOutputDictionary(fieldDict)
            self.colorSeries = self.getColorSeries(self.out,self.labelColor)

        if self.seed:
            fieldDict.append(["SEED_ID" , (NUM.asarray(self.seeds, dtype = NUM.int32), "LONG", ARCPY.GetIDMessage(220182))])
            fieldDict.append(seedField)

        layer = output(self.ssdo, self.outputFC, fieldDict, None, nCounts= self.countLabels, timeEnabled = self.infoLayer )
        return layer

################## OPTICS ############################
class OPTICS(TimeEnabler):
    def __init__(self, inputFC, outputFC,  minPoints, eps, thresholdDisance = 90,
                 seed = 0, parallel = -1, timeField = None, timeInterval = None):
        self.inputFC = inputFC
        self.minPoints = minPoints
        self.outputFC = outputFC
        self.parallel = parallel
        self.ssdo = SSDO.SSDataObject(inputFC)
        self.leafsize = 40

        if not self.ssdo.distanceInfo.xyzUnitsEqual:
            ARCPY.AddIDMessage("ERROR", 110083)
            raise SystemExit()

        self.seed = seed
        self.thresholdDistance = thresholdDisance
        self.eps = eps

        if eps is not None:
            self.eps = self.ssdo.getDistance(eps)

        if ARCPY.env.isCancelled:
            raise SystemExit()

        super().__init__(self.ssdo, timeField, timeInterval, outputFC)
        self.loadData()

        self.coorHandler = CoordinateHandler(self.ssdo)
        self.ssdo = self.coorHandler.setCoordinates()

    def applyOptics(self, reachability, orderValue):
        """
        Generate Order Id from Optics, Replace Null values for Max Value of 
        Reachability.

        RETURN:
            orderedReach {nx1} : Array of reachability ordered by Source Id
            recOrder {nx1}: Order reachability Ids
        """
        eps = 0.0001
        N = len(reachability)
        maxValue = reachability.max()
        base = NUM.zeros((N ,3) , dtype = float)
        base.T[0] = reachability
        base.T[1] = NUM.arange(N)
        nOrd = base[orderValue]
        nOrd.T[2] = NUM.arange(N)
        newO = nOrd[NUM.argsort(nOrd[:,1])]
        nOrd[nOrd == -1] = maxValue+eps
        orderedReach = nOrd[:,0].copy()
        #orderedReach[0] += increaseInitial
        recOrder = NUM.asarray(newO[:,2].copy(), dtype = NUM.intp)
        return orderedReach, recOrder

    def epsOptimum(self):
        """
        Obtain Maximum distance through assumption of randomness
        """
        import scipy.special as SCSPE
        n, d = self.ssdo.xyCoords.shape
        vol  = NUM.prod(NUM.ptp(self.ssdo.xyCoords, axis =0))
        v = (float(vol) * self.minPoints * float(SCSPE.gamma(int((d/2) + 1))))
        value  = pow(( v / (n * pow(NUM.pi, d/2 )) ), 1/d)
        return value

    def run(self):

        #### Check Input Parameter ####
        if len(self.ssdo.xyCoords) <  self.minPoints:
            ARCPY.AddIDMessage("ERROR", 110141)
            raise SystemExit()

        if ARCPY.env.isCancelled:
            raise SystemExit()

        msg = ARCPY.GetIDMessage(84753) 
        ARCPY.SetProgressor("default", msg)

        calculateEps = False
        if self.eps is None:
            self.eps = -1
            calculateEps = True

        coord = None
        if self.ssdo.hasZ:
            coords = NUM.empty((len(self.ssdo.xyCoords), 3), dtype = float)
            coords[:,0:2] = self.ssdo.xyCoords
            coords[:,-1] = self.ssdo.zCoords
        else:
            coords = self.ssdo.xyCoords

        #### Threshold  to use compensated trees ####
        useMedian = 1
        if len(self.ssdo.xyCoords) > ThresholdForCompensateKDTree:
            useMedian = 0
            self.tree = ARC._ss.KDTree(coords, leafsize = self.leafsize, use_median = useMedian)
            self.ssdo.tree  = self.tree

        #### Execute OPTICS ####
        optic = SSDO.ARC._ss.OPTICS(self.ssdo, self.eps, self.minPoints, 99, self.timeData,
                                    self.breakTimeSize)

        if not optic.calculate_reachability():
            raise SystemExit()

        if calculateEps:
            ARCPY.AddIDMessage("WARNING", 110140, self.ssdo.distanceInfo.printDistance(optic.eps))

        self.orderedReach, self.recOrder =  self.applyOptics(optic.reachability, optic.orderValues)

        if ARCPY.env.isCancelled:
            raise SystemExit()

        msg = ARCPY.GetIDMessage(84755) 
        ARCPY.SetProgressor("default", msg)

        #### Obtain Clusters from Reachability Data ####
        zones = DetectZones()
        self.idClusters, self.colors =  zones.getClusters(self.orderedReach,
                                                             self.recOrder, 
                                                             self.minPoints, 
                                                             self.thresholdDistance,
                                                             showPlot = usePLT)

    def output(self):
        #### Source ID ###
        sourceId = NUM.array(list(self.ssdo.master2Order.keys()))
        labels = checkLabels(NUM.asarray(self.idClusters, dtype = NUM.int32))

        #### Colort Scheme ###
        color = Colors(self.coorHandler.getXYZ(), labels)
        data = color.getColors()
        self.labelColor, self.idsLabels, self.countLabels = data

        #### Messages ####
        numClustersMessage(labels)

        ### Get Original Coordinates ####
        self.ssdo = self.coorHandler.reset()
        if ARCPY.env.isCancelled:
            raise SystemExit()

        self.out = labels

        ### Create Fields - Mantaining Orrder ####
        fieldDict = [["SOURCE_ID" ,(NUM.asarray(sourceId, dtype = NUM.int32), "LONG", ARCPY.GetIDMessage(220125))],
                     ["CLUSTER_ID" ,(labels, "LONG", ARCPY.GetIDMessage(220174))],
                     ["REACHORDER", (self.recOrder, "LONG", ARCPY.GetIDMessage(220180))],
                     ["REACHDIST",  (self.orderedReach[self.recOrder], "DOUBLE", ARCPY.GetIDMessage(220181))],
                     ["COLOR_ID" ,(self.labelColor, "LONG", ARCPY.GetIDMessage(220179))]]

        if self.timeEnabled:
            self.updateOutputDictionary(fieldDict)
            self.colorSeries = self.getColorSeries(labels,self.labelColor)

        return output(self.ssdo, self.outputFC, fieldDict, None, nCounts = self.countLabels, timeEnabled = self.infoLayer )

class DetectZones(object):

    def __ini__(self):
        self.values = None
        self.maxValue = None
        self.thresholdA = None
        self.thresholdB = None
        self.zones = None
        self.minNumFeatures = None

    def slope(self, reach):
        slope = NUM.zeros(len(reach)-1, dtype= float)
        for i in NUM.arange(len(reach)-1):
            slope[i] = reach[i+1] - reach[i]
        return slope

    def detectFlatZones(self, firstDer, minNum, values):
        zeros = firstDer == 0
        iniFlatZone = NUM.where(zeros == False)[0]
        cont = 0
        zone = []
        ip = len(firstDer)-1
        for index, i in enumerate(iniFlatZone):
            if index < (len(iniFlatZone)- 1):
                ip =iniFlatZone[index + 1]
                s = firstDer[i]
                e = firstDer[ip]
                dif = ip-i+1
                cont = False
                if dif < minNum:
                    cont = True
                if s < 0 and e < 0:
                    type = 0
                if s < 0 and e > 0:
                    type = 1
                if s > 0 and e > 0:
                    type = 2
                if s > 0 and e < 0:
                    type = 3
                zone.append((type, i, ip + 1, dif, cont , s, values[i]))

        if (ip+1) != len(firstDer):
            tup =zone[-1]
            tup = (tup[0],tup[1], len(firstDer), len(firstDer) -tup[1],
                   tup[4], tup[5])
            zone[-1]= tup
        return zone

    def compress(self, zone):
        if len(zone) == 0:
            return False

        self.zones = []
        iniV =0
        endV = 0
        current = zone[0][0]
        index = 0
        for i in NUM.arange(len(zone)):
            if zone[i][0] == current:
                endV = zone[i][2]
            else:
                self.zones.append(ZoneInfo(index, iniV, endV, current))
                current = zone[i][0]
                iniV = zone[i][1]
                endV = zone[i][2]
                index +=1

        self.zones.append(ZoneInfo(index, iniV, endV, current))
        return True

    def getIdClustersByZonesClass(self, reach, clusters, recOrder = None, pltMat = False):
        import matplotlib.pyplot as PLT
        idClusters = NUM.ones(len(reach), dtype= NUM.intp)*-1
        maxVal = reach.max()

        if pltMat:
            x = NUM.arange(len(reach))
            y = reach 
            PLT.plot(x,y, linewidth = 2)

        numClusters = len(clusters)
        cmap = PLT.cm.get_cmap("hsv", numClusters + 1)
        colors = []
        includeLast = 0

        for i in NUM.arange(numClusters, dtype = NUM.int):
            if (len(reach) - 1 ) == clusters[i].end:
                includeLast = 1
                if reach[clusters[i].end] == maxVal:
                    includeLast = 0
            idClusters[clusters[i].ini:clusters[i].end + includeLast] = i
            hsvColor = cmap(i)
            
            if pltMat:
                xv = NUM.arange(clusters[i].ini,clusters[i].end + includeLast, 1, dtype = NUM.intp)
                vy = reach[xv]
                PLT.fill_between(xv, vy, color = hsvColor)
            
            colors.append(hsvColor)
        if pltMat:
            PLT.show()

        return idClusters[recOrder], colors

    def getAttributtes(self, att, query = None, sortIds = True):
        atts = None
        if sortIds:
            if query is None:
                atts = NUM.empty(len(self.zones))
                for index, z in enumerate(self.zones):
                    atts[index] = eval(att)
                return  NUM.argsort(atts)
            else:
                atts = []
                attsId = []
                for index, z in enumerate(self.zones):
                    if eval(query):
                        atts.append(eval(att))
                        attsId.append(index)
                atts = NUM.array(atts)
                t = NUM.zeros((len(atts),2))
                t.T[0]= atts
                t.T[1] = NUM.array(attsId)
                return  t.T[1][NUM.argsort(t.T[0])]
        else:
            if query is None:
                atts = NUM.empty(len(self.zones))
                for index, z in enumerate(self.zones):
                    atts[index] = eval(att)
                return  atts
            else:
                atts = []
                for index, z in enumerate(self.zones):
                    if eval(query):
                        atts.append(eval(att))
                atts = NUM.array(atts)
                return  atts

    def evaluateSimple(self, thresholdB):
        """
        Main function for detecting clusters
        """
        #### Reset Clusters ####
        for z in self.zones:
            z.reset()

        #### Merge Zones to Create a Cluster ####
        for z in self.zones:
            if z.type == 1:
                self.mergeNeighborZones(z)
              
            z.info = z.getCharacteristics(self)
            isBasin = True
            if len(z.lIndex) > 1:
                z.isBasin = True
            if z.info['nMax'] == 2:
                z.uniqueBasin = True



        #### Special Case in the last Cluster ####
        if len(self.zones) >= 2:
            if self.zones[-2].type == 3 and self.zones[-1].type == 0:
                ini = self.zones[-2] 
                z = self.zones[-1]

                if ini is not None:
                    if not ini.merged:
                        z.ini = ini.ini+1
                        ini.merged = True
                        z.lIndex = [ini.index] + z.lIndex
                        z.merged = True
                        z.type = 1
                        z.info = z.getCharacteristics(self)
                        z.end = z.end+1
                        z.isBasin = True

        #### Obtain Vector of Differences Inside of Each Cluster ####
        dif = self.getAttributtes("z.info['dif']", query= "len(z.lIndex) > 1", sortIds = False)
        indexBasins = self.getAttributtes("z.index", query= "len(z.lIndex) > 1", sortIds = False)

        liZones = []
        nP = len(dif)

        #### Threshold Is Obtain from Differences of each Cluster ####
        if nP > 0:
            self.thresholdA = NUM.percentile(dif, 50)
            difP = NUM.insert(dif, 0, 0)
            self.thresholdB = NUM.percentile(difP, thresholdB)
            
        else:
            return None

        #### Merge Clusters (Basins in the Reachability Plot) ####
        for z, id in enumerate(indexBasins):
            z = self.zones[id]
            if not z.basinMerged and not z.outThreshold :
                cont = True
                c = 0
                while cont:
                    idNext = z.nextBasin(indexBasins, c)
                    if idNext is not None:
                        merged, cont = z.mergeBasin(self.zones[idNext], self.thresholdB)
                    else:
                        cont = False
                    c+=1

        #### Check Zones that Contain minPoints ####
        flatZones =  self.getAttributtes("z.index", query= "z.type == 1 and len(z.lIndex) == 1", sortIds = False)
        if len(flatZones):
            mergeZone = NUM.zeros(len(self.zones),dtype= bool)
            minMaxZones =  self.getAttributtes("(min(z.lIndex),max(z.lIndex))", query= "len(z.lIndex) > 1", sortIds = False)
            for z in minMaxZones:
                mergeZone[z[0]:z[1]] = True

            for idZ in flatZones:
                if not mergeZone[idZ]:
                    z = self.zones[idZ]
                    if (z.end - z.ini) >= self.minNumFeatures:
                        z.isBasin = True


        #### Check Cluster Size ####
        for z in self.zones:
            if z.isBasin and not z.basinMerged  and z.type != 3:
                z.end = z.getEndLimit(z.info['ini'], self)
                z.ini = z.cleanIni(self)
                if z.end is not None:
                    if (z.end - z.ini) >= self.minNumFeatures and not z.outThreshold:
                        liZones.append(z)
        return liZones

    def printZones(self, shortD = False):
        for i in self.zones:
            if not shortD:
                i.string()
            else:
                i.toString()

    def getClusters(self, reach, orderValues, minNumFeatures , thresholdB = None, 
                    showReachInMapPlotLib = False, showPlot = False):

        self.values = reach
        self.maxValue = reach.max()
        self.minNumFeatures = minNumFeatures
        self.zones = []
        maxValueThreshold = 100

        firstDer = self.slope(reach)
        zones = self.detectFlatZones(firstDer, minNumFeatures, reach)

        #### Create Internal Zones ####
        found = self.compress(zones)

        #### Clean Reachability ####
        cleanZone = []
        cleanInfo = False

        for index, z in enumerate(self.zones):
            if z.type == 3 and (index + 1) < len(self.zones):
                zP = self.zones[index - 1]
                nP = self.zones[index + 1]
                check =  zP.type in [1, 2] and nP.type in [0,1]
                currentZ = self.values[z.ini:z.end]

                if (z.end-z.ini) == 2:
                    preZ = self.values[z.ini]
                else:
                    preZ = self.values[z.ini -1]

                nextZ = self.values[z.end]
                if check and currentZ.max() == self.maxValue:
                    if preZ == nextZ :
                        cleanZone.append((index, preZ))
                        cleanInfo = True
                    else:
                        threshold = abs(1 -preZ/nextZ)
                        if threshold < 0.001:
                            cleanZone.append((index, preZ))
                            cleanInfo = True


        #### Apply New  Reachability ####
        if cleanInfo:
            for v in cleanZone:
                zP = self.zones[v[0]].ini -1
                zN = self.zones[v[0]].end
                self.values[zP:zN] = v[1]

            #### Recalculate Zones ####
            firstDer = self.slope(self.values)
            zones = self.detectFlatZones(firstDer, minNumFeatures, self.values)
            found = self.compress(zones)

        #### Return All Noise ####
        if not found:
            return NUM.ones(len(reach), dtype= NUM.intp) * -1, []

        detectThreshold = False

        #### Flip Threshold Range ####
        #### 100 -> Max Num. Clusters, 0-> Min Num.Clusters ####
        if thresholdB is None:
            detectThreshold = True
        else:
            thresholdB = maxValueThreshold - thresholdB

        self.thresholdB = thresholdB

        if not detectThreshold:
            clusters = self.evaluateSimple(thresholdB)
            clusters
            if clusters is None:
                return NUM.ones(len(reach), dtype= NUM.intp) * -1, []

            idClusters, colors  =  self.getIdClustersByZonesClass(reach,
                                                                  clusters, 
                                                                  orderValues, 
                                                                  showReachInMapPlotLib)

            return idClusters, colors
        else:

            import matplotlib.pyplot as PLT
            x = NUM.arange(len(reach))
            entropy = NUM.zeros(maxValueThreshold + 1)

            #### Get Maximum Number of Clusters ####
            refC = self.evaluateSimple(0)

            if refC is None:
                 return NUM.ones(len(reach), dtype= NUM.intp) * -1, []

            #### Reference Vector ####
            ref = self.getMean(refC)

            #### Calculate Entropy Between 0-100 ####
            #### Each Iteration initializes the Clusters ####
            for i in NUM.arange(maxValueThreshold + 1):
                clusters = self.evaluateSimple(i)

                if clusters is not None:
                    avgClust = self.getMean(clusters)
                    #### Calcualte Entropy ####
                    entropy[i] = SCPS.entropy(avgClust, ref)
                    y = avgClust
                    if showPlot:
                        PLT.plot(x,y, linewidth = 1)

            #### Show All Reachablity Plot ####
            if showPlot:
                PLT.show()
                x = NUM.arange(maxValueThreshold + 1)[::-1]
                PLT.plot(x, entropy, linewidth = 1)
                PLT.show()

            #### Get First Derivative and Order Id ####
            der = self.slope(entropy)
            maxDer = NUM.argsort(der)[::-1]

            if showPlot:
                ARCPY.AddMessage(str(der) + str(maxDer))

            clusters = self.evaluateSimple(maxDer[0] + 1)
            idClusters, colors  =  self.getIdClustersByZonesClass(reach,  clusters, orderValues)
            ARCPY.AddMessage(ARCPY.GetIDMessage(84786) + " " + str(maxValueThreshold - maxDer[0] - 1))
            ARCPY.AddMessage(ARCPY.GetIDMessage(84787) + " " +str(maxValueThreshold - maxDer[1] - 1))
            return  idClusters, colors

    def getMean(self, clusters):
        """
        Smooth cluster all cluster through Mean
        """
        iniValues = self.values.copy()
        for c in clusters:
            iniValues[c.ini+1 : c.end] =  self.values[c.ini+1 : c.end].mean()
        return iniValues

    def analysisOutput(self, resultZones, threshold = 0.3):
        l = len(self.zones)
        probIdeal = int(l/4)
        lr = len(resultZones)
        analAg = False

        if  (lr/probIdeal) < 0.3:
            analAg = True
        return analAg

    def getPrevious(self, z):
        if z.index >= 1:
            if self.zones[z.index-1].type != 3:
                return self.zones[z.index-1]
            return None
        else:
            return None

    def getNext(self, z):
        if z.index < len(self.zones) -1:
            if self.zones[z.index+1].type != 3:
                return self.zones[z.index+1]
            return None
        else:
            return None

    def mergeNeighborZones(self, z):
        ini = self.getPrevious(z)
        end = self.getNext(z)
        if ini is not None:
            if not ini.merged:
                z.ini = ini.ini
                ini.merged = True
                z.lIndex = [ini.index] + z.lIndex
                z.merged = True
        if end is not None:
            if not end.merged:
                z.end = end.end
                z.lIndex = list(z.lIndex)
                z.lIndex.append(end.index)
                end.merged = True
                z.merged = True

class ZoneInfo(object):
    def __init__(self, index, ini , end , type ):
        self.info = None
        self.index = index
        self.lIndex = [index]
        self.ini = ini
        self.end = end;
        self.type = type
        self.merged = False
        self.basinMerged = False
        self.isBasin = False
        self.uniqueBasin = False
        self.original = (index, ini , end , type)
        self.outThreshold = False

    def reset(self):
        self.info = None
        self.index = self.original[0]
        self.lIndex = [self.original[0]]
        self.ini = self.original[1]
        self.end = self.original[2];
        self.type = self.original[3]
        self.merged = False
        self.basinMerged = False
        self.isBasin = False
        self.uniqueBasin = False
        self.outThreshold = False

    def string(self):
        ARCPY.AddMessage("Ini:{0}, end:{1}, L:{2}, type:{3} , zones:{4},merge:{5}, min:{6}, index:{7}"
                         .format(self.ini, self.end, self.end-self.ini,
                                              self.type, str(self.lIndex), 
                                              str(self.merged),str(self.info['min']),
                                              self.index))
    def toString(self):
        return "[index:{0}, type:{1}] ".format(self.index, self.type)

    def isNext(self, zone):
         if zone.merged:
             return False
         if zone.index <= self.index:
             return False
         if abs(zone.ini - self.end) <= 1 :
             return True
         else:
             return False

    def getEndLimit(self, maxValue, zones):
        for i in NUM.arange(self.ini + 1, self.end, 1):
            if zones.values[i] > maxValue or zones.values[i] == zones.maxValue :
                return i
        return self.end

    def getStartLimit(self, zones):
        self.ini = self.cleanIni()
        endV = zones.values[self.end]
        for index, i in enumerate(NUM.arange(self.ini, self.end, 1)):
            if zones.values[i] <= endV + zones.thresholdB:
                if index > 0:
                    return i-1
                else:
                    return i
        return self.end

    def cleanIni(self, zones):
        iniValue = zones.values[self.ini]
        for i in NUM.arange(self.ini, self.end, 1):
            if zones.values[i] != iniValue:
                return i - 1
        return self.ini

    def getCharacteristics(self, zones):
        """
        Get Characteristics of each basin (representation of cluster)
        """
        t = zones.values[self.ini:self.end]
        ini = zones.values[self.ini]
        end = zones.values[self.end]
        minV= t.min()
        maxV = t.max()
        dif = maxV - minV
        lSide = ini - minV
        rSide = end - minV
        containMax = zones.maxValue == maxV
        if end == zones.maxValue:
            pEnd = zones.values[self.end - 1]
        else:
            pEnd = zones.values[self.end]
        nMax = t[t==zones.maxValue].sum()
        return {"ini": ini,
                "end": end,
                "pend":pEnd,
                "max": maxV,
                "min": minV,
                "dif": dif,
                "lSide": lSide,
                "rSide": rSide,
                "containMax": containMax,
                "nMax": nMax}

    def nextBasin(self, indexBasins, id = 0):
        index = NUM.argwhere(indexBasins==self.index).ravel()[0]
        if (index + 1 + id) > len(indexBasins) -1:
            return None
        else:
            return indexBasins[index + 1 + id]

    def canMergeNextBasin(self, zone, thresholdB ):
        if zone is not None:
            if zone.outThreshold:
                return False
            if zone.uniqueBasin:
                return False

            if self.info['ini'] > self.info['end']:
                if self.info['rSide'] <= thresholdB:
                    if not zone.uniqueBasin:
                        return True
        return False

    def mergeBasin(self, zone, thresholdB):
        """
        Merge and Evalute Clusters
        """
        cont = False
        if self.canMergeNextBasin(zone , thresholdB):
            self.end = zone.end
            self.lIndex = self.lIndex + zone.lIndex
            self.info['end'] = zone.info['end']
            self.info['rSide'] = zone.info['rSide']
            zone.basinMerged = True

            if zone.info['containMax']:
                cont = False
                return True, cont

            if self.info['ini'] < self.info['end']:
                cont = False
            else:
                cont = True
            return True, cont

        return False, False

    def currentSize(self, start = 0):
        return self.end - self.ini

################## LOF and GLOBAL ###############################

class Outlier(object):
    valueEPS = None
    def __init__(self, inputFC, outputFC, minPoints, percentile,
                 leaf_size = 40,
                 parallel = -1,
                 outlierType = "GLOBAL",
                 sensitivity = "MEDIUM",
                 keepJustOutlier= False):

        self.leaf_size = leaf_size
        self.inputFC = inputFC
        self.minPoints = minPoints
        self.outputFC = outputFC
        self.parallel = parallel
        self.ssdo = SSDO.SSDataObject(inputFC, ignoreZEnvironment = True)
        self.percentile = percentile
        self.outlierType = outlierType
        self.sensitivity = sensitivity
        self.keepJustOutlier = keepJustOutlier

        if outlierType == "LOCAL":
            self.sensitivity = None

        self.outlierObj = None

        if not self.ssdo.distanceInfo.xyzUnitsEqual:
            ARCPY.AddIDMessage("ERROR", 110083)
            raise SystemExit()

        if ARCPY.env.isCancelled:
            raise SystemExit()

        self.ssdo.obtainData(minNumObs = minNumPointsLOF)

        if len(self.ssdo.xyCoords) > len(self.ssdo.uniqueXY):
            ARCPY.AddIDMessage("WARNING", 110251, len(self.ssdo.xyCoords) - len(self.ssdo.uniqueXY))

        self.coorHandler = CoordinateHandler(self.ssdo)
        ##self.ssdo = self.coorHandler.setCoordinates()

        self.dataOutput = None
        self.dataDetection = None
        self.threshold = 1.5

    def _geocentricForRaster(self, xy, meanElev = 0.0):
        """
        Calculate Spheriod Coordinates taking into account the elevation
        """

        if self.ssdo.hasZ:
            xyz = NUM.zeros((len(xy), 3))
            xyz[:,:-1] = xy
            xyz[:,2] = NUM.ones(len(xy))*meanElev
        else:
            xyz = xy

        if self.ssdo.spatialRefType.upper() == "GEOGRAPHIC":

            if self.ssdo.hasZ:
                spheroidCoords = ARC._ss.lonlatelev_to_xyz(xyz, self.ssdo.spatialRef)
            else:
                spheroidCoords = ARC._ss.lonlat_to_xy(xyz, self.ssdo.spatialRef)

            return spheroidCoords
        else:
            return xyz

    def __searchGrid(self, n, percentile = None):
        minNumFeatures = 100
        lowKPerc = 0.2
        highKPerc = 0.5
        constLow = 10
        consHigh = 50
        endPerc = 0.2
        intervalK = 1
        nBins = 100

        if n <= minNumFeatures:
            lBound = lowKPerc*n
            uBound = highKPerc*n
        else:
            lBound = constLow
            uBound = consHigh

        ks = NUM.arange(lBound, uBound, intervalK)
        ks = NUM.unique(NUM.asarray(ks, dtype= NUM.int32))

        if percentile is None:
            if n * endPerc <= nBins:
                n1 = NUM.arange(1, int(n * endPerc)+1)
                percs = n1/ n
            else:
                c1 = NUM.cumsum(NUM.arange(nBins+1)[::-1])
                c2 = (1 - c1 / max(c1)) * endPerc
                n1 = NUM.unique((c2 * n).astype(NUM.int32))
                n1 = n1[NUM.where(n1 > 0)[0]]
                #### Include One outlier perc ###
                if len(NUM.where(n1 == 1)[0]) == 0 :
                    n1 = NUM.append(n1, 1)
                n1.sort()
                percs = n1 / n
        else:
            percs = NUM.array([percentile])

        if self.minPoints > 0:
            ks  =  NUM.ones(len(percs), dtype= NUM.int32)*self.minPoints

        return ks, percs

    def run(self):
        self.meanMaxDist, self.stdDevMaxDis = 0, 0

        if self.minPoints is not None:
            if len(self.ssdo.xyCoords) <  self.minPoints:
                ARCPY.AddIDMessage("ERROR",110340)
                raise SystemExit()

        if ARCPY.env.isCancelled:
            raise SystemExit()

        xyz = self.coorHandler.getXYZ()
        ARCPY.SetProgressor("default",  ARCPY.GetIDMessage(84129))

        if self.minPoints is None:
            self.minPoints = -1

        thresholdFlag = -1.0
        thresholdDict  = {"LOW":2.0, "MEDIUM":1.5, "HIGH":1.0}
        if self.sensitivity:
            thresholdFlag = thresholdDict[self.sensitivity]

        self.outlierObj = ARC._ss.SpatialOutlierBase(xyz, self.minPoints, self.parallel, global_threshold = thresholdFlag)


        if self.outlierType == "LOCAL":

            ### Use a Grid to find the best K, C ####
            if self.minPoints == -1 or self.percentile == None :

                if self.percentile not in [-1, None]:
                    self.percentile/=100.0

                #### Obtain the list of Ks and Percentiles to evaluate ####
                ks, percs = self.__searchGrid(len(xyz), self.percentile )

                k, c = self.autoLOF(len(xyz), percs, ks)
                self.minPoints = k
                self.percentile = c*100

            #### Main Function ####
            self.dataOutput  = self.outlierObj.calculate_factor(self.minPoints)

            if self.percentile == -1:
                self.threshold = 1.5
            else:
                self.threshold = NUM.percentile(self.dataOutput, 100-self.percentile)

            noOutlier = NUM.zeros(len(self.dataOutput), dtype=NUM.int32)
            self.justOutliers = self.dataOutput > self.threshold
            noOutlier[self.justOutliers] = 1

            header  = ARCPY.GetIDMessage(220113)
            listTable = [
                         [ARCPY.GetIDMessage(84721), str(self.minPoints)],
                         [ARCPY.GetIDMessage(220112),  UTILS.formatValue(noOutlier.sum()*100/len(xyz), "%0.4f") + "%"],
                         [ARCPY.GetIDMessage(220111), UTILS.formatValue(self.threshold, "%0.3f")]
                         ]

            outputReport = UTILS.outputTextTable(listTable, header = header,
                                                 justify = ["left", "right"],
                                                 colPad = 10, pad = 1, titleFillToken = "-",
                                                 emphasizeHeadRow=False, force2Txt=False)
            ARCPY.AddMessage(outputReport)

            self.out = noOutlier
            self.useThresholdInChart = False
            if min(self.dataOutput) <= self.threshold <= max(self.dataOutput):
                self.useThresholdInChart = True

        if self.outlierType == "GLOBAL":

            self.dataOutput = self.outlierObj.get_nth_distances()

            percentiles = NUM.percentile(self.dataOutput, NUM.array([25.0,50,75.0], dtype=float))
            self.threshold = percentiles[2] + (percentiles[2]-percentiles[0])*thresholdFlag

            noOutlier = NUM.zeros(len(self.dataOutput), dtype=NUM.int32)
            self.justOutliers = self.dataOutput > self.threshold
            noOutlier[self.justOutliers] = 1

            header  = ARCPY.GetIDMessage(220113)
            listTable = [
                         [ARCPY.GetIDMessage(84721), str(self.minPoints)],
                         [ARCPY.GetIDMessage(220112),  UTILS.formatValue(noOutlier.sum()*100/len(xyz), "%0.4f") + "%"],
                         [ARCPY.GetIDMessage(220244), self.ssdo.distanceInfo.printDistance(self.threshold)]
                         ]

            outputReport = UTILS.outputTextTable(listTable, header = header,
                                                 justify = ["left", "right"],
                                                 colPad = 10, pad = 1, titleFillToken = "-",
                                                 emphasizeHeadRow=False, force2Txt=False)
            ARCPY.AddMessage(outputReport)

            self.out = noOutlier
            self.useThresholdInChart = False
            if min(self.dataOutput) <= self.threshold <= max(self.dataOutput):
                self.useThresholdInChart = True

    def runNOF(self):

        if self.minPoints is not None:
            ARCPY.AddWarning("Mimimum number of point is not used in the NOF method")

        if ARCPY.env.isCancelled:
            raise SystemExit()

        xyz = self.coorHandler.getXYZ()
        ARCPY.SetProgressor("default",  ARCPY.GetIDMessage(84129))

        self.outlierObj = ARC._ss.SpatialOutlierBase(xyz, -1, 1)
        self.dataOutput, maxK = self.outlierObj.nof()

        if self.percentile in [-1, None]:
            self.threshold = 1.5
        else:
            self.threshold = NUM.percentile(self.dataOutput, 100-self.percentile)

        noOutlier = NUM.zeros(len(self.dataOutput), dtype=NUM.int32)
        noOutlier[self.dataOutput > self.threshold] = 1
        self.out = noOutlier

        ARCPY.AddMessage("Percentage of outliers: {0}%".format(UTILS.formatValue(noOutlier.sum()*100/len(xyz), "%0.4f")))
        ARCPY.AddMessage("NOF threshold : {0}".format(UTILS.formatValue(self.threshold, "%0.3f")))

    def autoLOF(self, nFeatures, rangeC, rangeK):
        """ Find best K, C
        INPUT:
            nFeatures (int): Number of features
            rangeC (1D array): Contamination percetages 0.1 -0.2
            rangeK (1D array): k nn to evaluate
        RETURN:
            k, c (int, int): best k and c
        """

        ## exclude c that are too low
        rangeC_cn = NUM.floor(nFeatures * rangeC)
        rangeCUpdate = rangeC[rangeC_cn>=2]

        nK = len(rangeK)
        nC = len(rangeCUpdate)
        CN = NUM.floor(nFeatures * rangeCUpdate).astype(int)
        ks = [int(i) for i in rangeK]
        percs = [float(i) for i in rangeCUpdate]

        #### Compute LOF  and  return stats ####
        data = self.outlierObj.calculate_factor_grid(percs, ks)

        #### Reshape Oputput ####
        data.shape = (len(ks)*len(percs),5)

        Mo, Mi, Vo, Vi, T = [ data.T[i].reshape(nK, nC) for i  in NUM.arange(5)]

        # import matplotlib.pyplot as plt
        # plt.imshow(T)
        # plt.show()

        ### Given Contamination ####
        if len(rangeCUpdate)==1:
            T = NUM.asarray(T)
            kOpt = rangeK[NUM.argmax(T)]
            return kOpt, rangeCUpdate[0]

        ## find the best c, k
        Mco = Mo.mean(axis=0)
        Vco = Vo.mean(axis=0)
        Mci = Mi.mean(axis=0)
        Vci = Vi.mean(axis=0)

        testVar = Vco + Vci

        mask = testVar == 0
        if mask.sum() == len(mask):
            ARCPY.AddIDMessage("ERROR", 110372)
            raise SystemExit

        if mask.sum() > 0:
            Vco[mask] = 1e-50

        NCPc = (Mco - Mci) * NUM.sqrt(CN) / NUM.sqrt(Vco + Vci)

        DFc = 2 * CN - 2
        kcoptIndex = NUM.argmax(T, axis=0)

        Tc = T[kcoptIndex, NUM.arange(nC)]
        Pc = SCPS.nct.cdf(x=Tc, df=DFc, nc=NCPc)
        coptIndex = NUM.argmax(Pc)
        cOpt = rangeCUpdate[coptIndex]
        kOpt = rangeK[kcoptIndex[coptIndex]]
        nanR =  NUM.isnan(Pc)

        if NUM.sum(nanR) == len(nanR) or nanR[coptIndex]:
            ARCPY.AddIDMessage("ERROR", 110372)
            raise SystemExit

        return kOpt, cOpt

    def runPredict(self, inputFCDetect, outputDetect):
        self.ssdoDetect = SSDO.SSDataObject(inputFCDetect, explicitSpatialRef = self.ssdo.spatialRef)
        self.ssdoDetect.obtainData()
        self.coorHandlerDetect = CoordinateHandler(self.ssdoDetect)

        ##self.ssdoDetect = self.coorHandler.setCoordinates()
        xyz = self.coorHandlerDetect.getXYZ()

        #### Main Function to Detect Outliers ####
        self.dataDetection  = self.outlierObj.detect(xyz)
        noOutlier = NUM.ones(len(self.dataDetection), dtype=NUM.int32)
        noOutlier[self.dataDetection < self.threshold] = -1

        ### Get Original Coordinates ###
        self.ssdoDetect = self.coorHandlerDetect.reset()

        sourceId = NUM.array(list(self.ssdoDetect.master2Order.keys()))
        fieldDict = []
        fieldDict.append(["SOURCE_ID" , (NUM.asarray(sourceId, dtype = NUM.int32), "LONG", ARCPY.GetIDMessage(220125))])
        fieldDict.append(["OUTLIER_ID" , (NUM.asarray(noOutlier, dtype = NUM.int32), "LONG", ARCPY.GetIDMessage(220126))])
        fieldDict.append(["LOF" , (NUM.asarray(self.dataDetection, dtype = float), "DOUBLE", ARCPY.GetIDMessage(220110).format(self.minPoints))])
        self._createOutput(self.ssdoDetect, outputDetect, fieldDict)

    def calculateChunckSize(self, infoRasterInstances, listBase):
        """Calculate Chunk Size  using group of slices
        INPUT:
            infoRasterInstances (RasterInfo Instance): Raster Info
            listBase (list - int): List of Zones in one chunck
        OUTPUT:
            nCells (int): number of cell in a chuck
            newSliceCol (slice): Slice of Columns for the current chuck
            newSliceRow (slice): Slice of Rows for the current chuck
            iniIndex (NUM.int64): Starting index of the chuck
            xMinYMin (tuple): xMin and yMin chuck
            nColsStep (int): Number of Columns
            nRowsSteps (int): Number of Rows
        """

        iniBase = infoRasterInstances.getRasterInfoZone(listBase[0])[0]
        endBase = infoRasterInstances.getRasterInfoZone(listBase[-1])[0]

        #### Get Indice Info ####
        iniRow = iniBase[0].start
        endRow = endBase[0].stop
        iniCol = iniBase[1].start
        endCol = endBase[1].stop
        nColsStep = endCol-iniCol
        nRowsStep = endRow-iniRow
        newSliceCol = slice(iniCol, endCol)
        newSliceRow = slice(iniRow, endRow)
        iniIndex = infoRasterInstances.rangeZones[listBase[0]][0]
        xMinYMin = infoRasterInstances.getRasterInfoZone(listBase[-1])[2]
        nCells = nColsStep*nRowsStep

        return nCells , newSliceCol, newSliceRow, iniIndex, xMinYMin, nColsStep, nRowsStep

    def createTemporalFLT(self, cellSize = None, xMinYMin = None, nRowsCols = None,
                          data = None, pathFileAndName = None, srf = None ):
        """ Create temporal file
        INPUT:
            cellSize (float): cell Size
            createCopy (Bool, True): Convert FLT in outputRasterPath
            xMinYMin (tuple):  if createCopy is False, it is required insert Point
            nColsRows (tuple): if createCopy is False, it is required nCols nRows
            data (2d array, None): array
            pathFileAndName
        """
        xMin = yMin = nCols = nRows = None

        if xMinYMin is not None and nRowsCols is not None:
            xMin = xMinYMin[0]
            yMin = xMinYMin[1]
            nCols = nRowsCols[1]
            nRows = nRowsCols[0]

        if pathFileAndName is None:
            pathNC = UTILS.returnScratchFolder()
            randomName = str(NUM.random.randint(1000000))
            header = pathNC + r"\nc"+randomName+ ".hdr"
            flt = pathNC + r"\nc"+ randomName + ".flt"

            if srf is not None:
                prj = pathNC + r"\nc"+ randomName + ".prj"
                with open(prj, 'w') as f:
                    f.write(srf.exportToString().split(";")[0])

            lines = []
            lines.append("ncols\t\t{0}".format(nCols))
            lines.append("nrows\t\t{0}".format(nRows))
            lines.append("xllcorner\t{:.12f}".format(xMin))
            lines.append("yllcorner\t{:.12f}".format(yMin))
            lines.append("cellsize\t{:.12f}".format(cellSize))
            lines.append("NODATA_value\t{0}".format(NULL))
            lines.append("BYTEORDER\tLSBFIRST")

            with open(header, 'w') as f:
                for i in lines:
                    f.write(i + "\n")
            #### Create HDR, PRJ Files ###
            if data is None:
                return pathNC , r"nc"+ randomName

        else:
            pathNC = pathFileAndName[0]
            randomName = pathFileAndName[1]
            flt = pathNC + "\\"+ randomName + ".flt"


        #### Verify Dtype ####
        if data.dtype != NUM.float32:
            self.__tryDelete()
            ARCPY.AddIDMessage("ERROR", 10029, flt)
            raise SystemExit()

        done = ARC._ss.output_flt(flt, data)

        #### Exit - Function Was Cancelled / Couldn't be Created ####
        if not done:
            ARCPY.AddIDMessage("ERROR", 10029, flt)
            self.__tryDelete()
            raise SystemExit()

        return pathNC , r"nc"+ randomName

    def createFinalOutput(self, multipleFLTAreCreated, workspaceOutput, listRasterZones,
                          pathFLT, nameFLT, outputRasterPath, strProgressor = "" , srf = None):
        """ Merge Temporal Files
        INPUT:
            multipleFLTAreCreated {bool}: True multiple flt were created
            workspaceOutput {str}: Workspace of temporal files
            listRasterZones {list}: List of raster created
            pathFLT {str}: Path Temporal FLT
            nameFLT {str}: Name file Temporal FLT
            outputRasterPath {str}: Output Raster Path
            strProgressor {str}: Progressor string
            srf {Spatial Reference instance}: Spatial Reference
        """

        ARCPY.env.pyramid = None
        ARCPY.env.rasterStatistics = None

        if multipleFLTAreCreated :
            listRasterZonesFLT = [workspaceOutput+"\\"+f"{i}.flt"  for i in listRasterZones]

            #### Save Current WorkSpace ####
            currentWrksp = ARCPY.env.workspace
            ARCPY.env.workspace = workspaceOutput
            outPath, outName = OS.path.split(outputRasterPath)
            spatialRef2SetBack = ARCPY.env.outputCoordinateSystem
            ARCPY.env.outputCoordinateSystem = srf
            #### Merging Rasters ####
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84497, outName ))
            try:
                ARCPY.MosaicToNewRaster_management(";".join(listRasterZonesFLT),
                                                    outPath, outName, self.infoRasterInstances.srf,
                                                    "32_BIT_FLOAT", self.infoRasterInstances.cellSize, 1, "LAST", "FIRST")
            except:
                ARCPY.AddIDMessage("ERROR", 10029, ";".join(listRasterZonesFLT))
                raise SystemExit
            ARCPY.ResetProgressor()

            #### Applying Previous WorkSpace ####
            ARCPY.env.workspace = currentWrksp
            ARCPY.env.outputCoordinateSystem = spatialRef2SetBack
        else:
            spatialRef2SetBack = ARCPY.env.outputCoordinateSystem
            ARCPY.env.outputCoordinateSystem = srf

            strOut = OS.path.join(pathFLT, nameFLT + ".flt")
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84497, outputRasterPath ))
            #### Copy NetCDF Layer To Output Raster File ####
            ARCPY.management.CopyRaster(strOut, outputRasterPath, None, None, NULL, "NONE", "NONE", None, "NONE", "NONE", None, "NONE")
            ARCPY.ResetProgressor()
            ARCPY.env.outputCoordinateSystem = spatialRef2SetBack
            listRasterZonesFLT = [strOut]

        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84013))
        ### Remove Temporal Files ####
        for pathFLT in listRasterZonesFLT:
            try:
                OS.remove(pathFLT)
                OS.remove(pathFLT.replace(".flt",".hdr"))
                OS.remove(pathFLT.replace(".flt",".prj"))
            except:
                pass
        ARCPY.ResetProgressor()

    def outputRasterFnc(self, info, newSRF = None, getNValues = None, dataBase = None, outputPath = "", applyLayerB = True):
        """Generate Output Raster
        INPUT:
            info (1D Array - float): 1D array with prediction values
            newSRF {Spatial Reference, None}: Spatial reference / use training Spatial Reference
            getNValues {int, None}: Number of Values to Calculate Stat- rederer
            dataBase {1D Array, None}: If this value is provided the array is updated with
                                       information predicted (info) using the mask goodPointsIdsTesting
            outputPath {str}: Output Raster Path
            applyLayerB {bool}: Apply Layer
        OUTPUT:
            values (list, Array, None)
        """

        if self.rasterDimensionInfo is not None:
            sliceData, goodPointsIdsTesting, intersection, cellSize, nRows, nCols = self.rasterDimensionInfo

            ####  Output Raster If Path is Defined ####
            if outputPath != "":

                if dataBase is None:
                    dataBase = NUM.ones((self.infoRasterInstances.nRows*self.infoRasterInstances.nCols), dtype = float)*NULL
                    dataBase[goodPointsIdsTesting] = info
                else:
                    dataBase[goodPointsIdsTesting] = NUM.asarray(info, dtype = NUM.float32)

                    #### Accumulate Values ####
                    if getNValues is not None:

                        #### Get
                        ids = NUM.random.randint(0, len(info), getNValues )
                        maxValue = info.max()
                        values = list(info[ids])
                        values.append(info.min())
                        values.append(info.max())
                        return values

                #### Reshape Array ####
                dataBase.shape = (self.infoRasterInstances.nRows, self.infoRasterInstances.nCols)
                dataBase = dataBase[sliceData[0],sliceData[1]]

                #### Create Raster ####
                self.__createRaster(dataBase, newSRF, intersection[0], intersection[1],
                                cellSize, cellSize, outputPath)

    def __createRaster(self, data, sf, minX, minY, cellXSize, cellYSize, outputRaster):
        """
        Create Raster Output from RF
        INPUT:
            data {array 1D}: data compute by RF
            sf {Spatial Reference}: Spatial Reference
            minX {float}: Xmin
            minY {float}: Ymin
            cellXSize {double}: cell size in X
            cellYSize: {double}: cell size in Y
            outputRaster: {str}: Output path
        """
        spatialRef2SetBack = ARCPY.env.outputCoordinateSystem
        ARCPY.env.outputCoordinateSystem = sf
        point = ARCPY.Point(minX, minY)
        raster = ARCPY.NumPyArrayToRaster (data, point, cellXSize , cellYSize, NULL)
        raster.save(outputRaster)
        ARCPY.env.outputCoordinateSystem = spatialRef2SetBack

    def __processRasterByParts(self, newSRF):

        #### Get Number of Zones ####
        nRasterOutput = len(self.infoRasterInstances.rangeZones)

        #### Threshold Values to Calculate Render ####
        sampleVisSize  = 1000

        #### Number Values To Extract in each Zone ####
        sampleVisSize = int(sampleVisSize / nRasterOutput) + 1

        #### Number Of Cells To Process ####
        sizeRaster = float(self.infoRasterInstances.nRows) * float(self.infoRasterInstances.nCols)
        valuesToRender = []
        #### Number of Cell per Chunck ####
        nOutputTempRasters =  int(NUM.ceil(sizeRaster / (SSF.maxSizeCells/2)))

        ### Get Number of Zones Per Chuck (Output Raster to write) ####
        pn = int(NUM.ceil(nRasterOutput / nOutputTempRasters))

        #### Set Each Part to a Raster Zone ####
        #### Create a List of Ids In each Chuck ####
        oup = [NUM.asarray(NUM.arange(pn) + i*pn, dtype = int) for i in range(nOutputTempRasters)]
        oup = [ i[i<nRasterOutput]  for i in oup ]
        oup = [ i for i in oup if len(i)>0]

        #### Initialize Variables ####
        dataBase = dataset = variable = pathTempNC = pathFLT = nameFLT = None
        workspaceOutput = ""
        listRasterZones = []
        #### Calculate Initial Chuck Information ####
        infoSlice = self.calculateChunckSize(self.infoRasterInstances, oup[0])
        chunckSize , newSliceCol, newSliceRow, iniIndex, \
        xMinYMin, nColsStep, nRowsStep = infoSlice
        multipleFLTAreCreated = False

        #### Raster Keep in Memory #####
        if sizeRaster < SSF.maxSizeCells:
            #### Create an array smaller than maxSizeCells ###
            #### Only one Temporal file is created ####
            dataBase = NUM.ones((self.infoRasterInstances.nRows*self.infoRasterInstances.nCols),
                                dtype = NUM.float32)*float(NULL)
            multipleFLTAreCreated = True
        else:
            #### Calculate Last Chuck Information ####
            infoSlice = self.calculateChunckSize(self.infoRasterInstances, oup[-1])
            chunckSize , newSliceCol, newSliceRow, iniIndex, \
            xMinYMin, nColsStep, nRowsStep = infoSlice
            #### Create FLT Using Info Last Chunck To set
            pathFLT, nameFLT =  self.createTemporalFLT(cellSize = self.infoRasterInstances.cellSize,
                                                       xMinYMin = xMinYMin,
                                                       nRowsCols = (self.infoRasterInstances.nRows,
                                                                   self.infoRasterInstances.nCols),
                                                       data = None,
                                                       srf = self.infoRasterInstances.srf)
        cnt = 0
        #### Iterate Number of Rasters ####
        for listBase in oup:

            #### Get Information of Current Chuck  (Group of Zones) ####
            infoSlice = self.calculateChunckSize(self.infoRasterInstances, listBase)
            chunckSize , newSliceCol, newSliceRow, iniIndex, \
            xMinYMin, nColsStep, nRowsStep = infoSlice

            if not sizeRaster < SSF.maxSizeCells:
                #### Create Temporal Array Container ####
                dataBase = NUM.ones((nRowsStep*nColsStep), dtype = NUM.float32)*float(NULL)
                            #### Predict Each Zone in a Chunck ####
            for i in listBase:
                #### Get Dimension Raster Zones ####
                self.rasterDimensionInfo = self.infoRasterInstances.getRasterInfoZone(i)

                coords, mask = self.infoRasterInstances.extractZone(i, True)
                coords = self._geocentricForRaster(coords)

                #### Extract Data From All Raster Dataset for the Current Zone i ####
                if len(coords) == 0:
                    if not sizeRaster < SSF.maxSizeCells:

                        #### Reshpae dataBase Array ####
                        dataBase.shape = (nRowsStep, nColsStep)

                        #### Update Temporal FLT File ####
                        workspaceOutput, outputName = self.createTemporalFLT(data = dataBase,
                                                                             pathFileAndName = (pathFLT, nameFLT))
                        listRasterZones.append(outputName)
                    continue

                dataX = self.outlierObj.detect(coords)

                if sizeRaster < SSF.maxSizeCells:
                    #### Mask Contain Real Cell Ids ####
                    self.rasterDimensionInfo[1] = mask
                else:
                    #### Mask Id Cell are Relative to Current Container ####
                    self.rasterDimensionInfo[1] = mask - iniIndex

                #### Update Container dataBase ####
                listVal = self.outputRasterFnc(dataX, newSRF = newSRF,
                                                getNValues = sampleVisSize,
                                                dataBase = dataBase,
                                                outputPath = self.outputRaster)
                valuesToRender.extend(listVal)

            if not sizeRaster < SSF.maxSizeCells:
                ##### Update Temporal File FLT for each Chunck ####
                ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84007))

                #### Reshpae dataBase Array ####
                dataBase.shape = (nRowsStep, nColsStep)

                #### Update Temporal FLT File ####
                workspaceOutput, outputName = self.createTemporalFLT(data = dataBase,
                                                                     pathFileAndName = (pathFLT, nameFLT))

                listRasterZones.append(outputName)
                ARCPY.ResetProgressor()

        if sizeRaster < SSF.maxSizeCells:
            #### Create Temporal File FLT For Container ####
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84857))
            dataBase.shape = (self.infoRasterInstances.nRows, self.infoRasterInstances.nCols)
            outPath, outName = OS.path.split(self.outputRaster)

            if "." in outName:
                index = len(outName) - outName.find(".")
                removeExt = outName[index:]
                if removeExt in outName.lower():
                    outName = outName.lower().replace(removeExt,"")

            if len(valuesToRender ) == 0:
                 ARCPY.AddIDMessage("ERROR", 10243)
                 self.__tryDelete()
                 raise SystemExit

            self.createOutputRasterFromTemporalFile(self.outputRaster, self.infoRasterInstances, dataBase )
            ARCPY.ResetProgressor()
            return valuesToRender
        else:
            #### Create Predition Output ####
            outPath, outName = OS.path.split(self.outputRaster)

            if "." in outName:
                index = len(outName)- outName.find(".")
                removeExt = outName[index:]
                if removeExt in outName.lower():
                    outName = outName.lower().replace(removeExt,"")

            if len(valuesToRender ) == 0:
                 ARCPY.AddIDMessage("ERROR", 10243)
                 self.__tryDelete()
                 raise SystemExit

            self.createFinalOutput( multipleFLTAreCreated, workspaceOutput, listRasterZones, pathFLT, nameFLT,
                                   self.outputRaster, srf = newSRF)
            return valuesToRender

    def runDetectionRaster(self, outputRaster):

        SSF.maxSizeCells = 1e8
        MEMSIZE =  1e8
        MEMPOINT = 1e8

        self.outputRaster = outputRaster
        extent = UTILS.resetExtent(self.ssdo.xyCoords, spatialRef= self.ssdo.spatialRef)

        w = (extent.XMax - extent.XMin)/250
        h = (extent.YMax - extent.YMin)/250
        cellSize = h

        if w > h:
            cellSize = h

        if ARCPY.env.cellSize not in  ["MAXOF", "MINOF"]:
            cellSizeBase = -1
            try:
                cellSizeBase = UTILS.str2float(ARCPY.env.cellSize)
            except:
                pass
            try:
                r = ARCPY.sa.Raster(ARCPY.env.cellSize)
                cellSize = r.meanCellWidth
            except:
                pass
            if cellSizeBase != -1:
                cellSize = cellSizeBase

        if ARCPY.env.extent not in  ["MAXOF", "MINOF"]:
            extentBase = None
            if ARCPY.env.extent is not None:
                extentBase = ARCPY.env.extent
                poly = extentBase.polygon.projectAs(self.ssdo.spatialRef)
                extentBase = poly.extent

            if extentBase is not None:
                extent = extentBase

        aExtent = UTILS.getExtent(extent)
        self.created = None
        self.tempName = "memory/CTemp";

        if outputRaster is not None:
            #### Check License ####
            SSF.checkLicense()
            spatialRef2SetBack = ARCPY.env.outputCoordinateSystem
            ARCPY.env.outputCoordinateSystem = self.ssdo.spatialRef
            outRaster = ARCPY.sa.CreateConstantRaster(2, "INTEGER", cellSize, " ".join([str(i) for i in aExtent]))
            outRaster.save(self.tempName)
            self.created = True
            baseR = ARCPY.sa.Raster(outRaster)
            ARCPY.env.outputCoordinateSystem = spatialRef2SetBack

            #### Object To Extrace Raster Information ####
            self.infoRasterInstances = SSF.RasterInfo([baseR], [False], disableMessage = True, maxSize = MEMSIZE)

            if self.infoRasterInstances is not None:

                self.infoRasterInstances.preProcessZones()

                newSRF = self.ssdo.spatialRef
                processInBatches = len(self.infoRasterInstances.rangeZones) > 1

                #### Small Raster ####
                if not processInBatches :
                    coords, mask = self.infoRasterInstances.extractZone(0, True)

                    coords = self._geocentricForRaster(coords)
                    #### Extract Data From All Raster Dataset for the Current Zone i ####
                    dataX = self.outlierObj.detect(coords)

                    if mask is None:
                        self.__tryDelete()
                        raise SystemExit

                    self.rasterDimensionInfo = self.infoRasterInstances.getRasterInfoZone()
                    self.rasterDimensionInfo[1] = mask

                    sliceData, goodPointsIdsTesting, intersection, cellSize, nRows, nCols = self.rasterDimensionInfo
                    dataBase = NUM.ones((self.infoRasterInstances.nRows*self.infoRasterInstances.nCols), dtype = float)*NULL
                    dataBase[goodPointsIdsTesting] = dataX

                    #### Reshape Array ####
                    dataBase.shape = (self.infoRasterInstances.nRows, self.infoRasterInstances.nCols)
                    dataBase = dataBase[sliceData[0],sliceData[1]]

                    spatialRef2SetBack = ARCPY.env.outputCoordinateSystem
                    ARCPY.env.outputCoordinateSystem = newSRF
                    point = ARCPY.Point(intersection[0], intersection[1])
                    raster = ARCPY.NumPyArrayToRaster (dataBase, point, cellSize , cellSize, NULL)
                    raster.save(outputRaster)
                    ARCPY.env.outputCoordinateSystem = spatialRef2SetBack
                    dataBase = dataBase[dataBase > -999999]

                    if self.outlierType == "LOCAL":
                        self.minValue = 0
                        self.maxValue = 1
                        self.meanValue = 2.0
                    else:
                        self.minValue = self.dataOutput.min()
                        self.maxValue = self.dataOutput.max()
                        self.meanValue = self.dataOutput.mean()

                    if len(dataBase) > 0:
                        self.minValue = dataBase.min()
                        self.maxValue = dataBase.max()
                        self.meanValue = dataBase.mean()

                    #### Apply Raster Layer ####
                    self.__applyJSONLayer()

                #### Large Raster  ####
                if processInBatches:
                    values  =  self.__processRasterByParts(self.ssdo.spatialRef)
                    self.minValue = self.dataOutput.min()
                    self.maxValue = self.dataOutput.max()
                    self.meanValue = self.dataOutput.mean()
                    if values is not None:
                        randValues = NUM.array(values)
                        randValues = randValues[randValues > -999999]
                        self.minValue = randValues.min()
                        self.maxValue = randValues.max()
                        self.meanValue = randValues.mean()
                    #### Apply Raster Layer ####
                    self.__applyJSONLayer()

        #### Remove Temporal Raster ####
        self.__tryDelete()

    def __tryDelete(self):
        if self.created == True:
            try:
                UTILS.passiveDelete(self.tempName)
            except:
                pass

    def output(self):

        if ARCPY.env.isCancelled:
            raise SystemExit()

        ### Get Original Coordinates ###
        self.ssdo = self.coorHandler.reset()

        sourceId = NUM.array(list(self.ssdo.master2Order.keys()))
        fieldDict = []
        fieldName = "NTHDIST"
        aliasName = ARCPY.GetIDMessage(220243).format(self.minPoints)

        if self.outlierType == "LOCAL":
            fieldName = "LOF"
            aliasName = ARCPY.GetIDMessage(220110).format(self.minPoints)

        if not self.keepJustOutlier:
            fieldDict.append(["SOURCE_ID" , (NUM.asarray(sourceId, dtype = NUM.int32), "LONG",  ARCPY.GetIDMessage(220125))])
            fieldDict.append(["OUTLIER_ID" , (NUM.asarray(self.out, dtype = NUM.int32), "LONG", ARCPY.GetIDMessage(220126))])
            fieldDict.append([fieldName , (NUM.asarray(self.dataOutput, dtype = float), "DOUBLE", aliasName)])
        else:

            sourceIds  = sourceId[self.justOutliers]
            nr = len(sourceIds)
            self.ssdo.numObs  = nr
            self.ssdo.xyCoords = self.ssdo.xyCoords[self.justOutliers]
            if self.ssdo.hasZ:
                self.ssdo.zCoords = self.ssdo.zCoords[self.justOutliers]

            if nr == 0:
                ARCPY.AddIDMessage("Warning", 590, self.outputFC)

            fieldDict.append(["SOURCE_ID" , (NUM.asarray(sourceId[self.justOutliers], dtype = NUM.int32), "LONG",  ARCPY.GetIDMessage(220125))])
            fieldDict.append([fieldName , (NUM.asarray(self.dataOutput[self.justOutliers], dtype = float), "DOUBLE", aliasName)])

        self._createOutput(self.ssdo, self.outputFC, fieldDict)

    def _createOutput(self, ssdo,  outputFC, dictFields, checkNull = []):
        lFields = []
        for el in dictFields:
                checkNullValue = el[0] in checkNull
                field  = SSDO.CandidateField(name = el[0],
                                alias = el[1][2],
                                type =  el[1][1].upper(),
                                data = el[1][0],
                                checkNullValues = checkNullValue)
                lFields.append(field)
        try:
            if hasattr(ssdo, "shapes"):
                ssdo.shapes = list(ssdo.shapes)
            ARC._ss.output_featureclass_from_dataobject(ssdo, outputFC, lFields )
        except:
            raise SystemExit()

    def applyJSONLayerPoints(self, parameterIndex = 1 ):
        """ Apply Template Layer - Editing heading and labels """

        import json
        from arcpy.cim.cimloader import GetJSONTypeOBJ
        from arcpy.cim.cimloader import  CimJsonEncoder

        pathLayer = OS.path.join(UTILS.pathLayers, "LocalOutlierFactor.lyrx")
        #### Read layer template ####
        lyrxFile = open(pathLayer, 'r')
        lines = lyrxFile.readlines()
        jsonRasterCIM =""

        for line in lines:
            if "workspaceConnectionString" in line:
                line = '"workspaceConnectionString" : "DATABASE=rrerr.gdb",\n'
            jsonRasterCIM += line+"\n"
        lyrxFile.close()

        #### Get Layer CIM to Change Layer Properties ####
        layerCIM = GetJSONTypeOBJ(json.loads(jsonRasterCIM))
        layerCIMLayer = layerCIM.layerDefinitions[0]
        #### Change label ####
        layerCIMLayer.renderer.groups[0].classes[0].label = ARCPY.GetIDMessage(220124)
        layerCIMLayer.renderer.groups[0].classes[1].label = ARCPY.GetIDMessage(84351)
        #### Change Heading ####
        layerCIMLayer.renderer.groups[0].heading = ARCPY.GetIDMessage(220126)

        #### Get Back JSON String ####
        jsonData = json.dumps(layerCIMLayer, cls=CimJsonEncoder)

        ARCPY.gp.SetParameterSymbology(parameterIndex, "JSONCIMDEF="+jsonData)

    def __applyJSONLayer(self,parameterIndex=4, editClasses = True):
        """ Apply Template in raster layer - Adding classes """

        import json
        from arcpy.cim.cimloader import GetJSONTypeOBJ
        from arcpy.cim.cimloader import  CimJsonEncoder

        minValue = self.minValue
        meanValue = self.meanValue
        maxValue = self.maxValue

        colors = [ [0, 60, 48, 80],
                    [53, 151, 143, 80],
                    [199, 234, 229, 80],
                    [246, 232, 195, 80],
                    [191, 129, 45, 80],
                    [84, 48, 5, 80]
                 ]
        rangesValues = None
        ep = 1e-5
        if minValue == maxValue:
            if minValue <= self.threshold:
                 rangesValues = [[colors[3],[minValue, maxValue], 1]]
            else:
                rangesValues = [[colors[2],[minValue, maxValue], 0]]
        else:
            if self.threshold >= self.maxValue:
                maxV = max(self.threshold, self.maxValue)
                interval = (maxV - self.minValue)/3

                rangesValues = [
                  [colors[0],[self.minValue, self.minValue+interval],-1],
                  [colors[1],[self.minValue+interval, self.minValue+interval*2],-1],
                  [colors[2],[self.minValue+interval*2, maxV+ep], 1]]

            elif self.threshold < self.maxValue and self.threshold > self.minValue:
                interval = (self.threshold - self.minValue)/3
                intervalH = (self.maxValue - self.threshold)/3

                rangesValues = [
                  [colors[0],[self.minValue, self.minValue+interval],-1],
                  [colors[1],[self.minValue+interval, self.minValue+interval*2], -1],
                  [colors[2],[self.minValue+interval*2, self.threshold],1],
                  [colors[3],[self.threshold, self.threshold+intervalH], -1],
                  [colors[4],[self.threshold+intervalH, self.threshold+intervalH*2], -1],
                  [colors[5],[self.threshold+intervalH*2,self.maxValue+ep],-1]
                  ]

            else:
                minV = min(self.threshold, self.minValue)
                interval = (self.maxValue - minV)/3

                rangesValues = [
                  [colors[3],[minV, minV+interval],0],
                  [colors[4],[minV+interval, minV+interval*2],-1],
                  [colors[5],[minV+interval*2, self.maxValue+ep],-1]]

        strFormat = "%0.2f"
        minValueLabel = UTILS.formatValue(minValue, strFormat )
        maxValueLabel = UTILS.formatValue(maxValue,strFormat )
        pathLayer = OS.path.join(UTILS.pathLayers, "LocalOutlierFactorRaster.lyrx")

        #### Read layer template ####
        lyrxFile = open(pathLayer, 'r')
        lines = lyrxFile.readlines()
        jsonRasterCIM =""
        for line in lines:
            if "workspaceConnectionString" in line:
                line = '"workspaceConnectionString" : "DATABASE=rrerr.gdb",\n'
            jsonRasterCIM += line+"\n"
        lyrxFile.close()

        if editClasses:
            #try:
            #### Get Layer CIM to Change Layer Properties ####
            layerCIM = GetJSONTypeOBJ(json.loads(jsonRasterCIM))
            layerCIMRaster = layerCIM.layerDefinitions[0]
            clsValues =[]

            for cat in rangesValues:
                classBreak = ARCPY.cim.CreateCIMObjectFromClassName('CIMRasterClassBreak', 'V2')
                color = ARCPY.cim.CreateCIMObjectFromClassName('CIMRGBColor', 'V2')
                color.values = cat[0]
                classBreak.upperBound = cat[1][1]
                classBreak.color = color
                strL = ""
                strR = ""
                #### Add Threshol in legend ####
                if cat[2] != -1:
                    if cat[2] == 0:
                        strL = "({}) ".format(ARCPY.GetIDMessage(220127))
                    else:
                        strR = " ({}) ".format(ARCPY.GetIDMessage(220127))

                label = ""
                if cat[1][0] == cat[1][1]:
                    label = "{0}{1}{2}".format(strL,UTILS.formatValue(cat[1][0],strFormat), strR)
                else:
                    label = "{0}{1} - {2}{3}".format(strL,UTILS.formatValue(cat[1][0],strFormat ),  UTILS.formatValue(cat[1][1],strFormat ), strR)

                classBreak.label = label
                clsValues.append(classBreak)
            layerCIMRaster.colorizer.classBreaks = clsValues

            #### Get Back JSON String ####
            jsonData = json.dumps(layerCIMRaster, cls=CimJsonEncoder)
            ARCPY.gp.SetParameterSymbology(parameterIndex, "JSONCIMDEF="+jsonData)
            # except:
                # ARCPY.AddIDMessage("WARNING", 973)
        else:
            ARCPY.gp.SetParameterSymbology(parameterIndex, "JSONCIMDEF="+jsonRasterCIM)

################## HDBSCAN ############################
class HDBSCAN(TimeEnabler):
    def __init__(self, inputFC, outputFC, minPoints, leaf_size = 40, distanceType = 2, parallel = -1,
                 timeField = None, timeInterval = None):
        self.parallel = parallel
        self.distanceType = distanceType
        self.inputFC = inputFC
        self.outputFC = outputFC
        self.minPoints = minPoints
        self.ssdo = SSDO.SSDataObject(inputFC)

        if not self.ssdo.distanceInfo.xyzUnitsEqual:
            ARCPY.AddIDMessage("ERROR", 110083)
            raise SystemExit()

        if ARCPY.env.isCancelled:
            raise SystemExit()

        super().__init__(self.ssdo, timeField, timeInterval, outputFC)
        self.loadData()
        self.coorHandler = CoordinateHandler(self.ssdo)
        self.ssdo = self.coorHandler.setCoordinates()

        self.numObs  = self.ssdo.numObs

        self.xyCoords = self.coorHandler.getXYZ()
        self.N = len(self.xyCoords)

        #### Threshold  to use compensated trees ####
        useMedian = 1
        if len(self.xyCoords) > ThresholdForCompensateKDTree:
            useMedian = 0

        self.tree = ARC._ss.KDTree(self.xyCoords, leafsize = leaf_size, use_median = useMedian)

        self.startTime = DT.datetime.now()
        self.time ={}
        self.stime = {}

        self.labels_ = None
        self.prob = None
        self.outliers = None
        self.stability = None
        self.examp = None

    def s(self, name):
        self.stime[name]=DT.datetime.now()
    def e(self, name):
        self.time[name] = DT.datetime.now()-self.stime[name]
    def pt(self):
        for i in self.time:
            ARCPY.AddMessage(str(i) + " " + str(self.time[i]))

    def run(self):

        if len(self.ssdo.xyCoords) <  self.minPoints:
            ARCPY.AddIDMessage("ERROR", 110141)
            raise SystemExit()

        #### Calculate the Minimum Spanning Tree ####
        hierarchyMST = self.hierarchyMST()

        if hierarchyMST is None:
            raise SystemExit()

        #### Condensing the Tree ####
        self.s("tree")
        tree = ARC._ss.TreeLabels(hierarchyMST, self.minPoints, num_threads = self.parallel);
        msg = ARCPY.GetIDMessage(84755)
        ARCPY.SetProgressor("default", msg)
        data = tree.get_clusters_info()
        self.e("tree")

        #self.pt()
        (self.labels_,
        self.prob,
        self.outliers,
        self.stability,
        self.examp)  =  data

    def hierarchyMST(self):

        if ARCPY.env.isCancelled:
            raise SystemExit()

        msg = ARCPY.GetIDMessage(84753) 
        ARCPY.SetProgressor("default", msg)

        #### Calculating Core Distances ####
        distances, ids = self.tree.query(x = self.xyCoords, 
                                         k = [self.minPoints], 
                                         p = self.distanceType,
                                         n_jobs = self.parallel)

        distances = distances.ravel()
        self.distances = distances

        if ARCPY.env.isCancelled:
            raise SystemExit()

        msg = ARCPY.GetIDMessage(84754)  
        ARCPY.SetProgressor("default", msg)
        self.s("mst")
        result = ARC._ss.min_span_prism(self.xyCoords, distances)
        self.e("mst")

        return result

    def output(self):

        n = len(self.labels_)
        ids = NUM.arange(n, dtype = NUM.int32 )[self.examp]
        noExamp = NUM.zeros(n, dtype = NUM.int32)
        noExamp[ids] = 1
        self.labels_[ self.labels_ < 0] = -1
        sourceId = NUM.array(list(self.ssdo.master2Order.keys()))

        labels = checkLabels(NUM.asarray(self.labels_, dtype = NUM.int32))
        numClustersMessage(labels)
        color = Colors(self.coorHandler.getXYZ(), labels)
        data = color.getColors()
        self.labelColor, self.idsLabels, self.countLabels = data

        self.ssdo = self.coorHandler.reset()
        stability = labels.copy()
        stability = stability.astype(NUM.float64)

        for id, value in enumerate(self.stability):
            stability[stability == (id + 1)] = value
        stability[stability == -1] = 0.0
        self.out = labels
        fieldDict = [["SOURCE_ID" ,(NUM.asarray(sourceId, dtype = NUM.int32), "LONG", ARCPY.GetIDMessage(220125))],
                     ["CLUSTER_ID" , (labels, "LONG", ARCPY.GetIDMessage(220174))],
                     ["PROB", (self.prob, "DOUBLE", ARCPY.GetIDMessage(220175))],
                     ["OUTLIER", (self.outliers, "DOUBLE", ARCPY.GetIDMessage(220176))],
                     ["EXEMPLAR", (noExamp, "LONG", ARCPY.GetIDMessage(220177))],
                     ["STABILITY", (stability, "DOUBLE", ARCPY.GetIDMessage(220178))],
                     ["COLOR_ID" ,(self.labelColor, "LONG", ARCPY.GetIDMessage(220179))]]

        layer = output(self.ssdo, self.outputFC, fieldDict, None, nCounts=self.countLabels,
                       checkNull = ["STABILITY"] )
        return layer

def getReachability(inputFC, minPoints = None, threshold = None, 
                    outputFC = None, viewReach = False, 
                    nameLayer = "NewClusters", functionE = None):


    ssdo = SSDO.SSDataObject(inputFC)
    ssdo.obtainData(fields = ["REACHORDER","REACHDIST"])


    ord = ssdo.fields["REACHORDER"].data
    reachValues = ssdo.fields["REACHDIST"].data
    data = NUM.zeros((len(reachValues), 2), dtype= float)
    data[:, 0] = reachValues 
    data[:, 1] = ord
    odata = data[data[:,1].argsort()]
    reachValues = odata[:,0]
    orderValues = ord.astype(NUM.intp)

    if minPoints is None:
        return reachValues, orderValues

    if functionE is None:
        zones = DetectZones()
        idClusters, colors =  zones.getClusters(reachValues,
                                            orderValues,
                                            minPoints, 
                                            threshold,
                                            showReachInMapPlotLib = viewReach)
    else:
        idClusters, colors =  functionE.getClusters(reachValues,
                                            orderValues,
                                            minPoints, 
                                            threshold,
                                            showReachInMapPlotLib = viewReach)
    layer = None
    if outputFC:
        #### Source ID ###
        sourceId = NUM.array(list(ssdo.master2Order.keys()))
        labels = checkLabels(NUM.asarray(idClusters, dtype = NUM.int32))
        #### Colort Scheme ###
        color = Colors(ssdo.xyCoords, labels)
        data = color.getColors()
        labelColor, idsLabels, countLabels = data
        #### Messages ####
        numClustersMessage(labels)
        fieldDict = [["SOURCE_ID" ,(NUM.asarray(sourceId, dtype = NUM.int32), "LONG", ARCPY.GetIDMessage(220125))],
                     ["CLUSTER_ID" ,(labels, "LONG", ARCPY.GetIDMessage(220174))],
                     ["REACHORDER", (ssdo.fields["REACHORDER"].data, "LONG", ARCPY.GetIDMessage(220180))],
                     ["REACHDIST",  (ssdo.fields["REACHDIST"].data, "DOUBLE", ARCPY.GetIDMessage(220181))],
                     ["COLOR_ID" ,(labelColor, "LONG", ARCPY.GetIDMessage(220179))]]
        layer  = output(ssdo, outputFC, fieldDict, None, nCounts = countLabels )
        try:
            ARCPY.MakeFeatureLayer_management(outputFC, nameLayer)
            ARCPY.management.ApplySymbologyFromLayer(nameLayer, layer, "VALUE_FIELD COLOR_ID COLOR_ID", "DEFAULT")
        except:
            pass

    return zones, layer

