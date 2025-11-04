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
from enum import Enum

class BABenchmarkMethod(Enum):
    """
      Specifies options for setting a benchmark. Site attributes and variables
        /// for the input features are compared against the benchmark.
    """
    Average = 1
    Median = 2
    Feature = 3
    eNone = 4

class BABenchmarkStyle(Enum):
    """
      Specifies the colors used in the results table fields to show differences 
      from the benchmark.
    """
    AboveOrBelow = 1
    AboveInBetweenOrBelow = 2
    Quartiles = 3

class BABoundaryMode(Enum):
    """
      Represents Color Coded Layer bounday type.
    """
    Geographies = 1
    H3Hexagons = 2

class BACombinationMethod(Enum):
    """
      Represents Suitability Analysis combination  method.
    """
    Sum = 1
    Mean = 2
    Product = 3
    GeometricMean = 4

class BACriterionInfluence(Enum):
    """
      Represents Suitability Analysis criterion influence.
    """
    Positive = 1
    Inverse = 2
    Ideal = 3
    TargetSite = 4

class BAFinalScoreMethod(Enum):
    """
      Represents Suitability Analysis final score scale method.
    """
    eNone = 0
    Method0_1 = 1
    Method0_100 = 2

class BAHistogramSubsetSelectionMethod(Enum):
    """
      Represents histogram chart subset selection methods.
    """
    Outliers = 1
    Percentage = 2
    StandardDeviation = 3

class BAPointCriterionType(Enum):
    """
      Represents Suitability Analysis point layer based criterion type. 
      Defines the type of spatial relationship to be used as criteria.
    """
    Count = 1
    Weight = 2
    MinDistance = 3

class BAPointStatisticsType(Enum):
    """
      Represents Suitability Analysis point layer based criterion statistics 
      type. The type of statistical operation to be applied to the weighted 
      field.
    """
    Sum = 1
    Ave = 2
    StdDev = 3
    Min = 4
    Max = 5

class BAPreprocessingMethod(Enum):
    """
      Represents Suitability Analysis preprocessing method.
    """
    MinMax = 1
    Percentile = 2
    ZScore = 3
    Raw = 4

class BAPresetMethod(Enum):
    """
      Represents Suitability Analysis preset method.
    """
    CombineValues = 1
    CompoundDifferences = 2
    Custom = 3

class BAScatterplotChartType(Enum):
    """
      Represents scatterplot chart types.
    """
    Scatterplot = 1
    BubbleChart = 2

class BAVariableListValueType(Enum):
    """
      Represents variable value type.
    """
    Number = 0
    Percent = 1
    Average = 2
    Index = 3

class ChartAggregationType(Enum):
    """
      Options for choosing what aggregation type is to be used while 
      calculating values.
    """
    eNone = 0
    Minimum = 1
    Maximum = 2
    Mean = 3
    Median = 4
    Sum = 5
    Majority = 6
    Minority = 7

class ChartColorType(Enum):
    """
      Provides a type of coloring that chart series uses.
    """
    SingleColor = 0
    ColorMatch = 1
    CustomColor = 2

class ChartDataTransformationType(Enum):
    """
      Types of a data transformation to apply before calculating histogram 
      bins and counts.
    """
    eNone = 0
    Logarithmic = 1
    SquareRoot = 2
    Inverse = 3
    BoxCox = 4

class ChartDimensionalProfilePlotType(Enum):
    """
      Represents the temporal profile plot type.
    """
    Variables = 0
    Bands = 1
    DimensionValues = 2
    Variable = 3
    Band = 4
    CCDC = 5
    LandTrendr = 6
    Dimension = 7

class ChartFontWeight(Enum):
    """
      Chart font weight types.
    """
    Lighter = 0
    Normal = 1
    Bold = 2

class ChartGuideType(Enum):
    """
      Specifies the type of guide.
    """
    ChartGuideType_Line = 0
    ChartGuideType_Range = 1
    ChartGuideType_Polyline = 2

class ChartLegendAlignment(Enum):
    """
      Chart legend alignment options.
    """
    Left = 0
    Right = 1
    Top = 2
    Bottom = 3

class ChartLineDashStyle(Enum):
    """
      Chart line dash style.
    """
    Solid = 0
    Dot = 1
    Dash = 2
    DashDot = 3
    LongDash = 4
    LongDashDot = 5

class ChartMapSelectionHandling(Enum):
    """
      Provides a choice of how map selection is processed in the chart.
    """
    eNone = 0
    Highlight = 1
    BuildFromSelectionSet = 2

class ChartMarkerSymbolStyle(Enum):
    """
      Chart marker symbol style.
    """
    Circle = 0
    Square = 1
    Diamond = 2
    Triangle = 3

class ChartMultiBarType(Enum):
    """
      Standard multiple bar series placement options.
    """
    eNone = 0
    SideBySide = 1
    Stacked = 2
    Stacked100 = 3

class ChartNullPolicy(Enum):
    """
      Options to handle null values.
    """
    Null = 0
    Zero = 1
    Interpolate = 2

class ChartPosition(Enum):
    """
      Specifies the position of the content for a target.
    """
    ChartPosition_Center = 0
    ChartPosition_Top = 1
    ChartPosition_Bottom = 2
    ChartPosition_Left = 3
    ChartPosition_Right = 4

class ChartProbabilityPlotType(Enum):
    """
      Chart probability plot types.
    """
    NormalQQPlot = 0
    QQPlot = 1

class ChartSPMDiagonalOption(Enum):
    """
      Scatter plot matrix diagonal display options.
    """
    eNone = 0
    Histogram = 1
    FieldName = 2

class ChartSPMDisplayOption(Enum):
    """
      Scatter plot matrix display options.
    """
    eNone = 0
    PreviewPlot = 1
    ScatterPlots = 2
    RSquared = 3
    PearsonsR = 4

class ChartSPMSortByType(Enum):
    """
      Scatter plot matrix sort-by type.
    """
    RSquared = 0
    PearsonsR = 1
    Alphabetical = 2
    Custom = 3

class ChartSortDirection(Enum):
    """
      Chart sort direction.
    """
    Ascending = 0
    Descending = 1

class ChartSurfaceProfilePlotType(Enum):
    """
      Represents the surface profile plot type.
    """
    SingleLayer = 0
    MultiLayer = 1

class ChartTextCase(Enum):
    """
      Options for choosing text cases for charts.
    """
    Normal = 0
    Uppercase = 1
    Lowercase = 2
    Capitalize = 3
    SmallCaps = 4

class ChartTimeAggregationType(Enum):
    """
      Options for choosing how time intervals are built for the aggregation 
      of a time based X-axis field.
    """
    eNone = 0
    EqualIntervalsFromStartTime = 1
    EqualIntervalsFromEndTime = 2
    CalendarIntervals = 3
    ReferenceTime = 4

class ChartTrajectoryProfilePlotType(Enum):
    """
      Represents the trajectory profile plot type.
    """
    Tracks = 0
    Track = 1
    Points = 2
    Layers = 3

class ChartTrendLineFitType(Enum):
    """
      A fit type for a trend line.
    """
    ChartTrendLineFitType_Linear = 0
    ChartTrendLineFitType_Exponential = 1
    ChartTrendLineFitType_Logarithmic = 2
    ChartTrendLineFitType_Power = 3
    ChartTrendLineFitType_Fourier = 4
    ChartTrendLineFitType_Polynomial = 5
    ChartTrendLineFitType_MinX = 6
    ChartTrendLineFitType_MinY = 7
    ChartTrendLineFitType_MaxX = 8
    ChartTrendLineFitType_MaxY = 9
    ChartTrendLineFitType_AverageX = 10
    ChartTrendLineFitType_AverageY = 11

class ChartType(Enum):
    """
      Represents the type of chart.
    """
    Basic = 0
    Combo = 1

class ChartValueType(Enum):
    """
      Specifies the type of value.
    """
    ChartValueType_Numeric = 0
    ChartValueType_Temporal = 1

class ProfileGraphLineSeriesType(Enum):
    """
      Choices of graph line series type.
    """
    ProfileGraphLineSeriesType_LineOnly = 0
    ProfileGraphLineSeriesType_LineAndVertices = 1
    ProfileGraphLineSeriesType_Fill = 2

class ProfileGraphVariableInYAxis(Enum):
    """
      Choices of what to display in the Y axis.
    """
    ProfileGraphVariableInYAxis_Z = 0
    ProfileGraphVariableInYAxis_M = 1

class SpectralProfileDisplayMode(Enum):
    """
      Spectral profile display modes.
    """
    MeanLine = 0
    Boxes = 1
    BoxesAndMeanLine = 2
    ConsolidatedBoxesAndMeanLine = 3

class SpectralProfileHorizontalUnit(Enum):
    """
      Spectral Profile horizontal units.
    """
    BandIDs = 0
    Wavelengths = 1
    BandNames = 2

class ColorSpaceType(Enum):
    """
      Specifies color spaces used for colors.
    """
    RGB = 1
    CMYK = 2
    Gray = 3
    HSV = 4
    HLS = 5
    XYZ = 7
    LAB = 8
    Spot = 9

class FixedColorRampArrangementType(Enum):
    """
      Specifies the arrangement type for fixed color ramp.
    """
    Default = 1
    Bivariate = 2

class PolarDirection(Enum):
    """
      Specifies the direction of the polar progression for the path from 
      the beginning hue to the ending hue.
    """
    Auto = 0
    Clockwise = 1
    Counterclockwise = 2

class DataEngineeringSourceFilterType(Enum):
    """
      Source filter to update the statistics.
    """
    eNone = 0
    Selection = 1
    Extent = 2
    SelectionAndExtent = 3

