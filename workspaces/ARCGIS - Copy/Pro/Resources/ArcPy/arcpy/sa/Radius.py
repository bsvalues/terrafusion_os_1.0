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
Contains the implementation of the Radius classes.
"""

from . import CompoundParameter

__all__ = ["RadiusVariable", "RadiusFixed"]


class Radius(CompoundParameter._CompoundParameter):
    def __init__(self, keyword):
        CompoundParameter._CompoundParameter.__init__(self, keyword)


class RadiusVariable(Radius):
    """RadiusVariable({numberOfPoints}, {maxDistance})

    Create a RadiusVariable object.

    Arguments:
    numberOfPoints -- Number of points
    maxDistance -- Maximum distance
    """

    __esri_toolinfo__ = ["Long:::", "Double:::"]

    def __init__(self, numberOfPoints=None, maxDistance=None):
        Radius.__init__(self, "VARIABLE")
        self.numberOfPoints = numberOfPoints
        self.maxDistance = maxDistance

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.numberOfPoints, self.maxDistance]
        )

    def __repr__(self):
        return self._toRepresentation([self.numberOfPoints, self.maxDistance])


RadiusVariable._addProperty("numberOfPoints", 12)
RadiusVariable._addProperty("maxDistance")


class RadiusFixed(Radius):
    """RadiusFixed({distance}, {minNumberOfPoints})

    Create a RadiusFixed object.

    Arguments:
    distance -- Distance
    minNumberOfPoints -- Minimum number of points
    """

    __esri_toolinfo__ = ["Double:::", "Long:::"]

    def __init__(self, distance=None, minNumberOfPoints=None):
        Radius.__init__(self, "FIXED")
        self.distance = distance
        self.minNumberOfPoints = minNumberOfPoints

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.distance, self.minNumberOfPoints]
        )

    def __repr__(self):
        return self._toRepresentation([self.distance, self.minNumberOfPoints])


RadiusFixed._addProperty("distance")
RadiusFixed._addProperty("minNumberOfPoints", 0)
