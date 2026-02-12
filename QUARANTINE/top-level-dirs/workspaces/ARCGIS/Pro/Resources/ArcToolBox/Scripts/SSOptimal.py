# coding: utf-8
"""
Source Name:   SSOptimal.py
Version:       ArcGIS Pro 2.4
Author:        Environmental Systems Research Institute Inc.
Description:   Python tool for Spatial Optimization Algorithms

"""
import numpy as NUM
import SSDataObject as SSDO
import SSUtilities as UTILS
import arcgisscripting as ARC
import arcpy as ARCPY
import WeightsUtilities as WU
import os as OS
import collections as COLL
import pdb
import tempfile as TEMPFILE
import Stats as STATS
import time as TIME
import scipy.spatial as SCPS
import locale as LOCALE
import multiprocessing as MP

#################### Constants #################################
nameFakeFieldNumFeatures = "NUMFEA_SS"
nameClusterOutput = "ZONE_ID"
typeConstraintField = {"Operation":0, "Statistic":1, "Proportion":2, "Shape":3, "Cost":4}
typeFunction = {"AVERAGE": 0, "VARIANCE":1, "MEDIAN":2, "SUM":3}
typeFunctionNumpy = {"AVERAGE": NUM.mean, "VARIANCE":NUM.var, "MEDIAN":NUM.median, "SUM":NUM.sum}
shapeFunction = {"EQUAL_AREA":0, "COMPACTNESS":1, "EQUAL_NUMBER_OF_FEATURES":2}
testLinks = False
createDoubleLinkSWM = False
createPickleOutput = False
################################################################

def execute(parameters, messages):
    #### User Defined Inputs ####

    inFeatures = parameters[0].valueAsText
    outputFeatures = parameters[1].valueAsText
    zoneCreationMethod = parameters[2].valueAsText
    numberOfZones = UTILS.getNumericParameter(3, parameters)
    zoneBuildingCriteriaTarget = parameters[4].value
    zoneBuildingCriteria = parameters[5].valueAsText
    spatialConstraints = parameters[6].valueAsText
    weightsMatrixFile = parameters[7].valueAsText
    zoneCharacteristics = parameters[8].valueAsText
    attributeToConsider = parameters[9].valueAsText
    distanceToConsider = parameters[10].valueAsText
    categorialVariable = parameters[11].valueAsText
    proportionMethod = parameters[12].value
    populationSize = UTILS.getNumericParameter(13, parameters)
    numberGenerations =  UTILS.getNumericParameter(14, parameters)
    mutationFactor =  UTILS.getNumericParameter(15, parameters)
    outputConvergenceTable = parameters[16]

    fieldConstraints = None
    if zoneCreationMethod == "ATTRIBUTE_TARGET":
        numRegions = None
        fieldConstraints = zoneBuildingCriteriaTarget
    else:
        fieldConstraints = zoneBuildingCriteria
        numRegions = numberOfZones

    if numRegions in [None, ""]:
        numRegions = None

    if outputConvergenceTable.value is not None:
        UTILS.checkOutputPath(outputConvergenceTable.valueAsText, "TABLE")

    constraints = None
    costValues = None
    if fieldConstraints is not None:
        if type(fieldConstraints) == list:
            try:
                constraints = []
                for i in fieldConstraints:
                    constraints.append("{0} {1} {2}".format(str(i[0].value),i[1].strip(),i[2] ))
            except:
                constraints = parameters[4].valueAsText.split(";")
        else:
            constraints = fieldConstraints.split(";")

        constraintsClean = []
        weights = []
        varNames = []
        for e in constraints:
            elems = e.split(" ")

            if len(elems) == 3:
                strItem = ""
                varNames.append(elems[0])
                strItem = "{0} >= {1}".format(elems[0],UTILS.strToFloat(elems[1].strip()))
                constraintsClean.append(strItem)
                weights.append(UTILS.strToFloat(elems[2]))
            else:
                strItem = ""
                varNames.append(elems[0])
                strItem = "{0} >= {1}".format(elems[0],-1)
                constraintsClean.append(strItem)
                weights.append(UTILS.strToFloat(elems[1]))

        constraints = constraintsClean
        costValuesNum = SSDO.NUM.array(weights, dtype = float)
        total = costValuesNum.sum()
        costValuesReCal = costValuesNum / total
        #### Create Dictionary with Name Field - Calculated Weight ####
        costValues = {w.upper():costValuesReCal[id] for id, w in enumerate(varNames)}


    ssdo = SSDO.SSDataObject(inFeatures)

    globalGen = GlobalGeneratorBase(ssdo, constraints,
                                    sizePopulation = populationSize,
                                    mutationFactor = mutationFactor,
                                    outputFC = outputFeatures,
                                    parameterOutput = parameters[1],
                                    otherConstraints = zoneCharacteristics,
                                    spatialConcept = spatialConstraints,
                                    weightsFile = weightsMatrixFile,
                                    costValues = costValues,
                                    applyFunction = attributeToConsider,
                                    proportionField = categorialVariable,
                                    conserveProportion = proportionMethod == 'MAINTAIN_WITHIN_PROPORTION',
                                    numRegions = numRegions,
                                    numGenerations = numberGenerations,
                                    distanceFeatures = distanceToConsider)
    info = globalGen.getSolution()

    if info is None:
        return

    fitness, maxFitness = info
        
    if outputConvergenceTable.value is not None and fitness is None and maxFitness is None:
        ARCPY.AddIDMessage("WARNING", 110557, outputConvergenceTable.valueAsText )
        return

    outputFitTable = None
    generationData = None

    if outputConvergenceTable.value:
        outputFitTable = outputConvergenceTable.valueAsText
        generationData = NUM.arange(globalGen.numGenerations+1, dtype = NUM.int32)


    if outputFitTable is not None:
        cont = UTILS.DataContainer()
        fieldGeneration = SSDO.CandidateField(name= "GENERATION",
                                                alias = ARCPY.GetIDMessage(84917),
                                                type = "LONG",
                                                data = generationData)
        yFields = [f.name for f in fitness]
        fitness.append(fieldGeneration)

        cont.generateOutput(outputFitTable, fitness)

        chart = ARCPY.Chart(ARCPY.GetIDMessage(84916))
        chart.type = "line"
        chart.title = ARCPY.GetIDMessage(84916)

        #### Assign Y Axis Field ####
        chart.yAxis.field = yFields
        chart.yAxis.title = ARCPY.GetIDMessage(84918)

        #### Assign X Axis Field ####
        chart.xAxis.field = "GENERATION"
        chart.xAxis.title = ARCPY.GetIDMessage(84917)
        chart.legend.visible = True
        chart.xAxis.minimum = 0
        chart.xAxis.maximum = numberGenerations
        chart.yAxis.minimum = 0
        chart.yAxis.maximum = maxFitness

        outputConvergenceTable.charts = [chart]


class RegionHelp():
    """ This class helps to handle disconnected group
    INPUT:
        id (int): Id Groups
        info (1D array): Real IDs of each feature
        coord (2D/3D array): Coordinates
        geocen {bool}: True -> coordinates geocentric
        org {2D array}: original Coordinates (just to calculate CH)
    METHOD:
        minDist: Calculate minimum distance between groups
        closeId: Identify the Id to link groups
    """
    def __init__(self, id, info, coords, geocen = False, org = None):

        self.geocen = geocen
        self.id = id
        self.info = info
        self.coords = coords
        self.center = coords.mean(0)
        variance = coords.var(0)
        self.useCon = True
        self.n = len(coords)
        self.orgCoord = org
        self.ext = None

        if NUM.isclose(variance[0], 0) or NUM.isclose(variance[1], 0):
            self.useCon = False

        self.kdTree = None

        #### Only create Kdtree > 3 features ####
        if len(info) <= 3:
            self.useCon = False

        #### Create Kdtree ####
        try:
            self.kdTree = SCPS.cKDTree(coords)
        except:
            self.useCon = False

        self.pntCH = None
        self.convHull = None

        #### Create Convex Hull ####
        if self.useCon :
            if not geocen:
                try:
                    self.convHull = SCPS.ConvexHull(coords)
                except:
                    self.useCon = False
            else:
                try:
                    self.convHull = SCPS.ConvexHull(self.orgCoord)
                except:
                    self.useCon = False


        self.rad = 0

        #### Use Convex hull ####
        if self.useCon:
            self.pntsCH = coords[self.convHull.vertices]
        else:
            self.pntsCH = coords

        self.dimension = self.pntsCH.shape[1]

        distances = self.eucDistArray(self.center, self.pntsCH)

        self.rad = NUM.mean(distances)
        self.radMax = NUM.max(distances)
        self.ext = None

        if self.useCon:
            minXY= NUM.min(self.pntsCH, 0)
            maxXY= NUM.max(self.pntsCH, 0)
            self.ext = [minXY, maxXY]

        #### Test Ouput Extents ####
        test = 0
        #### Create Extent Polygons ####
        if test == 1:
            if self.useCon:
                self.poly = ARCPY.Extent(XMin = minXY[0], YMin = minXY[1],
                                         XMax = maxXY[0], YMax = maxXY[1]).polygon
            else:
                self.poly = ARCPY.Extent(XMin = self.center[0]-1, YMin = self.center[1]-1,
                                         XMax = self.center[0]+1, YMax = self.center[1]+1).polygon
        elif test == 2:
            ##### Create Convexhull Polygons
            if self.useCon:
                array = ARCPY.Array([ARCPY.Point(self.pntsCH[i,0], self.pntsCH[i,1]) 
                                      for i in NUM.arange(len(self.pntsCH))])
                self.poly = ARCPY.Polygon(array)
            else:
                self.poly = ARCPY.Extent(XMin = self.center[0]-1, YMin = self.center[1]-1,
                                         XMax = self.center[0]+1, YMax = self.center[1]+1).polygon

    def createLink(self, idSelf, idRegion, xy):
        """ Create Link """

        return ARCPY.Polyline(ARCPY.Array([ARCPY.Point(xy[idSelf,0], xy[idSelf,1]),
                ARCPY.Point(xy[idRegion,0], xy[idRegion,1])]))

    def _isContainedAxis(self, region, axis):
        """ Check - axis intersection
        """
        if self.useCon and region.useCon:
            if self.radMax > region.radMax:
                return self.ext[0][axis] < region.ext[0][axis] < self.ext[1][axis] or \
                       self.ext[0][axis] < region.ext[1][axis] < self.ext[1][axis]
            else:
                return region.ext[0][axis] < self.ext[0][axis] < region.ext[1][axis] or \
                        region.ext[0][axis] < self.ext[1][axis] < region.ext[1][axis]

        elif self.useCon and not region.useCon:
                return self.ext[0][axis] < region.center[axis] < self.ext[1][axis] or \
                       self.ext[0][axis] < region.center[axis] < self.ext[1][axis]

        elif not self.useCon and region.useCon:
                return region.ext[0][axis] < self.center[axis] < region.ext[1][axis] or \
                        region.ext[0][axis] < self.center[axis] < region.ext[1][axis]
        else:
            return False

    def isContained(self, region):
        """ Evaluate if extent is contained in another one,
            taking into account the dimension 2D/3D """
        cont = 0
        for i in NUM.arange(self.dimension):
            if self._isContainedAxis(region, i):
                cont += 1
        return cont == self.dimension

    def minDistCH(self, region):
        """
        Calculate Euclidean Distance Using Convex Hull Points
        """
        d = 1e308
        idr = None
        idc = None
        for id, pt in enumerate(self.pntsCH):
            listDist = self.eucDistArray(pt, region.pntsCH)
            info = NUM.argsort(listDist)[0]
            if listDist[info] < d:
                idr = info
                idc = id
                d = listDist[info]
            return d

    def minDist(self, region):
        """
        Calculate Euclidean Distance
        """
        if self.n <= region.n:
            local = self
            target = region
        else:
            local = region
            target = self

        if target.useCon:
            dd, ii = target.kdTree.query(local.coords, 1)
            if "ndarray" in str(type(dd)):
                sId = NUM.argsort(dd)[0]
                cId = local.info[sId]
                closest = ii[sId]
                return dd[sId]
            else:
                return dd
        else:
            d = 1e308
            idr = None
            idc = None
            for id, pt in enumerate(local.coords):
                listDist = local.eucDistArray(pt, target.coords)
                info = NUM.argsort(listDist)[0]
                if listDist[info] < d:
                    idr = info
                    idc = id
                    d = listDist[info]
            return d

    def closeId(self, region):
        """
        Identify Id Feature to link with another region
        """
        if self.n <= region.n:
            local = self
            target = region
        else:
            local = region
            target = self

        if target.useCon:
            dd, ii = target.kdTree.query(local.coords, 1)
            if "ndarray" in str(type(dd)):
                sId = NUM.argsort(dd)[0]
                cId = local.info[sId]
                closest = ii[sId]
                return cId, target.getId(closest)
            else:
                cId = local.info[0]
                closest = ii
                return cId, target.getId(closest)
        else:
            d = 1e308
            idr = None
            idc = None
            for id, pt in enumerate(local.coords):
                listDist = local.eucDistArray(pt, target.coords)
                info = NUM.argsort(listDist)[0]
                if listDist[info] < d:
                    idr = info
                    idc = id
                    d = listDist[info]
            return local.info[idc], target.getId(idr)

    def getId(self, id):
        """ Get Id """
        return self.info[id]


    def eucDistArray(self, point, points):
        """ Calculate Euclidian distance
        """
        diff = (point - points)**2.0
        return NUM.sqrt(diff.sum(1))

