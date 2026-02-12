from typing import TYPE_CHECKING, Type, Optional

from .._logging import get_logger
from ..constants import *

if TYPE_CHECKING:
    from .reader import ExcelWorksheet
    from ..conversion.workspace import Table

logger = get_logger(__name__)


def convert_domain(properties: dict, range_codes: list[dict]):
    from ..conversion.workspace import WorkspaceDomain, DomainRange, DomainCodedValue
    from ..date_utils import to_stamp

    domain = WorkspaceDomain.to_json(properties)
    date_field = domain["fieldType"] == esriFieldTypeDomain.esriFieldTypeDate.name

    if domain["type"] == "range":
        key = "range"
        values = DomainRange.to_json(range_codes[0])
        if date_field:
            values = [to_stamp(c) for c in values]
    else:
        key = "codedValues"
        values = [DomainCodedValue.to_json(x) for x in range_codes]
        if date_field:
            for val in values:
                val["code"] = to_stamp(val["code"])

    return domain | {key: values}


def convert_domains(data):
    return [convert_domain(*d) for d in data]


class TableConverter:
    def __init__(self, gdb: "ConvertDataElement", sheet: "ExcelWorksheet"):
        self.gdb = gdb
        self.sheet = sheet

        self.field_lookup: dict[str, dict] = {
            f["name"].casefold(): f for f in self._convert_fields()["fields"]["fieldArray"]
        }

    def _convert_fields(self):
        from ..conversion.table import Field
        from .table import convert_fields
        from copy import deepcopy

        if fields := self.sheet.get_table(Field):
            for field in (data := fields.data()):
                if domain_name := field[Field.DOMAIN]:
                    if domain := self.gdb.domain_lookup.get(domain_name.casefold()):
                        field[Field.DOMAIN] = deepcopy(domain)  # Will be modified downstream

                if "Area" in (usage := field[Field.USAGE] or ""):
                    self.gdb.current["areaFieldName"] = field[Field.NAME]
                elif "Length" in usage:
                    self.gdb.current["lengthFieldName"] = field[Field.NAME]

                if field[Field.TYPE] == esriFieldType.esriFieldTypeGeometry.value:
                    field["geometryDef"] = dict(
                        avgNumPoints=0,
                        geometryType=self.gdb.current["shapeType"],
                        gridSize0=0,
                        hasM=self.gdb.current["hasM"],
                        hasZ=self.gdb.current["hasZ"],
                        spatialReference=self.gdb.current["spatialReference"],
                    )
                    self.gdb.current["hasSpatialIndex"] = "Index" in usage
                elif field[Field.TYPE] == esriFieldType.esriFieldTypeOID.value:
                    if field[Field.LENGTH] == 8:
                        self.gdb.current["hasOID64"] = True
                elif field[Field.TYPE] == esriFieldType.esriFieldTypeRaster.value:
                    field["rasterDef"] = dict(
                        description="Raster Column",
                        isByFunction=False,
                        isByRef=False,
                        isInline=False,
                        spatialReference=self.gdb.current.get("spatialReference", {"wkid": None}),
                    )
                    self.gdb.current["rasterFieldName"] = field[Field.NAME]

            return convert_fields(data)

        return {}

    def convert_fields(self):
        return dict(fields=dict(fieldArray=list(self.field_lookup.values())))

    def convert_subtypes(self):
        from ..conversion.table import Subtype, SubtypeFieldInfo
        from .table import convert_subtypes

        field_type_lookup = {k: v["type"] for k, v in self.field_lookup.items()}

        if (subtypes := self.sheet.get_table(Subtype)) and (field_info := self.sheet.get_table(SubtypeFieldInfo)):
            # Group FieldInfo by subtype code.
            info = {}
            for row in field_info.data():
                info.setdefault(row[SubtypeFieldInfo.CODE], []).append(row)

            for sub in (subs := subtypes.data()):
                sub[Subtype.INFO] = info.get(sub[Subtype.CODE])

            return convert_subtypes(subs, field_type_lookup)

        return {}

    def convert_indices(self, drop_alias: bool = False):
        from ..conversion.table import Index
        from .table import convert_indices
        from copy import deepcopy

        result = {}

        if indices := self.sheet.get_table(Index):
            for index in (data := indices.data()):
                if fields := list(
                    filter(
                        None, (deepcopy(self.field_lookup.get(f)) for f in index[Index.FIELDS].casefold().split(";"))
                    )
                ):
                    index["fields"] = dict(fieldArray=fields)
            result = convert_indices(data)

        if drop_alias:
            for index in result.get("indexes", {}).get("indexArray", []):
                for field in index["fields"]["fieldArray"]:
                    field.pop("aliasName", None)

        return result

    def convert_attribute_rules(self):
        from ..conversion.table import AttributeRule
        from .table import convert_attribute_rules

        missing = {
            AttributeRule.DESC: "",
            AttributeRule.ORDER: None,
            AttributeRule.CATEGORY: 0,
            AttributeRule.PARAMETERS: AttributeRule.default_check_parameters(),
            AttributeRule.TRIGGER_FIELDS: None,  # Added in Pro 3.4
        }

        if rules := self.sheet.get_table(AttributeRule):
            data = [missing | rule for rule in rules.data()]

            return convert_attribute_rules(data)

        return {}

    def convert_relationship_rules(self):
        from ..conversion.table import RelationshipClassRule
        from .table import convert_relationship_rules

        if rules := self.sheet.get_table(RelationshipClassRule):
            return convert_relationship_rules(rules.data())

        return {}

    def convert_rc_names(self):
        payload = dict(relationshipClassNames=dict(names=(names := [])))

        return payload

    def convert_extension_properties(self):
        from .table import convert_property_set

        payload = dict(extensionProperties=dict(type="PropertySet", propertySetItems=(items := [])))

        if props := self.sheet.get_table(extension_properties=True):
            items.extend(convert_property_set(props.data(True)))

        return payload

    def convert_controller_membership(self):
        # Each controller membership is identified by <Type>Name and has 0..n extra keys.
        expected_keys = dict(
            utilityNetworkName=[],
            parcelDatasetName=["parcelClassType", "isLargeParcelType"],
            topologyName=["weight", "xyRank", "zRank", "eventNotificationOnValidate"],
            geometricNetworkName=["enabledFieldName", "ancillaryRoleFieldName", "networkClassAncillaryRole"],
            networkDatasetName=[],
            terrainName=[],
            datasetName=["classRole"],
        )
        unqualified_types = [  # Certain controllers do not store fully qualified names.
            "parcelDatasetName",
            "topologyName",
            "datasetName",
        ]

        payload = dict(controllerMemberships=(members := []))
        if props := self.sheet.get_table(controller_membership=True):
            if mem := props.data(True):
                # A table can participate in multiple controller datasets.
                for key in expected_keys:
                    if key not in mem:
                        continue
                    for qual in unqualified_types:
                        if qual in mem:
                            mem[qual] = str(mem[qual]).split(".")[-1]
                    members.append({k: mem.get(k) for k in [key, *expected_keys[key]]})

        return payload


