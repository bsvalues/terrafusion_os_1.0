# coding: utf-8
"""
Tool Name:  Data Engineering Export Field Statistics
Source Name: DEFieldStatisticsToTable.py
Version: ArcGIS PRO 2.9
Author: ESRI
"""

##########################################
import arcpy
import arcpy as ARCPY
import arcgisscripting  as ARC
import SSUtilities as UTILS
import SSDataObject as SSDO
import json as JSON
import numpy as NUM
import os as OS
import locale as LOCALE
import datetime as DT
LOCALE.setlocale(LOCALE.LC_ALL, '')

################# Constants #################
minInt  = -2147483648
dateOnlyFormat = ""
timeFormat = ""
#### Refence Formatting ####
refTime = DT.datetime(1899, 12, 30)
refTime2 = DT.datetime(1899, 12, 30, 22, 24, 35)
#### Key word for statistic MiniChart.
_key_MiniChart = "MINICHART"
_key_MiniChart_alias = "MiniChart"
#### Key word for statistic Minimum.
_key_Minimum = "MINIMUM"
_key_Minimum_alias = ARCPY.GetIDMessage(220288)
#### Key word for statistic Maximum.
_key_Maximum = "MAXIMUM"
_key_Maximum_alias = ARCPY.GetIDMessage(220289)
#### Key word for statistic Mean.
_key_Mean = "MEAN"
_key_Mean_alias = ARCPY.GetIDMessage(220290)
#### Key word for statistic Median.
_key_Median = "MEDIAN"
_key_Median_alias = ARCPY.GetIDMessage(220291)
#### Key word for statistic StandardDeviation.
_key_StandardDeviation = "STANDARDDEVIATION"
_key_StandardDeviation_alias = ARCPY.GetIDMessage(220292)
#### Key word for statistic Count.
_key_Count = "COUNT"
_key_Count_alias = ARCPY.GetIDMessage(84785)
#### Key word for statistic NumberOfNulls.
_key_NumberOfNulls = "NUMBEROFNULLS"
_key_NumberOfNulls_alias =  ARCPY.GetIDMessage(220087)
#### Key word for statistic NumberUniqueValues.
_key_NumberUniqueValues = "NUMBERUNIQUEVALUES"
_key_NumberUniqueValues_alias = ARCPY.GetIDMessage(220311)
#### Key word for statistic Mode.
_key_Mode = "MODE"
_key_Mode_alias = ARCPY.GetIDMessage(220312)
#### Key word for statistic LeastCommon.
_key_LeastCommon = "LEASTCOMMON"
_key_LeastCommon_alias = ARCPY.GetIDMessage(220313)
#### Key word for statistic Outliers.
_key_Outliers = "OUTLIERS"
_key_Outliers_alias = ARCPY.GetIDMessage(220314)
#### Key word for statistic Sum.
_key_Sum = "SUM"
_key_Sum_alias = ARCPY.GetIDMessage(84545)
#### Key word for statistic Range.
_key_Range = "RANGE"
_key_Range_alias = ARCPY.GetIDMessage(220315)
#### Key word for statistic IQR.
_key_IQR = "IQR"
_key_IQR_alias = ARCPY.GetIDMessage(220316)
#### Key word for statistic FirstQuartile.
_key_FirstQuartile = "FIRSTQUARTILE"
_key_FirstQuartile_alias = ARCPY.GetIDMessage(220317)
#### Key word for statistic ThirdQuartile.
_key_ThirdQuartile = "THIRDQUARTILE"
_key_ThirdQuartile_alias = ARCPY.GetIDMessage(220318)
#### Key word for statistic CoefficientOfVariation.
_key_CoefficientOfVariation = "COEFFICIENTOFVARIATION"
_key_CoefficientOfVariation_alias = ARCPY.GetIDMessage(220319)
#### Key word for statistic Skewness.
_key_Skewness = "SKEWNESS"
_key_Skewness_alias = ARCPY.GetIDMessage(84742)
#### Key word for statistic Kurtosis.
_key_Kurtosis = "KURTOSIS"
_key_Kurtosis_alias = ARCPY.GetIDMessage(84739)
#### Key word for statistic FieldName.
_key_FieldName = "FIELDNAME"
_key_FieldName_alias = ARCPY.GetIDMessage(220308)
#### Key word for statistic Alias.
_key_Alias = "ALIAS"
_key_Alias_alias = ARCPY.GetIDMessage(220309)
#### Key word for statistic FieldType.
_key_FieldType = "FIELDTYPE"
_key_FieldType_alias = ARCPY.GetIDMessage(220310)

statsKeyAlias = {
 _key_FieldName : _key_FieldName_alias,
 _key_Alias : _key_Alias_alias,
 _key_FieldType : _key_FieldType_alias,
 _key_NumberOfNulls : _key_NumberOfNulls_alias,
 _key_MiniChart : _key_MiniChart_alias,
 _key_Minimum : _key_Minimum_alias,
 _key_Maximum : _key_Maximum_alias,
 _key_Mean :_key_Mean_alias,
 _key_StandardDeviation : _key_StandardDeviation_alias,
 _key_Median : _key_Median_alias,
 _key_Count : _key_Count_alias,
 _key_NumberUniqueValues : _key_NumberUniqueValues_alias,
 _key_Mode : _key_Mode_alias,
 _key_LeastCommon : _key_LeastCommon_alias,
 _key_Outliers : _key_Outliers_alias,
 _key_Sum :_key_Sum_alias,
 _key_Range : _key_Range_alias,
 _key_IQR : _key_IQR_alias,
 _key_FirstQuartile : _key_FirstQuartile_alias,
 _key_ThirdQuartile : _key_ThirdQuartile_alias,
 _key_CoefficientOfVariation : _key_CoefficientOfVariation_alias,
 _key_Skewness : _key_Skewness_alias,
 _key_Kurtosis : _key_Kurtosis_alias
 }