class DataEngineeringStatType(Enum):
    """
      Data engineering statistic type.
    """
    Mean = 0
    StandardDeviation = 1
    Maximum = 2
    Minimum = 3
    Median = 4
    Mode = 5
    FirstQuartile = 6
    ThirdQuartile = 7
    Sum = 8
    NumberOfNulls = 9
    Outliers = 10
    NumberUniqueValues = 11
    LeastCommon = 12
    Kurtosis = 13
    Skewness = 14
    CoefficientOfVariation = 15
    Range = 16
    IQR = 17
    Count = 18

class DataEngineeringTreatFieldAsType(Enum):
    """
      Treat Field as Type.
    """
    Numerical = 0
    Categorical = 1
    DateTime = 2
    Other = 3

class DataEngineeringViewLayoutType(Enum):
    """
      Statistic View Layout Type.
    """
    FieldsAndStatistics = 0
    OnlyStatistics = 1

class ProjectThumbnailAutomaticGenerationSource(Enum):
    """
      Represents the sources for automatic project thumbnail generation.
    """
    ActiveMap = 0
    SpecifiedMap = 1

class ProjectThumbnailGenerationMethod(Enum):
    """
      Represents the types of project thumbnail generation.
    """
    Manual = 0
    Automatic = 1

class SceneDrawingMode(Enum):
    """
      Represents the drawing modes of a scene view.
    """
    Perspective = 0
    Isometric = 1

class StatisticalDataCollectionSummaryType(Enum):
    """
      Represents the script language used by the statistical data collection.
    """
    Sum = 0
    Avg = 1
    Min = 2
    Max = 3
    Script = 4

class StatisticalReportFieldFormat(Enum):
    """
      How to display values of the field in reports.
    """
    Count = 0
    Percent = 1
    Currency = 2

class TableRowHeightType(Enum):
    """
      Represents the height of rows in the table view.
    """
    eNone = 0
    Single = 1
    Double = 2
    Triple = 3

class DepthOfFieldMaxBlur(Enum):
    """
      Represents the kernel sizes for depth of field camera effect.
    """
    Small = 0
    Medium = 1
    Large = 2
    VeryLarge = 3

class AltitudeMode(Enum):
    """
      Relative to the ground.
    """
    ClampToGround = 0
    RelativeToGround = 1
    Absolute = 2

class AnimationTransition(Enum):
    """
      Specifies the method of transition for a value in a keyframe.
    """
    eNone = 0
    Linear = 1
    Stepped = 2
    Hop = 3
    FixedArc = 4
    AdjustableArc = 5
    Hold = 6

class BaseElevationType(Enum):
    """
      A list of base elevation types.
    """
    Expression = 0
    Surface = 1
    Shape = 2

class BillboardMode(Enum):
    """
      A list of different billboard modes.
    """
    eNone = 0
    SignPost = 1
    FaceNearPlane = 2

class ColorModel(Enum):
    """
      Specifies color model used for maps and layouts.
    """
    RGB = 0
    CMYK = 1

class ColorVisionDeficiencyType(Enum):
    """
      Color vision deficiency types.
    """
    eNone = 0
    Deuteranopia = 1
    Protanopia = 2
    Tritanopia = 3
    Achromatopsia = 4

class DominantSizeAxis(Enum):
    """
      Specifies the dominant size axis types.
    """
    Z = 0
    X = 1
    Y = 2

class ElevationMode(Enum):
    """
      Specifies the types of elevation surfaces.
    """
    BaseGlobeSurface = 0
    CustomSurface = 1
    eNone = 2

class ExtrusionType(Enum):
    """
      The types of extrusion.
    """
    eNone = 0
    MinZ = 1
    MaxZ = 2
    Base = 3
    Absolute = 4

class FaceCulling3D(Enum):
    """
      The types of face culling.
    """
    Backface = 0
    Frontface = 1
    eNone = 2
    FromGeometry = 3

class GradientStrokeMethod(Enum):
    """
      The different methods of gradient strokes.
    """
    AcrossLine = 0
    AlongLine = 1

class MapLayerType(Enum):
    """
      The types of map layers by use in the map or scene.
    """
    Operational = 0
    BasemapBackground = 1
    BasemapTopReference = 2
    MapNotes = 3

class MapViewingMode(Enum):
    """
      The map viewing modes.
    """
    Map = 0
    SceneLocal = 1
    SceneGlobal = 2
    MapStereo = 3

class OffsetCurveMethod(Enum):
    """
      Indicates the way the strokes will display at corners.
    """
    Square = 0
    Mitered = 1
    Bevelled = 2
    Rounded = 3

class OffsetCurveOption(Enum):
    """
      Indicates the way strokes will handle complex geometries.
    """
    Fast = 0
    Accurate = 1

class PrimitiveShapeType(Enum):
    """
      Indicates the types of primitive shapes.
    """
    Unknown = 0
    Cone = 1
    Cube = 2
    Cylinder = 3
    Diamond = 4
    Sphere = 5
    Tetrahedron = 6

class PrimitiveType3D(Enum):
    """
      Indicates the types of 3D primitives.
    """
    TriangleStrip = 0
    TriangleFan = 1
    TriangleList = 2
    PointList = 3
    LineList = 4

class RangeRelation(Enum):
    """
      Range relation types.
    """
    Overlaps = 0
    OverlapsStartWithinEnd = 1
    AfterStartOverlapsEnd = 2
    Within = 3

class RasterResamplingType(Enum):
    """
      Raster resampling types.
    """
    NearestNeighbor = 0
    BilinearInterpolation = 1
    CubicConvolution = 2
    Majority = 3
    BilinearInterpolationPlus = 4
    BilinearGaussianBlur = 5
    BilinearGaussianBlurPlus = 6
    Average = 7
    Minimum = 8
    Maximum = 9
    VectorAverage = 10

class RasterStretchStatsType(Enum):
    """
      Raster stretch statistics types.
    """
    AreaOfView = 0
    Dataset = 1
    GlobalStats = 2

class RasterStretchType(Enum):
    """
      Raster stretch types.
    """
    eNone = 0
    DefaultFromSource = 1
    Custom = 2
    StandardDeviations = 3
    HistogramEqualize = 4
    MinimumMaximum = 5
    HistogramSpecification = 6
    PercentMinimumMaximum = 7
    Count = 8
    ESRI = 9
    SquareRoot = 10
    Logarithm = 11

class RotationOrder(Enum):
    """
      Rotation order modes.
    """
    XYZ = 0
    ZXY = 1
    YXZ = 2

class ColorBalanceMethod(Enum):
    """
      A list of color balance methods.
    """
    Dodging = 0
    Histogram = 1
    StdDev = 2
    eNone = 3

class ColorCorrectionStretchType(Enum):
    """
      A list of color correction stretch types.
    """
    eNone = 0
    Adaptive = 1
    MinMax = 2
    StdDev = 3

class ColorMatchingMethod(Enum):
    """
      A list of color matching methods.
    """
    Statistics = 0
    Histogram = 1
    LinearCorrelation = 2
    eNone = 3

class ColorizerHillshadeType(Enum):
    """
      A list of hillshade types for colorizer.
    """
    Traditional = 0
    Multidirectional = 1

class ColorizerScalingType(Enum):
    """
      A list of scaling types for colorizer.
    """
    eNone = 0
    Adjusted = 1

class FlowRepresentationType(Enum):
    """
      A list of flow representation types.
    """
    From = 0
    To = 1

class MosaicSubLayerType(Enum):
    """
      Types of mosaic sublayers.
    """
    Boundary = 0
    Footprint = 1
    Image = 2
    Seamline = 3

class PansharpeningType(Enum):
    """
      Types of pansharpening.
    """
    IHS = 0
    Brovey = 1
    ESRI = 2
    Mean = 3

class RasterFootprintDrawMode(Enum):
    """
      Raster footprint draw modes.
    """
    All = 0
    OnlyPrimary = 1

class RasterHistogramEditType(Enum):
    """
      Raster histogram edit types.
    """
    Lines = 0
    Splines = 1
    Points = 2

class RasterMosaicMethod(Enum):
    """
      Raster mosaic methods.
    """
    eNone = 0
    Center = 1
    Nadir = 2
    Viewpoint = 3
    Attribute = 4
    LockRaster = 5
    Northwest = 6
    Seamline = 7

class RasterMosaicOperatorType(Enum):
    """
      Raster mosaic operator type.
    """
    First = 0
    Last = 1
    Min = 2
    Max = 3
    Mean = 4
    Blend = 5
    Sum = 6

class SpeedUnitType(Enum):
    """
      Speed unit types.
    """
    Unknown = 0
    MetersPerSecond = 1
    KilometersPerHour = 2
    Knots = 3
    FeetPerSecond = 4
    MilesPerHour = 5

class StretchType(Enum):
    """
      Stretch types.
    """
    Gamma = 0
    MinMax = 1
    StdDev = 2
    eNone = 3

class SymbolTileUnitType(Enum):
    """
      Symbol tile unit type.
    """
    Unknown = 0
    Feet = 1
    Miles = 2
    NauticalMiles = 3
    Meters = 4
    Kilometers = 5
    DecimalDegrees = 6
    Pixels = 100

class SymbolizationType(Enum):
    """
      Symbolization type.
    """
    Scalar = 0
    SingleArrow = 1
    WindBarbs = 2
    BeaufortWindKnots = 3
    BeaufortWindMetersPerSecond = 4
    OceanCurrentKnots = 5
    OceanCurrentMetersPerSecond = 6
    BeaufortWindMilesPerHour = 7
    BeaufortWindKilometersPerHour = 8
    ClassifiedArrow = 9
    Custom = 100

class TargetColorSurfaceType(Enum):
    """
      Target color surface type.
    """
    SingleColorPoint = 0
    ColorGrid = 1
    FirstOrderSurface = 2
    SecondOrderSurface = 3
    ThirdOrderSurface = 4

