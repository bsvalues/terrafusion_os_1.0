# coding: utf-8
"""
Tool Name:     Presence Only Prediction
Source Name:   PresenceOnlyPrediction.py
Version:       ArcGIS Pro 2.7
Author:        Environmental Systems Research Institute Inc.
Description:   Runs Penalized Regression for Presence Only Data
"""

################ Imports ####################
import sys as SYS
import os as OS
import numpy as NUM
import numpy.linalg as LA
import numpy.random as RAND
import arcpy as ARCPY
import arcgisscripting as ARC
import ErrorUtils as ERROR
import SSUtilities as UTILS
import WeightsUtilities as WU
import SSDataObject as SSDO
import Stats as STATS
import locale as LOCALE
import SSForest as FOREST
import re
import itertools as ITER
LOCALE.setlocale(LOCALE.LC_ALL, '')
from scipy.optimize import minimize 
from scipy.special import expit
import SSSpatialThinning as THIN
import SSForest as SF
import copy as COPY
import warnings as WARN
from SSHelperFunctions import *

thresholdMaxCellRasterExtent = 1e8
NULL = -999999
basis2Index = {'LINEAR': 0, 'QUADRATIC': 1, 'PRODUCT': 2, 'HINGE': 3, 'THRESHOLD': 4}
basisIndex2ID = {0 : 220298, 1 : 220299, 2 : 220300, 3: 220301, 4 : 220302}
index2Basis = {v: k for k, v in basis2Index.items()}
predBreaks = NUM.array([.25, .5, .75], dtype = float)
catTypes2StrReport = ["INTEGER", "SMALLINTEGER", "LONG", "DOUBLE", "BIGINTEGER"]

#### Coded Value Domain Dicts ####
predRange = NUM.arange(0.0, 1.25, .25)
predBinCV = {}
for index in range(4):
    predBinCV[index] = '{0} - {1}'.format(UTILS.formatValue(predRange[index], '%0.2f'), 
                                          UTILS.formatValue(predRange[index + 1], '%0.2f'))
yOutCV = {0:'Background', 1:'Presence'}
classifyCV = {0: 'Presence - Correctly Classified', 1: 'Presence - Misclassified',
                 2: 'Background - Unchanged', 3: 'Background - Classified as Potential Presence'}

basisTables = {'linear': [[0,10,30,100], [1,1,0.2,0.05]],
               'quadratic': [[0,10,17,30,100], [1.3,0.8,0.5,0.25,0.05]],
               'product': [[0,10,17,30,100], [2.6,1.6,0.9,0.55,0.05]],
               'hinge': [[0,1], [0.5,0.5]],
               'threshold': [[0,100], [2.0, 1.0]],
               'categorical': [[0,10,17], [0.65, 0.5, 0.25]]}

noSupportSAFormats = ['Image Service', "Cache/LERC2D", "AFR"]

def strCatValueBool(catField):
    if hasattr(catField,"type") and catField.type.upper() in catTypes2StrReport:
        return True
    if hasattr(catField,"fieldType") and catField.fieldType.upper() in catTypes2StrReport:
        return True

    return False

def checkCVDependentVar(cvGroups, yData):
    n = len(yData)
    countGoodGroups = 0
    for group, excludedIndices in cvGroups.items():

        #### Included To Predict ####
        includedToPredict = NUM.ones(n, dtype = bool)
        includedToPredict[excludedIndices] = False

        ySubSet = yData[includedToPredict]
        oneCount = (ySubSet == 1).sum() > 1
        zeroCount = (ySubSet == 0).sum() > 1
        if len(ySubSet) >= 5 and oneCount and zeroCount:
            countGoodGroups += 1

    return countGoodGroups == len(cvGroups)

def combineUniqueInfo(currentUnique, currentCounts, newUnique, newCounts):
    comboUnique = []
    comboCounts = []
    for ind, value in enumerate(newUnique):
        isIn = NUM.isin(newUnique, currentUnique)
        if isIn[ind]:
            comboUnique.append(value)
            comboCounts.append(currentCounts[ind] + newCounts[ind])
        else:
            comboUnique.append(value)
            comboCounts.append(newCounts[ind])

    return comboUnique, comboCounts

def getPredRasterInfoList(rasterList, trainRasterInfoList):
    rasterInfoList = []
    noSupport  = False

    try:
        for ind, val in enumerate(rasterList):

            if 'rfType' in trainRasterInfoList[ind]:
                typeVar = trainRasterInfoList[ind]['rfType']
            else:
                typeVar = trainRasterInfoList[ind]['variableType']

            val = val.replace("'", "")
            desc = ARCPY.sa.Raster(val)

            if desc.format  in noSupportSAFormats:
                noSupport = True

            if desc.name is None:
                name1 = str(desc)
                path = str(desc)
                name = name1
                pathAll =  name1
            else:
                name1 = str(desc.name)
                path = desc.path
                name = SF.getNameRaster(name1.upper())
                pathAll =  OS.path.normpath(path +"\\"+ desc.name)

            if desc.format == "NetCDF":
                pathAll = desc.name
            del desc


            rowVar =    {"name":name, "alias":name1, "rfType":typeVar,
                            "fieldType":"Double", "source":"RASTER",
                            "sourceData": pathAll
                            }
            rasterInfoList.append(rowVar)
    except:
        ARCPY.AddIDMessage("ERROR", 110202)
        raise SystemExit

    if noSupport:
        ARCPY.AddIDMessage("ERROR", 110213)
        raise SystemExit

    return rasterInfoList

def getRasterInfoList(rasterList):
    rasterInfoList = []
    noSupport  = False
    try:
        for rOpt in rasterList:
            i = None
            count = sum(map(lambda x : 1 if "'" in x else 0, rOpt ))

            if count == 0:
                i = rOpt.split(" ")
            if count == 2:
                part1 = rOpt.split("'")[1::2]
                part2 = rOpt.replace(part1[0],"").replace("'","").strip()

                i = [ part1[0], part2]

            val = i[0]
            typeVar = "NUMERIC"

            if i[1] in [True , "true", "CATEGORICAL", "TRUE"] :
                typeVar = "CATEGORICAL"

            desc = ARCPY.sa.Raster(val)

            if desc.format  in noSupportSAFormats:
                noSupport = True

            if desc.name is None:
                name1 = str(desc)
                path = str(desc)
                name = name1
                pathAll =  name1
            else:
                name1 = str(desc.name)
                path = desc.path
                name = SF.getNameRaster(name1.upper())
                pathAll =  OS.path.normpath(path +"\\"+ desc.name)

            if desc.format == "NetCDF":
                pathAll = desc.name
                del desc

            rowVar =    {"name":name, "alias":name1, "rfType":typeVar,
                            "fieldType":"Double", "source":"RASTER",
                            "sourceData": pathAll
                            }
            rasterInfoList.append(rowVar)
    except:
        ARCPY.AddIDMessage("ERROR", 110202)
        raise SystemExit

    if noSupport:
        ARCPY.AddIDMessage("ERROR", 110213)
        raise SystemExit

    return rasterInfoList

def createAppendFieldNames(fieldNames, outPath = None, candidateFields = None, explicitMaxLength = None):
    """Creates unique field names for appended fields from input. (1)

    INPUTS:
    fieldNames (list): name of input fields that are to be appended
    outPath (str): path to the output feature class
    candidateFields/ssdo.fields (dict): CandidateField Objects or SSDO Fields
    explicitMaxLength {int}: truncate field names to this integer length

    OUTPUT:
    appendNames (list): output field names for appended fields from input

    NOTES:
    (1) Honors Fully Qualified Field Names Env Setting in the case of joins.
    """

    #### Set Outpath to Scratch GDB if None ####
    if outPath is None:
        outPath = ARCPY.env.scratchGDB
    elif outPath.lower().startswith("memory"):
       outPath = "memory"
    elif outPath.lower().startswith("in_memory"):
       outPath = "in_memory"
    else:
        #### Assess Whether Output is ShapeFile ####
        if ARCPY.Exists(outPath):
            descSelf = ARCPY.Describe(outPath)
            upperType = descSelf.DataType.upper()
            if upperType not in ["WORKSPACE", "MOBILE", "FOLDER", "REMOTEDATABASE", "LOCALDATABASE"]:
                outPath, outName = OS.path.split(outPath)
        else:
            outPath, outName = OS.path.split(outPath)
    descWS = ARCPY.Describe(outPath)

    baseType = descWS.DataType
    if explicitMaxLength is not None:
        maxLen = explicitMaxLength
    else:
        if outPath == "in_memory":
            maxLen = 64
        else:
            isShapeFile = baseType.upper() == "FOLDER"
            if isShapeFile:
                maxLen = 10
            else:
                maxLen = 64

    #### Validate Field Names ####
    fieldNames = [ ARCPY.ValidateFieldName(i, outPath) for i in fieldNames ]

    #### Deal with Possible Candidate Fields ####
    upperAppendNames = []
    if candidateFields is not None:
        if isinstance(candidateFields, dict):
            upperAppendNames = [ i.upper() for i in candidateFields.keys() ]
        elif isinstance(candidateFields, list):
            if len(candidateFields):
                if isinstance(candidateFields[0], SSDO.CandidateField):
                    upperAppendNames = [ i.name.upper() for i in candidateFields ]
                else:
                    upperAppendNames = [ i.upper() for i in candidateFields ]

    #### Must Account for Static Output Field Names if Given ####
    appendNames = []

    #### Creates Unique Field Names ####
    for fieldName in fieldNames:
        fixedName = fieldName[:maxLen]
        upperName = fieldName.upper()
        idx = 1
        while upperName in upperAppendNames:
            suffix = "_%i" % idx
            lenSuff = len(suffix)
            fixedName = fixedName[:(maxLen - lenSuff)] + suffix
            upperName = fixedName.upper()
            idx += 1
        appendNames.append(fixedName.upper())
        upperAppendNames.append(upperName)

    return appendNames

def applyJSONLayer(parameterIndex, editClasses = True, defaultLayer = "LocalOutlierFactorRaster.lyrx",cutoff = 0.5 ):
    """ Apply Template in raster layer - Adding classes """

    import json
    from arcpy.cim.cimloader import GetJSONTypeOBJ
    from arcpy.cim.cimloader import  CimJsonEncoder

    strFormat = "%0.2f"
    int1 = "{} - {}".format(UTILS.formatValue(0, strFormat),UTILS.formatValue(0.25, strFormat) )
    int2 = "{} - {}".format(UTILS.formatValue(0.25, strFormat),UTILS.formatValue(0.5, strFormat) )
    int3 = "{} - {}".format(UTILS.formatValue(0.5, strFormat),UTILS.formatValue(0.75, strFormat) )
    int4 = "{} - {}".format(UTILS.formatValue(0.75, strFormat),UTILS.formatValue(1, strFormat) )
    pathLayer = OS.path.join(UTILS.pathLayers, defaultLayer)

    colors = { int1:(0.25, [237,248, 251, 100]),
               int2: (0.5, [179, 205, 227, 100]),
               int3: (0.75, [140, 150, 198, 100]),
               int4: (1.0, [136, 65, 157, 100])
             }

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

        for cat in colors:
            classBreak = ARCPY.cim.CreateCIMObjectFromClassName('CIMRasterClassBreak', 'V2')
            color = ARCPY.cim.CreateCIMObjectFromClassName('CIMRGBColor', 'V2')
            color.values = colors[cat][1]
            classBreak.upperBound = colors[cat][0]
            classBreak.color = color
            classBreak.label = cat
            clsValues.append(classBreak)
        layerCIMRaster.colorizer.classBreaks = clsValues
        layerCIMRaster.colorizer.minimumBreak = 0
        #### Get Back JSON String ####
        jsonData = json.dumps(layerCIMRaster, cls=CimJsonEncoder)
        ARCPY.gp.SetParameterSymbology(parameterIndex, "JSONCIMDEF="+str(jsonData))
        # except:
            # ARCPY.AddIDMessage("WARNING", 973)
    else:
        ARCPY.gp.SetParameterSymbology(parameterIndex, "JSONCIMDEF="+jsonRasterCIM)

def cleanTempLayer(presencePolygon):
    if presencePolygon is not None:
        try:
            UTILS.passiveDelete(presencePolygon)
        except:
            pass

def getIndices(shapes, xyCoords):
    mask = NUM.zeros(len(xyCoords), dtype = bool)
    listIndices = NUM.arange(len(xyCoords))
    for shape in shapes:
        for i in listIndices:
            if not mask[i]:
                xy = xyCoords[i]
                point= ARCPY.Point(xy[0], xy[1])
                if shape.contains (point):
                    mask[i] = True

    return ~mask


class PredictionRasterInfo(object):
    def __init__(self, rastMatch, trainingRasterInfoList, spatialRef = None):
        UTILS.assignClassAttr(self, locals())
        
        #### Raster Match w/ Training PPDO ####
        rasterInfoPred = getPredRasterInfoList(rastMatch, trainingRasterInfoList)

        self.rasterNameList = [ i['name'] for i in rasterInfoPred ]
        self.rasterPath = [ i["sourceData"] for i in rasterInfoPred ]
        self.rasterType = [ i["rfType"] for i in rasterInfoPred ]
        self.rasterInfoPred = rasterInfoPred


        #### Get Raster X Columns ####
        self.boolType  = [ t.upper() in ["NUMERIC"] for t in self.rasterType]

        ### Process Raster to Predict ###
        self.rasterInfo = SF.RasterInfo(self.rasterPath, self.boolType, srfOutput = spatialRef, printInfo = False)

        #### Set Spatial Ref If Not Given ####
        if spatialRef is None:
            self.rasterInfo.getWorkExtent()
            self.spatialRef = self.rasterInfo.srf
        else:
            self.spatialRef = spatialRef

    def getOutputRasterFieldNames(self, output):
        outPath = None
        if output is not None:
            outPath, outName = OS.path.split(output)

        #### Assure Unique/Valid Names ####
        rastNameOut = createAppendFieldNames(self.rasterNameList, outPath = outPath)

        return rastNameOut

class PresenceOnly(object):

    def __init__(self, ssdo, rasterList, outPath = None, trainRasterInfoList = None, studyAreaPolygon= None, useConvexHull = False):
        self.ssdo = ssdo
        self.rasterList = rasterList
        self.studyAreaPolygon = studyAreaPolygon
        self.useConvexHull = useConvexHull
        #### Use Outpath for Prediction and ssdo.templateFC for Training ####
        if outPath is None:
            outPath = ssdo.templateFC

        #### Get Raster Info ####
        if trainRasterInfoList is None:
            #### Training with Categorical Flags ####
            self.rasterInfoList = getRasterInfoList(rasterList)
            #### useConvexHull should be an argument ####
            self.__loadInfo(outPath)

        else:
            #### Raster Match w/ Training PPDO ####
            self.rasterInfoList = getPredRasterInfoList(rasterList, trainRasterInfoList)

    def __maskNulls(self, data, coords):
        #### Mask null values ####
        if (data == NULL).sum() > 0:
            rows, cols = data.shape
            mask= NUM.ones(rows, dtype= bool)
            for i in NUM.arange(cols):
                msk = data.T[i]!=NULL
                mask = mask*msk
            return data[mask], coords[mask]
        return data,coords

    def __checkConvexHullDimensions(self, cellSize, CVPolygons, AOIRasterInfoExtent, isCH = False):
        #### Check the area betweeen the Convex hull and the Area of Interest ####
        e2 = AOIRasterInfoExtent.polygon
        
        if isCH:
            if hasattr(CVPolygons[0], "area") and CVPolygons[0].area == 0:
                ARCPY.AddIDMessage("ERROR",932)
                raise SystemExit()
        area = 0
        for pol in CVPolygons:
            inter = pol.intersect(e2,4)
            if hasattr(inter, "area") and inter.area > 0:
                area += inter.area

        if area > 0:
            numCells =  area/(cellSize*cellSize)
            if numCells > thresholdMaxCellRasterExtent:
                ARCPY.AddIDMessage("ERROR", 110441, int(numCells), int(thresholdMaxCellRasterExtent)) #
                raise SystemExit()
        return True

    def __loadInfo(self, outPath):
        ### Use ConvexHull/Feature class to mask absences ####
        ssdo = self.ssdo
        ssdoPolygon = None
        presencePolygon = None
        useMaskParameter = False
        maskIdOutsideMaskPolygon = None

        if self.useConvexHull:
            useMaskParameter = True
            # Find the extent of the presence to define make the raster composite
            presenceExtent = ssdo.extent
            xMin = presenceExtent.XMin
            xMax = presenceExtent.XMax
            yMin = presenceExtent.YMin
            yMax = presenceExtent.YMax

            #### Dissolve Polys into Boundary ####
            presencePolygon = UTILS.returnScratchName("conv_pop_", 
                                                 scratchWS = ARCPY.env.scratchGDB)
            ARCPY.management.MinimumBoundingGeometry(ssdo.inputFC, 
                                                        presencePolygon, 
                                                        "CONVEX_HULL", "ALL", None, "NO_MBG_FIELDS")
            ssdoPolygon = SSDO.SSDataObject(presencePolygon, explicitSpatialRef = ssdo.spatialRef)
            ssdoPolygon.obtainData(requireGeometry = True)
            refSSDO = ssdoPolygon

        elif self.studyAreaPolygon is not None:
            useMaskParameter = True
            ssdoPolygon = SSDO.SSDataObject(self.studyAreaPolygon, explicitSpatialRef = ssdo.spatialRef)
            ssdoPolygon.obtainData(requireGeometry = True)
            maskIdOutsideMaskPolygon = getIndices(ssdoPolygon.shapes, self.ssdo.xyCoords)

            refSSDO = ssdoPolygon
        else:
            refSSDO = ssdo

        #### Progressor for Extracting Presence Only Data from Rasters ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220411))

        ### Load data Using the whole AOI ###
        self.rasterNameList = [ i['name'] for i in self.rasterInfoList ]
        self.rasterPath = [ i["sourceData"] for i in self.rasterInfoList ]
        self.rasterType = [ i["rfType"] for i in self.rasterInfoList ]

        nRasters  = len(self.rasterNameList)
        #### Assure Unique/Valid Names ####
        self.rastNameOut = createAppendFieldNames(self.rasterNameList, outPath = outPath)

        self.hasRasterFeatures = True
        #### Create Correct Interpolate Type ####
        self.rasterTypeBool = []
        for i in self.rasterType:
            if i == "CATEGORICAL":
                self.rasterTypeBool.append(False)
            else:
                self.rasterTypeBool.append(True)

        self.rasterInfo = SF.RasterInfo(self.rasterPath, self.rasterTypeBool, ssdo = refSSDO, srfOutput = ssdo.spatialRef, printInfo = False)

        self.presenceData, indices = self.rasterInfo.extractDataUsingPoints(ssdo)
        self.maskIndicesPoints = None

        if maskIdOutsideMaskPolygon is not None:

            indexOrder = NUM.arange(self.ssdo.numObs)
            indicesOutPolygon = indexOrder[maskIdOutsideMaskPolygon]

            maskIndices = ~NUM.in1d(indices, indicesOutPolygon)
            indices = indices[maskIndices]

            msk = NUM.zeros(self.ssdo.numObs, dtype = bool)
            msk[indices] = True
            self.maskIndicesPoints = msk

            self.presenceData = self.presenceData[maskIndices]

            if len(self.presenceData) == 0:
                ARCPY.AddIDMessage("ERROR", 110452)
                cleanTempLayer(presencePolygon)
                raise SystemExit()

        #### Identify Null Raster Features ####
        self.validRast = NUM.zeros(ssdo.numObs, dtype = bool)
        self.validRast[indices] = True
        if ssdo.hasOID64:
            self.baseSourceIDs = NUM.ones(ssdo.numObs, dtype = NUM.int64) 
        else:
            self.baseSourceIDs = NUM.ones(ssdo.numObs, dtype = NUM.int32) 

        for i in range(self.ssdo.numObs):
            self.baseSourceIDs[i] = self.ssdo.order2Master[i]

        #### ID/Add Null Distances ####
        badIDs = NUM.nonzero(~self.validRast)[0]
        badSum = len(badIDs)
        if badSum:
            ARCPY.AddIDMessage("WARNING", 110419, badSum, self.ssdo.numObs) 
            self.baseSourceIDs = self.baseSourceIDs[self.validRast]

        indexValues = NUM.asarray(self.rasterInfo.getIndices(ssdo.xyCoords[indices]), dtype= NUM.int64)
        if len(indexValues) < 3:
            ARCPY.AddIDMessage("ERROR", 110454) 
            if useMaskParameter:
                cleanTempLayer(presencePolygon)
            raise SystemExit()

        self.presenceMask, counts = NUM.unique(indexValues, return_counts = True)

        initialData = NUM.array([], dtype= float).reshape(0,self.presenceData.shape[1])
        initialCoord= NUM.array([], dtype= float).reshape(0,2)
        initialIndice = NUM.array([], dtype= NUM.int64)

        self.useExtent = False
        if useMaskParameter:

            self.__checkConvexHullDimensions(self.rasterInfo.cellSize, refSSDO.shapes, 
                                             self.rasterInfo.extentIntersection, self.useConvexHull)

            noMaskentroids = False
            initialData, _ =self.rasterInfo.extractDataFromPolygonsExternalReprojection(ssdoPolygon, noMaskentroids)
            initialCoord = self.rasterInfo.centroids

            if len(initialCoord) < 3:
                ARCPY.AddIDMessage("ERROR", 110454) 
                cleanTempLayer(presencePolygon)
                raise SystemExit()

            initialData, initialCoord = self.__maskNulls(initialData, initialCoord)
            initialCoord = self.rasterInfo.reprojectForCoords(initialCoord, ssdoPolygon.spatialRef)
            initialIndice = NUM.asarray(self.rasterInfo.getIndices(initialCoord), dtype= NUM.int64)
        else:
            ### pre processing is used to calculate zones ###
            self.rasterInfo.preProcessZones()

            if self.rasterInfo.nCols*self.rasterInfo.nRows > thresholdMaxCellRasterExtent:
                ARCPY.AddIDMessage("ERROR", 110439, thresholdMaxCellRasterExtent) 
                raise SystemExit()

            self.useExtent = True

            for idZone, zone in enumerate(self.rasterInfo.rangeZones):
                dataBands, indicesCellWithData = self.rasterInfo.extractZone(idZone, False)
                coords = self.rasterInfo.centroidsOutput
                initialData = NUM.vstack((initialData,dataBands))
                initialCoord = NUM.vstack((initialCoord,coords))
                initialIndice  = NUM.hstack((initialIndice, indicesCellWithData))

        #self.dataForTrainedRaster = initialData
        #self.indicesForTrainedRaster = initialIndice

        self.globalMask = initialIndice
        mask = ~NUM.in1d(self.globalMask, self.presenceMask)
        self.absenceMask = mask
        self.coords = initialCoord
        self.data = initialData

        self.numPresence = len(indices)
        self.numAbsence = self.absenceMask.sum()
        
        if self.numPresence == 0 or self.numAbsence == 0:
            ARCPY.AddIDMessage("ERROR", 110440, self.numPresence, self.numAbsence) 
            cleanTempLayer(presencePolygon)
            raise SystemExit()

        self.n = self.numPresence + self.numAbsence
        cleanTempLayer(presencePolygon)

    def getBaseInfo(self):
        if self.ssdo.hasOID64:
            sourceIDs = NUM.ones(self.n, dtype = NUM.int64) * -9999
        else:
            sourceIDs = NUM.ones(self.n, dtype = NUM.int32) * -9999
        sourceIDs[0:self.numPresence] = self.baseSourceIDs

        #### Set Coord Dims ####
        dim = 2
        rawDim = 2

        if self.ssdo.useChordal:
            dim = 3

        if self.ssdo.hasZ:
            rawDim = 3

        coords = NUM.zeros((self.n, dim), dtype = float)
        rawCoords = NUM.zeros((self.n, rawDim), dtype = float)

        pCoords, pRawCoords = self.ssdo.getFeatureCoords()

        maskCoords = None
        if NUM.logical_not(self.validRast).sum() > 0:
            #### Mask indices outside of the polygon mask with the null values ####
            if self.maskIndicesPoints is not None:
                maskCoords = self.validRast*self.maskIndicesPoints
            else:
                maskCoords = self.validRast

        if maskCoords is not None:
            pCoords = pCoords[maskCoords]
            pRawCoords = pRawCoords[maskCoords]

        coords[0:self.numPresence] = pCoords[:,0:dim]
        rawCoords[0:self.numPresence] = pRawCoords[:,0:rawDim]

        if self.ssdo.useChordal:
            #### Get Spheroid coordinates of raster coordinates ####
            spheroidCoords = ARC._ss.lonlat_to_xy(self.coords,
                                           self.ssdo.spatialRef)
            coords[self.numPresence:] = spheroidCoords[self.absenceMask]
        else:
            coords[self.numPresence:] = self.coords[self.absenceMask]

        if self.ssdo.hasZ:
            rawCoords[self.numPresence:,0:2] = self.coords[self.absenceMask]
            rawCoords[self.numPresence:,2] = self.ssdo.defaultZ
        else:
            rawCoords[self.numPresence:] = self.coords[self.absenceMask]

        return sourceIDs, coords, rawCoords

    def getData(self, rasterIndex):
        if self.rasterTypeBool[rasterIndex]:
            data = NUM.zeros(self.n, dtype = float)
        else:
            data = NUM.zeros(self.n, dtype = NUM.int32)

        data[0:self.numPresence] = self.presenceData[:,rasterIndex]
        data[self.numPresence:] = self.data[:,rasterIndex][self.absenceMask]

        return data

    def getPresenceData(self):
        data = NUM.zeros(self.n, dtype = float)
        data[0:self.numPresence] = 1.0

        return data

