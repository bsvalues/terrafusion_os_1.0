import dataclasses
import enum
from typing import Final, Any

__all__ = [
    "BareString",
    "ScriptTemplate",
    "FeatureSetByName",
    "Indent",
]

STRIP: Final = True  # Clean up arcade


def strip(script: str) -> str:
    """Removes comments and console statements"""
    if not STRIP:
        return script

    import re

    def repl(m: re.Match) -> str:
        if m.start() == 0:  # Beginning of string, keep this comment.
            return m.group()
        return ""

    # Multiline comment
    script = re.sub(r"/\*.+?\*/", repl, script, flags=re.DOTALL)
    # If Console is present anywhere, remove the entire line.
    # This isn't a perfect solution, but since we are controlling the scripts, it's a reasonable requirement.
    script = re.sub(r".*?Console.+", "", script, flags=re.IGNORECASE)

    return script


class BareString:
    """String with a repr that has no quotes"""

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return self.name


class TemplateLiteral:
    """Class that injects variables into a template literal"""

    def __init__(self, string: str, *args, **kwargs):
        """

        :param string: The string that will be formatted.
        :param args: positional arguments. These are passed as is.
        :param kwargs: keyword arguments. These are wrapped in ${} for use in arcade.
        """

        self.name = string.format(
            *args,
            **{k: f"${{{v!r}}}" for k, v in kwargs.items()},
        )

    def __repr__(self):
        return f"`{self.name}`"


class CodeType(enum.Enum):
    SCRIPT = enum.auto()
    FUNCTION = enum.auto()
    CODE = enum.auto()


@dataclasses.dataclass
class ArcadeCode:
    name: str
    type: CodeType
    script: str | BareString


@dataclasses.dataclass
class CodeRepository:
    """Repository for all arcade code stored in external files"""

    data: tuple[ArcadeCode, ...]

    def functions(self) -> dict[str, str]:
        return {c.name: c.script for c in self.data if c.type == CodeType.FUNCTION}

    def scripts(self) -> dict[str, str]:
        return {c.name: c.script for c in self.data if c.type == CodeType.SCRIPT}

    def variables(self) -> dict[str, str]:
        return {c.name: c.script for c in self.data if c.type == CodeType.CODE}

    def get(self, name: str) -> str | None:
        for c in self.data:
            if c.name == name:
                return c.script


def _read_scripts() -> CodeRepository:
    """Arcade functions keyed by their header"""
    from .common import get_data_file
    import pathlib
    import re

    # Read all the JS files and group by folder.
    data: dict[str, list[tuple[str, str]]] = {}
    with get_data_file("arcade/") as folder:
        for f in sorted(pathlib.Path(folder).rglob("*.js")):  # Sort so that output is deterministic.
            data.setdefault(f.parent.stem, []).append((f.stem, strip(f.read_text(encoding="utf-8"))))

    # Multiple functions and code snippets are in the same file. Extract each body and name it accordingly.
    function_pat = re.compile(
        r"""(?P<body>
        function[ ]                 # function declaration
        (?P<name>[a-z0-9_]+?)       # function name
        \(.+?\n}                    # body
        )                    
        """,
        flags=re.IGNORECASE | re.DOTALL | re.VERBOSE,
    )
    code_pat = re.compile(
        r"""//%                     # headers are comments with a special % flag
        (?P<name>[a-z0-9_]+)        # name of body
        (?P<body>.+?)               # body contents
        (?=//%|$)                   # look ahead to next header or end of string
        """,
        flags=re.IGNORECASE | re.DOTALL | re.VERBOSE,
    )

    arcade_code = []
    for code_type, rows in data.items():
        if code_type == "scripts":
            arcade_code.extend(ArcadeCode(name, CodeType.SCRIPT, script) for name, script in rows)
            continue

        if code_type == "functions":
            pattern = function_pat
            code_type = CodeType.FUNCTION
        else:
            pattern = code_pat
            code_type = CodeType.CODE

        for match in pattern.finditer("\n".join(r[1] for r in rows)):
            arcade_code.append(ArcadeCode(match.group("name"), code_type, BareString(match.group("body"))))

    return CodeRepository(tuple(arcade_code))


ARCADE: Final = _read_scripts()


