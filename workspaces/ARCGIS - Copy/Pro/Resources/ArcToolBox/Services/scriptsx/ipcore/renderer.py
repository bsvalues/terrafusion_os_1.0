"""Renderer for interpolation tools."""
from abc import abstractmethod
from typing import Dict, Optional, List
from copy import deepcopy

import arcpy

from common import (Renderer, PAOutputFeatureLayer, LogUtils, PALayer,
                    GraduatedColorsRenderer, UniqueValueRenderer)

LOGGER = LogUtils.setup_logger(__name__)

BLUE = [69, 117, 180, 255]
RED = [215, 48, 39, 255]
GRAY = [125, 125, 125, 255]
BLACK = [0, 0, 0, 255]

DEFAULT_OUTLINE_SYMBOL = {"type": "esriSLS",
                          "style": "esriSLSSolid",
                          "color": BLACK,
                          "width": 0.2}

DEFAULT_MARKER_SYMBOL = {"type": "esriSMS",
                         "style": "esriSMSCircle",
                         "color": GRAY,
                         "size": 10,
                         "angle": 0,
                         "xoffset": 0,
                         "yoffset": 0,
                         "outline": DEFAULT_OUTLINE_SYMBOL}

DEFAULT_LINE_SYMBOL = {"type": "esriSLS",
                       "style": "esriSLSSolid",
                       "color": GRAY,
                       "width": 1}

DEFAULT_FILL_SYMBOL = {"type": "esriSFS",
                       "style": "esriSFSSolid",
                       "color": GRAY,
                       "outline": DEFAULT_OUTLINE_SYMBOL}


class InterpRenderer(Renderer):
    """Abstract class contains utility functions to generate renderer."""

    DEFAULT_CR = {"type": "algorithmic",
                  "fromColor": BLUE,
                  "toColor": RED,
                  "algorithm": "esriHSVAlgorithm"}

    @classmethod
    def _get_default_symbol(cls, shape_type: str) -> Dict:
        """Get default symbol based on shape_type.

        Args:
            shape_type (str): shapeType of the layer.

        Raises:
            ValueError: if the shapeType is not in [Point, Polyline, Polygon].

        Returns:
            Dict: a json represents the symbology.
        """
        if shape_type == "Point":
            return DEFAULT_MARKER_SYMBOL
        elif shape_type == "Polyline":
            return DEFAULT_LINE_SYMBOL
        elif shape_type == "Polygon":
            return DEFAULT_FILL_SYMBOL
        else:
            LOGGER.debug(f"Unsupported shape_type of {shape_type}")
            raise ValueError

    @classmethod
    def _get_uniqval_def(cls, shape_type: str, field: str, col_ramp: Optional[Dict]) -> Dict:
        """Get the unique value definition."""
        symbol = cls._get_default_symbol(shape_type)
        uniq_cr = col_ramp if col_ramp else cls.DEFAULT_CR
        return {"type": "uniqueValueDef",
                "uniqueValueFields": [field],
                "baseSymbol": symbol,
                "colorRamp": uniq_cr}

    @classmethod
    def _get_range_values(cls, layer: PALayer, class_field: str, min_field: str, max_field: str) -> Dict:
        """Get the range values."""
        range_vals = {}
        with arcpy.da.SearchCursor(layer.data, [class_field, min_field, max_field]) as curr:  # type: ignore
            for row in curr:
                range_vals[row[0]] = {"classMinValue": row[1], "classMaxValue": row[2]}
        return range_vals

    @classmethod
    def _update_labels_with_ranges(cls, drawing_info: Dict, range_vals: Dict,
                                   conversion_factor: float = 1.0):
        """Update the labels and ranges of the drawing_info."""
        renderer = drawing_info.get("renderer")
        # LOGGER.debug(f"renderer: {renderer}")
        if renderer:
            uniq_vals_info = renderer.get("uniqueValueInfos")
            if uniq_vals_info:
                for uval in uniq_vals_info:
                    value = int(uval.get("value"))
                    val_rng = range_vals.get(value)
                    if val_rng:
                        cls_min_val = val_rng["classMinValue"] * conversion_factor
                        cls_max_val = val_rng["classMaxValue"] * conversion_factor
                        uval["label"] = f"{cls_min_val} - {cls_max_val}"

    @classmethod
    def _update_labels_with_clsbreaks(cls, drawing_info: Dict, cls_breaks: str,
                                      conv_factor: float):
        renderer = drawing_info.get("renderer")
        break_vals = [float(x) for x in cls_breaks.split(",")]
        if renderer:
            uniq_val_infos = renderer.get("uniqueValueInfos")
            if uniq_val_infos:
                for uvi in uniq_val_infos:
                    value = int(uvi.get("value"))
                    cls_min_val = break_vals[value - 1] * conv_factor
                    cls_max_val = break_vals[value] * conv_factor
                    # label = "%.15F - %.15F"%(cls_min_val, cls_max_val)
                    label = f"{cls_min_val:.15f} - {cls_max_val:.15f}"
                    uvi["label"] = label

    @classmethod
    def _update_outline(cls, drawing_info: Dict, outline_width: int, outline_color: Optional[List] = None):
        """Update the outline of the drawing symbology."""
        renderer = drawing_info.get("renderer")
        if renderer:
            uniq_vals_infos = renderer.get("uniqueValueInfos")
            if uniq_vals_infos:
                for uval in uniq_vals_infos:
                    symbol = uval.get("symbol")
                    if symbol:
                        if outline_color:
                            symbol["color"] = outline_color
                        if outline_width >= 0:
                            symbol["outline"]["width"] = outline_width

    @classmethod
    def _rmv_defaults(cls, drawing_info: Dict):
        """Remove the default tags of the drawing_info."""
        renderer = drawing_info.get("renderer", {})
        if renderer:
            if "defaultLabel" in renderer:
                renderer.pop("defaultLabel")
            if "defaultSymbol" in renderer:
                renderer.pop("defaultSymbol")

    @classmethod
    def get_classification_code(cls, classification_type: str):
        """Get the classification code."""
        classification_type = classification_type.upper().replace("_", "")
        classification_lookup = {"EQUALINTERVAL": 2,
                                 "QUANTILE": 3,
                                 "EQUALAREA": 3,
                                 "STANDARDDEVIATION": 4,
                                 "GEOMETRICALINTERVAL": 5,
                                 "GEOMETRICINTERVAL": 5,
                                 "DEFINEDINTERVAL": 6}
        return classification_lookup.get(classification_type, 1)

    @abstractmethod
    def get_drawing_json(self) -> Dict:
        raise NotImplementedError


