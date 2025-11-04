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

class CIMAutoCamera():
    """
      Represents the camera settings associated with a map frame on a 
      page layout.
    """
    def __init__(self, *args, **Kwargs):
        self.camera = 'CIMViewCamera'
        self.autoCameraType = AutoCameraType.Extent
        self.extent = GetPythonClass('arcpy', 'Extent')
        self.intersectLayerPath = str()
        self.mapFrameLinkName = str()
        self.margin = 0.0
        self.marginType = UnitType.Percent
        self.marginUnits = str()
        self.source = AutoCameraSource.eNone
        self.syncRotation = False
    
class CIMAviationArrow():
    """
      Represents an individual arrow in CIMAviationNorthArrow.
    """
    def __init__(self, *args, **Kwargs):
        self.lineIndicatorTextSymbol = 'CIMSymbolReference'
        self.lineSymbol = 'CIMSymbolReference'
        self.defaultPointSymbol = 'CIMSymbolReference'
        self.positivePointSymbol = 'CIMSymbolReference'
        self.negativePointSymbol = 'CIMSymbolReference'
        self.enableArrow = False
        self.enableLineIndicator = False
        self.arrowLength = 60.0
        self.lineIndicatorText = str()
    
class CIMAviationVariation():
    """
      Represents the properties for the variation text which is displayed 
      in aviation north arrow.
    """
    def __init__(self, *args, **Kwargs):
        self.variationTextSymbol = 'CIMSymbolReference'
        self.alignVariationToLine = True
        self.variationTextOnLeft = True
        self.showYear = False
        self.showYearInParenthesis = False
        self.variationYearSeparator = str()
        self.magneticVariationIdentifier = str()
        self.gridVariationIdentifier = str()
    
class CIMAviationVerticalScaleProperties():
    """
      Represents a set of scale properties for aviation-specific Vertical 
      Scale Bar, such as a feet scale or meter scale properties.
    """
    def __init__(self, *args, **Kwargs):
        self.unitTextSymbol = 'CIMSymbolReference'
        self.divisionMarkSymbol = 'CIMSymbolReference'
        self.subdivisionMarkSymbol = 'CIMSymbolReference'
        self.scaleTextSymbol = 'CIMSymbolReference'
        self.scaleBarHeight = 30.0
        self.divisionLineLength = 8
        self.subdivisionLineLength = 4
        self.scaleUnitText = str()
        self.divisions = 5
        self.subdivisions = 2
        self.visible = True
    
class CIMBookmarkMapSeriesPage():
    """
      A map series page based on a bookmark.
    """
    def __init__(self, *args, **Kwargs):
        self.bookmarkName = str()
        self.mapURI = str()
        self.category = str()
    
class CIMDeclination():
    """
      Represents the properties of a declination calculated using World 
      Magnetic Model.
    """
    def __init__(self, *args, **Kwargs):
        self.direction = DeclinationDirection.East
        self.degrees = 0
        self.minutes = 0
        self.mils = 0
    
class CIMElement():
    """
      A CIM representation of an element.
    """
    def __init__(self, *args, **Kwargs):
        self.anchor = Anchor.BottomLeftCorner
        self.locked = False
        self.name = str()
        self.visible = True
        self.rotation = 0.0
        self.rotationCenter = GetPythonClass('arcpy', 'Point')
        self.lockedAspectRatio = False
        self.customProperties = []
        self.expanded = False
    
class CIMExtentIndicator():
    """
      Represents an extent indicator which is used to display the visible 
      extent of other map frames in an associated map frame.
    """
    def __init__(self, *args, **Kwargs):
        self.sourceMapFrame = str()
        self.symbol = 'CIMSymbolReference'
        self.leaderType = LeaderType.eNone
        self.leaderSymbol = 'CIMSymbolReference'
        self.collapseSize = 0.0
        self.pointSymbol = 'CIMSymbolReference'
        self.name = str()
        self.isVisible = True
        self.avoidLabelConflict = True
        self.symbolizeExterior = False
        self.extentIndicatorType = ExtentIndicatorType.Frame
    
class CIMGridEndpoint():
    """
      Represents an end point of a component. For ex: The labels for ticks are
        /// defined using an endPoint object.
    """
    def __init__(self, *args, **Kwargs):
        self.gridLabelTemplate = 'CIMGridLabelTemplate'
        self.offset = 0
        self.position = 3
        self.lineSelection = 7
        self.drawLabelsParallel = False
    
class CIMGridLabelTemplate():
    """
      Represents the formatting of a label.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMGridLine():
    """
      Represents latitudes or longitudes for a graticule.
        /// Represents eastings or nothings for a grid.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.elementType = GridElementType.Line
        self.gridLineOrientation = GridLineOrientation.EastWest
        self.symbol = 'CIMSymbolReference'
        self.pattern = 'CIMGridPattern'
        self.fromTick = 'CIMExteriorTick'
        self.toTick = 'CIMExteriorTick'
        self.interiorTicks = []
        self.visibleIndices = []
    
class CIMGridPattern():
    """
      Defines pattern for a component.
    """
    def __init__(self, *args, **Kwargs):
        self.interval = 0
        self.start = 0
        self.stop = 1
        self.gap = 0
    
class CIMGridZoneLabelPosition():
    """
      Represents the state of a label at a given position on a MapGrid.
    """
    def __init__(self, *args, **Kwargs):
        self.visible = True
        self.offsetX = 0.2
        self.offsetY = 0.2
    
