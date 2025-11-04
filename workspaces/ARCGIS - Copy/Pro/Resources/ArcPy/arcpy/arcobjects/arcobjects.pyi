from _typeshed import Incomplete
from typing import Any, TypeAlias, Literal, Self, Iterable

from arcpy import FieldType
from arcpy.arcobjects import mixins
from arcpy.arcobjects._base import _BaseArcObject

from .geometries import Polygon, PointGeometry, Polyline

__all__ = [
    "ArcSDESQLExecute",
    "Array",
    "Cursor",
    "Extent",
    "FeatureSet",
    "Field",
    "FieldInfo",
    "FieldMap",
    "FieldMappings",
    "Filter",
    "GeoProcessor",
    "Geometry",
    "Index",
    "NetCDFFileProperties",
    "Parameter",
    "Point",
    "RandomNumberGenerator",
    "RecordSet",
    "Result",
    "Row",
    "Schema",
    "SpatialReference",
    "Value",
    "ValueTable",
]

ArrayInput: TypeAlias = Point | Array | None

Relation: TypeAlias = Literal[
    "BOUNDARY",
    "CLEMENTINI",
    "PROPER",
]

GeoJSON: TypeAlias = Literal[
    "POINT",
    "MULTIPOINT",
    "POLYLINE",
    "POLYGON",
]

MergeRule: TypeAlias = Literal[
    "First",
    "Last",
    "Join",
    "Min",
    "Max",
    "Mean",
    "Median",
    "Sum",
    "StDev",
    "Count",
]

FilterType: TypeAlias = Literal[
    "ValueList",
    "Range",
    "FeatureClass",
    "File",
    "Field",
    "Workspace",
]

Method: TypeAlias = Literal[
    "GEODESIC",
    "GREAT_ELLIPTIC",
    "LOXODROME",
    "PLANAR",
    "PRESERVE_SHAPE",
]

ParameterDirection: TypeAlias = Literal["Input", "Output"]

ParameterType: TypeAlias = Literal["Required", "Optional", "Derived"]

Severity: TypeAlias = Literal[
    0,  # Informative, warning, and error messages.
    1,  # Warning
    2,  # Error
]

CellSizeRule: TypeAlias = Literal[
    "AsSpecified",
    "FirstDependency",
    "Max",
    "Min",
    "Environment",
]

ExtentRule: TypeAlias = Literal[
    "AsSpecified",
    "FirstDependency",
    "Intersection",
    "Union",
    "Environment",
]

FeatureType: TypeAlias = Literal["Simple", "Annotation", "Dimension"]

FeatureTypeRule: TypeAlias = Literal["AsSpecified", "FirstDependency"]

FieldsRule: TypeAlias = Literal[
    "None",
    "FirstDependency",
    "FirstDependencyFIDs",
    "All",
    "AllNoFIDs",
    "AllFIDsOnly",
]

GeometryTypeRule: TypeAlias = Literal[
    "Unknown",
    "FirstDependency",
    "Max",
    "Min",
    "AsSpecified",
]
RasterRule: TypeAlias = Literal[
    "FirstDependency",
    "Max",
    "Min",
    "Integer",
    "Float",
]

class ArcSDESQLExecute(mixins.ArcSDESQLExecuteMixin, _BaseArcObject):
    def execute(self, sql_statement: str, /) -> Any: ...
    def startTransaction(self) -> None: ...
    def rollbackTransaction(self) -> None: ...
    def commitTransaction(self) -> None: ...
    @property
    def transactionAutoCommit(self) -> int:
        """The autocommit interval. This can be used to force intermediate commits after a specified number of features have been modified."""
    @transactionAutoCommit.setter
    def transactionAutoCommit(self, value: int) -> None: ...

class Array(mixins.ArrayMixin, _BaseArcObject):
    def __next__(self, *args) -> ArrayInput: ...
    def add(self, value: ArrayInput, /) -> None: ...
    def getObject(self, index: int, /) -> ArrayInput: ...
    def reset(self) -> None: ...
    def next(self) -> ArrayInput: ...
    def remove(self, index: int, /) -> None: ...
    def removeAll(self) -> None: ...
    def insert(self, index: int, value: ArrayInput, /) -> None: ...
    def replace(self, index: int, value: ArrayInput, /) -> None: ...
    def clone(self, point_object: Point, /) -> None: ...
    @property
    def count(self) -> int:
        """The element count of the array."""

class Cursor(mixins.CursorMixin, _BaseArcObject):
    def __next__(self, *args) -> Row: ...
    def reset(self) -> None: ...
    def next(self) -> Row: ...
    def newRow(self) -> Row: ...
    def updateRow(self, row: Row, /) -> None: ...
    def insertRow(self, row: Row, /) -> None: ...
    def deleteRow(self, row: Row, /) -> None: ...

class Extent(mixins.ExtentMixin, _BaseArcObject):
    def contains(self, second_geometry: Geometry, relation: Relation | None = None) -> bool: ...
    def crosses(self, second_geometry: Geometry) -> bool: ...
    def disjoint(self, second_geometry: Geometry) -> bool: ...
    def equals(self, second_geometry: Geometry) -> bool: ...
    def overlaps(self, second_geometry: Geometry) -> bool: ...
    def touches(self, second_geometry: Geometry) -> bool: ...
    def within(self, second_geometry: Geometry, relation: Relation | None = None) -> bool: ...
    def projectAs(
        self,
        spatial_reference: SpatialReference | str,
        transformation_name: str | None = None,
    ) -> Self: ...
    @property
    def JSON(self) -> str:
        """Returns a JSON representation of the extent as a string."""
    @property
    def MMax(self) -> float | None:
        """The extent MMax value. None if no m-value."""
    @property
    def MMin(self) -> float | None:
        """The extent MMin value. None if no m-value."""
    @property
    def XMax(self) -> float:
        """The extent XMax value."""
    @property
    def XMin(self) -> float:
        """The extent XMin value."""
    @property
    def YMax(self) -> float:
        """The extent YMax value."""
    @property
    def YMin(self) -> float:
        """The extent YMin value."""
    @property
    def ZMax(self) -> float | None:
        """The extent ZMax value. None if no z-value."""
    @property
    def ZMin(self) -> float | None:
        """The extent ZMin value. None if no z-value."""
    @property
    def depth(self) -> float | None:
        """The extent depth value. None if no depth."""
    @property
    def geohash(self) -> str:
        """A geohash string of the extent is returned."""
    @property
    def geohashCovers(self) -> list[str]:
        """Returns a list of up to the four longest geohash strings that fit within the extent."""
    @property
    def geohashNeighbors(self) -> list[str]:
        """A list of the geohash neighbor strings for the extent is returned."""
    @property
    def height(self) -> float:
        """The extent height value."""
    @property
    def lowerLeft(self) -> Point:
        """The lower left property: A point object is returned."""
    @property
    def lowerRight(self) -> Point:
        """The lower right property: A point object is returned."""
    @property
    def polygon(self) -> Polygon:
        """Returns the extent as a polygon object."""
    @property
    def spatialReference(self) -> SpatialReference:
        """The spatial reference of the extent."""
    @property
    def upperLeft(self) -> Point:
        """The upper left property: A point object is returned."""
    @property
    def upperRight(self) -> Point:
        """The upper right property: A point object is returned."""
    @property
    def width(self) -> float:
        """The extent width value."""

