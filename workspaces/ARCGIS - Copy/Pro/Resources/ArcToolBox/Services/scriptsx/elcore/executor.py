"""EnrichLayer core logic executor."""
# import common package. noqa. pylint: disable=import-error
from typing import List, Optional, Union

from common import (PAFeatureLayer, LogUtils, PAExecutor, PALayerUtils,
                    PAOutputFeatureLayer, ToolExit)
from .gecore import (GeoEnricher, GeomSplitter, MAX_CONCURR_THREADS)


LOGGER = LogUtils.setup_logger(__name__)


class ELExecutor(PAExecutor):
    """Executor with core logic for EnrichLayer tool"""
    # fields limitation of a single table in datastore
    MAX_COUNT_FIELDS = 450

    def __init__(
        self,
        input_layer: PAFeatureLayer,
        ge_service_url: str,
        token: str,
        referer: str,
        data_collections: List,
        analysis_vars: List,
        src_country: str,
        buffer_type: str,
        distance: Optional[Union[int, float]],
        units: str,
        return_bounds: bool,
        lang_code: str,
        output_wkspc: str,
        hierarchy: str = ""
    ):
        """Setup the parameters.

        Args:
            input_layer (PAFeatureLayer): input to be enriched.
            ge_service_url (str): URL of the geoenrichment service.
            token (str): token used to access the geoenrich service.
            referer (str): referer used to access the geoenrich service.
            data_collections (List): The collections of data that the users
            want to used to enrich thir features (i.e., ["KeyGlobalFacts", "KeyUSFacts"]).
            analysis_vars (List): a list of specific variables within a data collection
            that the users would like to use to enrich their features. It is in the forms of
            "<data_collections>.<variableName>" (i.e, ["KeyGlobalFacts.AVGHHSIZE"]).
            src_country (str): a string with two character country code (i.e., FR)
            that defines what is returned from data collection.
            buffer_type (str): if the user provides input with geometries as points
            or lines, they also need to provide a way to define an area around their features
            to enrich. So features that are within the distances will be enriched.
            distance (Optional[List]): a int/float value that defines the search
            distance or time.
            units (str):  the linear unit to be used with the distance value(s).
            return_bounds (bool): applies only for point/line input features. If True,
            a result layer of areas is returned. Otherwise, the output will be the input
            point/line input features.
            lang_code (str): a string represents the language of the enriched results (currently
            only supports Japanese (ja) and English (en)).
            output_wkspc (str): absolute path of the directory to save the output.
        """
        self.input_layer: PAFeatureLayer = input_layer
        self.ge_service_url = ge_service_url
        self.token = token
        self.referer = referer
        self.data_collections = data_collections
        self.analysis_vars = analysis_vars
        self.src_country = src_country
        self.buffer_type = buffer_type
        self.distance = distance
        self.units = units
        self.return_bounds = return_bounds
        self.lang_code = lang_code
        self.output_wkspc = output_wkspc
        self.output_layer = PAOutputFeatureLayer("")
        self.task_cost = -1
        self.hierarchy = hierarchy

    def validate_parameters(self) -> bool:
        count_of_fields = len(self.analysis_vars) + len(self.input_layer.fields) + 3
        if count_of_fields > self.MAX_COUNT_FIELDS:
            LOGGER.error(100207, extra={"message_ID": 100207,
                                        "maxCountOfFields": self.MAX_COUNT_FIELDS})
            return False

        if "multipoint" in self.input_layer.shapeType.lower():  # type: ignore
            self.input_layer = PALayerUtils.convert_multiparts_to_single(self.input_layer)  # type: ignore

        # check if the potential number of requests is too large and might time out
        avg_req_time = 8 + len(self.analysis_vars) // 50
        if (
            self.buffer_type is None
            or self.buffer_type.lower() == ""
            or self.buffer_type.lower() == "straightline"
        ):
            avg_req_time -= 4

        # the total request time can not be more than 3hrs since online has 4hrs of
        # timeout window.
        max_req_time = 3600 * 3.0
        max_req_to_serve = max_req_time // avg_req_time
        LOGGER.debug(f"Maximum number of requests to serve: {max_req_to_serve}")
        if self.input_layer.count > max_req_to_serve:  # type: ignore
            if GeomSplitter(self.input_layer,  # type: ignore
                            MAX_CONCURR_THREADS,
                            self.buffer_type).count_split() > max_req_to_serve:
                LOGGER.error(100283, extra={"message_ID": 100283})
                return False
        return True

    def execute(self):
        ge_op = GeoEnricher(self.ge_service_url, self.token,
                            self.referer, self.input_layer,  # type: ignore
                            self.output_wkspc,
                            self.data_collections,
                            self.analysis_vars,
                            self.src_country,
                            self.buffer_type,
                            self.distance,  # type: ignore
                            self.units,
                            self.return_bounds,
                            self.lang_code,
                            hierarchy=self.hierarchy)
        ge_op.enrich()
        if ge_op.enriched_output:
            self.output_layer = ge_op.enriched_output
        else:
            LOGGER.debug("No enriched output generated.")
            raise ToolExit
