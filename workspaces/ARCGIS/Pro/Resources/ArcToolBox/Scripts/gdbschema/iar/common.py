from __future__ import annotations

import contextlib
import csv
import locale
import pathlib
from io import StringIO
from typing import Any

import arcpy
from arcpy._mp import Map, Layer

from .._logging import get_logger

logger = get_logger(__name__)


@contextlib.contextmanager
def get_data_file(name: str) -> contextlib.AbstractContextManager[str]:
    """Context manager to handle getting access to standalone files"""
    import shutil
    import tempfile
    import zipfile

    path = pathlib.Path(__file__).parent / "data_files" / name

    # For debugging, the file will exist as is inside of src.
    if path.exists():
        yield path.as_posix()
        return

    is_folder = name.endswith("/")

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir = pathlib.Path(temp_dir)
        data_files = path.parents[name.rstrip("/").count("/")]
        atbx = data_files.parents[1]
        prefix = f"{data_files.relative_to(atbx).as_posix()}/"

        with zipfile.ZipFile(atbx) as zipper:
            for zip_path, info in zipper.NameToInfo.items():
                if not zip_path.startswith(prefix):  # Outside of data files.
                    continue

                relative = zip_path[len(prefix) :]
                if is_folder:
                    if not relative.startswith(name):
                        continue
                else:
                    if relative != name:
                        continue

                temp_file = temp_dir / relative
                temp_file.parent.mkdir(parents=True, exist_ok=True)  # Create folders as needed.
                with zipper.open(zip_path) as reader, temp_file.open("wb") as writer:
                    shutil.copyfileobj(reader, writer)

        yield str(temp_dir / name)


def get_workspace_desc(desc):
    if hasattr(desc, "workspace"):  # new in Pro 3.2
        return desc.workspace
    parent_path = arcpy.Describe(desc.path)
    if getattr(parent_path, "datasetType", "") == "FeatureDataset":
        return arcpy.Describe(parent_path.path)
    return parent_path


def get_workspace(desc, version) -> tuple[str, str]:
    if getattr(desc, "dataType", None) == "ShapeFile":
        return desc.path, "folder"
    if desc.path.casefold().startswith("http"):
        if not version or version.casefold() == "sde.default":
            return desc.path, "service"
        else:
            return f"{desc.path};version={version}", "service"
    else:
        return get_workspace_desc(desc).catalogPath, "gdb"


def get_where_clause(data: str | Layer) -> str | None:
    """Gets definition query from data"""
    from arcpy.cim import CIMFeatureLayer, CIMFeatureTable

    if isinstance(data, str):  # Catalog path
        return

    if hasattr(data, "definitionQuery"):
        return data.definitionQuery or None

    # Convert to cim to see if it's part of a subtype group layer.
    cim = data.getDefinition("V3")
    if isinstance(cim, CIMFeatureLayer):
        table: CIMFeatureTable = cim.featureTable
        def_query = table.definitionExpression or None
        if table.useSubtypeValue:
            subtype = f"{arcpy.Describe(data).subtypeFieldName} = {table.subtypeValue}"
        else:
            subtype = None

        if def_query and subtype:
            return f"({def_query}) AND ({subtype})"
        return def_query or subtype
    return None


def make_gp_calls(gp_calls, msg, continue_on_error=True):
    arcpy.SetProgressor("step", msg, 0, len(gp_calls))
    for func, kwargs in gp_calls:
        arcpy.SetProgressorPosition()
        logger.debug(f"arcpy.{func.__esri_toolname__}(**{kwargs})")
        try:
            func(**kwargs)
        except arcpy.ExecuteError as e:
            # "Seq already exists/in use."
            # 002907: Sequence name is already in use by dataset in workspace.
            # 002900: Sequence already exists
            if "002907" in str(e) or "002900" in str(e):
                arcpy.AddIDMessage("WARNING", 4067, kwargs["seq_name"])  # Sequence already exists: %s.
            else:
                if continue_on_error:
                    logger.warning(e)
                else:
                    raise e
                continue
        except Exception as e:
            if continue_on_error:
                logger.warning(e)
            else:
                raise e
        logger.debug(arcpy.GetMessages() + "\n")

    arcpy.ResetProgressor()


def write_csv(path: pathlib.Path, file_name: str, data: list, header: list = None) -> pathlib.Path | None:
    if not data:
        return
    out_file_name = arcpy.CreateUniqueName(f"{file_name}.csv", workspace=str(path))
    out_file = path / out_file_name
    path.mkdir(exist_ok=True, parents=True)
    with out_file.open("w", newline="", encoding="utf-8") as csvfile:
        write = csv.writer(csvfile)
        if header:
            write.writerow(header)
        write.writerows(data)
    return out_file


class FunctionsToFile:
    @staticmethod
    def get_string(s, line_length=5000):
        s.seek(0)
        s = s.getvalue()

        try:
            import black
        except ImportError:
            return s

        mode = black.Mode(
            target_versions={black.TargetVersion.PY311},
            line_length=line_length,
            string_normalization=True,
        )

        return black.format_str(s, mode=mode)

    @staticmethod
    def serialize_function(
        func,
        args: dict[str, Any],
        pretty_print: bool = True,
    ) -> str:
        """Converts function call to a human-readable string"""

        from inspect import signature

        # All the keyword arguments.
        defaults: dict[str, str | None] = {
            p.name: None for p in signature(func).parameters.values() if p.kind == p.POSITIONAL_OR_KEYWORD
        }

        for k, v in args.items():
            if isinstance(v, list) and v:
                # Add magic trailing comma
                defaults[k] = f"{repr(v)[:-1]},]"
            else:
                defaults[k] = repr(v)

        arguments = ",".join(f"{k}={v}" for k, v in defaults.items())

        string = f"{func.__module__}.{func.__name__}({arguments},)"
        if pretty_print:
            s = StringIO()
            s.write(string)
            return FunctionsToFile.get_string(s)
        else:
            return string + "\n"

    def main(self, funcs, file_path) -> pathlib.Path:
        s = StringIO()
        for func, args in funcs:
            s.write(self.serialize_function(func=func, args=args, pretty_print=False))
        with file_path.open("w", encoding="utf-8") as writer:
            writer.write(self.get_string(s))
        return file_path


def in_table_layer_parser(kwargs):
    d = arcpy.Describe(in_table := kwargs["in_table"])
    def_exp = kwargs.get("where_clause", None)
    table_uri = in_table
    # Convert mp layers to URI and set the parameter to the catalog path
    if isinstance(in_table, arcpy._mp.Layer):
        layer_sql = get_where_clause(in_table)
        if def_exp and layer_sql:
            def_exp = f"({def_exp}) AND ({layer_sql})"
        table_uri = in_table.URI
    kwargs["in_table"] = d.catalogPath
    kwargs["where_clause"] = def_exp
    return d, table_uri


if locale.localeconv()["decimal_point"] == ".":
    thous_sep = ","
else:
    thous_sep = "."


def value_to_int(val: int | float | str) -> int:
    if isinstance(val, int):
        return val
    elif isinstance(val, float):
        return int(round(val, 0))
    elif isinstance(val, str):
        try:
            return int(round(float(val.replace(thous_sep, "")), 0))
        except ValueError:
            return 1
    else:
        return 1


def unique_values(table, field) -> list:
    with arcpy.da.SearchCursor(in_table=table, field_names=[field], sql_clause=(f"DISTINCT {field}", None)) as cur:
        values = [row[0] for row in cur]
    del cur
    return values
