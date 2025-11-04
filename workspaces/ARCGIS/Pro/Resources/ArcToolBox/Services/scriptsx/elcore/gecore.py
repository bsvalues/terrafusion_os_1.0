"""Module with core functionalites of EnrichLayer tool."""
# use module from common package. no-qa. pylint: disable=import-error
from typing import Optional, List, Union, Dict
import asyncio
import os
import json
import functools
from urllib.parse import urlencode
from copy import deepcopy

import arcpy
import arcpy.management
from arcpy.da import SearchCursor, InsertCursor  # type: ignore
import requests
import urllib3

from common import (PAFeatureLayer, PALayerUtils, ToolExit, LogUtils,
                    PAOutputFeatureLayer, AOLUtils)
from .gemsgparser import GEMsgParser
from .geomsplitter import GeomSplitter


LOGGER = LogUtils.setup_logger(__name__)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)  # type: ignore
MAX_CONCURR_THREADS = 10


class GeoEnricher:
    """Perform the core logic of the EnrichLayer."""

    GLOB_KW = "keyglobalfacts"
    EID_FIELD_NAME = "ENRICH_FID"
    TRAVEL_MODE = {"straightline": None,
                   "drivingtime": "Driving",
                   "drivingdistance": "Driving",
                   "truckingtime": "Trucking",
                   "truckingdistance": "Trucking",
                   "walkingtime": "Walking",
                   "walkingdistance": "Walking"}

    def __init__(
        self,
        ge_service_url: str,
        token: str,
        referer: str,
        input_layer: PAFeatureLayer,
        output_wkspc: str,
        data_collections: Optional[List],
        analysis_variables: List,
        src_country: Optional[str],
        buffer_type: Optional[str],
        distance: Optional[Union[int, float]],
        units: Optional[str],
        return_boundary: bool,
        lang_code: str,
        hierarchy: str = ""
    ):
        """Initialize properties.

        Args:
            ge_service_url (str): URL of the geoenrichment service.
            token (str): token used to access the geoenrich service.
            referer (str): referer used to access the geoenrich service.
            input_layer (PAFeatureLayer): input to be enriched.
            output_wkspc (str): a path to the work space that the outputs are saved.
            data_collections (Optional[List]): The collections of data that the users
            want to used to enrich thir features (i.e., ["KeyGlobalFacts", "KeyUSFacts"]).
            analysis_variables (List): a list of specific variables within a data collection
            that the users would like to use to enrich their features. It is in the forms of
            "<data_collections>.<variableName>" (i.e, ["KeyGlobalFacts.AVGHHSIZE"])
            src_country (Optional[str]): a string with two character country code (i.e., FR)
            that defines what is returned from data collection.
            buffer_type (Optional[str]): if the user provides input with geometries as points
            or lines, they also need to provide a way to define an area around their features
            to enrich. So features that are within the distances will be enriched.
            distance (Optional[Union[int, float]]): a int/float value that defines the search
            distance or time.
            units (Optional[str]): the linear unit to be used with the distance value(s).
            return_boundary (bool): applies only for point/line input features. If True,
            a result layer of areas is returned. Otherwise, the output will be the input
            point/line input features.
            lang_code (str): a string represents the language of the enriched results (currently
            only supports Japanese (ja) and English (en)).
        """
        self.ge_service_url = ge_service_url
        self.token = token
        self.referer = referer
        self.input_layer = input_layer
        self.output_wkspc = output_wkspc
        interm_wkspc = AOLUtils.get_output_wkspc(self.input_layer.count)
        if return_boundary:
            local_output = os.path.join(interm_wkspc, "enrichedLayer")
        else:
            # if not return boundary, then the output has the same geometry as the
            # input layer but with additional fields for enriched output.
            local_output = AOLUtils.create_unique_name("enrichedLayer", output_wkspc)
        self.enrich_input_layer = PALayerUtils.make_local_copy(self.input_layer,
                                                               local_output,  # type: ignore
                                                               selected_features_only=True,
                                                               nocopy_if_local=False)
        self.enriched_data_table = os.path.join(interm_wkspc, "geoenrich")
        self.enriched_output = None  # type: Optional[PAOutputFeatureLayer]
        self.data_collections = data_collections
        self.analysis_variables = analysis_variables
        self.src_country = src_country
        self.buffer_type = buffer_type
        self.distance = distance
        self.units = units
        self.lang_code = lang_code
        self.return_boundary = return_boundary

        self.ge_msg_parser = GEMsgParser()
        self.interm_tables = []
        self.hierarchy = hierarchy
        self.params = self._prep_params()
        self.output_table_created = False

        self.splitter = GeomSplitter(self.enrich_input_layer,
                                     MAX_CONCURR_THREADS,
                                     self.buffer_type)

    def _prep_params(self) -> Dict:
        """Prepare a template json to serve the Geoenrich request."""
        params = {}
        params["token"] = self.token
        params["f"] = "json"

        # DataCollections
        dc_glob_facts = False
        if self.data_collections:
            params["dataCollections"] = self.data_collections
            dc_glob_facts = any(self.GLOB_KW in dc.lower() for dc in self.data_collections)

        # AnalysisVariables
        ana_var_glob_facts = False
        if self.analysis_variables:
            params["analysisVariables"] = self.analysis_variables
            ana_var_glob_facts = any(self.GLOB_KW in avr.lower() for avr in self.analysis_variables)

        # set sourcecountry if country is provided and keyGlobalFacts is not specified
        if (self.src_country) and (not (dc_glob_facts or ana_var_glob_facts)):
            params["useData"] = {"sourceCountry": self.src_country}
            if self.hierarchy:
                params["useData"]["hierarchy"] = self.hierarchy
            LOGGER.debug(f"useData: {params['useData']}")

        # specify studyAreaOptions
        params["studyAreasOptions"] = {"aggregateMultipleCountries": True}
        if self.buffer_type and self.units and self.distance:
            if self.buffer_type.lower() == "straightline":
                area_type = "RingBuffer"
                buffer_units = f"esri{self.units}"
            else:
                buffer_units = self.units
                area_type = "NetworkServiceArea"
                trav_mode = self.TRAVEL_MODE.get(self.buffer_type.lower())
                if not trav_mode:
                    try:
                        trav_mode = json.dumps(json.loads(self.buffer_type))
                    except (ValueError, TypeError) as err:
                        LOGGER.debug("Failed to parse travel mode")
                        raise ToolExit from err
                params["studyAreasOptions"]["travelMode"] = trav_mode  # type: ignore
            params["studyAreasOptions"].update({"areaType": area_type,  # type: ignore
                                                "bufferUnits": buffer_units,
                                                "bufferRadii": self.distance})

        # spatial reference
        spa_ref: arcpy.SpatialReference = self.enrich_input_layer.spatialReference  # type: ignore
        if spa_ref:
            if spa_ref.factoryCode > 0:
                params["inSR"] = spa_ref.factoryCode
            else:
                params["inSR"] = {"wkt": spa_ref.exportToString()}

        # set returnGeometry
        if self.return_boundary:
            params["returngeometry"] = True
            params["outSR"] = params["inSR"]

        # set the langcode
        params["langcode"] = self.lang_code
        return params

    async def _make_request(
        self,
        event_loop: asyncio.AbstractEventLoop,
        name: str,
        ge_url: str,
        params: Dict,
        referer: str,
        responses: List
    ):
        """Make an individual request to the GE service.

        Args:
            event_loop (asyncio.AbstractEventLoop): an EventLoop object that the request
            will run inside.
            name (str): name of the request (used for logging purpose).
            ge_url (str): the url of the Geoenrichment REST endpoint.
            params (Dict): parameters of the request.
            referer (str): referer of the request.
            responses (List): a list where the responses from the GE service is
            going to be saved.
        """
        LOGGER.debug(f"Initiating task {name}.")
        headers = {'Content-type': "application/x-www-form-urlencoded"}
        headers["referer"] = referer
        headers["Accept-Encoding"] = "gzip"
        # use run_in_executor to serve the request in a separate thread
        resp = await event_loop.run_in_executor(None,
                                                functools.partial(requests.post,
                                                                  ge_url,
                                                                  data=urlencode(params),
                                                                  headers=headers,
                                                                  verify=False))
        try:
            if resp.status_code == requests.codes.ok:
                responses.append({"name": name, "response": resp.json()})
                LOGGER.debug(f"task {name} succeeded.")
            else:
                resp.raise_for_status()
        except Exception as err:
            error_msg = f"HTTPError: {str(err)}"
            responses.append({"name": name, "response": {"error": error_msg}})
            LOGGER.debug(f"task {name} failed.")

    async def _serve_requests(self, event_loop: asyncio.AbstractEventLoop,
                              responses: List):
        """serve a batch of parallel requests.

        Args:
            event_loop (asyncio.AbstractEventLoop): an EventLoop object that the request
            will run inside.
            responses (List): a list where the responses from the GE service is
            going to be saved.
        """
        features = []
        active_request = 0

        tasks = []
        while active_request < MAX_CONCURR_THREADS:
            features = self.splitter.get_features()
            if features:
                tmp_params = deepcopy(self.params)
                tmp_params["studyareas"] = features
                task_name = self._init_task_name(features)
                tasks.append(self._make_request(event_loop, task_name,
                                                self.ge_service_url,
                                                tmp_params,
                                                self.referer,
                                                responses))
            if self.splitter.leftover_features is None:
                LOGGER.debug("End of thread requests")
                break
            active_request += 1
        await asyncio.gather(*tasks)

    async def _unpack_single_resp(self, event_loop: asyncio.AbstractEventLoop,
                                  resp: Dict):
        """Unpack the response from a single request.

        Args:
            event_loop (asyncio.AbstractEventLoop): an EventLoop object that the request
            will run inside.
            resp (Dict): response back from the request.

        Raises:
            AO_100242: if there is error in the response.
            ToolExit: unrecognized format of the response.
        """
        enriched_result = resp.get("response", {})
        name = resp.get("name", "Unkown")
        LOGGER.debug(f"Start unpacking {name}")
        if "results" in enriched_result:
            if (
                enriched_result["results"]
                and enriched_result["results"][0].get("value", {}).get("FeatureSet")
            ):
                enriched_features = enriched_result["results"][0]["value"]["FeatureSet"][0]
            else:
                enriched_features = None
                LOGGER.debug(f"Geoenrich service returned empty response from {name}.")

            if enriched_features and len(enriched_features.get("features", [])) > 0:
                fset = await event_loop.run_in_executor(None, arcpy.gp.fromEsriJson,
                                                        json.dumps(enriched_features))
                if self.output_table_created:
                    tmp_tbl = AOLUtils.create_unique_name("tempRS", "in_memory")
                    fset.save(tmp_tbl)
                    self.interm_tables.append(tmp_tbl)
                else:
                    fset.save(self.enriched_data_table)
                    self.output_table_created = True
            if "messages" in enriched_result:
                self.ge_msg_parser.parse(enriched_result["messages"])
        elif "error" in enriched_result:
            error = enriched_result["error"]
            if error.get("code", 0) == 401:
                LOGGER.warning(100242, extra={"message_ID": 100242})
            else:
                LOGGER.debug(f"Geoenrich request failed with exception: {error}")
            raise ToolExit
        else:
            LOGGER.debug(f"Invalid Geoenrich response {enriched_result} from {name}")
            raise ToolExit

    async def _unpack_responses(self, event_loop: asyncio.AbstractEventLoop, responses: List):
        """Unpack all the responses.

        Args:
            event_loop (asyncio.AbstractEventLoop): an EventLoop object that the request
            will run inside.
            responses (List): a list of json where each one represents the response
            of a single request.
        """
        tasks = []
        for resp in responses:
            tasks.append(self._unpack_single_resp(event_loop, resp))
        await asyncio.gather(*tasks)

    def _append_enriched_output(self):
        """Append all the tables in interm_tables to the enriched output."""
        arcpy.management.Append(self.interm_tables,
                                self.enriched_data_table,
                                "NO_TEST")
        for ttbl in self.interm_tables:
            arcpy.management.Delete(ttbl)
        self.interm_tables = []

    def _request(self):
        """Serve requests against the Geoenrichment service."""    
        self.splitter.split()
        while self.splitter.leftover_features is not None:
            loop = asyncio.get_event_loop()
            req_responses = []
            loop.run_until_complete(self._serve_requests(loop, req_responses))
            loop.run_until_complete(self._unpack_responses(loop, req_responses))
            if len(self.interm_tables) >= 100:
                self._append_enriched_output()
        if self.interm_tables:
            self._append_enriched_output()

    def _init_task_name(self, features: List[Dict]) -> str:
        """Find the first and last oid and use that as the name of the thread.

        Args:
            features (Dict): features from GeomSplitter.

        Returns:
            str: name of the thread.
        """
        try:
            st_oid = str(list(features[0].get("attributes", {}).values())[0])
            if len(features) > 1:
                end_oid = str(list(features[-1].get("attributes", {}).values())[0])
                return f"from OID {st_oid} to {end_oid}"
            else:
                return f"OID {st_oid}"
        except (KeyError, ValueError, IndexError) as err:
            LOGGER.debug(f"Failed in getting the thread name because {str(err)}")
            return "Unknown OIDs"

    def _post_process(self):
        """Generate output and parse the proper error/warning messages."""
        # Add warnings if needed
        if self.splitter.null_geoms:
            LOGGER.warning(100160, extra={"message_ID": 100160})
        if self.splitter.simplified_geoms:
            LOGGER.warning(100126, extra={"message_ID": 100126})
        if self.splitter.complex_geoms:
            LOGGER.warning(100120, extra={"message_ID": 100120})

        for msg in self.ge_msg_parser.ge_localized_messages:
            msg_params = msg.get("params")
            msg_code = msg.get("messageCode")
            if msg_code:
                msg_extra = {"message_ID": msg_code}
                if msg_params:
                    msg_extra.update(msg_params)
                LOGGER.warning(msg_code, extra=msg_extra)

        if self.ge_msg_parser.ge_messages:
            LOGGER.warning(100047, extra={"message_ID": 100047})

        for msg in self.ge_msg_parser.ge_messages:
            LOGGER.warning(100000, extra={"message_ID": 100000,
                                          "message_text": msg})

        if arcpy.Exists(self.enriched_data_table):
            if not self.return_boundary:
                arcpy.management.JoinField(self.enrich_input_layer.data,
                                           self.enrich_input_layer.OIDFieldName,
                                           self.enriched_data_table,
                                           self.EID_FIELD_NAME)
                self.enriched_output = PAOutputFeatureLayer(self.enrich_input_layer.data)
            else:
                desc = AOLUtils.describe(self.enriched_data_table)
                spatial_reference = desc.spatialReference
                has_m = "ENABLED" if desc.hasM else "DISABLED"  # type: ignore
                has_z = "ENABLED" if desc.hasZ else "DISABLED"  # type: ignore
                polygon_output = AOLUtils.create_unique_name("polygonOutput", self.output_wkspc)
                arcpy.management.CreateFeatureclass(self.output_wkspc,
                                                    os.path.basename(polygon_output),  # type: ignore
                                                    "POLYGON", "#",
                                                    has_m, has_z, spatial_reference)
                arcpy.management.AddField(polygon_output, self.EID_FIELD_NAME,
                                          "LONG", "#", "#", "#", "#",
                                          "NON_NULLABLE", "REQUIRED")
                # Add shapes and Enrich_fid from the enrichDataTable
                with InsertCursor(polygon_output,
                                  ["shape@", self.EID_FIELD_NAME]) as i_cursor:
                    with SearchCursor(self.enriched_data_table,
                                      ["shape@", self.EID_FIELD_NAME]) as s_cursor:
                        for row in s_cursor:
                            i_cursor.insertRow(row)
                # Add fields from enrichedLayer
                arcpy.management.JoinField(polygon_output, self.EID_FIELD_NAME,
                                           self.enrich_input_layer.data,
                                           self.enrich_input_layer.OIDFieldName)
                # Add fields from enrichDataTable
                rm_fnames = [self.EID_FIELD_NAME, "Shape_Length", "Shape_Area"]
                rm_ftypes = ["OID", "Geometry"]
                fields =  AOLUtils.list_fields(self.enriched_data_table)
                join_fields = [field.name for field in fields
                               if field.name not in rm_fnames and field.type not in rm_ftypes]
                arcpy.management.JoinField(polygon_output, self.EID_FIELD_NAME,
                                           self.enriched_data_table, self.EID_FIELD_NAME,
                                           join_fields)
                self.enriched_output = PAOutputFeatureLayer(polygon_output)
        else:
            LOGGER.debug("enriched_data_table is empty.")
            raise ToolExit

    def enrich(self):
        """Perform the enrich"""
        self._request()
        self._post_process()