class Getter:
    """Class that returns itself with . and [] notation"""

    def __init__(self, start: str | BareString):
        self.start = BareString(start) if isinstance(start, str) else start

    def __repr__(self):
        return repr(self.start)

    def __getattr__(self, item):
        if item == "repr_i":
            raise AttributeError
        return self.__class__(f"{self}.{item}")

    def __getitem__(self, item):
        return self.__class__(f"{self}[{item!r}]")


class Constants:
    feature = Getter("$feature")
    originalFeature = Getter("$originalFeature")
    featureSet = Getter("$featureSet")
    datastore = BareString("$datastore")


class Indent:
    """Pretty printed list/dict"""

    def __init__(self, data, *, level: int = 1, recursive: bool = False):
        self.data = ScriptTemplate.convert(data)
        self.level = level
        self.indent = " " * level * 2
        self.recursive = recursive

    def r(self, obj):
        """Gets obj repr"""
        if hasattr(obj, "repr_i"):
            return obj.repr_i(self.indent)
        return repr(obj)

    def _list(self, d: list):
        yield "["
        for item in d:
            if self.recursive and isinstance(item, list | tuple | dict):
                item = Indent(item, level=self.level + 1, recursive=True)
            yield f"{self.indent}{self.r(item)},"
        yield f"{self.indent[:-2]}]"

    def _dict(self, d: dict):
        yield "{"
        for k, v in d.items():
            if self.recursive and isinstance(v, list | tuple | dict):
                v = Indent(v, level=self.level + 1, recursive=True)
            yield f"{self.indent}{self.r(k)}: {self.r(v)},"
        yield f"{self.indent[:-2]}}}"

    def __contains__(self, item):
        return item in self.data

    def __repr__(self):
        if isinstance(self.data, dict):
            f = self._dict
        elif isinstance(self.data, list | tuple):
            f = self._list
        else:
            return self.r(self.data)

        return "\n".join(f(self.data))


class ArcadeFunction:
    def __init__(self, function_name: str, *args):
        self.args = args
        self.function_name = function_name

    def __repr__(self):
        string = ", ".join(str(ScriptTemplate.convert(a)) for a in self.args)
        return f"{self.function_name}({string})"

    def __getattr__(self, item):
        if item == "repr_i":
            raise AttributeError
        return Getter(f"{self}.{item}")

    def __getitem__(self, item):
        return Getter(f"{self}[{item!r}]")


class Geometry(ArcadeFunction):
    def __init__(self, val=Constants.feature, /):
        super().__init__(self.__class__.__name__, val)


class FeatureSetByName(ArcadeFunction):
    def __init__(
        self,
        table: str,
        *,
        fields: str | tuple[str, ...] | list[str] = "*",
        include_geometry: bool = False,
        datastore: str = Constants.datastore,
    ):
        if isinstance(fields, str):
            fields = [fields]
        super().__init__(self.__class__.__name__, datastore, table, fields, include_geometry)


class Expects(ArcadeFunction):
    def __init__(
        self,
        *fields: str,
        feature=Constants.feature,
    ):
        super().__init__(self.__class__.__name__, feature, *fields or "*")


class Decode(ArcadeFunction):
    def __init__(
        self,
        val,
        lookup: dict,
        default=None,
    ):
        from itertools import chain

        super().__init__(self.__class__.__name__, val, *chain.from_iterable(lookup.items()), default)

    def repr_i(self, indent: str):
        """Indent repr"""
        first, *middle, last = ScriptTemplate.convert(self.args)
        pad = f"\n{indent}"
        if middle:
            s = f",{pad}".join(f"{middle[i]!r}, {middle[i + 1]!r}" for i in range(0, len(middle), 2))  # Unflatten list
            mid = f",{pad}{s}"
        else:
            mid = ""
        return f"{self.function_name}({pad}{first!r}{mid},{pad}{last!r}{pad[:-2]})"


class FeatureSetSwitchyard:
    def __init__(self, lookup: dict[str | int, FeatureSetByName]):
        self.lookup = lookup

    def __repr__(self):
        decode = Decode(BareString("key"), lookup=self.lookup)
        return repr(Indent(decode, level=2))