class CentralityRelationshipInterpretation(Enum):
    """
      Specifies the way relationships are interpreted for centrality 
      computations.
    """
    Undirected = 0
    Directed = 1
    Reversed = 2

class CentralityScoresNormalization(Enum):
    """
      Specifies the normalization option for centrality scores.
    """
    eNone = 0
    Global = 1
    ByComponent = 2

class EventsTicksVisualization(Enum):
    """
      Represents how events ticks are displayed.
    """
    eNone = 0
    StartOnly = 1
    StartAndEnd = 2

class FilteredFindPathsEntityUsage(Enum):
    """
      Specifies how origin/destination entities are used in the filtered 
      find paths algorithm.
    """
    AnyOriginAnyDestination = 0
    AnyOriginAllDestinations = 1
    AllOriginsAnyDestination = 2
    AllOriginsAllDestinations = 3

class KGDurativeEventMissingOneTimeBehaviour(Enum):
    """
      Defines the behaviour when a durative event has a missing start 
      or end time.
    """
    Error = 0
    Exclude = 1
    MakeNonEvent = 2
    MakePunctualEvent = 3

class KGDurativeEventSwappedTimesBehaviour(Enum):
    """
      Defines the behaviour when a durative event start time is after 
      the end time.
    """
    Error = 0
    Exclude = 1
    MakeNonEvent = 2
    MakeMinPunctualEvent = 3
    MakeMaxPunctualEvent = 4
    MakeDurativeEvent = 5

class KGEventMissingAllTimesBehaviour(Enum):
    """
      Defines the behaviour when a punctual or durative event has no 
      time.
    """
    Error = 0
    Exclude = 1
    MakeNonEvent = 2

class KGPathFilterItemType(Enum):
    """
      Specifies whether the path filter is applied to an entity/entity 
      type or a relationship/relationship type.
    """
    Entity = 0
    Relationship = 1

class KGPathFilterType(Enum):
    """
      Specifies the filter type of a path filter used in filtered find 
      paths.
    """
    IncludeOnly = 0
    Exclude = 1
    MandatoryWaypoint = 2
    OptionalWaypoint = 3

class KGPathMode(Enum):
    """
      Specifies whether the filtered find paths algorithm searches for 
      all paths or
  /// only the shortest paths.
    """
    Shortest = 0
    All = 1

class KGPathTimeFlow(Enum):
    """
      Specifies the direction of time along the path.
    """
    Forward = 0
    Backward = 1
    Unconstrained = 2

class KGTraversalDirectionType(Enum):
    """
      Specifies relationships traversal directions in the filtered find 
      paths algorithm.
    """
    Any = 0
    Forward = 1
    Backward = 2

class KnowledgeGraphSearchFilterScope(Enum):
    """
      Specifies the scope to restrict search.
    """
    Entities = 1
    Relationships = 2
    BothEntitiesAndRelationships = 3
    Provenance = 4

class KnowledgeLinkChartLayoutAlgorithm(Enum):
    """
      Specifies a Knowledge Link Chart layout algorithm.
    """
    Organic_Standard = 0
    Organic_LeafCircle = 1
    Organic_Fusiform = 2
    Organic_Community = 3
    Geographic_Organic_Standard = 4
    Basic_Grid = 5
    Tree_LeftToRight = 6
    Tree_RightToLeft = 7
    Tree_TopToBottom = 8
    Tree_BottomToTop = 9
    Radial_RootCentric = 10
    Radial_NodeCentric = 11
    Hierarchical_TopToBottom = 12
    Hierarchical_BottomToTop = 13
    Chronological_MonoTimeline = 14
    Chronological_MultiTimeline = 15

class KnowledgeNonspatialDataDisplayMode(Enum):
    """
      Specifies a Knowledge Nonspatial Data Display Mode.
    """
    Visible = 0
    Hidden = 1

class LinkChartLayoutDirection(Enum):
    """
      Represents the direction of a Link Chart layout.
    """
    Top = 0
    Bottom = 1
    Left = 2
    Right = 3

class LinkChartLayoutIdealEdgeLengthType(Enum):
    """
      Determines how the ideal edge length is computed.
    """
    AbsoluteValue = 0
    Multiplier = 1

class ProvenanceBehavior(Enum):
    """
      Controls query behavior with respect to the Provenance Entity Type.
    """
    Exclude = 0
    Include = 1

class FeaturesToLabel(Enum):
    """
      A list of types of features to label.
    """
    AllVisibleFeatures = 0
    MostCurrentTrackFeatures = 1

class LabelExpressionEngine(Enum):
    """
      Label expression engine types.
    """
    VBScript = 0
    JScript = 1
    Python = 2
    Arcade = 3

class LabelFeatureType(Enum):
    """
      The label feature types.
    """
    Point = 0
    Line = 1
    Polygon = 2

class MaplexAbbreviationType(Enum):
    """
      Maplex abbreviation types.
    """
    Translation = 0
    Keyword = 1
    Ending = 2

class MaplexAnchorPointType(Enum):
    """
      Maplex anchor point types.
    """
    GeometricCenter = 0
    ErodedCenter = 1
    Perimeter = 2
    UnclippedGeometricCenter = 3

class MaplexCenterLabelAnchorType(Enum):
    """
      Options to determine how to place a centered point label.
    """
    Symbol = 0
    FeatureGeometry = 1

class MaplexConnectionType(Enum):
    """
      Maplex connection types.
    """
    MinimizeLabels = 0
    Unambiguous = 1

class MaplexConstrainOffset(Enum):
    """
      Maplex offset constraint types.
    """
    NoConstraint = 0
    AboveLine = 1
    BelowLine = 2
    LeftOfLine = 3
    RightOfLine = 4

class MaplexContourAlignmentType(Enum):
    """
      Maplex contour alignment types.
    """
    Uphill = 0
    Page = 1
    Downhill = 2

class MaplexContourLadderType(Enum):
    """
      Maplex contour ladder types.
    """
    eNone = 0
    Straight = 1
    Curved = 2

class MaplexGraticuleAlignmentType(Enum):
    """
      Maplex graticule alignment types.
    """
    Straight = 0
    StraightNoFlip = 1
    Curved = 2
    CurvedNoFlip = 3

class MaplexKeyNumberHorizontalAlignment(Enum):
    """
      Maplex key number group horizontal alignment types.
    """
    Auto = 0
    Left = 1
    Right = 2

class MaplexKeyNumberMethod(Enum):
    """
      Options that describe how a key numbering group is used.
    """
    PreventUnplacedLabels = 0
    AlwaysNumber = 1

class MaplexKeyNumberResetType(Enum):
    """
      Identifies the options for reseting the key numbers in a Maplex 
      key numbering group.
    """
    eNone = 0
    Maybe = 1
    Always = 2

class MaplexLabelAnchorPoint(Enum):
    """
      Maplex label anchor point.
    """
    CenterOfLabel = 0
    NearestSideOfLabel = 1
    FurthestSideOfLabel = 2

class MaplexLabelRotationType(Enum):
    """
      Maplex rotation types.
    """
    Geographic = 0
    Arithmetic = 1
    Radians = 2
    AV3 = 3

class MaplexLineFeatureType(Enum):
    """
      Maplex line feature types.
    """
    General = 0
    Street = 1
    StreetAddressRange = 2
    Contour = 3
    River = 4

class MaplexLinePlacementMethod(Enum):
    """
      Maplex line placement methods.
    """
    CenteredHorizontalOnLine = 0
    CenteredStraightOnLine = 1
    CenteredCurvedOnLine = 2
    CenteredPerpendicularOnLine = 3
    OffsetHorizontalFromLine = 4
    OffsetStraightFromLine = 5
    OffsetCurvedFromLine = 6
    OffsetPerpendicularFromLine = 7

class MaplexMultiPartOption(Enum):
    """
      Maplex multipart options.
    """
    OneLabelPerFeature = 0
    OneLabelPerPart = 1
    OneLabelPerSegment = 2

class MaplexOffsetAlongLineMethod(Enum):
    """
      Maplex offset along the line methods.
    """
    BestPositionAlongLine = 0
    BeforeStartOfLine = 1
    AlongLineFromStart = 2
    AlongLineFromEnd = 3
    AfterEndOfLine = 4

class MaplexPointPlacementMethod(Enum):
    """
      Maplex point placement methods.
    """
    AroundPoint = 0
    CenteredOnPoint = 1
    NorthOfPoint = 2
    NorthEastOfPoint = 3
    EastOfPoint = 4
    SouthEastOfPoint = 5
    SouthOfPoint = 6
    SouthWestOfPoint = 7
    WestOfPoint = 8
    NorthWestOfPoint = 9

class MaplexPolygonFeatureType(Enum):
    """
      Maplex polygon feature types.
    """
    General = 0
    LandParcel = 1
    River = 2
    Boundary = 3

class MaplexPolygonPlacementMethod(Enum):
    """
      Maplex polygon placement methods.
    """
    HorizontalInPolygon = 0
    StraightInPolygon = 1
    CurvedInPolygon = 2
    HorizontalAroundPolygon = 3
    RepeatAlongBoundary = 4
    CurvedAroundPolygon = 5

class MaplexQualityType(Enum):
    """
      Maplex quality types.
    """
    Low = 0
    Medium = 1
    High = 2

class MaplexRemoveAmbiguousLabelsType(Enum):
    """
      Options that describe when to remove ambiguous labels.
    """
    All = 0
    WithinLabelClass = 1
    eNone = 2

class MaplexRotationAlignmentType(Enum):
    """
      Maplex rotation alignment types.
    """
    Straight = 0
    Horizontal = 1
    Perpendicular = 2

class MaplexStackingAlignment(Enum):
    """
      Maplex stacking alignment.
    """
    ChooseBest = 0
    ConstrainLeftOrRight = 1
    ConstrainLeft = 2
    ConstrainRight = 3
    ConstrainCenter = 4

