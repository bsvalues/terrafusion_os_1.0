"""EnrichLayer tool impelementation."""
# import from common package. noqa. pylint: disable=import-error
import arcpy

from common import (PATool, PAFeatureLayer, LogUtils, ParameterUnpackMixin,
                    ModelBuilderMixin, ToolExit, PAPrivileges,
                    RemoteToolboxUtils, AOLUtils,
                    SimpleRenderer, Renderer, FSECPublisher,
                    COST_KEY)
from .executor import ELExecutor


LOGGER = LogUtils.setup_logger(__name__)


class ELTool(ModelBuilderMixin, ParameterUnpackMixin, PATool):
    """Implementation of the EnrichLayer tool"""
    GE_SERVICE_KEY = "geoenrichment"
    GEOENRICH_URL = "GeoEnrichment/enrich"

    def _get_user_culture(self) -> str:
        user = self.portal_description.get("user")
        if not user:
            LOGGER.debug("No user found from portal description.")
            raise ToolExit
        culture = user.get("culture", "en")
        if not culture or culture == "en-US":
            culture = "en"
        return culture

    def get_parameters(self):
        [buffer_type] = self.unpack([4], True)
        soap_input = True if (buffer_type and buffer_type.lower() != "straightline") else False
        if not self.check_privileges([PAPrivileges.GEOENRICHMENT]):
            LOGGER.error(100110, extra={"message_ID": 100110})
            raise ToolExit

        if soap_input and not self.check_privileges([PAPrivileges.NETWORK_ANALYSIS]):
            LOGGER.error(100111, extra={"message_ID": 100111})
            raise ToolExit
        LOGGER.debug("Geoenrich privilege check ok.")

        input_layer = PAFeatureLayer(0, metadata={"parameterDataType": "Feature Set",
                                                  "parameterName": "inputlayer",
                                                  "defaultLayerName": "inputLayer"},
                                     use_as_soap_input=soap_input)
        self.check_overwrite_sr(input_layer.spatialReference)  # type: ignore
        self.orig_lyr_fields = input_layer.fields
        (data_collections, analysis_vars, distance, return_bounds) = self.unpack([1, 2, 5, 7], False)
        if not data_collections:
            data_collections = []
        if not analysis_vars:
            analysis_vars = []
        distance = [distance]
        if input_layer.shapeType == "Polygon":
            return_bounds = False
        (src_country, units, hierarchy) = self.unpack([3, 6, 10], True)
        self.cost_parameters = {"inputLayer": input_layer,
                                "dataCollections": data_collections,
                                "analysisVariables": analysis_vars,
                                "bufferType": buffer_type,
                                "distance": distance[0],
                                "units": units}
        # Used to log the refund if the analysis job fail
        self.refund_parameters = self.cost_parameters
        (base_service_url, token, referer) = RemoteToolboxUtils.get_helper_service_url(self.GE_SERVICE_KEY,
                                                                                       self.portal_description)
        if base_service_url.endswith("/"):
            base_service_url.rstrip("/")
        ge_service_url = f"{base_service_url}/{self.GEOENRICH_URL}"
        lang_code = self._get_user_culture()
        output_wkspc = AOLUtils.get_output_wkspcx(input_layer.count)
        self.executor: ELExecutor = ELExecutor(input_layer, ge_service_url, token,
                                               referer, data_collections,
                                               analysis_vars, src_country,
                                               buffer_type, distance, units,  # type: ignore
                                               return_bounds, lang_code,
                                               output_wkspc,
                                               hierarchy=hierarchy)

    def set_visualization(self):
        self.cost_parameters[COST_KEY] = self.executor.task_cost
        if self.executor.return_bounds:
            renderer = SimpleRenderer(self.executor.output_layer, self.task_name)
            drawing_info = renderer.get_drawing_json()
        else:
            # maintain the symbology of the input layer in the result layer
            # see https://devtopia.esri.com/WebGIS/arcgis-portal-app/issues/22367
            drawing_info = None
            if "layerProperties" in self.output_name.json:
                layer_properties = self.output_name.json.pop("layerProperties")
                LOGGER.debug("layer_properties has been dropped from the output_name.")
                if isinstance(layer_properties, list) and layer_properties:
                    drawing_info = layer_properties[0].get("drawingInfo")
                    changed_field_names = {}
                    for field in self.orig_lyr_fields:
                        new_field_name = arcpy.ValidateFieldName(field.name,
                                                                 AOLUtils.get_scratch_wkspc())
                        if field.name != new_field_name:
                            changed_field_names[field.name] = new_field_name
                    if changed_field_names and not Renderer.update_drawing_with_changed_fields(drawing_info,
                                                                                               changed_field_names):
                        drawing_info = None

            if not drawing_info:
                drawing_info = SimpleRenderer(self.executor.output_layer,
                                              self.task_name).get_drawing_json()
        self.executor.output_layer.set_drawing(None, drawing_info)

    def publish_outputs(self):
        with arcpy.EnvManager(extent=None):
            publisher = FSECPublisher(self.output_name, tool_version=self.version)
            publisher.add_layer_to_publish(self.executor.output_layer,
                                           11, "EnrichedLayer")
            publisher.publish()

    def log_usage_metering(self):
        cost = self.executor.input_layer.count * 0.002
        if self.executor.buffer_type:
            value_list = ["straightline", "drivingtime",
                          "drivingdistance", "truckingtime",
                          "truckingdistance", "walkingtime",
                          "walkingdistance"]
            if self.executor.buffer_type.lower() in value_list:
                buffer_type_cnt = value_list.index(self.executor.buffer_type.lower()) + 1
            else:
                buffer_type_cnt = 8
        else:
            buffer_type_cnt = 0
        values = [self.executor.input_layer.count, buffer_type_cnt,
                  len(self.executor.data_collections),
                  self.output_name.output_cost]
        LogUtils.log_usage(self.task_name, self.executor.input_layer.count,
                           cost, values)
