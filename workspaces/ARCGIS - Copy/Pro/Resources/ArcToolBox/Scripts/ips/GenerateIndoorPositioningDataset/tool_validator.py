from collections import defaultdict

import arcpy
import ips.GenerateIndoorPositioningDataset.const as gipd_c
import ips.GenerateIndoorPositioningFileWithoutSurvey.tool_validator as gipfws_tv
import ips.const as c
import ips.utils as u
import ips.utils_db as u_db
import ips.validation as v

# handy alias for the model to use
M = c.MODEL_LATEST
fc_data_types = ['FeatureLayer', 'FeatureClass', 'DEFeatureClass']

# this variable flags that the tool has run successfully. In that case we want to trigger the validation of the
# dataset name again. After the validation is done, we set this back to false
validate_after_run = False
existing_dataset_names = []


class ToolValidator:
    param_msgs = defaultdict(dict)

    def __init__(self):
        self.params = arcpy.GetParameterInfo()

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        if self.params[2].value == gipd_c.METHOD_SURVEY_BASED:
            self.params[4].enabled = True
            self.params[5].enabled = False
            self.params[6].enabled = False
            self.params[7].enabled = False
        elif self.params[2].value == gipd_c.METHOD_SURVEY_LESS:
            self.params[4].enabled = False
            self.params[5].enabled = True
            self.params[6].enabled = True
            self.params[7].enabled = True

        global existing_dataset_names
        if self.params[0].value:
            try:
                global existing_dataset_names
                f = u.create_field_name_dict(
                    data_element=arcpy.Describe(self.params[0].valueAsText).catalogPath,
                    xml_schema_path=M.XML_PATH,
                    xml_element_name=M.IPS_POSITIONING_DATASETS.NAME
                )
                existing_dataset_names = u_db.tb2df(
                    tb=arcpy.Describe(self.params[0].valueAsText).catalogPath,
                    field_names_dict={M.IPS_POSITIONING_DATASETS.FIELDS.DATASET_NAME.name:
                                          f[M.IPS_POSITIONING_DATASETS.FIELDS.DATASET_NAME.name]}
                )[M.IPS_POSITIONING_DATASETS.FIELDS.DATASET_NAME.name].values.tolist()

                self.params[10].filter.list = existing_dataset_names
            except Exception:
                existing_dataset_names = []
                self.params[10].filter.list = []

        # enable the existing dataset parameter, only when there are existing datasets and the checkbox is True
        if self.params[9].value and existing_dataset_names:
            self.params[10].enabled = True
        else:
            self.params[10].enabled = False

        return

    def updateMessages(self):
        try:
            """Modify the messages created by internal validation for each tool
            parameter.  This method is called after internal validation."""
            target_ips_datasets = self.params[0]
            output_dataset_name = self.params[1]
            generation_method = self.params[2]
            input_level_fc = self.params[3]
            input_recordings_fc = self.params[4]
            input_beacons_fc = self.params[5]
            input_ips_areas_fc = self.params[6]
            input_walls_fc = self.params[7]
            update_existing = self.params[9]
            existing_dataset = self.params[10]

            validate_ips_positioning_datasets_param(target_ips_datasets, self.param_msgs[0])
            validate_output_dataset_name(output_dataset_name, self.param_msgs[1])

            # when the update checkbox is True, make the existing dataset "required"
            if update_existing.value and not existing_dataset.valueAsText:
                existing_dataset.setIDMessage('ERROR', 530)

            set_output_dataset_name(output_dataset_name, self.param_msgs[1], existing_dataset, target_ips_datasets)
            validate_unique_output_dataset_name(output_dataset_name, self.param_msgs[1],
                                                target_ips_datasets, self.param_msgs[0])
            validate_update_existing_x_generation_method(update_existing, self.param_msgs[9], generation_method)
            validate_ips_positioning_dataset_x_update_existing(target_ips_datasets, self.param_msgs[0], update_existing)

            # Validations of the input data used to generate the IPS Positioning Dataset
            validate_levels_param(input_level_fc, self.param_msgs[3])

            # if the user calls the tool with wrongly defined generation method,
            # the internal validation catches it (Error 000800)
            if generation_method.value == gipd_c.METHOD_SURVEY_BASED:
                if not input_recordings_fc.valueAsText:
                    input_recordings_fc.setIDMessage('ERROR', 530)
                    # this is not needed, for consistency set the message dictionary to the error 530
                    self.param_msgs[4].update({'msg_type': 'ERROR', 'msg_id': 530, 'msg_params': []})
                else:
                    validate_recordings_param(input_recordings_fc, self.param_msgs[4])
            elif generation_method.value == gipd_c.METHOD_SURVEY_LESS:
                if not input_beacons_fc.valueAsText:
                    input_beacons_fc.setIDMessage('ERROR', 530)
                    # this is not needed, for consistency set the message dictionary to the error 530
                    self.param_msgs[5].update({'msg_type': 'ERROR', 'msg_id': 530, 'msg_params': []})
                else:
                    gipfws_tv.validate_beacons_param(input_beacons_fc, self.param_msgs[5])

                if not input_ips_areas_fc.valueAsText:
                    input_ips_areas_fc.setIDMessage('ERROR', 530)
                    # this is not needed, for consistency set the message dictionary to the error 530
                    self.param_msgs[6].update({'msg_type': 'ERROR', 'msg_id': 530, 'msg_params': []})
                else:
                    gipfws_tv.validate_ips_area_param(input_ips_areas_fc, self.param_msgs[6])

                if not input_walls_fc.valueAsText:
                    input_walls_fc.setIDMessage('ERROR', 530)
                    # this is not needed, for consistency set the message dictionary to the error 530
                    self.param_msgs[7].update({'msg_type': 'ERROR', 'msg_id': 530, 'msg_params': []})
                else:
                    gipfws_tv.validate_walls_param(input_walls_fc, self.param_msgs[7])

        except Exception:
            pass

    def isLicensed(self):
        return v.has_license()


