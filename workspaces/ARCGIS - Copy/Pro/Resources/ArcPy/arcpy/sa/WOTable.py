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
Contains the implementation of the WOTable class.
"""

from . import CompoundParameter
from . import List
from . import Table
from . import Utils


__all__ = ["WOTable"]


class WOTable(CompoundParameter._CompoundParameter):
    """WOTable([[in_raster, influence, field, remap],...], [from, to, by])

    Create a WOTable object.

    Arguments:
    in_raster -- Raster
    influence -- Double
    field -- Field
    remap -- Remap
    from -- Long
    to -- Long
    by -- Long
    """

    __esri_toolinfo__ = ["::::"]

    def __init__(self, table, sequence):
        CompoundParameter._CompoundParameter.__init__(self)

        self.table = Table.Table(table, 4, 4)
        self.list = List.List(sequence, 3, 3)

        ### List performs this check already.
        ### if len(self.list) != 3:
        ###   raise Exception(
        ###           "List with three values expected: [from, to, by]")

    def __str__(self):
        self.table.check()
        self.list.check()

        strings = []

        for record in self.table:
            # Currently, it is relevant that single quotes are used around strings.
            # This is relevant for strings and class instances who's string
            # representation is used.
            string = " ".join(
                [
                    not Utils.isNumerical(item) and "'%s'" % (str(item)) or str(item)
                    for item in record[:-1]
                ]
            )
            string += " (%s)" % (str(record[-1]))
            strings.append(string)

        return "(%s); %s" % (
            "; ".join(strings),
            " ".join([str(item) for item in self.list]),
        )

    def __repr__(self):
        return "%s, %s" % (repr(self.table), repr(self.list))


WOTable._addProperty("table")
WOTable._addProperty("list")