resultkeyInternalKey ={
'MiniChart': _key_MiniChart,
'Mean':_key_Mean,
'Minimum':_key_Minimum,
'Maximum':_key_Maximum,
'StandardDeviation':_key_StandardDeviation,
'Kurtosis':_key_Kurtosis,
'Skewness':_key_Skewness,
'Median':_key_Median,
'Mode':_key_Mode,
'NumberUniqueValues':_key_NumberUniqueValues,
'LeastCommon':_key_LeastCommon,
'Count':_key_Count,
'NumberOfNulls': _key_NumberOfNulls,
'Outliers':_key_Outliers,
'FirstQuartile': _key_FirstQuartile,
'ThirdQuartile':_key_ThirdQuartile,
'IQR':_key_IQR,
'Sum': _key_Sum,
'CoefficientOfVariation':_key_CoefficientOfVariation,
'Range':_key_Range,
_key_FieldName:_key_FieldName,
_key_Alias : _key_Alias,
_key_FieldType:_key_FieldType
}


statsKey = {
 _key_FieldName : "FieldName",
 _key_Alias : "Alias",
 _key_FieldType : "FieldType",
 _key_NumberOfNulls : "Nulls",
 _key_MiniChart : "MiniChart",
 _key_Minimum : "Minimum",
 _key_Maximum : "Maximum",
 _key_Mean : "Mean",
 _key_StandardDeviation : "StandardDeviation",
 _key_Median : "Median",
 _key_Count : "Count",
 _key_NumberUniqueValues : "NumberofUniqueValues",
 _key_Mode : "Mode",
 _key_LeastCommon : "LeastCommon",
 _key_Outliers : "Outliers",
 _key_Sum : "Sum",
 _key_Range : "Range",
 _key_IQR : "InterquartileRange",
 _key_FirstQuartile : "FirstQuartile",
 _key_ThirdQuartile : "ThirdQuartile",
 _key_CoefficientOfVariation : "CoefficientofVariation",
 _key_Skewness : "Skewness",
 _key_Kurtosis : "Kurtosis"
 }
 
 #### Short field Names ####
statsShort = {
 _key_FieldName : "FieldName",
 _key_Alias : "Alias",
 _key_FieldType : "FieldType",
 _key_NumberOfNulls : "Nulls",
 _key_MiniChart : "MiniChart",
 _key_Minimum : "Minimum",
 _key_Maximum : "Maximum",
 _key_Mean : "Mean",
 _key_StandardDeviation : "StdDev",
 _key_Median : "Median",
 _key_Count : "Count",
 _key_NumberUniqueValues : "Unique",
 _key_Mode : "Mode",
 _key_LeastCommon : "LeastCommn",
 _key_Outliers : "Outliers",
 _key_Sum : "Sum",
 _key_Range : "Range",
 _key_IQR : "IQR",
 _key_FirstQuartile : "FirstQuart",
 _key_ThirdQuartile : "ThirdQuart",
 _key_CoefficientOfVariation : "CoefVar",
 _key_Skewness : "Skewness",
 _key_Kurtosis : "Kurtosis",
 }


NumericIntegerColumns = [_key_Outliers]

IntegerColumnsForAlls1 = [ _key_Count, _key_NumberOfNulls, _key_NumberUniqueValues ]

TextColumnsForAlls1 = [_key_FieldName, _key_Alias, _key_FieldType]

NumericColumns1 = [ _key_Mean, _key_Minimum, _key_Maximum, _key_StandardDeviation, _key_Kurtosis,
                   _key_Skewness, _key_Median, _key_FirstQuartile, _key_ThirdQuartile, _key_IQR,
                      _key_Mode, _key_Sum, _key_CoefficientOfVariation, _key_Range, _key_LeastCommon]

CategoricalColumns1 = [  _key_Mode,  _key_Mode, _key_LeastCommon ]

DateTimeColumns1 = [ _key_Mean, _key_Median, _key_Minimum, _key_Maximum, _key_NumberOfNulls,
                   _key_Mode, _key_Range,_key_LeastCommon, _key_FirstQuartile, _key_ThirdQuartile ]

DoubleColumnsInTextOutput = [_key_StandardDeviation, _key_Sum, _key_IQR, _key_CoefficientOfVariation, _key_Skewness, _key_Kurtosis ]


NumericColumnsComplete = [_key_FieldName, _key_Alias, _key_FieldType,
                   _key_Mean, _key_Minimum, _key_Maximum, _key_StandardDeviation, _key_Kurtosis,
                   _key_Skewness, _key_Median, _key_FirstQuartile, _key_ThirdQuartile, _key_IQR, _key_Mode,
                   _key_Count, _key_NumberOfNulls, _key_Outliers, _key_NumberUniqueValues,
                   _key_Sum, _key_CoefficientOfVariation, _key_Range, _key_LeastCommon]

TextColumnsComplete = [_key_FieldName, _key_Alias, _key_FieldType,
                      _key_Count, _key_NumberOfNulls, _key_Mode, _key_NumberUniqueValues, _key_Mode, _key_LeastCommon ]

DateColumnsComplete = [_key_FieldName, _key_Alias, _key_FieldType,
                    _key_Mean, _key_Median, _key_Minimum, _key_Maximum, _key_NumberOfNulls,
                   _key_Mode, _key_Count, _key_NumberUniqueValues, _key_Range, _key_LeastCommon, _key_FirstQuartile, _key_ThirdQuartile ]


