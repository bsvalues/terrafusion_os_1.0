import ast
import functools
import logging
import os
import pathlib
from typing import Optional, Iterable, Generator, TYPE_CHECKING

import pandas as pd

if TYPE_CHECKING:
    from .workspace import TableMatch
    from .workbook import WorkbookWrapper
    from openpyxl.worksheet.table import Table

import arcpy

logger = logging.getLogger(__name__)

_LRU_CACHE = []


class Validator:
    """Validates data type is supported"""

    def __init__(self, path):
        self.path = path
        self.message = None

    @property
    def describe(self):
        try:
            return describe_object(self.path)
        except Exception as e:
            logger.debug(e)
            self.message = f"{e.__class__.__name__}: {e.args[0]}"

    def _is_container(self) -> bool:
        return self.describe.dataElementType in {"DEWorkspace", "DEFeatureDataset", "DECadDrawingDataset"}

    def _is_tabular(self) -> bool:
        # Tabular data such as CSV are reported as text files.
        return self.describe.dataElementType in {
            "DEDbaseTable",
            "DETable",
            "DEShapeFile",
            "DEFeatureClass",
            "DETextFile",
        }

    def _is_invalid_datatype(self) -> bool:
        # dataElementType is the base data type
        if not self._is_container() and not self._is_tabular():
            return True

        return False

    def is_pair_valid(self, other: "Validator", support_workspace: bool) -> bool:
        """Warns if source cannot be loaded into target. This is first phase of source/target validation.
        WorkbookGenerator class also performs validation with is_mapping_valid() because Workspaces get past
        this phase of validation."""

        # If support_workspace is False and one of the sides is a workspace, that is invalid.
        if not support_workspace and (self._is_container() or other._is_container()):
            return False

        return True

    def is_valid(self) -> bool:
        if self.describe is None:
            return False

        for func in (self._is_invalid_datatype,):
            if func():
                return False

        return True


def join_path(*paths) -> str:
    """normalizes paths so it can be cached"""
    return os.path.normpath(os.path.join(*paths))


def get_workspace(path):
    desc = describe_object(path)
    if desc.dataType in {"Workspace", "Folder"}:
        return path

    dirname = os.path.dirname(desc.catalogPath)
    desc = describe_object(dirname)
    if hasattr(desc, "datasetType") and desc.datasetType == "FeatureDataset":
        dirname = os.path.dirname(dirname)
    return dirname


def lru_cache(*args, **kwargs):
    """Wrapper around functools.lru_cache to store the functions it is applied to"""

    def inner(func):
        wrapped = functools.lru_cache(*args, **kwargs)(func)
        _LRU_CACHE.append(wrapped)
        return wrapped

    return inner


def purge_all_caches():
    """Deletes the cache on all LRU decorated functions"""
    for func in _LRU_CACHE:
        logger.debug(func.cache_info())
        func.cache_clear()


@lru_cache()
def describe_object(thing):
    return arcpy.Describe(thing)


def does_exist(thing) -> bool:
    try:
        # Note: if a restricted service and user not logged in, this is where they will *sometimes* be prompted to login
        return arcpy.Exists(thing)
    except Exception as e:
        logger.debug(f"arcpy.Exists({thing}) => {e}")
    return False


@lru_cache()
def get_count(thing) -> int:
    try:
        return int(arcpy.GetCount_management(thing)[0])
    except Exception as e:
        logger.debug(f"arcpy.GetCount({thing}) => {e}")
    return 0


@lru_cache()
def _get_domains(thing) -> dict:
    try:
        return {d.name.lower(): d for d in arcpy.da.ListDomains(thing)}
    except (RuntimeError, OSError):
        logger.debug(f"'{thing}' does not support domains")
    return {}


def get_domains(thing) -> dict:
    return _get_domains(get_workspace(thing))


@lru_cache()
def get_subtypes(thing) -> dict:
    try:
        # The phantom subtype exists on classes without subtypes. We really want to treat this as having no subtypes.
        subtypes = arcpy.da.ListSubtypes(thing)
        for val in subtypes.values():
            if val["SubtypeField"] == "":
                return {}
        return subtypes
    except Exception as e:
        return {}


def subtype_name(describe) -> str:
    """return subtype name if exists"""
    return getattr(describe, "subtypeFieldName", "").casefold()


def is_service(describe) -> bool:
    service: str = describe.path.lower()
    return service.startswith("http")


@lru_cache()
def get_attachment_tables(workspace: str) -> list:
    """get attachment table names"""
    attach_destinations = []
    for dirpath, dirname, filenames in arcpy.da.Walk(workspace, datatype=["RelationshipClass"]):
        for file in filenames:
            full_file_path = join_path(workspace, file.split(".")[-1])
            desc = describe_object(full_file_path)
            # Relationship classes can be renamed to the same as a destination class.
            if desc.dataElementType != "DERelationshipClass":
                desc = arcpy.Describe(full_file_path, "RelationshipClass")
            if desc.isAttachmentRelationship:
                attach_destinations.extend([name.split(".")[-1].casefold() for name in desc.destinationClassNames])

    return attach_destinations