class FeatureSet(mixins.FeatureSetMixin, _BaseArcObject):
    def load(
        self,
        table_path: str | None = ...,
        where_clause: str | None = ...,
        time_filter: str | None = ...,
        renderer: str | dict[str, Any] | None = ...,
        is_renderer: bool | None = ...,
        geojson_geometry_type: GeoJSON | None = ...,
    ) -> None: ...
    def save(self, table_path: str, /) -> None: ...
    @property
    def JSON(self) -> str:
        """Returns an Esri JSON representation of the geometry as a string."""
    @property
    def GeoJSON(self) -> str:
        """Returns a GeoJSON representation of the geometry as a string."""

class Field(mixins.FieldMixin, _BaseArcObject):
    @property
    def aliasName(self) -> str:
        """The alias name of the field."""
    @aliasName.setter
    def aliasName(self, value: str) -> None: ...
    @property
    def baseName(self) -> str:
        """The unqualified field name."""
    @baseName.setter
    def baseName(self, value: str) -> None: ...
    @property
    def defaultValue(self) -> Any:
        """The default value of the field."""
    @defaultValue.setter
    def defaultValue(self, value: Any) -> None: ...
    @property
    def domain(self) -> str:
        """The name of the associated domain."""
    @domain.setter
    def domain(self, value: str) -> None: ...
    @property
    def editable(self) -> bool:
        """Specifies whether the field is editable."""
    @editable.setter
    def editable(self, value: bool) -> None: ...
    @property
    def isNullable(self) -> bool:
        """Specifies whether the field can contain null values."""
    @isNullable.setter
    def isNullable(self, value: bool) -> None: ...
    @property
    def length(self) -> int:
        """The length of the field."""
    @length.setter
    def length(self, value: int) -> None: ...
    @property
    def name(self) -> str:
        """The name of the field."""
    @name.setter
    def name(self, value: str) -> None: ...
    @property
    def precision(self) -> int:
        """The precision for field values.
        For fields of type Date, the precision can be either 0 or 1.
            0—A regular date field. Data will be stored to the second (1/60 of a minute).
            1—A high precision date field. Data will be stored to the millisecond (1/1000 of a second).
        """
    @precision.setter
    def precision(self, value: int) -> None: ...
    @property
    def required(self) -> bool:
        """Specifies whether the field is required. A required field cannot be deleted."""
    @required.setter
    def required(self, value: bool) -> None: ...
    @property
    def scale(self) -> int:
        """The scale of the field."""
    @scale.setter
    def scale(self, value: int) -> None: ...
    @property
    def type(self) -> FieldType:
        """Specifies the field type"""
    @type.setter
    def type(self, value: FieldType) -> None: ...

class FieldInfo(mixins.FieldInfoMixin, _BaseArcObject):
    def addField(
        self,
        field_name: str,
        new_field_name: str,
        visible: Literal["VISIBLE", "HIDDEN"],
        split_rule: Literal["NONE", "RATIO"],
        /,
    ) -> None: ...
    def getFieldName(self, index: int, /) -> str: ...
    def getNewName(self, index: int, /) -> str: ...
    def getSplitRule(self, index: int, /) -> Literal["NONE", "RATIO"]: ...
    def getVisible(self, index: int, /) -> Literal["VISIBLE", "HIDDEN"]: ...
    def setFieldName(self, index: int, field_name: str, /) -> None: ...
    def setNewName(self, index: int, new_field_name: str, /) -> None: ...
    def setSplitRule(self, index: int, rule: Literal["NONE", "RATIO"], /) -> None: ...
    def setVisible(self, index: int, visible: Literal["VISIBLE", "HIDDEN"], /) -> None: ...
    def removeField(self, index: int, /) -> None: ...
    def findFieldByName(self, field_name: str, /) -> int: ...
    def findFieldByNewName(self, field_name: str, /) -> int: ...
    def loadFromString(self, string: str, /) -> None: ...
    def exportToString(self) -> str: ...
    @property
    def count(self) -> int:
        """The field count."""

class FieldMap(mixins.FieldMapMixin, _BaseArcObject):
    def addInputField(
        self,
        table_dataset: str,
        field_name: str,
        start_position: int = ...,
        end_position: int = ...,
        /,
    ) -> None: ...
    def getInputTableName(self, index: int, /) -> str: ...
    def getInputFieldName(self, index: int, /) -> str: ...
    def getStartTextPosition(self, index: int, /) -> int: ...
    def getEndTextPosition(self, index: int, /) -> int: ...
    def removeAll(self) -> None: ...
    def removeInputField(self, index: int, /) -> None: ...
    def findInputFieldIndex(self, table_dataset: str, field_name: str, /) -> int: ...
    def setStartTextPosition(self, index: int, start_position: int, /) -> None: ...
    def setEndTextPosition(self, index: int, end_position: int, /) -> None: ...
    @property
    def inputFieldCount(self) -> int:
        """The number of defined input fields."""
    @property
    def joinDelimiter(self) -> str:
        """A string value used to separate input values from the same table if the output field type is string and the mergeRule is Join."""
    @joinDelimiter.setter
    def joinDelimiter(self, value: str) -> None: ...
    @property
    def mergeRule(self) -> MergeRule:
        """Defines how values from two or more fields from the same input table are merged into a single output value.
        Valid choices are as follows:
        First—The first input value is used.
        Last—The last input value is used.
        Join—Merge the values using the delimiter value to separate the values (only valid if the output field type is text).
        Min—The smallest input value is used (only valid if the output field type is numeric).
        Max—The largest input value is used (only valid if the output field type is numeric).
        Mean—The mean is calculated using the input values (only valid if the output field type is numeric).
        Median—The median is calculated using the input values (only valid if the output field type is numeric).
        Sum—The sum is calculated using the input values (only valid if the output field type is numeric).
        StDev—The standard deviation is calculated using the input values (only valid if the output field type is numeric).
        Count—The number of values included in statistical calculations. This counts each value except null values.
        """
    @mergeRule.setter
    def mergeRule(self, value: MergeRule) -> None: ...
    @property
    def outputField(self) -> Field:
        """The properties of the output field are either set or returned in a Field object."""
    @outputField.setter
    def outputField(self, value: Field) -> None: ...

