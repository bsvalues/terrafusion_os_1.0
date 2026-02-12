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

from . import ComplexArgument
from . import Utils


class NestedListArgument(ComplexArgument.ComplexArgument):
    def __init__(
        self, nrRequiredValuesPerRecord, maxNrValuesPerRecord, table, keyword=None
    ):
        ComplexArgument.ComplexArgument.__init__(self, keyword)
        self.table = table

        if not Utils.isNestedList(self.table):
            raise Exception("Expected a list of lists")

        for record in table:
            nrValues = len(record)

            if nrValues < nrRequiredValuesPerRecord:
                raise Exception(
                    "Record has %d values. Number of required values is %d"
                    % (nrValues, nrRequiredValuesPerRecord)
                )

            if nrValues > maxNrValuesPerRecord:
                raise Exception(
                    "Record has %d values. Maximum number of values is %d"
                    % (nrValues, maxNrValuesPerRecord)
                )

    def __str__(self):
        return "; ".join(
            [" ".join([str(item) for item in record]) for record in self.table]
        )