def create_unique_path(path) -> pathlib.Path:
    """works for folders and files"""
    path = pathlib.Path(path)
    basename = path.stem

    i = 0
    while path.exists():
        path = path.with_name(f"{basename}{i}{path.suffix}")
        i += 1

    return path


def create_preview_gdb(folder: str) -> str:
    new_preview = create_unique_path(os.path.join(folder, "preview.gdb"))
    return arcpy.CreateFileGDB_management(str(new_preview.parent), new_preview.stem)[0]


def is_select_all(sql: str) -> bool:
    """detect a select all where_clause like '1=1'"""
    return "=" in sql and len(set(sql.casefold().replace(" ", "").split("=", 1))) == 1


def is_integer(string: str) -> bool:
    try:
        int(string)
    except ValueError:
        return False
    return True


class FieldMatch:
    def __init__(self, target: "FieldWrapper", source=None, lookup: dict = None):
        self.target = target
        self.source = source
        self.lookup = lookup or {}

    def __repr__(self):
        return f"<FieldMatch ({self.expression} - {self.target.name}) >"

    @property
    def expression(self):
        if self.lookup:
            return
        if isinstance(self.source, FieldWrapper):
            return f"!{self.source.name}!"
        return self.source

    def row(self):
        data = [self.target.name, self.target.type, self.expression]
        if self.lookup:
            data.extend([self.source.name, "Source Code", "Target Code"])
        return data

    @staticmethod
    def reverse_dictionary(d: dict) -> dict:
        """Flips keys and values, handling duplicate values"""
        data = {}
        for k, v in d.items():
            data.setdefault(v, []).append(k)
        return data

    def code_lookup(self) -> dict:
        """The description lookup converted to codes"""
        if not self.lookup:
            return {}

        # Descriptions can be duplicated
        reverse_source = self.reverse_dictionary(self.source.domain.codedValues)
        reverse_target = self.reverse_dictionary(self.target.domain.codedValues)

        data = {}
        for k, v in self.lookup.items():
            for source_key in reverse_source[k]:
                for target_key in reverse_target[v]:
                    data[source_key] = (target_key, v)

        return data

    def domain_mapping(self) -> list:
        if not self.lookup:
            return []

        # The same target can be used multiple times.
        reverse_target = {v: k for k, v in self.target.domain.codedValues.items()}
        reverse_target_running = reverse_target.copy()

        data = []
        for from_key, from_desc in self.source.domain.codedValues.items():
            target_desc = self.lookup.get(from_desc, None)
            if target_desc is None:
                extra = [None, None]
            else:
                # We need to pop here to remove this entry
                reverse_target_running.pop(target_desc, None)
                extra = [reverse_target[target_desc], target_desc]

            data.append([from_key, from_desc, *extra])

        # Add any missing targets at the end.
        data.extend([None, None, *x] for x in reverse_target_running.items())
        return data


class FieldWrapper:
    def __init__(self, field: arcpy.Field, default, domain):
        self._data = [field, default, domain]
        self._match = None

    def __repr__(self):
        return f"<Field {self.name}>"

    @property
    def name(self) -> str:
        return self._data[0].name

    @property
    def type(self) -> str:
        return self._data[0].type

    @property
    def editable(self) -> bool:
        return self._data[0].editable

    @property
    def is_nullable(self) -> bool:
        return self._data[0].isNullable

    @property
    def domain(self):
        return self._data[-1]

    @property
    def match(self) -> Optional[FieldMatch]:
        return self._match

    def add_match(self, source, lookup=None):
        if not self._match:
            self._match = FieldMatch(target=self, source=source, lookup=lookup)


