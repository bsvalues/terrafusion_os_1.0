"""
Tool name: ExcelToTableServer
Source: ExcelToTableServer.py
Author: ESRI

This function converts an Excel Sheet to a Table.
This function is used by on-premise Portals when publishing an Excel file as a hosted feature service.

"""
import os
import arcpy
import ExcelToTable
import ExcelToTableX
import ExcelToTable31
import ExcelToTableX31



if __name__ == "__main__":
    # Get the parameters from the script tool
    kwargs = {"in_excel": arcpy.GetParameterAsText(0),
              "out_table": arcpy.GetParameterAsText(1),
              "sheet_name": arcpy.GetParameterAsText(2)}
    
    field_type_version = arcpy.GetParameterAsText(3)

    if not field_type_version:
      field_type_version = "V2"

    use31Types = field_type_version == "V1"

    isXlsx = os.path.splitext(kwargs["in_excel"])[1].upper() == ".XLSX"

    # using the old 31 field types
    if use31Types:
      if isXlsx:
        ExcelToTableX31.excel_to_table(**kwargs)
      else:
        ExcelToTable31.excel_to_table(**kwargs)

    # using new field types
    else:
      if isXlsx:
        ExcelToTableX.excel_to_table(**kwargs)
      else:
        ExcelToTable.excel_to_table(**kwargs)
