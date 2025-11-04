from typing import TYPE_CHECKING, Type

from ..common import change_first_character, get_qualification_prefix

if TYPE_CHECKING:
    from .workspace import ConvertDataElement
    from .reader import ExcelWorksheet
    from ..conversion.helper import Base


class LRSConverter:
    TABLE_KEY = "!table"
    NETWORK_KEY = "!network"
    EVENT_KEY = "!event"
    INTERSECT_KEY = "!intersect"

    def __init__(self, gdb: "ConvertDataElement", sheet: "ExcelWorksheet"):
        self.gdb = gdb
        self.sheet = sheet

        self.root = {}
        self.meta = {}
        self.schema = ""
        self._convert_props()

    def _convert_props(self):
        from ..conversion.locref import LocationReferencingDataset

        root_keys = (
            "name",
            "datasetType",
            "dsId",
            "versioned",
            "changeTracked",
            "configurationKeyword",
            "replicaTracked",
        )
        props = LocationReferencingDataset.to_json(self.gdb._get_properties())
        # Assign properties to correct dictionary.
        for k, v in props.items():
            (self.root if k in root_keys else self.meta)[k] = v
        self.schema = get_qualification_prefix(name := self.root["name"])
        self.meta["name"] = name.removeprefix(self.schema)

        self.root["schemaVersion"] = int(self.meta["lrsDatasetVersion"])

    def _convert_schema_tables(self):
        from ..conversion import locref

        for cls in (
            locref.CalibrationPoint,
            locref.Centerline,
            locref.CenterlineSequence,
            locref.Redline,
        ):
            table = self.sheet.get_table(cls)
            records = cls.to_json(table.data(key_value=True))
            key = change_first_character(cls.class_name(), lower=True)
            self.meta[key + cls.suffix()] = (records.pop(self.TABLE_KEY) or "").split(".")[-1]

            yield key, records | dict(objectId="ObjectId")

    def _get_sub_table(self, cls: Type["Base"], key: str) -> dict[str, list[dict]]:
        group = {}  # Group by network.
        for data in self.sheet.get_table(cls).data():
            field = cls.to_json(data)
            group.setdefault(field.pop(key), []).append(field)

        return group

    def convert_route_fields(self):
        from ..conversion import locref

        return self._get_sub_table(locref.RouteField, self.NETWORK_KEY)

    def convert_route_dominance(self):
        from ..conversion import locref

        return self._get_sub_table(locref.RouteDominance, self.NETWORK_KEY)

    def convert_network_fields(self):
        from ..conversion import locref

        return self._get_sub_table(locref.NetworkField, self.NETWORK_KEY)

    def convert_event_fields(self):
        from ..conversion import locref

        return self._get_sub_table(locref.EventField, self.EVENT_KEY)

    def convert_referent_fields(self):
        from ..conversion import locref

        return self._get_sub_table(locref.ReferentField, self.EVENT_KEY)

    def convert_derived_fields(self):
        from ..conversion import locref

        return self._get_sub_table(locref.DerivedMeasureField, self.EVENT_KEY)

    def convert_station_fields(self):
        from ..conversion import locref

        return self._get_sub_table(locref.StationingField, self.EVENT_KEY)

    def convert_events(self):
        from ..conversion import locref

        event_lookup = self._get_sub_table(locref.Event, self.NETWORK_KEY)
        event_fields = self.convert_event_fields()
        referent_fields = self.convert_referent_fields()
        derived_fields = self.convert_derived_fields()
        station_fields = self.convert_station_fields()

        for events in event_lookup.values():
            for event in events:
                event.update(
                    **event_fields.get(event_name := event["name"], [{}])[0],
                    **referent_fields.get(event_name, [{}])[0],
                    **derived_fields.get(event_name, [{}])[0],
                    **station_fields.get(event_name, [{}])[0],
                )

        return event_lookup

    def convert_intersection_fields(self):
        from ..conversion import locref

        return self._get_sub_table(locref.IntersectionField, self.INTERSECT_KEY)

    def convert_intersection_layers(self):
        from ..conversion import locref

        return self._get_sub_table(locref.IntersectionLayer, self.INTERSECT_KEY)

    def convert_intersection(self):
        from ..conversion import locref

        intersection_lookup = self._get_sub_table(locref.Intersection, self.NETWORK_KEY)
        fields = self.convert_intersection_fields()
        layers = self.convert_intersection_layers()

        for intersections in intersection_lookup.values():
            for intersect in intersections:
                intersect.update(
                    **fields.get(name := intersect["name"], [{}])[0],
                    intersectingFeatureClasses=layers.get(name, []),
                )

        return intersection_lookup

    def convert_networks(self):
        from ..conversion import locref

        network_fields = self.convert_network_fields()
        route_fields = self.convert_route_fields()
        network_events = self.convert_events()
        route_dominance = self.convert_route_dominance()
        intersection_classes = self.convert_intersection()

        for net in self.sheet.get_table(locref.Network).data():
            network = locref.Network.to_json(net)
            net_name = network.pop(self.NETWORK_KEY)
            network.update(
                **network_fields.get(net_name, [{}])[0],
                routeFieldNames=route_fields.get(net_name, []),
            )
            if events := network_events.get(net_name):
                network["eventTables"] = events
            if dominance := route_dominance.get(net_name):
                network["routePriorityRules"] = dominance
            if intersect := intersection_classes.get(net_name):
                network["intersectionClasses"] = intersect

            yield network

    def convert_address_classes(self):
        from ..conversion import locref

        for cls in (locref.AddressRange, locref.SiteAddress):
            table = self.sheet.get_table(cls)
            records = cls.to_json(table.data(key_value=True))
            if table := records.pop(self.TABLE_KEY):  # Adddress classes are optional
                records[f"{cls.class_name()}FeatureClassName"] = table.split(".")[-1]
                yield records

    def convert_metadata(self):
        networks = list(self.convert_networks())

        # Convert derived network name to ID.
        net_lookup = {n["name"]: n["networkId"] for n in networks}
        for net in networks:
            net["derivedFromNetwork"] = net_lookup.get(net["derivedFromNetwork"], -1)

        payload = dict(
            defaultVersionName="",
            description="",
            fieldNames=dict(self._convert_schema_tables()),
            **self.meta,
            lrsDatasetRequiresUpgrade=False,
            userSchemaPrefix="",
        )
        if networks:
            payload["networks"] = networks
        if address := list(self.convert_address_classes()):
            payload["addressClass"] = address

        return payload

    def convert_event_rules(self) -> dict:
        from ..conversion import locref
        from ..constants import esriLRSActivityType, esriLRSEventBehaviorType

        if not (events := self._get_sub_table(locref.BehaviorRule, self.EVENT_KEY)):
            return {}

        behavior_lookup = esriLRSEventBehaviorType.name_code_lookup()
        activity_lookup = esriLRSActivityType.name_code_lookup()

        missing = {
            e.name: esriLRSEventBehaviorType.eventMeasureChanges.name
            for e in (
                esriLRSActivityType.createRoute,
                esriLRSActivityType.realignOverlap,
                esriLRSActivityType.loadRoute,
            )
        }
        rules = []
        for event, (behavior, *_) in events.items():
            rules.append(dict(event=event, EventBehaviors=(data := [])))
            for k, v in (missing | behavior).items():
                data.append(
                    dict(
                        ActivityType=activity_lookup.get(k, 0),
                        BehaviorType=behavior_lookup.get(v, 0),
                    )
                )
            data.sort(key=lambda f: f["ActivityType"])

        return dict(eventBehaviorRules=rules)

    def convert_all(self) -> dict:
        payload = dict(
            **self.root,
            lrsMetaData=self.convert_metadata(),
            CenterlineClassID=-1,
            CenterlineClassName=self.meta["centerlineFCName"],
            CalibrationConfiguration=[],
            CartoRealignConfiguration=[],
            EventBehaviorRules=self.convert_event_rules(),
        )

        return payload
