import time
from typing import Optional, TYPE_CHECKING

import arcpy

from . import execution

if TYPE_CHECKING:
    from arcpy._mp import Layer, Map

from ..._logging import get_logger

logger = get_logger(__name__)

__all__ = [
    "run",
    "validate",
]


def gp_wrapper(func):
    """Function decorator that extracts values from parameter objects and logs them"""
    import functools
    import inspect
    from arcpy._mp import Layer, Table

    def val_repr(value):
        """Custom repr for arcpy parameters"""
        if isinstance(value, tuple | list):
            is_tuple = isinstance(value, tuple)
            return "{0}{string}{comma}{1}".format(
                *"()" if is_tuple else "[]",
                string=", ".join(map(val_repr, value)),
                comma="," if is_tuple and len(value) == 1 else "",  # single element tuple needs comma
            )

        if isinstance(value, arcpy.FieldMappings):
            value = value.exportToString()
        elif isinstance(value, Layer | Table):
            return "arcpy.management.{layer_func}({path}, {name}, {sql})[0]".format(
                layer_func="MakeFeatureLayer" if isinstance(value, Layer) else "MakeTableView",
                path=repr(value.dataSource),
                name=repr(value.name),
                sql=repr(value.definitionQuery or None),
            )

        return repr(value)

    def write_call(function, *args, **kwargs):
        """Writes the debug call for easy execution"""

        bind = inspect.signature(function).bind(*args, **kwargs)
        bind.apply_defaults()
        func_args = bind.arguments

        # args and kwargs are formatted differently
        positional_args = func_args.pop("args", ())
        keyword_args = func_args.pop("kwargs", {})
        arguments = list(func_args.items())
        for arg in positional_args:
            arguments.append((None, arg))
        for k, v in keyword_args.items():
            arguments.append((k, v))

        arguments = [
            val_repr(val) if name is None else f"{name}={val_repr(val)}"  # positional else remaining arguments
            for name, val in arguments
        ]

        func_args_str = f",\n    ".join(arguments)
        logger.debug(f"\n{function.__module__}.{function.__qualname__}(\n    {func_args_str},\n)")

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        write_call(func, *args, **kwargs)
        start = time.perf_counter()
        try:
            f = func(*args, **kwargs)
        finally:
            logger.debug(f"{func.__module__}.{func.__qualname__}\t{time.perf_counter() - start}")
            arcpy.SetProgressor("default", "Synchronizing...")
        return f

    return wrapper


class ParamWrapper:
    def __init__(self, param):
        self.param: arcpy.Parameter = param

    def get_value(self, include_disabled: bool = False):
        if not isinstance(self.param, arcpy.Parameter):
            return self.param

        # If the parameter is disabled, we are not interested in the value.
        if not self.param.enabled and not include_disabled:
            return None

        values = self._get_value(self.param)

        if self.param.multiValue:
            if values is None:
                # If an optional multiValue parameter is not specified, None is the value.
                # Change this to an empty tuple as the code will *generally* be expecting an iterable.
                return tuple()
            else:
                return tuple(self._get_value(v) for v in values)
        elif hasattr(self.param, "columns"):
            # Value Table is a special parameter type, but it is localized depending on LP. Use .columns as a proxy.
            return tuple(tuple(self._get_value(cell) for cell in row) for row in values or [])
        else:
            return values

    @staticmethod
    def _get_value(value_obj):
        try:
            return value_obj.values
        except (AttributeError, NameError):
            pass
        while hasattr(value_obj, "value"):
            # Some parameters have nested .value
            value_obj = value_obj.value

        # Convert empty strings to None
        if isinstance(value_obj, str) and not value_obj:
            return

        return value_obj


def get_parameter_values():
    return [ParamWrapper(p).get_value() for p in arcpy.GetParameterInfo()]


def get_params(disabled_names: list[str] = None) -> dict[str, ...]:
    if disabled_names is None:
        disabled_names = []
    return {
        p.name: ParamWrapper(p).get_value(include_disabled=p.name in disabled_names) for p in arcpy.GetParameterInfo()
    }


def validate(tool_path: str):
    """Main entrypoint for all validation"""
    import pathlib
    from . import validation

    tool_name = pathlib.Path(tool_path).parent.stem
    return getattr(validation, tool_name, None)


