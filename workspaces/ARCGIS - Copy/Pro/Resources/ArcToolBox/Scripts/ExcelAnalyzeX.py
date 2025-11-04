"""
Tool name: ExcelAnalyze
Source: ExcelAnalyzeX.py
Author: ESRI

This function returns information about an excel file in the *.xlsx format.

The function is used by the Analyze and Publish operations in on-premise Portals.
The function uses the code in the ExcelToTable tool on purpose, so the fields/fieldTypes of both are identical
(analyze's field are the same as those for publish).

For each sheet in the excel file it will return the sheet name, id, and the list of fields.
The result is a json with this syntax:

  { "sheets" : [ <sheet1>, <sheet2>,...]}

where each sheet is an object like the following:

  { "name" : <name>, "id": <id>, "fields": [ {"name": <fname>, "type": <ftype>, "length": <theLength> },  ]}

"""

from ExcelToTableX import gen_out_fields
import openpyxl
import json


def sheet_to_table_schema(workbook, sheet, validate_workspace, eval_count=None):
    #gdbfields = gen_out_fields(workbook, sheet, validate_workspace, True, eval_count, True)
    gdbfields = gen_out_fields(sheet, eval_count=eval_count, check_for_MGRS=True, validate_workspace=validate_workspace)
    fields = []
    for f in gdbfields:
        field = {"name": f.name, "type": f.ftype, "length": f.length, "originalName": f.original_name}
        fields.append(field)
    return fields


def excel_analyze(in_excel, validate_workspace, eval_count=None):
    workbook = openpyxl.load_workbook(in_excel, read_only=True, data_only=True, keep_links=False)

    sheet_infos = []
    idx = 0
    for sheet in workbook.worksheets:
        fields = sheet_to_table_schema(workbook, sheet, validate_workspace, eval_count)
        sheet_info = {"name": sheet.title, "id": idx, "fields": fields}
        sheet_infos.append(sheet_info)
        idx = idx + 1

    sheet_infos_wrapper = {"sheets": sheet_infos}

    result = json.dumps(sheet_infos_wrapper)
    return result