class FieldCollection:
    def __init__(self, data, parent):
        self._d = data
        self._p = parent

    def __iter__(self) -> Iterable["FieldWrapper"]:
        for f in self._d:
            yield f

    def get(self, name: str, default=None) -> Optional["FieldWrapper"]:
        name = name.lower()
        for f in self:
            if f.name.lower() == name:
                return f
        return default

    def with_domains(self, editable_only: bool = False) -> Iterable["FieldWrapper"]:
        """Fields with coded value domains"""
        for f in self:
            if f.domain and f.domain.domainType == "CodedValue":
                if editable_only and not f.editable:
                    continue
                yield f

    def _system_field(self, name: str):
        return getattr(self._p, name, "").lower()

    def default_fields(self) -> set:
        """The names of the default fields (OID, shape, shape length, shape area)"""
        return {self.oid, self.shape, self.shape_length, self.shape_area}

    def editor_tracking_fields(self) -> set:
        """The names of the editor tracking fields"""
        return {self.creator, self.created_at, self.editor, self.edited_at}

    @property
    def oid(self) -> str:
        return self._system_field("oidFieldName")

    @property
    def shape(self) -> str:
        return self._system_field("shapeFieldName")

    @property
    def shape_length(self) -> str:
        return self._system_field("lengthFieldName")

    @property
    def shape_area(self) -> str:
        return self._system_field("areaFieldName")

    @property
    def global_id(self) -> str:
        return self._system_field("globalIDFieldName")

    @property
    def subtype(self) -> str:
        return self._system_field("subtypeFieldName")

    @property
    def creator(self) -> str:
        return self._system_field("creatorFieldName")

    @property
    def created_at(self) -> str:
        return self._system_field("createdAtFieldName")

    @property
    def editor(self) -> str:
        return self._system_field("editorFieldName")

    @property
    def edited_at(self) -> str:
        return self._system_field("editedAtFieldName")


class TableWrapper:
    def __init__(self, path: str, subtype_code: int = None):
        self.path = path
        self.subtype_code = subtype_code

    def __repr__(self):
        return f"<{self.shape_type} {self.name_key}>"

    @property
    def key(self) -> str:
        return self.subtype_name or self.name

    @property
    def name_key(self) -> str:
        return f'{self.name}/{self.subtype_name or ""}'.rstrip("/")

    @property
    def describe(self):
        return describe_object(self.path)

    @property
    def workspace(self):
        return get_workspace(self.path)

    @property
    def shape_type(self):
        if self.describe.dataType in {"Table", "TextFile"}:
            return "Table"
        else:
            return self.describe.shapeType

    @property
    def subtype_name(self) -> str:
        return get_subtypes(self.path).get(self.subtype_code, {}).get("Name", "")

    @property
    def definition_query(self) -> Optional[str]:
        if self.subtype_code is None:
            return
        return f"{self.fields.subtype} = {self.subtype_code}"

    @property
    def name(self):
        # For feature services, the name can include or be the layer ID, which isn't very meaningful for matching.
        # We should use alias instead of the name for feature services.
        name: str = self.describe.name.split(".")[-1]
        if self.workspace.lower().startswith("http"):
            name = self.describe.aliasName
        if self.describe.dataElementType == "DETextFile":
            name = self.describe.name

        return name

    @property
    def base_name(self):
        return os.path.basename(self.path)

    @property
    @lru_cache()
    def fields(self) -> "FieldCollection":
        # If this class doesn't have subtypes, we need to get the domain objects from the workspace.
        if self.subtype_code is None:
            domains = get_domains(self.path)
            fields = [
                FieldWrapper(field, default=field.defaultValue, domain=domains.get(field.domain.lower(), None))
                for field in self.describe.fields
            ]
        else:
            field_objects = {f.name.lower(): f for f in self.describe.fields}
            fields = [
                FieldWrapper(field_objects[field.lower()], default=default, domain=domain)
                for field, (default, domain) in get_subtypes(self.path)[self.subtype_code]["FieldValues"].items()
            ]

        return FieldCollection(fields, self.describe)

    @property
    @lru_cache()
    def domains_by_subtype(self) -> dict:
        field_objects = {f.name.casefold(): FieldUniqueDomains(f) for f in self.describe.fields}
        for code, subtype_info in get_subtypes(self.path).items():
            for field, (default, domain) in subtype_info["FieldValues"].items():
                field_objects[field.casefold()].add_domain(domain, code)
        return field_objects

    def get_all_domains(self, field: str) -> Optional["FieldUniqueDomains"]:
        return self.domains_by_subtype.get(field.casefold())


class FieldUniqueDomains:
    """Wrapper for storing domains on a field across all subtypes"""

    def __init__(self, field: arcpy.Field):
        self.field = field
        self._domains = {}
        self._subtype_lookup = {}

    def __repr__(self):
        return f"<Field Unique Domains {self.name}>"

    @property
    def name(self) -> str:
        return self.field.name

    @property
    def domains_and_subtypes(self) -> Generator[tuple, None, None]:
        for domain_name in sorted(self._domains):
            dom = self._domains[domain_name]
            yield dom, sorted(self._subtype_lookup[dom.name.casefold()])

    def add_domain(self, domain, subtype):
        if not domain:
            return
        domain_name = domain.name.casefold()
        if domain_name not in self._domains:
            self._domains[domain_name] = domain
        self._subtype_lookup.setdefault(domain_name, []).append(subtype)