def validate_recordings_param(recordings_param: arcpy.Parameter, recordings_msg_dict: dict) -> None:
    """
    validates the Recordings parameter of this tool.

    Args:
        recordings_param: the arcpy Parameter of the input IPS Recordings
        recordings_msg_dict:  a dictionary containing the latest message associated with the parameter;
                              an empty dict if no message was associated to this parameter yet

    Returns:
          None

    """
    if not recordings_param.hasBeenValidated:
        # reset param messages
        recordings_msg_dict.clear()

        if recordings_param.valueAsText:
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
                    xml_schema_path=M.XML_PATH,
                    xml_element_name=M.IPS_RECORDINGS.NAME,
                    field_attr_filter=['name', 'type']):
                # error 30108: <value> is missing one or more required fields.
                recordings_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 30108,
                    'msg_params': [recordings_param.valueAsText]
                })
            # check empty input feature class
            elif arcpy.management.GetCount(recordings_param.valueAsText)[0] == '0':
                recordings_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 250071,
                    'msg_params': [recordings_param.displayName]
                })

    # if there is any message associated to this parameter, set it
    if recordings_msg_dict:
        # display the error message
        recordings_param.setIDMessage(recordings_msg_dict['msg_type'], recordings_msg_dict['msg_id'],
                                      *recordings_msg_dict['msg_params'])
    return


