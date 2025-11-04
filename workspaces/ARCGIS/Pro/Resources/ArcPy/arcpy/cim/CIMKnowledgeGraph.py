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

class CIMFilteredFindPathsConfiguration():
    """
      Represents a Knowledge Graph Filtered Find Paths Configuration.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.originEntities = []
        self.destinationEntities = []
        self.pathFilters = []
        self.defaultTraversalDirectionType = KGTraversalDirectionType.Any
        self.traversalDirections = []
        self.entityUsage = FilteredFindPathsEntityUsage.AnyOriginAnyDestination
        self.pathMode = KGPathMode.Shortest
        self.minPathLength = 1
        self.maxPathLength = 0
        self.maxCountPaths = 100000
        self.timeFilter = 'CIMKGTimeFilter'
    
class CIMFilteredFindPathsEntity():
    """
      Represents a Knowledge Graph Filtered Find Paths Entity.
        /// An entity can be used for a specific instance, in this case 
      the ID has a value,
  /// or for all instances of a type, in this 
      case the ID is null.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = object()
        self.entityTypeName = str()
        self.propertyFilterPredicate = str()
    
class CIMFilteredFindPathsPathFilter():
    """
      Represents a Knowledge Graph Filtered Find Paths Path Filter.
        /// A path filter can be used for a specific instance, in this 
      case the ID has a value,
  /// or for all instances of a type, 
      in this case the ID is null.
    """
    def __init__(self, *args, **Kwargs):
        self.iD = object()
        self.itemTypeName = str()
        self.itemType = KGPathFilterItemType.Entity
        self.filterType = KGPathFilterType.Exclude
        self.propertyFilterPredicate = str()
    
class CIMKGConsecutiveEventsRestrictions():
    """
      Rules defining which "successor" events are allowed to be after 
      a given "predecessor" event.
  ///
  /// One implied rule is that 
      a successor event must start at or after the start of the predecessor 
      event.
  ///
  /// These rules use the notions of "Gap" and "Overlap" 
      defined hereunder.
  ///
  /// Definition of "Overlap":
  ///  
       When the successor event start is before the predecessor event 
      end,
  ///   the overlap is the time from the successor event start 
      to the predecessor event end.
  ///   When the successor event 
      start is after the predecessor event end,
  ///   the overlap is 
      zero.
  ///
  /// Definition of "Gap":
  ///   When the successor 
      event start is before the predecessor event end,
  ///   the gap 
      is zero.
  ///   When the successor event start is after the predecessor 
      event end,
  ///   the gap is the time from the predecessor event 
      end to the successor event start.
    """
    def __init__(self, *args, **Kwargs):
        self.restrictMaxOverlap = False
        self.maxOverlap = 0
        self.maxOverlapUnit = esriTimeUnits.esriTimeUnitsSeconds
        self.restrictMaxGap = False
        self.maxGap = 0
        self.maxGapUnit = esriTimeUnits.esriTimeUnitsSeconds
    
class CIMKGDurativeEventsDurationConstraint():
    """
      Constraints on the duration of durative events.
        ///
        /// Note that this constraint does not apply to punctual events.
    """
    def __init__(self, *args, **Kwargs):
        self.timeUnit = esriTimeUnits.esriTimeUnitsSeconds
        self.minDuration = 0.0
        self.useMaxDuration = False
        self.maxDuration = 0.0
    
class CIMKGEventDefinition():
    """
      Events can be durative (with both start and end properties) or 
      punctual (with just start or just end property).
    """
    def __init__(self, *args, **Kwargs):
        self.namedType = str()
        self.startProperty = str()
        self.endProperty = str()
    
class CIMKGEventErrorHandling():
    """
      Defines the behaviours when event time(s) are missing or wrong.
    """
    def __init__(self, *args, **Kwargs):
        self.kGEventMissingAllTimesBehaviour = KGEventMissingAllTimesBehaviour.Error
        self.kGDurativeEventMissingOneTimeBehaviour = KGDurativeEventMissingOneTimeBehaviour.Error
        self.kGDurativeEventSwappedTimesBehaviour = KGDurativeEventSwappedTimesBehaviour.Error
    
