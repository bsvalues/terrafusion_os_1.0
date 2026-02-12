#COPYRIGHT 2018 ESRI
#
#TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
#Unpublished material - all rights reserved under the
#Copyright Laws of the United States.
#
#For additional information, contact:
#Environmental Systems Research Institute, Inc.
#Attn: Contracts Dept
#380 New York Street
#Redlands, California, USA 92373
#
#email: contracts@esri.com

"""
Contains implementation of the Time classes.
"""

import datetime

from . import CompoundParameter


__all__ = ["TimeWithinDay", "TimeSpecialDays", "TimeMultipleDays", "TimeWholeYear"]


class Time(CompoundParameter._CompoundParameter):
    def __init__(self, keyword):
        CompoundParameter._CompoundParameter.__init__(self, keyword)


class TimeWithinDay(Time):
    """TimeWithinDay({day}, {startTime}, {endTime})

    Create a TimeWithinDay object.

    Arguments:
    day -- Julian day
    startTime -- Start time
    endTime -- End time
    """

    __esri_toolinfo__ = ["Long:::", "Double:::", "Double:::"]

    def __init__(self, day=None, startTime=None, endTime=None):
        Time.__init__(self, "WITHINDAY")
        self.day = day
        self.startTime = startTime
        self.endTime = endTime

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.day, self.startTime, self.endTime]
        )

    def __repr__(self):
        return self._toRepresentation([self.day, self.startTime, self.endTime])


TimeWithinDay._addProperty("day", 183)
TimeWithinDay._addProperty("startTime", 0.0)
TimeWithinDay._addProperty("endTime", 24.0)


class TimeSpecialDays(Time):
    """TimeSpecialDays()

    Create a TimeSpecialDays object.
    """

    __esri_toolinfo__ = []

    def __init__(self):
        Time.__init__(self, "SPECIALDAYS")

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString([self._keyword])

    def __repr__(self):
        return self._toRepresentation([])


class TimeMultipleDays(Time):
    """TimeMultipleDays({year}, {startDay}, {endDay})

    Create a TimeMultipleDays object.

    Arguments:
    year -- Year
    startDay -- Start day
    endDay -- End day
    """

    __esri_toolinfo__ = ["Long:::", "Long:::", "Long:::"]

    def __init__(self, year=None, startDay=None, endDay=None):
        Time.__init__(self, "MULTIDAYS")
        self.year = year
        self.startDay = startDay
        self.endDay = endDay

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.year, self.startDay, self.endDay]
        )

    def __repr__(self):
        return self._toRepresentation([self.year, self.startDay, self.endDay])


TimeMultipleDays._addProperty("year", datetime.date.today().year)
TimeMultipleDays._addProperty("startDay", 5)
TimeMultipleDays._addProperty("endDay", 160)


class TimeWholeYear(Time):
    """TimeWholeYear({year})

    Create a TimeWholeYear object.

    Arguments:
    year -- Year
    """

    __esri_toolinfo__ = ["Long:::"]

    def __init__(self, year=None):
        Time.__init__(self, "WHOLEYEAR")
        self.year = year

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.year]
        )

    def __repr__(self):
        return self._toRepresentation([self.year])


TimeWholeYear._addProperty("year", datetime.date.today().year)