def validate_ips_positioning_datasets_param(target_ips_datasets_param: arcpy.Parameter,
                                            target_ips_datasets_msg_dict: dict) -> None:
    """Validates the IPS Positioning Dataset Feature Class of IPS Model

    Args:
        target_ips_datasets_param: the arcpy parameter for IPS Positioning Datasets
        target_ips_datasets_msg_dict: a dictionary containing the latest message associated with the parameter;
                                      an empty dict if no message was associated to this parameter yet

    Returns:
          None

    """
    if not target_ips_datasets_param.hasBeenValidated:
        # reset IPS Positioning Datasets Parameter messages
        target_ips_datasets_msg_dict.clear()

        if target_ips_datasets_param.valueAsText:
            # check for existence
            if not arcpy.Exists(target_ips_datasets_param.valueAsText):
                # error: <value> does not exist.
                target_ips_datasets_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 110,
                    'msg_params': [target_ips_datasets_param.valueAsText]
                })

            # check the data element type
            elif not v.check_data_element_type(
                    data_element=target_ips_datasets_param.value,
                    accepted_data_types=fc_data_types):
                # error 840: the value is not a <value>.
                target_ips_datasets_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 840,
                    'msg_params': ['Feature Class or Layer']
                })

            # check geometry type
            elif not v.check_geometry_type(
                    data_element=target_ips_datasets_param.value,
                    accepted_geometry_types=['Polygon']):
                # error 366: Invalid geometry type
                target_ips_datasets_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 366,
                    'msg_params': []
                })
            # check schema
            elif not v.check_schema(
                    data_element=target_ips_datasets_param.value,
                    xml_schema_path=M.XML_PATH,
                    xml_element_name=M.IPS_POSITIONING_DATASETS.NAME,
                    field_attr_filter=['name', 'type']):
                # error 30108: <value> is missing one or more required fields.
                target_ips_datasets_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 30108,
                    'msg_params': [target_ips_datasets_param.valueAsText]
                })

    # if there is any message associated to this parameter, set it
    if target_ips_datasets_msg_dict:
        target_ips_datasets_param.setIDMessage(target_ips_datasets_msg_dict['msg_type'],
                                               target_ips_datasets_msg_dict['msg_id'],
                                               *target_ips_datasets_msg_dict['msg_params'])
    return


def validate_output_dataset_name(output_dataset_name_param: arcpy.Parameter,
                                 output_dataset_name_msg_dict: dict) -> None:
    """Validates that the output dataset name is unique within the given for IPS Positioning Dataset

    Args:
        output_dataset_name_param: the arcpy parameter for output dataset name
        output_dataset_name_msg_dict: a dictionary containing the latest message associated with the parameter;
                                      an empty dict if no message was associated to this parameter yet

    Return:
          None

    """
    if not output_dataset_name_param.hasBeenValidated:
        # reset param messages
        output_dataset_name_msg_dict.clear()

        # if the output dataset name is set
        if output_dataset_name_param.valueAsText:
            # get the path of the output dataset
            ips_dataset_name = output_dataset_name_param.valueAsText
            # check if the dataset name is a valid name
            if not v.has_valid_first_letter(ips_dataset_name):
                # a dataset name can't start with a special character
                # or a number
                output_dataset_name_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 361,
                    'msg_params': []
                })

            elif not v.has_valid_name(ips_dataset_name):
                # a dataset name can't contain any special characters
                output_dataset_name_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 354,
                    'msg_params': []
                })

            elif not v.has_valid_length(ips_dataset_name, length=255):
                # a dataset name can't contain more than 255 characters
                output_dataset_name_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 731,
                    'msg_params': ['', 255]
                })

    # if there is any message associated to this parameter, set it
    if output_dataset_name_msg_dict:
        # display the error message
        output_dataset_name_param.setIDMessage(output_dataset_name_msg_dict['msg_type'],
                                               output_dataset_name_msg_dict['msg_id'],
                                               *output_dataset_name_msg_dict['msg_params'])
    return


