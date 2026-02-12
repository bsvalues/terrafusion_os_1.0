from functools import cache
from typing import Optional, TYPE_CHECKING

from .helper import *
from ..constants import *

if TYPE_CHECKING:
    from .workspace import Table, RelationshipClass

__all__ = [
    "Field",
    "Index",
    "Subtype",
    "SubtypeFieldInfo",
    "AttributeRule",
    "RelationshipClassRule",
]


class RelationshipClassRule(Base):
    parent: "RelationshipClass"

    NAME = "Relationship Class Name"
    ID = "Rule ID"
    ORIGIN_SUBTYPE = "Origin Subtype"
    ORIGIN_MIN = "Origin Min Cardinality"
    ORIGIN_MAX = "Origin Max Cardinality"
    DESTINATION_SUBTYPE = "Destination Subtype"
    DESTINATION_MIN = "Destination Min Cardinality"
    DESTINATION_MAX = "Destination Max Cardinality"

    HEADER = (
        Header(ID, "id", json="ruleID"),
        Header(ORIGIN_SUBTYPE, "origin_subtype", json="originSubtypeCode"),
        Header(ORIGIN_MIN, "origin_min", json="originMinimumCardinality"),
        Header(ORIGIN_MAX, "origin_max", json="originMaximumCardinality"),
        Header(DESTINATION_SUBTYPE, "destination_subtype", json="destinationSubtypeCode"),
        Header(DESTINATION_MIN, "destination_min", json="destinationMinimumCardinality"),
        Header(DESTINATION_MAX, "destination_max", json="destinationMaximumCardinality"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)

        result.update(
            datasetType="RelationshipRule",
            helpString="",
        )

        for key in (
            "originMinimumCardinality",
            "originMaximumCardinality",
            "destinationMinimumCardinality",
            "destinationMaximumCardinality",
        ):
            if result[key] is None:
                result.pop(key)

        return result

    @property
    def name(self) -> ValueWrapper:
        return self.parent.name.as_link()

    def origin(self) -> Optional["Table"]:
        from .workspace import Table

        return self.get_gdb().get_child(Table, self._d["originClassID"])

    def destination(self) -> Optional["Table"]:
        from .workspace import Table

        return self.get_gdb().get_child(Table, self._d["destinationClassID"])

    @property
    def id(self) -> int:
        return self._d["ruleID"]

    def _get_subtype(self, origin: bool):
        if origin:
            key = "origin"
            table = self.origin()
        else:
            key = "destination"
            table = self.destination()
        if table is None:
            return
        if sub := table.get_subtype(self._d[f"{key}SubtypeCode"]):
            return sub.name.as_link()

    @property
    def origin_subtype(self) -> Optional[ValueWrapper]:
        return self._get_subtype(origin=True)

    @property
    def origin_min(self) -> Optional[int]:
        return self._d.get("originMinimumCardinality")

    @property
    def origin_max(self) -> Optional[int]:
        return self._d.get("originMaximumCardinality")

    @property
    def destination_subtype(self) -> Optional[ValueWrapper]:
        return self._get_subtype(origin=False)

    @property
    def destination_min(self) -> Optional[int]:
        return self._d.get("destinationMinimumCardinality")

    @property
    def destination_max(self) -> Optional[int]:
        return self._d.get("destinationMaximumCardinality")


class Field(Base):
    parent: "Table"

    TYPE = "Type"
    NAME = "Name"
    ALIAS = "Alias"
    LENGTH = "Length"
    PRECISION = "Precision"
    SCALE = "Scale"
    NULLABLE = "Nullable"
    EDITABLE = "Editable"
    REQUIRED = "Required"
    DEFAULT = "Default Value"
    DOMAIN = "Domain"
    USAGE = "Usage"

    HEADER = (
        Header(NAME, "name", json="name"),
        Header(ALIAS, "alias", json="aliasName"),
        Header(TYPE, "type", json="type", enum=esriFieldType),
        Header(USAGE, "usage_str"),
        Header(NULLABLE, "is_nullable", json="isNullable", enum=BooleanType),
        Header(DOMAIN, "domain", json="domain"),
        Header(DEFAULT, "default", json="defaultValue"),
        Header(PRECISION, "precision", json="precision"),
        Header(SCALE, "scale", json="scale"),
        Header(LENGTH, "length", json="length"),
        Header(EDITABLE, "is_editable", json="editable", enum=BooleanType),
        Header(REQUIRED, "is_required", json="required", enum=BooleanType),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)
        for k, v in [
            ("defaultValue", None),
            ("editable", True),
            ("required", False),
            ("aliasName", None),
        ]:
            if result[k] is v:
                result.pop(k)

        for k in (
            "geometryDef",
            "rasterDef",
        ):
            if (v := data.get(k)) is not None:
                result[k] = v

        return result

    @property
    def alias(self) -> str:
        return self._d.get("aliasName", None)

    @property
    def type(self) -> str:
        return self._d["type"]

    @property
    def length(self) -> int:
        return self._d["length"]

    @property
    def default(self):
        return self._d.get("defaultValue", None)

    @property
    def domain(self) -> Optional[ValueWrapper]:
        from .workspace import WorkspaceDomain

        if name := self._d.get("domain", {}).get("domainName"):
            return ValueWrapper.new(WorkspaceDomain, name)

    @property
    def is_nullable(self) -> bool:
        return self._d["isNullable"]

    @property
    def is_required(self) -> bool:
        return self._d.get("required", False)

    @property
    def is_editable(self) -> bool:
        return self._d.get("editable", True)

    @property
    def precision(self) -> int:
        return self._d["precision"]

    @property
    def scale(self) -> int:
        return self._d["scale"]

    @property
    @cache
    def usage(self) -> list[str]:
        """Extra information about how the field is used in the system"""
        from .workspace import Table

        data = []
        name = str(self.name).casefold()
        parent: Table = self.parent

        for field, key in [
            (parent.subtype_field, "Subtype"),
            (parent.length_field, "Length"),
            (parent.area_field, "Area"),
            (parent.creator_field, "Creator"),
            (parent.created_field, "Created"),
            (parent.editor_field, "Editor"),
            (parent.edited_field, "Edited"),
        ]:
            if field is None:
                continue
            if str(field).casefold() == name:
                data.append(key)
                break  # A field can't be multiple of these.

        index: Index
        for index in parent.indexes():
            for field in index.fields:
                if field.casefold() == name:
                    data.append("Index")
                    break

        return sorted(data)

    @property
    def usage_str(self) -> str:
        return self.DELIM.join(self.usage)


class Index(Base):
    parent: "Table"

    NAME = "Name"
    UNIQUE = "Is Unique"
    ASCENDING = "Is Ascending"
    FIELDS = "Field Name"
    HEADER = (
        Header(NAME, "name", json="name"),
        Header(UNIQUE, "is_unique", json="isUnique", enum=BooleanType),
        Header(ASCENDING, "is_ascending", json="isAscending", enum=BooleanType),
        Header(FIELDS, "fields_str"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @property
    def is_unique(self) -> bool:
        return self._d["isUnique"]

    @property
    def is_ascending(self) -> bool:
        return self._d["isAscending"]

    @property
    def fields(self) -> list[str]:
        return [f["name"] for f in self._d["fields"]["fieldArray"]]

    @property
    def fields_str(self) -> ValueWrapper:
        if len(fields := self.fields) != 1:
            return ValueWrapper(self.DELIM.join(fields))
        return self.parent.name.extend(Field, fields[0])  # Can only hyperlink if exactly 1 field


class SubtypeFieldInfo(Base):
    parent: "Subtype"

    NAME = "Subtype Name"
    CODE = "Subtype Code"
    FIELD = "Field Name"
    DEFAULT = "Default Value"
    DOMAIN = "Domain Name"
    HEADER = (
        Header(NAME, "name"),
        Header(CODE, "code"),
        Header(FIELD, "field", json="fieldName"),
        Header(DEFAULT, "default", json="defaultValue"),
        Header(DOMAIN, "domain", json="domainName"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def to_json(cls, data: dict) -> dict:
        result = super().to_json(data)
        if result["domainName"] is None:
            result["domainName"] = ""
        elif result["defaultValue"] is None:
            result.pop("defaultValue")
        return result

    @property
    def name(self) -> ValueWrapper:
        return self.parent.name.as_link()

    @property
    def code(self) -> int:
        return self.parent.code

    @property
    def field(self) -> ValueWrapper:
        # Fields are anchors (Table>Subtype>Field) as well as links (Table>Field)
        anchor = self.parent.name.extend(SubtypeFieldInfo, field := self._d["fieldName"], as_anchor=True)
        return anchor.replace(link=self.parent.parent.get_field(field).name.anchor)

    @property
    def domain(self) -> Optional[ValueWrapper]:
        from .workspace import WorkspaceDomain

        if name := self._d.get("domainName"):
            return ValueWrapper.new(WorkspaceDomain, name)

    @property
    def default(self) -> str:
        return self._d.get("defaultValue")


class Subtype(Base):
    parent: "Table"

    NAME = "Name"
    CODE = "Code"
    INFO = "fieldInfos"
    HEADER = (
        Header(NAME, "name", json="subtypeName"),
        Header(CODE, "code", json="subtypeCode"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent, name="subtypeName")

    @property
    def code(self) -> int:
        return self._d["subtypeCode"]

    def field_infos(self) -> BaseCollection:
        # Remove any info entries that are pointing to non-existent fields.
        fields = {f["name"].casefold() for f in self.parent._d.get("fields", {}).get("fieldArray", [])}
        return self._make(
            SubtypeFieldInfo,
            [info for info in self._d.get("fieldInfos", []) if info["fieldName"].casefold() in fields],
        )


class AttributeRule(Base):
    parent: "Table"

    ID = "ID"
    VERSION = "Minimum Client Version"
    NAME = "Name"
    TYPE = "Type"
    BATCH = "Batch"
    INSERT = "Insert Trigger"
    UPDATE = "Update Trigger"
    DELETE = "Delete Trigger"
    SUBTYPE = "Subtype"
    FIELD = "Field Name"
    SEVERITY = "Severity"
    ERROR_NUM = "Error Number"
    ERROR_MSG = "Error Message"
    EDITABLE = "Editable"
    ENABLED = "Enabled"
    EXCLUDE = "Exclude From Client"
    TAGS = "Tags"
    TIMESTAMP = "Creation Time"
    SCRIPT = "Script"
    DESC = "Description"
    ORDER = "Evaluation Order"
    CATEGORY = "Category"
    PARAMETERS = "Check Parameters"
    TRIGGER_FIELDS = "Triggering Fields"
    HEADER = (
        Header(ID, "id", json="id"),
        Header(VERSION, "client_version", json="requiredGeodatabaseClientVersion"),
        Header(ORDER, "evaluation_order", json="evaluationOrder"),
        Header(NAME, "name", json="name"),
        Header(DESC, "description", json="description"),
        Header(TYPE, "type", json="type", enum=esriAttributeRuleType),
        Header(BATCH, "batch", json="batch", enum=BooleanType),
        Header(INSERT, "insert_trigger", enum=BooleanType),
        Header(UPDATE, "update_trigger", enum=BooleanType),
        Header(DELETE, "delete_trigger", enum=BooleanType),
        Header(TRIGGER_FIELDS, "triggering_fields_str", json="triggeringFields"),
        Header(SUBTYPE, "subtype", json="subtypeCode"),
        Header(FIELD, "field_name", json="fieldName"),
        Header(SEVERITY, "severity", json="severity"),
        Header(ERROR_NUM, "error_number", json="errorNumber"),
        Header(ERROR_MSG, "error_message", json="errorMessage"),
        Header(EDITABLE, "editable", json="userEditable", enum=BooleanType),
        Header(ENABLED, "enabled", json="isEnabled", enum=BooleanType),
        Header(EXCLUDE, "exclude_client", json="excludeFromClientEvaluation", enum=BooleanType),
        Header(TAGS, "tags", json="tags"),
        Header(TIMESTAMP, "creation_time", json="creationTime"),
        Header(CATEGORY, "category", json="category"),
        Header(PARAMETERS, "check_parameters", json="checkParameters"),
        Header(SCRIPT, "script", json="scriptExpression"),
    )

    def __init__(self, data, parent):
        super().__init__(data, parent)

    @classmethod
    def default_check_parameters(cls):
        """Default Check Parameters value"""
        return cls._json({"type": "PropertySet", "propertySetItems": []})

    @classmethod
    def to_json(cls, data: dict) -> dict:
        from ..common import load_json

        result: dict[str, ...] = super().to_json(data) | dict(referencesExternalService=False)

        if t := result.get("creationTime"):
            result["creationTime"] = cls._stamp(t)

        events = result["triggeringEvents"] = []
        for key, event in zip((cls.INSERT, cls.UPDATE, cls.DELETE), esriAttributeRuleTriggeringEvent):
            if data[key]:
                events.append(event.name)

        result["checkParameters"] = load_json(result["checkParameters"] or cls.default_check_parameters())

        # Set defaults
        for key, val, new in [
            ("errorMessage", None, ""),
            ("severity", None, -1),
            ("subtypeCode", None, -1),
            ("fieldName", None, ""),
            ("tags", None, ""),
            ("description", None, ""),
            ("category", None, -1),
            ("userEditable", None, True),
            ("errorNumber", None, -1),
        ]:
            if result[key] is val:
                result[key] = new

        result["triggeringFields"] = trigger.split(cls.DELIM) if (trigger := result["triggeringFields"]) else []

        return result

    @property
    def id(self) -> int:
        return self._d["id"]

    @property
    def type(self) -> str:
        return self._d["type"]

    @property
    def evaluation_order(self) -> int:
        return self._d["evaluationOrder"]

    @property
    def field_name(self) -> Optional[ValueWrapper]:
        if field := self.parent.get_field(self._d.get("fieldName")):
            return field.name.as_link()

    @property
    def subtype(self) -> Optional[ValueWrapper]:
        if subtype := self.parent.get_subtype(self._d["subtypeCode"]):
            return subtype.name.as_link()

    @property
    def description(self) -> str:
        return self._d["description"] or None

    @property
    def error_number(self) -> Optional[int]:
        error = self._d["errorNumber"]
        if error == -1:
            return
        return error

    @property
    def error_message(self) -> Optional[str]:
        return self._d["errorMessage"] or None

    @property
    def editable(self) -> Optional[bool]:
        # Only calculation supports editable fields.
        if self.type.endswith("Calculation"):
            return self._d["userEditable"]

    @property
    def enabled(self) -> bool:
        return self._d["isEnabled"]

    @property
    def references_external_service(self) -> bool:
        return self._d["referencesExternalService"]

    @property
    def exclude_client(self) -> bool:
        return self._d["excludeFromClientEvaluation"]

    @property
    def script(self) -> str:
        return self._d["scriptExpression"]

    @property
    def triggers(self) -> list[str]:
        return [self._strip("esriARTE", t) for t in self._d["triggeringEvents"]]

    def _trigger(self, key: str) -> bool:
        for t in self.triggers:
            if t.endswith(key):
                return True
        return False

    @property
    def insert_trigger(self) -> bool:
        return self._trigger("Insert")

    @property
    def delete_trigger(self) -> bool:
        return self._trigger("Delete")

    @property
    def update_trigger(self) -> bool:
        return self._trigger("Update")

    @property
    def category(self) -> Optional[int]:
        cat = self._d["category"]
        return None if cat == -1 else cat

    @property
    def check_parameters(self) -> Optional[str]:
        if (c := self._d["checkParameters"])["propertySetItems"]:  # Only serialize if non-empty.
            return self._json(c)

    @property
    def severity(self) -> Optional[int]:
        # Only validation supports severity
        if not self.type.endswith("Validation"):
            return
        severity = self._d["severity"]
        if severity == -1:
            return
        # Severity of 0 was allowed at some point, but is no longer.
        return severity or 1

    @property
    def tags(self) -> Optional[str]:
        return self._d["tags"] or None

    @property
    def batch(self) -> bool:
        # Validation rules always have batch == True
        return self._d["batch"] or self.type.endswith("Validation")

    @property
    def client_version(self) -> str:
        return self._d["requiredGeodatabaseClientVersion"]

    @property
    def creation_time(self):
        return self._time(self._d["creationTime"])

    @property
    def triggering_fields(self) -> list[str]:
        return self._d.get("triggeringFields", [])

    @property
    def triggering_fields_str(self) -> ValueWrapper:
        if len(fields := self.triggering_fields) != 1:
            return ValueWrapper(self.DELIM.join(fields))
        return self.parent.name.extend(Field, fields[0])  # Can only hyperlink if exactly 1 field
