import ast
import logging
import os
import pprint
import re
import sys
import uuid
from collections.abc import Callable
from typing import NamedTuple, Generator, Optional

import arcpy

from . import helper
from .helper import MsgType
from .messages import AllMessages

__all__ = ["ETL"]

logger = logging.getLogger(__name__)

N_ = helper.get_message


class FieldWrapper(NamedTuple):
    name: str
    object: arcpy.Field

    temp: str
    expression: str
    field_map: str


class ETL:
    STAGE_NAME = "stage.gdb"

    def __init__(
        self,
        source: str,
        target: str,
        mapping: dict[str, str],
        code_block: str = None,
        preview: str = None,
        transformations: str = None,
        **kwargs,
    ):
        """
        Loads data from source to target. This is similar to the Append tool, except it allows python functions
        to translate the data in flight. For example, a text field in the source data can be converted on the fly
        to an integer field in the target via a simple dictionary lookup.

        The internal workflow is roughly:
            1 create a table/fc in a staging geodatabase
            2 add all source fields used in loading + temporary fields for translation
            3 load source data into staging geodatabase
            4 calculate all temporary fields
            5 load staging data into target

        Args:
            source (str): The source data to be loaded.
            target (str): The destination.
            mapping (dict): Mapping between target fields (key) and expression (value). Expression is passed directly
                to CalculateFields, so it must be valid python.
            code_block (str): Optional custom python functions that can be called inside of mapping expressions.
            preview (str): Optional folder location where data will be loaded to a file geodatabase as a preview. The
                dataset will match the basic target schema. This is meant to view the end result without actually
                loading data to the target. If this value is provided, data will not be loaded to the target.
            transformations (str): Specify the transformation methods that can be used to project data on the fly.

        Examples:
            >>> code_block = 'def lookup(value): return {"red": 1, "blue": 2}.get(value)'
            >>> ETL('C:/temp.gdb/input', 'C:/temp.gdb/output', {"abc": "!def!", "xyz": "lookup(!xyz!)"}, code_block)

        """
        mapping = mapping or {}
        self.source = source
        self.target = target
        self.code_block = code_block
        self.preview = preview
        self.transformations = transformations

        self.source_desc = arcpy.Describe(source)
        self.target_desc = arcpy.Describe(target)
        self.mapping = {k.casefold(): v for k, v in mapping.items()}

        # Set Staging GDB location
        self.temp_dir = kwargs.get("tempdir", arcpy.env.scratchFolder)
        self.stage_workspace = os.path.join(self.temp_dir, ETL.STAGE_NAME)
        if not arcpy.Exists(self.stage_workspace):
            arcpy.CreateFileGDB_management(self.temp_dir, ETL.STAGE_NAME)

        # Set Preview GDB if necessary
        if self.preview:
            self.preview_gdb = kwargs.get("preview_gdb") or helper.create_preview_gdb(self.preview)

        # We need to calculate this here before loading any data.
        self.oid_query = self._get_max_oid_query(self.target_desc) if not self.preview else None

        # The source fields that exist on the temporary table.
        self.source_fields = []

        # TODO: what happens when the source is missing an OID field?
        self.temp_oid = f"f_{uuid.uuid4().hex}"
        # whether stage is used:
        self._transform = False
        self._subtype = None
        self.field_map = list(self._load_field_map(mapping))
        self._preserve_globalids = arcpy.env.preserveGlobalIds

        self.processing = N_(
            86610, mapping_workbook=f"{self.source_desc.catalogPath} -> {self.target_desc.catalogPath}"
        )

    @staticmethod
    def _get_max_oid_query(describe) -> str:
        """creates a sql query against the max OID "ObjectID > XXX" """
        oid_field_name = getattr(describe, "OIDFieldName", "")
        if not oid_field_name:
            return ""

        with arcpy.da.SearchCursor(
            describe.catalogPath,
            "OID@",
            sql_clause=(None, f"ORDER BY {oid_field_name} DESC"),
        ) as cursor:
            # If the cursor is exhausted, the default is returned instead of raising StopIteration
            oid = next(cursor, [0])[0]

        del cursor

        return f"{oid_field_name} > {oid}"

    def shapes_different(self) -> bool:
        source_shape = getattr(self.source_desc, "shapeType", None)
        target_shape = getattr(self.target_desc, "shapeType", None)

        return source_shape is not None and target_shape is not None and source_shape != target_shape

    @staticmethod
    def _is_field_exp(expr: str):
        return isinstance(expr, str) and expr.startswith("!") and expr.endswith("!") and expr.count("!") == 2

    def _is_transformation(self, mapping: dict, subtype_field: str) -> bool:
        """determine if mapping requires stage dataset"""
        for field, expression in mapping.items():
            if self._is_field_exp(expression):
                continue
            # exclude subtype field from forcing a transformation
            elif field.casefold() == subtype_field and helper.is_integer(expression):
                continue
            else:
                return True
        return False

    def _load_field_map(self, mapping: dict):
        """Loads the source and target field mapping"""

        lookup = {f.name.lower(): f for f in self.target_desc.fields}
        geometry_field = getattr(self.target_desc, "shapeFieldName", "").casefold()
        subtype_field = getattr(self.target_desc, "subtypeFieldName", "").casefold()
        source_oid_field = getattr(self.source_desc, "OIDFieldName", "").casefold()
        source_geo_field = getattr(self.source_desc, "shapeFieldName", "").casefold()

        self._transform = self._is_transformation(mapping, subtype_field)

        # If the expression looks like a python field map, we can pretty safely assume it's just a straight field map.
        for target_field, expression in mapping.items():
            # if expression references source oid or shape field and stage dataset is required, repoint expression to
            # correct fields in stage
            if self._transform and isinstance(expression, str):
                expression = re.sub(f"!{source_oid_field}!", f"!{self.temp_oid}!", expression, flags=re.I)
                expression = re.sub(f"!{source_geo_field}!", f"!shape!", expression, flags=re.I)
            if self._is_field_exp(expression):
                if target_field.casefold() == geometry_field:
                    continue
                temp = None
                field_map = expression[1:-1]
            else:
                if target_field.casefold() == geometry_field:
                    # If shape field is being manipulated, then this operation is performed in-place for two reasons:
                    #   1. ArcGIS only supports a single shape field per class
                    #   2. Append GP tool loads shape -> shape without choice for the user
                    # "Shape" can safely be hardcoded here because we know the temporary class uses this field name.
                    temp = "Shape"
                    field_map = None
                elif target_field.casefold() == subtype_field and helper.is_integer(expression):
                    # get subtype description
                    self._subtype = (
                        helper.get_subtypes(self.target_desc.catalogPath).get(int(expression), {}).get("Name")
                    )
                    continue
                else:
                    temp = f"f_{uuid.uuid4().hex}"
                    field_map = temp

            yield FieldWrapper(
                name=target_field,
                object=lookup[target_field.casefold()],
                temp=temp,
                expression=expression,
                field_map=field_map,
            )

    def _get_temp_fields(self, describe) -> Generator[list, None, None]:
        """The fields that need to be added to the staging table"""

        # These fields are system maintained, so we don't need to add them.
        skip_fields = {
            getattr(describe, p, "").lower()
            for p in (
                "OIDFieldName",
                "shapeFieldName",
                "lengthFieldName",
                "areaFieldName",
            )
        }

        # When the source table has a GlobalID / GUID, we need to cast to GUID in order to preserve values.
        # The remaining values are mapping arcpy.Field.type to what AddField expects. New field types in 3.2 do not need
        # to be added here.
        type_lookup = dict(
            SmallInteger="SHORT",
            Integer="LONG",
            Single="FLOAT",
            Double="DOUBLE",
            String="TEXT",
            Guid="GUID",
            GlobalID="GUID",
        )

        # Collect source fields list and yield temp ORIG_FID
        for field in describe.fields:
            # For debugging purposes, it is useful to persist the original OID field.
            if field.type == "OID":
                fieldtype = "BIGINTEGER" if field.length == 8 else "LONG"
                yield [self.temp_oid, fieldtype, f"ORIG_FID", None, None, None]
                continue

            if field.name.lower() in skip_fields:
                continue

            # We will load blobs after with a cursor, there's no need to bring them over in the intermediate dataset.
            if field.type == "Blob":
                continue

            # Source fields exist already because we're using template parameter on Create FC/Tbl. We only need this for
            # shape manipulation.
            self.source_fields.append(field.name)

        # Add temporary fields from target
        for f in self.field_map:
            if f.temp is None:
                continue

            if f.object.type == "Geometry":
                continue

            yield [
                f.temp,
                type_lookup.get(f.object.type, f.object.type),
                f"TargetField: {f.name}",
                f.object.length,
                None,
                None,
            ]

    @staticmethod
    def _clear_default_values(table: str):
        """remove any root default values from a table"""
        for field in arcpy.ListFields(table):
            if field.defaultValue is not None:
                arcpy.management.AssignDefaultToField(table, field.name, clear_value="CLEAR_VALUE")

    def _create_staging_table(self) -> str:
        """Creates a staging table so we can perform calculations"""

        base = dict(
            out_path=self.stage_workspace,
            out_name=f"fc_{uuid.uuid4().hex}",
            template=self.source_desc.catalogPath,
        )  # TODO: fields will still get truncated if too long

        logger.debug("Creating temporary table")
        temp = self._create_table_or_fc(base)
        self._clear_default_values(temp)

        fields = list(self._get_temp_fields(self.source_desc))
        logger.debug(f"Adding target fields:\n{pprint.pformat(fields, width=100)}")
        arcpy.AddFields_management(in_table=temp, field_description=fields)
        return temp

    def _create_preview_table(self) -> str:
        """Create a preview table with basic schema of the target"""
        new_path = os.path.join(self.preview_gdb, self.target_desc.name.split(".")[-1])
        if arcpy.Exists(new_path):
            return new_path

        if self.target_desc.dataType == "Table":
            export = arcpy.conversion.ExportTable
            type_ = "table"
        else:
            export = arcpy.conversion.ExportFeatures
            type_ = "features"
        base = {
            f"in_{type_}": self.target_desc.catalogPath,
            f"out_{type_}": new_path,
            "where_clause": "1=2"
        }

        logger.debug("Creating preview table")
        return export(**base)[0]

    def _create_table_or_fc(self, base: dict) -> str:
        if self.target_desc.dataType == "Table":
            return arcpy.CreateTable_management(**base)[0]
        else:
            return arcpy.CreateFeatureclass_management(
                **base,
                geometry_type=self.target_desc.shapeType,
                has_m="ENABLED" if self.target_desc.hasM else "DISABLED",
                has_z="ENABLED" if self.target_desc.hasZ else "DISABLED",
                spatial_reference=self.target_desc.spatialReference,
            )[0]

    @staticmethod
    def _validate_shape_function(expression: str) -> Optional[str]:
        """match the name of a function from a function call <function>(<anything>)"""
        if (match := re.search(r"(^\w+)(?=\(.*\))", expression)) is not None:
            return match.group()

    def validate_shape_function(self, expression: str) -> Optional[str]:
        """extract function name from the expression"""
        if not (shape_function_name := self._validate_shape_function(expression)):
            # Processing source -> target
            logger.info(self.processing)
            # Python expression must be a function call: %1
            arcpy.AddIDMessage(MsgType.WRN, 3860, expression)
            return
        return shape_function_name

    def _get_function_callable(self, function_name: str, expression: str) -> Optional[Callable]:
        """dynamically import code_block into its own module"""
        # In order to get access to the underlying shape manipulation function, we need to execute the code block,
        # which will inject it into locals()
        # adapted from https://stackoverflow.com/a/53080237/12665063
        import importlib.util

        spec = importlib.util.spec_from_loader("code_block", loader=None)
        code_block = importlib.util.module_from_spec(spec)
        exec(self.code_block or "", code_block.__dict__)
        if (manipulate := getattr(code_block, function_name, None)) is None:
            # Processing source -> target
            logger.info(self.processing)
            # Python expression contains function or field that does not exist: %1"
            arcpy.AddIDMessage(MsgType.WRN, 3861, expression)
            return
        return manipulate

    def _parse_expression(self, expression: str, fields: list[str]) -> tuple[Optional[list], Optional[list]]:
        """parse shape_function to retrieve args and kwargs we need to match up with row values"""
        parse_expression = expression.replace("!", "")
        shape = getattr(self.source_desc, "shapeFieldName", "").casefold()

        tree = ast.parse(parse_expression)
        call = tree.body[0].value
        args = []
        kwargs = []
        for arg in call.args:
            if isinstance(arg, ast.Constant):
                args.append((arg.value, True))
            elif isinstance(arg, ast.Name):
                try:
                    # get idx from row using field name
                    idx = 0 if (field := arg.id.casefold()) == shape else fields.index(field)
                except ValueError:
                    logger.info(self.processing)
                    # Python expression contains function or field that does not exist: %1"
                    arcpy.AddIDMessage(MsgType.WRN, 3861, expression)
                    return None, None
                args.append((idx, False))
            else:
                logger.info(self.processing)
                # Python expression cannot contain argument type: %1
                arcpy.AddIDMessage(MsgType.WRN, 3862, str(type(arg)))
                return None, None

        for kwarg in call.keywords:
            if isinstance(kwarg.value, ast.Constant):
                kwargs.append((kwarg.arg, kwarg.value.value, True))
            elif isinstance(kwarg.value, ast.Name):
                try:
                    # get idx from row using field name
                    idx = 0 if (field := kwarg.value.id.casefold()) == shape else fields.index(field)
                except ValueError:
                    logger.info(self.processing)
                    # Python expression contains function or field that does not exist: %1"
                    arcpy.AddIDMessage(MsgType.WRN, 3861, expression)
                    return None, None
                kwargs.append((kwarg.arg, idx, False))
            else:
                logger.info(self.processing)
                # Python expression cannot contain argument type: %1
                arcpy.AddIDMessage(MsgType.WRN, 3862, str(type(kwarg.value)))
                return None, None

        return args, kwargs

    def _extract_with_cursor(self, target: str) -> Optional[str]:
        """Load data using cursors and shape manipulation"""
        logger.debug("\tExecuting code block")
        if not (shape_expression := self.mapping.get(self.target_desc.shapeFieldName.casefold())):
            # Processing source -> target
            logger.info(self.processing)
            # A geometry field expression is required when loading data between different shape types.
            arcpy.AddIDMessage(MsgType.WRN, 3863)
            return

        if not (shape_function_name := self.validate_shape_function(shape_expression)):
            return

        if not (manipulate := self._get_function_callable(shape_function_name, shape_expression)):
            return

        # parse shape_function to retrieve args and kwargs we need to match up with row values
        fields = ["SHAPE@", *self.source_fields]
        args_list, kwargs_list = self._parse_expression(shape_expression, fields)
        if args_list is None or kwargs_list is None:
            return

        python_error = ""
        log_source_target = True
        with arcpy.da.SearchCursor(self.source, [*fields, "OID@"]) as search, arcpy.da.InsertCursor(
            target, [*fields, self.temp_oid]
        ) as insert:
            for row in search:
                args = [idx if is_const else row[idx] for idx, is_const in args_list]
                kwargs = dict((kw, idx if is_const else row[idx]) for kw, idx, is_const in kwargs_list)
                try:
                    new_shape = manipulate(*args, **kwargs)
                except Exception as e:
                    import traceback

                    # get last two lines of stack (line no and message)
                    # TODO: should we stop cursor? report every error with row? Currently we continue and report error
                    #  once
                    python_error = "\n".join(traceback.format_exc(-1).splitlines()[1:])
                    new_shape = None
                try:
                    insert.insertRow([new_shape, *row[1:]])
                except RuntimeError as e:
                    if log_source_target:
                        logger.info(self.processing)
                        log_source_target = False
                    # Feature %1!lld!: %2.
                    arcpy.AddIDMessage(MsgType.WRN, 596, row[-1], str(e))
                except (AttributeError, TypeError) as e:
                    # If we get here, the wrong shape type was likely created. Should be a hard stop regardless.
                    # AttributeError or TypeError can be raised. No clear reason why one or the other.
                    logger.info(self.processing)
                    # Feature %1!lld!: %2.
                    arcpy.AddIDMessage(
                        MsgType.WRN, 596, row[-1], f"{getattr(self.source_desc, 'shapeFieldName', '')} {e}"
                    )
                    return

        del search, insert

        if python_error:
            # Processing source -> target
            logger.info(self.processing)
            arcpy.AddIDMessage(MsgType.WRN, 2858, python_error)

        return target

    def _add_globalid_field_map(self, fms: arcpy.FieldMappings, source_path: str, stage: bool = False):
        """Add field map to preserve globalids by setting type to Guid. Source and Target must have globalids for this
        to be necessary."""
        source_globalid_name = getattr(self.source_desc, "GLOBALIDFieldName", "")
        target_globalid_name = source_globalid_name if stage else getattr(self.target_desc, "GLOBALIDFieldName", "")

        if source_globalid_name and target_globalid_name:
            idx = fms.findFieldMapIndex(source_globalid_name)
            if idx == -1:
                self._add_field_mapping(fms, source_path, source_globalid_name, target_globalid_name)
                idx = fms.findFieldMapIndex(source_globalid_name)
            fm = fms.getFieldMap(idx)
            output_field = fm.outputField
            output_field.type = "Guid"
            fm.outputField = output_field
            fms.replaceFieldMap(idx, fm)

    @staticmethod
    def _add_field_mapping(fms: arcpy.FieldMappings, source_path: str, source_name: str, target_name: str):
        """shortcut function for adding FieldMap"""
        fm = arcpy.FieldMap()

        fm.addInputField(source_path, source_name)
        output_field = fm.outputField
        output_field.name = target_name
        fm.outputField = output_field

        fms.addFieldMap(fm)

    def _get_field_mappings(self, desc, for_export=False):
        # The only custom field mapping we need is for OID and GlobalID
        fms = arcpy.FieldMappings()
        skip_keys = ["shapeFieldName", "oidFieldName", "areaFieldName", "lengthFieldName"]
        skip_fields = {getattr(desc, f, "").casefold() for f in skip_keys}
        fms.addTable(desc.catalogPath)
        # ensure any fields missed by "addTable" are mapped (editor tracking)
        for field in desc.fields:
            if field.name.casefold() in skip_fields:
                continue
            idx = fms.findFieldMapIndex(field.name)
            if idx != -1:
                continue
            self._add_field_mapping(
                fms=fms,
                source_path=desc.catalogPath,
                source_name=field.name,
                target_name=field.name,
            )

        oid_field_name = getattr(desc, "OIDFieldName", "")
        if oid_field_name:
            if for_export:
                fm = arcpy.FieldMap()
                fm.addInputField(desc.catalogPath, oid_field_name)
                output_field = fm.outputField
                output_field.name = "STG_OID"
                output_field.type = "BIGINTEGER"
                output_field.aliasName = "STG_OID"
                fm.outputField = output_field
                fms.addFieldMap(fm)
            else:
                self._add_field_mapping(
                    fms=fms,
                    source_path=desc.catalogPath,
                    source_name=desc.OIDFieldName,
                    target_name=self.temp_oid,
                )

        # globalid should always be preserved when going to stage/export
        self._add_globalid_field_map(
            fms=fms,
            source_path=self.source_desc.catalogPath,
            stage=True,
        )

        return fms

    def extract(self) -> Optional[str]:
        """Copies the source data into a scratch table"""

        temp = self._create_staging_table()

        # When the source and target are both FC and the shape types differ, we cannot use Append to load into the
        # intermediate dataset (Append blocks it up front and we'd lose the original geometry anyways).
        if self.shapes_different():
            logger.debug(
                f"Shape types differ, "
                f"using cursors to load ({self.source_desc.shapeType} -> {self.target_desc.shapeType})"
            )
            if arcpy.env.maintainAttachments:
                logger.info(self.processing)
                arcpy.AddIDMessage(MsgType.WRN, 3864)
            try:
                return self._extract_with_cursor(temp)
            except:
                # Processing source -> target
                logger.info(self.processing)
                raise
        else:
            logger.debug("Loading data")
            fms = self._get_field_mappings(self.source_desc)

            # globalid should always be preserved when going to stage
            with arcpy.EnvManager(preserveGlobalIds=True, geographicTransformations=self.transformations):
                self._call_append(source=self.source, target=temp, field_mapping=fms, is_stage=True)

        return temp

    def transform(self, fc):
        """Manipulates the in memory table with CalculateFields"""
        if not fc:
            return

        fields = [[f.temp, f.expression] for f in self.field_map if f.temp is not None]

        # If the shape has already been manipulated during extraction (ie, via cursors), we don't need to process.
        if self.shapes_different():
            fields = [row for row in fields if row[0].lower() != "shape"]
        if not fields:
            return fc

        logger.debug(f"Calculating fields:\n{pprint.pformat(fields)}")
        logger.debug(f"Code Block:\n{self.code_block}")
        arcpy.CalculateFields_management(
            in_table=fc,
            expression_type="PYTHON3",
            fields=fields,
            code_block=self.code_block,
        )

        all_messages = AllMessages()
        self._handle_warnings(all_messages, fc)
        return fc

    def _handle_warnings(self, all_messages: AllMessages, source: str):
        if fid_messages := list(all_messages.filter(return_code=595)):
            # identify what row is processing
            logger.info(N_(86610, mapping_workbook=f"{self.source_desc.catalogPath} -> {self.target_desc.catalogPath}"))

        all_messages.log_warnings(skip_return_code=595)
        if fid_messages:
            # Some features were not appended for whatever reason, let's export them.
            oid_list = self._handle_fid_msg(fid_messages[0].value)
            with arcpy.EnvManager(geographicTransformations=None):
                self.export_bad_rows(source, oid_list)

    @staticmethod
    def _handle_fid_msg(warning_msg: str) -> list:
        """Returns the list of OIDs referenced in the .fid file"""
        import re

        match = re.search(r"Warning 000595: (.+\.fid)", warning_msg, flags=re.IGNORECASE)
        if match is None:
            return []

        file = match.groups()[0]
        if not os.path.exists(file):
            return []

        with open(file, "r", encoding="utf-8") as reader:
            return [int(x.strip()) for x in reader]

    def export_bad_rows(self, table: str, oid_list: list):
        """Exports rows that append failed to load"""
        from arcpy._mp import Layer

        if not oid_list:
            return

        if arcpy.Describe(table).dataType == "Table":
            layer_func = arcpy.MakeTableView_management
            copy_func = arcpy.CopyRows_management
            export_func = arcpy.ExportTable_conversion
        else:
            layer_func = arcpy.MakeFeatureLayer_management
            copy_func = arcpy.CopyFeatures_management
            export_func = arcpy.ExportFeatures_conversion

        layer: Layer = layer_func(table)[0]
        layer.setSelectionSet(oid_list)

        output = arcpy.CreateUniqueName(os.path.basename(table), workspace=arcpy.env.scratchGDB)
        if self._transform:
            fms = self._get_field_mappings(desc=helper.describe_object(table), for_export=True)
            export_func(layer, output, field_mapping=fms)
        else:
            copy_func(layer, output)
        # Exported %1 rows that were skipped to %2
        arcpy.AddIDMessage(MsgType.WRN, 3819, f"{len(oid_list):,}", output)

    def _call_append(self, source, target, field_mapping: arcpy.FieldMappings = None, is_stage: bool = False):
        """Calls append with some error handling"""

        kwargs = dict(
            inputs=source,
            target=target,
            schema_type="NO_TEST",
            field_mapping=field_mapping.exportToString() if field_mapping else None,  # ensure globalid preserve works
            subtype=self._subtype,
        )

        if field_mapping is not None:
            pretty = field_mapping.exportToString().replace(";", "\n")
            logger.debug(f"Field map:\n{pretty}")

        try:
            ret = arcpy.Append_management(**kwargs)
        except arcpy.ExecuteError:
            # we likely need to log warnings and raise later
            ret = None
        finally:
            all_messages = AllMessages()

        self._handle_warnings(all_messages, source)

        # log appened row count
        if ret and not is_stage:
            # %1 row(s) from %2 were appended to %3
            logger.info(
                helper.get_message3(
                    86622,
                    ret.getOutput("appended_row_count"),  # even 0 should be logged
                    self.source_desc.catalogPath,
                    self.target_desc.catalogPath,
                )
            )

        # Halt execution if we logged errors. We can't just raise because we may have called into arcpy to export failed
        # rows and we would get an ugly stack trace by raising now.
        if all_messages.log_errors():
            sys.exit(1)

    def load(self, fc, target):
        """Appends fc to target with field mapping"""

        input_fields = {f.name.lower() for f in arcpy.ListFields(fc)}

        fms = arcpy.FieldMappings()

        for field in self.field_map:
            if field.field_map is None:
                continue

            if field.field_map.lower() not in input_fields:
                # Blob fields aren't always carried over so we need to check if they exist before adding.
                continue

            self._add_field_mapping(
                fms=fms,
                source_path=fc,
                source_name=field.field_map,
                target_name=field.object.name,
            )

        # add globalid and respect arcpy.env.preserveGlobalIds
        if arcpy.env.preserveGlobalIds:
            self._add_globalid_field_map(
                fms=fms,
                source_path=fc,
            )

        self._call_append(source=fc, target=target, field_mapping=fms)

    def load_blobs(self, target):
        """Loads data in Blob fields"""
        # {target field: source field}
        blob_fields = {field.name: field.field_map for field in self.field_map if field.object.type == "Blob"}
        if not blob_fields:
            return

        logger.debug("Loading data from Blob field(s)...")
        logger.debug(f"\t{blob_fields}")
        logger.debug(f"\t{self.oid_query}")
        with arcpy.da.SearchCursor(self.source, list(blob_fields.values())) as search, arcpy.da.UpdateCursor(
            target, list(blob_fields.keys()), self.oid_query
        ) as update:
            for _ in update:
                update.updateRow(next(search))
        del search, update

    def process(self, target: str):
        # It's possible (although this tool is overkill in this instance) that everything is just a straight
        # field map, in which case we can go directly into append.
        if all(f.temp is None for f in self.field_map) and not self.shapes_different():
            logger.debug("\tNo field calculation required, calling append")
            with arcpy.EnvManager(geographicTransformations=self.transformations):
                self.load(self.source, target)
            return target

        if not (fc := self.transform(self.extract())):
            return
        self.load(fc, target)

        self.load_blobs(target)

        return target

    def main(self):
        target = self.target
        if self.preview:
            target = self._create_preview_table()

        if self._preserve_globalids and helper.is_service(self.target_desc):
            self._preserve_globalids = False
            arcpy.AddIDMessage(MsgType.WRN, 3817, self.target_desc.catalogPath)  # Cannot preserve GlobalIds

        with arcpy.EnvManager(preserveGlobalIds=self._preserve_globalids):
            return self.process(target)