class CIMKGEventsDefinitions():
    """
      Defines which entities and relationships are "events".
    """
    def __init__(self, *args, **Kwargs):
        self.eventDefinitions = []
    
class CIMKGTimeFilter():
    """
      Represents a Knowledge Graph Time Filter.
    """
    def __init__(self, *args, **Kwargs):
        self.enabled = True
        self.kGPathTimeFlow = KGPathTimeFlow.Forward
        self.timeWindow = 'CIMKGTimeWindow'
        self.eventsDefinitions = 'CIMKGEventsDefinitions'
        self.durativeEventsDurationConstraint = 'CIMKGDurativeEventsDurationConstraint'
        self.eventErrorHandling = 'CIMKGEventErrorHandling'
        self.consecutiveEventsRestrictions = 'CIMKGConsecutiveEventsRestrictions'
    
class CIMKGTimeWindow():
    """
      Defines a window of time.
    """
    def __init__(self, *args, **Kwargs):
        self.minTime = TimestampOffset
        self.maxTime = TimestampOffset
    
class CIMKGTraversalDirection():
    """
      Represents a Knowledge Graph Filtered Find Paths TraversalDirection.
        /// The filtered find paths algorithm uses traversal directions 
      to specify how relationships are traversed.
  /// When no traversal 
      direction is defined for a specific relationship type, the default 
      traversal direction is used.
    """
    def __init__(self, *args, **Kwargs):
        self.relationshipTypeName = str()
        self.traversalDirectionType = KGTraversalDirectionType.Any
    
class CIMKnowledgeGraphDataLoadingConfiguration():
    """
      Represents a Knowledge Graph Data Loading Configuration.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.entities = []
        self.relationships = []
    
class CIMKnowledgeGraphDataLoadingEntity():
    """
      Represents a Knowledge Graph Data Loading Entity.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.entityType = str()
        self.typeIsFieldName = False
        self.entityTypeExpression = 'CIMExpressionInfo'
        self.properties = []
        self.merge = False
    
class CIMKnowledgeGraphDataLoadingRelationship():
    """
      Represents a Knowledge Graph Data Loading Relationship.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.sourceEntityName = str()
        self.relationshipType = str()
        self.typeIsFieldName = False
        self.relationshipTypeExpression = 'CIMExpressionInfo'
        self.targetEntityName = str()
        self.properties = []
        self.merge = False
    
class CIMKnowledgeGraphInvestigationTypeInfo():
    """
      Represents a Knowledge Graph Investigation Type Info.
    """
    def __init__(self, *args, **Kwargs):
        self.typeName = str()
        self.popupInfo = 'CIMPopupInfo'
        self.symbol = 'CIMSymbolReference'
        self.displayExpressionInfo = 'CIMExpressionInfo'
    
class CIMKnowledgeGraphLinkChartCentralityConfiguration():
    """
      Represents the Centrality computation options in a Knowledge Graph 
      Link Chart.
    """
    def __init__(self, *args, **Kwargs):
        self.relationshipsInterpretation = CentralityRelationshipInterpretation.Undirected
        self.multiedgeFactor = 1.0
        self.normalization = CentralityScoresNormalization.eNone
    
class CIMKnowledgeGraphLinkChartProperties():
    """
      Represents a Knowledge Graph Link Chart Properties object.
    """
    def __init__(self, *args, **Kwargs):
        self.nodesURI = str()
        self.linksURI = str()
        self.aggregatedNodesURI = str()
        self.aggregatedLinksURI = str()
        self.autoCollapseRelationships = True
        self.centralityConfiguration = 'CIMKnowledgeGraphLinkChartCentralityConfiguration'
        self.centralityIsUpToDate = True
        self.lastUsedLayout = 'CIMKnowledgeLinkChartLayout'
        self.nonspatialDataDisplay = 'CIMKnowledgeNonspatialDataDisplay'
    
class CIMKnowledgeGraphProperty():
    """
      Represents a Knowledge Graph Data Loading Property used for entities 
      and relationships.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.propertyType = esriFieldType.esriFieldTypeSmallInteger
        self.value = 'CIMKnowledgeGraphPropertyValue'
        self.merge = False
    