class MaplexUnit(Enum):
    """
      Maplex units.
    """
    Map = 0
    MM = 1
    Inch = 2
    Point = 3
    Percentage = 4

class StandardFeatureWeight(Enum):
    """
      Standard label engine feature weights.
    """
    eNone = 0
    Low = 1
    Medium = 2
    High = 3

class StandardLabelRotationType(Enum):
    """
      Standard label engine label rotation types.
    """
    Geographic = 0
    Arithmetic = 1
    Radians = 2
    AV3 = 3

class StandardLabelWeight(Enum):
    """
      Standard label engine label weight.
    """
    Low = 0
    Medium = 1
    High = 2

class StandardNumLabelsOption(Enum):
    """
      Standard label engine number of labels options.
    """
    NoLabelRestrictions = 0
    OneLabelPerName = 1
    OneLabelPerShape = 2
    OneLabelPerPart = 3

class StandardPointPlacementMethod(Enum):
    """
      Standard label engine point placement methods.
    """
    AroundPoint = 0
    OnTopPoint = 1
    SpecifiedAngles = 2
    RotationField = 3

class StandardPolygonPlacementMethod(Enum):
    """
      Standard label engine polygon placement methods.
    """
    AlwaysHorizontal = 0
    AlwaysStraight = 1
    MixedStrategy = 2

class DisplayCacheType(Enum):
    """
      Display cache types.
    """
    Permanent = 0
    InSession = 1
    eNone = 2
    MaxAge = 3

class ExaggerationMode(Enum):
    """
      Represents the exaggeration modes.
    """
    ScaleZ = 0
    ScaleVoxelHeight = 1

class LayerEffectsMode(Enum):
    """
      Layer effects mode.
    """
    Layer = 0
    Feature = 1

class Lighting3D(Enum):
    """
      The types of lighting.
    """
    OneSideDataNormal = 0
    OneSideResetNormal = 1
    TwoSideDataNormal = 2
    TwoSideResetNormal = 3
    TwoSideDataNormalFromWindingOrder = 4
    TwoSideResetNormalFromWindingOrder = 5

class SortOrderType(Enum):
    """
      Options to choose sort order type.
    """
    Ascending = 0
    Descending = 1

class SublayerVisibilityMode(Enum):
    """
      Visibility modes for layers inside group layers.
    """
    Independent = 0
    Exclusive = 1

class Anchor(Enum):
    """
      A list of anchor positions for an element on a page layout.
    """
    Unspecified = 0
    TopLeftCorner = 1
    TopMidPoint = 2
    TopRightCorner = 3
    LeftMidPoint = 4
    CenterPoint = 5
    RightMidPoint = 6
    BottomLeftCorner = 7
    BottomMidPoint = 8
    BottomRightCorner = 9

class AutoCameraSource(Enum):
    """
      A list of the advanced map frame options that further controls 
      the camera behavior.
    """
    eNone = 0
    Fixed = 1
    MapFrameLink = 2
    MapSeriesLink = 3

class AutoCameraType(Enum):
    """
      A list of the options available when using a fixed constraint.
    """
    Center = 0
    Scale = 1
    CenterAndScale = 2
    Extent = 3

class CondensedTabType(Enum):
    """
      Defines the type of condensed tab.
    """
    Round = 0
    Rectangle = 1
    RoundedRectangle = 2

class ContiguousTabType(Enum):
    """
      Represents a type of contiguous tabs.
    """
    Continuous = 0
    Rounded = 1
    Squared = 2

class CruisingAltitudeDiagramType(Enum):
    """
      A list of Cruising Altitude Diagram types.
    """
    Vertical = 1
    Horizontal = 2
    Quadrantal = 3

class DeclinationDirection(Enum):
    """
      Defines which direction declination will be calculated from.
    """
    West = 0
    East = 1

class DoubleFillScaleBarStyle(Enum):
    """
      A list of the styles available for a double file scale bar.
    """
    Hollow = 0
    Alternating = 1
    DoubleAlternating = 2

class EndPointPosition(Enum):
    """
      Enumerates which end a component is visible.
    """
    eNone = 0
    FromPoint = 1
    ToPoint = 2

class EndPointSelection(Enum):
    """
      Represents the selection of endPoints.
    """
    First = 1
    Interior = 2
    Last = 4

class ExtentFitType(Enum):
    """
      Extent fit types.
    """
    BestFit = 0
    ExtentCenter = 1
    DataDriven = 2

class ExtentIndicatorType(Enum):
    """
      Future implementation.
    """
    Frame = 0
    Rectangle = 1
    IndexFeatureFromDDP = 2

class FieldSortInfo(Enum):
    """
      Represents the sort information for a field.
    """
    eNone = 0
    Asc = 1
    AscCase = 2
    Desc = 4
    DescCase = 8

class FieldStatisticsFlag(Enum):
    """
      Represents field statistics.
    """
    NoStatistics = 0
    Count = 1
    Minimum = 2
    Maximum = 4
    Range = 8
    Sum = 16
    Mean = 32
    Median = 64
    Mode = 128
    StandardDeviation = 256

class GridElementType(Enum):
    """
      The type of component of the grid.
    """
    Line = 0
    Tick = 1
    Label = 2
    Corner = 3
    IntersectionPoint = 4

class GridLadderLabelPosition(Enum):
    """
      Represents the position at which the ladder labels are drawn.
    """
    Half = 0
    Third = 1
    Quarter = 2

class GridLineOrientation(Enum):
    """
      Represents the orientation of the grid line.
    """
    NorthSouth = 0
    EastWest = 1

class GridReferencePrecisionLevel(Enum):
    """
      List of precision levels for Military Grid Reference System (MGRS).
    """
    GridZoneDesignator = 0
    PrecisionLevel100km = 1
    PrecisionLevel10km = 2
    PrecisionLevel1km = 3
    PrecisionLevel100m = 4
    PrecisionLevel10m = 5
    PrecisionLevel1m = 6
    ICM = 7

class LeaderType(Enum):
    """
      A list of leader types for extent indicators.
    """
    eNone = 0
    LineToNearestPoint = 1
    LineToMidpoint = 2
    LineThroughCenters = 3
    CalloutToCenter = 4
    CalloutToEdge = 5
    CalloutToEdges = 6

class LegendFittingStrategy(Enum):
    """
      A list of legend fitting strategies.
    """
    AdjustSize = 0
    AdjustColumns = 1
    AdjustColumnsAndSize = 2
    AdjustFrame = 3
    ManualColumns = 4

class LegendItemArrangement(Enum):
    """
      A list of legend item arrangement options.
    """
    PatchLabelDescription = 0
    PatchDescriptionLabel = 1
    LabelPatchDescription = 2
    LabelDescriptionPatch = 3
    DescriptionPatchLabel = 4
    DescriptionLabelPatch = 5

class LegendKeepTogetherOption(Enum):
    """
      A list of choices for keeping legend parts together.
    """
    eNone = 0
    Items = 1
    Groups = 2

class MGRSLabelPosition(Enum):
    """
      Represents the position of the MGRS label in the 100,000m grid 
      square.
    """
    Corner = 1
    Center = 2

class MapProductSpecType(Enum):
    """
      Defines the layout types that meet different map product specifications.
    """
    Unset = -1
    TLM = 0
    ICM = 1
    JOG = 2
    USTOPO = 3
    GNC = 4
    JNC = 5
    ONC = 6
    TPC = 7
    EVC = 8

class MeterReferenceSquareType(Enum):
    """
      Defines options for 100,000-Square identification area.
    """
    Single = 0
    Multiple = 1
    DualGrid = 2

class NorthType(Enum):
    """
      A list of north arrows types.
    """
    SimpleNorth = 0
    TrueNorth = 1
    GridNorth = 2
    MagneticNorth = 3

class Orientation(Enum):
    """
      A list of orientation values.
    """
    Horizontal = 0
    Vertical = 1

class PageOrientation(Enum):
    """
      A list of page orientation values.
    """
    Portrait = 0
    Landscape = 1

class ProfileFrameHeightOption(Enum):
    """
      Options for controlling the height of the profile element.
    """
    ConstantHeight = 0
    ConstantRatio = 1

class ProfileFrameStyle(Enum):
    """
      Available styles for profile frames.
    """
    AOC = 0
    PATC = 1

class ProfileFrameType(Enum):
    """
      Options to specify if profile is displaying straight or curved 
      approach.
    """
    Straight = 0
    Curved = 1

class ProfileObstacleGroundDisplayOption(Enum):
    """
      Options for displaying the base of polygon/polyline obstacles.
    """
    Actual = 0
    Max = 1
    Min = 2
    Average = 3

class ProfileObstacleMarkerLocation(Enum):
    """
      Marker display location options.
    """
    Surface = 0
    Top = 1
    Base = 2

class ProfileObstacleSymbolSubstitutionType(Enum):
    """
      Types of symbol substitution used to display obstacles.
    """
    eNone = 0
    Penetrating = 1
    Protruding = 2

class ProfileTerrainDisplayOption(Enum):
    """
      Options to control how terrain data is displayed.
    """
    All = 0
    PenetratingOnly = 1
    Highlight = 2
    eNone = 3

class RectanglePosition(Enum):
    """
      A list of rectangle position values.
    """
    TopSide = 0
    BottomSide = 1
    LeftSide = 2
    RightSide = 3

class ScaleBarFittingStrategy(Enum):
    """
      A list of scale bar fitting strategies.
    """
    AdjustDivision = 0
    AdjustDivisions = 1
    AdjustDivisionAndDivisions = 2
    AdjustFrame = 3
    FixedWidth = 4
    FixedHeight = 5
    FixedBarWidth = 6

