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

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        try:
            if self.params[0].value and self.params[1].value:
                if self.params[4].value:
                    conn = arcpy.wmx.Connect(self.params[4].value.value)
                else:
                    conn = arcpy.wmx.Connect()
                job = conn.getJob(self.params[0].value)
                table_list = job.listExtendedProperties()
                final_list = []
                for table in table_list:
                    final_list.append(table.split('.')[-1])
                self.params[2].filter.list = final_list
            if self.params[0].value and self.params[1].value and self.params[
                2].value:
                for table in table_list:
                    if self.params[2].value in table:
                        prop_dict = job.getExtendedPropertyTable(f'{table}')
                        keys = []
                        for prop in prop_dict:
                            keys.append(prop[0])
                self.params[3].filter.list = keys
        except:
            if self.params[0].value and self.params[4].value:
                conn = arcpy.wmx.Connect(self.params[4].value.value)
                job = conn.getJob(self.params[0].value)
                table_list = job.getExtendedProperties()
                final_list = []
                for table in table_list:
                    final_list.append(table.split('.')[-1])
                self.params[2].filter.list = final_list
            if self.params[0].value and self.params[2].value and self.params[
                4].value:
                for table in table_list:
                    if self.params[2].value in table:
                        prop_dict = job.getExtendedPropertyTable(f'{table}')
                        keys = []
                        for prop in prop_dict:
                            keys.append(prop[0])
                self.params[3].filter.list = keys

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        if ( utils.isLicensed( ['Standard','Advanced'], ['Foundation','Defense'])):
            return True
        else:
            arcpy.AddIDMessage("ERROR", 824)
            return False    
