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

class CIMActivity():
    """
      Represents activity.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMAggregateVisualization():
    """
      Describes the appearance of aggregated features.
    """
    def __init__(self, *args, **Kwargs):
        self.renderer = 'CIMRenderer'
        self.labelClass = 'CIMLabelClass'
        self.showLabels = False
    
class CIMBindVariable():
    """
      Represents a bind variable.
    """
    def __init__(self, *args, **Kwargs):
        self.variableName = str()
        self.alias = str()
        self.dataType = BindVariableType.String
    
class CIMCondition():
    """
      Represents a condition.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMDataConnection():
    """
      Represents a data connection.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMDatabaseRelateInfo():
    """
      Represents database relationship info that is used to represent 
      layer or table level overrides.
    """
    def __init__(self, *args, **Kwargs):
        self.relationshipClassName = str()
        self.serviceRelateID = -1
        self.relatedMapMemberURI = str()
    
class CIMDimensionShape():
    """
      Represents a dimension shape as used by a dimension feature.
    """
    def __init__(self, *args, **Kwargs):
        self.beginDimensionPoint = GetPythonClass('arcpy', 'Point')
        self.endDimensionPoint = GetPythonClass('arcpy', 'Point')
        self.dimensionLinePoint = GetPythonClass('arcpy', 'Point')
        self.textPoint = GetPythonClass('arcpy', 'Point')
        self.extensionLineAngle = 0.0
        self.textAngle = 0.0
    
class CIMDimensionStyle():
    """
      Represents an dimension style which defines dimension appearance.
    """
    def __init__(self, *args, **Kwargs):
        self.align = False
        self.baselineHeight = 0
        self.beginMarkerSymbol = 'CIMPointSymbol'
        self.convertUnits = False
        self.dimensionLineOption = DimensionPartOptions.Begin
        self.dimensionLineSymbol = 'CIMLineSymbol'
        self.displayPrecision = 0
        self.displayUnits = str()
        self.drawLineOnFit = False
        self.endMarkerSymbol = 'CIMPointSymbol'
        self.expression = str()
        self.expressionParserName = str()
        self.expressionTitle = str()
        self.extendLineOnFit = False
        self.extensionLineOffset = 0
        self.extensionLineOption = DimensionPartOptions.Begin
        self.extensionLineOvershot = 0
        self.extensionLineSymbol = 'CIMLineSymbol'
        self.iD = 0
        self.markerFit = DimensionMarkerFit.eNone
        self.markerFitTolerance = 0
        self.markerOption = DimensionPartOptions.Begin
        self.name = str()
        self.prefix = str()
        self.suffix = str()
        self.textFit = DimensionTextFit.eNone
        self.textOption = DimensionTextOption.Only
        self.textSymbol = 'CIMTextSymbol'
    
class CIMDisplayFilter():
    """
      Represents a display filter used to restrict the display of features 
      across scale ranges.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.whereClause = str()
        self.minScale = 0.0
        self.maxScale = 0.0
    
class CIMDisplayTable():
    """
      Represents a display table.
    """
    def __init__(self, *args, **Kwargs):
        self.definitionExpression = str()
        self.definitionExpressionName = str()
        self.definitionFilterChoices = []
        self.displayField = str()
        self.editable = True
        self.relates = []
        self.fieldDescriptions = []
        self.timeFields = 'CIMTimeTableDefinition'
        self.timeDefinition = 'CIMTimeDataDefinition'
        self.timeDisplayDefinition = 'CIMTimeDisplayDefinition'
        self.timeDimensionFields = 'CIMTimeDimensionDefinition'
        self.rangeDefinitions = []
        self.activeRangeName = str()
        self.selectRelatedData = False
        self.bindVariables = []
        self.subtypeValue = 0
        self.useSubtypeValue = False
        self.displayExpressionInfo = 'CIMExpressionInfo'
        self.selectionSetURI = str()
        self.floorAwareTableProperties = 'CIMFloorAwareTableProperties'
        self.routeIDFieldName = str()
        self.databaseRelates = []
    
class CIMENCDisplaySettings():
    """
      Represents generic ENC display settings.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMENCSubTable():
    """
      Represents an ENC subtable.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.subTableID = str()
    
class CIMEditingTemplate():
    """
      Represents an editing template.
    """
    def __init__(self, *args, **Kwargs):
        self.description = str()
        self.name = str()
        self.tags = str()
        self.defaultToolGUID = str()
        self.excludedToolGUIDs = []
        self.toolOptions = []
    
