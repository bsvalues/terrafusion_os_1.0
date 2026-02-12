"""Implementation of AOL utilities."""
# Allow using format for messaging. pylint: disable=W1202
# noqa. pylint: disable=import-error
# pylint: disable=logging-fstring-interpolation
import locale
import json
import logging
import os
from re import match
from typing import Tuple, Union, Optional, Any, Dict, List
import math
import unicodedata as ud
from datetime import datetime

import asyncio
import functools

import arcpy
import arcpy.management
import arcpy.analysis
from arcpy.da import SearchCursor, UpdateCursor  # type: ignore

from convert_spatial_units import convert_areal_units, convert_linear_units, dd_to_km_ratio
from tessellate.tessellations import (TessellationFactory, SquareTessellation,
                                      TriangleTessellation, HexagonTessellation,
                                      TransverseHexagonTessellation,
                                      DiamondTessellation)

from .pacommon import (PALayer, PAFeatureLayer, PAOutputFeatureLayer,
                       PAOutputName, PAEnvironment)
from .palog import LogUtils, ToolExit
from .paglobals import (CALFIELD_PY_METHOD, DEFAULT_AREA_VF, DEFAULT_LENGTH_VF,
                        SUPPORTED_STATS, SUPPORTED_STAT_FIELD_TYPE,
                        FQ_FIELD_NAMES, DEFAULT_LAYER_NAME)
from .aolutils import AOLUtils


# need to set this for other non-english os
locale.setlocale(locale.LC_ALL, '')

__all__ = ["FieldUtils", "AnalysisUtils", "TessellationUtils", "PALayerUtils",
           "GeomCalcUtils"]

LOGGER = LogUtils.setup_logger(__name__)


