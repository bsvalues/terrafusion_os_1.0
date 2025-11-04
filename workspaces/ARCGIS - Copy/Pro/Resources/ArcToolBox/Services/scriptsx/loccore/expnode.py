from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple, Union
import json
import re

from common import (LogUtils, ToolExit, PAFeatureLayer, FieldUtils, AnalysisUtils,
                    AOLUtils)


__all__ = ["ExpNode", "ExpOpNode", "ExpMergeNode", "ExpUnpackMixin", "ExpUtils"]

LOGGER = LogUtils.setup_logger(__name__)


class ExpNode(ABC):

    SPATIAL_REL_TYPES = ["INTERSECTS", "NOTINTERSECTS", "WITHINDISTANCE",
                         "NOTWITHINDISTANCE", "COMPLETELYWITHIN",
                         "COMPLETELYCONTAINS", "NOTCOMPLETELYCONTAINS",
                         "NOTCOMPLETELYWITHIN", "WITHIN", "NOTWITHIN",
                         "CONTAINS", "NOTCONTAINS", "NEAREST"]

    def __init__(self, expression: Dict):
        self.orig_expression = self.verify(expression)
        self.operator = expression.get("operator", "").lower()
        self.layer_index: int = expression.get("layer")  # type: ignore
        self.child_nodes: Optional[List[ExpNode]] = None
        self.parent_node: Optional[ExpNode] = None
        self.sel_layer_index: Optional[int] = expression.get("selectingLayer")
        self.attr_exp: Optional[str] = expression.get("where") is not None  # type: ignore
        self.nearest_in_query: bool = (expression.get("spatialRel", "").lower() == "nearest")
        self.node_output: Optional[str] = None
        self.selection = None
        self._result_from_layers = None

    @abstractmethod
    def add_child_node(self, cnode: "ExpNode"):
        raise NotImplementedError

    @abstractmethod
    def replace_child_node(self, cnode: "ExpNode"):
        raise NotImplementedError

    def merge_node(self, mnode: "ExpNode"):
        self._merge(self, mnode)

    def _merge(self, cnode: "ExpNode", mnode: "ExpNode"):
        if isinstance(cnode, ExpMergeNode):
            cnode.add_child_node(mnode)
        elif cnode.parent_node is None:
            pnode = ExpMergeNode(cnode.orig_expression)
            pnode.add_child_node(cnode)
            pnode.add_child_node(mnode)
        elif (
            cnode.parent_node is not None
            and mnode.layer_index == cnode.parent_node.layer_index  # type: ignore
        ):
            self._merge(cnode.parent_node, mnode)
        else:
            pnode = ExpMergeNode(cnode.orig_expression)
            cnode.parent_node.replace_child_node(pnode)
            pnode.add_child_node(cnode)
            pnode.add_child_node(mnode)

    def verify(self, expression: Dict) -> Dict:
        if "operator" not in expression:
            # LOGGER.error(100055, extra={"message_ID": 100055})
            # raise ToolExit
            raise RuntimeError

        expression["operator"] = expression["operator"].lower()
        if expression.get("where"):
            required_keys = ["layer", "where"]
        elif expression.get("spatialRel"):
            spatial_rel = expression["spatialRel"].upper()
            expression["spatialRel"] = spatial_rel
            if spatial_rel not in self.SPATIAL_REL_TYPES:
                expr = json.dumps(expression, ensure_ascii=False, sort_keys=True)
                LOGGER.error(100059, extra={"message_ID": 100059,
                                            "spatialRel": spatial_rel,
                                            "expression": expr})
                raise ToolExit

            required_keys = ["layer", "spatialRel", "selectingLayer"]
            if "withindistance" in spatial_rel:
                required_keys.extend(["distance", "units"])
        else:
            LOGGER.error(100055, extra={"message_ID": 100055})
            raise ToolExit

        missing_keys = []
        for curr_key in required_keys:
            if curr_key not in expression:
                missing_keys.append(curr_key)

        if missing_keys:
            missing_keys = ";".join(missing_keys)
            expression = json.dumps(expression, ensure_ascii=False, sort_keys=True)  # type: ignore
            LOGGER.debug(f'missing_keys: {missing_keys}')
            error_code = 100053 if self.attr_exp else 100054
            LOGGER.error(error_code, extra={"message_ID": error_code,
                                            "missingKeys": missing_keys,
                                            "expression": expression})
            raise ToolExit

        return expression

    @property
    def results_from_layers(self) -> List:
        if self._result_from_layers is None:
            result_layer = [self.layer_index]
            self._get_node_result_layer(self, result_layer)
            self._result_from_layers = result_layer

        return self._result_from_layers

    def _get_node_result_layer(self, curr_node: "ExpNode", current_layers: List):
        if curr_node.operator != "or":
            if curr_node.layer_index in current_layers:
                return
            else:
                current_layers.append(curr_node.layer_index)
        if curr_node.child_nodes:
            for cnode in curr_node.child_nodes:
                self._get_node_result_layer(cnode, current_layers)
            if curr_node.operator == "or" and curr_node.layer_index not in current_layers:
                current_layers.append(curr_node.layer_index)
        else:
            if curr_node.operator == "or" and curr_node.layer_index not in current_layers:
                current_layers.append(curr_node.layer_index)


