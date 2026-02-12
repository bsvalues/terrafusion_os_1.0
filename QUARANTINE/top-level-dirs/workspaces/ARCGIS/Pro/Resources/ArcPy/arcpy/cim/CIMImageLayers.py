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

class CIMAuxiliaryRasterProperties():
    """
      Represents auxiliary raster properties.
    """
    def __init__(self, *args, **Kwargs):
        self.bandIndexes = []
        self.extent = GetPythonClass('arcpy', 'Extent')
        self.height = 0
        self.width = 0
    
class CIMMosaicRule():
    """
      Represents a mosaic rule.
    """
    def __init__(self, *args, **Kwargs):
        self.ascending = True
        self.fIDs = []
        self.lockRasterID = str()
        self.mosaicMethod = RasterMosaicMethod.eNone
        self.mosaicOperatorType = RasterMosaicOperatorType.First
        self.orderByBaseValue = object()
        self.orderByFieldName = str()
        self.timeValue = TimeValue
        self.viewpoint = GetPythonClass('arcpy', 'Point')
        self.whereClause = str()
    
class CIMPansharpeningFilter():
    """
      Represents a pansharpening filter.
    """
    def __init__(self, *args, **Kwargs):
        self.panImage = 'CIMDataConnection'
        self.pansharpeningType = PansharpeningType.IHS
        self.infraredImage = 'CIMDataConnection'
        self.rWeight = 0.0
        self.gWeight = 0.0
        self.bWeight = 0.0
        self.iWeight = 0.0
    
class CIMRangeDimensionValue():
    """
      Represents a range dimension name and value pair used to define 
      the multidimensional display definition for the current display 
      slice.
    """
    def __init__(self, *args, **Kwargs):
        self.rangeDimensionName = str()
        self.rangeDimensionValue = 'CIMRange'
    
class CIMRasterClassBreak():
    """
      Represents a raster class break.
    """
    def __init__(self, *args, **Kwargs):
        self.upperBound = 0.0
        self.label = str()
        self.description = str()
        self.color = 'CIMColor'
    
class CIMRasterColorCorrection():
    """
      Represents a raster color correction configuration.
    """
    def __init__(self, *args, **Kwargs):
        self.preStretchType = ColorCorrectionStretchType.eNone
        self.colorBalanceMethod = ColorBalanceMethod.eNone
        self.colorMatchingMethod = ColorMatchingMethod.eNone
        self.needContrastAdjustment = False
        self.targetColorSurfaceType = TargetColorSurfaceType.SingleColorPoint
        self.targetColorRaster = 'CIMDataConnection'
        self.userDefinedReference = False
        self.referenceOID = -1
    
class CIMRasterColorizer():
    """
      Represents a raster colorizer.
    """
    def __init__(self, *args, **Kwargs):
        self.resamplingType = RasterResamplingType.NearestNeighbor
        self.contrast = 0
        self.brightness = 0
        self.noDataColor = 'CIMColor'
        self.name = str()
    
class CIMRasterColorizerMapping():
    """
      Represents a raster colorizer mapping.
    """
    def __init__(self, *args, **Kwargs):
        self.rasterOID = 0
        self.colorizerIndex = 0
    
class CIMRasterDimensionalDefinition():
    """
      Represents a set of criteria used to define the multidimensional 
      extent of a raster layer.
    """
    def __init__(self, *args, **Kwargs):
        self.variableName = str()
        self.dimensionName = str()
        self.minimumValues = []
        self.maximumValues = []
    
class CIMRasterHistogramEditInfo():
    """
      Represents raster histogram custom stretch edit info.
    """
    def __init__(self, *args, **Kwargs):
        self.breakPointsX = []
        self.breakPointsY = []
        self.editType = RasterHistogramEditType.Lines
    
class CIMRasterMultidimensionalDisplayDefinition():
    """
      Represents a multidimensional display definition for the current 
      display slice.
    """
    def __init__(self, *args, **Kwargs):
        self.variableName = str()
        self.timeValue = TimeExtent
        self.hasRangeDimension = False
        self.rangeDimensionName = str()
        self.rangeDimensionValue = 'CIMRange'
        self.additionalDimensionValues = []
    
