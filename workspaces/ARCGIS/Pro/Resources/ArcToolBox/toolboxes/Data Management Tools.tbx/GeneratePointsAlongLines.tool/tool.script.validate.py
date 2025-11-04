import arcpy


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""

        self.params[1].parameterDependencies = [0]
        self.params[1].schema.clone = True
        self.params[1].schema.geometryTypeRule = "AsSpecified"
        self.params[1].schema.geometryType = "Point"
        self.params[1].schema.fieldsRule = "AllNoFIDs"

        id_field = arcpy.Field()
        id_field.name = "ORIG_FID"
        id_field.type = "Integer"

        self.params[1].schema.additionalFields = [id_field]

        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        if self.params[2].value == 'PERCENTAGE':
            self.params[3].enabled = False
            self.params[4].enabled = True
            self.params[7].enabled = False
            self.params[8].enabled = False

            self.params[3].value = None
            self.params[7].value = None
        elif self.params[2].value == 'DISTANCE_FIELD':
            self.params[3].enabled = False
            self.params[4].enabled = False
            self.params[7].enabled = True
            self.params[8].enabled = False

            self.params[3].value = None
            self.params[4].value = None
        else:  # 'DISTANCE' or unset
            self.params[3].enabled = True
            self.params[4].enabled = False
            self.params[7].enabled = False
            self.params[8].enabled = True

            self.params[4].value = None
            self.params[7].value = None
            self.params[8].value = 'PLANAR'

        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""

        # Whichever is used (distance or percentage), value must be greater than zero
        if self.params[4].enabled:
            if self.params[4].value in [0, None]:
                if self.params[0].value:
                    self.params[4].setIDMessage('ERROR', 530)
        elif self.params[3].enabled:
            try:
                distance = self.params[3].valueAsText
                distance = distance.split(' ')[0]
                if distance == '0':
                    if self.params[0].value:
                        self.params[3].setIDMessage('ERROR', 530)
            except AttributeError as err:
                # Needs a value
                if self.params[0].value:
                    self.params[3].setIDMessage('ERROR', 530)
                pass

        return
