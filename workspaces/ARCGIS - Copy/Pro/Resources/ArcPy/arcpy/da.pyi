from collections.abc import Callable
from typing import Any, Iterator, Iterable, Literal, Sequence, Self, TypedDict
from types import TracebackType
from arcpy.typing.describe import DescribeDataTypes
from arcpy.typing.common import NumericType, ValueType
from arcpy.arcobjects.arcobjects import SpatialReference
from datetime import datetime
import numpy.typing as npt
import numpy
import pyarrow

# Type Literals
SpatialRelationship = Literal[
    "INTERSECTS",
    "ENVELOPE_INTERSECTS",
    "INDEX_INTERSECTS",
    "TOUCHES",
    "OVERLAPS",
    "CROSSES",
    "WITHIN",
    "CONTAINS",
]

SearchOrder = Literal["ATTRIBUTEFIRST", "SPATIALFIRST"]

DomainFieldType = Literal[
    "Short",
    "Long",
    "BigInteger",
    "Float",
    "Double",
    "Text",
    "Date",
    "DateOnly",
    "TimeOnly",
]

class ContingentFieldValue:
    @property
    def code(self) -> ValueType | None:
        """If the contingent value uses a coded value domain, this property returns the code that is used for the contingent value."""
    @property
    def name(self) -> str:
        """The name of the field that participates in the field group."""
    @property
    def range(self) -> tuple[ValueType, ValueType] | None:
        """If the contingent value uses a range domain, this property returns the minimum and maximum values of the range for the contingent value."""
    @property
    def type(self) -> Literal["ANY", "CODED_VALUE", "NULL", "RANGE"]:
        """
        The type of field value used for the contingent value.
        ANY—The field value can be any value.
        CODED_VALUE—The field value is a code used in a coded value domain that has been assigned to the field.
        NULL—The field value is null.
        RANGE—The field value is a subset range of a range domain that has been assigned to the field.
        """

class ContingentValue:
    @property
    def fieldGroupName(self) -> str:
        """The name of the field group."""
    @property
    def id(self) -> int:
        """The ID of the contingent value. This ID can be used for removing the contingent value using the Remove Contingent Value tool."""
    @property
    def isRetired(self) -> bool:
        """
        Specifies whether the contingent value is retired.
        True—The contingent value is retired.
        False—The contingent value is not retired.
        """
    @property
    def subtype(self) -> int:
        """The subtype code if the contingent value is assigned to a subtype."""
    @property
    def values(self) -> list[ContingentFieldValue]:
        """Returns an object that describes the ContingentFieldValue properties."""

class DatabaseSequence:
    @property
    def currentValue(self) -> int:
        """The current value of the database sequence."""
    @property
    def incrementValue(self) -> int:
        """The value by which the sequence numbers will increment."""
    @property
    def name(self) -> str:
        """The name of the database sequence."""
    @property
    def owner(self) -> str:
        """The owner of the sequence. This is applicable to enterprise databases only. File geodatabases will return an empty string."""
    @property
    def startValue(self) -> int:
        """The starting number of the sequence."""

class Domain:
    @property
    def codedValues(self) -> dict[ValueType, str]:
        """A Python dictionary containing the coded values for the attribute domains. The dictionary keys are the coded values. The dictionary values are the domain descriptions."""
    @property
    def description(self) -> str:
        """The description of the domain."""
    @property
    def domainType(self) -> Literal["CodedValue", "Range"]:
        """
        The domain type.
        CodedValue—Coded value domain
        Range—Range domain
        """
    @property
    def mergePolicy(self) -> Literal["AreaWeighted", "DefaultValue", "SumValues"]:
        """
        The merge policy type.
        AreaWeighted—Area weighted merge policy
        DefaultValue—Default value merge policy
        SumValues—Sum the values merge policy
        """
    @property
    def name(self) -> str:
        """The name of the attribute domain."""
    @property
    def owner(self) -> str:
        """The owner of the domain."""
    @property
    def range(self) -> tuple[ValueType, ValueType]:
        """A Python tuple containing the range domain's minimum and maximum values."""
    @property
    def splitPolicy(self) -> Literal["DefaultValue", "Duplicate", "GeometryRatio"]:
        """
        The split policy type.
        DefaultValue—Default value split policy
        Duplicate—Duplicate split policy
        GeometryRatio—Geometry ratio split policy
        """
    @property
    def type(self) -> DomainFieldType:
        """The field type."""