class ConvertDataElement:
    def __init__(self, xlsx: str):
        from .reader import ExcelWorkbook

        self.excel = ExcelWorkbook(xlsx)
        self.current: dict = None  # The DataElement being converted.
        self.sheet: "ExcelWorksheet" = None  # The worksheet being converted to self.current.

        self.domain_lookup: dict[str, dict] = {
            d["name"].casefold(): d for d in convert_domains(self._extract_domains())
        }
        self.spatial_references: dict[int, dict] = dict(self._extract_spatial_references())

        self.converted: list[dict] = []  # Running list of elements as we convert them.

    def _extract_spatial_references(self):
        from ..conversion import SpatialReference

        if not (sheet := self.excel.name_lookup.get(SpatialReference.class_name_lower())):
            return
        if not (props := sheet.get_table(SpatialReference)):
            return

        import json
        import arcpy

        for row in props.data():
            # Spatial Reference objects lack a native JSON serialization, so we construct a placeholder geometry
            # object and export *that* to JSON.
            extent = arcpy.Extent(spatial_reference=arcpy.SpatialReference(text=row[SpatialReference.WKT])).JSON
            yield row[SpatialReference.ID], json.loads(extent)["spatialReference"]

    def _extract_domains(self):
        from ..conversion.workspace import WorkspaceDomain, DomainRange, DomainCodedValue

        for sheet in self.excel.get_sheets_by_type(WorkspaceDomain):
            if (props := sheet.get_table(properties=True)) and (
                range_codes := sheet.get_table(DomainRange, DomainCodedValue)
            ):
                yield props.data(True), range_codes.data()

    def _get_properties(self) -> dict:
        """Gets properties from current sheet"""
        from ..conversion.workspace import SpatialDataElementBase
        from ..conversion.parcel import ParcelFabric

        if (props := self.sheet.get_table(properties=True)) is None:
            return {}

        missing = {
            # Added in Pro 3.4
            SpatialDataElementBase.Z_MIN: None,
            SpatialDataElementBase.Z_MAX: None,
            SpatialDataElementBase.M_MIN: None,
            SpatialDataElementBase.M_MAX: None,
        }

        data = missing | props.data(True)

        # ParcelFabric did not export certain properties on Pro 3.2.
        if self.sheet.name.startswith(ParcelFabric.SHEET_PREFIX):
            ParcelFabric.upgrade(data)

        if sr := self.spatial_references.get(data.get(SpatialDataElementBase.SPAT_REF)):  # Convert SR number to object.
            data[SpatialDataElementBase.SPAT_REF] = sr
        return data

    def convert_workspace_properties(self) -> dict:
        from ..conversion import Workspace

        for sheet in self.excel.sheets:
            if sheet.name.casefold() == "toc":
                break
        else:
            return {}

        if (props := sheet.get_table(Workspace, properties=True)) is None:
            return {}

        return Workspace.to_json(props.data(True))

    def convert_feature_dataset(self):
        from ..conversion.workspace import FeatureDataset

        self.current.update(
            datasets=[],
            **FeatureDataset.to_json(self._get_properties()),
        )

    def _convert_table(self, dataset_type: Type["Table"]):
        from ..conversion.workspace import RelationshipClass

        missing = {
            dataset_type.CATALOG: "",
            dataset_type.CLS_ID: "",
            dataset_type.EXT_CLS_ID: "",
            dataset_type.DEFAULT_SUBTYPE: None,
        }

        if dataset_type is RelationshipClass:
            dataset_type: RelationshipClass
            missing.update({dataset_type.ATTACH: False, dataset_type.ATTRIBUTED: False})

        # Convert table properties first so downstream conversion routines have access.
        self.current.update(dataset_type.to_json(missing | self._get_properties()))

        table = TableConverter(self, self.sheet)
        self.current.update(
            **table.convert_fields(),
            **table.convert_indices(drop_alias=dataset_type is RelationshipClass),
            **table.convert_attribute_rules(),
            **table.convert_rc_names(),
            **table.convert_extension_properties(),
            **table.convert_controller_membership(),
            **table.convert_relationship_rules(),
        )

        if self.current.get("subtypeFieldName"):
            self.current.update(
                **table.convert_subtypes(),
            )

    def convert_table(self):
        from ..conversion.workspace import Table

        self._convert_table(Table)

    def convert_feature_class(self):
        from ..conversion.workspace import FeatureClass

        self.current.update(
            # Defaults which will potentially be modified by field properties.
            areaFieldName="",
            lengthFieldName="",
            hasSpatialIndex=False,
        )

        self._convert_table(FeatureClass)

    def convert_relationship_class(self):
        from ..conversion.workspace import RelationshipClass

        self._convert_table(RelationshipClass)

    def convert_utility_network(self):
        from ..conversion.network import UtilityNetwork
        from .network import UtilityNetworkConverter

        un = UtilityNetworkConverter(self, self.sheet)

        self.current.update(
            UtilityNetwork.to_json(self._get_properties()),
            **un.convert_all(),
        )

    def convert_parcel_dataset(self):
        from ..conversion.parcel import ParcelFabric, ParcelType

        parcel_types = self.sheet.get_table(ParcelType).data()

        missing = {
            ParcelFabric.MINOR_VERSION: 1,  # Missing from Pro 3.2.
        }

        self.current.update(
            ParcelFabric.to_json(missing | self._get_properties()),
            parcelTypes=[ParcelType.to_json(p) for p in parcel_types],
        )

    def convert_topology(self):
        from ..conversion import topology

        classes = self.sheet.get_table(topology.TopologyClass).data()
        rules = self.sheet.get_table(topology.TopologyRule).data()

        self.current.update(
            topology.Topology.to_json(self._get_properties()),
            layers=[topology.TopologyClass.to_json(c) for c in classes],
            topologyRules=[topology.TopologyRule.to_json(r) for r in rules],
        )

    def convert_location_referencing_dataset(self):
        from .locref import LRSConverter

        convert = LRSConverter(self, self.sheet)
        self.current.update(convert.convert_all())

    def convert_data_element(self, sheet: "ExcelWorksheet") -> dict:
        from ..conversion.workspace import DataElementBase

        self.sheet = sheet
        if not (data := self._get_properties()):
            return {}

        path = f"\\{data[DataElementBase.NAME]}"
        if fd := data[DataElementBase.CONTAINER]:
            path = f"\\{fd}{path}"

        self.current = dict(
            catalogPath=path,
            childrenExpanded=False,
        )

        lookup = dict(
            FeatureDataset=self.convert_feature_dataset,
            Table=self.convert_table,
            FeatureClass=self.convert_feature_class,
            RelationshipClass=self.convert_relationship_class,
            UtilityNetwork=self.convert_utility_network,
            ParcelDataset=self.convert_parcel_dataset,
            Topology=self.convert_topology,
            LocationReferencingDataset=self.convert_location_referencing_dataset,
        )
        lookup.get(data[DataElementBase.TYPE], lambda: None)()

        self.converted.append(self.current)
        return self.current

    def _get_element(self, name: str, *dataset_types: esriDatasetType) -> Optional[dict]:
        name = name.casefold()
        types = {d.name for d in dataset_types}
        for element in self.converted:
            if element["datasetType"] in types and element["name"].casefold() == name:
                return element

    def _post_process_rc(self, data: dict):
        if not (rules := data["relationshipRules"]):
            return

        tables = [data[f"{key}ClassNames"][0]["name"].casefold() for key in ("origin", "destination")]
        a, b = (self._get_element(t, esriDatasetType.esriDTTable, esriDatasetType.esriDTFeatureClass) for t in tables)
        if a is None or b is None:
            return

        a_subs, b_subs = ({s["subtypeName"]: s["subtypeCode"] for s in table.get("subtypes", [])} for table in (a, b))

        for rule in rules:  # Convert table name to DSID and subtype name to code.
            rule["originClassID"] = a["dsId"]
            rule["destinationClassID"] = b["dsId"]
            rule["originSubtypeCode"] = a_subs.get(rule["originSubtypeCode"], 0)
            rule["destinationSubtypeCode"] = b_subs.get(rule["destinationSubtypeCode"], 0)

    def _post_process_table(self, data: dict):
        subtypes = {s["subtypeName"]: s["subtypeCode"] for s in data.get("subtypes", [])}
        if default := data.get("defaultSubtypeCode"):
            data["defaultSubtypeCode"] = subtypes.get(default, -1)
        for rule in data.get("attributeRules", []):
            rule["subtypeCode"] = subtypes.get(rule["subtypeCode"], -1)

        if data.get("featureType") == "esriFTAnnotation":  # Annotation stores field/subtype info slightly different.
            string_fields = set()
            for field in data.get("fields", {}).get("fieldArray", []):
                if field["type"] != esriFieldType.esriFieldTypeString.name:
                    continue
                string_fields.add(field["name"].casefold())
                if field.get("defaultValue", None) is None:
                    field["defaultValue"] = ""

            for subtype in data.get("subtypes", []):
                for info in subtype.get("fieldInfos", []):
                    if info["fieldName"].casefold() in string_fields and info.get("defaultValue", None) is None:
                        info["defaultValue"] = ""

    @staticmethod
    def _post_process_un(data: dict):
        terminal_lookup = {
            t["terminalConfigurationName"]: t["terminalConfigurationId"] for t in data["terminalConfigurations"]
        }

        for network in data["domainNetworks"]:
            for source in network["junctionSources"] + network["edgeSources"]:
                usage = source["utilityNetworkFeatureClassUsageType"]
                is_linear = usage in esriUtilityNetworkFeatureClassUsageType.edge_sources()
                for asset_group in source["assetGroups"]:
                    for asset_type in asset_group["assetTypes"]:
                        asset_type["isLinearConnectivityPolicySupported"] = is_linear
                        asset_type["isTerminalConfigurationSupported"] = not is_linear
                        asset_type["terminalConfigurationId"] = terminal_lookup.get(
                            asset_type["terminalConfigurationId"], 0
                        )

        for na in data["networkAttributes"]:
            for assign in na["assignments"]:
                assign["networkAttributeId"] = na["id"]

    def _post_process_pd(self, data: dict):
        # Convert table name to DSID
        for key in (
            "adjustmentLineClassId",
            "adjustmentPointClassId",
            "adjustmentVectorClassId",
            "pointClassId",
            "recordClassId",
            "connectionClassId",
        ):
            if table := (self._get_element(data[key], esriDatasetType.esriDTFeatureClass)):
                data[key] = table["dsId"]

        if topo := self._get_element(data["topology"], esriDatasetType.esriDTTopology):
            data["topology"] = topo["dsId"]

        for parcel_type in data["parcelTypes"]:
            for key in ("lineClassId", "polygonClassId"):
                if table := (self._get_element(parcel_type[key], esriDatasetType.esriDTFeatureClass)):
                    parcel_type[key] = table["dsId"]

    def _post_process_to(self, data: dict):
        for rule in data["topologyRules"]:
            for prefix in ("origin", "destination"):
                table_key = f"{prefix}ClassID"
                if (table := self._get_element(rule[table_key], esriDatasetType.esriDTFeatureClass)) is None:
                    continue
                rule[table_key] = table["dsId"]

                subtype_key = f"{prefix}Subtype"
                subtype_lookup = {s["subtypeName"]: s["subtypeCode"] for s in table.get("subtypes", [])}
                if (subtype := rule[subtype_key]) is None:
                    if subtype_lookup:
                        rule.pop(subtype_key)
                    else:
                        rule[subtype_key] = 0  # Sentinel when the table doesn't have subtypes.
                else:
                    rule[subtype_key] = subtype_lookup.get(subtype, subtype)

    def _post_process_lrs(self, data: dict):
        meta: dict = data["lrsMetaData"]

        network_lookup = {}
        event_name_id_lookup = {}
        event_name_network_lookup = {}
        for network in meta.get("networks", []):
            network_lookup[network["name"]] = network
            for event in network.get("eventTables", []):
                event_name_id_lookup[event["name"]] = event["eventId"]
                event_name_network_lookup[event["name"]] = network["networkId"]

        for rule in data["EventBehaviorRules"].get("eventBehaviorRules", []):
            event = rule.pop("event")
            rule.update(
                EventTableId=event_name_id_lookup.get(event, event),
                LrsId=meta["lrsId"],
                NetworkId=event_name_network_lookup.get(event, -1),
            )

    def post_process(self):
        """Replaces key/value pairs with codes instead of names"""

        for element in self.converted:
            if element["datasetType"] == esriDatasetType.esriDTRelationshipClass.name:
                self._post_process_rc(element)
            elif element["datasetType"] == esriDatasetType.esriDTTable.name:
                self._post_process_table(element)
            elif element["datasetType"] == esriDatasetType.esriDTFeatureClass.name:
                self._post_process_table(element)
            elif element["datasetType"] == esriDatasetType.esriDTUtilityNetwork.name:
                self._post_process_un(element)
            elif element["datasetType"] == esriDatasetType.esriDTParcelDataset.name:
                self._post_process_pd(element)
            elif element["datasetType"] == esriDatasetType.esriDTTopology.name:
                self._post_process_to(element)
            elif element["datasetType"] == esriDatasetType.esriDTLocationReferencingDataset.name:
                self._post_process_lrs(element)

    def add_elements_feature_dataset(self) -> list[dict]:
        """Adds elements referencing the feature dataset as children"""
        from copy import deepcopy

        all_datasets = []
        feature_datasets: list[dict] = []  # All the feature datasets in the workspace.
        dataset_mapping: dict[str, list[dict]] = {}

        # Find all feature datasets and those elements referencing the feature dataset.
        for element in map(deepcopy, self.converted):
            if element["datasetType"] == "DEFeatureDataset":
                feature_datasets.append(element)
            elif len(split := element["catalogPath"].split("\\")) == 3:
                dataset_mapping.setdefault(split[1].casefold(), []).append(element)
                continue

            all_datasets.append(element)

        # "Move" the children from root to feature dataset.
        for dataset in feature_datasets:
            dataset["datasets"].extend(dataset_mapping.get(dataset["name"].casefold(), []))

        return all_datasets

    def convert_all(self):
        from ..conversion import workspace, network, parcel, topology, locref

        with logger.timing(code="ReadingSheets") as t:
            for sheet in self.excel.get_sheets_by_type(
                workspace.FeatureDataset,
                workspace.Table,
                workspace.FeatureClass,
                workspace.RelationshipClass,
                network.UtilityNetwork,
                parcel.ParcelFabric,
                topology.Topology,
                locref.LocationReferencingDataset,
            ):
                logger.debug(sheet.name, extra=t)
                self.convert_data_element(sheet)

        self.post_process()
        return self.add_elements_feature_dataset()

    def to_json(self):
        return dict(
            **self.convert_workspace_properties(),
            domains=list(self.domain_lookup.values()),
            datasets=self.convert_all(),
        )
