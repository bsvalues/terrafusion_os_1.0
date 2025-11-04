"""GenerateTessellation core logic executor."""
# noqa. pylint: disable=import-error
from typing import Optional, Union

import arcpy
import arcpy.management

from common import (LogUtils, PAExecutor, PAFeatureLayer, PAOutputFeatureLayer,
                    TessellationCreatorMixin, AOLUtils,
                    AnalysisUtils)

LOGGER = LogUtils.setup_logger(__name__)


class GTExecutor(PAExecutor, TessellationCreatorMixin):
    """Core logic for GenerateTessellations tool."""

    def __init__(
        self,
        output_layer: PAOutputFeatureLayer,
        shape_type: str = "SQUARE",
        size: Union[str, float, int] = "#",
        size_unit: str = "#",
        extent: Optional[arcpy.Extent] = None,
        extent_layer: Optional[PAFeatureLayer] = None,
        intersect_study_area: bool = False,
        h3_resolution: Optional[int] = None,
    ):
        """Unpack input parameters.

        Args:
            output_layer: an instance of PAOutputFeatureLayer where the tessellation
            output is going to be generated.
            shape_type: type of shape of the tessellation.
            size: size of the tessellation. This size value can in either distance or
            areal unit.
            size_unit: unit of the tessellation size.
            extent: can be either None or an arcpy.Extent object.
            extent_layer: a PAFeatureLayer instance if not None. If extent_layer is not
            None, the tessellations are always generated based on the extent of the extent_layer.
            intersect_study_area: if true, only tessellations intersect with the extent_layer
            is kept. Otherwise all the tessellations are kept.

        """
        TessellationCreatorMixin.__init__(self, shape_type, size, size_unit, extent_layer, extent, h3_resolution)
        self.output_layer = output_layer
        self.intersect_study_area = intersect_study_area

    def validate_parameters(self) -> bool:
        """Validate input parameters."""
        return self.validate_tess_inputs()

    def execute(self):
        """Execute the core logic."""
        env_out_cs = arcpy.env.outputCoordinateSystem 
        if self.extent_layer and self.intersect_study_area:
            tmp_bin_out = AOLUtils.create_unique_name("tmp_tessellations", "scratchgdb")
            process_sr = env_out_cs if env_out_cs else self.extent_layer.spatialReference
        else:
            tmp_bin_out = self.output_layer.data
            if env_out_cs:
                process_sr = env_out_cs
            else:
                process_sr = self.extent_layer.spatialReference if self.extent_layer else self.extent.spatialReference
            if self.shape_type == "H3_HEXAGON":
                process_sr = None
        with arcpy.EnvManager(outputCoordinateSystem=process_sr):
            self.create(tmp_bin_out)
        
        if self.shape_type == "H3_HEXAGON":
            if env_out_cs and not AnalysisUtils.is_srs_equal(env_out_cs, arcpy.SpatialReference(4326)):
                LOGGER.warning(110344, extra={"message_ID": 110344})
            elif not env_out_cs:
                if self.extent_layer and not AnalysisUtils.is_srs_equal(self.extent_layer.spatialReference,
                                                                        arcpy.SpatialReference(4326)):
                    LOGGER.warning(110345, extra={"message_ID": 110345})
                elif self.extent and not AnalysisUtils.is_srs_equal(self.extent.spatialReference,
                                                                    arcpy.SpatialReference(4326)):
                    LOGGER.warning(110345, extra={"message_ID": 110345})
        
        if self.extent_layer and self.intersect_study_area:
            tmp_poly_lyr = AOLUtils.make_feature_layer(tmp_bin_out)
            arcpy.management.SelectLayerByLocation(tmp_poly_lyr, "intersect", self.extent_layer.layer)
            arcpy.management.CopyFeatures(tmp_poly_lyr, self.output_layer.data)