class Replica:
    @property
    def datasets(self) -> list[str]:
        """A list of the datasets that belong to the replica."""
    @property
    def hasConflicts(self) -> bool:
        """Indicates whether the replica is in conflict."""
    @property
    def isParent(self) -> bool:
        """Indicates the replica role. Returns True if the replica is a parent and False if the replica is a child."""
    @property
    def isSender(self) -> bool:
        """Indicates whether the replica is a data sender. Returns True if the replica is a data sender and False if the replica is a data receiver."""
    @property
    def lastReceive(self) -> datetime:
        """The last time the replica received changes."""
    @property
    def lastSend(self) -> datetime:
        """The last time the replica sent changes."""
    @property
    def name(self) -> str:
        """The name of the replica."""
    @property
    def owner(self) -> str:
        """The owner of the replica in the geodatabase."""
    @property
    def replicaID(self) -> str:
        """The replica ID."""
    @property
    def replicaServerGen(self) -> int | None:
        """Indicates the last generation of changes that was successfully received from the relative replica. This property is only applicable for replicas that use the per-replica sync model."""
    @property
    def replicaServerSibGen(self) -> int | None:
        """Indicates the last generation of changes that was sent to the relative replica. This property is only applicable for replicas that use the per-replica sync model and for which the target type is server."""
    @property
    def role(self) -> Literal["Child", "Parent"] | None:
        """
        The replica role.
        Child—The replica has a child role.
        Parent—The replica has a parent role.
        """
    @property
    def serviceName(self) -> str:
        """The URL of the feature service associated with the replica. This is only applicable for replicas created from a feature service."""
    @property
    def targetType(self) -> Literal["Client", "Server"] | None:
        """
        The type of target for syncing the replica.
        Client—Created from a feature service for syncing with an offline mobile editor.
        Server—Created from a feature service for syncing with another feature service.
        None—A replica created through geodatabase replication workflows or by a feature service from an earlier release.
        """
    @property
    def type(self) -> Literal["CheckOut", "OneWay", "TwoWay"]:
        """
        The replica type.
        CheckOut—The replica is a checkout replica.
        OneWay—The replica is a one-way replica.
        TwoWay—The replica is a two-way replica.
        """
    @property
    def version(self) -> str:
        """The version from which the replica was created (replica version)."""

class Subtype(TypedDict):
    Default: bool
    Name: str
    FieldValues: dict[str, tuple[ValueType | None, Domain | None]]
    SubtypeField: str

class Version:
    @property
    def access(self) -> Literal["Private", "Public", "Protected"]:
        """
        The version's access permission.
        Private—The version's access permission is private.
        Public—The version's access permission is public.
        Protected—The version's access permission is protected.
        """
    @property
    def ancestors(self) -> list[Version]:
        """The version's ancestors. A list of all the versions that are in the ancestral lineage for the current version. For example, the parent version, the grandparent version, and so on, all the way back to the default version."""
    @property
    def children(self) -> list[Version]:
        """The version's children. A list of all the versions that were created directly from the current version. It does not, for example, list the grandchildren of the version."""
    @property
    def created(self) -> datetime:
        """The date and time the version was created."""
    @property
    def description(self) -> str:
        """The version's description."""
    @property
    def isOwner(self) -> bool:
        """True if the current connected user is the owner of this version."""
    @property
    def lastModified(self) -> datetime:
        """The last modification of the version."""
    @property
    def name(self) -> str:
        """The name of the version."""
    @property
    def parentVersionName(self) -> str | None:
        """Name of the parent version."""

class SearchCursor(Iterator[tuple[Any, ...]]):
    """Create a read-only cursor on a feature class or table."""

    def __init__(
        self,
        in_table: Any,
        field_names: str | Sequence[str],
        where_clause: str | None = None,
        spatial_reference: str | int | SpatialReference | None = None,
        explode_to_points: bool | None = False,
        sql_clause: list[str | None] | tuple[str | None, str | None] = (None, None),
        datum_transformation: str | None = None,
        spatial_filter: Any = None,
        spatial_relationship: SpatialRelationship | None = None,
        search_order: SearchOrder | None = None,
    ) -> None: ...
    def __enter__(self) -> Self: ...
    def __exit__(
        self,
        exc_type: type[BaseException],
        exc_val: BaseException,
        exc_tb: TracebackType | None,
    ) -> bool: ...
    def __next__(self) -> tuple[Any, ...]: ...
    def __iter__(self) -> Iterator[tuple[Any, ...]]: ...
    def next(self) -> tuple[Any, ...]: ...
    def reset(self) -> None:
        """Reset cursor position"""
        ...
    @property
    def fields(self) -> tuple[str, ...]:
        """Returns fields name"""
        ...
    @property
    def _dtype(self) -> numpy.dtype[Any]:
        """Returns fields numpy dtype"""
        ...
    def _as_narray(self) -> numpy.record:
        """Returns snapshot of the current state as NumPy array."""
        ...

