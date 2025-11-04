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

class CIMBAAreaOfInterest():
    """
      Represents Business Analyst Color Coded Layer Area Of Interest 
      properties.
    """
    def __init__(self, *args, **Kwargs):
        self.areaOfInterestDataConnection = 'CIMStandardDataConnection'
        self.areaOfInterestItems = []
    
class CIMBAAreaOfInterestItem():
    """
      Represents Business Analyst Color Coded Layer area of interest 
      item.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
    
class CIMBABenchmarkComparisonsProperties():
    """
      Benchmark Comparisons properties.
    """
    def __init__(self, *args, **Kwargs):
        self.nameField = str()
        self.siteAttributes = []
        self.variables = []
        self.addDifferenceField = False
        self.addPercentDifferenceField = False
        self.benchmarkMethod = BABenchmarkMethod.eNone
        self.benchmarkFeatureID = str()
        self.benchmarkStyle = BABenchmarkStyle.AboveOrBelow
        self.aboveColor = 'CIMRGBColor'
        self.belowColor = 'CIMRGBColor'
        self.inBetweenColor = 'CIMRGBColor'
        self.quartile1Color = 'CIMRGBColor'
        self.quartile2Color = 'CIMRGBColor'
        self.quartile3Color = 'CIMRGBColor'
        self.quartile4Color = 'CIMRGBColor'
        self.geographyLevels = []
    
class CIMBAColorCodedLayerParameters():
    """
      Represents Business Analyst Color Coded Layer Properties.
    """
    def __init__(self, *args, **Kwargs):
        self.dataSource = str()
        self.rendererProperties = 'CIMBARendererProperties'
        self.variable = str()
        self.areaOfInterest = 'CIMBAAreaOfInterest'
        self.activeLevelOfDetail = str()
        self.levelsOfDetail = []
        self.boundaryMode = BABoundaryMode.Geographies
        self.resultsPaneSettings = 'CIMBAResultsPaneSettings'
    
class CIMBALevelOfDetail():
    """
      Represents Business Analyst Color Coded Layer level of detail.
    """
    def __init__(self, *args, **Kwargs):
        self.levelID = str()
        self.dataConnection = 'CIMStandardDataConnection'
    
class CIMBARendererProperties():
    """
      Represents Business Analyst Color Coded Layer renderer properties.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMBAResultsPaneSettings():
    """
      Represents Business Analyst Results Pane settings.
    """
    def __init__(self, *args, **Kwargs):
        self.matchTopBottomChartToLayerSymbology = True
        self.histogramSubsetSelectionMethod = BAHistogramSubsetSelectionMethod.Percentage
        self.histogramSubsetSelectionValue = 5
        self.histogramBinCount = 8
        self.histogramFillSymbolProperties = 'CIMChartFillSymbolProperties'
        self.tableSortDirection = SortOrderType.Ascending
        self.tableSortField = str()
    
class CIMBASuitabilityAnalysisCriterion():
    """
      Represents a Business Analyst Suitability Analysis criterion.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = str()
        self.title = str()
        self.valueField = str()
        self.weight = 0
        self.isEnabled = True
        self.isLocked = False
        self.influence = BACriterionInfluence.Positive
        self.min = 0
        self.max = 0
        self.idealValue = 0
        self.targetValue = 0
    
class CIMBASuitabilityAnalysisLayer():
    """
      Represents a Business Analyst Suitability Analysis layer.
    """
    def __init__(self, *args, **Kwargs):
        self.suitabilityAnalysisSubLayer = 'CIMBASuitabilityAnalysisSubLayer'
        self.targetSite = 'CIMBASuitabilityAnalysisTargetSiteSubLayer'
        self.criteria = []
        self.presetMethod = BAPresetMethod.CombineValues
        self.preprocessingMethod = BAPreprocessingMethod.MinMax
        self.combinationMethod = BACombinationMethod.GeometricMean
        self.finalScoreScale = BAFinalScoreMethod.eNone
        self.rendererProperties = 'CIMBARendererProperties'
        self.classificationTransparency = 0
        self.outlineColor = 'CIMColor'
        self.outlineWidth = 1
        self.resultsPaneSettings = 'CIMBASuitabilityAnalysisResultsPaneSettings'
    
class CIMBASuitabilityAnalysisSubLayer():
    """
      Represents a sub-layer of a Business Analyst Suitability Analysis 
      layer.
    """
    def __init__(self, *args, **Kwargs):
        self.featureClassDataConnection = 'CIMStandardDataConnection'
    
class CIMBAVariableListVariable():
    """
      Represents variable of at variable list.
    """
    def __init__(self, *args, **Kwargs):
        self.names = []
        self.valueTypes = []
    
class CIMHuffModelAttractivenessVariable():
    """
      Represents attractiveness variable used in Huff Model.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.exponent = 0
    