def isDB(workspace):
    if workspace is None:
        return True
    typeW = "Folder"
    isGDB = False
    if workspace is not None:
        lst = [".GDB", "MEMORY", ".SDE", ".SQLITE", ".GPKG", ".GEODATABASE"]
        for e in lst:
            if e in workspace.upper():
                isGDB = True
                typeW = e
    else:
        isGDB = True
    return isGDB, typeW


#### Localize these types TODO ####
_key_Double = ARCPY.GetIDMessage(220303)
_key_Long = ARCPY.GetIDMessage(220304)
_key_Text = ARCPY.GetIDMessage(220305)
_key_Date = ARCPY.GetIDMessage(84970)
_key_Short = ARCPY.GetIDMessage(220306)
_key_Float = ARCPY.GetIDMessage(220307)
_key_BigInteger = ARCPY.GetIDMessage(220653)
_key_DateOnly = ARCPY.GetIDMessage(220686)
_key_TimeOnly = ARCPY.GetIDMessage(220685)
_key_TimeStampOffset = ARCPY.GetIDMessage(220687)
dataTypeLoc = {"DOUBLE": _key_Double,
                "LONG": _key_Long,
                "TEXT": _key_Text,
                "DATE": _key_Date,
                "SINGLE": _key_Float,
                "SHORT": _key_Short,
                "STRING": _key_Text,
                "SMALLINTEGER": _key_Short,
                "INTEGER": _key_Long,
                "BIGINTEGER" : _key_BigInteger,
                "DATEONLY": _key_DateOnly,
                "TIMEONLY": _key_TimeOnly,
                "TIMESTAMPOFFSET": _key_TimeStampOffset
                }

def getType(field):
    sType = field.type.upper()
    if sType in ["STRING", "TEXT"]:
        return dataTypeLoc[sType] + " ({0})".format(field.length)
    elif sType in dataTypeLoc:
        if sType == "DATE" and field.precision == 1:
            return fr"{dataTypeLoc[sType]}  ({ARCPY.GetIDMessage(220688)})" 
        return dataTypeLoc[sType]
    else:
        ### Others as text ###
        return  _key_Text

def getfldName(value, isGDB):
    if isGDB:
        return value
    else:
        return statsShort[value]

class JsonObj(object):
    def __init__(self, info):
        self.info = info
    def read(self):
        return self.info

def CheckValue(value, precision = 0):
    isExp = False
    parts = ["0", "0"]

    if "e" in value.lower():
        fValue = float(value)
        isExp = True

        if "e-" not in value.lower():
            vstr = str(fValue - int(float(value)))
            part = vstr.split(".")

            if len(part) > 1:
                parts = [str(int(float(value))), part[1]]
            else:
                parts = [str(int(float(value))), "0"]
        else:
            vstr = LOCALE.format_string("%.15f", fValue)
            if "." in vstr:
                part = vstr.split(".")
            if "," in vstr:
                part = vstr.split(",")
            parts = ["0", vstr]
    else:
        parts = value.split(".")

    return parts, isExp

def ToDateTime(value, precision= 0 ):
    
    if value in ["inf", "-inf"]:
        return NUM.datetime64("NaT")
    
    parts, isExp = CheckValue(value, precision= precision)

    days = int(parts[0])
    hourv = 0
    
    if len(parts) > 1:
        if not isExp:
            hourv = float(fr"0.{parts[1]}")
        else:
            hourv = float(parts[1])

    nD = refTime + DT.timedelta(days=days)

    ##ARCPY.AddWarning(fr" {str(nD)}  {value}  {str(days)} {str(hourv)}")

    hours = hourv * 24.0
    minutes = (hours - NUM.floor(hours)) * 60
    seconds = (minutes - NUM.floor(minutes)) * 60.0
    hour = int(hours)
    minute = int(minutes)
    milliSeconds = 0
    if precision == 1:
        milliSeconds = NUM.round((seconds - NUM.floor(seconds)),3)
        if NUM.allclose(milliSeconds,1):
            milliSeconds = 0
            second = int(NUM.floor(seconds)) + 1
        else:
            if NUM.allclose(milliSeconds,0):
                second = int(NUM.round(seconds))
            else:
                second = int(NUM.floor(seconds))
    else:
        second = NUM.round(seconds)

    if second == 60:
        minute+=1
        second = 0
    if minute == 60:
        hour+=1;
        minute = 0

    if hour > 23:
        hour = int(hours)
        minute = int(minutes)
        second = int(seconds)

    try:
        if precision:
            dtO =  DT.datetime(nD.year, nD.month, nD.day, hour, minute, second, int(milliSeconds*1000000))
        else:
            dtO =  DT.datetime(nD.year, nD.month, nD.day, hour, minute, int(second))
    except:
        return NUM.datetime64("NaT")
    return dtO

def ToSpecificDateType(dateTime, orgFldtype):
    if orgFldtype.type.upper() == "DATE" and orgFldtype.precision == 0:
        if (dateTime.microsecond/1000000)  > 0.5 :
            return DT.datetime(dateTime.year, dateTime.month, dateTime.day,hour=dateTime.hour, minute=dateTime.minute, second=dateTime.second) + DT.timedelta(seconds=1)
        return DT.datetime(dateTime.year, dateTime.month, dateTime.day, hour=dateTime.hour, minute=dateTime.minute, second=dateTime.second) 
    if orgFldtype.type.upper() == "DATEONLY":
        if (dateTime.second + dateTime.microsecond/1000000)  > 43200 :
            return DT.datetime(dateTime.year, dateTime.month, dateTime.day) + DT.timedelta(days=1)
        return DT.datetime(dateTime.year, dateTime.month, dateTime.day)
    if orgFldtype.type.upper() == "TIMEONLY":
        if dateTime.microsecond/1000000 > 0.5:
            return DT.datetime(1899, 12, 30,hour=dateTime.hour, minute=dateTime.minute, second=dateTime.second) + DT.timedelta(seconds=1)
        return DT.datetime(refTime.year, refTime.month, refTime.day,hour=dateTime.hour, minute=dateTime.minute, second=dateTime.second)
    return dateTime

