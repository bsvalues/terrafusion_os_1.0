from typing import TYPE_CHECKING, Optional

from .helper import *
from .workspace import SpatialDataElementBase, DataElementBase, Table
from ..constants import *

if TYPE_CHECKING:
    from datetime import datetime

__all__ = [
    "TraceNetwork",
    "UtilityNetwork",
]


def create_value(cls: Base, name, child=None, anchor: bool = True):
    """Creates ValueWrapper for BaseNetwork sub element"""
    if not name:
        return
    return cls.get_parent(BaseNetwork).name.extend(child or cls.__class__, name, as_anchor=anchor)


class ConfigBase(Base):
    parent: "TierTraceConfiguration"

    TIER = "Tier Name"
    OPERATOR = "Operator"
    NA = "Network Attribute"
    NA_CAT = "Network Attribute / Category"
    VALUE = "Value"
    FUNCTION = "Function"

    HEADER = (Header(TIER, "tier_name", json="!tier"),)

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def tier_name(self) -> ValueWrapper:
        return self.parent.parent.name

    @property
    def network_attribute(self):
        return create_value(self, self._d["networkAttributeName"], child=NetworkAttribute, anchor=False)

    @property
    def operator(self) -> str:
        return self._d["operator"]

    @property
    def value(self):
        return self._d["value"]