class CIMKnowledgeGraphPropertyValue():
    """
      Base (indicator) class for all CIMKnowledgeGraphXXXPropertyValue.
    """
    def __init__(self, *args, **Kwargs):
        pass
    
class CIMKnowledgeGraphQueryDefinition():
    """
      Represents a Knowledge Graph Query Definition.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.openCypherQuery = str()
        self.provenanceBehavior = ProvenanceBehavior.Exclude
    
class CIMKnowledgeGraphSearchDefinition():
    """
      Represents a Knowledge Graph Search Definition.
    """
    def __init__(self, *args, **Kwargs):
        self.name = str()
        self.searchString = str()
        self.filterSetting = 'CIMKnowledgeGraphSearchFilterSetting'
    
class CIMKnowledgeGraphSearchFilterSetting():
    """
      Represents a Knowledge Graph Search Filter Setting.
    """
    def __init__(self, *args, **Kwargs):
        self.scope = ''
        self.typeNames = []
    
class CIMKnowledgeLinkChartChronologicalLayoutSettings():
    """
      Contains settings to be used in chronological layout calculations.
    """
    def __init__(self, *args, **Kwargs):
        self.timeDirection = LinkChartLayoutDirection.Right
        self.timeBannerUTCOffsetInMinutes = 0
        self.eventsTicksVisualization = EventsTicksVisualization.StartAndEnd
        self.showDurationLineForNonZeroDurationEntityEvents = True
        self.durationLineWidth = 5
        self.entityPositionAtDurationRatio = 1.0
        self.showNonZeroDurationIntervalBounds = False
        self.separateTimeOverlaps = True
        self.separateTimelineOverlaps = True
        self.moveFirstBends = True
        self.secondBendRatio = 0.3
        self.lineSeparationMultiplier = 1.0
        self.spaceSeparatedLinesEvenly = False
        self.useBezierCurves = False
        self.separatedLineShapeRatio = 0.0
    
class CIMKnowledgeLinkChartLayout():
    """
      Represents a Knowledge Link Chart Layout Info object.
    """
    def __init__(self, *args, **Kwargs):
        self.algorithm = KnowledgeLinkChartLayoutAlgorithm.Organic_Standard
        self.organicLayoutSettings = 'CIMKnowledgeLinkChartOrganicLayoutSettings'
        self.chronologicalLayoutSettings = 'CIMKnowledgeLinkChartChronologicalLayoutSettings'
        self.autoApply = False
        self.preserveExtent = False
    
class CIMKnowledgeLinkChartOrganicLayoutSettings():
    """
      Contains settings to be used in organic layout calculations.
    """
    def __init__(self, *args, **Kwargs):
        self.computationTimeBudget = 2.0
        self.absoluteIdealEdgeLength = 1.0
        self.multiplicativeIdealEdgeLength = 1.0
        self.idealEdgeLengthType = LinkChartLayoutIdealEdgeLengthType.Multiplier
        self.autoComputeRepulsionRadius = True
        self.repulsionRadiusMultiplier = 1.0
    
class CIMKnowledgeNonspatialDataDisplay():
    """
      Represents a Knowledge Nonspatial Data Display object.
    """
    def __init__(self, *args, **Kwargs):
        self.mode = KnowledgeNonspatialDataDisplayMode.Visible
    
from .CIMVectorLayers import CIMDataConnection
class CIMKnowledgeGraphDataConnection(CIMDataConnection):
    """
      Represents a Knowledge Graph data connection.
    """
    """
      Represents a Knowledge Graph data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.workspaceConnectionString = str()
        self.workspaceFactory = WorkspaceFactory.SDE
        self.customWorkspaceFactoryCLSID = str()
        self.dataset = str()
        self.datasetType = esriDatasetType.esriDTAny
        self.definitionQuery = str()
    