class InterpContourRenderer(InterpRenderer):

    WHILTE_TO_RED_CR = {"type": "algorithmic",
                        "fromColor": [255, 235, 214, 125],
                        "toColor": [196, 10, 10, 255],
                        "algorithm": "esriHSVAlgorithm"}
    YELLOW_TO_BRWON_CR = {"type": "multipart",
                          "colorRamps": [{"type": "algorithmic",
                                          "fromColor": [255, 255, 229, 255],
                                          "toColor": [254, 153, 41, 255],
                                          "algorithm": "esriHSVAlgorithm"},
                                         {"type": "algorithmic",
                                          "fromColor": [254, 153, 41, 255],
                                          "toColor": [102, 37, 6, 255],
                                          "algorithm": "esriHSVAlgorithm"}
                                        ]}

    def __init__(self, out_lyr: PAOutputFeatureLayer, is_error_surface: bool):
        self.out_lyr = out_lyr
        self.is_err_surface = is_error_surface
        self.color_ramp = self.WHILTE_TO_RED_CR if is_error_surface else self.YELLOW_TO_BRWON_CR

    def get_drawing_json(self) -> Dict:
        cls_field = "classes"
        drawing_def = self._get_uniqval_def(self.out_lyr.shapeType, cls_field, self.color_ramp)
        drawing_info = UniqueValueRenderer(self.out_lyr,
                                           unique_value_fields=[cls_field],
                                           renderer_info=drawing_def,
                                           is_renderer=False).get_drawing_json()
        range_vals = self._get_range_values(self.out_lyr, cls_field, "value_min", "value_max")
        # LOGGER.debug(f"range_vals: {range_vals}")
        self._update_labels_with_ranges(drawing_info, range_vals)
        self._update_outline(drawing_info, outline_width=0)
        self._rmv_defaults(drawing_info)
        return drawing_info


