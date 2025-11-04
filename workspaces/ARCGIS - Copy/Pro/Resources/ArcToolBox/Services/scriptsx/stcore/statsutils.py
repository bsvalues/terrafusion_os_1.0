"""Module to calculate statistics for summarize tools."""
# ignore common package import error. noqa. pylint: disable=import-error
import os
from typing import List, Optional, Dict, Tuple, Union
import uuid

import arcpy
import arcpy.analysis
import arcpy.management
import arcpy.conversion

from common import (PAFeatureLayer, LogUtils, PAOutputFeatureLayer, FieldUtils,
                    PALayer, AnalysisUtils, ToolExit,
                    IntermCleanMixin, PALayerUtils, AOLUtils,
                    PortalUtils, AOLUtils, Workspace)
from common import (ShpStatsObject, RegStatsObject, CALFIELD_PY_METHOD, FQ_FIELD_NAMES)
from .stcommon import SummaryFieldsInfo, FieldInfo


__all__ = ["StatsCalcUtils", "StatsCalculatorX"]

LOGGER = LogUtils.setup_logger(__name__)


class StatsCalcUtils:
    """Class module with utility functions for stats calculation."""

    @classmethod
    @LogUtils.time_exec
    def make_hidden_field_layer(cls, input_layer: PALayer, output_path: Optional[str]) -> str:
        """Copy data to the desired path and create a layer from the output_path with all the fields hidden.

        Args:
            input_layer (PAFeatureLayer): an instance of PAFeatureLayer (usually the boundary layer)
            output_path (Optional[str]): abolute path of the output data.

        Returns:
            str: name of the layer created from the output_path.
        """
        arcpy.management.CopyFeatures(input_layer.data, output_path)
        LOGGER.debug(f"Copied data to {output_path}.")
        fields = AOLUtils.list_fields(output_path)  # type: ignore

        field_infos = []
        for field in fields:
            visible_type = "HIDDEN"
            ratio_type = "NONE"
            field_infos.append(f"{field.name} {field.name} {visible_type} {ratio_type}")

        output_layer = arcpy.management.MakeFeatureLayer(output_path, f"hiddenFieldsLyr{str(uuid.uuid4())}",
                                                         "#", "#", ";".join(field_infos))
        return output_layer.getOutput(0).name  # type: ignore

    @classmethod
    @LogUtils.time_exec
    def make_ratio_layer(cls, input_layer: PAFeatureLayer, summary_fields: List,
                         groupby_field: Optional[str] = None) -> str:
        """Hide the fields that are not used in statistics calculation and set the field ratio type
        to ratio for the summary fields.

        Args:
            input_layer (PAFeatureLayer): an instance of the PAFeatureLayer (i.e., the summary layer).
            summary_fields (List): a list of the fields that will be used for statistics calculation.
            groupby_field (Optional[str], optional): name of the groupby field. Defaults to None.

        Returns:
            str: name of the created ratio layer.
        """
        visible_fields = []
        ratio_fields = []

        if groupby_field:
            visible_fields.append(groupby_field.upper())

        for (field_name, _) in summary_fields:
            visible_fields.append(field_name.upper())
            ratio_fields.append(field_name.upper())
        LOGGER.debug(f"ratio_fields: {ratio_fields}")
        field_infos_to_update = []
        for field in input_layer.fields:
            visible_type = "HIDDEN"
            ratio_type = None
            if field.name.upper() in visible_fields:
                visible_type = "VISIBLE"
                if field.name.upper() in ratio_fields:
                    ratio_type = "RATIO"
            field_infos_to_update.append(f"{field.name} {field.name} {visible_type} {ratio_type}")

        new_summary_lyr = arcpy.management.MakeFeatureLayer(input_layer.data, f"ratioLayer_{str(uuid.uuid4())}",
                                                            "#", "#", ";".join(field_infos_to_update))
        return new_summary_lyr.getOutput(0).name  # type: ignore

    @classmethod
    @LogUtils.time_exec
    def get_weight_field(cls, intersect_layer: PAFeatureLayer) -> Optional[str]:
        """Get the name of the geometry weighted field.

        Args:
            intersect_layer (PAFeatureLayer): the layer created by intersecting summary boundary layer
            with the summary layer.

        Returns:
            Optional[str]: name of the field with the geometry weight value.
        """
        if intersect_layer.shapeType == "Polyline":
            return f"{intersect_layer.shapeFieldName}@LENGTH"
        elif intersect_layer.shapeType == "Polygon":
            # return f"{intersect_layer.shapeFieldName}@AREA"
            (weight_field, _) = FieldUtils.create_unique_field_name(intersect_layer.fields, "w_shape")
            expression = "!shape.area!"
            arcpy.management.AddField(intersect_layer.data, weight_field, "DOUBLE")
            with arcpy.EnvManager(extent=None):
                arcpy.management.CalculateField(intersect_layer.data, weight_field, expression)
            return weight_field
        else:
            return None

    @classmethod
    def get_geom_method(cls, input_lyr: PALayer) -> str:
        """Get the geometry value (i.e., shape area) calculation approach.

        Args:
            input_lyr (PAFeatureLayer): features of the layer that is used for
            geometry calculation.

        Returns:
            str: the geometry calculation method determined based on the spatial
            reference.
        """
        if input_lyr.spatialReference.PCSName or input_lyr.spatialReference.PCSCode:  # type: ignore
            return "PLANAR"
        else:
            # if the coordinate system is GCS only and the areal units to get is
            # squaremeters which is the case in this tool, the area is calculated
            # using PRESERVE_SHAPE option.
            return "PRESERVE_SHAPE"

    @classmethod
    def get_boundary_fid_field(cls, boundary_lyr: PALayer) -> str:
        """Get the boundary FID field name in the intersection layer.

        Args:
            boundary_lyr (PALayer): a PALayer instance represents the summary boundary layer.

        Returns:
            str: name of the boundary FID field.
        """
        base_name = boundary_lyr.basename  # type: ignore
        # if the layer is from datastore, the base name contains name like <db>.<owner>.<table_name>
        # only the <table_name> part is used as basename in intersect.
        base_name = base_name.split(".")[-1]
        fname = f"FID_{base_name}"
        return fname[:64] if len(fname) > 64 else fname

    @classmethod
    def calc_shp_in_units(cls, input_lyr: PAFeatureLayer, units: str) -> str:
        """Calculate the shape area/length via user specified units.

        Args:
            input_lyr (PAFeatureLayer): layer where the shape in units will be calculated.
            units (str): user specified units.

        Returns:
            str: field name with the shape value calculated.
        """
        geodesic = AnalysisUtils.use_geodesic(sp_ref=input_lyr.spatialReference)  # type: ignore
        if input_lyr.shapeType == "Polyline":
            (field_name, _) = FieldUtils.create_unique_field_name(input_lyr.fields, f"Length_{units}")
            if geodesic:
                expression = f"!shape.geodesicLength@{units}!"
            else:
                expression = f"!shape.length@{units}!"
        else:
            (field_name, _) = FieldUtils.create_unique_field_name(input_lyr.fields, f"Area_{units}")
            if geodesic:
                expression = f"!shape.geodesicArea@{units}!"
            else:
                expression = f"!shape.area@{units}!"
        arcpy.management.AddField(input_lyr.data, field_name, "DOUBLE")
        arcpy.management.CalculateField(input_lyr.data, field_name, expression,
                                        CALFIELD_PY_METHOD)
        return field_name