class Propagator(ConfigBase):
    SUBSTITUTION = "Substitution"
    BURN_IN = "Propagated Field"

    HEADER = (
        *ConfigBase.HEADER,
        Header(ConfigBase.FUNCTION, "function", json="propagatorFunctionType", enum=esriTracePropagatorFunctionType),
        Header(ConfigBase.NA, "network_attribute", json="networkAttributeName"),
        Header(ConfigBase.OPERATOR, "operator", json="operator", enum=esriTraceOperator),
        Header(ConfigBase.VALUE, "value", json="value"),
        Header(SUBSTITUTION, "substitution", json="substitutionAttributeName"),
        Header(BURN_IN, "burn_in", json="propagatedAttributeName"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result.update(substitutionAttributeName=result["substitutionAttributeName"] or "")

        return result

    @property
    def function(self) -> str:
        return self._d["propagatorFunctionType"]

    @property
    def substitution(self) -> Optional[ValueWrapper]:
        return create_value(self, self._d["substitutionAttributeName"], child=NetworkAttribute, anchor=False)

    @property
    def burn_in(self) -> Optional[str]:
        return self._d["propagatedAttributeName"]


class FunctionBarrier(ConfigBase):
    LOCAL = "Use Local Values"

    HEADER = (
        *ConfigBase.HEADER,
        Header(ConfigBase.FUNCTION, "function", json="functionType", enum=esriTraceFunctionType),
        Header(ConfigBase.NA, "network_attribute", json="networkAttributeName"),
        Header(ConfigBase.OPERATOR, "operator", json="operator", enum=esriTraceOperator),
        Header(ConfigBase.VALUE, "value", json="value"),
        Header(LOCAL, "use_local_values", json="useLocalValues", enum=BooleanType),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def function(self) -> str:
        return self._d["functionType"]

    @property
    def use_local_values(self) -> bool:
        return self._d["useLocalValues"]


class Condition(ConfigBase):
    TYPE = "Type"
    COMBINE = "Combine Using Or"

    HEADER = (
        *ConfigBase.HEADER,
        Header(ConfigBase.NA_CAT, "name", json="name"),
        Header(ConfigBase.OPERATOR, "operator", json="operator", enum=esriTraceOperator),
        Header(ConfigBase.VALUE, "value", json="value"),
        Header(COMBINE, "combine", json="combineUsingOr", enum=BooleanType),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result.update(
            type="category" if str(result["name"]).casefold() == "category" else "networkAttribute",
            isSpecificValue=isinstance(result["name"], str),
        )

        return result

    @property
    def filter_type(self) -> str:
        return self._d["type"]

    @property
    def is_specific_value(self) -> str:
        return self._d["isSpecificValue"]

    @property
    def combine(self) -> bool:
        return self._d["combineUsingOr"]


class Function(Condition):
    SUMMARY = "Summary Field"
    FUNCTION_TYPE = "Function"
    HEADER = (
        *ConfigBase.HEADER,
        Header(FUNCTION_TYPE, "function_type", json="functionType", enum=esriTraceFunctionType),
        Header(ConfigBase.NA, "network_attribute", json="networkAttributeName"),
        Header(SUMMARY, "field", json="summaryAttributeName"),
        *Condition.HEADER[1:],
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        # Nest condition keys.
        condition = {
            key: result.pop(key) for key in [k.json for k in Condition.HEADER[1:]] + ["type", "isSpecificValue"]
        }
        result.update(
            conditions=[] if condition["name"] is None else [condition],  # Conditions are optional
        )

        return result

    @property
    def field(self) -> Optional[ValueWrapper]:
        from .table import Field

        if not (field := self._d["summaryAttributeName"]):
            return
        return (
            self.get_parent(DomainNetwork)
            .get_source(esriUtilityNetworkFeatureClassUsageType.esriUNFCUTSubnetLine)
            .table()
            .name.extend(Field, field)
        )

    @property
    def function_type(self) -> str:
        return self._d["functionType"]


class TraceSource(Base):
    parent: "TraceNetwork"

    NAME = "Source Name"
    ID = "Source ID"
    SHAPE = "Shape Type"

    HEADER = (
        Header(NAME, "name"),
        Header(ID, "id"),
        Header(SHAPE, "shape_type", enum=esriGeometryType),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def name(self) -> ValueWrapper:
        from .workspace import Table

        return ValueWrapper.new(Table, self._d["networkSourceName"])

    @property
    def id(self) -> int:
        return self._d["sourceId"]

    @property
    def shape_type(self) -> str:
        return self._d["shapeType"]


class TierTraceConfiguration(Base):
    parent: "Tier"

    NAME = "Tier Name"
    INCLUDE_CONTAINERS = "Include Containers"
    INCLUDE_CONTENT = "Include Content"
    INCLUDE_STRUCTURES = "Include Structures"
    INCLUDE_BARRIERS = "Include Barriers"
    VALIDATE_LOCATABILITY = "Validate Locatability"
    SCOPE = "Traversability Scope"

    HEADER = (
        Header(NAME, "name", json="!tier"),
        Header(INCLUDE_CONTAINERS, "include_containers", json="includeContainers", enum=BooleanType),
        Header(INCLUDE_CONTENT, "include_content", json="includeContent", enum=BooleanType),
        Header(INCLUDE_STRUCTURES, "include_structures", json="includeStructures", enum=BooleanType),
        Header(INCLUDE_BARRIERS, "include_barriers", json="includeBarriers", enum=BooleanType),
        Header(VALIDATE_LOCATABILITY, "validate_locatability", json="validateLocatability", enum=BooleanType),
        Header(SCOPE, "traversability_scope", json="traversabilityScope"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        # These options are not exposed in SetSubnetworkDefinition.
        result.update(
            validateConsistency=True,
            synthesizeGeometries=False,
            includeIsolated=False,
            ignoreBarriersAtStartingPoints=False,
            includeUpToFirstSpatialContainer=False,
            allowIndeterminateFlow=True,
            useDigitizedDirection=False,
            domainNetworkName="",
            tierName=result["!tier"],
            targetTierName="",
            subnetworkName="",
            diagramTemplateName="",
            shortestPathNetworkAttributeName="",
            filterBitsetNetworkAttributeName="",
            maxPaths=-1,
            maxHops=-1,
            arcadeExpressionBarrier="",
            filterScope="junctionsAndEdges",
            nearestNeighbor=dict(
                count=-1,
                costNetworkAttributeName="",
                nearestCategories=[],
                nearestAssets=[],
            ),
            outputFilters=[],
            outputConditions=[],
        )

        return result

    @property
    def name(self) -> ValueWrapper:
        return self.parent.name.as_link()

    @property
    def include_containers(self) -> bool:
        return self._d["includeContainers"]

    @property
    def include_content(self) -> bool:
        return self._d["includeContent"]

    @property
    def include_structures(self) -> bool:
        return self._d["includeStructures"]

    @property
    def include_barriers(self) -> bool:
        return self._d["includeBarriers"]

    @property
    def validate_locatability(self) -> bool:
        return self._d["validateLocatability"]

    @property
    def traversability_scope(self) -> str:
        return self._d["traversabilityScope"]

    def condition_barriers(self) -> BaseCollection:
        return self._make(Condition, self._d["conditionBarriers"])

    def function_barriers(self) -> BaseCollection:
        return self._make(FunctionBarrier, self._d["functionBarriers"])

    def functions(self) -> BaseCollection:
        # Functions support 0...n conditions, so we create a combined copy for each condition.
        functions = []
        empty = dict.fromkeys(["name", "type", "operator", "value", "combineUsingOr", "isSpecificValue"])
        for func in self._d["functions"]:
            for condition in func["conditions"] or [empty]:
                functions.append(func | condition)

        return self._make(Function, functions)

    def propagators(self) -> BaseCollection:
        return self._make(Propagator, self._d["propagators"])


class TerminalPath(Base):
    parent: "TerminalConfiguration"

    CONFIG = "Configuration Name"
    NAME = "Path Name"
    ID = "Path ID"
    DESCRIPTION = "Path Description"

    HEADER = (
        Header(CONFIG, "config_name", json="!config"),
        Header(NAME, "name", json="name"),
        Header(ID, "id", json="id"),
        Header(DESCRIPTION, "description", json="description"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def config_name(self) -> str:
        return to_url(self.parent.name)

    @property
    def id(self) -> int:
        return self._d["id"]

    @property
    def description(self) -> str:
        return self._d["description"]


class Terminal(Base):
    parent: "TerminalConfiguration"

    CONFIG = "Configuration Name"
    NAME = "Terminal Name"
    ID = "Terminal ID"
    UPSTREAM = "Upstream"

    HEADER = (
        Header(CONFIG, "config_name", json="!config"),
        Header(NAME, "name", json="terminalName"),
        Header(ID, "id", json="terminalId"),
        Header(UPSTREAM, "upstream", json="isUpstreamTerminal", enum=BooleanType),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent, name="terminalName")

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result.update(
            isUpstreamTerminal=bool(result["isUpstreamTerminal"]),
        )

        return result

    @property
    def config_name(self) -> str:
        return to_url(self.parent.name)

    @property
    def id(self) -> int:
        return self._d["terminalId"]

    @property
    def upstream(self) -> Optional[bool]:
        if self.parent.directionality.casefold().endswith("bidirectional"):
            return
        return self._d["isUpstreamTerminal"]


class TerminalConfiguration(Base):
    parent: "UtilityNetwork"

    NAME = "Configuration Name"
    ID = "Configuration ID"
    DIRECTION = "Traversability Model"
    DEFAULT = "Default"
    TIME = "Creation Time"

    HEADER = (
        Header(NAME, "name", json="terminalConfigurationName"),
        Header(ID, "id", json="terminalConfigurationId"),
        Header(DIRECTION, "directionality", json="traversabilityModel", enum=esriUtilityNetworkTraversabilityModel),
        Header(DEFAULT, "default", json="defaultConfiguration"),
        Header(TIME, "creation_time", json="creationTime"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent, name="terminalConfigurationName")

    @property
    def id(self) -> int:
        return self._d["terminalConfigurationId"]

    @property
    def creation_time(self) -> "datetime":
        return self._time(self._d["creationTime"])

    @property
    def directionality(self) -> str:
        return self._d["traversabilityModel"]

    @property
    def default(self):
        return self._d["defaultConfiguration"]

    def terminals(self) -> BaseCollection:
        return self._make(Terminal, self._d["terminals"])

    def valid_paths(self) -> BaseCollection:
        return self._make(TerminalPath, self._d["validConfigurationPaths"])


class ValidGroupsTypes(Base):
    parent: "Tier"

    NAME = "Tier Name"
    SOURCE = "Source Name"
    GROUP = "Asset Group"
    TYPE = "Asset Type"
    AGG = "Controller / Aggregated"
    HEADER = (
        Header(NAME, "name", json="!tier"),
        Header(SOURCE, "source_name", json="!source"),
        Header(GROUP, "asset_group", json="!group"),
        Header(TYPE, "asset_type", json="!type"),
        Header(AGG, "subset", json="!subset", enum=BooleanType),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def name(self) -> ValueWrapper:
        return self.parent.name.as_link()

    @property
    def source_name(self) -> str:
        return self._d["source"]

    @property
    def asset_group(self) -> str:
        return self._d["assetGroupName"]

    @property
    def asset_type(self) -> str:
        return self._d["assetTypeName"]

    @property
    def subset(self) -> Optional[bool]:
        return self._d["subset"]


class TierGroup(Base):
    parent: "DomainNetwork"

    HEADER = (
        Header("Domain Network Name", "domain_network", json="!network"),
        Header("Tier Group Name", "name", json="name"),
        Header("Creation Time", "creation_time", json="creationTime"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def domain_network(self) -> ValueWrapper:
        return self.parent.name

    @property
    def creation_time(self) -> "datetime":
        return self._time(self._d["creationTime"])


class Tier(Base):
    parent: "DomainNetwork"

    NAME = "Tier Name"
    DOMAIN = "Domain Network Name"
    ID = "Tier ID"
    RANK = "Tier Rank"
    TOPOLOGY = "Tier Topology"
    FIELD = "Subnetwork Field Name"
    TIER_GROUP = "Tier Group Name"
    DISJOINT = "Supports Disjoint"
    EDIT_DEFAULT = "Edit Mode in Default"
    EDIT_VERSION = "Edit Mode in Version"
    UPDATE_STRUCTURE = "Update Structures"
    UPDATE_CONTAINERS = "Update Containers"
    LOCATABILITY = "Validate Locatability"
    DIRTY = "Manage isDirty"
    TIME = "Creation Time"
    DIAGRAM_TEMPLATES = "Diagram Templates"

    HEADER = (
        Header(DOMAIN, "domain_network", json="!network"),
        Header(TIER_GROUP, "tier_group", json="tierGroupName"),
        Header(NAME, "name", json="name"),
        Header(ID, "id", json="tierID"),
        Header(RANK, "rank", json="rank"),
        Header(TOPOLOGY, "tier_topology", json="tierTopology", enum=esriTierTopologyType),
        Header(DIAGRAM_TEMPLATES, "diagram_templates", json="!diagram"),
        Header(DISJOINT, "supports_disjoint", json="supportDisjointSubnetwork", enum=BooleanType),
        Header(FIELD, "subnetwork_field_name", json="subnetworkFieldName"),
        Header(
            EDIT_DEFAULT,
            "edit_mode_default",
            json="updateSubnetworkEditModeForDefaultVersion",
            enum=esriUpdateSubnetworkEditMode,
        ),
        Header(
            EDIT_VERSION,
            "edit_mode_version",
            json="updateSubnetworkEditModeForNamedVersion",
            enum=esriUpdateSubnetworkEditMode,
        ),
        Header(UPDATE_STRUCTURE, "update_structures", json="updateSubnetworkOnStructures", enum=BooleanType),
        Header(UPDATE_CONTAINERS, "update_containers", json="updateSubnetworkOnContainers", enum=BooleanType),
        Header(LOCATABILITY, "validate_locatability", json="validateLocatability", enum=BooleanType),
        Header(DIRTY, "manage_is_dirty", json="!dirty", enum=BooleanType),
        Header(TIME, "creation_time", json="creationTime"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result.update(
            updateSubnetworkOnSubnetLines=True,
            updateSubnetworkOptions=0,
            manageSubnetwork=dict(
                type="PropertySet",
                propertySetItems=["IsDirty", result.pop("!dirty")],
            ),
            subnetworkFieldName=result["subnetworkFieldName"] or "",
            tierGroupName=result["tierGroupName"] or "",
            diagramTemplates=diagram.split(cls.DELIM) if (diagram := result.pop("!diagram")) else [],
        )

        return result

    @property
    def domain_network(self) -> ValueWrapper:
        return self.parent.name

    @property
    def tier_group(self) -> str:
        return self._d["tierGroupName"]

    @property
    def id(self) -> bool:
        return self._d["tierID"]

    @property
    def creation_time(self) -> "datetime":
        return self._time(self._d["creationTime"])

    @property
    def rank(self) -> int:
        return self._d["rank"]

    @property
    def tier_topology(self) -> str:
        return self._d["tierTopology"]

    @property
    def supports_disjoint(self) -> bool:
        return self._d["supportDisjointSubnetwork"]

    @property
    def subnetwork_field_name(self) -> Optional[str]:
        return self._d["subnetworkFieldName"] or None

    @property
    def edit_mode_default(self) -> str:
        return self._d["updateSubnetworkEditModeForDefaultVersion"]

    @property
    def edit_mode_version(self) -> str:
        return self._d["updateSubnetworkEditModeForNamedVersion"]

    @property
    def update_structures(self) -> bool:
        return self._d["updateSubnetworkOnStructures"]

    @property
    def update_containers(self) -> bool:
        return self._d["updateSubnetworkOnContainers"]

    @property
    def update_subnetlines(self) -> bool:
        return self._d["updateSubnetworkOnSubnetLines"]

    @property
    def validate_locatability(self) -> bool:
        return self._d["validateLocatability"]

    @property
    def diagram_templates(self) -> str:
        return self.DELIM.join(self._d["diagramTemplates"])

    @property
    def manage_is_dirty(self) -> bool:
        property_set = self._property_set(self._d.get("manageSubnetwork", {}))
        return property_set.get("IsDirty", True)

    @staticmethod
    def _flatten(source_name: str, group_type_lookup: dict, data: list, subset: list = None) -> list:
        sub = set()
        for s in subset:
            sub.update((s["assetGroupCode"], a["assetTypeCode"]) for a in s["assetTypes"])

        for d in data:
            group_code = d["assetGroupCode"]
            for asset_type in d["assetTypes"]:
                type_code = asset_type["assetTypeCode"]
                k = (group_code, type_code)
                g, a = group_type_lookup.get(k, k)
                yield dict(
                    source=source_name,
                    assetGroupName=g,
                    assetTypeName=a,
                    assetGroupCode=group_code,
                    assetTypeCode=type_code,
                    subset=None if not sub else (group_code, type_code) in sub,
                )

    def _valid(self, source_name: str, key: str, sub_key: str = None):
        lookup = {}
        for source in self.parent.sources():
            if source.usage_type.endswith(source_name) and not source.usage_type.endswith("SubnetLine"):
                lookup = source.lookup()
                break

        flat = self._flatten(source_name, lookup, self._d[key], self._d.get(sub_key, []))
        return self._make(ValidGroupsTypes, flat)

    def devices(self) -> ValidGroupsTypes:
        return self._valid(
            source_name="Device",
            key="validDevices",
            sub_key="validSubnetworkControllers",
        )

    def junctions(self) -> ValidGroupsTypes:
        return self._valid(source_name="Junction", key="validJunctions")

    def junction_objects(self) -> ValidGroupsTypes:
        return self._valid(
            source_name="JunctionObject",
            key="validJunctionObjects",
            sub_key="validJunctionObjectSubnetworkControllers",
        )

    def lines(self) -> ValidGroupsTypes:
        return self._valid(source_name="Line", key="validLines", sub_key="aggregatedLinesForSubnetLine")

    def edge_objects(self) -> ValidGroupsTypes:
        return self._valid(source_name="EdgeObject", key="validEdgeObjects")

    def trace_configuration(self) -> BaseCollection:
        return self._make(TierTraceConfiguration, [self._d["updateSubnetworkTraceConfiguration"]])


class NetworkAttributeAssignment(Base):
    NAME = "Network Attribute Name"
    SOURCE = "Source Name"
    FIELD = "Field Name"
    HEADER = (
        Header(NAME, "name", json="!na"),
        Header(SOURCE, "source_name", json="attributeSourceName"),
        Header(FIELD, "field_name", json="!field"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result["evaluator"] = dict(fieldName=result.pop("!field"))

        return result

    @property
    def name(self) -> ValueWrapper:
        return self.parent.name.as_link()

    @property
    def source_name(self) -> ValueWrapper:
        from .workspace import Table

        return ValueWrapper.new(Table, self._d["attributeSourceName"])

    @property
    def field_name(self) -> ValueWrapper:
        from .table import Field

        return self.source_name.extend(Field, self._d["evaluator"]["fieldName"])


class NetworkAttribute(Base):
    parent: "BaseNetwork"

    NAME = "Name"
    ID = "ID"
    USAGE = "Usage Type"
    DATA_TYPE = "Data Type"
    FIELD_TYPE = "Field Type"
    INLINE = "Inline"
    DOMAIN = "Domain Name"
    NULLABLE = "Nullable"
    SUBSTITUTION = "Substitution Attribute"
    BIT_POS = "Bit Position"
    BIT_SIZE = "Bit Size"
    JUNCTION_ID = "Junction ID"
    EDGE_ID = "Edge ID"
    TIME = "Creation Time"
    APPORTIONABLE = "Apportionable"

    HEADER = (
        Header(NAME, "name", json="name"),
        Header(ID, "id", json="id"),
        Header(USAGE, "usage_type", json="usageType", enum=esriUtilityNetworkAttributeUsageType),
        Header(DATA_TYPE, "data_type", json="dataType", enum=esriNetworkAttributeDataType),
        Header(FIELD_TYPE, "field_type", json="fieldType", enum=esriFieldTypeNetworkAttribute),
        Header(INLINE, "is_inline", json="isEmbedded", enum=BooleanType),
        Header(DOMAIN, "domain", json="domainName"),
        Header(NULLABLE, "is_nullable", json="isNullable", enum=BooleanType),
        Header(APPORTIONABLE, "is_apportionable", json="isApportionable", enum=BooleanType),
        Header(SUBSTITUTION, "substitution_attribute", json="networkAttributeToSubstitute"),
        Header(BIT_POS, "bit_position", json="bitPosition"),
        Header(BIT_SIZE, "bit_size", json="bitSize"),
        Header(JUNCTION_ID, "junction_id", json="junctionWeightId"),
        Header(EDGE_ID, "edge_id", json="edgeWeightId"),
        Header(TIME, "creation_time", json="creationTime"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        for key in ("domainName", "networkAttributeToSubstitute"):
            if result[key] is None:
                result[key] = ""

        result.update(
            isSubstitution=bool(result["networkAttributeToSubstitute"]),
            isOverridable=False,
        )

        return result

    @property
    def id(self) -> int:
        return self._d["id"]

    @property
    def creation_time(self) -> "datetime":
        return self._time(self._d["creationTime"])

    @property
    def data_type(self) -> str:
        return self._d["dataType"]

    @property
    def field_type(self) -> str:
        return self._d["fieldType"]

    @property
    def usage_type(self) -> str:
        return self._d["usageType"]

    @property
    def is_inline(self) -> bool:
        return self._d["isEmbedded"]

    @property
    def is_apportionable(self) -> bool:
        return self._d["isApportionable"]

    @property
    def is_overridable(self) -> bool:
        return self._d["isOverridable"]

    @property
    def is_substitution(self) -> bool:
        return self._d["isSubstitution"]

    @property
    def is_nullable(self) -> bool:
        return self._d["isNullable"]

    @property
    def domain(self) -> Optional[ValueWrapper]:
        from .workspace import WorkspaceDomain

        if name := self._d["domainName"]:
            return ValueWrapper.new(WorkspaceDomain, name)

    @property
    def substitution_attribute(self) -> Optional[ValueWrapper]:
        return create_value(self, self._d["networkAttributeToSubstitute"], anchor=False)

    @property
    def bit_position(self) -> int:
        return self._d["bitPosition"]

    @property
    def bit_size(self) -> int:
        return self._d["bitSize"]

    @property
    def junction_id(self) -> int:
        return self._d["junctionWeightId"]

    @property
    def edge_id(self) -> int:
        return self._d["edgeWeightId"]

    def assignments(self) -> BaseCollection:
        return self._make(NetworkAttributeAssignment, self._d["assignments"])


class NetworkCategory(Base):
    parent: "UtilityNetwork"

    NAME = "Category Name"
    TIME = "Creation Time"
    HEADER = (
        Header(NAME, "name", json="name"),
        Header(TIME, "creation_time", json="creationTime"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def creation_time(self) -> "datetime":
        return self._time(self._d["creationTime"])


class AssetType(Base):
    parent: "AssetGroup"

    SOURCE = "Source Name"
    GROUP_NAME = "Asset Group Name"
    GROUP_CODE = "Asset Group Code"
    NAME = "Asset Type Name"
    CODE = "Asset Type Code"
    CATEGORIES = "Network Categories"
    TERMINAL = "Terminal Configuration"
    ROLE = "Association Role"
    SCALE = "Containment Scale"
    DELETE = "Delete Type"
    SPLIT = "Split Content"
    VERTEX = "Connectivity Policy"
    TIME = "Creation Time"

    HEADER = (
        Header(SOURCE, "source_name", json="!source"),
        Header(GROUP_NAME, "group_name", json="!group"),
        Header(NAME, "name", json="assetTypeName"),
        Header(GROUP_CODE, "group_code"),
        Header(CODE, "code", json="assetTypeCode"),
        Header(TERMINAL, "terminal", json="terminalConfigurationId"),
        Header(ROLE, "association_role", json="associationRoleType", enum=esriAssociationRoleType),
        Header(DELETE, "delete_semantics", json="associationDeleteType", enum=esriAssociationDeleteType),
        Header(SCALE, "view_scale", json="containmentViewScale"),
        Header(SPLIT, "split_content", json="splitContent", enum=BooleanType),
        Header(VERTEX, "vertex_policy", json="connectivityPolicy", enum=esriNetworkEdgeConnectivityPolicy),
        Header(CATEGORIES, "categories", json="categories"),
        Header(TIME, "creation_time", json="creationTime"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent, name="assetTypeName")

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        if result["associationRoleType"] == esriAssociationRoleType.esriARTContainer.name:
            scale = 1
        else:
            scale = 0

        for key, val in [
            ("associationRoleType", esriAssociationRoleType.esriARTNone.name),
            ("associationDeleteType", esriAssociationDeleteType.esriADTRestricted.name),
            ("connectivityPolicy", esriNetworkEdgeConnectivityPolicy.esriNECPEndVertex.name),
            ("containmentViewScale", scale),
            ("splitContent", False),
            ("categories", []),
        ]:
            if result[key] is None:
                result[key] = val

        if isinstance(cat := result["categories"], str):
            result["categories"] = [c.strip() for c in cat.split(";")]

        return result

    @property
    def source_name(self) -> ValueWrapper:
        return self.parent.parent.name

    @property
    def group_name(self) -> ValueWrapper:
        return self.parent.name

    @property
    def group_code(self) -> int:
        return self.parent.code

    @property
    def code(self) -> int:
        return self._d["assetTypeCode"]

    @property
    def categories(self):
        return self.DELIM.join(sorted(self._d["categories"]))

    @property
    def creation_time(self) -> "datetime":
        return self._time(self._d["creationTime"])

    @property
    def association_role(self) -> Optional[str]:
        if not (role := self._d["associationRoleType"]).endswith("None"):
            return role

    def is_container(self) -> bool:
        return (self.association_role or "").endswith("Container")

    @property
    def delete_semantics(self) -> Optional[str]:
        if self.association_role:
            return self._d["associationDeleteType"]

    @property
    def view_scale(self) -> Optional[int]:
        # View scale is only valid on spatial containers
        if self.is_container() and self.parent.parent.is_spatial():
            return self._d["containmentViewScale"]

    @property
    def split_content(self) -> Optional[bool]:
        # Split content is only valid on linear containers.
        if self.is_container() and self.parent.parent.is_linear():
            return self._d["splitContent"]

    @property
    def terminal(self):
        # Default terminalID is 0.
        if self._d["terminalConfigurationId"]:
            return to_url(self._d["terminalConfigurationName"])

    @property
    def vertex_policy(self) -> Optional[str]:
        # End is the default
        if not (policy := self._d["connectivityPolicy"]).endswith("EndVertex"):
            return policy


class AssetGroup(Base):
    parent: "Source"

    SOURCE = "Source Name"
    NAME = "Asset Group Name"
    CODE = "Asset Group Code"
    COUNT = "# of Asset Types"
    TIME = "Creation Time"

    HEADER = (
        Header(SOURCE, "source_name", json="!source"),
        Header(NAME, "name", json="assetGroupName"),
        Header(CODE, "code", json="assetGroupCode"),
        Header(COUNT, "type_count"),
        Header(TIME, "creation_time", json="creationTime"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent, name="assetGroupName")

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        return result

    @property
    def source_name(self) -> ValueWrapper:
        return self.parent.name

    @property
    def code(self) -> int:
        return self._d["assetGroupCode"]

    @property
    def type_count(self) -> int:
        return len(self._d["assetTypes"])

    def asset_types(self) -> BaseCollection:
        return self._make(AssetType, self._d["assetTypes"])

    @property
    def creation_time(self) -> "datetime":
        return self._time(self._d["creationTime"])


class Source(Base):
    parent: "DomainNetwork"

    DOMAIN_NAME = "Domain Network Name"
    NAME = "Source Name"
    TABLE = "Table"
    USAGE = "Usage Type"
    ID = "Source ID"
    GROUP_COUNT = "# of Asset Groups"
    TYPE_COUNT = "# of Asset Types"

    HEADER = (
        Header(DOMAIN_NAME, "domain_network_name", json="!network"),
        Header(NAME, "name", json="!source"),
        Header(TABLE, "table_name", json="networkSourceName"),
        Header(
            USAGE,
            "usage_type",
            json="utilityNetworkFeatureClassUsageType",
            enum=esriUtilityNetworkFeatureClassUsageType,
        ),
        Header(ID, "id", json="sourceId"),
        Header(GROUP_COUNT, "group_count"),
        Header(TYPE_COUNT, "type_count"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        usage_lookup = {
            "esriUNFCUTStructureJunction": (
                "esriGeometryPoint",
                [
                    "esriNSSPSupportsContainment",
                    "esriNSSPSupportsStructuralAttachments",
                    "esriNSSPSupportsCategories",
                    "esriNSSPSupportsNetworkAttributes",
                ],
            ),
            "esriUNFCUTStructureBoundary": (
                "esriGeometryPolygon",
                [
                    "esriNSSPSupportsContainment",
                    "esriNSSPSupportsCategories",
                    "esriNSSPSupportsNetworkAttributes",
                ],
            ),
            "esriUNFCUTStructureJunctionObject": (
                "esriGeometryNull",
                [
                    "esriNSSPSupportsContainment",
                    "esriNSSPSupportsStructuralAttachments",
                    "esriNSSPSupportsCategories",
                    "esriNSSPSupportsNetworkAttributes",
                ],
            ),
            "esriUNFCUTStructureLine": (
                "esriGeometryPolyline",
                [
                    "esriNSSPSupportsContainment",
                    "esriNSSPSupportsCategories",
                    "esriNSSPSupportsNetworkAttributes",
                ],
            ),
            "esriUNFCUTStructureEdgeObject": (
                "esriGeometryNull",
                [
                    "esriNSSPSupportsContainment",
                    "esriNSSPSupportsCategories",
                    "esriNSSPSupportsNetworkAttributes",
                ],
            ),
            "esriUNFCUTDevice": (
                "esriGeometryPoint",
                [
                    "esriNSSPSupportsContainment",
                    "esriNSSPSupportsCategories",
                    "esriNSSPSupportsTerminals",
                    "esriNSSPSupportsNetworkAttributes",
                ],
            ),
            "esriUNFCUTAssembly": (
                "esriGeometryPoint",
                [
                    "esriNSSPSupportsContainment",
                    "esriNSSPSupportsCategories",
                    "esriNSSPSupportsNetworkAttributes",
                ],
            ),
            "esriUNFCUTJunction": (
                "esriGeometryPoint",
                [
                    "esriNSSPSupportsContainment",
                    "esriNSSPSupportsCategories",
                    "esriNSSPSupportsNetworkAttributes",
                ],
            ),
            "esriUNFCUTJunctionObject": (
                "esriGeometryNull",
                [
                    "esriNSSPSupportsContainment",
                    "esriNSSPSupportsCategories",
                    "esriNSSPSupportsTerminals",
                    "esriNSSPSupportsNetworkAttributes",
                ],
            ),
            "esriUNFCUTLine": (
                "esriGeometryPolyline",
                [
                    "esriNSSPSupportsContainment",
                    "esriNSSPSupportsCategories",
                    "esriNSSPSupportsNetworkAttributes",
                ],
            ),
            "esriUNFCUTSubnetLine": (
                "esriGeometryPolyline",
                [
                    "esriNSSPSupportsNone",
                ],
            ),
            "esriUNFCUTEdgeObject": (
                "esriGeometryNull",
                [
                    "esriNSSPSupportsContainment",
                    "esriNSSPSupportsCategories",
                    "esriNSSPSupportsNetworkAttributes",
                ],
            ),
        }

        usage = result["utilityNetworkFeatureClassUsageType"]
        result.update(
            assetTypeFieldName="ASSETTYPE",
            usesGeometry=usage in esriUtilityNetworkFeatureClassUsageType.uses_geometry(),
            shapeType=usage_lookup[usage][0],
            supportedProperties=usage_lookup[usage][1],
        )

        return result

    def lookup(self) -> dict:
        """AG/AT lookup"""
        return self._d["lookup"]

    def usage_name(self) -> str:
        """The unique source name, ignoring renames or collisions"""
        network: DomainNetwork = self.parent
        if network.is_structure_network:
            prefix = ""
        else:
            prefix = network.name.value

        return prefix + self._strip("esriUNFCUT", self.usage_type)

    @property
    def domain_network_name(self) -> ValueWrapper:
        return self.parent.name

    def table(self) -> Table:
        """The Table the source is referencing"""
        return self.get_gdb().get_child(Table, self._d["networkSourceName"])

    @property
    def table_name(self) -> ValueWrapper:
        return self.table().name.as_link()

    @property
    def usage_type(self) -> str:
        return self._d["utilityNetworkFeatureClassUsageType"]

    @property
    def id(self) -> int:
        return self._d["sourceId"]

    @property
    def group_count(self) -> int:
        return len(self._d["assetGroups"])

    @property
    def type_count(self) -> int:
        return sum(len(x["assetTypes"]) for x in self._d["assetGroups"])

    def asset_groups(self) -> BaseCollection:
        return self._make(AssetGroup, self._d["assetGroups"])

    def is_spatial(self) -> bool:
        return not self.usage_type.endswith("Object")

    def is_linear(self) -> bool:
        return self.usage_type.endswith(("Line", "EdgeObject"))

    def supports_terminals(self) -> bool:
        jo = "JunctionObject"
        return self.usage_type.endswith(("Device", jo)) and not self.usage_type.endswith(f"Structure{jo}")


class DomainNetwork(Base):
    parent: "UtilityNetwork"

    NAME = "Domain Network Name"
    ALIAS = "Domain Network Alias"
    ID = "Domain Network ID"
    TIER = "Tier Definition"
    CONTROLLER_TYPE = "Subnetwork Controller Type"
    TIME = "Creation Time"

    HEADER = (
        Header(NAME, "name", json="domainNetworkName"),
        Header(ALIAS, "alias", json="domainNetworkAliasName"),
        Header(ID, "id", json="domainNetworkId"),
        Header(TIER, "tier_definition", json="tierDefinition", enum=esriTierDefinition),
        Header(CONTROLLER_TYPE, "subnetwork_controller_type", json="subnetworkControllerType"),
        Header(TIME, "creation_time", json="creationTime"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent, name="domainNetworkName")

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result.update(
            isStructureNetwork=result["tierDefinition"] == esriTierDefinition.esriTDNone.name,
            releaseNumber=1,
            subnetworkControllerType=result["subnetworkControllerType"] or "",
            subnetworkLabelFieldName="",
            subnetworkLayerId=-1,
        )

        return result

    @property
    def is_structure_network(self) -> bool:
        return self._d["isStructureNetwork"]

    @property
    def alias(self) -> str:
        return self._d["domainNetworkAliasName"] or self.name

    @property
    def id(self) -> int:
        return self._d["domainNetworkId"]

    @property
    def creation_time(self) -> "datetime":
        return self._time(self._d["creationTime"])

    @property
    def release_number(self) -> int:
        return self._d["releaseNumber"]

    @property
    def tier_definition(self) -> str:
        return self._d["tierDefinition"]

    @property
    def subnetwork_controller_type(self) -> str:
        return self._d["subnetworkControllerType"]

    def sources(self) -> BaseCollection:
        return self._make(Source, self._d["junctionSources"] + self._d["edgeSources"])

    def tier_groups(self) -> BaseCollection:
        return self._make(TierGroup, self._d["tierGroups"])

    def tiers(self) -> BaseCollection:
        return self._make(Tier, self._d["tiers"])

    def get_source(self, usage: esriUtilityNetworkFeatureClassUsageType) -> Optional["Source"]:
        source: Source
        for source in self.sources():
            if source.usage_type == usage.name:
                return source


class BaseNetwork(SpatialDataElementBase):
    """Base class for UN/TN"""

    TIME = "Creation Time"
    VERSION = "Schema Generation"
    PRO_VERSION = "Pro Version"
    PORTAL_USER = "User Identity"

    HEADER = (
        *DataElementBase.HEADER,
        Header(VERSION, "schema_version", json="schemaGeneration"),
        Header(PRO_VERSION, "pro_version", json="proVersion"),
        Header(PORTAL_USER, "user", json="userIdentity"),
        Header(TIME, "creation_time", json="creationTime"),
        *SpatialDataElementBase.HEADER,
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def schema_version(self) -> int:
        return self._d["schemaGeneration"]

    @property
    def pro_version(self) -> str:
        return self._d["proVersion"]

    @property
    def user(self) -> str:
        return self._d["userIdentity"]

    @property
    def creation_time(self) -> "datetime":
        return self._time(self._d["creationTime"])

    def network_attributes(self) -> BaseCollection:
        return self._make(NetworkAttribute, self._d["networkAttributes"])

    def network_attributes_assignments(self) -> BaseCollection:
        return self._make(
            NetworkAttributeAssignment,
            (x.assignments() for x in self.network_attributes()),
            merge=True,
        )


class TraceNetwork(BaseNetwork):
    SHEET_PREFIX = "TN"

    def __init__(self, data, parent):
        super().__init__(data, parent)

    def sources(self) -> BaseCollection:
        return self._make(TraceSource, self._d["sources"])

    def _ordered(self) -> list["BaseCollection"]:
        return [
            self.sources(),
            self.network_attributes(),
            self.network_attributes_assignments(),
        ]


class UtilityNetwork(BaseNetwork):
    SHEET_PREFIX = "UN"
    SERVICE_TERRITORY = "Service Territory"

    HEADER = (
        *BaseNetwork.HEADER,
        Header(SERVICE_TERRITORY, "service_territory", json="serviceTerritoryFeatureClassName"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

        # Inject some custom keys to make downstream lookup/traversal easier and more efficient.
        terminal_lookup = {t.id: t.name for t in self.terminal_configurations()}
        for source in self.sources():
            source._d["name"] = source.usage_name()
            source._d["lookup"] = lookup = {}
            for g in source.asset_groups():
                for a in g.asset_types():
                    lookup[(g.code, a.code)] = (g.name, a.name)
                    a._d["terminalConfigurationName"] = terminal_lookup.get(a._d["terminalConfigurationId"])

    @classmethod
    def to_json(cls, data: dict) -> dict:
        import uuid

        result = super().to_json(data)

        result.update(
            changeTracked=False,
            replicaTracked=False,
            configurationKeyword="",
            createDirtyAreaForAnyAttributeUpdate=0,
            minimalDirtyAreaSize=1,
            userIdentity=result["userIdentity"] or "",
            properties=dict(propertySetItems=[], type="PropertySet"),
            globalId=uuid.uuid4(),
            versioned=False,
            associationSource=dict(sourceId=1, layerId=500001, elementType="esriNETEdge"),
            systemJunctionSource=dict(sourceId=2, elementType="esriNETJunction"),
            systemJunctionObjectSource=dict(sourceId=3),
        )

        return result

    @property
    def service_territory(self):
        from .workspace import FeatureClass

        return ValueWrapper.new(FeatureClass, self._d["serviceTerritoryFeatureClassName"])

    def categories(self) -> BaseCollection:
        return self._make(NetworkCategory, self._d["categories"])

    def terminal_configurations(self) -> BaseCollection:
        return self._make(TerminalConfiguration, self._d["terminalConfigurations"])

    def terminal_configurations_terminals(self) -> BaseCollection:
        return self._make(
            Terminal,
            (t.terminals() for t in self.terminal_configurations()),
            merge=True,
        )

    def terminal_configurations_paths(self) -> BaseCollection:
        return self._make(
            TerminalPath,
            (t.valid_paths() for t in self.terminal_configurations()),
            merge=True,
        )

    def domain_networks(self) -> BaseCollection:
        return self._make(DomainNetwork, self._d["domainNetworks"])

    def sources(self) -> BaseCollection:
        return self._make(Source, (d.sources() for d in self.domain_networks()), merge=True)

    def asset_groups(self) -> BaseCollection:
        return self._make(AssetGroup, (s.asset_groups() for s in self.sources()), merge=True)

    def asset_types(self) -> BaseCollection:
        return self._make(AssetType, (a.asset_types() for a in self.asset_groups()), merge=True)

    def tiers(self) -> BaseCollection:
        return self._make(Tier, (d.tiers() for d in self.domain_networks()), merge=True)

    def tier_groups(self) -> BaseCollection:
        return self._make(TierGroup, (d.tier_groups() for d in self.domain_networks()), merge=True)

    def tier_valid_objects(self) -> BaseCollection:
        everything = []
        tier: Tier
        for tier in self.tiers():
            for c in (
                tier.devices,
                tier.lines,
                tier.junctions,
                tier.junction_objects,
                tier.edge_objects,
            ):
                everything.append(c())

        return self._make(ValidGroupsTypes, everything, merge=True)

    def tier_trace_configurations(self) -> BaseCollection:
        return self._make(
            TierTraceConfiguration,
            (t.trace_configuration() for t in self.tiers()),
            merge=True,
        )

    def tier_condition_barriers(self) -> BaseCollection:
        return self._make(
            Condition,
            (t.condition_barriers() for t in self.tier_trace_configurations()),
            merge=True,
        )

    def tier_function_barriers(self) -> BaseCollection:
        return self._make(
            FunctionBarrier,
            (t.function_barriers() for t in self.tier_trace_configurations()),
            merge=True,
        )

    def tier_functions(self) -> BaseCollection:
        return self._make(
            Function,
            (t.functions() for t in self.tier_trace_configurations()),
            merge=True,
        )

    def tier_propagators(self) -> BaseCollection:
        return self._make(
            Propagator,
            (t.propagators() for t in self.tier_trace_configurations()),
            merge=True,
        )

    def _ordered(self) -> list[BaseCollection]:
        order = [
            self.domain_networks(),
            self.tier_groups(),
            self.tiers(),
            self.tier_valid_objects(),
            self.tier_trace_configurations(),
            self.tier_functions(),
            self.tier_condition_barriers(),
            self.tier_function_barriers(),
            self.tier_propagators(),
            self.sources(),
            self.asset_groups(),
            self.asset_types(),
            self.categories(),
            self.terminal_configurations(),
            self.terminal_configurations_terminals(),
            self.terminal_configurations_paths(),
            self.network_attributes(),
            self.network_attributes_assignments(),
        ]
        return order