class FieldMappings(mixins.FieldMappingsMixin, _BaseArcObject):
    def addTable(self, table_dataset: str, /) -> None: ...
    def removeAll(self) -> None: ...
    def addFieldMap(self, field_map: FieldMap, /) -> None: ...
    def getFieldMap(self, index: int, /) -> FieldMap: ...
    def replaceFieldMap(self, index: int, value: FieldMap, /) -> None: ...
    def removeFieldMap(self, index: int, /) -> None: ...
    def findFieldMapIndex(self, field_map_name: str, /) -> int: ...
    def loadFromString(self, string: str, /) -> None: ...
    def exportToString(self) -> str: ...
    @property
    def fieldCount(self) -> int:
        """The number of output fields."""
    @property
    def fieldMappings(self) -> list[FieldMap]:
        """A list of FieldMap objects that make up the FieldMappings object."""
    @fieldMappings.setter
    def fieldMappings(self, value: list[FieldMap]) -> None: ...
    @property
    def fieldValidationWorkspace(self) -> str:
        """The workspace type that defines the rules for attribute field naming.
        These rules are used when determining the output field names, which are based on the names of the input fields.
        For example, setting the fieldValidationWorkspace property to the path of a folder on disk containing the input shapefiles will result in the output field names being truncated to 10 characters.
        Setting the fieldValidationWorkspace property to the path of a file geodatabase will allow for much longer field names.
        The fieldValidationWorkspace property should be set with a consideration for the output format.
        """
    @fieldValidationWorkspace.setter
    def fieldValidationWorkspace(self, value: str) -> None: ...
    @property
    def fields(self) -> list[Field]:
        """A list of Field objects. Each field object represents the properties of each output field."""

class Filter(_BaseArcObject):
    @property
    def list(self) -> list[Any]:
        """If you do not want to filter values, set the list property to an empty list.
        The data type specified depends on the filter type (ValueList, Range, FeatureClass, File, Field, and Workspace).
        """
    @list.setter
    def list(self, value: list[Any]) -> None: ...
    @property
    def type(self) -> FilterType:
        """The type of filter (ValueList, Range, FeatureClass, File, Field, and Workspace).
        You can set the type of filter when using Long, Double, Linear Unit, Areal Unit, and Time Unit parameters.
        For other types of parameters, there is only one valid type of filter, so setting the type on these parameters is ignored.
        If you do not want to filter values, set the list property to an empty list.
        """
    @type.setter
    def type(self, value: FilterType) -> None: ...

class GeoProcessor(_BaseArcObject):
    messageCount: Incomplete
    maxSeverity: Incomplete
    parameterCount: Incomplete
    toolbox: Incomplete
    overwriteOutput: Incomplete
    useCompatibleFieldTypes: Incomplete
    logHistory: Incomplete
    logLineage: Incomplete
    scriptVersion: Incomplete
    severityLevel: Incomplete

    def getInstallInfo(self, *args): ...
    def listInstallations(self, *args): ...
    def setProgressor(self, *args): ...
    def resetProgressor(self, *args): ...
    def setProgressorLabel(self, *args): ...
    def setProgressorPosition(self, *args): ...
    def resetEnvironments(self, *args): ...
    def clearEnvironment(self, *args): ...
    def getMessage(self, *args): ...
    def getSeverity(self, *args): ...
    def getReturnCode(self, *args): ...
    def getMessages(self, *args): ...
    def getAllMessages(self, *args): ...
    def addMessage(self, *args): ...
    def addIDMessage(self, *args): ...
    def getIDMessage(self, *args): ...
    def addError(self, *args): ...
    def addWarning(self, *args): ...
    def addReturnMessage(self, *args): ...
    def productInfo(self, *args): ...
    def setProduct(self, *args): ...
    def checkProduct(self, *args): ...
    def checkOutExtension(self, *args): ...
    def checkInExtension(self, *args): ...
    def checkExtension(self, *args): ...
    def getParameterAsText(self, *args): ...
    def setParameterAsText(self, *args): ...
    def getParameter(self, *args): ...
    def setParameter(self, *args): ...
    def copyParameter(self, *args): ...
    def setParameterSymbology(self, *args): ...
    def listFiles(self, *args): ...
    def listTools(self, *args): ...
    def listEnvironments(self, *args): ...
    def listToolboxes(self, *args): ...
    def addToolbox(self, *args): ...
    def removeToolbox(self, *args): ...
    def getSystemEnvironment(self, *args): ...
    def command(self, *args): ...
    def usage(self, *args): ...
    def exists(self, *args): ...
    def listFeatureClasses(self, *args): ...
    def listDatasets(self, *args): ...
    def listTables(self, *args): ...
    def listRasters(self, *args): ...
    def listWorkspaces(self, *args): ...
    def listVersions(self, *args): ...
    def listUsers(self, *args): ...
    def disconnectUser(self, *args): ...
    def listFields(self, *args): ...
    def listIndexes(self, *args): ...
    def searchCursor(self, *args): ...
    def updateCursor(self, *args): ...
    def insertCursor(self, *args): ...
    def describe(self, *args): ...
    def createObject(self, *args): ...
    def validateFieldName(self, *args): ...
    def validateTableName(self, *args): ...
    def parseFieldName(self, *args): ...
    def parseTableName(self, *args): ...
    def createScratchName(self, *args): ...
    def createUniqueName(self, *args): ...
    def testSchemaLock(self, *args): ...
    def createRandomValueGenerator(self, *args): ...
    def isSynchronous(self, *args): ...
    def getParameterCount(self, *args): ...
    def getParameterValue(self, *args): ...
    def getParameterInfo(self, *args): ...
    def addFieldDelimiters(self, *args): ...
    def listPrinterNames(self, *args): ...
    def wildcardMatch(self, *args): ...
    def alterAliasName(self, *args): ...
    def listSpatialReferences(self, *args): ...
    def listTransformations(self, *args): ...
    def acceptConnections(self, *args): ...
    def logUsageMetering(self, *args): ...
    def createGPSDDraft(self, *args): ...
    def fromEsriJson(self, *args): ...
    def listDataStoreItems(self, *args): ...
    def validateDataStoreItem(self, *args): ...
    def removeDataStoreItem(self, *args): ...
    def addDataStoreItem(self, *args): ...
    def getSigninToken(self, *args): ...
    def getActivePortalURL(self, *args): ...
    def listPortalURLs(self, *args): ...
    def getPortalDescription(self, *args): ...
    def getPortalInfo(self, *args): ...
    def decryptPYT(self, *args): ...
    def encryptPYT(self, *args): ...

