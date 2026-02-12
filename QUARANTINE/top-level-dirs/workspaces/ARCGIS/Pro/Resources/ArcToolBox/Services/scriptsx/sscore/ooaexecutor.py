"""OptimizedOutlierAnalysis core logic executor."""
# Update sys.path dynamically. pylint: disable=C0411, C0413
# Use the setattr and __slots__. Disable missing attribute. pylint: disable=E1101
# import from common package. noqa. pylint: disable=import-error
import json
from typing import Union, Optional, List

import arcpy
import arcpy.management

from common import (LogUtils, PAExecutor, PAFeatureLayer, PAOutputFeatureLayer,
                    PopupInfo, ToolExit, FieldUtils, AOLUtils)
from .utilities import duplicate_reserved_fields, DISTANCE_UNIT_INFO, densify_features, SUPPORTED_NUMERIC_TYPES
from elcore import ELExecutor as GeoEnrichExecutor
from OptimizedOutlierAnalysis import runOOA

LOGGER = LogUtils.setup_logger(__name__)
ERROR_ID = [192, 366, 401, 906, 929, 1533, 1534, 1572, 1573, 1575, 100007, 84426, 110243]


class OOAExecutor(PAExecutor):
    """ Core logic for OptimizedOutlierAnalysis tool. """

    def __init__(self, input_layer: PAFeatureLayer,
                 output_layer: PAOutputFeatureLayer,
                 analysis_field: str,
                 bounding_polygon_layer: Optional[PAFeatureLayer] = None,
                 aggregation_polygon_layer: Optional[PAFeatureLayer] = None,
                 aggregate_method: str = "",
                 cell_size: str = "", distance_band: str = "",
                 divided_by_field: str = "", service_url: str = "",
                 entoken: str = "", referer: str = "",
                 context: str = "", permutation: str = "",
                 output_wkspc: str = '',
                 orig_cxt_sr: Optional[arcpy.SpatialReference] = None):
        """ The initialization function for Optimized Outlier Executor Class
        Args:
            input_layer: an instance of PAFeatureLayer with geometry to fetch center from.
            output_layer: an instance of PAOutputFeatureLayer with the results to be stored.
        Returns:
            No returns.
        Raises:
            No exceptions.

        """
        self.input_layer = input_layer
        self.output_layer = output_layer
        self.analysis_field = analysis_field
        self.analysis_field_alias = ""
        self.analysis_field_valid = True
        if len(self.analysis_field) == 0 or self.analysis_field == "NO ANALYSIS FIELD":
            self.has_analysis_field = False
        else:
            self.has_analysis_field = True
            for f in input_layer.fields:
                if f.name.upper() == analysis_field.upper():
                    self.analysis_field_alias = f.aliasName
                    if f.type not in SUPPORTED_NUMERIC_TYPES:
                        self.analysis_field_valid = False
                    break

        self.aggregate_method = aggregate_method
        self.bounding_polygon_layer = bounding_polygon_layer
        self.aggregation_polygon_layer = aggregation_polygon_layer
        self.cell_size = cell_size
        self.distance_band = distance_band
        self.divided_by_field = divided_by_field
        self.divided_by_field_alias = ""
        self.divided_by_field_valid = True
        if divided_by_field:
            if aggregation_polygon_layer is not None:
                for f in aggregation_polygon_layer.fields:
                    if f.name.upper() == divided_by_field.upper():
                        self.divided_by_field_alias = f.aliasName
                        if f.type not in SUPPORTED_NUMERIC_TYPES:
                            self.divided_by_field_valid = False
                        break
            if self.divided_by_field_alias == "" and divided_by_field.upper() == "ESRIPOPULATION":
                self.divided_by_field_alias = "Esri Population"
            if self.divided_by_field_alias == "":
                for f in input_layer.fields:
                    if f.name.upper() == divided_by_field.upper():
                        self.divided_by_field_alias = f.aliasName
                        if f.type not in SUPPORTED_NUMERIC_TYPES:
                            self.divided_by_field_valid = False
                        break
            if self.divided_by_field_alias == "":
                self.divided_by_field_alias = divided_by_field

        self.service_url = service_url
        self.entoken = entoken
        self.referer = referer
        self.context = context
        self.permutation = permutation
        self.output_wkspc = output_wkspc
        self.remote_task_cost = 0
        self.orig_cxt_sr = orig_cxt_sr

    def validate_parameters(self) -> bool:
        """Validate input parameters."""
        if self.input_layer.shapeType == "Polyline":
            LOGGER.error(100009, extra={"message_ID": 100009})
            return False
        if not self.has_analysis_field and self.input_layer.shapeType == "Polygon":
            LOGGER.error(100011, extra={"message_ID": 100011})
            return False
        if not self.analysis_field_valid:
            LOGGER.error(100106, extra={"message_ID": 100106, "fieldName": self.analysis_field})
            return False
        if not self.divided_by_field_valid:
            LOGGER.error(100106, extra={"message_ID": 100106, "fieldName": self.divided_by_field})
            return False
        
        if self.divided_by_field:
            divide_field_valid = False
            if self.aggregation_polygon_layer is not None:
                for f in self.aggregation_polygon_layer.fields:
                    if f.name.upper() == self.divided_by_field.upper():
                        divide_field_valid = True
                        break
                if not divide_field_valid and self.divided_by_field.upper() == "ESRIPOPULATION":
                    divide_field_valid = True
                if not divide_field_valid:
                    LOGGER.error(100087, extra={"message_ID": 100087, "fieldName": self.divided_by_field, "inputLayer": self.aggregation_polygon_layer.layer_name})
                    return False
            elif self.aggregation_polygon_layer is None and not divide_field_valid:
                for f in self.input_layer.fields:
                    if f.name.upper() == self.divided_by_field.upper():
                        divide_field_valid = True
                        break
                if not divide_field_valid and self.divided_by_field.upper() == "ESRIPOPULATION":
                    divide_field_valid = True
                if not divide_field_valid:
                    LOGGER.error(100087, extra={"message_ID": 100087, "fieldName": self.divided_by_field, "inputLayer": self.input_layer.layer_name})
                    return False
                
        if self.bounding_polygon_layer:
            if self.bounding_polygon_layer.count == 0:
                LOGGER.error(100024, extra={"message_ID": 100024,
                                            "inputLayer": self.bounding_polygon_layer.layer_name})
                return False
            if self.bounding_polygon_layer.shapeType != "Polygon":
                LOGGER.error(100008)
                return False
        if self.aggregation_polygon_layer:
            if self.aggregation_polygon_layer.count == 0:
                LOGGER.error(100024, extra={"message_ID": 100024,
                                            "inputLayer": self.aggregation_polygon_layer.layer_name})
                return False
            if self.aggregation_polygon_layer.shapeType != "Polygon":
                LOGGER.error(100010, extra={"message_ID": 100010})
                return False
        if self.has_analysis_field and self.input_layer is not None:
            if not FieldUtils.verify_field_exists(self.input_layer, self.analysis_field):
                LOGGER.error(728, extra={"message_ID": 728,
                                         "fieldName": self.analysis_field})
                return False
        if not self.input_layer:
            LOGGER.error("input_layer can not be empty.")
            return False

        if self.cell_size and self.distance_band:
            try:
                user_cell_size = float(self.cell_size.split()[0])
                user_cell_unit = self.cell_size.split()[1].upper()
                user_band_size = float(self.distance_band.split()[0])
                user_band_unit = self.distance_band.split()[1].upper()
                _, factor_cell = DISTANCE_UNIT_INFO[user_cell_unit]
                _, factor_band = DISTANCE_UNIT_INFO[user_band_unit]
                cell_size = factor_cell * user_cell_size
                band_size = factor_band * user_band_size
                if band_size <= cell_size:
                    LOGGER.error(192, extra={"message_ID": 192})
                    return False
            except Exception as err:
                LOGGER.debug(f"{str(err)}")
        return True

    def execute(self):
        """ Execute the core logic. """
        LogUtils.reconfig_ss_logger()
        spatial_ref: arcpy.SpatialReference = self.input_layer.spatialReference  # type: ignore
        if spatial_ref.PCSCode == 102100 or spatial_ref.PCSCode == 3857:
            output_path = AOLUtils.create_unique_name("temp_ooa_output", self.output_wkspc)
        else:
            output_path = self.output_layer.data
        if self.context:
            text_json = json.loads(self.context)
            if "randomGenerator" in text_json:
                arcpy.env.randomGenerator = "{} MERSENNE_TWISTER".format(text_json["randomGenerator"].split(" ")[0])  # type: ignore
        try:
            arcpy.env.extent = None  # type: ignore
            if self.input_layer.shapeType == "Polygon":
                agol_messages = runOOA(self.input_layer, output_path, self.analysis_field,
                                       "", "", "", self.permutation,
                                       self.cell_size, self.distance_band, self.divided_by_field,
                                       self.enrich_layer)
            else:
                bounding_polygons = None
                if self.bounding_polygon_layer:
                    bounding_polygons = densify_features(self.bounding_polygon_layer.data, self.output_wkspc)
                aggregated_polygons = None
                if self.aggregation_polygon_layer:
                    aggregated_polygons = self.aggregation_polygon_layer.layer
                agol_messages = runOOA(self.input_layer, output_path, self.analysis_field,
                                       self.aggregate_method, bounding_polygons, aggregated_polygons, self.permutation,
                                       self.cell_size, self.distance_band, self.divided_by_field,
                                       self.enrich_layer)
                if bounding_polygons is not None:
                    try:
                        arcpy.management.Delete(bounding_polygons)
                    except Exception as err:
                        LOGGER.debug(f"{str(err)}")
        except:
            info: List = arcpy.gp.GetAllMessages()  # type: ignore
            for i in info:
                # arcpy.AddMessage(i)
                if i[1] == 728:
                    field_name = i[2].split(":")[1].split(" ")[2]
                    param_name = self.input_layer.layer_name
                    LOGGER.error(100052, extra={"message_ID": 100052,
                                                "fieldName": field_name,
                                                "paramName": param_name})
                elif i[1] == 897:
                    small_distance = i[2].split(":")[1].split(" ")[5]
                    LOGGER.error(897, extra={"message_ID": 897,
                                             "smallDistance": small_distance})
                elif i[1] == 1535:
                    min_num_features = i[2].split(":")[1].split(" ")[-3]
                    LOGGER.error(1535, extra={"message_ID": 1535,
                                              "minNumFeatures": min_num_features})
                elif i[1] == 1536:
                    min_num_incidents = i[2].split(":")[1].split(" ")[-8]
                    # dataType = i[2].split(":")[1].split(" ")[-7]
                    LOGGER.error(1536, extra={"message_ID": 1536, 
                                              "minNumIncidents": min_num_incidents})
                elif i[1] == 1570:
                    min_num_incidents = i[2].split(":")[1].split(" ")[10]
                    # shapeType = i[2].split(":")[1].split(" ")[11]
                    LOGGER.error(1570, extra={"message_ID": 1570, 
                                              "minNumIncidents": min_num_incidents})
                elif i[1] == 1571:
                    min_num_features = i[2].split(":")[1].split(" ")[10]
                    # dataType = i[2].split(":")[1].split(" ")[11]
                    LOGGER.error(1571, extra={"message_ID": 1571,
                                              "minNumFeatures": min_num_features})
                elif i[1] == 1574:
                    min_num_incidents = i[2].split(":")[1].split(" ")[-8]
                    LOGGER.error(1574, extra={"message_ID": 1574, 
                                              "minNumIncidents": min_num_incidents})
                elif i[1] == 641:
                    min_features = i[2].split(":")[1].split(" ")[-4]
                    LOGGER.error(641, extra={"message_ID": 641,
                                             "numFeatures": min_features})
                elif i[1] in ERROR_ID:
                    LOGGER.error(i[1], extra={"message_ID": i[1]})
            raise ToolExit

        # Get processing messages
        process_info = []
        for i in agol_messages:
            if "messageCode" in i:
                if not process_info:
                    intro = '{"messageCode": "SS_00004", "message": "The following report outlines the workflow used to optimize your Find Outliers result:", "params": {}, "style": "<b></b><br/>"}'
                    process_info.append(intro)
                process_info.append(i)
        self.process_info = process_info

        # When useChordal, outenv is set to GCS, so project the output back to PCS
        if spatial_ref.PCSCode == 102100 or spatial_ref.PCSCode == 3857:
            if self.orig_cxt_sr is not None:
                arcpy.env.outputCoordinateSystem = self.orig_cxt_sr  # type: ignore
            else:
                arcpy.env.outputCoordinateSystem = spatial_ref  # type: ignore
            arcpy.gp._arc_object.SimpleCopy(output_path, self.output_layer.data)
            arcpy.management.Delete(output_path)

        # Create feature service layer for output parameter
        self.out_layer_popupInfo = self.get_popup_content()

    def get_popup_content(self):
        '''Creates appropriate popup content'''
        # create popup content for count always
        ooa_popup_info = PopupInfo("Find Outliers Summary")
        uid = self.output_layer.oidFieldName
        if uid.upper() == "OID":
            uid = "objectid"
        ooa_popup_info.add_field_info(uid, "ID")
        fields2check = [self.analysis_field]
        if self.divided_by_field:
            fields2check.append(self.divided_by_field)
        duplicate_map = duplicate_reserved_fields(self.output_layer.data, fields2check)

        if self.has_analysis_field:
            ooa_popup_info.add_field_info(duplicate_map[self.analysis_field.upper()], self.analysis_field, True)
            divided_alias = u"{} per {} ".format(self.analysis_field_alias, self.divided_by_field_alias)
        else:
            ooa_popup_info.add_field_info("join_count", "Number of Points")
            divided_alias = u"Number of Points per {} ".format(self.divided_by_field_alias)

        if self.divided_by_field:
            if self.divided_by_field.upper() == "ESRIPOPULATION":
                field_list = AOLUtils.list_fields(self.output_layer.data)
                tp_field = FieldUtils.get_newest_fieldname(field_list, "TOTPOP")
                if tp_field:
                    ooa_popup_info.add_field_info(tp_field, "Esri Population", True, places=0)
            else:
                ooa_popup_info.add_field_info(duplicate_map[self.divided_by_field.upper()],
                                             self.divided_by_field_alias,
                                             self.has_analysis_field)
            ooa_popup_info.add_field_info("ss_rate", divided_alias)

        ooa_popup_info.add_field_info("li_text", "Cluster/Outlier Type")
        return ooa_popup_info

    def enrich_layer(self, input_layer: Union[PAFeatureLayer, str]):
        """
        Enrich the input layer with Esri enrichment service
        :param input_layer: the input layer to be enached, either a PAFeatureLayer object or a string to the FeatureClass location
        :return:
        """
        analysis_variables = ["KeyGlobalFacts.TOTPOP"]
        if isinstance(input_layer, str):
            input_layer = PAFeatureLayer(input_layer)

        bf_enrich = AOLUtils.list_fields(input_layer.layer, "TOTPOP*")
        executor = GeoEnrichExecutor(input_layer=input_layer, ge_service_url=self.service_url,
                                     token=self.entoken, referer=self.referer, analysis_vars=analysis_variables,
                                     data_collections=[], distance=None,
                                     output_wkspc=self.output_wkspc, src_country="", buffer_type="",
                                     units="", return_bounds=False, lang_code="en")

        if not executor.validate_parameters():
            raise SystemExit()
        executor.execute()
        enriched_layer = executor.output_layer.data

        af_enrich = AOLUtils.list_fields(enriched_layer, "TOTPOP*")
        bf_field = [b.name for b in bf_enrich]
        af_field = [a.name for a in af_enrich]
        tp_field = [tp for tp in af_field if tp not in bf_field][0]
        return enriched_layer, tp_field
