"""Mixin class provides utility functions used amongest multiple tools."""
# pylint: disable=logging-fstring-interpolation
from typing import Union, Optional, List, Dict, Any, Tuple
import math
import json

import arcpy
import arcpy.management
import numpy as np
from GenerateTessellation import execute as GTExecute

from .pacommon import PAFeatureLayer, PAOutputFeatureLayer
from .padata import PALayer
from .palog import LogUtils
from .pautils import TessellationUtils
from .aolutils import AOLUtils


LOGGER = LogUtils.setup_logger(__name__)
__all__ = ["TessellationCreatorMixin", "NpDataOpMixin", "IntermCleanMixin",
           "ParameterUnpackMixin"]


class TessellationCreatorMixin:

    SUPPORTED_SHAPE_TYPES = ["SQUARE", "HEXAGON", "TRIANGLE", "DIAMOND", "TRANSVERSE_HEXAGON",
                             "H3_HEXAGON"]

    def __init__(self,
                 bin_type: str,
                 bin_size: Union[float, int, str],
                 bin_size_unit: str,
                 extent_layer: Optional[PAFeatureLayer] = None,
                 extent: Optional[arcpy.Extent] = None,
                 h3_resolution: Optional[int] = None):
        self.shape_type = bin_type.upper()
        if self.shape_type == "TRANSVERSEHEXAGON":
            self.shape_type = "TRANSVERSE_HEXAGON"
        elif self.shape_type == "H3HEXAGON":
            self.shape_type = "H3_HEXAGON"
        
        if self.shape_type == "H3_HEXAGON":
            self.h3_resolution = h3_resolution
        else:
            self.h3_resolution = None
        self.size = bin_size
        self.size_unit = bin_size_unit
        self.extent_layer = extent_layer
        self.extent = extent
        self.size_areal_unit = TessellationUtils.get_areal_size(self.size,  # type: ignore
                                                                self.shape_type,
                                                                self.size_unit)

    def validate_tess_inputs(self) -> bool:
        if self.shape_type not in self.SUPPORTED_SHAPE_TYPES:
            # TODO: need an error message for this
            LOGGER.debug(f"Unsupported shapeType of {self.shape_type}")
            LOGGER.error(100255, extra={"message_ID": 100255})
            return False

        if self.shape_type != "H3_HEXAGON":
            if isinstance(self.size, (float, int)) and self.size <= 0:
                LOGGER.debug(f"bin size must be a positive number.")
                LOGGER.error(100255, extra={"message_ID": 100255})
                return False

        if not self.extent_layer and not self.extent:
            LOGGER.error(100269, extra={"message_ID": 100269})
            return False

        return True

    def create(self, output_layer: Union[PAOutputFeatureLayer, str]):
        tmp_extent = self.extent_layer.layer if self.extent_layer else self.extent
        # Replace the GenerateTessellation with the function behind to avoid issue
        # of chained toolbox in setting output.
        if self.shape_type != "H3_HEXAGON":
            tmp_bin_polygon = AOLUtils.create_unique_name("tmpBinPolygon", "scratchgdb")
            sau_param = arcpy.Parameter()
            sau_param.value = self.size_areal_unit
            outfc_param = arcpy.Parameter()
            outfc_param.value = tmp_bin_polygon
            (extent, proj_poly_sr) = TessellationUtils.create_proj_extent(tmp_extent)
            args = [outfc_param, extent, self.shape_type, sau_param, extent.spatialReference, self.h3_resolution]
            GTExecute(args)

            output_path = output_layer.data if isinstance(output_layer, PAOutputFeatureLayer) else output_layer
            if arcpy.env.outputCoordinateSystem:
                proj_poly_sr = arcpy.env.outputCoordinateSystem
            arcpy.management.Project(tmp_bin_polygon, output_path, proj_poly_sr,
                                    "#", "#", "PRESERVE_SHAPE")
            arcpy.management.Delete(tmp_bin_polygon)
        else:
            LOGGER.debug(f"h3_resolution: {self.h3_resolution}")
            sau_param = None
            output_path = output_layer.data if isinstance(output_layer, PAOutputFeatureLayer) else output_layer
            extent = TessellationUtils.create_h3hex_extent(tmp_extent)
            args = [output_path, extent, self.shape_type, sau_param, extent.spatialReference, self.h3_resolution]
            GTExecute(args)


