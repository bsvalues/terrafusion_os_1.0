"""Executors for the Hydro/Elevation tool."""
# Use common packages. pylint: disable=import-error
from abc import abstractmethod
from typing import Optional, Union, Dict, List, Any, Tuple
import locale
import os

import arcpy
import arcpy.management
import arcpy.analysis

from common import (LogUtils, PAExecutor, PAFeatureLayer, PAOutputFeatureLayer,
                    AnalysisUtils, PALayerUtils, ImmutableDict,
                    DEFAULT_LAYER_NAME, LogExecutionTime,
                    CALFIELD_PY_METHOD, PALayer, AOLUtils,
                    RemoteUtilityCall)
from .utils import SOAPJobExecutor, HydroElevToolUtils, RESTJobExecutor, RemoteJobExecutor


__all__ = ["HydroElevToolExecutor", "CVExecutor", "CWExecutor", "TDExecutor"]
LOGGER = LogUtils.setup_logger(__name__)
MAX_FEAT_IN_SPLIT = 5
CALL_MODE = RemoteUtilityCall.SOAPFirst


class HydroElevToolExecutor(PAExecutor):
    """Mixin class to validate inputs of hydro/elev tools."""
    INPUT_CNT_LIMITATION = 1000

    def __init__(self, input_layer: PAFeatureLayer, portal_description: Optional[ImmutableDict],
                 wkspc: Optional[str]):
        self.input_layer: PAFeatureLayer = input_layer
        if self.input_layer.layer_name == DEFAULT_LAYER_NAME:
            self.input_layer.layer_name = "Input Features"
        self.validate_portal_description(portal_description)
        self.wkspc = wkspc
        self.msg_error_map = {}
        self.rj_executor: Optional[RemoteJobExecutor] = None

    def validate_portal_description(self, portal_description: Optional[ImmutableDict]):
        """validate the input portal description and assign it to the portal_description property.

        Args:
            portal_description (Optional[ImmutableDict]): a json represents the portal description. Call
            arcpy.GetPortalDescription if portal_description is empty.

        Raises:
            AO_100289: if portal_description is empty and failed in arcpy.GetPortalDescription.
        """
        if portal_description is None:
            try:
                self.portal_description = ImmutableDict(arcpy.GetPortalDescription())
            except Exception as err:   # noqa. pylint: disable=bare-except
                LOGGER.error(100289, extra={"message_ID": 100289})
                raise RuntimeError from err
        else:
            self.portal_description = portal_description

    def check_inputlayer(self) -> bool:
        """Check the input layer (i.e., total feature count)

        Returns:
            bool: True if the input_layer is valid and False otherwise.
        """
        if "point" not in self.input_layer.shapeType.lower():  # type: ignore
            LOGGER.error(100091, extra={"message_ID": 100091, "paramName": "input layer"})
            return False

        if "multipoint" in self.input_layer.shapeType.lower():  # type: ignore
            self.input_layer: PAFeatureLayer = PALayerUtils.convert_multiparts_to_single(self.input_layer,
                                                                                         None)  # type: ignore
        else:
            # Make a local copy of the input. Otherwise, the joinField later on seems not be able to join successfully.
            # It seems like an issue in joining between the output in memory dataset with the feature class in datastore.
            wkspc = AOLUtils.get_output_wkspc(self.input_layer.count)
            mapserver_local_copy = AOLUtils.create_unique_name("ms_layer_copy", wkspc)
            self.input_layer: PAFeatureLayer = PALayerUtils.make_local_copy(self.input_layer, mapserver_local_copy,
                                                                            True, True)

        if isinstance(self.input_layer, PALayer) and self.input_layer.count > self.INPUT_CNT_LIMITATION:
            LOGGER.error(100035, extra={"message_ID": 100035, "nearLayer": self.input_layer.layer_name})
            return False

        return True

    def get_out_sr(self, spa_ref: arcpy.SpatialReference) -> arcpy.SpatialReference:
        if arcpy.env.outputCoordinateSystem:  # type: ignore
            return arcpy.env.outputCoordinateSystem  # type: ignore
        return spa_ref

    def _execute(self):
        """Execute the remote job.

        Returns:
            Tuple: a two items tuple where the first item is the results and second item is the status
            of the remote job.
        """
        with arcpy.EnvManager(extent=None):
            (results, success) = (None, False)
            try:
                if (
                    CALL_MODE == RemoteUtilityCall.SOAPOnly
                    or CALL_MODE == RemoteUtilityCall.SOAPFirst
                ):
                    (results, success) = self.call_job_in_soap()
                else:
                    (results, success) = self.call_job_in_rest()
                if not success:
                    raise arcpy.ExecuteError
                self.unpack_results(results)
            except Exception as err:
                LOGGER.debug(f"remote job failed due to {str(err)}")
                if CALL_MODE == RemoteUtilityCall.SOAPFirst:
                    LOGGER.debug("Retry with REST request.")
                    (results, success) = self.call_job_in_rest()
                    if success:
                        self.unpack_results(results)
                elif CALL_MODE == RemoteUtilityCall.RESTFirst:
                    LOGGER.debug("Retry with SOAP request.")
                    (results, success) = self.call_job_in_soap()
                    if success:
                        self.unpack_results(results)
                if not success:
                    if results:
                        self.handle_exception(results)
                    else:
                        LOGGER.error(100298, extra={"message_ID": 100298})
                    raise arcpy.ExecuteError

    @abstractmethod
    def call_job_in_rest(self) -> Tuple:
        pass

    @abstractmethod
    def call_job_in_soap(self) -> Tuple:
        pass

    @abstractmethod
    def unpack_results(self, results: Any):
        """Unpack the results back from the remote job.

        Args:
            results (Any): results back from the remote job.

        """
        raise NotImplementedError

    def handle_exception(self, results: List):
        """Handle exception of the remote job.

        Args:
            results (Any): results containing messages back from the remote server.
        """
        rj_msgs = []
        for tmp_res in results:
            if isinstance(tmp_res, str):
                rj_msgs.append(tmp_res.lower())
            elif isinstance(tmp_res, list):
                rj_msgs.extend([msg.lower() for msg in tmp_res])
            elif isinstance(tmp_res, dict):
                rj_msgs.extend([msg.get("description", "").lower() for msg in tmp_res.get("messages", [])])

        spec_msg_bu = False  # True means a specific message has been bubbled up
        for err_id in self.msg_error_map:
            if self.msg_error_map[err_id].lower() in rj_msgs:
                LOGGER.error(err_id, extra={"message_ID": err_id})
                spec_msg_bu = True
        if not spec_msg_bu:
            LOGGER.error(100298, extra={"message_ID": 100298})

    def execute(self):
        """Overwrite the execute abstract function.

        Raises:
            arcpy.ExecuteError: if the remote job returned with a status of failure.
        """
        with LogExecutionTime("Execute the remote job"):
            self._execute()