class CIMGuide():
    """
      Represents a guide used to snap elements on a page layout.
    """
    def __init__(self, *args, **Kwargs):
        self.position = 0.0
        self.orientation = Orientation.Horizontal
    
class CIMLegendItem():
    """
      Represents a legend item.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.newColumn = False
        self.layerNameSymbol = 'CIMSymbolReference'
        self.manualColumn = 1
        self.keepTogetherOption = LegendKeepTogetherOption.eNone
        self.showLayerName = False
        self.showHeading = True
        self.headingSymbol = 'CIMSymbolReference'
        self.showLabels = True
        self.layer = str()
        self.showDescription = True
        self.labelSymbol = 'CIMSymbolReference'
        self.descriptionSymbol = 'CIMSymbolReference'
        self.patchWidth = 0.0
        self.patchHeight = 0.0
        self.autoVisibility = True
        self.useMapSeriesShape = False
        self.classIndent = 0.0
        self.headingIndent = 0.0
        self.layerNameIndent = 0.0
        self.showGroupLayerName = True
        self.groupLayerNameSymbol = 'CIMSymbolReference'
        self.scaleToPatch = False
        self.showCounts = False
        self.countFormat = 'CIMNumberFormat'
        self.countPrefix = str()
        self.countSuffix = str()
        self.isVisible = True
        self.groupFilter = []
    
class CIMMapGrid():
    """
      Represents a grid object for a map frame.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.isVisible = True
        self.neatlineSymbol = 'CIMSymbolReference'
        self.maxInteriorAngle = 150
        self.edgeMinimumLength = 0.0
        self.mapGridEdges = []
        self.minScale = 0.0
        self.maxScale = 0.0
    
class CIMMapGridEdge():
    """
      Represents a map grid edge.
    """
    def __init__(self, *args, **Kwargs):
        self.partIndex = 0
        self.segmentIndices = []
    
class CIMMapProductGridReference():
    """
      Represents how a grid reference (MGRS) should be displayed within 
      CIMMapProductGridStreetIndex.
    """
    def __init__(self, *args, **Kwargs):
        self.gridReferenceFieldName = str()
        self.precisionLevel = GridReferencePrecisionLevel.GridZoneDesignator
    
class CIMMapSeries():
    """
      The Map series object represents a means to create multi-page PDF or
        /// based off of fields in the index layer.
    """
    def __init__(self, *args, **Kwargs):
        self.enabled = True
        self.mapFrameName = str()
        self.startingPageNumber = 1
        self.currentPageID = 1
    
class CIMMargin():
    """
      Represents a margin to apply around the page.
    """
    def __init__(self, *args, **Kwargs):
        self.left = 1.0
        self.right = 1.0
        self.top = 1.0
        self.bottom = 1.0
    
class CIMMeterReferenceProperties():
    """
      Defines the display properties of the meter reference guide.
    """
    def __init__(self, *args, **Kwargs):
        self.gridSquareUpperLeft = str()
        self.gridSquareUpperRight = str()
        self.gridSquareLowerLeft = str()
        self.gridSquareLowerRight = str()
        self.gridSquareUpperLeftDual = str()
        self.gridSquareUpperRightDual = str()
        self.gridSquareLowerLeftDual = str()
        self.gridSquareLowerRightDual = str()
        self.gridSquareVerticalSeparator = 0
        self.gridSquareHorizontalSeparator = 0
        self.gridSquareHorizontalSeparatorDual = 0
        self.gridZoneUpperLeft = str()
        self.gridZoneUpperRight = str()
        self.gridZoneLowerLeft = str()
        self.gridZoneLowerRight = str()
        self.gridZoneLatitude = 0
        self.gridZoneLongitude = 0
    
class CIMPage():
    """
      Represents the page information associated with a layout.
    """
    def __init__(self, *args, **Kwargs):
        self.height = 11
        self.stretchElements = False
        self.width = 8.5
        self.printerPreferences = 'CIMPrinterPreferences'
        self.units = str()
        self.guides = []
        self.showRulers = True
        self.showGuides = True
        self.smallestRulerDivision = 0.01
        self.margin = 'CIMMargin'
        self.showMargin = True
    
class CIMPrinterPreferences():
    """
      Represents the printer preferences associated with a layout.
    """
    def __init__(self, *args, **Kwargs):
        self.printerName = str()
        self.paperName = str()
        self.paperSource = 0
    
class CIMProfileGrid():
    """
      Grid shown for the profile.
    """
    def __init__(self, *args, **Kwargs):
        self.horizontalScale = 300
        self.horizontalScaleUnits = str()
        self.verticalScale = 30
        self.verticalScaleUnits = str()
        self.autoGridExtent = True
        self.yMin = 0
        self.yMax = 1000
        self.subDivisionsX = 6
        self.subDivisionsY = 6
        self.gridSymbol = 'CIMSymbolReference'
        self.subDivisionSymbol = 'CIMSymbolReference'
        self.horizontalScaleTextSymbol = 'CIMSymbolReference'
        self.verticalScaleLeftTextSymbol = 'CIMSymbolReference'
        self.verticalScaleRightTextSymbol = 'CIMSymbolReference'
        self.showEntireApproach = True
        self.xMax = 2000
        self.verticalIntervalInMeters = 2
        self.verticalIntervalInFeet = 2
        self.showAbsoluteHorizontalScale = True
    
