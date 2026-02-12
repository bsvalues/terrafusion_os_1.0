# coding: utf-8
"""
Source Name: SSTimeUtilities.py
Version: ArcGIS 10.1
Author: ESRI

A series of functions that help work with time in ArcGIS.
"""

################### Imports ########################
from __future__ import division
import operator as OP
import sys as SYS
import os as OS
import locale as LOCALE
import numpy as NUM
import random as PYRAND
import arcgisscripting as ARC
import arcpy as ARCPY
import ErrorUtils as ERROR
import SSUtilities as UTILS
import datetime as DT
import calendar as CAL
import Stats as STATS

########################## Constants #############################
gaTime = DT.datetime(1899, 12, 30, 0, 0, 0)

lastDays = {1:31, 2:28, 3:31, 4:30, 5:31, 6:30,
            7:31, 8:31, 9:30, 10:31, 11:30, 12:31}

supportTime = ["SECONDS", "MINUTES", "HOURS", "DAYS", "WEEKS", "MONTHS",
               "YEARS"]

######################### General Functions ###########################

def getTimeBreakSeconds(startTimes, endTimes):
    #### Gets Time Delta in Float Seconds for Given Start/End Times ####
    allTimes = [startTimes[0]] + [i for i in endTimes]
    timeArray = NUM.array(allTimes, dtype = 'datetime64[s]')
    firstStartStr = dateTime2String(startTimes[0])
    timeBreakSec = (timeArray - timeArray[0]) / NUM.timedelta64(1, 's')
    return NUM.array(timeBreakSec[:-1], dtype = float)

def getUnevenTimeSpans(timeData, timeValue, timeType):
    upperType = timeType.upper()
    if timeType == "MONTHS":
        months = timeValue
        years = 0
    else:
        months = 0
        years = timeValue

    n = len(timeData)
    startDT = NUM.empty(n, dtype = timeData.dtype)
    endDT = NUM.empty(n, dtype = timeData.dtype)

    for ind in range(n):
        startDT[ind] = unitAdd(timeData.item(ind), months = -months, years = -years)
        endDT[ind] = unitAdd(timeData.item(ind), months = months, years = years)

    return startDT, endDT

def convert2DateTime(dtString):
    """
    Utility function to convert datetime string to datetime object

    INPUT:
        dtString (str): "%Y-%m-%d %H:%M:%S" formatted string

    OUTPUT:
        dtObject (obj): Converted datetime object

    """
    try:
        return DT.datetime.strptime(dtString, "%Y-%m-%d %H:%M:%S")
    except:
        return None

def dateTime2String(dtObject, localize = False):
    """
    Utility function to convert datetime object to datetime string

    INPUT:
        dtObject (obj): Datetime object

    OUTPUT:
        dtString (str): Datetime string in "%Y-%m-%d %H:%M:%S" format

    """
    try:
        return dtObject.strftime('%Y-%m-%d %H:%M:%S')
    except:
        return None

def aggregationBias(timeBreaks, minDataTime, maxDataTime):
    startBinWidth = (timeBreaks[1] - timeBreaks[0]).total_seconds()
    startTimeWidth = (timeBreaks[1] - minDataTime).total_seconds()
    startBias = (1.0 - (startTimeWidth / startBinWidth))* 100

    endBinWidth = (timeBreaks[-1] - timeBreaks[-2]).total_seconds()
    endTimeWidth = (maxDataTime - timeBreaks[-2]).total_seconds()
    endBias = (1.0 - (endTimeWidth / endBinWidth)) * 100

    return startBias, endBias

def prettyTime(timeString, localizeUnit=False):
    timeValue, timeUnit = timeString.split()
    timeUnit = timeUnit.title()
    if int(timeValue) == 1:
        if timeUnit[-1] == 's':
            timeUnit = timeUnit[:-1]
    else:
        if timeUnit[-1] != 's':
            timeUnit += 's'

    if timeUnit.lower() in UTILS.localizableUnit and localizeUnit:
        return UTILS.localizableUnit[timeUnit.lower()].format(timeValue)
    else:
        return "{0} {1}".format(timeValue, timeUnit)