class CVExecutor(HydroElevToolExecutor):
    """Core logic for CreateViewShed."""
    AREA_THRESHOLD_JUMP = 40000  # km
    AREA_THRESHOLD_FAIL = 1000000  # sqkm
    DISTANCE_THRESHOLD = 50000  # meters
    OUTPUT_NAMES = ["OutputViewshed"]

    def __init__(
        self,
        input_layer: PAFeatureLayer,
        output_layer: PAOutputFeatureLayer,
        dem_resolution: str,
        max_distance: Union[float, str],
        max_distance_units: str,
        obs_height: Union[float, str],
        obs_height_units: str,
        target_height: Union[float, str],
        target_height_units: str,
        generalization: bool,
        portal_description: Optional[ImmutableDict] = None
    ):
        """Initialize the properties of the Executor.

        Args:
            input_layer (PAFeatureLayer): input point layer represents the observe locations.
            dem_resolution (str): resolution of the dem to perform analysis.
            max_distance (Union[float, str]): maximum distance from the observe location to draw the visualization.
            max_distance_units (str): units of the maximum distance.
            obs_height (Union[float, str]): height of the obstacle.
            obs_height_units (str): units of the obstacle height.
            target_height (Union[float, str]): height of the visual target.
            target_height_units (str): units of the visual target height.
            generalization (bool): return the visual extent in generalized polygons if True otherwise the detailed
            polygons are returned.
            portal_description (Optional[ImmutableDict], optional): description of the portal where the analysis is
            executed upon. Defaults to None.
        """
        wkspc = os.path.dirname(output_layer.data)
        super(CVExecutor, self).__init__(input_layer, portal_description, wkspc)
        self.output_layer = output_layer
        self.dem_resolution = dem_resolution

        if max_distance == "#":
            self.max_distance: float = 9
            self.max_distance_units = "miles"
        else:
            self.max_distance: float = max_distance  # type: ignore
            self.max_distance_units = max_distance_units

        self.obs_height = obs_height
        self.obs_height_units = obs_height_units
        self.target_height = target_height
        self.target_height_units = target_height_units
        self.generalization = generalization
        self.msg_error_map = {
            100132: "One or more input observer points are outside of the area covered by the DEM source",
            100133: "Input maximum distance exceeds the maximum value permitted"
        }

    def get_select_features_extent_area(self) -> float:
        """Get the bounding area of the features that will be used in analysis.

        Returns:
            float: the area of the bounding polygon in the units of square kilometers.
        """
        if self.input_layer.FIDSet != "":
            min_bounding_polygon = r"in_memory\\mbgPoly"
            _ = arcpy.management.MinimumBoundingGeometry(self.input_layer.layer,
                                                         min_bounding_polygon,
                                                         "ENVELOPE",
                                                         "ALL", None)
            LOGGER.debug(f"MinimumBoundingGeometry created at: {min_bounding_polygon}.")
            LOGGER.debug(f"FIDSet: {self.input_layer.FIDSet}")
            extent = AOLUtils.describe(min_bounding_polygon).extent
        else:
            extent = AOLUtils.describe(self.input_layer.layer).extent
        array1 = arcpy.Array([extent.upperLeft,
                              extent.upperRight,
                              extent.lowerRight,
                              extent.lowerLeft,
                              extent.upperLeft])
        rect_poly = arcpy.Polygon(array1, extent.spatialReference)
        return rect_poly.getArea("PRESERVE_SHAPE", "squaremeters") / 1000000.0  # type: ignore

    def validate_parameters(self) -> bool:
        """Overwrite the validate_parameter abstract method.

        Returns:
            bool: True if the input parameters are valid and False otherwise.

        Raises:
            AO_100131: if the maximum visual distance > 50 kilometers.
            AO_100142: if the bounding area is larger than 1000000 square kilometers.
        """
        if not self.check_inputlayer():
            return False
        max_distance_in_m = self.max_distance * AnalysisUtils.get_convert_factor_to_meter(self.max_distance_units)
        if max_distance_in_m > self.DISTANCE_THRESHOLD:
            LOGGER.error(100131, extra={"message_ID": 100131, "max": "50", "units": "kilometers"})
            return False

        area_of_interest = self.get_select_features_extent_area()
        if area_of_interest > self.AREA_THRESHOLD_FAIL:
            LOGGER.error(100142, extra={"message_ID": 100142})
            return False

        if area_of_interest > self.AREA_THRESHOLD_JUMP and self.dem_resolution == "FINEST":
            self.dem_resolution = "90m"
        return True

    def call_job_in_soap(self) -> Tuple:
        LOGGER.debug("Make SOAP request.")
        parameters = [self.input_layer, self.max_distance, self.max_distance_units,
                      self.dem_resolution, self.obs_height, self.obs_height_units,
                      self.target_height, self.target_height_units, self.generalization]
        self.rj_executor = SOAPJobExecutor("elevation",
                                            self.portal_description,
                                            "Viewshed_Elevation",
                                            parameters,
                                            input_layer_index=0,
                                            output_positions=[0],
                                            max_features_in_split=self.input_layer.count)
        return self.rj_executor.execute()

    def call_job_in_rest(self) -> Tuple:
        LOGGER.debug("Make REST request.")
        parameters = {"MaximumDistance": self.max_distance,
                      "MaximumDistanceUnits": self.max_distance_units,
                      "DEMResolution": self.dem_resolution,
                      "GeneralizeViewshedPolygons": self.generalization}
        if self.obs_height and self.obs_height != "#":
            parameters["ObserverHeight"] = self.obs_height
            parameters["ObserverHeightUnits"] = self.obs_height_units
        if self.target_height and self.target_height != "#":
            parameters["SurfaceOffset"] = self.target_height
            parameters["SurfaceOffsetUnits"] = self.target_height_units
        self.rj_executor = RESTJobExecutor("elevation",
                                           self.portal_description,
                                           "Viewshed",
                                           self.input_layer,
                                           parameters,
                                           self.OUTPUT_NAMES,
                                           max_features_in_split=self.input_layer.count,
                                           mk_sync_request=True)
        return self.rj_executor.execute()

    def unpack_results(self, results: Any):
        out_sr = self.get_out_sr(self.input_layer.spatialReference)  # type: ignore
        if not self.rj_executor:
            LOGGER.debug(f"The remote job executor has not been initialized.")
            raise RuntimeError
        res = self.rj_executor.unpack_results(results, wkspc=[self.output_layer.data], out_sr=out_sr)

        if res is None:
            LOGGER.error(100299, extra={"message_ID": 100299})
            raise arcpy.ExecuteError
        # else:
            # arcpy.env.workspace = self.wkspc  # type: ignore
            # arcpy.management.Rename(os.path.basename(res[0]), os.path.basename(self.output_layer.data))
            # self.output_layer.data = res[0]

        # alter metadata field names
        area_units = AnalysisUtils.get_units(self.portal_description, polygon_units=True)
        # rename the area and perimeter fields
        if area_units == "SquareMiles":
            arcpy.management.CalculateField(self.output_layer.data, "AreaSqKm",
                                            "!AreaSqKm! * 0.386102",
                                            CALFIELD_PY_METHOD)
            arcpy.management.CalculateField(self.output_layer.data, "PerimeterKm",
                                            "!PerimeterKm! * 0.621371",
                                            CALFIELD_PY_METHOD)
            arcpy.management.AlterField(self.output_layer.data, "AreaSqKm", "AnalysisArea", "Area Square Miles")
            arcpy.management.AlterField(self.output_layer.data, "PerimeterKm", "Perimeter", "Perimeter Miles")
        else:
            arcpy.management.AlterField(self.output_layer.data, "AreaSqKm", "AnalysisArea", "Area Square Kilometers")
            arcpy.management.AlterField(self.output_layer.data, "PerimeterKm", "Perimeter", "Perimeter Kilometers")