class CIMProfileOIS():
    """
      Defines the properties for OIS features.
    """
    def __init__(self, *args, **Kwargs):
        self.oISDescription = str()
        self.oISLabel = str()
        self.showOIS = True
        self.isPrimary = False
        self.displayOrder = 0
        self.oISSymbol = 'CIMSymbolReference'
        self.oISTextSymbol = 'CIMSymbolReference'
    
class CIMProfileObstacle():
    """
      Represents common properties for all the obstacles.
    """
    def __init__(self, *args, **Kwargs):
        self.showPenetrating = True
        self.obstacleLayerName = str()
        self.symbolSubstitutionType = ProfileObstacleSymbolSubstitutionType.eNone
    
class CIMProfileRunway():
    """
      Display properties for Runway.
    """
    def __init__(self, *args, **Kwargs):
        self.precision = 2
        self.elevationChangeThreshold = 10.0
        self.runwayLineSymbol = 'CIMSymbolReference'
        self.runwayTextSymbol = 'CIMSymbolReference'
    
class CIMProfileTerrain():
    """
      Display properties for Terrain.
    """
    def __init__(self, *args, **Kwargs):
        self.showOutline = False
        self.maxTerrain = 'CIMProfileTerrainDisplay'
        self.minTerrain = 'CIMProfileTerrainDisplay'
        self.centerLineTerrain = 'CIMProfileTerrainDisplay'
    
class CIMProfileTerrainDisplay():
    """
      Settings to control how the terrain information is being displayed 
      in the profile.
    """
    def __init__(self, *args, **Kwargs):
        self.displayOption = ProfileTerrainDisplayOption.All
        self.terrainSymbol = 'CIMSymbolReference'
        self.penetratingTerrainSymbol = 'CIMSymbolReference'
    
class CIMReportDataSource():
    """
      Represents the data source properties of a report. The data source 
      can be a map member or external data.
    """
    def __init__(self, *args, **Kwargs):
        self.dataConnection = 'CIMDataConnection'
        self.definitionQuery = str()
        self.fields = []
        self.mapMemberURI = str()
        self.useSelectionSet = False
    
class CIMReportElementFieldProperties():
    """
      Represents field properties that will be applied to an element 
      in a report.
    """
    def __init__(self, *args, **Kwargs):
        self.element = str()
        self.field = str()
        self.format = 'CIMNumberFormat'
        self.statistic = FieldStatisticsFlag.NoStatistics
    
class CIMReportWatermark():
    """
      Represents a watermark in a report.
    """
    def __init__(self, *args, **Kwargs):
        self.element = 'CIMElement'
        self.excludePageNumbers = str()
        self.isBackground = True
    
class CIMTableField():
    """
      Represents properties for a table field.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.isVisible = False
        self.width = 0
        self.sortInfo = FieldSortInfo.eNone
        self.sortOrder = -1
        self.fieldOrder = 0
        self.group = False
        self.displayName = str()
    
class CIMTick():
    """
      Represents a tick of a grid.
    """
    def __init__(self, *args, **Kwargs):
        self.length = 1.0
        self.offset = 0.0
        self.isVisible = True
        self.symbol = 'CIMSymbolReference'
        self.gridEndpoint = 'CIMGridEndpoint'
    
from .CIMCore import CIMDefinition
class CIMLayout(CIMDefinition):
    """
      Represents a layout in a project.
    """
    """
      Represents a layout in a project.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.elements = []
        self.page = 'CIMPage'
        self.dateExported = GetPythonClass('datetime', 'datetime')
        self.datePrinted = GetPythonClass('datetime', 'datetime')
        self.mapSeries = 'CIMMapSeries'
        self.colorModel = ColorModel.RGB
        self.rGBColorProfile = str()
        self.cMYKColorProfile = str()
        self.simulateOverprint = False
        self.customProperties = []
        self.defaultColorVisionDeficiencyMode = ColorVisionDeficiencyType.eNone
    
from .CIMDocument import CIMView
class CIMLayoutView(CIMView):
    """
      Represents a layout view in the project.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.extent = GetPythonClass('arcpy', 'Extent')
        self.defaultMapFrameName = str()
        self.pauseDrawing = False
        self.colorVisionDeficiencyMode = ColorVisionDeficiencyType.eNone
    
from .CIMDocument import CIMVersion
class CIMReportDocument(CIMVersion):
    """
      Represents a report document which is the document type used for 
      saving .rlfx files.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.binaryReferences = []
        self.layerDefinitions = []
        self.mapDefinitions = []
        self.reportDefinition = 'CIMReport'
        self.tableDefinitions = []
        self.layoutDefinitions = []
        self.linkChartDefinitions = []
        self.timelineDefinitions = []
        self.videoDefinitions = []
        self.elevationSurfaceLayerDefinitions = []
    
class CIMBookmarkMapSeries(CIMMapSeries):
    """
      Bookmark map series is a means to create a series of map pages 
      based on saved bookmarks.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.pages = []
        self.scaleRounding = 0.0
        self.extentOptions = ExtentFitType.BestFit
        self.marginType = UnitType.Percent
        self.marginUnits = str()
        self.margin = 0.0
    
class CIMCustomGrid(CIMMapGrid):
    """
      Represents a custom grid of the mapFrame.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.layerURI = str()
        self.gridLines = []
    
