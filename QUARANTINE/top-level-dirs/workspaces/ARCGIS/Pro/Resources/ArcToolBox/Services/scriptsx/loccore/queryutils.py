"""Class modules with query functionalities."""
# use common package. noqa. pylint: disable=import-error
from abc import ABC, abstractmethod
from typing import Set, List, Optional, Dict
import os

import arcpy
import arcpy.management
import arcpy.analysis

from common import LogUtils, AnalysisUtils, FieldUtils, CALFIELD_PY_METHOD, AOLUtils
from cbcore import SingleBuffer
from .expnode import ExpUtils


__all__ = ["FeatureLayerQuery", "LayerAttributeQuery", "LayerSpatialQuery", "NearestFeatureQuery", "OverlayQuery"]

LOGGER = LogUtils.setup_logger(__name__)


class FeatureLayerQuery(ABC):
    """Abstract class define the interface for querying FeatureLayer."""
    SUPPORTED_SELECTION_TYPE = ["NEW_SELECTION", "SUBSET_SELECTION", "ADD_TO_SELECTION",
                                "REMOVE_FROM_SELECTION", "SWITCH_SELECTION"]

    def __init__(self, layer: str, selection_type: str):
        """Initialize the properties.

        Args:
            layer (str): name of the layer to perform query upon.
            selection_type (str): type of selection. It can only be one of [NEW_SELECTION, SUBSET_SELECTION,
            ADD_TO_SELECTION, REMOVE_FROM_SELECTION, SWITCH_SELECTION ]
        """
        self.layer = layer
        if selection_type not in self.SUPPORTED_SELECTION_TYPE:
            LOGGER.error(f"Unsupported selection_type of {selection_type}.")
            raise ValueError
        self.selection_type = selection_type

    @abstractmethod
    def query(self):
        raise NotImplementedError

    @abstractmethod
    def get_selection_query(self) -> Optional[str]:
        raise NotImplementedError


class LayerAttributeQuery(FeatureLayerQuery):
    def __init__(self, layer: str, where_clause: str, selection_type: str):
        """Class to perform attribute query.

        Args:
            layer (str): name of the layer to perform query upon.
            where_clause (str): where_clause to perform the query.
            selection_type (str): type of selection.
        """
        super(LayerAttributeQuery, self).__init__(layer, selection_type)
        self.where_clause = where_clause

    def query(self):
        arcpy.management.SelectLayerByAttribute(self.layer, self.selection_type, self.where_clause)

    def get_selection_query(self) -> Optional[str]:
        return self.where_clause


