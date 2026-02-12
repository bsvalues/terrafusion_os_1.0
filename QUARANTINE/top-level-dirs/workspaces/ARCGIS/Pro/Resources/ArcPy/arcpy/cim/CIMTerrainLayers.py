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

class CIMColorClassBreak():
    """
      Represents a color class break.
    """
    def __init__(self, *args, **Kwargs):
        self.upperBound = 0.0
        self.label = str()
        self.description = str()
        self.color = 'CIMColor'
    
class CIMColorModulationInfo():
    """
      Indicates whether modulation should be used to render the point. 
      Low modulation values will darken the point color.
    """
    def __init__(self, *args, **Kwargs):
        self.field = str()
        self.minValue = 0.0
        self.maxValue = 255.0
    
class CIMColorUniqueValue():
    """
      Represents a color unique value.
    """
    def __init__(self, *args, **Kwargs):
        self.value = str()
        self.label = str()
        self.description = str()
        self.color = 'CIMColor'
        self.visible = True
    
class CIMContourIntervalScaleBreak():
    """
      Represents a contour interval scale break.
    """
    def __init__(self, *args, **Kwargs):
        self.upperBound = 0
        self.contourInterval = 0
    
class CIMLASPointSplatter():
    """
      Represents a LAS point splatter.
    """
    def __init__(self, *args, **Kwargs):
        self.splatMinimumSize = 4.0
        self.splatScale = 1.0
        self.useSplatHighlight = False
    
class CIMLASStretchClass():
    """
      Represents a LAS stretch class.
    """
    def __init__(self, *args, **Kwargs):
        self.label = str()
        self.value = 0.0
    
class CIMLASStretchInput():
    """
      Represents LAS stretch input.
    """
    def __init__(self, *args, **Kwargs):
        self.colorRamp = 'CIMColorRamp'
        self.stretchMax = 1.0
        self.stretchMin = 0.0
        self.gammaValue = 1.0
        self.invert = False
        self.lookup = []
        self.maxPercent = 2.0
        self.minPercent = 2.0
        self.numberFormat = 'CIMNumberFormat'
        self.standardDeviationParam = 2.0
        self.statsType = LASStretchStatsType.Dataset
        self.stretchAttribute = LASStretchAttribute.Elevation
        self.stretchClasses = []
        self.stretchStats = StatsHistogram
        self.stretchType = LASStretchType.DefaultFromSource
        self.useCustomStretchMinMax = False
        self.useGammaStretch = False
    
class CIMPointCloudAlgorithm():
    """
      Represents a point cloud algorithm.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMPointCloudFilter():
    """
      Represents a point cloud filter.
    """
    def __init__(self, *args, **Kwargs):
        self.field = str()
    
class CIMPointCloudRenderer():
    """
      Represents a point cloud renderer.
    """
    def __init__(self, *args, **Kwargs):
        self.pointShape = PointCloudShapeType.DiskFlat
        self.pointSizeAlgorithm = 'CIMPointCloudAlgorithm'
        self.colorModulation = 'CIMColorModulationInfo'
        self.fieldTransformType = PointCloudFieldTransformType.eNone
        self.field = str()
    
class CIMTinRenderer():
    """
      Represents a TIN renderer.
    """
    def __init__(self, *args, **Kwargs):
        self.illuminate = False
        self.maxScale = 0
        self.minScale = 0
    
from .CIMLayer import CIMBaseLayer
class CIMLASDatasetLayer(CIMBaseLayer):
    """
      Represents a LAS dataset layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.analysisToolsResolution = 1.0
        self.dataConnection = 'CIMDataConnection'
        self.displayField = str()
        self.fileExtentSymbol = 'CIMSymbolReference'
        self.fileNameSymbol = 'CIMSymbolReference'
        self.fullResolutionScale = 1000.0
        self.isFlattened = False
        self.lASDatasetFilter = str()
        self.maintainCurrentSurface = False
        self.pointBudget = 4000000
        self.pointCountPerCentimeter = 6
        self.renderers = []
        self.scaleSymbols = True
        self.showFileExtent = False
        self.showFileName = False
        self.showResolution = True
        self.useFullResolutionScale = False
        self.selectable = False
        self.eyeDomeLighting = 'CIMEyeDomeLighting'
        self.useDynamicLOD = False
    