class POPDataReporter(object):
    def __init__(self, trainPOPDO):
        self.trainPOPDO = trainPOPDO
        self.initialized = False
        self.predUniqueCatInfo = {}
        self.predMinMaxInfo = {}
        self.insideRangeCounts = []
        self.predIndVarNames = None
        self.predCatVarNames = None
        self.predCatAliases = None
        self.predCatTypes = None
        self.predIndAliases = None
        self.numOutsideRange = 0
        self.numObs = 0
        self.numOutsideCats = 0

    def addPredPOPDO(self, predPOPDO):
        self.numObs += predPOPDO.numObs
        includedInAnalysis = NUM.ones(predPOPDO.numObs, dtype = bool)
        if not self.initialized:
            self.predIndVarNames = [ i for i in predPOPDO.indVarNames ]
            self.outsideRangeCounts = [ 0 for i in predPOPDO.indVarNames ]
            self.predCatVarNames = [ i for i in predPOPDO.catVarNames ]
            self.predCatAliases = [ predPOPDO.catFields[i].alias for i in self.predCatVarNames ]
            self.predCatTypes = [ predPOPDO.catFields[i].type if hasattr(predPOPDO.catFields[i],"type") 
                                  else predPOPDO.catFields[i].fieldType  for i in self.predCatVarNames ]
            self.predIndAliases = [ predPOPDO.fields[i].alias for i in self.predIndVarNames ]
            self.predUniqueCatInfo = COPY.copy(predPOPDO.uniqueCatInfo)
            self.predMinMaxInfo = COPY.copy(predPOPDO.minMaxInfo)
            self.initialized = True

        if len(predPOPDO.indVarNames):
            #### Find Data Outside Training Range ####
            withinRange, counts = predPOPDO.withinRange(self.trainPOPDO)
            for ind, cnt in enumerate(counts):
                self.outsideRangeCounts[ind] += cnt
            self.numOutsideRange += (~withinRange).sum()
            includedInAnalysis = NUM.logical_and(includedInAnalysis, withinRange)

            #### Update Range Info ####
            if self.initialized:
                for varName, minMaxInfo in predPOPDO.minMaxInfo.items():
                    currentMin, currentMax = self.predMinMaxInfo[varName]
                    newMin, newMax = minMaxInfo
                    self.predMinMaxInfo[varName] = (min(newMin, currentMin), max(newMax, currentMax))

        if predPOPDO.hasCatVars:
            #### Find Bad Cats ####
            withinCats = predPOPDO.withinCats(self.trainPOPDO)
            self.numOutsideCats += (~withinCats).sum()
            includedInAnalysis = NUM.logical_and(includedInAnalysis, withinCats)

            #### Update Unique Cat Info ####
            if self.initialized:
                for varName, catInfo in predPOPDO.uniqueCatInfo.items():
                    currentUnique, currentCounts = predPOPDO.uniqueCatInfo[varName]
                    newUnique, newCounts = catInfo
                    comboInfo = combineUniqueInfo(currentUnique, currentCounts, newUnique, newCounts)
                    predPOPDO.uniqueCatInfo[varName] = comboInfo

        return includedInAnalysis

    def reportBadRecords(self, clamp = False):
        #### Report Pruned Records ####
        if self.numOutsideCats:
            if clamp:
                ARCPY.AddIDMessage("WARNING", 110420, self.numOutsideCats, self.numObs) 
            else:
                ARCPY.AddIDMessage("WARNING", 110421, self.numOutsideCats, self.numObs) 

        if self.numOutsideRange:
            if clamp:
                ARCPY.AddIDMessage("WARNING", 110422, self.numOutsideRange, self.numObs)
            else:
                ARCPY.AddIDMessage("WARNING", 110423, self.numOutsideRange, self.numObs)

    def reportBadCells(self, clamp = False):
        #### Report Pruned Records ####
        if self.numOutsideCats:
            if clamp:
                ARCPY.AddIDMessage("WARNING", 110424, self.numOutsideCats, self.numObs)
            else:
                ARCPY.AddIDMessage("WARNING", 110425, self.numOutsideCats, self.numObs)

        if self.numOutsideRange:
            if clamp:
                ARCPY.AddIDMessage("WARNING", 110426, self.numOutsideRange, self.numObs)
            else:
                ARCPY.AddIDMessage("WARNING", 110427, self.numOutsideRange, self.numObs)

    def reportTrainingFeaturesAndRaster(self, doThinning = False):

        if doThinning:
            featureMsg = ARCPY.GetIDMessage(220357)
        else:
            featureMsg = ARCPY.GetIDMessage(84752)

        header = ARCPY.GetIDMessage(84860)
        variableMsg = ARCPY.GetIDMessage(84068)
        trainingMsg =  ARCPY.GetIDMessage(84862)
        predictionMsg =  ARCPY.GetIDMessage(84863)
        maximumMsg = ARCPY.GetIDMessage(84413)
        minimumMsg = ARCPY.GetIDMessage(84412)
        outsideMsg = ARCPY.GetIDMessage(220358)
        rasterMsg = ARCPY.GetIDMessage(220359)

        headerColumns0 = ["@@none", UTILS.buildTableCell(trainingMsg, align = "left", colSpan=6), "@@none",
                          "@@none", "@@none", "@@none"]
        headerColumns1 = [UTILS.buildTableCell(variableMsg, rowSpan=2),
                          UTILS.buildTableCell(featureMsg, align = "left", colSpan=2), "@@none",
                          UTILS.buildTableCell(rasterMsg, align = "left", colSpan=3), "@@none",
                          "@@none"]
        headerColumns2 = ["@@none", UTILS.buildTableCell(minimumMsg, align = "right"), maximumMsg, 
                          UTILS.buildTableCell(minimumMsg, align = "right"), maximumMsg, outsideMsg]

        justify = ["left", "right", "right", "right", "right", "right"]
        listTable = []
        listTable.append(headerColumns0)
        listTable.append(headerColumns1)
        listTable.append(headerColumns2)
        countPercValStr = "{0} ({1})"

        for varInd, varMatchName in enumerate(self.predIndVarNames):
            trainVarName = self.trainPOPDO.indVarNames[varInd]
            trainMin, trainMax = self.trainPOPDO.minMaxInfo[trainVarName]
            predMin, predMax = self.predMinMaxInfo[varMatchName]
            outside = self.outsideRangeCounts[varInd]
            perc = UTILS.formatValue((outside/self.numObs) * 100, "%0.2f")
            countPercOut = countPercValStr.format(outside, perc)

            #### Add Data to Report ####
            #listTable.append([self.trainPOPDO.fields[trainVarName].alias, 
            listTable.append([trainVarName, 
                              UTILS.formatValue(trainMin, "%0.2f"), UTILS.formatValue(trainMax, "%0.2f"),
                              UTILS.formatValue(predMin, "%0.2f"), UTILS.formatValue(predMax, "%0.2f"),
                              countPercOut])

        outputReport = UTILS.outputTextTable(listTable, header = header, justify = justify, pad = 1, colPad = 3,
                                             titleFillToken = "-", returnHTMLMsg=True, force2Txt=False)

        return outputReport

    def reportPredictionFeaturesOrRaster(self, predType = "FEATURES"):

        variableMsg = ARCPY.GetIDMessage(220360)
        trainingMsg =  ARCPY.GetIDMessage(84862)
        predictionMsg =  ARCPY.GetIDMessage(84863)
        maximumMsg = ARCPY.GetIDMessage(84413)
        minimumMsg = ARCPY.GetIDMessage(84412)
        outsideMsg = ARCPY.GetIDMessage(220358)
        if predType == "FEATURES":
            typeMsg = ARCPY.GetIDMessage(84752)
        else:
            typeMsg = ARCPY.GetIDMessage(220359)

        headerColumns0 = ["@@none", UTILS.buildTableCell(predictionMsg, align = "left", colSpan=4), "@@none", "@@none"]
        headerColumns1 = [UTILS.buildTableCell(variableMsg, rowSpan=2),
                          UTILS.buildTableCell(typeMsg, align = "left", colSpan=3), "@@none", "@@none"]
        headerColumns2 = ["@@none", UTILS.buildTableCell(minimumMsg, align = "right"), maximumMsg, outsideMsg]

        justify = ["left", "right", "right", "right"]
        listTable = []
        listTable.append(headerColumns0)
        listTable.append(headerColumns1)
        listTable.append(headerColumns2)
        countPercValStr = "{0} ({1})"

        for varInd, varMatchName in enumerate(self.predIndVarNames):
            trainVarName = self.trainPOPDO.indVarNames[varInd]
            trainMin, trainMax = self.trainPOPDO.minMaxInfo[trainVarName]
            predMin, predMax = self.predMinMaxInfo[varMatchName]
            outside = self.outsideRangeCounts[varInd]
            perc = UTILS.formatValue((outside/self.numObs) * 100, "%0.2f")
            countPercOut = countPercValStr.format(outside, perc)

            #### Add Data to Report ####
            #listTable.append([self.predIndAliases[varInd], 
            listTable.append([varMatchName, 
                              UTILS.formatValue(predMin, "%0.2f"), UTILS.formatValue(predMax, "%0.2f"),
                              countPercOut])

        outputReport = UTILS.outputTextTable(listTable, justify = justify, pad = 1, colPad = 3,
                                             titleFillToken = "-", returnHTMLMsg=True, force2Txt=False)

        return outputReport

    def reportPredictionFeaturesAndRaster(self, rasterReporter):

        featureMsg = ARCPY.GetIDMessage(84752)
        variableMsg = ARCPY.GetIDMessage(220360)
        predictionMsg =  ARCPY.GetIDMessage(84863)
        maximumMsg = ARCPY.GetIDMessage(84413)
        minimumMsg = ARCPY.GetIDMessage(84412)
        outsideMsg = ARCPY.GetIDMessage(220358)
        rasterMsg = ARCPY.GetIDMessage(220359)

        headerColumns0 = ["@@none", UTILS.buildTableCell(predictionMsg, align = "left", colSpan=7), "@@none", "@@none",
                          "@@none", "@@none", "@@none"]
        headerColumns1 = [UTILS.buildTableCell(variableMsg, rowSpan=2),
                          UTILS.buildTableCell(featureMsg, align = "left", colSpan=3), "@@none", "@@none",
                          UTILS.buildTableCell(rasterMsg, align = "left", colSpan=3), "@@none", "@@none"]
        headerColumns2 = ["@@none", UTILS.buildTableCell(minimumMsg, align = "right"), maximumMsg, outsideMsg,
                          UTILS.buildTableCell(minimumMsg, align = "right"), maximumMsg, outsideMsg]

        justify = ["left", "right", "right", "right", "right", "right", "right"]
        listTable = []
        listTable.append(headerColumns0)
        listTable.append(headerColumns1)
        listTable.append(headerColumns2)
        countPercValStr = "{0} ({1})"

        for varInd, varMatchName in enumerate(self.predIndVarNames):
            trainVarName = self.trainPOPDO.indVarNames[varInd]
            trainMin, trainMax = self.trainPOPDO.minMaxInfo[trainVarName]
            predMin, predMax = self.predMinMaxInfo[varMatchName]
            rastVarName = rasterReporter.predIndVarNames[varInd]
            rastMin, rastMax = rasterReporter.predMinMaxInfo[rastVarName]

            outside = self.outsideRangeCounts[varInd]
            perc = UTILS.formatValue((outside/self.numObs) * 100, "%0.2f")
            countPercOut = countPercValStr.format(outside, perc)

            outsideRast = rasterReporter.outsideRangeCounts[varInd]
            percRast = UTILS.formatValue((outsideRast/rasterReporter.numObs) * 100, "%0.2f")
            countPercOutRast = countPercValStr.format(outsideRast, percRast)

            #### Add Data to Report ####
            #listTable.append([self.predIndAliases[varInd], 
            listTable.append([varMatchName, 
                              UTILS.formatValue(predMin, "%0.2f"), UTILS.formatValue(predMax, "%0.2f"),
                              countPercOut,
                              UTILS.formatValue(rastMin, "%0.2f"), UTILS.formatValue(rastMax, "%0.2f"),
                              countPercOutRast])

        outputReport = UTILS.outputTextTable(listTable, justify = justify, pad = 1, colPad = 3,
                                             titleFillToken = "-", returnHTMLMsg=True, force2Txt=False)

        return outputReport

    def reportTrainingFeaturesAndRasterCat(self, doThinning = False):

        header = ARCPY.GetIDMessage(220388)
        if doThinning:
            featureMsg = ARCPY.GetIDMessage(220357)
        else:
            featureMsg = ARCPY.GetIDMessage(84752)
        variableMsg = ARCPY.GetIDMessage(84068)
        trainingMsg = ARCPY.GetIDMessage(84862)
        catMsg = ARCPY.GetIDMessage(84818)
        countPercMsg = ARCPY.GetIDMessage(220361)
        rasterMsg = ARCPY.GetIDMessage(220359)

        headerColumns0 = ["@@none", UTILS.buildTableCell(trainingMsg, align = "left", colSpan=5), 
                          "@@none", "@@none", "@@none"]
        headerColumns1 = [UTILS.buildTableCell(variableMsg, rowSpan=2),
                          UTILS.buildTableCell(featureMsg, align = "left", colSpan=2), "@@none",
                          UTILS.buildTableCell(rasterMsg, align = "left", colSpan=2), "@@none"]
        headerColumns2 = ["@@none", UTILS.buildTableCell(catMsg, align = "left"), 
                          UTILS.buildTableCell(countPercMsg, align ="right"),
                          UTILS.buildTableCell(catMsg, align = "left"), 
                          UTILS.buildTableCell(countPercMsg, align ="right")]

        justify = ["left", "left", "right", "left", "right"]
        listTable = []
        listTable.append(headerColumns0)
        listTable.append(headerColumns1)
        listTable.append(headerColumns2)
        countPercValStr = "{0} ({1})"
        throwFoot1 = False
        throwFoot2 = False
        trainN = self.trainPOPDO.numObs
        predN = self.numObs
        footSymbol1 = ARCPY.GetIDMessage(220364)
        footSymbol2 = ARCPY.GetIDMessage(220365)

        for catInd, catMatchName in enumerate(self.predCatVarNames):
            trainCatName = self.trainPOPDO.catVarNames[catInd]
            trainCatField = self.trainPOPDO.catFields[trainCatName]
            strCatValue = strCatValueBool(trainCatField)

            trainUnique, trainCounts = self.trainPOPDO.uniqueCatInfo[trainCatName]
            predUnique, predCounts = self.predUniqueCatInfo[catMatchName]
            isIn = NUM.isin(trainUnique, predUnique)

            #### In Training ####
            c = 0
            for ind, value in enumerate(trainUnique):
                trainCount = trainCounts[ind]
                if isIn[ind]:
                    predCount = predCounts[NUM.where(predUnique == value)][0]
                else:
                    predCount = 0

                if strCatValue:
                    value = str(value)

                trainPerc = UTILS.formatValue((trainCount/trainN) * 100, "%0.2f")
                trainValue = countPercValStr.format(trainCount, trainPerc)
                if trainCount < 8:
                    value += footSymbol1
                    throwFoot1 = True

                predPerc = UTILS.formatValue((predCount/predN) * 100, "%0.2f")
                predValue = countPercValStr.format(predCount, predPerc)

                if not c:
                    row = [trainCatName, value, trainValue, value, predValue]
                    #row = [trainCatField.alias, value, trainValue, value, predValue]
                else:
                    row = ["", value, trainValue, value, predValue]

                listTable.append(row)
                c += 1

            #### In Prediction Only ####
            isIn = NUM.isin(predUnique, trainUnique)
            for ind, value in enumerate(predUnique):
                if not isIn[ind]:
                    throwFoot2 = True
                    if strCatValue:
                        value = str(value)
                    value += footSymbol2
                    predCount = predCounts[ind]
                    predPerc = UTILS.formatValue((predCount/predN) * 100, "%0.2f")
                    predValue = countPercValStr.format(predCount, predPerc)
                    row = ["", "", "", value, predValue]
                    listTable.append(row)

        footnote = None
        if throwFoot1:
            footnote = [ARCPY.GetIDMessage(220362)]
        if throwFoot2:
            if footnote is None:
                footnote = [ARCPY.GetIDMessage(220363)]
            else:
                footnote.append(ARCPY.GetIDMessage(220363))

        outputReport = UTILS.outputTextTable(listTable, header = header, justify = justify, pad = 1, colPad = 3,
                                             titleFillToken = "-", returnHTMLMsg=True, force2Txt=False,
                                             footnote = footnote)

        return outputReport

    def reportPredictionFeaturesOrRasterCat(self, predType = "FEATURES"):

        variableMsg = ARCPY.GetIDMessage(220360)
        predictionMsg =  ARCPY.GetIDMessage(84863)
        catMsg = ARCPY.GetIDMessage(84818)
        countPercMsg = ARCPY.GetIDMessage(220361) 
        if predType == "FEATURES":
            typeMsg = ARCPY.GetIDMessage(84752)
        else:
            typeMsg = ARCPY.GetIDMessage(220359)

        headerColumns0 = ["@@none", UTILS.buildTableCell(predictionMsg, align = "left", colSpan=3), "@@none"]
        headerColumns1 = [UTILS.buildTableCell(variableMsg, rowSpan=2),
                          UTILS.buildTableCell(typeMsg, align = "left", colSpan=2), "@@none"]
        headerColumns2 = ["@@none", UTILS.buildTableCell(catMsg, align = "left"), 
                          UTILS.buildTableCell(countPercMsg, align ="right")]

        justify = ["left", "left", "right"]
        listTable = []
        listTable.append(headerColumns0)
        listTable.append(headerColumns1)
        listTable.append(headerColumns2)
        countPercValStr = "{0} ({1})"
        throwFoot2 = False
        predN = self.numObs
        footSymbol2 = ARCPY.GetIDMessage(220365)

        for catInd, catMatchName in enumerate(self.predCatVarNames):
            trainCatName = self.trainPOPDO.catVarNames[catInd]
            trainCatField = self.trainPOPDO.catFields[trainCatName]
            strCatValue = strCatValueBool(trainCatField)

            trainUnique, trainCounts = self.trainPOPDO.uniqueCatInfo[trainCatName]
            predUnique, predCounts = self.predUniqueCatInfo[catMatchName]
            isIn = NUM.isin(trainUnique, predUnique)

            #### In Training ####
            c = 0
            for ind, value in enumerate(trainUnique):
                trainCount = trainCounts[ind]
                if isIn[ind]:
                    predCount = predCounts[NUM.where(predUnique == value)][0]
                else:
                    predCount = 0

                if strCatValue:
                    value = str(value)

                predPerc = UTILS.formatValue((predCount/predN) * 100, "%0.2f")
                predValue = countPercValStr.format(predCount, predPerc)

                if not c:
                    row = [catMatchName, value, predValue]
                    #row = [self.predCatAliases[catInd], value, predValue]
                else:
                    row = ["", value, predValue]

                listTable.append(row)
                c += 1

            #### In Prediction Features Only (Maybe in Raster Too) ####
            isIn = NUM.isin(predUnique, trainUnique)
            for ind, value in enumerate(predUnique):
                if not isIn[ind]:
                    throwFoot2 = True
                    value = str(value)
                    value += footSymbol2
                    predCount = predCounts[ind]
                    predPerc = UTILS.formatValue((predCount/predN) * 100, "%0.2f")
                    predValue = countPercValStr.format(predCount, predPerc)
                    row = ["", value, predValue]
                    listTable.append(row)

        footnote = None
        if throwFoot2:
            footnote = [ARCPY.GetIDMessage(220363)]

        outputReport = UTILS.outputTextTable(listTable, justify = justify, pad = 1, colPad = 3,
                                             titleFillToken = "-", returnHTMLMsg=True, force2Txt=False,
                                             footnote = footnote)

        return outputReport

    def reportPredictionFeaturesAndRasterCat(self, rasterReporter):

        featureMsg = ARCPY.GetIDMessage(84752)
        variableMsg = ARCPY.GetIDMessage(220360)
        predictionMsg =  ARCPY.GetIDMessage(84863)
        catMsg = ARCPY.GetIDMessage(84818)
        countPercMsg = ARCPY.GetIDMessage(220361) 
        rasterMsg = ARCPY.GetIDMessage(220359)

        headerColumns0 = ["@@none", UTILS.buildTableCell(predictionMsg, align = "left", colSpan=5), "@@none",
                          "@@none", "@@none"]
        headerColumns1 = [UTILS.buildTableCell(variableMsg, rowSpan=2),
                          UTILS.buildTableCell(featureMsg, align = "left", colSpan=2), "@@none",
                          UTILS.buildTableCell(rasterMsg, align = "left", colSpan=2), "@@none"]
        headerColumns2 = ["@@none", UTILS.buildTableCell(catMsg, align = "left"), 
                          UTILS.buildTableCell(countPercMsg, align ="right"),
                          UTILS.buildTableCell(catMsg, align = "left"), 
                          UTILS.buildTableCell(countPercMsg, align ="right")]

        justify = ["left", "left", "right", "left", "right"]
        listTable = []
        listTable.append(headerColumns0)
        listTable.append(headerColumns1)
        listTable.append(headerColumns2)
        countPercValStr = "{0} ({1})"
        predN = self.numObs
        rastN = rasterReporter.numObs
        throwFoot2 = False
        footSymbol2 = ARCPY.GetIDMessage(220365)

        for catInd, catMatchName in enumerate(self.predCatVarNames):
            trainCatName = self.trainPOPDO.catVarNames[catInd]
            trainCatField = self.trainPOPDO.catFields[trainCatName]
            strCatValue = strCatValueBool(trainCatField)
            trainUnique, trainCounts = self.trainPOPDO.uniqueCatInfo[trainCatName]
            predUnique, predCounts = self.predUniqueCatInfo[catMatchName]
            rastCatName = rasterReporter.predCatVarNames[catInd]
            rastUnique, rastCounts = rasterReporter.predUniqueCatInfo[rastCatName]
            isIn = NUM.isin(trainUnique, predUnique)
            isInRast = NUM.isin(trainUnique, rastUnique)

            #### In Training ####
            c = 0
            for ind, value in enumerate(trainUnique):
                trainCount = trainCounts[ind]
                if isIn[ind]:
                    predCount = predCounts[NUM.where(predUnique == value)][0]
                else:
                    predCount = 0

                if isInRast[ind]:
                    rastCount = rastCounts[NUM.where(rastUnique == value)][0]
                else:
                    rastCount = 0

                if strCatValue:
                    value = str(value)

                predPerc = UTILS.formatValue((predCount/predN) * 100, "%0.2f")
                predValue = countPercValStr.format(predCount, predPerc)

                rastPerc = UTILS.formatValue((rastCount/rastN) * 100, "%0.2f")
                rastValue = countPercValStr.format(rastCount, rastPerc)

                if not c:
                    row = [catMatchName, value, predValue, value, rastValue]
                    #row = [self.predCatAliases[catInd], value, predValue, value, rastValue]
                else:
                    row = ["", value, predValue, value, rastValue]

                listTable.append(row)
                c += 1

            #### In Prediction Features Only (Maybe in Raster Too) ####
            isIn = NUM.isin(predUnique, trainUnique)
            for ind, value in enumerate(predUnique):
                if not isIn[ind]:
                    throwFoot2 = True
                    inRast = NUM.where(rastUnique == value)[0]
                    addRast = False
                    if len(inRast):
                        addRast = True
                        rastCount = rastUnique[inRast[0]]
                        rastPerc = UTILS.formatValue((rastCount/rastN) * 100, "%0.2f")
                        rastValue = countPercValStr.format(rastCount, rastPerc)

                    if strCatValue:
                        value = str(value)

                    value += footSymbol2
                    predCount = predCounts[ind]
                    predPerc = UTILS.formatValue((predCount/predN) * 100, "%0.2f")
                    predValue = countPercValStr.format(predCount, predPerc)
                    if addRast:
                        row = ["", value, predValue, value, rastValue]
                    else:
                        row = ["", value, predValue, "", ""]
                    listTable.append(row)

            #### In Rasters Only ####
            isIn = NUM.isin(rastUnique, trainUnique)
            for ind, value in enumerate(rastUnique):
                if not isIn[ind]:
                    throwFoot2 = True
                    inFeatures = NUM.where(predUnique == value)[0]
                    if not len(inFeatures):
                        #### Only in Raster ####
                        if strCatValue:
                            value = str(value)

                        value += footSymbol2
                        rastCount = rastCounts[ind]
                        rastPerc = UTILS.formatValue((rastCount/rastN) * 100, "%0.2f")
                        rastValue = countPercValStr.format(rastCount, rastPerc)
                        row = ["", "", "", value, rastValue]
                        listTable.append(row)

        footnote = None
        if throwFoot2:
            footnote = [ARCPY.GetIDMessage(220363)]

        outputReport = UTILS.outputTextTable(listTable, justify = justify, pad = 1, colPad = 3,
                                             titleFillToken = "-", returnHTMLMsg=True, force2Txt=False,
                                             footnote = footnote)

        return outputReport