class NpDataOpMixin:
    """Utility class used for manipulating numpy data."""
    DEFAULT_NULL_VALS = {"double": np.NaN,
                         "single": np.NaN,
                         "integer": -2147483648,
                         "smallinteger": -32768,
                         "date": None}

    @classmethod
    def get_field_null_val(cls, data_layer: Union[PAFeatureLayer, str], fields_to_load: List[str]) -> Dict:
        field_null_val = {}
        fields = data_layer.fields if isinstance(data_layer, PAFeatureLayer) else AOLUtils.list_fields(data_layer)
        field_infos = {f.name.lower(): f.type for f in fields}  # type: ignore
        for sfield in fields_to_load:
            field_type = field_infos.get(sfield.lower())
            if field_type is not None and field_type.lower() in cls.DEFAULT_NULL_VALS:
                field_null_val[sfield] = cls.DEFAULT_NULL_VALS[field_type.lower()]
            else:
                field_null_val[sfield] = None
        return field_null_val

    @classmethod
    def get_null_val_by_name(cls, field_null_vals: Dict, field_name: str) -> Any:
        if field_name in field_null_vals:
            return field_null_vals[field_name]

        for fkey in field_null_vals:
            if fkey.lower() == field_name.lower():
                return field_null_vals[fkey]
        return None

    @classmethod
    def get_default_null_val(cls, field_type: str) -> Any:
        if field_type.lower() in cls.DEFAULT_NULL_VALS:
            return cls.DEFAULT_NULL_VALS[field_type.lower()]
        else:
            return None

    @classmethod
    def load(cls, layer: Union[PAFeatureLayer, str, arcpy.FeatureSet, arcpy.RecordSet],
             fields: List[str],
             is_table_view: Optional[bool] = None,
             query: Optional[str] = None,
             null_vals: Optional[Dict] = None) -> Dict:
        if is_table_view is None:
            if isinstance(layer, PAFeatureLayer):
                is_table_view = layer.is_table_view
            else:
                desc = arcpy.Describe(layer)
                data_type = desc.dataType if hasattr(desc, "dataType") else ""  # type: ignore
                is_table_view = True if data_type == "TableView" else False

        if null_vals is None:
            null_vals = NpDataOpMixin.get_field_null_val(layer, fields)  # type: ignore

        if is_table_view:
            numpy_fn = getattr(arcpy.da, "FeatureClassToNumPyArray")  # type: ignore
        else:
            numpy_fn = getattr(arcpy.da, "TableToNumPyArray")  # type: ignore

        data = layer.data if isinstance(layer, PAFeatureLayer) else layer
        if query:
            return numpy_fn(data, fields, query, null_value=null_vals)
        else:
            return numpy_fn(data, fields, null_value=null_vals)

    @classmethod
    def get_stat(cls, array: np.ndarray, stats: str, empty_array_val: Any = None) -> Any:
        (val_arr) = NpDataOpMixin.get_valid_value_weight_arr(array, empty_array_val)

        if stats.lower() == "stddev":
            stats = "std"

        if len(val_arr) > 0:
            if len(val_arr) == 1 and stats == "std":
                return 0
            elif stats.lower() == "std":
                return np.std(val_arr, ddof=1)
            elif stats.lower() == "count":
                return len(val_arr)
            return getattr(val_arr, stats.lower())()
        elif stats.lower() == "count":
            return 0
        else:
            return empty_array_val  # np.NaN

    @classmethod
    def get_valid_value_weight_arr(cls, values: np.ndarray, null_val: Any, weights: Optional[np.ndarray] = None) -> Tuple:
        if isinstance(null_val, np.datetime64):
            mask = np.logical_and(~np.isnat(values), values > np.datetime64('1900-01-01T00:00:00.000000'))
        elif null_val is None or math.isnan(null_val):
            mask = np.isfinite(values)
        elif weights is not None:
            mask = np.logical_and(np.isfinite(values), values != null_val, np.isfinite(weights))
        elif weights is None:
            mask = np.logical_and(np.isfinite(values), values != null_val)
        else:
            return (values, weights) if weights is not None else (values)  # type: ignore

        return (values[mask], weights[mask]) if weights is not None else (values[mask])

    @classmethod
    def calc_weighted_mean(cls, values: np.ndarray, weights: np.ndarray, null_val: Any) -> Optional[float]:
        (values, weights) = NpDataOpMixin.get_valid_value_weight_arr(values, null_val, weights)
        if values.size > 0:
            return np.sum(values * weights) / np.sum(weights)
        return None

    @classmethod
    def calc_weighted_std(cls, values: np.ndarray, weights: np.ndarray, null_val: Any) -> float:
        (values, weights) = NpDataOpMixin.get_valid_value_weight_arr(values, null_val, weights)

        if values.size > 1:
            val_avg = NpDataOpMixin.calc_weighted_mean(values, weights, null_val)
            size = weights.size
            return np.sqrt(np.sum(weights * (values - val_avg)**2) / (((size - 1) / size) * np.sum(weights)))  # type: ignore
        return 0


