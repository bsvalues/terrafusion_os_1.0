import dataclasses
import enum
from typing import Any, Iterable, TYPE_CHECKING, TypeVar

import arcpy

from ._logging import get_logger

if TYPE_CHECKING:
    import pyarrow
    from pyarrow.compute import Expression

logger = get_logger(__name__)

DictTuple = TypeVar("DictTuple", dict, tuple)


def standardize_domain_values(field_type: str, values: DictTuple) -> DictTuple:
    """Converts domain codedValues/range to python native types"""

    if field_type == "Date":  # Dates are stored as strings, convert to datetime.
        from dateutil.parser import parse as cast

    elif field_type in ("Short", "Long", "BigInteger"):  # Sometimes stored as floats.
        cast = int
    else:
        return values

    if isinstance(values, tuple):
        return tuple(map(cast, values))
    else:
        return {cast(k): v for k, v in values.items()}


class ContingentValueType(enum.Enum):
    ANY = 1
    NULL = 2
    CODED = 3
    RANGE = 4


class DomainType(enum.Enum):
    NULL = enum.auto()
    CODED = enum.auto()
    RANGE = enum.auto()


@dataclasses.dataclass(slots=True)
class Record:
    code: Any
    description: str | None = None
    type: ContingentValueType = dataclasses.field(init=False)

    def __post_init__(self):
        if self.code is Ellipsis:
            self.type = ContingentValueType.ANY
            self.code = self.description = None
        elif self.code is None:
            self.type = ContingentValueType.NULL
            self.description = None
        elif isinstance(self.code, tuple):
            self.type = ContingentValueType.RANGE
            self.code = "#".join(map(self.range_to_str, self.code))
            self.description = None
        else:
            self.type = ContingentValueType.CODED

            # Convert dates to ISO.
            if hasattr(self.code, "isoformat"):
                self.code = self.code.isoformat()

    @staticmethod
    def range_to_str(val) -> str:
        """Converts value to be used in range CAV"""

        if not isinstance(val, int | float):
            # date/time/datetime are all stored as OLE.
            from gdbschema.date_utils import date_to_ole

            val = date_to_ole(val)

        return str(val)


@dataclasses.dataclass(slots=True)
class ContingentValue:
    id: int
    subtype: Record | None
    records: list[Record]

    def csv_row(self) -> dict:
        row = {
            "CAV_ID": self.id,
            "IS_RETIRED": False,
            "SUBTYPE": 0 if self.subtype is None else self.subtype.code,
            "SUBTYPE_NAME": None if self.subtype is None else self.subtype.description,
        }

        for i, record in enumerate(self.records, 1):
            row[f"CV_TYPE{i}"] = record.type.value
            row[f"CV_VALUE{i}"] = record.code
            row[f"DESCRIPTION{i}"] = record.description

        return row


@dataclasses.dataclass
class FieldGroup:
    name: str
    fields: tuple[str, ...]  # Field names that participate in the FieldGroup
    positions: tuple[int, ...]  # Ordinal position of the field across all field groups
    restrictive: bool = False
    values: list[ContingentValue] = dataclasses.field(default_factory=list)

    def __len__(self) -> int:
        return len(self.fields)


class FieldGroupCollection:
    def __init__(self, subtype_field: str, groups):
        self.subtype_field = subtype_field
        self._data: list[FieldGroup] = groups

    def __iter__(self) -> Iterable[FieldGroup]:
        yield from self._data

    def __len__(self):
        return len(self._data)

    def max_field_count(self) -> int:
        return len(max(self._data, key=len))

    def fg_header(self) -> list[str]:
        header = ["NAME", "IS_RESTRICTIVE"]

        for i in range(1, self.max_field_count() + 1):
            header.append(f"FIELD{i}")

        return header

    def cav_header(self) -> list[str]:
        header = ["CAV_ID", "IS_RETIRED", "FIELD_GROUP", "SUBTYPE", "SUBTYPE_NAME"]

        for i in range(1, self.max_field_count() + 1):
            header.extend([f"{key}{i}" for key in ("CV_TYPE", "CV_VALUE", "DESCRIPTION")])

        return header

    def cav_rows(self):
        for fg in self:
            name = fg.name
            for value in fg.values:
                row = value.csv_row()
                row["FIELD_GROUP"] = name
                yield row

    def fg_rows(self):
        for fg in self:
            row = {"NAME": fg.name, "IS_RESTRICTIVE": fg.restrictive}
            for i, field in enumerate(fg.fields, 1):
                row[f"FIELD{i}"] = field
            yield row