class POPDataObjectBase(object):

    def setProperty(self, propertyStr, value):
        setattr(self, propertyStr, value)

    def withinRange(self, trainPOPDO):

        counts = []
        includedInAnalysis = NUM.ones(self.numObs, dtype = bool)

        for varInd, varMatchName in enumerate(self.indVarNames):
            trainVarName = trainPOPDO.indVarNames[varInd]
            matchData = self.fields[varMatchName].data
            trainMin, trainMax = trainPOPDO.minMaxInfo[trainVarName]
            varRangeBool = NUM.logical_and(matchData >= trainMin, matchData <= trainMax)
            counts.append(self.numObs - varRangeBool.sum())
            includedInAnalysis = NUM.logical_and(includedInAnalysis, varRangeBool)

        return includedInAnalysis, counts

    def withinCats(self, trainPOPDO):
        includedInAnalysis = NUM.ones(self.numObs, dtype = bool)
        for fieldInd, trainFieldName in enumerate(trainPOPDO.catVarNames):
            predFieldName = self.catVarNames[fieldInd]
            predCatField = self.catFields[predFieldName]
            predData = predCatField.data
            trainUnique, trainCounts = trainPOPDO.uniqueCatInfo[trainFieldName]
            predUnique, predCounts = self.uniqueCatInfo[predFieldName]

            #### In Prediction Only ####
            isIn = NUM.isin(predUnique, trainUnique)
            for ind, value in enumerate(predUnique):
                if not isIn[ind]:
                    #### Add to Boolean Array for Possible Clamping ####
                    varBool = predData != value
                    includedInAnalysis = NUM.logical_and(includedInAnalysis, varBool)

        return includedInAnalysis

    def clamp(self, trainPOPDO):
        """Clamps data to prevent extrapolation."""

        #### Get Indices In Range ####
        includedInAnalysis, counts = self.withinRange(trainPOPDO)

        #### Report Pruned Records ####
        badIDs = NUM.nonzero(~includedInAnalysis)[0]
        badSum = len(badIDs)
        if badSum:
            ARCPY.AddIDMessage("WARNING", 110422, badSum, self.numObs) 
            self.prune(includedInAnalysis)

    def trainDataReport(self, doThinning = False):
        header = ARCPY.GetIDMessage(84860)
        if doThinning:
            featureMsg = ARCPY.GetIDMessage(220357)
        else:
            featureMsg = ARCPY.GetIDMessage(84752)
        variableMsg = ARCPY.GetIDMessage(84068)
        trainingMsg = ARCPY.GetIDMessage(84862)
        maximumMsg = ARCPY.GetIDMessage(84413)
        minimumMsg = ARCPY.GetIDMessage(84412)

        headerColumns0 = ["@@none", UTILS.buildTableCell(trainingMsg, align = "left", colSpan=3), "@@none"]
        headerColumns1 = [UTILS.buildTableCell(variableMsg, rowSpan=2),
                          UTILS.buildTableCell(featureMsg, align = "left", colSpan=2),
                          "@@none"]
        headerColumns2 = ["@@none", UTILS.buildTableCell(minimumMsg, align = "right"), maximumMsg]

        justify = ["left", "right", "right"]
        listTable = []
        listTable.append(headerColumns0)
        listTable.append(headerColumns1)
        listTable.append(headerColumns2)

        for indVarName in self.indVarNames:
            field = self.fields[indVarName]
            varNameOut = field.alias
            dataMin, dataMax = self.minMaxInfo[indVarName]
            listTable.append([indVarName, UTILS.formatValue(dataMin, "%0.2f"), UTILS.formatValue(dataMax, "%0.2f")])
            #listTable.append([varNameOut, UTILS.formatValue(dataMin, "%0.2f"), UTILS.formatValue(dataMax, "%0.2f")])

        outputReport = UTILS.outputTextTable(listTable, header = header, justify = justify, pad = 1, colPad = 3,
                                             titleFillToken = "-", returnHTMLMsg=True, force2Txt=False)

        return outputReport

    def trainCatReport(self, doThinning = False):
        header = ARCPY.GetIDMessage(220388)
        if doThinning:
            featureMsg = ARCPY.GetIDMessage(220357)
        else:
            featureMsg = ARCPY.GetIDMessage(84752)
        variableMsg = ARCPY.GetIDMessage(84068)
        trainingMsg = ARCPY.GetIDMessage(84862)
        catMsg = ARCPY.GetIDMessage(84818)
        countPercMsg = ARCPY.GetIDMessage(220361) 

        headerColumns0 = ["@@none", UTILS.buildTableCell(trainingMsg, align = "left", colSpan=3), "@@none"]
        headerColumns1 = [UTILS.buildTableCell(variableMsg, rowSpan=2),
                          UTILS.buildTableCell(featureMsg, align = "left", colSpan=2),
                          "@@none"]
        headerColumns2 = ["@@none", UTILS.buildTableCell(catMsg, align = "left"), 
                          UTILS.buildTableCell(countPercMsg, align ="right")]

        justify = ["left", "left", "right"]
        listTable = []
        listTable.append(headerColumns0)
        listTable.append(headerColumns1)
        listTable.append(headerColumns2)
        countPercValStr = "{0} ({1})"
        footSymbol1 = ARCPY.GetIDMessage(220364)
        throwFoot1 = False

        for fieldName, fieldItem in self.catFields.items():
            catField = self.catFields[fieldName]
            strCatValue = strCatValueBool(catField)

            unique, counts = self.uniqueCatInfo[fieldName]
            numRows = len(unique)
            c = 0
            for ind, value in enumerate(unique):
                cnt = counts[ind]
                addStar = False
                if cnt < 8:
                    throwFoot1 = True
                    addStar = True
                perc = UTILS.formatValue((cnt/self.numObs) * 100, "%0.2f")
                count = str(cnt)
                countPercOut = countPercValStr.format(count, perc)
                if strCatValue:
                    value = str(value)

                if addStar:
                    value += footSymbol1
                if not c:
                    row = [UTILS.buildTableCell(fieldName, align = "left", rowSpan = numRows), value, countPercOut]
                    #row = [UTILS.buildTableCell(catField.alias, align = "left", rowSpan = numRows), value, countPercOut]
                else:
                    row = ["@@none", value, UTILS.buildTableCell(countPercOut, align ="right")]

                listTable.append(row)
                c += 1

        if throwFoot1:
            footnote = [ARCPY.GetIDMessage(220362)]
        else:
            footnote = None

        outputReport = UTILS.outputTextTable(listTable, header = header, justify = justify, pad = 1, colPad = 3,
                                             titleFillToken = "-", returnHTMLMsg=True, force2Txt=False,
                                             footnote = footnote)

        return outputReport




class POPDataObject(POPDataObjectBase):
    def __init__(self, sourceIDs, coords, rawCoords, spatialRef, train = True):
        UTILS.assignClassAttr(self, locals())
        self.numObs = len(coords)
        self.orderIDs = NUM.arange(self.numObs, dtype = NUM.int32)
        self.fields = {}
        self.catFields = {}
        self.uniqueCatInfo = {}
        self.minMaxInfo = {}
        self.depVarName = None
        self.indVarNames = []
        self.catVarNames = []
        self.hasDistanceFeatures = False
        self.hasRasterFeatures = False
        self.hasCatVars = False

        if self.train:
            self.minNumObs = 5
        else:
            self.minNumObs = 1

    def addCatVar(self, varName, data, alias = None, variableSource = None):
        self.hasCatVars = True
        varUpper = varName.upper()
        self.catVarNames.append(varUpper)

        if alias is None:
            alias = varName

        #### Get Data Type ####
        arrayType = data.dtype
        try:
            outType = UTILS.numpyDtypeConvert[arrayType]
        except KeyError:
            if arrayType.str.count("<U"):
                outType = "TEXT"
            else:
                ARCPY.AddIDMessage("ERROR", 110428, varName) 
                raise SystemExit()

        if outType == "DOUBLE":
            data = NUM.array(data, dtype = NUM.int32)
            outType = "LONG"

        if outType not in ["LONG", "TEXT", "BIGINTEGER"]:
            ARCPY.AddIDMessage("ERROR", 110429, varName) 
            raise SystemExit()

        self.catFields[varUpper] = SSDO.CandidateField(varUpper, outType, data = data, alias = alias)
        self.catFields[varUpper].variableSource = variableSource
        self.catFields[varUpper].realFieldType = outType
        self.uniqueCatInfo[varUpper] = NUM.unique(data, return_counts = True)

    def addSSDOCatFields(self, ssdo, catVarNames = []):

        #### Add Ind Vars ####
        for catVarName in catVarNames:
            indField = ssdo.fields[catVarName.upper()]
            self.addCatVar(catVarName.upper(), indField.data, alias = indField.alias, variableSource = "FC")

    def addVar(self, varName, data, alias = None, isDepVar = False, variableSource = None, realFieldType = None):
        varUpper = varName.upper()
        if isDepVar:
            self.depVarName = varUpper
        else:
            self.indVarNames.append(varUpper)

        if alias is None:
            alias = varName

        if realFieldType is None:
            realFieldType = "DOUBLE"

        self.fields[varUpper] = SSDO.CandidateField(varUpper, "DOUBLE", data = data, alias = alias)
        self.fields[varUpper].realFieldType = realFieldType
        self.fields[varUpper].variableSource = variableSource

    def addSSDOFields(self, ssdo, indVarNames = [], depVarName = None):
        #### Add Dep Var ####
        if depVarName is not None:
            depField = ssdo.fields[depVarName.upper()]
            self.addVar(depVarName.upper(), depField.returnDouble(), alias = depField.alias, isDepVar = True, variableSource = None, realFieldType = depField.type)

        #### Add Ind Vars ####
        for indVarName in indVarNames:
            indField = ssdo.fields[indVarName.upper()]
            self.addVar(indVarName.upper(), indField.returnDouble(), alias = indField.alias, variableSource = "FC", realFieldType = indField.type)  

    def addDistanceFeatures(self, ssdo, distanceFeatures, outPath = None, unit = None):

        self.hasDistanceFeatures = True
        self.outDistancesNames = []
        df = WU.DistanceFeatures(ssdo, unit, forceNear = True)
        for fc in distanceFeatures:
            df.addFeatures(fc)

        #### Use Outpath for Prediction and ssdo.templateFC for Training ####
        if outPath is None:
            outPath = ssdo.templateFC

        #### Assure Unique/Valid Names ####
        distNameOut = createAppendFieldNames(df.names, candidateFields = self.fields)

        #### Identify Null Distance Features ####
        self.validDist = NUM.ones(ssdo.numObs, dtype = bool)

        for distInd, distName in enumerate(df.names):
            data = df.distances[distName]

            #### Add Invalid Distances ####
            self.validDist[data < 0] = False
            self.outDistancesNames.append(distNameOut[distInd])
            self.addVar(distNameOut[distInd], data, alias = distName, variableSource = "DIST")

    def addRasterFeatures(self, ssdo, rasterList, outPath = None, trainRasterInfoList = None):
        self.hasRasterFeatures = True

        #### Use Outpath for Prediction and ssdo.templateFC for Training ####
        if outPath is None:
            outPath = ssdo.templateFC

        #### Get Raster Info ####
        if trainRasterInfoList is None:
            #### Training with Categorical Flags ####
            self.rasterInfoList = getRasterInfoList(rasterList)
        else:
            #### Raster Match w/ Training PPDO ####
            self.rasterInfoList = getPredRasterInfoList(rasterList, trainRasterInfoList)

        rasterList = [ i['name'] for i in self.rasterInfoList ]
        rasterPath = [ i["sourceData"] for i in self.rasterInfoList ]
        rasterType = [ i["rfType"] for i in self.rasterInfoList ]

        #### Get Raster X Columns ####
        rInfo = SF.RasterInfo(rasterPath,[True]*len(rasterPath), ssdo = ssdo, srfOutput = ssdo.spatialRef, printInfo= False)
        rInfo.preProcessZones()
        x, indices = rInfo.extractDataUsingPoints(ssdo)

        #### Identify Null Raster Features ####
        self.validRast = NUM.zeros(ssdo.numObs, dtype = bool)
        self.validRast[indices] = True

        #### Add to IndVars ####
        for rastInd, rastName in enumerate(rasterList):
            rType = rasterType[rastInd]
            if rType.upper() == "CATEGORICAL":
                data = NUM.ones(ssdo.numObs, dtype = NUM.int64) * -99999
                data[indices] = x[:,rastInd]
                self.addCatVar(rastName, data, alias = rasterList[rastInd], variableSource = "RASTER")
            else:
                data = NUM.ones(ssdo.numObs, dtype = float) * NUM.nan
                data[indices] = x[:,rastInd]
                self.addVar(rastName, data, alias = rasterList[rastInd], variableSource  = "RASTER")

    def addRasterFeaturesPredictPresenceOnly(self, ssdo, predRasterInfo, outputFC):
        self.hasRasterFeatures = True

        rasterList = predRasterInfo.rasterNameList
        rasterPath = predRasterInfo.rasterPath
        rasterType = predRasterInfo.rasterType

        #### Assure Unique/Valid Names ####
        rastNameOut = predRasterInfo.getOutputRasterFieldNames(outputFC)

        #### Get Raster X Columns ####
        rInfo = predRasterInfo.rasterInfo
        rInfo.preProcessZones()
        x, indices = rInfo.extractDataUsingPoints(ssdo)

        #### Identify Null Raster Features ####
        self.validRast = NUM.zeros(ssdo.numObs, dtype = bool)
        self.validRast[indices] = True

        #### Add to IndVars ####
        for rastInd, rastName in enumerate(rastNameOut):
            rType = rasterType[rastInd]
            if rType == "CATEGORICAL":
                data = NUM.ones(ssdo.numObs, dtype = NUM.int64) * -99999
                data[indices] = x[:,rastInd]
                self.addCatVar(rastName, data, alias = rasterList[rastInd], variableSource = "RASTER")
            else:
                data = NUM.ones(ssdo.numObs, dtype = float) * NUM.nan
                data[indices] = x[:,rastInd]
                self.addVar(rastName, data, alias = rasterList[rastInd], variableSource = "RASTER")

    def addRastersForPredict(self, rInfo, idZone,  rasterList, rastNameOut, rasterType ):

        dataBands, indicesCellWithData = rInfo.extractZone(idZone, False)
        coords = rInfo.centroidsOutput

        if dataBands is not None:
            if len(dataBands) == 0:
                return None

        ##sourceIDs, coords, rawCoords
        self.coords = coords
        self.rawCoords = coords

        self.numObs = len(coords)

        #### Add to IndVars ####
        for rastInd, rastName in enumerate(rastNameOut):
            rType = rasterType[rastInd]
            if rType.upper() == "CATEGORICAL":
                self.addCatVar(rastName, dataBands.T[rastInd], alias = rasterList[rastInd], variableSource = "RASTER")
            else:
                self.addVar(rastName, dataBands.T[rastInd], alias = rasterList[rastInd], variableSource = "RASTER")
        return indicesCellWithData

    def addTrainingRastersForPredict(self, presenceOnly):

        dataBands = presenceOnly.data
        coords = presenceOnly.coords

        self.numObs = len(coords)

        #### Add to IndVars ####
        for rastInd, rastName in enumerate(presenceOnly.rastNameOut):
            rType = presenceOnly.rasterType[rastInd]
            if rType == "CATEGORICAL":
                self.addCatVar(rastName, dataBands.T[rastInd], alias = presenceOnly.rasterList[rastInd], variableSource = "RASTER")
            else:
                self.addVar(rastName, dataBands.T[rastInd], alias = presenceOnly.rasterList[rastInd], variableSource = "RASTER")

    def addRasters(self, presenceOnly):
        self.hasRasterFeatures = True

        #### Create Dependent Variable ####
        yData = presenceOnly.getPresenceData()
        self.addVar("PRESENT", yData, isDepVar = True)
        self.rasterTrainColIndexer = {}

        #### Add to IndVars ####
        for rastInd, rastName in enumerate(presenceOnly.rastNameOut):
            self.rasterTrainColIndexer[rastName] = rastInd
            rType = presenceOnly.rasterType[rastInd]
            data = presenceOnly.getData(rastInd)
            if rType == "CATEGORICAL":
                self.addCatVar(rastName, data, alias = presenceOnly.rasterNameList[rastInd], variableSource = "RASTER")
            else:
                self.addVar(rastName, data, alias = presenceOnly.rasterNameList[rastInd], variableSource = "RASTER")

    def pruneBadRows(self):
        if self.hasDistanceFeatures or self.hasRasterFeatures:
            includedInAnalysis = NUM.ones(self.numObs, dtype = bool)

            if self.hasDistanceFeatures:
                #### ID/Add Null Distances ####
                badIDs = NUM.nonzero(~self.validDist)[0]
                badSum = len(badIDs)
                if badSum:
                    includedInAnalysis = NUM.logical_and(includedInAnalysis, self.validDist)
                    ARCPY.AddIDMessage("WARNING", 110430, badSum, self.numObs) 

            if self.hasRasterFeatures:
                #### ID/Add Null Distances ####
                badIDs = NUM.nonzero(~self.validRast)[0]
                badSum = len(badIDs)
                if badSum:
                    includedInAnalysis = NUM.logical_and(includedInAnalysis, self.validRast)
                    ARCPY.AddIDMessage("WARNING", 110431, badSum, self.numObs) 

            #### Clip All Info ####
            self.prune(includedInAnalysis)

    def thin(self, ssdo, thinDist, thinIter, resampleCoords= None):
        yData = self.fields[self.depVarName].data
        presenceBool = NUM.asarray(yData, dtype = bool)
        thin = THIN.PoPThinning(ssdo, thinDist, thinIter, resampleCoords)
        includedInAnalysis = thin.thinTrainingFeatures(self.coords, presenceBool)
        self.prune(includedInAnalysis)

    def prune(self, includedInAnalysis):
        self.numObs = includedInAnalysis.sum()

        #### Fail Out if Not Records Left ####
        if self.numObs < self.minNumObs:
            if self.train:
                ARCPY.AddIDMessage("ERROR", 110432, self.minNumObs)
            else:
                ARCPY.AddIDMessage("ERROR", 110433, self.minNumObs)

            raise SystemExit()

        self.sourceIDs = self.sourceIDs[includedInAnalysis]
        self.orderIDs = self.orderIDs[includedInAnalysis]
        self.coords = self.coords[includedInAnalysis]
        self.rawCoords = self.rawCoords[includedInAnalysis]

        for fieldName, fieldItem in self.fields.items():
            fieldItem.data = fieldItem.data[includedInAnalysis]

        for fieldName, fieldItem in self.catFields.items():
            fieldItem.data = fieldItem.data[includedInAnalysis]

    def finalizeRangeInfo(self):

        for indVarName in self.indVarNames:
            field = self.fields[indVarName]
            dataMin = field.data.min()
            dataMax = field.data.max()
            self.minMaxInfo[indVarName] = (dataMin, dataMax)

    def finalizeCatInfo(self, train = True):
        if self.hasCatVars:
            warnSparseCats = []
            errorSparseCats = []
            for fieldName, fieldItem in self.catFields.items():
                data = fieldItem.data
                unique, counts = NUM.unique(data, return_counts = True)
                self.uniqueCatInfo[fieldName] = (unique, counts)
                minCount = counts.min()
                if minCount < 2:
                    errorSparseCats.append(fieldItem.alias)
                else:
                    if minCount < 8:
                        warnSparseCats.append(fieldItem.alias)

            if train:
                if len(errorSparseCats):
                    ARCPY.AddIDMessage("ERROR", 110434, ", ".join(list(map(str, errorSparseCats)))) 
                    raise SystemExit()

                if len(warnSparseCats):
                    ARCPY.AddIDMessage("WARNING", 110435, ", ".join(list(map(str, warnSparseCats)))) 


def maxentLinkFun(yHatRaw, linkFun = None, entropy = 0.0, alpha = 0.0):
    with WARN.catch_warnings():
        WARN.simplefilter(action='ignore', category=RuntimeWarning)
        yHatRaw += alpha
        if linkFun == None:
            yHat = yHatRaw
        elif linkFun.upper() == 'EXPONENTIAL':
            yHat = NUM.exp(yHatRaw)
        elif linkFun.upper() == 'CLOGLOG':
            yHat = 1-NUM.exp(-NUM.exp(entropy + yHatRaw))
        elif linkFun.upper() == 'LOGISTIC':
            yHat = 1/(1+NUM.exp(-(entropy + yHatRaw)))

        return yHat

def simpleCVInfo(y, yHat, cutoff = .5):
    """Simple Binary Confusion Metrics."""
    diff1 = 0
    diff0 = 0
    count0 = 0
    count1 = 0
    n = len(y)
    for i in range(n):
        if y[i] == 1:
            count1 += 1
            if yHat[i] < cutoff:
                diff1 += 1
        else:
            count0 += 1
            if yHat[i] >= cutoff:
                diff0 += 1

    return n, count0, diff0, count1, diff1

def getVarOrder(coeff, ja, jaOrder):
    ## Define Non-Zero Output Columns
    varOrder=ja[jaOrder]
    ## Update Variable Order for Zero Coefficients
    varOrder = varOrder[coeff!=0].astype('int32')
    ## Discard Zero Betas
    coeff = coeff[coeff!=0]

    return coeff, varOrder

def def_reg(p, m, basisType, startIndex):
    lqpreg = basisTables[basisType]

    #### Reduce m to just presence locations ####
    mm = m[p==1]
    p_obs = mm.shape[0]