class ScaleBarFrequency(Enum):
    """
      Lists the options for the frequency marks appear on the scale bar.
    """
    eNone = 0
    One = 1
    MajorDivisions = 2
    Divisions = 3
    DivisionsAndFirstMidpoint = 4
    DivisionsAndFirstSubdivisions = 5
    DivisionsAndSubdivisions = 6
    DivisionsFirstSubdivisionFirstMidpoint = 7

class ScaleBarLabelPosition(Enum):
    """
      Lists the options for scale bar label positions.
    """
    Above = 0
    BeforeLabels = 1
    AfterLabels = 2
    BeforeBar = 3
    AfterBar = 4
    Below = 5
    AboveLeft = 6
    AboveRight = 7
    AboveEnds = 8
    BeforeAndAfterLabels = 9
    BeforeAndAfterBar = 10
    BelowLeft = 11
    BelowRight = 12
    BelowEnds = 13
    OnBarAfterFirstDivision = 14

class ScaleBarVerticalPosition(Enum):
    """
      A list of scale bar vertical positions.
    """
    Above = 0
    Top = 1
    On = 2
    Bottom = 3
    Below = 4
    OnRight = 5
    OnLeft = 6

class StreetIndexDelimiter(Enum):
    """
      List of delimiters for column separation.
    """
    Period = 0
    Space = 1
    Hyphen = 2
    Underscore = 3

class StreetIndexWrapMethod(Enum):
    """
      A list of ways to wrap data across multiple columns in CIMMapProductBaseStreetIndex.
    """
    Wrap = 0
    GroupWrap = 1

class TableFrameFillingStrategy(Enum):
    """
      Table frame fitting strategies.
    """
    ShowAllRows = 0
    ShowVisibleRows = 1
    ShowMapSeriesRows = 2
    CustomWhereClause = 3

class TableFrameFittingStrategy(Enum):
    """
      Defines which table rows to display.
    """
    AdjustSize = 0
    AdjustColumns = 1
    AdjustColumnsAndSize = 2
    AdjustFrame = 3

class UnitType(Enum):
    """
      Lists the unit type values.
    """
    Percent = 0
    MapUnits = 1
    PageUnits = 2

class LinkChartFilterPropertyDataType(Enum):
    """
      Link chart filter type property data types. Used when specifying 
      link chart filter type as PropertyData.
    """
    EntityKeyValue = 0
    LabelValue = 1

class LinkChartFilterScope(Enum):
    """
      Link chart filter scope.
    """
    Entities = 0
    Relationships = 1
    Both = 2

class LinkChartFilterStage(Enum):
    """
      Link chart filter stage.
    """
    Unknown = 0
    Data = 1
    Visual = 2

class LinkChartFilterType(Enum):
    """
      Link chart filter type.
    """
    Unknown = 0
    FieldData = 1
    PropertyData = 2

class LinkChartLayoutAlgorithm(Enum):
    """
      Link chart layout algorithm.
    """
    Clustered = 0
    Organic = 1
    Hierarchy_TopToBottom = 2
    Hierarchy_BottomToTop = 3
    Hierarchy_LeftToRight = 4
    Hierarchy_RightToLeft = 5
    Circular_Default = 6
    Circular_Substructures = 7
    Organic_Substructures = 8
    Organic_Clustered_Substructures = 9
    Organic_Clustered = 10
    Tree_Multi_Parent_Tree_TopToBottom = 11
    Tree_Multi_Parent_Tree_BottomToTop = 12
    Tree_Multi_Parent_Tree_LeftToRight = 13
    Tree_Multi_Parent_Tree_RightToLeft = 14
    Tree_Mindmap_TopToBottom = 15
    Tree_Mindmap_BottomToTop = 16
    Tree_Mindmap_LeftToRight = 17
    Tree_Mindmap_RightToLeft = 18
    Tree_Compact_TopToBottom = 19
    Tree_Compact_BottomToTop = 20
    Tree_Compact_LeftToRight = 21
    Tree_Compact_RightToLeft = 22
    Balloon_Default = 23
    Balloon_Ray_Like = 24
    Radial_Default = 25
    Radial_Dendrogram = 26
    Hierarchy_Curves_TopToBottom = 27
    Hierarchy_Curves_BottomToTop = 28
    Hierarchy_Curves_LeftToRight = 29
    Hierarchy_Curves_RightToLeft = 30
    Hierarchy_Flowchart_TopToBottom = 31
    Hierarchy_Flowchart_BottomToTop = 32
    Hierarchy_Flowchart_LeftToRight = 33
    Hierarchy_Flowchart_RightToLeft = 34

class LinkChartLinkDashStyle(Enum):
    """
      Link chart link dash style.
    """
    Solid = 0
    Dot = 1
    Dash = 2
    DashDot = 3
    DashDotDot = 4

class LinkChartLinkLabelPlacement(Enum):
    """
      Link chart link label placement.
    """
    Parallel = 0
    Perpendicular = 1

class LinkChartRelationshipKeyType(Enum):
    """
      Link chart relationship key type.
    """
    eNone = 0
    Entities = 1
    Foreign = 2

class LinkChartSymbolizationSource(Enum):
    """
      Link chart node and entity symbolization source.
    """
    MapSymbology = 0
    SingleSymbology = 1

class ClipDistanceMode(Enum):
    """
      Specifies the clipping mode used for the map.
    """
    Automatic = 0
    Manual = 1

class ClippingMode(Enum):
    """
      Specifies the clipping mode used for the map.
    """
    eNone = 0
    MapExtent = 1
    CustomShape = 2
    MapSeries = 3

class ComparisonOperator(Enum):
    """
      Query builder comparison operator between fields.
    """
    IsEqual = 1
    NotEqual = 2
    LessThanOrEqualTo = 3
    LessThan = 4
    GreaterThanOrEqualTo = 5
    GreaterThan = 6

class CullDirection(Enum):
    """
      Represents the direction for clipping.
    """
    Inward = 0
    Outward = 1
    Camera = 2

class EditingElevationCaptureMode(Enum):
    """
      Defines the capture mode used to specify new Z values when creating 
      or modifying features.
    """
    Off = 0
    Constant = 1
    Surface = 2

class GeoFenceEnterExitRule(Enum):
    """
      Rules to indicate whether a fence polygon has been entered or exited 
      by the geometry from a feed.
    """
    EnterContainsAndExitDoesNotIntersect = 0
    EnterContainsAndExitDoesNotContain = 1
    EnterIntersectsAndExitDoesNotIntersect = 2

class GeoFenceNotificationRule(Enum):
    """
      Indicates the type of event that will trigger notifications for 
      the Fence Geotrigger.
    """
    Enter = 0
    EnterOrExit = 1
    Exit = 2

class GeotriggerAccuracyMode(Enum):
    """
      Indicates how the geotrigger will use accuracy information from 
      a feed.
    """
    UseGeometry = 0
    UseGeometryWithAccuracy = 1

class GroundToGridScaleType(Enum):
    """
      Defines modes for specifying Scale for ground to grid corrections.
    """
    ConstantFactor = 0
    ComputeUsingElevation = 1

class IlluminationSource(Enum):
    """
      Illumination source types.
    """
    NoonAtCameraPosition = 0
    DateTime = 1
    AbsoluteSunPosition = 2
    MapTime = 3

class JoinOperator(Enum):
    """
      Query builder Boolean operator types.
    """
    And = 1
    Or = 2
    eNone = 3

class LocatorType(Enum):
    """
      Type of locators.
    """
    Locator = 0
    Layer = 1
    Table = 2

class MapType(Enum):
    """
      Types of maps.
    """
    Map = 0
    Scene = 1
    Basemap = 2
    NetworkDiagram = 3
    ContainmentMap = 4
    LinkChart = 5

class ReviewerMonotonicityDirection(Enum):
    """
      Reviewer monotonicity direction types.
    """
    NoneAsError = 0
    DecreasingValueAsError = 1
    IncreasingValueAsError = 2

class ReviewerMonotonicityEvaluationType(Enum):
    """
      Reviewer monotonicity evaluation types.
    """
    EvaluateNone = 0
    EvaluateZ = 1
    EvaluateM = 2

class ScaleDisplayFormat(Enum):
    """
      Scale display formats.
    """
    Value = 0
    Alias = 1
    ValueAndAlias = 2
    AliasAndValue = 3

class ScaleFormatType(Enum):
    """
      Scale format types.
    """
    Absolute = 0
    Imperial = 1

class SliderExtentType(Enum):
    """
      Slider extent types.
    """
    AllLayers = 0
    VisibleLayers = 1
    SingleLayer = 2
    CustomRange = 3

class SliderInteractionMode(Enum):
    """
      Slider interaction modes.
    """
    Slider = 0
    Picker = 1

class SliderStepType(Enum):
    """
      Slider step types.
    """
    Interval = 0
    Count = 1
    Feature = 2

class SnapRequestType(Enum):
    """
      Snap request types.
    """
    SnapRequestType_None = 0
    SnapRequestType_GeometricSnapping = 1
    SnapRequestType_VisualSnapping = 2
    SnapRequestType_GeometricAndVisualSnapping = 3

class SnapTipDisplayPart(Enum):
    """
      Snap tip display parts.
    """
    SnapTipDisplayNone = 0
    SnapTipDisplayLayer = 1
    SnapTipDisplayType = 2

class SnapXYToleranceUnit(Enum):
    """
      Snap XY tolerance units.
    """
    SnapXYToleranceUnitPixel = 0
    SnapXYToleranceUnitMap = 1

class StereoModelDisplayMode(Enum):
    """
      Stereo model display modes.
    """
    Default = 0
    OnlyLeftImage = 1
    OnlyRightImage = 2
    eNone = 3

class StereoOrientation(Enum):
    """
      Stereo model orientation.
    """
    UpOrRight = 0
    UpOrLeft = 1
    DownOrRight = 2
    DownOrLeft = 3

class StereoSourceType(Enum):
    """
      Stereo source types.
    """
    StereoModel = 0
    StereoModelCollection = 1

