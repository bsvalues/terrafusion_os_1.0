import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Literal
from uuid import UUID

from lxml import etree, builder

if TYPE_CHECKING:
    from lxml.etree import _Element as Element

__all__ = [
    "E",
    "make_type",
]

XSI_TYPE = etree.QName("http://www.w3.org/2001/XMLSchema-instance", "type")
XSI_NULL = etree.QName(XSI_TYPE.namespace, "nil")

E = builder.ElementMaker(
    typemap={
        bool: lambda e, v: "true" if v else "false",
        int: lambda e, v: str(v),
        float: lambda e, v: str(v),
        type(None): lambda e, v: "",
        UUID: lambda e, v: f"{{{v}}}".upper(),
        Decimal: lambda e, v: str(v),
        datetime.datetime: lambda e, v: v.isoformat(),
    },
    nsmap=dict(
        xsi=XSI_TYPE.namespace,
        esri="http://www.esri.com/schemas/ArcGIS/10.8",
        xs="http://www.w3.org/2001/XMLSchema",
    ),
)


def make_type(name: str, prefix: Literal["xs", "esri"] = "esri") -> dict:
    return {XSI_TYPE: f"{prefix}:{name}"}


def value_to_type(val) -> dict:
    """Creates XSI type based on the type of val"""
    if isinstance(val, bool):
        t = "boolean"
    elif isinstance(val, int):
        t = "int"
    elif isinstance(val, (float, Decimal)):
        t = "double"
    elif isinstance(val, datetime.datetime):
        t = "dateTime"
    elif val is None:
        return {XSI_NULL: "true"}
    else:
        t = "string"

    return make_type(t, "xs")


def create_element_with_type(tag: str, val):
    return E(tag, value_to_type(val), val)


def write_xml(element: "Element", xml_file: str):
    """Writes element to xml_file"""

    # Indenting the xml with tabs instead of spaces gives us some space savings.
    etree.indent(tree=(root := element.getroottree()), space="\t")
    with open(xml_file, mode="w", encoding="utf-8") as writer:
        writer.write(etree.tostring(root, encoding=str))
        writer.write("\n")


def element_from_field_type(tag: str, field_type: str, val) -> "Element":
    """Creates element with attribution based on field_type"""
    from ..date_utils import to_datetime_str

    if field_type == "esriFieldTypeSmallInteger":
        t = "short"
    elif field_type == "esriFieldTypeInteger":
        t = "int"
    elif field_type == "esriFieldTypeBigInteger":
        t = "long"
    elif field_type == "esriFieldTypeSingle":
        # The precision of floats is limited, so converting to/from numpy will clean it up.
        import numpy as np

        if not isinstance(val, int):
            val = str(np.float32(val))
        t = "float"
    elif field_type == "esriFieldTypeDouble":
        t = "double"
    elif field_type == "esriFieldTypeString":
        t = "string"
        val = val or None
    elif field_type in ("esriFieldTypeDate", "esriFieldTypeDateOnly", "esriFieldTypeTimeOnly"):
        t = "dateTime"
        val = to_datetime_str(val)
    elif field_type == "esriFieldTypeTimestampOffset":
        from datetime import datetime

        # %z returns ±HHMM, which we can split into the hours and minutes offset
        offset = datetime.fromisoformat(val).strftime("%z")
        return E(
            tag,
            make_type("TimestampOffset", "esri"),
            E.Timestamp(to_datetime_str(val)),
            E.HoursOffset(int(offset[:3])),
            E.MinutesOffset(int(offset[3:])),
        )
    else:
        t = None

    return E(tag, val, make_type(t, "xs") if t else {})


def create_extent(data: dict) -> "Element":
    box = []
    for tag in ("XMin", "YMin", "XMax", "YMax", "ZMin", "ZMax", "MMin", "MMax"):
        # X/Y default to NaN. If Z/M are missing, then they aren't serialized.
        if (key := tag.casefold()) not in data and tag.startswith(("Z", "M")):
            continue
        box.append(E(tag, "NaN" if (value := data.get(key)) is None else value))
    return E.Extent(
        make_type("EnvelopeN", "esri"),
        *box,
        create_sr(data["spatialReference"]),
    )


def create_sr(data: dict) -> "Element":
    from ..common import create_spatial_reference

    sr = create_spatial_reference(data)

    xy = sr.falseOriginAndUnits.split(" ")
    z = sr.ZFalseOriginAndUnits.split(" ")
    m = sr.MFalseOriginAndUnits.split(" ")
    wkt = sr.exportToString()

    return E.SpatialReference(
        make_type(f"{sr.type}CoordinateSystem", "esri"),
        None if sr.type == "Unknown" else E.WKT(wkt[: wkt.rfind("]") + 1]),  # Extra information
        E.XOrigin(xy[0]),
        E.YOrigin(xy[1]),
        E.XYScale(xy[2]),
        E.ZOrigin(z[0]),
        E.ZScale(z[1]),
        E.MOrigin(m[0]),
        E.MScale(m[1]),
        E.XYTolerance(sr.XYTolerance),
        E.ZTolerance(sr.ZTolerance),
        E.MTolerance(sr.MTolerance),
        E.HighPrecision(sr.isHighPrecision),
        E.WKID(data["wkid"]) if data.get("wkid") else None,
        E.LatestWKID(data["latestWkid"]) if data.get("latestWkid") else None,
        E.VCSWKID(data["vcsWkid"]) if data.get("vcsWkid") else None,
        E.LatestVCSWKID(data["latestVcsWkid"]) if data.get("latestVcsWkid") else None,
    )


def create_property_set(items: list):
    # Property set is a flattened list of key value pairs.
    for i in range(0, len(items), 2):
        key, val = items[i : i + 2]

        xs = value_to_type(val)
        if val == "":
            val = None

        yield E.PropertySetProperty(
            make_type("PropertySetProperty"),
            E.Key(key),
            E.Value(xs, val),
        )


def create_property_sets(tag: str, data: dict):
    return E(
        tag,
        make_type(data["type"]),
        E.PropertyArray(
            make_type("ArrayOfPropertySetProperty"),
            *create_property_set(data["propertySetItems"]),
        ),
    )


def create_names(tag: str, data: list[dict], key: str = "name"):
    return E(
        tag,
        make_type("Names"),
        *(E.Name(d[key]) for d in data),
    )


def create_strings(tag, data: list):
    return E(
        tag,
        make_type("ArrayOfString"),
        *map(E.String, data),
    )
