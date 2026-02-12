import dataclasses
import os
import pathlib
import uuid
from typing import Callable, Literal

import arcpy

from .. import template
from ..common import write_csv, value_to_int, unique_values, FunctionsToFile, get_where_clause
from ..._logging import get_logger

logger = get_logger(__name__)

REQ_FIELDS = [
    "whereclause",
    "description",
    "sequencename",
    "startingvalue",
    "incrementvalue",
    "prefix",
    "suffix",
    "padding",
    "separator",
]


@dataclasses.dataclass
class GenerateIDInfo:
    seq_info: list = dataclasses.field(default_factory=list)
    gp_calls: list[tuple[Callable, dict]] = dataclasses.field(default_factory=list)
    sequences: dict = dataclasses.field(default_factory=dict)
    fs_switch: dict = dataclasses.field(default_factory=dict)
    all_values: list = dataclasses.field(default_factory=list)
    has_sql: bool = False


def id_by_builder(
    builder_values,
    gdb_path,
):
    seq_info = []
    gp_calls = []
    all_values = []
    sequences = {}
    # this is to ensure the Expects writes all fields as we need to use the FS filter
    has_sql = False

    if not builder_values:
        builder_values = [
            [
                None,
                "Generate an ID for any row in the class",
            ]
            + ([None] * 9)
        ]

    intersect_lookup = {}
    fs_switch = {}
    generated_seq_id = 1
    for (
        where_clause,
        description,
        seq_base_name,
        start_val,
        inc_val,
        prefix,
        suffix,
        padding,
        separator,
        *rest,
    ) in builder_values:
        if len(rest) >= 3:
            intersect_class, intersect_field, intersect_sql, *_ = rest
        else:
            intersect_class = intersect_field = intersect_sql = None

        if where_clause:
            has_sql = True
        try:
            padding = int(padding)
        except:
            padding = 0

        start_val = value_to_int(start_val) or 1
        inc_val = value_to_int(inc_val) or 1

        where_clause = where_clause or ""

        generated_seq = []
        if not seq_base_name:
            seq_base_name = f"sequence{generated_seq_id}"
            generated_seq_id += 1

        if seq_base_name[0].isdigit():
            arcpy.AddIDMessage("ERROR", 160, seq_base_name)  # %s must not start with a numeric or special character.
            return None

        base_name = None
        intersect_seq = {}
        intersect_exp = None
        intersect_class_path = None
        intersect_oid_field = None
        sequence_name = None

        if intersect_class:
            intersect_exp = get_where_clause(intersect_class) or intersect_sql
            intersect_d = arcpy.Describe(intersect_class)
            intersect_oid_field = intersect_d.OIDFieldName
            intersect_class_path = intersect_d.catalogPath
            base_name = os.path.basename(intersect_class_path)
            if base_name not in intersect_lookup:
                intersect_lookup[base_name] = unique_values(intersect_class, intersect_field)
            for intersect_id in intersect_lookup[base_name]:
                # Sequence name cannot start with a number
                s_name = f"{seq_base_name}_{base_name}_{intersect_field}_{intersect_id}"
                sequence_name = s_name if len(s_name) < 100 else f"s{uuid.uuid4().hex[:-1]}"
                generated_seq.append(sequence_name)
                intersect_seq[str(intersect_id)] = sequence_name
        else:
            sequence_name = seq_base_name
            generated_seq.append(sequence_name)

        fs_key = None
        if base_name and intersect_field:
            fs_switch[fs_key:=f"{base_name}|{intersect_field}"] = template.FeatureSetByName(
                base_name,
                fields=intersect_field,
                include_geometry=False,
            )
        seq_info.append(
            {
                "where_clause": where_clause,
                "description": description,
                "prefix": prefix,
                "suffix": suffix,
                "padding": "0" * padding,
                "sequence_key": sequence_name if not intersect_seq else None,
                "separator": separator,
                "intersect_values": {
                    "target_name": fs_key,
                    "where_clause": intersect_exp,
                    "spatial_operator": "Intersects",
                    "search_distance": None,
                    "search_units": None,
                    "order_by_clause": intersect_oid_field,
                    "row_id_field": intersect_field,
                    "id_values": intersect_seq,
                },
            }
        )

        all_values.append(
            [
                where_clause,
                description,
                seq_base_name,
                start_val,
                inc_val,
                prefix,
                suffix,
                padding,
                separator,
                intersect_class_path,
                intersect_field,
                intersect_exp,
            ]
        )

        for seq_name in generated_seq:
            sequences[seq_name] = template.ArcadeFunction("NextSequenceValue", seq_name)
            gp_calls.append(
                (
                    arcpy.CreateDatabaseSequence_management,
                    dict(
                        in_workspace=gdb_path,
                        seq_name=seq_name,
                        seq_start_id=start_val,
                        seq_inc_value=inc_val,
                    ),
                )
            )
    return GenerateIDInfo(
        seq_info,
        gp_calls,
        sequences,
        fs_switch,
        all_values,
        has_sql,
    )


