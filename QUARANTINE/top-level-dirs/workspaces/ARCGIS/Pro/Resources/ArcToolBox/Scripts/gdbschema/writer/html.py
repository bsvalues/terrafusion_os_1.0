from lxml.html import builder, tostring

from .base import Saver
from ..conversion.helper import ValueWrapper

__all__ = [
    "HTMLSaver",
]


def _clean(value: str) -> str:
    """removes invalid characters from value"""
    return value.replace(" ", "_").strip("_")


def _link(vals: tuple[tuple[type, str], ...]):
    if vals is None:
        return
    parts = []
    for cls, val in filter(None, vals):
        if (name := cls.__name__) == "FeatureClass":  # Treat all feature classes as tables.
            name = "Table"
        parts.append(f"{name}_{val}")
    return "-".join(parts)


def convert(val, tag: str, url=None, anchor=None):
    """Converts val to a html element, adding attributes and elements for hyperlinking"""
    if isinstance(val, ValueWrapper):
        value = val.value
        anchor = val.anchor
        url = val.link
    else:
        value = val

    if value is None or (value != value):  # cheap NaN check
        return f"<{tag}>"

    value = str(value)
    element = getattr(builder, tag.upper())()

    if url is not None:
        a = builder.A(value, href=_clean(f"#{_link(url)}"))
        element.append(a)
    else:
        element.text = value

    if anchor is not None:
        element.attrib["id"] = _clean(_link(anchor))

    return tostring(element, encoding="unicode")


def create_id(val: str, prefix: str):
    """Creates HTML id tag"""
    if prefix is None:
        return ""
    text = _clean(f"{prefix}_{val}")
    return f' id="{text}"'


def create_anchor(val: str, link: str):
    if val is None:
        return ""
    return f"<a href=#{_clean(link)}>{val}</a>"


class HTMLSaver(Saver):
    PREFIX = "HTML"

    def __init__(self, gdb, folder, base_name):
        super().__init__(gdb, folder, base_name, suffix="html")
        self._filter()

    def _filter(self):
        """Modifies workspace before saving to HTML"""

        for dataset in self.gdb.datasets:
            # Drop any subtype info that is missing domain/default value.
            for subtype in dataset._d.get("subtypes", []):
                if "fieldInfos" not in subtype:
                    continue
                subtype["fieldInfos"] = [
                    s
                    for s in subtype["fieldInfos"]
                    if s.get("domainName") is not None and s.get("defaultValue") is not None
                ]

            # Replace spatial reference link with name.
            if isinstance(sr := getattr(dataset, "spatial_reference", None), ValueWrapper):
                dataset._sr = self.gdb.spatial_references[sr.value - 1].name.value

    @staticmethod
    def _create_env():
        import pathlib
        from jinja2 import Environment, FileSystemLoader

        env = Environment(
            loader=FileSystemLoader([pathlib.Path(__file__).parent / "templates"]),
            trim_blocks=True,
            lstrip_blocks=True,
            auto_reload=False,
        )
        env.filters.update(
            tag=convert,
            i=create_id,
            a=create_anchor,
        )
        return env

    def main(self):
        env = self._create_env()
        template = env.get_template("root.html.jinja2")
        stream = template.stream(gdb=self.gdb)

        with self._output_file().open("w", encoding="utf-8") as writer:
            stream.dump(writer)

        return self._output_file()