class ScriptTemplate:
    """Template class for replacing variables in arcade with python values"""

    def __init__(
        self,
        template: str,
        *,
        functions: dict[str, str] = None,
        variables: dict[str, Any] = None,
        rule_settings: dict[str, Any] = None,
    ):
        self.script = strip(template)

        # Load from javascript and overwrite with anything the user passed in.
        self.functions = ARCADE.functions() | (functions or {})
        self.variables = {k: self.convert(v) for k, v in (ARCADE.variables() | (variables or {})).items()}
        self.rule_settings: dict = self.convert(rule_settings or {})

    @staticmethod
    def replace_variables(script: str | BareString, mapping: dict) -> str:
        """Recursively replaces instances of mapping in script"""
        if isinstance(script, BareString):
            script = script.name
        if not mapping:
            return script

        import string

        # Subclass string.Template with a custom delimiter. $ clashes too much with arcade.
        class TildeTemplate(string.Template):
            delimiter = "~"

        # Variables might reference other variables. Replace until script stops changing.
        previous = script
        while previous != (replaced := TildeTemplate(previous).safe_substitute(mapping)):
            previous = replaced

        return replaced

    @staticmethod
    def find_functions(script: str, **kwargs) -> dict[str, str]:
        """Finds all the functions referenced in template"""
        if not (kwargs := {k.casefold(): v for k, v in kwargs.items()}):
            return {}

        script = script.casefold()
        if not (funcs := {k for k in kwargs if k in script}):
            return {}

        # Some functions call other functions, so we need to build up a dependency graph.
        deps: dict[str, set[str]] = {}
        keys, scripts = zip(*((k, v.casefold()) for k, v in kwargs.items()))
        for i, script in enumerate(scripts):
            deps[keys[i]] = {k for k in keys if keys[i] != k and k in script}

        # Recursively expand functions.
        size = 0
        while size != (size := len(funcs)):
            for f in tuple(funcs):
                funcs |= deps[f]

        # Honor the order they were passed in
        return {k: v for k, v in kwargs.items() if k in funcs}

    @staticmethod
    def convert(data, *, recurse: bool = False):
        """Converts python types to arcade types"""
        import datetime

        if isinstance(data, dict):
            return {k: ScriptTemplate.convert(v, recurse=True) for k, v in data.items()}
        elif isinstance(data, list | tuple):
            return [ScriptTemplate.convert(i, recurse=True) for i in data]
        elif isinstance(data, bool):
            return BareString("true" if data else "false")
        elif isinstance(data, datetime.datetime):
            return ArcadeFunction(
                "ChangeTimeZone",
                ArcadeFunction("Date", data.isoformat(timespec="milliseconds" if data.microsecond else "seconds")),
                data.strftime("%z") or "Unknown",
            )

        elif isinstance(data, datetime.date):
            return ArcadeFunction("DateOnly", data.isoformat())
        elif isinstance(data, datetime.time):
            return ArcadeFunction("Time", data.isoformat(timespec="milliseconds" if data.microsecond else "seconds"))
        elif data is None:
            return BareString("null")
        elif not recurse and isinstance(data, str):
            return repr(data)  # strings outside of containers (list/dict) use repr() so that x => 'x'
        return data

    def to_string(self) -> str:
        """Performs variable/function substitution"""

        # Replace all variables.
        functions = {k: self.replace_variables(v, self.variables) for k, v in self.functions.items()}
        script = self.replace_variables(self.script, self.variables)

        comment = ""
        settings = ""
        early_exit = ""
        body = script
        if self.rule_settings:
            settings = self.replace_variables("var rule_settings = ~x;", dict(x=self.rule_settings))
            if "where_clause" in self.rule_settings:
                early_exit = """
if (count_features([$feature], DefaultValue(rule_settings, 'where_clause', null)) != 1) {
  return;
}
                """.strip()
            if (pos := script.find("*/")) != -1:  # Split out multiline comment
                pos += 2
                comment = script[:pos]
                body = script[pos:]

        body = f"{early_exit}\n\n{body}".strip()

        # Discover all functions that are referenced by the script.
        if found := self.find_functions(body, **functions):
            functions_str = "\n\n".join(found.values())
        else:
            functions_str = ""

        return f"{comment}\n{settings}\n\n{functions_str}\n\n{body}".strip()
