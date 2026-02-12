from . import helper
from .helper import *


class ParcelFabric:
    def __init__(self, controller: dict):
        self.payload = controller

    def _create_props_container(self):
        from ..common import change_first_character
        from ..date_utils import to_datetime

        for key in (
            "maximumNumberOfParcelsForBuild",
            "maximumNumberOfParcelsForValidate",
            "maximumParcelCountForRecordShape",
            "parcelFabricCreatedTime",
            "parcelFabricLastModifiedTime",
        ):
            yield change_first_character(key, lower=False)
            if key.endswith("Time"):  # Convert to dateTime
                yield to_datetime(self.payload[key])
            else:
                yield self.payload[key]

    def convert_properties(self):
        d = self.payload

        return [
            E.Version(d["version"]),
            E.MinorVersion(d["minorVersion"]),
            E.ConfigurationKeyword(d["configurationKeyword"] or None),
            E.TopologyEnabled(d["topologyEnabled"]),
            E.Topology(d["topology"]),
            E.ConnectionClassId(d["connectionClassId"]),
            E.PointClassId(d["pointClassId"]),
            E.RecordClassId(d["recordClassId"]),
            E.AdjustmentPointClassId(d["adjustmentPointClassId"]),
            E.AdjustmentLineClassId(d["adjustmentLineClassId"]),
            E.AdjustmentVectorClassId(d["adjustmentVectorClassId"]),
            E.ArrayOfPropertySet(make_type("ArrayOfPropertySet")),
            helper.create_property_sets(
                "PropsContainer",
                dict(type="PropertySet", propertySetItems=list(self._create_props_container())),
            ),
            E.ParcelRules(make_type("ArrayOfParcelRule")),
            E.SavedTopologyClassIDs(make_type("ArrayOfInt")),
            E.TopologyRules(make_type("ArrayOfTopologyRule")),
        ]

    def convert_parcel_types(self):
        poly, line = "polygonClassId", "lineClassId"
        lookup = {
            (poly, False): E.PolygonClasses(make_type("ArrayOfInt")),
            (line, False): E.LineClasses(make_type("ArrayOfInt")),
            (poly, True): E.LargePolygonClasses(make_type("ArrayOfInt")),
            (line, True): E.LargeLineClasses(make_type("ArrayOfInt")),
            poly: E.PropsParcelClassIDs(make_type("ArrayOfInt")),
        }

        for parcel in self.payload["parcelTypes"]:
            for key in (poly, line):
                lookup[(key, parcel["isLarge"])].append(E.Int(parcel[key]))

            # The polygon classes store separate property sets for each. The names end with the class ID.
            lookup[poly].append(E.Int(class_id := parcel[poly]))
            yield helper.create_property_sets(
                f"PropsParcelType_{class_id}",
                dict(type="PropertySet", propertySetItems=["ParcelTypeName", parcel["parcelTypeName"]]),
            )

        yield from lookup.values()
