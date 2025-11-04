"""renderer module."""
# Allow using {} format. pylint: disable=W1202
import os
import locale
import json
import ast
from copy import deepcopy
from abc import ABC, abstractmethod
from typing import Union, Optional, Dict, List

import arcpy
import arcpy.management

from .pacommon import PALayer, PAOutputFeatureLayer
from .palog import LogUtils
from .aolutils import AOLUtils


LOGGER = LogUtils.setup_logger(__name__)

__all__ = ["Renderer", "SimpleRenderer", "UniqueValueRenderer", "GraduatedColorsRenderer",
           "GraduatedSymbolRenderer"]


class Renderer(ABC):
    """Abstract class module defining the interface of all renderers."""

    RSC_FOLDER_NAME = "renderer_templates"

    @staticmethod
    def get_file_path(file_name: str) -> str:
        """Get the full path of a specified renderer file.

        Args:
            file_name: name of the resource file. File with the desired name is searched under
            resources/renderer_templates. If no file found, use the file_name as the path.
        Returns:
            Absolute path of the renderer file.
        Raises:
            IOError if no file found.

        """
        file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                 "resources", Renderer.RSC_FOLDER_NAME,
                                 file_name)

        if not os.path.exists(file_path):
            file_path = file_name

        if not os.path.exists(file_path):
            LOGGER.error("Failed to find a file named {}.".format(file_name))
            raise IOError

        return file_path

    @staticmethod
    def get_drawing_from_json(json_file_name: str) -> Dict:
        """Get the drawing (renderer) information from a json file.

        Args:
            json_file_name: name of the json file with the drawing information saved. Extension is default to .json if
            that is not specified in json_file_name.
        Returns:
            A json with the renderer information.
        Raises:
            IOError if the json file with the specified name can not be found.

        """
        if not json_file_name.endswith('.json'):
            json_file_name += ".json"

        file_path = Renderer.get_file_path(json_file_name)

        with open(file_path) as json_data:
            return json.load(json_data)

    @staticmethod
    def apply_renderer_to_layer(pao_layer: PALayer, lyrx_file_name: str):
        """Apply the renderer from a .lyrx file to a layer.

        Args:
            pao_layer: an instance of PALayer where the renderer will be applied upon.
            lyrx_file_name: name of the lyrx file.
        Returns:
            No returns. The renderer attribute is set to the layer.
        Raises:
            IOError if the lyrx file does not exist.

        """
        file_path = Renderer.get_file_path(lyrx_file_name)
        arcpy.management.ApplySymbologyFromLayer(pao_layer.layer, file_path)

    @staticmethod
    def get_drawing_from_lyrx(pao_layer: PAOutputFeatureLayer, lyrx_file_name: str,
                              symbology_fields: Optional[str] = None,
                              symbology_operation: str = "UPDATE") -> dict:
        """Get the drawing as a json from a lyrx file.

        Args:
            pao_layer: an instance of PAOutputFeatureLayer.
            lyrx_file_name: name of the lyrx file.
            symbology_fields: same as the input for the symology_fields parameter of ApplySymbologyFromLayer function.
            symbology_operation: value for the update_symbology parameter of ApplySymbologyFromLayer function.
        Returns:
            No returns.
        Raises:
            IOError if lyrx file is not found.

        """
        file_path = Renderer.get_file_path(lyrx_file_name)
        lyr = AOLUtils.make_feature_layer(pao_layer.data, "tmpLayer")
        if symbology_fields:
            arcpy.management.ApplySymbologyFromLayer(lyr, file_path, symbology_fields, symbology_operation)
        else:
            arcpy.management.ApplySymbologyFromLayer(lyr, file_path)
        featset = arcpy.FeatureSet(lyr)
        return json.loads(featset._arc_object.getsymbology())  # type: ignore

    @staticmethod
    def get_drawing_from_renderer(pao_layer: PAOutputFeatureLayer, renderer_input: Union[Dict, str], is_renderer: bool,
                                  transparency: int, show_other_values: bool,
                                  where_clause: Optional[str] = None) -> Dict:
        """Get the drawing from renderer definition.

        Args:
            pao_layer: an instance of PAOutputFeatureLayer.
            renderer_input: either a str or json. If it is a str, then it is the path to a json file where the renderer
            information is stored. It is a renderer json otherwise. renderer_input can either be a renderer or a
            definition of renderer.
            is_renderer: whether the renderer_input represents a renderer definition (False) or renderer (True).
            show_other_values: whether to show other values from the symbology.
            where_clause: if a where_clause is given, only create renderer information for the selection.
        Returns:
            The symbology of the pao_layer.
        Raises:
            RuntimeError if FeatureSet's set or get symbology failed.

        """
        if not isinstance(renderer_input, dict):
            renderer_input = Renderer.get_drawing_from_json(renderer_input)

        # set transparency to the layer only if the geometry type is polygon.
        if pao_layer.shapeType == "Polygon":  # type: ignore
            mp_layer = pao_layer.make_layer_from_data()
            mp_layer.tranparency = transparency  # type: ignore

        if where_clause:
            output_folder = AOLUtils.get_output_wkspc(pao_layer.count)
            tmp_out_path = AOLUtils.create_unique_name("outLayerCopy", output_folder)
            arcpy.management.SelectLayerByAttribute(pao_layer.layer, "NEW_SELECTION", where_clause)
            arcpy.management.CopyFeatures(pao_layer.layer, tmp_out_path)
            fset = arcpy.FeatureSet(tmp_out_path)
        else:
            fset = arcpy.FeatureSet(pao_layer.layer)

        fset._arc_object.setsymbology(renderer_input, is_renderer)  # type: ignore
        symbology = json.loads(fset._arc_object.getsymbology())  # type: ignore
        symbology['transparency'] = transparency
        symbology["showOtherValues"] = show_other_values

        if not show_other_values:
            default_symbol_props = ("defaultLabel", "defaultSymbol")
            renderer_input = symbology.get("renderer", {})
            if renderer_input:
                for prop in default_symbol_props:
                    if prop in renderer_input:
                        del renderer_input[prop]  # type: ignore
        return symbology

    @staticmethod
    def set_labeling_info(drawing_json: Dict, labeling_info: Optional[Dict]) -> Dict:
        """Set the labelingInfo for drawing json and return the updated json."""
        if labeling_info is not None:
            drawing_json["labelingInfo"] = labeling_info
        return drawing_json

    @staticmethod
    def update_drawing_with_changed_fields(drawing_json: Dict, changed_field_names: Dict) -> bool:
        """Update the drawing json based on the changed fields.

        Args:
            drawing_json (Dict): a json with the drawing information.
            changed_field_names (Dict): a dict keyed by the field name in the drawing_json
            and valued by the new field name.

        Returns:
            bool: True if the update succeeds and False otherwise.
        """
        try:
            # remove labelingInfo and add default popups
            if "labelingInfo" in drawing_json:
                labeling_info = drawing_json["labelingInfo"]
                show_lbls = drawing_json.get("showLabels")
                if show_lbls is not None:
                    drawing_json.pop("showLabels")
                if not labeling_info or show_lbls is False:
                    LOGGER.debug("Removing labels")
                    drawing_json.pop("labelingInfo")
                else:
                    for labels in labeling_info:
                        for field_name, new_field_name in changed_field_names.items():
                            lbl_expression = labels.get("labelExpression", "")
                            if lbl_expression:
                                labels["labelExpression"] = lbl_expression.replace(field_name, new_field_name)
                            # update labelExpressionInfo
                            lbl_express_info = labels.get("labelExpressionInfo")
                            if lbl_express_info:
                                lbl_expr_val = lbl_express_info.get("value", "")
                                if lbl_expr_val:
                                    labels["labelExpressionInfo"]["value"] = lbl_expr_val.replace(field_name,
                                                                                                  new_field_name)
                                lbl_expr = lbl_express_info.get("expression", "")
                                if lbl_expr:
                                    labels["labelExpressionInfo"]["expression"] = lbl_expr.replace(field_name,
                                                                                                   new_field_name)

            # update renderer fields in drawing_json
            renderer = drawing_json.get("renderer", {})
            renderer_type = renderer.get("type", "").lower()
            fields_to_verify = None
            if renderer_type == "uniquevalue":
                fields_to_verify = ["field1", "field2", "field3"]
            elif renderer_type == "classbreaks":
                fields_to_verify = ["field"]

            if fields_to_verify:
                for fld in fields_to_verify:
                    field_name = renderer.get(fld)
                    if field_name and field_name in changed_field_names:
                        renderer[fld] = changed_field_names[field_name]
            return True
        except Exception as err:
            LOGGER.debug(f"Unable to update drawing with changed_fields due to {str(err)}")
            return False

    @abstractmethod
    def get_drawing_json(self) -> dict:
        """Get drawing information as a json."""
        raise NotImplementedError


