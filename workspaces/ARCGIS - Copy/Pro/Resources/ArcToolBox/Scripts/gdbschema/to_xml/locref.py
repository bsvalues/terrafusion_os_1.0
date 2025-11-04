from lxml import etree

from .helper import *
from ..common import get_qualification_prefix


class LocationReferencing:
    def __init__(self, controller: dict):
        self.payload = controller
        self.meta = self.payload["lrsMetaData"]

    def convert_properties(self):
        d = self.meta

        return dict(
            LrsId=d["lrsId"].strip("{}"),
            Name=d["name"],
            Description=d["description"],
            SchemaVersion=d["schemaVersion"],
            CenterlineFCName=d["centerlineFCName"].split(".")[-1],
            CenterlineSequenceTableName=d["centerlineSequenceTableName"].split(".")[-1],
            CalibrationPointFCName=d["calibrationPointFCName"].split(".")[-1],
            RedlineFCName=d["redlineFCName"].split(".")[-1],
            ConflictPreventionEnabled=d["conflictPreventionEnabled"],
            DefaultVersionName=d["defaultVersionName"],
            AllowLockTransfer=d["allowLockTransfer"],
            UseElevationDataset=d["useElevationDataset"],
            ZFactor=d["zFactor"],
            UserSchemaPrefix=get_qualification_prefix(self.payload["name"]),
            ProVersion=d.get("proVersion", ""),
            LrsDatasetVersion=d.get("lrsDatasetVersion", ""),
            LrsDatasetRequiresUpgrade=d.get("lrsDatasetRequiresUpgrade", False),
        )

    @staticmethod
    def convert_route_field_names(d: dict):
        return E.NetworkFieldName(
            Name=d["name"],
            FixedLength=d["fixedLength"],
            IsFixedLength=d["isFixedLength"],
            IsPaddingEnabled=d["isPaddingEnabled"],
            PaddingCharacter=d["paddingCharacter"],
            PaddingPlace=d["paddingPlace"],
            IsPadNullValues=d["isPadNullValues"],
            IsNullAllowed=d["isNullAllowed"],
            AllowAnyLookupValue=d["allowAnyLookupValue"],
            LookupTableXml=None,
            LookupTableName=None,
            LookupKeyField=None,
            LookupDisplayField=None,
        )

    @staticmethod
    def convert_event_table(d: dict):
        return E.EventTable(
            EventId=d["eventId"].strip("{}"),
            Name=d["name"],
            TableName=d["tableName"],
            FeatureClassName=d["featureClassName"].split(".")[-1],
            IsLocal=d["isLocal"],
            IsPointEvent=d["isPointEvent"],
            ReferenceOffsetType=d["referenceOffsetType"],
            TableNameXml=d["tableNameXml"],
            ObjectIdFieldName=d["objectIdFieldName"],
            EventIdFieldName=d["eventIdFieldName"],
            RouteIdFieldName=d["routeIdFieldName"],
            RouteNameFieldName=d["routeNameFieldName"],
            ToRouteIdFieldName=d["toRouteIdFieldName"],
            ToRouteNameFieldName=d["toRouteNameFieldName"],
            FromDateFieldName=d["fromDateFieldName"],
            ToDateFieldName=d["toDateFieldName"],
            FromMeasureFieldName=d["fromMeasureFieldName"],
            ToMeasureFieldName=d["toMeasureFieldName"],
            LocErrorFieldName=d["locErrorFieldName"],
            StoreFieldsFromDerivedNetworkWithEventRecords=d["storeFieldsFromDerivedNetworkWithEventRecords"],
            DerivedRouteIdFieldName=d["derivedRouteIdFieldName"],
            DerivedRouteNameFieldName=d["derivedRouteNameFieldName"],
            DerivedFromMeasureFieldName=d["derivedFromMeasureFieldName"],
            DerivedToMeasureFieldName=d["derivedToMeasureFieldName"],
            StoreReferentLocationWithEventRecords=d["storeReferentLocationWithEventRecords"],
            ReferentOffsetUnits=d["referentOffsetUnits"],
            FromReferentMethodFieldName=d["fromReferentMethodFieldName"],
            FromReferentLocationFieldName=d["fromReferentLocationFieldName"],
            FromReferentOffsetFieldName=d["fromReferentOffsetFieldName"],
            ToReferentMethodFieldName=d["toReferentMethodFieldName"],
            ToReferentLocationFieldName=d["toReferentLocationFieldName"],
            ToReferentOffsetFieldName=d["toReferentOffsetFieldName"],
            AheadStationField=d["aheadStationField"],
            BackStationField=d["backStationField"],
            StationUnitOfMeasure=d["stationUnitOfMeasure"],
            StationMeasureIncreaseField=d["stationMeasureIncreaseField"],
            StationMeasureDecreaseValues=d["stationMeasureDecreaseValues"],
            ServiceLayerId=d["serviceLayerId"],
        )

    @staticmethod
    def convert_intersecting(d: dict):
        return E.IntersectingFeatureClasses(
            FeatureClassName=d["featureClassName"].split(".")[-1],
            IdFieldName=d["idFieldName"],
            DescriptionFieldName=d["descriptionFieldName"],
            NameSeparator=d["nameSeparator"],
        )

    def convert_intersection_class(self, d: dict):
        return E.IntersectionClass(
            *map(self.convert_intersecting, d["intersectingFeatureClasses"]),
            E.ClusterToleranceUnitsOfMeasure(d["clusterToleranceUnitsOfMeasure"]),
            IntersectionClassId=d["intersectionClassId"].strip("{}"),
            Name=d["name"],
            FeatureClassName=d["featureClassName"].split(".")[-1],
            IntersectionIdFieldName=d["intersectionIdFieldName"],
            IntersectionNameFieldName=d["intersectionNameFieldName"],
            FeatureIdFieldName=d["featureIdFieldName"],
            RouteIdFieldName=d["routeIdFieldName"],
            MeasureFieldName=d["measureFieldName"],
            IntersectingFeatureClassNameFieldName=d["intersectingFeatureClassNameFieldName"],
            ParentNetworkDescriptionFieldName=d["parentNetworkDescriptionFieldName"],
            FromDateFieldName=d["fromDateFieldName"],
            ToDateFieldName=d["toDateFieldName"],
            ClusterTolerance=d["clusterTolerance"],
            ZTolerance=d["zTolerance"],
            NewIntersectionsFormat=d["newIntersectionsFormat"],
            ServiceLayerId=-1,
        )

    @staticmethod
    def convert_route_priority_rule(d: dict):
        return E.RoutePriorityRule(
            RelationalOperator=d["relationalOperator"],
            OrderType=d["orderType"],
            TableName=d["tableName"],
            FieldName=d["fieldName"],
            RuleName=d["ruleName"],
            Exceptions=d["exceptions"],
            FieldNames=";".join(d["fieldNames"]),
        )

    def convert_network(self, d: dict):
        return E.Network(
            E.RouteFieldNames(*map(self.convert_route_field_names, d["routeFieldNames"])),
            E.EventTables(*map(self.convert_event_table, d.get("eventTables", []))),
            E.IntersectionClasses(*map(self.convert_intersection_class, d.get("intersectionClasses", []))),
            E.UnitsOfMeasure(d["unitsOfMeasure"]),
            E.RoutePriorityRules(*map(self.convert_route_priority_rule, d.get("routePriorityRules", []))),
            NetworkId=d["networkId"],
            Name=d["name"],
            FieldSeparator=d["fieldSeparator"],
            IgnoreEmptyRoutes=d["ignoreEmptyRoutes"],
            PersistedFeatureClassName=d["persistedFeatureClassName"].split(".")[-1],
            PersistedFeatureClassRouteIdFieldName=d["persistedFeatureClassRouteIdFieldName"],
            FromDateFieldName=d["fromDateFieldName"],
            ToDateFieldName=d["toDateFieldName"],
            PromptPriorityWhenEditing=d["promptPriorityWhenEditing"],
            GapCalibration=d["gapCalibration"],
            GapCalibrationOffset=d["gapCalibrationOffset"],
            MeasuresDisplayPrecision=d["measuresDisplayPrecision"],
            UpdateRouteLengthInCartoRealignment=d["updateRouteLengthInCartoRealignment"],
            IsDerived=d["isDerived"],
            DerivedFromNetwork=d["derivedFromNetwork"],
            RouteNameFieldName=d["routeNameFieldName"],
            LineIdFieldName=d["lineIdFieldName"],
            LineNameFieldName=d["lineNameFieldName"],
            LineOrderFieldName=d["lineOrderFieldName"],
            AutoGenerateRouteId=d["autoGenerateRouteId"],
            AutoGenerateRouteName=d["autoGenerateRouteName"],
            ServiceLayerId=d["serviceLayerId"],
        )

    def _get_data(self, key: str) -> dict:
        return self.meta.get("fieldNames", {}).get(key, {})

    def convert_centerline_sequence(self):
        d = self._get_data("centerlineSequence")
        return E.CenterlineSequence(
            ObjectId=d.get("objectId"),
            RoadwayId=d.get("roadwayId"),
            NetworkId=d.get("networkId"),
            RouteId=d.get("routeId"),
            FromDate=d.get("fromDate"),
            ToDate=d.get("toDate"),
        )

    def convert_calibration_point(self):
        d = self._get_data("calibrationPoint")
        return E.CalibrationPoint(
            ObjectId=d.get("objectId"),
            Measure=d.get("measure"),
            FromDate=d.get("fromDate"),
            ToDate=d.get("toDate"),
            NetworkId=d.get("networkId"),
            RouteId=d.get("routeId"),
        )

    def convert_centerline(self):
        d = self._get_data("centerline")
        return E.Centerline(
            ObjectId=d.get("objectId"),
            RoadwayId=d.get("roadwayId"),
        )

    def convert_redline(self):
        d = self._get_data("redline")
        return E.Redline(
            ObjectId=d.get("objectId"),
            FromMeasure=d.get("fromMeasure"),
            ToMeasure=d.get("toMeasure"),
            RouteId=d.get("routeId"),
            RouteName=d.get("routeName"),
            EffectiveDate=d.get("effectiveDate"),
            ActivityType=d.get("activityType"),
            NetworkId=d.get("networkId"),
        )

    def convert_address(self, d: dict):
        return E.AddressClass(**d)

    def convert_metadata(self):
        lrs = E.Lrs(
            E.Networks(*map(self.convert_network, self.meta.get("networks", []))),
            E.UtilityNetworkClasses(),
            E.AddressClasses(*map(self.convert_address, self.meta.get("addressClass", []))),
            E.FieldNames(
                self.convert_centerline_sequence(),
                self.convert_calibration_point(),
                self.convert_centerline(),
                self.convert_redline(),
            ),
            **self.convert_properties(),
        )

        return E.LRSMetadata(etree.tostring(lrs, encoding=str))

    def convert_behavior_rules(self):
        from ..common import dump_json

        return E.EventBehaviorRules(dump_json(rules) if (rules := self.payload["EventBehaviorRules"]) else None)

    def convert_all(self):
        return [
            E.SchemaVersion(self.payload["schemaVersion"]),
            E.CenterlineClassID(self.payload["CenterlineClassID"]),
            E.CenterlineClassName(self.payload["CenterlineClassName"]),
            self.convert_metadata(),
            self.convert_behavior_rules(),
            E.CartoRealignConfiguration(),
            E.CalibrationConfiguration(),
            E.UserDefaultAttributeSet(),
            E.AttributeSets(),
        ]