class ModelMatrix(object):
    def __init__(self, popdo, basisTypes = ['linear'], numKnots = 10, includedInAnalysis = None, intercept = False, modelInfo = None):
    
        if modelInfo is not None:
            self.popdo = popdo
            self.initModelObj(modelInfo)
            return
    
        #### Progressor for Basis Funs and Model Matrix ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220410))

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Set Y/X Info ####
        self.depVarName = self.popdo.depVarName
        self.indVarNames = self.popdo.indVarNames

        if self.popdo.hasCatVars:
            self.catVarNames = self.popdo.catVarNames
        else:
            self.catVarNames = []

        #### Check for exclusively 0 or 1 ####
        yData = self.popdo.fields[self.depVarName].data
        if not NUM.isin(yData, [0, 1]).all():
            ARCPY.AddIDMessage("ERROR", 110448)
            raise SystemExit()

        #### Assure At Least Two Presence/Background Points ####
        yOneBool = (yData == 1).sum() > 1
        yZeroBool = (yData == 0).sum() > 1
        if not (yOneBool and yZeroBool):
            ARCPY.AddIDMessage("ERROR", 110454)
            raise SystemExit()

        self.y = NUM.empty((self.popdo.numObs, 1), dtype = float)
        self.y[:,0] = yData
        self.isSubset = self.includedInAnalysis is not None
        self.origNumObs = self.popdo.numObs
        
        if self.isSubset:
            self.numObs = self.includedInAnalysis.sum()
            self.y = self.y[self.includedInAnalysis]
        else:
            self.numObs = self.popdo.numObs

        #### Check Variance ####
        self.checkVariance()

        #### Get Basis Type indices ####
        self.basisIndices = [basis2Index[basisType] for basisType in basisTypes]

        #### Get Presence Info ####
        self.presence = self.y.ravel() == 1
        self.numPresence = self.presence.sum()
        self.sqrtNP = NUM.sqrt(self.numPresence)

        #### Include Presence Points as Background ####
        self.dataTrainX = []
        self.dataTrainY = []
        self.presenceTrain = []
        self.addPresence2Background()

        #### Set Base X Matrix ####
        self.numBaseVars = len(self.indVarNames)
        self.labels = []
        self.shortLabels = []
        if self.intercept:
            self.labels += [ARCPY.GetIDMessage(84064)]
            self.shortLabels += ["INTERCEPT"]

        #### Set Basis Types ####
        self.hasLinear = 0 in self.basisIndices
        self.hasQuadratic = 1 in self.basisIndices
        self.hasProduct = 2 in self.basisIndices
        self.hasHinge = 3 in self.basisIndices
        self.hasThreshold = 4 in self.basisIndices
        self.hasCategorical = self.popdo.hasCatVars
        self.linearSize = 0
        self.quadraticSize = 0
        self.productSize = 0
        self.hingeSize = 0
        self.thresholdSize = 0
        self.categoricalSize = 0

        if self.hasLinear:
            self.buildLinear()
        if self.hasQuadratic:
            self.buildQuadratic()
        if self.hasProduct:
            self.buildProduct()
        if self.hasHinge:
            self.buildHinge()
        if self.hasThreshold:
            self.buildThreshold()
        if self.hasCategorical:
            self.buildCategorical()

        #### Build Final X Matrix ####
        self.buildX()

    def initModelObj(self, modelInfo):
        #### Initialize Object using model variables ####

        for ele in modelInfo:
            setattr(self, ele, modelInfo[ele])

        self.depVarName = self.popdo.depVarName
        self.indVarNames = self.popdo.indVarNames

        if self.popdo.hasCatVars:
            self.catVarNames = self.popdo.catVarNames
        else:
            self.catVarNames = []

    def getParameters(self):
        #### Get variables to store in the Model ###

        glbVars =  { "hasLinear": self.hasLinear,
                 "hasQuadratic":self.hasQuadratic,
                 "hasProduct":self.hasProduct,
                 "hasHinge":self.hasHinge,
                 "hasThreshold":self.hasThreshold,
                 "hasCategorical":self.hasCategorical
                }

        listVariables = ["varInds","penalties","shortLabels","basisIndices",
                         "categoricalVarInds", "catSearchValues",
                         "numKnots","knotValues","hingeBlock",
                         "maxX","minX","intercept","startProduct",
                         "productSize","labels","hingeSize","startHinge",
                         "hingeSize","startThreshold","thresholdSize",
                         "startCategorical","categoricalSize"] #"numPresence"

        for var in listVariables:
            if hasattr(self, var):
                glbVars[var] = eval(fr"self.{var}")

        return glbVars

    def addPresence2Background(self):
        #### Append X variables for Presence as Background ####
        for ind, varName in enumerate(self.indVarNames):
            if self.isSubset:
                dataX = self.popdo.fields[varName].data[self.includedInAnalysis]
            else:
                dataX = self.popdo.fields[varName].data

            self.dataTrainX.append(NUM.append(dataX, dataX[self.presence], axis=0))
        #### Define Background Labels for Presnce and Append ####
        self.dataTrainY = NUM.append(self.y, NUM.zeros((self.numPresence, 1)))
        #### Extend the Boolean Array ####
        self.presenceTrain = NUM.append(self.presence, NUM.array(([False]*self.numPresence)))

    def checkVariance(self):

        #### Assure that Variance is Larger than Zero ####

        #### Error for Presence Indicator Field ####
        yVar = NUM.var(self.y)
        if NUM.isnan(yVar) or yVar <= 0.0:
            ARCPY.AddIDMessage("ERROR", 110447, self.depVarName)
            raise SystemExit()

        #### Error for Constant Explanatory Variables ####
        zeroVarFields = []
        for column, variable in enumerate(self.indVarNames):
            varData = self.popdo.fields[variable].data
            if varData.var() <= 0.0:
                zeroVarFields.append(variable)

        if len(zeroVarFields):
            zeroNames = ", ".join(zeroVarFields)
            ARCPY.AddIDMessage("ERROR", 1588, zeroNames)
            raise SystemExit()

    def buildX(self):
        self.numColumns = self.linearSize + self.categoricalSize + self.hingeSize 
        self.numColumns += self.thresholdSize + self.productSize + self.quadraticSize 

        startIndex = 0
        if self.intercept:
            self.numColumns += 1
            startIndex += 1

        self.x = NUM.ones((self.numObs + self.numPresence, self.numColumns), dtype = float)

        self.penalties = NUM.zeros(self.numColumns, dtype = float)
        self.varInds = NUM.ones((2,self.numColumns), dtype = NUM.int32) * -1

        if self.hasLinear:
            self.startLinear = startIndex + 0
            self.x[:,startIndex:startIndex + self.linearSize] = self.linearX
            self.penalties[startIndex:startIndex + self.linearSize] = self.linearPenalty
            self.varInds[0,startIndex:startIndex + self.linearSize] = self.linearVarInds
            startIndex += self.linearSize

        if self.hasQuadratic:
            self.startQuadratic = startIndex + 0
            self.x[:,startIndex:startIndex + self.quadraticSize] = self.quadraticX
            self.penalties[startIndex:startIndex + self.quadraticSize] = self.quadraticPenalty
            self.varInds[0,startIndex:startIndex + self.quadraticSize] = self.quadraticVarInds
            startIndex += self.quadraticSize

        if self.hasProduct:
            self.startProduct = startIndex + 0
            self.x[:,startIndex:startIndex + self.productSize] = self.productX
            self.penalties[startIndex:startIndex + self.productSize] = self.productPenalty
            self.varInds[:,startIndex:startIndex + self.productSize] = self.productVarInds
            startIndex += self.productSize

        if self.hasHinge:
            self.startHinge = startIndex + 0
            self.x[:,startIndex:startIndex + self.hingeSize] = self.hingeX
            self.penalties[startIndex:startIndex + self.hingeSize] = self.hingePenalty
            self.varInds[0,startIndex:startIndex + self.hingeSize] = self.hingeVarInds
            startIndex += self.hingeSize

        if self.hasThreshold:
            self.startThreshold = startIndex + 0
            self.x[:,startIndex:startIndex + self.thresholdSize] = self.thresholdX
            self.penalties[startIndex:startIndex + self.thresholdSize] = self.thresholdPenalty
            self.varInds[0,startIndex:startIndex + self.thresholdSize] = self.thresholdVarInds
            startIndex += self.thresholdSize

        if self.hasCategorical:
            self.startCategorical = startIndex + 0
            self.x[:,startIndex:startIndex + self.categoricalSize] = self.categoricalX
            self.penalties[startIndex:startIndex + self.categoricalSize] = self.categoricalPenalty
            self.varInds[0,startIndex:startIndex + self.categoricalSize] = self.categoricalVarInds
            startIndex += self.categoricalSize

    def buildLinear(self):
        #### Default Reg Start ####
        xp, fp = basisTables['linear']
        basePenalty = NUM.interp(x = self.numPresence, xp = xp, fp = fp) / self.sqrtNP

        self.linearX = NUM.zeros((self.numObs + self.numPresence, self.numBaseVars), dtype = float)

        self.linearPenalties = NUM.zeros(self.numBaseVars, dtype = float)
        self.linearLabels = [i for i in self.indVarNames]
        self.linearVarInds = NUM.arange(self.numBaseVars, dtype = NUM.int32)
        shortLabel = 'L{0}'
        for ind, varName in enumerate(self.indVarNames):
            self.linearX[:,ind] = self.dataTrainX[ind]
            #### Add Labels ####
            self.labels.append(varName)
            self.shortLabels.append(shortLabel.format(ind))

        #### Linear Penalty ####
        mm = self.linearX[self.presenceTrain] 
        pen = basePenalty * mm.std(0, ddof = 1)
        self.linearPenalty = NUM.maximum(0.001 * (self.linearX.max(0) - self.linearX.min(0)), pen)
        self.linearSize = self.linearX.shape[1]

    def buildHinge(self):
        #### Default Reg Start ####
        xp, fp = basisTables['hinge']
        basePenalty = NUM.interp(x = self.numPresence, xp = xp, fp = fp) / self.sqrtNP
        
        #### Number of Vars * Number of Knots ####
        k = 2 * (self.numKnots - 1) * self.numBaseVars
        
        self.hingeLabels = []

        #### Build X ####
        self.hingeX = NUM.zeros((self.numObs + self.numPresence, k), dtype = float)

        #### Store X Info For Prediction/ CV ####
        self.minX = NUM.zeros(self.numBaseVars, dtype = float)
        self.maxX = NUM.zeros(self.numBaseVars, dtype = float)
        self.knotValues = NUM.zeros(k, dtype = float)
        self.hingeVarInds = NUM.zeros(k, dtype = NUM.int32)

        #### Threshold/Hinge Columns ####
        startIndex = 0
        shortLabel = 'H{0}'
        baseLabel = ARCPY.GetIDMessage(220412) + '({0}, {1})'
        hingeBlock = 2 * (self.numKnots - 1)
        for ind, varName in enumerate(self.indVarNames):
            data = self.dataTrainX[ind]
            basisData, knotValues, minX, maxX = STATS.hingeInfo(data, nKnots = self.numKnots)
            self.hingeX[:,startIndex:startIndex+hingeBlock] = basisData
            self.knotValues[startIndex:startIndex+hingeBlock] = knotValues
            self.minX[ind] = minX
            self.maxX[ind] = maxX
            self.hingeVarInds[startIndex:startIndex+hingeBlock] = ind

            #### Add Labels ####
            self.labels += [baseLabel.format(varName, i) for i in range(hingeBlock)]
            self.shortLabels += [shortLabel.format(i) for i in range(startIndex,startIndex+hingeBlock)]

            #### Increase Hinge Start Index ####
            startIndex += hingeBlock
        
        #### Hinge Penalty ####
        mm = self.hingeX[self.presenceTrain] 
        hingeP = NUM.maximum(mm.std(0, ddof = 1), 1 / self.sqrtNP)*0.5 / self.sqrtNP
        pen = basePenalty * mm.std(0, ddof = 1)
        self.hingePenalty = NUM.maximum(NUM.maximum(0.001 * (self.hingeX.max(0) - self.hingeX.min(0)), hingeP), pen)
        self.hingeSize = self.hingeX.shape[1]
        self.hingeBlock = hingeBlock

    def buildThreshold(self):
        #### Default Reg Start ####
        xp, fp = basisTables['threshold']
        basePenalty = NUM.interp(x = self.numPresence, xp = xp, fp = fp) / self.sqrtNP
        
        #### Number of Vars * Number of Knots ####
        k = self.numKnots * self.numBaseVars
        self.thresholdLabels = []

        #### Build X ####
        self.thresholdX = NUM.zeros((self.numObs + self.numPresence, k), dtype = float)

        self.thresholdPenalties = NUM.zeros(k, dtype = float)

        #### Store X Info For Prediction/ CV ####
        self.minX = NUM.zeros(self.numBaseVars, dtype = float)
        self.maxX = NUM.zeros(self.numBaseVars, dtype = float)
        self.knotValues = NUM.zeros(k, dtype = float)
        self.thresholdVarInds = NUM.zeros(k, dtype = NUM.int32)

        #### Threshold/Hinge Columns ####
        startIndex = 0
        shortLabel = 'T{0}'
        baseLabel = ARCPY.GetIDMessage(220413) + '({0}, {1})'
        for ind, varName in enumerate(self.indVarNames):
            data = self.dataTrainX[ind]
            basisData, knotValues, minX, maxX = STATS.thresholdInfo(data, nKnots = self.numKnots)
            self.thresholdX[:,startIndex:startIndex+self.numKnots] = basisData
            self.knotValues[startIndex:startIndex+self.numKnots] = knotValues
            self.minX[ind] = minX
            self.maxX[ind] = maxX
            self.thresholdVarInds[startIndex:startIndex+self.numKnots] = ind

            #### Add Labels ####
            self.labels += [baseLabel.format(varName, i) for i in range(self.numKnots)]
            self.shortLabels += [shortLabel.format(i) for i in range(startIndex,startIndex+self.numKnots)]

            #### Increase Threshold Start Index ####
            startIndex += self.numKnots

        #### Threshold Penalty ####
        mm = self.thresholdX[self.presenceTrain] 
        mmSum = mm.sum(0)
        threshP = NUM.logical_or(mmSum == 0, mmSum == self.numPresence) * 1.0
        pen = basePenalty * mm.std(0, ddof = 1)
        self.thresholdPenalty = NUM.maximum(NUM.maximum(0.001 * (self.thresholdX.max(0) - self.thresholdX.min(0)), threshP), pen)
        self.thresholdSize = self.thresholdX.shape[1]

    def buildProduct(self):
        #### Default Reg Start ####
        xp, fp = basisTables['product']
        basePenalty = NUM.interp(x = self.numPresence, xp = xp, fp = fp) / self.sqrtNP

        #### Generate Unique Pairs of Vars ####
        rangeVars = range(self.numBaseVars)
        comboGenerator = list(ITER.combinations(rangeVars, 2))
        k = len(comboGenerator)

        #### Build X ####
        self.productX = NUM.zeros((self.numObs + self.numPresence, k), dtype = float)
        self.productLabels = []
        self.productVarInds = NUM.zeros((2,k), dtype = NUM.int32)

        #### Pairwise Products ####
        shortLabel = 'P{0}'
        baseLabel = ARCPY.GetIDMessage(220414) + '({0}, {1})'
        startIndex = 0
        for ind0, ind1 in comboGenerator:
            varName0 = self.indVarNames[ind0]
            varName1 = self.indVarNames[ind1]
            data0 = self.dataTrainX[ind0]
            data1 = self.dataTrainX[ind1]
            self.productX[:,startIndex] = STATS.product(data0, data1)
            self.productVarInds[:,startIndex] = (ind0, ind1)

            #### Add Labels ####
            self.labels.append(baseLabel.format(varName0, varName1))
            self.shortLabels.append(shortLabel.format(startIndex))

            startIndex += 1

        #### Product Penalty ####
        mm = self.productX[self.presenceTrain] 
        pen = basePenalty * mm.std(0, ddof = 1)
        self.productPenalty = NUM.maximum(0.001 * (self.productX.max(0) - self.productX.min(0)), pen)
        self.productSize = self.productX.shape[1]

    def buildQuadratic(self):
        #### Default Reg Start ####
        xp, fp = basisTables['quadratic']
        basePenalty = NUM.interp(x = self.numPresence, xp = xp, fp = fp) / self.sqrtNP

        #### Quadratic Columns ####
        k = self.numBaseVars
        shortLabel = 'Q{0}'
        baseLabel = '{0}^2'
        baseLabel = '{0}' + ARCPY.GetIDMessage(220415)
        #### Build X ####
        self.quadraticX = NUM.zeros((self.numObs + self.numPresence, k), dtype = float)

        self.quadraticVarInds = NUM.arange(self.numBaseVars, dtype = NUM.int32)
        startIndex = 0
        for ind, varName in enumerate(self.indVarNames):
            data = self.dataTrainX[ind]
            self.quadraticX[:,startIndex] = STATS.quadratic(data)

            #### Add Labels ####
            self.labels.append(baseLabel.format(varName))
            self.shortLabels.append(shortLabel.format(startIndex))

            startIndex += 1

        #### Quadratic Penalty ####
        mm = self.quadraticX[self.presenceTrain] 
        pen = basePenalty * mm.std(0, ddof = 1)
        self.quadraticPenalty = NUM.maximum(0.001 * (self.quadraticX.max(0) - self.quadraticX.min(0)), pen)
        self.quadraticSize = self.quadraticX.shape[1]

    def buildCategorical(self):
        #### Default Reg Start ####
        xp, fp = basisTables['categorical']
        basePenalty = NUM.interp(x = self.numPresence, xp = xp, fp = fp) / self.sqrtNP
        
        #### Number of Vars * Number of Unique Values per Var ####
        self.categoricalLabels = []
        self.uniqueCatArrays = {}
        self.catSearchValues = []
        self.catVarLabelMatch = {}
        self.catIsNumeric = {}
        k = 0
        for catVarName in self.popdo.catVarNames:
            data = self.popdo.catFields[catVarName].data
            if self.isSubset:
                data = data[self.includedInAnalysis]
            unique, counts = NUM.unique(data, return_counts = True)
            k += len(unique)
            self.uniqueCatArrays[catVarName] = (unique, counts)
            self.catVarLabelMatch[catVarName] = {}

        #### Build X ####
        self.categoricalX = NUM.zeros((self.numObs + self.numPresence, k), dtype = float)

        self.categoricalPenalties = NUM.zeros(k, dtype = float)

        #### Store X Info For Prediction/ CV ####
        self.categoricalVarInds = NUM.zeros(k, dtype = NUM.int32)

        #### Threshold/Hinge Columns ####
        startIndex = 0
        shortLabel = 'C{0}'
        baseLabel = ARCPY.GetIDMessage(220416) + '({0}, {1})'
        for ind, catVarName in enumerate(self.popdo.catVarNames):
            data = self.popdo.catFields[catVarName].data
            if self.isSubset:
                data = data[self.includedInAnalysis]

            #### Add Presence to Background ####
            data = NUM.append(data, data[self.presence], axis=0)

            cats, counts = self.uniqueCatArrays[catVarName]
            nCats = len(cats)
            for catInd, catVal in enumerate(cats):
                self.catSearchValues.append(catVal)
                self.categoricalX[data == catVal,startIndex] = 1
                self.categoricalVarInds[startIndex] = ind

                #### Add Labels ####
                label = baseLabel.format(catVarName, catVal)
                shortLabelOut = shortLabel.format(startIndex)
                self.labels.append(label)
                self.shortLabels.append(shortLabelOut)
                self.catVarLabelMatch[catVarName][catVal] = (shortLabelOut, label)

                #### Increase Threshold Start Index ####
                startIndex += 1

        #### Threshold Penalty ####
        mm = self.categoricalX[self.presenceTrain] 
        mmSum = mm.sum(0)
        catP = NUM.logical_or(mmSum == 0, mmSum == self.numPresence) * 1.0
        pen = basePenalty * mm.std(0, ddof = 1)
        self.categoricalPenalty = NUM.maximum(NUM.maximum(0.001 * (self.categoricalX.max(0) - self.categoricalX.min(0)), catP), pen)
        self.categoricalSize = self.categoricalX.shape[1]

    def buildPredictionLabels(self, varNames, catNames = []):
        fieldMapDict = {}
        for ind, fieldName in enumerate(self.indVarNames):
            fieldMapDict[fieldName] = varNames[ind]

        if len(catNames):
            for ind, fieldName in enumerate(self.catVarNames):
                fieldMapDict[fieldName] = catNames[ind]

        labels = []
        if self.intercept:
            labels += [ARCPY.GetIDMessage(84064)]

        if self.hasLinear:
            labels += varNames

        if self.hasQuadratic:
            baseLabel = '{0}' + ARCPY.GetIDMessage(220415)
            for varName in varNames:
                labels.append(baseLabel.format(varName))
                
        if self.hasProduct:
            baseLabel = ARCPY.GetIDMessage(220414) + '({0}, {1})'

            for i in range(self.startProduct, self.startProduct + self.productSize):
                trainLabel = self.labels[i]
                lSplit1 = trainLabel.split("(")[1]
                lSplit2 = lSplit1.split(", ")
                v1 = fieldMapDict[lSplit2[0]]
                v2 = fieldMapDict[lSplit2[1].strip(")")]
                labels.append(baseLabel.format(v1, v2))

        if self.hasHinge:
            for i in range(self.startHinge, self.startHinge + self.hingeSize):
                trainLabel = self.labels[i]
                initVarName = trainLabel.split("(")[1].split(",")[0]
                labels.append(trainLabel.replace(initVarName, fieldMapDict[initVarName]))


        if self.hasThreshold:
            for i in range(self.startThreshold, self.startThreshold + self.thresholdSize):
                trainLabel = self.labels[i]
                initVarName = trainLabel.split("(")[1].split(",")[0]
                labels.append(trainLabel.replace(initVarName, fieldMapDict[initVarName]))

        if self.hasCategorical:
            for i in range(self.startCategorical, self.startCategorical + self.categoricalSize):
                trainLabel = self.labels[i]
                initVarName = trainLabel.split("(")[1].split(",")[0]
                labels.append(trainLabel.replace(initVarName, fieldMapDict[initVarName]))

        return labels, fieldMapDict

