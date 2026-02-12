"""Module provides location utilities"""
# noqa. pylint: disable=import-error
import os
from typing import Dict, List, Optional, Tuple

import arcpy
import arcpy.management

from common import PAFeatureLayer, LogUtils, ToolExit, PAOutputFeatureLayer, AOLUtils

from .expnode import ExpNode, ExpOpNode, ExpMergeNode, ExpUnpackMixin, ExpUtils
from .queryutils import (LayerAttributeQuery, LayerSpatialQuery, NearestFeatureQuery,
                         OverlayQuery)


__all__ = ["ExpUtils", "LocFinder"]

LOGGER = LogUtils.setup_logger(__name__)


class ExpQueryMixin:

    def __init__(self, input_layers: List[PAFeatureLayer], overlay_output: bool):
        self.input_layers = input_layers
        # Have to unpack the layer and use the layer name for the subsequent query since an issue
        # was noted in using the layer instance's layer property. The issue is the query of the
        # layer was not updated.
        self.layers = [lyr.layer for lyr in input_layers]
        # Use layer_name to create more meaningful output. (see issue https://devtopia.esri.com/WebGIS/arcgis-portal-analysis/issues/755)
        self.layer_names = [lyr.layer_name for lyr in input_layers]
        self.overlay_output = overlay_output

    def _unpack_child_nodes_selection(self, exp_node: ExpNode) -> Tuple:
        if exp_node.attr_exp:
            prev_lyr_selection = exp_node.child_nodes[0].selection if exp_node.child_nodes else None
            return (prev_lyr_selection, None)
        else:
            if exp_node.child_nodes is None:
                return (None, None)
            elif len(exp_node.child_nodes) == 1:
                if exp_node.child_nodes[0].layer_index == exp_node.layer_index:
                    return (exp_node.child_nodes[0].selection, None)
                elif exp_node.child_nodes[0].layer_index == exp_node.sel_layer_index:
                    return (None, exp_node.child_nodes[0].selection)
                else:
                    return (None, None)
            elif len(exp_node.child_nodes) == 2:
                return (exp_node.child_nodes[0].selection, exp_node.child_nodes[1].selection)
        return (None, None)

    def _fel_query(self, exp_node: ExpNode, pre_selection: Optional[str]):
        if isinstance(exp_node, ExpOpNode):
            input_lyr = self.layers[exp_node.layer_index]
            # preprocess to carry over already selected features (i.e., features in context extent)
            if pre_selection:
                LayerAttributeQuery(input_lyr, pre_selection, "NEW_SELECTION").query()
                selection_type = "SUBSET_SELECTION"
            elif exp_node.child_nodes is None:
                arcpy.management.SelectLayerByAttribute(input_lyr, "CLEAR_SELECTION")
                selection_type = "NEW_SELECTION"
            else:
                selection_type = "NEW_SELECTION"

            if exp_node.attr_exp:
                (prev_selection, _) = self._unpack_child_nodes_selection(exp_node)
                if exp_node.child_nodes is None and prev_selection is None:
                    prev_selection = pre_selection

                where_clauses = []
                for expression in exp_node.expressions:
                    validated_where_clause = ExpUtils.parse_single_where_clause(self.input_layers[exp_node.layer_index],
                                                                                expression["where"])
                    where_clauses.append({expression["operator"]: validated_where_clause})
                if prev_selection:
                    where_clauses.append({"and": prev_selection})

                cquery = LayerAttributeQuery(input_lyr, ExpUtils.concatenate_queries(None, where_clauses),  # type: ignore
                                             selection_type)
            else:
                selecting_lyr = self.layers[exp_node.sel_layer_index]  # type: ignore
                (input_selection, sel_selection) = self._unpack_child_nodes_selection(exp_node)
                wkspc = AOLUtils.get_output_wkspc(self.input_layers[exp_node.layer_index].count)
                if exp_node.nearest_in_query:
                    dist_val = exp_node.orig_expression.get("distance")
                    dist_units = exp_node.orig_expression.get("units", "Meters")
                    dist = f"{dist_val} {dist_units}" if dist_val else None
                    cquery = NearestFeatureQuery(input_lyr, selecting_lyr, selection_type,
                                                 self.input_layers[exp_node.layer_index].OIDFieldName,
                                                 wkspc, input_selection, sel_selection, dist)
                else:
                    cquery = LayerSpatialQuery(input_lyr, selecting_lyr, exp_node.orig_expression,
                                               selection_type, input_selection, sel_selection)
        elif isinstance(exp_node, ExpMergeNode):
            where_clauses = []
            for cnode in exp_node.child_nodes:  # type: ignore
                if cnode.selection:
                    where_clauses.append({cnode.operator: cnode.selection})
            where_clause = ExpUtils.concatenate_queries(None, where_clauses)
            input_lyr = self.layers[exp_node.layer_index]
            cquery = LayerAttributeQuery(input_lyr, where_clause, "NEW_SELECTION")  # type: ignore
        else:
            LOGGER.error(f"Unsupported exp_node type of {type(exp_node)}.")
            raise TypeError
        cquery.query()
        exp_node.selection = cquery.get_selection_query()  # type: ignore

    def _dnl_query(self, exp_node: ExpNode, pre_selection: Optional[str]):
        if isinstance(exp_node, ExpOpNode):
            if pre_selection:
                LayerAttributeQuery(self.layers[exp_node.layer_index], pre_selection, "NEW_SELECTION").query()
                selection_type = "SUBSET_SELECTION"
            elif exp_node.child_nodes is None:
                arcpy.management.SelectLayerByAttribute(self.layers[exp_node.layer_index], "CLEAR_SELECTION")
                selection_type = "NEW_SELECTION"
            else:
                selection_type = "NEW_SELECTION"

            if exp_node.attr_exp:
                (prev_selection, _) = self._unpack_child_nodes_selection(exp_node)
                if exp_node.child_nodes is None and prev_selection is None:
                    prev_selection = pre_selection
                input_lyr = self.layers[exp_node.layer_index]
                if exp_node.child_nodes and exp_node.child_nodes[0].node_output:
                    input_lyr = exp_node.child_nodes[0].node_output
                    exp_node.node_output = exp_node.child_nodes[0].node_output

                where_clauses = []
                for expression in exp_node.expressions:
                    validated_where_clause = ExpUtils.parse_single_where_clause(input_lyr,
                                                                                expression["where"])
                    where_clauses.append({expression["operator"]: validated_where_clause})
                if prev_selection:
                    where_clauses.append({"and": prev_selection})

                where_clause = ExpUtils.concatenate_queries(None, where_clauses)
                cquery = LayerAttributeQuery(input_lyr, where_clause, selection_type)  # type: ignore
            else:
                if exp_node.sel_layer_index is None:
                    LOGGER.debug("select layer index can't be empty for spatial operation.")
                    raise ToolExit
                input_lyr = self.layers[exp_node.layer_index]
                selecting_lyr = self.layers[exp_node.sel_layer_index]
                if self.layer_names[exp_node.layer_index] == "feature collection":
                    input_lyr_name = ""
                else:
                    input_lyr_name = self.layer_names[exp_node.layer_index]
                if self.layer_names[exp_node.sel_layer_index] == "feature collection":
                    sel_lyr_name = ""
                else:
                    sel_lyr_name = self.layer_names[exp_node.sel_layer_index]
                (input_selection, sel_selection) = self._unpack_child_nodes_selection(exp_node)
                if (
                    exp_node.child_nodes
                    and len(exp_node.child_nodes) == 2
                ):
                    if exp_node.child_nodes[0].node_output:
                        input_lyr = exp_node.child_nodes[0].node_output
                        exp_node.node_output = exp_node.child_nodes[0].node_output
                        input_lyr_name = ""

                    if exp_node.child_nodes[1].node_output:
                        selecting_lyr = exp_node.child_nodes[1].node_output
                        sel_lyr_name = ""

                elif (exp_node.child_nodes
                      and exp_node.child_nodes[0].layer_index == exp_node.layer_index
                      and exp_node.child_nodes[0].node_output
                ):
                    input_lyr = exp_node.child_nodes[0].node_output
                    input_lyr_name = ""
                    exp_node.node_output = exp_node.child_nodes[0].node_output

                elif (
                    exp_node.child_nodes
                    and exp_node.child_nodes[0].layer_index == exp_node.sel_layer_index
                    and exp_node.child_nodes[0].node_output
                ):
                    selecting_lyr = exp_node.child_nodes[0].node_output
                    sel_lyr_name = ""

                wkspc = AOLUtils.get_output_wkspc(self.input_layers[exp_node.layer_index].count)
                if exp_node.nearest_in_query:
                    dist_val = exp_node.orig_expression.get("distance")
                    dist_units = exp_node.orig_expression.get("units", "Meters")
                    dist = f"{dist_val} {dist_units}" if dist_val else None

                    cquery = NearestFeatureQuery(input_lyr, selecting_lyr, selection_type,
                                                 self.input_layers[exp_node.layer_index].OIDFieldName,
                                                 wkspc, input_selection, sel_selection, dist)
                else:
                    cquery = OverlayQuery(input_lyr, selecting_lyr, exp_node.orig_expression,
                                          selection_type, wkspc,
                                          self.input_layers[exp_node.layer_index].shapeType,
                                          input_selection, sel_selection,
                                          input_lyr_name,
                                          sel_lyr_name)
        elif isinstance(exp_node, ExpMergeNode):
            where_clauses = []
            node_outputs = []
            for cnode in exp_node.child_nodes:  # type: ignore
                if cnode.node_output is None:
                    if cnode.selection:
                        where_clauses.append({cnode.operator: cnode.selection})
                else:
                    node_outputs.append(cnode.node_output)
            if where_clauses:
                where_clause = ExpUtils.concatenate_queries(None, where_clauses)
            else:
                where_clause = None

            if not node_outputs:
                input_lyr = self.layers[exp_node.layer_index]
                cquery = LayerAttributeQuery(input_lyr, where_clause, "NEW_SELECTION")  # type: ignore
            else:
                if where_clause:
                    # concatenate all layers
                    input_lyr = self.layers[exp_node.layer_index]
                    cquery = LayerAttributeQuery(input_lyr, where_clause, "NEW_SELECTION")
                    cquery.query()
                    node_outputs += [input_lyr]
                output_lyr = AOLUtils.create_unique_name("mergeOutput", "scratchgdb")
                arcpy.management.Merge(node_outputs, output_lyr)
                exp_node.node_output = output_lyr
                return
        else:
            LOGGER.error(f"Unsupported exp_node type of {type(exp_node)}.")
            raise TypeError
        cquery.query()
        exp_node.selection = cquery.get_selection_query()  # type: ignore
        if hasattr(cquery, "overlay_output") and cquery.overlay_output is not None:  # type: ignore
            exp_node.node_output = cquery.overlay_output  # type: ignore

    def query(self, exp_node: ExpNode, pre_selection: Optional[str] = None):
        if not self.overlay_output:
            self._fel_query(exp_node, pre_selection)
        else:
            self._dnl_query(exp_node, pre_selection)