class SimpleRenderer(Renderer):
    """To get the simple renderer drawing json."""

    CREATEWATERSHEDS_SIMPLE_COLOR = [59, 148, 0, 255]
    CREATEVIEWSHED_SIMPLE_COLOR = [230, 152, 0, 255]
    OPTIMUMTRAVELCOSTNEIGHBORNETWORK_SIMPLE_COLOR = [59, 148, 0, 255]

    def __init__(self, layer: PAOutputFeatureLayer, task_name: str, transparency: int = 25):
        """Initialize the attributes (shape_type, task_name, and transparency).

        Args:
            layer: an instance of PAOutputFeatureLayer.
            task_name: name of the tool.
            transparency: transparency of the symbol (default to 25).
        Returns:
            No return value.
        Raises:
            No exception.

        """
        self.shape_type = layer.shapeType  # type: ignore
        self.task_name = task_name
        self.transparency = transparency

    def update_fill_outline_color(self, drawing_json: Dict, color: List,
                                  update_outline: bool = True,
                                  outline_color: Optional[List]=None) -> Dict:
        """Update the fill and outline color of a renderer json.

        Args:
            drawing_json: a json-styled dictionary represents the drawing information.
            color: color to overwrite the symbol.
            update_outline: True to update the outline color and False otherwise.
            outline_color: RGB color of the outline.
        Returns:
            The updated dictionary represents the drawing information.
        Raises:
            No exception.

        """
        renderer = drawing_json["renderer"]
        symbol = renderer["symbol"]
        symbol["color"] = color
        if update_outline and outline_color:
            symbol["outline"]["color"] = outline_color
        return drawing_json

    def get_drawing_json(self) -> dict:
        """Overwrite the get_drawing_json function."""
        if self.task_name == 'CreateBuffers':
            return Renderer.get_drawing_from_json("simple_buffer_renderer.json")
        elif self.task_name == "GenerateTessellations":
            return Renderer.get_drawing_from_json("simple_tessellations_renderer.json")

        if 'point' in self.shape_type.lower():
            drawing_info = Renderer.get_drawing_from_json("simple_point_renderer.json")
            if self.task_name == 'CreateWatersheds':
                return self.update_fill_outline_color(drawing_info,
                                                      self.CREATEWATERSHEDS_SIMPLE_COLOR)
            return drawing_info

        elif 'polyline' in self.shape_type.lower():
            drawing_info = Renderer.get_drawing_from_json("simple_polyline_renderer.json")
            if self.task_name == "DetermineOptimumTravelCostNetwork":
                return self.update_fill_outline_color(drawing_info,
                                                      self.OPTIMUMTRAVELCOSTNEIGHBORNETWORK_SIMPLE_COLOR,
                                                      False)
            return drawing_info

        elif 'polygon' in self.shape_type.lower():
            drawing_info = Renderer.get_drawing_from_json("simple_polygon_renderer.json")
            if self.task_name == 'CreateViewshed':
                drawing_info = self.update_fill_outline_color(drawing_info,
                                                              self.CREATEVIEWSHED_SIMPLE_COLOR)

            drawing_info["transparency"] = self.transparency
            return drawing_info

        else:
            LOGGER.error("Unsupported shapetype of {}.".format(self.shape_type))
            raise ValueError


