"""---------------------------------------------------------------------------
Name:              ooatool.py
Purpose:           Optimized Outlier Analysis for AGOL
Author:            Esri Inc.
Created:           10/21/2021
Copyright:   (c)   Esri, Inc. 2022
ArcGIS Version:    3.1

---------------------------------------------------------------------------"""
# import from common package. noqa. pylint: disable=import-error
import arcpy
from .ooaexecutor import OOAExecutor
from .renderer import SpatialStatsRenderer
import json
import re
from common import (PATool, PAFeatureLayer, FeatureServiceLayerPublisher,
                    PortalUtils, AnalysisUtils, LogUtils, ModelBuilderMixin,
                    PAEnvironment, RemoteToolboxUtils, PAErrorProcessor, COST_KEY,
                    ParameterUnpackMixin, AOLUtils)
from common import FO_PARAM_NAMES as PARAM_NAMES

LOGGER = LogUtils.setup_logger(__name__)

# ****Constant variables****
TASK_NAME = "FindOutliers"
GE_PRIVILEGE = "premium:user:geoenrichment"
PORTAL_HELPER_SERVICES_KEY = "geoenrichment"
GEOENRICH_URL = "GeoEnrichment/enrich"

PERMU_OPTIONS = {
    "SPEED": "QUICK_199",
    "BALANCE": "BALANCED_499",
    "PRECISION": "ROBUST_999"
}

ERROR_CODES = [192, 366, 401, 897, 906, 929, 1533, 1534, 1535, 1536, 
               1570, 1571, 1572, 1573, 1574, 1575, 84426, 100007, 100008, 
               100009, 100010, 100011, 100024, 100052, 100110, 110243]


