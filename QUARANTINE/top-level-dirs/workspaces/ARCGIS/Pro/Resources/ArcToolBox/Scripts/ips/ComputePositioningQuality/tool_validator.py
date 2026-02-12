from collections import defaultdict

import os

import arcpy
import ips.const as c
import ips.utils as u
import ips.validation as v

# handy alias for the model to use
M = c.MODEL_QUALITY_31
dataset_data_types = ['FeatureDataset', 'DEFeatureDataset']
fc_data_types = ['FeatureLayer', 'FeatureClass', 'DEFeatureClass']


class ToolValidator:
    param_msgs = defaultdict(dict)

    def __init__(self):
        self.parameters = arcpy.GetParameterInfo()

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        if self.parameters[0].valueAsText and not self.parameters[0].hasBeenValidated:
            self.parameters[4].value = os.path.join(self.parameters[0].valueAsText,
                                                    M.REFERENCE_POSITIONS.NAME)
            self.parameters[5].value = os.path.join(self.parameters[0].valueAsText,
                                                    M.COMPUTED_POSITIONS.NAME)
        return

    def updateMessages(self):
        try:
            """Modify the messages created by internal validation for each tool
            parameter.  This method is called after internal validation."""
            # recordings input parameter
            quality_dataset_param = self.parameters[0]
            recordings_param = self.parameters[1]
            details_param = self.parameters[2]

            validate_quality_dataset_param(quality_dataset_param, self.param_msgs[0])
            validate_recordings_param(recordings_param, self.param_msgs[1])
            validate_details_param(details_param, self.param_msgs[2])

        except Exception:
            return

    def isLicensed(self):
        return v.has_license()


def validate_quality_dataset_param(quality_dataset_param: arcpy.Parameter, quality_dataset_msg_dict: dict) -> None:
    """
    validates the Quality Dataset parameter of this tool.

    Args:
        quality_dataset_param: the parameter to be validated
        quality_dataset_msg_dict:  a dictionary containing the latest message associated with the parameter; an empty dict
               if no message was associated to this parameter yet

    """
    if not quality_dataset_param.hasBeenValidated:
        # reset param messages
        quality_dataset_msg_dict.clear()

        if quality_dataset_param.valueAsText:
            # check for existence
            if not arcpy.Exists(quality_dataset_param.valueAsText):
                # error: <value> does not exist.
                quality_dataset_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 110,
                    'msg_params': [quality_dataset_param.valueAsText]
                })
                # display the error message
                quality_dataset_param.setIDMessage(quality_dataset_msg_dict['msg_type'],
                                                   quality_dataset_msg_dict['msg_id'],
                                                   *quality_dataset_msg_dict['msg_params'])

                return

            reference_position_fc = u.get_fc_path(
                dataset_path=quality_dataset_param.valueAsText,
                feature_class_name=M.REFERENCE_POSITIONS.NAME,
                feature_class_type='Point')

            computed_position_fc = u.get_fc_path(
                dataset_path=quality_dataset_param.valueAsText,
                feature_class_name=M.COMPUTED_POSITIONS.NAME,
                feature_class_type='Point')

            # check the data element type
            if not v.check_data_element_type(
                    data_element=quality_dataset_param.value,
                    accepted_data_types=dataset_data_types):
                # error 840: the value is not a <value>.
                quality_dataset_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 840,
                    'msg_params': ['Feature Dataset']
                })

            # check for the specific feature classes within Dataset
            elif reference_position_fc is None:
                # error: <value> does not exist.
                quality_dataset_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 110,
                    'msg_params': [quality_dataset_param.valueAsText + '\\' + M.REFERENCE_POSITIONS.NAME]
                })

            # check for the specific feature classes within Dataset
            elif computed_position_fc is None:
                # error: <value> does not exist.
                quality_dataset_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 110,
                    'msg_params': [quality_dataset_param.valueAsText + '\\' + M.COMPUTED_POSITIONS.NAME]
                })

            # check geometry type
            elif not v.check_geometry_type(
                    data_element=reference_position_fc,
                    accepted_geometry_types=['Point']):
                # error 366: Invalid geometry type
                quality_dataset_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 366,
                    'msg_params': []
                })

            # check schema
            elif not v.check_schema(
                    data_element=reference_position_fc,
                    xml_schema_path=M.XML_PATH,
                    xml_element_name=M.REFERENCE_POSITIONS.NAME,
                    field_attr_filter=['name', 'type'],
                    is_in_dataset=True):
                # error 30108: <value> is missing one or more required fields.
                quality_dataset_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 30108,
                    'msg_params': [reference_position_fc]
                })

            # check geometry type
            elif not v.check_geometry_type(
                    data_element=computed_position_fc,
                    accepted_geometry_types=['Point']):
                # error 366: Invalid geometry type
                quality_dataset_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 366,
                    'msg_params': []
                })

            # check schema
            elif not v.check_schema(
                    data_element=computed_position_fc,
                    xml_schema_path=M.XML_PATH,
                    xml_element_name=M.COMPUTED_POSITIONS.NAME,
                    field_attr_filter=['name', 'type'],
                    is_in_dataset=True):
                # error 30108: <value> is missing one or more required fields.
                quality_dataset_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 30108,
                    'msg_params': [computed_position_fc]
                })

    # if there is any message associated to this parameter, set it
    if quality_dataset_msg_dict:
        # display the error message
        quality_dataset_param.setIDMessage(quality_dataset_msg_dict['msg_type'], quality_dataset_msg_dict['msg_id'],
                                           *quality_dataset_msg_dict['msg_params'])

    return


