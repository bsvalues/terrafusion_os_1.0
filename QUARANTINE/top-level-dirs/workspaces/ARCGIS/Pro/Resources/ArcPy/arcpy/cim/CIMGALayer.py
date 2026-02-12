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

class CIMGAMethod():
    """
      Represents the GA method.
    """
    def __init__(self, *args, **Kwargs):
        self.model = str()
        self.dataConnection = 'CIMDataConnection'
    
from .CIMVectorLayers import CIMDataConnection
class CIMGADataConnection(CIMDataConnection):
    """
      Represents GA data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataConnections = []
        self.spatialReference = GetPythonClass('arcpy', 'SpatialReference')
        self.metaData = str()
    
from .CIMSymbolizers import CIMClassBreaksRendererBase
class CIMGAIsoRenderer(CIMClassBreaksRendererBase):
    """
      Represents GA iso renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.isoQuality = 0
        self.isoType = str()
        self.noResultSymbol = 'CIMSymbolReference'
        self.refineOnZoom = False
    
from .CIMLayer import CIMBaseLayer
class CIMGALayer(CIMBaseLayer):
    """
      Represents the GA layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.aOI = GetPythonClass('arcpy', 'Extent')
        self.method = 'CIMGAMethod'
        self.renderers = []
        self.rangeDefinitions = []
        self.activeRangeName = str()
        self.isFlattened = False
    
