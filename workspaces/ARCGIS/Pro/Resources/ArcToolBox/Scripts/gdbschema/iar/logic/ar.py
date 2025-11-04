import csv
import dataclasses
from typing import Literal, Union, Iterator, Optional


def dialect():
    """Dialect used for read/writing CSVs"""

    # This function returns a class so the call to locale is deferred (class methods happen on import).
    import locale

    class CSVDialect(csv.Dialect):
        delimiter = ";" if locale.localeconv()["decimal_point"] == "," else ","
        quotechar = '"'
        escapechar = '"'
        doublequote = False
        skipinitialspace = True
        lineterminator = "\r\n"
        quoting = csv.QUOTE_MINIMAL
        strict = True

    return CSVDialect


def load_script(
    name: str,
    ar_kwargs: dict,
    rule_settings: dict = None,
    **kwargs,
) -> str:
    from .. import template

    in_field = ar_kwargs.get("field", None)
    # TODO: We cannot return something for GLOBAL_ASSIGNED_FIELD if not field is assigned, we might want something better as a sentinal than a barestring ''
    variables = {
        "GLOBAL_ASSIGNED_FIELD": getattr(template.Constants.feature, in_field) if in_field else template.BareString(""),
    }

    script = template.ScriptTemplate(
        template.ARCADE.get(name),
        variables=variables | kwargs,
        rule_settings=rule_settings,
    )

    return script.to_string()


@dataclasses.dataclass
class AttributeRule:
    table: str
    name: str
    script: str = None
    type: Literal["CALCULATION", "CONSTRAINT", "VALIDATION"] = "CALCULATION"
    field: str = None
    subtype: list[Union[str, None]] = None
    description: str = None
    editable: bool = True
    triggers: tuple[Literal["INSERT", "UPDATE", "DELETE"], ...] = ("INSERT", "UPDATE")
    error_num: int = None
    error_msg: str = None
    exclude: bool = False
    enabled: bool = True
    batch: bool = False
    severity: int = None
    tags: list[str] = None

    def __post_init__(self):
        # If there are multiple subtypes, then each needs to be created separately.
        if self.subtype is None:
            self.subtype = [None]

        self.name = self._make_rule_name_unique()

    def _make_rule_name_unique(self) -> str:
        """Make rule name unique across table"""
        try:
            import arcpy

            existing = {r.name.casefold() for r in getattr(arcpy.Describe(self.table, "Table"), "attributeRules", [])}
        except (OSError, RuntimeError):
            return self.name

        name = base = self.name
        i = 0
        while name.casefold() in existing:
            name = f"{base}{i}"
            i += 1
        return name

    def as_csv_dict(self) -> Iterator[dict]:
        for subtype in self.subtype:
            yield dict(
                NAME=self.name if subtype is None else f"{self.name} ({subtype})",
                DESCRIPTION=self.description,
                TYPE=self.type,
                SUBTYPE=subtype,
                FIELD=self.field,
                ISEDITABLE=self.editable,
                TRIGGERINSERT="INSERT" in self.triggers,
                TRIGGERDELETE="DELETE" in self.triggers,
                TRIGGERUPDATE="UPDATE" in self.triggers,
                SCRIPTEXPRESSION=self.script,
                ERRORNUMBER=self.error_num,
                ERRORMESSAGE=self.error_msg,
                EXCLUDECLIENTEVALUATION=self.exclude,
                ISENABLED=self.enabled,
                BATCH=self.batch,
                SEVERITY=self.severity,
                TAGS=";".join(self.tags) if self.tags else None,
                CATEGORY=None,
                CHECKPARAMETERS=None,
            )

    def safe_name(self):
        str_trans = str.maketrans({c: "_" for c in r'\/:*?"<>()| '})
        return self.name.translate(str_trans)

    def to_csv(self, folder: str) -> Optional[str]:
        import configparser
        import pathlib
        import csv

        if not (rules := list(self.as_csv_dict())):
            return

        # subfolder comes from table name (not unique)
        # file name comes from rule name (unique)
        sub = pathlib.Path(folder).joinpath(pathlib.Path(self.table).name.split(".")[-1])
        sub.mkdir(parents=True, exist_ok=True)

        name = base = self.safe_name()
        i = 0
        while (csv_file := sub.joinpath(f"{name}.csv")).exists():
            name = f"{base}{i}"
            i += 1

        header = rules[0].keys()
        with csv_file.open(mode="w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=header, dialect=dialect())
            writer.writeheader()
            writer.writerows(rules)

        # Craft schema.ini payload.
        data = dict(Format="CSVDelimited", ColNameHeader=True)
        for i, col in enumerate(header, 1):
            values = [col, "Text"]
            if col.casefold() == "ScriptExpression".casefold():
                values.extend(["Width", 500_000])
            data[f"Col{i}"] = " ".join(map(str, values))

        config = configparser.ConfigParser()
        config.optionxform = lambda option: option  # Preserve Case
        config[csv_file.name] = data
        with sub.joinpath("schema.ini").open("a", encoding="utf-8") as w:
            config.write(w, space_around_delimiters=False)

        return csv_file.as_posix()


def create_rule(
    script_name: str,
    script_args: dict,
    ar_kwargs: dict,
    rule_settings=None,
):
    script = load_script(script_name, ar_kwargs, rule_settings, **script_args)

    triggers = ar_kwargs.get("triggering_events")
    if ar_kwargs.get("batch"):
        triggers = []

    ar = AttributeRule(
        table=ar_kwargs["in_table"],
        name=ar_kwargs["name"],
        script=script,
        type=ar_kwargs.get("type") or "CALCULATION",
        field=ar_kwargs.get("field") or None,
        subtype=ar_kwargs.get("in_subtypes") or None,
        description=ar_kwargs.get("description") or None,
        editable=ar_kwargs.get("is_editable") or True,
        triggers=triggers,
        error_num=ar_kwargs.get("error_number") or None,
        error_msg=ar_kwargs.get("error_message") or None,
        exclude=ar_kwargs.get("exclude_from_client_evaluation") or False,
        enabled=True,
        batch=ar_kwargs.get("batch") or False,
        severity=ar_kwargs.get("severity") or None,
        tags=ar_kwargs.get("tags") or None,
    )

    return ar.to_csv(folder=ar_kwargs["out_folder"])
