# -*- coding: utf-8 -*-
import functools
import logging
import os
import sys
from typing import Optional

import arcgisscripting
import arcpy

from .helper import MsgType

logger = logging.getLogger(__name__)

__all__ = [
    "CreateDataLoadingWorkspace",
    "LoadDataUsingWorkspace",
    "LoadDataToPreview",
    "GenerateMappingTable",
    "UpdateDataLoadingWorkspace",
]


def check_magic_date(in_workbook: arcpy.Parameter):
    """Add error if workbook has never been saved"""

    from .workbook import MAGIC_DATE
    import os

    # Because Excel caches formula results, we need users to open the workbook and save it so openpyxl can read.
    if in_workbook.value:
        try:
            if MAGIC_DATE - 86400 < os.path.getmtime(in_workbook.valueAsText) < MAGIC_DATE + 86400:
                in_workbook.setIDMessage(MsgType.ERR, 3820)  # This workbook contains uninitialized formulas
            elif in_workbook.message == arcpy.GetIDMessage(3820):
                in_workbook.clearMessage()
        except OSError:
            pass


class ParamWrapper(object):
    """Wrapper class for converting parameter objects to native arcpy/python types"""

    def __init__(self, parameter: arcpy.Parameter):
        self._p: arcpy.Parameter = parameter
        if hasattr(self._p, "parameterType"):
            # If the parameter is disable, we don't really care what is in it.
            self._values = self._convert() if self._p.enabled else None
        else:
            self._values = parameter

    @staticmethod
    def _get_value(value_object):
        """Extract the value (or values) from the parameter"""
        try:
            # Multivalue parameter
            return value_object.values
        except (AttributeError, NameError):
            # Special case for some data types that are accessed as p.value.value
            while hasattr(value_object, "value"):
                value_object = value_object.value

            # Convert empty strings to None
            if isinstance(value_object, str) and not value_object:
                value_object = None
            return value_object

    def _convert(self):
        values = self._get_value(self._p)

        if self._p.multiValue:
            if values is None:
                # If an optional multivalue parameter is not specified, None is the value.
                # Change this to an empty list as the code will *generally* be expecting a list to iterate over.
                return []
            else:
                return [self._get_value(v) for v in values]
        elif hasattr(self._p, "columns"):
            # Value Table is a special parameter type, but it is localized depending on LP. Use .columns as a proxy.
            return [[self._get_value(cell) for cell in row] for row in values or []]
        elif self._p.name == "mapping_table":
            # Ensure we are always returning the appropriate *Set object (regardless of optional or required parameter).
            return arcpy.RecordSet(self._p.valueAsText)
        else:
            return values

    def get_values(self):
        return self._values


def gp_wrapper(func):
    """Function decorator for geoprocessing tools"""
    import inspect

    def write_call(func, *args, **kwargs):
        """Writes the debug call for easy execution"""

        func_args: dict = inspect.signature(func).bind(*args, **kwargs).arguments

        # args and kwargs are formatted differently
        positional_args = func_args.pop("args", ())
        keyword_args = func_args.pop("kwargs", {})
        arguments = list(func_args.items())
        for arg in positional_args:
            arguments.append((None, arg))
        for k, v in keyword_args.items():
            arguments.append((k, v))

        arguments = [
            repr(val) if name is None else f"{name}={repr(val)}" for name, val in arguments  # positional first
        ]

        # Add some extra whitespace to account for leading timestamp
        function_name = f"{func.__module__}.{func.__qualname__}"
        func_args_str = f',\n {" " * (len(function_name) + 20)}'.join(arguments)
        logger.debug(f"{function_name}({func_args_str})")

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            write_call(func, *args, **kwargs)
            return func(*args, **kwargs)

        # TODO: can we hide the awful stack trace when a user cancels GP tool?
        except (arcgisscripting.ExecuteAbort, KeyboardInterrupt):
            pass

        except arcgisscripting.ExecuteError:
            # This logs the pretty hyperlinked arcpy error code.
            message = arcpy.GetMessages(severity=2)
            if message:
                logger.error(message)
            else:
                # Sometimes arcpy doesn't fully capture the error, so we need to log as an exception
                logger.exception("EXCEPTION")

            sys.exit(1)

        except Exception as e:
            if not isinstance(e, SystemExit):
                logger.error("A python error occurred.")
                logger.exception("EXCEPTION")
                sys.exit(2)

    return wrapper