class CIMRasterMultidimensionalExtentDefinition():
    """
      Represents a multidimensional extent applicable to a raster layer.
    """
    def __init__(self, *args, **Kwargs):
        self.subsetDefinitions = []
        self.areaOfInterest = GetPythonClass('arcpy', 'Geometry')
    
class CIMRasterStretchClass():
    """
      Represents a raster stretch class.
    """
    def __init__(self, *args, **Kwargs):
        self.label = str()
        self.value = 0
    
class CIMRasterUniqueValueClass():
    """
      Represents a raster unique value class.
    """
    def __init__(self, *args, **Kwargs):
        self.values = []
        self.label = str()
        self.description = str()
        self.color = 'CIMColor'
        self.editable = False
        self.visible = False
    
class CIMRasterUniqueValueGroup():
    """
      Represents a raster unique value group.
    """
    def __init__(self, *args, **Kwargs):
        self.classes = []
        self.heading = str()
    
class CIMRenderingRule():
    """
      Represents a raster rendering rule.
    """
    def __init__(self, *args, **Kwargs):
        self.description = str()
        self.name = str()
        self.variableName = str()
        self.arguments = {}
        self.definition = str()
    
class CIMVideoTimelineIndicator():
    """
      Represents an indicator on a video timeline.
    """
    def __init__(self, *args, **Kwargs):
        self.label = str()
    
from .CIMVectorLayers import CIMFeatureLayer
class CIMFeatureMosaicSubLayer(CIMFeatureLayer):
    """
      Represents mosaic feature sub layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.mosaicSubLayerType = MosaicSubLayerType.Boundary
    
from .CIMLayer import CIMBaseLayer
class CIMMosaicLayer(CIMBaseLayer):
    """
      Represents a mosaic layer corresponding to a mosaic dataset.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.boundaryLayer = str()
        self.footprintLayer = str()
        self.imageLayer = str()
        self.seamlineLayer = str()
        self.mosaicDatasetConnection = 'CIMDataConnection'
        self.timeDefinition = 'CIMTimeDataDefinition'
        self.timeDisplayDefinition = 'CIMTimeDisplayDefinition'
        self.timeFields = 'CIMTimeTableDefinition'
        self.definitionExpression = str()
        self.definitionExpressionName = str()
        self.definitionFilterChoices = []
        self.rangeDefinitions = []
        self.activeRangeName = str()
        self.activeVariables = []
        self.pageDefinition = 'CIMPageDefinition'
    
from .CIMVectorLayers import CIMDataConnection
class CIMNITFDataConnection(CIMDataConnection):
    """
      Represents a NITF data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.uRI = str()
    
class CIMNitfFeatureSubLayer(CIMFeatureLayer):
    """
      Represents NITF feature sub layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMNitfLayer(CIMBaseLayer):
    """
      Represents a NITF composite layer.
    """
    """
      Represents a NITF composite layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.standaloneTables = []
        self.dataConnection = 'CIMDataConnection'
        self.layers = []
        self.extraItems = []
    
class CIMRasterBandDataConnection(CIMDataConnection):
    """
      Represents a raster band data connection.
    """
    """
      Represents a raster band data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.workspaceConnectionString = str()
        self.workspaceFactory = WorkspaceFactory.SDE
        self.customWorkspaceFactoryCLSID = str()
        self.dataset = str()
        self.datasetType = esriDatasetType.esriDTAny
        self.rasterBandName = str()
    