class ExpOpNode(ExpNode):

    def __init__(self, expression: Dict):
        super(ExpOpNode, self).__init__(expression)
        self.expressions = [expression]

    def add_expression(self, expression: Union[Dict, List]):
        if isinstance(expression, list) and len(expression) == 1:
            self.expressions += expression
        else:
            self.expressions += [expression]

    def add_child_node(self, cnode: ExpNode):
        if self.child_nodes is None:
            if (
                isinstance(cnode, ExpOpNode)
                and not self.nearest_in_query
                and cnode.nearest_in_query
                and cnode.layer_index == self.layer_index
            ):
                self.flip_node(self, cnode)
            else:
                self.child_nodes = [cnode]
                cnode.parent_node = self
        elif not self.attr_exp and self.sel_layer_index == cnode.layer_index and cnode.operator == "and":
            self.child_nodes += [cnode]
            cnode.parent_node = self
        elif (
            not self.attr_exp
            and self.layer_index == cnode.layer_index
            and self.child_nodes is not None
            and self.child_nodes[0].layer_index == self.sel_layer_index
        ):
            self.child_nodes = [cnode] + self.child_nodes
            cnode.parent_node = self
        elif (
            cnode.operator == "and"
            and self.nearest_in_query
            and cnode.nearest_in_query
            and cnode.layer_index == self.layer_index
        ):
            if self.child_nodes:
                cnode.add_child_node(self.child_nodes[0])
                self.child_nodes = [cnode]
                cnode.parent_node = self
            else:
                self.child_nodes = [cnode]
                cnode.parent_node = self
        elif self.child_nodes[0].layer_index == cnode.layer_index:
            self.child_nodes[0].add_child_node(cnode)
        else:
            raise RuntimeError("Unable to insert cnode as child")

    def replace_child_node(self, cnode: ExpNode):
        self.child_nodes = [cnode]
        cnode.parent_node = self  # type: ignore

    def flip_operator(self, cnode: ExpNode, mnode: ExpNode):
        (mnode.operator, cnode.operator) = (cnode.operator, mnode.operator)
        mo_expression = mnode.orig_expression
        co_expression = cnode.orig_expression
        (mo_expression["operator"], co_expression["operator"]) = (co_expression["operator"], mo_expression["operator"])
        mnode.orig_expression = mo_expression
        cnode.orig_expression = co_expression
        if isinstance(cnode, ExpNode) and isinstance(mnode, ExpNode):
            mnode.expressions[0] = mo_expression  # type: ignore
            cnode.expressions[0] = co_expression  # type: ignore

    def flip_node(self, cnode: ExpNode, mnode: ExpNode):
        if cnode.parent_node is None:
            mnode.add_child_node(cnode)
            self.flip_operator(cnode, mnode)
        elif isinstance(cnode.parent_node, ExpMergeNode):
            cnode.parent_node.replace_child_node(mnode)
            mnode.add_child_node(cnode)
            self.flip_operator(cnode, mnode)
        # concatenated attribute queries
        elif (
                isinstance(cnode.parent_node, ExpOpNode)
                and len(cnode.parent_node.expressions) > 1
                and (cnode.parent_node.expressions[-1].get("operator", "") == "or")
        ):
            cnode.parent_node.replace_child_node(mnode)
            mnode.add_child_node(cnode)
        else:
            self.flip_node(cnode.parent_node, mnode)

    def bubble_node(self, cnode: ExpNode):
        self._bubble(self.parent_node, cnode)

    def _bubble(self, pnode: Optional[ExpNode], cnode: ExpNode):
        if pnode is None or isinstance(pnode, ExpMergeNode):
            LOGGER.error(100262, extra={"message_ID": 100262})
            raise ValueError
        elif pnode.layer_index == cnode.layer_index:
            pnode.merge_node(cnode)
        elif pnode.sel_layer_index == cnode.layer_index:
            pnode.add_child_node(cnode)
        else:
            self._bubble(pnode.parent_node, cnode)