class PresenceOnlyPrediction(object):
    """Core Class for Presence Only Prediction.

    INPUTS:
    ssdo (obj): instance of SSDataObject

    ATTRIBUTES:
    operationMode

    METHODS:
    initialize
    initialize
    calculate
    report
    """

    def __init__(self, ssdo, modelType = "MAXENT", 
                 depVarName = None, indVarNames = None, catVarNames = None,  
                 distanceFeatures = None, explanatoryRasters = None, 
                 basisTypes = ['linear'], numKnots = None, 
                 studyAreaType = None, studyAreaPolygon = None,  
                 doThinning = False, thinDist = None, thinIter = None,
                 backgroundWeight = 100., linkFun = 'CLOGLOG', cutoff = 0.5,
                 resamplingScheme = None, numSampleGroups = None, modelInfoValues = None): 

        if modelInfoValues is not None:
            self.onlyPredictionMode = True
            self.__initModelVariables(modelInfoValues)
            return

        self.onlyPredictionMode = False
        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())
        self.containsBackground = self.depVarName is not None
        if not self.containsBackground:
            if explanatoryRasters is None:
                self.studyAreaType = None
                self.studyAreaPolygon = None
                ARCPY.AddIDMessage("ERROR", 110443)
                raise SystemExit()
        else: # Both presence and background are provided
            if explanatoryRasters is None and distanceFeatures is None and catVarNames is None and indVarNames is None:
                ARCPY.AddIDMessage("ERROR", 110444)
                raise SystemExit()

        self.doValidation = resamplingScheme is not None
        self.warnedTProb = False
        self.coef = None
        self.stdErr = None
        self.varOrder = None
        self.varUsed = None
        self.intercept = False
        self.unit = None

        #### Set Initial Count Objects ####
        self.initPresence = None
        self.initBackground = None

        #### Set Diagnostic Objects ####
        self.cutoffs = None
        self.falsePos = None
        self.truePos = None
        self.falseNeg = None
        self.trueNeg = None
        self.sensitivity = None
        self.specificity = None
        self.auc = None

        #### Get/Set Env/Random Seed ####
        self.seed = None
        if resamplingScheme == "RANDOM" or doThinning:
            #### Get/Set Seed From Env or Random ####
            self.seed = UTILS.getSetRandomSeedMax(seedMax = 1000000)

        #### Runtime Background Weight Validation ####
        if self.backgroundWeight is None:
            self.backgroundWeight = 100

        if self.backgroundWeight < 1:
            self.backgroundWeight = 1
        if self.backgroundWeight > 100:
            self.backgroundWeight = 100

        if self.modelType.upper() == 'MAXENT':
            self.entropy = []
            self.alpha = []
            if self.linkFun is None:
                self.linkFun = "CLOGLOG"
                ARCPY.AddMessage("The default link function for MAXENT is CLOGLOG")
        else:
            self.intercept = True
            if self.linkFun is None:
                self.linkFun = "LOGIT"
                ARCPY.AddMessage("The default link function for MAXLIKE is LOGIT")

        #### Initialize Data ####
        self.__initialize()

        #### Do Calculation ####
        self.__fit()

        #### Predict ####
        self.predClass = NUM.asarray(self.predTrain >= self.cutoff, dtype = NUM.int32)
        #### Compute Diagnostics ####
        self.computeDiagnostics()
        #### Create Report ####
        self.__reportCounts()
        self.__reportModel()
        self.__reportPerfSummary()
        self.__reportCoefTable()
        self.__reportKnots()

        #### Run Cross-Validation ####
        #### Change this to self.doValidation when SPATIAL is done ####
        self.doCV = False
        if resamplingScheme == "RANDOM":

            self.doCV = True
            if self.popdo.hasCatVars:
                self.__catRandomCV()
            else:
                self.__randomCV()


    def __initialize(self):
        self.initPresence = self.ssdo.numObs
        self.initBackground = 0

        if self.containsBackground:
            self.__initializeFeatures()
            y = self.popdo.fields[self.depVarName].data
            
            self.initPresence = (y == 1).sum()
            self.initBackground = (y == 0).sum()

            #### Report/Prune Bad Records (NULL Rasters) ####
            self.popdo.pruneBadRows()

        else:
            self.__initializeRaster()

        #### Do Spatial Thinning ####
        if self.doThinning:
            maskResampleCoords = None

            #### Resample cells ####
            if hasattr(self, "presenceOnly"):
                rs = SF.ResampleRaster(self.presenceOnly.rasterInfo, self.ssdo, self.thinDist)
                maskResampleCoords = rs.maskCells(self.popdo.rawCoords)

            self.popdo.thin(self.ssdo, self.thinDist, self.thinIter, maskResampleCoords) 
            self.printThinDist = UTILS.quickLinearUnitPrint(self.thinDist)


        #### Finalize Range Info ####
        self.popdo.finalizeRangeInfo()

        #### Finalize Cat Variables ####
        self.popdo.finalizeCatInfo()

        #### Create Report Class for Predict Features ####
        self.popdoReporter = POPDataReporter(self.popdo)

        #### Create Report Class For Pred Features ####
        self.popdoReporterPredictToFeatures = POPDataReporter(self.popdo)

        #### Create Report Class for Train Rasters ####
        self.popdoReporterTrainRaster = POPDataReporter(self.popdo)

        ### Create Report Predicted Raster ####
        self.popdoReporterPredictToRaster = POPDataReporter(self.popdo)

        #### Set Final Ind Var Names (Including Distance/Rasters)
        self.allIndVarNames = self.popdo.indVarNames

        #### For User With Advanced License, Raise Error If No Independent Vars or distance features is provided ####
        if len(self.allIndVarNames) == 0 and not self.popdo.hasCatVars:
            #### NOTE --> Need New/Better Error to Include Raster Features ####
            ARCPY.AddIDMessage("ERROR", 110254)
            raise SystemExit()
        catOnly = self.popdo.hasCatVars and len(self.allIndVarNames) == 0

        #### Create Model Matrix ####
        self.mm = ModelMatrix(self.popdo, self.basisTypes, numKnots = self.numKnots, 
                              includedInAnalysis = None, intercept = self.intercept)
        
        #self.x = self.mm.x  ## OA: TODO THIS ALTERS X WITH MODEL MATRIX CAN BE TROUBLE
        ##### Check for Near Perfect Global Multicollinearity ####
        #if catOnly:
        #    can_invert = True
        #else:
        #    if 'HINGE' in self.basisTypes or 'THRESHOLD' in self.basisTypes:
        #        can_invert = ARC._ss.global_invert_check(self.mm.x[:,1:])
        #    else:
        #        can_invert = ARC._ss.global_invert_check(self.mm.x)
        #if not can_invert:
        #    #### Perfect multicollinearity, cannot proceed ####
        #    ARCPY.AddIDMessage("ERROR", 639)
        #    raise SystemExit()

    def __initializeRaster(self):
        self.hasRasterFeatures = self.explanatoryRasters is not None
        self.hasDistanceFeatures = False

        useCovexHull = False
        if self.studyAreaType =="CONVEX_HULL":
            useCovexHull = True
            self.studyAreaPolygon = None
        if self.studyAreaType =="RASTER_EXTENT":
            self.studyAreaPolygon = None

        #### Create Presence Only Class ####
        self.presenceOnly = PresenceOnly(self.ssdo, self.explanatoryRasters, outPath = self.ssdo.templateFC,
        studyAreaPolygon= self.studyAreaPolygon, useConvexHull = useCovexHull)
        sourceIDs, coords, rawCoords = self.presenceOnly.getBaseInfo()

        #### Create POP Data Object ####
        self.popdo = POPDataObject(sourceIDs, coords, rawCoords, self.ssdo.spatialRef)

        #### Add Raster Values ####
        self.popdo.addRasters(self.presenceOnly)


    def __initializeFeatures(self):
        """Performs additional validation and populates the
        SSDataObject."""

        #### Set IndVars to Empty List if None ####
        if self.indVarNames is None:
            self.indVarNames = []

        if self.catVarNames is None:
            self.catVarNames = []

        #### Shorthand Attributes ####
        ssdo = self.ssdo

        #### Remove the Dependent Variable from Independent Vars ####
        if self.depVarName in self.indVarNames:
            self.indVarNames.remove(self.depVarName)
            ARCPY.AddIDMessage("WARNING", 850, self.depVarName)

        #### Remove the Dependent Variable from Independent Vars ####
        if self.depVarName in self.catVarNames:
            self.catVarNames.remove(self.depVarName)
            ARCPY.AddIDMessage("WARNING", 850, self.depVarName)

        #### Remove Intercept if Categorical Variables ####
        if len(self.catVarNames):
            self.intercept = False

        #### Get Base Source IDs ####
        sourceIDs = self.ssdo.getSourceIDs()

        #### Set Coords ####
        coords, rawCoords = self.ssdo.getFeatureCoords()

        #### Create POPDataObject ####
        self.popdo = POPDataObject(sourceIDs, coords, rawCoords, self.ssdo.spatialRef)

        #### Add Vector Fields ####
        self.popdo.addSSDOFields(ssdo, indVarNames = self.indVarNames, depVarName = self.depVarName)

        #### Add Categorical Fields ####
        self.popdo.addSSDOCatFields(ssdo, catVarNames = self.catVarNames)

        #### Add Distance Features ####
        self.hasDistanceFeatures = self.distanceFeatures is not None
        if self.hasDistanceFeatures:
            self.unit = UTILS.getDistanceUnit(ssdo)
            self.popdo.addDistanceFeatures(ssdo, self.distanceFeatures, outPath = ssdo.templateFC, unit = self.unit)

        #### Add Raster Features ####
        self.hasRasterFeatures = self.explanatoryRasters is not None
        if self.hasRasterFeatures:
            self.popdo.addRasterFeatures(ssdo, self.explanatoryRasters, outPath = ssdo.templateFC)

    def reportDataAndCats(self):
        doRangeTables = len(self.popdo.indVarNames) > 0
        doCatTables = self.popdo.hasCatVars
        doPredFeaturesTable = self.popdoReporterPredictToFeatures.initialized
        doPredRasterTable = self.popdoReporterPredictToRaster.initialized
        doPredBoth = doPredFeaturesTable and doPredRasterTable
        doPredOr = doPredFeaturesTable or doPredRasterTable

        if doRangeTables:
            if self.popdoReporterTrainRaster.initialized:
                #### Data Train and Train Raster Report ####
                trainDataReportTable = self.popdoReporterTrainRaster.reportTrainingFeaturesAndRaster(doThinning = self.doThinning)
                ARCPY.AddMessage(trainDataReportTable)

            else:
                #### Data Train Report ####
                trainDataReportTable = self.popdo.trainDataReport(doThinning = self.doThinning)
                ARCPY.AddMessage(trainDataReportTable)

            if doPredBoth:
                #### Data Pred Report (Features and Rasters) ####
                reporter = self.popdoReporterPredictToFeatures
                predDataReportTable = reporter.reportPredictionFeaturesAndRaster(self.popdoReporterPredictToRaster)
                ARCPY.AddMessage(predDataReportTable)

            else:
                if doPredOr:
                    #### Data Pred Report (Features or Rasters) ####
                    if doPredFeaturesTable:
                        reporter = self.popdoReporterPredictToFeatures
                        predType = "FEATURES"
                    else:
                        reporter = self.popdoReporterPredictToRaster
                        predType = "RASTER"

                    predDataReportTable = reporter.reportPredictionFeaturesOrRaster(predType = predType)
                    ARCPY.AddMessage(predDataReportTable)

        if doCatTables:
            if self.popdoReporterTrainRaster.initialized:
                #### Data Train and Train Raster Report ####
                trainCatReportTable = self.popdoReporterTrainRaster.reportTrainingFeaturesAndRasterCat(doThinning = self.doThinning)
                ARCPY.AddMessage(trainCatReportTable)

            else:
                #### Data Train Report ####
                trainCatReportTable = self.popdo.trainCatReport(doThinning = self.doThinning)
                ARCPY.AddMessage(trainCatReportTable)

            if doPredBoth:
                #### Data Pred Report (Features and Rasters) ####
                reporter = self.popdoReporterPredictToFeatures
                predCatReportTable = reporter.reportPredictionFeaturesAndRasterCat(self.popdoReporterPredictToRaster)
                ARCPY.AddMessage(predCatReportTable)

            else:
                if doPredOr:
                    #### Data Pred Report (Features or Rasters) ####
                    if doPredFeaturesTable:
                        reporter = self.popdoReporterPredictToFeatures
                        predType = "FEATURES"
                    else:
                        reporter = self.popdoReporterPredictToRaster
                        predType = "RASTER"

                    predCatReportTable = reporter.reportPredictionFeaturesOrRasterCat(predType = predType)
                    ARCPY.AddMessage(predCatReportTable)

    def __fit(self):
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220399))

        if self.modelType.upper() == 'MAXLIKE':
            self.coef, self.stdErr, self.varOrder, self.predTrain = maxLikeSolve(self.mm.y, self.mm.x,
                                                                                 self.linkFun)
            
        elif self.modelType.upper() == 'MAXENT':
            self.coef, self.varOrder, self.predTrain, self.alpha, self.entropy = maxEntSolve(self.mm.dataTrainY.ravel(), 
                                                                                             self.mm.x, 
                                                                                             self.linkFun,
                                                                                             backgroundWeight=self.backgroundWeight,
                                                                                             regMult = 1,
                                                                                             regFun = self.mm.penalties,
                                                                                             alpha = 1,
                                                                                             nLambda = 200)
            #### Remove Duplicate Background Presences ####
            self.predTrain = self.predTrain[:self.mm.numObs]

    def predictToFeatures(self, ssdo, outputPredictionFeatures, varMatch = [], catMatch = [], 
                          distMatch = [], rastMatch = [], extrapolate = True):
        """Python API to Predict Training Coefs to Output Features."""

        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220406))

        #### Assure Output Spatial Ref Matches Training Spatial Ref ####
        predSpatialRef = UTILS.returnOutputSpatialRef(ssdo.spatialRef,
                                                      outputFC = outputPredictionFeatures)
        UTILS.compareSpatialRefNames(self.ssdo.spatialRef.name, predSpatialRef.name)

        #### Get Output Path ####
        outPath, outName = OS.path.split(outputPredictionFeatures)

        #### Get Source IDs ####
        sourceIDs = ssdo.getSourceIDs()

        #### Set Coords ####
        coords, rawCoords = ssdo.getFeatureCoords()

        #### Create POPDataObject ####
        popdo = POPDataObject(sourceIDs, coords, rawCoords, ssdo.spatialRef, train = False)

        #### Add Vector Fields ####
        if len(varMatch):
            popdo.addSSDOFields(ssdo, varMatch)

        if len(catMatch):
            popdo.addSSDOCatFields(ssdo, catMatch)

        #### Add Distance Features ####
        if self.hasDistanceFeatures:
            popdo.addDistanceFeatures(ssdo, distMatch, outPath = outPath, unit = self.unit)

        #### Add Raster Features ####
        if self.hasRasterFeatures:
            popdo.addRasterFeatures(ssdo, rastMatch, outPath = outPath, trainRasterInfoList = self.popdo.rasterInfoList)

        #### Get Training / Prediction Data Report and Possibly Clamp ####
        clamp = not extrapolate

        #### Report/Prune Bad Records (NULL Rasters) ####
        popdo.pruneBadRows()

        #### Finalize Range Info ####
        popdo.finalizeRangeInfo()

        #### Finalize Cat Variables ####
        popdo.finalizeCatInfo(train = False)


        #### Add To POPDataReporter ####
        includedInAnalysis = self.popdoReporterPredictToFeatures.addPredPOPDO(popdo)

        self.popdoReporterPredictToFeatures.reportBadRecords(clamp = clamp)

        if clamp:
            popdo.prune(includedInAnalysis)

        #### Assure Correct Number of Columns ####
        varNames = [ i for i in popdo.indVarNames ]

        if len(varNames) != len(self.popdo.indVarNames):
            ARCPY.AddIDMessage("ERROR", 110436) 
            raise SystemExit()

        catNames = [ i for i in popdo.catVarNames ]
        if len(catNames) != len(self.popdo.catVarNames):
            ARCPY.AddIDMessage("ERROR", 110437) 
            raise SystemExit()

        if self.mm.intercept:
            varNames = ["INTERCEPT"] + varNames

        #### Loop Over Variables, Create X Column and Add to Estimate ####
        labels, fieldMapDict = self.mm.buildPredictionLabels(varNames, catNames)
        candidateFieldsX = []
        numObs = popdo.numObs
        k = len(self.varOrder)
        yPred = NUM.zeros(numObs, dtype = float)
        xOut = NUM.zeros((numObs, k), dtype = float)
        for ind, beta in enumerate(self.coef):
            vOrder = self.varOrder[ind]
            fieldName = self.mm.shortLabels[vOrder]
            alias = labels[vOrder]
            basisType = fieldName[0]

            #### Cat Vars ####
            if basisType == "C":
                startIndex = vOrder - self.mm.startCategorical
                columnVarInd0 = self.mm.categoricalVarInds[startIndex]
                varName0 = catNames[columnVarInd0]
                catValues0 = popdo.catFields[varName0].data
                catIndexValue = self.mm.catSearchValues[startIndex]
                data0 = (catValues0 == catIndexValue) * 1.0

            else:

                columnVarInd0, columnVarInd1 = self.mm.varInds[:,vOrder]
                varName0 = varNames[columnVarInd0]
                try:
                    data0 = popdo.fields[varName0].data
                except:
                    #### Intercept ####
                    data0 = NUM.ones(numObs, dtype = float)

                #### Skip Linear and Intercept (No Transform of Data) ####
                if basisType == "Q":
                    #### Quadratic Prediction ####
                    data0 = data0**2.0
                elif basisType == "P":
                    #### Product Prediction ####
                    varName1 = varNames[columnVarInd1]
                    data1 = popdo.fields[varName1].data
                    data0 = data0*data1
                elif basisType == "T":
                    #### Threshold Prediction ####
                    threshColInd = vOrder - self.mm.startThreshold
                    threshVarInd = threshColInd // self.mm.numKnots
                    knotValue = self.mm.knotValues[threshColInd]
                    data0 = (data0 > knotValue) * 1.0
                elif basisType == "H":
                    #### Hinge Prediction ####
                    hingeColInd = vOrder - self.mm.startHinge
                    hingeVarInd = hingeColInd // self.mm.hingeBlock
                    knotValue = self.mm.knotValues[hingeColInd]
                    hingeMod = (hingeColInd // (self.mm.numKnots - 1)) % 2 == 0
                    if hingeMod:
                        #### First Half of Columns ####
                        maxX = self.mm.maxX[hingeVarInd]
                        data0 = STATS.hingeValue(data0, knotValue, maxX)
                    else:
                        #### Second Half of Columns ####
                        minX = self.mm.minX[hingeVarInd]
                        data0 = STATS.hingeValue(data0, minX, knotValue)
                else:
                    #### No Transform for Intercept and Linear ####
                    pass

            #### Add to Prediction ####
            yPred = yPred + (data0 * beta)

            #### Add Candidate X Field ####
            candidateFieldsX.append(SSDO.CandidateField(fieldName, "DOUBLE", data0, alias = alias))

        #### Get Prediction Via Link Fun ####
        if self.modelType.upper() == 'MAXLIKE':
            yHat = expit(yPred)
        else:
            yHat = maxentLinkFun(yPred, linkFun = self.linkFun, entropy = self.entropy, alpha = self.alpha)
        yHat = yHat.ravel()

        #### Get Output Coords and Create Point Data Container ####
        z = None
        n,k = popdo.rawCoords.shape
        xy = popdo.rawCoords
        if k > 2:
            z = xy[:,-1].copy()
            xy = xy[:,0:2]
        xy = xy.copy()

        #### Set Output Source ID Data Type ####
        hasOID64 = False
        if ssdo.hasOID64:
            hasOID64 = True
            outSourceIDType = "BIGINTEGER"
        else:
            outSourceIDType = "LONG"

        container = UTILS.DataContainer(spatialRef = ssdo.spatialRef, xy = xy, z = z, hasOID64 = hasOID64)

        #### Create Candidate Fields and Write Output FC ####
        predClass = NUM.asarray(yHat >= self.cutoff, dtype = NUM.int32)

        candidateFields = [SSDO.CandidateField("SOURCE_ID", outSourceIDType, data = sourceIDs, alias = ARCPY.GetIDMessage(220125)),
                           SSDO.CandidateField("PROB", "DOUBLE", data = yHat, alias = ARCPY.GetIDMessage(220346),
                                               checkNullValues = True),
                           SSDO.CandidateField("PREDICTED", "LONG", data = predClass, alias = ARCPY.GetIDMessage(220347))]
        candidateFields += candidateFieldsX

        container.generateOutput(outputPredictionFeatures, candidateFields)

        return candidateFields

    def predictToFeaturesPresenceOnly(self, ssdo, outputPredictionFeatures, predRasterInfo, extrapolate = True):
        """Python API to Predict Training Coefs to Output Features."""

        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220406))

        #### Assure Output Spatial Ref Matches Training Spatial Ref ####
        predSpatialRef = UTILS.returnOutputSpatialRef(ssdo.spatialRef,
                                                      outputFC = outputPredictionFeatures)
        UTILS.compareSpatialRefNames(self.ssdo.spatialRef.name, predSpatialRef.name)

        #### Get Output Path ####
        outPath, outName = OS.path.split(outputPredictionFeatures)

        #### Get Source IDs ####
        sourceIDs = ssdo.getSourceIDs()

        #### Set Coords ####
        coords, rawCoords = ssdo.getFeatureCoords()

        #### Create POPDataObject ####
        popdo = POPDataObject(sourceIDs, coords, rawCoords, ssdo.spatialRef, train = False)
        popdo.addRasterFeaturesPredictPresenceOnly(ssdo, predRasterInfo, outputPredictionFeatures)

        #### Report/Prune Bad Records (NULL Rasters) ####
        popdo.pruneBadRows()

        #### Finalize Range Info ####
        popdo.finalizeRangeInfo()

        #### Finalize Cat Variables ####
        popdo.finalizeCatInfo(train = False)

        #### Add To POPDataReporter ####
        includedInAnalysis = self.popdoReporterPredictToFeatures.addPredPOPDO(popdo)

        #### Get Training / Prediction Data Report and Possibly Clamp ####
        clamp = not extrapolate
        self.popdoReporterPredictToFeatures.reportBadRecords(clamp = clamp)

        if clamp:
            popdo.prune(includedInAnalysis)

        #### Assure Correct Number of Columns ####
        varNames = [ i for i in popdo.indVarNames ]
        if len(varNames) != len(self.popdo.indVarNames):
            ARCPY.AddIDMessage("ERROR", 110436) 
            raise SystemExit()

        catNames = [ i for i in popdo.catVarNames ]
        if len(catNames) != len(self.popdo.catVarNames):
            ARCPY.AddIDMessage("ERROR", 110437) 
            raise SystemExit()

        if self.mm.intercept:
            varNames = ["INTERCEPT"] + varNames

        #### Loop Over Variables, Create X Column and Add to Estimate ####
        labels, fieldMapDict = self.mm.buildPredictionLabels(varNames, catNames)
        candidateFieldsX = []
        numObs = popdo.numObs
        k = len(self.varOrder)
        yPred = NUM.zeros(numObs, dtype = float)
        xOut = NUM.zeros((numObs, k), dtype = float)
        for ind, beta in enumerate(self.coef):
            vOrder = self.varOrder[ind]
            fieldName = self.mm.shortLabels[vOrder]
            alias = labels[vOrder]
            basisType = fieldName[0]

            #### Cat Vars ####
            if basisType == "C":
                startIndex = vOrder - self.mm.startCategorical
                columnVarInd0 = self.mm.categoricalVarInds[startIndex]
                varName0 = catNames[columnVarInd0]
                catValues0 = popdo.catFields[varName0].data
                catIndexValue = self.mm.catSearchValues[startIndex]
                data0 = (catValues0 == catIndexValue) * 1.0

            else:

                columnVarInd0, columnVarInd1 = self.mm.varInds[:,vOrder]
                varName0 = varNames[columnVarInd0]
                try:
                    data0 = popdo.fields[varName0].data
                except:
                    #### Intercept ####
                    data0 = NUM.ones(numObs, dtype = float)

                #### Skip Linear and Intercept (No Transform of Data) ####
                if basisType == "Q":
                    #### Quadratic Prediction ####
                    data0 = data0**2.0
                elif basisType == "P":
                    #### Product Prediction ####
                    varName1 = varNames[columnVarInd1]
                    data1 = popdo.fields[varName1].data
                    data0 = data0*data1
                elif basisType == "T":
                    #### Threshold Prediction ####
                    threshColInd = vOrder - self.mm.startThreshold
                    threshVarInd = threshColInd // self.mm.numKnots
                    knotValue = self.mm.knotValues[threshColInd]
                    data0 = (data0 > knotValue) * 1.0
                elif basisType == "H":
                    #### Hinge Prediction ####
                    hingeColInd = vOrder - self.mm.startHinge
                    hingeVarInd = hingeColInd // self.mm.hingeBlock
                    knotValue = self.mm.knotValues[hingeColInd]
                    hingeMod = (hingeColInd // (self.mm.numKnots - 1)) % 2 == 0
                    if hingeMod:
                        #### First Half of Columns ####
                        maxX = self.mm.maxX[hingeVarInd]
                        data0 = STATS.hingeValue(data0, knotValue, maxX)
                    else:
                        #### Second Half of Columns ####
                        minX = self.mm.minX[hingeVarInd]
                        data0 = STATS.hingeValue(data0, minX, knotValue)
                else:
                    #### No Transform for Intercept and Linear ####
                    pass

            #### Add to Prediction ####
            yPred = yPred + (data0 * beta)

            #### Add Candidate X Field ####
            candidateFieldsX.append(SSDO.CandidateField(fieldName, "DOUBLE", data0, alias = alias))

        #### Get Prediction Via Link Fun ####
        if self.modelType.upper() == 'MAXLIKE':
            yHat = expit(yPred)
        else:
            yHat = maxentLinkFun(yPred, linkFun = self.linkFun, entropy = self.entropy, alpha = self.alpha)
        yHat = yHat.ravel()

        #### Get Output Coords and Create Point Data Container ####
        z = None
        n,k = popdo.rawCoords.shape
        xy = popdo.rawCoords
        if k > 2:
            z = xy[:,-1].copy()
            xy = xy[:,0:2]
        xy = xy.copy()

        #### Set Output Source ID Data Type ####
        hasOID64 = False
        if ssdo.hasOID64:
            hasOID64 = True
            outSourceIDType = "BIGINTEGER"
        else:
            outSourceIDType = "LONG"

        container = UTILS.DataContainer(spatialRef = ssdo.spatialRef, xy = xy, z = z, hasOID64 = ssdo.hasOID64)

        #### Create Candidate Fields and Write Output FC ####
        predClass = NUM.asarray(yHat >= self.cutoff, dtype = NUM.int32)

        candidateFields = [SSDO.CandidateField("SOURCE_ID", outSourceIDType, data = sourceIDs, alias = ARCPY.GetIDMessage(220125)),
                           SSDO.CandidateField("PROB", "DOUBLE", data = yHat, alias = ARCPY.GetIDMessage(220346),
                                               checkNullValues = True),
                           SSDO.CandidateField("PREDICTED", "LONG", data = predClass, alias = ARCPY.GetIDMessage(220347))]
        candidateFields += candidateFieldsX

        container.generateOutput(outputPredictionFeatures, candidateFields)

        return candidateFields

    def __predictToTrain(self, coef, varOrder, includedToPredict = None):

        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220404))

        varNames = self.popdo.indVarNames
        if self.mm.intercept:
            varNames = ["INTERCEPT"] + varNames

        #### Subset Data? ####
        isSubset = includedToPredict is not None
        if isSubset:
            numObs = includedToPredict.sum()
        else:
            numObs = self.popdo.numObs

        #### Loop Over Variables, Create X Column and Add to Estimate ####
        yPred = NUM.zeros(numObs, dtype = float)
        for ind, beta in enumerate(coef):
            vOrder = varOrder[ind]
            basisType = self.mm.shortLabels[vOrder][0]
            if basisType == "C":
                startIndex = vOrder - self.mm.startCategorical
                columnVarInd0 = self.mm.categoricalVarInds[startIndex]
                varName0 = self.mm.catVarNames[columnVarInd0]
                catValues0 = self.popdo.catFields[varName0].data
                catIndexValue = self.mm.catSearchValues[startIndex]
                data0 = (catValues0 == catIndexValue) * 1.0
                if isSubset:
                    data0 = data0[includedToPredict]

            else:

                columnVarInd0, columnVarInd1 = self.mm.varInds[:,vOrder]
                varName0 = varNames[columnVarInd0]
                try:
                    data0 = self.popdo.fields[varName0].data
                    if isSubset:
                        data0 = data0[includedToPredict]
                except:
                    data0 = NUM.ones(numObs, dtype = float)

                #### Skip Linear and Intercept (No Transform of Data) ####
                if basisType == "Q":
                    #### Quadratic Prediction ####
                    data0 = data0**2.0
                elif basisType == "P":
                    #### Product Prediction ####
                    varName1 = varNames[columnVarInd1]
                    data1 = self.popdo.fields[varName1].data
                    if isSubset:
                        data1 = data1[includedToPredict]
                    data0 = data0*data1
                elif basisType == "T":
                    #### Threshold Prediction ####
                    threshColInd = vOrder - self.mm.startThreshold
                    threshVarInd = threshColInd // self.mm.numKnots
                    knotValue = self.mm.knotValues[threshColInd]
                    data0 = (data0 > knotValue) * 1.0
                elif basisType == "H":
                    #### Hinge Prediction ####
                    hingeColInd = vOrder - self.mm.startHinge
                    hingeVarInd = hingeColInd // self.mm.hingeBlock
                    knotValue = self.mm.knotValues[hingeColInd]
                    hingeMod = (hingeColInd // (self.mm.numKnots - 1)) % 2 == 0
                    if hingeMod:
                        #### First Half of Columns ####
                        maxX = self.mm.maxX[hingeVarInd]
                        data0 = STATS.hingeValue(data0, knotValue, maxX)
                    else:
                        #### Second Half of Columns ####
                        minX = self.mm.minX[hingeVarInd]
                        data0 = STATS.hingeValue(data0, minX, knotValue)
                else:
                    #### No Transform for Intercept and Linear ####
                    pass

            #### Add to Prediction ####
            yPred = yPred + (data0 * beta)

        return yPred

    def __catRandomCV(self, iters = 10):
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220398))
        flag = True
        c = 0
        self.cvGroups = None
        while flag:
            #### Random Indices #### 
            permIndices = RAND.permutation(self.mm.numObs)

            #### Create Random Group Dictionary of Indices ####
            cvGroups = UTILS.createRandomGroups(permIndices, self.numSampleGroups)

            #### Has Y Variance? ####
            hasVar = checkCVDependentVar(cvGroups, self.mm.y.ravel())
            if not hasVar:
                if c < iters:
                    c += 1
                else:
                    flag = False

            else:
                #### Test to See If All Levels Exist (at least 3) for Every Cat Var ####
                goodGroups = 0
                numCatVars = len(self.popdo.catFields)
                for group, excludedIndices in cvGroups.items():

                    #### Included To Predict ####
                    includedToPredict = NUM.ones(self.mm.numObs, dtype = bool)
                    includedToPredict[excludedIndices] = False

                    goodVars = 0
                    for fieldName, fieldItem in self.popdo.catFields.items():
                        data = fieldItem.data[includedToPredict]
                        unique, counts = NUM.unique(data, return_counts = True)
                        initUnique, initCounts = self.popdo.uniqueCatInfo[fieldName]
                        minCount = counts.min()

                        if len(unique) != len(initUnique) or minCount < 3:
                            #### Not All Levels or Not Enough of a Specific Level ####
                            break

                        else:
                            #### Good Var ####
                            goodVars += 1

                    if goodVars != numCatVars:
                        #### At Least One Bad Cat Var ####
                        break
                    else:
                        #### Good Group ####
                        goodGroups += 1

                if goodGroups == self.numSampleGroups:
                    self.cvGroups = cvGroups
                    flag = False

                else:
                    if c < iters:
                        c += 1
                    else:
                        flag = False

        if self.cvGroups is None:
            ARCPY.AddIDMessage("WARNING", 110438) 
            self.doCV = False

        else:

            #### Run Cross-Validation ####
            self.__crossValidation()

            #### Report ####
            self.__reportCV()

    def __randomCV(self, iters = 10):
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220398))

        flag = True
        c = 0
        self.cvGroups = None
        while flag:

            #### Random Indices #### 
            permIndices = RAND.permutation(self.mm.numObs)

            #### Create Random Group Dictionary of Indices ####
            cvGroups = UTILS.createRandomGroups(permIndices, self.numSampleGroups)

            #### Has Y Variance? ####
            hasVar = checkCVDependentVar(cvGroups, self.mm.y.ravel())

            if hasVar:
                self.cvGroups = cvGroups
                flag = False

            else:
                if c < iters:
                    c += 1
                else:
                    flag = False

        if self.cvGroups is None:
            ARCPY.AddIDMessage("WARNING", 110438) 
            self.doCV = False

        else:

            #### Run Cross-Validation ####
            self.__crossValidation()

            #### Report ####
            self.__reportCV()

    def __crossValidation(self):
        #### Create Progressor Bar ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220398), 0, len(self.cvGroups), 1)

        self.cvInfo = {}
        self.cvOutArray = NUM.zeros(self.mm.numObs, dtype = NUM.int32)
        for group, excludedIndices in self.cvGroups.items():
            #### Set Output Array Info ####
            self.cvOutArray[excludedIndices] = group + 1

            #### Opposite are Included in Analysis ####
            includedInAnalysis = self.cvOutArray != (group + 1)
            includedToPredict = ~includedInAnalysis

            #### Estimate Subset ####
            mm = ModelMatrix(self.popdo, self.basisTypes, numKnots = self.numKnots, 
                             includedInAnalysis = includedInAnalysis, intercept = self.intercept)
 
            yToPred = self.mm.y.ravel()[includedToPredict]
            yToTrain = self.mm.y.ravel()[includedInAnalysis]

            if self.modelType.upper() == 'MAXLIKE':
                coef, stdErr, varOrder, yPred = maxLikeSolve(mm.y, mm.x, self.linkFun)
                yHat = expit(self.__predictToTrain(coef.ravel(), varOrder, includedToPredict = includedToPredict))
            
            else:
                coef, varOrder, yPred, alpha, entropy = maxEntSolve(mm.dataTrainY.ravel(), mm.x, self.linkFun,
                                                                    backgroundWeight=self.backgroundWeight,
                                                                    regMult = 1, regFun = mm.penalties,
                                                                    alpha = 1, nLambda = 200)

                yHatRaw = self.__predictToTrain(coef.ravel(), varOrder, includedToPredict = includedToPredict) 
                yHat = maxentLinkFun(yHatRaw, linkFun = self.linkFun, entropy = entropy, alpha = alpha)

            predClass = NUM.asarray(yHat >= self.cutoff, dtype = NUM.int32)
            self.cvInfo[group] = simpleCVInfo(yToPred, predClass, cutoff = self.cutoff)

            ARCPY.SetProgressorPosition()

    def __reportCV(self):
        """Create CV Report."""
        header = ARCPY.GetIDMessage(220389)
        rows = [[ARCPY.GetIDMessage(220390), ARCPY.GetIDMessage(220391), ARCPY.GetIDMessage(220392),
                 ARCPY.GetIDMessage(220393), ARCPY.GetIDMessage(220394)]]
        for i in range(len(self.cvInfo)):
            cvInfo = self.cvInfo[i]
            n, count0, diff0, count1, diff1 = cvInfo
            N = self.mm.numObs
            #### Background - Classified as Potential Presence ####
            if count0 == 0:
                #### N/A ####
                count0Perc = ARCPY.GetIDMessage(84499)
            else:
                count0Perc = (diff0/count0) * 100

            #### Presence - Correctly Classified ####
            if count1 == 0:
                #### N/A ####
                count1Perc = ARCPY.GetIDMessage(84499)
            else:
                count1Perc = (1 - (diff1/count1)) * 100

            rows.append([str(i+1), str(N-n), str(n),   
                         UTILS.formatValue(count1Perc, "%0.2f"),
                         UTILS.formatValue(count0Perc, "%0.2f")])

        cvReport = UTILS.outputTextTable(rows, header = header, footnote=None,
                                         justify = ["left", "right", "right", "right", "right"], pad = 1, colPad = 3,
                                         titleFillToken = "-", returnHTMLMsg=True, force2Txt=False)
        ARCPY.AddMessage(cvReport)

    def __reportModel(self):

        basisInds = [basis2Index[basis] for basis in self.basisTypes]

        header = ARCPY.GetIDMessage(220379)
  
        #### Populate Row Values ####
        rowValue = []
        rowText = []
        #### Write Basis Expansions ####
        basisList = [ARCPY.GetIDMessage(basisIndex2ID[basis2Index[basis]]) for basis in self.basisTypes]
        basisTxt = ", ".join(basisList)
        rowValue.append(basisTxt)
        rowText.append(ARCPY.GetIDMessage(220380))
        #### Write Number of Knots ####
        if any([ind in basisInds for ind in [3,4] ]):
            if self.numKnots is not None:
                rowValue.append(self.numKnots)
                rowText.append(ARCPY.GetIDMessage(220381))
        #### Write Study Area ####
        if self.studyAreaType is not None:
            if self.studyAreaType.upper() == "CONVEX_HULL":
                rowValue.append(ARCPY.GetIDMessage(220395))
                rowText.append(ARCPY.GetIDMessage(220382))
            elif self.studyAreaType.upper() == "RASTER_EXTENT":
                rowValue.append(ARCPY.GetIDMessage(220396))
                rowText.append(ARCPY.GetIDMessage(220382))
            elif self.studyAreaPolygon is not None:
                rowValue.append(ARCPY.GetIDMessage(220397))
                rowText.append(ARCPY.GetIDMessage(220382))

        #### Write Spatial Thinning Distance ####
        if self.doThinning:
            rowValue.append(self.printThinDist)
            rowText.append(ARCPY.GetIDMessage(220383))

        #### Write Background Weight ####
        rowValue.append(self.backgroundWeight)
        rowText.append(ARCPY.GetIDMessage(220384))

        #### Write Link Function ####
        if self.linkFun.upper() == 'CLOGLOG':
            rowValue.append(ARCPY.GetIDMessage(220400))
            rowText.append(ARCPY.GetIDMessage(220385))

        elif self.linkFun.upper() == 'LOGISTIC': 
            rowValue.append(ARCPY.GetIDMessage(220401))
            rowText.append(ARCPY.GetIDMessage(220385))
        
        ####  Write Probability Cutoff ####
        rowValue.append(UTILS.formatValue(self.cutoff, "%0.4f"))
        rowText.append(ARCPY.GetIDMessage(220386))
        
        outTable = []
        for text, value in zip(rowText, rowValue):
            row = [text, value]
            outTable.append(row)

        outReport = UTILS.outputTextTable(outTable, header = header, footnote=None,
                                          justify = ["left", "left"], pad = 1, colPad = 3,
                                          titleFillToken = "-", returnHTMLMsg=True,
                                          boldCols= 0, emphasizeHeadRow = False, force2Txt=False)
        ARCPY.AddMessage(outReport)    

    def __reportPerfSummary(self):
        header = ARCPY.GetIDMessage(220387)
  
        #### Populate Row Values ####
        rowValue = []
        rowText = []
        #### Write Omission Rate ####
        rowValue.append(UTILS.formatValue(self.omission, "%0.4f"))
        rowText.append(ARCPY.GetIDMessage(220375))
        
        #### Write AUC ####
        rowValue.append(UTILS.formatValue(self.auc, "%0.4f"))
        rowText.append(ARCPY.GetIDMessage(220402))

        #### Write Model Complexity ####
        #rowValue.append(UTILS.formatValue(self.omission, "%0.4f"))
        #rowText.append(ARCPY.GetIDMessage(220403))

        outTable = []

        for text, value in zip(rowText, rowValue):
            row = [text, value]
            outTable.append(row)

        outReport = UTILS.outputTextTable(outTable, header = header, footnote=None,
                                          justify = ["left", "left"], pad = 1, colPad = 3,
                                          titleFillToken = "-", returnHTMLMsg=True, tableSize = "small",
                                          boldCols= 0, emphasizeHeadRow = False, force2Txt=False)
        ARCPY.AddMessage(outReport) 

    def __reportCoefTable(self):
        coefFormat = "%0.4f"
        summaryFormat = "%0.2f"

        coefTable = []
        tableName = ARCPY.GetIDMessage(220423)
        tableHeader = [ARCPY.GetIDMessage(84622), ARCPY.GetIDMessage(84049)]

        coefTable.append(tableHeader)

        #### Temporary N/A Row for Empty Sig Coef ####
        if not len(self.varOrder):
            coefTable.append([ARCPY.GetIDMessage(84499), ARCPY.GetIDMessage(84499)])
        else:
            for ind, coef in zip(self.varOrder, self.coef):
                row = [self.mm.labels[ind],
                        LOCALE.format_string(coefFormat, coef)]
                coefTable.append(row)
            
        coefReport = UTILS.outputTextTable(coefTable, header = tableName, footnote=None,
                                            justify = ["left", "left"], pad = 1, colPad = 3,
                                            titleFillToken = "-", returnHTMLMsg=True, force2Txt=False)
        ARCPY.AddMessage(coefReport)

    def __reportCounts(self):
        header = ARCPY.GetIDMessage(220417)

        #### Define Row Variables ####
        rows = []


        if not self.onlyPredictionMode:

            #### Define Point Statistics (Training) ####
            if self.depVarName is None:
                presFromPoints = self.ssdo.numObs
                backFromPoints = 0
            else:
                yTrue = NUM.asarray(self.mm.y, dtype = NUM.int32).ravel()
                presFromPoints = yTrue.sum()
                backFromPoints = (1-yTrue).sum()

            #### Define Classification Statistics ####

            yTrue = NUM.asarray(self.mm.y, dtype = NUM.int32).ravel()
            yFalse = 1 - yTrue
            tpArray = [i*j for i,j in zip(yTrue, self.predClass)]
            fpArray = [i*j for i,j in zip(yFalse, self.predClass)]

            self.truePositive = sum(tpArray)
            self.falsePositive = sum(fpArray)

            self.backInTraining = int((1 - self.mm.y[:,0]).sum())

        #### Get Row Headers ####
        inFCmsg = ARCPY.GetIDMessage(220418)
        trainMsg = ARCPY.GetIDMessage(220419)
        classMsg = ARCPY.GetIDMessage(220420)
        presMsg = ARCPY.GetIDMessage(220421)
        backgMsg = ARCPY.GetIDMessage(220422)
        #### Define Table Header Row ####
        rows.append(["", 
                     UTILS.buildTableCell(inFCmsg),
                     UTILS.buildTableCell(trainMsg), 
                     UTILS.buildTableCell(classMsg)])
        #### Define Presence Points Statistics ####
        presInTraining = int(self.mm.numPresence)
        rows.append([presMsg, 
                     self.initPresence,
                     presInTraining,
                     self.truePositive])

        #### Define Background Points Statistics####
        
        rows.append([backgMsg, 
                     self.initBackground,
                     self.backInTraining,
                     self.falsePositive])

        report = UTILS.outputTextTable(rows, header = header, footnote=None,
                                       justify = ["left"]*4, pad = 1, colPad = 3,
                                       titleFillToken = "-", returnHTMLMsg=True,
                                       force2Txt=False, tableSize="medium")
        ARCPY.AddMessage(report)

    def __reportKnots(self):
        #### Hinge Table ####  
        #### Define Column Number ####
        if 3 in self.mm.basisIndices:
            numCols = 5
            #### Get Hinge Types ####
            forH = ARCPY.GetIDMessage(220431)
            revH = ARCPY.GetIDMessage(220432)
            for  varInd, varName in enumerate(self.popdo.indVarNames):
                #### Define Header ####
                header = ARCPY.GetIDMessage(220425).format(varName)
                #### Define First Row ####
                headerRow = [ARCPY.GetIDMessage(220426),
                             ARCPY.GetIDMessage(84068),
                             ARCPY.GetIDMessage(220428),
                             ARCPY.GetIDMessage(220429),
                             ARCPY.GetIDMessage(220430)]

                vars = [var for label, var in zip(self.mm.shortLabels, self.mm.labels) if 'H' in label and varName in var]
   
                dirKnotNum = (self.numKnots - 1)
                startInd = varInd * 2 * dirKnotNum
                endInd = ( varInd + 1 ) * 2 * dirKnotNum
                knots = self.mm.knotValues[startInd:endInd]

                #### Get Bounds ####
                minStr = UTILS.formatValue(self.mm.minX[varInd], "%0.4f")
                maxStr = UTILS.formatValue(self.mm.maxX[varInd], "%0.4f")
                
                #### Forward Knots ####
                rows = [[ind, varKnot[0], UTILS.formatValue(varKnot[1], "%0.4f"), maxStr, forH] for ind, varKnot in enumerate(zip(vars[:dirKnotNum], knots[:dirKnotNum]))]
                #### Backward Knots ####
                _ = [rows.append([ind+dirKnotNum, varKnot[0], minStr, UTILS.formatValue(varKnot[1], "%0.4f"), revH]) for ind, varKnot in enumerate(zip(vars[dirKnotNum:], knots[dirKnotNum:]))]
                rows.insert(0, headerRow)

                report = [UTILS.outputTextTable(rows, footnote=None,
                                       justify = ["left"]*numCols, pad = 1, colPad = 3,
                                       titleFillToken = "-", returnHTMLMsg=True,
                                       force2Txt=False, tableSize="medium")]

                fullTable = UTILS.outputAccordion(report, title = header, titleLevel=5,
                                                    expand=False, returnHTMLMsg=False,
                                                    force2Txt=False, titleFillToken="*")

                ARCPY.AddMessage(fullTable)

        #### Threshold Table ####
        elif 4 in self.mm.basisIndices:
            #### Define Column Number ####
            numCols = 3
            report = []
            #### Define Header ####
            for  varInd, varName in enumerate(self.popdo.indVarNames):
                header = ARCPY.GetIDMessage(220424).format(varName)
                #### Define First Row ####
                headerRow = [ARCPY.GetIDMessage(220426),
                             ARCPY.GetIDMessage(84068),
                             ARCPY.GetIDMessage(220427)]

                vars = [var for label, var in zip(self.mm.shortLabels, self.mm.labels) if 'T' in label and varName in var]
                
                startInd = varInd * self.mm.numKnots
                endInd = ( varInd + 1 ) * self.mm.numKnots
                knots = self.mm.knotValues[startInd:endInd]
               
                rows = [[ind, varKnot[0], UTILS.formatValue(varKnot[1], "%0.4f")] for ind, varKnot in enumerate(zip(vars, knots))]
                rows.insert(0, headerRow)

                report = [UTILS.outputTextTable(rows, footnote=None,
                                       justify = ["left"]*numCols, pad = 1, colPad = 3,
                                       titleFillToken = "-", returnHTMLMsg=True,
                                       force2Txt=False, tableSize="medium")]

                fullTable = UTILS.outputAccordion(report, title = header, titleLevel=5,
                                                    expand=False, returnHTMLMsg=False,
                                                    force2Txt=False, titleFillToken="*")

                ARCPY.AddMessage(fullTable)

        else:
            return

        return

    def reportInfo(self):
        ### Report Messages ###
        #self.__reportCounts()
        self.__reportModel()
        self.__reportPerfSummary()
        self.__reportCoefTable()
        self.__reportKnots()

    def createOutputTrainFeatures(self, outputTrainFeatures):

        #### Get Output Coords and Create Point Data Container ####
        z = None
        n,k = self.popdo.rawCoords.shape
        xy = self.popdo.rawCoords
        if k > 2:
            z = xy[:,-1].copy()
            xy = xy[:,0:2]
        xy = xy.copy()

        #### Set Output Source ID Data Type ####
        hasOID64 = False
        if self.ssdo.hasOID64:
            hasOID64 = True
            outSourceIDType = "BIGINTEGER"
        else:
            outSourceIDType = "LONG"

        container = UTILS.DataContainer(spatialRef = self.ssdo.spatialRef, xy = xy, z = z, hasOID64 = hasOID64)

        yOut = NUM.asarray(self.mm.y, dtype = NUM.int32).ravel()
        n = len(yOut)
        probRangeInt = NUM.empty(n, dtype = NUM.int32)
        classifyInt = NUM.empty(n, dtype = NUM.int32)
        for ind, yInit in enumerate(yOut):
            #### Convert Input Y Value to String for Charting - Classification/Misclassification ####
            yPred = self.predClass[ind]
            if yInit == 1:
                if yPred == 1:
                    classifyInt[ind] = 0
                else:
                    classifyInt[ind] = 1

            else:
                if yPred == 0:
                    classifyInt[ind] = 2
                else:
                    classifyInt[ind] = 3

            #### Break Presence Prob Into 4 Output Range Cats ####
            probRangeInt[ind] = NUM.searchsorted(predBreaks, self.predTrain[ind])

        candidateFields = [SSDO.CandidateField("SOURCE_ID", outSourceIDType, data = self.popdo.sourceIDs, alias = ARCPY.GetIDMessage(220125)),
                           SSDO.CandidateField("PRESENCE", "LONG", data = yOut, alias = ARCPY.GetIDMessage(220345)),
                           SSDO.CandidateField("OBSERVED", "LONG", data = yOut, alias = ARCPY.GetIDMessage(220348),
                                               cvDomain = yOutCV),
                           SSDO.CandidateField("PROB", "DOUBLE", data = self.predTrain, alias = ARCPY.GetIDMessage(220346),
                                               checkNullValues = True),
                           SSDO.CandidateField("PROB_RANGE", "LONG", data = probRangeInt, alias = ARCPY.GetIDMessage(220349),
                                               cvDomain = predBinCV),
                           SSDO.CandidateField("PREDICTED", "LONG", data = self.predClass, alias = ARCPY.GetIDMessage(220347)),
                           SSDO.CandidateField("CLASSIFY", "LONG", data = classifyInt, alias = ARCPY.GetIDMessage(220350),
                                               cvDomain = classifyCV)
                           ]

        if self.doCV:
            candidateFields.append(SSDO.CandidateField("CVGROUP", "LONG", data = self.cvOutArray,
                                                       alias = ARCPY.GetIDMessage(220351)))

        if self.modelType.upper() == 'MAXLIKE':
            varOrder = range(len(self.mm.labels))
        else:
            varOrder = self.varOrder

        for ind in varOrder:
            fieldName = self.mm.shortLabels[ind]
            candidateFields.append(SSDO.CandidateField(fieldName, "DOUBLE", data = self.mm.x[:,ind].ravel(),
                                                       alias = self.mm.labels[ind]))

        container.generateOutput(outputTrainFeatures, candidateFields)

        return candidateFields

    def createOutputTrainRaster(self, outputTrainRaster, extrapolate = True):
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220405))

        #### Train Raster POPDO ####
        predPOPDO = POPDataObject([], [], [], self.ssdo.spatialRef, train = False)
        predPOPDO.addTrainingRastersForPredict(self.presenceOnly)
        clamp = not extrapolate

        #### Main Prediction Function ####
        predClass = self.__mainPredictionFunction(predPOPDO, extrapolate)

        #### Add POPDO To Reporter ####
        includedInAnalysis = self.popdoReporterTrainRaster.addPredPOPDO(predPOPDO)
        self.popdoReporterTrainRaster.reportBadCells(clamp = clamp)

        #### Replace NULLs ####
        if clamp:
            predClass[~includedInAnalysis] = NULL

        self.presenceOnly.rasterInfo.createSubsetRasterFromCellCentroids(outputTrainRaster, self.presenceOnly.coords, 
                                                                         predClass, self.ssdo.spatialRef)
        applyJSONLayer(17, cutoff = self.cutoff)

    def __manageOutputRaster(self, rInfo,  info,  newSRF = None, getNValues = None, dataBase = None, outputPath = "", applyLayerB = True):
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

            if newSRF is  None:
                newSRF = self.popdo.spatialRef

            ####  Output Raster If Path is Defined ####
            if outputPath != "":

                #### Check Type Output ####
                isClass = True
                #infoCat = self.rfTraining.yField.info

                if dataBase is None:
                    dataBase = NUM.ones((rInfo.nRows*rInfo.nCols), dtype = float)*NULL
                    dataBase[goodPointsIdsTesting] = info
                else:
                    dataBase[goodPointsIdsTesting] = NUM.asarray(info, dtype = NUM.float32)

                    #### Accumulate Values ####
                    if getNValues is not None:

                        #### Get Current Classes in the prediction ####
                        if isClass:
                            return [id for id, i in enumerate([1,0])]

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

    def __createOutputRasterFromTemporalFile(self, outputRasterPath, rasterDimensionInfoSet, data):
        """ Create temporal file
        INPUT:
            outputPath (str): output path
            rasterInfo (RasterInfo Instance): raster object
            data (2d array): array
        """

        xMin = rasterDimensionInfoSet.getXs().min() - rasterDimensionInfoSet.cellSize/2.0
        yMin = rasterDimensionInfoSet.getYs().min() - rasterDimensionInfoSet.cellSize/2.0
        nCols = rasterDimensionInfoSet.nCols
        nRows = rasterDimensionInfoSet.nRows
        cellSize = rasterDimensionInfoSet.cellSize

        wkspc, nameFile = self.__createTemporalFLT(cellSize, (xMin, yMin), (nRows, nCols), data = data)
        flt = OS.path.join(wkspc,"{0}.flt".format(nameFile))
        hdr = OS.path.join(wkspc,"{0}.hdr".format(nameFile))
        ARCPY.env.outputCoordinateSystem = rasterDimensionInfoSet.srf

        try:
            ARCPY.management.CopyRaster(flt, outputRasterPath, None, None, NULL, "NONE",
                       "NONE", None, "NONE", "NONE", None, "NONE")
        except:
            ARCPY.AddIDMessage("WARNING", 10040, flt)
            ARCPY.AddIDMessage("ERROR", 110449)
            raise SystemExit()
            return None

        try:
            OS.remove(hdr)
            OS.remove(flt)
        except:
            ARCPY.AddIDMessage("WARNING", 10040, flt)
            pass
        return None

    def __createTemporalFLT(self, cellSize = None, xMinYMin = None, nRowsCols = None, 
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
            ARCPY.AddIDMessage("ERROR", 10034, flt)
            raise SystemExit()

        done = ARC._ss.output_flt(flt, data)

        #### Exit - Function Was Cancelled / Couldn't be Created ####
        if not done:
            raise SystemExit()

        return pathNC , r"nc"+ randomName

    def __calculateChunckSize(self, infoRasterInstances, listBase):
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

    def __createFinalOutput(self, multipleFLTAreCreated, workspaceOutput, listRasterZones,
                          pathFLT, nameFLT, outputRasterPath, strProgressor = "" , srf = None, cellSize = None):
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
            listRasterZonesFLT = [workspaceOutput+"\{0}.flt".format(i) for i in listRasterZones]

            #### Save Current WorkSpace ####
            currentWrksp = ARCPY.env.workspace
            ARCPY.env.workspace = workspaceOutput
            outPath, outName = OS.path.split(outputRasterPath)
            spatialRef2SetBack = ARCPY.env.outputCoordinateSystem
            ARCPY.env.outputCoordinateSystem = srf
            #### Merging Rasters ####
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84857))
            try:

                ARCPY.MosaicToNewRaster_management(";".join(listRasterZonesFLT),
                                                    outPath, outName, srf,
                                                    "32_BIT_FLOAT", cellSize, 1, "LAST", "FIRST")
            except:
                ARCPY.AddIDMessage("ERROR", 110450, ";".join(listRasterZonesFLT))
                raise SystemExit
            ARCPY.ResetProgressor()

            #### Applying Previous WorkSpace ####
            ARCPY.env.workspace = currentWrksp
            ARCPY.env.outputCoordinateSystem = spatialRef2SetBack
        else:
            spatialRef2SetBack = ARCPY.env.outputCoordinateSystem
            ARCPY.env.outputCoordinateSystem = srf

            strOut = OS.path.join(pathFLT, nameFLT + ".flt")
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84857))
            #### Copy Layer To Output Raster File ####
            ARCPY.management.CopyRaster(strOut, outputRasterPath, None, None, NULL, "NONE", "NONE", "64_BIT", "NONE", "NONE", None, "NONE")
            ARCPY.ResetProgressor()
            ARCPY.env.outputCoordinateSystem = spatialRef2SetBack
            listRasterZonesFLT = [strOut]

        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(180192))
        ### Remove Temporal Files ####
        for pathFLT in listRasterZonesFLT:
            try:
                OS.remove(pathFLT)
                OS.remove(pathFLT.replace(".flt",".hdr"))
                OS.remove(pathFLT.replace(".flt",".prj"))
            except:
                pass
        ARCPY.ResetProgressor()

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

    def __predictToRasterParts(self, outputPredRaster, predRasterInfo, extrapolate = True, parameterIndexOutPutRaster = 22):
        """Python API to Predict Training Coefs to Output Features."""

        ssdo = None
        if hasattr(self,"ssdo"):
            ssdo = self.ssdo
            newSRF = self.ssdo.spatialRef
        else:
            newSRF = predRasterInfo.spatialRef

        clamp = not extrapolate

        multipleFLTAreCreated = False
        
        #### Get Output Path ####
        outPath, outName = OS.path.split(outputPredRaster)
        
        #### Raster Match w/ Training PPDO ####
        rasterInfoPred = predRasterInfo.rasterInfoPred
        rasterList = [ i['name'] for i in rasterInfoPred ]
        rasterPath = [ i["sourceData"] for i in rasterInfoPred ]
        rasterType = [ i["rfType"] for i in rasterInfoPred ]

        #### Assure Unique/Valid Names ####
        rastNameOut = createAppendFieldNames(rasterList, outPath = outPath)

        #### Get Raster X Columns ####
        boolType  = [ t in ["NUMERIC"] for t in rasterType]

        ### Process Raster to Predict ###
        rInfoPredict = SF.RasterInfo(rasterPath, boolType, srfOutput = newSRF, printInfo = False )
        rInfoPredict.preProcessZones()

        #### Get Number of Zones ####
        nRasterOutput = len(rInfoPredict.rangeZones)
        
        #### Create List Of Id Zones ####
        listIds = list(NUM.arange(nRasterOutput))

        #### Threshold Values to Calculate Render ####
        sampleVisSize  = 1000

        #### Number Values To Extract in each Zone ####
        sampleVisSize = int(sampleVisSize / nRasterOutput) + 1
        
        maxSizeCells = SF.maxSizeCells

        #### Number Of Cells To Process ####
        sizeRaster = float(rInfoPredict.nRows) * float(rInfoPredict.nCols)

        #### Number of Cell per Chunck ####
        nOutputTempRasters =  int(NUM.ceil(sizeRaster / (maxSizeCells/2)))

        ### Get Number of Zones Per Chuck (Output Raster to write) ####
        pn = int(NUM.ceil(nRasterOutput / nOutputTempRasters))
        isClass = True

        #### Set Each Part to a Raster Zone ####
        #### Create a List of Ids In each Chuck ####
        oup = [NUM.asarray(NUM.arange(pn) + i*pn, dtype = int) for i in range(nOutputTempRasters)]
        oup = [ i[i<nRasterOutput]  for i in oup ]
        oup = [ i for i in oup if len(i)>0]

        dataBase = dataset = variable = pathTempNC = pathFLT = nameFLT = None
        workspaceOutput = ""
        listRasterZones = []

        #### Calculate Initial Chuck Information ####
        infoSlice = self.__calculateChunckSize(rInfoPredict, oup[0])
        chunckSize , newSliceCol, newSliceRow, iniIndex, \
        xMinYMin, nColsStep, nRowsStep = infoSlice

        #### Raster Keep in Memory #####
        if sizeRaster < maxSizeCells:
            #### Create an array smaller than maxSizeCells ###
            #### Only one Temporal file is created ####
            dataBase = NUM.ones((rInfoPredict.nRows*rInfoPredict.nCols), 
                                dtype = NUM.float32)*float(NULL)
        else:
            #### Calculate Last Chuck Information ####
            infoSlice = self.__calculateChunckSize(rInfoPredict, oup[-1])

            chunckSize , newSliceCol, newSliceRow, iniIndex, \
            xMinYMin, nColsStep, nRowsStep = infoSlice
            #### Create FLT Using Info Last Chunck To set 
            pathFLT, nameFLT =  self.__createTemporalFLT(cellSize = rInfoPredict.cellSize,
                                                       xMinYMin = xMinYMin,
                                                       nRowsCols = (rInfoPredict.nRows,
                                                                   rInfoPredict.nCols),
                                                       data = None,
                                                       srf = rInfoPredict.srf)

        cnt = 0

        for listBase in oup:
            #### Get Information of Current Chuck  (Group of Zones) ####
            infoSlice = self.__calculateChunckSize(rInfoPredict, listBase)
            chunckSize , newSliceCol, newSliceRow, iniIndex, \
            xMinYMin, nColsStep, nRowsStep = infoSlice

            if not sizeRaster < maxSizeCells:
                #### Create Temporal Array Container ####
                dataBase = NUM.ones((nRowsStep*nColsStep), dtype = NUM.float32)*float(NULL)

            #### Predict Each Zone in a Chunck ####
            for i in listBase:

                #### Create POPDataObject ####
                popdo = POPDataObject([], [], [], newSRF, train = False)

                #### Add Raster Features ####
                mask  = popdo.addRastersForPredict(rInfoPredict, i, rasterList, rastNameOut, rasterType )

                #### If Mask is None ####
                if mask is None:
                    continue

                #### Main Prediction Function ####
                predClass = self.__mainPredictionFunction(popdo, extrapolate, True)
                
                if not self.onlyPredictionMode:
                    #### Add POPDO To Reporter ####
                    includedInAnalysis = self.popdoReporterPredictToRaster.addPredPOPDO(popdo)

                    #### Replace NULLs ####
                    if clamp:
                        mask = mask[includedInAnalysis]
                        predClass = predClass[includedInAnalysis]

                #### Get Dimension Raster Zones ####
                self.rasterDimensionInfo = rInfoPredict.getRasterInfoZone(i)

                if sizeRaster < maxSizeCells:
                    #### Mask Contain Real Cell Ids ####
                    self.rasterDimensionInfo[1] = mask
                else:
                    #### Mask Id Cell are Relative to Current Container ####
                    self.rasterDimensionInfo[1] = mask - iniIndex

                cnt += 1
                listVal = self.__manageOutputRaster(rInfoPredict, predClass, newSRF = newSRF,
                                                getNValues = sampleVisSize,
                                                dataBase = dataBase,
                                                outputPath = outputPredRaster)

            if not sizeRaster < maxSizeCells:

                ##### Update Temporal File FLT for each Chunck ####
                #### Reshpae dataBase Array ####
                dataBase.shape = (nRowsStep, nColsStep)

                #### Update Temporal FLT File ####
                workspaceOutput, outputName = self.__createTemporalFLT(data = dataBase,  
                                                                       xMinYMin= xMinYMin, 
                                                                       nRowsCols= (nRowsStep,nColsStep), 
                                                                       cellSize = rInfoPredict.cellSize
                                                                       )
                listRasterZones.append(outputName)
                ARCPY.ResetProgressor()

        if sizeRaster < maxSizeCells:

            #### Create Temporal File FLT For Container ####
            dataBase.shape = (rInfoPredict.nRows, rInfoPredict.nCols)
            outPath, outName = OS.path.split(outputPredRaster)

            if "." in outName:
                index = len(outName) - outName.find(".")
                removeExt = outName[index:]
                if removeExt in outName.lower():
                    outName = outName.lower().replace(removeExt,"")
                    
            if not self.onlyPredictionMode:
                #### Report bad cells ####
                self.popdoReporterPredictToRaster.reportBadCells(clamp = clamp)

            self.__createOutputRasterFromTemporalFile(outputPredRaster, rInfoPredict, dataBase )
            
            applyJSONLayer(parameterIndexOutPutRaster, cutoff = self.cutoff)
            ARCPY.ResetProgressor()
        else:
            multipleFLTAreCreated = len(set(listRasterZones)) > 1

            #### Create Predition Output ####
            outPath, outName = OS.path.split(outputPredRaster)

            if "." in outName:
                index = len(outName)- outName.find(".")
                removeExt = outName[index:]
                if removeExt in outName.lower():
                    outName = outName.lower().replace(removeExt,"")

            if not self.onlyPredictionMode:
                #### Report bad cells ####
                self.popdoReporterPredictToRaster.reportBadCells(clamp = clamp)

            self.__createFinalOutput( multipleFLTAreCreated, workspaceOutput, listRasterZones, pathFLT, nameFLT,
                                   outputPredRaster, srf = newSRF)

            applyJSONLayer(parameterIndexOutPutRaster, cutoff = self.cutoff)

    def __mainPredictionFunction(self, popdo, extrapolate, isChunck = False):
        """ Predict values
            INPUT: popdo (POPDataObject)
            OUTPUT: predClass
        """

        #### Get Training / Prediction Data Report and Possibly Clamp ####
        clamp = not extrapolate

        #### Finalize Range Info ####
        popdo.finalizeRangeInfo()

        #### Finalize Cat Variables ####
        popdo.finalizeCatInfo(train = False)
        
        varNames = [ i for i in popdo.indVarNames ]
        catNames = [ i for i in popdo.catVarNames ]

        if self.mm.intercept:
            varNames = ["INTERCEPT"] + varNames

        if not isChunck:
            #### Assure Correct Number of Columns ####
            if len(varNames) != len(self.popdo.indVarNames):
                ARCPY.AddIDMessage("ERROR", 110436) 
                raise SystemExit()
           
            if len(catNames) != len(self.popdo.catVarNames):
                ARCPY.AddIDMessage("ERROR", 110437) 
                raise SystemExit()

        #### Loop Over Variables, Create X Column and Add to Estimate ####
        labels, fieldMapDict = self.mm.buildPredictionLabels(varNames, catNames)
        candidateFieldsX = []
        numObs = popdo.numObs
        k = len(self.varOrder)
        yPred = NUM.zeros(numObs, dtype = float)
        xOut = NUM.zeros((numObs, k), dtype = float)
        for ind, beta in enumerate(self.coef):
            vOrder = self.varOrder[ind]
            fieldName = self.mm.shortLabels[vOrder]
            alias = labels[vOrder]
            basisType = fieldName[0]

            #### Cat Vars ####
            if basisType == "C":
                startIndex = vOrder - self.mm.startCategorical
                columnVarInd0 = self.mm.categoricalVarInds[startIndex]
                varName0 = catNames[columnVarInd0]
                catValues0 = popdo.catFields[varName0].data
                catIndexValue = self.mm.catSearchValues[startIndex]
                data0 = (catValues0 == catIndexValue) * 1.0

            else:

                columnVarInd0, columnVarInd1 = self.mm.varInds[:,vOrder]
                varName0 = varNames[columnVarInd0]
                try:
                    data0 = popdo.fields[varName0].data
                except:
                    #### Intercept ####
                    data0 = NUM.ones(numObs, dtype = float)

                #### Skip Linear and Intercept (No Transform of Data) ####
                if basisType == "Q":
                    #### Quadratic Prediction ####
                    data0 = data0**2.0
                elif basisType == "P":
                    #### Product Prediction ####
                    varName1 = varNames[columnVarInd1]
                    data1 = popdo.fields[varName1].data
                    data0 = data0*data1
                elif basisType == "T":
                    #### Threshold Prediction ####
                    threshColInd = vOrder - self.mm.startThreshold
                    threshVarInd = threshColInd // self.mm.numKnots
                    knotValue = self.mm.knotValues[threshColInd]
                    data0 = (data0 > knotValue) * 1.0
                elif basisType == "H":
                    #### Hinge Prediction ####
                    hingeColInd = vOrder - self.mm.startHinge
                    hingeVarInd = hingeColInd // self.mm.hingeBlock
                    knotValue = self.mm.knotValues[hingeColInd]
                    hingeMod = (hingeColInd // (self.mm.numKnots - 1)) % 2 == 0
                    if hingeMod:
                        #### First Half of Columns ####
                        maxX = self.mm.maxX[hingeVarInd]
                        data0 = STATS.hingeValue(data0, knotValue, maxX)
                    else:
                        #### Second Half of Columns ####
                        minX = self.mm.minX[hingeVarInd]
                        data0 = STATS.hingeValue(data0, minX, knotValue)
                else:
                    #### No Transform for Intercept and Linear ####
                    pass

            #### Add to Prediction ####
            yPred = yPred + (data0 * beta)

        #### Get Prediction Via Link Fun ####
        if self.modelType.upper() == 'MAXLIKE':
            yHat = expit(yPred)
        else:
            yHat = maxentLinkFun(yPred, linkFun = self.linkFun, entropy = self.entropy, alpha = self.alpha)
        yHat = yHat.ravel()

        ##prob = yHat
        #### Create Candidate Fields and Write Output FC ####
        #predClass = NUM.asarray(yHat >= self.cutoff, dtype = NUM.int32)

        return  yHat

    def predictToRaster(self, outputPredRaster, predRasterInfo, extrapolate = True, parameterIndexOutPutRaster = 22):
        """Python API to Predict Training Coefs to Output Features."""

        #### Progressor For Pred Raster ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220407))

        #### Get Pred Output Spatial Ref ####
        newSRF = predRasterInfo.spatialRef

        #### Raster Match w/ Training PPDO ####
        rasterInfoPred = predRasterInfo.rasterInfoPred

        rasterList = predRasterInfo.rasterNameList
        rasterPath = predRasterInfo.rasterPath
        rasterType = predRasterInfo.rasterType

        #### Assure Unique/Valid Names ####
        rastNameOut = predRasterInfo.getOutputRasterFieldNames(None)

        #### Get Raster X Columns ####
        boolType  = predRasterInfo.boolType

        rInfoPredict = predRasterInfo.rasterInfo

        ### Process Raster to Predict ###
        rInfoPredict.srfOutput = None

        ### Process Raster to Predict ###
        rInfoPredict.getWorkExtent()

        rInfoPredict.preProcessZones()

        #### Create Raster by Parts ####
        if len(rInfoPredict.rangeZones)>1:
            self.__predictToRasterParts(outputPredRaster, predRasterInfo, 
                                        extrapolate, 
                                        parameterIndexOutPutRaster = parameterIndexOutPutRaster)
            return 

        idZone = 0

        #### Create POPDataObject ####
        popdo = POPDataObject([], [], [], predRasterInfo.spatialRef, train = False)

        #### Add Raster Features ####
        mask  = popdo.addRastersForPredict(rInfoPredict, idZone, rasterList, rastNameOut, rasterType )

        if mask is None:
            ARCPY.AddIDMessage("ERROR", 110451)
            raise SystemExit

        clamp = not extrapolate

        #### Main Prediction Function ####
        predClass = self.__mainPredictionFunction(popdo, extrapolate)

        #### Add POPDO To Reporter ####
        includedInAnalysis = self.popdoReporterPredictToRaster.addPredPOPDO(popdo)
        self.popdoReporterPredictToRaster.reportBadCells(clamp = clamp)

        #### Replace NULLs ####
        if clamp:
            mask = mask[includedInAnalysis]
            predClass = predClass[includedInAnalysis]

        rasterDimensionInfo = rInfoPredict.getRasterInfoZone(idZone)
        sliceData, goodPointsIdsTesting, intersection, cellSize, nRows, nCols = rasterDimensionInfo
        dataBase = NUM.ones((rInfoPredict.nRows*rInfoPredict.nCols), dtype = float)*NULL
        dataBase[mask] = predClass
        dataBase.shape = (rInfoPredict.nRows, rInfoPredict.nCols)
        dataBase = dataBase[sliceData[0],sliceData[1]]

        if newSRF.name != rInfoPredict.srf.name:
            #### Reproject temporal raster ####
            pathFLT,nameFLT = self.__createTemporalFLT( cellSize , xMinYMin = [intersection[0], intersection[1]], 
                                                        nRowsCols=[rInfoPredict.nRows,rInfoPredict.nCols],  
                                                        data = NUM.asarray(dataBase, dtype=NUM.float32), 
                                                        pathFileAndName = None, srf = rInfoPredict.srf )
            self.__createFinalOutput(False, None, None, pathFLT, nameFLT, outputPredRaster, 
                                     strProgressor = "" , srf = newSRF)
        else:
            self.__createRaster(dataBase, newSRF, intersection[0], intersection[1], 
                                cellSize, cellSize, outputPredRaster)
       
        applyJSONLayer(parameterIndexOutPutRaster, cutoff = self.cutoff)

    def getOutputResponseTable(self, outputResponseTable):
        yHat = getResponseMatrix(self.mm.x[:, self.varOrder], self.coef, modelType=self.modelType,
                                    entropy = self.entropy, alpha = self.alpha, link = self.linkFun)

        displayVars = [self.mm.labels[ind] for ind in self.varOrder]

        figLoc = plotResponseSurface(self.mm.x[:,self.varOrder], yHat, labels = displayVars,
                            linkFun = self.linkFun, responseTable = outputResponseTable)

    def createOutputResponseTable(self, outputResponseTable, linearStep = 100):
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220408))

        #### Keep Track of Which Charts to Display ####
        hasLinear = len(self.popdo.indVarNames) > 0
        hasCat = len(self.popdo.catVarNames) > 0

        #### Initialization ####
        variables = []
        values = []
        cats = []
        uniqueLevels = []
        uniqueLevelsCount = []
        varMeans = []
        varModes = []
        varNames = self.popdo.indVarNames
        if self.mm.intercept:
            varNames = ["INTERCEPT"] + varNames
        catNames = self.popdo.catVarNames
        n = len(varNames)
        n_cat = len(catNames)
        responsefields = {}

        #### Get Index of Presence Points ####
        yOut = NUM.asarray(self.mm.y, dtype=NUM.int32).ravel()
        presenceIndex = NUM.nonzero(yOut)

        #### Get Sample Mean of Presence Points for Continuous Variables ####
        for indVarName in varNames:
            field = self.popdo.fields[indVarName].data
            dataMean = field[presenceIndex].mean()
            varMeans.append(dataMean)

        varMeans = NUM.array(varMeans)

        #### Get Sample Mode of Presence Points for Categorical Variables ####
        for indVarName in catNames:
            field = self.popdo.catFields[indVarName].data
            dataMode, levels = STATS.modeAndLevels(field[presenceIndex])
            varModes.append(dataMode)
            uniqueLevels.append(levels)
            uniqueLevelsCount.append(len(levels))

        varModes = NUM.array(varModes)

        #### Create Base Matrix ####
        varAvg = NUM.concatenate((varMeans, varModes), axis=0)
        numRows = linearStep * n + sum(uniqueLevelsCount)
        mm = NUM.repeat([varAvg], numRows, axis=0)

        for i in range(n):
            #### Continuous variables: 100 linespace of 1.2*range ####
            indVarName = varNames[i]
            minData, maxData = self.popdo.minMaxInfo[indVarName]
            rangeData = maxData - minData
            data = NUM.linspace(minData - 0.1 * rangeData, maxData + 0.1 * rangeData, linearStep)
            start = linearStep * i
            end = linearStep * (i + 1)
            mm[start:end, i] = data
            variables += [indVarName] * linearStep
            values += data.tolist()
            cats += [""] * linearStep

        for i in range(n_cat):
            #### Categorical variables: replace with unique levels ####
            indVarName = catNames[i]
            data = uniqueLevels[i]
            counts = uniqueLevelsCount[i]
            start = linearStep * n + sum(uniqueLevelsCount[:i])
            end = start + counts
            mm[start:end, n + i] = data
            variables += [indVarName] * counts
            values += [NUM.nan] * counts
            cats += data.tolist()

        #### Create dictionary for calculation ####
        #### Key: variable name, Value: numpy array ####
        for i in range(n):
            indVarName = varNames[i]
            responsefields[indVarName] = mm[:, i]
        for i in range(n_cat):
            indVarName = catNames[i]
            responsefields[indVarName] = mm[:, n + i]

        #### Prediction ####
        yPred = NUM.zeros(NUM.shape(mm)[0], dtype=float)

        #### Filter Scalar Warning ####
        with WARN.catch_warnings():
            WARN.simplefilter(action='ignore', category=FutureWarning)

            for ind, beta in enumerate(self.coef):
                vOrder = self.varOrder[ind]
                fieldName = self.mm.shortLabels[vOrder]
                basisType = fieldName[0]

                if basisType == "C":
                    #### Categorical Vars ####
                    startIndex = vOrder - self.mm.startCategorical
                    columnVarInd0 = self.mm.categoricalVarInds[startIndex]
                    varName0 = catNames[columnVarInd0]
                    catValues0 = responsefields[varName0].ravel()
                    catIndexValue = self.mm.catSearchValues[startIndex]
                    data0 = (catValues0 == catIndexValue) * 1.0
                    data0 = NUM.asarray(data0, dtype=float)

                else:
                    #### Continuous Vars ####
                    columnVarInd0, columnVarInd1 = self.mm.varInds[:, vOrder]
                    varName0 = varNames[columnVarInd0]
                    try:
                        data0 = responsefields[varName0]
                        data0 = NUM.asarray(data0, dtype=float)
                    except:
                        #### Intercept ####
                        data0 = NUM.ones(numRows, dtype=float)

                    #### Skip Linear and Intercept (No Transform of Data) ####
                    if basisType == "Q":
                        #### Quadratic Prediction ####
                        data0 = data0 ** 2.0
                    elif basisType == "P":
                        #### Product Prediction ####
                        varName1 = varNames[columnVarInd1]
                        data1 = responsefields[varName1]
                        data1 = NUM.asarray(data1, dtype=float)
                        data0 = data0 * data1
                    elif basisType == "T":
                        #### Threshold Prediction ####
                        threshColInd = vOrder - self.mm.startThreshold
                        knotValue = self.mm.knotValues[threshColInd]
                        data0 = (data0 > knotValue) * 1.0
                    elif basisType == "H":
                        #### Hinge Prediction ####
                        hingeColInd = vOrder - self.mm.startHinge
                        hingeVarInd = hingeColInd // self.mm.hingeBlock
                        knotValue = self.mm.knotValues[hingeColInd]
                        hingeMod = (hingeColInd // (self.mm.numKnots - 1)) % 2 == 0
                        if hingeMod:
                            #### First Half of Columns ####
                            maxX = self.mm.maxX[hingeVarInd]
                            data0 = STATS.hingeValue(data0, knotValue, maxX)
                        else:
                            #### Second Half of Columns ####
                            minX = self.mm.minX[hingeVarInd]
                            data0 = STATS.hingeValue(data0, minX, knotValue)
                    else:
                        #### No Transform for Intercept and Linear ####
                        pass

                yPred = yPred + (data0 * beta)

        #### Get Prob Via Link Fun ####
        if self.modelType.upper() == 'MAXLIKE':
            probs = expit(yPred)
        else:
            probs = maxentLinkFun(yPred, linkFun=self.linkFun, entropy=self.entropy, alpha=self.alpha)

        #### Write to output table ####
        numRecords = len(values)
        candidateFields = [SSDO.CandidateField("VARIABLE", "TEXT", NUM.array(variables, dtype = "<U256"), 
                                               alias = ARCPY.GetIDMessage(84842)),
                           SSDO.CandidateField("VALUE", "DOUBLE", NUM.array(values, dtype = float), alias = ARCPY.GetIDMessage(84897), 
                                               checkNullValues = True),
                           SSDO.CandidateField("CATEGORY", "TEXT", NUM.array(cats, dtype = "<U256"), alias = ARCPY.GetIDMessage(84657),
                                               checkNullValues = True),
                           SSDO.CandidateField("PROB", "DOUBLE", NUM.array(probs, dtype = float), alias = ARCPY.GetIDMessage(220346))]

        ARC._ss.output_table_from_candidate_fields(outputResponseTable, numRecords, candidateFields)

        return hasLinear, hasCat

    def createOutputSensitivityTable(self, outputSensitivityTable, minCutoff = .01, maxCutoff = .99):
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220409))
        numTests = len(self.cutoffs)

        candidateFields = [SSDO.CandidateField("CUTOFF", "DOUBLE", data = self.cutoffs, alias = ARCPY.GetIDMessage(84296)),
                           SSDO.CandidateField("FPR", "DOUBLE", data = self.falsePos, alias = ARCPY.GetIDMessage(220352)),
                           SSDO.CandidateField("TPR", "DOUBLE", data = self.truePos, alias = ARCPY.GetIDMessage(220353)),
                           SSDO.CandidateField("FNR", "DOUBLE", data = self.falseNeg, alias = ARCPY.GetIDMessage(220354)),
                           SSDO.CandidateField("TNR", "DOUBLE", data = self.trueNeg, alias = ARCPY.GetIDMessage(220355)),
                           SSDO.CandidateField("SENSE", "DOUBLE", data = self.sensitivity, alias = ARCPY.GetIDMessage(84843)),
                           SSDO.CandidateField("SPEC", "DOUBLE", data = self.specificity, alias = ARCPY.GetIDMessage(220356))]

        ARC._ss.output_table_from_candidate_fields(outputSensitivityTable, numTests, candidateFields)

    def computeDiagnostics(self, minCutoff = .01, maxCutoff = .99):
        self.cutoffs = NUM.arange(minCutoff, maxCutoff + .01, .01)
        numTests = len(self.cutoffs)
        self.falsePos = NUM.zeros(numTests, dtype = float)
        self.truePos = NUM.zeros(numTests, dtype = float)
        self.trueNeg = NUM.zeros(numTests, dtype = float)
        self.falseNeg = NUM.zeros(numTests, dtype = float)
        self.sensitivity = NUM.zeros(numTests, dtype = float)
        self.specificity = NUM.zeros(numTests, dtype = float)

        yOut = NUM.asarray(self.mm.y, dtype = NUM.int32).ravel()
        yOne = yOut == 1
        yZero = ~yOne
        yOneSum = yOne.sum()
        yZeroSum = yZero.sum()
        pred = self.predTrain.ravel()

        for ind, cutoff in enumerate(self.cutoffs):
            predClass = NUM.asarray(pred >= cutoff, dtype = NUM.int32)

            #### False Results ####
            falsePosSum = (predClass[yZero] == 1).sum()
            falseNegSum = (predClass[yOne] == 0).sum()

            #### True Results ####
            truePosSum = (predClass[yOne] == 1).sum()
            trueNegSum = (predClass[yZero] == 0).sum()

            #### Rates ####
            falsePosRate = falsePosSum / yZeroSum
            trueNegRate = trueNegSum / yZeroSum
            truePosRate = truePosSum / yOneSum
            falseNegRate = falseNegSum / yOneSum

            #### Sensitivity and Specificity ####
            senseRate = truePosSum / (truePosSum + falseNegSum)
            specRate = trueNegSum / (trueNegSum + falsePosSum)

            #### Add To Result Arrays ####
            self.falsePos[ind] = falsePosRate
            self.truePos[ind] = truePosRate
            self.falseNeg[ind] = falseNegRate
            self.trueNeg[ind] = trueNegRate
            self.sensitivity[ind] = senseRate
            self.specificity[ind] = specRate

        #### Get Confusion Matrix for Cutoff ####
        predClass = NUM.asarray(pred >= self.cutoff, dtype = NUM.int32)

        falsePosSum = (predClass[yZero] == 1).sum()
        falseNegSum = (predClass[yOne] == 0).sum()
        truePosSum = (predClass[yOne] == 1).sum()
        trueNegSum = (predClass[yZero] == 0).sum()

        #### Get AUC ####
        if self.coef.shape[0] > self.popdo.numObs:
            ARCPY.AddIDMessage("WARNING", 110453)
        self.auc = NUM.abs(NUM.trapz(self.falsePos, self.truePos))
        if self.auc < 0.5:
            self.auc = (1-self.auc)
        
        #### Get Omission Rate for Cutoff ####
        self.omission = falseNegSum/(falseNegSum + truePosSum )

    def getGlobalParameters(self):
        """
        Obtain Global Variables of PresenceOnlyPrediction and POPDataObject
        RETURN:
            variables, popObjDict {dict, dict}
        """

        variables = {}
        variables["modelType"] = self.modelType
        variables["cutoff"] = self.cutoff

        if self.linkFun is not None:
            variables["linkFun"] = self.linkFun

        if self.modelType.upper() == 'MAXLIKE':
            variables["coef"] = self.coef
            variables["stdErr"] = self.stdErr
            variables["varOrder"] = self.varOrder
        elif self.modelType.upper() == 'MAXENT':
            variables["coef"] = self.coef
            variables["varOrder"] = self.varOrder
            variables["alpha"] = self.alpha
            variables["entropy"] = self.entropy

        #### Finalize Range Info ####
        self.popdo.finalizeRangeInfo()

        #### Finalize Cat Variables ####
        self.popdo.finalizeCatInfo(False)

        listVariables=["basisTypes","studyAreaType", "thinDist", "backgroundWeight",
                       "omission", "auc", "backInTraining","printThinDist", "doThinning"]

        for var in listVariables:
            if hasattr(self, var):
                variables[var] = eval(fr"self.{var}")

        popObjDict = {}
        popObjDict["depVarName"] = self.popdo.depVarName
        popObjDict["indVarNames"] = self.popdo.indVarNames

        if self.popdo.hasCatVars:
            popObjDict["catVarNames"] = self.popdo.catVarNames

        listVariables=["uniqueCatInfo", "minMaxInfo", "numObs"]
        for var in listVariables:
            if hasattr(self.popdo, var):
                if var == "uniqueCatInfo":
                    info = eval(fr"self.popdo.{var}")

                    if info is not None:
                        items ={}
                        counts = {}
                        for i in info:
                            items[i] = info[i][0]
                            counts[i] = info[i][1]
                        popObjDict[var+"_items"] = items
                        popObjDict[var+"_counts"] = counts

                else:
                    popObjDict[var] = eval(fr"self.popdo.{var}")

        return variables, popObjDict

    def __initModelVariables(self, modelValues):
        """ Initialize PoP using model Information 
        INPUT:
            modelValues {list of dictionaries}: [Global Variables of PresenceOnlyPrediction Object,
                                                 Variables of POPDataObject,
                                                 Variables of ModelMatrix]
        """

        variables, popObjectDict, modelMatrix, unit, rasterInfoList, catVars, numIndVars = modelValues

        if unit is not None:
             setattr(self, "unit", unit)

        for var in variables:
            setattr(self, var, variables[var])

        setattr(self, "studyAreaPolygon", False)
        if variables["studyAreaType"] == "STUDY_POLYGON":
            setattr(self, "studyAreaPolygon", True)

        self.popdo = POPDataObjectBase()

        #### Simulate Fields from Metadata Variables ####
        self.popdo.setProperty("fields", numIndVars)
        self.popdo.setProperty("catFields", catVars)

        self.popdo.setProperty("rasterInfoList", rasterInfoList)

        for id, var in enumerate(popObjectDict):
            if var.endswith("_items"):
                realName = var.replace("_items","")
                items = popObjectDict[realName+"_items"]
                counts = popObjectDict[realName+"_counts"]
                tempDict = {}
                if items is None: 
                    self.popdo.setProperty(realName, tempDict)
                    continue
                for name in items:
                    tempDict[name] = (items[name], counts[name])
                self.popdo.setProperty(realName, tempDict)
            else:
                self.popdo.setProperty(var, popObjectDict[var])


        if hasattr(self.popdo, "catVarNames"):
            self.popdo.setProperty("hasCatVars", True)
        else:
            self.popdo.setProperty("catVarNames", [])
            self.popdo.setProperty("hasCatVars", False)

        #### Create Report Class for Predict Features ####
        self.popdoReporter = POPDataReporter(self.popdo)

        #### Create Report Class For Pred Features ####
        self.popdoReporterPredictToFeatures = POPDataReporter(self.popdo)

        #### Create Report Class for Train Rasters ####
        self.popdoReporterTrainRaster = POPDataReporter(self.popdo)

        ### Create Report Predicted Raster ####
        self.popdoReporterPredictToRaster = POPDataReporter(self.popdo)

        self.mm = ModelMatrix(popdo = self.popdo,modelInfo = modelMatrix)
        self.mm.modelType= self.modelType

    def __checkRepeatedName(self, fields, newName):
        cnt = 1
        names = [i.name for i in fields]
        while newName in names :
            newName+= fr"_{cnt}"
            cnt+=1
        return newName


    def saveModel(self, modelOutput, doExtrapolate= True, containsBackground = True):
        """ Save Pop Model """

        UTILS.checkOutputPath(modelOutput, "FILE", ["SSM"])

        pop = self
        isShpOuput = False
        if pop.ssdo.templateFC is not None:
            isShpOuput = UTILS.isShapeFile(pop.ssdo.templateFC)

        yf = UTILS.ModelVariable()

        if pop.depVarName is not None :
            yField = pop.ssdo.fields[pop.depVarName.upper()]
            yf.name = yField.name
            yf.alias= yField.alias
            yf.source = "FC"
            yf.fieldType = yField.type
            yf.info= ""
            yf.index = -1
            yf.rfType = "Numeric"
        else:
            yf.rfType = "Numeric"
            yf.name = ARCPY.GetIDMessage(220600)
            yf.alias= ARCPY.GetIDMessage(220600)
            yf.source = "FC"
            yf.fieldType = None
            yf.info= ""
            yf.index = -1

        fields = []
        cnt = 0

        if pop.popdo.fields is not None:
            for fld in pop.popdo.fields:
                if pop.popdo.fields[fld].variableSource is not None:
                    xf = UTILS.ModelVariable()
                    xField = pop.popdo.fields[fld]
                    xf.name = xField.name
                    xf.alias= xField.alias
                    xf.source = xField.variableSource
                    if xf.source == "DIST":
                        unit = UTILS.getDistanceUnit(pop.ssdo, True)
                        xf.unit = unit
                    if hasattr(xField,"realFieldType"):
                        xf.fieldType = xField.realFieldType
                    xf.rfType = "Numeric"
                    xf.index = cnt
                    xf.info= ""
                    fields.append(xf)

        if pop.popdo.catFields is not None:
            for fld in pop.popdo.catFields:
                if pop.popdo.catFields[fld].variableSource is not None:
                    xf = UTILS.ModelVariable()
                    xField = pop.popdo.catFields[fld]
                    xf.name = xField.name
                    xf.alias= xField.alias
                    xf.source = xField.variableSource
                    xf.fieldType = xField.type
                    xf.rfType = "Categorical"
                    xf.index = cnt
                    xf.info= list(NUM.unique(pop.popdo.catFields[fld].data))
                    fields.append(xf)

        modelOut = UTILS.ModelMetadata()
        modelOut.fields = fields
        modelOut.yField = yf
        modelOut.modelType = "POP"
        if pop.distanceFeatures is not None:
            modelOut.distanceUnit = UTILS.getDistanceUnit(pop.ssdo)

        globalV, popInfo = pop.getGlobalParameters()
        mmd = pop.mm.getParameters()
        gl = {"GLOBAL_"+key: globalV[key] for key in globalV}
        po = {"POP_"+key: popInfo[key] for key in popInfo}
        mm = {"MM_"+key: mmd[key] for key in mmd}

        gl.update(po)
        gl.update(mm)
        gl["doExtrapolate"] = doExtrapolate
        gl["containsBackground"] = containsBackground
        modelOut.otherAttr = gl
        modelOut.saveInfo(modelOutput, modelType = "POP")