class OOATool(ParameterUnpackMixin, ModelBuilderMixin, PATool):
    """Implement the Optimized Outlier Analysis tool."""

    def get_parameters(self):
        """Overwrite the abstractmethod of get_parameters."""
        # Tool signature matches the descriptions here:
        # https://developers.arcgis.com/rest/analysis/api-reference/find-outliers.htm
        input_layer = PAFeatureLayer(PARAM_NAMES["analysisLayer"],
                                     metadata={"parameterDataType": "Feature Set",
                                               "parameterName": "inputLayer"})
        spatial_ref: arcpy.SpatialReference = input_layer.spatialReference  # type: ignore
        self.check_overwrite_sr(spatial_ref)  # type: ignore
        context = self.get_param_as_text(PARAM_NAMES["context"])

        orig_cxt_sr = None  # user specified original context spatial reference
        # If Mercator, assign spatial reference environment to WGS (wkid 4326)
        # for using chordal distance
        if spatial_ref.PCSCode == 102100 or spatial_ref.PCSCode == 3857:
            orig_cxt_sr = arcpy.env.outputCoordinateSystem  # type: ignore
            arcpy.env.outputCoordinateSystem = 4326  # type: ignore

        analysis_field = self.get_param_as_text(PARAM_NAMES["analysisField"])
        if not analysis_field or analysis_field == "NO ANALYSIS FIELD":
            has_analysis_field = False
        else:
            has_analysis_field = True

        # The numeric field to weight analysisField (optional).
        divided_by_field = self.get_param_as_text(PARAM_NAMES["dividedByField"])

        service_url = ""
        entoken = ""
        referer = ""

        if divided_by_field.upper() == "ESRIPOPULATION":
            service_url, entoken, referer = RemoteToolboxUtils.get_helper_service_url(
                PORTAL_HELPER_SERVICES_KEY, self.portal_description)
            if service_url.endswith("/"):
                service_url.rstrip("/")
            service_url = f"{service_url}/{GEOENRICH_URL}"

        # Bounding Polygons Defining Where Incidents Are Possible (optional).
        bounding_polygon_layer = None
        if self.get_param_as_text(PARAM_NAMES["boundingPolygonLayer"]):
            bounding_polygon_layer = PAFeatureLayer(PARAM_NAMES["boundingPolygonLayer"],
                                                    metadata={"parameterDataType": "Feature Set",
                                                              "parameterName": "boundingPolygonLayer"})

        # Polygons For Aggregating Incidents Into Counts (optional).
        aggregation_polygon_layer = None
        if self.get_param_as_text(PARAM_NAMES["aggregationPolygonLayer"]):
            aggregation_polygon_layer = PAFeatureLayer(PARAM_NAMES["aggregationPolygonLayer"],
                                                       metadata={"parameterDataType": "Feature Set",
                                                                 "parameterName": "aggregationPolygonLayer"})
        arcpy.env.extent = None  # type: ignore

        permu_in = self.get_param_as_text(PARAM_NAMES["permutations"]).upper()
        if permu_in in PERMU_OPTIONS.keys():
            permutation = PERMU_OPTIONS[permu_in]
        else:
            permutation = ""

        shape_type = self.get_param_as_text(PARAM_NAMES["shapeType"])
        cell_size_value = self.get_param_as_text(PARAM_NAMES["cellSize"])
        cell_size_unit = self.get_param_as_text(PARAM_NAMES["cellSizeUnits"])
        if cell_size_value:
            cell_size = "{} {}".format(cell_size_value, cell_size_unit)
        else:
            cell_size = ""
        distance_band_value = self.get_param_as_text(PARAM_NAMES["distanceBand"])
        distance_band_unit = self.get_param_as_text(PARAM_NAMES["distanceBandUnits"])
        if distance_band_value:
            distance_band = "{} {}".format(distance_band_value, distance_band_unit)
        else:
            distance_band = ""

        if has_analysis_field:
            aggregate_method = None
            num_objects = input_layer.count
        elif aggregation_polygon_layer:
            aggregate_method = "COUNT_INCIDENTS_WITHIN_AGGREGATION_POLYGONS"
            num_objects = input_layer.count + aggregation_polygon_layer.count
        else:
            aggregate_method = "COUNT_INCIDENTS_WITHIN_FISHNET_POLYGONS"
            if shape_type.lower() == "hexagon":
                aggregate_method = "COUNT_INCIDENTS_WITHIN_HEXAGON_POLYGONS"
            num_objects = input_layer.count
            if bounding_polygon_layer is not None:
                num_objects += bounding_polygon_layer.count

        # ProcessInfo parameters
        if not self.is_running_in(PAEnvironment.MODELBUILDER):
            arcpy.SetParameterAsText(PARAM_NAMES["processInfo"], "")
        self.cost_parameters = {"analysisLayer": input_layer}
        if bounding_polygon_layer is not None:
            self.cost_parameters['boundingPolygonLayer'] = bounding_polygon_layer
        if aggregation_polygon_layer is not None:
            self.cost_parameters['aggregationPolygonLayer'] = aggregation_polygon_layer
        # result_layer should be initialized before using
        if self.is_running_in(PAEnvironment.MODELBUILDER):
            result_layer = AnalysisUtils.initialize_output_layer(
                specified_out_path=self.get_param_as_text(PARAM_NAMES["outliersResultLayer"]))
        else:
            result_layer = AnalysisUtils.initialize_output_layer(
                input_layer.count, "FindOutliersOutput")

        output_wkspc = AOLUtils.get_output_wkspc(input_layer.count)

        self.cost_values = [input_layer.shapeType,
                            num_objects,
                            self.output_name.output_cost]
        self.executor: OOAExecutor = OOAExecutor(input_layer,
                                                 result_layer,
                                                 analysis_field,
                                                 bounding_polygon_layer,
                                                 aggregation_polygon_layer,
                                                 aggregate_method,  # type: ignore
                                                 cell_size, distance_band,
                                                 divided_by_field,
                                                 service_url,
                                                 entoken, referer,
                                                 context,
                                                 permutation, output_wkspc,
                                                 orig_cxt_sr=orig_cxt_sr)

    def set_visualization(self):
        """Set the renderer to the output_layer."""
        # report cost as unknown
        if self.executor.remote_task_cost < 0:
            self.cost_parameters[COST_KEY] = self.executor.remote_task_cost  # type: ignore
        else:
            self.cost_parameters[COST_KEY] = self.executor.remote_task_cost + self.estimate_cost()  # type: ignore
        renderer = SpatialStatsRenderer.get_outlier_rendering_info(self.executor.output_layer)
        self.executor.output_layer.set_drawing(None, renderer)
        self.executor.output_layer.set_popup(popup_info=self.executor.out_layer_popupInfo, popup_title="")

    def _update_item_description(self, item_id: str):
        desc = []
        for msg in self.executor.process_info:  # type: ignore
            msg = json.loads(msg)
            msg_txt = msg.get("message")
            if msg_txt:
                params = msg.get("params")
                if params:
                    for pname in params:
                        if isinstance(msg_txt, str):
                            msg_txt = msg_txt.replace(f"${{{pname}}}", params[pname])
                        elif isinstance(msg_txt, list):
                            # msg_txt can be in format like: ['Min::', '${MinValue}']
                            if len(msg_txt) == 2 and pname in msg_txt[1]:
                                msg_txt[1] = msg_txt[1].replace(f"${{{pname}}}", params[pname])
                style = msg.get("style")
                if "/" in style:
                    if isinstance(msg_txt, str):
                        ind = style.index("/")
                        pre = style[0: ind - 1]
                        post = style[ind - 1::]
                        fmsg = f"{pre}{msg_txt}{post}"
                    else:
                        idxs = [m.start() for m in re.finditer('</td>', style)]
                        p1 = style[0: idxs[0]]
                        p2 = style[idxs[0]: idxs[1]]
                        p3 = style[idxs[1]::]
                        fmsg = f"{p1}{msg_txt[0].rstrip('::')}{p2}{msg_txt[1]}{p3}"

                    desc.append(fmsg)
        if desc:
            update_item_properties = {"description": "".join(desc)}
            PortalUtils.update_portal_item(item_id, update_item_properties)

    def publish_outputs(self):
        """Publish the outputs as a feature service."""
        process_info = self.executor.process_info if self.is_running_in(PAEnvironment.MODELBUILDER) else None
        publisher = FeatureServiceLayerPublisher(self.output_name, tool_version=self.version,
                                                 process_info=process_info)
        publisher.add_layer_to_publish(
            self.executor.output_layer,
            PARAM_NAMES["outliersResultLayer"],
            "FindOutliersOutput", layer_index=0)
        publisher.publish()
        # check if needs to overwrite
        if self.output_name.overwrite_item_info and not self.is_running_in(PAEnvironment.MODELBUILDER):
            item_id = self.output_name.json["itemProperties"]["itemId"]
            self._update_item_description(item_id)
        if not self.is_running_in(PAEnvironment.MODELBUILDER):
            arcpy.SetParameterAsText(PARAM_NAMES["processInfo"], json.dumps(self.executor.process_info))

    def log_usage_metering(self):
        """Log the usage metering."""
        cost = self.cost_values[1] * 0.001
        LogUtils.log_usage(self.task_name, self.executor.output_layer.count, cost, self.cost_values)


def execute_tool(version: float):
    """Entry of FindOutliers tool."""
    try:
        fo_tool = OOATool(TASK_NAME, output_name_index=11, context_index=12, 
                          version=version)
        fo_tool.run()
    except Exception as err:  # noqa. pylint: disable=broad-except
        # Show error messages associate with the tool
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()