class CIMPointCloudLayer(CIMBaseLayer):
    """
      Represents a point cloud layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.renderer = 'CIMPointCloudRenderer'
        self.dataConnection = 'CIMSceneDataConnection'
        self.pointsPerInch = 10
        self.pointsBudget = 4000000
        self.filters = []
        self.snappable = True
        self.eyeDomeLighting = 'CIMEyeDomeLighting'
    
from .CIMVectorLayers import CIMDataConnection
class CIMSceneDataConnection(CIMDataConnection):
    """
      Represents a scene data connection.
    """
    """
      Represents a scene data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.customParameters = []
        self.uRI = str()
    
class CIMTerrainLayer(CIMBaseLayer):
    """
      Represents a terrain layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.analysisToolsResolution = 0
        self.autoLOR = False
        self.currentResolution = 0
        self.dataConnection = 'CIMDataConnection'
        self.displayField = str()
        self.lockCurrentSurface = False
        self.pointBudget = 0
        self.pyramidHonored = False
        self.scaleSymbols = False
        self.showResolution = False
        self.renderers = []
        self.targetResolution = 0
        self.useOverviewTerrain = False
        self.usePointBudget = False
    
class CIMTinLayer(CIMBaseLayer):
    """
      Represents a TIN layer which displays TIN data sources, a data 
      structure that represents terrain data as a triangulated irregular 
      network.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataConnection = 'CIMDataConnection'
        self.displayField = str()
        self.renderers = []
        self.scaleSymbols = False
    
class CIMPointCloudBitFieldFilter(CIMPointCloudFilter):
    """
      Represents a point cloud bit field filter.
        /// Filters based on the bit-wise representation of the provided 
      field. /// For a point to be retained, its attribute field bits 
      must match /// BitsToSet and BitsToClear. Bits which are not explicitly 
      clear nor /// set, are ignored.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.requiredSetBits = []
        self.requiredClearBits = []
    
class CIMPointCloudClassBreaksRenderer(CIMPointCloudRenderer):
    """
      Represents a point cloud class breaks renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.breaks = []
    
class CIMPointCloudFixedSizeAlgorithm(CIMPointCloudAlgorithm):
    """
      Represents a point cloud fixed size algorithm.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.useRealWorldSymbolSizes = False
        self.size = 0.0
    
class CIMPointCloudRGBRenderer(CIMPointCloudRenderer):
    """
      Represents a point cloud RGB renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMPointCloudReturnFilter(CIMPointCloudFilter):
    """
      Represents a point cloud return filter.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.includedReturnsBitmask = -1
    
class CIMPointCloudSplatAlgorithm(CIMPointCloudAlgorithm):
    """
      Represents a point cloud splat algorithm.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.scaleFactor = 1.0
        self.minSize = 4.0
    
class CIMPointCloudStretchRenderer(CIMPointCloudRenderer):
    """
      Represents a point cloud stretch renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.rangeMin = 0.0
        self.rangeMax = 500.0
        self.colorRamp = 'CIMColorRamp'
    
class CIMPointCloudUniqueValueRenderer(CIMPointCloudRenderer):
    """
      Represents a point cloud unique value renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.classes = []
    
class CIMPointCloudValueFilter(CIMPointCloudFilter):
    """
      Represents a point cloud value filter.
        /// Filter points based on the value of an specified attribute.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.values = []
        self.mode = PointCloudValueFilterMode.Exclude
    
class CIMTerrainAttributeRenderer(CIMTinRenderer):
    """
      Represents a terrain attribute renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.attributeFieldName = str()
        self.embeddedDataSources = []
    