from .CIMVectorLayers import CIMGeoFeatureLayerBase
class CIMRasterCatalogLayer(CIMGeoFeatureLayerBase):
    """
      Represents a raster catalog layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.displayRastersThreshold = 9
        self.drawRastersOnly = False
        self.fixedLabelPositions = False
        self.colorizerMapping = []
        self.colorizers = []
        self.resamplingType = RasterResamplingType.NearestNeighbor
        self.transitionScale = 0.0
        self.useColorCorrection = False
        self.useScale = False
        self.wireFrameSymbol = 'CIMSymbolReference'
        self.sortFieldAscending = False
        self.sortField = str()
        self.colorCorrection = 'CIMRasterColorCorrection'
    
class CIMRasterLayer(CIMBaseLayer):
    """
      Represents a raster layer which displays raster imagery stored 
      in a raster dataset.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataConnection = 'CIMDataConnection'
        self.colorizer = 'CIMRasterColorizer'
        self.attributeTable = 'CIMRasterTable'
        self.timeDisplayDefinition = 'CIMTimeDisplayDefinition'
        self.timeDimensionFields = 'CIMTimeDimensionDefinition'
        self.timeDefinition = 'CIMTimeDataDefinition'
        self.auxiliaryRasterProperties = 'CIMAuxiliaryRasterProperties'
        self.autoComputeStatsHistogram = False
        self.rangeDefinitions = []
        self.activeRangeName = str()
        self.activeVariables = []
        self.multidimensionalExtent = 'CIMRasterMultidimensionalExtentDefinition'
        self.activeSlice = 'CIMRasterMultidimensionalDisplayDefinition'
        self.renderingRule = 'CIMRenderingRule'
        self.activeCustomColorizer = str()
        self.customColorizers = []
    
from .CIMCore import CIMDefinition
class CIMStandaloneVideo(CIMDefinition):
    """
      Represents a standalone video.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataConnection = 'CIMVideoDataConnection'
        self.footprintColor = 'CIMColor'
        self.elapsedTime = 0.0
        self.visibility = True
        self.expanded = True
        self.frameCenterGraphic = 'CIMVideoGraphicElement'
        self.frameOutlineGraphic = 'CIMVideoGraphicElement'
        self.platformTrailGraphic = 'CIMVideoGraphicElement'
        self.platformPositionGraphic = 'CIMVideoGraphicElement'
        self.bookmarkIndicators = []
        self.exportFrameIndicators = []
        self.exportToPPTIndicators = []
        self.exportFramesIndicators = []
        self.metadataToCSVIndicators = []
        self.recordVideoIndicators = []
        self.exportSegmentIndicators = []
        self.recordSegmentsIndicators = []
        self.selectedKLVChannels = []
    
class CIMVideoDataConnection(CIMDataConnection):
    """
      Represents a video data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.uRI = str()
        self.anonymous = True
    
from .CIMLayout import CIMGraphicElement
class CIMVideoGraphicElement(CIMGraphicElement):
    """
      Represents video-related graphic being displayed on the map.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMImageServiceLayer(CIMRasterLayer):
    """
      Represents an image service layer corresponding to an ArcGIS Server 
      image service.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.compression = str()
        self.compressionQuality = 0
        self.drawFootprints = False
        self.featureTable = 'CIMFeatureTable'
        self.footprintDrawMode = RasterFootprintDrawMode.OnlyPrimary
        self.footprintSymbol = 'CIMSymbolReference'
        self.mosaicRule = 'CIMMosaicRule'
        self.selectable = True
        self.selectionColor = 'CIMColor'
        self.selectionSymbol = 'CIMSymbolReference'
        self.useSelectionSymbol = True
        self.ignoreRenderingRuleOnIdentify = False
        self.useServiceCache = False
        self.pageDefinition = 'CIMPageDefinition'
    
class CIMNitfImageSubLayer(CIMRasterLayer):
    """
      Represents NITF image sub layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMRasterCMYKColorizer(CIMRasterColorizer):
    """
      Represents a raster CMYK colorizer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.backgroundColor = 'CIMColor'
        self.backgroundValueBlack = 0
        self.backgroundValueCyan = 0
        self.backgroundValueMagenta = 0
        self.backgroundValueYellow = 0
        self.blackBandIndex = 3
        self.cyanBandIndex = 0
        self.displayBackgroundValue = True
        self.invert = False
        self.magentaBandIndex = 1
        self.specificationHistogramBlack = StatsHistogram
        self.specificationHistogramCyan = StatsHistogram
        self.specificationHistogramMagenta = StatsHistogram
        self.specificationHistogramYellow = StatsHistogram
        self.standardDeviationParam = 2.0
        self.stretchStatsBlack = StatsHistogram
        self.stretchStatsCyan = StatsHistogram
        self.stretchStatsMagenta = StatsHistogram
        self.stretchStatsType = RasterStretchStatsType.Dataset
        self.stretchStatsYellow = StatsHistogram
        self.stretchType = RasterStretchType.Count
        self.useBlackMapping = True
        self.useCyanMapping = True
        self.useDefaultMapping = True
        self.useMagentaMapping = True
        self.useYellowMapping = True
        self.yellowBandIndex = 2
    
