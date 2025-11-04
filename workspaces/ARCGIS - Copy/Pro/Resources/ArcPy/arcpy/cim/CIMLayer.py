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

class CIM3DLayerProperties():
    """
      Represents 3D layer properties which contain properties used for 
      3D draw.
    """
    def __init__(self, *args, **Kwargs):
        self.castShadows = True
        self.isLayerLit = True
        self.layerFaceCulling = FaceCulling3D.eNone
        self.maxDistance = 0.0
        self.maxPreloadDistance = 0.0
        self.minDistance = 0.0
        self.minPreloadDistance = 0.0
        self.preloadTextureCutoffHigh = 0.3
        self.preloadTextureCutoffLow = 0.6
        self.textureCutoffHigh = 0.3
        self.textureCutoffLow = 0.6
        self.textureDownscalingFactor = 0
        self.useCompressedTextures = True
        self.verticalExaggeration = 1.0
        self.exaggerationMode = ExaggerationMode.ScaleZ
        self.verticalUnit = str()
        self.depthPriority = 0
        self.lighting = Lighting3D.OneSideDataNormal
        self.optimizeMarkerTransparency = True
        self.useDepthWritingForTransparency = False
        self.enable2DSymbolPerspectiveScaling = False
    
class CIMDefinitionFilter():
    """
      Contains filters so that only features satisfying these definitions 
      will be displayed.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.definitionExpression = str()
        self.geometryURI = str()
        self.spatialReference = GetPythonClass('arcpy', 'SpatialReference')
    
class CIMDisplayEffect():
    """
      Represents all display effects.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.enabled = True
    
class CIMElementStorage():
    """
      Represents a series of graphic elements stored offline.
    """
    """
      Represents a series of graphic elements stored offline.
    """
    def __init__(self, *args, **Kwargs):
        self.elements = []
        self.spatialReference = GetPythonClass('arcpy', 'SpatialReference')
        self.symbols = []
    
class CIMEyeDomeLighting():
    """
      Represents eye-dome lighting properties.
    """
    def __init__(self, *args, **Kwargs):
        self.isEnabled = True
        self.strength = 0.0
        self.radius = 1.0
    
class CIMFeatureLayerEffect():
    """
      Represents properties defining feature effects.
    """
    def __init__(self, *args, **Kwargs):
        self.whereClause = str()
        self.includedFeaturesEffects = []
        self.excludedFeaturesEffects = []
    
class CIMLayerEffect():
    """
      Represents layer effects.
    """
    def __init__(self, *args, **Kwargs):
        self.effects = []
    
class CIMLayerElevationSurface():
    """
      Represents a layer elevation surface.
    """
    def __init__(self, *args, **Kwargs):
        self.offsetZ = 0.0
        self.elevationSurfaceLayerURI = str()
        self.isRelativeToScene = False
    
class CIMLayerScaleVisibilityOptions():
    """
      Represents a layer's scale visibility options.
    """
    def __init__(self, *args, **Kwargs):
        self.savedMaxScale = 0.0
        self.savedMinScale = 0.0
        self.showLayerAtAllScales = False
    
class CIMLayerTemplate():
    """
      Represents a layer template.
    """
    def __init__(self, *args, **Kwargs):
        self.layerTemplateId = str()
        self.parameters = {}
        self.dataURI = str()
    
class CIMSubLayerBase():
    """
      Represents sublayer base class.
    """
    def __init__(self, *args, **Kwargs):
        self.description = str()
        self.expanded = False
        self.maxScale = 0
        self.minScale = 0
        self.name = str()
        self.showLegends = True
        self.subLayerID = str()
        self.visibility = True
        self.serviceLayerID = -1
    
class CIMSymbolLayerDrawing():
    """
      Represents symbol layer drawing properties.
    """
    def __init__(self, *args, **Kwargs):
        self.symbolLayers = []
        self.useSymbolLayerDrawing = False
    
class CIMSymbolLayerIdentifier():
    """
      Represents symbol layer identifier.
    """
    def __init__(self, *args, **Kwargs):
        self.symbolLayerName = str()
    
from .CIMCore import CIMDefinition
class CIMBaseLayer(CIMDefinition):
    """
      Represents the base layer class.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.attribution = str()
        self.description = str()
        self.layerElevation = 'CIMLayerElevationSurface'
        self.expanded = False
        self.layer3DProperties = 'CIM3DLayerProperties'
        self.layerMasks = []
        self.layerType = MapLayerType.Operational
        self.maxScale = 0.0
        self.minScale = 0.0
        self.layerScaleVisibilityOptions = 'CIMLayerScaleVisibilityOptions'
        self.showLegends = True
        self.transparency = 0.0
        self.visibility = True
        self.displayCacheType = DisplayCacheType.Permanent
        self.maxDisplayCacheAge = 5.0
        self.layerTemplate = 'CIMLayerTemplate'
        self.popupInfo = 'CIMPopupInfo'
        self.showPopups = True
        self.serviceLayerID = -1
        self.charts = []
        self.searchable = False
        self.refreshRate = -1.0
        self.refreshRateUnit = esriTimeUnits.esriTimeUnitsSeconds
        self.showMapTips = False
        self.customProperties = []
        self.webMapLayerID = str()
        self.blendingMode = BlendingMode.Alpha
        self.allowDrapingOnIntegratedMesh = True
        self.rasterizeOnExport = False
        self.useVisibilityTimeExtent = False
        self.visibilityTimeExtent = TimeExtent
        self.enableLayerEffects = False
        self.layerEffects = []
    
from .CIMVectorLayers import CIMDataConnection
class CIMKMLDataConnection(CIMDataConnection):
    """
      Represents a KML data connection.
    """
    """
      Represents a KML data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.customParameters = []
        self.kMLURI = str()
    
