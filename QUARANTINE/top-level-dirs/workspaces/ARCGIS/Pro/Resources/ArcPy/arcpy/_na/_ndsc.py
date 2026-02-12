from arcgisscripting import na as cna  # pylint:disable=no-name-in-module
from enum import IntEnum
from typing import Iterable, Union
from arcpy import gp

# List of names exported from this module
__all__ = ["Attribute", "AttributeParameter", "NetworkElement", "Junction", "Turn", "Edge", "NetworkQuery", "AttributeEvaluator", "NetworkTimeUsage", "AttributeUsage", "AttributeParameterUsage"]

NetworkQuery = cna.NetworkQuery
AttributeEvaluator = cna.AttributeEvaluator
NetworkElement = cna.NetworkElement
Junction = cna.Junction
Turn = cna.Turn
Edge = cna.Edge
Attribute = cna.Attribute
AttributeParameter = cna.AttributeParameter

class NetworkTimeUsage(IntEnum):
    '''Describes various time usage types.'''

    BeforeTraversal = 1
    AfterTraversal = 2

class AttributeUsage(IntEnum):
    '''Describes various network attribute usage types.'''

    Cost = 0
    Descriptor = 1
    Restriction = 2
    Hierarchy = 3

class AttributeParameterUsage(IntEnum):
    '''Describes various network attribute parameter usage types.'''

    General = 0
    Restriction = 1

