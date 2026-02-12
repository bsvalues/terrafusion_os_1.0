"""Module to provide public functions/interfaces for all summary tools."""
# use modules from common package. noqa. pylint: disable=import-error
import os
from abc import abstractmethod
from collections import namedtuple
from typing import Optional, List, Union, Tuple

import arcpy
import arcpy.management

from common import (PAExecutor, PAFeatureLayer, LogUtils, FieldUtils, ToolExit,
                    PAOutputFeatureLayer, TessellationCreatorMixin, PopupInfo,
                    AnalysisUtils, CALFIELD_PY_METHOD, SUPPORTED_GB_FIELD_TYPE,
                    AOLUtils, GraduatedColorsRenderer)


__all__ = ["SummarizeExecutor", "SummaryFieldUtils", "SummaryFieldsInfo", "SummaryInputValidateMixin"]

LOGGER = LogUtils.setup_logger(__name__)


def create_tessellation(summary_lyr: PAFeatureLayer,
                        output_path: Optional[str],
                        bin_type: str,
                        bin_size: Union[int, float, str] = "#",
                        bin_size_units: str = "#") -> str:
    tess_creator = TessellationCreatorMixin(bin_type, bin_size, bin_size_units, summary_lyr, None)
    if not tess_creator.validate_tess_inputs():
        LOGGER.debug("Invalid inputs for tessellation.")
        raise ToolExit

    if output_path is None:
        output_path = AOLUtils.create_unique_name("binPolygons", AOLUtils.get_scratch_wkspc())

    try:
        tess_creator.create(output_path)
    except Exception as err:
        LOGGER.error(100255, extra={"message_ID": 100255})
        raise ToolExit from err
    return output_path


FieldInfo = namedtuple("FieldInfo", ["name", "alias"])


class SummaryFieldsInfo:
    """Class to keep track of the fields in calculation and used it in tool for symbology/publish."""
    def __init__(self):
        # name of the field that will be used for symbology
        self.shapeStatField: Optional[FieldInfo] = None
        # name of the fields that will be used for pop-up
        self.summaryFields: Optional[List[FieldInfo]] = None
        # name of the fields that will be used for pop-up
        self.minMajorityFields: Optional[List[str]] = None
        # name of the field that will be used for relation def
        self.layerJoinIDField: Optional[str] = None
        # name of the field that will be used for relation def
        self.tblJoinIDField: Optional[str] = None
        # original summary fields
        self.originalSummaryFields: Optional[List] = None
        # percent shape
        self.percShpField: Optional[FieldInfo] = None

    def get_summary_field_names(self) -> Optional[List]:
        return None if not self.summaryFields else [f.name for f in self.summaryFields]

    def append_summary_field(self, finfo: FieldInfo):
        if self.summaryFields is None:
            self.summaryFields = [finfo]
        else:
            self.summaryFields.append(finfo)


class SummarizeExecutor(PAExecutor):

    def __init__(self, summary_lyr: PAFeatureLayer,
                 summary_boundary_lyr: Optional[PAFeatureLayer],
                 output_lyr: PAOutputFeatureLayer,
                 groupby_stat_output: Optional[PAOutputFeatureLayer],
                 summary_fields: Optional[List],
                 groupby_field: Optional[str],
                 calc_minority_majority: bool,
                 calc_percent_shape: bool,
                 keep_boundaries_with_no_features: bool,
                 call_from_desktop: bool = False):
        """Parent class of all summarize tools executors (i.e., APExecutor, SWExecutor, SNExecutor).

        Args:
            summary_lyr (PAFeatureLayer): a PAFeatureLayer object to calculate summary from.
            summary_boundary_lyr (Optional[PAFeatureLayer]): a PAFeatureLayer object with the boundary.
            output_lyr (PAOutputFeatureLayer): a PAOutputFeatureLayer to save the summary output.
            groupby_stat_output (Optional[PAOutputFeatureLayer]): a PAOutputFeatureLayer to store the groupby stats.
            summary_fields (Optional[List]): a list of tuples where the first item is the name of the field and the
            second item is the type of stats to collect.
            groupby_field (Optional[str]): name of the groupby field.
            calc_minority_majority (bool): True to calculate the minority and majority values based on the
            groupby field.
            calc_percent_shape (bool): True to calculate the percent shape of a certain groupby category
            within a certain summary boundary polygon.
            keep_boundaries_with_no_features (bool): True to keep all boundary features in the output even if
            there is no summary feature (point) fall into. False to only keep boundary features that have summary
            features fall within.
            call_from_desktop (bool): True if the logic is called from desktop summarize tools and False otherwise.
        """
        self.summary_lyr = summary_lyr
        self.summary_boundary_lyr = summary_boundary_lyr
        self.output_lyr = output_lyr
        self.groupby_stat_output = groupby_stat_output
        self.summary_fields = SummaryFieldUtils.unpack_summary_fields(summary_fields)
        self.groupby_field = groupby_field
        self.calc_minority_majority = calc_minority_majority
        self.calc_percent_shape = calc_percent_shape
        self.keep_boundaries_with_no_features = keep_boundaries_with_no_features
        self.fields_info = SummaryFieldsInfo()
        self.fields_info.originalSummaryFields = summary_fields
        self.intermediate_output = []
        self.call_from_desktop = call_from_desktop

    def validate_parameters(self):
        raise NotImplementedError

    def execute(self):
        self.calculate_statistics()

    @abstractmethod
    def calculate_statistics(self):
        raise NotImplementedError


