import dataclasses

import arcpy

__all__ = [
    "InputField",
    "OutputField",
    "SimpleFieldMap",
    "SimpleFieldMappings",
]


@dataclasses.dataclass
class InputField:
    table: str
    field: str
    start: int = -1
    end: int = -1

    def __str__(self):
        return "{table},{field},{start},{end}".format(
            table=f'"{self.table}"' if "," in self.table else self.table,
            field=self.field,
            start=self.start,
            end=self.end,
        )


@dataclasses.dataclass
class OutputField:
    name: str
    alias: str
    editable: bool
    nullable: bool
    required: bool
    length: int
    type: str
    precision: int
    scale: int

    def __str__(self):
        if (field_type := self.type) == "Integer":
            field_type = "Long"
        elif field_type == "String":
            field_type = "Text"
        elif field_type == "SmallInteger":
            field_type = "Short"
        return '{name} "{alias}" {editable} {nullable} {required} {length} {type} {scale} {precision}'.format(
            name=self.name,
            alias=self.alias.replace('"', "[double_quote]"),
            editable="true" if self.editable else "false",
            nullable="true" if self.nullable else "false",
            required="true" if self.required else "false",
            length=self.length,
            type=field_type,
            scale=self.scale,
            precision=self.precision,
        )


@dataclasses.dataclass
class SimpleFieldMap:
    outputField: OutputField = None
    mergeRule: str = "First"
    delimiter: str = ""
    inputFields: list[InputField] = dataclasses.field(default_factory=list)

    def __str__(self):
        base = "{output},{rule},{delimiter}".format(
            rule=self.mergeRule,
            delimiter=f'"{self.delimiter}"' if self.delimiter else "#",
            output=self.outputField,
        )
        if not self.inputFields:
            return base
        return "{base},{fields}".format(
            base=base,
            fields=",".join(map(str, self.inputFields)),
        )

    @classmethod
    def from_arcpy(cls, fm: arcpy.FieldMap, /):
        field: arcpy.Field
        if (field := getattr(fm, "outputField", None)) is None:
            return cls()
        return cls(
            OutputField(
                name=field.name,
                alias=field.aliasName,
                editable=field.editable,
                nullable=field.isNullable,
                required=field.required,
                length=field.length,
                type=field.type,
                precision=field.precision,
                scale=field.scale,
            ),
            mergeRule=fm.mergeRule,
            delimiter=fm.joinDelimiter,
            inputFields=[
                InputField(
                    table=fm.getInputTableName(i),
                    field=fm.getInputFieldName(i),
                    start=fm.getStartTextPosition(i),
                    end=fm.getEndTextPosition(i),
                )
                for i in range(fm.inputFieldCount)
            ],
        )


class SimpleFieldMappings:
    def __init__(self, *args: SimpleFieldMap):
        self.fieldMappings: list[SimpleFieldMap] = list(args)

    def __str__(self):
        return ";".join(map(str, self.fieldMappings))

    @classmethod
    def from_arcpy(cls, fms: arcpy.FieldMappings, /):
        return cls(*(SimpleFieldMap.from_arcpy(fm) for fm in fms.fieldMappings))

    def to_arcpy(self) -> arcpy.FieldMappings:
        fms = arcpy.FieldMappings()
        fms.loadFromString(str(self))
        return fms

    def find_missing_fields(self, table: str) -> list[dict]:
        """Finds fields that don't exist in table and extracts properties"""

        output_fields = []
        existing_fields = {f.name.casefold() for f in arcpy.ListFields(table)}
        for fm in self.fieldMappings:
            field = fm.outputField
            if field.name.casefold() in existing_fields:
                continue

            output_fields.append(
                dict(
                    field_name=field.name,
                    field_type=field.type,
                    field_precision=field.precision,
                    field_scale=field.scale,
                    field_length=field.length,
                    field_alias=field.alias,
                    field_is_nullable=field.nullable,
                    field_is_required=field.required,
                    field_domain=None,
                )
            )
        return output_fields