class CIMCustomGridLabelTemplate(CIMGridLabelTemplate):
    """
      Defines the label template for custom grids.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.labelExpressionInfo = 'CIMExpressionInfo'
        self.edgeLabelAngles = []
        self.symbol = 'CIMSymbolReference'
    
class CIMExteriorTick(CIMTick):
    """
      Class that represents an exterior tick for a grid.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.edgeAffinity = []
        self.drawPerpendicular = False
    
class CIMFrameElement(CIMElement):
    """
      Represents the frame that is associated with some element types 
      (for example, map frame, legends and so on).
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.frame = GetPythonClass('arcpy', 'Polygon')
        self.graphicFrame = 'CIMGraphicFrame'
    
class CIMGZDLabelGridLine(CIMGridLine):
    """
      Represents a UTM Grid Zone Designator Label definition for a MapGrid.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dynamicStringTemplate = str()
        self.verticalTopPosition = 'CIMGridZoneLabelPosition'
        self.verticalCenterPosition = 'CIMGridZoneLabelPosition'
        self.verticalBottomPosition = 'CIMGridZoneLabelPosition'
        self.horizontalLeftPosition = 'CIMGridZoneLabelPosition'
        self.horizontalCenterPosition = 'CIMGridZoneLabelPosition'
        self.horizontalRightPosition = 'CIMGridZoneLabelPosition'
    
class CIMGraphicElement(CIMElement):
    """
      Represents the CIM representation of an element on a page layout.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.graphic = 'CIMGraphic'
    
class CIMGraticule(CIMMapGrid):
    """
      Represents a graticule for a map frame.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.customOrigin = GetPythonClass('arcpy', 'Point')
        self.geographicCoordinateSystem = GetPythonClass('arcpy', 'SpatialReference')
        self.gridLines = []
        self.isAutoScaled = False
        self.useMapClipShape = True
    
class CIMGroupElement(CIMFrameElement):
    """
      Represents a collection of layout elements in a group element.
    """
    """
      Represents a collection of layout elements in a group element.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.elements = []
    
class CIMHorizontalBarLegendItem(CIMLegendItem):
    """
      Represents a horizontal bar legend item.
    """
    """
      Represents a horizontal bar legend item.
    """
    """
      Represents a horizontal bar legend item.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.arrangement = LegendItemArrangement.PatchLabelDescription
        self.angleAbove = 45
        self.angleBelow = 45
        self.patchAlignment = VerticalAlignment.Center
        self.lineSymbol = 'CIMSymbolReference'
        self.lineLength = 5
    
class CIMHorizontalLegendItem(CIMLegendItem):
    """
      Represents a horizontal legend item.
    """
    """
      Represents a horizontal legend item.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.arrangement = LegendItemArrangement.PatchLabelDescription
    
class CIMInteriorTick(CIMTick):
    """
      Class that represents an interior tick for a grid.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.pattern = 'CIMGridPattern'
        self.indicateDirection = True
    
class CIMLadderGridLine(CIMGridLine):
    """
      Represents internal labels for a MapGrid.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dynamicStringTemplate = str()
        self.gapX = 0.0
        self.gapY = 0.0
        self.position = GridLadderLabelPosition.Half
    
class CIMMGRSGridLine(CIMGridLine):
    """
      Represents a gridLine to draw the 100,000 MGRS grids.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.xOffset = 2.0
        self.yOffset = 2.0
        self.labelPosition = MGRSLabelPosition.Center
    
class CIMMapFrame(CIMFrameElement):
    """
      Represents a map frame on a page layout.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.autoCamera = 'CIMAutoCamera'
        self.uRI = str()
        self.view = 'CIMMapView'
        self.extentIndicators = []
        self.grids = []
        self.useMapBackgroundColor = False
        self.extentIndicatorsExpanded = True
        self.mapGridsExpanded = True
    
class CIMMapSurround(CIMFrameElement):
    """
      Represents a map surround on a page layout.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.mapFrame = str()
        self.minScale = 0.0
        self.maxScale = 0.0
    
class CIMMeasuredGrid(CIMMapGrid):
    """
      Represents a measured grid of the mapFrame.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.customOrigin = GetPythonClass('arcpy', 'Point')
        self.projectedCoordinateSystem = GetPythonClass('arcpy', 'SpatialReference')
        self.gridLines = []
        self.isAutoScaled = False
        self.clipUTMZone = False
        self.useMapClipShape = True
    
class CIMNestedLegendItem(CIMLegendItem):
    """
      Represents a nested legend item in a legend.
    """
    """
      Represents a nested legend item in a legend.
    """
    """
      Represents a nested legend item in a legend.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.lineSymbol = 'CIMSymbolReference'
        self.lineLength = 5
        self.arrangement = LegendItemArrangement.PatchLabelDescription
        self.autoLayout = True
        self.labelEnds = False
        self.outlineSymbol = 'CIMSymbolReference'
        self.showOutlines = False
        self.patchAlignment = HorizontalAlignment.Center
    
