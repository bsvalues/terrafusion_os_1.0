from _typeshed import Incomplete
from typing import Iterable, Iterator, Any

from arcpy import Result, SpatialReference, Extent, RandomNumberGenerator
from arcpy.typing.common import *

__all__ = ["Geoprocessor", "gp", "env"]

def gp_fixarg(
    arg: Result | tuple[Any, ...] | list[Any],
    string_results: bool,
    pass_arc_object: bool,
): ...
def gp_fixargs(
    args: Iterable,
    strip_right_nones: bool = False,
    string_results: bool = True,
    pass_arc_object: bool = True,
): ...
def gp_fixkwargs(
    kwargs: dict[str, Any],
    string_results: bool = True,
    pass_arc_object: bool = True,
): ...
def passthrough_attr(prop: str): ...

class Geoprocessor:
    def __init__(self) -> None: ...

    addToResults: Incomplete
    autoCancelling: Incomplete
    isCancelled: Incomplete
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
    def setProduct(self, *args): ...
    def checkProduct(self, *args): ...
    def productInfo(self, *args): ...
    def checkOutExtension(self, *args): ...
    def checkInExtension(self, *args): ...
    def checkExtension(self, *args): ...
    def listSpatialReferences(self, *args): ...
    def listTransformations(self, *args): ...
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
    def listFields(self, *args): ...
    def listIndexes(self, *args): ...
    def listPrinterNames(self, *args): ...
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
    def getSystemToolboxesPath(self): ...
    def getSystemToolboxesPaths(self): ...
    def getMyToolboxesPath(self): ...
    def wildcardMatch(self, wildcard, data): ...
    def alterAliasName(self, table, alias): ...
    def acceptConnections(self, sde_workspace, accept_connections): ...
    def logUsageMetering(self, code, task_name, num_objects: int = 0, units: float = 0.0): ...
    def createGPSDDraft(
        self,
        result,
        out_sddraft,
        service_name,
        server_type: str = "ARCGIS_SERVER",
        connection_file_path: str = "",
        copy_data_to_server: bool = True,
        folder_name: Incomplete | None = None,
        summary: Incomplete | None = None,
        tags: Incomplete | None = None,
        executionType: str = "Asynchronous",
        resultMapServer: bool = False,
        showMessages: str = "None",
        maximumRecords: int = 1000,
        minInstances: int = 1,
        maxInstances: int = 2,
        maxUsageTime: int = 600,
        maxWaitTime: int = 60,
        maxIdleTime: int = 1800,
        capabilities: Incomplete | None = None,
        constantValues: Incomplete | None = None,
        choiceLists: Incomplete | None = None,
    ): ...
    def fromEsriJson(self, json): ...
    def listDataStoreItems(self, connection_file, datastore_type): ...
    def validateDataStoreItem(self, connection_file, datastore_type, connection_name): ...
    def removeDataStoreItem(self, connection_file, datastore_type, connection_name): ...
    def addDataStoreItem(
        self, connection_file, datastore_type, connection_name, server_path, client_path: str = "", hostname: str = ""
    ): ...
    def getSigninToken(self): ...
    def getActivePortalURL(self): ...
    def listPortalURLs(self): ...
    def getPortalDescription(self, portal_URL: Incomplete | None = None): ...
    def getPortalInfo(self, portal_URL: Incomplete | None = None): ...
    def encryptPYT(self, toolbox, password): ...
    def decryptPYT(self, toolbox, password): ...
    def __getattr__(self, attr): ...

#def gptooldoc(toolname: str, toolinfo: Any = None) -> Any: ...

