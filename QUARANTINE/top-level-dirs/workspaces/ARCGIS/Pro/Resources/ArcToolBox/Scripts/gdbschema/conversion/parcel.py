from typing import TYPE_CHECKING

from .helper import *
from .workspace import DataElementBase, FeatureClass
from ..constants import *

if TYPE_CHECKING:
    from datetime import datetime

__all__ = [
    "ParcelFabric",
]


class ParcelType(Base):
    parent: "ParcelFabric"

    PARCEL_TYPE = "Parcel Type"
    POLYGON_CLASS = "Polygon Class"
    LINE_CLASS = "Line Class"
    IS_LARGE = "Is Administrative"

    HEADER = (
        Header(PARCEL_TYPE, "parcel_type", json="parcelTypeName"),
        Header(POLYGON_CLASS, "polygon", json="polygonClassId"),
        Header(LINE_CLASS, "line", json="lineClassId"),
        Header(IS_LARGE, "is_large", json="isLarge"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent, name="parcelTypeName")

    @property
    def parcel_type(self) -> str:
        return self._d["parcelTypeName"]

    @property
    def polygon(self):
        return self.get_gdb().get_child(FeatureClass, self._d["polygonClassId"]).name.as_link()

    @property
    def line(self):
        return self.get_gdb().get_child(FeatureClass, self._d["lineClassId"]).name.as_link()

    @property
    def is_large(self) -> bool:
        return self._d["isLarge"]


class ParcelFabric(DataElementBase):
    SHEET_PREFIX = "PF"
    MAJOR_VERSION = "Version"
    MINOR_VERSION = "Minor Version"
    TOPOLOGY = "Topology Enabled"
    MAX_BUILD = "Maximum Parcel # for Build"
    MAX_VALIDATE = "Maximum Parcel # for Validate"
    CREATION_TIME = "Creation Time"
    MODIFIED_TIME = "Modified Time"
    MAX_COUNT = "Maximum Parcel # for Record Shape"

    HEADER = (
        *DataElementBase.HEADER,
        Header(MAJOR_VERSION, "major_version", json="version"),
        Header(MINOR_VERSION, "minor_version", json="minorVersion"),
        Header(TOPOLOGY, "enabled", json="topologyEnabled", enum=BooleanType),
        Header(CREATION_TIME, "creation_time", json="parcelFabricCreatedTime"),
        Header(MODIFIED_TIME, "modified_time", json="parcelFabricLastModifiedTime"),
        Header(MAX_BUILD, "max_build", json="maximumNumberOfParcelsForBuild"),
        Header(MAX_VALIDATE, "max_validate", json="maximumNumberOfParcelsForValidate"),
        Header(MAX_COUNT, "max_count", json="maximumParcelCountForRecordShape"),
        Header("Geodatabase Topology", "topology_class", json="topology"),
        Header("Record Class", "record_class", json="recordClassId"),
        Header("Point Class", "point_class", json="pointClassId"),
        Header("Connection Class", "connection_class", json="connectionClassId"),
        Header("Adjustment Point Class", "adj_point_class", json="adjustmentPointClassId"),
        Header("Adjustment Line Class", "adj_line_class", json="adjustmentLineClassId"),
        Header("Adjustment Vector Class", "adj_vector_class", json="adjustmentVectorClassId"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def upgrade(cls, data: dict):
        # Pro 3.2 did not have DE Base exported.
        for header in DataElementBase.HEADER:
            if header.label not in data:
                data[header.label] = None

        data[DataElementBase.TYPE] = "ParcelDataset"

    @classmethod
    def to_json(cls, data: dict):
        result = super().to_json(data)

        result.update(
            changeTracked=False,
            configurationKeyword="",
            replicaTracked=False,
            versioned=False,
        )

        return result

    @property
    def major_version(self) -> int:
        return self._d["version"]

    @property
    def minor_version(self) -> int:
        return self._d["minorVersion"]

    @property
    def enabled(self) -> bool:
        return self._d["topologyEnabled"]

    @property
    def creation_time(self) -> "datetime":
        return self._time(self._d["parcelFabricCreatedTime"])

    @property
    def modified_time(self) -> "datetime":
        return self._time(self._d["parcelFabricLastModifiedTime"])

    @property
    def max_build(self) -> int:
        return self._d["maximumNumberOfParcelsForBuild"]

    @property
    def max_validate(self) -> int:
        return self._d["maximumNumberOfParcelsForValidate"]

    @property
    def max_count(self) -> int:
        return self._d["maximumParcelCountForRecordShape"]

    def _get_class(self, key, cls: type[BaseType] = FeatureClass):
        if child := self.get_gdb().get_child(cls, k := self._d[key]):
            return child.name.as_link()
        return k

    @property
    def topology_class(self):
        from .topology import Topology

        return self._get_class("topology", cls=Topology)

    @property
    def record_class(self):
        return self._get_class("recordClassId")

    @property
    def point_class(self):
        return self._get_class("pointClassId")

    @property
    def connection_class(self):
        return self._get_class("connectionClassId")

    @property
    def adj_point_class(self):
        return self._get_class("adjustmentPointClassId")

    @property
    def adj_line_class(self):
        return self._get_class("adjustmentLineClassId")

    @property
    def adj_vector_class(self):
        return self._get_class("adjustmentVectorClassId")

    def parcel_types(self) -> BaseCollection:
        return self._make(ParcelType, self._d["parcelTypes"])

    def _ordered(self) -> list["BaseCollection"]:
        return [
            self.parcel_types(),
        ]