class ExpMergeNode(ExpNode):

    def __init__(self, expression: Dict):
        super(ExpMergeNode, self).__init__(expression)

    def add_child_node(self, cnode: ExpNode):
        if self.child_nodes is None:
            self.child_nodes = [cnode]
        else:
            self.child_nodes += [cnode]
        cnode.parent_node = self

    def replace_child_node(self, cnode: ExpNode):
        if self.child_nodes is None:
            self.child_nodes = [cnode]
        else:
            self.child_nodes[-1] = cnode


class ExpUnpackMixin:

    def __init__(self, expressions: List):
        if (not isinstance(expressions, list)) or (not expressions):
            LOGGER.error(100055, extra={"message_ID": 100055})
            raise ValueError

        self.expressions = self._combine_nearest_within_expression(expressions)

    def _combine_nearest_within_expression(self, expressions: List) -> List:
        new_expressions = []
        prev_exp = None
        for exp in expressions:
            if prev_exp is None:
                prev_exp = exp
                new_expressions.append(prev_exp)
            elif isinstance(exp, dict):
                if (
                    exp.get("operator", "").lower() == "and"
                    and exp.get("spatialRel")
                    and isinstance(prev_exp, dict)
                    and prev_exp.get("spatialRel")
                    and exp.get("layer") == prev_exp.get("layer")
                    and exp.get("selectingLayer") == prev_exp.get("selectingLayer")
                ):
                    exp_rel = exp.get("spatialRel").upper()  # type: ignore
                    prev_exp_rel = prev_exp.get("spatialRel").upper()
                    if (
                        (exp_rel == "NEAREST" and prev_exp_rel == "WITHINDISTANCE")
                        or (exp_rel == "WITHINDISTANCE" and prev_exp_rel == "NEAREST")
                    ):
                        spatial_exp = exp if exp_rel == "WITHINDISTANCE" else prev_exp
                        (_, dist_val, dist_unit) = ExpUtils.get_distance_info(spatial_exp)
                        prev_exp["spatialRel"] = "NEAREST"
                        prev_exp["distance"] = dist_val
                        prev_exp["units"] = dist_unit
                    else:
                        prev_exp = exp
                        new_expressions.append(prev_exp)
                else:
                    prev_exp = exp
                    new_expressions.append(prev_exp)
            else:
                new_expressions.append(self._combine_nearest_within_expression(exp))
        return new_expressions

    def unpack(self) -> ExpNode:
        root_node = self.create_node_from_expression(self.expressions[0])
        self._unpack(self.expressions[1::], root_node)
        return self.get_root_node(root_node)

    def get_root_node(self, exp_node: ExpNode) -> ExpNode:
        if exp_node.parent_node is None:
            return exp_node
        else:
            return self.get_root_node(exp_node.parent_node)
    
    def _combine(self, prev_node: ExpNode, tmp_node: ExpNode) -> ExpNode:
        if (
            tmp_node.operator.lower() == 'and'
            and tmp_node.layer_index == prev_node.layer_index
            and prev_node.parent_node
            and isinstance(prev_node.parent_node, ExpMergeNode)
        ):
            prev_node.merge_node(tmp_node)
            prev_node = tmp_node
        elif (
            tmp_node.attr_exp
            and isinstance(prev_node, ExpOpNode)
            and prev_node.attr_exp
            and tmp_node.layer_index == prev_node.layer_index
        ):
            if (
                isinstance(tmp_node, ExpOpNode)
                and len(tmp_node.expressions) == 1
                and not tmp_node.child_nodes
            ):
                prev_node.add_expression(tmp_node.orig_expression)
            else:
                if tmp_node.operator.lower() == 'or':
                    prev_node.merge_node(tmp_node)
                else:
                    prev_node.add_child_node(tmp_node)
                prev_node = tmp_node
        elif (
            tmp_node.operator.lower() == "and"
            and (tmp_node.layer_index == prev_node.layer_index
            or tmp_node.layer_index == prev_node.sel_layer_index)
        ):
            prev_node.add_child_node(tmp_node)
            prev_node = tmp_node
        elif (
            isinstance(prev_node, ExpOpNode)
            and (tmp_node.layer_index != prev_node.layer_index
            and tmp_node.layer_index != prev_node.sel_layer_index)
        ):
            prev_node.bubble_node(tmp_node)
            prev_node = tmp_node
        elif (
            tmp_node.operator.lower() == "or"
            and tmp_node.layer_index == prev_node.layer_index
        ):
            prev_node.merge_node(tmp_node)
            prev_node = tmp_node
        else:
            LOGGER.error(100262, extra={"message_ID": 100262})
            raise ValueError
        return prev_node

    def _unpack(self, expressions: List, prev_node: ExpNode):
        for exp in expressions:
            if isinstance(exp, dict):
                tmp_node = self.create_node_from_expression(exp)
                prev_node = self._combine(prev_node, tmp_node)
            elif isinstance(exp, list):
                grp_node = self.create_node_from_expression(exp[0])
                self._unpack(exp[1::], grp_node)
                if (
                    isinstance(grp_node, ExpMergeNode)
                    or grp_node.parent_node is not None
                ):
                    prev_node = self._combine(prev_node, grp_node.parent_node)
                else:
                    prev_node = self._combine(prev_node, grp_node)
            else:
                LOGGER.error(100055, extra={"message_ID": 100055})
                raise ValueError
    
    def create_node_from_expression(self, expression: Union[List, Dict]) -> ExpNode:
        if isinstance(expression, dict):
            return ExpOpNode(expression)
        else:
            if len(expression) == 0:
                return None
            elif len(expression) == 1:
                return self.create_node_from_expression(expression[0])
            else:
                first_node = self.create_node_from_expression(expression[0])
                self._unpack(expression[1::], first_node)
                return first_node