def validate_levels_param(levels_param: arcpy.Parameter, levels_msg_dict: dict) -> None:
    """Validates the Levels parameter of this tool.

    Args:
        levels_param: the arcpy parameter of the Levels Feature Class
        levels_msg_dict: a dictionary containing the latest message associated with the parameter;
                         an empty dict if no message was associated to this parameter yet

    Returns:
        None

    """

    if not levels_param.hasBeenValidated:
        # reset param messages
        levels_msg_dict.clear()

        if levels_param.valueAsText:
            # check for existence
            if not arcpy.Exists(levels_param.valueAsText):
                # error: <value> does not exist.
                levels_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 110,
                    'msg_params': [levels_param.valueAsText]
                })

            # check the data element type
            elif not v.check_data_element_type(
                    data_element=levels_param.value,
                    accepted_data_types=fc_data_types):
                # error 840: the value is not a <value>.
                levels_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 840,
                    'msg_params': ['Feature Class or Layer']
                })

            # check geometry type
            elif not v.check_geometry_type(
                    data_element=levels_param.value,
                    accepted_geometry_types=['Polygon']):
                # error 366: Invalid geometry type
                levels_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 366,
                    'msg_params': []
                })

            # check for valid spatial Reference
            elif not v.has_valid_crs(
                    feature_class=levels_param.value):
                # error 3705: Invalid Spatial Reference
                levels_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 3705,
                    'msg_params': []
                })

            # check schema
            elif not v.check_schema(
                    data_element=levels_param.value,
                    xml_schema_path=c.INDOORS_MODEL_XML_SCHEMA_PATH,
                    xml_element_name=c.LEVELS_NAME,
                    field_attr_filter=['name', 'type'],
                    is_in_dataset=True,
                    fields_to_check=[c.LEVEL_ID_FIELD_NAME, c.VERTICAL_ORDER]):
                # error 30108: <value> is missing one or more required fields.
                levels_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 30108,
                    'msg_params': [levels_param.valueAsText]
                })

            # check empty input feature class
            elif arcpy.management.GetCount(levels_param.valueAsText)[0] == '0':
                levels_msg_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 250071,
                    'msg_params': [levels_param.displayName]
                })

    # if there is any message associated to this parameter, set it
    if levels_msg_dict:
        # display the error message
        levels_param.setIDMessage(levels_msg_dict['msg_type'], levels_msg_dict['msg_id'],
                                  *levels_msg_dict['msg_params'])
    return


def validate_update_existing_x_generation_method(update_existing_param: arcpy.Parameter,
                                                 update_existing_msg_dict: dict,
                                                 generation_method_param: arcpy.Parameter) -> None:
    """Validates that the update existing dataset is possible only when the generation method is Survey-Less

    Args:
        update_existing_param: the arcpy parameter of the Update Existing Dataset checkbox
        update_existing_msg_dict: a dictionary containing the latest message associated with the parameter;
                                  an empty dict if no message was associated to this parameter yet
        generation_method_param: the arcpy parameter of the Generation Method

    Returns:
        None

    """
    if not update_existing_param.hasBeenValidated or not generation_method_param.hasBeenValidated:
        update_existing_msg_dict.clear()
        update_existing_param.clearMessage()
        if update_existing_param.value and generation_method_param.valueAsText != gipd_c.METHOD_SURVEY_BASED:
            update_existing_msg_dict.update({"msg_type": "ERROR",
                                             "msg_id": 250108,
                                             "msg_params": []})

    # if there is any message associated to this parameter, set it
    if update_existing_msg_dict:
        update_existing_param.setIDMessage(update_existing_msg_dict["msg_type"],
                                           update_existing_msg_dict["msg_id"],
                                           *update_existing_msg_dict["msg_params"])

    return


def validate_unique_output_dataset_name(output_dataset_name_param: arcpy.Parameter,
                                        output_dataset_name_msg_dict: dict,
                                        target_ips_datasets_param: arcpy.Parameter,
                                        target_ips_datasets_msg_dict: dict):
    """Validates that the output dataset name is unique (no matter if the user wants to perform and update or not)

    The validation is triggered when either the output dataset name or the target IPS Positioning Datasets has
    changed or a successful run of GIPD just finished.

    Args:
        output_dataset_name_param: the arcpy parameter of the Output Dataset Name
        output_dataset_name_msg_dict: a dictionary containing the latest message associated with the parameter;
                                      an empty dict if no message was associated to this parameter yet
        target_ips_datasets_param: the arcpy parameter of the Target IPS Positioning Datasets
        target_ips_datasets_msg_dict: a dictionary containing the latest message associated with the parameter;
                                      an empty dict if no message was associated to this parameter yet

    Returns:
        None

    """
    global validate_after_run
    global existing_dataset_names
    if (not output_dataset_name_param.hasBeenValidated or not target_ips_datasets_param.hasBeenValidated or
            validate_after_run):
        # reset the validate after run to avoid doing the check always (it sets in the postExecute function)
        validate_after_run = False
        # the validation is needed only when the target IPS Positioning Datasets is valid
        # and the output dataset name doesn't contain invalid characters
        if ((output_dataset_name_msg_dict == {} or output_dataset_name_param['msg_id'] == 605) and
                target_ips_datasets_msg_dict == {} and
                output_dataset_name_param.valueAsText in existing_dataset_names):
            output_dataset_name_msg_dict.update({"msg_type": "ERROR",
                                                 "msg_id": 605,
                                                 "msg_params": [output_dataset_name_param.valueAsText,
                                                                target_ips_datasets_param.valueAsText]})

    # if there is any message associated to this parameter, set it
    if output_dataset_name_msg_dict:
        output_dataset_name_param.setIDMessage(output_dataset_name_msg_dict["msg_type"],
                                               output_dataset_name_msg_dict["msg_id"],
                                               *output_dataset_name_msg_dict["msg_params"])

    return