class LayerSpatialQuery(FeatureLayerQuery):

    DT_SPATIALREL = {"WITHINDISTANCE": "WITHIN_A_DISTANCE_GEODESIC",
                     "COMPLETELYCONTAINS": "COMPLETELY_CONTAINS",
                     "COMPLETELYWITHIN": "COMPLETELY_WITHIN",
                     "INTERSECTS": "INTERSECT"}

    def __init__(self, layer: str, selecting_layer: str,
                 spatial_expression: Dict,
                 selection_type: str, layer_where_clause: Optional[str] = None,
                 sel_layer_where_clause: Optional[str] = None):
        """Class to perform location based query.

        Args:
            layer (str): target layer name where the features will be queried from.
            selecting_layer (str): name of the layer which provides geometry to interact with target layer.
            spatial_expression (Dict): a dictionary describes the spatial operation between the layer and the
            selecting_layer.
            selection_type (str): type of selection.
            layer_where_clause (Optional[str], optional): a pre-condition where clause to impose on the layer before
            performing the selection. Defaults to None.
            sel_layer_where_clause (Optional[str], optional): a pre-condition where clause to impose on the
            selecting_layer before performing the selection. Defaults to None.

        Raises:
            AO_100055: if the spatial_rel is not defined in the spatial_expression.
        """
        super(LayerSpatialQuery, self).__init__(layer, selection_type)
        self.selecting_layer = selecting_layer
        spatial_rel = spatial_expression.get("spatialRel")
        self.spatial_expression = spatial_expression
        if spatial_rel is None:
            LOGGER.error(100055, extra={"message_ID": 100055})
            raise ValueError

        if "NOT" in spatial_rel.upper():
            self.spatial_rel = spatial_rel.replace("NOT", "").upper()
            self.invert_spatial_rel = True
        else:
            self.spatial_rel = spatial_rel.upper()
            self.invert_spatial_rel = False
        self.spatial_rel = self.DT_SPATIALREL.get(self.spatial_rel, self.spatial_rel)
        LOGGER.debug(f"spatial_rel: {self.spatial_rel}")
        LOGGER.debug(f"invert spatial relationship: {self.invert_spatial_rel}")

        self.layer_where_clause = layer_where_clause
        self.sel_layer_where_clause = sel_layer_where_clause
        (self.spatial_dist, self.spatial_dist_val, self.spatial_dist_units) = ExpUtils.get_distance_info(spatial_expression)

    def query(self):
        if self.layer_where_clause:
            # LayerAttributeQuery(self.layer, self.layer_where_clause, "NEW_SELECTION").query()
            self.selection_type = "SUBSET_SELECTION"

        if self.sel_layer_where_clause:
            LayerAttributeQuery(self.selecting_layer, self.sel_layer_where_clause, "NEW_SELECTION").query()

        arcpy.management.SelectLayerByLocation(self.layer, self.spatial_rel, self.selecting_layer,
                                               self.spatial_dist, self.selection_type, self.invert_spatial_rel)

    def get_selection_query(self) -> Optional[str]:
        desc = arcpy.Describe(self.layer)
        if hasattr(desc, "FIDSet"):
            if desc.FIDSet:  # type: ignore
                fidset = desc.FIDSet  # type: ignore
                fidset = fidset.replace(";", ",")
                return f"{desc.OIDFieldName} in ({fidset})"  # type: ignore
            else:
                cnt = int(arcpy.management.GetCount(self.layer).getOutput(0))
                if cnt == 0:
                    return f"{desc.OIDFieldName} < -999"  # type: ignore
            
        return None


class NearestFeatureQuery(FeatureLayerQuery):
    def __init__(self, layer: str, selecting_layer: str,
                 selection_type: str,
                 oid_fieldname: str,
                 wkspc: str,
                 layer_where_clause: Optional[str] = None,
                 sel_layer_where_clause: Optional[str] = None,
                 dist: Optional[str] = None):
        """Class module to perform nearest feature query.

        Args:
            layer (str): target layer name where the features will be queried from.
            selecting_layer (str): name of the layer which provides geometry to interact with target layer.
            selection_type (str): type of selection.
            oid_fieldname: name of the oid field of the target layer.
            wkspc: workspace to save the intermediate result.
            layer_where_clause (Optional[str], optional): a pre-condition where clause to impose on the layer before
            performing the selection. Defaults to None.
            sel_layer_where_clause (Optional[str], optional): a pre-condition where clause to impose on the
            selecting_layer before performing the selection. Defaults to None.
        """
        super(NearestFeatureQuery, self).__init__(layer, selection_type)
        self.selecting_layer = selecting_layer
        self.oidfield_name = oid_fieldname
        self.layer_where_clause = layer_where_clause
        self.sel_layer_where_clause = sel_layer_where_clause
        self.where_clause = None
        self.dist = dist
        self.wkspc = wkspc

    def query(self):
        if self.layer_where_clause:
            LayerAttributeQuery(self.layer, self.layer_where_clause, "NEW_SELECTION").query()

        if self.sel_layer_where_clause:
            LayerAttributeQuery(self.selecting_layer, self.sel_layer_where_clause, "NEW_SELECTION").query()

        tmp_sel_path = AOLUtils.create_unique_name("tmp_sel_lyr", self.wkspc)
        arcpy.management.CopyFeatures(self.selecting_layer, tmp_sel_path)
        if self.dist:
            arcpy.analysis.Near(tmp_sel_path, self.layer, self.dist)
        else:
            arcpy.analysis.Near(tmp_sel_path, self.layer)
        closest_ids = []
        with arcpy.da.SearchCursor(tmp_sel_path, ["NEAR_FID"]) as rows:  # type: ignore
            for row in rows:
                if row[0] >= 0:
                    closest_ids.append(row[0])
        if closest_ids:
            tmp_selection_set = ",".join(str(x) for x in closest_ids)
            tmp_oid_field_name = self.oidfield_name
            self.where_clause = "{0} IN ({1})".format(tmp_oid_field_name, tmp_selection_set)
            arcpy.management.SelectLayerByAttribute(self.layer, "NEW_SELECTION", self.where_clause)

    def get_selection_query(self) -> Optional[str]:
        return self.where_clause


