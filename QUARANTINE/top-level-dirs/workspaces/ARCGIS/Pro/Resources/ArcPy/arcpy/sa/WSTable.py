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
Contains the implementation of the WSTable class.
"""

from . import CompoundParameter
from . import Table


__all__ = ["WSTable"]


class WSTable(CompoundParameter._CompoundParameter):
    """WSTable([[in_raster, field, weight],...])

    Create a WSTable object.

    Arguments:
    in_raster -- Raster
    field -- Field
    weight -- Double
    """

    __esri_toolinfo__ = ["::::"]

    def __init__(self, table):
        CompoundParameter._CompoundParameter.__init__(self)

        self.table = Table.Table(table, 3, 3)

    def __str__(self):
        self.table.check()

        return "; ".join(
            [" ".join([str(item) for item in record]) for record in self.table]
        )

    def __repr__(self):
        return repr(self.table)


WSTable._addProperty("table")
