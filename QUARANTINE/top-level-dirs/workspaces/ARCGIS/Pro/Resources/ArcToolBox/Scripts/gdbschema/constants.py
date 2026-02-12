import enum

from .common import change_first_character


class AliasMeta(enum.EnumMeta):
    """Metaclass for creating enum aliases"""

    def __new__(metacls, cls, bases, classdict, **kwds):
        for key, val in list(classdict.items()):
            if key.startswith("_") or not isinstance(val, str):
                continue
            # A few enums are serialized by their camelCase representation. These are added as aliases.
            parts = val.split(" ")
            parts[0] = parts[0].lower()
            if (alias := "".join(parts)) not in classdict:
                classdict[alias] = val

        return super().__new__(metacls, cls, bases, classdict, **kwds)

    def __init_subclass__(cls, **kwargs):
        pass


class Enum(enum.Enum, metaclass=AliasMeta):
    """Base Enum class"""

    removePrefix: bool

    def __init_subclass__(cls, **kwargs):
        cls.removePrefix = kwargs.get("removePrefix", False)

    @classmethod
    def prefix(cls) -> str:
        """The common prefix shared by all members"""
        from os.path import commonprefix

        return commonprefix([e.name for e in cls])

    @classmethod
    def get(cls, name: str) -> str:
        """Converts name without prefix to value"""
        return cls[cls.prefix() + name].value

    def json_value(self) -> str:
        """enum value serialized to JSON"""
        if self.removePrefix:
            # Remove prefix and lower case first letter.
            name = self.name.removeprefix(self.prefix())
            return change_first_character(name, lower=True)
        return self.name

    @classmethod
    def from_code(cls, code: int) -> "Enum":
        return list(cls)[code]

    @classmethod
    def enum_code_lookup(cls) -> dict["Enum", int]:
        # Subclasses should derive codes fom this method, which can be overriden in base classes.
        # This way, only a single method needs to be overridden, not every one.
        return {e: i for i, e in enumerate(cls)}

    @classmethod
    def name_code_lookup(cls) -> dict[str, int]:
        return {e.name: i for e, i in cls.enum_code_lookup().items()}

    @classmethod
    def value_code_lookup(cls) -> dict[str, int]:
        lookup = {}
        for e, i in cls.enum_code_lookup().items():
            parts = e.value.split(" ")
            parts[0] = parts[0].lower()
            lookup["".join(parts)] = i

        return lookup

    @classmethod
    def create_new(cls, *members: "Enum") -> type["Enum"]:
        """Creates a new enum that is a subset of the current enum"""
        return Enum(cls.__name__, [(e.name, e.value) for e in members])


class BooleanType(Enum):
    """True/False values"""

    false = False
    true = True

    def json_value(self) -> bool:
        return self is self.true


# All classes defined in the esriEnums region are programmatically generated

# region esriEnums


class esriAssociationDeleteType(Enum):
    """Utility network association deletion behavior type for network features."""

    esriADTCascade = "Cascade"
    esriADTSetToNone = "Set To None"
    esriADTRestricted = "Restricted"


class esriAssociationRoleType(Enum):
    """Utility network association role types for network features."""

    esriARTNone = "None"
    esriARTContainer = "Container"
    esriARTStructure = "Structure"


class esriAttributeRuleTriggeringEvent(Enum):
    """Attribute rule triggering event"""

    esriARTEInsert = "Insert"
    esriARTEUpdate = "Update"
    esriARTEDelete = "Delete"


class esriAttributeRuleType(Enum):
    """Attribute rule type"""

    esriARTCalculation = "Calculation"
    esriARTConstraint = "Constraint"
    esriARTValidation = "Validation"


class esriConditionType(Enum):
    """Condition type."""

    esriCTNetworkAttribute = "Network Attribute"
    esriCTCategory = "Category"


