import arcpy
import ips.const as c
import ips.validation as v


class ToolValidator:
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

            # recordings input parameter
            recordings_param = self.parameters[0]
            # positioning input parameter
            positioning_param = self.parameters[1]
            # transitions input parameter
            transitions_param = self.parameters[2]

            fc_data_types = ['FeatureLayer', 'FeatureClass', 'DEFeatureClass']
            table_data_types = ['TableView', 'Table', 'DETable']

            if recordings_param.altered:
                # check for existence
                if not arcpy.Exists(recordings_param.valueAsText):
                    # error: <value> does not exist.
                    recordings_param.setIDMessage(
                        'ERROR', 110, recordings_param.valueAsText
                    )

                # check the data element type
                elif not v.check_data_element_type(
                        data_element=recordings_param.value,
                        accepted_data_types=fc_data_types):
                    # error 840: the value is not a <value>.
                    recordings_param.setIDMessage(
                        'ERROR', 840, 'Feature Class or Layer')

                # check geometry type
                elif not v.check_geometry_type(
                        data_element=recordings_param.value,
                        accepted_geometry_types=['Polyline']):
                    # error 366: Invalid geometry type
                    recordings_param.setIDMessage('ERROR', 366)

                # check schema
                elif not v.check_schema(
                        data_element=recordings_param.value,
                        xml_schema_path=c.MODEL_30.XML_PATH,
                        xml_element_name=c.MODEL_30.IPS_RECORDINGS.NAME,
                        field_attr_filter=['name', 'type']):
                    # error 30108: <value> is missing one or more required fields.
                    recordings_param.setIDMessage(
                        'ERROR', 30108, recordings_param.valueAsText)

            if positioning_param.altered:
                # check for existence
                if not arcpy.Exists(positioning_param.valueAsText):
                    # error: <value> does not exist.
                    positioning_param.setIDMessage(
                        'ERROR', 110, positioning_param.valueAsText)

                # check the data element type
                elif not v.check_data_element_type(
                        data_element=positioning_param.value,
                        accepted_data_types=table_data_types):
                    # error 840: the value is not a <value>.
                    positioning_param.setIDMessage(
                        'ERROR', 840, 'Table or Table View')

                # check schema
                elif not v.check_schema(
                        data_element=positioning_param.value,
                        xml_schema_path=c.MODEL_30.XML_PATH,
                        xml_element_name=c.MODEL_30.IPS_POSITIONING.NAME,
                        field_attr_filter=['name', 'type']):
                    # error 30108: <value> is missing one or more required fields.
                    positioning_param.setIDMessage(
                        'ERROR', 30108, positioning_param.valueAsText)

            if transitions_param.altered:
                # check for existence
                if not arcpy.Exists(transitions_param.valueAsText):
                    # error: <value> does not exist.
                    transitions_param.setIDMessage(
                        'ERROR', 110, transitions_param.valueAsText)

                # check the data element type
                elif not v.check_data_element_type(
                        data_element=transitions_param.value,
                        accepted_data_types=fc_data_types):
                    # error 840: the value is not a <value>.
                    transitions_param.setIDMessage(
                        'ERROR', 840, 'Feature Class or Layer')

                # check geometry type
                elif not v.check_geometry_type(
                        data_element=transitions_param.value,
                        accepted_geometry_types=['Polyline']):
                    # error 366: Invalid geometry type
                    transitions_param.setIDMessage('ERROR', 366)

                # check fields
                elif not v.check_schema(
                        data_element=transitions_param.value,
                        xml_schema_path=c.TRANSITIONS_XML_SCHEMA_PATH,
                        xml_element_name=c.TRANSITIONS_NAME,
                        field_attr_filter=['name', 'type'],
                        is_in_dataset=True,
                        fields_to_check=[c.VERTICAL_ORDER_FROM_FIELD_NAME, c.VERTICAL_ORDER_TO_FIELD_NAME,
                                         c.TRANSITION_TYPE_FIELD_NAME]):
                    transitions_param.setIDMessage(
                        'ERROR', 30108, transitions_param.valueAsText)

            return
        except Exception:
            return

    def isLicensed(self):
        return v.has_license()