from .CIMCore import CIMDefinition
class CIMKnowledgeGraphInvestigation(CIMDefinition):
    """
      Represents a Knowledge Graph Investigation.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataConnection = 'CIMDataConnection'
        self.dataLoadingConfigurations = []
        self.searchDefinitions = []
        self.queryDefinitions = []
        self.filteredFindPathsConfigurations = []
        self.typeInfos = []
        self.customProperties = []
    
from .CIMLayer import CIMBaseLayer
class CIMKnowledgeGraphLayer(CIMBaseLayer):
    """
      Provides access to properties of a Knowledge Graph layer.
    """
    """
      Provides access to properties of a Knowledge Graph layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.standaloneTables = []
        self.dataConnection = 'CIMDataConnection'
        self.layers = []
    
class CIMKnowledgeGraphTableDataConnection(CIMDataConnection):
    """
      Represents a Knowledge Graph data connection.
    """
    """
      Represents a Knowledge Graph data connection.
    """
    """
      Represents a Knowledge Graph data connection.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.workspaceConnectionString = str()
        self.workspaceFactory = WorkspaceFactory.SDE
        self.customWorkspaceFactoryCLSID = str()
        self.dataset = str()
        self.datasetType = esriDatasetType.esriDTAny
        self.definitionQuery = str()
        self.inclusionSetURI = str()
    
from .CIMVectorLayers import CIMGeoFeatureLayerBase
class CIMLinkChartFeatureLayer(CIMGeoFeatureLayerBase):
    """
      Represents a Link Chart Feature Layer.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.aggregationLayerURI = str()
    
class CIMKnowledgeGraphCoordinatePropertyValue(CIMKnowledgeGraphPropertyValue):
    """
      Represents a coordinate property value.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fieldNames = []
        self.spatialReference = GetPythonClass('arcpy', 'SpatialReference')
        self.interpretAsLongitudeLatitude = False
    
class CIMKnowledgeGraphExpressionPropertyValue(CIMKnowledgeGraphPropertyValue):
    """
      Represents a property value from an expression.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.expression = 'CIMExpressionInfo'
    
class CIMKnowledgeGraphFieldPropertyValue(CIMKnowledgeGraphPropertyValue):
    """
      Represents a property value from a specific import field.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fieldName = str()
    
class CIMKnowledgeGraphFixedPropertyValue(CIMKnowledgeGraphPropertyValue):
    """
      Represents a fixed string property value.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.fixedValue = str()
    
class CIMKnowledgeGraphIDPropertyValue(CIMKnowledgeGraphPropertyValue):
    """
      Represents the ID property value from a specific CIMKnowledgeGraphDataLoadingEntity 
      or CIMKnowledgeGraphDataLoadingRelationship.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.dataLoadingItemName = str()
    
class CIMKnowledgeGraphNonspatialProperty(CIMKnowledgeGraphProperty):
    """
      Represents a Knowledge Graph Data Loading Property used by entities 
      and relationships.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
    
class CIMKnowledgeGraphSpatialProperty(CIMKnowledgeGraphProperty):
    """
      Represents a Spatial Knowledge Graph Data Loading Property used 
      for entities. This
  /// class is expected to be used only when 
      the Type of property is esriFieldTypeGeometry.
    """
    def __init__(self, *args, **Kwargs):
        super().__init__()
        self.spatialReference = GetPythonClass('arcpy', 'SpatialReference')
        self.geometryType = esriGeometryType.esriGeometryPoint
    
