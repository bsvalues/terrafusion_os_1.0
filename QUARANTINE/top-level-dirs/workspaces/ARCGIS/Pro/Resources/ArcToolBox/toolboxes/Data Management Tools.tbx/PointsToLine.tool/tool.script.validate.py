class ToolValidator:
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup the Geoprocessor and the list of tool parameters."""
        import arcgisscripting as ARC
        self.GP = ARC.create(9.3)
        self.params = self.GP.getparameterinfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""

        self.params[1].Schema.GeometryType = "Polyline"
        self.params[1].Schema.FieldsRule = "AllFIDsOnly"

        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parmater
        has been changed."""

        if self.params[2].altered:
            if self.params[0].value and self.params[2].value:
                field = self.GP.CreateObject("Field")
                field.name = self.params[2].value.value
                self.params[1].Schema.AdditionalFields = [field]
        
        self.params[6].enabled = True
        if self.params[6].value not in ["BOTH_ENDS","START", "END"]:
            self.params[7].enabled = False
        else:
            self.params[7].enabled = True
            
        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        return
