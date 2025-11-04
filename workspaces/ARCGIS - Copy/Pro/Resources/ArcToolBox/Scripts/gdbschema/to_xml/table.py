from . import helper
from .helper import *
from ..common import change_first_character
from ..date_utils import to_datetime_str


def create_geometry_def(data: dict):
    return E.GeometryDef(
        make_type("GeometryDef"),
        E.AvgNumPoints(data["avgNumPoints"]),
        E.GeometryType(data["geometryType"]),
        E.HasM(data["hasM"]),
        E.HasZ(data["hasZ"]),
        helper.create_sr(data["spatialReference"]),
        *(E(change_first_character(key, lower=False), data[key]) for i in range(3) if (key := f"gridSize{i}") in data),
    )


def create_raster_def(data: dict):
    return E.RasterDef(
        make_type("RasterDef"),
        E.Description(data["description"]),
        E.IsByRef(data["isByRef"]),
        helper.create_sr(data["spatialReference"]),
        E.IsByFunction(data["isByFunction"]),
        E.IsInline(data["isInline"]),
    )


def convert_field(data: dict):
    from .workspace import convert_domain

    return E.Field(
        make_type("Field"),
        E.Name(data["name"]),
        E.Type(data["type"]),
        E.IsNullable(data["isNullable"]),
        E.Length(data["length"]),
        E.Precision(data["precision"]),
        E.Scale(data["scale"]),
        E.Required(data["required"]) if "required" in data else None,
        E.Editable(data["editable"]) if "editable" in data else None,
        E.DomainFixed(data["domainFixed"]) if "domainFixed" in data else None,
        create_geometry_def(data["geometryDef"]) if "geometryDef" in data else None,
        E.AliasName(data.get("aliasName", data["name"])),
        E.ModelName(data["modelName"]) if "modelName" in data else None,
        create_raster_def(data["rasterDef"]) if "rasterDef" in data else None,
        helper.element_from_field_type("DefaultValue", data["type"], data["defaultValue"])
        if "defaultValue" in data
        else None,
        convert_domain(data["domain"]) if "domain" in data else None,
    )


def convert_fields(data: list[dict]):
    return E.Fields(
        make_type("Fields"),
        E.FieldArray(
            make_type("ArrayOfField"),
            *map(convert_field, data),
        ),
    )


def convert_subtype(data: dict, field_lookup: dict[str, tuple[str, str]]):
    # While it isn't required for the information model, sorting infos to match the order they are in the field array
    # makes the result deterministic.
    infos = dict.fromkeys(field_lookup)

    for info in data["fieldInfos"]:
        domain = info.get("domainName") or None  # Domain can be an empty string.
        if (default := info.get("defaultValue")) == "":  # Default can be any value, so no "or None"
            default = None
        if domain is None and default is None:
            continue

        field_name, field_type = field_lookup[(key := info["fieldName"].casefold())]
        infos[key] = E.SubtypeFieldInfo(
            make_type("SubtypeFieldInfo"),
            E.FieldName(field_name),
            None if domain is None else E.DomainName(domain),
            None if default is None else helper.element_from_field_type("DefaultValue", field_type, default),
        )

    return E.Subtype(
        make_type("Subtype"),
        E.SubtypeName(data["subtypeName"]),
        E.SubtypeCode(data["subtypeCode"]),
        E.FieldInfos(make_type("ArrayOfSubtypeFieldInfo"), *infos.values()),
    )


def convert_subtypes(data: list[dict], fields: list[dict]):
    # Keeping original field case makes for deterministic output.
    field_lookup = {f["name"].casefold(): (f["name"], f["type"]) for f in fields}
    return E.Subtypes(
        make_type("ArrayOfSubtype"),
        *(convert_subtype(d, field_lookup) for d in data),
    )


def convert_index(data: dict):
    return E.Index(
        make_type("Index"),
        E.Name(data["name"]),
        E.IsUnique(data["isUnique"]),
        E.IsAscending(data["isAscending"]),
        convert_fields(data["fields"]["fieldArray"]),
    )


def convert_indices(data: list[dict]):
    return E.Indexes(
        make_type("Indexes"),
        E.IndexArray(
            make_type("ArrayOfIndex"),
            *map(convert_index, data),
        ),
    )


def convert_rc_key(data: dict):
    return E.RelationshipClassKey(
        make_type("RelationshipClassKey"),
        E.ObjectKeyName(data["objectKeyName"]),
        E.ClassKeyName(data["classKeyName"] or None),
        E.KeyRole(data["keyRole"]),
    )


def convert_rc_keys(tag: str, data: list[dict]):
    return E(
        tag,
        make_type("ArrayOfRelationshipClassKey"),
        *map(convert_rc_key, data),
    )