class esriDatasetType(Enum):
    """Dataset Types."""

    esriDTFeatureDataset = "Feature Dataset"
    esriDTFeatureClass = "Feature Class"
    esriDTTable = "Table"
    esriDTRelationshipClass = "Relationship Class"
    esriDTUtilityNetwork = "Utility Network"
    esriDTParcelDataset = "Parcel Dataset"
    esriDTTraceNetwork = "Trace Network"
    esriDTTopology = "Topology"
    esriDTLocationReferencingDataset = "Location Referencing Dataset"


class esriDomainType(Enum):
    """Domain types."""

    esriDTRange = "Range"
    esriDTCodedValue = "Coded Value"


class esriFeatureType(Enum):
    """Feature Types."""

    esriFTSimple = "Simple"
    esriFTSimpleJunction = "Simple Junction"
    esriFTSimpleEdge = "Simple Edge"
    esriFTComplexJunction = "Complex Junction"
    esriFTComplexEdge = "Complex Edge"
    esriFTAnnotation = "Annotation"
    esriFTCoverageAnnotation = "Coverage Annotation"
    esriFTDimension = "Dimension"
    esriFTRasterCatalogItem = "Raster Catalog Item"
    esriFTCatalogDatasetItem = "Catalog Dataset Item"
    esriFTOrientedImageryDatasetItem = "Oriented Imagery Dataset Item"


class esriFieldType(Enum):
    """Field Types."""

    esriFieldTypeSmallInteger = "Short Integer"
    esriFieldTypeInteger = "Long Integer"
    esriFieldTypeSingle = "Float"
    esriFieldTypeDouble = "Double"
    esriFieldTypeString = "String"
    esriFieldTypeDate = "Date"
    esriFieldTypeOID = "OID"
    esriFieldTypeGeometry = "Geometry"
    esriFieldTypeBlob = "Blob"
    esriFieldTypeRaster = "Raster"
    esriFieldTypeGUID = "GUID"
    esriFieldTypeGlobalID = "Global ID"
    esriFieldTypeXML = "XML"
    esriFieldTypeBigInteger = "Big Integer"
    esriFieldTypeDateOnly = "Date Only"
    esriFieldTypeTimeOnly = "Time Only"
    esriFieldTypeTimestampOffset = "Timestamp Offset"


class esriGeometryType(Enum):
    """The available kinds of geometry objects."""

    esriGeometryPoint = "Point"
    esriGeometryMultipoint = "Multipoint"
    esriGeometryLine = "Line"
    esriGeometryPolyline = "Polyline"
    esriGeometryPolygon = "Polygon"
    esriGeometryMultiPatch = "Multi Patch"


class esriMergePolicyType(Enum):
    """Merge policy types."""

    esriMPTSumValues = "Sum Values"
    esriMPTAreaWeighted = "Area Weighted"
    esriMPTDefaultValue = "Default Value"


class esriNetworkAttributeDataType(Enum):
    """Data type of a network dataset attribute."""

    esriNADTInteger = "Integer"
    esriNADTFloat = "Float"
    esriNADTDouble = "Double"
    esriNADTBoolean = "Boolean"


class esriNetworkClassAncillaryRole(Enum):
    """Network ancillary role types."""

    esriNCARNone = "None"
    esriNCARSourceSink = "Source Sink"


class esriNetworkEdgeConnectivityPolicy(Enum):
    """Policy on how network edge elements connect to each other."""

    esriNECPAnyVertex = "Any Vertex"
    esriNECPEndVertex = "End Vertex"


class esriNetworkType(Enum):
    """Logical network type options."""

    esriNTStreetNetwork = "Street Network"
    esriNTUtilityNetwork = "Utility Network"


class esriParcelClassType(Enum):
    """The parcel Fabric dataset class."""

    esriPCTNone = "None"
    esriPCTRecords = "Records"
    esriPCTPoints = "Points"
    esriPCTConnectionLines = "Connection Lines"
    esriPCTParcels = "Parcels"
    esriPCTParcelLines = "Parcel Lines"
    esriPCTAdjustmentPoints = "Adjustment Points"
    esriPCTAdjustmentLines = "Adjustment Lines"
    esriPCTAdjustmentVectors = "Adjustment Vectors"


