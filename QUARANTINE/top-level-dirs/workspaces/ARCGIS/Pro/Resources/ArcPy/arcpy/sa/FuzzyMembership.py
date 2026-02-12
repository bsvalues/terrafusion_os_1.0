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
Contains the implementation of the FuzzyMembership classes.
"""

from . import CompoundParameter


__all__ = [
    "FuzzyGaussian",
    "FuzzyLarge",
    "FuzzyLinear",
    "FuzzyMSLarge",
    "FuzzyMSSmall",
    "FuzzyNear",
    "FuzzySmall",
]


class FuzzyMembership(CompoundParameter._CompoundParameter):
    def __init__(self, keyword):
        CompoundParameter._CompoundParameter.__init__(self, keyword)


class FuzzyGaussian(FuzzyMembership):
    """FuzzyGaussian({midpoint}, {spread})

    Create a FuzzyGaussian object.

    Arguments:
    midpoint -- Midpoint
    spread -- Spread
    """

    __esri_toolinfo__ = ["Point:::", "Double:::"]

    def __init__(self, midpoint=None, spread=None):
        FuzzyMembership.__init__(self, "GAUSSIAN")
        self.midpoint = midpoint
        self.spread = spread

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.midpoint, self.spread]
        )

    def __repr__(self):
        return self._toRepresentation([self.midpoint, self.spread])


FuzzyGaussian._addProperty("midpoint")
FuzzyGaussian._addProperty("spread", 0.1)


class FuzzyLarge(FuzzyMembership):
    """FuzzyLarge({midpoint}, {spread})

    Create a FuzzyLarge object.

    Arguments:
    midpoint -- Midpoint
    spread -- Spread
    """

    __esri_toolinfo__ = ["Point:::", "Double:::"]

    def __init__(self, midpoint=None, spread=None):
        FuzzyMembership.__init__(self, "LARGE")
        self.midpoint = midpoint
        self.spread = spread

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.midpoint, self.spread]
        )

    def __repr__(self):
        return self._toRepresentation([self.midpoint, self.spread])


FuzzyLarge._addProperty("midpoint")
FuzzyLarge._addProperty("spread", 5.0)


class FuzzyLinear(FuzzyMembership):
    """FuzzyLinear({min}, {max})

    Create a FuzzyLinear object.

    Arguments:
    min -- Minimum
    max -- Maximum
    """

    __esri_toolinfo__ = ["Double:::", "Double:::"]

    def __init__(self, min=None, max=None):
        FuzzyMembership.__init__(self, "LINEAR")
        self.min = min
        self.max = max

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.min, self.max]
        )

    def __repr__(self):
        return self._toRepresentation([self.min, self.max])


FuzzyLinear._addProperty("min")
FuzzyLinear._addProperty("max")


class FuzzyMSLarge(FuzzyMembership):
    """FuzzyMSLarge({meanMultiplier}, {STDMultiplier})

    Create an FuzzyMSLarge object.

    Arguments:
    meanMultiplier -- Mean multiplier
    STDMultiplier -- Standard multiplier
    """

    __esri_toolinfo__ = ["Double:::", "Double:::"]

    def __init__(self, meanMultiplier=None, STDMultiplier=None):
        FuzzyMembership.__init__(self, "MSLARGE")
        self.meanMultiplier = meanMultiplier
        self.STDMultiplier = STDMultiplier

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.meanMultiplier, self.STDMultiplier]
        )

    def __repr__(self):
        return self._toRepresentation([self.meanMultiplier, self.STDMultiplier])


FuzzyMSLarge._addProperty("meanMultiplier", 1.0)
FuzzyMSLarge._addProperty("STDMultiplier", 1.0)


class FuzzyMSSmall(FuzzyMembership):
    """FuzzyMSSmall({meanMultiplier}, {STDMultiplier})

    Create an FuzzyMSSmall object.

    Arguments:
    meanMultiplier -- Mean multiplier
    STDMultiplier -- Standard multiplier
    """

    __esri_toolinfo__ = ["Double:::", "Double:::"]

    def __init__(self, meanMultiplier=None, STDMultiplier=None):
        FuzzyMembership.__init__(self, "MSSMALL")
        self.meanMultiplier = meanMultiplier
        self.STDMultiplier = STDMultiplier

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.meanMultiplier, self.STDMultiplier]
        )

    def __repr__(self):
        return self._toRepresentation([self.meanMultiplier, self.STDMultiplier])


FuzzyMSSmall._addProperty("meanMultiplier", 1.0)
FuzzyMSSmall._addProperty("STDMultiplier", 1.0)


class FuzzyNear(FuzzyMembership):
    """FuzzyNear({midpoint}, {spread})

    Create a FuzzyNear object.

    Arguments:
    midpoint -- Midpoint
    spread -- Spread
    """

    __esri_toolinfo__ = ["Point:::", "Double:::"]

    def __init__(self, midpoint=None, spread=None):
        FuzzyMembership.__init__(self, "NEAR")
        self.midpoint = midpoint
        self.spread = spread

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.midpoint, self.spread]
        )

    def __repr__(self):
        return self._toRepresentation([self.midpoint, self.spread])


FuzzyNear._addProperty("midpoint")
FuzzyNear._addProperty("spread", 0.1)


class FuzzySmall(FuzzyMembership):
    """FuzzySmall({midpoint}, {spread})

    Create a FuzzySmall object.

    Arguments:
    midpoint -- Midpoint
    spread -- Spread
    """

    __esri_toolinfo__ = ["Point:::", "Double:::"]

    def __init__(self, midpoint=None, spread=None):
        FuzzyMembership.__init__(self, "SMALL")
        self.midpoint = midpoint
        self.spread = spread

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [self._keyword, self.midpoint, self.spread]
        )

    def __repr__(self):
        return self._toRepresentation([self.midpoint, self.spread])


FuzzySmall._addProperty("midpoint")
FuzzySmall._addProperty("spread", 5.0)
