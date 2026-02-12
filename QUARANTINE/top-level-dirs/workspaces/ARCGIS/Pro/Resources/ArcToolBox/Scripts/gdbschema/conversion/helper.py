import dataclasses
import itertools
from functools import cache
from operator import attrgetter
from typing import Iterable, TypeVar, Type, Any, Optional, Union, TYPE_CHECKING, NamedTuple

if TYPE_CHECKING:
    from .workspace import Table
    from ..conversion import Workspace
    from ..constants import Enum

__all__ = [
    "BaseType",
    "Base",
    "BaseMeta",
    "Collection",
    "BaseCollection",
    "MockCollection",
    "ValueWrapper",
    "pluralize",
    "to_url",
    "Header",
    "Link",
]

BaseType = TypeVar("BaseType", bound="Base")
Link = Union[tuple[Type["Base"], Any], tuple[()]]


def pluralize(word: str) -> str:
    """Makes word plural"""
    suffix = "s"
    if word.endswith("s") or word.endswith("x"):
        suffix = "es"
    return word + suffix


def to_url(val):
    """Converts ValueWrapper anchor to URL"""
    if isinstance(val, ValueWrapper):
        return val.as_link()
    return val


class ValueWrapper(NamedTuple):
    """Class for enriching values with more metadata such as links"""

    value: Any  # The underlying value that will be stored as is.
    link: tuple[Link, ...] = None  # A reference to an anchor.
    anchor: tuple[Link, ...] = None  # The destination for a link.
    format: str = None  # Formatting to apply in Excel.

    def __str__(self):
        return str(self.value)

    @classmethod
    def new(cls, c: Type["Base"], value, /, *, as_anchor: bool = False):
        return cls(value, **{"anchor" if as_anchor else "link": ((c, value),)})

    def extend(self, cls: Type["Base"], value, *, as_anchor: bool = False) -> "ValueWrapper":
        """Creates new ValueWrapper by extending the link"""
        kwargs = {"value": value}
        if anchor := self.anchor or self.link:
            kwargs["anchor" if as_anchor else "link"] = (*anchor, (cls, value))
        return ValueWrapper(**kwargs)

    def as_link(self) -> "ValueWrapper":
        """Creates new ValueWrapper by converting anchor to a link"""
        return ValueWrapper(self.value, self.anchor or self.link, format=self.format)

    def replace(self, **kwargs):
        return self._replace(**kwargs)


class Header(NamedTuple):
    label: str  # Human-readable label for the table
    getter: str  # The property (possibly nested) representing the value
    json: str = None  # The corresponding json key.
    enum: Type["Enum"] = None  # Enumeration of possible values
    null: Any = None  # Default when not specified.

    def replace(self, **kwargs):
        return self._replace(**kwargs)


class BaseMeta(type):
    """Metaclass that provides a stripped down repr"""

    def __repr__(cls):
        return f"<class {cls.__name__!r}>"