def calculateTimeWindow(timeStamp, timeValue, timeType):

    if "MONTH" in timeType:
        time0 = unitAdd(timeStamp, months = -timeValue)
        time1 = unitAdd(timeStamp, months = timeValue)
    else:
        time0 = unitAdd(timeStamp, years = -timeValue)
        time1 = unitAdd(timeStamp, years = timeValue)

    return time0, time1

def isTimeNeighbor(startDT, endDT, candidateDT):
    if candidateDT >= startDT and candidateDT <= endDT:
        return True
    else:
        return False

def getForecastTimes(cube, addTime = 1):
    upperTime = cube.timeUnit.upper()
    forecastTimes = []

    for i in range(1, addTime + 1):
        time2Add = cube.timeSize * i
        if upperTime == "YEARS":
            endTime = unitAdd(cube.lastEndTime, years = time2Add)
        elif upperTime == "MONTHS":
            endTime = unitAdd(cube.lastEndTime, months = time2Add)
        elif upperTime == "WEEKS":
            endTime = unitAdd(cube.lastEndTime, weeks = time2Add)
        elif upperTime == "DAYS":
            endTime = unitAdd(cube.lastEndTime, days = time2Add)
        elif upperTime == "HOURS":
            endTime = unitAdd(cube.lastEndTime, hours = time2Add)
        elif upperTime == "MINUTES":
            endTime = unitAdd(cube.lastEndTime, minutes = time2Add)
        else:
            endTime = unitAdd(cube.lastEndTime, seconds = time2Add)
        forecastTimes.append(endTime)

    return forecastTimes

def getAllForecastTimes(cube, addTime = 1):
    upperTime = cube.timeUnit.upper()
    forecastTime = cube.numTime + addTime
    firstEndTime = cube.firstEndTime

    forecastTimes = []

    for i in range(-1, forecastTime):
        time2Add = cube.timeSize * i
        if upperTime == "YEARS":
            endTime = unitAdd(firstEndTime, years=time2Add)
        elif upperTime == "MONTHS":
            endTime = unitAdd(firstEndTime, months=time2Add)
        elif upperTime == "WEEKS":
            endTime = unitAdd(firstEndTime, weeks=time2Add)
        elif upperTime == "DAYS":
            endTime = unitAdd(firstEndTime, days=time2Add)
        elif upperTime == "HOURS":
            endTime = unitAdd(firstEndTime, hours=time2Add)
        elif upperTime == "MINUTES":
            endTime = unitAdd(firstEndTime, minutes=time2Add)
        else:
            endTime = unitAdd(firstEndTime, seconds=time2Add)
        forecastTimes.append(endTime)

    return forecastTimes

def getForecastTimesFromDataset(dataset, addTime=1):
    upperTime = dataset.time_unit.upper()
    lastEndTime = convert2DateTime(dataset.last_end_time)

    forecastTimes = []
    for i in range(1, addTime + 1):
        time2Add = int(dataset.time_size) * i
        if upperTime == "YEARS":
            endTime = unitAdd(lastEndTime, years=time2Add)
        elif upperTime == "MONTHS":
            endTime = unitAdd(lastEndTime, months=time2Add)
        elif upperTime == "WEEKS":
            endTime = unitAdd(lastEndTime, weeks=time2Add)
        elif upperTime == "DAYS":
            endTime = unitAdd(lastEndTime, days=time2Add)
        elif upperTime == "HOURS":
            endTime = unitAdd(lastEndTime, hours=time2Add)
        elif upperTime == "MINUTES":
            endTime = unitAdd(lastEndTime, minutes=time2Add)
        else:
            endTime = unitAdd(lastEndTime, seconds=time2Add)
        forecastTimes.append(endTime)

    return forecastTimes