######################### PLOTTING LOGIC #########################
######################### RESPONSE SURFACE LOGIC #########################
def getResponseMatrix(predictors, coeff, modelType='maxEnt', 
                      entropy = 0, alpha = 0, link = None):

    nVars = predictors.shape[1]

    #### Get Variable Means ####
    meanMat = predictors.mean(axis=0) * NUM.ones(predictors.shape)
    meanPred = NUM.zeros(predictors.shape)

    #### Create Mean Predictions ####
    for ind in range(nVars):
        meanMat[:,ind] = predictors[:,ind]
        indSort = NUM.argsort(meanMat[:,ind])
        meanPred[:,ind] = predictPresence(coeff, meanMat[indSort,:], 
                                          modelType=modelType, 
                                          entropy=entropy, 
                                          alpha=alpha, 
                                          link=link)
        meanMat[:,ind] = meanMat[:,ind].mean()

    return meanPred
   
def plotResponseSurface(X, yHat, labels, linkFun, responseTable):
    import matplotlib
    matplotlib.use('agg')
    import matplotlib.pyplot as PLT
    from textwrap import wrap

    if responseTable:
        if '.dbf' in responseTable:
            figDir = OS.path.abspath(OS.path.join(OS.path.dirname(responseTable)))
        elif '.gdb' in responseTable:
            figDir = OS.path.abspath(OS.path.join(OS.path.dirname(responseTable), r'..'))
        figLoc = OS.path.join(figDir, 'response.png')

        nVarsEff = yHat.shape[1]

        ncol, nrow = largestDiv(nVarsEff)

        fig, axs = PLT.subplots(nrow,ncol, figsize=(15*nrow, 15*ncol), facecolor='w', edgecolor='k')
        axs = axs.ravel()

        for ind in range(ncol*nrow):
            if ind < nVarsEff:
                indSort = NUM.argsort(X[:,ind])
                axs[ind].plot(X[indSort, ind], yHat[:,ind], linewidth=4)
                axs[ind].set_ylim([0, 1])
                axs[ind].set_xlabel("\n".join(wrap(labels[ind], 20)), size=40)
                axs[ind].set_ylabel("Presence Probability ({0})".format(linkFun), size=40)
                axs[ind].tick_params(axis='x', labelsize=40)
                axs[ind].tick_params(axis='y', labelsize=40)

        PLT.savefig(figLoc)
        ARCPY.AddMessage("""json:[{"element":"image", "data":"%s", "elementProps": {"style": "width: 1000px;"}}]""" % "file:{0}".format(figLoc.replace('\\','/')))