class ToolValidator:
    def __init__(self):
        self.params: tuple[arcpy.Parameter, ...] = arcpy.GetParameterInfo()

    def convert_parameters(self) -> list:
        """Extracts the python value from parameters"""
        return [ParamWrapper(p).get_values() for p in self.params]


class CreateDataLoadingWorkspace(ToolValidator):
    MATCH_FIELDS = "MATCH_FIELDS"
    MATCH_VALUES = "MATCH_VALUES"

    def __init__(self):
        super().__init__()
        (
            self.source_target_mapping,
            self.out_folder,
            self.match_options,
            self.mapping_table,
            self.calc_stats,
            self.match_subtypes,
            self.out_loading_workspace,
        ) = self.params

    def execute(self):
        (
            source_target_mapping,
            out_folder,
            match_options,
            mapping_table,
            calc_stats,
            match_subtypes,
            out_loading_workspace,
        ) = self.convert_parameters()

        # When executing from GP, we want to ensure that the describe caches are purged in between runs.
        # Otherwise, users making schema changes will not see them reflected.
        from .helper import purge_all_caches

        purge_all_caches()

        result = self.run(
            source_target_mapping=source_target_mapping,
            out_folder=out_folder,
            calc_stats=calc_stats,
            match_datasets=True,
            match_fields=self.MATCH_FIELDS in match_options,
            match_values=self.MATCH_VALUES in match_options,
            match_subtypes=match_subtypes,
            mapping_table=mapping_table,
        )
        if result is not None:
            arcpy.SetParameterAsText(6, result)

    @staticmethod
    def are_inputs_valid(source, target, is_dataset_mapping) -> bool:
        from .helper import Validator

        source_valid = Validator(source)
        target_valid = Validator(target)

        for validate in (source_valid, target_valid):
            if not validate.is_valid():
                logger.debug(validate.message)
                msg = f"{os.path.basename(source)} -> {os.path.basename(target)}"
                # "Skipping invalid mapping: %1, "%2" does not exist or is not supported."
                arcpy.AddIDMessage(MsgType.WRN, 3798, msg, validate.path)
                return False

        # If both inputs are valid, then we check if they can be matched.
        if not source_valid.is_pair_valid(target_valid, is_dataset_mapping):
            return False

        return True

    @staticmethod
    @gp_wrapper
    def run(
        source_target_mapping: list[list[str]],
        out_folder: str,
        calc_stats: bool = False,
        match_datasets: bool = True,
        match_fields: bool = False,
        match_values: bool = False,
        match_subtypes: bool = True,
        mapping_table: str = None,
        dump_json_folder: str = None,
    ) -> Optional[str]:
        from .workbook import WorkbookGenerator
        from .workspace import ClassMatch, MatchLibrary
        import json

        validated = [
            row for row in source_target_mapping if CreateDataLoadingWorkspace.are_inputs_valid(*row, match_datasets)
        ]
        if not validated:
            return

        library = MatchLibrary(
            match_datasets=match_datasets,
            match_fields=match_fields,
            match_values=match_values,
        )
        library.load(mapping_table)

        converted = []
        for source, target in validated:
            # match will always be a class match
            for match in ClassMatch(
                source=source,
                target=target,
                explode_subtypes=match_subtypes,
                match_library=library,
            ).main():
                converted.append(match)

                if dump_json_folder:
                    match.match_fields()
                    filename = f"{match.source.name_key}-{match.target.name_key}".replace("/", "_")
                    with open(os.path.join(dump_json_folder, f"{filename}.json"), "w", encoding="utf-8") as writer:
                        json.dump(match.matches(), writer, indent="\t")

        if dump_json_folder:
            return

        if not converted:
            # "An output was not created due to no matches being found in the Source to Target Mapping parameter."
            arcpy.AddIDMessage(MsgType.WRN, 3805)
            return

        gen = WorkbookGenerator(source_target=converted, output_folder=out_folder, compute_stats=calc_stats)
        gen.main()
        if gen.folder.exists():
            return str(gen.folder)