class SummaryFieldUtils:

    @classmethod
    def unpack_summary_fields(cls, summary_fields: Optional[Union[List, arcpy.ValueTable]]) -> Optional[List]:
        if summary_fields is None:
            return []

        updated_summary_fields = []
        if isinstance(summary_fields, list):
            for sum_field in summary_fields:
                if isinstance(sum_field, (list, tuple)) and len(sum_field) == 2:
                    updated_summary_fields.append(sum_field)
                elif isinstance(sum_field, str):
                    tmp_field_info = sum_field.split(" ")
                    if len(tmp_field_info) == 2:
                        updated_summary_fields.append(tmp_field_info)
                    else:
                        LOGGER.debug("Unable to unpack the summary fields.")
                        raise ToolExit
                else:
                    LOGGER.debug("Unable to unpack the summary fields.")
                    raise ToolExit
        # in v2, summary_fields become type of ValueTable
        elif isinstance(summary_fields, arcpy.ValueTable):
            for row in range(summary_fields.rowCount):
                updated_summary_fields.append([summary_fields.getValue(row, 0),
                                               summary_fields.getValue(row, 1)])

        return updated_summary_fields

    @classmethod
    def validate_summary_fields(cls, summary_layer: PAFeatureLayer, summary_fields: List) -> bool:
        return FieldUtils.verify_summary_fields(summary_layer.fields,  # type: ignore
                                                summary_fields,
                                                update_st=True)

    @classmethod
    def validate_groupby_field(cls, summary_layer: PAFeatureLayer, groupby_field: str) -> bool:
        sum_fields_info = {f.name.lower(): f.type for f in summary_layer.fields}
        groupby_field = groupby_field.lower()
        if groupby_field in sum_fields_info:
            if sum_fields_info[groupby_field] not in SUPPORTED_GB_FIELD_TYPE:  # type: ignore
                LOGGER.error(100125, extra={"message_ID": 100125, "fieldName": groupby_field})
                return False
        else:
            LOGGER.error(100052, extra={"message_ID": 100052, "fieldName": groupby_field,
                                        "paramName": summary_layer.layer_name})
            return False
        return True

    @classmethod
    def get_summary_fields_by_stat(cls, summary_fields: List, stat_of_interest: List) -> List:
        fields_of_interest = []
        for (sum_field, stat_type) in summary_fields:
            if stat_type in stat_of_interest:
                fields_of_interest.append(sum_field)
        return fields_of_interest

    @classmethod
    def get_stats_field_to_update(cls, summary_fields: List,
                                  stat_of_interests: List = ["mean", "std"]) -> Tuple:
        (all_fieldnames, soi_fieldnames, raw_fieldnames, stat_types) = ([], [], [], [])
        for (field_name, stat_name) in summary_fields:
            tmp_fn = f"{stat_name}_{field_name}"
            if stat_name in stat_of_interests:
                soi_fieldnames.append(tmp_fn)
                raw_fieldnames.append(field_name)
                stat_types.append(stat_name)
            all_fieldnames.append(tmp_fn)
        return (all_fieldnames, soi_fieldnames, raw_fieldnames, stat_types)

    @classmethod
    def add_stat_shape_field(cls, input_layer: PAFeatureLayer, units: str):
        units_text = units.replace("Square", "Square ")
        if input_layer.shapeType == "Polyline":
            field_name = f"Length_{units}"
            expression = f"!{input_layer.shapeFieldName}.length@"
            field_alias = f"length in {units_text}"
        else:
            field_name = f"Area_{units}"
            expression = f"!{input_layer.shapeFieldName}.area@"
            field_alias = f"area in {units_text}"

        (field_name, field_alias) = FieldUtils.create_unique_field_name(input_layer.fields,
                                                                        field_name,
                                                                        field_alias)
        arcpy.management.AddField(input_layer.data, field_name, "DOUBLE", "#", "#", "#",
                                  field_alias, "NULLABLE", "NON_REQUIRED", "#")
        if AnalysisUtils.use_geodesic(input_layer.description):
            if field_name.lower().startswith("area"):
                expression = expression.replace("area", "geodesicArea")
            else:
                expression = expression.replace("length", "geodesicLength")
        expression = f"{expression}{units}!"
        arcpy.management.CalculateField(input_layer.data, field_name, expression,
                                        CALFIELD_PY_METHOD)
        return (field_name, field_alias)

    @classmethod
    def convert_summaryfields_toarray(cls, summary_fields: str) -> List:
        """Converts multivalue summary fields to a list where each item in the
        list is summary information of one field.

        Args:
            summary_fields (str): a string with concatenated fields of summary.

        Returns:
            List: a list where each item represents one summary field.
        """
        sum_fields = [sfield.strip("'").split() for sfield in summary_fields.split(';')]
        return [[sfield[0], sfield[1].capitalize()] for sfield in sum_fields]