class SurfaceTINShadingMode(Enum):
    """
      Surface TIN shading modes.
    """
    Smooth = 0
    Flat = 1

class SwipeDirection(Enum):
    """
      Represents the direction from an edge of the view used to clip 
      a layer.
    """
    eNone = 0
    Top = 1
    Bottom = 2
    Left = 3
    Right = 4

class TimeOffsetDirection(Enum):
    """
      Time offset direction.
    """
    Past = 0
    Future = 1
    PastAndFuture = 2

class TimeSnapMode(Enum):
    """
      Mode used for snapping the map's current time settings.
    """
    Automatic = 0
    Single = 1
    Interval = 2

class NDSRendererTarget(Enum):
    """
      Renderer target.
    """
    Edges = 0
    UserJunctions = 1
    SystemJunctions = 2
    Turns = 3
    Traffic = 4
    DirtyAreas = 5

class NetworkTravelModeSourceType(Enum):
    """
      The source type of the travel mode used by the travel mode context.
    """
    NetworkDataset = 0
    Layer = 1
    Custom = 2

class RestrictionStatus(Enum):
    """
      Restriction status.
    """
    GeneralTraversable = 0
    NeutralPreferenceLevelTraversable = 1
    Prohibited = 2
    AvoidPreferenceLevelTraversable = 3
    PreferPreferenceLevelTraversable = 4
    MixedPreferenceLevelTraversable = 5
    Invalid = 6

class TraversableDirections(Enum):
    """
      Traversable directions.
    """
    Prohibited = 0
    Traversable = 1
    OneWay = 2

class ValueType(Enum):
    """
      The data type of a value.
    """
    Short = 2
    Long = 3
    Float = 4
    Double = 5
    Date = 7
    String = 8
    Bool = 11

class DirectionFormatOption(Enum):
    """
      Direction format options.
    """
    DegreesMinutesSeconds = 0
    QuadrantBearing = 1

class DirectionType(Enum):
    """
      Direction type.
    """
    NorthAzimuth = 0
    SouthAzimuth = 1
    Polar = 2
    QuadrantBearing = 3

class DirectionUnits(Enum):
    """
      Direction units.
    """
    Radians = 0
    DecimalDegrees = 1
    DegreesMinutesSeconds = 2
    Gradians = 3
    Gons = 4

class FractionOption(Enum):
    """
      Fraction options.
    """
    Digits = 0
    Denominator = 1

class NumericAlignment(Enum):
    """
      Numeric alignment types.
    """
    AlignRight = 0
    AlignLeft = 1

class RoundingOption(Enum):
    """
      Rounding options.
    """
    NumberOfDecimals = 0
    NumberOfSignificantDigits = 1

class AttachmentDisplayType(Enum):
    """
      Attachment display types.
    """
    PreviewFirst = 0
    PreviewAll = 1
    List = 2
    Auto = 3

class PresentationMediaContentFitType(Enum):
    """
      Media content (image/video) fit types.
    """
    eNone = 0
    Fill = 1
    StretchToFill = 2
    Center = 3

class PresentationTransitionType(Enum):
    """
      Presentation transition types.
    """
    eNone = 0
    Swipe = 1
    Fade = 2

class ConnectionMode(Enum):
    """
      Connection modes.
    """
    Consumer = 0
    Admin = 1
    Publisher = 2

class IndexedSceneLayerType(Enum):
    """
      Indexed scene layer types.
    """
    IntegratedMesh = 0
    Point = 1
    Object3D = 2

class Object3DRenderingMode(Enum):
    """
      Specified how features are drawn.
    """
    eNone = 0
    Wireframe = 1

class ServerType(Enum):
    """
      Server types.
    """
    AGS = 0
    WMS = 1
    WCS = 2
    WMTS = 3
    WFS = 4
    OGCAPI = 5

class Tiles3DLayerType(Enum):
    """
      3D Tiles layer types.
    """
    IntegratedMesh = 0
    Object3D = 1

class VoxelAlignment(Enum):
    """
      Represents voxel alignment.
    """
    Origin = 0
    Center = 1

class VoxelInterpolationMode(Enum):
    """
      Voxel interpolation mode.
    """
    Linear = 0
    Nearest = 1

class VoxelLayerOptimization(Enum):
    """
      Represents voxel layer optimization.
    """
    Visualization = 0
    Size = 1

class VoxelScalarFormat(Enum):
    """
      Voxel scalar formats.
    """
    I1 = 0
    U1 = 1
    I2 = 2
    U2 = 3
    I4 = 4
    U4 = 5
    I8 = 6
    U8 = 7
    F4 = 8
    F8 = 9

class VoxelValueFilterMode(Enum):
    """
      Voxel value filter modes.
    """
    Exclude = 0
    Include = 1

class VoxelVariableDataType(Enum):
    """
      Voxel variable data types.
    """
    Continuous = 0
    Discrete = 1

class VoxelVariablePrecision(Enum):
    """
      Voxel variable precision. The lower the precision the smaller the 
      data size of the voxel layer.
    """
    InputData = 0
    Low = 1
    Medium = 2
    High = 3

class VoxelVisualization(Enum):
    """
      Represents voxel visualization.
    """
    Volume = 0
    Surface = 1

class FloodSimulationCulvertProfileType(Enum):
    """
      Culvert profile type.
    """
    Elliptical = 0
    Rectangular = 1
    Arched = 2

class FloodSimulationValueRangeType(Enum):
    """
      Value range types for playing flood simulation.
    """
    FlowIntensity = 0
    WaterDepth = 1

class FloodSimulationWaterDisplayType(Enum):
    """
      Water display types for playing flood simulation.
    """
    Fill = 0
    Edges = 1
    FillAndEdges = 2

class BivariateGridLegendLabelStrategy(Enum):
    """
      Bivariate grid label strategy.
    """
    Corners = 0
    Sides = 1

class BivariateGridLegendOrientationType(Enum):
    """
      Bivariate grid orientation type.
    """
    eNone = 0
    High = 1
    Low = 2
    HighLow = 3
    LowHigh = 4

class BivariateGridSizeOption(Enum):
    """
      Bivariate grid size option.
    """
    TwoByTwo = 0
    ThreeByThree = 1
    FourByFour = 2

class ClassBreakType(Enum):
    """
      Class break types.
    """
    GraduatedColor = 0
    GraduatedSymbol = 1
    UnclassedColor = 2

class ClassBreaksLegendVisualVariableOptions(Enum):
    """
      Legend display options for class breaks visual variables.
    """
    ShowVisualVariableSymbolClasses = 0
    ShowClassesForEachPrimarySymbol = 1

class ClassificationMethod(Enum):
    """
      Classification methods.
    """
    DefinedInterval = 0
    EqualInterval = 1
    GeometricalInterval = 2
    Manual = 3
    NaturalBreaks = 4
    Quantile = 5
    StandardDeviation = 6

class ColorChannelTarget(Enum):
    """
      Indicates the target color channel overridden by the class breaks 
      color visual variable.
    """
    SV = 0
    All = 1

class DataNormalizationMethod(Enum):
    """
      Data normalization methods.
    """
    Field = 0
    Log = 1
    PercentOfTotal = 2
    Nothing = 3

class ExpressionReturnType(Enum):
    """
      Visual variable info types.
    """
    Default = 0
    String = 1
    Numeric = 2

class PatchShape(Enum):
    """
      Patch shapes.
    """
    Default = 0
    Point = 1
    LineHorizontal = 2
    LineZigZag = 3
    LineAngles = 4
    LineArc = 5
    LineCurve = 6
    LineTrail = 7
    LineHydro = 8
    LineVertical3D = 9
    LineZigZag3D = 10
    LineCorkscrew3D = 11
    AreaRectangle = 12
    AreaRoundedRectangle = 13
    AreaPolygon = 14
    AreaCircle = 15
    AreaEllipse = 16
    AreaFootprint = 17
    AreaBoundary = 18
    AreaHydroPoly = 19
    AreaNaturalPoly = 20
    AreaSquare = 21
    AreaHexagonFlat = 22
    AreaHexagonPointy = 23
    AreaTrapezium = 24
    Custom = 100

class PolygonSymbolColorTarget(Enum):
    """
      Polygon symbol color apply targets.
    """
    Fill = 0
    Outline = 1
    FillOutline = 2

class SizeVisualVariableAxis(Enum):
    """
      Size visual variable axis.
    """
    HeightAxis = 0
    WidthAxis = 1
    DepthAxis = 2
    WidthAndDepthAxes = 3
    AllAxes = 4

class SizeVisualVariableType(Enum):
    """
      Size visual variable type.
    """
    eNone = 0
    Expression = 1
    Random = 2
    Proportional = 3
    Graduated = 4

class SymbolRotationType(Enum):
    """
      Symbol rotation types.
    """
    Geographic = 0
    Arithmetic = 1

class SymbolShapes(Enum):
    """
      Symbol shapes.
    """
    Unknown = 0
    Circle = 1
    Square = 2

class ValueRepresentations(Enum):
    """
      Represents value representations.
    """
    Radius = 0
    Area = 1
    Distance = 2
    Width = 3

class VisualVariableInfoType(Enum):
    """
      Visual variable info types.
    """
    eNone = 0
    Expression = 1
    Random = 2

class AngleAlignment(Enum):
    """
      Angle alignment types.
    """
    Display = 0
    Map = 1

class AnimatedSymbolEasingType(Enum):
    """
      Represents the easing options for an animated symbol.
    """
    Linear = 0
    EaseIn = 1
    EaseOut = 2
    EaseInOut = 3

class AnimatedSymbolRepeatType(Enum):
    """
      Represents the ways an animated symbol can be repeated.
    """
    eNone = 0
    Loop = 1
    Oscillate = 2