def ToDateOrTimeStr(currentValue, orgFldtype, strFt, precision):
    dateInfo = ToDateTime(currentValue, precision)
    dateInfo = ToSpecificDateType(dateInfo, orgFldtype)
    micro = dateInfo.strftime("%f")[0:3]
    if orgFldtype.type.upper()== "DATE" and orgFldtype.precision == 1:
        return dateInfo.strftime(strFt.replace('%S', fr'%S.{micro}'))
    if orgFldtype.type.upper()== "DATE" and orgFldtype.precision == 0:
        return dateInfo.strftime(strFt)
    if orgFldtype.type.upper() == "DATEONLY":
        return dateInfo.strftime(dateOnlyFormat)
    if orgFldtype.type.upper() == "TIMEONLY":
        return dateInfo.strftime(timeFormat)
    if orgFldtype.type.upper() == "TIMESTAMPOFFSET":
        return dateInfo.strftime(strFt.replace('%S', fr'%S.{micro}'))

def createCandidateFields(dictOutput, baseType = "All", allString= True, precision = 0):
    statFlds = {}
    if allString:
        for stat in dictOutput:
            fieldType = "TEXT"
            name = dictOutput[stat]
            alias = statsKeyAlias[stat]
            checkNull = True
            if stat in statsKey and stat != _key_MiniChart:
                if stat in IntegerColumnsForAlls1 or stat in NumericIntegerColumns:
                    fieldType = "LONG"
                if stat in DoubleColumnsInTextOutput:
                    fieldType = "DOUBLE"
                    nullInt = None

                statFlds[stat] = SSDO.CandidateField(name = name, alias = alias, type = fieldType, data = [], checkNullValues = checkNull )
    else:
        for stat in dictOutput:
            fieldType = "TEXT"
            name = dictOutput[stat]
            alias = statsKeyAlias[stat]
            checkNull = True
            if stat in statsKey and stat != _key_MiniChart:
                if stat in IntegerColumnsForAlls1 or stat in NumericIntegerColumns:
                    fieldType = "LONG"

                elif baseType == "Numeric" and stat in NumericColumns1:
                    fieldType = "DOUBLE"

                elif baseType  == 'Date' and stat in DateTimeColumns1:
                    if stat in [_key_Range]:
                        fieldType = "TEXT"
                        statFlds[stat] = SSDO.CandidateField(name = name, alias = alias, type = fieldType, data = [], checkNullValues = checkNull )
                    else:
                        fieldType = "DATE"
                        statFlds[stat] = SSDO.CandidateField(name = name, alias = alias, type = fieldType, data = [], checkNullValues = checkNull, precision= int(precision))
                    continue

                elif baseType == "Text" and stat in CategoricalColumns1:
                    fieldType = "TEXT"
                elif stat in TextColumnsForAlls1:
                    fieldType = "TEXT"

                statFlds[stat] = SSDO.CandidateField(name = name, alias = alias, type = fieldType, data = [],  checkNullValues = checkNull )
    #ARCPY.AddWarning("keyField:FieldName " +str([(k,statFlds[k].name) for k in statFlds ]))
    return statFlds

def checkZeroCountNull(result, key):
    if result['Count'] == "0" and key not in [_key_FieldName, _key_Alias,_key_FieldType]:
        if key in ['Count','NumberOfNulls']:
            return result[key]
        return "__NULL__"
    else:
        return result[key]

def checkAllSameFreq(result, multilist):
    if "__MultipleList__"  in multilist:
        count = result['Count']
        countM = multilist.split(";")[-1]
        if count == countM:
            return ARCPY.GetIDMessage(220477)
        else:
            return ARCPY.GetIDMessage(220320)
    else:
        return ""

### One percent rule for double values ###
def doubleRule(value, err = 0.01):
    if value in [None, "inf", "-inf", "nan", "", "__NULL__"]:
        return ""
    if  type(value) == int:
        return value
    if  type(value) == float:
        if (value % 1)  == 0:
            return int(value)
        dRoundErr = 0
        nDec = 0
        while True:
            nDec += 1
            dRounded = float(LOCALE.format_string("%.{}f".format(nDec),value))
            dRoundErr = abs((value - dRounded)/value)
            if nDec > 30:
                break
            if dRoundErr < err:
                break
        if nDec > 30:
            return LOCALE.format_string("%.10e".format(30),value)

        return LOCALE.format_string("%.{}f".format(nDec),value)

    return LOCALE.format_string("%.2f",value)

### Return delta time depending on the precision ###
def getRangePretty(timeDelta):
    value = 0
    if timeDelta is None:
        return "__NULL__"
    
    days = timeDelta.days + (timeDelta.seconds+timeDelta.microseconds/1000000.0)/86400.0
    seconds = timeDelta.seconds + timeDelta.microseconds/1000000.0

    if days > 365:
        value = days / 365.0
        message = ARCPY.GetIDMessage(220214)
    elif days > 30:
        value = days / 30.0 
        message = ARCPY.GetIDMessage(220212)
    elif days > 7:
        value = days / 7.0
        message = ARCPY.GetIDMessage(220210)
    elif timeDelta.days >= 1:
        value = days
        message = ARCPY.GetIDMessage(220208)
    elif seconds > 3600:
        value = seconds/3600.0
        message = ARCPY.GetIDMessage(220206)
    elif seconds > 60:
        value = seconds/60.0
        message = ARCPY.GetIDMessage(220204)
    elif seconds >= 1:
        value = seconds
        message = ARCPY.GetIDMessage(220202)
    elif timeDelta.seconds == 0:
        value = 0
        value = timeDelta.microseconds/1000.0
        message = ARCPY.GetIDMessage(220820)
    elif timeDelta.microseconds > 1000:
        value = timeDelta.microseconds/1000.0
        message = ARCPY.GetIDMessage(220820)
    else:
        value = timeDelta.microseconds/1000.0
        message = ARCPY.GetIDMessage(220820)
    return message.format(doubleRule(value))


