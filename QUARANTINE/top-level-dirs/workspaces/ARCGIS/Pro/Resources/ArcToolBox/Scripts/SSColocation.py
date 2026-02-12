# coding: utf-8
"""
Source Name:   SSColocation.py
Version:       ArcGIS Pro 2.5
Author:        Environmental Systems Research Institute Inc.
Description:   Colocation Quotient python file
"""

################### Imports ########################
import sys as SYS
import os as OS
import locale as LOCALE
import numpy as NUM
import numpy.random as RAND
import arcpy as ARCPY
import arcgisscripting as ARC
import SSDataObject as SSDO
import Stats as STATS
import scipy.spatial as SCPS
import pandas as PANDAS
import SSUtilities as UTILS
import random as RANDOM
import arcpy.management as DM
import arcpy.da as DA
import datetime as DT
import WeightsUtilities as WU
import SSTimeUtilities as TUTILS
import ErrorUtils as ERROR
import dateutil as DUT
LOCALE.setlocale(LOCALE.LC_ALL, '')

#### Globals ######
minNumberFeatures = 10
defaultKnn = 8
maxFeaturesForMedianSplit = 100000
maxNumCharInGDB = 1000
maxNumCharInSHP = 255

def castValueField(fieldType, value, isShp = True):
    fieldType = fieldType.upper()
    if fieldType in ['INTEGER', 'SMALLINTEGER', 'BIGINTEGER']:
       return int(value)
    if fieldType == 'DOUBLE':
        return UTILS.strToFloat(value)
    if fieldType == 'DATE' and not isShp:
        return  DT.datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
    if fieldType == 'DATE' and  isShp:
        return  DT.datetime.strptime(value, "%Y-%m-%d")
    else:
        return value

currentFuncName = lambda n=0: SYS._getframe(n + 1).f_code.co_name

def DBG(lo, applyDBG = False):
    if applyDBG:
        ARCPY.AddMessage(",".join([str(e) for e in lo]))

def execute(parameters, messages):
    kNeighbors = None
    threshold = None
    swmFile = None

    inputFC = UTILS.getTextParameter(1, parameters)
    outputFC = UTILS.getTextParameter(2, parameters)
    field1 = UTILS.getTextParameter(3, parameters, fieldName = True)
    timeField1 = UTILS.getTextParameter(4, parameters, fieldName = True)
    cat1 =   UTILS.getTextParameter(5, parameters, fieldName = True)
    inputFC2 = UTILS.getTextParameter(6, parameters)
    field2 = UTILS.getTextParameter(7, parameters, fieldName = True)
    timeField2 = UTILS.getTextParameter(8, parameters, fieldName = True)
    cat2 =   UTILS.getTextParameter(9, parameters, fieldName = True)
    method = UTILS.getTextParameter(10,parameters)

    if method == "K_NEAREST_NEIGHBORS":
        kNeighbors = UTILS.getNumericParameter(11, parameters)
        threshold = None

        if kNeighbors is None:
            kNeighbors = -1

    if method == "DISTANCE_BAND":
        threshold = UTILS.getTextParameter(12, parameters)
        kNeighbors = None

        if threshold is None:
            threshold = -1

    if method == "KNN_THRESHOLD":
        kNeighbors = UTILS.getNumericParameter(11, parameters)
        threshold = UTILS.getTextParameter(12, parameters)

    if method == "GET_SPATIAL_WEIGHTS_FROM_FILE":
        swmFile = UTILS.getTextParameter(13, parameters)
        kNeighbors = None
        threshold = None

    typeMethod = UTILS.getTextParameter(14,parameters)
    timeInterval = UTILS.getTextParameter(15,parameters)

    permutations = UTILS.getNumericParameter(16, parameters)
    if permutations is None:
        permutations = 99

    kernelType = UTILS.getTextParameter(17, parameters)
    outputTable = UTILS.getTextParameter(18, parameters)

    if kernelType == "GAUSSIAN":
        kernelType = 0

    if kernelType == "BISQUARE":
        kernelType = 1

    if kernelType == "NONE":
        kernelType = 2

    if kernelType is None:
        kernelType = 0

    seed = 10
    #### Outputs ####
    UTILS.checkOutputPath(outputFC, "FC")
    UTILS.checkOutputPath(outputTable, "TABLE")

    if field1 is not None:
       checker = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC, fields = [field1], weightsFile = swmFile)
    else:
       checker = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC, weightsFile = swmFile)

    ssdo1 = SSDO.SSDataObject(inputFC, useChordal = True, ignoreDateHighPrecision = True)
    ssdo2 = None

    warn = False
    if timeField1 is not None:
        warn = ssdo1.warnNotUsingHighPrecisionDates([timeField1])

    if inputFC2 is not None:
        if field2 is not None:
            checker = UTILS.ExecuteNewFieldTypeChecker(inputFC2, outputFC, fields = [field2], weightsFile = swmFile)
        else:
            checker = UTILS.ExecuteNewFieldTypeChecker(inputFC2, outputFC, weightsFile = swmFile)

        ssdo2 = SSDO.SSDataObject(inputFC2, explicitSpatialRef = ssdo1.spatialRef,
                                    useChordal = True, silentWarnings= True, ignoreDateHighPrecision=True)

        if not warn and timeField2 is not None:
            warn = ssdo2.warnNotUsingHighPrecisionDates([timeField2])

    coloq = ColocationQuotient(ssdo1, field1, ssdo2, field2, seed, 
                               cat1, cat2, outputFC, swmFile,
                               timeField1, timeField2,
                               typeMethod, timeInterval)

    #### Calculate Local Colocation ####
    data, index1, idCats, member = coloq.getLocalValues(permutations, threshold, kNeighbors, kernelType)
    coloq.createOutputLocalOutput(data, index1, idCats, member)

    #### Calculate Global Colocation ####
    coloq.getGlobalValues(permutations, outputTable, parameters = parameters)


