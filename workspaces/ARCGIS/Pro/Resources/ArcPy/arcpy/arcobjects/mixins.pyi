from typing import Iterable, Iterator, Any, Self, Literal

from . import arcobjects

class CursorMixin:
    def __iter__(self) -> Iterator[arcobjects.Row]: ...

class ArrayMixin:
    def __len__(self) -> int: ...
    def __iter__(self) -> Iterator[arcobjects.ArrayInput]: ...
    def __getitem__(self, item: int | slice) -> arcobjects.ArrayInput: ...
    def __setitem__(self, key: int, value: arcobjects.ArrayInput) -> None: ...
    def __init__(self, items: arcobjects.ArrayInput | Iterable[arcobjects.ArrayInput] = ...) -> None: ...
    def append(self, value: arcobjects.ArrayInput) -> None: ...
    def extend(self, items: arcobjects.ArrayInput) -> None: ...

class GeometrySpecializationMixin:
    __type_mapping__: dict[str, type]
    __type_string__: str

    class _passthrough: ...

    @classmethod
    def __from_scripting_arc_object__(cls, obj: Any) -> Self: ...
    def __init__(
        self,
        geometry: Literal["point", "polygon", "polyline", "multipoint"] = ...,
        inputs: arcobjects.Point | arcobjects.Array = ...,
        spatial_reference: arcobjects.SpatialReference | None = None,
        has_z: bool | None = False,
        has_m: bool | None = False,
        has_id: bool | None = False,
        /,
        **kwargs,
    ) -> None: ...
    def __eq__(self, other: object) -> bool: ...
    def __ne__(self, other: object) -> bool: ...
    def __add__(self, other: arcobjects.Geometry) -> arcobjects.Geometry: ...
    def __or__(self, other: arcobjects.Geometry) -> arcobjects.Geometry: ...
    def __sub__(self, other: arcobjects.Geometry) -> arcobjects.Geometry: ...
    def __xor__(self, other: arcobjects.Geometry) -> arcobjects.Geometry: ...
    def __reduce__(self) -> tuple: ...
    def __iter__(self) -> Iterator[arcobjects.ArrayInput]: ...
    def __getitem__(self, item: int | slice) -> arcobjects.ArrayInput: ...
    def __len__(self) -> int: ...

class ParameterMixin:
    def __init__(
        self,
        name: str | None = None,
        displayName: str | None = None,
        direction: arcobjects.ParameterDirection | None = None,
        datatype: str | None | list[str] = None,
        parameterType: arcobjects.ParameterType | None = None,
        enabled: bool | None = None,
        category: str | None = None,
        symbology: str | None = None,
        multiValue: bool | None = None,
    ) -> None: ...

class ArcSDESQLExecuteMixin:
    def __init__(
        self,
        server: str | None = None,
        instance: str | None = None,
        database: str | None = None,
        user: str | None = None,
        password: str | None = None,
    ) -> None: ...

class NetCDFFilePropertiesMixin:
    def __init__(self, netcdffile: str | None = None) -> None: ...

class SpatialReferenceMixin:
    def __init__(
        self,
        item: str | int | None = None,
        vcs: str | int | None = -1,
        text: str | None = None,
    ) -> None: ...
    def __reduce__(self) -> tuple: ...
    def __eq__(self, other: object) -> bool: ...
    def __ne__(self, other: object) -> bool: ...

class FieldMappingsMixin:
    def __init__(self) -> None: ...
    def __iter__(self) -> Iterator[arcobjects.FieldMap]: ...

class FieldMapMixin:
    def __init__(self) -> None: ...

class FieldMixin:
    def __init__(self) -> None: ...

class ExtentMixin:
    def __init__(
        self,
        XMin: float | None = ...,
        YMin: float | None = ...,
        XMax: float | None = ...,
        YMax: float | None = ...,
        ZMin: float | None = ...,
        ZMax: float | None = ...,
        MMin: float | None = ...,
        MMax: float | None = ...,
        spatial_reference: arcobjects.SpatialReference | None = ...,
    ) -> None: ...
    def __eq__(self, other: object) -> bool: ...
    def __ne__(self, other: object) -> bool: ...

class ValueTableMixin:
    def __init__(self, columns: int | str | Iterable[str] | None = None) -> None: ...

class FieldInfoMixin:
    def __init__(self) -> None: ...

class FeatureSetMixin:
    def __init__(
        self,
        table_path: str | None = ...,
        where_clause: str | None = ...,
        time_filter: str | None = ...,
        renderer: str | dict[str, Any] | None = ...,
        is_renderer: bool | None = ...,
        geojson_geometry_type: arcobjects.GeoJSON | None = ...,
    ) -> None: ...

class RecordSetMixin:
    def __init__(
        self,
        table_path: str | None = ...,
        where_clause: str | None = ...,
    ) -> None: ...

class PointMixin:
    def __init__(
        self,
        X: float | None = 0.0,
        Y: float | None = 0.0,
        Z: float | None = None,
        M: float | None = None,
        ID: int | None = 0,
    ) -> None: ...

class ResultMixin:
    def __init__(self, toolname: str = "", resultID: str = "") -> None: ...
    def __unicode__(self) -> str: ...
    def __getitem__(self, key: int | str | slice) -> Any: ...
    def __len__(self) -> int: ...
    def __iter__(self) -> Iterator[Any]: ...