def updateData(st, statFlds, statsResult, orgFld, stResult, localFormat = None, precision = 0):
    strFt = "%m/%d/%Y %X"
    rDec = False
    if localFormat is not None:
        strFt, rDec = localFormat
        
    currentValue = checkZeroCountNull(statsResult,stResult)
    if st in statFlds:
        deltaStr = None
        ### Support Pretty Range for Date and Time ###
        if st.upper() in [_key_Range] and orgFld.type.upper() in ["DATE", "DATEONLY", "TIMEONLY", "TIMESTAMPOFFSET"]:
            if  currentValue  in  [ "", "__NULL__"]:
                statFlds[st].data.append("")
                return
            date = refTime
            try:
                date = ToDateTime(currentValue, precision)
                date = ToSpecificDateType(date, orgFld)
            except:
                pass
            delta =  date - refTime
            deltaStr = getRangePretty(delta)
            statFlds[st].data.append(deltaStr)
            return
        if statFlds[st].type == "TEXT":
            if deltaStr is not None:
                statFlds[st].data.append(deltaStr)
            if "__Multiple__" == currentValue:
                statFlds[st].data.append(ARCPY.GetIDMessage(220320))
            if "__MultipleList__" in currentValue:
                val = checkAllSameFreq(statsResult, currentValue)
                statFlds[st].data.append(val)
            elif "__NULL__" == currentValue:
                statFlds[st].data.append(None)
            else:
                if st.upper() in DateTimeColumns1 and orgFld.type.upper() in ["DATE", "DATEONLY", "TIMEONLY", "TIMESTAMPOFFSET"]:
                    date = ""
                    try:
                        if orgFld.type.upper() == "DATE" and precision == 0:
                            date = ToDateTime(currentValue, precision)
                            date = ToSpecificDateType(date, orgFld)
                            date = date.strftime(strFt)
                        else:
                            date = ToDateOrTimeStr(currentValue, orgFld, strFt, precision)
                    except:
                        pass
                    statFlds[st].data.append(date)
                else:
                    if orgFld.type.upper() not in ["STRING", "TEXT"]:
                        if rDec:
                            statFlds[st].data.append(currentValue.replace(".",","))
                        else:
                            statFlds[st].data.append(currentValue)
                    else:
                        statFlds[st].data.append(currentValue)

        if statFlds[st].type == "LONG":
            if  currentValue  in  [ "", "__NULL__", "__Multiple__"] or "__MultipleList__" in currentValue:
                statFlds[st].data.append(minInt)
            else:
                statFlds[st].data.append(int(currentValue))

        if statFlds[st].type == "BIGINTEGER":
            if  currentValue  in  [ "", "__NULL__", "__Multiple__"] or "__MultipleList__" in currentValue:
                statFlds[st].data.append(minInt)
            else:
                statFlds[st].data.append(int(currentValue))

        if statFlds[st].type == "DOUBLE":
            if currentValue  in  [ "", "__NULL__", "__Multiple__"]:
                statFlds[st].data.append(NUM.nan)
            elif "__MultipleList__" in currentValue:
                statFlds[st].data.append(NUM.nan)
            elif  statsResult[stResult] == "inf":
                statFlds[st].data.append(NUM.inf)
            elif  statsResult[stResult] == "-inf":
                statFlds[st].data.append(NUM.NINF)
            elif statsResult[stResult] == "-nan(ind)":
                statFlds[st].data.append(NUM.nan)
            else:
                statFlds[st].data.append(float(currentValue))
        if statFlds[st].type in ["DATE", "DATEONLY", "TIMEONLY", "TIMESTAMPOFFSET"]:
            if  currentValue  in  [ "", "__NULL__", "__Multiple__"] or "__MultipleList__" in currentValue:
                 statFlds[st].data.append(NUM.datetime64('NaT'))
            else:
                date = ToDateTime(currentValue, precision)
                date = ToSpecificDateType(date, orgFld)
                statFlds[st].data.append(date)