class CIMEditingTemplateRelationship():
    """
      Represents an editing template relationship.
    """
    def __init__(self, *args, **Kwargs):
        self.tableURI = str()
        self.name = str()
        self.relationshipID = 0
    
class CIMEditingTemplateToolOptions():
    """
      Represents editing template tool options.
    """
    def __init__(self, *args, **Kwargs):
        self.toolProgID = str()
        self.options = {}
    
class CIMFeatureExtrusion():
    """
      Represents feature extrusion.
    """
    def __init__(self, *args, **Kwargs):
        self.extrusionType = ExtrusionType.eNone
        self.extrusionExpression = str()
        self.extrusionUnit = str()
        self.extrusionExpressionInfo = 'CIMExpressionInfo'
    
class CIMFeatureReduction():
    """
      Represents a technique for visually reducing large numbers of features 
      in a map.
    """
    def __init__(self, *args, **Kwargs):
        self.enabled = True
    
class CIMFeatureSortInfo():
    """
      Contains information about the field name and sort order used to 
      draw features.
    """
    def __init__(self, *args, **Kwargs):
        self.fieldName = str()
        self.sortDirection = SortOrderType.Ascending
    
class CIMFieldDescription():
    """
      Represents a field description.
    """
    def __init__(self, *args, **Kwargs):
        self.alias = str()
        self.fieldName = str()
        self.highlight = False
        self.numberFormat = 'CIMNumberFormat'
        self.readOnly = False
        self.visible = True
        self.valueAsRatio = False
        self.searchable = False
        self.searchMode = DataSearchMode.Exact
    
class CIMFloorAwareTableProperties():
    """
      Represents floor-aware properties for the layer/table used in floor 
      filtering.
    """
    def __init__(self, *args, **Kwargs):
        self.floorFilterRank = FloorFilterRank.eNone
        self.floorField = str()
    
class CIMFolderConnection():
    """
      Represents a folder connection.
    """
    def __init__(self, *args, **Kwargs):
        self.folderConnectionString = str()
        self.alias = str()
    
class CIMGroupEditingTemplatePart():
    """
      Represents a group editing template part.
    """
    def __init__(self, *args, **Kwargs):
        self.layerURI = str()
        self.name = str()
        self.transformationID = str()
        self.options = {}
    
class CIMHtmlPopupFormat():
    """
      Represents an HTML pop-up format.
    """
    def __init__(self, *args, **Kwargs):
        self.htmlRedirectField = str()
        self.htmlRedirectFieldPrefix = str()
        self.htmlRedirectFieldSuffix = str()
        self.htmlXSLStyleSheet = str()
        self.htmlHideFieldNameColumn = False
        self.htmlUseCodedDomainValues = False
        self.htmlPresentationStyle = HtmlPopupStyle.TwoColumnTable
    
class CIMLayerAction():
    """
      Represents a layer action.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.activities = []
        self.conditions = []
    
class CIMLayerRange():
    """
      Represents a layer range.
    """
    def __init__(self, *args, **Kwargs):
        self.layerURI = str()
        self.rangeName = str()
        self.currentRange = 'CIMRange'
        self.currentRangeRelation = RangeRelation.Overlaps
        self.isExclusion = False
    
class CIMMaterializedViewProperties():
    """
      Properties relevant to query layers based on materialized views.
    """
    def __init__(self, *args, **Kwargs):
        self.materializedViewQuery = str()
        self.materializedViewExpiration = 0
    
class CIMMultipatchFeatureTemplateModel():
    """
      Represents a multipatch feature template model.
    """
    def __init__(self, *args, **Kwargs):
        self.isActive = False
        self.modelURI = str()
        self.modelSourceURI = str()
        self.thumbnailURI = str()
        self.camera = 'CIMViewCamera'
    
class CIMPageDefinition():
    """
      Represents page definition.
    """
    def __init__(self, *args, **Kwargs):
        self.pageFieldName = str()
        self.excludePages = False
    
class CIMParcelFabricActiveRecord():
    """
      Defines the parcel fabric active record properties needed for record-driven 
      parcel workflows.
    """
    def __init__(self, *args, **Kwargs):
        self.activeRecord = str()
        self.enabled = False
        self.showActiveRecordOnly = False
    
class CIMRange():
    """
      Represents a range.
    """
    def __init__(self, *args, **Kwargs):
        self.min = 0.0
        self.max = 0.0
    
class CIMRangeDefinition():
    """
      Represents a range definition.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.fieldName = str()
        self.endFieldName = str()
        self.uniqueValues = []
        self.currentRange = 'CIMRange'
        self.currentRangeRelation = RangeRelation.Overlaps
        self.customFullExtent = 'CIMRange'
        self.isExclusion = False
        self.aliasExpressionInfo = 'CIMExpressionInfo'
    