class StatsCalculatorX(IntermCleanMixin):
    """Optimized stats calculator."""

    def __init__(self, summary_lyr: PAFeatureLayer,
                 summary_boundary_lyr: PALayer,
                 summary_fields: List,
                 groupby_field: Optional[str],
                 keep_empty_boundary: bool,
                 output_lyr: PAOutputFeatureLayer,
                 groupby_stats_output: Optional[PAOutputFeatureLayer],
                 calc_min_maj: bool,
                 calc_perc_shp: bool,
                 summary_fields_info: SummaryFieldsInfo,
                 shape_stat_units: Optional[str],
                 sum_shape: bool,
                 call_from_desktop: bool = False):
        """Initialize the properties.

        Args:
            summary_lyr (PAFeatureLayer): a PAFeatureLayer object to calculate summary from.
            summary_boundary_lyr (PAFeatureLayer): a PAFeatureLayer object with the boundary.
            summary_fields (List): a list of tuples where the first item is the name of the field and the
            second item is the type of stats to collect.
            groupby_field (Optional[str]): name of the groupby field.
            keep_empty_boundary (bool): true to keep all boundary features in the output even if
            there is no summary feature (point) fall into. False to only keep boundary features that have summary
            features fall within.
            output_lyr (PAOutputFeatureLayer): a PAOutputFeatureLayer to save the summarize output.
            groupby_stats_output (Optional[PAOutputFeatureLayer]): a PAOutputFeatureLayer to store the groupby stats.
            calc_min_maj (bool): True to calculate the minority and majority values based on the
            groupby field.
            calc_perc_shp (bool): True to calculate the percent shape of a certain groupby category
            within a certain summary boundary polygon.
            summary_fields_info (SummaryFieldsInfo): a SummaryFieldsInfo object to keep track of the key fields
            used for future symbology/popup etc.
            shape_stat_units (Optional[str]): units of the summarized shapes information.
            sum_shape (bool): True to return the summary shape information and False otherwise.
        """
        self.summary_lyr = summary_lyr
        self.summary_boundary_lyr = summary_boundary_lyr
        self.summary_fields = summary_fields
        self.groupby_field = groupby_field
        self.keep_empty_boundary = keep_empty_boundary
        self.output_lyr = output_lyr
        self.groupby_stats_output = groupby_stats_output
        self.calc_min_maj = calc_min_maj
        self.calc_perc_shp = calc_perc_shp
        self.summary_fields_info = summary_fields_info
        self.interm_wkspc = AOLUtils.get_output_wkspcx(max(self.summary_lyr.count,
                                                           self.summary_boundary_lyr.count))
        self.interm_outputs = []
        self.shp_stat_units = shape_stat_units
        self.sum_shape = sum_shape

        self.res_table_fields = []
        self.changed_gb_fname = None
        self.call_from_desktop = call_from_desktop

    def _make_summarylyr_copy(self) -> PAFeatureLayer:
        """Make a local copy of the summary layer if needed.

        Returns:
            PAFeatureLayer: If there is a field used as a groupby field and statistics
            field at the same time, create a copy of the summary_lyr and duplicate
            the groupby field for statistics calculation. Otherwise return back the
            summary_lyr.
        """
        gb_as_sf = False  # groupby field is also used asd as summary field
        int_ratio_fields = []  # integer summary fields
        sfields_lower = []
        if self.groupby_field:
            for fld_name, _ in self.summary_fields:
                if fld_name.lower() == self.groupby_field.lower():
                    gb_as_sf = True
                    break
        
        reserved_field_names = []
        in_enterp_env = PortalUtils.is_portal_env()
        if in_enterp_env:
            if self.groupby_field and self.groupby_field.upper() in FQ_FIELD_NAMES:
                reserved_field_names.append(self.groupby_field)
            for (fld_name, _) in self.summary_fields:
                if (
                    fld_name
                    and fld_name.upper() in FQ_FIELD_NAMES
                    and fld_name not in reserved_field_names
                ):
                    reserved_field_names.append(fld_name)

        if (
            self.summary_lyr.shapeType == "Polyline"
            or self.summary_lyr.shapeType == "Polygon"
        ):
            summary_fld_types = {f.name.lower(): f.type for f in self.summary_lyr.fields}
            for fld_name, _ in self.summary_fields:
                sfields_lower.append(fld_name.lower())
                if (
                    summary_fld_types.get(fld_name.lower(), "") in ["Integer", "SmallInteger", "BigInteger"]
                    and fld_name not in int_ratio_fields
                ):
                    int_ratio_fields.append(fld_name.lower())
        LOGGER.debug(f"int_ratio_fields: {int_ratio_fields}")
        # TODO: this workaround is for issue https://devtopia.esri.com/WebGIS/arcgis-portal-analysis/issues/1376
        # Drop the workaround of checking summary_lyr has selection once the pairwise_intersect issue is resolved.
        if (
            gb_as_sf
            or int_ratio_fields
            or reserved_field_names
            or (not self.call_from_desktop and self.summary_lyr.FIDSet and arcpy.env.extent)
        ):
            field_mappings = arcpy.FieldMappings()
            fmapped = 0
            out_wk = AOLUtils.get_scratch_wkspc()
            out_fc = "localSummaryInput"
            out_path = os.path.join(out_wk, out_fc)
            if int_ratio_fields:
                for fld in self.summary_lyr.fields:
                    if (fld.type != "OID" and fld.type != "Geometry" and fld.editable):
                        try:
                            fm = arcpy.FieldMap()
                            fm.addInputField(self.summary_lyr.layer, fld.name)
                        except Exception as err:
                            LOGGER.debug(f"Unable to add {fld.name} due to {str(err)}")
                            # For some fields (fully-qualified fields) the addInputField can fail.
                            # Ignore it if it is not used for summary
                            if fld.name.lower() not in sfields_lower:
                                continue
                            else:
                                fmapped = 0
                                break
                        # change the field type to Double so that the downstream
                        # ratio calculation is not rounded.
                        if fld.name.lower() in int_ratio_fields:
                            out_fld = fld
                            out_fld.type = "Double"
                            fm.outputField = out_fld
                        field_mappings.addFieldMap(fm)
                        fmapped += 1
            with arcpy.EnvManager(qualifiedFieldNames=False):
                if fmapped > 0:
                    arcpy.conversion.FeatureClassToFeatureClass(self.summary_lyr.layer,
                                                                out_wk, out_fc,
                                                                field_mapping=field_mappings)
                    tmp_summary_lyr = PAFeatureLayer(out_path, select_features_in_extent=False)
                    LOGGER.debug("Create local copy through FC2FC.")
                else:
                    tmp_summary_lyr = PALayerUtils.make_local_copy(self.summary_lyr,
                                                                   out_path,
                                                                   selected_features_only=True,
                                                                   nocopy_if_local=False)
                    # Fallback of alter field through FieldMappings
                    if int_ratio_fields:
                        for rfld in int_ratio_fields:
                            if not FieldUtils.alter_field_type(tmp_summary_lyr, rfld, "Double"):
                                LOGGER.error(110341, extra={"message_ID": 110341, "fieldName": rfld})
                                raise ToolExit
                    LOGGER.debug("Create local copy.")
                self.interm_outputs.append(tmp_summary_lyr.data)

            if gb_as_sf:
                tmp_summary_fields = AOLUtils.list_fields(tmp_summary_lyr.data)
                gb_fld_type = ""
                gb_fld_alias = self.groupby_field
                gb_fld_prec = None
                for fld in tmp_summary_fields:
                    if fld.name.lower() == self.groupby_field.lower():
                        gb_fld_type = fld.type
                        if fld.aliasName:
                            gb_fld_alias = fld.aliasName
                        gb_fld_prec = fld.precision
                        break

                (stat_gb_fname, _) = FieldUtils.create_unique_field_name(tmp_summary_fields,
                                                                         self.groupby_field,  # type: ignore
                                                                         len_limit=31)

                arcpy.management.AddField(tmp_summary_lyr.data, stat_gb_fname, gb_fld_type,
                                          field_alias=gb_fld_alias,
                                          field_precision=gb_fld_prec)
                if (
                    gb_fld_type == "Date"
                    and gb_fld_prec == 1
                    and AOLUtils.get_wkspc_from_path(tmp_summary_lyr.data) == Workspace.FGDB
                ):
                    LOGGER.debug(f"Change {stat_gb_fname} to high precision.")
                    arcpy.management.MigrateDateFieldToHighPrecision(tmp_summary_lyr.data, stat_gb_fname)
                expression = f'!{self.groupby_field}!'
                arcpy.management.CalculateField(tmp_summary_lyr.data, stat_gb_fname, expression,
                                                CALFIELD_PY_METHOD)
                # Update the summary_fields
                for i, (fld_name, stat) in enumerate(self.summary_fields):
                    if fld_name.lower() == self.groupby_field.lower():  # type: ignore
                        self.summary_fields[i] = (stat_gb_fname, stat)
                self.changed_gb_fname = stat_gb_fname
                LOGGER.debug(f"summary_fields after update: {self.summary_fields}")
                LOGGER.debug(f"changed_gb_fname: {self.changed_gb_fname}")
            return tmp_summary_lyr   

        return self.summary_lyr

    @LogUtils.time_exec
    def _preprocess(self) -> PAFeatureLayer:
        """Preprocess the summary layer and the boundary layer.

        Returns:
            PAFeatureLayer: the intersection between the summary layer and the
            boundary layer.
        """
        tmp_ratio_lyr = self._make_summarylyr_copy()
        summary_lyr_ratio = StatsCalcUtils.make_ratio_layer(tmp_ratio_lyr, self.summary_fields,
                                                            self.groupby_field)
        hidden_lyr_path = self.output_lyr.data
        within_layer_no_fields = StatsCalcUtils.make_hidden_field_layer(self.summary_boundary_lyr,
                                                                        hidden_lyr_path)
        intersect_output = AOLUtils.create_unique_name("intersectOut", self.interm_wkspc)
        LOGGER.debug("Perform PairwiseIntersect")
        AnalysisUtils.pairwise_intersect([within_layer_no_fields, summary_lyr_ratio],
                                         intersect_output, "ALL", "#", "INPUT")
        LOGGER.debug(f"intersect_output: {intersect_output}")
        self.interm_outputs.append(intersect_output)
        intersect_lyr = PAFeatureLayer(intersect_output, verify_feature_count=False)

        return intersect_lyr

    @LogUtils.time_exec
    def update_output_join_id(self, boundary_fid_field: str):
        """Update the the join field name of the output layer.

        Args:
            boundary_fid_field (str): fid field name of the boundary layer.
        """
        rename_fields = []
        rename_fields.append({"originalFieldName": boundary_fid_field,
                              "newFieldName": "Join_ID",
                              "newFieldAlias": "Join ID"})
        if self.groupby_stats_output:
            FieldUtils.rename_fields(self.groupby_stats_output, rename_fields)
        self.summary_fields_info.tblJoinIDField = "Join_ID"

        # add a joinID field to the output
        field_name, field_alias = FieldUtils.create_unique_field_name(self.output_lyr.fields, "Join_ID", "JOIN ID")
        arcpy.management.AddField(self.output_lyr.data, field_name, "LONG", "#", "#", "#", field_alias)
        expression = f"!{self.output_lyr.OIDFieldName}!"
        arcpy.management.CalculateField(self.output_lyr.data, field_name, expression,
                                        CALFIELD_PY_METHOD)
        self.summary_fields_info.layerJoinIDField = field_name
        LOGGER.debug("Created Join_ID field to the output_lyr.")

    def _add_field(self,
                   table: str,
                   field_name: str,
                   field_type: str,
                   field_alias: Optional[str],
                   field_precision: Optional[Union[int, str]] = None,
                   field_scale: Optional[Union[int, str]] = None,
                   field_length: Optional[Union[int, str]] = None):
        """add a field to a desired table.

        Args:
            table (str): absolute path of a table.
            field_name (str): name of the field.
            field_type (str): type of the field.
            field_alias (Optional[str]): alias name of the field
            field_precision (Optional[Union[int, str]], optional): precision of the field.
            Defaults to None.
            field_scale (Optional[Union[int, str]], optional): scale of the field. Defaults to None.
            field_length (Optional[Union[int, str]], optional): length of the filed. Defaults to None.
        """
        field_alias = field_name if field_alias is None else field_alias
        if not field_length:
            arcpy.management.AddField(table, field_name, field_type,
                                      field_alias=field_alias,
                                      field_precision=field_precision,
                                      field_scale=field_scale)
        else:
            arcpy.management.AddField(table, field_name, field_type,
                                      field_precision=field_precision,
                                      field_scale=field_scale,
                                      field_length=field_length,
                                      field_alias=field_alias)
        self.res_table_fields.append(field_name)

    def _get_count_fieldname(self) -> Tuple:
        shape_alias = "Line" if self.summary_lyr.shapeType == "Polyline" else self.summary_lyr.shapeType
        return (f"{self.summary_lyr.shapeType}_Count", f"Count of {shape_alias}s")

    def _init_result_table(self,
                           result_table: str,
                           bound_fid_field: str,
                           gb_summary: bool,
                           summary_field_types: Dict,
                           field_sois_info: Dict,
                           boundary_area: Optional[Dict],
                           mapped_gf: Optional[Dict]) -> List:
        """initialize a table to save the result.

        Args:
            result_table (str): absolute path to keep the result table.
            bound_fid_field (str): name of the field with the boundary FID.
            gb_summary (bool): True if the result table is for the groupby summary
            and False otherwise.
            summary_field_types (Dict): a dictionary keyed by the relative index
            of the summary fields and valued by a tuple of field name, aliasName,
            and type.
            field_sois_info (Dict): a dictionary keyed by the relative index and valued
            by a list where each item is a stats of interests based on the field.
            boundary_area (Optional[Dict]): a dictionary keyed by the boundary FID and
            valued by the shape area of the boundary. If the summary layer is point or
            polyline, then the boundary_area is None.

        Returns:
            List: a list of stats objects.
        """
        # create an empty table
        LOGGER.debug(f"{result_table} to initialize with {gb_summary=}")
        arcpy.management.CreateTable(os.path.dirname(result_table),
                                     os.path.basename(result_table))
        self.res_table_fields = []

        # Add the fields
        self._add_field(result_table, bound_fid_field, "LONG", None)
        if gb_summary and self.groupby_field:
            slyr_fields_info = {field.name.lower(): field.type for field in self.summary_lyr.fields}
            gbf_type = slyr_fields_info.get(self.groupby_field.lower())
            self._add_field(result_table, self.groupby_field, gbf_type, None)  # type: ignore
        # Add summary fields
        stats_objs = []
        hp_fields_to_mgr = []
        for (i, index) in enumerate(sorted(summary_field_types.keys())):
            (field_name, field_alias, field_type, field_precision) = summary_field_types[index]
            sois = field_sois_info.get(index, [])
            stats_objs.append(RegStatsObject(sois))
            for (j, soi) in enumerate(sois):
                soi_str = soi.replace("weight", "")
                if soi_str == "count":
                    (new_name, new_alias) = self._get_count_fieldname()
                else:
                    if self.changed_gb_fname and field_name == self.changed_gb_fname:
                        tmp_fname = self.groupby_field
                    elif mapped_gf and field_name.upper() in mapped_gf:
                        if (
                            "@" in mapped_gf[field_name.upper()]
                            or "." in mapped_gf[field_name.upper()]
                            or "(" in mapped_gf[field_name.upper()]
                            or ")" in mapped_gf[field_name.upper()]
                        ):
                            tmp_fname = field_name
                            field_alias = mapped_gf[field_name.upper()]
                        else:
                            tmp_fname = mapped_gf[field_name.upper()]
                    else:
                        tmp_fname = field_name
                    new_name = f"{soi_str}_{tmp_fname}"
                    orig_fld_alias = field_alias if field_alias.strip() else tmp_fname
                    new_alias = FieldUtils.get_summary_aliasname(orig_fld_alias, soi_str)  # type: ignore
                if soi.lower() in ["std", "weightstd", "weightmean", "mean", "sum"]:
                    new_field_type = "DOUBLE"
                elif soi.lower() == "count":
                    new_field_type = "LONG"
                else:
                    new_field_type = field_type

                f_precision = field_precision if new_field_type == "Date" else None
                LOGGER.debug(f"Set {new_name}'s precision to {f_precision}.")
                if (
                    new_field_type == "Date"
                    and f_precision == 1
                    and AOLUtils.get_wkspc_from_path(result_table) == Workspace.FGDB
                ):
                    hp_fields_to_mgr.append(new_name)
                self._add_field(result_table, new_name, new_field_type, new_alias, field_precision=f_precision)
                if not gb_summary:
                    self.summary_fields_info.append_summary_field(FieldInfo(new_name, new_alias))
                    if (i + j == 0) and (not self.sum_shape):
                        self.summary_fields_info.shapeStatField = FieldInfo(new_name, new_alias)
        if hp_fields_to_mgr:
            arcpy.management.MigrateDateFieldToHighPrecision(result_table, hp_fields_to_mgr)

        shp_stat_sois = []
        if self.sum_shape and self.summary_lyr.shapeType == "Point":
            shp_stat_sois.append("count")
            (fname, falias) = self._get_count_fieldname()
            self._add_field(result_table, fname, "LONG", falias)
            self.summary_fields_info.shapeStatField = FieldInfo(fname, falias)
        elif not self.sum_shape and self.summary_lyr.shapeType != "Point":
            shp_stat_sois.append("count")
            (fname, falias) = self._get_count_fieldname()
            self._add_field(result_table, fname, "LONG", falias)
            self.summary_fields_info.shapeStatField = FieldInfo(fname, falias)

        if not gb_summary and self.calc_min_maj and self.groupby_field:
            min_maj_field_names = [f"Minority_{self.groupby_field}", f"Majority_{self.groupby_field}"]
            min_maj_field_types = ["TEXT", "TEXT"]
            shp_stat_sois.extend(["minpercentval", "maxpercentval"])
            if self.calc_perc_shp:
                min_maj_field_names.extend([f"Minority_{self.groupby_field}_Percent",
                                            f"Majority_{self.groupby_field}_Percent"])
                min_maj_field_types.extend(["DOUBLE", "DOUBLE"])
                shp_stat_sois.extend(["minpercent", "maxpercent"])

            for fn, ftype in zip(min_maj_field_names, min_maj_field_types):
                falias = fn.replace("_", " ")
                length = 10000 if ftype == "TEXT" else "#"
                self._add_field(result_table, fn, ftype, falias, "#", "#", length)
            self.summary_fields_info.minMajorityFields = min_maj_field_names

        elif gb_summary and self.groupby_field and self.calc_perc_shp:
            shape_name_lookup = {"Point": "Count", "Polyline": "Length", "Polygon": "Area"}
            lyr_shp_type = self.summary_lyr.shapeType
            if lyr_shp_type in shape_name_lookup:
                field_name = f"Percent{shape_name_lookup[lyr_shp_type]}"
                if lyr_shp_type == "Point":
                    field_alias = "Percent of point count"
                else:
                    field_alias = f"Percent of {shape_name_lookup[lyr_shp_type].lower()}"
            else:
                field_name = "PercentShape"
                field_alias = "Percent of shape"
            self._add_field(result_table, field_name, "DOUBLE", field_alias)
            shp_stat_sois.append("percentshape")
            self.summary_fields_info.percShpField = FieldInfo(field_name, field_alias)

        if shp_stat_sois:
            ss_obj = ShpStatsObject(shp_stat_sois, boundary_area)  # type: ignore
            stats_objs.append(ss_obj)

        return stats_objs

    def _unpack_to_statobj(self, row: List, stats_objs: List,
                           unpack_weight: bool,
                           sum_shp: str,
                           val_st_index: int):
        """unpack values from row to the stats_objs.

        Args:
            row (List): an iterable with the desired values from a row.
            stats_objs (List): a list of GroupStatsCalcObj to unpack the value to.
            unpack_weight (bool): True to add weight and False otherwise.
            sum_shp (str): shape of the summary layer.
            val_st_index (int): start index of the value used for stats calculation.
        """
        if unpack_weight:
            wval = row[-1]
        elif sum_shp == "Point":
            wval = 1
        else:
            wval = None

        for i, sobj in enumerate(stats_objs):
            if isinstance(sobj, ShpStatsObject):
                if self.groupby_field:
                    sobj.add_val(wval, row[1], row[0])  # type: ignore
                else:
                    sobj.add_val(wval, None, row[0])  # type: ignore
            else:
                sobj.add_val(row[val_st_index + i], wval)

    def _prep_insert_row(self, insert_fld_len: int, stats_objs: List,
                         grp_end_index: int, curr_grp: Tuple) -> List:
        """Dump the value out from the stats_objs to prepare the row to insert
        into the result table.

        Args:
            insert_fld_len (int): total number of items in the insert row.
            stats_objs (List): a list of GroupStatsCalcObj objects.
            grp_end_index (int): end index of the group in the insert row.
            curr_grp (Tuple): a tuple with the current group.

        Returns:
            List: a row with values ready to insert to the result table.
        """
        irow = [None] * insert_fld_len
        irow[0: grp_end_index] = curr_grp[0: grp_end_index]
        st_index = grp_end_index
        for sobj in stats_objs:
            end_index = st_index + len(sobj.sois)
            irow[st_index: end_index] = sobj.get_all_sois()
            st_index = end_index
            sobj.reset()

        return irow

    def _calc(self, intersect_layer: PAFeatureLayer,
              summary_field_types: Dict,
              field_sois_info: Dict,
              gb_summary: bool,
              boundary_area: Optional[Dict],
              result_table: str,
              bound_fid_field: str,
              fields_to_fetch: List,
              grp_total: Optional[Dict] = None,
              weight_field: Optional[str] = None,
              mapped_gf: Optional[Dict] = None):
        """Calculate the statistics.

        Args:
            intersect_layer (PAFeatureLayer): intersection between the summary layer
            and the summary boundary layer.
            summary_field_types (Dict): a dictionary keyed by the index of the field
            to fetch from the intersect_layer and valued by a tuple with the field name,
            field aliasName, and field type.
            field_sois_info (Dict): a dictionary keyed by the index of the field to
            fetch from the intersect_layer and valued by the associate instance of
            GroupStatsCalcObj.
            gb_summary (bool): True if the calculation is from the groupby stats summary
            and False otherwise.
            boundary_area (Optional[Dict]): a dictionary keyed by the boundary polygon
            ID and valued by the base of weight.
            result_table (str): the absolute path of keeping the calculation result.
            bound_fid_field (str): name of the boundary FID field in intersect_layer.
            fields_to_fetch (List): a list of field names to search from intersect_layer.
            grp_total (Optional[Dict], optional): either None or an empty dictionary. If
            grp_total is an empty dictionary, then fill the grp_total with values that
            will be used later on. Defaults to None.
            weight_field (Optional[str], optional): name of the weight field. Defaults to None.
        """
        stats_objs = self._init_result_table(result_table,
                                             bound_fid_field,
                                             gb_summary,
                                             summary_field_types,
                                             field_sois_info,
                                             boundary_area,
                                             mapped_gf=mapped_gf)
        # LOGGER.debug(f"stats_objs: {stats_objs}")
        if self.groupby_field and (self.calc_min_maj or gb_summary):
            sort_field_str = ",".join([bound_fid_field, self.groupby_field])  # type: ignore
            val_st_index = 2
        else:
            sort_field_str = bound_fid_field
            val_st_index = 1 if not self.groupby_field else 2
        unpack_weight = (weight_field is not None)
        grp_end_index = 2 if gb_summary else 1

        sort_sql_syntax = f"ORDER BY {sort_field_str} ASC"
        insert_fld_len = len(self.res_table_fields)
        total_stat = "sum" if self.summary_lyr.shapeType != "Point" else "count"
        LOGGER.debug(f"val_st_index: {val_st_index} and grp_end_index: {grp_end_index}")
        LOGGER.debug(f"fields_to_fetch: {fields_to_fetch}")
        LOGGER.debug(f"res_table_fields: {self.res_table_fields}")
        with arcpy.da.SearchCursor(intersect_layer.data, fields_to_fetch,  # type: ignore
                                   sql_clause=(None, sort_sql_syntax)) as curr:
            curr_grp = None
            with arcpy.da.InsertCursor(result_table, self.res_table_fields) as ins_curr:  # type: ignore
                for row in curr:
                    if curr_grp is None:
                        curr_grp = row[0: grp_end_index]
                        self._unpack_to_statobj(row, stats_objs,
                                                unpack_weight,
                                                self.summary_lyr.shapeType,
                                                val_st_index)
                    elif row[0: grp_end_index] == curr_grp:
                        self._unpack_to_statobj(row, stats_objs,
                                                unpack_weight,
                                                self.summary_lyr.shapeType,
                                                val_st_index)
                    else:
                        if grp_total is not None:
                            grp_total[curr_grp[0]] = stats_objs[-1].get_stat(total_stat)
                        irow = self._prep_insert_row(insert_fld_len, stats_objs,
                                                     grp_end_index, curr_grp)
                        ins_curr.insertRow(irow)

                        curr_grp = row[0: val_st_index] if gb_summary else row[0: grp_end_index]

                        self._unpack_to_statobj(row, stats_objs,
                                                unpack_weight,
                                                self.summary_lyr.shapeType,
                                                val_st_index)

                # Add the last row
                if grp_total is not None and curr_grp is not None:
                    grp_total[curr_grp[0]] = stats_objs[-1].get_stat(total_stat)

                if curr_grp is not None:
                    irow = self._prep_insert_row(insert_fld_len, stats_objs,
                                                 grp_end_index, curr_grp)
                    ins_curr.insertRow(irow)

    def _pull_boundary_area(self) -> Dict:
        boundary_fields_to_pull = [self.output_lyr.OIDFieldName, "Shape@"]
        boundary_areas = {}
        with arcpy.da.SearchCursor(self.output_lyr.data, boundary_fields_to_pull) as cur:  # type: ignore
            method = StatsCalcUtils.get_geom_method(self.output_lyr)

            for row in cur:
                barea = float(row[1].getArea(method, None))
                boundary_areas[row[0]] = barea
        return boundary_areas
    
    def _pull_line_length(self, intersect_output_lyr: PAFeatureLayer, boundary_fid_field: str) -> Dict:
        fields_to_pull = [boundary_fid_field, f"{intersect_output_lyr.shapeFieldName}@LENGTH"]
        shp_lengths = {}
        with arcpy.da.SearchCursor(intersect_output_lyr.data, fields_to_pull) as curr:  # type: ignore
            for row in curr:
                if row[0] in shp_lengths:
                    shp_lengths[row[0]] += row[1]
                else:
                    shp_lengths[row[0]] = row[1]
        return shp_lengths

    def _pull_summary_fields_info(self, intersect_lyr: PAFeatureLayer,
                                  boundary_fid_field: str) -> Tuple:
        """Get the summary fields related information together.

        Args:
            intersect_lyr (PAFeatureLayer): the intersection layer between the
            summary layer and the boundary layer.
            boundary_fid_field (str): the name of the field with the OID of the
            boundary layer.

        Returns:
            Tuple: a four items tuple in the order of: 1) a list of fields that
            will be fetched from the intersect_lyr; 2) a dictionary keyed by the
            ID of the field in item 1 and valued by the (field name, alias name, 
            and field type); 3) a dictionary keyed by the ID of the field in item 1
            and valued by the instance of GroupStatsCalcObj; 4) a list of all the
            stats to calculate regardless of fields.
        """
        fields_to_fetch = [boundary_fid_field]
        if self.groupby_field:
            fields_to_fetch.append(self.groupby_field)
        summary_fields_info = {}
        sois_info = {}
        curr_ind = 1
        sois = []
        field_index_map = {}
        if intersect_lyr and not intersect_lyr.is_table_view:
            int_fields = AOLUtils.list_fields(intersect_lyr.layer)
        else:
            int_fields = intersect_lyr.fields
        fields_infos = {field.name.lower(): (field.aliasName, field.type, field.precision) for field in int_fields}
        mapped_gf = FieldUtils.replace_geom_vf(self.summary_fields, intersect_lyr)
        for (fld_name, stat_name) in self.summary_fields:
            if self.summary_lyr.shapeType != "Point":
                if stat_name == "mean":
                    stat_name = "weightmean"
                if stat_name == "std":
                    stat_name = "weightstd"

            if fld_name not in field_index_map:
                field_index_map[fld_name] = curr_ind
                tmp_info = fields_infos.get(fld_name.lower())
                if not tmp_info:
                    LOGGER.debug(f"Unable to find {fld_name} from {fields_infos}")
                    raise ToolExit
                summary_fields_info[curr_ind] = [fld_name, tmp_info[0], tmp_info[1], tmp_info[2]]
                sois_info[curr_ind] = [stat_name]
                fields_to_fetch.append(fld_name)
                curr_ind += 1
                sois.append(stat_name)
            else:
                sois.append(stat_name)
                index = field_index_map[fld_name]
                if stat_name not in sois_info[index]:
                    sois_info[index].append(stat_name)

        if self.sum_shape and self.summary_lyr.shapeType != "Point":
            shp_stat_fname = StatsCalcUtils.calc_shp_in_units(intersect_lyr, self.shp_stat_units)  # type: ignore
            fields_to_fetch.append(shp_stat_fname)
            sum_shp_stats = ["sum", "count"]
            sois.extend(sum_shp_stats)
            sois_info[curr_ind] = sum_shp_stats
            summary_fields_info[curr_ind] = [shp_stat_fname, shp_stat_fname, "DOUBLE", None]

            field_name = f"sum_{shp_stat_fname}"
            field_alias = FieldUtils.get_summary_aliasname(shp_stat_fname, "Sum")
            self.summary_fields_info.shapeStatField = FieldInfo(field_name, field_alias)

        return (fields_to_fetch, summary_fields_info, sois_info, sois, mapped_gf)

    def calculate(self):
        intersect_output_lyr = self._preprocess()
        # intersect_output_lyr is created from intersecting output with the summary layer, so
        # boundary_fid_field is derived from output_lyr.
        boundary_fid_field = StatsCalcUtils.get_boundary_fid_field(self.output_lyr)
        (f2f, sfi, sois_info, sois, mgf) = self._pull_summary_fields_info(intersect_output_lyr,
                                                                          boundary_fid_field)
        weight_field = None
        geom_tot_shp = None

        if (
            set(sois).intersection({"weightmean", "weightstd"})
            or self.calc_min_maj
            or self.calc_perc_shp
        ):
            weight_field = StatsCalcUtils.get_weight_field(intersect_output_lyr)
            if weight_field:
                f2f.append(weight_field)
            if (self.summary_lyr.shapeType == "Polygon") and (self.calc_min_maj or self.calc_perc_shp):
                # pull the shape area from the boundary layer
                LOGGER.debug("boundary_area is pulled.")
                geom_tot_shp = self._pull_boundary_area()
            elif (self.summary_lyr.shapeType == "Polyline" and not self.calc_min_maj and self.calc_perc_shp):
                # pull the shape length from the intersect output
                geom_tot_shp = self._pull_line_length(intersect_output_lyr, boundary_fid_field)
                LOGGER.debug("line_length is pulled.")
        LOGGER.debug(f"weight_field: {weight_field}")

        wkspc = AOLUtils.get_output_wkspc(self.summary_boundary_lyr.count)
        result_table = AOLUtils.create_unique_name("summary_stats", wkspc)
        grp_total = None
        if self.groupby_stats_output is not None and not geom_tot_shp:
            grp_total = {}
        self._calc(intersect_output_lyr, sfi, sois_info, False,
                   geom_tot_shp, result_table, boundary_fid_field,
                   f2f, grp_total, weight_field=weight_field,
                   mapped_gf=mgf)
        self.interm_outputs.append(result_table)
        # join the result back
        arcpy.management.JoinField(self.output_lyr.data, self.output_lyr.OIDFieldName,
                                   result_table, boundary_fid_field)

        # remove features with no matching if no need to keep empty boundary
        expr = f"{boundary_fid_field} IS NULL"
        lyr_name = AOLUtils.make_feature_layer(self.output_lyr.data, "tempLayer", expr)
        if not self.keep_empty_boundary:
            arcpy.management.DeleteFeatures(lyr_name)
        else:
            # update the sum/count sois to 0
            fields_to_update = [f for f in self.res_table_fields if f.lower().startswith("sum") or f.lower().endswith("count")]
            if fields_to_update:
                fields_expressions = [[fname, "0"] for fname in fields_to_update]
                LOGGER.debug(f"fields_expressions: {fields_expressions}")
                arcpy.management.CalculateFields(lyr_name, CALFIELD_PY_METHOD,
                                                 fields_expressions)

        # calculate the groupby summary
        if self.groupby_stats_output is not None and self.groupby_field:
            grp_total = geom_tot_shp if geom_tot_shp else grp_total
            self._calc(intersect_output_lyr, sfi, sois_info,
                       True, grp_total, self.groupby_stats_output.data,
                       boundary_fid_field, f2f, weight_field=weight_field,
                       mapped_gf=mgf)
            self.update_output_join_id(boundary_fid_field)
        arcpy.management.DeleteField(self.output_lyr.data, boundary_fid_field)
        LOGGER.debug(f"boundary_fid_field: {boundary_fid_field} has been deleted.")