class UpdateCursor(Iterator[list[Any]]):
    """
    Create an update cursor on a feature class or table.
    """

    _enable_simplify: bool | None = False

    # simplify geometry before update
    def __init__(
        self,
        in_table: Any,
        field_names: str | Sequence[str],
        where_clause: str | None = None,
        spatial_reference: str | int | SpatialReference | None = None,
        explode_to_points: bool | None = False,
        sql_clause: list[str | None] | tuple[str | None, str | None] = (None, None),
        datum_transformation: str | None = None,
        explicit: bool | list[bool] | None = False,
        spatial_filter: Any = None,
        spatial_relationship: SpatialRelationship | None = None,
        search_order: SearchOrder | None = None,
    ) -> None: ...
    @property
    def fields(self) -> tuple[str, ...]:
        """returns fields name"""
        ...
    def reset(self) -> None:
        """Reset cursor position"""
        ...
    def deleteRow(self) -> None:
        """Delete current row2"""
        ...
    def updateRow(self, row: Sequence[Any]) -> None:
        """Update current row"""
        ...
    def __enter__(self) -> Self: ...
    def __exit__(
        self,
        exc_type: type[BaseException],
        exc_val: BaseException,
        exc_tb: TracebackType | None,
    ) -> bool: ...
    def __next__(self) -> list[Any]: ...
    def __iter__(self) -> Iterator[list[Any]]: ...

class InsertCursor:
    """
    Create an insert cursor on a feature class or table.
    """

    _enable_simplify: bool = False

    def __init__(
        self,
        in_table: Any,
        field_names: str | Sequence[str],
        datum_transformation: str | None = ...,
        explicit: bool | list[bool] | None = False,
    ) -> None: ...
    def __enter__(self) -> Self: ...
    def __exit__(
        self,
        exc_type: type[BaseException],
        exc_val: BaseException,
        exc_tb: TracebackType | None,
    ) -> bool: ...
    @property
    def fields(self) -> tuple[str, ...]:
        """Returns fields name"""
        ...
    def insertRow(self, row: Sequence[int | str | float | object]) -> int:
        """Insert new row"""
        ...

class SearchRelatedRecords(Iterator[tuple[tuple[Any, ...], tuple[Any, ...]]]):
    """Create a read-only cursor based on a relationship."""

    def __init__(
        self,
        relationship_class: str,
        oids_to_search: Literal["*"] | list[int] | tuple[int, ...] = "*",
        origin_fields: str | Iterable[str] | None = ...,
        destination_fields: str | Iterable[str] | None = ...,
        backward: bool | None = False,
    ) -> None: ...
    def __enter__(self) -> Self: ...
    def __exit__(
        self,
        exc_type: type[BaseException],
        exc_val: BaseException,
        exc_tb: TracebackType | None,
    ) -> bool: ...
    def __next__(self) -> tuple[tuple[Any, ...], tuple[Any, ...]]: ...
    def __iter__(
        self
    ) -> Iterator[tuple[tuple[Any, ...], tuple[Any, ...]]]: ...
    def next(self) -> tuple[tuple[Any, ...], tuple[Any, ...]]: ...
    def reset(self) -> None:
        """Resets the iteration back to the first row."""
        ...

class Editor:
    """The Editor class allows the use of edit sessions and operations
    to manage database transactions."""

    def __init__(
        self,
        workspace: str,
        multiuser_mode: bool | None = ...,
    ) -> None: ...
    @property
    def isEditing(self) -> bool:
        """True if the Editor is in an edit session."""
        ...
    def __enter__(self) -> Self:
        """Starts an edit session."""
        ...
    def __exit__(
        self,
        exc_type: type[BaseException],
        exc_val: BaseException,
        exc_tb: TracebackType | None,
    ) -> bool:
        """If successful, stops editing and saves an edit session.
        If an exception, stops editing and doesn't save."""
        ...
    def startEditing(self, with_undo: bool = True, multiuser_mode: bool = True) -> None:
        """Starts an edit session."""
        ...
    def stopEditing(self, save_changes: bool) -> None:
        """Stops an edit session."""
        ...
    def startOperation(self) -> None:
        """Starts an edit operation."""
        ...
    def stopOperation(self) -> None:
        """Stops an edit operation."""
        ...
    def abortOperation(self) -> None:
        """Aborts an edit operation."""
        ...
    def undoOperation(self) -> None:
        """Undo an edit operation (roll back modifications)."""
        ...
    def redoOperation(self) -> None:
        """Redoes an edit operation."""
        ...