def write_generate_id_csv(data: list, out_folder: os.PathLike) -> pathlib.Path:
    return write_csv(
        pathlib.Path(out_folder),
        file_name="ID_Table",
        data=data,
        header=REQ_FIELDS,
    )


def build_field_combos(input_table: str, fields: list):
    import itertools

    data = []

    subtypes = arcpy.da.ListSubtypes(table=input_table)
    d = arcpy.Describe(input_table)
    fields = [fld.casefold() for fld in fields]
    field_lookup = {fld.name.casefold(): fld.type for fld in d.fields if fld.name.casefold() in fields}

    subtype_field = getattr(d, "subtypeFieldName", "").casefold()

    for stcode, stdict in subtypes.items():
        all_values = []
        if subtype_field in field_lookup:
            all_values.append([(f"{subtype_field} = {stcode}", stdict["Name"])])

        for field, (default_value, domain) in stdict["FieldValues"].items():
            if not (field_type := field_lookup.get(field.casefold())) or subtype_field == field.casefold():
                continue
            if not domain or domain.domainType != "CodedValue":
                # TODO, should we do anything on a no domain field?
                continue
            all_values.append([(f"{field} = {k!r}", v) for k, v in domain.codedValues.items()])
        # product does not like and empty list
        if all_values:
            for row in itertools.product(*all_values):
                sql_parts, display_values = zip(*row)
                data.append([" AND ".join(sql_parts), ", ".join(display_values), *([None] * (len(REQ_FIELDS) - 2))])
    return data


def build_sequences(
    in_table: str,
    workspace_path: str,
    definition_method: Literal["BUILDER", "TABLE", "CODED_VALUES"],
    id_options: tuple[
        tuple[
            str | None,
            str | None,
            str | None,
            int,
            int,
            str | None,
            str | None,
            str | None,
        ],
        ...,
    ]
    | None = None,  # (SQL, Description, Name, Start, Increment, Prefix, Suffix, Padding, Separator,)
    id_table: arcpy.RecordSet | None = None,
    coded_value_fields: tuple[str, ...] | None = None,
    intersect_class_field: tuple[
        tuple[
            str,
            str,
        ],
    ]
    | None = None,  # (Class, Field)
):
    if definition_method.casefold() == "table":
        if not id_table or not arcpy.Exists(id_table):
            seq_values = id_by_builder(
                builder_values=None,
                gdb_path=workspace_path,
            )
        else:
            missing = set(REQ_FIELDS) - set(f.name.casefold() for f in arcpy.ListFields(id_table))
            if missing:
                arcpy.AddIDMessage("ERROR", 3028)  # Dataset has missing required fields.
                return

            with arcpy.da.SearchCursor(id_table, REQ_FIELDS) as cursor:
                table_rows = list(cursor)
            seq_values = id_by_builder(
                builder_values=table_rows,
                gdb_path=workspace_path,
            )
    elif definition_method.casefold() == "coded_values":
        combo_data = build_field_combos(
            input_table=in_table,
            fields=coded_value_fields,
        )
        seq_values = id_by_builder(
            builder_values=combo_data,
            gdb_path=workspace_path,
        )
    else:
        updated_options = []
        for row in id_options:
            if len(row) >= 10:
                if row[9]:
                    new_row = list(row[:-1]) + row[9].split("::", 1) + [None]
                else:
                    new_row = list(row[:-1]) + [None, None, None]
            else:
                new_row = row
            updated_options.append(new_row)
        seq_values = id_by_builder(
            builder_values=updated_options,
            gdb_path=workspace_path,
        )
    return seq_values


def create_seq_script(output_folder: str, workspace_path: str, seq_values: GenerateIDInfo):
    out_seq_script = pathlib.Path(arcpy.CreateUniqueName("create_database_sequences.py", workspace=output_folder))

    from io import StringIO

    s = StringIO()
    all_args = []
    for _, args in seq_values.gp_calls:
        arg_copy = args.copy()
        arg_copy.pop("in_workspace")
        all_args.append(arg_copy)

    script_code = f"""
import arcpy

delete_seq = False
gdb = {workspace_path!r}
args = {all_args}
for arg in args:
    if delete_seq:
        arcpy.DeleteDatabaseSequence_management(in_workspace=gdb, seq_name=arg['seq_name'])
    else:
        arcpy.CreateDatabaseSequence_management(in_workspace=gdb, **arg)
    """
    s.write(script_code)

    with out_seq_script.open("w", encoding="utf-8") as writer:
        writer.write(FunctionsToFile.get_string(s, 80))
    return out_seq_script
