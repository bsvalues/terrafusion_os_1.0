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

class CIMIsosurface():
    """
      Represents a isosurface.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = str()
        self.color = 'CIMColor'
        self.isCustomColor = False
        self.value = 0
        self.name = str()
        self.visible = True
    
class CIMObject3DRenderingFilter():
    """
      Represents a 3D object rendering filter.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = str()
        self.name = str()
        self.description = str()
        self.filterBlocks = []
        self.authoringInfo = 'CIMObject3DRenderingFilterAuthoringInfo'
    
class CIMObject3DRenderingFilterAuthoringInfo():
    """
      Represents a filter authoring info.
    """
    def __init__(self, *args, **Kwargs):
        self.isVisible = True
        self.filterBlocks = []
    
class CIMObject3DRenderingFilterBlock():
    """
      Represents a 3D object rendering filter block.
    """
    def __init__(self, *args, **Kwargs):
        self.title = str()
        self.mode = Object3DRenderingMode.eNone
        self.expression = str()
    
class CIMObject3DRenderingFilterBlockAuthoringInfo():
    """
      Represents a filter block authoring info.
    """
    def __init__(self, *args, **Kwargs):
        self.filterStates = []
    
class CIMObject3DRenderingFilterState():
    """
      Represents a 3D object rendering filter value.
    """
    def __init__(self, *args, **Kwargs):
        self.filterType = str()
        self.selectedValues = []
    
class CIMServerConnection():
    """
      Represents a server connection.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMServiceSubTable():
    """
      Represents a service subtable.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.subTableID = str()
    
class CIMVoxelColorUniqueValue():
    """
      Represents a voxel color unique value.
    """
    def __init__(self, *args, **Kwargs):
        self.value = 0
        self.label = str()
        self.color = 'CIMColor'
        self.visible = True
        self.description = str()
    
class CIMVoxelFilter():
    """
      Represents a renderer filter.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMVoxelFormat():
    """
      Represents a voxel format.
    """
    def __init__(self, *args, **Kwargs):
        self.scale = 1.0
        self.offset = 0.0
        self.useNoDataValue = False
        self.noDataValue = 0.0
        self.scalarFormat = VoxelScalarFormat.F8
    
class CIMVoxelLighting():
    """
      Represents voxel lighting.
    """
    def __init__(self, *args, **Kwargs):
        self.isDiffuseEnabled = True
        self.diffuse = 0.5
        self.isSpecularEnabled = True
        self.specular = 0.5
    
class CIMVoxelPlane():
    """
      Represents a voxel plane.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = str()
        self.name = str()
        self.visible = True
        self.position = GetPythonClass('arcpy', 'Point')
        self.normal = GetPythonClass('arcpy', 'Point')
    
class CIMVoxelRenderer():
    """
      Represents a voxel renderer.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMVoxelStaticSection():
    """
      Represents a voxel static section.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = -1
        self.name = str()
        self.visible = True
        self.expanded = False
        self.variable = str()
        self.slices = []
        self.plane = 'CIMVoxelPlane'
        self.rasterURI = str()
        self.format = 'CIMVoxelFormat'
        self.height = 0
        self.width = 0
        self.timeIndex = 0
    
class CIMVoxelVariableProfile():
    """
      Represents a voxel layer variable profile.
    """
    def __init__(self, *args, **Kwargs):
        self.variable = str()
        self.description = str()
        self.dataType = VoxelVariableDataType.Continuous
        self.filters = []
        self.renderer = 'CIMVoxelRenderer'
        self.precision = VoxelVariablePrecision.InputData
        self.signature = str()
        self.signatureVersion = 0
        self.isosurfaces = []
    
class CIMVoxelVolume():
    """
      Represents a voxel layer volume.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = -1
        self.sections = []
        self.slices = []
        self.variableProfiles = []
    
from .CIMLayer import CIMBaseLayer
class CIMBuildingDisciplineSceneLayer(CIMBaseLayer):
    """
      Represents a building discipline scene layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.subLayers = []
        self.subLayerID = -1
    
