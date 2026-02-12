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
Contains the implementation of the TopoInput classes.
"""

from . import CompoundParameter
from . import List
from . import Table


__all__ = [
    "TopoPointElevation",
    "TopoContour",
    "TopoStream",
    "TopoSink",
    "TopoBoundary",
    "TopoLake",
]


class TopoInput:
    pass


class __TopoInputNestedList(TopoInput, CompoundParameter._CompoundParameter):
    def __init__(self, keyword, inFeatures):
        CompoundParameter._CompoundParameter.__init__(self, keyword=keyword)
        assert self._keyword

        self.inFeatures = Table.Table(inFeatures, 1, 2)

    def __str__(self):
        self.inFeatures.check()

        return "; ".join(
            [
                " ".join([str(item) for item in record + [self._keyword]])
                for record in self.inFeatures
            ]
        )

    def __repr__(self):
        return repr(self.inFeatures)


__TopoInputNestedList._addProperty("inFeatures")


class __TopoInputList(TopoInput, CompoundParameter._CompoundParameter):
    def __init__(self, keyword, inFeatures):
        CompoundParameter._CompoundParameter.__init__(self, keyword=keyword)
        assert self._keyword

        self.inFeatures = List.List(inFeatures, 1)

    def __str__(self):
        self.inFeatures.check()

        return "; ".join(
            ["%s # %s" % (str(item), self._keyword) for item in self.inFeatures]
        )

    def __repr__(self):
        return repr(self.inFeatures)


__TopoInputList._addProperty("inFeatures")


def TopoPointElevation(inFeatures):
    """TopoPointElevation([[in_feature, {field}],...])

    Create a TopoPointElevation object.

    Arguments:
    in_feature -- Composite geodataset
    field -- Field
    """
    return __TopoInputNestedList("POINTELEVATION", inFeatures)


TopoPointElevation.__esri_toolinfo__ = ["::::"]


def TopoContour(inFeatures):
    """TopoContour([[in_feature, {field}],...])

    Create a TopoContour object.

    Arguments:
    in_feature -- Composite geodataset
    field -- Field
    """
    return __TopoInputNestedList("CONTOUR", inFeatures)


TopoContour.__esri_toolinfo__ = ["::::"]


def TopoStream(inFeatures):
    """TopoStream([in_feature,...])

    Create a TopoStream object.

    Arguments:
    in_feature -- Composite geodataset
    """
    return __TopoInputList("STREAM", inFeatures)


TopoStream.__esri_toolinfo__ = ["::::"]


def TopoSink(inFeatures):
    """TopoSink([[in_feature, {field}],...])

    Create a TopoSink object.

    Arguments:
    in_feature -- Composite geodataset
    field -- Field
    """
    return __TopoInputNestedList("SINK", inFeatures)


TopoSink.__esri_toolinfo__ = ["::::"]


def TopoBoundary(inFeatures):
    """TopoBoundary([in_feature,...])

    Create a TopoBoundary object.

    Arguments:
    in_feature -- Composite geodataset
    """
    return __TopoInputList("BOUNDARY", inFeatures)


TopoBoundary.__esri_toolinfo__ = ["::::"]


def TopoLake(inFeatures):
    """TopoLake([in_feature,...])

    Create a TopoLake object.

    Arguments:
    in_feature -- Composite geodataset
    """
    return __TopoInputList("LAKE", inFeatures)


TopoLake.__esri_toolinfo__ = ["::::"]
