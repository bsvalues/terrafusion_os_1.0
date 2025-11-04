from typing import Iterator, TypeAlias, Literal, Any

from arcpy.arcobjects.arcobjects import Array, Extent, Geometry, Point, SpatialReference

__all__ = [
    "Annotation",
    "Dimension",
    "Multipatch",
    "Multipoint",
    "PointGeometry",
    "Polygon",
    "Polyline",
    "AsShape",
    "FromCoordString",
    "GenerateOptimalCoordinateSystem",
]

Notation: TypeAlias = Literal[
    "DD",
    "DDM",
    "DMS",
    "GARS",
    "GEORED",
    "MGRS",
    "USNG",
    "UTM",
    "UTMNS",
]

Property: TypeAlias = Literal[
    "EQUAL_AREA",
    "CONFORMAL",
    "EQUIDISTANT_ONE_POINT",
    "EQUIDISTANT_MERIDIANS",
    "COMPROMISE_WORLD",
]

class Annotation(Geometry): ...
class Dimension(Geometry): ...
class Multipatch(Geometry): ...

class Multipoint(Geometry):
    def __init__(
        self,
        inputs: Point | Array,
        spatial_reference: str | int | SpatialReference | None = None,
        has_z: bool | None = False,
        has_m: bool | None = False,
        has_id: bool | None = False,
    ) -> None: ...
    def __iter__(self) -> Iterator[Point]: ...

class PointGeometry(Geometry):
    def __init__(
        self,
        inputs: Point,
        spatial_reference: str | int | SpatialReference | None = None,
        has_z: bool | None = False,
        has_m: bool | None = False,
        has_id: bool | None = False,
    ) -> None: ...
    def toCoordString(self, notation: Notation) -> str: ...

class Polygon(Geometry):
    def __init__(
        self,
        inputs: Array,
        spatial_reference: str | int | SpatialReference | None = None,
        has_z: bool | None = False,
        has_m: bool | None = False,
        has_id: bool | None = False,
    ) -> None: ...
    def __iter__(self) -> Iterator[Array]: ...

class Polyline(Geometry):
    def __init__(
        self,
        inputs: Array,
        spatial_reference: str | int | SpatialReference | None = None,
        has_z: bool | None = False,
        has_m: bool | None = False,
        has_id: bool | None = False,
    ) -> None: ...
    def __iter__(self) -> Iterator[Array]: ...

def AsShape(
    geojson_struct: dict[str, Any],
    esri_json: bool = False,
) -> Geometry: ...
def FromCoordString(coordinate_str: str, notation: Notation) -> PointGeometry: ...
def GenerateOptimalCoordinateSystem(
    extent: Extent,
    property: Property,
    custom_name: str | None = None,
) -> SpatialReference: ...
