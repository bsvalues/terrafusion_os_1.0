import arcpy


class ToolValidator:
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup the Geoprocessor and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""

        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parmater
        has been changed."""
        # Get the schema object for the output feature class
        outSchema = self.params[1].schema

        # Create a new double field for the distance value
        newField = arcpy.Field()
        newField.type = "Double"

        # If a field name is provided, use it, otherwise use the default name
        if self.params[4].value:
            newField.name = self.params[4].value
        else:
            newField.name = "distance"
        outFields = []
        outFields.append(newField)

        # Add the list of fields to the output's schema object
        if self.params[5].value == "ALL":
            outSchema.fieldsRule = "None"
        else:
            outSchema.fieldsRule = "FirstDependency"

        outSchema.additionalFields = outFields

        input_fc = self.params[0]

        # If the input is polygon, enable the Outside Polygons Only parameter
        if input_fc and not self.params[0].hasBeenValidated:           
            try:
                desc = arcpy.Describe(input_fc)
                if desc.shapeType == "Polygon":
                    self.params[6].enabled = True
                else:
                    self.params[6].enabled = False
            except:
                self.params[6].enabled = True

        # Set the initial state of parameter based on the input data
        if input_fc and not self.params[7].value:
            try:
                if 'desc' not in vars():
                    desc = arcpy.Describe(input_fc)
                if desc.spatialReference.linearUnitName:
                    self.params[7].value = 'PLANAR'
                else:
                    self.params[7].value = 'GEODESIC'
            except AttributeError:
                # No linearUnitName
                self.params[7].value = 'GEODESIC'

        # Make sure the list of distances has no duplicate values and in
        # ascending size
        distances = self.params[2].values
        if distances:
            self.params[2].values = sorted(set(distances))

        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""

        distances = self.params[2].values
        if distances:
            try:
                shape_type = arcpy.Describe(self.params[0]).shapeType
                if shape_type != 'Polygon':

                    for distance in distances:
                        if distance == 0:
                            self.params[2].setIDMessage('ERROR', 26)
                            break
                        elif distance < 0:
                            self.params[2].setIDMessage('ERROR', 109)
                            break
            except:
                pass

        return
