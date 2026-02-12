from . import helper
from .helper import *
from ..common import change_first_character, get_qualification_prefix
from ..date_utils import to_datetime_str


class UtilityNetwork:
    def __init__(self, controller: dict):
        self.payload = controller

    @staticmethod
    def _add_prefix(prefix: str, val: str) -> str:
        """Adds esri enum prefix"""
        if val.startswith(prefix):
            return val
        return prefix + change_first_character(val, lower=False)

    def convert_properties(self):
        d = self.payload

        system_prefix = f"{get_qualification_prefix(d['name'])}UN_{d['dsId']}"

        return [
            E.CreationTime(to_datetime_str(d["creationTime"])),
            E.SchemaGeneration(d["schemaGeneration"]),
            E.GlobalID(d["globalId"]),
            E.UserIdentity(d["userIdentity"] or None),
            helper.create_property_sets("Properties", d["properties"]),
            E.ProVersion(d["proVersion"]),
            E.ServiceTerritoryFeatureClassName(d["serviceTerritoryFeatureClassName"]),
            E.MinimalDirtyAreaSize(d["minimalDirtyAreaSize"]),
            E.CreateDirtyAreaForAnyAttributeUpdate(bool(d["createDirtyAreaForAnyAttributeUpdate"])),
            E.AssociationSource(
                make_type("AssociationSource"),
                E.ID(1),
                E.ClassID(-1),
                E.Name(f"{system_prefix}_Associations"),
                E.ElementType("esriNETEdge"),
            ),
            E.SystemJunctionSource(
                make_type("SystemJunctionSource"),
                E.ID(2),
                E.ClassID(-1),
                E.Name(f"{system_prefix}_SystemJunctions"),
                E.ElementType("esriNETJunction"),
            ),
            E.SystemJunctionObjectSource(
                make_type("SystemJunctionObjectSource"),
                E.ID(3),
            ),
        ]

    @staticmethod
    def convert_asset_type(asset: dict):
        return E.AssetType(
            make_type("AssetType"),
            E.CreationTime(to_datetime_str(asset["creationTime"])),
            E.AssetTypeCode(asset["assetTypeCode"]),
            E.AssetTypeName(asset["assetTypeName"]),
            E.ContainmentViewScale(asset["containmentViewScale"]),
            E.AssociationDeleteType(asset["associationDeleteType"]),
            E.AssociationRoleType(asset["associationRoleType"]),
            E.IsTerminalConfigurationSupported(asset["isTerminalConfigurationSupported"]),
            E.TerminalConfigurationID(asset["terminalConfigurationId"]),
            E.IsLinearConnectivityPolicySupported(asset["isLinearConnectivityPolicySupported"]),
            E.ConnectivityPolicy(asset["connectivityPolicy"]),
            helper.create_strings("UNCategories", asset["categories"]),
            E.SplitContent(asset["splitContent"]),
        )

    def convert_asset_group(self, group: dict):
        return E.AssetGroup(
            make_type("AssetGroup"),
            E.CreationTime(to_datetime_str(group["creationTime"])),
            E.AssetGroupCode(group["assetGroupCode"]),
            E.AssetGroupName(group["assetGroupName"]),
            E.AssetTypes(
                make_type("ArrayOfAssetType"),
                *(self.convert_asset_type(a) for a in group["assetTypes"]),
            ),
        )

    def convert_source(self, source: dict, source_type: str):
        return E(
            source_type,
            make_type(source_type),
            E.NetworkSourceID(source["sourceId"]),
            E.ObjectClassID(source["objectClassId"]),
            E.NetworkSourceName(source["networkSourceName"]),
            E.UsesGeometry(source["usesGeometry"]),
            E.ShapeType(source["shapeType"]),
            E.UtilityNetworkFeatureClassUsageType(source["utilityNetworkFeatureClassUsageType"]),
            E.AssetTypeFieldName(source["assetTypeFieldName"]),
            E.SupportedProperties(
                make_type("ArrayOfSupportedProperty"),
                *(
                    E.SupportedProperty(
                        make_type("SupportedProperty"),
                        E.Value(p),
                    )
                    for p in source["supportedProperties"]
                ),
            ),
            E.AssetGroups(
                make_type("ArrayOfAssetGroup"),
                *(self.convert_asset_group(g) for g in source["assetGroups"]),
            ),
        )

    @staticmethod
    def convert_tier_group(group: dict):
        return E.TierGroup(
            make_type("TierGroup"),
            E.CreationTime(to_datetime_str(group["creationTime"])),
            E.Name(group["name"]),
        )

    @staticmethod
    def _tier_asset_group(group: dict):
        return E.AssetGroup(
            make_type("AssetGroup"),
            E.AssetGroupCode(group["assetGroupCode"]),
            E.AssetTypes(
                make_type("ArrayOfAssetType"),
                *(
                    E.AssetType(make_type("AssetType"), E.AssetTypeCode(t["assetTypeCode"]))
                    for t in group["assetTypes"]
                ),
            ),
        )

    def tier_valid_objects(self, key: str, data: list):
        return E(
            key,
            make_type("ArrayOfAssetGroup"),
            *(self._tier_asset_group(d) for d in data),
        )

    @staticmethod
    def convert_condition(condition: dict):
        """Condition/Filter Barriers"""
        return E.Condition(
            make_type("Condition"),
            E.Name(condition["name"]),
            E.Type(UtilityNetwork._add_prefix("esriCT", condition["type"])),
            E.Operator(UtilityNetwork._add_prefix("esriTO", condition["operator"])),
            helper.create_element_with_type("Value", condition["value"]),
            E.CombineUsingOr(condition["combineUsingOr"]),
            E.IsSpecificValue(condition["isSpecificValue"]),
        )

    @staticmethod
    def convert_function_barrier(barrier: dict):
        """Function/FilterFunction Barriers"""
        return E.FunctionBarrier(
            make_type("FunctionBarrier"),
            E.TraceFunctionType(UtilityNetwork._add_prefix("esriTFT", barrier["functionType"])),
            E.NetworkAttributeName(barrier["networkAttributeName"]),
            E.Operator(UtilityNetwork._add_prefix("esriTO", barrier["operator"])),
            helper.create_element_with_type("Value", barrier["value"]),
            E.UseLocalValues(barrier["useLocalValues"]),
        )

    @staticmethod
    def convert_function(func: dict):
        """Summaries"""
        return E.Function(
            make_type("Function"),
            E.TraceFunctionType(UtilityNetwork._add_prefix("esriTFT", func["functionType"])),
            E.NetworkAttributeName(func["networkAttributeName"]),
            E.Conditions(
                make_type("ArrayOfCondition"),
                *(UtilityNetwork.convert_condition(c) for c in func["conditions"]),
            ),
            E.SummaryAttributeName(func["summaryAttributeName"]),
        )

    @staticmethod
    def convert_propagator(prop: dict):
        """Propagators"""
        return E.Propagator(
            make_type("Propagator"),
            E.NetworkAttributeName(prop["networkAttributeName"]),
            E.SubstitutionAttributeName(prop["substitutionAttributeName"] or None),
            E.TracePropagatorFunctionType(UtilityNetwork._add_prefix("esriTPFT", prop["propagatorFunctionType"])),
            E.Operator(UtilityNetwork._add_prefix("esriTO", prop["operator"])),
            helper.create_element_with_type("Value", prop["value"]),
            E.PropagatedAttributeName(prop["propagatedAttributeName"] or None),
        )

    def convert_subnetwork_configuration(self, config: dict):
        return E.UpdateSubnetworkTraceConfiguration(
            make_type("TraceConfiguration"),
            E.IncludeContainers(config["includeContainers"]),
            E.IncludeContent(config["includeContent"]),
            E.IncludeStructures(config["includeStructures"]),
            E.IncludeBarriers(config["includeBarriers"]),
            E.ValidateConsistency(config["validateConsistency"]),
            E.ValidateLocatability(config["validateLocatability"]),
            E.SynthesizeGeometries(config.get("synthesizeGeometries", False)),
            E.IncludeIsolated(config["includeIsolated"]),
            E.IgnoreBarriersAtStartingPoints(config["ignoreBarriersAtStartingPoints"]),
            E.IncludeUpToFirstSpatialContainer(config["includeUpToFirstSpatialContainer"]),
            E.AllowIndeterminateFlow(config["allowIndeterminateFlow"]),
            E.UseDigitizedDirection(config.get("useDigitizedDirection", False)),
            E.DomainNetworkName(config["domainNetworkName"] or None),
            E.TierName(config["tierName"] or None),
            E.TargetTierName(config["targetTierName"] or None),
            E.SubnetworkName(config["subnetworkName"] or None),
            E.DiagramTemplateName(config["diagramTemplateName"] or None),
            E.ShortestPathNetworkAttributeName(config["shortestPathNetworkAttributeName"] or None),
            E.FilterBitsetNetworkAttributeName(config["filterBitsetNetworkAttributeName"] or None),
            E.MaxPaths(config.get("maxPaths") or -1),
            E.MaxHops(config.get("maxHops") or -1),
            E.TraversabilityScope(self._add_prefix("esriTS", config["traversabilityScope"])),
            E.ConditionBarriers(
                make_type("ArrayOfCondition"),
                *(self.convert_condition(c) for c in config["conditionBarriers"]),
            ),
            E.FunctionBarriers(
                make_type("ArrayOfFunctionBarrier"),
                *(self.convert_function_barrier(b) for b in config["functionBarriers"]),
            ),
            E.ArcadeExpressionBarrier(),
            E.FilterBarriers(
                make_type("ArrayOfCondition"),
            ),
            E.FilterFunctionBarriers(
                make_type("ArrayOfFunctionBarrier"),
            ),
            E.FilterScope(self._add_prefix("esriTS", config["filterScope"])),
            E.Functions(
                make_type("ArrayOfFunction"),
                *(self.convert_function(f) for f in config["functions"]),
            ),
            E.NearestNeighbor(
                make_type("NearestNeighbor"),
                E.Count(-1),
                E.CostNetworkAttributeName(),
                E.NearestCategories(make_type("ArrayOfString")),
                E.NearestAssets(make_type("ArrayOfAsset")),
            ),
            E.OutputFilters(
                make_type("ArrayOfOutputFilter"),
            ),
            E.OutputConditions(
                make_type("ArrayOfCondition"),
            ),
            E.Propagators(
                make_type("ArrayOfPropagator"),
                *(self.convert_propagator(p) for p in config["propagators"]),
            ),
        )

    def convert_tier(self, tier: dict):
        valid_objects = []
        for key in (
            "Devices",
            "SubnetworkControllers",
            "Lines",
            "Junctions",
            "JunctionObjects",
            "JunctionObjectSubnetworkControllers",
            "EdgeObjects",
        ):
            valid_objects.append(self.tier_valid_objects(f"Valid{key}", tier[f"valid{key}"]))
        valid_objects.append(
            self.tier_valid_objects("AggregatedLinesForSubnetLine", tier["aggregatedLinesForSubnetLine"])
        )

        return E.Tier(
            make_type("Tier"),
            E.CreationTime(to_datetime_str(tier["creationTime"])),
            E.TierID(tier["tierID"]),
            E.Name(tier["name"]),
            E.Rank(tier["rank"]),
            E.TierTopology(tier["tierTopology"]),
            E.SupportDisjointSubnetwork(tier["supportDisjointSubnetwork"]),
            E.SubnetworkFieldName(tier["subnetworkFieldName"] or None),
            E.TierGroupName(tier["tierGroupName"] or None),
            helper.create_property_sets("ManageSubnetwork", tier["manageSubnetwork"]),
            E.UpdateSubnetworkEditModeForDefaultVersion(tier["updateSubnetworkEditModeForDefaultVersion"]),
            E.UpdateSubnetworkEditModeForNamedVersion(tier["updateSubnetworkEditModeForNamedVersion"]),
            E.UpdateSubnetworkOnStructures(tier["updateSubnetworkOnStructures"]),
            E.UpdateSubnetworkOnContainers(tier["updateSubnetworkOnContainers"]),
            E.UpdateSubnetworkOnSubnetLines(tier["updateSubnetworkOnSubnetLines"]),
            E.ValidateLocatability(tier["validateLocatability"]),
            E.UpdateSubnetworkOptions(tier["updateSubnetworkOptions"]),
            *valid_objects,
            # TODO: diagram template definitions are not exposed in JSON.
            helper.create_strings("DiagramTemplates", []),
            # helper.create_strings("DiagramTemplates", tier["diagramTemplates"]),
            self.convert_subnetwork_configuration(tier["updateSubnetworkTraceConfiguration"]),
        )

    def convert_domain_network(self, network: dict):
        return E.DomainNetwork(
            make_type("DomainNetwork"),
            E.CreationTime(to_datetime_str(network["creationTime"])),
            E.ReleaseNumber(network["releaseNumber"]),
            E.IsStructureNetwork(is_structure := network["isStructureNetwork"]),
            E.DomainNetworkID(network["domainNetworkId"]),
            E.DomainNetworkName(name := network["domainNetworkName"]),
            E.DomainNetworkAliasName(network["domainNetworkAliasName"]),
            E.SubnetworkTableName(None if is_structure else name + "SubnetLine"),
            E.SubnetworkLabelFieldName(None if is_structure else "SUBNETWORKNAME"),
            E.TierDefinition(network["tierDefinition"]),
            E.SubnetworkControllerType(network["subnetworkControllerType"] or None),
            E.TierGroups(
                make_type("ArrayOfTierGroup"),
                *(self.convert_tier_group(group) for group in network["tierGroups"]),
            ),
            E.Tiers(
                make_type("ArrayOfTier"),
                *(self.convert_tier(tier) for tier in network["tiers"]),
            ),
            E.JunctionSources(
                make_type("ArrayOfJunctionSource"),
                *(self.convert_source(s, "JunctionSource") for s in network["junctionSources"]),
            ),
            E.EdgeSources(
                make_type("ArrayOfEdgeSource"),
                *(self.convert_source(s, "EdgeSource") for s in network["edgeSources"]),
            ),
        )

    def convert_domain_networks(self):
        return E.DomainNetworks(
            make_type("ArrayOfDomainNetwork"),
            *(self.convert_domain_network(n) for n in self.payload["domainNetworks"]),
        )

    @staticmethod
    def convert_category(cat: dict):
        return E.UNCategory(
            make_type("UNCategory"),
            E.CreationTime(to_datetime_str(cat["creationTime"])),
            E.Name(cat["name"]),
        )

    def convert_categories(self):
        return E.UNCategories(
            make_type("ArrayOfUNCategory"),
            *(self.convert_category(cat) for cat in self.payload["categories"]),
        )

    @staticmethod
    def convert_na_assignment(a: dict):
        return E.UtilityNetworkAssignment(
            make_type("UtilityNetworkAssignment"),
            E.AttributeID(a["networkAttributeId"]),
            E.AttributeSourceName(a["attributeSourceName"]),
            E.AttributeEvaluator(
                make_type("UtilityNetworkFieldEvaluator"),
                E.FieldName(a["evaluator"]["fieldName"]),
            ),
        )

    def convert_network_attribute(self, na: dict):
        return E.UtilityNetworkAttribute(
            make_type("UtilityNetworkAttribute"),
            E.CreationTime(to_datetime_str(na["creationTime"])),
            E.AttributeID(na["id"]),
            E.AttributeName(na["name"]),
            E.NetworkAttributeToSubstitute(na["networkAttributeToSubstitute"] or None),
            E.AttributeDataType(na["dataType"]),
            E.AttributeFieldType(na["fieldType"]),
            E.AttributeUsageType(na["usageType"]),
            E.IsEmbedded(na["isEmbedded"]),
            E.IsApportionable(na["isApportionable"]),
            E.IsOverridable(na["isOverridable"]),
            E.IsSubstitution(na["isSubstitution"]),
            E.IsNullable(na["isNullable"]),
            E.DomainName(na["domainName"] or None),
            E.BitPosition(na["bitPosition"]),
            E.BitSize(na["bitSize"]),
            E.JunctionWeightID(na["junctionWeightId"]),
            E.EdgeWeightID(na["edgeWeightId"]),
            E.AttributeAssignments(
                make_type("ArrayOfUtilityNetworkAssignment"),
                *(self.convert_na_assignment(a) for a in na["assignments"]),
            ),
        )

    def convert_network_attributes(self):
        return E.NetworkAttributes(
            make_type("ArrayOfUtilityNetworkAttribute"),
            *(self.convert_network_attribute(na) for na in self.payload["networkAttributes"]),
        )

    @staticmethod
    def convert_terminal(term: dict):
        return E.Terminal(
            make_type("Terminal"),
            E.TerminalID(term["terminalId"]),
            E.TerminalName(term["terminalName"]),
            E.IsUpstreamTerminal(term["isUpstreamTerminal"]),
        )

    @staticmethod
    def convert_terminal_path(terminal: dict):
        return E.TerminalPath(
            make_type("TerminalPath"),
            E.FromTerminalID(terminal["fromTerminalId"]),
            E.ToTerminalID(terminal["toTerminalId"]),
        )

    def convert_valid_configuration_path(self, path: dict):
        return E.ValidConfigurationPath(
            make_type("ValidConfigurationPath"),
            E.ID(path["id"]),
            E.Name(path["name"]),
            E.Description(path["description"]),
            E.TerminalPaths(
                make_type("ArrayOfTerminalPath"),
                *(self.convert_terminal_path(p) for p in path["terminalPaths"]),
            ),
        )

    def convert_terminal_configuration(self, config: dict):
        return E.TerminalConfiguration(
            make_type("TerminalConfiguration"),
            E.CreationTime(to_datetime_str(config["creationTime"])),
            E.TerminalConfigurationID(config["terminalConfigurationId"]),
            E.TerminalConfigurationName(config["terminalConfigurationName"]),
            E.TraversabilityModel(config["traversabilityModel"]),
            E.Terminals(
                make_type("ArrayOfTerminal"),
                *(self.convert_terminal(term) for term in config["terminals"]),
            ),
            E.ValidConfigurations(
                make_type("ArrayOfValidConfigurationPath"),
                *(self.convert_valid_configuration_path(path) for path in config["validConfigurationPaths"]),
            ),
            E.DefaultConfiguration(config["defaultConfiguration"]),
        )

    def convert_terminal_configurations(self):
        return E.TerminalConfigurations(
            make_type("ArrayOfTerminalConfiguration"),
            *(self.convert_terminal_configuration(config) for config in self.payload["terminalConfigurations"]),
        )
