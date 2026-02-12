import os
from collections import defaultdict

import arcpy
import ips.const as c
import ips.validation as v

# this variable flags that the tool has run successfully. In that case we want to trigger the validation of the
# dataset name again. After the validation is done, we set this back to false
validate_after_run = False
overwrite_option = False


class ToolValidator:
    param_msgs = defaultdict(dict)

    def __init__(self):
        self.parameters = arcpy.GetParameterInfo()

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        if self.parameters[0].valueAsText and not self.parameters[0].hasBeenValidated:
            self.parameters[3].value = os.path.join(self.parameters[0].valueAsText, c.MODEL_QUALITY_31.NAME)
            self.parameters[4].value = os.path.join(self.parameters[0].valueAsText,
                                                    c.MODEL_QUALITY_31.REFERENCE_POSITIONS.NAME)
            self.parameters[5].value = os.path.join(self.parameters[0].valueAsText,
                                                    c.MODEL_QUALITY_31.COMPUTED_POSITIONS.NAME)
        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation.

        This tool honors the Geoprocessing Option "Allow geoprocessing tools to
        overwrite existing datasets"
            NOTE: in case of no violation and only the feature classes exist
            but under a different dataset, the newly created ones get a postfix
            in the form _X (X=1,2,3...) automatically.
        """
        try:
            # get some convenient names for the input params
            target_workspace_param = self.parameters[0]
            coordinate_system_param = self.parameters[1]
            dataset_name_param = self.parameters[2]

            validate_target_workspace_param(target_workspace_param, self.param_msgs[0])
            validate_crs_param(coordinate_system_param, self.param_msgs[1])
            validate_dataset_name_param(dataset_name_param, self.param_msgs[2], target_workspace_param)

            return

        except Exception:
            return

    def isLicensed(self):
        return v.has_license()


def validate_target_workspace_param(target_workspace_param: arcpy.Parameter, target_workspace_msg_dict: dict):
    """Validates the target workspace parameter.

    Args:
        target_workspace_param: the arcpy parameter of the target workspace
        target_workspace_msg_dict: a dictionary containing the latest message associated with the parameter;
                                   an empty dict if no message was associated to this parameter yet

    Returns:
        None

    """
    workspace_data_types = ['DEWorkspace', 'Workspace']

    # if the Target Workspace is set
    if not target_workspace_param.hasBeenValidated:
        # reset param messages
        target_workspace_msg_dict.clear()
        target_workspace_param.clearMessage()

        if not arcpy.Exists(target_workspace_param.valueAsText):
            # target workspace does not exist: error
            target_workspace_msg_dict.update({
                "msg_type": "ERROR",
                "msg_id": 110,
                "msg_params": [target_workspace_param.valueAsText]
            })
        # check the data element type
        elif not v.check_data_element_type(
                data_element=target_workspace_param.valueAsText,
                accepted_data_types=workspace_data_types):
            # error 840: the value is not a <value>.
            target_workspace_msg_dict.update({
                "msg_type": "ERROR",
                "msg_id": 840,
                "msg_params": ["Workspace"]
            })

    # if there is any message associated to this parameter, set it
    if target_workspace_msg_dict:
        # display the error message
        target_workspace_param.setIDMessage(target_workspace_msg_dict['msg_type'],
                                            target_workspace_msg_dict['msg_id'],
                                            *target_workspace_msg_dict['msg_params'])

    return


def validate_dataset_name_param(dataset_name_param: arcpy.Parameter,
                                dataset_name_dict: dict,
                                target_workspace_param: arcpy.Parameter):
    """Validates the dataset name parameter.

    The dataset name validation is triggered when it has changed, or the target workspace has changed, or the tool
    has just finished executing successfully or the ArcGIS Pro overwrite option has changed.

    Args:
        dataset_name_param: the arcpy parameter of the dataset name
        dataset_name_dict: a dictionary containing the latest message associated with the parameter;
                                an empty dict if no message was associated to this parameter yet
        target_workspace_param: the arcpy parameter of the target workspace

    Returns:
        None

    """
    global validate_after_run
    global overwrite_option

    # if the output dataset name is set
    if not dataset_name_param.hasBeenValidated or not target_workspace_param.hasBeenValidated or validate_after_run or \
            overwrite_option != arcpy.env.overwriteOutput:
        # reset param messages
        dataset_name_dict.clear()
        # reset the validate after run to avoid doing the check always (it gets set in the postExecute function)
        validate_after_run = False
        # set the value of the overwrite option
        overwrite_option = arcpy.env.overwriteOutput

        # get the path of the output dataset
        target_workspace_path = target_workspace_param.valueAsText
        dataset_name = dataset_name_param.valueAsText
        dataset_path = os.path.join(target_workspace_path, dataset_name)

        # check if the dataset name is a valid name
        if not v.has_valid_first_letter(dataset_name):
            # a dataset name can't start with a special character
            # or a number
            dataset_name_dict.update({
                "msg_type": "ERROR",
                "msg_id": 361,
                "msg_params": []
            })

        elif not v.has_valid_name(dataset_name):
            # a dataset name can't contain any special characters
            dataset_name_dict.update({
                "msg_type": "ERROR",
                "msg_id": 354,
                "msg_params": []
            })

        elif not v.has_valid_length(dataset_name):
            # a dataset name can't contain more than 160 characters
            dataset_name_dict.update({
                "msg_type": "ERROR",
                "msg_id": 731,
                "msg_params": ["", "160"]
            })

        # if the dataset already exists
        elif arcpy.Exists(dataset_path):
            if overwrite_option:
                # overwrite option set to True
                # overwrite is allowed, display a WARNING:
                # dataset exists and will be overwritten
                dataset_name_dict.update({
                    "msg_type": "WARNING",
                    "msg_id": 870,
                    "msg_params": [dataset_name_param.displayName, dataset_name]
                })
            else:
                # overwrite option set to False
                # overwrite is forbidden, display an ERROR:
                # dataset exists and cannot be overwritten
                dataset_name_dict.update({
                    "msg_type": "ERROR",
                    "msg_id": 872,
                    "msg_params": [dataset_name_param.displayName, dataset_name]
                })

    # if there is any message associated to this parameter, set it
    if dataset_name_dict:
        # display the error message
        dataset_name_param.setIDMessage(dataset_name_dict['msg_type'],
                                        dataset_name_dict['msg_id'],
                                        *dataset_name_dict['msg_params'])

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
        crs_param.setIDMessage(crs_msg_dict['msg_type'],
                               crs_msg_dict['msg_id'],
                               *crs_msg_dict['msg_params'])

    return