class Geometry(mixins.GeometrySpecializationMixin, _BaseArcObject):
    def getPart(self, index: int | None = ..., /) -> ArrayInput: ...
    def contains(self, second_geometry: Geometry, relation: Relation | None = None) -> bool: ...
    def crosses(self, second_geometry: Geometry) -> bool: ...
    def disjoint(self, second_geometry: Geometry) -> bool: ...
    def equals(self, second_geometry: Geometry) -> bool: ...
    def overlaps(self, second_geometry: Geometry) -> bool: ...
    def touches(self, second_geometry: Geometry) -> bool: ...
    def within(self, second_geometry: Geometry, relation: Relation | None = None) -> bool: ...
    def projectAs(
        self,
        spatial_reference: SpatialReference | str,
        transformation_name: str | None = None,
    ) -> Self: ...
    def positionAlongLine(
        self,
        value: float,
        use_percentage: bool | None = False,
        geodesic: bool | None = False,
    ) -> PointGeometry: ...
    def queryPointAndDistance(
        self,
        in_point: Point | PointGeometry,
        use_percentage: bool | None = False,
    ) -> tuple[PointGeometry, float, float, bool]: ...
    def snapToLine(self, in_point: Point | PointGeometry) -> PointGeometry: ...
    def measureOnLine(
        self,
        in_point: Point | PointGeometry,
        use_percentage: bool | None = False,
    ) -> float: ...
    def generalize(self, distance: float) -> Self: ...
    def getLength(self, method: Method | None = "GEODESIC", units: str | None = None) -> float: ...
    def getArea(self, method: Method | None = "GEODESIC", units: str | None = None) -> float: ...
    def getGeohash(self, precision: int = ...) -> str: ...
    def segmentAlongLine(
        self,
        start_measure: float,
        end_measure: float,
        use_percentage: bool | None = False,
    ) -> Polyline: ...
    def angleAndDistanceTo(
        self,
        other_geometry: PointGeometry,
        method: Method | None = "GEODESIC",
    ) -> tuple[float, float]: ...
    def pointFromAngleAndDistance(
        self,
        angle: float,
        distance: float,
        method: Method | None = "GEODESIC",
    ) -> PointGeometry: ...
    def boundary(self) -> Geometry: ...
    def buffer(self, distance: float) -> Polygon: ...
    def clip(self, envelope: Extent) -> Self: ...
    def convexHull(self) -> Geometry: ...
    def difference(self, other: Geometry) -> Self: ...
    def intersect(self, other: Geometry, dimension: Literal[1, 2, 4]) -> Geometry: ...
    def symmetricDifference(self, other: Geometry) -> Geometry: ...
    def union(self, other: Geometry) -> Geometry: ...
    def distanceTo(self, other: Geometry) -> float: ...
    def cut(self, other: Polyline) -> tuple[Self | None, Self]: ...
    def densify(
        self,
        method: Literal["DISTANCE", "ANGLE", "GEODESIC"],
        distance: float = 0,
        deviation: float | None = None,
    ) -> Self: ...
    def move(
        self,
        dx: float = 0,
        dy: float = 0,
        dz: float | None = None,
    ) -> Self: ...
    def scale(
        self,
        origin: Point | PointGeometry,
        sx: float = 1,
        sy: float = 1,
        sz: float | None = None,
    ) -> Self: ...
    @property
    def JSON(self) -> str:
        """Returns an Esri JSON representation of the geometry as a string."""
    @property
    def WKB(self) -> bytearray:
        """Returns the well-known binary (WKB) representation for OGC geometry. It provides a portable representation of a geometry value as a contiguous stream of bytes."""
    @property
    def WKT(self) -> str:
        """Returns the well-known text (WKT) representation for OGC geometry. It provides a portable representation of a geometry value as a text string. Any true curves in the geometry will be densified into approximate curves in the WKT string."""
    @property
    def area(self) -> float:
        """The area of a polygon feature. It is zero for all other feature types."""
    @property
    def centroid(self) -> Point:
        """The true centroid if it is within or on the feature; otherwise, the label point is returned."""
    @property
    def extent(self) -> Extent:
        """The extent of the geometry."""
    @property
    def firstPoint(self) -> Point:
        """The first coordinate point of the geometry."""
    @property
    def hasCurves(self) -> bool:
        """Returns True if the geometry has a curve."""
    @property
    def hullRectangle(self) -> str:
        """A space-delimited string of the coordinate pairs of the convex hull rectangle."""
    @property
    def isMultipart(self) -> bool:
        """Returns True if the number of parts for this geometry is more than one."""
    @property
    def labelPoint(self) -> Point:
        """The point at which the label is located. The labelPoint is always located within or on a feature."""
    @property
    def lastPoint(self) -> Point:
        """The last coordinate of the feature."""
    @property
    def length(self) -> float:
        """
        The length of the linear feature. The calculation uses 2D Cartesian mathematics.
        For point and multipoint geometry, the length will be zero.
        For polygon geometry, the length will be the 2D length of the boundary.
        """
    @property
    def length3D(self) -> float:
        """
        The 3D length of the linear feature.  The calculation uses 3D Cartesian mathematics.
        For point and multipoint geometry, the length will be zero.
        For polygon geometry, the length will be the 3D length of the boundary.
        """
    @property
    def partCount(self) -> int:
        """The number of geometry parts for the feature."""
    @property
    def pointCount(self) -> int:
        """The total number of points for the feature."""
    @property
    def spatialReference(self) -> SpatialReference:
        """The spatial reference of the geometry."""
    @property
    def trueCentroid(self) -> Point:
        """The center of gravity for a feature."""
    @property
    def type(
        self,
    ) -> Literal["point", "polyline", "polygon", "multipoint", "multipatch", "dimension", "annotation"]:
        """The geometry type"""