class GPEnvironments:
    _gp: Any
    _environments: set[str]

    def __init__(self, gp: Geoprocessor): ...
    def __iter__(self) -> Iterator[str]: ...
    def keys(self) -> list[str]: ...
    def values(self) -> list[Any]: ...
    def iteritems(self) -> Iterator[tuple[str, Any]]: ...
    def items(self) -> Iterator[tuple[str, Any]]: ...
    @property
    def addOutputsToMap(self) -> bool:
        """Specifies whether the output datasets will be added to the application display.
        This property is only applicable when used directly in the Python window or from a notebook in ArcGIS Pro.
        """
    @addOutputsToMap.setter
    def addOutputsToMap(self, value: bool): ...
    @property
    def annotationTextStringFieldLength(self) -> int | None:
        """Tools that honor the Annotation Text String Field Length environment will override the default field length on the TextString field in any annotation feature classes created in a database."""
    @annotationTextStringFieldLength.setter
    def annotationTextStringFieldLength(self, value: int | None): ...
    @property
    def autoCancelling(self) -> bool:
        """Specifies whether a cancellation will end the script on the current line.
        If True, it will.
        If False, a cancellation will set the isCancelled property to True and continue running.
        The default is True. Use in script tools or Python toolbox tools."""
    @autoCancelling.setter
    def autoCancelling(self, value: bool): ...
    @property
    def autoCommit(self) -> int:
        """Tools that honor the Auto Commit environment will force a commit after the specified number of changes have been made within an enterprise geodatabase transaction."""
    @autoCommit.setter
    def autoCommit(self, value: int | str): ...
    @property
    def baDataSource(self) -> str | None:
        """Tools that honor the Data Source environment comply with how data is summarized from one layer to another.
        This environment is used by Business Analyst tools only."""
    @baDataSource.setter
    def baDataSource(self, value: str | None): ...
    @property
    def baNetworkSource(self) -> str | None:
        """Tools that honor the Network Source environment allow you to set your network dataset or service used for network distance calculation tasks.
        This is used by Business Analyst tools only."""
    @baNetworkSource.setter
    def baNetworkSource(self, value: str | None): ...
    @property
    def baUseDetailedAggregation(self) -> bool:
        """Tools that honor the Use Detailed Aggregation environment will use a detailed data aggregation method for areas beyond a specified radius.
        This environment is used by Business Analyst tools only."""
    @baUseDetailedAggregation.setter
    def baUseDetailedAggregation(self, value: bool | TrueFalse): ...
    @property
    def buildStatsAndRATForTempRaster(self) -> bool:
        """Specifies whether statistics will be calculated and raster attribute tables (RAT) will be built for temporary rasters created by Spatial Analyst tools.
        The environment is only used from the interactive Python window in the application.
        The default is True.
        When set to False, the statistics will be approximate for the purpose of symbolizing raster layers, and no RAT will be built.
        """
    @buildStatsAndRATForTempRaster.setter
    def buildStatsAndRATForTempRaster(self, value: bool): ...
    @property
    def cartographicCoordinateSystem(self) -> str | None:
        """Tools that honor the Cartographic Coordinate System environment will use the specified coordinate system to determine the size, extent, and spatial relationships of features when making calculations."""
    @cartographicCoordinateSystem.setter
    def cartographicCoordinateSystem(self, value: str | SpatialReference | None): ...
    @property
    def cartographicPartitions(self) -> str | None:
        """Tools that honor the Cartographic Partitions environment will subdivide input features by the specified partition polygon features for sequential processing to avoid memory limitations that may otherwise be encountered with large datasets."""
    @cartographicPartitions.setter
    def cartographicPartitions(self, value: str | None): ...
    @property
    def cellSize(self) -> MinMax | str:
        """Tools that honor the Cell Size environment set the output raster cell size, or resolution, for the operation.
        The default output resolution is determined by the coarsest of the input raster datasets.
        """
    @cellSize.setter
    def cellSize(self, value: MinMax | str | float): ...
    @property
    def cellSizeProjectionMethod(self) -> CellSizeProjectionMethod:
        """Tools that honor the Cell Size Projection Method environment will use the specified method for calculating the output raster cell size when datasets are projected during analysis."""
    @cellSizeProjectionMethod.setter
    def cellSizeProjectionMethod(self, value: CellSizeProjectionMethod): ...
    @property
    def coincidentPoints(self) -> CoincidentPoints:
        """Tools that honor the Coincident Points environment define how coincident data is treated in Geostatistical Analyst."""
    @coincidentPoints.setter
    def coincidentPoints(self, value: CoincidentPoints): ...
    @property
    def compression(self) -> str:
        """Tools that honor the Compression environment will set the compression type when storing output raster datasets."""
    @compression.setter
    def compression(self, value: str): ...
    @property
    def configKeyword(self) -> str:
        """Tools that honor the Output CONFIG Keyword environment will use the specified keyword when creating datasets in a geodatabase."""
    @configKeyword.setter
    def configKeyword(self, value: str): ...
    @property
    def daylightSaving(self) -> bool | None:
        """Tools that honor the Adjust for Daylight Saving environment adjust the values in the date field's time zone to account for daylight saving time."""
    @daylightSaving.setter
    def daylightSaving(self, value: bool | TrueFalse | None): ...
    @property
    def extent(self) -> MinMax | Extent | None:
        """Tools that honor the Extent environment will only process features or rasters that are within the extent specified in this setting."""
    @extent.setter
    def extent(self, value: MinMax | Extent | str | None): ...
    @property
    def geographicTransformations(self) -> str | None:
        """Tools that honor the Geographic Transformations environment will use the transformation methods when projecting data."""
    @geographicTransformations.setter
    def geographicTransformations(self, value: str | None): ...
    @property
    def gpuId(self) -> int | None:
        """Tools that honor the GPU ID environment identify the GPU to use to process your data."""
    @gpuId.setter
    def gpuId(self, value: int | str | None): ...
    @property
    def isCancelled(self) -> bool:
        """When autoCancelling is set to False and the tool has been cancelled, isCancelled will be set to True.
        isCancelled is False by default and is a read-only property.
        Use this property in script tools or Python toolbox tools."""
    @property
    def maintainAttachments(self) -> bool:
        """Tools that honor the Maintain Attachments environment will copy attachments from the input features to the output features.
        An attachment table and a relationship class will be created."""
    @maintainAttachments.setter
    def maintainAttachments(self, value: bool | TrueFalse): ...
    @property
    def maintainCurveSegments(self) -> bool | TrueFalse:
        """Tools that honor the Maintain Curve Segments environment will maintain input curve segments in the output."""
    @maintainCurveSegments.setter
    def maintainCurveSegments(self, value: bool | TrueFalse): ...
    @property
    def maintainSpatialIndex(self) -> bool:
        """Legacy:The Maintain Spatial Index environment is not honored in ArcGIS Pro.
        To have the same behavior as the Maintain Spatial Index environment in ArcGIS Pro when running tools and workflows that perform insert, update, and delete operations on existing data in enterprise geodatabases, control of the spatial index can be accomplished using the Remove Spatial Index tool to remove the spatial index prior to processing and the Add Spatial Index tool to re-create the spatial index after processing.
        The Append tool also supports this workflow with file geodatabase data."""
    @maintainSpatialIndex.setter
    def maintainSpatialIndex(self, value: bool): ...
    @property
    def mask(self) -> str | None:
        """Tools that honor the Mask environment will only consider those cells that fall within the analysis mask in the operation."""
    @mask.setter
    def mask(self, value: str | None): ...
    @property
    def matchMultidimensionalVariable(self) -> bool | TrueFalse:
        """Tools that honor the Match Multidimensional Variable environment will generate a multidimensional raster only if the input multidimensional rasters share at least one variable with the same name."""
    @matchMultidimensionalVariable.setter
    def matchMultidimensionalVariable(self, value: bool): ...
    @property
    def MDomain(self) -> str | None:
        """Tools that honor the Output M Domain environment will generate output datasets with the specified measure domain (m-domain)."""
    @MDomain.setter
    def MDomain(self, value: str | None): ...
    @property
    def MResolution(self) -> float | None:
        """Tools that honor the M Resolution environment will apply the m-resolution to output geodatasets.
        The m-resolution, expressed as a very small distance, refers to the number of significant digits used to store m-values.
        """
    @MResolution.setter
    def MResolution(self, value: float | int | None): ...
    @property
    def MTolerance(self) -> float | None:
        """Tools that honor the M Tolerance environment will override the default m-tolerance on geodatasets created in a geodatabase."""
    @MTolerance.setter
    def MTolerance(self, value: float | None): ...
    @property
    def nodata(self) -> NoData | None:
        """Tools that honor the NoData environment will only process rasters in which the NoData value is valid."""
    @nodata.setter
    def nodata(self, value: NoData | None): ...
    @property
    def outputCoordinateSystem(self) -> SpatialReference | None:
        """Tools that honor the Output Coordinate System environment will create output geodatasets with the specified coordinate system."""
    @outputCoordinateSystem.setter
    def outputCoordinateSystem(self, value: SpatialReference | str | None): ...
    @property
    def outputMFlag(self) -> ZMFlag | None:
        """Tools that honor the Output has M Values environment will control whether the output geodataset will store m-values."""
    @outputMFlag.setter
    def outputMFlag(self, value: ZMFlag | None): ...
    @property
    def cellAlignment(self) -> CellAlignment | None:
        """Tools that honor the Cell Alignment environment will adjust the cell alignment of the output to match the cell alignment of the specified processing extent."""
    @cellAlignment.setter
    def cellAlignment(self, value: CellAlignment | None): ...
    @property
    def outputZFlag(self) -> ZMFlag | None:
        """Tools that honor the Output has Z Values environment will control whether the output geodataset will store z-values."""
    @outputZFlag.setter
    def outputZFlag(self, value: ZMFlag | None): ...
    @property
    def outputZValue(self) -> float | None:
        """Tools that honor the Default Output Z Value environment will set the z-coordinate for each output vertex that does not already have a z-coordinate."""
    @outputZValue.setter
    def outputZValue(self, value: str | int | float | None): ...
    @property
    def overwriteOutput(self) -> bool:
        """Specifies whether tools will automatically overwrite any existing output when run.
        When set to True, tools will run and overwrite the output dataset.
        When set to False, existing outputs will not be overwritten, and the tool will return an error.
        """
    @overwriteOutput.setter
    def overwriteOutput(self, value: bool): ...
    @property
    def packageWorkspace(self) -> str:
        """The Package Workspace environment setting is the location of a folder that locates the contents of a shared geoprocessing package or service."""
    @property
    def parallelProcessingFactor(self) -> str | None:
        """Tools that honor the Parallel Processing Factor environment will divide and perform operations across multiple processes."""
    @parallelProcessingFactor.setter
    def parallelProcessingFactor(self, value: str | int | None): ...
    @property
    def preserveGlobalIds(self) -> bool: ...
    @preserveGlobalIds.setter
    def preserveGlobalIds(self, value: bool | TrueFalse): ...
    @property
    def processingServer(self) -> str:
        """Tools that honor the Remote Processing Server set of environments specify the server, username, and password for ArcGIS Server when you use the Parallel Processing Factor environment.
        The ArcGIS server name or IP address that has the Raster Processing system service enabled.
        If the Processing Server is a server cluster, use the server name that is the site host.
        """
    @processingServer.setter
    def processingServer(self, value: str | None): ...
    @property
    def processingServerPassword(self) -> str | None:
        """Tools that honor the Remote Processing Server set of environments specify the server, username, and password for ArcGIS Server when you use the Parallel Processing Factor environment.
        The password associated with the user name that is authorized to use the Raster Processing service.
        """
    @processingServerPassword.setter
    def processingServerPassword(self, value: str): ...
    @property
    def processingServerUser(self) -> str:
        """Tools that honor the Remote Processing Server set of environments specify the server, username, and password for ArcGIS Server when you use the Parallel Processing Factor environment.
        The username that is authorized to use the Raster Processing service."""
    @processingServerUser.setter
    def processingServerUser(self, value: str): ...
    @property
    def processorType(self) -> ProcessorType | None:
        """Tools that honor the Processor Type environment allow you to choose where and how you want to process your data."""
    @processorType.setter
    def processorType(self, value: ProcessorType | None): ...
    @property
    def pyramid(self) -> str:
        """Tools that honor the Pyramid environment will only process rasters where the pyramids are valid.
        Pyramids for ERDAS IMAGINE files have limited options that can be set."""
    @pyramid.setter
    def pyramid(self, value: str): ...
    @property
    def qualifiedFieldNames(self) -> bool:
        """Tools that honor the Maintain fully qualified field names environment use this setting to distinguish between qualified and unqualified field names.
        Qualified field names are the names of fields in a feature class or table that have the name of the origin feature class or table appended to the field name.
        This setting is relevant when working with joined data."""
    @qualifiedFieldNames.setter
    def qualifiedFieldNames(self, value: bool | TrueFalse | Qualified): ...
    @property
    def randomGenerator(self) -> RandomNumberGenerator:
        """Tools that use the Random Number Generator environment use algorithms that use the seed and distribution to produce a sequence of random numbers."""
    @randomGenerator.setter
    def randomGenerator(self, value: RandomNumberGenerator | str): ...
    @property
    def rasterStatistics(self) -> str:
        """Tools that honor the Raster Statistics environment control how statistics are built for output raster datasets."""
    @rasterStatistics.setter
    def rasterStatistics(self, value: str): ...
    @property
    def recycleProcessingWorkers(self) -> int | None:
        """Tools that honor the Recycle Interval Of Processing Workers environment define how many image sections will be processed before restarting worker processes to prevent potential failures in long-running processes."""
    @recycleProcessingWorkers.setter
    def recycleProcessingWorkers(self, value: int | str | None): ...
    @property
    def referenceScale(self) -> float | None:
        """Tools that honor the Reference Scale environment will consider the graphical size and extent of symbolized features as they appear at the reference scale."""
    @referenceScale.setter
    def referenceScale(self, value: int | float | str | None): ...
    @property
    def resamplingMethod(self) -> ResamplingMethod | None:
        """Tools that honor the Resampling Method environment interpolate pixel values while transforming your raster dataset.
        This is used when the input and output do not line up exactly, when the pixel size changes, when the data is shifted, or a combination of these.
        """
    @resamplingMethod.setter
    def resamplingMethod(self, value: ResamplingMethod | None): ...
    @property
    def retryOnFailures(self) -> int:
        """Tools that honor the Number of Retries on Failures environment will retry the same worker process a specified number of attempts when there is a failure processing a particular job."""
    @retryOnFailures.setter
    def retryOnFailures(self, value: int): ...
    @property
    def scratchFolder(self) -> str:
        """The Scratch Folder environment setting is the location of a folder you can use to write file-based data, such as shapefiles, text files, and layer files."""
    @property
    def scratchGDB(self) -> str:
        """The Scratch GDB environment setting is the location of a file geodatabase you can use to write temporary data."""
    @property
    def scriptWorkspace(self) -> str:
        """The Script Workspace is the location of a project and is used by geoprocessing tools when they have been included in a project package (.ppkx file) and extracted."""
    @property
    def scratchWorkspace(self) -> str:
        """Tools that honor the Scratch Workspace environment use the specified location as the default workspace for output datasets.
        The scratch workspace is intended for output data you do not want to maintain.
        """
    @scratchWorkspace.setter
    def scratchWorkspace(self, value: str): ...
    @property
    def snapRaster(self) -> str:
        """Tools that honor the Snap Raster environment will adjust the extent of output rasters so that they match the cell alignment of the specified snap raster."""
    @snapRaster.setter
    def snapRaster(self, value: str): ...
    @property
    def S100FeatureCatalogueFile(self) -> str:
        """Tools that honor the S-100 Feature Catalogue File environment use the file specified to map objects, attributes, feature classes, and relationships during data import and the creation of database schemas."""
    @S100FeatureCatalogueFile.setter
    def S100FeatureCatalogueFile(self, value: str): ...
    @property
    def terrainMemoryUsage(self) -> bool |  None:
        """Tools that honor the Minimize memory use during analysis on terrains environment control memory use during analysis on terrains."""
    @terrainMemoryUsage.setter
    def terrainMemoryUsage(self, value: bool | TrueFalse | None): ...
    @property
    def tileSize(self) -> str:
        """Tools that honor the Tile Size environment set the tile size for rasters that are stored in blocks of data."""
    @tileSize.setter
    def tileSize(self, value: str): ...
    @property
    def timeZone(self) -> TimeZones | None:
        """Tools that honor the Time Zone environment will specify the time zone in which the date fields are stored."""
    @timeZone.setter
    def timeZone(self, value: TimeZones | None): ...
    @property
    def tinSaveVersion(self) -> TinSaveVersion | None:
        """Tools that honor the Default TIN Storage Version environment will output TIN surfaces in the specified version."""
    @tinSaveVersion.setter
    def tinSaveVersion(self, value: TinSaveVersion | None): ...
    @property
    def transferDomains(self) -> bool:
        """Tools that honor the Transfer field domain descriptions environment control whether the output will include fields containing domain and subtype descriptions, as well as fields containing domain and subtype codes.
        This setting is relevant when the input to a geoprocessing tool is a geodatabase feature class or table with defined domains and subtypes.
        """
    @transferDomains.setter
    def transferDomains(self, value: bool | TrueFalse | TransferDomains): ...
    @property
    def transferGDBAttributeProperties(self) -> bool:
        """Tools that honor the Transfer Geodatabase Field Properties environment will transfer domains, subtypes, attribute rules, field groups, and contingent values from the input dataset's fields to the output dataset's fields."""
    @transferGDBAttributeProperties.setter
    def transferGDBAttributeProperties(self, value: bool | TrueFalse): ...
    @property
    def unionDimension(self) -> bool:
        """Tools that honor the Union Dimension environment will generate a multidimensional raster that includes all the dimensions from the input multidimensional rasters."""
    @unionDimension.setter
    def unionDimension(self, value: bool | TrueFalse): ...
    @property
    def useCompatibleFieldTypes(self) -> bool:
        """Specifies whether field types that are compatible with ArcGIS Pro 3.1 will be used.
        This setting relates to the use of the Date Only, Time Only, Timestamp Offset, and Big Integer field types in CSV tables and unregistered database tables with tools that create layers or table views.
        When set to True, a layer or table view created from these sources will use field types compatible with ArcGIS Pro 3.1.
        Date Only, Time Only, and Timestamp Offset fields will be displayed as Date fields, and Big Integer fields will be displayed as Double fields.
        When set to False, all original data source field types will be used.
        Note:This property is applicable when used from stand-alone Python or for a geoprocessing service.
        When used in ArcGIS Pro, this property will always match the Use field types that are compatible with ArcGIS Pro 3.1 and earlier releases when adding query layers and text files option.
        """
    @useCompatibleFieldTypes.setter
    def useCompatibleFieldTypes(self, value: bool): ...
    @property
    def workspace(self) -> str:
        """Tools that honor the Current Workspace environment use the workspace specified as the default location for geoprocessing tool inputs and outputs."""
    @workspace.setter
    def workspace(self, value: str): ...
    @property
    def XYDomain(self) -> str | None:
        """Tools that honor the Output XY Domain environment will set the specified range to the output geodataset's x,y domain."""
    @XYDomain.setter
    def XYDomain(self, value: str | None): ...
    @property
    def XYResolution(self) -> str | None:
        """Tools that honor the XY Resolution environment will apply the x,y resolution to output geodatasets.
        The x,y resolution, expressed as a very small distance, refers to the number of significant digits used to store x,y coordinate values.
        """
    @XYResolution.setter
    def XYResolution(self, value: str | int | float | None): ...
    @property
    def XYTolerance(self) -> str | None:
        """Tools that honor the XY Tolerance environment will override the default x,y tolerance on geodatasets created in a geodatabase."""
    @XYTolerance.setter
    def XYTolerance(self, value: str | int | float | None): ...
    @property
    def ZDomain(self) -> str | None:
        """Tools that honor the Output Z Domain environment will generate output datasets with the specified z-domain."""
    @ZDomain.setter
    def ZDomain(self, value: str | None): ...
    @property
    def ZResolution(self) -> str | None:
        """Tools that honor the Z Resolution environment will apply the z-resolution to output geodatasets.
        The z-resolution, expressed as a very small distance, refers to the number of significant digits used to store z-coordinate values.
        """
    @ZResolution.setter
    def ZResolution(self, value: str | int | float | None): ...
    @property
    def ZTolerance(self) -> str | None:
        """Tools that honor the Z Tolerance environment will override the default z-tolerance on geodatasets created in a geodatabase."""
    @ZTolerance.setter
    def ZTolerance(self, value: str | int | float | None): ...

gp: Geoprocessor
env: GPEnvironments