class esriRelCardinality(Enum):
    """Relationship Cardinality."""

    esriRelCardinalityOneToOne = "One To One"
    esriRelCardinalityOneToMany = "One To Many"
    esriRelCardinalityManyToMany = "Many To Many"


class esriRelNotification(Enum):
    """Relationship Notification Direction."""

    esriRelNotificationNone = "None"
    esriRelNotificationForward = "Forward"
    esriRelNotificationBackward = "Backward"
    esriRelNotificationBoth = "Both"


class esriRelationshipSplitPolicy(Enum):
    """Relationship split policy options."""

    esriRSPUseDefault = "Use Default"
    esriRSPDuplicateRelatedObjects = "Duplicate Related Objects"


class esriSplitModel(Enum):
    """Split model options"""

    esriSMUpdateInsert = "Update Insert"
    esriSMDeleteInsertInsert = "Delete Insert Insert"


class esriSplitPolicyType(Enum):
    """Split policy types."""

    esriSPTGeometryRatio = "Geometry Ratio"
    esriSPTDuplicate = "Duplicate"
    esriSPTDefaultValue = "Default Value"


class esriTierDefinition(Enum):
    """Tier definition."""

    esriTDNone = "None"
    esriTDHierarchical = "Hierarchical"
    esriTDPartitioned = "Partitioned"


class esriTierTopologyType(Enum):
    """Tier topology type."""

    esriTTTRadial = "Radial"
    esriTTTMesh = "Mesh"


class esriTraceFunctionType(Enum, removePrefix=True):
    """Trace function type."""

    esriTFTAdd = "Add"
    esriTFTSubtract = "Subtract"
    esriTFTAverage = "Average"
    esriTFTCount = "Count"
    esriTFTMin = "Min"
    esriTFTMax = "Max"


class esriTraceOperator(Enum, removePrefix=True):
    """Trace operator."""

    esriTOEqual = "Equal"
    esriTONotEqual = "Not Equal"
    esriTOGreaterThan = "Greater Than"
    esriTOGreaterThanEqual = "Greater Than Equal"
    esriTOLessThan = "Less Than"
    esriTOLessThanEqual = "Less Than Equal"
    esriTOIncludesTheValues = "Includes The Values"
    esriTODoesNotIncludeTheValues = "Does Not Include The Values"
    esriTOIncludesAny = "Includes Any"
    esriTODoesNotIncludeAny = "Does Not Include Any"


class esriTracePropagatorFunctionType(Enum, removePrefix=True):
    """Trace propagator function type."""

    esriTPFTBitwiseAnd = "Bitwise And"
    esriTPFTMin = "Min"
    esriTPFTMax = "Max"


class esriTraversabilityScope(Enum):
    """Traversability scope."""

    esriTSJunctionsAndEdges = "Junctions And Edges"
    esriTSJunctions = "Junctions"
    esriTSEdges = "Edges"


class esriUpdateSubnetworkEditMode(Enum):
    """Update subnetwork edit mode."""

    esriUSEMWithoutEventing = "Without Eventing"
    esriUSEMWithEventing = "With Eventing"

    @classmethod
    def prefix(cls) -> str:
        return "esriUSEM"


class esriUtilityNetworkAttributeUsageType(Enum):
    """Utility network attribute usage type."""

    esriUNAUTUnknown = "Unknown"
    esriUNAUTSourceID = "Source ID"
    esriUNAUTTerminalID = "Terminal ID"
    esriUNAUTAssetGroup = "Asset Group"
    esriUNAUTAssetType = "Asset Type"
    esriUNAUTIsSubnetworkController = "Is Subnetwork Controller"
    esriUNAUTTierTank = "Tier Tank"
    esriUNAUTTierRank = "Tier Rank"
    esriUNAUTTierName = "Tier Name"
    esriUNAUTShapeLength = "Shape Length"
    esriUNAUTPositionFrom = "Position From"
    esriUNAUTPositionTo = "Position To"
    esriUNAUTFlowDirection = "Flow Direction"