class CIMRasterClassifyColorizer(CIMRasterColorizer):
    """
      Represents a raster classify colorizer.
    """
    """
      Represents a raster classify colorizer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.normalizationField = str()
        self.normalizationTotal = 0.0
        self.normalizationType = DataNormalizationMethod.Nothing
        self.classBreaks = []
        self.classificationMethod = ClassificationMethod.NaturalBreaks
        self.colorRamp = 'CIMColorRamp'
        self.exclusionColor = 'CIMColor'
        self.exclusionDescription = str()
        self.exclusionLabel = str()
        self.exclusionRanges = []
        self.exclusionValues = []
        self.field = str()
        self.minimumBreak = 0.0
        self.showClassGaps = False
        self.showInAscendingOrder = True
        self.useExclusionColor = False
        self.numberFormat = 'CIMNumberFormat'
        self.heading = str()
    
class CIMRasterColorMapColorizer(CIMRasterColorizer):
    """
      Represents a raster color map colorizer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.colors = []
        self.bandID = -1
        self.labels = []
        self.min = 0
        self.max = 255
        self.numberFormat = 'CIMNumberFormat'
        self.values = []
    
class CIMRasterDiscreteColorColorizer(CIMRasterColorizer):
    """
      Represents a raster discrete color colorizer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.numColors = 0
        self.colormap = RasterColormap
        self.colorRamp = 'CIMColorRamp'
    
class CIMRasterRGBColorizer(CIMRasterColorizer):
    """
      Represents a raster RGB colorizer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.alphaBandIndex = -1
        self.backgroundColor = 'CIMColor'
        self.backgroundValueBlue = 0
        self.backgroundValueGreen = 0
        self.backgroundValueRed = 0
        self.blueBandIndex = 2
        self.blueLookup = []
        self.displayBackgroundValue = False
        self.eSRIStretchContrastB = 0
        self.eSRIStretchContrastG = 0
        self.eSRIStretchContrastR = 0
        self.eSRIStretchMeanB = 0
        self.eSRIStretchMeanG = 0
        self.eSRIStretchMeanR = 0
        self.gammaB = 1.0
        self.gammaG = 1.0
        self.gammaR = 1.0
        self.greenBandIndex = 1
        self.greenLookup = []
        self.invert = False
        self.lumLookup = []
        self.maxPercent = 2.0
        self.minPercent = 2.0
        self.pansharpeningFilter = 'CIMPansharpeningFilter'
        self.redBandIndex = 0
        self.redLookup = []
        self.specificationHistogramBlue = StatsHistogram
        self.specificationHistogramGreen = StatsHistogram
        self.specificationHistogramRed = StatsHistogram
        self.standardDeviationsParam = 2.0
        self.stretchStatsBlue = StatsHistogram
        self.stretchStatsGreen = StatsHistogram
        self.stretchStatsRed = StatsHistogram
        self.stretchStatsType = RasterStretchStatsType.Dataset
        self.stretchType = RasterStretchType.Count
        self.useAlphaBand = False
        self.useBlueBand = True
        self.useDefaultMapping = True
        self.useGammaStretch = False
        self.useGreenBand = True
        self.useRedBand = True
        self.heading = str()
        self.useCustomStretchMinMax = False
        self.customStretchMinRed = 0.0
        self.customStretchMinGreen = 0.0
        self.customStretchMinBlue = 0.0
        self.customStretchMaxRed = 1.0
        self.customStretchMaxGreen = 1.0
        self.customStretchMaxBlue = 1.0
        self.histogramEditInfoRed = 'CIMRasterHistogramEditInfo'
        self.histogramEditInfoGreen = 'CIMRasterHistogramEditInfo'
        self.histogramEditInfoBlue = 'CIMRasterHistogramEditInfo'
    
