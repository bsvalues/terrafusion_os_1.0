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

class CIMChart():
    """
      Provides access to members that control chart properties.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.series = []
        self.generalProperties = 'CIMChartGeneralProperties'
        self.legend = 'CIMChartLegend'
        self.axes = []
        self.mapSelectionHandling = ChartMapSelectionHandling.Highlight
        self.metaData = str()
        self.multiSeriesChartProperties = 'CIMMultiSeriesChartProperties'
        self.enableServerSideProcessing = False
        self.chartType = ChartType.Basic
    
class CIMChartAxis():
    """
      Provides access to members that control chart axis properties.
    """
    def __init__(self, *args, **Kwargs):
        self.visible = True
        self.isLogarithmic = False
        self.title = str()
        self.showTitle = True
        self.useAutomaticTitle = True
        self.valueFormat = str()
        self.valueNumberFormat = 'CIMNumberFormat'
        self.dateTimeFormat = str()
        self.calculateAutomaticMinimum = True
        self.calculateAutomaticMaximum = True
        self.minimum = object()
        self.maximum = object()
        self.titleText = 'CIMChartTextProperties'
        self.labelText = 'CIMChartTextProperties'
        self.axisLineSymbolProperties = 'CIMChartLineSymbolProperties'
        self.guides = []
        self.labelCharacterLimit = 11
        self.zoomStartPosition = 0.0
        self.zoomEndPosition = 1.0
        self.inverted = False
        self.labelAngle = 0.0
        self.useAutomaticLabelAngle = True
        self.useAutomaticInterval = True
        self.interval = 0.0
    
class CIMChartDimensionalProfileBand():
    """
      Represents a band for a variable to be plotted over time.
    """
    def __init__(self, *args, **Kwargs):
        self.bandID = -1
        self.symbol = 'CIMSymbolReference'
        self.label = str()
        self.locationID = -1
        self.dimension = str()
        self.dimensionValues = []
        self.dimensionValuesSymbols = []
        self.dimensionValuesLabels = []
    
class CIMChartDimensionalProfileBands():
    """
      Represents the bands for a variable to be plotted over time.
    """
    def __init__(self, *args, **Kwargs):
        self.variable = str()
        self.bands = []
    
class CIMChartDimensionalProfileCCDCArguments():
    """
      Represents arguments to be used to plot change detection over time.
    """
    def __init__(self, *args, **Kwargs):
        self.temporalMaskBandIDs = []
        self.updatingFrequency = float('nan')
        self.chiSquaredThreshold = float('nan')
        self.minimumAnomaly = 0
    
class CIMChartDimensionalProfileDimensionValue():
    """
      Represents a dimension value for a given variable to be plotted 
      over time.
    """
    def __init__(self, *args, **Kwargs):
        self.value = float('nan')
        self.symbol = 'CIMSymbolReference'
        self.label = str()
        self.locationID = -1
    
class CIMChartDimensionalProfileDimensionValues():
    """
      Represents dimension values for a given variable to be plotted 
      over time.
    """
    def __init__(self, *args, **Kwargs):
        self.variable = str()
        self.dimension = str()
        self.values = []
    
class CIMChartDimensionalProfileLandTrendrArguments():
    """
      Represents arguments to be used to plot change detection over time.
    """
    def __init__(self, *args, **Kwargs):
        self.snappingDate = str()
        self.maximumSegments = 0
        self.vertexCountOvershoot = 0
        self.spikeThreshold = float('nan')
        self.recoveryThreshold = float('nan')
        self.preventOneYearRecovery = False
        self.recoveryIncreasingTrend = False
        self.outputOtherBands = False
        self.minimumObservations = 0
        self.bestModelProportion = float('nan')
        self.pValueThreshold = float('nan')
    
class CIMChartDimensionalProfileVariable():
    """
      Represents a variable to be plotted over time.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.symbol = 'CIMSymbolReference'
        self.label = str()
        self.dimension = str()
        self.dimensionValues = []
        self.dimensionValuesSymbols = []
        self.dimensionValuesLabels = []
    
