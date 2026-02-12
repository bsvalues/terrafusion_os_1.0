import os
from collections import defaultdict

import arcpy
import ips.const as c
import ips.validation as v

workspace_data_types = ['DEWorkspace', 'Workspace']


class ToolValidator:
    param_msgs = defaultdict(dict)

    def __init__(self):
        self.parameters = arcpy.GetParameterInfo()

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        return

    def updateMessages(self):
        try:
            """Modify the messages created by internal validation for each tool
            parameter.  This method is called after internal validation."""
            in_workspace_param = self.parameters[0]
            coordinate_system_param = self.parameters[2]

            # get the value of the overwrite option
            # this must always be read inside the ToolValidator class to honor the ArcGIS Pro setting
            # if read inside the script, it might be different, i.e. ArcGIS Pro setting != arcpy setting
            overwrite_option = arcpy.env.overwriteOutput

            validate_workspace_param(in_workspace_param, self.param_msgs[0],
                                     overwrite_option=overwrite_option)
            validate_crs_param(coordinate_system_param, self.param_msgs[2])
            return
        except Exception as e:
            return

    def isLicensed(self):
        return v.has_license()


def validate_workspace_param(workspace_param: arcpy.Parameter, workspace_msg_dict: dict, overwrite_option: bool):
    """validates the workspace parameter of this tool.
       Args:
          workspace_param: the parameter to be validated
          workspace_msg_dict: a dictionary containing the latest message associated with the parameter; an empty dict
               if no message was associated to this parameter yet
          overwrite_option: ArcGIS Pro setting (Option -> Geoprocessing -> Allow geoprocessing tools to overwrite
           existing datasets)
    """
    # # get the value of the overwrite option
    # overwrite_option = arcpy.env.overwriteOutput

    # always check for existing datasets because the parameter might not change
    # but the datasets or the overwrite option might
    if workspace_param.value:
        # reset param messages
        workspace_msg_dict.clear()

        if not arcpy.Exists(workspace_param.valueAsText):
            # error: <value> does not exist.
            workspace_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 110,
                'msg_params': [workspace_param.valueAsText]
            })

        # check the data element type
        elif not v.check_data_element_type(
                data_element=workspace_param.valueAsText,
                accepted_data_types=workspace_data_types):
            # error 840: the value is not a <value>.
            workspace_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 840,
                'msg_params': ['Workspace']
            })

        else:
            # derived dataset names - to be produced by the tool
            dataset_names_list = [c.MODEL_LATEST.IPS_POSITIONING_DATASETS.NAME,
                                  c.MODEL_LATEST.IPS_POSITIONING_POINTS.NAME,
                                  c.MODEL_LATEST.IPS_POSITIONING_SIGNALS.NAME,
                                  c.MODEL_LATEST.IPS_RECORDINGS.NAME,
                                  c.MODEL_LATEST.IPS_BEACONS.NAME]
            existing_datasets = []

            for dataset_name in dataset_names_list:
                if arcpy.Exists(os.path.join(workspace_param.valueAsText, dataset_name)):
                    existing_datasets.append(dataset_name)

            if existing_datasets:
                # overwrite option set to True
                # overwrite is allowed, display a WARNING:
                # datasets exist and will be overwritten
                if overwrite_option:
                    workspace_msg_dict.update({
                        'msg_type': "WARNING",
                        'msg_id': 250085,
                        'msg_params': [', '.join([d_name for d_name in existing_datasets])]
                    })

                # overwrite option set to False
                # overwrite is forbidden, display an ERROR:
                # datasets exist and cannot be overwritten
                else:
                    workspace_msg_dict.update({
                        'msg_type': "ERROR",
                        'msg_id': 250086,
                        'msg_params': [', '.join([d_name for d_name in existing_datasets])]
                    })

    # if there is any message associated to this parameter, set it
    if workspace_msg_dict:
        # display the error message
        workspace_param.setIDMessage(workspace_msg_dict['msg_type'], workspace_msg_dict['msg_id'],
                                     *workspace_msg_dict['msg_params'])
    return


def validate_crs_param(crs_param: arcpy.Parameter, crs_msg_dict: dict):
    """validates the coordinate system parameter of this tool.
       Args:
          crs_param: the parameter to be validated
          crs_msg_dict: a dictionary containing the latest message associated with the parameter;
                        an empty dict if no message was associated to this parameter yet
    """
    # the param has changed, validate it and store the error message for future validations
    if not crs_param.hasBeenValidated and crs_param.valueAsText:
        # reset param messages
        crs_msg_dict.clear()

        # we do not accept 'Unknown' or 'Custom' reference systems (factory codes 0)
        if crs_param.valueAsText.lower() == 'unknown' or \
                arcpy.SpatialReference(text=crs_param.valueAsText).factoryCode == 0:
            crs_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 3705,
                'msg_params': []
            })

    # if there is any message associated to this parameter, set it
    if crs_msg_dict:
        # display the error message
        crs_param.setIDMessage(crs_msg_dict['msg_type'], crs_msg_dict['msg_id'], *crs_msg_dict['msg_params'])

    return
