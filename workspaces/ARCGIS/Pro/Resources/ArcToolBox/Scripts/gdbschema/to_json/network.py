from typing import TYPE_CHECKING, Iterator

from ..constants import *

if TYPE_CHECKING:
    from .workspace import ConvertDataElement
    from .reader import ExcelWorksheet
    from ..conversion.helper import Base


class UtilityNetworkConverter:
    def __init__(self, gdb: "ConvertDataElement", sheet: "ExcelWorksheet"):
        self.gdb = gdb
        self.sheet = sheet

    def convert_asset_types(self) -> dict:
        from ..conversion.network import AssetType

        if not (asset_types := self.sheet.get_table(AssetType)):
            raise

        types = {}  # Group by Source and Asset Group.
        for t in asset_types.data():
            typ = AssetType.to_json(t)
            types.setdefault((typ.pop("!source"), typ.pop("!group")), []).append(typ)

        return types

    def convert_asset_groups(self) -> dict:
        from ..conversion.network import AssetGroup

        if not (asset_groups := self.sheet.get_table(AssetGroup)):
            raise
        asset_types = self.convert_asset_types()

        groups = {}  # Group by Source.
        for g in asset_groups.data():
            group = AssetGroup.to_json(g)
            source = group.pop("!source")
            group["assetTypes"] = asset_types.get((source, group["assetGroupName"]), [])
            groups.setdefault(source, []).append(group)

        return groups

    def convert_sources(self) -> dict[str, dict[str, list[dict]]]:
        from ..conversion.network import Source

        if not (network_sources := self.sheet.get_table(Source)):
            raise
        asset_groups = self.convert_asset_groups()

        edge_sources = esriUtilityNetworkFeatureClassUsageType.edge_sources()

        sources = {}  # Group by domain network and source type.
        for s in network_sources.data():
            source = Source.to_json(s)
            source.update(assetGroups=asset_groups.get(source.pop("!source"), []))

            if (source["utilityNetworkFeatureClassUsageType"]) in edge_sources:
                key = "edge"
            else:
                key = "junction"
            sources.setdefault(source.pop("!network"), {}).setdefault(key, []).append(source)

        return sources

    def _get_subnetwork_def_records(self, cls: type["Base"], missing: dict = None) -> dict[str, list[dict]]:
        if not (table := self.sheet.get_table(cls)):
            raise

        grouped = {}  # Group by tier name.
        for row in table.data():
            config = cls.to_json((missing or {}) | row)
            grouped.setdefault(config.pop("!tier"), []).append(config)

        return grouped

    def convert_subnetwork_configuration(self) -> dict[str, dict]:
        from ..conversion import network

        subnetwork_def = self._get_subnetwork_def_records(network.TierTraceConfiguration)
        condition_barriers = self._get_subnetwork_def_records(network.Condition)
        function_barriers = self._get_subnetwork_def_records(network.FunctionBarrier)
        functions = self._get_subnetwork_def_records(
            network.Function,
            {network.Function.FUNCTION_TYPE: esriTraceFunctionType.esriTFTCount.value},  # Missing from Pro 3.2.
        )
        propagators = self._get_subnetwork_def_records(network.Propagator)

        final = {}
        for tier_name, (config, *_) in subnetwork_def.items():  # There is only 1 trace config per tier.
            final[tier_name] = config
            config.update(
                conditionBarriers=condition_barriers.get(tier_name, []),
                functionBarriers=function_barriers.get(tier_name, []),
                filterBarriers=[],
                filterFunctionBarriers=[],
                functions=functions.get(tier_name, []),
                propagators=propagators.get(tier_name, []),
            )

        return final

    def tier_valid_objects(self) -> dict:
        from ..conversion.network import ValidGroupsTypes

        objects = self._get_subnetwork_def_records(ValidGroupsTypes)

        # Convert source name and subset key to json key.
        lookup = {
            ("Device", False): "validDevices",
            ("Device", True): "validSubnetworkControllers",
            ("Line", False): "validLines",
            ("Junction", None): "validJunctions",
            ("JunctionObject", False): "validJunctionObjects",
            ("JunctionObject", True): "validJunctionObjectSubnetworkControllers",
            ("EdgeObject", None): "validEdgeObjects",
            ("Line", True): "aggregatedLinesForSubnetLine",
        }

        grouped = {"": {k: [] for k in lookup.values()}}  # Group by Tier and key.
        for tier_name, rows in objects.items():
            grouped[tier_name] = tier = {k: [] for k in lookup.values()}  # Ensure all keys are initialized.
            for row in rows:
                subset = row["!subset"]
                if (fc := row["!source"]) in {"Junction", "EdgeObject"}:
                    subset = None

                # If subset=True, then the record is also present in subset=False.
                keys = [(fc, subset)]
                if subset:
                    keys.append((fc, False))
                for key in keys:
                    tier[lookup[key]].append((row["!group"], row["!type"]))

        return grouped

    def convert_tier_groups(self) -> dict[str, list[dict]]:
        from ..conversion.network import TierGroup

        if not (tier_groups := self.sheet.get_table(TierGroup)):
            return {}  # Missing from Pro 3.2.

        groups = {}  # Group by domain network.
        for g in tier_groups.data():
            group = TierGroup.to_json(g)
            groups.setdefault(group.pop("!network"), []).append(group)

        return groups

    def convert_tiers(self) -> dict[str, list[dict]]:
        from ..conversion.network import Tier

        if not (network_tiers := self.sheet.get_table(Tier)):
            raise
        subnetwork_def = self.convert_subnetwork_configuration()
        valid_objects = self.tier_valid_objects()

        missing = {
            Tier.TIER_GROUP: "",  # Missing from Pro 3.2.
            Tier.DIAGRAM_TEMPLATES: None,  # Missing from Pro 3.2.
        }

        tiers = {}  # Group by domain network.
        for t in network_tiers.data():
            tier = Tier.to_json(missing | t)
            tier.update(
                **valid_objects.get(tier["name"], valid_objects[""]),  # "" is the placeholder for no subnetwork def.
                updateSubnetworkTraceConfiguration=(sub := subnetwork_def.get(tier["name"], {})),
            )

            tiers.setdefault(network := tier.pop("!network"), []).append(tier)
            if tier["name"] in valid_objects:  # Proxy for no subnetwork definition.
                sub["tierName"] = tier["name"]
                sub["domainNetworkName"] = network
            else:
                sub["tierName"] = ""

        return tiers

    def convert_domain_networks(self) -> Iterator[dict]:
        from ..conversion.network import DomainNetwork

        if not (networks := self.sheet.get_table(DomainNetwork)):
            raise

        sources = self.convert_sources()
        tier_groups = self.convert_tier_groups()
        tiers = self.convert_tiers()

        for net in networks.data():
            network = DomainNetwork.to_json(net)
            network.update(
                junctionSources=sources.get(name := network["domainNetworkName"], {}).get("junction", []),
                edgeSources=sources.get(name, {}).get("edge", []),
                tierGroups=tier_groups.get(name, []),
                tiers=tiers.get(name, []),
            )
            yield network

    def convert_categories(self) -> Iterator[dict]:
        from ..conversion.network import NetworkCategory

        if not (categories := self.sheet.get_table(NetworkCategory)):
            raise

        for cat in categories.data():
            yield NetworkCategory.to_json(cat)

    def convert_na_assignment(self) -> dict[str, list[dict]]:
        from ..conversion.network import NetworkAttributeAssignment

        if not (na_assignments := self.sheet.get_table(NetworkAttributeAssignment)):
            raise

        assignments = {}  # Group by NA name.
        for a in na_assignments.data():
            assign = NetworkAttributeAssignment.to_json(a)
            assignments.setdefault(assign.pop("!na"), []).append(assign)

        return assignments

    def convert_network_attributes(self) -> Iterator[dict]:
        from ..conversion.network import NetworkAttribute

        if not (attributes := self.sheet.get_table(NetworkAttribute)):
            raise
        assignments = self.convert_na_assignment()

        missing = {
            NetworkAttribute.APPORTIONABLE: False,  # Missing from Pro 3.2.
        }
        for a in attributes.data():
            na = NetworkAttribute.to_json(missing | a)
            na.update(
                assignments=assignments.get(na["name"], []),
            )
            yield na

    def convert_terminals(self) -> dict[str, list[dict]]:
        from ..conversion.network import Terminal

        if not (terminals := self.sheet.get_table(Terminal)):
            raise

        terms = {}  # Group by config name.
        for t in terminals.data():
            term = Terminal.to_json(t)
            terms.setdefault(term.pop("!config"), []).append(term)
        return terms

    def convert_terminal_paths(self) -> dict[str, list[dict]]:
        from ..conversion.network import TerminalPath

        if not (terminal_paths := self.sheet.get_table(TerminalPath)):
            raise

        paths = {}  # Group by config name.
        for p in terminal_paths.data():
            path = TerminalPath.to_json(p)
            paths.setdefault(path.pop("!config"), []).append(path)
        return paths

    def convert_terminal_configurations(self) -> Iterator[dict]:
        from ..conversion.network import TerminalConfiguration

        if not (configs := self.sheet.get_table(TerminalConfiguration)):
            raise
        terminals = self.convert_terminals()
        paths = self.convert_terminal_paths()

        for c in configs.data():
            config = TerminalConfiguration.to_json(c)
            config.update(
                terminals=terminals.get(name := config["terminalConfigurationName"], []),
                validConfigurationPaths=paths.get(name, []),
            )
            yield config

    @staticmethod
    def _create_lookup(sources: list[dict]) -> dict:
        lookup = {}
        for source in sources:
            lookup[source["utilityNetworkFeatureClassUsageType"]] = inner = {}
            for g in source["assetGroups"]:
                for t in g["assetTypes"]:
                    inner[(g["assetGroupName"], t["assetTypeName"])] = g["assetGroupCode"], t["assetTypeCode"]

        return lookup

    @staticmethod
    def replace_tier_codes(payload: dict):
        # Convert key to source name.
        key_lookup = dict(
            validDevices=esriUtilityNetworkFeatureClassUsageType.esriUNFCUTDevice.name,
            validSubnetworkControllers=esriUtilityNetworkFeatureClassUsageType.esriUNFCUTDevice.name,
            validLines=esriUtilityNetworkFeatureClassUsageType.esriUNFCUTLine.name,
            validJunctions=esriUtilityNetworkFeatureClassUsageType.esriUNFCUTJunction.name,
            validJunctionObjects=esriUtilityNetworkFeatureClassUsageType.esriUNFCUTJunctionObject.name,
            validJunctionObjectSubnetworkControllers=esriUtilityNetworkFeatureClassUsageType.esriUNFCUTJunctionObject.name,
            validEdgeObjects=esriUtilityNetworkFeatureClassUsageType.esriUNFCUTEdgeObject.name,
            aggregatedLinesForSubnetLine=esriUtilityNetworkFeatureClassUsageType.esriUNFCUTLine.name,
        )

        for network in payload["domainNetworks"]:
            if not network["tiers"]:
                continue

            source_lookup = UtilityNetworkConverter._create_lookup(network["junctionSources"] + network["edgeSources"])
            for tier in network["tiers"]:
                for key, source in key_lookup.items():
                    records: list
                    if not (records := tier[key]):
                        continue

                    # Convert to codes and group by the asset group.
                    lookup = source_lookup[source]
                    codes: dict[int, list[int]] = {}
                    for record in records:
                        a, b = lookup[record]
                        codes.setdefault(a, []).append(b)

                    records.clear()
                    for asset_group, asset_types in codes.items():
                        records.append(
                            dict(
                                assetGroupCode=asset_group,
                                assetTypes=[dict(assetTypeCode=a) for a in asset_types],
                            )
                        )

    @staticmethod
    def create_terminal_paths(payload: dict):
        """Creates from/to terminal paths for validConfigurationPaths"""

        for config in payload["terminalConfigurations"]:
            lookup = {t["terminalName"]: t["terminalId"] for t in config["terminals"]}
            for path in config["validConfigurationPaths"]:
                path["terminalPaths"] = pairs = []
                if path["description"].casefold() in {"all", "none"}:
                    continue
                for pair in path["description"].split(","):
                    a, b = sorted(lookup[x.strip()] for x in pair.strip().split("-"))  # Lower terminal comes first.
                    pairs.append(dict(fromTerminalId=a, toTerminalId=b))

    def convert_all(self) -> dict:
        payload = dict(
            domainNetworks=list(self.convert_domain_networks()),
            networkAttributes=list(self.convert_network_attributes()),
            terminalConfigurations=list(self.convert_terminal_configurations()),
            categories=list(self.convert_categories()),
        )

        self.replace_tier_codes(payload)
        self.create_terminal_paths(payload)

        return payload