class esriUtilityNetworkFeatureClassUsageType(Enum):
    """Utility network feature class usage type."""

    esriUNFCUTDevice = "Device"
    esriUNFCUTJunction = "Junction"
    esriUNFCUTLine = "Line"
    esriUNFCUTAssembly = "Assembly"
    esriUNFCUTSubnetLine = "Subnet Line"
    esriUNFCUTStructureJunction = "Structure Junction"
    esriUNFCUTStructureLine = "Structure Line"
    esriUNFCUTStructureBoundary = "Structure Boundary"
    esriUNFCUTJunctionObject = "Junction Object"
    esriUNFCUTEdgeObject = "Edge Object"
    esriUNFCUTStructureJunctionObject = "Structure Junction Object"
    esriUNFCUTStructureEdgeObject = "Structure Edge Object"

    @staticmethod
    def _get_names(*enums: Enum):
        return {e.name for e in enums}

    @classmethod
    def edge_sources(cls) -> set[str]:
        return cls._get_names(
            cls.esriUNFCUTLine,
            cls.esriUNFCUTSubnetLine,
            cls.esriUNFCUTStructureLine,
            cls.esriUNFCUTEdgeObject,
            cls.esriUNFCUTStructureEdgeObject,
        )

    @classmethod
    def uses_geometry(cls) -> set[str]:
        return cls._get_names(
            cls.esriUNFCUTDevice,
            cls.esriUNFCUTJunction,
            cls.esriUNFCUTLine,
            cls.esriUNFCUTAssembly,
            cls.esriUNFCUTSubnetLine,
            cls.esriUNFCUTStructureJunction,
            cls.esriUNFCUTStructureLine,
        )


class esriUtilityNetworkTraversabilityModel(Enum):
    """Utility network traversability model."""

    esriUNTMDirectional = "Directional"
    esriUNTMBidirectional = "Bidirectional"


class esriWeightType(Enum):
    """Logical network weight types."""

    esriWTNull = "Null"
    esriWTBitGate = "Bit Gate"
    esriWTInteger = "Integer"
    esriWTSingle = "Single"
    esriWTDouble = "Double"
    esriWTBoolean = "Boolean"


class esriWorkspaceType(Enum):
    """Workspace types."""

    esriFileSystemWorkspace = "File System"
    esriLocalDatabaseWorkspace = "Local Database"
    esriRemoteDatabaseWorkspace = "Remote Database"


# This enum is generated programmatically, and then modified slightly by hand.
class esriWorkspaceFactory(Enum):
    """DataSources Workspace Factory"""

    AccessWorkspaceFactory = "Access"
    ArcInfoWorkspaceFactory = "Arc Info"
    ArrowTableWorkspaceFactory = "Arrow Table"
    BDConnectionWorkspaceFactory = "BD Connection"
    BimFileWorkspaceFactory = "Bim File"
    CadWorkspaceFactory = "Cad"
    ExcelWorkspaceFactory = "Excel"
    FeatureServiceDBWorkspaceFactory = "Feature Service DB"
    FeatureServiceWorkspaceFactory = "Feature Service"
    FileGDBScratchWorkspaceFactory = "File GDB Scratch"
    FileGDBWorkspaceFactory = "File GDB"
    GeoRSSWorkspaceFactory = "Geo RSS"
    IMSWorkspaceFactory = "IMS"
    InMemoryWorkspaceFactory = "In Memory"
    KMLWorkspaceFactory = "KML"
    KnowledgeGraphWorkspaceFactory = "Knowledge Graph"
    LasDatasetWorkspaceFactory = "Las Dataset"
    MemoryWorkspaceFactory = "Memory"
    NITFWorkspaceFactory = "NITF"
    NetCDFWorkspaceFactory = "Net CDF"
    NoSQLDBWorkspaceFactory = "NoSQL DB"
    OLEDBWorkspaceFactory = "OLE DB"
    PCCoverageWorkspaceFactory = "PC Coverage"
    PlugInWorkspaceFactory = "Plug In"
    RasterWorkspaceFactory = "Raster"
    RealtimePluginWorkspaceFactory = "Realtime Plugin"
    SDCWorkspaceFactory = "SDC"
    ScratchWorkspaceFactory = "Scratch"
    SdeWorkspaceFactory = "Sde"
    ShapefileWorkspaceFactory = "Shapefile"
    SqlWorkspaceFactory = "Sql"
    SqliteWorkspaceFactory = "Sqlite"
    StreamServiceDBWorkspaceFactory = "Stream Service DB"
    StreetMapWorkspaceFactory = "Street Map"
    TextFileWorkspaceFactory = "Text File"
    TinWorkspaceFactory = "Tin"
    ToolboxWorkspaceFactory = "Toolbox"
    VpfWorkspaceFactory = "Vpf"
    WFSServiceDBWorkspaceFactory = "WFS Service DB"