class CIMTinColorRampRenderer(CIMTerrainAttributeRenderer):
    """
      Represents a TIN color ramp renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.breaks = []
        self.classificationMethod = ClassificationMethod.NaturalBreaks
        self.colorRamp = 'CIMColorRamp'
        self.cursorType = TerrainDrawCursorType.Composite
        self.description = str()
        self.heading = str()
        self.label = str()
        self.minimumBreak = 0
        self.numberFormat = 'CIMNumberFormat'
        self.showClassGaps = False
        self.sortClassesAscending = False
        self.symbol = 'CIMSymbolReference'
    
class CIMTinContourRenderer(CIMTinRenderer):
    """
      Represents a TIN contour renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.contourDescription = str()
        self.contourInterval = 0
        self.contourLabel = str()
        self.contourSymbol = 'CIMSymbolReference'
        self.indexContourDescription = str()
        self.indexContourFactor = 0
        self.indexContourLabel = str()
        self.indexContourSymbol = 'CIMSymbolReference'
        self.referenceContourHeight = 0
        self.useIntervalScaleBreaks = False
        self.contourIntervalScaleBreaks = []
    
class CIMTinFaceClassBreaksRenderer(CIMTinColorRampRenderer):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMTinNodeElevationRenderer(CIMTinColorRampRenderer):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMTinSimpleRenderer(CIMTinRenderer):
    """
      Represents a TIN simple renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.description = str()
        self.label = str()
        self.symbol = 'CIMSymbolReference'
    
class CIMTinUniqueValueRenderer(CIMTerrainAttributeRenderer):
    """
      Represents a TIN unique value renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.colorScheme = str()
        self.description = str()
        self.groups = []
        self.heading = str()
        self.label = str()
        self.lookupStyleset = str()
        self.symbol = 'CIMSymbolReference'
        self.useDefaultSymbol = False
        self.colorRamp = 'CIMColorRamp'
    
class CIMLASPointElevationRenderer(CIMTinColorRampRenderer):
    """
      Represents a LAS point elevation renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.modulateIntensity = False
        self.pointSplatter = 'CIMLASPointSplatter'
        self.useSplat = False
        self.colorModulation = 'CIMColorModulationInfo'
    
class CIMLASStretchRenderer(CIMTerrainAttributeRenderer):
    """
      Represents a LAS stretch renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.modulationInput = 'CIMLASStretchInput'
        self.modulationWeight = 0.0
        self.pointSplatter = 'CIMLASPointSplatter'
        self.stretchDrawingType = LASStretchDrawingType.Symbol
        self.stretchSourceInput = 'CIMLASStretchInput'
        self.tintSymbol = 'CIMSymbolReference'
        self.useModulation = False
        self.useSplat = False
        self.colorModulation = 'CIMColorModulationInfo'
        self.heading = str()
    
class CIMLASUniqueValueRenderer(CIMTinUniqueValueRenderer):
    """
      Represents a LAS unique value renderer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.attribute = 32
        self.modulateIntensity = False
        self.pointSplatter = 'CIMLASPointSplatter'
        self.useSplat = False
        self.colorModulation = 'CIMColorModulationInfo'
    
class CIMTerrainDirtyAreaRenderer(CIMTinSimpleRenderer):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMTerrainPointAttributeGraduatedRenderer(CIMTinColorRampRenderer):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMTerrainPointAttributeUniqueRenderer(CIMTinUniqueValueRenderer):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMTerrainPointElevationRenderer(CIMTinColorRampRenderer):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMTinBreaklineRenderer(CIMTinUniqueValueRenderer):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMTinEdgeRenderer(CIMTinSimpleRenderer):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMTinFaceRenderer(CIMTinSimpleRenderer):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMTinFaceValueRenderer(CIMTinUniqueValueRenderer):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMTinNodeRenderer(CIMTinSimpleRenderer):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMTinNodeValueRenderer(CIMTinUniqueValueRenderer):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
