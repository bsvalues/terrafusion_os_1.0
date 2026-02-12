"""Utility module for JoinFeatures tool."""
# noqa. pylint: disable=import-error
import os
from typing import Any, Dict, Optional, List, Tuple, Union
from datetime import datetime, time
import uuid
import collections

import numpy
import arcpy
import arcpy.management
import arcpy.analysis
from arcpy.da import SearchCursor, InsertCursor  # type: ignore

from common import (FieldUtils, PALayerUtils, LogUtils,
                    PAOutputFeatureLayer, PAFeatureLayer,
                    ToolExit, ImmutableDict, LogExecutionTime,
                    NpDataOpMixin, RegStatsObject,
                    IntermCleanMixin, CALFIELD_PY_METHOD,
                    AOLUtils, ToolExit)


LOGGER = LogUtils.setup_logger(__name__)

SHAPE_FIELDS = ["shape_area", "shape_length", "st_area_shape_", "st_length_shape_"]
SPATIAL_RELATIONSHIP = ImmutableDict({"intersects": "INTERSECT",
                                      "withindistance": "WITHIN_A_DISTANCE",
                                      "contains": "CONTAINS_CLEMENTINI",
                                      "completelycontains": "COMPLETELY_CONTAINS",
                                      "completelywithin": "COMPLETELY_WITHIN",
                                      "within": "WITHIN_CLEMENTINI",
                                      "identicalto": "ARE_IDENTICAL_TO"})

R2K_RULE = collections.namedtuple("R2K_RULE", "name index order")
SRC_OID_KEY = "source oid fields"
TARGET_OID_KEY = "target_layer_oid"
JOIN_OID_KEY = "join_layer_oid"
STATS_COUNT_KEY = "stats_count_field"
STATS_TYPE_KEY = "statisticType"
STATS_FN_KEY = "onStatisticField"
SHP_RES_FNAMES = ["SHAPE_Length", "SHAPE_Area"]
JOIN_RESULT_TYPE = Union[arcpy._mp.Table, arcpy._mp.Layer]  # type: ignore


