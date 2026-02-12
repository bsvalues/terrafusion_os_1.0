from typing import TYPE_CHECKING

from . import helper
from .helper import *

if TYPE_CHECKING:
    from lxml.etree import _Element as Element


def convert_domain(data: dict):
    domain_type = "CodedValue" if "codedValues" in data else "Range"
    domain = E.Domain(
        make_type(f"{domain_type}Domain"),
        E.DomainName(data["name"] if "name" in data else data["domainName"]),
        E.FieldType(data["fieldType"]),
        E.MergePolicy(data["mergePolicy"]),
        E.SplitPolicy(data["splitPolicy"]),
        E.Description(data["description"] or None),
        E.Owner(None),
    )

    if domain_type == "Range":
        lo, hi = data["range"] if "range" in data else (data["minValue"], data["maxValue"])
        domain.append(helper.element_from_field_type("MaxValue", data["fieldType"], hi))
        domain.append(helper.element_from_field_type("MinValue", data["fieldType"], lo))
    else:
        coded_values = []
        for code in data["codedValues"]:
            coded_values.append(
                E.CodedValue(
                    make_type("CodedValue"),
                    E.Name(code["name"]),
                    helper.element_from_field_type("Code", data["fieldType"], code["code"]),
                )
            )
        domain.append(
            E.CodedValues(
                make_type("ArrayOfCodedValue"),
                *coded_values,
            )
        )

    return domain


def convert_domains(data: list[dict]):
    return E.Domains(
        make_type("ArrayOfDomain"),
        *map(convert_domain, data),
    )


def convert_sequences(data: list[dict]):
    return E.Sequences(
        make_type("ArrayOfSequence"),
    )


