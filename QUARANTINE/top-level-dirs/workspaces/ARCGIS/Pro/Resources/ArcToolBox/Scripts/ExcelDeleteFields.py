"""
Tool name: Excel Delete Fields
Source: ExcelDeleteFields.py
Author: ESRI

Delete fields from a sheet in an Excel file.

"""

import os
import arcpy
import openpyxl
import xlrd
import xlwt


def open_excel_table(excel_file, sheet_name):
    """ Open the excel file, return sheet and workbook. """

    try:
        workbook = openpyxl.load_workbook(excel_file)
        worksheet = workbook[sheet_name]
        return worksheet, workbook

    except Exception as err:
        arcpy.AddError(err)
        raise

def excel_delete_fields_XLSX(excel_file, sheet_name, fields_to_delete):
    # get the sheet
    sheet, workbook = open_excel_table(excel_file, sheet_name)

    fields_to_delete_list = fields_to_delete.split(',')

    # Get the header row
    header_row = sheet[1]

    # Find  the column indexes of the fields to delete
    columns_to_delete = []
    for cell in header_row:
        if cell.value in fields_to_delete_list:
            columns_to_delete.append(cell.column)

    # Delete the columns
    for column in reversed(columns_to_delete):
        sheet.delete_cols(column)

    # Save the modified workbook
    workbook.save(excel_file)

def create_new_workbook(sheet, sheet_name, columns_to_delete):

    #Creating a new_Workbook to copy the values because XLS doesn't support modifying the sheet
    new_workbook = xlwt.Workbook()
    new_sheet = new_workbook.add_sheet(sheet_name)

    # Copy the columns excluding the columns_to_delete list
    for row_index in range(sheet.nrows):
        new_row = []
        for col_index in range(sheet.ncols):
            if col_index not in columns_to_delete:
                new_row.append(sheet.cell_value(row_index, col_index))
        for col_index, value in enumerate(new_row):
            new_sheet.write(row_index, col_index, value)

    return new_workbook

def excel_delete_fields_XLS(excel_file, sheet_name, fields_to_delete):

    #get the sheet
    try:
        workbook = xlrd.open_workbook(excel_file)
        sheet = workbook[sheet_name]

    except Exception as err:
        arcpy.AddError(err)
        raise

    #Getting the list of all the columns
    column_headers_list = [sheet.cell_value(0, col_index) for col_index in range(sheet.ncols)]

    #Getting the list of columns which are to be deleted
    fields_to_delete_list = fields_to_delete.split(",")

    #Comparing both the lists and saving the matching values to a new list
    columns_to_delete = []
    for index, item in enumerate(column_headers_list):
        if item in fields_to_delete_list:
            columns_to_delete.append(index)
 
    if columns_to_delete:
        new_workbook = create_new_workbook(sheet, sheet_name, columns_to_delete)

        #Deleting the old xls file and creating a new xls file with the same old name
        os.remove(excel_file)
        new_workbook.save(excel_file)

if __name__ == "__main__":
    # Get the parameters from the script tool
    kwargs = {"excel_file": arcpy.GetParameterAsText(0),
              "sheet_name": arcpy.GetParameterAsText(1),
              "fields_to_delete": arcpy.GetParameter(2) }

    isXlsx = os.path.splitext(kwargs["excel_file"])[1].upper() == ".XLSX"

    if isXlsx:
        excel_delete_fields_XLSX(**kwargs)
    else:
        excel_delete_fields_XLS(**kwargs)

    # excel_file = r"F:\FastLocalData\excel\foo.xlsx"
    # sheet_name = "ParcelsFew"
    # fields_to_delete = "toDelete1,toDelete2"
    #
    # excel_delete_fields(excel_file, sheet_name, fields_to_delete)
