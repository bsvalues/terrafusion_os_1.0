"""Core logic of DissolveBoundaries."""
from typing import List, Optional, Union, Dict
import os

import arcpy
import arcpy.management
import arcpy.analysis

from common import (LogUtils, PAExecutor, PAFeatureLayer, PAOutputFeatureLayer,
                    FieldUtils, AOLUtils, PortalUtils)


LOGGER = LogUtils.setup_logger(__name__)


class DBExecutor(PAExecutor):
    """Core logic of the DissolveBoundaries tool."""
    def __init__(
        self,
        input_lyr: PAFeatureLayer,
        dissolve_fields: Optional[List],
        summary_fields: Optional[Union[List, arcpy.ValueTable]],
        part_features: bool,
        output_lyr: PAOutputFeatureLayer,
        area_units: str
    ):
        """Core logic of the dissolveBoundaries.

        Args:
            input_lyr (PAFeatureLayer): the layer containing polygon features that will be dissolved.
            dissolve_fields (Optional[List]): one or more fields on the inputLayer that control
            which polygons are merged.
            summary_fields (Optional[List]): a list of field names and statistical summary type that
            the users wish to calculate from the polygons that are dissolved together.
            part_features (bool): specifies whether multipart features (i.e. features which share
            a common attribute table but are not visibly connected) are allowed in the output
            feature class.
            output_lyr (PAOutputFeatureLayer): an instance of PAOutputFeatureLayer to host the output.
            portal_description (Optional[ImmutableDict]): portal self description used to fetch the unit.
        """
        self.input_lyr = input_lyr
        self.dissolve_fields = [] if dissolve_fields else None
        fld_lu = {}
        run_in_enterp = False
        if summary_fields or dissolve_fields:
            run_in_enterp = PortalUtils.is_portal_env()
            if run_in_enterp:
                fld_lu = {f.name.upper(): f.name for f in arcpy.ListFields(self.input_lyr.layer)}

        if dissolve_fields:
            if isinstance(dissolve_fields, arcpy.ValueTable):
                for i in range(dissolve_fields.rowCount):
                    dfname = dissolve_fields.getValue(i, 0)
                    self.dissolve_fields.append(FieldUtils.correct_fq_name(dfname, fld_lu, run_in_enterp))
            else:
                for dfield in dissolve_fields:
                    dfld = str(dfield) if not isinstance(dfield, str) else dfield
                    self.dissolve_fields.append(FieldUtils.correct_fq_name(dfld, fld_lu, run_in_enterp))

        # correct the summary stat type
        if summary_fields and isinstance(summary_fields, list):
            self.summary_fields = []
            for sum_fld in summary_fields:
                tmp_sum_info = sum_fld.split(" ")
                tmp_sum_info[1] = "STD" if tmp_sum_info[1].upper() == "STDDEV" else tmp_sum_info[1].upper()
                n2u = FieldUtils.correct_fq_name(tmp_sum_info[0], fld_lu, run_in_enterp)
                self.summary_fields.append(f"{n2u} {tmp_sum_info[1]}")
        elif summary_fields and isinstance(summary_fields, arcpy.ValueTable):
            self.summary_fields = []
            for row in range(summary_fields.rowCount):
                fname = summary_fields.getValue(row, 0)
                stype = summary_fields.getValue(row, 1).upper()  # type: ignore
                if stype == "STDDEV":
                    stype = "STD"
                n2u = FieldUtils.correct_fq_name(fname, fld_lu, run_in_enterp)
                self.summary_fields.append(f"{n2u} {stype}")
        else:
            self.summary_fields = None

        self.output_lyr = output_lyr
        self.mp_features = "MULTI_PART" if part_features else "SINGLE_PART"
        self.area_units = area_units

    def validate_parameters(self) -> bool:
        if self.input_lyr.shapeType != "Polygon":
            LOGGER.error(100003, extra={"message_ID": 100003})
            return False
        if self.summary_fields:
            input_fields = {fld.name.lower(): fld.type for fld in arcpy.ListFields(self.input_lyr.layer)}
            for sfld in self.summary_fields:
                sf_name = sfld.split(" ")[0]
                if sf_name.lower() not in input_fields:
                    LOGGER.error(100004, extra={"message_ID": 100004, "fieldName": sf_name})
                    return False
                elif input_fields[sf_name.lower()] in ["DateOnly", "TimeOnly", "TimestampOffset"]:
                    LOGGER.error(100355, extra={"message_ID": 100355})
                    return False

        return True

    def _dissolve(self):
        """Perform the dissolve operation."""
        count_stat = f"{self.input_lyr.OIDFieldName} COUNT"
        sj_output = False
        # Currently unable to calculate meaningful statistics for this scenario.
        # Only calculate the count.
        if self.mp_features == "SINGLE_PART" and not self.dissolve_fields:
            tmp_out_features = AOLUtils.create_unique_name("temp_diss_output",
                                                           os.path.dirname(self.output_lyr.data))
            arcpy.analysis.PairwiseDissolve(self.input_lyr.layer, tmp_out_features,
                                            self.dissolve_fields, count_stat,
                                            self.mp_features)
            field_mappings = arcpy.FieldMappings()
            field_mappings.addTable(tmp_out_features)
            try:
                with arcpy.EnvManager(extent=None):
                    arcpy.analysis.SpatialJoin(tmp_out_features, self.input_lyr.layer,
                                               self.output_lyr.data, "#", "#",
                                               field_mappings, "LARGEST_OVERLAP")
                LOGGER.debug("SpatialJoin complete.")
                # Delete the Count_* field and TARGET_FID
                fields_to_remove = [fld.name for fld in self.output_lyr.fields  # type: ignore
                                    if fld.name.lower().startswith("count_") or fld.name.upper() == "TARGET_FID"]
                LOGGER.debug(f"fields_to_remove: {fields_to_remove}")
                arcpy.management.DeleteField(self.output_lyr.data, fields_to_remove)
                sj_output = True
            except arcpy.ExecuteError:
                # Use the output from dissolve if spatial join failed.
                LOGGER.debug("Unable to calculate count via spatial join.")
                self.output_lyr.data = tmp_out_features
        else:
            if self.summary_fields:
                geom_fields_rep = FieldUtils.replace_geom_vf(self.summary_fields, self.input_lyr)
            else:
                geom_fields_rep = None
            dis_sum_fields = [count_stat] + self.summary_fields if self.summary_fields else [count_stat]
            # arcpy.analysis.PairwiseDissolve(self.input_lyr.layer,
            #                                 self.output_lyr.data,
            #                                 self.dissolve_fields,
            #                                 ";".join(dis_sum_fields),
            #                                 self.mp_features)
            arcpy.management.Dissolve(self.input_lyr.layer,
                                      self.output_lyr.data,
                                      self.dissolve_fields,
                                      ";".join(dis_sum_fields),
                                      self.mp_features)
            # update the fields in the result
            if geom_fields_rep:
                for dsumfield in dis_sum_fields:
                    tmp_fld_info = dsumfield.split(" ")
                    if tmp_fld_info[0].upper() in geom_fields_rep:
                        curr_fname = f"{tmp_fld_info[1]}_{tmp_fld_info[0]}"
                        curr_fname = curr_fname.replace("(", "_").replace(")", "_")
                        if FieldUtils.verify_field_exists(self.output_lyr.data, curr_fname):
                            new_fname = geom_fields_rep[tmp_fld_info[0].upper()].replace("(", "_").replace(")", "_")
                            arcpy.management.AlterField(self.output_lyr.data,
                                                        curr_fname,
                                                        f"{tmp_fld_info[1]}_{new_fname}",
                                                        f"{tmp_fld_info[1]} {new_fname}")
        self._alter_count_field(sj_output)

    def _alter_count_field(self, spatial_join_output: bool):
        """Alter the count field in the output.

        Args:
            spatial_join_output (bool): True if the output is from the spatialJoin and False otherwise.
        """
        try:
            wild_card = "COUNT_*" if not spatial_join_output else "Join_Count"
            count_field = AOLUtils.list_fields(self.output_lyr.data, wild_card)[0].name
            LOGGER.debug(f"count_field identified as {count_field}")
            arcpy.management.AlterField(self.output_lyr.data, count_field, "Count", "Count")
        except (IndexError, arcpy.ExecuteError) as err:
            LOGGER.debug(f"Unable to alter the count field due to {str(err)}")

    def execute(self):
        self._dissolve()