class CIMBuildingSceneLayer(CIMBaseLayer):
    """
      Represents a building composite scene layer.
    """
    """
      Represents a building composite scene layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.subLayers = []
        self.dataConnection = 'CIMDataConnection'
        self.filters = []
        self.activeFilterID = str()
    
class CIMIndexedSceneLayer(CIMBaseLayer):
    """
      Represents a indexed scene layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.snappable = True
        self.renderer = 'CIMRenderer'
        self.featureElevationExpression = str()
        self.labelClasses = []
        self.labelVisibility = False
        self.dataConnection = 'CIMDataConnection'
        self.useRealWorldSymbolSizes = False
        self.exclusionSet = []
        self.definitionExpression = str()
        self.definitionExpressionName = str()
        self.definitionFilterChoices = []
        self.associatedFeatureLayerURI = str()
        self.indexedSceneLayerType = IndexedSceneLayerType.Point
        self.selectable = True
        self.selectionSetURI = str()
        self.modificationLayerURI = str()
        self.modificationLayerEnabled = True
        self.usePredefinedMaxScreenThreshold = True
        self.floorAwareTableProperties = 'CIMFloorAwareTableProperties'
        self.timeFields = 'CIMTimeTableDefinition'
        self.timeDefinition = 'CIMTimeDataDefinition'
        self.timeDisplayDefinition = 'CIMTimeDisplayDefinition'
        self.rangeDefinitions = []
        self.activeRangeName = str()
    
from .CIMLayer import CIMSubLayerBase
class CIMServiceCompositeSubLayer(CIMSubLayerBase):
    """
      Represents a service composite sublayer.
    """
    """
      Represents a service composite sublayer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.subLayers = []
        self.definitionExpression = str()
        self.uRI = str()
    
from .CIMVectorLayers import CIMDataConnection
class CIMServiceConnection(CIMDataConnection):
    """
      Represents a service connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.description = str()
    
class CIMServiceLayer(CIMBaseLayer):
    """
      Represents a service layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.serviceConnection = 'CIMServiceConnection'
        self.subLayers = []
        self.transparentColor = 'CIMColor'
        self.backgroundColor = 'CIMColor'
        self.subTables = []
    
class CIMServiceSubLayer(CIMSubLayerBase):
    """
      Represents a service sublayer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.showLabels = False
        self.scaleSymbols = False
        self.definitionExpression = str()
        self.sourceID = str()
        self.useTime = False
        self.drawTimeCumulative = False
        self.timeOffset = 0.0
        self.timeOffsetUnits = esriTimeUnits.esriTimeUnitsUnknown
        self.layerDefinition = str()
        self.popupInfo = 'CIMPopupInfo'
        self.showPopups = True
        self.floorAwareTableProperties = 'CIMFloorAwareTableProperties'
        self.uRI = str()
        self.definitionExpressionName = str()
        self.definitionFilterChoices = []
        self.selectionSetURI = str()
    
class CIMTiles3DDataConnection(CIMDataConnection):
    """
      Represents a 3D Tiles data connection.
    """
    """
      Represents a 3D Tiles data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.customParameters = []
        self.uRI = str()
    
class CIMTiles3DLayer(CIMBaseLayer):
    """
      Represents a 3D Tiles layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataConnection = 'CIMDataConnection'
        self.snappable = True
        self.tiles3DLayerType = Tiles3DLayerType.IntegratedMesh
    
class CIMVoxelDataConnection(CIMDataConnection):
    """
      Represents a voxel data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.uRI = str()
    
class CIMVoxelLayer(CIMBaseLayer):
    """
      Represents a voxel layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataConnection = 'CIMDataConnection'
        self.lighting = 'CIMVoxelLighting'
        self.isosurfaceContainerExpanded = False
        self.isosurfaceContainerVisible = True
        self.optimization = VoxelLayerOptimization.Visualization
        self.sectionContainerExpanded = False
        self.sectionContainerVisible = True
        self.selectedVariable = str()
        self.sliceContainerExpanded = False
        self.sliceContainerVisible = True
        self.snappable = True
        self.staticSections = []
        self.staticSectionContainerExpanded = False
        self.staticSectionContainerVisible = True
        self.surfaceContainerExpanded = False
        self.visualization = VoxelVisualization.Volume
        self.alignment = VoxelAlignment.Center
        self.volumes = []
        self.timeDefinition = 'CIMTimeDataDefinition'
        self.timeDisplayDefinition = 'CIMTimeDisplayDefinition'
    
class CIMWMSSubLayer(CIMSubLayerBase):
    """
      Represents a WMS service sublayer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.styleName = str()
    
class CIMAGSServiceConnection(CIMServiceConnection):
    """
      Represents an ArcGIS Server service connection.
    """
    """
      Represents an ArcGIS Server service connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.customParameters = []
        self.objectName = str()
        self.objectType = str()
        self.url = str()
        self.capabilities = str()
        self.serverConnection = 'CIMServerConnection'
        self.gdbVersion = str()
    
class CIMDCOMServerConnection(CIMServerConnection):
    """
      Represents a DCOM server connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.domain = str()
        self.hideUserProperty = True
        self.machine = str()
        self.managerURL = str()
        self.password = str()
        self.user = str()
    
class CIMDynamicServiceLayer(CIMServiceLayer):
    """
      Represents a dynamic service layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.imageFormat = esriImageFormat.esriImagePNG
        self.useTime = False
    
