import types

from typing import Any, NotRequired, Literal, TypedDict, overload, SupportsIndex
import numpy.typing as npt

from arcgisscripting import ExecuteError as ExecuteError
from arcgisscripting import ExecuteWarning as ExecuteWarning
from arcpy._aio import AIO as AIO
from arcpy._aio import AIOFileOpen as AIOFileOpen
from arcpy._aio import CloudPathType as CloudPathType
from arcpy._version import version as version
from arcpy.arcobjects import *
from arcpy import charts as charts
from arcpy.charts import Chart as Chart
from arcpy.charts import TimeBinningProperties as TimeBinningProperties
from arcpy.charts import Guide as Guide
from arcpy.cmanagers import *
from arcpy.geoprocessing import *
from arcpy.ia import Mensuration as Mensuration
from arcpy.ia import Render as Render
from arcpy.sa import Raster as Raster
from arcpy.sa import RasterInfo as RasterInfo
from arcpy.toolbox import *
from arcpy.typing.describe import DescribeDataTypes
# toolbox modules
from arcpy import agolservices as agolservices
from arcpy import analysis as analysis
from arcpy import aviation as aviation
from arcpy import ba as ba
from arcpy import ca as ca
from arcpy import cartography as cartography
from arcpy import conversion as conversion
from arcpy import da as da
from arcpy import ddd as ddd
from arcpy import defense as defense
from arcpy import edit as edit
from arcpy import ga as ga
from arcpy import gapro as gapro
from arcpy import geoai as geoai
from arcpy import geoanalytics as geoanalytics
from arcpy import geocoding as geocoding
from arcpy import ia as ia
from arcpy import indoorpositioning as indoorpositioning
from arcpy import indoors as indoors
from arcpy import intelligence as intelligence
from arcpy import interop as interop
from arcpy import locref as locref
from arcpy import lr as lr
from arcpy import management as management
from arcpy import maritime as maritime
from arcpy import md as md
from arcpy import metadata as metadata
from arcpy import mp as mp
from arcpy import na as na
from arcpy import nax as nax
from arcpy import nd as nd
from arcpy import oi as oi
from arcpy import parcel as parcel
from arcpy import ra as ra
from arcpy import rm as rm
from arcpy import sa as sa
from arcpy import server as server
from arcpy import sfa as sfa
from arcpy import sharing as sharing
from arcpy import stats as stats
from arcpy import stpm as stpm
from arcpy import td as td
from arcpy import tn as tn
from arcpy import topographic as topographic
from arcpy import transit as transit
from arcpy import un as un
from arcpy import utils as utils
from arcpy import wmx as wmx

# Type Literals
LinearUnit = Literal[
    "Kilometers",
    "Meters",
    "Decimeters",
    "Centimeters",
    "Millimeters",
    "Points",
    "NauticalMiles",
    "NauticalMilesUS",
    "NauticalMilesInt",
    "Miles",
    "MilesUS",
    "MilesInt",
    "Yards",
    "YardsUS",
    "YardsInt",
    "Feet",
    "FeetUS",
    "FeetInt",
    "Inches",
    "InchesUS",
    "InchesInt",
]

ArealUnit = Literal[
    "SquareKilometers",
    "Hectares",
    "Ares",
    "SquareMeters",
    "SquareCentimeters",
    "SquareMillimeters",
    "SquareMiles",
    "SquareMilesUS",
    "SquareMilesInt",
    "Acres",
    "AcresUS",
    "AcresInt",
    "SquareYards",
    "SquareYardsUS",
    "SquareYardsInt",
    "SquareFeet",
    "SquareFeetUS",
    "SquareFeetInt",
    "SquareInches",
    "SquareInchesUS",
    "SquareInchesInt",
]

FieldType = Literal[
    "ALL",
    "Blob",
    "BigInteger",
    "Date",
    "DateOnly",
    "Double",
    "Geometry",
    "GlobalID",
    "GUID",
    "Integer",
    "OID",
    "Raster",
    "Single",
    "SmallInteger",
    "String",
    "TimeOnly",
    "TimestampOffset",
]

WorkspaceType = Literal["Coverage", "FileGDB", "Folder", "SDE", "SQLite", "ALL"]

