# coding: utf-8
"""
Source Name:   SSDataObject.py
Version:       ArcGIS 10.1
Author:        Environmental Systems Research Institute Inc.
Description:   Python virtual wrapper for feature classes in the context
               of spatial statistics script tools.  Incorporates Utility
               Functions from SSUtilities.py while maintaining
               characteristics of the input feature class.
               The geoprocessor is also included via composition.
"""

################### Imports ########################

import os as OS
import collections as COLL
import numpy as NUM
import arcgisscripting as ARC
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.conversion as CONV
import arcpy.da as DA
import arcpy.analysis as ANA
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSTimeUtilities as TUTILS
import locale as LOCALE
import gapy as GAPY
import WeightsUtilities as WU
import datetime as DT
import Stats as STATS

################## Methods #########################
def table2RecArray(inputTable, fieldNames, types = [0,1,2,3,4,5,6,8,9,10],
                   minNumObs = 0, warnNumObs = 0,
                   explicitBadRecordID = None,
                   silentWarnings = False,
                   returnOID = False, progressID = 84001,
                   includeNulls = False, hasTimeField = False, 
                   describeInfo = None, ssdo = None, masterField = None,
                   ignoreDateHighPrecision = False):

    fieldNames = [i.upper() for i in fieldNames]

    info = None

    #### Avoid to Describe Twice The Table ####
    if describeInfo is not None:
        info = describeInfo
    elif ssdo is not None:
        info = ssdo.info
        ignoreDateHighPrecision = ssdo.ignoreDateHighPrecision
    else:
        info = ARCPY.Describe(inputTable)

    if masterField is None:
        #### Tables Not Supported ####
        try:
            oidName = info.oidFieldName
        except:
            ARCPY.AddIDMessage("ERROR", 110150)
            raise SystemExit()
    else:
        oidName = masterField

    if not hasattr(info, "HasOID64"):
        hasOID64 = False
    else:
        hasOID64 = info.HasOID64

    #### Get Base Count, May Include Bad Records ####
    initialCount = UTILS.getCount(inputTable)

    #### Obtain a Full List of Field Names/Type ####
    allFields = {}
    listFields = info.fields
    for field in listFields:
        name = field.name.upper()
        allFields[name] = FCField(field, ignoreDateHighPrecision = ignoreDateHighPrecision)

    #### Check Fields ####
    fields = {}
    for fieldName in fieldNames:
        fieldType = ERROR.checkField(allFields, fieldName, types = types)
        fieldObj = allFields[fieldName]
        fieldObj.createDataArray(initialCount)
        fields[fieldName] = fieldObj

    fieldList = [oidName] + fieldNames

    #### Keep track of Invalid Fields ####
    badRecords = []
    numFields = len(fieldList)
    fieldList = UTILS.getOriginalFieldName(fieldList, info.fields)

    #### Create Progressor Bar ####
    ARCPY.SetProgressor("step", ARCPY.GetIDMessage(progressID), 0, initialCount, 1)

    #### Process Field Values ####
    try:
        rows = DA.SearchCursor(inputTable, fieldList)
    except:
        ARCPY.AddIDMessage("ERROR", 204)
        raise SystemExit()
    master2Order = {}
    order2Master = {}

    if not includeNulls:
        numObs = 0
        c = 0
        oids = []
        for row in rows:
            oid = row[0]
            badValues = row.count(None)

            #### Check Bad Record ####
            if badValues or oid is None:
                if badValues:
                    badRecords.append(oid)
                else:
                    badRecords.append(c)
            else:
                #### Add Field Values ####
                restFields = row[1:]
                for fieldInd, fieldName in enumerate(fieldNames):
                    fieldValue = restFields[fieldInd]
                    fields[fieldName].data[numObs] = fieldValue
                    fields[fieldName].insertValue(numObs, fieldValue)
                numObs += 1
  
                oids.append(oid)
                #### Check uniqueness of masterID field ####
                if oid in master2Order:
                    del rows
                    ARCPY.AddIDMessage("ERROR", 644, masterField)
                    ARCPY.AddIDMessage("ERROR", 643)
                    raise SystemExit()
                else:
                    master2Order[oid] = c
                    order2Master[c] = oid
                    c+=1
            ARCPY.SetProgressorPosition()
    else:
        numObs = 0
        c = 0
        oids = []
        for row in rows:
            oid = row[0]
            badValues = False
            if hasTimeField:
                if row[-1] is None:
                    badValues = True

            #### Check Bad Record ####
            if badValues or oid is None:
                if badValues:
                    badRecords.append(oid)
                else:
                    badRecords.append(c)
            else:
                #### Add Field Values ####
                restFields = row[1:]
                for fieldInd, fieldName in enumerate(fieldNames):
                    fieldValue = restFields[fieldInd]
                    if fieldValue not in [None, 'nan', NUM.inf]:
                        fields[fieldName].data[numObs] = fieldValue
                        fields[fieldName].insertValue(numObs, fieldValue)
                    else:
                        typeField = fields[fieldName].data.dtype
                        if typeField in [float, NUM.float32]:
                            fields[fieldName].insertValue(numObs, NUM.nan)
                        elif typeField.kind in ['U', 'S']:
                            fields[fieldName].insertValue(numObs, 'nan')
                        elif typeField.kind == "M":
                            fields[fieldName].insertValue(numObs, 'nat')
                        else:
                            fields[fieldName].insertValue(numObs, NUM.iinfo(typeField).min)
                numObs += 1
                oids.append(oid)
                #### Check uniqueness of masterID field ####
                if oid in master2Order:
                    del rows
                    ARCPY.AddIDMessage("ERROR", 644, masterField)
                    ARCPY.AddIDMessage("ERROR", 643)
                    raise SystemExit()
                else:
                    master2Order[oid] = c
                    order2Master[c] = oid
                    c+=1
            ARCPY.SetProgressorPosition()

    del rows

    #### Check Whether the Number of Features is Appropriate ####
    ERROR.checkNumberOfObs(numObs, minNumObs = minNumObs,
                            warnNumObs = warnNumObs,
                            silentWarnings = silentWarnings)

    #### Process any bad records encountered ####
    bn = len(badRecords)
    if bn:
        #### Get Set of Bad IDs ####
        badRecords = list(set(badRecords))
        badRecords.sort()
        strBadRecords = [ str(i) for i in badRecords ]
        cnt = numObs + bn
        if not silentWarnings or masterField is not None:
            ERROR.reportBadRecords(cnt, bn, strBadRecords, label = oidName,
                                   explicitBadRecordID = explicitBadRecordID)
        caseIsDate = False

        for fieldName, fieldObj in UTILS.iteritems(fields):
            fields[fieldName].data = fieldObj.data[0:numObs]

    #### Create Record Array ####
    dtypes = []
    if returnOID:
        if hasOID64:
            dtypes.append((oidName, NUM.int64))
        else:
            dtypes.append((oidName, NUM.int32))

    for fieldName in fieldNames:
        dtypes.append((fieldName, fields[fieldName].data.dtype))

    recArray = NUM.empty(numObs, dtype = dtypes)

    if returnOID and masterField is None:
        recArray[oidName] = oids

    if ssdo is not None:
        ssdo.master2Order = master2Order
        ssdo.order2Master = order2Master
        ssdo.badRecords = badRecords
        ssdo.fields = fields
        ssdo.numObs = len(master2Order)
        return

    for fieldName in fieldNames:
        recArray[fieldName] = fields[fieldName].data

    return recArray

################## Classes #########################