class CIMChartFillSymbolProperties():
    """
      Provides access to members that control properties of the fill
        /// symbol.
    """
    def __init__(self, *args, **Kwargs):
        self.color = 'CIMColor'
        self.opacity = 0
        self.lineSymbolProperties = 'CIMChartLineSymbolProperties'
        self.visible = True
    
class CIMChartGeneralProperties():
    """
      Provides access to members that control general chart properties.
    """
    def __init__(self, *args, **Kwargs):
        self.title = str()
        self.showTitle = True
        self.useAutomaticTitle = True
        self.subTitle = str()
        self.showSubTitle = True
        self.footer = str()
        self.showFooter = True
        self.theme = str()
        self.titleText = 'CIMChartTextProperties'
        self.subTitleText = 'CIMChartTextProperties'
        self.footerText = 'CIMChartTextProperties'
        self.backgroundSymbolProperties = 'CIMChartFillSymbolProperties'
        self.gridLineSymbolProperties = 'CIMChartLineSymbolProperties'
    
class CIMChartGuide():
    """
      Define the properties to define a chart guide.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.label = str()
        self.labelText = 'CIMChartTextProperties'
        self.labelPosition = ChartPosition.ChartPosition_Top
        self.valueFrom = 0.0
        self.valueTo = 0.0
        self.timeFrom = GetPythonClass('datetime', 'datetime')
        self.timeTo = GetPythonClass('datetime', 'datetime')
        self.visible = True
        self.guideType = ChartGuideType.ChartGuideType_Line
        self.guideValueType = ChartValueType.ChartValueType_Numeric
        self.fillSymbolProperties = 'CIMChartFillSymbolProperties'
        self.polyline = []
    
class CIMChartLegend():
    """
      Provides access to members that control chart legend properties.
    """
    def __init__(self, *args, **Kwargs):
        self.visible = True
        self.title = str()
        self.showTitle = True
        self.alignment = ChartLegendAlignment.Right
        self.valueFormat = str()
        self.legendText = 'CIMChartTextProperties'
        self.legendTitle = 'CIMChartTextProperties'
    
class CIMChartLineSymbolProperties():
    """
      Provides access to members that control properties of the line
        /// symbol.
    """
    def __init__(self, *args, **Kwargs):
        self.visible = True
        self.width = 2
        self.style = ChartLineDashStyle.Solid
        self.color = 'CIMColor'
    
class CIMChartLocationDefinition():
    """
      Represents the definition of a location for which data is to be 
      plotted.
    """
    def __init__(self, *args, **Kwargs):
        self.geometry = GetPythonClass('arcpy', 'Geometry')
        self.symbol = 'CIMSymbolReference'
        self.label = str()
        self.enabled = True
        self.mapLocationSymbol = 'CIMSymbolReference'
    
class CIMChartMarkerSymbolProperties():
    """
      Provides access to members that control properties of the marker
        /// symbol.
    """
    def __init__(self, *args, **Kwargs):
        self.visible = True
        self.width = 2
        self.height = 2
        self.style = ChartMarkerSymbolStyle.Circle
        self.color = 'CIMColor'
        self.lineSymbolProperties = 'CIMChartLineSymbolProperties'
    
class CIMChartPieSlice():
    """
      Represents a slice in the pie chart.
    """
    def __init__(self, *args, **Kwargs):
        self.value = str()
        self.symbol = 'CIMChartFillSymbolProperties'
        self.label = str()
    
class CIMChartSeries():
    """
      Provides access to members that control chart series properties.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.uniqueName = str()
        self.fields = []
        self.orderFields = []
        self.groupFields = []
        self.whereClause = str()
        self.showLabels = False
        self.horizontalAxis = 0
        self.verticalAxis = 1
        self.colorType = ChartColorType.SingleColor
        self.fieldAggregation = []
        self.orderFieldsSortTypes = []
        self.visible = True
        self.dataLabelText = 'CIMChartTextProperties'
        self.multiSeries = False
        self.locations = []
        self.fieldExpressions = []
    