class FieldUtils:
    """Class module with field related functionalities.

    Methods
    -------
        create_shape_area_field(input_layer: Any, units: str, area_field_alias: str)
            Add shape area field to the layer with specified units.
        create_shape_length_field(input_layer: Any, units: str)
            Add shape length field to the layer with specified units.
        create_o2o_field_mappings(join_layer: PAFeatureLayer, target_layer: PAFeatureLayer,
                                  summary_fields: List)
        verify_field_exists(input_layer: Any, field_name: str, fields: Optional[List],
                            field_types: Optional[List])
            Verify if a certain field exists.
        get_field_name(field_list: List, field_name: str)
            Get the exact name of a field from a list of fields.
        update_changed_field_names(fields: str, changed_field_names: Union[dict, str],
                                   is_multivalue: bool, is_stats_field: bool)
            Update the fields value with changed field names.
        get_unique_field_name(fields: List, field_name: str, field_alias: str)
            Return a two items tuple where the first item is new field name and the
            second item is the new field alias.
        get_fields_types(field_names: List[str], fields: List[arcpy.Field])
            Return a list of string where each string represents the type of the field.
        replace_geom_vf(sum_fields: List, layer: PAFeatureLayer)
            Replace the geometry virtual fields from the list of summary fields.
        correct_fq_name(orig_name: str, field_names: Dict, is_enterprise: bool)
            Return the fully qualified field name in ArcObject.

    """
    @staticmethod
    def create_shape_area_field(
        input_layer: Any,
        units: str = "",
        area_field_alias: str = ""
    ) -> str:
        """Add shape Area field.

        Args:
            input_layer: a dataset where the shape area field is going to be added.
            units: area units (default is "").
            area_field_alias: alias name of area field (default is "").
        Returns:
            The name of the created shape area field.
        Raises:
            No exceptions.

        """
        with arcpy.EnvManager(extent=None):
            if isinstance(input_layer, PALayer):
                desc = input_layer.description
                input_layer = input_layer.data
            else:
                desc = arcpy.Describe(input_layer)

            shape_field_name = "AnalysisArea"

            if not units or units.lower() == "metric":
                units = "SquareKilometers"
            elif units.lower() == "english":
                units = "SquareMiles"

            # define units
            if "Square" not in units.capitalize() and units not in ["Acres", "Hectares"]:
                units = "{}{}".format("Square", units)
            if not area_field_alias:
                area_field_alias = "Area in {}".format(units)
                area_field_alias = area_field_alias.replace("Square", "Square ")

            # Verify whether to calculate geodesic area for WGS_1984
            input_shp_fname = desc.shapeFieldName  # type: ignore
            if AnalysisUtils.use_geodesic(desc_fc=desc, input_fc=input_layer):
                expression = "!{}.geodesicArea@{}!".format(input_shp_fname, units)
            else:
                expression = "!{}.area@{}!".format(input_shp_fname, units)

            # Add field and calculate value
            if FieldUtils.verify_field_exists(input_layer, shape_field_name):
                arcpy.management.AlterField(input_layer, shape_field_name, new_field_alias=area_field_alias)
            else:
                arcpy.management.AddField(input_layer, shape_field_name,
                                          "DOUBLE", "#", "#", "#", area_field_alias)

            arcpy.management.CalculateField(input_layer, shape_field_name, expression,
                                            CALFIELD_PY_METHOD)
            return shape_field_name

    @staticmethod
    def create_shape_length_field(
        input_layer: Any,
        units: str = "Kilometers"
    ) -> str:
        """Add shape Length field.

        Args:
            input_layer: a dataset where the shape length field is going to be added.
            units: units of length.
        Returns:
            Name of the length field.
        Raises:
            No exceptions.

        """
        with arcpy.EnvManager(extent=None):
            if isinstance(input_layer, PALayer):
                desc = input_layer.description
                input_layer = input_layer.data
            else:
                desc = arcpy.Describe(input_layer)

            if not units or units.lower() == "metric":
                units = "Kilometers"
            elif units.lower() == "english":
                units = "Miles"

            shape_field_name = "AnalysisLength"
            shape_field_alias = "Length in {}".format(units)

            # Verify whether to calculate geodesic area for WGS_1984
            input_shp_fname = desc.shapeFieldName  # type: ignore
            if AnalysisUtils.use_geodesic(desc_fc=desc, input_fc=input_layer):
                expression = "!{}.geodesicLength@{}!".format(input_shp_fname, units)
            else:
                expression = "!{}.length@{}!".format(input_shp_fname, units)

            # Add field and calculate value
            if FieldUtils.verify_field_exists(input_layer, shape_field_name):
                arcpy.management.AlterField(input_layer, shape_field_name, new_field_alias=shape_field_alias)
            else:
                arcpy.management.AddField(input_layer, shape_field_name, "DOUBLE", "#", "#", "#", shape_field_alias)

            arcpy.management.CalculateField(input_layer, shape_field_name, expression,
                                            CALFIELD_PY_METHOD)
            return shape_field_name

    @staticmethod
    def verify_field_exists(
        input_layer: Any,
        field_name: str,
        fields: Optional[List] = None,
        field_types: Optional[List] = None
    ) -> bool:
        """Check if a field exists.

        Args:
            input_layer: input dataset where a certain field is check against.
            field_name: field name to check against.
            fields: a list of fields to check against. input_layer can be empty if fields is specified.
            field_types: a list of string represents the specific types to check against.
        Returns:
            True if a field with the specified name and/or types can be found from the layer. False otherwise.
        Raises:
            No exceptions.

        """
        if not fields:
            if isinstance(input_layer, PALayer):
                input_data = input_layer.data
            else:
                input_data = input_layer
            fields = AOLUtils.list_fields(input_data, field_name)

        if not fields:
            return False

        if field_types:
            field_types = [tp.lower() for tp in field_types]

        for field in fields:
            if field.name.lower() == field_name.lower():
                if field_types:
                    if field.type.lower() in field_types:
                        return True
                else:
                    return True
        return False

    @staticmethod
    def get_field_name(
        field_list: List,
        field_name: str
    ) -> str:
        """Get the exact field name.

        Args:
            field_list: a list of arcpy.Field instance.
            field_name: name of the field to search for.
        Returns:
            A string with the exact field name matched. If no match field is found, return the field_name as it is.
        Raises:
            No errors.

        """
        for field in field_list:
            if field.name.lower() == field_name.lower():
                return field.name
        return field_name

    @staticmethod
    def update_changed_fieldnames(
        fields: str,
        changed_field_names: Union[dict, str],
        is_multivalue: bool = False,
        is_stats_field=False
    ):
        """Update fields with changed_field_names property.

        Args:
            fields: field parameter, can be a single, multiple value or "field stats" values.
            changed_field_names: a dictionary keyed by the original field name and valued by the changed field name.
            is_multivalue: is the parameter type multivalue.
            is_stats_field: is the parameter accept stats fields eg. ["xx sum", "yy avg"] or ["xx remove",
            "yy rename zz"].
        Returns:
            List of the fields with value updated.
        Raises:
            No Exceptions.

        """
        if fields and changed_field_names:
            if not isinstance(changed_field_names, dict):
                changed_field_names = json.loads(changed_field_names)
            if is_multivalue:
                field_split_char = " " if is_stats_field else ";"
                # workaround to replace last value
                fields = "{};".format(fields)
                for field, changed_field in changed_field_names.items():  # type: ignore
                    field = "{}{}".format(field, field_split_char)
                    if field in fields:
                        changed_field = "{}{}".format(changed_field, field_split_char)
                        fields = fields.replace(field, changed_field)
                # remove workaround
                fields = fields.strip(";")
                return fields
            else:
                if fields in changed_field_names:
                    fields = changed_field_names[fields]  # type: ignore
                    return fields
        return fields

    @staticmethod
    def create_unique_field_name(
        fields: List,
        field_name: str,
        field_alias: str = "",
        len_limit: Optional[int] = None
    ) -> Tuple:
        """Create field name/alias that is unique in the given list of fields.

        Args:
            fields: a list of Field object or a list of str represents the field name.
            field_name: name of the desired field.
            field_alias: name of the desired field alias. field_alias is the same
            as the field_name if it is empty.
            len_limit: the length limitation of the unique field name generated. If
            len_limit is None, then there is no limitation on unique field length.
            Default is None.
        Returns:
            a two items tuple where the first item is new field name and the second
            item is the new field alias.

        """
        if not field_alias.strip():
            field_alias = field_name

        field_names = []
        for fld in fields:
            if isinstance(fld, str):
                field_names.append(fld.lower())
            else:
                field_names.append(fld.name.lower())

        if len_limit and len(field_name) > len_limit:
            field_name = field_name[0: len_limit]

        i = 1
        new_field_name = field_name
        new_field_alias = field_alias
        while (new_field_name.lower() in field_names):
            if len_limit is None:
                new_field_name = f"{field_name}_{i}"
                new_field_alias = f"{field_alias} {i}"
            else:
                end_pos = (i // 10) + 2
                new_field_name = f"{field_name[0 : -end_pos]}_{i}"
                new_field_alias = f"{field_alias} {i}"
            i += 1
        return new_field_name, new_field_alias

    @staticmethod
    def get_summary_aliasname(
        field_name: str,
        summary_stats: str
    ) -> str:
        """Get the alias name of a summary field"""
        sum_text = {"Min": "Minimum",
                    "Max": "Maximum",
                    "Mean": "Mean",
                    "Sum": "Sum",
                    "Stddev": "Standard Deviation",
                    "Std": "Standard Deviation"}

        if summary_stats.capitalize() == "Sum" and (field_name.lower().startswith("area") or field_name.lower().startswith("length")):
            split_field_name = field_name.split("_")
            if len(split_field_name) == 2:
                (shape_type, units) = split_field_name
                units = units.replace("Square", "Square ")
                return f"Summarized {shape_type} in {units}"

        if summary_stats.capitalize() in sum_text:
            return "{} {}".format(sum_text[summary_stats.capitalize()], field_name)
        else:
            return "{} {}".format(summary_stats, field_name)

    @staticmethod
    def update_uniq_fieldname(
        field_mappings: arcpy.FieldMappings,
        field_to_val: arcpy.Field
    ) -> None:
        """Update the name/alias name of a field to be unique in the fieldMappings."""
        i = 0
        while (field_mappings.findFieldMapIndex(field_to_val.name) >= 0):  # type: ignore
            i += 1
            field_to_val.name = "{0}_{1}".format(field_to_val.name, i)
            field_to_val.aliasName = "{0} {1}".format(field_to_val.aliasName, i)

    @staticmethod
    def create_o2o_field_mappings(
        join_layer: PAFeatureLayer,
        target_layer: PAFeatureLayer,
        summary_fields: Optional[List],
        return_field_name_only: bool = False,
        mapped_geom_fields: Optional[Dict] = None
    ) -> Tuple:
        """Create field mappings for the output.

        Args:
            join_layer: layer that is used as the input of join for spatialJoin.
            Usually has shapeType as Point.
            target_layer: layer that is used as the input of target for spatialJoin.
            Usually has shapeType as Polygon.
            summary_fields: a list with summary field information.
        Returns:
            A FieldMappings object with fields from join and target layers.

        """
        new_summary_fields = []
        field_mappings = arcpy.FieldMappings()
        field_mappings.addTable(target_layer.layer)
        if summary_fields:
            for sum_field in summary_fields:
                if isinstance(sum_field, dict):
                    sum_field_name = sum_field["onStatisticField"]
                    stats_type = sum_field["statisticType"]
                else:
                    sum_field_name = sum_field[0]
                    stats_type = sum_field[1]

                new_field_map = arcpy.FieldMap()
                new_field_map.addInputField(join_layer.layer, sum_field_name)
                # Assign merge rule for FieldMap
                merge_stat_rule = "stddev" if stats_type == "std" else stats_type
                new_field_map.mergeRule = merge_stat_rule
                # Assign name and alias name for output field
                stype = "STD" if stats_type.lower() == "stddev" else stats_type.upper()
                output_field = new_field_map.outputField
                if mapped_geom_fields and output_field.name.upper() in mapped_geom_fields:
                    orig_fname = mapped_geom_fields[output_field.name.upper()]
                    output_field.name = f"{stype}_{orig_fname}"
                    output_field.aliasName = FieldUtils.get_summary_aliasname(orig_fname,
                                                                              stats_type)
                else:
                    output_field.name = f"{stype}_{output_field.name}"
                    output_field.aliasName = FieldUtils.get_summary_aliasname(sum_field_name,
                                                                              stats_type)
                # Check if stats field name is usable
                FieldUtils.update_uniq_fieldname(field_mappings, output_field)
                # Assign type for output field
                curr_field = AOLUtils.list_fields(join_layer.layer, sum_field_name)[0]
                if stats_type.capitalize() in ["Stddev", "Mean", "Std", "Sum"]:
                    output_field.type = "Double"
                    # Need to explicitly set the precision and scale for integer type, otherwise the
                    # carry-over precision and scale is going to cause publishing issue if the local
                    # result save in_memory.
                    if curr_field.type in ["SmallInteger", "Integer"]:
                        output_field.precision = 0
                        output_field.scale = 0
                else:
                    output_field.type = curr_field.type
                new_field_map.outputField = output_field
                field_mappings.addFieldMap(new_field_map)
                if not return_field_name_only:
                    new_summary_fields.append((output_field.name,
                                               output_field.aliasName,
                                               output_field.type))
                else:
                    new_summary_fields.append(output_field.name)

        return (field_mappings, new_summary_fields)

    @staticmethod
    def get_relative_field_indexes(
        fields_of_interest: List,
        fields: List
    ) -> List:
        """Get the relative indexes of the fields.

        Args:
            fields_of_interest: a list of items with the information of fields of interest.
            fields: a list of items with field information to look from.
        Returns:
            A list of integers with the relative index in the fields.
        Raises:
            ValueError if any of the fields_of_interest is not in the list of fields.

        """
        foi_names = []
        for foi in fields_of_interest:
            if isinstance(foi, str):
                foi_names.append(foi.lower())
            elif isinstance(foi, arcpy.Field):
                foi_names.append(foi.name.lower())
            else:
                LOGGER.error("Invalid value for field of interests.")
                raise ValueError
        base_field_names = []
        for field in fields:
            if isinstance(field, str):
                base_field_names.append(field.lower())
            elif isinstance(field, arcpy.Field):
                base_field_names.append(field.name.lower())
            else:
                LOGGER.error("Invalid value of base fields.")
                raise ValueError
        indexes = []
        for foi in foi_names:
            indexes.append(base_field_names.index(foi))
        return indexes

    @staticmethod
    def verify_summary_fields(
        fields: List[arcpy.Field],
        summary_fields: List[Dict],
        update_st: bool,
        spatial_rel: bool = False
    ) -> bool:
        """verify if the summary fields information are valid.

        Args:
            fields: a list of arcpy.Field object.
            summary_fields: a list summary field information. The item can be in
            the format of dict (i.e., {"onStatisticField":"Value","statisticType":"SUM"})
            for JoinField tool, and it can also be in the format of tuple (i.e.
            ("Value", "SUM")) for summarize tools.
            update_st: True if needs to update the stats type (change stats type
            to lower case and change stddev as std).
        Returns:
            True if the verification all pass and False otherwise.

        """
        fields_info = {f.name.lower(): f.type for f in fields}
        is_valid = True
        for i, sfi in enumerate(summary_fields):
            if isinstance(sfi, dict):
                field_name = sfi.get("onStatisticField", "")
                sum_stats = sfi.get("statisticType", "")
            else:
                (field_name, sum_stats) = sfi  # type: ignore

            if sum_stats.lower() not in SUPPORTED_STATS + ["count"]:
                LOGGER.error(100006, extra={"message_ID": 100006, "summary": sum_stats,
                                            "fieldName": field_name})
                is_valid = False
            if field_name.lower() not in fields_info:
                LOGGER.error(100004, extra={"message_ID": 100004, "fieldName": field_name})
                is_valid = False
            elif sum_stats.lower() != "count" and fields_info[field_name.lower()] not in SUPPORTED_STAT_FIELD_TYPE:
                LOGGER.error(100005, extra={"message_ID": 100005, "fieldName": field_name})
                is_valid = False
            # currently only support min/max calculation of Date field type
            elif (
                fields_info[field_name.lower()] in ("Date", "DateOnly", "TimeOnly", "TimestampOffset")
                and sum_stats.lower() not in ["min", "max"]
            ):
                LOGGER.error(100006, extra={"message_ID": 100006, "summary": sum_stats,
                                            "fieldName": field_name})
                if fields_info[field_name.lower()] == "Date":
                    LOGGER.error(110340, extra={"message_ID": 110340, "summary": sum_stats})
                is_valid = False
            elif (
                spatial_rel
                and fields_info[field_name.lower()] == "TimestampOffset"
            ):
                LOGGER.error(100353, extra={"message_ID": 100353})
                return False

            if update_st:
                sum_stats = sum_stats.lower()
                if sum_stats == "stddev":
                    sum_stats = "std"
                if isinstance(sfi, dict):
                    summary_fields[i]["statisticType"] = sum_stats
                else:
                    summary_fields[i] = (field_name, sum_stats)  # type: ignore

        return is_valid

    @staticmethod
    def get_field_from_layer(
        field_name: str,
        layer: PAFeatureLayer,
        return_field_object: bool = False
    ) -> Union[arcpy.Field, str]:
        """Performs a case insensitive lookup of field name in the layer fields
        and return the field name in the same case as it exists on the layer, or, optionally, the field object.
        If the field name does not exists, returns an empty string.

        Args:
            field_name: name of the field to search.
            layer: an instance of PAFeaturelayer based on which the fields is searched.
            return_field_object: return the arcpy.Field object if true, otherwise return
            the name of the field that is found.
        Returns:
            either an object of arcpy.Field or the name of the field.
        Raises:
            ToolExit if no field is found.

        """
        field_info = FieldUtils.get_field_by_name(layer.fields, field_name)
        if field_info is None:
            LOGGER.error(f"Unable to find a field named {field_name}")
            raise ToolExit
        return field_info if return_field_object else field_info.name

    @staticmethod
    def get_fields_types(
        field_names: List[str],
        fields: List[arcpy.Field]
    ) -> List[str]:
        """Look for the types based on the name of the fields.

        Args:
            field_names: a list of strings represents the name of the field of interest.
            fields: a list of arcpy.Field objects where the type is going to be queried from.
        Returns:
            A list of strings where each item represents the type of the fiels passed in as field names.
        Raises:
            ValueError if a field with the specific name can't be found from the fields.

        """
        field_types = []
        field_info = {field.name.lower(): field.type for field in fields}
        for fname in field_names:
            if fname.lower() not in field_info:
                LOGGER.debug(f"Can't find a field named {fname}")
                raise ValueError
            field_types.append(field_info[fname.lower()])
        return field_types

    @staticmethod
    def get_newest_fieldname(
        fields: List[arcpy.Field],
        base_field_name: str
    ) -> Optional[str]:
        """Get the field name that matched the base_field_name but created lastly.

        Args:
            fields (List[arcpy.Field]): a list of arcpy.Field object.
            base_field_name (str): the basic field name to search from.

        Returns:
            Optional[str]: if one or more than one field were found that matched the base_field_name is found,
            then the one that created the last were returned. None is returned if no field was found.
        """
        base_field_name = base_field_name.lower()
        matched_field_names = []
        for field in fields:
            if (
                field.name.lower() == base_field_name
                or match("^{0}\_\d".format(base_field_name), field.name.lower())
            ):
                matched_field_names.append(field.name)

        if len(matched_field_names) > 0:
            matched_field_names.sort()
            return matched_field_names.pop()
        else:
            return None

    @staticmethod
    def rename_fields(
        layer_to_rename: PALayer,
        fields: List[Dict]
    ):
        """Rename a list of fields of a PALayer object.

        Args:
            layer_to_rename (PALayer): a PALayer object where fields need to be renamed.
            fields (List[Dict]): a list of fields to perform renaming. Each item of the list
            should be a Dict with keys of [originalFieldName, newFieldName, newFieldAlias]
        """
        for field_info in fields:
            args = [layer_to_rename.data, field_info["originalFieldName"],
                    field_info["newFieldName"]]
            if field_info.get("newFieldAlias"):
                args.append(field_info["newFieldAlias"])
            arcpy.management.AlterField(*args)

    @staticmethod
    def get_fields_by_names(fields: List[arcpy.Field], foi_names: List[str]) -> List:
        fois = [None] * len(foi_names)
        foi_names_lower = [fname.lower() for fname in foi_names]
        for field in fields:
            if field.name.lower() in foi_names_lower:
                index = foi_names_lower.index(field.name.lower())
                fois[index] = field  # type: ignore
        return fois

    @staticmethod
    def get_field_by_name(
        fields: List[arcpy.Field],
        field_name: str
    ) -> Optional[arcpy.Field]:
        """Get the arcpy.Field object by name in a case insensitive way.
        Args:
            fields (List[arcpy.Field]): a list of arcpy.Field object.
            field_name (str): name of the field to search from.
        Returns:
            Optional[arcpy.Field]: The arcpy.Field object with the name property match the field_name.
            None if no field found from fields with the specified field_name.
        """
        for field in fields:
            if field.name.lower() == field_name.lower():
                return field
        return None

    @staticmethod
    def replace_geom_vf(
        sum_fields: List,
        layer: PAFeatureLayer
    ) -> Optional[Dict]:
        """Replace the geometry fields.

        Args:
            sum_fields (List): a list of summary fields. Summary fields from different
            tools can be in different format. For example, the summary fields for
            dissolveBoundaries is in the format of ["fieldName SUM", ...], and that
            for AggregatePoints/SummarizeWithin/SummarizeNearby is [(fieldName, SUM),...],
            and that for the JoinFeatures is [{"onStatisticField": "fieldName",
            "statisticType": "SUM"},...].
            layer (PAFeatureLayer): an instance of PAFeatureLayer where the statistics are
            dervied from.

        Returns:
            Optional[Dict]: an optional dictionary. None if no summary field is
            updated. Otherwise a dictionary keyed by the actual field name in
            layer and valued by the original field name passed in.
        """
        if not layer or not sum_fields or layer.is_table_view:
            return None

        gf_map = {}
        tfield_names = [f.name.upper() for f in AOLUtils.list_fields(layer.layer)]
        LOGGER.debug(f"tfield_names: {tfield_names}")
        for i, sfield in enumerate(sum_fields):
            if isinstance(sfield, str):
                tmp_sfield = sfield.split(" ")
                format = 1
            elif isinstance(sfield, list) or isinstance(sfield, tuple):
                tmp_sfield = sfield
                format = 2
            else:
                tmp_sfield = (sfield.get("onStatisticField", ""),
                              sfield.get("statisticType", ""))
                format = 3

            if (
                (tmp_sfield[0].upper() in DEFAULT_AREA_VF
                 or tmp_sfield[0].upper() in DEFAULT_LENGTH_VF)
                and tmp_sfield[0].upper() not in tfield_names
            ):
                db_fld = DEFAULT_AREA_VF if tmp_sfield[0].upper() in DEFAULT_AREA_VF else DEFAULT_LENGTH_VF
                for fld in db_fld:
                    if fld in tfield_names:
                        if format == 1:
                            sum_fields[i] = sum_fields[i].replace(tmp_sfield[0], fld)
                        elif format == 2:
                            sum_fields[i] = (fld, sum_fields[i][1])
                        else:
                            sum_fields[i]["onStatisticField"] = fld
                        gf_map[fld] = tmp_sfield[0]
        return gf_map

    @staticmethod
    def alter_field_type(
        lyr_to_alter: Union[PAFeatureLayer, str],
        fld_to_alter: str,
        new_fld_type: str,
        fld_precision: Optional[int] = None,
        fld_length: Optional[int] = None,
        fld_scale: Optional[int] = None
    ) -> bool:
        """alter the type of an existing field

        Args:
            lyr_to_alter (Union[PAFeatureLayer, str]): a target layer to alter field
            type from.
            fld_to_alter (str): name of the field to alter.
            new_fld_type (str): new field type to alter to.

        Returns:
            bool: True if the alter succeeds and False otherwise.
        """
        supported_fld_type = ["Double", "Guid", "Integer", "Single",
                              "SmallInteger", "String"]
        if isinstance(lyr_to_alter, PAFeatureLayer):
            fields = lyr_to_alter.fields
            data2alter = lyr_to_alter.data
        else:
            fields = AOLUtils.list_fields(lyr_to_alter)
            data2alter = lyr_to_alter
        target_field = FieldUtils.get_field_by_name(fields, fld_to_alter)  # type: ignore
        if target_field and target_field.type == new_fld_type:
            return True
        elif target_field is None:
            LOGGER.debug(f"Unable to find field named {fld_to_alter}.")
            return False

        if new_fld_type not in supported_fld_type:
            LOGGER.debug(f"Alter to {new_fld_type} field type is currently not supported.")
            return False

        try:
            (new_fname, new_falias) = FieldUtils.create_unique_field_name(fields, fld_to_alter)  # type: ignore
            arcpy.management.AddField(data2alter, new_fname, new_fld_type,
                                      field_precision=fld_precision,
                                      field_scale=fld_scale,
                                      field_length=fld_length,
                                      field_alias=new_falias)
            arcpy.management.CalculateField(data2alter, new_fname,
                                            expression=f"!{fld_to_alter}!")
            arcpy.management.DeleteField(data2alter, fld_to_alter)
            arcpy.management.AlterField(data2alter, new_fname, new_field_name=fld_to_alter)
            return True
        except Exception as err:
            LOGGER.debug(f"Unable to alter {fld_to_alter} due to {str(err)}")
            return False

    @staticmethod
    def correct_fq_name(orig_name: str, field_names: Dict, is_enterprise: bool) -> str:
        """get the fully qualified field name in AO

        Args:
            orig_name (str): the original field name from client side.
            field_names (Dict): a dictionary keyed by the upper case of the field name
            and valued by the field name/aliasName. If it is valued by field name, the
            field name needs to be fetched from the database directly (in terms of
            <db name>.<user name>.<table name>).
            is_enterprise (bool): True if the function run in enterprise environment
            and False otherwise.

        Returns:
            str: the fully qualified field name in AO.
        """
        if  (
            orig_name.upper() in FQ_FIELD_NAMES
            and orig_name.upper() not in field_names
            and is_enterprise
        ):
            for fname in field_names:
                if "." in fname:
                    lpart = fname.split(".")[-1]
                    if lpart.upper() == orig_name.upper():
                        return field_names[fname]
        return orig_name

    @staticmethod
    def get_fq_field_name(orig_name: str, layer2chk: PALayer, is_enterprise: bool) -> str:
        """Get the fully qualified field name if there is any.

        Args:
            orig_name (str): the original field name to check.
            layer2chk (PALayer): an instance of PALayer to check against.
            is_enterprise (bool): True if it is running in enterprise environment
            and False otherwise.

        Returns:
            str: the original field name if it is not running in enterprise environment
            or the original field name is not a fully-qualified field. Return the fully
            qualified field name otherwise.
        """
        if not is_enterprise or orig_name.upper() not in FQ_FIELD_NAMES:
            return orig_name

        if layer2chk:
            fnames = {fld.name.upper(): fld.name for fld in arcpy.ListFields(layer2chk.layer)}  # type: ignore
            for fn in fnames:
                if "." in fn:
                    lpart = fn.split(".")[-1]
                    if lpart == orig_name.upper():
                        return fnames[fn]
        return orig_name


class AnalysisUtils:
    """Class module with analysis related functionalities.

    Methods
    -------
        use_geodesic(desc_fc: Any, input_fc: Any, sp_ref: Optional[arcpy.SpatialReference])
            True to use geodesic approach based on the inputs and False otherwise.
        get_shape_type_code(shape_info: Union[PALayer, str])
            Get a numeric number associate with the shape_type.
        get_units(portal_description: Dict, polygon_units: bool)
            Get the portal specific units.
        list_mgdb_fcs(mgdb: str):
            Get a list of all the feature classes inside of a mobile geodatabase.
        is_srs_equal(sparef1: arcpy.SpatialReference, sparef2: arcpy.SpatialReference) -> bool:
            Check if two spatial reference equals each other. 
        
    """

    @staticmethod
    def use_geodesic(
        desc_fc: Any = None,
        input_fc: Any = None,
        sp_ref: Optional[arcpy.SpatialReference] = None
    ) -> bool:
        """Provide at least one of the parameters describe, feature class or spatial reference.

        Args:
            desc_fc: description object of a feature class (default to None).
            input_fc: path of a feature class.
            sp_ref: an instance of arcpy.SpatialReference (default to None).
        Returns:
            A boolean indicating whether to useGeodesic or not.
        Raises:
            PATool error will be raised if both descFC and inputFC are None.

        """
        if desc_fc is None and input_fc is None and sp_ref is None:
            LOGGER.error("Provide at least one of the parameters for useGeodesic method")
            raise ToolExit

        if sp_ref is None:
            if desc_fc is None:
                desc_fc = AOLUtils.describe(input_fc)

            sp_ref = desc_fc.spatialReference

        try:
            if sp_ref and (sp_ref.GCSCode != 0 or sp_ref.GCS):
                return True
            else:
                return False
        except Exception as err:  # no-qa. pylint: disable=broad-except
            LOGGER.debug('use_geodesic raised an exception because %s', str(err))
            return False

    @staticmethod
    def get_shape_type_code(shape_info: Union[PALayer, str]) -> int:
        """Get the shape type code based on the shape type string.

        Args:
            shape_info: can be either an instance of PALayer or str.
        Returns:
            A dictionary decribing the output.
        Raises:
            No exception.

        """
        if isinstance(shape_info, PALayer):
            shape_type = shape_info.shapeType  # type: ignore
        else:
            shape_type = shape_info

        if shape_type == 'esriGeometryPolyline' or shape_type == "Polyline":
            return 2
        elif shape_type == 'esriGeometryPolygon' or shape_type == "Polygon":
            return 3
        else:
            return 1

    @staticmethod
    def initialize_output_layer(
        feat_count: Optional[int]=None,
        name: str="",
        hw_wkspc: Optional[str]=None,
        mk_uniq_name: bool=False,
        specified_out_path: Optional[str]=None
    ) -> PAOutputFeatureLayer:
        """Initialize an empty output layer.

        Args:
            feat_count (Optional[int]): a ball park of the total number of features in the output.
            name (str): name of the table in the intermediate database.
            hw_wkspc (Optional[str]): the workspace hardwired to use. If None, then
            the workspace is still determined by the count of features.
            mk_uniq_name: True to call CreateUniqueName to make the name unique and
            False to use the name as it is.
            specified_out_path: abosolute path specified for the output.

        Returns:
            PAOutputFeatureLayer: an empty output layer pointing to the desired path.
        """
        if specified_out_path:
            if not arcpy.Exists(specified_out_path):
                return PAOutputFeatureLayer(specified_out_path)
            elif mk_uniq_name:
                new_path = AOLUtils.create_unique_name(os.path.dirname(specified_out_path),
                                                       os.path.basename(specified_out_path))
                return PAOutputFeatureLayer(new_path)
            else:
                # in model builder environment, this means overwrite the output
                LOGGER.debug(f"Unable to initilize the output at {specified_out_path} since it already exists.")
                return PAOutputFeatureLayer(specified_out_path)
        else:
            if hw_wkspc:
                wkspc = hw_wkspc
            elif feat_count:
                wkspc = AOLUtils.get_output_wkspc(feat_count)
            else:
                wkspc = arcpy.env.scratchGDB  # type: ignore

            if mk_uniq_name:
                fc_path = AOLUtils.create_unique_name(name, wkspc)
            else:
                fc_path = os.path.join(wkspc, name)
            LOGGER.debug(f"initialized the output layer at: {fc_path}")
            return PAOutputFeatureLayer(fc_path)  # type: ignore
    
    @staticmethod
    def get_hw_wkspc(output_name: PAOutputName) -> Optional[str]:
        """Get the hardwired workspace. This function is added with the change of
        output type from gpstring to actual gp type. So classbreaks renderer is not
        supported with output stored in memory when dumping out as feature collection.
        So this function is added to set the hardwired output workspace for that situation.

        Args:
            output_name (PAOutputName): output_name property of the PATool.

        Returns:
            Optional[str]: scratchGDB if the output is feature collection and the tool
            ran in non analysis studio environment. None otherwise.
        """
        if (
            not output_name.create_service
            and (output_name.environment == PAEnvironment.ENTERPRISE
            or output_name.environment == PAEnvironment.ONLINE)
        ):
            return AOLUtils.get_scratch_wkspc()
        return None

    @staticmethod
    def get_units(
        portal_description: Optional[Dict],
        polygon_units: bool = True
    ) -> str:
        """Get units from user profile.

        Args:
            patool: an instance of PATool.
            polygon_units: a flag indicating whether the geometry is a polygon or not.
        Returns:
            No returns.
        Raises:
            No exceptions.

        """
        if not portal_description:
            units = "metric"
        else:
            try:
                user = portal_description.get("user", {})
                units = user.get("units")
                if not units:
                    units = portal_description.get("units", "metric")
                    LOGGER.debug("units from org: {}".format(units))
            except (AttributeError, KeyError):
                LOGGER.debug("Unable to get units from userprofile. Use the metric as units instead.")
                units = "metric"

        if polygon_units:
            return "SquareKilometers" if units.lower() == "metric" else "SquareMiles"
        else:
            return "Kilometers" if units.lower() == "metric" else "Miles"
    
    @staticmethod
    def get_units_in_mb(polygon_units: bool = True) -> str:
        """Get units for result in model builder environment (technically can be
        tested without in server environment)

        Args:
            polygon_units (bool, optional): True if the units is for polygon
            and False for polyline. Defaults to True.

        Returns:
            str: the units for the result.
        """
        try:
            portal_desc = arcpy.GetPortalDescription()
        except ValueError:
            LOGGER.debug("Unable to get portal description.")
            portal_desc = None
        return AnalysisUtils.get_units(portal_desc, polygon_units)

    @staticmethod
    def get_convert_factor_to_meter(dist_units: str) -> float:
        """Get the conversion factor from the input distance units to meter.

        Args:
            dist_units: a string indicates the distance units to convert. It needs to
            be spelled out (i.e., METERS, KILOMETERS, CENTIMETERS etc).
        Returns:
            A float represents the conversion factor.
        Raises:
            ValueError if the input distance units is not supported.

        """
        dist_convert_lookup = {"METERS": 1.0,
                               "KILOMETERS": 1000.0,
                               "FEET": 0.3048,
                               "MILES": 1609.344,
                               "YARDS": 0.9144,
                               "INCHES": 0.0254,
                               "CENTIMETERS": 0.01}
        if dist_units.upper() not in dist_convert_lookup:
            LOGGER.debug(f"Unsupported distance units of {dist_units}.")
            raise ValueError

        return dist_convert_lookup[dist_units.upper()]

    @staticmethod
    def wrap_fcname_from_lyrname(lyr_name: str, wkspc: str) -> str:
        """Create a valid local feature class path from a lyrname.

        Args:
            lyr_name (str): the name of a feature layer.
            wkspc (str): the work space where the feature class is created.

        Returns:
            str: the path of the feature class in the wkspc.
        """
        valid_name = []
        for lname in lyr_name:
            if lname.isdigit() or lname.isalpha():
                valid_name.append(lname)
            else:
                valid_name.append("_")
        valid_name = "".join(valid_name).lstrip("_")
        return AOLUtils.create_unique_name(valid_name, wkspc)

    @classmethod
    def list_mgdb_fcs(cls, mgdb: str) -> List:
        """Get a list of feature classes in the mobile geodatabase (.geodatabase).

        Args:
            mgdb (str): the absolute path of the mobile geodatabase.

        Returns:
            List: all the feature classes within the mobile geodatabase.
        """
        with arcpy.EnvManager(workspace=mgdb):
            fcs = arcpy.ListFeatureClasses()
            datasets = arcpy.ListDatasets("", "")
            LOGGER.debug(f"datasets: {datasets}")
            if datasets:
                for tmp_ds in datasets:  # type: ignore
                    fcs.extend(arcpy.ListFeatureClasses("", "", tmp_ds))  # type: ignore

            return fcs  # type: ignore

    @classmethod
    def list_mgdb_tbls(cls, mgdb: str, include_sys_tbls: bool) -> List:
        """Get a list of tables in the mobile geodatabase (.geodatabase).

        Args:
            mgdb (str): the absolute path of the mobile geodatabase.
            include_sys_tbls (bool): True to include system tables (i.e., GDB_ServiceItems)
            and False otherwise.

        Returns:
            List: a list of tables in the mobile geodatabase.
        """        
        with arcpy.EnvManager(workspace=mgdb):
            tbls = arcpy.ListTables()
            if not include_sys_tbls:
                i = 0
                tb_len = len(tbls)  # type: ignore
                while (i < tb_len):
                    if "GDB_ServiceItems" in tbls[i]:  # type: ignore
                        tbls.pop(i)  # type: ignore
                    i += 1
            return tbls  # type: ignore

    @staticmethod
    def contain_non_latin_chars(name: str) -> bool:
        """[summary]

        Args:
            name (str): a string to check.

        Returns:
            bool: True if the string contains non latin characters and False otherwise.
        """
        # inspired from http://stackoverflow.com/questions/3094498/how-can-i-check-if-a-python-unicode-string-contains-non-western-letters
        for chr in name:
            if chr.isalpha() and "LATIN" not in ud.name(chr):  # type: ignore
                return True
        return False

    @staticmethod
    def pairwise_intersect(input_lyrs: List[str],
                           output_path: str,
                           join_attrs: Optional[str] = None,
                           cluster_tolerance: Optional[str] = None,
                           output_type: Optional[str] = None):
        """Perform arcpy's PairwiseIntersect function."""
        if join_attrs and cluster_tolerance and output_type:
            arcpy.analysis.PairwiseIntersect(input_lyrs, output_path, join_attrs,
                                             cluster_tolerance, output_type)
        else:
            arcpy.analysis.PairwiseIntersect(input_lyrs, output_path)
        output_fc_count = AOLUtils.get_feature_count(output_path)
        LOGGER.debug(f"output_fc_count: {output_fc_count}")
        if output_fc_count == 0:
            # Re-try with the local copy (to address an geometry issue logged
            # https://devtopia.esri.com/ArcGISPro/geometry/issues/2159)
            descs = [arcpy.Describe(input_lyr) for input_lyr in input_lyrs]
            local_inputs = []
            for input_lyr, dsc in zip(input_lyrs, descs):
                if hasattr(dsc, "catalogPath") and dsc.catalogPath.startswith("http"):  # type: ignore
                    LOGGER.debug(f"catalogPath of {input_lyr} is {dsc.catalogPath}")  # type: ignore
                    local_copy = AOLUtils.create_unique_name("localCopy", "scratchgdb")
                    LOGGER.debug(f"Make a local copy of {input_lyr} at {local_copy}")
                    arcpy.management.CopyFeatures(input_lyr, local_copy)
                    local_inputs.append(local_copy)
                else:
                    local_inputs.append(input_lyr)
            LOGGER.debug(f"local_inputs: {local_inputs}")
            if arcpy.Exists(output_path):
                arcpy.management.Delete(output_path)
            if join_attrs and cluster_tolerance and output_type:
                arcpy.analysis.PairwiseIntersect(local_inputs, output_path, join_attrs,
                                                 cluster_tolerance, output_type)
            else:
                arcpy.analysis.PairwiseIntersect(local_inputs, output_path)

    @staticmethod
    def is_srs_equal(
        sparef1: arcpy.SpatialReference,
        sparef2: arcpy.SpatialReference
    ) -> bool:
        """Check if two SpatialReference objects are the same.

        Args:
            sparef1 (arcpy.SpatialReference): an instance of SpatialReference.
            sparef2 (arcpy.SpatialReference): an instance of SpatialReference.

        Returns:
            bool: True if the two SpatialReference are the same and False otherwise.
        """
        if sparef1 == sparef2:
            return True
        elif sparef1.factoryCode == sparef2.factoryCode:
            return True
        else:
            return sparef1.exportToString() == sparef2.exportToString()

    @staticmethod
    def date_to_iso(
        date_time: Optional[datetime],
        precision: str = "ms"
    ) -> str:
        """Export date to iso format.

        Args:
            date_time (Optional[datetime]): an instance of datetime.
            precision (str, optional): precision to keep for the export string.
            Defaults to "ms".

        Returns:
            str: the iso-formatted datetime string.
        """
        if not date_time:
            return ""
        else:
            date_str = date_time.isoformat()
            if date_str[-7] == "." and precision == "ms":
                return date_str[:-3]
            elif date_str[-7] == "." and precision == "s":
                return date_str[:-7]
            else:
                return date_str

    @staticmethod
    def erase(
        in_features: str,
        erase_features: str,
        out_features: str,
        cluster_tolerance: Optional[str] = None 
    ):
        """Wrapper of arcpy.analysis.Erase function.

        Args:
            in_features (str): the input feature class or layer.
            erase_features (str): the features that will be used to erase conincident features in the input.
            out_features (str): the path to store the output features.
            cluster_tolerance (Optional[str], optional): The minimum distance separating all feature coodinates.
            Defaults to None.

        Raises:
            AO_100359: if Erase failed with 000438 error.
        """
        try:
            arcpy.analysis.Erase(in_features, erase_features, out_features, cluster_tolerance)
        except arcpy.ExecuteError as err:
            if ("000438" in str(err)):
                LOGGER.error(100359, extra={"message_ID": 100359})
            else:
                LOGGER.debug(f"Unexpected error in Erase operation due to {str(err)}")
            raise err


class TessellationUtils:
    """Class module with utility functions used to get Tessellation feature count.

    Methods
    -------
        calculate_area_from_distance(distance: float, shape_type: str, length_unit: str)
            Calculate the area of a certain shape from the edge length.
        get_areal_size(size_value: str, shape_type: str, size_unit: str)
            Get size in areal format.
        create_proj_extent(extent_input: Any)
            Create GCS extent.
        initialize_tessellation(in_extent: arcpy.Extent, in_shape_type: str, in_shape_size: str, in_coord_sys)
            Create an instance of Tessellation.

    """

    SUPPORTED_AREAL_UNITS = ["squarekilometers", "hectares", "squaremeters", "squaremiles",
                             "acres", "squareyards", "squarefeet", "squareinches"]
    SUPPORTED_DISTANCE_UNITS = ["nauticalmiles", "miles", "yards", "feet", "kilometers", "meters"]

    @staticmethod
    def calculate_area_from_distance(
        distance: float,
        shape_type: str,
        length_unit: str
    ) -> str:
        """Calculate the area of a certain shape from the length of edge.

        Args:
            distance: numeric number represents the height of a certain geometry.
            shape_type: a string indicates the type of shape. Currently only supports "Triangle", "Square", "Hexagon",
            "TraverseHexagon", and "Diamond".
            length_unit: unit of length.
        Returns:
            A string in the format of areal unit (i.e., 100 SquareMiles).
        Raises:
            ValueError if the shape_type is invalid.

        """
        if length_unit.lower() == "nauticalmiles":
            length_unit = "Miles"
            distance = distance * 1.15

        if shape_type.lower() == "square":
            return "{} Square{}".format((distance * distance), length_unit)
        elif shape_type.lower() == "diamond":
            # diamond generated is actually a rotated square. Distance specified represents the diagonal length
            return "{} Square{}".format((distance * distance) / 2, length_unit)
        elif shape_type.lower() in ["hexagon", "transversehexagon", "transverse_hexagon"]:
            # distance for Hexagon is actually the distance between the parallel edges
            return "{} Square{}".format((distance * distance * (math.sqrt(3) / 2)), length_unit)
        elif shape_type.lower() == "triangle":
            # distance represents the height of the equal lateral triangle
            return "{} Square{}".format((distance * distance / math.sqrt(3)), length_unit)
        else:
            LOGGER.error("Invalid shape_type of {}.".format(shape_type))
            raise ValueError

    @staticmethod
    def get_areal_size(
        size_value: float,
        shape_type: str,
        size_unit: str
    ) -> str:
        """Get the size in the areal format.

        Raises:
            ValueError if size_unit is not supported.

        """
        if size_unit == "#" or size_value == "#":
            return "#"
        # AggregatePoints/SummarizeWithin only accepts distance units. This only applies to GenerateTessellations
        elif size_unit.lower() in TessellationUtils.SUPPORTED_AREAL_UNITS:
            return "{0} {1}".format(size_value, size_unit)
        elif size_unit.lower() in TessellationUtils.SUPPORTED_DISTANCE_UNITS:
            return TessellationUtils.calculate_area_from_distance(size_value, shape_type, size_unit)
        else:
            LOGGER.error("Unsupported unit of {}.".format(size_unit))
            raise ValueError

    @staticmethod
    def create_proj_extent(
        extent_input: Any
    ) -> Tuple:
        """Create the extent in GCS.

        Args:
            extent_input: can be either an instance of arcpy.Extent or a feature layer.
        Returns:
            A two items tuple with the first item as the projected extent and the second item as the original spatial
            reference of the input_extent.
        Raises:
            No exceptions.

        """
        if isinstance(extent_input, arcpy.Extent):
            template_poly_sr = extent_input.spatialReference
            gcs_sr = template_poly_sr.GCS.exportToString()
            template_poly_extent = extent_input.projectAs(gcs_sr)
        else:
            desc = AOLUtils.describe(extent_input)
            projected_poly_extent = ""

            template_poly_sr = desc.spatialReference
            gcs_sr = template_poly_sr.GCS.exportToString()
            # If extent_layer is in PCS, project it to GCS.
            if template_poly_sr.PCSName:
                template_poly_gcs = AOLUtils.create_unique_name("templatePolyGCS", "scratchgdb")
                # template_poly_gcs = os.path.join(arcpy.env.scratchGDB, "templatePolyGCS")  # type: ignore
                with arcpy.EnvManager(outputCoordinateSystem=gcs_sr, extent=None):
                    arcpy.management.CopyFeatures(extent_input, template_poly_gcs)
                desc = AOLUtils.describe(template_poly_gcs)
            elif desc.FIDSet:  # type: ignore
                # generate tessellation doesn't support selection
                copy_template = AOLUtils.create_unique_name("copyTemplate", "scratchgdb")
                with arcpy.EnvManager(extent=None):
                    arcpy.management.CopyFeatures(extent_input, copy_template)
                template_polygon = copy_template
                desc = AOLUtils.describe(template_polygon)
            else:
                # could be GCS data: use minimum bounding polygon to honor definition queries
                # https://devtopia.esri.com/WebGIS/arcgis-portal-app/issues/24800
                min_bounding_polygon = r"in_memory\\mbgPoly"
                _ = arcpy.management.MinimumBoundingGeometry(extent_input, min_bounding_polygon, "ENVELOPE",
                                                             "ALL", None)
                min_bounding_polydesc = AOLUtils.describe(min_bounding_polygon)
                if min_bounding_polydesc.extent:
                    desc = min_bounding_polydesc
            template_poly_extent = desc.extent

        try:
            srtext = arcpy.gp._arc_object.getcustompcs(template_poly_extent, gcs_sr)
            if srtext:
                srtext = srtext.replace("\"", "\'")
                srtext = srtext.replace("''", "'")
                LOGGER.debug(srtext)
                projection_sr = arcpy.SpatialReference()
                projection_sr.loadFromString(srtext)
            else:
                projection_sr = arcpy.SpatialReference(54034)
        except:  # noqa. pylint: disable=bare-except
            projection_sr = arcpy.SpatialReference(54034)
        projected_poly_extent = template_poly_extent.projectAs(projection_sr)
        return (projected_poly_extent, template_poly_sr)

    @staticmethod
    def create_h3hex_extent(
        extent_input: Any
    ) -> arcpy.Extent:
        """Create extent for H3_Hexagon tessellation generation.

        Args:
            extent_input (Any): input to generate extent from.

        Returns:
            arcpy.Extent: an instance of arcpy.Extent.
        """
        # H3_Hexagon generated should be in WGS84 to match uber output.
        target_sr = arcpy.SpatialReference(4326)
        if isinstance(extent_input, arcpy.Extent):
            if AnalysisUtils.is_srs_equal(extent_input.spatialReference,
                                          target_sr):
                return extent_input
            else:
                return extent_input.projectAs(target_sr)
        else:
            min_bounding_polygon = r"in_memory\\mbgPoly"
            _ = arcpy.management.MinimumBoundingGeometry(extent_input, min_bounding_polygon,
                                                         "ENVELOPE",
                                                         "ALL", None)
            desc = AOLUtils.describe(min_bounding_polygon)
            extent = desc.extent
            if AnalysisUtils.is_srs_equal(extent.spatialReference,
                                          target_sr):
                return extent
            else:
                return extent.projectAs(target_sr)

    @staticmethod
    def initialize_tessellation(
        in_extent: arcpy.Extent,
        in_shape_type: str,
        in_shape_size: str,
        in_coord_sys: Optional[arcpy.SpatialReference] = None
    ) -> Any:
        """Create an instance of tessellation.

        Args:
            in_extent: an instance of arcpy.Extent.
            in_shape_type: a string represents the shape type of the tessellation.
            in_shape_size: an areal shape size.
            in_coord_sys: the spatial reference based on which the tessellations will be generated.
        Returns:
            An instance of tessellation.

        """
        shape_dict = {'SQUARE': SquareTessellation,
                      'TRIANGLE': TriangleTessellation,
                      'HEXAGON': HexagonTessellation,
                      'TRANSVERSE_HEXAGON': TransverseHexagonTessellation,
                      'DIAMOND': DiamondTessellation}

        area, areal_unit = in_shape_size.split(" ")
        area = float(area.replace(",", "."))

        if area <= 0.0:
            LOGGER.error("Invalid area value of {}.".format(area))
            raise ValueError

        if not in_extent:
            LOGGER.error("Unable to generate tessellations with extent missing.")
            raise ValueError

        try:
            ucs = arcpy.SpatialReference()
            ucs.loadFromString(u'{B286C06B-0879-11D2-AACA-00C04FA33C20};-450359962737.05 -450359962737.05 10000;#;#;0.001;#;#;IsHighPrecision')

            # Area of regular polygon to radius formula
            area_sq_m = convert_areal_units(area, 'squaremeters', areal_unit)
            temp_side = shape_dict[in_shape_type.upper()].shape.sides
            tempd = math.sqrt(3) if temp_side % 3 == 0 else 2
            radius_m = math.sqrt((4 * (area_sq_m / temp_side)) / tempd)

            # output SR is that of SR param, else extent.SR, else Unknown
            if isinstance(in_coord_sys, arcpy.SpatialReference) and in_coord_sys.name:
                project_to: arcpy.SpatialReference = in_coord_sys
            elif (in_extent.spatialReference is not None and in_extent.spatialReference.name != ""):
                project_to = in_extent.spatialReference
            else:
                project_to = ucs

            # extent's SR
            if (in_extent.spatialReference is not None and in_extent.spatialReference.name != ""):
                project_from = in_extent.spatialReference
            else:
                project_from = ucs

            # unit conversion
            if (
                (project_from.linearUnitName == project_to.linearUnitName
                 and project_from.linearUnitName in ["Meter", ""])
                or (areal_unit == "Unknown")
            ):
                # No conversion needed
                size = radius_m
            elif project_from.type == "Geographic":
                # Convert from Decimal Degrees
                ratio = dd_to_km_ratio(in_extent)
                size = convert_linear_units(radius_m * 1000 * ratio, 'kilometers', project_to.linearUnitName)
            else:
                # Regular conversion of units
                size = convert_linear_units(radius_m, 'meters', project_to.linearUnitName)

            if ((project_to.type == "Geographic") and (areal_unit not in ["Unknown", ""])):
                # Convert to Decimal Degrees
                ratio = 1 / dd_to_km_ratio(in_extent)
                size = radius_m / 1000 * ratio

            # temp_sr = project_to if project_to.name != "Unknown" else ""
            tessellation = TessellationFactory.make_tessellation(shape_dict[in_shape_type.upper()],
                                                                 float(size), in_extent)
            return tessellation

        except (ValueError, RuntimeError, KeyError, SystemError) as err:
            LOGGER.error("Unable to initialize tessellation due to {}.".format(str(err)))
            raise RuntimeError


class PALayerUtils:
    """Utility module with functions for PALayer.

    Methods
    -------
        copy_data_to_path(palayer: `PAFeatureLayer`, out_path: `str`, select_features_only: `bool`)
            Copy the data from the palayer to a specified path.
        make_local_copy(layer: `PAFeatureLayer`, local_path: `str`, selected_features_only: `bool`,
                        nocopy_if_local: `bool`)
            Copy the data locally and create a PAFeatureLayer object from the local copy.
        convert_multiparts_to_single(input_layer: `PAFeatureLayer`, wkspc: `Optional[str]`,
                                      wrap_output_as_layer: `bool`):
            Convert multipart features to singlepart features.

    """

    @staticmethod
    def copy_data_to_path(
        palayer: PAFeatureLayer,
        out_path: str,
        selected_features_only: bool
    ) -> None:
        """Copy the data of the PAFeatureLayer to a specified path."""
        if not palayer:
            LOGGER.error("Unable to copy empty data.")
            raise ToolExit

        try:
            if palayer.is_table_view:
                arcpy.management.CopyRows(palayer.data, out_path)
            elif selected_features_only:
                arcpy.management.CopyFeatures(palayer.layer, out_path)
            else:
                arcpy.gp._arc_object.SimpleCopy(palayer.data, out_path)
        except arcpy.ExecuteError as err:
            if LogUtils.check_arcpyerror_bycode(err, 160212):
                LOGGER.error(100285, extra={"message_ID": 100285, "inputLayer": palayer.layer_name})

            raise

    @staticmethod
    def make_local_copy(
        layer: PAFeatureLayer,
        local_path: str,
        selected_features_only: bool,
        nocopy_if_local: bool
    ) -> PAFeatureLayer:
        """Copy the data locally and create a PAFeaturelayer object.

        Args:
            layer: An instance of PAFeatureLayer.
            local_path: Absolute path to where the data is going to be copied to.
            select_features_only: True if only the selected features are copied.
            All the features are copied over if False.
            nocopy_if_local: return the layer by itself if this parameter is set
            to true and the original data is from a local source. Will copy the
            original data no matter what if False.
        Returns:
            An instance of PAFeatureLayer with data points to the local_path.

        """
        if not layer:
            LOGGER.debug(f"No local copy created since {layer} is empty.")
            return layer

        if nocopy_if_local:
            if layer.data_type == "CatalogPath" or layer.esri_laal_catalogpath.strip():
                LOGGER.debug(f"No local copy created since data is from local source already.")
                return layer
        PALayerUtils.copy_data_to_path(layer, local_path, selected_features_only)
        # Create a layer instance with replaceable properties carry over.
        new_layer = PAFeatureLayer(local_path, None, False, False)
        new_layer.layer_name = layer.layer_name
        return new_layer

    @staticmethod
    def create_local_copy(
        layer: PAFeatureLayer,
        local_path: str,
        nocopy_if_local: bool
    ) -> PAFeatureLayer:
        """Make a local copy of the layer. The original OID is honored via this approach.

        Args:
            layer (PAFeatureLayer): an instance of PAFeatureLayer to create a copy from.
            local_path (str): local path to store the copy.
            nocopy_if_local (bool): True will not make a local copy if layer is created
            from local data already and False otherwise.

        Returns:
            PAFeatureLayer: an instance of PAFeatureLayer created from the local copy.
        """
        if not layer:
            LOGGER.debug(f"No local copy created since {layer} is empty.")
            return layer

        if nocopy_if_local:
            if layer.data_type == "CatalogPath" or layer.esri_laal_catalogpath.strip():
                LOGGER.debug(f"No local copy created since data is from local source already.")
                return layer

        if layer.is_table_view:
            if isinstance(layer.data, arcpy.RecordSet):
                LOGGER.debug("data is RecordSet already.")
                data = layer.data
            else:
                # construct an instance of RecordSet will not honor the selection
                data = arcpy.RecordSet(layer.data)
                ccount = int(arcpy.management.GetCount(data).getOutput(0))
                if ccount > layer.count:
                    oids = []
                    with arcpy.da.SearchCursor(layer.data, ["OID@"]) as curr:
                        for row in curr:
                            oids.append(str(row[0]))
                    desc = arcpy.Describe(data)
                    query = f"{desc.OIDFieldName} in ({','.join(oids)})"
                    LOGGER.debug(f"{query=}")
                    data = arcpy.RecordSet(layer.data, where_clause=query)
        else:
            data = arcpy.FeatureSet(layer.layer)

        data.save(local_path)
        new_layer = PAFeatureLayer(local_path, None, False, False)
        new_layer.layer_name = layer.layer_name
        return new_layer


    @staticmethod
    def get_layer_name(layer: "PAFeatureLayer") -> str:
        """Get the layer name to be used in messages/labels.

        Args:
            layer (PAFeatureLayer): an instance of PAFeatureLayer to fetch layer_name property from.

        Returns:
            str: the layer_name to use.
        """
        if layer.layer_name != DEFAULT_LAYER_NAME:
            return layer.layer_name
        elif layer.metadata:
            return layer.metadata.get("defaultLayerName", layer.metadata.get("parameterName", layer.layer_name))
        return layer.layer_name

    @staticmethod
    def convert_multiparts_to_single(
        input_layer: "PAFeatureLayer",
        wkspc: Optional[str] = None,
        wrap_output_as_layer: bool = True
    ) -> Union["PAFeatureLayer", str]:
        """Converts multipart features to single features

        Args:
            input_layer: a PAFeatureLayer object which contains multi-part features.
            wkspc: a string specifies workspace to store the converted single-part points. If the wkspc
            is not specified, then it will be dumped to either scratchGDB or "in_memory" which depends
            on the total # of features.
            wrap_output_as_layer: returns the single-part output feature class as a PAFeatureLayer if True,
            otherwise, return the path of the single-part output feature class.
        Returns:
            A str represents the full path of the output single-part feature class if wrap_output_as_layer is
            set to False. Otherwise, returns the single-part output feature class as a PAFeatureLayer.
        Raises:
            No expection is raised but a warning is raised showing that the conversion happened.

        """
        if not wkspc:
            wkspc = AOLUtils.get_output_wkspc(input_layer.count)

        new_layer = AOLUtils.create_unique_name("singleFeatures", wkspc)  # type: ignore
        LOGGER.debug(f"Single-part points created at: {new_layer}")
        lyr_name = PALayerUtils.get_layer_name(input_layer)
        LOGGER.warning(100048, extra={"message_ID": 100048,
                                      "inputLayer": lyr_name})
        arcpy.management.MultipartToSinglepart(input_layer.layer, new_layer)
        if wrap_output_as_layer:
            new_pa_lyr = PAFeatureLayer(new_layer,
                                        for_extract=False,
                                        max_download_feature_count=None)
            new_pa_lyr.layer_name = lyr_name
            return new_pa_lyr
        return new_layer


#region Unused Invstigation

class GeomCalcUtils:

    MAX_CONC_PROCS = 10

    def __init__(
        self,
        input_layer: Union[PALayer, str],
        units: str = "",
        area_field_alias: str = "",
        calc_area: bool = True
    ):
        if not units or units.lower() == "metric":
            self.units = "SquareKilometers"
        elif units.lower() == "english":
            self.units = "SquareMiles"
        else:
            self.units = units

        # define units
        if "Square" not in self.units.capitalize() and units not in ["Acres", "Hectares"]:
            self.units = f"Square{self.units}"
        
        if not area_field_alias:
            self.area_field_alias = (f"Area in {self.units}").replace("Square", "Square ")

        if isinstance(input_layer, PALayer):
            desc = input_layer.description
            self.input_layer = input_layer.data  # type: ignore
        else:
            desc = arcpy.Describe(input_layer)
            self.input_layer = input_layer
        self.t_field = "AanalysisAreaX" if calc_area else "AnalysisLengthX"
        self.use_geodesic = False
        if AnalysisUtils.use_geodesic(desc_fc=desc, input_fc=self.input_layer):
            self.use_geodesic = True
        
        if FieldUtils.verify_field_exists(self.input_layer, self.t_field):
            arcpy.management.AlterField(self.input_layer, self.t_field,
                                        new_field_alias=self.area_field_alias)
        else:
            arcpy.management.AddField(self.input_layer, self.t_field,
                                      "DOUBLE", "#", "#", "#",
                                      self.area_field_alias)
        self.id_geom_val = {}
    
    def calc(self) -> str:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self._pull_geom_val(loop))
        with UpdateCursor(self.input_layer, ["OID@", self.t_field]) as u_curr:
            for row in u_curr:
                row[1] = self.id_geom_val.get(row[0])
                u_curr.updateRow(row)
        return self.t_field
    
    def calc_geom(self, geom: arcpy.Geometry, geodesic: bool, units: str):
        if geodesic:
            return geom.getArea("PRESERVE_SHAPE", units)
        else:
            return geom.getArea("PLANAR", units)

    async def _geom_calc(
        self,
        event_loop: asyncio.AbstractEventLoop,
        obj_id: int,
        geom: arcpy.Geometry,
        geodesic: bool,
        units: str
    ):
        geo_v = await event_loop.run_in_executor(None,
                                                 functools.partial(self.calc_geom,
                                                                   geom,
                                                                   geodesic,
                                                                   units))
        self.id_geom_val[obj_id] = geo_v

    async def _pull_geom_val(
      self,
      event_loop: asyncio.AbstractEventLoop  
    ):
        with SearchCursor(self.input_layer, ["OID@", "SHAPE@"]) as s_curr:
            fcnt = 0
            tasks = []
            for row in s_curr:
                if fcnt < self.MAX_CONC_PROCS:
                    (oid, geom) = row
                    tasks.append(self._geom_calc(event_loop,
                                                 oid, geom,
                                                 self.use_geodesic,
                                                 self.units))
                    fcnt += 1
                else:
                    await asyncio.gather(*tasks)
                    tasks = []
                    (oid, geom) = row
                    tasks.append(self._geom_calc(event_loop,
                                                 oid, geom,
                                                 self.use_geodesic,
                                                 self.units))
                    fcnt = 1
            await asyncio.gather(*tasks)

    @staticmethod
    def create_shape_area_fieldx(
        input_layer: Any,
        units: str = "",
        area_field_alias: str = ""
    ) -> str:
        with arcpy.EnvManager(extent=None):
            if isinstance(input_layer, PALayer):
                desc = input_layer.description
                input_layer = input_layer.data
            else:
                desc = arcpy.Describe(input_layer)

            shape_field_name = "AnalysisAreaX"
            if not units or units.lower() == "metric":
                units = "SquareKilometers"
            elif units.lower() == "english":
                units = "SquareMiles"
            
            # define units
            if "Square" not in units.capitalize() and units not in ["Acres", "Hectares"]:
                units = "{}{}".format("Square", units)
            if not area_field_alias:
                area_field_alias = "Area in {}".format(units)
                area_field_alias = area_field_alias.replace("Square", "Square ")
            
            # input_shp_fname = desc.shapeFieldName  # type: ignore
            oid_fname = desc.OIDFieldName  # type: ignore
            geodesic = False
            if AnalysisUtils.use_geodesic(desc_fc=desc, input_fc=input_layer):
                geodesic = True

            areas = {}
            units = units.lower().replace("_", "").replace("int", "")
            with SearchCursor(input_layer, [oid_fname, "SHAPE@"]) as s_curr:
                for row in s_curr:
                    if geodesic:
                        areas[row[0]] = row[1].getArea('PRESERVE_SHAPE', units)
                    else:
                        areas[row[0]] = row[1].getArea('PLANAR', units)

            if FieldUtils.verify_field_exists(input_layer, shape_field_name):
                arcpy.management.AlterField(input_layer, shape_field_name, new_field_alias=area_field_alias)
            else:
                arcpy.management.AddField(input_layer, shape_field_name,
                                          "DOUBLE", "#", "#", "#", area_field_alias)

            with UpdateCursor(input_layer, [oid_fname, shape_field_name]) as u_curr:
                for row in u_curr:
                    row[1] = areas.get(row[0])
                    u_curr.updateRow(row)
            return shape_field_name

#endregion