class CIMNorthArrow(CIMMapSurround):
    """
      Represents a north arrow on a page layout.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.referenceLocation = GetPythonClass('arcpy', 'Point')
        self.calibrationAngle = 0.0
    
class CIMProfileFrame(CIMMapSurround):
    """
      Layout element used to draw Profile view of
        /// Runway, Terrain, obstacles and Obstruction Identification 
      Surfaces (OIS).
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.heightOption = ProfileFrameHeightOption.ConstantHeight
        self.height = 2
        self.heightUnits = str()
        self.ratio = 10
        self.runwayDesignator = str()
        self.primaryOISDescription = str()
        self.secondaryOISDescription = str()
        self.oISLayerURI = str()
        self.grid = 'CIMProfileGrid'
        self.terrain = 'CIMProfileTerrain'
        self.runway = 'CIMProfileRunway'
        self.oISSurfaces = []
        self.obstacles = []
        self.profileType = ProfileFrameType.Straight
        self.profileStyle = ProfileFrameStyle.AOC
        self.runwayEndLeftAsReference = True
    
class CIMProfilePointObstacle(CIMProfileObstacle):
    """
      Defines the properties for a Point obstacle.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.markerLocation = ProfileObstacleMarkerLocation.Surface
        self.obstacleBaseSymbol = 'CIMSymbolReference'
        self.obstacleHeightSymbol = 'CIMSymbolReference'
        self.obstacleMarkerSymbol = 'CIMSymbolReference'
        self.obstacleTextSymbol = 'CIMSymbolReference'
        self.showOnlyShadowingObstacles = False
        self.substituteObstacleBaseSymbol = 'CIMSymbolReference'
        self.substituteObstacleHeightSymbol = 'CIMSymbolReference'
        self.substituteObstacleMarkerSymbol = 'CIMSymbolReference'
        self.substituteObstacleTextSymbol = 'CIMSymbolReference'
    
class CIMProfilePolyObstacle(CIMProfileObstacle):
    """
      Represents a profile poly obstacle.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.groundDisplayOption = ProfileObstacleGroundDisplayOption.Max
        self.obstacleSymbol = 'CIMSymbolReference'
        self.substituteObstacleSymbol = 'CIMSymbolReference'
    
class CIMReferenceGrid(CIMMapGrid):
    """
      Defines a reference grid.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.isAutoScaled = False
        self.rowCount = 0
        self.columnCount = 0
        self.gridLines = []
    
class CIMReferenceGridLabelTemplate(CIMGridLabelTemplate):
    """
      Defines the label template for the reference grids.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.name = str()
        self.values = []
        self.delimiter = str()
        self.symbol = 'CIMSymbolReference'
    
class CIMReport(CIMLayout):
    """
      Represents a report in a project.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.height = 0
        self.startPage = 1
        self.watermarks = []
    
class CIMReportField(CIMTableField):
    """
      Represents a field in a report.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMReportMapFrameElementProperties(CIMReportElementFieldProperties):
    """
      Represents properties that will be applied to a map frame element 
      in a report.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.spatialMapSeries = 'CIMSpatialMapSeries'
    
class CIMReportSectionElement(CIMGroupElement):
    """
      Represents a section of elements in a report.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.autoSize = False
        self.elementFieldProperties = []
        self.excludePageNumberPages = str()
        self.excludeSectionPages = str()
        self.startOnNewPage = False
        self.autoGrowTextElements = False
    
class CIMScaleBar(CIMMapSurround):
    """
      Represents a scale bar on a page layout.
    """
    """
      Represents a scale bar on a page layout.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.alignToZeroPoint = False
        self.barHeight = 0.0
        self.division = 100.0
        self.divisions = 2
        self.divisionsBeforeZero = 1
        self.fittingStrategy = ScaleBarFittingStrategy.AdjustDivision
        self.labelFrequency = ScaleBarFrequency.DivisionsAndFirstMidpoint
        self.labelGap = 3.0
        self.labelPosition = ScaleBarVerticalPosition.Above
        self.labelSymbol = 'CIMSymbolReference'
        self.numberFormat = 'CIMNumberFormat'
        self.subdivisions = 4
        self.unitLabel = str()
        self.unitLabelGap = 3.0
        self.unitLabelPosition = ScaleBarLabelPosition.AfterLabels
        self.unitLabelSymbol = 'CIMSymbolReference'
        self.units = str()
        self.useFractionCharacters = False
        self.zeroPoint = GetPythonClass('arcpy', 'Point')
        self.computeAtCenter = False
        self.displayFirstOutside = False
        self.displayLastOutside = False
        self.barWidth = 0.0
        self.divisionMarkHeight = 7.0
        self.divisionMarkSymbol = 'CIMSymbolReference'
        self.markFrequency = ScaleBarFrequency.DivisionsAndFirstSubdivisions
        self.markPosition = ScaleBarVerticalPosition.Above
        self.subdivisionMarkHeight = 5.0
        self.subdivisionMarkSymbol = 'CIMSymbolReference'
        self.midpointMarkHeight = 5.0
        self.midpointMarkSymbol = 'CIMSymbolReference'
    
class CIMScaleLine(CIMScaleBar):
    """
      Represents a Scale line on a page layout.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.lineSymbol = 'CIMSymbolReference'
        self.stepped = False
    
class CIMSimpleGridLabelTemplate(CIMGridLabelTemplate):
    """
      Represents a simple format for a label.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dynamicStringTemplate = str()
        self.symbol = 'CIMSymbolReference'
    
class CIMSingleFillScaleBar(CIMScaleBar):
    """
      Represents and single fill scale bar on a page layout.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fillSymbol = 'CIMSymbolReference'
    