class CIMHuffModelDistanceParameters():
    """
      Distance properties of the Huff Model calibration item.
    """
    def __init__(self, *args, **Kwargs):
        self.exponent = 0
        self.dataSource = str()
        self.distanceUnits = str()
        self.useTimeUnits = False
        self.timeUnits = esriTimeUnits.esriTimeUnitsMinutes
        self.useNetworkDistance = False
        self.travelModeId = str()
        self.towardsFacility = True
        self.timeOfDay = GetPythonClass('datetime', 'datetime')
        self.timeZone = str()
    
class CIMSegmentationProfile():
    """
      Business Analyst segmentation profile. Segmentation profile represents 
      distribution
  /// of the market (e.g. people or households) between 
      the segments of the segmentation system.
  /// For example, it 
      could represent the distribution of the customer base between the 
      segments.
  /// Segmentation profile can include the volumetric 
      information in addition to the counts,
  /// e.g. it could also 
      provide the distribution of the sales between segments.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.segmentationSystem = str()
        self.segmentationBase = str()
        self.hasVolumetricData = False
        self.author = str()
        self.creationDate = GetPythonClass('datetime', 'datetime')
        self.lastRevisionDate = GetPythonClass('datetime', 'datetime')
        self.counts = []
        self.volumetricValues = []
    
class CIMSegmentationTarget():
    """
      Business Analyst segmentation target. Target is a collection of 
      market segments
  /// that are treated as a whole. A user might 
      apply the same marketing strategy to
  /// all segments in a target, 
      for example.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.segmentIDs = []
        self.color = 'CIMColor'
    
class CIMSegmentationTargetGroup():
    """
      Business Analyst target group. Target group represents a collection 
      of targets.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.segmentationSystem = str()
        self.description = str()
        self.author = str()
        self.creationDate = GetPythonClass('datetime', 'datetime')
        self.lastRevisionDate = GetPythonClass('datetime', 'datetime')
        self.targets = []
        self.visualizationProperties = 'CIMSegmentationTargetGroupVisualizationProperties'
    
class CIMSegmentationTargetGroupVisualizationProperties():
    """
      Visualization properties of Business Analyst Segmentation target 
      group.
    """
    def __init__(self, *args, **Kwargs):
        self.targetProfile = 'CIMSegmentationProfile'
        self.baseProfile = 'CIMSegmentationProfile'
        self.thresholdIndex = 0
        self.thresholdComposition = 0
    
from .CIMDocument import CIMVersion
class CIMBAVariableList(CIMVersion):
    """
      Represents Business Analyst variable list.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.name = str()
        self.iconData = str()
        self.author = str()
        self.tags = str()
        self.dataSource = str()
        self.creationDate = GetPythonClass('datetime', 'datetime')
        self.lastRevisionDate = GetPythonClass('datetime', 'datetime')
        self.variables = []
    
