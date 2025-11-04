# coding: utf-8
"""
Source Name:   SSEncode.py
Version:       ArcGIS PRO 2.6
Author:        Environmental Systems Research Institute Inc.
Description:   Reclassify Field
"""
import arcpy
import arcpy as ARCPY
import SSUtilities as UTILS
import numpy as NUM
import os as OS
import datetime as DT
import Stats as STATS
import SSTimeUtilities as TUTILS
import SSCubeUtilities as CUTILS
import re as RE

class EncodeVariable(object):
    """
    This class encodes an array, generating a list of encode arrays
    INPUT:
        data {1D Array}: Array 
        fieldName {string}: Field Name
        encodeMethod {str}: ORDINAL, ONEHOT, ONECOLD, BINARY

    METHOD:
        self.encode(): Execute the process to encode

    PROPERTIES:
        self.outputData = List of 1D arrays
        self.fieldNames = List field names
        self.fieldNamesAlias = List field name aliases
    """
    def __init__(self, reader, fieldName = "Fake", encodeMethod = "ONEHOT", alias = "", timeParameters = None, isShp = False):
        self.fieldName = fieldName
        self.data = reader.data[0].ravel()
        self.ssdo = reader.ssdo
        self.n = len(self.data)
        self.encodeMethod = encodeMethod
        self.encode = None
        self.isShp = isShp
        self.dirName = {
        "ONEHOT": ["ONEHOT_{1}_{0}", self.__oneHot, "One-hot","OH_{0}"],
        "ONECOLD": ["ONECOLD_{1}_{0}", self.__oneCold,"One-cold","OC_{0}"],
        "ORDINAL": ["ENCORD", self.__ordinal,"Ordinal","OR_{0}"],
        "BINARY": ["ENCBIN_{0}", self.__binary,"Binary","BI_{0}"],
        "TEMPORAL": ["TIMESTEP_{0}", self.__temporal,"Temporal","TS_{0}"]
        }

        if alias not in ["", None, "#"]:
            if self.encodeMethod not in ["ORDINAL", "TEMPORAL"]:
                self.dirName[self.encodeMethod][0] = alias+"{0}"
            else:
                self.dirName[self.encodeMethod][0] = alias

        #### Warn for high precision Dates
        if self.encodeMethod == "TEMPORAL":
            warn = self.ssdo.warnNotUsingHighPrecisionDates([self.fieldName])

        self.encode = self.dirName[self.encodeMethod][1]
        self.isNumeric = self.data.dtype in [NUM.dtype('int32'), NUM.dtype('int64')]
        self.uniqueValues = NUM.unique(self.data)

        self.referenceStartTime = None
        self.referenceEndTime = None
        self.adjustExtent = True
        self.useRefTime = False
        self.timeUnit = self.timeSize = self.isStartTime = \
        self.timeInterval =  self.timeAlignment =  self.refTime = None
        if encodeMethod == "TEMPORAL":
            self.timeInterval ,  self.timeAlignment ,  self.refTime = timeParameters

        self.outputData = []
        self.fieldNames = []
        self.fieldNameAlias = []

    def __checkNames(self, uniqueValues, start = 8, maxCharact= 64):
        self.fieldNameShort = None

        
        if start >= maxCharact:
            self.fieldNameShort = self.fieldName[0:8]
            start = 16
            
        nNames = {}

        for id, elem in enumerate(uniqueValues):
            if type(elem) in [NUM.int32, NUM.int64]:
                nNames[elem]= str(elem)
            else:
                elemSub = RE.sub('[^a-zA-Z0-9]', '_',elem )
                nNames[elem]= elemSub[0:int(maxCharact-start-2)]
                
        rep, counts = NUM.unique(list(nNames.values()), return_counts=True)
        info = {n:[c,0] for n,c in zip(rep,counts)}

        nList= []
        for id, elem in enumerate(uniqueValues):
            if info[nNames[elem]][0]>1:
                info[nNames[elem]][1]+=1
                nList.append(nNames[elem]+str(info[nNames[elem]][1]))
            else:
                nList.append(nNames[elem])

        return nList

    def __oneHot(self):
        name = self.dirName[self.encodeMethod][0]
        partAlias = self.dirName[self.encodeMethod][2]

        #### Use abreviation ####
        if  self.isShp:
            name = self.dirName[self.encodeMethod][3]

        #### Check Repeated Names After Remove Special Characters ####
        uniqueNames = self.__checkNames(self.uniqueValues,8+len(self.fieldName))

        for id, elem in enumerate(self.uniqueValues):
            field = NUM.zeros(self.n, dtype = NUM.int32)
            field[ self.data == elem] = 1
            self.outputData.append(field)
            if  self.isShp:
                self.fieldNames.append(name.format(uniqueNames[id]))
            else:
                if self.fieldNameShort is None:
                    self.fieldNames.append(name.format(uniqueNames[id],self.fieldName))
                else:
                    self.fieldNames.append(name.format(uniqueNames[id],self.fieldNameShort))
                    
            self.fieldNameAlias.append("{1} ({2}_{0})".format(partAlias,elem,self.fieldName))

    def __oneCold(self):
        name = self.dirName[self.encodeMethod][0]
        partAlias = self.dirName[self.encodeMethod][2]

        #### Use abreviation ####
        if  self.isShp:
            name = self.dirName[self.encodeMethod][3]

        #### Check Repeated Names After Remove Special Characters ####
        uniqueNames = self.__checkNames(self.uniqueValues,9+len(self.fieldName))

        for id, elem in enumerate(self.uniqueValues):
            field = NUM.ones(self.n, dtype = NUM.int32)
            field[ self.data == elem] = 0
            self.outputData.append(field)
            if  self.isShp:
                self.fieldNames.append(name.format(uniqueNames[id]))
            else:
                if self.fieldNameShort is None:
                    self.fieldNames.append(name.format(uniqueNames[id],self.fieldName))
                else:
                    self.fieldNames.append(name.format(uniqueNames[id],self.fieldNameShort))
            self.fieldNameAlias.append("{1} ({2}_{0})".format(partAlias,elem,self.fieldName))

    def __ordinal(self):
        name = self.dirName[self.encodeMethod][0]
        field = NUM.zeros(self.n, dtype = NUM.int32)
        for id, elem in enumerate(self.uniqueValues):
            field[self.data == elem] = id + 1
        self.outputData.append(field)
        self.fieldNames.append(name)
        self.fieldNameAlias.append(self.fieldName)

    def __binary(self):
        name = self.dirName[self.encodeMethod][0]
        partAlias = self.dirName[self.encodeMethod][2]
        maxNum = len(self.uniqueValues)
        numFields = len(str(bin(maxNum)).replace('0b',''))
        dictVal = {}
        for e in NUM.arange(maxNum)+1:
            info = NUM.zeros(numFields)
            binVal = str(bin(e)).replace('0b','')

            cont = len(binVal)-1
            for id in reversed(range(numFields)):
                info[id] = int(binVal[cont])
                cont -= 1
                if cont == -1:
                    break
            dictVal[e] =  info

        fields = NUM.zeros((self.n,numFields), dtype = NUM.int32)
        for id, elem in enumerate(self.uniqueValues):
            fields[self.data == elem] = dictVal[id]

        for id in range(numFields):
            self.outputData.append(fields.T[id].copy())
            self.fieldNames.append(name.format(id+1))
            self.fieldNameAlias.append("{1} ({0})".format(partAlias,id+1))

    def __temporal(self):
        #### Get Time Data ####
        timeData = self.data

        #### Retrieve Time Data ####
        minDataTime = timeData.min()
        maxDataTime = timeData.max()

        #### Test for Temporal Outliers ####
        secondTime = NUM.array(timeData - minDataTime, dtype = NUM.int32)
        timeOutliers = STATS.iqrOutliers(secondTime)
        numTimeOutliers = timeOutliers.sum()
        if numTimeOutliers:
            ARCPY.AddIDMessage("WARNING", 110050, str(numTimeOutliers))
            timeIDs = timeOutliers.nonzero()
            outliers = [ str(self.ssdo.order2Master[i]) for i in timeIDs[0] ]
            outliers = ", ".join(outliers[:30])
            #ARCPY.AddIDMessage("WARNING", 110051, self.ssdo.oidName, outliers)

        if self.timeInterval is None:
            #### Default Time Breaks ####
            useDefaultTime = True
            totalSeconds = int(secondTime.max())
            n = len(secondTime)

            #### Get Default Number of Time Bins ####
            if CUTILS.histMethod == "RISK_FUN":
                numBreaks = int(STATS.riskFunBins(secondTime, CUTILS.riskFunMin,
                                                  CUTILS.riskFunMax, CUTILS.riskFunStep))
                riceBreaks = STATS.riceBins(n)
                if riceBreaks < numBreaks:
                    numBreaks = riceBreaks

            #### Assure At Least 2 ####
            if numBreaks < 2:
                numBreaks = 2

            #### Round to Human Readable ####
            breakInfo = TUTILS.defaultTimeBreakInfo(totalSeconds, numBreaks)
            defaultTimeSize, timeStepLabel = breakInfo
            humanVal, humanType = timeStepLabel.split(" ")
            timeLab = humanType.upper()
            if timeLab[-1] != "S":
                timeLab += "S"
            self.timeUnit = timeLab
            self.timeSize = int(humanVal)
        else:
            useDefaultTime = False

            #### Set/Validate Time Size ####
            self.timeSize, self.timeUnit = self.timeInterval.split(" ")
            try:
                self.timeSize = int(self.timeSize)
            except:
                ARCPY.AddIDMessage("ERROR", 110007)
                raise SystemExit()

            #### Set/Validate Time Unit ####
            self.timeUnit = self.timeUnit.upper()
            if self.timeUnit.upper() not in TUTILS.supportTime:
                ARCPY.AddIDMessage("ERROR", 110008)
                raise SystemExit()

        #### Set/Validate Time Alignment ####
        self.timeAlignment = self.timeAlignment.replace(" ", "_").upper()
        if self.timeAlignment not in ["START_TIME", "END_TIME", "REFERENCE_TIME"]:
            ARCPY.AddIDMessage("ERROR", 110011, self.timeAlignment)
            raise SystemExit()

        #### Set/Validate Reference Time ####
        if "REFERENCE_TIME" in self.timeAlignment and self.refTime  is not None:
            if type(self.refTime) == DT.datetime:
                self.useRefTime = True
            else:
                self.timeAlignment = 'END_TIME'
                self.refTime = None 

        #### Set Even Versus Uneven (Calendar) Breaks ####
        if self.timeUnit in ["MONTH", "MONTHS", "YEAR", "YEARS"]:
            unevenTimeBreak = True
        else:
            unevenTimeBreak = False

        #### Get Base Time Break and Direction to Set ####
        self.isStartTime = False
        if "START_TIME" in self.timeAlignment:
            timeBase = minDataTime
            self.isStartTime = True
        elif self.useRefTime:
            timeBase = NUM.array(self.refTime, dtype = 'datetime64[s]')
            if timeBase <= minDataTime:
                self.isStartTime = True
        else:
            timeBase = maxDataTime

        #### Finalize Alignment After Accounting for Reference Time ####
        if self.isStartTime:
            self.timeAlignment = "START_TIME"
        else:
            self.timeAlignment = "END_TIME"

        #### Get Time Break Values ####
        if not unevenTimeBreak:
            breakTimeSize = TUTILS.createTimeDelta(int(self.timeSize), self.timeUnit).item().total_seconds()
            breakTimeUnit = "SECONDS"
        else:
            breakTimeSize = self.timeSize
            breakTimeUnit = self.timeUnit

        #### Create Time Breaks (Possibly Reset Time Alignment) ####
        self.timeAlignment, timeBreaks = TUTILS.createTimeBreaks(timeData, breakTimeSize, 
                                                                 breakTimeUnit,
                                                                 refType = self.timeAlignment,
                                                                 refTime = self.refTime,
                                                                 refStartTime = self.referenceStartTime,
                                                                 refEndTime = self.referenceEndTime)
        self.isStartTime = self.timeAlignment == "START_TIME"

        self.startTime = timeBreaks[0]
        self.endTime = timeBreaks[-2]
        self.timeBins = TUTILS.binTimeData(timeData, timeBreaks, self.isStartTime)
        self.timeBreaks = timeBreaks
        self.numTime = len(timeBreaks) - 1
        timeIDList = NUM.arange(0, self.numTime)
        startTimeSec = self.startTime.toordinal()
        timeArray = NUM.array(timeBreaks, dtype = 'datetime64[s]')
        self.timeBreakSec = (timeArray - timeArray[0]) / NUM.timedelta64(1, 's')
        self.timeBreakSec = NUM.array(self.timeBreakSec[:-1], dtype = NUM.int64)

        self.displayTimeUnit = UTILS.getDisplayTimeUnit(self.timeUnit,
                                                        self.timeSize)
        stepStr = UTILS.formatString("{0} {1}")
        self.timeStepLabel = TUTILS.prettyTime(stepStr.format(self.timeSize,
                                                              self.timeUnit))

        #### Data Start/End Time ####
        self.dataMinTime = minDataTime.item().strftime('%Y-%m-%d %H:%M:%S')
        self.dataMaxTime = maxDataTime.item().strftime('%Y-%m-%d %H:%M:%S')

        #### Calculate Aggregation Bias ####
        self.startBias, self.endBias = TUTILS.aggregationBias(timeBreaks,
                                                      minDataTime.item(),
                                                      maxDataTime.item())

        #### Report Default Time Info ####
        if useDefaultTime:
            prettyTime = TUTILS.prettyTime(self.timeStepLabel.lower())
            outTimeSize, outTimeUnit = prettyTime.split(" ")
            outTimeUnit = UTILS.getLocalizedUnitType(outTimeUnit)
            ARCPY.AddIDMessage("WARNING", 110013, outTimeSize, outTimeUnit)

        self.firstStartTime = timeBreaks[0]
        self.firstEndTime = timeBreaks[1]
        self.lastStartTime = timeBreaks[-2]
        self.lastEndTime = timeBreaks[-1]
        self.t = self.timeBreakSec
        stDate, endDate = self.getOutputTimeFieldInfo()

        name = self.dirName[self.encodeMethod][0]
        nameST = "STARTTIME_{0}"
        nameET = "ENDTIME_{0}"

        if  self.isShp:
            name = self.dirName[self.encodeMethod][3]
            nameST = "ST_{0}"
            nameET = "ET_{0}"

        field = self.timeBins
        startFieldData =  stDate[field]
        endFieldData =  endDate[field]
        self.outputData.extend([field, startFieldData, endFieldData])
        self.fieldNames.extend([name.format(self.fieldName),
                                nameST.format(self.fieldName),
                                nameET.format(self.fieldName)])

        self.fieldNameAlias.extend(["{0} {1}".format(self.fieldName,"Time Step"),
                                   self.fieldName + " Start Time",
                                   self.fieldName + " End Time"]
                                    )

    def getOutputTimeFieldInfo(self):
        """Returns output start and end times."""

        s = DT.timedelta(seconds = 1)
        tMinus1 = self.numTime - 1
        timeSteps = NUM.arange(self.numTime, dtype = NUM.int32)
        startTimes = []
        endTimes = []
        for timeIndex in timeSteps:
            t = int(self.t[timeIndex])

            startDT = self.firstStartTime + DT.timedelta(seconds = t)
            if timeIndex == tMinus1:
                endDT = self.lastEndTime
            else:
                t1 = int(self.t[timeIndex + 1])
                endDT = self.firstStartTime + DT.timedelta(seconds = t1)

            if self.isStartTime:
                endDT = endDT - s
            else:
                startDT = startDT + s

            startTimes.append(startDT)
            endTimes.append(endDT)

        return NUM.array(startTimes, dtype = 'datetime64[s]'), NUM.array(endTimes, dtype = 'datetime64[s]')



