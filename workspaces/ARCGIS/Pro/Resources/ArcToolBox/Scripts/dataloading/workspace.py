import copy
import logging
import os
import pathlib
import uuid
from typing import Optional, Generator

import arcpy
import numpy as np
import pandas as pd
from dataloading.string_matching import _create_lookup_matrix

from . import helper
from .helper import MsgType, FieldWrapper, TableWrapper
from .settings import *
from .workbook import WorkbookWrapper, WorkbookLoader

logger = logging.getLogger(__name__)


class TableMatch:
    def __init__(
        self,
        source: helper.TableWrapper,
        target: helper.TableWrapper,
        domains: pd.DataFrame = None,
        match_info: "MatchLibrary" = None,
    ):
        # Because field matching state is shared, we need to clone otherwise previous executions can bleed through.
        self.source = copy.deepcopy(source)
        self.target = copy.deepcopy(target)
        self.match_info = match_info
        self._domains = domains
        self._string_match_on = match_info.match_fields
        self._domain_match_on = match_info.match_values

        self._has_lookups = any(
            (
                self.match_info.get_field_mapping(),
                self.match_info.get_field_block(),
                self.match_info.get_field_mapping_exact(),
                self.match_info.get_field_block_exact(),
            )
        )

    def __repr__(self):
        return f"<{self.__class__.__name__} {self.source.name_key}->{self.target.name_key}>"

    def matches(self):
        fields = []
        for f in self.target.fields:
            match = f.match
            if match:
                lookup = []
                mapping = match.domain_mapping()
                for a, b, c, d in mapping:
                    if any(x is None for x in (a, b, c, d)):
                        continue
                    lookup.append({"from": f"{a}::{b}", "to": f"{c}::{d}"})

                inner = dict(target=f.name)
                if match.expression:
                    inner["expression"] = match.expression
                if lookup:
                    inner["source"] = match.source.name
                    inner["lookup"] = lookup
                fields.append(inner)

        return dict(source=self.source.name_key, target=self.target.name_key, fields=fields)

    def _match_subtype(self):
        """Match the subtype code if present"""

        if self.target.subtype_code is None:
            return

        target_field = self.target.fields.get(self.target.fields.subtype)
        target_field.add_match(source=self.target.subtype_code)

    def _match_system_fields(self):
        """Auto match the system maintained fields"""

        # Editor tracking and globalID fields are automatically matched regardless of name.
        source = self.source.fields
        target = self.target.fields
        source_fields = [source.global_id, source.creator, source.created_at, source.editor, source.edited_at]
        target_fields = [target.global_id, target.creator, target.created_at, target.editor, target.edited_at]
        for a, b in zip(source_fields, target_fields):
            if a and b:
                target.get(b).add_match(source=source.get(a))

        # Auto match shape fields. We check shapeType later.
        if target_shape := target.get(target.shape):
            target_shape.add_match(source=source.get(source.shape))

    def _match_by_domain(self):
        from .string_matching import create_score_matrix

        if self._domains is None:
            return

        # Fields must be editable to load data into them and have a domain in order to match.
        if not (
            target_fields := {
                f.name: f
                for f in self.target.fields.with_domains(editable_only=True)
                if f.name.casefold() not in self.match_info.block_always
            }
        ):
            return
        if not (source_fields := {f.name: f for f in self.source.fields.with_domains()}):
            return

        # Remove any domain pairs that do not match at all
        domains = self._domains.replace({0: np.NaN}).dropna(axis=0, how="all").dropna(axis=1, how="all")
        if domains.empty:
            return

        # Summing along each axis will give a total score for each source and target domain.
        # The similarity between domain names will be used as a tiebreaker.
        sum_score = domains.groupby(axis=0, level="domain").sum().groupby(axis=1, level="domain").sum()
        name_score = create_score_matrix(sum_score.index, sum_score.columns, string_match=True)
        total_score = self._apply_mapping(sum_score + name_score, target_fields, source_fields)

        while not total_score.empty:
            indexes, columns = self._create_matches(total_score, target_fields, source_fields, domains)
            if not indexes or not columns:
                break
            total_score.drop(index=indexes, columns=columns, inplace=True)

    @staticmethod
    def _create_matches(
        df: pd.DataFrame, targets: dict[str, "FieldWrapper"], sources: dict[str, "FieldWrapper"], domains: pd.DataFrame
    ) -> tuple[list, list]:
        """add field matches for best domains available"""
        index, column = [], []
        # For each target domain, find the best source domain.
        # axis = 0 prioritizes getting a match for every target domain
        for target_name, source_name in df.idxmax(axis=0).dropna().items():
            target, source = targets[target_name], sources[source_name]
            if target._match:
                continue
            # It is not typical to match the same source field to multiple targets.
            if source_name in index:
                continue
            # do not force match two domains that have no description matches
            if not (lookup := dict(domains.loc[(source.domain.name,), (target.domain.name,)].idxmax(axis=1).dropna())):
                continue
            target.add_match(source, lookup)
            index.append(source_name)
            column.append(target_name)

        return index, column

    def _apply_mapping(
        self,
        total: pd.DataFrame,
        target_fields_editable: dict[str:"FieldWrapper"],
        source_fields: dict[str:"FieldWrapper"],
    ):
        """reassign index, column to field names (from domain names) and apply field mapping to scores"""

        target_field_names, target_dom_names = zip(
            *((n, f.domain.name) for n, f in target_fields_editable.items() if f.domain.name in total.columns)
        )
        total = total[list(target_dom_names)]
        total.columns = target_field_names

        source_field_names, source_dom_names = zip(
            *((n, f.domain.name) for n, f in source_fields.items() if f.domain.name in total.index)
        )
        total = total.loc[list(source_dom_names)]
        total.index = source_field_names

        # override scores with field mapping
        if not self._has_lookups:
            return total
        override = _create_lookup_matrix(
            source_field_names,
            target_field_names,
            lookup=self.match_info.get_field_mapping(),
            block=self.match_info.get_field_block(),
            lookup_exact=self.match_info.get_field_mapping_exact(),
            block_exact=self.match_info.get_field_block_exact(),
        )
        total.mask(cond=(override == 255), other=float("nan"), inplace=True)
        # A value of 100 indicates a positive in check but not exact match. 101 indicates exact match.
        total.mask(cond=((override == 100) | (override == 101)), other=1e10, inplace=True)
        # if 1e10 exists in row set all other values to nan
        mask = total == 1e10
        total[~mask[mask.any(axis=1)]] = float("nan")
        return total

    @staticmethod
    def _get_field_names(fields, no_domains: bool = True, block_always: set[str] | None = None):
        """extract names from FieldCollection. Lower casing here will not matter for matching."""
        for field in fields:
            if block_always and field.name.casefold() in block_always:
                continue
            if not no_domains:
                yield field.name.casefold()
            elif field.domain is None:
                yield field.name.casefold()
            elif field.domain.domainType == "Range":
                yield field.name.casefold()

    def _force_fields_from_exact_lookup(self):
        """If 'Exact Match' field mapping provided then force fields with domains to match without lookup. If there was
        a viable lookup then there should be a match created already anyway."""
        if not (mapping_exact := self.match_info.get_field_mapping_exact()):
            return
        from .string_matching import create_score_matrix

        source_fields = {x.name.casefold() for x in self.source.fields.with_domains()}
        target_fields = {
            x_lower
            for x in self.target.fields.with_domains(editable_only=True)
            if (x_lower := x.name.casefold()) not in self.match_info.block_always
        }
        columns = target_fields - source_fields
        index = source_fields - target_fields

        if not columns or not index:
            return

        df = create_score_matrix(
            index,
            columns,
            string_match=False,
            lookup_exact=mapping_exact,
            block_exact=self.match_info.get_field_block_exact(),
        ).replace({0: np.NaN})
        if df.empty:
            return
        best = df.idxmax(axis="index").dropna()
        self._add_matches(best)

    def _match_by_name(self):
        from .string_matching import create_score_matrix

        # Matching fields with domains blindly by name is not a good idea. We will only attempt to match fields by name
        # if user does not select the Domain Matching parameter because in that case we are not comparing domains.
        index = sorted(self._get_field_names(self.source.fields, self._domain_match_on))
        columns = sorted(
            self._get_field_names(
                [f for f in self.target.fields if f.editable], self._domain_match_on, self.match_info.block_always
            )
        )

        # source shape field should not be used for mapping
        if (shp := self.source.fields.shape.casefold()) in index:
            index.remove(shp)

        # Match identical field names if String Matching option unchecked. Identical fields with domains will be matched
        # if Domain Similarity is unchecked. If predefined mapping is not provided, we don't need a score matrix.
        if not self._string_match_on:
            if not self._has_lookups:
                matches = set(index).intersection(columns)
                self._add_matches(dict(zip(matches, matches)))
                return

        # force fields with domains to match if Exact Match entry found
        if self._domain_match_on:
            self._force_fields_from_exact_lookup()

        df = create_score_matrix(
            index,
            columns,
            string_match=self._string_match_on,
            cutoff=75,
            lookup=self.match_info.get_field_mapping(),
            block=self.match_info.get_field_block(),
            lookup_exact=self.match_info.get_field_mapping_exact(),
            block_exact=self.match_info.get_field_block_exact(),
        ).replace({0: np.NaN})
        if df.empty:
            return
        # Axis 0 finds the best source for each target. The inverse would potentially not work because two sources
        # might map to the same target field.
        best = df.idxmax(axis="index").dropna()
        self._add_matches(best)

        # even if MATCH_FIELDS is off we still match exact field matches here. It will not overwrite existing matches.
        # if MATCH_FIELDS is on, the matches will already be there.
        if not self._string_match_on:
            matches = set(index).intersection(columns)
            exact_block = {a for a, b in self.match_info.get_field_block_exact() if a == b}
            matches -= exact_block
            self._add_matches(dict(zip(matches, matches)))

    def _match_guid(self):
        """autofill non-nullable target Guid fields with create_guid func"""
        for f in self.target.fields:
            if f.type == "Guid" and not f.is_nullable:
                f.add_match("create_guid()")

    def _add_matches(self, best):
        for target_field, source_field in best.items():
            self.target.fields.get(target_field).add_match(source=self.source.fields.get(source_field))

    def match_fields(self):
        # The order here is from highest confidence to lowest.
        self._match_subtype()
        self._match_system_fields()
        self._match_by_domain()
        self._match_by_name()
        self._match_guid()