def createOutput(data, flds, outputAll, dictOutput, groupByField, baseType="All", allString = False, localFormat = None, datePrecision = 0):
    isGDB, typeW = isDB(outputAll)
    baseLoc = "en_US.UTF-8"
    LOCALE.setlocale(LOCALE.LC_ALL, baseLoc)
    #try:
    if groupByField is None:
        nRec = len(data)
        ### Create candidate Fields ####
        statFlds = createCandidateFields(dictOutput, baseType, allString, datePrecision)

        for fldName in data:
            if fldName not in flds:
                continue

            statsResult = data[fldName]

            orgFld = flds[fldName]
            statsResult[_key_Alias]= orgFld.aliasName
            statsResult[_key_FieldName]= orgFld.name
            statsResult[_key_FieldType]= getType(orgFld)

            for stResult in statsResult:
                st = resultkeyInternalKey[stResult]
                updateData(st,statFlds,statsResult, orgFld, stResult, localFormat, datePrecision)

    candidateFieldGroupBy = None
    
    if groupByField is not None:
        grpName = groupByField.name
        grpAlias = groupByField.aliasName + " (Group By)"
        precision = groupByField.precision
        if not isGDB:
            name = groupByField.name
            
            if len(name) >10:
                name = name[0:10]
              
            grpName = name
    
        data1 = data
        nRec = len(data1)
        ### Create candidate Fields ####
        statFlds = createCandidateFields(dictOutput, baseType, allString, datePrecision)

        candidateFieldGroupBy =  SSDO.CandidateField(name = grpName, 
                                       alias = grpAlias, 
                                       type = UTILS.convertType[groupByField.type], data = [],
                                       precision = precision)

        listCats = list(data.keys())
        typeF = ['SHORT', 'LONG', 'FLOAT', 'DOUBLE'] 
        if candidateFieldGroupBy.type in ['SHORT', 'LONG', 'BIGINTEGER']:
            listCats = list(map(int, listCats))
            listCats.sort()
        if candidateFieldGroupBy.type in ['FLOAT','DOUBLE']:
            listCats = list(map(float, listCats))
            listCats.sort()
        listCats = list(map(str, listCats))

        for category in listCats:
            data1 = data[category]

            for fldName in data1:
                if fldName not in flds:
                    continue

                if candidateFieldGroupBy.type in ["LONG", "SHORT", "BIGINTEGER"]:
                    candidateFieldGroupBy.data.append(int(category))
                if candidateFieldGroupBy.type == "TEXT":
                    candidateFieldGroupBy.data.append(category)
                if candidateFieldGroupBy.type in ["DATE", "DATEONLY", "TIMEONLY", "TIMESTAMPOFFSET"]:
                    date = ToDateTime(category, precision)
                    date = ToSpecificDateType(date, groupByField)
                    candidateFieldGroupBy.data.append(date)
                if candidateFieldGroupBy.type == "DOUBLE":
                    candidateFieldGroupBy.data.append(float(category))

                statsResult = data1[fldName]
                orgFld = flds[fldName]
                statsResult[_key_Alias]= orgFld.aliasName
                statsResult[_key_FieldName]= orgFld.name
                statsResult[_key_FieldType]= getType(orgFld)

                for stResult in statsResult:
                    st = resultkeyInternalKey[stResult]
                    updateData(st,statFlds,statsResult, orgFld, stResult, localFormat, datePrecision)

    for st in statFlds:
        
        if statFlds[st].type == "TEXT":
            try:
                size = NUM.max(NUM.array([len(e) for e in statFlds[st].data if e is not None]))
                statFlds[st].data = NUM.array(statFlds[st].data)
            except:
                statFlds[st].data = NUM.array(statFlds[st].data)
                size = 25
            statFlds[st].length = int(size)

        if statFlds[st].type == "BIGINTEGER":
            statFlds[st].data = NUM.array(statFlds[st].data, dtype = NUM.int64)
        if statFlds[st].type == "LONG":
            statFlds[st].data = NUM.array(statFlds[st].data, dtype = NUM.int32)
        if statFlds[st].type == "DOUBLE":
            statFlds[st].data = NUM.array(statFlds[st].data, dtype = NUM.float64)
        if statFlds[st].type == "DATE":
            if datePrecision == 1:
                statFlds[st].data = NUM.array(statFlds[st].data, dtype ='datetime64[ms]') 
            else:
                statFlds[st].data = NUM.array(statFlds[st].data, dtype ='datetime64[s]') 
        if statFlds[st].type == "TIMEONLY":
            statFlds[st].data = NUM.array(statFlds[st].data, dtype = 'datetime64[s]')
        if statFlds[st].type == "DATEONLY":
            statFlds[st].data = NUM.array(statFlds[st].data, dtype = 'datetime64[s]')
        if statFlds[st].type == "TIMESTAMPOFFSET":
            statFlds[st].data = NUM.array(statFlds[st].data, dtype = 'datetime64[ms]')

    lstCFOutput = []
    if groupByField is not None:
        if candidateFieldGroupBy.type == "TEXT":
           size = NUM.max(NUM.array([len(e) for e in candidateFieldGroupBy.data]))
           candidateFieldGroupBy.data = NUM.array(candidateFieldGroupBy.data, dtype = '<U'+str(size))
           candidateFieldGroupBy.length = int(size)
        if candidateFieldGroupBy.type in ["SHORT", "LONG"]:
            candidateFieldGroupBy.data = NUM.array(candidateFieldGroupBy.data, dtype = NUM.int32)
        if candidateFieldGroupBy.type in ["BIGINTEGER"]:
            candidateFieldGroupBy.data = NUM.array(candidateFieldGroupBy.data, dtype = NUM.int64)
        if candidateFieldGroupBy.type == "DOUBLE":
            candidateFieldGroupBy.data = NUM.array(candidateFieldGroupBy.data, dtype = float)
        if candidateFieldGroupBy.type == "DATE":
            if precision == 1:
                candidateFieldGroupBy.data = NUM.array(candidateFieldGroupBy.data, dtype = 'datetime64[ms]')
            else:
                candidateFieldGroupBy.data = NUM.array(candidateFieldGroupBy.data, dtype = 'datetime64[s]')
        if candidateFieldGroupBy.type == "TIMEONLY":
            candidateFieldGroupBy.data = NUM.array(candidateFieldGroupBy.data, dtype = 'datetime64[s]')
        if candidateFieldGroupBy.type == "DATEONLY":
            candidateFieldGroupBy.data = NUM.array(candidateFieldGroupBy.data, dtype = 'datetime64[s]')
        if candidateFieldGroupBy.type == "TIMESTAMPOFFSET":
            candidateFieldGroupBy.data = NUM.array(candidateFieldGroupBy.data, dtype = 'datetime64[ms]')

        lstCFOutput.append(candidateFieldGroupBy)

    for st in statFlds:
        lstCFOutput.append(statFlds[st])

    container = UTILS.DataContainer()
    
    if len(lstCFOutput) == 0:
        LOCALE.setlocale(LOCALE.LC_ALL, '')
        return False
    #ARCPY.AddWarning(fr" {outputAll} {str([ [f.name,f.precision, f.type] for f in lstCFOutput if f.type.upper() == 'DATE'])}")

    container.generateOutput(outputAll, lstCFOutput)
    #except:
    LOCALE.setlocale(LOCALE.LC_ALL, '')
    return True