class Index(_BaseArcObject):
    @property
    def fields(self) -> list[Field]:
        """A Python List of field objects for the index."""
    @property
    def isAscending(self) -> bool:
        """The isAscending state: True if the index is sorted in ascending order."""
    @property
    def isUnique(self) -> bool:
        """The isUnique state: True if the index is unique."""
    @property
    def name(self) -> str:
        """The name of the index."""

class NetCDFFileProperties(mixins.NetCDFFilePropertiesMixin, _BaseArcObject):
    def getAttributeNames(self, variable_name: str = ..., /) -> list[str]: ...
    def getAttributeValue(self, variable_name: str, attribute_name: str, /) -> Any: ...
    def getDimensionIndex(self, dimension_name: str, value: int, /) -> int: ...
    def getDimensions(self) -> list[str]: ...
    def getDimensionsByVariable(self, variable_name: str, /) -> str: ...
    def getDimensionSize(self, dimension_name: str, /) -> int: ...
    def getDimensionValue(self, dimension_name: str, index: int, /) -> Any: ...
    def getFieldType(self, name: str, /) -> str: ...
    def getSpatialReference(
        self,
        variable_name: str,
        x_dimension: int,
        y_dimension: int,
        /,
    ) -> SpatialReference: ...
    def getVariables(self) -> list[str]: ...
    def getVariablesByDimension(self, dimension_name: str, /) -> list[str]: ...

class Parameter(mixins.ParameterMixin, _BaseArcObject):
    def setErrorMessage(self, message: str, /) -> None: ...
    def setWarningMessage(self, message: str, /) -> None: ...
    def setIDMessage(
        self,
        message_type: Literal["ERROR", "WARNING"],
        message_ID: int,
        add_argument1: Any = ...,
        add_argument2: Any = ...,
        /,
    ) -> None: ...
    def clearMessage(self) -> None: ...
    def hasError(self) -> bool: ...
    def hasWarning(self) -> bool: ...
    def isInputValueDerived(self) -> bool: ...
    @property
    def altered(self) -> bool:
        """True if the user has modified the value."""
    @property
    def category(self) -> str:
        """The category of the parameter."""
    @category.setter
    def category(self, value: str) -> None: ...
    @property
    def charts(self) -> list[Any]:
        """A list of Chart objects that are added to an output parameter."""
    @charts.setter
    def charts(self, value: list[Any]) -> None: ...
    @property
    def columns(self) -> list[list[Any]]:
        """The structure of the columns in a value table parameter.
        The columns are organized in a list of lists, with each inner list representing the column data type, column name, and an optional read-only value.
        """
    @columns.setter
    def columns(self, value: list[list[Any]]) -> None: ...
    @property
    def controlCLSID(self) -> str:
        """A class identifier that can be used to override the default control for the data type."""
    @controlCLSID.setter
    def controlCLSID(self, value: str) -> None: ...
    @property
    def datatype(self) -> str:
        """The data type of the parameter."""
    @datatype.setter
    def datatype(self, value: str) -> None: ...
    @property
    def defaultEnvironmentName(self) -> str:
        """The name of the geoprocessing environment setting used to set the parameter's default value."""
    @defaultEnvironmentName.setter
    def defaultEnvironmentName(self, value: str) -> None: ...
    @property
    def direction(self) -> ParameterDirection:
        """The direction of the parameter."""
    @direction.setter
    def direction(self, value: ParameterDirection) -> None: ...
    @property
    def displayName(self) -> str:
        """The parameter label as shown in the Geoprocessing pane."""
    @displayName.setter
    def displayName(self, value: str) -> None: ...
    @property
    def displayOrder(self) -> int:
        """The order in which a parameter is displayed in the Geoprocessing pane.
        This may be different from the order the parameters are accessed from Python.
        """
    @displayOrder.setter
    def displayOrder(self, value: int) -> None: ...
    @property
    def enabled(self) -> bool:
        """False if the parameter is unavailable."""
    @enabled.setter
    def enabled(self, value: bool) -> None: ...
    @property
    def filter(self) -> Filter | None:
        """The filter to apply to values in the parameter."""
    @property
    def filters(self) -> list[Filter]:
        """Similar to the filter property, but it is used to support value table parameters."""
    @filters.setter
    def filters(self, value: list[Filter]) -> None: ...
    @property
    def hasBeenValidated(self) -> bool:
        """True if the internal validation routine has checked the parameter."""
    @property
    def message(self) -> str:
        """The message to be displayed to the user."""
    @property
    def multiValue(self) -> bool:
        """True if the parameter is a multivalue parameter."""
    @multiValue.setter
    def multiValue(self, value: bool) -> None: ...
    @property
    def name(self) -> str:
        """The parameter name."""
    @name.setter
    def name(self, value: str) -> None: ...
    @property
    def parameterDependencies(self) -> int:
        """A list of indexes of each dependent parameter.
        In a script tool, parameterDependencies is set with a list of parameter indexes; in a Python toolbox tool, parameterDependencies is set with a list of parameter names.
        """
    @parameterDependencies.setter
    def parameterDependencies(self, value: int) -> None: ...
    @property
    def parameterType(self) -> ParameterType:
        """The parameterType property can be Required, Optional, or Derived.
        In validation, the parameterType value cannot be dynamically modified.
        However, it may be necessary for a parameter to behave as a required parameter or an optional parameter depending on other parameter settings.
        If this is the case, set the parameter as optional. Then, in the validation updateMessages method, use the Parameter setIDMessage method with message ID 530 or 735.
        Using message ID 530 or 735 will cause an optional parameter to behave as a required parameter.
        Required—The parameter requires a value for the tool to run.
        Optional— The parameter does not require a value for the tool to run.
        Derived—The tool returns an output value that is not provided as an input parameter. Derived parameters are always output parameters.
        """
    @parameterType.setter
    def parameterType(self, value: ParameterType) -> None: ...
    @property
    def schema(self) -> Schema:
        """The schema of the output dataset."""
    @property
    def symbology(self) -> str | None:
        """The path to a layer file (.lyrx or .lyr) used for drawing the output."""
    @symbology.setter
    def symbology(self, value: str) -> None: ...
    @property
    def value(self) -> Any:
        """The value of the parameter."""
    @value.setter
    def value(self, value: Any) -> None: ...
    @property
    def valueAsText(self) -> str:
        """The value of the parameter as a string."""
    @property
    def values(self) -> list[Any]:
        """The values of a Value Table parameter, which is set using a list of lists."""
    @values.setter
    def values(self, value: list[Any]) -> None: ...

