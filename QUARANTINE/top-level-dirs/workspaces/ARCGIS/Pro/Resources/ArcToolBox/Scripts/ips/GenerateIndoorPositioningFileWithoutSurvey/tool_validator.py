from collections import defaultdict

import arcpy
import ips.const as c
import ips.validation as v

fc_data_types = ['FeatureLayer', 'FeatureClass', 'DEFeatureClass']
table_data_types = ['TableView', 'Table', 'DETable']


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
            parameter.  This method is called after internal validation"""

            # positioning input parameter
            positioning_param = self.parameters[0]
            # beacons input parameter
            beacons_param = self.parameters[1]
            # IPS area input parameter
            ips_area_param = self.parameters[2]
            # wall input features
            walls_param = self.parameters[3]
            # facility input features
            facility_param = self.parameters[4]
            # level input features
            level_param = self.parameters[5]
            # IPS Transition input features
            transitions_param = self.parameters[6]

            validate_positioning_param(positioning_param, self.param_msgs[0])
            validate_beacons_param(beacons_param, self.param_msgs[1])
            validate_ips_area_param(ips_area_param, self.param_msgs[2])
            validate_walls_param(walls_param, self.param_msgs[3])
            validate_facility_param(facility_param, self.param_msgs[4])
            validate_level_param(level_param, self.param_msgs[5])
            validate_transitions_param(transitions_param, self.param_msgs[6])

            return
        except:
            return

    def isLicensed(self):
        return v.has_license()


def validate_positioning_param(positioning_param: arcpy.Parameter, positioning_msg_dict: dict):
    """validates the positioning parameter of this tool.
       Args:
          positioning_param: the parameter to be validated
          positioning_msg_dict: a dictionary containing the latest message associated with the parameter; an empty dict
               if no message was associated to this parameter yet
    """
    if not positioning_param.hasBeenValidated:
        # reset param messages
        positioning_msg_dict.clear()

        # check for existence
        if not arcpy.Exists(positioning_param.valueAsText):
            # error: <value> does not exist.
            positioning_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 110,
                'msg_params': [positioning_param.valueAsText]
            })

        # check the data element type
        elif not v.check_data_element_type(
                data_element=positioning_param.value,
                accepted_data_types=table_data_types):
            # error 840: the value is not a <value>.
            positioning_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 840,
                'msg_params': ['Table or Table View']
            })

        # check schema
        elif not v.check_schema(
                data_element=positioning_param.value,
                xml_schema_path=c.MODEL_30.XML_PATH,
                xml_element_name=c.MODEL_30.IPS_POSITIONING.NAME,
                field_attr_filter=['name', 'type']):
            # error 30108: <value> is missing one or more required fields.
            positioning_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 30108,
                'msg_params': [positioning_param.valueAsText]
            })

    # if there is any message associated to this parameter, set it
    if positioning_msg_dict:
        # display the error message
        positioning_param.setIDMessage(positioning_msg_dict['msg_type'], positioning_msg_dict['msg_id'],
                                       *positioning_msg_dict['msg_params'])

    return


def validate_beacons_param(beacons_param: arcpy.Parameter, beacons_msg_dict: dict):
    """validates the beacons parameter of this tool.
       Args:
          beacons_param: the parameter to be validated
          beacons_msg_dict: a dictionary containing the latest message associated with the parameter; an empty dict
               if no message was associated to this parameter yet
    """
    if not beacons_param.hasBeenValidated:
        # reset param messages
        beacons_msg_dict.clear()

        # check for existence
        if not arcpy.Exists(beacons_param.valueAsText):
            # error: <value> does not exist.
            beacons_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 110,
                'msg_params': [beacons_param.valueAsText]
            })

        # check the data element type
        elif not v.check_data_element_type(
                data_element=beacons_param.value,
                accepted_data_types=fc_data_types):
            # error 840: the value is not a <value>.
            beacons_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 840,
                'msg_params': ['Feature Class or Layer']
            })

        # check geometry type
        elif not v.check_geometry_type(
                data_element=beacons_param.value,
                accepted_geometry_types=['Point']):
            # error 366: Invalid geometry type
            beacons_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 366,
                'msg_params': []
            })

        # check for valid spatial Reference
        elif not v.has_valid_crs(
                feature_class=beacons_param.value):
            # error 3705: Invalid Spatial Reference
            beacons_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 3705,
                'msg_params': []
            })

        # check schema
        elif not v.check_schema(
                data_element=beacons_param.value,
                xml_schema_path=c.MODEL_30.XML_PATH,
                xml_element_name=c.MODEL_30.BEACONS.NAME,
                field_attr_filter=['name', 'type'],
                fields_to_check=[c.LEVEL_ID_FIELD_NAME, c.RSSI_1M_FIELD_NAME, c.UUID_FIELD_NAME, c.MAJOR_FIELD_NAME,
                                 c.MINOR_FIELD_NAME]):
            # error 30108: <value> is missing one or more required fields.
            beacons_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 30108,
                'msg_params': [beacons_param.valueAsText]
            })

        # check empty input feature class
        elif arcpy.management.GetCount(beacons_param.valueAsText)[0] == '0':
            beacons_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 250071,
                'msg_params': [beacons_param.displayName]
            })

    # if there is any message associated to this parameter, set it
    if beacons_msg_dict:
        # display the error message
        beacons_param.setIDMessage(beacons_msg_dict['msg_type'], beacons_msg_dict['msg_id'],
                                   *beacons_msg_dict['msg_params'])
    return


def validate_ips_area_param(ips_area_param: arcpy.Parameter, ips_area_msg_dict: dict):
    """validates the ips area parameter of this tool.
       Args:
          ips_area_param: the parameter to be validated
          ips_area_msg_dict: a dictionary containing the latest message associated with the parameter; an empty dict
               if no message was associated to this parameter yet
    """
    if not ips_area_param.hasBeenValidated:
        # reset param messages
        ips_area_msg_dict.clear()

        # check for existence
        if not arcpy.Exists(ips_area_param.valueAsText):
            # error: <value> does not exist.
            ips_area_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 110,
                'msg_params': [ips_area_param.valueAsText]
            })

        # check the data element type
        elif not v.check_data_element_type(
                data_element=ips_area_param.value,
                accepted_data_types=fc_data_types):
            # error 840: the value is not a <value>.
            ips_area_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 840,
                'msg_params': ['Feature Class or Layer']
            })

        # check geometry type
        elif not v.check_geometry_type(
                data_element=ips_area_param.value,
                accepted_geometry_types=['Polygon']):
            # error 366: Invalid geometry type
            ips_area_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 366,
                'msg_params': []
            })

        # check for valid spatial Reference
        elif not v.has_valid_crs(
                feature_class=ips_area_param.value):
            # error 3705: Invalid Spatial Reference
            ips_area_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 3705,
                'msg_params': []
            })

        # check if required  fields exists
        elif not v.check_schema(
                data_element=ips_area_param.value,
                xml_schema_path=c.IPS_AREA_XML_SCHEMA_PATH,
                xml_element_name=c.IPS_AREA_NAME,
                field_attr_filter=['name', 'type'],
                fields_to_check=[c.LEVEL_ID_FIELD_NAME]):
            # error 30108: <value> is missing one or more required fields.
            ips_area_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 30108,
                'msg_params': [ips_area_param.valueAsText]
            })

        # check empty input feature class
        elif arcpy.management.GetCount(ips_area_param.valueAsText)[0] == '0':
            ips_area_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 250071,
                'msg_params': [ips_area_param.displayName]
            })

    # if there is any message associated to this parameter, set it
    if ips_area_msg_dict:
        # display the error message
        ips_area_param.setIDMessage(ips_area_msg_dict['msg_type'], ips_area_msg_dict['msg_id'],
                                    *ips_area_msg_dict['msg_params'])
    return


def validate_walls_param(walls_param: arcpy.Parameter, walls_msg_dict: dict):
    """validates the walls parameter of this tool.
       Args:
          walls_param: the parameter to be validated
          walls_msg_dict: a dictionary containing the latest message associated with the parameter; an empty dict
               if no message was associated to this parameter yet
    """
    if not walls_param.hasBeenValidated:
        # reset param messages
        walls_msg_dict.clear()

        # check for existence
        if not arcpy.Exists(walls_param.valueAsText):
            # error: <value> does not exist.
            walls_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 110,
                'msg_params': [walls_param.valueAsText]
            })

        # check the data element type
        elif not v.check_data_element_type(
                data_element=walls_param.value,
                accepted_data_types=fc_data_types):
            # error 840: the value is not a <value>.
            walls_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 840,
                'msg_params': ['Feature Class or Layer']
            })

        # check geometry type
        elif not v.check_geometry_type(
                data_element=walls_param.value,
                accepted_geometry_types=['Polygon']):
            # error 366: Invalid geometry type
            walls_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 366,
                'msg_params': []
            })

        # check for valid spatial Reference
        elif not v.has_valid_crs(
                feature_class=walls_param.value):
            # error 3705: Invalid Spatial Reference
            walls_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 3705,
                'msg_params': []
            })

        # check if required fields exist
        elif not v.check_schema(
                data_element=walls_param.value,
                xml_schema_path=c.WALLS_XML_SCHEMA_PATH,
                xml_element_name=c.WALLS_NAME,
                field_attr_filter=['name', 'type'],
                fields_to_check=[c.LEVEL_ID_FIELD_NAME]):
            # error 30108: <value> is missing one or more required fields.
            walls_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 30108,
                'msg_params': [walls_param.valueAsText]
            })

        # check empty input feature class
        elif arcpy.management.GetCount(walls_param.valueAsText)[0] == '0':
            walls_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 250071,
                'msg_params': [walls_param.displayName]
            })

    # if there is any message associated to this parameter, set it
    if walls_msg_dict:
        # display the error message
        walls_param.setIDMessage(walls_msg_dict['msg_type'], walls_msg_dict['msg_id'],
                                 *walls_msg_dict['msg_params'])
    return


def validate_facility_param(facility_param: arcpy.Parameter, facility_msg_dict: dict):
    """validates the facility parameter of this tool.
       Args:
          facility_param: the parameter to be validated
          facility_msg_dict: a dictionary containing the latest message associated with the parameter; an empty dict
               if no message was associated to this parameter yet
    """
    if not facility_param.hasBeenValidated:
        # reset param messages
        facility_msg_dict.clear()

        # check for existence
        if not arcpy.Exists(facility_param.valueAsText):
            # error: <value> does not exist.
            facility_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 110,
                'msg_params': [facility_param.valueAsText]
            })

        # check the data element type
        elif not v.check_data_element_type(
                data_element=facility_param.value,
                accepted_data_types=fc_data_types):
            # error 840: the value is not a <value>.
            facility_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 840,
                'msg_params': ['Feature Class or Layer']
            })

        # check geometry type
        elif not v.check_geometry_type(
                data_element=facility_param.value,
                accepted_geometry_types=['Polygon']):
            # error 366: Invalid geometry type
            facility_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 366,
                'msg_params': []
            })

        # check schema
        elif not v.check_schema(
                data_element=facility_param.value,
                xml_schema_path=c.INDOORS_MODEL_XML_SCHEMA_PATH,
                xml_element_name=c.FACILITIES_NAME,
                field_attr_filter=['name', 'type'],
                is_in_dataset=True,
                fields_to_check=[c.FACILITY_ID_FIELD_NAME, c.SITE_ID_FIELD_NAME]):
            # error 30108: <value> is missing one or more required fields.
            facility_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 30108,
                'msg_params': [facility_param.valueAsText]
            })

        # check empty input feature class
        elif arcpy.management.GetCount(facility_param.valueAsText)[0] == '0':
            facility_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 250071,
                'msg_params': [facility_param.displayName]
            })

    # if there is any message associated to this parameter, set it
    if facility_msg_dict:
        # display the error message
        facility_param.setIDMessage(facility_msg_dict['msg_type'], facility_msg_dict['msg_id'],
                                    *facility_msg_dict['msg_params'])
    return


def validate_level_param(level_param: arcpy.Parameter, level_msg_dict: dict):
    """validates the level parameter of this tool.
       Args:
          level_param: the parameter to be validated
          level_msg_dict: a dictionary containing the latest message associated with the parameter; an empty dict
               if no message was associated to this parameter yet
    """
    if not level_param.hasBeenValidated:
        # reset param messages
        level_msg_dict.clear()

        # check for existence
        if not arcpy.Exists(level_param.valueAsText):
            # error: <value> does not exist.
            level_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 110,
                'msg_params': [level_param.valueAsText]
            })

        # check the data element type
        elif not v.check_data_element_type(
                data_element=level_param.value,
                accepted_data_types=fc_data_types):
            # error 840: the value is not a <value>.
            level_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 840,
                'msg_params': ['Feature Class or Layer']
            })

        # check geometry type
        elif not v.check_geometry_type(
                data_element=level_param.value,
                accepted_geometry_types=['Polygon']):
            # error 366: Invalid geometry type
            level_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 366,
                'msg_params': []
            })

        # check for valid spatial Reference
        elif not v.has_valid_crs(
                feature_class=level_param.value):
            # error 3705: Invalid Spatial Reference
            level_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 3705,
                'msg_params': []
            })

        # check schema
        elif not v.check_schema(
                data_element=level_param.value,
                xml_schema_path=c.INDOORS_MODEL_XML_SCHEMA_PATH,
                xml_element_name=c.LEVELS_NAME,
                field_attr_filter=['name', 'type'],
                is_in_dataset=True,
                fields_to_check=[c.FACILITY_ID_FIELD_NAME, c.LEVEL_ID_FIELD_NAME]):
            # error 30108: <value> is missing one or more required fields.
            level_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 30108,
                'msg_params': [level_param.valueAsText]
            })

        # check empty input feature class
        elif arcpy.management.GetCount(level_param.valueAsText)[0] == '0':
            level_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 250071,
                'msg_params': [level_param.displayName]
            })

    # if there is any message associated to this parameter, set it
    if level_msg_dict:
        # display the error message
        level_param.setIDMessage(level_msg_dict['msg_type'], level_msg_dict['msg_id'],
                                 *level_msg_dict['msg_params'])
    return


def validate_transitions_param(transitions_param: arcpy.Parameter, transitions_msg_dict: dict):
    """validates the transitions parameter of this tool.
       Args:
          transitions_param: the parameter to be validated
          transitions_msg_dict: a dictionary containing the latest message associated with the parameter; an empty dict
               if no message was associated to this parameter yet
    """
    if not transitions_param.hasBeenValidated:
        # reset param messages
        transitions_msg_dict.clear()

        # check for existence
        if not arcpy.Exists(transitions_param.valueAsText):
            # error: <value> does not exist.
            transitions_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 110,
                'msg_params': [transitions_param.valueAsText]
            })

        # check the data element type
        elif not v.check_data_element_type(
                data_element=transitions_param.value,
                accepted_data_types=fc_data_types):
            # error 840: the value is not a <value>.
            transitions_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 840,
                'msg_params': ['Feature Class or Layer']
            })

        # check geometry type
        elif not v.check_geometry_type(
                data_element=transitions_param.value,
                accepted_geometry_types=['Polyline']):
            # error 366: Invalid geometry type
            transitions_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 366,
                'msg_params': []
            })

        # check fields
        elif not v.check_schema(
                data_element=transitions_param.value,
                xml_schema_path=c.TRANSITIONS_XML_SCHEMA_PATH,
                xml_element_name=c.TRANSITIONS_NAME,
                field_attr_filter=['name', 'type'],
                is_in_dataset=True,
                fields_to_check=[c.VERTICAL_ORDER_FROM_FIELD_NAME, c.VERTICAL_ORDER_TO_FIELD_NAME,
                                 c.TRANSITION_TYPE_FIELD_NAME]):
            transitions_msg_dict.update({
                'msg_type': "ERROR",
                'msg_id': 30108,
                'msg_params': [transitions_param.valueAsText]
            })

    # if there is any message associated to this parameter, set it
    if transitions_msg_dict:
        # display the error message
        transitions_param.setIDMessage(transitions_msg_dict['msg_type'], transitions_msg_dict['msg_id'],
                                       *transitions_msg_dict['msg_params'])
    return
