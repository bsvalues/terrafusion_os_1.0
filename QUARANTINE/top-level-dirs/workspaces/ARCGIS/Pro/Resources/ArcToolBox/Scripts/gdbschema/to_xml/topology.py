from . import helper
from .helper import *


class Topology:
    def __init__(self, controller: dict):
        self.payload = controller

    def convert_properties(self):
        d = self.payload

        return [
            E.ClusterTolerance(d["clusterTolerance"]),
            E.ZClusterTolerance(d["zClusterTolerance"]),
            E.MaxGeneratedErrorCount(d["maxGeneratedErrorCount"]),
            helper.create_names("FeatureClassNames", d["layers"], key="layerId"),
            E.TopologyRules(
                make_type("ArrayOfTopologyRule"),
                *(self._convert_rules(r) for r in d["topologyRules"]),
            ),
            E.TopologyID(-1),
            E.EditorTrackingEnabled(d["editorTrackingEnabled"]),
            E.CreatorFieldName(d["creatorFieldName"] or None),
            E.CreatedAtFieldName(d["createdAtFieldName"] or None),
            E.EditorFieldName(d["lastEditorFieldName"] or None),
            E.EditedAtFieldName(d["editedAtFieldName"] or None),
            E.IsTimeInUTC(True),
            helper.create_element_with_type("Properties", None),
        ]

    @staticmethod
    def _convert_rules(rule: dict):
        return E.TopologyRule(
            make_type("TopologyRule"),
            E.HelpString(rule["helpString"]),
            E.RuleID(rule["ruleId"]),
            E.Name(rule["name"]),
            E.GUID(rule["guid"]),
            E.TopologyRuleType(rule["topologyRuleType"]),
            E.OriginClassID(rule["originClassID"]),
            E.OriginSubtype(rule["originSubtype"]) if "originSubtype" in rule else None,
            E.DestinationClassID(rule["destinationClassID"]),
            E.DestinationSubtype(rule["destinationSubtype"]) if "destinationSubtype" in rule else None,
            E.TriggerErrorEvents(rule["triggerErrorEvents"]),
            E.AllOriginSubtypes(rule["allOriginSubtypes"]),
            E.AllDestinationSubtypes(rule["allDestinationSubtypes"]),
        )