class Point(mixins.PointMixin, _BaseArcObject):
    def clone(self, point_object: Point, /) -> None: ...
    def contains(self, second_geometry: Geometry, relation: Relation | None = None) -> bool: ...
    def crosses(self, second_geometry: Geometry) -> bool: ...
    def disjoint(self, second_geometry: Geometry) -> bool: ...
    def equals(self, second_geometry: Geometry) -> bool: ...
    def overlaps(self, second_geometry: Geometry) -> bool: ...
    def touches(self, second_geometry: Geometry) -> bool: ...
    def within(self, second_geometry: Geometry, relation: Relation | None = None) -> bool: ...
    @property
    def X(self) -> float:
        """The horizontal coordinate of the point."""
    @property
    def Y(self) -> float:
        """The vertical coordinate of the point."""
    @property
    def Z(self) -> float | None:
        """The elevation value of the point."""
    @property
    def M(self) -> float | None:
        """The measure value of the point."""
    @property
    def ID(self) -> int:
        """An integer used to uniquely identify the point."""

class RandomNumberGenerator(_BaseArcObject):
    def loadFromString(self, string: str, /) -> None: ...
    def exportToString(self) -> str: ...

class RecordSet(mixins.RecordSetMixin, _BaseArcObject):
    def load(self, table_path: str = ..., where_clause: str = ...) -> None: ...
    def save(self, table_path: str, /) -> None: ...
    @property
    def JSON(self) -> str:
        """Returns an Esri JSON representation of the geometry as a string."""

class Result(mixins.ResultMixin, _BaseArcObject):
    def getMessage(self, index: int, /) -> str: ...
    def getMessages(self, severity: Severity = ..., /) -> str: ...
    def getAllMessages(self) -> list[tuple[int, int, str]]: ...
    def getSeverity(self, index: int, /) -> Severity: ...
    def getOutput(self, index: int | str, /) -> Any: ...
    def getInput(self, index: int | str, /) -> Any: ...
    def getMapImageURL(
        self,
        parameter_list: int,
        height: float,
        width: float,
        resolution: float,
        /,
    ) -> str: ...
    def cancel(self) -> None: ...
    def saveToFile(self, rlt_file: str, /): ...
    @property
    def inputCount(self) -> int:
        """Returns the number of inputs."""
    @property
    def maxSeverity(self) -> Severity:
        """
        Returns the maximum severity of the messages.
        0— If the tool produced only informative messages.
        1— If the tool produced a warning message, but no error messages.
        2— If the tool produced an error message.
        """
    @property
    def messageCount(self) -> int:
        """Returns the number of messages."""
    @property
    def outputCount(self) -> int:
        """Returns the number of outputs."""
    @property
    def resultID(self) -> str:
        """Gets the job ID. If the tool is not a geoprocessing service, the resultID will be ""."""
    @property
    def status(self) -> int:
        """Gets the job status.
        0—New
        1—Submitted
        2—Waiting
        3—Executing
        4—Succeeded
        5—Failed
        6—Timed out
        7—Cancelling
        8—Cancelled
        9—Deleting
        10—Deleted
        """

class Row(_BaseArcObject):
    __passthrough_to_ao__: bool

    def __getattr__(self, item: str) -> Any: ...
    def setValue(self, field_name: str, object: Any, /) -> None: ...
    def getValue(self, field_name: str, /) -> Any: ...
    def setNull(self, field_name: str, /) -> None: ...
    def isNull(self, field_name: str, /) -> bool: ...

