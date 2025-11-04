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
Contains the implementation of the Neighborhood classes.
"""

from . import CompoundParameter


__all__ = [
    "NbrAnnulus",
    "NbrCircle",
    "NbrIrregular",
    "NbrRectangle",
    "NbrWedge",
    "NbrWeight",
]


class Neighborhood(CompoundParameter._CompoundParameter):
    """Base class for specialized neighborhood classes."""

    def __init__(self, keyword):
        """Creates a Neighborhood object.

        keyword -- Keyword associated with the neighborhood.
        """
        CompoundParameter._CompoundParameter.__init__(self, keyword)


class NbrAnnulus(Neighborhood):
    """NbrAnnulus({innerRadius}, {outerRadius}, {CELL|MAP})

    Create an NbrAnnulus object.

    Arguments:
    innerRadius -- Inner radius
    outerRadius -- Outer radius
    units -- Units
    """

    __esri_toolinfo__ = ["Double:::", "Double:::", "String::CELL|MAP:"]

    def __init__(self, innerRadius=None, outerRadius=None, units=None):
        Neighborhood.__init__(self, "ANNULUS")
        self.innerRadius = innerRadius
        self.outerRadius = outerRadius
        self.units = units

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.innerRadius, self.outerRadius, self.units]
        )

    def __repr__(self):
        return self._toRepresentation([self.innerRadius, self.outerRadius, self.units])


NbrAnnulus._addProperty("innerRadius", 1.0)
NbrAnnulus._addProperty("outerRadius", 3.0)
NbrAnnulus._addProperty("units", "CELL")


class NbrCircle(Neighborhood):
    """NbrCircle({radius}, {CELL|MAP})

    Create an NbrCircle object.

    Arguments:
    radius -- Radius
    units -- Units
    """

    __esri_toolinfo__ = ["Double:::", "String::CELL|MAP:"]

    def __init__(self, radius=None, units=None):
        Neighborhood.__init__(self, "CIRCLE")
        self.radius = radius
        self.units = units

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.radius, self.units]
        )

    def __repr__(self):
        return self._toRepresentation([self.radius, self.units])


NbrCircle._addProperty("radius", 3.0)
NbrCircle._addProperty("units", "CELL")


class NbrIrregular(Neighborhood):
    """NbrIrregular(inKernelFile)

    Create an NbrIrregular object.

    Arguments:
    inKernelFile -- Kernel file
    """

    __esri_toolinfo__ = ["DEFile:::"]

    def __init__(self, inKernelFile):
        Neighborhood.__init__(self, "IRREGULAR")
        self.inKernelFile = inKernelFile

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.inKernelFile]
        )

    def __repr__(self):
        return self._toRepresentation([self.inKernelFile])


NbrIrregular._addProperty("inKernelFile")


class NbrRectangle(Neighborhood):
    """NbrRectangle({width}, {height}, {CELL|MAP})

    Create an NbrRectangle object.

    Arguments:
    width -- Width
    height -- Height
    units -- Units
    """

    __esri_toolinfo__ = ["Double:::", "Double:::", "String::CELL|MAP:"]

    def __init__(self, width=None, height=None, units=None):
        Neighborhood.__init__(self, "RECTANGLE")
        self.width = width
        self.height = height
        self.units = units

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.width, self.height, self.units]
        )

    def __repr__(self):
        return self._toRepresentation([self.width, self.height, self.units])


NbrRectangle._addProperty("width", 3.0)
NbrRectangle._addProperty("height", 3.0)
NbrRectangle._addProperty("units", "CELL")


class NbrWedge(Neighborhood):
    """NbrWedge({radius}, {startAngle}, {endAngle}, {CELL|MAP})

    Create an NbrWedge object.

    Arguments:
    radius -- Radius
    startAngle -- Start angle
    endAngle -- End angle
    units -- Units
    """

    __esri_toolinfo__ = ["Double:::", "Double:::", "Double:::", "String::CELL|MAP:"]

    def __init__(self, radius=None, startAngle=None, endAngle=None, units=None):
        Neighborhood.__init__(self, "WEDGE")
        self.radius = radius
        self.startAngle = startAngle
        self.endAngle = endAngle
        self.units = units

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.radius, self.startAngle, self.endAngle, self.units]
        )

    def __repr__(self):
        return self._toRepresentation(
            [self.radius, self.startAngle, self.endAngle, self.units]
        )


NbrWedge._addProperty("radius", 3.0)
NbrWedge._addProperty("startAngle", 0.0)
NbrWedge._addProperty("endAngle", 90.0)
NbrWedge._addProperty("units", "CELL")


class NbrWeight(Neighborhood):
    """NbrWeight(inKernelFile)

    Create an NbrWeight object.

    Arguments:
    inKernelFile -- Kernel file
    """

    __esri_toolinfo__ = ["DEFile:::"]

    def __init__(self, inKernelFile):
        Neighborhood.__init__(self, "WEIGHT")
        self.inKernelFile = inKernelFile

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.inKernelFile]
        )

    def __repr__(self):
        return self._toRepresentation([self.inKernelFile])


NbrWeight._addProperty("inKernelFile")