DatasetType = Literal[
    "Coverage",
    "Feature",
    "GeometricNetwork",
    "LasDataset",
    "Mosaic",
    "Network",
    "ParcelFabric",
    "ParcelFabricForArcmap",
    "Raster",
    "RasterCatalog",  # no longer supported in Pro
    "Schematic",
    "Terrain",
    "Tin",
    "Topology",
    "TraceNetwork",
    "UtilityNetwork",
    "ALL",
]

FeatureType = Literal[
    "Annotation",
    "Arc",
    "Dimension",
    "Edge",
    "Junction",
    "Label",
    "Line",
    "Multipatch",
    "Multipoint",
    "Node",
    "Point",
    "Polygon",
    "Polyline",
    "Region",
    "Route",
    "Tic",
    "ALL",
]

ArcObjectObjects = Literal[
    "ArcSDESQLExecute",
    "Array",
    "Extent",
    "FeatureSet",
    "Field",
    "FieldInfo",
    "FieldMap",
    "FieldMappings",
    "Geometry",
    "NetCDFFileProperties",
    "Point",
    "RecordSet",
    "Result",
    "SpatialReference",
    "ValueTable",
]

MessageLevels = Literal[
    "NORMAL", "COMMANDSYNTAX", "DIAGNOSTICS", "PROJECTIONTRANSFORMATION"
]

GPMessageSeverityNames = Literal["NONE", "ERROR", "WARNING", "INFO"]

ExtensionCode = Literal[
    "3D",
    "Aeronautical",
    "Airports",
    "ArcScan",
    "Bathymetry",
    "BusinessPrem",
    "DataReviewer",
    "DataInteroperability",
    "Defense",
    "Foundation",
    "GeoStats",
    "Indoors",
    "ImageAnalyst",
    "JTX",
    "LocationReferencing",
    "LocateXT",
    "Nautical",
    "Network",
    "Publisher",
    "Schematics",
    "SMPAsiaPacific",
    "SMPEurope",
    "SMPJapan",
    "SMPLatinAmerica",
    "SMPMiddleEastAfrica",
    "SMPNorthAmerica",
    "Spatial",
    "Tracking",
]

ServerTypes = Literal["ARCGIS_SERVER", "FROM_CONNECTION_FILE", "MY_HOSTED_SERVICES"]

GeocodeServiceOperations = Literal["GEOCODE", "REVERSE_GEOCODE", "SUGGEST"]

DatastoreTypes = Literal["DATABASE", "FOLDER"]

class ParameterArray(list[Parameter]):
    @overload
    def __getitem__(self, item: int | str | SupportsIndex) -> Parameter: ...
    @overload
    def __getitem__(self, item: slice) -> list[Parameter]: ...
    def __getattribute__(self, item: str) -> Parameter: ...

# TypedDicts

class InstallInfo(TypedDict):
    LicenseLevel: str
    InstallDir: str
    Installer: str
    ProductName: str
    Version: str
    ProVersion: NotRequired[str]
    SourceDir: str
    InstallType: str
    BuildNumber: str
    InstallDate: str
    InstallTime: str
    SPNumber: str
    SPBuild: str
    LicenseType: str

class PortalInfo(TypedDict):
    SSL_enabled: bool
    organization: str
    organization_type: str
    portal_version: float
    role: str

class PackageInfo(TypedDict):
    credits: str
    description: str
    name: str
    summary: str
    tags: str
    type: str
    version: str

class SDDraftReturn(TypedDict):
    errors: dict[tuple[str, int], list[Any]]
    warnings: dict[tuple[str, int], list[Any]]
    messages: dict[tuple[str, int], list[Any]]

class SigninToken(TypedDict, total=False):
    token: str
    referer: str
    expires: str
    messages: Any