def unitAdd(inDateTime, seconds = 0, minutes = 0, hours = 0,
            days = 0, weeks = 0, months = 0, years = 0):

    #### Weeks Through Seconds ####
    timeDelta = DT.timedelta(seconds = seconds, minutes = minutes,
                             hours = hours, days = days, weeks = weeks)
    inDateTime = inDateTime + timeDelta
    #### Calculate Months ####
    if months:
        cmonth = inDateTime.month + months
        year = inDateTime.year
        if cmonth > 12:
            year += cmonth // 12
            cmonth %= 12
            if cmonth == 0:
                year -= 1
                cmonth = 12
        elif cmonth < 1:
            year += (cmonth - 1) // 12
            cmonth = cmonth % 12
            if cmonth == 0:
                cmonth = 12
        end_date = monthConvert(cmonth, year)
        if inDateTime.day > end_date:
            inDateTime = inDateTime.replace(day = end_date, month = cmonth, year = year)
        else:
            inDateTime = inDateTime.replace(month = cmonth, year = year)


    #### Calculate Years ####
    if years:
        month = inDateTime.month
        year = inDateTime.year
        end_date = monthConvert(month, year+years)
        if inDateTime.day > end_date:
            inDateTime = inDateTime.replace(day = end_date,
                            year = inDateTime.year + years)
        else:
            inDateTime = inDateTime.replace(year = inDateTime.year + years)

    return inDateTime

def monthConvert(month, year):
    if month == 2 and CAL.isleap(year):
        return 29
    else:
        return lastDays[month]

def getStartRefTime(refStartTime, dataStartTime, timeType, timeValue):
    if refStartTime <= dataStartTime:
        return refStartTime
    else:
        if "SECOND" in timeType:
            seconds = timeValue
            months = 0
            years = 0
        elif "MONTH" in timeType:
            months = timeValue
            years = 0
            seconds = 0
        else:
            years = timeValue
            seconds = 0
            months = 0
        flag = True
        c = 1
        diffTime = refStartTime
        while flag:
            diffTime = unitAdd(refStartTime, seconds = -(c * seconds),
                           months = -(c * months),
                           years = -(c * years))
            if diffTime <= dataStartTime:
                flag = False
            else:
                c += 1
        return diffTime

def getEndRefTime(refEndTime, dataEndTime, timeType, timeValue):
    if refEndTime >= dataEndTime:
        return refEndTime
    else:
        if "SECOND" in timeType:
            seconds = timeValue
            months = 0
            years = 0
        elif "MONTH" in timeType:
            months = timeValue
            years = 0
            seconds = 0
        else:
            years = timeValue
            seconds = 0
            months = 0
        flag = True
        c = 1
        diffTime = refEndTime
        while flag:
            diffTime = unitAdd(refEndTime, seconds = c * seconds,
                           months = c * months,
                           years = c * years)
            if diffTime >= dataEndTime:
                flag = False
            else:
                c += 1
        return diffTime

def startTimeBreaks(startTime, endTime, seconds = 0,
                    months = 0, years = 0, isRefTime = False):
    #### Set Operator for Comparison ####
    if isRefTime:
        #### Greater Than Right Side of Each Time Bin ####
        opFun = OP.ge
    else:
        #### Greater Than or Equal to Right Side of Each Time Bin
        opFun = OP.gt

    breaks = []
    flag = True
    c = 0
    while flag:
        diffTime = unitAdd(startTime, seconds = c * seconds,
                           months = c * months,
                           years = c * years)
        breaks.append(diffTime)
        if opFun(diffTime, endTime):
            flag = False
        else:
            c += 1
    return breaks

def endTimeBreaks(endTime, startTime, seconds = 0,
                  months = 0, years = 0, isRefTime = False):
    #### Set Operator for Comparison ####
    if isRefTime:
        #### Less Than Right Side of Each Time Bin ####
        opFun = OP.le
    else:
        #### Less Than or Equal to Right Side of Each Time Bin
        opFun = OP.lt

    breaks = []
    flag = True
    c = 0
    while flag:
        diffTime = unitAdd(endTime, seconds = -(c * seconds),
                           months = -(c * months),
                           years = -(c * years))
        breaks.append(diffTime)
        if opFun(diffTime, startTime):
            flag = False
        else:
            c += 1
    return list(reversed(breaks))