class JFUtils:
    """Class module with JoinFeatures related utility functions."""

    @staticmethod
    def preprocess_input(
        layer: PAFeatureLayer,
        layer_param_name: str,
        attribute_rel_fields: Optional[List],
        target_layer: bool
    ) -> PAFeatureLayer:
        """Due to the change of globalid field in AO11 which makes the join with
        globalid failed, this function is going to replace the globalid field
        to other types (i.e., Guid).

        Args:
            layer: name of the feature layer.
            layer_param_name: name of the layer parameter.
            attribute_rel_fields: a list with field attribute relationships.
            target_layer: True if the input is the targetLayer and False means
            the input is the joinLayer.
        Returns:
            A PAFeatureLayer object.
        Raises:
            AO_100032 if # of features is 0.

        """
        if not layer.is_table_view and layer.count == 0:
            LOGGER.debug(100032, extra={"message_ID": 100032, "analysisLayer": layer.layer_name})
            raise ToolExit

        with arcpy.EnvManager(preserveGlobalIds=True):
            tmp_layer_path = AOLUtils.create_unique_name(layer_param_name, AOLUtils.get_scratch_wkspc())
            tmp_layer = PALayerUtils.make_local_copy(layer, tmp_layer_path, True, False)
        return tmp_layer

    @staticmethod
    def get_field_index_by_name(
        field_names: List,
        field_name: str
    ) -> Optional[int]:
        """Get the index of a field from a list of fields."""
        for i, fname in enumerate(field_names):
            if fname.lower() == field_name.lower():
                return i
        return None

    @staticmethod
    def get_output_fieldtype(
        fields: List,
        stat_field_name: str,
        stat_type: str
    ) -> str:
        """Get the type of the output statistics field.

        Args:
            fields: a list of Field.
            stat_field_name: name of field to calculate statistics.
            stat_type: type of stats.
        Returns:
            A string indicate the type of the output field.
        Exceptions:
            No field named <stat_field_name> is raised.

        """
        for field in fields:
            if field.name.lower() == stat_field_name.lower():
                if field.type == "Date":
                    return "DATE"
                elif stat_type.capitalize() in ["Stddev", "Mean", "Std", "Sum"]:
                    return "DOUBLE"
                elif stat_type.lower() == "count":
                    return "Integer"
                else:
                    return field.type

        LOGGER.error('No field named {}.'.format(stat_field_name))
        raise ToolExit

    @staticmethod
    def get_summary_stats(
        summary_fields: List,
        field_data: Dict,
        field_null_vals: Dict
    ) -> List:
        """Calculate the statistics of each field.

        Args:
            summary_fields: a list of summary information (field name, stats of interest).
            field_data: a dictionary keyed by the field name and valued by a numpy array.
            field_null_vals: a dictionary keyed by the field name and valued by the null value to exclude from stats
            calculation.
        Returns:
            a list of the statistics of each column.
        Exceptions:
            No Exception.

        """
        new_row = []
        for field_info in summary_fields:
            field_name = field_info.get(STATS_FN_KEY)
            stats = field_info.get(STATS_TYPE_KEY)
            if stats.lower() == "stddev":
                stats = "std"
            field_arr = field_data[field_name]
            default_null = NpDataOpMixin.get_null_val_by_name(field_null_vals, field_name)
            stat_val = NpDataOpMixin.get_stat(field_arr, stats, default_null)
            if isinstance(stat_val, numpy.datetime64):
                stat_val = stat_val.astype(datetime)
            elif isinstance(stat_val, numpy.timedelta64):
                stat_val = stat_val.astype(time)
            new_row.append(stat_val)

        return new_row

    @staticmethod
    def get_record_match_rule(
        fields: List,
        rule: Optional[Dict]
    ) -> R2K_RULE:
        """Get the record match rule based on user's input.

        Args:
            fields: a list of field names where the target field index is going to
            be searched from.
            rule: A json with the rule defined by user. For example:
            {"groupByFields":"","orderByFields":"OBJECTID ASC","topCount":1} or
            {"groupByFields":"","orderByFields":"Value DESC","topCount":1}.
        Returns:
            A named tuple (R2K_RULE) that contains the field name, field index,
            and order.
        Raises:
            AO_100055 if rule is not None but also not a json.
            ToolExit if no field were found from the PAFeatureLayer.

        """
        if rule is None:
            return R2K_RULE(None, None, "ASC")

        if not isinstance(rule, dict) or "orderByFields" not in rule:
            LOGGER.error(100055, extra={"message_ID": 100055})
            raise ToolExit

        # "OBJECTID ASC" means first appearance
        if rule.get("orderByFields", "").upper() == "OBJECTID ASC":
            return R2K_RULE(None, None, "ASC")
        else:
            order_by_fields = rule["orderByFields"]
            (field_name, order) = order_by_fields.strip().split(" ")
            if order.upper() not in ["ASC", "DESC"]:
                LOGGER.error("Fields order can only be ASC or DESC.")
                raise ValueError
            field_index = JFUtils.get_field_index_by_name(fields, field_name)
            if field_index:
                return R2K_RULE(field_name, field_index, order.upper())
            else:
                LOGGER.debug("Can't find a field named {} from layer.".format(field_name))
                return R2K_RULE(None, None, "ASC")

    @staticmethod
    def get_row_to_keep(
        rows: List,
        field_value_index: List,
        rule_to_keep: R2K_RULE,
    ) -> Any:
        """Find a row from a list of matched rows based on the rule_to_keep."""
        if len(rows) == 1:
            value_row = tuple(rows[0][index] for index in field_value_index)
            return value_row

        findex = rule_to_keep.index
        fname = rule_to_keep.name
        order = rule_to_keep.order

        # If the first item of rule_to_keep is None that means the record to keep
        # rule is the first appearance
        if fname is None:
            return tuple(rows[0][index] for index in field_value_index)
        elif findex == 0 and order == "ASC":
            return tuple(rows[0][index] for index in field_value_index)
        else:
            tmp_val = rows[0][findex]
            row_to_keep = rows[0]
            for tmp_row in rows:
                if tmp_val is None and tmp_row[findex] is not None:
                    tmp_val = tmp_row[findex]
                    row_to_keep = tmp_row
                elif tmp_row[findex] is None:
                    continue
                elif tmp_row[findex] > tmp_val and order == "DESC":
                    tmp_val = tmp_row[findex]
                    row_to_keep = tmp_row
                elif tmp_row[findex] < tmp_val and order == "ASC":
                    tmp_val = tmp_row[findex]
                    row_to_keep = tmp_row
            return tuple(row_to_keep[index] for index in field_value_index)

    @staticmethod
    def match_by_attrs(
        target_layer: PAFeatureLayer,
        join_layer: PAFeatureLayer,
        target_rel_fields: List,
        join_rel_fields: List,
        spatial_rel: Optional[str] = None,
        search_radius: Optional[str] = None
    ) -> Dict:
        """Match the target_layer and join_layer based on attribute values.

        Args:
            target_layer: an instance of PAFeatureLayer where the data is treated
            as the left table in joining.
            join_layer: an instance of PAFeatureLayer where the data is treated
            as the right table in joining.
            target_rel_fields: a list of fields from target_layer where the
            attribute match is built upon.
            join_rel_fields: a list of fields from join_layer where the attribute
            match is built upon.
        Returns:
            A dictionay where each item is keyed by the target OID and
            valued by a list of join OID that match the target based on attributes.

        """
        matched_ids = {}
        target_new_fields = [target_layer.OIDFieldName] + target_rel_fields
        join_new_fields = [join_layer.OIDFieldName] + join_rel_fields

        target_field_types = FieldUtils.get_fields_types(target_rel_fields, target_layer.fields)
        join_field_types = FieldUtils.get_fields_types(join_rel_fields, join_layer.fields)
        (target_field_parser, join_field_parser) = JFUtils.get_field_match_parser(target_field_types,
                                                                                  join_field_types)

        target_data = target_layer.data if target_layer.is_table_view else target_layer.layer

        target_lookup_values = {}
        with SearchCursor(target_data, target_new_fields) as target_cursor:
            for t_row in target_cursor:
                t_oid = t_row[0]
                t_vals = t_row[1::]
                nt_vals = JFUtils.parse_field_value(t_vals, target_field_parser)
                if nt_vals in target_lookup_values:
                    target_lookup_values[nt_vals] += [t_oid]
                else:
                    target_lookup_values[nt_vals] = [t_oid]

        join_data = join_layer.data if join_layer.is_table_view else join_layer.layer
        join_lookup_values = {}
        with SearchCursor(join_data, join_new_fields) as join_cursor:
            for j_row in join_cursor:
                j_oid = j_row[0]
                j_vals = j_row[1::]
                nj_vals = JFUtils.parse_field_value(j_vals, join_field_parser)
                if nj_vals in join_lookup_values:
                    join_lookup_values[nj_vals] += [j_oid]
                else:
                    join_lookup_values[nj_vals] = [j_oid]

        for t_val in target_lookup_values:
            t_oids = target_lookup_values[t_val]
            for j_val in join_lookup_values:
                if t_val == j_val:
                    for toid in t_oids:
                        matched_ids[toid] = join_lookup_values[j_val]

        # Update the spatial selection to update matched_ids
        if spatial_rel:
            tmp_output = AOLUtils.create_unique_name("sjMatchID", "scratchgdb")

            fields_of_interests = ["TARGET_FID", "JOIN_FID"]

            fs_mappings = arcpy.FieldMappings()
            fs_mappings.addTable(target_layer.layer)
            fs_mappings.addTable(join_layer.layer)
            # remove the fields of interests
            for foi in fields_of_interests:
                rmfield = fs_mappings.findFieldMapIndex(foi)
                if rmfield != -1:
                    fs_mappings.removeFieldMap(rmfield)
            JFUtils.spatial_join(target_layer, join_layer, tmp_output,
                                 "JOIN_ONE_TO_MANY", "KEEP_COMMON",
                                 fs_mappings, spatial_rel, search_radius)

            spatial_match_ids = {}
            with SearchCursor(tmp_output, fields_of_interests) as scursor:
                for row in scursor:
                    if row[0] not in spatial_match_ids:
                        spatial_match_ids[row[0]] = [row[1]]
                    else:
                        spatial_match_ids[row[0]] += [row[1]]

            for toid in matched_ids:
                if toid in spatial_match_ids:
                    matched_ids[toid] = set(matched_ids[toid]).intersection(set(spatial_match_ids[toid]))
                else:
                    matched_ids[toid] = None

        return matched_ids

    @staticmethod
    def get_join_row(
        join_layer: PAFeatureLayer,
        matched_ids: Dict,
        fields_to_join: List,
        match_rule: str,
        record_to_match: Optional[Dict],
        summary_fields: Optional[List] = None
    ) -> Dict:
        """Pull the row from joinlayer that will be added to the output.

        Args:
            join_layer: an instance of PAFeatureLayer where the rows will be pulled
            from.
            matched_ids: output from match_by_attrs that is keyed by target feature
            OID and valued by the OID of the matched features in the join layer
            (i.e., [{1: [1, 2], 2: [4, 5],...}])
            fields_to_join: a list with field names of the join layer in order in
            the join output.
            match_rule: rule of match (either "JOIN_ONE_TO_MANY" or "JOIN_ONE_TO_ONE").
            record_to_match: a string indicates the rule of match
            summary_fields: a list of fields as well as stats where the summary
            is going to be derived from.
        Returns:
            A dictionary keyed by the OID of the target feature and valued by:
            1) None if no match is found.
            2) a list of rows if rule is JOIN_ONE_TO_MANY and a match is found.
            3) one row if the match can be found and match_rule is JOIN_ONE_TO_ONE.

        """
        join_lookup_values = {}

        fields_to_fetch = [field.name for field in join_layer.fields if field.type != 'Geometry']
        if match_rule == "JOIN_ONE_TO_ONE" and summary_fields is None:
            oto_match_rule = JFUtils.get_record_match_rule(fields_to_fetch, record_to_match)
        else:
            oto_match_rule = None

        join_data = join_layer.data if join_layer.is_table_view else join_layer.layer
        arcpy.management.SelectLayerByAttribute(join_data, "CLEAR_SELECTION")
        with SearchCursor(join_data, fields_to_fetch) as join_cursor:
            for j_row in join_cursor:
                j_oid = j_row[0]
                join_lookup_values[j_oid] = j_row

        row_to_join = {}

        if match_rule == "JOIN_ONE_TO_ONE" and summary_fields:
            # exclude the first item since it is count
            fields_to_join = fields_to_join[1::]

        fields_to_join_index = FieldUtils.get_relative_field_indexes(fields_to_join,
                                                                     fields_to_fetch)
        if summary_fields:
            uniq_fields = list(set(fields_to_join))
            field_null_vals = NpDataOpMixin.get_field_null_val(join_layer, uniq_fields)
            LOGGER.debug(f"field_null_vals: {field_null_vals}")

        for m_id in matched_ids:
            join_oids = matched_ids[m_id]
            if join_oids:
                if match_rule == "JOIN_ONE_TO_MANY":
                    row_to_join[m_id] = []
                    for jid in join_oids:
                        tmp_val_row = join_lookup_values[jid]
                        tmp_row = [tmp_val_row[idx] for idx in fields_to_join_index]
                        row_to_join[m_id].append(tuple(tmp_row))
                elif summary_fields:
                    if fields_to_join:
                        tmp_joids = [str(oid) for oid in join_oids]
                        query = "{} in ({})".format(join_layer.OIDFieldName, ",".join(tmp_joids))
                        try:
                            join_numpy_arr = NpDataOpMixin.load(join_data,
                                                                uniq_fields,  # type: ignore
                                                                query=query,
                                                                null_vals=field_null_vals)  # type: ignore
                            result_stats = JFUtils.get_summary_stats(summary_fields, join_numpy_arr, field_null_vals)  # type: ignore
                        # If a certain field for this selection contains Null value, numpyfn will fail.
                        except TypeError:
                            result_stats = [None for _ in range(len(summary_fields))]
                        row_to_join[m_id] = tuple([len(join_oids)] + result_stats)
                    # If no summary field is defined, keep count only.
                    else:
                        row_to_join[m_id] = tuple([len(join_oids)])
                else:
                    # Find the row based on record_to_match
                    tmp_rows = []
                    for jid in matched_ids[m_id]:
                        tmp_rows.append(join_lookup_values[jid])
                    if oto_match_rule is None:
                        oto_match_rule = R2K_RULE(None, None, "ASC")
                    row_to_join[m_id] = JFUtils.get_row_to_keep(tmp_rows,
                                                                fields_to_join_index,
                                                                oto_match_rule)

        del join_lookup_values
        return row_to_join

    @staticmethod
    def get_field_match_parser(
        target_field_types: List[str],
        join_field_types: List[str]
    ) -> Tuple:
        """Get the proper operation on parsing the field values that is used to match.

        Args:
            target_field_types: a list of string where each item represents the type
            of each field that is used to match in the target layer.
            join_field_types: a list of string where each item represents the type of
            each field that is used to match in the join layer.
        Returns:
            A two item tuple where item #1 is a list of functions to parse the target
            field value and item #2 is a list of functions to parse the join field value.
        Raises:
            RuntimeError if length of target_field_types does not equal to the length
            of the join_field_types.

        """
        if len(target_field_types) != len(join_field_types):
            LOGGER.error("target fields do not equal to the join fields.")
            raise RuntimeError
        target_field_parser = []
        join_field_parser = []
        for tf_type, jf_type in zip(target_field_types, join_field_types):
            if tf_type == "String" and jf_type == "String":
                target_field_parser.append(str.upper)
                join_field_parser.append(str.upper)
            elif tf_type == "Guid" or jf_type == "Guid":
                target_field_parser.append(None)
                join_field_parser.append(None)
            elif tf_type == "String" and jf_type in ["Double", "Single"]:
                target_field_parser.append(float)
                join_field_parser.append(None)
            elif tf_type == "String" and jf_type in ["Integer", "SmallInteger"]:
                target_field_parser.append(int)
                join_field_parser.append(None)
            elif jf_type == "String" and tf_type in ["Double", "Single"]:
                target_field_parser.append(None)
                join_field_parser.append(float)
            elif jf_type == "String" and tf_type in ["Integer", "SmallInteger"]:
                target_field_parser.append(None)
                join_field_parser.append(float)
            else:
                target_field_parser.append(None)
                join_field_parser.append(None)

        return (target_field_parser, join_field_parser)

    @staticmethod
    def parse_field_value(
        field_values: List,
        field_parsers: List
    ) -> Tuple:
        """Parse the field value with a list of functions defined in field parsers."""
        if len(field_values) != len(field_parsers):
            LOGGER.error("Not every field has a parser.")
            raise ValueError
        vals = []
        for fval, parser in zip(field_values, field_parsers):
            if parser is not None and fval is not None:
                try:
                    tval = parser(fval)
                except (TypeError, ValueError):
                    tval = fval
                vals.append(tval)
            else:
                vals.append(fval)
        return tuple(vals)

    @staticmethod
    def spatial_join(
        target_layer: PAFeatureLayer,
        join_layer: PAFeatureLayer,
        output_layer: Union[PAOutputFeatureLayer, str],
        join_operation: str,
        target_to_keep: str,
        field_mappings: Union[str, arcpy.FieldMappings],
        spatial_rel: str,
        search_radius: Optional[str]
    ):
        """Utility function that wraps the arcpy's SpatialJoin function."""
        spatial_rel = spatial_rel if spatial_rel not in SPATIAL_RELATIONSHIP else SPATIAL_RELATIONSHIP[spatial_rel]
        LOGGER.debug(f"spatial_rel: {spatial_rel}")
        output_path = output_layer.data if isinstance(output_layer, PAOutputFeatureLayer) else output_layer
        arcpy.analysis.SpatialJoin(target_layer.layer, join_layer.layer,
                                   output_path, join_operation,
                                   target_to_keep, field_mappings,
                                   spatial_rel, search_radius)


