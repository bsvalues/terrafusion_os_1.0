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

class List(list):
    """Class for list objects."""

    def __init__(self, sequence, minNrValues=0, maxNrValues=-1):
        """Creates a List object.

        sequence -- Sequence with values to add to the list.
        minNrValues -- Minimum number of values in the list.
        maxNrValues -- Maximum number of values in the list.
        """
        list.__init__(self, sequence)

        assert minNrValues >= 0
        assert maxNrValues == -1 or maxNrValues > 0
        assert maxNrValues == -1 or minNrValues <= maxNrValues
        self.__minNrValues = minNrValues
        self.__maxNrValues = maxNrValues

    def check(self):
        nrValues = len(self)

        if nrValues < self.__minNrValues:
            raise Exception(
                "List has %d value(s). Minimum number of values is %d"
                % (nrValues, self.__minNrValues)
            )

        if self.__maxNrValues != -1 and nrValues > self.__maxNrValues:
            raise Exception(
                "List has %d value(s). Maximum number of values is %d"
                % (nrValues, self.__maxNrValues)
            )