def createTimeBreaks(timeData, timeValue, timeType,
                     refType = "END_TIME", refTime = None,
                     refStartTime = None, refEndTime = None):
    dataStartTime = timeData.min().item()
    dataEndTime = timeData.max().item()
    if "SECOND" in timeType:
        seconds = timeValue
        months = 0
        years = 0
    elif "MONTH" in timeType:
        months = timeValue
        years = 0
        seconds = 0
    else:
        years = timeValue
        seconds = 0
        months = 0
    if refTime:
        if refTime <= dataStartTime:
            return "START_TIME", startTimeBreaks(refTime, dataEndTime,
                                                 seconds = seconds, months = months, 
                                                 years = years)
        elif refTime >= dataEndTime:
            return "END_TIME", endTimeBreaks(refTime, dataStartTime,
                                             seconds = seconds, months = months, 
                                             years = years)
        else:
            refTime = getEndRefTime(refTime, dataEndTime, timeType, timeValue)
            return "END_TIME", endTimeBreaks(refTime, dataStartTime,
                                             seconds = seconds, months = months, 
                                             years = years)
    else:
        if refStartTime is not None and refEndTime is not None:
            if refType == "START_TIME":
                endTime = max(refEndTime, dataEndTime)
                if refEndTime > dataEndTime:
                    isRefTime = True
                else:
                    isRefTime = False
                refStartTime = getStartRefTime(refStartTime, dataStartTime, timeType, timeValue)
                return "START_TIME", startTimeBreaks(refStartTime, endTime,
                                                     seconds = seconds, months = months, 
                                                     years = years, isRefTime = isRefTime)
            else:
                startTime = min(refStartTime, dataStartTime)
                if refStartTime < dataStartTime:
                    isRefTime = True
                else:
                    isRefTime = False
                refEndTime = getEndRefTime(refEndTime, dataEndTime, timeType, timeValue)
                return "END_TIME", endTimeBreaks(refEndTime, startTime,
                                                 seconds = seconds, months = months, 
                                                 years = years, isRefTime = isRefTime)
        else:
            if refType == "START_TIME":
                return "START_TIME", startTimeBreaks(dataStartTime, dataEndTime,
                                                     seconds = seconds, months = months, 
                                                     years = years)
            else:
                return "END_TIME", endTimeBreaks(dataEndTime, dataStartTime,
                                                 seconds = seconds, months = months, 
                                                 years = years)

def binTimeData(timeData, timeBreaks, isStartTime = False):
    n = len(timeData)
    bins = NUM.zeros((n,), dtype = NUM.int32)
    sortTimeInds = timeData.argsort()

    #### Set Operator for Comparison ####
    if isStartTime:
        #### Less Than Right Side of Each Time Bin ####
        opFun = OP.lt
    else:
        #### Less Than or Equal to Right Side of Each Time Bin
        opFun = OP.le

    #### Assign Time Bins to All Locations
    c = 1
    for ind in sortTimeInds:
        timeVal = timeData.item(ind)
        flag = True
        while flag:
            if opFun(timeVal, timeBreaks[c]):
                bins[ind] = c - 1
                flag = False
            else:
                c += 1

    return bins

def timeExtentRounder(seconds):
    """Rounds given default temporal span in seconds into nearest meaningful
    block."""

    if seconds < 10:
        ARCPY.AddIDMessage("ERROR", 110037)
        raise SystemExit()
    elif seconds < 100:
        #### Less Than 100 Seconds = 1 second ####
        return 1, "1 Second"
    elif seconds < 300:
        #### Less Than 5 Minutes = 10 seconds
        return 10, "10 Seconds"
    elif seconds < 900:
        #### Less Than 15 Minutes = 30 Seconds
        return 30, "30 Seconds"
    elif seconds < 3600:
        #### Less Than 1 Hour = 1 Minute
        return 60, "1 Minute"
    elif seconds < 21600:
        #### Less Than 6 Hours = 5 Minutes
        return 300, "5 Minutes"
    elif seconds < 43200:
        #### Less Than 12 Hours = 30 Minutes
        return 1800, "30 Minutes"
    elif seconds < 86400:
        #### Less Than 1 Day = 1 Hour
        return 3600, "1 Hour"
    elif seconds < 259200:
        #### Less Than 3 Days = 2 Hours
        return 7200, "2 Hours"
    elif seconds < 864000:
        #### Less Than 10 Days = 6 Hours
        return 21600, "6 Hours"
    elif seconds < 7776000:
        #### Less Than 90 Days = 1 Day
        return 86400, "1 Day"
    elif seconds < 31536000:
        #### Less Than 1 Year = 1 Week
        return 604800, "1 Week"
    else:
        #### Round to Year or Months
        return decideMonthlyYearly(seconds)