# functions
def ImportToolbox(input_file: str, module_name: str | None = ...) -> types.ModuleType: ...
def GetInstallInfo(product: str | None = None) -> InstallInfo: ...
def GetPackageInfo(filename: Any) -> PackageInfo: ...
def ListInstallations() -> list[str]: ...
def SetProgressor(
    type: Literal["default", "step"],
    message: str | None = ...,
    min_range: int | None = ...,
    max_range: int | None = ...,
    step_value: int | None = ...,
) -> None: ...
def ResetProgressor() -> None: ...
def SetProgressorLabel(label: str) -> None: ...
def SetProgressorPosition(position: int | None = ...) -> None: ...
def ResetEnvironments() -> None: ...
def ClearEnvironment(environment_name: str) -> None: ...
def GetMessage(index: int) -> str: ...
def GetReturnCode(index: int) -> int: ...
def GetMessages(severity: int | None = ...) -> str: ...
def GetAllMessages() -> list[list[int | str]]: ...
def AddMessage(message: str) -> None: ...
def AddIDMessage(
    message_type: Literal["INFORMATIVE", "WARNING", "ERROR"],
    message_ID: int | str,
    add_argument1: int | str | None = ...,
    add_argument2: int | str | None = ...,
) -> None: ...
def GetIDMessage(
    message_ID: int | str | None, default_message: int | str | None = ...
) -> str: ...
def AddError(message: int | str) -> None: ...
def AddWarning(message: int | str) -> None: ...
def AddReturnMessage(index: int) -> None: ...
def SetMessageLevels(
    levels: MessageLevels | tuple[MessageLevels, ...] | list[MessageLevels] = "NORMAL"
) -> None: ...

# def SetProduct(product: str) -> str: ...  # Not needed in arcpy as product setting happens on import
def CheckProduct(
    product: Literal[
        "ArcView", "ArcEditor", "ArcInfo", "Engine", "EngineGeoDB", "ArcServer"
    ]
) -> Literal[
    "AlreadyInitialized", "Available", "Unavailable", "NotLicensed", "Failed"
]: ...
def ProductInfo() -> str: ...
def CheckOutExtension(
    extension_code: ExtensionCode,
) -> Literal["NotInitialized", "Unavailable", "CheckedOut"]: ...
def CheckInExtension(
    extension_code: ExtensionCode,
) -> Literal["NotInitialized", "Failed", "CheckedIn"]: ...
def CheckExtension(
    extension_code: ExtensionCode,
) -> Literal["Available", "Unavailable", "NotLicensed", "Failed"]: ...
def ListSpatialReferences(
    wild_card: str | None = ...,
    spatial_reference_type: Literal["GCS", "PCS", "ALL"] | None = ...,
) -> list[str]: ...
def ListTransformations(
    from_sr: SpatialReference | str | int,
    to_sr: SpatialReference | str | int,
    extent: Extent | str | None = ...,
    vertical: bool | None = ...,
    first_only: bool | None = ...,
) -> list[str]: ...
def GetParameterAsText(index: int | str) -> str: ...
def SetParameterAsText(index: int | str, text: str) -> None: ...
def GetParameter(index: int | str) -> Any: ...
def SetParameter(index: int, value: Any) -> None: ...
def CopyParameter(from_param: int | str, to_param: int | str) -> None: ...
def SetParameterSymbology(index: int | str, text: str) -> None: ...
def ListFiles(wild_card: str | None = "") -> list[str]: ...
def ListTools(wild_card: str | None = ...) -> list[str]: ...
def ListEnvironments(wild_card: str | None = ...) -> list[str]: ...
def ListToolboxes(wild_card: str | None = ...) -> list[str]: ...
def AddToolbox(input_file: str, module_name: str | None = ...) -> None: ...
def RemoveToolbox(toolbox: str) -> None: ...
def GetSystemEnvironment(environment: str) -> str: ...
def Usage(tool_name: str) -> str: ...
def Exists(dataset: Any) -> bool: ...
def ListFeatureClasses(
    wild_card: str | None = ...,
    feature_type: FeatureType | None = ...,
    feature_dataset: str | None = ...,
) -> list[str]: ...
def ListDatasets(
    wild_card: str | None = ..., feature_type: DatasetType | None = ...
) -> list[str]: ...
def ListTables(
    wild_card: str | None = ...,
    table_type: Literal["dBASE", "INFO", "ALL"] | None = ...,
) -> list[str]: ...
def ListRasters(
    wild_card: str | None = ..., raster_type: str | None = ...
) -> list[str]: ...
def ListWorkspaces(
    wild_card: str | None = ..., workspace_type: WorkspaceType | None = ...
) -> list[str]: ...
def ListVersions(sde_workspace: Any) -> list[str]: ...
def ListUsers(sde_workspace: Any) -> list[utils.user]: ...
def DisconnectUser(sde_workspace: Any, users: list[int] | str) -> None: ...
def ListFields(
    dataset: Any, wild_card: str | None = ..., field_type: FieldType | None = ...
) -> list[Field]: ...
def ListIndexes(dataset: Any, wild_card: str | None = ...) -> list[Index]: ...

