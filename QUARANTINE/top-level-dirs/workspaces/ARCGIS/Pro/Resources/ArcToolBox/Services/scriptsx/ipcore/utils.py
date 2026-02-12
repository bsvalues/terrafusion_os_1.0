# noqa. pylint: disable=no-member
import os
from typing import Tuple, Optional, Union

import arcpy
import arcpy.management
import arcpy.analysis
import arcpy.conversion

from common import (PAFeatureLayer, LogUtils, AnalysisUtils, CALFIELD_PY_METHOD,
                    AOLUtils)


LOGGER = LogUtils.setup_logger(__name__)

GET_MINMAX_CODEBLOCK = """
def getMinMax(value, break_vals, offset, conv_factor):
  if value > 0:
    return break_vals[value - offset] * conv_factor
  else:
    return break_val[value] * conv_factor
"""

CLASS_FIELD = "class"
CLASS_FIELd_ALIAS = "Class"


class InterpUtils:

    CONV_UNITS_TO_METERS = {
        "METERS": 1.0,
        "KILOMETERS": 1000.0,
        "FEET": 0.3048,
        "MILES": 1609.344,
        "YARDS": 0.9144
    }

    @classmethod
    def update_env_extent(cls, bounding_poly_lyr: PAFeatureLayer) -> Tuple:
        """Update the context extent.

        Returns:
            PAFeatureLayer: the extent of the bounding_poly_lyr inside of the extent if
            arcpy.env.extent is not empty. Otherwise, use the bounding_poly_lyr itself.

        """
        if arcpy.env.extent:  # type: ignore
            extent = arcpy.env.extent  # type: ignore
            points_arr = arcpy.Array([extent.upperLeft,
                                      extent.upperRight,
                                      extent.lowerRight,
                                      extent.lowerLeft,
                                      extent.upperLeft])
            sel_poly = arcpy.Polygon(points_arr, extent.spatialReference)
            out_poly = os.path.join("in_memory", "outPolygon")
            arcpy.management.CopyFeatures(sel_poly, out_poly)
            extent_poly = os.path.join("in_memory", "extentPolygon")
            AnalysisUtils.pairwise_intersect([bounding_poly_lyr.layer, out_poly], extent_poly)
            arcpy.env.extent = AOLUtils.describe(extent_poly).extent  # type: ignore
            return (PAFeatureLayer(extent_poly), out_poly, extent_poly)
        else:
            arcpy.env.extent = AOLUtils.describe(bounding_poly_lyr.layer).extent  # type: ignore
            return (bounding_poly_lyr, None, None)

    @classmethod
    def conv_to_sr_units(cls, layer: PAFeatureLayer, value: float, value_units: str,
                         method: Optional[str] = None) -> float:
        """Convert the user specified value in units to the value compatible with
        units of the layer.

        Args:
            layer (PAFeatureLayer): an instance of layer with the spatial reference
            that the value is matched to.
            value (float): a float represents the linear distance.
            value_units (str): unit of the linear distance value.
            method (Optional[str], optional): method to convert the distance.
            Defaults to None.

        Returns:
            float: the linear distance value that match the spatial reference of the
            layer.
        """
        lyr_sr: arcpy.SpatialReference = layer.spatialReference  # type: ignore
        if lyr_sr.PCSName:
            data_units = lyr_sr.linearUnitName
            data_units = "Meters" if data_units == "Meter" else data_units
            LOGGER.debug(f"SR units: {data_units}")
            meters_per_unit = lyr_sr.metersPerUnit
            return cls.conv_to_pcs_units(value, value_units, data_units, meters_per_unit)
        else:
            if method == "GEODESIC":
                LOGGER.debug("Conversion units switched to meters instead of SR units for Geodesic")
                return cls.CONV_UNITS_TO_METERS[value_units.upper()] * value
            return cls.conv_to_gcs_units(value, value_units, layer.extent)  # type: ignore

    @classmethod
    def conv_to_pcs_units(cls, value: float, value_units: str, data_units: str,
                          meters_per_unit: float) -> float:
        """convert the linear distance if the layer is in PCS.

        Args:
            value (float): a float represents the linear distance.
            value_units (str): unit of the linear distance value.
            data_units (str): linear units of the data.
            meters_per_unit (float): a conversion factor between meter and per data_units.

        Returns:
            float: the converted linear distance.
        """
        if data_units == value_units:
            return value
        elif data_units == "Meters":
            return cls.CONV_UNITS_TO_METERS[value_units.upper()] * value
        else:
            meter_val = cls.CONV_UNITS_TO_METERS[value_units.upper()] * value
            return meter_val * meters_per_unit

    @classmethod
    def conv_to_gcs_units(cls, value: float, value_units: str, extent: arcpy.Extent) -> float:
        """convert the linear distance if the layer is in GCS.

        Args:
            value (float): a float represents the linear distance.
            value_units (str): unit of the linear distance value.
            extent (arcpy.Extent): extent of the layer.

        Returns:
            float: the converted linear distance.
        """
        arr = arcpy.Array()
        # midpoint of top line (xmin, ymin) to (xmax, ymin)
        x = (extent.XMax + extent.XMin) / 2.0
        y = extent.YMax
        arr.add(arcpy.Point(x, y))

        # midpoint of bottom line (xmin, ymax) to (xmax, ymax)
        x1 = x
        y1 = extent.YMin
        arr.add(arcpy.Point(x1, y1))

        # create a polyline
        midline = arcpy.Polyline(arr, extent.spatialReference)
        geodesic_length = extent.height
        std_unit_length = midline.getLength("PRESERVE_SHAPE", value_units)
        geodesic_length_per_std_unit = geodesic_length / std_unit_length
        return value * geodesic_length_per_std_unit