def strTime():
    info = refTime2.strftime("%X")

    found = False
    needP = False
    for e in [("10", "%I"),("22", "%H"), ("24","%M"),("35","%S")]:
        if e[0] in info:
            found = True
            info = info.replace(e[0],e[1])
            if e[1] =="%I":
                needP = True
    foundA = False
    for e in ("a.m.", "p.m.","a. m.", "p. m.","am","pm", "a.m", "p.m","Pm","Am","AM","PM","A.M", \
              "P.M","下午", "вечера","e.m","午後", "Bin", "rano", \
              "sou", "上午","午前","صباحا","я"):
        if e in info:
            info = info.replace(e,"%p")        
            foundA = True
            
    if needP and not foundA and found:
        info = "%X"

    if not found:
        info = "%X"

    return info

def getFormatString():
    global timeFormat
    month = "%m"
    day = "%d"
    year = "%Y"
    strF = refTime.strftime("%x")
    strT = strTime()
    dateOnlyFormat = strF.replace(str(refTime.year),year).replace(str(refTime.month),month).replace(str(refTime.day),day)
    timeFormat = strT
    return dateOnlyFormat, (strF.replace(str(refTime.year),year).replace(str(refTime.month),month).replace(str(refTime.day),day)+ " "+strT , "," in  LOCALE.format_string("%.1f",0.5))
    
