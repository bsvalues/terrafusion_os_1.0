"""FindSimilarLocations core logic executor."""
# import from common package. noqa. pylint: disable=import-error
import os
from typing import List, Union, Dict

import arcpy
import arcpy.management
import Similarity as SIM
import SSDataObject as SSDO
import SSUtilities as UTILS

from common import (LogUtils, PAExecutor, PAFeatureLayer, PAOutputFeatureLayer,
                    FieldUtils, ToolExit, AOLUtils, PortalUtils, FQ_FIELD_NAMES)


LOGGER = LogUtils.setup_logger(__name__)
SIMILAR_TYPE = "MOST_SIMILAR"
MATCH_METHOD = "ATTRIBUTE_VALUES"
COLLAPSE_TO_PNTS = False


class FSLExecutor(PAExecutor):
    """Executor of FindSimilarLocations."""

    def __init__(
        self,
        input_layer: PAFeatureLayer,
        search_layer: PAFeatureLayer,
        output_layer: PAOutputFeatureLayer,
        analysis_fields: List[str],
        criteria_fields: Union[List[Dict], arcpy.ValueTable],
        input_query: str,
        number_results: int,
        error_ids: List[int]
    ):
        self.input_layer = input_layer
        self.search_layer = search_layer
        self.output_layer = output_layer
        run_in_portal = PortalUtils.is_portal_env()
        if run_in_portal and analysis_fields:
            self.analysis_fields = self._prep_fq_fields(analysis_fields, False)
        else:
            self.analysis_fields = analysis_fields
        LOGGER.debug(f"{self.analysis_fields=}")
        if run_in_portal and criteria_fields:
            self.criteria_fields = self._prep_fq_fields(criteria_fields, True)
        else:
            self.criteria_fields = criteria_fields
        LOGGER.debug(f"{self.criteria_fields=}")
        self.input_query = input_query
        self.number_results = number_results
        self.error_ids = error_ids
        self.process_info = []

    def _prep_fq_fields(
            self,
            fields_to_proc: Union[List[str], arcpy.ValueTable, List[Dict]],
            is_criteria_fields: bool
    ) -> List:
        """Preprocess the fully qualified fields."""
        process_fields = []
        search_lyr_fields = {}
        input_lyr_fields = {}
        if is_criteria_fields:
            ref_flds = []
            cand_flds = []
            if isinstance(fields_to_proc, arcpy.ValueTable):
                for row in fields_to_proc.value:
                    (ref_field, cand_field) = row
                    ref_flds.append(ref_field)
                    cand_flds.append(cand_field)
            else:
                for fld in fields_to_proc:
                    ref_flds.append(fld["referenceField"])
                    cand_flds.append(fld["candidateField"])
            LOGGER.debug(f"{ref_flds=} {cand_flds=}")
            for ref_field, cand_field in zip(ref_flds, cand_flds):
                if ref_field.upper() in FQ_FIELD_NAMES:
                    if not input_lyr_fields:
                        input_lyr_fields = {f.name.upper(): f.name for f in arcpy.Describe(self.input_layer.layer).fields}
                    ref_field = FieldUtils.correct_fq_name(ref_field, input_lyr_fields, True)
                    
                if cand_field.upper() in FQ_FIELD_NAMES:
                    if not search_lyr_fields:
                        search_lyr_fields = {f.name.upper(): f.name for f in arcpy.Describe(self.search_layer.layer).fields}
                    cand_field = FieldUtils.correct_fq_name(cand_field, search_lyr_fields, True)
                process_fields.append({"referenceField": ref_field, "candidateField": cand_field})
        else:
            for fld in fields_to_proc:
                if fld.upper() in FQ_FIELD_NAMES:
                    if not search_lyr_fields:
                        search_lyr_fields = {f.name.upper(): f.name for f in arcpy.Describe(self.search_layer.layer).fields}
                    process_fields.append(FieldUtils.correct_fq_name(fld, search_lyr_fields, True))
                else:
                    process_fields.append(fld)
        return process_fields

    def validate_parameters(self) -> bool:
        """Check if the input parameters are valid."""
        for afield in self.analysis_fields:
            if not FieldUtils.verify_field_exists(self.search_layer.layer, afield):
                LOGGER.error(100052, extra={"message_ID": 100052,
                                            "add_argument1": afield,
                                            "add_argument2": self.search_layer.layer_name})
                return False
        self.analysis_fields = [afield.upper() for afield in self.analysis_fields]
        return True

    def _pull_process_info(self, msgs: List):
        """Pull the process information."""
        for msg in msgs:
            # LOGGER.debug(f"msg: {msg}")
            if "messageCode" in msg:
                if not self.process_info:
                    intro = '{"messageCode": "SS_00003", "message": "The following report outlines the summary of your Find Similar Locations result:", "params": {}, "style": "<b></b><br></br>"}'
                    self.process_info.append(intro)
                self.process_info.append(msg)

    def _execute(self):
        """Execute the core logic"""
        scratch_features = os.path.join(AOLUtils.get_scratch_wkspc(), "SimilarOutput")

        explicit_sr = SIM.getOutputSpatialRef(self.input_layer.layer,
                                              self.search_layer.layer,
                                              scratch_features)

        ssdo_base = SSDO.SSDataObject(self.input_layer.layer, useChordal=False,
                                      explicitSpatialRef=explicit_sr)
        self.ssdo_base = ssdo_base
        ssdo_cand = SSDO.SSDataObject(self.search_layer.layer, useChordal=False,
                                      explicitSpatialRef=explicit_sr)
        self.ssdo_cand = ssdo_cand

        use_criteria_fields = False
        LOGGER.debug(f"criteria fields: {self.criteria_fields}")
        if self.criteria_fields:
            analysis_field_tmp = []
            if isinstance(self.criteria_fields, arcpy.ValueTable):
                for row in self.criteria_fields.value:
                    analysis_field_tmp.append(row[0])
                    analysis_field_tmp.append(row[1])
            else:
                use_criteria_fields = True
                for item in self.criteria_fields:
                    # ref_field = item.get('referenceField')
                    # cand_field = item.get('candidateField')
                    
                    # ref field is base field
                    # ref_field_upper = ref_field.upper()
                    # cand_field_upper = cand_field.upper()
                    ref_field_upper = item['referenceField'].upper()
                    cand_field_upper = item['candidateField'].upper()
                    analysis_field_tmp.append(ref_field_upper)
                    analysis_field_tmp.append(cand_field_upper)

            self.analysis_fields = analysis_field_tmp
        elif not self.analysis_fields:
            LOGGER.error(1585, extra={"message_ID": 1585}) ## Error num needs to be changed!!!
            raise SystemExit()
            
        append_flds = []
        if use_criteria_fields:
            fld_names, bad_input_names = self._criteria_validation()
        else:
            fld_names, append_base, bad_input_names = SIM.fieldValidation(ssdo_base, ssdo_cand,
                                                                          self.analysis_fields,
                                                                          append_flds, 
                                                                          useCriteria=use_criteria_fields)
        
        # Warn About Excluded Fields
        if bad_input_names:
            LOGGER.warning(1584, extra={"message_ID": 1584,
                                        "add_argument1": ", ".join(bad_input_names)})

        # No Valid Fields Found
        if not fld_names:
            LOGGER.error(1585, extra={"message_ID": 1585})
            raise SystemExit()

        # Runtime Check for Cosign Sim (In Class as Well for Variance)
        ## Never happens: Match Method is always ATTRIBUTE_VALUES ##
        if len(fld_names) == 1 and MATCH_METHOD == 'ATTRIBUTE_PROFILES':
            LOGGER.error(1598, extra={"message_ID": 1598})
            raise SystemExit()

        if use_criteria_fields:            
            all_field_names_base = [fld_names[i] for i in range(len(fld_names)) if i % 2 == 0]
            all_field_names_cand = [fld_names[i] for i in range(len(fld_names)) if i % 2 == 1]
        else:
            all_field_names_base = fld_names + append_base
            all_field_names_cand = fld_names + append_flds

        ssdo_base.obtainData(ssdo_base.oidName, all_field_names_base,
                             explicitBadRecordID=1615)

        if ssdo_base.numObs == 0:
            LOGGER.error(1599, extra={"message_ID": 1599})
            raise SystemExit()

        ssdo_cand.obtainData(ssdo_cand.oidName, all_field_names_cand,
                             explicitBadRecordID=1616)

        if ssdo_cand.numObs <= 2:
            LOGGER.error(1589, extra={"message_ID": 1589})
            raise SystemExit()

        if use_criteria_fields:
            base_field_names = all_field_names_base
        else:
            base_field_names = None

        ss_obj = SIM.SimilaritySearch(ssdo_base, ssdo_cand, all_field_names_cand,
                                      similarType=SIMILAR_TYPE,
                                      matchMethod=MATCH_METHOD,
                                      numResults=self.number_results,
                                      appendFields=all_field_names_cand,
                                      baseFieldNames=base_field_names)

        ss_obj.report(agol_format=True)
        report_msgs = ss_obj.agol_msgs
        base_is_point = UTILS.renderType[ssdo_base.shapeType.upper()] == 0  # type: ignore
        base_cand_diff = ssdo_base.shapeType.upper() != ssdo_cand.shapeType.upper()  # type: ignore

        if COLLAPSE_TO_PNTS or base_is_point or base_cand_diff:
            #ss_obj.createOutput(self.output_layer.data)
            if use_criteria_fields:
                ss_obj.createOutputAGOL(self.output_layer.data)
            else:
                ss_obj.createOutput(self.output_layer.data)
        else:
            if use_criteria_fields:
                ss_obj.createOutputShapesAGOL(self.output_layer.data)
            else:
                ss_obj.createOutputShapes(self.output_layer.data)

        self._pull_process_info(report_msgs)

    def execute(self):
        """Overwrite the execute function."""
        # Initialize DataObjects
        # set up workspace
        LogUtils.reconfig_ss_logger()
        try:
            self._execute()
        except Exception as err:
            all_msgs = arcpy.gp.GetAllMessages()  # type: ignore
            no_variance = ""
            for msg in all_msgs:
                if msg[1] == 1584:
                    LOGGER.error(100088, extra={"message_ID": 100088,
                                                "attribute": msg[2].split(":")[2].strip(".")})
                elif msg[1] == 1588:
                    no_variance = msg[2].split(":")[2]
                elif msg[1] == 728:
                    LOGGER.error(100052, extra={"message_ID": 100052,
                                                "fieldName": msg[2].split(":")[1].split(" ")[2],
                                                "paramName": self.input_layer.layer_name})
                elif msg[1] == 1585:
                    LOGGER.error(100089, extra={"message_ID": 100089, "attribute": no_variance})
                elif msg[1] == 735:
                    LOGGER.error(735, extra={"message_ID": 735})
                elif msg[1] == 1589:
                    LOGGER.error(100090, extra={"message_ID": 100090})
                elif msg[1] == 1599:
                    LOGGER.error(1599, extra={"message_ID": 1599})
                elif msg[1] in self.error_ids:
                    try:
                        LOGGER.error(msg[1], extra={"message_ID": msg[1]})
                    except KeyError:
                        LOGGER.debug(f"Unable to find error: {msg[1]}.")
            raise ToolExit from err
        
    def _criteria_validation(self):
        out_field_names = []
        bad_input_names = []

        numeric_types = ["LONG", "DOUBLE", "INTEGER", "FLOAT", "SINGLE", "SHORT", "SMALLINTEGER"]
        for i in range(0, len(self.analysis_fields), 2):
            base_field_name = self.analysis_fields[i]
            cand_field_name = self.analysis_fields[i + 1]
            try:
                base_field = self.ssdo_base.allFields[base_field_name]
                base_type = base_field.type.upper()
                cand_field = self.ssdo_cand.allFields[cand_field_name]
                cand_type = cand_field.type.upper()
                if cand_type == base_type or (cand_type in numeric_types and base_type in numeric_types) :
                    out_field_names.append(base_field_name)
                    out_field_names.append(cand_field_name)
                else:
                    bad_input_names.append(base_field_name)
                    bad_input_names.append(cand_field_name)
            except:
                bad_input_names.append(base_field_name)
                bad_input_names.append(cand_field_name)

        return out_field_names, bad_input_names

