from types import TracebackType
from typing import TypedDict, Unpack

from arcpy import SpatialReference, Extent, RandomNumberGenerator
from arcpy.typing.common import *

__all__ = [
    "EnvManager",
]

class EnvDict(TypedDict, total=False):
    addOutputsToMap: bool
    annotationTextStringFieldLength: int | None
    autoCancelling: bool
    autoCommit: int | str
    baDataSource: str | None
    baNetworkSource: str | None
    baUseDetailedAggregation: bool | TrueFalse
    buildStatsAndRATForTempRaster: bool
    cartographicCoordinateSystem: str | SpatialReference | None
    cartographicPartitions: str | None
    cellAlignment: CellAlignment | None
    cellSize: MinMax | str | float
    cellSizeProjectionMethod: CellSizeProjectionMethod
    coincidentPoints: CoincidentPoints
    compression: str
    configKeyword: str
    daylightSaving: bool | TrueFalse | None
    extent: MinMax | Extent | str | None
    geographicTransformations: str | None
    gpuId: int | str | None
    maintainAttachments: bool | TrueFalse
    maintainCurveSegments: bool | TrueFalse
    maintainSpatialIndex: bool
    mask: str | None
    matchMultidimensionalVariable: str | TrueFalse
    MDomain: str | None
    MResolution: float | None
    MTolerance: float | int | None
    nodata: NoData | None
    outputCoordinateSystem: SpatialReference | str | None
    outputMFlag: ZMFlag | None
    outputZFlag: ZMFlag | None
    outputZValue: str | int | float | None
    overwriteOutput: bool
    parallelProcessingFactor: str | int | None
    preserveGlobalIds: bool | TrueFalse
    processingServer: str | None
    processingServerPassword: str
    processingServerUser: str
    processorType: ProcessorType | None
    pyramid: str
    qualifiedFieldNames: bool | TrueFalse | Qualified
    randomGenerator: RandomNumberGenerator | str
    rasterStatistics: str
    recycleProcessingWorkers: int | str | None
    referenceScale: int | float | str | None
    resamplingMethod: ResamplingMethod | None
    retryOnFailures: int
    S100FeatureCatalogueFile: str
    scratchWorkspace: str
    snapRaster: str
    terrainMemoryUsage: bool
    tileSize: str
    timeZone: TimeZones | None
    tinSaveVersion: TinSaveVersion | None
    transferDomains: bool | TrueFalse | TransferDomains
    transferGDBAttributeProperties: bool | TrueFalse
    unionDimension: bool | TrueFalse
    useCompatibleFieldTypes: bool
    workspace: str
    XYDomain: str | None
    XYResolution: str | int | float | None
    XYTolerance: str | int | float | None
    ZDomain: str | None
    ZResolution: str | int | float | None
    ZTolerance: str | int | float | None

class EnvManager:
    def __init__(self, **kwargs: Unpack[EnvDict]) -> None: ...
    def __enter__(self) -> None: ...
    def __exit__(
        self,
        exc_type: type[BaseException],
        exc_val: BaseException,
        exc_tb: TracebackType | None,
    ) -> bool: ...
    def reset(self) -> None:
        """Resets the environment settings to their values prior to calling EnvManager."""