class CIMHuffModelCalibrationDocument(CIMVersion):
    """
      Represents a Huff Model calibration.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.rMSError = 0
        self.rMSErrorLinear = 0
        self.attractivenessVariables = []
        self.distanceParameters = 'CIMHuffModelDistanceParameters'
        self.facilities = 'CIMDataConnection'
        self.facilitiesIDFieldName = str()
        self.customers = 'CIMDataConnection'
        self.customersIDFieldName = str()
        self.customerWeightFieldName = str()
        self.salesPotential = 'CIMDataConnection'
        self.salesPotentialIDFieldName = str()
        self.author = str()
        self.creationDate = GetPythonClass('datetime', 'datetime')
        self.lastRevisionDate = GetPythonClass('datetime', 'datetime')
    
class CIMSegmentationProfileDocument(CIMVersion):
    """
      Represents a document used for saving segmentation profile.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.profile = 'CIMSegmentationProfile'
    
class CIMSegmentationTargetGroupDocument(CIMVersion):
    """
      Represents a document used for saving target group.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.targetGroup = 'CIMSegmentationTargetGroup'
    
class CIMBAFeatureClassAreaOfInterestItem(CIMBAAreaOfInterestItem):
    """
      Represents Business Analyst Color Coded Layer feature class based 
      area of interest item.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataConnection = 'CIMStandardDataConnection'
    
class CIMBAFeatureLayerAreaOfInterestItem(CIMBAAreaOfInterestItem):
    """
      Represents Business Analyst Color Coded Layer feature layer based 
      area of interest item.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.uRI = str()
    
class CIMBAFieldBasedCriterion(CIMBASuitabilityAnalysisCriterion):
    """
      Represents a Business Analyst Suitability Analysis field-based 
      criterion.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fieldName = str()
    
class CIMBAGraduatedColorsRendererProperties(CIMBARendererProperties):
    """
      Represents Business Analyst Color Coded Layer graduated colors 
      renderer properties.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.numBreaks = 5
        self.classificationMethod = ClassificationMethod.NaturalBreaks
        self.colorRamp = 'CIMColorRamp'
        self.classificationField = str()
    
class CIMBAPointLayerBasedCriterion(CIMBASuitabilityAnalysisCriterion):
    """
      Represents a Business Analyst Suitability Analysis point layer-based 
      criterion.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataSource = str()
        self.siteLayerIdField = str()
        self.pointLayerDataConnection = 'CIMStandardDataConnection'
        self.pointCriterionType = BAPointCriterionType.Count
        self.weightField = str()
        self.statisticsType = BAPointStatisticsType.Sum
        self.distanceUnits = str()
        self.useTimeUnits = False
        self.timeUnits = esriTimeUnits.esriTimeUnitsMinutes
        self.travelModeId = str()
        self.useNetworkDistance = False
        self.siteCentersLayerDataConnection = 'CIMStandardDataConnection'
        self.siteCentersLayerId = str()
        self.cutoffDistance = 0
    
class CIMBAStdGeoAreaOfInterestItem(CIMBAAreaOfInterestItem):
    """
      Represents Business Analyst Color Coded Layer standard geography 
      based area of interest item.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.levelID = str()
        self.geographyID = str()
    
class CIMBASuitabilityAnalysisResultsPaneSettings(CIMBAResultsPaneSettings):
    """
      Represents Suitability Analysis Results Pane settings.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.histogramCriterionID = str()
        self.showRegressionLineOnScatterplot = True
        self.scatterplotChartType = BAScatterplotChartType.BubbleChart
        self.scatterplotXAxisCriterionID = str()
        self.scatterplotYAxisCriterionID = str()
        self.scatterplotDotSizeCriterionID = str()
    
class CIMBASuitabilityAnalysisTargetSiteSubLayer(CIMBASuitabilityAnalysisSubLayer):
    """
      Represents a Business Analyst Suitability Analysis target site 
      layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.sourceTargetSiteDataConnection = 'CIMStandardDataConnection'
        self.selectedSourceTargetSiteObjectID = str()
    
class CIMBAUniqueValueRendererProperties(CIMBARendererProperties):
    """
      Represents Business Analyst Color Coded Layer unique values renderer 
      properties.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.colorRamp = 'CIMColorRamp'
        self.classificationField = str()
    
class CIMBAVariableBasedCriterion(CIMBASuitabilityAnalysisCriterion):
    """
      Represents a Business Analyst Suitability Analysis demographic 
      variable-based criterion.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataSource = str()
        self.variable = str()
    
