"""Utility functions to process remote tool through SOAP."""
# import from common package. noqa. pylint: disable=import-error
import os
import sys
from typing import List, Tuple, Optional, Dict, Union
import time
import traceback
import asyncio
import functools
import copy
import json
from collections import deque
from abc import ABC, abstractmethod

import numpy as np
import arcpy
import arcpy.management
from arcpy.da import SearchCursor, InsertCursor, UpdateCursor, FeatureClassToNumPyArray

from common import (LogUtils, PAFeatureLayer, RemoteToolboxUtils,
                    ImmutableDict, ToolCancellation, AOLUtils)


__all__ = ["HydroElevToolUtils", "SOAPJobExecutor"]
LOGGER = LogUtils.setup_logger(__name__)


class HydroElevToolUtils:

    @staticmethod
    def get_conversion_factor(to_units: str, from_units: str) -> float:
        """Get the conversion factor based on the split_units and max_distance_units.

        Args:
            to_units (str): target units to convert to.
            from_units (str): units to convert from.

        Returns:
            float: the conversion factor.
        """
        conversion_lookup = {"meters_to_kilometers": 0.001,
                             "meters_to_feet": 3.28084,
                             "meters_to_yards": 1.093613,
                             "meters_to_miles": .000621371,
                             "kilometers_to_feet": 3280.84,
                             "kilometers_to_yards": 1093.61,
                             "kilometers_to_miles": 0.621371,
                             "miles_to_feet": 5280.0,
                             "miles_to_yards": 1760.0,
                             "feet_to_yards": 3.0}
        if to_units.lower() == from_units.lower():
            return 1.0
        elif f"{to_units.lower()}_to_{from_units.lower()}" in conversion_lookup:
            return conversion_lookup[f"{to_units.lower()}_to_{from_units.lower()}"]
        elif f"{from_units.lower()}_to_{to_units.lower()}" in conversion_lookup:
            return 1.0 / conversion_lookup[f"{from_units.lower()}_to_{to_units.lower()}"]
        else:
            LOGGER.debug(f"Unable to convert {from_units} to {to_units}.")
            raise RuntimeError

    @staticmethod
    def split_lines(in_features: str, split_distance: Union[int, float], split_units: str,
                    out_features: str, max_distance: Union[int, float],
                    max_dist_units: str, max_only: bool):
        """Split tracedownstream lines into segments with user specified length.

        Args:
            in_features (str): absolute path of the input polyline feature layer.
            split_distance (Union[int, float]): linear distance of segment.
            split_units (str): units of the linear distance.
            out_features (str): absolute path to save the output.
            max_distance (Union[int, float]): maximum distance allowed for a single polyline.
            max_dist_units (str): units of the maximum distance.
            max_only (bool): True to split each line into segments, otherwise keep the line unsplitted.
        """
        outpath = os.path.dirname(out_features)
        outname = os.path.basename(out_features)

        if split_units != max_dist_units and max_distance > 0:
            factor = HydroElevToolUtils.get_conversion_factor(split_units, max_dist_units)
            max_distance = max_distance * factor
            max_dist_units = split_units

            LOGGER.debug(f"Max Distance: {max_distance} {factor}")

        arcpy.env.overwriteOutput = True

        orig_id_fieldname = "PourPtID"  # "ORIG_FID"
        from_distance_fieldname = "FromDistance"
        alias_from = f"From Distance {split_units}"
        todistance_fieldname = "ToDistance"
        alias_to = f"To Distance {split_units}"
        total_length = "TotalDistance"
        alias_total = f"Total Distance {split_units}"
        shape_fieldname = "shape@"
        analysis_length = "AnalysisLength"
        alias_length = f"Length {split_units}"

        descfeatures = AOLUtils.describe(in_features)
        sr = descfeatures.spatialReference

        arcpy.management.CreateFeatureclass(outpath, outname, "POLYLINE", "", "DISABLED", "DISABLED", sr)
        fields_to_add = [[orig_id_fieldname, "LONG", orig_id_fieldname]]
        if not max_only:
            fields_to_add.extend([[from_distance_fieldname, "DOUBLE", alias_from],
                                  [todistance_fieldname, "DOUBLE", alias_to],
                                  [total_length, "DOUBLE", alias_total]])
            outfields = [shape_fieldname, orig_id_fieldname, from_distance_fieldname,
                         todistance_fieldname, total_length, analysis_length]
        else:
            outfields = [shape_fieldname, orig_id_fieldname, analysis_length]
        fields_to_add.append([analysis_length, "DOUBLE", alias_length])
        arcpy.management.AddFields(out_features, fields_to_add)

        oidfieldname = "PourPtID"  # descfeatures.oidFieldName  #

        infields = [shape_fieldname, orig_id_fieldname]

        with SearchCursor(in_features, infields) as incursor:
            tot_len = 0
            with InsertCursor(out_features, outfields) as outcursor:
                for row in incursor:
                    (line, fid) = row[0:2]
                    length = line.getLength("GEODESIC", split_units)
                    LOGGER.debug("Calculate length via geodesic distance.")
                    if max_distance > 0 and max_distance < length:
                        maxlength = max_distance
                    else:
                        maxlength = length

                    actual_from_dist = 0
                    if not max_only:
                        while actual_from_dist + split_distance < maxlength:
                            fromvalue = actual_from_dist / length
                            tovalue = (actual_from_dist + split_distance) / length
                            newline = line.segmentAlongLine(fromvalue, tovalue, True)
                            actual_len = newline.getLength("GEODESIC", split_units)
                            outcursor.insertRow([newline, fid, actual_from_dist, actual_from_dist + actual_len,
                                                 maxlength, actual_len])
                            actual_from_dist += actual_len
                            tot_len += actual_len

                    fromvalue = actual_from_dist / length
                    tovalue = maxlength / length
                    newline = line.segmentAlongLine(fromvalue, tovalue, True)
                    if max_only:
                        actual_len = newline.getLength("GEODESIC", max_dist_units)
                        outcursor.insertRow([newline, fid, actual_len])
                        tot_len += actual_len
                    else:
                        actual_len = newline.getLength("GEODESIC", split_units)
                        outcursor.insertRow([newline, fid, actual_from_dist, actual_from_dist + actual_len,
                                             maxlength, actual_len])
                        tot_len += actual_len

            if not max_only:
                with UpdateCursor(out_features, [total_length]) as ucurr:
                    for row in ucurr:
                        row[0] = tot_len
                        ucurr.updateRow(row)

        # Join fields Description and DataResolution
        arcpy.management.JoinField(out_features, orig_id_fieldname, in_features, oidfieldname,
                                   ["Description", "DataResolution"])

    @staticmethod
    def generate_oid_query_splits(input_layer: PAFeatureLayer, max_features_in_split: int) -> List:
        """Generate a list of queries where each query represents a chunk of features to operate on.

        Args:
            input_layer (PAFeatureLayer): an instance of PAFeatureLayer where the features need to be splitted.
            max_features_in_split (int): maximum number of features allowed in each chunk.

        Returns:
            List: a list of two items tuple where the first item is the minimum OID and the second item is the
            maximum OID.
        """
        np_oids = FeatureClassToNumPyArray(input_layer.layer, ["OID@"])  # pylint: disable=no-member
        np_oids = np.sort(np_oids)
        max_oid = np_oids["OID@"].max()
        count = np_oids.size

        total_splits = count // max_features_in_split
        splits = []
        for i in range(total_splits):
            min_range = np_oids[i * max_features_in_split][0]
            max_range = np_oids[(i + 1) * max_features_in_split - 1][0]
            splits.append((min_range, max_range))

        if count % max_features_in_split > 0:
            min_range = np_oids[total_splits * max_features_in_split][0]
            max_range = max_oid
            splits.append((min_range, max_range))
        return splits