class CIMRelateInfoBase():
    """
      Represents relate base.
    """
    def __init__(self, *args, **Kwargs):
        self.dataConnection = 'CIMDataConnection'
        self.foreignKey = str()
        self.primaryKey = str()
        self.cardinality = esriRelCardinality.esriRelCardinalityManyToMany
        self.name = str()
        self.serviceRelateID = -1
        self.relatedMapMemberURI = str()
    
class CIMS52MarinerSettings():
    """
      Represents S-52 mariner settings object for controlling the drawing 
      of ENC layers.
    """
    def __init__(self, *args, **Kwargs):
        self.areaSymbolizationType = S52AreaSymbolizationType.Symbolized
        self.colorScheme = S52ColorScheme.Day
        self.showDataQuality = False
        self.deepContour = 30
        self.showDisplayBase = True
        self.showOtherDisplay = True
        self.showStandardDisplay = True
        self.depthDisplayUnits = S52DepthDisplayUnits.Meters
        self.showNOBJNM = True
        self.honorSCAMIN = True
        self.showIsolatedDangers = False
        self.labelContours = True
        self.labelSafetyContours = True
        self.showLowAccuracy = True
        self.pointSymbolizationType = S52PointSymbolizationType.PaperChart
        self.safetyContour = 30
        self.shallowContour = 2
        self.showShallowDepthPattern = False
        self.showTwoDepthShades = True
    
class CIMS52TextGroupVisibilitySettings():
    """
      Represents S-52 text group settings.
    """
    def __init__(self, *args, **Kwargs):
        self.showBerthNumber = True
        self.showCurrentVelocity = True
        self.showGeographicNames = True
        self.showHeightOfIsletOrLandFeature = True
        self.showImportantText = True
        self.showLightDescription = True
        self.showMagneticVariationAndSweptDepth = True
        self.showNamesForPositionReporting = True
        self.showNatureOfSeabed = True
        self.showNoteOnChartData = True
    
class CIMS52ViewingGroupSettings():
    """
      Represents S-52 viewing group properties object.
    """
    def __init__(self, *args, **Kwargs):
        self.showAllIsolatedDangers = True
        self.showArchipelagicSeaLanes = True
        self.showBoundariesAndLimits = True
        self.showBuoysBeaconsAidsToNavigation = True
        self.showBuoysBeaconsStructures = True
        self.showChartScaleBoundaries = True
        self.showDepthContours = True
        self.showDryingLine = True
        self.showLights = True
        self.showMagneticVariation = True
        self.showOtherMiscellaneous = True
        self.showProhibitedAndRestrictedAreas = True
        self.showSeabed = True
        self.showShipsRoutingSystemsAndFerryRoutes = True
        self.showSpotSoundings = True
        self.showStandardMiscellaneous = True
        self.showSubmarineCablesAndPipelines = True
        self.showTidal = True
    
class CIMSymbolIdentifier():
    """
      Represents a symbol identifier.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = 0
        self.name = str()
        self.symbol = 'CIMSymbol'
    
class CIMSymbolLayerMasking():
    """
      Represents symbol layer masking.
    """
    def __init__(self, *args, **Kwargs):
        self.symbolLayers = []
    
class CIMTimeDataDefinition():
    """
      Represents a time data definition.
    """
    def __init__(self, *args, **Kwargs):
        self.useTime = False
        self.timeReference = TimeReference
        self.customTimeExtent = TimeExtent
        self.hasLiveData = False
        self.timeExtentCanChange = False
    
class CIMTimeDimensionDefinition():
    """
      Represents a time dimension definition.
    """
    def __init__(self, *args, **Kwargs):
        self.timeDimensionName = str()
        self.timeDimensionFormat = str()
    
class CIMTimeDisplayDefinition():
    """
      Represents a time display definition.
    """
    def __init__(self, *args, **Kwargs):
        self.cumulative = False
        self.timeInterval = 1.0
        self.timeIntervalUnits = esriTimeUnits.esriTimeUnitsUnknown
        self.timeOffset = 0.0
        self.timeOffsetUnits = esriTimeUnits.esriTimeUnitsUnknown
        self.uniqueTimes = []
    
class CIMTimeTableDefinition():
    """
      Represents a time table definition.
    """
    def __init__(self, *args, **Kwargs):
        self.startTimeField = str()
        self.endTimeField = str()
        self.timeValueFormat = str()
        self.trackIDField = str()
    
from .CIMLayer import CIMSubLayerBase
class CIMAnnotationSubLayer(CIMSubLayerBase):
    """
      Represents an annotation sublayer used to draw annotation feature 
      classes subclasses.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
