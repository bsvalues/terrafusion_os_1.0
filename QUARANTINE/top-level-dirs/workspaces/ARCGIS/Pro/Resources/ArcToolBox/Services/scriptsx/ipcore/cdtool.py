"""CalculateDensity tool implementation."""
# import from common package. noqa. pylint: disable=import-error
import os

import arcpy

from common import (PATool, PAFeatureLayer, PAErrorProcessor,
                    FeatureServiceLayerPublisher, LogUtils,
                    ParameterUnpackMixin, AnalysisUtils,
                    FieldUtils, PALayerUtils, ModelBuilderMixin,
                    AOLUtils, LogExecutionTime, PAEnvironment)

from .cdexecutor import CDExecutor
from .renderer import CalcDensityRenderer, InterpRenderer
from .utils import CLASS_FIELD


LOGGER = LogUtils.setup_logger(__name__)
TASK_NAME = "CalculateDensity"
ERROR_CODES = [100024, 100105, 10246, 100106, 100107, 100108,
               100109, 100008, 100087]


class CDTool(ModelBuilderMixin, ParameterUnpackMixin, PATool):
    """Implementation of the CalculateDensity tool"""
    CLASS_LOOKUP = {"EqualArea": "quantile",
                    "EqualInterval": "equal",
                    "GeometricInterval": "geometrical",
                    "NaturalBreaks": "natural",
                    "StandardDeviation": "standard"}

    def get_parameters(self):
        input_lyr = PAFeatureLayer(0, metadata={"parameterDataType": "Feature Set",
                                                "parameterName": "inputlayer"})
        self.check_overwrite_sr(input_lyr.spatialReference)  # type: ignore
        if input_lyr.count > 2000:
            wkspc = AOLUtils.get_scratch_wkspc()
        else:
            wkspc = "in_memory"
        input_local_copy = AOLUtils.create_unique_name("inputCopy", wkspc)
        with arcpy.EnvManager(qualifiedFieldNames=False):
            input_lyr = PALayerUtils.make_local_copy(input_lyr, input_local_copy,
                                                    True, False)

        (field, cs_units, rad_units, area_units, cls_method) = self.unpack(param_indexes=[1, 3, 5, 7, 8],
                                                                           as_text=True)
        (cell_size, radius, num_cls) = self.unpack(param_indexes=[2, 4, 9],
                                                   as_text=False)

        self.calc_shp_area = True
        if self.version >= 2.0:
            self.calc_shp_area: bool = self.get_param(12)

        bounding_poly_lyr = PAFeatureLayer(6, metadata={"parameterDataType": "Feature Set",
                                                        "parameterName": "boundingPolygonLayer",
                                                        "parameterType": "Optional"})

        cls_type = self.CLASS_LOOKUP[cls_method]
        # default to organization's units if area_units is not set
        if not area_units:
            if self.is_running_in(PAEnvironment.MODELBUILDER):
                area_units = AnalysisUtils.get_units_in_mb()
            else:
                area_units = AnalysisUtils.get_units(self.portal_description)
        LOGGER.debug(f"area_units: {area_units}")
        if self.is_running_in(PAEnvironment.MODELBUILDER):
            output_lyr = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(12))
        else:
            self.cost_parameters = {"inputLayer": input_lyr,
                                    "boundingPolygonLayer": bounding_poly_lyr}
            output_lyr = AnalysisUtils.initialize_output_layer(None,
                                                            "DensityFeatures",
                                                            "in_memory")
        self.executor: CDExecutor = CDExecutor(input_lyr, output_lyr, field,
                                               cell_size, cs_units,
                                               radius, rad_units,
                                               bounding_poly_lyr,
                                               area_units,
                                               cls_type,
                                               num_cls)

    def set_visualization(self):
        # add shape area field
        if self.calc_shp_area:
            with LogExecutionTime("Create ShapeArea Field:"):
                if self.is_running_in(PAEnvironment.MODELBUILDER):
                    units = AnalysisUtils.get_units_in_mb(True)
                else:
                    units = AnalysisUtils.get_units(self.portal_description, True)
                FieldUtils.create_shape_area_field(self.executor.output_lyr, units)
        renderer = CalcDensityRenderer(self.executor.output_lyr,
                                       CLASS_FIELD,
                                       self.executor.raster_cls_brks,
                                       self.executor.conv_factor)
        self.executor.output_lyr.set_drawing(renderer)

    def publish_outputs(self):
        out_idx = 12 if self.version < 2.0 else 13
        with arcpy.EnvManager(extent=None):
            publisher = FeatureServiceLayerPublisher(self.output_name, tool_version=self.version)
            publisher.add_layer_to_publish(self.executor.output_lyr, out_idx, "resultLayer")
            publisher.publish()

    def log_usage_metering(self):
        shp_code = AnalysisUtils.get_shape_type_code(self.executor.input_lyr)
        field_code = 1 if self.executor.val_field else 0
        values = [shp_code, self.executor.input_lyr.count, field_code,
                  InterpRenderer.get_classification_code(self.executor.classification_type),
                  self.executor.num_classes, 1]
        LogUtils.log_usage(self.task_name, self.executor.input_lyr.count,
                           self.executor.input_lyr.count * 0.001,
                           values)


def execute_tool(version: float):
    """Entry function of CalculateDensity."""
    try:
        cd_tool = CDTool(TASK_NAME, output_name_index=10, context_index=11,
                         version=version)
        cd_tool.run()
    except Exception as err:
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()
