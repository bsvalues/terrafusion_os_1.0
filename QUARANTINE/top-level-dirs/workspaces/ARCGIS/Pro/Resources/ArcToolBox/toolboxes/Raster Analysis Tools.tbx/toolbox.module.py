
"""
Source Name:   Raster Analytics Tools.pyt
Version:       ArcGIS Pro
Author:        Environmental Systems Research Institute Inc.
Description:
"""

import time
import sys
import os
import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, set_context

myScripts = os.path.join(os.path.abspath(os.path.dirname(__file__)), "scripts")
sys.path.append(myScripts)

#import tools 
from summarizeraster import SummarizeRasterWithin
from viewshed import CreateViewshed
from density import CalculateDensity
from interpolate import InterpolatePoints
from rastertofeatures import ConvertRasterToFeature
from featuretoraster import ConvertFeatureToRaster
from streamlink import StreamLink
from watershed import Watershed
from fill import Fill
from flowdirection import FlowDirection
from flowaccumulation import FlowAccumulation
from nibble import Nibble
from calculatedistance import CalculateDistance
from calculatetravelcost import CalculateTravelCost
from calculatecostpath import DetermineTravelCostPathsToDestinations
from calculatenetwork import DetermineOptimumTravelCostNetwork
from flowdistance import FlowDistance
from calculatecostpathpoly import DetermineTravelCostPathAsPolyline
from classifypixelsusingdl import ClassifyPixelsUsingDeepLearning
from detectobjectsusingdl import DetectObjectsUsingDeepLearning
from classifyobjectsusingdl import ClassifyObjectsUsingDeepLearning
from determinepolyline import CostPathAsPolyline
from optimalregionconnections import OptimalRegionConnections
from optimalpathasline import OptimalPathAsLine
from zonalstatastable import ZonalStatisticsAsTable
from optimalpathasraster import OptimalPathAsRaster
from distanceallocation import DistanceAllocation
from distanceaccumulation import DistanceAccumulation 
from rasurfaceparameters import SurfaceParameters

class Toolbox(object):
    def __init__(self):
        """Define the toolbox (the name of the toolbox is the name of the
        .pyt file)."""
        self.label = "Raster Analytics Tools"
        self.alias = "ra"
        self.helpContext = 54

        # List of tool classes associated with this toolbox
        self.tools = [SummarizeRasterWithin,
			CreateViewshed,
			CalculateDensity,
			InterpolatePoints,
			ConvertRasterToFeature,
			ConvertFeatureToRaster,	    	
			FlowDirection,
			Watershed,
			Fill,
			FlowAccumulation,			
			StreamLink,
			FlowDistance,
			Nibble,			
			CalculateDistance,			
			CalculateTravelCost,			
			DetermineTravelCostPathsToDestinations, 			
			DetermineOptimumTravelCostNetwork,
			DetermineTravelCostPathAsPolyline,
			ClassifyPixelsUsingDeepLearning,
			DetectObjectsUsingDeepLearning,
            ClassifyObjectsUsingDeepLearning,
			CostPathAsPolyline,
			OptimalRegionConnections,
			OptimalPathAsLine,
			ZonalStatisticsAsTable, 
			OptimalPathAsRaster, 
			DistanceAllocation, 
			DistanceAccumulation,
            SurfaceParameters]