@dataclasses.dataclass
class Lookup:
    fieldName: str
    domain: dict | tuple | None
    type: DomainType

    @classmethod
    def from_field(cls, field_name: str, domain):
        if domain is None:
            values = None
            dtype = DomainType.NULL
        elif domain.domainType == "Range":
            values = domain.range
            dtype = DomainType.RANGE
        else:
            values = domain.codedValues
            dtype = DomainType.CODED
        if values:
            values = standardize_domain_values(domain.type, values)
        return cls(field_name.casefold(), values, dtype)

    def create_expression(self) -> "Expression":
        """pyarrow expression representing valid values"""
        import pyarrow.compute as pc
        import pyarrow as pa

        field = pc.field(self.fieldName)

        if self.type is DomainType.CODED:
            return field.is_null() | field.isin(pa.array(self.domain.keys()))
        elif self.type is DomainType.RANGE:
            return field.is_null() | (field >= self.domain[0]) & (field <= self.domain[1])

    def row_to_record(self, row: dict) -> tuple[Record, ...]:
        """Converts row dict to record"""
        if self.type is DomainType.CODED:
            if (code := row[self.fieldName]) is None:
                return (Record(None),)
            if (desc := self.domain.get(code)) is not None:  # Code must belong to the domain.
                return (Record(code, desc),)
            return tuple()

        elif self.type is DomainType.RANGE:
            if None in (min_max := row[f"{self.fieldName}_min_max"]).values():  # All nulls
                return (Record(None),)

            # Clamp min/max based on existing domain
            lower = max(self.domain[0], min_max["min"])
            upper = min(self.domain[1], min_max["max"])
            range_record = Record((lower, upper))

            if row[f"{self.fieldName}_count"]:  # Nulls present
                return (range_record, Record(None))
            else:
                return (range_record,)

        else:
            all_rows = row["count_all"]
            nulls = row[f"{self.fieldName}_count"]
            if not nulls:
                return (Record(Ellipsis),)
            if all_rows == nulls:
                return (Record(None),)
            return Record(Ellipsis), Record(None)


@dataclasses.dataclass
class Subtype:
    code: int
    name: str | None
    fieldLookups: dict[str, Lookup]