class CIMChartSurfaceProfileBand():
    """
      Represents a band to be plotted over a line.
    """
    def __init__(self, *args, **Kwargs):
        self.bandID = -1
        self.symbol = 'CIMSymbolReference'
        self.label = str()
    
class CIMChartSurfaceProfileDimensionValue():
    """
      Represents a dimension value for a given variable to be plotted 
      over a line.
    """
    def __init__(self, *args, **Kwargs):
        self.value = float('nan')
        self.time = GetPythonClass('datetime', 'datetime')
        self.symbol = 'CIMSymbolReference'
        self.label = str()
    
class CIMChartSurfaceProfileDimensionValues():
    """
      Represents dimension values for a given variable to be plotted 
      over a line.
    """
    def __init__(self, *args, **Kwargs):
        self.variable = str()
        self.values = []
        self.dimension = str()
    
class CIMChartSurfaceProfileLayer():
    """
      Represents the layer to be used as an additional input.
    """
    def __init__(self, *args, **Kwargs):
        self.uRI = str()
        self.bandID = -1
        self.symbol = 'CIMSymbolReference'
        self.label = str()
        self.dimensionValue = float('nan')
        self.time = GetPythonClass('datetime', 'datetime')
    
class CIMChartTextProperties():
    """
      Represents chart text properties.
    """
    def __init__(self, *args, **Kwargs):
        self.fontFillColor = 'CIMColor'
        self.fontOutlineColor = 'CIMColor'
        self.fontFamilyName = str()
        self.fontItalic = False
        self.fontSize = 12
        self.fontWeight = ChartFontWeight.Normal
        self.textCase = ChartTextCase.Normal
        self.textUnderline = False
        self.textStrikethrough = False
        self.textOverline = False
        self.visible = True
    
class CIMChartTimeBinningProperties():
    """
      Provides access to members that control time binning properties.
    """
    def __init__(self, *args, **Kwargs):
        self.timeAggregationType = ChartTimeAggregationType.eNone
        self.referenceTime = GetPythonClass('datetime', 'datetime')
        self.timeIntervalUnits = esriTimeUnits.esriTimeUnitsUnknown
        self.timeIntervalSize = 0.0
        self.calculateAutomaticTimeInterval = True
        self.trimIncompleteTimeInterval = False
    
class CIMChartTrajectoryProfileFeature():
    """
      Represents the definition of a track or point for which data is 
      to be plotted.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = -1
        self.symbol = 'CIMSymbolReference'
        self.label = str()
        self.enabled = False
        self.trajectoryID = -1
    
class CIMChartTrajectoryProfileLayer():
    """
      Represents the layer to be used as an additional input.
    """
    def __init__(self, *args, **Kwargs):
        self.uRI = str()
        self.iD = -1
        self.symbol = 'CIMSymbolReference'
        self.label = str()
        self.enabled = False
    
class CIMChartTrajectoryProfileVariable():
    """
      Represents the definition of a variable for which data is to be 
      plotted.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.symbol = 'CIMSymbolReference'
        self.label = str()
        self.enabled = False
    
class CIMMultiSeriesChartProperties():
    """
      Provides access to members that control multi series chart properties.
    """
    def __init__(self, *args, **Kwargs):
        self.enabled = False
    