class CIMRasterShadedReliefColorizer(CIMRasterColorizer):
    """
      Represents a raster shaded relief colorizer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.colorRamp = 'CIMColorRamp'
        self.hillShadeType = ColorizerHillshadeType.Traditional
        self.scalingType = ColorizerScalingType.eNone
        self.pixelSizePower = 0.664
        self.pixelSizeFactor = 0.024
        self.azimuth = 315.0
        self.altitude = 45.0
        self.removeEdgeEffect = False
        self.useMapIlluminationProperties = False
        self.zFactor = 1.0
    
class CIMRasterStretchColorizer(CIMRasterColorizer):
    """
      Represents a raster stretch colorizer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.backgroundColor = 'CIMColor'
        self.backgroundValue = 0.0
        self.bandIndex = 0
        self.colorRamp = 'CIMColorRamp'
        self.colorScheme = str()
        self.customStretchMax = 1.0
        self.customStretchMin = 0.0
        self.displayBackgroundValue = False
        self.eSRIStretchContrast = 0
        self.eSRIStretchMean = 0
        self.gammaValue = 1.0
        self.invert = False
        self.lookup = []
        self.maxPercent = 2.0
        self.minPercent = 2.0
        self.standardDeviationParam = 2.0
        self.statsType = RasterStretchStatsType.Dataset
        self.stretchClasses = []
        self.stretchStats = StatsHistogram
        self.stretchType = RasterStretchType.Count
        self.useCustomStretchMinMax = False
        self.useGammaStretch = False
        self.numberFormat = 'CIMNumberFormat'
        self.heading = str()
        self.specificationHistogram = StatsHistogram
        self.histogramEditInfo = 'CIMRasterHistogramEditInfo'
        self.useAdvancedLabeling = False
    
class CIMRasterUniqueValueColorizer(CIMRasterColorizer):
    """
      Represents a raster unique value colorizer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.defaultColor = 'CIMColor'
        self.useDefaultColor = False
        self.fieldName = str()
        self.groups = []
        self.colorRamp = 'CIMColorRamp'
        self.defaultLabel = str()
        self.defaultDescription = str()
        self.numberFormat = 'CIMNumberFormat'
    
class CIMRasterVectorFieldColorizer(CIMRasterColorizer):
    """
      Represents a raster vector field colorizer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.magnitudeBandIndex = 0
        self.directionBandIndex = 1
        self.isUVComponents = False
        self.referenceSystem = SymbolRotationType.Geographic
        self.flowRepresentation = FlowRepresentationType.From
        self.symbolTileSize = 50.0
        self.symbolTileSizeUnits = SymbolTileUnitType.Pixels
        self.symbolizationType = SymbolizationType.SingleArrow
        self.symbol = 'CIMSymbolReference'
        self.classBreaks = []
        self.minimumClassBreak = 0
        self.minimumMagnitude = float('inf')
        self.maximumMagnitude = float('-inf')
        self.minimumSymbolSize = 20.0
        self.maximumSymbolSize = 80.0
        self.fromUnit = SpeedUnitType.Unknown
        self.toUnit = SpeedUnitType.Unknown
        self.numberFormat = 'CIMNumberFormat'
    
class CIMVideoTimelineEventIndicator(CIMVideoTimelineIndicator):
    """
      Represents an event indicator on a video timeline.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.time = -1
    
class CIMVideoTimelineRangeIndicator(CIMVideoTimelineIndicator):
    """
      Represents a range indicator on a video timeline.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.minimum = -1
        self.maximum = -1
    
class CIMImageMosaicSubLayer(CIMImageServiceLayer):
    """
      Represents an image mosaic sublayer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.mosaicSubLayerType = MosaicSubLayerType.Boundary
    
