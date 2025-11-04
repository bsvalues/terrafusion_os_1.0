"""SummarizeCenterAndDispersion core logic executor."""
# Update sys.path dynamically. pylint: disable=C0411, C0413
# Use the setattr and __slots__. Disable missing attribute. pylint: disable=E1101
import arcpy
from common import LogUtils, PAExecutor, PAFeatureLayer, PAOutputFeatureLayer, FieldUtils, FQ_FIELD_NAMES, PortalUtils
import SSDataObject as SSDO
import CentralFeature as CF
import MeanCenter as MEANCENT
import MedianCenter as MEDCENT
import StandardEllipse as SE
import os

import arcpy.management


LOGGER = LogUtils.setup_logger(__name__)


class SCDExecutor(PAExecutor):
    def __init__(self, input_layer: PAFeatureLayer, summarize_type: str, ellipse_size: str,
                 weight_field: str, group_field: str, output_layer: list[PAOutputFeatureLayer]):
        self.input_layer = input_layer.layer
        self.output_layer = output_layer
        self.summarize_type = summarize_type
        self.ellipse_size = ellipse_size
        is_in_portal = PortalUtils.is_portal_env()
        weight_field = weight_field if isinstance(weight_field, str) or weight_field is None else str(weight_field)
        group_field = group_field if isinstance(group_field, str) or group_field is None else str(group_field)
        fld_maps = {}
        if is_in_portal and weight_field and weight_field.upper() in FQ_FIELD_NAMES:
            fld_maps = {f.name.upper(): f.name for f in arcpy.Describe(input_layer.layer).fields}
            self.weight_field = FieldUtils.correct_fq_name(weight_field, fld_maps, True)
        else:
            self.weight_field = weight_field
        if is_in_portal and group_field and group_field.upper() in FQ_FIELD_NAMES:
            if not fld_maps:
               fld_maps = {f.name.upper(): f.name for f in arcpy.Describe(input_layer.layer).fields}
            self.group_field = FieldUtils.correct_fq_name(group_field, fld_maps, True)
        else:
            self.group_field = group_field
        self.sum_type_list = []

    def execute(self):
        sum_type_dict = {"CentralFeature": False, "MeanCenter": False, 
                         "MedianCenter": False, "Ellipse": False}
        for sum_type, sum_bool in sum_type_dict.items():
            if sum_type in self.summarize_type:
                sum_type_dict[sum_type] = True

        # The size of output ellipses in standard deviations.
        ellipse_size = self.ellipse_size
        if not ellipse_size:
            ellipse_size = "1 standard deviation"

        field_list = []

        # Add weight to the field_list
        if self.weight_field:
            self.weight_field = self.weight_field.upper()
            field_list.append(self.weight_field)

        # Add weight to the field_list
        if self.group_field:
            self.group_field = self.group_field.upper()
            field_list.append(self.group_field)

        arcpy.env.extent = None  # type: ignore
        output_path = ""
        LogUtils.reconfig_ss_logger()

        ssdo = SSDO.SSDataObject(self.input_layer, useChordal=False)
        if ssdo.shapeType == "Point":
            ssdo.obtainData(fields = field_list)
        else:
            ssdo.obtainData(fields = field_list, requireGeometry= True)

        i = 0
        for sum_type, sum_bool in sum_type_dict.items():
            if sum_bool:
                output_path = self.output_layer[i].data
                i += 1
                ssdo.newFieldTypeChecker.addOutput(output_path)
                LOGGER.debug(u"{0} output path {1}".format(sum_type, output_path))
                self.sum_type_list.append(sum_type)
                try:
                    if sum_type == 'CentralFeature':
                        result = CF.CentralFeature(ssdo=ssdo, weightField=self.weight_field, 
                                        caseField=self.group_field, fromAGOL=True)
                    elif sum_type == 'MeanCenter':
                        result = MEANCENT.MeanCenter(ssdo=ssdo, weightField=self.weight_field,
                                        caseField=self.group_field, fromAGOL=True)
                    elif sum_type == 'MedianCenter':
                        result = MEDCENT.MedianCenter(ssdo=ssdo, weightField=self.weight_field,
                                        caseField=self.group_field, fromAGOL=True)
                    else:
                        org_zflag = ssdo.zFlag
                        ssdo.zFlag = "DISABLED"
                        result = SE.StandardEllipse(ssdo=ssdo, weightField=self.weight_field,
                                        caseField=self.group_field, 
                                        stdDeviations=int(ellipse_size[0]), fromAGOL=True)
                        ssdo.zFlag = org_zflag

                    result.createOutput(output_path)
                    fields = arcpy.Describe(output_path).fields
                    hpd_flds = []
                    for fld in fields:
                        if fld.type == "Date" and fld.precision == 1:
                            hpd_flds.append(fld.name)
                    if hpd_flds:
                        arcpy.management.MigrateDateFieldToHighPrecision(output_path,
                                                                         hpd_flds)
                        LOGGER.debug(f"Migrate {output_path}'s {hpd_flds} to high precision date.")

                except SystemExit as err:
                    raise arcpy.ExecuteError

    def validate_parameters(self) -> bool:
        valid_sum_types = {'CentralFeature', 'MeanCenter', 'MedianCenter', 'Ellipse'}
        for input_sum_type in self.summarize_type:
            if not input_sum_type in valid_sum_types:
                return False
            
            if input_sum_type == 'Ellipse':
                if self.ellipse_size:
                    ellSize = int(self.ellipse_size[0])
                    if ellSize < 1 or ellSize > 3:
                        return False

        if self.weight_field:
            if not FieldUtils.verify_field_exists(self.input_layer, self.weight_field):
                LOGGER.error(898, extra={"message_ID": 898})
                return False
            else:
                if not FieldUtils.verify_field_exists(self.input_layer, self.weight_field,
                                     field_types=["Double", "Integer", "Single", "SmallInteger"]):
                    LOGGER.error(308, extra={"message_ID": 308})
                    return False

        return True