class ExpUtils:
    """Utilities functions for expression."""
    SNIPPETS_FROM = ["= N'", "<> N'", "LIKE N'"]
    SNIPPETS_TO = ["= '", "<> '", "LIKE '"]

    @classmethod
    def verify_spatial_rel(cls, layer: PAFeatureLayer, selecting_layer: PAFeatureLayer,
                           expression: Dict):
        """Verify geometry combinations.

        Args:
            layer (PAFeatureLayer): an instance of PAFeatureLayer represents the target layer.
            selecting_layer (PAFeatureLayer): an instance of PAFeatureLayer represents the selecting layer.
            expression (Dict): an expression represents the spatial relationship.

        Raises:
            AO_100058: invalid of geometry combinations.
        """
        geometry_types = ["Multipoint", "Point", "Polyline", "Polygon"]

        lyr_geom_type = layer.shapeType
        sel_lyr_geomtype = selecting_layer.shapeType
        process_error = False
        spatial_rel = expression.get("spatialRel", {})

        if "CONTAINS" in spatial_rel:
            if "point" in lyr_geom_type.lower():
                if sel_lyr_geomtype not in geometry_types[0:2]:
                    process_error = True
            elif lyr_geom_type == "Polyline":
                if sel_lyr_geomtype not in geometry_types[0:3]:
                    process_error = True
        if "WITHIN" in spatial_rel and 'DISTANCE' not in spatial_rel:
            if "point" in sel_lyr_geomtype.lower():
                if lyr_geom_type not in geometry_types[0:2]:
                    process_error = True
            elif sel_lyr_geomtype == "Polyline":
                if lyr_geom_type not in geometry_types[0:3]:
                    process_error = True

        if process_error:
            expression = json.dumps(expression, ensure_ascii=False, sort_keys=True)  # type: ignore
            LOGGER.error(100058, extra={"message_ID": 100058,
                                        "spatialRel": spatial_rel,
                                        "lyrGeomType": lyr_geom_type,
                                        "selLyrGeomType": sel_lyr_geomtype,
                                        "expression": expression})
            raise ToolExit

    @classmethod
    def parse_single_where_clause(cls, layer: Union[PAFeatureLayer, str], where_clause: str) -> str:
        """Parse the where clause base on the input.

        Args:
            layer (PAFeatureLayer): the input PAFeatureLayer.
            where_clause (str): the initial where clause.

        Raises:
            AO_100078: if a field can not be found from the layer. 
            AO_100055: if the where_clause is invalid.

        Returns:
            str: a valid where_clause that can be used to query against the layer.
        """
        values = where_clause.split(" ")
        field_name = values[0]
        if isinstance(layer, PAFeatureLayer):
            fields = layer.fields
            catalog_path = layer.catalogPath
        else:
            fields = AOLUtils.list_fields(layer)
            catalog_path = AOLUtils.describe(layer).catalogPath
        LOGGER.debug(f"{catalog_path=}")

        field = FieldUtils.get_field_by_name(fields, field_name)
        if field is None:
            shape_related_fields = {"shape__area": "shape_area", "shape__length": "shape_length"}
            if field_name.lower() in shape_related_fields:
                LOGGER.debug(f"Try using field name as: {shape_related_fields[field_name.lower()]}.")
                field = FieldUtils.get_field_by_name(fields, shape_related_fields[field_name.lower()])
                if field:
                    where_clause = where_clause.replace(field_name, field.name)

        if field is None:
            where_clause = json.dumps(where_clause, ensure_ascii=False, sort_keys=True)
            LOGGER.error(100078, extra={"message_ID": 100078, 'expression': where_clause})
            raise ToolExit

        if "in_memory" in catalog_path:
            b_inmemory = True
        else:
            b_inmemory = False
        # LOGGER.debug(f"initial where_clause before parsing: {where_clause}")

        if field.type in ["Date", "Double", "Integer", "Single", "SmallInteger"] and "between" in where_clause.lower():
            if "not between" in where_clause.lower():
                pattern = "NOT BETWEEN|AND"
                between_clause = False
            else:
                pattern = "BETWEEN|AND"
                between_clause = True
            split_where = re.split(pattern, where_clause, re.IGNORECASE)
            if len(split_where) != 3:
                LOGGER.error(100055, extra={"message_ID": 100055})
                raise ValueError

            (fname_in_clause, lower_rng, upper_rng) = split_where
            try:
                if field.type in ["Integer", "SmallInteger"]:
                    lower_rng = int(lower_rng)
                    upper_rng = int(upper_rng)
                elif field.type in ["Double", "Single"]:
                    lower_rng = float(lower_rng)
                    upper_rng = float(upper_rng)
            except ValueError:
                LOGGER.error(100055, extra={"message_ID": 100055})
                raise ValueError

            if between_clause:
                where_clause = f"{fname_in_clause} >= {lower_rng} AND {fname_in_clause} <= {upper_rng}"
            else:
                where_clause = f"{fname_in_clause} < {lower_rng} OR {fname_in_clause} > {upper_rng}"

        elif b_inmemory and field.type == "String":
            where_clause = ExpUtils.update_str_clause(cls.SNIPPETS_FROM,
                                                      cls.SNIPPETS_TO,
                                                      where_clause)
        
        elif field.type == "String" and "N'" not in where_clause.upper():
            if AnalysisUtils.contain_non_latin_chars(where_clause):
                where_clause = ExpUtils.update_str_clause(cls.SNIPPETS_TO,
                                                          cls.SNIPPETS_FROM,
                                                          where_clause)

        if field.type == "Date" and (b_inmemory or ".gdb" in catalog_path):
            if "timestamp" in where_clause:
                where_clause = where_clause.replace("timestamp", "date")
            else:
                where_clause = where_clause.replace(" '", " date '")
        # for hosted feature layer, drop the timestamp prefix otherwise SelectLayerByAttribute will fail
        elif field.type == "Date" and isinstance(layer, PAFeatureLayer) and layer.is_hosted_data:
            (ts_pref, rep_pref) = ("timestamp '", "'") if "timestamp '" in where_clause else ("timestamp", "")
            where_clause = where_clause.replace(ts_pref, rep_pref)
        elif field.type == "Date" and isinstance(layer, str) and ".sde" in catalog_path.lower():
            (ts_pref, rep_pref) = ("timestamp '", "'") if "timestamp '" in where_clause else ("timestamp", "")
            where_clause = where_clause.replace(ts_pref, rep_pref)
        elif field.type == "TimeOnly" and "time '" in where_clause:
            where_clause = where_clause.replace("time '", "'")
        elif field.type == "DateOnly" and "date '" in where_clause:
            where_clause = where_clause.replace("date '", "'")

        LOGGER.debug(f"where_clause after parsing: {where_clause}")
        return where_clause

    @classmethod
    def concatenate_queries(cls, node_query: Optional[str], sub_node_queries: List[Dict]) -> Optional[str]:
        """Concatenate multiple queries into one query.

        Args:
            node_query (Optional[str]): a starting query to concatenate upon.
            sub_node_queries (List[Dict]): a list of queries to append.

        Raises:
            AO_100055: if the operator is not and, or, "".

        Returns:
            Optional[str]: a concatenated query.
        """
        if not sub_node_queries:
            return node_query

        curr_query = node_query if node_query else ""

        for i, sn_query in enumerate(sub_node_queries):
            if sn_query:
                if "" in sn_query and i == 0:
                    curr_query = sn_query[""]
                elif "and" in sn_query:
                    if curr_query and sn_query["and"] is not None:
                        curr_query = f"(({curr_query}) AND ({sn_query['and']}))"
                    else:
                        curr_query = sn_query["and"]
                elif "or" in sn_query:
                    if curr_query and sn_query["or"] is not None:
                        curr_query = f"{curr_query} or {sn_query['or']}"
                    else:
                        curr_query = sn_query["or"]
                else:
                    LOGGER.error(100055, extra={"message_ID": 100055})
                    raise ValueError
        return curr_query

    @classmethod
    def get_distance_info(cls, spatial_expression: Dict) -> Tuple:
        """Get the distance info from the expression.

        Raises:
            AO_100062: if unable to get the desired distance information.

        Returns:
            Tuple: a three item tuple where the first item is the linear distance, the second item is the distance
            value, and the third item is the units of distance.
        """
        distance = "#"
        distance_val = 0
        units = "Meters"
        if "WITHINDISTANCE" in spatial_expression["spatialRel"].upper():
            distance_val = spatial_expression.get("distance")
            invalid_dist_val = False
            if isinstance(distance_val, int) or isinstance(distance_val, float):
                if distance_val > 0:
                    units = spatial_expression.get("units", "Meters")
                    if units.lower() in ["feet", "kilometers", "meters", "miles", "nauticalmiles", "yards"]:
                        distance = "{} {}".format(distance_val, units)
                    else:
                        invalid_dist_val = True
                else:
                    invalid_dist_val = True
            else:
                invalid_dist_val = True
            if invalid_dist_val:
                expression = json.dumps(spatial_expression, ensure_ascii=False, sort_keys=True)
                LOGGER.error(100062, extra={"message_ID": 100062, "expression": expression})
                raise ToolExit
        return (distance, distance_val, units)

    @classmethod
    def update_str_clause(cls, from_snippets: List[str], to_snippets: List[str], clause: str) -> str:
        """update the where clause for string field type

        Args:
            from_snippets (List[str]): a list of snippets to check against the clause.
            to_snippets (List[str]): a list of snippets to replace in the clause.
            clause (str): the where clause to update.

        Returns:
            str: updated where clause.
        """
        for f_snip, to_snip in zip(from_snippets, to_snippets):
            if f_snip in clause.upper():
                pattern = re.compile(re.escape(f_snip), re.IGNORECASE)
                return pattern.sub(to_snip, clause)
        return clause
