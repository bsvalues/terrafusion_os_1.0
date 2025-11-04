from functools import cache
from typing import Optional

from .helper import *
from .workspace import DataElementBase, Table
from ..constants import *

__all__ = [
    "LocationReferencingDataset",
]


def get_schema(cls: Base):
    return cls.get_parent(LocationReferencingDataset).qualification


class TableHelper(Base):
    """Helper class for accessing tables and fields"""

    HEADER = ()

    @property
    def name(self) -> ValueWrapper:
        return self.parent.name.as_link()

    @cache
    def fc(self) -> Table:
        return self.parent.fc()

    @property
    def feature_class(self):
        if fc := self.fc():
            return fc.name.as_link()

    def get_field(self, name):
        if (fc := self.fc()) and (field := fc.get_field(self._d.get(name))):
            return field.name.as_link()


class EventHelper(TableHelper):
    parent: "Event"
    HEADER = (Header("Event Name", "name", json="!event"),)


class NetworkHelper(TableHelper):
    parent: "Network"
    HEADER = (Header("Network Name", "name", json="!network"),)


class IntersectionHelper(TableHelper):
    parent: "Intersection"
    HEADER = (Header("Intersection Name", "name", json="!intersect"),)


class LRSHelper(TableHelper):
    HEADER = (Header("Table", "feature_class", json="!table"),)

    @cache
    def fc(self) -> Table:
        return self.get_gdb().get_child(Table, get_schema(self) + self._d.get("table", ""))

    @classmethod
    def suffix(cls) -> str:
        return "FCName"