class Schema(_BaseArcObject):
    @property
    def additionalChildren(self) -> list[str]:
        """Python list of datasets to add to a workspace schema."""
    @additionalChildren.setter
    def additionalChildren(self, value: list[str]) -> None: ...
    @property
    def additionalFields(self) -> list[Field]:
        """Indicates additional fields for the fields property.
        Besides the fields that are added by the application of the fieldsRule, you can add additional fields to the output.
        """
    @additionalFields.setter
    def additionalFields(self, value: list[Field]) -> None: ...
    @property
    def cellSize(self) -> float:
        """Set this to the cell size to use when cellSizeRule is AsSpecified."""
    @cellSize.setter
    def cellSize(self, value: float) -> None: ...
    @property
    def cellSizeRule(self) -> CellSizeRule:
        """Determines the cell size of output rasters or grids.
        AsSpecified—The output cell size is specified in the cellSize property.
        FirstDependency—The cell size is calculated from the first dependent parameter.
            If the dependent parameter is a raster, then its cell size is used.
            For other types of dependent parameters, such as feature classes or feature datasets, the extent of the data is used to calculate a cell size.
            If the first dependent parameter is a multivalue (a list of values), the first value in the multivalue list is used.
        Max—The largest cell size of the dependent parameters.
        Min—The smallest cell size of the dependent parameters.
        Environment—The cell size is calculated based on the cell size environment setting.
        """
    @cellSizeRule.setter
    def cellSizeRule(self, value: CellSizeRule) -> None: ...
    @property
    def clone(self) -> bool:
        """If True, make an exact copy (clone) of the description in the first dependent parameter. The default value is False."""
    @clone.setter
    def clone(self, value: bool) -> None: ...
    @property
    def extent(self) -> Extent:
        """Set this to the extent to use when extentRule is AsSpecified.
        You can either set the extent with a space-delimited string or a Python list object with four values.
        The sequence is xmin, ymin, xmax, ymax."""
    @extent.setter
    def extent(self, value: Extent) -> None: ...
    @property
    def extentRule(self) -> ExtentRule:
        """Indicates how the extent property is to be managed.
        AsSpecified—The output extent will be specified in the Extent property.
        FirstDependency—The output extent is the same as the first dependent parameter.
            If the first dependent parameter is a multivalue (a list of values), the first value in the multivalue list is used.
        Intersection—The output extent will be the geometric intersection of all dependent parameters.
        Union—The output extent will be the geometric union of all dependent parameters.
        Environment—The output extent will be calculated based on the output extent environment setting.
        """
    @extentRule.setter
    def extentRule(self, value: ExtentRule) -> None: ...
    @property
    def featureType(self) -> FeatureType:
        """When the featureTypeRule is AsSpecified, the value in FeatureType is used to specify the feature type of the output.
        Simple—The output will contain simple features. The geometry type of the features is specified with geometryTypeRule.
        Annotation—The output will contain annotation features.
        Dimension—The output will contain dimension features.
        """
    @featureType.setter
    def featureType(self, value: FeatureType) -> None: ...
    @property
    def featureTypeRule(self) -> FeatureTypeRule:
        """This setting determines the feature type of the output feature class. This rule has no effect on output rasters or tables.
        AsSpecified—The feature type will be determined by the featureType property.
        FirstDependency—The feature type will be the same as the first parameter in the dependencies.
            If the first dependent parameter is a multivalue (a list of values), the first value in the multivalue list is used.
        """
    @featureTypeRule.setter
    def featureTypeRule(self, value: FeatureTypeRule) -> None: ...
    @property
    def fieldsRule(self) -> FieldsRule:
        """Determines what fields will exist on the output feature class or table.
        None—No fields will be output except for the object ID.
        FirstDependency—Output fields will be the same as the first dependent parameter.
            If the first dependent parameter is a multivalue (a list of values), the first value in the multivalue list is used.
        FirstDependencyFIDs—Only the ObjectID of the first dependent input will be written to the output.
        All—All fields in the list of dependent parameters will be output.
        AllNoFIDs—All fields except for the ObjectIDs will be written to the output.
        AllFIDsOnly—All ObjectID fields are written to the output, but no other fields from the inputs will be written.
        """
    @fieldsRule.setter
    def fieldsRule(self, value: FieldsRule) -> None: ...
    @property
    def geometryType(self) -> str:
        """Set this to the geometry type to use (either Point, Multipoint, Polyline, or Polygon) when geometryTypeRule is AsSpecified."""
    @geometryType.setter
    def geometryType(self, value: str) -> None: ...
    @property
    def geometryTypeRule(self) -> GeometryTypeRule:
        """This setting determines the geometry type (such as point or polygon) of the output feature class.
        Unknown—This is the default setting.
            Typically, you should be able to determine the geometry type in updateParameters() based on the values of other parameters.
            You'd only set the rule to Unknown if you don't have enough information to determine the geometry type, such as in initializeParameters().
        FirstDependency—The geometry type is the same as the first dependent parameter.
            If the first dependent parameter is a multivalue (a list of values), the first value in the multivalue list is used.
        Max—Examines the geometries of all dependent parameters and sets the output geometry type to the maximum type found.
        Min—Examines the geometries of all dependent parameters and sets the output geometry type to the minimum type found.
        AsSpecified—The geometry type will be determined by the value of the geometryType property.
        """
    @geometryTypeRule.setter
    def geometryTypeRule(self, value: GeometryTypeRule) -> None: ...
    @property
    def rasterFormatRule(self) -> str:
        """This determines the output raster format, either GRID or Img. The default is Img, which is ERDAS IMAGINE format."""
    @rasterFormatRule.setter
    def rasterFormatRule(self, value: str) -> None: ...
    @property
    def rasterRule(self) -> RasterRule:
        """This determines the data type—integer or float—contained in the output raster.
        FirstDependency—The data type (integer or float) is the same as the first dependent parameter.
            If the first dependent parameter is a multivalue (a list of values), the first value in the multivalue list is used.
        Max—If there are dependant parameters that include integers and floats, Max creates a float output.
        Min—If there are dependant parameters that include integers and floats, Min creates an integer output.
        Integer—The output raster contains integers.
        Float—The output raster contains floats.
        """
    @rasterRule.setter
    def rasterRule(self, value: RasterRule) -> None: ...
    @property
    def type(self) -> str:
        """The schema type: Feature, Table, Raster, or Container (for workspaces and feature datasets)."""