from .CIMLayer import CIMBaseLayer
class CIMBasicFeatureLayer(CIMBaseLayer):
    """
      Represents a basic feature layer, the base class for all layer 
      types that draw feature classes as features.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.autoGenerateFeatureTemplates = False
        self.extrusion = 'CIMFeatureExtrusion'
        self.featureElevationExpression = str()
        self.featureTable = 'CIMFeatureTable'
        self.featureTemplates = []
        self.htmlPopupEnabled = False
        self.htmlPopupFormat = 'CIMHtmlPopupFormat'
        self.isFlattened = False
        self.selectable = True
        self.selectionColor = 'CIMColor'
        self.polygonSelectionFillColor = 'CIMColor'
        self.selectionSymbol = 'CIMSymbolReference'
        self.useSelectionSymbol = False
        self.pageDefinition = 'CIMPageDefinition'
        self.featureCacheType = FeatureCacheType.eNone
        self.enableDisplayFilters = False
        self.displayFilters = []
        self.displayFiltersType = DisplayFilterType.ByScale
        self.displayFilterName = str()
        self.displayFilterChoices = []
        self.featureElevationExpressionInfo = 'CIMExpressionInfo'
        self.featureBlendingMode = BlendingMode.Alpha
        self.featureSortInfos = []
        self.layerEffectsMode = LayerEffectsMode.Layer
        self.featureEffects = 'CIMFeatureLayerEffect'
    
class CIMBuildingDisciplineLayer(CIMBaseLayer):
    """
      Represents a building discipline layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.disciplineType = DisciplineType.Architectural
        self.categoryLayers = []
    
class CIMBuildingLayer(CIMBaseLayer):
    """
      Represents a building composite layer.
    """
    """
      Represents a building composite layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.filters = []
        self.activeFilterID = str()
        self.buildingDisciplineLayers = []
        self.exteriorLayer = str()
        self.buildingID = str()
        self.dataConnection = 'CIMDataConnection'
        self.summaryStatisticsURI = str()
    
class CIMCatalogDynamicGroupLayer(CIMBaseLayer):
    """
      Composite layer to hold all the dynamic content of a Catalog layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMENCLayer(CIMBaseLayer):
    """
      Represents an Electronic Navigational Charts (ENC) layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataConnection = 'CIMENCDataConnection'
        self.displaySettings = 'CIMENCDisplaySettings'
        self.subLayers = []
        self.subTables = []
        self.selectionSetURI = str()
        self.selectable = True
    
class CIMENCSubLayer(CIMSubLayerBase):
    """
      Represents an ENC sublayer used to access features by type.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMParcelFabricLayer(CIMBaseLayer):
    """
      Represents a parcel fabric layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.accuracyTable = str()
        self.allLayers = []
        self.adjustmentsTable = str()
        self.cadastralFabricConnection = 'CIMDataConnection'
        self.controlPointLayer = str()
        self.controlPointSelectionSymbol = 'CIMSymbolReference'
        self.jobsTable = str()
        self.lineLayer = str()
        self.linePointLayer = str()
        self.parcelLayer = str()
        self.plansTable = str()
        self.pointLayer = str()
    
class CIMParcelLayer(CIMBaseLayer):
    """
      Represents a parcel fabric layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.recordsLayer = str()
        self.parcelConnection = 'CIMDataConnection'
        self.parcelFabricActiveRecord = 'CIMParcelFabricActiveRecord'
    