class ColocationQuotient(object):
    """Calculate Global and Local Colocation Quotient

    INPUT:
        inputFC1 (ssdo): input feature class
        inputFC2 (ssdo): input feature class 
        fField {str}: category field inputFC1
        sField {str}: category field inputFC2
        seed (int): Seed
        cat1 {str}: Category
        cat2 {str}: Category
        output (str): Output Feature Class
        swmFile {str}: SWM File

    """
    def __init__(self, ssdo1, fField, ssdo2 = None,
                 sField = None , seed = 100,
                 cat1 = None, cat2 = None,
                 outputFC = None, weightsFile = None,
                 fFieldTime = None,sFieldTime = None,
                 timeMethod = None, timeInterval = None):

        self.hasZ2 = False
        self.ssdo1 = ssdo1
        self.ssdo2 = ssdo2
        self.inputFC1 = ssdo1.inputFC
        self.inputFC2 = None
        self.hasZ1 = self.ssdo1.hasZ
        self.timeMethod = timeMethod
        self.timeInterval = timeInterval
        self.thresholdUsed = None
        self.kUsed = None

        if None in [self.timeInterval, self.timeMethod, fFieldTime]:
            self.timeMethod = None
            self.timeInterval = None
            fFieldTime = None
            sFieldTime = None

        self.breakTimeSize = 0

        if ssdo2 is not None:
            self.inputFC2 = ssdo2.inputFC
            self.hasZ2 = self.ssdo2.hasZ 

        self.fField = fField
        self.sField = sField
        self.fFieldTime = fFieldTime
        self.sFieldTime = sFieldTime


        self.swmFileBool = False
        self.masterIs64 = self.ssdo1.hasOID64
        self.hasOID64 = self.ssdo1.hasOID64
        if weightsFile is not None:
            if not OS.path.exists(weightsFile):
                ARCPY.AddIDMessage("ERROR", 414 , weightsFile)
                raise SystemExit()
            self.swmFileBool = True

        self.weightsFile = weightsFile


        self.modes = ["OneSource2Cats",
                      "TwoSources2Cats",
                      "Incidents",
                      "TwoSourceInc-Cat",
                      "TwoSourceCat-Inc"]
        self.mode = -1
        self.modeName = "None"
        self.crossDataset = False

        if self.inputFC1 is not None and self.inputFC2 is None:
            if self.fField is not None and cat1 is not None and cat2 is not None:
                self.modeName = "OneSource2Cats"

        elif self.inputFC1 is not None and self.inputFC2 is not None:
            
            self.crossDataset = True
            if self.fField is None and self.sField is None:
                self.modeName = "Incidents"

            if self.fField is not None and self.sField is not None and \
                cat1 is not None and cat2 is not None:
                self.modeName = "TwoSources2Cats"

            if self.fField is None and self.sField is not None and \
                cat1 is None and cat2 is not None:
                self.modeName = "TwoSourceInc-Cat"

            if self.fField is not None and self.sField is None and \
                cat1 is not None and cat2 is None:
                self.modeName = "TwoSourceCat-Inc"

        DBG(["Value", self.modeName])


        DBG([self.inputFC1, fField, self.inputFC2, sField ,seed,cat1, cat2, self.modeName])

        self.mode = self.modes.index(self.modeName)

        self.cat1 = cat1
        self.cat2 = cat2
        self.unique = None
        self.unique2 = None
        self.df1 = None
        self.df2 = None
        self.seed = seed
        self.idCategories = None
        self.indexDF = 0
        self.currentDF = None
        self.typeField = None
        self.onWarnings = False
        self.outputFC = outputFC
        self.allGroups = True
        self.diffCat = False

        #### outputFC ####
        if self.outputFC is not None:
            if "warning" in self.outputFC:
                self.onWarnings = True

        if self.outputFC is not None:
            if "all" in self.outputFC:
                self.allGroups = True

        #### Organize The Different Type of Input Combinations ####
        self.__obtainDataSources()

        #### Process SWM File ####
        self.__getNeighborsSWM()

        #### Set CQ Object ####
        self.__configureCQObject()

    def __warning(self,  value = ""):
        if self.onWarnings:
            ARCPY.AddMessage(currentFuncName(1) +" "+ value)

    def __getName(self, ssdo):
        """ Return Name SSDO """
        if hasattr(ssdo.info, "nameString") and ssdo.info.nameString != "":
            return ssdo.info.nameString
        else:
            name = ssdo.info.name
            if ".SHP" in name.upper():
                name = name.upper().replace(".SHP","")
            return name

    def __obtainDataDecision(self):
        self.addTimeColumn = False
        if self.modeName == "OneSource2Cats":
            dec = [self.fFieldTime, self.timeMethod, self.timeInterval]
            if None in dec:
                self.ssdo1.obtainData(fields = [self.fField])
            else:
                self.addTimeColumn = True
                self.ssdo1.obtainData(fields = [self.fField, self.fFieldTime])

        elif self.modeName == "Incidents":
            dec = [self.fFieldTime, self.sFieldTime, self.timeMethod, self.timeInterval]
            if None in dec:
                self.ssdo1.obtainData()
                self.ssdo2.obtainData()
            else:
                self.addTimeColumn = True
                self.ssdo1.obtainData(fields = [self.fFieldTime])
                self.ssdo2.obtainData(fields = [self.sFieldTime])

        elif  self.modeName == "TwoSources2Cats":
            dec = [self.fFieldTime, self.sFieldTime, self.timeMethod, self.timeInterval]
            if None in dec:
                self.ssdo1.obtainData(fields = [self.fField])
                self.ssdo2.obtainData(fields = [self.sField])
            else:
                self.addTimeColumn = True
                self.ssdo1.obtainData(fields = [self.fField, self.fFieldTime])
                self.ssdo2.obtainData(fields = [self.sField, self.sFieldTime])

        elif self.modeName == "TwoSourceInc-Cat":
            dec = [self.fFieldTime, self.sFieldTime, self.timeMethod, self.timeInterval]
            if None in dec:
                self.ssdo1.obtainData()
                self.ssdo2.obtainData(fields = [self.sField])
            else:
                self.addTimeColumn = True
                self.ssdo1.obtainData(fields = [self.fFieldTime])
                self.ssdo2.obtainData(fields = [self.sField, self.sFieldTime])

        elif self.modeName == "TwoSourceCat-Inc":
            dec = [self.fFieldTime, self.sFieldTime, self.timeMethod, self.timeInterval]
            if None in dec:
                self.ssdo1.obtainData(fields = [self.fField])
                self.ssdo2.obtainData()
            else:
                self.addTimeColumn = True
                self.ssdo1.obtainData(fields = [self.fField, self.fFieldTime])
                self.ssdo2.obtainData(fields = [self.sFieldTime])

        if self.addTimeColumn:
            #### Set/Validate Time Size ####
            self.timeSize, self.timeUnit = self.timeInterval.split(" ")
            try:
                self.timeSize = int(self.timeSize)
            except:
                ARCPY.AddIDMessage("ERROR", 110007)
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
                self.breakTimeSize = TUTILS.createTimeDelta(int(self.timeSize), self.timeUnit).astype(float)
                self.breakTimeUnit = "SECONDS"
            else:
                self.breakTimeSize = self.timeSize
                self.breakTimeUnit = self.timeUnit

    def __obtainDataSources(self):
        """ Configure The input according with mode"""
        typeC1  = None

        ### Populate SSDO objects ####
        self.__obtainDataDecision()

        if self.modeName == "OneSource2Cats":
            self.unique = NUM.unique(self.ssdo1.fields[self.fField].data)
            self.unique.sort()
            self.df1 = self.__setDataframeXY(self.ssdo1, self.fField, idDataset = 1)
            self.group1 = self.df1.groupby('CATEGORY_')
            typeC1 = self.ssdo1.fields[self.fField].type
            typeC2 = self.ssdo1.fields[self.fField].type
            self.idCategories = NUM.unique(self.ssdo1.fields[self.fField].data)

        elif self.modeName == "Incidents":
            self.cat1 = self.__getName(self.ssdo1)
            self.cat2 = self.__getName(self.ssdo2)
            self.unique = NUM.array([self.cat1])
            self.unique2 = NUM.array([self.cat2])
            self.df1 = self.__setDataframeXY(self.ssdo1, None, idDataset = 1)
            self.group1 = self.df1.groupby('CATEGORY_')
            self.df2 = self.__setDataframeXY(self.ssdo2, None, idDataset = 2)
            self.group2 = self.df2.groupby('CATEGORY_')
            self.idCategories = NUM.concatenate([self.unique, self.unique2])
            typeC1 = "TEXT"
            typeC2 = "TEXT"

        elif self.modeName == "TwoSources2Cats":
            self.unique = NUM.unique(self.ssdo1.fields[self.fField].data)
            self.unique.sort()
            self.unique2 = NUM.unique(self.ssdo2.fields[self.sField].data)
            self.unique2.sort()
            self.df1 = self.__setDataframeXY(self.ssdo1,self.fField, idDataset = 1)
            self.group1 = self.df1.groupby('CATEGORY_')
            self.df2 = self.__setDataframeXY(self.ssdo2, self.sField, idDataset = 2)
            self.group2 = self.df2.groupby('CATEGORY_')
            self.idCategories = NUM.concatenate([self.unique, self.unique2])
            typeC1 = self.ssdo1.fields[self.fField].type
            typeC2 = self.ssdo2.fields[self.sField].type

        elif self.modeName == "TwoSourceInc-Cat":
            self.cat1 = self.__getName(self.ssdo1)
            self.unique = NUM.array([self.cat1])
            self.unique2 = NUM.unique(self.ssdo2.fields[self.sField].data)
            self.unique2.sort()
            self.df1 = self.__setDataframeXY(self.ssdo1, None, idDataset = 1)
            self.group1 = self.df1.groupby('CATEGORY_')
            self.df2 = self.__setDataframeXY(self.ssdo2, self.sField, idDataset = 2)
            self.group2 = self.df2.groupby('CATEGORY_')
            self.idCategories = NUM.concatenate([self.unique, self.unique2])
            typeC1 = "TEXT"
            typeC2 = self.ssdo2.fields[self.sField].type

        elif self.modeName == "TwoSourceCat-Inc":
            self.unique = NUM.unique(self.ssdo1.fields[self.fField].data)
            self.unique.sort()
            self.cat2 = self.__getName(self.ssdo2)
            self.unique2 = NUM.array([self.cat2])
            self.df1 = self.__setDataframeXY(self.ssdo1,self.fField, idDataset = 1)
            self.group1 = self.df1.groupby('CATEGORY_')
            self.df2 = self.__setDataframeXY(self.ssdo2, None, idDataset = 2)
            self.group2 = self.df2.groupby('CATEGORY_')
            self.idCategories = NUM.concatenate([self.unique, self.unique2])
            typeC1 = self.ssdo1.fields[self.fField].type
            typeC2 = "TEXT"

        #### Avoid Number of Categories Equal Number Features ####   
        if len(self.unique)== len(self.ssdo1.xyCoords):
            ARCPY.AddIDMessage("ERROR", 110309)
            raise SystemExit

        if self.unique2 is not None  and len(self.unique2)== len(self.ssdo2.xyCoords):
            ARCPY.AddIDMessage("ERROR", 110309)
            raise SystemExit

        #### Define All Possible Combinations ####
        self.possibleGroups = self.__getPossibleGroups()
        self.typeField = typeC1.upper()
        self.cat1 = castValueField(typeC1, self.cat1)
        self.cat2 = castValueField(typeC2, self.cat2)


    def __getTimeData(self, idDataset):
        minDate = None
        ssdo = None
        field = None
        if idDataset == 1:
            ssdo = self.ssdo1
            field = self.fFieldTime
        else:
            ssdo = self.ssdo2
            field = self.sFieldTime

        if self.crossDataset:
            d1Min = self.ssdo1.fields[self.fFieldTime].data.min()
            d2Min = self.ssdo2.fields[self.sFieldTime].data.min()
            minDate = NUM.min([d1Min, d2Min])
        else:
            minDate = self.ssdo1.fields[self.fFieldTime].data.min()
        timeArray = NUM.array(ssdo.fields[field].data, dtype = 'datetime64[s]')
        #refTime  = NUM.array([minDate], dtype = 'datetime64[s]')
        return timeArray
        
    def __dateToFloat(self, timeArray):
        """
        Date to Float
        INPUT:
            timeArray (1D Numpy array <M8[s]): Time array
        RETURN 
            float array
        """
        refTime = NUM.array([DT.datetime(1970,1,1,0,0,0)], dtype= '<M8[s]')
        return NUM.asarray((timeArray - refTime[0]) / NUM.timedelta64(1, 's'), dtype= float)         

    def __setDataframeXY(self, ssdo, field = None, idDataset = None):
        """
        Create a dataframe adding X and Y fields
        The dataframe uses the original categories if 
        crossDataset is False
        """
        self.__warning()
        if not self.crossDataset:
            convertDictDF = self.__getDictXY(ssdo, idDataset)
            if field is None:
                convertDictDF["CATEGORY_"] = [self.unique1[0]]*ssdo.numObs
            else:
                convertDictDF["CATEGORY_"] = ssdo.fields[field].data

            if self.addTimeColumn:
                dataTime = self.__getTimeData(1)
                convertDictDF["DATE"] = dataTime

            index = NUM.arange(len(ssdo.xyCoords))
            dataframe = PANDAS.DataFrame(convertDictDF, index = index)
            dataframe['DATASET_'] = idDataset
            self.indexDF = index.max()
            return dataframe

        else:
            convertDictDF = self.__getDictXY(ssdo, idDataset)

            if field is None:

                uniqueValues = self.unique if idDataset == 2 else self.unique2
                initialId = len(uniqueValues)
                
                if len(self.unique) == 1 and idDataset == 1:
                    initialId = 0

                convertDictDF["CATEGORY_"] = [initialId]*ssdo.numObs
                index = NUM.arange(len(ssdo.xyCoords)) + self.indexDF
                self.indexDF = len(ssdo.xyCoords)

                #### Add Date Time ####
                if self.addTimeColumn:
                    if self.fFieldTime is not None:
                        dataTime = self.__getTimeData(idDataset)
                        convertDictDF["DATE"] = dataTime
                    if self.sFieldTime is not None:
                        dataTime =self.__getTimeData(idDataset)
                        convertDictDF["DATE"] = dataTime

                return PANDAS.DataFrame(convertDictDF, index = index)

            data = NUM.empty(len(ssdo.xyCoords), dtype = int)
            i = 0
            classify = {}

            uniqueValues = self.unique if idDataset == 1 else self.unique2
            timeField = None

            if idDataset == 1:
                timeField = self.fFieldTime
            else:
                timeField = self.sFieldTime

            #### Classify values ####
            for cat in uniqueValues:
                if idDataset == 1:
                    classify[cat] = i
                else:
                    classify[cat] = i + len(self.unique)
                i += 1

            self.__warning(str(classify))

            #### It Is Needed to Reclassify Categories ####
            #### To Merge Dataframes ####
            i = 0
            for value in ssdo.fields[field].data:
                data[i] = classify[value]
                i += 1

            convertDictDF['CATEGORY_'] = data
            index = NUM.arange(len(data)) + self.indexDF
            self.indexDF = len(data)

            #### Get Date Time Data ###
            if self.addTimeColumn:
                dataTime = self.__getTimeData(idDataset)
                convertDictDF["DATE"] = dataTime

            return PANDAS.DataFrame(convertDictDF, index = index)

    def __getDictXY(self, ssdo, inputID = 1):
        """ Handle Coordinates """

        convertDictDF = {}
        if ssdo.spatialRefType.upper() in ["PROJECTED", "UNKNOWN"]:
            x1 = ssdo.xyCoords[:,0]
            y1 = ssdo.xyCoords[:,1]

            convertDictDF["x"] = x1
            convertDictDF["y"] = y1

            #### Use Z value ####
            if ssdo.hasZ:
                convertDictDF["z"] = ssdo.zCoords
            return convertDictDF

        elif ssdo.spatialRefType.upper() == "GEOGRAPHIC":
            xyz =  None
            if ssdo.hasZ:
                xyz = NUM.zeros((len(ssdo.xyCoords), 3))
                xyz[:,:-1] = ssdo.xyCoords
                xyz[:,2] = ssdo.zCoords
            else:
                xyz = ssdo.xyCoords

            spheroidCoords = None
            if ssdo and ssdo.hasZ:
                try:
                    spheroidCoords = None
                    if ssdo.useChordal:
                        spheroidCoords = ARC._ss.lonlatelev_to_xyz(xyz, ssdo.spatialRef)
                except:
                    ARCPY.AddError("Projection found")
                    raise SystemExit
            else:
                if ssdo.useChordal:
                    spheroidCoords =  ssdo.spheroidCoords

            if inputID == 1:
                self.hasZ1 = True
            if inputID == 2:
                self.hasZ2 = True

            convertDictDF["x"] = spheroidCoords.T[0]
            convertDictDF["y"] = spheroidCoords.T[1]
            convertDictDF["z"] = spheroidCoords.T[2]

            return convertDictDF

    def __getPossibleGroups(self):
        """
        Generate all possible groups from dataset categories
        """

        allGroups = self.allGroups
        listV= []

        if not self.crossDataset:
            for cat1 in self.unique:
                for cat2 in self.unique:
                    listV.append((cat1,cat2))
            return listV
        else:
            text = "[Dataset{0} id:{2} value {3}] -> [Dataset{1} id:{4} value {5}]"
            if not allGroups:
                for id1 in range(len(self.unique)):
                    for id2 in range(len(self.unique2)):
                        nId = id2 + len(self.unique)
                        self.__warning(text.format(1, 2, id1, self.unique[id1],
                                                nId, self.unique2[id2]))
                        listV.append((id1, nId))
                return listV
            else:
                for id1 in range(len(self.unique)):
                    for id2 in range(len(self.unique)):
                        listV.append((id1, id2))
                        self.__warning(text.format(1, 1, id1, self.unique[id1],
                                                 id2, self.unique[id2]))
                    for id3 in range(len(self.unique2)):
                        nId = id3 + len(self.unique)
                        self.__warning(text.format(1, 2, id1, self.unique[id1],
                                                 nId, self.unique2[id3]))
                        listV.append((id1, nId))

                for id1 in range(len(self.unique2)):
                    nId = id1 + len(self.unique)
                    for id2 in range(len(self.unique)):
                        listV.append((nId, id2))
                        self.__warning(text.format(2, 1, nId, self.unique2[id1],
                                                 id2, self.unique[id2]))
                    for id3 in range(len(self.unique2)):
                        nId2 = id3 + len(self.unique)
                        listV.append((nId, nId2))
                        self.__warning(text.format(2, 2, nId, self.unique2[id1],
                                                 nId2, self.unique2[id3]))

                return listV

    def __getCategoryById(self, catId):
        if not self.crossDataset:
            return catId
        else:
            return self.idCategories[catId]

    def __replaceNullValue(self, value, forMessage = True, isPValue = True, isGDB = True, numPermutations = 99):
        """ Replace null value """

        nElem = len(str(numPermutations))
        stringFormat = "%0.3f" #"%0.{0}f".format(nElem)
        baseFormat ="%0.3f"

        if isGDB:
            if value == -1 and forMessage:
                return "N/A"
            if value == -1 and not forMessage:
                return -1
        else:
            if value == -1 and forMessage:
                return "N/A"
            if value == -1 and not forMessage:
                return -1

        if forMessage:
            if isPValue:
                return LOCALE.format_string(stringFormat,value)
            else:
                return LOCALE.format_string(baseFormat,value)
        else:
            return value

    def __configureCQObject(self):
        """ Create main dataset """

        self.__warning()
        dataFrame = None

        if not self.crossDataset:
            dataFrame = self.df1
        else:
            dataFrame = PANDAS.concat([self.df1, self.df2])

        self.currentDF = dataFrame

        self.xyz = None
        if "z" in dataFrame:
            if self.crossDataset:
                #### Assure Z in Both Data Sets ####
                if "z" in self.df1 and "z" in self.df2:
                    self.xyz = self.currentDF[['x','y','z']].values
                else:
                    self.xyz = self.currentDF[['x','y']].values
            else:
                #### Single Data Set ####
                self.xyz = self.currentDF[['x','y','z']].values
        else:
            #### Single/Double No Z ####
            self.xyz = self.currentDF[['x','y']].values

        info = NUM.unique(self.currentDF["CATEGORY_"], return_counts = True, return_inverse = True)


        self.uniqueCategories, self.labels, self.count = info
        self.allGroups = []

        dataTime = None
        if self.addTimeColumn:
            dataTime = self.currentDF[["DATE"]].values.ravel().astype('<M8[s]')

        for id1, cat1 in enumerate(self.uniqueCategories):
            for id2, cat2 in enumerate(self.uniqueCategories):
                self.allGroups.append((id1,id2))

        self.num_threads = UTILS.getNumberOfThreadsDefault()
        self.seed = UTILS.getRandomSeed()

        timeInterval = []
        if self.timeMethod is not None:
            timeInterval = self.__configDateTimeData(dataTime, self.timeMethod)
            dataTime = self.__dateToFloat(dataTime)

        #### When variable is zero the kdtree uses Median ####
        useKDTreeMeanSplit = 0

        #### This flag controls how the kdtree is build ####
        #### using median or mean split ####
        if len(self.xyz) > maxFeaturesForMedianSplit:
            #### The variable also defines the kdtree leafsize ####
            useKDTreeMeanSplit = 16

        self.colocationObj = ARC._ss.PyColocationQuotient(xyz = NUM.asarray(self.xyz.copy(), dtype= float),
                                             data = NUM.asarray(self.labels, dtype = NUM.int32),
                                             seed = self.seed, 
                                             num_threads = self.num_threads,
                                             links = self.neighborsSWM,
                                             time_data = dataTime,
                                             time_interval = NUM.asarray(timeInterval, dtype= float),
                                             default_knn = defaultKnn,
                                             use_kdt_mean = useKDTreeMeanSplit
                                             )

    def __configDateTimeData(self, dateInfo, timeMethod):
        import operator

        refTime = NUM.array([DT.datetime(1970,1,1,0,0,0)], dtype= '<M8[s]')
        data = self.__dateToFloat(dateInfo)
        unit = self.timeUnit[:-1] if self.timeUnit[-1] == "S" else self.timeUnit

        selectUnit = {"SECOND":"seconds", 
                    "MINUTE":"minutes", 
                    "HOUR":"hours",
                    "DAY":"days", 
                    "WEEK":"weeks", 
                    "MONTH":"months", 
                    "YEAR":"years"}

        #### Create interval for months/years ####
        timeData = NUM.zeros((len(data),2), dtype = float)
        if timeMethod == "BEFORE":
            timeData.T[1] = data
        if timeMethod == "AFTER":
            timeData.T[0] = data         

        unitValid = {selectUnit[unit]:int(self.timeSize)}
        unq = NUM.unique(dateInfo)

        if timeMethod == "SPAN":
            #### Calculate interval for each datetime value ####
            for dateRecord in unq:
                msk = dateInfo == dateRecord
                changedI = operator.sub(dateRecord.astype('O'), DUT.relativedelta.relativedelta(**unitValid))
                timeData.T[0][msk] = (NUM.array([changedI],dtype= '<M8[s]') - refTime[0]) / NUM.timedelta64(1, 's')
                changed = operator.add(dateRecord.astype('O'), DUT.relativedelta.relativedelta(**unitValid))
                timeData.T[1][msk] = (NUM.array([changed],dtype= '<M8[s]') - refTime[0]) / NUM.timedelta64(1, 's')
        if timeMethod == "BEFORE":
            #### Calculate interval for each datetime value ####
            for dateRecord in unq:
                msk = dateInfo == dateRecord
                changedI = operator.sub(dateRecord.astype('O'), DUT.relativedelta.relativedelta(**unitValid))
                timeData.T[0][msk] = (NUM.array([changedI],dtype= '<M8[s]') - refTime[0]) / NUM.timedelta64(1, 's')
        if timeMethod == "AFTER":
            #### Calculate interval for each datetime value ####
            for dateRecord in unq:
                msk = dateInfo == dateRecord
                changed = operator.add(dateRecord.astype('O'), DUT.relativedelta.relativedelta(**unitValid))
                timeData.T[1][msk] = (NUM.array([changed],dtype= '<M8[s]') - refTime[0]) / NUM.timedelta64(1, 's')

        return timeData

    def __binData(self, data, pvalue):
        """ Define the Output Bin """

        if data == -1:  #No neighbor
            return 4, "Undefined"
            
        if data > 1:
            if pvalue <= 0.05:
                return 0, "Colocated - Significant"
            else:
                return 1, "Colocated - Not Significant"
        elif data <= 1:
            if pvalue <= 0.05:
                return 2, "Isolated - Significant"
            else:
                return 3, "Isolated - Not Significant"
        else:  ## when data = 1
            return 4, "Undefined"
            
        return 4, "Undefined"

    def __getNeighborsSWM(self):
        """ Get Neighbor from SWM File """

        self.neighborsSWM = None
        if not self.swmFileBool:
            return

        ###Use only One SSDO ####
        ssdo = self.ssdo1
        iterVals = None
        weightsFile = self.weightsFile
        master2Order = ssdo.master2Order
        masterField = ssdo.masterField
        numObs = ssdo.numObs
        neigh = {i:set() for i in NUM.arange(len(ssdo.xyCoords)) }
        listNeighs = []
        N = None
        swm = None

        #### Using Weights File ####
        if weightsFile:
            #### Open Spatial Weights and Obtain Chars ####
            swm = None
            swm = WU.SWMReader(weightsFile)
            N = swm.numObs
            rowStandard = swm.rowStandard
            self.swm = swm
            self.masterIs64 = swm.hasID64

            #### Check to Assure Complete Set of Weights ####
            if ssdo.numObs > N:
                ARCPY.AddIDMessage("ERROR", 842, ssdo.numObs, N)
                raise SystemExit()

            #### Check if Selection Set ####
            isSubSet = False
            if ssdo.numObs < N:
                isSubSet = True
            iterVals = UTILS.ssRange(N)

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
                    for neigh1 in UTILS.ssRange(nn):
                        nhInt = int(nhIDs[neigh1])
                        neigh[orderID].add(nhInt)

            ARCPY.SetProgressorPosition()

        if stop:
            swm.close()
            ARCPY.AddIDMessage("ERROR", 938)
            raise SystemExit()

        #### Clean Up ####
        if self.swmFileBool:
            swm.close()

        #### Transform Set To list and Remove Bad Records Ids ####
        listNeigh = {}
        if len(ssdo.badRecords) > 0:
            for id, e in enumerate(neigh):
                listNeigh[int(e)] = [int(i) for i in neigh[e] if  ssdo.order2Master[i] not in ssdo.badRecords]
        else:
            for id, e in enumerate(neigh):
                listNeigh[int(e)] = [int(i) for i in neigh[e]]

        self.neighborsSWM = listNeigh

    def __warningNoNeighbors(self,info, parameters):
        """
        Generate list of IDs of the features without neighbor in both datasets
        """

        listId = []
        listId2 = []

        if not self.crossDataset:
            listId = [str(self.ssdo1.order2Master[i]) for id,i in enumerate(info) if id < 30 ]
        else:
            contInt = 0
            contTar = 0
            for id, i in enumerate(info):

                if i < len(self.df1) and contInt < 30:
                    listId.append("{0}".format(self.ssdo1.order2Master[i]))
                    contInt += 1

                if i >= len(self.df1) and contTar < 30:
                    listId2.append("{0}".format(self.ssdo2.order2Master[i-len(self.df1)]))
                    contTar += 1

        output = ""

        if parameters is not None:
            if len(listId):
                output = "{0} [{1}]".format(parameters[1].displayName + "IDs" , ",".join(listId))
            if len(listId2):
                output += " {0} [{1}]".format(parameters[6].displayName + "IDs", ",".join(listId2))

        return output.strip()

    def getGlobalValues(self, permutations, outputTable = None, allowMessage = False, parameters = None):
        """
        Get p-values of all groups from permutations output
        """

        if outputTable in ["", None]:
            return

        isGDB = UTILS.isGDB(outputTable)

        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84959))



        #### Calculate Global Colocation  ####
        info = self.colocationObj.get_global_colocation_quotient(permutations, self.kUsed , self.thresholdUsed )

        ### Global Colocation was not calculated ###
        if type(info) != tuple:

            ### Exit Execution
            if info is None:
                return
            dat = info[1:]
            noNeighsNum = (dat >= 0).sum()
            dataInfo = dat[dat >= 0]
            output = self.__warningNoNeighbors(dataInfo, parameters)
            ARCPY.AddIDMessage("WARNING", 110311, noNeighsNum, output)
            return
            
        #### Set Values  ####
        cqBase, pValues, globalCq, globalPvalue, noNeighs = info
        
        ### Features using nearest neighbor  - do not use first item ###
        if len(noNeighs) > 1:
            dat = noNeighs[1:]
            noNeighsNum = (dat <= 0).sum()
            dataInfo = dat[dat <= 0]*-1
            output = self.__warningNoNeighbors(dataInfo, parameters)
            ARCPY.AddIDMessage("WARNING", 110312, str(noNeighsNum), output)

        #### Generate Messages and Table ####
        listDataset = []
        listCatAnalysis = []
        listCatSecond = []
        listDatasetSecond = []
        listCQValue = []
        listCQPvalue = []

        header = "Global Relationships"
        headerColumns = None
        dataLabel = []
        justifyArray = None

        #### Create Table Depending on Input Type ####

        if self.mode  in [0, 2]: #OneSource2Cats, Incidents
            headerColumns =["Category", "Category", "Colocation Quotient", "p-value"]
            justifyArray = ["left", "left", "left", "left"]

        if self.mode in [1,3,4]: #TwoSources2Cats
            headerColumns =["Dataset", "Category", "Dataset", "Category", "Colocation Quotient", "p-value"]
            justifyArray = ["left", "left", "left", "left","left", "left"]

        stringFormat = "%0.3f"
        dataLabel.append(headerColumns)

        #### Dataset Names  ####
        datasetNames = [self.__getName(self.ssdo1)]
        if self.crossDataset:
            if datasetNames[0] == self.__getName(self.ssdo2):
                datasetNames[0] += " - A"
                datasetNames.append(self.__getName(self.ssdo2) + " - B")
            else:
                datasetNames.append(self.__getName(self.ssdo2))

        #### Check All Combinations ####
        for index,  id in enumerate(self.allGroups):
            if self.mode in [1,3,4]:
                #### Check Dataset Id ####
                #### Ids of the Second Dataset Begins after Ids First Dataset ####
                dIni = 2 if id[0] >= len(self.unique) else 1
                dEnd = 2 if id[1] >= len(self.unique) else 1

                #### Add Only The Requested Analysis Category  ####
                if id[0] == 0 and dIni == 1 and allowMessage:
                    dataLabel.append([datasetNames[dIni-1], 
                                      self.__getCategoryById(id[0]),
                                      datasetNames[dEnd-1],
                                      self.__getCategoryById(id[1]),
                                      self.__replaceNullValue(cqBase[index], isPValue = False),
                                      self.__replaceNullValue(pValues[index], numPermutations = permutations)])
                #### Add Data To Create Table #####
                listDataset.append(datasetNames[dIni-1])
                listDatasetSecond.append(datasetNames[dEnd-1])
                listCatAnalysis.append(self.__getCategoryById(id[0]))
                listCatSecond.append(self.__getCategoryById(id[1]))

            elif self.mode  in [0, 2]:
                #### Add Only Categories / Incidents  ####

                catBase = self.uniqueCategories[id[0]]
                catTarget = self.uniqueCategories[id[1]]

                if self.mode == 2:
                    dIni = 2 if id[0] >= len(self.unique) else 1
                    dEnd = 2 if id[1] >= len(self.unique) else 1
                    catBase = datasetNames[dIni-1]
                    catTarget = datasetNames[dEnd-1]

                if id[0] == 0 and allowMessage:
                    dataLabel.append([catBase,
                                        catTarget, 
                                        self.__replaceNullValue(cqBase[index], isPValue = False),
                                        self.__replaceNullValue(pValues[index], numPermutations = permutations)])
                #### Add Data To Create Table #####
                listCatAnalysis.append(catBase)
                listCatSecond.append(catTarget)

            listCQValue.append( self.__replaceNullValue(cqBase[index], forMessage = False, isGDB = isGDB ))
            listCQPvalue.append(self.__replaceNullValue(pValues[index], forMessage = False,isGDB = isGDB))

        if allowMessage:
            outputReport = UTILS.outputTextTable(dataLabel, header = header,
                                                justify = justifyArray, pad = 1, colPad = 3,
                                                titleFillToken = "-")
            #### Output Table ####
            ARCPY.AddMessage(outputReport)

            pValueG = -1
            if not self.diffCat:
                globalText = "Global CLQ = {0} p-value {1}"
                ARCPY.AddMessage(globalText.format(
                                          self.__replaceNullValue(globalCq, isPValue = False),
                                          self.__replaceNullValue(globalPvalue, numPermutations = permutations)
                               ))

        #### Create Output Table ####
        if outputTable:

            #### Container Empty For Tables ####
            cont = UTILS.DataContainer()

            if self.mode  in [1,3,4]:
                cont.generateOutput(outputTable,
                                    [
                                        NUM.array(listDataset),
                                        NUM.array(listCatAnalysis),
                                        NUM.array(listDatasetSecond),
                                        NUM.array(listCatSecond),
                                        NUM.array(listCQValue),
                                        NUM.array(listCQPvalue)
                                    ],
                                    ["FEAT_INT", "CAT_INT","FEAT_NEIGH", "CAT_NEIGH", "GCLQ", "PVALUE"],
                                    ["Features of Interest", "Category of Interest", "Neighboring Features",
                                     "Neighboring Category", "Global Colocation Quotient", "p-value"]
                                     )
            elif  self.mode  in [0, 2]:
                cont.generateOutput(outputTable,
                                    [
                                        NUM.array(listCatAnalysis),
                                        NUM.array(listCatSecond),
                                        NUM.array(listCQValue),
                                        NUM.array(listCQPvalue)
                                    ],
                                    [ "CAT_INT", "CAT_NEIGH", "GCLQ", "PVALUE"],
                                    ["Category of Interest", "Neighboring Categories",
                                    "Global Colocation Quotient", "p-value"]
                                     )


        return self.__replaceNullValue(globalCq, forMessage = False, isGDB = isGDB ), \
                self.__replaceNullValue(globalPvalue, forMessage = False, isGDB = isGDB)

    def getLocalValues(self, permutations, threshold, kNeighbors, kernelType):
        """ Main Function To calculate the local Colocation
        INPUT:
            permutations (int): Number of Permutations
            threshold (float/None): Distance Band
            kNeighbors (int/None): Number of Nearest Neighbors
            kernelType (str)
        """
        useDefaultKnn = False
        useDefaultDistance = False

        if threshold is not None:

            if type(threshold) == int:

                if threshold != -1:
                    threshold = None
                else:
                    useDefaultDistance = True
            else:
                threshold = self.ssdo1.getDistance(threshold)

        if kNeighbors is not None:

            if kNeighbors < -1:
                kNeighbors = None

            elif kNeighbors == -1:
                useDefaultKnn = True

            else:
                if  kNeighbors > len(self.currentDF) - 1:
                    ARCPY.AddIDMessage("ERROR", 975)
                    raise SystemExit()

        ERROR.errorNumberOfObs(len(self.currentDF), minNumberFeatures)

        #### Adjust Arguments ####
        if kNeighbors is None:
            kNeighbors = 0
        if threshold is None:
            threshold = 0

        index1 = None
        index2 = None
        category1 = None
        category2 = None
        unique = self.unique
        unique2 = self.unique2

        #### Upper case each category in data ####
        if self.unique.dtype not in [NUM.int32, NUM.int64]:
            unique = [str(id).upper() for id in self.unique]
            category1 = self.cat1.upper()
        else:
            unique = [id for id in self.unique]
            category1 = int(self.cat1)

        if self.crossDataset :
            if self.unique2.dtype not in [NUM.int32, NUM.int64]:
                unique2 = [str(id).upper() for id in self.unique2]
                category2 = self.cat2.upper()
            else:
                unique2 = [id for id in self.unique2]
                category2 = int(self.cat2)
        else:
            if self.unique.dtype not in [NUM.int32, NUM.int64]:
                category2 = self.cat2.upper()
            else:
                category2 = int(self.cat2)

        textC1 = str(category1)
        textC2 = str(category2)

        #### Same Name ####
        if category1 == category2:
            textC1 += " - A"
            textC2 += " - B"
            
        self.textC1 = textC1
        self.textC2 = textC2
        msg = ARCPY.GetIDMessage(84960)
        ARCPY.AddMessage(msg.format(textC1, textC2))

        #### Assert Categories ####
        if  self.crossDataset:
            if category1 in unique:
                index1 = unique.index(category1)
            else:
                ARCPY.AddError("The Category ({0}) from dataset {1} is not found".format(category1, self.getName(self.ssdo1)))
                raise SystemExit

            if category2 in unique2:
                index2 = unique2.index(category2) + len(self.unique)
            else:
                ARCPY.AddError("The Category ({0}) from dataset {1} is not found".format(category2, self.getName(self.ssdo2)))
                raise SystemExit
        else:

            if category1 in unique:
                index1 = unique.index(category1)
            else:
                ARCPY.AddError("The Category ({0}) from dataset {1} is not found".format(category1, self.getName(self.ssdo1)))
                raise SystemExit

            if category2 in unique:
                index2 = unique.index(category2)
            else:
                ARCPY.AddError("The Category ({0}) from dataset {1} is not found".format(category2, self.getName(self.ssdo1)))
                raise SystemExit
                
        #### Main Function to Calculate Local Colocation ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84958))
        infoOutput = self.colocationObj.get_local_colocation_quotient(num_permutations = permutations,
                                                catA = index1,
                                                catB = index2,
                                                k = kNeighbors,
                                                distance = threshold,
                                                kernel_type = kernelType,
                                                calculate_group_cat = 1)
        calculatedDistance = None
        values = None
        indCats = None
        member = None
        undefined = None

        #### Exit tool  ###
        if infoOutput is None:
            raise SystemExit

        if len(infoOutput) == 5:
            values, calculatedDistance, indCats, member, undefined = infoOutput
        else:
            values, calculatedDistance = infoOutput
            indCats = None
            member = None

        self.thresholdUsed = calculatedDistance
        self.kUsed = kNeighbors

        if useDefaultKnn:
            ARCPY.AddIDMessage("WARNING", 110308, defaultKnn)

        if useDefaultDistance:
            ARCPY.AddIDMessage("WARNING", 853, "{0:.3f}".format(calculatedDistance))

        self.undefinedErrors = undefined

        return values.reshape((int(values.shape[0]/2)), 2), index1, indCats, member

    def createOutputLocalOutput(self, dataValues, indexBaseCat1, indCats, member, outputTable = None):
        """
        Create a point feature class 
        """
        selection = NUM.where(self.labels == indexBaseCat1)[0]

        outputFC = self.outputFC
        self.__warning()

        #### Set Field Data From LCQL Output ####
        aLCLQ = dataValues.T[0]
        pValues = dataValues.T[1]

        #### Subset Coordinates ####
        xyz = self.ssdo1.xyCoords[selection]
        srf = self.ssdo1.spatialRef


        #### Obtain Source Id ####
        if self.masterIs64:
            sourceType = "BIGINTEGER"
            sourceId = NUM.array([self.ssdo1.order2Master[id] for id in selection], dtype = NUM.int64)
        else:
            sourceType = "LONG"
            sourceId = NUM.array([self.ssdo1.order2Master[id] for id in selection], dtype = NUM.int32)

        #### Identify Bin ####
        binIds = []
        binTypes = []
        for i in NUM.arange(len(aLCLQ)):
            idBind, binType  = self.__binData(aLCLQ[i],pValues[i])
            binIds.append(idBind)
            binTypes.append(binType)
        
        binLabels = NUM.array(binTypes)
        bins = NUM.array(binIds, dtype = NUM.int32)
        z = None

        #### Use Z output ####
        if self.ssdo1.hasZ:
            z = self.ssdo1.zCoords[selection]

        #### Create Container #####
        container = UTILS.DataContainer(spatialRef = srf, xy = xyz, z = z, hasOID64 = self.hasOID64)

        #### Errors ###
        idNoNeighsError = NUM.where(self.undefinedErrors==1)[0]
        idBandwidthZeroError = NUM.where(self.undefinedErrors==2)[0]
        idNoNeighsSWMError = NUM.where(self.undefinedErrors==3)[0]

        idNoNeighsError = NUM.concatenate((idNoNeighsError,idNoNeighsSWMError))
        if len(idNoNeighsError) > 0:
            info = [str(self.ssdo1.order2Master[id]) for i, id in enumerate(selection[idNoNeighsError]) if i < 30]
            ARCPY.AddIDMessage("WARNING", 110313,",".join(info))

        if len(idBandwidthZeroError) > 0 :
            info = [str(self.ssdo1.order2Master[id]) for i, id in enumerate(selection[idBandwidthZeroError]) if i < 30]
            ARCPY.AddIDMessage("WARNING", 110314,",".join(info))
            
        #### Output Fields ####
        fields = [
        SSDO.CandidateField(name = "SOURCE_ID", alias = "Source ID", type = sourceType, data = sourceId),
        SSDO.CandidateField(name = "LCLQ", alias = "Local Colocation Quotient", type = "DOUBLE", data = aLCLQ),
        SSDO.CandidateField(name = "PVALUE", alias = "p-value", type = "DOUBLE", data = pValues),
        SSDO.CandidateField(name = "LCLQBIN", alias = "LCLQ Bin", type = "LONG", data = bins ),
        SSDO.CandidateField(name = "LCLQTYPE", alias = "LCLQ Type", type = "TEXT", data = binLabels )]

        #### Limit the number of characters in the NEIGHCATS field ####
        limit = None

        if indCats is not None:
            uniqueCategories = self.idCategories
            #### Categories Groups ####
            nl = len(uniqueCategories)
            nv = len(indCats)/nl
            catValues =[]
            count = 0
            greaterTLimit = False
            limit = maxNumCharInGDB
            
            #### For GDB ####
            if not UTILS.isGDB(self.outputFC):
                limit = maxNumCharInSHP
            
            for i in NUM.arange(nv):
                t = ",".join([ str(uniqueCategories[id]) for id,f in enumerate((NUM.arange(nl) + nl*i)) if indCats[int(f)] > 0 ])
                if len(t)>limit:
                    t = t[0:int(limit-4)]+"..."
                    greaterTLimit = True
                catValues.append(t)

            #### Calculate The Text Length ####
            if not greaterTLimit:
                limit = NUM.max([len(i) for i in catValues])

            fields.append(SSDO.CandidateField(name = "NEIGHCATS", alias = "Neighboring Categories", type = "TEXT",  length = limit, data = NUM.array(catValues)))
            fields.append(SSDO.CandidateField(name = "NEIGHPREV", alias = "Neighbor Prevalence", type = "DOUBLE", data = member))

        #### Output Feature Class ####
        container.generateOutput(outputFC, fields)
        usePython = False