def validate_recordings_param(recordings_param: arcpy.Parameter, recordings_msg_dict: dict) -> None:
    """
    validates the Recordings parameter of this tool.

    Args:
        recordings_param: the parameter to be validated
        recordings_msg_dict:  a dictionary containing the latest message associated with the parameter; an empty dict
               if no message was associated to this parameter yet

    """
    if not recordings_param.hasBeenValidated:
        # reset param messages
        recordings_msg_dict.clear()

        # check for existence
        if not arcpy.Exists(recordings_param.valueAsText):
            # error: <value> does not exist.
            recordings_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 110,
                'msg_params': [recordings_param.valueAsText]
            })

        # check the data element type
        elif not v.check_data_element_type(
                data_element=recordings_param.value,
                accepted_data_types=fc_data_types):
            # error 840: the value is not a <value>.
            recordings_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 840,
                'msg_params': ['Feature Class or Layer']
            })

        # check geometry type
        elif not v.check_geometry_type(
                data_element=recordings_param.value,
                accepted_geometry_types=['Polyline']):
            # error 366: Invalid geometry type
            recordings_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 366,
                'msg_params': []
            })

        # check schema
        elif not v.check_schema(
                data_element=recordings_param.value,
                xml_schema_path=c.MODEL_30.XML_PATH,
                xml_element_name=c.MODEL_30.IPS_RECORDINGS.NAME,
                field_attr_filter=['name', 'type']):
            # error 30108: <value> is missing one or more required fields.
            recordings_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 30108,
                'msg_params': [recordings_param.valueAsText]
            })

    # if there is any message associated to this parameter, set it
    if recordings_msg_dict:
        # display the error message
        recordings_param.setIDMessage(recordings_msg_dict['msg_type'], recordings_msg_dict['msg_id'],
                                      *recordings_msg_dict['msg_params'])
    return


def validate_details_param(details_param: arcpy.Parameter, details_msg_dict: dict) -> None:
    """
    validates the Details parameter of this tool.

    Args:
        details_param: the parameter to be validated
        details_msg_dict:  a dictionary containing the latest message associated with the parameter; an empty dict
               if no message was associated to this parameter yet

    """
    if not details_param.hasBeenValidated:
        # reset param messages
        details_msg_dict.clear()

        # check for existence
        if not arcpy.Exists(details_param.valueAsText):
            # error: <value> does not exist.
            details_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 110,
                'msg_params': [details_param.valueAsText]
            })

        # check the data element type
        elif not v.check_data_element_type(
                data_element=details_param.value,
                accepted_data_types=fc_data_types):
            # error 840: the value is not a <value>.
            details_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 840,
                'msg_params': ['Feature Class or Layer']
            })

        # check geometry type
        elif not v.check_geometry_type(
                data_element=details_param.value,
                accepted_geometry_types=['Polyline']):
            # error 366: Invalid geometry type
            details_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 366,
                'msg_params': []
            })

        # check schema
        elif not v.check_schema(
                data_element=details_param.value,
                xml_schema_path=c.INDOORS_MODEL_XML_SCHEMA_PATH,
                xml_element_name=c.DETAILS_NAME,
                field_attr_filter=['name', 'type'],
                is_in_dataset=True):
            # error 30108: <value> is missing one or more required fields.
            details_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 30108,
                'msg_params': [details_param.valueAsText]
            })

    # if there is any message associated to this parameter, set it
    if details_msg_dict:
        # display the error message
        details_param.setIDMessage(details_msg_dict['msg_type'], details_msg_dict['msg_id'],
                                   *details_msg_dict['msg_params'])
    return
