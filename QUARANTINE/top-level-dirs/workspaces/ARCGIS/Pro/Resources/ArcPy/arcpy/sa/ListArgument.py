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


class ListArgument(ComplexArgument.ComplexArgument):
    def __init__(self, nrRequiredValues, list_, keyword=None):
        ComplexArgument.ComplexArgument.__init__(self, keyword)
        self.list = list_

        if not isinstance(self.list, list):
            raise Exception("Expected a list")

        nrValues = len(self.list)

        if nrValues < nrRequiredValues:
            raise Exception(
                "List has %d values. Number of required values is %d"
                % (nrValues, nrRequiredValues)
            )

    def __str__(self):
        return "; ".join([str(item) for item in self.list])