from .CIMCore import CIMDefinition
class CIMStandaloneTable(CIMDefinition):
    """
      Represents a standalone table.
    """
    """
      Represents a standalone table.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.definitionExpression = str()
        self.definitionExpressionName = str()
        self.definitionFilterChoices = []
        self.displayField = str()
        self.editable = True
        self.relates = []
        self.fieldDescriptions = []
        self.timeFields = 'CIMTimeTableDefinition'
        self.timeDefinition = 'CIMTimeDataDefinition'
        self.timeDisplayDefinition = 'CIMTimeDisplayDefinition'
        self.timeDimensionFields = 'CIMTimeDimensionDefinition'
        self.rangeDefinitions = []
        self.activeRangeName = str()
        self.selectRelatedData = False
        self.bindVariables = []
        self.subtypeValue = 0
        self.useSubtypeValue = False
        self.displayExpressionInfo = 'CIMExpressionInfo'
        self.selectionSetURI = str()
        self.floorAwareTableProperties = 'CIMFloorAwareTableProperties'
        self.routeIDFieldName = str()
        self.databaseRelates = []
        self.dataConnection = 'CIMDataConnection'
        self.description = str()
        self.autoGenerateRowTemplates = False
        self.rowTemplates = []
        self.serviceTableID = -1
        self.showPopups = True
        self.popupInfo = 'CIMPopupInfo'
        self.charts = []
        self.pageDefinition = 'CIMPageDefinition'
        self.customProperties = []
        self.webMapTableID = str()
        self.searchable = False
        self.useVisibilityTimeExtent = False
        self.visibilityTimeExtent = TimeExtent
    
class CIMTrajectoryLayer(CIMBaseLayer):
    """
      Represents a trajectory layer corresponding to a trajectory dataset.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.footprintLayer = str()
        self.pointLayer = str()
        self.trajectoryDatasetConnection = 'CIMDataConnection'
    
class CIMVectorTileLayer(CIMBaseLayer):
    """
      Represents a VectorTile layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataConnection = 'CIMVectorTileDataConnection'
        self.currentStyle = str()
        self.associatedFeatureLayerURI = str()
    
class CIMAggregateField(CIMFieldDescription):
    """
      A field holding the result of an aggregation of multiple field 
      values.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.aggregatedFieldName = str()
        self.statisticType = esriDataStatType.esriDataStatTypeCount
    
class CIMAggregationFeatureReduction(CIMFeatureReduction):
    """
      Represents a technique for visually reducing large numbers of features 
      in a map by aggregating them.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fields = []
        self.popupInfo = 'CIMPopupInfo'
    
class CIMAnnotationLayer(CIMBasicFeatureLayer):
    """
      Represents an annotation layer used to draw annotation feature 
      classes.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.barrierWeight = BarrierWeight.High
        self.drawGeometry = False
        self.drawUnplacedAnnotation = False
        self.drawGeometryLineSymbol = 'CIMSymbolReference'
        self.drawGeometryPointSymbol = 'CIMSymbolReference'
        self.unplacedAnnotationColor = 'CIMColor'
        self.symbolSubstitutionType = SymbolSubstitutionType.eNone
        self.massColorSubstitute = 'CIMColor'
        self.inlineColor = 'CIMColor'
        self.substitutionSymbolCollection = []
        self.subLayers = []
    
class CIMAttributeCondition(CIMCondition):
    """
      Represents an attribute condition.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.whereClause = str()
    
class CIMBasicRowTemplate(CIMEditingTemplate):
    """
      Represents a basic row template.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.defaultValues = {}
        self.requiredFields = []
        self.hiddenFields = []
        self.relationships = []
    
class CIMBinningFeatureReduction(CIMAggregationFeatureReduction):
    """
      Represents a technique for reducing features by aggregating them 
      into polygon bins.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.thresholdType = BinsToPointsThresholdType.MaxScale
        self.maximumScale = 500000
        self.featureCount = 1000
        self.minimumBinSize = 16
        self.visualization = 'CIMBinningVisualization'
        self.spatialReference = GetPythonClass('arcpy', 'SpatialReference')
        self.fixedLevel = -1
        self.binType = esriFeatureBinType.esriFeatureBinTypeGeohexFlat
        self.clientSideBinning = False
    
class CIMBinningVisualization(CIMAggregateVisualization):
    """
      Describes the appearance and application behavior of polygon aggregation 
      bins.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.standardDeviationMultiplier = StandardDeviationMultiplier.Two
    
class CIMCatalogLayer(CIMBasicFeatureLayer):
    """
      Represents a layer which dynamically loads its sublayers according 
      to scale and extent constraints.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.footprintLayer = str()
        self.catalogDynamicGroupLayer = str()
        self.maximumVisibleSublayers = 10
    
class CIMClusteringFeatureReduction(CIMAggregationFeatureReduction):
    """
      Represents a technique for reducing features by aggregating them 
      into point clusters.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.maximumScale = 500000
        self.clusterRadius = 72
        self.visualization = 'CIMAggregateVisualization'
    