def histogramBreaks(timeData, minNumBreaks = 10, maxNumBreaks = 100, stepSize = 5):
    startTime = timeData.min()
    endTime = timeData.max()
    timeExtent = endTime - startTime
    extentDelta = timeExtent / NUM.timedelta64(1, 's')
    extentDelta = int(extentDelta.item())
    tempDelta = (timeData - startTime) / NUM.timedelta64(1, 's')
    numBreaks = NUM.arange(minNumBreaks, maxNumBreaks + stepSize, stepSize)
    numResults = len(numBreaks)
    trials = NUM.zeros((numResults,), float)
    for ind, numBreak in enumerate(numBreaks):
        timeDelta = (timeExtent / numBreak) / NUM.timedelta64(1, 's')
        timeDelta = createTimeDelta(int(timeDelta.item()), "SECONDS")
        tempBins = NUM.array( tempDelta / int(timeDelta), dtype = 'int32')
        uniqueBins = STATS.uniqueCounts(tempBins)
        meanBins = uniqueBins.mean()
        varBins = ((uniqueBins - meanBins)**2.0).sum() / (len(uniqueBins) * 1.0)
        delta = extentDelta / numBreak * 1.0
        result = ((2.0 * meanBins) - varBins) / (delta**2.0)
        trials[ind] = result

    minFunIndex = trials.argmin()
    return numBreaks[minFunIndex]

def checkMinNumBreaks(totalSeconds, breakSeconds, numBreaks = 10):
    tempBreaks = int(totalSeconds / breakSeconds)
    return tempBreaks > (numBreaks - 1)

def prettyReturn(breakValue, breakType):
    if breakValue > 1:
        breakType += "s"
    return "{0} {1}".format(breakValue, breakType)

def chooseBreak(totalSeconds, breakSeconds, cutoffs, numBreaks = 10):
    nearestInd = int((abs(cutoffs - breakSeconds)).argmin())
    flag = True
    while flag:
        try:
            currentBreak = int(cutoffs[nearestInd])
            if checkMinNumBreaks(totalSeconds, currentBreak, numBreaks = numBreaks):
                flag = False
            else:
                nearestInd = nearestInd - 1
        except:
            nearestInd = 0
            flag = False

    seconds = cutoffs[nearestInd]
    indexValue = nearestInd
    return seconds, indexValue