class IntermCleanMixin:
    """Mixin class to remove intermediate result."""
    
    def clean(self):
        for interm in self.interm_outputs:  # type: ignore
            try:
                if isinstance(interm, PALayer) and arcpy.Exists(interm.data):
                    arcpy.management.Delete(interm.data)
                    LOGGER.debug(f"Removed the intermediate output at {interm.data}")
                elif arcpy.Exists(interm):
                    arcpy.management.Delete(interm)
                    LOGGER.debug(f"Removed the intermediate output at {interm}")
            except arcpy.ExecuteError:
                LOGGER.debug(f"Unable to delete the intermediate output at {interm}")


class ParameterUnpackMixin:
    @classmethod
    def unpack(cls, param_indexes: List[int], as_text: Union[bool, List[bool]],
               default_empty_val: Optional[Union[List, str, int, float]] = None) -> List:
        """Unpack the parameter through arcpy.GetParameter or GetParameterAsText.

        Args:
            param_indexes (List[int]): a list of integers where each item represents
            the parameter index in the toolbox to unpack.
            as_text (Union[bool, List[bool]]): if as_text is a bool means unpack all
            parametes the same way, otherwise unpacks each parameter separately. True
            means to unpack the parameter through arcpy.GetParameterAsText and False
            to unpack the parameter through arcpy.GetParameter.

        Raises:
            SystemExit: if as_text is a list but has different length as param_indexes.

        Returns:
            List: a list where each item is the value unpacked.
        """
        if isinstance(as_text, list) and len(param_indexes) != len(as_text):
            LOGGER.error(f"number of parameters to unpack should be the same as the as_text.")
            raise SystemExit

        if isinstance(as_text, bool):
            as_text = [as_text for _ in param_indexes]
        
        if (
            default_empty_val
            and isinstance(default_empty_val, list)
            and len(default_empty_val) != len(param_indexes)
        ):
            LOGGER.error(f"number of parameters to unpack should be the same as default_empty_val.")
            raise SystemExit
        
        if default_empty_val and not isinstance(default_empty_val, list):
            dvals = [default_empty_val for _ in param_indexes]
        elif isinstance(default_empty_val, list):
            dvals = default_empty_val
        else:
            dvals = [None for _ in param_indexes]

        vals = []
        for paramind, astext, dv in zip(param_indexes, as_text, dvals):
            if astext:
                tmp_val = arcpy.GetParameterAsText(paramind)
            else:
                tmp_val = arcpy.GetParameter(paramind)
            if dv:
                tmp_val = tmp_val or dv
            vals.append(tmp_val)
        return vals

    @classmethod
    def get_param_as_text(cls, index: int) -> str:
        return arcpy.GetParameterAsText(index)  # type: ignore

    @classmethod
    def get_param(cls, index: int) -> Any:
        return arcpy.GetParameter(index)  # type: ignore
    
    @classmethod
    def get_param_as_json(cls, index: int) -> Optional[Dict]:
        txt = cls.get_param_as_text(index)
        if txt:
            try:
                return json.loads(txt)
            except ValueError:
                LOGGER.debug(f"Unable to unpack {txt} to json.")
                return None
        return None
