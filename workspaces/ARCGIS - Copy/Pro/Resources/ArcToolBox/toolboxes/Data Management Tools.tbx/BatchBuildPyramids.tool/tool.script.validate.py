class ToolValidator:
    """ Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """ Setup the Geoprocessor and the list of tool parameters."""
        import arcgisscripting as ARC
        self.GP = ARC.create(9.3)
        self.params = self.GP.getparameterinfo()

    def initializeParameters(self):
        """ Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        pyramidsetting = self.GP.pyramid.split(' ')

        self.params[1].value = pyramidsetting[1]
        if pyramidsetting[5] == "NO_SKIP":
            self.params[2].value = False
        else:
            self.params[2].value = True
        self.params[3].value = pyramidsetting[2]
        self.params[4].value = pyramidsetting[3]
        self.params[5].value = pyramidsetting[4]

        return

    def updateParameters(self):
        """ Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parmater
        has been changed."""

        if self.params[4].value != "JPEG":
            self.params[5].enabled = 0
        else:
            self.params[5].enabled = 1

        if self.params[5].enabled == 1:
            if self.params[5].value > 100 or self.params[5].value < 1:
                self.params[5].value = 75

        if self.params[1].value < -1:
            self.params[1].value = -1

        return

    def updateMessages(self):
        """ Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        return