class CIMDimensionLayer(CIMBasicFeatureLayer):
    """
      Represents an dimension layer used to draw dimension feature classes.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.barrierWeight = BarrierWeight.High
        self.snappable = True
    
class CIMDiscreteVariable(CIMBindVariable):
    """
      Represents a single bind variable.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.defaultValue = list()
        self.boundValue = list()
        self.allowMultiple = False
    
class CIMENCDataConnection(CIMDataConnection):
    """
      Represents an ENC layer data connection.
    """
    """
      Represents an ENC layer data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.customParameters = []
        self.uRI = str()
    
class CIMFeatureDatasetDataConnection(CIMDataConnection):
    """
      Represents a feature dataset data connection.
    """
    """
      Represents a feature dataset data connection.
    """
    """
      Represents a feature dataset data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.featureDataset = str()
        self.workspaceConnectionString = str()
        self.workspaceFactory = WorkspaceFactory.SDE
        self.customWorkspaceFactoryCLSID = str()
        self.dataset = str()
        self.datasetType = esriDatasetType.esriDTAny
        self.customParameters = []
    
class CIMFeatureTable(CIMDisplayTable):
    """
      Represents a feature table.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataConnection = 'CIMDataConnection'
        self.studyArea = GetPythonClass('arcpy', 'Extent')
        self.studyAreaSpatialRel = esriSpatialRelEnum.esriSpatialRelUndefined
        self.searchOrder = esriSearchOrder.esriSearchOrderSpatial
        self.isLicensedDataSource = False
        self.definitionSetURI = str()
    
class CIMGeoFeatureLayerBase(CIMBasicFeatureLayer):
    """
      Represents geographic feature layer base, a base class for geographic 
      feature layers.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.actions = []
        self.exclusionSet = []
        self.featureMasks = []
        self.labelClasses = []
        self.labelVisibility = False
        self.maskedSymbolLayers = []
        self.renderer = 'CIMRenderer'
        self.scaleSymbols = True
        self.snappable = True
        self.symbolLayerDrawing = 'CIMSymbolLayerDrawing'
        self.trackLinesRenderer = 'CIMRenderer'
        self.previousObservationsRenderer = 'CIMRenderer'
        self.previousObservationsCount = 0
        self.useRealWorldSymbolSizes = False
        self.showPreviousObservations = False
        self.featureReduction = 'CIMFeatureReduction'
        self.showTracks = False
    
class CIMGroupEditingTemplate(CIMEditingTemplate):
    """
      Represents a group editing template.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.baseName = str()
        self.basePart = 'CIMGroupEditingTemplatePart'
        self.parts = []
        self.createUtilityNetworkAssociations = True
    
class CIMHighlightActivity(CIMActivity):
    """
      Represents a highlight activity.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.highlightSymbol = 'CIMSymbolReference'
    
class CIMLocationCondition(CIMCondition):
    """
      Represents a location condition.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.conditionType = LocationConditionType.In
    
class CIMMultipatchFeatureTemplate(CIMBasicRowTemplate):
    """
      Represents a multipatch feature template.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.galleryMode = False
        self.models = []
    
class CIMNetCDFRasterDataConnection(CIMDataConnection):
    """
      Represents a NetCDF raster data connection.
    """
    """
      Represents a NetCDF raster data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.workspaceConnectionString = str()
        self.workspaceFactory = WorkspaceFactory.SDE
        self.customWorkspaceFactoryCLSID = str()
        self.dataset = str()
        self.datasetType = esriDatasetType.esriDTAny
        self.bandDimension = str()
        self.extent = GetPythonClass('arcpy', 'Extent')
        self.invertRows = False
        self.selectedDimensionIndexes = []
        self.selectedDimensions = []
        self.selectedDimensionValues = list()
        self.variable = str()
        self.verticalDimension = str()
        self.verticalDimensionUnit = str()
        self.xDimension = str()
        self.yDimension = str()
    
class CIMNetCDFStandardDataConnection(CIMDataConnection):
    """
      Represents a NetCDF standard data connection.
    """
    """
      Represents a NetCDF standard data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.workspaceConnectionString = str()
        self.workspaceFactory = WorkspaceFactory.SDE
        self.customWorkspaceFactoryCLSID = str()
        self.dataset = str()
        self.datasetType = esriDatasetType.esriDTAny
        self.variableList = []
        self.rowDimensionList = []
        self.xDimension = str()
        self.yDimension = str()
        self.zDimension = str()
        self.mDimension = str()
        self.selectedDimensions = []
        self.selectedDimensionIndexes = []
        self.selectedDimensionValues = list()
        self.shapeFieldName = str()
        self.verticalDimension = str()
        self.verticalDimensionUnit = str()
        self.selectedVolume = str()
    