class ApplyFunctionOperation():
    def __init__(self, functionStr, isDistance = False):
        self.indexField = 0
        self.typeFunct = 0
        self.isDistance = 0

        #### Set default for Distance to Consider Information ####
        if isDistance:
            self.info = functionStr
            self.varName = functionStr.upper()
            self.typeFunct = typeFunction["AVERAGE"]
            self.evaluate = typeFunctionNumpy["AVERAGE"]
            self.isDistance = 1

        else:
            self.info = functionStr.split(" ")

            try:
                self.varName = self.info[0].upper()
                self.function = self.info[1].upper()
                self.typeFunct = typeFunction[self.function]

                if self.function not in typeFunctionNumpy:
                    ARCPY.AddError("Operation is not supported {0}".format(self.function))
                    raise SystemExit()

                self.evaluate = typeFunctionNumpy[self.function]

            except:
                ARCPY.AddError("Wrong constraint {0}".format(self.info))
                raise SystemExit()

class Operation():
    def __init__(self, constraint):
        self.info = constraint.split(" ")
        self.indexField = 0
        self.weight = 1.0
        try:
            self.varName = self.info[0].upper()
            self.operation = self.info[1]

            if self.operation == "<":
                self.evaluate = self._lg
                self.evaluateA = self._lgA
            elif self.operation == ">":
                self.evaluate = self._gt
                self.evaluateA = self._gtA
            elif self.operation == "=":
                self.evaluate = self._eq
                self.evaluateA = self._eqA
            elif self.operation == "<=":
                self.evaluate = self._lge
                self.evaluateA = self._lgeA
            elif self.operation == ">=":
                self.evaluate = self._gte
                self.evaluateA = self._gteA
            elif self.operation == "Mean":
                self.evaluate = self._gte
                self.evaluateA = self._gteA
            else:
                ARCPY.AddError("Operation is not supported {0}".format(self.operation))
                raise SystemExit()

            self.value = float(self.info[2])
            self.valueChecked = self.value
            if self.value == 0:
                self.valueChecked = 1E-50
        except:
            ARCPY.AddError("Wrong constraint {0}".format(self.info))
            raise SystemExit()

    def _lge(self, val):
        return not val <= self.value

    def _gte(self, val):
        return  val >= self.value

    def _lg(self, val):
        return not val < self.value

    def _gt(self, val):
        return  val > self.value

    def _eq(self, val):
        return not val == self.value

    def _lgeA(self, val):
        return val <= self.value

    def _gteA(self, val):
        return  val >= self.value

    def _lgA(self, val):
        return  val < self.value

    def _gtA(self, val):
        return  val > self.value

    def _eqA(self, val):
        return  val == self.value