# endregion


class esriLRSFieldPadding(Enum, removePrefix=True):
    """LRS Padding Place"""

    esriLRSFieldPaddingNone = "None"
    esriLRSFieldPaddingLeft = "Left"
    esriLRSFieldPaddingLeftAndRight = "Left and Right"
    esriLRSFieldPaddingRight = "Right"

    def json_value(self) -> str:
        if self.removePrefix:
            return self.name.removeprefix(self.prefix())


class esriGapCalibrationType(Enum):
    """LRS Gap Calibration Type"""

    SteppingIncrement = "Stepping Increment"
    AddingIncrement = "Adding Increment"
    AddingEuclideanDistance = "Adding Euclidean Distance"


class esriLRSLayerType(Enum):
    """LRS Layer Type"""

    esriNonLRSLayer = "Non-LRS"
    esriLRSNetworkLayer = "Network"
    esriLRSPointEventLayer = "Point Event"
    esriLRSLinearEventLayer = "Linear Event"
    esriLRSRedlineLayer = "Redline"
    esriLRSCenterlineLayer = "Centerline"
    esriLRSCalibrationPointLayer = "Calibration Point"
    esriLRSIntersectionLayer = "Intersection"
    esriLRSUtilityNetworkLayer = "Utility Network"

    @classmethod
    def point_line(cls):
        return cls.create_new(cls.esriLRSPointEventLayer, cls.esriLRSLinearEventLayer)


class esriLRSActivityType(Enum):
    """LRS Activity Type"""

    unknown = "Unknown"  # 0
    createRoute = "Create"  # 1
    calibrateRoute = "Calibrate"  # 2
    reverseRoute = "Reverse"  # 3
    retireRoute = "Retire"  # 4
    extendRoute = "Extend"  # 5
    reassignRoute = "Reassign"  # 6
    realignRoute = "Realign"  # 7
    realignOverlap = "Realign Overlap"  # 9
    cartoRealignRoute = "Carto Realign"  # 12
    loadRoute = "Load"  # 13

    @classmethod
    def from_code(cls, code: int):
        # Shift code to account for number gaps.
        if code == 9:
            code = -3
        elif code == 12:
            code = -2
        elif code == 13:
            code = -1
        return super().from_code(code)

    @classmethod
    def enum_code_lookup(cls):
        lookup = super().enum_code_lookup()
        lookup[cls.realignOverlap] = 9
        lookup[cls.cartoRealignRoute] = 12
        lookup[cls.loadRoute] = 13

        return lookup