def defaultTimeBreakInfo(totalSeconds, numBreaks):
    """Rounds given default temporal span in seconds into nearest meaningful
    block."""

    breakSeconds = int(totalSeconds / numBreaks)

    if totalSeconds < 10:
        ARCPY.AddIDMessage("ERROR", 110037)
        raise SystemExit()

    if breakSeconds < 60:
        #### Seconds ####
        multiple = 1
        cutoffs = NUM.array([1,2,3,5,6,10,12,15,20,30,60])
        secondCutoffs = cutoffs * multiple
        seconds, indexValue = chooseBreak(totalSeconds, breakSeconds, secondCutoffs)
        largerUnits = cutoffs[indexValue]
        lastCutoff = secondCutoffs[-1]
        if seconds == lastCutoff:
            return cutoffs[-1], "1 Minute"
        else:
            return seconds, prettyReturn(largerUnits, "Second")

    if breakSeconds < 3600:
        #### Minutes ####
        multiple = 60
        cutoffs = NUM.array([1,2,3,5,6,10,12,15,20,30,60])
        secondCutoffs = cutoffs * multiple
        seconds, indexValue = chooseBreak(totalSeconds, breakSeconds, secondCutoffs)
        largerUnits = cutoffs[indexValue]
        lastCutoff = secondCutoffs[-1]
        if seconds == lastCutoff:
            return cutoffs[-1], "1 Hour"
        else:
            return seconds, prettyReturn(largerUnits, "Minute")

    if breakSeconds < 86400:
        #### Hours ####
        multiple = 60 * 60
        cutoffs = NUM.array([1,2,3,4,6,8,12,24])
        secondCutoffs = cutoffs * multiple
        seconds, indexValue = chooseBreak(totalSeconds, breakSeconds, secondCutoffs)
        largerUnits = cutoffs[indexValue]
        lastCutoff = secondCutoffs[-1]
        if seconds == lastCutoff:
            return cutoffs[-1], "1 Day"
        else:
            return seconds, prettyReturn(largerUnits, "Hour")

    if breakSeconds < 604800:
        #### Days ####
        multiple = 60 * 60 * 24
        cutoffs = NUM.array([1,2,3,4,5,6,7])
        secondCutoffs = cutoffs * multiple
        seconds, indexValue = chooseBreak(totalSeconds, breakSeconds, secondCutoffs)
        largerUnits = cutoffs[indexValue]
        lastCutoff = secondCutoffs[-1]
        if seconds == lastCutoff:
            return cutoffs[-1], "1 Week"
        else:
            return seconds, prettyReturn(largerUnits, "Day")

    if breakSeconds < 2419200:
        #### Weeks ####
        multiple = 60 * 60 * 24 * 7
        cutoffs = NUM.array([1,2,3,4])
        secondCutoffs = cutoffs * multiple
        seconds, indexValue = chooseBreak(totalSeconds, breakSeconds, secondCutoffs)
        largerUnits = cutoffs[indexValue]
        lastCutoff = secondCutoffs[-1]
        if seconds == lastCutoff:
            return cutoffs[-1], "1 Month"
        else:
            return seconds, prettyReturn(largerUnits, "Week")

    if breakSeconds < 29030400:
        #### Months ####
        multiple = 60 * 60 * 24 * 7 * 4
        cutoffs = NUM.array([1,2,3,4,6,12])
        secondCutoffs = cutoffs * multiple
        seconds, indexValue = chooseBreak(totalSeconds, breakSeconds, secondCutoffs,
                                          numBreaks = 12)
        largerUnits = cutoffs[indexValue]
        lastCutoff = secondCutoffs[-1]
        if seconds == lastCutoff:
            return cutoffs[-1], "1 Year"
        else:
            return seconds, prettyReturn(largerUnits, "Month")

    else:
        #### Years ####
        multiple = 60 * 60 * 24 * 7 * 4 * 12
        cutoffs = NUM.array([1,2,4,5,10,25,50,100])
        secondCutoffs = cutoffs * multiple
        seconds, indexValue = chooseBreak(totalSeconds, breakSeconds, secondCutoffs,
                                          numBreaks = 12)
        largerUnits = cutoffs[indexValue]
        lastCutoff = secondCutoffs[-1]
        return seconds, prettyReturn(largerUnits, "Year")

def decideMonthlyYearly(seconds):
    if seconds > 315360001:
        return "YEARS", "1 Year"
    else:
        return "MONTHS", "1 Month"

def createTimeDelta(timeValue, timeType):
    if "SECOND" in timeType:
        timeDelta = DT.timedelta(seconds = timeValue)
    elif "MINUTE" in timeType:
        timeDelta = DT.timedelta(minutes = timeValue)
    elif "HOUR" in timeType:
        timeDelta = DT.timedelta(hours = timeValue)
    elif "DAY" in timeType:
        timeDelta = DT.timedelta(days = timeValue)
    elif "WEEK" in timeType:
        timeDelta = DT.timedelta(weeks = timeValue)
    elif "MONTH" in timeType:
        timeDelta = DT.timedelta(days = timeValue * 30)
    else:
        timeDelta = DT.timedelta(days = timeValue * 365)

    return NUM.timedelta64(int(timeDelta.total_seconds()), 's')

def gaDiff2DateTime(dateDiff):
    return gaTime + DT.timedelta(days = dateDiff)

################ Cube Support Functions ################

def getFirstLastTimeSteps(timeCounts, timeBreaks, returnStr = True, 
                          secondChange = None):
        timeInds = timeCounts.nonzero()[0]
        if len(timeInds):
            minTimeInd = timeInds.min()
            maxTimeInd = timeInds.max()
            firstStartTime = timeBreaks[minTimeInd]
            firstEndTime = timeBreaks[minTimeInd + 1]
            lastStartTime = timeBreaks[maxTimeInd]
            lastEndTime = timeBreaks[maxTimeInd + 1]
            if secondChange is not None:
                s = DT.timedelta(seconds = 1)
                if secondChange == "STARTTIME":
                    firstEndTime = firstEndTime - s
                    lastEndTime = lastEndTime - s
                else:
                    firstStartTime = firstStartTime + s
                    lastStartTime = lastStartTime + s
            if returnStr:
                firstStartTime = firstStartTime.strftime('%Y-%m-%d %H:%M:%S')
                firstEndTime = firstEndTime.strftime('%Y-%m-%d %H:%M:%S')
                lastStartTime = lastStartTime.strftime('%Y-%m-%d %H:%M:%S')
                lastEndTime = lastEndTime.strftime('%Y-%m-%d %H:%M:%S')
            return firstStartTime, firstEndTime, lastStartTime, lastEndTime
        else:
            if returnStr:
                return "None", "None", "None", "None"
            else:
                return None, None, None, None