class UniqueValueRenderer(Renderer):
    """Get the unique value drawing info."""

    def __init__(self, layer: PAOutputFeatureLayer,
                 transparency: int = 50,
                 unique_value_fields: Optional[List] = None,
                 renderer_info: Union[str, Dict] = "unique_value_def.json",
                 is_renderer: bool = False,
                 show_other_values: bool = False,
                 where_clause: Optional[str] = None):
        """Initialize the attributes.

        Args:
            layer: an instance of PAOutputFeatureLayer.
            unique_value_fields: a list of fields to fetch unique values from.
            transparency: tranparency of the renderer.
            renderer_info: a dictionary represents the either a renderer or definition of renderer.
            is_renderer: True if the renderer_info represents a renderer and False renderer_info is a definition.
            show_other_values: False to exclude any symbology of other values and keep the renderer as it is if True.
        Returns:
            No return.
        Raises:
            No exception.

        """
        self.layer = layer
        self.transparency = transparency

        # Use the renderer directly if it is a json already.
        if isinstance(renderer_info, dict):
            self.renderer_info = renderer_info
        else:
            self.renderer_info = Renderer.get_drawing_from_json(renderer_info)
        self.is_renderer = is_renderer

        if not is_renderer and unique_value_fields:
            self.renderer_info['uniqueValueFields'] = unique_value_fields
        self.show_other_values = show_other_values
        self.where_clause = where_clause

    def sort_class_values(self, class_values: List) -> List:
        """Convert a list of sorted number strings to a list of sorted numbers.

        Args:
            class_values: a list of number strings represent the class values.
        Returns:
            A list of integers with the values sorted.
        Raises:
            No exception.

        """
        LOGGER.debug('class_values: {}'.format(class_values))
        new_values = []
        for cls_val in class_values:
            try:
                new_values.append(ast.literal_eval(cls_val))
            except SyntaxError:
                new_values.append(cls_val)

        new_values.sort()
        return new_values

    def get_uvrenderer_class_values(self, symbology: dict) -> List:
        """Get all class values from the json of unique value renderer.

        Args:
            symbology: a dictionary with symbology definition.
        Returns:
            A list of strings with number.
        Raises:
            No exception.

        """
        renderer = symbology.get('renderer')
        class_values = []
        if renderer and renderer.get('type', '') == 'uniqueValue':
            uniq_value_infos = renderer.get('uniqueValueInfos', [])

            for uval in uniq_value_infos:
                class_values.append(uval['value'])

        return class_values

    def get_drawing_json(self) -> dict:
        """Overwrite the get_drawing_json of parent class."""
        drawing_info = Renderer.get_drawing_from_renderer(self.layer, self.renderer_info,
                                                          self.is_renderer, self.transparency,
                                                          self.show_other_values,
                                                          self.where_clause)

        try:
            class_values = self.sort_class_values(self.get_uvrenderer_class_values(drawing_info))
            drawing_info['classValues'] = class_values
        except Exception as ex:  # no-qa. pylint: disable=W0703
            LOGGER.debug("Cannot sort values from the unique value renderer because {}".format(str(ex)))

        try:
            locale_info = locale.localeconv()
            delimiter = locale_info["decimal_point"]
            if delimiter != ".":
                renderer = drawing_info["renderer"]
                for valclass in renderer["uniqueValueInfos"]:
                    if delimiter in valclass["value"]:
                        val = valclass["value"].replace(delimiter, ".").rstrip(")").lstrip("(")
                        val = val.replace(" ", "")
                        if "." in val:
                            # trim trailing zeroes and dot, at 10.5
                            val = val.rstrip("0")
                            val = val.rstrip(".")
                        valclass["value"] = val
                        valclass["label"] = valclass["value"]
        except Exception as err:  # no-qa. pylint: disable=bare-except
            LOGGER.debug('Failed to update the locale_info because {}'.format(str(err)))

        return drawing_info