class OverlayQuery(LayerSpatialQuery):
    def __init__(self, layer: str, selecting_layer: str,
                 spatial_expression: Dict,
                 selection_type: str,
                 wkspc: str,
                 layer_shape_type: str,
                 layer_where_clause: Optional[str] = None,
                 sel_layer_where_clause: Optional[str] = None,
                 layer_name: str = "",
                 sel_layer_name: str = ""):
        """Query allowing overlay (create a new output).

        Args:
            Args:
            layer (str): target layer name where the features will be queried from.
            selecting_layer (str): name of the selecting layer which provides geometry to interact with target layer.
            spatial_expression (Dict): a dictionary describes the spatial operation between the layer and the
            selecting_layer.
            selection_type (str): type of selection.
            wkspc: workspace to save the intermediate result.
            layer_where_clause (Optional[str], optional): a pre-condition where clause to impose on the layer before
            performing the selection. Defaults to None.
            sel_layer_where_clause (Optional[str], optional): a pre-condition where clause to impose on the
            selecting_layer before performing the selection. Defaults to None.
        """
        super(OverlayQuery, self).__init__(layer, selecting_layer, spatial_expression,
                                           selection_type, layer_where_clause,
                                           sel_layer_where_clause)
        self.overlay_output = None
        self.wkspc = wkspc
        self.layer_shape_type = layer_shape_type
        self.layer_name = layer_name
        self.sel_layer_name = sel_layer_name

    def _create_buffer(self, tmp_buffer_output):
        params = {"input_layer": self.selecting_layer,
                  "output_layer": tmp_buffer_output,
                  "distance": self.spatial_dist_val,
                  "units": self.spatial_dist_units,
                  "side_type": "FULL",
                  "end_type": "ROUND",
                  "field": "",
                  "dissolve_type": "ALL",
                  "ring_type": "disks",
                  "calc_field": False,
                  "geodesic": 1}
        SingleBuffer(**params).create()

    def query(self):
        if self.spatial_rel == "WITHIN_A_DISTANCE_GEODESIC" and self.layer_shape_type != "Point":
            buffer_output_name = f"Buffer_{self.sel_layer_name}" if self.sel_layer_name else "tmp_buffer_out"
            tmp_buffer_output = AnalysisUtils.wrap_fcname_from_lyrname(buffer_output_name, self.wkspc)
            try:
                self._create_buffer(tmp_buffer_output)
            # if failed to create the buffer, retry with the name of "tmp_buffer_out"
            except:
                tmp_buffer_output = AnalysisUtils.wrap_fcname_from_lyrname("tmp_buffer_out", self.wkspc)
                self._create_buffer(tmp_buffer_output)

            if self.invert_spatial_rel:
                tmp_out_features = AOLUtils.create_unique_name("tmp_erase_out", self.wkspc)
                LOGGER.debug(f"outfeatures: {tmp_out_features}")
                AnalysisUtils.erase(self.layer, tmp_buffer_output, tmp_out_features)
            else:
                distancefieldname = "WithinDistance"
                distancefieldalias = "Within Distance {}".format(self.spatial_dist_units)
                expression = "{}".format(self.spatial_dist_val)
                arcpy.management.AddField(tmp_buffer_output, distancefieldname, "DOUBLE",
                                          "", "", "", distancefieldalias)
                arcpy.management.CalculateField(tmp_buffer_output, distancefieldname,
                                                expression, CALFIELD_PY_METHOD)
                tmp_out_features = AOLUtils.create_unique_name("tmp_intersect_out", self.wkspc)
                LOGGER.debug(f"outfeatures: {tmp_out_features}")
                # arcpy.analysis.PairwiseIntersect([self.layer, tmp_buffer_output], tmp_out_features, "ALL")
                self.intersect(self.layer, tmp_buffer_output, self.layer_name, "", tmp_out_features)
            self.overlay_output = AOLUtils.make_feature_layer(tmp_out_features)
        elif self.spatial_rel == "INTERSECT" and self.layer_shape_type != "Point":
            if self.invert_spatial_rel:
                tmp_out_features = AOLUtils.create_unique_name("tmp_erase_out", self.wkspc)
                LOGGER.debug(f"outfeatures: {tmp_out_features}")
                AnalysisUtils.erase(self.layer, self.selecting_layer, tmp_out_features)
            else:
                tmp_out_features = AOLUtils.create_unique_name("tmp_intersect_out", self.wkspc)
                LOGGER.debug(f"outfeatures: {tmp_out_features}")
                self.intersect(self.layer, self.selecting_layer, self.layer_name,
                               self.sel_layer_name, tmp_out_features)
                # arcpy.analysis.PairwiseIntersect([self.layer, self.selecting_layer], tmp_out_features)
            self.overlay_output = AOLUtils.make_feature_layer(tmp_out_features)
        else:
            super().query()

    def get_selection_query(self) -> Optional[str]:
        if self.overlay_output is not None:
            return None
        else:
            return super().get_selection_query()

    def _update_fid_field_name(self, intersect_output: str, layer: str, layer_name: str):
        if layer_name.strip():
            tmp_desc = arcpy.Describe(layer)
            if hasattr(tmp_desc, "basename") and tmp_desc.basename:  # type: ignore
                basename = tmp_desc.basename  # type: ignore
                basename = basename.split(".")[-1]
                LOGGER.debug(f"basename of {layer_name} is: {basename}")
                fid_of_interest = f"FID_{basename}"
                fid_of_interest = fid_of_interest[:64] if len(fid_of_interest) > 64 else fid_of_interest
                new_fid_name = f"FID_{layer_name}"
                new_fid_name: str = arcpy.ValidateFieldName(new_fid_name, os.path.dirname(intersect_output))  # type: ignore
                try:
                    arcpy.management.AlterField(intersect_output, fid_of_interest, new_fid_name, new_fid_name)
                    LOGGER.debug(f"Renamed {fid_of_interest} to {new_fid_name}")
                except arcpy.ExecuteError:
                    # there is a limitation on the length of field name on certain dataset. Truncate the
                    # field_name and retry.
                    if len(new_fid_name) > 31:
                        curr_fields = AOLUtils.list_fields(intersect_output)
                        (new_fid_name, new_fid_alias) = FieldUtils.create_unique_field_name(curr_fields,
                                                                                            new_fid_name,
                                                                                            new_fid_name,
                                                                                            31)
                        try:
                            arcpy.management.AlterField(intersect_output, fid_of_interest, new_fid_name,
                                                        new_fid_alias)
                            LOGGER.debug(f"Renamed {fid_of_interest} to {new_fid_name}")
                        except arcpy.ExecuteError:
                            LOGGER.debug(f"Unable to rename {fid_of_interest} to {new_fid_name}")
                    else:
                        LOGGER.debug(f"Unable to rename {fid_of_interest} to {new_fid_name}")

    def intersect(self, layer: str, sel_layer: str, layer_name: str, sel_layer_name: str, output_path: str):
        arcpy.analysis.PairwiseIntersect([layer, sel_layer], output_path, "ALL")
        self._update_fid_field_name(output_path, layer, layer_name)
        self._update_fid_field_name(output_path, sel_layer, sel_layer_name)