class RemoteJobExecutor(ABC):

    @abstractmethod
    def execute(self) -> Tuple:
        pass

    @abstractmethod
    def unpack_results(
        self,
        results: Union[List, deque],
        wkspc: Optional[str],
        out_sr: Optional[arcpy.SpatialReference]) -> Optional[List[str]]:
        pass


class SOAPJobExecutor(RemoteJobExecutor):
    """Parent class of all hydrology and elevation tools."""
    # maximum number of parallel soap jobs allowed.
    MAX_PARA_JOBS = 3
    # a certain task can not be executed more than 5 mins
    TIMEOUT_LIMIT = 5 * 60

    def __init__(self, service_name: str,
                 portal_description: Union[Dict, ImmutableDict],
                 task_name: str,
                 params: List,
                 input_layer_index: int,
                 output_positions: List[int],
                 max_features_in_split: int = 100):
        """Initialize the properties.

        Args:
            service_name (str): name of the remote service.
            portal_description (Union[Dict, ImmutableDict]): self description of the endpoint.
            task_name (str): name of the remote task.
            params (List): input parameters for the remote task.
            input_layer_index (int): index of the input layer in the params list.
            max_features_in_split (int, optional): number of features allowed in each chunk to serve the
            remote request. Defaults to 100.
        """
        super(SOAPJobExecutor, self).__init__()
        self.tbx_full_url = self.construct_remote_tbx(service_name, portal_description)
        self.task_name = task_name
        self.tbx_added = False
        try:
            RemoteToolboxUtils.add_remote_tbx(self.tbx_full_url)
            self.tbx_added = True
            self.task = getattr(arcpy.gp, task_name)
            LOGGER.debug("Successfully adding the toolbox")
        except Exception as err:
            self.remove_toolbox()
            LOGGER.error(f"Unable to access the remote toolbox at {self.tbx_full_url} with task_name as {self.task_name}.")
            raise Exception from err

        self.params = params
        self.input_layer_index = input_layer_index
        self.max_features_in_split = max_features_in_split
        self.input_layer = params[self.input_layer_index]  # type: PAFeatureLayer
        self.output_positions = output_positions

    def construct_remote_tbx(self, service_name: str, portal_description: Dict) -> str:
        """Construct a str represents the path of the remote endpoint.

        Args:
            service_name (str): name of the remote service.
            portal_description (Dict): self description of the portal.

        Returns:
            str: path of the remote endpoint to ping.
        """
        LOGGER.debug(f"service_name: {service_name}")
        (help_service_url, token, referer) = RemoteToolboxUtils.get_helper_service_url(service_name,
                                                                                       portal_description)
        gp_service = RemoteToolboxUtils.convert_rest_url(help_service_url)
        if token:
            return f"{gp_service.toolbox};token={token};{referer}"  # type: ignore
        else:
            return f"{gp_service.toolbox};{referer}"  # type: ignore

    def remove_toolbox(self):
        if self.tbx_added:
            try:
                arcpy.gp.removeToolbox(self.tbx_full_url)
                LOGGER.debug("Removed the toolbox successfully.")
            except:
                msgs = traceback.format_exception(*sys.exc_info())[1:]  # type: ignore
                for msg in msgs:
                    LOGGER.debug(msg.strip())
                LOGGER.debug(f"Failed to remove the toolbox: {self.tbx_full_url}")

    def _cancel_job(self, result: arcpy.Result, expr: str):
        """Cancel an ongoing SOAP job.

        Args:
            result (arcpy.Result): an arcpy.Result object with a SOAP task wrapped.
            expr (str): name of the single task.
        """
        try:
            result.cancel()
            LOGGER.debug(f"{expr} got cancelled.")
        except Exception as err:
            LOGGER.debug(f"Unable to cancel {expr} due to {str(err)}")

    def _cancel_incomplete_jobs(self, curr_jobs: List[Tuple], incomplete_jobs: List[int]):
        """Cancel all the incomplete jobs.

        Args:
            curr_jobs (List[Tuple]): a list of the current ongoing jobs.
            incomplete_jobs (List[int]): a list of id for jobs that has not complete.
        """
        for j, (res, exp, _) in enumerate(curr_jobs):
            if j in incomplete_jobs and res.status < 4:
                self._cancel_job(res, exp)
            elif j in incomplete_jobs and res.status != 4:
                LOGGER.debug(f"{exp} failed with status {res.status}")
                LOGGER.debug(f"{exp} messages: {res.getMessages(0)}")

    def check_jobs_complete(self, jobs: List) -> bool:
        """Check if the remote jobs complete.

        Args:
            jobs (List): a list of remote jobs currently under execution.

        Returns:
            bool: True if all the remote jobs complete and False one of the remote jobs fail.
        """
        incomplete_jobs = [i for i in range(len(jobs))]
        while incomplete_jobs:
            for i, (result, expr, start_time) in enumerate(jobs):
                if i in incomplete_jobs:
                    if result.status < 4:
                        if start_time is None and result.status == 3:
                            LOGGER.debug(f"expr {expr} starts executing...")
                            start_time = time.time()
                            jobs[i] = (result, expr, start_time)
                        if start_time and (time.time() - start_time) >= self.TIMEOUT_LIMIT:
                            LOGGER.debug(f"{expr} took too long to complete.")
                            self._cancel_job(result, expr)
                            incomplete_jobs.remove(i)
                            LOGGER.debug(f"{expr} got cancelled")
                            self._cancel_incomplete_jobs(jobs, incomplete_jobs)
                            return False
                        else:
                            continue
                    elif result.status != 4:
                        LOGGER.debug(f"{expr} failed with status {result.status}")
                        incomplete_jobs.remove(i)
                        self._cancel_incomplete_jobs(jobs, incomplete_jobs)
                        return False
                    else:
                        LOGGER.debug(f"Succeeded expr: {expr}")
                        incomplete_jobs.remove(i)
            if arcpy.env.isCancelled:
                try:
                    LOGGER.debug("Job execution is cancelled.")
                    raise ToolCancellation
                except ToolCancellation as err:
                    raise err
                finally:
                    self._cancel_incomplete_jobs(jobs, incomplete_jobs)

            time.sleep(3)

        return True

    def execute(self) -> Tuple:
        selection_set = None
        arcpy.env.autoCancelling = False
        try:
            oid_field_name = self.input_layer.OIDFieldName
            oid_field_name = oid_field_name.split('.')[-1]

            if self.input_layer.FIDSet:
                selection_set = [x for x in self.input_layer.FIDSet.split(";")]
                selection_type = "SUBSET_SELECTION"
            else:
                selection_type = "NEW_SELECTION"

            where_clause = '"{0}" >= {1} AND "{0}" <= {2}'
            splits = HydroElevToolUtils.generate_oid_query_splits(self.input_layer,
                                                                  self.max_features_in_split)
            final_res = {out_pos: [] for out_pos in self.output_positions}
            all_jobs_complete = True
            while splits:
                results = []
                for _ in range(self.MAX_PARA_JOBS):
                    (min_range, max_range) = splits.pop(0)
                    expr = where_clause.format(oid_field_name, min_range, max_range)
                    # LOGGER.debug(f"expr: {expr}")
                    arcpy.management.SelectLayerByAttribute(self.input_layer.layer,
                                                            selection_type, expr)
                    self.params[self.input_layer_index] = self.input_layer.layer
                    # LOGGER.debug(f"About to submit job for {expr}.")
                    res = (self.task(*self.params), expr, None)
                    LOGGER.debug(f"Complete job submission for {expr}.")
                    results.append(res)
                    if selection_set:
                        tmp_where_clause = '"{0}" IN ({1})'.format(oid_field_name,
                                                                   ",".join(selection_set))
                        arcpy.management.SelectLayerByAttribute(self.input_layer.layer,
                                                                "NEW_SELECTION",
                                                                tmp_where_clause)
                    if not splits:
                        break
                if self.check_jobs_complete(results):
                    for (res, _, _) in results:
                        for out_pos in self.output_positions:
                            final_res[out_pos].append(res.getOutput(out_pos))
                else:
                    all_jobs_complete = False
                    break

            return (final_res, all_jobs_complete)
        except ToolCancellation:
            LOGGER.debug("Job submitted to remote service got cancelled.")
            return (None, False)
        except Exception as err:
            msgs = traceback.format_exception(*sys.exc_info())[1:]  # type: ignore
            for msg in msgs:
                LOGGER.debug(msg.strip())
            LOGGER.debug("Job submission to remote tool failed.")
            return (None, False)
        finally:
            self.remove_toolbox()
            if selection_set and self.input_layer:  # type: ignore
                tmp_where_clause = '"{0}" IN ({1})'.format(oid_field_name,  # type: ignore
                                                           ",".join(selection_set))
                arcpy.management.SelectLayerByAttribute(self.input_layer.layer,
                                                        "NEW_SELECTION",
                                                        tmp_where_clause)
            elif self.input_layer:
                arcpy.management.SelectLayerByAttribute(self.input_layer.layer, "CLEAR_SELECTION")

    def unpack_results(
        self,
        results: Union[List, deque],
        wkspc: Optional[Union[str, list[str]]],
        out_sr: Optional[arcpy.SpatialReference] = None
    ) -> Optional[List[str]]:
        """Write results to output location."""
        if not results:
            LOGGER.debug("Empty results to unpack.")
            return None
        LOGGER.debug("Getting results for output.")
        if wkspc is None:
            wkspc = AOLUtils.get_output_wkspc(len(results) * self.max_features_in_split)
        elif isinstance(wkspc, list) and len(wkspc) != len(self.output_positions):
            LOGGER.debug(f"Expect {len(self.output_positions)} outputs but only {len(wkspc)} destinations were given.")
            raise RuntimeError

        try:
            final_res = []
            for i, out_pos in enumerate(self.output_positions):
                if isinstance(wkspc, list):
                    output_filepath = wkspc[i]
                else:
                    output_filepath = AOLUtils.create_unique_name(f"remoteToolOutput{out_pos}", wkspc)
                output_rs = results.get(out_pos)
                with arcpy.EnvManager(outputCoordinateSystem=out_sr):
                    arcpy.management.Merge(output_rs, output_filepath)
                    final_res.append(output_filepath)
            return final_res
        except arcpy.ExecuteError:
            LOGGER.debug("Failed in merging result output.")
            return None
        except Exception as err:
            LOGGER.debug(f"Failed in getting outputs because {str(err)}.")
            return None


