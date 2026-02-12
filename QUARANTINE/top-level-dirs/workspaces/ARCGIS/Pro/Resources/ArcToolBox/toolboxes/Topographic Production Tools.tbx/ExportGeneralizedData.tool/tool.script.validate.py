import arcpy
import os
import TopographicGeneralizationUtilities as topoUtils
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
        if self.params[2].value:
            if self.params[2].altered and not self.params[2].hasBeenValidated:
                rule_file = str(self.params[2].value)
                file_name, file_extension = os.path.splitext(rule_file)
                if file_extension in ('.xlsx', '.xlsm'):
                    if os.path.exists(rule_file):
                        theme_list = self.listThemes(rule_file)
                        self.params[3].filter.list = theme_list
        else:
            self.params[3].filter.list = []
        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
        if self.params[2].value:
            rule_file = str(self.params[2].value)
            file_name, file_extension = os.path.splitext(rule_file)
            if file_extension not in ('.xlsx', '.xlsm'):
                self.params[2].setIDMessage('ERROR', 814)
            else:
                if os.path.exists(rule_file):
                    theme_list = self.listThemes(rule_file)
                    if not theme_list:
                        # Unable to open file %1 with field %2
                        self.params[2].setIDMessage('ERROR', 10272, rule_file, 'THEMES')
        if self.params[3].value:
            self.params[3].clearMessage()
        return

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        if ( utils.isLicensed( ['Standard','Advanced', 'Server'], ['Foundation','Defense'])):
            return True
        else:
            arcpy.AddIDMessage("ERROR", 824)
            return False    

    def listThemes(self, rule_file):
        try:
            rule_book = topoUtils.OpenWorkbook(rule_file)
            if not rule_book:
                return []
            rule_sheet = topoUtils.CheckSheets(rule_book, 'Rules', 0)
            if not rule_sheet:
                return []

            theme_set = set()
            title_cells = []
            for cell in rule_sheet[1]:
                title_cells.append(cell.value)
            for index, title in enumerate(title_cells):
                if title.replace(' ', '').lower().find(":objectclass") > -1:
                    colon = title.find(":")
                    theme = title[0:colon]
                    if theme:
                        theme_set.add(theme.strip())

        except Exception as e:
            return []

        themes = list(theme_set)
        themes.sort()
        return themes