class CIMOrientedImageryLayer(CIMGeoFeatureLayerBase):
    """
      Represents an oriented imagery layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.orientedImageryPropertyOverrides = {}
    
class CIMRangeVariable(CIMBindVariable):
    """
      Represents a range variable.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fieldExpression = str()
        self.optional = False
        self.defaultMin = object()
        self.defaultMax = object()
        self.tableName = str()
        self.valueIfMissing = True
    
class CIMRasterTable(CIMDisplayTable):
    """
      Represents a raster table.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.joins = 'CIMDataConnection'
    
class CIMRelQueryTableDataConnection(CIMDataConnection):
    """
      Represents a RelQuery table data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.sourceTable = 'CIMDataConnection'
        self.destinationTable = 'CIMDataConnection'
        self.primaryKey = str()
        self.foreignKey = str()
        self.name = str()
        self.cardinality = esriRelCardinality.esriRelCardinalityManyToMany
        self.joinType = esriJoinType.esriLeftOuterJoin
        self.joinForward = True
        self.oneToFirst = False
    
class CIMRelateInfo(CIMRelateInfoBase):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMRouteEventDataConnection(CIMDataConnection):
    """
      Represents a route event data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.routeFeatureClass = 'CIMDataConnection'
        self.routeIDFieldName = str()
        self.routeWhereClause = str()
        self.routeMeasureUnit = str()
        self.eventMeasureUnit = str()
        self.eventRouteIDFieldName = str()
        self.isLineEvent = False
        self.lateralOffsetFieldName = str()
        self.mDirectionOffsetting = False
        self.errorFieldName = str()
        self.addErrorField = False
        self.fromMeasureFieldName = str()
        self.toMeasureFieldName = str()
        self.addAngleField = False
        self.angleFieldName = str()
        self.asPointFeature = False
        self.complementAngle = False
        self.normalAngle = False
        self.eventTable = 'CIMDataConnection'
    
class CIMRowTemplate(CIMBasicRowTemplate):
    """
      Represents a row template.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMS52DisplaySettings(CIMENCDisplaySettings):
    """
      Represents S-52 display settings.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.marinerSettings = 'CIMS52MarinerSettings'
        self.textGroupVisibilitySettings = 'CIMS52TextGroupVisibilitySettings'
        self.viewingGroupSettings = 'CIMS52ViewingGroupSettings'
    
class CIMSqlQueryDataConnection(CIMDataConnection):
    """
      Represents a SQL query data connection.
    """
    """
      Represents a SQL query data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.workspaceConnectionString = str()
        self.workspaceFactory = WorkspaceFactory.SDE
        self.customWorkspaceFactoryCLSID = str()
        self.dataset = str()
        self.datasetType = esriDatasetType.esriDTAny
        self.sqlQuery = str()
        self.srid = str()
        self.spatialReference = GetPythonClass('arcpy', 'SpatialReference')
        self.oIDFields = str()
        self.geometryType = esriGeometryType.esriGeometryNull
        self.extent = GetPythonClass('arcpy', 'Extent')
        self.queryFields = list()
        self.spatialStorageType = 0
        self.sridType = 0
        self.spatialIndexDimension = 0
        self.isTableBased = False
        self.materializedViewProperties = 'CIMMaterializedViewProperties'
        self.mappedOIDFieldLength = MappedOIDFieldType.OID64Bit
    
class CIMStandardDataConnection(CIMDataConnection):
    """
      Represents a standard data connection, the most common data connection 
      type.
    """
    """
      Represents a standard data connection, the most common data connection 
      type.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.customParameters = []
        self.workspaceConnectionString = str()
        self.workspaceFactory = WorkspaceFactory.SDE
        self.customWorkspaceFactoryCLSID = str()
        self.dataset = str()
        self.datasetType = esriDatasetType.esriDTAny
    
class CIMStreamServiceDataConnection(CIMDataConnection):
    """
      Represents a stream service data connection.
    """
    """
      Represents a stream service data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.workspaceConnectionString = str()
        self.workspaceFactory = WorkspaceFactory.SDE
        self.customWorkspaceFactoryCLSID = str()
        self.dataset = str()
        self.datasetType = esriDatasetType.esriDTAny
        self.featureExpirationMethod = FeatureExpirationMethod.MaximumFeatureCount
        self.maximumFeatureCount = 10000
        self.maximumFeatureAge = 3600
    