def run(tool_path: str):
    """Main entrypoint for all runtime execution"""
    import pathlib
    import uuid
    import arcpy
    from . import execution

    # The folder name of the execution script is the name of the function.
    func_name = pathlib.Path(tool_path).parent.stem
    params = get_params(disabled_names=["in_table", "out_folder"])
    if (func := getattr(execution, func_name, None)) is None:
        raise ValueError(f"Function {func_name} does not exist")

    if params["out_folder"] == "|":  # Design view, replace with a unique folder.
        folder = pathlib.Path(arcpy.env.scratchFolder).joinpath(uuid.uuid4().hex)
        folder.mkdir(parents=True, exist_ok=True)
        params["out_folder"] = folder.as_posix()

    update_params_dict(params)
    result = gp_wrapper(func)(**params)

    if not result:
        return

    if isinstance(result, str | list):
        result = {"out_rule_csv": result}

    param_names = tuple(params)
    for param, val in result.items():
        try:
            arcpy.SetParameter(param_names.index(param), val)
        except ValueError:
            continue


def update_params_dict(params: dict):
    """Standardizes common values coming from parameters. Original values are prefixed with `_`"""
    from ..common import get_where_clause

    # Extract and combine where clauses.
    layer_where = get_where_clause(params["in_table"])
    user_where = params.get("where_clause", None)
    if layer_where and user_where:
        sql = f"({layer_where}) AND ({user_where})"
    elif layer_where:
        sql = layer_where
    elif user_where:
        sql = user_where
    else:
        sql = None
    params["_where_clause"] = user_where
    params["where_clause"] = sql

    if isinstance(table := params["in_table"], str):
        params["URI"] = table
    else:
        params["in_table"] = arcpy.Describe(table).catalogPath
        params["URI"] = table.URI
    params["_in_table"] = table