def largestDiv(x):
    bound = int(NUM.sqrt(x))
    i = bound
    for i in range(bound , 1, -1):
        if x%i == 0:
            break
    j = int(x/i)
    return NUM.sort([i,j])

######################### Core Solvers #########################

def logit_obj(w, presenceVals, backgroundVals):
    ## Matrix Multiplications
    presenceMult = NUM.matmul(presenceVals, w)
    backgroundMult = NUM.matmul(backgroundVals, w)
    trPresence = expit(presenceMult)
    valBackground = sum(expit(backgroundMult)).sum()
    if valBackground == 0:
        ARCPY.AddIDMessage("ERROR", 639)
        raise SystemExit()
    objVal = -1*sum(NUM.log(trPresence/valBackground)).sum()
    return objVal

def cloglog_obj(w, presenceVals, backgroundVals):
    ## Matrix Multiplications
    presenceMult = NUM.matmul(presenceVals, w)
    backgroundMult = NUM.matmul(backgroundVals, w)
    trPresence = 1-NUM.exp(-NUM.exp(presenceMult))
    valBackground =  sum(1-NUM.exp(-NUM.exp(backgroundMult))).sum()
    if valBackground == 0:
        ARCPY.AddIDMessage("ERROR", 639)
        raise SystemExit()
    objVal = -1*sum(NUM.log(trPresence/valBackground)).sum()
    return objVal

