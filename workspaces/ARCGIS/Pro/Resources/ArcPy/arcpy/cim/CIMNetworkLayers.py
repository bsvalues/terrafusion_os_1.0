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

class CIMNALocatorOverrideClass():
    """
      Represents locator settings for a particular class.
    """
    def __init__(self, *args, **Kwargs):
        self.className = str()
        self.locator = str()
    
class CIMNetworkAttributeParameterDefinitionValue():
    """
      Provides access to read or update the value assigned to a network 
      parameter of a network attribute.
    """
    def __init__(self, *args, **Kwargs):
        self.networkAttributeName = str()
        self.networkParameterName = str()
        self.isRestrictionUsage = False
        self.valueType = ValueType.Double
        self.value = object()
    
class CIMNetworkDatasetRenderer():
    """
      Represents a network dataset renderer.
    """
    def __init__(self, *args, **Kwargs):
        self.label = str()
        self.visible = False
    
class CIMNetworkSourceDisplayFilter():
    """
      Represents a network source display filter.
    """
    def __init__(self, *args, **Kwargs):
        self.networkSource = str()
        self.visible = False
        self.definitionExpression = str()
    
class CIMNetworkTraceConfiguration():
    """
      Represents a Trace Configuration.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.iD = str()
    
class CIMNetworkTravelModeDefinition():
    """
      The network travel mode is used to configure a group of cost, traversability, 
      and other analysis configurations.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.modeType = str()
        self.description = str()
        self.impedanceAttributeName = str()
        self.timeAttributeName = str()
        self.distanceAttributeName = str()
        self.restrictionAttributeNames = []
        self.attributeParameterValues = []
        self.useHierarchy = False
        self.uTurnAtJunctionsPolicy = esriNetworkForwardStarBacktrack.esriNFSBNoBacktrack
        self.useOutputGeometryPrecision = False
        self.outputGeometryPrecisionValue = 0.0
        self.outputGeometryPrecisionUnits = str()
    
class CIMNetworkTravelModeDefinitionContext():
    """
      Specifies the travel mode travel mode to be applied. Depending 
      on the SourceType, some properties are conditionally required to 
      indicate the travel mode.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.sourceType = NetworkTravelModeSourceType.NetworkDataset
        self.sourceLayerURI = str()
        self.travelMode = 'CIMNetworkTravelModeDefinition'
    
class CIMRestrictionStatusSymbolClass():
    """
      Restriction status, label, and symbol.
    """
    def __init__(self, *args, **Kwargs):
        self.status = RestrictionStatus.Prohibited
        self.label = str()
        self.symbol = 'CIMSymbolReference'
    
class CIMTraversableDirectionsAdornerPointSymbolClass():
    """
      Traversable directions, label, and adorner point symbol.
        /// The applicable adorner point symbol is oriented and added 
      to the restriction status symbol when drawn to indicate the directional 
      traversability of network elements.
    """
    def __init__(self, *args, **Kwargs):
        self.traversableDirections = TraversableDirections.OneWay
        self.label = str()
        self.adornerPointSymbol = 'CIMSymbolReference'
    
from .CIMVectorLayers import CIMDataConnection
class CIMInMemoryDatasetDataConnection(CIMDataConnection):
    """
      Represents an in-memory dataset data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataset = str()
    
class CIMInMemoryWorkspaceDataConnection(CIMDataConnection):
    """
      Represents an in-memory workspace data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.binaryReferencePath = str()
    
from .CIMLayer import CIMBaseLayer
class CIMNALayer(CIMBaseLayer):
    """
      Represents a network analysis layer.
    """
    """
      Represents a network analysis layer.
    """
    """
      Represents a network analysis layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.standaloneTables = []
        self.layers = []
        self.symbolLayerDrawing = 'CIMSymbolLayerDrawing'
        self.nAWorkspace = 'CIMDataConnection'
        self.networkDataset = 'CIMDataConnection'
        self.solver = str()
        self.locator = str()
        self.locatorOverrides = []
        self.agents = []
    