# numpy support
def NumPyArrayToTable(in_array: npt.NDArray[Any], out_table: str) -> None:
    """Save NumPyArray as Table."""
    ...

def NumPyArrayToFeatureClass(
    in_array: npt.NDArray[Any],
    out_table: str,
    shape_fields: str | list[str] | tuple[str, ...],
    spatial_reference: str | int | SpatialReference | None = None,
) -> None:
    """Save NumPyArray as FeatureClass."""
    ...

def TableToNumPyArray(
    in_table: Any,
    field_names: str | Iterable[str],
    where_clause: str | None = ...,
    skip_nulls: bool | Callable | None = False,
    null_value: str | NumericType | dict[str, str | NumericType] | None = ...,
) -> npt.NDArray[Any]:
    """Load and return NumPyArray record object."""
    ...

def FeatureClassToNumPyArray(
    in_table: Any,
    field_names: str | Iterable[str],
    where_clause: str | None = ...,
    spatial_reference: str | int | SpatialReference | None = ...,
    explode_to_points: bool | None = False,
    skip_nulls: bool | None = False,
    null_value: str | NumericType | dict[str, str | NumericType] | None = ...,
    sql_clause: list[str] | tuple[str, str] | None = None,
) -> npt.NDArray[Any]:
    """Load and return NumPyArray record object."""
    ...

def ExtendTable(
    in_table: Any,
    table_match_field: str | Iterable[str],
    in_array: npt.NDArray[Any],
    array_match_field: str | Iterable[str],
    append_only: bool | None = True,
) -> None:
    """Extend and update table with NumPyArray."""
    ...

def TableToArrowTable(
    in_table: Any,
    field_names: str | Iterable[str] | None = None,
    where_clause: str | None = None,
    geometry_encoding: Literal[
        "ESRISHAPE", "ESRIJSON", "GEOJSON", "WKB", "WKT"
    ] = "ESRISHAPE",
) -> pyarrow.Table: ...

def ListContingentValues(
    table: Any, field_group_name: str = ..., subtype_code: int = ...
) -> list[ContingentValue]:
    """Lists the contingent values on a table. Search conditions can be specified for the field
    group name and subtype to limit the list that is returned."""
    ...

def ListDomains(workspace: str) -> list[Domain]:
    """Lists the attribute domains belonging to a geodatabase."""
    ...

def Describe(value: Any, datatype: DescribeDataTypes = ...) -> dict[str, Any]:
    """Returns a dictionary with multiple properties, such as data type,
    fields, indexes, and many others. The dictionary's keys are dynamic,
    meaning that depending on what data type is described, different
    properties will be available for use."""
    ...

def ListDatabaseSequences(workspace: str) -> list[DatabaseSequence]:
    """Lists the database sequences in a database."""
    ...

def ListFieldConflictFilters(table: Any) -> list[str]:
    """Lists the fields in a versioned feature class, table,
    or feature service layer that have field conflict filters applied."""
    ...

def ListSubtypes(table: Any) -> dict[int, Subtype]:
    """Returns a dictionary of the subtypes for a table or feature class."""
    ...

def ListVersions(sde_workspace: Any = None) -> list[Version]:
    """Lists the versions in the workspace."""
    ...

def ListReplicas(workspace: str, all_replicas: bool | None = False) -> list[Replica]:
    """Lists the replicas in the workspace."""
    ...

def Walk(
    top: str,
    topdown: bool | None = True,
    onerror: Callable[[OSError], None] | None = None,
    followlinks: bool | None = False,
    datatype: str | Iterable[str] | None = None,
    type: str | Iterable[str] | None = None,
) -> Iterator[tuple[str, list[str], list[str]]]:
    """Returns data names in directory and database structures by
    moving through the tree from the top down or the bottom up.
    Each directory or workspace yields a tuple of three: directory path,
    directory names, and file names."""
    ...