class SpatialReference(mixins.SpatialReferenceMixin, _BaseArcObject):
    def setFalseOriginAndUnits(self, false_x: float, false_y: float, xy_units: str, /) -> None: ...
    def setZFalseOriginAndUnits(self, false_z: float, z_units: float, /) -> None: ...
    def setMFalseOriginAndUnits(self, false_m: float, m_units: float, /) -> None: ...
    def setDomain(self, x_min: float, x_max: float, y_min: float, y_max: float, /) -> None: ...
    def setZDomain(self, z_min: float, z_max: float, /) -> None: ...
    def setMDomain(self, m_min: float, m_max: float, /) -> None: ...
    def createFromFile(self, prj_file: str, /) -> Self: ...
    def create(self) -> Self: ...
    def loadFromString(self, string: str, /) -> str: ...
    def exportToString(self) -> str: ...
    @property
    def GCS(self) -> SpatialReference:
        """
        A projected coordinate system returns a SpatialReference object for the geographic coordinate system it is based on.
        A geographic coordinate system returns the same SpatialReference.
        """
    @property
    def MDomain(self) -> str:
        """The extent of the measure domain."""
    @property
    def MFalseOriginAndUnits(self) -> str:
        """The measure false origin and units."""
    @property
    def MResolution(self) -> float:
        """The measure resolution."""
    @property
    def MTolerance(self) -> float:
        """The measure tolerance."""
    @property
    def VCS(self) -> VerticalCoordinateSystem:
        """If the coordinate system has a vertical coordinate system, it returns a VCS object for the vertical coordinate system it is based on."""
    @property
    def XYResolution(self) -> float:
        """The xy resolution."""
    @property
    def XYTolerance(self) -> float:
        """The xy tolerance."""
    @property
    def ZDomain(self) -> str:
        """The extent of the z domain."""
    @property
    def ZFalseOriginAndUnits(self) -> str:
        """The z false origin and units."""
    @property
    def ZResolution(self) -> float:
        """The z resolution property."""
    @property
    def ZTolerance(self) -> float:
        """The z-tolerance property."""
    @property
    def abbreviation(self) -> str:
        """The abbreviated name of the spatial reference."""
    @property
    def alias(self) -> str:
        """The alias of the spatial reference."""
    @property
    def domain(self) -> str:
        """The extent of the xy domain."""
    @property
    def factoryCode(self) -> int:
        """The factory code or well-known ID (WKID) of the spatial reference."""
    @property
    def falseOriginAndUnits(self) -> str:
        """The false origin and units."""
    @property
    def hasMPrecision(self) -> bool:
        """Indicates whether m-value precision information has been defined."""
    @property
    def hasXYPrecision(self) -> bool:
        """Indicates whether xy precision information has been defined."""
    @property
    def hasZPrecision(self) -> bool:
        """Indicates whether z-value precision information has been defined."""
    @property
    def isHighPrecision(self) -> bool:
        """Indicates whether the spatial reference has high precision set."""
    @property
    def name(self) -> str:
        """The name of the spatial reference."""
    @property
    def remarks(self) -> str:
        """The comment string of the spatial reference."""
    @property
    def type(self) -> Literal["Geographic", "Projected"]:
        """
        The type of the spatial reference.
        Geographic—A geographic coordinate system.
        Projected— A projected coordinate system.
        """
    @property
    def usage(self) -> str:
        """The usage notes."""
    @property
    def PCSCode(self) -> int:
        """The projected coordinate system code"""
    @property
    def PCSName(self) -> str:
        """The projected coordinate system name"""
    @property
    def azimuth(self) -> float:
        """The azimuth of a projected coordinate system"""
    @property
    def centralMeridian(self) -> float:
        """The central meridian of a projected coordinate system"""
    @property
    def centralMeridianInDegrees(self) -> float:
        """The central meridian (Lambda0) of a projected coordinate system in degrees"""
    @property
    def centralParallel(self) -> float:
        """The central parallel of a projected coordinate system"""
    @property
    def classification(self) -> str:
        """The classification of a map projection"""
    @property
    def falseEasting(self) -> float:
        """The false easting of a projected coordinate system"""
    @property
    def falseNorthing(self) -> float:
        """The false northing of a projected coordinate system"""
    @property
    def latitudeOf1st(self) -> float:
        """The latitude of the first point of a projected coordinate system"""
    @property
    def latitudeOf2nd(self) -> float:
        """The latitude of the second point of a projected coordinate system"""
    @property
    def latitudeOfOrigin(self) -> float:
        """The latitude of origin of a projected coordinate system"""
    @property
    def linearUnitCode(self) -> int:
        """The linear unit code"""
    @property
    def linearUnitName(self) -> str:
        """The linear unit name"""
    @property
    def longitude(self) -> float:
        """The longitude value of this prime meridian"""
    @property
    def longitudeOf1st(self) -> float:
        """The longitude of the first point of a projected coordinate system"""
    @property
    def longitudeOf2nd(self) -> float:
        """The longitude of the second point of a projected coordinate system"""
    @property
    def longitudeOfOrigin(self) -> float:
        """The longitude of origin of a projected coordinate system"""
    @property
    def metersPerUnit(self) -> float:
        """The meters per linear unit"""
    @property
    def projectionCode(self) -> int:
        """The projection code"""
    @property
    def projectionName(self) -> str:
        """The projection name"""
    @property
    def scaleFactor(self) -> float:
        """The scale factor of a projected coordinate system"""
    @property
    def standardParallel1(self) -> float:
        """The first parallel of a projected coordinate system"""
    @property
    def standardParallel2(self) -> float:
        """The second parallel of a projected coordinate system"""
    @property
    def GCSCode(self) -> int:
        """The geographic coordinate system code"""
    @property
    def GCSName(self) -> str:
        """The geographic coordinate system name"""
    @property
    def angularUnitCode(self) -> int:
        """The angular unit code"""
    @property
    def angularUnitName(self) -> str:
        """The angular unit name"""
    @property
    def datumCode(self) -> int:
        """The datum code"""
    @property
    def datumName(self) -> str:
        """The datum name"""
    @property
    def flattening(self) -> float:
        """The flattening ratio of this spheroid"""
    @property
    def primeMeridianCode(self) -> int:
        """The prime meridian code"""
    @property
    def primeMeridianName(self) -> str:
        """The prime meridian name"""
    @property
    def radiansPerUnit(self) -> float:
        """The radians per angular unit"""
    @property
    def semiMajorAxis(self) -> float:
        """The semi-major axis length of this spheroid"""
    @property
    def semiMinorAxis(self) -> float:
        """The semi-minor axis length of this spheroid"""
    @property
    def spheroidCode(self) -> int:
        """The spheroid code"""
    @property
    def spheroidName(self) -> str:
        """The spheroid name"""

class Value(_BaseArcObject):
    @property
    def isEmpty(self) -> bool:
        """Indicates whether the value object is empty."""
    @property
    def value(self) -> Any:
        """Provides the value of the value object."""
    @value.setter
    def value(self, value: Any) -> None: ...

class ValueTable(mixins.ValueTableMixin, _BaseArcObject):
    def setColumns(self, number_of_columns: int | str | Iterable[str] | None, /) -> None: ...
    def addColumns(self, number_of_columns: int | str | Iterable[str] | None, /) -> None: ...
    def addRow(self, value: Any, /) -> None: ...
    def getRow(self, row: int, /) -> str: ...
    def getTrueRow(self, row: int, /) -> list[Any]: ...
    def getValue(self, row: int, column: int, /) -> str: ...
    def getTrueValue(self, row: int, column: int, /) -> Any: ...
    def loadFromString(self, string: str, /) -> None: ...
    def exportToString(self) -> str: ...
    def removeRow(self, row: int, /) -> None: ...
    def setRow(self, row: int, value: str, /) -> None: ...
    def setValue(self, row: int, column: int, value: Any, /) -> None: ...
    @property
    def columnCount(self) -> int:
        """The number of columns."""
    @property
    def rowCount(self) -> int:
        """The number of rows."""

class VerticalCoordinateSystem:
    @property
    def datumName(self) -> str:
        """The name of the vertical coordinate system's datum."""
    @property
    def direction(self) -> int:
        """The positive direction of the z coordinates; 1 is upward, -1 is downwards(in the direction of gravity)."""
    @property
    def factoryCode(self) -> int:
        """The factory code or WKID of the vertical coordinate system."""
    @property
    def linearUnitName(self) -> str:
        """The name of the linear units."""
    @property
    def metersPerUnit(self) -> float:
        """The meters per linear unit."""
    @property
    def name(self) -> str:
        """The name of the vertical coordinate system."""
    @property
    def verticalShift(self) -> float:
        """The vertical shift of the vertical coordinate system."""
