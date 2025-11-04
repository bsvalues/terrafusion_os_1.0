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

from .CIMLayer import CIMGroupLayer
class CIMDiagramLayer(CIMGroupLayer):
    """
      Represents a diagram layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.referenceScale = 1.0
        self.dataConnection = 'CIMNetworkDiagramDataConnection'
    
from .CIMVectorLayers import CIMDataConnection
class CIMDiagramRelQueryDataConnection(CIMDataConnection):
    """
      Represents a diagram rel query data connection.
    """
    """
      Represents a diagram rel query data connection.
    """
    """
      Represents a diagram rel query data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.workspaceConnectionString = str()
        self.workspaceFactory = WorkspaceFactory.SDE
        self.customWorkspaceFactoryCLSID = str()
        self.dataset = str()
        self.datasetType = esriDatasetType.esriDTAny
        self.featureDataset = str()
        self.diagramDatasetFeatureClass = esriDiagramDatasetFeatureClass.esriDiagramEdgeFeatureClass
        self.networkSourceID = 0
    
class CIMNetworkDiagramDataConnection(CIMDataConnection):
    """
      Represents a network diagram data connection.
    """
    """
      Represents a network diagram data connection.
    """
    """
      Represents a network diagram data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.workspaceConnectionString = str()
        self.workspaceFactory = WorkspaceFactory.SDE
        self.customWorkspaceFactoryCLSID = str()
        self.dataset = str()
        self.datasetType = esriDatasetType.esriDTAny
        self.featureDataset = str()
        self.diagram = str()
        self.isStored = False
        self.table = str()
    
