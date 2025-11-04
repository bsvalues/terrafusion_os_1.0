"""---------------------------------------------------------------------------
Name:              fpctool.py
Purpose:           Density-base Clustering for AGOL wtih DBScan and HDBscan
Author:            Esri Inc.
Created:           10/13/2021
Copyright:   (c)   Esri, Inc. 2021
ArcGIS Version:    Pro 2.9
---------------------------------------------------------------------------"""

# pylint: disable=C0411, C0413
# Use properties of executor. pylint: disable=E1101
# Internal functions with attributes initialition implicitly called in __init__. pylint: disable=W0201
# import from common package. noqa. pylint: disable=import-error

import arcpy
from .fpcexecutor import FPCExecutor
from .renderer import SpatialStatsRenderer
import json
import re
import math
from common import (PATool, PAFeatureLayer, FSECPublisher,
                    PortalUtils, AnalysisUtils, LogUtils,
                    ModelBuilderMixin, PAErrorProcessor,
                    PAEnvironment, ParameterUnpackMixin)
from common import FPC_PARAM_NAMES as PARAM_NAMES


LOGGER = LogUtils.setup_logger(__name__)
TASK_NAME = "FindPointClusters"
ERROR_CODES = [100260, 110141]


class FPCTool(ParameterUnpackMixin, ModelBuilderMixin, PATool):
    """Implement the FindPointClusters tool."""

    def get_parameters(self):
        """Overwrite the abstractmethod of get_parameters."""
        # Tool signature matches the descriptions here:
        # https://developers.arcgis.com/rest/analysis/api-reference/find-point-clusters.htm
        input_layer = PAFeatureLayer(0, metadata={"parameterDataType": "Feature Set",
                                                  "parameterName": "inputLayer"})
        self.check_overwrite_sr(input_layer.spatialReference)  # type: ignore

        # Minimum Points to Seed Cluster
        min_cluster_size = int(arcpy.GetParameter(PARAM_NAMES["minFeaturesCluster"]))  # type: ignore
        
        # Search Distance
        search_distance_value = arcpy.GetParameterAsText(PARAM_NAMES["searchDistanceValue"])
        search_distance_unit = arcpy.GetParameterAsText(PARAM_NAMES["searchDistanceUnit"])
        search_distance = None

        if search_distance_value == 'nan':
            search_distance = None
        elif search_distance_value and search_distance_unit:
            search_distance = f"{search_distance_value} {search_distance_unit}"

        self.cost_parameters = {"analysisLayer": input_layer}

        cluster_method = arcpy.GetParameterAsText(PARAM_NAMES["clusteringMethod"])
        if cluster_method == "":
            cluster_method = None
        else:
            cluster_method = cluster_method.upper()
        self.cluster_method = cluster_method


        sensitivity = arcpy.GetParameterAsText(PARAM_NAMES["sensitivity"])
        if sensitivity == "":
            sensitivity = None
        else:
            sensitivity = int(sensitivity)

        # Time field and time interval
        time_field = arcpy.GetParameterAsText(PARAM_NAMES["timeField"])
        if not time_field or time_field == "NO ANALYSIS FIELD":
            time_field = None
            time_interval = None
        else:
            search_time_interval = arcpy.GetParameterAsText(PARAM_NAMES["searchTimeInterval"])
            search_time_unit = arcpy.GetParameterAsText(PARAM_NAMES["searchTimeUnits"])
            if search_time_interval and search_time_unit:
                time_interval = f"{search_time_interval} {search_time_unit}"
            else:
                time_interval = None
        if time_field is None or time_interval is None:
            time_field = None
            time_interval = None
        LOGGER.debug(f"layer:{input_layer} - cluster_size:{min_cluster_size} - search_distance:{search_distance} - \ncluster_method:{cluster_method} - sensitivity:{sensitivity} - \ntime_field:{time_field} - time_interval:{time_interval}")
        
        if not self.is_running_in(PAEnvironment.MODELBUILDER):
            arcpy.SetParameterAsText(PARAM_NAMES["processInfo"], "")
        # result_layer should be initialized before using 
        if self.is_running_in(PAEnvironment.MODELBUILDER): 
            result_layer = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(PARAM_NAMES["resultLayer"])) 
        else: 
            result_layer = AnalysisUtils.initialize_output_layer(input_layer.count,
                                                                 "PointClustersOutput")
        self.executor: FPCExecutor = FPCExecutor(input_layer, result_layer,
                                                 min_cluster_size,
                                                 search_distance,
                                                 cluster_method, sensitivity, 
                                                 time_field, time_interval)

    def set_visualization(self):
        """Set the renderer to the output_layer."""
        rendering_info = SpatialStatsRenderer.get_db_cluster_rendering_info(self.executor.color_count,
                                                                            self.executor.noise)
        self.executor.output_layer.set_drawing(None, rendering_info)

        if self.executor.cluster_method == "OPTICS":
            chart = arcpy.Chart(arcpy.GetIDMessage(84769))
            chart.type = "scatter"
            chart.title = arcpy.GetIDMessage(84769)
            chart.scatter.showTrendLine = False
            #### Assign Y Axis Field ####
            chart.yAxis.field = "REACHDIST"
            chart.yAxis.title = arcpy.GetIDMessage(84770)

            #### Assign X Axis Field ####
            chart.xAxis.field = "REACHORDER"
            chart.xAxis.title = arcpy.GetIDMessage(84771)

            chart.dataSource = self.executor.output_layer.data
            LOGGER.debug(f"{chart._getWebSpec()=}")
            self.executor.output_layer.add_chart(chart)
        elif self.executor.cluster_method == "HDBSCAN":
            chart = arcpy.Chart(arcpy.GetIDMessage(84782))
            chart.type = "histogram"
            chart.title = arcpy.GetIDMessage(84782)
            chart.xAxis.field = "PROB"
            chart.xAxis.title = arcpy.GetIDMessage(84789)
            chart.histogram.showMean = False
            chart.histogram.binCount = 1 + math.ceil(math.log2(self.executor.output_layer.count))

            chart.dataSource = self.executor.output_layer.data
            LOGGER.debug(f"{chart._getWebSpec()=}")
            self.executor.output_layer.add_chart(chart)
        
        if self.executor.time_field is not None and self.executor.time_interval is not None and self.executor.cluster_method in ["DBSCAN", "OPTICS"]:

            if self.executor.input_layer.count > 10000:
                arcpy.AddIDMessage("WARNING", 110538) # todo: register message in AGOL
            else:
                lChart = arcpy.Chart("Time Span Per Cluster")
                lChart.type = "line"
                lChart.title = arcpy.GetIDMessage(220171)

                #### Assign X Axis Field ####
                lChart.xAxis.field = self.executor.time_field
                lChart.xAxis.title = self.executor.time_field_alias
                lChart.yAxis.field = "CLUSTER_ID"
                lChart.yAxis.title = arcpy.GetIDMessage(84790)
                #lChart.line.aggregation= "MEAN"
                lChart.legend.visible = False
                lChart.line.splitCategory = "CLUSTER_ID"
                lChart.color = self.executor.cluster_color_series

                lChart.dataSource = self.executor.output_layer.data
                LOGGER.debug(f"{lChart._getWebSpec()=}")
                self.executor.output_layer.add_chart(lChart)

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
                        pre = style[0:ind-1]
                        post = style[ind-1::]
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
        publisher = FSECPublisher(self.output_name, tool_version=self.version,
                                  process_info=process_info)
        publisher.add_layer_to_publish(self.executor.output_layer, PARAM_NAMES["resultLayer"], 
                                       "PointClustersOutput", layer_index=0)
        publisher.publish()
        # check if needs to overwrite
        if self.output_name.overwrite_item_info and not self.is_running_in(PAEnvironment.MODELBUILDER):
            item_id = self.output_name.json["itemProperties"]["itemId"]
            self._update_item_description(item_id)
        if not self.is_running_in(PAEnvironment.MODELBUILDER):
            arcpy.SetParameterAsText(PARAM_NAMES["processInfo"], json.dumps(self.executor.process_info))

    def log_usage_metering(self):
        """Log the usage metering."""
        values = [self.executor.input_layer.shapeType,
                  self.executor.input_layer.count,
                  self.output_name.output_cost]
        cost = self.executor.input_layer.count * 0.001
        LogUtils.log_usage(self.task_name, self.executor.output_layer.count, cost, values)


def execute_tool(version: float):
    """Entry of FindPointClusters tool."""
    try:
        fpc_tool = FPCTool(TASK_NAME, output_name_index=4, context_index=5,
                           version=version)
        fpc_tool.run()
    except Exception as err:  # noqa. pylint: disable=broad-except
        # Show error messages associate with the tool
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()
