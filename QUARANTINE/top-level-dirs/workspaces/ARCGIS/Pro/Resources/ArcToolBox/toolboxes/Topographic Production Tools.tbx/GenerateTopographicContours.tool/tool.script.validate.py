import arcpy
import DefenseUtilities as utils


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""
        # self.params[4].enabled = False

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        # Getting subtypes from input feature class
        if self.params[2].value:
            desc = arcpy.Describe(self.params[2].value)
            names = []
            subtypes = arcpy.da.ListSubtypes(desc.catalogPath)
            for stcode, stdict in list(subtypes.items()):
                if len(stdict.keys()) > 0:
                    if stdict['SubtypeField'] != '':
                        self.params[4].enabled = True
                        for stkey in list(stdict.keys()):
                            if stkey == 'Name':
                                names.append(stdict[stkey])
            self.params[4].filter.list = names

            # Getting default fields if Defense schema
            fcname = desc.catalogPath.split('\\')[-1]
            if 'ContourL' in fcname or 'HypsographyCrv' in fcname:
                fields = arcpy.ListFields(desc.catalogPath)
                for field in fields:
                    if field.name == 'ZVH':
                        if not self.params[3].altered:
                            self.params[3].value = field.name
                    elif field.name == 'HQC':
                        if not self.params[11].altered:
                            self.params[11].value = field.name
                    if not self.params[13].altered:
                        self.params[13].value = 1
                    if not self.params[14].altered:
                        self.params[14].value = 2
                    if not self.params[15].altered:
                        self.params[15].value = 5
                    if not self.params[16].altered:
                        self.params[16].value = 6

        # Setting contour interval based on scale
        if not self.params[5].hasBeenValidated:
            if self.params[5].value:
                if self.params[5].value == ' ':
                    self.params[7].value = None
                    self.params[9].value = None
                    self.params[12].value = None
                    self.params[17].value = None
                    self.params[18].value = None
                    self.params[19].value = None
                if self.params[5].value == '1:5,000':
                    if self.params[7].value == None:
                        self.params[7].value = 5
                    if self.params[9].value == None:
                        self.params[9].value = 1
                    if self.params[12].value == None:
                        self.params[12].value = 25
                    if self.params[17].value == None:
                        self.params[17].value = 0.075
                    if self.params[18].value == None:
                        self.params[18].value = '20 Meters'
                    if self.params[19].value == None:
                        self.params[19].value = '15 Meters'
                elif self.params[5].value == '1:10,000':
                    if self.params[7].value == None:
                        self.params[7].value = 5
                    if self.params[9].value == None:
                        self.params[9].value = 1
                    if self.params[12].value == None:
                        self.params[12].value = 25
                    if self.params[17].value == None:
                        self.params[17].value = 0.075
                    if self.params[18].value == None:
                        self.params[18].value = '40 Meters'
                    if self.params[19].value == None:
                        self.params[19].value = '30 Meters'
                elif self.params[5].value == '1:12,500':
                    if self.params[7].value == None:
                        self.params[7].value = 5
                    if self.params[9].value == None:
                        self.params[9].value = 1
                    if self.params[12].value == None:
                        self.params[12].value = 25
                    if self.params[17].value == None:
                        self.params[17].value = 0.075
                    if self.params[18].value == None:
                        self.params[18].value = '40 Meters'
                    if self.params[19].value == None:
                        self.params[19].value = '30 Meters'
                elif self.params[5].value == '1:25,000':
                    if self.params[7].value == None:
                        self.params[7].value = 10
                    if self.params[9].value == None:
                        self.params[9].value = 1
                    if self.params[12].value == None:
                        self.params[12].value = 50
                    if self.params[17].value == None:
                        self.params[17].value = 0.15
                    if self.params[18].value == None:
                        self.params[18].value = '75 Meters'
                    if self.params[19].value == None:
                        self.params[19].value = '50 Meters'
                elif self.params[5].value == '1:50,000':
                    if self.params[7].value == None:
                        self.params[7].value = 20
                    if self.params[9].value == None:
                        self.params[9].value = 1
                    if self.params[12].value == None:
                        self.params[12].value = 100
                    if self.params[17].value == None:
                        self.params[17].value = 0.3
                    if self.params[18].value == None:
                        self.params[18].value = '150 Meters'
                    if self.params[19].value == None:
                        self.params[19].value = '50 Meters'
                elif self.params[5].value == '1:100,000':
                    if self.params[7].value == None:
                        self.params[7].value = 40
                    if self.params[9].value == None:
                        self.params[9].value = 1
                    if self.params[12].value == None:
                        self.params[12].value = 200
                    if self.params[17].value == None:
                        self.params[17].value = 0.3
                    if self.params[18].value == None:
                        self.params[18].value = '300 Meters'
                    if self.params[19].value == None:
                        self.params[19].value = '100 Meters'
                elif self.params[5].value == '1:250,000':
                    if self.params[7].value == None:
                        self.params[7].value = 328
                    if self.params[9].value == None:
                        self.params[9].value = 3.28084
                    if self.params[12].value == None:
                        self.params[12].value = 1645
                    if self.params[17].value == None:
                        self.params[17].value = 0.6
                    if self.params[18].value == None:
                        self.params[18].value = '1000 Feet'
                    if self.params[19].value == None:
                        self.params[19].value = '500 Feet'
                elif self.params[5].value == '1:500,000':
                    if self.params[7].value == None:
                        self.params[7].value = 500
                    if self.params[9].value == None:
                        self.params[9].value = 3.28084
                    if self.params[12].value == None:
                        self.params[12].value = 2500
                    if self.params[17].value == None:
                        self.params[17].value = 0.6
                    if self.params[18].value == None:
                        self.params[18].value = '1000 Feet'
                    if self.params[19].value == None:
                        self.params[19].value = '500 Feet'
                elif self.params[5].value == '1:1,000,000':
                    if self.params[7].value == None:
                        self.params[7].value = 1000
                    if self.params[9].value == None:
                        self.params[9].value = 3.28084
                    if self.params[12].value == None:
                        self.params[12].value = 5000
                    if self.params[17].value == None:
                        self.params[17].value = 0.6
                    if self.params[18].value == None:
                        self.params[18].value = '1000 Feet'
                    if self.params[19].value == None:
                        self.params[19].value = '500 Feet'

        if self.params[20].valueAsText == "NONE":
            self.params[21].enabled = False
            self.params[22].enabled = False
            self.params[23].enabled = False
        elif self.params[20].valueAsText == "HALF_AUXILIARY":
            self.params[21].enabled = True
            self.params[22].enabled = False
            self.params[23].enabled = True
        else:
            self.params[21].enabled = True
            self.params[22].enabled = True
            self.params[23].enabled = True

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
        # # Checking AOI feature for selection
        # if self.params[1].value:
        #     desc = arcpy.Describe(self.params[1].value)
        #     selection = str(desc.fidset.split(';'))
        #     if selection == "['']" or len(selection.split(',')) > 1:
        #         self.params[1].setErrorMessage(
        #             'Area of Interest feature must have one feature selected')
        
    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        if ( utils.isLicensed( ['Advanced', 'Server'], ['Foundation','Defense'])):
            return True
        else:
            arcpy.AddIDMessage("ERROR", 824)
            return False    
