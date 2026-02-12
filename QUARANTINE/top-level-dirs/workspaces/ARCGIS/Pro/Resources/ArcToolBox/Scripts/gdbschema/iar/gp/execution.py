import os
import os
import pathlib
from typing import Literal

import arcpy
from arcpy._mp import Layer

from .. import template
from ..common import get_where_clause, make_gp_calls
from ..._logging import get_logger

logger = get_logger(__name__)


def attribute_rule_args(
    *,
    name: str,
    rule_type: Literal["CALCULATION", "CONSTRAINT", "VALIDATION"] = "CALCULATION",
    insert: bool = False,
    update: bool = False,
    delete: bool = False,
    field: str = None,
    description: str = None,
    editable: bool = True,
    error_num: int = None,
    error_msg: str = None,
    exclude: bool = False,
    enabled: bool = True,
    batch: bool = False,
    severity: int = None,
    tags: tuple[str, ...] = None,
):
    """Common arguments for attribute rules"""
    events = []
    if insert:
        events.append("INSERT")
    if update:
        events.append("UPDATE")
    if delete:
        events.append("DELETE")
    return dict(
        name=name,
        type=rule_type,
        field=field,
        description=description,
        is_editable=editable,
        triggering_events=events,
        error_number=error_num,
        error_message=error_msg,
        exclude_from_client_evaluation=exclude,
        enabled=enabled,
        batch=batch,
        severity=severity,
        tags=tags,
    )


def GenerateSymbolRotationAttributeRule(
    line_classes: tuple[
        tuple[
            str | Layer,
            str,
        ],
        ...,
    ],  # (Line class, Field)
    rotation_options: tuple[
        tuple[
            str | None,
            Literal["GEOGRAPHIC", "ARITHMETIC"],
            Literal["MIN", "MAX"],
            float,
        ],
        ...,
    ],  # (Where clause, Rotation style, Orientation, Additional angle)
    **kwargs,
):
    from ..logic.ar import create_rule

    classes = []
    switch = {}
    for i, (fc, field) in enumerate(line_classes, 1):
        if isinstance(fc, str):
            key = pathlib.Path(fc).name.split(".")[-1]
            name = key
        else:
            key = getattr(fc, "name", f"Line{i}")  # Layer/View
            name = pathlib.Path(arcpy.Describe(fc).catalogPath).name.split(".")[-1]
        classes.append(
            dict(
                class_name=key,
                where_clause=get_where_clause(fc),
                orientation_field=field,
            )
        )
        switch[key] = template.FeatureSetByName(name, fields=field, include_geometry=True)

    if not rotation_options:  # User didn't specify anything, use defaults.
        rotation_options = [("", "ARITHMETIC", "MIN", 0)]
    search_options = []
    for sql, style, orientation, additional_angle in rotation_options:
        search_options.append(
            dict(
                where_clause=sql or None,
                is_geographic=style == "GEOGRAPHIC",
                additional_rotation=additional_angle or 0,
                rotate_towards=orientation.casefold() or "min",
                line_classes=classes,
            )
        )

    ar_kwargs = attribute_rule_args(
        name="SymbolRotation",
        insert=True,
        update=True,
    )
    where_clause = kwargs["where_clause"]

    if where_clause or any(o[0] for o in rotation_options):  # Request everything when any SQL is specified.
        expects = template.Expects()
    else:
        expects = template.Expects(kwargs["field"])

    return create_rule(
        script_name="SymbolRotation",
        script_args=dict(
            EXPECTS=expects,
            FS_SWITCH_YARD=template.FeatureSetSwitchyard(switch),
        ),
        ar_kwargs=ar_kwargs | kwargs,
        rule_settings=template.Indent(
            dict(
                where_clause=where_clause,
                options=search_options,
            ),
            recursive=True,
        ),
    )


