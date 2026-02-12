'''
 ==================================================
 Defense Tools.pyt
 --------------------------------------------------
 requirements: ArcGIS Pro
 author: ArcGIS Solutions
 contact: support@esri.com
 company: Esri
 ==================================================
 description: 
 Python toolbox container for Defense Tools.
 A Geoprocessing Toolbox that contains collections of tools to 
 import geometry from tables, determine ranges, create grids,
 and provide basic visibility analysis capabilities.
 ==================================================
'''

import os
import sys

from defenseConversionTools import GenerateCoordinateNotations
from defenseConversionTools import CoordinateTableToPoint
from defenseConversionTools import CoordinateTableTo2PointLine
from defenseConversionTools import CoordinateTableToEllipse
from defenseConversionTools import CoordinateTableToPolygon
from defenseConversionTools import CoordinateTableToPolyline
from defenseConversionTools import CoordinateTableToLineOfBearing

from defenseDistanceAndDirectionTools import GenerateRangeRings
from defenseDistanceAndDirectionTools import GenerateRangeRingsFromFeatures
from defenseDistanceAndDirectionTools import GenerateRangeRingsFromTable
from defenseDistanceAndDirectionTools import GenerateRangeFans
from defenseDistanceAndDirectionTools import GenerateRangeFansFromFeatures

from defenseGRGTools import GenerateGRGFromPoint
from defenseGRGTools import GenerateGRGFromArea
from defenseGRGTools import GenerateReferenceSystemGRGFromArea
from defenseGRGTools import NumberFeatures
from defenseGRGTools import LetterFeatures
from defenseGRGTools import LetterIntersections
from defenseGRGTools import NumberFeaturesBySector

from defenseVisibilityTools import FindLocalPeaksValleys
from defenseVisibilityTools import FindHighestLowestPoint
from defenseVisibilityTools import LinearLineOfSight
from defenseVisibilityTools import RadialLineOfSight
from defenseVisibilityTools import RadialLineOfSightAndRange

class Toolbox(object):
    '''
    Defense Tools Toolbox
    '''
    def __init__(self):
        '''Toolbox Constructor'''

        self.label = 'Defense Tools'
        self.alias = "defense" 
        self.helpContext = 74

        self.tools = [

        # Conversion 
        CoordinateTableToPoint,
        CoordinateTableTo2PointLine, 
        CoordinateTableToEllipse,
        CoordinateTableToLineOfBearing, 
        CoordinateTableToPolygon,
        CoordinateTableToPolyline,
        GenerateCoordinateNotations,

        # Distance And Direction Tools
        GenerateRangeRings,
        GenerateRangeRingsFromFeatures,
        GenerateRangeRingsFromTable,
        GenerateRangeFans,
        GenerateRangeFansFromFeatures,

        # Gridded Reference Graphic (GRG) Tools
        GenerateGRGFromArea,
        GenerateGRGFromPoint,
        GenerateReferenceSystemGRGFromArea,
        NumberFeatures,
        LetterFeatures,
        LetterIntersections,
        NumberFeaturesBySector,

        # Visibility Tools
        FindHighestLowestPoint,
        FindLocalPeaksValleys,
        LinearLineOfSight,
        RadialLineOfSight,
        RadialLineOfSightAndRange
        ]