class GraduatedColorsRenderer(Renderer):
    """Create renderers with graduated color."""

    BLUE_COLOR_RAMP = {"type": "algorithmic",
                       "toColor": [0, 255, 255, 255],
                       "fromColor": [0, 0, 255, 255],
                       "algorithm": "esriHSVAlgorithm"}

    GRADUATED_COLOR_RAMPS = {2: ([230, 183, 196, 255], [182, 95, 165, 255]),
                             3: ([238, 206, 201, 255], [213, 136, 185, 255], [161, 78, 150, 255]),
                             4: ([246, 229, 207, 255], [221, 159, 191, 255], [204, 113, 180, 255],
                                 [140, 60, 136, 255]),
                             5: ([246, 229, 207, 255], [221, 159, 191, 255], [204, 113, 180, 255],
                                 [161, 78, 150, 255], [118, 42, 121, 255])}

    def __init__(self, layer: PAOutputFeatureLayer,
                 classification_field: str,
                 normalization_field: Optional[str] = None,
                 transparency: int = 25,
                 task_name: Optional[str] = None,
                 renderer_info: Union[Dict, str] = "graduated_colors_def.json",
                 is_renderer: bool = False,
                 show_other_values: bool = True):
        """Initialize the object's properties.

        Args:
            layer: A PAOutputFeatureLayer instance where the renderer is set upon.
            classification_field: a string with the name of the field based on which to perform classification.
            normalization_field: a string with the name of the field based on which to perform normalization.
            transparency: an integer between 0 - 100 for transparency that will apply upon the layer.
            task_name: a string represents the task to use the renderer for (default to None).
            renderer_info: a json represents either a renderer or renderer definition.
            is_renderer: True if renderer_info represents a renderer and False if it is a definition of renderer.
            show_other_values: True to keep other values in the symbology and False to remove other values symbology.
            Default is True.
        Returns:
            No returns.

        """
        self.layer = layer
        self.classification_field = classification_field
        self.normalization_field = normalization_field
        self.shape_type = self.layer.shapeType  # type: ignore
        self.transparency = transparency
        self.task_name = task_name
        if isinstance(renderer_info, dict):
            self.renderer_info = renderer_info
        else:
            self.renderer_info = Renderer.get_drawing_from_json(renderer_info)
        self.is_renderer = is_renderer
        self.show_other_values = show_other_values

    def update_classbreaks_symbols(self, cls_breaks_renderer: dict,
                                   update_labels: bool = True,
                                   update_symbols: bool = False):
        """Update label values or symbols sizes.

        Args:
            class_breaks_renderer: a json of renderer with class breaks.
            update_labels: a bool indicating whether to update labels or not (default to True).
            update_symbols: a bool indicating whether to update symbols or not (default to False).
        Returns:
            A dictionary represents the symbology definition.
        Raises:
            No exception.

        """
        class_breaks = cls_breaks_renderer["classBreakInfos"]
        # workaround for sqlserver 8 decimals
        min_val = cls_breaks_renderer["minValue"]
        cls_breaks_renderer["minValue"] = round(min_val, 8) - 0.00000001
        max_cls_brks = len(class_breaks) - 1
        for i, class_break in enumerate(class_breaks):
            max_v = class_break["classMaxValue"]
            tmp_max_v = round(max_v, 8)
            if i == max_cls_brks:
                tmp_max_v += 0.00000001
            class_break["classMaxValue"] = tmp_max_v
            if update_labels:
                max_v_label = class_break["label"]
                max_v_label.replace(str(max_v), str(tmp_max_v))
        if update_symbols:
            for class_break in class_breaks:
                # workaround for increasing size
                symbol = class_break["symbol"]
                if "size" in symbol.keys():
                    siz = symbol["size"]
                    class_break["symbol"]["size"] = siz + 4
                elif "width" in symbol.keys():
                    wid = symbol["width"]
                    class_break["symbol"]["width"] = wid + 0.5
            # workaround for background fill symbol, since the transparrency get's lost in setSymbology
            cls_breaks_renderer["backgroundFillSymbol"] = Renderer.get_drawing_from_json("background_fill_symbol.json")

    def get_drawing_json(self) -> dict:
        """Implement the get_drawing_json abstractmethod."""
        update_symbol_size = False
        update_class_breaks_labels = False
        round_to_decimals = False

        if not self.is_renderer:
            if self.task_name == "TraceDownstream":
                self.renderer_info["colorRamp"] = self.BLUE_COLOR_RAMP
            self.renderer_info["classificationField"] = self.classification_field
            if self.normalization_field:
                self.renderer_info["normalizationType"] = "esriNormalizeByField"
                self.renderer_info["normalizationField"] = self.normalization_field

            renderer_type = self.renderer_info.get("type")
            # workarounds for classbreaksymbols
            if renderer_type == "classBreaksDef":
                # workaround for SQL Server
                round_to_decimals = True
                # current size range is from 4-18
                # increment +4
                cls_brk_type = self.renderer_info.get("classBreaksType")
                update_symbol_size = True if cls_brk_type == "esriGraduatedSymbols" else False
                # update labels for normalization since the decimal values may not be appropriate for labels Workaround
                update_class_breaks_labels = True if "normalizationField" in self.renderer_info else False

            if 'line' in self.shape_type.lower() or 'point' in self.shape_type.lower():
                if 'line' in self.shape_type.lower():
                    base_sym_file = "graduated_colors_line_base_symbol.json"
                else:
                    base_sym_file = "graduated_colors_point_base_symbol.json"
                self.renderer_info["baseSymbol"] = Renderer.get_drawing_from_json(base_sym_file)

        drawing_info = Renderer.get_drawing_from_renderer(self.layer, self.renderer_info,
                                                          self.is_renderer, self.transparency,
                                                          self.show_other_values)

        if update_class_breaks_labels or update_symbol_size or round_to_decimals:
            self.update_classbreaks_symbols(drawing_info["renderer"],
                                            update_class_breaks_labels,
                                            update_symbol_size)

        if self.task_name == "TraceDownstream":
            return drawing_info
        else:
            # update purple color ramp
            renderer = drawing_info.get("renderer")
            if renderer and "classBreakInfos" in renderer:
                class_breaks = renderer["classBreakInfos"]
                if len(class_breaks) > 1:
                    color_ramp = self.GRADUATED_COLOR_RAMPS[len(class_breaks)]
                    for class_break, color_val in zip(class_breaks, color_ramp):
                        class_break["symbol"]["color"] = color_val

            return drawing_info


