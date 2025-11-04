"""CalculateDensity core logic executor."""
# use modules from common package. noqa. pylint: disable=import-error
import os
from typing import Optional

import arcpy
import arcpy.management
import arcpy.analysis

from common import (PAFeatureLayer, LogUtils, PAOutputFeatureLayer, PAExecutor,
                    IntermCleanMixin, LogExecutionTime, ToolExit, FieldUtils,
                    AOLUtils, NUMERIC_FIELD_TYPES)
from .utils import InterpUtils, RasterUtils


LOGGER = LogUtils.setup_logger(__name__)


class CDExecutor(IntermCleanMixin, PAExecutor):
    """Executor with core logic for CalculateDensity tool."""

    def __init__(self,
                 input_lyr: PAFeatureLayer,
                 output_lyr: PAOutputFeatureLayer,
                 val_field: Optional[str] = None,
                 cell_size: Optional[float] = None,
                 cell_size_units: Optional[str] = None,
                 radius: Optional[float] = None,
                 radius_units: Optional[str] = None,
                 bounding_poly_lyr: Optional[PAFeatureLayer] = None,
                 area_units: str = "",
                 classification_type: str = "EqualInterval",
                 num_classes: int = 10):
        self.input_lyr = input_lyr
        self.output_lyr = output_lyr
        self.val_field = val_field
        self.cell_size = cell_size
        self.cell_size_units = cell_size_units
        self.radius = radius
        self.radius_units = radius_units
        self.bounding_poly_lyr = bounding_poly_lyr
        self.area_units = area_units
        self.classification_type = classification_type
        self.num_classes = num_classes
        self.interm_outputs = []
        self.raster_cls_brks = ""
        self.conv_factor = 1.0

    def validate_parameters(self) -> bool:
        if self.input_lyr.shapeType != "Point" and self.input_lyr.shapeType != "Polyline":
            LOGGER.error(100109, extra={"message_ID": 100109})
            return False
        if self.val_field:
            field = None
            try:
                field = FieldUtils.get_field_from_layer(self.val_field, self.input_lyr,
                                                        return_field_object=True)
            except ToolExit:
                pass

            if not field:
                LOGGER.error(100087, extra={"message_ID": 100087, "fieldName": self.val_field,
                                            "inputLayer": self.input_lyr.layer_name})
                return False

            if field.type not in NUMERIC_FIELD_TYPES:  # type: ignore
                LOGGER.error(100106, extra={"message_ID": 100106, "fieldName": self.val_field})
                return False
        if self.bounding_poly_lyr:
            if self.bounding_poly_lyr.shapeType != "Polygon":
                LOGGER.error(100008, extra={"message_ID": 100008})
                return False
        return True

    def _sel_positive_vals(self):
        # Kernal density supports only positive values so make sure
        # only the positive values are selected.
        if self.input_lyr.FIDSet:
            selection_mode = "SUBSET_SELECTION"
        else:
            selection_mode = "NEW_SELECTION"
        where_exp = f"{self.val_field} >= 0"
        LOGGER.debug(f"where_exp: {where_exp}")
        cnt_bef_sel = self.input_lyr.count
        arcpy.management.SelectLayerByAttribute(self.input_lyr.layer, selection_mode,
                                                where_exp)
        cnt_aft_sel = AOLUtils.get_feature_count(self.input_lyr.layer)
        if cnt_aft_sel == 0:
            LOGGER.error(100107, extra={"message_ID": 100107})
            raise ToolExit
        elif cnt_aft_sel < cnt_bef_sel:
            LOGGER.warning(100108, extra={"message_ID": 100108, "fieldName": self.val_field})

    def _execute(self):
        out_raster = os.path.join(AOLUtils.get_scratch_wkspc(), "densityRaster")
        method = "GEODESIC" if self.input_lyr.shapeType != "Polyline" else "PLANAR"
        # update cellsize
        if self.cell_size and self.cell_size_units:
            cell_size = InterpUtils.conv_to_sr_units(self.input_lyr, self.cell_size,
                                                     self.cell_size_units)
        else:
            extent: arcpy.Extent = self.input_lyr.extent  # type: ignore
            cell_size = min(extent.width, extent.height) / 1250.0
        LOGGER.debug(f"updated cellsize: {cell_size}")

        # update radius units
        if self.radius and self.radius_units:
            radius = InterpUtils.conv_to_sr_units(self.input_lyr, self.radius,
                                                  self.radius_units, method)
        else:
            radius = "#"
        LOGGER.debug(f"Updated radius: {radius}")

        if self.val_field:
            self._sel_positive_vals()

        if self.area_units:
            updated_area_units = f"SQUARE_{self.area_units.upper().lstrip('SQUARE')}"
        else:
            updated_area_units = "#"
        LOGGER.debug(f"updated area units: {updated_area_units}")

        if self.bounding_poly_lyr:
            (self.bounding_poly_lyr, out_poly, ext_poly) = InterpUtils.update_env_extent(self.bounding_poly_lyr)
            if out_poly:
                self.interm_outputs.append(out_poly)
            if ext_poly:
                self.interm_outputs.append(ext_poly)
            arcpy.env.mask = self.bounding_poly_lyr.data  # type: ignore
            arcpy.env.extent = self.bounding_poly_lyr.extent  # type: ignore
            LOGGER.debug("Updated boundingPolygon")
        else:
            arcpy.env.extent = None  # type: ignore

        if arcpy.CheckExtension("Spatial") == "Available":
            chkout_status = arcpy.CheckOutExtension("Spatial")
            LOGGER.debug(f"chkout_status: {chkout_status}")
            if  chkout_status != "CheckedOut":
                LOGGER.error(100303, extra={"message_ID": 100303})
                raise ToolExit
        else:
            LOGGER.error(100303, extra={"message_ID": 100303})
            raise ToolExit

        with LogExecutionTime("Run Kernal Density: "):
            val_field = self.val_field if self.val_field else "None"
            LOGGER.debug(f"{val_field},{cell_size},{radius},{updated_area_units},#,{method}")
            result = arcpy.gp.KernelDensity_sa(self.input_lyr.layer, val_field,  # type: ignore
                                               out_raster, cell_size,
                                               radius, updated_area_units,
                                               "#", method)
            self.interm_outputs.append(out_raster)

        # convert raster to polygon
        if updated_area_units == "SQUARE_MAP_UNITS":
            self.conv_factor = RasterUtils.convert_square_mapunits(out_raster, self.area_units)

        LOGGER.debug(f"conversion factor: {self.conv_factor}")
        cls_raster = os.path.join(AOLUtils.get_scratch_wkspc(), "classRaster")
        self.raster_cls_brks = RasterUtils.classify_raster(out_raster, "value",
                                                           self.classification_type,
                                                           self.num_classes, cls_raster,
                                                           self.output_lyr.data,
                                                           self.conv_factor,
                                                           self.area_units)
        self.interm_outputs.append(cls_raster)
        arcpy.CheckInExtension("Spatial")

    def execute(self):
        try:
            self._execute()
        except Exception as err:
            LOGGER.debug(f"Failed to execute the calculateDensity because {str(err)}.")
            raise ToolExit from err
        finally:
            self.clean()