class ContingentValueBuilder:
    def __init__(self, table, field_groups: list[str] = None):
        self.table = table
        self.desc = arcpy.Describe(table)
        self.subtype_field: str = getattr(self.desc, "subtypeFieldName", "").casefold()
        self.field_names: list[str] = []  # Unique field names across all field groups.

        self.field_groups = FieldGroupCollection(self.subtype_field, list(self.get_field_groups(field_groups)))

    def get_field_groups(self, field_groups: list[str]):
        """Creates FieldGroup classes from describe"""
        field_names = {f.name.casefold() for f in self.desc.fields}

        for group in self.desc.fieldGroups:
            if field_groups and group.name not in field_groups:
                continue

            fields = tuple(f.casefold() for f in group.fieldNames)
            if not field_names.issuperset(fields):  # Skip if the FG references a non-existent field.
                continue

            # Find the location of the field across running list of all_fields.
            positions = []
            for field in fields:
                if field not in self.field_names:
                    self.field_names.append(field)
                positions.append(self.field_names.index(field))

            yield FieldGroup(
                name=group.name,
                fields=fields,
                positions=tuple(positions),
                restrictive=group.isEditingRestrictive,
            )

    def subtypes(self) -> Iterable[Subtype]:
        """Domain lookup across all subtypes"""
        for subtype_code, subtype_info in arcpy.da.ListSubtypes(self.table).items():
            fields = {}
            for field_name, (default, domain) in subtype_info["FieldValues"].items():
                if field_name.casefold() in self.field_names:
                    fields[field_name.casefold()] = Lookup.from_field(field_name, domain)

            yield Subtype(
                code=subtype_code,
                name=subtype_info["Name"] if subtype_info["SubtypeField"] else None,
                fieldLookups=fields,
            )

    @staticmethod
    def _product(data: Iterable[tuple[bool, Lookup]]):
        """Cartesian product of input data"""
        import itertools

        converted = []
        for is_nullable, lookup in data:
            # Because Any includes Null, we only use Null if the field is nullable.
            default = [(None if is_nullable else ellipsis, None)]
            if lookup.type is DomainType.NULL:
                converted.append(default)
            elif lookup.type is DomainType.CODED:
                # If there is an empty coded value domain, fall back to the default.
                converted.append(list(lookup.domain.items()) or default)
            elif lookup.type is DomainType.RANGE:
                converted.append([(lookup.domain, None)])

        for row in itertools.product(*converted):
            yield [Record(*r) for r in row]

    def create_cav_schema(self):
        """Creates all possible CV based on domains"""

        nullable = {f.name.casefold() for f in self.desc.fields if f.isNullable}
        subtypes = tuple(self.subtypes())

        i = 1
        logger.debug("Creating combinations")
        for fg in self.field_groups:
            logger.debug(f"\t{fg.name}")
            for subtype in subtypes:
                if subtype.name:
                    sub = Record(subtype.code, subtype.name)
                else:
                    sub = None
                for records in self._product((field in nullable, subtype.fieldLookups[field]) for field in fg.fields):
                    fg.values.append(ContingentValue(id=i, subtype=sub, records=records))
                    i += 1

    def read_table_no_distinct(self, field_lookup: dict[str, str]):
        import pyarrow as pa
        import pandas as pd
        from .common import describe_to_arrow_schema

        # Special fields are compared to None; no need to keep original values.
        special = {"TimestampOffset", "Guid", "Raster", "Blob"}
        check_none = tuple(field_type in special for field_type in field_lookup.values())

        logger.debug("Reading values from table")
        rows = []
        with arcpy.da.SearchCursor(self.table, fields := list(field_lookup)) as cursor:
            for row in cursor:
                rows.append([(None if r is None else True) if check else r for check, r in zip(check_none, row)])
        del cursor

        # Replace special field types with bool.
        schema = describe_to_arrow_schema(self.desc, fields)
        field: pa.Field
        for i, field in enumerate(schema):
            if field_lookup[field.name] in special:
                schema = schema.set(i, field.remove_metadata().with_type(pa.bool_()))

        df = pa.Table.from_pandas(
            pd.DataFrame(rows, columns=fields, dtype=object),
            schema=schema,
            preserve_index=False,
        )

        return df

    def read_table(self) -> "pyarrow.Table":
        """Reads distinct rows from table"""
        import pyarrow as pa
        import pandas as pd
        from .common import describe_to_arrow_schema

        # TimestampOffset, GUID, Raster, & Blob are valid field types, but they do not support domains.
        # They typically will not participate in field groups, so taking a slower code path (ie, no GROUP BY) is OK.
        fields = list(filter(None, [self.subtype_field, *self.field_names]))
        type_lookup = {f.name.casefold(): f.type for f in self.desc.fields}
        field_lookup = {f: type_lookup[f] for f in fields}
        if {"TimestampOffset", "Guid", "Raster", "Blob"}.intersection(field_lookup.values()):
            return self.read_table_no_distinct(field_lookup)

        # Load into DataFrame with object dtype to preserve the original python type.
        # Convert to arrow, which supports all the nullable ArcGIS field types.
        logger.debug("Reading distinct values from table")
        with arcpy.da.SearchCursor(
            self.table,
            fields := list(filter(None, [self.subtype_field, *self.field_names])),
            sql_clause=(None, "GROUP BY {}".format(", ".join(fields))),
        ) as cursor:
            df = pa.Table.from_pandas(
                pd.DataFrame(cursor, columns=fields, dtype=object),
                schema=describe_to_arrow_schema(self.desc, fields),
                preserve_index=False,
            )
        del cursor

        return df

    @staticmethod
    def _table_to_records(df: "pyarrow.Table", fields: tuple[Lookup, ...]):
        """Groups and aggregates the table based on field combinations"""
        import itertools
        import functools
        import operator
        import pyarrow.compute as pc
        import pyarrow as pa
        from datetime import time

        grouped: dict[DomainType, list[Lookup]] = {}
        for lookup in fields:
            grouped.setdefault(lookup.type, []).append(lookup)
        domain_code = grouped.get(DomainType.CODED, [])
        domain_range = grouped.get(DomainType.RANGE, [])
        domain_null = grouped.get(DomainType.NULL, [])

        # TODO: check with pyarrow 17.0.0 where this should be resolved.
        # pyarrow has a bug when performing group by on timeOnly when there is a mixture of nulls.
        # To workaround this, cast the timeOnly to a string, group by on that, then convert back.
        # The string column is suffixed with `!`, which won't collide with any field name.
        time_only_cols = {
            col: f"{col}!"
            for col, col_type in zip(df.schema.names, df.schema.types)
            if isinstance(col_type, pa.Time32Type | pa.Time64Type)
        }
        for col, str_col in time_only_cols.items():
            df = df.append_column(
                pa.field(str_col, pa.string()),
                [[x.isoformat() if x else None for x in df[col].to_pylist()]],
            )

        # Filter the table so only values within the domain are considered.
        if expressions := [f.create_expression() for f in domain_code + domain_range]:
            df = df.filter(functools.reduce(operator.and_, expressions))
            if not df.num_rows:
                return

        # Sorting gives deterministic results.
        # Even if there are no coded domains, group by still works.
        group = df.sort_by(
            [(f.fieldName, "ascending") for f in fields],
            null_placement="at_end",
        ).group_by(
            [time_only_cols.get(f.fieldName, f.fieldName) for f in domain_code],
            use_threads=False,  # Guarantees sorting stability.
        )
        aggregates = []

        # Range domains need min/max and a count of NULL.
        for f in domain_range:
            aggregates.append((f.fieldName, "min_max", pc.ScalarAggregateOptions(skip_nulls=True, min_count=1)))
            aggregates.append((f.fieldName, "count", pc.CountOptions(mode="only_null")))

        # No domain assignment needs a count of both null and not null to determine ANY/NULL.
        if domain_null:
            aggregates.append(([], "count_all"))  # Count the number of rows in each group.
            for f in domain_null:
                aggregates.append((f.fieldName, "count", pc.CountOptions(mode="only_null")))

        agg: "pyarrow.Table" = group.aggregate(aggregates)

        # Convert string back to timeOnly.
        for col, str_col in time_only_cols.items():
            if str_col in agg.column_names:
                agg = agg.append_column(
                    col,
                    [[time.fromisoformat(iso) if iso else None for iso in agg[str_col].to_pylist()]],
                )

        for row in agg.to_pylist():
            yield from itertools.product(*(lookup.row_to_record(row) for lookup in fields))

    def create_cav_data(self):
        import pyarrow.compute as pc

        df = self.read_table()

        i = 1
        logger.debug("Summarizing subtypes")
        for subtype in self.subtypes():
            logger.debug(f"\t{subtype.name}")
            if self.subtype_field:
                df_sub = df.filter(pc.field(self.subtype_field) == subtype.code)
            else:
                df_sub = df
            if not df_sub.num_rows:
                continue

            if subtype.name:
                sub = Record(subtype.code, subtype.name)
            else:
                sub = None
            for fg in self.field_groups:
                for records in self._table_to_records(df_sub, tuple(subtype.fieldLookups[f] for f in fg.fields)):
                    fg.values.append(ContingentValue(id=i, subtype=sub, records=records))
                    i += 1

    @staticmethod
    def _create_csv(header: list, data, output: str):
        import csv

        logger.debug(f"Saving {output}...")
        with open(output, "w", newline="", encoding="utf-8-sig") as w:
            writer = csv.DictWriter(w, fieldnames=header)
            writer.writeheader()
            writer.writerows(data)

    def create_fg_csv(self, output: str):
        self._create_csv(
            header=self.field_groups.fg_header(),
            data=self.field_groups.fg_rows(),
            output=output,
        )

    def create_cav_csv(self, output: str):
        self._create_csv(
            header=self.field_groups.cav_header(),
            data=self.field_groups.cav_rows(),
            output=output,
        )

    def main(self, field_group: str, contingent_values: str, use_schema: bool):
        if use_schema:
            self.create_cav_schema()
        else:
            self.create_cav_data()
        self.create_fg_csv(field_group)
        self.create_cav_csv(contingent_values)
