"""FindPointClusters core logic executor."""
# Update sys.path dynamically. pylint: disable=C0411, C0413
# Use the setattr and __slots__. Disable missing attribute. pylint: disable=E1101
import arcpy
import SSCluster as SC
import numpy as NUM
from typing import Optional
from common import LogUtils, PAExecutor, PAFeatureLayer, PAOutputFeatureLayer  # noqa. pylint: disable=E0401

LOGGER = LogUtils.setup_logger(__name__)


class FPCExecutor(PAExecutor):
    """ Core logic for FindPointClusters tool. """

    def __init__(self, input_layer: PAFeatureLayer, output_layer: PAOutputFeatureLayer,
                 min_cluster_size: int, search_distance: Optional[str] = None,
                 cluster_method: Optional[str] = None, sensitivity: Optional[int] = None, 
                 time_field: Optional[str] = None, time_interval: Optional[int] = None):
        """Unpack input parameters and set the properties.

        Args:
            input_layer: an instance of PAFeatureLayer with geometry to fetch center from.
            output_layer: an instance of PAOutputFeatureLayer with the results to be stored.
            min_cluster_size: A int value to use as the minimum number features to be considered a cluster. 
                            Any cluster with fewer features than the number provided will be considered noise.
            search_distance: A string value to use as the maximum distance to search for neighboring features.
            cluster_method: A string value to indicate which clustering method to use
            sensitivity: A int value as the sensitivity, shoule be in the range of [0, 100]
            time_field: A string value to indicate the time field for clustering with time
            time_interval: A string value including time interval and time unit, e.g. 1 Days, 2 Hours, or 3 Minutes
        Returns:
            No returns.
        Raises:
            No exceptions.

        """
        self.input_layer = input_layer
        self.output_layer = output_layer
        self.min_cluster_size = min_cluster_size
        self.search_distance = search_distance
        self.cluster_method = cluster_method
        self.sensitivity = sensitivity
        self.time_field = time_field
        self.time_interval = time_interval
        self.time_field_alias = None
        if self.time_field is not None and self.time_interval is not None:
            for f in input_layer.fields:
                if f.name.upper() == time_field.upper():
                    self.time_field_alias = f.aliasName
                    break

    def validate_parameters(self) -> bool:
        """Validate input parameters."""
        if self.input_layer.shapeType != "Point":
            LOGGER.error(100091, extra={"message_ID": 100091, "paramName": "Analysis Layer"})
            return False
        if self.min_cluster_size and self.input_layer.count < self.min_cluster_size:
            LOGGER.error(110141, extra={"message_ID": 110141})
            return False
        if self.min_cluster_size < 2:
            LOGGER.error(110143, extra={"message_ID": 110143})
            return False

        return True

    def execute(self):
        """ Execute the core logic. """
        # Note: we cannot directly use the system API because we need to get
        # the countLabels and labelColor from the class instance for future layer rendering.
        LogUtils.reconfig_ss_logger()
        if self.cluster_method is None:
            if self.search_distance:
                cluster_method = "DBSCAN"
            else:
                cluster_method = "HDBSCAN"
        else:
            cluster_method = self.cluster_method

        self.cluster_method = cluster_method
        try:
            LOGGER.debug(f"=========================> Clustering method to execute is: {cluster_method}.")
            if cluster_method == "DBSCAN":
                cluster = SC.DBSCAN(self.input_layer.layer, self.output_layer.data, self.min_cluster_size,
                                    self.search_distance, timeField=self.time_field, timeInterval=self.time_interval)
            elif cluster_method == "HDBSCAN":
                cluster = SC.HDBSCAN(self.input_layer.layer, self.output_layer.data, self.min_cluster_size)
            else:
                cluster = SC.OPTICS(self.input_layer.layer, self.output_layer.data, self.min_cluster_size,
                                    self.search_distance, thresholdDisance=self.sensitivity,
                                    timeField=self.time_field, timeInterval=self.time_interval)

            LOGGER.debug("Start to run the clustering process.")
            cluster.run()
            LOGGER.debug("Clustering process is done.")
            cluster.output()
            LOGGER.debug("Clustering output is done.")
            self.process_info = cluster.agol_process_info
            self.color_count = cluster.countLabels
            self.uniques = NUM.unique(cluster.labelColor)
            if -1 in self.uniques:
                self.noise = True
            else:
                self.noise = False
            if hasattr(cluster, "colorSeries"):
                self.cluster_color_series = cluster.colorSeries
            else:
                self.cluster_color_series = None
            LOGGER.debug(f"Process info to present is: {self.process_info}")
        except:
            LOGGER.error(100260, extra={"message_ID": 100260})
            raise SystemExit()