class CIMChartBarSeries(CIMChartSeries):
    """
      Provides access to members that control bar chart series.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.multipleBarType = ChartMultiBarType.SideBySide
        self.barSize = 90
        self.fillSymbolProperties = 'CIMChartFillSymbolProperties'
        self.verticalOrientation = True
        self.sortedCategoryValues = []
        self.showMovingAverage = False
        self.movingAverageLineSymbolProperties = 'CIMChartLineSymbolProperties'
        self.movingAveragePeriod = 7
        self.timeBinningProperties = 'CIMChartTimeBinningProperties'
        self.nullPolicy = ChartNullPolicy.Null
        self.matchLayerSymbology = False
        self.showNullCategory = False
        self.nullCategoryFillSymbolProperties = 'CIMChartFillSymbolProperties'
        self.nullCategoryLabel = str()
    
class CIMChartBoxPlotSeries(CIMChartSeries):
    """
      Provides access to members that control box plot series.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fillSymbolProperties = 'CIMChartFillSymbolProperties'
        self.verticalOrientation = True
        self.showOutliers = False
        self.showInnerPoints = False
        self.showMean = False
        self.standardizeValues = False
        self.sortedCategoryValues = []
    
class CIMChartCalendarHeatSeries(CIMChartSeries):
    """
      Provides access to members that control CalendarHeat series.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.columnTimeUnits = esriTimeUnits.esriTimeUnitsUnknown
        self.rowTimeUnits = esriTimeUnits.esriTimeUnitsUnknown
        self.nullPolicy = ChartNullPolicy.Null
        self.noDataColor = 'CIMColor'
        self.classificationMethod = ClassificationMethod.GeometricalInterval
        self.breaksCount = 0
        self.minimumBreak = 0.0
        self.breaks = []
        self.breakColors = []
        self.colorRamp = 'CIMColorRamp'
        self.includeLeapDay = False
        self.aggregateCalendarView = True
    
class CIMChartDataClockSeries(CIMChartSeries):
    """
      Provides access to members that control DataClock series.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.wedgeTimeUnits = esriTimeUnits.esriTimeUnitsUnknown
        self.ringTimeUnits = esriTimeUnits.esriTimeUnitsUnknown
        self.trimIncompleteTimeInterval = False
        self.nullPolicy = ChartNullPolicy.Null
        self.noDataColor = 'CIMColor'
        self.classificationMethod = ClassificationMethod.GeometricalInterval
        self.breaksCount = 0
        self.minimumBreak = 0.0
        self.breaks = []
        self.breakColors = []
        self.colorRamp = 'CIMColorRamp'
        self.showWedgeLabel = True
        self.wedgeLabelText = 'CIMChartTextProperties'
    
class CIMChartDimensionalProfileSeries(CIMChartSeries):
    """
      Represents a dimensional profile chart series.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.plotType = ChartDimensionalProfilePlotType.Variable
        self.variables = []
        self.bands = 'CIMChartDimensionalProfileBands'
        self.dimensionValues = 'CIMChartDimensionalProfileDimensionValues'
        self.standardizeValues = False
        self.timeIntervalSize = -1.0
        self.timeIntervalUnits = esriTimeUnits.esriTimeUnitsMonths
        self.timeAggregationType = ChartTimeAggregationType.eNone
        self.trimIncompleteTimeInterval = False
        self.dateTimeFormat = str()
        self.trendLineSymbolProperties = 'CIMChartLineSymbolProperties'
        self.showTrendLine = False
        self.trendLineFitType = ChartTrendLineFitType.ChartTrendLineFitType_Linear
        self.trendOrder = 1
        self.showTrendEquation = False
        self.spatialAggregationType = ChartAggregationType.eNone
        self.cCDCArguments = 'CIMChartDimensionalProfileCCDCArguments'
        self.landTrendrArguments = 'CIMChartDimensionalProfileLandTrendrArguments'
        self.timeExtent = TimeExtent
        self.verticalOrientation = True
    
class CIMChartHistogramSeries(CIMChartSeries):
    """
      Provides access to members that control histogram series.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.binCount = 8
        self.showMean = False
        self.showMedian = False
        self.showStandardDeviation = False
        self.fillSymbolProperties = 'CIMChartFillSymbolProperties'
        self.meanLineSymbolProperties = 'CIMChartLineSymbolProperties'
        self.medianLineSymbolProperties = 'CIMChartLineSymbolProperties'
        self.standardDeviationLineSymbolProperties = 'CIMChartLineSymbolProperties'
        self.showComparisonDistribution = False
        self.dataTransformationType = ChartDataTransformationType.eNone
        self.dataTransformationParameters = []
        self.distributionLineSymbolProperties = 'CIMChartLineSymbolProperties'
        self.countField = str()
    