class LocFinder(ExpQueryMixin):

    def __init__(self, input_layers: List[PAFeatureLayer], expressions: List,
                 output_layer: PAOutputFeatureLayer,
                 overlay_output: bool):
        """initialize attributes.

        Args:
            input_layers (List[PAFeatureLayer]): a list of PAFeatureLayer instances to perform queries upon.
            expressions (List): a list of expressions based on which to perform queries.
            output_layer (PAOutputFeatureLayer): an instance of PAOutputFeatureLayer where the final output will
            be stored.
            overlay_output (bool): True if overlay is needed (DeriveNewLocations) and False to perform the
            FindExistingLocations logic.
        """
        super(LocFinder, self).__init__(input_layers, overlay_output)
        self.root_node = ExpUnpackMixin(expressions).unpack()
        if len(self.root_node.results_from_layers) != 1:
            LOGGER.error(100262, extra={"message_ID": 100262})
            raise ToolExit
        self.output_layer = output_layer

    def get_initial_selection(self) -> Dict:
        """Pull the initial selection of input layers. The initial selection can be features fall within map extent
        and filter imposed on the layer.

        Returns:
            Dict: a dictionary keyed by the layer index and valued by a where_clause (i.e., "ObjectID in (1, 2,...)").
        """
        initial_selection = {}
        for i, lyr in enumerate(self.input_layers):
            if lyr.FIDSet.strip():
                if lyr.FIDSet:
                    fidset = lyr.FIDSet.replace(";", ",")
                    initial_selection[i] = f"{lyr.OIDFieldName} in ({fidset})"

        # set the context extent to None so the downstream selection won't be affected.
        arcpy.env.extent = None  # type: ignore
        return initial_selection

    def _find(self, exp_node: ExpNode):
        if exp_node.child_nodes:
            child_sel_node_count = 0
            for cnode in exp_node.child_nodes:
                if cnode.layer_index == exp_node.sel_layer_index:
                    child_sel_node_count += 1
                self._find(cnode)
            if child_sel_node_count == len(exp_node.child_nodes):
                pre_selection = self.initial_selection.get(exp_node.layer_index)
            else:
                if exp_node.child_nodes[0] and exp_node.child_nodes[0].operator == "and":
                    pre_selection = self.initial_selection.get(exp_node.layer_index)
                else:
                    pre_selection = None
            self.query(exp_node, pre_selection)
        else:
            pre_selection = self.initial_selection.get(exp_node.layer_index)
            self.query(exp_node, pre_selection)

    def find(self):
        """Core logic to perform the query."""
        self.initial_selection = self.get_initial_selection()
        self._find(self.root_node)

        if self.overlay_output and self.root_node.node_output:
            result_lyr = self.root_node.node_output
        elif self.root_node.selection:
            result_lyr = self.layers[0]
        else:
            result_lyr = None
        LOGGER.debug(f"result_lyr: {result_lyr}")
        if result_lyr:
            with arcpy.EnvManager(extent=None):
                arcpy.management.CopyFeatures(result_lyr, self.output_layer.data)  # type: ignore
        else:
            wkspc = os.path.dirname(self.output_layer.data)
            fc_name = os.path.basename(self.output_layer.data)
            arcpy.management.CreateFeatureclass(wkspc,  # type: ignore
                                                fc_name,
                                                self.input_layers[0].shapeType,
                                                self.input_layers[0].layer,
                                                "SAME_AS_TEMPLATE",
                                                "SAME_AS_TEMPLATE",
                                                self.input_layers[0].layer)
