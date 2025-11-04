import arcpy
import os
import sys
import ExcelToTable
import ExcelToTableX
import re

class ToolValidator(object):
    """ Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """ Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """ Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        return

    def updateParameters(self):

        """ Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parmater
        has been changed."""

        # Check that excel file exists, and that validation should be performed
        in_excel = str(self.params[0].value)
        # only try to populate the sheets within the app since it's costly
        if os.path.basename(sys.executable).lower() in ['arcgispro.exe', 'arcgisallsource.exe']:

            if os.path.exists(in_excel) or arcpy.Exists(in_excel):
                # Set the output table properties to depend on the input file
                self.params[2].parameterDependencies = [0]

                if (not self.params[0].hasBeenValidated) or (
                    not self.params[2].filter.list):
                    if os.path.splitext(in_excel)[1].upper() == ".XLSX":
                        self.params[2].filter.list = ExcelToTableX.get_sheet_names(
                            in_excel)[0]
                    else:
                        self.params[2].filter.list = ExcelToTable.get_sheet_names(
                                in_excel)
                if os.path.splitext(in_excel)[1].upper() == ".XLSX":
                    named_ranges = ExcelToTableX.get_sheet_names(in_excel)[1].keys()
                    if self.params[2].value in named_ranges:
                        # disable cell range parameter if user selects named range
                        self.params[4].enabled = False
                        # if user alters sheet or named range param, set to min value
                        # if user alters row value, ensure it's in range if not set to min
                        if ((self.params[2].altered and not self.params[2].hasBeenValidated) or
                            (self.params[3].altered and not self.params[3].hasBeenValidated)):
                            # get the minimum row of the named range and set it
                            temp_cr = ExcelToTableX.get_named_ranges(
                                in_excel, self.params[2].value)[1]
                            cell_range = temp_cr if temp_cr not in [None, '', '#'] else cell_range
                            # get the min and max rows of the named range
                            min_max_t = re.findall(r'\d+', cell_range)
                            min_max = list(map(int, min_max_t))
                            # if outside of range, set it to min
                            if (self.params[3].value < min_max[0] or
                                self.params[3].value > min_max[1]):
                                self.params[3].value = min_max[0]
                    else:
                        # if sheet, set default row to 1 and enable cell range param
                        self.params[4].enabled = True
                        if (self.params[2].altered and not self.params[2].hasBeenValidated):
                            self.params[3].value = 1

            try:
                # Validate the fieldnames, based on directory
                if self.params[1].value:
                    fields = ExcelToTable.validate_fields(in_excel,
                                                          str(self.params[1].value),
                                                          str(self.params[2].value))

                    field_names = []
                    for f in fields:
                        new_field = arcpy.Field()
                        new_field.name = f
                        field_names.append(new_field)
                    # Use these validated fields as the schema for the out table
                    self.params[1].schema.additionalFields = field_names
            except Exception as err:
                pass

            return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""

        try:
            if self.params[4].valueAsText and self.params[4].altered:
                ExcelToTable.unpack_cell_range(self.params[4].valueAsText)
        except Exception as e:
            self.params[4].setIDMessage("ERROR", 2926,
                                        'cell_range',
                                        self.params[4].valueAsText)