class SummaryOutputHandler:

    def __init__(self, summary_output: PAOutputFeatureLayer,
                 groupby_stats_table: Optional[PAOutputFeatureLayer],
                 summary_lyr_name: str,
                 hex_grids: bool,
                 so_fields_info: SummaryFieldsInfo,
                 summary_lyr_shape_type: str,
                 groupby_field: Optional[str]):
        """Handler of summary output (i.e., set visualization and popup).

        Args:
            summary_output (PAOutputFeatureLayer): the summary output to process.
            groupby_stats_table (Optional[PAOutputFeatureLayer]): the groupby stats table to process.
            summary_lyr_name (str): layer name property of the input summary layer.
            hex_grids (bool): True if the boundary is tessellation and False otherwise.
            so_fields_info (SummaryFieldsInfo): an object of SummaryFieldsInfo with the fields used to setup the
            pop-up and symbology.
            summary_lyr_shape_type (str): the shape type of the input summary layer.
            groupby_field (Optional[str]): name of the groupby field.
        """
        self.summary_output = summary_output
        # refresh the fields property.
        self.summary_output._fields = AOLUtils.list_fields(self.summary_output.data)
        self.groupby_stats_table = groupby_stats_table
        if self.groupby_stats_table:
            self.groupby_stats_table._fields = AOLUtils.list_fields(self.groupby_stats_table.data)

        self.summary_lyr_name = summary_lyr_name
        self.hex_grids = hex_grids
        self.so_fields_info = so_fields_info
        self.summary_lyr_shape_type = summary_lyr_shape_type
        self.groupby_field = groupby_field

    @LogUtils.time_exec
    def _set_renderer(self):
        shp_stat_fname: str = self.so_fields_info.shapeStatField.name  # type: ignore
        LOGGER.debug(f"shapeStatField: {shp_stat_fname}")
        renderer = GraduatedColorsRenderer(self.summary_output, shp_stat_fname)
        self.summary_output.set_drawing(renderer)

    @LogUtils.time_exec
    def _set_popup(self):
        popup_info = self._set_summary_output_popup()
        if self.groupby_stats_table and self.groupby_stats_table.count > 0:
            relationship_name = "groupBySummary"
            if (
                self.so_fields_info
                and self.so_fields_info.layerJoinIDField
                and self.so_fields_info.tblJoinIDField
            ):
                self.summary_output.add_relationship(relationship_name, 1,
                                                    self.so_fields_info.layerJoinIDField,
                                                    is_origin=True)
                self.groupby_stats_table.add_relationship(relationship_name, 0,
                                                        self.so_fields_info.tblJoinIDField,
                                                        is_origin=False)
                self._set_groupby_stats_popup(popup_info, 0)
        self.summary_output.set_popup(popup_info, popup_info.title)

    def _add_field_to_popup(self, popup_info: PopupInfo, field: Optional[Union[arcpy.Field, str]],
                            label: Optional[str] = None,
                            visible: bool = True,
                            rel_table_id: Optional[int] = None):
        if isinstance(field, arcpy.Field):
            flabel = label if label is not None else field.aliasName
            if field.type.lower() == "double":
                if rel_table_id is not None:
                    popup_info.add_field_info(field.name, flabel, True, 4, visible=visible, rel_table_id=rel_table_id)
                else:
                    popup_info.add_field_info(field.name, flabel, True, 4, visible=visible)
            else:
                if rel_table_id is not None:
                    popup_info.add_field_info(field.name, flabel, visible=visible, rel_table_id=rel_table_id)
                else:
                    popup_info.add_field_info(field.name, flabel, visible=visible)
        elif isinstance(field, str):
            flabel = label
            if rel_table_id is not None and flabel is not None:
                popup_info.add_field_info(field, flabel, visible=visible, rel_table_id=rel_table_id)
            elif flabel is not None:
                popup_info.add_field_info(field, flabel, visible=visible)

    def _set_groupby_stats_popup(self, popup_info: PopupInfo, rel_table_id: int):
        if self.groupby_field and self.groupby_stats_table:
            gb_fn = FieldUtils.get_field_name(self.groupby_stats_table.fields, self.groupby_field)
            self._add_field_to_popup(popup_info, gb_fn, self.groupby_field, visible=False,
                                     rel_table_id=rel_table_id)

        if self.so_fields_info.percShpField and self.summary_lyr_shape_type != "Polygon" and self.groupby_field:
            self._add_field_to_popup(popup_info, self.so_fields_info.percShpField.name,
                                     self.so_fields_info.percShpField.alias,
                                     visible=False,
                                     rel_table_id=rel_table_id)
            title = f"{self.so_fields_info.percShpField.alias} by {self.groupby_field}"
            popup_info.add_media_info(title, [self.so_fields_info.percShpField.name], self.groupby_field,
                                      chart_type="piechart", rel_table_id=rel_table_id)

        if self.so_fields_info.shapeStatField and self.groupby_field:
            self._add_field_to_popup(popup_info, self.so_fields_info.shapeStatField.name,
                                     self.so_fields_info.shapeStatField.alias,
                                     visible=False, rel_table_id=rel_table_id)
            title = f"{self.so_fields_info.shapeStatField.alias} by {self.groupby_field}"

        if (
            self.so_fields_info.summaryFields
            and self.groupby_field
            and self.groupby_stats_table
        ):
            # has to use the real field name since the chart is linked to the table field in a case sensitive way.
            tmp_summary_fnames = self.so_fields_info.get_summary_field_names()
            if tmp_summary_fnames:
                gb_summary_fields = FieldUtils.get_fields_by_names(self.groupby_stats_table.fields, tmp_summary_fnames)
                for sfield in gb_summary_fields:
                    if sfield is not None:
                        self._add_field_to_popup(popup_info, sfield, visible=False, rel_table_id=rel_table_id)
                        if self.groupby_field:
                            title = f"{sfield.aliasName} by {self.groupby_field}"
                            popup_info.add_media_info(title, [sfield.name], self.groupby_field,
                                                      rel_table_id=rel_table_id)

    def _set_summary_output_popup(self) -> PopupInfo:
        popup_title = f"Summary of {self.summary_lyr_name}"
        popup_info = PopupInfo(popup_title)
        omit_field_names = [self.summary_output.shapeFieldName, self.summary_output.OIDFieldName,
                            "AnalysisArea"]
        if not self.so_fields_info.shapeStatField:
            LOGGER.debug("Unable to set summary output popop without shapeStatField.")
            raise ToolExit
        foi_names = [self.so_fields_info.shapeStatField.name]
        if self.so_fields_info.summaryFields:
            foi_names += self.so_fields_info.get_summary_field_names()  # type: ignore

        if self.so_fields_info.minMajorityFields:
            foi_names += self.so_fields_info.minMajorityFields

        fois = FieldUtils.get_fields_by_names(self.summary_output.fields, foi_names)
        self._add_field_to_popup(popup_info, fois[0])
        omit_field_names.append(self.so_fields_info.shapeStatField.name)

        if self.so_fields_info.summaryFields:
            summary_fois = fois[1: len(self.so_fields_info.summaryFields) + 1]
            for sfoi in summary_fois:
                self._add_field_to_popup(popup_info, sfoi)
            omit_field_names.extend(self.so_fields_info.get_summary_field_names())  # type: ignore

        if self.so_fields_info.minMajorityFields:
            minmaj_fois = fois[-len(self.so_fields_info.minMajorityFields):]
            for mmfoi in minmaj_fois:
                self._add_field_to_popup(popup_info, mmfoi)
            omit_field_names.extend(self.so_fields_info.minMajorityFields)

        for field in self.summary_output.fields:
            if field.name not in omit_field_names:
                label = field.aliasName.replace("_", " ")
                self._add_field_to_popup(popup_info, field, label)
        return popup_info

    def handle(self):
        self._set_renderer()
        self._set_popup()