class CWExecutor(HydroElevToolExecutor):
    """Executor of CreateWatersheds"""
    OUTPUT_NAMES = ["WatershedArea", "SnappedPoints"]
    def __init__(
        self,
        input_layer: PAFeatureLayer,
        ws_output_layer: PAOutputFeatureLayer,
        sp_output_layer: PAOutputFeatureLayer,
        search_distance: Union[str, int, float],
        search_units: str,
        source_database: str,
        generalize: str,
        portal_description: Optional[ImmutableDict] = None
    ):
        """Executor of CreateWatersheds.

        Args:
            input_layer (PAFeatureLayer): input layer with locations to look for watersheds.
            search_distance (Union[str, int, float]): distance from the original locations to delineate watersheds.
            search_units (str): units of the search distance.
            source_database (str): name of the source database which represents the resolution (i.e., Fineset,
            30m, 90m).
            generalize (str): True to generalize the watersheds boundary and False otherwise.
            portal_description (Optional[ImmutableDict], optional): description of the portal where the analysis is
            executed upon. Defaults to None.
        """
        wkspc = os.path.dirname(ws_output_layer.data)
        super(CWExecutor, self).__init__(input_layer, portal_description, wkspc)
        self.search_distance = search_distance
        self.search_units = search_units
        self.source_database = source_database
        self.generalize = generalize

        self.watershed_output = ws_output_layer
        self.snappoint_output = sp_output_layer
        self.msg_error_map = {
            100126: "Input points is empty",
            100127: "All points fall outside the processing unit extent",
            100129: "The point falls outside the catchment extent",
            100130: "The point falls outside the processing unit extent"
        }

    def validate_parameters(self) -> bool:
        return self.check_inputlayer()
    
    def call_job_in_soap(self) -> Tuple:
        remote_tool_name = "Watershed_Hydrology"
        return_snap_points = True
        parameters = [self.input_layer, "#", self.search_distance,
                        self.search_units, self.source_database,
                        self.generalize, return_snap_points]

        self.rj_executor = SOAPJobExecutor("hydrology",
                                            self.portal_description,
                                            remote_tool_name, parameters,
                                            output_positions=[0, 1],
                                            input_layer_index=0,
                                            max_features_in_split=MAX_FEAT_IN_SPLIT)
        return self.rj_executor.execute()

    def call_job_in_rest(self) -> Tuple:
        return_snap_points = True
        LOGGER.debug("Make REST request.")
        parameters = {
            "PointIDField": self.input_layer.OIDFieldName,
            "SnapDistance": self.search_distance,
            "SnapDistanceUnits": self.search_units,
            "DataSourceResolution": self.source_database,
            "Generalize": self.generalize,
            "ReturnSnappedPoints": return_snap_points
        }
        self.rj_executor = RESTJobExecutor("hydrology",
                                           self.portal_description,
                                           "Watershed",
                                           self.input_layer,
                                           parameters,
                                           self.OUTPUT_NAMES,
                                           max_features_in_split=MAX_FEAT_IN_SPLIT,
                                           mk_sync_request=False)
        return self.rj_executor.execute()

    def unpack_results(self, results: Any):
        out_sr = self.get_out_sr(self.input_layer.spatialReference)  # type: ignore
        LOGGER.debug(f"out_sr: {out_sr}")
        res = self.rj_executor.unpack_results(results,
                                              wkspc=[self.watershed_output.data, self.snappoint_output.data],  # type: ignore
                                              out_sr=out_sr)

        if res is None:
            LOGGER.error(100300, extra={"message_ID": 100300})
            raise arcpy.ExecuteError

        area_units = AnalysisUtils.get_units(self.portal_description, polygon_units=True)

        # rename the area field
        if "miles" in area_units.lower():
            arcpy.management.CalculateField(self.watershed_output.data, "AreaSqKm",
                                            "!AreaSqKm! * 0.386102",
                                            CALFIELD_PY_METHOD)
            arcpy.management.AlterField(self.watershed_output.data, "AreaSqKm", "AnalysisArea", "Area Square Miles")
        else:
            arcpy.management.AlterField(self.watershed_output.data, "AreaSqKm", "AnalysisArea", "Area Square Kilometers")

        # Join input fields to watersheds
        in_field = "PourPtID"
        arcpy.management.JoinField(self.watershed_output.data, in_field, self.input_layer.layer,
                                   self.input_layer.OIDFieldName)
        arcpy.management.JoinField(self.snappoint_output.data, in_field, self.input_layer.layer,
                                   self.input_layer.OIDFieldName)