class RESTJobExecutor(RemoteJobExecutor):
    """Call remote job through REST."""
    MAX_PARAL_JOB = 5
    
    def __init__(
        self,
        service_name: str,
        portal_description: Union[Dict, ImmutableDict],
        task_name: str,
        input_layer: PAFeatureLayer,
        params: Dict,
        output_keys: List[str],
        max_features_in_split: int = 10,
        input_point_key: str = "InputPoints",
        mk_sync_request: bool = True
    ):
        """Initialize the properties.

        Args:
            service_name (str): name of the remote service.
            portal_description (Union[Dict, ImmutableDict]): self description of the endpoint.
            task_name (str): name of the remote task.
            input_layer (PAFeatureLayer): an instance of PAFeatureLayer with the input points.
            params (Dict): input parameters for the remote task.
            output_keys (List[str]): a list of string where each item represents the name of the
            output on REST API.
            max_features_in_split (int, optional): number of features allowed in each chunk to serve the
            remote request. Defaults to 10.
            input_point_key (str): the name of the input points on REST API.
            mk_sync_request (bool): true to make a series of requests sync and false to request async.
        """
        (self.service_url, self.token, self.referer) = RemoteToolboxUtils.get_helper_service_url(service_name,
                                                                                                 portal_description)
        LOGGER.debug(f"service_url: {self.service_url}; token: {self.token}; referer: {self.referer}")
        self.task_name = task_name
        self.params = params
        self.input_layer = input_layer
        if not self.input_layer:
            LOGGER.debug(f"{input_point_key} is empty.")
            raise RuntimeError
        self.max_features_in_split = max_features_in_split
        self.output_keys = output_keys
        self.input_point_key = input_point_key
        self.mk_sync_request = mk_sync_request
        self.task_url = f"{self.service_url}/{self.task_name}"
        self.headers = {"referer": self.referer}
    
    def __cancel_job(self, job_url: str) -> Dict:
        """Cancel a remote job.

        Args:
            job_url (str): REST URL of the currently executing job.

        Returns:
            Dict: response in json format of the cancelled job.
        """
        cancel_url = f"{job_url}/cancel"
        params = {"f": "json", "token": self.token}
        return AOLUtils.mk_get_request(cancel_url, params, headers=self.headers)

    def __mk_single_request(self, params: Dict) -> Tuple:
        """Make a single request against the remote utility service.

        Args:
            params (Dict): REST parameters for the request.

        Raises:
            ToolCancellation: raise if arcpy.env.isCancelled is True.

        Returns:
            Tuple: a three items tuple where the first is the job_id, and second is
            a dictionary {<outputKey>: {<jon response>, <messages>: [<job messages>]}},
            and last a boolean indicates whether the remote job complete successfully.
        """
        submit_url = f"{self.task_url}/submitJob"
        LOGGER.debug(f"submit_url: {submit_url}")
        job_resp = AOLUtils.mk_post_request(submit_url, params, headers=self.headers)
        LOGGER.debug(f"submitJob: {job_resp}")
        job_id = job_resp.get("jobId")
        if not job_id:
            return (None, {}, False)
        job_url = f"{self.task_url}/jobs/{job_id}"
        job_params = {"f": "json", "token": self.token}
        while (job_resp.get("jobStatus") != "esriJobSucceeded"):
            if arcpy.env.isCancelled:
                _ = self.__cancel_job(job_url)
                raise ToolCancellation

            job_resp = AOLUtils.mk_get_request(job_url, job_params, headers=self.headers)
            if job_resp.get("jobStatus") == "esriJobFailed":
                LOGGER.debug(f"job_resp: {job_resp['messages']}")
                return (job_id, {"messages": job_resp.get("messages", [])}, False)
            time.sleep(1)

        result = {"messages": job_resp.get("messages", [])}
        for op_key in self.output_keys:
            if op_key not in job_resp.get("results", {}):
                LOGGER.debug(f"Unable to find {op_key} from response of {job_id}.")
                return (job_id, result, False)
            else:
                param_url = job_resp.get('results', {}).get(op_key, {}).get('paramUrl')
                if not param_url:
                    LOGGER.debug(f"Unable to find paramUrl of {op_key} from response of {job_id}.")
                    return (job_id, result, False)
                result_url = f"{job_url}/{param_url}"
                result_resp = AOLUtils.mk_get_request(result_url,
                                                      {"f": "json", "token": self.token},
                                                      headers=self.headers).get("value")
                if result_resp is None:
                    LOGGER.debug(f"result of {op_key} from {job_id} is empty.")
                    return (job_id, result, False)
                result[op_key] = arcpy.gp.fromEsriJson(json.dumps(result_resp))

        return (job_id, result, True)
    
    def __create_req_params(self, min_rng: int, max_rng: int, oid_field_name: str,
                            selection_type: str) -> Dict:
        """Create the parameters for a single request.

        Args:
            min_rng (int): the lower bound of objectID to search from.
            max_rng (int): the upper bound of objectID to search from.
            oid_field_name (str): name of the objectID field.
            selection_type (str): a string indicates the selection type (either
            new_selection or subset_selection).

        Returns:
            Dict: parameters to serve a REST request.
        """
        expr = f'"{oid_field_name}" >= {min_rng} AND "{oid_field_name}" <= {max_rng}'
        LOGGER.debug(f"expr: {expr}")
        arcpy.management.SelectLayerByAttribute(self.input_layer.layer,
                                                selection_type,
                                                expr)
        data_json = arcpy.FeatureSet(self.input_layer.layer).JSON
        req_params = copy.deepcopy(self.params)
        req_params[self.input_point_key] = data_json
        req_params["f"] = "json"
        req_params["token"] = self.token
        return req_params

    def mk_sync_requests(self, selection_type: str, oid_field_name: str) -> List:
        """Make REST requests one after another. This fits for tools that need to
        send just one request with all features, like CDTA and CVS.

        Args:
            selection_type (str): type of selection for features to send in a request.
            oid_field_name (str): name of the objectID field.

        Raises:
            ToolCancellation: raised when tool execution is cancelled.
            RuntimeError: if the request to the utility service failed.

        Returns:
            List: a list with each single item as a three items tuple where the first
            is the job_id, and second is a dictionary {<outputKey>: {<jon response>,
            <messages>: [<job messages>]}}, and last a boolean indicates whether
            the remote job complete successfully.
        """
        splits = HydroElevToolUtils.generate_oid_query_splits(self.input_layer,
                                                              self.max_features_in_split)
        req_res = []
        while splits:
            (min_rng, max_rng) = splits.pop(0)
            req_params = self.__create_req_params(min_rng, max_rng, oid_field_name,
                                                  selection_type)
            try:
                (jid, result, req_succ) = self.__mk_single_request(req_params)
                # just in case cancellation happened after job status check.
                if arcpy.env.isCancelled:
                    raise ToolCancellation
            except ToolCancellation as err:
                raise err
            if req_succ:
                req_res.append(result)
            else:
                if not jid:
                    LOGGER.debug("Request failed without a remote job ID.")
                else:
                    LOGGER.debug(f"Remote job {jid} failed.")
                raise RuntimeError
        return req_res

    async def __submit_job(self, event_loop: asyncio.AbstractEventLoop,
                           params: Dict, job_queue: deque):
        """Make a single request to submit a job against remote utility service.

        Args:
            event_loop (asyncio.AbstractEventLoop): an instance of AbstractEventLoop.
            params (Dict): parameters for the request.
            job_queue (deque): a deque where the submit job response is saved.

        Raises:
            RuntimeError: if no jobId returned back from the submit job request.
            ToolCancellation: if the tool execution is cancelled.
        """
        submit_url = f"{self.task_url}/submitJob"
        job_resp = await event_loop.run_in_executor(None,
                                                    functools.partial(AOLUtils.mk_get_request,
                                                                      submit_url,
                                                                      params,
                                                                      headers=self.headers))
        if "jobId" not in job_resp:
            LOGGER.debug(f"Invalid response of submittingJob. Got {job_resp}")
            raise RuntimeError
        if arcpy.env.isCancelled:
            raise ToolCancellation
        job_queue.append(job_resp)

    async def __check_job_status(self, event_loop: asyncio.AbstractEventLoop,
                                 job_resp: Dict,
                                 resp_queue: deque):
        """Check if a remote job succeeds.

        Args:
            event_loop (asyncio.AbstractEventLoop): an instance of AbstractEventLoop.
            job_resp (Dict): a json with the response of a single job.
            resp_queue (deque): a deque to save the final response of the job.

        Raises:
            RuntimeError: if the job finished without a status of success.
            ToolCancellation: if the tool execution is cancelled.
        """
        job_id = job_resp.get("jobId")
        LOGGER.debug(f"check status of {job_id}")
        if not job_id:
            resp_queue.append((None, {}, False))
        job_url = f"{self.task_url}/jobs/{job_id}"
        job_params = {"f": "json", "token": self.token}
        try:
            while (job_resp.get("jobStatus") != "esriJobSucceeded"):
                job_resp = await event_loop.run_in_executor(None,
                                                            functools.partial(AOLUtils.mk_get_request,
                                                                              job_url,
                                                                              job_params,
                                                                              headers=self.headers))
                if arcpy.env.isCancelled:
                    LOGGER.debug(f"Remote job {job_id} got cancelled.")
                    self.__cancel_job(job_url)
                    raise ToolCancellation

                if job_resp.get("jobStatus") == "esriJobFailed":
                    LOGGER.debug(f"remote job failed with responses of: {job_resp['messages']}")
                    raise RuntimeError

                await asyncio.sleep(1)
        except asyncio.CancelledError:
            LOGGER.debug(f"Remote job {job_id} got cancelled.")
            self.__cancel_job(job_url)
            raise ToolCancellation

        resp_queue.append((job_id, job_resp, True))
        
    async def __unpack_job_result(self, event_loop: asyncio.AbstractEventLoop,
                                  job_resp: Dict,
                                  job_id: str,
                                  result_queue: deque):
        """Unpack the result of a certain job.

        Args:
            event_loop (asyncio.AbstractEventLoop): an instance of AbstractEventLoop.
            job_resp (Dict): the response of a job after it succeeds.
            job_id (str): id of the remote job.
            result_queue (deque): a deque to store the unpacked result.

        Raises:
            RuntimeError: raised if an error happened during unpacking.
            ToolCancellation: raised if the execution was cancelled.
        """
        LOGGER.debug(f"Unpack the result of {job_id}.")
        result = {"messages": job_resp.get("messages", [])}
        job_url = f"{self.task_url}/jobs/{job_id}"
        for op_key in self.output_keys:
            if op_key not in job_resp.get("results", {}):
                LOGGER.debug(f"Unable to find {op_key} from response of {job_id}.")
                raise RuntimeError
            else:
                param_url = job_resp.get('results', {}).get(op_key, {}).get('paramUrl')
                if not param_url:
                    LOGGER.debug(f"Unable to find paramUrl of {op_key} from response of {job_id}.")
                    raise RuntimeError

                result_url = f"{job_url}/{param_url}"
                LOGGER.debug(f"Fetch the result from {result_url}")
                if arcpy.env.isCancelled:
                    raise ToolCancellation
                result_val = await event_loop.run_in_executor(None,
                                                              functools.partial(AOLUtils.mk_get_request,
                                                                                result_url,
                                                                                {"f": "json", "token": self.token},
                                                                                headers=self.headers))
                result_val = result_val.get("value")
                if result_val is None:
                    LOGGER.debug(f"result of {op_key} from {job_id} is empty.")
                    result_queue.append((job_id, result, False))

                result[op_key] = arcpy.gp.fromEsriJson(json.dumps(result_val))

        result_queue.append((job_id, result, True))

    async def __submit_jobs(self, event_loop: asyncio.AbstractEventLoop, selection_type: str,
                            oid_field_name: str,
                            job_queue: deque,
                            splits: List):
        """submit jobs in parallel against the remote utility service.

        Args:
            event_loop (asyncio.AbstractEventLoop): an instance of AbstractEventLoop.
            selection_type (str): parameters for the request.
            oid_field_name (str): name of the objectID field.
            job_queue (deque): a deque to store the response of submitted jobs.
            splits (List): a list of object ID ranges where each request will be based upon.
        """
        job_served = 0
        tasks = []
        while job_served < self.MAX_PARAL_JOB:
            (min_rng, max_rng) = splits.pop(0)
            req_params = self.__create_req_params(min_rng, max_rng, oid_field_name,
                                                  selection_type)
            tasks.append(self.__submit_job(event_loop, req_params, job_queue))
            job_served += 1
            if not splits:
                break
        await asyncio.gather(*tasks)
    
    async def __check_jobs(self, event_loop: asyncio.AbstractEventLoop,
                           job_queue: deque,
                           resp_queue: deque):
        """Check if all the submitted jobs complete.

        Args:
            event_loop (asyncio.AbstractEventLoop): an instance of AbstractEventLoop.
            job_queue (deque): a deque stores the response of each submitted job.
            resp_queue (deque): a deque stores the response after remote job completes.

        Raises:
            err: raised if the tool failed or cancelled.
        """        
        tasks = []
        while job_queue:
            job_resp = job_queue.pop()
            tasks.append(self.__check_job_status(event_loop, job_resp, resp_queue))
        try:
            await asyncio.gather(*tasks)
        except (RuntimeError, ToolCancellation) as err:
            for task in asyncio.all_tasks():
                task.cancel()
            raise err

    async def __unpack_jobs(self, event_loop: asyncio.AbstractEventLoop,
                            resp_queue: deque,
                            result_queue: deque):
        """Unpack all the finished jobs and store the result.

        Args:
            event_loop (asyncio.AbstractEventLoop): an instance of AbstractEventLoop.
            resp_queue (deque): a deque contains the response of each succeeded job.
            result_queue (deque): a deque contains the unpacked result.

        Raises:
            RuntimeError: raised if a certain remote job failed.
        """
        tasks = []
        while resp_queue:
            (job_id, resp, job_succ) = resp_queue.pop()
            if not job_succ:
                LOGGER.debug(f"job {job_id} failed. Unable to unpack the result.")
                raise RuntimeError
            else:
                tasks.append(self.__unpack_job_result(event_loop, resp, job_id, result_queue))
        await asyncio.gather(*tasks)

    def __cancel_remote_requests(self, submitted_resp: deque):
        """Cancel all the ongoing remote jobs. 

        Args:
            submitted_resp (deque): a deque stores the response of each submitted job.
        """
        while submitted_resp:
            single_resp = submitted_resp.pop()
            if isinstance(single_resp, dict) and "jobId" in single_resp:
                job_id = single_resp.get("jobId")
                if job_id:
                    job_url = f"{self.task_url}/jobs/{job_id}"
                    self.__cancel_job(job_url)
                    LOGGER.debug(f"{job_id} is cancelled.")

    def mk_async_requests(self, selection_type: str, oid_field_name: str) -> deque:
        """Make requests against remote utility service asyncly.

        Args:
            selection_type (str): a string indicates the selection type (either
            new_selection or subset_selection).
            oid_field_name (str): name of the object ID field.

        Raises:
            err: either ToolCancellation or RuntimeError.

        Returns:
            deque: a deque contains the final result of each request.
        """
        loop = asyncio.get_event_loop()
        splits = HydroElevToolUtils.generate_oid_query_splits(self.input_layer,
                                                              self.max_features_in_split)
        job_queue = deque()
        resp_queue = deque()
        result_queue = deque()
        while splits:
            try:
                loop.run_until_complete(self.__submit_jobs(loop, selection_type,
                                                                oid_field_name, job_queue,
                                                                splits))
                loop.run_until_complete(self.__check_jobs(loop, job_queue, resp_queue))
                loop.run_until_complete(self.__unpack_jobs(loop, resp_queue, result_queue))
            except ToolCancellation as err:
                LOGGER.debug("Remote requests got cancelled.")
                self.__cancel_remote_requests(resp_queue)
                raise err
            except RuntimeError as err:
                LOGGER.debug(f"Unexpected error during execution due to {str(err)}")
                self.__cancel_remote_requests(resp_queue)
                raise err
        return result_queue

    def execute(self) -> Tuple:
        """Call the remote utility service through REST.

        Returns:
            Tuple: a two item tuple where the first item is a list contains the
            final result of each request and the second item is a boolean where
            True means all requests complete successfully and False otherwise.
        """
        oid_field_name = self.input_layer.OIDFieldName
        oid_field_name = oid_field_name.split('.')[-1]

        if self.input_layer.FIDSet:  # type: ignore
            orig_selection = [x for x in self.input_layer.FIDSet.split(";")]
            selection_type = "SUBSET_SELECTION"
        else:
            orig_selection = None
            selection_type = "NEW_SELECTION"
        arcpy.env.autoCancelling = False
        res = []
        try:
            if self.mk_sync_request:
                LOGGER.debug(f"Make sync requests.")
                res = self.mk_sync_requests(selection_type, oid_field_name)
            else:
                LOGGER.debug(f"Make async requests.")
                res = self.mk_async_requests(selection_type, oid_field_name)
            return (res, True)
        except ToolCancellation as err:
            return (res, False)
        except Exception as err:
            LOGGER.debug(f"make sync requests failed due to {str(err)}")
            return (res, False)
        finally:
            if orig_selection and self.input_layer:
                tmp_where_clause = '"{0}" IN ({1})'.format(oid_field_name,
                                                           ",".join(orig_selection))
                arcpy.management.SelectLayerByAttribute(self.input_layer.layer,
                                                        "NEW_SELECTION",
                                                        tmp_where_clause)
            elif self.input_layer:
                arcpy.management.SelectLayerByAttribute(self.input_layer.layer, "CLEAR_SELECTION")

    def unpack_results(self,
                       results: Union[List, deque],
                       wkspc: Optional[Union[str, List[str]]],
                       out_sr: Optional[arcpy.SpatialReference] = None) -> Optional[List[str]]:
        """Unpack the results

        Args:
            results (Union[List, deque]): results of each REST request.
            output_keys (List[str]): a list where each item represents a name of the output.
            wkspc (Optional[str]): absolute path of the saving the results.
            out_sr (Optional[arcpy.SpatialReference], optional): spatial reference of the final
            output. Defaults to None.

        Raises:
            arcpy.ExecuteError: raised if output of a certain response is empty.

        Returns:
            Optional[List[str]]: a list where each item is an absolute path pointing
            to the result of a certain output. It is in the same order of the
            output_keys.
        """
        if not results:
            LOGGER.debug("Empty results to unpack.")
            return None
        LOGGER.debug("Getting results for output.")
        if wkspc is None:
            wkspc = AOLUtils.get_output_wkspc(len(results) * self.max_features_in_split)
        elif isinstance(wkspc, list) and len(wkspc) != len(self.output_keys):
            LOGGER.debug(f"Expect {len(self.output_keys)} outputs but only {len(wkspc)} destinations were given.")
            raise RuntimeError

        try:
            output_fs = {key: [] for key in self.output_keys}
            output_pos = {key: i for i, key in enumerate(self.output_keys)}
            if isinstance(results, list):
                for res in results:
                    for out_key in self.output_keys:
                        res_fs = res.get(out_key)
                        if not res_fs:
                            raise arcpy.ExecuteError
                        else:
                            output_fs[out_key].append(res_fs)
            else:
                while results:
                    (_, tmp_res, _) = results.pop()
                    for out_key in self.output_keys:
                        res_fs = tmp_res.get(out_key)
                        if not res_fs:
                            raise arcpy.ExecuteError
                        else:
                            output_fs[out_key].append(res_fs)
            unpacked_res = ["" for _ in range(len(output_pos))]

            with arcpy.EnvManager(outputCoordinateSystem=out_sr):
                for key in output_fs:
                    pos = output_pos[key]
                    if isinstance(wkspc, list):
                        output_filepath = wkspc[pos]
                    else:
                        output_filepath = AOLUtils.create_unique_name(f"remoteToolOutput{key}", wkspc)
                    arcpy.management.Merge(output_fs[key], output_filepath)
                    unpacked_res[pos] = output_filepath

            return unpacked_res
        except arcpy.ExecuteError as err:
            LOGGER.debug(f"Failed in merging result output due to {str(err)}")
            return None
        except Exception as err:
            LOGGER.debug(f"Failed in getting outputs because {str(err)}")
            return None
