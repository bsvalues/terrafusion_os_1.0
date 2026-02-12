"""InterpolatePoints core logic executor."""
# use modules from common package. noqa. pylint: disable=import-error
import os
from enum import Enum, unique
from typing import List, Optional, Dict
from copy import deepcopy
import uuid

import arcpy
import arcpy.management
import arcpy.analysis

from common import (PAFeatureLayer, LogUtils, PAOutputFeatureLayer, PAExecutor,
                    IntermCleanMixin, LogExecutionTime,
                    AOLUtils, FieldUtils, PortalUtils, FQ_FIELD_NAMES)
from .utils import InterpUtils


LOGGER = LogUtils.setup_logger(__name__)

INTERM_PARAMS = {
    1: {
        "semivariogram_model_type": "POWER",
        "number_semivariograms": 30,
        "overlap_factor": 1,
        "max_local_points": 50,
        "search_neighborhood": arcpy.SearchNeighborhoodStandardCircular(**{"nbrMax": 8, "nbrMin": 8})
    },
    5: {
        "semivariogram_model_type": "POWER",
        "number_semivariograms": 100,
        "overlap_factor": 1.5,
        "max_local_points": 75,
        "search_neighborhood": arcpy.SearchNeighborhoodStandardCircular(**{"nbrMax": 10, "nbrMin": 10})
    },
    9: {
        "semivariogram_model_type": "K_BESSEL",
        "number_semivariograms": 200,
        "overlap_factor": 3,
        "max_local_points": 200,
        "search_neighborhood": arcpy.SearchNeighborhoodStandardCircular(**{"nbrMax": 15, "nbrMin": 15}),
        "transformation_type": "EMPIRICAL"
    }
}

BUILTIN_CLS_TYPE = {
    "EqualInterval": "EQUAL_INTERVAL",
    "GeometricInterval": "GEOMETRIC_INTERVAL",
    "GeometricalInterval": "GEOMETRIC_INTERVAL",
    "EqualArea": "QUANTILE"
}


@unique
class InterpOption(Enum):
    POWER_NBR8 = 1
    POWER_NBR10 = 5
    KBESSEL = 9