class ConvertFunctions:
    """converts defined functions in a string to function call examples"""

    def __init__(self, function_text: str):
        self.function_text = function_text

    @staticmethod
    def _extract_default(kw_default):
        if isinstance(kw_default, ast.NameConstant):
            return kw_default.value
        elif isinstance(kw_default, ast.Num):
            return kw_default.n
        elif isinstance(kw_default, ast.Str):
            return f'"{kw_default.s}"'
        else:
            return None

    def _generate_function_text(self, func) -> str:
        """convert ast object to function call example"""

        # add fields for non default params and *args
        idx = 1
        fields = ""
        number_of = len(func.args.args) - len(func.args.defaults) + (2 if func.args.vararg else 0)
        for idx in range(1, number_of + 1):
            fields += f"!FIELD{idx}!,"

        # add args with defaults
        for arg, defaul in zip(func.args.args[-len(func.args.defaults) :], func.args.defaults):
            val = self._extract_default(defaul)
            if val not in [None, ""]:
                fields += f"{arg.arg}={val},"

        # add keyword args with and without defaults
        defaults = ""
        for kw, default in zip(func.args.kwonlyargs, func.args.kw_defaults):
            if default is None:
                defaults += f",!FIELD{idx}!"
                idx += 1
                continue
            val = self._extract_default(default)
            if val:
                defaults += f",{kw.arg}={val}"

        return f"{func.name}({fields[:-1]}{defaults})"

    def function_calls(self):
        """convert user scripts to function call examples
        Ex. concatenate(!FIELD1!,!FIELD2!,delimiter=" ")
        """
        tree = ast.parse(self.function_text)
        for stat in tree.body:
            if isinstance(stat, ast.FunctionDef):
                yield self._generate_function_text(stat)


def property_to_pretty(val: str) -> str:
    """Converts geodatabase property to 'pretty' string"""
    from gdbschema import constants

    for enum in (
        constants.esriFieldType,
        constants.esriDomainType,
        constants.esriSplitPolicyType,
        constants.esriMergePolicyType,
    ):
        try:
            return enum.get(val)
        except KeyError:
            continue

    return val


class MsgType:
    INF = "INFORMATIVE"
    WRN = "WARNING"
    ERR = "ERROR"


def get_message(mess_id, *args, **kwargs):
    """Retrieve message by id and pass arguments"""
    return arcpy.GetIDMessage(message_ID=mess_id).format(*args, **kwargs)


def get_message3(mess_id, arg1, arg2, arg3):
    string = arcpy.GetIDMessage(mess_id)
    return string.replace("%1", arg1).replace("%2", arg2).replace("%3", arg3)


def get_tool_message(code: int) -> Optional[str]:
    """Inspect messages from previously run tool. Return message for a specific code."""
    df = pd.DataFrame(arcpy.GetAllMessages(), columns=["type_code", "return_code", "message"])
    if not (filtered := df.loc[df["return_code"] == code]).empty:
        return filtered.message.iloc[0]


def get_shape_expression(match: "TableMatch") -> Optional[str]:
    supported = {"point", "polyline", "polygon", "multipoint", "table"}
    source_shape: str = match.source.shape_type.casefold()
    target_shape: str = match.target.shape_type.casefold()
    if not {source_shape, target_shape}.issubset(supported):
        return

    func_name = f"{source_shape}_to_{target_shape}"
    custom_args = dict(
        polyline_to_polygon="!Shape!, distance=10",
        polyline_to_point="!Shape!, ratio=.5",
        polyline_to_multipoint="!Shape!",
        point_to_polygon="!Shape!, distance=10",
        point_to_polyline="!Shape!, angle=0, distance=10",
        point_to_multipoint="!Shape!, num_points=10, radius=10",
        create_point="x=-103, y=44, z=None, m=None, spatial_reference=4326",
    )
    if source_shape in {"polygon", "multipoint"}:
        return f"{func_name}(!Shape!)"
    # only table > point is supported
    if source_shape == "table":
        if target_shape != "point":
            return
        else:
            func_name = "create_point"

    return f"{func_name}({custom_args[func_name]})"


def is_global_sheet(sheet_name: str, global_workbook: Optional["WorkbookWrapper"]) -> bool:
    """check for global sheet reference"""
    return sheet_name.startswith("[") and sheet_name.endswith("]") and global_workbook is not None


def filter_button_off(table: "Table", columns: list[int] | None = None):
    """Turn off the filter button on some or all columns in a table. Column indexes are zero based."""
    from openpyxl.worksheet.filters import FilterColumn, AutoFilter
    from openpyxl.utils import column_index_from_string

    if columns is None:
        first, last = column_index_from_string(table.ref[0]), column_index_from_string(table.ref.split(":")[-1][0])
        columns = range(first - 1, last)
    fc = [FilterColumn(colId=col, hiddenButton=True) for col in columns]
    if not table.autoFilter:
        table.autoFilter = AutoFilter(ref=table.ref, filterColumn=fc)
    else:
        table.autoFilter.filterColumn = fc