# run the script
if __name__ == '__main__':

    parameters = arcpy.GetParameterInfo()
    maximumShp = 256
    maximumGDB = 32767

    #### User Defined Inputs ####
    inputData = UTILS.getInputAppendParameter(0, parameters)
    categoryField = parameters[1].valueAsText
    method = parameters[2].valueAsText
    aliasName =""
    timeInterval = parameters[3].valueAsText
    timeAlignment = parameters[4].valueAsText
    refTime = parameters[5].value

    appendFields = "APPEND_FIELDS_INPUT"

    #### Default method ####
    if method in [None, ""]:
        method = "ONEHOT"

    if timeAlignment is None:
        timeAlignment  = "END_TIME"

    #### Apply Extent ####
    inputData, createTempLayer  =  UTILS.createLayerFromExtent(inputData)

    #### Read Data ####
    reader = UTILS.GenericReader(inputData, [[categoryField.upper()]], 
                   blockType = ["auto"], 
                   outputOption = appendFields, displayProjectionWarning = False, ignoreDateHighPrecision = True)

    numFieldsInput = len(reader.ssdo.fields)

    if "NEW_DATASET_JUST_NEW_FIELDS":
        numFieldsInput = 2

    if timeInterval == "":
        timeInterval = None
        
    if timeAlignment == "":
        timeAlignment = None

    timeParameters = None
    if method == "TEMPORAL":
        timeParameters = timeInterval, timeAlignment, refTime
 
    #### Encode Data ####
    getEnc = EncodeVariable(reader, fieldName = categoryField, 
                                  encodeMethod = method, alias = aliasName,
                                  timeParameters = timeParameters,
                                  isShp = not UTILS.isGDB(inputData))
    numCategories = len(getEnc.uniqueValues)

    if method != "TEMPORAL":
        #### Check Maxmimum Number of Fields ###
        if not UTILS.isGDB(inputData):
            if numCategories + numFieldsInput > maximumShp:
                ARCPY.AddIDMessage("ERROR", 110342,maximumShp )
                raise SystemExit
        else:
            if numCategories + numFieldsInput > maximumGDB:
                ARCPY.AddIDMessage("ERROR", 110342, maximumGDB )
                raise SystemExit

    getEnc.encode()

    outputData = []
    fieldNames = []
    aliasFieldNames = []

    #### Only when new dataset is created ####
    if reader.outputOption == "NEW_DATASET_JUST_NEW_FIELDS":
        #### Organize Output ####
        outputData = [reader.oidFieldData, reader.data[0].ravel() ] + getEnc.outputData
        fieldNames = ["SOURCE_ID", categoryField] + getEnc.fieldNames
        aliasFieldNames = ["Source ID", reader.dictFields[categoryField]] +  getEnc.fieldNameAlias
    else:
        outputData = getEnc.outputData
        fieldNames = getEnc.fieldNames
        aliasFieldNames = getEnc.fieldNameAlias

    #### Write Output ####
    reader.output(inputData, outputData, fieldNames, aliasFieldNames, 
                  parameters = parameters, indexOutput = 6, indexInput = 0)

    #### Remove Temporal layer ####
    if createTempLayer:
        try:
            ARCPY.management.Delete('refLayer')
        except:
            pass
