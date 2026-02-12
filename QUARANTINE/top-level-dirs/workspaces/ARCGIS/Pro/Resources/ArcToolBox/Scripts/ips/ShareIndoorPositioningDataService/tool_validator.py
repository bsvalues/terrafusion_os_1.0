from collections import defaultdict

import arcpy
import ips.ShareIndoorPositioningDataService.const as sipds_c
import ips.ShareIndoorPositioningDataService.utils as sipds_u
import ips.const as c
import ips.utils as u
import ips.utils_db as u_db
import ips.validation as v

M = c.MODEL_LATEST

fc_data_types = ['FeatureLayer', 'FeatureClass', 'DEFeatureClass']
existing_services = sipds_u.get_portal_existing_ipds()


class ToolValidator:
    current_portal = None
    current_username = None
    param_msgs = defaultdict(dict)

    def __init__(self):
        """The __init__ runs at every ToolValidator instance."""
        self.parameters = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.
        This method is called when the tool is opened.
        """
        # set the dependency for the IPS Dataset Name -> In IPS Datasets
        self.parameters[1].parameterDependencies = [self.parameters[0].name]

        # initialize the current portal and current user values
        self.current_portal = arcpy.GetActivePortalURL()
        self.current_username = sipds_u.get_portal_username(portal_url=self.current_portal)

        # initialize filter for the folder parameter
        self.parameters[5].filter.list = sipds_u.get_portal_user_folders(portal_url=self.current_portal,
                                                                         username=self.current_username)
        # initialize filter for the sharing groups parameter
        self.parameters[7].filter.list = sipds_u.get_portal_groups(portal_url=self.current_portal)

        # initialize the existing Indoor Positioning Data Services that may be used to filter the title parameter

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        # get active portal and active user's username.
        active_portal = arcpy.GetActivePortalURL()
        username = sipds_u.get_portal_username(portal_url=active_portal)

        global existing_services
        if self.current_portal != active_portal or self.current_username != username:
            # the logged-in user or the active portal have changed
            # update the folder and the sharing group filters
            # if there is no active portal or active user the username = "", the folders and groups filters are
            # cleared (equal to [])
            self.parameters[5].filter.list = sipds_u.get_portal_user_folders(portal_url=active_portal,
                                                                             username=username)
            self.parameters[7].filter.list = sipds_u.get_portal_groups(portal_url=active_portal)

            # update the current portal and current username values used for checking
            self.current_portal = active_portal
            self.current_username = username

            # update the list of updatable Indoor Positioning Data Services
            existing_services = sipds_u.get_portal_existing_ipds()

        # logic for changing the title filter according to the update existing service checkbox
        if self.parameters[10].value:
            # the checkbox is true (update), the title accepts one of the existing services names only
            self.parameters[2].filter.list = existing_services

            # disable folder, sharing level and group sharing parameters when updating
            self.parameters[5].enabled = False
            self.parameters[6].enabled = False
            self.parameters[7].enabled = False
        else:
            # the checkbox is false, the title is free text
            if self.parameters[2].filter.list:
                self.parameters[2].filter.list = []

            # enable folder, sharing level and group sharing parameters when creating a new IPDS
            self.parameters[5].enabled = True
            self.parameters[6].enabled = True
            self.parameters[7].enabled = True

        return

    def updateMessages(self):
        in_ips_datasets = self.parameters[0]
        ips_dataset_name = self.parameters[1]
        title = self.parameters[2]
        summary = self.parameters[3]
        sharing_level = self.parameters[6]
        group_sharing = self.parameters[7]
        update_existing = self.parameters[10]

        global existing_services

        try:
            """Modify the messages created by internal validation for each tool
            parameter.  This method is called after internal validation"""

            # ips_dataset_name, folder, sharing_level & group_sharing
            # validations are handled by internal validation due to using filters
            # we don't need a dictionary for warnings/errors for them, internal validation runs always
            # Error 000800 if the given ips_dataset_name in not part of the valid in_ips_datasets dataset_name values
            # Error 000800 if the given folder is not part of the portal folders belonging to the user
            # Error 000800 if the given sharing_level is not one of the 'Owner' | 'Organization' | 'Everyone'
            # Error 000800 if the given group_sharing have a value that is not in the groups the user is part of

            validate_in_ips_datasets_param(in_ips_datasets, ips_dataset_name, self.param_msgs[0])
            validate_update_existing_param(update_existing, self.param_msgs[10])
            validate_title_param(title, update_existing, existing_services, self.param_msgs[2])
            validate_summary_param(summary, self.param_msgs[3])
            validate_sharing_level(sharing_level, self.param_msgs[6])
            validate_group_sharing(group_sharing, self.param_msgs[7])

            return
        except:
            return

    def isLicensed(self):
        return v.has_license()


def validate_in_ips_datasets_param(in_ips_datasets: arcpy.Parameter,
                                   ips_dataset_name: arcpy.Parameter,
                                   param_dict: dict):
    """Validates the input parameter IPS Datasets.
    If the parameter is valid, it clears the ips_dataset_name parameter and sets a filter consisting of the dataset
    names available in the IPS Datasets. If the parameter is invalid it clears the ips_dataset_name value and clears
    the filter.

    Args:
        in_ips_datasets: the input parameter to be validated
        ips_dataset_name: parameter depending on the in_ips_dataset
        param_dict: a dictionary containing the latest message associated with the parameter;
                    an empty dict if no message was associated to this parameter yet

    Returns:
        None

    """
    if in_ips_datasets.valueAsText is not None:
        if not in_ips_datasets.hasBeenValidated:
            # parameter has to be validated, remove any previous messages
            param_dict.clear()

            # check for existence
            if not arcpy.Exists(in_ips_datasets.valueAsText):
                # error: <value> does not exist.
                param_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 110,
                    'msg_params': [in_ips_datasets.valueAsText]
                })

            # check the data element type
            elif not v.check_data_element_type(
                    data_element=in_ips_datasets.value,
                    accepted_data_types=fc_data_types):
                # error 840: the value is not a <value>.
                param_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 840,
                    'msg_params': ['Feature Class or Layer']
                })

            # check geometry type
            elif not v.check_geometry_type(
                    data_element=in_ips_datasets.value,
                    accepted_geometry_types=['Polygon']):
                # error 366: Invalid geometry type
                param_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 366,
                    'msg_params': []
                })

            # check schema
            elif not v.check_schema(
                    data_element=in_ips_datasets.value,
                    xml_schema_path=c.MODEL_LATEST.XML_PATH,
                    xml_element_name=c.MODEL_LATEST.IPS_POSITIONING_DATASETS.NAME,
                    field_attr_filter=['name', 'type'],
                    # fields_to_check=[c.FACILITY_ID_FIELD_NAME, c.SITE_ID_FIELD_NAME],
                    is_in_dataset=False):
                # error 30108: <value> is missing one or more required fields.
                param_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 30108,
                    'msg_params': [in_ips_datasets.valueAsText]
                })

            # check empty input feature class
            elif arcpy.management.GetCount(in_ips_datasets.valueAsText)[0] == '0':
                param_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 250071,
                    'msg_params': [in_ips_datasets.displayName]
                })

        if param_dict:
            # in_ips_datasets is invalid
            # display the error message
            in_ips_datasets.setIDMessage(param_dict['msg_type'], param_dict['msg_id'],
                                         *param_dict['msg_params'])
            # clear the filter and value of ips_dataset_name
            ips_dataset_name.filter.list = []
            ips_dataset_name.value = None
        else:
            # in_ips_datasets has changed and now is valid. Clear the ips_dataset_name value and set the new filter
            field_names_dict = u.create_field_name_dict(
                data_element=in_ips_datasets.valueAsText,
                xml_schema_path=M.XML_PATH,
                xml_element_name=M.IPS_POSITIONING_DATASETS.NAME,
                is_in_dataset=False
            )
            # Convert the Feature class to Dataframe to improve the performance of processing the feature class
            in_ips_datasets_df = u_db.fc2sdf(fc=in_ips_datasets.value, field_names_dict=field_names_dict)
            ips_dataset_name.filter.list = sorted(in_ips_datasets_df[
                                                      M.IPS_POSITIONING_DATASETS.FIELDS.DATASET_NAME.name].values.tolist(), key=lambda s: s.lower())


def validate_title_param(title: arcpy.Parameter,
                         update_existing: arcpy.Parameter,
                         existing_ipds: list,
                         param_dict: dict):
    """Validates the input parameter title.

    Args:
        title: the input parameter to be validated
        update_existing: the input parameter for enabling the update functionality
        existing_ipds: a list of the existing Indoor Positioning Data Services on the current portal
        param_dict: a dictionary containing the latest message associated with the parameter;
                    an empty dict if no message was associated to this parameter yet

    Returns:
        None

    """
    if not user_has_publish_features_privilege():
        # clear the possibly existing errors
        param_dict.clear()

        # a user without the privilege to share hosted features cannot run this tool
        param_dict.update({
            'msg_type': "ERROR",
            'msg_id': 1983,
            'msg_params': []
        })
    elif not title.hasBeenValidated or not update_existing.hasBeenValidated:
        # parameter has to be validated, remove any previous messages
        param_dict.clear()

        if not v.has_valid_first_letter(title.valueAsText):
            # a title can't start with a special character or a number
            param_dict.update({
                'msg_type': "ERROR",
                'msg_id': 250095,
                'msg_params': []
            })

        elif not v.has_valid_name(title.valueAsText):
            # the title can't contain any special characters
            param_dict.update({
                'msg_type': "ERROR",
                'msg_id': 250095,
                'msg_params': []
            })

        elif not v.has_valid_length(title.valueAsText, length=120):
            # <Title> cannot exceed 120 characters
            param_dict.update({
                'msg_type': "ERROR",
                'msg_id': 130015,
                'msg_params': [title.displayName, 120]
            })

        elif title.valueAsText in existing_ipds:
            if update_existing.value:
                # warning message that there is an IPDS with the same name, it will be updated
                param_dict.update({
                    'msg_type': "WARNING",
                    'msg_id': 250106,
                    'msg_params': []
                })
            else:
                # error message that there is an IPDS with the same name, can't publish with same name
                param_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 250098,
                    'msg_params': [title.valueAsText]
                })

    # if there is any message associated to this parameter, set it
    if param_dict:
        # display the error message
        title.setIDMessage(param_dict['msg_type'], param_dict['msg_id'],
                           *param_dict['msg_params'])


def validate_summary_param(summary: arcpy.Parameter, param_dict: dict):
    """Validates the input parameter summary. The only restriction
    is the length must be up to 2048 characters.

    Args:
        summary: the input parameter to be validated
        param_dict: a dictionary containing the latest message associated with the parameter;
                    an empty dict if no message was associated to this parameter yet

    Returns:
        None

    """
    if not summary.hasBeenValidated:
        # parameter has to be validated, remove any previous messages
        param_dict.clear()

        if not v.has_valid_length(summary.valueAsText, length=2048):
            # <Summary> cannot exceed 2048 characters.
            param_dict.update({
                'msg_type': "ERROR",
                'msg_id': 130015,
                'msg_params': [summary.displayName, 2048]
            })

    # if there is any message associated to this parameter, set it
    if param_dict:
        # display the error message
        summary.setIDMessage(param_dict['msg_type'], param_dict['msg_id'],
                             *param_dict['msg_params'])


def validate_sharing_level(sharing_level: arcpy.Parameter, param_dict: dict):
    """Validates the user has privileges to publish the service for the sharing level.

    Args:
        sharing_level: the input parameter to be validated
        param_dict: a dictionary containing the latest message associated with the parameter;
                    an empty dict if no message was associated to this parameter yet

    Returns:
        None

    """
    if sharing_level.valueAsText is None:
        param_dict.update({
            'msg_type': "ERROR",
            'msg_id': 800,
            'msg_params': [' | '.join(sharing_level.filter.list)]
        })
    elif not sharing_level.hasBeenValidated:
        # parameter has to be validated, remove any previous messages
        param_dict.clear()

        active_portal = arcpy.GetActivePortalURL()
        user_privileges = sipds_u.get_user_privileges(portal_url=active_portal)
        org_privileges = 'portal:user:shareToOrg'
        everyone_privileges = 'portal:user:shareToPublic'

        # check for privileges
        if sharing_level.valueAsText.upper() == sipds_c.SHARING_LEVEL_ORGANIZATION:
            has_org_privileges = org_privileges in user_privileges
            if not has_org_privileges:
                param_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 250097,
                    'msg_params': [sipds_c.SHARING_LEVEL_ORGANIZATION]
                })

        elif sharing_level.valueAsText.upper() == sipds_c.SHARING_LEVEL_EVERYONE:
            has_everyone_privileges = everyone_privileges in user_privileges
            if not has_everyone_privileges:
                param_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 250097,
                    'msg_params': [sipds_c.SHARING_LEVEL_EVERYONE]
                })

    # if there is any message associated to this parameter, set it
    if param_dict:
        # display the error message
        sharing_level.setIDMessage(param_dict['msg_type'], param_dict['msg_id'],
                                   *param_dict['msg_params'])


def validate_group_sharing(group_sharing: arcpy.Parameter, param_dict: dict):
    """Validates the user has privileges to publish the service for the sharing level.

    Args:
        group_sharing: the input parameter to be validated
        param_dict: a dictionary containing the latest message associated with the parameter;
                    an empty dict if no message was associated to this parameter yet

    Returns:
        None

    """
    if not group_sharing.hasBeenValidated:
        # parameter has to be validated, remove any previous messages
        param_dict.clear()

        if group_sharing.valueAsText:
            # transform ; separated values to a list of strings
            # also replace any ' that are placed in case of an empty character in group name
            groups_s = group_sharing.valueAsText.split(";")
        else:
            groups_s = None

        if groups_s is not None and len(groups_s) > 0:
            active_portal = arcpy.GetActivePortalURL()
            user_privileges = sipds_u.get_user_privileges(portal_url=active_portal)
            group_privileges = 'portal:user:shareToGroup'
            has_group_privilege = group_privileges in user_privileges
            if not has_group_privilege:
                param_dict.update({
                    'msg_type': "ERROR",
                    'msg_id': 250097,
                    'msg_params': [sipds_c.SHARING_WITH_GROUP]
                })

    # if there is any message associated to this parameter, set it
    if param_dict:
        # display the error message
        group_sharing.setIDMessage(param_dict['msg_type'], param_dict['msg_id'],
                                   *param_dict['msg_params'])


def user_has_publish_features_privilege() -> bool:
    """Validates the user has privileges to publish a **hosted** feature service."""
    active_portal = arcpy.GetActivePortalURL()
    user_privileges = sipds_u.get_user_privileges(portal_url=active_portal)
    publish_feature_privilege = 'portal:publisher:publishFeatures'

    return publish_feature_privilege in user_privileges


def validate_update_existing_param(update_existing: arcpy.Parameter, param_dict: dict):
    """Validates whether there are updatable Indoor Positioning Data Services if the update is Enabled.

    Args:
        update_existing: the input parameter for enabling the update functionality
        param_dict: a dictionary containing the latest message associated with the parameter;
                    an empty dict if no message was associated to this parameter yet

    Returns:
        None
    """
    if not update_existing.hasBeenValidated:
        # parameter has to be validated, remove any previous messages
        param_dict.clear()

        if update_existing.value and not existing_services:
            # <Summary> cannot exceed 2048 characters.
            param_dict.update({
                'msg_type': "ERROR",
                'msg_id': 250107,
                'msg_params': []
            })

    # if there is any message associated to this parameter, set it
    if param_dict:
        # display the error message
        update_existing.setIDMessage(param_dict['msg_type'], param_dict['msg_id'],
                                     *param_dict['msg_params'])
