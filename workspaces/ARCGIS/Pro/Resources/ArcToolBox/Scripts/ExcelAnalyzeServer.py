"""
Tool name: ExcelAnalyzeServer
Source: ExcelAnalyzeServer.py
Author: ESRI

This function returns information about an excel file.

It supports both *.xls and *.xlsx formats.

The function is used by the Analyze and Publish operations in on-premise Portals.

For each sheet in the excel file it will return the sheet name, id, and the list of fields.
The result is a json with this syntax:

  { "sheets" : [ <sheet1>, <sheet2>,...]}

where each sheet is an object like the following:

  { "name" : <name>, "id": <id>, "fields": [ {"name": <fname>, "type": <ftype>, "length": <theLength> },  ]}

"""

import os
import arcpy
import ExcelAnalyze
import ExcelAnalyzeX
import ExcelAnalyze31
import ExcelAnalyzeX31


if __name__ == "__main__":
    # Get the parameters from the script tool
    kwargs = {"in_excel": arcpy.GetParameterAsText(0),
              "validate_workspace": arcpy.GetParameterAsText(1)}

    field_type_version = arcpy.GetParameterAsText(2)

    if not field_type_version:
      field_type_version = "V2"

    use31Types = field_type_version == "V1"

    isXlsx = os.path.splitext(kwargs["in_excel"])[1].upper() == ".XLSX"

    # using the old 31 field types
    if use31Types:
      if isXlsx:
        excelInfo = ExcelAnalyzeX31.excel_analyze(**kwargs)
      else:
        excelInfo = ExcelAnalyze31.excel_analyze(**kwargs)

    # using new field types
    else:
      if isXlsx:
        excelInfo = ExcelAnalyzeX.excel_analyze(**kwargs)
      else:
        excelInfo = ExcelAnalyze.excel_analyze(**kwargs)

    arcpy.SetParameterAsText(3, excelInfo)
