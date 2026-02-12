import json
from decimal import Decimal
from typing import TYPE_CHECKING, TextIO
from uuid import UUID

if TYPE_CHECKING:
    from .conversion.helper import Link
    import arcpy
    import pyarrow

__all__ = [
    "lower_link",
    "create_spatial_reference",
    "load_json",
    "dump_json",
    "change_first_character",
    "get_qualification_prefix",
]


def lower_link(link: "Link") -> "Link":
    """Converts the string components of a link to lowercase"""
    if not link:
        return link
    cls, val = link
    return cls, val.casefold() if isinstance(val, str) else val


def change_first_character(val: str, *, lower: bool) -> str:
    """Changes the case of the first letter of val to lower/upper case"""
    if not val:
        return val
    return (val[0].lower() if lower else val[0].upper()) + val[1:]


def get_qualification_prefix(name: str) -> str:
    """Extracts database and schema qualification from name"""
    if "." not in name:
        return ""
    return name.rsplit(".", 1)[0] + "."


def create_spatial_reference(data: dict) -> "arcpy.SpatialReference":
    """Creates spatial reference object from dictionary"""
    from arcpy import SpatialReference

    kwargs = {}
    if wkt := data.get("wkt"):
        kwargs["text"] = wkt
    else:
        if (horizontal := data.get("wkid")) is None:
            kwargs["text"] = "{B286C06B-0879-11D2-AACA-00C04FA33C20}"  # Unknown coordinate system
        else:
            kwargs["item"] = horizontal
        kwargs["vcs"] = data.get("vcsWkid")

    return SpatialReference(**kwargs)


class JSONDecoder(json.JSONDecoder):
    def __init__(self):
        super().__init__(
            parse_float=Decimal,  # Using Decimals to parse floats will maintain the full precision.
            strict=False,
        )


class JSONEncoder(json.JSONEncoder):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def default(self, o):
        if isinstance(o, Decimal):
            return f"\u0000{o}\u0000"  # Wrap in NUL, which we will replace later to maintain precision.
        elif isinstance(o, UUID):
            return f"{{{o}}}".upper()
        return super().default(o)

    def encode(self, o):
        result = super().encode(o)
        return result.replace('"\\u0000', "").replace('\\u0000"', "")  # Remove "NUL and NUL", restoring the precision.


def load_json(data):
    if isinstance(data, str):
        return json.loads(data, cls=JSONDecoder)
    return json.load(data, cls=JSONDecoder)


def dump_json(data, *, file: TextIO = None, pretty: bool = False, **kwargs):
    default = dict(
        skipkeys=False,
        ensure_ascii=False,
        check_circular=False,
        allow_nan=False,
        sort_keys=False,
        indent="\t" if pretty else None,
        separators=(",", ": ") if pretty else (",", ":"),
    )
    string = json.dumps(data, cls=JSONEncoder, **default | kwargs)
    if file:
        file.write(string)
    else:
        return string


def describe_to_arrow_schema(desc, field_names: tuple[str, ...] | list[str] = None) -> "pyarrow.Schema":
    """Converts arcpy Describe to pyarrow Schema"""
    import pyarrow as pa

    # If specified, use the field case.
    field_name_lookup = None
    if field_names:
        field_name_lookup = {f.casefold(): f for f in field_names}

    fields = []
    field: "arcpy.Field"
    for field in desc.fields:
        if field_name_lookup:
            if (field_name := field_name_lookup.get(field.name.casefold())) is None:
                continue
        else:
            field_name = field.name

        meta = None
        match field.type:
            case "OID":
                field_type = pa.int32() if field.length == 4 else pa.int64()
                meta = {b"esri.oid": b"esri.int64"}
            case "Geometry":
                field_type = pa.binary()
                meta = {b"esri.encoding": b"EsriShape", b"esri.sr_wkt": desc.spatialReference.exportToString()}
            case "String":
                field_type = pa.string()
            case "SmallInteger":
                field_type = pa.int16()
            case "Integer":
                field_type = pa.int32()
            case "BigInteger":
                field_type = pa.int64()
            case "Single":
                field_type = pa.float32()
            case "Double":
                field_type = pa.float64()
            case "Guid":
                field_type = pa.string()
                meta = {b"esri.interop.type": b"esri.guid"}
            case "GlobalID":
                field_type = pa.string()
                meta = {b"esri.interop.type": b"esri.global_id"}
            case "Blob":
                field_type = pa.binary()
                meta = {b"esri.interop.type": b"esri.blob"}
            case "Date":
                field_type = pa.timestamp("ms") if field.precision else pa.timestamp("s")
            case "DateOnly":
                field_type = pa.date64()
            case "TimeOnly":
                field_type = pa.time32("s")
            case "TimestampOffset":
                field_type = pa.string()
                meta = {b"esri.interop.type": b"esri.timestamp_offset"}
            case _:
                field_type = pa.string()

        fields.append(pa.field(name=field_name, type=field_type, nullable=field.isNullable, metadata=meta))

    return pa.schema(fields)
