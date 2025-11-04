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
Contains the implementation of the HorizontalFactor classes.
"""

from . import CompoundParameter


__all__ = ["HfBinary", "HfForward", "HfLinear", "HfInverseLinear", "HfTable"]


class HorizontalFactor(CompoundParameter._CompoundParameter):
    def __init__(self, keyword):
        CompoundParameter._CompoundParameter.__init__(self, keyword)


class HfBinary(HorizontalFactor):
    """HfBinary({zeroFactor}, {cutAngle})

    Create an HfBinary object.

    Arguments:
    zeroFactor -- Zero factor
    cutAngle -- Cut angle
    """

    __esri_toolinfo__ = ["Double:::", "Double:::"]

    def __init__(self, zeroFactor=None, cutAngle=None):
        HorizontalFactor.__init__(self, "BINARY")
        self.zeroFactor = zeroFactor
        self.cutAngle = cutAngle

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.zeroFactor, self.cutAngle]
        )

    def __repr__(self):
        return self._toRepresentation([self.zeroFactor, self.cutAngle])


HfBinary._addProperty("zeroFactor", 1.0)
HfBinary._addProperty("cutAngle", 45.0)


class HfForward(HorizontalFactor):
    """HfForward({zeroFactor}, {sideValue})

    Create an HfForward object.

    Arguments:
    zeroFactor -- Zero factor
    sideValue -- Side value
    """

    __esri_toolinfo__ = ["Double:::", "Double:::"]

    def __init__(self, zeroFactor=None, sideValue=None):
        HorizontalFactor.__init__(self, "FORWARD")
        self.zeroFactor = zeroFactor
        self.sideValue = sideValue

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.zeroFactor, self.sideValue]
        )

    def __repr__(self):
        return self._toRepresentation([self.zeroFactor, self.sideValue])


HfForward._addProperty("zeroFactor", 0.5)
HfForward._addProperty("sideValue", 1.0)


class HfLinear(HorizontalFactor):
    """HfLinear({zeroFactor}, {cutAngle}, {slope})

    Create an HfLinear object.

    Arguments:
    zeroFactor -- Zero factor
    cutAngle -- Cut angle
    slope -- Slope
    """

    __esri_toolinfo__ = ["Double:::", "Double:::", "Double:::"]

    def __init__(self, zeroFactor=None, cutAngle=None, slope=None):
        HorizontalFactor.__init__(self, "LINEAR")
        self.zeroFactor = zeroFactor
        self.cutAngle = cutAngle
        self.slope = slope

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.zeroFactor, self.cutAngle, self.slope]
        )

    def __repr__(self):
        return self._toRepresentation([self.zeroFactor, self.cutAngle, self.slope])


HfLinear._addProperty("zeroFactor", 0.5)
HfLinear._addProperty("cutAngle", 181.0)
HfLinear._addProperty("slope", 0.011111)


class HfInverseLinear(HorizontalFactor):
    """HfInverseLinear({zeroFactor}, {cutAngle}, {slope})

    Create an HfInverseLinear object.

    Arguments:
    zeroFactor -- Zero factor
    cutAngle -- Cut angle
    slope -- Slope
    """

    __esri_toolinfo__ = ["Double:::", "Double:::", "Double:::"]

    def __init__(self, zeroFactor=None, cutAngle=None, slope=None):
        HorizontalFactor.__init__(self, "INVERSE_LINEAR")
        self.zeroFactor = zeroFactor
        self.cutAngle = cutAngle
        self.slope = slope

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.zeroFactor, self.cutAngle, self.slope]
        )

    def __repr__(self):
        return self._toRepresentation([self.zeroFactor, self.cutAngle, self.slope])


HfInverseLinear._addProperty("zeroFactor", 2.0)
HfInverseLinear._addProperty("cutAngle", 180.0)
HfInverseLinear._addProperty("slope", -0.011111)


class HfTable(HorizontalFactor):
    """HfTable(inTable)

    Create an HfTable object.

    Arguments:
    inTable -- Table name
    """

    __esri_toolinfo__ = ["DEFile:::"]

    def __init__(self, inTable):
        HorizontalFactor.__init__(self, "TABLE")
        self.inTable = inTable

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.inTable]
        )

    def __repr__(self):
        return self._toRepresentation([self.inTable])


HfTable._addProperty("inTable")