class EventField(EventHelper):
    HEADER = (
        *EventHelper.HEADER,
        Header("Event ID", "event_id", json="eventIdFieldName"),
        Header("From Route Name", "from_route_name", json="routeNameFieldName", null=""),
        Header("From Route ID", "from_route_id", json="routeIdFieldName"),
        Header("From Measure", "from_measure", json="fromMeasureFieldName"),
        Header("To Route Name", "to_route_name", json="toRouteNameFieldName", null=""),
        Header("To Route ID", "to_route_id", json="toRouteIdFieldName", null=""),
        Header("To Measure", "to_measure", json="toMeasureFieldName", null=""),
        Header("From Date", "from_date", json="fromDateFieldName"),
        Header("To Date", "to_date", json="toDateFieldName"),
        Header("Location Error", "loc_error", json="locErrorFieldName"),
        # Header("Supports Spanning Routes", "span_routes", enum=BooleanType),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def event_id(self):
        return self.get_field("eventIdFieldName")

    @property
    def from_route_name(self):
        return self.get_field("routeNameFieldName")

    @property
    def from_route_id(self):
        return self.get_field("routeIdFieldName")

    @property
    def from_measure(self):
        return self.get_field("fromMeasureFieldName")

    @property
    def to_route_name(self):
        return self.get_field("toRouteNameFieldName")

    @property
    def to_route_id(self):
        return self.get_field("toRouteIdFieldName")

    @property
    def to_measure(self):
        return self.get_field("toMeasureFieldName")

    @property
    def from_date(self):
        return self.get_field("fromDateFieldName")

    @property
    def to_date(self):
        return self.get_field("toDateFieldName")

    @property
    def loc_error(self):
        return self.get_field("locErrorFieldName")

    @property
    def span_routes(self) -> bool:
        return not self._d["isPointEvent"] and self._d["toRouteIdFieldName"]


class ReferentField(EventHelper):
    HEADER = (
        *EventHelper.HEADER,
        Header("From Referent Method", "from_method", json="fromReferentMethodFieldName", null=""),
        Header("From Referent Location", "from_location", json="fromReferentLocationFieldName", null=""),
        Header("From Referent Offset", "from_offset", json="fromReferentOffsetFieldName", null=""),
        Header("To Referent Method", "to_method", json="toReferentMethodFieldName", null=""),
        Header("To Referent Location", "to_location", json="toReferentLocationFieldName", null=""),
        Header("To Referent Offset", "to_offset", json="toReferentOffsetFieldName", null=""),
        Header("Offset Units", "units", json="referentOffsetUnits", enum=esriUnits.lrs(), null="esriUnknownUnits"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result.update(
            storeReferentLocationWithEventRecords=bool(result["fromReferentMethodFieldName"]),
        )

        return result

    @property
    def from_method(self):
        return self.get_field("fromReferentMethodFieldName")

    @property
    def from_location(self):
        return self.get_field("fromReferentLocationFieldName")

    @property
    def from_offset(self):
        return self.get_field("fromReferentOffsetFieldName")

    @property
    def to_method(self):
        return self.get_field("toReferentMethodFieldName")

    @property
    def to_location(self):
        return self.get_field("toReferentLocationFieldName")

    @property
    def to_offset(self):
        return self.get_field("toReferentOffsetFieldName")

    @property
    def units(self):
        if self._d["fromReferentMethodFieldName"]:
            return self._d.get("referentOffsetUnits")


class DerivedMeasureField(EventHelper):
    HEADER = (
        *EventHelper.HEADER,
        Header("Route ID", "route_id", json="derivedRouteIdFieldName", null=""),
        Header("Route Name", "route_name", json="derivedRouteNameFieldName", null=""),
        Header("From Measure", "from_measure", json="derivedFromMeasureFieldName", null=""),
        Header("To Measure", "to_measure", json="derivedToMeasureFieldName", null=""),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result.update(
            storeFieldsFromDerivedNetworkWithEventRecords=bool(result["derivedRouteIdFieldName"]),
        )

        return result

    @property
    def route_id(self):
        return self.get_field("derivedRouteIdFieldName")

    @property
    def route_name(self):
        return self.get_field("derivedRouteNameFieldName")

    @property
    def from_measure(self):
        return self.get_field("derivedFromMeasureFieldName")

    @property
    def to_measure(self):
        return self.get_field("derivedToMeasureFieldName")


class StationingField(EventHelper):
    HEADER = (
        *EventHelper.HEADER,
        Header("Station", "station", json="aheadStationField", null=""),
        Header("Back Station", "back", json="backStationField", null=""),
        Header("Station Value Direction", "direction", json="stationMeasureIncreaseField", null=""),
        Header(
            "Station Measure Units", "units", json="stationUnitOfMeasure", enum=esriUnits.lrs(), null="esriUnknownUnits"
        ),
        Header("Decreasing Station Values", "is_decreasing", json="stationMeasureDecreaseValues", null=""),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result.update(
            referenceOffsetType="Station" if result["aheadStationField"] else "NoOffset",
        )

        return result

    @property
    def station(self):
        return self.get_field("aheadStationField")

    @property
    def back(self):
        return self.get_field("backStationField")

    @property
    def direction(self):
        return self.get_field("stationMeasureIncreaseField")

    @property
    def units(self):
        if self._d["aheadStationField"]:
            return self._d.get("stationUnitOfMeasure")

    @property
    def is_decreasing(self):
        return self._d.get("stationMeasureDecreaseValues")


class BehaviorRule(Base):
    parent: "Event"
    HEADER = (
        Header("Event Name", "name", json="!event"),
        Header("Calibrate", "calibrate", json="calibrateRoute", enum=esriLRSEventBehaviorType.calibrate()),
        Header("Retire", "retire", json="retireRoute", enum=esriLRSEventBehaviorType.retire()),
        Header("Extend", "extend", json="extendRoute", enum=esriLRSEventBehaviorType.extend()),
        Header("Reassign", "reassign", json="reassignRoute", enum=esriLRSEventBehaviorType.reassign()),
        Header("Realign", "realign", json="realignRoute", enum=esriLRSEventBehaviorType.realign()),
        Header("Reverse", "reverse", json="reverseRoute", enum=esriLRSEventBehaviorType.reverse()),
        Header("Carto Realign", "carto", json="cartoRealignRoute", enum=esriLRSEventBehaviorType.carto()),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def name(self) -> ValueWrapper:
        return self.parent.name.as_link()

    @property
    def calibrate(self):
        return self._d["calibrateRoute"]

    @property
    def retire(self):
        return self._d["retireRoute"]

    @property
    def extend(self):
        return self._d["extendRoute"]

    @property
    def reassign(self):
        return self._d["reassignRoute"]

    @property
    def realign(self):
        return self._d["realignRoute"]

    @property
    def reverse(self):
        return self._d["reverseRoute"]

    @property
    def carto(self):
        return self._d["cartoRealignRoute"]


class IntersectionField(IntersectionHelper):
    HEADER = (
        *IntersectionHelper.HEADER,
        Header("Network Description", "desc", json="parentNetworkDescriptionFieldName"),
        Header("Intersecting ID", "id", json="intersectionIdFieldName"),
        Header("Intersection Field Name", "intersection", json="intersectionNameFieldName"),
        Header("Route ID", "route_id", json="routeIdFieldName"),
        Header("Feature ID", "feature_id", json="featureIdFieldName"),
        Header("Feature Class Name", "fc_name", json="intersectingFeatureClassNameFieldName"),
        Header("From Date", "from_date", json="fromDateFieldName"),
        Header("To Date", "to_date", json="toDateFieldName"),
        Header("Measure", "measure", json="measureFieldName"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def desc(self):
        name = self._d["parentNetworkDescriptionFieldName"]
        if (fc := self.get_parent(Network).fc()) and (field := fc.get_field(name)):
            return field.name.as_link()
        return name

    @property
    def id(self):
        return self.get_field("intersectionIdFieldName")

    @property
    def intersection(self):
        return self.get_field("intersectionNameFieldName")

    @property
    def route_id(self):
        return self.get_field("routeIdFieldName")

    @property
    def feature_id(self):
        return self.get_field("featureIdFieldName")

    @property
    def fc_name(self):
        return self.get_field("intersectingFeatureClassNameFieldName")

    @property
    def from_date(self):
        return self.get_field("fromDateFieldName")

    @property
    def to_date(self):
        return self.get_field("toDateFieldName")

    @property
    def measure(self):
        return self.get_field("measureFieldName")


class IntersectionLayer(IntersectionHelper):
    parent: "Intersection"
    HEADER = (
        *IntersectionHelper.HEADER,
        Header("Feature Class", "feature_class", json="featureClassName"),
        Header("Intersecting ID", "id", json="idFieldName"),
        Header("Description Field", "description", json="descriptionFieldName"),
        Header("Name Separator", "separator", json="nameSeparator"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @cache
    def fc(self):
        return self.get_gdb().get_child(Table, get_schema(self) + self._d["featureClassName"])

    @property
    def id(self):
        return self.get_field("idFieldName")

    @property
    def description(self):
        return self.get_field("descriptionFieldName")

    @property
    def separator(self):
        return self._d["nameSeparator"]


class Intersection(Base):
    parent: "Network"
    HEADER = (
        Header("Network Name", "network", json="!network"),
        Header("Intersection Name", "name", json="name"),
        Header("Feature Class", "feature_class", json="featureClassName"),
        Header("Maximum Z Difference", "z_tolerance", json="zTolerance", null=-1),
        Header("Intersection ID", "id", json="intersectionClassId"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result.update(
            clusterTolerance=0,
            clusterToleranceUnitsOfMeasure=0,
            newIntersectionsFormat=True,
            serviceLayerId=-1,
        )

        return result

    @property
    def network(self) -> ValueWrapper:
        return self.parent.name.as_link()

    @cache
    def fc(self) -> Optional[Table]:
        return self.get_gdb().get_child(Table, get_schema(self) + self._d["featureClassName"])

    @property
    def feature_class(self):
        if fc := self.fc():
            return fc.name.as_link()

    @property
    def z_tolerance(self):
        return None if (z := self._d["zTolerance"]) == -1 else z

    @property
    def id(self):
        return self._d["intersectionClassId"]

    def fields(self) -> BaseCollection:
        return self._make(IntersectionField, [self._d])

    def layers(self) -> BaseCollection:
        return self._make(IntersectionLayer, self._d["intersectingFeatureClasses"])


class Event(Base):
    parent: "Network"
    HEADER = (
        Header("Network Name", "network", json="!network"),
        Header("Event Name", "name", json="name"),
        Header("Feature Class", "feature_class", json="featureClassName"),
        Header("Event Type", "type", json="isPointEvent", enum=esriLRSLayerType.point_line()),
        Header("Event ID", "id", json="eventId"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)
        if (fc := self.fc()) and fc.alias:  # Override name with the table's alias.
            data["name"] = fc.alias

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result["tableName"] = result["name"] = result["featureClassName"].split(".")[-1]

        result.update(
            isPointEvent=result["isPointEvent"] == esriLRSLayerType.esriLRSPointEventLayer.name,
            serviceLayerId=-1,
            isLocal=True,
            referenceOffsetType="NoOffset",  # Only changed if stationing fields are present.
            objectIdFieldName="OBJECTID",
            tableNameXml="",
        )

        return result

    @property
    def network(self) -> ValueWrapper:
        return self.parent.name.as_link()

    @property
    def id(self) -> int:
        return self._d["eventId"]

    @property
    def type(self) -> str:
        return (
            esriLRSLayerType.esriLRSPointEventLayer.value
            if self._d["isPointEvent"]
            else esriLRSLayerType.esriLRSLinearEventLayer.value
        )

    @cache
    def fc(self) -> Optional[Table]:
        return self.get_gdb().get_child(Table, get_schema(self) + self._d["featureClassName"])

    @property
    def feature_class(self):
        if fc := self.fc():
            return fc.name.as_link()

    def event_fields(self) -> BaseCollection:
        return self._make(EventField, [self._d])

    def referent_fields(self) -> BaseCollection:
        return self._make(ReferentField, [self._d])

    def measure_fields(self) -> BaseCollection:
        return self._make(DerivedMeasureField, [self._d])

    def stationing_fields(self) -> BaseCollection:
        return self._make(StationingField, [self._d])

    def behaviors(self) -> BaseCollection:
        return self._make(BehaviorRule, self._d.get("eventBehaviors", []))


class NetworkField(NetworkHelper):
    HEADER = (
        *NetworkHelper.HEADER,
        Header("Route ID", "route_id", json="persistedFeatureClassRouteIdFieldName"),
        Header("Route Name", "route_name", json="routeNameFieldName", null=""),
        Header("From Date", "from_date", json="fromDateFieldName"),
        Header("To Date", "to_date", json="toDateFieldName"),
        Header("Line ID", "line_id", json="lineIdFieldName", null=""),
        Header("Line Name", "line_name", json="lineNameFieldName", null=""),
        Header("Line Order", "line_order", json="lineOrderFieldName", null=""),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result.update(
            autoGenerateRouteName=False,
            autoGenerateRouteId=bool(result["routeNameFieldName"]),
        )

        return result

    @property
    def route_id(self):
        return self.get_field("persistedFeatureClassRouteIdFieldName")

    @property
    def route_name(self):
        return self.get_field("routeNameFieldName")

    @property
    def from_date(self):
        return self.get_field("fromDateFieldName")

    @property
    def to_date(self):
        return self.get_field("toDateFieldName")

    @property
    def line_id(self):
        return self.get_field("lineIdFieldName")

    @property
    def line_name(self):
        return self.get_field("lineNameFieldName")

    @property
    def line_order(self):
        return self.get_field("lineOrderFieldName")


class RouteField(NetworkHelper):
    HEADER = (
        *NetworkHelper.HEADER,
        Header("Name", "name_field", json="name"),
        Header("Fixed Length", "length", json="fixedLength"),
        Header("Is Fixed Length", "fixed", json="isFixedLength", enum=BooleanType),
        Header("Is Padding Enabled", "is_pad", json="isPaddingEnabled", enum=BooleanType),
        Header("Padding Character", "character", json="paddingCharacter"),
        Header("Padding Location", "pad_loc", json="paddingPlace", enum=esriLRSFieldPadding),
        Header("Pad Nulls", "pad_nulls", json="isPadNullValues", enum=BooleanType),
        Header("Allow Nulls", "allow_nulls", json="isNullAllowed", enum=BooleanType),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result["paddingCharacter"] = ord(result["paddingCharacter"] or " ")  # Space is default
        result.update(
            allowAnyLookupValue=True,
            lookupTableXml="",
            lookupTableName="",
            lookupKeyField="",
            lookupDisplayField="",
        )

        return result

    @property
    def name_field(self):
        return self.get_field("name")

    @property
    def length(self) -> int:
        return self._d["fixedLength"]

    @property
    def fixed(self):
        return self._d["isFixedLength"]

    @property
    def is_pad(self):
        return self._d["isPaddingEnabled"]

    @property
    def character(self):
        return chr(self._d["paddingCharacter"])

    @property
    def pad_loc(self):
        return self._d["paddingPlace"]

    @property
    def pad_nulls(self):
        return self._d["isPadNullValues"]

    @property
    def allow_nulls(self):
        return self._d["isNullAllowed"]


class RouteDominance(NetworkHelper):
    HEADER = (
        *NetworkHelper.HEADER,
        Header("Rule Name", "rule_name", json="ruleName"),
        Header("Source Table Name", "feature_class", json="tableName"),
        Header("Fields", "fields", json="fieldNames", null=""),
        Header("Order Method", "operator", json="relationalOperator", enum=esriLRSOperator),
        Header("Order Type", "type", json="orderType", enum=esriLRSPriorityOrder),
        Header("Prioritized Exceptions", "exceptions", json="exceptions", null=""),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent, name="ruleName")

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result.update(
            tableName=result["tableName"].split(".")[-1],
            fieldName="",
            fieldNames=result["fieldNames"].split(cls.DELIM),
        )

        return result

    @cache
    def fc(self):
        return self.get_gdb().get_child(Table, get_schema(self) + self._d["tableName"])

    @property
    def rule_name(self):
        return self._d["ruleName"]

    @property
    def fields(self):
        return self.DELIM.join(self._d["fieldNames"])

    @property
    def operator(self):
        return self._d["relationalOperator"]

    @property
    def type(self):
        return self._d["orderType"]

    @property
    def exceptions(self):
        return self._d["exceptions"]


class Network(Base):
    parent: "LocationReferencingDataset"

    HEADER = (
        Header("Network ID", "id", json="networkId"),
        Header("Network Name", "name", json="!network"),
        Header("Feature Class", "feature_class", json="persistedFeatureClassName"),
        Header("Units of Measure", "units", json="unitsOfMeasure", enum=esriUnits.lrs()),
        Header("Measure Precision", "precision", json="measuresDisplayPrecision"),
        Header("Derived From", "derived", json="derivedFromNetwork"),
        Header("Gap Calibration Method", "calibration_method", json="gapCalibration", enum=esriGapCalibrationType),
        Header("Offset", "calibration_offset", json="gapCalibrationOffset"),
        Header("Update on Realign", "realign", json="updateRouteLengthInCartoRealignment", enum=BooleanType),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)
        if (fc := self.fc()) and fc.alias:  # Override name with the table's alias.
            data["name"] = fc.alias

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result["name"] = result["persistedFeatureClassName"] = result["persistedFeatureClassName"].split(".")[-1]
        result.update(
            isDerived=result["derivedFromNetwork"] is not None,
            fieldSeparator="",
            ignoreEmptyRoutes=False,
            promptPriorityWhenEditing=True,
            serviceLayerId=-1,
            unitsOfMeasure=esriUnits.name_code_lookup().get(result["unitsOfMeasure"], 0),
        )

        return result

    @property
    def id(self) -> int:
        return self._d["networkId"]

    @cache
    def fc(self) -> Optional[Table]:
        return self.get_gdb().get_child(Table, self.parent.qualification + self._d["persistedFeatureClassName"])

    @property
    def feature_class(self):
        if fc := self.fc():
            return fc.name.as_link()

    @property
    def precision(self) -> int:
        return self._d["measuresDisplayPrecision"]

    @property
    def units(self) -> str:
        return esriUnits.from_code(self._d["unitsOfMeasure"]).value

    @property
    def derived(self):
        if not self._d["isDerived"]:
            return
        for network in self.parent.networks():
            if network.id == self._d.get("derivedFromNetwork"):
                return network.name.as_link()

    @property
    def calibration_method(self) -> int:
        return self._d["gapCalibration"]

    @property
    def calibration_offset(self) -> int:
        return self._d["gapCalibrationOffset"]

    @property
    def realign(self) -> int:
        return self._d["updateRouteLengthInCartoRealignment"]

    @cache
    def events(self) -> BaseCollection:
        return self._make(Event, self._d.get("eventTables", []))

    @cache
    def intersections(self) -> BaseCollection:
        return self._make(Intersection, self._d.get("intersectionClasses", []))

    def network_fields(self) -> BaseCollection:
        return self._make(NetworkField, [self._d])

    def route_fields(self) -> BaseCollection:
        return self._make(RouteField, self._d.get("routeFieldNames", []))

    def rules(self) -> BaseCollection:
        return self._make(RouteDominance, self._d.get("routePriorityRules", []))


class CalibrationPoint(LRSHelper):
    HEADER = (
        *LRSHelper.HEADER,
        Header("Measure", "measure", json="measure"),
        Header("From Date", "from_date", json="fromDate"),
        Header("To Date", "to_date", json="toDate"),
        Header("Route ID", "route", json="routeId"),
        Header("Network ID", "network", json="networkId"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def measure(self):
        return self.get_field("measure")

    @property
    def from_date(self):
        return self.get_field("fromDate")

    @property
    def to_date(self):
        return self.get_field("toDate")

    @property
    def route(self):
        return self.get_field("routeId")

    @property
    def network(self):
        return self.get_field("networkId")


class Centerline(LRSHelper):
    HEADER = (
        *LRSHelper.HEADER,
        Header("Centerline ID", "centerline", json="roadwayId"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def centerline(self):
        return self.get_field("roadwayId")


class CenterlineSequence(LRSHelper):
    HEADER = (
        *LRSHelper.HEADER,
        Header("Centerline ID", "centerline", json="roadwayId"),
        Header("Route ID", "route", json="routeId"),
        Header("From Date", "from_date", json="fromDate"),
        Header("To Date", "to_date", json="toDate"),
        Header("Network ID", "network", json="networkId"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def suffix(cls) -> str:
        return "TableName"

    @property
    def centerline(self):
        return self.get_field("roadwayId")

    @property
    def from_date(self):
        return self.get_field("fromDate")

    @property
    def to_date(self):
        return self.get_field("toDate")

    @property
    def route(self):
        return self.get_field("routeId")

    @property
    def network(self):
        return self.get_field("networkId")


class Redline(LRSHelper):
    HEADER = (
        *LRSHelper.HEADER,
        Header("From Measure", "from_measure", json="fromMeasure"),
        Header("To Measure", "to_measure", json="toMeasure"),
        Header("Route ID", "route", json="routeId"),
        Header("Route Name", "route_name", json="routeName"),
        Header("Effective Date", "date", json="effectiveDate"),
        Header("Activity Type", "activity", json="activityType"),
        Header("Network ID", "network", json="networkId"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def from_measure(self):
        return self.get_field("fromMeasure")

    @property
    def to_measure(self):
        return self.get_field("toMeasure")

    @property
    def route(self):
        return self.get_field("routeId")

    @property
    def route_name(self):
        return self.get_field("routeName")

    @property
    def network(self):
        return self.get_field("networkId")

    @property
    def date(self):
        return self.get_field("effectiveDate")

    @property
    def activity(self):
        return self.get_field("activityType")


class AddressRange(LRSHelper):
    HEADER = (
        *LRSHelper.HEADER,
        Header("Left From Address", "left_from", json="LeftFromFieldName"),
        Header("Left To Address", "left_to", json="LeftToFieldName"),
        Header("Right From Address", "right_from", json="RightFromFieldName"),
        Header("Right To Address", "right_to", json="RightToFieldName"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def left_from(self):
        return self.get_field("LeftFromFieldName")

    @property
    def left_to(self):
        return self.get_field("LeftToFieldName")

    @property
    def right_from(self):
        return self.get_field("RightFromFieldName")

    @property
    def right_to(self):
        return self.get_field("RightToFieldName")


class SiteAddress(LRSHelper):
    HEADER = (
        *LRSHelper.HEADER,
        Header("Address Number", "address", json="AddressNumberFieldName"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def address(self):
        return self.get_field("AddressNumberFieldName")


class LocationReferencingDataset(DataElementBase):
    SHEET_PREFIX = "LR"
    HEADER = (
        *DataElementBase.HEADER,
        Header("LRS ID", "lrs_id", json="lrsId"),
        Header("Schema Version", "schema_version", json="schemaVersion"),
        Header("LRS Version", "lrs_version", json="lrsDatasetVersion", null="3"),
        Header("Pro Version", "pro_version", json="proVersion"),
        Header("Conflict Prevention Enabled", "conflict", json="conflictPreventionEnabled", enum=BooleanType),
        Header("Allow Lock Transfer", "lock_transfer", json="allowLockTransfer", enum=BooleanType),
        Header("Use Elevation Dataset", "elevation", json="useElevationDataset", enum=BooleanType),
        Header("Z Factor", "z_factor", json="zFactor"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)
        self._m = meta = data["lrsMetaData"]

        # Associate fields with schema tables.
        for base, fc_type in [
            ("centerline", "FC"),
            ("centerlineSequence", "Table"),
            ("calibrationPoint", "FC"),
            ("redline", "FC"),
        ]:
            data[base] = dict(table=meta[f"{base}{fc_type}Name"], **meta["fieldNames"][base])

        # Move address classes to metadata root so they operate similar to schema tables.
        addresses = meta.get("addressClass", [])
        for base in ("AddressRange", "SiteAddress"):
            key = f"{base}FeatureClassName"
            for address in addresses:
                if key in address:
                    data[base] = dict(table=address[key], **address)
                    break

        # Associate intersection/event layers with the network.
        event_lookup: dict[tuple[int, str], dict] = {}
        for network in meta.get("networks", []):
            for event in network.get("eventTables", []):
                event_lookup[(network["networkId"], event["eventId"])] = event

        for rule in data.get("EventBehaviorRules", {}).get("eventBehaviorRules", []):
            if event := event_lookup.get((rule["NetworkId"], rule["EventTableId"])):
                # Convert enum codes to strings.
                event.setdefault("eventBehaviors", []).append(
                    {
                        esriLRSActivityType.from_code(b["ActivityType"])
                        .name: esriLRSEventBehaviorType.from_code(b["BehaviorType"])
                        .name
                        for b in rule["EventBehaviors"]
                    }
                )

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result.update(
            versioned=False,
            configurationKeyword="",
            changeTracked=False,
            replicaTracked=False,
        )

        return result

    @property
    def schema_version(self) -> int:
        return self._m["schemaVersion"]

    @property
    def lrs_version(self) -> int:
        return self._m.get("lrsDatasetVersion")

    @property
    def pro_version(self) -> str:
        return self._m.get("proVersion")

    @property
    def lrs_id(self) -> str:
        return self._m.get("lrsId")

    @property
    def conflict(self) -> bool:
        return self._m["conflictPreventionEnabled"]

    @property
    def lock_transfer(self) -> bool:
        return self._m["allowLockTransfer"]

    @property
    def elevation(self) -> bool:
        return self._m["useElevationDataset"]

    @property
    def z_factor(self) -> int:
        return self._m["zFactor"]

    def networks(self) -> BaseCollection:
        return self._make(Network, self._m.get("networks", []))

    def events(self) -> BaseCollection:
        return self._make(Event, (e.events() for e in self.networks()), merge=True)

    def network_fields(self) -> BaseCollection:
        return self._make(NetworkField, (n.network_fields() for n in self.networks()), merge=True)

    def route_fields(self) -> BaseCollection:
        return self._make(RouteField, (n.route_fields() for n in self.networks()), merge=True)

    def intersections(self) -> BaseCollection:
        return self._make(Intersection, (n.intersections() for n in self.networks()), merge=True)

    def route_rules(self) -> BaseCollection:
        return self._make(RouteDominance, (n.rules() for n in self.networks()), merge=True)

    def intersection_fields(self) -> BaseCollection:
        return self._make(IntersectionField, (i.fields() for i in self.intersections()), merge=True)

    def intersection_layers(self) -> BaseCollection:
        return self._make(IntersectionLayer, (i.layers() for i in self.intersections()), merge=True)

    def event_fields(self) -> BaseCollection:
        return self._make(EventField, (e.event_fields() for e in self.events()), merge=True)

    def referent_fields(self) -> BaseCollection:
        return self._make(ReferentField, (e.referent_fields() for e in self.events()), merge=True)

    def measure_fields(self) -> BaseCollection:
        return self._make(DerivedMeasureField, (e.measure_fields() for e in self.events()), merge=True)

    def stationing_fields(self) -> BaseCollection:
        return self._make(StationingField, (e.stationing_fields() for e in self.events()), merge=True)

    def behaviors(self) -> BaseCollection:
        return self._make(BehaviorRule, (e.behaviors() for e in self.events()), merge=True)

    def _create_properties(self, cls: type[LRSHelper], key: str):
        return cls(self._d.get(key, {}), self).properties(name=cls.class_name())

    def _pre_ordered(self) -> list["MockCollection"]:
        return [
            *super()._pre_ordered(),
            self._create_properties(CalibrationPoint, "calibrationPoint"),
            self._create_properties(Centerline, "centerline"),
            self._create_properties(CenterlineSequence, "centerlineSequence"),
            self._create_properties(Redline, "redline"),
            self._create_properties(AddressRange, "AddressRange"),
            self._create_properties(SiteAddress, "SiteAddress"),
        ]

    def _ordered(self) -> list["BaseCollection"]:
        return [
            self.networks(),
            self.network_fields(),
            self.route_fields(),
            self.route_rules(),
            self.intersections(),
            self.intersection_fields(),
            self.intersection_layers(),
            self.events(),
            self.event_fields(),
            self.referent_fields(),
            self.measure_fields(),
            self.stationing_fields(),
            self.behaviors(),
        ]