class ConvertDataElement:
    def __init__(self, data: dict):
        self.data = data
        self._inject()
        self.datasets_by_type: dict[tuple[str, str], dict] = self._walk()

        self.current: "Element" = None
        self.payload: dict = None

        self.has_qualified_names = False

    def _walk(self):
        datasets = []
        for d in self.data["datasets"]:
            datasets.append(d)
            datasets.extend(d.get("datasets", []))

        lookup = {}
        for dataset in datasets:
            if dataset["datasetType"] == "DEFeatureDataset":
                dataset["datasetType"] = "esriDTFeatureDataset"

            key = dataset["datasetType"]  # To ease downstream lookup, FC/RC are treated like tables.
            if key in ("esriDTFeatureClass", "esriDTRelationshipClass"):
                key = "esriDTTable"

            lookup[(key.removeprefix("esriDT"), dataset["name"])] = dataset
        return lookup

    def _inject(self):
        for dataset in self.data["datasets"]:
            if dataset["datasetType"] == "DEFeatureDataset":
                dataset["datasetType"] = "esriDTFeatureDataset"
                spat_ref = dataset["spatialReference"]
                if "extent" not in dataset:  # Extent might be missing
                    dataset["extent"] = dict(spatialReference=spat_ref)

                for child in dataset.get("datasets", []):
                    # Add FeatureDataset spatial reference / extent if missing.
                    for key in ("spatialReference", "extent"):
                        if key not in child:
                            child[key] = dataset[key]

    def _insert(self, tag: str, *elements: "Element"):
        i = self.current.index(self.current.find(tag)) + 1
        for element in reversed(elements):
            if element is None:
                continue
            self.current.insert(i, element)

    def _move(self, tag: str, *elements):
        i = self.current.index(self.current.find(tag)) + 1
        for element in reversed(elements):
            if element is None:
                continue
            element.getparent().remove(element)
            self.current.insert(i, element)

    def _delete(self, *tags: str):
        for tag in tags:
            self.current.remove(self.current.find(tag))

    def _set_catalog_path(self, prefix: str):
        path = self.payload["catalogPath"][1:].replace("\\", "/")  # Remove leading slash.
        if "/" in path:
            fd, name = path.split("/")
            new_path = f"/FD={fd}/{prefix}={name}"
        else:
            new_path = f"/{prefix}={path}"

        if "." in path:
            self.has_qualified_names = True
            version = "/V=sde.DEFAULT"  # Fully qualified names *must* start with /V
        else:
            version = ""

        self.current.find("CatalogPath").text = version + new_path

    def convert_feature_dataset(self):
        data = self.payload

        self._set_catalog_path("FD")

        self._insert(
            "ConfigurationKeyword",
            helper.create_extent(data.get("extent", dict(spatialReference=data["spatialReference"]))),
            helper.create_sr(data["spatialReference"]),
            E.ChangeTracked(False),
            E.ReplicaTracked(False),
        )

        if data["datasets"]:
            before = self.current, self.payload  # DE conversion changes the current element, so we need to reset after.

            # Ensure the catalog path of each child reports the name of the FD.
            fd_path = data["catalogPath"]
            for child in data["datasets"]:
                if not child["catalogPath"].casefold().startswith(fd_path.casefold()):
                    child["catalogPath"] = fd_path + child["catalogPath"]

            children = E.Children(
                make_type("ArrayOfDataElement"),
                *map(self.convert_data_element, data["datasets"]),
            )
            self.current, self.payload = before
            self._insert("Name", children)

    def convert_table(self):
        from . import table
        from ..common import get_qualification_prefix

        data = self.payload

        subtypes = []
        if "subtypes" in data:
            subtypes = [
                E.SubtypeFieldName(data["subtypeFieldName"]),
                E.DefaultSubtypeCode(data["defaultSubtypeCode"]),
                table.convert_subtypes(data["subtypes"], fields=data["fields"]["fieldArray"]),
            ]

        self._set_catalog_path("OC")
        self._insert(
            "ConfigurationKeyword",
            E.HasOID(data["hasOID"]),
            E.OIDFieldName(data["oidFieldName"] or None),
            table.convert_fields(data["fields"]["fieldArray"]),
            table.convert_indices(data["indexes"]["indexArray"]),
            E.CLSID(data["clsId"] or None),
            E.EXTCLSID(data["extClsId"] or None),
            E.RelationshipClassNames(
                make_type("Names"),
            ),
            E.AliasName(data["aliasName"] or data["name"]),
            E.ModelName(data["modelName"] or None),
            E.HasGlobalID(data["hasGlobalID"]),
            E.GlobalIDFieldName(data["globalIdFieldName"] or None),
            E.RasterFieldName(data["rasterFieldName"] or None),
            helper.create_property_sets("ExtensionProperties", data["extensionProperties"]),
            *subtypes,
            table.convert_controller_memberships(
                data.get("controllerMemberships", []),
                get_qualification_prefix(data["name"]),
            ),
            E.EditorTrackingEnabled(data["editorTrackingEnabled"]),
            E.CreatorFieldName(data["creatorFieldName"] or None),
            E.CreatedAtFieldName(data["createdAtFieldName"] or None),
            E.EditorFieldName(data["lastEditorFieldName"] or None),
            E.EditedAtFieldName(data["editedAtFieldName"] or None),
            E.IsTimeInUTC(data["isTimeInUTC"]),
            E.ChangeTracked(data["changeTracked"]),
            E.FieldFilteringEnabled(data["fieldFilteringEnabled"]),
            E.FilteredFieldNames(
                make_type("Names"),
            ),
            E.ReplicaTracked(data["replicaTracked"]),
            table.convert_attribute_rules(ar) if (ar := data.get("attributeRules")) else None,
            table.convert_field_groups(data["fieldGroups"]) if "fieldGroups" in data else None,
            E.HasOID64(data["hasOID64"]) if data.get("hasOID64") else None,
        )

    def convert_feature_class(self):
        self.convert_table()
        data = self.payload
        self._set_catalog_path("FC")

        self._insert(
            "IsTimeInUTC",
            E.FeatureType(data["featureType"]),
            E.ShapeType(data["shapeType"]),
            E.ShapeFieldName(data["shapeFieldName"]),
            E.HasM(data["hasM"]),
            E.HasZ(data["hasZ"]),
            E.HasSpatialIndex(data["hasSpatialIndex"]),
            E.AreaFieldName(data["areaFieldName"] or None),
            E.LengthFieldName(data["lengthFieldName"] or None),
            helper.create_extent(data["extent"]),
            helper.create_sr(data["spatialReference"]),
        )

        self._move(
            "ChangeTracked",
            self.current.find("ReplicaTracked"),
        )
        self._insert(
            "ReplicaTracked",
            E.SplitModel(sm) if (sm := data["splitModel"]) != "esriSMUpdateInsert" else None,
        )

    def convert_relationship_class(self):
        from . import table

        self.convert_table()
        data = self.payload
        self._set_catalog_path("RC")

        self._insert(
            "IsTimeInUTC",
            E.Cardinality(data["cardinality"]),
            E.Notification(data["notification"]),
            E.IsAttributed(data["isAttributed"]),
            E.IsComposite(data["isComposite"]),
            helper.create_names("OriginClassNames", data["originClassNames"]),
            helper.create_names("DestinationClassNames", data["destinationClassNames"]),
            E.KeyType(data["keyType"]),
            E.ClassKey(data["classKey"]),
            E.ForwardPathLabel(data["forwardPathLabel"]),
            E.BackwardPathLabel(data["backwardPathLabel"]),
            E.IsReflexive(data["isReflexive"]),
            table.convert_rc_keys("OriginClassKeys", data["originClassKeys"]),
            table.convert_rc_keys("DestinationClassKeys", k) if (k := data.get("destinationClassKeys")) else None,
            table.convert_rc_rules(data["relationshipRules"]),
            E.IsAttachmentRelationship(data["isAttachmentRelationship"]),
        )

        self._delete(
            "FieldFilteringEnabled",
            "FilteredFieldNames",
        )

        self.current.find("DSID").text = "-1"
        if "destinationClassKeys" in data:
            self.current.find("CLSID").text = "{A07E9CB1-9A95-11D2-891A-0000F877762D}"  # Attributed Relationship object
            for alias in self.current.iterfind(".//Field/AliasName"):  # XML doesn't store field aliases.
                alias.getparent().remove(alias)
        else:
            self.current.find("AliasName").text = None

    def convert_utility_network(self):
        from .network import UtilityNetwork

        self._set_catalog_path("UN")

        # The UN might be missing spatial reference inside extent, so add if missing.
        spat_ref = self.payload["spatialReference"]
        self._insert(
            "ConfigurationKeyword",
            helper.create_extent(dict(spatialReference=spat_ref) | self.payload.get("extent", {})),
            helper.create_sr(spat_ref),
        )

        # The UN sources might be missing classID, so add it.
        for network in self.payload["domainNetworks"]:
            for source in network["junctionSources"] + network["edgeSources"]:
                if "objectClassId" in source:
                    continue
                table = self.datasets_by_type.get(("Table", source["networkSourceName"]), {})
                source["objectClassId"] = table.get("dsId")

        un = UtilityNetwork(self.payload)
        self.current.extend(un.convert_properties())
        for func in (
            un.convert_domain_networks,
            un.convert_network_attributes,
            un.convert_terminal_configurations,
            un.convert_categories,
        ):
            self.current.append(func())

    def convert_parcel_dataset(self):
        from .parcel import ParcelFabric

        self._set_catalog_path("PD")
        self._insert(
            "ConfigurationKeyword",
            helper.create_extent(self.payload.get("extent", {})),
            helper.create_sr(self.payload.get("spatialReference", {})),
        )

        pf = ParcelFabric(self.payload)
        for func in (
            pf.convert_properties,
            pf.convert_parcel_types,
        ):
            self.current.extend(func())

    def convert_topology(self):
        from .topology import Topology

        self._set_catalog_path("TOPO")
        self._insert(
            "ConfigurationKeyword",
            extent := helper.create_extent(self.payload.get("extent", {})),
            helper.create_sr(self.payload.get("spatialReference", {})),
        )

        # Topo extents do not store spatial reference when null
        if extent.findtext("XMin") == "NaN" and (sr := extent.find("SpatialReference")) is not None:
            extent.remove(sr)

        topo = Topology(self.payload)
        self.current.extend(topo.convert_properties())

    def convert_location_referencing(self):
        from .locref import LocationReferencing

        self._set_catalog_path("LRD")
        self._insert(
            "ConfigurationKeyword",
            helper.create_element_with_type("Extent", None),
            helper.create_sr(self.payload.get("spatialReference", {})),
        )

        lrd = LocationReferencing(self.payload)
        self.current.extend(lrd.convert_all())

    @staticmethod
    def _add_lrs_controller_membership(table: "Element"):
        if table.findtext("DatasetType") != "esriDTFeatureClass":
            return  # Not a table
        if (controller := table.find("ControllerMemberships")) is None:
            return  # No controllers
        if controller.find(".//ClassRole") is not None:
            return  # Already part of LRS.
        controller.append(
            E.ControllerMembership(
                make_type("LocationReferencingDatasetMembership"),
                E.DatasetName(),
                E.ClassRole(0),
            )
        )

    def convert_data_element(self, data: dict):
        dataset_type = data["datasetType"]
        self.payload = data
        self.current = E.DataElement(
            make_type("DE" + dataset_type.removeprefix("esriDT")),
            E.CatalogPath(),
            E.Name(data["name"]),
            E.DatasetType(dataset_type),
            E.DSID(data.get("dsId")),
            E.Versioned(False),
            E.CanVersion(False),
            E.ConfigurationKeyword(),
        )

        lookup = dict(
            esriDTFeatureDataset=self.convert_feature_dataset,
            esriDTTable=self.convert_table,
            esriDTFeatureClass=self.convert_feature_class,
            esriDTRelationshipClass=self.convert_relationship_class,
            esriDTUtilityNetwork=self.convert_utility_network,
            esriDTParcelDataset=self.convert_parcel_dataset,
            esriDTTopology=self.convert_topology,
            esriDTLocationReferencingDataset=self.convert_location_referencing,
        )
        lookup.get(dataset_type, lambda: None)()

        return self.current

    def convert_all(self):
        from lxml.etree import fromstring

        data_elements = E.DatasetDefinitions(
            make_type("ArrayOfDataElement"),
            *map(self.convert_data_element, self.data["datasets"]),
        )

        # If there are any datasets with a missing DSID, populate it.
        existing = set(map(int, data_elements.xpath(".//DSID/text()")))
        for elem in data_elements.iterfind(".//DSID"):
            if elem.text is not None:
                continue
            elem.text = str(new := max(existing, default=3) + 1)  # Lowest entry in gdb_items table is 3.
            existing.add(new)

        # For topologies that are co-controller datasets with topologies, they get an extra key.
        for pf in data_elements.iterfind(".//DataElement[DatasetType='esriDTParcelDataset']"):
            if (topo := data_elements.find(f".//DataElement[DSID='{pf.findtext('Topology')}']")) is None:
                continue
            topo.append(E.ParcelDatasetID(pf.findtext("DSID")))

        # LRS doesn't always store the name of the dataset in controller membership.
        for lrs in data_elements.iterfind(".//DataElement[DatasetType='esriDTLocationReferencingDataset']"):
            meta: "Element" = fromstring(lrs.findtext("LRSMetadata"))
            tables = [meta.attrib[k] for k in ("CenterlineFCName", "CalibrationPointFCName", "RedlineFCName")]
            for network in meta.iterfind("Networks/"):
                tables.append(network.attrib["PersistedFeatureClassName"])
                for event in network.iterfind("EventTables/"):
                    tables.append(event.attrib["FeatureClassName"])
                for intersect in network.iterfind("IntersectionClasses/"):
                    tables.append(intersect.attrib["FeatureClassName"])

            qualification = meta.attrib["UserSchemaPrefix"]
            for table in tables:
                if (element := data_elements.find(f".//DataElement[Name='{qualification}{table}']")) is not None:
                    self._add_lrs_controller_membership(element)

        return data_elements

    def to_xml(self) -> "Element":
        from lxml.builder import ElementMaker

        # The nsmap order is slightly different at workspace level. This doesn't matter from an XML perspective, but
        # makes diffing nicer.
        workspace_maker = ElementMaker(typemap=E._typemap, nsmap={k: E._nsmap[k] for k in ("esri", "xsi", "xs")})

        elements = self.convert_all()

        return workspace_maker(
            f"{{{E._nsmap['esri']}}}Workspace",
            E.WorkspaceDefinition(
                make_type("WorkspaceDefinition"),
                E.WorkspaceType("esriLocalDatabaseWorkspace"),
                E.Version("sde.DEFAULT" if self.has_qualified_names else ""),
                convert_domains(self.data.get("domains", [])),
                convert_sequences(self.data.get("sequences", [])),
                elements,
            ),
            E.WorkspaceData(make_type("WorkspaceData")),
        )
