# coding: utf-8
"""
Source Name:   SSImpute.py
Version:       ArcGIS Pro 2.0
Author:        Environmental Systems Research Institute Inc.
Description:   Python tool for fill missing values using
               spatio-temporal, spatial and temporal options
"""

###################### Imports ################################
import arcgisscripting as ARC
import arcpy as ARCPY
import arcpy.da as DA
import arcpy.management as DM
import ErrorUtils as ERROR
import numpy as NUM
import os as OS
import sys as SYS
import SSDataObject as SSDO
import SSUtilities as UTILS
import SSTimeUtilities as TUTILS
import locale as LOCALE
import WeightsUtilities as WU
import datetime as DT
import Stats as STATS
import scipy.spatial as SCPS
import scipy.stats as SCPST
import WeightsUtilities
import SSCluster as SSC

allPredictionTypes = ['FIXED_DISTANCE', 'K_NEAREST_NEIGHBORS',
                      'CONTIGUITY_EDGES_ONLY', 'CONTIGUITY_EDGES_CORNERS',
                      'GET_SPATIAL_WEIGHTS_FROM_FILE']

outputPredition = {'FIXED_DISTANCE': 84746, 'K_NEAREST_NEIGHBORS': 84747,
                   'CONTIGUITY_EDGES_ONLY': 84748, 'CONTIGUITY_EDGES_CORNERS': 84749,
                   'GET_SPATIAL_WEIGHTS_FROM_FILE': 84750}

methods = ['MINIMUM', 'AVERAGE','MEDIAN', 'MAXIMUM', 'TEMPORAL_TREND']

addedStat = {'MINIMUM': '_MAX', 'AVERAGE': '_STD', 'MEDIAN': '_MAD',
             'MAXIMUM': '_MIN', 'TEMPORAL_TREND': '_RES',
             'MEAN': '_STD'}

outputMethods = {'MINIMUM': ARCPY.GetIDMessage(84412), 'AVERAGE': ARCPY.GetIDMessage(84738),
                 'MEDIAN': ARCPY.GetIDMessage(84414),  'MAXIMUM': ARCPY.GetIDMessage(84413),
                 'TEMPORAL_TREND': ARCPY.GetIDMessage(84572).format("").strip(),
                 'MEAN': ARCPY.GetIDMessage(84261)}

supportTime = ["SECONDS", "MINUTES", "HOURS", "DAYS", "WEEKS", "MONTHS",
               "YEARS"]

outputNamesNotAllowed = ["SELECT", "GROUP", "INSERT", "INTO", "BY", "TABLE"]


minNumberValidValues = 1
minNumberOfNeighbors = 1
infValues = NUM.array([-1.79769313486232E+308, 1.79769313486232E+308], dtype= float)
min_inf = infValues[0]
max_inf = infValues[1]
refTime = NUM.datetime64(DT.datetime(1970, 1, 1))

########################################## Debug Options ########################
enablePDB = True
enabledPrintNeighs = False
listStops = []
def stop(id):
    if id in listStops:
        try:
            if enablePDB:
                pdb.set_trace()
        except:
            pass
neighsCheck ={}
def printNeighs(idMissing, value, idNeighs = None, values = None , size= 5):
    try:
        if enabledPrintNeighs:
            if value is None:
                value = "No Imputed"
            outp=""
            if idNeighs is not None:
                nNeighs = "Num.Neigh:{0}"
                if values is not None:
                    nNeighs = nNeighs.format(len(values))

                all = zip(map("{0}:".format, idNeighs),map("{0} ".format, values))
                header = "Missing id:{0}:({1})".format(idMissing, str(value))
                row = []
                rows = []
                c = 0
                for i, j in all:
                    outp = i + j 
                    row.append(outp)
                    c = c + 1
                    if c == size:
                        rows.append(row)
                        row = []
                        c = 0
                if len(row) < size:
                    for i in NUM.arange(size-len(row)):
                        row.append(" ")
                    rows.append(row)

                outputReport = UTILS.outputTextTable(rows, header = header,
                                                justify = "left", pad = 1,
                                                titleFillToken = "-", force2Txt=False)
                ARCPY.AddMessage(outputReport)
                ARCPY.AddMessage(nNeighs)
                if not UTILS.couldExportHTMLMessage():
                    ARCPY.AddMessage("------------------------------------------ ")
    except:
        ARCPY.AddMessage("Printing problem in " + str(idMissing))

if enablePDB:
    import pdb
########################################## Debug Options ########################
def getFieldType(inputData, nameField):
    """ Get field type from input 
    """
    try:
        info = ARCPY.Describe(inputData)
        for field in info.fields:
            if field.name.upper() == nameField:
                return field.type.upper()
    except:
        pass
    return None

def execute(parameters, messages):
    import sys as SYS

    inputFeatureClass = parameters[0]
    outputFeatureClass= parameters[1]
    fillMethod = parameters[3]
    conceptSpatialRel = parameters[4]
    distanceBand = parameters[5]
    timeWindow = parameters[6]
    SWMFile = parameters[12]
    outputTable = parameters[15]
    # To check output is requested or not
    disableOutput = parameters[16]
    UpdatedFeatures = parameters[17]

    #inputFC = inputFeatureClass.value
    inputFC = UTILS.getInputAppendParameter(0, parameters)
    output = outputFeatureClass.valueAsText
    locId = UTILS.getTextParameter(9, parameters, fieldName = True)
    fields = UTILS.getMultiFieldParameter(2, parameters)
    fillMethod = fillMethod.valueAsText
    concept = conceptSpatialRel.valueAsText
    dist = distanceBand.valueAsText
    timeW = timeWindow.valueAsText
    timeField = UTILS.getTextParameter(7, parameters, fieldName = True)
    numNeigh = UTILS.getNumericParameter(8, parameters)
    relatedTable = UTILS.getTextParameter(10, parameters)
    relatedField = UTILS.getTextParameter(11, parameters, fieldName = True)
    uniqueId = UTILS.getTextParameter(13, parameters, fieldName = True)
    nullValue  = UTILS.getNumericParameter(14, parameters)
    swmFile = SWMFile.valueAsText
    outputTableValue = outputTable.valueAsText
    uniqueIdRelate = None
    
    #### Apply Exec new field type checker ####
    if disableOutput.value is False:
        if relatedTable and locId:
            check = UTILS.ExecuteNewFieldTypeChecker(inputFC, output,
                                                    fields=[locId],
                                                    weightsFile=swmFile)
            try:
                check = UTILS.ExecuteNewFieldTypeChecker(relatedTable, output,
                                                    fields=fields + [relatedField])
            except:
                pass
        else:
            check = UTILS.ExecuteNewFieldTypeChecker(inputFC, output,
                                                    fields=fields + [locId] if locId is not None else fields,
                                                    weightsFile=swmFile)
    
    UTILS.checkOutputPath(outputTableValue, "TABLE")
    UTILS.checkOutputPath(output, "FC")
    
    if relatedTable and uniqueId:
        uniqueIdRelate = uniqueId

    if relatedTable is not None:
        typeF = getFieldType(inputFC, locId)
        typeR = getFieldType(relatedTable, relatedField)

        if typeF != typeR:
            ARCPY.AddIDMessage("ERROR", 640, relatedField , typeF)
            raise SystemExit()
        if outputTable.value is None:
            ARCPY.AddIDMessage("ERROR", 606, outputTable.displayName)
            raise SystemExit()

    if locId is  None:
        relatedTable = None
        relatedField = None

    #### Check Dataset Type
    isTable = False
    try:
        desc = ARCPY.Describe(inputFC)
        isTable = desc.DataType in UTILS.dataTypeTable
    except:
        pass

    if timeW is None:
        if fillMethod != "TEMPORAL_TREND":
            timeField = None
    else:
        if timeField is None:
            timeW = None

    if fillMethod == None:
        ARCPY.AddIDMessage("ERROR", 606, fillMethod.displayName)
        raise SystemExit()

    if fillMethod == "TEMPORAL_TREND":
        concept = None
        timeW = None
    elif not isTable and concept is None:
        ARCPY.AddIDMessage("ERROR", 606, conceptSpatialRel.displayName)
        raise SystemExit()

    if concept is not None:
        if concept == "K_NEAREST_NEIGHBORS":
            dist = None
        if concept == "GET_SPATIAL_WEIGHTS_FROM_FILE":
            locId = None
            relatedTable = None
            uniqueId = None

    ssi = SSImpute(inputFC = inputFC,
                    outputFC = output,
                    fields = fields,
                    idField = locId,
                    relatedTable = relatedTable,
                    relatedField = relatedField,
                    timeField = timeField,
                    concept = concept,
                    fillMethod = fillMethod,
                    numNeighbors = numNeigh,
                    distanceBand = dist,
                    timeInterval = timeW,
                    nullValue = nullValue,
                    weightsFile = swmFile,
                    outputTable = outputTableValue,
                    disableOutput = disableOutput.value)
    ssi.uniqueIdRelate = uniqueIdRelate
    ssi.obtainDataForImpute(masterField = uniqueId, types=[0,1,2,3,4,5,6,8])
    values = ssi.imputeValues(fields)
    ssi.createOutput(imputedValues = values, masterField = uniqueId , disableOutput = disableOutput.value)
    
    isPolygon = False
    if not ssi.isTable:
        isPolygon = ssi.ssdo.shapeType.upper() == "POLYGON"

    ## derived output features ##
    #if disableOutput.value:
    #    UpdatedFeatures = ssi.ssdo.inputFC
    #else:
        #UpdatedFeatures.value = None

    try:
        if not ssi.useRelatedTable:
            if isPolygon:
                UTILS.buildLocaleCIMLayer("FillValues_polys.lyrx",1)
            else:
                UTILS.buildLocaleCIMLayer("FillValues_points.lyrx",1)
        else:
            if not ssi.isTable:
                if not disableOutput.value:
                    if isPolygon:
                        UTILS.buildLocaleCIMLayer("FillValues_polys_related.lyrx",1)
                    else:
                        UTILS.buildLocaleCIMLayer("FillValues_points_related.lyrx",1)
    except:
        ARCPY.AddIDMessage("WARNING", 973)