class CIMColorDisplayEffect(CIMDisplayEffect):
    """
      Represents color display effects. These effects transform the pixel 
      colors to apply the effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMCompositeSubLayer(CIMSubLayerBase):
    """
      Represents a composite sublayer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.subLayers = []
    
class CIMContrastEffect(CIMColorDisplayEffect):
    """
      Represents a contrast effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.strength = 100.0
    
class CIMElevationSurfaceLayer(CIMBaseLayer):
    """
      Represents an elevation surface layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.elevationSourceLayers = []
        self.elevationMode = ElevationMode.CustomSurface
        self.verticalExaggeration = 1.0
        self.color = 'CIMColor'
        self.enableSurfaceShading = False
        self.surfaceTINShadingMode = SurfaceTINShadingMode.Smooth
        self.useSurfaceEffect = False
        self.surfaceEffect = 'CIMSurfaceEffect'
    
class CIMGeodatabaseErrorLayer(CIMBaseLayer):
    """
      Represents GDB Error tables as a composite layer and draws the 
      errors.
    """
    """
      Represents GDB Error tables as a composite layer and draws the 
      errors.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.standaloneTables = []
        self.pointLayer = str()
        self.lineLayer = str()
        self.polygonLayer = str()
        self.objectTable = str()
        self.workspaceConnection = 'CIMWorkspaceConnection'
    
class CIMGraphicsLayer(CIMBaseLayer):
    """
      Represents a layer of simple graphic elements.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.elementStorageURI = str()
        self.referenceScale = 0.0
        self.barrierWeight = BarrierWeight.High
        self.snappable = True
        self.selectable = True
        self.showInvisibleGraphics = False
        self.invisibleGraphicsColor = 'CIMColor'
    
class CIMGrayScaleEffect(CIMColorDisplayEffect):
    """
      Represents a grayscale effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.strength = 0.0
    
class CIMGroupLayer(CIMBaseLayer):
    """
      Represents a group layer which is a simple ordered collection of 
      other layers.
    """
    """
      Represents a group layer which is a simple ordered collection of 
      other layers.
    """
    """
      Represents a group layer which is a simple ordered collection of 
      other layers.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.standaloneTables = []
        self.sublayerVisibilityMode = SublayerVisibilityMode.Independent
        self.layers = []
        self.symbolLayerDrawing = 'CIMSymbolLayerDrawing'
    
class CIMHueRotateEffect(CIMColorDisplayEffect):
    """
      Represents a hue rotate effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.angle = 0.0
    
class CIMInvertEffect(CIMColorDisplayEffect):
    """
      Represents an invert effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.strength = 0.0
    
class CIMKMLLayer(CIMBaseLayer):
    """
      Represents a KML layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataConnection = 'CIMKMLDataConnection'
        self.selectable = False
        self.selectionColor = 'CIMColor'
        self.useSelectionColor = False
        self.labelVisibility = True
        self.textSymbol = 'CIMTextSymbol'
    
class CIMRasterDisplayEffect(CIMDisplayEffect):
    """
      Represents raster display effects. These effects require rasterizing 
      the layer to apply the effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMSaturateEffect(CIMColorDisplayEffect):
    """
      Represents a saturate effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.strength = 100.0
    
class CIMScaleDependentLayerEffect(CIMLayerEffect):
    """
      Represents scale-dependent layer effects.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.scale = 0.0
    
class CIMSepiaEffect(CIMColorDisplayEffect):
    """
      Represents a sepia effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.strength = 0.0
    
class CIMSubLayer(CIMSubLayerBase):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMTopologyLayer(CIMBaseLayer):
    """
      Represents a topology dataset as a layer and draws its errors,
        /// exceptions, and areas in need of validation.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.allLayers = []
        self.topologyConnection = 'CIMDataConnection'
    
class CIMTransparencyEffect(CIMColorDisplayEffect):
    """
      Represents a transparency effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.strength = 0.0
    
class CIMBloomEffect(CIMRasterDisplayEffect):
    """
      Represents a bloom effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.radius = 0.0
        self.threshold = 0.0
        self.intensity = 0.0
    
class CIMBlurEffect(CIMRasterDisplayEffect):
    """
      Represents a blur effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.blurRadius = 0.0
    
class CIMBrightnessEffect(CIMColorDisplayEffect):
    """
      Represents a brightness effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.strength = 100.0
    
class CIMDropShadowEffect(CIMRasterDisplayEffect):
    """
      Represents a drop shadow effect.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.xOffset = 0.0
        self.yOffset = 0.0
        self.shadowRadius = 0.0
        self.color = 'CIMColor'
    
