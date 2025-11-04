"""
  ga_desktop_removedatasetfrombdc.py

 Front end of 'Remove Dataset from Big Data Connection' GeoAnalytics Desktop tool.

"""

import arcpy
import ntpath

from gautils import get_value
from gautils import BigDataConnectionFile
from gautils.validation import json_validator

if __name__ == '__main__':

    params = dict()
    remove_datasets_list_param = get_value(0, as_list=True)

    # Validate each MFC path and get a list of datasets to remove for each MFC file
    remove_datasets = {}
    updated_bdcs = []
    for d in remove_datasets_list_param:
        bdc, dataset = ntpath.split(d)
        bdc = str(bdc).strip("'")
        dataset = str(dataset).strip("'")
        big_data_connection = BigDataConnectionFile(bdc)
        if bdc not in remove_datasets:
            # Warn if the path is invalid
            validation_dict = BigDataConnectionFile.validate_input_bdc_sourcepath(big_data_connection)
            if not validation_dict["source_path_validates"]:
                path = validation_dict["source_folder_path"]
                arcpy.AddIDMessage("WARNING", 120363, path, bdc)
            # Add bdc path and dataset
            remove_datasets[bdc] = [dataset]
        else:
            # Append dataset to bdc path
            remove_datasets[bdc].append(dataset)

    # Remove the datasets from each MFC
    for bdc, datasets in remove_datasets.items():
        big_data_connection = BigDataConnectionFile(bdc)
        try:
            big_data_connection.remove_datasets(datasets)
        except Exception as e:
            pass
        finally:
            updated_bdcs.append(bdc)
            big_data_connection.update_connection_file()

    if updated_bdcs != []:
        arcpy.SetParameterAsText(1, ";".join(updated_bdcs))


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
            output_bdcs = []
            remove_datasets = self.params[0].valueAsText.split(";")
            for d in remove_datasets:
                bdc, dataset = ntpath.split(d)
                output_bdcs.append([bdc])
            self.params[1].value = output_bdcs

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
        datasets_list = []

        remove_datasets = self.params[0].valueAsText
        bdc_datasets_split = remove_datasets.split(";")

        for d in bdc_datasets_split:
            # If there is a space in the path, the variable [d] will have both single quotes and double quotes.
            #   We need to remove the single quotes from within the double quotes in this case so that the
            #       json_validator won't fail to read the .mfc / .bdc file because of an invalid path.
            #
            #       If we don't remove the single quotes we get the following from ntpath.split():
            #           - bdc = "'C:\\Users\\...."
            #           - dataset = "datasetName'"
            #
            #   The json_validator fails because "'C:\\Users\\...." isn't a valid path with the extra ' at the start
            #       of the string since the ending ` gets split out to be at the end of the dataset string.
            if "'" in d:
                d = d.replace("'", "")
            bdc, dataset = ntpath.split(d)
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
                    if not json_validator(d):
                        bdc, dataset = ntpath.split(d)
                        d_bdc = arcpy.Describe(bdc)
                        if len(d_bdc.children) == 0:
                            self.params[0].setIDMessage("ERROR", 3220)
            else:
                # Not a BDC dataset (and it's required)
                self.params[0].setIDMessage("ERROR", 120295)

        if remove_datasets is not None:
            seen = []
            for dataset_name in bdc_datasets_split:
                if dataset_name not in [None, "#", ""]:
                    if dataset_name not in seen:
                        seen.append(dataset_name)
                    else:
                        self.params[0].setIDMessage("ERROR", 110182,
                                                    dataset_name)

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True