class ClassMatch:
    def __init__(self, source: str, target: str, explode_subtypes: bool = True, match_library: "MatchLibrary" = None):
        self.source = source
        self.target = target
        self.explode_subtypes = explode_subtypes
        self.library = match_library
        self.cutoff = 75

    @staticmethod
    def _walk_url(path: str):
        """Custom walk for URLs"""
        # Walk does not support FeatureServices and normal describe does not return the layer IDs
        for child in arcpy.da.Describe(path).get("children", []):
            if child["dataType"] not in ("Table", "FeatureClass"):
                continue

            # When the child's name looks like a layer ID, we use that.
            try:
                int(child["file"])
            except ValueError:
                continue

            yield f"{path}/{child['file']}"

    @staticmethod
    def _walk(path: str):
        logger.debug(f"Walking {path}")

        desc = helper.describe_object(path)
        if desc.dataType not in ("Workspace", "FeatureDataset", "CadDrawingDataset"):
            # do not block Attachment tables here, user explicitly matched them
            yield path
            return

        if getattr(desc, "workspaceFactoryProgID", "").startswith(
            "esriDataSourcesGDB.FeatureServiceDBWorkspaceFactory"
        ):
            yield from ClassMatch._walk_url(path)

        for dirpath, dirname, filenames in arcpy.da.Walk(path, datatype=["Table", "FeatureClass"]):
            for file in filenames:
                # skip Attachment tables
                if file.split(".")[-1].casefold() in helper.get_attachment_tables(path):
                    continue
                yield helper.join_path(path, file.split(".")[-1])

    @staticmethod
    @helper.lru_cache()
    def _extract_children(path, get_subtypes: bool = True) -> list["helper.TableWrapper"]:
        # Walking is a fairly quick operation (compared to describe) and this gives us a total for the progressor.
        paths = list(ClassMatch._walk(path))
        arcpy.SetProgressor(type="STEP", message="Describing...", min_range=0, max_range=len(paths))
        children = []

        for child in paths:
            name = os.path.basename(child).split(".")[-1]
            logger.debug(f"\t{name}")

            # If the table has subtypes, we create a virtual table that has domains/defaults from the subtype.
            subtypes = [None]
            if get_subtypes:
                subtypes = helper.get_subtypes(child) or [None]
            for code in subtypes:
                children.append(helper.TableWrapper(child, subtype_code=code))

            arcpy.SetProgressorPosition()
            arcpy.SetProgressorLabel(f"Describing {name}")

        return children

    def get_tables_by_shape(self, workspace: str) -> dict[str, list[helper.TableWrapper]]:
        data = {}
        for target_child in self._extract_children(path=workspace, get_subtypes=self.explode_subtypes):
            data.setdefault(target_child.shape_type, []).append(target_child)

        return data

    def get_tables(self, workspace: str) -> list[helper.TableWrapper]:
        data = []
        for child in self._extract_children(path=workspace, get_subtypes=self.explode_subtypes):
            data.append(child)

        return data

    def _extract_domains(self, workspace: str, editable_only: bool = False):
        for child in self._extract_children(path=workspace, get_subtypes=self.explode_subtypes):
            # The same domain can be repeated across fields -- we only need 1 instance
            seen_domains = set()
            for field in child.fields.with_domains(editable_only):
                domain = field.domain.name
                if domain in seen_domains:
                    continue
                seen_domains.add(domain)
                # Domain descriptions can be duplicated, so we only need to yield one of them.
                seen_values = set()
                for value in field.domain.codedValues.values():
                    if value.lower() in seen_values:
                        continue
                    yield child.shape_type, child.name_key, domain, value
                    seen_values.add(value.lower())

    def create_domain_matrix(self) -> pd.DataFrame:
        from .string_matching import create_score_matrix

        # Create a hierarchical index for each side and extract the 2nd level for calculating ratios.
        names = ("type", "name", "domain", "values")
        index = pd.MultiIndex.from_tuples(sorted(self._extract_domains(self.source)), names=names)
        columns = pd.MultiIndex.from_tuples(sorted(self._extract_domains(self.target, editable_only=True)), names=names)

        if index.empty or columns.empty:
            return pd.DataFrame()

        # We only need to compute ratios between unique pairs of terms.
        # levels are the unique values in the MultiIndex and codes are the pointers to their position in the index.
        unique = index.levels[-1], columns.levels[-1]
        pointers = index.codes[-1], columns.codes[-1]

        logger.debug("Matching terms....")
        arr = create_score_matrix(
            *unique,
            string_match=self.library.match_values,
            cutoff=self.cutoff,
            lookup=self.library.get_value_mapping(),
            block=self.library.get_value_block(),
            lookup_exact=self.library.get_value_mapping_exact(),
            block_exact=self.library.get_value_block_exact(),
        )
        logger.debug(f"\tDone")
        if arr.empty:
            return pd.DataFrame()

        df = pd.DataFrame(arr.values[np.ix_(*pointers)], index=index, columns=columns)
        return df

    def _match_class(
        self, sources: list[helper.TableWrapper], targets: list[helper.TableWrapper]
    ) -> Generator[tuple[helper.TableWrapper], None, None]:
        from .string_matching import create_score_matrix

        mapping = self.library.get_dataset_mapping()
        blocking = self.library.get_dataset_block()
        mapping_exact = self.library.get_dataset_mapping_exact()
        blocking_exact = self.library.get_dataset_block_exact()

        matrix = create_score_matrix(
            index_values=[x.key for x in sources],
            column_values=[x.key for x in targets],
            cutoff=self.cutoff,
            lookup=mapping,
            block=blocking,
            lookup_exact=mapping_exact,
            block_exact=blocking_exact,
        )

        # Drop non-matches and use original table wrappers as headers.
        matrix.index = sources
        matrix.columns = targets
        matrix: pd.DataFrame = matrix.replace({0: np.NaN}).dropna(axis=0, how="all").dropna(axis=1, how="all")

        # In the case where the source and target are both tabular, and nothing was auto-matched, we need to force
        # the match so a workbook can be created.
        if matrix.empty:
            if helper.Validator(self.source)._is_tabular() and helper.Validator(self.target)._is_tabular():
                yield sources[0], targets[0]
            # TODO: should provide better warning here to indicate Workspaces were used?
            return

        for index, rows in matrix.iterrows():
            for row in rows.dropna().index:
                yield index, row

    def match_classes(self):
        # If source and target are both not a container, we don't care about shape type for matching. Validation will
        # block FCs with differing shape types and Table -> FC. FC -> Table will now be allowed.
        if helper.Validator(self.source)._is_tabular() and helper.Validator(self.target)._is_tabular():
            yield from self._match_class(list(self.get_tables(self.source)), list(self.get_tables(self.target)))
            return

        source = self.get_tables_by_shape(self.source)
        target = self.get_tables_by_shape(self.target)

        logger.debug("Matching classes...")
        for shape_type, source_children in source.items():
            target_children = target.get(shape_type, [])
            if not target_children:
                continue

            logger.debug(f"\t{shape_type}")
            yield from self._match_class(source_children, target_children)

    def main(self):
        domains = self.create_domain_matrix()
        for source, target in self.match_classes():
            try:
                assigned_domains = domains.loc[
                    (source.shape_type, source.name_key), (target.shape_type, target.name_key)
                ]
            except KeyError:
                # Not all sources/target have domains assigned (or even support them).
                assigned_domains = None

            f = TableMatch(
                source,
                target,
                domains=assigned_domains,
                match_info=self.library,
            )
            yield f