class CIMChartLineSeries(CIMChartSeries):
    """
      Provides access to members that control line series.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.lineSymbolProperties = 'CIMChartLineSymbolProperties'
        self.markerSymbolProperties = 'CIMChartMarkerSymbolProperties'
        self.timeAggregationType = ChartTimeAggregationType.eNone
        self.referenceTime = GetPythonClass('datetime', 'datetime')
        self.timeIntervalUnits = esriTimeUnits.esriTimeUnitsUnknown
        self.timeIntervalSize = 0.0
        self.calculateAutomaticTimeInterval = True
        self.trimIncompleteTimeInterval = False
        self.nullPolicy = ChartNullPolicy.Null
        self.verticalOrientation = True
        self.sortedCategoryValues = []
        self.smoothLine = False
    
class CIMChartMatrixHeatSeries(CIMChartSeries):
    """
      Provides access to members that control MatrixHeat series.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.nullPolicy = ChartNullPolicy.Null
        self.noDataColor = 'CIMColor'
        self.classificationMethod = ClassificationMethod.GeometricalInterval
        self.breaksCount = 0
        self.minimumBreak = 0.0
        self.breaks = []
        self.breakColors = []
        self.colorRamp = 'CIMColorRamp'
        self.columnSortedCategoryValues = []
        self.rowSortedCategoryValues = []
        self.rowsTimeBinningProperties = 'CIMChartTimeBinningProperties'
        self.columnsTimeBinningProperties = 'CIMChartTimeBinningProperties'
    
class CIMChartPieSeries(CIMChartSeries):
    """
      Provides access to members that control pie chart series.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.sliceAggregationThreshold = 5.0
        self.holePercentage = 0.0
        self.showLabelValue = True
        self.showLabelPercentage = False
        self.percentageDecimalPlaces = 1
        self.slices = []
    
class CIMChartProbabilityPlotSeries(CIMChartSeries):
    """
      Provides access to members that control probability plot series.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.probabilityPlotType = ChartProbabilityPlotType.NormalQQPlot
        self.dataTransformationType = ChartDataTransformationType.eNone
        self.dataTransformationParameters = []
        self.showReferenceLine = True
        self.markerSymbolProperties = 'CIMChartMarkerSymbolProperties'
        self.referenceLineSymbolProperties = 'CIMChartLineSymbolProperties'
    