class BalloonCalloutStyle(Enum):
    """
      Balloon callout styles.
    """
    Rectangle = 0
    RoundedRectangle = 1
    Oval = 2

class BlendingMode(Enum):
    """
      Blending modes.
    """
    eNone = 0
    Alpha = 1
    Screen = 2
    Multiply = 3
    Add = 4
    Color = 5
    ColorBurn = 6
    ColorDodge = 7
    Darken = 8
    Difference = 9
    Exclusion = 10
    HardLight = 11
    Hue = 12
    Lighten = 13
    Luminosity = 14
    Normal = 15
    Overlay = 16
    Saturation = 17
    SoftLight = 18
    LinearBurn = 19
    LinearDodge = 20
    LinearLight = 21
    PinLight = 22
    VividLight = 23

class BlockProgression(Enum):
    """
      Block progressions.
    """
    TTB = 0
    RTL = 1
    BTT = 2

class CGAAttributeType(Enum):
    """
      CGA attribute type.
    """
    Float = 0
    String = 1
    Boolean = 2
    Float_Array = 3
    String_Array = 4
    Boolean_Array = 5

class ClippingType(Enum):
    """
      Clipping types.
    """
    Intersect = 0
    Subtract = 1

class ExternalColorMixMode(Enum):
    """
      Options to control how material combines with externally defined 
      colors.
    """
    Tint = 0
    Ignore = 1
    Multiply = 99

class ExtremityPlacement(Enum):
    """
      Extremity placement options which specify at which ends of the 
      line a marker will be placed.
    """
    Both = 0
    JustBegin = 1
    JustEnd = 2
    eNone = 3

class FillMode(Enum):
    """
      Fill modes.
    """
    Mosaic = 0
    Centered = 1

class FontEffects(Enum):
    """
      Font effects.
    """
    Normal = 0x00
    Superscript = 0x01
    Subscript = 0x02

class FontEncoding(Enum):
    """
      Font encodings.
    """
    MSSymbol = 0
    Unicode = 1

class FontType(Enum):
    """
      Font types.
    """
    Unspecified = 0
    TrueType = 1
    PSOpenType = 2
    TTOpenType = 3
    Type1 = 4

class GeometricEffectArrowType(Enum):
    """
      Geometric effect arrow types.
    """
    OpenEnded = 0
    Block = 1
    Crossed = 2

class GeometricEffectControlMeasureLineRule(Enum):
    """
      Specifies the rules to transform the input ground control points 
      given as a line.
    """
    FullGeometry = 0
    PerpendicularFromFirstSegment = 1
    ReversedFirstSegment = 2
    PerpendicularToSecondSegment = 3
    SecondSegmentWithTicks = 4
    DoublePerpendicular = 5
    OppositeToFirstSegment = 6
    TriplePerpendicular = 7
    HalfCircleFirstSegment = 8
    HalfCircleSecondSegment = 9
    HalfCircleExtended = 10
    OpenCircle = 11
    CoverageEdgesWithTicks = 12
    GapExtentWithDoubleTicks = 13
    GapExtentMidline = 14
    Chevron = 15
    PerpendicularWithArc = 16
    ClosedHalfCircle = 17
    TripleParallelExtended = 18
    ParallelWithTicks = 19
    Parallel = 20
    PerpendicularToFirstSegment = 21
    ParallelOffset = 22
    OffsetOpposite = 23
    OffsetSame = 24
    CircleWithArc = 25
    DoubleJog = 26
    PerpendicularOffset = 27
    LineExcludingLastSegment = 28
    MultivertexArrow = 29
    CrossedArrow = 30
    ChevronArrow = 31
    ChevronArrowOffset = 32
    PartialFirstSegment = 33
    Arch = 34
    CurvedParallelTicks = 35
    Arc90Degrees = 36
    TipWithPerpendicularAndTicks = 37
    ConcentricCircles = 38
    DoubleJogArrow = 39
    LinkedChevrons = 40
    SegmentThenHalfCircle = 41
    LineWithStraightTicks = 42
    DoubleCurve = 43
    ParallelWithTicksByWidth = 44
    EnclosingRoundedRectangle = 45

class GeometricEffectDonutMethod(Enum):
    """
      Geometric effect donut methods.
    """
    Mitered = 0
    Bevelled = 1
    Rounded = 2
    Square = 3
    TrueBuffer = 4

class GeometricEffectEnclosingPolygonMethod(Enum):
    """
      Geometric effect enclosing polygon methods.
    """
    ClosePath = 0
    ConvexHull = 1
    RectangularBox = 2

class GeometricEffectExtensionOrigin(Enum):
    """
      Geometric effect extension origins. Specifies the origin of the 
      extension to add to the line. The beginning and end of the line 
      is defined by the direction the line was digitized.
    """
    BeginningOfLine = 0
    EndOfLine = 1

class GeometricEffectLocalizerFeatherStyle(Enum):
    """
      Geometric effect localizer feather styles.
    """
    Complete = 0
    Left = 1
    Right = 2

class GeometricEffectOffsetMethod(Enum):
    """
      Geometric effect offset method which specifies the way the strokes 
      or fills are displayed at corners.
    """
    Mitered = 0
    Bevelled = 1
    Rounded = 2
    Square = 3

class GeometricEffectOffsetOption(Enum):
    """
      Geometric effect offset options which specify the way the symbol 
      handles complex geometries.
    """
    Fast = 0
    Accurate = 1

class GeometricEffectOffsetTangentMethod(Enum):
    """
      Geometric effect offset tangent methods which specify the origin 
      of the tangent offset for the line. The beginning and end of the 
      lines are defined by how the line was digitized.
    """
    BeginningOfLine = 0
    EndOfLine = 1

class GeometricEffectWaveform(Enum):
    """
      Geometric effect offset waveforms.
    """
    Sinus = 0
    Square = 1
    Triangle = 2
    Random = 3

class GlyphHinting(Enum):
    """
      Glyph hinting options.
    """
    eNone = 0
    Default = 1
    Force = 2

class GradientAlignment(Enum):
    """
      Gradient alignment types.
    """
    Buffered = 0
    Left = 1
    Right = 2
    AlongLine = 3

class GradientFillMethod(Enum):
    """
      Describes the gradient fill method which is how the gradient is 
      applied.
    """
    Linear = 0
    Rectangular = 1
    Circular = 2
    Buffered = 3

class GradientStrokeType(Enum):
    """
      Gradient stroke types.
    """
    Discrete = 0
    Continuous = 1

class HorizontalAlignment(Enum):
    """
      Horizontal alignment types.
    """
    Left = 0
    Right = 1
    Center = 2
    Justify = 3

class LeaderLineStyle(Enum):
    """
      The style of line to generate when a leader is drawn defined by 
      an enumeration value. Line leaders will always be drawn with their 
      own geometry.
    """
    Base = 0
    MidPoint = 1
    ThreePoint = 2
    FourPoint = 3
    Underline = 4
    CircularCW = 5
    CircularCCW = 6

class LineCapStyle(Enum):
    """
      The style of stroke ending caps.
    """
    Butt = 0
    Round = 1
    Square = 2

class LineDashEnding(Enum):
    """
      Determines how the strokes with dash patterns and other patterns 
      (tiled pictures, placement effects) are handled at the end points 
      of the line geometry's segments.
    """
    NoConstraint = 0
    HalfPattern = 1
    HalfGap = 2
    FullPattern = 3
    FullGap = 4
    Custom = 5

class LineDecorationStyle(Enum):
    """
      Defines simple decorations for lines.
    """
    eNone = -1
    Custom = 0
    Circle = 1
    OpenArrow = 2
    ClosedArrow = 3
    Diamond = 4

class LineGapType(Enum):
    """
      Specifies the type of line gap (line spacing) that is applied.
    """
    ExtraLeading = 0
    Multiple = 1
    Exact = 2

class LineJoinStyle(Enum):
    """
      Specifies how the symbol is drawn at the stroke segment connections.
    """
    Bevel = 0
    Round = 1
    Miter = 2

class MarkerPlacementType(Enum):
    """
      Marker placement types.
    """
    InsidePolygon = 0
    PolygonCenter = 1
    RandomlyInsidePolygon = 2

class MaterialMode(Enum):
    """
      Material modes.
    """
    Tint = 0
    Replace = 1
    Multiply = 2

class PlacementAroundPolygonPosition(Enum):
    """
      Options for how markers are placed in a uniform grid or randomly.
    """
    Top = 0
    Bottom = 1
    Left = 2
    Right = 3
    TopLeft = 4
    TopRight = 5
    BottomLeft = 6
    BottomRight = 7

class PlacementClip(Enum):
    """
      Options for how the markers should be clipped at the polygon boundary.
    """
    ClipAtBoundary = 0
    RemoveIfCenterOutsideBoundary = 1
    DoNotTouchBoundary = 2
    DoNotClip = 3

class PlacementEndings(Enum):
    """
      Options for how markers are placed at extremities and control points.
    """
    NoConstraint = 0
    WithMarkers = 1
    WithFullGap = 2
    WithHalfGap = 3
    Custom = 4

class PlacementGridType(Enum):
    """
      Options for how markers are placed in a uniform grid or randomly.
    """
    Fixed = 0
    Random = 1
    RandomFixedQuantity = 2

class PlacementOnLineRelativeTo(Enum):
    """
      Options for the location on a line where a marker will be placed.
    """
    LineMiddle = 0
    LineBeginning = 1
    LineEnd = 2
    SegmentMidpoint = 3

class PlacementPolygonCenterMethod(Enum):
    """
      Options for how a single marker will be placed within the polygon.
    """
    OnPolygon = 0
    CenterOfMass = 1
    BoundingBoxCenter = 2

class PlacementRandomlyAlongLineRandomization(Enum):
    """
      Options for the amount of randomness to be used for the size and 
      rotation of the markers on the line.
    """
    Low = 0
    Medium = 1
    High = 2