class MissingValuesStat(object):
    def __init__(self, fieldName, report = True, alias = None):
        self.fieldName = fieldName
        self.totalRecords = 1
        self.printInfo = report
        if  alias is not None:
            self.alias =  alias
        else:
            self.alias = fieldName

    def getTotalRecords(self, records):
        self.totalRecords = len(records)

    def getInitialValues(self, values):

        self.minv = values.min()
        self.maxv = values.max()
        self.avg = values.mean()
        self.std = values.std()
        self.skw = SCPST.skew(values)
        self.kur = SCPST.kurtosis(values)

    def getProcessedValues(self, values, checkNull = False):
        if not checkNull:
            self.minP = values.min()
            self.maxP = values.max()
            self.avgP = values.mean()
            self.stdP = values.std()
            self.skwP = SCPST.skew(values)
            self.kurP = SCPST.kurtosis(values)
        else:
            mask = ~(NUM.isnan(values))
            valuesMasked = values[mask]
            self.minP = valuesMasked.min()
            self.maxP = valuesMasked.max()
            self.avgP = valuesMasked.mean()
            self.stdP = valuesMasked.std()
            self.skwP = SCPST.skew(valuesMasked)
            self.kurP = SCPST.kurtosis(valuesMasked)

    def imputedInfo(self, numItemsImputed, numItemsNoImputed):
        self.numItemsImputed = len(numItemsImputed)
        self.numItemsNoImputed = len(numItemsNoImputed)
        self.totalMissing = self.numItemsImputed + self.numItemsNoImputed
        self.noImputedIds = numItemsNoImputed

    def updateRealIndex(self, isRelatedTable, orde2MasterDict = None):
        if not isRelatedTable:
            self.noImputedMasterIds = [orde2MasterDict[index] for index in self.noImputedIds]
        else:
            self.noImputedMasterIds = self.noImputedIds

    def getTable(self):
        if not self.printInfo:
            return ""
        header =  self.alias
        minv = LOCALE.format_string("%0.3f", self.minv)
        maxv = LOCALE.format_string("%0.3f", self.maxv)
        avg = LOCALE.format_string("%0.3f", self.avg)
        std = LOCALE.format_string("%0.3f", self.std)
        skw = LOCALE.format_string("%0.3f", self.skw)
        kur = LOCALE.format_string("%0.3f", self.kur)
        minp = LOCALE.format_string("%0.3f", self.minP)
        maxp = LOCALE.format_string("%0.3f", self.maxP)
        avgp = LOCALE.format_string("%0.3f", self.avgP)
        stdp = LOCALE.format_string("%0.3f", self.stdP)
        skwp = LOCALE.format_string("%0.3f", self.skwP)
        kurp = LOCALE.format_string("%0.3f", self.kurP)

        row1 = [ARCPY.GetIDMessage(84729), UTILS.buildTableCell(str(int(self.totalRecords)), colSpan=2), "@@none"]
        row2 = ["", "", ""]
        row3 = [UTILS.buildTableCell(ARCPY.GetIDMessage(84728), colSpan=3, bold=True), "@@none", "@@none"]
        row4 = [ARCPY.GetIDMessage(84730), UTILS.buildTableCell(str(self.totalMissing), colSpan=2), "@@none"]
        row5 = [ARCPY.GetIDMessage(84731),
                UTILS.buildTableCell(LOCALE.format_string("%0.2f", 100*self.totalMissing/self.totalRecords)+ "%", colSpan=2), "@@none"]
        row6 = ["", "", ""]
        row7 = [UTILS.buildTableCell(ARCPY.GetIDMessage(84732), colSpan=3, bold=True), "@@none", "@@none"]
        row8 = [ARCPY.GetIDMessage(84730), UTILS.buildTableCell(str(self.numItemsNoImputed), colSpan=2), "@@none"]
        row9 = [ARCPY.GetIDMessage(84731),
                UTILS.buildTableCell(LOCALE.format_string("%0.2f", 100*self.numItemsNoImputed/self.totalMissing) + "%", colSpan=2), "@@none"]
        row10 = ["", "", ""]

        row11 = [ARCPY.GetIDMessage(84733),
                 UTILS.buildTableCell(ARCPY.GetIDMessage(84734).format(self.numItemsImputed, self.totalMissing), colSpan=2), "@@none"]
        if self.printInfo == "Header":
            nRows = 11
            rows = ["row"] * nRows
            res = '[' + ','.join(r + str(b) for r, b  in zip (rows, NUM.arange(1, nRows +1 , 1))) + ']'
            res = eval(res)
            outputReport = UTILS.outputTextTable(res, header = header,
                                             justify = ["left", "right", "right"], pad = 1,
                                             titleFillToken = "-", force2Txt=False)
            return outputReport

        row12 = row10
        row13 = ["", ARCPY.GetIDMessage(84737).upper(), ARCPY.GetIDMessage(84629).upper()]
        row14 = [ARCPY.GetIDMessage(84412), minv, minp]
        row15 = [ARCPY.GetIDMessage(84413), maxv, maxp]
        row16 = [ARCPY.GetIDMessage(84738), avg, avgp]
        row17 = [ARCPY.GetIDMessage(84262), std, stdp]
        row18 = [ARCPY.GetIDMessage(84742), skw, skwp]
        row19 = [ARCPY.GetIDMessage(84739), kur, kurp]
        nRows = 19
        rows = ["row"] * nRows
        res = '[' + ','.join(r + str(b) for r, b  in zip (rows, NUM.arange(1, nRows +1 , 1))) + ']'
        res = eval(res)
        outputReport = UTILS.outputTextTable(res, header = header,
                                             justify = ["left", "right", "right"], pad = 1,
                                             emphasizeHeadRow=False, boldRows=12,
                                             titleFillToken = "-", force2Txt=False)
        return outputReport