def validate_ips_positioning_dataset_x_update_existing(target_ips_datasets_param: arcpy.Parameter,
                                                       target_ips_datasets_msg_dict: dict,
                                                       update_existing_param: arcpy.Parameter) -> None:
    """Validates that the Target IPS Positioning Datasets is not empty when the update existing dataset is checked

    Args:
        target_ips_datasets_param: the arcpy parameter of the Target IPS Positioning Datasets
        target_ips_datasets_msg_dict: a dictionary containing the latest message associated with the parameter;
                                      an empty dict if no message was associated to this parameter yet
        update_existing_param: the arcpy parameter of the Update Existing Dataset checkbox

    Returns:
        None

    """
    # validate when either one of the two parameters has changed
    if not update_existing_param.hasBeenValidated or not target_ips_datasets_param.hasBeenValidated:
        # validate only if the IPS Positioning Datasets param is valid or contains the 250071 from previous validation
        if target_ips_datasets_msg_dict == {} or target_ips_datasets_msg_dict['msg_id'] == 250071:
            target_ips_datasets_msg_dict.clear()
            target_ips_datasets_param.clearMessage()

            global existing_dataset_names
            # if there are no existing datasets to be updated, raise an Error for empty Target IPS Positioning Datasets
            if update_existing_param.value and not existing_dataset_names:
                target_ips_datasets_msg_dict.update({"msg_type": "ERROR",
                                                     "msg_id": 250071,
                                                     "msg_params": [target_ips_datasets_param.displayName]})

    if target_ips_datasets_msg_dict:
        target_ips_datasets_param.setIDMessage(target_ips_datasets_msg_dict["msg_type"],
                                               target_ips_datasets_msg_dict["msg_id"],
                                               *target_ips_datasets_msg_dict["msg_params"])


def set_output_dataset_name(output_dataset_name_param: arcpy.Parameter,
                            output_dataset_name_msg_dict: dict,
                            existing_dataset_param: arcpy.Parameter,
                            target_ips_datasets: arcpy.Parameter) -> None:
    """Sets the output dataset name to {dataset_name}_updated when the existing dataset is changed

    Args:
        output_dataset_name_param: the arcpy parameter for output dataset name
        output_dataset_name_msg_dict: a dictionary containing the latest message associated with the parameter;
                                      an empty dict if no message was associated to this parameter yet
        existing_dataset_param: the arcpy parameter for the existing dataset
        target_ips_datasets: the arcpy parameter for the target IPS Positioning Datasets

    Returns:
        None

    """
    # we want to set the recommended value only when the existing dataset has changed
    # HOWEVER, when calling the tool as a script, we don't want to set a recommended value, the user has already
    # provided an input
    # When called as script, all the parameters have "hasBeenValidated" = False. To avoid setting the recommended
    # ... + "_updated" value, we want the target IPS Positioning Datasets to be validated!
    if not existing_dataset_param.hasBeenValidated and target_ips_datasets.hasBeenValidated and \
            existing_dataset_param.valueAsText:
        output_dataset_name_msg_dict.clear()
        output_dataset_name_param.clearMessage()
        output_dataset_name_param.value = existing_dataset_param.valueAsText + "_updated"

    return
