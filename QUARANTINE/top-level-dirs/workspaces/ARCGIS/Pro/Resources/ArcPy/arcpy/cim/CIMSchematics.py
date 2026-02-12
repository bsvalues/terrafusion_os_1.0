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

from .CIMVectorLayers import CIMDataConnection
class CIMSchematicDataConnection(CIMDataConnection):
    """
      Represents a schematic data connection.
    """
    workspaceConnectionString = str()
    workspaceFactory = WorkspaceFactory.SDE
    customWorkspaceFactoryCLSID = str()
    dataset = str()
    datasetType = esriDatasetType.esriDTAny
    """
      Represents a schematic data connection.
    """
    schematicDataset = str()
    diagramTemplate = str()
    diagram = str()
    def __init__(self, *args, **Kwargs):
        pass
    
from .CIMLayer import CIMBaseLayer
class CIMSchematicLayer(CIMBaseLayer):
    """
      Represents a schematic layer.
    """
    layers = []
    schematicDiagram = 'CIMDataConnection'
    symbolLayerDrawing = 'CIMSymbolLayerDrawing'
    referenceScale = 1.0
    isTemplate = False
    def __init__(self, *args, **Kwargs):
        pass
    