class InterpPointsRenderer(InterpRenderer):

    def __init__(self, out_point_lyr: PAOutputFeatureLayer,
                 surf_drawing_json: Dict,
                 val_field: str = "Predicted"):
        self.out_point_lyr = out_point_lyr
        self.surf_drawing_json = surf_drawing_json
        self.val_field = val_field

    def _convert_uniqval_to_clsbreaks(self) -> Dict:
        """Convert the unique value renderer to class breaks based."""
        cls_breaks_drawing = deepcopy(self.surf_drawing_json)
        renderer_cb = cls_breaks_drawing.get("renderer")
        if not renderer_cb:
            LOGGER.debug("renderer is missing in surface draing json.")
            raise RuntimeError
        uniq_val_infos = renderer_cb.get("uniqueValueInfos")
        renderer_cb["type"] = "classBreaks"
        renderer_cb["field"] = self.val_field
        if uniq_val_infos:
            for i, uval in enumerate(uniq_val_infos):
                label = uval.get("label")
                minmax = label.split(" - ")
                (min_val, max_val) = (float(minmax[0]), float(minmax[1]))
                # round min/max value to 8 decimals: workaround for SQL Server
                if "." in str(min_val):
                    min_val = round(min_val, 8)
                if "." in str(max_val):
                    max_val = round(max_val, 8)
                uval["classMinValue"] = min_val
                uval["classMaxValue"] = max_val
                uval.pop("value")
                # update symbol to point but retain color
                symbol = uval.get("symbol")
                def_symbol = deepcopy(DEFAULT_MARKER_SYMBOL)
                def_symbol["color"] = symbol.get("color")
                def_symbol["outline"]["width"] = 1
                uval["symbol"] = def_symbol
                if i == 0:
                    renderer_cb["minValue"] = uval["classMinValue"]
            renderer_cb["classBreakInfos"] = uniq_val_infos
            renderer_cb.pop("uniqueValueInfos")
            cls_breaks_drawing["transparency"] = 0
            return cls_breaks_drawing
        LOGGER.debug("Unable to find uniqueValueInfos to create renderer for predicted points.")
        raise ValueError

    def _swap_renderer_info(self, renderer: Dict, gra_renderer: Dict,
                            min_val: bool):
        """Swap some of the renderer values."""
        cls_brk_infos = renderer.get("classBreakInfos")
        if min_val:
            g_val = gra_renderer.get("minValue")
            val = renderer.get("minValue")
        else:
            if not cls_brk_infos:
                LOGGER.debug("classBreakInfos missing for the renderer to swap.")
                raise RuntimeError
            gra_cls_brk_infos = gra_renderer.get("classBreakInfos")
            if not gra_cls_brk_infos:
                LOGGER.debug("classBreakInfos is missing in gradual renderer.")
                raise RuntimeError
            g_val = gra_cls_brk_infos[-1]["classMaxValue"]
            val = cls_brk_infos[-1]["classMaxValue"]

        if cls_brk_infos:
            if min_val and g_val and g_val < val:
                renderer["minValue"] = g_val
                cls_brk_infos[0]["classMinValue"] = g_val
                lbl = cls_brk_infos[0]["label"].split(" - ")
                cls_brk_infos[0]["label"] = f"{g_val} - {lbl[1]}"
            elif g_val and g_val > val:
                cls_brk_infos[-1]["classMaxValue"] = g_val
                lbl = cls_brk_infos[-1]["label"].split(" - ")
                cls_brk_infos[-1]["label"] = f"{lbl[0]} - {g_val}"

    def get_drawing_json(self) -> Dict:
        drawing_json = self._convert_uniqval_to_clsbreaks()
        renderer: Dict = drawing_json.get("renderer")  # type: ignore

        # check for min/max value and extend first and last class break
        gra_drawing = GraduatedColorsRenderer(self.out_point_lyr, self.val_field).get_drawing_json()
        gra_renderer = gra_drawing.get("renderer")
        if gra_renderer:
            self._swap_renderer_info(renderer, gra_renderer, True)
            self._swap_renderer_info(renderer, gra_renderer, False)
        return drawing_json


class CalcDensityRenderer(InterpRenderer):
    PURPLE_COL_RAMP = {"type": "algorithmic",
                       "fromColor": [252, 251, 253, 125],
                       "toColor": [63, 0, 125, 255],
                       "algorithm": "esriCIELabAlgorithm"}

    def __init__(self, out_lyr: PAOutputFeatureLayer, cls_field: str,
                 raster_cls_breaks: str,
                 conv_factor: float):
        self.out_lyr = out_lyr
        self.cls_field = cls_field
        self.raster_cls_breaks = raster_cls_breaks
        self.conv_factor = conv_factor

    def get_drawing_json(self) -> Dict:
        render_def = self._get_uniqval_def(self.out_lyr.shapeType, self.cls_field,
                                           self.PURPLE_COL_RAMP)
        # LOGGER.debug(f"render_def: {render_def}")
        symbology = UniqueValueRenderer(self.out_lyr,
                                        transparency=25,
                                        unique_value_fields=[self.cls_field],
                                        renderer_info=render_def,
                                        is_renderer=False,
                                        show_other_values=False).get_drawing_json()
        self._update_labels_with_clsbreaks(symbology, self.raster_cls_breaks,
                                           self.conv_factor)
        self._update_outline(symbology, 0)
        self._rmv_defaults(symbology)
        return symbology
