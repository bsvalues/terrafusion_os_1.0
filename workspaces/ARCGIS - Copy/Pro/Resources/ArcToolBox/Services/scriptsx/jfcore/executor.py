"""JoinFeatures core logic executor."""
# noqa. pylint: disable=import-error
from typing import Optional, List, Dict
import json

import arcpy
import arcpy.management
from .utils import AttributeJoinFeatures, SpatialJoinFeatures, JFUtils

from common import (LogUtils, PAExecutor, PAFeatureLayer,
                    PAOutputFeatureLayer, FieldUtils, ToolExit)

LOGGER = LogUtils.setup_logger(__name__)


class JFExecutor(PAExecutor):
    """Core logic for JoinFeatures tool."""

    def __init__(self, target_layer: PAFeatureLayer, join_layer: PAFeatureLayer,
                 output_layer: PAOutputFeatureLayer, spatial_rel: Optional[str],
                 spatial_rel_dist: Optional[float], spatial_rel_dist_units: Optional[str],
                 attr_rel: Optional[List], join_operation: str,
                 summary_fields: Optional[List],
                 record_to_match: Optional[Dict],
                 join_type: str = "INNER"):
        """Unpack input parameters and initialize the attributes.

        Args:
            target_layer: a PAFeatureLayer object which represents the target table to join to.
            join_layer: a PAFeatureLayer object which represents the table to join to the target.
            output_layer: a PAOutputFeatureLayer object that will keep the joined output.
            spatial_rel: a string represents the spatial join relationship (i.e., intersects).
            spatial_rel_dist: a float represents the distance of certain type of spatial relationship (i.e, within).
            spatial_rel_dist_units: units of the spatial_rel_dist value.
            attr_rel: a list of dict represents the field of match (i.e., {"targetField":"COLOR","operator":"equal","joinField":"COLOR"}).
            summary_fields: a list of dict where each item represents the summary information of a certain field
            (i.e., {"onStatisticField":"Value","statisticType":"SUM"}).
            record_to_match: a dict shows the record to keep information for one-to-one join.
            join_type: a string represents the type of join between target and join. Currently only supports INNER
            and LEFT.

        """
        with arcpy.EnvManager(qualifiedFieldNames=False):
            self.target_layer = JFUtils.preprocess_input(target_layer, "targetLayer", attr_rel, True)
            self.join_layer = JFUtils.preprocess_input(join_layer, "JoinLayer", attr_rel, False)
        LOGGER.debug("Input layers have been preprocessed.")
        arcpy.env.extent = None  # type: ignore
        LOGGER.debug("Set the arcpy.env.extent to None.")
        self.join_output = output_layer
        self.spatial_rel = spatial_rel
        self.spatial_rel_dist = spatial_rel_dist
        self.spatial_rel_dist_units = spatial_rel_dist_units
        self.attribute_rel = attr_rel
        self.join_operation = join_operation
        if summary_fields:
            tot_sitem = len(summary_fields)
            idx = 0
            while idx < tot_sitem:
                sfi = summary_fields[idx]
                if sfi.get("statisticType", "").upper() == "COUNT":
                    # pop the count stat since it will be calculated by default with other stats
                    if tot_sitem > 1:
                        summary_fields.remove(sfi)
                        break
                    else:
                        summary_fields[idx]["onStatisticField"] = self.join_layer.OIDFieldName
                idx += 1
        self.summary_fields = summary_fields
        self.record_to_match = record_to_match
        self.join_type = join_type
        self.mapped_geom_fields = None

    def validate_parameters(self) -> bool:
        """Validate input parameters."""
        if not self.spatial_rel and not self.attribute_rel:
            LOGGER.error(100221, extra={"message_ID": 100221})
            return False

        if self.spatial_rel:
            if self.target_layer.is_table_view or self.target_layer.is_table_view:
                LOGGER.error(100222, extra={"message_ID": 100222})
                return False

        if self.spatial_rel == "withindistance":
            if not self.spatial_rel_dist or not self.spatial_rel_dist_units:
                LOGGER.error(100244, extra={"message_ID": 100244})
                return False
            if self.spatial_rel_dist < 0:
                LOGGER.error(100044, extra={"message_ID": 100044})
                return False

        if self.summary_fields:
            self.mapped_geom_fields = FieldUtils.replace_geom_vf(self.summary_fields,
                                                                 self.join_layer)
            LOGGER.debug(f"summary_fields after replacing geometry VF: {self.summary_fields}")
            spa_base_join = (self.spatial_rel is not None) and (self.spatial_rel.strip() != "")
            if not FieldUtils.verify_summary_fields(self.join_layer.fields,
                                                    self.summary_fields,
                                                    update_st=False,
                                                    spatial_rel=spa_base_join):
                return False

        if self.attribute_rel:
            target_fields = self.target_layer.fields
            join_fields = self.join_layer.fields
            try:
                for arel in self.attribute_rel:
                    tfield = arel["targetField"]
                    jfield = arel["joinField"]
                    tfield_obj = FieldUtils.get_field_by_name(target_fields, tfield)
                    jfield_obj = FieldUtils.get_field_by_name(join_fields, jfield)
                    if tfield_obj is None:
                        LOGGER.error(100052, extra={"message_ID": 100052, "fieldName": tfield,
                                                    "paramName": self.target_layer.layer_name})
                        return False
                    elif tfield_obj.type == "OID":
                        LOGGER.error(100290, extra={"message_ID": 100290})
                        return False

                    if jfield_obj is None:
                        LOGGER.error(100052, extra={"message_ID": 100052, "fieldName": jfield,
                                                    "paramName": self.join_layer.layer_name})
                        return False
                    elif jfield_obj.type == "OID":
                        LOGGER.error(100290, extra={"message_ID": 100290})
                        return False
            except KeyError as kerr:
                LOGGER.error(100053, extra={"message_ID": 100053,
                                            "expression": json.dumps(arel, ensure_ascii=False),  # type: ignore
                                            "missingKeys": str(kerr)})
                return False
            except Exception:  # noqa. pylint: disable=bare-except
                LOGGER.error(100245, extra={"message_ID": 100245,
                                            "paramName": "attributeRelationship"})
                return False

        return True

    def execute(self):
        """Execute the core logic."""
        if self.attribute_rel:
            LOGGER.debug("Join by attribute.")
            jf_handler = AttributeJoinFeatures(self.target_layer,
                                               self.join_layer,
                                               self.join_output,
                                               join_operation=self.join_operation,
                                               summary_fields=self.summary_fields,  # type: ignore
                                               record_to_match=self.record_to_match,
                                               attribute_rel=self.attribute_rel,  # type: ignore
                                               spatial_rel=self.spatial_rel,  # type: ignore
                                               spatial_rel_dist=self.spatial_rel_dist,  # type: ignore
                                               spatial_rel_dist_units=self.spatial_rel_dist_units,  # type: ignore
                                               join_type=self.join_type,
                                               mapped_geom_fields=self.mapped_geom_fields)
        else:
            LOGGER.debug("Join by spatial relationship.")
            if not self.spatial_rel:
                LOGGER.debug("spatial_rel can't be empty for spatial join.")
                raise ToolExit
            jf_handler = SpatialJoinFeatures(self.target_layer,
                                             self.join_layer,
                                             self.join_output,
                                             join_operation=self.join_operation,
                                             spatial_rel=self.spatial_rel,
                                             summary_fields=self.summary_fields,  # type: ignore
                                             spatial_rel_dist=self.spatial_rel_dist,  # type: ignore
                                             spatial_rel_dist_units=self.spatial_rel_dist_units,  # type: ignore
                                             join_type=self.join_type,
                                             mapped_geom_fields=self.mapped_geom_fields)
        jf_handler.join()

        if jf_handler.interm_count_field:
            LOGGER.debug(f"interm_count_field: {jf_handler.interm_count_field}")
            if FieldUtils.verify_field_exists(self.join_output, jf_handler.interm_count_field):
                arcpy.management.DeleteField(self.join_output.data, jf_handler.interm_count_field)
            else:
                LOGGER.debug(f"{jf_handler.interm_count_field} does not exist in join output.")