class SSImpute(object):

    def __init__(self, inputFC, outputFC , fields, idField = None, relatedTable = None,
                 relatedField = None, timeField = None, concept = None, fillMethod = None,
                 numNeighbors = None, distanceBand = None, timeInterval = None,
                 nullValue = None, weightsFile = None, outputTable = None,
                 explicitSpatialRef = None, silentWarnings = False, useChordal = True,
                 invalidGCS = False, disableOutput = False):

        """SSImpute fill missing values 
        INPUT:
            inputFC (str) : Input Feature Class
            outputFC (str): Output Feature Class
            fields (list str): List field names 
            idField (str): Id field to relate table
            relatedTable (str): related table 
            relatedField (str): field name to relate table
            timeField (str): time field
            concept (str): 'FIXED_DISTANCE'... view 
            fillMethod (str): AVERAGE, MEDIAN etc
            numNEighbors (int): Number of Neighbors
            distanceBand (float): Distance Band
            timeInterval (str): Time value and time unit
            nullValue (int/float): Set this value as null
            weightsFile (str): Weights file
            outputTable (str): Output table (just relate table)
        """
        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        if self.nullValue is not None:
            self.nullValue = float(self.nullValue)
            if self.nullValue == -1.7976931348623157e+308:
                self.nullValue = infValues[0]

        self.swmFileBool = False
        if self.weightsFile:
            weightSuffix = self.weightsFile.split(".")[-1].lower()
            self.swmFileBool = (weightSuffix == "swm")

        self.__checkSpatialParameter()

        if not disableOutput:
            outPath, outName = OS.path.split(self.outputFC)
            if outName.upper() in outputNamesNotAllowed:
                ARCPY.AddIDMessage("ERROR", 110032, outName)
                raise SystemExit()

        self.fields = list(map(str.upper, self.fields))
        self.uniquePolyFC = None
        self.idFieldType = None
        self.Ids = None
        self.uniqueFieldValues = None
        self.contiguity = False
        self.uniqueIdRelate = None
        
        self.isGDB = UTILS.isGDB(inputFC)
        self.displayMessageCount = 0
        
        self.index = []
        self.timeSize = None
        self.timeUnit = None

        self.masterField = None
        self.swm = None
        self.master2Order = {}
        self.order2Master = {}
        self.xyCoords = None
        self.zCoords = None
        self.shapes = None
        self.relatedInfo = None
        self.numLocations = None
        self.useRelatedTable =False
        # To have access to the related Table
        self.relatedTable = relatedTable
        self.inputFC = inputFC

        self.uniqueXY = None
        self.uniqueZ = None
        self.uniqueShapes = None
        self.createTempFile = False
        self.tryToImpute = False
        if relatedTable is not None and relatedField is not None:
            self.useRelatedTable = True
        
        self.isOutputTableIbGDB = False
        if outputTable is not None:
            self.isOutputTableIbGDB = UTILS.isGDB(outputTable)

        #### Create Base SSDataObject ####
        self.ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC, 
                                      explicitSpatialRef = explicitSpatialRef,
                                      silentWarnings = silentWarnings, 
                                      useChordal = useChordal,
                                      invalidGCS = invalidGCS)
                                      
        self.isTable = self.ssdo.isTable
        self.distanceBand = distanceBand
        
    def ___redefineFieldType(self , change = True):
        if change:
            UTILS.numpyConvert['SmallInteger'] = float
            UTILS.numpyConvert['Integer'] = float
        else:
            UTILS.numpyConvert['SmallInteger'] = int
            UTILS.numpyConvert['Integer'] = int

    def obtainDataForImpute (self, masterField = None, types = [0,1,2,3,4,5,6], minNumObs = 0, 
                            warnNumObs = 0, explicitBadRecordID = None):

        N = 0
        if self.concept == "GET_SPATIAL_WEIGHTS_FROM_FILE":
            #### Open Spatial Weights and Obtain Chars ####
            self.swm = WU.SWMReader(self.weightsFile)
            N = self.swm.numObs
            masterField = self.swm.masterField
            self.swm.close()

        self.uniqueField = masterField

        ### Managing Integer/Long Fields AS Target Fields ####
        self.___redefineFieldType()

        if self.concept in ['CONTIGUITY_EDGES_ONLY', 'CONTIGUITY_EDGES_CORNERS']:
            self.createTempFile = True

        self.requireGeometry = False
        if not self.isTable and self.ssdo.shapeType.upper() == "POLYGON":
            self.requireGeometry = True

        if self.useRelatedTable:
            self.ssdo.obtainData(self.idField, requireGeometry = True)
            
            if not self.isTable:
                #### Handle Chordal distances 3D ####
                self.coorHandler = SSC.CoordinateHandler(self.ssdo)
                self.ssdo = self.coorHandler.setCoordinates()

            self.__obtainDataForImputeRelatedTable(masterField, types,
                                               minNumObs, warnNumObs,
                                               explicitBadRecordID)
        else:
            #### Get AliasNames ####
            self.__getFieldNameAliases(fields = self.ssdo.info.fields)
            if not self.isTable:

                if not self.requireGeometry:
                    self.__obtainDataForImputeCentroids(masterField, types, minNumObs,
                                                        warnNumObs, explicitBadRecordID)
                else:
                    self.__obtainDataForImputeShapes(masterField, types, minNumObs,
                                                     warnNumObs, explicitBadRecordID)
            else:
               
                fields = self.fields.copy()

                if self.idField is not None:
                    fields.append(self.idField.upper())

                positionTimeField = -1

                if self.timeField is not None:
                    fields.append(self.timeField.upper())

                self.ssdo.obtainData(masterField, fields, minNumObs = minNumObs, warnNumObs = warnNumObs,
                                     explicitBadRecordID = explicitBadRecordID, useNullinFields = self.fields)
                typeFields = {}

                for fieldInd, field in enumerate(self.ssdo.info.fields):
                    name = field.name.upper()
                    type1 = field.type.upper()
                    typeFields[name] = type1
                    if self.idField is not None:
                        if name == self.idField.upper():
                            self.idFieldType = type1
                self.typeFields = typeFields
                self.index = NUM.arange(self.ssdo.numObs, dtype= NUM.int32)
                self.__detectUniqueIds(useShapes = False)
                self.numLocations = len(self.Ids)

        #### Add Attribute ####
        self.ssdo.requireGeometry = self.requireGeometry

        if self.concept == "GET_SPATIAL_WEIGHTS_FROM_FILE":
            #### Check to Assure Complete Set of Weights ####
            if self.numLocations > N:
                ARCPY.AddIDMessage("Error", 842, self.numLocations, N)
                raise SystemExit()

        repeatedShapes = self.__checkForRepeatedFeatures()
        if not self.isTable:
            numObs = len(self.uniqueXY)
        else:
            numObs = self.ssdo.numObs

        if numObs <= 1:
            if not repeatedShapes  or (repeatedShapes and \
               self.fillMethod != 'TEMPORAL_TREND'):
                ARCPY.AddIDMessage("ERROR", 110093)
                raise SystemExit()
            if self.numNeighbors is not None:
                if self.numNeighbors > numObs:
                    ARCPY.AddIDMessage("ERROR", 110094)
                    raise SystemExit()

    def __obtainDataForImputeCentroids(self, masterField = None, 
                            types = [0,1,2,3,4,5,6], minNumObs = 0, 
                            warnNumObs = 0, explicitBadRecordID = None,
                            requireGeometry = False):
        """
        Obtain Data including missing values
        This function use OID as master id
        """

        ssdo = self.ssdo
        fields = self.fields.copy()

        if self.idField is not None:
            fields.append(self.idField)

        positionTimeField = -1
        if self.timeField is not None:
            fields.append(self.timeField)

        #### Get Base Count, May Include Bad Records ####
        cnt = UTILS.getCount(self.inputFC)
        self.ssdo.numObs = cnt
        fieldList = ssdo.initializeRead(masterField = masterField)
        fieldList, dateInds = ssdo.testFields(fieldList, fields = fields,
                                              types = types)

        ssdo.initializeFields(cnt)
        #### Initialization of Centroids  ####
        ssdo.xyCoords = NUM.empty((cnt, 2), float)
        numFields = len(fieldList)

        typeFields = {}
        for fieldInd, field in enumerate(ssdo.info.fields):
            name = field.name.upper()
            type1 = field.type.upper()
            typeFields[name] = type1
            if name == self.idField:
                self.idFieldType = type1

        self.typeFields = typeFields

        #### Create Progressor Bar ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84001), 0, cnt, 1)
        
        #### Z Coords ####
        if ssdo.hasZ:
            ssdo.zCoords = NUM.empty((cnt, ), float)
            fieldList.append("shape@Z")
            positionTimeField = -2
        else:
            ssdo.zCoords = None

        #### Keep track of Invalid Fields ####
        ssdo.badRecords = []
        badRecord = False
        fieldList = UTILS.getOriginalFieldName(fieldList, ssdo.info.fields)

        #### Process Field Values ####
        try:
            rows = DA.SearchCursor(self.inputFC, fieldList, "",
                                   ssdo.spatialRefString)
        except:
            ARCPY.AddIDMessage("ERROR", 204)
            raise SystemExit()

        checkNone = 0
        if self.isGDB:
            readFunc = self.__checkValueGDB
        else:
            readFunc = self.__checkValueSHP

        for _, fieldName in enumerate(fields):
            if ssdo.fields[fieldName].type == "BigInteger":
                ssdo.fields[fieldName].data = ssdo.fields[fieldName].returnDouble()

        c = 0
        for row in rows:
            oid = row[0]
            badXY = row[1].count(None)

            if self.timeField is not None:
                if row[positionTimeField] is None:
                    badXY = True

            #### Check Bad Record ####
            if badXY:
                badRow = 1
                badRecord = 1
                ssdo.badRecords.append(oid)
            else:
                #### Get Centroid and Master ID ####
                ssdo.xyCoords[c] = row[1]
                masterID = row[ssdo.masterColumnIndex]
                #### Add Field Values ####
                if numFields:
                    restFields = row[ssdo.dataColumnIndex:]
                    for fieldInd, fieldName in enumerate(fields):
                        type = typeFields[fieldName]
                        fieldValue = restFields[fieldInd]
                        ssdo.fields[fieldName].data[c] = readFunc(fieldValue, type)

                if ssdo.hasZ:
                    ssdo.zCoords[c] = row[-1]

                #### Check uniqueness of masterID field ####
                if masterID in ssdo.master2Order:
                    del rows
                    ARCPY.AddIDMessage("ERROR", 644, masterField)
                    ARCPY.AddIDMessage("ERROR", 643)
                    raise SystemExit()
                else:
                    ssdo.master2Order[masterID] = c
                    ssdo.order2Master[c] = masterID
                    c += 1

            ARCPY.SetProgressorPosition()

        del rows

        ssdo.requireGeometry = False
        ssdo.silentWarnings = False
        #### Finalize Read ####
        ssdo.finalizeRead(minNumObs = minNumObs, warnNumObs = warnNumObs,
                          explicitBadRecordID = explicitBadRecordID)

        #### Handle Chordal distances 3D ####
        self.coorHandler = SSC.CoordinateHandler(ssdo)
        ssdo = self.coorHandler.setCoordinates()


        self.index = NUM.arange(len(ssdo.xyCoords), dtype= NUM.int32)
        self.master2Order = ssdo.master2Order
        self.order2Master = ssdo.order2Master
        self.xyCoords = ssdo.xyCoords
        self.zCoords = ssdo.zCoords

        self.__detectUniqueIds()
        self.numLocations = len(self.Ids)

    def __obtainDataForImputeShapes(self, masterField = None, 
                            types = [0,1,2,3,4,5,6], minNumObs = 0, 
                            warnNumObs = 0, explicitBadRecordID = None):
        """
        Obtain Data including missing values
        """
        ssdo = self.ssdo
        fields = self.fields.copy()

        if self.idField is not None:
            fields.append(self.idField)

        positionTimeField = -1
        if self.timeField is not None:
            fields.append(self.timeField)

        #### Get Base Count, May Include Bad Records ####
        cnt = UTILS.getCount(self.inputFC)
        ssdo.numObs = cnt
        fieldList = ssdo.initializeRead(masterField = masterField, requireGeometry = True)
        fieldList, dateInds = ssdo.testFields(fieldList, fields = fields,
                                              types = types)

        typeFields = {}
        for fieldInd, field in enumerate(ssdo.info.fields):
            name = field.name.upper()
            type = field.type.upper()
            typeFields[name] = type
            if name == self.idField:
                self.idFieldType = type

        self.typeFields = typeFields

        ssdo.initializeFields(cnt)
        #### Initialization of Centroids  ####
        ssdo.xyCoords = NUM.empty((cnt, 2), float)
        numFields = len(fieldList)

        #### Create Progressor Bar ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84001), 0, cnt, 1)
        
        #### Z Coords ####
        if ssdo.hasZ:
            ssdo.zCoords = NUM.empty((cnt, ), float)
            fieldList.append("shape@Z")
            positionTimeField = -2
        else:
            ssdo.zCoords = None
        
        #### Shape Array ####
        self.shapes = NUM.empty((cnt, ), object)

        #### Keep track of Invalid Fields ####
        ssdo.badRecords = []
        badRecord = False
        fieldList = UTILS.getOriginalFieldName(fieldList, ssdo.info.fields)

        #### Process Field Values ####
        try:
            rows = DA.SearchCursor(self.inputFC, fieldList, "",
                                   ssdo.spatialRefString)
        except:
            ARCPY.AddIDMessage("ERROR", 204)
            raise SystemExit()

        checkNone = 0
        if self.isGDB:
            readFunc = self.__checkValueGDB
        else:
            readFunc = self.__checkValueSHP

        c = 0
        for row in rows:
            #### Assess Shape Info ####
            oid = row[0]
            shape = row[1]

            if shape is None:
                badRecord = True
                ssdo.badRecords.append(oid)
                continue

            center = shape.trueCentroid
            badShape = False
            if (center.X == NUM.nan or
                center.Y == NUM.nan):
                badShape = True
            if ssdo.hasZ:
                if center.Z == NUM.nan:
                    badShape = True

            if self.timeField is not None:
                if row[positionTimeField] is None:
                    badShape = True


            #### Check Bad Record ####
            if badShape:
                badRecord = True
                ssdo.badRecords.append(oid)
            else:
                #### Get Centroid  ####
                ssdo.xyCoords[c] = (center.X, center.Y)
                if ssdo.hasZ:
                    ssdo.zCoords[c] = shape.centroid.Z

                #### Store Shape ####
                self.shapes[c] = shape
                #### Get Master ID ####
                masterID = row[ssdo.masterColumnIndex]

                #### Add Field Values ####
                if numFields:
                    restFields = row[ssdo.dataColumnIndex:]
                    for fieldInd, fieldName in enumerate(fields):
                        type = typeFields[fieldName]
                        fieldValue = restFields[fieldInd]
                        ssdo.fields[fieldName].data[c] = readFunc(fieldValue, type)

                #### Check uniqueness of masterID field ####
                if masterID in ssdo.master2Order:
                    del rows
                    ARCPY.AddIDMessage("ERROR", 644, masterField)
                    ARCPY.AddIDMessage("ERROR", 643)
                    raise SystemExit()
                else:
                    ssdo.master2Order[masterID] = c
                    ssdo.order2Master[c] = masterID
                    c += 1
            ARCPY.SetProgressorPosition()

        del rows

        ssdo.silentWarnings = False
        ssdo.shapes = self.shapes
        ssdo.requireGeometry = True

        #### Finalize Read ####

        ssdo.finalizeRead(minNumObs = minNumObs, warnNumObs = warnNumObs,
                          explicitBadRecordID = explicitBadRecordID)
        self.index = NUM.arange(len(ssdo.xyCoords), dtype= NUM.int32)

        #### Handle Chordal distances 3D ####
        self.coorHandler = SSC.CoordinateHandler(ssdo)
        ssdo = self.coorHandler.setCoordinates()

        self.master2Order = ssdo.master2Order
        self.order2Master = ssdo.order2Master
        self.xyCoords = ssdo.xyCoords
        self.zCoords = ssdo.zCoords
        self.shapes = self.ssdo.shapes
        self.ssdo.shapes = list(self.shapes)
        self.__detectUniqueIds(useShapes = True)
        self.numLocations = len(self.Ids)
    
    def __getFieldNameAliases(self, describeInput = None, fields= None):
        self.aliasFieldNames = {}
        listFields = None
        if describeInput is not None:
            listFields = describeInput.fields
        if fields is not None:
            listFields = fields
        if listFields is not None:
            for field in listFields:
                name = field.name.upper()
                self.aliasFieldNames[name] = field.aliasName

    def __obtainDataForImputeRelatedTable(self, masterField = None, 
                            types = [0,1,2,3,4,5,6], minNumObs = 0, 
                            warnNumObs = 0, explicitBadRecordID = None):

        initFields = [self.relatedField] + self.fields

        #### Data Read From Table ####
        if self.uniqueIdRelate is not None:
            if self.uniqueIdRelate not in initFields:
                initFields.append(self.uniqueIdRelate)


        hasTimeField = False
        if self.timeField is not None:
            initFields.append(self.timeField)
            hasTimeField = True

        self.relatedInfo = SSDO.table2RecArray(self.relatedTable, initFields,
                                               explicitBadRecordID = 110088,
                                               returnOID = True,
                                               progressID = 84744,
                                               includeNulls = True,
                                               hasTimeField = hasTimeField)
        d = ARCPY.Describe(self.relatedTable)
        self.__getFieldNameAliases(describeInput = d)
        cnt = UTILS.getCount(self.relatedTable)

        oidName = d.oidFieldName
        self.oids = self.relatedInfo[oidName.upper()]
        self.sourceId = self.oids

        #### Check Uniqueness Master Field ####
        if self.uniqueIdRelate  is not None:
            uniqueField, uniqueCounts = NUM.unique(self.relatedInfo[self.uniqueIdRelate],
                                                   return_counts = True)
            if (len(uniqueField) < uniqueCounts.sum()):
                ARCPY.AddIDMessage("Error", 643)
                raise SystemExit

            del uniqueField, uniqueCounts

        #### Get Unique IDs and Select Indices ####
        allMasterIDs = self.relatedInfo[self.relatedField]
        
        uniqueInfo = NUM.unique(allMasterIDs, return_index = True,
                                return_counts = True)
        ids, uniqueIndices, uniqueCounts = uniqueInfo
        typeFields = {}

        for fieldInd, field in enumerate(d.fields):
            name = field.name.upper()
            type = field.type.upper()
            typeFields[name] = type

        self.typeFields = typeFields
        
        for fieldName, field in UTILS.iteritems(self.ssdo.allFields):
            if field.name.upper() == self.idField:
                self.idFieldType = field.type.upper()

        #### Assure Unique IDs Match ####
        masterKeys = NUM.asarray([i for i in self.ssdo.master2Order.keys()])
        intersection  = NUM.intersect1d(ids, masterKeys, assume_unique = True)

        masterInt = NUM.in1d(masterKeys, intersection)
        idsInt = NUM.in1d(ids, intersection)

        masterKeysMasked = masterKeys[masterInt]
        idsMasked = ids[idsInt]
        uniqueIndicesMasked = uniqueIndices[idsInt]
        uniqueCountsMasked = uniqueCounts[idsInt]

        self.idFieldMask = NUM.where(NUM.in1d(allMasterIDs, idsMasked))[0]
        self.Ids = allMasterIDs[self.idFieldMask]
        
        ### Use ids from OIDname field ###
        if self.oids is not None:
           self.oids = self.oids[self.idFieldMask]
           self.oids = {id:val for id,val in enumerate(self.oids)}
        else:
            ### Use ids from Master Field field ###
            self.oids = {id:val for id,val in enumerate(self.Ids)}

        diffKeys = NUM.setdiff1d(masterKeys, ids)
        numBad = len(diffKeys)

        if numBad:
            badKeys = ", ".join([str(i) for i in diffKeys])
            ARCPY.AddIDMessage("WARNING", 110084, numBad, self.ssdo.numObs)
            ARCPY.AddIDMessage("WARNING", 110085, self.relatedField, badKeys)

        #### Ignore IDs With No Shape ####
        keepKeys = NUM.in1d(ids, masterKeys)
        removeKeys = NUM.nonzero(~keepKeys)[0]
        numRemove = removeKeys.sum()

        if numRemove:
            badKeys = ", ".join([str(i) for i in removeKeys])
            ARCPY.AddIDMessage("WARNING", 110086, numRemove, cnt)
            ARCPY.AddIDMessage("WARNING", 110087, self.relatedField, badKeys)
            #ids = ids[keepKeys]
            #uniqueIndices = uniqueIndices[keepKeys]
            #uniqueCounts = uniqueCounts[keepKeys]

        self.uniqueFieldValues = idsMasked, uniqueIndicesMasked, uniqueCountsMasked

        self.numLocations = len(intersection)
        for ind, masterID in enumerate(masterKeysMasked):
            self.master2Order[masterID] = ind
            self.order2Master[ind] = masterID

        #### Select Coordinates / Shapes ####
        self.xyCoords = NUM.empty((self.numLocations, 2), dtype = float)

        if self.ssdo.hasZ:
            self.zCoords = NUM.empty((self.numLocations,), dtype = float)
        else:
            self.zCoords = None

        if self.requireGeometry:
            self.shapes = self.ssdo.shapes[masterInt]
        else:
            self.shapes = None 

        for masterID, orderID in UTILS.iteritems(self.master2Order):
            ssdoOrder = self.ssdo.master2Order[masterID]

            self.xyCoords[orderID] = self.ssdo.xyCoords[ssdoOrder]
            
            if self.ssdo.hasZ:
                self.zCoords[orderID] = self.ssdo.zCoords[ssdoOrder]

            if self.requireGeometry:
                self.shapes[orderID] = self.ssdo.shapes[ssdoOrder]

        self.index = NUM.arange(len(self.Ids), dtype= NUM.int32)

        self.uniqueShapes = self.shapes
        self.uniqueXY = self.xyCoords
        self.uniqueZ = self.zCoords
        self.__detectUniqueIds(useShapes = True)

    def __getTimeInterval(self, timeInterval):

         #### Set/Validate Time Size ####
        if timeInterval is None:
            return

        self.timeSize, self.timeUnit = timeInterval.split(" ")
        try:
            self.timeSize = int(self.timeSize)
        except:
            ARCPY.AddIDMessage("ERROR", 110007)
            raise SystemExit()

        #### Set/Validate Time Unit ####
        self.timeUnit = self.timeUnit.upper()
        if self.timeUnit.upper() not in supportTime:
            ARCPY.AddIDMessage("ERROR", 110008)
            raise SystemExit()

        return TUTILS.createTimeDelta(int(self.timeSize), self.timeUnit).astype(int)

    def initializeRead(self, masterField, requireSearch = False, 
                       requireGeometry = False):

        #### Assess Default ####
        if masterField is None:
            masterField = self.ssdo.oidName

        #### Validation of Master Field ####
        verifyMaster = ERROR.checkField(self.ssdo.allFields, masterField,
                                        types = [0,1,4,5,8])
        self.ssdo.masterIsOID = masterField == self.ssdo.oidName
        self.ssdo.masterField = masterField

        if requireSearch:
            #### Set Master and Data Indices ####
            if self.ssdo.masterIsOID:
                self.ssdo.masterColumnIndex = 0
                self.ssdo.dataColumnIndex = 2
                fieldList = []
            else:
                self.ssdo.masterColumnIndex = 2
                self.ssdo.dataColumnIndex = 3
                fieldList = [masterField]

        else:
            #### Set Master and Data Indices ####
            if requireGeometry:
                shapeString = "shape@"
            else:
                shapeString = "shape@XY"

            if self.ssdo.masterIsOID:
                self.ssdo.masterColumnIndex = 0
                self.ssdo.dataColumnIndex = 2
                fieldList = [self.ssdo.oidName, shapeString]
            else:
                self.ssdo.masterColumnIndex = 2
                self.ssdo.dataColumnIndex = 3
                fieldList = [self.ssdo.oidName, shapeString, masterField]

        return fieldList

    def imputeValues(self, fieldNames = None, report = True):
        """ Impute Values
        INPUT:
            fieldNames (list str): Field names
        OUTPUT:
            ValuesImp (Dict): FieldName:Array
        """

        if fieldNames is None:
            fieldNames = self.fields
        else:
            fieldNames = map(str.upper, fieldNames)
            fieldNames = list(filter(lambda fieldName:fieldName.upper() in self.fields,
                                      fieldNames))

        option = self.__selectOption()
        #ARCPY.AddMessage("Option -> " + str(option))

        if option == -1:
            ARCPY.AddIDMessage("ERROR", 40023)
            raise SystemExit()

        self.missingStat ={}

        for fieldName in fieldNames:
            self.missingStat[fieldName] = MissingValuesStat(fieldName, report, 
                                                            self.aliasFieldNames[fieldName])

        imputed = {}
        valuesImp = {}
        nNeighbors = {}
        imputedValuesPerRecord = []
        countByLoc = {}

        for fieldName in fieldNames:
            noImpu = []
            impValuesIds = []
            value = self.__imputeValueField(option, fieldName, impValuesIds, noImpu)
            self.missingStat[fieldName].getProcessedValues(value, checkNull = True)
            self.missingStat[fieldName].imputedInfo(impValuesIds, noImpu)
            impValuesIds, extraField, countFilledByLoc, numNeighborUsed = self.__expandImputedValues(value, impValuesIds)
            countByLoc[fieldName] = countFilledByLoc
            #### Check Number Ids Imputed ####
            if len(impValuesIds) > 0:
                valuesImp[fieldName] = value
                imputed[fieldName] = impValuesIds
                valuesImp[fieldName + addedStat[self.fillMethod]] = extraField
                nNeighbors[fieldName] = numNeighborUsed
                imputedValuesPerRecord.append(impValuesIds)
            else:
                valuesImp[fieldName] = value
                if len(noImpu) > 0:
                    self.missingStat[fieldName].printInfo = "Header"
                else:
                    self.missingStat[fieldName].printInfo = False

        if len(imputedValuesPerRecord) == 0:
            if self.tryToImpute:
                ARCPY.AddIDMessage('ERROR', 110117)
            else:
                ARCPY.AddIDMessage('ERROR', 110116)
            raise SystemExit()

        #### Total Imputed Values ####
        imputedValuesPerRecordValues = NUM.array(imputedValuesPerRecord)
        numberImputedValues = imputedValuesPerRecordValues.sum(axis = 0)

        if report:
            ARCPY.AddMessage(ARCPY.GetIDMessage(84547))
            method = outputMethods[self.fillMethod]
            msg = ARCPY.GetIDMessage(84740).format(method)
            ARCPY.AddMessage(msg)
            if not self.isTable and self.fillMethod != "TEMPORAL_TREND":
                conceptOutput = ARCPY.GetIDMessage(outputPredition[self.concept])
                msg = ARCPY.GetIDMessage(84741).format(conceptOutput)
                ARCPY.AddMessage(msg)
  
            for fieldName in fieldNames:
                ARCPY.AddMessage(self.missingStat[fieldName].getTable())

        self.__removeTemporalFiles()
        return valuesImp, imputed, numberImputedValues, countByLoc, nNeighbors

    def __getTotalImputedValuesPerFeature(self, numberImputedValues):
        """ Calculate number of imputed values in feature
        """
        total = {}
        idsMasked, uniqueIndicesMasked, uniqueCountsMasked = self.uniqueFieldValues
        for index, i in enumerate(idsMasked):
            masked = NUM.where(self.Ids == i)
            sumValues= numberImputedValues[masked].sum()
            total[i] = sumValues

        totalFieldData = NUM.zeros(len(self.ssdo.xyCoords), dtype = NUM.int32)
        idsData = []
        for ord in self.ssdo.order2Master:
            id = self.ssdo.order2Master[ord]
            idsData.append(id)
            if id in total:
                totalFieldData[ord] = total[id]
        return totalFieldData, NUM.array(idsData)

    def __defineAliasNames(self):
        imp = noimp = 1
        for fieldsName in self.missingStat:
            if self.missingStat[fieldsName].printInfo:
                self.missingStat[fieldsName].alias = "FILL" + str(imp)
                imp += 1
            else:
                self.missingStat[fieldsName].alias = "UNFILL" + str(noimp)
                noimp += 1


    def __expandImputedValues(self, values, estimated ):

        if len(estimated) == 0:
            return NUM.array([]), NUM.array([]), None, None

        estimatedValues = NUM.zeros_like(values, dtype = NUM.int32)
        numNeighUsed = NUM.zeros_like(values, dtype = NUM.int32)
        extraValues = NUM.zeros_like(values, dtype = float)
        extraValues[:] = NUM.NaN if self.nullValue is None else self.nullValue
        
        if self.nullValue is not None:
            mask = NUM.isnan(values)
            values[mask] = self.nullValue

        if self.useRelatedTable:
            countType = self.Ids.dtype
            countValues = NUM.zeros_like(values, dtype = countType)
            countValues[:] = -1
            for value in estimated:
                countValues[value[0]] = self.Ids[value[0]]
                estimatedValues[value[0]] = 1
                extraValues[value[0]] = value[1]
                numNeighUsed[value[0]] = value[2]

            uniques, counts = NUM.unique(countValues, return_counts = True)
            uniques, counts = uniques[1:], counts[1:]

            countFilledByLocation = NUM.zeros(len(self.ssdo.xyCoords), dtype = NUM.int32)
            idsData = []
            for indexUnique, idValue in enumerate(uniques):
                index = self.ssdo.master2Order[idValue]
                countFilledByLocation[index] = counts[indexUnique]

            return estimatedValues, extraValues, countFilledByLocation, numNeighUsed
        else:
            for value in estimated:
                estimatedValues[value[0]] = 1
                extraValues[value[0]] = value[1]
                numNeighUsed[value[0]] = value[2]

            return estimatedValues, extraValues, None, numNeighUsed
        
    def __checkForRepeatedFeatures(self):
        ids, indices, counts = self.uniqueFieldValues
        existTimeField = self.timeField is not None
        existIdField = self.idField is not None

        #### Check Repeat Shapes ####
        repeatedShapes = False

        if existIdField:
            #if not existTimeField:
            #    return False

            n = len(ids)
            if counts.sum() == n and counts[counts>1].sum() > 0:
                repeatedShapes = False
            else:
                repeatedShapes = True

        return repeatedShapes

    def __selectOption(self):

        self.timeSize = None
        if self.timeInterval is not None:
            self.timeSize = self.__getTimeInterval(self.timeInterval)
            self.timeUnit = self.timeInterval.split()[1]
        
        existIdField = self.idField is not None 
        ids, indices, counts = self.uniqueFieldValues
        repeatedShapes = self.__checkForRepeatedFeatures()       
        
        option = -1        
        if self.isTable:
            if existIdField:
                if repeatedShapes:
                    option = 12
                else:
                    option = 13
            else:
                option = 13

            return option
            
        useSWMFile = self.concept == 'GET_SPATIAL_WEIGHTS_FROM_FILE'
        doFixedDistance = self.concept == 'FIXED_DISTANCE'
        doKNeighbors = self.concept == 'K_NEAREST_NEIGHBORS'
        doTemporalTrend = self.fillMethod ==  'TEMPORAL_TREND'
        doContiguityEdgeOnly = self.concept == 'CONTIGUITY_EDGES_ONLY'
        doContiguityEdgeCorners = self.concept == 'CONTIGUITY_EDGES_CORNERS'

        if existIdField:
            if repeatedShapes:
                if doFixedDistance:
                    option = 1
                if doKNeighbors:
                    option = 2
                if doTemporalTrend:
                    option = 3
                if doContiguityEdgeOnly:
                    option = 4
                if doContiguityEdgeCorners:
                    option = 5
            else:
                if doTemporalTrend:
                    ARCPY.AddIDMessage("ERROR", 110095)
                    raise SystemExit()
                if doFixedDistance:
                    option = 6
                if doKNeighbors:
                    option = 7
                if doContiguityEdgeOnly:
                    option = 8
                if doContiguityEdgeCorners:
                    option = 9
            if useSWMFile:
                option = 10
        else:
            if doFixedDistance:
                option = 6
            if doKNeighbors:
                option = 7
            if doContiguityEdgeOnly:
                option = 8
            if doContiguityEdgeCorners:
                option = 9
            if useSWMFile:
                option = 11

        return option
   
    def __getOrderId(self, id):
        if self.useRelatedTable:
            return self.master2Order[self.Ids[id]]
        else:
            return id

    def __getMasterId(self, ids, uniqueIds, localMaster = None):
        if self.useRelatedTable:
            if localMaster is None:
                return [self.order2Master[i] for i in ids]
            else:
                return [localMaster[i] for i in ids]
        else:
            return uniqueIds[ids]

    def __checkSpatialParameter(self, validArray = None):
        """ Check Number of Neighbors
        """
        if validArray is not None:
            if self.numNeighbors:
                n = len(validArray)
                if self.numNeighbors > n:
                    if self.displayMessageCount == 0:
                        ARCPY.AddIDMessage("WARNING", 1013, n)
                        self.displayMessageCount = 1
                    self.numNeighbors = n
                    
        elif self.numNeighbors is not None:
            if self.numNeighbors == 0:
                ARCPY.AddIDMessage("WARNING", 1219, minNumberOfNeighbors)
                self.numNeighbors = 1
 

    def __imputeValueField(self, option, fieldName, imputedIds, noImputedIds):

        """This function fill values depending on searchMethod, method
        INPUT:
            option (int):  Type of function
            fieldName (str): Target field to fill
            imputedIds (list): Empty list
            noImputedIds (list): Empty list

        OUTPUT:
            dataField (array): Array includes imputed and valid values
        """

        fillMethod = self.fillMethod
        numNeighbors = self.numNeighbors
        dateValues = None

        #### Get Data Field ####
        if self.useRelatedTable:
            valuesField = self.relatedInfo[fieldName]
            valuesField = valuesField[self.idFieldMask]
            refField  = valuesField.copy()
            if self.timeField is not None:
                dateValues = self.relatedInfo[self.timeField]
                dateValues = dateValues[self.idFieldMask]
        else:
            valuesField = self.ssdo.fields[fieldName].data
            refField = valuesField.copy()
            if self.timeField is not None:
                dateValues = self.ssdo.fields[self.timeField].data

        uniqueIds, indices, counts = self.uniqueFieldValues

        uniqueField = None
        if enabledPrintNeighs and self.uniqueField is not None:
            if self.useRelatedTable:
                uniqueField = self.relatedInfo[self.uniqueField]
                uniqueField = uniqueField[self.idFieldMask] 
            else:
                uniqueField = NUM.array(list(self.ssdo.order2Master.values()))

        #### Initial Statistic ####
        self.missingStat[fieldName].getTotalRecords(refField)

        if option == -1:
            return None

        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84745))
        
        if option in [12, 13]:
            funct = self.__selectFunction(fillMethod)
            mIds, mDates = self.__getMissingByField(fieldName , True)
            vals, vIds, vDates, mask =  self.__getValuesByField(fieldName , True)
            idUniquesMasked = self.Ids[mask]
            oneSec = NUM.timedelta64(1, 's')

            #### Field Stats ####
            self.missingStat[fieldName].getInitialValues(vals)
            
            if self.timeField is None:
                if self.idField is None:
                    if len(vals) > 0 :
                        refField[mIds], extraValue = funct(vals)
                        for idValue in mIds:
                            imputedIds.append((idValue, extraValue, len(vals)))
                    else:
                        for idValue in mIds:
                            noImputedIds.append(idValue)
                    return refField
                else:
                    for index, idValue in enumerate(mIds):
                        idLoc = self.Ids[idValue]
                        valuesMask = idUniquesMasked == idLoc
                        values = vals[valuesMask]
                        if len(values) > 0 :
                            refField[idValue], extraValue = funct(values)
                            imputedIds.append((idValue, extraValue, len(values)))
                        else:
                            noImputedIds.append(idValue)

                    return refField
            else:
                import scipy.interpolate as INTERPOLATE
                ### Set Method ###
                for index, idvalue in enumerate(mIds):
                    idLoc = self.Ids[idvalue]
                    valuesMask = idUniquesMasked == idLoc
                    values = vals[valuesMask]
                    misDate = mDates[index]
                    dates = vDates[valuesMask]
                    self.tryToImpute = True    

                    if len(values) >= 4:
                        secMisDate = mDates[index] - refTime
                        diffDates = dates - refTime
                        secDates = NUM.array([d/oneSec for d in diffDates])

                        #### Check Extrapolation ####
                        if diffDates[1] <= secMisDate <= diffDates[len(diffDates) - 2]:
                            try:
                                functValues = INTERPOLATE.InterpolatedUnivariateSpline(secDates, values)
                                secMisDateValue = secMisDate / oneSec
                                value = float(functValues(secMisDateValue))
                                extraValue = functValues.get_residual()
                                refField[idvalue] = value
                                imputedIds.append((idvalue, extraValue, len(values)))
                            except:
                                noImputedIds.append(idvalue)
                        else:
                            noImputedIds.append(idvalue)
                    else:
                        noImputedIds.append(idvalue)
                    printNeighs(idvalue, refField[idvalue], dates, values)
                return refField

        if option in [1, 2]:

            #### Create Neighbor Structure ####
            neighObj = WU.SciPyNeighborSearch(ssObject= self.ssdo, 
                                              spaceConcept = self.concept,
                                              threshold = self.distanceBand,
                                              numNeighs = self.numNeighbors,
                                              iniKdTree  = False)

            #### Reset Distance Band in Output Coord Units AND Assures not Larger than 75% Max Extent ####
            self.distanceBand = neighObj.threshold

            #### Get Valid Data ###
            iXY, vals, vIds, vDates, mask =  self.__getXYValuesByField(fieldName , True)

            #### Field Stats ####
            self.missingStat[fieldName].getInitialValues(vals)
            xyValues = self.__getUniqueXYZ()

            #### Check KNeighbors parameter ###
            self.__checkSpatialParameter(xyValues)

            #### Get Missing Values ### 
            mXY, mIds, mDates = self.__getXYMissingByField(fieldName, True)
            useMedian = 0

            ### Set New Config in SciPyNeighborSearch ###
            neighObj.kdTree = ARC._ss.KDTree(xyValues, leafsize = 16, use_median = useMedian)
            neighObj.k = self.numNeighbors
            neighObj.threshold = self.distanceBand
            neighObj.numLocations = len(xyValues)
            neighObj.coords = self.__getXYZ()

            ### Set Method ###
            funct = self.__selectFunction(fillMethod)

            if self.timeSize == 0 and self.numNeighbors:
                includeSelf = False
                neighObj.k = self.numNeighbors + 1
            else:
                includeSelf = True

            for index, idvalue in enumerate(mIds):
                idEval = self.__getOrderId(idvalue)
                self.tryToImpute = True

                #### get Neighbors Using Order Id without repeated shapes ####
                neighs = neighObj.getSpatialNeighbors(idEval, includeSelf = includeSelf)
                neighs = self.__intToArray(neighs)

                #### Select Ids From Repeated Shapes ####
                selection = self.__getMasterId(neighs, uniqueIds)
                maskIds = NUM.in1d(self.Ids, selection)

                #### Remove Null Values (mask) And Use Only Valid Positions (maskIds) ####
                applyMask = maskIds * mask

                validDates = None
                misDate = None

                values = valuesField[applyMask]
                if dateValues is not None:
                    validDates = dateValues[applyMask]
                    misDate = mDates[index]

                #### Apply Time Window ####
                values, dates = self.__applyTimeWindow(values, validDates, misDate, self.timeSize) 

                if len(values) > 0 :
                    refField[idvalue], extraValue = funct(values)
                    imputedIds.append((idvalue, extraValue, len(values)))
                else:
                    noImputedIds.append(idvalue)

                printNeighs(idvalue, refField[idvalue], dates, values)
            return refField

        if option == 3:
            import scipy.interpolate as INTERPOLATE
            mXY, mIds, mDates = self.__getXYMissingByField(fieldName , True)
            iXY, vals, vIds, vDates, mask =  self.__getXYValuesByField(fieldName , True)
            idUniquesMasked = self.Ids[mask]
            oneSec = NUM.timedelta64(1, 's')

            #### Field Stats ####
            self.missingStat[fieldName].getInitialValues(vals)

            ### Set Method ###
            for index, idvalue in enumerate(mIds):
                idLoc = self.Ids[idvalue]
                valuesMask = idUniquesMasked == idLoc
                values = vals[valuesMask]
                misDate = mDates[index]
                dates = vDates[valuesMask]
                self.tryToImpute = True

                ### Sort Time Series And Values ####
                sortedIndices = dates.argsort()
                values = values[sortedIndices]
                dates = dates[sortedIndices]

                if len(values) >= 4:
                    secMisDate = mDates[index] - refTime
                    diffDates = dates - refTime
                    secDates = NUM.array([d/oneSec for d in diffDates])
                    #### Check Extrapolation ####
                    if diffDates[1] <= secMisDate <= diffDates[len(diffDates) - 2]:
                        try:
                            functValues = INTERPOLATE.InterpolatedUnivariateSpline(secDates, values)
                            secMisDateValue = secMisDate / oneSec
                            value = float(functValues(secMisDateValue))
                            extraValue = functValues.get_residual()
                            refField[idvalue] = value
                            imputedIds.append((idvalue, extraValue, len(values)))
                        except:
                            noImputedIds.append(idvalue)
                    else:
                        noImputedIds.append(idvalue)
                else:
                    noImputedIds.append(idvalue)
                printNeighs(idvalue, refField[idvalue], dates, values)
            return refField

        if option in [4, 5]:
            contiguityType = "ROOK" if option == 4 else "QUEEN"

            localSSDO = SSDO.SSDataObject(self.uniquePolyFC)
            localSSDO.obtainData(masterField = "LOCATION", requireGeometry = True)

            #### Check KNeighbors parameter ###
            self.__checkSpatialParameter(localSSDO.xyCoords)

            #### Create Neighbor Structure ####
            neighObj = WU.SciPyNeighborSearch(ssObject= localSSDO, 
                                              spaceConcept = self.concept,
                                              threshold = self.distanceBand,
                                              numNeighs = self.numNeighbors)

            #### Reset Distance Band in Output Coord Units AND Assures not Larger than 75% Max Extent ####
            self.distanceBand = neighObj.threshold

            #### Check Time Field ####
            getTime = self.timeField is not None

            #### Get Valid Data ####
            iXY, vals, vIds, vDates, mask =  self.__getXYValuesByField(fieldName , getTime)

            #### Field Stats ####
            self.missingStat[fieldName].getInitialValues(vals)

            #### Get Missing Values ### 
            mXY, mIds, mDates = self.__getXYMissingByField(fieldName, True)

            ### Set Method ###
            funct = self.__selectFunction(fillMethod)

            for index, idvalue in enumerate(mIds):
                 #### get Neighbors Using Temporal FeatureClass ####
                idLoc = self.Ids[idvalue]
                idlocSSDO = localSSDO.master2Order[idLoc]
                neighs = neighObj.getSpatialNeighbors(idlocSSDO, includeSelf = True)
                neighs = self.__intToArray(neighs)
                #### Select Ids From Repeated Shapes ####
                selection = self.__getMasterId(neighs, uniqueIds, localSSDO.order2Master)
                maskIds = NUM.in1d(self.Ids, selection)
                applyMask = maskIds * mask

                misDate = None
                validDates = None
                values = valuesField[applyMask]
                if dateValues is not None:
                    validDates = dateValues[applyMask]
                    misDate = mDates[index]

                values, dates = self.__applyTimeWindow(values, validDates, misDate, self.timeSize) 

                if len(values) > 0 :
                    refField[idvalue], extraValue = funct(values)
                    imputedIds.append((idvalue, extraValue, len(values)))
                else:
                    noImputedIds.append(idvalue)

                printNeighs(idvalue, refField[idvalue], dates,values)
            return refField

        if option  in [6,7]:
            #### Create Neighbor Structure ####
            if option == 6:
                spaceConcept = "FIXED_DISTANCE"
            else:
                spaceConcept = "K_NEAREST_NEIGHBORS"

            neighObj = WU.SciPyNeighborSearch(ssObject= self.ssdo, 
                                              spaceConcept = spaceConcept,
                                              threshold = self.distanceBand,
                                              numNeighs = self.numNeighbors,
                                              iniKdTree = False)

            #### Reset Distance Band in Output Coord Units AND Assures not Larger than 75% Max Extent ####
            self.distanceBand = neighObj.threshold

            getTime = self.timeSize is not None

            #### Get Valid Data ####
            iXY, vals, vIds, vDates, mask =  self.__getXYValuesByField(fieldName , getTime)

            #### Field Stats ####
            self.missingStat[fieldName].getInitialValues(vals)

            ### Check Parameters ####
            self.__checkSpatialParameter(iXY)

            #### Get Missing Values ### 
            mXY, mIds, mDates = self.__getXYMissingByField(fieldName, getTime)

            ### Set New Config in  SciPyNeighborSearch ###
            neighObj.kdTree = ARC._ss.KDTree(iXY, leafsize = 16, use_median = 0)
            neighObj.k = self.numNeighbors
            neighObj.threshold = self.distanceBand
            neighObj.numLocations = len(iXY)
            neighObj.coords = self.__getXYZ()

            ### Set Method ###
            funct = self.__selectFunction(fillMethod)

            if getTime:
                for index, idvalue in enumerate(mIds):
                    neighs = neighObj.getSpatialNeighbors(idvalue, includeSelf = True)
                    neighs = self.__intToArray(neighs)

                    if len(neighs) > 0:
                        values = vals[neighs]
                    else:
                        values =[]

                    values = vals[neighs]
                    validDates = vDates[neighs]
                    misDate = mDates[index]
                    self.tryToImpute = True

                    values, dates = self.__applyTimeWindow(values, validDates, 
                                                           misDate, self.timeSize) 

                    if len(values) > 0 :
                        refField[idvalue], extraValue = funct(values)
                        imputedIds.append((idvalue, extraValue, len(values)))
                    else:
                        noImputedIds.append(idvalue)

                    printNeighs(idvalue, refField[idvalue], dates, values)
            else:

                for index, idvalue in enumerate(mIds):
                    neighs = neighObj.getSpatialNeighbors(idvalue, includeSelf = True)
                    neighs = self.__intToArray(neighs)

                    if len(neighs) > 0:
                        values = vals[neighs]
                    else:
                        values =[]

                    self.tryToImpute = True

                    if len(values) > 0 :
                        refField[idvalue], extraValue = funct(values)
                        imputedIds.append((idvalue, extraValue, len(values)))
                    else:
                        noImputedIds.append(idvalue)

                    printNeighs(idvalue, refField[idvalue], neighs,values)
            return  refField

        if option in [8 ,9]:
            spaceConcept = "CONTIGUITY_EDGES_ONLY" if option == 8 else "CONTIGUITY_EDGES_CORNERS"
            getTime = self.timeSize is not None

            #### Create Neighbor Structure ####
            neighObj = WU.SciPyNeighborSearch(ssObject= self.ssdo, 
                                              spaceConcept = spaceConcept,
                                              threshold = self.distanceBand,
                                              numNeighs = self.numNeighbors)

            #### Reset Distance Band in Output Coord Units AND Assures not Larger than 75% Max Extent ####
            self.distanceBand = neighObj.threshold

            ### Check Parameters ####
            self.__checkSpatialParameter(self.ssdo.xyCoords)

            #### Get Valid Data ###
            iXY, vals, vIds, vDates, mask =  self.__getXYValuesByField(fieldName , getTime)

            #### Field Stats ####
            self.missingStat[fieldName].getInitialValues(vals)

            #### Get Missing Values ### 
            mXY, mIds, mDates = self.__getXYMissingByField(fieldName, getTime)

            ### Set Method ###
            funct = self.__selectFunction(fillMethod)

            if getTime:
                for index, idvalue in enumerate(mIds):
                    neighs = neighObj.getSpatialNeighbors(idvalue, includeSelf = False)
                    neighs = self.__intToArray(neighs)
                    values = valuesField[neighs]
                    dValues = None
                    misDate = None
                    validDates = None
                    if dateValues is not None:
                       dValues = dateValues[neighs]
                    self.tryToImpute = True

                    if self.nullValue is not None and self.useRelatedTable:
                        maskv = NUM.array([i != self.nullValue and ~NUM.isnan(i)
                                           for i in values], dtype= bool)
                    else:
                        maskv = ~NUM.isnan(values)

                    values = values[maskv]
                    if dateValues is not None:
                        validDates = dValues[maskv]
                        misDate = mDates[index]

                    values, dates = self.__applyTimeWindow(values, validDates, 
                                                           misDate, self.timeSize)

                    if len(values) > 0 :
                        refField[idvalue], extraValue = funct(values)
                        imputedIds.append((idvalue, extraValue, len(values)))
                    else:
                        noImputedIds.append(idvalue)

                    printNeighs(idvalue, refField[idvalue], dates,values)
            else:
                for index, idvalue in enumerate(mIds):
                    neighs = neighObj.getSpatialNeighbors(idvalue, includeSelf = False)
                    neighs = self.__intToArray(neighs)
                    
                    if len(neighs)>0:
                        values = valuesField[neighs]
                        self.tryToImpute = True

                        if self.nullValue is not None and self.useRelatedTable:
                            maskv = NUM.array([i != self.nullValue and ~NUM.isnan(i)
                                               for i in values], dtype= bool)
                        else:
                            maskv = ~NUM.isnan(values)

                        values = values[maskv]

                        if len(values) > 0 :
                            refField[idvalue], extraValue = funct(values)
                            imputedIds.append((idvalue, extraValue, len(values)))
                        else:
                            noImputedIds.append(idvalue)
                    else:
                        noImputedIds.append(idvalue)
                    printNeighs(idvalue, refField[idvalue], neighs, values)
            return refField
            pass

        if option in [10, 11]:
            #### Get Missing Values ### 
            mXY, mIds, mDates = self.__getXYMissingByField(fieldName, False)

            #### Check If There Are Missing Values ####
            if len(mIds) == 0:
                return refField

            #### Get Valid Data ###
            iXY, vals, vIds, vDates, mask =  self.__getXYValuesByField(fieldName , False)

            #### Field Stats ####
            self.missingStat[fieldName].getInitialValues(vals)

            iterVals = UTILS.iterkeys(self.master2Order)
            self.swm = WU.SWMReader(self.weightsFile)
            rowStandard = self.swm.rowStandard
            ni = WU.NeighborInfo(self.uniqueField)
            
            ### Set Method ###
            funct = self.__selectFunction(fillMethod)

            for i in iterVals:
                info = self.swm.swm.readEntry()
                masterID = info[0]
                idvalue = self.master2Order[masterID]
                if idvalue in mIds:
                    self.tryToImpute = True
                    rowInfo = WU.getWeightsValuesSWM(info, self.master2Order,
                                                     valuesField,
                                                     rowStandard = rowStandard)
                    orderID, yiVal, nhIDs, nhVals, weights = rowInfo

                    #### Assure Neighbors Exist After Selection ####
                    nn, nhIDs, nhVals, weights = ni.processInfo(masterID, nhIDs,
                                                                nhVals, weights)

                    #### Recalculate Weights if There Are Null Values ###
                    values, weights = self.__reCalWeights(NUM.array(nhVals),
                                                          NUM.array(weights))

                    if len(values) > 0 :
                        refField[idvalue], extraValue = funct(values, weights)
                        imputedIds.append((idvalue, extraValue, len(values)))
                    else:
                        noImputedIds.append(idvalue)
                    printNeighs(idvalue, refField[idvalue], nhIDs, values)

            self.swm.close()
            return refField

    def __reCalWeights(self, values, weights):
        """ Re-calculate Weights if there null values
        """
        if self.nullValue is not None:
            maskv = NUM.array([i != self.nullValue and ~NUM.isnan(i)
                              for i in values], dtype= bool)
        else:
            maskv =  ~NUM.isnan(values)

        if maskv.sum() == len(values):
            return values, weights
        else:
            vals = values[maskv]
            weig = weights[maskv]
            totalW = NUM.sum(weights)
            sumW = NUM.sum(weig)
            #### Recalculate Weights####
            nWeights = NUM.array([(w*sumW)/totalW for w in weig])
            return vals, nWeights


    def __applyTimeWindow(self, values, validDates, misDate, timeInterval):
        """ Select values and dates according with time interval
        """
        if timeInterval  is None or validDates is None:
            return values, validDates

        timeIntervaln =  NUM.timedelta64(timeInterval, 's')
        time0, time1 = misDate - timeIntervaln, misDate + timeIntervaln
        valuesN = []

        for index, valid in enumerate(validDates):
            if TUTILS.isTimeNeighbor(time0,time1,valid):
                valuesN.append(index)
        return values[valuesN], validDates[valuesN]

    def __selectFunction(self, method):
        """Select function to impute values
        INPUT:
            method {TEXT}: method
        OUTPUT:
            funct {internal function}: function 
        """
        return {"MEAN"   : self.__mean,
                "AVERAGE" : self.__mean,
                "MAXIMUM" : self.__max,
                "MINIMUM" : self.__min,
                "MEDIAN" : self.__median}.get(method, self.__mean)

    ############################  Functions ############################
    def __mean(self, values, weights = None):
        if weights is None:
            return values.mean(), values.std()
        else:
            avg = NUM.average(values, weights= weights)
            variance = NUM.average((values-avg)**2, weights = weights)
        return avg, NUM.sqrt(variance)
    def __max(self, values, weights = None):
        return values.max(), values.min()
    def __min(self, values, weights = None):
        return values.min(), values.max()
    def __median(self, values, weights = None):
        median = STATS.median(values, weights)
        return median, STATS.mad(values, median)
    ############################  Functions ############################

    def __detectUniqueIds(self, useShapes = False):
        """
        Detect repeat features using centroids
        Note: simple way to detect panel datasets
        """

        if not self.useRelatedTable :
            if self.idField is None:
                self.Ids = self.index
                if not self.isTable:
                    self.uniqueXY = self.ssdo.uniqueXY
                    self.uniqueFieldValues = self.index, self.index, self.ssdo.counts
                else:
                    self.uniqueFieldValues = self.index, self.index, NUM.ones(self.ssdo.numObs, dtype = NUM.int32)
            else:
                self.Ids = self.ssdo.fields[self.idField].data
                uniqueInfo = NUM.unique(self.ssdo.fields[self.idField].data, 
                                        return_index= True,
                                        return_counts = True)
                uniqueIds, uniqueIndices, uniqueCounts = uniqueInfo

                self.uniqueFieldValues = uniqueInfo
                
                if not self.isTable:
                    #### Get Arrays With Uniques Values ####
                    self.uniqueXY = self.xyCoords[uniqueIndices]

                    if self.ssdo.hasZ:
                        self.uniqueZ = self.zCoords[uniqueIndices]
                    
                    repeatedShapes= self.__checkForRepeatedFeatures()
                    if useShapes and repeatedShapes:
                        self.uniqueShapes = self.shapes[uniqueIndices]
                        if self.createTempFile:
                            self.__createUniqueFeatureClass()
        else:

            repeatedShapes= self.__checkForRepeatedFeatures()
            
            if not self.isTable and useShapes and repeatedShapes:
                if self.createTempFile:
                    self.__createUniqueFeatureClass()

    def __removeTemporalFiles(self):
        try:
            if self.uniquePolyFC is not None:
                UTILS.passiveDelete(self.uniquePolyFC)
        except:
            pass

    def __createUniqueFeatureClassPython(self):
        outputFC  = UTILS.returnScratchName("ImpPoly_", 
                                            scratchWS = ARCPY.env.scratchGDB)
        outPath, outName = OS.path.split(outputFC)

        try:
            DM.CreateFeatureclass(outPath, outName, "POLYGON", 
                                  None, self.ssdo.mFlag, self.ssdo.zFlag, 
                                  self.ssdo.spatialRefString)
        except:
            ARCPY.AddIDMessage("ERROR", 210, outputFC)
            raise SystemExit()
        
        shapeFieldNames = ["SHAPE@"]
        dataFieldNames = ["LOCATION"]

        UTILS.addEmptyField(outputFC, dataFieldNames[0], self.idFieldType)
        allFieldNames = shapeFieldNames + dataFieldNames
        rows = DA.InsertCursor(outputFC, allFieldNames)

        if not self.useRelatedTable:
            uniqueIds, uniqueIndices, uniqueCounts = self.uniqueFieldValues
            for ind, shape in enumerate(self.uniqueShapes):
                rowResult = [shape, uniqueIds[ind]]
                rows.insertRow(rowResult)
        else:
            for ind, shape in enumerate(self.uniqueShapes):
                rowResult = [shape, self.order2Master[ind]]
                rows.insertRow(rowResult)
        del rows

        self.uniquePolyFC = outputFC

    def __createUniqueFeatureClass(self):
        outputFC  = UTILS.returnScratchName("ImpPoly_", 
                                            scratchWS = ARCPY.env.scratchGDB)

        ssdoTemp = SSDO.SSDataObject(self.ssdo.inputFC)
        ssdoTemp.requireGeometry = True
        shapes = []
        values = []

        if not self.useRelatedTable:
            uniqueIds, uniqueIndices, uniqueCounts = self.uniqueFieldValues
            for ind, shape in enumerate(self.uniqueShapes):
                shapes.append(shape)
                values.append(uniqueIds[ind])
        else:
            for ind, shape in enumerate(self.uniqueShapes):
                shapes.append(shape)
                values.append(self.order2Master[ind])
        
        ssdoTemp.numObs = len(shapes)

        charLength = 50
        if self.idFieldType in ["INTEGER", "LONG", "SHORT"]:
            dTypeValue = NUM.int32
        else:
            myType = UTILS.numpyConvert[self.idFieldType]
            if self.idFieldType.upper() == "STRING":
                dTypeValue = myType % charLength

        field  = SSDO.CandidateField(name = "LOCATION",
                                     type = self.idFieldType,
                                     data = NUM.array(values, dtype = dTypeValue))
        ssdoTemp.shapes = shapes

        try:
            ARC._ss.output_featureclass_from_dataobject(ssdoTemp, outputFC, [field])
            self.uniquePolyFC = outputFC
        except:
            self.__createUniqueFeatureClassPython()


    def __getMissing(self, fieldName):

        if self.useRelatedTable:
            values = self.relatedInfo[fieldName]
            values = values[self.idFieldMask] 
        else:
            values = self.ssdo.fields[fieldName].data

        if NUM.issubdtype(values.dtype, NUM.number):
            mask = NUM.isnan(values)

        return NUM.unique(self.Ids[mask])

    def __getMissingByField(self, fieldName, getTime = False):
        """
        Get Coordinates and Values of  Null values
        INPUT:
        fieldName {string}: Field Name
        getTime {bool}: Get array of datetimes of missing values
        OUTPUT:
        index: {array nx1}: indices 
        dateInfo: {array nx1}: datetime values
        """
        dateInfo = None
        if self.timeField is None:
            getTime = False

        values = self.ssdo.fields[fieldName].data
        if self.nullValue is not None:
            mask = NUM.array([i == self.nullValue or NUM.isnan(i)
                              for i in values], dtype= bool)
        else:
            mask = NUM.isnan(values)        

        if getTime:
            dateInfo = self.ssdo.fields[self.timeField].data

        if mask.sum() == 0:
            ARCPY.AddIDMessage("WARNING", 110107, fieldName)

        if not getTime:
            return self.index[mask], None
        else:
            return self.index[mask], dateInfo[mask]

    def __getXYMissingByField(self, fieldName, getTime = False):
        """
        Get Coordinates and Values of  Null values
        INPUT:
        fieldName {string}: Field Name
        getTime {bool}: Get array of datetimes of missing values
        OUTPUT:
        xyCoords {array nx2}: coordinates
        index: {array nx1}: indices 
        dateInfo: {array nx1}: datetime values
        """
        dateInfo = None
        if self.timeField is None:
            getTime = False

        mask = []
        if self.useRelatedTable:
            values = self.relatedInfo[fieldName]
            values = values[self.idFieldMask]
            if self.nullValue is not None:
                mask = NUM.array([i == self.nullValue or NUM.isnan(i)
                                  for i in values], dtype= bool)
            else:
                mask = NUM.isnan(values)
        else:
            values = self.ssdo.fields[fieldName].data
            if self.nullValue is not None:
                mask = NUM.array([i == self.nullValue or NUM.isnan(i)
                                  for i in values], dtype= bool)
            else:
                mask = NUM.isnan(values)

        if self.useRelatedTable:
            xy =  None
            if self.timeField is not None:
                dateInfo = self.relatedInfo[self.timeField]
                dateInfo = dateInfo[self.idFieldMask]
        else:
            xy = self.xyCoords[mask]
            if getTime:
                dateInfo = self.ssdo.fields[self.timeField].data

        if mask.sum() == 0:
            ARCPY.AddIDMessage("WARNING", 110107, fieldName)

        if not getTime:
            return None, self.index[mask], None
        else:
            return xy, self.index[mask], dateInfo[mask]

    def __getValuesByField(self, fieldName, getTime = False):
        """
        Get Coordinates and Values without Null values
        INPUT:
            fieldName {string}: Field Name
            getTime {bool}: Get array of datetimes of valid data
        OUTPUT:
            values {array nx1}: values
            index {array nx1}: indices
            dateInfo: {array nx1}: datetime values
            mask : {array nx1}: mask
        """
        dateInfo = None
        if self.timeField is None:
            getTime = False

        values = self.ssdo.fields[fieldName].data
        if self.nullValue is not None:
            mask = NUM.array([i == self.nullValue or NUM.isnan(i)
                              for i in values], dtype= bool)
        else:
            mask = NUM.isnan(values)        

        mask = NUM.logical_not(mask)
        
        dateInfo = None
        if self.timeField is not None:
            dateInfo = self.ssdo.fields[self.timeField].data

        if mask.sum() == 0:
            ARCPY.AddIDMessage("ERROR", 641 , minNumberValidValues)
            raise SystemExit()
                
        if not getTime:
            return values[mask], self.index[mask], None, mask
        else:
            return values[mask], self.index[mask], dateInfo[mask], mask

    def __getXYValuesByField(self, fieldName, getTime = False):
        """
        Get Coordinates and Values without Null values
        INPUT:
            fieldName {string}: Field Name
            getTime {bool}: Get array of datetimes of valid data
        OUTPUT:
            xyCoords {array nx2}: coordinates
            values {array nx1}: values
            index {array nx1}: indices
            dateInfo: {array nx1}: datetime values
            mask : {array nx1}: mask
        """
        dateInfo = None
        if self.timeField is None:
            getTime = False

        xyInfo  = self.xyCoords
        if self.ssdo.hasZ:
             xyInfo = self.__getXYZ()

        if self.useRelatedTable:
            values = self.relatedInfo[fieldName]
            values = values[self.idFieldMask]
            if self.nullValue is not None:
                mask = NUM.array([i != self.nullValue and ~NUM.isnan(i)
                                  for i in values], dtype = bool)
            else:
                mask = NUM.logical_not(NUM.isnan(values))
        else:
            values = self.ssdo.fields[fieldName].data
            if self.nullValue is not None:
                mask = NUM.array([i != self.nullValue and ~NUM.isnan(i)
                                  for i in values], dtype= bool)
            else:
                mask = NUM.logical_not(NUM.isnan(values))           

        dateInfo = None
        if self.useRelatedTable:
            xy  = xyInfo
            if self.timeField is not None:
                dateInfo = self.relatedInfo[self.timeField]
                dateInfo = dateInfo[self.idFieldMask]
        else:
            xy = xyInfo[mask]
            if getTime:
                dateInfo = self.ssdo.fields[self.timeField].data

        if mask.sum() == 0:
            ARCPY.AddIDMessage("ERROR", 641 , minNumberValidValues)
            raise SystemExit()
                
        if not getTime:
            return xy, values[mask], self.index[mask], None, mask
        else:
            return xy, values[mask], self.index[mask], dateInfo[mask], mask

    def __getXYZ(self):
        if self.ssdo.hasZ:
            n = len(self.xyCoords)
            xyz = NUM.zeros((n, 3), dtype= float)
            xyz[:,:-1] = self.xyCoords
            xyz[:, 2] = self.zCoords
            return xyz
        else:
            return self.xyCoords

    def __getUniqueXYZ(self):
        if self.ssdo.hasZ:
            n = len(self.uniqueXY)
            xyz = NUM.zeros((n, 3), dtype= float)
            xyz[:,:-1] = self.uniqueXY
            xyz[:, 2] = self.uniqueZ
            return xyz
        else:
            return self.uniqueXY

    def __checkValueGDB(self, value, type):
        if self.nullValue is not None:
            if value is None or value == self.nullValue :
                return NUM.NAN
            else:
                return value
        elif value is None:
            return NUM.NAN
        else:
            return value

    def __checkValueSHP(self, value, type):
        if value == self.nullValue:
            return NUM.NAN
        else:
            return value

    def __intToArray(self, value):
        if type(value) is list:
            return NUM.array([value], dtype = int)
        elif value.shape == ():
            return NUM.array([value], dtype = int)
        else:
            return value

    def createOutputPy(self, imputedValues, masterField= None,  output = None):
        """Create output from imputed values fields
        INPUT:
            output (str) : Output
            imputedValuesFields (tuple (Dic-> imputedValues,Dic-> noImputed, nunNoImp)
        """

        #### Allow Overwrite Output ####
        ARCPY.env.overwriteOutput = 1

        if output is None:
            output = self.outputFC

        imputedValuesFields, isImputedValues, numberImputedValues =  imputedValues
        shapeFieldNames = []
        shapeType = "POLYGON" if self.ssdo.shapeType.upper() == "POLYGON" else "POINT"
        useIdField = self.idField is not None
        ids, indices, counts = self.uniqueFieldValues
        n = counts.sum()
        outPath, outName = OS.path.split(output)

        try:
            if self.useRelatedTable:
                DM.CreateTable(outPath, outName)
                table = True
            else:
                DM.CreateFeatureclass(outPath, outName, shapeType, 
                                    "", self.ssdo.mFlag, self.ssdo.zFlag, 
                                    self.ssdo.spatialRefString)
                shapeFieldNames = ["SHAPE@"]
                table = False
        except:
            ARCPY.AddIDMessage("ERROR", 210, output)
            raise SystemExit()

        fieldIds = []
        idField = None
        if self.useRelatedTable:
            idField = self.relatedField
        else:
            idField = self.idField

        fieldIds = []
        if not self.useRelatedTable:
            if masterField:
                fieldIds.append(masterField)
                UTILS.addEmptyField(output , masterField, self.typeFields[masterField])
            else:
                if self.ssdo.hasOID64:
                    fieldIds.append("SOURCE_ID")
                    UTILS.addEmptyField(output, "SOURCE_ID", "BigInteger")
                else:
                    fieldIds.append("SOURCE_ID")
                    UTILS.addEmptyField(output, "SOURCE_ID", "LONG")
        
        datevalues = None

        if useIdField:
            fieldIds.append(idField)
            fieldIds.append(self.timeField)
            UTILS.addEmptyField(output, idField, self.idFieldType)
            UTILS.addEmptyField(output, self.timeField, self.typeFields[self.timeField])

            if self.useRelatedTable:
                dateValues = self.relatedInfo[self.timeField]
                dateValues = dateValues[self.idFieldMask]
            else:
                dateValues = self.ssdo.fields[self.timeField].data
        fieldNames = []

        for fieldName in self.fields:
            nameFilled = fieldName + "_Filled"
            nameEstimated = fieldName + "_Estimated"
            fieldNames.append(nameFilled)
            fieldNames.append(nameEstimated)
            UTILS.addEmptyField(output, nameFilled, "DOUBLE",)
            UTILS.addEmptyField(output, nameEstimated, "INTEGER")
        
        fieldNames.append("NEstimated")
        UTILS.addEmptyField(output, "NEstimated", "INTEGER")
        allFieldNames = shapeFieldNames + fieldIds + fieldNames 
        rows = DA.InsertCursor(output, allFieldNames)
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(86174), 0, n, 1)

        for index in  NUM.arange(n):
            data = []
            if not table:
                if shapeType == "POLYGON":
                    data.append(self.shapes[index])
                else:
                    coord = self.xyCoords[index]
                    point = ARCPY.Point(coord[0], coord[1])
                    data.append(point)
                data.append(self.ssdo.order2Master[index])

            if useIdField:
                data.append(self.Ids[index])
                data.append(dateValues[index].astype(DT.datetime))

            for fieldName in self.fields:
                value = float(imputedValuesFields[fieldName][index])
                isImptuted = isImputedValues[fieldName][index]
                data.append(value)
                data.append(isImptuted)

            total= numberImputedValues[index]
            data.append(total)
            rows.insertRow(data)
            ARCPY.SetProgressorPosition()

        del rows

        if table:
            ARCPY.AddMessage(output)

    #def createOutputGeneric(self, imputedValues, masterField = None,  output = None, disableOutput = False):

    def createOutput(self, imputedValues, masterField = None,  output = None, disableOutput = False):
        """Create output from imputed values fields
        INPUT:
            output (str) : Output
        """
        if self.outputTable is None and self.useRelatedTable:
            self.outputTable = UTILS.returnScratchName("fill", scratchWS = ARCPY.env.scratchGDB)

        #if (hasattr(ARC._ss, "output_table_from_candidate_fields")):
        #self.createOutputPy(imputedValues, masterField, output)
        #return
        self.___redefineFieldType(False)
        sourceIdFieldName = "SOURCE_ID"
        nameEstimatedField = "NUM_EST"
        totalEstimatedField = "TOT_EST"
        abrNumNeigh = "_NNBRS"
        ARCPY.env.overwriteOutput = 1

        if output is None:
            output = self.outputFC

        imputedValuesFields, isImputedValues, numberImputedValues, countByLoc, nNeigh =  imputedValues

        idField = self.idField
        cFields = []
        rFields = []
        order2Master = None
        
        if not self.isTable:
            ### Set Original Coords ####
            self.ssdo = self.coorHandler.reset()

        if not self.useRelatedTable:
            order2Master = self.ssdo.order2Master
            masterValues = NUM.array([self.ssdo.order2Master[index] for index in
                                      NUM.arange(len(self.Ids))])

            #### Create Unique Field ####
            nameMaster = masterField if masterField is not None else sourceIdFieldName
            if self.ssdo.hasOID64:
                masterType = "BIGINTEGER"
            else:
                masterType = "INTEGER"
            
            field  = SSDO.CandidateField(name = nameMaster,
                                         type = masterType,
                                         data = masterValues)
            cFields.append(field)
        else:
            order2Master = self.oids
  
            #### Create Fields with Number of Imputed Values ####
            for fieldName in self.fields:
                nameFilled = fieldName + "_EST"
                nameEstimated = fieldName + "_ESTIMATED"
                extra = addedStat[self.fillMethod]
                fieldNameExtra = fieldName + extra

                #### Check IF Field Was Filled ####
                if fieldNameExtra in imputedValuesFields:
                    field  = SSDO.CandidateField(name = nameFilled, 
                                                 alias = nameEstimated,
                                                 type = "INTEGER",
                                                 data = countByLoc[fieldName])
                    rFields.append(field)


            idField = self.relatedField

            #### Create Candidate Field for Feature Class using Relate Table ####
            total, ids  = self.__getTotalImputedValuesPerFeature(numberImputedValues)
            field  = SSDO.CandidateField(name = idField, 
                                         type = self.typeFields[idField],
                                         data = ids)
            fieldT  = SSDO.CandidateField(name = totalEstimatedField, 
                                         type = "INTEGER",
                                         data = total)

            rFields.append(field)
            rFields.append(fieldT)

        if self.idField is not None:
            fieldId  = SSDO.CandidateField(name = idField,
                                           alias = idField,
                                           type = self.idFieldType, 
                                           data =  NUM.array(self.Ids))
            if self.timeField is not None:
                if self.useRelatedTable:
                    dateValues = self.relatedInfo[self.timeField]
                    dateValues = dateValues[self.idFieldMask][:]
                else:
                    dateValues = self.ssdo.fields[self.timeField].data

                fieldDate  = SSDO.CandidateField(name = self.timeField,
                                                 alias = self.timeField,
                                                 type = self.typeFields[self.timeField],
                                                 data = dateValues)
                cFields.append(fieldDate)
                
            if self.uniqueIdRelate:
                idUnqValues = self.relatedInfo[self.uniqueIdRelate]
                idUnqValues = idUnqValues[self.idFieldMask][:]    
                fieldUnq  = SSDO.CandidateField(name = self.uniqueIdRelate,
                                                 alias = self.uniqueIdRelate,
                                                 type = "LONG",
                                                 data = NUM.asarray(idUnqValues, dtype= NUM.int32))
                cFields.append(fieldUnq)  

            if self.useRelatedTable:
                #### Source ID ####
                idUnqValues = self.sourceId[self.idFieldMask][:]
                if self.ssdo.hasOID64:
                    fieldUnq  = SSDO.CandidateField(name = "SOURCE_ID",
                                                 alias = "SOURCE_ID",
                                                 type = "BigInteger",
                                                 data = NUM.asarray(idUnqValues, dtype= NUM.int64))
                else:
                    fieldUnq  = SSDO.CandidateField(name = "SOURCE_ID",
                                                    alias = "SOURCE_ID",
                                                    type = "LONG",
                                                    data = NUM.asarray(idUnqValues, dtype= NUM.int32))
                cFields.append(fieldUnq)            
                

            cFields.append(fieldId)

        ##### Message if there are not imputed values ####
        for fieldName in self.fields:
            self.missingStat[fieldName].updateRealIndex(False, order2Master)
            if len(self.missingStat[fieldName].noImputedMasterIds):
                lisNo = self.missingStat[fieldName].noImputedMasterIds
                ARCPY.AddIDMessage("Warning", 110467, fieldName, ", ".join([str(id) for i, id in enumerate(lisNo) if i < 30]))

        fieldNames = []
        id = 1
        for fieldName in self.fields:
            nameFilled = fieldName + "_FILLED"
            nameEstimated = fieldName + "_ESTIMATED"
            nameNN = fieldName + abrNumNeigh 
            aliasNN = fieldName +"_N_NEIGHBORS"

            if self.isTable:
                nameNN = fieldName + "_NREC"
                aliasNN = fieldName +"_NUM_REC_USED"

            extra = addedStat[self.fillMethod]
            fieldNameExtra = fieldName + extra
            isFilled = False

            #### Check IF Field Was Filled ####
            if fieldNameExtra in imputedValuesFields:
                isFilled = True

            if not isFilled:
                nameFilled = fieldName + "_UNFILLED"
            
            nameAlias = fieldName ##//self.missingStat[fieldName].alias
            nameAliasEst  = nameAlias + "_EST"
            nameExtra = nameAlias + extra

            field1  = SSDO.CandidateField(name = fieldName + "_IMPUTED" if disableOutput else fieldName,
                                          alias = nameFilled,
                                          type = "DOUBLE",
                                          data = NUM.asarray(imputedValuesFields[fieldName], 
                                                             dtype= float),
                                          checkNullValues = True)
            cFields.append(field1)

            if isFilled :
                field2  = SSDO.CandidateField(name = nameExtra,
                                              alias = fieldNameExtra,
                                              type = "DOUBLE",
                                              data = NUM.asarray(imputedValuesFields[fieldNameExtra], 
                                                                 dtype= float),
                                              checkNullValues = True)
                field3  = SSDO.CandidateField(name =  nameAliasEst,
                                              alias = nameEstimated,
                                              type = "INTEGER",
                                              data = isImputedValues[fieldName])

                field4  = SSDO.CandidateField(name =  nameNN,
                                              alias = aliasNN,
                                              type = "INTEGER",
                                              data = nNeigh[fieldName])
                cFields.append(field2)
                cFields.append(field3)
                cFields.append(field4)

        fieldNE  = SSDO.CandidateField(name = nameEstimatedField,
                                       alias = nameEstimatedField,
                                       type = "INTEGER",
                                       data = numberImputedValues)
        cFields.append(fieldNE)
        # To prevent appending the already existing columns
        startIndexCol = 0
        for field in cFields:
            if field.name.endswith("_IMPUTED"):
                break;
            startIndexCol += 1

        if not self.useRelatedTable:
            try:
                self.ssdo.numObs = len(self.Ids)
                if disableOutput:
                    # Add the calculated fileds to the current ssdo (input) object
                    #### Create a Dictionary of Candidate Fields ####
                    newCField = cFields[startIndexCol:]
                    newCField = self.__checkDuplicated(newCField)
                    newCFields = self.__checkCandidateFieldName(newCField, self.inputFC)
                    candidateFields = {f.name:f for f in newCFields}
                    #fieldOrder = [i.name for i in candidateFields]
                    self.ssdo.addFields2FC(candidateFields)
                else:
                    if self.ssdo.isTable:
                        ARC._ss.output_table_from_candidate_fields(output, len(cFields[0].data),
                            self.__checkCandidateFieldName(cFields, output))
                    else:
                        ARC._ss.output_featureclass_from_dataobject(self.ssdo, output, 
                                                                self.__checkCandidateFieldName(cFields, output))
            except:
                ARCPY.AddIDMessage("ERROR", 210, output)
        else:
            try:
                self.ssdo.shapes = list(self.ssdo.shapes)
                if disableOutput:
                    # Add the calculated fileds to the current ssdo (input) object
                    #### Create a Dictionary of Candidate Fields ####
                    newCField = cFields[startIndexCol:]
                    newCField = self.__checkDuplicated(newCField)
                    newCFields = self.__checkCandidateFieldName(newCField, self.inputFC)
                    candidateFields = {f.name:f for f in newCField}
                    #fieldOrder = [i.name for i in candidateFields]
                    self.ssdo.addFields2FC(candidateFields)
                else:
                    if self.ssdo.isTable:
                        ARC._ss.output_table_from_candidate_fields(output, len(rFields[0].data),
                            self.__checkCandidateFieldName(rFields, self.outputTable))
                    else:                
                        ARC._ss.output_featureclass_from_dataobject(self.ssdo, output, 
                                                                self.__checkCandidateFieldName(rFields, output))

            except:
                ARCPY.AddIDMessage("ERROR", 210, output)

            if not self.ssdo.isTable:
                try:
                    numObs = len(self.Ids)
                    ARC._ss.output_table_from_candidate_fields(self.outputTable, numObs,
                                                                self.__checkCandidateFieldName(cFields, self.outputTable))
                except:
                    ARCPY.AddIDMessage("ERROR", 10037, self.outputTable )

    def __checkDuplicated(self, newCandidateFields):
        isSHPOrDBF = UTILS.isShapeFileOrDBF(self.inputFC)
        listFields = set(self.ssdo.allFields.keys())
        for i in range(len(newCandidateFields)):
            newCandidateFields[i].name = newCandidateFields[i].name.replace(".", "_")
        for i in range(len(newCandidateFields)):
            count = 0
            if isSHPOrDBF:
                newFieldName = newCandidateFields[i].name.upper()[0: 10]
                while newFieldName in listFields:
                    count += 1
                    appd = "_" + str(count)
                    newFieldName = newCandidateFields[i].name.upper()[0: 10 - len(appd)] + appd
                listFields.add(newFieldName)
                if count == 0:
                    newCandidateFields[i].name = newCandidateFields[i].name[0: 10]
                    listFields.add(newCandidateFields[i].name.upper())
                else:
                    newCandidateFields[i].name = newCandidateFields[i].name[0: 10 - len(appd)] + appd
                    newCandidateFields[i].alias += appd
            else:
                newFieldName = newCandidateFields[i].name.upper()
                while newFieldName in listFields:
                    count += 1
                    appd = "_" + str(count)
                    newFieldName = newCandidateFields[i].name.upper() + appd
                listFields.add(newFieldName)
                if count > 0:
                    newCandidateFields[i].name = newCandidateFields[i].name + appd
                    newCandidateFields[i].alias += appd

        return newCandidateFields

    def __checkCandidateFieldName(self, candidateFields, output):
        """ This function adjusts the field names for shp and dbf file outputs
        """
        cNames = {i.name:0 for i in candidateFields}

        for i in range(len(candidateFields)):
            cNames[candidateFields[i].name]+=1
            ext = ""

            if cNames[candidateFields[i].name] > 1:
                ext = str(cNames[candidateFields[i].name] -1)
            
            candidateFields[i].name = candidateFields[i].name.replace(".", "_")+ext
            
            
        if UTILS.isGDB(output):
            return candidateFields
        else:
            maxNumPos = 10
            reduceSizeTo = 7
            fields = [ i.name for i in candidateFields]
            options = ["_MAX", "_MIN", "_STD", "_MAD", "_RES", "_FILLED" , "_UNFILLED", "_EST", "_NNBRS"]
            replace = ["_MA", "_MI", "_ST", "_MD", "_RE", "_FI" , "_UN", "_ES", "_NN"]
            maxLen = max(map(len, fields))

            #### Reduce Field Name Size ####
            nFields = NUM.array([(i[0:maxNumPos], i, False) if len(i) > maxNumPos else (i, i, False) 
                                  for i in fields], 
                                  dtype =[("newField", "U10"), 
                                          ('field', "U" +str(maxLen)),
                                          ('changed', bool)])
            #### Check If Field Contains Key Word Then Replace By Abbreviation ####
            for index in NUM.arange(len(nFields)):
                field = nFields[index]
                for id, opt in enumerate(options):
                    if opt in field[1] and field[1] != field[0]:
                        if field[1][-1 * len(opt):] == opt:
                            nFields[index][0] = field[0][0:reduceSizeTo] + replace[id]
                            nFields[index][2] = True
            
            #### Verify Uniqueness ####
            unique, count = NUM.unique(nFields['newField'], return_counts= True)

            #### Fix Uniqueness ####
            if len(nFields) != len(count):
                for indu, uniq in enumerate(unique):
                    numRep = count[indu]
                    cnt = 1
                    if numRep > 1:
                        for index, field in enumerate(nFields):
                            if field[0] == uniq:
                                if nFields[index][2]:
                                    fieldValue = field[0][0:(reduceSizeTo-1)] + '{:02}'.format(cnt) + field[0][-3:]
                                    nFields[index][0] = fieldValue
                                else:
                                    fieldValue = field[0][0:(reduceSizeTo+1)] + '{:02}'.format(cnt)
                                    nFields[index][0] = fieldValue
                                cnt += 1

            #### Replace Candidate Field Names By Unique Names ####
            for idField in NUM.arange(len(candidateFields)):
                if candidateFields[idField].name == nFields[idField][1]:
                    candidateFields[idField].name = nFields[idField][0]
            return candidateFields

