"""
 ga_desktop_duplicatedatasetfrombdc.py

 Front end of 'Duplicate Dataset from Big Data Connection' GeoAnalytics Desktop tool.

"""

import arcpy
import ntpath
import os


from gautils import get_value, param_cleanup
from gautils import BigDataConnectionFile
from gautils.validation import invalid_bdc_characters, json_validator

if __name__ == '__main__':

    params = dict(duplicate_dataset=get_value(0, as_value=True),
                  duplicate_name=get_value(1, as_value=True))
    dataset_path = str(params['duplicate_dataset'])
    name_string = str(params['duplicate_name'])
    params = param_cleanup(params)

    bdc, dataset = ntpath.split(dataset_path)

    big_data_connection = BigDataConnectionFile(bdc)

    # Warn if the path is invalid
    validation_dict = BigDataConnectionFile.validate_input_bdc_sourcepath(big_data_connection)
    if not validation_dict["source_path_validates"]:
        path = validation_dict["source_folder_path"]
        arcpy.AddIDMessage("WARNING", 120363, path, bdc)

    duplicate_datasets = {'duplicate_datasets': [{"dataset_to_copy": dataset, "name": name_string}]}

    big_data_connection.duplicate_datasets(duplicate_datasets)

    big_data_connection.update_connection_file()

    duplicate_dataset = os.path.join(bdc, name_string)
    arcpy.SetParameterAsText(2, duplicate_dataset)


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.
        This method is called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        if self.params[0].value:
            if self.params[1].value:
                bdc, dataset = ntpath.split(self.params[0].valueAsText)
                duplicate_dataset = os.path.join(bdc, self.params[1].value)
                self.params[2].value = duplicate_dataset

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
        bdc, dataset = ntpath.split(self.params[0].valueAsText)
        bdc_file = self.params[0]
        if ".mfc" in bdc or ".bdc" in bdc:
            try:
                validate = json_validator(bdc)
                if validate is False:
                    # JSON file isn't valid
                    self.params[0].setIDMessage("ERROR", 3220)
                elif validate is True:
                    pass
                else:
                    # Dataset doesn't exist in the BDC file
                    self.params[0].setIDMessage("ERROR", 120292, dataset)
            except:
                if not json_validator(bdc):
                    bdc, dataset = ntpath.split(bdc)
                    d_bdc = arcpy.Describe(bdc)
                    if len(d_bdc.children) == 0:
                        self.params[0].setIDMessage("ERROR", 3220)
        else:
            # Not a BDC dataset (and it's required)
            self.params[0].setIDMessage("ERROR", 120295)
        
        duplicate_name = self.params[1].value
        if duplicate_name:
            invalid_chars = invalid_bdc_characters(duplicate_name)
            if invalid_chars:
                self.params[1].setIDMessage("ERROR", 120274)


    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

