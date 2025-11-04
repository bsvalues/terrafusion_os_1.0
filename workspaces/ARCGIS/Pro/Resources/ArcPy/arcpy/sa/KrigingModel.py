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
Contains the implementation of the KrigingModel classes.
"""

from . import CompoundParameter


__all__ = ["KrigingModelOrdinary", "KrigingModelUniversal"]


class KrigingModel(CompoundParameter._CompoundParameter):
    def __init__(self):
        CompoundParameter._CompoundParameter.__init__(self)


class KrigingModelOrdinary(KrigingModel):
    """KrigingModelOrdinary(SPHERICAL|CIRCULAR|EXPONENTIAL|GAUSSIAN|LINEAR, {lagSize}, {majorRange}, {partialSill}, {nugget})

    Create a KrigingModelOrdinary object.

    Arguments:
    semivariogramType -- Semivariogram type
    lagSize -- Lag size
    majorRange -- Major range
    partialSill -- Major range
    nugget -- Nugget
    """

    __esri_toolinfo__ = [
        "String::SPHERICAL|CIRCULAR|EXPONENTIAL|GAUSSIAN|LINEAR:",
        "Double:::",
        "Double:::",
        "Double:::",
        "Double:::",
    ]

    def __init__(
        self,
        semivariogramType=None,
        lagSize=None,
        majorRange=None,
        partialSill=None,
        nugget=None,
    ):
        KrigingModel.__init__(self)
        self.semivariogramType = semivariogramType
        self.lagSize = lagSize
        self.majorRange = majorRange
        self.partialSill = partialSill
        self.nugget = nugget

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [
                self.semivariogramType,
                self.lagSize,
                self.majorRange,
                self.partialSill,
                self.nugget,
            ]
        )

    def __repr__(self):
        return self._toRepresentation(
            [
                self.semivariogramType,
                self.lagSize,
                self.majorRange,
                self.partialSill,
                self.nugget,
            ]
        )


KrigingModelOrdinary._addProperty("semivariogramType", "SPHERICAL")
KrigingModelOrdinary._addProperty("lagSize")
KrigingModelOrdinary._addProperty("majorRange")
KrigingModelOrdinary._addProperty("partialSill")
KrigingModelOrdinary._addProperty("nugget")


class KrigingModelUniversal(KrigingModel):
    """KrigingModelUniversal(LINEARDRIFT|QUADRATICDRIFT, {lagSize}, {majorRange}, {partialSill}, {nugget})

    Create a KrigingModelUniversal object.

    Arguments:
    semivariogramType -- Semivariogram type
    lagSize -- Lag size
    majorRange -- Major range
    partialSill -- Major range
    nugget -- Nugget
    """

    __esri_toolinfo__ = [
        "String::LINEARDRIFT|QUADRATICDRIFT:",
        "Double:::",
        "Double:::",
        "Double:::",
        "Double:::",
    ]

    def __init__(
        self,
        semivariogramType=None,
        lagSize=None,
        majorRange=None,
        partialSill=None,
        nugget=None,
    ):
        KrigingModel.__init__(self)
        self.semivariogramType = semivariogramType
        self.lagSize = lagSize
        self.majorRange = majorRange
        self.partialSill = partialSill
        self.nugget = nugget

    def __str__(self):
        return CompoundParameter._CompoundParameter._toString(
            [
                self.semivariogramType,
                self.lagSize,
                self.majorRange,
                self.partialSill,
                self.nugget,
            ]
        )

    def __repr__(self):
        return self._toRepresentation(
            [
                self.semivariogramType,
                self.lagSize,
                self.majorRange,
                self.partialSill,
                self.nugget,
            ]
        )


KrigingModelUniversal._addProperty("semivariogramType", "LINEARDRIFT")
KrigingModelUniversal._addProperty("lagSize")
KrigingModelUniversal._addProperty("majorRange")
KrigingModelUniversal._addProperty("partialSill")
KrigingModelUniversal._addProperty("nugget")