class CIMNetworkDatasetLayer(CIMBaseLayer):
    """
      Represents a network dataset layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataConnection = 'CIMDataConnection'
        self.dirtyAreaRenderer = 'CIMNetworkDatasetSimpleRenderer'
        self.displayNetworkAttribute = str()
        self.edgeRenderer = 'CIMNetworkDatasetSimpleRenderer'
        self.junctionRenderer = 'CIMNetworkDatasetSimpleRenderer'
        self.missingElementRenderer = 'CIMNetworkDatasetElementCompositeRenderer'
        self.networkSourceDisplayFilters = []
        self.oneWayRenderer = 'CIMNetworkDatasetElementCompositeRenderer'
        self.restrictionNetworkAttributes = []
        self.restrictionRenderer = 'CIMNetworkDatasetElementCompositeRenderer'
        self.systemJunctionRenderer = 'CIMNetworkDatasetSimpleRenderer'
        self.trafficNetworkAttribute = str()
        self.trafficRenderer = 'CIMNetworkDatasetTrafficRenderer'
        self.traversableRenderer = 'CIMNetworkDatasetElementCompositeRenderer'
        self.turnRenderer = 'CIMNetworkDatasetSimpleRenderer'
        self.travelModeContext = 'CIMNetworkTravelModeDefinitionContext'
        self.restrictionStatusRenderers = []
        self.classifyRestrictionsByPreferenceLevel = False
    
class CIMTraceNetworkLayer(CIMBaseLayer):
    """
      Represents a trace network layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataConnection = 'CIMDataConnection'
        self.pointErrorLayer = str()
        self.lineErrorLayer = str()
        self.systemJunctionsLayer = str()
        self.dirtyAreaLayer = str()
        self.connectivityAssociationSymbol = 'CIMSymbolReference'
        self.activeTraceConfigurations = []
    
class CIMUtilityNetworkLayer(CIMBaseLayer):
    """
      Represents a utility network layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataConnection = 'CIMDataConnection'
        self.pointErrorLayer = str()
        self.lineErrorLayer = str()
        self.polygonErrorLayer = str()
        self.dirtyAreaLayer = str()
        self.connectivityAssociationSymbol = 'CIMSymbolReference'
        self.structuralAttachmentAssociationSymbol = 'CIMSymbolReference'
        self.containerAssociationSymbol = 'CIMSymbolReference'
        self.activeTraceConfigurations = []
    
class CIMNetworkDatasetElementCompositeRenderer(CIMNetworkDatasetRenderer):
    """
      Represents a network dataset element composite renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.edgeLineRenderer = 'CIMNetworkDatasetSimpleRenderer'
        self.edgePointRenderer = 'CIMNetworkDatasetSimpleRenderer'
        self.junctionPointRenderer = 'CIMNetworkDatasetSimpleRenderer'
        self.turnLineRenderer = 'CIMNetworkDatasetSimpleRenderer'
    
class CIMNetworkDatasetSimpleRenderer(CIMNetworkDatasetRenderer):
    """
      Represents a network dataset simple renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.description = str()
        self.symbol = 'CIMSymbolReference'
    
class CIMNetworkDatasetTrafficRenderer(CIMNetworkDatasetRenderer):
    """
      Represents a network dataset traffic renderer.
    """
    """
      Represents a network dataset traffic renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.breaks = []
        self.defaultDescription = str()
        self.defaultLabel = str()
        self.defaultSymbol = 'CIMSymbolReference'
        self.showLiveTrafficOnly = False
        self.useDefaultSymbol = False
        self.drawLineWidthByHierarchyLevelIndex = False
        self.exteriorLineWidthIncrement = 0
        self.interiorLineWidthsByHierarchyLevelIndex = []
        self.lineCasingsColor = 'CIMColor'
        self.scaleFilters = []
        self.useDerivedLineCasingsColor = False
        self.useLineCasings = False
        self.useScaleFilters = False
    
class CIMRestrictionStatusRenderer(CIMNetworkDatasetRenderer):
    """
      Represents a renderer that shows the restriction status of network 
      elements.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.rendererTarget = NDSRendererTarget.Edges
        self.restrictionStatusSymbolClasses = []
        self.traversableDirectionsAdornerPointSymbolClasses = []
    