class BaseValidator:
    BASIC = "ArcView"
    STANDARD = "ArcInfo"
    ADVANCED = "ArcEditor"

    def __init__(self):
        self.params: tuple[arcpy.Parameter, ...] = arcpy.GetParameterInfo()

    def initializeParameters(self):
        return

    def updateParameters(self):
        return

    def updateMessages(self):
        return

    def isLicensed(self):
        return True

    def postExecute(self):
        return

    def is_tool_open(self) -> bool:
        """Tools has just opened"""
        return all(not p.hasBeenValidated for p in self.params)

    @staticmethod
    def set_license_error(parameter: arcpy.Parameter, product: str):
        order = (BaseValidator.BASIC, BaseValidator.STANDARD, BaseValidator.ADVANCED)
        # High level licenses satisfy lower checks, so we check all relevant levels.
        for level in order[order.index(product) :]:
            if arcpy.CheckProduct(level) in ("Available", "AlreadyInitialized"):
                return
        parameter.setIDMessage("ERROR", 824)  # The tool is not licensed.

    @staticmethod
    def network_is_valid(parameter: arcpy.Parameter, client_server: bool):
        """Validates the Asset Package / Utility Network is valid"""
        if parameter.hasBeenValidated or not parameter.enabled or parameter.hasError() or not parameter.valueAsText:
            return

        paths = [parameter.valueAsText]
        if parameter.multiValue:
            paths = parameter.values

        for path in paths:
            d = arcpy.Describe(path)
            if client_server and d.path.casefold().startswith("http"):
                # This operation is not supported against input datasets from a feature service.
                parameter.setIDMessage("ERROR", 2138)
                return

            if d.dataType == "Workspace":
                # Cheap check if the workspace is an asset package.
                if "AP_Domain_Networks" not in getattr(d, "domains", []):
                    parameter.setErrorMessage("Input is not an asset package.")
                    return
            elif d.dataType.startswith("UtilityNetwork"):  # Support layers and catalog paths.
                pass
            else:
                # Wrong datatype
                parameter.setIDMessage("ERROR", 840, "Utility Network or Workspace")
                return

    @staticmethod
    def add_results_to_group(parameter: arcpy.Parameter, group_layer_name: str) -> Optional["Layer"]:
        """Adds all the results from parameter to a new group layer in the active map."""

        if not (tables := parameter.values):
            return
        try:
            m: "Map" = arcpy.mp.ArcGISProject("current").activeMap
            if not m:
                return
        except OSError:
            return

        group: "Layer" = m.createGroupLayer(name=group_layer_name)
        temp = m.createGroupLayer("temp", group)  # Need a temporary child so layers can be moved after it.

        try:
            for table in tables:
                layer: "Layer" = m.addDataFromPath(table.value)
                if getattr(layer, "isFeatureLayer", False):
                    m.moveLayer(temp, layer, "BEFORE")
                else:
                    m.addTableToGroup(group, layer)
                    m.removeTable(layer)
        finally:
            m.removeLayer(temp)

        return group

    @staticmethod
    def value_table_to_list(
        parameter: arcpy.Parameter,
        as_true_value: bool = True,
    ):
        vt = arcpy.ValueTable(columns=[c[0] for c in parameter.columns] if as_true_value else len(parameter.columns))
        vt.loadFromString(parameter.valueAsText)
        if as_true_value:
            return [vt.getTrueRow(i) for i in range(vt.rowCount)]
        else:
            return [[vt.getValue(i, j) for j in range(vt.columnCount)] for i in range(vt.rowCount)]

    @staticmethod
    def _make_required(p: arcpy.Parameter):
        p.setIDMessage("ERROR", 735, p.displayName)

    @staticmethod
    def make_parameter_required(*parameter: arcpy.Parameter):
        for param in parameter:
            if not param.enabled or param.hasError():
                continue

            if not param.valueAsText:
                BaseValidator._make_required(param)

    @staticmethod
    def make_value_table_parameter_required(
        parameter: arcpy.Parameter,
        min_rows: int = 0,
        required_columns: tuple[int, ...] = None,
        duplicate_columns: list[tuple[int, ...]] = None,
    ):
        """Sets a ValueTable parameter as required.
        Arguments:
            parameter: The parameter. It must be enabled, without error, and not have a value.
            min_rows: The minimum number of required rows. Defaults to 0, which means it's optional.
            required_columns: The ordinal position of columns that are required for each row. Defaults to all columns.
            duplicate_columns: The ordinal position of columns to check for duplicates. Defaults to no checks.
        """
        if not parameter.enabled or parameter.hasError():
            return

        rows = BaseValidator.value_table_to_list(parameter, False)
        if len(rows) < min_rows:
            BaseValidator._make_required(parameter)
            return

        duplicate_columns = duplicate_columns or []
        duplicates = [set() for _ in duplicate_columns]

        for row in rows:
            for unique, cols in zip(duplicates, duplicate_columns):
                combo = tuple(row[i] for i in cols)
                if combo in unique:
                    parameter.setIDMessage("ERROR", 400)  # Duplicate inputs are not allowed.
                    return
                unique.add(combo)

            # Use an empty tuple as a sentinel for no required columns
            if isinstance(required_columns, tuple) and len(required_columns) == 0:
                continue
            for i in required_columns or range(len(row)):
                # Regardless of datatype, empty cells come back as ''
                if isinstance(row[i], str) and not row[i]:
                    BaseValidator._make_required(parameter)
                    return

    @staticmethod
    def set_value_table_defaults(
        parameter: arcpy.Parameter,
        defaults: dict[int, ...],
    ):
        """Populates value table with default values"""

        if not parameter.valueAsText:
            return

        update = False
        value_table = arcpy.ValueTable(len(parameter.columns))
        value_table.loadFromString(parameter.valueAsText)
        for row in range(value_table.rowCount):
            for col, default in defaults.items():
                if not value_table.getValue(row, col):
                    update = True
                    value_table.setValue(row, col, default)

        if update:
            parameter.value = value_table.exportToString()


class AAValidator(BaseValidator):
    def __init__(self):
        super().__init__()

        self.table = self._get_param("in_table")
        self.field = self._get_param("field")
        self.folder = self._get_param("out_folder")

    def _get_param(self, name: str) -> arcpy.Parameter:
        return getattr(self.params, name, None)

    def is_design_view(self) -> bool:
        """Tool being called from design view"""
        return self.folder.valueAsText == "|"

    def initializeParameters(self):
        if not self.folder.valueAsText:
            try:
                self.folder.value = arcpy.mp.ArcGISProject("current").homeFolder
            except OSError:
                return

    def updateParameters(self):
        # Calling from DesignView.
        self.table.enabled = self.folder.enabled = not self.is_design_view()

    def updateMessages(self):
        if self.is_design_view():
            self.folder.clearMessage()