def GenerateSpatialJoinAttributeRule(
    join_classes: tuple[str | Layer, ...],
    field_map: arcpy.FieldMappings | str,
    search_options: tuple[
        tuple[
            str,
            Literal["GEOMETRY", "START", "END", "CENTROID"],
            Literal["CROSSES", "ENVELOPE_INTERSECTS", "INTERSECTS", "OVERLAPS", "TOUCHES", "WITHIN"],
            str | None,
        ],
        ...,
    ]
    | None = None,  # (Join class, Geometry type, Operator, Search Distance
    **kwargs,
):
    from ..logic.ar import create_rule
    from ..logic import overlay

    if search_options:
        join_classes = [(fc, *options[1:]) for fc, options in zip(join_classes, search_options)]
    spatial_join = overlay.SpatialJoin(join_classes, field_map)

    where_clause = kwargs["where_clause"]

    ar_kwargs = attribute_rule_args(
        name="Spatial Join",
        insert=True,
        update=True,
    )

    rule_settings = spatial_join.rule_settings()

    csv = create_rule(
        script_name="SpatialJoin",
        script_args=dict(
            EXPECTS=template.Expects() if where_clause else template.BareString(""),
            FS_SWITCH_YARD=template.Indent(template.FeatureSetSwitchyard(spatial_join.feature_sets)),
        ),
        ar_kwargs=ar_kwargs | kwargs,
        rule_settings=template.Indent(
            dict(
                where_clause=where_clause,
            )
            | rule_settings,
            recursive=True,
        ),
    )

    if fields := spatial_join.fms.find_missing_fields(kwargs["in_table"]):
        for field in fields:
            arcpy.AddField_management(kwargs["in_table"], **field)

    return dict(
        out_rule_csv=csv,
    )


def GenerateIDAttributeRule(
    definition_method: Literal["BUILDER", "TABLE", "CODED_VALUES"],
    id_builder: tuple[
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
    | None = None,  # (SQL, Description, Name, Start, Increment, Prefix, Suffix, Padding, Separator, Preview)
    id_table: arcpy.RecordSet | None = None,
    id_coded_value: tuple[str, ...] | None = None,
    create_seq: bool = True,
    **kwargs,
):
    from ..logic.ar import create_rule
    from ..logic import generate_id

    ar_kwargs = attribute_rule_args(
        name="GenerateID",
        insert=True,
        update=False,
        exclude=True,
        editable=False,
        description="Generate ID using Database Sequences",
    )

    desc_table = arcpy.Describe(kwargs["in_table"], data_type="Table")
    where_clause = kwargs["where_clause"]

    seq_values = generate_id.build_sequences(
        in_table=kwargs["in_table"],
        workspace_path=desc_table.workspace.catalogPath,
        definition_method=definition_method,
        id_table=id_table,
        coded_value_fields=id_coded_value,
        id_options=id_builder,
    )
    if not seq_values:
        return

    rule = create_rule(
        script_name="GenerateID",
        script_args={
            "EXPECTS": template.Expects() if where_clause or seq_values.has_sql else template.Expects(kwargs["field"]),
            "SEQUENCES": template.Indent(
                template.Decode(template.BareString("sequence_key"), seq_values.sequences), level=2
            ),
            "FS_SWITCH_YARD": template.Indent(template.FeatureSetSwitchyard(seq_values.fs_switch)),
        },
        ar_kwargs=ar_kwargs | kwargs,
        rule_settings=template.Indent(
            {
                "where_clause": where_clause,
                "seq_infos": seq_values.seq_info,
            },
            recursive=True,
        ),
    )

    output_folder = os.path.dirname(rule)

    out_seq_script = generate_id.create_seq_script(
        output_folder=output_folder,
        workspace_path=desc_table.workspace.catalogPath,
        seq_values=seq_values,
    )

    if create_seq:
        make_gp_calls(seq_values.gp_calls, "Create Sequences", True)

    out_id_file = generate_id.write_generate_id_csv(seq_values.all_values, output_folder)
    return {
        "out_rule_csv": rule,
        "out_seq_script": str(out_seq_script),
        "out_id_file": out_id_file,
    }