class CandidateField(object):
    """Contains information for a field that is a candidate to be added to an
    output feature class

    INPUTS:
    name (str): name of the field
    type (str): type of data {'Single', 'Double', 'Integer', etc...}
    data (array): 1-d array of values
    alias {str, None}: field alias
    length {int, None}: length of the field

    METHODS:
    report
    """

    def __init__(self, name, type, data = None, alias = None,
                 nullable = True, precision = None, scale = None,
                 length = None, required = False, domain = None,
                 checkNullValues = False, int_min_as_null = None,
                 cvDomain = {}):
        """

        Parameters
        ----------
        name
        type
        data          : NUM.ndarray
                        1-d array of values.
                        If data type is Double, you can use NUM.nan for NULL values
        alias
        nullable
        precision
        scale
        length
        required
        domain
        checkNullValues: bool
                         whether to check for null values in the data and try to replace with Null in File GDB outputs
        int_min_as_null: int
                         Customized value to be treated as NULL for integer fields, default value in c++ is -2147483648,
                         use this one if you don't want to provide a customized one
        cvDomain
        """

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())
        if int_min_as_null is not None:
            self.int_min_as_null = int(int_min_as_null)

        self.typeInt = UTILS.dataType2Int[type.upper()]

        #### Set Unique Type Indicator ####
        self.isCandidateField = True

        #### Set Output Date Field Precision ####
        if type.upper() in UTILS.datePrecisionTypes:
            if self.precision in [0, None]:
                self.precision = 0
            else:
                self.precision = 1

        #### Check Coded Value Domain ####
        if len(cvDomain):
            if self.typeInt not in [1,5]:
                self.cvDomain = {}
            else:
                #### Set/Check Key/Value Types and Possibly Set Length ####
                maxLength = 0
                for k,v in cvDomain.items():
                    if not isinstance(cvDomain[k], str) or not isinstance(k, int):
                        msg = "Coded Value Domains must have integers as keys and strings as values."
                        ARCPY.AddError(msg)
                        raise SystemExit
                    else:
                        maxLength = max(maxLength, len(v))

                if self.length is None:
                    self.length = maxLength

        #### Check data type of the data array ####
        self.checkType()

    def checkType(self):
        """ Checks the type of the data array and converts it to the appropriate type if necessary,
            avoiding an exception in 3.11
        """
        if self.data is not None and \
           type(self.data) in  [NUM.ndarray, NUM.ma.core.MaskedArray] and \
           self.data.dtype == float:
            if self.type.upper() in  ["LONG", "INTEGER"]:
                self.data = NUM.asarray(self.data, dtype= NUM.int32)
            if self.type.upper() == "BIGINTEGER":
                self.data = NUM.asarray(self.data, dtype= NUM.int64)

    def report(self, fileName = None):
        """Reports Field Information.

        INPUTS:
        fileName {str, None}: path to report text file
        """

        header = "Candidate Field Description"
        row1 = ["Field Name: ", self.name]
        row2 = ["Field Type: ", self.type]
        row3 = ["Field Alias: ", str(self.alias)]
        row4 = ["Field Length: ", str(self.length)]
        results =  [row1, row2, row3, row4]
        outputTable = UTILS.outputTextTable(results, header = header)
        if fileName:
            f = UTILS.openFile(fileName, "w")
            UTILS.writeText(f, outputTable)
            f.close()
        else:
            ARCPY.AddMessage(outputTable)

    def copy2FC(self, outputFC):
        """Copies self to an output feature class.

        INPUTS:
        outputFC (str): path to output feature class
        """

        UTILS.addEmptyField(outputFC, self.name, self.type,
                            alias = self.alias,
                            nullable = self.nullable,
                            precision = self.precision,
                            scale = self.scale,
                            length = self.length,
                            required = self.required,
                            domain = self.domain)
        
    def returnDouble(self, replaceNullInts = False):
        """Converts integers to doubles (NUM.float64) for analysis.
        
        INPUTS:
        replaceNullInts {bool, False}: whether to replace NULL Int Values with NaNs.
        """

        if self.data is not None:
            upperType = self.type.upper()
            if upperType in ['LONG', 'SHORT', 'FLOAT', 'BIGINTEGER']:
                if replaceNullInts:
                    #### Replace NULL Integer Values w/ NaN after Float Conversion ####
                    typeField = self.data.dtype
                    replaceBool = self.data == NUM.iinfo(typeField).min
                    data = NUM.array(self.data, dtype = NUM.float64)
                    data[replaceBool] = NUM.nan
                    return data
                else:
                    return NUM.array(self.data, dtype = NUM.float64)
            elif upperType in ['DATE', 'DATEONLY', 'TIMESTAMPOFFSET']:
                return NUM.array((self.data - self.data.min()), dtype = NUM.float64)
            else:
                return self.data

class FCField(object):
    """Python representation of a database field to be organized and
    dispatched by SSDataObject.

    INPUTS: CandidateField
    fieldObject (obj): instance of a field object from ARCPY.ListFields(*)

    ATTRIBUTES:
    name (str): name of the field
    baseName (str): name of th field on disk, I.e. without table joins
    type (str): type of data {'Single', 'Double', 'Integer', etc...}
    length (int): length of the field

    METHODS:
    createDataArray: creates empty numpy arrays for field values.
    resizeDataArrays: resizes arrays to accounnt for bad records.
    """

    def __init__(self, fieldObject, ignoreDateHighPrecision = False):
        self.name = fieldObject.name
        self.baseName = fieldObject.baseName
        self.type = fieldObject.type
        self.length = fieldObject.length
        self.fieldObject = fieldObject
        self.alias = fieldObject.aliasName
        self.nullable = fieldObject.isNullable
        self.precision = fieldObject.precision
        self.editable = fieldObject.editable
        self.ignoreDateHighPrecision = ignoreDateHighPrecision
        self.convertUTC = self.type == "TimestampOffset"
        self.rawData = None

    def createDataArray(self, numObs):
        """Creates empty numpy arrays for field values.

        INPUTS:
        numObs (int): number of features
        """

        if self.type in UTILS.numpyConvert:
            myType = UTILS.numpyConvert[self.type]
            if self.type == "String":
                if self.length > 512:
                    self.length = 512
                myType = myType % self.length
            elif self.type == "Date":
                if self.precision and not self.ignoreDateHighPrecision:
                    myType = 'datetime64[ms]'
                else:
                    myType = 'datetime64[s]'
            elif self.type in ["TimestampOffset", "DateOnly"]:
                if not self.ignoreDateHighPrecision:
                    myType = 'datetime64[ms]'
                else:
                    myType = 'datetime64[s]'
        else:
            myType = 'a64'

        self.data = NUM.empty((numObs,), dtype = myType)
        if self.convertUTC:
            self.rawData = NUM.empty((numObs,), dtype = 'O')

    def copy2FC(self, outputFC, outName = None, setNullable = False):
        """Copies self to an output feature class.

        INPUTS:
        outputFC (str): path to output feature class
        outName (str): optional output field name (for joins and such.)
        setNullable (bool): if set to true, overwrite self to nullable
        """

        if outName is None:
            outName = self.name

        if setNullable:
            nullable = True
        else:
            nullable = self.nullable

        UTILS.addEmptyField(outputFC, outName, self.type,
                            alias = self.alias,
                            nullable = nullable,
                            precision = self.fieldObject.precision,
                            scale = self.fieldObject.scale,
                            length = self.fieldObject.length,
                            required = self.fieldObject.required,
                            domain = self.fieldObject.domain)

    def returnDouble(self, replaceNullInts = False, replaceNullValues = False):
        """Converts integers to doubles (NUM.float64) for analysis.
        
        INPUTS:
        replaceNullInts {bool, False}: whether to replace NULL Int Values with NaNs.
        replaceNullValues {bool, False}: whether to replace NULL Numeric Values with NaNs.
        """

        if self.type in ['SmallInteger', 'Integer', 'BigInteger']:
            if replaceNullInts or replaceNullValues:
                #### Replace NULL Integer Values w/ NaN after Float Conversion ####
                typeField = self.data.dtype
                replaceBool = self.data == NUM.iinfo(typeField).min
                data = NUM.array(self.data, dtype = NUM.float64)
                data[replaceBool] = NUM.nan
                return data
            else:
                return NUM.array(self.data, dtype = NUM.float64)
        elif self.type == 'Double':
            if replaceNullValues:
                #### Replace NULL Integer Values w/ NaN after Float Conversion ####
                typeField = self.data.dtype
                replaceBool = self.data <= (NUM.finfo(typeField).min / 10)
                data = NUM.array(self.data, dtype=NUM.float64)
                data[replaceBool] = NUM.nan
                return data
            else:
                return NUM.array(self.data, dtype=NUM.float64)
        elif self.type in ['Date', 'DateOnly', 'TimestampOffset']:
            return NUM.array((self.data - self.data.min()), dtype = float)
        else:
            return self.data

    def insertValue(self, index, value):
        if self.convertUTC:
            self.rawData[index] = value
            self.data[index] = value.replace(tzinfo = DT.timezone.utc)
        else:
            self.data[index] = value