class Base(metaclass=BaseMeta):
    """Base Class that all geodatabase items inherit from"""

    # Each subclass must override this completely.
    HEADER: tuple[Header, ...]

    SHEET_PREFIX: str = ""  # Prefix to uniquely identify the datatype to handle name collisions.
    DELIM: str = ";"  # Used to join multiple values that should be logically grouped.

    _HEADER_KEYS: tuple  # this is set in the __init_subclass__ below

    parent: BaseType  # This is set in the __init__ below. Each subclass should set the subtype as a class variable.

    def __init_subclass__(cls, **kwargs):
        setattr(cls, "_HEADER_KEYS", tuple(zip(*cls.HEADER)))

    def __init__(self, data, parent=None, name: str = "name"):
        self._d: dict = data
        self.parent = parent

        self._name = name

    def __repr__(self):
        return f"<{self.class_name()} {str(self.name)!r}>"

    def __str__(self):
        return f"{self.class_name()}: {str(self.name)}"

    @classmethod
    def class_name(cls) -> str:
        return cls.__name__

    @classmethod
    def class_name_lower(cls) -> str:
        return cls.class_name().casefold()

    @classmethod
    def class_name_plural(cls) -> str:
        return pluralize(cls.__name__)

    @classmethod
    def to_json(cls, data: dict) -> dict[str, Any]:
        """Converts dictionary (eg from Excel) to the json specification."""
        from datetime import datetime

        result = {}
        for header in cls.HEADER:
            if header.json is None:
                continue
            if (val := data[header.label]) is None:
                val = header.null
            elif isinstance(val, datetime):
                val = cls._stamp(val)
            elif header.enum:
                val = header.enum(val).json_value()
            result[header.json] = val
        return result

    @property
    @cache
    def name(self) -> ValueWrapper:
        """The property that uniquely references the element"""

        from ..conversion import Workspace

        # If the parent is the workspace (or there is no parent) then we create a new instance.
        # Otherwise, we are a child (eg Table -> Field, UtilityNetwork -> DomainNetwork -> Source) and need to extend.
        if (parent := self.parent) and not isinstance(parent, Workspace):
            new = parent.name.extend
        else:
            new = ValueWrapper.new

        return new(self.__class__, self._d.get(self._name), as_anchor=True)

    @classmethod
    def header_keys(cls) -> tuple:
        return cls._HEADER_KEYS

    @classmethod
    def header(cls):
        return cls.header_keys()[0]

    @classmethod
    def index_of(cls, name: str) -> int:
        """The ordinal position in the header for name."""
        for i, (x, y) in enumerate(cls.HEADER):
            if name == x:
                return i

    def get_parent(self, cls: Type[BaseType]) -> Optional[BaseType]:
        """Walks parentage until cls is found"""
        p = self
        while parent := getattr(p, "parent", None):
            if isinstance(p := parent, cls):
                return p

    def get_gdb(self) -> "Workspace":
        from ..conversion import Workspace

        return self.get_parent(Workspace)

    def get_table(self, val) -> Optional["Table"]:
        from .workspace import Table

        return self.get_gdb().get_child(Table, val)

    def link(self) -> Link:
        return self.__class__, getattr(self.name, "value", self.name)

    def _count(self, collections: list["Collection"]):
        """Creates a Count MockCollection of all collections"""
        data = [
            (
                ValueWrapper(c.class_name(), link=c.link),
                len(c.elements),
            )
            for c in collections
        ]
        return MockCollection(["Type", "Count"], data)

    def _pre_ordered(self) -> list["MockCollection"]:
        """The collections to serialize first. Base classes may override this."""
        return [
            self.properties(),
        ]

    def _ordered(self) -> list["BaseCollection"]:
        """The collections to count. Base classes need to override this."""
        return []

    def ordered(self) -> list["BaseCollection"]:
        """The collections that will be serialized in order. This should not be overridden."""
        order = self._ordered()
        combo = [
            self._count(order),
            *self._pre_ordered(),
            *order,
        ]
        return [c for c in combo if c is not None]

    def to_list(self) -> list:
        """Converts data to a list"""
        row = []
        for header in self.HEADER:
            val = attrgetter(header.getter)(self)
            if enum := header.enum:
                val = self._lookup(enum, val)
            row.append(val)
        return [row]

    def properties(self, name: str = "Properties") -> "MockCollection":
        """MockCollection representing Dataset Properties"""
        return MockCollection(
            ["Key", "Value"],
            elements=list(zip(self.header(), self.to_list()[0])),
            cls_name=name,
        )

    @staticmethod
    def _zip(parent: "Base", items: Iterable[dict]):
        for item in items:
            yield item, parent

    def _make(self, cls: Type["Base"], items: Iterable, merge: bool = False):
        """Wraps items of a specific cls in a BaseCollection"""
        if merge:
            return BaseCollection(cls, itertools.chain.from_iterable(items))

        return BaseCollection(cls, ((i, self) for i in items))

    @staticmethod
    def _property_set(data: dict) -> dict:
        """Converts a flattened propertySet array to a dictionary"""
        from ..common import load_json

        # Property set is a flattened list of key value pairs.
        items = data.get("propertySetItems", [])
        data = {}
        for i in range(0, len(items), 2):
            key, val = items[i : i + 2]
            if isinstance(val, str):
                if val.startswith(("{", "[")) and val.endswith(("}", "]")):  # Looks like json
                    try:
                        val = Base._json(load_json(val))
                    except Exception as e:
                        pass

            data[key] = val
        return data

    @staticmethod
    def _time(val: int):
        """Converts UTC timestamp to datetime"""
        from datetime import datetime

        return datetime.fromtimestamp((val or 0) / 1000)

    @staticmethod
    def _stamp(val):
        """Converts datetime object to timestamp"""
        from datetime import datetime

        if isinstance(val, datetime):
            delta = (aware := val.astimezone()) - datetime.fromtimestamp(0, aware.tzinfo)  # Local tz aware conversion.
            return int(delta.total_seconds()) * 1000
        return val

    @staticmethod
    def _nan(val):
        """Coerces NaN string"""
        return float("nan") if val == "NaN" else val

    @staticmethod
    def _strip(prefix: str, val: str) -> str:
        """Removes prefix from val"""
        if not val:
            return val
        return val.removeprefix(prefix)

    @staticmethod
    def _lookup(enum: Type["Enum"], val):
        if val is True or val is False or val is None:
            return val
        try:
            return enum[val].value
        except KeyError:
            return val

    @staticmethod
    def _json(val) -> Optional[str]:
        """JSON pretty printer"""
        from ..common import dump_json

        if val is None:
            return

        return dump_json(val, pretty=True)


@dataclasses.dataclass
class Collection:
    """Collection super class, do not instantiate directly. See BaseCollection or MockCollection"""

    def __post_init__(self):
        self._count = len(self.elements)

    def __repr__(self):
        return f"<Collection of {len(self)} {self.class_name()}>"

    def __iter__(self):
        yield from self.elements

    def __len__(self):
        return self._count

    def class_name(self) -> str:
        # cls_name always trumps if specified.
        cls_name = getattr(self, "cls_name", None)
        if self.cls is type:
            return cls_name or "Summary"
        return cls_name or self.cls.class_name()

    def class_name_plural(self) -> str:
        return pluralize(self.class_name())


@dataclasses.dataclass
class BaseCollection(Collection):
    """Collection of Base elements"""

    cls: Type[Base]
    elements: Iterable
    link: Link = None

    def __post_init__(self):
        data = []
        for e in self.elements:
            if isinstance(e, self.cls):
                data.append(e)
            elif isinstance(e, BaseCollection):
                data.extend(e)
            else:
                data.append(self.cls(*e))
        self.elements = data
        super().__post_init__()

    @property
    def header(self):
        return self.cls.header()

    def to_list(self):
        rows = []
        for d in self.elements:
            rows.extend(d.to_list())
        return rows

    def as_mock(self) -> "MockCollection":
        return MockCollection(
            header=self.header,
            elements=[[to_url(r) for r in row] for row in self.to_list()],
            cls=self.cls,
        )


@dataclasses.dataclass
class MockCollection(Collection):
    """Generic Collection. Use this when there is no corresponding Base class."""

    header: list[str]
    elements: list
    cls: type = type
    cls_name: str = None
    link: tuple[Link, ...] = None

    def to_list(self):
        return self.elements