class SpatialJoinFeatures:
    """Perform features join based on spatial relationship."""

    def __init__(
        self,
        target_layer: PAFeatureLayer,
        join_layer: PAFeatureLayer,
        join_output: PAOutputFeatureLayer,
        join_operation: str = "",
        spatial_rel : str = "",
        summary_fields: Union[List, str] = "",
        spatial_rel_dist: Union[str, float] = "",
        spatial_rel_dist_units: str = "",
        wkspc: str = "in_memory",
        join_type: str = "INNER",
        mapped_geom_fields: Optional[Dict] = None
    ):
        """Unpack the parameters.

        Args:
            params: a dictionary keyed by the parameter name and valued by the
            parameter value.
        Returns:
            No returns.

        """
        self.target_layer = target_layer
        self.join_layer = join_layer
        self.join_operation = join_operation
        self.join_output = join_output
        self.spatial_rel = spatial_rel
        self.summary_fields = summary_fields
        self.spatial_rel_dist_units = spatial_rel_dist_units
        self.spatial_rel_dist = spatial_rel_dist
        self.wkspc = wkspc
        self.join_type = join_type  # INNER, LEFT
        self.mapped_geom_fields = mapped_geom_fields

        if self.spatial_rel_dist and self.spatial_rel_dist_units:
            self.search_radius = "{} {}".format(self.spatial_rel_dist,
                                                self.spatial_rel_dist_units)
        else:
            self.search_radius = None
        self.interm_count_field = None
        LOGGER.debug(f"search_radius: {self.search_radius}")

    def add_fields_to_fieldmappings(
        self,
        field_mappings: arcpy.FieldMappings
    ) -> arcpy.FieldMappings:
        """Add fields to the result field mappings."""
        join_lyr_fields: List = AOLUtils.list_fields(self.join_layer.data)
        join_lyr_fieldnames = [field.name.lower() for field in join_lyr_fields]
        join_lyr_fieldnames.remove(self.join_layer.shapeFieldName.lower())
        join_lyr_fieldnames.remove(self.join_layer.OIDFieldName.lower())
        for fld in SHAPE_FIELDS:
            if fld in join_lyr_fieldnames:
                join_lyr_fieldnames.remove(fld)

        for field_name in join_lyr_fieldnames:
            new_fieldmap = arcpy.FieldMap()
            new_fieldmap.addInputField(self.join_layer.layer, field_name)
            new_fieldmap.mergeRule = "First"
            # Assign name and alias name for output field
            output_field = new_fieldmap.outputField
            FieldUtils.update_uniq_fieldname(field_mappings, output_field)
            new_fieldmap.outputField = output_field
            field_mappings.addFieldMap(new_fieldmap)
        return field_mappings

    def _add_gld_backup_field(
        self,
        layer: PAFeatureLayer,
        name_to_avoid: Optional[str] = None
    ) -> Tuple:
        """Add a field with GUID field type as the backup of the GlobalID field.
        The reason to add the backup is because the arcpy's spaialJoin function
        is not kept the globalid field. This is a workaround so to keep the
        value of the globalid field.

        Args:
            layer (PAFeatureLayer): a PAFeatureLayer to add the backup guid field.
            name_to_avoid (Optional[str], optional): the new field name to avoid.
            This is to avoid name confliction of target/join layer.
            Defaults to None.

        Returns:
            Tuple: a two items tuple where the first item is the name of the
            globalID field and the second item is the name of the backup
            guid field. If there is no globalID field of the layer, (None, None)
            is returned.
        """
        glb_field_name = ""
        glb_field_alias = ""
        fields = layer.fields
        for fld in fields:
            if fld.type == "GlobalID":
                glb_field_name = fld.name
                glb_field_alias = fld.aliasName
        if glb_field_name:
            base_name = name_to_avoid + "_1" if name_to_avoid else glb_field_name
            LOGGER.debug(f"base_name: {base_name}")
            tmp_field_name, _ = FieldUtils.create_unique_field_name(fields, base_name)
            LOGGER.debug(f"tmp_field_name: {tmp_field_name}")
            with arcpy.EnvManager(preserveGlobalIds=True):
                arcpy.management.AddField(layer.data, tmp_field_name, "Guid", field_alias=glb_field_alias)
                expression = f'!{glb_field_name}!'
                arcpy.management.CalculateField(layer.data, tmp_field_name, expression,
                                                CALFIELD_PY_METHOD)
            return (glb_field_name, tmp_field_name)
        else:
            return (None, None)

    def join(self):
        """Perform spatial join"""
        (target_gid_fname, target_guid_fname) = self._add_gld_backup_field(self.target_layer)
        LOGGER.debug(f"target layer globalID field: {target_gid_fname} and backup GUID field: {target_guid_fname}")
        (join_gid_fname, join_guid_fname) = self._add_gld_backup_field(self.join_layer, target_guid_fname)
        LOGGER.debug(f"join layer globalID field: {join_gid_fname} and backup guid field: {join_guid_fname}")
        target2keep = "KEEP_COMMON" if self.join_type == "INNER" else "KEEP_ALL"
        LOGGER.debug(f"target2keep: {target2keep}")
        if self.join_operation == "JOIN_ONE_TO_MANY":
            field_mappings = "#"
        else:
            field_mappings, new_fnames = FieldUtils.create_o2o_field_mappings(self.join_layer,
                                                                              self.target_layer,
                                                                              self.summary_fields,  # type: ignore
                                                                              mapped_geom_fields=self.mapped_geom_fields)
            if (
                self.summary_fields
                and len(self.summary_fields) == 1
                and self.summary_fields[0].get("statisticType", "").upper() == "COUNT"
            ):
                LOGGER.debug(f"new_fnames: {new_fnames}")
                self.interm_count_field = new_fnames[0][0]

            LOGGER.debug("spatial relationship: {}".format(self.spatial_rel))
            if not self.summary_fields:
                field_mappings = self.add_fields_to_fieldmappings(field_mappings)

        JFUtils.spatial_join(self.target_layer, self.join_layer, self.join_output,
                             self.join_operation, target2keep, field_mappings,
                             self.spatial_rel, self.search_radius)  # type: ignore
        # Rename the backup GUID field to the same name as the globalID field
        fields_to_update = []
        # Only replace if the target_gid_fname is not in the output
        if (
            target_gid_fname
            and not FieldUtils.verify_field_exists(self.join_output.data, target_gid_fname)
        ):
            fields_to_update.append({"originalFieldName": target_guid_fname,
                                     "newFieldName": target_gid_fname})
        elif (
            target_guid_fname
            and FieldUtils.verify_field_exists(self.join_output.data, target_guid_fname)
        ):
            arcpy.management.DeleteField(self.join_output.data, target_guid_fname)
            LOGGER.debug("Target globalID field exists. Delete the backup guid field.")

        if (
            join_gid_fname
            and not FieldUtils.verify_field_exists(self.join_output.data, join_gid_fname)
            and join_gid_fname != target_gid_fname
        ):
            fields_to_update.append({"originalFieldName": join_guid_fname,
                                     "newFieldName": join_gid_fname})
        # Only delete the field if the join_guid_fname exists in output and target
        # globalID field name is not the same as the join globalID field name
        elif (
            join_guid_fname
            and FieldUtils.verify_field_exists(self.join_output.data, join_guid_fname)
            and join_gid_fname != target_gid_fname
        ):
            arcpy.management.DeleteField(self.join_output.data, join_guid_fname)
            LOGGER.debug("Join globalID field exists. Delete the backup guid field")

        if fields_to_update:
            FieldUtils.rename_fields(self.join_output, fields_to_update)
            LOGGER.debug(f"Successfully renamed backup fields: {fields_to_update}")
        fields = AOLUtils.list_fields(self.join_output.data)
        finfo = {f.name: f.type for f in fields}
        LOGGER.debug(f"join_output fields: {finfo}")


