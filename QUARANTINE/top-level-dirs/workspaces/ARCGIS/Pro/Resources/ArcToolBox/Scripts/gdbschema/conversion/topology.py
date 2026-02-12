from .helper import *
from .workspace import DataElementBase
from ..constants import *

__all__ = [
    "Topology",
]


class TopologyClass(Base):
    parent: "Topology"

    NAME = "Class Name"

    HEADER = (
        Header(NAME, "name", json="layerId"),
        Header("XY Rank", "xy_rank"),
        Header("Z Rank", "z_rank"),
        Header("Weight", "weight"),
        Header("Event Notification", "eventing", enum=BooleanType),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent, name="layerId")

    def table(self):
        return self.get_table(self._d[self._name])

    def membership(self):
        if table := self.table():
            return table.get_controller_info(Topology)
        return {}

    @property
    def name(self):
        if table := self.table():
            return table.name.as_link()
        return self._d[self._name]

    @property
    def xy_rank(self) -> int:
        return self.membership().get("xyRank")

    @property
    def z_rank(self) -> int:
        return self.membership().get("zRank")

    @property
    def weight(self) -> int:
        return self.membership().get("weight")

    @property
    def eventing(self) -> bool:
        return self.membership().get("eventNotificationOnValidate")


class TopologyRule(Base):
    parent: "Topology"

    HEADER = (
        Header("Name", "name", json="name"),
        Header("Rule Type", "rule_type", json="topologyRuleType", enum=esriTopologyRuleType),
        Header("Origin Class", "origin_table", json="originClassID"),
        Header("Origin Subtype", "origin_subtype", json="originSubtype"),
        Header("Destination Class", "destination_table", json="destinationClassID"),
        Header("Destination Subtype", "destination_subtype", json="destinationSubtype"),
        Header("Rule ID", "id", json="ruleId"),
        Header("Rule GUID", "guid", json="guid"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        for prefix in ("origin", "destination"):
            result[f"all{prefix.title()}Subtypes"] = result[f"{prefix}Subtype"] is None

        if result["name"] is None:
            result["name"] = ""

        result.update(
            triggerErrorEvents=False,
            helpString="",
        )

        return result

    def origin(self):
        return self.get_table(self._d["originClassID"])

    def destination(self):
        return self.get_table(self._d["destinationClassID"])

    @property
    def id(self) -> int:
        return self._d["ruleId"]

    @property
    def help(self) -> str:
        return self._d["helpString"] or None

    @property
    def guid(self) -> str:
        return self._d["guid"]

    @property
    def rule_type(self) -> str:
        return self._d["topologyRuleType"]

    @property
    def origin_table(self):
        if table := self.origin():
            return table.name.as_link()

        return self._d["originClassID"]

    @property
    def destination_table(self):
        if table := self.destination():
            return table.name.as_link()

        return self._d["destinationClassID"]

    @property
    def all_origin_subtypes(self) -> bool:
        return self._d["allOriginSubtypes"]

    @property
    def all_destination_subtypes(self) -> bool:
        return self._d["allDestinationSubtypes"]

    @property
    def origin_subtype(self):
        if self.all_origin_subtypes or not (table := self.origin()):
            return
        if subtype := table.get_subtype(code := self._d["originSubtype"]):
            return subtype.name.as_link()
        return code

    @property
    def destination_subtype(self):
        if self.all_destination_subtypes or not (table := self.destination()):
            return
        if subtype := table.get_subtype(code := self._d["destinationSubtype"]):
            return subtype.name.as_link()
        return code


class Topology(DataElementBase):
    SHEET_PREFIX = "TO"

    HEADER = (
        *DataElementBase.HEADER,
        Header("XY Tolerance", "xy_tolerance", json="clusterTolerance"),
        Header("Z Tolerance", "z_tolerance", json="zClusterTolerance"),
        Header("Max Error Count", "max_error_count", json="maxGeneratedErrorCount"),
        *DataElementBase.EDITOR_TRACKING,
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        for k in ("creatorFieldName", "createdAtFieldName", "lastEditorFieldName", "editedAtFieldName"):
            if result[k] is None:
                result[k] = ""

        result.pop("isTimeInUTC", None)

        result.update(
            changeTracked=False,
            replicaTracked=False,
            versioned=False,
            configurationKeyword="",
        )

        return result

    @property
    def xy_tolerance(self) -> float:
        return self._d["clusterTolerance"]

    @property
    def z_tolerance(self) -> float:
        return self._d["zClusterTolerance"]

    @property
    def max_error_count(self) -> int:
        return self._d["maxGeneratedErrorCount"]

    def rules(self) -> BaseCollection:
        return self._make(TopologyRule, self._d["topologyRules"])

    def classes(self) -> BaseCollection:
        return self._make(TopologyClass, self._d["layers"])

    def _ordered(self) -> list["BaseCollection"]:
        return [
            self.classes(),
            self.rules(),
        ]
