from ..constants import esriFieldTypeDomain


date_like = {
    esriFieldTypeDomain.esriFieldTypeDate.name,
    esriFieldTypeDomain.esriFieldTypeDateOnly.name,
    esriFieldTypeDomain.esriFieldTypeTimeOnly.name,
}


def convert_field(data: dict):
    from ..conversion.table import Field
    from ..date_utils import to_stamp

    field = Field.to_json(data)

    if domain := field["domain"]:
        # Domains at the field level are serialized differently than domains at the workspace level.
        domain["domainName"] = domain.pop("name")
        domain.pop("type")
        if r := domain.pop("range", None):
            domain["minValue"], domain["maxValue"] = r
    else:
        field.pop("domain")

    if field["type"] == esriFieldTypeDomain.esriFieldTypeDate.name and (val := field.get("defaultValue")) is not None:
        field["defaultValue"] = to_stamp(val)

    return field


def convert_fields(data: list[dict]):
    return dict(fields=dict(fieldArray=list(map(convert_field, data))))


def convert_subtype(data: dict, field_types: dict[str, str]):
    from ..conversion.table import Subtype, SubtypeFieldInfo
    from ..date_utils import to_stamp

    subtype = Subtype.to_json(data)
    info = [SubtypeFieldInfo.to_json(info) for info in data[Subtype.INFO] or []]
    for row in info:
        if (val := row.get("defaultValue")) is None or field_types.get(row["fieldName"].casefold()) not in date_like:
            continue
        row["defaultValue"] = to_stamp(val)

    return subtype | {Subtype.INFO: info}


def convert_subtypes(data: list[dict], field_types: dict[str, str]):
    return dict(subtypes=[convert_subtype(d, field_types) for d in data])


def convert_index(data: dict):
    from ..conversion.table import Index

    index = Index.to_json(data)
    if fields := data.get("fields"):
        for field in fields["fieldArray"]:
            if "aliasName" not in field:  # Alias might not be stored at field level, but it exists for indices.
                field["aliasName"] = field["name"]
        index.update(fields=fields)

    return index


def convert_indices(data: list[dict]):
    return dict(indexes=dict(indexArray=list(map(convert_index, data))))


def convert_attribute_rule(data: dict):
    from ..conversion.table import AttributeRule

    return AttributeRule.to_json(data)


def _assign_order(rules: list[dict]):
    """Assigns evaluation order to the collection of attribute rules"""
    e = "evaluationOrder"

    existing: dict[tuple, set] = {}
    for rule in rules:
        inner = existing.setdefault((rule["type"], rule["batch"]), set())
        if isinstance(order := rule[e], int) and order > 0:
            if order in inner:
                rule[e] = None  # Duplicate evaluation order
            else:
                inner.add(order)
        else:
            rule[e] = None  # Invalid evaluation order

    for rule in rules:
        if rule[e]:
            continue
        rule[e] = (new := max(inner := existing[(rule["type"], rule["batch"])], default=0) + 1)
        inner.add(new)


def convert_attribute_rules(data: list[dict]):
    rules = list(map(convert_attribute_rule, data))
    _assign_order(rules)

    return dict(attributeRules=rules)


def convert_relationship_rule(data: dict):
    from ..conversion.table import RelationshipClassRule

    return RelationshipClassRule.to_json(data)


def convert_relationship_rules(data: list[dict]):
    return dict(relationshipRules=list(map(convert_relationship_rule, data)))


def convert_property_set(data: dict):
    from ..common import load_json, dump_json

    result = []
    for k, v in data.items():
        if isinstance(v, str) and v.startswith(("{", "[")) and v.endswith(("}", "]")):
            try:  # Looks like JSON, properly format
                v = dump_json(load_json(v))
            except:
                pass
        elif v is None:
            v = ""
        result.extend((k, v))

    return result