class AttributeJoinFeatures:
    """Perform features join based on attributes."""

    def __init__(
        self,
        target_layer: PAFeatureLayer,
        join_layer: PAFeatureLayer,
        join_output: PAOutputFeatureLayer,
        join_operation: str = "",
        summary_fields: Union[List, str] = "",
        record_to_match: Optional[Dict] = None,
        wkspc: str = "in_memory",
        attribute_rel: str = "",
        spatial_rel: str = "",
        spatial_rel_dist: Union[str, float] = "",
        spatial_rel_dist_units: str = "",
        join_type: str = "INNER",
        mapped_geom_fields: Optional[Dict] = None
    ):
        """Unpack the parameters.

        Args:
            attribute_rel: [{"targetField":"COLOR","operator":"equal","joinField":"COLOR"},
                            {"targetField":"Value","operator":"equal","joinField":"Value"},
                            {"targetField":"GlobalID","operator":"equal","joinField":"GlobalID"}]
            summary_fields: [{"onStatisticField":"Value","statisticType":"SUM"},
                             {"onStatisticField":"Value","statisticType":"STDDEV"}"]

        """
        self.target_layer = target_layer
        self.join_layer = join_layer
        self.join_operation = join_operation
        self.join_output = join_output
        self.summary_fields = summary_fields
        self.record_to_match = record_to_match
        self.wkspc = wkspc
        self.attribute_rel = attribute_rel
        self.spatial_rel = spatial_rel
        self.spatial_rel_dist_units = spatial_rel_dist
        self.spatial_rel_dist = spatial_rel_dist_units
        self.join_type = join_type
        self.mapped_geom_fields = mapped_geom_fields

        if self.join_output.data is not None:
            self.wkspc = os.path.dirname(self.join_output.data)
        else:
            LOGGER.debug("Empty join output.")
            raise ToolExit

        self.search_radius = None
        if self.spatial_rel:
            LOGGER.debug("Filter features based on spatial relation.")
            # filter target features for performance
            # selection_type = "NEW_SELECTION"
            # if len(self.target_layer.FIDSet) > 0:
            #     selection_type = "SUBSET_SELECTION"
            if self.spatial_rel_dist and self.spatial_rel_dist_units:
                self.search_radius = "{} {}".format(self.spatial_rel_dist,
                                                    self.spatial_rel_dist_units)

        LOGGER.debug(f"search_radius: {self.search_radius}")
        LOGGER.debug("Filter features based on attribute rel")
        self.target_rel_fieldnames = []
        self.join_rel_fieldnames = []

        for attr_rel in self.attribute_rel:
            self.target_rel_fieldnames.append(attr_rel["targetField"].lower())  # type: ignore
            self.join_rel_fieldnames.append(attr_rel["joinField"].lower())  # type: ignore

        if (
            len(self.attribute_rel) != len(self.target_rel_fieldnames)
            or len(self.attribute_rel) != len(self.join_rel_fieldnames)
        ):
            LOGGER.error(100245, extra={"message_ID": 100245,
                                        "paramName": "attributeRelationship"})
            raise ToolExit

        LOGGER.debug(f"target_rel_fieldnames: {self.target_rel_fieldnames}")
        LOGGER.debug(f"join_rel_fieldnames: {self.join_rel_fieldnames}")
        self.interm_count_field = None

    def add_joinlayer_fields(
        self,
        exclude_fields: Optional[List] = None,
        keep_src_oid: bool = False
    ) -> Dict:
        """Add the fields of the joinLayer to the output."""
        if exclude_fields is None:
            exclude_fields = []
        # fields that already in output. Used to rename the add in field if needed.
        new_fields = [field.name.lower() for field in self.target_layer.fields]
        fields_to_join = {}

        for field in self.join_layer.fields:
            field_name = field.name
            field_alias = field.aliasName
            # use GUID as the field type since GlobalID field is not editable/insertable
            field_type = field.type if field.type != "GlobalID" else "Guid"
            fname_lower = field_name.lower()
            if (
                field.type != "Geometry"
                and fname_lower not in SHAPE_FIELDS
                and fname_lower not in exclude_fields
            ):
                if fname_lower == self.join_layer.OIDFieldName.lower():
                    if keep_src_oid:
                        tmp_field_name = f"{self.join_layer.basename}_FID"
                        (tmp_field_name, _) = FieldUtils.create_unique_field_name(new_fields + self.join_layer.fields,
                                                                                tmp_field_name)
                        arcpy.management.AddField(self.join_output.data, tmp_field_name,
                                                "Integer")
                        # this won't be overwrite since field name does not support space
                        fields_to_join[SRC_OID_KEY] = {JOIN_OID_KEY: tmp_field_name}
                    continue

                # verify field name is not there in already added fields
                if fname_lower in new_fields:
                    (field_name, field_alias) = FieldUtils.create_unique_field_name(new_fields + self.join_layer.fields,
                                                                                    field_name,
                                                                                    field_alias)

                arcpy.management.AddField(self.join_output.data, field_name,
                                          field_type, field.precision,
                                          field.scale, field.length,
                                          field_alias, "#", "#",
                                          field.domain)
                new_fields.append(field_name.lower())
                fields_to_join[field_name] = field.name
        return fields_to_join

    @classmethod
    def alter_gid_field_type(cls, initialized_fc: str, wkspc: str):
        """Change the field with globalID type to guid type.

        Args:
            initialized_fc (str): absolute path of the initialized output feature
            class.
        """
        fields = AOLUtils.list_fields(initialized_fc)
        gid_fname = ""
        gid_alias = ""
        gid_nullable = False
        for fld in fields:
            if fld.type == "GlobalID":
                gid_fname = fld.name
                gid_alias = fld.aliasName
                gid_nullable = fld.isNullable
                break

        if gid_fname:
            (tmp_field_name, _) = FieldUtils.create_unique_field_name(fields, gid_fname)
            arcpy.management.AddField(initialized_fc, tmp_field_name, "Guid",
                                      field_is_nullable=gid_nullable)
            arcpy.management.DeleteField(initialized_fc, gid_fname)
            arcpy.management.AlterField(initialized_fc, tmp_field_name, gid_fname, gid_alias)
        # workaround for manipulating globalid field since FGDB does not allow removing
        # globalid field.
        if wkspc != "in_memory":
            tbl_name = os.path.basename(initialized_fc)
            arcpy.gp.SimpleCopy(initialized_fc, os.path.join(wkspc, tbl_name))  # type: ignore
            # delete the initialized_fc just in case it is not properly handled
            arcpy.management.Delete(initialized_fc)

    def initialize_output(self, keep_src_oid: bool = False) -> Dict:
        """Initialize an output to host attribute join result.

        Args:
            keep_src_oid: True to add two new integer fields to keep the objectID
            field of the target and join layer and False otherwise.

        Returns:
            A dictionary keyed by the name of the field in the original join layer
            and valued by the name of the field in the output layer.

        """
        tbl_name = os.path.basename(self.join_output.data)
        if not self.target_layer.is_table_view:
            LOGGER.debug(f"Create feature class output: {tbl_name}")
            arcpy.management.CreateFeatureclass("in_memory",
                                                tbl_name,
                                                self.target_layer.shapeType,
                                                self.target_layer.layer,
                                                "SAME_AS_TEMPLATE",
                                                "SAME_AS_TEMPLATE",
                                                self.target_layer.layer)
        else:
            # create schema for output
            LOGGER.debug("Create table output.")
            arcpy.management.CreateTable("in_memory",
                                         tbl_name,
                                         self.target_layer.data)

        self.alter_gid_field_type(os.path.join("in_memory", tbl_name), self.wkspc)
        if (
            FieldUtils.verify_field_exists(self.target_layer, "OID")
            and not FieldUtils.verify_field_exists(self.target_layer, "OID_")
            and FieldUtils.verify_field_exists(self.join_output.data, "OID_")
        ):
            FieldUtils.rename_fields(self.join_output, [{"originalFieldName": "OID_",
                                                         "newFieldName": "OID"}])
        target_ffname = ""
        if keep_src_oid:
            target_ffname = f"{self.target_layer.basename}_FID"
            (target_ffname, _) = FieldUtils.create_unique_field_name(self.join_output.fields,  # type: ignore
                                                                      target_ffname)
            arcpy.management.AddField(self.join_output.data, target_ffname, "Integer")
            LOGGER.debug(f"Add target FID field named: {target_ffname}")
        
        # Add fields from join_layer to the output
        exclude_fields = []
        exclude_fields.extend(self.join_rel_fieldnames)

        if (
            self.join_operation == "JOIN_ONE_TO_MANY"
            or (self.join_operation == "JOIN_ONE_TO_ONE" and not self.summary_fields)
        ):
            fields_to_join = self.add_joinlayer_fields(exclude_fields,
                                                       keep_src_oid=keep_src_oid)
        else:
            # Add field for count
            fields_to_join = {}
            field_name, field_alias = FieldUtils.create_unique_field_name(self.target_layer.fields,
                                                                          "Join_Count",
                                                                          "Join Count")
            arcpy.management.AddField(self.join_output.data, field_name,
                                      "LONG", "#", "#", "#", field_alias)
            if keep_src_oid:
                fields_to_join[SRC_OID_KEY] = {STATS_COUNT_KEY: field_name}
            else:
                fields_to_join[field_name] = field_name
            for field_info in self.summary_fields:
                orig_field_name = field_info.get(STATS_FN_KEY)  # type: ignore
                stats = field_info.get(STATS_TYPE_KEY)  # type: ignore
                field_data_type = JFUtils.get_output_fieldtype(self.join_layer.fields,
                                                               orig_field_name,
                                                               stats)
                if orig_field_name:
                    if (
                        not self.mapped_geom_fields
                        or orig_field_name not in self.mapped_geom_fields
                    ):
                        field_name = f"{stats}_{orig_field_name}"
                        field_alias = FieldUtils.get_summary_aliasname(orig_field_name,
                                                                       stats)
                    else:
                        field_name = f"{stats}_{self.mapped_geom_fields[orig_field_name]}"
                        field_alias = FieldUtils.get_summary_aliasname(self.mapped_geom_fields[orig_field_name],
                                                                       stats)
                    field_name, field_alias = FieldUtils.create_unique_field_name(self.target_layer.fields,
                                                                                  field_name,
                                                                                  field_alias)
                    arcpy.management.AddField(self.join_output.data, field_name, field_data_type,
                                              "#", "#", "#", field_alias)
                    fields_to_join[field_name] = orig_field_name
                    if (
                        self.summary_fields
                        and len(self.summary_fields) == 1
                        and self.summary_fields[0].get("statisticType", "").upper() == "COUNT"
                    ):
                        self.interm_count_field = field_name
                else:
                    LOGGER.error(f"Invalid summary field information: {field_info}.")
                    raise ToolExit
        
        if keep_src_oid:
            if SRC_OID_KEY in fields_to_join:
                fields_to_join[SRC_OID_KEY].update({TARGET_OID_KEY: target_ffname})
            else:
                fields_to_join[SRC_OID_KEY] = {TARGET_OID_KEY: target_ffname}
        return fields_to_join

    def join(self):
        """Perform the join by attributes."""
        fields_to_join = self.initialize_output()
        with LogExecutionTime("Find matched OIDs."):
            matched_oids = JFUtils.match_by_attrs(self.target_layer,
                                                  self.join_layer,
                                                  self.target_rel_fieldnames,
                                                  self.join_rel_fieldnames,
                                                  self.spatial_rel,
                                                  self.search_radius)

        desc_output = AOLUtils.describe(self.join_output.data)
        fields: List[arcpy.Field] = desc_output.fields  # type: ignore
        join_output_fnames = []
        for field in fields:
            if field.type == "Geometry":
                join_output_fnames.append("SHAPE@")
            else:
                join_output_fnames.append(field.name)

        join_fnames_in_output = [fname for fname in fields_to_join]
        join_fnames_in_order = []
        for jo_fname in join_output_fnames:
            if jo_fname in join_fnames_in_output:
                join_fnames_in_order.append(fields_to_join[jo_fname])

        with LogExecutionTime("Get join rows."):
            rows_to_join = JFUtils.get_join_row(self.join_layer,
                                                matched_oids,
                                                join_fnames_in_order,
                                                self.join_operation,
                                                self.record_to_match,
                                                self.summary_fields)  # type: ignore
            del matched_oids

        if self.join_type == "LEFT":
            dummy_join_row = tuple([None for _ in range(len(join_fnames_in_order))])

        target_fields = [f.name.lower() for f in arcpy.ListFields(self.target_layer.data)]
        target_fnames = []
        # fields in output but not from the target (virtual fields like shape_area)
        fnames_to_exl = []
        for fname in join_output_fnames:
            if fname not in join_fnames_in_output:
                if fname.upper() == "OBJECTID":
                    target_fnames.append(self.target_layer.OIDFieldName)
                elif fname.lower() in target_fields or fname.lower() == "shape@":
                    target_fnames.append(fname)
                else:
                    fnames_to_exl.append(fname)
        LOGGER.debug(f"fields in output but not originate from target layer: {fnames_to_exl}")
        for f2r in fnames_to_exl:
            join_output_fnames.remove(f2r)

        with LogExecutionTime("Insert features into output."):
            with InsertCursor(self.join_output.data, join_output_fnames) as output_cur:
                with SearchCursor(self.target_layer.data, target_fnames) as target_cur:
                    for target_row in target_cur:
                        oid = target_row[0]
                        if oid in rows_to_join:
                            join_row = rows_to_join.pop(oid)
                        else:
                            join_row = None

                        if isinstance(join_row, tuple):
                            output_cur.insertRow(target_row + join_row)
                        # Case of One_To_Many
                        elif isinstance(join_row, list):
                            for tmp_jrow in join_row:
                                output_cur.insertRow(target_row + tmp_jrow)
                        elif join_row is None and self.join_type == "LEFT":
                            output_cur.insertRow(target_row + dummy_join_row)  # type: ignore