class CIMSpatialMapSeries(CIMMapSeries):
    """
      Spatial Map Series is a means to create a series of map pages based 
      /// off of spatial features.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.indexLayerURI = str()
        self.nameField = str()
        self.numberField = str()
        self.categoryField = str()
        self.rotationField = str()
        self.sortField = str()
        self.scaleField = str()
        self.spatialReferenceField = str()
        self.sortAscending = True
        self.scaleRounding = 0.0
        self.extentOptions = ExtentFitType.BestFit
        self.marginType = UnitType.Percent
        self.marginUnits = str()
        self.margin = 0.0
        self.clipMapToIndexFeature = False
    
class CIMTabGridLine(CIMGridLine):
    """
      Defines a tab for a MapGrid.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.alternatingSymbols = False
        self.alternatingSymbol = 'CIMSymbolReference'
        self.height = 1.0
    
class CIMTableFrame(CIMMapSurround):
    """
      Layout element used to display tabular data.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fields = []
        self.mapMemberURI = str()
        self.fillingStrategy = TableFrameFillingStrategy.ShowAllRows
        self.fittingStrategy = TableFrameFittingStrategy.AdjustSize
        self.columns = 1
        self.minFontSize = 0
        self.verticalTextGap = 2
        self.horizontalTextGap = 2
        self.headingGap = 2
        self.rowGap = 2
        self.fieldGap = 2
        self.columnGap = 2
        self.headingBackgroundSymbol = 'CIMSymbolReference'
        self.headingBorderSymbol = 'CIMSymbolReference'
        self.headingLineSymbol = 'CIMSymbolReference'
        self.columnBorderSymbol = 'CIMSymbolReference'
        self.alternate1RowBackgroundSymbol = 'CIMSymbolReference'
        self.alternate1RowBackgroundCount = 0
        self.alternate2RowBackgroundSymbol = 'CIMSymbolReference'
        self.alternate2RowBackgroundCount = 0
        self.rowBorderSymbol = 'CIMSymbolReference'
        self.customWhereClause = str()
        self.defaultTableFrameField = 'CIMTableFrameField'
        self.balanceColumns = True
        self.rowLimit = 0
    
class CIMTableFrameField(CIMTableField):
    """
      Display properties for fields in a table frame.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.enableWordWrapping = False
        self.headingTextSymbol = 'CIMSymbolReference'
        self.textSymbol = 'CIMSymbolReference'
        self.backgroundSymbol = 'CIMSymbolReference'
        self.borderSymbol = 'CIMSymbolReference'
        self.verticalLineSymbol = 'CIMSymbolReference'
    
class CIMTemporalMapSeries(CIMMapSeries):
    """
      Temporal map series is a means to create a series of map pages 
      based on time settings.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.timeExtent = TimeExtent
        self.interval = 0.0
        self.intervalUnits = esriTimeUnits.esriTimeUnitsMilliseconds
    
class CIMThematicMapSeries(CIMMapSeries):
    """
      Thematic map series is a means to create a series of map pages 
      based on different layers.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.groupLayerURI = str()
    
class CIMTopoNorthArrow(CIMNorthArrow):
    """
      Represents a topographic north arrow which displays declination 
      of true, grid and magnetic north.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.date = GetPythonClass('datetime', 'datetime')
        self.zone = GetPythonClass('arcpy', 'SpatialReference')
        self.isPrimaryZone = True
        self.gMAngle = 'CIMDeclination'
        self.gridConvergence = 'CIMDeclination'
        self.directionalNotes = True
        self.leadingZero = True
        self.roundGMAngle = True
        self.roundMils = True
        self.autoUpdate = True
        self.largeSize = True
        self.textSymbol = 'CIMSymbolReference'
        self.lineSymbol = 'CIMSymbolReference'
        self.trueNorthMarkerSymbol = 'CIMSymbolReference'
        self.magneticNorthNegativeSymbol = 'CIMSymbolReference'
        self.magneticNorthPositiveSymbol = 'CIMSymbolReference'
        self.magneticNorthZeroSymbol = 'CIMSymbolReference'
        self.declinationArcSymbol = 'CIMSymbolReference'
        self.productSpecification = MapProductSpecType.TLM
        self.drawToSpecification = True
        self.dateInterval = 0
    
class CIMVerticalLegendItem(CIMLegendItem):
    """
      Represents a vertical legend item in a legend.
    """
    """
      Represents a vertical legend item in a legend.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.arrangement = LegendItemArrangement.PatchLabelDescription
        self.patchAlignment = HorizontalAlignment.Center
    
class CIMAttachmentFrame(CIMFrameElement):
    """
      Represents an attachment graphic frame.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.maxImages = 1
        self.sortFieldName = str()
        self.sortOrder = FieldSortInfo.Desc
        self.imageFrame = 'CIMGraphicFrame'
        self.gridRows = 1
        self.gridColumns = 1
        self.gridRowDirection = True
        self.imageHeight = 1.0
        self.imageWidth = 1.0
    
class CIMAviationNorthArrow(CIMNorthArrow):
    """
      Represents a aviation north arrow which displays declination of 
      true, grid and magnetic north.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.date = GetPythonClass('datetime', 'datetime')
        self.declinationSpatialReference = GetPythonClass('arcpy', 'SpatialReference')
        self.gMAngle = 'CIMDeclination'
        self.gridConvergence = 'CIMDeclination'
        self.trueNorthArrow = 'CIMAviationArrow'
        self.magneticNorthArrow = 'CIMAviationArrow'
        self.gridNorthArrow = 'CIMAviationArrow'
        self.variation = 'CIMAviationVariation'
        self.rateOfChangeTextSymbol = 'CIMSymbolReference'
        self.displayVariationDate = False
        self.displayRateOfChange = True
        self.autoUpdate = True
        self.rateOfChangeText = str()
    
