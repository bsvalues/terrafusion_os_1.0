"""
 ga_desktop_previewdatasetfrombigdataconnection.py

 Front end of 'Preview Dataset from Big Data Connection' GeoAnalytics Desktop tool.

"""

from gautils import get_value, param_cleanup, run_ga_desktop_tool, format_preview_json_messaging
from gautils.validation import validate_desktop_output, json_validator
from gautils import BigDataConnectionFile

import sys
import json
import arcpy
import ntpath
import csv
from csv import DictWriter

if __name__ == '__main__':

    params = dict(datasetPath=get_value(0),
                  previewNumber=10)
    
    bdc, dataset = ntpath.split(params['datasetPath'])
    params['connectionFile'] = bdc
    params['dataset'] = dataset

    params = param_cleanup(params)
    
    result = None
    big_data_connection = BigDataConnectionFile(bdc)
    validation_dict = BigDataConnectionFile.validate_input_bdc_sourcepath(big_data_connection)
    if validation_dict["source_path_validates"]:
        try:
            feature_collection = run_ga_desktop_tool('PreviewDataset', params)['output']
            result = json.loads(feature_collection)
        except:
            arcpy.AddIDMessage("ERROR", 242)
    else:
        path = validation_dict["source_folder_path"]
        arcpy.AddIDMessage("ERROR", 120363, path, bdc)

    # Create table and csv
    if result is not None:
        try:
            formatted_table = format_preview_json_messaging(json.loads(feature_collection))
            str = """json:\n{}""".format(formatted_table)
            arcpy.AddMessage(str)
        except Exception as e:
            pass

        if get_value(1) != "":
            with open(get_value(1), "w", encoding='utf-8-sig') as csvout:
                headers = []
                writer = csv.DictWriter(csvout, fieldnames=headers, delimiter=',', lineterminator='\n')

                fields = result["fields"]
                for f in fields:
                    headers.append(f["name"])
                writer.writeheader()

                feats = result["features"]
                for f in feats:
                    for key, val in f.items():
                        if key == "attributes":
                            writer.writerow(val)
                        else:
                            pass

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
        self.params[1].value = validate_desktop_output(self.params[1].valueAsText, True)

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        bdc_file = self.params[0]
        bdc, dataset = ntpath.split(self.params[0].valueAsText)
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
                if not json_validator(bdc_file.valueAsText):
                    bdc, dataset = ntpath.split(bdc_file.valueAsText)
                    d_bdc = arcpy.Describe(bdc)
                    if len(d_bdc.children) == 0:
                        bdc_file.setIDMessage("ERROR", 3220)
        else:
            # Not a BDC dataset (and it's required)
            self.params[0].setIDMessage("ERROR", 120295)

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True