class AJFeaturesX(IntermCleanMixin, AttributeJoinFeatures):
    """Implementation based on AddJoin of arcpy."""
    DELIMITER = "&"
    FIELD_LN_MAP = {"Integer":      11,
                    "SmallInteger": 6,
                    "Date":         50,
                    "Single":       20,
                    "GlobalID":     36,
                    "Guid":         36}

    def __init__(
        self,
        target_layer: PAFeatureLayer,
        join_layer: PAFeatureLayer,
        join_output: PAOutputFeatureLayer,
        join_operation: str = "",
        summary_fields: Union[List, str] = "",
        record_to_match: Optional[Dict] = None,
        wkspc: str = "in_memory",
        attribute_rel: str = "",
        spatial_rel: str = "",
        spatial_rel_dist: Union[str, float] = "",
        spatial_rel_dist_units: str = "",
        join_type: str = "INNER"
    ):
        super(AJFeaturesX, self).__init__(target_layer, join_layer, join_output,
                                          join_operation, summary_fields,
                                          record_to_match, wkspc,
                                          attribute_rel, spatial_rel,
                                          spatial_rel_dist,
                                          spatial_rel_dist_units,
                                          join_type)
        self.target_attr_fname = ""
        self.join_attr_fname = ""
        self.tf_created = False
        self.jf_created = False
        self.joined_table = None
        self.interm_outputs = []

    def _prep_join_field(
        self,
        lyr_to_prep: PAFeatureLayer,
        t_rel_fields: List[arcpy.Field],
        j_rel_fields: List[arcpy.Field],
        is_join_lyr: bool
    )->str:
        """Prepare the field for either the target or join layer.

        Args:
            lyr_to_prep (PAFeatureLayer): an instance of PAFeatureLayer where the
            join field is created upon.
            t_rel_fields (List[arcpy.Field]): a list of fields used to match from
            the target_layer.
            j_rel_fields (List[arcpy.Field]): a list of fields used to match from
            the join_layer.
            is_join_lyr (bool): True if the lyr_to_prep is the target layer and False
            is the join layer.

        Returns:
            str: name of the field that is going to be used for join.
        """
        prefix = "target" if not is_join_lyr else "join"
        if (
            len(t_rel_fields) == 1
            and t_rel_fields[0].type == j_rel_fields[0].type
            and t_rel_fields[0].type != "String"  
        ):
            return t_rel_fields[0].name if not is_join_lyr else j_rel_fields[0].name
        else:
            fields = t_rel_fields if not is_join_lyr else j_rel_fields
            (join_fname, join_alias) = FieldUtils.create_unique_field_name(lyr_to_prep.fields,  # type: ignore
                                                                           f"{prefix}AttrRel")
            expressions = []
            for f in fields:
                if f.type == "String":
                    expressions.append(f"!{f.name}!.lower()")
                else:
                    expressions.append(f"str(!{f.name}!).lower()")
            expression = f" + '{self.DELIMITER}' + ".join(expressions)
            LOGGER.debug(f"Field calculate expression: {expression}")
            if len(fields) > 1:
                flengths = []
                for f in fields:
                    tlen = self.FIELD_LN_MAP.get(f.type, f.length)
                    flengths.append(tlen)
            else:
                # means the target field is string field
                if is_join_lyr:
                    flengths = [t_rel_fields[0].length]
                else:
                    flengths = [j_rel_fields[0].length]
            new_field_length = sum(flengths)
            # TODO: need to add a check and see if the new_field_length exceeds the limit
            arcpy.management.AddField(lyr_to_prep.data, join_fname, "String",
                                      field_alias = join_alias,
                                      field_length=new_field_length)
            arcpy.management.CalculateField(lyr_to_prep.data, join_fname, expression, "PYTHON3")

            if is_join_lyr:
                self.jf_created = True
            else:
                self.tf_created = True
            return join_fname

    @LogUtils.time_exec
    def _attr_join(self) -> JOIN_RESULT_TYPE:
        """Join the target and join layers through attributes.

        Returns:
            JOIN_RESULT_TYPE: output from AddJoin.
        """
        t_rel_fields = FieldUtils.get_fields_by_names(self.target_layer.fields,
                                                      self.target_rel_fieldnames)
        j_rel_fields = FieldUtils.get_fields_by_names(self.join_layer.fields,
                                                      self.join_rel_fieldnames)
        self.target_attr_fname = self._prep_join_field(self.target_layer,
                                                       t_rel_fields,
                                                       j_rel_fields,
                                                       False)
        LOGGER.debug(f"target_attr_fname: {self.target_attr_fname}")
        self.join_attr_fname = self._prep_join_field(self.join_layer,
                                                     t_rel_fields,
                                                     j_rel_fields,
                                                     True)
        LOGGER.debug(f"join_attr_fname: {self.join_attr_fname}")
        join_type = "KEEP_COMMON"
        if self.join_type == "LEFT":
            join_type = "KEEP_ALL"
        with LogExecutionTime("AddJoin_Management"):
            res = arcpy.management.AddJoin(self.target_layer.data, self.target_attr_fname,
                                           self.join_layer.data, self.join_attr_fname,
                                           join_type=join_type,
                                           index_join_fields=True)
            return res.getOutput(0)  # type: ignore

    def _spatial_join(self) -> Dict[int, List[int]]:
        """Perform the spatial and attribute join together.

        Returns:
            Dict[int, int]: a dictionary keyed by the target feature ID and valued
            by a list of IDs of the matched join features.
        """
        sj_output = AOLUtils.create_unique_name("sjIntermOut", self.wkspc)
        t2k = "KEEP_COMMON"
        JFUtils.spatial_join(self.target_layer, self.join_layer,
                             sj_output, "JOIN_ONE_TO_MANY",
                             t2k, "#", self.spatial_rel,
                             self.search_radius)  # type: ignore
        fields = AOLUtils.list_fields(sj_output)
        lookup_dict = {}
        t_fid_fname = FieldUtils.get_newest_fieldname(fields, "TARGET_FID")
        j_fid_fname = FieldUtils.get_newest_fieldname(fields, "JOIN_FID")
        if not t_fid_fname or not j_fid_fname:
            LOGGER.debug("Unable to find the TARGET_FID or JOIN_FID.")
            raise ToolExit
        with SearchCursor(sj_output, [t_fid_fname, j_fid_fname]) as s_curr:
            for row in s_curr:
                # -1 means no matched join features
                if row[1] == -1:
                    lookup_dict[row[0]] = [-1]
                elif row[0] not in lookup_dict:
                    lookup_dict[row[0]] = [row[1]]
                else:
                    lookup_dict[row[0]].append(row[1])
        return lookup_dict

    def _map_output_fields(
        self,
        mapped_join_fields: Dict
    ) -> Tuple:
        """Map the fields from the joined layer to the initialized output.

        Args:
            mapped_join_fields (Dict): a dictionary keyed by the name of the field
            in the initialized output and valued by the original name in the join
            layer.

        Returns:
            Tuple: an two items tuple where the first item represents the fields to
            search from the joined_table and the second item represents the fields
            to insert into the output.
        """
        joined_fields = []
        output_fields = []
        target_bname = self.target_layer.basename
        join_bname = self.join_layer.basename
        
        src_oid_info = mapped_join_fields.pop(SRC_OID_KEY)
        t_oid_fn = src_oid_info.get(TARGET_OID_KEY, "")
        j_oid_fn = src_oid_info.get(JOIN_OID_KEY, "")
        cnt_stat_fname = src_oid_info.get(STATS_COUNT_KEY, "")
        if t_oid_fn:
            joined_fields.append(f"{target_bname}.{self.target_layer.OIDFieldName}")
            output_fields.append(t_oid_fn)
        if j_oid_fn:
            joined_fields.append(f"{join_bname}.{self.join_layer.OIDFieldName}")
            output_fields.append(j_oid_fn)
        elif (
            self.join_operation == "JOIN_ONE_TO_ONE"
            and self.summary_fields
            and self.spatial_rel
        ):
            joined_fields.append(f"{join_bname}.{self.join_layer.OIDFieldName}")

        desc = AOLUtils.describe(self.joined_table)  # type: ignore
        fnames = [f.name for f in desc.fields]
        desc_o = AOLUtils.describe(self.join_output.data)
        o_fields: List[arcpy.Field] = desc_o.fields
        
        stats_fnames = []
        join_fnames = []
        if self.join_operation == "JOIN_ONE_TO_ONE" and self.summary_fields:
            for ofn in mapped_join_fields:
                stats_fnames.append(ofn)
                if mapped_join_fields[ofn] not in join_fnames:
                    join_fnames.append(mapped_join_fields[ofn])
            exclude_fields = [t_oid_fn, j_oid_fn] + stats_fnames + [cnt_stat_fname] + SHP_RES_FNAMES
            out_fnames = [f.name for f in o_fields if f.type != "OID" and f.name not in exclude_fields]
        else:
            out_fnames = [f.name for f in o_fields if f.type != "OID" and f.name not in [t_oid_fn, j_oid_fn]]

        # Get the target fields first
        for ofname in out_fnames:
            if ofname in fnames:
                joined_fields.append(ofname)
                output_fields.append(ofname)
            elif f"{target_bname}.{ofname}" in fnames:
                if not self.target_layer.is_table_view and ofname == self.target_layer.shapeFieldName:
                    joined_fields.append("SHAPE@")
                    output_fields.append("SHAPE@")
                else:
                    joined_fields.append(f"{target_bname}.{ofname}")
                    output_fields.append(ofname)
            elif f"{join_bname}.{ofname}" in fnames:
                if f"{join_bname}.{ofname}" not in joined_fields:
                    joined_fields.append(f"{join_bname}.{ofname}")
                output_fields.append(ofname)
            elif f"{join_bname}.{mapped_join_fields[ofname]}" in fnames:
                joined_fields.append(f"{join_bname}.{mapped_join_fields[ofname]}")
                output_fields.append(ofname)

        if cnt_stat_fname:
            output_fields.extend(stats_fnames)
            output_fields.append(cnt_stat_fname)
            joined_fields.extend([f"{join_bname}.{jfn}" for jfn in join_fnames])

        LOGGER.debug(f"joined_fields: {joined_fields}")
        LOGGER.debug(f"output_fields: {output_fields}")
        return (joined_fields, output_fields)

    @LogUtils.time_exec
    def _get_src_oids2k(
        self,
        sj_mapped_oids: Optional[Dict[int, List[int]]],
        t_oid_fname: str,
        j_oid_fname: str
    )->Optional[Dict[int, List[int]]]:
        """Get a list of oids to keep."""
        if sj_mapped_oids is None:
            return None
        join_oid_map = {}
        with SearchCursor(self.joined_table, [t_oid_fname, j_oid_fname]) as s_curr:
            for row in s_curr:
                if row[0] in join_oid_map:
                    join_oid_map[row[0]].append(row[1])
                else:
                    join_oid_map[row[0]] = [row[1]]

        for toid in join_oid_map:
            if toid in sj_mapped_oids:
                tmp_set = set(join_oid_map[toid]).intersection(set(sj_mapped_oids[toid]))  # type: ignore
                join_oid_map[toid] = list(tmp_set)
            else:
                join_oid_map[toid] = []

        return join_oid_map

    def _save_1tom_join(self, fields_to_join: Dict,
                        sj_oid_map: Optional[Dict[int, List[int]]]):
        """Save the 1 to m join results"""
        (joined_fields, output_fields) = self._map_output_fields(fields_to_join)
        join_oid_map = self._get_src_oids2k(sj_oid_map,
                                            joined_fields[0],
                                            joined_fields[1])

        # create an empty row with join info
        jf_cnt = len(fields_to_join)
        LOGGER.debug(f"Total {jf_cnt} of join fields in result.")
        empty_join_res = [None for _ in range(jf_cnt)]
        with SearchCursor(self.joined_table, joined_fields) as s_curr:
            with InsertCursor(self.join_output.data, output_fields) as i_curr:
                for row in s_curr:
                    if join_oid_map:
                        if row[0] in join_oid_map and row[1] in join_oid_map[row[0]]:
                            i_curr.insertRow(row)
                        elif (
                            self.join_type == "LEFT"
                            and row[0] in join_oid_map
                            and join_oid_map[row[0]] == []
                        ):
                            if jf_cnt > 0:
                                tmp_row = list(row)
                                tmp_row[len(row) - jf_cnt::] = empty_join_res
                                i_curr.insertRow(tmp_row)
                            else:
                                i_curr.insertRow(row)
                            join_oid_map.pop(row[0])
                    else:
                        i_curr.insertRow(row)

    def __o2o_curr_op(self,
                      joined_fields: List,
                      output_fields: List,
                      sel_exp: Optional[str],
                      join_oid_map: Optional[Dict[int, List[int]]],
                      sql_clause: Optional[Tuple],
                      jf_cnt: int)->List[str]:
        """One to one curror operation.

        Args:
            joined_fields (List): a list of fields to search from the joined_table.
            output_fields (List): a list of fields to insert into the output.
            sel_exp (Optional[str]): where clause for the searchCursor of joined_table.
            join_oid_map (Optional[Dict[int, List[int]]]): a dictionary from the
            spatial join result which keyed by the OID of the target feature and
            valued by a list of OIDs of the matched join features.
            sql_clause (Optional[Tuple]): a clause to control the order of features.
            jf_cnt (int): total number of fields from the original join layer.

        Returns:
            List[str]: a list of target OIDs that have already found a match so
            these features does not need to be reload again if left join is needed.
        """
        # grps that have been saved
        prop_grps = []
        # create an empty row for left join
        empty_join_res = [None for _ in range(jf_cnt)]
        with SearchCursor(self.joined_table, joined_fields, sel_exp, sql_clause=sql_clause) as s_curr:
            with InsertCursor(self.join_output.data, output_fields) as i_curr:
                curr_grp = None
                for row in s_curr:
                    if join_oid_map is not None:
                        if row[0] in join_oid_map and row[1] in join_oid_map[row[0]]:
                            i_curr.insertRow(row)
                            prop_grps.append(str(row[0]))
                            join_oid_map.pop(row[0])
                        elif (
                            self.join_type == "LEFT"
                            and row[0] in join_oid_map
                            and join_oid_map[row[0]] == []
                        ):
                            if jf_cnt > 0:
                                tmp_row = list(row)
                                tmp_row[len(row) - jf_cnt::] = empty_join_res
                                i_curr.insertRow(tmp_row)
                            else:
                                i_curr.insertRow(row)
                            prop_grps.append(str(row[0]))
                            join_oid_map.pop(row[0])
                    else:
                        if row[0] != curr_grp:
                            i_curr.insertRow(row)
                            curr_grp = row[0]
                            prop_grps.append(str(row[0]))
        return prop_grps
    
    def _save_1to1_join(self, fields_to_join: Dict,
                        sj_oid_map: Optional[Dict[int, List[int]]]):
        """Save the 1 to 1 join results"""
        (joined_fields, output_fields) = self._map_output_fields(fields_to_join)

        sel_exp = None
        sf_name = ""
        if not self.record_to_match or self.record_to_match.get("orderByFields") is None:
            # the first item of output_fields is the OID of the target layer
            sort_fields = [joined_fields[0]]
            sort_type = "ASC"
        else:
            ob_field = self.record_to_match["orderByFields"]
            (sort_field, sort_type) = ob_field.split(" ")
            # OBJECTID means first appearance
            if sort_field == "OBJECTID":
                sort_fields = [joined_fields[0]]
            else:
                sort_field_cs = FieldUtils.get_field_name(self.join_layer.fields, sort_field)
                sf_name = f"{self.join_layer.basename}.{sort_field_cs}"
                sel_exp = f"{sf_name} IS NOT NULL"
                LOGGER.debug(f"sel_exp: {sel_exp}")
                sort_fields = [joined_fields[0], sf_name]

        # sql_prefix = f"DISTINCT {joined_fields[0]}"
        # LOGGER.debug(f"sql_prefix: {sql_prefix}")
        sql_post = f"ORDER BY {','.join(sort_fields)} {sort_type}"
        LOGGER.debug(f"sql_post: {sql_post}")
        
        join_oid_map = self._get_src_oids2k(sj_oid_map,
                                            joined_fields[0],
                                            joined_fields[1])
        jf_cnt = len(fields_to_join)
        LOGGER.debug(f"Total {jf_cnt} of join fields in result")
        saved_grps = self.__o2o_curr_op(joined_fields, output_fields, sel_exp,
                                        join_oid_map, (None, sql_post),
                                        jf_cnt)
        if sel_exp and sf_name:
            new_sel_exp = f"{sf_name} IS NULL and {joined_fields[0]} not in ({','.join(saved_grps)})"
            # LOGGER.debug(f"new_sel_exp: {new_sel_exp}")
            self.__o2o_curr_op(joined_fields, output_fields,
                               new_sel_exp, join_oid_map, (None, sql_post),
                               jf_cnt)

    def _save_stats_without_sj(
        self,
        joined_fields: List[str],
        output_fields: List[str],
        sql_clause: Tuple,
        tc_cnt: int,
        sobjects: List[RegStatsObject]
    ):
        """Save and calculate the stats for attribute join only result"""
        with SearchCursor(self.joined_table, joined_fields, sql_clause=sql_clause) as s_curr:
            with InsertCursor(self.join_output.data, output_fields) as i_curr:
                curr_grp = None
                target_row = None
                for row in s_curr:
                    if curr_grp is None:
                        target_row = row[0: tc_cnt]
                        for i in range(len(sobjects)):
                            sobjects[i].reset()
                            sobjects[i].add_val(row[tc_cnt + i])
                        curr_grp = row[0]
                    elif curr_grp == row[0]:
                        for i in range(len(sobjects)):
                            sobjects[i].add_val(row[tc_cnt + i])
                    elif target_row:
                        # unpack the existing values
                        r2i = list(target_row)
                        for sobj in sobjects:
                            r2i += sobj.get_all_sois()
                        i_curr.insertRow(r2i)
                        curr_grp = row[0]
                        target_row = row[0: tc_cnt]
                        for i in range(len(sobjects)):
                            sobjects[i].reset()
                            sobjects[i].add_val(row[tc_cnt + i])
                    else:
                        LOGGER.debug(f"target_row must be initialized before unpack.")
                        raise ToolExit

                # unpack the last group
                if target_row:
                    r2i = list(target_row)
                    for sobj in sobjects:
                        r2i += sobj.get_all_sois()
                    i_curr.insertRow(r2i)

    def _save_stats_sj_ol(
        self,
        joined_fields: List[str],
        output_fields: List[str],
        sql_clause: Tuple,
        tc_cnt: int,
        sobjects: List[RegStatsObject],
        sjoin_oid_map: Dict[int, int]  
    ):
        """Calulate and save the stats with spatial join overlay"""
        with SearchCursor(self.joined_table, joined_fields, sql_clause=sql_clause) as s_curr:
            with InsertCursor(self.join_output.data, output_fields) as i_curr:
                curr_grp = None
                target_row = None
                for row in s_curr:
                    if (
                        curr_grp is None
                    ):
                        # index 1 is the OID of the join table
                        tmp_row = list(row)
                        target_row = [tmp_row[0]] + tmp_row[2: tc_cnt]
                        for i in range(len(sobjects)):
                            sobjects[i].reset()
                            if row[0] in sjoin_oid_map and row[1] in sjoin_oid_map[row[0]]:
                                sobjects[i].add_val(row[tc_cnt + i])
                        curr_grp = row[0]
                    elif (
                        curr_grp == row[0]
                        and curr_grp in sjoin_oid_map
                        and row[1] in sjoin_oid_map[curr_grp]
                    ):
                        for i in range(len(sobjects)):
                            sobjects[i].add_val(row[tc_cnt + i])
                    elif curr_grp != row[0]:
                        # unpack the existing values
                        if (
                          sjoin_oid_map.get(curr_grp, [])
                          or self.join_type == "LEFT" 
                        ):
                            r2i = target_row
                            for sobj in sobjects:
                                r2i += sobj.get_all_sois()  # type: ignore
                            i_curr.insertRow(r2i)
                        curr_grp = row[0]
                        tmp_row = list(row)
                        target_row = [tmp_row[0]] + tmp_row[2: tc_cnt]
                        for i in range(len(sobjects)):
                            sobjects[i].reset()
                            if (
                                curr_grp in sjoin_oid_map
                                and row[1] in sjoin_oid_map[curr_grp]
                            ):
                                sobjects[i].add_val(row[tc_cnt + i])

                # unpack the last group
                if (
                    target_row
                    and curr_grp
                    and (sjoin_oid_map.get(curr_grp, [])
                         or self.join_type == "LEFT")
                ):
                    r2i = target_row
                    for sobj in sobjects:
                        r2i += sobj.get_all_sois()
                    i_curr.insertRow(r2i)
                elif curr_grp is None:
                    LOGGER.debug("current group can not be empty.")
                    raise ToolExit

    def _save_join_stats(self, fields_to_join: Dict,
                         sj_oid_map: Optional[Dict[int, List[int]]]):
        """Save the joint results with stats calculated."""
        (joined_fields, output_fields) = self._map_output_fields(fields_to_join)
        join_oid_map = self._get_src_oids2k(sj_oid_map,
                                            joined_fields[0],
                                            joined_fields[1])
        # sort by the target OID
        sql_post = f"ORDER BY {joined_fields[0]} ASC"
        LOGGER.debug(f"sql_post: {sql_post}")
        uniq_fnames = []
        stats_info = {}
        for sstat in self.summary_fields:  # type: ignore
            if isinstance(sstat, dict):
                stype = "std" if sstat[STATS_TYPE_KEY].lower() == "stddev" else sstat[STATS_TYPE_KEY].lower()
                if sstat[STATS_FN_KEY] not in uniq_fnames:
                    uniq_fnames.append(sstat[STATS_FN_KEY])
                    stats_info[sstat[STATS_FN_KEY]] = [stype]
                else:
                    stats_info[sstat[STATS_FN_KEY]].append(stype)
            else:
                LOGGER.debug("Invalid format of summary fields. dict type is expected.")
                raise ToolExit

        # always return count at the end
        stats_info[uniq_fnames[-1]].append("count")
        sobjects = []
        for fname in uniq_fnames:
            sobjects.append(RegStatsObject(stats_info[fname]))

        # column count from target layer
        tc_cnt = len(joined_fields) - len(uniq_fnames)

        if not join_oid_map:
            self._save_stats_without_sj(joined_fields, output_fields,
                                        (None, sql_post), tc_cnt, sobjects)
        else:
            self._save_stats_sj_ol(joined_fields, output_fields,
                                   (None, sql_post), tc_cnt, sobjects,
                                   join_oid_map)  # type: ignore
        
    def join(self):
        fields_to_join = self.initialize_output(keep_src_oid=True)
        sj_oid_map = None
        LOGGER.debug(f"fields_to_join: {fields_to_join}")
        self.joined_table = self._attr_join()
        self.interm_outputs.append(self.joined_table)
        try:
            if self.spatial_rel:
                with LogExecutionTime("Perform the spatial join"):
                    sj_oid_map = self._spatial_join()

            with LogExecutionTime("Save the join results"):
                if self.join_operation == "JOIN_ONE_TO_MANY":
                    self._save_1tom_join(fields_to_join, sj_oid_map)
                elif not self.summary_fields:
                    self._save_1to1_join(fields_to_join, sj_oid_map)
                else:
                    self._save_join_stats(fields_to_join, sj_oid_map)
        except Exception as err:
            LOGGER.debug(f"Join failed due to {str(err)}")
            raise ToolExit from err
        finally:
            self.clean()
