from functools import cache
from typing import Optional, TYPE_CHECKING

from .helper import *
from ..constants import *

if TYPE_CHECKING:
    from .table import Subtype, Field
    from ..conversion import Workspace

__all__ = [
    "Table",
    "SpatialDataElementBase",
    "DataElementBase",
    "RelationshipClass",
    "FeatureClass",
    "WorkspaceDomain",
    "DomainRange",
    "DomainCodedValue",
    "FeatureDataset",
    "Container",
    "DomainUsage",
]


class TableMeta(BaseMeta):
    """MetaClass that allows table-like elements to compare equally at class definition"""

    def __eq__(cls, other):
        return other is Table or other is FeatureClass or other is RelationshipClass

    def __hash__(cls):
        return 0


class DataElementBase(Base):
    parent: "Workspace"

    NAME = "Name"
    TYPE = "Dataset Type"
    CONTAINER = "Feature Dataset"
    DSID = "Dataset ID"

    HEADER = (
        Header(NAME, "name", json="name"),
        Header(TYPE, "dataset_type", json="datasetType"),
        Header(CONTAINER, "container"),
        Header(DSID, "dataset_id", json="dsId"),
    )

    EDITOR_TRACKING = (
        Header("Editor Tracking Enabled", "et_enabled", json="editorTrackingEnabled"),
        Header("Editor Tracking UTC", "et_utc", json="isTimeInUTC", enum=BooleanType),
        Header("Creator Field", "creator_field", json="creatorFieldName"),
        Header("Create Date Field", "created_field", json="createdAtFieldName"),
        Header("Editor Field", "editor_field", json="lastEditorFieldName"),
        Header("Edit Date Field", "edited_field", json="editedAtFieldName"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        if (dataset_type := data[cls.TYPE]) == "FeatureDataset":
            prefix = "DE"
        else:
            prefix = "esriDT"
        result["datasetType"] = prefix + dataset_type

        return result

    @property
    def qualification(self) -> str:
        """The database and schema qualification"""
        from ..common import get_qualification_prefix

        return get_qualification_prefix(self.name.value)

    @property
    def dataset_type(self) -> str:
        return self._strip("DE", self._strip("esriDT", self._d["datasetType"]))

    @property
    def dataset_id(self) -> int:
        return self._d.get("dsId")

    @property
    def container(self):
        path: str = self._d["catalogPath"]
        s = "\\"
        parts = path.strip(s).split(s)
        if len(parts) == 1:
            return
        return ValueWrapper.new(FeatureDataset, parts[0])

    def _link_field(self, key: str) -> Optional[ValueWrapper]:
        from .table import Field

        if field := self._d.get(f"{key}FieldName"):
            return self.name.extend(Field, field)

    @property
    def creator_field(self) -> Optional[ValueWrapper]:
        return self._link_field("creator")

    @property
    def created_field(self) -> Optional[ValueWrapper]:
        return self._link_field("createdAt")

    @property
    def editor_field(self) -> Optional[ValueWrapper]:
        return self._link_field("lastEditor")

    @property
    def edited_field(self) -> Optional[ValueWrapper]:
        return self._link_field("editedAt")

    @property
    def et_enabled(self) -> bool:
        return self._d.get("editorTrackingEnabled")

    @property
    def et_utc(self) -> Optional[bool]:
        return self._d.get("isTimeInUTC") if self.et_enabled else None


class Container(DataElementBase):
    def __init__(self, data: dict, parent):
        super().__init__(data, parent)

    @classmethod
    def class_name(cls) -> str:
        return "Datasets"

    @property
    def name(self) -> ValueWrapper:
        return ValueWrapper(
            name := super().name.value,
            link=((self.dataset_cls, name),),
        )

    @property
    def dataset_cls(self):
        from ..conversion import Workspace

        dataset_type = self._d["datasetType"].removeprefix("esriDT").removeprefix("DE")
        for cls in Workspace.SORT_ORDER:
            if dataset_type == cls.__name__:
                return cls


class SpatialDataElementBase(DataElementBase):
    # For values that are in the decimal range (-180 < x < 180), show 5 decimal places.
    # For values that are outside of this, show the comma separator and 2 decimal places.
    XY_FMT = "[<-180]#,##.00;[>180]#,##.00;0.00000"
    SPAT_REF = "Spatial Reference"

    Z_MIN = "Z-Min"
    Z_MAX = "Z-Max"
    M_MIN = "M-Min"
    M_MAX = "M-Max"

    HEADER = (
        Header(SPAT_REF, "spatial_reference", json="spatialReference"),
        Header("X-Min", "x_min", json="xmin"),
        Header("X-Max", "x_max", json="xmax"),
        Header("Y-Min", "y_min", json="ymin"),
        Header("Y-Max", "y_max", json="ymax"),
        Header(Z_MIN, "z_min", json="zmin"),
        Header(Z_MAX, "z_max", json="zmax"),
        Header(M_MIN, "m_min", json="mmin"),
        Header(M_MAX, "m_max", json="mmax"),
    )

    def __init__(self, data: dict, parent):
        super().__init__(data, parent)

        self._sr = ...

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        # Z/M are only serialized when the class is both aware and non-empty.
        empty = result["xmin"] is None
        has_m = not empty and result.get("hasM", False)
        has_z = not empty and result.get("hasZ", False)
        has_z |= result.get("datasetType") == esriDatasetType.esriDTUtilityNetwork.name
        null = "NaN" if empty else None  # Empty classes serialize X/Y as NaN.

        # Move extent keys from root into new extent object.
        extent = result["extent"] = dict(spatialReference=result["spatialReference"])
        for key in ("xmin", "ymin", "xmax", "ymax", "zmin", "zmax", "mmin", "mmax"):
            if (val := result.pop(key, None)) is None:
                val = null
            if (key.startswith("z") and not has_z) or (key.startswith("m") and not has_m):
                continue
            extent[key] = val

        return result

    @property
    def spatial_reference(self):
        if self._sr is not Ellipsis:
            return self._sr
        from ..conversion import SpatialReference

        if i := self._d.get("spatial_reference_id"):
            self._sr = ValueWrapper(i, link=((SpatialReference, i), ()))
        else:
            self._sr = None
        return self._sr

    def _extent(self, key: str):
        return ValueWrapper(self._nan(self._d.get("extent", {}).get(key, "NaN")), format=self.XY_FMT)

    @property
    def x_min(self) -> ValueWrapper:
        return self._extent("xmin")

    @property
    def y_min(self) -> ValueWrapper:
        return self._extent("ymin")

    @property
    def z_min(self) -> ValueWrapper:
        return self._extent("zmin")

    @property
    def m_min(self) -> ValueWrapper:
        return self._extent("mmin")

    @property
    def x_max(self) -> ValueWrapper:
        return self._extent("xmax")

    @property
    def y_max(self) -> ValueWrapper:
        return self._extent("ymax")

    @property
    def z_max(self) -> ValueWrapper:
        return self._extent("zmax")

    @property
    def m_max(self) -> ValueWrapper:
        return self._extent("mmax")


class FeatureDataset(SpatialDataElementBase, DataElementBase):
    SHEET_PREFIX = "FD"
    HEADER = (
        *DataElementBase.HEADER,
        Header("# of Children", "children_count"),
        *SpatialDataElementBase.HEADER,
    )

    def __init__(self, data: dict, parent):
        super().__init__(data, parent)

    @property
    def children_count(self) -> int:
        return len(self._d["datasets"])

    def children(self) -> MockCollection:
        return self._make(Container, [d for d in self._d["datasets"] if d]).as_mock()

    def _ordered(self) -> list["BaseCollection"]:
        order = [
            self.children(),
        ]
        return order


class Table(DataElementBase, metaclass=TableMeta):
    SHEET_PREFIX = "T"

    CATALOG = "Catalog ID"
    CLS_ID = "Class ID"
    EXT_CLS_ID = "Extension Class ID"
    DEFAULT_SUBTYPE = "Default Subtype"

    TABLE_HEADER = (
        Header("Minimum Client Version", "version", json="requiredGeodatabaseClientVersion"),
        Header("Alias", "alias", json="aliasName"),
        Header("OID Field", "oid_field", json="oidFieldName"),
        Header("GlobalID Field", "globalid_field", json="globalIdFieldName"),
        Header("Subtype Field", "subtype_field", json="subtypeFieldName"),
        Header(DEFAULT_SUBTYPE, "default_subtype", json="defaultSubtypeCode"),
        *DataElementBase.EDITOR_TRACKING,
    )
    TABLE_SUFFIX = (
        Header(CATALOG, "catalog_id", json="catalogID"),
        Header(CLS_ID, "class_id", json="clsId"),
        Header(EXT_CLS_ID, "ext_class_id", json="extClsId"),
    )
    HEADER = (
        *DataElementBase.HEADER,
        *TABLE_HEADER,
        *TABLE_SUFFIX,
    )

    def __init__(self, data: dict, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        from uuid import uuid4

        result = super().to_json(data)

        result.update(
            canVersion=False,
            changeTracked=False,
            configurationKeyword="",
            fieldFilteringEnabled=False,
            hasGlobalID=bool(result["globalIdFieldName"]),
            hasOID=bool(result["oidFieldName"]),
            hasOID64=False,
            modelName="",
            rasterFieldName="",
            replicaTracked=False,
            versioned=False,
        )

        # Set defaults
        for key, new in [
            ("aliasName", ""),
            ("createdAtFieldName", ""),
            ("creatorFieldName", ""),
            ("editedAtFieldName", ""),
            ("globalIdFieldName", ""),
            ("isTimeInUTC", True),
            ("lastEditorFieldName", ""),
            ("extClsId", ""),
            ("clsId", ""),
            ("oidFieldName", ""),
        ]:
            if result[key] is None:
                result[key] = new

        for key in (
            "subtypeFieldName",
            "defaultSubtypeCode",
        ):
            if result[key] is None:
                result.pop(key)

        # Populate catalogID/ClassID if blank.
        if not result["catalogID"]:
            result["catalogID"] = f"{{{uuid4()}}}".upper()
        if not result["clsId"]:
            dataset_type = result["datasetType"]
            if dataset_type == esriDatasetType.esriDTFeatureClass.name:
                result["clsId"] = "{52353152-891A-11D0-BEC6-00805F7C4268}"
            elif dataset_type == esriDatasetType.esriDTTable.name:
                result["clsId"] = "{7A566981-C114-11D2-8A28-006097AFF44E}"

        return result

    @property
    def version(self):
        return self._d.get("requiredGeodatabaseClientVersion")

    @property
    def alias(self) -> str:
        return self._d.get("aliasName")

    def _pre_ordered(self) -> list["MockCollection"]:
        return [
            *super()._pre_ordered(),
            self.extension_properties(),
            self.controller_membership(),
            self.relationship_classes(),
        ]

    def _ordered(self) -> list[BaseCollection]:
        order = [
            self.fields(),
            self.indexes(),
            self.subtypes(),
            self.subtype_infos(),
            self.attribute_rules(),
        ]
        return order

    def get_subtype(self, code: int) -> Optional["Subtype"]:
        sub: "Subtype"
        for sub in self.subtypes().elements:
            if sub.code == code:
                return sub

    def get_field(self, name: str) -> Optional["Field"]:
        if not name:
            return

        field: "Field"
        name = name.casefold()
        for field in self.fields().elements:
            if field.name.value.casefold() == name:
                return field

    @cache
    def fields(self) -> BaseCollection:
        from .table import Field

        return self._make(Field, self._d.get("fields", {}).get("fieldArray", []))

    @cache
    def indexes(self) -> BaseCollection:
        from .table import Index

        return self._make(Index, self._d.get("indexes", {}).get("indexArray", []))

    @cache
    def subtypes(self) -> BaseCollection:
        from .table import Subtype

        return self._make(Subtype, self._d.get("subtypes", []))

    @cache
    def subtype_infos(self) -> BaseCollection:
        from .table import SubtypeFieldInfo

        return self._make(SubtypeFieldInfo, (e.field_infos() for e in self.subtypes()), merge=True)

    def attribute_rules(self) -> BaseCollection:
        from .table import AttributeRule

        return self._make(AttributeRule, self._d.get("attributeRules", []))

    def extension_properties(self) -> MockCollection:
        prop = self._property_set(self._d.get("extensionProperties", {}))
        return MockCollection(
            header=["Key", "Value"],
            elements=list(prop.items()),
            cls_name="ExtensionProperties",
        )

    def controller_membership(self) -> MockCollection:
        from .. import conversion

        key_lookup = conversion.controller_keys()
        data = []
        for membership in self._d.get("controllerMemberships", []):
            for k, v in membership.items():
                if cls := key_lookup.get(k):  # Create link from controller name to controller object.
                    v = ValueWrapper.new(cls, self.qualification + v)

                data.append([k, v])

        return MockCollection(
            header=["Key", "Value"],
            elements=data,
            cls_name="ControllerMembership",
        )

    def get_controller_info(self, cls: type[BaseType]) -> dict:
        from .. import conversion

        key = {v: k for k, v in conversion.controller_keys().items()}[cls]  # Convert class to key name.

        for membership in self._d.get("controllerMemberships", []):
            if key in membership:
                return membership
        return {}

    def relationship_classes(self) -> BaseCollection:
        rc_names = [dict(name=n) for n in self._d.get("relationshipClassNames", {}).get("names", [])]
        return self._make(RelationshipClassNames, rc_names)

    @property
    def oid_field(self) -> Optional[ValueWrapper]:
        return self._link_field("oid")

    @property
    def globalid_field(self) -> Optional[ValueWrapper]:
        return self._link_field("globalId")

    @property
    def subtype_field(self) -> Optional[ValueWrapper]:
        return self._link_field("subtype")

    @property
    def length_field(self) -> Optional[ValueWrapper]:
        return self._link_field("length")

    @property
    def area_field(self) -> Optional[ValueWrapper]:
        return self._link_field("area")

    @property
    def catalog_id(self) -> str:
        return self._d.get("catalogID")

    @property
    def class_id(self) -> str:
        return self._d["clsId"]

    @property
    def ext_class_id(self) -> str:
        return self._d["extClsId"]

    @property
    def default_subtype(self):
        if (code := self._d.get("defaultSubtypeCode")) is None:
            return
        if sub := self.get_subtype(code):
            return sub.name.as_link()


class FeatureClass(SpatialDataElementBase, Table):
    SHEET_PREFIX = "FC"
    HEADER = (
        *DataElementBase.HEADER,
        Header("Geometry Type", "shape_type", json="shapeType", enum=esriGeometryType),
        Header("Feature Type", "feature_type", json="featureType", enum=esriFeatureType),
        Header("Z-Aware", "has_z", json="hasZ", enum=BooleanType),
        Header("M-Aware", "has_m", json="hasM", enum=BooleanType),
        Header("Split Model", "split_model", json="splitModel", enum=esriSplitModel),
        *Table.TABLE_HEADER,
        Header("Shape Field", "shape_field", json="shapeFieldName"),
        *SpatialDataElementBase.HEADER,
        *Table.TABLE_SUFFIX,
    )

    def __init__(self, data: dict, parent):
        super().__init__(data, parent)

    @property
    def shape_field(self) -> Optional[ValueWrapper]:
        return self._link_field("shape")

    @property
    def shape_type(self) -> str:
        return self._d["shapeType"]

    @property
    def feature_type(self) -> str:
        return self._d["featureType"]

    @property
    def has_z(self) -> bool:
        return self._d["hasZ"]

    @property
    def has_m(self) -> bool:
        return self._d["hasM"]

    @property
    def has_spatial_index(self) -> bool:
        return self._d["hasSpatialIndex"]

    @property
    def split_model(self) -> str:
        return self._d.get("splitModel")


class RelationshipClassNames(Base):
    # TODO: remove self.rc is None checks when the element is serialized.
    HEADER = (
        Header("Name", "name", json="name"),
        Header("Role", "role"),
        Header("Related To", "related_to"),
        Header("Cardinality", "cardinality"),
        Header("Type", "type"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)
        self.rc = self.get_gdb().get_child(RelationshipClass, self._d["name"])

    @property
    def name(self) -> ValueWrapper:
        if self.rc is None:
            return ValueWrapper(self._d["name"])
        return self.rc.name.as_link()

    @property
    def role(self) -> str:
        if self.rc is None:
            return
        return "Origin" if self.is_origin() else "Destination"

    def is_origin(self) -> bool:
        if self.rc is None:
            return
        return self.parent.name.value == self.rc.origin.value

    @property
    def related_to(self):
        if self.rc is None:
            return
        return self.rc.destination if self.is_origin() else self.rc.origin

    @property
    def cardinality(self):
        if self.rc is None:
            return
        return self.rc.cardinality

    @property
    def type(self):
        if self.rc is None:
            return
        return self.rc.type


class RelationshipClass(Table):
    SHEET_PREFIX = "RC"

    ATTACH = "Is Attachment"
    ATTRIBUTED = "Is Attributed"

    HEADER = (
        *DataElementBase.HEADER,
        Header("Type", "type", json="isComposite"),
        Header("Cardinality", "cardinality", json="cardinality", enum=esriRelCardinality),
        Header("Notification", "message_notification", json="notification", enum=esriRelNotification),
        Header(ATTACH, "is_attachment", json="isAttachmentRelationship", enum=BooleanType),
        Header(ATTRIBUTED, "is_attributed", json="isAttributed", enum=BooleanType),
        Header("Origin Name", "origin", json="origin"),
        Header("Origin Primary Key", "origin_primary", json="OriginPrimary"),
        Header("Origin Foreign Key", "origin_foreign", json="OriginForeign"),
        Header("Destination Name", "destination", json="destination"),
        Header("Destination Primary Key", "destination_primary", json="DestinationPrimary"),
        Header("Destination Foreign Key", "destination_foreign", json="DestinationForeign"),
        Header("Forward Path Label", "forward_label", json="forwardPathLabel"),
        Header("Backward Path Label", "backward_label", json="backwardPathLabel"),
        Header("Split Policy", "split_policy", enum=esriRelationshipSplitPolicy),
        *Table.TABLE_HEADER,
        *Table.TABLE_SUFFIX,
    )

    def __init__(self, data: dict, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result.update(
            isReflexive=False,
            classKey="esriRelClassKeyUndefined",
            keyType="esriRelKeyTypeSingle",
        )

        result["isComposite"] = result["isComposite"] == "Composite"

        # Move keys from root to expected data structure.
        for key in ("origin", "destination"):
            result[f"{key}ClassNames"] = [dict(name=result.pop(key))]

            primary = result.pop(pk := f"{key.title()}Primary")
            foreign = result.pop(fk := f"{key.title()}Foreign")
            if primary and foreign:
                result[f"{key}ClassKeys"] = [
                    {
                        "datasetType": "RelationshipClassKey",
                        "objectKeyName": field,
                        "classKeyName": "",
                        "keyRole": f"esriRelKeyRole{role}",
                    }
                    for field, role in [(primary, pk), (foreign, fk)]
                ]

        return result

    @property
    def cardinality(self) -> str:
        return self._d["cardinality"]

    @property
    def message_notification(self) -> str:
        return self._d["notification"]

    @property
    def origin(self) -> ValueWrapper:
        return ValueWrapper.new(Table, self._d["originClassNames"][0]["name"])

    @property
    def destination(self) -> ValueWrapper:
        return ValueWrapper.new(Table, self._d["destinationClassNames"][0]["name"])

    def _get_key(self, origin: bool, primary: bool):
        from .table import Field

        origin_key = "origin" if origin else "destination"
        primary_key = "Primary" if primary else "Foreign"
        for key in self._d.get(f"{origin_key}ClassKeys", []):
            if key["keyRole"].endswith(primary_key):
                field = key["objectKeyName"]
                break
        else:  # no break
            return

        # Find the proper table (origin/destination/self) based on keyType.
        if origin:
            if primary:
                table_ref = self.origin
            else:
                table_ref = None if self.supports_records() else self.destination
        else:
            if primary:
                table_ref = self.destination
            else:
                table_ref = None

        if table_ref is None:
            link = self.name
        else:
            link = table_ref

        return link.extend(Field, field)

    @property
    def origin_primary(self):
        return self._get_key(True, True)

    @property
    def origin_foreign(self):
        return self._get_key(True, False)

    @property
    def destination_primary(self):
        return self._get_key(False, True)

    @property
    def destination_foreign(self):
        return self._get_key(False, False)

    @property
    def forward_label(self) -> str:
        return self._d["forwardPathLabel"]

    @property
    def backward_label(self) -> str:
        return self._d["backwardPathLabel"]

    @property
    def is_attributed(self) -> bool:
        return self._d["isAttributed"]

    @property
    def is_composite(self) -> bool:
        return self._d["isComposite"]

    @property
    def type(self):
        return "Composite" if self.is_composite else "Simple"

    @property
    def is_attachment(self) -> bool:
        return self._d["isAttachmentRelationship"]

    @property
    def split_policy(self):
        return self._d.get("splitPolicy")

    def supports_records(self) -> bool:
        """Whether the relationship class is backed by a table"""
        return self.is_attributed or self._d["cardinality"].endswith("ManyToMany")

    def rules(self) -> BaseCollection:
        from .table import RelationshipClassRule

        return self._make(RelationshipClassRule, self._d["relationshipRules"])

    def _ordered(self) -> list[BaseCollection]:
        return [
            *super()._ordered(),
            self.rules(),
        ]


class WorkspaceDomain(Base):
    SHEET_PREFIX = "D"
    OWNER = "Owner"
    DOMAIN_NAME = "Domain Name"
    TYPE = "Domain Type"
    FIELD = "Field Type"
    MERGE = "Merge Policy"
    SPLIT = "Split Policy"
    DESCRIPTION = "Description"
    NUMBER_CODES = "# of Codes"
    NUMBER_ASSIGNMENTS = "# of Assignments"

    HEADER = (
        Header(OWNER, "owner"),
        Header(DOMAIN_NAME, "name", json="name"),
        Header(DESCRIPTION, "description", json="description"),
        Header(FIELD, "field_type", json="fieldType", enum=esriFieldTypeDomain),
        Header(TYPE, "domain_type", json="type", enum=esriDomainType),
        Header(SPLIT, "split_policy", json="splitPolicy", enum=esriSplitPolicyType),
        Header(MERGE, "merge_policy", json="mergePolicy", enum=esriMergePolicyType),
        Header(NUMBER_CODES, "code_count"),
        Header(NUMBER_ASSIGNMENTS, "assignment_count"),
    )

    @classmethod
    def class_name(cls) -> str:
        return "Domain"

    @classmethod
    def to_json(cls, data) -> dict:
        result = super().to_json(data)

        if result["description"] is None:
            result["description"] = ""
        if result["type"] == esriDomainType.esriDTCodedValue.name:
            result["type"] = "codedValue"
        else:
            result["type"] = "range"

        return result

    @property
    def description(self) -> str:
        return self._d["description"]

    @property
    def owner(self) -> Optional[str]:
        return self._d.get("owner")

    @property
    def domain_type(self) -> str:
        return self._d["type"]

    @property
    def field_type(self) -> str:
        return self._d["fieldType"]

    @property
    def merge_policy(self) -> str:
        return self._d["mergePolicy"]

    @property
    def split_policy(self) -> str:
        return self._d["splitPolicy"]

    def is_range(self) -> bool:
        return self.domain_type.casefold() == "range"

    @property
    def code_count(self) -> Optional[int]:
        return None if self.is_range() else len(self._d.get("codedValues", []))

    @property
    def assignment_count(self) -> int:
        return len(self._d["usage"])

    def coded_values(self) -> BaseCollection:
        return BaseCollection(DomainCodedValue, self._zip(self, self._d.get("codedValues", [])))

    def range(self) -> BaseCollection:
        return BaseCollection(
            DomainRange,
            self._zip(self, ({"min": x, "max": y} for x, y in [self._d.get("range", [])])),
        )

    def usage(self) -> BaseCollection:
        return self._make(DomainUsage, self._d["usage"])

    def as_collection(self):
        return self.range() if self.is_range() else self.coded_values()

    def _count(self, collections: list["Collection"]):
        return  # No need to count domains since they only have a few properties

    def _ordered(self) -> list[BaseCollection]:
        return [
            self.as_collection(),
            self.usage(),
        ]


class DomainRange(Base):
    DOMAIN_NAME = "Domain Name"
    MIN = "Minimum"
    MAX = "Maximum"

    HEADER = (
        Header(MIN, "minimum"),
        Header(MAX, "maximum"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> list:
        return [data[cls.MIN], data[cls.MAX]]

    @property
    def name(self) -> str:
        return self.parent.name

    @property
    def minimum(self):
        return self._d["min"]

    @property
    def maximum(self):
        return self._d["max"]


class DomainCodedValue(Base):
    DOMAIN_NAME = "Domain Name"
    NAME = "Description"
    CODE = "Code"

    HEADER = (
        Header(CODE, "code", json="code"),
        Header(NAME, "name", json="name"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def domain_name(self) -> str:
        return self.parent.name

    @property
    def name(self) -> str:
        return self._d["name"]

    @property
    def code(self):
        return self._d["code"]


class DomainUsage(Base):
    DATASET = "Dataset"
    CODE = "Subtype Code"
    NAME = "Subtype Name"
    FIELD = "Field Name"

    HEADER = (
        Header(DATASET, "dataset"),
        Header(CODE, "code"),
        Header(NAME, "subtype_name"),
        Header(FIELD, "field"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def domain_name(self) -> str:
        return self.parent.name

    @property
    def dataset(self) -> ValueWrapper:
        return self._d["tableName"]

    @property
    def code(self) -> Optional[int]:
        return self._d["subtypeCode"]

    @property
    def subtype_name(self) -> Optional[str]:
        return self._d["subtypeName"]

    @property
    def field(self) -> str:
        return self._d["fieldName"]