def maxEntSolve(presenceArray, modelMatrix, linkFun, backgroundWeight=100, regMult = 1, regFun = None, 
                alpha = 1, nLambda = 200):
    '''
    presenceArray: 1-D array containing 1 for presence and 0 for background
    modelMatrix: Matrix containing the full design matrix (with basis expansion)
    regMult: Constant regularization multiplier for solver
    regFun: Regularization function (None is default regularization)
    '''


    #### Core C++ Elastic Net Solver w/ MaxEnt Properties ####
    coeff, ja, ja_order, can_solve, max_lam = ARC._ss.max_ent(presenceArray, modelMatrix, regFun, backgroundWeight,
                                                              alpha, nLambda)
    coeff, varOrder = getVarOrder(coeff, ja, ja_order)

    #### Compute Model Entropy/Alpha/YHat ####
    predMatrix = modelMatrix[:, varOrder]
    predMatrix0 = predMatrix[presenceArray == 0]
    backPred0 = NUM.matmul(predMatrix0, coeff)
    backPred = NUM.matmul(predMatrix, coeff)
    predP = NUM.exp(backPred0)
    predSum = predP.sum()
    rawPred = predP / predSum
    entropy = -1.0 * (rawPred * NUM.log(rawPred)).sum()
    alphaOut = -1.0 * NUM.log(predSum)
    yHat = maxentLinkFun(backPred, linkFun = linkFun, entropy = entropy, alpha = alphaOut)

    return coeff, varOrder, yHat, alphaOut, entropy

def maxLikeSolve(presenceArray, modelMatrix, linkFun='logit'):
    presenceArray = presenceArray.ravel()
    backgroundMat = modelMatrix[NUM.where(presenceArray==0)[0],:]
    presenceMat = modelMatrix[NUM.where(presenceArray==1)[0],:]

    #### Initialization - Set to Zero ####
    x0 = NUM.zeros(presenceMat.shape[1])

    if linkFun.upper() == 'LOGIT': 
        res = minimize(logit_obj, x0, 
                       args=(presenceMat, backgroundMat),
                      method = 'BFGS')

    elif linkFun.upper() == 'CLOGLOG':
        res = minimize(cloglog_obj, x0, 
                       args=(presenceMat, backgroundMat),
                      method = 'BFGS')

    coef = res.x
    stdErr = NUM.sqrt(NUM.diag(res.hess_inv))
    yHat = expit(NUM.matmul(modelMatrix, coef))
    varOrder = NUM.arange(modelMatrix.shape[1], dtype = NUM.int32)

    return coef, stdErr, varOrder, yHat

def predictPresence(betas, predictMatrix, modelType, entropy=0, alpha=0, link=None):
    if modelType.upper() == "MAXENT":
       
        yHatRaw = NUM.matmul(predictMatrix, betas) + alpha
        if link is None:
            yHat = yHatRaw
        elif link.upper() == 'EXPONENTIAL':
            yHat = NUM.exp(yHatRaw)
        elif link.upper() == 'CLOGLOG':
            yHat = 1-NUM.exp(-NUM.exp(entropy+yHatRaw))
        elif link.upper() == 'LOGISTIC':
            yHat = 1/(1+NUM.exp(-(entropy+yHatRaw)))

    elif modelType.upper() == "MAXLIKE":
        yHat = expit(NUM.matmul(predictMatrix, betas))

    return yHat

def predictFromModel(modelInfo, parameters, justDescribe = False):
    import h5py as H5
    import json as JSON

    ### Get Parameters Model prediction tool ###
    modelInput = parameters[0].valueAsText
    predictionMode =  parameters[1].valueAsText
    featuresToPredict = parameters[2].valueAsText 
    explanatoryVariableMatching = parameters[5].value
    explanatoryDistanceMatching = parameters[6].value
    explanatoryRastersMatching = parameters[7].value
    outputFeatures = parameters[3].valueAsText
    outputRaster = parameters[4].valueAsText

    #### New Field Type Checker for SSM ####
    matchVariables = UTILS.getTextParameterMatch(5, parameters)
    fields = []
    if matchVariables is not None:
        fields += [i[0].upper() for i in matchVariables]
        checker = UTILS.ExecuteNewFieldTypeChecker(featuresToPredict, outputFeatures, fields = fields)

    metadata = modelInfo.metadata
    ### Get information from Model Metadata
    allVariables = modelInfo.getVariablesByType( attr = "source", valueToFind = "FC", getObj = False)
    indVarNames = modelInfo.getVariablesByType(attr = "name", valueToFind = "Numeric", getObj = False, source = "FC")
    catVarNames = modelInfo.getVariablesByType(attr = "variableType", valueToFind = "Categorical", getObj = False, source = "FC")
    splitVarTypes = [ 1 if name in catVarNames else 0 for name in allVariables]
    rasterInfoList =  modelInfo.getVariablesByType(attr = "source", valueToFind = "RASTER", getObj = True)

    dist = modelInfo.getVariablesByType(attr = "source", valueToFind = "DIST", getObj = False)
    rasters = modelInfo.getVariablesByType(attr = "source", valueToFind = "RASTER", getObj = False)
    hasDistanceFeatures = len(dist) > 0
    hasRasterFeatures = len(rasters) > 0

    catVars = {i.name:i for i in modelInfo.fields if i.rfType.upper() != "NUMERIC"}
    numIndVars = {i.name:i for i in modelInfo.fields if i.rfType.upper() == "NUMERIC"}

    varMatch = []
    catMatch = []   
    if explanatoryVariableMatching is not None:
        varMatch, catMatch = UTILS.splitMatchIndCatVarParam(5, parameters, splitVarTypes)

        #### Assure Cat Numeric to Numeric and Text to Text ####
        if len(catMatch):
            wrongTypes = []
            try:
                fieldsPred = {}
                descPred = ARCPY.Describe(featuresToPredict)
                for i in descPred.fields:
                    fieldsPred[i.name.upper()] = i

                for catInd, catIn in enumerate(catVarNames):
                    inIsNumeric = catVars[catIn.upper()].fieldType.upper() in UTILS.numericTypes
                    matchIsNumeric = fieldsPred[catMatch[catInd].upper()].type.upper() in UTILS.numericTypes
                    if inIsNumeric != matchIsNumeric:
                        wrongTypes.append(catMatch[catInd].upper())
                        break
            except:
                pass

            if len(wrongTypes):
                ARCPY.AddIDMessage("ERROR", 378, wrongTypes[0])
                raise SystemExit()

    #### Get information from Model Variables ####
    keys = modelInfo.otherAttr.keys()
    doExtrapolate = True
    gb = {}
    po = {}
    mm = {}
    for key in keys:
        if key.startswith("GLOBAL_"):
            gb[key.replace("GLOBAL_","")]= modelInfo.otherAttr[key]
        if key.startswith("POP_"):
            po[key.replace("POP_","")]= modelInfo.otherAttr[key]
        if key.startswith("MM_"):
            mm[key.replace("MM_","")]= modelInfo.otherAttr[key]
        if key == "doExtrapolate":
            doExtrapolate = modelInfo.otherAttr[key]

    unit = modelInfo.distanceUnit

    #### Initialize Object from model data ###
    pop = PresenceOnlyPrediction(None, modelInfoValues = (gb,po,mm, unit, rasterInfoList, catVars, numIndVars))
    pop.numKnots = pop.mm.numKnots
    pop.hasDistanceFeatures = hasDistanceFeatures
    pop.hasRasterFeatures = hasRasterFeatures
    pop.rasterInfoList = rasterInfoList
    
    if "indVarNames" in po:
        pop.indVarNames = po["indVarNames"]
    if "catVarNames" in po:
        pop.catVarNames = po["catVarNames"]

    #### Print model Information ####
    pop.reportInfo()

    #### Only describe the model ####
    if justDescribe:
        pop.reportDataAndCats()
        return

    #### Parse Matching Distance Features ####
    distMatch = []

    if explanatoryDistanceMatching is not None:
        for disFC in explanatoryDistanceMatching:
            if type(disFC[0]) == str:
                distMatch.append(disFC[0].replace("'", ""))
            elif hasattr(disFC[0],"value"):
                distMatch.append(disFC[0].value)
            else:
                distMatch.append(disFC[0])

    #### Parse Matching Raster Features ####
    rastMatch = []
    if explanatoryRastersMatching is not None:
        for f in explanatoryRastersMatching:
            if hasattr(f[0], "value"):
                rastMatch.append(f[0].value)
            else:
                rastMatch.append(f[0])



    if predictionMode == "PREDICT_FEATURES":
        ssdoPred = SSDO.SSDataObject(featuresToPredict)
        allVarMatch = [i for i in varMatch]
        allVarMatch += [i for i in catMatch]
        ssdoPred.obtainData(ssdoPred.oidName, allVarMatch)

        #We dont know the origingal ssdo
        pop.ssdo = ssdoPred
        pop.predictToFeatures(ssdoPred, outputFeatures, 
                              varMatch = varMatch, catMatch = catMatch,
                              distMatch = distMatch, rastMatch = rastMatch,
                              extrapolate = doExtrapolate)
        fullLayerPath = OS.path.join(ARCPY.GetInstallInfo()["InstallDir"], 
                             "Resources", "ArcToolbox", "Templates", "Layers")
        parameters[3].symbology = OS.path.join(fullLayerPath, "pop_prob_4_classes.lyrx")
    else:
        #### Predict to Raster ####
        predRasterInfo = PredictionRasterInfo(rastMatch, rasterInfoList)
        pop.predictToRaster(outputRaster, predRasterInfo, doExtrapolate,parameterIndexOutPutRaster = 4 )
    pop.reportDataAndCats()


def executePOP(parameters, messages):
    """Core Execute of POP."""

    ARCPY.env.overwriteOutput = True

    inputFC = UTILS.getTextParameter(0, parameters)
    containsBackground = parameters[1].value
    depVarName = UTILS.getTextParameter(2, parameters)
    if depVarName is not None:
        depVarName = depVarName.upper()

    distanceFeatures = UTILS.getTextParameter(4, parameters) 
    explanatoryRasters = UTILS.getTextParameter(5, parameters)
    basisExpansionFunction = UTILS.getTextParameter(6, parameters)
    numKnots = parameters[7].value
    studyAreaType = UTILS.getTextParameter(8, parameters)
    studyAreaPolygon = UTILS.getTextParameter(9, parameters)
    doThinning = parameters[10].value
    thinDist = UTILS.getTextParameter(11, parameters)
    thinIter = UTILS.getNumericParameter(12, parameters)
    relativeWeight = parameters[13].value
    linkFunction = UTILS.getTextParameter(14, parameters)
    cutoff = parameters[15].value
    outputTrainedFeatures = UTILS.getTextParameter(16, parameters)
    outputTrainedRaster = UTILS.getTextParameter(17, parameters)
    outputResponseTable = UTILS.getTextParameter(18, parameters)
    outputSensitivityTable = UTILS.getTextParameter(19, parameters)
    featuresToPredict = UTILS.getTextParameter(20, parameters)
    outputPredFeatures = UTILS.getTextParameter(21, parameters)
    outputPredRaster = UTILS.getTextParameter(22, parameters)
    explanatoryVariableMatching = parameters[23].value
    explanatoryDistanceMatching =  UTILS.getTextParameterMatch(24, parameters, ["MappingLayerObject","mp.Layer"])
    explanatoryRastersMatching = UTILS.getTextParameterMatch(25, parameters)
    doExtrapolate = parameters[26].value
    resamplingScheme = UTILS.getTextParameter(27, parameters)
    modelFile = UTILS.getTextParameter(29, parameters)

    #### Check Output Paths ####
    if outputTrainedFeatures is not None:
        UTILS.checkOutputPath(outputTrainedFeatures, "FC")
    if outputTrainedRaster is not None:
        UTILS.checkOutputPath(outputTrainedRaster, "RASTER")
    if outputResponseTable is not None:
        UTILS.checkOutputPath(outputResponseTable, "TABLE")
    if outputSensitivityTable is not None:
        UTILS.checkOutputPath(outputSensitivityTable, "TABLE")
    if outputPredFeatures is not None:
        UTILS.checkOutputPath(outputPredFeatures, "FC")
    if outputPredRaster is not None:
        UTILS.checkOutputPath(outputPredRaster, "RASTER")

    inputFields = UTILS.getTextParameter(3, parameters)
    allowRasterOutputWithBackground = False
    if containsBackground and inputFields is None and distanceFeatures is None and explanatoryRasters is not None:
        allowRasterOutputWithBackground = True

    #### Check Unique Outputs (w/ error) ####
    outputList = [outputTrainedFeatures, outputTrainedRaster, outputResponseTable,
                    outputSensitivityTable, outputPredFeatures, outputPredRaster]
    unique = UTILS.hasUniqueOutputs(outputList, throwError = True)

    #if resamplingScheme not in ["SPATIAL", "RANDOM"]:
    if resamplingScheme != "RANDOM":
        resamplingScheme = None
    numSampleGroups = UTILS.getNumericParameter(28, parameters)

    if basisExpansionFunction:
        basisTypes = basisExpansionFunction.upper().split(";")
    else:
        basisTypes = ['linear']

    if distanceFeatures is not None:
        distanceFeatures = distanceFeatures.split(";")
        distanceFeatures = [ fc.replace("'", "") for fc in distanceFeatures ]

    if explanatoryRasters is not None:
        explanatoryRasters = explanatoryRasters.split(";")

    #### Create SSDataObject ####
    if containsBackground:

        if outputPredFeatures is not None and featuresToPredict is not None:
            #### Check Category Numeric to Numeric and Text to Text ####
            UTILS.checkCategoricalTypes(parameters, 0, 3, 20, 23)

        #### Feature-Based Solution ####
        ssdo = SSDO.SSDataObject(inputFC, templateFC = outputTrainedFeatures)
        
        #### Parse Explanatory Variables ####
        indVarNames, catVarNames, splitVarTypes = UTILS.splitIndCatVarParam(3, parameters)
        allVars = [depVarName]
        if indVarNames is not None :
            allVars += [var for var in indVarNames]
        if catVarNames is not None :
            allVars += [var for var in catVarNames]

        ssdo.obtainData(ssdo.oidName, allVars, minNumObs = 5)

    else:

        #### Raster-Based Solution ####
        ssdo = SSDO.SSDataObject(inputFC, templateFC = outputTrainedFeatures)
        ssdo.obtainData()
        depVarName = None
        indVarNames = None
        catVarNames = None

    #### Main Class ####
    pop = PresenceOnlyPrediction(ssdo, 
                                 modelType = "MAXENT",
                                 depVarName = depVarName,
                                 indVarNames = indVarNames,
                                 catVarNames = catVarNames,
                                 distanceFeatures = distanceFeatures,
                                 explanatoryRasters = explanatoryRasters,
                                 basisTypes = basisTypes,
                                 numKnots = numKnots,
                                 studyAreaType = studyAreaType,
                                 studyAreaPolygon = studyAreaPolygon,
                                 doThinning = doThinning,
                                 thinDist = thinDist,
                                 thinIter = thinIter,
                                 backgroundWeight = relativeWeight,
                                 linkFun = linkFunction,
                                 cutoff = cutoff,
                                 resamplingScheme = resamplingScheme,
                                 numSampleGroups = numSampleGroups)

    #### Format Cutoff For Printing/Charts ####
    cutoff = UTILS.formatValue(pop.cutoff, "%0.2f")
    if cutoff[-1] == "0":
        cutoff = cutoff[0:-1]

    #### Store Model ####
    modelOutput = UTILS.getTextParameter(29, parameters)
    if modelOutput is not None:
        pop.saveModel(modelOutput, doExtrapolate, containsBackground)

    if outputTrainedFeatures is not None:
        trainFields = pop.createOutputTrainFeatures(outputTrainedFeatures)
        parameters[16].symbology = OS.path.join(fullLayerPath, "pop_classification_4_classes.lyrx")

        chartTitle = ARCPY.GetIDMessage(220366).format(cutoff)
        barChart = ARCPY.Chart(chartTitle)
        barChart.type = "bar"
        barChart.title = chartTitle
        barChart.xAxis.field = "OBSERVED"
        barChart.xAxis.title = ARCPY.GetIDMessage(220348)
        barChart.xAxis.sort = "DESC"
        barChart.yAxis.field = ""
        barChart.yAxis.title = ARCPY.GetIDMessage(220368)
        barChart.yAxis.sort = "DESC"
        barChart.bar.aggregation = "COUNT"
        barChart.bar.splitCategory = "CLASSIFY"
        barChart.description = ARCPY.GetIDMessage(220367)
        barChart.bar.multiSeriesDisplay = "stacked100"
        barChart.legend.title = ARCPY.GetIDMessage(220350)
        charts = [barChart]

        chartTitle = ARCPY.GetIDMessage(220369)
        barChart1 = ARCPY.Chart(chartTitle)
        barChart1.type = "bar"
        barChart1.title = chartTitle
        barChart1.xAxis.field = "PROB_RANGE"
        barChart1.xAxis.title = ARCPY.GetIDMessage(220349)
        barChart1.xAxis.sort = "DESC"
        barChart1.yAxis.field = ""
        barChart1.yAxis.title = ARCPY.GetIDMessage(84785)
        barChart1.bar.aggregation = "COUNT"
        barChart1.bar.splitCategory = "OBSERVED"
        barChart1.bar.multiSeriesDisplay = "stacked"
        barChart1.bar.rotated = True
        barChart1.legend.title = ARCPY.GetIDMessage(220348)
        charts.append(barChart1)

        chartTitle = ARCPY.GetIDMessage(220370).format(cutoff)
        bpChart = ARCPY.Chart(chartTitle)
        bpChart.type = 'boxPlot'
        bpChart.title = chartTitle
        bpChart.xAxis.field = ""
        bpChart.yAxis.field = "PROB"
        bpChart.yAxis.title = ARCPY.GetIDMessage(220346)
        bpChart.boxPlot.splitCategory = "CLASSIFY"
        bpChart.legend.title = ARCPY.GetIDMessage(220371)
        charts.append(bpChart)

        parameters[16].charts = charts

    #### Output Train Raster ####
    if outputTrainedRaster is not None:
        pop.createOutputTrainRaster(outputTrainedRaster, extrapolate = doExtrapolate)
            
    #### Prediction ####
    doPred = featuresToPredict is not None and outputPredFeatures is not None
    ssdoPred = None
    if doPred and containsBackground:
        #### Prediction for Presence/Background Points ####
        #### Parse Matching Field Names ####
        varMatch = []
        catMatch = []
        if explanatoryVariableMatching is not None:
            varMatch, catMatch = UTILS.splitMatchIndCatVarParam(23, parameters, splitVarTypes)

        #### Parse Matching Distance Features ####
        distMatch = []
        if explanatoryDistanceMatching is not None:
            distMatch = [f[0] for f in explanatoryDistanceMatching]
            distMatch = [ fc.replace("'", "") for fc in distMatch ]

        #### Parse Matching Raster Features ####
        rastMatch = []
        if explanatoryRastersMatching is not None:
            rastMatch = [f[0] for f in explanatoryRastersMatching]

        #### Create Prediction SSDataObject ####
        ssdoPred = SSDO.SSDataObject(featuresToPredict, templateFC = outputPredFeatures)
        allVarMatch = [i for i in varMatch]
        allVarMatch += [i for i in catMatch]
        ssdoPred.obtainData(ssdoPred.oidName, allVarMatch)

        pop.predictToFeatures(ssdoPred, outputPredFeatures, 
                                varMatch = varMatch, catMatch = catMatch,
                                distMatch = distMatch, rastMatch = rastMatch,
                                extrapolate = doExtrapolate)
        parameters[21].symbology = OS.path.join(fullLayerPath, "pop_prob_4_classes.lyrx")

    doPred = outputPredRaster is not None or outputPredFeatures is not None
    doPred = doPred and explanatoryRastersMatching is not None

    allowedPredictRaster = not containsBackground
    if allowRasterOutputWithBackground:
        if containsBackground and allowRasterOutputWithBackground:
            allowedPredictRaster = True

    if doPred and allowedPredictRaster:
        #### Prediction for Presence Only Points ####
        rastMatch = []
        if explanatoryRastersMatching is not None:
            rastMatch = [f[0] for f in explanatoryRastersMatching]

        rasterInfoList = None
        if allowRasterOutputWithBackground:
            rasterInfoList = getRasterInfoList(parameters[25].valueAsText.split(";"))
        else:
            rasterInfoList = pop.presenceOnly.rasterInfoList

        predRasterInfo = None
        if featuresToPredict is not None:
            if ssdoPred is None:
                #### Predict To Features (No Background) ####
                ssdoPred = SSDO.SSDataObject(featuresToPredict, templateFC = outputPredFeatures)
                ssdoPred.obtainData()

            predRasterInfo = PredictionRasterInfo(rastMatch, rasterInfoList, 
                                                  spatialRef = ssdoPred.spatialRef)
            if not containsBackground:
                predFields = pop.predictToFeaturesPresenceOnly(ssdoPred, outputPredFeatures, predRasterInfo,
                                                                extrapolate = doExtrapolate)
                parameters[21].symbology = OS.path.join(fullLayerPath, "pop_prob_4_classes.lyrx")

        if outputPredRaster is not None:
            #### Predict to Raster ####
            if predRasterInfo is None:
                predRasterInfo = PredictionRasterInfo(rastMatch, rasterInfoList)

            pop.predictToRaster(outputPredRaster, predRasterInfo, doExtrapolate)

    #### Data/Cat Reports ####
    pop.reportDataAndCats()

    #### Calculate Output Tables and Charts ####
    if outputResponseTable is not None:
        hasLinear, hasCat = pop.createOutputResponseTable(outputResponseTable)

        #### Response Table Charts ####
        charts = []
        if hasLinear:
            fields = {"VALUE":"VALUE", "PROB":"PROB", "VARIABLE":"VARIABLE"}
            fields = UTILS.honorCaseSDE(outputResponseTable, fields)

            chartTitle = ARCPY.GetIDMessage(220372)
            linearChart = ARCPY.charts.Line(chartTitle)
            linearChart.title = chartTitle
            linearChart.xAxis.field = fields["VALUE"]
            linearChart.xAxis.title = ARCPY.GetIDMessage(84897)
            linearChart.xAxis.useAdaptiveBounds = True
            linearChart.yAxis.field = fields["PROB"]
            linearChart.yAxis.title = ARCPY.GetIDMessage(220346)
            linearChart.aggregation = 'mean'
            linearChart.splitCategory = fields['VARIABLE']
            linearChart.multiSeriesDisplay = "grid"
            linearChart.showPreviewChart = True
            charts.append(linearChart)

        if hasCat:
            fields = {"CATEGORY":"CATEGORY", "PROB":"PROB", "VARIABLE":"VARIABLE"}
            fields = UTILS.honorCaseSDE(outputResponseTable, fields)

            chartTitle = ARCPY.GetIDMessage(220373)
            catChart = ARCPY.charts.Bar(chartTitle)
            catChart.title = chartTitle
            catChart.xAxis.field = fields["CATEGORY"]
            catChart.xAxis.title = ARCPY.GetIDMessage(84657)
            catChart.xAxis.useAdaptiveBounds = True
            catChart.yAxis.field = fields["PROB"]
            catChart.yAxis.title = ARCPY.GetIDMessage(220346)
            catChart.aggregation = 'mean'
            catChart.splitCategory = fields['VARIABLE']
            catChart.multiSeriesDisplay = "grid"
            catChart.miniChartsPerRow = 1000
            charts.append(catChart)

        if hasLinear or hasCat:
            parameters[18].charts = charts

    if outputSensitivityTable is not None:
        pop.createOutputSensitivityTable(outputSensitivityTable)

        #### Omission Rate Chart ####
        chartTitle = ARCPY.GetIDMessage(220374)
        omitChart = ARCPY.Chart(chartTitle)
        omitChart.type = "line"
        omitChart.title = chartTitle
        omitChart.xAxis.field = "CUTOFF"
        omitChart.xAxis.title = ARCPY.GetIDMessage(84296)
        omitChart.yAxis.field = "FNR"
        omitChart.yAxis.title = ARCPY.GetIDMessage(220375)

        chartTitle = ARCPY.GetIDMessage(220376)
        rocChart = ARCPY.Chart(chartTitle)
        rocChart.type = "line"
        rocChart.title = chartTitle
        rocChart.xAxis.field = "FPR"
        rocChart.xAxis.title = ARCPY.GetIDMessage(220377)
        rocChart.yAxis.field = "TPR"
        rocChart.yAxis.title = ARCPY.GetIDMessage(220378)

        parameters[19].charts = [omitChart, rocChart]