# old cursors
def SearchCursor(
    dataset: Any,
    where_clause: str | None = None,
    spatial_reference: SpatialReference | None = None,
    fields: str | None = None,
    sort_fields: str | None = None,
) -> Cursor: ...
def UpdateCursor(
    dataset: Any,
    where_clause: str | None = None,
    spatial_reference: str | SpatialReference | None = None,
    fields: str | None = None,
    sort_fields: str | None = None,
) -> Cursor: ...
def InsertCursor(dataset: Any,
    spatial_reference: SpatialReference  | None = None) -> Cursor: ...
def Describe(value: Any, data_type: DescribeDataTypes = ...): ...
def CreateObject(name: ArcObjectObjects, *options: Any): ...
def ValidateFieldName(name: str, workspace: str | None = ...) -> str: ...
def ValidateTableName(name: str, workspace: str | None = ...) -> str: ...
def ParseFieldName(name: str, workspace: str | None = ...) -> str: ...
def ParseTableName(name: str, workspace: str | None = ...) -> str: ...
def CreateScratchName(
    prefix: str | None = ...,
    suffix: str | None = ...,
    data_type: str | None = ...,
    workspace: str | None = ...,
) -> str: ...
def CreateUniqueName(base_name: str, workspace: str | None = ...) -> str: ...
def TestSchemaLock(dataset: Any) -> bool: ...
def IsBeingEdited(dataset: Any) -> bool: ...
def CreateRandomValueGenerator(
    seed: int, distribution: Literal["ACM599", "MERSENNE_TWISTER", "STANDARD_C"]
) -> RandomNumberGenerator: ...
def IsSynchronous(tool_name: str) -> bool: ...
def GetParameterCount(tool_name: str) -> int: ...
def GetParameterValue(tool_name: str, index: int | str) -> Any: ...
def GetParameterInfo(tool_name: str | None = ...) -> ParameterArray: ...
def AddFieldDelimiters(datasource: Any, field: str) -> str: ...
def ListPrinterNames() -> list[str]: ...

# tool messages
def GetSeverity(index: int | str) -> int: ...
def GetMessageCount() -> int: ...
def GetMaxSeverity() -> int: ...
def GetSeverityLevel() -> int: ...
def SetSeverityLevel(severity: int) -> None: ...
def GetArgumentCount() -> int: ...
def GetLogHistory() -> bool: ...
def SetLogHistory(log_history: bool) -> None: ...
def GetLogMetadata() -> bool: ...
def SetLogMetadata(log_metadata: bool) -> None: ...
def FromWKB(
    byte_array: bytes, spatial_reference: SpatialReference | None = ...
) -> Geometry: ...
def FromWKT(
    wkt_string: str, spatial_reference: SpatialReference | None = ...
) -> Geometry: ...
def FromGeohash(geohash_string: str) -> Extent: ...
def LinearUnitConversionFactor(from_unit: LinearUnit, to_unit: LinearUnit) -> float: ...
def ArealUnitConversionFactor(from_unit: ArealUnit, to_unit: ArealUnit) -> float: ...
def AcceptConnections(sde_workspace: str, accept_connections: bool) -> None: ...
def AlterAliasName(table: Any, alias: str) -> None: ...