class CIMAviationVerticalScaleBar(CIMFrameElement):
    """
      Represents an aviation-specific Vertical Scale Bar.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.verticalLineSymbol = 'CIMSymbolReference'
        self.feetScale = 'CIMAviationVerticalScaleProperties'
        self.meterScale = 'CIMAviationVerticalScaleProperties'
        self.divisionMarkHeight = 5.0
        self.divisionsBeforeZero = False
        self.feetOnRight = True
    
class CIMBaseStreetIndex(CIMMapSurround):
    """
      Represents the base class for index feature surround elements.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.layerURI = str()
        self.fields = []
        self.titleText = str()
        self.titleTextSymbol = 'CIMSymbolReference'
        self.headerTextSymbol = 'CIMSymbolReference'
        self.textSymbol = 'CIMSymbolReference'
        self.fittingStrategy = TableFrameFittingStrategy.AdjustSize
        self.wrapMethod = StreetIndexWrapMethod.Wrap
        self.minFontSize = 10.0
        self.headerGap = 100.0
        self.groupTextSymbol = 'CIMSymbolReference'
        self.groupGap = 100.0
        self.columns = 1
        self.indexDelimiter = StreetIndexDelimiter.Period
    
class CIMChartFrame(CIMMapSurround):
    """
      Layout element used to display a chart.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.mapMemberURI = str()
        self.chartName = str()
        self.isDynamic = True
        self.useMapSeriesShape = False
    
class CIMCondensedTabGridLine(CIMTabGridLine):
    """
      Defines a condensed tab.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.width = 1.0
        self.condensedTab = CondensedTabType.Rectangle
    
class CIMContiguousTabGridLine(CIMTabGridLine):
    """
      Defines a contiguous tab for a referenced grid.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.contiguousTab = ContiguousTabType.Continuous
    
class CIMCruisingAltitudeDiagram(CIMFrameElement):
    """
      Represents a Cruising Altitude Diagram.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.diagramType = CruisingAltitudeDiagramType.Vertical
        self.altitudeTextSymbol = 'CIMSymbolReference'
        self.bearingTextSymbol = 'CIMSymbolReference'
        self.titleTextSymbol = 'CIMSymbolReference'
        self.bearingArrowLineSymbol = 'CIMSymbolReference'
        self.lineSymbol = 'CIMSymbolReference'
        self.diameterUnits = str()
        self.diagramDiameter = 0.9
        self.diagramTitle = str()
        self.verticalLeftText = str()
        self.verticalRightText = str()
        self.horizontalTopText = str()
        self.horizontalBottomText = str()
        self.quadrantalTopLeftText = str()
        self.quadrantalTopRightText = str()
        self.quadrantalBottomLeftText = str()
        self.quadrantalBottomRightText = str()
        self.autoResizeText = True
    
class CIMDoubleFillScaleBar(CIMScaleBar):
    """
      Represents a double filled alternating scale bar.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fillSymbol1 = 'CIMSymbolReference'
        self.fillSymbol2 = 'CIMSymbolReference'
        self.style = DoubleFillScaleBarStyle.Hollow
    
class CIMGroupFooter(CIMReportSectionElement):
    """
      Represents a group footer section in a report.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.field = str()
        self.alignSubsectionToBottom = False
    
class CIMGroupHeader(CIMReportSectionElement):
    """
      Represents a group header section in a report.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.field = str()
        self.repeatOnEveryPage = False
    
class CIMLegend(CIMMapSurround):
    """
      Represents a legend on a layout.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.autoAdd = True
        self.autoFonts = False
        self.autoReorder = True
        self.autoVisibility = True
        self.defaultPatchHeight = 12.0
        self.defaultPatchWidth = 24.0
        self.descriptionWidth = 0.0
        self.groupGap = 5.0
        self.headingGap = 5.0
        self.horizontalItemGap = 5.0
        self.patchGap = 5.0
        self.items = []
        self.labelWidth = 0.0
        self.minFontSize = 4.0
        self.rightToLeft = False
        self.scaleSymbols = False
        self.showTitle = True
        self.textGap = 5.0
        self.title = str()
        self.titleGap = 8.0
        self.titleSymbol = 'CIMSymbolReference'
        self.itemGap = 5.0
        self.classGap = 5.0
        self.layerNameGap = 5.0
        self.featureCountPrefix = str()
        self.featureCountSuffix = str()
        self.fittingStrategy = LegendFittingStrategy.AdjustColumnsAndSize
        self.groupLayerNameGap = 5.0
        self.columns = 1
        self.makeColumnsSameWidth = False
        self.defaultLegendItem = 'CIMLegendItem'
        self.excludedLayers = []
        self.balanceColumns = True
    