class CIMInternetServerConnectionBase(CIMServerConnection):
    """
      Represents the internet server connection base class.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.anonymous = True
        self.hideUserProperty = True
        self.password = str()
        self.url = str()
        self.user = str()
        self.authenticationInfo = str()
    
class CIMLANServerConnection(CIMServerConnection):
    """
      Represents a LAN service connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.machine = str()
    
class CIMMapImageLayer(CIMDynamicServiceLayer):
    """
      Represents an ArcGIS Map Service layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMOGCAPIMapTilesServiceConnection(CIMServiceConnection):
    """
      Represents a OGC API Map Tiles service connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.layerName = str()
        self.version = str()
        self.serverConnection = 'CIMInternetServerConnectionBase'
        self.style = str()
        self.imageFormat = str()
        self.tileMatrixSet = str()
        self.capabilitiesParameters = {}
        self.templateUrl = str()
    
class CIMOGCAPIServiceConnection(CIMServiceConnection):
    """
      Represents a OGCAPI service connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.serviceName = str()
        self.version = str()
        self.serverConnection = 'CIMInternetServerConnectionBase'
        self.capabilitiesParameters = {}
    
class CIMProjectServerConnection(CIMInternetServerConnectionBase):
    """
      Represents a project server connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.connectionMode = ConnectionMode.Consumer
        self.name = str()
        self.serverType = ServerType.AGS
        self.stagingFolder = str()
        self.useDefaultStagingFolder = True
    
class CIMStandardServiceConnection(CIMServiceConnection):
    """
      Represents a standard service connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.serviceProvider = str()
        self.serviceType = str()
        self.url = str()
        self.culture = str()
    
class CIMTiledServiceLayer(CIMServiceLayer):
    """
      Represents a tiled service layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.associatedFeatureLayerURI = str()
    
class CIMVoxelRangeValueFilter(CIMVoxelFilter):
    """
      Represents a voxel value filter.
        /// Filter based on the value of an specified variable.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.min = 0
        self.max = 0
    
class CIMVoxelStretchRenderer(CIMVoxelRenderer):
    """
      Represents a stretch renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.colorRamp = 'CIMColorRamp'
        self.minLabel = str()
        self.maxLabel = str()
        self.isDataFilterEnabled = False
        self.dataFilterMin = 0
        self.dataFilterMax = 0
        self.colorRangeMin = 0
        self.colorRangeMax = 0
        self.useTransparencyStops = False
        self.transparencyStopPositions = []
        self.transparencyStopValues = []
        self.heading = str()
        self.interpolation = VoxelInterpolationMode.Linear
        self.showFullDataRange = False
        self.numberFormat = 'CIMNumberFormat'
    
class CIMVoxelUniqueValueRenderer(CIMVoxelRenderer):
    """
      Represents a unique value renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.classes = []
        self.colorRamp = 'CIMColorRamp'
        self.heading = str()
        self.useDefaultColor = False
        self.defaultColor = 'CIMColor'
        self.defaultLabel = str()
        self.defaultDescription = str()
        self.unlistedValues = []
        self.showClassVisibility = False
    
class CIMVoxelValueFilter(CIMVoxelFilter):
    """
      Represents a voxel value filter.
        /// Filter based on the value of an specified variable.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.values = []
        self.mode = VoxelValueFilterMode.Exclude
    
class CIMWCSServiceConnection(CIMServiceConnection):
    """
      Represents a WCS service connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.coverageName = str()
        self.version = str()
        self.serverConnection = 'CIMInternetServerConnectionBase'
        self.capabilitiesParameters = {}
    
class CIMWFSServiceConnection(CIMServiceConnection):
    """
      Represents a WFS service connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.layerName = str()
        self.version = str()
        self.serverConnection = 'CIMInternetServerConnectionBase'
        self.capabilitiesParameters = {}
    
class CIMWMSLayer(CIMDynamicServiceLayer):
    """
      Represents an OGC WMS layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMWMSServiceConnection(CIMServiceConnection):
    """
      Represents a WMS service connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.layerName = str()
        self.version = str()
        self.serverConnection = 'CIMInternetServerConnectionBase'
        self.capabilitiesParameters = {}
        self.mapParameters = {}
    
class CIMWMTSServiceConnection(CIMServiceConnection):
    """
      Represents a WMTS service connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.layerName = str()
        self.version = str()
        self.serverConnection = 'CIMInternetServerConnectionBase'
        self.style = str()
        self.dimensions = {}
        self.imageFormat = str()
        self.tileMatrixSet = str()
        self.capabilitiesParameters = {}
        self.mapParameters = {}
        self.templateUrl = str()
    
class CIMInternetServerConnection(CIMInternetServerConnectionBase):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