class SummaryInputValidateMixin:
    """A mixin class in charge of validating summary input."""

    def validate_summary_boundary(self) -> bool:
        """Check if the summary boundary layer has polygon geometry.

        Raises:
            AO_100003: if the summary boundary layer's geometry is not polygon.

        Returns:
            bool: True if the summary boundary layer is valid and False otherwise.
        """
        if not self.summary_boundary_lyr or self.summary_boundary_lyr.shapeType != "Polygon":  # type: ignore
            LOGGER.error(100003, extra={"message_ID": 100003})
            return False

        return True

    def validate_summary_fields(self) -> bool:
        """Check if the summary fields is valid.

        Returns:
            bool: True if the summary fields are valid and False otherwise.
        """
        if not SummaryFieldUtils.validate_summary_fields(self.summary_lyr, self.summary_fields):  # type: ignore
            return False
        return True

    def validate_groupby_field(self) -> bool:
        """Check if the groupby field is valid.

        Returns:
            bool: True if the groupby field is valid and False otherwise.
        """
        if self.groupby_field and not SummaryFieldUtils.validate_groupby_field(self.summary_lyr,  # type: ignore
                                                                               self.groupby_field):  # type: ignore
            return False

        return True

    def _verify_units_field(self, shape_type: str, units: str) -> bool:
        """verify if the summary units for shape is valid.

        Args:
            shape_type (str): shapeType of the summary layer.
            units (str): user's input of the shp_stat_units.

        Returns:
            bool: True if the units is valid and False otherwise.
        """
        shape_type = shape_type.lower()
        if "point" in shape_type:
            return True
        valid_units = {"polyline": ["FEET", "KILOMETERS", "METERS", "MILES", "YARDS"],
                       "polygon": ["ACRES", "HECTARES", "SQUAREFEET", "SQUAREKILOMETERS",
                                   "SQUAREMETERS", "SQUAREMILES", "SQUAREYARDS"]}
        units = units.strip().upper()
        return True if units in valid_units[shape_type] else False

    def validate_sum_shape(self) -> bool:
        """Check if the sum_shape input is valid.

        Raises:
            AO_100019: if both sum_shape and summary_fields are empty.
            AO_100018: if the shp_stat_units are invalid and sum_shape is True.

        Returns:
            bool: True if the sum_shape and shp_stat_units are valid and False otherwise.
        """
        if not self.sum_shape and len(self.summary_fields) == 0:  # type: ignore
            LOGGER.error(100019, extra={"message_ID": 100019})
            return False

        if self.sum_shape:  # type: ignore
            if not self._verify_units_field(self.summary_lyr.shapeType, self.shp_stat_units):  # type: ignore
                LOGGER.error(100018, extra={"message_ID": 100018, "sumUnits": self.shp_stat_units,  # type: ignore
                                            "shapeType": self.summary_lyr.shapeType})  # type: ignore
                return False

        return True

    @classmethod
    def validate_dt_output(cls, output_path: str) -> bool:
        """validate if the output path is supported.

        Args:
            output_path (str): abolute path of where the output is going to be
            stored.

        Returns:
            bool: True if the output_path is supported and False otherwise.

        Raises:
            3396: if the output is not written to .gdb, .sde, or in_memory.
        """
        if (
            (".gdb" not in output_path)
            and (".sde" not in output_path)
            and (not output_path.lower().startswith("in_memory"))
            and (not output_path.lower().startswith("memory"))
        ):
            LOGGER.error(3396, extra={"pro_message_ID": 3396})
            return False
        return True
