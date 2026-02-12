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
Contains the implementation of the ExtractValues class.
"""

from . import CompoundParameter
from . import Table


__all__ = ["ExtractValues"]


class ExtractValues(CompoundParameter._CompoundParameter):
    """ExtractValues([[Raster, {Output Field Name}],...])

    Create an ExtractValues object.

    Arguments:
    Raster -- Raster
    Output Field Name -- Field
    """

    __esri_toolinfo__ = ["::::"]

    def __init__(self, table):
        CompoundParameter._CompoundParameter.__init__(self)

        self.table = Table.Table(table, 1, 2)

    def __str__(self):
        self.table.check()

        return "; ".join(
            [" ".join([str(item) for item in record]) for record in self.table]
        )

    def __repr__(self):
        return repr(self.table)


ExtractValues._addProperty("table")