class SSDataObject(object):
    """Spatial Statistics Data Object: Creates and keeps track of
    Feature Class information for scripts in the Spatial Statistics
    Toolbox.

    INPUTS:
    inputFC (str): catalogue path to the input feature class
    templateFC {str, None}: catalogue path to a template feature class (1)
    explicitSpatialRef {str/obj, None}: explicit definition of the spatial ref
    silentWarnings {bool, False}: whether to print initial warnings
    useChordal {bool, True}: whether to use chordal distance for GCS data
    invalidGCS {bool, False}: whether to allow GCS data
    displayProjectionWarning  {bool, True}: display warning about projection

    ATTRIBUTES:
    inPath (str): workspace
    inName (str): fileName
    info (object): result of GeoProcessor method
    catPath (str): catalogue path to the input feature class
    shapeType (str): type of feature class; I.e. Polygon, Point
    shapeField (str): name of the shapeField
    spatialRef (str): spatial reference
    oidName (str): name of the object ID field
    shapeFileBool (bool): is the input FC a shapefile?

    METHODS:
    setHiddenFields
    createOutputFieldMappings
    obtainData
    obtainDataGA
    output2NewFC

    NOTES:
    (1) the template feature class defines environment variables that affect
        reading/writing/calculating
    """

    def __init__(self, inputFC, templateFC = None, explicitSpatialRef = None,
                 silentWarnings = False, useChordal = True,
                 invalidGCS = False, displayProjectionWarning = True,
                 ignoreZEnvironment = False, silentErrors = False,
                 ignoreDateHighPrecision = False):

        #### Validate Input Feature Class ####
        ERROR.checkFC(inputFC)
        try:
            self.inPath, self.inName = OS.path.split(inputFC)
        except:
            self.inPath = None
            self.inName = inputFC

        #### Flags to Throw Warnings/Errors in Init ####
        throwWarnings = not silentWarnings
        throwErrors = not silentErrors

        if self.inPath:
            self.shapeFileBool = UTILS.isShapeFile(inputFC)

            #### Create Feature Layer if LYR File ####
            path, ext = OS.path.splitext(inputFC)
            if ext.upper() == ".LYR":
                tempFC = "SSDO_FeatureLayer"
                DM.MakeFeatureLayer(inputFC, tempFC)
                inputFC = tempFC

        #### Describe Input ####
        self.info = ARCPY.Describe(inputFC)

        #### ShapeFile Boolean ####
        self.shapeFileBool = UTILS.isShapeFileOrDBF(inputFC, desc = self.info)

        #### Assure Input are Features with OIDs ####
        if not hasattr(self.info, "oidFieldName") and throwErrors:
            ARCPY.AddIDMessage("ERROR", 339, self.inName)
            raise SystemExit()
            
        #### Allow a Master Field as String ####
        self.allowedTypesForMaster = [0,1,5,8]

        #### Assign Describe Objects to Class Attributes ####
        self.inputFC = inputFC
        self.catPath = self.info.CatalogPath
        self.oidName = self.info.oidFieldName
        self.dataType = self.info.DataType
        self.templateFC = templateFC
        if not hasattr(self.info, "HasOID64"):
            self.hasOID64 = False
        else:
            self.hasOID64 = self.info.HasOID64
        self.hasJoin = "." in self.oidName

        #### Assure New Field Compat ####
        self.newFieldTypeChecker = UTILS.NewFieldTypeChecker(self.inputFC)
        if self.templateFC is not None and not silentErrors:
            self.newFieldTypeChecker.addOutput(self.templateFC)

        #### Create Composition and Accounting Structure ####
        self.fields = {}
        self.master2Order = {}
        self.order2Master = {}

        #### Obtain a Full List of Field Names/Type ####
        self.allFields = {}
        listFields = self.info.fields

        self.ignoreDateHighPrecision = ignoreDateHighPrecision
        for field in listFields:
            name = field.name.upper()
            self.allFields[name] = FCField(field, ignoreDateHighPrecision = ignoreDateHighPrecision)

        self.silentWarnings = silentWarnings
        self.shapeType = None
        self.shapeField = None
        self.hasM = False
        self.hasZ = False
        self.isTable = self.dataType in UTILS.dataTypeTable

        if self.dataType in UTILS.dataTypeNoTable and throwErrors:
            ARCPY.AddIDMessage("ERROR", 272)
            raise SystemExit

        if  not self.isTable:
            self.shapeType = self.info.ShapeType
            self.shapeField = self.info.ShapeFieldName
            self.hasM = self.info.HasM
            self.hasZ = self.info.HasZ
        else:
            self.numObs = 0
            self.masterField = self.oidName
            self.renderType = None
            self.fidSet = None
            if self.dataType == "TableView":
                self.fidSet = self.info.FIDSet
                if self.fidSet == "":
                    self.selectionSet = False
                else:
                    self.selectionSet = True
            if self.dataType == "MosaicLayer":
                self.inputFC = OS.path.join(self.info.nameString,"Footprint")
            return

        ####  Set type of shape ####
        self.complexFeature = False
        if self.info.shapeType == "Multipoint":
            self.complexFeature = True

        #### Set Initial Extent Depending on DataType ####
        if self.dataType in ["FeatureLayer", "Layer"]:
            try:
                tempInfo = ARCPY.Describe(self.catPath)
                extent = tempInfo.extent
            except:
                #### in_memory, SDE, NetCDF etc... ####
                extent = self.info.extent
            self.fidSet = self.info.FIDSet
            if self.fidSet == "":
                self.selectionSet = False
            else:
                self.selectionSet = True
        else:
            extent = self.info.extent
            self.fidSet = ""
            self.selectionSet = False
        self.extent = extent

        #### Set Spatial Reference ####
        inputSpatRef = self.info.SpatialReference
        inputSpatRefName = inputSpatRef.name
        if explicitSpatialRef:
            #### Explicitely Override Spatial Reference ####
            self.templateFC = None
            self.spatialRef = explicitSpatialRef
        else:
            #### 1. Feature Dataset, 2. Env Setting, 3. Input Hierarchy ####
            self.spatialRef = UTILS.returnOutputSpatialRef(inputSpatRef,
                                                  outputFC = templateFC)
        self.spatialRefString = UTILS.returnOutputSpatialString(self.spatialRef)
        self.spatialRefName = self.spatialRef.name
        self.spatialRefType = self.spatialRef.type

        #### Warn if Spatial Reference Changed ####
        if throwWarnings:
            UTILS.compareSpatialRefNames(inputSpatRefName, self.spatialRefName)

        #### Check for Projection ####
        if self.spatialRefType.upper() != "PROJECTED":
            if self.spatialRefType.upper() == "GEOGRAPHIC":

                if invalidGCS and throwErrors:
                    #### Explicit Fail for GCS ####
                    ARCPY.AddIDMessage("ERROR", 1022)
                    raise SystemExit()

                self.useChordal = useChordal
                if not explicitSpatialRef and displayProjectionWarning and throwWarnings:
                    if self.useChordal:
                        ARCPY.AddIDMessage("WARNING", 1605)
                    else:
                        ARCPY.AddIDMessage("WARNING", 916)
            else:
                self.useChordal = False
                if not explicitSpatialRef and displayProjectionWarning:
                    ARCPY.AddIDMessage("WARNING", 916)
        else:
            self.useChordal = False

        #### Angular/Linear Unit Info ####
        self.distanceInfo = UTILS.DistanceInfo(self.spatialRef, useChordalDistances = self.useChordal)

        if not ignoreZEnvironment:
            #### Set Z and M Flags and Defaults ####
            zmInfo = UTILS.setZMFlagInfo(self.hasM, self.hasZ, self.spatialRef)
            self.zFlag, self.mFlag, self.defaultZ = zmInfo
            self.zBool = self.zFlag == "ENABLED"
        else:
            self.zFlag = "ENABLED" if self.hasZ else "DISABLED"
            self.mFlag = "ENABLED" if self.hasM else "DISABLED"
            self.defaultZ = 0
            self.zBool = self.hasZ

        #### Render Type ####
        self.renderType = UTILS.renderType[self.shapeType.upper()]

        #### Contain cKDTree ####
        self.tree = None

    def warnNotUsingHighPrecisionDates(self, dateFieldNames = [], silentWarning = False):
        """Throw Warning When Ignoring High Precision Dates."""

        warn = False
        if self.ignoreDateHighPrecision:
            for fieldName in dateFieldNames:
                upperName = fieldName.upper()
                if upperName in self.allFields:
                    field = self.allFields[upperName]
                    if field.type.upper() == "DATE" and field.precision == 1:
                        warn = True
                        break
                    elif field.type.upper() == "TIMESTAMPOFFSET":
                        warn = True
                        break

        if warn and not silentWarning:
            ARCPY.AddIDMessage("WARNING", 110521)

        return warn

    def warnNotUsingUTC(self, dateFieldNames = [], silentWarning = False):
        """Throw Warning When Ignoring High Precision Dates."""

        warn = False
        for fieldName in dateFieldNames:
            upperName = fieldName.upper()
            if upperName in self.allFields:
                field = self.allFields[upperName]
                if field.type.upper() == "TIMESTAMPOFFSET":
                    warn = True
                    break

        if warn and not silentWarning:
            ARCPY.AddIDMessage("WARNING", 110541)

        return warn

    def getRecordArray(self, omitShape = False):
        """Returns record array for all fields including geometry/centroids for
        PANDAS data frames.
        """

        #### Create Data Array ####
        allFieldInfo = []
        if not omitShape:
            allFieldInfo.append(("SHAPE@", "object"))
        for fieldName in self.fieldNames:
            dType = self.fields[fieldName].data.dtype
            allFieldInfo.append((fieldName, dType))

        data = NUM.empty((self.numObs,), dtype = allFieldInfo)

        #### Pack Data Array ####
        if not omitShape:
            data['SHAPE@'] = self.getShapesAsArray()

        for fieldName in self.fieldNames:
            data[fieldName] = self.fields[fieldName].data

        return data

    def createCentroidGeometries(self):
        shapes = NUM.empty((self.numObs, ), dtype = object)
        for index in UTILS.ssRange(self.numObs):
            x,y = self.xyCoords[index]
            newPoint = ARCPY.Point(x, y)
            if self.hasZ:
                newPoint.Z = self.zCoords[index]
            geom = ARCPY.PointGeometry(newPoint, self.spatialRef)
            shapes[index] = geom

        return shapes

    def getShapesAsArray(self):
        if self.requireGeometry:
            return NUM.asarray(self.shapes, dtype = object)
        else:
            return self.createCentroidGeometries()

    def getDataFrame(self):
        """Creates a PANDAS DataFrame out of all the fields in the DataObject.
        """
        import pandas as PANDAS

        if hasattr(self, 'numObs'):
            ids = [self.order2Master[i] for i in range(self.numObs)]
            convertDictDF = {}
            for fieldName, fieldObject in self.fields.items():
                convertDictDF[fieldName] = fieldObject.data
        
            return PANDAS.DataFrame(convertDictDF, index = ids)

    def getSpatialDataFrame(self):
        """Creates an ArcGIS Python API Spatial Data Frame out of all the
        fields in the DataObject.  If the requireGeometry boolean option on
        the obtainData call was False then True Centroids will be returned instead
        of the actual geometries.
        """
        import arcgis as ARCGIS

        df = self.getDataFrame()
        shapes = self.getShapesAsArray()
        return ARCGIS.features.SpatialDataFrame(df, geometry = shapes, sr = self.spatialRef)

    def setHiddenFields(self):
        """Keeps track of all the fields in the input feature class that
        are not being used in analysis to prevent unnecessary copying to
        output feature class.

        ATTRIBUTES SET:
        hidden (list): list of field names disabled for output copy.
        """

        self.hidden = []
        for field in self.allFields:
            if field not in self.fields:
                self.hidden.append(field)

        self.hidden.remove(self.shapeField.upper())
        self.hidden.remove(self.oidName.upper())

    def resizeDataArrays(self, goodRecs):
        """For the obtainData option only, removes bad records from arrays.

        INPUTS:
        goodRecs (int): number of good records (valid shape and data values)
        """

        for fieldName, fieldObj in UTILS.iteritems(self.fields):
            self.fields[fieldName].data = fieldObj.data[0:goodRecs]
            if self.fields[fieldName].rawData is not None:
                self.fields[fieldName].rawData = fieldObj.rawData[0:goodRecs]

    def getDistance(self, distanceValue):
        """
        Calculate the distance from  distance - Unit
        """

        extentFactor = self.distanceInfo.convertFactor

        if distanceValue is not None:
            dist = str(distanceValue)

            if dist.isnumeric():
                distanceValue = UTILS.strToFloat(dist)
            else:
                dist, unit  = distanceValue.split(" ")
                try:
                    dist = UTILS.strToFloat(dist)
                    hasSearchSize = True
                except:
                    ARCPY.AddIDMessage("ERROR", 598, str(dist))
                    raise SystemExit()
                    
            searchUnit = UTILS.returnSpaceUnit(unit.upper())
            searchStr, distFactor = UTILS.distanceUnitInfo[unit.upper()]
            dist = dist * distFactor / extentFactor
            distanceValue = dist
        return distanceValue

    def getSurfaceAreaInfo(self):
        """Returns the total area of the extent of the feature centroids
           as well as the percentage that area makes up of the total 
           surface of the planet.
        """

        #### Get Extent Info ####

        try:   
            self.area = self.extent.polygon.getArea('PRESERVE_SHAPE')
            if self.useChordal:
                maxExtent = self.sliceInfo.maxExtent
                boundary2Use = self.sliceInfo
            else:
                envelope = UTILS.Envelope(self.extent)
                maxExtent = envelope.maxExtent
                boundary2Use = envelope
                self.envelope = envelope
        except:
                envelope = UTILS.Envelope(self.extent)
                maxExtent = envelope.maxExtent
                boundary2Use = envelope
                self.envelope = envelope
                self.area = maxExtent * envelope.minExtent

        if not self.numObs:
            self.defaultCellSize = None
            self.uniqueXY = self.xyCoords
            self.numUnique = 0
            self.allUnique = True
        else:
            self.defaultNumCells = UTILS.maximumNumberOfCells
            self.defaultCellSize = UTILS.roof(maxExtent / (self.defaultNumCells * 1.0))

            #### Get Unique XY and Coincident Counts ####
            self.uniqueXY, self.counts = STATS.uniqueRows(self.xyCoords)
            self.numUnique = len(self.uniqueXY)
            self.isPanelData = self.counts.std() == 0.0
            self.allUnique = self.numUnique == self.numObs

        try:
            self.convexHull = UTILS.getConvexHull(self.uniqueXY, self.spatialRef)
            self.convexArea = self.convexHull.getArea('PRESERVE_SHAPE')
        except:
            self.convexArea = 0

        if self.convexArea > 0.0:
            self.skipNearestNeighbor = STATS.isDense(self.defaultCellSize, 
                                                     self.convexArea,
                                                     self.numUnique)
        else:
            self.skipNearestNeighbor = False

    def createCoincidentReport(self):
        """Reports coincident point information."""

        coinBool = self.counts != 1
        numWithCoin = coinBool.sum()
        coinCounts = self.counts[coinBool]
        minCoin = coinCounts.min()
        maxCoin = coinCounts.max()
        avgCoin = coinCounts.mean()
        numCoin = self.numObs - self.numUnique
        header = ARCPY.GetIDMessage(84757)
        rows = [
                [ARCPY.GetIDMessage(84752), str(self.numObs)],
                [ARCPY.GetIDMessage(84758), str(self.numUnique)],
                [ARCPY.GetIDMessage(84760), str(numCoin)],
                [ARCPY.GetIDMessage(84759), str(numWithCoin)],
                [ARCPY.GetIDMessage(84412), str(minCoin)],
                [ARCPY.GetIDMessage(84413), str(maxCoin)],
                [ARCPY.GetIDMessage(84738), UTILS.formatValue(avgCoin, "%0.2f")]
               ]

        tab = UTILS.outputTextTable(rows, header = header, justify = ['left', 'right'],
                                    emphasizeHeadRow=False, returnHTMLMsg=True, pad=1,
                                    force2Txt=False)

        return tab

    def initializeRead(self, masterField, requireSearch = False,
                       requireGeometry = False):

        #### Assess Default ####
        if masterField is None:
            masterField = self.oidName

        #### Validation of Master Field ####
        ERROR.checkField(self.allFields, masterField, types = self.allowedTypesForMaster)
        self.masterIsOID = masterField == self.oidName
        self.masterField = masterField

        if requireSearch:
            #### Set Master and Data Indices ####
            if self.masterIsOID:
                self.masterColumnIndex = 0
                self.dataColumnIndex = 2
                fieldList = []
            else:
                self.masterColumnIndex = 2
                self.dataColumnIndex = 3
                fieldList = [masterField]

        else:
            #### Set Master and Data Indices ####
            if requireGeometry:
                shapeString = "shape@"
            else:
                shapeString = "shape@XY"

            if self.masterIsOID:
                self.masterColumnIndex = 0
                self.dataColumnIndex = 2
                fieldList = [self.oidName, shapeString]
            else:
                self.masterColumnIndex = 2
                self.dataColumnIndex = 3
                fieldList = [self.oidName, shapeString, masterField]

        return fieldList

    def testFields(self, fieldList, fields = [], types = [0,1,2,3,5,6,8,9,10]):

        #### Validation and Initialization of Data Fields ####
        self.fieldNames = []
        numFields = len(fields)
        dateInds = set([])
        for fieldInd, fieldName in enumerate(fields):
            fieldType = ERROR.checkField(self.allFields, fieldName, types = types)
            fieldList.append(fieldName)
            self.fieldNames.append(fieldName)
            self.fields[fieldName] = self.allFields[fieldName]
            if fieldType.upper() == "DATE":
                dateInds.add(fieldInd)

        return fieldList, dateInds

    def initializeFields(self, numObs):

        #### Create Empty Data Arrays ####
        for fieldName, fieldObj in UTILS.iteritems(self.fields):
            fieldObj.createDataArray(numObs)

    def finalizeRead(self, gaTable = None, minNumObs = 0, warnNumObs = 0,
                     explicitBadRecordID = None):
        #### Set Number of Features ####
        self.numObs = len(self.master2Order)

        if gaTable is None:
            #### Get Set of Bad IDs ####
            self.badRecords = list(set(self.badRecords))
            self.badRecords.sort()
            strBadRecords = [ str(i) for i in self.badRecords ]

            #### Process any bad records encountered ####
            bn = len(self.badRecords)
            if bn:
                cnt = self.numObs + bn
                if not self.silentWarnings:
                    ERROR.reportBadRecords(cnt, bn, strBadRecords, label = self.oidName,
                                           explicitBadRecordID = explicitBadRecordID)

                #### Prune Data Arrays ####
                self.xyCoords = self.xyCoords[0:self.numObs]
                self.resizeDataArrays(self.numObs)

                if self.hasZ:
                    self.zCoords = self.zCoords[0:self.numObs]
                if self.requireGeometry:
                    self.shapes = self.shapes[0:self.numObs]

            #### Check Whether the Number of Features is Appropriate ####
            ERROR.checkNumberOfObs(self.numObs, minNumObs = minNumObs,
                                   warnNumObs = warnNumObs,
                                   silentWarnings = self.silentWarnings)

        #### Reset Extent to Honor Env and Subsets ####
        try:
            self.extent = UTILS.resetExtent(self.xyCoords,
                                            spatialRef = self.spatialRef)
        except:
            pass

        #### Reset Coordinates for Chordal ####
        if self.useChordal:
            #### Project to XY on Spheroid ####
            self.spheroidCoords = ARC._ss.lonlat_to_xy(self.xyCoords,
                                                       self.spatialRef)
            self.sliceInfo = UTILS.SpheroidSlice(self.extent,
                                                 self.spatialRef)
        else:
            self.spheroidCoords = None
            self.sliceInfo = None

        #### Set Further Attributes ####
        self.gaTable = gaTable

        #### Set the Hidden Fields (E.g. Not in Use) ####
        self.setHiddenFields()

        #### Area Type and Default Cell Size ####
        self.getSurfaceAreaInfo()

    def obtainData(self, masterField = None, fields = [],
                   requireSearch = False, requireGeometry = False,
                   types = [0,1,2,3,4,5,6,8,9,10], minNumObs = 0, warnNumObs = 0,
                   explicitBadRecordID = None, useNullinFields = [], 
                   allowMasterStr = False):
        """Takes a list of field names and returns it in a dictionary
        structure.

        INPUTS:
        masterField (str): name of field being used as the master
        fields {list, []}: name(s) of the field to be returned
        requireSearch {bool, False}: Require Neighborhood Searching
        requireGeometry {bool, False}: Require Full Geometry (1)
        types (list): types of data allowed to be returned
        minNumObs {int, 0}: minimum number of observations for error
        warnNumObs {int, 0}: minimum number of observations for warning
        explicitBadRecordID {int, None}: specific error msg to call
        useNullinFields {list, None}: use record with nulls in fields

        ATTRIBUTES:
        gaTable (structure): instance of the GA Table
        fields (dict): fieldName = instance of FCField
        master2Order (dict): masterID = order in lists
        order2Master (dict): order in lists = masterID
        masterField (str): field that serves as the master
        badRecords (list): master IDs that could not be read
        xyCoords (array, nunObs x 2): xy-coordinates for feature centroids

        NOTES:
        (1) Require Geometry and Search are mutually exclusive
        """

        self.inputFieldList = fields

        if allowMasterStr:
            self.allowedTypesForMaster = [0,1,4,5,8]

        #### Check New Field Compatibility Before Read (Ideal), Requires Template FC ####
        if self.templateFC is not None:
            if masterField is None:
                masterField = self.oidName
            self.newFieldTypeChecker.checkMasterField(masterField, silent = False)
            self.outMasterIsBigInteger = self.newFieldTypeChecker.masterIs64
            self.newFieldTypeChecker.checkFields(fields = fields, silent = False)

        if self.isTable:
            getAllNullValues = True if len(useNullinFields) else False
            self.__obtainDataTable(masterField, fields = fields, types = types,
                                    minNumObs = minNumObs, warnNumObs = warnNumObs,
                                    explicitBadRecordID = explicitBadRecordID,
                                    getAllNullValues = getAllNullValues)
            return

        self.requireGeometry = requireGeometry
        self.requireSearch = requireSearch
        if requireSearch:

            if len(useNullinFields) > 0:
                ARCPY.AddIDMessage("WARNING", 556, ", ".join(useNullinFields))

            self.obtainDataGA(masterField, fields = fields, types = types,
                               minNumObs = minNumObs, warnNumObs = warnNumObs)
        else:
            self._verifyListFields(fields, useNullinFields)
            if requireGeometry:
                self.__obtainDataShapes(masterField, fields = fields, types = types,
                                        minNumObs = minNumObs, warnNumObs = warnNumObs,
                                        explicitBadRecordID = explicitBadRecordID,
                                        useNullinFields = useNullinFields)
            else:
                self.__obtainDataCentroids(masterField, fields = fields, types = types,
                                            minNumObs = minNumObs, warnNumObs = warnNumObs,
                                            explicitBadRecordID = explicitBadRecordID,
                                            useNullinFields = useNullinFields)

    def _verifyListFields(self, fields, useNullinFields):
        """ Verify that fields to ignore exist in general list """

        if len(useNullinFields) == 0:
            return

        for fieldWithNulls in useNullinFields:
            if fieldWithNulls not in fields:
                ARCPY.AddIDMessage("ERROR", 920, fieldWithNulls,  ",".join(fields))
                raise SystemExit()

    def __obtainDataCentroids(self, masterField = None, fields = [],
                              types = [0,1,2,3,4,5,6,8,9,10],
                              minNumObs = 0, warnNumObs = 0,
                              explicitBadRecordID = None, 
                              useNullinFields = []):
        """Takes a list of field names and returns it in a dictionary
        structure using complex feature classes.

        INPUTS:
        masterField (str): name of field being used as the master
        fields {list, []}: name(s) of the field to be returned
        types (list): types of data allowed to be returned (1)
        minNumObs {int, 0}: minimum number of observations for error
        warnNumObs {int, 0}: minimum number of observations for warning
        useNullinFields {list, None}: use record with nulls in fields

        ATTRIBUTES:
        gaTable (structure): instance of the GA Table
        fields (dict): fieldName = instance of FCField
        master2Order (dict): masterID = order in lists
        order2Master (dict): order in lists = masterID
        masterField (str): field thariman33333 serves as the master
        badRecords (list): master IDs that could not be read
        xyCoords (array, nunObs x 2): xy-coordinates for feature centroids
        """


        #### Get Base Count, May Include Bad Records ####
        cnt = UTILS.getCount(self.inputFC)

        #### Initialize Read/FieldList ####
        fieldList = self.initializeRead(masterField)

        #### Validation and Initialization of Data Fields ####
        fieldList, dateInds = self.testFields(fieldList, fields = fields,
                                              types = types)
        self.initializeFields(cnt)

        #### Initialization of Centroids  ####
        self.xyCoords = NUM.empty((cnt, 2), float)

        #### Z Coords ####
        if self.hasZ:
            self.zCoords = NUM.empty((cnt, ), float)
            fieldList.append("shape@Z")
        else:
            self.zCoords = None

        #### Keep track of Invalid Fields ####
        self.badRecords = []
        badRecord = False
        numFields = len(fieldList)
        if self.shapeType.upper() == "POLYLINE":
            isLine = True
        else:
            isLine = False

        #### Create Progressor Bar ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84001), 0, cnt, 1)
        fieldList = UTILS.getOriginalFieldName(fieldList, self.info.fields)

        #### Process Field Values ####
        try:
            rows = DA.SearchCursor(self.inputFC, fieldList, "",
                                   self.spatialRefString)
        except:
            ARCPY.AddIDMessage("ERROR", 204)
            raise SystemExit()

        if len(useNullinFields) == 0:
            c = 0
            for row in rows:
                oid = row[0]
                badValues = row.count(None)
                if not badValues:
                    centroid = row[1]
                    if isLine:
                        if centroid[0] is not None:
                            badValues = NUM.isnan(centroid[0]) or NUM.isnan(centroid[1])
                            if not badValues and self.hasZ:
                                badValues = row[-1] is None
                        else:
                            badValues = True
                    else:
                        badValues = centroid.count(None)

                #### Check Bad Record ####
                if badValues:
                    badRow = 1
                    badRecord = 1
                    self.badRecords.append(oid)
                else:
                    #### Get Centroid and Master ID ####
                    self.xyCoords[c] = row[1]
                    masterID = row[self.masterColumnIndex]

                    #### Add Field Values ####
                    if numFields:
                        restFields = row[self.dataColumnIndex:]
                        for fieldInd, fieldName in enumerate(fields):
                            fieldValue = restFields[fieldInd]
                            self.fields[fieldName].insertValue(c, fieldValue)
                    if self.hasZ:
                        self.zCoords[c] = row[-1]

                    #### Check uniqueness of masterID field ####
                    if masterID in self.master2Order:
                        del rows
                        ARCPY.AddIDMessage("ERROR", 644, masterField)
                        ARCPY.AddIDMessage("ERROR", 643)
                        raise SystemExit()
                    else:
                        self.master2Order[masterID] = c
                        self.order2Master[c] = masterID
                        c += 1

                ARCPY.SetProgressorPosition()

            del rows
        else:
            indexIgn = []

            for id, e in enumerate(fieldList):
                if e.upper() in useNullinFields:
                    indexIgn.append(id)

            c = 0
            for row in rows:
                oid = row[0]

                foundValidNull = False
                badValues = False
                centroid = row[1]
                badValuesNum = 0
                validBadValuesNum = 0
                if isLine:
                    if centroid[0] is not None:
                        badValues = NUM.isnan(centroid[0]) or NUM.isnan(centroid[1])
                        if not badValues and self.hasZ:
                            badValues = row[-1] is None
                    else:
                        badValues = True
                else:
                    badValues = centroid.count(None)

                if not badValues:
                    badValues = row.count(None)
                    badValuesNum = badValues

                for check in indexIgn:
                    if row[check] is None:
                        foundValidNull = True
                        validBadValuesNum += 1

                temRes = row[0:self.dataColumnIndex]
                for val in temRes:
                    if val is None:
                        foundValidNull = False

                if centroid[0] is None:
                    badValues = True
                    foundValidNull = False

                #### Check Bad Record ####
                if (badValues and not foundValidNull) or (badValuesNum > validBadValuesNum):
                    badRow = 1
                    badRecord = 1
                    self.badRecords.append(oid)
                else:
                    #### Get Centroid and Master ID ####
                    self.xyCoords[c] = row[1]
                    masterID = row[self.masterColumnIndex]

                    #### Add Field Values ####
                    if numFields:
                        restFields = row[self.dataColumnIndex:]
                        for fieldInd, fieldName in enumerate(fields):
                            fieldValue = restFields[fieldInd]

                            if fieldValue not in [None, 'nan', NUM.inf]:
                                self.fields[fieldName].insertValue(c, fieldValue)
                            else:
                                typeField = self.fields[fieldName].data.dtype
                                if typeField in [float, NUM.float32]:
                                    self.fields[fieldName].insertValue(c, NUM.nan)
                                elif typeField.kind in ['U', 'S']:
                                    self.fields[fieldName].insertValue(c, 'nan')
                                elif typeField.kind == "M":
                                    self.fields[fieldName].insertValue(c, 'nat')
                                else:
                                    self.fields[fieldName].insertValue(c, NUM.iinfo(typeField).min)

                    if self.hasZ:
                        self.zCoords[c] = row[-1]

                    #### Check uniqueness of masterID field ####
                    if masterID in self.master2Order:
                        del rows
                        ARCPY.AddIDMessage("ERROR", 644, masterField)
                        ARCPY.AddIDMessage("ERROR", 643)
                        raise SystemExit()
                    else:
                        self.master2Order[masterID] = c
                        self.order2Master[c] = masterID
                        c += 1

                ARCPY.SetProgressorPosition()

            del rows
        #### Finalize Read ####
        self.finalizeRead(minNumObs = minNumObs, warnNumObs = warnNumObs,
                          explicitBadRecordID = explicitBadRecordID)


    def __obtainDataShapes(self, masterField = None, fields = [],
                           types = [0,1,2,3,4,5,6,8,9,10],
                           minNumObs = 0, warnNumObs = 0,
                           explicitBadRecordID = None,
                           useNullinFields = []):
        """Takes a list of field names and returns it in a dictionary
        structure using complex feature classes.

        INPUTS:
        masterField (str): name of field being used as the master
        fields {list, []}: name(s) of the field to be returned
        types (list): types of data allowed to be returned (1)
        minNumObs {int, 0}: minimum number of observations for error
        warnNumObs {int, 0}: minimum number of observations for warning
        useNullinFields {list, None}: use record with nulls in fields

        ATTRIBUTES:
        gaTable (structure): instance of the GA Table
        fields (dict): fieldName = instance of FCField
        master2Order (dict): masterID = order in lists
        order2Master (dict): order in lists = masterID
        masterField (str): field serves as the master
        badRecords (list): master IDs that could not be read
        xyCoords (array, nunObs x 2): xy-coordinates for feature centroids
        """

        #### Get Base Count, May Include Bad Records ####
        cnt = UTILS.getCount(self.inputFC)

        #### Initialize Read/FieldList ####
        fieldList = self.initializeRead(masterField, requireGeometry = True)

        #### Validation and Initialization of Data Fields ####
        fieldList, dateInds = self.testFields(fieldList, fields = fields,
                                              types = types)
        self.initializeFields(cnt)

        #### Initialization of Centroids  ####
        self.xyCoords = NUM.empty((cnt, 2), float)

        #### Z Coords ####
        if self.hasZ:
            self.zCoords = NUM.empty((cnt, ), float)
        else:
            self.zCoords = None

        #### Shape Array ####
        self.shapes = NUM.empty((cnt, ), object)

        #### Keep track of Invalid Fields ####
        self.badRecords = []
        badRecord = False
        numFields = len(fieldList)

        #### Create Progressor Bar ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84001), 0, cnt, 1)
        fieldList = UTILS.getOriginalFieldName(fieldList, self.info.fields)

        #### Process Field Values ####
        try:
            rows = DA.SearchCursor(self.inputFC, fieldList, "",
                                   self.spatialRefString)
        except:
            ARCPY.AddIDMessage("ERROR", 204)
            raise SystemExit()

        if len(useNullinFields) == 0 :
            c = 0
            for row in rows:
                oid = row[0]
                badValues = row.count(None)
                if not badValues:
                    #### Assess Shape Info ####
                    shape = row[1]
                    centroid = shape.trueCentroid
                    if centroid is not None:
                        if (centroid.X == NUM.nan or
                            centroid.Y == NUM.nan):
                            badValues = True
                        if self.hasZ:
                            if centroid.Z == NUM.nan:
                                badValues = True
                    else:
                        badValues = True

                #### Check Bad Record ####
                if badValues:
                    badRecord = True
                    self.badRecords.append(oid)
                else:
                    if numFields:
                        restFields = row[self.dataColumnIndex:]

                    #### Get Centroid  ####
                    self.xyCoords[c] = (centroid.X, centroid.Y)
                    if self.hasZ:
                        self.zCoords[c] = shape.centroid.Z

                    #### Store Shape ####
                    self.shapes[c] = shape

                    #### Get Master ID ####
                    masterID = row[self.masterColumnIndex]

                    #### Add Field Values ####
                    if numFields:
                        for fieldInd, fieldName in enumerate(fields):
                            fieldValue = restFields[fieldInd]
                            self.fields[fieldName].insertValue(c, fieldValue)

                    #### Check uniqueness of masterID field ####
                    if masterID in self.master2Order:
                        del rows
                        ARCPY.AddIDMessage("ERROR", 644, masterField)
                        ARCPY.AddIDMessage("ERROR", 643)
                        raise SystemExit()
                    else:
                        self.master2Order[masterID] = c
                        self.order2Master[c] = masterID
                        c += 1

                ARCPY.SetProgressorPosition()

            del rows
        else:
            indexIgn = []

            for id, e in enumerate(fieldList):
                if e.upper() in useNullinFields:
                    indexIgn.append(id)

            c = 0
            for row in rows:
                oid = row[0]
                badValues = False
                foundValidNull = False
                shape = row[1]

                if shape is not None:
                    centroid = shape.trueCentroid
                    if centroid is not None:
                        if (centroid.X == NUM.nan or
                            centroid.Y == NUM.nan):
                            badValues = True
                        if self.hasZ:
                            if centroid.Z == NUM.nan:
                                badValues = True
                    else:
                        badValues = True
                else:
                    badValues = True

                if not badValues:
                    badValues = row.count(None)

                for check in indexIgn:
                    if row[check] is None:
                        foundValidNull = True

                temRes = row[0:self.dataColumnIndex+1]
                for val in temRes:
                    if val is  None:
                        foundValidNull = False

                #### Check Bad Record ####
                if badValues and not foundValidNull:
                    badRecord = True
                    self.badRecords.append(oid)
                else:
                    if numFields:
                        restFields = row[self.dataColumnIndex:]

                    #### Get Centroid  ####
                    self.xyCoords[c] = (centroid.X, centroid.Y)
                    if self.hasZ:
                        self.zCoords[c] = shape.centroid.Z

                    #### Store Shape ####
                    self.shapes[c] = shape

                    #### Get Master ID ####
                    masterID = row[self.masterColumnIndex]

                    #### Add Field Values ####
                    if numFields:
                        for fieldInd, fieldName in enumerate(fields):
                            fieldValue = restFields[fieldInd]

                            if fieldValue not in [None, 'nan', NUM.inf]:
                                self.fields[fieldName].insertValue(c, fieldValue)
                            else:
                                typeField = self.fields[fieldName].data.dtype
                                if typeField in [float, NUM.float32]:
                                    self.fields[fieldName].insertValue(c, NUM.nan)
                                elif typeField.kind in ['U', 'S']:
                                    self.fields[fieldName].insertValue(c, 'nan')
                                elif typeField.kind == "M":
                                    self.fields[fieldName].insertValue(c, 'nat')
                                else:
                                    self.fields[fieldName].insertValue(c, NUM.iinfo(typeField).min)

                    #### Check uniqueness of masterID field ####
                    if masterID in self.master2Order:
                        del rows
                        ARCPY.AddIDMessage("ERROR", 644, masterField)
                        ARCPY.AddIDMessage("ERROR", 643)
                        raise SystemExit()
                    else:
                        self.master2Order[masterID] = c
                        self.order2Master[c] = masterID
                        c += 1

                ARCPY.SetProgressorPosition()

            del rows

        #### Finalize Read ####
        self.finalizeRead(minNumObs = minNumObs, warnNumObs = warnNumObs,
                          explicitBadRecordID = explicitBadRecordID)


    def __obtainDataTable(self,masterField , fields = [],
                              types = [0,1,2,3,4,5,6,8,9,10],
                              minNumObs = 0, warnNumObs = 0,
                              explicitBadRecordID = None, 
                              getAllNullValues = False):
        """Takes a list of field names and returns it in a dictionary
        structure.

        INPUTS:
        fields {list, []}: name(s) of the field to be returned
        types (list): types of data allowed to be returned (1)
        minNumObs {int, 0}: minimum number of observations for error
        warnNumObs {int, 0}: minimum number of observations for warning
        getAllNullValues {bool,False}: accept null
        """
        table2RecArray(self.inputFC, fieldNames = fields,
                       types = types,
                       minNumObs = minNumObs,
                       warnNumObs = warnNumObs,
                       silentWarnings = self.silentWarnings,
                       returnOID = True,
                       explicitBadRecordID = explicitBadRecordID,
                       includeNulls = getAllNullValues,
                       ssdo = self,
                       masterField = masterField)

    def obtainDataGA(self, masterField = None, fields = [], types = [0,1,2,3,5,6,8,9],
                     minNumObs = 0, warnNumObs = 0):
        """Takes a list of field names and returns it in a dictionary
        structure.

        INPUTS:
        masterField (str): name of field being used as the master
        fields {list, []}: name(s) of the field to be returned
        types (list): types of data allowed to be returned (1)
        minNumObs {int, 0}: minimum number of observations for error
        warnNumObs {int, 0}: minimum number of observations for warning

        ATTRIBUTES:
        gaTable (structure): instance of the GA Table
        fields (dict): fieldName = instance of FCField
        master2Order (dict): masterID = order in lists
        order2Master (dict): order in lists = masterID
        masterField (str): field that serves as the master
        badRecords (list): master IDs that could not be read
        xyCoords (array, nunObs x 2): xy-coordinates for feature centroids

        NOTES:
        (1) No Text Fields; short [0], long [1], float [2], double[3]
        """

        #### Initialize Read/FieldList ####
        fieldList = self.initializeRead(masterField, requireSearch = True)

        #### Validation and Initialization of Data Fields ####
        fieldList, dateInds = self.testFields(fieldList, fields = fields,
                                              types = types)
        numFields = len(fields)

        #### ZCoords Are Last ####
        getZBool = self.hasZ and (not self.renderType) and \
                  (not self.complexFeature)
        if getZBool:
            fieldList.append("SHAPE&Z")

        #### Create GA Data Structure ####
        cnt = UTILS.getCount(self.inputFC)
        fieldList = tuple(fieldList)
        fieldList = tuple(UTILS.getOriginalFieldName(fieldList, self.info.fields))

        gaTable, gaInfo = WU.gaTable(self.inputFC, fieldNames = fieldList,
                                     spatRef = self.spatialRefString)

        #### Process any bad records encountered ####
        numObs = gaInfo[0]
        numBadIDs = cnt - numObs
        if numBadIDs:
            self.badRecords = WU.parseGAWarnings(gaTable.warnings)
            if not self.silentWarnings:
                ERROR.reportBadRecords(cnt, numBadIDs, self.badRecords,
                                       label = self.oidName)
        else:
            self.badRecords = []

        #### Check Whether the Number of Features is Appropriate ####
        ERROR.checkNumberOfObs(min(numObs, cnt), minNumObs = minNumObs,
                               warnNumObs = warnNumObs,
                               silentWarnings = self.silentWarnings)

        #### Initialize Fields ####
        self.initializeFields(numObs)

        #### Initialization of Centroids  ####
        self.xyCoords = NUM.empty((numObs, 2), float)

        #### Z Coords ####
        if self.hasZ:
            self.zCoords = NUM.empty((numObs, ), float)
        else:
            self.zCoords = None

        #### Populate SSDataObject ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84001), 0, numObs, 1)
        for row in UTILS.ssRange(numObs):
            rowInfo = gaTable[row]
            x,y = rowInfo[1]
            masterID = int(rowInfo[self.masterColumnIndex])
            if masterID in self.master2Order:
                ARCPY.AddIDMessage("ERROR", 644, masterField)
                ARCPY.AddIDMessage("ERROR", 643)
                raise SystemExit()
            else:
                self.master2Order[masterID] = row
                self.order2Master[row] = masterID
                self.xyCoords[row] = (x, y)
            if numFields:
                restFields = rowInfo[self.dataColumnIndex:]
                for fieldInd, fieldName in enumerate(fields):
                    fieldValue = restFields[fieldInd]
                    if fieldInd in dateInds:
                        fieldValue = TUTILS.gaDiff2DateTime(fieldValue)
                    self.fields[fieldName].insertValue(row, fieldValue)

            if self.hasZ:
                if getZBool:
                    self.zCoords[row] = rowInfo[-1]
                else:
                    self.zCoords[row] = NUM.nan

            ARCPY.SetProgressorPosition()

        #### Set Attributes ####
        self.finalizeRead(gaTable = gaTable)

    def addFields2FC(self, candidateFields, fieldOrder = [], add_fields = 1):

        #### Create/Verify Result Field Order ####
        fieldKeys = sorted(UTILS.iterkeys(candidateFields))
        if len(fieldOrder) == len(fieldKeys):
            fKeySet = set(fieldKeys)
            fieldOrderSet = set(fieldOrder)
            if fieldOrderSet == fKeySet:
                fieldKeys = fieldOrder

            del fKeySet, fieldOrderSet

        #### Add Empty Output Analysis Fields ####
        hasJoin = "." in self.masterField
        if hasJoin:
            masterOutName = self.masterField.split(".")[1]
        else:
            masterOutName = self.masterField

        outputFieldNames = [masterOutName]
        candidateFieldList = []
        for fieldInd, fieldName in enumerate(fieldKeys):
            field = candidateFields[fieldName]

            #### Replace NaNs for Shapefiles ####
            if self.shapeFileBool:
                if field.type != "TEXT":
                    isNaN = NUM.isnan(field.data)
                    if NUM.any(isNaN):
                        field.data[isNaN] = UTILS.shpFileNull[field.type]

            if field.type in ["TEXT","STRING"]:
                typeS = field.data.dtype
                length = int(str(typeS)[2:])
                field.length = length
                if str(typeS)[1] == 'U' and self.shapeFileBool:
                    field.length = min(field.length * 4, 254)

            #### Add to Candidate Field List ####
            candidateFieldList.append(field)

        #### Do Update Cursor in C++ ####
        ARC._ss.update_table_from_dataobject(self, self.inputFC, masterOutName, candidateFieldList,
                                             add_fields = add_fields, delete_records = 0)

    def output2NewFC(self, outputFC, candidateFields, appendFields = [],
                     fieldOrder = [], clearExtent = True):
        """Creates a new feature class with the same shape charcteristics as
        the source input feature class and appends data to it.

        INPUTS:
        outputFC (str): catalogue path to output feature class
        candidateFields (dict): fieldName = instance of CandidateField
        appendFields {list, []}: field names in the order you want appended
        fieldOrder {list, []}: the order with which to write fields
        clearExtent {bool, True}: whether to clear the extent on ExportFeatures/Table
        """

        #### Initial Progressor Bar ####
        ARCPY.overwriteOutput = True
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84006))

        #### Validate Output Workspace ####
        ERROR.checkOutputPath(outputFC)

        #### Create Path for Output FC ####
        outPath, outName = OS.path.split(outputFC)

        #### Get Output Name for SDE if Necessary ####
        baseType = UTILS.getBaseWorkspaceType(outPath)
        lowerPath = outPath.lower()
        stripMainNonMobile = lowerPath.endswith(".sqlite") or lowerPath.endswith(".gpkg")
        if baseType.upper() == 'REMOTEDATABASE':
            outName = outName.split(".")[-1]
            outIsShapeFile = False
        elif baseType.upper() == "MOBILE":
            outName = outName.split("main.")[-1]
            outIsShapeFile = False
        else:
            if stripMainNonMobile:
                outName = outName.split("main.")[-1]
                outIsShapeFile = False
            else:
                if self.isTable:
                    outIsShapeFile = UTILS.isShapeFile(outputFC, "DBF")
                else:
                    outIsShapeFile = UTILS.isShapeFile(outputFC)

        self.outputFC = OS.path.join(outPath, outName)

        #### Check Output Fields if TemplateFC Not Given (Not Ideal After Data Read, Fail Safe) ####
        if self.templateFC is None:
            self.newFieldTypeChecker.addOutput(self.outputFC)
            self.newFieldTypeChecker.checkMasterField(self.masterField, silent = False)
            self.outMasterIsBigInteger = self.newFieldTypeChecker.masterIs64
            self.newFieldTypeChecker.checkFields(fields = self.inputFieldList, silent = False)

        #### Assess Whether to Honor Original Field Nullable Flag ####
        setNullable = UTILS.setToNullableUpdated(self.catPath, self.outputFC)

        #### Create Output Field Names to be Appended From Input ####
        inputFieldNames = ["SHAPE@", self.masterField]

        if self.isTable:
            inputFieldNames.pop(0)

        appendFieldNames = []
        masterIsOID = self.masterField == self.oidName
        if masterIsOID:
            appendFieldNames.append("SOURCE_ID")
        else:
            master = self.allFields[self.masterField.upper()]
            returnName = UTILS.returnOutputFieldName(master)
            appendFieldNames.append(returnName)

        #### Assess Append Fields ####
        usedFields = set([])
        for fieldName in appendFields:
            upperName = fieldName.upper()
            if upperName not in usedFields:
                field = self.allFields[upperName]
                returnName = UTILS.returnOutputFieldName(field)
                inputFieldNames.append(fieldName)
                appendFieldNames.append(returnName)
                usedFields.add(upperName)
        appendFieldNames = UTILS.createAppendFieldNames(appendFieldNames,
                                                        outPath,
                                                        candidateFields)
        masterOutName = appendFieldNames[0]

        #### Create Field Mappings for Visible Fields ####
        outputFieldMaps = ARCPY.FieldMappings()
        self.in2OutFieldMap = {}

        #### Add Input Fields to Output ####
        for ind, fieldName in enumerate(appendFieldNames):
            if ind == 0:
                #### Master Field ####
                sourceFieldName = self.masterField
                if masterIsOID:
                    if self.outMasterIsBigInteger:
                        fieldType = "BIGINTEGER"
                    else:
                        fieldType = "LONG"
                    alias = fieldName
                    setOutNullable = False
                    fieldLength = None
                    fieldPrecision = None
                else:
                    masterOutField = self.allFields[self.masterField.upper()]
                    fieldType = masterOutField.type
                    alias = masterOutField.alias
                    setOutNullable = setNullable
                    fieldLength = masterOutField.length
                    fieldPrecision = masterOutField.precision
            else:
                #### Append Fields ####
                sourceFieldName = appendFields[ind-1]
                outField = self.allFields[sourceFieldName]
                fieldType = outField.type
                alias = outField.alias
                setOutNullable = setNullable
                fieldLength = outField.length
                if fieldType.upper() in UTILS.datePrecisionTypes and self.ignoreDateHighPrecision:
                    fieldPrecision = 0
                else:
                    fieldPrecision = outField.precision

            #### Create Candidate Field ####
            outCandidate = CandidateField(fieldName, fieldType, None,
                                          alias = alias,
                                          precision = fieldPrecision,
                                          length = fieldLength)

            #### Create Output Field Map ####
            outFieldMap = UTILS.createOutputFieldMap(self.inputFC,
                                                  sourceFieldName,
                                 outFieldCandidate = outCandidate,
                                     setNullable = setOutNullable)

            #### Add Output Field Map to New Field Mapping ####
            outputFieldMaps.addFieldMap(outFieldMap)
            self.in2OutFieldMap[sourceFieldName] = outFieldMap.outputField.name

        if not self.isTable:
            mainA = ARCPY.env.maintainAttachments

            if clearExtent:
                FC2FC = UTILS.clearExtent(CONV.ExportFeatures)
            else:
                FC2FC = CONV.ExportFeatures

            ARCPY.env.maintainAttachments = False
            try:
                FC2FC(self.inputFC, outputFC, "", "", outputFieldMaps)
                ARCPY.env.maintainAttachments = mainA
            except:
                ARCPY.env.maintainAttachments = mainA
                ARCPY.AddIDMessage("ERROR", 210, self.outputFC)
                raise SystemExit()
        else:
            #### Do T2T  ####
            T2T = CONV.ExportTable
            try:
                T2T(self.inputFC, outputFC, "", "", outputFieldMaps)
            except:
                ARCPY.AddIDMessage("ERROR", 210, self.outputFC)
                raise SystemExit()

        #### Create/Verify Result Field Order ####
        fieldKeys = sorted(UTILS.iterkeys(candidateFields))
        if len(fieldOrder) == len(fieldKeys):
            fKeySet = set(fieldKeys)
            fieldOrderSet = set(fieldOrder)
            if fieldOrderSet == fKeySet:
                fieldKeys = fieldOrder

            del fKeySet, fieldOrderSet

        #### Add Empty Output Analysis Fields ####
        candidateFieldList = []
        for fieldInd, fieldName in enumerate(fieldKeys):
            field = candidateFields[fieldName]

            #### Replace NaNs for Shapefiles ####
            if outIsShapeFile:
                if field.type != "TEXT":
                    isNaN = NUM.isnan(field.data)
                    if NUM.any(isNaN):
                        field.data[isNaN] = UTILS.shpFileNull[field.type]

            if field.type in ["TEXT","STRING"]:
                typeS = field.data.dtype
                length = int(str(typeS)[2:])
                field.length = length
                if str(typeS)[1] == 'U' and outIsShapeFile:
                    field.length = min(field.length * 4, 254)
            #### Add to Candidate Field List ####
            candidateFieldList.append(field)

        #### Do Update Cursor in C++ ####
        ARC._ss.update_table_from_dataobject(self, outputFC, masterOutName, candidateFieldList)

    def getNeighborObject(self, threshold = None, numNeighs = None):
        iniTree = self.tree is None
        neighbor = None
        if hasattr(self,'xyCoords'):
            neighbor = WU.SciPyNeighborSearch(self, threshold = threshold,
                                              numNeighs = numNeighs, enableWarning = False,
                                              iniKdTree = iniTree)
            if not iniTree:
                neighbor.kdTree = self.tree
        return neighbor

    def getSourceIDs(self):
        ### Get Base Source IDs ####
        if self.hasOID64:
            sourceIDs = NUM.zeros(self.numObs, dtype = NUM.int64)
        else:
            sourceIDs = NUM.zeros(self.numObs, dtype = NUM.int32)
        for i in range(self.numObs):
            sourceIDs[i] = self.order2Master[i]

        return sourceIDs

    def getFeatureCoords(self):
        """Set Coords: self.coords should be in analysis and self.rawCoords for output writing."""

        if self.hasZ:
            rawCoords = NUM.empty((len(self.xyCoords), 3), dtype=float)
            rawCoords[:, 0:2] = self.xyCoords
            rawCoords[:, -1] = self.zCoords
        else:
            rawCoords = self.xyCoords

        if self.useChordal:
            coords = self.spheroidCoords
        else:
            coords = rawCoords

        return coords, rawCoords

    def getPolygonNeighbors(self, contiguityType = "ROOK"):
        if self.shapeType.upper() != "POLYGON":
            ARCPY.AddIDMessage("ERROR", 914)
            raise SystemExit()

        #### Use Polygon Neighbor Tool ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84126))
        contTable = "in_memory\\contTabWU"
        ANA.PolygonNeighbors(self.inputFC, contTable, self.masterField, 
                             "AREA_OVERLAP", "NO_BOTH_SIDES")

        #### Create Result Structure ####
        contDict = COLL.defaultdict(list)
        rookType = contiguityType == 'ROOK'

        #### Create Cursor and Read Results ####
        rows = DA.SearchCursor(contTable, "*")
        for row in rows:
            include = True
            rowID, masterID, neighID, area, length, count = row
            noOverlap = UTILS.compareFloat(0.0, area)
            if rookType and noOverlap:
                if UTILS.compareFloat(0.0, length):
                    include = False
            if include:
                contDict[masterID].append(neighID)
                contDict[neighID].append(masterID)

        #### Clean Up ####
        del rows
        UTILS.passiveDelete(contTable)

        #### Adjust For Bad Records ####
        polyNeighDict = COLL.defaultdict(list)
        if len(self.badRecords):
            #### Remove Null Values ####
            for orderID in NUM.arange(len(self.xyCoords)):
                masterID = self.order2Master[orderID]
                neighs = [i for i in contDict[masterID] if i in self.master2Order]
                if len(neighs):
                    polyNeighDict[masterID] = neighs
        else:
            polyNeighDict = contDict

        return polyNeighDict
