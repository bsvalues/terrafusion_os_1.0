# coding: utf-8
"""
Source Name:   SSForest.py
Version:       ArcGIS Pro 2.2
Author:        Environmental Systems Research Institute Inc.
Description:   Python file with utilities classes for running 
               forest.
"""
################### Imports ########################

import os as OS
import sys as SYS
import operator as OP
import numpy as NUM
import arcgisscripting as ARC
import scipy.stats as SCPS
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.conversion as CONV
import arcpy.da as DA
import arcpy.sa as ASA
import SSDataObject as SSDO
import SSUtilities as UTILS
import Stats as STATS
import ErrorUtils as ERROR
import time as TIME
import json as JSON
import pdb
import locale as LOCALE
import collections as COLL
import gc as GC
import netCDF4 as NET
import datetime as DT
##### Global Variables #####

classwt = None 

DBGFILES = None
DBGPAR = False
NULL = -999999
MaxCategoriesAllowed = 60
predictivePowerVariableSize = 15
minNumObs = 20
minNumElemePerClassStrat = 5
DBGLARGERASTER = False
maxSizeCells = 1e9
randSeed = None
HDBG = False
MEMSIZE = 1e8
MEMPOINT = 1e8
ENABLED_RASTER_PROBABILITY = False

listExtensions = [".ASC", ".IMG",".TIFF",".JPG", ".TIF", ".JP2", ".PNG", 
                ".GIF", ".BIP", ".DAT", ".CRF", ".MRF", ".BMP", ".BIL",
                ".BSQ"]
noSupportSAFormats = ['Image Service', "Cache/LERC2D"]

convertType = {'SmallInteger': 'SHORT',
                'Integer': 'LONG',
                'String': 'TEXT',
                'Single': 'FLOAT',
                'Double': 'FLOAT',
                'Date': 'DATE',
                'BigInteger': 'BIGINTEGER'}


convert2Numpy = {"DOUBLE": NUM.float64,
                 "LONG": NUM.int32,
                 "SHORT": NUM.int32,
                 "FLOAT": NUM.float64,
                 "BIGINTEGER": NUM.int64}

convertTypeSupportedByFastOutput = {'SmallInteger': 'LONG', 'Integer': 'LONG',
                                        'String': 'TEXT', 'Single': 'DOUBLE',
                                        'Double': 'DOUBLE','Date': 'DATE',
                                        'SMALLINTEGER': 'LONG','INTEGER': 'LONG',
                                        'STRING': 'TEXT','SINGLE': 'DOUBLE',
                                        'DOUBLE': 'DOUBLE','DATE': 'DATE',
                                        'BIGINTEGER': 'BIGINTEGER',
                                        'BigInteger': 'BIGINTEGER'}


continuous = "(CNT)"
discrete  =  "(CAT)"
categoricalVar = 'Categorical'
numericVar = 'Numeric'

userTypeType = { numericVar: 1,
                categoricalVar : 2}
varType = { numericVar: continuous ,
            categoricalVar: discrete }
varTypeRev = { continuous: numericVar,
               discrete:categoricalVar }

def numpy2FormatSupport(typeNumpy, size = None):
    """
    Numpy dtype Supported by Fast Write Candidate Field
    INPUT:
        typeNumpy (str): type (INT, LONG...)
        size {int}: String length
    OUTPUT:
        return (Numpy type)
    """
    if typeNumpy == "TEXT":
        typeNumpy = 'U'+str(size)
        return typeNumpy
    return convert2Numpy[typeNumpy]

def tryMsg(msg, v1, v2):
    try:
        return msg.format(v1,v2)
    except:
        return msg


################## Classes #########################
class RFField(UTILS.ModelVariable):
    """This class stores information information of each field in RF
    """
    def __init__(self):
        self.dataSource = None
        self.data = None
        self.infoCount = None
        super().__init__()
        pass

class InfoForestField(UTILS.ModelMetadata):
    """This class stores information about the forest source data.

    INPUTS: 
        splitPercentage {float}: percentage to split test dataset
        seed {int}: seed
        ssdo {SSDataObject}: Data Object
        numXVariables {int} : Number of X's variables
        isTraining {bool, True}: The dataset is for training


    ATTRIBUTES:
    name (str): name of the field
    baseName (str): name of th field on disk, I.e. without table joins
    type (str): type of data {'Single', 'Double', 'Integer', etc...}
    length (int): length of the field

    METHODS:
    generateXVariable()
    getIndexField(name)
    get_fieldType(id_field)
    get_categories(id_field)
    add_field(names, type, source)
    """

    def __init__(self, splitPercentage = 0, seed = 0, ssdo = None, numXVariables = None, isTraining = True):
        super().__init__()
    
        self.seed = seed
        self.splitPercentage = splitPercentage
        self.isTraining = isTraining
        self.ssdo = ssdo
        self.filteredRowsIds = []
        self.filterApplied = False
        self.y = None
        self.yField = None
        self.fields = []
        self.explodeRaster = False
        self.properties = {"version": "1.0",
                           "date": TIME.asctime(TIME.localtime(TIME.time())),
                           "leafSize":1,
                           "sampleSize": -1,
                           "numFieldPerm": 1,
                           "explodeRaster": False
                           }
        self.modelPath= None

        self.viewSplitMessage = False
        self.infoMissTrain = []
        self.infoMissTest = []

        ### Get original Indices master SSDO FC ###
        self.masterIndexFC = {}
        self.getIndicesBadRecords()
        self.numXVariables = 0

        ### Split Data ###
        self.x_train = None
        self.y_train = None
        self.x_test = None
        self.y_test = None
        self.indices = None
        self.train_split_indices = None
        self.test_split_indices = None
        self.sparseMessage = False

        if type(ssdo) == SSDO.SSDataObject:
            self.ssdo = ssdo
            self.N = 0
            #self.y = None
            self.x = None

    def loadDataRasterForTraining(self, infoRaster, ssdo, variableToPredict, typeYVarUserRF = "Categorical" , 
                                  checkBalance = True):
        """ This method loads data from a RasterInfo Object to generate
        the variables require for training forest model
        """

        dtypeV = ssdo.fields[variableToPredict.upper()].data.dtype

        dataX = None
        mask = None
        if ssdo.shapeType == "Polygon":
            dataX, mask = infoRaster.extractDataFromPolygons(ssdo)

            if infoRaster.idPoly is None or infoRaster.polygonMask is None or infoRaster.centroids is None:
                ARCPY.AddIDMessage("Error", 110419,ssdo.inputFC, "")
                raise SystemExit

            infoRaster.ssdo = None
            self.createVariablesFromRasterList(infoRaster, dataX)
            infoRaster.idPoly =  infoRaster.idPoly[mask]
            infoRaster.polygonMask = infoRaster.polygonMask[mask]
            infoRaster.centroids  = infoRaster.centroids[mask]

            yVar = NUM.zeros(len(infoRaster.polygonMask), dtype = dtypeV)
            y = ssdo.fields[variableToPredict.upper()].data

            for id, i in enumerate(infoRaster.idPoly):
                if i in ssdo.master2Order:
                    orderId = ssdo.master2Order[i]
                    idP = NUM.argwhere(infoRaster.idPoly == i)
                    yVar[idP] = y[orderId]

            #### Add Y Field ####
            self.defineYFromArray(name = variableToPredict.upper(),
                                        userType = typeYVarUserRF,
                                        inputType = ssdo.fields[variableToPredict.upper()].type,
                                        dataInfo = yVar,
                                        source = "FC")

            self.dataObject = UTILS.DataContainer(infoRaster.srf, infoRaster.centroids, 
                                                  hasOID64 = ssdo.hasOID64)

        if ssdo.shapeType == "Point":
            dataX, mask = infoRaster.extractDataUsingPoints(ssdo)
            infoRaster.ssdo = None
            infoRaster.srfOut = ssdo.spatialRef
            self.createVariablesFromRasterList(infoRaster, dataX)
            centroids  = ssdo.xyCoords[mask,:]

            y = ssdo.fields[variableToPredict.upper()].data[mask]
            ssdo.fields[variableToPredict.upper()].data = y
            self.defineYFromDataObject(variableToPredict.upper(), typeYVarUserRF, ignoreValue = True,
                                       checkBalance = checkBalance)
            self.dataObject = UTILS.DataContainer(infoRaster.srf, centroids,
                                                  hasOID64 = ssdo.hasOID64)

    def loadDataRasterForPredicting(self, trainingField, infoRaster, indexRange):
        """ This method loads data from a RasterInfo Object to generate
        the variables require for training forest model
        """
        dataX, mask = infoRaster.extractZone(indexRange)

        if len(dataX) == 0:
            return None

        #### Clean Memory ####
        self.fields = None
        GC.collect()

        self.fields = []
        self.createVariablesFromRasterList(infoRaster, dataX, trainingField)

        if self.badCat is not None:
            mask = mask[self.badCat]

        return mask

    def createVariablesFromRasterList(self, infoRaster, dataBlock, trainingField = None):
        """ Check Variables """
        messages = []
        self.badCat = None
        for id, val in enumerate(infoRaster.newNames):
            name = val
            userType = numericVar if infoRaster.typeRF[id] else categoricalVar
            self.addVariable(name, userType, "DOUBLE", "RASTER", None)
            errors = None
            info = None

            if trainingField is not None:
                errors, info = self.variableTest(name, dataBlock, userType, id, trainingField.fields[id])
            else:
                errors, info = self.variableTest(name, dataBlock, userType, id)

            self.fields[id].info = info
            messages.extend(errors)

        if self.badCat is not None:
            dataBlock = dataBlock[self.badCat]

        processErrors(messages)
        self.x = dataBlock

    def variableTest(self, name, dataBlock, userType, id,  field = None):
        """ Test variability """
        errors  = None
        info = ""

        data = dataBlock.T[id]
        if userType == 'Categorical':
            unique = NUM.unique(data)
            data1 = NUM.zeros(len(data), dtype = float)

            if field is not None:
                differences  = NUM.in1d(unique,NUM.array(field.info))
                t = differences.sum()
                neg = ~differences

                #if t != len(unique):
                #    ARCPY.AddWarning(f"There are categories in the variable ({field.name}) that does not exist in the training" )

                if neg.sum() == len(unique):
                    ARCPY.AddIDMessage("ERROR", 110235, ", ".join([str(e) for e in self.fields.info]))
                    raise SystemExit

                for ind, ele in enumerate(field.info):
                    data1[data == ele] = float(ind)
 
                if neg.sum() > 0:
                    for ind, ele in enumerate(unique[neg]):
                        data1[data == ele] = -1
                    if self.badCat is None:
                        self.badCat = NUM.where(data1!=-1)[0]
                    else:
                        self.badCat = NUM.unique( NUM.concatenate((self.badCat, NUM.where(data1!=-1)[0]),0))

            else:
                for ind, ele in enumerate(unique):
                    data1[data == ele] = float(ind)

            dataBlock.T[id] = data1
            info = unique
            errors = self.checkVariabilityCat(name, unique)

        else:
            errors = self.checkVariability(name, data)
            info = [data.min(), data.max()]

        return errors, info

    def checkAllCategoriesUsed(self, yTrain, yTest):
        """ This function checks if all categories were selected 
            to create the subset training/testing
        INPUT:
            yTrain (1D array): Id Categories in Training
            yTest (1D array): Id Categories in testing
        """
        categories = self.yField.info
        nCatTrain = len(yTrain)
        nCatTest = len(yTest)
        nCatData = len(categories)
        self.infoMissTrain = []
        maxN = 30
        if nCatTrain < nCatData:
            noContain = []
            for i, e in enumerate(categories):

                if i not in yTrain:
                    noContain.append(str(e))

                if len(noContain) > maxN - 1:
                    break

            self.infoMissTrain = noContain


        if nCatTest < nCatData:
            noContain = [] 
            for i, e in enumerate(categories):

                if i not in yTest:
                    noContain.append(str(e))

                if len(noContain) > maxN - 1:
                    break

            self.infoMissTest = noContain

    def areAllCategoriesUsed(self):
        """
        Create a warning when all categories were not used in
        the process
        """

        if self.viewSplitMessage:

            if len(self.infoMissTrain) > 0:
                self.applySparseMessage("ERROR")
                ARCPY.AddIDMessage("ERROR", 110234, (100-self.splitPercentage),", ".join(self.infoMissTrain))
                raise SystemExit

            if len(self.infoMissTest) > 0:
                self.applySparseMessage()
                ARCPY.AddIDMessage("WARNING", 110235,", ".join(self.infoMissTest))

    def splitDataForTesting(self, balance = False):
        """ Split Dataset for training
        INPUT:
            balance {bool, False}: Apply balance
        """

        if self.isTraining:

            if self.splitPercentage > 0:
                #### Set Seed To Control Split Process ####
                NUM.random.seed(self.seed)
                flag = True
                timesSearch = 0
                maxTimesToTry = 30

                if balance:
                    counts = self.yField.infoCount
                    minSizeClass = NUM.floor(counts*(100-self.splitPercentage)/100)
                    minClass = NUM.where(minSizeClass < minNumElemePerClassStrat)[0]

                    if len(minClass) > 0:
                        ARCPY.AddIDMessage("ERROR", 110230)
                        idsMinElem = minClass.tolist()
                        listErr = [str(self.yField.info[id]) for id in idsMinElem ]
                        listCat = ", ".join(listErr if  len(listErr) < 30 else listErr[0:30])
                        ARCPY.AddIDMessage("ERROR", 110231, minNumElemePerClassStrat, listCat)
                        raise SystemExit
                    else:
                        self.indices = NUM.arange(len(self.x), dtype = int)
                        indices = NUM.zeros(len(self.y), dtype = int)

                        for id, elem in enumerate(self.yField.info):
                            ind = self.y == id

                            #### Verify Count ####
                            if counts[id] != ind.sum():
                                self.yField.infoCount[id] = ind.sum()
                                counts[id] = ind.sum()
                                minSizeClass[id] = NUM.floor(counts[id]*(100-self.splitPercentage)/100)

                            valueIndCat = NUM.zeros(counts[id], dtype = int)
                            indicesCat = NUM.arange(counts[id], dtype = int)
                            NUM.random.shuffle(indicesCat)
                            train_split_indices = indicesCat[slice(0, int(minSizeClass[id]))]
                            valueIndCat[train_split_indices] = 1
                            indices[ind] = valueIndCat

                        self.train_split_indices = NUM.where(indices == 1)[0]
                        self.test_split_indices =  NUM.where(indices == 0)[0]
                        self.indicesTrain = indices
                        self.x_train = self.x[self.train_split_indices,]
                        self.y_train = self.y[self.train_split_indices]
                        self.x_test = self.x[self.test_split_indices,]
                        self.y_test = self.y[self.test_split_indices]
                else:



                    while flag:
                        timesSearch += 1
                        n = len(self.x)
                        split = int(n * self.splitPercentage / 100)
                        indices = NUM.arange(len(self.x), dtype = int)
                        self.indicesTrain = NUM.ones(len(self.x), dtype = int)

                        NUM.random.shuffle(indices)
                        self.train_split_indices = indices[split:n]
                        self.test_split_indices = indices[0:split]
                        self.indices = NUM.arange(len(self.x), dtype = int)

                        self.indicesTrain[self.test_split_indices] = 0
                        self.x_train = self.x[self.train_split_indices,]
                        self.y_train = self.y[self.train_split_indices]
                        self.x_test = self.x[self.test_split_indices,]
                        self.y_test = self.y[self.test_split_indices]
                        flag = False

                        if self.yField.rfType == categoricalVar:
                            uniq_y_tr, cnt_tr = NUM.unique(self.y_train, return_counts = True)
                            uniq_y_test, cnt_test = NUM.unique(self.y_test,  return_counts = True)

                            #### Categories in Testing Subset Must Exist In The Training Subset ####
                            if not NUM.in1d(uniq_y_test, uniq_y_tr).all():
                                flag = True
                                if timesSearch > maxTimesToTry:
                                    ARCPY.AddIDMessage("ERROR", 110205, self.yField.alias)
                                    raise SystemExit()


                        if not flag:
                            for id, field in enumerate(self.fields):
                                if field.rfType == categoricalVar:
                                    uniq_y_tr = NUM.unique(self.x_train.T[id])
                                    uniq_y_test = NUM.unique(self.x_test.T[id])
                                    if not NUM.in1d(uniq_y_test, uniq_y_tr).all():
                                        flag = True
                                        if timesSearch > maxTimesToTry:
                                            ARCPY.AddIDMessage("ERROR", 110205, field.alias)
                                            raise SystemExit()
                        if not flag:
                            if self.yField.rfType == categoricalVar:
                                uniq_y_tr = NUM.unique(self.y_train)
                                uniq_y_test = NUM.unique(self.y_test)
                                self.checkAllCategoriesUsed(uniq_y_tr, uniq_y_test )

            else:
                self.indices = NUM.arange(len(self.x), dtype = int)
                self.indicesTrain = NUM.ones(len(self.x), dtype = int)
                self.train_split_indices = self.indices
                self.test_split_indices = NUM.array([], dtype = float)
                self.x_train = self.x
                self.y_train = self.y
                self.x_test = NUM.array([], dtype = float)
                self.y_test = NUM.array([], dtype = float)

            self.y_test = NUM.asarray(self.y_test, dtype= float)
            self.y_train = NUM.asarray(self.y_train, dtype= float)

    def generateXVariable(self, dictOrder = None, fillVar = True, balance = False):
        """
        This method creates an array of  all variables
        """
        if fillVar:
            if dictOrder is None:
                if self.ssdo is not None:
                    self.N = len(self.ssdo.xyCoords)
                else:
                    #### All Fields Contain the Same Size ####
                    self.N = len(self.fields[0].data)

                self.x = NUM.empty((self.N, self.numXVariables), dtype=float)
                for i in NUM.arange(self.numXVariables):
                    self.x.T[i] = self.fields[i].data
            else:
                if self.ssdo is not None:
                    self.N = len(self.ssdo.xyCoords)
                else:
                    self.N = len(self.fields[0].data)
                self.x = NUM.empty((self.N, self.numXVariables), dtype=float)
                for i in NUM.arange(self.numXVariables):
                    self.x.T[i] = self.fields[dictOrder[i]].data

        self.splitDataForTesting(balance)

    def getIndexField(self, name):
        """
        This method returns the field index
        INPUT:
            name {str}: RF Name
        OUTPUT:
            index {int}
        """
        for ind, fieldName in enumerate(self.fields):
            if fieldName.name.upper() == name.upper():
                return ind

        return None

    def getVars(self):
        """
        This method generates the RF field type 1 -> Numeric 2->Categorical
        OUTPUT:
            indices {1D array, int32}: indices of all fields including Y field
        """

        fields = [2 if f.rfType == "Categorical" else 1 for f in self.fields]
        if  self.yField is  None:
            return NUM.array(fields, dtype = NUM.int32)
        else:
            if self.yField.rfType == "Numeric":
                fields.append(1)
            else:
                fields.append(2)
            return NUM.array(fields, dtype = NUM.int32)

    def getOperationsInRaster(self, listRasterName):
        """
        Get Operations from each raster field
        """
        dNameOpe = []
        for rasterName in listRasterName:
            for ind, field in enumerate(self.fields):
                if "RASTER"  in field.source and self.fieldName == rasterName:
                    typeOp = field.source.split("-")[1]
                    dNameOpe.append(self.typeOpe)
        return dNameOpe

    def getVariables(self):
        """
        This method returns the variables of a specific source type {FC, DIST, RASTER}
        The output  order changes depends the type due to UI parameter Issue(fields must be the first column in the
        Value table [['field','Field to predict'], ['GPString', "variable']], otherwise it does not apply filters
        OUTPUT:
            variablesNames {list str}
        """
        variables = []
        dictEv = {}
        for ind, field in enumerate(self.fields):
            varInfo = {"name":field.name, "alias":field.alias, "rfType":field.rfType,
                        "fieldType":field.fieldType, 
                        "source":field.source, 
                        "sourceData":None,
                        "index":field.index}
            variables.append([varInfo,{}])
            dictEv[field.name.upper()] = varInfo
        return variables, dictEv 


    def getVariablesList(self, sourceType, alias = False):
        """
        This method returns the variables of a specific source type {FC, DIST, RASTER}
        The output  order changes depends the type due to UI parameter Issue(fields must be the first column in the
        Value table [['field','Field to predict'], ['GPString', "variable']], otherwise it does not apply filters
        OUTPUT:
            variablesNames {list str}
        """
        variables = []
        if not alias:
            for ind, field in enumerate(self.fields):
                if field.source == sourceType:
                    if field.rfType == "Categorical":
                        variables.append([None, "{0}{1}".format(field.name, discrete)])
                    else:
                        variables.append([None, field.name])
            return variables
        else:
            for ind, field in enumerate(self.fields):
                if field.source == sourceType:
                    if field.rfType == "Categorical":
                        variables.append([None, "{0}{1}".format(field.alias, discrete)])
                    else:
                        variables.append([None, field.alias])
            return variables

    def saveMeta(self, parmDict):

        try:
            model =  NET.Dataset(self.outputFileName, "a")
            data = {i.name : i.toDict() for i in self.fields}
            model.PARAMETERS_INFO= JSON.dumps(parmDict)
            model.close()
        except:
            ARCPY.AddError("Cannot write info in model")
            raise SystemExit
        return 

    def getHeader(self):
        """
        This method returns the information of all fields in the instance of InfoForestField
        as string
        OUTPUT:
            header {str}: Information used in the model header
        """
        return "Header"


    def loadHeaderfromTextFile(self, inputFilename):
        """
        This method loads information from a text file into the InfoForestField instance
        INPUT:
            inputFilename {str}: inputFilename path
        """

        try:
            data = ""
            with open(inputFilename, 'r') as file:
                data = file.read()

            data_loaded = JSON.loads(data)
            self.fields= []
            self.numXVariables = 0
            self.yField = None
            for info in data_loaded:
                rf = RFField()

                if info == "properties":
                    self.properties = data_loaded[info]
                else:
                    rf.fromDict(data_loaded[info])

                if info == "YRandomForest":
                    self.yField= rf
                elif info != "properties" :
                    self.fields.append(rf)
                    self.numXVariables += 1
        except:
            ARCPY.AddError("Problem reading model")
            raise SystemExit

    def isBalanced(self, name, categories, counts, checkBalance = True):
        """
        Check if the Y variable is unbalance, throwing a message
        INPUT:
            name (str): field name
            categories (list): categories
            count (1D array): count
        """
        timesThreshold = 2

        n = len(categories)
        total = counts.sum()
        perc = 1/n
        values =  counts/total

        areHigh = values > perc*timesThreshold
        areLow = values < perc/timesThreshold

        highCategories = [ "{0} [{1}]".format(i, counts[id]) for id, i in enumerate(categories) if areHigh[id] ]
        lowCategories  = [ "{0} [{1}]".format(i, counts[id]) for id, i in enumerate(categories) if  areLow[id] ]

        if areLow.sum() > 0 or areHigh.sum() > 0:

            msgHig = ""
            if len(highCategories) > 0:
                highCategories = highCategories[0:len(highCategories)]
                msgHig += ", ".join(highCategories)
            else:
                msgHig = ""

            msgLow = ""
            if len(lowCategories) > 0:
                lowCategories = lowCategories[0:len(lowCategories)]
                msgLow += ", ".join(lowCategories)
            else:
                msgLow = ""

            msg= ""
            if msgHig != "" and msgLow != "":
                msg = ARCPY.GetIDMessage(220638)
                msg = msg.format(msgHig, msgLow)
            elif msgHig != "" and msgLow == "": 
                msg = ARCPY.GetIDMessage(220639) + msgHig
            elif msgHig == "" and msgLow != "":
                msg = ARCPY.GetIDMessage(220640) + msgLow

            ARCPY.AddIDMessage("WARNING", 110236, msg.strip())

            if checkBalance:
                self.applySparseMessage()


    def applySparseMessage(self, typeE = "WARNING"):
        """ Suggest Sparse Option 
        """
        if not self.sparseMessage:
            ARCPY.AddIDMessage(typeE, 110233)
            self.sparseMessage = True


    def defineYFromDataObject(self, name, userType, alias = None, ignoreValue = False,
                              checkBalance = True):
        """
        Use a field from a SSDO instance in RF as dependable Variable (Y)
        INPUT:
            name {str}: Field name
            userType {str}: RF Type  (Numeric/Categorical)
            alias {str}: Field alias name
            ignoreValue {boo}: avoid to include null value as a class
        """
        errors = None
        rf = RFField()
        rf.name = name
        rf.rfType = userType
        rf.fieldType = self.ssdo.fields[name].type
        rf.source = "FC"
        rf.info = ""

        if alias is not None:
            rf.alias = alias
        else:
            rf.alias = name

        dataY = self.ssdo.fields[name].data
        if userType == 'Categorical':
            data = NUM.ones(len(dataY), dtype= float)*NULL
            unique, counts = NUM.unique(dataY, return_counts = True)

            if not ignoreValue:
                idR = NUM.argwhere(unique != str(NULL))
                unique = unique[idR]

            for ind, ele in enumerate(unique):
                data[dataY == ele] = float(ind)

            rf.info = unique.ravel().tolist()
            rf.infoCount = counts
            errors = self.checkVariabilityCat(name, rf.info)
            self.y = data

            #### Generate a Unbalanced Dataset ####
            self.isBalanced(rf.alias,rf.info, rf.infoCount, checkBalance)

        else:
            self.y = NUM.asarray(dataY.copy(), dtype = float)
            errors = self.checkVariability(name, self.y)
        self.yField = rf
        return errors

    def defineYFromArray(self, name, userType, dataInfo, inputType, source,
                        alias = None, ignoreValue = False, checkBalance = True):
        """
        Use an Array Variable as  dependable Variable (Y)
        INPUT:
            name {str}: Field name
            userType {str}: RF Type  (Numeric/Categorical)
            dataInfo {array}: RF data
            alias {str}: Field alias name
            ignoreValue {boo}: avoid to include null value as a class
        """
        errors = None
        rf = RFField()
        rf.name = name
        rf.rfType = userType
        rf.fieldType = inputType
        rf.source = source
        rf.info = ""
        if alias is not None:
            rf.alias = alias
        else:
            rf.alias = name

        if userType == 'Categorical':
            data = dataInfo.copy()
            unique, counts = NUM.unique(data, return_counts = True)
            data = NUM.zeros(len(dataInfo), dtype = float)

            for ind, ele in enumerate(unique):
                data[dataInfo == ele] = float(ind)

            rf.info = unique.ravel().tolist()
            rf.infoCount = counts
            errors = self.checkVariabilityCat(name, rf.info)
            self.y = data

            #### Generate a Unbalanced Dataset ####
            self.isBalanced(rf.alias,rf.info, rf.infoCount, checkBalance)

        else:
            self.y = NUM.asarray(dataInfo.copy(), dtype = float)
            errors = self.checkVariability(name, rf.data)

        self.yField = rf
        return errors


    def addVariable(self, name, userType, dataType, source, dataSource, alias = None):
        rf = RFField()
        rf.name = name
        rf.rfType = userType
        rf.fieldType = dataType
        rf.source = source
        rf.dataSource = dataSource
        rf.info = ""

        if alias is not None:
            rf.alias = alias
        else:
            rf.alias = name

        for ele in self.fields:
            if ele.name == name:
                ARCPY.AddIDMessage("ERROR", 110182, name)
                raise SystemExit
        self.fields.append(rf)

    def updateData(self, name, data):
        """
        Update data of a RF Field
        """
        index = self.getIndexField(name)
        self.fields[index].data = data

    def updataDataCheck(self, name, data):

        index = self.getIndexField(name)
        self.fields[index].data = data

        if self.userType == 'Categorical':
            datafield = data
            unique = NUM.unique(self.dataField)
            toValues = NUM.arange(unique.size, dtype = NUM.float64)
            sortIdx = NUM.argsort(unique)
            idx = NUM.searchsorted(unique, self.dataField, sorter = sortIdx)
            data1 = toValues[sortIdx][idx]
            self.fields[index].info = unique.ravel().tolist()
            self.fields[index].data = data1
        else:
            self.fields[index].data = data1

    def checkVariability(self, name, values):
        errors = []
        if self.isTraining:
            if '<U' in str(values.dtype):
                errors.append((110179, name, "E"))
            if len(values):
                if values.var() == 0:
                    errors.append((110180, name, "E"))
            if len(values) == 0:
                ARCPY.AddIDMessage("ERROR", 110170, name)
                raise SystemExit

            #### Check variability Threshold .95 Dataset Size ####
            uniq, counts = NUM.unique(values, return_counts = True)

            maxCat = counts.max()
            nLimit = len(values) * 0.95
            if maxCat > nLimit:
                errors.append((110180, name, "E"))

        return errors

    def checkVariabilityCat(self, name, values):
        errors = []
        if self.isTraining:
            if len(values) == 1:
                errors.append((110181, name, "E"))
            n = len(values)
            if n > MaxCategoriesAllowed:
                errors.append((110192, name, "E"))

            if n > predictivePowerVariableSize:
                errors.append((110214, name, "W"))

            if len(values) == 0:
                ARCPY.AddIDMessage("ERROR", 110170, name)
                raise SystemExit

        return errors

    def addXVariableFromDataObject(self, name, userType, source, alias = None):
        """
        Add an field from a SSDO instance in the RF field
        INPUT:
            name {str}: Field name
            userType {str}: RF Type  (Numeric/Categorical)
            source {str}: "FC", "DIST", "RASTER"
            alias {str}: Field alias name
        """

        errors = None
        rf = RFField()
        rf.name = name
        if userType not in userTypeType:
            ARCPY.AddIDMessage("ERROR", 110178)
            raise SystemExit

        rf.rfType = userType

        rf.fieldType = self.ssdo.fields[name].type
        rf.source = source
        rf.info = ""

        if alias is not None:
            rf.alias = alias
        else:
            rf.alias = name

        for ele in self.fields:
            if ele.name == name:
                ARCPY.AddIDMessage("ERROR", 110182, name)
                raise SystemExit

        if userType == 'Categorical':
            dataField = self.ssdo.fields[name].data
            unique = NUM.unique(dataField)
            toValues = NUM.arange(unique.size, dtype = NUM.float64)
            sortIdx = NUM.argsort(unique)
            idx = NUM.searchsorted(unique, dataField, sorter = sortIdx)
            data = toValues[sortIdx][idx]

            rf.info = unique.ravel().tolist()
            errors = self.checkVariabilityCat(name, rf.info)
            rf.data = data
        else:
            rf.data = self.ssdo.fields[name].data
            errors = self.checkVariability(name, rf.data)

        if name == "PREDICTED":
            rf.name = "PREDICTED_"

        self.fields.append(rf)
        self.numXVariables += 1
        return errors

    def addXVariableFromArray(self, name, userType, dataInfo, source, inputType, alias = None, maskedOut = None, unit = None):
        """
        Add an array as RF field
        dataInfo size depends of source..  
        if dataInfo includes bad records then masked should be None 
           then dataInfo will be filtered by bad records from SSDO
        if dataInfo does not include bad records then its size should be
           (size-> len(dataInfo)+ len(ssdo.badRecords) + len(maskedOut) == size original FC)
           method verified the real size
           
        INPUT:
            name {str}: Field name
            userType {str}: RF Type  (Numeric/Categorical)
            dataInfo: {array}: Numpy array 1D
            source {str}: "FC", "DIST", "RASTER"
            inputType {str}: Type field similar that feature class field type 'Double, Interger, String, SmallInteger, Single'
            alias {str}: Field alias name
        """
        errors = None
        rf = RFField()
        rf.name = name
        rf.rfType = userType
        rf.fieldType = inputType
        rf.source = source
        rf.info = ""
        rf.unit = unit

        if alias is not None:
            rf.alias = alias
        else:
            rf.alias = name

        for ele in self.fields:
            if ele.name == name:
                ARCPY.AddIDMessage("ERROR", 110182, name)
                raise SystemExit

        if userType == 'Categorical':
            data = dataInfo.copy()
            unique = NUM.unique(dataInfo)
            data = NUM.zeros(len(dataInfo), dtype = float)

            for ind, ele in enumerate(unique):
                data[dataInfo == ele] = float(ind)

            rf.info = unique.ravel().tolist()
            errors = self.checkVariabilityCat(name, rf.info)
            rf.data = data
        else:
            rf.data =  dataInfo
            errors = self.checkVariability(name, rf.data)

        if self.ssdo is not None:
            nBadRec = len(self.ssdo.badRecords)

            if nBadRec > 0:
                total = nBadRec + self.ssdo.numObs

                if maskedOut is not None:
                    dataInfoLen = len(dataInfo) + len(maskedOut) + nBadRec
                    if dataInfoLen != total:
                        ARCPY.AddIDMessage("ERROR",110193, name)
                        raise SystemExit
        self.fields.append(rf)
        self.numXVariables += 1
        return errors

    def getIndicesBadRecords(self, ssdo = None):
        """
        Get Original Indices of bad records 
        """
        self.masterIndexFC = {}
        if self.ssdo is not None:
            if len(self.ssdo.badRecords):
                ssdo = self.ssdo
                masterIndex = list(ssdo.master2Order.keys())
                masterIndex.extend(ssdo.badRecords)
                masterIndex = sorted(masterIndex)
                if self.ssdo.hasOID64:
                    masterIndex = NUM.array(masterIndex, dtype = NUM.int64)
                else:
                    masterIndex = NUM.array(masterIndex, dtype = int)
                self.masterIndexFC = {i:id for id, i in enumerate(masterIndex)}

def getTypeFromDescribe(desc, dictVar):
    typeF = {}
    for idF in desc.fields:
        if idF.name in dictVar:
            typeF[idF.name.upper()] = idF.type
    return typeF

def getName(desc, dictVar):
    typeF = {}
    for idF in desc.fields:
        if idF.name.upper() in dictVar:
            typeF[idF.name.upper()] = idF.type
    return typeF


def compareForestInfo(training: InfoForestField, test: InfoForestField, dictFields: dict, updateTestT = True, balance = False):
    """
    Check if the categories of the trained dataset corresponds with the test dataset
    - Number of fields
    - Type
    - New Categories in the Test dataset are not allowed
    - Remap categories of Test dataset using trainind dataset
    - Generate X variable of Test Dataset
    INPUT:
        training {InfoForestField}: Training RF field
        test: {InfoForestField}: Test RF field
        dictFields {dict}: Match fields from Test and Training
    OUTPUT:
        str/None: If it returns a str as Error, None successfully
    """

    if training.numXVariables != test.numXVariables:
        return "Different number of variables"
    #dictFields fieldTest :fieldTrain
    testedChanged = False
    namesTrained = [ f.name for f in training.fields]
    dictFieldsTestTrain = {dictFields[i]:i  for i in dictFields }
    dictOrder = {}

    for nameTra in dictFields:
        name = dictFields[nameTra]
        id = training.getIndexField(nameTra.upper())
        idt = test.getIndexField(name.upper())
        dictOrder[idt] = id
        if  dictFields[nameTra] in namesTrained  or dictFieldsTestTrain[name] in namesTrained  and id is not None:

            if training.fields[id].fieldType.upper() != test.fields[idt].fieldType.upper():
                ARCPY.AddIDMessage("ERROR", 110194, training.fields[id].name + "("+ training.fields[id].fieldType+ ")",
                                   test.fields[idt].name + "("+test.fields[idt].fieldType+")")
                return "error"
            if training.fields[id].rfType != test.fields[idt].rfType:
                ARCPY.AddIDMessage("ERROR", 110194, training.fields[id].name + "("+ training.fields[id].rfType+ ")",
                                   test.fields[idt].name + "("+test.fields[idt].rfType+")")
                return "error"
            else:
                if training.fields[id].rfType == 'Categorical':
                    if not NUM.array_equal(training.fields[id].info, test.fields[idt].info):
                        testDict ={ row : id for id, row in enumerate(test.fields[idt].info) }
                        trainingDict={ row : id for id, row in enumerate(training.fields[id].info) }
                        for ele in testDict:
                            if not ele in  trainingDict:
                                ARCPY.AddIDMessage("ERROR", 110195, name)
                                return "error"
                        data = test.fields[idt].data
                        for ele in testDict:
                            tid = testDict[ele]
                            trid = trainingDict[ele]
                            data[data == tid] = -trid
                            testedChanged = True
                        data= data *-1
                        test.fields[idt].data = data
    if updateTestT:
        test.generateXVariable(dictOrder, balance = balance)

    if test.x.shape[0] == 0:
        return "Empty X's variables"

    test.y = NUM.zeros(test.x.shape[0], dtype = float)
    return None

def getNearFeature(inputFC, distancesFC, unit):
    """
    Get Near Feature Distances

    """
    ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84822), 0, len(distancesFC), 1)
    listArray = []

    outputTable = UTILS.returnScratchName("DIST_RF_", fileType = "TABLE", 
                                        scratchWS = ARCPY.env.scratchGDB)
    
    for pos, fc in enumerate(distancesFC):

        ARCPY.GenerateNearTable_analysis(inputFC, fc, outputTable +str(pos),
                                     None, "NO_LOCATION", "NO_ANGLE", "CLOSEST", 0, "PLANAR", unit)

        ssdoTable = SSDO.table2RecArray(outputTable + str(pos),["NEAR_DIST"])
        listArray.append(ssdoTable["NEAR_DIST"].copy())
        neg = ssdoTable["NEAR_DIST"] == -1

        if NUM.sum(neg) > 0:
            ARCPY.AddIDMessage("Warning", 110169, distancesFC)

        UTILS.passiveDelete(outputTable +str(pos))

        ARCPY.SetProgressorPosition(pos)

    return listArray

def extractFeatureFromRaster(ssdo, rasters, names, typeVariables, newFC = None, typeSampling = "Tool", useCopy = True):
    """
     This Method Extract values from multiple raster datasets
     INPUT:
        ssdo {SSDataObject}: data Object form inputFC
        rasters {list str}: List raster paths
        names {list str}: List names
        operation {list str}: AVG, MAJORITY, ETC
        model {InfoForestField obj}
        newFC {str} path feature class
     OUTPUT:
        data, IdsSelected, null {ndarray NxR} Data array where N->ssdo.numObs and R number of raster datasets
    """

    data = None

    if typeSampling == "Tool" or ssdo.shapeType  == "Polygon":
        data = getRasterDataUsingSA(ssdo, rasters, typeVariables, newFC, useCopy)
    else:
        data = getRasterDataUsingNP(ssdo, rasters, names,  typeVariables, newFC, useCopy)

    if data[2] is not None:
        if len(data[2]):
            #### Check Whether the Number of Features is Appropriate ####
            ERROR.reportBadRecords(ssdo.numObs,len(data[2]) , [str(i) for i in data[2]], label = ssdo.oidName + " Null Values in Raster",
                                           explicitBadRecordID = None)

    return data

def getOperationType(shapeType, typeO):
    """
    Select Operation depending on shape Type and RF Field type (CNT-DSC)
    """
    if shapeType == "Polygon":
        if typeO == numericVar:
            return "MEAN"
        else:
            return "MAJORITY"
    else:
        if typeO == numericVar:
            return "BILINEAR"
        else:
            return "NEAREST"

def checkLicense():
    """
    Check License Spatial Analysis
    """
    prod = ARCPY.ProductInfo()
    extension  = ARCPY.CheckExtension("Spatial")

    if extension == "Available":
        if prod != "ArcServer":
            lic = ARCPY.CheckOutExtension("Spatial")
            if lic != 'CheckedOut':
                ARCPY.AddIDMessage("ERROR", 110188)
                raise SystemExit
    else:
        ARCPY.AddIDMessage("ERROR", 110188)
        raise SystemExit

def getRasterDataUsingSA(ssdo, rasters, typeVariables, newFC, useCopy):
    """
    Get Raster Data using Zonation Tool
    INPUT:
        ssdo {SSDataObject}: ssdo instance
        rasters {list rasters}:  list of rasters
        typeVariables {list str}: List to get the operation of current variable MEAN, MAJORITY
        newFC {str}: Path feature Class
        useCopy {bool}: Define type of oidField Name to be used
    """

    #### Check License SA ####
    checkLicense()
    if useCopy:
        oidName = "IDS"
        tempOidName = oidName
    else:
        oidName = ssdo.oidName
        tempOidName = oidName
        if oidName == "OBJECTID":
            tempOidName = "OBJECTID_1"

    featureClassPath = newFC
    shapeType = ssdo.shapeType

    masterIndex = []
    masterIndex = list(ssdo.master2Order.keys())
    if ssdo.hasOID64:
        masterIndex = NUM.array(masterIndex, dtype = NUM.int64)
    else:
        masterIndex = NUM.array(masterIndex, dtype = int)


    msg = ARCPY.GetIDMessage(84823)
    msg = tryMsg(msg, "","")
    ARCPY.SetProgressor("default",  msg, 0, len(rasters), 1)

    rasterBadIds = []
    masterIdsBadRecordFromRasters = []
    opr = []

    data = NUM.ones ((ssdo.numObs, len(rasters)), dtype= float) * NUM.nan 
    bad=[]

    for id, raster in enumerate(rasters):
        op =  getOperationType(shapeType, typeVariables[id]).replace(" ", "_")
        opr.append(op)
        outputTable = UTILS.returnScratchName("EXTR_RF_",fileType = "TABLE",
                                                scratchWS = ARCPY.env.scratchGDB)
        inRaster = None
        if type(raster) == str:
            inRaster = ARCPY.sa.Raster(raster)
        else:
            inRaster = ARCPY.sa.Raster(raster.value)
        
        if inRaster.bandNames is None and inRaster.bandCount == 1:
            bandName = inRaster.name
        else:
            bandName = str(NUM.unique([name.split("_")[0] for name in  inRaster.bandNames])[0])


        if inRaster.catalogPath is not None and (inRaster.catalogPath.upper().startswith("HTTP:") or inRaster.catalogPath.upper().startswith("HTTPS:")):
            del inRaster
            ARCPY.AddIDMessage("ERROR", 110213)
            raise SystemExit

        array = None
        oidNameField = oidName.upper()
        nameDataField = op.upper()
        tempOidNameField  = tempOidName.upper()

        if shapeType == "Polygon":

            if inRaster.pixelType in ['F64', 'F32'] and op == "MAJORITY":
                ARCPY.AddIDMessage("ERROR", 110212, inRaster.name)
                del inRaster
                raise SystemExit

            if not UTILS.isGDB(raster) and  inRaster.pixelType in ['UNKNOWN']:
                ARCPY.AddIDMessage("ERROR", 10160, inRaster.name)
                del inRaster
                raise SystemExit

            #### Check Join Field ####
            if "." in tempOidNameField:
                tableName, tempOidNameField = tempOidNameField.split('.')

            #### Check OBJECTID Name ####
            if tempOidNameField == "OBJECTID":
                tempOidNameField ="OBJECTID_1"

            ASA.ZonalStatisticsAsTable(featureClassPath, oidName, inRaster, outputTable+str(id), 'DATA', op)
            if inRaster.name is not None:
                nameRaster = getNameRaster(inRaster.name.upper())
            else:
                nameRaster = getNameRaster(str(inRaster).upper())

            array = SSDO.table2RecArray(outputTable+str(id),[tempOidNameField, op])

            #### Delete table ####
            UTILS.passiveDelete(outputTable+str(id))

        if shapeType == "Point":

            if not UTILS.isGDB(raster) and  inRaster.pixelType in ['UNKNOWN']:
                ARCPY.AddIDMessage("ERROR", 10160, inRaster.name)
                del inRaster
                raise SystemExit

            try:
                ASA.Sample(in_rasters = inRaster,
                            in_location_data = featureClassPath,
                            out_table = outputTable,
                            resampling_type = op,
                            unique_id_field = oidName,
                            process_as_multidimensional = "CURRENT_SLICE")
            except:
                if ssdo.hasOID64:
                    ARCPY.AddIDMessage("ERROR", 161002)
                    raise SystemExit

            outPath, outName = OS.path.split(featureClassPath)
            nameRaster = getNameRaster(inRaster.name.upper())
            fieldsNam = getNameRasterFromBands([inRaster])
            desc = None

            try:
                desc = ARCPY.Describe(outputTable)
            except:
                pass

            fields  = [field.name for field  in desc.fields  if bandName in field.name ]
            fieldName = fields[0]

            #### Searching Name When Raster Is Contained in a Group ####
            outNameL = [field.name for field  in desc.fields  if outName in field.name ]
            outName = outNameL[0]

            array = SSDO.table2RecArray(inputTable = outputTable,
                                        fieldNames = [outName.upper(), fieldName.upper().replace(" ", "_")],
                                        silentWarnings = True,
                                        includeNulls = False)
            tempOidNameField = outName.upper()
            oidNameField = outName.upper()
            nameDataField = fieldName.upper().replace(" ", "_")
            #### Delete table ####
            UTILS.passiveDelete(outputTable)

        ids = None
        sortId = None
        values = None
        typeInt = int

        if ssdo.hasOID64:
            typeInt = NUM.int64

        if useCopy:
            sortId = NUM.argsort(array[oidNameField])
            ids = NUM.asarray(array[oidNameField][sortId], dtype = typeInt)
        else:
            dtInfo = NUM.asarray(array[tempOidNameField], dtype = typeInt)
            sortId = NUM.argsort(dtInfo)
            ids = dtInfo[sortId]
            ids = NUM.asarray([ssdo.master2Order[i] for i in ids], dtype = int)

        values = array[nameDataField][sortId]
        data.T[id][ids] = values
        bad = NUM.where(NUM.isnan(data.T[id]))[0]

        if len(bad)> 0:
            rasterBadIds = NUM.union1d(rasterBadIds, bad)

        if len(data) == len(bad):
            del inRaster
            ARCPY.AddIDMessage("ERROR", 110170, nameDataField)
            raise SystemExit 

        try:
            del inRaster
        except:
            pass
        ARCPY.SetProgressorPosition(id)

    if len(rasterBadIds):
        rasterBadIds = NUM.asarray(rasterBadIds, dtype= int)
        masterIdsBadRecordFromRasters = masterIndex[rasterBadIds]
        goodData = NUM.arange(len(masterIndex))
        goodData[rasterBadIds] = -1
        goodData = NUM.where(goodData != -1)[0]
        indices = goodData
        data = data[goodData,:]
    else:
        index = NUM.arange(ssdo.numObs , dtype = int)
        indices = index

    return data, indices, masterIdsBadRecordFromRasters, opr

def getRasterDataUsingNP(ssdo, rasters, names, typeVariables, newFC, useCopy):
    """
    Get Raster Data using Zonation Tool
    INPUT:
        ssdo {SSDataObject}: ssdo instance
        rasters {list rasters path}:  list of rasters
        names {list str}: list raster names
        operations {list str}: operations MEAN, MAJORITY
    """

    #### Check License SA ####
    checkLicense()

    if useCopy:
        oidName = "IDS"
    else:
        oidName = ssdo.oidName

    featureClassPath = newFC
    shapeType = ssdo.shapeType
    masterIndex = []

    if ssdo.hasOID64:
        masterIndex = list(ssdo.master2Order.keys())
        masterIndex = NUM.array(masterIndex, dtype = NUM.int64)
    else:
        masterIndex = list(ssdo.master2Order.keys())
        masterIndex = NUM.array(masterIndex, dtype = int)

    centroids = ssdo.xyCoords

    rasterBadIds = []
    masterIdsBadRecordFromRasters = []
    opr = []

    data = NUM.ones ((ssdo.numObs, len(rasters)), dtype= float) * NUM.nan 
    bad=[]

    if ssdo.hasOID64:
        ids = NUM.array(list(ssdo.master2Order.values()), dtype = NUM.int64)
    else:
        ids = NUM.array(list(ssdo.master2Order.values()), dtype = int)

    for id, raster in enumerate(rasters):
        op =  getOperationType(shapeType, typeVariables[id])
        opr.append(op)

    typeRF = [i == numericVar for i in typeVariables]

    infoRaster = RasterInfo(rasters, typeRF, printInfo = False, rasterNames = names, maxSize = MEMSIZE*2)

    dataValues, mask = infoRaster.extractDataUsingPoints(ssdo)

    del infoRaster

    badIndex = NUM.logical_not(NUM.in1d(ids, mask))
    badMasterIds = masterIndex[badIndex]

    indices = ids
    if len(ssdo.xyCoords) == len(badMasterIds):
        ARCPY.AddIDMessage("ERROR", 110170, ",".join(names))
        raise SystemExit 

    return dataValues, mask, badMasterIds, opr

def getNameRaster(name):
    for i in listExtensions:
        if i in name:
            return name.replace(i, "")
    return name

def applyMaskFromRaster(RFField: InfoForestField, maskIds = None, allIndices = None):
    """
    Resize data if there is maskIds(raster mask ids), and  it updates the RFField Object
    INPUT:
        RFField {InfoForestField}: forest Object
        maskIds {array}: Arrays should be removed
        allIndices {array}: Arrays to use (ignore  mask Ids)
    """

    RFField.filterApplied = False 

    if RFField.ssdo is None:
        return
    if maskIds is None and allIndices is None:
        return 
    N = RFField.ssdo.numObs

    if allIndices is not None:
        if len(allIndices) == 0:
            return

    #### Don't apply if all indices are included ####
    if allIndices is not None:
        if N == len(allIndices):
            return

    if allIndices is None:
        allIndices = NUM.arange(N)
        masked = NUM.setdiff1d(allIndices, maskIds)
    else:
        masked = allIndices ##  [ RFField.ssdo.master2Order[i] for i in allIndices]

    #### ReShape SSDO ####
    if hasattr(RFField.ssdo, "shapes"):
        RFField.ssdo.shapes  = NUM.array(RFField.ssdo.shapes)[masked].tolist()
    RFField.ssdo.numObs = len(masked)
    RFField.ssdo.xyCoords = RFField.ssdo.xyCoords[masked,:]
    orderIds = NUM.arange(len(RFField.ssdo.master2Order))
    newOrder = orderIds[masked]
    m2o ={ RFField.ssdo.order2Master[int(i)]:id for id, i in enumerate(newOrder)}
    RFField.ssdo.master2Order = m2o

    #### RFField.filteredRowsIds = maskIds
    if not RFField.filterApplied:
        for field in RFField.fields:
            if "RASTER" not in field.source:
                field.data = field.data[masked]
                RFField.filterApplied = True

        if RFField.yField is not None:
            RFField.y = RFField.y[masked]

            if RFField.yField.rfType == categoricalVar:
                nClass = len(RFField.yField.info)
                uniqueY, countY = NUM.unique(RFField.y, return_counts = True)
                uniqueY = NUM.asarray(uniqueY, dtype = int)

                if nClass != len(uniqueY):
                    dictClass = {ind:classInfo for ind, classInfo in enumerate(RFField.yField.info)}
                    listInfo = []

                    for newId, oldId in enumerate(uniqueY):
                        cl = dictClass[oldId]
                        listInfo.append(cl)
                        RFField.y[RFField.y == oldId] = newId

                    RFField.yField.info = listInfo
                RFField.yField.infoCount = countY


def getRasterData(rasters):
    """
    Get Information of a set raster datasets, extracting all values using rasterToNumpy
    INPUT:
        rasters {list}: list of rasters as strings
    OUTPUT:
        data {list}: list of ndarrays of each raster
        maskedTotal {array}: mask of all rasters
        shape {tuple}: (nRows, nCols)
    """
    listMasked = []
    dataValues = []
    nSize= 0
    shape = ()
    for id, r in enumerate(rasters):
        dataO = ARCPY.RasterToNumPyArray(r, nodata_to_value = -9999.99)
        if len(shape) == 3:
            dataO = dataO[0,:]
        data = dataO.ravel()
        dataValues.append(data)
        listToMask = NUM.where(data == -9999.99)
        listMasked.append(listToMask)
        if id == 0:
            nSize = len(data)
            shape = dataO.shape
        else:
            if nSize != len(data):
                ARCPY.AddError("Rasters should have the same size")
                raise SystemExit()

    ids = NUM.arange(nSize)
    maskedTotal = NUM.array([])

    for id, mask in enumerate(listMasked):
        maskedTotal = NUM.union1d(maskedTotal, mask)
    maskedTotal = NUM.setdiff1d(ids, maskedTotal)

    outputData = []
    for id, data in enumerate(dataValues):
        outputData.append(data[maskedTotal].copy())

    return data, maskedTotal, shape


def checkProjectionRasters(rasterList):
    """
    Get projection of list of raster paths
    """
    listProjectections = []
    for i in rasterList:
         d = ASA.Raster(i)
         spatialRef = d.spatialReference
         listProjectections.append(spatialRef.factoryCode)
         if "HTTP:" in d.catalogPath.upper() or  "HTTPS:" in d.catalogPath.upper():
            ARCPY.AddIDMessage("ERROR", 110213)
            raise SystemExit
         del d

    ids, counts = NUM.unique(NUM.array(listProjectections), return_counts = True)

    #### All Projections are equals ####
    if len(ids) == 1:
        return  False

    #### There are different projections ####  
    if len(ids) != len(listProjectections):
        return True

    return True


def getNameRasterFromBands(rasters, names = None, justNames = True):
    """
    Get Names used in Sample when the list of rasters contain band names,
    The function also extracts the bands used in each raster.

    """
    dictName = []
    namesValues = []
    pathRaster = []
    for id, raster in enumerate(rasters):
        name = None
        desc = ARCPY.Describe(raster)
        isRasterBand = desc.dataType == 'RasterBand'
        isNameBand = False

        if names is None:
            raster = str(raster)
            name = str(desc.name)
            path = desc.path
        else:
            name = names[id]
            path = str(raster)
            if isRasterBand:
                isRasterBand = False
                isNameBand = True

        if name.upper().startswith("BAND_") or name.upper().startswith("LAYER_") or isRasterBand:
            if  name.upper() in path.upper():
                path = path.upper().replace(name.upper(),"")
                if path[-1] == "\\":
                    path = path[:-1]
            descParent = ARCPY.Describe(path)

            if hasattr(descParent, "BandCount"):
                dictName.append(getNameRaster(descParent.name.upper()))
                namesValues.append(name)
                pathRaster.append(path)
            else:
                dictName.append(getNameRaster(name.upper()))
                namesValues.append("")
                pathRaster.append(raster)
        else:
            dictName.append(getNameRaster(name.upper()))

            if isNameBand:
                namesValues.append("RenamedBand")
            else:
                namesValues.append("")
            
            pathRaster.append(raster)

    namesRep = dictName
    unique, count = NUM.unique(dictName, return_counts = True)

    #### Dictionary Contain the Raster path and list order and bands ####
    valuesBands = {id:[] for id in NUM.unique(pathRaster)}
    
    values = {str(unique[id]):count[id] for id in NUM.arange(len(unique))}
    valuesIni = {str(unique[id]):1 for id in NUM.arange(len(unique))}

    #### Names used in Sample when Band are extracted ####
    newNames = []
    
    #### Rasters path / Band name ####
    orderRaster = []

    for id, name in enumerate(dictName):
        if values[name] == 1:
            newNames.append(name.upper().replace(" ", "_"))
            valuesBands[pathRaster[id]].append([id, namesValues[id]])
            orderRaster.append([pathRaster[id],namesValues[id] ])
        else:
            if valuesIni[name] <= values[name]:
                newNames.append((name + getNameId(valuesIni[name]-1)).upper())
                valuesIni[name] += 1
                valuesBands[pathRaster[id]].append([id, namesValues[id]])
                orderRaster.append([pathRaster[id],namesValues[id] ])
    
    if justNames:
        return newNames
    else:
        return newNames, valuesBands, orderRaster


def getNameId(id):
    """
    Get Extra Name for Sample
    """
    seq = ["", "_1","_12"]
    if id <= 2:
        return seq[id]
    else:
        base = seq[2]
        for i in NUM.arange(3, id+1, 1):
            base += "_1"+str(i)
        return base

def updateCellsizeAccordingSpatialRef(srf, value):
    if srf.type.upper() != "PROJECTED":
            if srf.type.upper() == "GEOGRAPHIC":
                if value > 45:
                    ARCPY.AddIDMessage("ERROR", 1775)
                    raise SystemExit
    else:
        return value

def getCentroids(extentList, cellSize, srf, outputFC = None, fc = None, outArea = False, getIdsCentroids = False, justIndex = 1):
    """
    Get Feature Class of points over the area of interest, if 
    fc is provided the function returns an array with fc IDs
    INPUT:
        extentList {list(Extend values)}
        cellSize {float}: cell size to be applied
        srf {Spatial Reference Object}: Spatial Reference
        outputFC {str}: Feature Class output
        fc {str}: Mask Feature class Feature Class
        outArea {Bool}: out area works together  fc and ouputFC-- 
                        true -> get a fc of points over polygon mask
                        false -> get all points over extent
    """

    cols = int(NUM.ceil((extentList[2] - extentList[0]) / cellSize))
    rows = int(NUM.ceil((extentList[3] - extentList[1]) / cellSize))
    halfCell = cellSize /2

    #### Verify Size Raster ####
    diff =  ((extentList[0] + halfCell) + cols * cellSize) - extentList[2]
    part = diff/halfCell

    if not NUM.allclose(part, 1):
        cols = cols - 1

    diff  = ((extentList[3] - halfCell) - rows* cellSize) - extentList[1]
    part = diff/halfCell
    if not NUM.allclose(part, 1):
        rows = rows - 1

    sizeNumber = cols * rows
    centroids  = None
    polygonMask = ids = None

    #### Check maximum allowed size ####
    IsMaximumAllowed = sizeNumber > 2*maxSizeCells 
    if fc is not None:
        desc = ARCPY.Describe(fc)
        if desc.shapeType.upper() == "POLYGON":
            aoiPolygon = desc.extent.polygon.projectAs(srf)
            rastersIntersection = ARCPY.Extent(extentList[0],extentList[1],extentList[2],extentList[3], spatial_reference = srf)
            polygonIntersection = rastersIntersection.polygon
            newExtentAOI = polygonIntersection.intersect(aoiPolygon, 4)

            if newExtentAOI.area > 0:
                aoiCols = newExtentAOI.extent.width/ cellSize
                aoiRows = newExtentAOI.extent.height/ cellSize
                sizeNumberAOI =  aoiCols*aoiRows
                #### The number of cells cannot exceed the threshold ####
                if sizeNumberAOI > 2*maxSizeCells:
                    ARCPY.AddIDMessage("ERROR", 110243)
                    raise SystemExit()

    if fc is not None:
        #### Define Cube For Simulating a Raster Area ####
        cubeInfo = ARC._ss.CubeInfo(rows, cols, 1, cellSize, use_hexagons = False)

        #### Get IDs of Polygons in the Current SRF-Extent ####
        polygonMask, ids  = cubeInfo.get_polygon_ids_mask(fc, extentList[0], extentList[3], srf, just_index = justIndex)

        polygonMaskSort = NUM.argsort(polygonMask)
        polygonMask = polygonMask[polygonMaskSort]
        ids = ids[polygonMaskSort]
        return cols*rows , polygonMask, ids, cols, rows, centroids, srf
    else:
        centroids = [0, cols*rows-1]
        return cols*rows , polygonMask, ids, cols, rows, centroids, srf

    #### Just Return Centroids Data ####
    if outputFC is None:
        return NUM.arange(len(centroids)), polygonMask, ids, cols, rows, centroids, srf

    ### It is generated a FC with centroids ####
    if outputFC is not None and not getIdsCentroids:
        dataObject = None
        dataObject = UTILS.DataContainer(srf)
        if not outArea:
            dataObject.renderType = "POINT"
            dataObject.requireGeometry = False
            dataObject.xyCoords = centroids
            dataObject.numObs = len(centroids)
            idvalues = NUM.arange(dataObject.numObs)
            field = SSDO.CandidateField(name = "IDS",
                                        type = "LONG",
                                        data = idvalues)
            fields = [field]

            #### Create Point Feature Class ####
            ARC._ss.output_featureclass_from_dataobject(dataObject, outputFC, fields)

            return idvalues, polygonMask, ids, cols, rows, centroids, srf
        else:
            dataObject.renderType = "POINT"
            dataObject.requireGeometry = False
            dataObject.xyCoords = centroids[polygonMask,:]
            dataObject.numObs = len(dataObject.xyCoords)
            idvalues = NUM.arange(dataObject.numObs)
            field = SSDO.CandidateField(name = "IDS",
                                        type = "LONG",
                                        data = idvalues)
            fields = [field]

            #### Create Point Feature Class ####
            ARC._ss.output_featureclass_from_dataobject(dataObject, outputFC, fields)

            return idvalues, polygonMask, ids, cols, rows, centroids, srf

def createRaster(data, sf, minX, minY, cellXSize, cellYSize, outputRaster):
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

def reMapCategories(categories, typeField, dataInput):
    """
    This function remap values from  categories which can be Int,Long, Double, String..
    INPUT:
        categories {list}: All categories of this field
        typeField {str}: type of field from original dataset must match UTILS.numpyConvert
        
        dataInput {array /Double}: input array
    OUTPUT:
        data {array}
    """

    dictClasses = { id:value for id, value in enumerate(categories)}
    typeNumpyField = UTILS.numpyConvert[typeField]
    #### Calculate the maximum string size
    if typeNumpyField =='U%i':
        size = max(map(len, categories))
        typeNumpyField = 'U'+str(size)
    data = NUM.zeros(len(dataInput), dtype = typeNumpyField)

    #### Introduce Predicted values in the output data array
    for i in NUM.arange(len(categories)):
        data[dataInput == i ] = dictClasses[i]
    return data

def UpdataRFFields(rfTest):

    for id, fieldData in enumerate(rfTest.fields):
        dataN = rfTest.x.T[id]
        if fieldData.rfType == "Categorical":
            fieldData.data  = reMapCategories(fieldData.info, fieldData.fieldType, dataN)
        else:
            fieldData.data = dataN.copy()

def statConfusionMatrix(className, matrix):
    """
    Calculate Confusion Matrix Values

    """
    matrix = matrix.T
    tp = matrix[0,0]
    fp = matrix[0,1]
    fn = matrix[1,0]
    tn = matrix[1,1]
    p = tp + fp
    n = fn + tn
    den1  = (2*tp + (fp + fn))

    if den1 > 0:
        f1 = 2*tp / den1
    else:
        f1  = -1
    den = -1

    try:
        value = (tp+fp)*(tp+fn)*(tn+fp)*(tn+fn)
        den = NUM.sqrt(value)
    except:
        pass

    if den > 0:
        mcc = (tp*tn - (fp * fn) ) / den
    else:
        mcc = -1

    acc = (tp + tn )/(p + n)
    sen = -1

    try:
        if (tp + fn) > 0:
            sen = tp / (tp + fn)
        else:
            sen = -1
    except:
        pass

    return f1, mcc, sen, acc

def statisticsForClassification(rfField, trueData, predData, isTesting = True, hpar = None):
    """
    This method generates a string table of the classification statistics

    """

    msgCat = ARCPY.GetIDMessage(84825)

    msgF1 =  ARCPY.GetIDMessage(84833)
    msgMCC = ARCPY.GetIDMessage(84832)
    msgAcc = ARCPY.GetIDMessage(84827)
    msgSen = ARCPY.GetIDMessage(84843)
    msgHeader = None
    mess = None

    #### Change Messages Depending on Data ####
    if isTesting:
        msgHeader = ARCPY.GetIDMessage(84828)
        mess = ARCPY.GetIDMessage(84830)
    else:
        msgHeader = ARCPY.GetIDMessage(84838)
        mess = ARCPY.GetIDMessage(84840)

    if hpar is not None:
        if hasattr(hpar, "outputConfusion"):
            #### Check Path Output Confusion Matrix Test Data ####
            if hpar.outputConfusion not in ["", None]:
                idClass = {name:id for id, name in enumerate(rfField.yField.info)}
                nTru = len(idClass)

                #### Matrix Confusion Matrix ####
                completeConfMat = NUM.zeros((nTru,nTru), dtype = NUM.int32)

                #### Accumulate Values in Confusion Matrix ####
                for index  in NUM.arange(len(trueData)):
                    trInd = idClass[trueData[index]]
                    teInd = idClass[predData[index]]
                    completeConfMat[trInd, teInd] += 1
                namesCat = ["CAT_" + str(i) for i in idClass]
                arrayNames = NUM.array(namesCat)

                #### Column Categories ####
                fieldIni = SSDO.CandidateField(name = "CATEGORY", type = "TEXT", data = arrayNames)
                fields = [fieldIni]

                maxlen = 63
                #### Check if the path is a SDE or Geodatabase ####
                if UTILS.isSDEOrGeodatabase(hpar.outputConfusion):
                    maxlen = 31

                #### Create Column For Each Category ####
                for id, cat in enumerate(namesCat):
                    field = SSDO.CandidateField(name = cat, alias = cat.replace("CAT_",""), type = "LONG", data = completeConfMat.T[id])
                    if len(field.name) > maxlen:
                        field.name = field.name[:maxlen]    

                    fields.append(field)

                #### Use Data Container To create Output Table ####
                dataC = UTILS.DataContainer(None)
                fields = UTILS.checkCandidateFieldName(fields, hpar.outputConfusion)

                UTILS.adjustCandidateFieldLengthByArrayDtype(fields)

                dataC.generateOutput(hpar.outputConfusion, fields)

                try:
                    desc = ARCPY.Describe(hpar.outputConfusion)

                    if desc is not None:
                        namesCat = [f.name for f in desc.fields if f.name != "CATEGORY" and f.type != "OID"]

                    chart = ARCPY.charts.Bar(x="CATEGORY", y=namesCat, aggregation="sum")
                    chart.yAxis.title  = ARCPY.GetIDMessage(84785)
                    chart.xAxis.title  = ARCPY.GetIDMessage(220675)
                    chart.title = ARCPY.GetIDMessage(220674)
                    chart.legend.title = ARCPY.GetIDMessage(220680)
                    chart.multiSeriesDisplay = "stacked100"
                    hpar.outputConfusionParameter.charts = [chart]
                except:
                    pass

    trIds = NUM.unique(trueData)
    teIds = NUM.unique(predData)
    ids = NUM.intersect1d(trIds, teIds)
    n = len(ids)
    idClass = {name:id for id, name in enumerate(rfField.yField.info)}
    listTable = []
    header = msgHeader
    headTable = [ msgCat, msgF1, msgMCC, msgSen, msgAcc]
    listTable.append(headTable)
    listConMat =[]
    for className  in idClass:
        confMatrix = NUM.zeros((2,2), dtype = float)
        tClass = (trueData != className) * 1
        pClass = (predData != className) * 1

        for i in NUM.arange(len(tClass)):
            confMatrix[tClass[i],pClass[i]] += 1

        f1, mcc, sen, acc = statConfusionMatrix(className, confMatrix)
        listConMat.append([idClass[className], f1, mcc, sen, acc])
        row = [className, 
            LOCALE.format_string("%0.2f", f1) if f1 != -1 else "NA", 
            LOCALE.format_string("%0.2f", mcc) if ~NUM.isnan(mcc) and mcc != -1 else "NA",
            LOCALE.format_string("%0.2f", sen) if sen != -1 else "NA",
            LOCALE.format_string("%0.2f", acc)]

        listTable.append(row)

    try:
        fScoreAll = F1ScoreFunction(trueData, predData)
        mccAll = MCCFunction(trueData, predData)
        accuracy = (trueData == predData).sum() / len(trueData)
        row = ["All", 
               LOCALE.format_string("%0.2f", fScoreAll) if fScoreAll != -1 else "NA", 
               LOCALE.format_string("%0.2f", mccAll) if ~NUM.isnan(mccAll) and mccAll != -1 else "NA",
               "NA",
               LOCALE.format_string("%0.2f", accuracy)]
        listConMat.append([-999999, fScoreAll,mccAll , 0, accuracy])
        listTable.append(row)
    except:
        pass

    outputReport = UTILS.outputTextTable(listTable, header = header,
                                         justify = ["left", "right", "right", "right", "right"], pad = 1, colPad = 3,
                                         titleFillToken = "-", footnote=[mess], force2Txt=False)
    return outputReport ,  listConMat

def statisticsForClassificationByModel(rfField, statData, isTesting = True, hpar = None):
    """
    This method generates a string table of the classification statistics from model data

    """

    msgCat = ARCPY.GetIDMessage(84825)

    msgF1 =  ARCPY.GetIDMessage(84833)
    msgMCC = ARCPY.GetIDMessage(84832)
    msgAcc = ARCPY.GetIDMessage(84827)
    msgSen = ARCPY.GetIDMessage(84843)
    msgHeader = None
    mess = None

    #### Change Messages Depending on Data ####
    if isTesting:
        msgHeader = ARCPY.GetIDMessage(84828)
        mess = ARCPY.GetIDMessage(84830)
    else:
        msgHeader = ARCPY.GetIDMessage(84838)
        mess = ARCPY.GetIDMessage(84840)

    lids = list(statData.T[0])

    idClass = {name:id for id, name in enumerate(rfField.yField.info) if id in lids}
    listTable = []
    header = msgHeader
    headTable = [ msgCat, msgF1, msgMCC, msgSen, msgAcc]
    listTable.append(headTable)

    for id, className  in enumerate(idClass):
        idV, f1, mcc, sen, acc = statData[id]
        row = [className, 
            LOCALE.format_string("%0.2f", f1) if f1 != -1 else "NA", 
            LOCALE.format_string("%0.2f", mcc) if mcc != -1 else "NA",
            LOCALE.format_string("%0.2f", sen) if sen != -1 else "NA",
            LOCALE.format_string("%0.2f", acc)]

        listTable.append(row)

    try:
        if -999999.0 in lids:
            id = lids.index(-999999.0)
            idV, f1, mcc, sen, acc = statData[int(id)]
            row = ["All", 
                LOCALE.format_string("%0.2f", f1) if f1 != -1 else "NA", 
                LOCALE.format_string("%0.2f", mcc) if mcc != -1 else "NA",
                "NA",
                LOCALE.format_string("%0.2f", acc)]
            listTable.append(row)            
    except:
        pass

    outputReport = UTILS.outputTextTable(listTable, header = header,
                                         justify = ["left", "right", "right", "right", "right"], pad = 1, colPad = 3,
                                         titleFillToken = "-", footnote=[mess], force2Txt=False)
    return outputReport

def statisticsForRegression(trueData, predData, isTesting = True):
    """
    This method generates string table of the regression statistics

    """

    msgR = ARCPY.GetIDMessage(84826)
    msgPValue = ARCPY.GetIDMessage(84807)
    msgStdError = ARCPY.GetIDMessage(84831)

    msgHeader = None
    mess = None

    #### Change Messages Depending on Data ####
    if isTesting:
        msgHeader = ARCPY.GetIDMessage(84829)
        mess = ARCPY.GetIDMessage(84830)
    else:
        msgHeader = ARCPY.GetIDMessage(84839)
        mess = ARCPY.GetIDMessage(84840)

    try:

        slope, intercept, r_value, p_value, std_err = SCPS.linregress(trueData, predData)
        mapeSTR = ARCPY.GetIDMessage(220676)
        maeSTR = ARCPY.GetIDMessage(220677)
        rmseSTR = ARCPY.GetIDMessage(220678)
        hasZeros = (trueData == 0).sum() >0
        if hasZeros:
            mapeSTR = ARCPY.GetIDMessage(220679)

        n = len(trueData)
        diff = NUM.abs(predData-trueData)
        rmse = NUM.sqrt((diff*diff).sum()/n)
        mae = diff.sum()/n
        if not hasZeros:
            mape = NUM.sum(diff/NUM.abs(trueData))/n
        else:
            mape = NUM.sum(diff/(NUM.abs(trueData) + NUM.abs(predData))*.5)/n

        listTable=[]
        listTable.append([msgR, LOCALE.format_string("%0.3f", r_value**2)])
        listTable.append([maeSTR, LOCALE.format_string("%0.3f", mae)]) 
        listTable.append([mapeSTR, LOCALE.format_string("%0.3f", mape)])
        listTable.append([rmseSTR, LOCALE.format_string("%0.3f", rmse)])
        listTable.append([msgPValue, LOCALE.format_string("%0.3f", p_value)])
        listTable.append([msgStdError, LOCALE.format_string("%0.3f", std_err)])

        outputReport = UTILS.outputTextTable(listTable, header = msgHeader,
                                             justify = ["left", "right"], colPad = 31, pad = 1,
                                             titleFillToken = "-", footnote=[mess], force2Txt=False,
                                             emphasizeHeadRow=False)
        return outputReport, [slope, intercept, r_value, p_value, std_err, mae, mape, rmse, int(hasZeros)]
    except:
        pass

def statisticsForRegressionByModel(statData, isTesting = True):
    """
    This method generates string table of the regression statistics using Model data

    """

    if statData is None:
        return ""

    msgR = ARCPY.GetIDMessage(84826)
    msgPValue = ARCPY.GetIDMessage(84807)
    msgStdError = ARCPY.GetIDMessage(84831)

    msgHeader = None
    mess = None

    #### Change Messages Depending on Data ####
    if isTesting:
        msgHeader = ARCPY.GetIDMessage(84829)
        mess = ARCPY.GetIDMessage(84830)
    else:
        msgHeader = ARCPY.GetIDMessage(84839)
        mess = ARCPY.GetIDMessage(84840)

    try:
        slope = None
        intercept = None
        r_value = None
        p_value = None
        std_err = None
        mae = None
        mape = None
        rmse = None
        isSMape = 0
        mapeSTR = ARCPY.GetIDMessage(220676)
        maeSTR = ARCPY.GetIDMessage(220677)
        rmseSTR = ARCPY.GetIDMessage(220678)

        oldInformationSize = len(statData) == 5

        if oldInformationSize:
            slope, intercept, r_value, p_value, std_err = list(statData)
        else:
            slope, intercept, r_value, p_value, std_err, mae, mape, rmse, isSMape= list(statData)

        if isSMape:
            mapeSTR = ARCPY.GetIDMessage(220679)

        listTable=[]
        listTable.append([msgR, LOCALE.format_string("%0.3f", r_value**2)])

        if not oldInformationSize:
            listTable.append([maeSTR, LOCALE.format_string("%0.3f", mae)]) 
            listTable.append([mapeSTR, LOCALE.format_string("%0.3f", mape)])
            listTable.append([rmseSTR, LOCALE.format_string("%0.3f", rmse)])

        listTable.append([msgPValue, LOCALE.format_string("%0.3f", p_value)])
        listTable.append([msgStdError, LOCALE.format_string("%0.3f", std_err)])
        outputReport = UTILS.outputTextTable(listTable, header = msgHeader,
                                             justify = ["left", "right"], colPad = 31, pad = 1,
                                             titleFillToken = "-", footnote=[mess], force2Txt=False,
                                             emphasizeHeadRow=False)
        return outputReport
    except:
        pass

def getMat(data, nClasses):
    """ 
    Get Matrices to calculate data workspace
    """

    limit = 1000

    if len(data) > limit:
        NUM.random.seed(0)
        ind = NUM.arange(len(data))
        NUM.random.shuffle(ind)
        minV = data.min()
        maxV = data.max()
        ind=ind[0:1000]
        data = data[ind]
        data[0]= minV
        data[limit-1] = maxV
    data.sort()
    nData = len(data)
    lcl = NUM.zeros((nData+1, nClasses+1), dtype = float)
    lcl[1,1:nClasses+1] = 1.0
    vc = NUM.zeros((nData+1, nClasses+1), dtype = float)
    hinf = NUM.float64('inf')
    vc[2:nData+1, 1:nClasses+1] = hinf
    return data, lcl, vc

def jMatrices(data1, nClasses):
    """ Generate Matrices to Calculate Natural Breaks 
    """
    data, lcls, vcs = getMat(data1, nClasses)
    dType = data.dtype
    data = NUM.array(data, float)
    sl = 2
    nl = data.shape[0] + 1
    sum = 0.0
    sumSquares = 0.0
    w = 0.0
    variance = 0.0

    for l in range(2, nl):
        sum = 0.0
        sumSquares = 0.0
        w = 0.0
   
        for m in range(1, l+1):
            lcl = l - m + 1
            i4 = lcl - 1
            val = data[i4]
            w += 1.0
            sum += val
            sumSquares += val * val
            variance = sumSquares - (sum * sum) / w

            if i4 != 0:
                for j in range(2, nClasses+1):
                    jm1 = j - 1
                    if vcs[l, j] >= (variance + vcs[i4, jm1]):
                        lcls[l, j] = lcl
                        vcs[l, j] = variance + vcs[i4, jm1]

        lcls[l, 1] = 1.
        vcs[l, 1] = variance

    return NUM.array(data, dtype = dType), lcls, vcs

def breaksJenks(data1, nClasses):
    """
    Calculate Natural Breaks 
    """

    data, lcls, _ = jMatrices(data1, nClasses)
    k = data.shape[0] - 1
    kclass = [0.] * (nClasses+1)
    countNum = nClasses

    kclass[nClasses] = data[len(data) - 1]
    kclass[0] = data[0]

    while countNum > 1:
        elt = int(lcls[k][countNum] - 2)
        kclass[countNum - 1] = data[elt]
        k = int(lcls[k][countNum] - 1)
        countNum -= 1

    classes = NUM.array(kclass)
    return classes[1:,]

def getJenkBreaks(data, nClass):
    """ 
    Equal Interval if Jenks is not calculated properly
    """
    uq = NUM.unique(data)
    if len(uq) <= 5:
        return NUM.floor(min(uq)), uq

    try:
        data1 = breaksJenks(data, nClass)
        return NUM.floor(data.min()), data1
    except:
        pass

    minV = data.min()
    maxV = data.max()
    interval = (maxV-minV)/nClass
    rang = NUM.arange(5)+1
    return NUM.floor(minV), minV + rang*interval

def genColor(nColors):
    """
    Generate Random Colors
    """
    diff = 100
    NUM.random.seed(33)

    dictC = []
    lastC = None
    while len(dictC) < nColors:
        cols = NUM.random.randint(60, 240, 500)
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

def applyLayer(hpar, nameOutputPar, data, isClass, headingName, shapeType,  isTrainingOutput, isRasterLayer = False, 
               residualField = None):
    """
    Use a template layer to generate a customized layer. 
    The default symbol is described in a line 'decribeSymbolType',
    this position should be known from the template layer.
    """

    pos = [id for id, i in enumerate(hpar.parameters) if hpar.parameters[id].name == nameOutputPar][0]

    if residualField is not None and not isClass:
        lyr = "GWR_Polygons.lyrx"
        if shapeType == "Point":
            lyr = "GWR_Points.lyrx"

        pathLayer =  OS.path.join(UTILS.pathLayers, lyr)
        hpar.parameters[pos].symbology = pathLayer
        return

    msg = ARCPY.GetIDMessage(84338)
    regcolors = None
    if residualField is None:
        regcolors = ["237,248,251","178,226,226","102,194,164","44,162,95","0,109,44"]
    else:
        regcolors = ["180,100,251","150,100,226","120,100,164","90,100,95","60,100,44"]
        data = NUM.array([0,1])
        if isClass:
            msg = "SAME_CLASS"
        else:
            msg = "STDRESID"

    layerFileTemplate = None
    valueUnique = None
    uniqueValues = None
    typeSymbolLocation = None
    heading = None
    colors = None
    minV = None
    minBreak = None
    fieldN = None
    removeLines = None
    colorStroke = None
    viewOthers =  None
    #### Check Template Layer ####
    if shapeType != "Raster":
        if isClass:
            uniqueValues = NUM.unique(data)
            if shapeType == "Polygon":
                layerFileTemplate = "RFPolygonClassification.lyrx"
                typeSymbolLocation = 323
                heading = 326
                fieldN = 316
                removeLines = 337
                viewOthers = 329
            if shapeType == "Point":
                layerFileTemplate = "RFPointClassification.lyrx"
                typeSymbolLocation = 376
                heading = 379
                fieldN = 369
                removeLines = 390
                viewOthers = 382

            if residualField is not None:
                colors = ["252,141,98","0,169,230"]
                colorStroke = ["104,104,104", "104,104,104"]
            else:
                colors = genColor(len(uniqueValues))
        else:
            minV, uniqueValues = getJenkBreaks(data, 5)
            uniqueValues = NUM.round(uniqueValues,4)
            if shapeType == "Polygon":
                layerFileTemplate = "RFPolygonRegression.lyrx"
                typeSymbolLocation = 263
                heading = 306
                minBreak = 296
                fieldN = 295
                removeLines = 397

            if shapeType == "Point":
                layerFileTemplate = "RFPointRegression.lyrx"
                typeSymbolLocation = 265
                heading = 308
                minBreak = 298
                fieldN = 297
                removeLines = 503
            colors = regcolors
    else:
        if isClass:
            layerFileTemplate = "RFRasterClasses.lyrx"
            uniqueValues = data[0]  #Label
            valueUnique = data[1]
            typeSymbolLocation = 64
            heading = 67
            colors = genColor(len(uniqueValues))
            removeLines = 91
        else:
            layerFileTemplate = "RFRasterRegression.lyrx"
            minV, uniqueValues = getJenkBreaks(data, 5)
            typeSymbolLocation = 51
            heading = 0
            colors = regcolors
            removeLines = 352

    pathLayer =  OS.path.join(UTILS.pathLayers, layerFileTemplate)
    lines = []

    if OS.path.isfile(pathLayer): 
        f = open(pathLayer, 'r')
        lines = f.readlines()
        f.close()
    else:
        return

    if viewOthers is not None:
        lines[viewOthers] = lines[viewOthers].replace("true", "false")

    decribeSymbolType = lines[typeSymbolLocation]

    if residualField is not None:
        fldN = "STDRESID"

        if isClass:
            fldN = "SAME_CLASS"

        fldName = lines[fieldN].replace("PREDICTED", fldN)
        lines[fieldN] = fldName
   
    head = lines[heading].replace("NAME_FIELD", headingName +"("+msg+")")
    lines[heading] = head
    newElem = []

    if minBreak is not None:
        minBreakV = lines[minBreak].replace("4", str(minV))
        lines[minBreak] = minBreakV

    if type(uniqueValues) == NUM.float64 or type(uniqueValues) == NUM.int32:
        uniqueValues = NUM.array([uniqueValues])

    #### Generate New Elements in the Template Replacing Values ####
    prev = minV
    decimals = 4
    eps = 1e-4
    minDec = 1

    try:
        if uniqueValues.dtype == NUM.int32:
            decimals = 0
            eps = 1
            minDec = 0
    except:
        pass

    for id, i in enumerate(uniqueValues):
        ele = decribeSymbolType.replace("150,150,150", colors[id])

        if colorStroke is not None:
            ele = ele.replace("110,110,110", colorStroke[id])

        if isinstance(i, str) or isClass:
            ele = ele.replace("99999", str(i))
        else:
            newValue = ""
            if NUM.allclose(prev, i):
                newValue = UTILS.formatValue(i, UTILS.getPerfectFormatDecimal(i, decimals, minDeciamlLimit = minDec, returnFormatStr=True))
            else:
                strLI = UTILS.formatValue(prev, UTILS.getPerfectFormatDecimal(prev, decimals, minDeciamlLimit=minDec, returnFormatStr=True))
                strUI = UTILS.formatValue(i, UTILS.getPerfectFormatDecimal(i, decimals, minDeciamlLimit=minDec, returnFormatStr=True))
                newValue = fr"{strLI} - {strUI}"

            prev = i+eps
            ele = ele.replace("\\u226499999", newValue)
            ele = ele.replace("99999", str(i))

        if residualField is not None and isClass:
            if i == 0:
                ele = ele.replace("CATEGORY", ARCPY.GetIDMessage(220043))
            else:
                ele = ele.replace("CATEGORY", ARCPY.GetIDMessage(220044))
        else:
            ele = ele.replace("CATEGORY", str(i))

        if str(type(i)).startswith('U'):
            ele = ele.replace('"VALUE2CHANGE"', str(i))
        else:
            ele = ele.replace('VALUE2CHANGE', str(i))

        if valueUnique is not None:
            ele = ele.replace("VALUETOSEARCH", str(valueUnique[id]))

        newElem.append(ele)

    replac = ",".join(newElem)
    lines[typeSymbolLocation] = replac
    iniText = lines[0:typeSymbolLocation]
    endText = lines[typeSymbolLocation:len(lines)]
    iniText += endText;
    #### Avoid to Use Previous Layer ####
    startLayerCIM = 9

    #### Remove CIM extra Lines ####
    for i in NUM.arange(8):
        iniText[i]= ""

    for i in NUM.arange(removeLines, len(iniText), 1):
        iniText[i]= ""

    info = " ".join(iniText)

    #### Apply JSON CIM ####
    ARCPY.gp.SetParameterSymbology(pos, "JSONCIMDEF="+info.strip())


def createDBGOutput(rfField, parameters = None, trainField = True):
    if DBGFILES is not None:
        
        import codecs
        if parameters is not None:
            with open(DBGFILES +"_pars.txt", 'w') as outfile:
                data = { p.name:p.valueAsText for id, p in enumerate(parameters)}
                JSON.dump(data, outfile)

        if trainField:
            createOutputRFRieldASNumpy(rfField, DBGFILES+"_TRAI")
        else:
            createOutputRFRieldASNumpy(rfField, DBGFILES+"_TEST")

def createOutputRFRieldASNumpy(rfField, outputFC):
    """
    Create Output binary Numpy file From a RFField instance
    """
    rfField.saveInfo(outputFC + "_h.txt")
    NUM.save(outputFC + "_x", rfField.x)
    if rfField.yField is not None:
        NUM.save(outputFC + "_y", rfField.y)

def newFCFromSSDO(ssdo, outputFC):
    """
    Create New Feature Dataset 
    """
    if len(ssdo.badRecords) == 0:
        return ssdo.inputFC, ssdo.oidName, False

    if ssdo.hasOID64:
        dataIds = NUM.array(list(ssdo.master2Order.keys()), dtype = NUM.int64)
        field = SSDO.CandidateField(name = "IDS",
                                    type = "LONG",
                                    data = NUM.arange(len(dataIds), dtype = NUM.int64))
    else:
        dataIds = NUM.array(list(ssdo.master2Order.keys()), dtype = int)
        field = SSDO.CandidateField(name = "IDS",
                                    type = "LONG",
                                    data = NUM.arange(len(dataIds), dtype = int))

    if ssdo.shapeType == "Polygon":
        ARC._ss.copy_selected_features_polygons(ssdo = ssdo,
                                           input_feature_class = ssdo.inputFC,
                                           output_feature_class = outputFC,
                                           subset_ids = dataIds,
                                           candidate_fields = [field]
                                           )
    else:
        ARC._ss.output_featureclass_from_dataobject(ssdo, outputFC, [field])

    return outputFC, "IDS", True

class HandleInputs():

    def __init__(self, parameters):
        self.parameters = parameters

    def loadBasic(self, parameters):
        #### Initialize Vars ####
        self.parameters = parameters
        self.par = {p.name:p.valueAsText for id, p in enumerate(parameters)}
        self.parValue = { p.name:p for id, p in enumerate(parameters)}
        self.parStatus = { id:False for id, p in enumerate(parameters)}
        self.discrete = discrete
        self.continuous = continuous
        self.fieldAliasInput = None
        self.fieldNameToAlias = None
        self.activeParameters = []
        self.isModel = False
        self.where = None
        self.what = None
        self.isClassification = False
        self.haveToPredict = False
        self.featuresToPredict = None
        self.rfM = None
        self.explodeDataRaster = False
        self.requireOutputModel = False
        self.typeRasters = []
        self.inputModel = ""
        self.predictFunction = None
        self.addProbabilities = parameters[40].value
        self.enabledRasterProbability = ENABLED_RASTER_PROBABILITY

        if "output_trained_model" in  self.par:
            self.outputModel = self.par["output_trained_model"]
            self.requireOutputModel = True

        self.uncertainty = 0

        #### Get Basic Parameters ####
        self.predictionType =  UTILS.getTextParameter(0, parameters)
        self.input = UTILS.getTextParameter(1, parameters)
        self.variableToPredict = UTILS.getTextParameter(2, parameters)
        self.classes = UTILS.getTextParameter(3, parameters)
        self.featuresToPredict = UTILS.getTextParameter(7, parameters)
        self.variableToPredictAlias = self.variableToPredict

        #### Evaluate Other Parameters and Check Contraints ####
        self.initialDecision()
        self.decision()
        self.selectedParameters()
        self.getParameters(self.parameters)
        self.iterationSeeds = None

    def aliasChange(self, desc, disable = False):
        """
        Check Alias of input feature class, matching variables"
        """
        if disable:
            return
        if desc is None:
            return
        #### Check Explanatory Variables ####
        expVar = self.parameters[4]
        if expVar in ["", None]:
            return
        inFields = UTILS.SSFieldsInfo(desc)
        matchExVar = self.parameters[10]
        self.fieldAliasInput = inFields
        if desc is not None:

            #### Replace Alias For Field Names ####
            if expVar.value:
                values = expVar.value
                valuesM = None
                if matchExVar.value:
                    valuesM = matchExVar.value

                valuesE = []
                orderFieldVar = []
                for i in values:
                    field = inFields.fieldAlias(str(i[0].value))

                    if field is None: 
                        ARCPY.AddIDMessage("ERROR", 544, str(i[0].value) )
                        raise SystemExit

                    orderFieldVar.append(field.name)
                    valuesE.append( [field.name, i[1]])
                values = valuesE

                valuesToM = []
                if valuesM is not None:
                    if len(values) !=  len(valuesM):
                        ARCPY.AddIDMessage("ERROR", 110203)
                        raise SystemExit

                    for idv, i in enumerate(valuesM):
                       valuesToM.append([i[0].value, orderFieldVar[idv]])

                    valuesM = valuesToM

                expVar.value = values
                matchExVar.value = valuesM

    def parseOptimizationValues(self):
        """ Obtain the parameters values"""

        values = self.optimizeInformation["values"].split(";")

        defaults = self.optimizeInformation["default"]
        newDict = {}
        for value in values:
            key = None
            low=high=intv= 0

            try:
                valRow = value.split(" ")
                key, low, high, intv = valRow
                low, high, intv = list(map(UTILS.strToFloat,[low,high,intv]))
            except:
                ARCPY.AddError("Invalid values "+ key)
                raise SystemExit
                pass
            low, high, intv = list(map(defaults[key][0],[low, high, intv]))
            newDict[key] = [low,high,intv]
        self.optimizeInformation["values"] = newDict

    def getParameters(self, parameters):
        self.nullValue = None
        self.explanatoryVariables = UTILS.getTextParameter(4, parameters)
        self.distanceFeatures = UTILS.getTextParameter(5, parameters)
        self.explanatoryRasters = UTILS.getTextParameter(6, parameters)
        self.outputFeatures = UTILS.getTextParameter(8, parameters)
        self.outputRaster = UTILS.getTextParameter(9, parameters)
        self.matchVariables = UTILS.getTextParameterMatch(10, parameters)
        self.matchDistances = UTILS.getTextParameterMatch(11, parameters, ["MappingLayerObject","mp.Layer"])
        self.matchRaster  =  UTILS.getTextParameterMatch(12, parameters, ["MappingLayerObject","mp.Layer"])
        self.outputTrainedFeatures = UTILS.getTextParameter(13, parameters)
        self.outputDiagnostic = UTILS.getTextParameter(14, parameters)
        self.outputDiagnosticParameter  = self.parameters[14]
        self.useAllRasterValues =  UTILS.getTextParameter(15, parameters)
        self.numTrees = UTILS.getNumericParameter(16, parameters)
        self.leafSize = UTILS.getNumericParameter(17, parameters)
        self.maxLevel = UTILS.getNumericParameter(18, parameters)
        self.sample_size = UTILS.getNumericParameter(19, parameters)
        self.fields_to_try = UTILS.getNumericParameter(20, parameters)
        self.split = UTILS.getNumericParameter(21, parameters)
        self.outputConfusion = UTILS.getTextParameter(22, parameters)
        self.outputConfusionParameter = self.parameters[22]
        self.outputCrossValidation = UTILS.getTextParameter(23, parameters)
        self.outputCrossValidationParameter = self.parameters[23]
        balanceTree =  UTILS.getTextParameter(24, parameters)
        self.balanceTree = False
        self.iterations = UTILS.getNumericParameter(25, parameters)
        uncertainty = UTILS.getTextParameter(26, parameters)

        #### New Field Type Checkers ####
        if self.outputTrainedFeatures is not None:
            fields = [self.variableToPredict.upper()]
            if self.explanatoryVariables is not None:
                fields += [i.split(" ")[0].upper() for i in self.explanatoryVariables.split(";")]
            checker = UTILS.ExecuteNewFieldTypeChecker(self.input, self.outputTrainedFeatures,
                                                       fields = fields)

        if self.featuresToPredict is not None and self.outputFeatures is not None:
            fields = []
            if self.matchVariables is not None:
                fields += [i[0].upper() for i in self.matchVariables]
            checker = UTILS.ExecuteNewFieldTypeChecker(self.featuresToPredict, self.outputFeatures,
                                                       fields = fields)

        self.modelType = parameters[29].valueAsText
        self.isXGB = self.modelType == "GRADIENT_BOOSTED"
        self.optimize = parameters[34].value
        self.optimizeOutputTableStr = UTILS.getTextParameter(39, parameters)
        if self.isXGB:
            self.lambdaValue = UTILS.getNumericParameter(30, parameters)
            self.gammaValue = UTILS.getNumericParameter(31, parameters)
            self.learningRate = UTILS.getNumericParameter(32, parameters)
            self.maxBins = UTILS.getNumericParameter(33, parameters)

        self.optimizeInformation = None
        if self.optimize:
            self.optimizeAlgorithm = parameters[35].value
            optimizeTarget = UTILS.getTextParameter(36, parameters)
            numSearch = UTILS.getNumericParameter(37, parameters)
            modelParamSetting = UTILS.getTextParameter(38, parameters)
            outputParamTunningTable = parameters[39]

            keyValues =  {"NUM_TREES":(int, self.numTrees, ARCPY.GetIDMessage(84811)),
                                "MAX_DEPTH":(int, self.maxLevel, ARCPY.GetIDMessage(220689)), 
                                "LEAF_SIZE":(int, self.leafSize, ARCPY.GetIDMessage(220690)),
                                "SAMPLE_SIZE":(int, self.sample_size, ARCPY.GetIDMessage(220691)),
                                "RANDOM_VARIABLES":(int,self.fields_to_try,ARCPY.GetIDMessage(84815))} 
            if self.isXGB:
                keyValues["ETA"]= (float, self.learningRate,  ARCPY.GetIDMessage(220668))
                keyValues["REG_LAMBDA"]=(float, self.lambdaValue,  ARCPY.GetIDMessage(220669))
                keyValues["GAMMA"]=(float,self.gammaValue, ARCPY.GetIDMessage(220670) )
                keyValues["MAX_BINS"]= (int,self.maxBins, ARCPY.GetIDMessage(220671))


            self.optimizeInformation = {"target":optimizeTarget,
                                        "algorithm":self.optimizeAlgorithm ,
                                        "numSearch":numSearch, 
                                        "values":modelParamSetting, 
                                        "table":outputParamTunningTable,
                                        "default": keyValues }
            self.parseOptimizationValues()

        self.rasterWorkSpace = None
        self.extensionBase = ""
        self.delRaster = False

        #### Default Set Iterations ####
        if self.iterations  is None:
            self.iterations = 1

        #### Max Level Null - Each Tree is Explored Completed ####
        if self.maxLevel is None:
            self.maxLevel = -1

        if self.isXGB and self.maxLevel == -1:
            self.maxLevel =  6

        if self.isXGB and self.maxLevel > 1000:
            ARCPY.AddError("Maximum level for GRADIENT_BOOSTED is 1000")
            raise SystemExit

        self.xgbPar = None
        if self.isXGB:
            self.xgbPar = NUM.array([self.learningRate, 0, self.lambdaValue, self.gammaValue, self.maxBins, 1 ], dtype = float)

        if self.split == 0:
            if self.outputConfusion not in ["", None]:
                ARCPY.AddIDMessage("WARNING", 110228)

        #### Set split to Zero ####
        if self.split in [None, "#" , ""]:
            self.split = 10

        #### Check extension of output raster ####
        if self.outputRaster is not None:
            if not UTILS.isGDB(self.outputRaster):
                outPath, outName = OS.path.split(self.outputRaster)
                if "." not in outName.upper():
                     self.outputRaster =  str(self.outputRaster)+ ".tif"
                elif outName[-4:].upper() not in listExtensions:
                    self.outputRaster =  str(self.outputRaster)+ ".tif"

        self.balanceTree = False
        #### Balance Tree ####
        if balanceTree is not None and not self.isXGB:
            self.balanceTree = True if balanceTree in [True, "true", "TRUE"] else False
            if self.balanceTree:
                self.sample_size = 100
                self.leafSize = 1
        else:
            self.balanceTree = False

        self.uncertainty = 0
        #### Uncertainty ####
        if uncertainty is not None and not self.isXGB:
           self.uncertainty = 1 if uncertainty in [True, "true", "TRUE"] else 0
           #### Uncertainty Just Calculated in Regression Mode ####
           if self.isClassification:
                self.uncertainty = False

        if self.outputRaster not in ["", None]:
            outPath, outName = OS.path.split(self.outputRaster)
  
            self.rasterWorkSpace = outPath
            #### Get Base Workspace Type ####
            baseType = UTILS.getBaseWorkspaceType(outPath)
            ext = ""
            delRaster = False
            if baseType.upper() == "FILESYSTEM":
                #### Add tif Extension for Folders ####
                if outName[-4:].upper() not in listExtensions:
                    self.extensionBase = ".tif"
                else:
                    self.extensionBase = outName[-4:]

                self.delRaster = True


        if self.useAllRasterValues is not None:
            self.explodeDataRaster = True if self.useAllRasterValues == "true" else False

        if not self.isModel:
            if self.explanatoryVariables is None and \
                self.distanceFeatures is None and \
                self.explanatoryRasters is None:
                ARCPY.AddIDMessage("ERROR", 110173)
                raise SystemExit

        if self.numTrees is None:
            self.numTrees = 100

        if self.numTrees == 0:
            self.what = "NONE"

        if not self.isModel:
            if self.sample_size is None:
                self.sample_size = 100

            if self.leafSize is None or self.leafSize < 0:
                if self.isClassification:
                    self.leafSize = 1
                else:
                    if self.leafSize is None  or  self.leafSize < 5 :
                        self.leafSize = 5

        if self.outputModel is  None:
            self.outputModel = ""

        if self.outputRaster is None:
            self.outputRaster = ""

    def initialDecision(self):
        par = self.par
        self.isPolygon = False
        self.isModel = False
        self.desc = None

        if self.input:
            try:
                self.desc = ARCPY.Describe(self.input)
                self.isPolygon = self.desc.shapeType  == "Polygon"
            except:
                ARCPY.AddIDMessage("ERROR", 294, self.input)
                raise SystemExit

            if self.desc is not None:
                self.aliasChange(self.desc)
                field = self.fieldAliasInput.fieldAliasUpper(self.variableToPredict )

                ### Set Alias Variable to Predict ####
                if field is not None:
                    self.variableToPredictAlias = field.aliasName

        self.descF2P = None
        if self.featuresToPredict:
            try:
                self.descF2P = ARCPY.Describe(self.featuresToPredict)
            except:
                ARCPY.AddIDMessage("ERROR", 294, self.featuresToPredict)
                raise SystemExit

        userTypeRF = "CATEGORICAL" if self.classes in [ "CATEGORICAL", True, "True", "true"] else "NUMERIC"
        self.classes = userTypeRF == "CATEGORICAL"

        self.isClassification =  self.classes
        #self.requireOutputModel = False
        #self.outputModel = ""

    def enableParametersBy(self, par , enb, disable ):
        for i in enb:
            par[i] = True
        for j in disable:
            par[j] = False

    def selectedParameters(self):

        activeParameters = {}
        for id, i in enumerate(self.par):
            name = self.parameters[id].name
            if self.parStatus[id]:
                if DBGPAR:
                    ARCPY.AddMessage(str(id) + " " + name  + ": " + str(self.par[name])) 
                activeParameters[name] = self.parameters[id]
            else:
                if DBGPAR:
                    ARCPY.AddMessage(str(id) + " " + name  + "- Cleaned >>>>>>>>>>>: " + str(self.par[name])) 
                self.parameters[id].value =  None
        self.activeParameters = activeParameters

    def decision(self):
        """
        This Method checks the user selection.. It helps to clean unnecessary parameters
        """

        par = self.parStatus
        iniEnabled = []
        self.enableParametersBy(par, range(len(self.parameters)),[])

        if self.predictionType == "TRAIN":
            self.enableParametersBy(par, [4, 5, 6], [7, 8, 9, 10, 11, 12])
            self.what = "NONE"
            self.haveToPredict = False

        elif  self.predictionType == "PREDICT_FEATURES":
            self.enableParametersBy(par, [4, 5, 6, 7, 8, 10, 11, 12], [9])
            self.what = "FEATURES"
            self.haveToPredict = True

        elif  self.predictionType == "PREDICT_RASTER":
            self.enableParametersBy(par, [9, 10, 11, 12], [7, 8, 4, 5, 10, 11 ])
            self.what = "RASTER"
            self.haveToPredict = False

        anotherCheck = self.parameters[4].value is None and self.parameters[5].value is None

        if self.isClassification and self.what in ["NONE", "RASTER"] and self.isPolygon  and anotherCheck:
            self.enableParametersBy(par, [15], [])
        else:
            self.enableParametersBy(par, [], [15])

    def splitFieldName(self, text, testId = 0):
        """
        split Match Variable from fields
        INPUT:
            text {str}: It should be POP(DSC) POP; testId->1
        OUTPUT:
            list: [Training, rFType, Test]
         """
        if type(text) == str:
            textPart = text.split(" ")
            fieldTest = textPart[testId]
            fieldTraining = textPart[(not testId)*1]
            if self.discrete in fieldTraining:
                return fieldTraining.replace(self.discrete,"").strip(), varTypeRev[self.discrete], fieldTest
            else:
                return fieldTraining, varTypeRev[self.continuous], fieldTest
        elif type(text) == list:

            if self.discrete in text[1]:
                return text[1].replace(self.discrete,"").strip(), varTypeRev[self.discrete], text[0]
            else:
                return text[1], varTypeRev[self.continuous], text[0]

    def getIndexVarByNameSource(self, listVar, name, source):
        idVar = [id for id, i in enumerate(listVar) if source in i[0]["source"] and i[0]["name"].upper() == name]
        if len(idVar):
            return idVar[0]
        else:
            return None

    def getIndexVarByName(self, listVar, name):
        idVar = [id for id, i in enumerate(listVar) if i[0]["name"].upper() == name]
        if len(idVar):
            return idVar[0]
        else:
            return None

    def getInfoValues(self,):
        """
        get Info: 
             FieldsToMatch, DistancesToMatch, RastersToMatch, 
             eVariables, eDistances, eRasters
             FieldsToMatchVerify
        """

        nameInputFC = None
        pathInputFC = None
        pathCompleteInputFC = None
        
        if self.desc is not None:
            #### Get Input FC Path ####
            nameInputFC = self.desc.name
            pathInputFC = self.desc.path
            pathCompleteInputFC = OS.path.normpath(pathInputFC + "\\"+ nameInputFC)

        #### Get Input Feature To Predict Path ####
        pathCompleteInputF2P = None
        if self.descF2P is not None:
            nameInputF2P = self.descF2P.name
            pathInputF2P = self.descF2P.path
            pathCompleteInputF2P = OS.path.normpath(pathInputF2P + "\\"+ nameInputF2P)

        listVariables = []
        varFC = {}
        eV = {}

        if self.rfM is not  None:
            listVariables, eV = self.rfM.getVariables("FC")
            varFC = eV

        if self.explanatoryVariables is not None :
            error = None
            try:
                eVt = {}
                eV = {row.split(' ')[0]: row.split(' ')[1] for row in self.explanatoryVariables.split(";")}

                rowVar = {}
                for idF in self.desc.fields:
                    if idF.name in eV or idF.aliasName in eV:
                        typeValue = categoricalVar

                        if eV[idF.name] in ['', '#', 'false', False, "NUMERIC"]:
                            typeValue = numericVar

                        varFC[idF.name.upper()]= typeValue
                        rowVar =    [{"name":idF.name.upper(), 
                                      "alias":str(self.fieldAliasInput.fieldAlias(idF.name)), "rfType":typeValue,
                                      "fieldType":idF.type,
                                      "source":"FC",
                                      "sourceData": self.desc.path +"\\"+ self.desc.name},{}]
                        eVt[idF.name.upper()] = idF.type
                        if idF.type == "String":
                            if eV[idF.name] in ["false", False, continuous]:
                                ARCPY.AddIDMessage("ERROR", 110200,idF.name)
                                raise SystemExit
                        listVariables.append(rowVar)
            except:
                ARCPY.AddIDMessage("ERROR", 110199)
                raise SystemExit

            #### Check if Variable exists in the dataset ####
            doNotExist = []
            if len(listVariables) != len(eV):
                lisV = [i[0]["name"] for i in listVariables]
                for id, i in enumerate(eV):
                    if i.upper() not in lisV:
                        doNotExist.append(i)

                if len(doNotExist):
                    ARCPY.AddIDMessage("ERROR", 10269, ",".join(doNotExist))
                    raise SystemExit

        if self.matchVariables is not None :
            mfV = None
            if type(self.matchVariables) == str:
                mfV = [self.splitFieldName(field, 0) for field in self.matchVariables.split(";")]
            else:
                mfV = [self.splitFieldName(field, 0) for field in self.matchVariables]
            mfVt = []

            val = list(eV.keys())
            for id, i in enumerate(NUM.arange(len(mfV))):
                mfVt.append([val[id].upper(), [val[id].upper()], mfV[id][2]])
            mfV = mfVt

            tmfV = {field[2]:field[1] for field in mfV }
            nameTestFieldTrainField = {field[2].upper():field[0].upper() for field in mfV }
            fieldNamesPredict = [i[2] for i in mfV ]
            rowVar = []

            for idF in self.descF2P.fields:

                nameToUse = None
                if idF.name in fieldNamesPredict:
                    nameToUse = idF.name.upper()
                elif idF.aliasName in fieldNamesPredict:
                    nameToUse = idF.aliasName.upper()
                   
                if nameToUse is not None:

                    idVar = self.getIndexVarByNameSource(listVariables,
                                                            nameTestFieldTrainField[nameToUse],
                                                            "FC")

                    if idVar is not None:
                        varToMatch = listVariables[idVar][0]
                        if idF.type == varToMatch["fieldType"]:
                            rowVar =    {"name":idF.name.upper(), "alias":idF.aliasName, "rfType":varToMatch["rfType"],
                                         "fieldType":idF.type, "source":"FC",
                                         "sourceData": self.descF2P.path + "\\"+ self.descF2P.name}
                            listVariables[idVar][1] = rowVar
                        else:
                            ARCPY.AddIDMessage("ERROR", 110176, listVariables[idVar][0]["name"], idF.name )
                            raise SystemExit
                    else:
                        ARCPY.AddIDMessage("ERROR", 110185, nameTestFieldTrainField[nameToUse] )
                        raise SystemExit

        if self.distanceFeatures is not None and self.rfM is None :
            unknownRF = []
            cantBeUsed = False
            try:
                pathD = [ out.replace("'","") for out in self.distanceFeatures.split(";")]
                setV = set(pathD)
                
                names = []

                for distFeature in pathD:
                    orgPath = distFeature
                    isFS = False
                    if distFeature.upper().startswith("HTTPS:"):
                        isFS = True
                
                    desc = ARCPY.Describe(distFeature)

                    if desc.spatialReference.type.upper() == "UNKNOWN":
                        unknownRF.append(distFeature)

                    name = desc.name
                    path = desc.path
                    pathComplete = OS.path.normpath(path + "\\"+ name)


                    if OS.path.realpath(pathCompleteInputFC) == OS.path.realpath(pathComplete):
                        cantBeUsed  = True

                    if desc.dataType == "FeatureLayer":
                        pathComplete = desc.nameString
                        #### Detect a feature service in a Feature Layer ####
                        try:
                            int(name)
                            name = desc.nameString.replace(" ", "_")
                        except:
                            pass

                    if isFS:
                        pathComplete = orgPath
                        
                    if name not in names:
                        names.append(name)
                    else:
                        name = name +"_1"
                        names.append(name)
                        
                    rowVar =    {"name":name.upper(), "alias":name.upper(), "rfType":numericVar,
                                 "fieldType":"Double", "source":"DIST",
                                 "sourceData": pathComplete}

                    listVariables.append([rowVar,{}])
            except:
                ARCPY.AddIDMessage("ERROR", 110201)
                raise SystemExit

            if cantBeUsed:
                ARCPY.AddIDMessage("ERROR", 110260)
                raise SystemExit

            if len(unknownRF):
                ARCPY.AddIDMessage("ERROR", 522, ",".join(unknownRF))
                raise SystemExit

        if self.matchDistances is not None:
            cantBeUsed = False
            try:
                mdV = None

                if type(self.matchDistances) == str:
                    mdV = [self.splitFieldName(field, 0) for field in self.matchDistances.split(";")]
                else:
                    mdV = [self.splitFieldName(field, 0) for field in self.matchDistances]

                tmdV= {}
                cPmdV= {}

                for row in mdV:
                    nameDistToMatch = None
                    orgPath = row[0]
                    
                    isFS = False
                    if orgPath.upper().startswith("HTTPS:"):
                        isFS = True

                    if self.rfM is None:
                        nameDistToMatch = ARCPY.Describe(row[0]).name.upper()
                    else:
                        nameDistToMatch = row[0].upper()

                    desc = ARCPY.Describe(row[2])
                    name = desc.name
                    path = desc.path
                    pathComplete = OS.path.normpath(path + "\\"+ name)

                    if pathCompleteInputF2P is not None:
                        if OS.path.realpath(pathCompleteInputF2P) == OS.path.realpath(pathComplete):
                            cantBeUsed = True

                    if desc.dataType == "FeatureLayer":
                        pathComplete = desc.nameString
                        #### Detect a feature service in a Feature Layer ####
                        try:
                            int(name)
                            name = desc.nameString.replace(" ", "_")
                        except:
                            pass
                            
                    if isFS:
                        pathComplete = orgPath

                    rowVar = {"name":name.upper(), "alias":name.upper(), "rfType":numericVar,
                              "fieldType":"Double", "source":"DIST",
                              "sourceData": pathComplete}

                    idVar = self.getIndexVarByNameSource(listVariables,
                                                            nameDistToMatch,
                                                            "DIST")
                    if idVar is not None:
                        listVariables[idVar][1] = rowVar
                    else:
                        ARCPY.GetIDMessage("ERROR", 110176, nameDistToMatch , name )
                        raise SystemExit()
            except:
                ARCPY.AddIDMessage("ERROR", 110186)
                raise SystemExit

            if cantBeUsed:
                ARCPY.AddIDMessage("ERROR", 110261)
                raise SystemExit


        varRast = {}
        if self.explanatoryRasters is not None :
            noSupport = False
            try:
                valueRasters = self.parValue['explanatory_rasters'].valueAsText.split(";")

                for rOpt in valueRasters:
                    i = None
                    count = sum(map(lambda x : 1 if "'" in x else 0, rOpt ))

                    if count == 0:
                        i = rOpt.split(" ")
                    if count == 2:
                        part1 = rOpt.split("'")[1::2]
                        part2 = rOpt.replace(part1[0],"").replace("'","").strip()

                        i = [ part1[0], part2]

                    val = i[0]
                    typeVar = numericVar

                    if i[1] in [discrete, True , "true", "CATEGORICAL"] :
                        typeVar = categoricalVar

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
                        name = getNameRaster(name1.upper())
                        pathAll =  OS.path.normpath(path +"\\"+ desc.name)

                    varRast[val] = typeVar

                    if desc.format== "NetCDF":
                        pathAll = desc.name
                        del desc

                    rowVar =    {"name":name, "alias":name1, "rfType":typeVar,
                                    "fieldType":"Double", "source":"RASTER",
                                    "sourceData": pathAll
                                    }
                    listVariables.append([rowVar,{}])
            except:
                ARCPY.AddIDMessage("ERROR", 110202)
                raise SystemExit

            if noSupport:
                ARCPY.AddIDMessage("ERROR", 110213)
                raise SystemExit

        if self.matchRaster is not None :
            noSupport = False
            try:
                mrV = None
                if type(self.matchRaster) == str:
                    mrV = [self.splitFieldName(field, 0) for field in self.matchRaster.split(";")]
                else:
                    mrV = [self.splitFieldName(field, 0) for field in self.matchRaster]

                mrVn = []
                for id, el in enumerate(mrV):
                    mrVn.append([mrV[id][0], varRast[mrV[id][0]],mrV[id][2]])
                mrV = mrVn

                tmrV = { field[2]:field[1] for field in mrV }
                tmdV= {}
                cPmdV= {}
  
                for row in mrV:
                    nameRasterToMatch = None
                    if self.rfM is None:
                        val = None
                        if hasattr(row[0], "value"):
                            val = row[0].value
                        else:
                            val = row[0]
                        nameRasterToMatch = ARCPY.Describe(val).name.upper()
                        nameRasterToMatch = getNameRaster(nameRasterToMatch)
                    else:
                        nameRasterToMatch = row[0].upper()

                    typeVar = row[1]
                    desc = ARCPY.Describe(row[2])

                    if hasattr(desc, "format") and desc.format  in noSupportSAFormats:
                        noSupport = True

                    name1 = desc.name
                    path = desc.path
                    name = getNameRaster(name1.upper())
                    pathAll =  OS.path.normpath(path +"\\"+ desc.name)

                    if  hasattr(desc, "format") and desc.format== "NetCDF":
                        pathAll = desc.name
                        del desc

                    rowVar =    {"name":name, "alias":name1, "rfType":typeVar,
                                    "fieldType":"Double", "source":"RASTER",
                                    "sourceData": pathAll
                                  }
                    idVar = self.getIndexVarByNameSource(listVariables,
                                                         nameRasterToMatch,
                                                            "RASTER")
                    if idVar is not None:
                        listVariables[idVar][1] = rowVar
                    else:
                        ARCPY.GetIDMessage("ERROR", 110176, nameDistToMatch, name )
                        raise SystemExit()

            except:
                ARCPY.AddIDMessage("ERROR", 110187)
                raise SystemExit

            if noSupport:
                ARCPY.AddIDMessage("ERROR", 110213)
                raise SystemExit

        verifyOnltTraining = 1

        if len(listVariables) == 0:
            ARCPY.AddIDMessage("ERROR", 110173)
            raise SystemExit()

        if self.what != "NONE":
            verifyOnltTraining = 2
            for i in listVariables:
                if len(i[1]) == 0:
                    ARCPY.AddIDMessage("ERROR", 110203)
                    raise SystemExit()

        #### Repeat Names in Training and Testing ####
        for iv in range(verifyOnltTraining):
            names = NUM.array([i[iv]["name"] for i in listVariables])
            uniqueNames, count = NUM.unique(names, return_counts = True)

            if len(count) and NUM.max(count) > 1:
                name = uniqueNames[NUM.where(count>1)[0][0]]
                ARCPY.AddIDMessage("ERROR", 110182, name )
                raise SystemExit()

            #### Check String Field ####
            nl = [id for id, i in enumerate(listVariables) if i[iv]["fieldType"] == "String" and i[iv]["rfType"] != categoricalVar]
            if len(nl):
                ARCPY.AddIDMessage("ERROR", 110200,self.getNamesList(listVariables, nl) )
                raise SystemExit()


        self.outArea = False

        if verifyOnltTraining == 2:
            nl = [id for id, i in enumerate(listVariables) if i[0]["fieldType"] != i[1]["fieldType"]]
            if len(nl):
                ARCPY.AddIDMessage("ERROR", 110206, self.getNamesList(listVariables, nl))
                raise SystemExit()

            outFC = [id for id, i in enumerate(listVariables) 
                        if i[1]["source"] in ["DIST", "RASTER"] and OS.path.realpath(i[1]["sourceData"]) != OS.path.realpath(i[0]["sourceData"])]

            if len(outFC):
                self.outArea = True

        self.listVariables = listVariables

    def getNamesList(self, listVar, ids):
        idVar = [i[0]["name"] + "-" + i[1]["name"] for id, i in enumerate(listVar) if id in ids ]
        return ";".join(idVar)

    def getVarsBySourceOrigin(self, source, training = True, info = "name"):
        id = 0
        if not training:
            id = 1
        if self.listVariables is not None:
            return {i[id][info]:i[id] for i in self.listVariables if source in i[id]["source"]}

    def getDictOrder(self):
        return {i[0]["name"].upper():i[1]["name"].upper() for i in self.listVariables}

def processErrors(errors):
    """
    Check Variability Messages 
    """
    dictTwoAdd = {110192:MaxCategoriesAllowed}

    errorCounts = len([i for i in errors if len(i) and i[2] == "E"])
    warningCounts = len([i for i in errors if len(i) and i[2] == "W"])

    if errorCounts:
        typeOfErrors = [i[0] for i in errors if len(i) and i[2] == "E"]
        dictErrors = {i:[] for i in typeOfErrors}
        outputErrors = {i[0]:dictErrors[i[0]].append(i[1]) for i in errors if len(i) and i[2] == "E"}

        for i in dictErrors:
            uq = NUM.unique(dictErrors[i])
            if i in dictTwoAdd:
                ARCPY.AddIDMessage("ERROR", i, ", ".join(uq), dictTwoAdd[i] )
            else:
                ARCPY.AddIDMessage("ERROR", i, ", ".join(uq))
        raise SystemExit

    if warningCounts:
        typeOfErrors = [i[0] for i in errors if len(i) and i[2] == "W"]
        dictErrors = {i:[] for i in typeOfErrors}
        outputErrors = {i[0]:dictErrors[i[0]].append(i[1]) for i in errors if len(i) and i[2] == "W"}
        for i in dictErrors:
            uq = NUM.unique(dictErrors[i])
            if i in dictTwoAdd:
                ARCPY.AddIDMessage("Warning", i, ", ".join(uq),dictTwoAdd[i] )
            else:
                ARCPY.AddIDMessage("Warning", i, ", ".join(uq))

def AddDataN(rfField, hpar, typeSampling = "Tool"):
    """
    Add data in the random Field 

    """
    vars = hpar.getVarsBySourceOrigin("FC")
    varsD = hpar.getVarsBySourceOrigin("DIST")
    varsR = hpar.getVarsBySourceOrigin("RASTER")

    noRequiredNewFC = (len(varsD) + len(varsR)) == 0

    ssdo = rfField.ssdo
    maskTotal = None
    nFeatures = ssdo.inputFC

    messages = []
    for f in vars:
        errors = rfField.addXVariableFromDataObject(name = f.upper(), 
                                           userType = vars[f]["rfType"],
                                           source = "FC",
                                           alias = vars[f]["alias"]
                                           )
        messages.extend(errors)

    processErrors(messages)

    if not noRequiredNewFC:

        #### Create Scratcth FC ####
        nFeatures = UTILS.returnScratchName("FC_RF_", 
                                             scratchWS = ARCPY.env.scratchGDB)

        nFeatures, idField, useCopy =  newFCFromSSDO(ssdo, nFeatures)

        unit = UTILS.getDistanceUnit(ssdo, True)
        rfField.distanceUnit = unit
        messages = []
        if len(varsD):
            pathD = [varsD[i]["sourceData"] for i in varsD]

            dataList = getNearFeature(nFeatures, pathD, rfField.distanceUnit )
            for id, f in enumerate(varsD):
                errors = rfField.addXVariableFromArray(name = f.upper(),
                                              userType = "Numeric",
                                              dataInfo = dataList[id],
                                              source = "DIST", 
                                              inputType = "Double",
                                              unit = unit)
                messages.extend(errors)
            processErrors(messages)

        if len(varsR):
            pathR = [varsR[i]["sourceData"] for i in varsR]
            namesR = [varsR[i]["alias"] for i in varsR]
            typeRasters = [varsR[i]["rfType"] for i in varsR]
            
            dataListr, maskTotal, nullR, eROp = extractFeatureFromRaster(ssdo, pathR, namesR, typeRasters, nFeatures,
                                                                         typeSampling = typeSampling, useCopy = useCopy )
            for id, rasterName in enumerate(varsR):
                errors = rfField.addXVariableFromArray(name = rasterName.upper(),
                                              userType = varsR[rasterName]["rfType"],
                                              dataInfo = dataListr.T[id],
                                              source = "RASTER", 
                                              inputType = "Double", 
                                              maskedOut = nullR)
                messages.extend(errors)
            processErrors(messages)


        if useCopy:
            UTILS.passiveDelete(nFeatures)

    return maskTotal

def checkAdvancedLic():
    """ Check Advance License """
    return True


def AddTestFieldN(rfTest, hpar):
    """
    Get Values from each Type of Input
    """

    featuresToPredict = hpar.featuresToPredict
    ssdo = rfTest.ssdo
    maskTotal = None
    dictFields = {}
    maskTotal = []
    
    nFeaturesToPredict = None
    vars = hpar.getVarsBySourceOrigin("FC", False)
    varsD = hpar.getVarsBySourceOrigin("DIST", False)
    varsR = hpar.getVarsBySourceOrigin("RASTER", False)

    noRequiredNewFC = (len(varsD) + len(varsR)) == 0


    if len(vars):
        for tField in vars:
            rfTest.addXVariableFromDataObject(name = tField.upper(),
                                              userType = vars[tField]["rfType"],
                                              source = "FC",
                                              alias = vars[tField]["alias"])
    if not noRequiredNewFC:
        #### Create Scratcth FC ####
        nFeaturesToPredict = UTILS.returnScratchName("FC_RF_", 
                                        scratchWS = ARCPY.env.scratchGDB) 

        nFeaturesToPredict, idField, useCopy = newFCFromSSDO(ssdo, nFeaturesToPredict)
        if len(varsD):
            pathD = [varsD[i]["sourceData"] for i in varsD]
            dataList = getNearFeature(nFeaturesToPredict, pathD, rfTest.distanceUnit) 
            for id, tField in enumerate(varsD):
                rfTest.addXVariableFromArray(name = tField.upper(),
                                             userType =  "Numeric",
                                             dataInfo =  dataList[id],
                                             source =  "DIST",
                                             inputType = "Double")

        if len(varsR):
            pathR = [varsR[i]["sourceData"] for i in varsR]
            namesR = [varsR[i]["alias"] for i in varsR]
            typeRasters = [varsR[i]["rfType"] for i in varsR]
            dataList, maskTotal, nullR, opr = extractFeatureFromRaster(ssdo, pathR, namesR, typeRasters, nFeaturesToPredict,
                                                                       useCopy = useCopy) 
            if dataList is None:
                ARCPY.AddIDMessage("ERROR", 110183)
                raise SystemExit

            for id, tField in enumerate(varsR):
                rfTest.addXVariableFromArray(name = tField.upper(),
                                              userType = varsR[tField]["rfType"],
                                              dataInfo = dataList.T[id],
                                              source = "RASTER", 
                                              inputType = "Double", 
                                              maskedOut = nullR)

        if useCopy:
            UTILS.passiveDelete(nFeaturesToPredict)

    return maskTotal


def evaluateRF(percentage, headerFile, xDataFile,
               yDataFile, tHeaderFile = None, xTestFile = None,
               numTrees = 100, leafSize = 1, 
               sampleSize = 100, fields_to_try = 2, maxLevel = -1,
               what = "NONE", balance = False, iterations = 1):
    """
    Evaluate a RF from Numpy File Objects
    """
    train = InfoForestField(percentage,0)
    train.loadHeaderfromTextFile(headerFile)
    train.x = NUM.load(xDataFile)
    train.y = NUM.load(yDataFile)
    train.iterations = iterations
    train.balanceTree = int(balance)
    train.uncertainty = 1
    test = None
    if tHeaderFile is not None:
        test = InfoForestField(percentage,0,  isTraining = False)
        test.loadHeaderfromTextFile(tHeaderFile)
        test.x = NUM.load(xTestFile)
        test.generateXVariable(fillVar = False, balance = balance)

    train.generateXVariable(fillVar = False, balance = balance)
    train.isModel = False
    train.numTrees = numTrees
    train.leafSize = leafSize
    train.sample_size = sampleSize
    train.fields_to_try = fields_to_try
    train.outputTrainedFeature = None
    train.what = what
    train.outputDiagnostic = None
    train.outputTrainedFeatures = None
    train.outputFeatures = None
    train.outputRaster = None
    train.maxLevel = maxLevel
    exr = RunRF(train, percentage, None)
    exr.executeModel(train, test )

def MCCFunction(y_true, y_pred):
    """Macro MCC"""

    indices, actual = NUM.unique(y_true, return_counts = True)
    actual = NUM.asarray(actual, dtype = float)
    binCorrect = y_true == y_pred 
    s = len(y_true)
    c = binCorrect.sum()
    predCount = NUM.array([ (val==y_pred).sum() for val in indices], dtype = float)
    #correct = NUM.array([ ((val == y_true)*(binCorrect)).sum() for val in v ], dtype = float)
    pt = (actual*predCount).sum()
    mcc = (c*s - pt)/(NUM.sqrt((s**2 - (actual*actual).sum())*(s**2 - (predCount*predCount).sum() )))
    return mcc

def F1ScoreFunction(y_true, y_pred):
    """Macro F1-Score """
    n= len(y_true)
    indices, actual = NUM.unique(y_true, return_counts = True)
    actual = NUM.asarray(actual, dtype = float)
    binCorrect = y_true == y_pred
    TPs = NUM.array([((val == y_true)*(binCorrect)).sum() for val in indices ], dtype = float)
    preCnt = NUM.array([(val == y_pred).sum() for val in indices ], dtype = float)
    FNs = actual-TPs
    FPs = preCnt-TPs
    F1s = 2*TPs /(2*TPs +FPs + FNs)
    return F1s.mean()



class RunRF(object):
    """
    Run Model depending on type of input
    """
    def __init__(self, hpar, randSeed, parameters):
        self.hpar = hpar
        self.randSeed = randSeed
        self.rasterDimensionInfo  = None
        self.rfTraining = None
        self.parameters = parameters
        self.infoRasterInstances = None
        self.listRasterW = None
        self.isXGB = self.hpar.isXGB
        self.modelData ={}

    def createOutputRasterFromTemporalFile(self, outputRasterPath, rasterDimensionInfoSet, data):
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

        wkspc, nameFile = self.createTemporalFLT(cellSize, (xMin, yMin), (nRows, nCols), data = data)
        flt = OS.path.join(wkspc,"{0}.flt".format(nameFile))
        hdr = OS.path.join(wkspc,"{0}.hdr".format(nameFile))
        ARCPY.env.outputCoordinateSystem = rasterDimensionInfoSet.srf
        ARCPY.management.CopyRaster(flt, outputRasterPath, None, None, NULL, "NONE",
                                       "NONE", None, "NONE", "NONE", None, "NONE")

        try:
            OS.remove(hdr)
            OS.remove(flt)
        except:
            ARCPY.AddIDMessage("WARNING", 10040, flt)
            pass
        return None

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
            ARCPY.AddIDMessage("ERROR", 10034, flt)
            raise SystemExit()

        done = ARC._ss.output_flt(flt, data)

        #### Exit - Function Was Cancelled / Couldn't be Created ####
        if not done:
            raise SystemExit()

        return pathNC , r"nc"+ randomName

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

    def createTemporalNC(self, rasterDimensionInfoSet, chunkSizes = None, data = None, outputRasterPath = None):
        """ Create temporal NetCDF file
        INPUT:
            rasterInfo (RasterInfo Instance): raster object
            data (2d array): array
            outputPath (str): output path
        """

        pathNC = UTILS.returnScratchFolder()
        pathNC = pathNC + r"\nc"+ str(NUM.random.randint(1000000)) + ".nc"
        f = NET.Dataset(pathNC, 'w')
        f.createDimension('y', rasterDimensionInfoSet.nRows)
        f.createDimension('x', rasterDimensionInfoSet.nCols)
        Y = None
        X = None
        isGCS = rasterDimensionInfoSet.isGCS

        if isGCS:
            Y = f.createVariable('y', 'f8', ('y' ))
            Y.long_name = 'latitude coordinate'
            Y.standard_name = 'latitude'
            Y.units = 'degrees_north'
            X = f.createVariable('x', 'f8', ('x' ))
            X.long_name = 'longitude coordinate'
            Y.standard_name = 'longitude'
            Y.units = 'degrees_east'
        else:
            Y = f.createVariable('y', 'f8', ('y' ))
            Y.long_name = 'y coordinate of projection'
            Y.standard_name = 'projection_y_coordinate'
            Y.units = rasterDimensionInfoSet.unitCell
            X = f.createVariable('x', 'f8', ('x' ))
            X.long_name = 'x coordinate of projection'
            X.standard_name = 'projection_x_coordinate'
            X.units = rasterDimensionInfoSet.unitCell

        variable = f.createVariable('PREDICTED', 'f4', ('y', 'x'), fill_value = NULL)
        variable.long_name= "prediction"
        variable.missing_value = NULL
        variable.coordinate = "x, y"
        variable.esri_pe_string = rasterDimensionInfoSet.srf.exportToString()
        #variable.unit = rasterInfo.srf.units

        Y[:] = rasterDimensionInfoSet.getYs()
        X[:] = rasterDimensionInfoSet.getXs()

        if data is None:
            return f , variable, pathNC

        variable[:] = data
        f.close()

        strOut = "RFNC_OUTPUT"
        ARCPY.md.MakeNetCDFRasterLayer(pathNC, "PREDICTED", "x", "y", strOut, None, None, "BY_VALUE")

        ARCPY.management.CopyRaster(strOut, outputRasterPath, None, None, NULL, "NONE", "NONE", None, "NONE", "NONE", None, "NONE")

        UTILS.passiveDelete(strOut)

        try:
            OS.remove(pathNC)
        except:
            ARCPY.AddIDMessage("WARNING", 10040, pathNC)
            pass

        return

    def outputRaster(self, info, newSRF = None, getNValues = None, dataBase = None, outputPath = "", applyLayerB = True, isProb = False):
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

        hpar = self.hpar
        if self.rasterDimensionInfo is not None:
            sliceData, goodPointsIdsTesting, intersection, cellSize, nRows, nCols = self.rasterDimensionInfo

            if newSRF is  None:
                newSRF = self.rfTraining.ssdo.spatialRef

            ####  Output Raster If Path is Defined ####
            if outputPath != "":

                #### Check Type Output ####
                isClass = self.rfTraining.yField.rfType == categoricalVar
                infoCat = self.rfTraining.yField.info

                if dataBase is None:
                    dataBase = NUM.ones((self.infoRasterInstances.nRows*self.infoRasterInstances.nCols), dtype = float)*NULL
                    dataBase[goodPointsIdsTesting] = info
                else:
                    dataBase[goodPointsIdsTesting] = NUM.asarray(info, dtype = NUM.float32)

                    #### Accumulate Values ####
                    if getNValues is not None:

                        #### Get Current Classes in the prediction ####
                        if isClass and not isProb:
                            return [id for id, i in enumerate(infoCat)]

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
                createRaster(dataBase, newSRF, intersection[0], intersection[1], 
                                cellSize, cellSize, outputPath)

                dataV = None

                if isClass:
                    dataV = (infoCat, [id for id, i in enumerate(infoCat)])
                else:
                    dataV = info

                if applyLayerB:
                    #### Apply Raster ####
                    applyLayer(hpar, "output_raster", data = dataV,
                                isClass = isClass, headingName = self.rfTraining.yField.name,
                                shapeType = "Raster", isTrainingOutput = False, isRasterLayer = True)

    def displayImportance(self, rfTraining, importance, report):
        """ Select type importance table depending on model type """
        if not self.isXGB:
            return self.displayImportanceRF(rfTraining, importance, report)
        else:
            return self.displayImportanceXGB(rfTraining, importance, report)

    def displayImportanceRF(self, rfTraining, importance, report):
        """Get String with Importance information
        INPUT:
            rfTraining (InfoForestField instance): Trainig information 
            importance (1D Array): Importance 
            report (str): Initial String
        OUTPUT:
            str : Concatenate report and importance table
        """

        numVarToDisp = 20
        header = ARCPY.GetIDMessage(84834)
        head  = [ARCPY.GetIDMessage(84622), ARCPY.GetIDMessage(84835), "%"]
        rows = []
        rows.append(head)
        nVar = len(importance)
        total = importance.sum()
        values = NUM.zeros((len(importance),3), dtype= float)
        values.T[0] = NUM.arange(nVar)
        values.T[1] = importance

        #### Check Total Zero or NaN ####
        if NUM.isnan(total) or total == 0:
            total = 1.0

        values.T[2] = 100*importance/total
        indices = NUM.argsort(importance)[::-1]
        if nVar > numVarToDisp:
            indices = indices[0:numVarToDisp]
        values = values[indices,:]

        for i in values:
            row = [rfTraining.fields[int(i[0])].alias,  
                   LOCALE.format_string("%0.2f", i[1]), LOCALE.format_string("%0.0f", i[2]) ]
            rows.append(row)
        outputReport = UTILS.outputTextTable(rows, header = header,
                                             justify = ["left", "right", "right"],
                                             pad = 1, colPad = 14,
                                             titleFillToken = "-", force2Txt=False)
        return report + outputReport

    def displayImportanceXGB(self, rfTraining, importance, report):
        """Get String with Importance information
        INPUT:
            rfTraining (InfoForestField instance): Trainig information 
            importance (1D Array): Importance 
            report (str): Initial String
        OUTPUT:
            str : Concatenate report and importance table
        """

        numVarToDisp = 20
        header = ARCPY.GetIDMessage(84834)
        head  = [ARCPY.GetIDMessage(84622), ARCPY.GetIDMessage(220666), "%", ARCPY.GetIDMessage(220667), "%"]
        rows = []
        rows.append(head)
        importance = importance.reshape((int(len(importance)/3),3))
        
        nVar = importance.shape[0]
        total1 = importance.T[0].sum()
        total2 = importance.T[2].sum()
        values = NUM.zeros((len(importance),5), dtype= float)
        values.T[0] = NUM.arange(nVar)
        values.T[1] = importance.T[0]
        values.T[3] = importance.T[2]

        #### Check Total Zero or NaN ####
        if NUM.isnan(total1) or total1 == 0:
            total1 = 1.0

        if NUM.isnan(total2) or total2 == 0:
            tota2 = 1.0

        values.T[2] = 100*importance.T[0]/total1
        indices = NUM.argsort(importance.T[0])[::-1]
        values.T[4] = 100*importance.T[2]/total2
        
        if nVar > numVarToDisp:
            indices = indices[0:numVarToDisp]

        values = values[indices,:]

        for i in values:
            row = [rfTraining.fields[int(i[0])].alias,  
                   LOCALE.format_string("%0.2f", i[1]), LOCALE.format_string("%0.0f", i[2]),
                   LOCALE.format_string("%0.2f", i[3]), LOCALE.format_string("%0.0f", i[4])
                   ]
            rows.append(row)
        outputReport = UTILS.outputTextTable(rows, header = header,
                                             justify = ["left", "right", "right","right", "right"],
                                             pad = 1, colPad = 14,
                                             titleFillToken = "-", force2Txt=False)
        return report + outputReport

    def report(self, rfTraining, data, hpar,
               randSeed, bestValue, listDecValues, maxIndexReach, 
               ssdoPoints2Train = None, rfTest = None, displayShare = True):

        if int(hpar.uncertainty) == 0:
            trainedData, testingData, predictData, errors, \
            classErrors, varianceErrors, importance, depth, \
            trainedProb, testingProb, predictProb = data
        else:
            trainedData, testingData, predictData, errors,  \
            classErrors, varianceErrors, importance, depth, \
            trQ1, trQ2, teQ1, teQ2, prQ1, prQ2 = data


        shareBase = self.getMinMaxX(rfTraining, rfTraining.x)
        self.modelData["shareBase"] = NUM.asarray(shareBase, dtype = float)

        if displayShare:
            shareTraining = self.getMinMaxX(rfTraining,  rfTraining.x_train)
            shareTest = self.getMinMaxX(rfTraining,  rfTraining.x_test)

            self.modelData["shareTraining"] = NUM.asarray(shareTraining, dtype = float)
            self.modelData["shareTest"] = shareTest

            if shareTest is not None:
                self.modelData["shareTest"] = NUM.asarray(shareTest, dtype = float)

            if rfTest is None:
                shareMsg = self.reportShare(rfTraining, shareBase, shareTraining, shareTest)

            else:
                sharePredict = self.getMinMaxX(rfTraining,  rfTest.x)
                shareMsg = self.reportShare(rfTraining, shareBase, shareTraining, shareTest, sharePredict)

        self.modelData["depth"] = depth
        self.modelData["numTrees"] = hpar.numTrees
        self.modelData["leafSize"] = self.hpar.leafSize
        self.modelData["sample_size"] = self.hpar.sample_size
        self.modelData["fields_to_try"] = self.hpar.fields_to_try
        self.modelData["splitPercentage"] = rfTraining.splitPercentage
        self.modelData["importance"] = importance

        if self.hpar.isXGB:
            self.modelData["learningRate"] = self.hpar.xgbPar[0]
            self.modelData["lambdaValue"] = self.hpar.xgbPar[2]
            self.modelData["gammaValue"] = self.hpar.xgbPar[3]
            self.modelData["maxBins"] = self.hpar.xgbPar[4]

        reportParam = self.displayParameters()
        report = self.displayInfoModel(errors, rfTraining, hpar.numTrees, reportParam, 
                                       importance, varianceErrors, classErrors)

        self.createOutputDiagnostic(rfTraining, importance, hpar)

        staReport = self.createOutputFromRFField(rfTraining, hpar.outputTrainedFeatures, 
                                                    data, hpar,
                                                    ssdoTrField = ssdoPoints2Train)
        info = ""
        if testingData is not None and len(testingData) > 0:
            self.modelData["randSeed"] = randSeed
            self.modelData["bestValue"] = bestValue
            info = self.reportCrosValidation(rfTraining, randSeed, bestValue, listDecValues, maxIndexReach)


        ### Store Variables in model ###
        if hpar.outputModel != "":
            rfTraining.saveData(hpar.outputModel, self.modelData, "FB")


        if displayShare:
            ARCPY.AddMessage(report + staReport + info)
            for rep in shareMsg:
                ARCPY.AddMessage(rep)
        else:
            ARCPY.AddMessage(report + staReport + info )

    def __calAvgError(self, listInfo, ind):
        """ Calculate Avg in a list until reach a index 
        INPUT:
            listInfo (list): List
            ind (int): index
        """
        sum = 0
        for i in NUM.arange(0, ind+1):
            sum += listInfo[i]
        return sum/(ind+1)

    def displayInfoModelOfAllTrees(self, errors , rfTraining, numTrees, report , importance, varianceErrors, classErrors):
        """Display OOB Errors
        INPUT:
            data (1D array): OOB errors
            rfTraining (InfoForestField instance): Trainig information 
            numTrees  (int): Number of Trees
            report (str): String to concatenate width
            importance (1D array): importance values
            varianceError(1D array): Variance Error
        OUTPUT: 
            str : Concatenated report and OOB errors
        """
        if self.hpar.isXGB:
            return self.displayImportance(rfTraining, importance, report )

        ini = (numTrees // 2)
        end = numTrees-1
        error50 = self.__calAvgError(errors, ini)
        error100 = self.__calAvgError(errors, end)
        header = ARCPY.GetIDMessage(84817)
        rows = []
        if end > 0:
            head  = [ARCPY.GetIDMessage(84811)] + [str(i) for i in NUM.arange(numTrees)] 
        else:
            head  = [ARCPY.GetIDMessage(84811), str(end+1)]

        rows.append(head)
        outputReportI = ""
        pad = 1
        just = None
        colPad = 7
        if rfTraining.yField.rfType ==  categoricalVar:
            just = ["left"]+ ["right"]*numTrees
            if end > 0:
                total = [ARCPY.GetIDMessage(84819)] + [LOCALE.format_string("%0.3f", errors[i]) for i in  NUM.arange(numTrees)]
            else:
                just = ["left", "right"]
                total = [ARCPY.GetIDMessage(84819), LOCALE.format_string("%0.3f", error100) ]
                colPad = 30
            rows.append(total)

            clasError = classErrors.reshape(numTrees, len(rfTraining.yField.info))
            if end > 0:
                valueError = [" ", " ", " "]
            else:
                valueError = ["" ," "]
            rows.append(valueError)
            for index, i in enumerate(rfTraining.yField.info):
                if end > 0:
                    valueError = [i] + [LOCALE.format_string("%0.3f", clasError[ini, index]) if clasError[ini, index] >=0 else "NA"
                                  for ini in NUM.arange(numTrees)]
                else:
                    valueError = [i, LOCALE.format_string("%0.3f", clasError[end, index]) if clasError[end, index] >=0 else "NA"]
                rows.append(valueError)
            pad = 1
        else:
            outputReportI = ""
            just = ["left", "right", "right"]
            if end > 0:
                total = [ARCPY.GetIDMessage(84819), LOCALE.format_string("%0.3f", error50),LOCALE.format_string("%0.3f", error100) ]
                var50 = self.__calAvgError(varianceErrors, ini)
                var100 = self.__calAvgError(varianceErrors, end)
                valueError = [ARCPY.GetIDMessage(84820), 
                          LOCALE.format_string("%0.3f", 100 -var50),LOCALE.format_string("%0.3f", 100 - var100) ]
            else:
                just = ["left", "right"]
                colPad = 25
                total = [ARCPY.GetIDMessage(84819), LOCALE.format_string("%0.3f", error100) ]
                valueError = [ARCPY.GetIDMessage(84820), LOCALE.format_string("%0.3f", 100 - varianceErrors[end]) ]

            rows.append(total)
            rows.append(valueError)

        outputReport = UTILS.outputTextTable(rows, header = header,
                                             justify = just, pad = pad, colPad = colPad,
                                             titleFillToken = "-",
                                             emphasizeHeadRow=False, force2Txt=False)

        reportVal  = outputReportI + outputReport

        return self.displayImportance(rfTraining, importance, report + reportVal)

    def displayInfoModel(self, errors , rfTraining, numTrees, report , importance, varianceErrors, classErrors):
        """Display OOB Errors
        INPUT:
            data (1D array): OOB errors
            rfTraining (InfoForestField instance): Trainig information 
            numTrees  (int): Number of Trees
            report (str): String to concatenate width
            importance (1D array): importance values
            varianceError(1D array): Variance Error
        OUTPUT: 
            str : Concatenated report and OOB errors
        """
        if self.hpar.isXGB or  (varianceErrors is None  and  classErrors is None):
            return self.displayImportance(rfTraining, importance, report )

        ini = (numTrees // 2)
        end = numTrees-1
        error50 = self.__calAvgError(errors, ini)
        error100 = self.__calAvgError(errors, end)
        header = ARCPY.GetIDMessage(84817)
        rows = []
        if end > 0:
            head  = [ARCPY.GetIDMessage(84811), str(ini), str(end+1)]
        else:
            head  = [ARCPY.GetIDMessage(84811), str(end+1)]

        rows.append(head)
        outputReportI = ""
        pad = 1
        just = None
        colPad = 7
        if rfTraining.yField.rfType ==  categoricalVar:
            just = ["left", "right", "right"]
            if end > 0:
                total = [ARCPY.GetIDMessage(84819), LOCALE.format_string("%0.3f", error50),LOCALE.format_string("%0.3f", error100) ]
            else:
                just = ["left", "right"]
                total = [ARCPY.GetIDMessage(84819), LOCALE.format_string("%0.3f", error100) ]
                colPad = 30
            rows.append(total)

            clasError = classErrors.reshape(numTrees, len(rfTraining.yField.info))
            if end > 0:
                valueError = [" ", " ", " "]
            else:
                valueError = ["" ," "]
            rows.append(valueError)
            for index, i in enumerate(rfTraining.yField.info):
                if end > 0:
                    valueError = [i, LOCALE.format_string("%0.3f", clasError[ini, index]) if clasError[ini, index] >=0 else "NA"
                                  , LOCALE.format_string("%0.3f", clasError[end, index]) if clasError[end, index] >=0 else "NA"]
                else:
                    valueError = [i, LOCALE.format_string("%0.3f", clasError[end, index]) if clasError[end, index] >=0 else "NA"]
                rows.append(valueError)
            pad = 1
        else:
            outputReportI = ""
            just = ["left", "right", "right"]
            if end > 0:
                total = [ARCPY.GetIDMessage(84819), LOCALE.format_string("%0.3f", error50),LOCALE.format_string("%0.3f", error100) ]
                var50 = self.__calAvgError(varianceErrors, ini)
                var100 = self.__calAvgError(varianceErrors, end)
                valueError = [ARCPY.GetIDMessage(84820), 
                          LOCALE.format_string("%0.3f", 100 -var50),LOCALE.format_string("%0.3f", 100 - var100) ]
            else:
                just = ["left", "right"]
                colPad = 25
                total = [ARCPY.GetIDMessage(84819), LOCALE.format_string("%0.3f", error100) ]
                valueError = [ARCPY.GetIDMessage(84820), LOCALE.format_string("%0.3f", 100 - varianceErrors[end]) ]

            rows.append(total)
            rows.append(valueError)

        outputReport = UTILS.outputTextTable(rows, header = header,
                                             justify = just, pad = pad, colPad = colPad,
                                             titleFillToken = "-",
                                             emphasizeHeadRow=False, force2Txt=False)

        reportVal  = outputReportI + outputReport

        return self.displayImportance(rfTraining, importance, report + reportVal)

    def displayParameters(self):
        """
        Display Input Parameter
        """

        header = ARCPY.GetIDMessage(84810)
        rows = []
        depth = self.modelData["depth"]

        rows.append([ARCPY.GetIDMessage(84811), str(self.modelData["numTrees"])])
        rows.append([ARCPY.GetIDMessage(84812), str(self.modelData["leafSize"])])
        rows.append([ARCPY.GetIDMessage(84813), str(depth.min()) + "-" + str(depth.max())])
        rows.append([ARCPY.GetIDMessage(84836), str(int(depth.mean()))])
        rows.append([ARCPY.GetIDMessage(84814), str(self.modelData["sample_size"])])
        rows.append([ARCPY.GetIDMessage(84815), str(self.modelData["fields_to_try"])])
        rows.append([ARCPY.GetIDMessage(84816), str(self.modelData["splitPercentage"])])

        if self.hpar.isXGB:
            rows.append([ARCPY.GetIDMessage(220669),  LOCALE.format_string("%0.2f",self.modelData["lambdaValue"])])
            rows.append([ARCPY.GetIDMessage(220670),  LOCALE.format_string("%0.2f",self.modelData["gammaValue"])])
            rows.append([ARCPY.GetIDMessage(220668),  LOCALE.format_string("%0.2f",self.modelData["learningRate"])])
            rows.append([ARCPY.GetIDMessage(220671),  LOCALE.format_string("%d", self.modelData["maxBins"])])

        outputReport = UTILS.outputTextTable(rows, header = header,
                                             justify = ["left", "right"], pad = 1, colPad = 5,
                                             titleFillToken = "-",
                                             emphasizeHeadRow=False, force2Txt=False)
        return outputReport

    def createOutputDiagnostic(self, rfField, importance, hpar):
        """This method creates the diagnostic table and Chart of importance depending on model"""
        if not self.isXGB:
            self.createOutputDiagnosticRF(rfField, importance, hpar)
        else:
            self.createOutputDiagnosticXGB(rfField, importance, hpar)

    def createOutputDiagnosticRF(self, rfField, importance, hpar):
        """
        This method creates the diagnostic table and Chart of importance
        INPUT:
            rfField (InfoForestField): RF Field
            importance (1D array): importance
            hpar (HandlePar instance): Parameters information
        """

        if hpar.outputDiagnostic not in  [ "", None] and hpar.iterations == 1:
            fields = []
            field = SSDO.CandidateField(name = "VARIABLES",
                            type = "TEXT",
                            data = NUM.array([i.alias for i in rfField.fields]))
            impField = SSDO.CandidateField(name = "IMPORTANCE",
                            type = "DOUBLE",
                            data = importance)
            total = importance.sum()
            fields.append(field)
            fields.append(impField)

            if total > 0:
                perc = NUM.round(100* importance /total,3)
                perField = SSDO.CandidateField(name = "PERCENTAGE",
                            type = "DOUBLE",
                            data = perc)
                fields.append(perField)


            #### Get Output Table Name With Extension if Appropriate ####
            hpar.outputDiagnostic, dbf = UTILS.returnTableName(hpar.outputDiagnostic)

            #### Adjust Field Length of Text fields ####
            UTILS.adjustCandidateFieldLengthByArrayDtype(fields)

            ARC._ss.output_table_from_candidate_fields(hpar.outputDiagnostic, len(importance),
                                                        fields)
            try:
                title = ARCPY.GetIDMessage(84841)
                chart = ARCPY.Chart(title)
                chart.type = "bar"
                chart.xAxis.field = "VARIABLES"
                chart.xAxis.title  = ARCPY.GetIDMessage(84842)
                chart.bar.rotated = True
                chart.title = title
                chart.yAxis.field = "IMPORTANCE"
                chart.yAxis.title = ARCPY.GetIDMessage(84835)
                chart.yAxis.sort = "desc"
                hpar.outputDiagnosticParameter.charts = [chart]
            except:
                pass

    def createOutputDiagnosticXGB(self, rfField, importance, hpar):
        """
        This method creates the diagnostic table and Chart of importance
        INPUT:
            rfField (InfoForestField): RF Field
            importance (1D array): importance
            hpar (HandlePar instance): Parameters information
        """

        if hpar.outputDiagnostic not in  [ "", None] and hpar.iterations == 1:

            importanceXGB = importance.reshape((int(len(importance)/3),3))
            importance = importanceXGB.T[0]
            importanceCover = importanceXGB.T[1]
            importanceW = importanceXGB.T[2]
            fields = []

            field = SSDO.CandidateField(name = "VARIABLES",
                            type = "TEXT",
                            data = NUM.array([i.alias for i in rfField.fields]))
            impField = SSDO.CandidateField(name = "IMPORTANCE",
                            alias = ARCPY.GetIDMessage(220666),
                            type = "DOUBLE",
                            data = importance)
            total = importance.sum()

            impFieldCover = SSDO.CandidateField(name = "IMP_COVER",
                            type = "DOUBLE",
                            alias = ARCPY.GetIDMessage(220672),
                            data = importanceCover)
            total2 = importanceCover.sum()

            impFieldW = SSDO.CandidateField(name = "IMP_WEIGHT",
                            type = "DOUBLE",
                            alias = ARCPY.GetIDMessage(220667),
                            data = importanceW)
            total3 = importanceW.sum()

            fields.append(field)
            fields.append(impField)
            fields.append(impFieldCover)
            fields.append(impFieldW)

            if total > 0:
                perc = NUM.round(100* importance /total,3)
                perField = SSDO.CandidateField(name = "PERCENTAGE",
                            alias = ARCPY.GetIDMessage(220666)+" %",
                            type = "DOUBLE",
                            data = perc)
                fields.append(perField)

            if total2 > 0:
                perc2 = NUM.round(100* importanceCover /total2,3)
                perFieldC = SSDO.CandidateField(name = "PER_COVER",
                            type = "DOUBLE",
                            alias = ARCPY.GetIDMessage(220672)+" %",
                            data = perc2)
                fields.append(perFieldC)
            if total3 > 0:
                perc3 = NUM.round(100* importanceW /total3,3)
                perFieldW = SSDO.CandidateField(name = "PER_WEIGHT",
                            type = "DOUBLE",
                            alias = ARCPY.GetIDMessage(220667) +" %",
                            data = perc3)
                fields.append(perFieldW)

            #### Get Output Table Name With Extension if Appropriate ####
            hpar.outputDiagnostic, dbf = UTILS.returnTableName(hpar.outputDiagnostic)

            #### Adjust Field Length of Text fields ####
            UTILS.adjustCandidateFieldLengthByArrayDtype(fields)

            ARC._ss.output_table_from_candidate_fields(hpar.outputDiagnostic, len(importance),
                                                        fields)
            try:
                title = ARCPY.GetIDMessage(84841)
                chart = ARCPY.Chart(title)
                chart.type = "bar"
                chart.xAxis.field = "VARIABLES"
                chart.xAxis.title  = ARCPY.GetIDMessage(84842)
                chart.bar.rotated = True
                chart.title = title
                chart.yAxis.field = "IMPORTANCE"
                chart.yAxis.title = ARCPY.GetIDMessage(220666)
                chart.yAxis.sort = "desc"
                hpar.outputDiagnosticParameter.charts = [chart]
            except:
                pass

    def setResidualField(self, candFields, data, dataPred, fieldSupportY, isClass, outputField):
        """
        Add Residual / Same_Class Field in the list of fields
        INPUT:
            candField (list CandidateField): List of Candidate Fields
            data  (array 1d): True Values array
            dataPred (array 1d): Predicted Values array
            fieldSupportY (type str): Type of Field For Residuls
            isClass (bool): Is Classification
            outputField  (dtype): dtype for Residuals
        RETURN:
            field - > residual/indicator
        """
        #### Don't Create Residual Field  ####
        if dataPred is None:
            return

        pField = None
        if isClass:

            diff = NUM.ones(len(data), dtype = int)

            for i in NUM.arange(len(data)):
                if data[i] != dataPred[i]:
                    diff[i] = 0
        
            pField = SSDO.CandidateField(name = "SAME_CLASS",
                                            alias = "Correctly Classified",
                                            type = "LONG",
                                            data = diff)
            candFields.append(pField)

        else:
            diff = data -dataPred
            mean = diff.mean()
            std = NUM.sqrt(diff.var())
            pFieldE = SSDO.CandidateField(name = "RESIDUAL",
                                alias = "Residual",
                                type = fieldSupportY,
                                data = NUM.asarray(diff, dtype = outputField)
                                )
            candFields.append(pFieldE)

            if std > 0:
                stde = (diff - mean)/std
            else:
                stde = (diff - mean)
            
            pField = SSDO.CandidateField(name = "STDRESID",
                                alias = "Standardized Residual",
                                type = fieldSupportY,
                                data = NUM.asarray(stde, dtype = outputField)
                                )
            candFields.append(pField)

        return pField

    def extractStatistics(self, rfTrained, allInfoData):
        """Extract Statistics from Forest Output
        INPUT:
            rfTrained (InfoForestField Instance): Trained Object
            allInfoData (tuple arrays): (Trained Output, Tested Output)
        OUTPUT:
            outputData (double/tuple): double R^2, tuple (class, f1, mcc, sen, acc)
        """
        trainedData = None
        testingData = None
        getStatistics = False

        predictedData = NUM.zeros(len(rfTrained.y), dtype = float)
        sourceData = rfTrained.y

        if allInfoData is not None:

            #### Return Array with Predicted values from Training ####
            trainedData, testingData = allInfoData
            predictedData[rfTrained.train_split_indices] = trainedData

            #### If Trained Data Was Splitted ####
            if len(rfTrained.test_split_indices) > 0:
                predictedData[rfTrained.test_split_indices] = testingData

                if len(rfTrained.test_split_indices) < 2:
                    return None

            testTrainedData = sourceData[rfTrained.test_split_indices]
            testPredData = predictedData[rfTrained.test_split_indices]
            outputData = []

            if rfTrained.yField.rfType == "Categorical":

                #### Accumulate Values in Confusion Matrix ####
                tnTP = 0
                for index  in NUM.arange(len(rfTrained.test_split_indices)):
                    if testTrainedData[index] == testPredData[index]:
                        tnTP += 1

                n = len(testTrainedData)

                return tnTP/n

            else:
                slope, intercept, r_value, p_value, std_err = SCPS.linregress(testTrainedData, testPredData )
                outputData = r_value**2

            return outputData

        return None

    def createOutputFromRFField(self, rfTrained, outputFC, allInfoData, hpar, ssdoTrField = None):
        """
        Create Output Feature Class using output generated by RF
        INPUT:
            rfTrained {InfoForestField}: Random Objected from trained  
            outputFC {str}: Output Path
        """

        infoDataQ1 = None
        infoDataQ2 = None
        infoProb   = None

        trainedData = testingData = predictData = errors = \
        classErrors = varianceErrors = importance = depth = \
        trainedProb = testingProb = predictProb =\
        trQ1 = trQ2 = teQ1 = teQ2 = prQ1 = prQ2 = None

        if allInfoData is not None:
            if int(hpar.uncertainty) == 0:
                trainedData, testingData, predictData, errors, \
                classErrors, varianceErrors, importance, depth, \
                trainedProb, testingProb, predictProb = allInfoData
                infoProb = NUM.zeros(len(rfTrained.y), dtype = float)
            else:
                trainedData, testingData, predictData, errors,  \
                classErrors, varianceErrors, importance, depth, \
                trQ1, trQ2, teQ1, teQ2, prQ1, prQ2 = allInfoData

            allInfoData = (trainedData, testingData)
            infoDataQ1 = NUM.zeros(len(rfTrained.y), dtype = float)
            infoDataQ2 = NUM.zeros(len(rfTrained.y), dtype = float)

        allProbTrained = None
        allProbTesting = None

        if allInfoData is not None and  hpar.addProbabilities:
            allProbTrained  = trainedProb[len(trainedData):].reshape((len(trainedData), len(rfTrained.yField.info)))

            if testingData is not None  and len(testingData) > 0  :
                allProbTesting  = testingProb[len(testingData):].reshape((len(testingData), len(rfTrained.yField.info)))
            else:
                allProbTesting  = None

            trainedProb = trainedProb[0:len(trainedData)]

            if testingData is not None:
                testingProb =  testingProb[0:len(testingData)]

        def getDataProbPerClass(n, allProbTrained, allProbTesting, indicesTrain, indicesTest, index, infoClasses):
            """Get Data Probabilities"""

            if allProbTrained is None:
                return None

            infoProbClass = NUM.zeros(n, dtype = float)
            infoProbClass[indicesTrain] = allProbTrained.T[index]

            if allProbTesting is not None and indicesTest is not None and len(indicesTest):
                infoProbClass[indicesTest] = allProbTesting.T[index]

            name = fr"PROB_{(index+1):02}"
            alias = fr"Probability: {infoClasses[index]}"
            fieldProb = SSDO.CandidateField(name = name,
                                             alias = alias,
                                             type = "DOUBLE",
                                             data = infoProbClass)
            return fieldProb

        typeNumpyField = None
        dictClasses = {}
        dataP = None
        useExplodeData = False
        printStatistics = False
        trainedData = None
        testingData = None
        report = ""
        data = None

        if ssdoTrField is not None:
            useExplodeData = True

        infoData = NUM.zeros(len(rfTrained.y), dtype = float)

        if allInfoData is not None:
            #### Return Array with Predicted values from Training ####
            trainedData, testingData = allInfoData
            infoData[rfTrained.train_split_indices] = trainedData

            if int(hpar.uncertainty) == 1:
                infoDataQ1[rfTrained.train_split_indices] = trQ1
                infoDataQ2[rfTrained.train_split_indices] = trQ2
            else:
                infoProb[rfTrained.train_split_indices] = trainedProb

            #### If Trained Data Was Splitted ####
            if len(rfTrained.test_split_indices) > 0:
                infoData[rfTrained.test_split_indices] = testingData

                if int(hpar.uncertainty) == 1:
                    infoDataQ1[rfTrained.test_split_indices] = teQ1
                    infoDataQ2[rfTrained.test_split_indices] = teQ2
                else:
                    infoProb[rfTrained.test_split_indices] = testingProb

                if len(rfTrained.test_split_indices) > 2:
                    printStatistics = True
                else:
                    ARCPY.AddIDMessage("Warning", 110198)

        #### Contain All Predicted Data in Trained Dataset ####
        rfTrained.trainedAndTested = infoData

        fieldSupportY = convertTypeSupportedByFastOutput[rfTrained.yField.fieldType]

        #### Check Type Field To be Predicted ####
        isClass = rfTrained.yField.rfType == "Categorical"

        if isClass:
            #### Creat a Dictionary With Categories ####
            dictClasses = { id:value for id, value in enumerate(rfTrained.yField.info)}
            typeNumpyField = UTILS.numpyConvert[rfTrained.yField.fieldType]

            #### Calculate the maximum string size ####
            size = None
            if typeNumpyField =='U%i':
                size = max(map(len, rfTrained.yField.info))
                typeNumpyField = 'U'+str(size)

            #### Initialize Ouput Arrays ####
            data = NUM.zeros(len(rfTrained.y), dtype = typeNumpyField)
            dataP = NUM.zeros(len(rfTrained.y), dtype = typeNumpyField)

            #### Introduce Predicted values in the output data array ####
            for value in dictClasses:
                data[rfTrained.y == float(value)] = dictClasses[value]
                dataP[infoData == float(value)] = dictClasses[value]

            outputField = numpy2FormatSupport(fieldSupportY, size)

        else:
            outputField = numpy2FormatSupport(fieldSupportY)
            data = rfTrained.y
            dataP = infoData

        #### Print Statistics of Training Dataset ####
        trainData = data[rfTrained.train_split_indices]
        predData = dataP[rfTrained.train_split_indices]

        #### Generate Statistics Depending on Type Classification / Regression ####
        if rfTrained.yField.rfType == "Categorical":
            reportClas, valuesClas= statisticsForClassification(rfTrained, trainData, predData, isTesting = False)

            self.modelData["statTraining"] = NUM.asarray(valuesClas, dtype = float)

            report +=  reportClas + "\n"
        else:
            reportReg, valuesReg = statisticsForRegression(trainData, predData, isTesting = False )
            self.modelData["statTraining"] =  NUM.asarray(valuesReg, dtype = float)

            report += reportReg + "\n"

        #### Print Statistics of Testing Data Set ####
        if printStatistics:
            testTrainedData = data[rfTrained.test_split_indices]
            testPredData = dataP[rfTrained.test_split_indices]
            if rfTrained.yField.rfType == "Categorical":
                reportClas, valuesClas = statisticsForClassification(rfTrained, testTrainedData, testPredData, hpar = hpar)

                self.modelData["statTest"] = NUM.asarray(valuesClas, dtype = float)

                report += reportClas
            else:
                reportReg, valuesReg = statisticsForRegression(testTrainedData, testPredData )

                self.modelData["statTest"] = NUM.asarray(valuesReg, dtype = float)

                report += reportReg

        #### Get Statistics Without Generating an Output ###
        if outputFC in [None, ""]:
            return report

        ###Updata RF fields ####
        candFields = []

        dataSourceId = None
        if not useExplodeData:
            ### Source ID ####
            if rfTrained.ssdo.hasOID64:
                dataSourceId = NUM.array(list(rfTrained.ssdo.master2Order.keys()), dtype = NUM.int64)
                sourceField = SSDO.CandidateField(name = "SOURCE_ID",
                                             alias = "Source ID",
                                             type = "BIGINTEGER",
                                             data = dataSourceId)
            else:
                dataSourceId = NUM.array(list(rfTrained.ssdo.master2Order.keys()), dtype = int)
                sourceField = SSDO.CandidateField(name = "SOURCE_ID",
                                             alias = "Source ID",
                                             type = "INTEGER",
                                             data = dataSourceId)
            candFields.append(sourceField)

        #### Get Infor of each Field ####
        for id, i in enumerate(rfTrained.fields):

            cfield = None
            fieldSupport = convertTypeSupportedByFastOutput[i.fieldType]
            if i.rfType == "Categorical":
                dictClassesV = { id:value for id, value in enumerate(i.info)}
                typeNumField  = UTILS.numpyConvert[i.fieldType.title().replace("integer", "Integer")]

                #### Calculate the maximum string size ####
                size = None
                if typeNumField =='U%i':
                    size = max(map(len, i.info))
                    typeNumField = 'U'+str(size)
                ndata = NUM.zeros(len(rfTrained.x), dtype = typeNumField)

                for value in dictClassesV:
                    tempIds = rfTrained.x.T[id] == float(value)
                    ndata[tempIds] = dictClassesV[value]

                cfield = SSDO.CandidateField(name = i.name,
                                         alias = i.alias,
                                         type = fieldSupport ,
                                         data = NUM.asarray(ndata, 
                                                            dtype = numpy2FormatSupport(fieldSupport, size)))
            else:
                cfield = SSDO.CandidateField(name = i.name,
                                         alias = i.alias,
                                         type = fieldSupport,
                                         data = NUM.asarray( rfTrained.x.T[id], 
                                                            dtype = numpy2FormatSupport(fieldSupport)))
            candFields.append(cfield)

        pFieldT = SSDO.CandidateField(name = "TRAINED_ID",
                                     alias = "Trained Features",
                                     type = "LONG",
                                     data = NUM.asarray(rfTrained.indicesTrain, dtype = int))
        candFields.append(pFieldT)

        pField = SSDO.CandidateField(name = rfTrained.yField.name,
                                     alias = rfTrained.yField.alias,
                                     type = fieldSupportY,
                                     data = NUM.asarray(data, dtype = outputField))
        candFields.append(pField)
        dataPred = None
        residualOutputField = outputField
        outType = fieldSupportY
        if not isClass:
            residualOutputField = NUM.float64
            outType = "DOUBLE"

        #### Do not Generate Predicted Field When allInfoData is None ####
        if allInfoData is not None:
            if isClass:
                dataPred = NUM.asarray(dataP, dtype = outputField)
            else:
                dataPred = NUM.asarray(dataP, dtype = NUM.float64)

            pField2 = SSDO.CandidateField(name = "PREDICTED",
                                         alias = rfTrained.yField.alias+"(Predicted)",
                                         type = outType,
                                         data = dataPred)
            candFields.append(pField2)

            if isClass:
                pFieldProb = SSDO.CandidateField(name = "PRED_PROB",
                                             alias ="Prediction Probability",
                                             type = "DOUBLE",
                                             data = infoProb)
                candFields.append(pFieldProb)
                if hpar.addProbabilities:

                    for index, i in enumerate(rfTrained.yField.info):
                        fieldProb = getDataProbPerClass(len(infoProb), 
                                                        allProbTrained, 
                                                        allProbTesting, 
                                                        rfTrained.train_split_indices, 
                                                        rfTrained.test_split_indices, 
                                                        index, 
                                                        rfTrained.yField.info)
                        if fieldProb is not None:
                            candFields.append(fieldProb)
                        else:
                            break

            if int(hpar.uncertainty) == 1:
                #### Add Extra fields for uncertainty ####
                self.addExtraFieldForUncertainty(dataPred, infoDataQ2, infoDataQ1, candFields, rfTrained.yField.alias)

        #### Create Residual Field ####
        resField = self.setResidualField(candFields, data, dataPred, outType, isClass, residualOutputField)

        paramName = "output_trained_features"

        cFields = UTILS.checkCandidateFieldName(candFields, outputFC)

        #### Adjust Field Length of Text fields ####
        UTILS.adjustCandidateFieldLengthByArrayDtype(cFields)

        if not useExplodeData:

            if rfTrained.ssdo.shapeType == "Polygon":
                ARC._ss.copy_selected_features_polygons(ssdo = rfTrained.ssdo,
                                               input_feature_class = rfTrained.ssdo.inputFC,
                                               output_feature_class = outputFC,
                                               subset_ids = dataSourceId,
                                               candidate_fields =  cFields,
                                               use_oid_64 = rfTrained.ssdo.hasOID64)
            else:

                ARC._ss.output_featureclass_from_dataobject(rfTrained.ssdo, outputFC,  cFields)

            if allInfoData is not None:
                applyLayer(hpar, paramName, dataPred, isClass,
                           headingName = rfTrained.yField.alias,
                           shapeType =  rfTrained.ssdo.shapeType, isTrainingOutput = True, residualField = resField)
                self.createUncertaintyPlot(paramName, rfTrained.yField.alias)


        else:
            ARC._ss.output_featureclass_from_dataobject(ssdoTrField, outputFC, cFields)
            if allInfoData is not None:
                applyLayer(hpar, paramName, dataPred, isClass,
                           headingName = rfTrained.yField.alias,
                           shapeType =  "Point", isTrainingOutput = True, residualField = resField)
                self.createUncertaintyPlot(paramName, rfTrained.yField.alias)

        if isClass and hpar.numTrees > 0:
            posParm = [id for id, i in enumerate(hpar.parameters) if hpar.parameters[id].name == paramName][0]
            fld = [ fld for fld in cFields if fld.alias ==  rfTrained.yField.alias ]

            if len(fld) == 1:
                nameField = fld[0].name
            else:
                nameField - rfTrained.yField.name

            chartList = []
            #### Create Bar Chart for Y and Predicted Y ####
            chartTitle = ARCPY.GetIDMessage(220655)
            barChart = ARCPY.Chart(chartTitle)
            barChart.type = "bar"
            barChart.title = chartTitle
            barChart.xAxis.field = "PREDICTED"
            barChart.yAxis.field = ""
            barChart.xAxis.sort = "asc"
            barChart.bar.aggregation = "COUNT"
            barChart.bar.splitCategory = nameField
            barChart.bar.multiSeriesDisplay = "stacked100"
            barChart.legend.title =  ARCPY.GetIDMessage(220681)
            chartList.append(barChart)

            try:
                heatChart = ARCPY.charts.MatrixHeat(x="PREDICTED", y=nameField, 
                                aggregation="COUNT", title=ARCPY.GetIDMessage(84887))
                chartList.append(heatChart)
            except:
                pass

            hpar.parameters[posParm].charts = chartList

        return report

    def addExtraFieldForUncertainty(self, dataPred, Q2, Q1, candFields, fieldAlias):
        """ Add Extra Field to support Sorting Uncertainty prediction 
        INPUT:
            dataPred {1D array}: Predicted data
            Q2 {1D array}: Quartile 95
            Q1:{1D array}: Quartile 5
            candFields {list}: List CandidateFields instances
            fieldAlias {str}: Alias Field  Name
        """

        idsO = NUM.zeros((len(dataPred), 2) , dtype = NUM.int32)
        idsO.T[1] = NUM.arange(len(dataPred))
        oidSort = NUM.argsort(dataPred)
        idsO.T[0] = oidSort
        idsOn = idsO[idsO[:,0].argsort()]

        pFieldO = SSDO.CandidateField(name = "OIDSORT",
                                        alias = "Sort Id by Predicted Value",
                                        type = "LONG",
                                        data = NUM.asarray(idsOn.T[1].copy(), dtype = NUM.int32))
        candFields.append(pFieldO)

        pField3 = SSDO.CandidateField(name = "Q_LOW",
                                        alias = fieldAlias+"_P05",
                                        type = "DOUBLE",
                                        data = Q1)
        candFields.append(pField3)

        pField4 = SSDO.CandidateField(name = "Q_HIGH",
                                        alias =fieldAlias+"_P95",
                                        type = "DOUBLE",
                                        data = Q2)
        candFields.append(pField4)

    def createUncertaintyPlot(self, nameParameter, aliasField):
        """Create Chart From Uncertainty info
        INPUT:
            nameParameter {str}: Parameter name
            aliasField {str}: Predicted field alias name
        """

        if int(self.hpar.uncertainty) == 0:
            return

        pos = [id for id, i in enumerate(self.hpar.parameters) if self.hpar.parameters[id].name == nameParameter][0]

        chart = ARCPY.Chart("Prediction Inverval")
        chart.type = "line"
        chart.title = "Prediction Interval"

        #### Assign Y Axis Field ####
        chart.yAxis.field = ["Q_HIGH", "PREDICTED","Q_LOW"]
        chart.yAxis.title = aliasField

        #### Assign X Axis Field ####
        chart.xAxis.field = "OIDSORT"
        chart.xAxis.title = "Sorted Feature Id by Predicted Value"
        chart.legend.visible = True
        self.hpar.parameters[pos].charts = [chart]

    def createOutput(self, info, rfTrained, rfTest, ssdoTesting, outputFC, hpar, quartiles = None, prob = None):
        """
        Create Output Feature Class using output generated by RF
        INPUT:
            info {array}: Predicted values
            rfTrained {InfoForestField}: Random Objected from trained  
            rfTest {InfoForestField}: forest Object 
            ssdoTesting {SSDataObject}: Instance SSDO of testing dataset
            fields {list}: list of fields used 
            outputFC {str}: Output Path
            hpar {Hpar ins}: parameters
            quartiles {tuple (2 1 Darrays)}: Quartiles - same dimension info 
            prob (1D array): probability
        """
        convertTypeSupportedByFastOutput = { 'SmallInteger': 'LONG',
                                            'Integer': 'LONG',
                                            'String': 'TEXT',
                                            'Single': 'DOUBLE',
                                            'Double': 'DOUBLE',
                                            'Date': 'DATE',
                                            'BigInteger': 'BIGINTEGER'}

        if info is  None:
            ARCPY.AddMessage("No output Generated for testing")
            return 



        typeNumpyField = None
        dictClasses = {}
        data = None
        fieldSupportY = "DOUBLE"
        isClass = rfTrained.yField.rfType == "Categorical"

        #### Check Type Field To be Predicted ####
        if isClass:
            fieldSupportY = convertTypeSupportedByFastOutput[rfTrained.yField.fieldType]
            dictClasses = { id:value for id, value in enumerate(rfTrained.yField.info)}
            typeNumpyField = UTILS.numpyConvert[rfTrained.yField.fieldType]
            size = None

            #### Calculate the maximum string size ####
            if typeNumpyField =='U%i':
                size = max(map(len, rfTrained.yField.info))
                typeNumpyField = 'U'+str(size)

            data = NUM.zeros(len(rfTest.x), dtype = typeNumpyField)

            #### Introduce Predicted values in the output data array ####
            for value in dictClasses:
                data[info == float(value)] = dictClasses[value]

            outputField = numpy2FormatSupport(fieldSupportY, size)
        else:
            outputField = NUM.float64
            data = NUM.asarray(info, dtype = outputField)

        candFields = []
        ### Source ID ####
        if ssdoTesting.hasOID64:
            dataSourceId = NUM.array(list(ssdoTesting.master2Order.keys()), dtype = NUM.int64)
            sourceField = SSDO.CandidateField(name = "SOURCE_ID",
                                         alias = "Source ID",
                                         type = "BIGINTEGER",
                                         data = dataSourceId)
        else:
            dataSourceId = NUM.array(list(ssdoTesting.master2Order.keys()), dtype = int)
            sourceField = SSDO.CandidateField(name = "SOURCE_ID",
                                         alias = "Source ID",
                                         type = "INTEGER",
                                         data = dataSourceId)
        candFields.append(sourceField)

        for id, i in enumerate(rfTest.fields):

            cfield = None
            fieldSupport = convertTypeSupportedByFastOutput[i.fieldType]
            if i.rfType == "Categorical":
                dictClassesV = { id:value for id, value in enumerate(rfTrained.fields[id].info)}
                typeNumField  = UTILS.numpyConvert[i.fieldType]
                size = None

                #### Calculate the maximum string size ####
                if typeNumField =='U%i':
                    size = max(map(len, i.info))
                    typeNumField = 'U'+str(size)
                ndata = NUM.zeros(len(rfTest.x), dtype = typeNumField)

                for value in dictClassesV:
                    tempIds = rfTest.x.T[id] == float(value)
                    ndata[tempIds] = dictClassesV[value]

                cfield = SSDO.CandidateField(name = i.name,
                                             alias = i.alias,
                                             type = fieldSupport ,
                                             data = NUM.asarray(ndata, 
                                                                dtype = numpy2FormatSupport(fieldSupport, size)))
            else:
                cfield = SSDO.CandidateField(name = i.name,
                                             alias = i.alias,
                                             type = fieldSupport,
                                             data = NUM.asarray(rfTest.x.T[id], 
                                                                dtype = numpy2FormatSupport(fieldSupport)))

            candFields.append(cfield)

        pField = SSDO.CandidateField(name = "PREDICTED",
                                     alias = rfTrained.yField.alias + "(Predicted)",
                                     type = fieldSupportY,
                                     data = data)
        candFields.append(pField)

        if prob is not None and isClass:
            allProbs = None

            if hpar.addProbabilities:
                allProbs = prob[len(data):].reshape((len(data), len(rfTrained.yField.info)))
                prob = prob[0:len(data)]

            pFieldProb = SSDO.CandidateField(name = "PRED_PROB",
                                         alias ="Prediction Probability",
                                         type = "DOUBLE",
                                         data = prob)
            candFields.append(pFieldProb)

            if hpar.addProbabilities  and allProbs is not None:
                for index, i in enumerate(rfTrained.yField.info):
                    name = fr"PROB_{(index+1):02}"
                    alias = fr"Probability: {rfTrained.yField.info[index]}"
                    fieldProb = SSDO.CandidateField(name = name,
                                             alias = alias,
                                             type = "DOUBLE",
                                             data = allProbs.T[index].copy())
                    candFields.append(fieldProb)

        if quartiles is not None:
            #### Add Extra fields for uncertainty ####
            self.addExtraFieldForUncertainty(data, NUM.asarray(quartiles[1], dtype = outputField),
                                             NUM.asarray(quartiles[0], dtype = outputField),
                                             candFields, rfTrained.yField.alias)

        created = False
        try:
            #### Adjust Field Length of Text fields ####
            UTILS.adjustCandidateFieldLengthByArrayDtype(candFields)

            if ssdoTesting.shapeType == "Polygon":
                ARC._ss.copy_selected_features_polygons(ssdo = ssdoTesting,
                                                   input_feature_class = ssdoTesting.inputFC,
                                                   output_feature_class = outputFC,
                                                   subset_ids = dataSourceId,
                                                   candidate_fields = UTILS.checkCandidateFieldName(candFields, outputFC),
                                                   use_oid_64 = ssdoTesting.hasOID64)
                created = True
                #### Apply Layer ####
                applyLayer(hpar, "output_features", data, isClass,
                       headingName = rfTrained.yField.alias,
                       shapeType = "Polygon", isTrainingOutput = False)

                self.createUncertaintyPlot("output_features", rfTrained.yField.alias)
            else:
                ARC._ss.output_featureclass_from_dataobject(ssdoTesting, outputFC, 
                                                UTILS.checkCandidateFieldName(candFields, outputFC))
                created = True
                #### Apply Layer ####
                applyLayer(hpar, "output_features", data, isClass,
                       headingName = rfTrained.yField.alias,
                       shapeType = "Point", isTrainingOutput = False)
                self.createUncertaintyPlot("output_features", rfTrained.yField.alias)

        except:
            if not created:
                ARCPY.AddIDMessage("ERROR", 210, outputFC)
            pass

    def optimization(self, origSeed, rfTraining,  hpar: HandleInputs ):

        numIterationRobust = 5
        userValues = hpar.optimizeInformation["values"]
        numSearch = hpar.optimizeInformation["numSearch"]
        algorithm = hpar.optimizeInformation["algorithm"]
        target =  hpar.optimizeInformation["target"]
        tableParaneter = hpar.optimizeInformation["table"]
        defaults = hpar.optimizeInformation["default"]
        header = rfTraining.getHeader()
        variab = rfTraining.getVars()
        #NUM.array([self.learningRate, 0, self.lambdaValue, self.gammaValue, self.maxBins, 1 ], dtype = float)

        x = rfTraining.x_train
        y = rfTraining.y_train
        x_test = rfTraining.x_test
        y_test = rfTraining.y_test
        type_vars = variab
        model = ""
        header = header
        msgInfo = ""
        balance = int(hpar.balanceTree)
        seed = rfTraining.seed

        number_trees = hpar.numTrees
        node_size = hpar.leafSize
        sample_size = hpar.sample_size
        max_nodes = hpar.maxLevel
        permute_vars = hpar.fields_to_try

        parameters = [{"parameter":"number_trees", "type":int, "value": [hpar.numTrees], "key": "NUM_TREES", 
                       "includeOutput" : False, 
                       "candidateField": SSDO.CandidateField(name ="NUM_TREES", type= "LONG", 
                                                                                      alias = defaults["NUM_TREES"][2]  )},
                      {"parameter":"max_nodes",    "type":int, "value": [hpar.maxLevel], "key": "MAX_DEPTH", 
                       "includeOutput" : False, 
                       "candidateField": SSDO.CandidateField(name ="MAX_DEPTH", type= "LONG",
                                                                                      alias = defaults["MAX_DEPTH"][2] )}, 
                      {"parameter":"node_size",    "type":int, "value": [hpar.leafSize], "key": "LEAF_SIZE",
                        "includeOutput" : False, 
                        "candidateField": SSDO.CandidateField(name ="LEAF_SIZE", type= "LONG",
                                                                                        alias = defaults["LEAF_SIZE"][2])},
                      {"parameter":"sample_size",  "type":int, "value": [hpar.sample_size], "key": "SAMPLE_SIZE",
                        "includeOutput" : False, 
                        "candidateField": SSDO.CandidateField(name ="SAMPLE_SIZE", type= "LONG",
                                                                                        alias = defaults["SAMPLE_SIZE"][2] )},
                      {"parameter":"permute_vars", "type":int, "value": [hpar.fields_to_try], "key": "RANDOM_VARIABLES",
                        "includeOutput" : False, 
                        "candidateField": SSDO.CandidateField(name ="VAR_PERM", type= "LONG",
                                                                                      alias = defaults["RANDOM_VARIABLES"][2])}
        ]

        classwt = hpar.xgbPar
        rate,lmbda,gamma,maxBins = None, None, None, None
        if hpar.isXGB:
             rate, lmbda, gamma, maxBins = hpar.xgbPar[0],  hpar.xgbPar[2], hpar.xgbPar[3], hpar.xgbPar[4]
             parameters.append({"parameter":"rate","type":float, "value": [rate], "key": "ETA", 
                                "includeOutput" : False, 
                                "candidateField": SSDO.CandidateField(name ="ETA", type= "DOUBLE",
                                                                                               alias= defaults["ETA"][2] )})
             parameters.append({"parameter":"lmbda","type":float, "value": [lmbda], "key": "REG_LAMBDA",  
                                "includeOutput" : False, 
                                "candidateField": SSDO.CandidateField(name ="REG_LAMBDA", type= "DOUBLE",
                                                                                                alias= defaults["REG_LAMBDA"][2] )})
             parameters.append({"parameter":"gamma","type":float, "value": [gamma], "key": "GAMMA", 
                                "includeOutput" : False, 
                                "candidateField": SSDO.CandidateField(name ="GAMMA", type= "DOUBLE",
                                                                                                alias= defaults["GAMMA"][2] )})
             parameters.append({"parameter":"maxBins","type":int, "value": [maxBins], "key": "MAX_BINS", 
                                "includeOutput" : False, 
                                "candidateField": SSDO.CandidateField(name ="MAX_BINS", type= "LONG",
                                                                                               alias= defaults["MAX_BINS"][2] )})

        def dif(low, high, intv):
            md = (high - low)%intv
            if NUM.isclose(md, intv):
                value = False
            else:
                value = md > 0
            return value

        def rangeValues(key, low,high,intv):
            ran = []
            skipValue =  None
            if dif(low,high,intv):
                ran = NUM.arange(low,high,intv)
            else:
                ran =  NUM.arange(low,high+intv,intv)

            if len(ran) and ran[-1] > high:
                if not  NUM.isclose(ran[-1], high):
                    ran = ran[:-1]

            if key == "MAX_BINS":
                msk = ran==1
                skipValue = NUM.sum(msk)
                ran = ran[~(msk)]
            return ran, skipValue

        ### Add ranges to each parameter ####
        for value in userValues:
            compare = lambda info : True if info["key"] == value else False
            for parameter in filter(compare, parameters):
                valuesToUse, skipValue = rangeValues(value, userValues[value][0],
                                                            userValues[value][1],
                                                            userValues[value][2]) 
                if parameter["key"] == "MAX_BINS":
                    if skipValue is not None and skipValue > 0:
                        ARCPY.AddIDMessage("WARNING", 110534)

                parameter["value"] = list(map(parameter["type"],valuesToUse))
                parameter["includeOutput"] = True

        parameterSpace=[]
        nElem = 1
        #### Calculate the parameter space size ####
        for parameter in parameters:
            nElem *= len(parameter["value"])

        seeds =[]
        finalSize = nElem
        indices = []
        if algorithm in ["RANDOM", "RANDOM_ROBUST"]:
            NUM.random.seed(rfTraining.seed)
            finalSize = numSearch
            indices = NUM.random.choice(nElem, size = numSearch, replace = False)
            if algorithm == "RANDOM_ROBUST":
                seeds = NUM.random.randint(0,1000000, (numSearch,numIterationRobust))


        def combine(parameters, ind, parm):
            valset = []
            if parm is None:
                parm =[]

            if ind < len(parameters):
                if len(parm):
                    for i in NUM.arange(len(parm)):
                        for v in parameters[ind]["value"]:
                            par = parm[i].copy()
                            par.append(v)
                            valset.append(par)
                else:
                    for v in parameters[ind]["value"]:
                        valset.append([v])
                return combine(parameters, ind+1, valset)
            else:
                return  parm.copy()

        #### Calculate the combinatory parameters ###
        parameterSpace = combine(parameters, 0, [])

        if len(indices) == 0:
            indices = NUM.arange(len(parameterSpace))

        isBinary = False
        if rfTraining.yField.rfType == "Categorical":
            isBinary = len(NUM.unique(rfTraining.y))==2

        targetAlias = ""
        self.statFc = self.r2
        if target == "R2":
            self.statFc = self.r2
            targetAlias = ARCPY.GetIDMessage(84826)
        if target == "RMSE":
            self.statFc = self.rmse
            targetAlias = ARCPY.GetIDMessage(84941)
        if target == "ACCURACY":
            self.statFc = self.accuracy
            targetAlias = ARCPY.GetIDMessage(84827)
        if target == "MCC":
            self.statFc = self.mcc
            targetAlias = ARCPY.GetIDMessage(84832)
        if target == "F1-SCORE":
            target = "F1_SCORE"
            self.statFc = self.f1Score
            targetAlias = ARCPY.GetIDMessage(84833)

        #### Calculate the parameter space size ####
        for parameter in parameters:
            parameter["candidateField"].data = NUM.zeros(finalSize, dtype = parameter["type"])

        statCandidateField = SSDO.CandidateField(name = target, type= "DOUBLE", alias = targetAlias, data = NUM.ones(finalSize, dtype=float)*-1)
        statCandidateSeed = SSDO.CandidateField(name = "SEED", type= "LONG", alias = "Seed", data = NUM.zeros(finalSize, dtype=NUM.int32))
        best = NUM.zeros(finalSize, dtype = "U30")
        best[:] = ARCPY.GetIDMessage(220656)
        
        statBestCandidateField = SSDO.CandidateField(name ="BEST_PAR", type= "TEXT", length=30, alias = ARCPY.GetIDMessage(220657), data = best)

        #### Populate fields ####
        for i, ind in enumerate(indices):
            argument = parameterSpace[ind]
            for j, par in enumerate(parameters):
                par["candidateField"].data[i] = argument[j]

        def newApproachForOptimization():
            statType = ["R2","ACCURACY","RMSE","MCC","F1_SCORE"].index(target)

            parametersArray = NUM.zeros((len(indices), len(parameters)), dtype = NUM.float64)
            cnt = 0
            #### populate array with parameters ####
            for ind in indices:
                argument = parameterSpace[ind]
                parametersArray[cnt] = NUM.array([argument[v]  for v in NUM.arange(len(parameters))], dtype = float)
                cnt += 1

            seedsArray = seeds

            #### An array with one seed is used for all iterations ####
            if len(seeds) == 0:
                seedsArray = NUM.array([rfTraining.seed], dtype=NUM.int32)

            #### Calculate the statistics for each parameter combination ####
            outputStats =  ARC._ss.optimize_forest(rfTraining.x_train, 
                                    rfTraining.y_train, 
                                    variab, 
                                    rfTraining.x_test, 
                                    rfTraining.y_test, 
                                    seedsArray.ravel(),
                                    parametersArray, 
                                    statType
                                    )

            if algorithm == "RANDOM_ROBUST":
                outputStats = outputStats.reshape((len(indices), numIterationRobust))

                ## get median indices of each row
                indexMedian = NUM.argsort(outputStats, axis = 1).T[numIterationRobust//2]

                ## get median of each row
                outputStats = NUM.median(outputStats, axis = 1)

                ## get seed of each median
                seedSelected = [seeds[i][indexMedian[i]] for i in NUM.arange(len(indices))]
                statCandidateField.data = outputStats
                statCandidateSeed.data = NUM.array(seedSelected, dtype=NUM.int32)
            else:
                statCandidateField.data = outputStats
                statCandidateSeed.data = NUM.full(len(indices),seed, dtype=NUM.int32)

        #### evaluate Parameter without parallel approach ###
        def  oldApproachForOptimization():
            #### Create Progressor Bar ####
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220684), 0, len(indices), 1)
            cnt = 0
            for ind in indices:
                argument = parameterSpace[ind]
                parameterToEval = {
                    "x" : rfTraining.x_train,
                    "y" : rfTraining.y_train,
                    "x_test" : rfTraining.x_test,
                    "y_test" : rfTraining.y_test,
                    "type_vars" : variab,
                    "model" : "",
                    "header" : header,
                    "msg_info" : "",
                    "balance" : int(hpar.balanceTree),
                    "seed" : rfTraining.seed,
                    "number_trees" : argument[0],
                    "node_size" : argument[2],
                    "sample_size" : argument[3],
                    "max_nodes" : argument[1],
                    "permute_vars" : argument[4]
                }

                if hpar.isXGB:
                    parameterToEval["classwt"] = NUM.array([argument[5],
                                                            0,
                                                            argument[6],
                                                            argument[7],
                                                            argument[8],
                                                            1], dtype = float)

                output = self.evaluateRun(parameterToEval, cnt, seeds, rfTraining, algorithm, numIterationRobust)

                if output is not None:
                    statValue, seed = output
                    statCandidateField.data[cnt] = statValue
                    statCandidateSeed.data[cnt] = seed
                ARCPY.AddMessage(str(parameterToEval))
                cnt += 1
                ARCPY.SetProgressorPosition()

            ARCPY.ResetProgressor()

        newApproachForOptimization()

        ### Optimize without parallelization ###
        ##oldApproachForOptimization()
    
        #### Sort the statistics ####
        bestSorted = statCandidateField.data.argsort()[::-1]
        best = bestSorted[0]

        if target == "RMSE":
            best=bestSorted[-1]

        if algorithm == "RANDOM_ROBUST":
            listSeedUsed = seeds[best]
            if hpar.iterationSeeds is not None:
                #### Try to use same seeds used in the optimization as much as possible ###
                if len(hpar.iterationSeeds) ==len(listSeedUsed):
                    hpar.iterationSeeds = listSeedUsed
                elif len(hpar.iterationSeeds)  > len(listSeedUsed):
                    seedbase = hpar.iterationSeeds.copy()
                    seedbase[0:len(listSeedUsed)]=listSeedUsed
                    hpar.iterationSeeds = listSeedUsed
                else:
                    hpar.iterations= listSeedUsed[0:len(hpar.iterations)]

        if tableParaneter.value is not None:
            tableOuput, out = UTILS.returnTableName(tableParaneter.valueAsText)
            iterFld = SSDO.CandidateField(name ="ITER", alias=ARCPY.GetIDMessage(260101), type ="LONG", data = NUM.arange(len(indices)))
            fields = [par["candidateField"] for par in parameters if par["includeOutput"]]
            for fld in NUM.arange(len(fields)):
                if tableOuput.upper().endswith(".DBF") and fields[fld].name == "SAMPLE_SIZE":
                    fields[fld].name = "SMPLE_SIZE"

            listParameterNames = [fld.name for fld in fields]
            fields.append(iterFld)
            fields.append(statCandidateField)

            if algorithm == "RANDOM_ROBUST":
                fields.append(statCandidateSeed)

            statBestCandidateField.data[best] = ARCPY.GetIDMessage(220657)
            fields.append(statBestCandidateField)

            #### Adjust Field Length of Text fields ####
            UTILS.adjustCandidateFieldLengthByArrayDtype(fields)

            ARC._ss.output_table_from_candidate_fields(tableOuput, len(bestSorted),fields)

            try:
                chart = ARCPY.charts.Scatter(x="ITER", y=target, xTitle=ARCPY.GetIDMessage(260101), yTitle = targetAlias,
                             title=ARCPY.GetIDMessage(220658))

                lines = ARCPY.charts.Line(x= statCandidateField.name, y=listParameterNames, aggregation="mean", xTitle =statCandidateField.alias,
                                          yTitle=ARCPY.GetIDMessage(220660), title = ARCPY.GetIDMessage(220661))

                tableParaneter.charts = [chart, lines]
            except:
                pass


        if statCandidateField.data[best] > -1:

            hpar.numTrees = int(parameters[0]["candidateField"].data[best])
            hpar.maxLevel = int(parameters[1]["candidateField"].data[best])
            hpar.leafSize = int(parameters[2]["candidateField"].data[best])
            hpar.sample_size = int(parameters[3]["candidateField"].data[best])
            hpar.fields_to_try = int(parameters[4]["candidateField"].data[best])
            if algorithm == "RANDOM_ROBUST":
                rfTraining.seed = int(statCandidateSeed.data[best])
   
            if hpar.isXGB:
                hpar.xgbPar = NUM.array([float(parameters[5]["candidateField"].data[best]),
                                        0,
                                        float(parameters[6]["candidateField"].data[best]),
                                        float(parameters[7]["candidateField"].data[best]),
                                        float(parameters[8]["candidateField"].data[best]),
                                        1], dtype = float)

            return  statCandidateField.data[best], statCandidateSeed.data[best]
        else:
            return None

    def evaluateRun(self, argumentsDict, ind, seeds, rfTraining, algorithm, numIterationRobust):
        if  algorithm == "RANDOM_ROBUST":
            evaluations_seeds = NUM.zeros((numIterationRobust,2), dtype = float)
            
            evaluations_seeds.T[1] = seeds[ind]
            for rep in NUM.arange(numIterationRobust):

                argumentsDict["seed"]= int(seeds[ind][rep])

                data = executeFR(**argumentsDict)
                if data is None:
                    return None
                trainedData, testingData = data[0], data[1]
                if len(testingData) == 0:
                    evaluation = self.statFc(rfTraining.y_train,trainedData)
                else:
                    evaluation = self.statFc(rfTraining.y_test,testingData)
                if  evaluation is None:
                        return None
                evaluations_seeds[rep][0] = evaluation

            sortInd = evaluations_seeds.T[0].argsort()
            selectedMedian = numIterationRobust//2
            medianEvaluation, seed =  evaluations_seeds[sortInd][selectedMedian]
            return medianEvaluation, int(seed)
        else:
            data = executeFR(**argumentsDict)
            if data is None:
                return None
            trainedData, testingData = data[0], data[1]
            if testingData is not None and len(testingData) == 0:
                evaluation = self.statFc(rfTraining.y_train,trainedData)
            else:
                evaluation = self.statFc(rfTraining.y_test,testingData)
            if  evaluation is None:
                    return None
            return evaluation, argumentsDict["seed"]

    def r2(self, y_true, y_pred):
        """ R^2 calculation """
        slope, intercept, r_value, p_value, std_err = SCPS.linregress(y_true, y_pred )
        outputData = r_value**2
        return outputData

    def accuracy(self,y_true, y_pred):
        """Accuracy calculation"""
        accuracy = (y_true == y_pred).sum() / len(y_true)
        return accuracy

    def rmse(self,y_true, y_pred):
        """Root Mean Square Error calculation"""
        return NUM.sqrt(((y_true - y_pred)**2).sum()/len(y_true))

    def mcc(self, y_true, y_pred):
        """Macro MCC"""
        return MCCFunction(y_true, y_pred)

    def f1Score(self, y_true, y_pred):
        """Macro F1-Score """
        return F1ScoreFunction(y_true, y_pred)

    def iterateTraining(self, origSeed, rfTraining, splitData = False):
        """
        Make RF Iteration
        INPUT:
            origSeed (int): Original Seed
            rfTraining (Forest Field Instance): Contain Input Original Data
        OUTPUT:
            (tuple, (Closest Seed Mean, Best Mean R2/Acc, Array R2/Acc, max R2/Acc index))
        """
        hpar = self.hpar

        if hpar.optimize:
            if splitData:
                rfTraining.splitDataForTesting(hpar.balanceTree)

            vals = self.optimization(origSeed,rfTraining, self.hpar)
            ### Replace original seed to optimized seed ###
            if vals is not None:
                evaluat, seedOpt = vals
                origSeed = seedOpt

        rep = 1
        if hpar.iterations > 1:
            header = rfTraining.getHeader()
            variab = rfTraining.getVars()
            decisionValues = NUM.ones(hpar.iterations, dtype = float) * -1
            if hpar.isXGB:
                rep = 3
            importanceArray = NUM.ones((hpar.iterations, rfTraining.x.shape[1]*rep), dtype = float) * -1
            justImport = False
            exitBadModel = False
            msg_info = ARCPY.GetIDMessage(220649)
            for i in NUM.arange(hpar.iterations):
                msg_infoV = msg_info.format((i+1),hpar.iterations)
                rfTraining.seed = hpar.iterationSeeds[i]

                rfTraining.splitDataForTesting(hpar.balanceTree)

                ### Execute Forest For a Given Seed ###
                data = executeFR(x = rfTraining.x_train,
                                            y = rfTraining.y_train,
                                            x_test = rfTraining.x_test,
                                            y_test = rfTraining.y_test,
                                            type_vars = variab,
                                            number_trees = hpar.numTrees,
                                            node_size = hpar.leafSize,
                                            sample_size = hpar.sample_size,
                                            model = "",
                                            max_nodes = hpar.maxLevel,
                                            header = header, 
                                            permute_vars = hpar.fields_to_try,
                                            seed = rfTraining.seed,
                                            balance = int(hpar.balanceTree),
                                            classwt = hpar.xgbPar,
                                            msg_info = msg_infoV,
                                            return_prob = 0)
                if data is None:
                    exitBadModel = True
                    break

                trainedData, testingData, predictData, errors, classErrors, varianceErrors, importance, depth, \
                trainedProb, testingProb, predictProb = data
                importanceArray[i,:] = importance 

                if testingData is not None and len(testingData):
                    valueDec = self.extractStatistics(rfTraining, (trainedData, testingData))
                    decisionValues[i] = valueDec
                else:
                    justImport = True

            #### Bad Model - Low Variability - Inf values ####
            if exitBadModel:
                raise SystemExit()
                return

            if justImport:
                return origSeed, None, None, None, importanceArray

            if len(NUM.where(decisionValues == -1)[0]) > 0:
                ARCPY.AddError("Forest iteration return None")
                raise SystemExit

            #### Check if Number of Trees is Even ####
            isEven = hpar.numTrees % 2 == 0

            #### Get Median ####
            median = NUM.median(decisionValues)
            diff = abs(decisionValues - median)
            orderValues = NUM.argsort(diff)
            bestOption = orderValues[0]

            #### Select Best Seed, In Even Number the Larger Decision Value is Selected ####
            if isEven:
                if decisionValues[orderValues[1]]>decisionValues[orderValues[0]]:
                    bestOption = orderValues[1]

            return hpar.iterationSeeds[bestOption] , decisionValues[bestOption], decisionValues, orderValues[-1], importanceArray
        else:
            return origSeed, None, None, None, None

    def reportCrosValidation(self, rfTraining, randSeed, bestValue, listDecValues, maxReach):
        """
        Report and Create Ouput of Cross Validation
        INPUT:
            rfTraining (InfoForestField Instance): Training Field
            randSeed (int): Best Seed
            bestValue (double): R2/Accuracy
            listDecValues (array): Values for each iteration (R2/Acc)
            maxReach (int): location Maximum R2/Acc
        OUTPUT:
            info (str): message
        """

        info = ""
        if bestValue is not None:
            isClass = rfTraining.yField.rfType == "Categorical"
            msg = ""

            if isClass:
                msg = ARCPY.GetIDMessage(84827)
            else:
                msg = ARCPY.GetIDMessage(84018)

            bestSeedMsg = ARCPY.GetIDMessage(84864)
            info +="\n\n"+ bestSeedMsg.format(msg,LOCALE.format_string("%0.3f", bestValue),str(randSeed))

            if self.hpar.outputCrossValidation not in ["", None]:
                fields = []
                field = SSDO.CandidateField(name = msg,
                                type = "DOUBLE",
                                data = NUM.asarray(listDecValues, dtype = float))
                seedField = SSDO.CandidateField(name = "SEED",
                                type = "LONG",
                                data = NUM.asarray(self.hpar.iterationSeeds, dtype = int))
                fields = [field, seedField]

                #### Get Output Table Name With Extension if Appropriate ####
                self.hpar.outputCrossValidation, dbf = UTILS.returnTableName(self.hpar.outputCrossValidation)

                #### Adjust Field Length of Text fields ####
                UTILS.adjustCandidateFieldLengthByArrayDtype(fields)

                #### Write Out Permutation Results ####
                ARC._ss.output_table_from_candidate_fields(self.hpar.outputCrossValidation, 
                                                           len(self.hpar.iterationSeeds),
                                                           fields)

                #### R-Squared Distribution Chart ####
                y = listDecValues
                numBreaks = int(STATS.riskFunBins(y, 8, 64, 1))
                riceBreaks = STATS.riceBins(len(y))
                if riceBreaks < numBreaks:
                    numBreaks = riceBreaks

                chart = ARCPY.Chart("Validation")
                chart.type = "histogram"
                chart.xAxis.field = msg
                chart.title = ARCPY.GetIDMessage(84856)+" " + msg
                chart.histogram.binCount = numBreaks
                chart.histogram.showMean = True
                chart.histogram.showMedian = True
                chart.histogram.showStandardDeviation = True
                self.hpar.outputCrossValidationParameter.charts = [chart]
                

        return info

    def reportImportanceDistribution(self, rfTraining, randSeed, maxIndexReach, importanceArray):
        """
        Create Output table for Variable Importance Distribution
        INPUT:
            rfTraining (InfoForestField Instance): Training Field
            randSeed (int): Best Seed for Highest R2
            maxIndexReach (int): index Model with highest R2/Accuracy
            importanceArray (array): Values for each iteration (R2/Acc)
        OUTPUT:
            info (str): message
        """

        if self.hpar.outputDiagnostic not in ["", None] and self.hpar.iterations > 1 :

            fields = []

            nE = importanceArray.shape[0]
            best = NUM.zeros(nE, dtype = "U30")
            best[:] = ARCPY.GetIDMessage(84908)
            rep = 1
            if self.hpar.isXGB:
                rep = 3

            for fInd, f in enumerate(rfTraining.fields):
                info = importanceArray[:,fInd*rep]
                field = SSDO.CandidateField(name = f.name, alias = f.alias, type = "DOUBLE",
                            data = NUM.asarray(info, dtype = float))
                fields.append(field)

            #### Get Output Table Name With Extension if it's Apropriated ####
            fields  = UTILS.checkCandidateFieldName(fields, self.hpar.outputDiagnostic)
            orderField = [field.name for field in fields]

            #### R-Squared Distribution Chart ####
            chartTitle = ARCPY.GetIDMessage(84906)
            bpChart = ARCPY.Chart(chartTitle)
            bpChart.type = 'boxPlot'
            bpChart.title = chartTitle
            # bpChart.description = 'desc'
            bpChart.xAxis.field = ""
            bpChart.yAxis.field = orderField
            bpChart.yAxis.sort = "MEAN_DESC"
            if not self.hpar.isXGB:
                bpChart.yAxis.title = ARCPY.GetIDMessage(84835)
            else:
                bpChart.yAxis.title = ARCPY.GetIDMessage(220666)


            if maxIndexReach is not None:
                best[maxIndexReach] = ARCPY.GetIDMessage(84907)


                fields.append(SSDO.CandidateField(name = "BEST_ITE", alias = ARCPY.GetIDMessage(84907),
                                                  type = "TEXT", data = best))


                self.hpar.outputDiagnostic, dbf = UTILS.returnTableName(self.hpar.outputDiagnostic)

                #### Adjust Field Length of Text fields ####
                UTILS.adjustCandidateFieldLengthByArrayDtype(fields)

                #### Write Out Permutation Results ####
                ARC._ss.output_table_from_candidate_fields(self.hpar.outputDiagnostic, 
                                                            len(self.hpar.iterationSeeds),
                                                            fields)

                #### Set Box Plot Properties ####
                bpChart.boxPlot.standardizeValues = False

                #### Comment - If you want to visualize selected iteration in the box #####
                #bpChart.boxPlot.splitCategoryAsMeanLine = True
                #bpChart.boxPlot.splitCategory = "BEST_ITE"
                #bpChart.color = ["#808080", "#FF0000", "#0000FF"]

            else:
                #### Get Output Table Name With Extension if it's Apropriated ####
                self.hpar.outputDiagnostic, dbf = UTILS.returnTableName(self.hpar.outputDiagnostic)

                #### Adjust Field Length of Text fields ####
                UTILS.adjustCandidateFieldLengthByArrayDtype(fields)

                #### Write Out Permutation Results ####
                ARC._ss.output_table_from_candidate_fields(self.hpar.outputDiagnostic, 
                                                            len(self.hpar.iterationSeeds),
                                                            fields)


                #### Set Box Plot Properties ####
                bpChart.boxPlot.standardizeValues = False
                bpChart.boxPlot.splitCategoryAsMeanLine = False

            self.hpar.outputDiagnosticParameter.charts = [bpChart]

        return

    def getMinMaxX(self, rfTraining, dataX):
        """ Get Max-Min Value Variables X 
            INPUT:
                rfTraining (RFField instance): Information about each Variable
                dataX (n-array, float): X variable
        """

        if dataX is None:
            return None

        variables = rfTraining.getVars()
        variables = variables[0:len(variables)-1]
        continuousVar = list(variables).count(1)

        if continuousVar > 0 and len(dataX):
            minMax = [[dataX.T[i].min(), dataX.T[i].max()]  for i, e in enumerate(variables) if e == 1]
            return minMax
        else:
            return None

    def reportShare(self, rfTraining, shareBase, shareTraining, shareTest = None, sharePredict = None ):
        """ Create Share Report
            INPUT:
                rfTraining (RFField instance): Information about each Variable
                shareBase( list - tuples): List of tuples that contains min-max of each variable Original dataset
                shareTraining( list - tuples): List of tuples that contains min-max of each variable in Training
                shareTest( list - tuples): List of tuples that contains min-max of each variable in Training
                sharePredict( list - tuples): List of tuples that contains min-max of each variable in Training
            OUTPUT:
                report (string): output
        """

        header = ARCPY.GetIDMessage(84860)
        footMsg1 = "(a) " + ARCPY.GetIDMessage(84861)
        footMsg2 = "(b) " + ARCPY.GetIDMessage(84865)
        footMsg3 = "(c) " + ARCPY.GetIDMessage(84866)
        trainingMsg =  ARCPY.GetIDMessage(84862)
        predictionMsg =  ARCPY.GetIDMessage(84863)
        validationMsg = ARCPY.GetIDMessage(84856)
        maximumMsg = ARCPY.GetIDMessage(84413)
        minimumMsg = ARCPY.GetIDMessage(84412)
        shareMsg = ARCPY.GetIDMessage(84273)
        variableMsg = ARCPY.GetIDMessage(84068)
        descValues = ARCPY.GetIDMessage(84899)
        descValues2 = ARCPY.GetIDMessage(84900)

        minMaxMsg = [minimumMsg, maximumMsg]
        headerColumns1 = ["@@none", minimumMsg, maximumMsg]
        headerColumns = [
            UTILS.buildTableCell(variableMsg, rowSpan=2),
            UTILS.buildTableCell(trainingMsg, colSpan=2),
            "@@none"]
        justifyArray = ["left",      "left",         "left"]

        if shareTest is not None:
            headerColumns.extend([UTILS.buildTableCell(validationMsg, colSpan=2, align="left"), "@@none"])
            justifyArray.extend(["left", "left"])
            headerColumns1.extend(minMaxMsg)

        if sharePredict is not None:
            headerColumns.extend([UTILS.buildTableCell(predictionMsg, colSpan=2), "@@none"])
            justifyArray.extend(["left", "left"])
            headerColumns1.extend(minMaxMsg)

        shareColSpan = 1
        headerColumns1.append(UTILS.buildTableCell([trainingMsg, UTILS.buildSuperscript("a")], align="right"))
        justifyArray.append("right")

        if shareTest is not None:
            shareColSpan += 1
            headerColumns1.append([validationMsg, UTILS.buildSuperscript("b")])
            justifyArray.append("right")

        if sharePredict is not None:
            shareColSpan += 1
            headerColumns1.append([predictionMsg, UTILS.buildSuperscript("c")])
            justifyArray.append("right")
        headerColumns.append(UTILS.buildTableCell(shareMsg, colSpan=shareColSpan))
        headerColumns += ["@@none"] * (shareColSpan - 1)

        variables = rfTraining.getVars()
        variables = variables[0:len(variables)-1]
        continuousVar = list(variables).count(1)

        cnt = 0
        listTable = []
        listTable.append(headerColumns)
        listTable.append(headerColumns1)

        for i, typeVar in enumerate(variables):
            if typeVar == 1:
                rows = []
                nameVar = rfTraining.fields[i].alias
                dataB = shareBase[cnt]
                dataT = shareTraining[cnt]
                rows.append(nameVar)
                stringFormat = "%0.2f"

                if dataT[1] < 0.001:
                    stringFormat = "%0.2e"

                rows.extend([LOCALE.format_string(stringFormat,dataT[0]),LOCALE.format_string(stringFormat,dataT[1])])
                baseShare = []
                dataTest = None
                dataPredict = None

                if shareTest is not None:
                    dataTest = shareTest[cnt]
                    rows.extend([LOCALE.format_string(stringFormat,dataTest[0]),LOCALE.format_string(stringFormat,dataTest[1])])

                if sharePredict is not None:
                    dataPred = sharePredict[cnt]
                    rows.extend([LOCALE.format_string(stringFormat,dataPred[0]),LOCALE.format_string(stringFormat,dataPred[1])])

                share = STATS.calculateShare(dataB, dataT)
                baseShare.append(self.checkShare(share))

                if shareTest is not None:
                    share = STATS.calculateShare(dataT, dataTest)
                    baseShare.append(self.checkShare(share))

                if sharePredict is not None:
                    share = STATS.calculateShare(dataT, dataPred)
                    baseShare.append(self.checkShare(share, True))

                rows.extend(baseShare)
                listTable.append(rows)
                cnt += 1

        #### There Are Numeric Variables ####
        if cnt == 0:
            return ""

        footnote = [footMsg1]
        if shareTest is not None:
            # outputReport +=  "\n"+ footMsg2
            footnote.append(footMsg2)

        if sharePredict is not None:
            # outputReport +=  "\n"+ footMsg3
            footnote.append(footMsg3)
        footnote += [descValues, descValues2]

        outputReport = UTILS.outputTextTable(listTable, header = header, footnote=footnote,
                                             justify = justifyArray, pad = 1, colPad = 3,
                                             titleFillToken = "-", returnHTMLMsg=True, force2Txt=False)

        # outputReport = "\n"+outputReport +  footMsg1
        # outputReport = [outputReport, footMsg1]

        # if shareTest is not None:
        #     # outputReport +=  "\n"+ footMsg2
        #     outputReport.append(footMsg2)
        #
        # if sharePredict is not None:
        #     # outputReport +=  "\n"+ footMsg3
        #     outputReport.append(footMsg3)

        return [outputReport]

    def checkShare(self, share, isPrediction = False):
        """
        Evaluate the share value, adding an identifier if the share 
        value is incompleted, No overlapped or extrapolated
        INPUT:
            share (tuple): value, type
            isPreditction (bool): True prediction incomplete does not matter
        OUTPUT:
            outputStr (str): String
        """
        value = share[0]
        typeValue = share[1]
        outputStr = ""

        if not isPrediction:
            if "Incomplete" in typeValue:
                outputStr = "*"
            if "No overlapping" in typeValue:
                outputStr = "*"
        else:
            if "No overlapping" in typeValue:
                outputStr = "*"
            if "Extrapolation" in typeValue:
                outputStr = "+"

        return LOCALE.format_string("%0.2f", value) + outputStr

    def createFinalOutput(self, hpar, multipleFLTAreCreated, workspaceOutput, listRasterZones,
                          pathFLT, nameFLT, outputRasterPath, strProgressor = "" , srf = None):
        """ Merge Temporal Files 
        INPUT:
            hpar {HandlePar instance}: information about parameters
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
            ARCPY.SetProgressor("default", "Merging Rasters {0}...".format(strProgressor))
            try:
                ARCPY.MosaicToNewRaster_management(";".join(listRasterZonesFLT),
                                                    outPath, outName, self.infoRasterInstances.srf,
                                                    "32_BIT_FLOAT", self.infoRasterInstances.cellSize, 1, "LAST", "FIRST")
            except:
                ARCPY.AddError("Merge Failed - please check temporal files " + ";".join(listRasterZonesFLT))
                raise SystemExit
            ARCPY.ResetProgressor()

            #### Applying Previous WorkSpace ####
            ARCPY.env.workspace = currentWrksp
            ARCPY.env.outputCoordinateSystem = spatialRef2SetBack
        else:
            spatialRef2SetBack = ARCPY.env.outputCoordinateSystem
            ARCPY.env.outputCoordinateSystem = srf

            strOut = OS.path.join(pathFLT, nameFLT + ".flt")
            ARCPY.SetProgressor("default", "Creating Raster {0}...".format(strProgressor))
            #### Copy NetCDF Layer To Output Raster File ####
            ARCPY.management.CopyRaster(strOut, outputRasterPath, None, None, NULL, "NONE", "NONE", None, "NONE", "NONE", None, "NONE")
            ARCPY.ResetProgressor()
            ARCPY.env.outputCoordinateSystem = spatialRef2SetBack
            listRasterZonesFLT = [strOut]

        ARCPY.SetProgressor("default", "Removing Temporal Files")
        ### Remove Temporal Files ####
        for pathFLT in listRasterZonesFLT:
            try:
                OS.remove(pathFLT)
                OS.remove(pathFLT.replace(".flt",".hdr"))
                OS.remove(pathFLT.replace(".flt",".prj"))
            except:
                pass
        ARCPY.ResetProgressor()

    def processRasterByParts(self, rfTest, randSeed, hpar, newSRF, useNetCDFAsOutput = False,
                             multipleFLTAreCreated = False, enableShareAndUncert = True, shareInfoBase = None):

        """ This function process the raster in parts, dividing the raster output
            in chuncks and predicting each chunk using the same model parameters
        """
        self.rfTest = rfTest
        rfTraining = self.rfTraining
        header = rfTraining.getHeader()
        shareBase = None
        shareTraining = None
        shareTest = None
        msg_info = ARCPY.GetIDMessage(220648)

        if enableShareAndUncert:
            #### Calculate Share from Training Data ####
            shareBase = self.getMinMaxX(rfTraining,  rfTraining.x)
            shareTraining = self.getMinMaxX(rfTraining,  rfTraining.x_train)
            shareTest = self.getMinMaxX(rfTraining,  rfTraining.x_test)
        
        if shareInfoBase is not None and shareTraining is None:
            shareBase= shareInfoBase[0]
            shareTraining = shareInfoBase[1]
            shareTest = shareInfoBase[2]

        #### Get Number of Zones ####
        nRasterOutput = len(self.infoRasterInstances.rangeZones)

        #### Create List Of Id Zones ####
        listIds = list(NUM.arange(nRasterOutput))

        #### Threshold Values to Calculate Render ####
        sampleVisSize  = 1000

        #### Number Values To Extract in each Zone ####
        sampleVisSize = int(sampleVisSize / nRasterOutput) + 1

        #### Initialize Values To Render ####
        valuesToRender = []
        rasters  = []

        #### Number Of Cells To Process ####
        sizeRaster = float(self.infoRasterInstances.nRows) * float(self.infoRasterInstances.nCols)

        #### Number of Cell per Chunck ####
        nOutputTempRasters =  int(NUM.ceil(sizeRaster / (maxSizeCells/2)))

        ### Get Number of Zones Per Chuck (Output Raster to write) ####
        pn = int(NUM.ceil(nRasterOutput / nOutputTempRasters))

        #### Check is Prediction is Classification #### 
        isClass = self.rfTraining.yField.rfType == categoricalVar

        #### Set Each Part to a Raster Zone ####
        #### Create a List of Ids In each Chuck ####
        oup = [NUM.asarray(NUM.arange(pn) + i*pn, dtype = int) for i in range(nOutputTempRasters)]
        oup = [ i[i<nRasterOutput]  for i in oup ]
        oup = [ i for i in oup if len(i)>0]

        #### Initialize Variables ####
        dataBase = dataset = variable = pathTempNC = pathFLT = nameFLT = None
        workspaceOutput = ""
        listRasterZones = []
        listRasterZonesQU = []
        listRasterZonesQL = []
        listRasterZonesProb = []
        dataBaseQU = datasetQU = variableQU = pathTempNCQU = pathFLTQU = nameFLTQU = None
        dataBaseQL = datasetQL = variableQL = pathTempNCQL = pathFLTQL = nameFLTQL = None
        dataBaseProb = datasetProb = variableProb = pathTempNCProb = pathFLTProb = nameFLTProb = None


        #### Calculate Initial Chuck Information ####
        infoSlice = self.calculateChunckSize(self.infoRasterInstances, oup[0])
        chunckSize , newSliceCol, newSliceRow, iniIndex, \
        xMinYMin, nColsStep, nRowsStep = infoSlice

        canReturnProb =  hpar.enabledRasterProbability and hpar.addProbabilities

        processUncer = False
        if enableShareAndUncert:
            #### Boolean to process quartiles ####
            processUncer = hpar.rasterWorkSpace is not None and not isClass and int(hpar.uncertainty) == 1

        #### Raster Keep in Memory #####
        if sizeRaster < maxSizeCells:
            # if DBGLARGERASTER:
                # ARCPY.AddWarning("One temporal file is created for predict.")

            #### Create an array smaller than maxSizeCells ###
            #### Only one Temporal file is created ####
            dataBase = NUM.ones((self.infoRasterInstances.nRows*self.infoRasterInstances.nCols), 
                                dtype = NUM.float32)*float(NULL)

            #### Base for Quantiles ####
            if processUncer:
                dataBaseQU = NUM.ones((self.infoRasterInstances.nRows*self.infoRasterInstances.nCols), 
                                dtype = NUM.float32)*float(NULL)
                dataBaseQL = NUM.ones((self.infoRasterInstances.nRows*self.infoRasterInstances.nCols), 
                                dtype = NUM.float32)*float(NULL)
            elif isClass and canReturnProb :
                dataBaseProb = NUM.ones((self.infoRasterInstances.nRows*self.infoRasterInstances.nCols), 
                                dtype = NUM.float32)*float(NULL)
        else:
            if useNetCDFAsOutput:
                chunckSize = (nRowsStep, nColsStep)
                #### Create on netCDF file ####
                dataset, variable, pathTempNC = self.createTemporalNC(self.infoRasterInstances, 
                                                                      chunkSizes = None)
            else:
                # if DBGLARGERASTER:
                    # ARCPY.AddWarning("Multiple temporal files will be created to predict.")

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

                if processUncer:
                    pathFLTQU, nameFLTQU =  self.createTemporalFLT(cellSize = self.infoRasterInstances.cellSize,
                                                               xMinYMin = xMinYMin,
                                                               nRowsCols = (self.infoRasterInstances.nRows,
                                                                           self.infoRasterInstances.nCols),
                                                               data = None,
                                                               srf = self.infoRasterInstances.srf)

                    pathFLTQL, nameFLTQL =  self.createTemporalFLT(cellSize = self.infoRasterInstances.cellSize,
                                                               xMinYMin = xMinYMin,
                                                               nRowsCols = (self.infoRasterInstances.nRows,
                                                                           self.infoRasterInstances.nCols),
                                                               data = None,
                                                               srf = self.infoRasterInstances.srf)
                elif isClass and canReturnProb:
                    pathFLTProb, nameFLTProb =  self.createTemporalFLT(cellSize = self.infoRasterInstances.cellSize,
                                                               xMinYMin = xMinYMin,
                                                               nRowsCols = (self.infoRasterInstances.nRows,
                                                                           self.infoRasterInstances.nCols),
                                                               data = None,
                                                               srf = self.infoRasterInstances.srf)
        sharePredictValues = None
        cnt = 0
        #### Iterate Number of Raster ####
        for listBase in oup:

            #### Get Information of Current Chuck  (Group of Zones) ####
            infoSlice = self.calculateChunckSize(self.infoRasterInstances, listBase)
            chunckSize , newSliceCol, newSliceRow, iniIndex, \
            xMinYMin, nColsStep, nRowsStep = infoSlice

            if not sizeRaster < maxSizeCells:
                #### Create Temporal Array Container ####
                dataBase = NUM.ones((nRowsStep*nColsStep), dtype = NUM.float32)*float(NULL)

                #### Base for Quantiles ####
                if processUncer:
                    dataBaseQU = NUM.ones((nRowsStep*nColsStep), dtype = NUM.float32)*float(NULL)
                    dataBaseQL = NUM.ones((nRowsStep*nColsStep), dtype = NUM.float32)*float(NULL)
                elif isClass and canReturnProb:
                    dataBaseProb = NUM.ones((nRowsStep*nColsStep), dtype = NUM.float32)*float(NULL)

            #### Predict Each Zone in a Chunck ####
            for i in listBase:

                #### Extract Data From All Raster Dataset for the Current Zone i ####
                mask = rfTest.loadDataRasterForPredicting(rfTraining, self.infoRasterInstances, i)

                #### If Mask is None ####
                if mask is None:
                    continue

                #### Get Dimension Raster Zones ####
                self.rasterDimensionInfo = self.infoRasterInstances.getRasterInfoZone(i)

                if sizeRaster < maxSizeCells:
                    #### Mask Contain Real Cell Ids ####
                    self.rasterDimensionInfo[1] = mask
                else:
                    #### Mask Id Cell are Relative to Current Container ####
                    self.rasterDimensionInfo[1] = mask - iniIndex

                dataP = None

                if enableShareAndUncert:

                    ##### Execute Forest For each Zone ####
                    dataP = executeFR(x = rfTraining.x_train,
                                y = rfTraining.y_train,
                                x_test = rfTraining.x_test,
                                y_test = rfTraining.y_test,
                                type_vars = rfTraining.getVars(),
                                real_x_to_predict = rfTest.x,
                                number_trees = hpar.numTrees,
                                node_size = hpar.leafSize,
                                sample_size = hpar.sample_size,
                                max_nodes = hpar.maxLevel,
                                model = "",
                                header = header,
                                permute_vars = hpar.fields_to_try,
                                seed = randSeed,
                                balance = int(hpar.balanceTree),
                                uncertainty = int(hpar.uncertainty),
                                classwt = hpar.xgbPar,
                                msg_info = msg_info,
                                return_prob = 0)

                    #### Stop Process ###
                    if dataP is None:
                        return

                else:
                    dataPred = self.predict()
                    prediction = probability = None

                    if dataPred is not None and len(dataPred) == 2:
                        prediction, probability = dataPred

                    #### Stop Process ###
                    if dataPred is None:
                        return
                    dataP = [None, probability, prediction]

                if enableShareAndUncert:
                    #### Aggregate Values To Calculate Share ####
                    shareValues = self.getMinMaxX(rfTraining, rfTest.x)

                    #### Get Information To Calculate Share from Each Zone ####
                    if cnt == 0  :
                        sharePredictValues = shareValues
                    else:
                        if sharePredictValues is not None:
                            for i, ele in enumerate(shareValues):
                                sharePredictValues[i].extend(ele)

                cnt += 1

                #### Update Container dataBase ####
                listVal = self.outputRaster(dataP[2], newSRF = newSRF,
                                                getNValues = sampleVisSize,
                                                dataBase = dataBase,
                                                outputPath = hpar.outputRaster)

                if processUncer:
                    #### Update Container Upper and Lower Quantile ####
                    dataBaseQU[self.rasterDimensionInfo[1]] = dataP[13]
                    dataBaseQL[self.rasterDimensionInfo[1]] = dataP[12]
                elif isClass and canReturnProb:
                    dataBaseProb[self.rasterDimensionInfo[1]] = dataP[1]

                valuesToRender.extend(listVal)
                del dataP
                GC.collect()

            if not sizeRaster < maxSizeCells:
                #### One Temporal netCDF file ####
                if useNetCDFAsOutput:
                    #### Reshape Array ####
                    dataBase.shape = (nRowsStep, nColsStep)
                    #### Set netCDF Slice / Insert Data ###
                    variable[newSliceRow,newSliceCol] = dataBase
                    #### Flush data To disk ####
                    dataset.sync()
                else:

                    ##### Update Temporal File FLT for each Chunck ####
                    ARCPY.SetProgressor("default", "Adding prediction..." )

                    #### Reshpae dataBase Array ####
                    dataBase.shape = (nRowsStep, nColsStep)


                    #### Update Temporal FLT File ####
                    workspaceOutput, outputName = self.createTemporalFLT(data = dataBase,
                                                                         xMinYMin= xMinYMin, 
                                                                         nRowsCols= (nRowsStep,nColsStep), 
                                                                         cellSize = self.infoRasterInstances.cellSize
                                                                         )

                    listRasterZones.append(outputName)
                    ARCPY.ResetProgressor()

                    if processUncer:
                        ##### Update Temporal File FLT for each Chunck ####
                        ARCPY.SetProgressor("default", "Adding prediction Upper Quartile..." )

                        #### Reshpae dataBase Array ####
                        dataBaseQU.shape = (nRowsStep, nColsStep)
                        #### Update Temporal FLT File ####
                        workspaceOutput, outputName = self.createTemporalFLT(data = dataBaseQU,
                                                                             xMinYMin= xMinYMin, 
                                                                             nRowsCols= (nRowsStep,nColsStep), 
                                                                             cellSize = self.infoRasterInstances.cellSize
                                                                             )
                        listRasterZonesQU.append(outputName)
                        ARCPY.ResetProgressor()

                        ##### Update Temporal File FLT for each Chunck ####
                        ARCPY.SetProgressor("default", "Adding prediction Lower Quartile..." )
                        #### Reshpae dataBase Array ####
                        dataBaseQL.shape = (nRowsStep, nColsStep)
                        #### Update Temporal FLT File ####
                        workspaceOutput, outputName = self.createTemporalFLT(data = dataBaseQL,
                                                                              xMinYMin= xMinYMin, 
                                                                             nRowsCols= (nRowsStep,nColsStep), 
                                                                             cellSize = self.infoRasterInstances.cellSize)
                        listRasterZonesQL.append(outputName)
                        ARCPY.ResetProgressor()
                    elif isClass and canReturnProb:
                        ##### Update Temporal File FLT for each Chunck ####
                        ARCPY.SetProgressor("default", "Adding probability..." )

                        #### Reshpae dataBase Array ####
                        dataBaseProb.shape = (nRowsStep, nColsStep)
                        #### Update Temporal FLT File ####
                        workspaceOutput, outputName = self.createTemporalFLT(data = dataBaseProb,
                                                                             xMinYMin= xMinYMin, 
                                                                             nRowsCols= (nRowsStep,nColsStep), 
                                                                             cellSize = self.infoRasterInstances.cellSize
                                                                             )
                        listRasterZonesProb.append(outputName)
                        ARCPY.ResetProgressor()

        #### Calculate Min Max ####
        sharePredict = []
        if sharePredictValues is not None:
            for el in sharePredictValues:
                sharePredict.append([min(el), max(el)])

        try:
            #### Create Share Summary ####
            shareMsg = self.reportShare(rfTraining, shareBase, shareTraining, shareTest, sharePredict)
            for rep in shareMsg:
                ARCPY.AddMessage(rep)
        except:
            pass

        if sizeRaster < maxSizeCells:
            #### Create Temporal File FLT For Container ####
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84857))
            dataBase.shape = (self.infoRasterInstances.nRows, self.infoRasterInstances.nCols)
            outPath, outName = OS.path.split(hpar.outputRaster)

            if "." in outName:
                index = len(outName) - outName.find(".")
                removeExt = outName[index:]
                if removeExt in outName.lower():
                    outName = outName.lower().replace(removeExt,"")

            self.createOutputRasterFromTemporalFile(hpar.outputRaster, self.infoRasterInstances, dataBase )
            ARCPY.ResetProgressor()

            if processUncer:

                #### Name Rasters  in the Workspace ####
                upPath = OS.path.join(hpar.rasterWorkSpace, outName + "_Q_HIGH" + hpar.extensionBase)
                loPath = OS.path.join(hpar.rasterWorkSpace, outName + "_Q_LOW" + hpar.extensionBase)
                listRasterW = [upPath, loPath ]

                #### Delete Raster ####
                for path  in listRasterW:
                    UTILS.passiveDelete(path)

                #### Create Temporal File FLT For Container ####
                ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84857))
                dataBaseQU.shape = (self.infoRasterInstances.nRows, self.infoRasterInstances.nCols)
                self.createOutputRasterFromTemporalFile(upPath, self.infoRasterInstances, dataBaseQU)
                ARCPY.ResetProgressor()

                #### Create Temporal File FLT For Container ####
                ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84857))
                dataBaseQL.shape = (self.infoRasterInstances.nRows, self.infoRasterInstances.nCols)
                self.createOutputRasterFromTemporalFile(loPath, self.infoRasterInstances, dataBaseQL)
                ARCPY.ResetProgressor()
                self.listRasterW = listRasterW
            elif isClass and canReturnProb:
                #### Name Rasters  in the Workspace ####
                probPath = OS.path.join(hpar.rasterWorkSpace, outName + "_Probability" + hpar.extensionBase)

                listRasterW = [probPath ]

                #### Delete Raster ####
                for path  in listRasterW:
                    UTILS.passiveDelete(path)

                #### Create Temporal File FLT For Container ####
                ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84857))
                dataBaseProb.shape = (self.infoRasterInstances.nRows, self.infoRasterInstances.nCols)
                self.createOutputRasterFromTemporalFile(probPath, self.infoRasterInstances, dataBaseProb)
                ARCPY.ResetProgressor()

        else:
            if useNetCDFAsOutput:
                #### Close NetCDF File ####
                dataset.close()

                strOut = "RFNC_OUTPUT"
                ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84857))
                #### Make Raster Layer ####
                ARCPY.md.MakeNetCDFRasterLayer(pathTempNC, "PREDICTED", "x", "y", strOut, None, None, "BY_VALUE")
                #### Copy NetCDF Layer To Output Raster File ####
                ARCPY.management.CopyRaster(strOut, hpar.outputRaster, None, None, NULL, "NONE", "NONE", None, "NONE", "NONE", None, "NONE")

                #### Delete Raster Layer ####
                UTILS.passiveDelete(strOut)
                ARCPY.ResetProgressor()

                ARCPY.SetProgressor("default", "Removing Temporal NetCDF File")
                try:
                    OS.remove(pathTempNC)
                except:
                    ARCPY.AddWarning("Temporal NetCDF File was not removed " + pathTempNC)
                    pass
                ARCPY.ResetProgressor()

            else:
                multipleFLTAreCreated = len(set(listRasterZones)) > 1
                #### Create Predition Output ####
                outPath, outName = OS.path.split(hpar.outputRaster)

                if "." in outName:
                    index = len(outName)- outName.find(".")
                    removeExt = outName[index:]
                    if removeExt in outName.lower():
                        outName = outName.lower().replace(removeExt,"")


                self.createFinalOutput(hpar, multipleFLTAreCreated, workspaceOutput, listRasterZones, pathFLT, nameFLT,
                                       hpar.outputRaster, srf = newSRF)


                if processUncer:

                    #### Name Rasters  in the Workspace ####
                    upPath = OS.path.join(hpar.rasterWorkSpace, outName + "_Q_HIGH" + hpar.extensionBase)
                    loPath = OS.path.join(hpar.rasterWorkSpace, outName + "_Q_LOW" + hpar.extensionBase)
                    listRasterW = [upPath, loPath ]

                    #### Delete Raster ####
                    for path  in listRasterW:
                        UTILS.passiveDelete(path)

                    #### Create Upper Quartile  ####
                    self.createFinalOutput(hpar, multipleFLTAreCreated, workspaceOutput, listRasterZonesQU,
                                           pathFLTQU, nameFLTQU, upPath, strProgressor = "Upper Quartile",srf = newSRF)

                    #### Create Lower Quartile  ####
                    self.createFinalOutput(hpar,multipleFLTAreCreated, workspaceOutput, listRasterZonesQL,
                                           pathFLTQL, nameFLTQL, loPath, strProgressor = "Lower Quartile", srf = newSRF )

                    #### Set List of Raster in the workspace ####
                    self.listRasterW = listRasterW
                elif isClass and canReturnProb:
                    #### Name Rasters  in the Workspace ####
                    probPath = OS.path.join(hpar.rasterWorkSpace, outName + "_Probability" + hpar.extensionBase)

                    listRasterW = [probPath]

                    #### Delete Raster ####
                    for path  in listRasterW:
                        UTILS.passiveDelete(path)

                    #### Create Upper Quartile  ####
                    self.createFinalOutput(hpar, multipleFLTAreCreated, workspaceOutput, listRasterZonesProb,
                                           pathFLTProb, nameFLTProb, probPath, strProgressor = "Probability",srf = newSRF)
                    self.listRasterW = listRasterW


        #### Required Output For Classification ####
        if isClass:
            valuesToRender = (self.rfTraining.yField.info, list(set(valuesToRender)))
        else:
            valuesToRender = NUM.asarray(valuesToRender, dtype = float)

        ARCPY.SetProgressor("default",ARCPY.GetIDMessage(84858))
        #### Apply Layer In The Output Raster Merged ####
        applyLayer(hpar, "output_raster", data = valuesToRender,
                    isClass = isClass, headingName = self.rfTraining.yField.name,
                    shapeType = "Raster", isTrainingOutput = False, isRasterLayer = True)
        ARCPY.ResetProgressor()

        #### Delete Objects ####
        del dataBase
        GC.collect()

    def executeModel(self, rfTraining, rfTest = None, rasterInfo = None, 
                     ssdoPoints2Train = None, newSRF = None, infoRasterInstances = None ):

        """
        Execute Model
        """
        msg_info = ARCPY.GetIDMessage(220648)
        self.rfTraining = rfTraining
        hpar = self.hpar
        randSeed = self.randSeed

        #### Raster Info ###
        self.infoRasterInstances = infoRasterInstances
        info = None
        processInBatches = False

        if infoRasterInstances is not None:
            infoRasterInstances.preProcessZones()
            newSRF = infoRasterInstances.srf
            processInBatches = len(infoRasterInstances.rangeZones) > 1

            if not processInBatches :
                mask = rfTest.loadDataRasterForPredicting(rfTraining, infoRasterInstances, 0)

                if mask is None:
                    ARCPY.AddError("Sampling training data failed.")
                    raise SystemExit

                self.rasterDimensionInfo = infoRasterInstances.getRasterInfoZone()
                self.rasterDimensionInfo[1] = mask

        if processInBatches:

            header = rfTraining.getHeader()
            randSeed1, bestValue, listDecValues, maxIndexReach, importanceArray = self.iterateTraining(randSeed, rfTraining, True)

            if hpar.outputModel != "":
                saveModelInfo(rfTraining,hpar)

            self.reportImportanceDistribution(rfTraining, randSeed1, maxIndexReach, importanceArray)

            if randSeed1 != randSeed:
                randSeed = randSeed1
                rfTraining.seed = randSeed
                if not hpar.optimize:
                    rfTraining.splitDataForTesting(hpar.balanceTree)

            #### Check All Categories Were Used ####
            rfTraining.viewSplitMessage = True
            rfTraining.areAllCategoriesUsed()

            data = executeFR(x = rfTraining.x_train,
                                            y = rfTraining.y_train,
                                            x_test = rfTraining.x_test,
                                            y_test = rfTraining.y_test,
                                            type_vars = rfTraining.getVars(),
                                            number_trees = hpar.numTrees,
                                            node_size = hpar.leafSize,
                                            sample_size = hpar.sample_size,
                                            model = hpar.outputModel,
                                            max_nodes = hpar.maxLevel,
                                            header = header, 
                                            permute_vars = hpar.fields_to_try,
                                            seed = randSeed,
                                            balance = int(hpar.balanceTree),
                                            uncertainty = int(hpar.uncertainty),
                                            classwt = hpar.xgbPar,
                                            msg_info = msg_info,
                                            return_prob = 0)

            #### Stop Process ###
            if data is None:
                return

            self.report(rfTraining, data, hpar,
                        randSeed, bestValue, listDecValues, maxIndexReach,
                        ssdoPoints2Train , displayShare = False)

            #### Process Raster By Chuncks ####
            self.processRasterByParts(rfTest, randSeed, hpar, newSRF)

            return

        else:
            if hpar.what == "NONE":
                #### Create Output Trained Data ####
                if hpar.numTrees == 0:
                    if hpar.outputTrainedFeatures is not None:
                        self.createOutputFromRFField(rfTraining, hpar.outputTrainedFeatures, None, hpar,
                                                    ssdoTrField = ssdoPoints2Train)
                        return
                    else:
                        ARCPY.AddIDMessage("ERROR", 110229)
                        return

                header = rfTraining.getHeader()

                randSeed1, bestValue, listDecValues, maxIndexReach, importanceArray = self.iterateTraining(randSeed, rfTraining )
                self.reportImportanceDistribution(rfTraining, randSeed1, maxIndexReach, importanceArray)

                if randSeed1 != randSeed:
                    randSeed = randSeed1
                    rfTraining.seed = randSeed
                    if not hpar.optimize:
                        rfTraining.splitDataForTesting(hpar.balanceTree)

                #### Check All Categories Were Used ####
                rfTraining.viewSplitMessage = True
                rfTraining.areAllCategoriesUsed()

                if hpar.outputModel != "":
                    saveModelInfo(rfTraining,hpar)
  
                data = executeFR(x = rfTraining.x_train,
                                            y = rfTraining.y_train,
                                            x_test = rfTraining.x_test,
                                            y_test = rfTraining.y_test,
                                            type_vars = rfTraining.getVars(),
                                            number_trees = hpar.numTrees,
                                            node_size = hpar.leafSize,
                                            sample_size = hpar.sample_size,
                                            model = hpar.outputModel,
                                            max_nodes = hpar.maxLevel,
                                            header = header, 
                                            permute_vars = hpar.fields_to_try,
                                            seed = randSeed,
                                            balance = int(hpar.balanceTree),
                                            uncertainty = int(hpar.uncertainty),
                                            classwt = hpar.xgbPar,
                                            msg_info= msg_info,
                                            return_prob= 1 if hpar.addProbabilities else 0)

                #### RF does not return anything ####
                if data is None:
                    return

                self.report(rfTraining, data, hpar,
                            randSeed, bestValue, listDecValues, maxIndexReach,
                            ssdoPoints2Train)
                return

            if hpar.what in ["RASTER", "FEATURES"]:

                header = rfTraining.getHeader()
                randSeed1, bestValue, listDecValues, maxIndexReach, importanceArray = self.iterateTraining(randSeed, rfTraining, True )
                self.reportImportanceDistribution(rfTraining, randSeed1, maxIndexReach, importanceArray)

                
                if randSeed1 != randSeed:
                    randSeed = randSeed1
                    rfTraining.seed = randSeed
                    if not hpar.optimize:
                        rfTraining.splitDataForTesting(hpar.balanceTree)
                else:
                    #### Raster Dataset Split Testing Subset ####
                    if infoRasterInstances is not None:
                        rfTraining.splitDataForTesting(hpar.balanceTree)

                #### Check All Categories Were Used ####
                rfTraining.viewSplitMessage = True
                rfTraining.areAllCategoriesUsed()

                if hpar.outputModel != "":
                    saveModelInfo(rfTraining,hpar)

                data = executeFR(x = rfTraining.x_train,
                                            y = rfTraining.y_train,
                                            x_test = rfTraining.x_test,
                                            y_test = rfTraining.y_test,
                                            type_vars = rfTraining.getVars(),
                                            real_x_to_predict = rfTest.x, 
                                            number_trees = hpar.numTrees,
                                            node_size = hpar.leafSize,
                                            sample_size = hpar.sample_size,
                                            max_nodes = hpar.maxLevel,
                                            model = hpar.outputModel,
                                            header = header, 
                                            permute_vars = hpar.fields_to_try,
                                            seed = randSeed,
                                            balance = int(hpar.balanceTree),
                                            uncertainty = int(hpar.uncertainty),
                                            classwt = hpar.xgbPar,
                                            msg_info = msg_info,
                                            return_prob= 1 if hpar.addProbabilities else 0)

                #### RF does not return anything ####
                if data is None:
                    return

                predictData = data[2]

                self.report(rfTraining, data, hpar,
                            randSeed, bestValue, listDecValues, maxIndexReach,
                            ssdoPoints2Train, rfTest = rfTest)

                if hpar.what == "FEATURES":

                    if hpar.outputFeatures != "":
                        trainedData = testingData = predictData = errors = \
                        classErrors = varianceErrors = importance = depth = \
                        trainedProb = testingProb = predictProb =\
                        trQ1 = trQ2 = teQ1 = teQ2 = prQ1 = prQ2 = None
                        quartileData = None
                        if int(hpar.uncertainty) == 0:
                            trainedData, testingData, predictData, errors, \
                            classErrors, varianceErrors, importance, depth, \
                            trainedProb, testingProb, predictProb = data
                        else:
                            trainedData, testingData, predictData, errors,  \
                            classErrors, varianceErrors, importance, depth, \
                            trQ1, trQ2, teQ1, teQ2, prQ1, prQ2 = data
                            quartileData= (prQ1 , prQ2)

                        self.createOutput(predictData, rfTraining, rfTest, rfTest.ssdo, hpar.outputFeatures, hpar, quartileData, predictProb)

                if hpar.what == "RASTER":
                    self.outputRaster(predictData, newSRF = newSRF, outputPath = hpar.outputRaster)
                    outPath, outName = OS.path.split(hpar.outputRaster)

                    #### Remove tif - output name of derive rasters ####
                    if "." in outName:
                        index = len(outName)- outName.find(".")
                        removeExt = outName[-index:]
                        if removeExt in outName.lower():
                            outName = outName.lower().replace(removeExt,"")

                    isClass = rfTraining.yField.rfType == "Categorical"

                    if int(hpar.uncertainty) == 1:

                        predictDataQL = data[12]
                        predictDataQU = data[13]

                        #### Name Rasters  in the Workspace ####
                        upPath = OS.path.join(hpar.rasterWorkSpace, outName + "_Q_HIGH" + hpar.extensionBase)
                        loPath = OS.path.join(hpar.rasterWorkSpace, outName + "_Q_LOW" + hpar.extensionBase)
                        listRasterW = [upPath, loPath ]

                        #### Delete Raster ####
                        for path  in listRasterW:
                            UTILS.passiveDelete(path)

                        self.outputRaster(predictDataQU, newSRF = newSRF, outputPath = upPath, applyLayerB = False)
                        self.outputRaster(predictDataQL, newSRF = newSRF, outputPath = loPath, applyLayerB = False)

                        #### Set List of Raster in the workspace ####
                        self.listRasterW = listRasterW

                    elif isClass  and hpar.enabledRasterProbability and hpar.addProbabilities:
                        outPath, outName = OS.path.split(hpar.outputRaster)
                        probPath = OS.path.join(hpar.rasterWorkSpace, outName + "_Probability" + hpar.extensionBase)
                        listRasterW = [probPath]
                        #### Delete Raster ####
                        for path  in listRasterW:
                            UTILS.passiveDelete(path)

                        probData = data[-1]
                        self.outputRaster(probData, newSRF = newSRF, outputPath = probPath, applyLayerB = False)
                        self.listRasterW = listRasterW

class BaseRaster:
    """ Base Raster """

    def __init__(self):
        self.nCols = None
        self.nRows = None
        self.xc = None
        self.yc = None

    def getXY(self, idIni = None, col = None, row = None):
        """Get XY Coordinates centroid from index (int) or array of indices [int]
        """
        if col is None:
            col = idIni % self.nCols
            row = idIni // self.nCols

        if type(idIni) in [NUM.int32, int] or type(col) in [NUM.int32, int]:
            #return NUM.array([self.xMin + col*self.xc,self.yMax - self.yc - row*self.yc])
            return NUM.array([self.xMin + col*self.xc + self.xc*0.5,
                       self.yMax - self.yc*0.5 - row*self.yc])
        else:
            col = idIni % self.nCols
            row = idIni // self.nCols
            coord = NUM.zeros((len(idIni),2), dtype = float)
            coord.T[0] = self.xMin + self.xc*.5 + col*self.xc
            coord.T[1] = self.yMax - self.yc*.5 - row*self.yc
            return coord

    def getColRow(self, x, y):
        """ get Col Row """
        dx = x - self.xMin
        dy = self.yMax - y
        col = NUM.ceil(dx/self.xc) - 1
        row = NUM.ceil(dy/self.yc) - 1
        return int(col), int(row)
        
    def getIndices (self, coords):
        """ get Col Row """
        return self.getIndicesBasic(coords, self.nCols, self.xMin, self.yMax, self.xc)

    def getIndicesBasic (self, coords, nCols, xMin, yMax, cellSize):
        """ Get Col Row new zone """
        dx = coords.T[0] - xMin
        dy = yMax - coords.T[1]
        col = NUM.ceil(dx/cellSize) - 1
        row = NUM.ceil(dy/cellSize) - 1
        return nCols*row + col


class TestRaster():
    """
    TestRaster Class is used test the RasterMeta/RasterInfo Fuctions
    """
    def __init__(self, cellSize, extent, srf, testName = "", rasterObj = None):
        """ Initilize Class
        INPUT:
            cellSize (float): Cell Size
            extent (arcpy.Extent instance): Raster Extent
            srf (Spatial Reference instance): Spatial Reference
            testName {strin, ""}: Raster Name
        """
        if rasterObj is not None:
            self.meanCellWidth = rasterObj.meanCellWidth
            self.meanCellHeight = rasterObj.meanCellHeight
            self.extent = rasterObj.extent
            self.spatialReference = rasterObj.spatialReference
            self.bandCount = 1
            self.name = "Raster " + testName
            self.catalogPath = r"Raster\\" + testName
            self.width = int( (self.extent.XMax - self.extent.XMin)/self.meanCellWidth )
            self.height = int( (self.extent.YMax - self.extent.YMin)/self.meanCellHeight )
            return
        
        self.meanCellWidth = cellSize
        self.meanCellHeight = cellSize
        self.extent = extent
        self.spatialReference = srf
        self.bandCount = 1
        self.name = "Raster " + testName
        self.catalogPath = r"Raster\\" + testName
        self.width = int( (self.extent.XMax - self.extent.XMin)/cellSize)
        self.height = int( (self.extent.YMax - self.extent.YMin)/cellSize)

    def dummyLarge(size = 1, name = ''):
        """Create Dummy large Raster 
        """
        if size == 1:
            srf = ARCPY.SpatialReference(26910)
            cellSize = 0.1
            xMin = yMax = 500000
            nCols = 150000
            nRows = 50000
            xMax = xMin + nCols*cellSize
            yMin = yMax - nRows*cellSize
            ext = ARCPY.Extent(XMin = xMin, YMin = yMin, XMax = xMax, YMax = yMax)
            return TestRaster(cellSize, ext, srf, testName = name)
        if size == 2:
            srf = ARCPY.SpatialReference(102003)
            cellSize = 10.4089398045887
            xMin = -2950438.4687
            yMax = 1733595.78
            nCols = 576358
            nRows = 310462
            xMax = xMin + nCols*cellSize
            yMin = yMax - nRows*cellSize
            ext = ARCPY.Extent(XMin = xMin, YMin = yMin, XMax = xMax, YMax = yMax)
            return TestRaster(cellSize, ext, srf, testName = name)

    def __repr__(self):
        return "TestRaster"

class RasterInfo(BaseRaster):
    """ This Class extracts information of a list of raster datasets"""
    
    def __init__(self, listRasters, typeRF, bandList = None,  maxSize = MEMSIZE, 
                 srfOutput = None, ssdo = None, printInfo = True, thresholdRaster = MEMPOINT,
                 rasterNames = None, disableMessage = False ):
        """Constructor RasterInfo Class """

        self.disableMessage = disableMessage
        self.printInfo = printInfo
        self.ssdo = ssdo
        self.srfOutput = srfOutput

        if self.ssdo is not None:
            self.srfOutput = None

        #### Mask Extent to Predict ####
        self.maskExtentFC = ARCPY.env.mask
        self.maskDataFC = None

        #### Maximum data to Process by Batch ####
        self.MAXALLOWED = maxSize
        self.thresholdRaster = thresholdRaster

        if str(listRasters[0]) == "TestRaster":
            self.sourceListRasters = listRasters
            self.listRasters = listRasters
            self.newNames = [i.name for i in listRasters]
            self.dictRasterBand = {i.catalogPath: [[order, ""]] for order, i in enumerate(listRasters)}
            self.orderRaster = [[listRasters[0].catalogPath, ""] * len(listRasters)]
        else:
            #### List of Raster Datase Source ####
            self.sourceListRasters = listRasters

            #### Detect Bands in List of Rasters ####
            groupRasterInfo = getNameRasterFromBands(listRasters, rasterNames, False)

            #### Names-Bands / Raster Path Dict([Order -Bands]) / Just Raster Path ####
            self.newNames, self.dictRasterBand, self.orderRasterN = groupRasterInfo

            #### List of Real Raster to Process (excluding Bands) ####
            self.listRasters = list(self.dictRasterBand.keys())

        #### Define Type of Extraction (True-> Bilinear/ False-> Nearest) ####
        self.typeRF = typeRF

        #### Number of Layers(Bands in all Raster Datasets) ####
        self.numTotalOfBandToUse = len(self.sourceListRasters)

        #### Reduce Threshold to Avoid Create Large Size of Centroids ####
        if self.numTotalOfBandToUse == 1:
            self.MAXALLOWED = self.MAXALLOWED/2

        #### List of Bands in each Raster ####
        self.bandList = []

        #### Index Order of each band respect source raster order ####
        self.orderBands= []

        #### 1-bil 0->near ####
        self.typeField = []

        for rasterPath in self.dictRasterBand:
            orderBandsArray = self.dictRasterBand[rasterPath]
            orderR, bandR = orderBandsArray[0]
            #### Check Number of Bands to Process in each Raster ####

            if len(orderBandsArray) == 1 and bandR in ["", "RenamedBand"]:

                if bandR == "RenamedBand":
                    self.bandList.append(NUM.array([-1], dtype = int))
                else:
                    self.bandList.append(NUM.array([0], dtype = int))

                self.orderBands.append(NUM.array([orderR], dtype = int))
                typeFieldv = 1 if self.typeRF[orderR] else 0
                self.typeField.append(NUM.array([typeFieldv], dtype = int))
            else:
                bands = []
                orderv = []
                typeFieldv = []
                #### Generate list of index Bands and Order Index ####
                for order_band in orderBandsArray:
                    bands.append(int(order_band[1].upper().replace("BAND_","").replace("LAYER_",""))-1)
                    orderv.append(order_band[0])
                    typeFieldT = 1 if self.typeRF[order_band[0]] else 0
                    typeFieldv.append(typeFieldT)
                self.bandList.append(NUM.array(bands, dtype = int))
                self.orderBands.append(NUM.array(orderv, dtype = int))
                self.typeField.append(NUM.array(typeFieldv, dtype = int))

        self.grp = {}
        self.infoR = []
        self.gcsR = []

        #### Get Raster Properties ####
        self.infoAboutRasters()

    def createSubsetRasterFromCellCentroids(self, outputRaster, cellCentroids, data, srf):
        """ Create a raster """
        if len(cellCentroids) !=  len(data):
            ARCPY.AddIDMessage("ERROR", 441)
            raise SystemExit
            
        minX = cellCentroids.T[0].min()
        minY = cellCentroids.T[1].min()
        maxX = cellCentroids.T[0].max()
        maxY = cellCentroids.T[1].max()
        colRowLT = self.getColRow(minX, maxY)
        colTL, rowTL = colRowLT
        colRowRB = self.getColRow(maxX, minY)
        colBR, rowBR = colRowRB
        
        cellSize = self.cellSize
        halfCell = cellSize/2.0
        minXCell = minX - halfCell
        minYCell = minY - halfCell
        maxYCell = maxY + halfCell
        initialPoint = ARCPY.Point(minXCell, minYCell)
        
        nCols = (colBR - colTL + 1 )
        nRows = (rowBR - rowTL + 1)
        nCells = nCols*nRows

        dataBase = NUM.ones(nCells, dtype = float)*NULL 
        indices  = NUM.asarray(self.getIndicesBasic(cellCentroids, nCols, minXCell, maxYCell, cellSize ), dtype = NUM.int64)
        
        dataBase[indices] = data
        dataBase.shape = (nRows, nCols)
        spatialRef2SetBack = ARCPY.env.outputCoordinateSystem
        ARCPY.env.outputCoordinateSystem = srf
        raster = ARCPY.NumPyArrayToRaster (dataBase, initialPoint, cellSize , cellSize, NULL)
        raster.save(outputRaster)
        ARCPY.env.outputCoordinateSystem = spatialRef2SetBack
        
        
    def getInfo(self, otherData):
        """ Get Info about raster
        """
        header = "Info Raster"
        justif = ["Left", "Left"]
        rows = []
        rows.append([".listRaster", str(self.newNames)])
        rows.append([".intersection", str(self.intersection)])
        rows.append([".cellSize", str(self.cellSize)])
        rows.append(["Number Zones", str(len(self.rangeZones))])
        for i, e in enumerate(self.rangeZones):
            rows.append(["Zones {0}".format(i), str(e[0])+ "-"+ str(e[1])])

        for i,listBase in enumerate(otherData):
            iniBase = self.getRasterInfoZone(listBase[0])[0]
            endBase = self.getRasterInfoZone(listBase[-1])[0]

            #### Get Indice Info ####
            iniRow = iniBase[0].start
            endRow = endBase[0].stop
            iniCol = iniBase[1].start
            endCol = endBase[1].stop
            nColsStep = endCol-iniCol
            nRowsStep = endRow-iniRow
            iniIndex = self.rangeZones[listBase[0]][0]
            xMinYMin = self.getRasterInfoZone(listBase[-1])[2]
            rows.append(["iniBase zone {0}/{1}".format(i, len(listBase)), str(iniBase)])
            rows.append(["endBase zone {0}/{1}".format(i, len(listBase)), str(endBase)])


        outputReport = UTILS.outputTextTable(rows, header = header,
                                             justify = justif, pad = 1, colPad = 5,
                                             titleFillToken = "-", force2Txt=False)
        ARCPY.AddMessage(outputReport)

    def getExt(self, ssdo):
        polyDict, polyAreas = UTILS.readPolygonFC(ssdo.inputFC,
                                        spatialRef = ssdo.spatialRef,
                                        useGeodesic = ssdo.useChordal)
        boundArea = sum(polyAreas.values())
        boundExtent = UTILS.getPolyExtent(polyDict)
        return UTILS.getExtent(boundExtent)

    def getMaskExtentIds(self):
        """ Get mask data using the intersection extent
        """

        if self.intersection is not None and self.maskExtentFC is not None:
            pol = self.extentIntersection.polygon
            desc = ARCPY.Describe(self.maskExtentFC)
            polMask = desc.extent.polygon.projectAs(self.srf)
            base = pol.intersect(polMask, 4)

            if base.area > 0:
                ext = base.extent
                colTL, rowTL = self.getColRow(ext.XMin, ext.YMax)
                colBR, rowBR = self.getColRow(ext.XMax, ext.YMin)

                nCols = (colBR - colTL +1 )

                if (rowBR - rowTL + 1)*(colBR - colTL + 1) < (2 * maxSizeCells):
                    self.maskDataFC = NUM.zeros((rowBR - rowTL + 1)*(colBR - colTL + 1), dtype = NUM.int64)
                else:
                    self.maskDataFC = None
                    self.maskExtentFC = None
                    return

                cnt = 0

                for row in NUM.arange(rowTL, rowBR + 1):
                    info = self.nCols*row + NUM.arange(colTL, colBR+1, dtype = int)
                    sliceV = slice(cnt*nCols,(cnt+1)*nCols)
                    cnt += 1
                    self.maskDataFC[sliceV] = info
        return


    def createPolygon(self, rExt, segmentSize):
            top =    [ARCPY.Point(x,         rExt.YMax) for x in NUM.arange(rExt.XMin,rExt.XMax,  segmentSize) ]
            right =  [ARCPY.Point(rExt.XMax,         y) for y in NUM.arange(rExt.YMax,rExt.YMin, -segmentSize) ]
            botton = [ARCPY.Point(x,         rExt.YMin) for x in NUM.arange(rExt.XMax,rExt.XMin, -segmentSize) ]
            left =   [ARCPY.Point(rExt.XMin,         y) for y in NUM.arange(rExt.YMin,rExt.YMax,  segmentSize) ]
            merge = top + right + botton + left
            array = ARCPY.Array(merge)
            polygon = ARCPY.Polygon(array, spatial_reference = rExt.spatialReference)
            return polygon

    def __polygonExtent(self, toSRF, rSRF, rExt):
        #### The projection of the geographic extent should include multiple points to describe the area ####
        #### This method is only applied when the target is GCS and the raster base is PCS  issue-5094 ####
        eps = 5e4

        if toSRF.type.upper() == "GEOGRAPHIC" and  rSRF.type.upper() == "PROJECTED":
            ### Assuming extent deformation when width > eps ####
            if rExt.width > eps:
                return self.createPolygon(rExt, eps)
            
        return rExt.polygon  

    def getRastersExtent(self, rasters, ssdo = None, spatialRef = None, 
                         printCell = True, applyGetExtent = True,
                         maskExtent = None):
        """
        Verify if Rasters overlap Feature Class (ssdo)
        INPUT:
            ssdo {SSDataObject instance /str fc}: object for training 
            rasters {list RasterMeta}: list of rasters
            spatialRef {spatialReference instance}: Output spatial reference 
            printCell {bool}: print information cell size
            applyGetExtent {return}: vector /false extent
            maskExtent {extent}: mask extent (it should be provided with the spatialRef parameter)
        OUTPUT:
            intersection {list floats} : extend of the intersection among all rasters -> list [extent.XMin, extent.YMin, extent.XMax, extent.YMax]
            insideArea {boolean}: True if ssdo FC inside of intersection
            extent {list floats} : extend list of FC [extent.XMin, extent.YMin, extent.XMax, extent.YMax]
            cellMaximum {float}: get maximum cell size from all rasters. 
            cellMinumum {float}: get minimum cell size from all rasters.
        """
        #extent = UTILS.getExtent(ssdo.extent)

        baseFC = None

        if ssdo is not None:
            baseFC = ssdo.extent.polygon
            spatialRef = ssdo.spatialRef

        if maskExtent is not None:
            if ssdo is None and spatialRef is not None:
                baseFC = maskExtent.polygon
                baseFC = baseFC.projectAs(spatialRef)

        extArr = None
        base = None
        cellMaximum = 0
        cellMinimum = 0

        #### Use Spatial Reference of First RAster ###
        if spatialRef is None:
            spatialRef = UTILS.returnOutputSpatialRef(None)

            if spatialRef is None:
                d = rasters[0]
                spatialRef = d.srf
                if printCell:
                    if not self.disableMessage:
                        ARCPY.AddIDMessage("WARNING", 110196, d.name)

            if maskExtent is not None:
                baseFC = maskExtent.polygon
                baseFC = baseFC.projectAs(spatialRef)

        cellSizeInfo = ARCPY.env.cellSize
        #### Get Cell 0-> maximum, 1-> minimum, 2-> numeric env
        getCell = 0
        if cellSizeInfo not in ['MAXOF', 'MINOF']:
            numericCellSize = True
            try:
                cellSizeInfo = UTILS.strToFloat(cellSizeInfo)
                getCell = 2  
            except:
                numericCellSize = False
                getCell = 0

            if getCell == 2:
                updateCellsizeAccordingSpatialRef(spatialRef, cellSizeInfo)

            #### Get Cell Size From Environment Raster Reference ####
            if not numericCellSize:
                try:
                    d = ASA.Raster(cellSizeInfo)
                    base = d.extent.polygon.projectAs(spatialRef)
                    cell = base.extent.width / d.width
                    cellSizeInfo = cell
                    getCell = 2
                except:
                    cellSizeInfo = 'MAXOF'
                    getCell = 0
        else:
            if cellSizeInfo != 'MAXOF':
                getCell = 1
            else:
                getCell = 0

        fcSR = spatialRef.factoryCode

        for id, raster in enumerate(rasters):
            rSRF = raster.srf.factoryCode

            if id == 0:
                rPol = self.__polygonExtent(spatialRef, raster.srf, raster.extr)

                base = rPol.projectAs(spatialRef) \
                    if fcSR != rSRF else rPol

                cellMaximum = base.extent.width / raster.width
                cellMinimum = cellMaximum
            else:
                rPol = self.__polygonExtent(spatialRef, raster.srf, raster.extr)

                pol = rPol.projectAs(spatialRef) \
                    if fcSR != rSRF else rPol
                cell = pol.extent.width / raster.width

                if cell > cellMaximum:
                    cellMaximum = cell

                if cell < cellMinimum:
                    cellMinimum  = cell
                base = base.intersect(pol, 4)

        if getCell == 0:
            cellSize = cellMaximum
        if getCell == 1:
            cellSize = cellMinimum
        if getCell == 2:
            cellSize = cellSizeInfo

        msg = ARCPY.GetIDMessage(84824)

        if printCell:
            ARCPY.AddMessage(UTILS.outputBulletList(
                [msg.format(LOCALE.format_string("%0.2f", cellSize))], force2Txt=False))

        intersection = base.extent

        if applyGetExtent:
            intersection = UTILS.getExtent(base.extent)

        insideArea = None

        if baseFC is not None:
            insideArea = not base.disjoint(baseFC)
            return intersection, insideArea, UTILS.getExtent(baseFC.extent), cellSize, spatialRef
        else:
            return intersection, None, None, cellSize, spatialRef

    def getWorkExtent(self):
        """ Obtain extent / centroids ids work area
        """
        ### ssdo obtains the srfOutput to use
        ssdo = self.ssdo
        data = None

        self.maskExtentFC = ARCPY.env.mask

        #### Ignore Mask if it does not exists ####
        if self.maskExtentFC not in ["", None]:
            if not ARCPY.Exists(self.maskExtentFC):
                ARCPY.AddIDMessage("ERROR", 10161 , self.maskExtentFC)
                raise SystemExit

        #### srfOutput from inputFC / enviroment ####
        if self.srfOutput is not None:
            #### Obtain Intersection Area / CellSize / Reference System ####
            if self.maskExtentFC is not None:
                ##### Predicting in Same Area Using Mask ####
                info = ARCPY.Describe(self.maskExtentFC)
                maskExtent = info.extent
                data = self.getRastersExtent(self.infoR, spatialRef = self.srfOutput, 
                                        applyGetExtent = False, maskExtent = maskExtent,
                                        printCell = self.printInfo)
            else:
                ##### Predicting in Same Area Without Mask ####
                data = self.getRastersExtent(self.infoR, spatialRef = self.srfOutput, 
                                        applyGetExtent = False, printCell = self.printInfo)
        else:
            if ssdo is not None:
                #### Only Training use SSDO srf (inputFC/ ####
                data = self.getRastersExtent(self.infoR, ssdo = ssdo, applyGetExtent = False, 
                                    printCell = self.printInfo)
            elif self.maskExtentFC is not None:
                #### Predicting External Area using Mask ####
                info = ARCPY.Describe(self.maskExtentFC)
                maskExtent = info.extent
                data = self.getRastersExtent(self.infoR, applyGetExtent = False, 
                                        maskExtent = maskExtent, printCell = self.printInfo)
            else:
                #### Predicting External Area Using Raster(0) SRF ####
                data = self.getRastersExtent(self.infoR, applyGetExtent = False,
                                        printCell = self.printInfo)

        intersection, insideArea, baseExt, cellSize, srf = data

        if intersection is not None and NUM.isnan(intersection.XMin):
            ARCPY.AddIDMessage("ERROR", 953)
            raise SystemExit()               

        self.intersection = UTILS.getExtent(intersection)
        data = None
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84859))

        if ssdo is not None:
        
            if ssdo.shapeType == "Polygon":
                #### Get Intersection Centroids Depending on Cell Size  ####
                #### Explode Polygons in DataObject - output Indices    ####
                #### The spatial reference is defined by inputFC in SSDO object ####
                data = getCentroids(self.intersection, cellSize, ssdo.spatialRef, None,
                                                        ssdo.inputFC, None, getIdsCentroids = True, 
                                                        justIndex = 0)
            else:
                #### Centroids Intersection ####
                #### The spatial reference is defined by inputFC in SSDO object ####
                data = getCentroids(self.intersection, cellSize, ssdo.spatialRef, None,
                                                        None, None, getIdsCentroids = True)
        else:
            #### Centroids Intersection ####
            #### This option is used in 'external prediction area' ####
            data = getCentroids(self.intersection, cellSize, srf, None, None, None, getIdsCentroids = True)

        ARCPY.ResetProgressor()
        numIds, masked, idPoly, nCols, nRows, centroids, srf = data

        #### Create Extent To Fit Raster Mask ####
        xMin = intersection.XMin
        yMax = intersection.YMax
        xMax = xMin + cellSize * nCols
        yMin = yMax - cellSize * nRows
        self.extentIntersection = ARCPY.Extent(XMin = xMin, YMin = yMin, XMax = xMax, YMax = yMax)

        self.srf = srf
        self.nRows = nRows
        self.nCols = nCols
        ### Num cells ####
        self.nCells = numIds 
        ### nRows*nCols Array Masked (true/false) ####
        self.polygonMask = masked
        self.centroids = None
        ### Id Range Centroids RangeZone [0, n-1] ####
        self.idCentroids = centroids
        ### Contain OID input Polygon FC for Each Cells ####
        self.idPoly = idPoly  
        self.cellSize = cellSize
        self.xc = cellSize
        self.yc = cellSize
        self.xMin = self.intersection[0]
        self.yMin = self.intersection[1]
        self.yMax = self.intersection[3]
        self.xMax = self.intersection[2]
        dist = UTILS.DistanceInfo(self.srf, useChordalDistances = False)
        self.unitCell = dist.name
        self.isGCS = dist.type == "GEOGRAPHIC"

    def getXs(self):
        """ Return X's coordinates
        """
        rangeZone = self.rangeZones[0]
        xMinYmax = self.getXY(rangeZone[0])
        rangeZone = self.rangeZones[len(self.rangeZones)-1]
        xMaxYmin = self.getXY(rangeZone[1])
        return xMinYmax[0] + NUM.arange(self.nCols)*self.cellSize

    def getYs(self):
        """ Return Y's coordinates
        """
        rangeZone = self.rangeZones[0]
        xMinYmax = self.getXY(rangeZone[0])
        rangeZone = self.rangeZones[len(self.rangeZones)-1]
        xMaxYmin = self.getXY(rangeZone[1])
        output = xMaxYmin[1] + NUM.arange(self.nRows)*self.cellSize
        return output[::-1]

    def infoAboutRasters(self):
        """Create Groups of raster paths with the same 
           properties origin and cell size
        """

        infoR = []
        for id, i in enumerate(self.listRasters):
            infoR.append(
                         RasterMeta(rasterPath = i,
                                    threshold = self.thresholdRaster,
                                    bandList = self.bandList[id],
                                    typeFields = self.typeField[id]))

        namePr = NUM.array([i.name for i in infoR ])

        self.gcsR = [i.srf.type.upper()=="GEOGRAPHIC" for i in infoR ]

        extX = [(i.ext[0], i.ext[3], i.xc) for i in infoR ]
        sameExt = COLL.defaultdict(NUM.int32)
        for i in extX:
            sameExt[i]+=1

        grp = {id:[] for id in sameExt}

        for i, el in  UTILS.iteritems(sameExt):
            for id, e in enumerate(infoR):
                v = (e.ext[0], e.ext[3], e.xc)
                if i[0] == v[0] and i[1] == v[1] and  i[2] == v[2]:
                    grp[i].append(id)

        self.grp = grp
        self.infoR = infoR


    def getNewStart(self, x, y, rasterId):
        inputRast = self.infoR[rasterId]
        return inputRast.ext[0], inputRast.ext[3]

    def getNumZonesSizes(self, m = 1, plot = False ):
        """
        This method use a threshold for dividing the centroid of the AOI in
        batches. The number of rasters-bands times the number of centroids in the study area
        is used to compare the threshold.
        
        The function generate an index array with centroids ids of each batch.
        """

        flag = True
        nRows = 0

        #### Decide The Correct Size to Split Intersection Area ####
        while flag:
            nRows = int(self.nRows/m)
            flag = False
            if self.nCols*nRows*self.numTotalOfBandToUse > self.MAXALLOWED:
                flag = True
                m += 2

        #ARCPY.AddMessage("Number of Zones = {0}".format(m))
        #ARCPY.AddMessage("Number of R/C = {0}/{1}".format(self.nRows,self.nCols))
        centroidsExt = NUM.zeros((m*2,2), dtype = float)
        self.rasterZoneExtentBasedCentroids = []

        rangeRows = []
        if m == 1:
            rangeRows.append([0, nRows*self.nCols -1])
            centroidsExt[0,:] = self.getXY(idIni = rangeRows[0][0])
            centroidsExt[1,:] = self.getXY(idIni = rangeRows[0][1])
            self.rasterZoneExtentBasedCentroids = [[centroidsExt[0,0], centroidsExt[1,1],
                                                    centroidsExt[1,0], centroidsExt[0,1]]]
            return  [[0, self.idCentroids[-1]]]

        for i in NUM.arange(m):
            rangeRows.append([int(float(nRows)*float(i)*float(self.nCols)),
                              int(float(nRows)*float((i+1))*float(self.nCols) -1)])
            centroidsExt[i*2,:] = self.getXY(idIni = rangeRows[i][0])
            centroidsExt[i*2+1,:] = self.getXY(idIni = rangeRows[i][1])

        n = len(rangeRows)-1
        rangeRows[n][1] = self.idCentroids[-1]
        centroidsExt[n*2 ,:] = self.getXY(idIni = rangeRows[n][0])
        centroidsExt[n*2+1 ,:] = self.getXY(idIni = rangeRows[n][1])

        for i in NUM.arange(m):
            self.rasterZoneExtentBasedCentroids.append([centroidsExt[n*2,0], centroidsExt[n*2+1,1],
                                                    centroidsExt[n*2+1,0], centroidsExt[n*2,1]])

        return  rangeRows

    def getMaskValues(self, rangeZone):
        """ Get mask ids inside of rangeZone
        """
        if self.maskDataFC is not None:
            ids = NUM.asarray(self.maskDataFC[NUM.where((self.maskDataFC >= rangeZone[0]) &
                                (self.maskDataFC <= rangeZone[1]))[0]],
                        dtype = NUM.int64)

            ids.sort()
            return ids , True
        return None, False

    def getCentroids(self, rangeZone, srfTo = None , ids = None, typeGrid = "Fishnet", isGCSForResampling = False ):
        """Generate centroids of a specific rangeZone [Start, End] index
           The centroids are generated in the projection srfTo.
           The current intersection projection is self.srf (intersection raster/mask)
           If srfTo is equal to self.srf the centroids are not projected.
           INPUT:
                rangeZone  {1D array}: start - finish indices of intersection area
                srfTo = {SpatialReference Instance} : Change centroid to this SRF
                ids {array id mask)
                typeGrid {str}: Fishnet/Hex
           OUTPUT:
                centroids { 2D array (n,2)}
        """

        useHex = False
        if typeGrid != "Fishnet":
            useHex = True

        #### Number of Columns and Rows from Intersection Area ####
        cols = self.nCols
        rows = self.nRows

        centroids = None
        sourceSRF = None
        targetSRF = srfTo

        #### Check Source Projection  and Target Projection ####
        if self.srf.factoryCode != srfTo.factoryCode:
            sourceSRF = self.srf
            targetSRF = srfTo
        else:
            targetSRF = None

        #### Define CubeInfo For generating AOI depending rangeZone and mask ####
        cubeInfo = ARC._ss.CubeInfo(rows, cols, 1, self.cellSize, use_hexagons = useHex, is_mask_required = False)

        if sourceSRF is not None:
            ### No transformation is used in the projection process ####
            if self.srf.type.upper() == "PROJECTED" and srfTo.type.upper() == "GEOGRAPHIC":
                #### Create Centroids  lon/lat using self.srf Ellipsoid  ####
                #### Similar method xy_to_lonlat(xy, srf) ####
                centroids = cubeInfo.return_centroids_from_ids(self.xMin, 
                                                                    self.yMax,
                                                                    srf = sourceSRF,
                                                                    start = NUM.int64(rangeZone[0]),
                                                                    finish = NUM.int64(rangeZone[1]),
                                                                    ids = ids,
                                                                    srfTo = None)
            elif self.srf.type.upper() in [ "GEOGRAPHIC", "PROJECTED"] \
                    and srfTo.type.upper() == "PROJECTED":
                #### Create centroids in the srfTo projection ####
                #### Similar method  change_projection_xy(xy, srf, srfTo) ####
                centroids = cubeInfo.return_centroids_from_ids(self.xMin,
                                                                    self.yMax,
                                                                    srf = sourceSRF,
                                                                    start = NUM.int64(rangeZone[0]),
                                                                    finish = NUM.int64(rangeZone[1]),
                                                                    ids = ids,
                                                                    srfTo = targetSRF)
            elif self.srf.type.upper() in [ "GEOGRAPHIC" ] \
                    and srfTo.type.upper() == "GEOGRAPHIC":
                #### Create centroids in the srfTo projection ####
                #### Similar method  change_projection_xy(xy, srf, srfTo) ####
                centroids = cubeInfo.return_centroids_from_ids(self.xMin,
                                                                    self.yMax,
                                                                    srf = sourceSRF,
                                                                    start = NUM.int64(rangeZone[0]),
                                                                    finish = NUM.int64(rangeZone[1]),
                                                                    ids = ids,
                                                                    srfTo = targetSRF)
        else:
            #### Get Centroids as simple grid ####
            centroids = cubeInfo.return_centroids_from_ids(self.xMin, 
                                                                self.yMax,
                                                                srf = None,
                                                                start = NUM.int64(rangeZone[0]),
                                                                finish = NUM.int64(rangeZone[1]),
                                                                ids = ids,
                                                                srfTo = None,
                                                                isGCS = int(isGCSForResampling))
            if centroids is None:
                ARCPY.AddIDMessage("ERROR",10092)
                raise SystemExit()

        if srfTo.type.upper() == "GEOGRAPHIC":

            eps = 1e-6

            if centroids is not None and len(centroids) > 0 and centroids.T[0].min() < -180.0:
                cx = centroids.T[0]
                msk = centroids.T[0] < -180.0
                cx[msk]+= 360.0
                centroids.T[0] = cx
            if centroids is not None and len(centroids) > 0 and centroids.T[1].max() == 90.0:
                cy = centroids.T[1]
                msk = centroids.T[1] == 90.0
                cy[msk] -= eps
                centroids.T[1] = cy

        return centroids, True if ids is not None else False

    def preProcessZones(self):
        """ Get Zones using information all rasters
        """
        self.getWorkExtent()
        self.getMaskExtentIds()
        self.rangeZones = self.getNumZonesSizes()

    def getRasterInfoZone(self, index = None):
        """This method return the information required to create a raster
            using numpytoraster """

        minX = 0
        minY = 0
        if index is not None:
            rangeZone = self.rangeZones[index]
            xMinYmax = self.getXY(rangeZone[0])
            xMaxYmin = self.getXY(rangeZone[1])
            xMinYMin = NUM.array([xMinYmax[0], xMaxYmin[1]])
            xMaxYMax = NUM.array([xMaxYmin[0], xMinYmax[1]])
            minX = xMinYMin[0] - self.cellSize/2.0
            minY = xMinYMin[1] - self.cellSize/2.0
            nCols = int(NUM.round((xMaxYMax[0] - xMinYMin[0])/self.cellSize)) + 1
            nRows = int(NUM.round((xMaxYMax[1] - xMinYMin[1])/self.cellSize)) + 1

            colRowLT = self.getColRow(xMinYMin[0], xMaxYMax[1])
            colRowRB = self.getColRow(xMaxYMax[0], xMinYMin[1])
            sliceRow = slice(colRowLT[1], colRowRB[1] + 1)
            sliceCol = slice(colRowLT[0], colRowRB[0] + 1)
            return [(sliceRow, sliceCol), None, (minX, minY), self.cellSize, nRows, nCols]

        else:
            if self.centroidsOutput is not None:
                xMinYMin = self.centroidsOutput.min(0)
                xMaxYMax = self.centroidsOutput.max(0)
                minX = xMinYMin[0] - self.cellSize/2.0
                minY = xMinYMin[1] - self.cellSize/2.0
                nCols = int(NUM.round((xMaxYMax[0] - xMinYMin[0])/self.cellSize)) + 1
                nRows = int(NUM.round((xMaxYMax[1] - xMinYMin[1])/self.cellSize)) + 1

                colRowLT = self.getColRow(xMinYMin[0], xMaxYMax[1])
                colRowRB = self.getColRow(xMaxYMax[0], xMinYMin[1])
                sliceRow = slice(colRowLT[1],colRowRB[1]+1)
                sliceCol = slice(colRowLT[0],colRowRB[0]+1)
                return [(sliceRow, sliceCol), None, (minX, minY), self.cellSize, nRows, nCols]
            else:
                ARCPY.Error("Centroids Output empty")
                raise SystemExit

        return [None, None, (minX, minY), self.cellSize, self.nRows, self.nCols]

    def getAOIData(self, index = 0):
        """  Get Information of AOI  index
             Index -> rangeZone
        """
        X, mask  = self.extractZone(self.rangeZones[index])
        return X, mask

    def extractDataFromPolygons(self, ssdo, noMaskCentroids = True):
        """ Get X variables of polygon samples for training
        """
        self.ssdo = ssdo
        self.srfOutput = None
        id = 0

        msg = ARCPY.GetIDMessage(84823)
        msg = tryMsg(msg,"...","")
        ARCPY.SetProgressor("default", msg, 0, len(self.listRasters), 1)
        self.getWorkExtent()

        size = len(self.idPoly)
        nCells = self.nCols*self.nRows -1
        dataX = NUM.ones((size, len(self.sourceListRasters)), dtype = float)*NULL
        maskedValuesSampling = NUM.ones(size, dtype = bool)
        self.centroids = None

        lastSRF = None
        updateSRF = True
        for i in self.grp:
            #### Projection Group ####
            indexRaster = self.grp[i][0]
            currentRaster = self.infoR[indexRaster]
            srfTo = self.infoR[indexRaster].srf

            #### Centroids rangeZone ####
            centroids, maskedIds = self.getCentroids([0,nCells], srfTo = srfTo, ids = self.polygonMask)

            if self.srf.factoryCode == srfTo.factoryCode:
                self.centroids = centroids
                lastSRF = srfTo
                updateSRF = False
            #else:
            #    self.centroids = centroids

            if updateSRF:
                lastSRF = srfTo

            centroids = currentRaster.coordsToExt(centroids)

            for rasterId in self.grp[i]:
                informationRaster = self.infoR[rasterId]
                informationRaster.getValuesPerZone(centroids, self.orderBands[rasterId], dataX, maskedValuesSampling, True)
        self.lastSRF = lastSRF

        if updateSRF and self.centroids is None and centroids is not None:
            if len(centroids):
                self.centroids = self.reprojectForCoords(centroids, self.srf )

        #### The centroids are not masked ####
        if noMaskCentroids:
            if self.centroids is None and self.idCentroids is not None:
                self.centroids, maskedIds = self.getCentroids(self.idCentroids, srfTo = self.srf, ids = self.polygonMask)
        else:
            if self.centroids is None:
                if centroids is not None:
                    self.centroids = centroids[maskedValuesSampling]
                else:
                    if len(maskedValuesSampling) == len(self.centroids):
                        self.centroids = self.centroids[maskedValuesSampling]
                    else:
                        self.centroids, maskedIds = self.getCentroids(self.idCentroids, srfTo = self.srf, ids = self.polygonMask)
            elif len(maskedValuesSampling) == len(self.centroids):
                self.centroids = self.centroids[maskedValuesSampling]


        #### Output Sampled Data Using  Mask Which Represent the Ids Based on rangeZone ####
        return dataX[maskedValuesSampling], NUM.where(maskedValuesSampling)[0]

    def extractDataFromPolygonsExternalReprojection(self, ssdo, noMaskCentroids = True):
        """ Get X variables of polygon samples for training
        """
        self.ssdo = ssdo
        self.srfOutput = None
        id = 0

        msg = ARCPY.GetIDMessage(84823)
        msg = tryMsg(msg,"...","")
        ARCPY.SetProgressor("default", msg, 0, len(self.listRasters), 1)
        self.getWorkExtent()

        size = len(self.idPoly)
        nCells = self.nCols*self.nRows -1
        dataX = NUM.ones((size, len(self.sourceListRasters)), dtype = float)*NULL
        maskedValuesSampling = NUM.ones(size, dtype = bool)
        self.centroids = None

        lastSRF = None
        updateSRF = True
        for i in self.grp:
            #### Projection Group ####
            indexRaster = self.grp[i][0]
            currentRaster = self.infoR[indexRaster]
            srfTo = self.infoR[indexRaster].srf

            #### Centroids rangeZone ####
            centroids, maskedIds = self.getCentroids([0,nCells], srfTo = srfTo, ids = self.polygonMask)

            if self.srf.factoryCode == srfTo.factoryCode:
                self.centroids = centroids
                lastSRF = srfTo
                updateSRF = False
            #else:
            #    self.centroids = centroids

            if updateSRF:
                lastSRF = srfTo

            centroids = currentRaster.coordsToExt(centroids)

            for rasterId in self.grp[i]:
                informationRaster = self.infoR[rasterId]
                informationRaster.getValuesPerZone(centroids, self.orderBands[rasterId], dataX, maskedValuesSampling, True)
        self.lastSRF = lastSRF

        #### The centroids are not masked ####
        if noMaskCentroids:
            if self.centroids is None and self.idCentroids is not None:
                self.centroids, maskedIds = self.getCentroids(self.idCentroids, srfTo = self.srf, ids = self.polygonMask)
        else:
            if self.centroids is None:
                if centroids is not None:
                    self.centroids = centroids[maskedValuesSampling]
                else:
                    if len(maskedValuesSampling) == len(self.centroids):
                        self.centroids = self.centroids[maskedValuesSampling]
                    else:
                        self.centroids, maskedIds = self.getCentroids(self.idCentroids, srfTo = self.srf, ids = self.polygonMask)
            elif len(maskedValuesSampling) == len(self.centroids):
                self.centroids = self.centroids[maskedValuesSampling]


        #### Output Sampled Data Using  Mask Which Represent the Ids Based on rangeZone ####
        return dataX[maskedValuesSampling], NUM.where(maskedValuesSampling)[0]


    def reprojectForCoords(self, centroids, toSRF ):
        if hasattr(self,"lastSRF"):
            if self.lastSRF.factoryCode == toSRF.factoryCode:
                return  centroids

            if self.lastSRF.type.upper() == "PROJECTED" and toSRF.type.upper() == "GEOGRAPHIC":
                xy1 = ARC._ss.change_projection_xy(centroids, self.lastSRF, toSRF.GCS )
            elif self.lastSRF.type.upper() == "PROJECTED" and toSRF.type.upper() == "PROJECTED":
                xy1 = ARC._ss.change_projection_xy(centroids, self.lastSRF, toSRF )
            elif self.lastSRF.type.upper() == "GEOGRAPHIC" and toSRF.type.upper() == "PROJECTED":
                xy1 = ARC._ss.change_projection_xy(centroids, self.lastSRF.GCS, toSRF)
            else:
                #### Assuming Same Ellipsoid Geo - Geo ###
                xy1 = centroids
            return xy1

    def extractCoords(self, indexRangeZone):
        """ Get X variables in batches (depend on raster size)
        """
        rangeZone = self.rangeZones[indexRangeZone]
        id = 0

        msg = ARCPY.GetIDMessage(84823)
        zoneStr =  "{0}/{1}".format(str(indexRangeZone + 1), len(self.rangeZones))
        msg = tryMsg(msg,"...", zoneStr)
        if self.disableMessage:
            msg = ""

        ARCPY.SetProgressor("default", msg, 0, len(self.listRasters), 1)

        #### Masked Ids in the rangeZone ####
        idsMask, maskedIdsRangeZone = self.getMaskValues(rangeZone)

        size = 0
        if not maskedIdsRangeZone:
            size = rangeZone[1] - rangeZone[0] + 1
        else:
            size = len(idsMask)

        dataX = NUM.ones((size, len(self.sourceListRasters)), dtype = float)*NULL
        maskedValuesSampling = NUM.ones(size, dtype = bool)
        self.centroidsOutput = None


        #### Projection Group ####
        indexRaster = self.grp[0][0]
        srfRaster = self.infoR[indexRaster].srf
        currentRaster = self.infoR[indexRaster]

        #### Centroids rangeZone ####
        centroids, maskedIds = self.getCentroids(rangeZone, srfTo = srfRaster, ids = idsMask)
        centroids = currentRaster.coordsToExt(centroids)
            
        return centroids, maskedIds

    def extractZone(self, indexRangeZone, justCoords = False):
        """ Get X variables in batches (depend on raster size)
        """
        rangeZone = self.rangeZones[indexRangeZone]
        id = 0

        msg = ARCPY.GetIDMessage(84823)
        zoneStr =  "{0}/{1}".format(str(indexRangeZone + 1), len(self.rangeZones))
        msg =tryMsg(msg,"...", zoneStr)

        if self.disableMessage:
            msg = ""
        
        ARCPY.SetProgressor("default", msg, 0, len(self.listRasters), 1)

        #### Masked Ids in the rangeZone ####
        idsMask, maskedIdsRangeZone = self.getMaskValues(rangeZone)

        size = 0
        if not maskedIdsRangeZone:
            size = rangeZone[1] - rangeZone[0] + 1
        else:
            size = len(idsMask)

        dataX = NUM.ones((size, len(self.sourceListRasters)), dtype = float)*NULL
        maskedValuesSampling = NUM.ones(size, dtype = bool)
        self.centroidsOutput = None

        for i in self.grp:
            #### Projection Group ####
            indexRaster = self.grp[i][0]
            srfRaster = self.infoR[indexRaster].srf
            currentRaster = self.infoR[indexRaster]

            #### Centroids rangeZone ####
            centroids, maskedIds = self.getCentroids(rangeZone, srfTo = srfRaster, ids = idsMask)

            if self.srf.factoryCode == srfRaster.factoryCode:
                self.centroidsOutput = centroids 

            centroids = currentRaster.coordsToExt(centroids)

            for rasterId in self.grp[i]:
                informationRaster = self.infoR[rasterId]

                informationRaster.getValuesPerZone(centroids, self.orderBands[rasterId], 
                                                   dataX, maskedValuesSampling, True, 
                                                   viewMessage = not self.disableMessage)

            for i in self.orderBands[rasterId]:
                maskedValuesSampling = maskedValuesSampling*(dataX.T[i] != NULL)

        if self.centroidsOutput is None:
            self.centroidsOutput, maskedIds = self.getCentroids(rangeZone, srfTo = self.srf, ids = idsMask)

        self.centroidsOutput = self.centroidsOutput[maskedValuesSampling]

        if justCoords:
            if maskedIdsRangeZone:
                #idsMask = idsMask + rangeZone[0]
                return self.centroidsOutput, idsMask[maskedValuesSampling]
            else:
                return self.centroidsOutput, NUM.where(maskedValuesSampling)[0] + rangeZone[0]

        #### Output Sampled Data Using  Mask Which Represent the Ids Based on rangeZone ####
        if maskedIdsRangeZone:
            #idsMask = idsMask + rangeZone[0]
            return dataX[maskedValuesSampling], idsMask[maskedValuesSampling]
        else:
            return dataX[maskedValuesSampling], NUM.where(maskedValuesSampling)[0] + rangeZone[0]

    def extractDataUsingPoints(self, ssdo):
        """ Get X variables of point samples for training
        """
        xy = ssdo.xyCoords
        self.srfOutput = ssdo.spatialRef
        self.ssdo = None
        self.getWorkExtent()
        id = 0
        msg = ARCPY.GetIDMessage(84823)

        #### Handle the issue in translation 6507 ####
        msg = tryMsg(msg, "...","")

        ARCPY.SetProgressor("default", msg, 0, len(self.listRasters), 1)

        size = len(xy)

        dataX = NUM.ones((size, len(self.sourceListRasters)), dtype = float)*NULL
        maskedValuesSampling = NUM.ones(size, dtype = bool)

        for i in self.grp:
            #### Projection Group ####
            indexRaster = self.grp[i][0]
            currentRaster = self.infoR[indexRaster]
            srfTo = self.infoR[indexRaster].srf

            xy1 = None
            #### Check Source Projection  and Target Projection ####
            if self.srf.factoryCode != srfTo.factoryCode:
                if self.srf.type.upper() == "PROJECTED" and srfTo.type.upper() == "GEOGRAPHIC":
                    xy1 = ARC._ss.change_projection_xy(xy, self.srf, srfTo.GCS )
                elif self.srf.type.upper() == "PROJECTED" and srfTo.type.upper() == "PROJECTED":
                    xy1 = ARC._ss.change_projection_xy(xy, self.srf, srfTo )
                elif self.srf.type.upper() == "GEOGRAPHIC" and srfTo.type.upper() == "PROJECTED":
                    xy1 = ARC._ss.change_projection_xy(xy, self.srf, srfTo)
                else:
                    #### Assuming Same Ellipsoid Geo - Geo ###
                    xy1 = xy
            else:
                xy1 = xy

            xy1 = currentRaster.coordsToExt(xy1)

            for rasterId in self.grp[i]:
                informationRaster = self.infoR[rasterId]
                informationRaster.getValuesPerZone(xy1, self.orderBands[rasterId], dataX, maskedValuesSampling, False)

            for i in self.orderBands[rasterId]:
                maskedValuesSampling = maskedValuesSampling*(dataX.T[i] != NULL)

        #### Output Sampled Data Using  Mask Which Represent the Ids Based on rangeZone ####
        return dataX[maskedValuesSampling], NUM.where(maskedValuesSampling)[0]

class RasterMeta(BaseRaster):
    """ This Class handles a basic geometry info of a raster"""
    def __init__(self, rasterPath = None, threshold = 12e6, bandList = None, typeFields = None ):
        """ Contructor of RasterMeta"""

        r = None
        #### Set Real Raster ####
        self.typeRaster = "REAL"
        self.bandName = "BAND"

        #### Recive Test Raster Instance To Simulate a Raster ####
        if str(rasterPath) == "TestRaster":
            r = rasterPath
            self.catalogPath = r.catalogPath
            self.typeRaster =  "DUMMY"
        else:
            #### USE SA Raster to Get Raster Properties ####
            r = ARCPY.sa.Raster(rasterPath)
            lstBandsNamesWithoutIndex =[]
            for name in r.bandNames:
                if "_" in name.upper():
                    numPart =  name.upper().rsplit("_",1)[1]
                    try:
                        int(numPart)
                        lstBandsNamesWithoutIndex.append(name.upper().rsplit("_",1)[0])
                    except:
                        lstBandsNamesWithoutIndex.append(name.upper())
                else:
                    lstBandsNamesWithoutIndex.append(name.upper())

            self.bandName = str(NUM.unique(lstBandsNamesWithoutIndex)[0])

            #### It is Not Support Raster Services ####
            if "HTTP:" in rasterPath.upper() or  "HTTPS:" in rasterPath.upper():
                ARCPY.AddIDMessage("ERROR", 110213)
                del r
                raise SystemExit

            #### Unknown Pixel Type is Not Supported ####
            if not UTILS.isGDB(rasterPath) and  r.pixelType in ['UNKNOWN']:
                ARCPY.AddIDMessage("ERROR", 10160, r.name)
                del r
                raise SystemExit

            if r.format == "NetCDF":
                self.catalogPath = r.name
            else:
                self.catalogPath = rasterPath

        self.thresholdRaster = threshold
        self.xc = r.meanCellWidth
        self.yc = r.meanCellHeight
        self.ext = UTILS.getExtent(r.extent)
        self.extr = r.extent
        self.width = r.width
        self.height = r.height
        self.w = self.ext[2] - self.ext[0]
        self.h = self.ext[3] - self.ext[1]
        self.nCols = int(self.w / self.xc)
        self.nRows = int(self.h / self.yc)
        self.srf = r.spatialReference
        
        if self.srf.type.upper() == "UNKNOWN":
            ARCPY.AddIDMessage("ERROR", 2132)
            del r
            raise SystemExit()
        
        useBand = True

        if r.name is None:
            useBand = False
            self.name = str(r)
        else:
            self.name = str(r.name)

        self.numBands = r.bandCount
        self.xMin = self.ext[0]
        self.yMin = self.ext[1]
        self.xMax = self.ext[2]
        self.yMax = self.ext[3]
        #### Definition Extent of Raster is Based on Azimuth ####

        self.isAzimuthBased = False
        #### Check if Raster Spatial Reference is Geographic ####
        self.isGCS = self.srf.type.upper() == "GEOGRAPHIC"
        threshold = 1.0
        if self.isGCS:
            if self.xMin > 180.0 or self.xMax > 180.0 + threshold:
                self.isAzimuthBased = True

        self.bandList = bandList
        self.typeFields = typeFields

        #### bands To Process ####
        if bandList is None:
            self.bandList = [0]

        if typeFields is None:
            self.typeFields = NUM.zeros(len(self.bandList), dtype = int)

        deletedObj = False

        #### Check Raster from NetCDF ####
        if r.format == "NetCDF":
            self.bandList[0] = 0
        else:
            if len(self.bandList) == 1:
                if self.bandList[0] != -1:

                    del r

                    deletedObj = True

                    if useBand:
                        cat = self.catalogPath + "\\{}_{}".format(self.bandName, self.bandList[0] + 1)
                        found = False
                        try:
                            rn = ARCPY.sa.Raster(cat)
                            del rn
                            found = True
                        except:
                            pass

                        if not found:
                            try:
                                cat1 = self.catalogPath + "\\{}".format(self.bandName)
                                rn = ARCPY.sa.Raster(cat1)
                                del rn
                            except:
                                ARCPY.AddIDMessage("ERROR", 730, self.catalogPath +"\\"+ self.bandName)
                                raise SystemExit()
                else:
                    self.bandList[0] = 0

        #### Divide Raster according with threshold ####
        self.zones = self.generateZones()
        self.idZonesToCheck = None

        if not deletedObj:
            del r

    def coordsToExt(self, xy):
        """ Convert Longitude to Azimuths """

        if self.isAzimuthBased:
            xyCopy = xy.copy()
            x = xy.T[0]
            longN = xy.T[0] < 0
            x[longN] = 360.0 + x[longN]
            xyCopy.T[0] = x
            return xyCopy
        else:
            return xy

    def reCalZones(self, threshold):
        """ Recalculate Zones changing the threshold
        """
        self.thresholdRaster = threshold
        self.zones = self.generateZones()

    def generateZones(self):
        """ This method generates zones according with a
        memory threshold """

        justOne = False

        if self.bandList is not None:
            justOne = len(self.bandList) == 1

        nCells = self.nCols*self.nRows
        limit = self.thresholdRaster
        total = nCells*self.numBands

        if justOne:
            total = nCells

        if total > limit:
            d = NUM.ceil(total/limit)

            if d < 2:
                d = 2

            divBy = self.nCols > self.nRows
            nG = []
            div = int(NUM.ceil(self.nRows/d))
            yMaxA = self.yMax - (NUM.arange(int(d))*div*self.yc)
            yMinA = self.yMax - (NUM.arange(int(d))*div*self.yc) - div*self.yc
            yMinA[-1] = self.yMin

            for id, i in enumerate(range(int(d))):
                grpN = None

                if i == 0:
                    cExt = [self.xMin, yMinA[id] - self.yc , self.xMax, yMaxA[id]]
                    grpN = cExt
                else:
                    my = yMinA[id] - self.yc
                    if my < self.yMin:
                        my = self.yMin
                    cExt = [self.xMin, my ,  self.xMax,  yMaxA[id]] 
                    grpN = cExt
                nG.append(grpN)

            return nG

        else:
            return [[self.xMin, self.yMin,  self.xMax,  self.yMax]]

    def extractLocValuesZones(self, extCentroids,  zones = None ):
        """ This function intersects the centroids area with raster zones
            Return zones that interset centroids extent
        """
        ext1 = extCentroids
        rz = []

        if zones is None:
            zones = self.zones

        for id, vz in enumerate(zones):
            ext2 = vz
            nZone = self.intersect(ext1, vz)

            if nZone is not None:
                rz.append(id)

        self.idZonesToCheck = rz
        return rz

    def intersect(self, ext1 , zone):
        """ Intersect two extension
        """
        ext2 = zone
        e1 = ARCPY.Extent(XMin = ext1[0], YMin = ext1[1],XMax =  ext1[2], YMax =  ext1[3]).polygon
        e2 = ARCPY.Extent(XMin = ext2[0], YMin = ext2[1],XMax =  ext2[2], YMax =  ext2[3]).polygon
        inter = e1.intersect(e2,4)

        if hasattr(inter, "area") and inter.area > 0:
            return UTILS.getExtent(inter.extent)
        else:
            None
            
    def borderRaster(self, col, row):
        if col >= 0  and col <self.nCols and row >=0 and row < self.nRows:
            return True
        else:
            return False
            
    def getIndexFromXY(self, x, y, colRowOutput = False):
        dx = x - self.xMin
        dy = self.yMax - y
        col = NUM.ceil(dx/self.xc) - 1
        row = NUM.ceil(dy/self.yc) - 1

        if self.borderRaster(col, row):

            if not colRowOutput:
                return int(col + row*self.nCols)
            else:
                return int(col), int(row)

        else:

            if not colRowOutput:
                return -1
            else:
                return -1, -1

    def defineInputDataPerBand(self, xMin, yMin, cols, rows):
        """ This Method Get Values Per Raster Band
        INPUT:
            xMin (float): xMin To extract
            yMin (float): yMin To extract
            cols (int): Number of Columns
            rows (int) Number of Rows
        OUTPUT:
            data (array 1d): Raster Data flatten
        """

        data = None

        #### Define Output Data Size ####
        data = NUM.ones((len(self.bandList),rows, cols), dtype = float)*NULL

        for id, index in enumerate(self.bandList):
            rasterPathBand = self.catalogPath + "\\{}_{}".format(self.bandName,str(int(index + 1 )))
             #### Get Raster Data Per Band Using Starting Point ####
            dataBand = ARCPY.RasterToNumPyArray(rasterPathBand, ARCPY.Point(xMin, yMin),
                                                cols, rows, nodata_to_value = NULL)
            data[id,] = dataBand

            #### Clean Objects ####
            del dataBand
            GC.collect()

        ARCPY.ResetProgressor()

        dataS = data.ravel()

        #### Clean Objects ####
        del data
        GC.collect()

        return dataS

    def createOutput(self, data_raster, centroids, cell_size_x, cell_size_y,
                     x_min, y_max, n_cols, n_rows, bands, type_field, is_grid, values):

        outputWS = ""
        if is_grid:
            nc= len(centroids)
            index = NUM.random.randint(0,200, 2)
            output = outputWS+str(y_max).replace(".","_")+".shp"
            outP = UTILS.DataContainer(self.srf, xy = centroids[index,])
            v,m = values
            v1 = v.copy()
            v1 = v1.reshape((len(m), len(bands)))
            f = []
            for i in range(len(bands)):
                t= v1.T[i]
                f.append(t[index])
            outP.generateOutput(output,f)

            ext = ARCPY.Extent(XMin = x_min, XMax = x_min +(n_cols*cell_size_x),
                               YMin = y_max - (n_rows* cell_size_y), YMax = y_max)
            output = outputWS+str(y_max).replace(".","_")+"P.shp"
            outPol = UTILS.DataContainer(self.srf, shapes = [ext.polygon])
            outPol.generateOutput(output,[[ext.JSON]])

    def interpolate(self, centroids, ext = None, isGrid = False, viewMessage = True):
        """ Extract Values in centroids from a Matrix using bilinear method 
        """

        xMin, yMin, xMax, yMax = self.xMin, self.yMin, self.xMax, self.yMax
        cols, rows = self.nCols, self.nRows
        data = None

        #### Recalculate Cols and Rows ####
        if ext is not None:
            xMin, yMin, xMax, yMax = ext
            cols = int(NUM.round((xMax - xMin)/self.xc))
            rows = int(NUM.round((yMax - yMin)/self.yc))

        msg = ARCPY.GetIDMessage(84823)
        msg = tryMsg(msg, self.name.lower()," /")

        if not viewMessage:
            msg = "Processing raster ..."
        ARCPY.SetProgressor("default", msg)

        if self.typeRaster == "DUMMY":
            return NUM.ones(len(self.bandList)*len(centroids), dtype = float),\
                   NUM.ones(len(centroids), dtype = bool)

        try:
            #### Get Data Using Starting Point All Bands ####
            data = ARCPY.RasterToNumPyArray(self.catalogPath, ARCPY.Point(xMin, yMin),
                                            cols, rows, nodata_to_value = NULL)
        except:
            pass

        #### None -> Cancel Process ####
        if data is None:
            ARCPY.AddError("{0} {1}".format(cols, rows))
            ARCPY.AddError("Problem extracting values from {0} using origin location [{1}/{2}].".format(self.catalogPath, xMin, yMin))
            raise SystemExit

        ARCPY.ResetProgressor()

        data = data.ravel()

        msg = ARCPY.GetIDMessage(84823)
        msg = tryMsg(msg,self.name.lower()," \\")

        if not viewMessage:
            msg = "Processing raster ..."

        ARCPY.SetProgressor("default", msg)
        values =  ARC._ss.sample_xy(data_raster = NUM.asarray(data, dtype = float),
                                    centroids = centroids, cell_size_x = self.xc, 
                                    cell_size_y = self.yc, x_min= xMin, y_max = yMax, n_cols = cols,
                                    n_rows = rows,
                                    bands = NUM.asarray(self.bandList, dtype = int),
                                    type_field = NUM.asarray(self.typeFields, dtype = int),
                                    is_grid = int(isGrid))

        #### None -> Cancel Process ####
        if values is None:
            raise SystemExit

        ARCPY.ResetProgressor()

        #### Clean Memory ####
        del data
        GC.collect()
        return values

    def interpolateXY(self, x, y):
        """ Interpolate a point - it uses the bands and typeFields defined in the class
        """
        value = self.getPixelBlock(x, y)
        if value is not None:
            x1, y1, x2, y2 = value
            data1 = ARCPY.RasterToNumPyArray(self.catalogPath, ARCPY.Point(x1, y1),
                                        3, 3, nodata_to_value = NULL)
            values =  ARC._ss.sample_xy(data_raster = NUM.asarray(data1.ravel(),dtype = float), 
                                centroids = NUM.array([x, y], dtype = float).reshape(1,2),
                                cell_size_x = self.xc, 
                                cell_size_y = self.yc, 
                                x_min= x1, y_max = y2, n_cols = 3,n_rows = 3, 
                                bands = NUM.asarray(self.bandList, dtype = int),
                                type_field = NUM.asarray(self.typeFields, dtype = int))

            return values, NUM.array([[x1, y1],[x1, y2], [x2, y1], [x2,y2]])
        else:
            return None

    def getData(self, x, y, block = False):
        """Get data from one location 
        """
        if not block:
            index = self.getIndexFromXY(x, y)

            if index == -1:
                return None

            x1, y1  = self.getCornerCell(index)
            data1 = ARCPY.RasterToNumPyArray(self.catalogPath, ARCPY.Point(x1, y1),
                                            1, 1, nodata_to_value = NULL)
            return data1.ravel()
        else:
            value = self.getPixelBlock(x, y)

            if value is not None:
                x1, y1, x2, y2 = value
                data1 = ARCPY.RasterToNumPyArray(self.catalogPath, ARCPY.Point(x1, y1),
                                            3, 3, nodata_to_value = NULL)
                return data1.ravel()
            else:
                return None

    def getCornerCell(self, index):
        """ Get corner BL  cell """
        col = index % self.nCols
        row = index // self.nCols
        x = self.xMin + col*self.xc
        y = self.yMax - row*self.yc - self.yc
        return x, y

    def getPixelBlock(self, x, y):
        """Get XY Coordinates from int/array of int
           This function return 3x3 coordenates of LL-TR around 
           cell of interest
        """

        val0 = NUM.round((x - self.xMin) / self.xc) 
        val1 = NUM.round((self.xMax - x) / self.xc)
        val2 = NUM.round((self.yMax - y) / self.yc)
        val3 = NUM.round((y - self.yMin) / self.yc)

        if val0 >= -1 and  val1 >= -1 and val2 >= -1 and  val3 >= -1:
            col, row = self.getColRow(x, y)

            if col >= 0 and col <= self.nCols and row >= 0 and row <= self.nRows :

                nx = self.xMin + (col-1)*self.xc
                ny = self.yMax - (row+2)*self.yc

                return  nx, ny, nx + (self.xc * 3), ny + (self.yc * 3)
            else:
                return None
        else:
            return None

    def getExtCendroids(self, centroids):
        """ Get extent of Centroids 
        """
        ep = 1e-5
        minV = centroids.min(0)
        maxV = centroids.max(0)

        if len(centroids) == 1:
            minV, maxV =  minV - ep, maxV + ep
        return minV[0], minV[1], maxV[0], maxV[1]

    def getAlignedExtFromCentroidsExt(self, x, y, x1, y1):
        """ This method gets an aligned extent from ext (x,y,x1,y1)
        """

        ex1 = ARCPY.Extent(self.xMin, self.yMin,
                           self.xMax, self.yMax).polygon

        if x == x1 and y == y1:
            return self.getPixelBlock(x,y)

        if x != x1 and y == y1:
            extBL = self.getPixelBlock(x,y)
            extTR = self.getPixelBlock(x1,y1)
            if extBL is None or extTR is None:
                return None

            return extBL[0], extBL[1], extTR[2], extTR[3]

        if x == x1 and y != y1:
            extBL = self.getPixelBlock(x,y)
            extTR = self.getPixelBlock(x1,y1)
            if extBL is None or extTR is None:
                return None

            return extBL[0], extBL[1], extTR[2], extTR[3]


        ex2 = ARCPY.Extent(x, y, x1, y1).polygon
        inter = ex1.intersect(ex2,4)

        if hasattr(inter, "area") and inter.area > 0:
            x, y, x1, y1 = UTILS.getExtent(inter.extent)
        else:
            return None

        extBL = self.getPixelBlock(x,y)

        extTR = self.getPixelBlock(x1,y1)

        if extBL is None or extTR is None:
            return None

        return extBL[0], extBL[1], extTR[2], extTR[3]

    def test_extract(self, input):
        """Extract Values From Raster 
        """
        xy = None
        ARCPY.env.outputCoordinateSystem = self.srf

        if type(input) == str:
            ssdo = SSDO.SSDataObject(input)
            ssdo.obtainData()
            xy = ssdo.xyCoords
        else:
            xy = input

        n = len(xy)
        nb = len(self.bandList)
        orderBands = NUM.arange(nb, dtype = int)

        if nb == 1:
            values = NUM.ones((n,1), dtype = float)* NULL
            maskedValues = NUM.ones(n, dtype = bool)
            self.getValuesPerZone(xy, orderBands, values, maskedValues )
            return values
        else:
            values = NUM.ones((n, nb), dtype = float)* NULL
            maskedValues = NUM.ones(n, dtype = bool)
            self.getValuesPerZone(xy, orderBands, values, maskedValues )
            return values

    def getValuesPerZone(self, xy, orderBands, values, maskedValues, isGrid = False, viewMessage = True):
        """Get values from raster - it fills the values array, and uses the maskedValues
           to check the mask"""

        #### Check xy Size ####
        if xy is None or len(xy) == 0:
            return

        #### Calculation Extent XY Coordinates ####
        extCent = self.getExtCendroids(xy)
    
        #### Finding Real Zones That Intersect with XY Coordinates ####
        self.extractLocValuesZones(extCent)
        x = xy.T[0]
        y = xy.T[1]
    
        #print("Sampling {0} Zones:".format(len(self.idZonesToCheck)), end="\r", flush=True)
        #### Use Zones Define
        for id in self.idZonesToCheck:
            zone = self.zones[id]
            xMin, yMin, xMax, yMax = zone

            #### Obtain The Ids of XY Coordinates that Intersects with the zone ####
            ind = (y <= yMax)*(y >= yMin)*maskedValues

            #### Mask X info ####
            if self.srf.type.upper() == "GEOGRAPHIC":
                if not (xMin < -180 or xMax > 180):
                    ind = (x <= xMax)*(x >= xMin)*ind
            else:
                ind = (x <= xMax)*(x >= xMin)*ind

            cenBase = xy[ind,:]

            if len(cenBase) > 0:
                newExtCen = self.getExtCendroids(cenBase)

                #### Get Extent That Aligned With Raster ####
                ext = self.getAlignedExtFromCentroidsExt(*newExtCen)
                indRows = NUM.where(ind)[0]

                if ext is not None:
                    #### Interpolate XY Coordinates Using Type Fields (Near/Bil) ####
                    valuesP, maskP  =  self.interpolate(cenBase, ext = ext, isGrid = isGrid, viewMessage = viewMessage)

                    #### Obtain Ids With Interpolated Values ####
                    goodData = NUM.asarray(maskP, dtype = bool)
                    badData = NUM.logical_not(maskP)

                    gIdRows = indRows[goodData]
                    bIdRows = indRows[badData]
                    #### Update Mask ####
                    maskedValues[bIdRows] = False

                    if len(values) == 1:
                        try:
                            values[gIdRows] = valuesP[goodData]
                        except:
                            ARCPY.AddError("Problem updating data from the raster {0}.".format(self.name))
                            raise SystemExit

                    else:
                        valuesP = valuesP.reshape((len(maskP), len(orderBands)))
                        valuesP = valuesP[goodData,]

                        if len(valuesP):
                            done = ARC._ss.update2DArray(values, valuesP, NUM.asarray(gIdRows, dtype = NUM.int32),
                                                         NUM.asarray(orderBands, dtype = NUM.int32) )

                            #### If Function is Cancelled ####
                            if done is None:
                                ARCPY.AddError("Problem updating data from the raster {0}.".format(self.name))
                                raise SystemExit

                    #### Clean Memory ####
                    del goodData, badData, valuesP, maskP, cenBase, indRows
                    GC.collect()

                else:
                    pass

class ResampleRaster(RasterInfo):
    def __init__(self, rasterInfo, ssdo, dist):
        self.r = rasterInfo
        self.distOriginal= dist
        self.srf = self.r.srf
        self.__deg(ssdo.getDistance(dist))

    def __deg(self,distance):
        const = 8.983152098239751e-06
        self.isGCS = False
        ### Fishnet grid dist approximation ####
        if self.r.srf.type.upper() == "GEOGRAPHIC":
            self.dist = distance*const
            self.isGCS = True
        else:
            self.dist = distance

    def __defineNumCols(self):
        ext = self.r.extentIntersection
        w = ext.width
        if self.isGCS:
            if ext.YMin < 0 and ext.YMax > 0:
                nCols = int(NUM.ceil(w /self.cellSize))
            elif  ext.YMin >=0 and ext.YMax > 0:
                infArc = NUM.cos(ext.YMin*NUM.pi/180)
                nCols = int(NUM.ceil(w*infArc/self.cellSize))
            elif  ext.YMin < 0 and ext.YMax <= 0:
                supArc = NUM.cos(ext.YMax*NUM.pi/180)
                nCols = int(NUM.ceil(w*supArc/self.cellSize))
            else:
                nCols = int(NUM.ceil(w /self.cellSize))
        else:
            nCols = int(NUM.ceil(w /self.cellSize))
        return nCols

    def maskCells(self, baseCoord, shiftPer=0.0):

        if self.dist < self.r.cellSize:
            return None

        numCells =  int(NUM.ceil(self.dist / self.r.cellSize))
        self.cellSize = numCells*self.r.cellSize

        #### Define the number of columns ####
        self.nCols = self.__defineNumCols()
        self.nRows = int(NUM.ceil(self.r.extentIntersection.height/self.cellSize))
        self.yMax  = self.r.yMax - shiftPer*self.cellSize
        self.xMin  = self.r.xMin + shiftPer*self.cellSize

        #### Create a new grid ####
        info, d = self.getCentroids([0, self.nCols*self.nRows -1], self.r.srf, typeGrid= "Fishnet", isGCSForResampling = self.isGCS)

        #### remove extra locations ####
        rExtra = info.T[0] < self.r.extentIntersection.XMax
        info = info[rExtra] 

        #### Use base Raster Info to detect location indices ####
        indBase = self.r.getIndices(baseCoord)
        hexBase = self.r.getIndices(info)

        #### Obtain masked indices that represent the resample cells ####
        maskIndices = NUM.in1d(indBase, hexBase)

        return maskIndices

def rasterWorkFlow(hpar, nRasters, explodeData, ssdoCheck, nVar, rfRun, globalExtent, randSeed):
    """This function is used for input Raster dataset  only (X' variables).
       Prediction Raster or Training.
    """
    if hpar.explodeDataRaster and explodeData :

        ssdoTraining = ssdoCheck
        fields = [hpar.variableToPredict.upper()]
        userTypeRF ="Categorical" if hpar.classes in [ True, "True", "true"] else "Numeric"
        ssdoTraining.obtainData(fields = fields, requireGeometry = False)
        uniqueV = NUM.unique(ssdoTraining.fields[hpar.variableToPredict.upper()].data)

        if len(uniqueV) == 1:
            alias = hpar.variableToPredict.upper();
            ARCPY.AddIDMessage("ERROR", 110181, alias)
            raise SystemExit

        #### ConverT GP object To String ####
        pathR = [i[0]["sourceData"] for i in hpar.listVariables if i[0]["source"]== "RASTER"]
        nameR = [i[0]["alias"] for i in hpar.listVariables if i[0]["source"]== "RASTER"]
        typeRF = [i[0]["rfType"] == numericVar for i in hpar.listVariables if i[0]["source"]== "RASTER"]
        typeRFD = [i[0]["rfType"] for i in hpar.listVariables if i[0]["source"] == "RASTER"]

        infoRaster = RasterInfo(pathR, typeRF, rasterNames = nameR, printInfo = False, maxSize = MEMSIZE)
        rfTraining = InfoForestField(splitPercentage = hpar.split, seed = randSeed)
        rfTraining.loadDataRasterForTraining(infoRaster, ssdoTraining, hpar.variableToPredict, userTypeRF,
                                             checkBalance = not hpar.balanceTree)

        if hpar.what == "NONE":
            rfTraining.splitDataForTesting(hpar.balanceTree)
            rfRun.executeModel(rfTraining, newSRF = infoRaster.srf,
                               ssdoPoints2Train = rfTraining.dataObject)
            ARCPY.env.extent = globalExtent
            return True

        if hpar.what == "RASTER":
            if hpar.outArea:
                pathROut = [i[1]["sourceData"] for i in hpar.listVariables if i[1]["source"]== "RASTER"]
                nameROut = [i[1]["alias"] for i in hpar.listVariables if i[1]["source"]== "RASTER"]
                typeRFOut = [i[1]["rfType"] == numericVar for i in hpar.listVariables if i[1]["source"]== "RASTER"]
                typeRFD = [i[1]["rfType"] for i in hpar.listVariables if i[1]["source"] == "RASTER"]

                infoRasterOut = RasterInfo(pathROut, typeRFD, printInfo = True, rasterNames = nameROut, maxSize = MEMSIZE)
                rfTest = InfoForestField(isTraining = False)
                infoRasterOut.srfOutput = None

                rfRun.executeModel(rfTraining, rfTest = rfTest,
                    rasterInfo  = None,
                    ssdoPoints2Train = rfTraining.dataObject,
                    infoRasterInstances = infoRasterOut)
                return True
            else:
                infoRasterIn = RasterInfo(pathR, typeRF, printInfo = True, rasterNames = nameR, maxSize = MEMSIZE)
                #### Set SRF  ####
                infoRasterIn.srfOutput = ssdoTraining.spatialRef
                rfTest = InfoForestField(isTraining = False)

                #### Execute Forest ####
                rfRun.executeModel(rfTraining, rfTest = rfTest,
                    rasterInfo  = None,
                    ssdoPoints2Train = rfTraining.dataObject,
                    newSRF = ssdoTraining.spatialRef,
                    infoRasterInstances = infoRasterIn)
                return True

    if nRasters > 0 and nVar == 0 and hpar.what in ["NONE", "RASTER"]:

        ### Get Data From Input FC ####
        ssdoTraining = ssdoCheck
        checkLicense()
        ssdoTest = None
        rfTest = None
        fields = [hpar.variableToPredict.upper()]
        userTypeRF ="Categorical" if hpar.classes in [ "CATEGORICAL", True, "True", "true"] else "Numeric"
        ssdoTraining.obtainData(fields = fields, requireGeometry = False)

        #### Define Training Field ####
        rfTraining = InfoForestField(splitPercentage = hpar.split, seed = randSeed, ssdo = ssdoTraining)
        rfTraining.defineYFromDataObject(hpar.variableToPredict.upper(), userTypeRF, 
                                         ignoreValue = True, checkBalance = not hpar.balanceTree)

        #### Extract Data To Train ####
        maskTotal = AddDataN(rfTraining, hpar, typeSampling = "NP")

        #### Apply mask in each RF Field ####
        applyMaskFromRaster(rfTraining, allIndices =  maskTotal)
        rfTraining.generateXVariable(balance = hpar.balanceTree)
        srf = ssdoTraining.spatialRef
        applyZone = 0

        if hpar.outArea:
            applyZone = 1

        if hpar.what == "RASTER":
            #### ConverT GP object To String ####
            pathR = [i[applyZone]["sourceData"] for i in hpar.listVariables if i [applyZone]["source"] == "RASTER"]
            nameR = [i[applyZone]["alias"] for i in hpar.listVariables if i [applyZone]["source"] == "RASTER"]
            typeRF = [i[applyZone]["rfType"] == numericVar for i in hpar.listVariables if i[applyZone]["source"]== "RASTER"]
            typeRFD = [i[applyZone]["rfType"] for i in hpar.listVariables if i[applyZone]["source"] == "RASTER"]
            data = None
            intersection = NoUse = cellSize =  srfOut = None
            infoRaster = RasterInfo(pathR, typeRF, rasterNames = nameR, maxSize = MEMSIZE)

            #### Verify If The prediction is in external Area ####
            if applyZone:
                infoRaster.srfOutput = None
                srf = infoRaster.infoR[0].srf
            else:
                infoRaster.srfOutput = srf

            rfTest = InfoForestField(isTraining = False)

            #### Execute Forest ####
            rfRun.executeModel(rfTraining, rfTest = rfTest, rasterInfo = None,
                               newSRF = srf, infoRasterInstances = infoRaster)
            return True

        #### Just Training Using only Raster Datasets / Points -Polygons Without Explode ####
        if hpar.what == "NONE":
            #### Execute Forest ####
            rfRun.executeModel(rfTraining)
            return True

    return False


def execute(parameters):
    """
    Prepare information for executing forest 
    """
    # modelOutput = r"c:\temp\test.md"
    # modelPar = Parameter("outputModel", "Output Model", modelOutput)
    # parameters = [p for p in parameters1]
    # parameters.append(modelPar)
    
    #### Clean Global Extent ####
    globalExtent = ARCPY.env.extent
    ARCPY.env.extent = ""

    #### Get Seed ####
    randSeed = UTILS.getRandomSeed()

    #### Generate Seed if It is not Provided ####
    if randSeed == 0:
        randSeed = int(NUM.random.randint(1000000))

    msg = ARCPY.GetIDMessage(84821)
    ARCPY.AddMessage(msg.format(randSeed))

    hpar = HandleInputs(parameters)
    hpar.loadBasic(parameters)
    parameters = hpar.parameters

    #### Generate Iteration Seeds ####
    if hpar.iterations > 1 :
        NUM.random.seed(randSeed)
        hpar.iterationSeeds = NUM.random.randint(0,1000000, hpar.iterations)

    #### Check Output Feature Class ####
    if hpar.outputFeatures is None:
        hpar.outputFeatures=""

    ssdoTraining = None
    ssdoTesting = None
    rfTraining = None

    par = parameters
    model = hpar.isModel

    hpar.getInfoValues()

    #### This object decides how execute RF ####
    rfRun = RunRF(hpar, randSeed, parameters)

    ### Detect if Inputs in Matching Dist/Rasters are different ####
    outArea = hpar.outArea
    useTestData = hpar.haveToPredict

    totalVariables = len(hpar.listVariables)
    userTypeRF = "Categorical" if hpar.classes in [ "CATEGORICAL", True, "True", "true"] else "Numeric"

    if totalVariables > 0:
        tryIsNone =  hpar.fields_to_try is None

        if tryIsNone or hpar.fields_to_try > totalVariables:
            n = 1
            if userTypeRF == "Categorical":
                ### Set Number of Fields for Permutation in classification ###
                n = int(NUM.sqrt(totalVariables))
            else:
                ### Set Number of Fields for Permutation in Regression ###
                n = int(totalVariables/3)

            #### fields_to_try Should be greater than zero ####
            hpar.fields_to_try = n

            if n == 0:
                hpar.fields_to_try = 1

            if not tryIsNone:
                ARCPY.AddIDMessage("WARNING", 110177, str(hpar.fields_to_try))

    UTILS.checkOutputPath(hpar.outputRaster, "RASTER")
    UTILS.checkOutputPath(hpar.outputFeatures, "FC")
    UTILS.checkOutputPath(hpar.outputTrainedFeatures, "FC")
    UTILS.checkOutputPath(hpar.outputCrossValidation, "TABLE")
    UTILS.checkOutputPath(hpar.outputDiagnostic, "TABLE")
    UTILS.checkOutputPath(hpar.outputConfusion, "TABLE")
    UTILS.checkOutputPath(hpar.optimizeOutputTableStr, "TABLE")

    #### Check Unique Outputs ####
    outputList = [hpar.outputRaster, hpar.outputFeatures, hpar.outputTrainedFeatures, 
                  hpar.outputCrossValidation, hpar.outputDiagnostic, hpar.outputConfusion]
    unique = UTILS.hasUniqueOutputs(outputList, throwError = True)

    ssdoCheck = None

    #### Handle All Explode Data Cases ####

    shapeInfo = None
    try:
        desc = ARCPY.Describe(hpar.input)
        shapeInfo = desc.shapeType
    except:
        pass

    #### Check Selection Variable ####
    explodeData = shapeInfo == "Polygon" and userTypeRF == "Categorical" and hpar.what in ["NONE", "RASTER"]
    varsF = hpar.getVarsBySourceOrigin("FC")
    varsD = hpar.getVarsBySourceOrigin("DIST")
    varsR = hpar.getVarsBySourceOrigin("RASTER", info = "sourceData")

    if len(varsD):
        if not checkAdvancedLic():
            namePar = [hpar.parameters[id].displayName for id, i in enumerate(hpar.parameters) \
                      if hpar.parameters[id].name == "distance_features"][0]
            ARCPY.AddIDMessage("ERROR",844, namePar )
            raise SystemExit()

    nVar = len(varsF) + len(varsD)
    nRasters = len(varsR)

    ssdoCheck = SSDO.SSDataObject(hpar.input)
    infoRasterArg = (hpar, nRasters, explodeData, ssdoCheck, nVar, rfRun, globalExtent, randSeed)

    created = rasterWorkFlow(*infoRasterArg)

    if created in [True, None]:
        if rfRun.listRasterW is not None:
            return rfRun.listRasterW
        return

    if not hpar.useAllRasterValues:

        ssdoTraining = ssdoCheck
        useTestData = hpar.what == "FEATURES"
        ssdoTest = None
        rfTest = None
        fields = [hpar.variableToPredict.upper()]
        userTypeRF ="Categorical" if hpar.classes in [ "CATEGORICAL", True, "True", "true"] else "Numeric"

        #### Fields In Exploratory Variables ####
        varsF = hpar.getVarsBySourceOrigin("FC")
        for f in varsF:
            fields.append(f)

        ssdoTraining.obtainData(fields = fields, requireGeometry = False, minNumObs = minNumObs)

        rfTraining = InfoForestField(splitPercentage = hpar.split, seed = randSeed, ssdo = ssdoTraining)

        rfTraining.defineYFromDataObject(hpar.variableToPredict.upper(), userTypeRF, ignoreValue = True,
                                          checkBalance = not hpar.balanceTree)
        maskTotal = AddDataN(rfTraining, hpar)

        #### Apply mask in each RF Field ####
        applyMaskFromRaster(rfTraining, allIndices =  maskTotal)

        rfTraining.generateXVariable(balance = hpar.balanceTree)

        #### Using New Fatures ####
        if useTestData and  hpar.what == "FEATURES":

            ssdoTest = SSDO.SSDataObject(hpar.featuresToPredict)
            fieldTest = []
            varsF = hpar.getVarsBySourceOrigin("FC", False)
            for f in varsF:
                fieldTest.append(f.upper())

            #### Obtain Geometry Data ####
            ssdoTest.obtainData(fields = fieldTest, requireGeometry = False)
            rfTest = InfoForestField(ssdo = ssdoTest, isTraining = False)
            rfTest.distanceUnit = rfTraining.distanceUnit
            maskTotalTest = AddTestFieldN(rfTest, hpar)

            #### Apply mask in each RF Field ####
            applyMaskFromRaster(rfTest, allIndices =  maskTotalTest)

        if hpar.what == "NONE":

            rfRun.executeModel(rfTraining, rfTest = rfTest)
            ARCPY.env.extent = globalExtent
            return

        if hpar.what == "FEATURES":
            dictOrder = hpar.getDictOrder()
            information  = compareForestInfo(rfTraining, rfTest, dictOrder, balance = hpar.balanceTree)

            if information is not None:
                raise SystemExit()

            rfRun.executeModel(rfTraining, rfTest = rfTest)
            ARCPY.env.extent = globalExtent
            return
    return

class RunByModel(RunRF):
    def __init__(self, handleParametersByModel, modelType, modelFileVariables):
        super().__init__(handleParametersByModel, 0, handleParametersByModel.parameters)
        self.modelFileVariables = modelFileVariables
        self.isXGB = modelType == "Gradient_Boosted"
        self.modelType = modelType
        self.rfTest = None
        self.modelData = self.modelFileVariables.otherAttr

    def printReport(self):
        pass

    def predict(self):
        if self.modelType in ["Forest", "Gradient_Boosted"]:
            values = ARC._ss.forest_model(self.rfTest.x, self.hpar.modelInput)
            return values

class HandleParametersByModel(HandleInputs):
    def __init__(self, modelVariables, parameters):
        super().__init__(parameters)
        self.modelObject = modelVariables
        self.isXGB = self.modelObject.modelType == "Gradient_Boosted"
        if parameters[3].value is not None or parameters[4].value is not  None:
            if self.loadPredict(parameters):
                self.configure(modelVariables)

    def loadPredict(self, parameters):
        #### Initialize Vars ####
        self.parameters = parameters
        self.par = {p.name:p.valueAsText for id, p in enumerate(parameters)}
        self.descF2P = None
        self.rfM = None
        self.modelInput = UTILS.getTextParameterMatch(0, parameters)
        self.what = UTILS.getTextParameter(1, parameters)
        self.featuresToPredict = UTILS.getTextParameter(2, parameters)
        self.outputFeatures = UTILS.getTextParameter(3, parameters)
        self.outputRaster = UTILS.getTextParameter(4, parameters)
        self.matchVariables = UTILS.getTextParameterMatch(5, parameters)
        self.matchDistances = UTILS.getTextParameterMatch(6, parameters, ["MappingLayerObject","mp.Layer"])
        self.matchRaster  =  UTILS.getTextParameterMatch(7, parameters, ["mp.Layer"])
        self.addProbabilities = False
        self.enabledRasterProbability = ENABLED_RASTER_PROBABILITY

        #### New Field Type Checker in SSM ####
        fields = []
        if self.matchVariables is not None:
            fields += [i[0].upper() for i in self.matchVariables]
        if self.featuresToPredict is not None and self.outputFeatures is not None:
            checker = UTILS.ExecuteNewFieldTypeChecker(self.featuresToPredict, self.outputFeatures,
                                                       fields = fields)

        self.modelType = self.modelObject.modelType
        if self.modelObject.otherAttr is not None and "addProbabilities" in self.modelObject.otherAttr:
            self.addProbabilities = True

        self.isXGB = self.modelType == "Gradient_Boosted"
        self.outArea = True
        self.haveToPredict = True
        self.classes = False
        self.isModel= True
        self.discrete = discrete
        self.continuous = continuous
        self.explodeDataRaster = False
        self.uncertainty = False
        self.predictFunction = None
        self.shapeInfo = None
        if self.featuresToPredict is not None:
            try:
                self.descF2P= ARCPY.Describe(self.featuresToPredict)
                self.shapeInfo = self.descF2P.shapeType
            except:
                ARCPY.AddError("Fail to describe the feature to predict")
                return False
        #### Check Output paths ####
        UTILS.checkOutputPath(self.outputRaster, "RASTER")
        UTILS.checkOutputPath(self.outputFeatures, "FC")
        return True

    def configure(self, rfM):
        self.classes =  self.isClassification = rfM.isClassification()

        dictI = {5:"FC", 6:"DIST", 7:"RASTER"}
        
        def search(rfM, name):
            for n in rfM.fields:
                if n.name == name:
                    return n
        def orderFields(rfM, name):
            for n in rfM.fields:
                if n.name == name:
                    return n

        for id in dictI:
            if self.parameters[id] is not None:
                vt = self.parameters[id]
                if vt.value is not None:
                    for v in vt.values:
                        v0 = None
                        if hasattr(v[0], "value"):
                            v0 = v[0].value
                        if hasattr(v[0], "name"):
                            v0 = v[0].name
                        if type(v[0]) == str:
                            v0 = v[0]
                        field = search(rfM, v[1])
                        if field is not None:
                            field.source = dictI[id]
                        else:
                            ARCPY.AddError("No found")

        self.rfM = rfM

    def processInputParameters(self):
        """
        get Info: 
             FieldsToMatch, DistancesToMatch, RastersToMatch, 
             eVariables, eDistances, eRasters
             FieldsToMatchVerify
        """

        #### Get Input Feature To Predict Path ####
        pathCompleteInputF2P = None
        if self.descF2P is not None:
            nameInputF2P = self.descF2P.name
            pathInputF2P = self.descF2P.path
            pathCompleteInputF2P = OS.path.normpath(pathInputF2P + "\\"+ nameInputF2P)

        listVariables, dictVariables = self.rfM.getVariables()


        if self.matchVariables is not None :

            mfV = None
            if type(self.matchVariables) == str:
                mfV = [field.split(" ") for field in self.matchVariables.split(";")]
            else:
                mfV = [[field[0], field[1]] for field in self.matchVariables]

            fieldTestXFieldModel = {v[0].upper():v[1] for v in mfV}
            #fieldModelXfieldTest = {v[1].upper():v[0].upper() for v in mfV }
            for idF in self.descF2P.fields:

                nameToUse = None
                if idF.name.upper() in fieldTestXFieldModel:
                    nameToUse = idF.name.upper()
                elif idF.aliasName.upper() in fieldTestXFieldModel:
                    nameToUse = idF.aliasName.upper()
                   
                if nameToUse is not None:

                    idVar = self.getIndexVarByName(listVariables, fieldTestXFieldModel[nameToUse])

                    if idVar is not None:
                        varToMatch = listVariables[idVar][0]
                        varToMatch["source"] = "FC"

                        if idF.type.upper() == varToMatch["fieldType"].upper():
                            rowVar =    {"name":idF.name.upper(), "alias":idF.aliasName, "rfType":varToMatch["rfType"],
                                         "fieldType":idF.type, "source":"FC",
                                         "sourceData": self.descF2P.path + "\\"+ self.descF2P.name}
                            listVariables[idVar][1] = rowVar
                        else:
                            ARCPY.AddIDMessage("ERROR", 110176, listVariables[idVar][0]["name"], idF.name )
                            raise SystemExit
                    else:
                        ARCPY.AddIDMessage("ERROR", 110185, fieldTestXFieldModel[nameToUse] )
                        raise SystemExit

        if self.matchDistances is not None:
            cantBeUsed = False
            try:
                mdV = None

                if type(self.matchDistances) == str:
                    mdV = [self.splitFieldName(field, 0) for field in self.matchDistances.split(";")]
                else:
                    mdV = [self.splitFieldName(field, 0) for field in self.matchDistances]

                tmdV= {}
                cPmdV= {}

                for row in mdV:
                    nameDistToMatch = None

                    if self.rfM is None:
                        nameDistToMatch = ARCPY.Describe(row[0]).name.upper()
                    else:
                        nameDistToMatch = row[0].upper()

                    desc = ARCPY.Describe(row[2])
                    name = desc.name
                    path = desc.path
                    pathComplete = OS.path.normpath(path + "\\"+ name)

                    if pathCompleteInputF2P is not None:
                        if OS.path.realpath(pathCompleteInputF2P) == OS.path.realpath(pathComplete):
                            cantBeUsed = True

                    if desc.dataType == "FeatureLayer":
                        pathComplete = desc.nameString
                        if "\\" in pathComplete:
                            name = pathComplete.split("\\")[1]

                    rowVar = {"name":name.upper(), "alias":name.upper(), "rfType":numericVar,
                              "fieldType":"Double", "source":"DIST",
                              "sourceData": pathComplete}

                    idVar = self.getIndexVarByName(listVariables, nameDistToMatch)

                    if idVar is not None:
                        varToMatch = listVariables[idVar][0]
                        varToMatch["source"] = "DIST"
                        listVariables[idVar][1] = rowVar
                    else:
                        ARCPY.GetIDMessage("ERROR", 110176, nameDistToMatch , name )
                        raise SystemExit()
            except:
                ARCPY.AddIDMessage("ERROR", 110186)
                raise SystemExit

            if cantBeUsed:
                ARCPY.AddIDMessage("ERROR", 110261)
                raise SystemExit

        if self.matchRaster is not None :
            noSupport = False
            #try:
            mrV = None

            if type(self.matchRaster) == str:
                mrV = [self.splitFieldName(field, 0) for field in self.matchRaster.split(";")]
            else:
                mrV = [self.splitFieldName(field, 0) for field in self.matchRaster]

            mrVn = []
            for id, el in enumerate(mrV):
                mrVn.append([mrV[id][0],None,mrV[id][2]])
            mrV = mrVn

            for row in mrV:
                nameRasterToMatch = row[0].upper()

                if hasattr(row[2],"name"):
                    desc = ARCPY.Describe(row[2].name)
                else:
                    desc = ARCPY.Describe(row[2])

                if hasattr(desc, "format") and desc.format  in noSupportSAFormats:
                    noSupport = True

                name1 = desc.name
                path = desc.path
                name = getNameRaster(name1.upper())
                pathAll =  OS.path.normpath(path +"\\"+ desc.name)

                if  hasattr(desc, "format") and desc.format== "NetCDF":
                    pathAll = desc.name
                    del desc

                idVar = self.getIndexVarByName(listVariables, nameRasterToMatch)
                varToMatch = listVariables[idVar][0]
                varToMatch["source"] = "RASTER"  

                if varToMatch["fieldType"].upper() not in  ["INTEGER", "SHORTINTEGER", "FLOAT", "LONG", "DOUBLE"]:
                    ARCPY.AddError(fr" The Model variable {varToMatch['name']} type {varToMatch['fieldType']} is not support as raster variable" )
                    raise SystemExit()

                rowVar =    {"name":name, "alias":name1, "rfType":varToMatch["rfType"],
                                "fieldType":"DOUBLE", "source":"RASTER",
                                "sourceData": pathAll }

                if idVar is not None:
                    listVariables[idVar][1] = rowVar
                else:
                    ARCPY.GetIDMessage("ERROR", 110176, nameDistToMatch, name )
                    raise SystemExit()

            #except:
            #    ARCPY.AddIDMessage("ERROR", 110187)
            #    raise SystemExit

            if noSupport:
                ARCPY.AddIDMessage("ERROR", 110213)
                raise SystemExit

        verifyOnltTraining = 1

        if len(listVariables) == 0:
            ARCPY.AddIDMessage("ERROR", 110173)
            raise SystemExit()

        if self.what != "NONE":
            verifyOnltTraining = 2
            for i in listVariables:
                if len(i[1]) == 0:
                    ARCPY.AddIDMessage("ERROR", 110203)
                    raise SystemExit()

        #### Repeat Names in Training and Testing ####
        for iv in range(verifyOnltTraining):
            names = NUM.array([i[iv]["name"] for i in listVariables])
            uniqueNames, count = NUM.unique(names, return_counts = True)

            if len(count) and NUM.max(count) > 1:
                name = uniqueNames[NUM.where(count>1)[0][0]]
                ARCPY.AddIDMessage("ERROR", 110182, name )
                raise SystemExit()

            #### Check String Field ####
            nl = [id for id, i in enumerate(listVariables) if i[iv]["fieldType"] == "String" and i[iv]["rfType"] != categoricalVar]
            if len(nl):
                ARCPY.AddIDMessage("ERROR", 110200,self.getNamesList(listVariables, nl) )
                raise SystemExit()

        self.outArea = True

        if verifyOnltTraining == 2:

            typesCheck = {"DOUBLE": 0,
                    "LONG": 0,
                    "TEXT": 1,
                    "DATE": 2,
                    "SINGLE": 0,
                    "SHORT": 0,
                    "STRING": 1,
                    "SMALLINTEGER": 0,
                    "INTEGER": 0,
                    "BIGINTEGER": 0}

            nl = [id for id, i in enumerate(listVariables) if typesCheck[i[0]["fieldType"].upper()] != typesCheck[i[1]["fieldType"].upper()]]
            if len(nl):
                ARCPY.AddIDMessage("ERROR", 110206, self.getNamesList(listVariables, nl))
                raise SystemExit()

        self.listVariables = listVariables

    def getRasterInformation(self, applyZone = 1):
        pathR = [i[applyZone]["sourceData"] for i in self.listVariables if i [applyZone]["source"] == "RASTER"]
        nameR = [i[applyZone]["alias"] for i in self.listVariables if i [applyZone]["source"] == "RASTER"]
        typeRF = [i[applyZone]["rfType"] == numericVar for i in self.listVariables if i[applyZone]["source"]== "RASTER"]
        typeRFD = [i[applyZone]["rfType"] for i in self.listVariables if i[applyZone]["source"] == "RASTER"]    
        return pathR, nameR, typeRF, typeRFD

    def getVariableListByType(self, distMatchingParameterName = "explanatory_distance_matching" ):
        varsF = self.getVarsBySourceOrigin("FC",  training = False)
        varsD = self.getVarsBySourceOrigin("DIST", training = False)

        if len(varsD):
            if not checkAdvancedLic():
                namePar = [self.parameters[id].displayName for id, i in enumerate(self.parameters) if self.parameters[id].name == distMatchingParameterName ][0]
                ARCPY.AddIDMessage("ERROR", 844, namePar )
                raise SystemExit()

        varsR = self.getVarsBySourceOrigin("RASTER", training = False, info = "sourceData")
        return varsF, varsD, varsR

#### Predict by Model ####
def predictFromModel(rfTrained, parameters, modelType = "Forest", justDescribe = False):
    """
    INPUTS:
    rfTrained: Model Object (InfoForestField): Contain the trained model
               e.g. appVersion, history, fields, otherAttr, isClassification, isXGB, modelType, modelData
    parameters: List of Parameters
    modelType: String: Type of Model
    justDescribe: Boolean: If True, the function only describe the model
    """

    #### Clean Global Extent ####
    globalExtent = ARCPY.env.extent
    ARCPY.env.extent = ""
    randSeed = 0
    ssdoTesting = None
    outArea = True

    #### Handle parameters of the Predict by Model Tool ####
    hpar = HandleParametersByModel(rfTrained, parameters)
    if parameters[3].value is not None or parameters[4].value is not  None:
        hpar.processInputParameters()
        hpar.outArea = outArea

    #### Create a Model Object for Predicting and Generating Output ####
    runModel = RunByModel(hpar, modelType, modelFileVariables = rfTrained)

    ### Add Diagnostic info ###
    reportParam = runModel.displayParameters()
    reportParam = runModel.displayImportance(rfTrained, runModel.modelData["importance"], reportParam )

    if rfTrained.yField.rfType == "Categorical":
        reportClas = statisticsForClassificationByModel(rfTrained, runModel.modelData["statTraining"], False, hpar = hpar)
        reportParam += reportClas +"\n"
        if "statTest" in runModel.modelData:
            reportClas = statisticsForClassificationByModel(rfTrained, runModel.modelData["statTest"], True, hpar = hpar)
            reportParam += reportClas+ "\n"
    else:
        reportReg = statisticsForRegressionByModel(runModel.modelData["statTraining"], False)
        reportParam += reportReg +"\n"
        if "statTest" in runModel.modelData:
            reportReg = statisticsForRegressionByModel(runModel.modelData["statTest"], True)
            reportParam += reportReg+ "\n"

    if "bestValue" in runModel.modelData and runModel.modelData["bestValue"] is not None:
            isClass = rfTrained.yField.rfType == "Categorical"
            msg = ""
            if isClass:
                msg = ARCPY.GetIDMessage(84827)
            else:
                msg = ARCPY.GetIDMessage(84018)

            bestSeedMsg = ARCPY.GetIDMessage(84864)
            reportParam +="\n\n"+ bestSeedMsg.format(msg,LOCALE.format_string("%0.3f", runModel.modelData["bestValue"]),str(runModel.modelData["randSeed"]))

    ARCPY.AddMessage(reportParam)

    ssdoCheck = None

    if justDescribe:
        #### share information ####
        shareTest = None

        if "shareTest" in runModel.modelData and runModel.modelData["shareTest"] is not None:
            shareTest = runModel.modelData["shareTest"]

        shareMsg = runModel.reportShare(rfTrained, runModel.modelData["shareBase"], runModel.modelData["shareTraining"], shareTest, None)
        for rep in shareMsg:
            ARCPY.AddMessage(rep)
        return

    #### Obtain information of the variables used to predict ####
    totalVariables = len(hpar.listVariables)
    varsF, varsD, varsR = hpar.getVariableListByType()
    nVar = len(varsF) + len(varsD)
    nRasters = len(varsR)

    #### SSDO of features to predic ####
    if hpar.featuresToPredict not in ["", None,"#"]:
        ssdoCheck = SSDO.SSDataObject(hpar.featuresToPredict)

    if hpar.what == "PREDICT_RASTER":
        #### Predict Raster ####
        if nVar == 0 and nRasters == totalVariables and hpar.outputRaster is not None:

            applyZone = 1

            #### Get Raster Info ####
            pathR, nameR, typeRF, typeRFD = hpar.getRasterInformation(applyZone)

            #### Raster Info Object ####
            infoRaster = RasterInfo(pathR, typeRF, rasterNames = nameR, maxSize = MEMSIZE)

            #### Verify If The prediction is in external Area ####
            infoRaster.srfOutput = None
            srf = infoRaster.infoR[0].srf

            infoRaster.preProcessZones()
            newSRF = infoRaster.srf
            processInBatches = len(infoRaster.rangeZones) > 1

            #### Create a container of the variables  to obtain raster data ####
            rfTest = InfoForestField(isTraining = False)
            runModel.rfTraining = rfTrained
            runModel.rfTest = rfTest
            runModel.infoRasterInstances = infoRaster

            ##### Predict and Create the Output Raster #### 
            if not processInBatches :
                #### Use all in memory approach ####
                mask = rfTest.loadDataRasterForPredicting(rfTrained, infoRaster, 0)
                runModel.rasterDimensionInfo = infoRaster.getRasterInfoZone()
                runModel.rasterDimensionInfo[1] = mask
                predictData = runModel.predict();
                if predictData is not None and len(predictData) == 2:
                    runModel.outputRaster(predictData[0], newSRF = newSRF, outputPath = hpar.outputRaster)
                else:
                    runModel.outputRaster(predictData, newSRF = newSRF, outputPath = hpar.outputRaster)
            else:
                #### Predict in Batches #####
                runModel.rfTraining = rfTrained
                runModel.hpar = hpar
                runModel.infoRasterInstances = infoRaster
                #### Process Raster By Chuncks ####
                shareTest = None
                shareTraining = None
                shareInfoBase = None

                if runModel.modelData["shareBase"] is not None:
                    shareBase, shareTraining   = runModel.modelData["shareBase"], runModel.modelData["shareTraining"]
                    shareTest = None

                    if  "shareTest" in runModel.modelData:
                        shareTest =  runModel.modelData["shareTest"]
                    
                    shareInfoBase = [shareBase, shareTraining, shareTest ]
                    runModel.processRasterByParts(rfTest, randSeed, hpar, newSRF, enableShareAndUncert = False, shareInfoBase = shareInfoBase)
        else:
            ARCPY.AddError("Some variables are missing or output Raster is not defined") 

    if hpar.what == "PREDICT_FEATURES":

        #### Predict Feature Class ####
        if totalVariables == (nVar + nRasters) and  hpar.outputFeatures is not None:

            #### Using New Fatures ####
            ssdoTest = SSDO.SSDataObject(hpar.featuresToPredict)

            #### Obtain Data ####
            ssdoTest.obtainData(fields = [field.upper() for field in varsF], requireGeometry = False)
            rfTest = InfoForestField(ssdo = ssdoTest, isTraining = False)
            rfTest.distanceUnit = rfTrained.distanceUnit
            #### Obtain General Mask for  Predicting ####
            maskTotalTest = AddTestFieldN(rfTest, hpar)

            #### Apply mask in each Variable ####
            applyMaskFromRaster(rfTest, allIndices =  maskTotalTest)

            #### Compare the Variables Order ####
            dictOrder = hpar.getDictOrder()
            information  = compareForestInfo(rfTrained, rfTest, dictOrder, balance = False)

            if information is not None:
                raise SystemExit()

            runModel.rfTest = rfTest

            #### Execute Prediction ####
            predictData = runModel.predict()

            if predictData is None:
                ARCPY.AddError("Prediction was empty")
                raise SystemExit()

            predictDataProb = None

            if type(predictData) == NUM.ndarray:
                predictDataBase = predictData
            if type(predictData) != NUM.ndarray and len(predictData) == 2:
                predictDataBase = predictData[0]
                predictDataProb = predictData[1]
                if rfTrained.appVersion in ["3.1", "3.2"]:
                    predictDataProb = None

            #### Generate Output ####
            runModel.createOutput(predictDataBase, rfTrained, rfTest, rfTest.ssdo, hpar.outputFeatures, hpar, prob = predictDataProb )
            ARCPY.env.extent = globalExtent
        else:
            ARCPY.AddError("Some variables are missing or output FC is not defined")

    #### share information ####
    sharePredict = runModel.getMinMaxX(rfTrained, runModel.rfTest.x)
    shareTest = None

    if "shareTest" in runModel.modelData and runModel.modelData["shareTest"] is not None:
        shareTest = runModel.modelData["shareTest"]

    shareMsg = runModel.reportShare(rfTrained, runModel.modelData["shareBase"], runModel.modelData["shareTraining"], shareTest, sharePredict)
    for rep in shareMsg:
        ARCPY.AddMessage(rep)

    return

def saveModelInfo(rfTraining, hpar):
    UTILS.checkOutputPath(hpar.outputModel, "FILE", ["SSM"])

    if hpar.xgbPar is not None and len(hpar.xgbPar):
        rfTraining.saveInfo(hpar.outputModel, modelType="Gradient_Boosted")
    else:
        rfTraining.saveInfo(hpar.outputModel, modelType="Forest")

    ### Add a probability flag in the model ###
    if hpar.addProbabilities:
        UTILS.ModelMetadata.addData(hpar.outputModel, "FB_addProbabilities", "True", "attribute")

dbgInput = None #fr"c:/temp/newField"
dbgName_base ="classification"
serieID = 0

def executeFR(**arg):
    #info = fr" y_t:{arg['y_test'].sum()} nt:{arg['number_trees']} leaf:{arg['node_size']} sample:{arg['sample_size']} depth:{arg['max_nodes']} perm:{arg['permute_vars']} seed:{arg['seed']} " 

    global serieID
    global dbgInput
    if dbgInput is not None:
        serieID +=1
        dbgName = dbgName_base + "_" + str(serieID)
        fileOutput = fr"{dbgInput}\{dbgName}.py"
        fileOutput1 = fr"NUM.load(r'{dbgInput}"+fr"\{dbgName}"+"{0}.npy')"
        fileOutputs = fr"{dbgInput}"+fr"\{dbgName}"+"{0}.npy"

        f = open(fileOutput,"w")
        print("import arcgisscripting as ARC", file= f)
        print("import numpy as NUM", file= f)
        print("ARC._ss.forest(", file=f )
        id= 0
        for e in arg.items():
            if e[0] == "header":
                print("header","= '',", file= f)
                continue

            if type(e[1]) == NUM.ndarray:
                NUM.save(fileOutputs.format(id), e[1])
                print(e[0],"=", fileOutput1.format(id), ",", file= f)
                id+=1

            if type(e[1]) in [int, float, str, bool ]:
                v = e[1]
                if v in [""]:
                    v = "\"\""
                print(e[0],"=", fr"{v}", ",", file= f)

            if e[1] is None:
                print(e[0],"=", "None", ",", file= f)

            if type(e[1]) == list:
                st =[]
                for ne in e[1]:
                    NUM.save(fileOutputs.format(id), ne)
                    st.append(fileOutput1.format(id))
                    id+=1 
                print(e[0],"=[",",".join(st) , "],", file= f)
        print(")", file= f)
        f.close()

    data = ARC._ss.forest(**arg)

    if data is None:
        if arg["model"] not in [None, '']:
            if OS.path.isfile(arg["model"]):
                OS.remove(arg["model"] )
    return data

# run the script
if __name__ == '__main__':
    parameters = ARCPY.GetParameterInfo()
    
    if len(parameters) == 0:
        ARCPY.AddError("PLease run Forest Tool")
        raise SystemExit

    infoR = execute(parameters)
    if infoR is not None:
        ARCPY.SetParameter(27, infoR)