class PlacementStepPosition(Enum):
    """
      Options for the placement step position.
    """
    MarkerCenter = 0
    MarkerBounds = 1

class PointSymbolCalloutScale(Enum):
    """
      An enumeration that defines how the background point symbol is 
      scaled to fit the dimensions of the text.
    """
    eNone = 0
    PropUniform = 1
    PropNonuniform = 2
    DifUniform = 3
    DifNonuniform = 4

class Simple3DLineAnchor(Enum):
    """
      Defines the vertical anchor used to render the simple 3D line style 
      in relation to the ground in 3D.
  /// This property is ignored 
      for the Strip style which is drawn flat upon the surface, and for 
      the Wall
  /// style which always uses a Bottom anchor.
    """
    Center = 0
    Bottom = 1
    Top = 2

class Simple3DLineStyle(Enum):
    """
      Simple 3D line styles which define how strokes will be rendered 
      in 3D.
    """
    Tube = 0
    Strip = 1
    Wall = 2
    Square = 3
    Rectangle = 4

class SimplePlacementEndings(Enum):
    """
      Options for how markers are placed at extremities and control points 
      for the Variable Size marker placement.
    """
    WithHalfGap = 0
    WithMarkers = 1

class SizeVariationMethod(Enum):
    """
      Size variation methods which define the order in which the change 
      of size in the markers should occur.
    """
    Random = 0
    Increasing = 1
    Decreasing = 2
    IncreasingThenDecreasing = 3

class SymbolUnits(Enum):
    """
      Symbol unit types.
    """
    Relative = 0
    Absolute = 1

class TextCase(Enum):
    """
      The letter case used to draw text.
    """
    Normal = 0
    LowerCase = 1
    Allcaps = 2

class TextReadingDirection(Enum):
    """
      Text reading directions.
    """
    LTR = 0
    RTL = 1

class TextureFilter(Enum):
    """
      Texture filter types.
    """
    Draft = 0
    Picture = 1
    Text = 2

class VerticalAlignment(Enum):
    """
      Vertical alignment types.
    """
    Top = 0
    Center = 1
    Baseline = 2
    Bottom = 3

class VerticalGlyphOrientation(Enum):
    """
      Vertical glyph orientation.
    """
    Right = 0
    Upright = 1
    Mixed = 2

class WaterbodySize(Enum):
    """
      Waterbody size.
    """
    Small = 0
    Medium = 1
    Large = 2

class WaveStrength(Enum):
    """
      Strength of waves.
    """
    Calm = 0
    Rippled = 1
    Slight = 2
    Moderate = 3

class LASStretchAttribute(Enum):
    """
      LAS stretch attributes.
    """
    Elevation = 0
    RGB = 1
    Red = 2
    Green = 3
    Blue = 4
    NearInfrared = 5
    Intensity = 6
    ScanAngle = 7
    GPSTime = 8
    eNone = 9

class LASStretchDrawingType(Enum):
    """
      LAS stretch drawing type.
    """
    Symbol = 0
    Splat = 1
    SymbolTint = 2

class LASStretchStatsType(Enum):
    """
      LAS stretch statistic types.
    """
    AreaOfView = 0
    Dataset = 1
    GlobalStats = 2

class LASStretchType(Enum):
    """
      LAS stretch types.
    """
    DefaultFromSource = 0
    Custom = 1
    MinimumMaximum = 2
    StandardDeviations = 3
    Histogram = 4
    PercentMinMax = 5

class PointCloudFieldTransformType(Enum):
    """
      Point cloud field transform types.
    """
    eNone = 0
    LowFourBit = 1
    HighFourBit = 2
    AbsoluteValue = 3
    ModuloTen = 4

class PointCloudReturnType(Enum):
    """
      Point cloud return types.
    """
    Last = 1
    FirstOfMany = 2
    LastOfMany = 4
    Single = 8
    All = -1

class PointCloudShapeType(Enum):
    """
      Point cloud shape types.
    """
    DiskFlat = 0
    DiskShaded = 1

class PointCloudValueFilterMode(Enum):
    """
      Point cloud value filter modes.
    """
    Exclude = 0
    Include = 1

class TerrainDrawCursorType(Enum):
    """
      Terrain draw cursor types.
    """
    Composite = 0
    NodeSimple = 1
    NodeValue = 2
    NodeElevation = 3
    EdgeSimple = 4
    EdgeType = 5
    FaceSimple = 6
    FaceElevation = 7
    FaceSlope = 8
    FaceAspect = 9
    FaceValue = 10
    TerrainPointElevation = 11
    TerrainPointAttributeGraduated = 12
    TerrainPointAttributeUnique = 13
    TerrainDirtyArea = 14

class TimelineViewType(Enum):
    """
      Timeline view type.
    """
    DefaultView = 0
    SummaryView = 1

class BarrierWeight(Enum):
    """
      Barrier weights.
    """
    eNone = 0
    Low = 1
    Medium = 2
    High = 3

class BindVariableType(Enum):
    """
      Bind variable types.
    """
    String = 0
    Integer = 1
    Double = 2
    Date = 3
    Geometry = 4

class BinsToPointsThresholdType(Enum):
    """
      A threshold for determining when binned features should be shown 
      as points.
    """
    MaxScale = 0
    FeatureCount = 1

class DataSearchMode(Enum):
    """
      Field search modes.
    """
    Contains = 0
    Exact = 1
    StartsWith = 2

class DimensionMarkerFit(Enum):
    """
      Dimension marker fit options.
    """
    eNone = 0
    Tolerance = 1
    Text = 2

class DimensionPartOptions(Enum):
    """
      Dimension part options.
    """
    Begin = 1
    End = 2
    eNone = 3
    Both = 0

class DimensionTextFit(Enum):
    """
      Dimension text fit options.
    """
    eNone = 0
    MoveBegin = 1
    MoveEnd = 2

class DimensionTextOption(Enum):
    """
      Dimension text options.
    """
    Only = 0
    Suffix = 1
    Expression = 2
    eNone = 3

class DimensionType(Enum):
    """
      Dimension types supported by dimension features.
    """
    Aligned = 0
    Linear = 1

class DisciplineType(Enum):
    """
      Represents the discipline type of a building layer.
    """
    Architectural = 0
    Electrical = 1
    Mechanical = 2
    Piping = 3
    Structural = 4
    Infrastructure = 5

class DisplayFilterType(Enum):
    """
      DisplayFilterType.
    """
    ByChoice = 0
    ByScale = 1

class FeatureCacheType(Enum):
    """
      Feature cache type options.
    """
    eNone = 0
    Session = 1

class FeatureExpirationMethod(Enum):
    """
      Stream service feature expiration method.
    """
    MaximumFeatureCount = 0
    MaximumFeatureAge = 1

class FloorFilterRank(Enum):
    """
      Represents the rank or "level" at which the layer participates 
      in filtering for Indoors or floor-aware layers.
    """
    eNone = 0
    Site = 1
    Facility = 2
    Level = 3

class HtmlPopupStyle(Enum):
    """
      HTML pop-up styles.
    """
    TwoColumnTable = 0
    RedirectedHTML = 1
    XSLStyleSheet = 2

class LocationConditionType(Enum):
    """
      Location condition types.
    """
    In = 0
    Depart = 1
    Out = 2
    Arrive = 3
    Cross = 4
    Crossover = 5

class MappedOIDFieldType(Enum):
    """
      A list of mapped OID field types.
    """
    OID32Bit = 4
    OID64Bit = 8

class S52AreaSymbolizationType(Enum):
    """
      ENC area symbolization type. This is used to specify whether areas 
      should be symbolized with plain or traditional symbols.
    """
    Plain = 0
    Symbolized = 1

class S52ColorScheme(Enum):
    """
      ENC Color Schemes.
    """
    Day = 0
    Dusk = 1
    Night = 2

class S52DepthDisplayUnits(Enum):
    """
      ENC Depth Display Units.
    """
    Meters = 0
    Feet = 1
    Fathoms = 2

class S52PointSymbolizationType(Enum):
    """
      ENC point symbolization options. This is used to specify whether 
      point features should be symbolized with simplified or paperchart 
      symbols.
    """
    PaperChart = 0
    Simplified = 1

class StandardDeviationMultiplier(Enum):
    """
      Standard deviation multiplier to define min and max data values 
      from the mean for binning levels.
    """
    eNone = 0
    OneFourth = 1
    OneThird = 2
    OneHalf = 3
    One = 4
    Two = 5
    Custom = 6

class SymbolSubstitutionType(Enum):
    """
      Symbol substitution types.
    """
    eNone = 0
    Color = 1
    IndividualSubordinate = 2
    IndividualDominant = 3

class TemporalFeatureClassCachingMode(Enum):
    """
      Temporal feature class caching modes.
    """
    All = 0
    eNone = 1

class TemporalFeatureClassPurgeRule(Enum):
    """
      Temporal feature class purge rules.
    """
    KeepLatestPerTrack = 0
    PurgeOldest = 1

class TrajectorySubLayerType(Enum):
    """
      Types of trajectory sublayers.
    """
    Footprint = 0
    Point = 1

class WorkspaceFactory(Enum):
    """
      Workspace factory types.
    """
    SDE = 0
    FileGDB = 1
    Raster = 2
    Shapefile = 3
    OLEDB = 4
    Access = 5
    DelimitedTextFile = 6
    Custom = 7
    Sql = 8
    Tin = 9
    TrackingServer = 10
    NetCDF = 11
    LASDataset = 12
    SQLite = 13
    FeatureService = 14
    ArcInfo = 15
    Cad = 16
    Excel = 17
    WFS = 18
    StreamService = 19
    BIMFile = 20
    InMemoryDB = 21
    NoSQL = 22
    BigDataConnection = 23
    KnowledgeGraph = 24
    NITF = 25
    VPF = 26