class TDExecutor(HydroElevToolExecutor):
    """Executor of TraceDownstream"""
    OUTPUT_NAMES = ["OutputTraceLine"]
    def __init__(
        self,
        input_layer: PAFeatureLayer,
        output_layer: PAOutputFeatureLayer,
        split_distance: Union[float, int, str],
        split_units: str,
        max_distance: Union[float, int, str],
        max_distance_units: str,
        bounding_poly_layer: Optional[PAFeatureLayer],
        source_database: str,
        generalize: str,
        portal_description: Optional[ImmutableDict] = None
    ):
        """Executor of TraceDownstream.

        Args:
            input_layer (PAFeatureLayer): input layer with locations to trace downstream from.
            split_distance (Union[float, int, str]): distance to split the traced line.
            split_units (str): units of the split distance.
            max_distance (Union[float, int, str]): maximum distance to trace from the origin points.
            max_distance_units (str): units of the maximum distance.
            bounding_poly_layer (Optional[PAFeatureLayer]): bounding layer within which the downstream is traced.
            source_database (str): name of the source database which represents the resolution (i.e., Fineset,
            30m, 90m).
            generalize (str): True to generalize the downstream line and False otherwise.
            portal_description (Optional[ImmutableDict], optional): description of the portal where the analysis is
            executed upon. Defaults to None.
        """
        wkspc = os.path.dirname(output_layer.data)
        super(TDExecutor, self).__init__(input_layer, portal_description, wkspc)
        self.split_distance = split_distance
        self.split_units = split_units
        self.max_distance = max_distance
        self.max_distance_units = max_distance_units
        self.bounding_poly_layer = bounding_poly_layer
        self.source_database = source_database
        self.generalize = generalize

        self.output_layer = output_layer
        self.output_render_flag = 0
        self.msg_error_map = {
            100126: "Input points is empty",
            100127: "All points fall outside the processing unit extent",
            100128: "The point falls outside the processing unit extent"
        }

    def validate_parameters(self) -> bool:
        return self.check_inputlayer()

    def _get_numerical_val(self, val_txt: Any, default_vals: List) -> float:
        """Get numerical values from the val_txt.

        Args:
            val_txt (Any): value represents the numerical value to unpack.
            default_vals (List): a list of values represents the default vals.

        Returns:
            float: numerical values unpacked from the val_txt.
        """
        if val_txt in default_vals:
            return 0
        else:
            return locale.atof(str(val_txt))

    def call_job_in_soap(self):
        remote_tool_name = "TraceDownstream_Hydrology"
        parameters = [self.input_layer, "#", self.source_database, self.generalize]

        self.rj_executor = SOAPJobExecutor("hydrology",
                                            self.portal_description,
                                            remote_tool_name, parameters,
                                            output_positions=[0],
                                            input_layer_index=0,
                                            max_features_in_split=MAX_FEAT_IN_SPLIT)
        return self.rj_executor.execute()
    
    def call_job_in_rest(self):
        LOGGER.debug("Make REST request.")
        parameters = {
            "PointIDField": self.input_layer.OIDFieldName,
            "DataSourceResolution": self.source_database,
            "Generalize": self.generalize
        }
        self.rj_executor = RESTJobExecutor("hydrology",
                                            self.portal_description,
                                            "TraceDownstream",
                                            self.input_layer,
                                            parameters,
                                            self.OUTPUT_NAMES,
                                            max_features_in_split=MAX_FEAT_IN_SPLIT,
                                            mk_sync_request=False)
        return self.rj_executor.execute()

    def unpack_results(self, results: Any):
        out_sr = self.get_out_sr(self.input_layer.spatialReference)  # type: ignore
        default_vals = [" ", "#", None]
        self.split_distance = self._get_numerical_val(self.split_distance, default_vals)
        LOGGER.debug(f"split distance: {self.split_distance}")
        self.max_distance = self._get_numerical_val(self.max_distance, default_vals)
        LOGGER.debug(f"max distance: {self.max_distance}")

        if self.split_distance > 0 or self.max_distance > 0:
            wkspc = self.wkspc
        else:
            wkspc = [self.output_layer.data]
        res = self.rj_executor.unpack_results(results, wkspc=wkspc, out_sr=out_sr)  # type: ignore

        if res is None:
            LOGGER.error(100300, extra={"message_ID": 100300})
            raise arcpy.ExecuteError
        else:
            td_output = res[0]

        with arcpy.EnvManager(outputCoordinateSystem=out_sr):
            if self.bounding_poly_layer and self.bounding_poly_layer.count > 0:
                td_output_clipped = AOLUtils.create_unique_name("TDOutputClipped", self.wkspc)
                arcpy.analysis.Clip(td_output, self.bounding_poly_layer.layer, td_output_clipped)
            else:
                td_output_clipped = td_output

        area_units = AnalysisUtils.get_units(self.portal_description, polygon_units=True)
        if "miles" in area_units.lower():
            user_profile_units = "Miles"
            length_alias = "Length Miles"
        else:
            user_profile_units = "Kilometers"
            length_alias = "Length Kilometers"

        if self.split_distance > 0:
            HydroElevToolUtils.split_lines(td_output_clipped, self.split_distance,
                                           self.split_units, self.output_layer.data,
                                           self.max_distance, self.max_distance_units,
                                           False)
        else:
            self.output_render_flag = 1
            if self.max_distance > 0:
                self.split_distance = self.max_distance + 1
                HydroElevToolUtils.split_lines(td_output_clipped, self.split_distance,
                                               self.max_distance_units,
                                               self.output_layer.data, self.max_distance,
                                               self.max_distance_units, True)
            else:
                arcpy.management.AlterField(self.output_layer.data, "LengthKm",
                                            "AnalysisLength", length_alias)
                arcpy.management.CalculateField(self.output_layer.data, "AnalysisLength",
                                                f"!shape.geodesiclength@{user_profile_units}!",
                                                CALFIELD_PY_METHOD)

        # Join input field
        in_field = "PourPtID"
        arcpy.management.JoinField(self.output_layer.data, in_field, self.input_layer.layer, self.input_layer.OIDFieldName)