class CIMMapProductFeatureGuide(CIMBaseStreetIndex):
    """
      Represents the Guide to Numbered (GNF) surround element.
    """
    """
      Represents the Guide to Numbered (GNF) surround element.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.autoUpdate = False
        self.productSpecification = MapProductSpecType.Unset
        self.drawToSpecification = False
        self.gridReference = 'CIMMapProductGridReference'
        self.iDNumberFieldName = str()
        self.categoryCodeFieldName = str()
    
class CIMMapProductGridStreetIndex(CIMBaseStreetIndex):
    """
      Represents a street index that calculates the grid reference (MGRS) 
      of each street in surround element.
    """
    """
      Represents a street index that calculates the grid reference (MGRS) 
      of each street in surround element.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.autoUpdate = False
        self.productSpecification = MapProductSpecType.Unset
        self.drawToSpecification = False
        self.gridReference = 'CIMMapProductGridReference'
    
class CIMMapProductSurround(CIMMapSurround):
    """
      The base class for layout surround elements used in producing map 
      products based on industry specifications.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.autoUpdate = False
        self.productSpecification = MapProductSpecType.Unset
        self.drawToSpecification = False
    
class CIMMarkerNorthArrow(CIMNorthArrow):
    """
      Represents a marker north arrow on a page layout.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.pointSymbol = 'CIMSymbolReference'
        self.northType = NorthType.TrueNorth
    
class CIMMeterReferenceGuide(CIMMapProductSurround):
    """
      Provides a set of instructions and examples that enable users to 
      compose standard grid reference.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.gridSquareType = MeterReferenceSquareType.Single
        self.isSingleGridZone = True
        self.properties = 'CIMMeterReferenceProperties'
        self.textSymbol = 'CIMSymbolReference'
        self.lineSymbol = 'CIMSymbolReference'
    
class CIMRelatedReportSection(CIMReportSectionElement):
    """
      Represents a Related Report section of a report.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataSource = 'CIMReportDataSource'
        self.relateName = str()
        self.expressions = []
    
class CIMReportDetails(CIMReportSectionElement):
    """
      Represents a details section of a report.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.columns = 1
        self.rowBackgroundColors = []
        self.rowBackgroundCount = 0
        self.keepRecordTogether = False
    
class CIMReportFooter(CIMReportSectionElement):
    """
      Represents a report footer in a report.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.alignSubsectionToBottom = False
    
class CIMReportHeader(CIMReportSectionElement):
    """
      Represents a report header section in a report.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.coverPage = False
    
class CIMReportPageFooter(CIMReportSectionElement):
    """
      Represents a page footer in a report.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMReportPageHeader(CIMReportSectionElement):
    """
      Represents a page header section in a report.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMReportPageSection(CIMReportSectionElement):
    """
      Represents a supplemental page section of a report.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.includePageNumber = False
    
class CIMReportSection(CIMReportSectionElement):
    """
      Gets or sets the data source for a report.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataSource = 'CIMReportDataSource'
        self.expressions = []
    
class CIMSlopeGuide(CIMMapProductSurround):
    """
      A slope guide surround element which is used to ascertaining terrain 
      slope graphically /// as a percentage and a gradient (degree).
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.slopeGuideLayerURI = str()
        self.contourIntervalField = str()
        self.mapScale = 50000
        self.contourInterval = 20
        self.titleTextSymbol = 'CIMSymbolReference'
        self.slopeUnitTextSymbol = 'CIMSymbolReference'
        self.slopeTextSymbol = 'CIMSymbolReference'
        self.footnoteTextSymbol = 'CIMSymbolReference'
        self.verticalLineSymbol = 'CIMSymbolReference'
        self.horizontalLineSymbol = 'CIMSymbolReference'
        self.tickLineSymbol = 'CIMSymbolReference'
    
class CIMTMElevationGuideBarElement(CIMMapProductSurround):
    """
      Represents TM Elevation Guide Bar surround element.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.elevationBandLayerURI = str()
        self.numberOfBands = 4
        self.textSymbol = 'CIMSymbolReference'
        self.lineSymbol = 'CIMSymbolReference'
        self.highestBandSymbol = 'CIMSymbolReference'
        self.highBandSymbol = 'CIMSymbolReference'
        self.mediumBandSymbol = 'CIMSymbolReference'
        self.lowBandSymbol = 'CIMSymbolReference'
    
class CIMTopoCompassRose(CIMTopoNorthArrow):
    """
      Represents a compass rose north arrow which displays declination 
      with a compass dial.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.degreeLabelFrequency = 30
        self.divisionMarkSymbol = 'CIMSymbolReference'
        self.subdivisionMarkSymbol = 'CIMSymbolReference'
        self.degreeMarkSymbol = 'CIMSymbolReference'
        self.divisions = 10
        self.subdivisions = 5
    
class CIMGlossaryTable(CIMMapProductSurround):
    """
      Represents a glossary table for map product surround elements.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fittingStrategy = TableFrameFittingStrategy.AdjustSize
        self.mapMemberURI = str()
        self.fields = []
        self.title = str()
        self.titleTextSymbol = 'CIMSymbolReference'
        self.rightToLeft = False
        self.minFontSize = 0
        self.titleGap = 2
        self.headingGap = 2
        self.rowGap = 2
        self.horizontalTextGap = 2
        self.verticalTextGap = 2
        self.delimiterCharacter = str()
        self.delimiterTextSymbol = 'CIMSymbolReference'
    
class CIMReportLayoutPageSection(CIMReportPageSection):
    """
      Represents a layout supplemental page section of a report.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.layoutURI = str()
    
