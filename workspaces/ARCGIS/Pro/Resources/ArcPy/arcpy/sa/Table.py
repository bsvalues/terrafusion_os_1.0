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

from . import Utils


class Table(list):
    """Class for table objects.

    Tables are modelled as lists of lists. Care is taken to make it only
    possible to add records with a valid number of values.
    """

    def __init__(self, sequence, minNrValuesPerRecord=0, maxNrValuesPerRecord=-1):
        """Creates a Table object.

        sequence -- Sequence with records to add to the table.
        minNrValues -- Minimum number of values per record in the table.
        maxNrValues -- Maximum number of values per record in the table.
        """
        list.__init__(self, sequence)

        if not Utils.isNestedList(self):
            raise Exception("Expected a list of lists")

        assert minNrValuesPerRecord >= 0
        assert maxNrValuesPerRecord == -1 or maxNrValuesPerRecord > 0
        assert (
            maxNrValuesPerRecord == -1 or minNrValuesPerRecord <= maxNrValuesPerRecord
        )
        self.__minNrValuesPerRecord = minNrValuesPerRecord
        self.__maxNrValuesPerRecord = maxNrValuesPerRecord

    def check(self):
        if not Utils.isNestedList(self):
            raise Exception("Expected a list of lists")

        for r in range(len(self)):
            record = self[r]
            nrValues = len(record)

            if nrValues < self.__minNrValuesPerRecord:
                raise Exception(
                    "Record %d has %d value(s). Minimum number of values is %d"
                    % (r, nrValues, self.__minNrValuesPerRecord)
                )

            if (
                self.__maxNrValuesPerRecord != -1
                and nrValues > self.__maxNrValuesPerRecord
            ):
                raise Exception(
                    "Record %d has %d value(s). Maximum number of values is %d"
                    % (r, nrValues, self.__maxNrValuesPerRecord)
                )