class CIMChartProfileGraphSeries(CIMChartSeries):
    """
      Provides access to members that control profile graph series.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.lineSymbolProperties = 'CIMChartLineSymbolProperties'
        self.markerSymbolProperties = 'CIMChartMarkerSymbolProperties'
        self.horizontalUnit = str()
        self.verticalUnit = str()
        self.variableInYAxis1 = ProfileGraphVariableInYAxis.ProfileGraphVariableInYAxis_Z
        self.lineSeriesType = ProfileGraphLineSeriesType.ProfileGraphLineSeriesType_LineOnly
        self.trackCursor = False
        self.verticalExaggeration = 0.0
        self.showLoSPoints = True
        self.showLoSConnectingLine = True
        self.chain = False
        self.chainingTolerance = 0.001
    
class CIMChartScatterPlotMatrixSeries(CIMChartSeries):
    """
      Provides access to members that control scatter plot matrix series.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.showHistograms = False
        self.showTrendLine = False
        self.showAsRSquared = False
        self.fieldLabels = []
        self.scatterMarkerSymbolProperties = 'CIMChartMarkerSymbolProperties'
        self.trendLineSymbolProperties = 'CIMChartLineSymbolProperties'
        self.histogramFillSymbolProperties = 'CIMChartFillSymbolProperties'
        self.selectedMiniPlot = -2
        self.rSquareText = 'CIMChartTextProperties'
        self.selectionLineSymbolProperties = 'CIMChartLineSymbolProperties'
        self.displayOption = ChartSPMDisplayOption.PreviewPlot
        self.lowerLeftDisplayOption = ChartSPMDisplayOption.ScatterPlots
        self.lowerLeftColorRamp = 'CIMColorRamp'
        self.lowerLeftBreakColors = []
        self.upperRightColorRamp = 'CIMColorRamp'
        self.upperRightBreakColors = []
        self.diagonalOption = ChartSPMDiagonalOption.eNone
        self.sortByType = ChartSPMSortByType.RSquared
        self.sortDirection = ChartSortDirection.Ascending
        self.trendLineFitType = ChartTrendLineFitType.ChartTrendLineFitType_Linear
        self.trendOrder = 2
    
class CIMChartScatterSeries(CIMChartSeries):
    """
      Provides access to members that control point chart series.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.markerSymbolProperties = 'CIMChartMarkerSymbolProperties'
        self.showTrendLine = False
        self.trendLineSymbolProperties = 'CIMChartLineSymbolProperties'
        self.trendLineFitType = ChartTrendLineFitType.ChartTrendLineFitType_Linear
        self.trendOrder = 2
        self.showTrendEquation = False
        self.bubbleMinimumSize = 0.0
        self.bubbleMaximumSize = 0.0
        self.visualAggregationThreshold = 10000
        self.visualAggregationGridRowCount = 100
        self.visualAggregationGridColumnCount = 100
    
class CIMChartSpectralProfileSeries(CIMChartSeries):
    """
      Represents a chart spectral profile series.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.displayMode = SpectralProfileDisplayMode.MeanLine
        self.showOutliers = False
        self.standardizeValues = False
        self.horizontalUnit = SpectralProfileHorizontalUnit.Wavelengths
    
class CIMChartSurfaceProfileSeries(CIMChartSeries):
    """
      Represents a surface profile chart series.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.plotType = ChartSurfaceProfilePlotType.SingleLayer
        self.sampleDistance = float('nan')
        self.bands = []
        self.dimensionValues = 'CIMChartSurfaceProfileDimensionValues'
        self.layers = []
        self.horizontalUnit = str()
        self.verticalScale = 1.0
        self.variable = str()
        self.dimension = str()
    
class CIMChartTrajectoryProfileSeries(CIMChartSeries):
    """
      Represents a trajectory profile chart series.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.plotType = ChartTrajectoryProfilePlotType.Tracks
        self.variables = []
        self.features = []
        self.layers = []
        self.timeIntervalSize = -1.0
        self.timeIntervalUnits = esriTimeUnits.esriTimeUnitsMonths
        self.timeAggregationType = ChartTimeAggregationType.eNone
        self.trimIncompleteTimeInterval = False
        self.dateTimeFormat = str()
        self.areaOfInterestURI = str()
        self.verticalOrientation = True
        self.trajectoryIDsURI = str()
        self.nullPolicy = ChartNullPolicy.Null
    
class CIMGridChartProperties(CIMMultiSeriesChartProperties):
    """
      Provides access to members that control grid chart properties.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.miniChartsPerRow = 0
        self.selectedMiniChart = -1
        self.showPreviewChart = False
        self.useSeriesMinMaxForAxisX = False
        self.useSeriesMinMaxForAxisY = False
        self.selectionLineSymbolProperties = 'CIMChartLineSymbolProperties'
        self.miniChartOutlineSymbolProperties = 'CIMChartLineSymbolProperties'
        self.miniChartTitleText = 'CIMChartTextProperties'
    
