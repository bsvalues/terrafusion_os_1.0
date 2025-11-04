from typing import Optional, TYPE_CHECKING, Type, Union

from .helper import *
from .locref import *
from .network import *
from .parcel import *
from .topology import *
from .workspace import *
from ..constants import *

if TYPE_CHECKING:
    from datetime import datetime

__all__ = [
    "create_workspace",
    "Workspace",
    "SpatialReference",
]


def controller_keys() -> dict[str, type[BaseType]]:
    """Controller membership keys mapped to their corresponding class"""
    return {
        "utilityNetworkName": UtilityNetwork,
        "traceNetworkName": TraceNetwork,
        "parcelDatasetName": ParcelFabric,
        "topologyName": Topology,
        "datasetName": LocationReferencingDataset,
    }


def create_workspace(json_file: str) -> "Workspace":
    from ..common import load_json

    with open(json_file, "r", encoding="utf-8") as f:
        payload = load_json(f)

    return Workspace(payload)


def convert_url(rows):
    return [[to_url(r) for r in row] for row in rows]


class SpatialReference(Base):
    ID = "Unique ID"
    WKT = "Well Known Text"

    HEADER = (
        Header(ID, "num"),
        Header("Display", "name"),
        Header("Factory Code", "sr.factoryCode"),
        Header("Vertical Factory Code", "z_code"),
        Header(WKT, "wkt"),
    )

    def __init__(self, data, num: int):
        from ..common import create_spatial_reference

        super().__init__(data)
        self.num = num
        self.sr = create_spatial_reference(self._d)

    @property
    def name(self):
        # Needs empty tuple as second argument so the hyperlink isn't redirected to the root.
        return ValueWrapper(self.display(), anchor=((SpatialReference, self.num), ()))

    @property
    def z_code(self):
        if z := self.sr.VCS:
            return z.factoryCode

    @property
    def wkt(self):
        return self.sr.exportToString()

    def display(self) -> str:
        parts = [self.sr.name]
        if z := self.sr.VCS:
            parts.append(z.name)
        return self.DELIM.join(parts)