class CIMSubtypeGroupLayer(CIMBasicFeatureLayer):
    """
      Represents a subtype group layer that works with feature classes 
      enabled with subtypes.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.subtypeLayers = []
    
class CIMSubtypeGroupLayerBase(CIMBasicFeatureLayer):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMSubtypeGroupTable(CIMStandaloneTable):
    """
      Represents a subtype group table that works with tables enabled 
      with subtypes.
    """
    """
      Represents a subtype group table that works with tables enabled 
      with subtypes.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.standaloneTables = []
    
class CIMSuppressActivity(CIMActivity):
    """
      Represents suppress activity.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMTableQueryNameDataConnection(CIMDataConnection):
    """
      Represents a table query name data connection.
    """
    """
      Represents a table query name data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.workspaceConnectionString = str()
        self.workspaceFactory = WorkspaceFactory.SDE
        self.customWorkspaceFactoryCLSID = str()
        self.dataset = str()
        self.datasetType = esriDatasetType.esriDTAny
        self.subFields = str()
        self.tables = str()
        self.whereClause = str()
        self.primaryKeyFields = str()
        self.copyLocally = False
        self.shapeType = esriGeometryType.esriGeometryNull
        self.featureType = esriFeatureType.esriFTSimple
        self.extent = GetPythonClass('arcpy', 'Extent')
        self.shapeFieldName = str()
    
class CIMTemporalDataConnection(CIMDataConnection):
    """
      Represents a temporal data connection.
    """
    """
      Represents a temporal data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.workspaceConnectionString = str()
        self.workspaceFactory = WorkspaceFactory.SDE
        self.customWorkspaceFactoryCLSID = str()
        self.dataset = str()
        self.datasetType = esriDatasetType.esriDTAny
        self.timeFieldLocaleID = 0
        self.timeFieldAmFormat = str()
        self.timeFieldPmFormat = str()
        self.cachingMode = TemporalFeatureClassCachingMode.All
        self.startTimeField = str()
        self.endTimeField = str()
        self.timeValueFormat = str()
        self.trackIDField = str()
    
class CIMTrackingServerDataConnection(CIMDataConnection):
    """
      Represents a tracking server data connection.
    """
    """
      Represents a tracking server data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.workspaceConnectionString = str()
        self.workspaceFactory = WorkspaceFactory.SDE
        self.customWorkspaceFactoryCLSID = str()
        self.dataset = str()
        self.datasetType = esriDatasetType.esriDTAny
        self.autoPurge = True
        self.purgeThreshold = 5000
        self.purgePercentage = 0.2
        self.keepPerTrack = 1
        self.purgeRule = TemporalFeatureClassPurgeRule.PurgeOldest
    
class CIMVectorTileDataConnection(CIMDataConnection):
    """
      Represents a VectorTile layer data connection.
    """
    """
      Represents a VectorTile layer data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.customParameters = []
        self.uRI = str()
        self.resourcesURI = str()
    
class CIMWorkspaceConnection(CIMDataConnection):
    """
      Represents a workspace connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.workspaceConnectionString = str()
        self.workspaceFactory = WorkspaceFactory.SDE
        self.customWorkspaceFactoryCLSID = str()
    
class CIMXYEventDataConnection(CIMDataConnection):
    """
      Represents an XY event data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.xFieldName = str()
        self.yFieldName = str()
        self.zFieldName = str()
        self.spatialReference = GetPythonClass('arcpy', 'SpatialReference')
        self.xYEventTableDataConnection = 'CIMDataConnection'
    
class CIMFeatureLayer(CIMGeoFeatureLayerBase):
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMFeatureTrajectorySubLayer(CIMFeatureLayer):
    """
      Represents the trajectory feature sublayer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.trajectorySubLayerType = TrajectorySubLayerType.Footprint
    
class CIMGeometryLocationCondition(CIMLocationCondition):
    """
      Represents geometry location condition.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.geometries = list()
    