class LoadDataUsingWorkspace(ToolValidator):
    def __init__(self):
        super().__init__()
        (
            self.in_workbook,
            self.out_datasets,
        ) = self.params

    def updateMessages(self):
        check_magic_date(self.in_workbook)

    def execute(self):
        (
            in_workbook,
            out_datasets,
        ) = self.convert_parameters()

        from .helper import purge_all_caches

        purge_all_caches()

        if results := self.run(in_workbook):
            arcpy.SetParameter(1, results)

    @staticmethod
    @gp_wrapper
    def run(in_workbook: str):
        from .workbook import WorkbookLoader

        return WorkbookLoader(in_workbook, None).main()


class LoadDataToPreview(ToolValidator):
    def __init__(self):
        super().__init__()
        (
            self.in_workbook,
            self.out_folder,
            self.out_datasets,
        ) = self.params

    def updateMessages(self):
        check_magic_date(self.in_workbook)

    def execute(self):
        (
            in_workbook,
            out_folder,
            out_datasets,
        ) = self.convert_parameters()

        from .helper import purge_all_caches

        purge_all_caches()

        if results := self.run(in_workbook, out_folder):
            arcpy.SetParameter(2, results)

    @staticmethod
    @gp_wrapper
    def run(in_workbook: str, out_folder: str):
        from .workbook import WorkbookLoader

        return WorkbookLoader(in_workbook, out_folder).main()


class GenerateMappingTable(ToolValidator):
    def __init__(self):
        super().__init__()
        (
            self.in_workbook,
            self.out_table,
        ) = self.params

    def updateMessages(self):
        check_magic_date(self.in_workbook)

    @staticmethod
    def _create_table(output: str, template: str) -> str:
        path, name = os.path.split(output)
        desc = arcpy.Describe(path)

        if desc.dataType == "Folder":
            # CSV, DBF, etc
            logger.debug("Creating output table via CreateTable")
            if name.casefold().endswith(".dbf"):
                arcpy.AddIDMessage(MsgType.ERR, 732, "Table Location", output)
                raise SystemExit

            if "." not in name:
                name = f"{name}.csv"

            return arcpy.CreateTable_management(out_path=path, out_name=name, template=template)[0]
        elif desc.dataType == "Workspace":
            # Geodatabase
            logger.debug("Creating output table via Copy")
            return arcpy.Copy_management(in_data=template, out_data=output, data_type="Table")[0]
        else:
            # Error message from CreateTable with invalid output path
            arcpy.AddIDMessage(MsgType.ERR, 732, "Table Location", path)
            raise SystemExit

    @staticmethod
    def create_table(output: str):
        """Creates the output table with the correct schema"""
        import tempfile
        import pathlib

        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as td:
            gdb = arcpy.CreateFileGDB_management(td, "dlt")[0]
            arcpy.ImportXMLWorkspaceDocument_management(
                gdb,
                pathlib.Path(__file__).parent.joinpath("data", "template.xml").as_posix(),
                "SCHEMA_ONLY",
            )

            return GenerateMappingTable._create_table(output, os.path.join(gdb, "dlt_template"))

    @staticmethod
    @gp_wrapper
    def run(in_workbook: str, out_table: str = None):
        from .workspace import WorkspaceToMappingFile
        import pathlib

        if out_table is None:
            out_table = str(pathlib.Path(in_workbook).with_suffix(".csv"))

        table = GenerateMappingTable.create_table(out_table)
        mapping = WorkspaceToMappingFile(in_workbook)
        mapping.main(output_table=table)

    def execute(self):
        (
            in_workbook,
            out_table,
        ) = self.convert_parameters()

        from .helper import purge_all_caches

        purge_all_caches()

        self.run(
            in_workbook=in_workbook,
            out_table=out_table,
        )


class UpdateDataLoadingWorkspace(ToolValidator):
    def __init__(self):
        super().__init__()
        (
            self.in_workbook,
            self.out_loading_workspace,
        ) = self.params

    def execute(self):
        (
            in_workbook,
            out_loading_workspace,
        ) = self.convert_parameters()

        # When executing from GP, we want to ensure that the describe caches are purged in between runs.
        # Otherwise, users making schema changes will not see them reflected.
        from .helper import purge_all_caches

        purge_all_caches()

        result = self.run(in_workbook)
        if result is not None:
            arcpy.SetParameterAsText(1, result)

    def updateMessages(self):
        check_magic_date(self.in_workbook)

    @staticmethod
    @gp_wrapper
    def run(in_workbook: str):
        from .workbook import WorkbookUpdater

        wu = WorkbookUpdater(in_workbook)
        wu.main()

        if wu.wg.folder.exists():
            return str(wu.wg.folder)
