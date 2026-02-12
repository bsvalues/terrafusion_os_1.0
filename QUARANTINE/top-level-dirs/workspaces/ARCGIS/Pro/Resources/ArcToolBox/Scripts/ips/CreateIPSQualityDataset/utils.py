import os
import tempfile
from typing import List

import arcpy
import ips.GenerateIndoorPositioningFile.utils as gipf_u
import ips.const as c
import ips.utils as u


def create_ips_quality_dataset(workspace: str,
                               coordinate_system: str,
                               out_dataset_name: str) -> List[str]:
    """
    Creates the IPS Quality dataset in the user defined workspace/geodatabase.
    The dataset coordinate system and name are also defined by the user.

    :param workspace: path to geodatabase/workspace
    :type workspace: str
    :coordinate_system: the coordinate system as WKT (user defined)
    :type coordinate_system: str
    :out_dataset_name: name of the IPS Quality Dataset defined by the user
    :type out_dataset_name: str
    :return feature_dataset and classes: a list of three elements, containing
    the paths to the feature dataset, Reference and Computed Positions feature
    classes
    :rtype: List[str]
    """
    arcpy.env.workspace = workspace
    dataset_exists = arcpy.Exists(os.path.join(workspace, out_dataset_name))
    overwrite_option = arcpy.env.overwriteOutput
    # from Python 3.10 on we can call cleanup
    # and ignore exceptions for tempdirs
    # this patch can be replaced by using tempdir parameter
    # ignore_errors from 3.10 on
    tempfile.TemporaryDirectory.cleanup = gipf_u.cleanup_patch
    with tempfile.TemporaryDirectory() as tmp_dir:
        edited_xml_schema_path = u.edit_dataset_xml_schema(
            in_xml_schema_path=c.MODEL_QUALITY_31.XML_PATH,
            data_dir=tmp_dir,
            coordinate_system=coordinate_system,
            out_dataset_name=out_dataset_name)

        # TODO: This case raises an unexpected error. Check with gp team
        if dataset_exists and overwrite_option:
            '''If the dataset with the same name already exists and the
            "overwrite existing datasets" option is enabled, the existing
            dataset gets deleted.'''
            arcpy.Delete_management(os.path.join(workspace, out_dataset_name))
            dataset_exists = False

        if not dataset_exists and overwrite_option:
            '''In this case the dataset with the same name doesn't exist BUT we
             still have to check if the fc Reference/Computed_Positions exist. 
             Instead of doing it manually, let the gp core to handle it by 
             setting and unsetting the overwriteOutput option.'''
            arcpy.env.overwriteOutput = False
            arcpy.ImportXMLWorkspaceDocument_management(
                target_geodatabase=workspace,
                in_file=edited_xml_schema_path,
                import_type='SCHEMA_ONLY')
            arcpy.env.overwriteOutput = True
        else:
            '''In any case that the overwrite option is false or the dataset 
            doesn't exist anymore, gp core handles the setting of a postfix to
            feature dataset and/or feature classes.'''
            arcpy.ImportXMLWorkspaceDocument_management(
                target_geodatabase=workspace,
                in_file=edited_xml_schema_path,
                import_type='SCHEMA_ONLY')

    reference_positions_fc_path = \
        u.get_fc_path(
            dataset_path=os.path.join(workspace, out_dataset_name),
            feature_class_name=c.MODEL_QUALITY_31.REFERENCE_POSITIONS.NAME,
            feature_class_type='Point'
        )
    computed_positions_fc_path = \
        u.get_fc_path(
            dataset_path=os.path.join(workspace, out_dataset_name),
            feature_class_name=c.MODEL_QUALITY_31.COMPUTED_POSITIONS.NAME,
            feature_class_type='Point'
        )
    if arcpy.Describe(workspace).workspaceType == 'LocalDatabase':
        arcpy.Compact_management(workspace)
    return [os.path.join(workspace, out_dataset_name),
            os.path.join(workspace, out_dataset_name, reference_positions_fc_path),
            os.path.join(workspace, out_dataset_name, computed_positions_fc_path)]