# def LogUsageMetering(  # Not officially documented ArcGIS Pro
#     code: int,
#     task_name: str,
#     num_objects: int = ...,
#     units: float = ...
# ) -> None: ...
# def AttachLocator(  # Not officially documented ArcGIS Pro
#     loc_path: str,
#     fc_path: str,
#     input_field_names: str,
#     output_field_names: str,
#     settings: dict[str, str]=...
# ): ...
def CreateGeocodeSDDraft(
    loc_path: Any,
    out_sddraft: str,
    service_name: str,
    server_type: ServerTypes | None = ...,
    connection_file_path: str | None = ...,
    copy_data_to_server: bool | None = False,
    folder_name: str | None = ...,
    summary: str | None = ...,
    tags: str | None = ...,
    max_result_size: int | None = ...,
    max_batch_size: int | None = 1000,
    suggested_batch_size: int | None = 1000,
    supported_operations: list[GeocodeServiceOperations] = [
        "GEOCODE",
        "REVERSE_GEOCODE",
        "SUGGEST",
    ],
    overwrite_existing_service: bool = ...,
) -> SDDraftReturn: ...
def CreateGPSDDraft(
    result: list[Result | str],
    out_sddraft: str,
    service_name: str,
    server_type: ServerTypes | None = ...,
    connection_file_path: str | None = ...,
    copy_data_to_server: bool = False,
    folder_name: str | None = ...,
    summary: str | None = ...,
    tags: str | None = ...,
    executionType: Literal["ASYNCHRONOUS", "SYNCHRONOUS"] | None = "ASYNCHRONOUS",
    resultMapServer: bool | None = False,
    showMessages: GPMessageSeverityNames | None = "NONE",
    maximumRecords: int | None = 1000,
    minInstances: int | None = 1,
    maxInstances: int | None = 2,
    maxUsageTime: int | None = 600,
    maxWaitTime: int | None = 60,
    maxIdleTime: int | None = 1800,
    capabilities: Literal["UPLOADS"] | None = ...,
    constantValues: list[str] | None = ...,
    choiceLists: dict[str, list[str]] | None = ...,
) -> SDDraftReturn: ...
def CreateImageSDDraft(
    raster_or_mosaic_layer: Any,
    out_sddraft: str,
    service_name: str,
    server_type: ServerTypes | None = ...,
    connection_file_path: str | None = ...,
    copy_data_to_server: bool = False,
    folder_name: str | None = ...,
    summary: str | None = ...,
    tags: str | None = ...,
) -> SDDraftReturn: ...

# datastore
def ListDataStoreItems(
    connection_file: str, datastore_type: DatastoreTypes
) -> list[list[str]]: ...
def ValidateDataStoreItem(
    connection_file: str, datastore_type: DatastoreTypes, connection_name: str
) -> Literal["valid", "invalid"]: ...
def RemoveDataStoreItem(
    connection_file: str, datastore_type: DatastoreTypes, connection_name: str
) -> None: ...
def AddDataStoreItem(
    connection_file: str,
    datastore_type: DatastoreTypes,
    connection_name: str,
    server_path: str,
    client_path: str,
    hostname: str | None = ...,
) -> str | None: ...
def GetSigninToken() -> SigninToken | None: ...
def GetActivePortalURL() -> str: ...
def ListPortalURLs() -> list[str]: ...
def GetPortalDescription(portal_URL: str | None = ...) -> dict[str, Any]: ...
def GetPortalInfo(portal_URL: str | None = ...) -> dict[str, Any]: ...
def DecryptPYT(toolbox: str | None = ..., password: str | None = ...) -> None: ...
def EncryptPYT(toolbox: str | None = ..., password: str | None = ...) -> None: ...
def RasterToNumPyArray(
    in_raster: Raster,
    lower_left_corner: Point | None = None,
    ncols: int | None = None,
    nrows: int | None = None,
    nodata_to_value: int | None = None,
) -> npt.NDArray[Any]: ...
def NumPyArrayToRaster(
    in_array: npt.NDArray[Any],
    lower_left_corner: Point = Point(0.0, 0.0),
    x_cell_size: float | Raster = 1.0,
    y_cell_size: float | Raster = 1.0,
    value_to_nodata: float | None = None,
    mdinfo: str | dict[str, Any] | None = None,
) -> Raster: ...
def GetImageEXIFProperties(geotagged_image: str) -> list[float | dict[str, Any]]: ...

# def GetUTMFromLocation(*args, **kwargs): ...  # Not officially documented ArcGIS Pro
# def SetRasterKeyMetadata(*args, **kwargs): ...  # Not officially documented ArcGIS Pro
# def GetRasterKeyMetadata(*args, **kwargs): ...  # Not officially documented ArcGIS Pro
def SignInToPortal(
    portal_url: str,
    username: str | None = None,
    password: str | None = None,
    cert_file: str | None = None,
    key_file: str | None = None,
    token: str | None = None,
    token_referer: str | None = None,
    token_expiry: int | None = None,
) -> SigninToken: ...
def ImportCredentials(
    secure_server_connections: str,
) -> dict[Any, Any] | list[dict[Any, Any]]: ...
def ClearCredentials(connections: dict[Any, Any] | list[dict[Any, Any]]) -> None: ...