class RasterUtils:
    """Raster utility functions."""
    MIN_FIELD = "Value_Min"
    MIN_FIELD_ALIAS = "Minimum Value"
    MAX_FIELD = "Value_Max"
    MAX_FIELD_ALIAS = "Maximum Value"
    
    @classmethod
    def get_raster_cls_brks(cls, in_raster: str, field: str, cls_type: str, num_cls: int) -> str:
        """Get the class break values of a raster.

        Args:
            in_raster (str): absolute path of a raster.
            field (str): name of the field for the raster.
            cls_type (str): type of classification.
            num_cls (int): number of classes.

        Raises:
            RuntimeError: if the listrasterclassbreaks function does not
            return a list or fail.

        Returns:
            str: class break values concatenated by comma.
        """
        raster = arcpy.Raster(in_raster)
        cls_brks = [raster.minimum]
        try:
            ras_cls_brks = arcpy.gp.listrasterclassbreaks(raster, field, cls_type,
                                                          num_cls)  # type: ignore
            if isinstance(ras_cls_brks, list):
                cls_brks += ras_cls_brks
            else:
                raise RuntimeError("Invalid class break values!")
        except Exception as err:
            LOGGER.debug(f"Unable to calculate the class breaks for {in_raster} because {str(err)}")
            raise RuntimeError from err
        return ",".join([str(x) for x in cls_brks])

    @classmethod
    def convert_exp_to_dec(cls, flt_val: Union[str, float]) -> str:
        """convert value in exponential format (i.e, 5.6e-06) to a string in float
        format (0.000056).

        Args:
            flt_val (Union[str, float]): value in exponential format.

        Returns:
            str: a string in float format.
        """
        str_val = str(flt_val).lower()
        if "e" not in str_val:
            return str_val
        else:
            base, power = str_val.split("e")
            power = int(power)
            neg_val = False
            if base.startswith("-"):
                base = base[1:]
                neg_val = True
            dot_loc = base.find(".")
            if dot_loc < 0:
                dot_loc = len(base)
                base += "."
            # positive power
            if power > 0:
                new_dot_loc = dot_loc + power
                if len(base) < new_dot_loc:
                    for i in range(power - len(base) + 2):
                        base += "0"
                    conv_str = base[:dot_loc] + base[dot_loc + 1:]
                else:
                    conv_str = base[:dot_loc] + base[dot_loc + 1: new_dot_loc + 1] + "." + base[new_dot_loc + 1:]
            else:
                new_dot_loc = dot_loc + power
                if new_dot_loc > 0:
                    # move dot to left
                    conv_str = base[:new_dot_loc] + "." + base[new_dot_loc: dot_loc] + base[dot_loc + 1]
                else:
                    for i in range(new_dot_loc, 0):
                        base = "0" + base
                    new_dot_loc = base.find(".")
                    conv_str = "0." + base[:new_dot_loc] + base[new_dot_loc + 1:]
            return f"-{conv_str}" if neg_val else conv_str

    @classmethod
    def get_ranges(cls, break_vals: str) -> str:
        """Get class value ranges that can apply to raster reclassification.

        Args:
            break_vals (str): a string with class break values concatenated by
            comma.

        Returns:
            str: ranges that can be applied to raster reclassification.
        """
        values = break_vals.split(",")
        ranges = ""
        prev = None
        for i, value in enumerate(values):
            value = cls.convert_exp_to_dec(value)
            if i > 0:
                item = f"{prev} {value} {i}"
                ranges = ranges + f";{item}" if ranges else f"{item}"
            prev = value
        return ranges

    @classmethod
    def calc_minmax(cls, feature_path: str, field: str, break_vals: str,
                    field_name: str, field_alias: str, offset: int,
                    conv_factor: float):
        """Calculate the minimum or maximum value of a polygon feature layer
        that was converted from a raster.

        Args:
            feature_path (str): the absolute path of the feature layer.
            field (str): name of the field with the pixel value.
            break_vals (str): the class break values.
            field_name (str): name of the output field.
            field_alias (str): alias of the output field.
            offset (int): offset of the pixel value.
            conv_factor (float): float represents the conversion factor.
        """
        arcpy.management.AddField(feature_path, field_name, "DOUBLE", field_alias=field_alias)
        expression = f"getMinMax(!{field}!,[{break_vals}],{offset},{conv_factor})"
        arcpy.management.CalculateField(feature_path, field_name, expression,
                                        CALFIELD_PY_METHOD, GET_MINMAX_CODEBLOCK)

    @classmethod
    def classify_raster(cls, in_raster: str, field: str, cls_type: str, num_cls: int,
                        out_raster: str, out_features: str, conversion_factor: float,
                        area_units: str) -> str:
        """classify a raster based on user specified inputs.

        Args:
            in_raster (str): absolute path of the input raster.
            field (str): field name of the raster value.
            cls_type (str): type of classification.
            num_cls (int): number of classes.
            out_raster (str): absolute path of the classified raster.
            out_features (str): absolute path of the feature layer by converting
            the classified raster.
            conversion_factor (float): float value to convert the area to desired
            areal units.
            area_units (str): areal units.

        Returns:
            str: the class break values.
        """
        with arcpy.EnvManager(extent=None, mask=None):
            break_vals = cls.get_raster_cls_brks(in_raster, field, cls_type, num_cls)
            ranges = cls.get_ranges(break_vals)
            LOGGER.debug(f"ranges: {ranges}")
            arcpy.gp.Reclassify_sa(in_raster, field, ranges, out_raster, "NODATA")  # type: ignore
            arcpy.conversion.RasterToPolygon(out_raster, out_features, "SIMPLIFY", "Value")
            arcpy.management.AlterField(out_features, "Gridcode", CLASS_FIELD,
                                        CLASS_FIELd_ALIAS)
            arcpy.management.DeleteField(out_features, "Id")

            if area_units:
                area_units = area_units.rstrip("s")
                tmp_max_field = f"{cls.MAX_FIELD}_per_{area_units}"
                tmp_min_field = f"{cls.MIN_FIELD}_per_{area_units}"
                area_units = area_units.replace("Square", "Square ")
                tmp_max_falias = f"{cls.MAX_FIELD_ALIAS} per {area_units}"
                tmp_min_falias = f"{cls.MIN_FIELD_ALIAS} per {area_units}"
            else:
                (tmp_max_field, tmp_min_field) = (cls.MAX_FIELD, cls.MIN_FIELD)
                (tmp_max_falias, tmp_min_falias) = (cls.MAX_FIELD_ALIAS, cls.MIN_FIELD_ALIAS)
            
            cls.calc_minmax(out_features, CLASS_FIELd_ALIAS, break_vals,
                            tmp_min_field, tmp_min_falias, offset=1,
                            conv_factor=conversion_factor)
            cls.calc_minmax(out_features, CLASS_FIELd_ALIAS, break_vals,
                            tmp_max_field, tmp_max_falias, offset=0,
                            conv_factor=conversion_factor)
            return break_vals

    @classmethod
    def convert_square_mapunits(cls, raster_path: str, conversion_units: Optional[str]) -> float:
        """Get the convertion factor of squared units.

        Args:
            raster_path (str): absolute path of the raster.
            conversion_units (str): desired areal units.

        Returns:
            float: conversion factor.
        """
        if not conversion_units:
            return 1.0
        desc_raster = AOLUtils.describe(raster_path)
        extent = desc_raster.extent
        points_arr = arcpy.Array([extent.upperLeft,
                                  extent.upperRight,
                                  extent.lowerRight,
                                  extent.lowerLeft,
                                  extent.upperLeft])
        extent_poly = arcpy.Polygon(points_arr, extent.spatialReference)
        conversion_units = conversion_units.upper().lstrip("SQUARE_")
        std_unit_area = extent_poly.getArea("PRESERVE_SHAPE", conversion_units)
        geodesic_area = extent.height * extent.width
        return std_unit_area / geodesic_area