def convert_rc_rule(data: dict):
    cardinality = []
    for tag in ("Destination", "Origin"):
        for base in ("MinimumCardinality", "MaximumCardinality"):
            if (card := data.get(f"{change_first_character(tag, lower=True)}{base}")) is not None:
                cardinality.append(E(f"{tag}{base}", card))

    return E.RelationshipRule(
        make_type("RelationshipRule"),
        E.HelpString(data["helpString"] or None),
        E.RuleID(data["ruleID"]),
        E.DestinationClassID(data["destinationClassID"]),
        E.DestinationSubtypeCode(data["destinationSubtypeCode"]),
        E.OriginClassID(data["originClassID"]),
        E.OriginSubtypeCode(data["originSubtypeCode"]),
        *cardinality,
    )


def convert_rc_rules(data: list[dict]):
    return E.RelationshipRules(
        make_type("ArrayOfRelationshipRule"),
        *map(convert_rc_rule, data),
    )


def convert_field_group(data: dict):
    return E.FieldGroup(
        make_type("FieldGroup"),
        E.Name(data["name"]),
        helper.create_names("Fields", [{"name": n} for n in data["fieldNames"]["names"]]),
        E.IsEditingRestrictive(data["isEditingRestrictive"]),
    )


def convert_field_groups(data: list[dict]):
    return E.FieldGroups(
        make_type("ArrayOfFieldGroup"),
        *map(convert_field_group, data),
    )


def convert_attribute_rule(data: dict):
    return E.AttributeRule(
        make_type("AttributeRule"),
        E.ID(data["id"]),
        E.Name(data["name"]),
        E.Type(data["type"]),
        E.EvaluationOrder(data["evaluationOrder"]),
        E.FieldName(data["fieldName"] or None),
        E.SubtypeCode(data["subtypeCode"]),
        E.Description(data["description"] or None),
        E.ErrorNumber(data["errorNumber"]),
        E.ErrorMessage(data["errorMessage"] or None),
        E.UserEditable(data["userEditable"]),
        E.IsEnabled(data["isEnabled"]),
        E.ReferencesExternalService(data["referencesExternalService"]),
        E.ExcludeFromClientEvaluation(data["excludeFromClientEvaluation"]),
        E.ScriptExpression(data["scriptExpression"]),
        helper.create_strings("TriggeringEvents", data["triggeringEvents"]),
        helper.create_property_sets("CheckParameters", data["checkParameters"]),
        E.Category(data["category"]),
        E.Severity(data["severity"]),
        E.Tags(data["tags"] or None),
        E.Batch(data["batch"]),
        E.RequiredGeodatabaseClientVersion(data["requiredGeodatabaseClientVersion"]),
        E.CreationTime(to_datetime_str(data["creationTime"])),
        helper.create_strings("TriggeringFields", data.get("triggeringFields", [])),
    )


def convert_attribute_rules(data: list[dict]):
    return E.AttributeRules(
        make_type("ArrayOfAttributeRule"),
        *map(convert_attribute_rule, data),
    )


def convert_controller_membership(data: dict, schema: str):
    if "utilityNetworkName" in data:
        key = "UtilityNetwork"
        payload = [
            E.UtilityNetworkName(schema + data["utilityNetworkName"]),
        ]
    elif "topologyName" in data:
        key = "Topology"
        payload = [
            E.TopologyName(schema + data["topologyName"]),
            E.Weight(data["weight"]),
            E.XYRank(data["xyRank"]),
            E.ZRank(data["zRank"]),
            E.EventNotificationOnValidate(data["eventNotificationOnValidate"]),
        ]
    elif "geometricNetworkName" in data:
        key = "GeometricNetwork"
        payload = [
            E.GeometricNetworkName(schema + data["geometricNetworkName"]),
            E.EnabledFieldName(data["enabledFieldName"]),
            E.AncillaryRoleFieldName(data["ancillaryRoleFieldName"] or None),
            E.NetworkClassAncillaryRole(data["networkClassAncillaryRole"]),
        ]
    elif "networkDatasetName" in data:
        key = "NetworkDataset"
        payload = [
            E.NetworkDatasetName(schema + data["networkDatasetName"]),
        ]
    elif "terrainName" in data:
        key = "Terrain"
        payload = [
            E.TerrainName(schema + data["terrainName"]),
        ]
    elif "parcelDatasetName" in data:
        from ..constants import esriParcelClassType

        key = "ParcelDataset"
        # The adjustment classes aren't present in XML.
        adjust = (code := data["parcelClassType"]) >= 6

        payload = [
            E.ParcelDatasetName(None if adjust else data["parcelDatasetName"]),
            E.ParcelClassType(0 if adjust else code),
            E.ParcelClassTypeEnum(esriParcelClassType.from_code(0 if adjust else code).name),
            E.IsLargeParcelType(data["isLargeParcelType"]),
        ]
    elif "datasetName" in data:
        key = "LocationReferencingDataset"
        payload = [
            E.DatasetName(schema + data["datasetName"]),
            E.ClassRole(data["classRole"]),
        ]
    else:
        return

    return E.ControllerMembership(
        make_type(f"{key}Membership"),
        *payload,
    )


def convert_controller_memberships(data: list[dict], schema: str):
    return E.ControllerMemberships(
        make_type("ArrayOfControllerMembership"),
        *(convert_controller_membership(d, schema) for d in data),
    )