class esriLRSEventBehaviorType(Enum):
    """LRS Event Behavior Type"""

    unknown = "Unknown"  # 0
    eventMeasureChanges = "Stay Put"  # 1
    eventMeasureConstant = "Move"  # 2
    eventRetires = "Retire"  # 3
    eventIsReassigned = "Snap"  # 4
    honorReferentLocation = "Honor Referent Location"  # 5
    honorRouteMeasure = "Honor Route Measure"  # 6
    eventCovers = "Cover"  # 7

    @classmethod
    def calibrate(cls):
        return cls.create_new(cls.eventMeasureChanges, cls.eventRetires, cls.eventMeasureConstant)

    @classmethod
    def retire(cls):
        return cls.calibrate()

    @classmethod
    def extend(cls):
        return cls.create_new(*cls.calibrate(), cls.eventCovers)

    @classmethod
    def reassign(cls):
        return cls.create_new(*cls.calibrate(), cls.eventIsReassigned)

    @classmethod
    def realign(cls):
        return cls.create_new(*cls.reassign(), cls.eventCovers)

    @classmethod
    def reverse(cls):
        return cls.calibrate()

    @classmethod
    def carto(cls):
        return cls.create_new(cls.honorReferentLocation, cls.honorRouteMeasure)


class esriLRSOperator(Enum):
    """LRS Relational Operator"""

    Greater = "Greater"
    Lesser = "Lesser"


class esriLRSPriorityOrder(Enum):
    """LRS Route Priority Order Type"""

    Alphanumeric = "Alphanumeric"
    Numeric = "Numeric"


class esriUnits(Enum):
    esriUnknown = "Unknown"  # 0
    esriInches = "US Survey Inches"  # 1
    esriPoints = "Points"  # 2
    esriFeet = "US Survey Feet"  # 3
    esriYards = "US Survey Yards"  # 4
    esriMiles = "US Survey Miles"  # 5
    esriNauticalMiles = "US Survey Nautical Miles"  # 6
    esriMillimeters = "Millimeters"  # 7
    esriCentimeters = "Centimeters"  # 8
    esriMeters = "Meters"  # 9
    esriKilometers = "Kilometers"  # 10
    esriDecimalDegrees = "Decimal Degrees"  # 11
    esriDecimeters = "Decimeters"  # 12
    esriIntInches = "International Inches"  # 13
    esriIntFeet = "International Feet"  # 14
    esriIntYards = "International Yards"  # 15
    esriIntMiles = "Statute Miles"  # 16
    esriIntNauticalMiles = "International Nautical Miles"  # 17

    @classmethod
    def lrs(cls):
        """The units exposed in CreateLRSNetwork"""
        return cls.create_new(
            cls.esriInches,
            cls.esriFeet,
            cls.esriYards,
            cls.esriMiles,
            cls.esriNauticalMiles,
            cls.esriIntFeet,
            cls.esriMillimeters,
            cls.esriCentimeters,
            cls.esriMeters,
            cls.esriKilometers,
            cls.esriDecimeters,
        )