class GraduatedSymbolRenderer(Renderer):
    """Create renderers with different symbols for class."""

    def __init__(self, layer: PAOutputFeatureLayer,
                 classification_field: str,
                 transparency: int = 25,
                 add_zero_cls_brk: bool = True):
        """Initialize the object's properties.

        Args:
            layer: an instance of PAOutputFeatureLayer where the renderer is set upon.
            classification_field: a string with the name of the field based on which to perform classification.
            transparency: an integer between 0 - 100 for transparency. Default is 25.
            add_zero_cls_brk: True to add a zero class break and False otherwise.
        Returns:
            No returns.

        """
        self.layer = layer
        self.classification_field = classification_field
        self.shape_type = self.layer.shapeType  # type: ignore
        self.transparency = transparency
        self.add_zero_cls_brk = add_zero_cls_brk

    def add_zero_class_break(self, renderer: dict):
        """Add a zero classbreak

        Args:
            renderer: a json with the renderer information.
        Returns:
            No returns, renderer is updated.

        """
        if 'classBreakInfos' not in renderer:
            return
        try:
            class_break_infos = renderer["classBreakInfos"]
            first_class_break = class_break_infos[0]
            if first_class_break["classMaxValue"] == 0:
                # just change the label and symbol
                first_class_break["label"] = "=0"
                first_class_break["symbol"]["color"][3] = 0
            else:
                # add a new zero classbreak
                zero_class_break = deepcopy(first_class_break)
                zero_class_break["classMaxValue"] = 0
                zero_class_break["label"] = "=0"
                symbol = zero_class_break["symbol"]
                symbol["color"][3] = 0
                class_break_infos.insert(0, zero_class_break)
        except KeyError:
            LOGGER.debug("KeyError: Unable to add zero classbreak")
        except IndexError:
            LOGGER.debug("IndexError: Unable to add ZeroClassBreak")
        except:  # noqa. pylint: disable=bare-except
            LOGGER.debug("Generic Exception: Unable to add ZeroClassBreak")

    def get_drawing_json(self) -> dict:
        """Overwrite the get_drawing_json of parent class."""
        field_values = "VALUE_FIELD point_count {}".format(self.classification_field)
        drawing_info = Renderer.get_drawing_from_lyrx(self.layer, "GRADUATEDSYMBOLS_POLYGONS.lyrx",
                                                      field_values, "UPDATE")
        drawing_info["transparency"] = self.transparency

        if self.add_zero_cls_brk:
            if ("minValue" in drawing_info["renderer"]) and (drawing_info["renderer"]["minValue"] == 0):
                # create drawinginfo without zeroes
                self.add_zero_class_break(drawing_info["renderer"])

        class_breaks = drawing_info["renderer"]["classBreakInfos"]
        min_value = drawing_info["renderer"]["minValue"]
        drawing_info["renderer"]["minValue"] = round(min_value, 8)
        for cls_break in class_breaks:
            max_val = cls_break["classMaxValue"]
            tmp_max_val = round(max_val, 8)
            cls_break["classMaxValue"] = tmp_max_val
            max_val_lbl = cls_break["label"]
            if str(max_val) in max_val_lbl:
                max_val_lbl.replace(str(max_val), str(tmp_max_val))
        return drawing_info