def getKeyTimeSteps(timeCounts, timeBreaks, minimum = True, secondChange = None):
        timeSum = timeCounts.sum()
        if timeSum:
            if minimum:
                timeInd = timeCounts[1:].argmin() + 1
            else:
                timeInd = timeCounts.argmax()
            timeVal = timeCounts[timeInd]
            startTime = timeBreaks[timeInd]
            endTime = timeBreaks[timeInd + 1]
            if secondChange is not None:
                s = DT.timedelta(seconds = 1)
                if secondChange == "STARTTIME":
                    endTime = endTime - s
                else:
                    startTime = startTime + s
            startTime = startTime.strftime('%Y-%m-%d %H:%M:%S')
            endTime = endTime.strftime('%Y-%m-%d %H:%M:%S')
            return timeVal, startTime, endTime
        else:
            return "None", "None", "None"

def addUnit(dateTimeInfo, timeSize, timeUnit):
    selectUnit = {"SECOND":"seconds", "MINUTE":"minutes", "HOUR":"hours",
                   "DAY":"days", "WEEK":"weeks", "MONTH":"months", "YEAR":"years"}
    unit = timeUnit[:-1].upper() if timeUnit.upper()[-1] == "S" else timeUnit.upper()
    unitValid = {"inDateTime":dateTimeInfo, selectUnit[unit]:int(timeSize)}
    return  unitAdd(**unitValid)

def computeTimeSubsetID(cube, subsetStartTime = None, subsetEndTime = None,
                        dropBinStart = None, dropBinEnd = None):

    #### Get Original Start and End Times ####
    startTimes, endTimes = cube.getOutputTimeFieldInfo(exact = False)
    nTimes = len(startTimes)

    #### Get Time Indices To Keep ####
    timeIndStart = [True] * nTimes
    timeIndEnd = [True] * nTimes

    #### Subset with DT ####
    if subsetStartTime is not None:
        timeIndStart = [t >= subsetStartTime for t in endTimes]
    if subsetEndTime is not None:
        timeIndEnd = [t <= subsetEndTime for t in startTimes]
    #### Subset with ID ####
    if subsetStartTime is None and subsetEndTime is None:
        timeInd = [True] * nTimes
        if dropBinStart is not None:
            if dropBinStart > 0:
                timeInd[:dropBinStart] = [False] * dropBinStart
        if dropBinEnd is not None:
            if dropBinEnd > 0:
                timeInd[-dropBinEnd:] = [False] * dropBinEnd
    else:
        #### Subset with DT ####
        timeInd = [all(t) for t in zip(timeIndStart, timeIndEnd)]

    startTimes, endTimes = cube.getOutputTimeFieldInfo(exact = True)
    newStartTimes = [time for ind, time in zip(timeInd, startTimes) if ind]
    newEndTimes = [time for ind, time in zip(timeInd, endTimes) if ind]

    return timeInd, newStartTimes, newEndTimes

def getDT(times):
    dt = [(times[i+1] - times[i]).total_seconds() for i in range(len(times) - 1)]
    return dt

def gp2DateTime(dtString, format = 'datetime'):
    """
    Utility function to convert datetime string to datetime object

    INPUT:
        dtString (str): "%Y-%m-%d %H:%M:%S" formatted string

    OUTPUT:
        dtObject (obj): Converted datetime object

    """
    try:
        if format.upper() == 'DATETIME':
            return DT.datetime.strptime(dtString, "%c")
        elif format.upper() == 'DATE':
            return DT.datetime.strptime(dtString, "%x")
    except:
        return None