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
Contains the implementation of the VerticalFactor classes.
"""

from . import CompoundParameter


__all__ = [
    "VfBinary",
    "VfLinear",
    "VfInverseLinear",
    "VfSymLinear",
    "VfSymInverseLinear",
    "VfCos",
    "VfSec",
    "VfCosSec",
    "VfSecCos",
    "VfTable",
    "VfHikingTime",
    "VfBidirHikingTime",
]


class VerticalFactor(CompoundParameter._CompoundParameter):
    def __init__(self, keyword):
        CompoundParameter._CompoundParameter.__init__(self, keyword)


class VfBinary(VerticalFactor):
    """VfBinary({zeroFactor}, {lowCutAngle}, {highCutAngle})

    Create a VfBinary object.

    Arguments:
    zeroFactor -- Zero factor
    lowCutAngle -- Low cut angle
    highCutAngle -- High cut angle
    """

    __esri_toolinfo__ = ["Double:::", "Double:::", "Double:::"]

    def __init__(self, zeroFactor=None, lowCutAngle=None, highCutAngle=None):
        VerticalFactor.__init__(self, "BINARY")
        self.zeroFactor = zeroFactor
        self.lowCutAngle = lowCutAngle
        self.highCutAngle = highCutAngle

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.zeroFactor, self.lowCutAngle, self.highCutAngle]
        )

    def __repr__(self):
        return self._toRepresentation(
            [self.zeroFactor, self.lowCutAngle, self.highCutAngle]
        )


VfBinary._addProperty("zeroFactor", 1.0)
VfBinary._addProperty("lowCutAngle", -30.0)
VfBinary._addProperty("highCutAngle", 30.0)


class VfLinear(VerticalFactor):
    """VfLinear({zeroFactor}, {lowCutAngle}, {highCutAngle}, {slope})

    Create a VfLinear object.

    Arguments:
    zeroFactor -- Zero factor
    lowCutAngle -- Low cut angle
    highCutAngle -- High cut angle
    slope -- Slope
    """

    __esri_toolinfo__ = ["Double:::", "Double:::", "Double:::", "Double:::"]

    def __init__(
        self, zeroFactor=None, lowCutAngle=None, highCutAngle=None, slope=None
    ):
        VerticalFactor.__init__(self, "LINEAR")
        self.zeroFactor = zeroFactor
        self.lowCutAngle = lowCutAngle
        self.highCutAngle = highCutAngle
        self.slope = slope

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [
                self._keyword,
                self.zeroFactor,
                self.lowCutAngle,
                self.highCutAngle,
                self.slope,
            ]
        )

    def __repr__(self):
        return self._toRepresentation(
            [self.zeroFactor, self.lowCutAngle, self.highCutAngle, self.slope]
        )


VfLinear._addProperty("zeroFactor", 1.0)
VfLinear._addProperty("lowCutAngle", -90.0)
VfLinear._addProperty("highCutAngle", 90.0)
VfLinear._addProperty("slope", 0.011111)


class VfInverseLinear(VerticalFactor):
    """VfInverseLinear({zeroFactor}, {lowCutAngle}, {highCutAngle}, {slope})

    Create a VfInverseLinear object.

    Arguments:
    zeroFactor -- Zero factor
    lowCutAngle -- Low cut angle
    highCutAngle -- High cut angle
    slope -- Slope
    """

    __esri_toolinfo__ = ["Double:::", "Double:::", "Double:::", "Double:::"]

    def __init__(
        self, zeroFactor=None, lowCutAngle=None, highCutAngle=None, slope=None
    ):
        VerticalFactor.__init__(self, "INVERSE_LINEAR")
        self.zeroFactor = zeroFactor
        self.lowCutAngle = lowCutAngle
        self.highCutAngle = highCutAngle
        self.slope = slope

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [
                self._keyword,
                self.zeroFactor,
                self.lowCutAngle,
                self.highCutAngle,
                self.slope,
            ]
        )

    def __repr__(self):
        return self._toRepresentation(
            [self.zeroFactor, self.lowCutAngle, self.highCutAngle, self.slope]
        )


VfInverseLinear._addProperty("zeroFactor", 1.0)
VfInverseLinear._addProperty("lowCutAngle", -45.0)
VfInverseLinear._addProperty("highCutAngle", 45.0)
VfInverseLinear._addProperty("slope", -0.022222)


class VfSymLinear(VerticalFactor):
    """VfSymLinear({zeroFactor}, {lowCutAngle}, {highCutAngle}, {slope})

    Create a VfSymLinear object.

    Arguments:
    zeroFactor -- Zero factor
    lowCutAngle -- Low cut angle
    highCutAngle -- High cut angle
    slope -- Slope
    """

    __esri_toolinfo__ = ["Double:::", "Double:::", "Double:::", "Double:::"]

    def __init__(
        self, zeroFactor=1.0, lowCutAngle=-90.0, highCutAngle=90.0, slope=0.011111
    ):
        VerticalFactor.__init__(self, "SYM_LINEAR")
        self.zeroFactor = zeroFactor
        self.lowCutAngle = lowCutAngle
        self.highCutAngle = highCutAngle
        self.slope = slope

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [
                self._keyword,
                self.zeroFactor,
                self.lowCutAngle,
                self.highCutAngle,
                self.slope,
            ]
        )

    def __repr__(self):
        return self._toRepresentation(
            [self.zeroFactor, self.lowCutAngle, self.highCutAngle, self.slope]
        )


VfSymLinear._addProperty("zeroFactor", 1.0)
VfSymLinear._addProperty("lowCutAngle", -90.0)
VfSymLinear._addProperty("highCutAngle", 90.0)
VfSymLinear._addProperty("slope", 0.011111)


class VfSymInverseLinear(VerticalFactor):
    """VfSymInverseLinear({zeroFactor}, {lowCutAngle}, {highCutAngle}, {slope})

    Create a VfSymInverseLinear object.

    Arguments:
    zeroFactor -- Zero factor
    lowCutAngle -- Low cut angle
    highCutAngle -- High cut angle
    slope -- Slope
    """

    __esri_toolinfo__ = ["Double:::", "Double:::", "Double:::", "Double:::"]

    def __init__(
        self, zeroFactor=None, lowCutAngle=None, highCutAngle=None, slope=None
    ):
        VerticalFactor.__init__(self, "SYM_INVERSE_LINEAR")
        self.zeroFactor = zeroFactor
        self.lowCutAngle = lowCutAngle
        self.highCutAngle = highCutAngle
        self.slope = slope

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [
                self._keyword,
                self.zeroFactor,
                self.lowCutAngle,
                self.highCutAngle,
                self.slope,
            ]
        )

    def __repr__(self):
        return self._toRepresentation(
            [self.zeroFactor, self.lowCutAngle, self.highCutAngle, self.slope]
        )


VfSymInverseLinear._addProperty("zeroFactor", 1.0)
VfSymInverseLinear._addProperty("lowCutAngle", -45.0)
VfSymInverseLinear._addProperty("highCutAngle", 45.0)
VfSymInverseLinear._addProperty("slope", -0.022222)


class VfCos(VerticalFactor):
    """VfCos({lowCutAngle}, {highCutAngle}, {cosPower})

    Create a VfCos object.

    Arguments:
    lowCutAngle -- Low cut angle
    highCutAngle -- High cut angle
    cosPower -- Cos power
    """

    __esri_toolinfo__ = ["Double:::", "Double:::", "Double:::"]

    def __init__(self, lowCutAngle=None, highCutAngle=None, cosPower=None):
        VerticalFactor.__init__(self, "COS")
        self.lowCutAngle = lowCutAngle
        self.highCutAngle = highCutAngle
        self.cosPower = cosPower

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.lowCutAngle, self.highCutAngle, self.cosPower]
        )

    def __repr__(self):
        return self._toRepresentation(
            [self.lowCutAngle, self.highCutAngle, self.cosPower]
        )


VfCos._addProperty("lowCutAngle", -90.0)
VfCos._addProperty("highCutAngle", 90.0)
VfCos._addProperty("cosPower", 1.0)


class VfSec(VerticalFactor):
    """VfSec({lowCutAngle}, {highCutAngle}, {secPower})

    Create a VfSec object.

    Arguments:
    lowCutAngle -- Low cut angle
    highCutAngle -- High cut angle
    secPower -- Sec power
    """

    __esri_toolinfo__ = ["Double:::", "Double:::", "Double:::"]

    def __init__(self, lowCutAngle=None, highCutAngle=None, secPower=None):
        VerticalFactor.__init__(self, "SEC")
        self.lowCutAngle = lowCutAngle
        self.highCutAngle = highCutAngle
        self.secPower = secPower

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.lowCutAngle, self.highCutAngle, self.secPower]
        )

    def __repr__(self):
        return self._toRepresentation(
            [self.lowCutAngle, self.highCutAngle, self.secPower]
        )


VfSec._addProperty("lowCutAngle", -90.0)
VfSec._addProperty("highCutAngle", 90.0)
VfSec._addProperty("secPower", 1.0)


class VfCosSec(VerticalFactor):
    """VfCosSec({lowCutAngle}, {highCutAngle}, {cosPower}, {secPower})

    Create a VfCosSec object.

    Arguments:
    lowCutAngle -- Low cut angle
    highCutAngle -- High cut angle
    cosPower -- Cos power
    secPower -- Sec power
    """

    __esri_toolinfo__ = ["Double:::", "Double:::", "Double:::", "Double:::"]

    def __init__(
        self, lowCutAngle=None, highCutAngle=None, cosPower=None, secPower=None
    ):
        VerticalFactor.__init__(self, "COS_SEC")
        self.lowCutAngle = lowCutAngle
        self.highCutAngle = highCutAngle
        self.cosPower = cosPower
        self.secPower = secPower

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [
                self._keyword,
                self.lowCutAngle,
                self.highCutAngle,
                self.cosPower,
                self.secPower,
            ]
        )

    def __repr__(self):
        return self._toRepresentation(
            [self.lowCutAngle, self.highCutAngle, self.cosPower, self.secPower]
        )


VfCosSec._addProperty("lowCutAngle", -90.0)
VfCosSec._addProperty("highCutAngle", 90.0)
VfCosSec._addProperty("cosPower", 1.0)
VfCosSec._addProperty("secPower", 1.0)


class VfSecCos(VerticalFactor):
    """VfSecCos({lowCutAngle}, {highCutAngle}, {secPower}, {cosPower})

    Create a VfSecCos object.

    Arguments:
    lowCutAngle -- Low cut angle
    highCutAngle -- High cut angle
    secPower -- Sec power
    cosPower -- Cos power
    """

    __esri_toolinfo__ = ["Double:::", "Double:::", "Double:::", "Double:::"]

    def __init__(
        self, lowCutAngle=None, highCutAngle=None, secPower=None, cosPower=None
    ):
        VerticalFactor.__init__(self, "SEC_COS")
        self.lowCutAngle = lowCutAngle
        self.highCutAngle = highCutAngle
        self.secPower = secPower
        self.cosPower = cosPower

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [
                self._keyword,
                self.lowCutAngle,
                self.highCutAngle,
                self.secPower,
                self.cosPower,
            ]
        )

    def __repr__(self):
        return self._toRepresentation(
            [self.lowCutAngle, self.highCutAngle, self.secPower, self.cosPower]
        )


VfSecCos._addProperty("lowCutAngle", -90.0)
VfSecCos._addProperty("highCutAngle", 90.0)
VfSecCos._addProperty("secPower", 1.0)
VfSecCos._addProperty("cosPower", 1.0)


class VfTable(VerticalFactor):
    """VfTable(inTable)

    Create a VfTable object.

    Arguments:
    inTable -- Table name
    """

    __esri_toolinfo__ = ["DEFile:::"]

    def __init__(self, inTable):
        VerticalFactor.__init__(self, "TABLE")
        self.inTable = inTable

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.inTable]
        )

    def __repr__(self):
        return self._toRepresentation([self.inTable])


VfTable._addProperty("inTable")


class VfHikingTime(VerticalFactor):
    """
    VfHikingTime({lowCutAngle}, {highCutAngle})

    Spatial Analyst (ArcPy) class that defines a hiking time vertical factor object.

    Arguments:
    lowCutAngle -- The VRMA degree defining the lower threshold, below which (less than) the VFs are set to infinity.
    highCutAngle -- The VRMA degree defining the upper threshold, beyond which (larger than) the VFs are set to infinity.

    Results:
    A VfHikingTime vertical factor object is returned.
    """

    __esri_toolinfo__ = ['Double:::', 'Double:::']

    def __init__(self, lowCutAngle=None, highCutAngle=None):
        VerticalFactor.__init__(self, "HIKING_TIME")
        self.lowCutAngle = lowCutAngle
        self.highCutAngle = highCutAngle

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString([self._keyword, self.lowCutAngle, self.highCutAngle])

    def __repr__(self):
        return self._toRepresentation([self.lowCutAngle, self.highCutAngle])


VfHikingTime._addProperty("lowCutAngle", -70.0)
VfHikingTime._addProperty("highCutAngle", 70.0)


class VfBidirHikingTime(VerticalFactor):
    """
    VfBidirHikingTime({lowCutAngle}, {highCutAngle})

    Spatial Analyst (ArcPy) class that defines a modified hiking time function that is bidirectional as a vertical factor object.

    Arguments:
    lowCutAngle -- The VRMA degree defining the lower threshold, below which (less than) the VFs are set to infinity.
    highCutAngle -- The VRMA degree defining the upper threshold, beyond which (larger than) the VFs are set to infinity.

    Results:
    A VfBidirHikingTime vertical factor object is returned.
    """

    __esri_toolinfo__ = ['Double:::', 'Double:::']

    def __init__(self, lowCutAngle=None, highCutAngle=None):
        VerticalFactor.__init__(self, "BIDIR_HIKING_TIME")
        self.lowCutAngle = lowCutAngle
        self.highCutAngle = highCutAngle

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString([self._keyword, self.lowCutAngle, self.highCutAngle])

    def __repr__(self):
        return self._toRepresentation([self.lowCutAngle, self.highCutAngle])


VfBidirHikingTime._addProperty("lowCutAngle", -70.0)
VfBidirHikingTime._addProperty("highCutAngle", 70.0)

