"""MergeLayers core logic executor."""
# noqa. pylint: disable=import-error
from re import match
from typing import Optional, Union, List, Dict
import json

import arcpy

from common import (PAExecutor, PAFeatureLayer, PAOutputFeatureLayer,
                    PAFeatureLayerCollection, ToolExit, LogUtils,
                    FieldUtils, AOLUtils, FQ_FIELD_NAMES, PortalUtils)


LOGGER = LogUtils.setup_logger(__name__)


class MLExecutor(PAExecutor):
    """Executor of MergeLayers tool."""

    def __init__(
        self,
        input_layer: PAFeatureLayer,
        merge_layers: PAFeatureLayerCollection,
        merge_attributes: Optional[Union[str, List]],
        merged_output: PAOutputFeatureLayer
    ):
        """Set up the initial properties."""
        self.input_layer = input_layer
        self.merge_layer_coll = merge_layers
        self.merge_attributes = merge_attributes
        self.merge_output = merged_output

    def validate_parameters(self) -> bool:
        """Check if the input parameters are valid.

        Args:
            No arguments.
        Returns:
            No returns. After the validate_parameters, merge_layer_coll attribute is always an instance of
            PAFeatureLayerCollection but merge_layer property will always be None.
        Raises:
            ToolExit if both merge_layer_coll and merge_layer are empty.

        """
        self.merge_attributes = self.validate_merging_attributes()  # noqa. pylint: disable=assignment-from-none

        if not self.merge_layer_coll:
            LOGGER.error(100377, extra={"message_ID": 100377})
            return False

        # Check if the geometry type match
        for lyr in self.merge_layer_coll.data:
            if lyr.shapeType != self.input_layer.shapeType:
                LOGGER.error(100301, extra={"message_ID": 100301})
                return False

        return True

    def validate_merging_attributes(self) -> Optional[List]:
        """Validate the mergingAttributes input.

        Returns:
            If self.merge_attributes is None, then return it as it is. Otherwise, format it properly as a json.
        Raises:
            ToolExit if the merge_attributes do not match with the other inputs.

        """
        if not self.merge_attributes:
            return None

        if isinstance(self.merge_attributes, str):
            merge_attributes = self.merge_attributes.split(";")
            new_merge_attributes = []
            is_valid_attr = True
            for mattr in merge_attributes:
                attr_item = mattr.strip().strip("'").split(" ")
                LOGGER.debug("attr_item: {}".format(attr_item))
                if len(attr_item) == 3:
                    if (
                        attr_item[1].lower() not in ["match", "rename"]
                        and attr_item[1].lower() != "remove"
                        and attr_item[2] != "#"
                    ):
                        is_valid_attr = False
                        break

                    if attr_item[1].lower() == "remove":
                        new_merge_attr = {"mergeLayerField": attr_item[0],
                                          "mergeType": attr_item[1]}
                    else:
                        new_merge_attr = {"mergeLayerField": attr_item[0],
                                          "mergeType": attr_item[1],
                                          "mergeValue": attr_item[2]}
                elif len(attr_item) == 2:
                    if attr_item[1].lower() != "remove":
                        is_valid_attr = False
                        break
                    new_merge_attr = {"mergeLayerField": attr_item[0],
                                      "mergeType": "REMOVE"}
                else:
                    is_valid_attr = False
                    break
                new_merge_attributes.append(new_merge_attr)

            if not is_valid_attr:
                LOGGER.error(100329, extra={"message_ID": 100329})
                raise ToolExit

            merge_attributes = [new_merge_attributes]
        elif isinstance(self.merge_attributes, list):
            merge_attributes = self.merge_attributes
        else:
            LOGGER.error("Unsupported merge attributes.")
            raise ToolExit

        if len(merge_attributes) != len(self.merge_layer_coll.data):
            LOGGER.error(110145, extra={"message_ID": 110145})
            raise ToolExit

        self._validate_ma_field(merge_attributes)
        return merge_attributes

    def _validate_ma_field(self, merge_attributes: List[List]):
        """Check if the field used in merge_attributes are valid.

        Args:
            merge_attributes (List[List]): a list of merge attributes where each
            item in merge_attributes represent the merge attribute of a layer.
        """
        for (lyr_ma, layer) in zip(merge_attributes, self.merge_layer_coll.data):
            attr_cnt = len(lyr_ma)
            r_cnt = 0
            existing_fnames = []
            for i in range(attr_cnt):
                m_attr = lyr_ma[i - r_cnt]
                fname = m_attr.get("mergeLayerField")
                if fname in existing_fnames:
                    LOGGER.error(110351, extra={"message_ID": 110351})
                    raise ValueError
                if fname:
                    existing_fnames.append(fname)
                    if (
                        (m_attr["mergeType"].upper() == "REMOVE"
                         or m_attr["mergeType"].upper() == "RENAME")
                        and not FieldUtils.verify_field_exists(layer, fname)
                    ):
                        LOGGER.warning(110146, extra={"message_ID": 110146,
                                                      "fieldName": fname,
                                                      "layerName": layer.layer_name,
                                                      "mergeAttribute": m_attr.get("mergeType", "")})
                        lyr_ma.pop(i - r_cnt)
                        r_cnt += 1
                    elif m_attr["mergeType"].upper() == "MATCH":
                        if not FieldUtils.verify_field_exists(layer, fname):
                            LOGGER.warning(110146, extra={"message_ID": 110146,
                                                          "fieldName": fname,
                                                          "layerName": layer.layer_name,
                                                          "mergeAttribute": m_attr.get("mergeType", "")})
                            lyr_ma.pop(i - r_cnt)
                            r_cnt += 1
                        else:
                            mfn = m_attr.get("mergeValue")
                            if mfn and not FieldUtils.verify_field_exists(self.input_layer, mfn):
                                LOGGER.warning(110146, extra={"message_ID": 110146,
                                                              "fieldName": mfn,
                                                              "layerName": self.input_layer.layer_name,
                                                              "mergeAttribute": m_attr.get("mergeType", "")})
                                lyr_ma.pop(i - r_cnt)
                                r_cnt += 1

    def get_difflen_strfields(self):
        """Get string fields that have the same name in any of the input_layer and merge_layers but with different
        lengths.

        Args:
            No arguments.
        Returns:
            A dictionary with the name of the string field that exists in input_layer and any of the merge_layers but
            with different field length (field length in input_layer is less than that of the mergeLayer).

        """
        in_fields = AOLUtils.list_fields(self.input_layer.data, field_type="String")
        str_fields = {field.name: field.length for field in in_fields}
        str_fields_difflen = {}

        for merge_layer in self.merge_layer_coll.data:
            tmp_merge_fields = AOLUtils.list_fields(merge_layer.data, field_type="String")
            for tmp_field in tmp_merge_fields:
                if tmp_field.name not in str_fields:
                    str_fields[tmp_field.name] = tmp_field.length
                elif str_fields[tmp_field.name] < tmp_field.length:
                    str_fields[tmp_field.name] = tmp_field.length
                    str_fields_difflen[tmp_field.name] = tmp_field.length

        return str_fields_difflen

    def get_field_names(self, in_table: Union[str, arcpy.FeatureSet, arcpy.RecordSet],
                        exclude_types: List) -> List:
        """Return a list of field names for a datasource minus inappropriate types"""
        return [f.name for f in AOLUtils.list_fields(in_table) if f.type not in exclude_types]

    def correct_field(self, field_name: str, ds_fields: Dict, chk_fq_field: bool = False) -> str:
        """Correct field name case to match field name in datasource

        Args:
            field_name: the field_name to lookup.
            ds_fields: a dictionary keyed by the lower case of the field name and valued by the
            original field name.
            chk_fq_field: True to look for fully qualified field name and False otherwise.
        """
        if field_name.lower() in ds_fields:
            return ds_fields[field_name.lower()]
        
        if chk_fq_field:
            if field_name.upper() in FQ_FIELD_NAMES:
                for ds_fname in ds_fields:
                    if "." in ds_fname:
                        tmp_comp = ds_fname.split(".")[-1]
                        if tmp_comp.lower() == field_name.lower():
                            return ds_fields[ds_fname]

        return field_name  # If we get here return original field name

    def update_fieldmapping_byfieldlen(self, existing_field_mappings: Optional[arcpy.FieldMappings],
                                       fields_len_lookup: Dict) -> arcpy.FieldMappings:
        """Update the fieldmapping based on the fields_len_update.

        Args:
            existing_field_mappings: an instance of FieldMappings. If it is None, create the fieldMappings from
            in_features and merge_features.
            fields_len_lookup: a dictionary keyed by the field name and valued by the length of the field in the output.
        Returns:
            An instance of FieldMappings with the updated field information.

        """
        if not fields_len_lookup:
            return existing_field_mappings if existing_field_mappings else arcpy.FieldMappings()

        if not existing_field_mappings:
            existing_field_mappings = arcpy.FieldMappings()
            layers_to_merge = [self.input_layer] + self.merge_layer_coll.data
            layers_to_merge = [layer.data for layer in layers_to_merge]
            for lyr_to_mrg in layers_to_merge:
                existing_field_mappings.addTable(lyr_to_mrg)

        # Loop through the existing_field_mappings to update the length if necessary.
        for field_name in fields_len_lookup:
            fm_index = existing_field_mappings.findFieldMapIndex(field_name)
            tmp_field_map: arcpy.FieldMap = existing_field_mappings.getFieldMap(fm_index)  # type: ignore
            tmp_out_field = tmp_field_map.outputField
            tmp_out_field.length = fields_len_lookup[field_name]
            tmp_field_map.outputField = tmp_out_field
            existing_field_mappings.replaceFieldMap(fm_index, tmp_field_map)
        return existing_field_mappings

    def fm_contains(self, field_maps: arcpy.FieldMappings, field_name: str) -> bool:
        """Check if the FielfMappings contains the field with a certain name.

        Args:
            field_maps: an object of FieldMappings.
            field_name: a string represents the name of a certain field to check against.
        Returns:
            True if the field_maps contain a field with that name and False otherwise.

        """
        for field in field_maps.fields:
            if field.name.lower() == field_name.lower():
                return True
        return False

    def update_mlayer_fms(self, merge_lyr: PAFeatureLayer, merging_attributes: List[Dict],
                          in_fc_fields: List, ignore_field_types: List[str],
                          difflen_strfields: Dict, fms: arcpy.FieldMappings):
        """Update the FieldMappings based on the layer to merge.

        Args:
            merge_lyr (PAFeatureLayer): a layer to merge to the target layer.
            merging_attributes (List[Dict]): a list dictionary depicting the change of fields in merging.
            in_fc_fields (List): a list of fields of the target layer.
            ignore_field_types (List[str]): name of types that will not be merged into the output.
            difflen_strfields (Dict): a dictionary mapped the name of output field and the desired length.
            fms (arcpy.FieldMappings): an instance of arcpy.FieldMappings which will be updated on a
            continuous basis.
        """
        merge_fc_fields = self.get_field_names(merge_lyr.layer, ignore_field_types)
        LOGGER.debug(f"{merge_fc_fields=}")
        remove_fields = []
        match_fields = {}
        rename_fields = {}

        if merging_attributes:
            mfc_field_lu = {f.lower(): f for f in merge_fc_fields}
            ifc_field_lu = {f.lower(): f for f in in_fc_fields}
            check_fq = PortalUtils.is_portal_env()
            for att in merging_attributes:
                merge_type = att["mergeType"].lower()
                if merge_type == "remove":
                    remove_fields.append(self.correct_field(att["mergeLayerField"], mfc_field_lu, check_fq))
                elif merge_type == "match":
                    tmp_in_fc_name = self.correct_field(att["mergeValue"], ifc_field_lu, check_fq)
                    tmp_mrg_fc_name = self.correct_field(att["mergeLayerField"], mfc_field_lu, check_fq)
                    match_fields[tmp_mrg_fc_name] = tmp_in_fc_name
                elif merge_type == "rename":
                    tmp_mrg_fc_name = self.correct_field(att["mergeLayerField"], mfc_field_lu, check_fq)
                    rename_fields[tmp_mrg_fc_name] = att["mergeValue"]

        for f_name in merge_fc_fields:
            if f_name not in remove_fields:
                # This assumes that merge_layer can only match to the field of the input_layer.
                if f_name in match_fields:
                    LOGGER.debug(f"match_fields: {match_fields}")
                    LOGGER.debug(f"f_name: {f_name}")
                    fm_index = fms.findFieldMapIndex(match_fields[f_name])
                    if fm_index != -1:
                        LOGGER.debug(f"fm_index: {fm_index}")
                        field_map: arcpy.FieldMap = fms.getFieldMap(fm_index)  # type: ignore
                        field_map.addInputField(merge_lyr.layer, f_name)
                        tmp_match_field = AOLUtils.list_fields(merge_lyr.layer, f_name, "String")
                        if tmp_match_field:
                            tmp_field_length = tmp_match_field[0].length
                            tmp_out_field = field_map.outputField
                            if tmp_out_field.length < tmp_field_length:
                                tmp_out_field.length = tmp_field_length
                                field_map.outputField = tmp_out_field
                        fms.replaceFieldMap(fm_index, field_map)
                    # else:
                    #     field_map = arcpy.FieldMap()
                    #     field_map.addInputField(merge_lyr.data, f_name)
                    #     fms.addFieldMap(field_map)
                elif self.fm_contains(fms, f_name):
                    fm_index = fms.findFieldMapIndex(f_name)
                    field_map: arcpy.FieldMap = fms.getFieldMap(fm_index)  # type: ignore
                    field_map.addInputField(merge_lyr.layer, f_name)
                    if f_name in rename_fields:
                        out_field = field_map.outputField
                        out_field.name = rename_fields[f_name]
                        out_field.aliasName = rename_fields[f_name]
                        field_map.outputField = out_field

                        # Update the name of difflen_strfields if needed.
                        if difflen_strfields and f_name in difflen_strfields:
                            difflen_strfields[rename_fields[f_name]] = difflen_strfields[f_name]
                            difflen_strfields.pop(f_name)
                    fms.replaceFieldMap(fm_index, field_map)
                else:
                    field_map = arcpy.FieldMap()
                    field_map.addInputField(merge_lyr.layer, f_name)
                    # rename field
                    if f_name in rename_fields:
                        out_field = field_map.outputField
                        out_field.name = rename_fields[f_name]
                        out_field.aliasName = rename_fields[f_name]
                        field_map.outputField = out_field
                    fms.addFieldMap(field_map)

    def execute(self):
        """Merge layers together."""
        difflen_strfields = self.get_difflen_strfields()
        fms = arcpy.FieldMappings()

        ignore_field_types = ['Geometry', 'OID']
        in_fc_fields = self.get_field_names(self.input_layer.layer, ignore_field_types)
        LOGGER.debug(f"in_fc_fields: {in_fc_fields}")
        if self.merge_attributes is not None:
            for f_name in in_fc_fields:
                field_map = arcpy.FieldMap()
                field_map.addInputField(self.input_layer.layer, f_name)
                fms.addFieldMap(field_map)

            for i, merge_lyr in enumerate(self.merge_layer_coll.data):
                merging_attributes: List[Dict] = self.merge_attributes[i]  # type: ignore
                self.update_mlayer_fms(merge_lyr, merging_attributes, in_fc_fields,
                                       ignore_field_types, difflen_strfields, fms)

        if difflen_strfields:
            tmp_fms = fms if fms.fieldCount > 0 else None
            fms = self.update_fieldmapping_byfieldlen(tmp_fms, difflen_strfields)

        layers_to_merge = [layer.layer for layer in ([self.input_layer] + self.merge_layer_coll.data)]
        LOGGER.debug(f"fms field count: {fms.fieldCount}")
        LOGGER.debug(f"Total layers to merge: {len(layers_to_merge)}")
        LOGGER.debug(f"layers_to_merge: {layers_to_merge}")
        with arcpy.EnvManager(qualifiedFieldNames=False):
            if fms.fieldCount == 0:
                arcpy.Merge_management(layers_to_merge, self.merge_output.data)
            else:
                arcpy.Merge_management(layers_to_merge, self.merge_output.data, fms)