class MatchLibrary:
    """Utility class for loading known matches and user specified ones"""

    # Expected fields
    TYPE = "type"
    FROM = "SubstringsA".lower()
    TO = "SubstringsB".lower()
    MATCH = "match_strings"

    # Supported types
    DATASET = "dataset"
    FIELD = "field"
    VALUE = "value"
    SUPPORTED = (DATASET, FIELD, VALUE)

    # Supported match_strings field settings
    NO = "no"
    YES = "yes"
    EXACT_NO = "exact_block"
    EXACT_YES = "exact_match"
    SUPPORTED_MATCH = (NO, YES, EXACT_NO, EXACT_YES)

    def __init__(self, match_datasets: bool = True, match_fields: bool = True, match_values: bool = True):
        self.mapping = {}
        self.block = {}
        self.mapping_exact = {}
        self.block_exact = {}
        self.block_always = set()
        self.match_datasets = match_datasets
        self.match_fields = match_fields
        self.match_values = match_values

    def get_dataset_mapping(self) -> set:
        return self.mapping.get(self.DATASET, set())

    def get_dataset_mapping_exact(self) -> set:
        return self.mapping_exact.get(self.DATASET, set())

    def get_value_mapping(self) -> set:
        return self.mapping.get(self.VALUE, set())

    def get_value_mapping_exact(self) -> set:
        return self.mapping_exact.get(self.VALUE, set())

    def get_field_mapping(self) -> set:
        return self.mapping.get(self.FIELD, set())

    def get_field_mapping_exact(self) -> set:
        return self.mapping_exact.get(self.FIELD, set())

    def get_dataset_block(self) -> set:
        return self.block.get(self.DATASET, set())

    def get_dataset_block_exact(self) -> set:
        return self.block_exact.get(self.DATASET, set())

    def get_value_block(self) -> set:
        return self.block.get(self.VALUE, set())

    def get_value_block_exact(self) -> set:
        return self.block_exact.get(self.VALUE, set())

    def get_field_block(self) -> set:
        return self.block.get(self.FIELD, set())

    def get_field_block_exact(self) -> set:
        return self.block_exact.get(self.FIELD, set())

    @classmethod
    def _validate(cls, df: pd.DataFrame) -> pd.DataFrame:
        """Removes invalid rows from DataFrame"""
        match: str = cls.MATCH
        exact_no: str = cls.EXACT_NO
        _type: str = cls.TYPE
        field: str = cls.FIELD
        suba: str = cls.FROM
        subb: str = cls.TO

        # Remove invalid rows
        # block_rows is special mask to allow only one substring value for an exact_block row
        block_rows = (df[_type] == field) & (df[match] == exact_no) & (df[[suba, subb]].notnull().any(axis=1))
        null_mask = ~block_rows & df.isnull().any(axis=1)
        unsupported_mask = ~df[_type].isin(cls.SUPPORTED)
        unsupported_mask2 = ~df[match].isin(cls.SUPPORTED_MATCH)
        combined = null_mask | unsupported_mask | unsupported_mask2
        total = combined.sum()
        if total:
            # Skipping %1 invalid rows in Mapping Table parameter.
            arcpy.AddIDMessage(MsgType.WRN, 3807, f"{total:,}")
            df = df[~combined]

        return df

    @staticmethod
    def _read_table(table) -> Optional[pd.DataFrame]:
        # Required fields are present
        expected = [MatchLibrary.TYPE, MatchLibrary.FROM, MatchLibrary.TO]
        actual = {f.name.lower() for f in arcpy.ListFields(table)}
        if missing := (set(expected) - actual):
            # Table %1 is missing required fields %2
            arcpy.AddIDMessage(MsgType.WRN, 3806, table, missing)
            return

        # Read in optional fields if present
        if MatchLibrary.MATCH in actual:
            expected.append(MatchLibrary.MATCH)

        # Read table and cleanup records
        with arcpy.da.SearchCursor(table, expected) as cursor:
            df: pd.DataFrame = pd.DataFrame.from_records(cursor, columns=expected)
            df = df.apply(lambda f: f.str.strip().str.lower()).replace({"": None})
            if df.empty:
                return
            logger.debug(f"\tRead {len(df):,} rows")
        del cursor

        # Default optional fields if not provided
        if MatchLibrary.MATCH not in actual:
            df[MatchLibrary.MATCH] = MatchLibrary.EXACT_YES

        return MatchLibrary._validate(df)

    def load(self, thing):
        if thing is None:
            return

        logger.debug(f"Processing {thing}")
        if arcpy.Exists(thing):
            path = thing
        else:
            # "%s does not exist"
            arcpy.AddIDMessage(MsgType.WRN, 110, thing)
            return

        df = self._read_table(path)
        if df is None:
            return

        mapping = self.mapping
        block = self.block
        for row, *pair, match_strings in df.itertuples(index=False, name=None):
            if match_strings == MatchLibrary.YES:
                mapping.setdefault(row, set()).add(tuple(pair))
            elif match_strings == MatchLibrary.NO:
                block.setdefault(row, set()).add(tuple(pair))
            elif match_strings == MatchLibrary.EXACT_YES:
                self.mapping_exact.setdefault(row, set()).add(tuple(pair))
            elif match_strings == MatchLibrary.EXACT_NO:
                if None in pair:
                    self.block_always.add((pair[0] or pair[1]).casefold())
                else:
                    self.block_exact.setdefault(row, set()).add(tuple(pair))


