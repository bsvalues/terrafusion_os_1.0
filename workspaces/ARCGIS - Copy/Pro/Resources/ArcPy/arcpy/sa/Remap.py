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
Contains the implementation of the Remap classes.
"""

from . import CompoundParameter
from . import Table

__all__ = ["RemapRange", "RemapValue"]


class Remap(CompoundParameter._CompoundParameter):
    def __init__(self, minNrValuesPerRecord, maxNrValuesPerRecord, table):
        CompoundParameter._CompoundParameter.__init__(self)
        self.table = Table.Table(table, minNrValuesPerRecord, maxNrValuesPerRecord)

    def __repr__(self):
        return repr(self.table)

    def __str__(self):
        self.table.check()

        return "; ".join(
            [" ".join([str(item) for item in record]) for record in self.table]
        )


Remap._addProperty("table")


class RemapRange(Remap):
    """RemapRange([[start_value, end_value, new_value],...])

    Create a RemapRange object.

    Arguments:
    start_value -- Double
    end_value -- Double
    new_value -- Long
    """

    __esri_toolinfo__ = ["::::"]

    def __init__(self, table):
        Remap.__init__(self, 3, 3, table)


class RemapValue(Remap):
    """RemapValue([[old_value, new_value],...])

    Create a RemapValue object.

    Arguments:
    old_value -- Double | String
    new_value -- Long
    """

    __esri_toolinfo__ = ["::::"]

    def __init__(self, table):
        Remap.__init__(self, 2, 2, table)
