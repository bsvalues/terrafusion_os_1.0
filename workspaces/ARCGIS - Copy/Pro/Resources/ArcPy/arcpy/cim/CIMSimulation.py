"""
    COPYRIGHT 2013-2019 ESRI
    
    TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
    Unpublished material - all rights reserved under the
    Copyright Laws of the United States.
    
    For additional information, contact:
    Environmental Systems Research Institute, Inc.
    Attn: Contracts Dept
    380 New York Street
    Redlands, California, USA 92373
    
    email: contracts@esri.com
"""
#Cartographic Information Model generated file - do not modify
from .CIMEnum import *
from .CIMExternal import *
from .ArcpyHelper import GetPythonClass

class CIMFloodSimulationObject():
    """
      Provides access to properties of a flood simulation object.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.visible = True
    
class CIMFloodSimulationStorage():
    """
      Represents storage for flood simulation data objects.
    """
    def __init__(self, *args, **Kwargs):
        self.waterSourceAreas = []
        self.waterSources = []
        self.barriers = []
        self.culverts = []
    
class CIMRateDuration():
    """
      Provides access to properties of a rate duration.
    """
    def __init__(self, *args, **Kwargs):
        self.duration = 3600
        self.rate = 8
    
from .CIMLayer import CIMBaseLayer
class CIMSimulationLayer(CIMBaseLayer):
    """
      Provides access to properties of a simulation layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.isActive = False
        self.areaOfInterest = GetPythonClass('arcpy', 'Polygon')
        self.areaOfInterestSymbol = 'CIMPolygonSymbol'
        self.useAutomaticCellResolution = True
        self.manualCellResolution = 0
        self.maxAOIEdgeCellCount = 4096
        self.elevationDownscalingFactor = 8
        self.duration = 12
        self.currentTime = 0
        self.playbackSpeed = 10
        self.playbackStep = 1
        self.useDefaultNumberOfCacheSlices = True
        self.secondsPerSimulationCacheSlice = 300
    
class CIMFloodSimulationBarrier(CIMFloodSimulationObject):
    """
      Provides access to properties of a flood simulation barrier.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.path = GetPythonClass('arcpy', 'Polyline')
        self.height = 0
        self.width = 0
        self.unit = str()
    
class CIMFloodSimulationCulvert(CIMFloodSimulationObject):
    """
      Provides access to properties of a flood simulation culvert.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.path = GetPythonClass('arcpy', 'Polyline')
        self.height = 0
        self.width = 0
        self.unit = str()
        self.profileType = FloodSimulationCulvertProfileType.Rectangular
        self.materialRoughness = float('nan')
        self.openTop = False
    
class CIMFloodSimulationDepthRaster(CIMFloodSimulationObject):
    """
      Provides access to properties of a depth raster for flood simulation.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.rasterDataConnection = 'CIMDataConnection'
        self.linearUnit = str()
    
class CIMFloodSimulationLayer(CIMSimulationLayer):
    """
      Provides access to properties of a flood simulation layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.rainfallRate = []
        self.rainfallTransitionTime = 0
        self.rainfallDisplayUnits = str()
        self.evaporationRate = 0
        self.dEMSourceLayers = []
        self.colorRamp = 'CIMColorRamp'
        self.valueRangeType = FloodSimulationValueRangeType.FlowIntensity
        self.displayValueRange = 'CIMRange'
        self.initialWaterDepthRaster = 'CIMFloodSimulationDepthRaster'
        self.infiltrationMaxRaster = 'CIMFloodSimulationDepthRaster'
        self.infiltrationRateRaster = 'CIMFloodSimulationRateRaster'
        self.floodSimulationStorageURI = str()
        self.waterColorizer = 'CIMRasterClassifyColorizer'
        self.waterDisplayType = FloodSimulationWaterDisplayType.Fill
        self.containWaterInAOI = False
        self.overrideWeatherEffects = False
    
class CIMFloodSimulationRateRaster(CIMFloodSimulationDepthRaster):
    """
      Provides access to properties of a rate raster for flood simulation.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.timeUnit = esriTimeUnits.esriTimeUnitsHours
    
class CIMFloodSimulationWaterSource(CIMFloodSimulationObject):
    """
      Provides access to properties of a flood simulation water source.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.location = GetPythonClass('arcpy', 'Point')
        self.waterFlowRate = []
    
class CIMFloodSimulationWaterSourceArea(CIMFloodSimulationObject):
    """
      Provides access to properties of a flood simulation water source.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.area = GetPythonClass('arcpy', 'Polygon')
        self.waterFlowRate = []
    