class WorkspaceToMappingFile:
    """Creates a mapping file based on existing workspaces"""

    MATCH_YES = MatchLibrary.EXACT_YES

    def __init__(self, mapping_workbook: str):
        self.mapping_workbook = mapping_workbook

        self.payload = []

    def collect(self):
        wb = WorkbookWrapper(self.mapping_workbook, on_error="raise")
        cols = [SOURCE, DEFINITION_QUERY, TARGET, MAPPING_WORKBOOK]
        df = wb.sheet_to_df(SOURCE_TARGET, columns=cols)

        folder = pathlib.Path(self.mapping_workbook).parent

        logger.debug("Walking reference workbook")
        arcpy.SetProgressor(type="STEP", message="Processing worksheets", min_range=0, max_range=len(df))
        for (
            source,
            source_defquery,
            target,
            workbook,
        ) in df.itertuples(index=False):
            arcpy.SetProgressorPosition()
            arcpy.SetProgressorLabel(os.path.splitext(os.path.basename(workbook))[0])
            not_exist = 0
            for dataset in (source, target):
                if not helper.does_exist(dataset):
                    # %s does not exist
                    arcpy.AddIDMessage(MsgType.WRN, 110, dataset)
                    not_exist += 1
            if not_exist:
                continue

            source_stcode = self._get_source_subtype_code(source, source_defquery)
            source = self._table_wrapper(source, source_stcode)

            # Mapping workbook is stored with a relative path to the reference workbook.
            logger.debug(f"\t{workbook}")
            yield source, target, folder / workbook

    def _parse_expression(self, field: str, expression: str):
        """Parser when expression is chosen"""

        if expression.startswith("!") and expression.endswith("!"):
            # Straight field mapping
            source = expression[1:-1]
            self.payload.append([MatchLibrary.FIELD, source, field, self.MATCH_YES])

    def _get_coded_values(self, table: TableWrapper, field_name: str) -> dict:
        """get all coded values for a field across subtypes and at the root"""
        field_name = field_name.lower()
        root_table = self._table_wrapper(table.path)
        if (field := root_table.fields.get(field_name)) is None:
            return {}

        # If the field is the subtype field, we use the subtypes as lookup.
        if table.subtype_name.casefold() == field_name.casefold():
            subtypes = helper.get_subtypes(table.path)
            return {k: v["Name"] for k, v in subtypes.items()}

        # Otherwise, look at the domains assigned to this field across all subtypes and at the root.
        lookup = {}
        for domain, st in table.get_all_domains(field_name).domains_and_subtypes:
            lookup |= domain.codedValues
        # Merge dictionaries so that root wins out if there are conflicting keys.
        if field.domain:
            lookup |= field.domain.codedValues

        return lookup

    @staticmethod
    def _get_source_subtype_code(table: str, sql: Optional[str]) -> Optional[int]:
        """return subtype code from expression if referencing the subtype field"""
        if not sql or "=" not in sql:
            return
        field, code = tuple(map(str.strip, sql.split("=", 1)))
        if helper.subtype_name(helper.describe_object(table)) != field.casefold():
            return
        try:
            return int(code)
        except ValueError:
            return

    @staticmethod
    @helper.lru_cache()
    def _table_wrapper(path: str, subtype: int = None) -> TableWrapper:
        return TableWrapper(path, subtype)

    def _get_target_wrapper(self, target: str, mapping: pd.DataFrame) -> TableWrapper:
        """look for subtype code in subtype field of mapping workbook to create TableWrapper"""
        for field, expression, *_ in mapping.itertuples(index=False):
            if expression is None:
                continue
            if helper.subtype_name(helper.describe_object(target)) != field.casefold():
                continue
            try:
                subtype_code = int(expression)
            except ValueError:
                break
            return self._table_wrapper(target, subtype_code)
        return self._table_wrapper(target)

    def _parse_lookup(self, source: TableWrapper, target: TableWrapper, sheet: pd.Series):
        """Parser when lookup is chosen"""

        source_lookup = self._get_coded_values(source, sheet.index.name)
        target_lookup = self._get_coded_values(target, str(sheet.name))
        if not source_lookup or not target_lookup:
            return

        for k, v in sheet.items():
            source_descript = source_lookup.get(k)
            target_descript = target_lookup.get(v)
            if source_descript is None or target_descript is None:
                continue

            self.payload.append([MatchLibrary.VALUE, source_descript, target_descript, self.MATCH_YES])

    @staticmethod
    def _payload_to_df(payload: list[str, str, str, str]) -> pd.DataFrame:
        """Matching is case insensitive, so we lowercase everything for the duplicate check but keep original. If
        source/target are identical, no need to include. This creates a "nicer" looking CSV."""
        df = pd.DataFrame(payload, columns=[MatchLibrary.TYPE, MatchLibrary.FROM, MatchLibrary.TO, MatchLibrary.MATCH])
        lower: pd.DataFrame = df.apply(lambda f: f.str.lower(), axis=1)
        duplicate_mask = lower.duplicated()
        same_mask = lower[MatchLibrary.FROM] == lower[MatchLibrary.TO]

        df = df[~(duplicate_mask | same_mask)].sort_values(list(df)).reset_index(drop=True)
        df.index += 1
        return df

    def parse(self, source: TableWrapper, target: str, workbook: str):
        wb = WorkbookWrapper(workbook, on_error="raise")
        global_workbook = WorkbookLoader.get_global_workbook(workbook)
        mapping_name = "Mapping" if "Mapping" in wb.wb else MAPPING
        mapping = wb.sheet_to_df(
            mapping_name, columns=WorkbookLoader.MAPPING_HEADER[:-1], optional_columns=[LOOKUP_DEFAULT]
        )
        mapping = mapping[mapping[TARGET_FIELD].notnull()]

        # create dataset match between source and target, and account for subtypes on either if they exist
        target: TableWrapper = self._get_target_wrapper(target, mapping)
        self.payload.append(
            [
                MatchLibrary.DATASET,
                source.subtype_name or source.name,
                target.subtype_name or target.name,
                self.MATCH_YES,
            ]
        )

        for field, expression, sheet, keys, value, default in mapping.itertuples(index=False):
            if expression is not None:
                self._parse_expression(field, str(expression))
            elif sheet is not None:
                sheet = str(sheet).strip()
                if helper.is_global_sheet(sheet, global_workbook):
                    sheet = sheet[1:-1]
                    book = global_workbook
                else:
                    book = wb
                # Keys can reference multiple columns as a comma delimited list.
                keys = [k.strip() for k in keys.split(",")]
                lookup_df = book.sheet_to_df(sheet, columns=[*keys, value])
                # The index is the source fields and the name is the target field
                lookup_df = lookup_df.set_index(keys)[value]
                lookup_df.name = field
                self._parse_lookup(source, target, lookup_df)

    def main(self, output_table: str):
        """Convert the workbook to JSON, saving to a new file"""

        for source, target, workbook in self.collect():
            self.parse(source, target, workbook)

        if not self.payload:
            return

        df = self._payload_to_df(self.payload)

        # Work around for InsertCursor
        if os.path.exists(output_table) and output_table.casefold().endswith(".csv"):
            df.to_csv(output_table, header=False, mode="a", encoding="utf-8")

            return

        with arcpy.da.InsertCursor(output_table, df.columns.tolist()) as cursor:
            for row in df.itertuples(index=False, name=None):
                cursor.insertRow(row)
        del cursor