class GlobalGeneratorBase():
    """This Class manages the preprocessing information for generating
    balanced zones.
    INPUT:
        ssdo (SSDataObject Instance): Input data
        constraints (str): Building constraints 'Var <= Threshold;...'
        seed {int, None}: Seed to create solutions
        sizePopulation {int}: Population Size GA -> 100
        mutationFactor {float}: Mutation factor (shuffle/alien individual) GA -> 0.1
        outputFC (str): Output Path
        parameterOutput (Parameter Instance): Parameter of Output FC
        otherConstraints {str, None}: List of characteristic constraints (Compact,equal Area, Equal# fea)
        spatialConcept (str): TRIMMED_DELAUNAY_TRIANGULATION, etc
        weightsFile {str, None} : SWM file
        costValues (dict): Building constraint:Weight
        getDataFromSSDO {bool: True}: Do not use SSDO 
        costField {str:Non}: Cost Field ( used Marxan)
        acceptNulls{bool, False}: (- Accept Null- Marxan )
        typeConstraint {str,"VALUE"}: Threshold values (Marxan)
        applyFunction {str, Nono}: Variable:function (var median;..)
        proportionField {str, None}: Proportion Field
        conserveProportion {bool}: Proportion method
        numRegions {int, None}: Number of region
        numGenerations {int}: Number of generation for GA -> 50
        heterogeneity {float, float}: Control growing generation
        distanceFeatures {str, None}: List of distance Features

    ATTRIBUTES:
        These Attributtes are required for using the core class PyGrowingRegion
        self.numCores (int): Number Cores available
        self.numThreads (int): Number of threads
        self.numIslands (int): Number of disconnected region to process
        self.seed (int): seed
        self.numRegions {int, -1}: Number of Zones required
        self.numGenerations (int): Number of Generations
        self.sizePopulation (int): Size Population
        self.mutationFactor (float): Mutation factor
        self.proportionFieldIndex {int,-1}: Column index of proportion info
        self.proportion {1d Array float, None}: Proportion in input field
        self.indexUnique {1d Array int32, None}: Indices Unique values proportion field
        self.conserveProportion {bool, false}: False-> among zones, True-> within zone
        self.heterogeneity {float, 1.0}: Introduce heterogeneity in the growing process
        self.operations (list Operations Instances): List of building Operations (Building Constraints)
        self.applyFunction {list ApplyFunction instances, []}: List Stat Constraints
        self.coordsGroup (list 2d Array): Coords of each disconnected region
        self.linksGroup (list (list-list)): neighs of each disconnected region
        self.dataGroup (list nd-array): data of each disconnected region
        self.totalArea {dict}: Region id, total area
        self.areaFieldIndex {int, -1} areaFieldIndex in each data
        self.shapeFunctionConstraint {list, []}: list of characteristics to use 
                                                 (0-e_area, 1 compact,2 e_num_feat)

    """
    def __init__(self, ssdo, constraints, 
                 seed = None, sizePopulation=100,
                 mutationFactor = 0.1,
                 outputFC = None, parameterOutput = None,
                 otherConstraints = None,
                 spatialConcept = None, weightsFile = None, 
                 costValues = None, getDataFromSSDO = True,
                 costField = None, acceptNulls = False,
                 typeConstraint = "VALUE",
                 applyFunction = None,
                 proportionField = None ,
                 conserveProportion = None,
                 numRegions = None,
                 numGenerations = 50, 
                 heterogeneity = 1.0,
                 distanceFeatures = None):


        ### Output Feature Class ####
        self.outputFC = outputFC

        #### Distance Features String ####
        self.distanceFeatures = distanceFeatures

        #### Accept Null Values ####
        self.acceptNulls = acceptNulls  #Default is False

        #### SSDO ####
        self.ssdo = ssdo
        self.shapeType  = ssdo.shapeType

        #### Number of Regions ####
        self.numRegions = None
        if numRegions is not None:
            self.numRegions = int(numRegions) if  type(numRegions) == str else numRegions

            if self.numRegions < 2:
                ERR(id = 110267)

        #### Connectivity #####
        self.spatialConcept = spatialConcept
        if spatialConcept is  None:
            self.spatialConcept = 'TRIMMED_DELAUNAY_TRIANGULATION'
        self.spaceConcept = self.spatialConcept
        self.weightsFile = weightsFile
        contTypes = ['CONTIGUITY_EDGES_ONLY', 'CONTIGUITY_EDGES_CORNERS']
        self.swmFileBool = False

        #### Check SWM File ####
        if weightsFile is not None:
            if not OS.path.exists(weightsFile):
                ARCPY.AddIDMessage("ERROR", 414 , weightsFile)
                raise SystemExit()
            self.swmFileBool = True

        #### Weights per value / Fields ####
        self.costValues = costValues
        self.costField = costField

        #### TODO ####
        if costField is not None:
            self.costField = costField.upper()

        #### Number of cores ####
        self.numCores = MP.cpu_count()

        #### Default number of threads 50% number of cores ####
        self.numThreads =  UTILS.getNumberOfThreadsDefault()

        #### GA Parameters ####
        self.mutationFactor = mutationFactor
        self.sizePopulation = sizePopulation
        self.numGenerations = numGenerations

        #### Set Default ####
        if self.mutationFactor is None:
            self.mutationFactor = 0.1

        if self.sizePopulation is None:
            self.sizePopulation = 100

        if self.numGenerations is None:
            self.numGenerations = 50

        if self.sizePopulation < 3:
            ERR(id = 110272)

        #### Grow Control ####
        self.heterogeneity = heterogeneity

        fields = []
        typeConstraints = []

        #### Statitistical Constraints ####
        self.applyFunction = None
        if applyFunction is not None:
            self.applyFunction = [ApplyFunctionOperation(i) for i in applyFunction.split(";")]
            statConst = [ i.varName.upper() for i in self.applyFunction]
            fields = fields + statConst
            typeConstraints = [typeConstraintField["Statistic"]]*len(statConst)

        #### Proportional Constraint ####
        self.proportionField = proportionField
        if self.proportionField is not None:
            self.proportionField = proportionField.upper()
            self.proportionFieldAlias = [f.aliasName for f in self.ssdo.info.fields 
                                         if f.name.upper() == self.proportionField ][0]
            fields.append(self.proportionField)
            typeConstraints.append(typeConstraintField["Proportion"])

        #### Add Cost Field ####
        if self.costField is not None:
            fields.append(self.costField.upper())
            typeConstraints.append(typeConstraintField["Cost"])

        #### Shape Constraints ####
        fields, typeConstraints, getArea = self._shapeConstraint(otherConstraints, fields, typeConstraints)

        #### Variable Constraints ####
        addPseudoField = False
        if constraints is not None:
            self.operations = [ Operation(cond) for cond in constraints]
        else:
            #### When Constraint is not provided -> Fake constraint (Number of Features) ####
            constraints = []
            addPseudoField = True
            constraints.append("{0} >= -1".format(nameFakeFieldNumFeatures))
            self.operations = [ Operation(cond) for cond in constraints]

        for ope in self.operations:
            fields.append(ope.varName)
            typeConstraints.append(typeConstraintField["Operation"])

        self.meanCost = 1
        #### Obtain Data From SSDO instance ####
        if getDataFromSSDO:
            if acceptNulls:
                ssdo.obtainData(fields = fields, requireSearch = False, useNullinFields = fields)
                self.replaceNullByZero(ssdo, fields)
            else:

                #### Remove Fake Field ####
                fieldsV = fields.copy()

                if nameFakeFieldNumFeatures in fields:
                    fieldsV.remove(nameFakeFieldNumFeatures)

                isFS = ssdo.info.catalogPath.upper().startswith("HTTP")
                #### Check Feature Service ####
                if isFS and self.calculateArea:
                    getArea = False

                    #### Avoid Calculate Area from FS ####
                    if "SHAPE_AREA" not in [ff.name.upper() for ff in ssdo.info.fields]:
                        self.calculateArea = False
                        typeConstraints.remove(typeConstraintField["Shape"])
                        self.shapeFunctionConstraint.remove(shapeFunction["EQUAL_AREA"])

                        #### Disable Equal Area Option ####
                        WAR(id  = 110276)

                        fieldsV.remove("SHAPE_AREA")
                        fields.remove("SHAPE_AREA")

                #### Extract Shapes ####
                if self.calculateArea:
                    if not UTILS.isGDB(ssdo.inputFC) and isFS == False:
                        fieldsV.remove("SHAPE_AREA")
                    else:
                        getArea = False

                #### Obtain Data ####
                if getArea :
                    ssdo.obtainData(fields = list(set(fieldsV)), requireGeometry = True)
                    self.shapes =  ssdo.shapes
                else:
                    ssdo.obtainData(fields = list(set(fieldsV)), requireSearch = False)
                    self.shapes = None

                #### TODO if Cost is Provided ####
            if self.costField is not None:
                self.meanCost = self.ssdo.fields[self.costField].returnDouble().mean()

        #### Use Geocentric Coordinates to calculate the Chordal Distances for Linking Groups in GCS ####
        self.useGeocen = False
        if ssdo.spatialRefType.upper() ==  "GEOGRAPHIC":
            self.useGeocen = True

        #### Check Number of Regions Against Number of Features ####
        if self.numRegions is not None and  self.numRegions >= self.ssdo.numObs:
            ERR(id = 110274)

        #### Distance Constraints ####
        infoDistances = self._checkDistanceFeatureInput(ssdo.info)
        if infoDistances is not None:
            if self.applyFunction is None:
                self.applyFunction = [ApplyFunctionOperation(i["name"], True) for i in infoDistances]
                statConst = [ i.varName.upper() for i in self.applyFunction]
                fields = fields + statConst
                typeConstraints = [typeConstraintField["Statistic"]]*len(statConst)
            else:
                for i in infoDistances:
                    self.applyFunction.append(ApplyFunctionOperation(i["name"], True))
                    fields.append(i["name"])
                    typeConstraints.append(typeConstraintField["Statistic"])

        #### Add Distance information in SSDO ####
        if infoDistances is not None:
            dataDist  = self.getNearFeature(ssdo, infoDistances)

            for id, distDict in enumerate(infoDistances):
                dataField = SSDO.CandidateField(distDict["name"], "DOUBLE",
                                           data = dataDist[id])
                ssdo.fields[distDict["name"]] = dataField

        #### Set Target When Number of Regions is Set ####
        if self.numRegions is not None:
            if addPseudoField:
                dataField = SSDO.CandidateField(nameFakeFieldNumFeatures, "LONG", 
                                           data = NUM.ones(len(self.ssdo.xyCoords), NUM.int32))
                ssdo.fields[nameFakeFieldNumFeatures] = dataField

            for id, ope in enumerate(self.operations):
                if ope.varName == nameFakeFieldNumFeatures:
                    split = NUM.round(ssdo.fields[ope.varName].returnDouble().sum()/self.numRegions)
                else:
                    split = ssdo.fields[ope.varName].returnDouble().sum()/self.numRegions
                ope.value = split
                ope.valueChecked = split

        #### All Fields ####
        self.fields = fields
        self.typeConstraints = typeConstraints

        #### Get Number of Features ####
        self.n = len(self.ssdo.xyCoords)

        #### Get Discontinued Groups IDs (Islands) ####
        self.islandIds = self._getLinks()

        #### Evaluate Constraints Values in Each Island  #####
        self.toEval = self._checkGlobalByRegion(self.islandIds)

        #### Avoid to run - Each Feature Reached the Constraint ###
        if self.allLessTreshold:
            ERR(id = 110285)

        #### Conserve Proportionality ####
        self.conserveProportion = conserveProportion

        #### Parameter Output ####
        self.parameterOutput = parameterOutput

        self.areaValues = dict()
        self.totalArea = dict()

        #### Accumulate Output of Each Island ####
        self.dataOuput = []
        self.dataOuputStart = []
        self.dataTotal = []

        #### Process Proportion ####
        self.uniqueProportion = None
        self.indexUnique = None
        self.proportion = None
        self.indiceProp = None

        #### Proportion Information ####
        if self.proportionField is not None:
            info = NUM.unique(ssdo.fields[self.proportionField].data, return_counts = True, return_inverse = True)
            self.uniqueProportion, self.indiceProp, self.proportion = info

            if len(self.proportion) == self.n:
                ERR(id = 110273)

            self.proportion = self.proportion / self.proportion.sum()
            self.indexUnique = NUM.arange(len(self.uniqueProportion), dtype = float)
            if len(self.uniqueProportion) == 1:
                ARCPY.AddIDMessage("ERROR", 110278, ssdo.fields[self.proportionField].alias)
                raise SystemExit()

            #### conservePropotion False -> Majority Proportionality is conseved amongs groups ####
            #### conservePropotion True ->  Proportionality is conserved in each group ####
            if self.conserveProportion == False:
                dataNum = [self.uniqueProportion[idi] for idi, f in enumerate(self.proportion*self.ssdo.numObs) if f <= 1]
                if len(dataNum):
                    ARCPY.AddIDMessage("ERROR", 110279, ",".join([str(i) for i in [dataNum if len(dataNum) < 30 else dataNum[0:30]]]))
                    raise SystemExit()

                if len(self.toEval) > 1:
                    ### No localized - Disconnected groups are now linked ####
                    ERR("Geographically disconnected groups dataset cannot be used to conserve majority proportion between regions")
                    raise SystemExit()

                if self.numRegions is not None:
                    dataNum = [self.uniqueProportion[idi] for idi, f in enumerate(self.proportion*self.numRegions) if f < 1]

                    if len(dataNum):
                        ARCPY.AddIDMessage("ERROR", 110280, self.numRegions)
                        raise SystemExit()

                if len(self.toEval) == 1:
                    maxApprox = NUM.sum([self.maxClusters[self.toEval[i]] for i in self.toEval])
                    dataNum = [self.uniqueProportion[idi] for idi, f in enumerate(self.proportion*maxApprox) if f <= 1]
                    if len(dataNum):
                        WAR(id = 110270)

        if self.numRegions is not None and self.numRegions >= self.ssdo.numObs:
            ERR(id = 110268)

        #### Get Area Values ####
        if getArea:
            #### Get Area Values from FC using Shapes ####
            area = NUM.zeros(len(self.ssdo.xyCoords), float)
            for id, shape in enumerate(self.shapes):
                area[id] = shape.area

            #### Create Pseudo Shape Area Field ####
            dataField = SSDO.CandidateField("SHAPE_AREA", "DOUBLE", data = area)
            self.ssdo.fields["SHAPE_AREA"] = dataField

        #### Get Seed ####
        self.maxSeedValue = 100000
        self.seed = UTILS.getRandomSeed()
        if self.seed == 0:
            NUM.random.seed(int(TIME.time()))
            self.seed = int(NUM.random.randint(self.maxSeedValue ))

        #### Apply Seed ####
        NUM.random.seed(self.seed)
        msg = ARCPY.GetIDMessage(84821)

        buletList = [msg.format(self.seed)]
        #### Display GA parameters info ####
        buletList.append(ARCPY.GetIDMessage(84954) + str(self.sizePopulation))
        buletList.append(ARCPY.GetIDMessage(84955) + str(self.numGenerations))
        buletList.append(ARCPY.GetIDMessage(84956) + UTILS.formatValue(self.mutationFactor, '%0.2g'))
        ARCPY.AddMessage(UTILS.outputBulletList(buletList, ordered=False, force2Txt=False))

        self.viewSolution = False
        self.nFeatures = None
        self.data = self.ssdo.fields
        self.nVars = len(self.operations)
        self.numIslands = len(self.toEval)

        #### Generate Groups ####
        self._generateGroups()

        if self.numRegions is None:
            self.numRegions = -1

        #### Update Constraints ####
        self._updateConstraints()


    def _updateConstraints(self):
        """ Set field Indices of Input Data / Update Weights"""

        realFields = list(set(self.fields))

        for i in NUM.arange(len(self.operations)):
            varName = self.operations[i].varName

            #### Set Weights in each Building Criteria ####
            if self.costValues is not None  and varName in self.costValues:
                self.operations[i].weight = self.costValues[varName]

            #### Set the Field Index ####
            ind = realFields.index(varName)
            self.operations[i].indexField = ind

        if self.applyFunction is not None:
            for i in NUM.arange(len(self.applyFunction)):
                ind = realFields.index(self.applyFunction[i].varName)
                self.applyFunction[i].indexField = ind

        if "SHAPE_AREA" not in realFields:
            self.areaFieldIndex =  -1
        else:
            self.areaFieldIndex =  realFields.index("SHAPE_AREA")

        if self.proportionField not in realFields:
            self.proportionFieldIndex =  -1
        else:
            self.proportionFieldIndex =  realFields.index(self.proportionField)

    def _matDist(self, disReg):
        """ Calculate MST Using Closest Distance 
        INPUT:
            disReg (List RegionHelp Instances): Group of disconnected
                                                Regions
        RETURN:
            Minimum spanning tree links
        """
        listNeighs = []
        dist = []
        info = []
        #### Distance And Links ###
        for reg in disReg:
            for regL in disReg:
                if regL.id > reg.id:
                    distV = 0
                    if reg.isContained(regL):
                        distV = reg.minDist(regL)
                    else:
                        distV = reg.minDistCH(regL)

                    listNeighs.append((reg.id,regL.id))
                    listNeighs.append((regL.id,reg.id))
                    dist.append(distV)
                    dist.append(distV)

        #### Use MST to Create the Best Link ####
        mst, weights, clusterMap, count = ARC._ss.min_span_tree(NUM.array(listNeighs),
                                                            NUM.asarray(dist, float),
                                                            len(disReg))
        return mst

    def _joinDisconnectedRegions(self, idZonesDict):
        """ Create links between disconnected groups using MST
        """
        numDiscReg = len(idZonesDict)

        links = []
        disReg = []
        coordsV = self.ssdo.xyCoords
        dimDist = 2

        ### Check Cooordinate Type ###
        if self.useGeocen:
            coordsV = self.ssdo.spheroidCoords
            dimDist = 3

        #### Create a Bridge Between Each Disconnected Group ###
        if numDiscReg >= 3:

            coords = NUM.zeros((numDiscReg, dimDist), dtype = float)
            rad = NUM.zeros(numDiscReg, dtype = float)
            poly = []
            if not self.useGeocen:
                ### Create Helper Instances ####
                for id, el in enumerate(idZonesDict):
                    disReg.append(RegionHelp(id, idZonesDict[el], coordsV[idZonesDict[el]], self.useGeocen))
                    coords[id] = disReg[id].center
                    rad[id] = disReg[id].rad
                    if testLinks:
                        poly.append(disReg[id].poly)

                #### For Test Extent/ConvexHull ####
                if testLinks:
                    cont = UTILS.DataContainer(self.ssdo.spatialRef, shapes = poly)
                    cont.generateOutput(self.outputFC+"_ch", [rad], ["Radius"])
            else:
                ### Create Helper Instances ####
                for id, el in enumerate(idZonesDict):
                    disReg.append(RegionHelp(id, idZonesDict[el], coordsV[idZonesDict[el]], self.useGeocen,
                                            self.ssdo.xyCoords[idZonesDict[el]]))
                    coords[id] = disReg[id].center
                    rad[id] = disReg[id].rad


            mst = self._matDist(disReg)

            #### Add Egdes direction ####
            linksShp = []
            labels = []
            for ids in mst:
                #### Get Order Id Source - Target ####
                info = disReg[ids[0]].closeId(disReg[ids[1]])
                links.append((info[0], info[1]))
                links.append((info[1], info[0]))
                if testLinks:
                    linksShp.append(disReg[ids[0]].createLink(info[0], info[1],coordsV))
                    labels.append("{0} {1}".format(info[0], info[1]))

            #### Used to Test New Links Created Using MST ####
            if testLinks:
                cont = UTILS.DataContainer(self.ssdo.spatialRef, shapes = linksShp)
                cont.generateOutput(self.outputFC+"_links", [labels], ["Ids"])

        elif numDiscReg == 2:
            #### Helper Instances To Calculater Soft distance ####
            for id, el in enumerate(idZonesDict):
                disReg.append(RegionHelp(id, idZonesDict[el], coordsV[idZonesDict[el]], self.useGeocen))

            #### Add Both direction egdes ####
            info = disReg[0].closeId(disReg[1])
            links.append((info[0], info[1]))
            links.append((info[1], info[0]))


        return links


    def _checkGlobalByRegion(self, idZonesDict):
        """Check Maximum Values in each group """

        self.maxNumberTheoGrp = dict()
        self.theoConditionCloseness = dict()
        self.maxClusters = dict()
        self.groupByItself = []
        self.allLessTreshold = False
        eval = []
        self.maxNumberZones = -1E308
        for i, idv in enumerate(idZonesDict):
            idsZone = idZonesDict[idv]

            #### Get Totals each Variable ####
            dataT = [NUM.sum(self.ssdo.fields[ope.varName].returnDouble()[idsZone] >= ope.value)
                                           for ope in self.operations]
            if len(idsZone) in dataT:
                self.allLessTreshold = True
                return

            #### Get Totals each Variable ####
            data = [self.ssdo.fields[ope.varName].returnDouble()[idsZone].sum() 
                                           for ope in self.operations]

            #### Evaluate If there are Negative Values ####
            noNegValues = [self.ssdo.fields[ope.varName].returnDouble()[idsZone].min() > 0 
                                           for ope in self.operations]

            #### Get Fields that Cannot Reach the Threshold ####
            badConstraint = [data[idi] <= ope.value
                                    for idi, ope in enumerate(self.operations) if ope.value  != -1]

            if NUM.sum(badConstraint) == len(badConstraint):
                #WAR(id = 110282)
                self.groupByItself.append(i)
                continue


            self.maxNumberTheoGrp[idv] = [int(NUM.ceil(data[i]/ope.valueChecked))
                                        for i, ope in enumerate(self.operations)]

            self.theoConditionCloseness[idv] = [data[i] % ope.valueChecked
                                               for i, ope in enumerate(self.operations)]


            self.maxClusters[idv] = NUM.min(self.maxNumberTheoGrp[idv])

            if self.maxClusters[idv] > self.maxNumberZones:
                self.maxNumberZones = self.maxClusters[idv]

            maxElements = [self.ssdo.fields[ope.varName].returnDouble()[idsZone].max()
                                for ope in self.operations]

            if 1 in self.maxNumberTheoGrp[idv]:
                for ie, el in enumerate(self.maxNumberTheoGrp[idv]):
                    if el == 1:
                        #WAR(id = 110282)
                        self.groupByItself.append(i)
                        continue
            eval.append(i)

        if self.maxNumberZones == -1e308:
            self.maxNumberZones = 1

        return eval

    def _shapeConstraint(self, otherConstraints, fields, typeConstraints):
        """ Shape Constraint Decision Specially for Equal Area """

        self.otherConstraints = otherConstraints

        if otherConstraints is None:
            self.calculateArea =  False
            self.countFeatures = False
            self.calculateCompactness = False
            self.shapeFunctionConstraint = []
            return fields, typeConstraints,  self.shapeType.upper() == "POLYGON" and self.calculateArea

        otherConstraintsList = otherConstraints.split(";")
        exit = False
        self.calculateArea =  False
        self.countFeatures = False
        self.calculateCompactness = False
        getArea = False
        self.shapeFunctionConstraint = []

        for otherType in otherConstraintsList:
            if otherType not in shapeFunction:
                ERR("{0} is not supported".format(otherType))
                exit = True

            if otherType == "EQUAL_AREA":
                self.calculateArea = True
                if self.shapeType.upper() == "POLYGON":
                    #### getArea indicates that it's needed to extract shapes #####
                    #### to Calculate area                                    #####
                    getArea = True

                    fields.append("SHAPE_AREA")
                    typeConstraints.append(typeConstraintField["Shape"])
                    self.shapeFunctionConstraint.append(shapeFunction[otherType])

            else:
                if otherType == "COMPACTNESS":
                    self.calculateCompactness = True
                    self.shapeFunctionConstraint.append(shapeFunction[otherType])
                if otherType == "EQUAL_NUMBER_OF_FEATURES":
                    self.countFeatures = True
                    self.shapeFunctionConstraint.append(shapeFunction[otherType])


        if exit:
            raise SystemExit()

        return fields, typeConstraints, getArea

    def _applyDictLinks(self, m2i):
        """Apply Dict neighs """
        listNeigh = {}
        for e in m2i:
            listNeigh[m2i[e]] = [m2i[id] for id in self.neighs[e]]
        return listNeigh

    def _generateGroups(self):
        """ Generate main variables for each disconnected group.
            This is useful when unlinked group
        """

        self.coordsGroup = []
        self.linksGroup = []
        self.dataGroup = []
        realFields = list(set(self.fields))
        nFields  = len(list(set(realFields)))
        data = NUM.zeros((len(self.ssdo.xyCoords),nFields), NUM.float64)

        #### Update Data Block ####
        for id, fieldName in enumerate(realFields):
            #### Special case for Proportional Fields ####
            if fieldName == self.proportionField:
                data.T[id] = self.indiceProp
            else:
                data.T[id] = self.ssdo.fields[fieldName].returnDouble()

        if len(self.toEval) > 1:
            for id, index in enumerate(self.toEval):
                indicesValues = self.islandIds[index]
                self.coordsGroup.append(self.ssdo.xyCoords[indicesValues,:].copy())
                self.dataGroup.append(data[indicesValues,:].copy())
                m2i = {ind:iid for iid, ind in enumerate(indicesValues)}
                self.linksGroup.append(self._applyDictLinks(m2i))

                if "SHAPE_AREA" in realFields:
                    valueArea = self.ssdo.fields["SHAPE_AREA"].data[indicesValues]
                    self.totalArea[id] = valueArea.sum()
        else:
            self.coordsGroup.append(self.ssdo.xyCoords)
            self.dataGroup.append(data)
            m2i = {ind:iid for iid, ind in enumerate(self.islandIds[0])}
            self.linksGroup.append(self._applyDictLinks(m2i))

            if "SHAPE_AREA" in realFields:
                valueArea = self.ssdo.fields["SHAPE_AREA"].data
                self.totalArea[0] = valueArea.sum()

        ### For test Main Function ##### 
        if createPickleOutput:
            if ".GDB" not in self.outputFC.upper():
                outputPath, nameOutput = OS.path.split(self.outputFC)
                try:
                    NUM.save(OS.path.join(outputPath,"bbzcoord_" + nameOutput.upper().replace(".SHP",".npy")), self.coordsGroup[0])
                    NUM.save(OS.path.join(outputPath,"bbzdata_" + nameOutput.upper().replace(".SHP",".npy")), self.dataGroup[0])
                    import pickle
                    outfile = open(OS.path.join(outputPath,"bbzlink_" + nameOutput.upper().replace(".SHP",".pickle")),'wb')
                    pickle.dump(self.linksGroup[0], outfile)
                    outfile.close()
                except:
                    pass


    def _getLinks(self):
        """ Generate spatial links
        """

        if self.spaceConcept == "NONE":
            return {0:NUM.arange(self.n)}

        ssdo = self.ssdo
        weightsFile = self.weightsFile
        master2Order = ssdo.master2Order
        masterField = self.ssdo.masterField
        numObs = self.ssdo.numObs
        neigh = {i:COLL.OrderedDict() for i in NUM.arange(len(self.ssdo.xyCoords)) }
        listNeighs = []

        self.numNeighs = None

        if self.numNeighs is None:
            knn = 0
        else:
            knn = self.numNeighs

        #### Keep Track of Features with No Neighbors ####
        self.numFeatures = 0
        self.idsNoNeighs = []
        links = []
        weights = []

        contTypes = ['CONTIGUITY_EDGES_ONLY', 'CONTIGUITY_EDGES_CORNERS']
        if self.spaceConcept in contTypes:
            #### Use Polygon Neighbor Tool ####
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84126))

            forceNeighbor = False
            neighSearch = None

            #### Keep Track of Contiguity ####
            if self.spaceConcept == 'CONTIGUITY_EDGES_ONLY':
                contiguityType = "ROOK"
            else:
                contiguityType = "QUEEN"

            #### Create Polygon Neighbors ####
            polyNeighborDict = WU.polygonNeighborDict(self.ssdo.inputFC, 
                                                            masterField, 
                                        contiguityType = contiguityType)

            #### Keep Track of Polygons w/o Neighbors ####
            islandPolys = []

            #### Write Polygon Contiguity to SWM File ####
            featureCount = 0
            for orderID in NUM.arange(len(self.ssdo.xyCoords)):
                masterID = self.ssdo.order2Master[orderID]
                neighs = [i for i in polyNeighborDict[masterID] if i in self.ssdo.master2Order]
                nn = len(neighs)

                finalNN = len(neighs)
                if finalNN:
                    featureCount += 1
                    for nh in neighs:
                        neighOrderID = self.ssdo.master2Order[nh]
                        neigh[orderID][neighOrderID] = None
                        listNeighs.append((orderID,neighOrderID))

            self.numFeatures = featureCount

            #### Report on Features with No Neighbors ####
            countIslands = len(islandPolys)
            if countIslands:
                islandPolys.sort()
                if countIslands > 30:
                    islandPolys = islandPolys[0:30]

                ERROR.warningNoNeighbors(self.ssdo.numObs, countIslands, islandPolys, 
                                         ssdo.oidName, forceNeighbor = forceNeighbor, 
                                         contiguity = True)

        elif self.spaceConcept == "GET_SPATIAL_WEIGHTS_FROM_FILE":
            #### Using Weights File ####
            if self.swmFileBool:
                #### Open Spatial Weights and Obtain Chars ####
                swm = None
                swm = WU.SWMReader(weightsFile)
                N = swm.numObs
                rowStandard = swm.rowStandard
                self.swm = swm

                #### Check to Assure Complete Set of Weights ####
                if ssdo.numObs > N:
                    ARCPY.AddIDMessage("ERROR", 842, ssdo.numObs, N)
                    raise SystemExit()

                #### Check if Selection Set ####
                isSubSet = False
                if ssdo.numObs < N:
                    isSubSet = True
                iterVals = UTILS.ssRange(N)
            else:
                #### Warning for GWT with Bad Records/Selection ####
                if ssdo.selectionSet or ssdo.badRecords:
                    ARCPY.AddIDMessage("WARNING", 1029)

                #### Build Weights Dictionary ####
                weightDict = WU.buildTextWeightDict(weightsFile, master2Order)
                iterVals = UTILS.iterkeys(master2Order)
                N = ssdo.numObs

            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84322), 0, N, 1)

            stop = False
            valuesZ = NUM.zeros(ssdo.numObs)
            for i in iterVals:
                if self.swmFileBool:
                    #### Using SWM File ####
                    info = swm.swm.readEntry()
                    masterID = info[0]
                    try:
                        if masterID in master2Order:
                            rowInfo = WU.getWeightsValuesSWM(info, master2Order,
                                                                valuesZ,
                                                                isSubSet = isSubSet)
                            includeIt = True
                        else:
                            includeIt = False
                    except:
                        stop = True
                        break


                else:
                    #### Text Weights ####
                    masterID = i
                    includeIt = True
                    rowInfo = WU.getWeightsValuesText(masterID, master2Order,
                                                      weightDict,  valuesZ)

                #### Subset Boolean for SWM File ####
                if includeIt:
                    #### Parse Row Info ####
                    orderID, iVals, nhIDs, nhVals, sWeights = rowInfo

                    #### Assure Neighbors Exist After Selection ####
                    nn = len(nhVals)
                    if nn:
                        self.numFeatures += 1
                        for id in NUM.arange(nn):
                            neigh[orderID][nhIDs[id]] = None
                            listNeighs.append((orderID,int(id)))

                ARCPY.SetProgressorPosition()

            if stop:
                swm.close()
                ARCPY.AddIDMessage("ERROR", 938)
                raise SystemExit()

            #### Clean Up ####
            if self.swmFileBool:
                swm.close()

            #### Enable double Link in SWM input ####
            if createDoubleLinkSWM:
                for i  in NUM.arange(len(listNeighs)):
                    elem = listNeighs[i]
                    if neigh[elem[1]]:
                        if type(elem[0]) == int and elem[0] != neigh[elem[1]] :
                                listNeighs.append((elem[1],elem[0]))
                                neigh[elem[1]][elem[0]] = None

                        if elem[0] not in neigh[elem[1]]:
                            listNeighs.append((elem[1],elem[0]))
                            neigh[elem[1]][elem[0]] = None

            #### Output MST ####
            if testLinks:
                shapes = []
                idMst = []
                for id, link in enumerate(listNeighs):
                    shapes.append(
                        ARCPY.Polyline(
                            ARCPY.Array(
                                [ ARCPY.Point(self.ssdo.xyCoords[link[0],0],self.ssdo.xyCoords[link[0],1]),
                                    ARCPY.Point(self.ssdo.xyCoords[link[1],0],self.ssdo.xyCoords[link[1],1])])))
                    idMst.append(id)
                cont = UTILS.DataContainer(self.ssdo.spatialRef, shapes = shapes)
                cont.generateOutput(self.outputFC+"_raw_links", [NUM.array(idMst)], ["IdMST"])

        else:

            #### Check/Warn/Report/Map Coincident Points ####
            numCoincident = self.ssdo.numObs - self.ssdo.numUnique

            if numCoincident:
                #### Warning ####
                coinSum = (self.ssdo.counts != 1).sum()
                ARCPY.AddIDMessage("WARNING", 110124, str(coinSum), str(self.ssdo.numObs))

                #### Report ####
                ARCPY.AddMessage(self.ssdo.createCoincidentReport())

                #### Get Coincident Point Mapping ####
                coinKeys, coinMap = STATS.mapFromUniqueCounts(self.ssdo.xyCoords, 
                                                              self.ssdo.counts)

            else:
                coinKeys = None
                coinMap = None

            #### Using Trimmed Delaunay Neighbor Searching ####
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84143)) 

            #### Get Neighborhood ####
            trimDel = ARC._ss.delaunay_point_neighbors(self.ssdo.xyCoords, 
                                                       self.ssdo.spatialRef,
                                                       coinKeys, coinMap)

            #### Check/Add for No Neighs ####
            trimDel = WU.addNoNeighs2Delaunay(self.ssdo.xyCoords, self.ssdo.uniqueXY,
                                              trimDel)

            #### Find Fixed Distance Neighbors ####
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84756), 
                                0, self.ssdo.numObs, 1)

            for orderID in UTILS.ssRange(self.ssdo.numObs):
                nhs = trimDel[orderID]
                for nh in nhs:
                    neigh[orderID][nh] = None
                    listNeighs.append((orderID,nh))

                ARCPY.SetProgressorPosition()

        mst, weights, clusterMap, count = ARC._ss.min_span_tree(NUM.array(listNeighs),
                                                                NUM.ones(len(listNeighs)),
                                                                self.ssdo.numObs)

        self.neighs = neigh

        disconnected = (count != self.ssdo.numObs - 1)

        #### Output MST ####
        if testLinks:
            shapes = []
            idMst = []
            for id, link in enumerate(mst):
                shapes.append(
                    ARCPY.Polyline(
                        ARCPY.Array(
                            [ ARCPY.Point(self.ssdo.xyCoords[link[0],0],self.ssdo.xyCoords[link[0],1]),
                                ARCPY.Point(self.ssdo.xyCoords[link[1],0],self.ssdo.xyCoords[link[1],1])])))
                idMst.append(id)
            cont = UTILS.DataContainer(self.ssdo.spatialRef, shapes = shapes)
            cont.generateOutput(self.outputFC+"_mst_links", [NUM.array(idMst)], ["IdMST"])


        #### Construct Starting Groups ####
        self.part2IDs = COLL.defaultdict(list)

        #### Get each Disconnected Group ####
        if disconnected:
            mst = mst[0:count,:]
            clustKeys = NUM.unique(clusterMap)
            startingK = len(clustKeys)

            ARCPY.AddIDMessage("WARNING", 110281, str(startingK))
            for ind, clust in enumerate(clustKeys):
                ids = list(NUM.where(clusterMap == clust)[0])
                self.part2IDs[ind] = ids

            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84951))

            #### Add New links ####
            links = self._joinDisconnectedRegions(self.part2IDs)
            listNeighs.extend(links)


            #### Include New Neighbors ####
            for nh in links:
                self.neighs[nh[0]][nh[1]]= None
            self.neighs = {i:list(self.neighs[i].keys()) for i in self.neighs}
            return {0:NUM.arange(self.ssdo.numObs)}

        else:
            self.neighs = {i:list(self.neighs[i].keys()) for i in self.neighs}
            return {0:NUM.arange(self.ssdo.numObs)}

        return self.part2IDs


    def _recalculateTotals(self, ids):
        """ Recalculate total of the building criteria variables 
        """
        unq, counts = NUM.unique(ids, return_counts = True)

        #### Clusters - Variables(Operations) ####
        nClass = len(unq)

        #### Remove unused labels ####
        if -1 in unq :
            nClass -= 1

        #### Remove class representing all features that meet the constraints ####
        if -2 in unq :
            nClass -= 1

        info = {id:NUM.zeros(nClass, dtype = float) for id, ope in enumerate(self.operations) }

        index = 0
        for id, value in enumerate(unq):
            if value > -1:
                indexClass = ids== value
                for i, ope in enumerate(self.operations):
                    info[i][index] = self.data[ope.varName].data[indexClass].sum() 
                index += 1

        return info

    def _genColor(self, nColors, distBtwCol = 80, seed = 33):
        """
        Generate Random Colors liste to be applied in the layer template
        """
        diff = distBtwCol
        NUM.random.seed(seed)

        dictC = []
        lastC = None
        while len(dictC) < nColors:
            cols = NUM.random.randint(60, 240, 50)
            c = 0
            t = []
            for i in cols:
                t.append(i)
                if len(t) == 3:
                    col =",".join([str(i) for i in t])
                    if col not in dictC:
                        if lastC is not None:
                            v = NUM.sqrt(((NUM.array(lastC)-NUM.array(t))**2).sum())
                            if v > diff:
                                dictC.append(col)
                                lastC = t
                        else:
                            dictC.append(col)
                            lastC = t

                        if len(dictC) == nColors:
                            return dictC
                        t = []

    def _createChartVariables(self):
        """ Create variable chart """

        charts = []
        applyFct = {0:"MEAN", 1:"VARIANCE", 2:"MEDIAN", 3:"SUM"}
        applyFctID = {0:ARCPY.GetIDMessage(84261),
                      1:ARCPY.GetIDMessage(84150)[:-1], 
                      2:ARCPY.GetIDMessage(84414),
                      3:ARCPY.GetIDMessage(84545)}
        if self.applyFunction is not None:

            for fnc in self.applyFunction:
                if not fnc.isDistance:

                    if fnc.typeFunct == 1:
                        #### BoxPlot Chart - Variance ####
                        bChart = ARCPY.Chart("Variable to Consider {0} {1}".format(fnc.varName," - Chart"))
                        bChart.type = "boxPlot"
                        bChart.title = ARCPY.GetIDMessage(84945).format(self.ssdo.fields[fnc.varName].alias)
                        outFieldName = self.ssdo.in2OutFieldMap[fnc.varName]
                        #### Assign X Axis Field ####
                        bChart.xAxis.field = nameClusterOutput
                        bChart.xAxis.title = ARCPY.GetIDMessage(84944)
                        bChart.xAxis.sort  = "ASC"
                        bChart.yAxis.field = outFieldName
                        bChart.yAxis.title = self.ssdo.fields[fnc.varName].alias
                        aggType = applyFct[fnc.typeFunct]
                        charts.append(bChart)

                    else:
                        #### Bar Chart ####
                        bChart = ARCPY.Chart("Variable to Consider Bar {0} {1}".format(fnc.varName," - Chart"))
                        bChart.type = "bar"
                        bChart.title = ARCPY.GetIDMessage(84946).format(applyFctID[fnc.typeFunct], self.ssdo.fields[fnc.varName].alias)
                        outFieldName = self.ssdo.in2OutFieldMap[fnc.varName]
                        #### Assign X Axis Field ####
                        bChart.xAxis.field = nameClusterOutput
                        bChart.xAxis.title = ARCPY.GetIDMessage(84944)
                        bChart.xAxis.sort  = "ASC"
                        bChart.yAxis.field = outFieldName
                        #bChart.yAxis.title = "{0} - {1}".format( applyFctID[fnc.typeFunct],self.ssdo.fields[fnc.varName].alias)
                        bChart.yAxis.title = self.ssdo.fields[fnc.varName].alias
                        aggType = applyFct[fnc.typeFunct]
                        bChart.bar.aggregation = aggType
                        charts.append(bChart)

                else:
                    #### Bar Chart ####
                    bChart = ARCPY.Chart("Distance Variable to Consider {0} {1}".format(fnc.varName," - Chart"))
                    bChart.type = "bar"
                    bChart.title = ARCPY.GetIDMessage(84947).format(fnc.varName)

                    #### Assign X Axis Field ####
                    bChart.xAxis.field = nameClusterOutput
                    bChart.xAxis.title = ARCPY.GetIDMessage(84944)
                    bChart.xAxis.sort  = "ASC"
                    bChart.yAxis.field = fnc.varName
                    #bChart.yAxis.title = "{0} - {1}".format(ARCPY.GetIDMessage(84261), fnc.varName)
                    bChart.yAxis.title = "Distance to " + fnc.varName
                    bChart.bar.aggregation = "MEAN"
                    charts.append(bChart)


        for fnc in self.operations:
            #### Bar Chart ####
            bChart = ARCPY.Chart("Building Criteria " + fnc.varName+" - Chart")
            bChart.type = "bar"
            nameV = fnc.varName
            aliasV  = nameV if self.ssdo.fields[fnc.varName].alias == None else self.ssdo.fields[fnc.varName].alias
            if aliasV == nameFakeFieldNumFeatures:
                bChart.title = ARCPY.GetIDMessage(84948)
            else:
                bChart.title = ARCPY.GetIDMessage(84949).format(aliasV)

            #### Assign X Axis Field ####
            bChart.xAxis.field = nameClusterOutput
            bChart.xAxis.title = ARCPY.GetIDMessage(84944)
            bChart.xAxis.sort  = "ASC"

            if aliasV == nameFakeFieldNumFeatures:
                bChart.yAxis.field = "SOURCE_ID"
                #bChart.yAxis.title = "{0} - {1}".format(ARCPY.GetIDMessage(84785), ARCPY.GetIDMessage(84138)[:-1])
                strT = str(ARCPY.GetIDMessage(84138)).strip()
                bChart.yAxis.title = strT[:-1]
                bChart.bar.aggregation= "COUNT"
            else:
                bChart.yAxis.field = self.ssdo.in2OutFieldMap[fnc.varName]
                #bChart.yAxis.title = "{0} - {1}".format(ARCPY.GetIDMessage(84545), aliasV)
                bChart.yAxis.title = aliasV
                bChart.bar.aggregation= "SUM"

            charts.append(bChart)


        if self.proportionField is not None:
            #### Bar Chart ####
            bChart = ARCPY.Chart("Proportion Variable "+ self.proportionFieldAlias + "- Chart")
            bChart.type = "bar"
            bChart.title = ARCPY.GetIDMessage(84950).format(self.proportionFieldAlias)

            #### Assign X Axis Field ####
            bChart.xAxis.field = nameClusterOutput
            bChart.xAxis.title = ARCPY.GetIDMessage(84944)
            bChart.xAxis.sort  = "ASC"
            bChart.yAxis.field = ""
            bChart.yAxis.title = "{0} - {1}".format(ARCPY.GetIDMessage(84785), self.proportionFieldAlias)
            bChart.bar.aggregation= "COUNT"
            bChart.bar.splitCategory = self.proportionField
            charts.append(bChart)


        self.parameterOutput.charts = charts

    def _createOutput(self, labels, totals, includeNull = True):
        """
        Create output feature class and apply template layer
        INPUT:
            labels (1D array): Zone Id for each feature
            totals (list 1D arrays): Array for each zone operation
        """
        uniqueValues, counts = NUM.unique(labels, return_counts = True)

        #### Identify Null Values ####
        if includeNull:
            uniqueValues = {int(i):id for id, i in enumerate(uniqueValues) if i > -1}
        else:
            uniqueValues = {int(i):id for id, i in enumerate(uniqueValues) }

        #### If Number of Zones Requested is not Reached ###
        if self.numRegions != -1 and self.numRegions != len(uniqueValues):
            WAR(id = 110269)

        listOpe = [ope.varName for ope in self.operations]

        #### Proportion Field ####
        if self.proportionField:
            listOpe.append(self.proportionField)

        #### Other Fields ####
        if self.applyFunction is not None:
            for i in self.applyFunction:
                if not i.isDistance:
                    listOpe.append(i.varName)

        listOpe = list(set(listOpe))

        if nameFakeFieldNumFeatures in listOpe:
            listOpe.remove(nameFakeFieldNumFeatures)

        #### Use Global Name ####
        nameCluster = nameClusterOutput

        #### Rename Output Field If it is used as Input ####
        if nameCluster in listOpe:
            cont = 1
            while nameCluster in listOpe:
                outName= nameCluster + str(cont)
                cont+=1

        #### Create Candidate Field  ####
        candField = SSDO.CandidateField(name = nameCluster, alias = ARCPY.GetIDMessage(84952), type = "LONG",
                                        data = NUM.asarray(labels, dtype = NUM.int32))

        listFields = listOpe + [nameCluster]

        candidateFields = {nameCluster:candField}

        if len(self.part2IDs) > 1:
            regions = NUM.zeros(len(labels), dtype = NUM.int32)

            #### Create Id for each region ####
            for id, island in enumerate(self.part2IDs):
                regions[self.part2IDs[island]] = id

            candidateFields["DISC_GRP"] = SSDO.CandidateField(name = "DISC_GRP", alias = ARCPY.GetIDMessage(84953),
                                                             type = "LONG", data = regions)


        #### Add Distance Variables as Output Field ####
        import os as OS
        outPath, outName = OS.path.split(self.outputFC)

        if self.applyFunction is not None:
            for i in self.applyFunction:
                if i.isDistance:
                    #### Get Valid Name ####
                    outName = ARCPY.ValidateFieldName(i.varName, outPath)
                    isGdb = UTILS.isGDB(self.outputFC)
                    cont = 1
                    #### Check if Field Exists in the List ####
                    while outName in listFields:
                        if not isGdb:
                            outName = outName[0:9]+str(cont)
                        else:
                            outName = outName + str(cont)
                        cont+=1
                    #### Add Candidate Field ####
                    candidateFields[outName] = self.ssdo.fields[i.varName]

                    #### Update the Internal Field Name ###
                    self.ssdo.fields[i.varName].name = outName

                    listFields.append(outName)

        #### Create Output Feature Class Adding Extra Fields ####
        self.ssdo.output2NewFC(self.outputFC, candidateFields = candidateFields,
                                appendFields = listOpe,fieldOrder = listFields)

        #### Apply Charts ####
        self._createChartVariables()

        layerFileTemplate = "RFPointClassification.lyrx"
        typeSymbolLocation = 376
        heading = 379
        fieldName = 369
        removeLines = 390
        viewOthers = 382

        if self.shapeType == "Polygon":
            layerFileTemplate = "RFPolygonClassification.lyrx"
            typeSymbolLocation = 323
            heading = 326
            fieldName = 316
            removeLines = 337
            viewOthers = 329

        pathLayer =  OS.path.join(UTILS.pathLayers, layerFileTemplate)
        lines = []

        if OS.path.isfile(pathLayer): 
            f = open(pathLayer, 'r')
            lines = f.readlines()
            f.close()
        else:
            return

        decribeSymbolType = lines[typeSymbolLocation]
        msg = ARCPY.GetIDMessage(84338)
        head = lines[heading].replace("NAME_FIELD", ARCPY.GetIDMessage(84952))
        lines[heading] = head
        head = lines[fieldName].replace("PREDICTED", nameCluster)
        lines[fieldName] = head
        lines[viewOthers] = lines[viewOthers].replace("true", "false")
        newElem = []

        if type(uniqueValues) == float or type(uniqueValues) == NUM.int32:
            uniqueValues = NUM.array([uniqueValues])

        colors = self._genColor(len(totals[0]))
        #### Generate New Elements in the Template Replacing Values ####
        for id, i in enumerate(uniqueValues):
            ele = decribeSymbolType.replace("150,150,150", colors[id])
            ele = ele.replace("99999", str(i))
            ele = ele.replace("CATEGORY", "{0} / {1} {2}".format(int(i), ARCPY.GetIDMessage(84138), counts[uniqueValues[i]]))

            if str(type(i)).startswith('U'):
                ele = ele.replace('"VALUE2CHANGE"', str(int(i)))
            else:
                ele = ele.replace('VALUE2CHANGE', str(int(i)))

            newElem.append(ele)

        replac = ",".join(newElem)
        lines[typeSymbolLocation] = replac
        iniText = lines[0:typeSymbolLocation]
        endText = lines[typeSymbolLocation:len(lines)]
        iniText += endText;

        #### Avoid to Use Previous Layer ####
        startLayerCIM = 8

        #### Remove CIM extra Lines ####
        for i in NUM.arange(startLayerCIM):
            iniText[i]= ""

        for i in NUM.arange(removeLines, len(iniText), 1):
            iniText[i]= ""

        info = " ".join(iniText)

        #### Apply JSON CIM ####
        ARCPY.gp.SetParameterSymbology(1, "JSONCIMDEF="+info.strip())


    def returnCandidateFields(self, data, fieldNames, aliasNames ):
        """ Create Candidate Fields """

        numberSupportedConstraints = 8
        #### GA Algorithm Return for Each Generation the Best Fit ####
        #### Including the Best solution of the Initial Population ####
        data = data.reshape(self.numGenerations+1,numberSupportedConstraints)
        maxFitness = 1
        fields = []
        for id in NUM.arange(numberSupportedConstraints):
            el = data.T[id]
            #### If all values are -1 then the constraint is not used ####
            if NUM.sum(el) != -1*len(el):
                field = SSDO.CandidateField(name = fieldNames[id],
                                           alias = aliasNames[id],
                                           type = "DOUBLE",
                                           data = el)
                fields.append(field)
            if id == 0:
                maxFitness = el.max()

        return fields, maxFitness

    def mergeArray(self, dataList, baseNumList = 0 ):
        """ Merge Output Info when multiple solutions
        """
        nVars = int(baseNumList)

        if dataList[0] is None:
            return None

        data = NUM.array([], dtype= dataList[0].dtype)
        nZones = 0
        if baseNumList:

            for i in NUM.arange(len(dataList)):
                if len(dataList[i]) > 0:
                    data = NUM.append(data, dataList[i])
                    nZones += int(len(dataList[i]) / nVars)

            data = data.reshape(nZones, nVars)
            return data
        else:
            for i in NUM.arange(len(dataList)):
                if len(dataList[i]) > 0:
                    data = NUM.append(data, dataList[i])
                    nZones += len(dataList[i])

            data = data.reshape(nZones, 1)
            return data

    def reportErrors(self, infoData):
        """ Generate report for each objective function
        """

        listSeeds, listStarts, listTotals, \
        listStats, listArea, listProportion, \
        listDIst, listComp, listNumEle = infoData

        nVars = len(self.operations)
        dataTotals = self.mergeArray(listTotals, nVars)

        dataStats = None
        dataDist = None
        if self.applyFunction is not None:
            na = len([i for i in self.applyFunction if not i.isDistance])
            if na:
                dataStats = self.mergeArray(listStats,na )
            na = len(self.applyFunction) - na
            if na:
                dataDist  = self.mergeArray(listDIst, na )

        dataArea = self.mergeArray(listArea)
        dataComp = self.mergeArray(listComp)
        dataNumElem = self.mergeArray(listNumEle)

        dataProportion = self.mergeArray(listProportion)

        nList = len(listStarts);
        nZones = NUM.sum([len(z) for z in listStarts])

        header = ARCPY.GetIDMessage(84939)
        headerColumns =[ARCPY.GetIDMessage(84842), ARCPY.GetIDMessage(84940), ARCPY.GetIDMessage(84261), ARCPY.GetIDMessage(84941)]
        justifyArray = ["left", "left", "left", "left"]
        dataLabel = []
        stringFormat = "%0.3f"
        dataLabel.append(headerColumns)
        typeOp = ARCPY.GetIDMessage(84545)
        typeShp = ARCPY.GetIDMessage(84942)
        typeStat = ARCPY.GetIDMessage(84943)
        typeProp = ARCPY.GetIDMessage(84266)
        typeDist = ARCPY.GetIDMessage(84179)

        #### Create Summary for Building Criteria Variables ####
        for i in NUM.arange(nVars):
            rms = NUM.sqrt(NUM.sum((dataTotals.T[i] - self.operations[i].value)**2) / len(dataTotals))
            mean = NUM.mean(dataTotals.T[i])
            varName = self.operations[i].varName
            typeOpA = typeOp

            #### Change Sum -> Count using Number of features ####
            if varName == nameFakeFieldNumFeatures:
                typeOpA = ARCPY.GetIDMessage(84785)
                varName = ARCPY.GetIDMessage(84138)[:-2]

            dataLabel.append([varName, typeOpA, LOCALE.format_string(stringFormat,mean), LOCALE.format_string(stringFormat,rms)])

        #### Add Variable Charateristics Variable in the Summary ####
        if len(self.shapeFunctionConstraint) > 0:
            if self.calculateArea:
                total = self.ssdo.fields["SHAPE_AREA"].data.sum() /len(dataArea)
                rms = NUM.sqrt(NUM.sum((dataArea - total)**2) / len(dataArea))
                mean = NUM.mean(dataArea)
                dataLabel.append([ ARCPY.GetIDMessage(84911), typeShp, LOCALE.format_string(stringFormat, mean), LOCALE.format_string(stringFormat,rms)])

            if self.countFeatures:
                name = list(self.ssdo.fields.keys())[0]
                total = len(self.ssdo.fields[name].data)
                rms = NUM.sqrt(NUM.sum((dataNumElem - total)**2) / len(dataNumElem))
                mean = NUM.mean(dataNumElem)
                dataLabel.append([ ARCPY.GetIDMessage(84913), typeShp, LOCALE.format_string(stringFormat, mean), LOCALE.format_string(stringFormat,rms)])

            if self.calculateCompactness:
                mean = NUM.mean(dataComp)
                rms = NUM.sqrt(NUM.sum((dataComp - 1)**2) / len(dataComp))
                dataLabel.append([ ARCPY.GetIDMessage(84937), typeShp,  LOCALE.format_string(stringFormat, mean), LOCALE.format_string(stringFormat,rms)])

        #### Add Variable and Distance to Consider in the Summary ####
        if self.applyFunction is not None:
            nVars = [i for i in self.applyFunction if not i.isDistance]

            for i, funct in enumerate(nVars):
                mean = NUM.mean(dataStats.T[i])
                rms = NUM.sqrt(NUM.sum((dataStats.T[i] - mean)**2) / len(dataStats.T[i]))
                dataLabel.append([ funct.varName, typeStat,  LOCALE.format_string(stringFormat,mean), LOCALE.format_string(stringFormat,rms)])

            nVars = [i for i in self.applyFunction if i.isDistance]

            for i, funct in enumerate(nVars):
                mean = NUM.mean(dataDist.T[i])
                rms = NUM.sqrt(NUM.sum((dataDist.T[i] - mean)**2) / len(dataDist.T[i]))
                dataLabel.append([ funct.varName, typeStat,  LOCALE.format_string(stringFormat,mean), LOCALE.format_string(stringFormat,rms)])

        #### Add Proportion Variable in the Summary ####
        if self.proportionField is not None:
            if self.conserveProportion:
                mean = NUM.mean(dataProportion)
                rms = NUM.sqrt(NUM.sum((dataProportion - mean)**2) / len(dataProportion))
                dataLabel.append([self.proportionField, typeProp,  LOCALE.format_string(stringFormat, mean), LOCALE.format_string(stringFormat,rms)])
            else:
                rms = ""
                try:
                    dicto = {self.indexUnique[i]:self.proportion[i] for i in NUM.arange(len(self.proportion))}
                    da, counts = NUM.unique(dataProportion, return_counts = True)

                    count = counts/counts.sum()
                    edict = {self.indexUnique[i]:0 for i in NUM.arange(len(self.proportion))}
                    bdict = {self.indexUnique[i]:0 for i in NUM.arange(len(self.proportion))}

                    for i in da:
                        bdict[i] =  count[int(i)]

                    for i in bdict:
                        edict[i]= abs(bdict[i] - dicto[i])

                    total = 0

                    for v in edict:
                        total += edict[v]

                    mean =  total / len(edict)
                    rms = 0
                    for v in edict:
                        rms += (edict[v]- mean)**2

                    rms = NUM.sqrt(rms/len(edict))

                    rms = NUM.sqrt(NUM.sum((dataProportion - mean)**2) / len(dataProportion))
                    rms = LOCALE.format_string(stringFormat,rms)
                except:
                    rms = "N/A"

                dataLabel.append([self.proportionField, typeProp,  "N/A", rms])


        outputReport = UTILS.outputTextTable(dataLabel, header = header,
                                            justify = justifyArray, pad = 1, colPad = 3,
                                            titleFillToken = "-", force2Txt=False)

        ARCPY.AddMessage(outputReport)

    def getNearFeature(self, ssdo , distancesVar):
        """
        Get Near Feature Distances
        """
        inputFC = ssdo.inputFC
        distancesFC = [ i["sourceData"] for i in distancesVar]
        valid = NUM.array(list(ssdo.master2Order.values()))

        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84822), 0, len(distancesFC), 1)
        listArray = []
        outputTable = UTILS.returnScratchName("DIST_BBZ_", fileType = "TABLE", 
                                            scratchWS = ARCPY.env.scratchGDB)
        for pos, fc in enumerate(distancesFC):

            ARCPY.GenerateNearTable_analysis(inputFC, fc, outputTable +str(pos),
                                         None, "NO_LOCATION", "NO_ANGLE", "CLOSEST", 0, "PLANAR")
            ssdoTable = SSDO.table2RecArray(outputTable + str(pos),["NEAR_DIST"])
            listArray.append(ssdoTable["NEAR_DIST"][valid])
            neg = ssdoTable["NEAR_DIST"] == -1

            if NUM.sum(neg) > 0:
                ARCPY.AddIDMessage("Warning", 110169, distancesFC)

            UTILS.passiveDelete(outputTable+ str(pos))

            ARCPY.SetProgressorPosition(pos)

        return listArray


    def _checkDistanceFeatureInput(self, desc):
        """ Get Information Distance Feature """

        if self.distanceFeatures is None:
            return None

        #### Get Input FC Path ####
        nameInputFC = desc.name
        pathInputFC = desc.path
        pathCompleteInputFC = OS.path.normpath(pathInputFC + "\\"+ nameInputFC)

        unknownRF = []
        cantBeUsed = False
        listVariables = []
        try:
            pathD = [ out.replace("'","") for out in self.distanceFeatures.split(";")]

            for distFeature in pathD:
                desc = ARCPY.Describe(distFeature)

                if desc.spatialReference.type.upper() == "UNKNOWN":
                    unknownRF.append(distFeature)

                name = desc.name
                path = desc.path

                pathComplete = OS.path.normpath(path + "\\"+ name)

                if pathCompleteInputFC == pathComplete:
                    cantBeUsed  = True

                if desc.dataType == "FeatureLayer":
                    pathComplete = desc.nameString
 
                rowVar = {"name": ARCPY.ValidateFieldName(name.upper(), path),
                          "alias":name.upper(),
                          "sourceData": pathComplete}

                listVariables.append(rowVar)

                fieldNames = [rV["name"] for rV in listVariables]
                fieldNamesOut = UTILS.createAppendFieldNames(fieldNames, path, [nameClusterOutput])
                for ind, rV in enumerate(listVariables):
                    rV["name"] = fieldNamesOut[ind]

        except:
            ARCPY.AddIDMessage("ERROR", 110201)
            raise SystemExit()

        if cantBeUsed:
            ARCPY.AddIDMessage("ERROR", 110260)
            raise SystemExit()

        if len(unknownRF):
            ARCPY.AddIDMessage("ERROR", 522, ",".join(unknownRF))
            raise SystemExit()


        return listVariables

    def getSolution(self):
        """ Main method to get zones"""

        """ Use BBZ Core Function 

        Class PyGrowingRegion

        INPUT:
            GlobalGenerator Instance

        Methods:
            process_island:
                INPUT:
                    island { int, 0}: default 0 
                    dbg {int, 0}: display information about each sololution
                    test_seed {long, 0}: test a solution
                    start_values {1D array int32, None }: Test a specific solution - works together with test_seed
                    tuning {int, 0}: 1 -> apply tuning  0-> do not apply tuning (default)
                OUTPUT :
                    information { 1D array (input size e.g. coords)} Zone id of each Feature
                    fitness     { 1D array (
                                    (Number generation + 1) x number_fitness (8) (
                                    Total-Fitness,
                                    partial fitness Building constraints,
                                    partial fitness Compactness
                                    partial fitness variables to consider
                                    partial fitness proportional
                                    partial fitness distance to consider
                                    partial fitness Equal area
                                    partial fitness Number of elements
                                }

                    seed        {long} Seed Solution
                    starts      {1D array int32} Starting points for best solution
                    totals      {1D array Number of Zones X number constraint variables}
                    stat        (1D array Number of Zones X number of variables to consider}
                    area        (1D array Number of Zones}
                    proportion  (1D array Number of Zones}
                    distances   (1D array average)
                    compactnes  {1D array Number of Zones X number of distance to consider}
                    number_ele  {1D array Number of Zones X number of distance to consider}
        """

        #### Create Instance ####
        obj = ARC._ss.PyGrowingRegion(self)

        n = len(self.ssdo.xyCoords)
        labels = NUM.ones(n, dtype = NUM.int32)*-2
        maxId = 0

        #### Check Possible Regions ####
        if len(self.toEval) == 0 :
            WAR(id = 110282)
            self._createOutput(NUM.ones(self.ssdo.numObs, dtype = NUM.int32), [[1]])
            #### Return Data For Convergence Table ####
            return None, None

        #### Get Max Island ####
        infMax = [len(self.islandIds[index]) for index in self.toEval]
        maxL = max(infMax)
        idMax = infMax.index(maxL)
        fieldData = None
        listSeeds, listStarts, listTotals, listStats, \
        listArea, listProportion, listDist, listCompact, listNumElem = ([] for i in range(9))

        solutionInfo = [listSeeds, listStarts, listTotals, listStats, listArea,
                       listProportion, listDist, listCompact, listNumElem]
        fieldNames = ["TOTAL_FIT",
                      "BUILDC_FIT",
                      "COMPCT_FIT",
                      "VAR2CS_FIT",
                      "PROPOR_FIT",
                      "DIS2CS_FIT",
                      "EQAREA_FIT",
                      "NUMELE_FIT"]

        #### Localize Messages ####
        aliasNames = [ARCPY.GetIDMessage(i) for i in [
            84909,
            84910,
            84937,
            84912,
            84266,
            84914,
            84911,
            84913] ]

        #### Initialize Zone Ids ####
        maxId = 0
        disconnectZones = False

        #### Evaluate Each Disconnected Region ####
        for id, index in enumerate(self.toEval):

            #### Optimize Using  GA the Region ####
            info = obj.process_island(id, tuning = 0)

            if info is None:
                return None

            if info == True:
                labels[self.islandIds[index]] = (maxId+1)
                continue

            solution, fitness, seed, starts, totals,\
            stat, area, prop, dist, compact, numElem = info

            #### Get Fitness ####
            if id == idMax:
                fieldData = fitness

            #### Add Elements ####
            for idd, el in enumerate((seed, starts, totals, stat,
                                     area, prop, dist, compact, numElem)):
                solutionInfo[idd].append(el)

            if -1 in NUM.unique(solution):
                disconnectZones = True

            solution = solution + (maxId+1)
            labels[self.islandIds[index]] = solution
            maxId = labels.max()

        del obj

        for i in self.groupByItself:
            labels[self.islandIds[i]] = maxId+1
            maxId += 1

        totals = self._recalculateTotals(labels)

        if len(solutionInfo[0])>0:
            #### Report Errors ####
            self.reportErrors(solutionInfo)
        else:
            ERR(id = 110284)

        if disconnectZones:
            WAR(id = 110283)

        #### Create Output Feature Class ####
        self._createOutput(labels, totals)

        #### Return Data For Convergence Table ####
        return self.returnCandidateFields(fieldData, fieldNames, aliasNames)

def DBG(obj, info ="", stop = False):
    ARCPY.AddMessage(str(info) + " " + str(obj))
    if stop:
        ARCPY.AddMessage("------------")
        raise SystemExit()

def WAR(information = None, id = None):
    if id is None:
        ARCPY.AddWarning(information)
    else:
        if information == "":
            ARCPY.AddIDMessage("WARNING", id)
        else:
            ARCPY.AddIDMessage("WARNING", id, information)

def ERR(information = None, id = None):
    if id is None:
        ARCPY.AddError(information)
    else:
        if information == "":
            ARCPY.AddIDMessage("ERROR", id)
        else:
            ARCPY.AddIDMessage("ERROR", id, information)
    raise SystemExit()