class esriTopologyRuleType(Enum):
    """Types of topology rules."""

    esriTRTAreaNoGaps = "Must Not Have Gaps (Area)"
    esriTRTAreaNoOverlap = "Must Not Overlap (Area)"
    esriTRTAreaCoveredByAreaClass = "Must Be Covered By Feature Class Of (Area-Area)"
    esriTRTAreaAreaCoverEachOther = "Must Cover Each Other (Area-Area)"
    esriTRTAreaCoveredByArea = "Must Be Covered By (Area-Area)"
    esriTRTAreaNoOverlapArea = "Must Not Overlap With (Area-Area)"
    esriTRTLineCoveredByAreaBoundary = "Must Be Covered By Boundary Of (Line-Area)"
    esriTRTPointCoveredByAreaBoundary = "Must Be Covered By Boundary Of (Point-Area)"
    esriTRTPointProperlyInsideArea = "Must Be Properly Inside (Point-Area)"
    esriTRTLineNoOverlap = "Must Not Overlap (Line)"
    esriTRTLineNoIntersection = "Must Not Intersect (Line)"
    esriTRTLineNoDangles = "Must Not Have Dangles (Line)"
    esriTRTLineNoPseudos = "Must Not Have Pseudo-Nodes (Line)"
    esriTRTLineCoveredByLineClass = "Must Be Covered By Feature Class Of (Line-Line)"
    esriTRTLineNoOverlapLine = "Must Not Overlap With (Line-Line)"
    esriTRTPointCoveredByLine = "Must Be Covered By (Point-Line)"
    esriTRTPointCoveredByLineEndpoint = "Must Be Covered By Endpoint Of (Point-Line)"
    esriTRTAreaBoundaryCoveredByLine = "Boundary Must Be Covered By (Area-Line)"
    esriTRTAreaBoundaryCoveredByAreaBoundary = "Boundary Must Be Covered By Boundary Of (Area-Area)"
    esriTRTLineNoSelfOverlap = "Must Not Self-Overlap (Line)"
    esriTRTLineNoSelfIntersect = "Must Not Self-Intersect (Line)"
    esriTRTLineNoIntersectOrInteriorTouch = "Must Not Intersect Or Touch Interior (Line)"
    esriTRTLineEndpointCoveredByPoint = "Endpoint Must Be Covered By (Line-Point)"
    esriTRTAreaContainPoint = "Contains Point (Area-Point)"
    esriTRTLineNoMultipart = "Must Be Single Part (Line)"
    esriTRTPointCoincidePoint = "Must Coincide With (Point-Point)"
    esriTRTPointDisjoint = "Must Be Disjoint (Point)"
    esriTRTLineNoIntersectLine = "Must Not Intersect With (Line-Line)"
    esriTRTLineNoIntersectOrInteriorTouchLine = "Must Not Intersect or Touch Interior With (Line-Line)"
    esriTRTLineInsideArea = "Must Be Inside (Line-Area)"
    esriTRTAreaContainOnePoint = "Contains One Point (Area-Point)"

    # These are not currently exposed.
    # esriTRTAny = "Any"
    # esriTRTFeatureLargerThanClusterTolerance = "Feature Larger Than Cluster Tolerance"
    # esriTRTAreaConnectedFeatures = "Area Connected Features"
    # esriTRTAreaFeaturesTessellateArea = "Area Features Tessellate Area"
    # esriTRTLineFeatureConnected = "Line Feature Connected"
    # esriInternalTRTParcel = "Parcel"


# These enums are subsets of the above and are used to drive dropdowns/validation.

# region subsetEnums


class esriFieldTypeDomain(Enum):
    """Field types for domains"""

    esriFieldTypeSmallInteger = esriFieldType.esriFieldTypeSmallInteger.value
    esriFieldTypeInteger = esriFieldType.esriFieldTypeInteger.value
    esriFieldTypeSingle = esriFieldType.esriFieldTypeSingle.value
    esriFieldTypeDouble = esriFieldType.esriFieldTypeDouble.value
    esriFieldTypeString = esriFieldType.esriFieldTypeString.value
    esriFieldTypeDate = esriFieldType.esriFieldTypeDate.value
    esriFieldTypeBigInteger = esriFieldType.esriFieldTypeBigInteger.value
    esriFieldTypeDateOnly = esriFieldType.esriFieldTypeDateOnly.value
    esriFieldTypeTimeOnly = esriFieldType.esriFieldTypeTimeOnly.value


class esriFieldTypeNetworkAttribute(Enum):
    """Field types for network attributes"""

    esriFieldTypeSmallInteger = esriFieldType.esriFieldTypeSmallInteger.value
    esriFieldTypeInteger = esriFieldType.esriFieldTypeInteger.value
    esriFieldTypeDouble = esriFieldType.esriFieldTypeDouble.value
    esriFieldTypeDate = esriFieldType.esriFieldTypeDate.value
    esriFieldTypeBigInteger = esriFieldType.esriFieldTypeBigInteger.value


# endregion

__all__ = ["BooleanType", *[_d for _d in dir() if _d.startswith("esri")]]