class Workspace(Base):
    HEADER = (
        Header("Name", "name", json="name"),
        Header("Workspace Type", "workspace_type", json="workspaceType", enum=esriWorkspaceType),
        Header("Workspace Factory", "workspace_factory", json="workspaceFactoryProgID", enum=esriWorkspaceFactory),
        Header("Geodatabase Release", "release"),
        Header("Date Exported", "timestamp", json="dateExported"),
        Header("Path", "path", json="catalogPath"),
    )

    # This defines our conversion list and how elements will appear.
    SORT_ORDER = (
        FeatureDataset,
        FeatureClass,
        Table,
        RelationshipClass,
        LocationReferencingDataset,
        ParcelFabric,
        Topology,
        TraceNetwork,
        UtilityNetwork,
        WorkspaceDomain,
    )

    def __init__(self, data: dict):
        super().__init__(data)
        self._virtualize_workspace()

        self.spatial_references: list[SpatialReference] = []
        self.datasets: list[DataElementBase] = list(self._convert(self._d.get("datasets", [])))
        self._add_keys()
        self._replace_values()

        self.domains = self._make(WorkspaceDomain, data.get("domains", []))

    @classmethod
    def to_json(cls, data: dict) -> dict:
        import pathlib
        from ..date_utils import to_datetime_str

        result = super().to_json(data)

        result["workspaceFactoryProgID"] = f"esriDataSourcesGDB.{result['workspaceFactoryProgID']}"
        result["dateExported"] = to_datetime_str(data["Date Exported"])
        result["catalogPath"] = pathlib.Path(result["catalogPath"]).joinpath(result["name"]).as_posix()

        return result

    def _virtualize_workspace(self):
        """Creates a virtual workspace if a child was exported"""
        if "workspaceType" in self._d:
            return

        self._d = dict(
            dateExported=self._d.pop("dateExported"),
            catalogPath="",
            workspaceType="",
            workspaceFactoryProgID=".",
            datasets=[self._d],
        )

    def _add_keys(self):
        """Adds keys to ease downstream lookups"""

        self._domain_assignments()
        self._subtype_field_info()

    def _replace_values(self):
        """Changes key:value pairs"""

        self._convert_date_values()

    def _convert_date_values(self):
        """Converts datetime values (integers) to ISO-8601 strings"""
        from ..constants import esriFieldTypeDomain
        from ..date_utils import to_datetime_str
        from datetime import datetime

        datetime_field = esriFieldTypeDomain.esriFieldTypeDate.name
        date_field = esriFieldTypeDomain.esriFieldTypeDateOnly.name
        time_field = esriFieldTypeDomain.esriFieldTypeTimeOnly.name
        date_like = {datetime_field, date_field, time_field}

        # Convert workspace domains.
        for domain in self._d.get("domains", []):
            if domain["fieldType"] != datetime_field:
                continue

            if domain["type"] == "range":
                domain["range"] = [to_datetime_str(val) for val in domain["range"]]
            else:
                for row in domain["codedValues"]:
                    row["code"] = to_datetime_str(row["code"])

        tables = []
        for dataset in self._d.get("datasets", []):
            tables.append(dataset)
            tables.extend(dataset.get("datasets", []))

        for table in tables:
            field_type_lookup = {}

            # Convert field default values.
            for field in table.get("fields", {}).get("fieldArray", []):
                if field["type"] in date_like:
                    field_type_lookup[field["name"].casefold()] = field["type"]
                    if "defaultValue" in field and field["type"] == datetime_field:
                        field["defaultValue"] = to_datetime_str(field["defaultValue"])

            # Convert subtype assignment.
            for subtype in table.get("subtypes", []):
                for info in subtype["fieldInfos"]:
                    if "defaultValue" not in info:
                        continue

                    if field_type := field_type_lookup.get(info["fieldName"].casefold()):
                        if not (date_str := to_datetime_str(info["defaultValue"])):
                            continue

                        # Date like fields are all stored as integers (unlike domains and field assignments).
                        date_val = datetime.fromisoformat(date_str)
                        if field_type == date_field:
                            date_val = date_val.date()
                        elif field_type == time_field:
                            date_val = date_val.time()
                        info["defaultValue"] = date_val.isoformat()

    def _subtype_field_info(self):
        """Adds reference to all fields in subtype field info"""
        from .table import Field

        skip_types = {
            "esriFieldTypeOID",
            "esriFieldTypeGeometry",
            "esriFieldTypeBlob",
            "esriFieldTypeRaster",
            "esriFieldTypeGlobalID",
            "esriFieldTypeXML",
            "esriFieldTypeTimestampOffset",
        }
        skip_keys = (
            "creatorFieldName",
            "createdAtFieldName",
            "lastEditorFieldName",
            "editedAtFieldName",
            "lengthFieldName",
            "areaFieldName",
        )

        for dataset in self.datasets:
            if not isinstance(dataset, (Table, FeatureClass, RelationshipClass)):
                continue

            # Build up a list of all fields that can support domains/default values.
            skip_names = {dataset._d.get(skip, "").casefold() for skip in skip_keys}
            all_fields = []
            field: Field
            for field in dataset.fields():
                name: str = field._d["name"]
                if field._d["type"] in skip_types or (name_lower := name.casefold()) in skip_names:
                    continue
                all_fields.append((name_lower, dict(fieldName=name)))

            for subtype in dataset._d.get("subtypes", []):
                field_infos: list[dict] = subtype.get("fieldInfos", [])
                subtype_fields = {info["fieldName"].casefold() for info in field_infos}
                for fold, original in all_fields:
                    if fold not in subtype_fields:
                        field_infos.append(original)

    def _domain_assignments(self):
        """Domain assignments across all tables"""
        lookup = {}
        keys = ["tableName", "subtypeCode", "subtypeName", "fieldName"]
        for domain, *values in self._domain_usage():
            lookup.setdefault(str(domain).casefold(), []).append(dict(zip(keys, values)))

        for domain_dict in self._d.get("domains", []):
            domain_dict["usage"] = lookup.get(domain_dict["name"].casefold(), [])

    @property
    def path(self) -> str:
        import os

        if not (path := self._d["catalogPath"]).casefold().startswith("http"):
            return os.path.dirname(path)
        return path

    @property
    def timestamp(self) -> "datetime":
        from datetime import datetime

        return datetime.fromisoformat(self._d["dateExported"])

    @property
    def workspace_type(self) -> str:
        return self._d["workspaceType"]

    @property
    def workspace_factory(self) -> str:
        # Parse out the portion of  the namespace that matches the enum.
        return self._d["workspaceFactoryProgID"].split(".")[1]

    def _version(self, key: str) -> Optional[int]:
        if (version := self._d.get(f"{key}Version", -1)) != -1:
            return version

    @property
    def major(self):
        return self._version("major")

    @property
    def minor(self):
        return self._version("minor")

    @property
    def bug_fix(self):
        return self._version("bugfix")

    @property
    def release(self) -> Optional[str]:
        if not self.major:
            return

        return ".".join(map(str, (r or 0 for r in (self.major, self.minor, self.bug_fix))))

    def properties(self):
        return super().properties("Workspace Properties")

    def _collection(self, cls: type[Base], prop_name: str):
        data = []
        for dataset in self.datasets:
            for element in getattr(dataset, prop_name, lambda: [])():
                data.append([dataset.name, *element.to_list()[0]])

        return MockCollection(
            header=["Dataset", *cls.header()],
            elements=convert_url(data),
            cls=cls,
        )

    def _domain_collection(self, range_domains: bool):
        data = []
        domain: WorkspaceDomain
        for domain in self.domains:
            if range_domains and domain.is_range():
                rows = domain.range()
            elif not range_domains and not domain.is_range():
                rows = domain.coded_values()
            else:
                continue
            data.extend([domain.name, *r] for r in rows.to_list())

        cls = DomainRange if range_domains else DomainCodedValue
        return MockCollection(
            header=[WorkspaceDomain.DOMAIN_NAME, *cls.header()],
            elements=convert_url(data),
            cls=cls,
        )

    def dataset_collection(self) -> MockCollection:
        return self._make(Container, [d._d for d in self.datasets]).as_mock()

    def _domain_usage(self):
        from .table import Field, SubtypeFieldInfo

        for dataset in self.datasets:
            if not isinstance(dataset, (Table, FeatureClass, RelationshipClass)):
                continue

            dataset_name = dataset.name.as_link()

            field: Field
            for field in dataset.fields():
                if field_domain := field.domain:
                    yield field_domain.as_link(), dataset_name, None, None, field.name.as_link()

            subtype: SubtypeFieldInfo
            for subtype in dataset.subtype_infos():
                if subtype_domain := subtype.domain:
                    yield subtype_domain.as_link(), dataset_name, subtype.code, subtype.name, subtype.field.as_link()

    def domain_usage(self) -> MockCollection:
        return MockCollection(
            header=[WorkspaceDomain.DOMAIN_NAME, *DomainUsage.header()],
            elements=list(self._domain_usage()),
            cls=DomainUsage,
        )

    def mega_count(self) -> MockCollection:
        c = self._count(self.mega())
        return c

    def mega(self) -> list[MockCollection]:
        from .table import Field, Subtype, SubtypeFieldInfo, AttributeRule, Index, RelationshipClassRule

        combo = []

        # Group datasets by type.
        grouped = {}
        for data in self.datasets:
            grouped.setdefault(data.class_name(), []).append(data)
        for cls in self.SORT_ORDER:
            # Table-like and Feature Dataset are always reported, even if empty.
            if (rows := grouped.get(cls.__name__, [] if issubclass(cls, (Table, FeatureDataset)) else None)) is None:
                continue

            combo.append(
                MockCollection(
                    header=cls.header(),
                    elements=convert_url(row.to_list()[0] for row in rows),
                    cls=cls,
                )
            )

        try:  # Put RC rules directly next to RC.
            rc_index = [c.cls.class_name() for c in combo].index(RelationshipClass.class_name())
            combo.insert(rc_index + 1, self._collection(RelationshipClassRule, "rules"))
        except ValueError:
            pass

        combo.extend(
            [
                BaseCollection(SpatialReference, self.spatial_references),
                self._collection(Field, "fields"),
                self._collection(Index, "indexes"),
                self._collection(Subtype, "subtypes"),
                self._collection(SubtypeFieldInfo, "subtype_infos"),
                self._collection(AttributeRule, "attribute_rules"),
                self.domains.as_mock(),
                self._domain_collection(False),
                self._domain_collection(True),
                self.domain_usage(),
            ]
        )

        for c in combo:
            c.link = ((c.cls.class_name(), None),)

        return combo

    def _de_to_class(self, data_element: dict) -> Optional[DataElementBase]:
        dataset_type = data_element.get("datasetType")
        if dataset_type is None:
            if "topologyRules" in data_element:
                dataset_type = "esriDTTopology"
            elif "topologyEnabled" in data_element:
                dataset_type = "esriDTParcelDataset"
            elif "sources" in data_element:
                dataset_type = "esriDTTraceNetwork"
            elif "categories" in data_element:
                dataset_type = "esriDTUtilityNetwork"
            elif "originPrimaryKey" in data_element:
                dataset_type = "esriDTRelationshipClass"
            elif "mergePolicy" in data_element:
                dataset_type = "WorkspaceDomain"
            else:
                return

        if dataset_type == "esriDTParcelDataset":
            dataset_type = "esriDTParcelFabric"  # Presented to users as such.

        data_element["datasetType"] = dataset_type

        # Extract spatial reference and tag with unique number.
        refs = self.spatial_references
        if (sr := data_element.get("spatialReference")) is not None:
            for existing in refs:
                if sr == existing._d:
                    i = existing.num
                    break
            else:  # no break
                i = len(refs) + 1
                refs.append(SpatialReference(sr, i))
            data_element["spatial_reference_id"] = i

        class_name = dataset_type.removeprefix("esriDT").removeprefix("DE")
        for cls in Workspace.SORT_ORDER:
            if class_name == cls.__name__:
                return cls(data_element, self)

    def _convert(self, elements: list[dict]):
        for element in elements:
            if (base := self._de_to_class(element)) is None:
                continue
            yield base

            if isinstance(base, FeatureDataset):
                yield from self._convert(children := element.get("datasets", []))

                # Ensure that the catalog path stores a reference to the feature dataset name.
                # Some dataset types (EG relationship class) only store name as catalog path.
                prefix = f"\\{element['name']}"
                for child in children:
                    if not (path := child["catalogPath"]).startswith(prefix):
                        child["catalogPath"] = prefix + path

    def get_child(self, cls: Type[BaseType], name_id: Union[str, int]) -> Optional[BaseType]:
        """Gets child DataElement by class and name/DSID"""
        if isinstance(name_id, str):
            use_id = False
            name_id = name_id.casefold()
        else:
            use_id = True

        for dataset in self.datasets:
            if dataset.__class__ != cls:
                continue

            if use_id:
                current = dataset.dataset_id
            else:
                current = dataset.name.value.casefold()
            if name_id == current:
                return dataset