class IPExecutor(IntermCleanMixin, PAExecutor):
    """Executor with core logic for InterpolatePoints tool."""

    def __init__(self,
                 input_lyr: PAFeatureLayer,
                 val_field: str,
                 output_lyr: PAOutputFeatureLayer,
                 interpolate_option: InterpOption,
                 classification_type: str,
                 num_classes: int,
                 class_breaks: Optional[List[float]],
                 bounding_poly_lyr: Optional[PAFeatureLayer],
                 prediction_point_lyr: Optional[PAFeatureLayer],
                 include_pred_err: bool,
                 pred_err_out: Optional[PAOutputFeatureLayer],
                 pred_output_point_lyr: Optional[PAOutputFeatureLayer]):
        """Initialize the properties

        Args:
            input_lyr (PAFeatureLayer): an instance of PAFeatureLayer with data used for interpolation.
            val_field (str): the name of the field from which value will be used in interpolation.
            output_lyr (PAOutputFeatureLayer): an instance of PAOutputFeatureLayer to save the
            interpolate contour.
            interpolate_option (InterpOption): an instance of InterpOption defines the option parameters
            for interpolation.
            classification_type (str): type of classification to define the interpolation result.
            num_classes (int): the total number of classes.
            class_breaks (Optional[List[float]]): manually defined breaks for classes. Only be used when
            the classification type is Manual.
            bounding_poly_lyr (Optional[PAFeatureLayer]): an instance of PAFeatureLayer with the bounding
            polygons.
            prediction_point_lyr (Optional[PAFeatureLayer]): an instance of PAFeatureLayer with the location
            of the points to predict.
            include_pred_err (bool): True to include the prediction error contour and False otherwise.
            pred_err_out (Optional[PAOutputFeatureLayer]): an instance of PAOutputFeatureLayer to save the
            interpolate error contour.
            pred_output_point_lyr (Optional[PAOutputFeatureLayer]): an instance of PAOutputFeatureLayer to
            save the prediction results of prediction_point_lyr.
        """
        self.input_lyr = input_lyr
        self.val_field = val_field
        self.output_lyr = output_lyr
        self.interp_option = INTERM_PARAMS[interpolate_option.value]
        LOGGER.debug(f"interp_option: {self.interp_option}")
        if classification_type in BUILTIN_CLS_TYPE:
            self.classification_type = BUILTIN_CLS_TYPE[classification_type]
        else:
            self.classification_type = classification_type.upper()
        self.num_classes = num_classes
        self.class_breaks = class_breaks
        self.bounding_poly_lyr = bounding_poly_lyr
        self.pred_point_lyr = prediction_point_lyr
        self.include_pred_err = include_pred_err
        self.pred_err_out = pred_err_out
        self.pred_out_point_lyr = pred_output_point_lyr
        self.interm_outputs = []

    def validate_parameters(self) -> bool:
        """Validate the input parameters.

        Returns:
            bool: True if all the input parameters are valid and False otherwise.

        Raises:
            AO_100091: if the geometry of the input_lyr or pred_point_lyr is not point.
            AO_40039: if the total number of features of input_lyr is <= 10.
            AO_100008: if the geometry of the bounding_poly_lyr is not polygon.
            AO_100093: if the classification type is Manual but the class_breaks are not
            defined.
        """
        if "point" not in self.input_lyr.shapeType.lower():
            LOGGER.error(100091, extra={"message_ID": 100091, "paramName": "inputLayer"})
            return False

        if self.input_lyr.count <= 10:
            LOGGER.error(40039, extra={"message_ID": 40039})
            return False
        
        # check if the value field exists
        if not FieldUtils.verify_field_exists(self.input_lyr.layer, self.val_field):
            if self.val_field.upper() in FQ_FIELD_NAMES:
                fields = {f.name.upper(): f.name for f in arcpy.ListFields(self.input_lyr.layer)}
                self.val_field = FieldUtils.correct_fq_name(self.val_field, fields, PortalUtils.is_portal_env())
                LOGGER.debug(f"{self.val_field=}")
            else:
                LOGGER.error(100087, extra={"message_ID": 100087, "fieldName": self.val_field,
                                            "inputLayer": self.input_lyr.layer_name})
                return False

        if self.bounding_poly_lyr and self.bounding_poly_lyr.shapeType != "Polygon":
            LOGGER.error(100008, extra={"message_ID": 100008})
            return False

        if self.pred_point_lyr and "point" not in self.pred_point_lyr.shapeType.lower():
            LOGGER.error(100091, extra={"message_ID": 100091, "paramName": "predictAtPointLayer"})
            return False

        if self.classification_type.capitalize() == "Manual" and not self.class_breaks:
            LOGGER.error(100093, extra={"message_ID": 100093})
            return False
        elif self.class_breaks:
            self.num_classes = len(self.class_breaks)  # type: ignore

        return True

    def execute(self):
        try:
            if self.bounding_poly_lyr:
                (self.bounding_poly_lyr, out_poly, ext_poly) = InterpUtils.update_env_extent(self.bounding_poly_lyr)
                if out_poly:
                    self.interm_outputs.append(out_poly)
                if ext_poly:
                    self.interm_outputs.append(out_poly)
            else:
                arcpy.env.extent = None  # type: ignore
            self._interpolate()
        except Exception as err:
            LOGGER.debug("_interpolate() failed.")
            raise err
        finally:
            self.clean()

    def _interpolate(self):
        # check license
        if arcpy.CheckExtension("GeoStats") == "Available":
            if arcpy.CheckOutExtension("GeoStats") != "CheckedOut":
                LOGGER.error(100302, extra={"message_ID": 100302})
                raise SystemExit
        else:
            LOGGER.error(100302, extra={"message_ID": 100302})
            raise SystemExit
        with LogExecutionTime("Interpolate to contour:"):
            ga_lyr = self._interpolate_to_surface(self.classification_type, self.interp_option,
                                                  self.output_lyr)
        # create error surface
        if self.include_pred_err:
            err_interp_options = deepcopy(self.interp_option)
            err_interp_options["output_type"] = "PREDICTION_STANDARD_ERROR"
            tmp_cls_type = self.classification_type
            if self.classification_type.upper() == "MANUAL":
                tmp_cls_type = "EQUAL_INTERVAL"
            with LogExecutionTime("Interpolate to error contour:"):
                if not self.pred_err_out:
                    LOGGER.debug(f"pred_err_out is not initialized")
                    raise RuntimeError
                _ = self._interpolate_to_surface(tmp_cls_type,
                                                 err_interp_options,
                                                 self.pred_err_out)
        # create predicted point values
        if self.pred_point_lyr and self.pred_out_point_lyr:
            # TODO: check back later to understand why need to make a local copy.
            wkspc = AOLUtils.get_output_wkspcx(self.pred_point_lyr.count)
            predict_pnt_copy = os.path.join(wkspc, "predictPoints")
            self.interm_outputs.append(predict_pnt_copy)
            arcpy.management.CopyFeatures(self.pred_point_lyr.layer, predict_pnt_copy)
            with LogExecutionTime("GALayerToPoints:"):
                arcpy.GALayerToPoints_ga(ga_lyr, predict_pnt_copy, "", self.pred_out_point_lyr.data)

        arcpy.CheckInExtension("GeoStats")

    def _interpolate_to_surface(self, cls_type: str, interp_option: Dict,
                                output_lyr: PAOutputFeatureLayer) -> str:
        """Generate the interpolation surface/contour.

        Args:
            cls_type (str): type of classification.
            interp_option (Dict): a dictionary with the option for interpolation.
            output_lyr (PAOutputFeatureLayer): an instance of PAOutputFeatureLayer
            to save the output.

        Returns:
            str: the name of the EBK output surface layer.
        """
        if self.bounding_poly_lyr:
            output_contours = AOLUtils.create_unique_name("contours", "in_memory")
        else:
            output_contours = output_lyr.data

        ga_layer = f"galayer{str(uuid.uuid4())}"
        arcpy.EmpiricalBayesianKriging_ga(self.input_lyr.layer, self.val_field,
                                          ga_layer, **interp_option)

        # create contours
        multi_part_contours = AOLUtils.create_unique_name("mpContours", "in_memory")
        arcpy.GALayerToContour_ga(ga_layer, "FILLED CONTOUR", multi_part_contours,
                                  "Presentation", cls_type,
                                  self.num_classes,
                                  self.class_breaks)
        self.interm_outputs.append(multi_part_contours)

        if self.bounding_poly_lyr:
            wkspc = AOLUtils.get_output_wkspc(self.bounding_poly_lyr.count)
            tmp_b_lyr = os.path.join(wkspc, "boundingPolygon")
            arcpy.management.CopyFeatures(self.bounding_poly_lyr.layer, tmp_b_lyr)
            self.interm_outputs.append(tmp_b_lyr)
            arcpy.analysis.Clip(multi_part_contours, tmp_b_lyr, output_contours)
            multi_part_contours = output_contours

        arcpy.management.MultipartToSinglepart(multi_part_contours, output_lyr.data)
        return ga_layer
    