# run the script
if __name__ == '__main__':
    parameters = arcpy.GetParameterInfo()
    if len(parameters) == 0:
        ARCPY.AddError("Please run the tool Field Statistics to Table")

    dateOnlyFormat, localFormat = getFormatString()

    #ARCPY.AddMessage("=None,".join([str(i.name) for i in parameters]))
    #ARCPY.AddMessage(",".join([str(i.name) for i in parameters]))
    #### User Defined Inputs ####

    inputData = parameters[0].value
    fields = parameters[1].valueAsText
    workspace =  parameters[2].valueAsText
    outputTables = parameters[3].value
    groupBy = parameters[4].valueAsText
    outputStats = parameters[5].value 
    outputNumeric = parameters[6].valueAsText
    outputText = parameters[7].valueAsText
    outputDate = parameters[8].valueAsText
    outputAll = parameters[9].valueAsText

    exportNumeric = False
    exportDate = False
    exportText = False
    exportAll = False

    if outputNumeric not in ["#","", None]:
        UTILS.checkOutputPath(outputNumeric, "TABLE")
        exportNumeric = True
    if outputDate not in ["#","", None]:
        UTILS.checkOutputPath(outputDate, "TABLE")
        exportDate = True
    if outputText not in ["#","", None]:
        UTILS.checkOutputPath(outputText, "TABLE")
        exportText = True
    if outputAll not in ["#","", None]:
        UTILS.checkOutputPath(outputAll, "TABLE")
        exportAll = True

    dictOutput ={}
    nDictOutput = {}
    tDictOutput = {}
    dDictOutput = {}
    
    isGDB, typeW = isDB(workspace.upper())

    isOracle = False
    #### Check SDE /Oracle ####
    if workspace not in ["", None]:
        des= ARCPY.Describe(workspace)
        try:
            isOracle = "SDE:ORACLE" in des.connectionProperties.instance.upper()
        except:
            pass

    dictOldKeys = {"INTERQUARTILERANGE":"IQR",
                   "NULLS": "NUMBEROFNULLS",
                   "NUMBEROFUNIQUEVALUES":"NUMBERUNIQUEVALUES"}

    if outputStats is not None:
        outStaV = []
        for row in outputStats:
            if row[0] in dictOldKeys:
                outStaV.append([dictOldKeys[row[0]], row[1]])
            else:
                outStaV.append(row)
        outputStats = outStaV

    selectedStats = False
    if outputStats in ["", "#", None]:
        dictOutput = statsKey if isGDB else statsShort
        #### Replace Mode -> Mode_ when SDE-> Oracle ####
        if isOracle:
            dictOutput[_key_Mode] = "Mode_"

        for ele in dictOutput:
            if ele in TextColumnsForAlls1:
                nDictOutput[ele] = dictOutput[ele]
                tDictOutput[ele] = dictOutput[ele]
                dDictOutput[ele] = dictOutput[ele]
            if ele in IntegerColumnsForAlls1:
                nDictOutput[ele] = dictOutput[ele]
                tDictOutput[ele] = dictOutput[ele]
                dDictOutput[ele] = dictOutput[ele]
            if ele in NumericIntegerColumns:
                nDictOutput[ele] = dictOutput[ele]
            if ele in NumericColumns1:
                nDictOutput[ele] = dictOutput[ele]
            if ele in CategoricalColumns1:
                tDictOutput[ele] = dictOutput[ele]
            if ele in DateTimeColumns1:
                dDictOutput[ele] = dictOutput[ele]
    else:
        selectedStats = True

        #### Check/rename field names ####
        dictInput  = {ele[0]: ele[1] for ele in outputStats}
        dictInput = UTILS.CheckFieldNames(dictInput, None, shortField = not isGDB, allowOverwriteFields = False)
        outputStats = [(e, dictInput[e]) for e in dictInput]

        for ele in outputStats:
            key = ele[0]
            value = ele[1]
            dictOutput[key] = ele[1]

            if key in TextColumnsForAlls1:
                nDictOutput[key] = value
                tDictOutput[key] = value
                dDictOutput[key] = value
            if key in IntegerColumnsForAlls1:
                nDictOutput[key] = value
                tDictOutput[key] = value
                dDictOutput[key] = value
            if key in NumericIntegerColumns:
                nDictOutput[key] = value
            if  key in NumericColumns1:
                nDictOutput[key] = value
            if key in CategoricalColumns1:
                tDictOutput[key] = value
            if key in DateTimeColumns1:
                dDictOutput[key] = value

    def orderDict(outputStats,dictInfo,allowedFields):

        if outputStats and len(dictInfo):
            return {stxFld[0]: dictInfo[stxFld[0]] for stxFld in outputStats if stxFld[0] in dictInfo}
        else:
            if len(dictInfo):
                return {stxFld: dictInfo[stxFld] for stxFld in dictInfo if stxFld in allowedFields }
            else:
                return dictInfo

    fieldsList = [] 
    #### Read general info ###
    desc = ARCPY.Describe(inputData)
    allFields = {fld.name.upper():fld for fld in desc.fields}

    groupByField = None
    
    if groupBy not in ["", "#",None]:
        if groupBy.upper() in allFields:
            groupByField = allFields[groupBy.upper()]
        else:
            ARCPY.AddIDMessage("ERROR", 87954, groupBy)
            raise SystemExit()

    flds = {}
    nFlds = {}
    tFlds = {}
    dFlds = {}
    levelsDate = []
    precision = 0
    for fldName in fields.split(";"):
        if fldName.upper() in allFields:
            flds[fldName] = allFields[fldName.upper()]
            fieldsList.append(fldName)
            if allFields[fldName.upper()].type.upper() in ["TEXT", "STRING"]:
                tFlds[fldName] = allFields[fldName.upper()]
            elif allFields[fldName.upper()].type.upper() in ["DATE", "TIMEONLY", "DATEONLY", "TIMESTAMPOFFSET"]:
                levelsDate.append((allFields[fldName.upper()].type, allFields[fldName.upper()].precision))
                dFlds[fldName] = allFields[fldName.upper()]
            else:
                nFlds[fldName] = allFields[fldName.upper()]

    for dateInfo in levelsDate:
        if "TIMESTAMPOFFSET" == dateInfo[0].upper():
            precision = 1
            break
        if "DATE" == dateInfo[0].upper() and dateInfo[1] == 1:
            precision  = 1
            break

    allowedFields= set()

    for e in statsKey:
        if len(tFlds) > 0:
           if e in TextColumnsComplete and exportText:
               allowedFields.add(e)
        if len(nFlds) > 0 and exportNumeric:
           if e in NumericColumnsComplete:
               allowedFields.add(e) 
        if len(dFlds) > 0  and exportDate:
           if e  in DateColumnsComplete:
               allowedFields.add(e)
        if len(dFlds) > 0  and exportAll:
            allowedFields.add(e)

    nDictOutput = orderDict(outputStats, nDictOutput, allowedFields)
    tDictOutput = orderDict(outputStats, tDictOutput, allowedFields)
    dDictOutput = orderDict(outputStats, dDictOutput, allowedFields)
    dictOutput = orderDict(outputStats, dictOutput, allowedFields)

    #### Read Table ####
    obj = ARC._ss.StatisticsReader(inputData, fieldsList)

    if obj is None:
        ARCPY.AddError("")
        raise SystemExit()

    #### Main Function ####
    info = None
    if groupByField is None:
        #### Calculate Stats ####
        info = obj.get_stats()
    else:
        #### Calculate Stats using Group By ####
        outpS = obj.get_stats_groupby([groupBy])
        if outpS is not None:
            info, nullInGroupBy = outpS
            if int(nullInGroupBy) > 0 and type(info) == str:
                ARCPY.AddIDMessage("WARNING", 110445, nullInGroupBy)
            if int(nullInGroupBy) > 0 and type(info) == int:
                ARCPY.AddIDMessage("ERROR", 110411, groupBy)
                raise SystemExit()

    if info is None:
        ARCPY.AddIDMessage("ERROR", 80365)
        raise SystemExit()

    #### Cancel Operation ####
    if type(info) in [bool, int] and not info:
        ARCPY.AddIDMessage("ERROR", 80365)
        raise SystemExit()

    data = JSON.loads(info.encode("utf-8"), strict=False)

    ### The categories in the group by are localized, the internal function only accepts en_US.UTF-8 ###
    if groupByField is not None and groupByField.type.upper() in ["DATE", "TIMEONLY", "DATEONLY", "TIMESTAMPOFFSET"] and localFormat[1]:
        dataInfo = {}
        for category in data:
           dataInfo[category.replace(",",".")]= data[category]  
        data = dataInfo

    nRequested = 0
    nDone =[]
  
    if exportAll:
        nRequested += 1
        done = createOutput(data, flds, outputAll, dictOutput, groupByField, "All", True, localFormat, datePrecision = precision)
        nDone.append(done)

        if done is not None:
            if not done and selectedStats:
                ARCPY.AddIDMessage("WARNING", 110418, outputAll)

    if exportNumeric:
        nRequested += 1
        done = createOutput(data, nFlds, outputNumeric, nDictOutput, groupByField, "Numeric")
        nDone.append(done)

        if done is not None:
            if not done and selectedStats:
                ARCPY.AddIDMessage("WARNING", 110418, outputNumeric)

    if exportText:
        nRequested += 1
        done = createOutput(data, tFlds, outputText, tDictOutput, groupByField, "Text")
        nDone.append(done)

        if done is not None:
            if not done and selectedStats:
                ARCPY.AddIDMessage("WARNING", 110418, outputText)

    if exportDate:
        nRequested += 1
        done = createOutput(data, dFlds, outputDate, dDictOutput, groupByField, "Date", datePrecision = precision)
        nDone.append(done)

        if done is not None:
            if not done and selectedStats:
                ARCPY.AddIDMessage("WARNING", 110418, outputDate)

